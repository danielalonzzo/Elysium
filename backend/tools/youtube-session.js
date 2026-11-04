'use strict';

/**
 * La sesión de YouTube de cada cuenta Elysium.
 *
 * Desde las IP de Google Cloud, YouTube contesta «Sign in to confirm you're
 * not a bot», y lo que resuelve ese aviso es lo que pide: una sesión iniciada.
 * Google no ofrece a terceros un inicio de sesión que sirva para descargar (el
 * de OAuth dejó de funcionar con yt-dlp en 2024), así que la sesión llega como
 * la entiende yt-dlp: las cookies de youtube.com de un navegador con la sesión
 * iniciada, exportadas en un cookies.txt.
 *
 *   GET    /session  Si hay sesión, de qué cuenta y cuándo se usó.
 *   PUT    /session  { cookies }  Comprueba con YouTube que la sesión está
 *                    iniciada y la guarda.
 *   DELETE /session  La borra.
 *
 * Cuatro reglas que no se ven en las rutas:
 *
 * 1. **Solo se guardan las cookies de youtube.com.** El navegador ya filtra el
 *    fichero antes de subirlo y aquí se vuelve a filtrar: una exportación del
 *    navegador entero no deja nada más en el servidor.
 * 2. **Cifradas y atadas a su cuenta.** AES-256-GCM, y el uid como dato
 *    autenticado: un objeto copiado a otra cuenta no se descifra. La clave sale
 *    de `TOOLS_YOUTUBE_KEY` si existe y, si no, se deriva con HKDF del secreto
 *    de la pasarela que el servicio ya tiene montado (`deriveKey`): no hace
 *    falta otro secreto. Viven en un bucket propio que solo puede leer la
 *    cuenta de servicio de este servicio.
 * 3. **Nunca vuelven al navegador.** La API dice si hay sesión, de qué cuenta
 *    y cuándo se usó; las cookies solo salen hacia yt-dlp, en un fichero de la
 *    carpeta del trabajo que se borra al terminar.
 * 4. **Cada cuenta usa la suya.** Nadie descarga con la sesión de otra persona:
 *    la identidad es el token de Firebase (CRM) o el uid que comprobó el
 *    Worker (tools.elysiumdr.eu).
 */
const crypto = require('node:crypto');
const express = require('express');
const { ToolInputError } = require('./video');
const { log } = require('./workspace');

const USER_ID = /^[A-Za-z0-9_-]{1,128}$/;
const YOUTUBE_ORIGIN = 'https://www.youtube.com';
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
// Lo que se acepta subir, ya filtrado por el navegador: un cookies.txt de
// youtube.com ocupa unos pocos kB.
const MAX_UPLOAD_CHARS = 48 * 1024;
const MAX_COOKIES = 200;
const MAX_VALUE_LENGTH = 4096;
const CHECK_TIMEOUT_MS = 15 * 1000;
const CACHE_MS = 5 * 60 * 1000;
const SCHEMA = 1;

// Una sesión iniciada para yt-dlp: la familia SAPISID firma las peticiones
// (SAPISIDHASH) y SID o __Secure-*PSID son la sesión en sí.
const SIGNING_COOKIES = Object.freeze(['SAPISID', '__Secure-3PAPISID', '__Secure-1PAPISID']);
const SESSION_COOKIES = Object.freeze(['SID', '__Secure-1PSID', '__Secure-3PSID']);

// El aviso de yt-dlp cuando la sesión se cerró o el navegador la renovó.
const INVALID_SESSION = /cookies are no longer valid/i;

const COOKIE_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]{1,256}$/;
const CONTROL = /[\u0000-\u001f\u007f;]/;

/* ── Cookies ─────────────────────────────────────────────────────────────── */

function isYoutubeDomain(domain) {
  const host = String(domain || '').toLowerCase().replace(/^\./, '');
  return host === 'youtube.com' || host.endsWith('.youtube.com');
}

