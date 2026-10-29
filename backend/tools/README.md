# elysium-tools

Las herramientas de la sección **Herramientas** del CRM que necesitan un
servidor. Hoy, dos:

- El **descargador de vídeos**. Recibe un enlace de YouTube, TikTok, Instagram,
  X, Facebook, Vimeo, Reddit… (todo lo que soporta
  [yt-dlp](https://github.com/yt-dlp/yt-dlp), más de 1.800 sitios) y entrega el
  fichero en MP4 o el audio en MP3/M4A.
- La **conversión de PDF a Word** del editor de PDF, con
  [pdf2docx](https://github.com/ArtifexSoftware/pdf2docx). El resto del editor
  —ordenar, girar, quitar y unir páginas— no pasa por aquí: ocurre en el
  navegador (`JS/admin-pdf.js`, con pdf.js y pdf-lib en `JS/vendor/`), y el
  documento no sale del ordenador de quien lo edita.

Es un servicio de Cloud Run **aparte** de `elysium-billing`, a propósito:
necesita Python, ffmpeg y Deno en la imagen, gigas de memoria mientras une vídeo
y audio y minutos de CPU por petición. Dentro del servicio del correo y la
agenda, una descarga grande podría dejar sin memoria la instancia que en ese
momento envía la confirmación de una reunión.

## Cómo llega el CRM hasta aquí

```
CRM (/admin) ──► Worker de Cloudflare ──► /api/tools/*  → elysium-tools   (ELYSIUM_TOOLS_ORIGIN)
                                      └─► /api/*        → elysium-billing (ELYSIUM_API_ORIGIN)
```

Mismo origen que el CRM: sin CORS y sin abrir hosts en la CSP. Sin
`ELYSIUM_TOOLS_ORIGIN` en `wrangler.jsonc`, `/api/tools/*` responde 503
`tools_not_configured` y la sección lo dice en vez de fallar.

## El flujo

1. `POST /api/tools/video/inspect` `{ url }` — yt-dlp analiza el enlace
   (`--dump-single-json`). Devuelve título, autor, duración, la miniatura como
   `data:` (Instagram y TikTok no dejan incrustar sus imágenes) y las calidades
   reales del vídeo: `v2160`…`v360`, `best` si la plataforma no dice tamaños,
   `audio-mp3` y `audio-m4a`. Una lista o un carrusel devuelve sus entradas.
2. `POST /api/tools/video/download` `{ url, option, item? }` — descarga y
   cuenta el progreso en NDJSON, una línea por evento: `accepted`, `queued`,
   `stage` (`starting`, `merging`, `extracting`, `finishing`…), `progress`,
   `ping` y, al final, `ready` o `error`.
3. `GET /api/tools/files/:token` — el fichero, como descarga del
   navegador. El token (192 bits) es la única autorización y caduca a los 15
   minutos, la hora que enseña el CRM. Si lo que espera en disco supera
   `TOOLS_STORAGE_BUDGET_MB`, se borra antes lo más antiguo, empezando por lo
   que ya se descargó.

El navegador nunca escribe argumentos de yt-dlp: elige una opción por su
identificador y `video.js` la traduce. Los vídeos salen en MP4 con H.264 y AAC
siempre que la plataforma los tenga —lo que abren QuickTime, Keynote, los
editores y las propias redes—; por encima de 1080p YouTube solo ofrece VP9 o
AV1, y el CRM lo avisa.

Para Word, `POST /api/tools/pdf/convert?name=<nombre>` con el PDF tal cual
en el cuerpo (hasta 30 MB): `pdf_to_docx.py` lo convierte y cuenta el progreso
página a página, en el mismo NDJSON, hasta `ready` con el .docx en
`/api/tools/files/:token`. Avisa con `warning: scanned` si el PDF no tiene
texto (el Word llevará las páginas como imágenes) y rechaza los que piden
contraseña. El PDF se borra en cuanto existe el .docx. Pages no tiene un
formato abierto que se pueda escribir: abre el .docx directamente.

Las piezas: `workspace.js` (carpetas, colas, procesos y la entrega de
ficheros), `video.js` + `video-routes.js` y `pdf-routes.js` + `pdf_to_docx.py`.
Ojo: `*.py` está en el `.gitignore` de la raíz; `pdf_to_docx.py` se añade con
`git add -f`, como las demás herramientas del repositorio.

## Tres reglas que no se ven en el código

1. **`--max-instances 1`.** El fichero espera en el disco de la instancia que lo
   descargó (en Cloud Run, el disco es memoria). Con dos instancias, el
   `GET /files/:token` podría llegar a la que no lo tiene y responder 410.
2. **La descarga ocurre dentro de la petición.** Cloud Run solo da CPU mientras
   hay una petición abierta; por eso `/download` se mantiene abierta contando el
   progreso. Si el CRM cierra la conexión (cancelar, cerrar la pestaña), el
   servicio mata yt-dlp y su ffmpeg y borra la carpeta.
3. **No sale a la red interna.** Se rechazan IP privadas, `localhost`, nombres
   sin dominio y nombres que resuelven a una dirección privada (el servidor de
   metadatos de Google incluido). Además solo atiende a administradores, y corre
   con una cuenta de servicio propia sin más permiso que leer usuarios de
   Firebase Auth: ffmpeg procesa vídeos de Internet, y no conviene que lo haga
   con la cuenta por defecto, que es editora del proyecto entero.

## Despliegue

Una vez, la cuenta de servicio:

```bash
gcloud iam service-accounts create elysium-tools --project elysiumdr-eu --display-name "Elysium Tools"
gcloud projects add-iam-policy-binding elysiumdr-eu \
  --member serviceAccount:elysium-tools@elysiumdr-eu.iam.gserviceaccount.com \
  --role roles/firebaseauth.viewer
```

`roles/firebaseauth.viewer` es lo que necesita `verifyIdToken(token, true)` para
comprobar que la sesión no se ha revocado.

Cada despliegue (desde la raíz del repositorio):

```bash
gcloud run deploy elysium-tools --source backend/tools --region europe-west1 --project elysiumdr-eu \
  --service-account elysium-tools@elysiumdr-eu.iam.gserviceaccount.com \
  --allow-unauthenticated --execution-environment gen2 \
  --memory 4Gi --cpu 2 --concurrency 16 --max-instances 1 --timeout 3600
```

`--allow-unauthenticated` porque quien llama es el Worker; la autorización la
hace el servicio con el token de Firebase. Después, la URL del servicio va en
`ELYSIUM_TOOLS_ORIGIN` de `wrangler.jsonc` y se publica el sitio.

**Actualizar yt-dlp es volver a desplegar.** La imagen instala siempre la
última versión. Cuando una plataforma deja de funcionar, lo primero es esto; la
versión instalada se ve en el pie del descargador.

## Variables

Todas opcionales.

| Variable | Para qué |
|---|---|
| `ADMIN_EMAILS` | Correos administradores, como en `elysium-billing`. Por defecto, `daniel.morales@elysiumdr.eu`. |
| `TOOLS_MAX_FILE_MB` | Tamaño máximo de un fichero, en MB decimales (como los enseña el CRM). 1000 por defecto. |
| `TOOLS_MAX_ACTIVE_DOWNLOADS` | Descargas a la vez; el resto espera en cola. 2 por defecto. |
| `TOOLS_STORAGE_BUDGET_MB` | Lo que puede esperar en disco a que el navegador lo recoja. 1500 por defecto. |
| `YTDLP_COOKIES_FILE` | Ruta de un `cookies.txt` (formato Netscape). Ver abajo. |
| `YTDLP_PROXY` | Proxy para yt-dlp, p. ej. uno residencial si YouTube bloquea la IP de Google. |
| `YTDLP_JS_RUNTIMES` | Motor de JavaScript para YouTube. En la imagen, Deno; en local, `node`. |
| `PDF_PYTHON` | El Python que tiene pdf2docx. En la imagen, `/opt/pdf/bin/python`. |
| `TOOLS_MAX_PDF_MB` | Tamaño máximo de un PDF para convertir. 30 por defecto (Cloud Run no acepta cuerpos de más de 32 MiB). |

Con 4 GiB de memoria, dos descargas de 1 GB uniendo vídeo y audio a la vez
rozan el límite. Si se suben los máximos, súbase también `--memory`.

## Cuando una plataforma pide sesión

Desde la IP de un centro de datos, YouTube a veces pide «confirmar que no es un
bot», e Instagram o Vimeo piden iniciar sesión para algunos enlaces. El CRM lo
dice con su código (`bot_check`, `login_required`). Hay dos salidas:

- **Cookies** de una cuenta **secundaria** (nunca la personal: la plataforma
  puede bloquearla). Exportarlas en formato Netscape desde una ventana privada
  y cerrarla después, y guardarlas como secreto:

  ```bash
  gcloud secrets create elysium-tools-cookies --project elysiumdr-eu --data-file cookies.txt
  gcloud secrets add-iam-policy-binding elysium-tools-cookies --project elysiumdr-eu \
    --member serviceAccount:elysium-tools@elysiumdr-eu.iam.gserviceaccount.com \
    --role roles/secretmanager.secretAccessor
  gcloud run services update elysium-tools --region europe-west1 --project elysiumdr-eu \
    --set-secrets /secrets/cookies.txt=elysium-tools-cookies:latest \
    --update-env-vars YTDLP_COOKIES_FILE=/secrets/cookies.txt
  ```

  El secreto se monta de solo lectura; el servicio hace una copia por descarga
  porque yt-dlp reescribe el fichero al terminar.
- **Proxy** residencial en `YTDLP_PROXY`, si lo que bloquean es la IP.

## Pruebas

```bash
cd backend/tools && node --test
```

`server.test.js` recorre el flujo HTTP entero contra `test-fixtures/fake-yt-dlp.js`,
un yt-dlp de mentira que escribe lo mismo que el de verdad con las plantillas de
`video.js`, sin red. Para probar con el de verdad en local:

```bash
python3 -m venv /tmp/yt && /tmp/yt/bin/pip install "yt-dlp[default,curl-cffi]"
YTDLP_BIN=/tmp/yt/bin/yt-dlp YTDLP_JS_RUNTIMES=node PORT=8090 node backend/tools/server.js
```

(arranca con credenciales de Google por defecto: `gcloud auth application-default login`).

Y la conversión a Word, con su propio entorno:

```bash
python3 -m venv /tmp/pdf && /tmp/pdf/bin/pip install pdf2docx "pymupdf<2"
PDF_PYTHON=/tmp/pdf/bin/python PORT=8090 node backend/tools/server.js
```

## Licencias

pdf2docx es MIT. PyMuPDF, del que depende, es **AGPL-3.0** (o licencia
comercial de Artifex): aquí se usa sin modificar, en un servicio interno que
solo atiende a los administradores del CRM. Si algún día la conversión se ofrece
a clientes o al público, hay que revisar esa licencia antes. Se fija por debajo
de la 2.0, que arrastra onnxruntime y modelos de maquetación que pdf2docx no usa.
pdf.js (Apache-2.0) y pdf-lib (MIT) van en `JS/vendor/` con su licencia al lado.
