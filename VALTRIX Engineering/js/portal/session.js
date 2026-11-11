/**
 * La sesión: Firebase Authentication y nada más.
 *
 * El SDK de Firebase se usa **solo para identificar a la persona**. No toca
 * Firestore ni Storage: las reglas los niegan enteros y todos los datos pasan
 * por el API. Por eso aquí se carga únicamente el módulo de autenticación.
 *
 * La configuración la sirve el propio Worker en `/api/config`, en vez de ir
 * escrita en el HTML: el portal funciona igual contra los emuladores que
 * contra producción, y si falta un secreto lo dice con un mensaje en lugar de
 * romperse con un error del SDK.
 */

const SDK = 'https://www.gstatic.com/firebasejs/11.3.1';

let auth = null;
let sdk = null;

export class SessionError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}

/** Mensajes de Firebase traducidos. Los códigos son los del SDK. */
const AUTH_MESSAGES = {
    'auth/invalid-email': 'Ese correo no tiene un formato válido.',
    'auth/missing-password': 'Escriba su contraseña.',
    'auth/invalid-credential': 'El correo o la contraseña no coinciden.',
    'auth/wrong-password': 'El correo o la contraseña no coinciden.',
    'auth/user-not-found': 'El correo o la contraseña no coinciden.',
    'auth/user-disabled': 'Esta cuenta está desactivada. Comuníquese con VALTRIX.',
    'auth/too-many-requests': 'Demasiados intentos. Espere unos minutos y vuelva a probar.',
    'auth/network-request-failed': 'No hay conexión con el servicio. Revise su red.'
};

export const authMessage = code => AUTH_MESSAGES[code] || 'No se pudo completar la operación. Intente de nuevo.';

export async function start() {
    if (auth) return auth;

    const response = await fetch('/api/config', { headers: { accept: 'application/json' } });
    if (!response.ok) throw new SessionError('CONFIG', 'No se pudo leer la configuración del servicio.');
    const config = await response.json();
    if (!config.ready) throw new SessionError('NOT_CONFIGURED', 'El acceso todavía no está configurado.');

    const [app, authModule] = await Promise.all([
        import(`${SDK}/firebase-app.js`),
        import(`${SDK}/firebase-auth.js`)
    ]);
    sdk = authModule;

    const instance = app.initializeApp({
        apiKey: config.apiKey || 'emulator',
        authDomain: config.authDomain,
        projectId: config.projectId
    // Nombre propio: si algún día convive con otra aplicación Firebase en el
    // mismo origen, sus sesiones no se mezclan. Es lo que se hizo en Elysium
    // Patrimonio por la misma razón.
    }, 'valtrix');

    auth = authModule.getAuth(instance);
    if (config.authEmulatorHost) {
        authModule.connectAuthEmulator(auth, `http://${config.authEmulatorHost}`, { disableWarnings: true });
    }
    await authModule.setPersistence(auth, authModule.browserLocalPersistence);
    return auth;
}

export function onUser(callback) {
    return sdk.onAuthStateChanged(auth, callback);
}

export async function signIn(email, password) {
    try {
        const credential = await sdk.signInWithEmailAndPassword(auth, email, password);
        return credential.user;
    } catch (error) {
        throw new SessionError(error.code || 'auth/unknown', authMessage(error.code));
    }
}

export async function signOut() {
    await sdk.signOut(auth);
}

/**
 * Enviar el correo de recuperación **no confirma si la cuenta existe**:
 * Firebase, con la protección contra enumeración activada, responde igual en
 * los dos casos. El portal dice «si existe una cuenta…» por eso, no por
 * prudencia decorativa: decir «enviado» sería afirmar algo que no sabe.
 */
export async function resetPassword(email) {
    try {
        await sdk.sendPasswordResetEmail(auth, email);
    } catch (error) {
        // Un correo mal escrito sí se puede decir; lo demás se calla.
        if (error.code === 'auth/invalid-email' || error.code === 'auth/missing-email') {
            throw new SessionError(error.code, authMessage(error.code));
        }
    }
}

export async function resendVerification() {
    if (!auth.currentUser) return;
    await sdk.sendEmailVerification(auth.currentUser);
}

export const currentUser = () => auth?.currentUser || null;

export async function idToken() {
    return auth?.currentUser ? auth.currentUser.getIdToken() : null;
}

export async function reload() {
    if (auth?.currentUser) await auth.currentUser.reload();
}
