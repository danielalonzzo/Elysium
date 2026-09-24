/**
 * Pruebas de la biblioteca oculta (`/library`, `worker/library.js`).
 *
 * Nada de esto se ve abriendo el sitio: que un libro subido no pueda leer la
 * sesión del CRM, que un no administrador no pueda publicar, que solo entre
 * HTML o que `.es` no sirva su propia copia. Se prueba el Worker real con un
 * `env.ASSETS` que lee las plantillas del repositorio y un KV en memoria. Los
 * tokens de Firebase se firman aquí con una clave RSA propia, y el `fetch` de
 * las claves públicas de Google devuelve la suya.
 *
 * Uso:  node --test scripts/library.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const worker = (await import(`file://${join(ROOT, 'worker', 'index.js')}`)).default;
const library = await import(`file://${join(ROOT, 'worker', 'library.js')}`);

const INDEX_TEMPLATE = readFileSync(join(ROOT, 'library', 'index.html'), 'utf8');
const READER_TEMPLATE = readFileSync(join(ROOT, 'library', 'reader.html'), 'utf8');
const LIBRARY_JS = readFileSync(join(ROOT, 'JS', 'library.js'), 'utf8');
const LIBRARY_ADMIN_JS = readFileSync(join(ROOT, 'JS', 'library-admin.js'), 'utf8');

// ── Entorno falso ─────────────────────────────────────────────────────────────

function memoryKv() {
    const entries = new Map();
    return {
        entries,
        async put(key, value, options = {}) {
            const bytes = value instanceof Uint8Array ? value : new TextEncoder().encode(String(value));
            entries.set(key, { bytes: new Uint8Array(bytes), metadata: options.metadata ?? null });
        },
        async get(key) {
            const entry = entries.get(key);
            return entry ? new TextDecoder().decode(entry.bytes) : null;
        },
        async getWithMetadata(key, options = {}) {
            const entry = entries.get(key);
            if (!entry) return { value: null, metadata: null };
            const value = options.type === 'stream'
                ? new Response(entry.bytes).body
                : new TextDecoder().decode(entry.bytes);
            return { value, metadata: entry.metadata };
        },
        async delete(key) { entries.delete(key); },
        async list({ prefix = '' } = {}) {
            const keys = [...entries.keys()].filter(name => name.startsWith(prefix)).sort()
                .map(name => ({ name, metadata: entries.get(name).metadata }));
            return { keys, list_complete: true };
        }
    };
}

function makeEnv(kv = memoryKv()) {
    return {
        LIBRARY: kv,
        ELYSIUM_API_ORIGIN: 'https://example.invalid',
        ASSETS: {
            async fetch(request) {
                const path = new URL(request.url).pathname;
                const body = path === '/library/' ? INDEX_TEMPLATE
                    : path === '/library/reader' ? READER_TEMPLATE
                        : null;
                if (body === null) return new Response('missing', { status: 404 });
                return new Response(body, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/html',
                        // Lo que añadiría `_headers` en `/*`.
                        'Content-Security-Policy': "default-src 'self'",
                        'Content-Signal': 'search=yes, ai-input=yes, ai-train=yes'
                    }
                });
            }
        }
    };
}

// ── Firebase falso ───────────────────────────────────────────────────────────

const KID = 'test-key';
const { publicKey, privateKey } = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
);
const publicJwk = { ...(await crypto.subtle.exportKey('jwk', publicKey)), kid: KID, alg: 'RS256', use: 'sig' };
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url === JWKS_URL) {
        return new Response(JSON.stringify({ keys: [publicJwk] }), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
        });
    }
    return realFetch(input, init);
};

const base64Url = bytes => Buffer.from(bytes).toString('base64url');

async function signToken(claims = {}, { kid = KID, key = privateKey } = {}) {
    const now = Math.floor(Date.now() / 1000);
    const header = base64Url(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }));
    const payload = base64Url(JSON.stringify({
        iss: 'https://securetoken.google.com/elysiumdr-eu',
        aud: 'elysiumdr-eu',
        sub: 'uid-daniel',
        iat: now - 10,
        auth_time: now - 10,
        exp: now + 3600,
        email: 'daniel.morales@elysiumdr.eu',
        email_verified: true,
        ...claims
    }));
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${payload}`));
    return `${header}.${payload}.${base64Url(new Uint8Array(signature))}`;
}

// ── Utilidades ────────────────────────────────────────────────────────────────

const BOOK_HTML = '<!doctype html>\n<html lang="pt-PT"><head><meta charset="utf-8"><title>Manual</title></head>'
    + '<body><p>Olá</p><a href="https://doi.org/x">doi</a></body></html>';

async function call(env, url, { method = 'GET', headers = {}, body } = {}) {
    const request = new Request(url, { method, headers, body });
    return worker.fetch(request, env);
}

async function publish(env, slug, { html = BOOK_HTML, token, meta = {}, contentType = 'text/html; charset=utf-8' } = {}) {
    const headers = {
        'Content-Type': contentType,
        'X-Library-Meta': encodeURIComponent(JSON.stringify({
            title: 'Manual de Técnicas de Expressão e Comunicação',
            description: 'Paulo Nunes da Silva',
            filename: 'Manual.html',
            ...meta
        }))
    };
    if (token !== null) headers.Authorization = `Bearer ${token ?? await signToken()}`;
    return call(env, `https://elysiumdr.eu/library/api/books/${slug}`, { method: 'PUT', headers, body: html });
}

function libraryData(html) {
    const match = /<script type="application\/json" id="library-data">([^<]*)<\/script>/.exec(html);
    assert.ok(match, 'the index must embed its catalogue');
    return JSON.parse(match[1]);
}

// ── Rutas ─────────────────────────────────────────────────────────────────────

test('/library sirve el índice con el catálogo incrustado y sin indexar', async () => {
    const env = makeEnv();
    assert.equal((await publish(env, 'manual')).status, 201);
    const response = await call(env, 'https://elysiumdr.eu/library');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.equal(response.headers.get('Content-Signal'), 'search=no, ai-input=no, ai-train=no');
    assert.match(response.headers.get('Cache-Control'), /no-cache/);
    // La CSP general del binding se conserva: la página usa Firebase.
    assert.equal(response.headers.get('Content-Security-Policy'), "default-src 'self'");
    const html = await response.text();
    assert.ok(!html.includes('{{'), 'no placeholder may survive');
    const data = libraryData(html);
    assert.equal(data.books.length, 1);
    assert.equal(data.books[0].slug, 'manual');
    assert.equal(data.configured, true);
});

test('una sola URL: mayúsculas, .html, barra final e index redirigen a /library', async () => {
    const env = makeEnv();
    for (const path of ['/Library', '/LIBRARY', '/library/', '/library.html', '/library/index', '/library/index.html']) {
        const response = await call(env, `https://elysiumdr.eu${path}?lang=pt`);
        assert.equal(response.status, 301, path);
        assert.equal(response.headers.get('Location'), path === '/LIBRARY' || path === '/Library'
            ? `https://elysiumdr.eu${path.toLowerCase()}?lang=pt`
            : 'https://elysiumdr.eu/library?lang=pt', path);
    }
    const book = await call(env, 'https://elysiumdr.eu/library/manual/');
    assert.equal(book.status, 301);
    assert.equal(book.headers.get('Location'), 'https://elysiumdr.eu/library/manual');
});

test('en .es y .pt la biblioteca redirige a .eu: existe en un solo origen', async () => {
    const env = makeEnv();
    for (const host of ['elysiumdr.es', 'elysiumdr.pt']) {
        const response = await call(env, `https://${host}/library/manual?lang=es`);
        assert.equal(response.status, 301);
        assert.equal(response.headers.get('Location'), 'https://elysiumdr.eu/library/manual?lang=es');
    }
});

test('el lector rellena la plantilla con el libro escapado', async () => {
    const env = makeEnv();
    await publish(env, 'manual', { meta: { title: 'Livro <script>alert(1)</script> & "citas"' } });
    const response = await call(env, 'https://elysiumdr.eu/library/manual');
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(!html.includes('<script>alert(1)</script>'), 'the title must be escaped');
    assert.match(html, /Livro &lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;citas&quot;/);
    assert.match(html, /<iframe class="library-frame" src="\/library\/manual\/book"/);
    assert.match(html, /sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals"/);
    assert.ok(!/sandbox="[^"]*allow-same-origin/.test(html), 'the iframe must never share the origin');
    assert.match(html, /data-audiobook="manual"/);
    assert.ok(!html.includes('{{'), 'no placeholder may survive');
    const data = JSON.parse(/<script type="application\/json" id="library-book">([^<]*)<\/script>/.exec(html)[1]);
    assert.equal(data.slug, 'manual');
    assert.equal(data.lang, 'pt-PT');
});

test('un libro inexistente responde 404 con el índice y el aviso', async () => {
    const env = makeEnv();
    const response = await call(env, 'https://elysiumdr.eu/library/no-existe');
    assert.equal(response.status, 404);
    assert.equal(libraryData(await response.text()).missing, 'no-existe');
    for (const path of ['/library/api', '/library/manual/otra', '/library/Mal%20Slug', '/library/reader']) {
        const other = await call(env, `https://elysiumdr.eu${path.toLowerCase()}`);
        assert.equal(other.status, 404, path);
    }
});

test('el libro se sirve aislado: CSP sandbox sin allow-same-origin y el ayudante de enlaces', async () => {
    const env = makeEnv();
    await publish(env, 'manual');
    const response = await call(env, 'https://elysiumdr.eu/library/manual/book');
    assert.equal(response.status, 200);
    const csp = response.headers.get('Content-Security-Policy');
    assert.match(csp, /^sandbox allow-scripts/);
    assert.ok(!csp.includes('allow-same-origin'));
    assert.match(csp, /frame-ancestors 'self'/);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
    const html = await response.text();
    const helper = html.indexOf('/* Elysium Library */');
    assert.ok(helper > 0 && helper < html.indexOf('</head>'), 'the helper goes inside <head>');
    assert.equal(html.replace(library.BOOK_HELPER, ''), BOOK_HTML, 'nothing else changes');
    // Sin esto, el índice del libro arrastra la página de Elysium en Chrome.
    assert.match(library.BOOK_HELPER, /Element\.prototype\.scrollIntoView = function/);
    assert.ok(!library.BOOK_HELPER.slice('<script>'.length, -'</script>'.length).includes('</script'), 'the helper cannot close its own tag');
});

