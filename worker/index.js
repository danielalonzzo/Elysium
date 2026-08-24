/**
 * Elysium — el Worker que sirve el sitio.
 *
 * El sitio entero son ficheros estáticos y así sigue. Este Worker hace tres
 * cosas, y nada más:
 *
 *   1. Reparte a quien entra por `elysiumdr.eu` según su país (ver «Entrada»).
 *   2. Sirve los dominios nacionales (`.es`, `.pt`) en su idioma sin que la URL
 *      lleve prefijo: `elysiumdr.es/services` entrega `es/services.html`.
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

const LANGUAGE_DOMAINS = new Map([
    ['es', 'https://elysiumdr.es'],
    ['pt', 'https://elysiumdr.pt']
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
 * portada). Para regenerarla tras traducir páginas nuevas:
 *
 *     cd es && find . -type f \( -name '*.html' -o -name '*.txt' \) \
 *       | sed 's|^\./||; s|\.html$||; s|^index$||' | sort
 */
const LOCALIZED_PAGES = new Map([
    ['es', new Set([
        '', 'about', 'case-moyra', 'case-pmorais', 'case-valtrix', 'contact',
        'daniel-morales', 'infraestructura-digital-pymes-costa-rica',
        'infraestructura-digital-pymes-espana', 'llms-full.txt', 'llms.txt',
        'onboarding', 'portfolio', 'privacy', 'prototype-moyra',
        'prototype-pmorais', 'prototype-valtrix', 'research',
        'research/data-driven-sme-intelligence', 'research/ontology-research',
        'review-pmorais', 'services', 'terms', 'thank-you'
    ])],
    ['pt', new Set([
        '', 'about', 'case-moyra', 'case-pmorais', 'case-valtrix', 'contact',
        'daniel-morales', 'infraestrutura-digital-pme-portugal',
        'llms-full.txt', 'llms.txt', 'onboarding', 'portfolio', 'privacy',
        'prototype-moyra', 'prototype-pmorais', 'prototype-valtrix', 'research',
        'research/data-driven-sme-intelligence', 'research/ontology-research',
        'review-pmorais', 'services', 'terms', 'thank-you'
    ])]
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

        // 1. Reparto por país en la portada de .eu.
        const isEuropeanHost = host === 'elysiumdr.eu';
        const isHomepage = url.pathname === '/' || url.pathname === '/index.html';
        if (isEuropeanHost && isHomepage) {
            const cookieHeader = request.headers.get('Cookie') || '';
            const hasManualOverride = cookieHeader.includes('elysium_region_override=true');

            if (!hasManualOverride) {
                // Código ISO de dos letras que pone Cloudflare (p. ej. 'ES', 'PT', 'CR').
                const target = entryTargetFor(request.cf?.country);
                if (target) {
                    const location = new URL(target + url.search, url).toString();
                    return redirect(location, 302, { cacheable: false });
                }
            }
        }

        // 2. Dominios nacionales: el idioma lo pone el dominio, no la URL.
        //    `/api/*` se queda fuera: el formulario de contacto y el onboarding
        //    de `elysiumdr.es` llaman a su propio origen —la CSP es
        //    `connect-src 'self'`— y tienen que acabar en el proxy de abajo, no
        //    en un fichero estático.
        const language = url.pathname.startsWith(API_PREFIX) ? null : LOCALIZED_HOSTS.get(host);
        if (language) {
            const pages = LOCALIZED_PAGES.get(language);
            const hasTrailingSlash = url.pathname.length > 1 && url.pathname.endsWith('/');
            const page = url.pathname.replace(/^\//, '').replace(/\/$/, '');

            if (pages.has(page)) {
                // `/research/` y `/research` son la misma página: una sola URL
                // canónica, la de sin barra, igual que hace `html_handling`.
                if (hasTrailingSlash) {
                    return redirect(url.origin + url.pathname.slice(0, -1) + url.search, 307);
                }
                const target = page === '' ? `/${language}/` : `/${language}/${page}`;
                const rewritten = new URL(target + url.search, request.url);
                return env.ASSETS.fetch(new Request(rewritten, request));
            }

            // El prefijo de idioma no pinta nada aquí: en `.es` el español ya se
            // sirve en la raíz, y el portugués vive en su propio dominio. Sin
            // esto habría dos URLs para la misma página (mala señal para el
            // buscador) y el selector de idioma del encabezado dejaría al
            // visitante leyendo portugués bajo el dominio español.
            const prefix = ['es', 'pt'].find(code => url.pathname.startsWith(`/${code}/`));
            if (prefix) {
                const rest = url.pathname.slice(prefix.length + 1);
                const origin = prefix === language ? url.origin : LANGUAGE_DOMAINS.get(prefix);
                return redirect(origin + rest + url.search, 301);
            }

            // Todo lo demás —subsitios, `/profiles`, `/admin`, CSS, imágenes—
            // se sirve desde la raíz, compartido entre todos los dominios.
            return env.ASSETS.fetch(request);
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
            return env.ASSETS.fetch(request);
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
