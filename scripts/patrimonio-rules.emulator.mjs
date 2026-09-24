/**
 * Reglas de Elysium Patrimonio contra el emulador de Firestore.
 *
 * Las pruebas de `patrimonio.test.mjs` cubren el cálculo; estas cubren quién
 * puede leer y escribir qué, que es lo que de verdad protege las finanzas de
 * alguien. No usan dependencias: hablan con la API REST del emulador y firman
 * los tokens sin clave, que el emulador acepta.
 *
 * Uso (necesita Java y firebase-tools):
 *   firebase emulators:exec --only firestore,storage \
 *     --config firebase.research-emulator.json --project demo-patrimonio \
 *     "node --test scripts/patrimonio-rules.emulator.mjs"
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const PROJECT = process.env.GCLOUD_PROJECT || 'demo-patrimonio';
const HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:18080';
const BASE = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;

function b64url(value) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function tokenFor(uid, email = `${uid}@example.com`) {
    const now = Math.floor(Date.now() / 1000);
    return `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({
        iss: `https://securetoken.google.com/${PROJECT}`, aud: PROJECT, auth_time: now, iat: now, exp: now + 3600,
        sub: uid, user_id: uid, email, email_verified: true, firebase: { sign_in_provider: 'password', identities: {} }
    })}.`;
}

function fields(data) {
    const encode = value => {
        if (value === null) return { nullValue: null };
        if (typeof value === 'boolean') return { booleanValue: value };
        if (Number.isInteger(value)) return { integerValue: String(value) };
        if (typeof value === 'number') return { doubleValue: value };
        if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
        if (typeof value === 'object') return { mapValue: { fields: fields(value) } };
        return { stringValue: String(value) };
    };
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encode(value)]));
}

async function write(path, data, as) {
    const response = await fetch(`${BASE}/${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${as}` },
        body: JSON.stringify({ fields: fields(data) })
    });
    return response.status;
}

async function read(path, as) {
    const headers = as ? { Authorization: `Bearer ${as}` } : {};
    const response = await fetch(`${BASE}/${path}`, { headers });
    return response.status;
}

async function commitWithServerTime(path, data, timeField, as) {
    const response = await fetch(`${BASE}:commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${as}` },
        body: JSON.stringify({
            writes: [{
                update: { name: `projects/${PROJECT}/databases/(default)/documents/${path}`, fields: fields(data) },
                updateTransforms: [{ fieldPath: timeField, setToServerValue: 'REQUEST_TIME' }]
            }]
        })
    });
    return response.status;
}

const ADMIN = 'owner'; // el emulador trata «owner» como Admin SDK: salta las reglas
const ANA = tokenFor('ana');
const BETO = tokenFor('beto');
const CARLA = tokenFor('carla');
const TX = { type: 'expense', amountMinor: 1250000, currency: 'CRC', date: '2026-09-23', accountId: 'banco', merchant: 'Soda Doña Ana' };

test('preparación: Ana y Beto con licencia activa, Carla sin licencia', async () => {
    assert.equal(await write('patrimonio_access/ana', { active: true }, ADMIN), 200);
    assert.equal(await write('patrimonio_access/beto', { active: true }, ADMIN), 200);
});

test('con licencia, cada quien escribe y lee lo suyo', async () => {
    assert.equal(await write('patrimonio/ana', { displayName: 'Ana', onboarded: true }, ANA), 200);
    assert.equal(await write('patrimonio/ana/transactions/t1', TX, ANA), 200);
    assert.equal(await write('patrimonio/ana/goals/g1', { name: 'Land Cruiser 80', targetMinor: 1500000000 }, ANA), 200);
    assert.equal(await read('patrimonio/ana/transactions/t1', ANA), 200);
});

test('nadie lee ni escribe las finanzas de otra persona', async () => {
    assert.equal(await read('patrimonio/ana/transactions/t1', BETO), 403);
    assert.equal(await read('patrimonio/ana', BETO), 403);
    assert.equal(await write('patrimonio/ana/transactions/t2', TX, BETO), 403);
    assert.equal(await read('patrimonio/ana/transactions/t1', null), 403, 'sin sesión');
});

test('sin licencia no hay acceso ni a lo propio', async () => {
    assert.equal(await write('patrimonio/carla/transactions/t1', TX, CARLA), 403);
    assert.equal(await read('patrimonio/carla', CARLA), 403);
    assert.equal(await read('patrimonio_access/carla', CARLA), 404, 'puede consultar su licencia (no existe todavía)');
    assert.equal(await read('patrimonio_access/ana', CARLA), 403);
});

test('la licencia no se la activa uno mismo', async () => {
    assert.equal(await write('patrimonio_access/carla', { active: true }, CARLA), 403);
    assert.equal(await write('patrimonio_access/ana', { active: true, plan: 'vip' }, ANA), 403);
});

test('suspender corta el acceso sin borrar nada', async () => {
    assert.equal(await write('patrimonio_access/ana', { active: false }, ADMIN), 200);
    assert.equal(await read('patrimonio/ana/transactions/t1', ANA), 403);
    assert.equal(await read('patrimonio/ana/transactions/t1', ADMIN), 200, 'los datos siguen ahí');
    assert.equal(await write('patrimonio_access/ana', { active: true }, ADMIN), 200);
    assert.equal(await read('patrimonio/ana/transactions/t1', ANA), 200);
});

test('los movimientos se validan: entero, moneda, fecha y textos sin marcado', async () => {
    assert.equal(await write('patrimonio/ana/transactions/bad1', { ...TX, amountMinor: 12.5 }, ANA), 403);
    assert.equal(await write('patrimonio/ana/transactions/bad2', { ...TX, amountMinor: -500 }, ANA), 403);
    assert.equal(await write('patrimonio/ana/transactions/bad3', { ...TX, currency: 'EUR' }, ANA), 403);
    assert.equal(await write('patrimonio/ana/transactions/bad4', { ...TX, date: '23/09/2026' }, ANA), 403);
    assert.equal(await write('patrimonio/ana/transactions/bad5', { ...TX, merchant: '<script>' }, ANA), 403);
    assert.equal(await write('patrimonio/ana/transactions/bad6', { ...TX, type: 'regalo' }, ANA), 403);
});

test('solo existen las colecciones de la app; el registro de correos es del backend', async () => {
    assert.equal(await write('patrimonio/ana/hacks/x', { a: 1 }, ANA), 403);
    assert.equal(await write('patrimonio/ana/email_log/budget:x', { sentAt: 1 }, ANA), 403);
    assert.equal(await write('patrimonio/ana/email_log/budget:x', { sentAt: 1 }, ADMIN), 200);
    assert.equal(await read('patrimonio/ana/email_log/budget:x', ANA), 200);
});

test('solicitar acceso: solo la propia, con su correo y la hora del servidor', async () => {
    const request = { uid: 'carla', email: 'carla@example.com', name: 'Carla', note: 'Me la recomendó Jared' };
    assert.equal(await commitWithServerTime('patrimonio_requests/carla', { ...request, email: 'otra@example.com' }, 'requestedAt', CARLA), 403);
    assert.equal(await commitWithServerTime('patrimonio_requests/beto', { ...request, uid: 'beto' }, 'requestedAt', CARLA), 403);
    assert.equal(await commitWithServerTime('patrimonio_requests/carla', { ...request, active: true }, 'requestedAt', CARLA), 403);
    assert.equal(await commitWithServerTime('patrimonio_requests/carla', request, 'requestedAt', CARLA), 200);
    assert.equal(await read('patrimonio_requests/carla', CARLA), 200);
    assert.equal(await read('patrimonio_requests/carla', BETO), 403);
});