test('la descarga es el fichero tal cual, como adjunto y sin ejecutarse', async () => {
    const env = makeEnv();
    await publish(env, 'manual', { meta: { filename: 'Manual de Técnicas.html' } });
    const response = await call(env, 'https://elysiumdr.eu/library/manual/download');
    assert.equal(response.status, 200);
    assert.equal(await response.text(), BOOK_HTML);
    assert.match(response.headers.get('Content-Disposition'), /^attachment; filename="Manual de Tecnicas.html"; filename\*=UTF-8''Manual%20de%20T%C3%A9cnicas.html$/);
    assert.match(response.headers.get('Content-Security-Policy'), /^sandbox;/);
});

// ── API ───────────────────────────────────────────────────────────────────────

test('solo publica la cuenta de Daniel, con el correo verificado', async () => {
    const env = makeEnv();
    assert.equal((await publish(env, 'manual', { token: null })).status, 401);
    const stranger = await publish(env, 'manual', { token: await signToken({ email: 'socio@example.com' }) });
    assert.equal(stranger.status, 403);
    assert.equal((await stranger.json()).code, 'library_admin_required');
    const unverified = await publish(env, 'manual', { token: await signToken({ email_verified: false }) });
    assert.equal(unverified.status, 403);
    // Ser administrador del CRM no da la biblioteca: ni el claim ni un rol.
    const claim = await publish(env, 'manual', { token: await signToken({ email: 'otra@elysiumdr.eu', admin: true }) });
    assert.equal(claim.status, 403);
    const role = await publish(env, 'manual', { token: await signToken({ email: 'otra@elysiumdr.eu', role: 'super_admin' }) });
    assert.equal(role.status, 403);
    assert.equal(env.LIBRARY.entries.size, 0);
    // La dirección no distingue mayúsculas.
    const daniel = await publish(env, 'manual', { token: await signToken({ email: 'Daniel.Morales@ElysiumDR.eu' }) });
    assert.equal(daniel.status, 201);
    assert.equal(env.LIBRARY.entries.size, 1);
});

