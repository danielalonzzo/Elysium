/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Firebase para el Worker — Firestore REST e Identity Toolkit, sin SDK
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  El navegador nunca toca Firestore: las reglas lo cierran entero
 *  (`firestore.rules`) y todo pasa por aquí, con la cuenta de servicio del
 *  proyecto VALTRIX. Esa cuenta necesita `roles/datastore.user` (datos) y
 *  `roles/firebaseauth.admin` (crear cuentas y fijar el custom claim `role`).
 *
 *  Adaptado del Worker de ONCORE (`λ/ONCORE/ONCORE/worker/firebase.js`), que
 *  resolvió lo mismo sin SDK. Tres cosas son propias de VALTRIX, y las tres
 *  salen de que aquí hay varios negocios en el mismo proyecto:
 *
 *   1. **Las rutas llevan varios segmentos.** `tenants/abc/products` es una
 *      colección válida en todo este módulo. El identificador del negocio es
 *      parte de la ruta, así que el aislamiento no depende de que una consulta
 *      recuerde filtrar.
 *   2. **`query` pide el padre.** Una consulta sobre una subcolección se lanza
 *      contra `…/documents/tenants/abc`, no contra la raíz.
 *   3. **`queryGroup` existe** para la única pregunta que cruza negocios a
 *      propósito: «¿a qué negocios pertenece esta persona?», sobre `members`.
 *
 *  Con `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` el mismo
 *  código habla con los emuladores locales: así corren las pruebas, sin tocar
 *  nunca el proyecto real.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const SCOPES = 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit';
const encoder = new TextEncoder();

/** Errores con significado para quien llama: conflicto de escritura o recurso ausente. */
export class FirestoreConflict extends Error {
    constructor(detail) { super(`FIRESTORE_CONFLICT: ${detail}`); this.code = 'CONFLICT'; }
}
export class AuthError extends Error {
    constructor(code, detail = '') { super(`AUTH_${code}: ${detail}`); this.code = code; }
}

/* ------------------------------------------------------------------ *
 * Token de la cuenta de servicio
 * ------------------------------------------------------------------ */

const tokenCache = new Map();

