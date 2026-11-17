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

import { DomainError } from './core.js';
import { ApiError, errorResponse, fail, json } from './lib/http.js';
import { resolveUser } from './lib/context.js';
import { firebaseAuth, firestore } from './lib/firebase.js';
import { accountRoutes } from './routes/account.js';
import { adminRoutes } from './routes/admin.js';
import { configRoutes } from './routes/config.js';
import { intakeRoutes } from './routes/intake.js';
import { leadRoutes } from './routes/leads.js';
import { moduleRoutes } from './routes/modules.js';
import { tenantRoutes } from './routes/tenants.js';

/**
 * El orden importa solo donde un tramo fijo compite con uno variable
 * («/reports/preview» antes que «/reports/:period»); cada lista lo cuida
 * dentro de sí misma.
 */
const ROUTES = [
    ...configRoutes, ...accountRoutes,
    ...tenantRoutes, ...moduleRoutes,
    ...adminRoutes, ...leadRoutes, ...intakeRoutes
];

/** Para las pruebas: la tabla de rutas declaradas. */
export const routeTable = () => ROUTES.map(route => ({ method: route.method, path: route.path }));

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

export async function handleApi(request, env, url, prefix, executionCtx = null) {
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
        /** Trabajo que sigue después de responder, sin perderlo si el aislamiento se cierra. */
        waitUntil: executionCtx?.waitUntil ? executionCtx.waitUntil.bind(executionCtx) : null,
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
        // Un error del motor trae su código y su estado, igual que uno del API.
        if (error instanceof ApiError || error instanceof DomainError) return errorResponse(error);
        if (error?.code === 'CONFLICT') return errorResponse(new ApiError(409, 'CONFLICT'));
        if (error?.message === 'FIREBASE_SERVICE_ACCOUNT_MISSING' || /_MISSING$/.test(error?.message || '')) {
            return errorResponse(new ApiError(503, 'NOT_CONFIGURED'));
        }
        console.error('valtrix api', error?.stack || error);
        return errorResponse(new ApiError(500, 'UNAVAILABLE'));
    }
}