function cookie({ domain, path = '/', secure = true, httpOnly = false, expires = 0, name, value = '' }) {
  const host = String(domain || '').trim().toLowerCase();
  const text = String(value ?? '');
  if (!host || !COOKIE_NAME.test(String(name || '')) || CONTROL.test(text) || text.length > MAX_VALUE_LENGTH) return null;
  const seconds = Math.floor(Number(expires) || 0);
  return {
    domain: host,
    // En cookies.txt el segundo campo dice si vale para los subdominios, y
    // tiene que coincidir con el punto inicial: yt-dlp rechaza el fichero si no.
    includeSubdomains: host.startsWith('.'),
    path: String(path || '/').startsWith('/') && !CONTROL.test(String(path)) ? String(path) : '/',
    secure: secure !== false,
    httpOnly: httpOnly === true,
    expires: seconds > 0 ? seconds : 0,
    name: String(name),
    value: text
  };
}

/** Un cookies.txt (Netscape, el de yt-dlp) o la exportación JSON de las extensiones. */
function parseCookieFile(input) {
  const text = String(input ?? '').replace(/^﻿/, '').trim();
  if (!text) throw new ToolInputError('The file is empty.', 'youtube_cookies_invalid');
  if (/^[[{]/.test(text)) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ToolInputError('The file is not a valid cookie export.', 'youtube_cookies_invalid');
    }
    const list = Array.isArray(data) ? data : Array.isArray(data?.cookies) ? data.cookies : null;
    if (!list) throw new ToolInputError('The file is not a valid cookie export.', 'youtube_cookies_invalid');
    return list.map(entry => entry && typeof entry === 'object' ? cookie({
      // Una cookie sin `domain` explícito (hostOnly) solo vale para su host.
      domain: entry.hostOnly === true ? String(entry.domain || '').replace(/^\./, '') : `.${String(entry.domain || '').replace(/^\./, '')}`,
      path: entry.path,
      secure: entry.secure,
      httpOnly: entry.httpOnly,
      expires: entry.session === true ? 0 : entry.expirationDate ?? entry.expires,
      name: entry.name,
      value: entry.value
    }) : null).filter(Boolean);
  }
  const cookies = [];
  let lines = 0;
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim();
    if (!line) continue;
    // Las HttpOnly (SID, HSID, SSID…: las importantes) van con este prefijo;
    // un lector que lo tome por comentario pierde la sesión entera.
    const httpOnly = line.startsWith('#HttpOnly_');
    if (httpOnly) line = line.slice('#HttpOnly_'.length);
    else if (line.startsWith('#')) continue;
    lines += 1;
    const fields = line.split('\t');
    if (fields.length < 6) continue;
    const [domain, , path, secure, expires, name, ...value] = fields;
    const parsed = cookie({ domain, path, secure: secure.toUpperCase() === 'TRUE', httpOnly, expires, name, value: value.join('\t') });
    if (parsed) cookies.push(parsed);
  }
  if (lines && !cookies.length) throw new ToolInputError('The file is not in cookies.txt format.', 'youtube_cookies_invalid');
  return cookies;
}

/** Solo youtube.com, sin caducadas ni repetidas (gana la última). */
function youtubeCookies(cookies, now = Date.now) {
  const seconds = Math.floor(now() / 1000);
  const unique = new Map();
  for (const entry of cookies) {
    if (!entry || !isYoutubeDomain(entry.domain) || (entry.expires && entry.expires <= seconds)) continue;
    unique.set(`${entry.domain}\t${entry.path}\t${entry.name}`, entry);
  }
  return [...unique.values()].slice(0, MAX_COOKIES);
}

function hasSignedInSession(cookies) {
  const names = new Set(cookies.filter(entry => entry.value).map(entry => entry.name));
  return SIGNING_COOKIES.some(name => names.has(name)) && SESSION_COOKIES.some(name => names.has(name));
}

