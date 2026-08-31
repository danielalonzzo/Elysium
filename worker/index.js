/**
 * Elysium — el Worker que sirve el sitio.
 *
 * El sitio entero son ficheros estáticos y así sigue. Este Worker hace tres
 * cosas, y nada más:
 *
 *   1. Reparte a quien entra por `elysiumdr.eu` según su país (ver «Entrada»).
 *   2. Sirve los dominios nacionales (`.es`, `.pt`) en su idioma sin que la URL
 *      lleve prefijo: `elysiumdr.es/services` entrega la base interna
 *      `_national/es/services.html`, separada del español de Costa Rica en
 *      `es/services.html` que publica el dominio europeo.
 *   3. Reenvía `/api/*` a `elysium-billing` (el servicio de `backend/`), que es
 *      quien agenda reuniones, entrega el correo del CRM, genera recuperaciones
 *      de contraseña, recibe consultas públicas y firma el acceso privado a R2.
 *      Mantenerlo bajo el mismo origen evita CORS para la API; el PUT binario va
 *      directamente al endpoint R2 permitido por la CSP y el CORS del bucket.
 *
 * Todo lo demás vuelve a los assets sin tocarlo, con su `html_handling:
 * auto-trailing-slash` intacto — de él dependen todas las URLs públicas.
 *
 * Configuración: la variable `ELYSIUM_API_ORIGIN` apunta al servicio
 * desplegado (por ejemplo `https://elysium-billing-xxxx.europe-west1.run.app`).
 * Sin ella, `/api/*` responde 503 con un código que el CRM sabe traducir a
 * «el servicio no está desplegado» en vez de dar un 404 mudo.
 */

import { htmlToMarkdown, estimateTokens } from './html-to-markdown.js';

const API_PREFIX = '/api/';

// ── Entrada: el reparto por país en elysiumdr.eu ──────────────────────────────

/**
 * `.eu` es la puerta de entrada y el sitio europeo a la vez. Quien llega a su
 * portada se va a donde le corresponde:
 *
 *   España            → elysiumdr.es
 *   Portugal          → elysiumdr.pt
 *   Resto de hispanohablantes (Costa Rica incluida) → elysiumdr.eu/es/
 *   Resto de lusófonos                              → elysiumdr.eu/pt/
 *   Cualquier otro país                             → elysiumdr.eu/ (inglés)
 *
 * Costa Rica va de momento al sitio europeo en español porque `elysiumdr.cr`
 * todavía no está registrado. El día que se compre, hay cuatro sitios que
 * cambiar a la vez —si se hace solo uno, el visitante acaba en un dominio que
 * no resuelve, que es exactamente el fallo que había aquí antes:
 *
 *   1. `NATIONAL_DOMAINS`: añadir `['CR', 'https://elysiumdr.cr']`.
 *   2. `SPANISH_SPEAKING`: quitar `'CR'` (ya lo cubre lo anterior).
 *   3. `LOCALIZED_HOSTS`: añadir `['elysiumdr.cr', 'es']`.
 *   4. El HTML: los seis selectores de región (`index.html`, `about.html` y sus
 *      versiones `es/` y `pt/`) y los `hreflang="es-CR"`, que hoy apuntan a
 *      `https://elysiumdr.eu/es/`. Se encuentran con:
 *          grep -rn 'data-region="CR"\|hreflang="es-CR"' --include='*.html' .
 *
 * Dos límites deliberados:
 *
 *  - **Solo la portada.** Un enlace profundo compartido tiene que abrir la
 *    página que se compartió, no la portada de otro dominio.
 *  - **La cookie manda.** Quien usa el selector de región del encabezado deja
 *    `elysium_region_override=true` (lo escriben `JS/main.js` y
 *    `JS/elysium-i18n.js`) y a partir de ahí nadie le vuelve a mover.
 */
const NATIONAL_DOMAINS = new Map([
    ['ES', 'https://elysiumdr.es'],
    ['PT', 'https://elysiumdr.pt']
]);

/** Hispanohablantes salvo España: sitio europeo, en español. */
const SPANISH_SPEAKING = new Set([
    'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GQ', 'GT',
    'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE'
]);

/**
 * Lusófonos salvo Portugal: sitio europeo, en portugués. Guinea Ecuatorial
 * (`GQ`) tiene el portugués como cooficial pero se atiende en español, que es
 * la lengua real del país; por eso está en la lista de arriba y no en esta.
 */
const PORTUGUESE_SPEAKING = new Set([
    'AO', 'BR', 'CV', 'GW', 'MO', 'MZ', 'ST', 'TL'
]);

/** A dónde mandar a quien entra por la portada de `.eu`; `null` = se queda. */
function entryTargetFor(country) {
    if (!country) return null;
    const national = NATIONAL_DOMAINS.get(country);
    if (national) return national + '/';
    if (SPANISH_SPEAKING.has(country)) return '/es/';
    if (PORTUGUESE_SPEAKING.has(country)) return '/pt/';
    return null;
}

// ── Dominios nacionales ───────────────────────────────────────────────────────

/** Solo el ápice: los `www.` se redirigen antes de llegar hasta aquí (paso 0). */
const LOCALIZED_HOSTS = new Map([
    ['elysiumdr.es', 'es'],
    ['elysiumdr.pt', 'pt']
]);

/**
 * Bases privadas de los sitios nacionales. Nunca se exponen como URL pública:
 * el Worker solo las pide internamente al binding de assets.
 */
const NATIONAL_ASSET_BASES = new Map([
    ['es', '/_national/es'],
    ['pt', '/_national/pt']
]);

