'use strict';

/**
 * Pruebas de las alertas por correo de Elysium Patrimonio.
 *
 * Usa una Firestore en memoria (solo lo que el módulo toca) sembrada con los
 * datos de la demostración, un Auth falso y un «SMTP» que anota lo enviado.
 * Comprueba lo que importa de un correo automático: que salga cuando debe,
 * una sola vez, a quien debe, y que hable de usted.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const express = require('express');
const { createPatrimonioService, createPatrimonioRouter, buildAlertsEmail, safeKey } = require('./patrimonio-alerts');

/* ── Firestore en memoria ──────────────────────────────────────────────────── */

function fakeFirestore() {
  const docs = new Map();
  let collectionReads = 0;
  const snapshot = (id, pathKey) => ({
    id,
    exists: docs.has(pathKey),
    data: () => (docs.has(pathKey) ? structuredClone(docs.get(pathKey)) : undefined)
  });
  function docRef(pathKey) {
    const id = pathKey.split('/').pop();
    return {
      id,
      path: pathKey,
      get: async () => snapshot(id, pathKey),
      create: async data => {
        if (docs.has(pathKey)) { const error = new Error('Document already exists'); error.code = 6; throw error; }
        docs.set(pathKey, structuredClone(data));
      },
      set: async (data, options) => {
        docs.set(pathKey, options?.merge ? { ...(docs.get(pathKey) || {}), ...structuredClone(data) } : structuredClone(data));
      },
      delete: async () => { docs.delete(pathKey); },
      collection: name => collectionRef(`${pathKey}/${name}`)
    };
  }
  function collectionRef(prefix, filters = [], max = Infinity, after = null) {
    const list = () => [...docs.keys()]
      .filter(key => key.startsWith(`${prefix}/`) && !key.slice(prefix.length + 1).includes('/'))
      .sort()
      .map(key => snapshot(key.split('/').pop(), key))
      .filter(snap => filters.every(([field, value]) => snap.data()[field] === value))
      .filter(snap => after === null || snap.id > after)
      .slice(0, max);
    return {
      doc: id => docRef(`${prefix}/${id}`),
      where: (field, op, value) => collectionRef(prefix, [...filters, [field, value]], max, after),
      orderBy: () => collectionRef(prefix, filters, max, after),
      startAfter: snap => collectionRef(prefix, filters, max, snap.id),
      limit: n => collectionRef(prefix, filters, n, after),
      get: async () => { collectionReads += 1; const items = list(); return { docs: items, size: items.length }; }
    };
  }
  return {
    docs,
    get collectionReads() { return collectionReads; },
    collection: name => collectionRef(name),
    getAll: async (...refs) => Promise.all(refs.map(ref => ref.get()))
  };
}

async function seedDemo(db, uid, overrides = {}) {
  const { demoSeed } = await import(pathToFileURL(path.join(__dirname, '..', 'Gestor-Patrimonios', 'js', 'demo-data.js')).href);
  const seed = demoSeed();
  await db.collection('patrimonio').doc(uid).set({ ...seed.profile, ...overrides.profile });
  for (const [name, list] of Object.entries(seed.collections)) {
    for (const item of list) {
      const { id, ...data } = item;
      await db.collection('patrimonio').doc(uid).collection(name).doc(id).set(data);
    }
  }
  await db.collection('patrimonio_access').doc(uid).set({ active: true });
  return seed;
}

function harness({ verified = true, now = () => new Date() } = {}) {
  const db = fakeFirestore();
  const sent = [];
  const deps = {
    db,
    auth: { getUser: async uid => ({ uid, email: `${uid}@example.com`, emailVerified: verified, disabled: false }) },
    sendEmail: async (payload, key) => { sent.push({ ...payload, key }); return { id: key }; },
    emailTheme: (content, preheader) => `<html lang="en"><body><div>${preheader}</div>${content}</body></html>`,
    from: () => 'Elysium <info@elysiumdr.eu>',
    adminEmail: () => 'admin@example.com',
    now
  };
  return { db, sent, deps, service: createPatrimonioService(deps) };
}

/* ── Pruebas ───────────────────────────────────────────────────────────────── */