/** El cookies.txt que lee yt-dlp con `--cookies`. */
function toNetscape(cookies) {
  return [
    '# Netscape HTTP Cookie File',
    '# Elysium Tools: youtube.com',
    ...cookies.map(entry => [
      `${entry.httpOnly ? '#HttpOnly_' : ''}${entry.domain}`,
      entry.includeSubdomains ? 'TRUE' : 'FALSE',
      entry.path,
      entry.secure ? 'TRUE' : 'FALSE',
      String(entry.expires || 0),
      entry.name,
      entry.value
    ].join('\t')),
    ''
  ].join('\n');
}

function sameCookies(left, right) {
  const key = list => list.map(entry => `${entry.domain}\t${entry.path}\t${entry.name}\t${entry.value}`).sort().join('\n');
  return key(left) === key(right);
}

/* ── Cifrado ─────────────────────────────────────────────────────────────── */

/**
 * La clave de las sesiones a partir de otro secreto del servicio (el de la
 * pasarela, 48 bytes al azar), con HKDF y una etiqueta propia: otra clave,
 * independiente de la original, sin tener que guardar una más. Si ese secreto
 * cambia, las sesiones guardadas dejan de abrirse y cada cuenta conecta la suya.
 */
function deriveKey(secret) {
  const material = String(secret || '');
  if (material.length < 32) return null;
  return Buffer.from(crypto.hkdfSync('sha256', Buffer.from(material, 'utf8'), Buffer.from('elysium-tools', 'utf8'),
    Buffer.from('youtube-sessions/v1', 'utf8'), 32)).toString('base64');
}

/** 32 bytes en base64, o nada: sin clave, la sesión de YouTube no se ofrece. */
function parseKey(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  const key = Buffer.from(text, 'base64');
  return key.length === 32 ? key : null;
}

const additionalData = uid => Buffer.from(`elysium-tools/youtube/${uid}`, 'utf8');