/**
 * Las páginas que existen traducidas, y solo esas.
 *
 * Es la pieza que arregla el fallo que traían los dominios nacionales: antes se
 * anteponía el idioma a **cualquier** ruta, así que todo lo que no está
 * traducido —`/profiles`, `/admin`, los subsitios `/ONCORE/`, `/Demo-arbol/`,
 * `/VALTRIX Engineering/`…— pedía un fichero inexistente y daba 404. `/profiles`
 * y `/admin` era peor todavía: la regla de `_redirects` los devolvía a la misma
 * URL y el navegador se quedaba en un bucle de redirecciones.
 *
 * Con la lista al revés, lo que no está aquí se sirve tal cual desde la raíz. Un
 * enlace nuevo sin traducir se ve en inglés en vez de romperse, y se incorpora
 * al idioma añadiéndolo aquí el día que se traduzca.
 *
 * La clave es la URL pública sin barra inicial ni extensión (`''` es la
 * portada). Para regenerarla tras añadir páginas nacionales:
 *
 *     cd _national/es && find . -type f \( -name '*.html' -o -name '*.txt' \) \
 *       | sed 's|^\./||; s|\.html$||; s|^index$||' | sort
 */
const LOCALIZED_PAGES = new Map([
    ['es', new Set([
        '', 'about', 'case-moyra', 'case-pmorais', 'case-valtrix', 'contact',
        'daniel-morales', 'llms-full.txt', 'llms.txt',
        'onboarding', 'portfolio', 'privacy', 'prototype-moyra',
        'prototype-pmorais', 'prototype-valtrix', 'research',
        'research/data-driven-sme-intelligence', 'research/ontology-research',
        'review-pmorais', 'services', 'terms', 'thank-you'
    ])],
    ['pt', new Set([
        '', 'about', 'case-moyra', 'case-pmorais', 'case-valtrix', 'contact',
        'daniel-morales', 'llms-full.txt', 'llms.txt', 'onboarding', 'portfolio', 'privacy',
        'prototype-moyra', 'prototype-pmorais', 'prototype-valtrix', 'research',
        'research/data-driven-sme-intelligence', 'research/ontology-research',
        'review-pmorais', 'services', 'terms', 'thank-you'
    ])]
]);

/**
 * Páginas HTML que puede entregar `/__i18n`. El endpoint no es un proxy de
 * ficheros arbitrarios: solo acepta una URL canónica que exista en el sitio
 * nacional desde el que se solicita. Las páginas inglesas son la intersección
 * de las dos colecciones europeas. Las antiguas landings regionales no entran
 * aquí: se canonizan a su portada/host antes de servir HTML.
 */
const NATIONAL_HTML_PAGES = new Map(
    [...LOCALIZED_PAGES].map(([language, pages]) => [
        language,
        new Set([...pages].filter(page => !page.endsWith('.txt')))
    ])
);
const COMMON_EUROPEAN_HTML_PAGES = new Set(
    [...NATIONAL_HTML_PAGES.get('es')]
        .filter(page => NATIONAL_HTML_PAGES.get('pt').has(page))
);
const EUROPEAN_HTML_PAGES = new Map([
    ['en', COMMON_EUROPEAN_HTML_PAGES],
    ['es', NATIONAL_HTML_PAGES.get('es')],
    ['pt', NATIONAL_HTML_PAGES.get('pt')]
]);

const I18N_PATH = '/__i18n';
const PRIVATE_NATIONAL_PATH = /^\/_national(?:\/|$)/;
const SITEMAP_PATH = '/sitemap.xml';
const ROBOTS_PATH = '/robots.txt';

/** Estas páginas son públicas para poder mostrar su `noindex`, pero no sitemap. */
const NATIONAL_NOINDEX_PAGES = new Set(['onboarding', 'thank-you']);

/** Exclusiones editoriales adicionales del sitemap nacional. */
const NATIONAL_SITEMAP_EXCLUSIONS = new Map([
    ['es', new Set()],
    ['pt', new Set()]
]);

/**
 * Las landings regionales heredadas duplicaban la portada nacional y no
 * disponían de traducciones completas. Se conservan como redirecciones
 * canónicas: Costa Rica vive en `.eu/es/`; España y Portugal, en sus dominios.
 */
const REGIONAL_LANDING_SLUGS = new Set([
    'infraestructura-digital-pymes-costa-rica',
    'infraestructura-digital-pymes-espana',
    'infraestrutura-digital-pme-portugal'
]);

// ── Rutas heredadas ───────────────────────────────────────────────────────────

const LEGACY_PROFILE_LANGUAGES = new Map([
    ['/es/profiles', 'es'],
    ['/es/profiles/', 'es'],
    ['/es/profiles.html', 'es'],
    ['/pt/profiles', 'pt'],
    ['/pt/profiles/', 'pt'],
    ['/pt/profiles.html', 'pt']
]);
const LEGACY_ADMIN_LANGUAGES = new Map([
    ['/es/admin', 'es'],
    ['/es/admin/', 'es'],
    ['/es/admin.html', 'es'],
    ['/pt/admin', 'pt'],
    ['/pt/admin/', 'pt'],
    ['/pt/admin.html', 'pt']
]);

// ── Utilidades ────────────────────────────────────────────────────────────────

/**
 * Una redirección que no se guarda en ninguna caché. La del reparto por país
 * depende de quién pregunta, así que una copia cacheada mandaría a todo el
 * mundo al país del primero que pasó por ahí.
 */
function redirect(location, status, { cacheable = true } = {}) {
    const headers = new Headers({ Location: location });
    if (!cacheable) {
        headers.set('Cache-Control', 'no-store');
        headers.set('Vary', 'Cookie');
    }
    return new Response(null, { status, headers });
}

function plainError(request, status, message, allow = null) {
    const headers = new Headers({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
    });
    if (allow) headers.set('Allow', allow);
    return new Response(request.method === 'HEAD' ? null : message, { status, headers });
}

/**
 * Solo se admiten slugs canónicos publicados: sin extensión, query, barras
 * dobles, puntos, escapes restantes ni separadores de Windows. Además de
 * evitar traversal, esto hace que `path` tenga una representación única.
 */
