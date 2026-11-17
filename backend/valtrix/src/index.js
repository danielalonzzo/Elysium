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
import { runScheduled } from './scheduled.js';

const API_PREFIX = '/api';

/**
 * Las dos páginas que son aplicación y no sitio: la cuenta y el formulario de
 * incorporación. Llevan datos de un negocio, así que no se indexan, no se
 * guardan en ninguna caché compartida y tienen su propia política de contenido.
 */
const APP_PAGE = /^\/(cuenta|incorporacion)(?:[/.]|$)/;

/**
 * La política de contenido de esas páginas.
 *
 * Va aquí y no en un `_headers` porque el host del emulador solo se permite
 * cuando está configurado: en producción la política no lleva ni una línea
 * de desarrollo, y en local se puede probar el inicio de sesión de verdad.
 *
 * La cuenta abre `www.gstatic.com` en `script-src` porque de ahí viene el SDK
 * de Firebase, y solo el módulo de autenticación: el portal no habla con
 * Firestore, que las reglas niegan entero. El formulario de incorporación no
 * inicia sesión —se entra con el enlace—, así que ni eso.
 */
function appCsp(env, page) {
    const signsIn = page === 'cuenta';
    const connect = ["'self'"];
    if (signsIn) connect.push('https://*.googleapis.com', 'https://securetoken.googleapis.com');
    const emulator = env.FIREBASE_AUTH_EMULATOR_HOST;
    if (signsIn && emulator) connect.push(`http://${emulator}`, `http://localhost:${emulator.split(':')[1] || '9099'}`);
    return [
        "default-src 'self'",
        signsIn ? "script-src 'self' https://www.gstatic.com" : "script-src 'self'",
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
    async fetch(request, env, executionCtx) {
        const url = new URL(request.url);

        if (url.pathname === API_PREFIX || url.pathname.startsWith(`${API_PREFIX}/`)) {
            return handleApi(request, env, url, API_PREFIX, executionCtx);
        }

        const response = await env.ASSETS.fetch(request);
        const headers = new Headers(response.headers);
        for (const [key, value] of Object.entries(BASE_HEADERS)) headers.set(key, value);

        const page = APP_PAGE.exec(url.pathname)?.[1];
        if (page) {
            headers.set('content-security-policy', appCsp(env, page));
            headers.set('x-robots-tag', 'noindex, nofollow');
            headers.set('cache-control', 'no-store');
            // El enlace de incorporación lleva su token en el fragmento. El
            // fragmento no viaja en el Referer, pero la página tampoco tiene
            // por qué decirle a nadie de dónde viene quien la abre.
            if (page === 'incorporacion') headers.set('referrer-policy', 'no-referrer');
        }

        return new Response(response.body, { status: response.status, headers });
    },

    /**
     * El cron: cierres del mes, avisos de mantenimiento y pagos vencidos. Ver
     * `scheduled.js`. `waitUntil` deja terminar la pasada aunque el evento
     * devuelva antes.
     */
    async scheduled(controller, env, executionCtx) {
        const pass = runScheduled(env).then(summary => console.log('valtrix cron', JSON.stringify(summary)));
        if (executionCtx?.waitUntil) executionCtx.waitUntil(pass);
        else await pass;
    }
};
