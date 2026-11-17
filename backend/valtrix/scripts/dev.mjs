#!/usr/bin/env node
/**
 * VALTRIX en local: el Worker de verdad, servido por Node.
 *
 * No es una imitación del Worker. Importa `src/index.js` —el mismo módulo que
 * se despliega— y le da un `env` con un `ASSETS` que lee la carpeta del sitio
 * del disco, aplicando lo que Cloudflare aplica: `/cuenta` sirve
 * `cuenta.html`, `/cuenta.html` redirige a `/cuenta`, y lo que excluye
 * `.assetsignore` responde 404. Las cabeceras de `_headers` también se ponen:
 * probar una página sin su política de contenido es probar otra página.
 *
 * Dos maneras de usarlo:
 *
 *   node scripts/dev.mjs
 *       Solo el sitio y la demo. La demo no necesita nada: el motor corre en
 *       el navegador. La cuenta dirá que el acceso no está configurado.
 *
 *   npm run dev
 *       Con los emuladores de Firebase y datos de demostración: la cuenta de
 *       verdad, con inicio de sesión, permisos y varios negocios. Las cuentas
 *       y sus contraseñas las imprime el propio arranque.
 *
 * `wrangler dev` hace lo mismo y es lo que hay que usar para comprobar el
 * empaquetado; esto existe porque arranca en un segundo y no necesita red.
 *
 * Opciones: `--port 8799`, `--no-seed`, `--days 30`.
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import worker from '../src/index.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const SITE = resolve(here, '../../../VALTRIX Engineering');
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(`--${name}`); return index === -1 ? fallback : args[index + 1]; };
const PORT = Number(option('port', process.env.PORT || 8799));
const EMULATED = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST);

const TYPES = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.xml': 'application/xml; charset=utf-8'
};

/* ------------------------------------------------------------------ *
 * Lo que Cloudflare hace con la carpeta de assets
 * ------------------------------------------------------------------ */

const ignored = (await readFile(join(SITE, '.assetsignore'), 'utf8').catch(() => ''))
    .split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));

function isIgnored(path) {
    const parts = path.split('/').filter(Boolean);
    return ignored.some(rule => {
        const name = rule.replace(/\/$/, '');
        return parts.includes(name) || (parts.length === 1 && parts[0] === name);
    });
}

/** `_headers`: bloques «ruta» seguidos de líneas «Cabecera: valor». */
const headerRules = [];
{
    let current = null;
    for (const raw of (await readFile(join(SITE, '_headers'), 'utf8').catch(() => '')).split('\n')) {
        const line = raw.replace(/\s+$/, '');
        if (!line.trim() || line.trim().startsWith('#')) continue;
        if (!/^\s/.test(line)) { current = { pattern: line.trim(), headers: [] }; headerRules.push(current); continue; }
        const at = line.indexOf(':');
        if (current && at !== -1) current.headers.push([line.slice(0, at).trim().toLowerCase(), line.slice(at + 1).trim()]);
    }
}
const matchesRule = (pattern, path) => new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`).test(path);

const exists = async file => { try { return (await stat(file)).isFile(); } catch { return false; } };

/** `html_handling: auto-trailing-slash`, que es lo que declara `wrangler.jsonc`. */
async function serveAsset(request) {
    const url = new URL(request.url);
    let path = decodeURIComponent(url.pathname);
    const file = relative => normalize(join(SITE, relative));
    const safe = target => target === SITE || target.startsWith(SITE + sep);

    if (isIgnored(path)) return notFound();
    if (/\/index\.html$/.test(path)) return Response.redirect(new URL(path.replace(/index\.html$/, '') + url.search, url), 307);
    if (path.endsWith('.html')) {
        const target = file(path);
        if (safe(target) && await exists(target)) return Response.redirect(new URL(path.slice(0, -5) + url.search, url), 307);
        return notFound();
    }
    let target = path.endsWith('/') ? file(`${path}index.html`) : file(path);
    if (!safe(target)) return notFound();
    if (!await exists(target)) {
        const html = file(`${path.replace(/\/$/, '')}.html`);
        if (path !== '/' && safe(html) && await exists(html)) target = html;
        else return notFound();
    }
    const headers = new Headers({ 'content-type': TYPES[extname(target).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' });
    for (const rule of headerRules) if (matchesRule(rule.pattern, path)) for (const [name, value] of rule.headers) headers.set(name, value);
    return new Response(await readFile(target), { headers });
}

function notFound() {
    return new Response('<!doctype html><meta charset="utf-8"><title>No encontrado</title><p>404 · No encontrado</p>', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

/* ------------------------------------------------------------------ *
 * El entorno del Worker
 * ------------------------------------------------------------------ */

const env = {
    FIREBASE_PROJECT_ID: process.env.GCLOUD_PROJECT || 'demo-valtrix',
    ALLOWED_ORIGINS: `http://localhost:${PORT},http://127.0.0.1:${PORT}`,
    PUBLIC_ORIGIN: `http://localhost:${PORT}`,
    ASSETS: { fetch: serveAsset },
    ...(EMULATED ? {
        FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
        FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST
    } : {})
};

const pending = new Set();
const executionCtx = { waitUntil(promise) { pending.add(promise); promise.finally(() => pending.delete(promise)); } };

const server = createServer(async (incoming, outgoing) => {
    try {
        const chunks = [];
        for await (const chunk of incoming) chunks.push(chunk);
        const body = chunks.length ? Buffer.concat(chunks) : undefined;
        const request = new Request(`http://${incoming.headers.host || `localhost:${PORT}`}${incoming.url}`, {
            method: incoming.method,
            headers: Object.entries(incoming.headers).filter(([, value]) => typeof value === 'string'),
            body: ['GET', 'HEAD'].includes(incoming.method) ? undefined : body,
            redirect: 'manual'
        });
        const response = await worker.fetch(request, env, executionCtx);
        const headers = {};
        response.headers.forEach((value, name) => {
            // HSTS en http://localhost haría que el navegador dejara de abrirlo.
            if (name !== 'strict-transport-security') headers[name] = value;
        });
        outgoing.writeHead(response.status, headers);
        outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
        console.error(error);
        outgoing.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        outgoing.end('Error del servidor local. Mire la terminal.');
    }
});

if (EMULATED && !args.includes('--no-seed')) {
    const { seed } = await import('./seed.mjs');
    await seed({ days: Number(option('days', 45)), origin: `http://localhost:${PORT}` });
}

server.listen(PORT, '127.0.0.1', () => {
    console.log(`\nVALTRIX en http://localhost:${PORT}`);
    console.log(`  Sitio     http://localhost:${PORT}/`);
    console.log(`  Demo      http://localhost:${PORT}/demo`);
    console.log(EMULATED
        ? `  Cuenta    http://localhost:${PORT}/cuenta   (emuladores de Firebase)`
        : `  Cuenta    sin configurar: para probarla, «npm run dev» (arranca los emuladores)`);
});
