# Contrato de datos de Research

Research usa Firestore como API editorial y conserva una representación HTTP
pública de solo lectura en el servicio ya desplegado. No hay un segundo CMS ni
una colección plana de publicaciones.

## Relación 1:N

```text
research_notebooks/{notebookId}
└── articles/{articleId}
```

`notebookId` y `articleId` son auto-ID opacos. El campo `slug` es la identidad
de URL estable: el CRM comprueba que sea único por idioma entre cuadernos y,
para artículos, dentro del cuaderno. Firestore Rules no puede garantizar una
restricción de unicidad entre documentos; la API devuelve `409
research_slug_conflict` si detecta una colisión en vez de escoger un documento
arbitrariamente.

Los tres cuadernos iniciales los crea el CRM de forma idempotente cuando un
administrador abre Research por primera vez:

| `slug` e ID determinista | Título | `order` |
|---|---|---:|
| `investigacion-inteligencia-artificial` | Investigación en Inteligencia Artificial | 10 |
| `linguistica-aplicada` | Lingüística Aplicada | 20 |
| `novedades-informatica` | Novedades en la Informática | 30 |

El bootstrap consulta tanto el ID como `slug + locale` antes de crear; no debe
haber otro seed automático en backend.

## Forma canónica

Todos los campos indicados son obligatorios. Los opcionales visuales se guardan
como string vacío para mantener una forma estable y las fechas se escriben con
`serverTimestamp()`.

### `research_notebooks/{notebookId}`

| Campo | Tipo / límite | Notas |
|---|---|---|
| `schemaVersion` | `1` | Permite migraciones futuras. |
| `slug` | string, 1–120 | Minúsculas ASCII y guiones; inmutable al actualizar. |
| `title` | string, 1–180 | Sin controles ASCII. |
| `description` | string, 0–2000 | Texto de tarjeta. |
| `coverUrl` | string, 0–2048 | HTTPS, ruta absoluta del sitio o vacío. |
| `coverPath` | string, 0–512 | Vacío o `research/notebooks/{notebookId}/cover/{file}`. |
| `coverAlt` | string, 0–240 | Texto alternativo. |
| `status` | enum | `draft`, `published`, `archived`. |
| `visibility` | enum | `public`, `unlisted`. `unlisted` sólo es visible al administrador. |
| `locale` | enum | `en`, `es`, `pt`; inmutable al actualizar. |
| `order` | int, 0–1 000 000 | La UI ordena en memoria para no exigir un índice compuesto. |
| `publishedAt` | timestamp/null | Timestamp en `published`; null en `draft`; se conserva al editar publicado. |
| `createdAt`, `updatedAt` | timestamp | Reloj del servidor. |
| `createdBy`, `updatedBy` | UID | Auditoría del administrador autenticado. |

### `research_notebooks/{notebookId}/articles/{articleId}`

Repite `schemaVersion`, `slug`, portada, estado, visibilidad, idioma, orden,
fechas y auditoría, y añade:

| Campo | Tipo / límite | Notas |
|---|---|---|
| `notebookId` | string | Debe coincidir con el padre y no cambia. |
| `title` | string, 1–220 | Título de publicación. |
| `author` | string, 1–180 | Firma mostrada en tarjeta/lectura. |
| `excerpt` | string, 0–600 | Resumen para la grilla. |
| `contentHtml` | string | Exportación HTML limpia del editor. |
| `contentMarkdown` | string | Exportación Markdown equivalente. |

`contentHtml` y `contentMarkdown` suman como máximo 750 000 caracteres para
dejar margen frente al límite de 1 MiB de Firestore. Ambos deben contener texto
al publicar. Rules valida forma y tamaño, no puede sanear HTML: el editor debe
aplicar una allow-list y el lector debe volver a sanear antes de usar
`innerHTML`. La allow-list funcional incluye encabezados, párrafos, listas,
citas, `pre/code`, énfasis y enlaces seguros; no incluye scripts, handlers
`on*`, iframes ni URLs `javascript:`.

## Autorización y ciclo editorial

- Una lectura anónima de cuaderno sólo pasa con `status == "published"` y
  `visibility == "public"`.
- Un artículo anónimo exige lo mismo en el artículo **y en su cuaderno padre**,
  y que ambos tengan el mismo `locale`.
- Crear, editar o borrar requiere el super-admin o un administrador verificado
  del tenant `elysiumdr-eu`. Las reglas además validan el esquema cerrado y la
  auditoría.
