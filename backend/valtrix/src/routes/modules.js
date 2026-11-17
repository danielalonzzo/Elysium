/**
 * Los tres módulos del negocio —control financiero, orden operativo y
 * auditoría mensual—, montados sobre el API.
 *
 * La lista de rutas NO está aquí: está en el núcleo
 * (`VALTRIX Engineering/js/core/routes.js`), porque la demo despacha
 * exactamente las mismas dentro del navegador. Aquí cada entrada de esa tabla
 * pasa por `tenantRoute`, que es quien hace cumplir lo que la entrada declara:
 * que quien llama pertenece al negocio, que la suscripción ya abrió el módulo
 * y que tiene la capacidad.
 *
 * Añadir una ruta a un módulo es añadirla a esa tabla. Existe entonces en el
 * API y en la demo a la vez, y no hay una segunda lista que se quede atrás.
 */

import { routes } from '../core.js';
import { entitlementsOf } from '../lib/context.js';
import { tenantRoute } from '../lib/tenant-route.js';

export const moduleRoutes = routes.TENANT_ROUTES.map(entry => tenantRoute(
    entry.method,
    entry.path,
    { module: entry.module, capability: entry.capability, anyOf: entry.anyOf, maxBytes: entry.maxBytes },
    (engine, { params, query, body, scope }) => entry.run(engine, { params, query, body, modules: entitlementsOf(scope.subscription) })
));
