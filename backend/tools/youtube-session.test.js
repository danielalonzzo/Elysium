'use strict';

/**
 * La sesión de YouTube sin red: el cookies.txt, el filtro de youtube.com, el
 * cifrado atado a cada cuenta, la comprobación con YouTube (contra un fetch de
 * mentira) y lo que pasa después de cada ejecución de yt-dlp.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {
  checkYoutubeSession,
  createMemoryStore,
  createYoutubeSessions,
  deriveKey,
  hasSignedInSession,
  openSession,
  parseCookieFile,
  parseKey,
  sapisidAuthorization,
  sealSession,
  toNetscape,
  youtubeCookies
} = require('./youtube-session');

const NOW = Date.parse('2026-11-04T12:00:00Z');
const now = () => NOW;
const KEY = crypto.randomBytes(32).toString('base64');
const FUTURE = 1893456000; // 2030

const COOKIES_TXT = [
  '# Netscape HTTP Cookie File',
  '# https://curl.haxx.se/rfc/cookie_spec.html',
  `.youtube.com\tTRUE\t/\tTRUE\t${FUTURE}\tSAPISID\tsapisid-value`,
  `#HttpOnly_.youtube.com\tTRUE\t/\tTRUE\t${FUTURE}\tSID\tsid-value`,
  `#HttpOnly_.youtube.com\tTRUE\t/\tTRUE\t${FUTURE}\t__Secure-3PSID\tpsid3-value`,
  `.youtube.com\tTRUE\t/\tTRUE\t${FUTURE}\t__Secure-3PAPISID\tpapisid3-value`,
  `.youtube.com\tTRUE\t/\tTRUE\t0\tYSC\tysc-value`,
  `.youtube.com\tTRUE\t/\tTRUE\t1600000000\tOLD\texpired-value`,
  `.google.com\tTRUE\t/\tTRUE\t${FUTURE}\tSID\tgoogle-sid`,
  `.bank.example\tTRUE\t/\tTRUE\t${FUTURE}\tsession\tbank-secret`,
  ''
].join('\n');

function signedIn(account = { name: 'Canal de prueba', handle: '@prueba' }) {
  return async () => ({ state: 'signed_in', account });
}

/* ── El fichero ──────────────────────────────────────────────────────────── */

test('lee cookies.txt con las HttpOnly y se queda solo con youtube.com', () => {
  const cookies = youtubeCookies(parseCookieFile(COOKIES_TXT), now);
  assert.deepEqual(cookies.map(entry => entry.name), ['SAPISID', 'SID', '__Secure-3PSID', '__Secure-3PAPISID', 'YSC']);
  const sid = cookies.find(entry => entry.name === 'SID');
  assert.equal(sid.httpOnly, true);
  assert.equal(sid.includeSubdomains, true);
  assert.equal(cookies.find(entry => entry.name === 'YSC').expires, 0);
  assert.ok(!cookies.some(entry => /google|bank/.test(entry.value)));
  assert.equal(hasSignedInSession(cookies), true);
});

test('lee la exportación JSON de las extensiones', () => {
  const cookies = parseCookieFile(JSON.stringify([
    { domain: '.youtube.com', hostOnly: false, httpOnly: false, secure: true, session: false, expirationDate: FUTURE + 0.5, path: '/', name: 'SAPISID', value: 'a' },
    { domain: '.youtube.com', hostOnly: false, httpOnly: true, secure: true, session: false, expirationDate: FUTURE, path: '/', name: '__Secure-1PSID', value: 'b' },
    { domain: 'www.youtube.com', hostOnly: true, httpOnly: false, secure: true, session: true, path: '/', name: 'PREF', value: 'f6=40000000' },
    { domain: '.google.com', hostOnly: false, name: 'SID', value: 'google' }
  ]));
  const youtube = youtubeCookies(cookies, now);
  assert.equal(youtube.length, 3);
  const pref = youtube.find(entry => entry.name === 'PREF');
  assert.equal(pref.domain, 'www.youtube.com');
  assert.equal(pref.includeSubdomains, false);
  assert.equal(pref.expires, 0);
  assert.equal(youtube.find(entry => entry.name === 'SAPISID').expires, FUTURE);
  assert.equal(hasSignedInSession(youtube), true);
  assert.equal(parseCookieFile(JSON.stringify({ cookies: [{ domain: '.youtube.com', name: 'SID', value: 'x' }] })).length, 1);
});

