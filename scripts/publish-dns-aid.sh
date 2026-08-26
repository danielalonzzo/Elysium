#!/usr/bin/env bash
#
# Publica los registros DNS-AID (`_index._agents`) en las tres zonas de Elysium.
#
# Es la única pieza del descubrimiento por agentes que NO viaja en el push: los
# registros viven en la zona DNS de Cloudflare, no en el repositorio, así que un
# despliegue no los crea ni los repara. El porqué de cada decisión —y las
# trampas de la RFC 9460— están en «scripts/dns-aid.md»; este script es solo la
# forma de aplicarlo sin copiar tres veces a mano el mismo valor en el panel.
#
# Hace falta un token de API con **Zone.DNS Edit** sobre las tres zonas. El de
# `wrangler` NO vale: solo trae `zone (read)`, y la creación devuelve 403.
# Se saca en Cloudflare → My Profile → API Tokens → Create Token → «Edit zone
# DNS», y se le añaden las tres zonas en «Zone Resources».
#
# Uso:
#   CF_DNS_TOKEN=… ./scripts/publish-dns-aid.sh          # crea o corrige
#   ./scripts/publish-dns-aid.sh --check                 # solo comprueba, sin token
#
# `--check` es deliberadamente estricto: no basta con que exista un TYPE64.
# Comprueba el RDATA exacto y exige AD=true, que demuestra que el resolutor ha
# validado la cadena DNSSEC hasta la zona padre.
#
set -euo pipefail

ZONES=(elysiumdr.eu elysiumdr.es elysiumdr.pt)
TTL=3600

# El valor es idéntico en las tres zonas salvo el destino, que es el ápice de
# cada una. Se construye por zona, no como constante, para que no se cuele el
# destino europeo en la zona portuguesa.
#
# Tres cosas que no se pueden tocar sin releer «dns-aid.md»:
#   · `mandatory` lleva SOLO `alpn,port`. Bajo la RFC 9460 un cliente que no
#     entienda una clave listada ahí tiene que ignorar el registro entero, así
#     que meter una clave experimental lo haría invisible justo para quien viene
#     a leerlo.
#   · Prioridad 1, no 0. Con 0 el registro es AliasMode y los parámetros se
#     ignoran; DNS-AID pide ServiceMode.
#   · `alpn="h2"` y nada más. `mcp` y `a2a` siguen sin registro en IANA:
#     anunciarlos sería decir que Cloudflare los negocia en TLS, y no lo hace.
svcb_value() { printf 'alpn="h2" port=443 mandatory=alpn,port'; }

API=https://api.cloudflare.com/client/v4
CHECK_ONLY=0
[[ "${1:-}" == "--check" ]] && CHECK_ONLY=1

# ── Comprobación por DNS-over-HTTPS ───────────────────────────────────────────
#
# Se mira por DoH y no por el resolutor del sistema porque es así como lo mira
# quien comprueba desde fuera (el escáner de isitagentready usa
# `cloudflare-dns.com`). Y se pregunta por `type=64`: el `dig` de algunos macOS
# todavía no reconoce el mnemónico `SVCB`, pero el número es el mismo.
validate_doh_answer() {
  local name="$1" zone="$2" body="$3"
  printf '%s' "$body" | python3 -c '
import json
import shlex
import sys

owner = sys.argv[1].rstrip(".").lower()
target = sys.argv[2].rstrip(".").lower()

try:
    document = json.load(sys.stdin)
except (json.JSONDecodeError, UnicodeDecodeError) as error:
    print(f"respuesta DoH no es JSON válido: {error}")
    raise SystemExit

status = document.get("Status")
if status != 0:
    print(f"sin respuesta (Status={status!s})")
    raise SystemExit

answers = [
    answer for answer in document.get("Answer", [])
    if answer.get("type") == 64
    and str(answer.get("name", "")).rstrip(".").lower() == owner
]
if not answers:
    print("sin respuesta SVCB para el propietario exacto")
    raise SystemExit

aliases = {"key0": "mandatory", "key1": "alpn", "key3": "port"}
expected_keys = {"mandatory", "alpn", "port"}
found = False
actual = []
for answer in answers:
    rdata = str(answer.get("data", ""))
    actual.append(rdata)
    try:
        fields = shlex.split(rdata)
    except ValueError:
        continue
    if len(fields) < 2 or fields[0] != "1" or fields[1].rstrip(".").lower() != target:
        continue

    params = {}
    malformed = False
    for field in fields[2:]:
        if "=" not in field:
            malformed = True
            break
        key, value = field.split("=", 1)
        params[aliases.get(key.lower(), key.lower())] = value
    if malformed or set(params) != expected_keys:
        continue

    mandatory = {
        aliases.get(key.strip().lower(), key.strip().lower())
        for key in params["mandatory"].split(",")
    }
    if mandatory == {"alpn", "port"} and params["alpn"] == "h2" and params["port"] == "443":
        found = True
        break

if not found:
    print("RDATA inesperado: " + " | ".join(actual))
    raise SystemExit

if document.get("AD") is not True:
    print("registro correcto, pero DNSSEC no está autenticado (AD=false)")
    raise SystemExit

print("ok")
' "$name" "$zone"
}

