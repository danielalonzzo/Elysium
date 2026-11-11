/**
 * Aislamiento entre negocios, contra los emuladores de Firebase.
 *
 * Es la prueba que de verdad protege la fase 2. Todo lo demás del API —ventas,
 * inventario, cobros— se apoya en que una identidad autorizada para un negocio
 * no alcance los datos de otro, ni por consulta, ni por ruta adivinada, ni
 * porque alguien mande otro `tenantId` en la cabecera.
 *
 * No levanta el Worker: importa `handleApi` y le pasa `Request` de verdad. El
 * entorno apunta a los emuladores, así que el mismo código que corre en
 * producción habla con Firestore y Auth locales, sin tocar el proyecto real.
 *
 * Uso (necesita Java y firebase-tools):
 *   cd backend/valtrix
 *   firebase emulators:exec --only auth,firestore --project demo-valtrix \
 *     "node --test test/isolation.emulator.mjs"
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { handleApi } from '../src/api.js';

const PROJECT = process.env.GCLOUD_PROJECT || 'demo-valtrix';
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:18081';
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:19099';

const env = {
    FIREBASE_PROJECT_ID: PROJECT,
    FIRESTORE_EMULATOR_HOST: FIRESTORE_HOST,
    FIREBASE_AUTH_EMULATOR_HOST: AUTH_HOST,
    ALLOWED_ORIGINS: ''
};

const AUTH_BASE = `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1`;

/* ------------------------------------------------------------------ *
 * Utilidades
 * ------------------------------------------------------------------ */

async function call(path, { method = 'GET', token = null, body = undefined, origin = null } = {}) {
    const url = new URL(`https://valtrix.test/api${path}`);
    const headers = {};
    if (token) headers.authorization = `Bearer ${token}`;
    if (origin) headers.origin = origin;
    if (body !== undefined) headers['content-type'] = 'application/json';
    const request = new Request(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const response = await handleApi(request, env, url, '/api');
    let data = {};
    try { data = await response.json(); } catch { data = {}; }
    return { status: response.status, code: data.code, data };
}

/** Crea la cuenta en el emulador y devuelve su uid y un ID token fresco. */
async function makeUser(email, { verified = true, claims = null } = {}) {
    const signUp = await fetch(`${AUTH_BASE}/accounts:signUp?key=emulator`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: 'contrasena-larga-de-prueba', returnSecureToken: true })
    }).then(response => response.json());
    if (!signUp.localId) throw new Error(`no se pudo crear ${email}: ${JSON.stringify(signUp)}`);

    const update = { localId: signUp.localId, emailVerified: verified };
    if (claims) update.customAttributes = JSON.stringify(claims);
    await fetch(`${AUTH_BASE}/projects/${PROJECT}/accounts:update`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer owner' },
        body: JSON.stringify(update)
    });

    // Un token nuevo, para que lleve el claim y el correo ya verificado.
    const signIn = await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=emulator`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: 'contrasena-larga-de-prueba', returnSecureToken: true })
    }).then(response => response.json());

    return { uid: signUp.localId, email, token: signIn.idToken };
}

/* ------------------------------------------------------------------ *
 * Montaje: un administrador de VALTRIX y dos negocios sin relación
 * ------------------------------------------------------------------ */

const unique = Date.now().toString(36);
const A = `taller-horizonte-${unique}`;
const B = `panaderia-trigal-${unique}`;

let staff;
let anaToken;   // propietaria del negocio A
let betoToken;  // propietario del negocio B

test('montaje: dos negocios con propietarios distintos', async () => {
    staff = await makeUser(`valeria-${unique}@valtrix.test`, { claims: { role: 'admin' } });

    const first = await call('/admin/tenants', {
        method: 'POST', token: staff.token,
        body: { id: A, name: 'Taller Horizonte', ownerEmail: `ana-${unique}@ejemplo.test`, ownerName: 'Ana' }
    });
    assert.equal(first.status, 200, JSON.stringify(first.data));
    assert.equal(first.data.subscription.state, 'pending_activation');
    assert.equal(first.data.subscription.entitlements.erp, false, 'un negocio nuevo no abre ningún módulo');

    const second = await call('/admin/tenants', {
        method: 'POST', token: staff.token,
        body: { id: B, name: 'Panadería Trigal', ownerEmail: `beto-${unique}@ejemplo.test`, ownerName: 'Beto' }
    });
    assert.equal(second.status, 200, JSON.stringify(second.data));

    // Las cuentas de los propietarios las creó el alta; hay que poder entrar
    // con ellas, así que se les pone contraseña y se verifica el correo.
    for (const uid of [first.data.owner.uid, second.data.owner.uid]) {
        await fetch(`${AUTH_BASE}/projects/${PROJECT}/accounts:update`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: 'Bearer owner' },
            body: JSON.stringify({ localId: uid, password: 'contrasena-larga-de-prueba', emailVerified: true })
        });
    }
    const signIn = async email => (await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=emulator`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: 'contrasena-larga-de-prueba', returnSecureToken: true })
    }).then(response => response.json())).idToken;

    anaToken = await signIn(`ana-${unique}@ejemplo.test`);
    betoToken = await signIn(`beto-${unique}@ejemplo.test`);
    assert.ok(anaToken && betoToken, 'los propietarios tienen que poder iniciar sesión');
});

