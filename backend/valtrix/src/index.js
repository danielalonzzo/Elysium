/**
 * Worker de VALTRIX.
 *
 * Sirve el sitio y el portal desde los assets, y el API bajo `/api/`. Es un
 * Worker propio, aparte del de Elysium, por dos razones: el día que VALTRIX
 * tenga su dominio la mudanza es apuntar el dominio y nada más, y mientras
 * tanto una caída suya no se lleva por delante `elysiumdr.eu`.
 *
 * Hasta que exista el dominio, `elysiumdr.eu/VALTRIX` sigue sirviendo las
 * mismas páginas desde el Worker de Elysium. Son los mismos ficheros; lo que
 * solo existe aquí es el API.
 */

import { handleApi } from './api.js';

const API_PREFIX = '/api';

/**
 * La política de contenido del portal.
 *
 * Va aquí y no en un `_headers` porque el host del emulador solo se permite
 * cuando está configurado: en producción la política no lleva ni una línea
 * de desarrollo, y en local se puede probar el inicio de sesión de verdad.
 *
 * `script-src` abre `www.gstatic.com` porque de ahí viene el SDK de Firebase,
 * y solo el módulo de autenticación: el portal no habla con Firestore, que las
 * reglas niegan entero.
 */
function portalCsp(env) {
    const connect = ["'self'", 'https://*.googleapis.com', 'https://securetoken.googleapis.com'];
    const emulator = env.FIREBASE_AUTH_EMULATOR_HOST;
    if (emulator) connect.push(`http://${emulator}`, `http://localhost:${emulator.split(':')[1] || '9099'}`);
    return [
        "default-src 'self'",
        "script-src 'self' https://www.gstatic.com",
        "style-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        `connect-src ${connect.join(' ')}`,
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
    ].join('; ');
}

const BASE_HEADERS = {
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === API_PREFIX || url.pathname.startsWith(`${API_PREFIX}/`)) {
            return handleApi(request, env, url, API_PREFIX);
        }

        const response = await env.ASSETS.fetch(request);
        const headers = new Headers(response.headers);
        for (const [key, value] of Object.entries(BASE_HEADERS)) headers.set(key, value);

        // `cuenta*` es el portal: lleva datos de un negocio, no se indexa y no
        // se guarda en ninguna caché compartida.
        if (/^\/cuenta/.test(url.pathname)) {
            headers.set('content-security-policy', portalCsp(env));
            headers.set('x-robots-tag', 'noindex, nofollow');
            headers.set('cache-control', 'no-store');
        }

        return new Response(response.body, { status: response.status, headers });
    }
};