function sealSession(key, uid, value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(additionalData(uid));
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return JSON.stringify({ v: SCHEMA, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') });
}

function openSession(key, uid, text) {
  const sealed = JSON.parse(text);
  if (sealed?.v !== SCHEMA) throw new Error('Unknown session format.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(sealed.iv, 'base64'));
  decipher.setAAD(additionalData(uid));
  decipher.setAuthTag(Buffer.from(sealed.tag, 'base64'));
  const plain = Buffer.concat([decipher.update(Buffer.from(sealed.data, 'base64')), decipher.final()]);
  return JSON.parse(plain.toString('utf8'));
}

/* ── Comprobación con YouTube ────────────────────────────────────────────── */

function cookieHeader(cookies, host) {
  return cookies
    .filter(entry => {
      const domain = entry.domain.replace(/^\./, '');
      return entry.includeSubdomains ? host === domain || host.endsWith(`.${domain}`) : host === entry.domain;
    })
    .map(entry => `${entry.name}=${entry.value}`)
    .join('; ');
}

/** La firma con la que la web de YouTube se identifica ante su propia API. */
function sapisidAuthorization(cookies, now = Date.now) {
  const value = name => cookies.find(entry => entry.name === name && entry.value)?.value || null;
  const seconds = Math.round(now() / 1000);
  const hash = sid => `${seconds}_${crypto.createHash('sha1').update(`${seconds} ${sid} ${YOUTUBE_ORIGIN}`).digest('hex')}`;
  const parts = [];
  const main = value('SAPISID') || value('__Secure-3PAPISID');
  if (main) parts.push(`SAPISIDHASH ${hash(main)}`);
  if (value('__Secure-1PAPISID')) parts.push(`SAPISID1PHASH ${hash(value('__Secure-1PAPISID'))}`);
  if (value('__Secure-3PAPISID')) parts.push(`SAPISID3PHASH ${hash(value('__Secure-3PAPISID'))}`);
  return parts.join(' ') || null;
}

function findRenderer(value, key, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 24) return null;
  if (Object.hasOwn(value, key)) return value[key];
  for (const child of Object.values(value)) {
    const found = findRenderer(child, key, depth + 1);
    if (found) return found;
  }
  return null;
}

function plainText(value) {
  const text = value?.simpleText ?? (Array.isArray(value?.runs) ? value.runs.map(run => run?.text || '').join('') : '');
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 120) || null;
}

/** Nombre y @ de la cuenta, del menú de cuenta de la web. Si falla, sin nombre. */
async function accountName(html, cookies, { fetchImpl, now }) {
  const config = key => html.match(new RegExp(`"${key}"\\s*:\\s*"([^"]{1,200})"`))?.[1] || null;
  const clientVersion = config('INNERTUBE_CLIENT_VERSION');
  const authorization = sapisidAuthorization(cookies, now);
  if (!clientVersion || !authorization) return null;
  const headers = {
    Cookie: cookieHeader(cookies, 'www.youtube.com'),
    Authorization: authorization,
    'Content-Type': 'application/json',
    Origin: YOUTUBE_ORIGIN,
    'X-Origin': YOUTUBE_ORIGIN,
    'X-Goog-AuthUser': html.match(/"SESSION_INDEX"\s*:\s*"?(\d{1,3})/)?.[1] || '0',
    'X-Youtube-Client-Name': '1',
    'X-Youtube-Client-Version': clientVersion,
    'User-Agent': BROWSER_USER_AGENT
  };
  const visitor = config('VISITOR_DATA');
  if (visitor) headers['X-Goog-Visitor-Id'] = visitor;
  // Una cuenta de marca (un canal con nombre propio) va por su página.
  const delegated = config('DELEGATED_SESSION_ID');
  if (delegated) headers['X-Goog-PageId'] = delegated;
  try {
    const response = await fetchImpl(`${YOUTUBE_ORIGIN}/youtubei/v1/account/account_menu?prettyPrint=false`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion, hl: 'en' } } }),
      redirect: 'manual',
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS)
    });
    if (!response.ok) return null;
    const header = findRenderer(await response.json(), 'activeAccountHeaderRenderer');
    const name = plainText(header?.accountName);
    const handle = plainText(header?.channelHandle);
    return name || handle ? { name, handle } : null;
  } catch {
    return null;
  }
}

/**
 * ¿YouTube reconoce la sesión? Lo dice la propia portada: `LOGGED_IN` en su
 * configuración, lo mismo que mira yt-dlp para avisar de una sesión caducada.
 * Sin cookie de consentimiento, YouTube manda a las IP europeas a la página de
 * cookies: se añade `SOCS=CAI` solo para esta petición, como hace yt-dlp.
 */
async function checkYoutubeSession(cookies, { fetchImpl = globalThis.fetch, now = Date.now } = {}) {
  const consent = cookies.some(entry => ['SOCS', 'CONSENT'].includes(entry.name));
  const jar = consent ? cookies : [...cookies, cookie({ domain: '.youtube.com', name: 'SOCS', value: 'CAI' })];
  let response;
  try {
    response = await fetchImpl(`${YOUTUBE_ORIGIN}/?hl=en`, {
      headers: {
        Cookie: cookieHeader(jar, 'www.youtube.com'),
        'User-Agent': BROWSER_USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml'
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS)
    });
  } catch {
    return { state: 'unreachable' };
  }
  if (response.status >= 300 && response.status < 400) return { state: 'signed_out' };
  if (!response.ok) return { state: 'unreachable' };
  const html = await response.text();
  if (!/"LOGGED_IN"\s*:\s*true/.test(html)) return { state: 'signed_out' };
  return { state: 'signed_in', account: await accountName(html, jar, { fetchImpl, now }) };
}

/* ── Dónde se guardan ────────────────────────────────────────────────────── */