test('las alertas inmediatas salen una vez, de usted, al correo verificado', async () => {
  const { db, sent, service } = harness();
  await seedDemo(db, 'alex');
  const first = await service.checkImmediate('alex');
  assert.ok(first.sent >= 1, 'la demo tiene presupuestos por encima del 80 %');
  assert.equal(sent.length, 1, 'un solo correo agrupa las alertas nuevas');
  assert.deepEqual(sent[0].to, ['alex@example.com']);
  assert.match(sent[0].html, /Ha gastado|Presupuesto de .* excedido/);
  assert.match(sent[0].html, /lang="es-CR"/);
  assert.doesNotMatch(sent[0].html + sent[0].text, /\b(tu|tus|has gastado|puedes)\b/i, 'nada de tuteo');
  const second = await service.checkImmediate('alex');
  assert.equal(second.sent, 0);
  assert.equal(sent.length, 1, 'la misma alerta no se repite');
});

test('sin correo verificado no se envía nada', async () => {
  const { db, sent, service } = harness({ verified: false });
  await seedDemo(db, 'alex');
  const result = await service.checkImmediate('alex');
  assert.equal(result.reason, 'email_not_verified');
  assert.equal(sent.length, 0);
});

test('si la persona apaga las alertas inmediatas, no llegan', async () => {
  const { db, sent, service } = harness();
  const seed = await seedDemo(db, 'alex');
  await db.collection('patrimonio').doc('alex').set({ settings: { ...seed.profile.settings, email: { immediate: false } } }, { merge: true });
  assert.equal((await service.checkImmediate('alex')).reason, 'disabled');
  assert.equal(sent.length, 0);
});

test('apagar las alertas inmediatas no lee ni una colección de la persona', async () => {
  const { db, service } = harness();
  const seed = await seedDemo(db, 'alex');
  await db.collection('patrimonio').doc('alex').set({ settings: { ...seed.profile.settings, email: { immediate: false } } }, { merge: true });
  const before = db.collectionReads;
  assert.equal((await service.checkImmediate('alex')).reason, 'disabled');
  assert.equal(db.collectionReads, before, 'basta el perfil: no hay que leer todos los movimientos');
});

test('el «hoy» de cada persona sale de su zona horaria: el lunes en Auckland ya es lunes', async () => {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setUTCDate(today.getUTCDate() + ((7 - today.getUTCDay()) % 7 || 7));
  sunday.setUTCHours(14, 0, 0, 0); // domingo 08:00 en Costa Rica, lunes de madrugada en Nueva Zelanda
  const { db, sent, service } = harness({ now: () => sunday });
  const seed = await seedDemo(db, 'tico');
  await seedDemo(db, 'kiwi', { profile: { settings: { ...seed.profile.settings, timeZone: 'Pacific/Auckland' } } });
  await service.runForUser('tico');
  assert.ok(!sent.some(mail => /Su semana en Patrimonio/.test(mail.subject)), 'en Costa Rica es domingo');
  await service.runForUser('kiwi');
  assert.ok(sent.some(mail => /Su semana en Patrimonio/.test(mail.subject) && mail.to[0] === 'kiwi@example.com'), 'en Auckland es lunes');
});

test('el lunes llega el resumen semanal y el día 1 el informe del mes, una vez', async () => {
  const today = new Date();
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + ((8 - today.getUTCDay()) % 7 || 7));
  monday.setUTCHours(14, 0, 0, 0); // 08:00 en Costa Rica
  const { db, sent, service } = harness({ now: () => monday });
  await seedDemo(db, 'alex');
  await service.runForUser('alex');
  assert.ok(sent.some(mail => /Su semana en Patrimonio/.test(mail.subject)), 'resumen semanal');
  const before = sent.length;
  await service.runForUser('alex');
  assert.equal(sent.length, before, 'la segunda pasada del mismo día no repite nada');

  const firstOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1, 14));
  const monthly = harness({ now: () => firstOfMonth });
  await seedDemo(monthly.db, 'alex');
  await monthly.service.runForUser('alex');
  assert.ok(monthly.sent.some(mail => /Su informe de/.test(mail.subject)), 'informe del mes');
});

