'use strict';

/**
 * Lo que comparten las herramientas: carpetas de trabajo, colas, procesos
 * externos y los ficheros listos para descargar.
 *
 *   GET /api/tools/files/:token  Entrega un fichero terminado (un video, un
 *                                .docx). Sin cabecera Authorization, porque lo
 *                                descarga el navegador: el token (192 bits al
 *                                azar) es la autorización y caduca a los 15
 *                                minutos. Si lo que espera en disco supera el
 *                                presupuesto, se borra antes lo más antiguo,
 *                                empezando por lo que ya se descargó.
 *
 * Dos cosas de Cloud Run que explican la forma de todo el servicio:
 *
 * 1. **Solo hay CPU mientras hay una petición abierta.** Por eso cada trabajo
 *    ocurre dentro de la petición que lo pide, que se mantiene abierta contando
 *    el progreso. Un trabajo lanzado en segundo plano tras responder se
 *    quedaría casi parado.
 * 2. **El disco es memoria y es de cada instancia.** El fichero espera en la
 *    instancia que lo produjo, así que el servicio se despliega con
 *    `--max-instances 1` (ver README.md): con dos, GET /files podría llegar a
 *    la que no lo tiene.
 */
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const express = require('express');

const ONE_MIB = 1024 * 1024;
// Los límites se cuentan en megas decimales, como los enseña el CRM (y el
// Finder): 1000 MB es «1 GB» en pantalla, no «1,1 GB».
const ONE_MB = 1000 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;
const JOB_DIR_PATTERN = /^job-[0-9a-f]{18}$/;

const DEFAULT_WORKSPACE = Object.freeze({
  workRoot: path.join(os.tmpdir(), 'elysium-tools'),
  // Lo que puede esperar en disco (= memoria) a que el navegador lo recoja.
  storageBudgetBytes: 1500 * ONE_MB,
  fileTtlMs: 15 * 60 * 1000,
  filesPath: '/api/tools/files'
});

function log(severity, message, fields = {}) {
  const line = JSON.stringify({ severity, message, ...fields });
  if (severity === 'ERROR' || severity === 'WARNING') console.error(line);
  else console.log(line);
}

function abortError() {
  const error = new Error('Aborted.');
  error.name = 'AbortError';
  return error;
}

/** Cola mínima: como mucho `limit` a la vez; el resto espera y sabe su turno. */
function createLimiter(limit) {
  let active = 0;
  const waiting = [];

  function grant() {
    active += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      active -= 1;
      pump();
    };
  }

  function pump() {
    while (active < limit && waiting.length) waiting.shift().admit(grant());
    waiting.forEach((waiter, index) => waiter.onPosition?.(index + 1));
  }

  function acquire({ signal, onPosition } = {}) {
    if (signal?.aborted) return Promise.reject(abortError());
    if (active < limit && !waiting.length) return Promise.resolve(grant());
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        const index = waiting.indexOf(waiter);
        if (index >= 0) waiting.splice(index, 1);
        reject(abortError());
        pump();
      };
      const waiter = {
        onPosition,
        admit(release) {
          signal?.removeEventListener('abort', onAbort);
          resolve(release);
        }
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      waiting.push(waiter);
      onPosition?.(waiting.length);
    });
  }

  return {
    acquire,
    get active() { return active; },
    get waiting() { return waiting.length; }
  };
}

/**
 * Lanza un proceso y lo vigila. yt-dlp abre ffmpeg por su cuenta, así que se
 * arranca en su propio grupo de procesos y se cancela el grupo entero: matar
 * solo a yt-dlp dejaría un ffmpeg huérfano uniendo un video que nadie espera.
 */
