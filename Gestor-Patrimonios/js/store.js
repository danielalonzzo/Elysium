/**
 * Almacén de datos de la app.
 *
 * Una sola interfaz con dos implementaciones:
 * - `FirestoreBackend`: la real. Cada colección vive en
 *   `patrimonio/{uid}/{colección}` y se escucha en tiempo real; gracias a la
 *   caché persistente funciona sin conexión y sincroniza al volver.
 * - `DemoBackend`: en memoria, sembrada con datos de ejemplo. Sirve para
 *   enseñar la app sin cuenta y para probar todas las vistas.
 *
 * Las vistas no hablan con ninguno de los dos: leen del `Store` y escriben a
 * través de él. Cada cambio sube `version` y emite `change` (agrupado en un
 * solo aviso por vuelta del bucle de eventos), y el modelo derivado se
 * recalcula una vez.
 */
import { uid } from './ui/dom.js';
import { cleanText } from './core/text.js';

export const COLLECTIONS = Object.freeze([
    'accounts', 'categories', 'transactions', 'budgets', 'goals', 'contributions',
    'recurring', 'debts', 'simulations', 'receipts'
]);

/**
 * Firestore confirma una escritura cuando el servidor la acepta; sin red, esa
 * confirmación no llega hasta que vuelve la conexión. La escritura ya está en
 * la caché local y en pantalla, así que no se hace esperar a la persona: pasado
 * este tiempo se da por encolada y, si el servidor la rechaza después, se avisa.
 */
const ACK_TIMEOUT_MS = 1500;
/** Reintentos de una escucha que falló (con espera creciente) antes de rendirse. */
const MAX_LISTEN_RETRIES = 4;

/**
 * Las reglas de Firestore no admiten «<» ni «>» en el comercio o la nota de un
 * movimiento: se sanean aquí, en el único punto por el que pasan todos los
 * guardados (formulario, importación, recurrentes, restauración).
 */
export function sanitizeFields(name, fields) {
    if (name !== 'transactions' || !fields) return fields;
    const out = { ...fields };
    for (const key of ['merchant', 'note']) {
        if (typeof out[key] === 'string') out[key] = cleanText(out[key]);
    }
    return out;
}

export class Store extends EventTarget {
    constructor(backend, { ackTimeout = ACK_TIMEOUT_MS } = {}) {
        super();
        this.backend = backend;
        this.mode = backend.mode;
        this.version = 0;
        this.profile = null;
        this.data = Object.fromEntries(COLLECTIONS.map(name => [name, new Map()]));
        this.loaded = new Set();
        /** Escuchas que fallaron y aún no se recuperan: la interfaz no debe tomarlas por «sin datos». */
        this.failed = new Set();
        this.attempts = new Map();
        this.timers = new Set();
        this.stopped = false;
        this.ackTimeout = ackTimeout;
        this.unsubscribers = [];
        this.pending = false;
    }

    start() {
        // Se resuelve en cuanto llega la última colección, sin esperar a ningún
        // temporizador: con la pestaña en segundo plano el navegador los frena
        // hasta un minuto y la app se quedaba en la pantalla de carga.
        const ready = new Promise(resolve => { this.resolveReady = resolve; });
        this.subscribeProfile();
        for (const name of COLLECTIONS) this.subscribeCollection(name);
        this.checkReady();
        return ready;
    }

    checkReady() {
        if (this.resolveReady && this.ready) {
            const resolve = this.resolveReady;
            this.resolveReady = null;
            resolve();
        }
    }

    subscribeProfile() {
        this.unsubscribers.push(this.backend.subscribeProfile(profile => {
            this.recovered('profile');
            this.profile = profile;
            this.loaded.add('profile');
            this.touch();
        }, error => this.listenFailed('profile', error, () => this.subscribeProfile())));
    }

    /**
     * Se escucha la colección entera, movimientos incluidos: el saldo de una
     * cuenta es su saldo inicial más todos sus movimientos, y con una ventana
     * de meses los saldos se descuadraban en cuanto la historia la superaba.
     */
    subscribeCollection(name) {
        this.unsubscribers.push(this.backend.subscribe(name, map => {
            this.recovered(name);
            this.data[name] = map;
            this.loaded.add(name);
            this.touch();
        }, error => this.listenFailed(name, error, () => this.subscribeCollection(name))));
    }

    recovered(name) {
        if (!this.failed.delete(name)) return;
        this.attempts.delete(name);
        this.dispatchEvent(new CustomEvent('listen-recovered', { detail: { name } }));
    }

