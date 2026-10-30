/**
 * tools.elysiumdr.eu — Elysium Tools, las herramientas públicas.
 *
 * Es un subdominio y no una carpeta de elysiumdr.eu, a propósito: un
 * descargador de videos público atrae avisos de copyright, y Google baja en los
 * resultados al sitio entero que los acumula. Aquí, si llegan, no arrastran a
 * la web de la empresa. La cabecera y el pie del sitio enlazan igual.
 *
 * Las páginas son ficheros del repositorio en `tools/`, generados por
 * `scripts/build-tools.mjs`: `tools.elysiumdr.eu/es/unir-pdf/` sirve
 * `tools/es/unir-pdf/index.html`. Los recursos compartidos (`/CSS/`, `/JS/`,
 * `/Images/`, los favicons) son los del sitio, tal cual.
 *
 * La API pública (`/api/tools/public/*`) solo existe en este host. Cada POST
 * pasa por Turnstile; si lo supera, el Worker añade la clave de la pasarela y
 * la IP de quien pregunta, y lo reenvía a `elysium-tools`, que limita por
 * visitante (ver `backend/tools/public-tools.js`). Los ficheros listos
 * (`/api/tools/files/:token`) se recogen sin más: el token ya es la
 * autorización.
 *
 * Configuración: `ELYSIUM_TOOLS_ORIGIN` y `TURNSTILE_SITE_KEY` en
 * `wrangler.jsonc`; `TOOLS_PUBLIC_GATEWAY_KEY` y `TURNSTILE_SECRET_KEY` como
 * secretos del Worker. Sin cualquiera de ellos, la API pública responde 503
 * `public_tools_disabled` y las páginas lo dicen, en vez de quedar abiertas sin
 * protección.
 */

export const TOOLS_HOST = 'tools.elysiumdr.eu';
export const TOOLS_ORIGIN = `https://${TOOLS_HOST}`;

const PAGES_ROOT = '/tools';
const PUBLIC_API = '/api/tools/public/';
const CONFIG_PATH = '/api/tools/public/config';
const FILES_API = '/api/tools/files/';
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Lo que este host publica en su raíz además de las páginas.
const DISCOVERY_FILES = new Map([
    ['/robots.txt', '/tools/robots.txt'],
    ['/sitemap.xml', '/tools/sitemap.xml'],
    ['/llms.txt', '/tools/llms.txt'],
    ['/llms-full.txt', '/tools/llms-full.txt'],
    ['/catalog.json', '/tools/catalog.json']
]);

// Recursos del sitio que las páginas comparten. El `.txt` de 32 hexadecimales
// es la clave de IndexNow, que tiene que estar en la raíz de cada host avisado.
const SHARED_ASSET = /^\/(?:CSS|JS|Images|fonts)\/|^\/(?:favicon[\w.-]*|apple-touch-icon[\w.-]*\.png|[0-9a-f]{32}\.txt)$/;

// Cabeceras que solo puede poner el Worker. Si llegan de fuera, se tiran.
const TRUSTED_HEADERS = ['X-Elysium-Public-Key', 'X-Elysium-Client-IP', 'X-Turnstile-Token'];

// Las claves de prueba de Turnstile (`1x0000…AA` y compañía) firman con el
// host `example.com`; solo con ellas se acepta ese host.
const TEST_SECRET = /^[123]x0{20,}/;

function json(body, status = 200, headers = {}) {
    return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

function moved(location) {
    return new Response(null, { status: 301, headers: { Location: location } });
}

/**
 * `/tools` en elysiumdr.eu, .es, .pt o .com lleva a la portada del subdominio
 * en el idioma de quien llega: la carpeta (`/es/tools`) o, sin carpeta, el del
 * dominio nacional. Las rutas de debajo nunca estuvieron publicadas en el
 * dominio principal, así que no hay slugs viejos que conservar.
 */
export function toolsRedirectTarget(pathname, nationalLanguage = null) {
    const match = /^\/(?:(es|pt)\/)?tools(?:\/|\.html$|$)/.exec(pathname);
    if (!match) return null;
    const language = match[1] || (['es', 'pt'].includes(nationalLanguage) ? nationalLanguage : 'en');
    return `${TOOLS_ORIGIN}${language === 'en' ? '/' : `/${language}/`}`;
}

function serviceOrigin(env) {
    return String(env.ELYSIUM_TOOLS_ORIGIN || '').trim().replace(/\/$/, '');
}

/**
 * Turnstile, con la respuesta del navegador en `X-Turnstile-Token`. Un token
 * vale una sola vez y cinco minutos: la página pide uno por operación.
 */
async function verifyTurnstile(request, env, url) {
    const token = request.headers.get('X-Turnstile-Token') || '';
    if (!token || token.length > 2048) return { ok: false, code: 'turnstile_required' };
    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRET_KEY);
    form.append('response', token);
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) form.append('remoteip', ip);
    let outcome;
    try {
        const response = await fetch(SITEVERIFY_URL, { method: 'POST', body: form });
        outcome = await response.json();
    } catch {
        return { ok: false, code: 'turnstile_unavailable' };
    }
    if (!outcome?.success) return { ok: false, code: 'turnstile_failed' };
    // El widget es de este host: un token emitido en otra web no vale aquí.
    const testing = TEST_SECRET.test(String(env.TURNSTILE_SECRET_KEY));
    if (outcome.hostname && outcome.hostname !== url.hostname && !(testing && outcome.hostname === 'example.com')) {
        return { ok: false, code: 'turnstile_failed' };
    }
    return { ok: true };
}