test('rechaza lo que no es una exportación de cookies', () => {
  for (const input of ['', '   ', 'hola, esto no es un cookies.txt', '{roto', '{"otra":"cosa"}', '[1,2']) {
    assert.throws(() => parseCookieFile(input), error => error.code === 'youtube_cookies_invalid', JSON.stringify(input));
  }
  // Valores con saltos o punto y coma, o nombres raros, no entran.
  assert.equal(parseCookieFile(JSON.stringify([{ domain: '.youtube.com', name: 'SID', value: 'a;b' }])).length, 0);
  assert.equal(parseCookieFile(JSON.stringify([{ domain: '.youtube.com', name: 'S D', value: 'a' }])).length, 0);
});

test('una sesión sin firma o sin SID no cuenta como iniciada', () => {
  const cookies = youtubeCookies(parseCookieFile(COOKIES_TXT), now);
  assert.equal(hasSignedInSession(cookies.filter(entry => !/APISID/.test(entry.name))), false);
  assert.equal(hasSignedInSession(cookies.filter(entry => !/PSID|^SID$/.test(entry.name))), false);
});

test('el cookies.txt que se escribe para yt-dlp se vuelve a leer igual', () => {
  const cookies = youtubeCookies(parseCookieFile(COOKIES_TXT), now);
  const text = toNetscape(cookies);
  assert.match(text, /^# Netscape HTTP Cookie File\n/);
  assert.match(text, /^#HttpOnly_\.youtube\.com\tTRUE\t\/\tTRUE\t1893456000\tSID\tsid-value$/m);
  assert.deepEqual(parseCookieFile(text), cookies);
});

/* ── El cifrado ──────────────────────────────────────────────────────────── */

test('la sesión cifrada solo se abre con su clave y para su cuenta', () => {
  const key = parseKey(KEY);
  const sealed = sealSession(key, 'user-a', { cookies: [{ name: 'SID', value: 'sid-value' }] });
  assert.ok(!sealed.includes('sid-value'));
  assert.deepEqual(openSession(key, 'user-a', sealed), { cookies: [{ name: 'SID', value: 'sid-value' }] });
  assert.throws(() => openSession(key, 'user-b', sealed));
  assert.throws(() => openSession(crypto.randomBytes(32), 'user-a', sealed));
  const tampered = JSON.parse(sealed);
  tampered.data = Buffer.from('x'.repeat(40)).toString('base64');
  assert.throws(() => openSession(key, 'user-a', JSON.stringify(tampered)));
  assert.equal(parseKey(crypto.randomBytes(16).toString('base64')), null);
  assert.equal(parseKey(''), null);
});

test('sin secreto propio, la clave se deriva del de la pasarela y es otra', () => {
  const gateway = crypto.randomBytes(48).toString('base64');
  const derived = deriveKey(gateway);
  assert.equal(parseKey(derived).length, 32);
  assert.equal(deriveKey(gateway), derived, 'siempre la misma para el mismo secreto');
  assert.notEqual(derived, Buffer.from(gateway).subarray(0, 32).toString('base64'));
  assert.notEqual(deriveKey(crypto.randomBytes(48).toString('base64')), derived);
  assert.equal(deriveKey('corto'), null);
  assert.equal(deriveKey(''), null);
  assert.equal(createYoutubeSessions({ key: derived, store: createMemoryStore() }).ready, true);
});

test('firma las peticiones a la API de YouTube como su web', () => {
  const cookies = youtubeCookies(parseCookieFile(COOKIES_TXT), now);
  const seconds = Math.round(NOW / 1000);
  const sha1 = value => crypto.createHash('sha1').update(`${seconds} ${value} https://www.youtube.com`).digest('hex');
  assert.equal(sapisidAuthorization(cookies, now),
    `SAPISIDHASH ${seconds}_${sha1('sapisid-value')} SAPISID3PHASH ${seconds}_${sha1('papisid3-value')}`);
  assert.equal(sapisidAuthorization([], now), null);
});

/* ── La comprobación con YouTube ─────────────────────────────────────────── */

const HOME = loggedIn => `<html><script>ytcfg.set({"LOGGED_IN":${loggedIn},"INNERTUBE_CLIENT_VERSION":"2.20261101.00.00",`
  + '"SESSION_INDEX":"0","VISITOR_DATA":"Cgt2aXNpdG9y"});</script></html>';
const MENU = { actions: [{ openPopupAction: { popup: { multiPageMenuRenderer: { header: { activeAccountHeaderRenderer: {
  accountName: { simpleText: 'Daniel Morales' }, channelHandle: { runs: [{ text: '@elysium' }] } } } } } } }] };

function fakeYoutube({ loggedIn = true, status = 200, menu = MENU, menuStatus = 200, fail = false } = {}) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), headers: options.headers || {}, method: options.method || 'GET' });
    if (fail) throw new TypeError('fetch failed');
    if (String(url).includes('/youtubei/v1/account/account_menu')) return Response.json(menu, { status: menuStatus });
    if (status !== 200) return new Response(null, { status, headers: { Location: 'https://consent.youtube.com/' } });
    return new Response(HOME(loggedIn), { headers: { 'Content-Type': 'text/html' } });
  };
  return { calls, fetchImpl };
}

