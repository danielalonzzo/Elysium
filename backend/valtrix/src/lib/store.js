/**
 * El almacén de un negocio, sobre Firestore.
 *
 * El motor (control financiero, orden operativo, auditoría, incorporación) no
 * conoce Firestore: recibe un almacén con seis operaciones y trabaja con él.
 * Aquí se construye ese almacén para el Worker, **ya encerrado en un negocio**:
 * toda ruta que el motor pida vive debajo de `tenants/{tenantId}/`, y no hay
 * forma de pedirle otra. El aislamiento entre negocios no depende de que una
 * función del motor recuerde filtrar.
 *
 * Cumple el mismo contrato que el almacén de memoria del núcleo
 * (`VALTRIX Engineering/js/core/store.js`), que usan la demo y las pruebas.
 * `test/store.emulator.mjs` corre el mismo examen contra los dos.
 */

import { engineScope } from '../core.js';
import { can } from './context.js';

/** Lo que el adaptador de Firestore añade para sus propias consultas de grupo. */
const tidy = document => {
    if (!document) return document;
    const { _path, _parent, ...rest } = document;
    return rest;
};

function guard(data) {
    for (const key of Object.keys(data || {})) {
        // Igual que el almacén de memoria: si aparece `_updateTime` o `id` en
        // una escritura es que alguien volcó un documento leído tal cual.
        if (key.startsWith('_') || key === 'id') throw new Error(`STORE_RESERVED_FIELD: ${key}`);
    }
    return data;
}

export function tenantStore(db, tenantId) {
    if (!tenantId || /[/]/.test(tenantId)) throw new Error('INVALID_TENANT_ID');
    const path = collection => `tenants/${tenantId}/${collection}`;
    return {
        kind: 'firestore',
        get: async (collection, id) => tidy(await db.get(path(collection), id)),
        async getMany(collection, ids) {
            const found = await db.getMany(path(collection), ids || []);
            return new Map([...found].map(([id, document]) => [id, tidy(document)]));
        },
        query: async (collection, options) => (await db.query(path(collection), options)).map(tidy),
        count: (collection, where) => db.count(path(collection), where),
        commit: writes => db.commit(writes),
        write: {
            create: (collection, id, data) => db.write.create(path(collection), id, guard(data)),
            set: (collection, id, data) => db.write.set(path(collection), id, guard(data)),
            update: (collection, id, data, { updateTime = null } = {}) => db.write.update(path(collection), id, guard(data), { updateTime }),
            merge: (collection, id, data, options) => db.write.merge(path(collection), id, guard(data), options),
            remove: (collection, id) => db.write.remove(path(collection), id)
        }
    };
}

/**
 * El contexto con que el motor trabaja para quien llama, en el negocio que
 * `resolveTenant` ya comprobó. `can` solo decide qué ENSEÑA el motor (costos y
 * márgenes); lo que se puede HACER lo exige cada ruta antes de llegar aquí.
 */
export function engineFor(ctx, scope) {
    return engineScope({
        store: tenantStore(ctx.db, scope.id),
        tenant: { id: scope.id, name: scope.tenant.name, timezone: scope.tenant.timezone, baseCurrency: scope.tenant.baseCurrency },
        actor: { uid: ctx.user.uid, name: ctx.user.name },
        can: capability => can(scope, capability)
    });
}

/**
 * El motor trabajando para VALTRIX y no para una persona del negocio: la carga
 * de la incorporación y los procesos automáticos (cierre del mes, avisos). No
 * pasa por una membresía porque no hay nadie del negocio llamando; por eso
 * solo lo usan las rutas de administración y el cron, nunca una ruta del
 * negocio.
 */
export function systemEngine(db, tenant, actor = { uid: 'system', name: 'VALTRIX' }, now = () => new Date()) {
    return engineScope({
        store: tenantStore(db, tenant.id),
        tenant: { id: tenant.id, name: tenant.name, timezone: tenant.timezone, baseCurrency: tenant.baseCurrency },
        actor,
        now
    });
}