    /**
     * Una escucha que falla no vacía los datos: se conserva lo último bueno, se
     * avisa y se reintenta. Antes un error se entregaba como «colección vacía»,
     * y una cuota agotada o un fallo de red pasaba por «perdí todo».
     */
    listenFailed(name, error, resubscribe) {
        console.error(`Escucha de ${name}`, error);
        this.failed.add(name);
        this.loaded.add(name);
        this.checkReady();
        this.dispatchEvent(new CustomEvent('listen-error', { detail: { name, error } }));
        // Sin permiso no hay nada que reintentar: la licencia la vigila `app.js`.
        if (error?.code === 'permission-denied' || this.stopped) return;
        const attempt = (this.attempts.get(name) || 0) + 1;
        this.attempts.set(name, attempt);
        if (attempt > MAX_LISTEN_RETRIES) return;
        const timer = setTimeout(() => {
            this.timers.delete(timer);
            if (!this.stopped) resubscribe();
        }, Math.min(30000, 1500 * 2 ** attempt));
        this.timers.add(timer);
    }

    get ready() {
        return this.loaded.has('profile') && COLLECTIONS.every(name => this.loaded.has(name));
    }

    stop() {
        this.stopped = true;
        for (const timer of this.timers) clearTimeout(timer);
        this.timers.clear();
        for (const unsubscribe of this.unsubscribers) {
            try { unsubscribe?.(); } catch { /* ya cerrado */ }
        }
        this.unsubscribers = [];
    }

    touch() {
        this.version += 1;
        this.checkReady();
        if (this.pending) return;
        this.pending = true;
        const flush = () => {
            this.pending = false;
            this.dispatchEvent(new Event('change'));
        };
        // Un temporizador y no requestAnimationFrame: con la pestaña oculta (o la
        // PWA volviendo de segundo plano) rAF se congela y la app se quedaba en
        // la pantalla de carga hasta que alguien la miraba.
        setTimeout(flush, 0);
    }

    list(name) {
        return [...this.data[name].values()];
    }

    get(name, id) {
        return this.data[name].get(id) || null;
    }

    newId(prefix = '') {
        return uid(prefix);
    }

    /**
     * Espera la confirmación de una escritura, pero no más de `ackTimeout`: sin
     * conexión queda encolada (evento `queued`) y, si el servidor la rechaza
     * más tarde, se emite `write-failed`. Un rechazo inmediato sí se propaga.
     */
    async acknowledge(write) {
        let timer;
        const queued = Symbol('queued');
        const timeout = new Promise(resolve => { timer = setTimeout(() => resolve(queued), this.ackTimeout); });
        try {
            const outcome = await Promise.race([write, timeout]);
            if (outcome === queued) {
                this.dispatchEvent(new CustomEvent('queued'));
                write.catch(error => this.dispatchEvent(new CustomEvent('write-failed', { detail: error })));
            }
        } finally {
            clearTimeout(timer);
        }
    }

    /** Crea o reemplaza un documento. Devuelve su id. */
    async save(name, doc) {
        const id = doc.id || this.newId();
        const { id: _omit, ...fields } = doc;
        const now = new Date().toISOString();
        const payload = stripUndefined({ ...sanitizeFields(name, fields), updatedAt: now, createdAt: fields.createdAt || now });
        await this.acknowledge(this.backend.set(name, id, payload));
        return id;
    }

    async patch(name, id, fields) {
        await this.acknowledge(this.backend.update(name, id, stripUndefined({ ...sanitizeFields(name, fields), updatedAt: new Date().toISOString() })));
    }

    async remove(name, id) {
        await this.acknowledge(this.backend.remove(name, id));
    }

    /**
     * Varias escrituras juntas: `[{op: 'set'|'update'|'delete', name, id, data}]`.
     * El id va en la operación, nunca como campo del documento.
     */
    async batch(ops) {
        const now = new Date().toISOString();
        const prepared = ops.map(op => {
            const { id: dataId, ...fields } = op.data || {};
            const clean = sanitizeFields(op.name, fields);
            const stamps = op.op === 'update' ? { updatedAt: now } : { updatedAt: now, createdAt: fields.createdAt || now };
            return {
                ...op,
                id: op.id || dataId || this.newId(),
                data: op.data ? stripUndefined({ ...clean, ...stamps }) : undefined
            };
        });
        await this.acknowledge(this.backend.batch(prepared));
        return prepared.map(op => op.id);
    }

