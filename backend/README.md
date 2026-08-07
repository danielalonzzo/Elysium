# elysium-platform

Servicio de confianza de Elysium. Hace dos cosas que un navegador no puede hacer
por sí solo:

1. **Agenda de reuniones.** Crea y cancela reuniones, y envía por SMTP desde el
   buzón de la empresa la confirmación al cliente, el aviso al administrador y la
   invitación de calendario (`.ics`).
2. **Recuperación de contraseña.** Genera el enlace con el Admin SDK de Firebase
   y lo envía con la marca de Elysium, con respuestas neutras y limitación de
   intentos para no revelar si una cuenta existe.

Aquí **no se cobra**. Las suscripciones y sus licencias las asigna el
administrador desde el CRM y viven en Firestore (`members.subscription`,
`licenses`, `subscription_payments`). Hubo una integración con Stripe —checkout,
portal de facturación y webhook firmado— y se retiró por completo.

## Despliegue

Corre en Cloud Run, en `europe-west1`, como el servicio `elysium-billing` (el
nombre es anterior al cambio de alcance; renombrarlo cambiaría la URL a la que
apunta el Worker). El sitio lo alcanza en `/api/*`: el Worker de Cloudflare
reenvía esa ruta al servicio, así que no hay CORS ni un segundo host que abrir en
la CSP.

```bash
gcloud run deploy elysium-billing --source backend --region europe-west1 --project elysiumdr-eu
```

Sin flags de entorno conserva las variables que ya tiene. **No uses
`--set-env-vars`**: borra las que no menciones.

## Variables

Ver `.env.example`. Las que no tienen valor por defecto sensato:

| Variable | Para qué |
|---|---|
| `SMTP_HOST` / `SMTP_PORT` | Servidor de IONOS. 465 abre TLS directo, 587 sube con STARTTLS. |
| `SMTP_USER` / `SMTP_PASSWORD` | Buzón de la empresa. La contraseña va en Secret Manager, nunca como variable en claro. |
| `MEETING_FROM_EMAIL` | Remitente. Debe ser el buzón autenticado o un alias suyo: IONOS rechaza enviar como una dirección ajena. |
| `PASSWORD_RESET_FROM_EMAIL` | Remitente del correo de contraseña. Si falta, usa el anterior. Mismo límite de propiedad. |
| `ADMIN_NOTIFICATION_EMAIL` | Dónde llega tu copia de cada reunión. Si falta, la primera de `ADMIN_EMAILS`. |
| `PUBLIC_BASE_URL` | Origen que se escribe dentro de los enlaces de los correos. |

`ADMIN_EMAILS` y `ALLOWED_ORIGINS` tienen valores por defecto en el código.

`SMTP_PASSWORD` es la contraseña de un buzón real: va en Secret Manager, no como
variable en claro. Las demás pueden quedarse como variables normales.

## Quién es administrador

`isFirebaseAdmin()` acepta, por este orden:

- el custom claim `admin: true` — la vía buena, se pone con
  `node scripts/set-admin-claim.mjs <email>`;
- un `role` de `admin`, `root` o `super_admin`;
- estar en `ADMIN_EMAILS`, que es el resto de la migración desde el correo
  codificado a mano.

Siempre exige `email_verified`.

## Correo de reuniones

El correo sale por SMTP desde el buzón de la empresa en IONOS. Nada de
proveedores externos: el cliente recibe el mensaje desde la misma dirección a la
que puede responder.

`POST /api/meetings` crea la reunión y llama a `dispatchMeetingEmail()`, que
reserva el envío con un *lease*, manda al cliente y al administrador dos correos
distintos —no una copia oculta, porque el texto del interno es otro— y marca el
resultado en `notifications.confirmation`. La respuesta lleva `emailStatus` real
(`sent`, `failed`, `not_configured`…), no un `pending` fijo.

Un fallo de correo nunca convierte en error una reunión ya guardada. Contra el
envío doble hay dos capas: la reserva transaccional del *claim*, que impide que
dos intentos simultáneos manden lo mismo, y un `Message-ID` determinista
derivado de esa clave, para que un reenvío llegue con la identidad del original
en vez de como mensaje nuevo.

`POST /api/meetings/:id/cancel` hace lo mismo con la cancelación.

## Antes de desplegar

```bash
npm run check && npm test
```
