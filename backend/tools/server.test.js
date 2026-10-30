'use strict';

/**
 * El flujo HTTP entero contra un yt-dlp de mentira
 * (`test-fixtures/fake-yt-dlp.js`): autorización, análisis, descarga con su
 * progreso en NDJSON, recogida del fichero, cancelación y cola.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp, isFirebaseAdmin } = require('./server');

const FAKE_YT_DLP = path.join(__dirname, 'test-fixtures', 'fake-yt-dlp.js');
const FAKE_PDF2DOCX = path.join(__dirname, 'test-fixtures', 'fake-pdf2docx.js');
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 0xff, 0xd9]);

const IDENTITIES = {
  admin: { uid: 'u-admin', email: 'daniel.morales@elysiumdr.eu', email_verified: true },
  claim: { uid: 'u-claim', email: 'ops@elysiumdr.eu', email_verified: true, admin: true },
  member: { uid: 'u-member', email: 'cliente@example.com', email_verified: true },
  unverified: { uid: 'u-new', email: 'daniel.morales@elysiumdr.eu', email_verified: false }
};

async function startServer(t, settings = {}, { lookup } = {}) {
  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'elysium-tools-test-'));
  const thumbnails = [];
  const app = createApp({
    publicGatewayKey: 'test-public-gateway-key-with-32-characters',
    verifyIdToken: async token => {
      if (!IDENTITIES[token]) throw new Error('invalid token');
      return IDENTITIES[token];
    },
    settings: {
      command: process.execPath,
      commandArgs: [FAKE_YT_DLP],
      ffmpeg: process.execPath,
      python: process.execPath,
      converterScript: FAKE_PDF2DOCX,
      workRoot,
      maxBytes: 100000,
      heartbeatMs: 60000,
      progressIntervalMs: 0,
      ...settings
    },
    lookup: lookup || (async () => [{ address: '93.184.216.34', family: 4 }]),
    fetchImpl: async url => {
      thumbnails.push(String(url));
      return new Response(JPEG, { headers: { 'Content-Type': 'image/jpeg' } });
    }
  });
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(() => stopServer(app, server, workRoot));
  return { base, app, workRoot, thumbnails };
}

async function stopServer(app, server, workRoot) {
  await app.locals.close();
  // `close()` espera a las conexiones keep-alive del cliente: se cortan antes.
  const closed = new Promise(resolve => server.close(resolve));
  server.closeAllConnections();
  await closed;
  fs.rmSync(workRoot, { recursive: true, force: true });
}

function call(base, pathname, { token = 'admin', body, method = 'POST', signal } = {}) {
  return fetch(`${base}${pathname}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal
  });
}

/** Lee el NDJSON de /download evento a evento, como hace el CRM. */
async function readEvents(response, onEvent = () => {}) {
  const events = [];
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let index;
    while ((index = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (!line) continue;
      const event = JSON.parse(line);
      events.push(event);
      if (onEvent(event) === false) return events;
    }
  }
  return events;
}

function jobDirs(workRoot) {
  return fs.readdirSync(workRoot).filter(name => name.startsWith('job-'));
}

async function waitFor(predicate, timeoutMs = 4000) {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error('waitFor: se agotó el tiempo');
    await new Promise(resolve => setTimeout(resolve, 25));
  }
}

/* ── Acceso ──────────────────────────────────────────────────────────────── */

test('solo entran administradores con el correo verificado', async t => {
  const { base } = await startServer(t);
  const body = { url: 'https://youtu.be/abc123def45' };
  assert.equal((await call(base, '/api/tools/video/inspect', { token: null, body })).status, 401);
  assert.equal((await call(base, '/api/tools/video/inspect', { token: 'forged', body })).status, 401);
  assert.equal((await call(base, '/api/tools/video/inspect', { token: 'member', body })).status, 403);
  const unverified = await call(base, '/api/tools/video/inspect', { token: 'unverified', body });
  assert.equal(unverified.status, 403);
  assert.equal((await unverified.json()).code, 'email_not_verified');
  assert.equal((await call(base, '/api/tools/video/inspect', { token: 'claim', body })).status, 200);
  assert.equal((await call(base, '/api/tools/video/download', { token: 'member', body: { ...body, option: 'v720' } })).status, 403);
});