function canonicalI18nPage(rawPath) {
    if (typeof rawPath !== 'string') return null;
    if (rawPath === '/') return '';
    if (!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(rawPath)) {
        return null;
    }
    return rawPath.slice(1);
}

function isPrivateNationalPath(pathname) {
    let decoded = pathname;
    try {
        // Cloudflare y los navegadores pueden descodificar en capas distintas;
        // bloquear también las variantes escapadas evita una URL alternativa.
        for (let pass = 0; pass < 3; pass += 1) {
            const next = decodeURIComponent(decoded);
            if (next === decoded) break;
            decoded = next;
        }
    } catch {
        // Una secuencia `%` inválida no puede coincidir con la ruta interna.
    }
    const slashNormalized = decoded.replace(/\\/g, '/').replace(/^\/+/, '/');
    return PRIVATE_NATIONAL_PATH.test(slashNormalized);
}

/**
 * Entrega a `elysium-i18n.js` una versión física europea de la página
 * nacional actual. La llamada sigue siendo same-origin y no redirige: solo la
 * petición interna al binding apunta a `/`, `/es/` o `/pt/`.
 */
async function serveI18nPage(request, env, url, nationalLanguage) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return plainError(request, 405, 'Method not allowed.', 'GET, HEAD');
    }

    // Rechazar parámetros duplicados evita que CDN, Worker y cliente discrepen
    // sobre cuál de dos valores es el efectivo.
    const languages = url.searchParams.getAll('lang');
    const paths = url.searchParams.getAll('path');
    if (languages.length !== 1 || paths.length !== 1 || !EUROPEAN_HTML_PAGES.has(languages[0])) {
        return plainError(request, 400, 'Expected one valid lang and one canonical path.');
    }

    const page = canonicalI18nPage(paths[0]);
    if (page === null) {
        return plainError(request, 400, 'The path is not canonical.');
    }

    // Solo puede pedirse la página nacional que el usuario está viendo. Esto
    // mantiene el endpoint acotado a HTML público y fuera de portales/assets.
    if (!NATIONAL_HTML_PAGES.get(nationalLanguage).has(page)) {
        return plainError(request, 404, 'Page not found.');
    }

    const targetLanguage = languages[0];
    const targetPages = EUROPEAN_HTML_PAGES.get(targetLanguage);
    if (!targetPages.has(page)) return plainError(request, 404, 'Translation source not found.');
    const targetPage = page;
    const prefix = targetLanguage === 'en' ? '' : `/${targetLanguage}`;
    const assetPath = targetPage ? `${prefix}/${targetPage}` : `${prefix}/`;
    const assetUrl = new URL(assetPath, url.origin);
    const assetRequest = new Request(assetUrl, {
        method: request.method,
        headers: { Accept: 'text/html' }
    });
    const response = await env.ASSETS.fetch(assetRequest);
    if (!response.ok) return response;

    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'text/html; charset=utf-8');
    headers.set('Cache-Control', 'no-store');
    headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.delete('Content-Length');
    return new Response(request.method === 'HEAD' ? null : response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}

function publicOrigin(url) {
    return `https://${url.hostname.toLowerCase()}`;
}

function seoResponse(request, body, contentType) {
    return new Response(request.method === 'HEAD' ? null : body, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'X-Content-Type-Options': 'nosniff'
        }
    });
}

/** Sitemap propio de `.es`/`.pt`: jamás publica canónicas de otro dominio. */
function serveNationalSitemap(request, url, language) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return plainError(request, 405, 'Method not allowed.', 'GET, HEAD');
    }

    const excluded = NATIONAL_SITEMAP_EXCLUSIONS.get(language);
    const origin = publicOrigin(url);
    const locations = [...LOCALIZED_PAGES.get(language)]
        .filter(page => !NATIONAL_NOINDEX_PAGES.has(page) && !excluded.has(page))
        .map(page => page ? `${origin}/${page}` : `${origin}/`);
    const entries = locations.map(location => `  <url><loc>${location}</loc></url>`).join('\n');
    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        entries,
        '</urlset>',
        ''
    ].join('\n');
    return seoResponse(request, xml, 'application/xml; charset=utf-8');
}

/**
 * Conserva el robots.txt editorial completo, pero lo vuelve host-specific y
 * añade los dos namespaces internos a cada grupo. Los grupos específicos no
 * heredan el grupo `*`, por eso no basta con declarar los Disallow una vez.
 */
async function serveHostRobots(request, env, url) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return plainError(request, 405, 'Method not allowed.', 'GET, HEAD');
    }

    const assetUrl = new URL(ROBOTS_PATH, url.origin);
    const response = await env.ASSETS.fetch(new Request(assetUrl, { method: 'GET' }));
    if (!response.ok) return response;

    const origin = publicOrigin(url);
    const newline = '\n';
    const source = (await response.text()).replaceAll('https://elysiumdr.eu', origin);
    const lines = source.replace(/\r\n/g, '\n').split('\n');
    const rendered = [];
    let foundAgent = false;
    for (const line of lines) {
        rendered.push(line);
        if (/^\s*User-agent\s*:/i.test(line)) {
            foundAgent = true;
            rendered.push('Disallow: /_national/');
            rendered.push('Disallow: /__i18n');
        }
    }
    if (!foundAgent) {
        rendered.unshift(
            'User-agent: *',
            'Allow: /',
            'Disallow: /_national/',
            'Disallow: /__i18n',
            ''
        );
    }

    let robots = rendered.join(newline);
    const sitemap = `Sitemap: ${origin}${SITEMAP_PATH}`;
    if (/^\s*Sitemap\s*:/im.test(robots)) {
        robots = robots.replace(/^\s*Sitemap\s*:.*$/gim, sitemap);
    } else {
        robots = `${robots.replace(/\s*$/, '')}${newline}${newline}${sitemap}${newline}`;
    }
    return seoResponse(request, robots, 'text/plain; charset=utf-8');
}

// ── Descubrimiento para agentes ───────────────────────────────────────────────

