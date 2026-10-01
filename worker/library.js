/**
 * La biblioteca: `elysiumdr.eu/library`.
 *
 * Una sección pública —enlazada desde el pie de todas las páginas, indexable y
 * con su propio sitemap— donde el administrador sube documentos HTML y quedan
 * publicados en el acto, sin pasar por git ni por un despliegue. Por eso no
 * pueden vivir en la raíz del repositorio como el resto del sitio: se guardan
 * en Workers KV (binding `LIBRARY`, un valor por libro) y los sirve este
 * módulo. Sigue fuera del MCP: los libros son obras de terceros.
 *
 * Rutas, todas bajo el mismo prefijo:
 *
 *   /library                      índice (plantilla `library/index.html`)
 *   /library/<slug>               lector: cabecera y pie de Elysium, el libro
 *                                 en un iframe, su índice de capítulos y los
 *                                 botones de pantalla completa y audiolibro
 *   /library/<slug>/book          el HTML tal cual, para ese iframe
 *   /library/<slug>/download      el HTML tal cual, como descarga (ElevenReader)
 *   /library/sitemap.xml          el índice y cada libro, para los buscadores
 *   /library/manifest.webmanifest la biblioteca como app instalable (PWA)
 *   /library/api/books            GET: el catálogo en JSON
 *   /library/api/books/<slug>     PUT: publicar o reemplazar · DELETE: retirar
 *
 * Cómo se encuentra un libro desde un buscador (lo que no se ve abriéndolo):
 *
 * - El texto del libro vive en el iframe, así que la página del lector no lo
 *   lleva. `/book` responde `noindex, indexifembedded`: Google no indexa esa
 *   URL suelta, pero sí su contenido como parte del lector que lo enmarca.
 * - Los rastreadores que no ejecutan JavaScript ni abren iframes (los de IA,
 *   casi todos) leen lo que el servidor escribe en el lector: título,
 *   descripción, autor, el índice de capítulos sacado del propio libro
 *   (`extractBookInfo`, guardado en `info:<slug>`) y enlaces al resto de la
 *   biblioteca. El índice de `/library` también sale ya pintado del servidor.
 * - Al publicar o retirar, se avisa a IndexNow (Bing, Yandex, Seznam…; Google
 *   no lo usa y se entera por el sitemap, que `robots.txt` anuncia en `.eu`).
 *   La clave es pública por diseño y vive también en `/<clave>.txt`.
 *
 * Tres decisiones que no se ven leyendo el código:
 *
 * 1. **El libro no comparte origen con Elysium.** Se sirve con la directiva
 *    CSP `sandbox` y el iframe lleva además el atributo `sandbox`, sin
 *    `allow-same-origin`: su JavaScript corre en un origen opaco y no puede
 *    leer la sesión de Firebase del CRM, que vive en el IndexedDB de
 *    `elysiumdr.eu`. Un HTML subido puede venir de cualquier sitio; aislarlo
 *    es lo que permite aceptar documentos con sus propios scripts.
 * 2. **El iframe también aísla los estilos.** Un libro trae su CSS global
 *    (`body`, `p`, `h2`, `header`…) y lo mismo el sitio. Inyectar la cabecera
 *    dentro del documento haría que se pisaran en los dos sentidos.
 * 3. **Solo publica la cuenta de Daniel** (`daniel.morales@elysiumdr.eu`, con
 *    el correo verificado). El token se comprueba aquí mismo con las claves
 *    públicas de Firebase: no hay que desplegar el backend para que la
 *    biblioteca funcione.
 *
 * Es un módulo puro (sin HTMLRewriter) para poder probarlo con `node --test`,
 * igual que `html-to-markdown.js`: ver `scripts/library.test.mjs`.
 */

export const LIBRARY_PREFIX = '/library';

/**
 * El único origen de la biblioteca (`.es` y `.pt` redirigen aquí). Las URLs
 * canónicas, el sitemap y los datos estructurados lo usan siempre, también
 * cuando el Worker corre en local.
 */
export const LIBRARY_ORIGIN = 'https://elysiumdr.eu';

/** Clave KV de cada libro. Sus metadatos van en los metadatos de la clave. */
const BOOK_KEY_PREFIX = 'book:';

/**
 * Clave KV con lo que se extrae del libro para el lector (autor, índice de
 * capítulos). No cabe en los metadatos de `book:`, que tienen 1024 bytes.
 * Si cambia su forma, se sube la versión y se recalcula sola al leerse.
 */
const INFO_KEY_PREFIX = 'info:';

/**
 * Traducciones: se hacen una vez con `scripts/library-translation.mjs`, como
 * las páginas `/es/` y `/pt/` del sitio, y se guardan en `tr:<slug>:<idioma>`.
 * Las que existen se anotan en `info:<slug>` (`translations`), que es lo que
 * lee el lector para montar su selector de idioma.
 */
const TRANSLATION_KEY_PREFIX = 'tr:';
export const TRANSLATION_LANGUAGES = ['en-GB', 'es-ES', 'pt-PT'];
export const PROPOSAL_KEY_PREFIX = 'proposal:';
export const PROPOSAL_FILE_KEY_PREFIX = 'proposal_file:';
const INFO_VERSION = 1;
const MAX_OUTLINE_ENTRIES = 160;
const MAX_HEADING_LENGTH = 160;

/**
 * IndexNow: la misma clave que `/<clave>.txt` en la raíz del sitio. Es pública
 * a propósito; solo prueba que quien avisa controla el dominio.
 */
export const INDEXNOW_KEY = 'e5164b848d4fb714be2fa0cfc750b536';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * Los libros son, casi siempre, obras de terceros: se pueden encontrar y citar
 * (`search`, `ai-input`), pero Elysium no puede autorizar que se entrene con
 * ellos, así que aquí no se repite el `ai-train=yes` del resto del sitio.
 */
const PUBLIC_CONTENT_SIGNAL = 'search=yes, ai-input=yes, ai-train=no';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 80;

/** Segmentos que son rutas del propio módulo o plantillas, no libros. */
const RESERVED_SLUGS = new Set(['api', 'index', 'reader', 'book', 'download']);

/**
 * KV admite 25 MiB por valor; se deja margen. Es lo que cabe en una sola
 * clave: un libro, si es pequeño, o cada trozo de uno grande. También tiene
 * que caber, descodificado, en la memoria del Worker.
 */
export const MAX_PART_BYTES = 24 * 1024 * 1024;

/**
 * Un libro mayor que `MAX_PART_BYTES` se guarda partido en varios valores
 * (`part:<slug>:<subida>:<n>`). `book:<slug>` pasa a ser un manifiesto
 * minúsculo cuyos metadatos llevan `p` (trozos) y `rev` (la subida), y el
 * lector los une al servirlo. Los libros de un solo valor no cambian.
 */
export const MAX_BOOK_BYTES = 100 * 1024 * 1024;
const MAX_BOOK_PARTS = 32;
const PART_KEY_PREFIX = 'part:';
const UPLOAD_ID = /^[a-z0-9]{8,32}$/;

const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 400;
const MAX_FILENAME_LENGTH = 120;

/** KV limita los metadatos de una clave a 1024 bytes serializados. */
const MAX_METADATA_BYTES = 1000;

const FIREBASE_PROJECT_ID = 'elysiumdr-eu';
const TOKEN_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

/** La única cuenta que publica en la biblioteca (ver `isLibraryAdmin`). */
const DEFAULT_ADMIN_EMAILS = 'daniel.morales@elysiumdr.eu';

/** El catálogo se guarda un minuto en la caché del punto de presencia. */
const CATALOG_CACHE_SECONDS = 60;

class LibraryError extends Error {
    constructor(message, code, status = 400) {
        super(message);
        this.name = 'LibraryError';
        this.code = code;
        this.status = status;
    }
}

// ── Cabeceras ─────────────────────────────────────────────────────────────────

/**
 * Lo que el Worker genera no pasa por `_headers`: Cloudflare solo aplica ese
 * fichero a las respuestas del binding de assets. Aquí se repite lo básico de
 * `/*`. Por defecto nada se indexa (la API, los errores, la descarga); las
 * páginas y el libro enmarcado lo abren explícitamente.
 */
function baseHeaders(extra = {}) {
    return new Headers({
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Robots-Tag': 'noindex, nofollow',
        'Content-Signal': 'search=no, ai-input=no, ai-train=no',
        ...extra
    });
}

/**
 * La política del libro. `sandbox` sin `allow-same-origin` le da un origen
 * opaco aunque alguien abra la URL fuera del iframe. Lo demás es permisivo a
 * propósito —un libro exportado puede cargar fuentes, MathJax o imágenes de
 * una CDN— porque desde un origen opaco no hay nada de Elysium que alcanzar.
 */
const BOOK_CSP = [
    'sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals',
    "default-src 'none'",
    "script-src 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'unsafe-inline' https:",
    'img-src data: blob: https:',
    'font-src data: https:',
    'media-src data: blob: https:',
    'connect-src https:',
    'frame-src https:',
    "form-action 'none'",
    "base-uri 'none'",
    "frame-ancestors 'self'"
].join('; ');

/** La descarga no debe ejecutarse nunca, ni si un navegador la mostrara. */
const DOWNLOAD_CSP = "sandbox; default-src 'none'; frame-ancestors 'none'";

function json(request, body, status = 200, extra = {}) {
    const headers = baseHeaders({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...extra
    });
    return new Response(request.method === 'HEAD' ? null : JSON.stringify(body), { status, headers });
}

function errorJson(request, error) {
    if (error instanceof LibraryError) {
        return json(request, { error: error.message, code: error.code }, error.status);
    }
    console.error('[library] unexpected error:', error);
    return json(request, { error: 'The library could not complete the request.', code: 'library_internal' }, 500);
}