- Publicar desde borrador pone `status: "published"`, `visibility: "public"`,
  `publishedAt: serverTimestamp()`, `updatedAt: serverTimestamp()` y
  `updatedBy: auth.currentUser.uid` en una misma escritura.
- Archivar conserva opcionalmente `publishedAt`; volver a borrador lo pone a
  null. Al republicar comienza un nuevo ciclo y se estampa la fecha actual.
- Borrar un documento padre no borra sus subcolecciones. El CRM debe eliminar o
  archivar primero los artículos; la opción segura por defecto es archivar.

Firestore no filtra resultados por Rules. Las consultas públicas directas deben
llevar siempre:

```js
where('status', '==', 'published')
where('visibility', '==', 'public')
where('locale', '==', locale)
```

El CRM puede listar sin esos filtros porque su sesión es administrativa. Las
escrituras editoriales continúan usando el SDK de Firestore: no hay POST/PATCH
HTTP duplicados que puedan saltarse la validación de `firestore.rules`.

## API HTTP pública

El Worker ya reenvía `/api/*` a `backend/platform-server.js`; estas rutas son
reales, públicas y de solo lectura. `locale` es `en` por defecto.

| Ruta | Respuesta |
|---|---|
| `GET /api/research/notebooks?locale=es` | `{ items, count, locale }` |
| `GET /api/research/notebooks/{notebookSlug}?locale=es` | `{ notebook }` |
| `GET /api/research/notebooks/{notebookSlug}/articles?locale=es` | `{ notebook, items, count, locale }` |
| `GET /api/research/notebooks/{notebookSlug}/articles/{articleSlug}?locale=es` | `{ notebook, article }` |

Las listas proyectan sólo datos de tarjeta; la lista de artículos no descarga
los cuerpos. El detalle añade `contentHtml` y `contentMarkdown`. La proyección
HTTP no expone `createdBy` ni `updatedBy`. Respuestas correctas se cachean 60 s
en navegador y 300 s en edge; errores no se cachean. El contrato completo está
en `/openapi.json`.

## Portadas en Firebase Storage

```text
research/notebooks/{notebookId}/cover/{timestamp}_{safeName}
research/notebooks/{notebookId}/articles/{articleId}/cover/{timestamp}_{safeName}
```

Se aceptan JPEG, PNG y WebP de hasta 5 MiB, con nombres compuestos sólo por
letras, números, punto, guion y guion bajo. La segunda ruta queda preparada para
portadas de artículo aunque la primera versión del CRM use URL externa. Storage
consulta Firestore antes de una lectura anónima y exige que el recurso asociado
esté publicado/público; los borradores sólo los lee o escribe administración.

## Índices

Las consultas actuales combinan sólo igualdades y ordenan el resultado pequeño
en memoria, por lo que Firestore puede fusionar índices de campo único y no se
declara un compuesto especulativo. `contentHtml` y `contentMarkdown` tienen el
indexado desactivado: nunca se filtran ni ordenan y no deben multiplicar coste y
almacenamiento. Si se añade `orderBy('order')` o paginación en Firestore, primero
se incorpora la consulta y después su índice compuesto exacto.

## PDF

No existe una ruta PDF ficticia en el backend: el frontend genera la descarga
desde el mismo `contentHtml` saneado y el mismo layout que usa la lectura. El
contenedor de exportación debe cargar/esperar `document.fonts.ready` e imágenes,
resolver las portadas con CORS, incluir los estilos de artículo y definir reglas
de impresión para no cortar encabezados, citas, imágenes y bloques `pre/code`.
Los bloques de código usan `white-space: pre-wrap` y `overflow-wrap: anywhere`
para no perder contenido fuera de la página. HTML y Markdown se guardan juntos
en la publicación para que PDF, lectura y exportación representen la misma
revisión editorial.

## Componentes frontend

Research no monta un framework: son dos módulos ES sobre el HTML que ya sirve
Cloudflare, uno público y otro del CRM, con su hoja de estilo cada uno.

### Público — `JS/research.js` + `CSS/research.css`

Un solo documento, `research.html` (y sus copias en `es/`, `pt/` y las dos bases
nacionales), contiene las tres vistas y alterna entre ellas por `?notebook=` y
`?article=`. No hay router ni rutas nuevas que declarar en Cloudflare:

| `data-research-view` | Se muestra cuando | Contenido |
|---|---|---|
| `notebooks` | sin parámetros | grilla de cuadernos |
| `notebook` | `?notebook=` | cabecera del cuaderno y grilla de publicaciones |
| `article` | `?notebook=` + `?article=` | lectura completa, construida en el cliente |

