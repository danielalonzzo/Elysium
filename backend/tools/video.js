'use strict';

/**
 * Descargador de vídeos — todo lo que no toca la red ni el disco.
 *
 * Qué se le pide a yt-dlp, cómo se lee lo que contesta y qué se le cuenta al
 * CRM se decide aquí, en funciones puras, para poder probarlo sin descargar
 * nada. `video-routes.js` solo encadena procesos, ficheros y respuestas.
 *
 * Dos reglas que no se ven leyendo las rutas:
 *
 * 1. **El navegador nunca escribe argumentos de yt-dlp.** Elige una opción por
 *    su identificador (`v1080`, `audio-mp3`…) y aquí se traduce a formatos.
 *    El enlace va siempre detrás de `--`, así que no puede colarse como opción.
 * 2. **La salida que se interpreta va marcada.** Las plantillas de progreso y
 *    los `--print` empiezan por `@@ELYSIUM:`; cualquier otra línea de yt-dlp se
 *    ignora salvo los `ERROR:`, que deciden el código de fallo.
 */
const net = require('node:net');

const MAX_URL_LENGTH = 2048;
const MAX_PLAYLIST_ENTRIES = 50;
const MAX_PLAYLIST_ITEM = 1000;
// El MP3 sale con --audio-quality 0 (VBR V0), unos 245 kb/s de media.
const MP3_BYTES_PER_SECOND = 245000 / 8;

const MARK = Object.freeze({
  progress: '@@ELYSIUM:P ',
  post: '@@ELYSIUM:PP ',
  selected: '@@ELYSIUM:SEL ',
  file: '@@ELYSIUM:FILE '
});

const PLATFORMS = Object.freeze([
  ['youtube', 'YouTube', ['youtube.com', 'youtu.be', 'youtube-nocookie.com']],
  ['tiktok', 'TikTok', ['tiktok.com']],
  ['instagram', 'Instagram', ['instagram.com']],
  ['facebook', 'Facebook', ['facebook.com', 'fb.watch', 'fb.com']],
  ['x', 'X', ['x.com', 'twitter.com']],
  ['vimeo', 'Vimeo', ['vimeo.com']],
  ['reddit', 'Reddit', ['reddit.com', 'redd.it']],
  ['linkedin', 'LinkedIn', ['linkedin.com']],
  ['threads', 'Threads', ['threads.net', 'threads.com']],
  ['pinterest', 'Pinterest', ['pinterest.com', 'pin.it']],
  ['twitch', 'Twitch', ['twitch.tv']],
  ['dailymotion', 'Dailymotion', ['dailymotion.com', 'dai.ly']],
  ['soundcloud', 'SoundCloud', ['soundcloud.com']],
  ['snapchat', 'Snapchat', ['snapchat.com']]
]);

// Nombres que nunca son un sitio público. Las IP literales se comprueban
// aparte, y `video-routes.js` además resuelve el nombre antes de lanzar nada.
const BLOCKED_HOST_SUFFIXES = Object.freeze(['.localhost', '.local', '.internal', '.home.arpa', '.lan']);

class ToolInputError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.name = 'ToolInputError';
    this.code = code;
    this.status = status;
  }
}

/* ── Enlaces ─────────────────────────────────────────────────────────────── */

/** ¿Una IP que no sale a Internet (privada, local, de enlace, multidifusión…)? */
function isPrivateAddress(address) {
  const ip = String(address || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 168 || b === 0))
      || (a === 198 && (b === 18 || b === 19));
  }
  if (net.isIPv6(ip)) {
    if (ip === '::' || ip === '::1') return true;
    const dotted = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (dotted) return isPrivateAddress(dotted[1]);
    const hex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const high = Number.parseInt(hex[1], 16);
      const low = Number.parseInt(hex[2], 16);
      return isPrivateAddress(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
    }
    const first = Number.parseInt(ip.split(':')[0] || '0', 16);
    return (first & 0xfe00) === 0xfc00 // fc00::/7, únicas locales
      || (first & 0xffc0) === 0xfe80 // fe80::/10, de enlace
      || (first & 0xff00) === 0xff00; // multidifusión
  }
  return true;
}

function isBlockedHostname(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host || host === 'localhost') return true;
  if (BLOCKED_HOST_SUFFIXES.some(suffix => host.endsWith(suffix))) return true;
  if (net.isIP(host)) return isPrivateAddress(host);
  // Un nombre sin punto solo resuelve dentro de una red privada.
  return !host.includes('.');
}