    /** Sustituye los campos indicados del perfil (mapas enteros como `celebrated` o `alertState`). */
    async saveProfile(fields) {
        await this.acknowledge(this.backend.setProfile(stripUndefined({ ...fields, updatedAt: new Date().toISOString() })));
    }

    /**
     * Cambia solo las claves indicadas de `settings`, sin reescribir las demás:
     * un dispositivo con datos viejos ya no pisa lo que se cambió en otro.
     */
    async saveSettings(patch) {
        const clean = stripUndefined(patch);
        await this.acknowledge(this.backend.setProfile(
            { settings: clean, updatedAt: new Date().toISOString() },
            [...Object.keys(clean).map(key => `settings.${key}`), 'updatedAt']
        ));
    }

    upload(path, file, onProgress) { return this.backend.upload(path, file, onProgress); }
    fileUrl(path) { return this.backend.fileUrl(path); }
    removeFile(path) { return this.backend.removeFile(path); }

    /** Todo lo guardado, para exportar. */
    snapshot() {
        return {
            exportedAt: new Date().toISOString(),
            profile: this.profile,
            ...Object.fromEntries(COLLECTIONS.map(name => [name, this.list(name)]))
        };
    }
}

function stripUndefined(value) {
    if (Array.isArray(value)) return value.map(stripUndefined);
    if (value && typeof value === 'object' && !(value instanceof Date) && Object.getPrototypeOf(value) === Object.prototype) {
        return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, stripUndefined(v)]));
    }
    return value;
}

/* ── Firestore ────────────────────────────────────────────────────────────── */

export class FirestoreBackend {
    constructor(firebase, userId) {
        this.mode = 'firebase';
        this.fb = firebase;
        this.uid = userId;
    }

    col(name) {
        const { fsMod, db } = this.fb;
        return fsMod.collection(db, 'patrimonio', this.uid, name);
    }

    subscribeProfile(callback, onError) {
        const { fsMod, db } = this.fb;
        return fsMod.onSnapshot(fsMod.doc(db, 'patrimonio', this.uid), snapshot => {
            callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        }, error => onError?.(error));
    }

    subscribe(name, callback, onError) {
        const { fsMod } = this.fb;
        return fsMod.onSnapshot(this.col(name), snapshot => {
            const map = new Map();
            snapshot.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() }));
            callback(map);
        }, error => onError?.(error));
    }

    set(name, id, data) {
        const { fsMod } = this.fb;
        return fsMod.setDoc(fsMod.doc(this.col(name), id), data);
    }

    update(name, id, data) {
        const { fsMod } = this.fb;
        return fsMod.updateDoc(fsMod.doc(this.col(name), id), data);
    }

    remove(name, id) {
        const { fsMod } = this.fb;
        return fsMod.deleteDoc(fsMod.doc(this.col(name), id));
    }

    batch(ops) {
        const { fsMod, db } = this.fb;
        // Firestore admite 500 escrituras por lote. Los lotes se envían a la vez:
        // sin red, uno que espera al anterior no empezaría jamás.
        const commits = [];
        for (let i = 0; i < ops.length; i += 450) {
            const batch = fsMod.writeBatch(db);
            for (const op of ops.slice(i, i + 450)) {
                const ref = fsMod.doc(this.col(op.name), op.id);
                if (op.op === 'delete') batch.delete(ref);
                else if (op.op === 'update') batch.update(ref, op.data);
                else batch.set(ref, op.data);
            }
            commits.push(batch.commit());
        }
        return Promise.all(commits);
    }

    /**
     * Sustituye los campos enviados y deja intactos los demás. Con `merge: true`
     * los mapas se fusionaban en profundidad y nunca perdían claves: vaciar
     * `celebrated` o podar `alertState` no borraba nada. `paths` afina: solo esas
     * rutas (`settings.sounds`) se escriben, y el resto del mapa se respeta.
     */
    setProfile(fields, paths = Object.keys(fields)) {
        const { fsMod, db } = this.fb;
        return fsMod.setDoc(fsMod.doc(db, 'patrimonio', this.uid), fields, { mergeFields: paths });
    }

    upload(path, file, onProgress) {
        const { stMod, storage } = this.fb;
        const ref = stMod.ref(storage, `patrimonio/${this.uid}/${path}`);
        const task = stMod.uploadBytesResumable(ref, file, { contentType: file.type || 'application/octet-stream' });
        return new Promise((resolve, reject) => {
            task.on('state_changed',
                snapshot => onProgress?.(snapshot.bytesTransferred / Math.max(1, snapshot.totalBytes)),
                reject,
                () => resolve({ path, name: file.name, type: file.type, size: file.size }));
        });
    }

    fileUrl(path) {
        const { stMod, storage } = this.fb;
        return stMod.getDownloadURL(stMod.ref(storage, `patrimonio/${this.uid}/${path}`));
    }

    removeFile(path) {
        const { stMod, storage } = this.fb;
        return stMod.deleteObject(stMod.ref(storage, `patrimonio/${this.uid}/${path}`)).catch(() => null);
    }
}