function runProcess(command, args, {
  signal,
  timeoutMs = 0,
  onLine = null,
  collectStdout = false,
  maxStdoutBytes = 0
} = {}) {
  return new Promise(resolve => {
    const lines = [];
    const stdout = [];
    let stdoutBytes = 0;
    let timedOut = false;
    let aborted = false;
    let overflow = false;
    let settled = false;
    let child;

    const remember = (line, stream) => {
      lines.push(line);
      if (lines.length > 120) lines.shift();
      onLine?.(line, stream);
    };

    const kill = () => {
      if (!child?.pid) return;
      const group = -child.pid;
      try { process.kill(group, 'SIGTERM'); } catch { child.kill('SIGTERM'); }
      setTimeout(() => {
        try { process.kill(group, 'SIGKILL'); } catch { /* el grupo ya terminó */ }
      }, 5000).unref();
    };

    const onAbort = () => {
      aborted = true;
      kill();
    };

    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve({
        ...result,
        stdout: collectStdout ? Buffer.concat(stdout).toString('utf8') : '',
        lines,
        timedOut,
        aborted,
        overflow
      });
    };

    const splitLines = (stream, name) => {
      let buffer = '';
      stream.setEncoding('utf8');
      stream.on('data', chunk => {
        buffer += chunk;
        let index;
        while ((index = buffer.indexOf('\n')) >= 0) {
          remember(buffer.slice(0, index).replace(/\r$/, ''), name);
          buffer = buffer.slice(index + 1);
        }
        if (buffer.length > ONE_MIB) {
          remember(buffer, name);
          buffer = '';
        }
      });
      stream.on('end', () => {
        if (buffer) remember(buffer, name);
      });
    };

    const timer = timeoutMs ? setTimeout(() => {
      timedOut = true;
      kill();
    }, timeoutMs) : null;

    try {
      child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], detached: true });
    } catch (error) {
      finish({ code: null, error });
      return;
    }

    if (collectStdout) {
      child.stdout.on('data', chunk => {
        stdoutBytes += chunk.length;
        if (maxStdoutBytes && stdoutBytes > maxStdoutBytes) {
          overflow = true;
          kill();
          return;
        }
        stdout.push(chunk);
      });
    } else {
      splitLines(child.stdout, 'stdout');
    }
    splitLines(child.stderr, 'stderr');

    if (signal?.aborted) onAbort();
    else signal?.addEventListener('abort', onAbort, { once: true });

    child.on('error', error => finish({ code: null, error }));
    child.on('close', (code, closeSignal) => finish({ code, signal: closeSignal }));
  });
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Abre un flujo NDJSON —una línea JSON por evento— con su latido, y avisa si
 * quien lo pidió se va. `no-transform` impide que el proxy de Cloudflare
 * comprima, y con ello acumule, el flujo: el CRM necesita cada línea en cuanto
 * se escribe.
 */
function openEventStream(response, { heartbeatMs = 15000 } = {}) {
  response.status(200).set({
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-store, no-transform',
    'X-Accel-Buffering': 'no',
    'X-Content-Type-Options': 'nosniff'
  });
  response.flushHeaders();
  const client = new AbortController();
  response.on('close', () => {
    if (!response.writableFinished) client.abort();
  });
  const send = event => {
    if (!response.writableEnded && !response.destroyed) response.write(`${JSON.stringify(event)}\n`);
  };
  const heartbeat = setInterval(() => send({ type: 'ping' }), heartbeatMs);
  heartbeat.unref();
  return {
    send,
    clientSignal: client.signal,
    end() {
      clearInterval(heartbeat);
      if (!response.writableEnded) response.end();
    }
  };
}