test('la regla de administrador es la misma que la de elysium-billing', { skip: !fs.existsSync(path.join(__dirname, '..', 'platform-server.js')) }, () => {
  const billing = require('../platform-server');
  const identities = [
    null,
    { email: 'daniel.morales@elysiumdr.eu', email_verified: true },
    { email: 'DANIEL.MORALES@elysiumdr.eu', email_verified: true },
    { email: 'daniel.morales@elysiumdr.eu', email_verified: false },
    { email: 'x@example.com', email_verified: true, admin: true },
    { email: 'x@example.com', email_verified: true, admin: 'true' },
    { email: 'x@example.com', email_verified: true, role: 'Root' },
    { email: 'x@example.com', email_verified: true, crmRole: 'super_admin' },
    { email: 'x@example.com', email_verified: true, crmRole: 'sales', role: 'admin' },
    { email: 'x@example.com', email_verified: true, role: 'editor' }
  ];
  for (const identity of identities) {
    assert.equal(isFirebaseAdmin(identity), billing.isFirebaseAdmin(identity), JSON.stringify(identity));
  }
});

test('/capabilities dice qué motor hay y con qué límites', async t => {
  const { base } = await startServer(t);
  const response = await call(base, '/api/tools/capabilities', { method: 'GET' });
  assert.equal(response.status, 200);
  const { video } = await response.json();
  assert.equal(video.ytDlp, '2026.10.26');
  assert.equal(video.maxBytes, 100000);
  assert.equal(video.cookies, false);
  assert.equal((await fetch(`${base}/api/tools/health`)).status, 200);
  assert.equal((await call(base, '/api/tools/nada', { method: 'GET' })).status, 404);
});

test('un motor que no contesta no se da por perdido para siempre', async t => {
  // En Cloud Run, fuera de una petición casi no hay CPU: la primera consulta
  // puede fallar por tiempo. La siguiente tiene que volver a preguntar.
  const { base, app } = await startServer(t, { command: path.join(os.tmpdir(), 'no-existe-yt-dlp') });
  const first = await (await call(base, '/api/tools/capabilities', { method: 'GET' })).json();
  assert.equal(first.video.ready, false);
  assert.equal(first.video.ytDlp, null);
  app.locals.video.settings.command = process.execPath;
  const second = await (await call(base, '/api/tools/capabilities', { method: 'GET' })).json();
  assert.equal(second.video.ytDlp, '2026.10.26');
});

/* ── Análisis ────────────────────────────────────────────────────────────── */