/**
 * Los ficheros que un agente busca antes de leer nada: el catálogo de APIs
 * (RFC 9727), el manifiesto ARD, la tarjeta del servidor MCP, el índice de
 * skills, la descripción OpenAPI y las condiciones de autenticación.
 *
 * Pasan por el Worker y no directamente por los assets por dos razones:
 *
 *  1. **La extensión.** Las rutas de las especificaciones no la llevan
 *     (`/.well-known/api-catalog`), pero un fichero sin extensión se serviría
 *     como `application/octet-stream` y un cliente estricto lo descartaría. El
 *     contenido se guarda con su `.json` y aquí se le pone el tipo exacto.
 *  2. **CORS.** El manifiesto ARD exige `Access-Control-Allow-Origin: *` para
 *     que un registro pueda leerlo desde el navegador; `_headers` no llega a
 *     estas rutas con la precisión necesaria.
 */
const PROTECTED_RESOURCE_METADATA_PATH = '/.well-known/oauth-protected-resource';
const AGENT_FILES = new Map([
    ['/.well-known/api-catalog', { asset: '/.well-known/api-catalog.json', type: 'application/linkset+json' }],
    [PROTECTED_RESOURCE_METADATA_PATH, { asset: '/.well-known/oauth-protected-resource.json', type: 'application/json' }],
    [`${PROTECTED_RESOURCE_METADATA_PATH}/api`, { asset: '/.well-known/oauth-protected-resource.json', type: 'application/json' }],
    ['/.well-known/ai-catalog.json', { asset: '/.well-known/ai-catalog.json', type: 'application/json' }],
    ['/.well-known/mcp/server-card.json', { asset: '/.well-known/mcp/server-card.json', type: 'application/json' }],
    ['/.well-known/agent-skills/index.json', { asset: '/.well-known/agent-skills/index.json', type: 'application/json' }],
    ['/openapi.json', { asset: '/openapi.json', type: 'application/openapi+json' }],
    ['/auth.md', { asset: '/auth.md', type: 'text/markdown; charset=utf-8' }]
]);

/** Los SKILL.md, que se añaden y se quitan sin tocar el Worker. */
const SKILL_PATH = /^\/\.well-known\/agent-skills\/[a-z0-9-]+\/SKILL\.md$/;

function corsHeaders(extra = {}) {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, MCP-Protocol-Version',
        'Access-Control-Max-Age': '86400',
        ...extra
    };
}

/** `null` si la ruta no es un fichero de descubrimiento. */
async function serveAgentFile(url, request, env) {
    const known = AGENT_FILES.get(url.pathname);
    const isSkill = !known && SKILL_PATH.test(url.pathname);
    if (!known && !isSkill) return null;

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(null, { status: 405, headers: corsHeaders({ Allow: 'GET, HEAD, OPTIONS' }) });
    }

    const assetPath = known ? known.asset : url.pathname;
    const asset = new URL(assetPath, url.origin);
    const isProtectedResourceMetadata = url.pathname === PROTECTED_RESOURCE_METADATA_PATH
        || url.pathname === `${PROTECTED_RESOURCE_METADATA_PATH}/api`;
    // Solo estos metadatos necesitan leer el JSON para materializar el host. El
    // resto conserva un HEAD real en el binding y no descarga un cuerpo que no
    // va a consumir.
    const assetMethod = isProtectedResourceMetadata ? 'GET' : request.method;
    const response = await env.ASSETS.fetch(new Request(asset, { method: assetMethod }));
    if (!response.ok) {
        // El binding suele respetar HEAD, pero el Worker mantiene la semántica
        // aunque un origen de assets devuelva por error un cuerpo de diagnóstico.
        if (request.method !== 'HEAD') return response;
        return new Response(null, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    }

    const headers = new Headers(response.headers);
    headers.set('Content-Type', known ? known.type : 'text/markdown; charset=utf-8');
    headers.set('Cache-Control', 'public, max-age=3600');
    for (const [name, value] of Object.entries(corsHeaders())) headers.set(name, value);

    let body = response.body;
    if (isProtectedResourceMetadata) {
        const metadata = await response.json();
        const hostname = url.hostname.toLowerCase();
        const origin = hostname === 'elysiumdr.eu' || LOCALIZED_HOSTS.has(hostname)
            ? publicOrigin(url)
            : 'https://elysiumdr.eu';
        metadata.resource = url.pathname.endsWith('/api') ? `${origin}/api` : origin;
        metadata.resource_documentation = `${origin}/auth.md`;
        metadata.resource_policy_uri = `${origin}/terms`;
        body = `${JSON.stringify(metadata, null, 2)}\n`;
        headers.delete('Content-Length');
        // El asset de origen tiene un único validador, pero estas
        // representaciones cambian por host y por `/api`; compartir su ETag
        // permitiría un 304 para un cuerpo distinto.
        headers.delete('ETag');
        headers.delete('Last-Modified');
    }

    return new Response(request.method === 'HEAD' ? null : body, {
        status: response.status,
        headers
    });
}

// ── Markdown para agentes ─────────────────────────────────────────────────────

/**
 * ¿Prefiere quien pregunta Markdown antes que HTML?
 *
 * Se compara la calidad `q` de los dos tipos en vez de buscar la cadena a
 * secas: un navegador manda `text/html` seguido de un comodín con `q=0.8`, y una
 * comprobación ingenua tomaría ese comodín por un «sí» a Markdown. Solo se
 * convierte cuando `text/markdown` está pedido explícitamente y con una
 * calidad al menos igual a la de `text/html`.
 */
function prefersMarkdown(request) {
    const accept = request.headers.get('Accept');
    if (!accept || !/text\/markdown/i.test(accept)) return false;

    let markdown = 0;
    let html = 0;
    for (const part of accept.split(',')) {
        const [type, ...parameters] = part.trim().split(';');
        const quality = parameters
            .map(parameter => /^\s*q=([\d.]+)\s*$/i.exec(parameter))
            .find(Boolean);
        const value = quality ? Number(quality[1]) : 1;
        const media = type.trim().toLowerCase();
        if (media === 'text/markdown') markdown = Math.max(markdown, value);
        if (media === 'text/html') html = Math.max(html, value);
    }
    return markdown > 0 && markdown >= html;
}