/**
 * Deja el enlace listo para yt-dlp o explica por qué no vale. Acepta lo que se
 * pega desde el botón «Compartir» de las apps —«Mira este vídeo https://…»—
 * y enlaces sin esquema (`youtu.be/…`).
 */
function normalizeVideoUrl(value) {
  let raw = String(value ?? '').trim();
  if (!raw) throw new ToolInputError('Paste the link to a video.', 'url_required');
  if (raw.length > MAX_URL_LENGTH) throw new ToolInputError('That link is too long.', 'url_invalid');
  if (/\s/.test(raw)) {
    const embedded = raw.match(/https?:\/\/\S+/i);
    if (!embedded) throw new ToolInputError('That is not a valid link.', 'url_invalid');
    raw = embedded[0];
  }
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new ToolInputError('That is not a valid link.', 'url_invalid');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new ToolInputError('Only http and https links can be downloaded.', 'url_invalid');
  }
  if (isBlockedHostname(url.hostname)) {
    throw new ToolInputError('Links to private or local addresses are not allowed.', 'url_private');
  }
  url.hash = '';
  return url.href;
}

function platformFor(urlValue, extractorKey) {
  let host = '';
  try {
    host = new URL(urlValue).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    host = '';
  }
  const match = PLATFORMS.find(([, , hosts]) => hosts.some(candidate => host === candidate || host.endsWith(`.${candidate}`)));
  if (match) return { id: match[0], name: match[1] };
  const key = String(extractorKey || '').trim();
  if (key && key.toLowerCase() !== 'generic') {
    return { id: key.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: key };
  }
  return { id: 'web', name: host || 'Web' };
}

/* ── Lo que elige el CRM ─────────────────────────────────────────────────── */

const OPTION_PATTERN = /^(?:v(\d{2,4})|best|audio-(?:mp3|m4a))$/;

function parseOptionId(value) {
  const id = String(value ?? '').trim();
  const match = OPTION_PATTERN.exec(id);
  const side = match?.[1] ? Number(match[1]) : null;
  if (!match || (side !== null && (side < 64 || side > 4320))) {
    throw new ToolInputError('Choose one of the offered qualities.', 'option_invalid');
  }
  return id;
}

/** Posición dentro de una publicación con varios vídeos (carrusel, lista). */
function parsePlaylistItem(value) {
  if (value === undefined || value === null || value === '') return null;
  const item = Number(value);
  if (!Number.isInteger(item) || item < 1 || item > MAX_PLAYLIST_ITEM) {
    throw new ToolInputError('That item is not part of the post.', 'item_invalid');
  }
  return item;
}

/* ── Argumentos de yt-dlp ────────────────────────────────────────────────── */

/**
 * Lo que comparten el análisis y la descarga: el motor de JavaScript para los
 * desafíos de YouTube, las cookies de una cuenta (si se configuran) y el proxy.
 * `cookiesPath` es una copia por ejecución: yt-dlp reescribe el fichero al
 * terminar y el secreto montado en Cloud Run es de solo lectura.
 */
function sharedArguments(settings = {}, cookiesPath = null) {
  const args = ['--ignore-config', '--no-color', '--socket-timeout', '20'];
  for (const runtime of String(settings.jsRuntimes || '').split(',').map(value => value.trim()).filter(Boolean)) {
    args.push('--js-runtimes', runtime);
  }
  if (cookiesPath) args.push('--cookies', cookiesPath);
  if (settings.proxy) args.push('--proxy', settings.proxy);
  return args;
}

function buildInspectArguments(url, settings = {}, cookiesPath = null) {
  return [
    ...sharedArguments(settings, cookiesPath),
    '--dump-single-json',
    '--skip-download',
    // Un vídeo dentro de una lista (`watch?v=…&list=…`) es el vídeo. Una lista
    // de verdad se enumera sin abrir cada entrada: sería un minuto por enlace.
    '--no-playlist',
    '--flat-playlist',
    '--playlist-end', String(MAX_PLAYLIST_ENTRIES),
    '--',
    url
  ];
}

/**
 * Los vídeos salen en MP4 con H.264 y AAC siempre que la plataforma lo tenga:
 * es lo que abren QuickTime, Keynote, los editores y las propias redes al
 * volver a subirlo. Por encima de 1080p YouTube solo ofrece VP9 o AV1, y se
 * acepta: la resolución manda sobre el códec (`res` va antes que `vcodec`).
 */
