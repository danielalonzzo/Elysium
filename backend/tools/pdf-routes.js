'use strict';

/**
 * Conversión de PDF a Word (`/api/tools/pdf/*`).
 *
 *   POST /convert?name=<nombre>  Cuerpo: el PDF tal cual (`application/pdf`,
 *                                hasta 30 MB). Responde NDJSON como la descarga
 *                                de videos: `accepted`, `queued`, `stage`,
 *                                `progress`, `warning` y al final `ready` (con
 *                                el .docx en `/api/tools/files/:token`) o `error`.
 *
 * El resto del editor —ordenar, girar, quitar y unir páginas— ocurre en el
 * navegador con pdf-lib: el documento no sale del ordenador de quien lo edita.
 * Pasar a Word sí necesita servidor: pdf2docx (Python, `pdf_to_docx.py`)
 * reconstruye párrafos, tablas e imágenes, y en el navegador no hay nada
 * comparable. Pages no tiene un formato abierto que se pueda escribir; abre el
 * .docx directamente.
 *
 * El PDF se escribe en una carpeta de trabajo, se convierte y se borra en
 * cuanto existe el .docx; el .docx espera a que lo recoja el navegador.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const express = require('express');
const { ONE_MB, createLimiter, log, openEventStream, runProcess } = require('./workspace');

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const DEFAULT_SETTINGS = Object.freeze({
  python: 'python3',
  converterScript: path.join(__dirname, 'pdf_to_docx.py'),
  pdfMaxBytes: 30 * ONE_MB,
  maxActiveConversions: 2,
  convertTimeoutMs: 10 * 60 * 1000,
  heartbeatMs: 15 * 1000
});

const MESSAGES = Object.freeze({
  pdf_required: 'Send the PDF in the request body.',
  pdf_invalid: 'That file is not a readable PDF.',
  pdf_encrypted: 'The PDF is protected with a password.',
  pdf_too_many_pages: 'The PDF has too many pages to convert (500 at most).',
  pdf_failed: 'The PDF could not be converted.',
  timeout: 'The conversion took too long.',
  engine_unavailable: 'The conversion engine is not available.',
  failed: 'The PDF could not be converted.'
});

function message(code) {
  return MESSAGES[code] || MESSAGES.failed;
}

/** El nombre del .docx: el del PDF, sin ruta, sin extensión y sin caracteres raros. */
function documentName(value, fallback = 'documento') {
  const base = String(value ?? '')
    .normalize('NFC')
    .split(/[\\/]/)
    .pop()
    .replace(/\.pdf$/i, '')
    .replace(/[\u0000-\u001f\u007f<>:"|?*]+/g, ' ')
    .replace(/^\.+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
    .trim();
  return base || fallback;
}

/** Un PDF empieza por `%PDF-`, a veces tras unos bytes de basura. */
function looksLikePdf(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length > 0 && buffer.subarray(0, 1024).includes('%PDF-');
}

/** Lleva las fases de pdf2docx a una sola barra: analizar es la mitad, escribir la otra. */
function progressFor(event) {
  if (event.type === 'stage') {
    return { opening: 2, analyzing: 5, parsing: 6, creating: 50 }[event.stage] ?? null;
  }
  if (event.type === 'page' && event.pages > 0) {
    const share = Math.min(1, event.page / event.pages);
    return event.stage === 'creating' ? Math.round(50 + share * 48) : Math.round(6 + share * 44);
  }
  return null;
}

function parseConverterLine(line) {
  const text = String(line || '').trim();
  if (!text.startsWith('{')) return null;
  try {
    const event = JSON.parse(text);
    return event && typeof event.type === 'string' ? event : null;
  } catch {
    return null;
  }
}

function createPdfTools({ requireAdmin, workspace, settings: overrides = {}, now = Date.now } = {}) {
  if (typeof requireAdmin !== 'function') throw new TypeError('createPdfTools needs requireAdmin.');
  if (!workspace) throw new TypeError('createPdfTools needs a workspace.');
  const settings = { ...DEFAULT_SETTINGS, ...overrides };
  const router = express.Router();
  const conversions = createLimiter(settings.maxActiveConversions);
  const shutdown = new AbortController();

  // Como con yt-dlp: se pregunta dentro de una petición y un fallo no se recuerda.
  let probe = null;
  function versions() {
    probe ??= (async () => {
      const result = await runProcess(settings.python, [
        '-c',
        "from importlib.metadata import version; print(version('pdf2docx'), version('pymupdf'))"
      ], { collectStdout: true, timeoutMs: 20000 });
      const [pdf2docx, pymupdf] = result.code === 0 ? result.stdout.trim().split(/\s+/) : [];
      const found = { pdf2docx: pdf2docx || null, pymupdf: pymupdf || null };
      if (!found.pdf2docx) probe = null;
      return found;
    })();
    return probe;
  }

  async function capabilities() {
    const found = await versions();
    return {
      ready: Boolean(found.pdf2docx),
      pdf2docx: found.pdf2docx,
      pymupdf: found.pymupdf,
      maxBytes: settings.pdfMaxBytes
    };
  }

  const pdfBody = express.raw({ type: () => true, limit: settings.pdfMaxBytes });

  router.post('/convert', requireAdmin, pdfBody, async (request, response) => {
    response.set('Cache-Control', 'no-store');
    const body = request.body;
    if (!Buffer.isBuffer(body) || !body.length) {
      return response.status(400).json({ error: message('pdf_required'), code: 'pdf_required' });
    }
    if (!looksLikePdf(body)) {
      return response.status(400).json({ error: message('pdf_invalid'), code: 'pdf_invalid' });
    }
    const name = documentName(request.query.name);

    const stream = openEventStream(response, { heartbeatMs: settings.heartbeatMs });
    const { send } = stream;
    const signal = AbortSignal.any([stream.clientSignal, shutdown.signal]);
    const started = now();
    let release = null;
    let dir = null;
    let kept = false;
    try {
      send({ type: 'accepted', bytes: body.length });
      release = await conversions.acquire({ signal, onPosition: position => send({ type: 'queued', position }) });
      send({ type: 'stage', stage: 'starting' });
      dir = await workspace.createWorkDir();
      const source = path.join(dir, 'source.pdf');
      const target = path.join(dir, `${name}.docx`);
      await fs.writeFile(source, body);

      let pages = null;
      let failure = null;
      let done = false;
      const result = await runProcess(settings.python, [settings.converterScript, source, target], {
        signal,
        timeoutMs: settings.convertTimeoutMs,
        onLine(line, stream) {
          if (stream !== 'stdout') return;
          const event = parseConverterLine(line);
          if (!event) return;
          if (event.type === 'info') {
            pages = Number.isInteger(event.pages) ? event.pages : null;
          } else if (event.type === 'stage' || event.type === 'page') {
            if (event.type === 'stage') send({ type: 'stage', stage: event.stage });
            const percent = progressFor(event);
            if (percent !== null) {
              send({ type: 'progress', stage: event.stage, page: event.page ?? null, pages: event.pages ?? pages, percent });
            }
          } else if (event.type === 'warning') {
            send({ type: 'warning', code: String(event.code || 'warning') });
          } else if (event.type === 'error') {
            failure = { code: MESSAGES[event.code] ? event.code : 'pdf_failed', detail: event.detail ? String(event.detail).slice(0, 300) : null };
          } else if (event.type === 'done') {
            done = true;
          }
        }
      });

      if (stream.clientSignal.aborted || shutdown.signal.aborted) return undefined;
      // El PDF ya no hace falta: solo ocupa memoria mientras se espera la descarga.
      await fs.rm(source, { force: true });
      if (result.error) {
        log('ERROR', 'pdf.engine_missing', { error: String(result.error.message || result.error) });
        send({ type: 'error', code: 'engine_unavailable', error: message('engine_unavailable') });
        return undefined;
      }
      const file = done && result.code === 0 ? await workspace.finishedFile(dir, target) : null;
      if (!file) {
        const code = result.timedOut ? 'timeout' : failure?.code || 'pdf_failed';
        log('WARNING', 'pdf.convert_failed', { code, pages, ms: now() - started });
        send({ type: 'error', code, error: message(code), detail: failure?.detail || null });
        return undefined;
      }

      const ready = await workspace.register(file, dir, DOCX_TYPE);
      kept = true;
      log('INFO', 'pdf.converted', { pages, bytes: file.size, ms: now() - started });
      send({ type: 'ready', pages, ...ready });
      return undefined;
    } catch (error) {
      if (stream.clientSignal.aborted || shutdown.signal.aborted) return undefined;
      log('ERROR', 'pdf.convert_crashed', { error: String(error?.stack || error) });
      send({ type: 'error', code: 'failed', error: message('failed') });
      return undefined;
    } finally {
      release?.();
      if (!kept) await workspace.removeDir(dir);
      stream.end();
    }
  });

  async function close() {
    shutdown.abort();
  }

  return { router, settings, capabilities, close, conversions };
}

/** La configuración que se lee del entorno de Cloud Run (ver README.md). */
function settingsFromEnv(environment = process.env) {
  const settings = {};
  if (environment.PDF_PYTHON) settings.python = environment.PDF_PYTHON;
  const maxMb = Number(environment.TOOLS_MAX_PDF_MB);
  if (Number.isFinite(maxMb) && maxMb > 0) settings.pdfMaxBytes = Math.round(maxMb * ONE_MB);
  return settings;
}

module.exports = {
  DEFAULT_SETTINGS,
  DOCX_TYPE,
  createPdfTools,
  documentName,
  looksLikePdf,
  parseConverterLine,
  progressFor,
  settingsFromEnv
};
