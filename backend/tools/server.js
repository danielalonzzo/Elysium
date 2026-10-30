'use strict';

/**
 * elysium-tools — las herramientas del CRM que necesitan un servidor.
 *
 * Hoy, el descargador de vídeos de la sección Herramientas: recibe un enlace
 * de YouTube, TikTok, Instagram… y entrega el fichero, con yt-dlp y ffmpeg.
 *
 * Es un servicio de Cloud Run aparte de `elysium-billing` a propósito. Necesita
 * Python, ffmpeg y Deno en la imagen, gigas de memoria mientras une vídeo y
 * audio, y minutos de CPU por petición. Dentro del servicio del correo y la
 * agenda, una descarga grande podría dejar sin memoria la instancia que en ese
 * momento envía la confirmación de una reunión.
 *
 * El sitio lo alcanza en `/api/tools/*`: el Worker reenvía esa ruta aquí
 * (`ELYSIUM_TOOLS_ORIGIN` en `wrangler.jsonc`) y el resto de `/api/*` a
 * `elysium-billing`. Mismo origen que el CRM, así que no hay CORS.
 *
 * Solo lo usan administradores. La regla es la de `isFirebaseAdmin()` en
 * `../platform-server.js`; está copiada porque Cloud Run despliega solo esta
 * carpeta, y `server.test.js` comprueba que las dos siguen diciendo lo mismo.
 */
const express = require('express');
const { createWorkspace } = require('./workspace');
const video = require('./video-routes');
const pdf = require('./pdf-routes');
const { createPublicTools } = require('./public-tools');

const DEFAULT_ADMIN_EMAILS = 'daniel.morales@elysiumdr.eu';

function emailSet(value) {
  return new Set(String(value || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean));
}

function isFirebaseAdmin(identity, adminEmails = emailSet(process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS)) {
  if (!identity || identity.email_verified !== true) return false;
  const role = String(identity.crmRole || identity.role || '').toLowerCase();
  return identity.admin === true
    || ['admin', 'root', 'super_admin'].includes(role)
    || adminEmails.has(String(identity.email || '').toLowerCase());
}

/** Toda la configuración del entorno en un objeto: carpetas, video y PDF. */
function settingsFromEnv(environment = process.env) {
  return { ...video.settingsFromEnv(environment), ...pdf.settingsFromEnv(environment) };
}

/**
 * `settings` lleva a la vez lo del espacio de trabajo (`workRoot`, presupuesto,
 * caducidad), lo del video y lo del PDF; cada parte toma lo suyo.
 */
function createApp({
  verifyIdToken,
  adminEmails = emailSet(process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS),
  settings = {},
  lookup,
  fetchImpl,
  publicGatewayKey = process.env.TOOLS_PUBLIC_GATEWAY_KEY || '',
  now = Date.now
} = {}) {
  if (typeof verifyIdToken !== 'function') throw new TypeError('createApp needs verifyIdToken.');
  const app = express();
  app.disable('x-powered-by');
  // Un único salto delante: el proxy de Cloud Run (el Worker llega como cliente).
  app.set('trust proxy', 1);

  async function requireAdmin(request, response, next) {
    response.set('Cache-Control', 'no-store');
    const match = (request.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
    if (!match) return response.status(401).json({ error: 'Authentication required.', code: 'unauthenticated' });
    let identity;
    try {
      identity = await verifyIdToken(match[1]);
    } catch {
      return response.status(401).json({ error: 'Invalid or expired authentication token.', code: 'unauthenticated' });
    }
    if (!identity?.email || identity.email_verified !== true) {
      return response.status(403).json({ error: 'Verify your email address before continuing.', code: 'email_not_verified' });
    }
    if (!isFirebaseAdmin(identity, adminEmails)) {
      return response.status(403).json({ error: 'Administrator access required.', code: 'admin_required' });
    }
    request.firebaseUser = identity;
    return next();
  }

  const workspace = createWorkspace({ settings, now });
  const videoTools = video.createVideoTools({
    requireAdmin,
    workspace,
    settings,
    now,
    ...(lookup ? { lookup } : {}),
    ...(fetchImpl ? { fetchImpl } : {})
  });
  const pdfTools = pdf.createPdfTools({ requireAdmin, workspace, settings, now });
  const publicTools = createPublicTools({ workspace, settings, lookup, now, gatewayKey: publicGatewayKey });
  app.locals.workspace = workspace;
  app.locals.video = videoTools;
  app.locals.pdf = pdfTools;
  app.locals.close = async () => {
    await Promise.all([videoTools.close(), pdfTools.close(), publicTools.close()]);
    await workspace.close();
  };

  // JSON compacto para todo menos /pdf/convert, que trae el PDF en crudo.
  app.use('/api/tools', express.json({ limit: '16kb' }));
  app.use('/api/tools/public', publicTools.router);

  app.get(['/health', '/api/tools/health'], (_request, response) => {
    response.set('Cache-Control', 'no-store');
    response.json({ ok: true, service: 'elysium-tools' });
  });

  app.get('/api/tools/capabilities', requireAdmin, async (_request, response) => {
    const [videoEngine, pdfEngine] = await Promise.all([videoTools.capabilities(), pdfTools.capabilities()]);
    response.json({ version: '2026-10-29', video: videoEngine, pdf: pdfEngine });
  });

  app.use('/api/tools/files', workspace.router);
  app.use('/api/tools/video', videoTools.router);
  app.use('/api/tools/pdf', pdfTools.router);

  app.use('/api/tools', (_request, response) => {
    response.status(404).json({ error: 'Not found.', code: 'not_found' });
  });

  app.use((error, _request, response, _next) => {
    if (error?.type === 'entity.parse.failed') {
      return response.status(400).json({ error: 'The request body is not valid JSON.', code: 'invalid_json' });
    }
    if (error?.type === 'entity.too.large') {
      return response.status(413).json({ error: 'The request body is too large.', code: 'payload_too_large' });
    }
    console.error(JSON.stringify({ severity: 'ERROR', message: 'tools.unhandled', error: String(error?.stack || error) }));
    return response.status(500).json({ error: 'Unexpected error.', code: 'failed' });
  });

  return app;
}

if (require.main === module) {
  const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  const firebaseApp = getApps()[0] || initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'elysiumdr-eu'
  });
  const firebaseAuth = getAuth(firebaseApp);
  const app = createApp({
    // `true` comprueba además que la sesión no se haya revocado; por eso la
    // cuenta de servicio necesita `roles/firebaseauth.viewer` (ver README.md).
    verifyIdToken: token => firebaseAuth.verifyIdToken(token, true),
    settings: settingsFromEnv()
  });
  const port = Number(process.env.PORT || 8080);
  const server = app.listen(port, error => {
    if (error) {
      console.error('Unable to start Elysium tools:', error);
      process.exitCode = 1;
      return;
    }
    console.log(`Elysium tools listening on port ${port}`);
  });

  const stop = () => {
    server.close();
    app.locals.close().finally(() => process.exit(0));
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}

module.exports = { createApp, isFirebaseAdmin, settingsFromEnv };