test('analiza un vídeo y trae la miniatura como data:', async t => {
  const { base, thumbnails } = await startServer(t);
  const response = await call(base, '/api/tools/video/inspect', { body: { url: 'Mira https://youtu.be/abc123def45 😍' } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const media = await response.json();
  assert.equal(media.kind, 'video');
  assert.equal(media.title, 'Clip de prueba');
  assert.deepEqual(media.platform, { id: 'youtube', name: 'YouTube' });
  assert.deepEqual(media.options.map(option => option.id), ['v2160', 'v1440', 'v1080', 'v720', 'v360', 'audio-mp3', 'audio-m4a']);
  assert.equal(media.thumbnail, `data:image/jpeg;base64,${JPEG.toString('base64')}`);
  assert.deepEqual(thumbnails, ['https://i.ytimg.com/vi/abc123def45/hqdefault.jpg']);
});

test('analiza listas y carruseles', async t => {
  const { base } = await startServer(t);
  const playlist = await (await call(base, '/api/tools/video/inspect', { body: { url: 'https://www.youtube.com/playlist?list=PLtest' } })).json();
  assert.equal(playlist.kind, 'playlist');
  assert.equal(playlist.entries.length, 2);
  const carousel = await (await call(base, '/api/tools/video/inspect', { body: { url: 'https://www.instagram.com/p/carousel/' } })).json();
  assert.equal(carousel.entries[0].options[0].id, 'v720');
});

test('traduce los fallos de la plataforma a códigos', async t => {
  const { base } = await startServer(t);
  const cases = [
    ['https://example.com/unsupported', 'unsupported', 'example.com'],
    ['https://www.instagram.com/reel/login/', 'login_required', 'Instagram'],
    ['https://www.youtube.com/watch?v=bot', 'bot_check', 'YouTube']
  ];
  for (const [url, code, platform] of cases) {
    const response = await call(base, '/api/tools/video/inspect', { body: { url } });
    assert.equal(response.status, 422, url);
    const body = await response.json();
    assert.equal(body.code, code, url);
    assert.equal(body.platform, platform, url);
    assert.ok(body.error && body.detail, url);
  }
});

test('no sale hacia la red interna, ni por IP ni por nombre', async t => {
  const { base } = await startServer(t, {}, {
    lookup: async host => (host === 'trampa.example' ? [{ address: '169.254.169.254', family: 4 }] : [{ address: '93.184.216.34', family: 4 }])
  });
  for (const url of ['http://127.0.0.1:8080/x', 'http://metadata.google.internal/x', 'https://trampa.example/video']) {
    const response = await call(base, '/api/tools/video/inspect', { body: { url } });
    assert.equal(response.status, 400, url);
    assert.equal((await response.json()).code, 'url_private', url);
  }
  const invalid = await call(base, '/api/tools/video/inspect', { body: { url: 'ftp://example.com/v' } });
  assert.equal((await invalid.json()).code, 'url_invalid');
});

/* ── Descarga ────────────────────────────────────────────────────────────── */

test('descarga, cuenta el progreso y entrega el fichero una vez', async t => {
  const { base, app, workRoot } = await startServer(t);
  const response = await call(base, '/api/tools/video/download', { body: { url: 'https://youtu.be/abc123def45', option: 'v1080' } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^application\/x-ndjson/);
  assert.equal(response.headers.get('cache-control'), 'no-store, no-transform');

  const events = await readEvents(response);
  const types = events.map(event => event.type);
  assert.deepEqual(types.slice(0, 2), ['accepted', 'stage']);
  assert.equal(types.at(-1), 'ready');
  const progress = events.filter(event => event.type === 'progress');
  assert.deepEqual([...new Set(progress.map(event => event.kind))], ['video', 'audio']);
  assert.ok(progress.every(event => event.parts === 2));
  assert.ok(progress.every((event, index) => index === 0 || event.percent >= progress[index - 1].percent));
  assert.deepEqual(events.filter(event => event.type === 'stage').map(event => event.stage), ['starting', 'merging', 'finishing']);

  const { file } = events.at(-1);
  assert.equal(file.name, 'Clip de prueba.mp4');
  assert.equal(file.bytes, 1500);
  assert.equal(file.type, 'video/mp4');
  assert.match(file.url, /^\/api\/tools\/files\/[A-Za-z0-9_-]{32}$/);

  // Lo recoge el navegador, sin cabecera Authorization.
  const download = await fetch(`${base}${file.url}`);
  assert.equal(download.status, 200);
  assert.equal(download.headers.get('content-type'), 'video/mp4');
  assert.match(download.headers.get('content-disposition'), /^attachment; filename="Clip de prueba\.mp4"/);
  assert.equal(download.headers.get('cache-control'), 'no-store');
  assert.equal((await download.arrayBuffer()).byteLength, 1500);
  assert.equal(jobDirs(workRoot).length, 1);

  // Descargado no es caducado: el CRM promete la hora de `expiresAt`, y se
  // puede volver a pedir (o reanudar por rangos) hasta entonces.
  const [entry] = app.locals.workspace.files.values();
  await waitFor(() => entry.downloads === 1);
  assert.equal(new Date(entry.expiresAt).toISOString(), events.at(-1).expiresAt);
  const again = await fetch(`${base}${file.url}`, { headers: { Range: 'bytes=0-99' } });
  assert.equal(again.status, 206);
  assert.equal((await again.arrayBuffer()).byteLength, 100);
});

test('el fichero caduca y su carpeta se borra', async t => {
  let clock = Date.now();
  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'elysium-tools-test-'));
  const app = createApp({
    verifyIdToken: async () => IDENTITIES.admin,
    settings: { command: process.execPath, commandArgs: [FAKE_YT_DLP], workRoot, progressIntervalMs: 0 },
    lookup: async () => [{ address: '93.184.216.34', family: 4 }],
    fetchImpl: async () => new Response(JPEG, { headers: { 'Content-Type': 'image/jpeg' } }),
    now: () => clock
  });
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  t.after(() => stopServer(app, server, workRoot));
  const base = `http://127.0.0.1:${server.address().port}`;
  const events = await readEvents(await call(base, '/api/tools/video/download', { body: { url: 'https://youtu.be/abc123def45', option: 'audio-mp3' } }));
  const ready = events.at(-1);
  assert.equal(ready.type, 'ready');
  assert.equal(ready.file.name, 'Clip de prueba.mp3');
  assert.equal(ready.file.type, 'audio/mpeg');
  assert.ok(events.some(event => event.type === 'stage' && event.stage === 'extracting'));

  clock += 16 * 60 * 1000;
  const expired = await fetch(`${base}${ready.file.url}`);
  assert.equal(expired.status, 410);
  assert.equal((await expired.json()).code, 'file_expired');
  await app.locals.workspace.sweep();
  assert.deepEqual(jobDirs(workRoot), []);
  assert.equal((await fetch(`${base}/api/tools/files/esto-no-es-un-token`)).status, 410);
});

test('valida la petición antes de abrir el flujo', async t => {
  const { base } = await startServer(t);
  const response = await call(base, '/api/tools/video/download', { body: { url: 'https://youtu.be/abc123def45', option: 'bv*+ba' } });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'option_invalid');
  const item = await call(base, '/api/tools/video/download', { body: { url: 'https://youtu.be/abc', option: 'best', item: -1 } });
  assert.equal((await item.json()).code, 'item_invalid');
  const broken = await fetch(`${base}/api/tools/video/download`, {
    method: 'POST',
    headers: { Authorization: 'Bearer admin', 'Content-Type': 'application/json' },
    body: '{roto'
  });
  assert.equal(broken.status, 400);
  assert.equal((await broken.json()).code, 'invalid_json');
});