function formatArguments(option) {
  if (option === 'audio-mp3') {
    return ['--format', 'ba/b', '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0'];
  }
  if (option === 'audio-m4a') {
    return ['--format', 'ba[acodec^=mp4a]/ba/b', '--extract-audio', '--audio-format', 'm4a'];
  }
  const sort = option === 'best' ? 'vcodec:h264,acodec:aac' : `res:${option.slice(1)},vcodec:h264,acodec:aac`;
  return ['--format', 'bv*+ba/b', '--format-sort', sort, '--merge-output-format', 'mp4'];
}

function buildDownloadArguments({ url, option, item = null, outputDir, settings = {}, cookiesPath = null }) {
  return [
    ...sharedArguments(settings, cookiesPath),
    '--newline',
    '--progress',
    '--no-simulate',
    '--no-mtime',
    '--windows-filenames',
    '--progress-template',
    `download:${MARK.progress}{"fid":%(info.format_id)j,"v":%(info.vcodec)j,"a":%(info.acodec)j,`
      + '"p":%(progress.{status,downloaded_bytes,total_bytes,total_bytes_estimate,speed,eta})j}',
    '--progress-template', `postprocess:${MARK.post}%(progress.{status,postprocessor})j`,
    '--print', `before_dl:${MARK.selected}%(.{format_id,ext,filesize,filesize_approx})j`,
    '--print', `after_move:${MARK.file}%(filepath)j`,
    '--paths', outputDir,
    '--paths', `temp:${outputDir}`,
    '--output', '%(title,id).90B.%(ext)s',
    '--max-filesize', String(settings.maxBytes || 1000 * 1000 * 1000),
    '--match-filters', '!is_live',
    ...(item ? ['--playlist-items', String(item)] : ['--no-playlist']),
    ...formatArguments(option),
    '--',
    url
  ];
}

/* ── Lo que se le enseña al CRM ──────────────────────────────────────────── */

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function plainText(value, maxLength) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, maxLength) : null;
}

function httpUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function hasVideo(format) {
  return format.vcodec !== 'none' && format.has_drm !== true && shortSide(format) > 0;
}

function hasAudio(format) {
  return format.acodec !== 'none' && format.has_drm !== true;
}

/** La resolución de un vídeo vertical es su anchura: 1080×1920 es «1080p». */
function shortSide(format) {
  const width = Number(format.width) || 0;
  const height = Number(format.height) || 0;
  return width && height ? Math.min(width, height) : height;
}

function formatBytes(format) {
  return finiteNumber(format.filesize) || finiteNumber(format.filesize_approx) || 0;
}

function codecFamily(vcodec) {
  const codec = String(vcodec || '').toLowerCase();
  if (/^(avc|h264)/.test(codec)) return 'h264';
  if (/^(hev|hvc|h265|bytevc1)/.test(codec)) return 'hevc';
  if (/^av0?1/.test(codec)) return 'av1';
  if (/^vp0?9/.test(codec)) return 'vp9';
  return null;
}

function bestAudio(formats) {
  const audio = formats.filter(format => format.vcodec === 'none' && hasAudio(format) && format.acodec);
  const aac = audio.filter(format => /^(mp4a|aac)/i.test(format.acodec));
  return (aac.length ? aac : audio).sort((left, right) => formatBytes(right) - formatBytes(left))[0] || null;
}

/** Aproxima la elección de `res:<lado>,vcodec:h264` para estimar el tamaño. */
function chooseVideo(formats, side) {
  const candidates = formats.filter(format => hasVideo(format) && shortSide(format) <= side);
  if (!candidates.length) return null;
  const top = Math.max(...candidates.map(shortSide));
  const atTop = candidates.filter(format => shortSide(format) === top);
  const h264 = atTop.filter(format => codecFamily(format.vcodec) === 'h264');
  return (h264.length ? h264 : atTop).sort((left, right) => (
    formatBytes(right) - formatBytes(left) || (Number(right.tbr) || 0) - (Number(left.tbr) || 0)
  ))[0];
}

function estimateVideoBytes(formats, side) {
  const video = chooseVideo(formats, side);
  const videoBytes = video ? formatBytes(video) : 0;
  if (!videoBytes) return null;
  if (hasAudio(video) && video.acodec) return videoBytes;
  const audio = bestAudio(formats);
  return audio && formatBytes(audio) ? videoBytes + formatBytes(audio) : videoBytes;
}

