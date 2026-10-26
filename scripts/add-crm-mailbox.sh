#!/usr/bin/env bash
# Da de alta un buzón de IONOS como remitente de la sección Correo del CRM.
#
#   scripts/add-crm-mailbox.sh daniel.avila@elysiumdr.eu "Daniel Ávila"
#   scripts/add-crm-mailbox.sh social.media@elysiumdr.eu "Elysium Social Media"
#
# Pide la contraseña del buzón sin mostrarla, así que no queda ni en pantalla ni
# en el historial de la terminal. Después:
#   1. comprueba contra IONOS que el buzón autentica (no envía nada);
#   2. la guarda en Secret Manager como `elysium-smtp-password-<buzón>`, o le
#      añade una versión nueva si ya existía;
#   3. da acceso a ese secreto a la cuenta de servicio de Cloud Run;
#   4. añade el buzón a CRM_MAIL_SENDERS (o le cambia el nombre si ya estaba) y
#      enlaza SMTP_USER_<SUFIJO> y SMTP_PASSWORD_<SUFIJO>, que es lo que lee
#      `mailSenders()` en backend/platform-server.js.
#
# El paso 4 crea una revisión nueva de elysium-billing con la misma imagen: no
# despliega código. Volver a ejecutarlo con el mismo buzón cambia su contraseña.
set -euo pipefail

PROJECT=elysiumdr-eu
REGION=europe-west1
SERVICE=elysium-billing
SMTP_HOST=smtp.ionos.es
SMTP_PORT=587

usage="Uso: $0 buzón@elysiumdr.eu \"Nombre visible\""
address=$(printf '%s' "${1:?$usage}" | tr '[:upper:]' '[:lower:]')
name=${2:?$usage}
case "$address" in
  *@*.*) ;;
  *) echo "«$address» no es una dirección de correo." >&2; exit 1 ;;
esac
case "$name" in
  *[,\<\>\|]*) echo "El nombre no puede llevar comas, «<», «>» ni «|»." >&2; exit 1 ;;
esac

repo=$(cd "$(dirname "$0")/.." && pwd)
nodemailer="$repo/backend/node_modules/nodemailer"
[ -d "$nodemailer" ] || { echo "Falta nodemailer: ejecute «npm install» en backend/." >&2; exit 1; }

# El sufijo es el mismo que calcula senderEnvSuffix() en el backend:
# daniel.avila@… → DANIEL_AVILA.
local_part=${address%@*}
suffix=$(printf '%s' "$local_part" | tr '[:lower:]' '[:upper:]' | sed 's/[^A-Z0-9][^A-Z0-9]*/_/g')
secret="elysium-smtp-password-$(printf '%s' "$local_part" | sed 's/[^a-z0-9][^a-z0-9]*/-/g')"

read -rsp "Contraseña de $address: " password
echo
[ -n "$password" ] || { echo "Contraseña vacía." >&2; exit 1; }

echo "Comprobando el acceso en $SMTP_HOST…"
SMTP_CHECK_USER="$address" SMTP_CHECK_PASS="$password" SMTP_CHECK_HOST="$SMTP_HOST" SMTP_CHECK_PORT="$SMTP_PORT" \
  node -e '
    const nodemailer = require(process.argv[1]);
    const port = Number(process.env.SMTP_CHECK_PORT);
    nodemailer.createTransport({
      host: process.env.SMTP_CHECK_HOST, port, secure: port === 465, requireTLS: port !== 465,
      auth: { user: process.env.SMTP_CHECK_USER, pass: process.env.SMTP_CHECK_PASS }
    }).verify().then(
      () => process.exit(0),
      error => { console.error(`IONOS rechaza el acceso: ${error.response || error.message}`); process.exit(1); });
  ' "$nodemailer"

# printf es interno de bash: la contraseña no aparece en la lista de procesos.
if gcloud secrets describe "$secret" --project "$PROJECT" >/dev/null 2>&1; then
  printf '%s' "$password" | gcloud secrets versions add "$secret" --project "$PROJECT" --data-file=- >/dev/null
  echo "Secreto $secret: versión nueva."
else
  printf '%s' "$password" | gcloud secrets create "$secret" --project "$PROJECT" \
    --replication-policy=automatic --data-file=- >/dev/null
  echo "Secreto $secret: creado."
fi
unset password

description=$(gcloud run services describe "$SERVICE" --region "$REGION" --project "$PROJECT" --format=json)
account=$(printf '%s' "$description" | node -e '
  let raw = ""; process.stdin.on("data", chunk => raw += chunk).on("end", () => {
    process.stdout.write(JSON.parse(raw).spec.template.spec.serviceAccountName || "");
  });')
[ -n "$account" ] || { echo "No se pudo leer la cuenta de servicio de $SERVICE." >&2; exit 1; }
gcloud secrets add-iam-policy-binding "$secret" --project "$PROJECT" \
  --member="serviceAccount:$account" --role=roles/secretmanager.secretAccessor >/dev/null
echo "Acceso al secreto: $account."

# La lista nueva parte de la que tiene el servicio; si aún no tuviera, del
# remitente de la agenda, que es lo que el backend usa en su lugar.
senders=$(printf '%s' "$description" | ADDRESS="$address" NAME="$name" node -e '
  let raw = ""; process.stdin.on("data", chunk => raw += chunk).on("end", () => {
    const env = JSON.parse(raw).spec.template.spec.containers[0].env || [];
    const value = key => env.find(item => item.name === key)?.value || "";
    const entries = (value("CRM_MAIL_SENDERS") || value("MEETING_FROM_EMAIL"))
      .split(",").map(entry => entry.trim()).filter(Boolean);
    const mine = `${process.env.NAME} <${process.env.ADDRESS}>`;
    const index = entries.findIndex(entry => entry.toLowerCase().includes(`<${process.env.ADDRESS}>`));
    if (index >= 0) entries[index] = mine; else entries.push(mine);
    process.stdout.write(entries.join(","));
  });')

echo "Actualizando $SERVICE…"
gcloud run services update "$SERVICE" --region "$REGION" --project "$PROJECT" --quiet \
  --update-env-vars "^|^CRM_MAIL_SENDERS=$senders|SMTP_USER_$suffix=$address" \
  --update-secrets "SMTP_PASSWORD_$suffix=$secret:latest"

echo
echo "Listo. Remitentes del CRM: $senders"
echo "Recargue la sección Correo para verlo."