/**
 * Sirve un asset, y lo entrega en Markdown si se ha pedido así.
 *
 * La respuesta en Markdown se marca `Vary: Accept` y `no-store`: si una caché
 * intermedia se quedara con ella bajo la misma URL, el siguiente navegador que
 * pasara por ahí recibiría texto plano en vez de la página. El HTML conserva su
 * `Cache-Control` intacto, así que la negociación no le cuesta caché a nadie.
 */
async function serveAsset(request, env, assetRequest = request) {
    const response = await env.ASSETS.fetch(assetRequest);
    if (!prefersMarkdown(request) || !response.ok) return response;
    if (!(response.headers.get('Content-Type') || '').includes('text/html')) return response;

    const markdown = htmlToMarkdown(await response.text(), { baseUrl: request.url });
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'text/markdown; charset=utf-8');
    headers.set('Cache-Control', 'no-store');
    headers.set('Vary', 'Accept');
    headers.set('x-markdown-tokens', String(estimateTokens(markdown)));
    headers.delete('Content-Length');
    return new Response(markdown, { status: response.status, headers });
}

// ── Servidor MCP ──────────────────────────────────────────────────────────────

/**
 * Un servidor MCP de solo lectura sobre el contenido público del sitio, en
 * `/mcp` y sin autenticación. No expone nada que no esté ya publicado: lista
 * las páginas del sitemap, entrega cualquiera de ellas en Markdown y busca en
 * el corpus de `/llms-full.txt`.
 *
 * Transporte «streamable HTTP» en su forma más simple: JSON-RPC por POST con
 * respuesta JSON, sin sesión y sin flujo SSE. No hay estado que mantener entre
 * llamadas, así que tampoco hay `Mcp-Session-Id`.
 *
 * Ninguna herramienta escribe. Enviar un formulario o agendar una reunión pasa
 * por `/api`, que exige credenciales o consentimiento explícito de la persona
 * — no es algo que deba poder disparar un agente por su cuenta desde aquí.
 */
const MCP_PATH = '/mcp';
const MCP_PROTOCOL_VERSION = '2025-06-18';

/**
 * Lo que no se entrega aunque esté servido: el portal, el CRM y el onboarding
 * (páginas de sesión, sin contenido útil fuera de ella), los diplomas —que
 * llevan el número de cédula y por eso están en `noindex`—, «Demo-arbol», que
 * también lo está, y cualquier cosa bajo `/api` o `/.well-known`.
 */
const MCP_PRIVATE = [
    /^\/admin\b/, /^\/profiles\b/, /^\/onboarding\b/, /^\/seed-licenses\b/,
    /^\/auth-action\b/, /^\/Titulos\//, /^\/Demo-arbol\//, /^\/api\//, /^\/\./
];

const MCP_TOOLS = [
    {
        name: 'list_pages',
        title: 'List the pages of elysiumdr.eu',
        description: 'Every canonical URL the site publishes, in English, Spanish and European Portuguese, taken from its sitemap. Use it to find the right page before fetching one.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
        name: 'get_page',
        title: 'Read a page as Markdown',
        description: 'The full text of one page of elysiumdr.eu, converted to Markdown. Give a path such as "/services", "/es/portfolio" or "/research/ontology-research" — public URLs carry no .html extension.',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Path on elysiumdr.eu, starting with "/". A full https://elysiumdr.eu/... URL is accepted too.'
                }
            },
            required: ['path'],
            additionalProperties: false
        }
    },
    {
        name: 'search_site',
        title: 'Search the site corpus',
        description: 'Search the passages of /llms-full.txt, which carries the text of every page in the three languages, and return the best matches with the section they belong to. Use it when you do not know which page holds an answer.',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Words to look for.' },
                limit: { type: 'integer', minimum: 1, maximum: 20, default: 5, description: 'How many passages to return. Default 5.' }
            },
            required: ['query'],
            additionalProperties: false
        }
    }
];

function mcpJson(body, status = 200) {
    return new Response(body === null ? null : JSON.stringify(body), {
        status,
        headers: corsHeaders({
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        })
    });
}

const mcpResult = (id, result) => mcpJson({ jsonrpc: '2.0', id, result });
const mcpError = (id, code, message) => mcpJson({ jsonrpc: '2.0', id, error: { code, message } });
const mcpText = text => ({ content: [{ type: 'text', text }] });
const mcpFailure = text => ({ content: [{ type: 'text', text }], isError: true });

/** Sin acentos y en minúsculas: «investigación» y «investigacion» buscan igual. */
const fold = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

async function assetText(env, origin, path) {
    const response = await env.ASSETS.fetch(new Request(new URL(path, origin)));
    return response.ok ? response.text() : null;
}

