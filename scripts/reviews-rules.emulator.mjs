/**
 * Reglas de `reviews/` (formulario público /review) contra el emulador.
 *
 * El formulario escribe sin cuenta, así que lo único que lo separa del spam o
 * de un documento con forma libre son estas reglas: solo crear, con los campos
 * exactos de `JS/review-form.js`, y solo el administrador lee y ordena.
 *
 * Uso (necesita Java y firebase-tools):
 *   firebase emulators:exec --only firestore,storage \
 *     --config firebase.research-emulator.json --project demo-reviews \
 *     "node --test scripts/reviews-rules.emulator.mjs"
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const PROJECT = process.env.GCLOUD_PROJECT || 'demo-reviews';
const HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:18080';
const BASE = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;

const b64url = value => Buffer.from(JSON.stringify(value)).toString('base64url');
function tokenFor(uid, email) {
    const now = Math.floor(Date.now() / 1000);
    return `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({
        iss: `https://securetoken.google.com/${PROJECT}`, aud: PROJECT, auth_time: now, iat: now, exp: now + 3600,
        sub: uid, user_id: uid, email, email_verified: true, firebase: { sign_in_provider: 'password', identities: {} }
    })}.`;
}

function fields(data) {
    const encode = value => {
        if (typeof value === 'boolean') return { booleanValue: value };
        if (Number.isInteger(value)) return { integerValue: String(value) };
        return { stringValue: String(value) };
    };
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encode(value)]));
}

const headers = as => ({ 'Content-Type': 'application/json', ...(as ? { Authorization: `Bearer ${as}` } : {}) });

async function create(id, data, as = null) {
    const response = await fetch(`${BASE}:commit`, {
        method: 'POST',
        headers: headers(as),
        body: JSON.stringify({
            writes: [{
                update: { name: `projects/${PROJECT}/databases/(default)/documents/reviews/${id}`, fields: fields(data) },
                updateTransforms: [{ fieldPath: 'submittedAt', setToServerValue: 'REQUEST_TIME' }],
                currentDocument: { exists: false }
            }]
        })
    });
    return response.status;
}

async function patch(id, data, as) {
    const mask = Object.keys(data).map(key => `updateMask.fieldPaths=${key}`).join('&');
    const response = await fetch(`${BASE}/reviews/${id}?${mask}`, { method: 'PATCH', headers: headers(as), body: JSON.stringify({ fields: fields(data) }) });
    return response.status;
}

async function read(id, as) {
    return (await fetch(`${BASE}/reviews/${id}`, { headers: headers(as) })).status;
}

const ADMIN = tokenFor('daniel', 'daniel.morales@elysiumdr.eu');
const OTHER = tokenFor('otra', 'otra@example.com');
const VALID = {
    name: 'Paulo Morais', role: 'Osteopath', company: 'Consciênciavaliativa', website: 'https://pmorais.pt/',
    logo: 'data:image/webp;base64,UklGRg==',
    startingPoint: 'a', objective: 'b', expectations: 'c', impact: 'd', internalImpact: 'e',
    experience: 'f', recommendation: 'g', rating: 5, consent: true, lang: 'pt', host: 'elysiumdr.eu', status: 'new'
};

test('cualquiera sin cuenta envía una valoración bien formada', async () => {
    assert.equal(await create('ok1', VALID), 200);
    assert.equal(await create('ok2', { ...VALID, logo: '', website: '' }), 200);
});

test('se rechaza todo lo que se sale de la forma', async () => {
    assert.equal(await create('x1', { ...VALID, status: 'selected' }), 403, 'no se autopublica');
    assert.equal(await create('x2', { ...VALID, rating: 9 }), 403);
    assert.equal(await create('x3', { ...VALID, consent: false }), 403);
    assert.equal(await create('x4', { ...VALID, extra: 'x' }), 403);
    assert.equal(await create('x5', { ...VALID, logo: 'data:image/svg+xml;base64,PHN2Zz4=' }), 403, 'sin SVG');
    assert.equal(await create('x6', { ...VALID, website: 'javascript:alert(1)' }), 403);
    assert.equal(await create('x7', { ...VALID, name: '<script>' }), 403);
    assert.equal(await create('x8', { ...VALID, experience: '' }), 403);
    assert.equal(await create('x9', { ...VALID, startingPoint: 'z'.repeat(4001) }), 403);
});

test('solo el administrador lee y cambia el estado', async () => {
    assert.equal(await read('ok1', null), 403);
    assert.equal(await read('ok1', OTHER), 403);
    assert.equal(await read('ok1', ADMIN), 200);
    assert.equal(await patch('ok1', { status: 'selected' }, OTHER), 403);
    assert.equal(await patch('ok1', { status: 'selected' }, ADMIN), 200);
    assert.equal(await patch('ok1', { note: 'para la portada' }, ADMIN), 200);
    assert.equal(await patch('ok1', { name: 'Otro' }, ADMIN), 403, 'el texto del cliente no se reescribe');
});
