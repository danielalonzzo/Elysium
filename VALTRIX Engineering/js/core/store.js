/**
 * El almacén: lo único que el motor sabe de dónde viven los datos.
 *
 * El motor (ERP, QMS, auditoría, incorporación) no habla con Firestore ni con
 * nada concreto. Recibe un **almacén ya encerrado en un negocio** y le pide
 * seis cosas. Por eso el mismo motor corre en tres anfitriones:
 *
 *   · en el Worker, sobre Firestore, con la cuenta de servicio;
 *   · en el navegador, en memoria, para la demo con datos ficticios;
 *   · en Node, en memoria, para las pruebas (y contra los emuladores).
 *
 * Y por eso el aislamiento entre negocios no depende de que una función
 * recuerde filtrar: el almacén que recibe no sabe salir de `tenants/{id}/`.
 *
 * El contrato, que cumplen igual el almacén de memoria y el de Firestore:
 *
 *   get(colección, id)                 → documento | null
 *   getMany(colección, ids)            → Map id → documento
 *   query(colección, { where, orderBy, limit }) → documento[]
 *   count(colección, where)            → número
 *   commit(escrituras)                 → todas o ninguna; lanza CONFLICT si
 *                                        una precondición no se cumple
 *   write.create(colección, id, datos)             falla si ya existe
 *   write.set(colección, id, datos)                crea o reemplaza entero
 *   write.update(colección, id, datos, { updateTime })
 *                                                  solo esos campos; exige
 *                                                  que exista y, con
 *                                                  `updateTime`, que nadie
 *                                                  lo haya tocado desde que
 *                                                  se leyó
 *   write.merge(colección, id, datos, { increments })
 *                                                  crea si no existe; fusiona
 *                                                  esos campos (al menos uno)
 *                                                  y suma enteros sin leer
 *                                                  antes
 *   write.remove(colección, id)
 *
 * Un documento leído es `{ id, ...campos, _updateTime }`. `_updateTime` es
 * opaco: solo sirve para devolvérselo a `write.update`.
 *
 * Dos reglas de uso que valen para los dos almacenes:
 *
 *   1. Una consulta combina igualdades, o UN rango sobre un solo campo. Lo
 *      demás se filtra y se ordena en memoria. Así ninguna consulta necesita
 *      un índice compuesto, que el emulador no exige y producción sí.
 *   2. Un `commit` no escribe dos veces el mismo documento. Firestore lo
 *      admitiría, pero la precondición de la segunda escritura ya no significa
 *      lo mismo; el almacén de memoria lo rechaza para que no se cuele.
 */

export class StoreConflict extends Error {
    constructor(detail = '') {
        super(`STORE_CONFLICT: ${detail}`);
        this.name = 'StoreConflict';
        this.code = 'CONFLICT';
    }
}

const clone = value => (value === undefined ? undefined : structuredClone(value));

function clean(data) {
    const result = {};
    for (const [key, value] of Object.entries(data || {})) {
        if (value === undefined) continue;
        // `_updateTime` y compañía son del almacén. Si aparecen en una
        // escritura es que alguien volcó un documento leído tal cual.
        if (key.startsWith('_') || key === 'id') throw new Error(`STORE_RESERVED_FIELD: ${key}`);
        result[key] = clone(value);
    }
    return result;
}

function compare(a, b) {
    if (a === b) return 0;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a) < String(b) ? -1 : 1;
}

const TESTS = {
    '==': (field, value) => field === value,
    '!=': (field, value) => field !== undefined && field !== null && field !== value,
    '<': (field, value) => field !== undefined && field !== null && compare(field, value) < 0,
    '<=': (field, value) => field !== undefined && field !== null && compare(field, value) <= 0,
    '>': (field, value) => field !== undefined && field !== null && compare(field, value) > 0,
    '>=': (field, value) => field !== undefined && field !== null && compare(field, value) >= 0,
    in: (field, value) => Array.isArray(value) && value.includes(field),
    'array-contains': (field, value) => Array.isArray(field) && field.includes(value)
};

function matches(data, where) {
    return where.every(([field, op, value]) => {
        const test = TESTS[op];
        if (!test) throw new Error(`STORE_UNSUPPORTED_OPERATOR: ${op}`);
        return test(data[field], value);
    });
}

function increment(target, path, amount) {
    const parts = path.split('.');
    let node = target;
    for (const part of parts.slice(0, -1)) {
        if (typeof node[part] !== 'object' || node[part] === null || Array.isArray(node[part])) node[part] = {};
        node = node[part];
    }
    const last = parts.at(-1);
    node[last] = (Number.isFinite(node[last]) ? node[last] : 0) + amount;
}

/**
 * Almacén en memoria. Imita lo que el motor usa de Firestore —precondiciones,
 * escrituras atómicas, incrementos— y nada más.
 */