/** Un objeto por cuenta en el bucket de Cloud Storage (`TOOLS_YOUTUBE_BUCKET`). */
function createBucketStore(bucket) {
  const file = uid => bucket.file(`youtube/${uid}.json`);
  return {
    async read(uid) {
      try {
        const [data] = await file(uid).download();
        return data.toString('utf8');
      } catch (error) {
        if (Number(error?.code) === 404) return null;
        throw error;
      }
    },
    async write(uid, text) {
      await file(uid).save(text, { resumable: false, contentType: 'application/json', metadata: { cacheControl: 'no-store' } });
    },
    async remove(uid) {
      await file(uid).delete({ ignoreNotFound: true });
    }
  };
}

function createMemoryStore() {
  const objects = new Map();
  return {
    objects,
    read: async uid => objects.get(uid) ?? null,
    write: async (uid, text) => { objects.set(uid, text); },
    remove: async uid => { objects.delete(uid); }
  };
}

/* ── Las sesiones ────────────────────────────────────────────────────────── */

function createYoutubeSessions({ key, store, fetchImpl = globalThis.fetch, now = Date.now, check = checkYoutubeSession } = {}) {
  const secret = parseKey(key);
  const ready = Boolean(secret && store);
  const cache = new Map();
  const iso = () => new Date(now()).toISOString();

  async function load(uid) {
    if (!ready || !USER_ID.test(String(uid || ''))) return null;
    const hit = cache.get(uid);
    if (hit && now() - hit.at < CACHE_MS) return hit.value;
    const text = await store.read(uid);
    let value = null;
    if (text) {
      try {
        value = openSession(secret, uid, text);
      } catch {
        // Otra clave u otro dueño: para esta cuenta es como si no hubiera sesión.
        log('WARNING', 'youtube.session_unreadable');
      }
    }
    cache.set(uid, { at: now(), value });
    return value;
  }

  async function save(uid, value) {
    await store.write(uid, sealSession(secret, uid, value));
    cache.set(uid, { at: now(), value });
  }

  function summary(value) {
    if (!value) return { ready, connected: false };
    return {
      ready,
      connected: true,
      status: value.status,
      account: value.account || null,
      connectedAt: value.connectedAt || null,
      lastUsedAt: value.lastUsedAt || null,
      expiredAt: value.expiredAt || null
    };
  }

  async function connect(uid, text) {
    if (!ready) throw new ToolInputError('YouTube sessions are not available.', 'youtube_unavailable', 503);
    if (!USER_ID.test(String(uid || ''))) throw new ToolInputError('Authentication required.', 'unauthenticated', 401);
    const cookies = youtubeCookies(parseCookieFile(text), now);
    if (!cookies.length) throw new ToolInputError('The file has no youtube.com cookies.', 'youtube_cookies_missing');
    if (!hasSignedInSession(cookies)) throw new ToolInputError('The file has no signed-in YouTube session.', 'youtube_cookies_signed_out');
    const result = await check(cookies, { fetchImpl, now });
    if (result.state === 'unreachable') throw new ToolInputError('YouTube could not be reached.', 'youtube_check_failed', 502);
    if (result.state !== 'signed_in') throw new ToolInputError('YouTube does not recognize this session.', 'youtube_session_rejected', 422);
    const at = iso();
    const value = { cookies, account: result.account || null, status: 'active', connectedAt: at, updatedAt: at, lastUsedAt: null, expiredAt: null };
    await save(uid, value);
    log('INFO', 'youtube.connected', { cookies: cookies.length, named: Boolean(result.account) });
    return summary(value);
  }

  async function disconnect(uid) {
    if (!ready || !USER_ID.test(String(uid || ''))) return;
    await store.remove(uid);
    cache.delete(uid);
    log('INFO', 'youtube.disconnected');
  }

  /** `active` con el cookies.txt para yt-dlp, `expired` o `missing`. */
  async function sessionFor(uid) {
    const value = await load(uid);
    if (!value) return { state: 'missing', text: null };
    if (value.status !== 'active') return { state: 'expired', text: null };
    return { state: 'active', text: toNetscape(value.cookies) };
  }

  /**
   * Tras cada ejecución de yt-dlp con la sesión: si avisó de que ya no vale, se
   * marca caducada; si no, se guarda lo que yt-dlp reescribió en el fichero
   * (YouTube renueva algunas cookies) y la hora de uso.
   */
  async function afterRun(uid, { cookiesText = null, lines = [], failed = false } = {}) {
    const value = await load(uid);
    if (!value || value.status !== 'active') return value?.status || 'missing';
    const at = iso();
    if (lines.some(line => INVALID_SESSION.test(String(line)))) {
      Object.assign(value, { status: 'expired', expiredAt: at, updatedAt: at });
      await save(uid, value);
      log('WARNING', 'youtube.session_expired');
      return 'expired';
    }
    let changed = false;
    if (cookiesText) {
      try {
        const rotated = youtubeCookies(parseCookieFile(cookiesText), now);
        if (hasSignedInSession(rotated) && !sameCookies(rotated, value.cookies)) {
          value.cookies = rotated;
          changed = true;
        }
      } catch {
        // Un fichero que yt-dlp dejó a medias no sustituye a la sesión buena.
      }
    }
    if (!failed) value.lastUsedAt = at;
    if (changed || !failed) {
      value.updatedAt = at;
      await save(uid, value);
    }
    return 'active';
  }

  return { get ready() { return ready; }, status: async uid => summary(await load(uid)), connect, disconnect, sessionFor, afterRun };
}

