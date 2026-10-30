'use strict';

/**
 * La puerta pública de las herramientas (`/api/tools/public/*`): lo que usan
 * las páginas de tools.elysiumdr.eu, sin cuenta.
 *
 *   GET  /capabilities   Si hay motor, el tamaño máximo y los límites.
 *   POST /video/inspect  Igual que en el CRM, solo para las plataformas de
 *   POST /video/download PUBLIC_PLATFORMS y por un proxy que no deja salir a
 *                        redes privadas (public-network.js).
 *   POST /pdf/convert    PDF a Word, igual que en el CRM.
 *
 * Nadie llega aquí directamente. El Worker comprueba Turnstile, el origen de
 * la página y añade dos cabeceras: la clave compartida de la pasarela
 * (`X-Elysium-Public-Key`, el secreto TOOLS_PUBLIC_GATEWAY_KEY a los dos
 * lados) y la IP de quien pregunta (`X-Elysium-Client-IP`). Sin la clave, 403.
 *
 * Los límites son por visitante y por hora, y la IP no se guarda: se cuenta
 * por un HMAC con la clave de la pasarela, en memoria, que caduca a la hora.
 * Una IPv6 cuenta por su /64, que es lo que suele tener una casa entera; si
 * no, bastaría cambiar el final de la dirección para empezar de cero. Como el
 * servicio corre en una sola instancia, la cuenta es una.
 */
const crypto = require('node:crypto');
const net = require('node:net');
const express = require('express');
const { normalizeVideoUrl, platformFor } = require('./video');
const { createPublicNetwork } = require('./public-network');
const { createVideoTools } = require('./video-routes');
const { createPdfTools } = require('./pdf-routes');

// Comprobadas desde Cloud Run. Las páginas solo prometen estas
// (`scripts/tools/content.mjs`) y `JS/tools-public.js` las nombra en sus
// mensajes: si cambia una lista, cambian las tres (hay prueba).
const PUBLIC_PLATFORMS = Object.freeze(['tiktok', 'instagram', 'facebook', 'pinterest', 'twitch', 'linkedin', 'snapchat', 'bluesky']);

// Las que se anuncian como «próximamente». YouTube pide demostrar que no es un
// bot a cualquier IP de Google Cloud: hará falta un proxy residencial.
const COMING_SOON = Object.freeze(['youtube']);

// Enlaces cortos que solo redirigen. En el CRM los sigue el extractor
// genérico; aquí no está, así que se pide la dirección completa del pin.
const SHORT_LINK_HOSTS = Object.freeze(['pin.it']);

const HOUR_MS = 60 * 60 * 1000;
const LIMITS = Object.freeze({ inspect: 30, download: 10, convert: 10, capabilities: 120 });
const OPERATIONS = Object.freeze({
  'GET /capabilities': 'capabilities',
  'POST /video/inspect': 'inspect',
  'POST /video/download': 'download',
  'POST /pdf/convert': 'convert'
});
const MAX_CLIENTS = 10000;
const MAX_ACTIVE = 6;
const PUBLIC_MAX_BYTES = 250 * 1000 * 1000;

