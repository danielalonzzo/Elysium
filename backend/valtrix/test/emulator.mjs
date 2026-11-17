/**
 * Utilidades de las pruebas contra los emuladores de Firebase.
 *
 * Las pruebas no levantan el Worker: importan `handleApi` y le pasan `Request`
 * de verdad, con un `env` que apunta a los emuladores. Es el mismo código que
 * corre en producción hablando con Firestore y Auth locales; el proyecto es
 * `demo-valtrix` y nunca se toca el real.
 *
 * Cada fichero de pruebas usa un sufijo propio en sus identificadores, así que
 * pueden compartir emulador sin pisarse.
 */

import { handleApi } from '../src/api.js';
import { firestore } from '../src/lib/firebase.js';

export const PROJECT = process.env.GCLOUD_PROJECT || 'demo-valtrix';
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:18081';
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:19099';
const AUTH_BASE = `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1`;
const PASSWORD = 'contrasena-larga-de-prueba';

export const env = {
    FIREBASE_PROJECT_ID: PROJECT,
    FIRESTORE_EMULATOR_HOST: FIRESTORE_HOST,
    FIREBASE_AUTH_EMULATOR_HOST: AUTH_HOST,
    ALLOWED_ORIGINS: '',
    PUBLIC_ORIGIN: 'https://valtrix.test'
};

/** La base, con la credencial del emulador: para preparar y para mirar por dentro. */
export const db = firestore(env);

export const unique = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Una petición al API. Devuelve { status, code, data }. */
export async function call(path, { method = 'GET', token = null, body = undefined, origin = null, using = env, headers: extra = {} } = {}) {
    const url = new URL(`https://valtrix.test/api${path}`);
    const headers = { ...extra };
    if (token) headers.authorization = `Bearer ${token}`;
    if (origin) headers.origin = origin;
    if (body !== undefined) headers['content-type'] = 'application/json';
    const request = new Request(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const response = await handleApi(request, using, url, '/api');
    let data = {};
    try { data = await response.json(); } catch { data = {}; }
    return { status: response.status, code: data.code, data };
}

/** Una petición que tiene que salir bien: si no, la prueba se entera de por qué. */
export async function ok(path, options) {
    const result = await call(path, options);
    if (result.status !== 200) throw new Error(`${options?.method || 'GET'} ${path} → ${result.status} ${JSON.stringify(result.data)}`);
    return result.data;
}

const authAdmin = (path, body) => fetch(`${AUTH_BASE}/projects/${PROJECT}/${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer owner' }, body: JSON.stringify(body)
}).then(response => response.json());

export async function signIn(email) {
    const data = await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=emulator`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true })
    }).then(response => response.json());
    if (!data.idToken) throw new Error(`no se pudo entrar con ${email}: ${JSON.stringify(data)}`);
    return data.idToken;
}

/** Crea la cuenta en el emulador y devuelve su uid y un ID token fresco. */
export async function makeUser(email, { verified = true, claims = null } = {}) {
    const signUp = await fetch(`${AUTH_BASE}/accounts:signUp?key=emulator`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true })
    }).then(response => response.json());
    if (!signUp.localId) throw new Error(`no se pudo crear ${email}: ${JSON.stringify(signUp)}`);
    const update = { localId: signUp.localId, emailVerified: verified };
    if (claims) update.customAttributes = JSON.stringify(claims);
    await authAdmin('accounts:update', update);
    return { uid: signUp.localId, email, token: await signIn(email) };
}

/**
 * Una cuenta que creó el API (un propietario, alguien invitado) nace sin
 * contraseña. En producción la define la persona; aquí se le pone una y se da
 * el correo por confirmado, que es lo que hace ese mismo paso.
 */
export async function activate(email) {
    const found = await authAdmin('accounts:lookup', { email: [email] });
    const uid = found.users?.[0]?.localId;
    if (!uid) throw new Error(`no existe la cuenta ${email}`);
    await authAdmin('accounts:update', { localId: uid, password: PASSWORD, emailVerified: true });
    return { uid, email, token: await signIn(email) };
}

export const staffUser = (suffix, role = 'admin') => makeUser(`${role}-${suffix}@valtrix.test`, { claims: { role } });

/**
 * Un negocio dado de alta por la administración, con su propietario ya dentro
 * y tantos períodos liquidados como se pidan (1 abre el control financiero, 2
 * el orden operativo, 3 la auditoría).
 */
export async function tenantWithOwner(staff, { id, name, ownerEmail, periods = 0, sector = 'taller' }) {
    await ok('/admin/tenants', { method: 'POST', token: staff.token, body: { id, name, ownerEmail, ownerName: 'Propietaria', sector } });
    for (let period = 1; period <= periods; period += 1) {
        await ok(`/admin/tenants/${id}/periods`, { method: 'POST', token: staff.token, body: { period, method: 'sinpe', reference: `SINPE-${period}` } });
    }
    const owner = await activate(ownerEmail);
    return { id, name, owner };
}

/** Correo falso: guarda lo que se habría enviado. */
export function fakeMailer() {
    const sent = [];
    return { sent, async send(message) { sent.push(message); return { messageId: `prueba-${sent.length}` }; } };
}