/* ── Demostración ─────────────────────────────────────────────────────────── */

const DEMO_KEY = 'patrimonio-demo-state';

export class DemoBackend {
    constructor(seed) {
        this.mode = 'demo';
        this.listeners = new Map();
        this.profileListeners = new Set();
        this.files = new Map();
        let saved = null;
        try { saved = JSON.parse(sessionStorage.getItem(DEMO_KEY) || 'null'); } catch { saved = null; }
        const source = saved || seed();
        this.profile = source.profile;
        this.tables = Object.fromEntries(Object.keys(source.collections).map(name =>
            [name, new Map(source.collections[name].map(doc => [doc.id, doc]))]));
    }

    persist() {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            try {
                sessionStorage.setItem(DEMO_KEY, JSON.stringify({
                    profile: this.profile,
                    collections: Object.fromEntries(Object.entries(this.tables).map(([name, map]) => [name, [...map.values()]]))
                }));
            } catch { /* sin almacenamiento de sesión */ }
        }, 300);
    }

    static reset() {
        try { sessionStorage.removeItem(DEMO_KEY); } catch { /* nada */ }
    }

    table(name) {
        if (!this.tables[name]) this.tables[name] = new Map();
        return this.tables[name];
    }

    emit(name) {
        this.persist();
        for (const callback of this.listeners.get(name) || []) callback(new Map(this.table(name)));
    }

    subscribeProfile(callback, _onError) {
        this.profileListeners.add(callback);
        queueMicrotask(() => callback(this.profile ? { ...this.profile } : null));
        return () => this.profileListeners.delete(callback);
    }

    subscribe(name, callback, _onError) {
        if (!this.listeners.has(name)) this.listeners.set(name, new Set());
        this.listeners.get(name).add(callback);
        queueMicrotask(() => callback(new Map(this.table(name))));
        return () => this.listeners.get(name)?.delete(callback);
    }

    async set(name, id, data) {
        this.table(name).set(id, { id, ...data });
        this.emit(name);
    }

    async update(name, id, data) {
        const current = this.table(name).get(id) || { id };
        this.table(name).set(id, { ...current, ...data });
        this.emit(name);
    }

    async remove(name, id) {
        this.table(name).delete(id);
        this.emit(name);
    }

    async batch(ops) {
        const touched = new Set();
        for (const op of ops) {
            if (op.op === 'delete') this.table(op.name).delete(op.id);
            else if (op.op === 'update') this.table(op.name).set(op.id, { ...(this.table(op.name).get(op.id) || { id: op.id }), ...op.data });
            else this.table(op.name).set(op.id, { id: op.id, ...op.data });
            touched.add(op.name);
        }
        for (const name of touched) this.emit(name);
    }

    async setProfile(fields, paths = Object.keys(fields)) {
        // Con rutas de `settings.x`, solo esas claves se cambian y el resto se conserva.
        const merged = { ...fields };
        if (fields.settings && paths.some(path => path.startsWith('settings.'))) {
            merged.settings = { ...(this.profile?.settings || {}), ...fields.settings };
        }
        this.profile = { ...(this.profile || {}), ...merged };
        this.persist();
        for (const callback of this.profileListeners) callback({ ...this.profile });
    }

    async upload(path, file, onProgress) {
        for (let p = 0.2; p <= 1; p += 0.2) {
            onProgress?.(p);
            await new Promise(resolve => { setTimeout(resolve, 60); });
        }
        this.files.set(path, URL.createObjectURL(file));
        return { path, name: file.name, type: file.type, size: file.size };
    }

    async fileUrl(path) {
        return this.files.get(path) || null;
    }

    async removeFile(path) {
        const url = this.files.get(path);
        if (url) URL.revokeObjectURL(url);
        this.files.delete(path);
    }
}
