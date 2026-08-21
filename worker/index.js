/**
 * Elysium — el Worker que sirve el sitio.
 *
 * El sitio entero son ficheros estáticos y así sigue: este Worker solo existe
 * para una ruta, `/api/*`, y todo lo demás vuelve a los assets sin tocarlo.
 * `run_worker_first` en `wrangler.jsonc` está acotado a `/api/*` justamente
 * para eso — el `html_handling: auto-trailing-slash` del que dependen todas las
 * URLs públicas no pasa por aquí.
 *
 * `/api/*` se reenvía a `elysium-billing` (el servicio de `backend/`), que es
 * quien agenda reuniones, entrega el correo del CRM, genera recuperaciones de
 * contraseña, recibe consultas públicas y firma el acceso privado a R2.
 * Mantenerlo bajo el mismo origen evita CORS para la API; el PUT binario va
 * directamente al endpoint R2 permitido por la CSP y el CORS del bucket.
 *
 * Configuración: la variable `ELYSIUM_API_ORIGIN` apunta al servicio
 * desplegado (por ejemplo `https://elysium-billing-xxxx.europe-west1.run.app`).
 * Sin ella, `/api/*` responde 503 con un código que el CRM sabe traducir a
 * «el servicio no está desplegado» en vez de dar un 404 mudo.
 */

const API_PREFIX = '/api/';
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

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const host = url.hostname.toLowerCase();

        // Redirección por IP / Geolocalización en el dominio principal .eu (con anulación manual vía cookie)
        if ((host === 'elysiumdr.eu' || host === 'www.elysiumdr.eu') && (url.pathname === '/' || url.pathname === '/index.html')) {
            const cookieHeader = request.headers.get('Cookie') || '';
            const hasManualOverride = cookieHeader.includes('elysium_region_override=true');

            if (!hasManualOverride) {
                const country = request.cf?.country; // Código ISO de 2 letras provisto por Cloudflare (p. ej. 'ES', 'PT', 'CR')

                if (country === 'ES') {
                    const target = new URL(url.pathname + url.search, 'https://elysiumdr.es');
                    return Response.redirect(target.toString(), 302);
                } else if (country === 'PT') {
                    const target = new URL(url.pathname + url.search, 'https://elysiumdr.pt');
                    return Response.redirect(target.toString(), 302);
                } else if (country === 'CR') {
                    const target = new URL(url.pathname + url.search, 'https://elysiumdr.cr');
                    return Response.redirect(target.toString(), 302);
                }
            }
        }

        // Mapeo transparente para dominios nacionalizados (elysiumdr.es, elysiumdr.pt, elysiumdr.cr)
        if (host === 'elysiumdr.es' || host === 'www.elysiumdr.es') {
            if (url.pathname === '/llms.txt') {
                return env.ASSETS.fetch(new Request(new URL('/es/llms.txt', request.url), request));
            }
            if (url.pathname === '/llms-full.txt') {
                return env.ASSETS.fetch(new Request(new URL('/es/llms-full.txt', request.url), request));
            }
            const staticPrefixes = ['/CSS/', '/JS/', '/Images/', '/api/', '/sounds/', '/Titulos/', '/CV/', '/favicon'];
            const isStatic = staticPrefixes.some(p => url.pathname.startsWith(p)) || (url.pathname.includes('.') && !url.pathname.endsWith('.html'));

            if (!isStatic) {
                let targetPath = url.pathname;
                if (targetPath === '/' || targetPath === '/index.html') {
                    targetPath = '/es/';
                } else if (!targetPath.startsWith('/es/') && !targetPath.startsWith('/pt/')) {
                    targetPath = '/es' + (targetPath.startsWith('/') ? targetPath : '/' + targetPath);
                }
                const rewrittenUrl = new URL(targetPath + url.search, request.url);
                return env.ASSETS.fetch(new Request(rewrittenUrl, request));
            }
        }

        if (host === 'elysiumdr.pt' || host === 'www.elysiumdr.pt') {
            if (url.pathname === '/llms.txt') {
                return env.ASSETS.fetch(new Request(new URL('/pt/llms.txt', request.url), request));
            }
            if (url.pathname === '/llms-full.txt') {
                return env.ASSETS.fetch(new Request(new URL('/pt/llms-full.txt', request.url), request));
            }
            const staticPrefixes = ['/CSS/', '/JS/', '/Images/', '/api/', '/sounds/', '/Titulos/', '/CV/', '/favicon'];
            const isStatic = staticPrefixes.some(p => url.pathname.startsWith(p)) || (url.pathname.includes('.') && !url.pathname.endsWith('.html'));

            if (!isStatic) {
                let targetPath = url.pathname;
                if (targetPath === '/' || targetPath === '/index.html') {
                    targetPath = '/pt/';
                } else if (!targetPath.startsWith('/pt/') && !targetPath.startsWith('/es/')) {
                    targetPath = '/pt' + (targetPath.startsWith('/') ? targetPath : '/' + targetPath);
                }
                const rewrittenUrl = new URL(targetPath + url.search, request.url);
                return env.ASSETS.fetch(new Request(rewrittenUrl, request));
            }
        }

        if (host === 'elysiumdr.cr' || host === 'www.elysiumdr.cr') {
            if (url.pathname === '/llms.txt') {
                return env.ASSETS.fetch(new Request(new URL('/es/llms.txt', request.url), request));
            }
            if (url.pathname === '/llms-full.txt') {
                return env.ASSETS.fetch(new Request(new URL('/es/llms-full.txt', request.url), request));
            }
            const staticPrefixes = ['/CSS/', '/JS/', '/Images/', '/api/', '/sounds/', '/Titulos/', '/CV/', '/favicon'];
            const isStatic = staticPrefixes.some(p => url.pathname.startsWith(p)) || (url.pathname.includes('.') && !url.pathname.endsWith('.html'));

            if (!isStatic) {
                let targetPath = url.pathname;
                if (targetPath === '/' || targetPath === '/index.html') {
                    targetPath = '/es/';
                } else if (!targetPath.startsWith('/es/') && !targetPath.startsWith('/pt/')) {
                    targetPath = '/es' + (targetPath.startsWith('/') ? targetPath : '/' + targetPath);
                }
                const rewrittenUrl = new URL(targetPath + url.search, request.url);
                return env.ASSETS.fetch(new Request(rewrittenUrl, request));
            }
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