El HTML de las tres vistas viene escrito con los cuadernos y las publicaciones
actuales. El módulo los sustituye si la API o Firestore responden, y los deja
intactos si no: la página sigue siendo legible sin JavaScript y un fallo de red
no vacía la sección. Por eso el orden de intento es API HTTP → Firestore →
HTML servido.

`sanitizeArticleHtml()` vuelve a sanear el `contentHtml` antes de tocar
`innerHTML`, con la misma allow-list que aplica el editor. `markdownToHtml()`
cubre el caso de una publicación que sólo conserve el Markdown.

Las páginas de lectura escritas a mano —`research/*.html` y sus traducciones—
comparten esa misma hoja y ese mismo módulo. No repiten el layout en un
`<style>` propio: `.paper-*`, `.rq-block` y `.references-list` viven sólo en
`CSS/research.css`, así que la lectura estática y la dinámica no pueden
divergir.

### El botón de PDF

`bindPdfButtons()` ata cualquier `[data-download-pdf]` del documento y corre al
cargar el módulo, de modo que sirve igual al botón que inyecta el lector
dinámico y al que trae escrito una página de lectura estática.

El PDF lo genera el propio navegador con `window.print()`. No hay servicio de
conversión ni una ruta de backend que lo finja: el documento impreso es el mismo
HTML semántico que se lee en pantalla, así que encabezados, listas, citas,
tablas y `pre/code` llegan al PDF con su estructura. Lo que aporta el bloque
`@media print` de `CSS/research.css`:

- Retira navbar, pie, preloader y la propia barra de herramientas.
- Fuerza tinta oscura sobre papel blanco, incluidos los `h1`–`h4` que produce el
  editor y los rótulos de sección, que en pantalla van con `opacity` reducida.
- `break-after: avoid` en los encabezados, `break-inside: avoid` en citas,
  bloques de código, imágenes y tablas, y `orphans`/`widows` en párrafos y
  listas.
- `white-space: pre-wrap` y `overflow-wrap: anywhere` en `pre`, para que una
  línea larga de código no se pierda fuera del ancho de página.
- `@page { margin: 18mm 17mm 20mm }`.

El nombre del archivo lo toma el navegador del `document.title`; el manejador lo
cambia al título del artículo mientras dura la impresión y lo restaura después.

### CRM — `JS/admin-research.js` + `CSS/admin-research.css`

Un módulo aparte de `JS/admin.js`, cargado por `admin.html`. No toca el
enrutado del CRM: se engancha al botón `#nav-research` y observa la clase
`active` de la sección, así que `navigateTo()` sigue sin conocer Research.

- **Gestor de cuadernos** — `#research-notebook-grid` lista lo que hay,
  `#research-new-notebook` abre `#research-notebook-dialog` (título,
  descripción, slug, idioma y portada por URL o subida a Storage). El slug se
  deriva del título hasta que se edita a mano.
- **Editor de artículos** — al abrir un cuaderno,
  `#research-article-list` muestra sus publicaciones y `#research-new-article`
  abre `#research-article-dialog`.
- **Elysium Editor** — un `contenteditable` con barra de estilo de bloque
  (párrafo, H2–H4), negrita, cursiva, listas, cita, bloque de código, código en
  línea y deshacer/rehacer. `sanitizeEditorHtml()` reduce lo pegado a la
  allow-list y `htmlToMarkdown()` produce el Markdown equivalente; ambas salidas
  se guardan juntas en la misma escritura.
- **Publicar** — el formulario envía con dos botones: `Guardar borrador` y
  `Publicar`. El segundo escribe `status`, `visibility` y `publishedAt` de una
  vez, que es lo que hace visible la publicación en el sitio público.

Los tres cuadernos iniciales los siembra `seedDefaultNotebooks()` la primera vez
que un administrador abre la sección, con ID determinista, de modo que abrirla
dos veces no los duplica.

## Verificación y despliegue

```bash
cd backend
npm run check
npm test

cd ..
firebase emulators:exec --only firestore,storage --project demo-elysium-research "true"
firebase deploy --project elysiumdr-eu --only firestore:rules,firestore:indexes,storage
```

`research-routes.test.js` prueba filtros, proyecciones y errores HTTP;
`research-contract.test.js` vigila que colecciones, OpenAPI, Rules, Storage e
índices no diverjan. Arrancar emuladores compila ambas reglas antes del
despliegue.
