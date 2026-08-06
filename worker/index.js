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
 * quien agenda reuniones, envía la confirmación al cliente, la copia al
 * administrador y la invitación de calendario. Mantenerlo bajo el mismo origen
 * evita CORS y evita tener que abrir otro host en la CSP.
 *
 * Configuración: la variable `ELYSIUM_API_ORIGIN` apunta al servicio
 * desplegado (por ejemplo `https://elysium-billing-xxxx.europe-west1.run.app`).
 * Sin ella, `/api/*` responde 503 con un código que el CRM sabe traducir a
 * «el servicio no está desplegado» en vez de dar un 404 mudo.
 */

const API_PREFIX = '/api/';

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

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
        // Idempotency-Key) y el cuerpo sin decodificar — el webhook de Stripe
        // valida su firma sobre los bytes originales, así que no se pueden
        // tocar.
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
