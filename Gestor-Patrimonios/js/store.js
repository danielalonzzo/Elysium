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
import { addMonths, startOfMonth, todayISO } from './core/dates.js';

export const COLLECTIONS = Object.freeze([
    'accounts', 'categories', 'transactions', 'budgets', 'goals', 'contributions',
    'recurring', 'debts', 'simulations', 'receipts'
]);

export class Store extends EventTarget {
    constructor(backend) {
        super();
        this.backend = backend;
        this.mode = backend.mode;
        this.version = 0;
        this.profile = null;
        this.data = Object.fromEntries(COLLECTIONS.map(name => [name, new Map()]));
        this.loaded = new Set();
        this.unsubscribers = [];
        this.windowStart = addMonths(startOfMonth(todayISO()), -13);
        this.pending = false;
    }

    start() {
        this.unsubscribers.push(this.backend.subscribeProfile(profile => {
            this.profile = profile;
            this.loaded.add('profile');
            this.touch();
        }));
        // Se resuelve en cuanto llega la última colección, sin esperar a ningún
        // temporizador: con la pestaña en segundo plano el navegador los frena
        // hasta un minuto y la app se quedaba en la pantalla de carga.
        const ready = new Promise(resolve => { this.resolveReady = resolve; });
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

    subscribeCollection(name) {
        const options = name === 'transactions' ? { since: this.windowStart } : {};
        const unsubscribe = this.backend.subscribe(name, map => {
            this.data[name] = map;
            this.loaded.add(name);
            this.touch();
        }, options);
        if (name === 'transactions') this.txUnsubscribe = unsubscribe;
        else this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    get ready() {
        return this.loaded.has('profile') && COLLECTIONS.every(name => this.loaded.has(name));
    }

    /** Amplía la ventana de movimientos cargados 12 meses hacia atrás. */
    loadOlder() {
        this.windowStart = addMonths(this.windowStart, -12);
        try { this.txUnsubscribe?.(); } catch { /* ya cerrado */ }
        this.subscribeCollection('transactions');
    }

    stop() {
        for (const unsubscribe of [...this.unsubscribers, this.txUnsubscribe]) {
            try { unsubscribe?.(); } catch { /* ya cerrado */ }
        }
        this.unsubscribers = [];
        this.txUnsubscribe = null;
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

    /** Crea o reemplaza un documento. Devuelve su id. */
    async save(name, doc) {
        const id = doc.id || this.newId();
        const { id: _omit, ...fields } = doc;
        const now = new Date().toISOString();
        const payload = stripUndefined({ ...fields, updatedAt: now, createdAt: fields.createdAt || now });
        await this.backend.set(name, id, payload);
        return id;
    }

    async patch(name, id, fields) {
        await this.backend.update(name, id, stripUndefined({ ...fields, updatedAt: new Date().toISOString() }));
    }

    async remove(name, id) {
        await this.backend.remove(name, id);
    }

    /** Varias escrituras juntas: `[{op: 'set'|'update'|'delete', name, id, data}]`. */
    async batch(ops) {
        const now = new Date().toISOString();
        const prepared = ops.map(op => ({
            ...op,
            id: op.id || this.newId(),
            data: op.data ? stripUndefined({ ...op.data, updatedAt: now, createdAt: op.data.createdAt || now }) : undefined
        }));
        await this.backend.batch(prepared);
        return prepared.map(op => op.id);
    }

    async saveProfile(fields) {
        await this.backend.setProfile(stripUndefined({ ...fields, updatedAt: new Date().toISOString() }));
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

export function stripUndefined(value) {
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

    subscribeProfile(callback) {
        const { fsMod, db } = this.fb;
        return fsMod.onSnapshot(fsMod.doc(db, 'patrimonio', this.uid), snapshot => {
            callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        }, error => {
            console.error('Perfil', error);
            callback(null);
        });
    }

    subscribe(name, callback, { since } = {}) {
        const { fsMod } = this.fb;
        const source = since
            ? fsMod.query(this.col(name), fsMod.where('date', '>=', since))
            : this.col(name);
        return fsMod.onSnapshot(source, snapshot => {
            const map = new Map();
            snapshot.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() }));
            callback(map);
        }, error => {
            console.error(`Colección ${name}`, error);
            callback(new Map());
        });
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

    async batch(ops) {
        const { fsMod, db } = this.fb;
        // Firestore admite 500 escrituras por lote.
        for (let i = 0; i < ops.length; i += 450) {
            const batch = fsMod.writeBatch(db);
            for (const op of ops.slice(i, i + 450)) {
                const ref = fsMod.doc(this.col(op.name), op.id);
                if (op.op === 'delete') batch.delete(ref);
                else if (op.op === 'update') batch.update(ref, op.data);
                else batch.set(ref, op.data);
            }
            await batch.commit();
        }
    }

    setProfile(fields) {
        const { fsMod, db } = this.fb;
        return fsMod.setDoc(fsMod.doc(db, 'patrimonio', this.uid), fields, { merge: true });
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

    subscribeProfile(callback) {
        this.profileListeners.add(callback);
        queueMicrotask(() => callback(this.profile ? { ...this.profile } : null));
        return () => this.profileListeners.delete(callback);
    }

    subscribe(name, callback) {
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

    async setProfile(fields) {
        this.profile = { ...(this.profile || {}), ...fields };
        this.persist();
        for (const callback of this.profileListeners) callback({ ...this.profile });
    }

    async upload(path, file, onProgress) {
        for (let p = 0.2; p <= 1; p += 0.2) {
            onProgress?.(p);
            await new Promise(resolve => setTimeout(resolve, 60));
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