/** Reenvía al servicio sin leer la respuesta: el progreso llega línea a línea. */
async function forward(request, env, url, { gateway = false } = {}) {
    const upstream = new Request(new URL(url.pathname + url.search, serviceOrigin(env)), request);
    for (const header of TRUSTED_HEADERS) upstream.headers.delete(header);
    // La API pública no conoce sesiones: ni la del CRM ni ninguna otra.
    upstream.headers.delete('Authorization');
    upstream.headers.delete('Cookie');
    if (gateway) {
        upstream.headers.set('X-Elysium-Public-Key', env.TOOLS_PUBLIC_GATEWAY_KEY);
        upstream.headers.set('X-Elysium-Client-IP', request.headers.get('CF-Connecting-IP') || '0.0.0.0');
    }
    upstream.headers.set('X-Forwarded-Host', url.host);
    upstream.headers.set('X-Forwarded-Proto', 'https');
    try {
        const response = await fetch(upstream);
        const headers = new Headers(response.headers);
        if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
        headers.set('X-Robots-Tag', 'noindex');
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch {
        return json({ error: 'The tools service did not answer.', code: 'tools_unreachable' }, 502);
    }
}

async function handleApi(request, env, url) {
    if (url.pathname === CONFIG_PATH) {
        if (!['GET', 'HEAD'].includes(request.method)) return json({ code: 'method_not_allowed' }, 405, { Allow: 'GET, HEAD' });
        return json({ turnstileSiteKey: String(env.TURNSTILE_SITE_KEY || '') }, 200, { 'Cache-Control': 'public, max-age=300' });
    }

    if (url.pathname.startsWith(FILES_API)) {
        if (!['GET', 'HEAD'].includes(request.method)) return json({ code: 'method_not_allowed' }, 405, { Allow: 'GET, HEAD' });
        if (!serviceOrigin(env)) return json({ code: 'public_tools_disabled' }, 503);
        return forward(request, env, url);
    }

    if (url.pathname.startsWith(PUBLIC_API)) {
        const ready = serviceOrigin(env) && env.TOOLS_PUBLIC_GATEWAY_KEY && env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY;
        if (!ready) {
            return json({ error: 'The public tools are not enabled yet.', code: 'public_tools_disabled' }, 503);
        }
        if (request.method === 'POST') {
            // Solo desde las propias páginas: otra web no puede usar el servicio
            // con la IP de sus visitantes.
            if (request.headers.get('Origin') !== url.origin) return json({ code: 'origin_not_allowed' }, 403);
            const human = await verifyTurnstile(request, env, url);
            if (!human.ok) {
                return json({ error: 'The human check did not pass. Try again.', code: human.code }, human.code === 'turnstile_unavailable' ? 503 : 403);
            }
        }
        return forward(request, env, url, { gateway: true });
    }

    return json({ error: 'Not found.', code: 'not_found' }, 404);
}

/** La página 404 en el idioma de la ruta, con su estado de verdad. */
async function notFound(request, env, url) {
    const language = /^\/(es|pt)\//.exec(url.pathname)?.[1];
    // Sin extensión: con `.html` el binding de assets redirigiría.
    const page = new URL(`${PAGES_ROOT}${language ? `/${language}` : ''}/404`, url);
    const response = await env.ASSETS.fetch(new Request(page, { method: 'GET' }));
    const headers = new Headers(response.ok ? response.headers : { 'Content-Type': 'text/plain; charset=utf-8' });
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Robots-Tag', 'noindex');
    const body = request.method === 'HEAD' ? null : (response.ok ? response.body : 'Not found.');
    return new Response(body, { status: 404, headers });
}

/**
 * Atiende `tools.elysiumdr.eu`. `serveAsset` es el de `index.js`: entrega en
 * Markdown la misma página cuando lo pide un agente (`Accept: text/markdown`).
 */
export async function handleToolsSite(request, env, url, { serveAsset }) {
    const path = url.pathname;

    if (path.startsWith('/api/')) return handleApi(request, env, url);

    if (!['GET', 'HEAD'].includes(request.method)) {
        return new Response('Method not allowed.', { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
    }

    if (SHARED_ASSET.test(path)) return serveAsset(request, env);

    const discovery = DISCOVERY_FILES.get(path);
    if (discovery) {
        const response = await env.ASSETS.fetch(new Request(new URL(discovery, url), { method: request.method }));
        return response.ok ? response : notFound(request, env, url);
    }

    // Los `.well-known` de elysiumdr.eu describen la web de la empresa; este
    // host no publica ninguno.
    if (path.startsWith('/.well-known/')) return notFound(request, env, url);

    // Las URL canónicas acaban en barra y no llevan `.html`. Se canonizan aquí:
    // si lo hiciera el binding de assets, la redirección apuntaría a `/tools/…`.
    if (path.endsWith('/index.html')) return moved(`${url.origin}${path.slice(0, -'index.html'.length)}${url.search}`);
    if (/\.html$/i.test(path) || path.includes('//') || /(^|\/)\.\.?(\/|$)/.test(path)) return notFound(request, env, url);
    if (!path.endsWith('/')) {
        if (/\.[a-z0-9]{1,8}$/i.test(path)) return notFound(request, env, url);
        // Solo se redirige a una página que existe: una URL inventada da 404
        // directamente, sin una redirección por medio.
        const exists = await env.ASSETS.fetch(new Request(new URL(`${PAGES_ROOT}${path}/`, url), { method: 'HEAD' }));
        if (!exists.ok) return notFound(request, env, url);
        return moved(`${url.origin}${path}/${url.search}`);
    }

    const page = new URL(`${PAGES_ROOT}${path}`, url);
    const response = await serveAsset(request, env, new Request(page, request));
    if (response.status === 404 || response.status >= 300 && response.status < 400) return notFound(request, env, url);
    const headers = new Headers(response.headers);
    headers.append('Vary', 'Accept');
    return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, headers });
}
