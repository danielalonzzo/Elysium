/**
 * Firebase para Elysium Patrimonio.
 *
 * Mismo proyecto que el portal y el CRM (`elysiumdr-eu`), pero con una app
 * con nombre propio: `initializeApp(config, 'patrimonio')`. Con eso la sesión
 * de Patrimonio vive aparte (entrar o salir aquí no toca `/profiles` ni el
 * CRM) y su caché de Firestore también. No se importa `JS/firebase-config.js`
 * porque trae la app por defecto y Analytics, y esta app no lleva analítica.
 *
 * Los módulos se cargan bajo demanda: el modo demostración no toca la red.
 */

const SDK = 'https://www.gstatic.com/firebasejs/12.19.0/';

const CONFIG = Object.freeze({
    apiKey: 'AIzaSyABcv1SqIHF78JqU5QVkLd3I94pI2YNPoE',
    authDomain: 'elysiumdr-eu.firebaseapp.com',
    projectId: 'elysiumdr-eu',
    storageBucket: 'elysiumdr-eu.firebasestorage.app',
    messagingSenderId: '392918383359',
    appId: '1:392918383359:web:b4c661f025f9162d4d6aca'
});

export const APP_URL = `${location.origin}/Gestor-Patrimonios/`;

let loading = null;

export function loadFirebase() {
    if (loading) return loading;
    loading = (async () => {
        const [appMod, authMod, fsMod, stMod] = await Promise.all([
            import(`${SDK}firebase-app.js`),
            import(`${SDK}firebase-auth.js`),
            import(`${SDK}firebase-firestore.js`),
            import(`${SDK}firebase-storage.js`)
        ]);
        const app = appMod.getApps().find(candidate => candidate.name === 'patrimonio')
            || appMod.initializeApp(CONFIG, 'patrimonio');
        const auth = authMod.getAuth(app);
        auth.languageCode = 'es';
        let db;
        try {
            db = fsMod.initializeFirestore(app, {
                localCache: fsMod.persistentLocalCache({ tabManager: fsMod.persistentMultipleTabManager() })
            });
        } catch {
            db = fsMod.getFirestore(app);
        }
        const storage = stMod.getStorage(app);
        return { app, auth, db, storage, authMod, fsMod, stMod };
    })();
    return loading;
}

/* ── Autenticación ────────────────────────────────────────────────────────── */

export async function onAuth(callback) {
    const { auth, authMod } = await loadFirebase();
    return authMod.onAuthStateChanged(auth, callback);
}

export async function signIn(email, password) {
    const { auth, authMod } = await loadFirebase();
    return authMod.signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function register(name, email, password) {
    const { auth, authMod } = await loadFirebase();
    const credential = await authMod.createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name) await authMod.updateProfile(credential.user, { displayName: name.trim().slice(0, 80) });
    try {
        await authMod.sendEmailVerification(credential.user, { url: APP_URL });
    } catch { /* se puede reenviar desde la pantalla de espera */ }
    return credential.user;
}

export async function resendVerification() {
    const { auth, authMod } = await loadFirebase();
    if (auth.currentUser) await authMod.sendEmailVerification(auth.currentUser, { url: APP_URL });
}

/**
 * Con la protección contra enumeración de correos activada en el proyecto,
 * esta llamada resuelve bien exista o no la cuenta: la pantalla no puede
 * afirmar que el correo salió, solo que saldrá si la cuenta existe.
 */
export async function resetPassword(email) {
    const { auth, authMod } = await loadFirebase();
    return authMod.sendPasswordResetEmail(auth, email.trim(), { url: APP_URL });
}

export async function signOutUser() {
    const { auth, authMod } = await loadFirebase();
    return authMod.signOut(auth);
}

/**
 * Deja el dispositivo sin rastro de la sesión que termina: cierra Firestore y
 * borra su caché de IndexedDB (donde quedan las cuentas y los movimientos, aunque
 * se cierre la sesión). Es la última llamada antes de recargar la página, que es
 * lo que reinicia también el estado de las vistas. Si otra pestaña sigue usando
 * la caché, el borrado no es posible y se ignora.
 */
export async function clearLocalSession() {
    if (!loading) return;
    try {
        const { db, fsMod } = await loading;
        await fsMod.terminate(db);
        await fsMod.clearIndexedDbPersistence(db);
    } catch (error) {
        console.warn('Caché local', error?.code || error);
    }
}

export async function reloadUser() {
    const { auth } = await loadFirebase();
    await auth.currentUser?.reload();
    return auth.currentUser;
}

export async function idToken() {
    const { auth } = await loadFirebase();
    return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

export function authErrorMessage(error) {
    const code = String(error?.code || '');
    const messages = {
        'auth/invalid-credential': 'Correo o contraseña incorrectos.',
        'auth/wrong-password': 'Correo o contraseña incorrectos.',
        'auth/user-not-found': 'Correo o contraseña incorrectos.',
        'auth/invalid-email': 'Ese correo no parece válido.',
        'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Entre con ella o recupere la contraseña.',
        'auth/weak-password': 'La contraseña necesita al menos 8 caracteres.',
        'auth/too-many-requests': 'Demasiados intentos. Espere unos minutos y vuelva a probar.',
        'auth/network-request-failed': 'Sin conexión. Revise su red y vuelva a intentarlo.',
        'auth/user-disabled': 'Esta cuenta está desactivada.'
    };
    return messages[code] || 'No se pudo completar. Inténtelo de nuevo.';
}

/* ── Acceso por licencia ──────────────────────────────────────────────────── */

/** Escucha la licencia de Patrimonio que el administrador activa desde el CRM. */
export async function watchAccess(uid, callback) {
    const { db, fsMod } = await loadFirebase();
    return fsMod.onSnapshot(
        fsMod.doc(db, 'patrimonio_access', uid),
        snapshot => callback(snapshot.exists() ? snapshot.data() : null),
        () => callback(null)
    );
}

export async function watchRequest(uid, callback) {
    const { db, fsMod } = await loadFirebase();
    return fsMod.onSnapshot(
        fsMod.doc(db, 'patrimonio_requests', uid),
        snapshot => callback(snapshot.exists() ? snapshot.data() : null),
        () => callback(null)
    );
}

export async function requestAccess(user, note = '') {
    const { db, fsMod } = await loadFirebase();
    await fsMod.setDoc(fsMod.doc(db, 'patrimonio_requests', user.uid), {
        uid: user.uid,
        email: String(user.email || '').toLowerCase(),
        name: String(user.displayName || '').slice(0, 80),
        note: String(note || '').replace(/[<>]/g, '').slice(0, 280),
        requestedAt: fsMod.serverTimestamp()
    });
    // Aviso por correo al administrador; si el backend no responde, la
    // solicitud ya está guardada y aparece igualmente en el CRM.
    try {
        const token = await user.getIdToken();
        await fetch('/api/patrimonio/access-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: '{}',
            keepalive: true
        });
    } catch { /* sin backend: no bloquea */ }
}