test('un token falsificado, caducado o de otro proyecto no pasa', async () => {
    const env = makeEnv();
    const other = await crypto.subtle.generateKey(
        { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
        true,
        ['sign', 'verify']
    );
    const cases = {
        forged: await signToken({}, { key: other.privateKey }),
        expired: await signToken({ exp: Math.floor(Date.now() / 1000) - 5 }),
        project: await signToken({ aud: 'otro-proyecto' }),
        issuer: await signToken({ iss: 'https://securetoken.google.com/otro' }),
        unknownKey: await signToken({}, { kid: 'desconocida' }),
        garbage: 'no.es.untoken'
    };
    for (const [name, token] of Object.entries(cases)) {
        const response = await publish(env, 'manual', { token });
        assert.equal(response.status, 401, name);
    }
    assert.equal(env.LIBRARY.entries.size, 0);
});

test('solo entra HTML: ni otra extensión, ni binarios, ni fragmentos, ni otra codificación', async () => {
    const env = makeEnv();
    const pdf = await publish(env, 'libro', { meta: { filename: 'libro.pdf' } });
    assert.equal(pdf.status, 415);
    const type = await publish(env, 'libro', { contentType: 'application/pdf' });
    assert.equal(type.status, 415);
    const binary = await publish(env, 'libro', { html: new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e, 0x00, 0x01]) });
    assert.equal(binary.status, 415);
    const fragment = await publish(env, 'libro', { html: '<p>solo un párrafo</p>' });
    assert.equal((await fragment.json()).code, 'library_not_html');
    const latin1 = await publish(env, 'libro', { html: new Uint8Array([...new TextEncoder().encode('<!doctype html><title>'), 0xe9, 0x3c]) });
    assert.equal((await latin1.json()).code, 'library_not_utf8');
    const empty = await publish(env, 'libro', { html: '' });
    assert.equal(empty.status, 400);
    assert.equal(env.LIBRARY.entries.size, 0);
    // Un comentario o un BOM antes del doctype son HTML válido.
    const commented = await publish(env, 'libro', { html: '\uFEFF<!-- exportado -->\n<!DOCTYPE html><html><body></body></html>' });
    assert.equal(commented.status, 201);
});

