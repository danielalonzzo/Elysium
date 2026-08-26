# elysium-platform

Servicio de confianza de Elysium. Hace seis cosas:

1. **Agenda de reuniones.** Crea y cancela reuniones, y envía por SMTP desde el
   buzón de la empresa la confirmación al cliente, el aviso al administrador y la
   invitación de calendario (`.ics`).
2. **Recuperación de contraseña.** Genera el enlace con el Admin SDK de Firebase
   y lo envía con la marca de Elysium, con respuestas neutras y limitación de
   intentos para no revelar si una cuenta existe.
3. **Correo profesional del CRM.** Permite elegir únicamente buzones SMTP
   configurados, enviar adjuntos, deduplicar reintentos y mandar al administrador
   un recibo separado de cada correo aceptado.
4. **Consultas de proyecto.** Valida y limita el formulario público antes de
   escribirlo con el Admin SDK; el navegador no tiene escritura directa sobre
   `prospects`.
5. **Archivos privados del CRM.** Autoriza subidas directas a Cloudflare R2,
   comprueba la cuarentena y emite enlaces de descarga breves sin revelar las
   credenciales ni convertir el bucket en público.
6. **Research público.** Proyecta cuadernos y artículos publicados desde
   Firestore mediante GET de solo lectura, sin descargar cuerpos en las listas
   ni exponer los UID de auditoría. El esquema 1:N, Rules, Storage, API y PDF se
   documentan juntos en [`RESEARCH.md`](RESEARCH.md).

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
| `SMTP_USER_<SUFIJO>` / `SMTP_PASSWORD_<SUFIJO>` | Credenciales de cada buzón adicional del CRM; por ejemplo, el sufijo de `daniel.morales@…` es `DANIEL_MORALES`. |
| `MEETING_FROM_EMAIL` | Remitente. Debe ser el buzón autenticado o un alias suyo: IONOS rechaza enviar como una dirección ajena. |
| `PASSWORD_RESET_FROM_EMAIL` | Remitente del correo de contraseña. Si falta, usa el anterior. Mismo límite de propiedad. |
| `CRM_MAIL_SENDERS` | Lista cerrada `Nombre <correo>` de remitentes visibles en el compositor. |
| `ADMIN_NOTIFICATION_EMAIL` | Dónde llega la copia de cada reunión y el recibo de cada correo del CRM. Si falta, la primera de `ADMIN_EMAILS`. |
| `PUBLIC_BASE_URL` | Origen que se escribe dentro de los enlaces de los correos. |
| `R2_ENDPOINT` / `R2_BUCKET` | Endpoint S3 y bucket privado; usa el endpoint `.eu.r2.cloudflarestorage.com` para un bucket con jurisdicción EU. |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Credencial Object Read & Write limitada exclusivamente al bucket del CRM. El secreto va en Secret Manager. |
| `CRM_EMAIL_DOMAINS` / `CRM_FILE_ROLES` | Dominios corporativos y roles (`crmRole`, con compatibilidad `role`) que pueden entrar al gestor de archivos, además de los custom claims. |
| `CRM_FILE_GLOBAL_ROLES` | Roles que pueden operar sobre archivos de cualquier entidad. Los demás necesitan ser owner/assignee/creator o colaborador del registro. |
| `CRM_FIREBASE_PROJECT_ID` | Debe ser `elysiumdr-eu` (o quedar vacío para usar el default). Mantiene Auth, Firestore y los ID tokens en el mismo proyecto real. |

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

## Archivos privados en R2

`POST /api/files/upload-intents` valida al usuario, la entidad relacionada, el
MIME declarado y el tamaño antes de firmar un PUT de cinco minutos a
`_quarantine/`. El navegador manda el archivo directamente a R2 y después llama
a `POST /api/files/upload-intents/:id/complete`. Ese segundo paso compara el
tamaño y `Content-Type` reales, inspecciona los *magic bytes* y copia el objeto a
su clave definitiva antes de registrarlo como `ready`.

El PUT firma también el `Content-Length` calculado por el navegador y desactiva
el checksum automático de cuerpo vacío del SDK. La autorización se vuelve a
evaluar por entidad al completar y al descargar; `manager` y `operations`
tienen alcance global por defecto, mientras los demás roles requieren ownership
o colaboración explícita. Los registros `files` y `activities` se escriben con
`tenantId: elysiumdr-eu`; las actividades llevan tanto `occurredAt` como el
campo legacy `createdAt`.

Los propósitos ligados a contactos resuelven primero `contacts/{id}`. Durante
la migración, si no existe, también aceptan el mismo ID en `members` o
`prospects`, pero sólo para administración o los roles globales configurados.
La clave final continúa bajo `crm/elysiumdr-eu/contacts/...`, y el intent fija
la colección que autorizó la operación para revalidarla al completar, descargar
y borrar.

La inspección de tipo es deliberadamente *fail closed*, pero no sustituye un
antivirus. Los documentos se entregan como adjuntos; antes de ampliar la lista
de formatos o abrirlos inline hay que incorporar escaneo antimalware. Configura
en R2 una regla lifecycle que elimine `_quarantine/` al día siguiente, CORS PUT
sólo para los orígenes de Elysium y mantén desactivados `r2.dev` y cualquier
dominio público del bucket.

## Antes de desplegar

Las reglas CRM están fusionadas con el portal en los archivos de la raíz. No
despliegues las reglas del prototipo: sustituirían el acceso legacy de
`members`, `contacts`, `activities` y Firebase Storage. Antes de publicar
índices sobre una base que ya tenga índices creados desde consola, exporta y
fusiona también esos índices para que Firebase CLI no proponga eliminarlos.

```bash
firebase deploy --project elysiumdr-eu --only firestore:rules,firestore:indexes
```

El frontend integrado usa `/api/*` bajo el mismo origen; en producción el
Worker de `worker/index.js` reenvía esa ruta a Cloud Run. En desarrollo hay que
levantar este servicio en `localhost:4242` y definir
`VITE_PLATFORM_API_URL=http://localhost:4242`.

```bash
npm run check && npm test
```

## Índices de Firestore

`firestore.indexes.json` contiene **solo** los índices compuestos que alguna
consulta usa de verdad. Un índice compuesto no es gratis: se reescribe en cada
`create`/`update` de la colección, tenga o no quien lo lea.

| Índice | Lo pide |
|---|---|
| `users` tenantId + status | `loadCrmUsers()` en `JS/admin.js` |
| `files` tenantId + status + entityId | `loadContactDrawerData()` en `JS/admin.js` |
| `meetings` userId + startAt | `GET /api/meetings?userId=` |
| `meetings` status + startAt | `POST /api/meetings/reminders/run` |

Las consultas de un solo campo —`contacts` sin filtros, `opportunities` por
`tenantId`, `activities` por `contactId` o `memberId`, `meetings` por rango de
`startAt`— las resuelve el índice automático de campo único y **no** van aquí.

Una versión anterior declaraba índices de `contacts`, `activities` y
`opportunities` que ninguna consulta pedía: describían un diseño tenant-aware
paginado que el CRM nunca llegó a implementar. Antes de añadir uno, comprobar
que la consulta existe en `JS/admin.js` o en `backend/`, no que podría existir.