/**
 * Las calidades que tiene sentido ofrecer: las resoluciones reales del vídeo
 * (todas las admitidas, hasta 4320p) y el audio suelto. Si no dice tamaños, se
 * ofrece «la mejor disponible» y que yt-dlp decida.
 */
function videoOptions(info) {
  const formats = (Array.isArray(info.formats) ? info.formats : []).filter(format => format && typeof format === 'object');
  const direct = !formats.length && Boolean(httpUrl(info.url));
  const sides = [...new Set(formats.filter(hasVideo).map(shortSide))]
    .filter(side => Number.isInteger(side) && side >= 64 && side <= 4320)
    .sort((left, right) => right - left);
  const options = [];

  if (sides.length) {
    const offered = sides;
    const recommended = offered.find(side => side <= 1080) ?? offered[offered.length - 1];
    for (const side of offered) {
      options.push({
        id: `v${side}`,
        type: 'video',
        height: side,
        codec: codecFamily(chooseVideo(formats, side)?.vcodec),
        bytes: estimateVideoBytes(formats, side),
        recommended: side === recommended
      });
    }
  } else if (formats.length || direct) {
    options.push({ id: 'best', type: 'video', height: null, codec: null, bytes: null, recommended: true });
  }

  const audible = direct || formats.some(format => hasAudio(format));
  if (options.length && audible) {
    const duration = finiteNumber(info.duration);
    const m4a = bestAudio(formats);
    options.push({
      id: 'audio-mp3',
      type: 'audio',
      height: null,
      codec: 'mp3',
      bytes: duration ? Math.round(duration * MP3_BYTES_PER_SECOND) : null,
      recommended: false
    });
    options.push({
      id: 'audio-m4a',
      type: 'audio',
      height: null,
      codec: 'aac',
      bytes: m4a ? formatBytes(m4a) || null : null,
      recommended: false
    });
  }
  return options;
}

