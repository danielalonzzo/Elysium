/**
 * Enrutador del API.
 *
 * Una ruta se declara con su método, su patrón y su manejador. Antes de
 * llamarlo se resuelve la identidad una sola vez por petición; cada manejador
 * exige después lo suyo (papel, membresía, capacidad, módulo).
 *
 * Las rutas que escriben comprueban además el `Origin`: un ID token viaja en
 * la cabecera `Authorization`, que un formulario de otro sitio no puede poner,
 * pero la comprobación cuesta nada y cierra el caso de un cliente que algún
 * día guarde la sesión en una cookie.
 */

import { ApiError, errorResponse, fail, json } from './lib/http.js';
import { resolveUser } from './lib/context.js';
import { firebaseAuth, firestore } from './lib/firebase.js';
import { accountRoutes } from './routes/account.js';
import { tenantRoutes } from './routes/tenants.js';
import { adminRoutes } from './routes/admin.js';
import { configRoutes } from './routes/config.js';

const ROUTES = [...configRoutes, ...accountRoutes, ...tenantRoutes, ...adminRoutes];

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** '/tenants/:id/members/:uid' contra '/tenants/abc/members/u1'. */
function match(pattern, path) {
    const expected = pattern.split('/').filter(Boolean);
    const actual = path.split('/').filter(Boolean);
    if (expected.length !== actual.length) return null;
    const params = {};
    for (let index = 0; index < expected.length; index += 1) {
        const part = expected[index];
        if (part.startsWith(':')) {
            const value = decodeURIComponent(actual[index]);
            if (!value) return null;
            params[part.slice(1)] = value;
        } else if (part !== actual[index]) {
            return null;
        }
    }
    return params;
}

function checkOrigin(request, env) {
    const origin = request.headers.get('origin');
    if (!origin) return; // Cliente no navegador (pruebas, cron): no hay nada que falsificar.
    const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    if (allowed.length && !allowed.includes(origin)) fail(403, 'BAD_ORIGIN');
}

export async function handleApi(request, env, url, prefix) {
    const path = url.pathname.slice(prefix.length) || '/';

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: { allow: 'GET, POST, PUT, PATCH, DELETE, OPTIONS', 'cache-control': 'no-store' } });
    }

    // Los clientes de Firebase se montan al primer uso, no al construir el
    // contexto: si falta una variable, tienen que fallar DENTRO del try, para
    // que el cliente reciba un 503 con su código y no una traza del servidor.
    // Y una ruta inexistente sigue respondiendo 404 aunque no haya nada
    // configurado todavía.
    let dbClient = null;
    let authClient = null;
    const ctx = {
        request,
        env,
        url,
        params: {},
        get db() { return (dbClient ??= firestore(env)); },
        get auth() { return (authClient ??= firebaseAuth(env)); },
        user: null
    };

    try {
        if (!SAFE_METHODS.has(request.method)) checkOrigin(request, env);

        let handler = null;
        let methodMismatch = false;
        for (const route of ROUTES) {
            const params = match(route.path, path);
            if (!params) continue;
            if (route.method !== request.method) { methodMismatch = true; continue; }
            ctx.params = params;
            handler = route;
            break;
        }
        if (!handler) fail(methodMismatch ? 405 : 404, methodMismatch ? 'METHOD_NOT_ALLOWED' : 'ROUTE_NOT_FOUND');

        ctx.user = await resolveUser(ctx);
        const result = await handler.run(ctx);
        return result instanceof Response ? result : json(result ?? {});
    } catch (error) {
        if (error instanceof ApiError) return errorResponse(error);
        if (error?.code === 'CONFLICT') return errorResponse(new ApiError(409, 'CONFLICT'));
        if (error?.message === 'FIREBASE_SERVICE_ACCOUNT_MISSING' || /_MISSING$/.test(error?.message || '')) {
            return errorResponse(new ApiError(503, 'NOT_CONFIGURED'));
        }
        console.error('valtrix api', error?.stack || error);
        return errorResponse(new ApiError(500, 'UNAVAILABLE'));
    }
}
