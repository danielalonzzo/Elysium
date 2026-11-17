/**
 * Una ruta de un negocio.
 *
 * Toda ruta de `/tenants/:tenantId/…` responde las mismas cuatro preguntas en
 * el mismo orden antes de tocar un dato, y este envoltorio existe para que
 * ninguna ruta nueva se salte una por descuido:
 *
 *   1. ¿Quien llama pertenece a ESTE negocio?      → `resolveTenant`
 *   2. ¿La suscripción ya abrió este módulo?       → `requireModule`
 *   3. ¿Tiene la capacidad para esta operación?    → `requireAny` / `requireCapability`
 *   4. Si escribe: ¿la suscripción deja escribir?  → `requireCapability`
 *
 * Solo entonces se construye el motor, ya encerrado en ese negocio, y se le
 * entrega a la ruta. La ruta no recibe la base de datos: recibe el motor.
 *
 * Una lectura (GET) admite varias capacidades con `anyOf`: basta una. Una
 * escritura declara exactamente una.
 */

import { requireAny, requireCapability, requireModule, resolveTenant } from './context.js';
import { readJson } from './http.js';
import { route } from './route.js';
import { engineFor } from './store.js';

const READS = new Set(['GET', 'HEAD']);

export function tenantRoute(method, path, { module = null, capability = null, anyOf = null, maxBytes = 60000 }, run) {
    const reading = READS.has(method);
    if (!reading && !capability) throw new Error(`Una escritura declara su capacidad: ${method} ${path}`);
    if (reading && !capability && !anyOf) throw new Error(`Una lectura declara qué capacidad la permite: ${method} ${path}`);

    return route(method, `/tenants/:tenantId${path}`, async ctx => {
        const scope = await resolveTenant(ctx, ctx.params.tenantId);
        if (module) requireModule(scope, module);
        if (reading) requireAny(scope, anyOf || [capability]);
        else requireCapability(scope, capability);
        const body = reading ? {} : await readJson(ctx.request, maxBytes);
        return run(engineFor(ctx, scope), { params: ctx.params, query: ctx.url.searchParams, body, scope, ctx });
    });
}
