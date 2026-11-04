'use strict';

/**
 * Rutas del descargador de videos (`/api/tools/video/*`).
 *
 *   POST /inspect   Analiza el enlace con yt-dlp y devuelve título, miniatura y
 *                   las calidades que se pueden pedir.
 *   POST /download  Descarga, y mientras tanto cuenta el progreso: una línea
 *                   JSON por evento (NDJSON) hasta `ready`, que trae la URL
 *                   del fichero en `/api/tools/files/:token`, o `error`.
 *
 * Las carpetas, las colas y la entrega del fichero las pone `workspace.js`,
 * que también explica por qué la descarga entera ocurre dentro de la petición.
 */
const dns = require('node:dns/promises');
const net = require('node:net');
const fs = require('node:fs/promises');
const path = require('node:path');
const express = require('express');
const {
  ProgressTracker,
  ToolInputError,
  buildDownloadArguments,
  buildInspectArguments,
  classifyFailure,
  failureMessage,
  isBlockedHostname,
  isPrivateAddress,
  mimeForFile,
  normalizeVideoUrl,
  parseMarkedLine,
  parseOptionId,
  parsePlaylistItem,
  pickThumbnailUrl,
  platformFor,
  postprocessStage,
  summarizeMedia
} = require('./video');
const { ONE_MB, createLimiter, log, openEventStream, runProcess } = require('./workspace');
const { INVALID_SESSION } = require('./youtube-session');

// Lo que YouTube contesta a un servidor sin sesión: se arregla conectando la
// cuenta de YouTube de quien descarga (youtube-session.js).
const YOUTUBE_SIGN_IN_FAILURES = new Set(['bot_check', 'login_required', 'age_restricted']);

const THUMBNAIL_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

const DEFAULT_SETTINGS = Object.freeze({
  command: 'yt-dlp',
  commandArgs: [],
  ffmpeg: 'ffmpeg',
  jsRuntimes: '',
  cookiesFile: '',
  proxy: '',
  maxBytes: 1000 * ONE_MB,
  maxActiveDownloads: 2,
  maxActiveInspections: 3,
  inspectTimeoutMs: 75 * 1000,
  downloadTimeoutMs: 25 * 60 * 1000,
  heartbeatMs: 15 * 1000,
  progressIntervalMs: 250,
  thumbnailMaxBytes: 1.5 * 1024 * 1024,
  maxInspectOutputBytes: 48 * 1024 * 1024
});

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

/** La configuración que se lee del entorno de Cloud Run (ver README.md). */
function settingsFromEnv(environment = process.env) {
  const settings = {};
  if (environment.YTDLP_BIN) settings.command = environment.YTDLP_BIN;
  if (environment.FFMPEG_BIN) settings.ffmpeg = environment.FFMPEG_BIN;
  if (environment.YTDLP_JS_RUNTIMES) settings.jsRuntimes = environment.YTDLP_JS_RUNTIMES;
  if (environment.YTDLP_COOKIES_FILE) settings.cookiesFile = environment.YTDLP_COOKIES_FILE;
  if (environment.YTDLP_PROXY) settings.proxy = environment.YTDLP_PROXY;
  if (environment.TOOLS_WORK_DIR) settings.workRoot = environment.TOOLS_WORK_DIR;
  const maxMb = positiveNumber(environment.TOOLS_MAX_FILE_MB);
  if (maxMb) settings.maxBytes = Math.round(maxMb * ONE_MB);
  const budgetMb = positiveNumber(environment.TOOLS_STORAGE_BUDGET_MB);
  if (budgetMb) settings.storageBudgetBytes = Math.round(budgetMb * ONE_MB);
  const active = positiveNumber(environment.TOOLS_MAX_ACTIVE_DOWNLOADS);
  if (active) settings.maxActiveDownloads = Math.floor(active);
  return settings;
}