function base64url(bytes) {
    let binary = '';
    for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemBytes(pem) {
    const binary = atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, ''));
    return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function serviceToken(env) {
    if (env.GOOGLE_ACCESS_TOKEN) return env.GOOGLE_ACCESS_TOKEN;
    const account = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT || '{}');
    if (!account.client_email || !account.private_key) throw new Error('FIREBASE_SERVICE_ACCOUNT_MISSING');
    const cached = tokenCache.get(account.client_email);
    if (cached && Date.now() < cached.expires - 60000) return cached.token;
    const key = await crypto.subtle.importKey('pkcs8', pemBytes(account.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    const issued = Math.floor(Date.now() / 1000);
    const header = base64url(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
    const claims = base64url(encoder.encode(JSON.stringify({ iss: account.client_email, scope: SCOPES, aud: 'https://oauth2.googleapis.com/token', iat: issued, exp: issued + 3600 })));
    const unsigned = `${header}.${claims}`;
    const signature = base64url(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(unsigned))));
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` })
    });
    if (!response.ok) throw new Error('FIREBASE_SERVICE_AUTH_FAILED');
    const data = await response.json();
    tokenCache.set(account.client_email, { token: data.access_token, expires: Date.now() + data.expires_in * 1000 });
    return data.access_token;
}

/* ------------------------------------------------------------------ *
 * Codificación de valores de Firestore
 * ------------------------------------------------------------------ */

export function encodeValue(value) {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) throw new Error('INVALID_FIRESTORE_NUMBER');
        // El dinero viaja en enteros de la unidad menor; un `double` aquí sería un error de modelo.
        return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    }
    if (value instanceof Date) return { timestampValue: value.toISOString() };
    if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
    if (typeof value === 'object') return { mapValue: { fields: encodeFields(value) } };
    throw new Error('INVALID_FIRESTORE_VALUE');
}

export function encodeFields(data) {
    const fields = {};
    for (const [key, value] of Object.entries(data)) if (value !== undefined) fields[key] = encodeValue(value);
    return fields;
}

function decodeValue(value) {
    if ('stringValue' in value) return value.stringValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return value.doubleValue;
    if ('booleanValue' in value) return value.booleanValue;
    if ('timestampValue' in value) return value.timestampValue;
    if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
    if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
    return null;
}

function decodeFields(fields) {
    return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

/**
 * `_path` es la ruta relativa completa («tenants/abc/members/u1»): una consulta
 * de grupo de colecciones devuelve documentos de varios negocios, y sin ella no
 * se sabría de cuál es cada uno.
 */
function unpack(document, databasePrefix) {
    const path = document.name.slice(databasePrefix.length);
    const segments = path.split('/');
    return {
        id: decodeURIComponent(segments.at(-1)),
        _path: path,
        _parent: segments.slice(0, -2).join('/'),
        ...decodeFields(document.fields || {}),
        _updateTime: document.updateTime
    };
}

const OPERATORS = {
    '==': 'EQUAL', '!=': 'NOT_EQUAL', '<': 'LESS_THAN', '<=': 'LESS_THAN_OR_EQUAL',
    '>': 'GREATER_THAN', '>=': 'GREATER_THAN_OR_EQUAL', 'array-contains': 'ARRAY_CONTAINS',
    in: 'IN', 'array-contains-any': 'ARRAY_CONTAINS_ANY'
};

function whereClause(filters = []) {
    const clauses = filters.map(([field, op, value]) => ({
        fieldFilter: { field: { fieldPath: field }, op: OPERATORS[op], value: encodeValue(value) }
    }));
    if (!clauses.length) return undefined;
    return clauses.length === 1 ? clauses[0] : { compositeFilter: { op: 'AND', filters: clauses } };
}

/**
 * Parte «tenants/abc/products» en el padre y el último segmento, que es lo que
 * piden `runQuery` y los nombres de documento.
 */
function splitCollection(collection) {
    const segments = String(collection).split('/').filter(Boolean);
    if (!segments.length || segments.length % 2 === 0) throw new Error(`INVALID_COLLECTION_PATH: ${collection}`);
    return { parent: segments.slice(0, -1).join('/'), collectionId: segments.at(-1) };
}

/* ------------------------------------------------------------------ *
 * Firestore
 * ------------------------------------------------------------------ */

export function firestore(env) {
    const project = env.FIREBASE_PROJECT_ID;
    if (!project) throw new Error('FIREBASE_PROJECT_ID_MISSING');
    const emulator = env.FIRESTORE_EMULATOR_HOST;
    const base = emulator ? `http://${emulator}/v1` : 'https://firestore.googleapis.com/v1';
    const database = `projects/${project}/databases/(default)`;
    const root = `${base}/${database}/documents`;
    const prefix = `${database}/documents/`;

    /** Los segmentos se codifican uno a uno: la barra separa, no forma parte de un id. */
    const documentName = (collection, id) => prefix + [...String(collection).split('/'), String(id)].map(encodeURIComponent).join('/');
    const documentUrl = (collection, id) => `${root}/${[...String(collection).split('/'), String(id)].map(encodeURIComponent).join('/')}`;

    async function call(url, options = {}) {
        const token = emulator ? 'owner' : await serviceToken(env);
        const response = await fetch(url, {
            ...options,
            headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(options.headers || {}) }
        });
        if (response.status === 404 && options.allowMissing) return null;
        if (!response.ok) {
            const detail = (await response.text()).slice(0, 300);
            if (response.status === 409 || /FAILED_PRECONDITION|ALREADY_EXISTS|ABORTED/.test(detail)) throw new FirestoreConflict(detail);
            if (response.status === 404) throw new FirestoreConflict(detail);
            throw new Error(`FIRESTORE_${response.status}: ${detail}`);
        }
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    /** Escritura para `commit`. `precondition`: { exists } o { updateTime }. */
    function setWrite(collection, id, data, { mask = null, precondition = null, transforms = null } = {}) {
        const write = { update: { name: documentName(collection, id), fields: encodeFields(data) } };
        if (mask) write.updateMask = { fieldPaths: mask };
        if (precondition) write.currentDocument = precondition;
        if (transforms) write.updateTransforms = transforms;
        return write;
    }

    async function runQuery(url, structuredQuery) {
        const result = await call(url, { method: 'POST', body: JSON.stringify({ structuredQuery }) });
        return (result || []).filter(entry => entry.document).map(entry => unpack(entry.document, prefix));
    }

    function buildQuery(collectionId, { where, orderBy, limit, select, allDescendants = false }) {
        const structuredQuery = { from: [{ collectionId, allDescendants }], limit };
        const filter = whereClause(where);
        if (filter) structuredQuery.where = filter;
        if (orderBy.length) {
            structuredQuery.orderBy = orderBy.map(([field, direction = 'asc']) => ({
                field: { fieldPath: field }, direction: direction === 'desc' ? 'DESCENDING' : 'ASCENDING'
            }));
        }
        if (select) structuredQuery.select = { fields: select.map(fieldPath => ({ fieldPath })) };
        return structuredQuery;
    }

    const api = {
        project,
        emulator: Boolean(emulator),
        documentName,

        async get(collection, id) {
            if (!id) return null;
            const document = await call(documentUrl(collection, id), { allowMissing: true });
            return document ? unpack(document, prefix) : null;
        },

        /** Lectura en lote dentro de UNA colección. Devuelve un Map id → documento. */
        async getMany(collection, ids) {
            const unique = [...new Set(ids.filter(Boolean))];
            const found = new Map();
            for (let index = 0; index < unique.length; index += 300) {
                const chunk = unique.slice(index, index + 300);
                const result = await call(`${root}:batchGet`, {
                    method: 'POST',
                    body: JSON.stringify({ documents: chunk.map(id => documentName(collection, id)) })
                });
                for (const entry of result || []) if (entry.found) { const doc = unpack(entry.found, prefix); found.set(doc.id, doc); }
            }
            return found;
        },

        /** Crea el documento; falla con FirestoreConflict si ya existe. */
        async create(collection, id, data) {
            await api.commit([setWrite(collection, id, data, { precondition: { exists: false } })]);
            return { id, ...data };
        },

        /** Escribe el documento entero (lo crea o lo reemplaza). */
        async set(collection, id, data) {
            await api.commit([setWrite(collection, id, data)]);
            return { id, ...data };
        },

        /** Actualiza solo los campos dados. Con `updateTime`, falla si el documento cambió. */
        async update(collection, id, data, updateTime = null) {
            await api.commit([setWrite(collection, id, data, {
                mask: Object.keys(data),
                precondition: updateTime ? { updateTime } : { exists: true }
            })]);
        },

        async remove(collection, id) {
            await api.commit([{ delete: documentName(collection, id) }]);
        },

        /**
         * Consulta dentro de una colección, que puede estar dentro de un negocio
         * («tenants/abc/products»). Sin índices compuestos: quien llama combina
         * como mucho igualdades con un solo rango, u ordena en memoria.
         */
        async query(collection, { where = [], orderBy = [], limit = 500, select = null } = {}) {
            const { parent, collectionId } = splitCollection(collection);
            const url = parent
                ? `${root}/${parent.split('/').map(encodeURIComponent).join('/')}:runQuery`
                : `${root}:runQuery`;
            return runQuery(url, buildQuery(collectionId, { where, orderBy, limit, select }));
        },

        /**
         * Consulta de grupo de colecciones: cruza TODOS los negocios a propósito.
         * Existe para una sola pregunta —«¿a qué negocios pertenece este uid?»,
         * sobre `members`— y cada uso nuevo merece justificarse, porque es la
         * única puerta del API que no está encerrada en un `tenantId`.
         */
        async queryGroup(collectionId, { where = [], orderBy = [], limit = 500, select = null } = {}) {
            return runQuery(`${root}:runQuery`, buildQuery(collectionId, { where, orderBy, limit, select, allDescendants: true }));
        },

        async count(collection, where = []) {
            const { parent, collectionId } = splitCollection(collection);
            const url = parent
                ? `${root}/${parent.split('/').map(encodeURIComponent).join('/')}:runAggregationQuery`
                : `${root}:runAggregationQuery`;
            const structuredQuery = { from: [{ collectionId }] };
            const filter = whereClause(where);
            if (filter) structuredQuery.where = filter;
            const result = await call(url, {
                method: 'POST',
                body: JSON.stringify({ structuredAggregationQuery: { structuredQuery, aggregations: [{ alias: 'n', count: {} }] } })
            });
            return Number(result?.[0]?.result?.aggregateFields?.n?.integerValue || 0);
        },

        /** Escrituras atómicas: todas o ninguna. Lanza FirestoreConflict si falla alguna precondición. */
        async commit(writes) {
            if (!writes.length) return null;
            return call(`${root}:commit`, { method: 'POST', body: JSON.stringify({ writes }) });
        },

        write: {
            create: (collection, id, data) => setWrite(collection, id, data, { precondition: { exists: false } }),
            set: (collection, id, data) => setWrite(collection, id, data),
            /**
             * Con `updateTime`, el commit falla si alguien escribió entre la
             * lectura y la escritura. Es la precondición que impide vender dos
             * veces la última unidad: la ruta reintenta o devuelve STOCK_CHANGED.
             */
            update: (collection, id, data, { updateTime = null, transforms = null } = {}) => setWrite(collection, id, data, {
                mask: Object.keys(data),
                precondition: updateTime ? { updateTime } : { exists: true },
                transforms
            }),
            remove: (collection, id, { mustExist = false } = {}) => (
                mustExist ? { delete: documentName(collection, id), currentDocument: { exists: true } } : { delete: documentName(collection, id) }
            ),
            appendToArray: (collection, id, field, values) => ({
                transform: {
                    document: documentName(collection, id),
                    fieldTransforms: [{ fieldPath: field, appendMissingElements: { values: values.map(encodeValue) } }]
                }
            })
        }
    };
    return api;
}