test('una dirección ocupada no se pisa sin pedirlo, y se puede reemplazar y retirar', async () => {
    const env = makeEnv();
    assert.equal((await publish(env, 'manual')).status, 201);
    const taken = await publish(env, 'manual');
    assert.equal(taken.status, 409);
    assert.equal((await taken.json()).code, 'library_slug_taken');
    const replaced = await publish(env, 'manual', { meta: { replace: true, title: 'Segunda edición' } });
    assert.equal(replaced.status, 200);
    assert.equal((await replaced.json()).replaced, true);

    const list = await (await call(env, 'https://elysiumdr.eu/library/api/books')).json();
    assert.deepEqual(list.books.map(book => book.title), ['Segunda edición']);
    assert.ok(!('file' in list.books[0]), 'the catalogue does not expose internal fields');

    const anonymousDelete = await call(env, 'https://elysiumdr.eu/library/api/books/manual', { method: 'DELETE' });
    assert.equal(anonymousDelete.status, 401);
    const removed = await call(env, 'https://elysiumdr.eu/library/api/books/manual', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${await signToken()}` }
    });
    assert.equal(removed.status, 200);
    assert.equal(env.LIBRARY.entries.size, 0);
    assert.equal((await call(env, 'https://elysiumdr.eu/library/manual/book')).status, 404);
});

test('las direcciones de libro son slugs y no pueden chocar con las rutas propias', async () => {
    const env = makeEnv();
    for (const slug of ['api', 'reader', 'book', 'download', 'index', 'Mayus', 'con--doble', '-borde', 'a'.repeat(81)]) {
        const response = await publish(env, encodeURIComponent(slug));
        assert.equal(response.status, 400, slug);
    }
    assert.equal((await publish(env, 'manual-2023')).status, 201);
});

test('sin el binding de KV la biblioteca no se rompe: índice vacío y API 503', async () => {
    const env = makeEnv();
    delete env.LIBRARY;
    const index = await call(env, 'https://elysiumdr.eu/library');
    assert.equal(index.status, 200);
    assert.equal(libraryData(await index.text()).configured, false);
    assert.equal((await call(env, 'https://elysiumdr.eu/library/api/books')).status, 503);
});

// ── Piezas puras ─────────────────────────────────────────────────────────────

test('el ayudante entra antes de </head> aunque la etiqueta llegue partida', async () => {
    const chunks = ['<!doctype html><html><head><title>x</title></HE', 'AD><body>hola</body></html>'];
    const stream = new ReadableStream({
        start(controller) {
            chunks.forEach(chunk => controller.enqueue(new TextEncoder().encode(chunk)));
            controller.close();
        }
    });
    const out = await new Response(library.injectBeforeHeadClose(stream, '<script>1</script>')).text();
    assert.equal(out, '<!doctype html><html><head><title>x</title><script>1</script></HEAD><body>hola</body></html>');

    const noHead = new Response('<!doctype html><p>sin cabecera</p>').body;
    assert.equal(
        await new Response(library.injectBeforeHeadClose(noHead, '<i>')).text(),
        '<!doctype html><p>sin cabecera</p><i>'
    );
});

test('los metadatos siempre caben en el límite de KV', () => {
    const metadata = library.bookMetadata({
        title: 'Título '.repeat(40),
        description: 'Descripción con acentos áéíóú '.repeat(30),
        lang: 'pt-PT',
        size: 4394869,
        file: 'Ficheiro com nome muito comprido '.repeat(6) + '.html',
        uploadedAt: new Date().toISOString()
    });
    assert.ok(new TextEncoder().encode(JSON.stringify(metadata)).byteLength <= 1024);
    assert.ok(metadata.title.length > 0);
});

test('el MCP no entrega la biblioteca', async () => {
    const env = makeEnv();
    const response = await call(env, 'https://elysiumdr.eu/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_page', arguments: { path: '/library' } } })
    });
    const body = await response.json();
    assert.equal(body.result.isError, true);
    assert.match(body.result.content[0].text, /not part of the public site/);
});

// ── Plantillas y textos ──────────────────────────────────────────────────────

test('las dos plantillas llevan la cabecera y el pie de Elysium, y no se indexan', () => {
    for (const [name, html] of [['index', INDEX_TEMPLATE], ['reader', READER_TEMPLATE]]) {
        assert.match(html, /<html lang="en-GB" data-lang-switch="inline">/, name);
        assert.match(html, /<meta name="robots" content="noindex, nofollow">/, name);
        assert.match(html, /<nav class="navbar">/, name);
        assert.match(html, /<footer>/, name);
        assert.match(html, /<dialog class="library-dialog" data-audiobook-dialog/, name);
        assert.match(html, /href="https:\/\/elevenreader\.io\/"/, name);
        assert.match(html, /data-audiobook-download/, name);
        assert.match(html, /<script src="\/JS\/main\.js"><\/script>/, name);
        assert.match(html, /<script src="\/JS\/library\.js\?v=\d+" defer><\/script>/, name);
        // Rutas absolutas: el lector vive un nivel más abajo que el índice.
        assert.ok(!/(?:href|src)="(?!\/|https?:|mailto:|#|\?|\{\{)[^"]+"/.test(html), `${name}: relative URL`);
    }
});

function copyBlocks() {
    const start = LIBRARY_JS.indexOf('var COPY = {');
    const end = LIBRARY_JS.indexOf('\n    };', start);
    const source = LIBRARY_JS.slice(start, end);
    const blocks = {};
    for (const language of ['en', 'es', 'pt']) {
        const from = source.indexOf(`\n        ${language}: {`);
        const to = source.indexOf('\n        }', from);
        const block = source.slice(from, to);
        blocks[language] = Object.fromEntries(
            [...block.matchAll(/^ {12}(\w+): '((?:[^'\\]|\\.)*)'/gm)].map(match => [match[1], match[2]])
        );
    }
    return blocks;
}

test('los tres idiomas tienen las mismas claves y cubren las plantillas', () => {
    const blocks = copyBlocks();
    const english = Object.keys(blocks.en).sort();
    assert.ok(english.length > 60, 'the dictionary was read');
    assert.deepEqual(Object.keys(blocks.es).sort(), english, 'es');
    assert.deepEqual(Object.keys(blocks.pt).sort(), english, 'pt');

    const used = new Set();
    for (const html of [INDEX_TEMPLATE, READER_TEMPLATE]) {
        for (const match of html.matchAll(/data-i18n(?:-aria)?="(\w+)"/g)) used.add(match[1]);
    }
    for (const match of LIBRARY_ADMIN_JS.matchAll(/'(\w+)'/g)) {
        if (blocks.en[match[1]] !== undefined) used.add(match[1]);
    }
    for (const key of used) assert.ok(key in blocks.en, `missing copy: ${key}`);

    // Una traducción que se quedó en inglés.
    const untranslatable = new Set(['navContact', 'footerCompany', 'emailLabel']);
    for (const language of ['es', 'pt']) {
        for (const key of english) {
            if (untranslatable.has(key) || /ElevenReader|Elysium/.test(blocks.en[key]) && blocks.en[key].length < 30) continue;
            assert.notEqual(blocks[language][key], blocks.en[key], `${language}.${key} is still in English`);
        }
    }
});

test('el español va de usted y el portugués es europeo', () => {
    const { es, pt } = copyBlocks();
    const tuteo = /\b(tú|tu|tus|puedes|crea|descarga|sube|elige|escribe|revisa|espera|intenta|inicia|marca|disfruta)\b/i;
    for (const [key, value] of Object.entries(es)) assert.ok(!tuteo.test(value), `es.${key}: ${value}`);
    const brazilian = /\b(você|arquivo|baixar|tela|usuário|cadastr\w*|deletar|salvar)\b/i;
    for (const [key, value] of Object.entries(pt)) assert.ok(!brazilian.test(value), `pt.${key}: ${value}`);
    assert.match(es.audioIntro, /10 horas/);
    assert.match(pt.audioIntro, /10 horas/);
});