/* ── Rutas ───────────────────────────────────────────────────────────────── */

function sendError(response, error) {
  if (error instanceof ToolInputError) return response.status(error.status).json({ error: error.message, code: error.code });
  log('ERROR', 'youtube.unexpected', { error: String(error?.stack || error) });
  return response.status(500).json({ error: 'Unexpected error.', code: 'failed' });
}

/** `identify(request)` da el uid de quien llama: lo decide quien monta el router. */
function createYoutubeRouter({ sessions, identify }) {
  const router = express.Router();
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    const uid = identify(request);
    if (!USER_ID.test(String(uid || ''))) return response.status(401).json({ error: 'Authentication required.', code: 'unauthenticated' });
    request.youtubeUser = uid;
    return next();
  });

  router.get('/session', async (request, response) => {
    try {
      return response.json(await sessions.status(request.youtubeUser));
    } catch (error) {
      return sendError(response, error);
    }
  });

  router.put('/session', async (request, response) => {
    const text = request.body?.cookies;
    if (typeof text !== 'string' || !text.trim()) {
      return response.status(400).json({ error: 'Attach the cookies.txt file.', code: 'youtube_cookies_invalid' });
    }
    if (text.length > MAX_UPLOAD_CHARS) {
      return response.status(413).json({ error: 'The file is too large.', code: 'youtube_cookies_too_large' });
    }
    try {
      return response.json(await sessions.connect(request.youtubeUser, text));
    } catch (error) {
      return sendError(response, error);
    }
  });

  router.delete('/session', async (request, response) => {
    try {
      await sessions.disconnect(request.youtubeUser);
      return response.json({ ready: sessions.ready, connected: false });
    } catch (error) {
      return sendError(response, error);
    }
  });

  return router;
}

module.exports = {
  INVALID_SESSION,
  MAX_UPLOAD_CHARS,
  USER_ID,
  checkYoutubeSession,
  createBucketStore,
  createMemoryStore,
  createYoutubeRouter,
  createYoutubeSessions,
  deriveKey,
  hasSignedInSession,
  isYoutubeDomain,
  openSession,
  parseCookieFile,
  parseKey,
  sapisidAuthorization,
  sealSession,
  toNetscape,
  youtubeCookies
};