test('YouTube reconoce la sesión: dice de qué cuenta es', async () => {
  const cookies = youtubeCookies(parseCookieFile(COOKIES_TXT), now);
  const { calls, fetchImpl } = fakeYoutube();
  const result = await checkYoutubeSession(cookies, { fetchImpl, now });
  assert.deepEqual(result, { state: 'signed_in', account: { name: 'Daniel Morales', handle: '@elysium' } });
  const home = calls[0];
  assert.equal(home.url, 'https://www.youtube.com/?hl=en');
  // Sin cookie de consentimiento, se añade la de yt-dlp; nada de google.com.
  assert.match(home.headers.Cookie, /(^|; )SOCS=CAI(;|$)/);
  assert.match(home.headers.Cookie, /(^|; )SID=sid-value(;|$)/);
  assert.doesNotMatch(home.headers.Cookie, /google|bank/);
  const menu = calls[1];
  assert.equal(menu.method, 'POST');
  assert.match(menu.headers.Authorization, /^SAPISIDHASH \d+_[0-9a-f]{40}/);
  assert.equal(menu.headers['X-Goog-Visitor-Id'], 'Cgt2aXNpdG9y');
});

test('una sesión cerrada, una redirección o YouTube sin respuesta no pasan', async () => {
  const cookies = youtubeCookies(parseCookieFile(COOKIES_TXT), now);
  assert.equal((await checkYoutubeSession(cookies, { fetchImpl: fakeYoutube({ loggedIn: false }).fetchImpl, now })).state, 'signed_out');
  assert.equal((await checkYoutubeSession(cookies, { fetchImpl: fakeYoutube({ status: 302 }).fetchImpl, now })).state, 'signed_out');
  assert.equal((await checkYoutubeSession(cookies, { fetchImpl: fakeYoutube({ status: 503 }).fetchImpl, now })).state, 'unreachable');
  assert.equal((await checkYoutubeSession(cookies, { fetchImpl: fakeYoutube({ fail: true }).fetchImpl, now })).state, 'unreachable');
  // Sin el menú de cuenta sigue siendo una sesión iniciada, solo que sin nombre.
  assert.deepEqual(await checkYoutubeSession(cookies, { fetchImpl: fakeYoutube({ menuStatus: 403 }).fetchImpl, now }), { state: 'signed_in', account: null });
});

/* ── Las sesiones ────────────────────────────────────────────────────────── */

