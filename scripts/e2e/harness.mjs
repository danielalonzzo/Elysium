/**
 * Arnés de extremo a extremo: el Worker real (`worker/index.js`) servido por
 * HTTPS con un `env.ASSETS` que replica el `html_handling: auto-trailing-slash`
 * de Cloudflare, más un Chrome de verdad con los cuatro dominios mapeados a
 * ese servidor local (`--host-resolver-rules`), de modo que el navegador ve
 * `https://elysiumdr.eu`, `.es`, `.pt` y `.com` tal como en producción.
 *
 * Hace falta Google Chrome (`CHROME_PATH` para otra ruta) y `openssl`.
 * No replica `_headers` (CSP, caché) ni la CDN: eso solo existe en Cloudflare.
 */
import https from 'node:https';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export const HOSTS = ['elysiumdr.eu', 'elysiumdr.es', 'elysiumdr.pt', 'elysiumdr.com', 'www.elysiumdr.eu'];

const TYPES = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
    '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
    '.woff2': 'font/woff2', '.mp3': 'audio/mpeg'
};
const isFile = path => { try { return statSync(path).isFile(); } catch { return false; } };
const isDirectory = path => { try { return statSync(path).isDirectory(); } catch { return false; } };
const send = file => new Response(readFileSync(file), { status: 200, headers: { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' } });

function assets() {
    return {
        async fetch(request) {
            const url = new URL(request.url);
            const path = decodeURIComponent(url.pathname);
            const fsPath = join(ROOT, path);
            if (path.endsWith('/')) {
                const index = join(fsPath, 'index.html');
                return isFile(index) ? send(index) : new Response('nf', { status: 404 });
            }
            if (path.endsWith('.html')) {
                if (!isFile(fsPath)) return new Response('nf', { status: 404 });
                const target = path.endsWith('/index.html') ? path.slice(0, -'index.html'.length) : path.slice(0, -5);
                return new Response(null, { status: 307, headers: { Location: target + url.search } });
            }
            if (isFile(fsPath)) return send(fsPath);
            if (isFile(`${fsPath}.html`)) return send(`${fsPath}.html`);
            if (isDirectory(fsPath) && isFile(join(fsPath, 'index.html'))) {
                return new Response(null, { status: 307, headers: { Location: `${path}/${url.search}` } });
            }
            return new Response('nf', { status: 404 });
        }
    };
}

const DEMO_BOOK = '<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><title>Livro de prova</title></head><body><h1 id="a">Livro de prova</h1><p>Texto.</p></body></html>';

/** Un KV en memoria con un solo libro («manual», en portugués) para ver el índice y el lector. */
function demoLibrary(bookMetadata) {
    const bytes = new TextEncoder().encode(DEMO_BOOK);
    const metadata = bookMetadata({ title: 'Livro de prova', description: 'Um livro para a verificação.', lang: 'pt-PT', size: bytes.length, file: 'manual.html', uploadedAt: '2026-09-30T10:00:00.000Z' });
    const entries = new Map([['book:manual', { bytes, metadata }]]);
    return {
        async get(key) { const entry = entries.get(key); return entry ? new TextDecoder().decode(entry.bytes) : null; },
        async getWithMetadata(key, options = {}) {
            const entry = entries.get(key);
            if (!entry) return { value: null, metadata: null };
            return { value: options.type === 'stream' ? new Response(entry.bytes).body : new TextDecoder().decode(entry.bytes), metadata: entry.metadata };
        },
        async put() {}, async delete() {},
        async list({ prefix = '' } = {}) {
            return { keys: [...entries.keys()].filter(name => name.startsWith(prefix)).map(name => ({ name, metadata: entries.get(name).metadata })), list_complete: true };
        }
    };
}

/** Arranca el Worker por HTTPS. El país simulado llega en la cabecera `X-Test-Country`. */
export async function startServer({ port = 0 } = {}) {
    const dir = mkdtempSync(join(tmpdir(), 'elysium-e2e-'));
    const alt = HOSTS.map(host => `DNS:${host}`).join(',');
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(dir, 'key.pem'), '-out', join(dir, 'cert.pem'),
        '-days', '2', '-subj', '/CN=elysiumdr.eu', '-addext', `subjectAltName=${alt}`], { stdio: 'ignore' });

    const worker = (await import(`file://${join(ROOT, 'worker', 'index.js')}`)).default;
    const { bookMetadata } = await import(`file://${join(ROOT, 'worker', 'library.js')}`);
    const env = { ASSETS: assets(), ELYSIUM_API_ORIGIN: '', LIBRARY: demoLibrary(bookMetadata) };
    const server = https.createServer({ key: readFileSync(join(dir, 'key.pem')), cert: readFileSync(join(dir, 'cert.pem')) }, async (req, res) => {
        try {
            const host = (req.headers.host || '').split(':')[0];
            const headers = new Headers();
            for (const [name, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(name, value);
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const init = { method: req.method, headers };
            if (!['GET', 'HEAD'].includes(req.method) && chunks.length) init.body = Buffer.concat(chunks);
            const request = new Request(`https://${host}${req.url}`, init);
            if (req.headers['x-test-country']) request.cf = { country: req.headers['x-test-country'] };
            const response = await worker.fetch(request, env, { waitUntil() {} });
            const out = {};
            response.headers.forEach((value, name) => { out[name] = value; });
            const cookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
            if (cookies.length) out['set-cookie'] = cookies;
            res.writeHead(response.status, out);
            res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(String((error && error.stack) || error));
        }
    });
    await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
    return { port: server.address().port, close: () => server.close() };
}

// ── Chrome por el protocolo de depuración (CDP) ─────────────────────────────

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function launchChrome({ harnessPort, debugPort = 9333 }) {
    if (!existsSync(CHROME)) throw new Error(`No encuentro Chrome en «${CHROME}». Use CHROME_PATH=…`);
    const profile = mkdtempSync(join(tmpdir(), 'elysium-chrome-'));
    const rules = HOSTS.map(host => `MAP ${host} 127.0.0.1:${harnessPort}`).join(',');
    const proc = spawn(CHROME, [
        '--headless=new', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`,
        `--host-resolver-rules=${rules}`, '--ignore-certificate-errors', '--no-first-run', '--disable-gpu',
        '--hide-scrollbars', 'about:blank'
    ], { stdio: 'ignore' });
    for (let attempt = 0; attempt < 60; attempt += 1) {
        try { await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json(); return { proc, port: debugPort, close: () => proc.kill('SIGKILL') }; } catch { await sleep(200); }
    }
    proc.kill('SIGKILL');
    throw new Error('Chrome no arrancó');
}

class Session {
    constructor(socket) {
        this.socket = socket; this.counter = 0; this.pending = new Map(); this.listeners = []; this.console = [];
        socket.addEventListener('message', event => {
            const message = JSON.parse(event.data);
            if (message.id && this.pending.has(message.id)) {
                const { resolve, reject } = this.pending.get(message.id);
                this.pending.delete(message.id);
                if (message.error) reject(new Error(JSON.stringify(message.error))); else resolve(message.result);
            } else if (message.method) {
                if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
                    this.console.push(`${message.params.type}: ${message.params.args.map(arg => arg.value ?? arg.description).join(' ')}`);
                }
                if (message.method === 'Runtime.exceptionThrown') {
                    this.console.push(`exception: ${message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text}`);
                }
                this.listeners.forEach(listener => listener(message));
            }
        });
    }
    send(method, params = {}) {
        const id = ++this.counter;
        this.socket.send(JSON.stringify({ id, method, params }));
        return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    }
    waitEvent(name, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`timeout ${name}`)), timeout);
            const listener = message => {
                if (message.method !== name) return;
                clearTimeout(timer);
                this.listeners = this.listeners.filter(other => other !== listener);
                resolve(message.params);
            };
            this.listeners.push(listener);
        });
    }
}

export async function newPage(chrome, { width = 1440, height = 900, acceptLanguage = null, country = null } = {}) {
    const target = await (await fetch(`http://127.0.0.1:${chrome.port}/json/new?about:blank`, { method: 'PUT' })).json();
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', reject); });
    const session = new Session(socket);
    for (const method of ['Page.enable', 'Runtime.enable', 'Network.enable']) await session.send(method);
    await session.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    const extra = {};
    if (acceptLanguage) extra['Accept-Language'] = acceptLanguage;
    if (country) extra['X-Test-Country'] = country;
    if (Object.keys(extra).length) await session.send('Network.setExtraHTTPHeaders', { headers: extra });
    if (acceptLanguage) {
        // `navigator.language` también sigue al navegador de quien visita.
        const { userAgent } = await session.send('Browser.getVersion');
        await session.send('Emulation.setUserAgentOverride', { userAgent, acceptLanguage });
    }
    const page = {
        session,
        async goto(url, { settle = 1200 } = {}) {
            const loaded = session.waitEvent('Page.loadEventFired', 20000).catch(() => null);
            await session.send('Page.navigate', { url });
            await loaded;
            await sleep(settle);
            return page.eval('location.href');
        },
        async eval(expression) {
            const result = await session.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
            if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
            return result.result.value;
        },
        async setViewport(w, h) { await session.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false }); await sleep(300); },
        async screenshot(path, clip) {
            const { data } = await session.send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
            writeFileSync(path, Buffer.from(data, 'base64'));
        },
        async close() { try { await fetch(`http://127.0.0.1:${chrome.port}/json/close/${target.id}`); } catch { /* ya cerrada */ } socket.close(); }
    };
    return page;
}