test('los fallos de la descarga llegan como evento, sin dejar carpetas', async t => {
  const { base, workRoot } = await startServer(t);
  const cases = [
    ['https://www.youtube.com/watch?v=bot', 'bot_check'],
    ['https://www.youtube.com/watch?v=live', 'live'],
    ['https://www.youtube.com/watch?v=huge', 'too_large']
  ];
  for (const [url, code] of cases) {
    const events = await readEvents(await call(base, '/api/tools/video/download', { body: { url, option: 'v720' } }));
    const last = events.at(-1);
    assert.equal(last.type, 'error', url);
    assert.equal(last.code, code, url);
    assert.ok(last.error, url);
  }
  await waitFor(() => jobDirs(workRoot).length === 0);
});

test('cancelar desde el CRM detiene yt-dlp y libera el turno', async t => {
  const { base, app, workRoot } = await startServer(t, { maxActiveDownloads: 1 });
  const controller = new AbortController();
  const slow = await call(base, '/api/tools/video/download', {
    body: { url: 'https://www.youtube.com/watch?v=slow', option: 'v720' },
    signal: controller.signal
  });

  // Mientras la lenta ocupa el único turno, la siguiente espera en cola.
  const queuedResponse = await call(base, '/api/tools/video/download', { body: { url: 'https://youtu.be/abc123def45', option: 'v720' } });
  const queuedEvents = [];
  const queued = readEvents(queuedResponse, event => { queuedEvents.push(event); });

  await readEvents(slow, event => event.type !== 'progress').catch(() => []);
  await waitFor(() => queuedEvents.some(event => event.type === 'queued'));
  assert.deepEqual(queuedEvents.find(event => event.type === 'queued'), { type: 'queued', position: 1 });
  assert.equal(jobDirs(workRoot).length, 1);

  controller.abort();
  const events = await queued;
  assert.equal(events.at(-1).type, 'ready');
  await waitFor(() => app.locals.video.downloads.active === 0);
  // Queda solo la carpeta del fichero listo; la de la cancelada se borró.
  await waitFor(() => jobDirs(workRoot).length === 1);
});