test('conectar guarda la sesión cifrada y nunca la devuelve', async () => {
  const store = createMemoryStore();
  const sessions = createYoutubeSessions({ key: KEY, store, now, check: signedIn() });
  assert.equal(sessions.ready, true);
  assert.deepEqual(await sessions.status('user-a'), { ready: true, connected: false });
  const connected = await sessions.connect('user-a', COOKIES_TXT);
  assert.deepEqual(connected, { ready: true, connected: true, status: 'active', account: { name: 'Canal de prueba', handle: '@prueba' },
    connectedAt: '2026-11-04T12:00:00.000Z', lastUsedAt: null, expiredAt: null });
  assert.ok(!JSON.stringify(connected).includes('sid-value'));
  const stored = store.objects.get('user-a');
  assert.ok(stored && !stored.includes('sid-value') && !stored.includes('google'));
  // Otra instancia (un reinicio) con la misma clave la encuentra igual.
  const again = createYoutubeSessions({ key: KEY, store, now, check: signedIn() });
  assert.equal((await again.status('user-a')).connected, true);
  const session = await again.sessionFor('user-a');
  assert.equal(session.state, 'active');
  assert.match(session.text, /^#HttpOnly_\.youtube\.com\tTRUE\t\/\tTRUE\t1893456000\tSID\tsid-value$/m);
  assert.doesNotMatch(session.text, /google|bank|expired-value/);
});

test('cada cuenta usa la suya: una sesión copiada a otra cuenta no se abre', async () => {
  const store = createMemoryStore();
  const sessions = createYoutubeSessions({ key: KEY, store, now, check: signedIn() });
  await sessions.connect('user-a', COOKIES_TXT);
  store.objects.set('user-b', store.objects.get('user-a'));
  assert.deepEqual(await sessions.status('user-b'), { ready: true, connected: false });
  assert.equal((await sessions.sessionFor('user-b')).state, 'missing');
});

test('explica por qué no se puede conectar un fichero', async () => {
  const store = createMemoryStore();
  const reject = code => error => error.code === code;
  const sessions = createYoutubeSessions({ key: KEY, store, now, check: signedIn() });
  await assert.rejects(sessions.connect('user-a', `.google.com\tTRUE\t/\tTRUE\t${FUTURE}\tSID\tx`), reject('youtube_cookies_missing'));
  await assert.rejects(sessions.connect('user-a', `.youtube.com\tTRUE\t/\tTRUE\t${FUTURE}\tPREF\tx`), reject('youtube_cookies_signed_out'));
  await assert.rejects(sessions.connect('user-a', 'no es un fichero de cookies'), reject('youtube_cookies_invalid'));
  const signedOut = createYoutubeSessions({ key: KEY, store, now, check: async () => ({ state: 'signed_out' }) });
  await assert.rejects(signedOut.connect('user-a', COOKIES_TXT), error => error.code === 'youtube_session_rejected' && error.status === 422);
  const offline = createYoutubeSessions({ key: KEY, store, now, check: async () => ({ state: 'unreachable' }) });
  await assert.rejects(offline.connect('user-a', COOKIES_TXT), error => error.code === 'youtube_check_failed' && error.status === 502);
  const disabled = createYoutubeSessions({ store, now });
  assert.equal(disabled.ready, false);
  await assert.rejects(disabled.connect('user-a', COOKIES_TXT), error => error.code === 'youtube_unavailable' && error.status === 503);
  assert.equal(store.objects.size, 0);
});

test('tras yt-dlp: guarda lo que renovó YouTube, o la da por caducada', async () => {
  let at = NOW;
  const clock = () => at;
  const store = createMemoryStore();
  const sessions = createYoutubeSessions({ key: KEY, store, now: clock, check: signedIn() });
  await sessions.connect('user-a', COOKIES_TXT);
  at += 60 * 1000;
  const rotated = (await sessions.sessionFor('user-a')).text.replace(/(\tYSC\t).*/, '$1renewed');
  assert.equal(await sessions.afterRun('user-a', { cookiesText: rotated, lines: ['[download] 100%'] }), 'active');
  assert.match((await sessions.sessionFor('user-a')).text, /\tYSC\trenewed$/m);
  assert.equal((await sessions.status('user-a')).lastUsedAt, '2026-11-04T12:01:00.000Z');
  // Un fichero sin sesión no sustituye a la buena.
  await sessions.afterRun('user-a', { cookiesText: '# vacío\n', lines: [] });
  assert.equal((await sessions.sessionFor('user-a')).state, 'active');
  at += 60 * 1000;
  const status = await sessions.afterRun('user-a', { lines: ['WARNING: [youtube] The provided YouTube account cookies are no longer valid.'], failed: true });
  assert.equal(status, 'expired');
  assert.deepEqual(await sessions.sessionFor('user-a'), { state: 'expired', text: null });
  assert.equal((await sessions.status('user-a')).expiredAt, '2026-11-04T12:02:00.000Z');
  await sessions.disconnect('user-a');
  assert.equal(store.objects.size, 0);
  assert.deepEqual(await sessions.status('user-a'), { ready: true, connected: false });
});
