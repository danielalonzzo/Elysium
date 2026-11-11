/**
 * Datos de demostración para el emulador: un administrador de VALTRIX, dos
 * negocios y sus propietarios, con contraseña conocida para poder entrar.
 * Nunca toca el proyecto real: solo habla con los emuladores.
 *
 *   node test/seed.mjs
 */
import { handleApi } from '../src/api.js';

const PROJECT = 'demo-valtrix';
const AUTH = 'http://127.0.0.1:19099/identitytoolkit.googleapis.com/v1';
const PASSWORD = 'valtrix-demo-1234';
const env = {
    FIREBASE_PROJECT_ID: PROJECT,
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:18081',
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:19099',
    ALLOWED_ORIGINS: ''
};

const call = async (path, { method = 'GET', token, body } = {}) => {
    const url = new URL(`https://valtrix.test/api${path}`);
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await handleApi(new Request(url, { method, headers, body: body && JSON.stringify(body) }), env, url, '/api');
    return { status: response.status, data: await response.json().catch(() => ({})) };
};

const post = (path, body) => fetch(`${AUTH}/${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer owner' }, body: JSON.stringify(body)
}).then(response => response.json());

async function account(email, claims) {
    const found = await post(`projects/${PROJECT}/accounts:lookup`, { email: [email] });
    const uid = found.users?.[0]?.localId
        || (await fetch(`${AUTH}/accounts:signUp?key=emulator`, {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true })
        }).then(response => response.json())).localId;
    await post(`projects/${PROJECT}/accounts:update`, {
        localId: uid, password: PASSWORD, emailVerified: true,
        ...(claims ? { customAttributes: JSON.stringify(claims) } : {})
    });
    const signIn = await fetch(`${AUTH}/accounts:signInWithPassword?key=emulator`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true })
    }).then(response => response.json());
    return { uid, email, token: signIn.idToken };
}

const valeria = await account('valeria@valtrix.test', { role: 'admin' });

for (const [id, name, owner, periods] of [
    ['taller-horizonte', 'Taller Horizonte', 'ana@ejemplo.test', 3],
    ['panaderia-trigal', 'Panadería Trigal', 'beto@ejemplo.test', 1],
    ['clinica-vet-prado', 'Clínica Vet Prado', 'ana@ejemplo.test', 0]
]) {
    const created = await call('/admin/tenants', { method: 'POST', token: valeria.token, body: { id, name, ownerEmail: owner } });
    if (created.status === 200 && periods > 0) {
        await call(`/admin/tenants/${id}/subscription`, {
            method: 'POST', token: valeria.token,
            body: { state: 'active', paidPeriods: periods, reason: 'datos de demostración' }
        });
    }
    console.log(`${id}: ${created.status === 200 ? 'creado' : created.data.code}`);
}

// Las cuentas de los propietarios las creó el alta, sin contraseña.
for (const email of ['ana@ejemplo.test', 'beto@ejemplo.test']) await account(email);

console.log(`\nEntre en http://localhost:8799/cuenta con la contraseña «${PASSWORD}»:`);
console.log('  valeria@valtrix.test  administración de VALTRIX');
console.log('  ana@ejemplo.test      propietaria de dos negocios');
console.log('  beto@ejemplo.test     propietario de uno');