verify() {
  local ok=0
  for zone in "${ZONES[@]}"; do
    local name="_index._agents.${zone}"
    local body validation
    body=$(curl -sS -H 'accept: application/dns-json' \
      "https://cloudflare-dns.com/dns-query?name=${name}&type=64&do=1")
    validation=$(validate_doh_answer "$name" "$zone" "$body")
    if [[ "$validation" == "ok" ]]; then
      printf '  ✓ %-28s RDATA correcto y DNSSEC autenticado (AD=true)\n' "$name"
    else
      printf '  ✗ %-28s %s\n' "$name" "$validation"
      ok=1
    fi
  done
  return $ok
}

if (( CHECK_ONLY )); then
  echo "Comprobando los registros DNS-AID publicados:"
  verify
  exit $?
fi

: "${CF_DNS_TOKEN:?Falta CF_DNS_TOKEN (token con Zone.DNS Edit sobre las tres zonas)}"

cf() { curl -sS -H "Authorization: Bearer $CF_DNS_TOKEN" -H 'Content-Type: application/json' "$@"; }

# `success:false` con `errors` es un 200 en Cloudflare: sin mirar el cuerpo, un
# 403 por token corto pasaría por éxito.
assert_ok() {
  local body="$1" what="$2"
  if ! printf '%s' "$body" | grep -q '"success":true'; then
    echo "✗ $what falló:" >&2
    printf '%s\n' "$body" | sed 's/^/    /' >&2
    exit 1
  fi
}

for zone in "${ZONES[@]}"; do
  name="_index._agents.${zone}"
  value="$(svcb_value)"
  echo "── ${zone}"

  zone_body=$(cf "$API/zones?name=${zone}")
  assert_ok "$zone_body" "buscar la zona ${zone}"
  zone_id=$(printf '%s' "$zone_body" | sed -n 's/.*"result":\[{"id":"\([0-9a-f]*\)".*/\1/p')
  [[ -n "$zone_id" ]] || { echo "✗ La cuenta del token no ve la zona ${zone}." >&2; exit 1; }

  # Se lista antes de crear: un POST sobre un RRset que ya existe deja dos
  # registros SVCB en el mismo nombre, y el resolutor devolvería los dos.
  existing_body=$(cf "$API/zones/${zone_id}/dns_records?type=SVCB&name=${name}")
  assert_ok "$existing_body" "listar ${name}"
  record_id=$(printf '%s' "$existing_body" | sed -n 's/.*"result":\[{"id":"\([0-9a-f]*\)".*/\1/p')

  # Cloudflare acepta el RDATA de un SVCB de dos maneras según la versión de la
  # API: como cadena en `content` o descompuesto en `data`. Se intenta la
  # primera y se reintenta con la segunda en vez de adivinar cuál atiende hoy.
  payload_content=$(printf '{"type":"SVCB","name":"%s","ttl":%d,"content":"1 %s. %s"}' \
    "$name" "$TTL" "$zone" "${value//\"/\\\"}")
  payload_data=$(printf '{"type":"SVCB","name":"%s","ttl":%d,"data":{"priority":1,"target":"%s.","value":"%s"}}' \
    "$name" "$TTL" "$zone" "${value//\"/\\\"}")

  if [[ -n "$record_id" ]]; then
    url="$API/zones/${zone_id}/dns_records/${record_id}"; method=PUT; what="actualizar ${name}"
  else
    url="$API/zones/${zone_id}/dns_records"; method=POST; what="crear ${name}"
  fi

  body=$(cf -X "$method" "$url" -d "$payload_content")
  if ! printf '%s' "$body" | grep -q '"success":true'; then
    body=$(cf -X "$method" "$url" -d "$payload_data")
  fi
  assert_ok "$body" "$what"
  echo "  ✓ ${what%% *}: ${name} → 1 ${zone}. ${value}"
done

echo
echo "Registros aplicados. La comprobación puede tardar hasta el TTL del SOA si"
echo "un NXDOMAIN anterior sigue en caché:"
echo
verify || true
echo
echo "Este script no activa DNSSEC: se habilita en DNS → Settings → DNSSEC"
echo "(o con la API de DNSSEC de Cloudflare) y el DS hay que darlo de alta en el"
echo "registrador de cada dominio. Los pasos están en scripts/dns-aid.md."