function createWorkspace({ settings: overrides = {}, now = Date.now } = {}) {
  const settings = { ...DEFAULT_WORKSPACE, ...overrides };
  const files = new Map();
  const router = express.Router();
  let workRootReady = null;

  // Al arrancar se borra lo que dejara una ejecución anterior, pero solo las
  // carpetas `job-*` que crea este servicio: nunca la raíz configurada.
  function prepareWorkRoot() {
    workRootReady ??= (async () => {
      await fs.mkdir(settings.workRoot, { recursive: true });
      const entries = await fs.readdir(settings.workRoot, { withFileTypes: true });
      await Promise.all(entries
        .filter(entry => entry.isDirectory() && JOB_DIR_PATTERN.test(entry.name))
        .map(entry => removeDir(path.join(settings.workRoot, entry.name))));
      return fs.realpath(settings.workRoot);
    })();
    return workRootReady;
  }

  async function createWorkDir() {
    const root = await prepareWorkRoot();
    const dir = path.join(root, `job-${crypto.randomBytes(9).toString('hex')}`);
    await fs.mkdir(dir, { recursive: false });
    return dir;
  }

  async function removeDir(dir) {
    if (!dir || !JOB_DIR_PATTERN.test(path.basename(dir))) return;
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }

  /** El fichero que dice haber escrito un proceso, si de verdad está dentro de `dir`. */
  async function finishedFile(dir, reported) {
    if (!reported) return null;
    try {
      const candidate = await fs.realpath(path.resolve(reported));
      if (!isInside(dir, candidate)) return null;
      const stat = await fs.stat(candidate);
      return stat.isFile() && stat.size > 0
        ? { path: candidate, name: path.basename(candidate), size: stat.size }
        : null;
    } catch {
      return null;
    }
  }

  function storedBytes() {
    let total = 0;
    for (const entry of files.values()) total += entry.size;
    return total;
  }

  async function forget(token) {
    const entry = files.get(token);
    if (!entry) return;
    files.delete(token);
    await removeDir(entry.dir);
  }

  /** Si lo que espera en disco supera el presupuesto, se va lo más antiguo. */
  async function enforceBudget(keepToken) {
    const ordered = [...files.entries()]
      .filter(([token]) => token !== keepToken)
      .sort(([, left], [, right]) => (right.downloads > 0) - (left.downloads > 0) || left.createdAt - right.createdAt);
    for (const [token] of ordered) {
      if (storedBytes() <= settings.storageBudgetBytes) break;
      await forget(token);
    }
  }

  /** Deja un fichero listo para descargar y devuelve lo que necesita el CRM. */
  async function register(file, dir, type) {
    const token = crypto.randomBytes(24).toString('base64url');
    const createdAt = now();
    const entry = {
      ...file,
      dir,
      type: type || 'application/octet-stream',
      createdAt,
      expiresAt: createdAt + settings.fileTtlMs,
      downloads: 0
    };
    files.set(token, entry);
    await enforceBudget(token);
    return {
      file: { url: `${settings.filesPath}/${token}`, name: entry.name, bytes: entry.size, type: entry.type },
      expiresAt: new Date(entry.expiresAt).toISOString()
    };
  }

  async function sweep() {
    const at = now();
    for (const [token, entry] of files) {
      if (entry.expiresAt <= at) await forget(token);
    }
  }

  const sweeper = setInterval(() => { sweep().catch(() => {}); }, 30 * 1000);
  sweeper.unref();

  router.get('/:token', (request, response) => {
    response.set('Cache-Control', 'no-store');
    const token = String(request.params.token || '');
    const entry = TOKEN_PATTERN.test(token) ? files.get(token) : null;
    if (!entry || entry.expiresAt <= now()) {
      return response.status(410).json({ error: 'This file expired. Prepare it again.', code: 'file_expired' });
    }
    return response.download(entry.path, entry.name, {
      dotfiles: 'allow',
      headers: { 'Content-Type': entry.type, 'X-Content-Type-Options': 'nosniff' }
    }, error => {
      // El CRM promete «disponible hasta las…»: el fichero no se borra antes
      // por haberse descargado, pero es lo primero que sale si falta sitio.
      if (!error) entry.downloads += 1;
    });
  });

  async function close() {
    clearInterval(sweeper);
    await Promise.all([...files.keys()].map(token => forget(token)));
  }

  return {
    settings,
    files,
    router,
    createWorkDir,
    removeDir,
    finishedFile,
    register,
    sweep,
    close
  };
}

module.exports = {
  DEFAULT_WORKSPACE,
  ONE_MB,
  abortError,
  createLimiter,
  createWorkspace,
  isInside,
  log,
  openEventStream,
  runProcess
};