export function memoryStore() {
    /** ruta de la colección → Map id → { data, version } */
    const collections = new Map();
    let clock = 0;

    const bucket = collection => {
        let found = collections.get(collection);
        if (!found) { found = new Map(); collections.set(collection, found); }
        return found;
    };

    const unpack = (id, entry) => ({ id, ...clone(entry.data), _updateTime: `v${entry.version}` });

    const store = {
        kind: 'memory',

        async get(collection, id) {
            if (!id) return null;
            const entry = collections.get(collection)?.get(String(id));
            return entry ? unpack(String(id), entry) : null;
        },

        async getMany(collection, ids) {
            const found = new Map();
            const source = collections.get(collection);
            for (const id of new Set((ids || []).filter(Boolean).map(String))) {
                const entry = source?.get(id);
                if (entry) found.set(id, unpack(id, entry));
            }
            return found;
        },

        async query(collection, { where = [], orderBy = [], limit = 500 } = {}) {
            let rows = [];
            for (const [id, entry] of collections.get(collection) || []) {
                if (matches(entry.data, where)) rows.push(unpack(id, entry));
            }
            if (orderBy.length) {
                // Como Firestore: un documento sin el campo de orden no sale.
                rows = rows.filter(row => orderBy.every(([field]) => row[field] !== undefined && row[field] !== null));
                rows.sort((a, b) => {
                    for (const [field, direction = 'asc'] of orderBy) {
                        const order = compare(a[field], b[field]);
                        if (order) return direction === 'desc' ? -order : order;
                    }
                    return compare(a.id, b.id);
                });
            } else {
                rows.sort((a, b) => compare(a.id, b.id));
            }
            return rows.slice(0, limit);
        },

        async count(collection, where = []) {
            let total = 0;
            for (const entry of (collections.get(collection) || new Map()).values()) if (matches(entry.data, where)) total += 1;
            return total;
        },

        async commit(writes) {
            if (!writes?.length) return;
            const seen = new Set();
            for (const write of writes) {
                const key = `${write.collection}/${write.id}`;
                if (seen.has(key)) throw new Error(`STORE_DUPLICATE_WRITE: ${key}`);
                seen.add(key);
                const entry = collections.get(write.collection)?.get(write.id);
                if (write.op === 'create' && entry) throw new StoreConflict(`ya existe ${key}`);
                if (write.op === 'update') {
                    if (!entry) throw new StoreConflict(`no existe ${key}`);
                    if (write.updateTime && write.updateTime !== `v${entry.version}`) throw new StoreConflict(`cambió ${key}`);
                }
            }
            // Todas las precondiciones se cumplen: ahora sí se escribe.
            for (const write of writes) {
                const target = bucket(write.collection);
                const entry = target.get(write.id);
                clock += 1;
                if (write.op === 'remove') { target.delete(write.id); continue; }
                let data;
                if (write.op === 'create' || write.op === 'set') data = clone(write.data);
                else data = { ...clone(entry?.data || {}), ...clone(write.data) };
                for (const [path, amount] of Object.entries(write.increments || {})) increment(data, path, amount);
                target.set(write.id, { data, version: clock });
            }
        },

        write: {
            create: (collection, id, data) => ({ op: 'create', collection, id: String(id), data: clean(data) }),
            set: (collection, id, data) => ({ op: 'set', collection, id: String(id), data: clean(data) }),
            update: (collection, id, data, { updateTime = null } = {}) => ({ op: 'update', collection, id: String(id), data: clean(data), updateTime }),
            merge: (collection, id, data, { increments = {} } = {}) => {
                const fields = clean(data);
                // La misma regla que el almacén de Firestore: una fusión
                // siempre nombra al menos un campo.
                if (!Object.keys(fields).length) throw new Error(`STORE_EMPTY_MERGE: ${collection}/${id}`);
                for (const [path, amount] of Object.entries(increments)) if (!Number.isSafeInteger(amount)) throw new Error(`STORE_BAD_INCREMENT: ${path}`);
                return { op: 'merge', collection, id: String(id), data: fields, increments };
            },
            remove: (collection, id) => ({ op: 'remove', collection, id: String(id) })
        },

        /** Solo para la demo y las pruebas: cuántos documentos hay en cada colección. */
        inspect() {
            return Object.fromEntries([...collections].map(([name, rows]) => [name, rows.size]));
        }
    };
    return store;
}

/**
 * Encierra un almacén en una carpeta: todo lo que se le pida vive debajo de
 * `prefijo/`. Es lo que convierte «un almacén» en «el almacén de ESTE negocio».
 */
export function scopedStore(store, prefix) {
    const path = collection => `${prefix}/${collection}`;
    return {
        kind: store.kind,
        get: (collection, id) => store.get(path(collection), id),
        getMany: (collection, ids) => store.getMany(path(collection), ids),
        query: (collection, options) => store.query(path(collection), options),
        count: (collection, where) => store.count(path(collection), where),
        commit: writes => store.commit(writes),
        write: {
            create: (collection, id, data) => store.write.create(path(collection), id, data),
            set: (collection, id, data) => store.write.set(path(collection), id, data),
            update: (collection, id, data, options) => store.write.update(path(collection), id, data, options),
            merge: (collection, id, data, options) => store.write.merge(path(collection), id, data, options),
            remove: (collection, id) => store.write.remove(path(collection), id)
        }
    };
}

/** Escribe por tandas: un `commit` de Firestore admite 500 escrituras. */
export async function commitInChunks(store, writes, size = 400) {
    for (let index = 0; index < writes.length; index += size) await store.commit(writes.slice(index, index + size));
}

/**
 * El contexto con que trabaja el motor. `can` responde si quien llama tiene
 * una capacidad; el motor solo la usa para decidir qué ENSEÑA (costos y
 * márgenes). Lo que se puede HACER lo decide el anfitrión antes de llamar.
 */
export function engineScope({ store, tenant, actor, now = () => new Date(), can = () => true }) {
    return {
        store,
        tenant: {
            id: tenant.id,
            name: tenant.name,
            timezone: tenant.timezone || 'America/Costa_Rica',
            currency: tenant.baseCurrency || tenant.currency || 'CRC'
        },
        actor: { uid: actor.uid, name: actor.name || '' },
        now,
        can
    };
}