/* ------------------------------------------------------------------ *
 * Identidad
 * ------------------------------------------------------------------ */

test('sin token no se entra', async () => {
    assert.equal((await call('/me')).status, 401);
});

test('un correo sin verificar no entra', async () => {
    const sin = await makeUser(`sin-verificar-${unique}@ejemplo.test`, { verified: false, claims: { role: 'admin' } });
    const response = await call('/me', { token: sin.token });
    assert.equal(response.status, 403);
    assert.equal(response.code, 'EMAIL_NOT_VERIFIED');
});

test('una cuenta sin papel ni membresía no es nadie', async () => {
    const suelta = await makeUser(`suelta-${unique}@ejemplo.test`);
    const response = await call('/me', { token: suelta.token });
    assert.equal(response.status, 403);
    assert.equal(response.code, 'NO_ROLE');
});

/* ------------------------------------------------------------------ *
 * Aislamiento
 * ------------------------------------------------------------------ */

test('cada quien ve solo sus negocios', async () => {
    const ana = await call('/me', { token: anaToken });
    assert.equal(ana.status, 200, JSON.stringify(ana.data));
    assert.deepEqual(ana.data.tenants.map(row => row.id), [A]);
    assert.equal(ana.data.tenants[0].role, 'owner');

    const beto = await call('/me', { token: betoToken });
    assert.deepEqual(beto.data.tenants.map(row => row.id), [B]);
});

test('el negocio ajeno no existe, y responde igual que uno inventado', async () => {
    const ajeno = await call(`/tenants/${B}`, { token: anaToken });
    const inventado = await call(`/tenants/negocio-que-no-existe-${unique}`, { token: anaToken });
    assert.equal(ajeno.status, 404);
    assert.equal(ajeno.code, 'TENANT_NOT_FOUND');
    // Si una de las dos respuestas fuera distinta, bastaría probar nombres para
    // saber qué negocios son clientes de VALTRIX.
    assert.equal(ajeno.status, inventado.status);
    assert.equal(ajeno.code, inventado.code);
});

test('tampoco se alcanza la gente del negocio ajeno', async () => {
    const response = await call(`/tenants/${B}/members`, { token: anaToken });
    assert.equal(response.status, 404);
});

test('un administrador de VALTRIX no lee el negocio de nadie', async () => {
    // Administra suscripciones e incorporaciones; para operar dentro de un
    // negocio necesita su propia membresía, como todos.
    const response = await call(`/tenants/${A}`, { token: staff.token });
    assert.equal(response.status, 404);
});