function sendFailure(response, error) {
  if (error instanceof ToolInputError) {
    return response.status(error.status).json({ error: error.message, code: error.code });
  }
  log('ERROR', 'tools.unexpected', { error: String(error?.stack || error) });
  return response.status(500).json({ error: failureMessage('failed'), code: 'failed' });
}

/**
 * `youtube` son las sesiones de YouTube de cada cuenta (youtube-session.js) e
 * `identify(request)`, de quién es la petición: en el CRM, el uid del token;
 * en la vía pública, el que comprobó el Worker.
 */
function createVideoTools({
  requireAdmin,
  workspace,
  settings: overrides = {},
  lookup = dns.lookup,
  fetchImpl = globalThis.fetch,
  now = Date.now,
  youtube = null,
  identify = request => request.firebaseUser?.uid || null
} = {}) {
  if (typeof requireAdmin !== 'function') throw new TypeError('createVideoTools needs requireAdmin.');
  if (!workspace) throw new TypeError('createVideoTools needs a workspace.');
  const settings = { ...DEFAULT_SETTINGS, ...overrides };
  const router = express.Router();
  const downloads = createLimiter(settings.maxActiveDownloads);
  const inspections = createLimiter(settings.maxActiveInspections);
  const shutdown = new AbortController();

  /**
   * Las cookies de esta ejecución. Para YouTube, las de la sesión de quien
   * descarga; si no tiene, las del servicio (`YTDLP_COOKIES_FILE`, solo CRM).
   * Siempre una copia en la carpeta del trabajo: yt-dlp reescribe el fichero
   * al terminar y el secreto montado en Cloud Run es de solo lectura.
   */
  async function prepareCookies(dir, platform, request) {
    const uid = identify(request);
    let state = 'missing';
    if (platform.id === 'youtube' && youtube?.ready && uid) {
      try {
        const session = await youtube.sessionFor(uid);
        state = session.state;
        if (session.text) {
          const target = path.join(dir, 'cookies.txt');
          await fs.writeFile(target, session.text, { mode: 0o600 });
          return { path: target, uid, state, personal: true };
        }
      } catch (error) {
        log('WARNING', 'youtube.session_unavailable', { error: error.code || String(error) });
      }
    }
    if (!settings.cookiesFile) return { path: null, uid, state, personal: false };
    const target = path.join(dir, 'cookies.txt');
    try {
      await fs.copyFile(settings.cookiesFile, target);
      return { path: target, uid, state, personal: false };
    } catch (error) {
      log('WARNING', 'video.cookies_unavailable', { error: error.code || String(error) });
      return { path: null, uid, state, personal: false };
    }
  }

  /**
   * Tras yt-dlp: la sesión personal se actualiza (o se da por caducada) y el
   * fichero se borra ya, aunque la carpeta espere a que se recoja el video.
   */
  async function settleCookies(cookies, result, failed) {
    if (!cookies?.path || cookies.settled) return;
    cookies.settled = true;
    if (cookies.personal) {
      const cookiesText = await fs.readFile(cookies.path, 'utf8').catch(() => null);
      await youtube.afterRun(cookies.uid, { cookiesText, lines: result?.lines || [], failed }).catch(error => {
        log('WARNING', 'youtube.session_not_saved', { error: error.code || String(error) });
      });
    }
    await fs.rm(cookies.path, { force: true }).catch(() => {});
  }

  /** Un fallo de YouTube que se arregla con la sesión lo dice con su propio código. */
  function youtubeFailure(failure, platform, cookies, lines = []) {
    if (platform.id !== 'youtube' || !youtube?.ready) return failure;
    if (cookies.personal && lines.some(line => INVALID_SESSION.test(String(line)))) {
      return { ...failure, code: 'youtube_session_expired' };
    }
    if (!cookies.personal && YOUTUBE_SIGN_IN_FAILURES.has(failure.code)) {
      return { ...failure, code: cookies.state === 'expired' ? 'youtube_session_expired' : 'youtube_session_required' };
    }
    return failure;
  }

  /**
   * `normalizeVideoUrl` ya rechaza las IP privadas escritas a mano; esto cubre
   * los nombres que apuntan a una (`127.0.0.1.nip.io`, el servidor de
   * metadatos). Una redirección posterior no se puede vigilar desde aquí: por
   * eso además el servicio solo atiende a administradores.
   */
  async function assertPublicHost(url) {
    const host = new URL(url).hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(host)) return;
    let addresses;
    try {
      addresses = await lookup(host, { all: true, verbatim: true });
    } catch {
      throw new ToolInputError('That site could not be found.', 'host_not_found', 422);
    }
    if (!addresses?.length || addresses.some(entry => isPrivateAddress(entry.address))) {
      throw new ToolInputError('Links to private or local addresses are not allowed.', 'url_private');
    }
  }

  /**
   * La miniatura viaja dentro de la respuesta como `data:`. Instagram y TikTok
   * no dejan incrustar sus imágenes en otro origen, y así el navegador del CRM
   * tampoco llama a sus servidores.
   */
  async function thumbnailDataUri(candidate) {
    let url;
    try {
      url = new URL(String(candidate || ''));
    } catch {
      return null;
    }
    if (url.protocol !== 'https:' || isBlockedHostname(url.hostname)) return null;
    try {
      const response = await fetchImpl(url, {
        headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8', 'User-Agent': BROWSER_USER_AGENT },
        redirect: 'follow',
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) return null;
      let type = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      if (type === 'image/jpg') type = 'image/jpeg';
      if (!THUMBNAIL_TYPES.has(type)) return null;
      if (Number(response.headers.get('content-length') || 0) > settings.thumbnailMaxBytes) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length || buffer.length > settings.thumbnailMaxBytes) return null;
      return `data:${type};base64,${buffer.toString('base64')}`;
    } catch {
      return null;
    }
  }

  // Se pregunta dentro de una petición, nunca al arrancar: fuera de una
  // petición Cloud Run apenas da CPU, y yt-dlp (Python) tardaba más de 20 s
  // en contestar `--version`. Un fallo no se recuerda; un acierto, sí.
  let probe = null;
  let engineLogged = false;
  function versions() {
    probe ??= (async () => {
      const [ytDlp, ffmpeg] = await Promise.all([
        runProcess(settings.command, [...settings.commandArgs, '--version'], { collectStdout: true, timeoutMs: 20000 }),
        runProcess(settings.ffmpeg, ['-hide_banner', '-version'], { collectStdout: true, timeoutMs: 20000 })
      ]);
      const found = {
        ytDlp: ytDlp.code === 0 ? ytDlp.stdout.trim().split('\n')[0] || null : null,
        ffmpeg: ffmpeg.code === 0 ? ffmpeg.stdout.match(/version\s+(\S+)/)?.[1] || 'unknown' : null
      };
      if (!found.ytDlp || !found.ffmpeg) probe = null;
      return found;
    })();
    return probe;
  }

  async function capabilities() {
    const found = await versions();
    // Qué motor trae la instancia: lo primero que mirar en Cloud Logging
    // cuando una plataforma deja de funcionar.
    if (!engineLogged) {
      engineLogged = Boolean(found.ytDlp && found.ffmpeg);
      log(engineLogged ? 'INFO' : 'ERROR', 'tools.engine', found);
    }
    return {
      ready: Boolean(found.ytDlp && found.ffmpeg),
      ytDlp: found.ytDlp,
      ffmpeg: found.ffmpeg,
      maxBytes: settings.maxBytes,
      cookies: Boolean(settings.cookiesFile),
      proxy: Boolean(settings.proxy),
      // Si se puede conectar una cuenta de YouTube (clave y bucket configurados).
      youtubeSessions: Boolean(youtube?.ready)
    };
  }

  router.post('/inspect', requireAdmin, async (request, response) => {
    response.set('Cache-Control', 'no-store');
    let url;
    try {
      url = normalizeVideoUrl(request.body?.url);
      await assertPublicHost(url);
    } catch (error) {
      return sendFailure(response, error);
    }

    const client = new AbortController();
    response.on('close', () => {
      if (!response.writableFinished) client.abort();
    });
    const signal = AbortSignal.any([client.signal, shutdown.signal]);
    const platform = platformFor(url);
    const started = now();
    let release = null;
    let dir = null;
    let cookies = null;
    let result = null;
    try {
      release = await inspections.acquire({ signal });
      dir = await workspace.createWorkDir();
      cookies = await prepareCookies(dir, platform, request);
      result = await runProcess(
        settings.command,
        [...settings.commandArgs, ...buildInspectArguments(url, settings, cookies.path)],
        { signal, timeoutMs: settings.inspectTimeoutMs, collectStdout: true, maxStdoutBytes: settings.maxInspectOutputBytes }
      );
      // Antes de contestar: quien pregunte por la sesión justo después ya ve
      // si quedó caducada.
      await settleCookies(cookies, result, result.code !== 0 || result.timedOut || result.overflow);
      if (client.signal.aborted) return undefined;
      if (result.error) {
        log('ERROR', 'video.engine_missing', { error: String(result.error.message || result.error) });
        return response.status(503).json({ error: 'The download engine is not available.', code: 'engine_unavailable' });
      }
      if (result.timedOut) {
        return response.status(504).json({ error: failureMessage('timeout'), code: 'timeout', platform: platform.name });
      }
      if (result.code !== 0 || result.overflow) {
        const failure = result.overflow ? { code: 'failed', detail: null }
          : youtubeFailure(classifyFailure(result.lines), platform, cookies, result.lines);
        log('WARNING', 'video.inspect_failed', { platform: platform.id, code: failure.code, ms: now() - started });
        return response.status(422).json({
          error: failureMessage(failure.code),
          code: failure.code,
          detail: failure.detail,
          platform: platform.name
        });
      }

      let info = null;
      try {
        info = JSON.parse(result.stdout);
      } catch {
        info = null;
      }
      if (!info || typeof info !== 'object') {
        return response.status(422).json({ error: failureMessage('no_media'), code: 'no_media', platform: platform.name });
      }
      const media = summarizeMedia(info, url);
      const failure = media.kind === 'video'
        ? (media.isLive ? 'live' : (!media.options.length ? 'no_media' : null))
        : (!media.entries.length ? 'no_media' : null);
      if (failure) {
        return response.status(422).json({ error: failureMessage(failure), code: failure, platform: media.platform.name });
      }
      media.thumbnail = await thumbnailDataUri(pickThumbnailUrl(info));
      log('INFO', 'video.inspected', { platform: media.platform.id, kind: media.kind, ms: now() - started });
      return response.json(media);
    } catch (error) {
      if (client.signal.aborted) return undefined;
      return sendFailure(response, error);
    } finally {
      release?.();
      await settleCookies(cookies, result, true);
      await workspace.removeDir(dir);
    }
  });

  router.post('/download', requireAdmin, async (request, response) => {
    let url;
    let option;
    let item;
    try {
      url = normalizeVideoUrl(request.body?.url);
      option = parseOptionId(request.body?.option);
      item = parsePlaylistItem(request.body?.item);
      await assertPublicHost(url);
    } catch (error) {
      return sendFailure(response, error);
    }

    const stream = openEventStream(response, { heartbeatMs: settings.heartbeatMs });
    const { send } = stream;
    const engine = new AbortController();
    const signal = AbortSignal.any([stream.clientSignal, shutdown.signal]);
    signal.addEventListener('abort', () => engine.abort(), { once: true });

    const platform = platformFor(url);
    const started = now();
    let release = null;
    let dir = null;
    let kept = false;
    let tooLarge = false;
    let cookies = null;
    let result = null;
    try {
      send({ type: 'accepted', platform: platform.name });
      release = await downloads.acquire({ signal, onPosition: position => send({ type: 'queued', position }) });
      send({ type: 'stage', stage: 'starting' });
      dir = await workspace.createWorkDir();
      cookies = await prepareCookies(dir, platform, request);
      const tracker = new ProgressTracker();
      let lastSentAt = 0;
      let lastPart = 0;

      result = await runProcess(
        settings.command,
        [...settings.commandArgs, ...buildDownloadArguments({ url, option, item, outputDir: dir, settings, cookiesPath: cookies.path })],
        {
          signal: engine.signal,
          timeoutMs: settings.downloadTimeoutMs,
          onLine(line) {
            const marked = parseMarkedLine(line);
            if (!marked) return;
            if (marked.kind === 'selected') {
              tracker.select(marked.value);
            } else if (marked.kind === 'progress') {
              const snapshot = tracker.update(marked.value);
              // `--max-filesize` no puede frenar lo que no anuncia su tamaño
              // (HLS, directos convertidos): se vigila aquí también.
              if (snapshot.downloaded > settings.maxBytes) {
                tooLarge = true;
                engine.abort();
                return;
              }
              const at = now();
              const finished = marked.value?.p?.status === 'finished';
              if (finished || snapshot.part !== lastPart || at - lastSentAt >= settings.progressIntervalMs) {
                lastPart = snapshot.part;
                lastSentAt = at;
                send(snapshot);
              }
            } else if (marked.kind === 'post') {
              const stage = postprocessStage(marked.value);
              if (stage) send({ type: 'stage', stage });
            } else if (marked.kind === 'file') {
              tracker.filePath = String(marked.value || '');
            }
          }
        }
      );

      if (stream.clientSignal.aborted || shutdown.signal.aborted) return undefined;
      if (result.error) {
        log('ERROR', 'video.engine_missing', { error: String(result.error.message || result.error) });
        send({ type: 'error', code: 'engine_unavailable', error: 'The download engine is not available.' });
        return undefined;
      }
      const file = result.code === 0 && !tooLarge ? await workspace.finishedFile(dir, tracker.filePath) : null;
      await settleCookies(cookies, result, !file || file.size > settings.maxBytes);
      if (!file || file.size > settings.maxBytes) {
        const failure = tooLarge || file ? { code: 'too_large', detail: null }
          : result.timedOut ? { code: 'timeout', detail: null }
            : youtubeFailure(classifyFailure(result.lines), platform, cookies, result.lines);
        log('WARNING', 'video.download_failed', { platform: platform.id, option, code: failure.code, ms: now() - started });
        send({ type: 'error', code: failure.code, error: failureMessage(failure.code), detail: failure.detail, platform: platform.name });
        return undefined;
      }

      const ready = await workspace.register(file, dir, mimeForFile(file.name));
      kept = true;
      log('INFO', 'video.downloaded', { platform: platform.id, option, bytes: file.size, ms: now() - started });
      send({ type: 'ready', ...ready });
      return undefined;
    } catch (error) {
      if (stream.clientSignal.aborted || shutdown.signal.aborted) return undefined;
      log('ERROR', 'video.download_crashed', { platform: platform.id, error: String(error?.stack || error) });
      send({ type: 'error', code: 'failed', error: failureMessage('failed') });
      return undefined;
    } finally {
      release?.();
      await settleCookies(cookies, result, true);
      if (!kept) await workspace.removeDir(dir);
      stream.end();
    }
  });

  async function close() {
    shutdown.abort();
  }

  return {
    router,
    settings,
    capabilities,
    close,
    downloads
  };
}

module.exports = {
  DEFAULT_SETTINGS,
  createVideoTools,
  settingsFromEnv
};