function notFound(request) {
    return new Response(request.method === 'HEAD' ? null : 'Not found.', {
        status: 404,
        headers: baseHeaders({ 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
    });
}

function methodNotAllowed(request, allow) {
    return new Response(request.method === 'HEAD' ? null : 'Method not allowed.', {
        status: 405,
        headers: baseHeaders({ 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', Allow: allow })
    });
}

function permanentRedirect(url, pathname) {
    const target = new URL(pathname, url.origin);
    target.search = url.search;
    return new Response(null, { status: 301, headers: { Location: target.toString() } });
}

// ── Utilidades puras ──────────────────────────────────────────────────────────

export function isLibraryPath(pathname) {
    return /^\/library(?:\.html)?(?:\/|$)/i.test(pathname);
}

/**
 * La biblioteca se sirve en los cuatro dominios para que quien la abre desde
 * España, Portugal o el sitio global siga en SU región y en su idioma. Pero
 * existe en un solo origen a efectos de buscadores y de administración: los
 * libros son los mismos, y `.eu` es el canónico (las plantillas ya lo declaran)
 * y el único que publica, avisa a IndexNow y anuncia su sitemap. Las páginas de
 * los otros tres dominios son un espejo: `noindex`.
 */
const MIRROR_HOSTS = new Set(['elysiumdr.es', 'elysiumdr.pt', 'elysiumdr.com']);

export function isMirror(url) {
    return MIRROR_HOSTS.has(url.hostname.toLowerCase());
}

function redirectToPrimary(url) {
    return new Response(null, { status: 301, headers: { Location: `${LIBRARY_ORIGIN}${url.pathname}${url.search}` } });
}

export function isValidSlug(slug) {
    return typeof slug === 'string'
        && slug.length > 0
        && slug.length <= MAX_SLUG_LENGTH
        && SLUG.test(slug)
        && !RESERVED_SLUGS.has(slug);
}

export function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/** JSON dentro de `<script type="application/json">` sin poder cerrarlo. */
export function jsonForScript(value) {
    return JSON.stringify(value)
        .replaceAll('<', '\\u003c')
        .replaceAll('>', '\\u003e')
        .replaceAll('&', '\\u0026')
        .replaceAll('\u2028', '\\u2028')
        .replaceAll('\u2029', '\\u2029');
}

/**
 * Sustituye `{{CLAVE}}` en una plantilla. Los valores ya vienen escapados por
 * quien llama: aquí no se decide si una clave va en texto, atributo o script.
 */
export function renderTemplate(template, values) {
    return template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match);
}

function cleanText(value, maxLength) {
    return String(value ?? '')
        // Sin controles: ni en la tarjeta ni en los metadatos de KV.
        .replace(/[\u0000-\u001f\u007f]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function utf8Length(value) {
    return new TextEncoder().encode(value).byteLength;
}

/**
 * ¿Empieza como un documento HTML? Se saltan el BOM, los espacios y los
 * comentarios iniciales, y se exige `<!doctype html` o `<html`. Un fragmento
 * suelto, un XML o un texto con extensión `.html` no pasan.
 */
export function looksLikeHtmlDocument(text) {
    let rest = String(text).slice(0, 64 * 1024).replace(/^\uFEFF/, '');
    for (;;) {
        const trimmed = rest.replace(/^\s+/, '');
        if (!trimmed.startsWith('<!--')) { rest = trimmed; break; }
        const end = trimmed.indexOf('-->', 4);
        if (end === -1) return false;
        rest = trimmed.slice(end + 3);
    }
    return /^<!doctype\s+html(?:[\s>])/i.test(rest) || /^<html(?:[\s>])/i.test(rest);
}

/** `lang` del elemento `<html>`, si parece una etiqueta BCP 47. */
export function documentLanguage(text) {
    const tag = /<html\b[^>]*>/i.exec(String(text).slice(0, 64 * 1024));
    if (!tag) return '';
    const lang = /\blang\s*=\s*["']?([A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3})/i.exec(tag[0]);
    return lang ? lang[1] : '';
}

/**
 * Valida el cuerpo de una subida. Solo HTML: sin bytes nulos (un binario
 * renombrado), en UTF-8 válido —el Worker lo sirve como `charset=utf-8`, y un
 * documento en otra codificación saldría ilegible— y con forma de documento.
 */
export function inspectHtmlUpload(bytes, { first = true } = {}) {
    if (!bytes || bytes.byteLength === 0) {
        throw new LibraryError('The file is empty.', 'library_file_empty');
    }
    if (bytes.byteLength > MAX_PART_BYTES) {
        throw new LibraryError('The file is larger than the library allows.', 'library_file_too_large', 413);
    }
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (view.indexOf(0) !== -1) {
        throw new LibraryError('Only HTML documents can be published.', 'library_not_html', 415);
    }
    let text;
    try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(view);
    } catch {
        throw new LibraryError('The HTML file must be saved as UTF-8.', 'library_not_utf8', 415);
    }
    // Solo el primer trozo de un libro partido empieza como un documento.
    if (first && !looksLikeHtmlDocument(text)) {
        throw new LibraryError('Only HTML documents can be published.', 'library_not_html', 415);
    }
    return { lang: first ? documentLanguage(text) : '', text };
}

/** Nombre de fichero seguro para `Content-Disposition`. */
export function downloadFilename(file, slug) {
    const base = cleanText(file, MAX_FILENAME_LENGTH).replace(/[\\/:*?"<>|]+/g, '-');
    if (base && /\.html?$/i.test(base)) return base;
    return `${slug}.html`;
}

function contentDisposition(filename) {
    const ascii = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]+/g, '-').replace(/"/g, '');
    return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/**
 * Los metadatos que se guardan en KV, recortando la descripción (y en último
 * caso el título) hasta que caben en el límite de la clave.
 */
export function bookMetadata({ title, description, lang, size, file, uploadedAt, translations = [], parts = 1, rev = '' }) {
    const metadata = {
        v: 1,
        title: cleanText(title, MAX_TITLE_LENGTH),
        description: cleanText(description, MAX_DESCRIPTION_LENGTH),
        lang: cleanText(lang, 35),
        size,
        file: cleanText(file, MAX_FILENAME_LENGTH),
        uploadedAt
    };
    // Un libro partido dice cuántos trozos tiene y de qué subida son.
    if (parts > 1 && UPLOAD_ID.test(rev)) {
        metadata.p = parts;
        metadata.rev = rev;
    }
    // Las traducciones guardadas van en los metadatos para que el índice
    // pueda mostrar sus etiquetas sin leer nada más que el catálogo.
    const tr = translations.filter(language => TRANSLATION_LANGUAGES.includes(language));
    if (tr.length) metadata.tr = tr;
    while (utf8Length(JSON.stringify(metadata)) > MAX_METADATA_BYTES && metadata.description) {
        metadata.description = metadata.description.slice(0, Math.max(0, metadata.description.length - 20)).trim();
    }
    while (utf8Length(JSON.stringify(metadata)) > MAX_METADATA_BYTES && metadata.file) {
        metadata.file = '';
    }
    while (utf8Length(JSON.stringify(metadata)) > MAX_METADATA_BYTES) {
        metadata.title = metadata.title.slice(0, metadata.title.length - 10).trim();
    }
    return metadata;
}

/** Lo que se publica de un libro: sin nada interno de KV. */
function publicBook(slug, metadata = {}) {
    return {
        slug,
        title: metadata.title || slug,
        description: metadata.description || '',
        lang: metadata.lang || '',
        size: Number(metadata.size) || 0,
        uploadedAt: metadata.uploadedAt || null,
        translations: Array.isArray(metadata.tr) ? metadata.tr.filter(language => TRANSLATION_LANGUAGES.includes(language)) : []
    };
}

// ── Lo que se lee del libro ───────────────────────────────────────────────────

const NAMED_ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', shy: '',
    ndash: '–', mdash: '—', hellip: '…', middot: '·', laquo: '«', raquo: '»',
    lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”'
};

/** Las entidades que aparecen en un título; las numéricas, todas. */
export function decodeEntities(text) {
    return String(text).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
        if (entity[0] === '#') {
            const hex = entity[1] === 'x' || entity[1] === 'X';
            const code = parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
            return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
        }
        return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
    });
}

function textOf(fragment, maxLength) {
    return cleanText(decodeEntities(String(fragment)
        .replace(/<(script|style|svg)\b[\s\S]*?<\/\1\s*>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')), maxLength);
}

const ID_ATTRIBUTE = /(?:^|\s)id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;

function anchorValue(match) {
    const value = decodeEntities(match[1] ?? match[2] ?? match[3] ?? '').trim();
    return value && value.length <= 200 && !/[\s"'<>]/.test(value) ? value : '';
}

/**
 * El ancla a la que salta el índice. Si el título no lleva `id`, se busca en
 * el contenedor que lo abre justo antes —`<section id="cap-1"><header><h2>`
 * es la forma habitual de un capítulo—, siempre que ese contenedor no se haya
 * cerrado ni haya otro título entre medias. Sin ancla, la entrada va sin
 * enlace: mejor eso que saltar a un sitio equivocado.
 */
function headingAnchor(text, index, attributes) {
    const own = ID_ATTRIBUTE.exec(attributes);
    if (own) return anchorValue(own);
    const before = text.slice(Math.max(0, index - 400), index);
    const openers = [...before.matchAll(/<(?:section|article|header|div)\b([^>]*)>/gi)];
    for (let i = openers.length - 1; i >= 0; i -= 1) {
        const id = ID_ATTRIBUTE.exec(openers[i][1]);
        if (!id) continue;
        const between = before.slice(openers[i].index + openers[i][0].length);
        if (/<\/(?:section|article|header|div)\s*>|<h[1-6]\b/i.test(between)) return '';
        return anchorValue(id);
    }
    return '';
}

function metaContent(head, names) {
    for (const tag of head.match(/<meta\b[^>]*>/gi) || []) {
        const name = /\sname\s*=\s*["']?([^"'\s>]+)/i.exec(tag);
        if (!name || !names.includes(name[1].toLowerCase())) continue;
        const content = /\scontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
        const value = content ? cleanText(decodeEntities(content[1] ?? content[2] ?? content[3] ?? ''), 300) : '';
        if (value) return value;
    }
    return '';
}

/**
 * Autor, descripción e índice de capítulos (h1–h3) de un libro, para que el
 * lector los escriba en su HTML. Es lo que leen los buscadores que no abren
 * el iframe. Se descartan los títulos que se repiten («Notas», «Sumário»):
 * no orientan a nadie y ensucian el índice.
 *
 * Solo expresiones regulares y acotadas: un libro de 4 MB se lee en unos
 * pocos milisegundos, y esto corre dentro del Worker.
 */
export function extractBookInfo(html) {
    const text = String(html ?? '');
    const found = [];
    scanHeadings(text, found);
    return buildBookInfo(headOf(text), found);
}

function headOf(text) {
    const headEnd = text.search(/<\/head\s*>/i);
    return text.slice(0, headEnd === -1 ? 64 * 1024 : Math.min(headEnd, 256 * 1024));
}

/** Añade a `found` los h1–h3 de `text`, sin pasar del tope de todo el libro. */
function scanHeadings(text, found) {
    const pattern = /<h([1-3])\b([^>]*)>([\s\S]*?)<\/h\1\s*>/gi;
    let match;
    while (found.length < MAX_OUTLINE_ENTRIES * 2 && (match = pattern.exec(text))) {
        const title = textOf(match[3], MAX_HEADING_LENGTH);
        if (title.length < 2) continue;
        found.push({ l: Number(match[1]), t: title, id: headingAnchor(text, match.index, match[2]) });
    }
}

function buildBookInfo(head, found) {
    const counts = new Map();
    for (const entry of found) {
        const key = entry.t.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
    }
    return {
        v: INFO_VERSION,
        author: metaContent(head, ['author', 'citation_author', 'dc.creator', 'dcterms.creator']),
        description: metaContent(head, ['description']),
        outline: found.filter(entry => counts.get(entry.t.toLowerCase()) === 1).slice(0, MAX_OUTLINE_ENTRIES)
    };
}

// ── Libros partidos ───────────────────────────────────────────────────────────

function partKey(slug, rev, index) {
    return `${PART_KEY_PREFIX}${slug}:${rev}:${index}`;
}

/** Cuántos valores de KV forman el libro: 1 salvo que sea uno partido. */
function partCount(metadata) {
    const parts = Number(metadata && metadata.p);
    return Number.isInteger(parts) && parts > 1 && parts <= MAX_BOOK_PARTS && UPLOAD_ID.test(String(metadata.rev || ''))
        ? parts
        : 1;
}

/**
 * Los trozos de un libro como un solo flujo. Se lee uno a uno, a medida que el
 * cliente pide bytes: el libro entero nunca está en la memoria del Worker.
 */
function joinParts(kv, slug, rev, count) {
    let index = 0;
    let reader = null;
    return new ReadableStream({
        async pull(controller) {
            for (;;) {
                if (!reader) {
                    if (index >= count) { controller.close(); return; }
                    const part = await kv.getWithMetadata(partKey(slug, rev, index), { type: 'stream' });
                    if (!part || !part.value) {
                        controller.error(new Error(`Part ${index} of ${slug} is missing.`));
                        return;
                    }
                    index += 1;
                    reader = part.value.getReader();
                }
                const { done, value } = await reader.read();
                if (done) { reader = null; continue; }
                controller.enqueue(value);
                return;
            }
        },
        cancel(reason) {
            return reader ? reader.cancel(reason) : undefined;
        }
    });
}

/**
 * Lee los trozos de una subida, de uno en uno, y saca de ellos lo mismo que
 * `extractBookInfo` de un libro entero: idioma, índice y tamaño. También es lo
 * que comprueba que no falta ninguno antes de publicar.
 */
async function readParts(kv, slug, rev, count) {
    const found = [];
    let head = '';
    let lang = '';
    let size = 0;
    for (let index = 0; index < count; index += 1) {
        const part = await kv.getWithMetadata(partKey(slug, rev, index));
        if (!part || part.value === null || part.value === undefined) {
            throw new LibraryError(`Part ${index + 1} of ${count} was not received.`, 'library_part_missing', 409);
        }
        if (index === 0) {
            head = headOf(part.value);
            lang = documentLanguage(part.value);
        }
        scanHeadings(part.value, found);
        size += Number(part.metadata && part.metadata.size) || 0;
    }
    return { info: buildBookInfo(head, found), lang, size };
}

/**
 * Borra los trozos de un libro: todos, o todos menos los de la subida `keepRev`
 * (que también limpia las subidas que se quedaron a medias).
 */
async function forgetParts(kv, slug, keepRev = '') {
    const prefix = `${PART_KEY_PREFIX}${slug}:`;
    try {
        let cursor;
        do {
            const page = await kv.list({ prefix, cursor });
            for (const key of page.keys) {
                if (keepRev && key.name.startsWith(`${prefix}${keepRev}:`)) continue;
                await kv.delete(key.name);
            }
            cursor = page.list_complete ? undefined : page.cursor;
        } while (cursor);
    } catch (error) {
        // Sobran unos bytes en KV, nada más: no debe estropear la publicación.
        console.warn('[library] could not clean the book parts:', error);
    }
}

// ── Inyección en el libro ─────────────────────────────────────────────────────

/**
 * Lo único que se añade al libro al servirlo en el iframe. Corre dentro del
 * libro, antes que sus propios scripts, y arregla dos cosas que solo pasan al
 * estar enmarcado. La descarga no lo lleva: es el fichero tal como se subió.
 *
 * 1. Un enlace a otra página sin `target` navegaría el propio iframe —y la
 *    mayoría de sitios se niegan a mostrarse enmarcados—, así que se abre en
 *    una pestaña nueva. Los saltos dentro del libro (`#capitulo`) no se tocan.
 * 2. `scrollIntoView()` no se queda en el iframe: Chrome desplaza también la
 *    página que lo contiene, aunque sea de otro origen. Un libro que lo use
 *    para seguir el índice o para «ir a la página» arrastraba la página de
 *    Elysium y escondía la cabecera. Se sustituye por una versión que solo
 *    mueve los contenedores del propio libro. Navegar a un ancla y `focus()`
 *    no tienen ese problema (comprobado), así que no se tocan.
 * 3. La pantalla completa del lector no pone nada de Elysium encima del
 *    libro: el botón de salir es del propio libro, junto a su botón de tema
 *    (`<button data-library-exit hidden>`, que llevan los libros de la
 *    biblioteca). La página avisa al libro de cuándo está a pantalla completa
 *    y el libro le devuelve el clic en ese botón; si un libro no trae el
 *    hueco, se le añade uno mínimo arriba a la derecha. Escape pulsado dentro
 *    del libro tampoco llega a la página, así que también se avisa. Todo va
 *    por `postMessage` sin datos del libro, y el destino `*` no expone nada:
 *    `frame-ancestors 'self'` impide que otro sitio lo enmarque.
 *
 * Se escribe como función y se serializa para que se pueda leer y revisar;
 * no puede usar nada de fuera de su propio cuerpo.
 */
function bookHelper() {
    document.addEventListener('click', function (event) {
        var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
        if (!link || link.target) return;
        var url;
        try { url = new URL(link.href, location.href); } catch (error) { return; }
        if (!/^https?:$/.test(url.protocol)) return;
        if (url.href.split('#')[0] === location.href.split('#')[0]) return;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
    }, true);

    if (window.parent === window) return;
    var nativeScrollIntoView = Element.prototype.scrollIntoView;
    var px = function (value) { var number = parseFloat(value); return isFinite(number) ? number : 0; };
    var offset = function (rect, top, bottom, block) {
        if (block === 'center') return (rect.top + rect.height / 2) - (top + bottom) / 2;
        if (block === 'end') return rect.bottom - bottom;
        if (block === 'nearest') return rect.top < top ? rect.top - top : rect.bottom > bottom ? rect.bottom - bottom : 0;
        return rect.top - top;
    };
    Element.prototype.scrollIntoView = function (argument) {
        if (!this.isConnected) return nativeScrollIntoView.apply(this, arguments);
        var options = argument && typeof argument === 'object' ? argument : { block: argument === false ? 'end' : 'start' };
        var block = options.block || 'start';
        var behavior = options.behavior === 'smooth' ? 'smooth' : 'auto';
        var margin = block === 'start' ? px(getComputedStyle(this).scrollMarginTop) : 0;
        var fixed = getComputedStyle(this).position === 'fixed';
        for (var node = this.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
            var style = getComputedStyle(node);
            if (style.position === 'fixed') fixed = true;
            if (!/(auto|scroll|overlay)/.test(style.overflowY) || node.scrollHeight <= node.clientHeight) continue;
            var box = node.getBoundingClientRect();
            var top = box.top + node.clientTop;
            var padding = block === 'start' ? px(style.scrollPaddingTop) : 0;
            node.scrollBy({ top: offset(this.getBoundingClientRect(), top + padding, top + node.clientHeight, block) - margin, behavior: behavior });
        }
        // Lo que vive en un contenedor fijo no se alcanza desplazando el
        // documento; es justo el caso en que Chrome saltaba a la página padre.
        if (fixed) return;
        var root = document.scrollingElement || document.documentElement;
        var rootPadding = block === 'start' ? px(getComputedStyle(root).scrollPaddingTop) : 0;
        window.scrollBy({ top: offset(this.getBoundingClientRect(), rootPadding, window.innerHeight, block) - margin, behavior: behavior });
    };

    var send = function (type) {
        try { window.parent.postMessage({ elysiumLibrary: type }, '*'); } catch (error) { /* sin padre */ }
    };
    var immersive = false;
    var exitButton = null;
    var fallback = false;
    var exitLabel = function () {
        var lang = (document.documentElement.lang || '').slice(0, 2).toLowerCase();
        return lang === 'pt' ? 'Sair do ecrã inteiro' : lang === 'es' ? 'Salir de la pantalla completa' : 'Exit full screen';
    };
    var sync = function () {
        if (!document.body) return;
        if (!exitButton) {
            exitButton = document.querySelector('[data-library-exit]');
            if (!exitButton && immersive) {
                fallback = true;
                exitButton = document.createElement('button');
                exitButton.type = 'button';
                exitButton.setAttribute('aria-label', exitLabel());
                exitButton.title = exitLabel();
                exitButton.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
                exitButton.style.cssText = 'position:fixed;top:10px;right:10px;z-index:2147483647;width:34px;height:34px;place-items:center;padding:0;border:0;border-radius:50%;background:rgba(20,22,26,.55);color:#fff;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 1px 3px rgba(0,0,0,.25)';
                document.body.appendChild(exitButton);
            }
            if (exitButton) {
                exitButton.addEventListener('click', function (event) {
                    event.preventDefault();
                    send('exit');
                });
            }
        }
        if (!exitButton) return;
        exitButton.hidden = !immersive;
        // `hidden` no basta si el CSS del libro le da un `display` propio.
        exitButton.style.display = immersive ? (fallback ? 'grid' : '') : 'none';
    };
    var whenReady = function (callback) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
        else callback();
    };
    window.addEventListener('message', function (event) {
        if (event.source !== window.parent || !event.data || event.data.elysiumLibrary !== 'immersive') return;
        immersive = event.data.value === true;
        whenReady(sync);
    });
    // Si el libro se recarga a pantalla completa, la página le recuerda el modo.
    whenReady(function () { send('ready'); });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') send('escape');
    });
    // Al cambiar de idioma la página recarga el libro traducido: le pregunta
    // antes por el último ancla ya leída para abrirlo en el mismo sitio.
    window.addEventListener('message', function (event) {
        if (event.source !== window.parent || !event.data || event.data.elysiumLibrary !== 'where') return;
        var scope = document.querySelector('main') || document.body;
        var nodes = scope.querySelectorAll('[id]');
        var here = '';
        for (var i = 0; i < nodes.length; i += 1) {
            if (nodes[i].getBoundingClientRect().top <= 80) here = nodes[i].id;
            else if (here) break;
        }
        try { window.parent.postMessage({ elysiumLibrary: 'here', value: here }, '*'); } catch (error) { /* sin padre */ }
    });
}

export const BOOK_HELPER = `<script>/* Elysium Library */var __name=function(t){return t;};(${bookHelper.toString()})();</script>`;

const HEAD_CLOSE = new TextEncoder().encode('</head');

function indexOfHeadClose(bytes) {
    outer: for (let i = 0; i <= bytes.length - HEAD_CLOSE.length; i += 1) {
        for (let j = 0; j < HEAD_CLOSE.length; j += 1) {
            let byte = bytes[i + j];
            // Solo letras ASCII: `| 0x20` las pasa a minúscula.
            if (byte >= 0x41 && byte <= 0x5a) byte |= 0x20;
            if (byte !== HEAD_CLOSE[j]) continue outer;
        }
        return i;
    }
    return -1;
}

/**
 * Inserta `snippet` antes del primer `</head>` sin leer el libro entero: en
 * cuanto aparece, el resto del flujo pasa sin tocarse. Si el documento no
 * cierra el `<head>` (es opcional), el fragmento va al final, donde el
 * analizador lo ejecuta igual.
 */
export function injectBeforeHeadClose(stream, snippet) {
    const snippetBytes = new TextEncoder().encode(snippet);
    let inserted = false;
    let carry = new Uint8Array(0);
    return stream.pipeThrough(new TransformStream({
        transform(chunk, controller) {
            if (inserted) { controller.enqueue(chunk); return; }
            const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
            const data = new Uint8Array(carry.length + bytes.length);
            data.set(carry, 0);
            data.set(bytes, carry.length);
            const index = indexOfHeadClose(data);
            if (index !== -1) {
                controller.enqueue(data.subarray(0, index));
                controller.enqueue(snippetBytes);
                controller.enqueue(data.subarray(index));
                inserted = true;
                carry = new Uint8Array(0);
                return;
            }
            // Se guardan los últimos bytes por si `</head` queda partido
            // entre dos fragmentos.
            const keep = Math.min(data.length, HEAD_CLOSE.length - 1);
            controller.enqueue(data.subarray(0, data.length - keep));
            carry = data.slice(data.length - keep);
        },
        flush(controller) {
            if (carry.length) controller.enqueue(carry);
            if (!inserted) controller.enqueue(snippetBytes);
        }
    }));
}

// ── Autenticación ─────────────────────────────────────────────────────────────

let signingKeyCache = { keys: null, expires: 0 };

function base64UrlBytes(segment) {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function base64UrlJson(segment) {
    return JSON.parse(new TextDecoder().decode(base64UrlBytes(segment)));
}

async function firebaseSigningKeys({ refresh = false } = {}) {
    const now = Date.now();
    if (!refresh && signingKeyCache.keys && now < signingKeyCache.expires) return signingKeyCache.keys;
    const response = await fetch(FIREBASE_JWKS_URL);
    if (!response.ok) {
        throw new LibraryError('The Firebase signing keys are unavailable.', 'library_auth_unavailable', 503);
    }
    const body = await response.json();
    const maxAge = /max-age=(\d+)/i.exec(response.headers.get('Cache-Control') || '');
    signingKeyCache = {
        keys: new Map((body.keys || []).map(key => [key.kid, key])),
        expires: now + (maxAge ? Number(maxAge[1]) * 1000 : 60 * 60 * 1000)
    };
    return signingKeyCache.keys;
}

/** Solo para las pruebas: olvida las claves guardadas en memoria. */
export function resetSigningKeyCache() {
    signingKeyCache = { keys: null, expires: 0 };
}

const unauthorized = (message, code = 'library_auth_invalid') => new LibraryError(message, code, 401);

/**
 * Verifica un ID token de Firebase (RS256) como indica Firebase para
 * servidores sin Admin SDK: firma con una clave pública vigente, `aud` y `iss`
 * del proyecto, `sub` no vacío y fechas coherentes.
 */
export async function verifyFirebaseIdToken(token, { now = Date.now() } = {}) {
    const parts = String(token || '').split('.');
    if (parts.length !== 3 || parts.some(part => !part)) throw unauthorized('The session token is malformed.');

    let header;
    let payload;
    try {
        header = base64UrlJson(parts[0]);
        payload = base64UrlJson(parts[1]);
    } catch {
        throw unauthorized('The session token is malformed.');
    }
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw unauthorized('The session token is not a Firebase token.');

    let keys = await firebaseSigningKeys();
    let jwk = keys.get(header.kid);
    if (!jwk) {
        // Firebase rota las claves: una desconocida puede ser nueva.
        keys = await firebaseSigningKeys({ refresh: true });
        jwk = keys.get(header.kid);
    }
    if (!jwk) throw unauthorized('The session token was signed with an unknown key.');

    const key = await crypto.subtle.importKey(
        'jwk',
        { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
    );
    let signature;
    try {
        signature = base64UrlBytes(parts[2]);
    } catch {
        throw unauthorized('The session token is malformed.');
    }
    const valid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        key,
        signature,
        new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!valid) throw unauthorized('The session token signature is invalid.');

    const seconds = Math.floor(now / 1000);
    const skew = 300;
    if (payload.aud !== FIREBASE_PROJECT_ID || payload.iss !== TOKEN_ISSUER) {
        throw unauthorized('The session token belongs to another project.');
    }
    if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128) {
        throw unauthorized('The session token has no user.');
    }
    if (!(Number(payload.exp) > seconds)) throw unauthorized('The session has expired.', 'library_auth_expired');
    if (!(Number(payload.iat) <= seconds + skew)) throw unauthorized('The session token is not valid yet.');
    if (payload.auth_time !== undefined && !(Number(payload.auth_time) <= seconds + skew)) {
        throw unauthorized('The session token is not valid yet.');
    }
    return payload;
}

/**
 * Quién administra la biblioteca: la cuenta de Daniel y ninguna otra. A
 * diferencia del CRM, aquí no valen el claim `admin` ni los roles: dárselos a
 * alguien para el CRM no debe darle también la publicación de libros. Otra
 * dirección solo entra si se añade a `LIBRARY_ADMIN_EMAILS` en el Worker.
 * Siempre con el correo verificado, que es lo que prueba que es suyo.
 */
export function isLibraryAdmin(claims, env = {}) {
    if (!claims || claims.email_verified !== true) return false;
    const emails = new Set(
        String(env.LIBRARY_ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS)
            .split(',')
            .map(value => value.trim().toLowerCase())
            .filter(Boolean)
    );
    return emails.has(String(claims.email || '').toLowerCase());
}

async function requireAdmin(request, env) {
    const authorization = request.headers.get('Authorization') || '';
    const match = /^Bearer\s+(\S+)$/i.exec(authorization);
    let token = match ? match[1] : '';
    if (!token) {
        try {
            const url = new URL(request.url);
            token = url.searchParams.get('token') || '';
        } catch { /* URL inválida */ }
    }
    if (!token) throw unauthorized('Sign in as an administrator to manage the library.', 'library_auth_required');
    const claims = await verifyFirebaseIdToken(token);
    if (!isLibraryAdmin(claims, env)) {
        throw new LibraryError('Administrator access required.', 'library_admin_required', 403);
    }
    return claims;
}

// ── Almacén ───────────────────────────────────────────────────────────────────

function store(env) {
    const kv = env.LIBRARY;
    if (!kv || typeof kv.get !== 'function') {
        throw new LibraryError('The library storage is not configured.', 'library_not_configured', 503);
    }
    return kv;
}

function catalogCacheKey(origin) {
    return new Request(new URL(`${LIBRARY_PREFIX}/api/books?catalog-cache=1`, origin).toString());
}

function edgeCache() {
    return typeof caches !== 'undefined' && caches.default ? caches.default : null;
}

async function forgetCatalog(origin) {
    const cache = edgeCache();
    if (!cache) return;
    try {
        await cache.delete(catalogCacheKey(origin));
    } catch {
        // Sin caché disponible (p. ej. en workers.dev) no hay nada que purgar.
    }
}

/**
 * El catálogo sale de `list()` con los metadatos de cada clave, sin leer ni un
 * libro. Se cachea un minuto por punto de presencia: el plan gratuito de KV
 * tiene un cupo diario de `list()` mucho menor que el de lecturas.
 */
export async function listBooks(env, origin) {
    const kv = store(env);
    const cache = edgeCache();
    const cacheKey = cache ? catalogCacheKey(origin) : null;
    if (cache) {
        try {
            const cached = await cache.match(cacheKey);
            if (cached) return (await cached.json()).books;
        } catch {
            // La caché es una optimización; si falla se lee KV.
        }
    }

    const books = [];
    let cursor;
    do {
        const page = await kv.list({ prefix: BOOK_KEY_PREFIX, cursor });
        for (const key of page.keys) {
            const slug = key.name.slice(BOOK_KEY_PREFIX.length);
            if (isValidSlug(slug)) books.push(publicBook(slug, key.metadata || {}));
        }
        cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    books.sort((a, b) => String(b.uploadedAt || '').localeCompare(String(a.uploadedAt || ''))
        || a.title.localeCompare(b.title));

    if (cache) {
        try {
            await cache.put(cacheKey, new Response(JSON.stringify({ books }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': `public, max-age=${CATALOG_CACHE_SECONDS}`
                }
            }));
        } catch {
            // Igual que arriba.
        }
    }
    return books;
}

// ── API ───────────────────────────────────────────────────────────────────────

function readUploadMeta(request) {
    const raw = request.headers.get('X-Library-Meta') || '';
    if (!raw || raw.length > 8192) throw new LibraryError('The book details are missing.', 'library_meta_missing');
    try {
        const meta = JSON.parse(decodeURIComponent(raw));
        return meta && typeof meta === 'object' ? meta : {};
    } catch {
        throw new LibraryError('The book details could not be read.', 'library_meta_invalid');
    }
}

export function bookUrl(slug) {
    return `${LIBRARY_ORIGIN}${LIBRARY_PREFIX}/${slug}`;
}

/**
 * Avisa a IndexNow de que esas URLs cambiaron (también si desaparecen). Solo
 * desde el dominio de verdad y con `waitUntil`: ni `wrangler dev` ni las
 * pruebas deben avisar a un buscador. Un fallo aquí no afecta a la subida.
 */
export async function notifyIndexNow(urls) {
    try {
        const response = await fetch(INDEXNOW_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                host: new URL(LIBRARY_ORIGIN).host,
                key: INDEXNOW_KEY,
                keyLocation: `${LIBRARY_ORIGIN}/${INDEXNOW_KEY}.txt`,
                urlList: urls
            })
        });
        if (!response.ok) console.warn('[library] IndexNow answered', response.status);
    } catch (error) {
        console.warn('[library] IndexNow unreachable:', error);
    }
}

function announce(ctx, url, urls) {
    if (url.origin !== LIBRARY_ORIGIN || !ctx || typeof ctx.waitUntil !== 'function') return;
    ctx.waitUntil(notifyIndexNow(urls));
}

/** El título y el nombre de fichero que acompañan a una subida, ya comprobados. */
function readBookDetails(meta) {
    const file = cleanText(meta.filename, MAX_FILENAME_LENGTH);
    if (!/\.html?$/i.test(file)) {
        throw new LibraryError('Only .html files can be published.', 'library_not_html', 415);
    }
    const title = cleanText(meta.title, MAX_TITLE_LENGTH);
    if (!title) throw new LibraryError('The book needs a title.', 'library_title_missing');
    return { file, title };
}

/** Si el slug ya es de un libro, y si la subida pidió reemplazarlo. */
async function requireFreeOrReplace(kv, key, meta) {
    const existing = await kv.list({ prefix: key });
    const exists = existing.keys.some(entry => entry.name === key);
    if (exists && meta.replace !== true) {
        throw new LibraryError('A book already uses that address.', 'library_slug_taken', 409);
    }
    return exists;
}

function requireHtmlBody(request) {
    const contentType = (request.headers.get('Content-Type') || '').toLowerCase();
    if (!contentType.startsWith('text/html')) {
        throw new LibraryError('Only HTML documents can be published.', 'library_not_html', 415);
    }
}

function requireDeclaredSize(request, limit) {
    const declared = Number(request.headers.get('Content-Length'));
    if (Number.isFinite(declared) && declared > limit) {
        throw new LibraryError('The file is larger than the library allows.', 'library_file_too_large', 413);
    }
}

async function publishBook(request, env, url, slug, ctx) {
    await requireAdmin(request, env);
    const kv = store(env);

    requireHtmlBody(request);
    const meta = readUploadMeta(request);
    const { file, title } = readBookDetails(meta);

    requireDeclaredSize(request, MAX_PART_BYTES);
    const bytes = new Uint8Array(await request.arrayBuffer());
    const { lang, text } = inspectHtmlUpload(bytes);

    const key = BOOK_KEY_PREFIX + slug;
    const exists = await requireFreeOrReplace(kv, key, meta);

    const metadata = bookMetadata({
        title,
        description: meta.description,
        lang,
        size: bytes.byteLength,
        file,
        uploadedAt: new Date().toISOString()
    });
    await kv.put(key, bytes, { metadata });
    // Si era un libro partido, sus trozos ya no son de nadie.
    if (exists) await forgetParts(kv, slug);
    // Las traducciones eran de la versión anterior: con el texto nuevo sobran.
    await forgetTranslations(kv, slug);
    await kv.put(INFO_KEY_PREFIX + slug, JSON.stringify(extractBookInfo(text)));
    await forgetCatalog(url.origin);
    announce(ctx, url, [bookUrl(slug), `${LIBRARY_ORIGIN}${LIBRARY_PREFIX}`]);
    return json(request, { book: publicBook(slug, metadata), replaced: exists }, exists ? 200 : 201);
}

/**
 * Un trozo de un libro grande. El navegador parte el fichero en UTF-8 por
 * caracteres enteros, así que cada trozo se valida por su cuenta; el libro no
 * existe hasta que `commitBook` lo cierra, y hasta entonces el anterior (si
 * lo hay) sigue sirviéndose.
 */
async function stageBookPart(request, env, url, slug, index) {
    await requireAdmin(request, env);
    const kv = store(env);

    requireHtmlBody(request);
    const rev = url.searchParams.get('upload') || '';
    if (!UPLOAD_ID.test(rev)) throw new LibraryError('The upload id is not valid.', 'library_upload_invalid');
    if (index >= MAX_BOOK_PARTS) {
        throw new LibraryError('The file is larger than the library allows.', 'library_file_too_large', 413);
    }
    requireDeclaredSize(request, MAX_PART_BYTES);
    const bytes = new Uint8Array(await request.arrayBuffer());
    inspectHtmlUpload(bytes, { first: index === 0 });

    await kv.put(partKey(slug, rev, index), bytes, { metadata: { size: bytes.byteLength } });
    return json(request, { part: index, bytes: bytes.byteLength }, 201);
}

/**
 * Cierra una subida por trozos: comprueba que están todos, saca el índice y
 * escribe `book:<slug>`, que es lo que hace que el libro aparezca. Hasta ese
 * momento nada del libro anterior se toca.
 */
async function commitBook(request, env, url, slug, ctx) {
    await requireAdmin(request, env);
    const kv = store(env);

    let meta;
    try {
        meta = await request.json();
    } catch {
        throw new LibraryError('The book details could not be read.', 'library_meta_invalid');
    }
    if (!meta || typeof meta !== 'object') throw new LibraryError('The book details could not be read.', 'library_meta_invalid');
    const rev = String(meta.upload || '');
    const parts = meta.parts;
    if (!UPLOAD_ID.test(rev) || !Number.isInteger(parts) || parts < 2 || parts > MAX_BOOK_PARTS) {
        throw new LibraryError('The upload is not valid.', 'library_upload_invalid');
    }
    const { file, title } = readBookDetails(meta);

    const key = BOOK_KEY_PREFIX + slug;
    const exists = await requireFreeOrReplace(kv, key, meta);

    const { info, lang, size } = await readParts(kv, slug, rev, parts);
    if (size > MAX_BOOK_BYTES) {
        throw new LibraryError('The file is larger than the library allows.', 'library_file_too_large', 413);
    }
    if (Number.isFinite(meta.size) && meta.size !== size) {
        throw new LibraryError('The parts do not add up to the file that was chosen.', 'library_parts_mismatch', 409);
    }

    const metadata = bookMetadata({
        title,
        description: meta.description,
        lang,
        size,
        file,
        uploadedAt: new Date().toISOString(),
        parts,
        rev
    });
    await kv.put(key, JSON.stringify({ parts, rev, size }), { metadata });
    await forgetParts(kv, slug, rev);
    await forgetTranslations(kv, slug);
    await kv.put(INFO_KEY_PREFIX + slug, JSON.stringify(info));
    await forgetCatalog(url.origin);
    announce(ctx, url, [bookUrl(slug), `${LIBRARY_ORIGIN}${LIBRARY_PREFIX}`]);
    return json(request, { book: publicBook(slug, metadata), replaced: exists }, exists ? 200 : 201);
}

async function forgetTranslations(kv, slug) {
    const stored = await kv.get(INFO_KEY_PREFIX + slug);
    const translations = stored ? (JSON.parse(stored).translations || []) : [];
    for (const language of translations) await kv.delete(`${TRANSLATION_KEY_PREFIX}${slug}:${language}`);
}

async function removeBook(request, env, url, slug, ctx) {
    await requireAdmin(request, env);
    const kv = store(env);
    const key = BOOK_KEY_PREFIX + slug;
    const existing = await kv.list({ prefix: key });
    if (!existing.keys.some(entry => entry.name === key)) {
        throw new LibraryError('That book is not in the library.', 'library_book_missing', 404);
    }
    await kv.delete(key);
    await forgetParts(kv, slug);
    await forgetTranslations(kv, slug);
    await kv.delete(INFO_KEY_PREFIX + slug);
    await forgetCatalog(url.origin);
    announce(ctx, url, [bookUrl(slug), `${LIBRARY_ORIGIN}${LIBRARY_PREFIX}`]);
    return json(request, { deleted: slug });
}

// ── Solicitudes de digitalización / transcripción ────────────────────────────

export async function createProposal(request, env) {
    const kv = store(env);
    const contentType = request.headers.get('content-type') || '';
    let name = '';
    let email = '';
    let message = '';
    let lang = 'en';
    let file = null;

    if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        name = String(formData.get('name') || '').trim();
        email = String(formData.get('email') || '').trim();
        message = String(formData.get('message') || '').trim();
        lang = String(formData.get('lang') || 'en').trim();
        const rawFile = formData.get('file');
        if (rawFile && typeof rawFile === 'object' && 'size' in rawFile && rawFile.size > 0) {
            file = rawFile;
        }
    } else if (contentType.includes('application/json')) {
        const body = await request.json();
        name = String(body.name || '').trim();
        email = String(body.email || '').trim();
        message = String(body.message || '').trim();
        lang = String(body.lang || 'en').trim();
    } else {
        throw new LibraryError('Invalid content type.', 'invalid_content_type', 400);
    }

    if (!name) throw new LibraryError('Name is required.', 'name_required', 400);
    if (name.length > 120) throw new LibraryError('Name is too long.', 'name_too_long', 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new LibraryError('Valid email is required.', 'email_invalid', 400);
    }
    if (email.length > 254) throw new LibraryError('Email is too long.', 'email_too_long', 400);
    if (!message) throw new LibraryError('Message is required.', 'message_required', 400);
    if (message.length > 5000) throw new LibraryError('Message is too long.', 'message_too_long', 400);

    if (file && file.size > MAX_PART_BYTES) {
        throw new LibraryError('The attached file exceeds the 24 MB limit.', 'file_too_large', 400);
    }

    const id = 'prop_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    const hasFile = Boolean(file && file.size > 0);
    let fileName = null;
    let fileType = null;
    let fileSize = 0;

    if (hasFile) {
        fileName = String(file.name || 'document').slice(0, 240);
        fileType = String(file.type || 'application/octet-stream').slice(0, 100);
        fileSize = file.size;
        const arrayBuffer = await file.arrayBuffer();
        await kv.put(PROPOSAL_FILE_KEY_PREFIX + id, new Uint8Array(arrayBuffer), {
            metadata: { fileName, fileType, fileSize, uploadedAt: new Date().toISOString() }
        });
    }

    const proposal = {
        id,
        name,
        email,
        message,
        lang: ['en', 'es', 'pt'].includes(lang) ? lang : 'en',
        hasFile,
        fileName,
        fileType,
        fileSize,
        status: 'new',
        submittedAt: new Date().toISOString()
    };

    await kv.put(PROPOSAL_KEY_PREFIX + id, JSON.stringify(proposal));
    return json(request, { ok: true, id }, 201);
}

export async function listProposals(request, env) {
    await requireAdmin(request, env);
    const kv = store(env);
    const proposals = [];
    let cursor;
    do {
        const page = await kv.list({ prefix: PROPOSAL_KEY_PREFIX, cursor });
        for (const key of page.keys) {
            const raw = await kv.get(key.name);
            if (raw) {
                try {
                    proposals.push(JSON.parse(raw));
                } catch { /* ignorar corrupto */ }
            }
        }
        cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    proposals.sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));
    return json(request, { proposals });
}

export async function downloadProposalFile(request, env, id) {
    await requireAdmin(request, env);
    const kv = store(env);
    const key = PROPOSAL_FILE_KEY_PREFIX + id;
    const found = await kv.getWithMetadata(key, { type: 'stream' });
    if (!found || !found.value) return notFound(request);
    const metadata = found.metadata || {};
    const filename = metadata.fileName || `proposal-${id}.bin`;
    const headers = baseHeaders({
        'Content-Type': metadata.fileType || 'application/octet-stream',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Content-Disposition': contentDisposition(filename)
    });
    if (metadata.fileSize) headers.set('Content-Length', String(metadata.fileSize));
    return new Response(found.value, { status: 200, headers });
}

export async function deleteProposal(request, env, id) {
    await requireAdmin(request, env);
    const kv = store(env);
    await kv.delete(PROPOSAL_KEY_PREFIX + id);
    await kv.delete(PROPOSAL_FILE_KEY_PREFIX + id);
    return json(request, { ok: true, deleted: id });
}

export async function updateProposal(request, env, id) {
    await requireAdmin(request, env);
    const kv = store(env);
    const raw = await kv.get(PROPOSAL_KEY_PREFIX + id);
    if (!raw) return notFound(request);
    let existing;
    try { existing = JSON.parse(raw); } catch { return notFound(request); }
    const updates = await request.json();
    if (updates.status && ['new', 'in_progress', 'completed', 'archived'].includes(updates.status)) {
        existing.status = updates.status;
    }
    await kv.put(PROPOSAL_KEY_PREFIX + id, JSON.stringify(existing));
    return json(request, { ok: true, proposal: existing });
}

async function handleApi(request, env, url, rest, ctx) {
    try {
        if (rest === 'books') {
            if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed(request, 'GET, HEAD');
            return json(request, { books: await listBooks(env, url.origin) });
        }
        if (rest === 'proposals') {
            if (request.method === 'POST') return await createProposal(request, env);
            if (request.method === 'GET') return await listProposals(request, env);
            return methodNotAllowed(request, 'GET, POST');
        }
        const proposalFileMatch = /^proposals\/([^/]+)\/file$/.exec(rest);
        if (proposalFileMatch) {
            const id = proposalFileMatch[1];
            if (request.method === 'GET' || request.method === 'HEAD') return await downloadProposalFile(request, env, id);
            return methodNotAllowed(request, 'GET, HEAD');
        }
        const proposalMatch = /^proposals\/([^/]+)$/.exec(rest);
        if (proposalMatch) {
            const id = proposalMatch[1];
            if (request.method === 'PATCH') return await updateProposal(request, env, id);
            if (request.method === 'DELETE') return await deleteProposal(request, env, id);
            return methodNotAllowed(request, 'PATCH, DELETE');
        }
        const match = /^books\/([^/]+)(?:\/(parts\/\d{1,3}|commit))?$/.exec(rest);
        if (!match) return notFound(request);
        const slug = match[1];
        if (!isValidSlug(slug)) {
            throw new LibraryError('The web address may only use lowercase letters, numbers and hyphens.', 'library_slug_invalid');
        }
        // Un libro grande llega partido: `parts/<n>` por cada trozo y `commit` al final.
        if (match[2] === 'commit') {
            if (request.method !== 'POST') return methodNotAllowed(request, 'POST');
            return await commitBook(request, env, url, slug, ctx);
        }
        if (match[2]) {
            if (request.method !== 'PUT') return methodNotAllowed(request, 'PUT');
            return await stageBookPart(request, env, url, slug, Number(match[2].slice('parts/'.length)));
        }
        if (request.method === 'PUT') return await publishBook(request, env, url, slug, ctx);
        if (request.method === 'DELETE') return await removeBook(request, env, url, slug, ctx);
        return methodNotAllowed(request, 'PUT, DELETE');
    } catch (error) {
        return errorJson(request, error);
    }
}

// ── Páginas ───────────────────────────────────────────────────────────────────

async function template(env, url, path) {
    const response = await env.ASSETS.fetch(new Request(new URL(path, url.origin), {
        method: 'GET',
        headers: { Accept: 'text/html' }
    }));
    if (!response.ok) throw new LibraryError('The library template is missing.', 'library_template_missing', 500);
    return response;
}

/**
 * Las cabeceras de una plantilla: las del binding (CSP general, HSTS…, que
 * `_headers` aplica a `/library/*`) más las de la biblioteca. El HTML se
 * revalida siempre porque lleva el catálogo dentro. Solo se indexa lo que
 * existe: el aviso de «ese libro no está» responde 404 y `noindex`.
 */
function pageHeaders(response, { indexable = true } = {}) {
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'text/html; charset=utf-8');
    headers.set('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    if (indexable) headers.delete('X-Robots-Tag');
    else headers.set('X-Robots-Tag', 'noindex, follow');
    headers.set('Content-Signal', PUBLIC_CONTENT_SIGNAL);
    headers.delete('Content-Length');
    headers.delete('ETag');
    headers.delete('Last-Modified');
    return headers;
}

const INDEXABLE_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1';

/**
 * Lo que el servidor escribe en inglés lo vuelve a escribir `JS/library.js`
 * en el idioma de quien lee. Aquí solo hace falta que sea correcto y legible
 * sin JavaScript, que es como lo leen casi todos los rastreadores.
 */
const SERVER_LOCALE = 'en-GB';

function languageName(tag) {
    if (!tag) return '';
    const base = tag.split('-')[0].toLowerCase();
    try {
        const name = new Intl.DisplayNames([SERVER_LOCALE], { type: 'language' }).of(base);
        if (name && name.toLowerCase() !== base) return name;
    } catch {
        // Sin datos de idioma: se deja el código.
    }
    return base.toUpperCase();
}

function formatSize(bytes) {
    if (!bytes) return '';
    const megabytes = bytes / (1024 * 1024);
    const value = megabytes >= 1 ? megabytes : bytes / 1024;
    return `${new Intl.NumberFormat(SERVER_LOCALE, { maximumFractionDigits: 1 }).format(value)} ${megabytes >= 1 ? 'MB' : 'KB'}`;
}

function formatDate(iso) {
    const date = new Date(iso || '');
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(SERVER_LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function langAttribute(lang) {
    return lang ? ` lang="${escapeHtml(lang)}"` : '';
}

const HEADPHONES_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="3" y="13" width="4.5" height="7" rx="1.6" fill="currentColor"/><rect x="16.5" y="13" width="4.5" height="7" rx="1.6" fill="currentColor"/></svg>';

/** Las tarjetas del índice, con el mismo marcado que pinta `JS/library.js`. */
export function renderBookCards(books) {
    return books.map(book => {
        const href = `${LIBRARY_PREFIX}/${escapeHtml(book.slug)}`;
        const date = formatDate(book.uploadedAt);
        return `<article class="library-card" data-book="${escapeHtml(book.slug)}">`
            + '<div class="library-card-top"><span class="library-card-langs">'
            + `<span class="library-chip"${book.lang ? ` lang="${SERVER_LOCALE}"` : ''}>${escapeHtml(languageName(book.lang) || 'HTML')}</span>`
            + (book.translations || []).map(language => `<span class="library-chip library-chip-translation" lang="${SERVER_LOCALE}">${escapeHtml(languageName(language))}</span>`).join('')
            + '</span>'
            + `<span class="library-card-size">${escapeHtml(formatSize(book.size))}</span>`
            + '</div><div class="library-card-body">'
            + `<h3${langAttribute(book.lang)}><a href="${href}">${escapeHtml(book.title)}</a></h3>`
            + (book.description ? `<p class="library-card-description"${langAttribute(book.lang)}>${escapeHtml(book.description)}</p>` : '')
            + `<p class="library-card-date">${date ? `Added ${escapeHtml(date)}` : ''}</p>`
            + '<div class="library-card-actions">'
            + `<a class="btn btn-primary" href="${href}">Read</a>`
            + `<button type="button" class="btn library-audio-button" data-audiobook="${escapeHtml(book.slug)}">${HEADPHONES_ICON}<span>Audiobook</span></button>`
            + '</div></div></article>';
    }).join('');
}

/**
 * El índice de capítulos del lector. Los títulos del nivel más alto son las
 * entradas y los del siguiente, sus apartados; lo más profundo se deja fuera.
 * Cada enlace apunta al iframe por su nombre (`target="library-book"`), así que
 * salta al capítulo incluso sin JavaScript.
 */
export function renderOutline(info, book) {
    const title = String(book.title || '').toLowerCase();
    const entries = (info && Array.isArray(info.outline) ? info.outline : [])
        .filter(entry => entry && entry.t && entry.t.toLowerCase() !== title);
    if (!entries.length) return '';
    const top = Math.min(...entries.map(entry => entry.l));
    const items = [];
    for (const entry of entries) {
        if (entry.l === top || !items.length) items.push({ ...entry, children: [] });
        else if (entry.l === top + 1) items[items.length - 1].children.push(entry);
    }
    const file = `${LIBRARY_PREFIX}/${escapeHtml(book.slug)}/book`;
    const link = entry => (entry.id
        ? `<a href="${file}#${escapeHtml(entry.id)}" target="library-book" data-library-toc>${escapeHtml(entry.t)}</a>`
        : `<span>${escapeHtml(entry.t)}</span>`);
    return items.map(item => `<li>${link(item)}${item.children.length
        ? `<ol>${item.children.map(child => `<li>${link(child)}</li>`).join('')}</ol>`
        : ''}</li>`).join('');
}

function renderMoreBooks(books, slug) {
    return books.filter(entry => entry.slug !== slug).slice(0, 6).map(entry => `<li><a href="${LIBRARY_PREFIX}/${escapeHtml(entry.slug)}"${langAttribute(entry.lang)}>`
        + `<span class="library-more-title">${escapeHtml(entry.title)}</span>`
        + (entry.description ? `<span class="library-more-text">${escapeHtml(entry.description)}</span>` : '')
        + '</a></li>').join('');
}

const LIBRARY_NAME = 'Elysium λ Library';
const ORGANIZATION = { '@type': 'Organization', name: 'Elysium λ Development & Research', url: `${LIBRARY_ORIGIN}/` };

function breadcrumbs(extra = []) {
    const items = [
        { name: 'Elysium λ', item: `${LIBRARY_ORIGIN}/` },
        { name: 'Library', item: `${LIBRARY_ORIGIN}${LIBRARY_PREFIX}` },
        ...extra
    ];
    return {
        '@type': 'BreadcrumbList',
        itemListElement: items.map((entry, index) => ({ '@type': 'ListItem', position: index + 1, ...entry }))
    };
}

function indexJsonLd(books) {
    const url = `${LIBRARY_ORIGIN}${LIBRARY_PREFIX}`;
    return jsonForScript({
        '@context': 'https://schema.org',
        '@graph': [{
            '@type': 'CollectionPage',
            '@id': `${url}#library`,
            url,
            name: LIBRARY_NAME,
            description: 'Books and study materials to read online, full screen on any device, or to listen to as audiobooks. Free, to encourage reading and research.',
            isAccessibleForFree: true,
            provider: ORGANIZATION,
            mainEntity: {
                '@type': 'ItemList',
                numberOfItems: books.length,
                itemListElement: books.map((book, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    url: bookUrl(book.slug),
                    name: book.title
                }))
            }
        }, breadcrumbs()]
    });
}

/**
 * Los datos estructurados del lector. Solo lo que se sabe de verdad: el autor
 * únicamente si el propio libro lo declara (`<meta name="author">`), y ni
 * editorial ni ISBN, que serían de la obra original y no de esta edición.
 */
function bookJsonLd(book, info, description) {
    const url = bookUrl(book.slug);
    const title = book.title.toLowerCase();
    const outline = (info.outline || []).filter(entry => entry.t.toLowerCase() !== title);
    const top = outline.length ? Math.min(...outline.map(entry => entry.l)) : 0;
    const chapters = outline.filter(entry => entry.l === top).slice(0, 40);
    const node = {
        '@type': 'Book',
        '@id': `${url}#book`,
        name: book.title,
        url,
        mainEntityOfPage: url,
        bookFormat: 'https://schema.org/EBook',
        isAccessibleForFree: true,
        provider: ORGANIZATION
    };
    if (description) node.description = description;
    if (book.lang) node.inLanguage = book.lang;
    if (info.author) node.author = { '@type': 'Person', name: info.author };
    if (book.uploadedAt) node.dateModified = book.uploadedAt;
    if (chapters.length) {
        node.hasPart = chapters.map((entry, index) => ({ '@type': 'Chapter', position: index + 1, name: entry.t }));
    }
    return jsonForScript({
        '@context': 'https://schema.org',
        '@graph': [node, breadcrumbs([{ name: book.title, item: url }])]
    });
}

async function catalog(env, url) {
    try {
        return { books: await listBooks(env, url.origin), configured: true };
    } catch (error) {
        if (error instanceof LibraryError && error.code === 'library_not_configured') return { books: [], configured: false };
        throw error;
    }
}

async function serveIndex(request, env, url, { status = 200, missing = '' } = {}) {
    const response = await template(env, url, `${LIBRARY_PREFIX}/`);
    const { books, configured } = await catalog(env, url);
    const indexable = status === 200 && !isMirror(url);
    const html = renderTemplate(await response.text(), {
        ROBOTS: indexable ? INDEXABLE_ROBOTS : 'noindex, follow',
        LIBRARY_JSON_LD: indexJsonLd(books),
        LIBRARY_CARDS: renderBookCards(books),
        LIBRARY_DATA: jsonForScript({ books, missing, configured })
    });
    return new Response(request.method === 'HEAD' ? null : html, {
        status,
        headers: pageHeaders(response, { indexable })
    });
}

/**
 * Autor e índice del libro. Los libros subidos antes de que existiera
 * `info:` (o con una versión vieja) se leen una vez aquí y se guarda el
 * resultado; si algo falla, el lector sale igual, solo que sin índice.
 */
async function bookInfo(env, slug) {
    const empty = { v: INFO_VERSION, author: '', description: '', outline: [] };
    const kv = env.LIBRARY;
    if (!kv) return empty;
    try {
        const stored = await kv.get(INFO_KEY_PREFIX + slug, { cacheTtl: 60 });
        if (stored) {
            const info = JSON.parse(stored);
            if (info && info.v === INFO_VERSION) return info;
        }
        const previous = stored ? JSON.parse(stored) : null;
        const book = await kv.getWithMetadata(BOOK_KEY_PREFIX + slug);
        if (!book || !book.value) return empty;
        const metadata = book.metadata || {};
        const count = partCount(metadata);
        // En un libro partido, el valor de `book:` es solo el manifiesto.
        const info = count > 1
            ? (await readParts(kv, slug, metadata.rev, count)).info
            : extractBookInfo(book.value);
        if (previous && Array.isArray(previous.translations)) info.translations = previous.translations;
        await kv.put(INFO_KEY_PREFIX + slug, JSON.stringify(info));
        return info;
    } catch (error) {
        console.warn('[library] book outline unavailable:', error);
        return empty;
    }
}

async function serveReader(request, env, url, slug) {
    const { books } = await catalog(env, url);
    let book = books.find(entry => entry.slug === slug);
    if (!book && env.LIBRARY) {
        // El catálogo cacheado puede ir un minuto por detrás de una subida.
        const found = await env.LIBRARY.getWithMetadata(BOOK_KEY_PREFIX + slug, { type: 'stream' });
        if (found && found.value) {
            await found.value.cancel();
            book = publicBook(slug, found.metadata || {});
        }
    }
    if (!book) return serveIndex(request, env, url, { status: 404, missing: slug });

    const info = await bookInfo(env, slug);
    const description = book.description || info.description
        || `${book.title}. Read it online, full screen on any device, or listen to it as an audiobook.`;
    const toc = renderOutline(info, book);
    const more = renderMoreBooks(books, slug);
    const response = await template(env, url, `${LIBRARY_PREFIX}/reader`);
    const html = renderTemplate(await response.text(), {
        BOOK_TITLE: escapeHtml(book.title),
        BOOK_SLUG: escapeHtml(book.slug),
        BOOK_LANG: escapeHtml(book.lang),
        BOOK_URL: escapeHtml(bookUrl(book.slug)),
        BOOK_DESCRIPTION: escapeHtml(description),
        BOOK_OG_LOCALE: escapeHtml((book.lang || SERVER_LOCALE).replace('-', '_')),
        BOOK_AUTHOR: info.author ? `<p class="library-about-author"${langAttribute(book.lang)}>${escapeHtml(info.author)}</p>` : '',
        BOOK_LANGUAGE_NAME: escapeHtml(languageName(book.lang) || '—'),
        BOOK_DATE: escapeHtml(book.uploadedAt || ''),
        BOOK_DATE_TEXT: escapeHtml(formatDate(book.uploadedAt) || '—'),
        BOOK_TOC: toc,
        BOOK_TOC_HIDDEN: toc ? '' : 'hidden',
        BOOK_MORE: more,
        BOOK_MORE_HIDDEN: more ? '' : 'hidden',
        BOOK_JSON_LD: bookJsonLd(book, info, description),
        BOOK_DATA: jsonForScript({
            ...book,
            author: info.author || '',
            translations: (book.translations && book.translations.length ? book.translations : info.translations || [])
                .filter(language => TRANSLATION_LANGUAGES.includes(language))
        })
    });
    return new Response(request.method === 'HEAD' ? null : html, {
        status: 200,
        headers: pageHeaders(response, { indexable: !isMirror(url) })
    });
}

/**
 * El sitemap de la biblioteca, aparte del estático de la raíz: los libros no
 * están en el repositorio. `robots.txt` lo anuncia en `.eu`.
 */
async function serveSitemap(request, env, url) {
    const { books } = await catalog(env, url);
    const entry = (loc, lastmod) => `  <url>\n    <loc>${escapeHtml(loc)}</loc>\n${lastmod ? `    <lastmod>${escapeHtml(lastmod)}</lastmod>\n` : ''}  </url>\n`;
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + entry(`${LIBRARY_ORIGIN}${LIBRARY_PREFIX}`, books[0]?.uploadedAt || '')
        + books.map(book => entry(bookUrl(book.slug), book.uploadedAt || '')).join('')
        + '</urlset>\n';
    return new Response(request.method === 'HEAD' ? null : xml, {
        status: 200,
        headers: baseHeaders({
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=900'
        })
    });
}

/**
 * La biblioteca como app instalable. Instalada en la pantalla de inicio, el
 * modo de lectura a pantalla completa ocupa de verdad toda la pantalla,
 * también en el iPhone, donde Safari no deja poner una página a pantalla
 * completa desde el navegador.
 */
export const LIBRARY_MANIFEST = {
    id: LIBRARY_PREFIX,
    name: LIBRARY_NAME,
    short_name: 'Library',
    description: 'Books and study materials to read online, full screen, or to listen to as audiobooks.',
    lang: 'en-GB',
    start_url: LIBRARY_PREFIX,
    // Sin barra final: el ámbito se compara como prefijo y tiene que incluir
    // el propio `/library`, que es la dirección de inicio.
    scope: LIBRARY_PREFIX,
    display: 'standalone',
    background_color: '#020410',
    theme_color: '#020410',
    categories: ['books', 'education'],
    icons: [
        { src: '/Images/favicon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/Images/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' }
    ]
};

function serveManifest(request) {
    return new Response(request.method === 'HEAD' ? null : JSON.stringify(LIBRARY_MANIFEST), {
        status: 200,
        headers: baseHeaders({
            'Content-Type': 'application/manifest+json; charset=utf-8',
            'Cache-Control': 'public, max-age=86400'
        })
    });
}

async function serveBookFile(request, env, slug, { download, language = null, mirror = false }) {
    const kv = store(env);
    const key = language ? `${TRANSLATION_KEY_PREFIX}${slug}:${language}` : BOOK_KEY_PREFIX + slug;
    const found = await kv.getWithMetadata(key, { type: 'stream' });
    if (!found || !found.value) return notFound(request);
    const metadata = found.metadata || {};
    // Las traducciones son siempre un solo valor; el original puede ir partido.
    const parts = language ? 1 : partCount(metadata);
    const headers = baseHeaders({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, max-age=0, must-revalidate',
        'Cross-Origin-Resource-Policy': 'same-origin'
    });
    if (metadata.uploadedAt) headers.set('Last-Modified', new Date(metadata.uploadedAt).toUTCString());
    if (download) {
        headers.set('Content-Security-Policy', DOWNLOAD_CSP);
        const filename = downloadFilename(metadata.file, slug);
        headers.set('Content-Disposition', contentDisposition(language ? filename.replace(/(\.html?)$/i, `.${language}$1`) : filename));
        // Un libro partido se une al vuelo y el navegador no sabrá el total: va por trozos.
        if (metadata.size && parts === 1) headers.set('Content-Length', String(metadata.size));
    } else {
        headers.set('Content-Security-Policy', BOOK_CSP);
        // Esta URL suelta no se indexa (no lleva ni la cabecera de Elysium ni
        // el botón de volver), pero su texto sí cuenta como parte del lector
        // que la enmarca: es la página que debe salir en los resultados.
        headers.set('X-Robots-Tag', mirror ? 'noindex' : 'noindex, indexifembedded');
        headers.set('Content-Signal', PUBLIC_CONTENT_SIGNAL);
    }

    // HEAD lleva las mismas cabeceras que GET, solo sin el cuerpo.
    if (request.method === 'HEAD') {
        await found.value.cancel();
        return new Response(null, { status: 200, headers });
    }
    let source = found.value;
    if (parts > 1) {
        await found.value.cancel();
        source = joinParts(kv, slug, metadata.rev, parts);
    }
    const body = download ? source : injectBeforeHeadClose(source, BOOK_HELPER);
    return new Response(body, { status: 200, headers });
}

// ── Entrada ───────────────────────────────────────────────────────────────────

/**
 * Atiende cualquier ruta de `isLibraryPath()`, en los cuatro dominios (ver
 * `isMirror`). Lo que no se puede duplicar —el sitemap— redirige a `.eu`.
 */
export async function handleLibrary(request, env, url, ctx) {
    // La API no se redirige nunca: un PUT redirigido se perdería por el camino.
    // Un slug mal escrito ahí es un 400, no una URL que corregir.
    const apiPrefix = `${LIBRARY_PREFIX}/api/`;
    if (url.pathname.startsWith(apiPrefix)) return handleApi(request, env, url, url.pathname.slice(apiPrefix.length), ctx);

    // Una sola forma de escribir cada página: en minúsculas (los slugs lo son),
    // sin `.html`, sin barra final y sin `index`.
    const lower = url.pathname.toLowerCase();
    if (lower !== url.pathname) return permanentRedirect(url, lower);
    if (['/library.html', '/library/', '/library/index', '/library/index.html'].includes(url.pathname)) {
        return permanentRedirect(url, LIBRARY_PREFIX);
    }

    const rest = url.pathname.slice(LIBRARY_PREFIX.length).replace(/^\//, '');
    if (rest === 'api') return notFound(request);

    if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed(request, 'GET, HEAD');

    try {
        if (rest === '') return await serveIndex(request, env, url);
        // Llevan punto, así que nunca pueden ser el slug de un libro.
        // El sitemap y sus URL son de `.eu`; los espejos no tienen el suyo.
        if (rest === 'sitemap.xml') return isMirror(url) ? redirectToPrimary(url) : await serveSitemap(request, env, url);
        if (rest === 'manifest.webmanifest') return serveManifest(request);

        const segments = rest.split('/');
        const slug = segments[0].replace(/\.html$/, '');
        if (!isValidSlug(slug)) return notFound(request);
        if (segments[0] !== slug || (segments.length === 2 && segments[1] === '')) {
            return permanentRedirect(url, `${LIBRARY_PREFIX}/${slug}`);
        }
        if (segments.length === 1) return await serveReader(request, env, url, slug);
        // `?lang=` pide una traducción guardada; sin él, el original.
        const requested = url.searchParams.get('lang');
        const language = TRANSLATION_LANGUAGES.includes(requested) ? requested : null;
        if (requested && !language && segments.length === 2) return notFound(request);
        if (segments.length === 2 && segments[1] === 'book') return await serveBookFile(request, env, slug, { download: false, language, mirror: isMirror(url) });
        if (segments.length === 2 && segments[1] === 'download') return await serveBookFile(request, env, slug, { download: true, language, mirror: isMirror(url) });
        return notFound(request);
    } catch (error) {
        if (error instanceof LibraryError && error.code === 'library_not_configured') return notFound(request);
        console.error('[library] page error:', error);
        return new Response(request.method === 'HEAD' ? null : 'The library is temporarily unavailable.', {
            status: 500,
            headers: baseHeaders({ 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
        });
    }
}