test('un propietario no administra VALTRIX', async () => {
    const response = await call('/admin/tenants', { token: anaToken });
    assert.equal(response.status, 403);
    assert.equal(response.code, 'FORBIDDEN');
});

/* ------------------------------------------------------------------ *
 * Suscripción y módulos
 * ------------------------------------------------------------------ */

test('los módulos se abren por períodos liquidados', async () => {
    const bloqueado = await call(`/tenants/${A}`, { token: anaToken });
    assert.equal(bloqueado.data.entitlements.erp, false);

    const primero = await call(`/admin/tenants/${A}/subscription`, {
        method: 'POST', token: staff.token,
        body: { state: 'active', paidPeriods: 1, reason: 'primer pago confirmado' }
    });
    assert.equal(primero.status, 200, JSON.stringify(primero.data));
    assert.deepEqual(primero.data.subscription.entitlements, { erp: true, qms: false, audit: false });

    const conErp = await call(`/tenants/${A}`, { token: anaToken });
    assert.equal(conErp.data.entitlements.erp, true);
    assert.equal(conErp.data.entitlements.qms, false, 'el segundo módulo espera al segundo período');

    const tercero = await call(`/admin/tenants/${A}/subscription`, {
        method: 'POST', token: staff.token, body: { paidPeriods: 3 }
    });
    assert.deepEqual(tercero.data.subscription.entitlements, { erp: true, qms: true, audit: true });
});

test('un estado no se alcanza saltándose el camino', async () => {
    const response = await call(`/admin/tenants/${B}/subscription`, {
        method: 'POST', token: staff.token,
        body: { state: 'suspended', reason: 'intento de salto' }
    });
    assert.equal(response.status, 409);
    assert.equal(response.code, 'INVALID_TRANSITION');
});

test('un cambio de estado sin motivo no se registra', async () => {
    const response = await call(`/admin/tenants/${B}/subscription`, {
        method: 'POST', token: staff.token, body: { state: 'active' }
    });
    assert.equal(response.status, 400);
});

/* ------------------------------------------------------------------ *
 * La gente del negocio
 * ------------------------------------------------------------------ */

test('el último propietario no se queda sin serlo', async () => {
    const response = await call(`/tenants/${A}/members/${(await call('/me', { token: anaToken })).data.uid}`, {
        method: 'PATCH', token: anaToken, body: { role: 'viewer' }
    });
    // Nadie se cambia su propio papel, ni siquiera siendo propietario.
    assert.equal(response.status, 403);
});

test('un negocio suspendido lee pero no escribe', async () => {
    await call(`/admin/tenants/${A}/subscription`, {
        method: 'POST', token: staff.token, body: { state: 'suspended', reason: 'falta de pago' }
    });
    const lectura = await call(`/tenants/${A}`, { token: anaToken });
    assert.equal(lectura.status, 200, 'suspender no es borrar: los datos se siguen consultando');
    assert.equal(lectura.data.subscription.state, 'suspended');

    const miembros = await call(`/tenants/${A}/members`, { token: anaToken });
    assert.equal(miembros.status, 200);

    // Administrar la gente es escribir, y eso sí se cierra.
    const otro = await makeUser(`otro-${unique}@ejemplo.test`);
    const escritura = await call(`/tenants/${A}/members/${otro.uid}`, {
        method: 'PATCH', token: anaToken, body: { role: 'viewer' }
    });
    assert.equal(escritura.status, 402);
    assert.equal(escritura.code, 'SUBSCRIPTION_SUSPENDED');
});

/* ------------------------------------------------------------------ *
 * Enrutado
 * ------------------------------------------------------------------ */

test('una ruta que no existe no filtra nada', async () => {
    const response = await call('/nada-de-nada');
    assert.equal(response.status, 404);
    assert.equal(response.code, 'ROUTE_NOT_FOUND');
});

test('el método equivocado se distingue de la ruta ausente', async () => {
    const response = await call('/me', { method: 'DELETE' });
    assert.equal(response.status, 405);
    assert.equal(response.code, 'METHOD_NOT_ALLOWED');
});