/** Una miniatura de tamaño medio: la que mejor se ve en la tarjeta sin pesar. */
function pickThumbnailUrl(info) {
  const thumbnails = (Array.isArray(info.thumbnails) ? info.thumbnails : [])
    .filter(thumbnail => thumbnail && /^https:\/\//i.test(String(thumbnail.url || '')));
  const sized = thumbnails.filter(thumbnail => Number(thumbnail.width) >= 320 && Number(thumbnail.width) <= 1280);
  if (sized.length) {
    return sized.sort((left, right) => Number(right.width) - Number(left.width))[0].url;
  }
  if (/^https:\/\//i.test(String(info.thumbnail || ''))) return info.thumbnail;
  return thumbnails.length ? thumbnails[thumbnails.length - 1].url : null;
}

function summarizeEntry(entry, index) {
  const formats = Array.isArray(entry.formats) ? entry.formats : [];
  const summary = {
    index,
    title: plainText(entry.title, 300),
    duration: finiteNumber(entry.duration)
  };
  // Las entradas completas (un carrusel de Instagram) se descargan por su
  // posición; las que solo traen enlace (una lista de YouTube) se vuelven a
  // analizar por su cuenta.
  if (formats.length) summary.options = videoOptions(entry);
  else if (httpUrl(entry.url) || httpUrl(entry.webpage_url)) summary.url = httpUrl(entry.url) || httpUrl(entry.webpage_url);
  return summary;
}

function summarizeMedia(info, requestedUrl) {
  const url = httpUrl(info.webpage_url) || httpUrl(info.original_url) || requestedUrl;
  const platform = platformFor(url, info.extractor_key || info.ie_key);
  const base = {
    platform,
    url,
    title: plainText(info.title || info.fulltitle || info.id, 300),
    uploader: plainText(info.uploader || info.channel || info.creator || info.uploader_id, 160)
  };

  if (info._type === 'playlist' || Array.isArray(info.entries)) {
    const entries = (Array.isArray(info.entries) ? info.entries : [])
      .slice(0, MAX_PLAYLIST_ENTRIES)
      .map((entry, index) => (entry && typeof entry === 'object' ? summarizeEntry(entry, index + 1) : null))
      .filter(Boolean);
    return {
      kind: 'playlist',
      ...base,
      entryCount: Number.isInteger(info.playlist_count) ? info.playlist_count : entries.length,
      entries
    };
  }

  const uploadDate = /^\d{8}$/.test(String(info.upload_date || ''))
    ? `${info.upload_date.slice(0, 4)}-${info.upload_date.slice(4, 6)}-${info.upload_date.slice(6, 8)}`
    : null;
  return {
    kind: 'video',
    ...base,
    id: plainText(info.id, 160),
    duration: finiteNumber(info.duration),
    uploadDate,
    isLive: info.is_live === true,
    options: videoOptions(info)
  };
}

/* ── Lo que contesta yt-dlp ──────────────────────────────────────────────── */

// El orden importa: «Sign in to confirm you're not a bot» y «Private video»
// también piden cookies, y no son el mismo problema que una cuenta privada.
// Instagram junta «rate-limit reached or login required» en un solo mensaje:
// lo que se puede arreglar es la sesión, por eso va antes que el límite.
const FAILURES = Object.freeze([
  ['unsupported', /Unsupported URL/i],
  ['bot_check', /confirm you(?:['’]| a)re not a bot|not a bot/i],
  ['age_restricted', /confirm your age|age[- ]restricted|inappropriate for some users/i],
  ['private', /private video|this (?:video|post|account) is private|is a private/i],
  ['geo_blocked', /available in your country|geo[- ]?restrict|blocked it in your country|from your location/i],
  ['login_required', /log(?:ged)?[- ]?in|sign in|--cookies|account credentials|authentication|empty media response/i],
  ['rate_limited', /HTTP Error 429|too many requests|rate[- ]limit/i],
  ['too_large', /larger than max-filesize|max-filesize/i],
  ['live', /is live|live event|live stream|is_live|premieres? in/i],
  ['unavailable', /unavailable|removed|no longer available|does not exist|not found|HTTP Error 404|HTTP Error 410/i],
  ['no_media', /no video (?:could be found|formats)|requested format is not available|no (?:suitable|downloadable) formats|no media/i],
  ['network', /unable to download|timed out|connection|temporary failure|name or service not known|network/i]
]);

/** El último `ERROR:` de yt-dlp, sin la coletilla de «reporte el fallo». */
function cleanErrorMessage(line) {
  return String(line || '')
    .replace(/^ERROR:\s*/, '')
    .replace(/^\[[^\]]+\]\s*[^:\s]+:\s*/, '')
    .replace(/\s*(?:Otherwise,[^.]*?)?;?\s*please report this issue on\b[\s\S]*$/i, '')
    .replace(/\s*(?:Also\s+)?see\s+https:\/\/github\.com\/yt-dlp\/yt-dlp\/wiki\/\S*\s*for [^.]*\.?/gi, '')
    .replace(/\s*Confirm you are on the latest version using\s+yt-dlp -U\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);
}

/**
 * Decide el código de fallo. Dos casos no llegan como `ERROR:`: un directo
 * que no pasa `--match-filters '!is_live'` y un fichero que supera
 * `--max-filesize`; yt-dlp los anuncia como aviso y sale sin fichero.
 */
function classifyFailure(lines) {
  const all = (Array.isArray(lines) ? lines : String(lines || '').split('\n'))
    .map(line => String(line).trim())
    .filter(Boolean);
  const errors = all.filter(line => line.startsWith('ERROR:'));
  const last = errors[errors.length - 1];
  if (last) {
    const code = FAILURES.find(([, pattern]) => pattern.test(last))?.[0] || 'failed';
    return { code, detail: cleanErrorMessage(last) || null };
  }
  if (all.some(line => /does not pass filter/i.test(line))) return { code: 'live', detail: null };
  if (all.some(line => /larger than max-filesize/i.test(line))) return { code: 'too_large', detail: null };
  return { code: 'failed', detail: null };
}

const FAILURE_MESSAGES = Object.freeze({
  unsupported: 'That site is not supported.',
  bot_check: 'The platform asked the server to prove it is not a bot.',
  age_restricted: 'The video is age-restricted and needs a signed-in account.',
  private: 'The video is private.',
  geo_blocked: 'The video is not available in the server region.',
  rate_limited: 'The platform is limiting requests. Try again in a few minutes.',
  too_large: 'The file is larger than the download limit.',
  live: 'Live streams cannot be downloaded until they end.',
  login_required: 'The platform requires a signed-in account for this link.',
  unavailable: 'The video is unavailable or was removed.',
  no_media: 'No downloadable video was found at that link.',
  network: 'The platform could not be reached.',
  timeout: 'The platform took too long to answer.',
  failed: 'The video could not be downloaded.'
});

function failureMessage(code) {
  return FAILURE_MESSAGES[code] || FAILURE_MESSAGES.failed;
}

/** Interpreta una línea marcada; `null` para todo lo demás. */
function parseMarkedLine(line) {
  const text = String(line || '').trim();
  for (const [kind, prefix] of Object.entries(MARK)) {
    if (!text.startsWith(prefix)) continue;
    try {
      return { kind, value: JSON.parse(text.slice(prefix.length)) };
    } catch {
      return null;
    }
  }
  return null;
}

const POSTPROCESSOR_STAGES = Object.freeze({
  Merger: 'merging',
  ExtractAudio: 'extracting',
  VideoRemuxer: 'converting',
  VideoConvertor: 'converting',
  MoveFiles: 'finishing'
});

function partKind(vcodec, acodec) {
  const video = vcodec && vcodec !== 'none';
  const audio = acodec && acodec !== 'none';
  if (video && !audio) return 'video';
  if (audio && !video) return 'audio';
  return 'media';
}

/**
 * Convierte el progreso de cada pieza (vídeo, luego audio) en uno solo. El
 * total esperado sale del `before_dl`; si la plataforma no lo da, la barra usa
 * lo que se sabe hasta ahora y nunca pasa del 99 % antes de terminar.
 */
class ProgressTracker {
  constructor() {
    this.parts = new Map();
    this.expectedParts = 1;
    this.expectedBytes = 0;
    this.speed = null;
    this.filePath = null;
  }

  select(value = {}) {
    const formatId = String(value.format_id || '');
    this.expectedParts = Math.max(1, formatId ? formatId.split('+').length : 1);
    this.expectedBytes = finiteNumber(value.filesize) || finiteNumber(value.filesize_approx) || 0;
  }

  update(value = {}) {
    const id = String(value.fid ?? 'main');
    if (!this.parts.has(id)) this.parts.set(id, { downloaded: 0, total: 0, kind: 'media' });
    const part = this.parts.get(id);
    const progress = value.p || {};
    part.kind = partKind(value.v, value.a);
    part.downloaded = finiteNumber(progress.downloaded_bytes) || part.downloaded;
    part.total = finiteNumber(progress.total_bytes) || finiteNumber(progress.total_bytes_estimate) || part.total;
    if (progress.status === 'finished') {
      part.total = part.total || part.downloaded;
      part.downloaded = part.total;
    }
    this.speed = finiteNumber(progress.speed);
    return this.snapshot(id);
  }

  snapshot(currentId) {
    const parts = [...this.parts.values()];
    const downloaded = parts.reduce((sum, part) => sum + part.downloaded, 0);
    const known = parts.reduce((sum, part) => sum + part.total, 0);
    const total = Math.max(known, this.expectedBytes) || null;
    const current = this.parts.get(currentId) || parts[parts.length - 1] || { kind: 'media' };
    const percent = total ? Math.min(99, Math.round((downloaded / total) * 1000) / 10) : null;
    const eta = total && this.speed ? Math.max(0, Math.round((total - downloaded) / this.speed)) : null;
    return {
      type: 'progress',
      part: Math.max(1, [...this.parts.keys()].indexOf(currentId) + 1),
      parts: Math.max(this.expectedParts, this.parts.size),
      kind: current.kind,
      downloaded,
      total,
      percent,
      speed: this.speed,
      eta
    };
  }
}

function postprocessStage(value = {}) {
  if (value.status !== 'started') return null;
  return POSTPROCESSOR_STAGES[value.postprocessor] || 'processing';
}

const MIME_TYPES = Object.freeze({
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  opus: 'audio/ogg',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
});

function mimeForFile(name) {
  const extension = String(name || '').split('.').pop().toLowerCase();
  return MIME_TYPES[extension] || 'application/octet-stream';
}

module.exports = {
  MARK,
  MAX_PLAYLIST_ENTRIES,
  ProgressTracker,
  ToolInputError,
  buildDownloadArguments,
  buildInspectArguments,
  classifyFailure,
  cleanErrorMessage,
  failureMessage,
  formatArguments,
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
  summarizeMedia,
  videoOptions
};