/* ── PDF a Word ──────────────────────────────────────────────────────────── */

function sendPdf(base, content, { token = 'admin', name = 'Contrato final.pdf', signal } = {}) {
  return fetch(`${base}/api/tools/pdf/convert?name=${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/pdf' },
    body: Buffer.from(`%PDF-1.7\n${content}\n%%EOF`),
    signal
  });
}

test('convierte un PDF en .docx, con progreso por página', async t => {
  const { base, workRoot } = await startServer(t);
  const response = await sendPdf(base, 'contrato');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^application\/x-ndjson/);
  const events = await readEvents(response);
  assert.equal(events[0].type, 'accepted');
  const progress = events.filter(event => event.type === 'progress');
  assert.ok(progress.length >= 6);
  assert.ok(progress.every((event, index) => index === 0 || event.percent >= progress[index - 1].percent));
  assert.equal(progress.at(-1).percent, 98);
  const ready = events.at(-1);
  assert.equal(ready.type, 'ready');
  assert.equal(ready.pages, 3);
  assert.equal(ready.file.name, 'Contrato final.docx');
  assert.equal(ready.file.type, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assert.match(ready.file.url, /^\/api\/tools\/files\/[A-Za-z0-9_-]{32}$/);

  const docx = await fetch(`${base}${ready.file.url}`);
  assert.equal(docx.status, 200);
  assert.match(docx.headers.get('content-disposition'), /^attachment; filename="Contrato final\.docx"/);
  assert.equal(Buffer.from(await docx.arrayBuffer()).subarray(0, 2).toString(), 'PK');
  // El PDF no se queda esperando junto al .docx.
  const [dir] = jobDirs(workRoot);
  assert.deepEqual(fs.readdirSync(path.join(workRoot, dir)), ['Contrato final.docx']);
});

test('avisa de un PDF escaneado y explica los que no se pueden convertir', async t => {
  const { base, workRoot } = await startServer(t);
  const scanned = await readEvents(await sendPdf(base, 'SCANNED'));
  assert.deepEqual(scanned.find(event => event.type === 'warning'), { type: 'warning', code: 'scanned' });
  assert.equal(scanned.at(-1).type, 'ready');

  for (const [content, code] of [['ENCRYPTED', 'pdf_encrypted'], ['CRASH', 'pdf_failed']]) {
    const last = (await readEvents(await sendPdf(base, content))).at(-1);
    assert.equal(last.type, 'error', content);
    assert.equal(last.code, code, content);
    assert.ok(last.error, content);
  }
  await waitFor(() => jobDirs(workRoot).length === 1);
});

test('rechaza lo que no es un PDF, lo vacío, lo enorme y a quien no es administrador', async t => {
  const { base } = await startServer(t, { pdfMaxBytes: 2000 });
  const notPdf = await fetch(`${base}/api/tools/pdf/convert`, {
    method: 'POST',
    headers: { Authorization: 'Bearer admin', 'Content-Type': 'application/pdf' },
    body: 'PK\u0003\u0004 esto es un zip'
  });
  assert.equal(notPdf.status, 400);
  assert.equal((await notPdf.json()).code, 'pdf_invalid');
  const empty = await fetch(`${base}/api/tools/pdf/convert`, { method: 'POST', headers: { Authorization: 'Bearer admin' } });
  assert.equal((await empty.json()).code, 'pdf_required');
  const huge = await sendPdf(base, 'x'.repeat(3000));
  assert.equal(huge.status, 413);
  assert.equal((await huge.json()).code, 'payload_too_large');
  assert.equal((await sendPdf(base, 'contrato', { token: 'member' })).status, 403);
  assert.equal((await sendPdf(base, 'contrato', { token: null })).status, 401);
});

test('cancelar una conversión detiene el proceso y borra la carpeta', async t => {
  const { base, app, workRoot } = await startServer(t);
  const controller = new AbortController();
  const response = await sendPdf(base, 'SLOW', { signal: controller.signal });
  await readEvents(response, event => event.type !== 'progress').catch(() => []);
  assert.equal(jobDirs(workRoot).length, 1);
  controller.abort();
  await waitFor(() => app.locals.pdf.conversions.active === 0);
  await waitFor(() => jobDirs(workRoot).length === 0);
});

test('/capabilities también dice si hay motor para PDF', async t => {
  const { base } = await startServer(t, { python: path.join(os.tmpdir(), 'no-existe-python') });
  const { pdf } = await (await call(base, '/api/tools/capabilities', { method: 'GET' })).json();
  assert.deepEqual(pdf, { ready: false, pdf2docx: null, pymupdf: null, maxBytes: 30000000 });
});

/* ── Vía pública (tools.elysiumdr.eu) ───────────────────────────────────── */

const PUBLIC_KEY = 'test-public-gateway-key-with-32-characters';
const PUBLIC_HEADERS = { 'X-Elysium-Public-Key': PUBLIC_KEY, 'X-Elysium-Client-IP': '198.51.100.8' };

function callPublic(base, pathname, { body, method = 'POST', ip, signal } = {}) {
  return fetch(`${base}/api/tools/public${pathname}`, {
    method,
    headers: {
      ...PUBLIC_HEADERS,
      ...(ip ? { 'X-Elysium-Client-IP': ip } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal
  });
}

test('vía pública: funciona sin Firebase y el CRM sigue cerrado', async t => {
  const { base, thumbnails } = await startServer(t);
  assert.equal((await fetch(`${base}/api/tools/public/capabilities`)).status, 403);
  assert.equal((await fetch(`${base}/api/tools/capabilities`)).status, 401);
  // La clave del público no abre el CRM.
  assert.equal((await fetch(`${base}/api/tools/capabilities`, { headers: PUBLIC_HEADERS })).status, 401);

  const capabilities = await (await callPublic(base, '/capabilities', { method: 'GET' })).json();
  assert.deepEqual(capabilities.platforms, ['tiktok', 'instagram', 'facebook', 'pinterest', 'twitch', 'linkedin', 'snapchat', 'bluesky']);
  assert.equal(capabilities.video.maxBytes, 250000000);
  assert.deepEqual(capabilities.limits, { inspectionsPerHour: 30, downloadsPerHour: 10, conversionsPerHour: 10 });

  const url = 'https://www.tiktok.com/@elysium/video/7300000000000000000';
  const inspected = await callPublic(base, '/video/inspect', { body: { url } });
  assert.equal(inspected.status, 200);
  const media = await inspected.json();
  assert.equal(media.title, 'Receta rápida #cocina');
  // La miniatura no se pide: esa petición no pasaría por el proxy filtrado.
  assert.equal(media.thumbnail, null);
  assert.deepEqual(thumbnails, []);

  const downloaded = await callPublic(base, '/video/download', { body: { url, option: media.options[0].id } });
  const ready = (await readEvents(downloaded)).find(event => event.type === 'ready');
  assert.ok(ready);
  assert.equal((await fetch(base + ready.file.url)).status, 200);

  const converted = await fetch(`${base}/api/tools/public/pdf/convert?name=public.pdf`, {
    method: 'POST',
    headers: { ...PUBLIC_HEADERS, 'Content-Type': 'application/pdf' },
    body: Buffer.from('%PDF-1.4\npublic test')
  });
  const docx = (await readEvents(converted)).find(event => event.type === 'ready');
  assert.ok(docx);
  assert.match(docx.file.name, /public\.docx$/);
});

test('vía pública: sin la clave de la pasarela o sin IP no entra nadie', async t => {
  const { base } = await startServer(t);
  const wrong = await fetch(`${base}/api/tools/public/capabilities`, { headers: { ...PUBLIC_HEADERS, 'X-Elysium-Public-Key': 'x'.repeat(PUBLIC_KEY.length) } });
  assert.equal(wrong.status, 403);
  assert.equal((await wrong.json()).code, 'gateway_required');
  const noIp = await fetch(`${base}/api/tools/public/capabilities`, { headers: { 'X-Elysium-Public-Key': PUBLIC_KEY } });
  assert.equal(noIp.status, 403);
  assert.equal((await callPublic(base, '/video/cancel', { body: {} })).status, 404);
  assert.equal((await callPublic(base, '/video/inspect', { method: 'GET' })).status, 404);
});

test('vía pública: solo las plataformas comprobadas; YouTube, «próximamente»', async t => {
  const { base } = await startServer(t);
  const unsupported = await callPublic(base, '/video/inspect', { body: { url: 'https://example.com/file.mp4' } });
  assert.equal(unsupported.status, 400);
  assert.equal((await unsupported.json()).code, 'unsupported');
  for (const url of ['https://vimeo.com/76979871', 'https://soundcloud.com/a/b', 'https://www.tiktok.com:8443/@a/video/1']) {
    assert.equal((await (await callPublic(base, '/video/inspect', { body: { url } })).json()).code, 'unsupported', url);
  }
  const youtube = await callPublic(base, '/video/inspect', { body: { url: 'https://www.youtube.com/watch?v=abc123def45' } });
  assert.equal(youtube.status, 400);
  assert.deepEqual(await youtube.json(), { code: 'coming_soon', platform: 'YouTube' });
  const shortLink = await callPublic(base, '/video/inspect', { body: { url: 'https://pin.it/abc123' } });
  assert.deepEqual(await shortLink.json(), { code: 'short_link', platform: 'Pinterest' });
  const pinterest = await callPublic(base, '/video/inspect', { body: { url: 'https://www.pinterest.es/pin/664281013778109217/' } });
  assert.equal(pinterest.status, 200);
});

test('vía pública: límite por hora y visitante; una IPv6 cuenta por su /64', async t => {
  const { base } = await startServer(t);
  const body = { url: 'https://example.com/file.mp4' };
  for (let i = 0; i < 30; i += 1) await (await callPublic(base, '/video/inspect', { body, ip: '2001:db8:1:2::1' })).text();
  const limited = await callPublic(base, '/video/inspect', { body, ip: '2001:db8:1:2:aaaa::9' });
  assert.equal(limited.status, 429);
  assert.equal((await limited.json()).code, 'limit_reached');
  assert.ok(Number(limited.headers.get('Retry-After')) > 0);
  assert.equal((await callPublic(base, '/video/inspect', { body, ip: '2001:db8:1:3::1' })).status, 400);
  assert.equal((await callPublic(base, '/video/inspect', { body, ip: '198.51.100.9' })).status, 400);
});

test('vía pública: una descarga a la vez por visitante, pero puede seguir analizando', async t => {
  const { base } = await startServer(t);
  const controller = new AbortController();
  const slow = await callPublic(base, '/video/download', { body: { url: 'https://www.tiktok.com/@a/video/slow', option: 'best' }, signal: controller.signal });
  assert.equal(slow.status, 200);
  const second = await callPublic(base, '/video/download', { body: { url: 'https://www.tiktok.com/@a/video/2', option: 'best' } });
  assert.equal(second.status, 429);
  assert.equal((await second.json()).code, 'busy');
  const inspect = await callPublic(base, '/video/inspect', { body: { url: 'https://www.tiktok.com/@a/video/3' } });
  assert.equal(inspect.status, 200);
  // Otro visitante no espera al primero.
  const other = await callPublic(base, '/video/inspect', { body: { url: 'https://www.tiktok.com/@a/video/4' }, ip: '198.51.100.20' });
  assert.equal(other.status, 200);
  controller.abort();
});