function sameSecret(actual, expected) {
  const a = Buffer.from(String(actual || ''));
  const b = Buffer.from(String(expected || ''));
  return b.length >= 32 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** La parte de la IP que identifica al visitante: entera en IPv4, el /64 en IPv6. */
function clientAddress(value) {
  const ip = String(value || '').trim();
  if (net.isIPv4(ip)) return ip;
  if (!net.isIPv6(ip)) return null;
  const [head, tail = ''] = ip.toLowerCase().split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  // Una IPv4 al final (::ffff:1.2.3.4) ocupa dos grupos.
  if (right.length && right[right.length - 1].includes('.')) {
    if (left.length === 0 && right.length === 2 && right[0] === 'ffff') return right[1];
    right.splice(-1, 1, '0', '0');
  }
  const groups = [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
  return `${groups.slice(0, 4).map(group => group.padStart(4, '0')).join(':')}::/64`;
}

function createPublicTools({ workspace, settings, lookup, now = Date.now,
  gatewayKey = process.env.TOOLS_PUBLIC_GATEWAY_KEY || '' } = {}) {
  const router = express.Router();
  const buckets = new Map();
  const running = new Set();
  let active = 0;
  const network = createPublicNetwork({ lookup });
  const pass = (_request, _response, next) => next();

  // Lo mismo que el CRM con otros ajustes: sin cookies ni proxy propios, sin
  // el extractor genérico, un fichero menor y una descarga a la vez. La
  // miniatura no se pide (`fetchImpl` vacío): esa petición no pasaría por el
  // proxy que filtra las redes privadas.
  const video = createVideoTools({
    requireAdmin: pass,
    workspace,
    settings: {
      ...settings,
      cookiesFile: '',
      proxy: '',
      maxBytes: PUBLIC_MAX_BYTES,
      maxActiveDownloads: 1,
      maxActiveInspections: 2,
      publicOnly: true
    },
    ...(lookup ? { lookup } : {}),
    now,
    fetchImpl: async () => new Response(null, { status: 204 })
  });
  const pdf = createPdfTools({ requireAdmin: pass, workspace, settings: { ...settings, maxActiveConversions: 1 }, now });

  router.use((request, response, next) => {
    response.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
    if (!gatewayKey) return response.status(503).json({ code: 'public_tools_disabled' });
    if (!sameSecret(request.get('X-Elysium-Public-Key'), gatewayKey)) return response.status(403).json({ code: 'gateway_required' });
    const address = clientAddress(request.get('X-Elysium-Client-IP'));
    if (!address) return response.status(403).json({ code: 'gateway_required' });

    const operation = OPERATIONS[`${request.method} ${request.path}`];
    if (!operation) return response.status(404).json({ code: 'not_found' });

    const client = crypto.createHmac('sha256', gatewayKey).update(address).digest('hex');
    const at = now();
    for (const [key, bucket] of buckets) if (bucket.expires <= at) buckets.delete(key);
    if (!buckets.has(client) && buckets.size >= MAX_CLIENTS) return response.status(503).json({ code: 'busy' });
    const bucket = buckets.get(client) || { expires: at + HOUR_MS, inspect: 0, download: 0, convert: 0, capabilities: 0 };
    buckets.set(client, bucket);
    if (bucket[operation] >= LIMITS[operation]) {
      response.set('Retry-After', String(Math.max(1, Math.ceil((bucket.expires - at) / 1000))));
      return response.status(429).json({ code: 'limit_reached' });
    }

    if (request.method === 'POST') {
      // Una operación de cada tipo a la vez por visitante: puede analizar otro
      // enlace mientras descarga, pero no lanzar diez descargas en paralelo.
      const slot = `${client}:${operation === 'inspect' ? 'inspect' : 'job'}`;
      if (running.has(slot) || active >= MAX_ACTIVE) {
        response.set('Retry-After', '30');
        return response.status(429).json({ code: 'busy' });
      }
      running.add(slot);
      active += 1;
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        active -= 1;
        running.delete(slot);
      };
      response.once('close', release);
      response.once('finish', release);
    }
    bucket[operation] += 1;
    return next();
  });

  router.get('/capabilities', async (_request, response) => {
    const [videoEngine, pdfEngine] = await Promise.all([video.capabilities(), pdf.capabilities()]);
    response.json({
      public: true,
      video: { ready: videoEngine.ready, maxBytes: videoEngine.maxBytes },
      pdf: { ready: pdfEngine.ready, maxBytes: pdfEngine.maxBytes },
      platforms: PUBLIC_PLATFORMS,
      limits: {
        inspectionsPerHour: LIMITS.inspect,
        downloadsPerHour: LIMITS.download,
        conversionsPerHour: LIMITS.convert
      }
    });
  });

  router.use('/video', async (request, response, next) => {
    try {
      const url = normalizeVideoUrl(request.body?.url);
      const platform = platformFor(url);
      if (COMING_SOON.includes(platform.id)) return response.status(400).json({ code: 'coming_soon', platform: platform.name });
      if (SHORT_LINK_HOSTS.includes(new URL(url).hostname.replace(/^www\./, ''))) {
        return response.status(400).json({ code: 'short_link', platform: platform.name });
      }
      if (!PUBLIC_PLATFORMS.includes(platform.id) || new URL(url).port) return response.status(400).json({ code: 'unsupported' });
      video.settings.proxy = await network.start();
      return next();
    } catch (error) {
      return response.status(400).json({ code: error.code || 'url_invalid' });
    }
  }, video.router);

  router.use('/pdf', pdf.router);

  return {
    router,
    async close() {
      await Promise.all([video.close(), pdf.close()]);
      await network.close();
    }
  };
}

module.exports = { createPublicTools, sameSecret, clientAddress, PUBLIC_PLATFORMS, COMING_SOON, LIMITS };
