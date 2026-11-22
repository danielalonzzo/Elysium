import { app } from './firebase-auth.js';
import {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

export { auth } from './firebase-auth.js';

// La caché en disco se decide por página, no aquí. Este módulo lo comparten el
// portal de socios, el CRM, el onboarding y el modal de versión: activarla de
// forma global dejaría el directorio de contactos de terceros en el IndexedDB
// del navegador del administrador. La página que la quiere lo declara con
// <meta name="elysium-firestore-cache" content="persistent"> en su <head>, que
// el analizador lee mucho antes de que este módulo llegue a ejecutarse.
const wantsPersistentCache = typeof document !== 'undefined'
    && document.querySelector('meta[name="elysium-firestore-cache"]')?.content === 'persistent';

/** Para que quien limpie la caché sepa si hay algo que limpiar. */
export const hasPersistentCache = wantsPersistentCache;

export const db = wantsPersistentCache
    ? initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    })
    : getFirestore(app);
export const storage = getStorage(app);

// Analytics is deliberately optional. Authentication and the client portal
// must continue to work when a privacy extension blocks Google Analytics.
export let analytics = null;
if (typeof window !== 'undefined') {
    import("https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js")
        .then(async ({ getAnalytics, isSupported }) => {
            if (await isSupported()) analytics = getAnalytics(app);
        })
        .catch(error => console.info('[analytics] unavailable', error?.code || error?.message || error));
}