/* ------------------------------------------------------------------ *
 * Identity Toolkit (Firebase Auth)
 * ------------------------------------------------------------------ */

export function firebaseAuth(env) {
    const project = env.FIREBASE_PROJECT_ID;
    const apiKey = env.FIREBASE_API_KEY;
    const emulator = env.FIREBASE_AUTH_EMULATOR_HOST;
    if (!project) throw new Error('FIREBASE_PROJECT_ID_MISSING');
    if (!apiKey && !emulator) throw new Error('FIREBASE_API_KEY_MISSING');
    const base = emulator ? `http://${emulator}/identitytoolkit.googleapis.com/v1` : 'https://identitytoolkit.googleapis.com/v1';

    async function admin(path, body) {
        const token = emulator ? 'owner' : await serviceToken(env);
        const response = await fetch(`${base}/projects/${project}/${path}`, {
            method: 'POST',
            headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = data?.error?.message || String(response.status);
            if (/EMAIL_EXISTS|DUPLICATE_EMAIL/.test(message)) throw new AuthError('EMAIL_EXISTS', message);
            if (/WEAK_PASSWORD/.test(message)) throw new AuthError('WEAK_PASSWORD', message);
            if (/INVALID_EMAIL/.test(message)) throw new AuthError('INVALID_EMAIL', message);
            if (/USER_NOT_FOUND/.test(message)) throw new AuthError('USER_NOT_FOUND', message);
            throw new AuthError('ADMIN_FAILED', message);
        }
        return data;
    }

    function account(raw) {
        if (!raw) return null;
        let claims = {};
        try { claims = raw.customAttributes ? JSON.parse(raw.customAttributes) : {}; } catch { claims = {}; }
        return {
            uid: raw.localId,
            email: String(raw.email || '').toLowerCase(),
            displayName: raw.displayName || '',
            emailVerified: Boolean(raw.emailVerified),
            disabled: Boolean(raw.disabled),
            claims
        };
    }

    return {
        project,
        emulator: Boolean(emulator),

        /** Verifica un ID token contra Firebase y devuelve la cuenta, con sus claims actuales. */
        async verifyIdToken(idToken) {
            if (!idToken || idToken.length > 4096) return null;
            const key = apiKey || 'emulator';
            const response = await fetch(`${base}/accounts:lookup?key=${key}`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ idToken })
            });
            if (!response.ok) return null;
            return account((await response.json()).users?.[0]);
        },

        async getUser(uid) {
            const data = await admin('accounts:lookup', { localId: [uid] });
            return account(data.users?.[0]);
        },

        async getUserByEmail(email) {
            const data = await admin('accounts:lookup', { email: [String(email).toLowerCase()] });
            return account(data.users?.[0]);
        },

        async createUser({ email, password, displayName, emailVerified = false }) {
            const data = await admin('accounts', { email, password, displayName, emailVerified, disabled: false });
            return data.localId;
        },

        async updateUser(uid, { password, displayName, emailVerified, disabled } = {}) {
            const body = { localId: uid };
            if (password !== undefined) body.password = password;
            if (displayName !== undefined) body.displayName = displayName;
            if (emailVerified !== undefined) body.emailVerified = emailVerified;
            if (disabled !== undefined) body.disableUser = disabled;
            await admin('accounts:update', body);
        },

        /** Reescribe los claims conservando los que ya tuviera la cuenta. */
        async setClaims(uid, claims) {
            const current = await this.getUser(uid);
            const merged = { ...(current?.claims || {}), ...claims };
            await admin('accounts:update', { localId: uid, customAttributes: JSON.stringify(merged) });
            return merged;
        },

        async actionCode(requestType, email) {
            const data = await admin('accounts:sendOobCode', { requestType, email: String(email).toLowerCase(), returnOobLink: true });
            const link = data.oobLink || '';
            const code = new URL(link, 'https://x.invalid').searchParams.get('oobCode');
            if (!code) throw new AuthError('ADMIN_FAILED', 'NO_OOB_CODE');
            return code;
        },

        async deleteUser(uid) {
            await admin('accounts:delete', { localId: uid });
        }
    };
}

export async function sha256(value) {
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Token aleatorio en base64url (invitaciones, identificadores no adivinables). */
export function randomToken(bytes = 24) {
    return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}