async function mcpListPages(env, origin) {
    const sitemap = await assetText(env, origin, '/sitemap.xml');
    if (!sitemap) return mcpFailure('The sitemap could not be read.');
    const urls = [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
        .map(match => match[1])
        .filter(location => !MCP_PRIVATE.some(pattern => pattern.test(new URL(location).pathname)));
    if (!urls.length) return mcpFailure('The sitemap listed no pages.');
    return mcpText(`${urls.length} pages published on elysiumdr.eu:\n\n${urls.map(url => `- ${url}`).join('\n')}`);
}

async function mcpGetPage(env, origin, rawPath) {
    let path;
    try {
        path = new URL(String(rawPath || ''), origin).pathname;
    } catch {
        return mcpFailure(`"${rawPath}" is not a usable path.`);
    }
    if (MCP_PRIVATE.some(pattern => pattern.test(path))) {
        return mcpFailure(`${path} is not part of the public site.`);
    }

    const target = new URL(path, origin);
    const response = await env.ASSETS.fetch(new Request(target));
    if (!response.ok) {
        return mcpFailure(`${path} does not exist. Use list_pages to see the published URLs; they carry no .html extension.`);
    }
    const type = response.headers.get('Content-Type') || '';
    if (type.includes('text/html')) {
        return mcpText(htmlToMarkdown(await response.text(), { baseUrl: target.toString() }));
    }
    if (type.startsWith('text/') || type.includes('json') || type.includes('xml')) {
        return mcpText(await response.text());
    }
    return mcpFailure(`${path} is not a text resource (${type || 'unknown type'}).`);
}

async function mcpSearchSite(env, origin, query, limit) {
    const words = fold(String(query || '')).match(/[\p{L}\p{N}]+/gu) || [];
    if (!words.length) return mcpFailure('Give at least one word to search for.');

    const corpus = await assetText(env, origin, '/llms-full.txt');
    if (!corpus) return mcpFailure('The site corpus could not be read.');

    // Se conserva el encabezado Markdown vigente para poder decir de qué
    // sección sale cada pasaje: un fragmento suelto de /llms-full.txt no dice
    // si habla del plan Ecosystem o de la política de privacidad.
    let heading = '';
    const passages = [];
    for (const block of corpus.split(/\n\s*\n/)) {
        const text = block.trim();
        if (!text) continue;
        const title = /^#{1,6}\s+(.*)$/m.exec(text);
        if (title && text.split('\n').length === 1) { heading = title[1].trim(); continue; }
        const folded = fold(text);
        const matched = words.filter(word => folded.includes(word));
        if (!matched.length) continue;
        passages.push({
            heading,
            text,
            score: matched.length * 1000 - Math.min(text.length, 4000) / 1000
        });
    }
    if (!passages.length) return mcpText(`Nothing in the site corpus matches "${query}".`);

    const wanted = Math.min(Math.max(Number(limit) || 5, 1), 20);
    const best = passages.sort((a, b) => b.score - a.score).slice(0, wanted);
    const rendered = best
        .map(passage => `## ${passage.heading || 'elysiumdr.eu'}\n\n${passage.text.slice(0, 1500)}`)
        .join('\n\n---\n\n');
    return mcpText(`${best.length} of ${passages.length} matching passages for "${query}":\n\n${rendered}`);
}

async function callMcpTool(name, args, env, origin) {
    switch (name) {
        case 'list_pages': return mcpListPages(env, origin);
        case 'get_page': return mcpGetPage(env, origin, args?.path);
        case 'search_site': return mcpSearchSite(env, origin, args?.query, args?.limit);
        default: return null;
    }
}

async function handleMcp(request, env, url) {
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method === 'GET' || request.method === 'HEAD') {
        // Sin flujo SSE: este servidor no envía nada que el cliente no pida.
        return mcpError(null, -32601, 'This MCP server answers JSON-RPC over POST; it opens no SSE stream.');
    }
    if (request.method !== 'POST') {
        return new Response(null, { status: 405, headers: corsHeaders({ Allow: 'POST, OPTIONS' }) });
    }

    let message;
    try {
        message = await request.json();
    } catch {
        return mcpError(null, -32700, 'Parse error: the body is not JSON.');
    }
    if (Array.isArray(message)) {
        return mcpError(null, -32600, 'Batched requests are not supported.');
    }
    if (!message || typeof message !== 'object' || message.jsonrpc !== '2.0') {
        return mcpError(null, -32600, 'Invalid request: expected a JSON-RPC 2.0 message.');
    }

    // Una notificación no lleva `id` y no espera respuesta.
    if (!('id' in message) || message.id === null) {
        return new Response(null, { status: 202, headers: corsHeaders() });
    }
    const id = message.id;

    switch (message.method) {
        case 'initialize':
            return mcpResult(id, {
                protocolVersion: MCP_PROTOCOL_VERSION,
                capabilities: { tools: { listChanged: false } },
                serverInfo: {
                    name: 'elysiumdr.eu',
                    title: 'Elysium λ Development & Research — site knowledge',
                    version: '1.0.0'
                },
                instructions: 'Read-only access to the public site of Elysium λ Development & Research. Start with list_pages or search_site, then get_page for the full text. Prices, tiers and research status change: read them here rather than recalling them.'
            });
        case 'ping':
            return mcpResult(id, {});
        case 'tools/list':
            return mcpResult(id, { tools: MCP_TOOLS });
        case 'tools/call': {
            const name = message.params?.name;
            const result = await callMcpTool(name, message.params?.arguments, env, url.origin);
            if (!result) return mcpError(id, -32602, `Unknown tool: ${name}`);
            return mcpResult(id, result);
        }
        default:
            return mcpError(id, -32601, `Method not found: ${message.method}`);
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const host = url.hostname.toLowerCase();

        // 0. `www` no es una dirección distinta, es la misma escrita de otra
        //    forma. Al ápice, y una sola vez: si `www` sirviera el sitio en vez
        //    de redirigir, cada página existiría en dos URLs y el buscador
        //    tendría que adivinar cuál indexar. Va primero para que el resto del
        //    Worker solo tenga que razonar sobre tres hosts.
        if (host.startsWith('www.')) {
            return redirect(`https://${host.slice(4)}${url.pathname}${url.search}`, 301);
        }

        const nationalLanguage = LOCALIZED_HOSTS.get(host) || null;
        const isPublicHost = host === 'elysiumdr.eu' || Boolean(nationalLanguage);

        // Este prototipo administrativo solo existe como documento de trabajo
        // en español de Costa Rica. No se publica como si fuera una página
        // nacional española o portuguesa.
        if (nationalLanguage && /^\/prototype-selva-y-sal(?:\.html)?\/?$/.test(url.pathname)) {
            return redirect(`${url.origin}/portfolio${url.search}`, 301);
        }

        // `/p` fue un duplicado temporal de portfolio. Canonizarlo en el mismo
        // host evita que los dominios nacionales sirvan la copia inglesa y que
        // el selector de idioma quede sin propietario.
        const legacyPortfolio = /^\/(?:(en|es|pt)\/)?p(?:\.html)?\/?$/.exec(url.pathname);
        if (isPublicHost && legacyPortfolio) {
            const requestedPrefix = legacyPortfolio[1];
            const prefix = host === 'elysiumdr.eu' && ['es', 'pt'].includes(requestedPrefix)
                ? `/${requestedPrefix}`
                : '';
            const target = new URL(`${prefix}/portfolio`, url.origin);
            url.searchParams.forEach((value, key) => target.searchParams.append(key, value));
            const isForeignNationalLanguage = Boolean(nationalLanguage)
                && ['en', 'es', 'pt'].includes(requestedPrefix)
                && requestedPrefix !== nationalLanguage;
            if (isForeignNationalLanguage) target.searchParams.set('lang', requestedPrefix);
            return redirect(target.toString(), isForeignNationalLanguage ? 302 : 301, {
                cacheable: !isForeignNationalLanguage
            });
        }

        // Las landings España/Portugal ya son las portadas nacionales. La de
        // Costa Rica sigue siendo una página física de la región europea.
        if (isPublicHost) {
            const landingMatch = /^\/(?:es\/|pt\/)?([^/]+?)(?:\.html)?\/?$/.exec(url.pathname);
            const landing = landingMatch && landingMatch[1];
            if (landing && REGIONAL_LANDING_SLUGS.has(landing)) {
                if (landing === 'infraestructura-digital-pymes-costa-rica') {
                    const target = new URL(`https://elysiumdr.eu/es/${landing}`);
                    target.search = url.search;
                    // Esta es su URL canónica; no se redirige sobre sí misma.
                    if (host !== 'elysiumdr.eu' || !url.pathname.startsWith('/es/')) {
                        return redirect(target.toString(), 301);
                    }
                } else {
                    const targetHost = landing === 'infraestructura-digital-pymes-espana'
                        ? 'elysiumdr.es'
                        : 'elysiumdr.pt';
                    const target = new URL(`https://${targetHost}/`);
                    target.search = url.search;
                    if (host !== targetHost || url.pathname !== '/') {
                        return redirect(target.toString(), 301);
                    }
                }
            }
        }

        if (isPublicHost && url.pathname === ROBOTS_PATH) {
            return serveHostRobots(request, env, url);
        }
        if (nationalLanguage && url.pathname === SITEMAP_PATH) {
            return serveNationalSitemap(request, url, nationalLanguage);
        }

        // Las bases nacionales existen solo como destino de una reescritura al
        // binding. Nunca hay una URL pública alternativa que pueda indexarse.
        if (isPrivateNationalPath(url.pathname)) {
            return plainError(request, 404, 'Not found.');
        }

        // Fuente HTML para la traducción dinámica de los dos dominios
        // nacionales. En `.eu` no existe porque sus idiomas son páginas
        // físicas y el selector navega entre carpetas.
        if (url.pathname === I18N_PATH) {
            if (!nationalLanguage) return plainError(request, 404, 'Not found.');
            return serveI18nPage(request, env, url, nationalLanguage);
        }
        if (url.pathname.startsWith(`${I18N_PATH}/`)) {
            return plainError(request, 404, 'Not found.');
        }

        // 0.b Descubrimiento para agentes y servidor MCP. Van antes que nada:
        //      son los mismos en los tres dominios, no llevan prefijo de idioma
        //      y no deben pasar por el reparto por país ni por la reescritura de
        //      los dominios nacionales.
        const agentFile = await serveAgentFile(url, request, env);
        if (agentFile) return agentFile;
        if (url.pathname === MCP_PATH) return handleMcp(request, env, url);

        // 1. Reparto por país en la portada de .eu.
        const isEuropeanHost = host === 'elysiumdr.eu';
        const isHomepage = url.pathname === '/' || url.pathname === '/index.html';
        const hasParamOverride = url.searchParams.has('override') || url.searchParams.has('region') || url.searchParams.get('lang') === 'en';
        if (isEuropeanHost && isHomepage) {
            const cookieHeader = request.headers.get('Cookie') || '';
            const hasManualOverride = cookieHeader.includes('elysium_region_override=true');

            if (!hasManualOverride && !hasParamOverride) {
                // Código ISO de dos letras que pone Cloudflare (p. ej. 'ES', 'PT', 'CR').
                const target = entryTargetFor(request.cf?.country);
                if (target) {
                    const location = new URL(target + url.search, url).toString();
                    return redirect(location, 302, { cacheable: false });
                }
            }
        }

        // Inglés vive en la raíz de `.eu`. El alias exacto necesita además
        // fijar el override: si se redirigiera a `/` sin él, el segundo request
        // podría volver a repartir por país y cambiar de región.
        if (isEuropeanHost && /^\/en(?:\/index(?:\.html)?)?\/?$/.test(url.pathname)) {
            const target = new URL('/', url.origin);
            url.searchParams.forEach((value, key) => target.searchParams.append(key, value));
            target.searchParams.set('lang', 'en');
            target.searchParams.set('region', 'EU');
            target.searchParams.set('override', 'true');
            return redirect(target.toString(), 301);
        }
        if (isEuropeanHost && url.pathname.startsWith('/en/')) {
            const rest = url.pathname.slice(3);
            return redirect(`https://${host}${rest || '/'}${url.search}`, 301);
        }

        // 2. Dominios nacionales: el idioma lo pone el dominio, no la URL.
        //    `/api/*` se queda fuera: el formulario de contacto y el onboarding
        //    de `elysiumdr.es` llaman a su propio origen —la CSP es
        //    `connect-src 'self'`— y tienen que acabar en el proxy de abajo, no
        //    en un fichero estático.
        const language = url.pathname.startsWith(API_PREFIX) ? null : nationalLanguage;
        if (language) {
            const pages = LOCALIZED_PAGES.get(language);
            const hasTrailingSlash = url.pathname.length > 1 && url.pathname.endsWith('/');
            const page = url.pathname.replace(/^\//, '').replace(/\/$/, '');

            // `html_handling` no puede canonizar estos nombres por nosotros:
            // el fichero nacional real vive bajo `/_national`. Resolverlos aquí
            // evita que `/index.html` o `/services.html` caigan por accidente en
            // los HTML ingleses de la raíz compartida.
            if (url.pathname === '/index' || url.pathname === '/index.html') {
                return redirect(url.origin + '/' + url.search, 301);
            }
            if (page.endsWith('.html')) {
                const extensionless = page.slice(0, -5);
                if (pages.has(extensionless)) {
                    return redirect(`${url.origin}/${extensionless}${url.search}`, 301);
                }
            }

            if (pages.has(page)) {
                // `/research/` y `/research` son la misma página: una sola URL
                // canónica, la de sin barra, igual que hace `html_handling`.
                if (hasTrailingSlash) {
                    return redirect(url.origin + url.pathname.slice(0, -1) + url.search, 307);
                }
                const base = NATIONAL_ASSET_BASES.get(language);
                const target = page === '' ? `${base}/` : `${base}/${page}`;
                const rewritten = new URL(target + url.search, request.url);
                const response = await serveAsset(request, env, new Request(rewritten, request));

                // El binding evalúa `_headers` contra la ruta interna
                // `/_national/...`, no contra la URL pública. Revalidar el HTML
                // aquí evita que una portada o un onboarding nacional quede
                // emparejado con JavaScript antiguo tras un despliegue.
                if (!page.endsWith('.txt')) {
                    const headers = new Headers(response.headers);
                    headers.set('Cache-Control', 'no-cache, max-age=0, must-revalidate');
                    headers.delete('Content-Length');
                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers
                    });
                }
                return response;
            }

            // En los dominios nacionales el idioma nunca vive en una carpeta.
            // Los prefijos heredados se convierten al mismo path + `?lang`:
            // se conserva la página y, sobre todo, nunca se cambia de región.
            const prefixed = /^\/(en|es|pt)(?:\/|$)/.exec(url.pathname);
            if (prefixed) {
                const prefix = prefixed[1];
                const rest = url.pathname.slice(prefix.length + 1) || '/';
                const target = new URL(rest, url.origin);
                url.searchParams.forEach((value, key) => target.searchParams.append(key, value));
                if (prefix === language) target.searchParams.delete('lang');
                else target.searchParams.set('lang', prefix);
                return redirect(target.toString(), prefix === language ? 301 : 302, {
                    cacheable: prefix === language
                });
            }

            // Todo lo demás —subsitios, `/profiles`, `/admin`, CSS, imágenes—
            // se sirve desde la raíz, compartido entre todos los dominios.
            return serveAsset(request, env);
        }

        if (isEuropeanHost && isHomepage && hasParamOverride) {
            const response = await serveAsset(request, env);
            const headers = new Headers(response.headers);
            headers.set('Set-Cookie', 'elysium_region_override=true; Path=/; Max-Age=31536000; SameSite=Lax');
            return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
        }

        // Durante la consolidación existió una SPA separada en /admin/.
        // Los marcadores antiguos vuelven al único CRM sin perder el query.
        if (url.pathname === '/admin/' || url.pathname === '/admin/index.html') {
            const target = new URL('/admin', url);
            target.search = url.search;
            return Response.redirect(target, 308);
        }

        const legacyProfileLanguage = LEGACY_PROFILE_LANGUAGES.get(url.pathname);
        if (legacyProfileLanguage) {
            const target = new URL('/profiles', url);
            target.protocol = 'https:';
            target.search = url.search;
            target.searchParams.set('lang', legacyProfileLanguage);
            return Response.redirect(target, 308);
        }

        const legacyAdminLanguage = LEGACY_ADMIN_LANGUAGES.get(url.pathname);
        if (legacyAdminLanguage) {
            const target = new URL('/admin', url);
            target.protocol = 'https:';
            target.search = url.search;
            target.searchParams.set('lang', legacyAdminLanguage);
            return Response.redirect(target, 308);
        }

        if (!url.pathname.startsWith(API_PREFIX)) {
            return serveAsset(request, env);
        }

        const origin = String(env.ELYSIUM_API_ORIGIN || '').trim().replace(/\/$/, '');
        if (!origin) {
            return Response.json(
                {
                    error: 'The Elysium platform service is not deployed.',
                    code: 'api_not_configured'
                },
                { status: 503, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        const target = new URL(url.pathname + url.search, origin);

        // Se reenvía tal cual: el método, las cabeceras (Authorization,
        // Idempotency-Key) y el cuerpo sin tocar.
        const upstream = new Request(target, request);
        upstream.headers.set('X-Forwarded-Host', url.host);
        upstream.headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

        try {
            const response = await fetch(upstream);
            // Una respuesta de API nunca debe quedarse en caché por delante.
            const headers = new Headers(response.headers);
            if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
            // RFC 9728 permite que el recurso anuncie sus metadatos desde el
            // desafío Bearer. El backend no conoce necesariamente el host
            // público que usó el cliente, pero el Worker sí; conserva cualquier
            // desafío más específico que ya haya enviado el upstream.
            if (response.status === 401 && !headers.has('WWW-Authenticate')) {
                const resourceMetadata = `${publicOrigin(url)}${PROTECTED_RESOURCE_METADATA_PATH}/api`;
                headers.set('WWW-Authenticate', `Bearer resource_metadata="${resourceMetadata}"`);
            }
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers
            });
        } catch (error) {
            return Response.json(
                {
                    error: 'The Elysium platform service did not answer.',
                    code: 'api_unreachable',
                    detail: String(error?.message || error)
                },
                { status: 502, headers: { 'Cache-Control': 'no-store' } }
            );
        }
    }
};