test('runAll recorre solo licencias activas', async () => {
  const { db, sent, service } = harness();
  await seedDemo(db, 'alex');
  await seedDemo(db, 'beto');
  await db.collection('patrimonio_access').doc('beto').set({ active: false });
  const results = await service.runAll();
  assert.equal(results.users, 1);
  assert.ok(sent.every(mail => mail.to[0] === 'alex@example.com'));
});

test('runAll pasa por todas las licencias aunque no quepan en una página', async () => {
  const { db, deps } = harness();
  for (const id of ['u1', 'u2', 'u3', 'u4', 'u5']) await db.collection('patrimonio_access').doc(id).set({ active: true });
  await db.collection('patrimonio_access').doc('u6').set({ active: false });
  const service = createPatrimonioService({ ...deps, pageSize: 2 });
  const results = await service.runAll();
  assert.equal(results.users, 5, 'las cinco activas, en tres páginas de dos');
});

test('la solicitud de acceso avisa al administrador una vez', async () => {
  const { db, sent, service } = harness();
  await db.collection('patrimonio_requests').doc('carla').set({ uid: 'carla', email: 'carla@example.com', name: 'Carla', note: 'Me la recomendó Jared', requestedAt: new Date(1790000000000) });
  assert.equal(await service.notifyAccessRequest('carla'), 'sent');
  assert.equal(await service.notifyAccessRequest('carla'), 'skipped');
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].to, ['admin@example.com']);
  assert.match(sent[0].html, /Me la recomendó Jared/);
});

test('las claves de correo son ids de Firestore válidos', () => {
  assert.equal(safeKey('budget:comida:2026-09:80'), 'budget:comida:2026-09:80');
  assert.equal(safeKey('a/b/c'), 'a_b_c');
});

test('el texto de un correo de alertas escapa lo que escribe la persona', () => {
  const email = buildAlertsEmail({
    alerts: [{ id: 'x', title: '<b>Hola</b>', body: 'Comercio <script>', severity: 'warning', route: '#/inicio' }],
    profile: { displayName: 'Ana <img>' },
    kind: 'immediate',
    emailTheme: content => content
  });
  assert.doesNotMatch(email.html, /<script>|<img>|<b>Hola<\/b>/);
});

/* ── Rutas ─────────────────────────────────────────────────────────────────── */

async function listen(router) {
  const app = express();
  app.use(express.json());
  app.use('/api/patrimonio', router);
  const server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)); });
  return { base: `http://127.0.0.1:${server.address().port}/api/patrimonio`, close: () => server.close() };
}

test('rutas: el disparo diario exige el secreto del programador o un administrador', async () => {
  process.env.PATRIMONIO_ALERTS_TOKEN = 'secreto-de-prueba-123';
  const { deps } = harness();
  const router = createPatrimonioRouter({ ...deps, verifyUser: (req, _res, next) => { req.firebaseUser = null; next(); }, isAdmin: () => false });
  const { base, close } = await listen(router);
  try {
    assert.equal((await fetch(`${base}/alerts/run`, { method: 'POST' })).status, 403);
    assert.equal((await fetch(`${base}/alerts/run`, { method: 'POST', headers: { 'x-elysium-patrimonio-token': 'otro-secreto-de-prueba' } })).status, 403);
    const ok = await fetch(`${base}/alerts/run`, { method: 'POST', headers: { 'x-elysium-patrimonio-token': 'secreto-de-prueba-123' } });
    assert.equal(ok.status, 200);
    assert.equal((await fetch(`${base}/alerts/check`, { method: 'POST' })).status, 401);
  } finally {
    close();
  }
});

test('rutas: sin licencia activa, /alerts/check responde 403', async () => {
  const { deps } = harness();
  const router = createPatrimonioRouter({ ...deps, verifyUser: (req, _res, next) => { req.firebaseUser = { uid: 'intruso' }; next(); }, isAdmin: () => false });
  const { base, close } = await listen(router);
  try {
    assert.equal((await fetch(`${base}/alerts/check`, { method: 'POST' })).status, 403);
  } finally {
    close();
  }
});
