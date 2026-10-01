/**
 * Pruebas de la biblioteca (`/library`, `worker/library.js`).
 *
 * Nada de esto se ve abriendo el sitio: que un libro subido no pueda leer la
 * sesión del CRM, que un no administrador no pueda publicar, que solo entre
 * HTML, que `.es` no sirva su propia copia, o que un buscador encuentre en el
 * lector lo que no puede leer dentro del iframe. Se prueba el Worker real con un
 * `env.ASSETS` que lee las plantillas del repositorio y un KV en memoria. Los
 * tokens de Firebase se firman aquí con una clave RSA propia, y el `fetch` de
 * las claves públicas de Google devuelve la suya.
 *
 * Uso:  node --test scripts/library.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const worker = (await import(`file://${join(ROOT, 'worker', 'index.js')}`)).default;
const library = await import(`file://${join(ROOT, 'worker', 'library.js')}`);

const INDEX_TEMPLATE = readFileSync(join(ROOT, 'library', 'index.html'), 'utf8');
const READER_TEMPLATE = readFileSync(join(ROOT, 'library', 'reader.html'), 'utf8');
const LIBRARY_JS = readFileSync(join(ROOT, 'JS', 'library.js'), 'utf8');
const LIBRARY_ADMIN_JS = readFileSync(join(ROOT, 'JS', 'library-admin.js'), 'utf8');
const LIBRARY_CSS = readFileSync(join(ROOT, 'CSS', 'library.css'), 'utf8');
const PAGES_CSS = readFileSync(join(ROOT, 'CSS', 'pages.css'), 'utf8');

// ── Entorno falso ─────────────────────────────────────────────────────────────

function memoryKv() {
    const entries = new Map();
    return {
        entries,
        async put(key, value, options = {}) {
            let bytes;
            if (value instanceof Uint8Array) {
                bytes = value;
            } else if (value instanceof ArrayBuffer) {
                bytes = new Uint8Array(value);
            } else {
                bytes = new TextEncoder().encode(String(value));
            }
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
/** Lo que el Worker manda fuera, salvo las claves de Firebase. */
const outbound = [];
globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url === 'https://api.indexnow.org/indexnow') {
        outbound.push({ url, body: JSON.parse(init.body) });
        return new Response(null, { status: 202 });
    }
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

async function call(env, url, { method = 'GET', headers = {}, body, ctx } = {}) {
    const request = new Request(url, { method, headers, body });
    return worker.fetch(request, env, ctx);
}

/** Los libros guardados, sin contar su `info:`. */
function storedBooks(env) {
    return [...env.LIBRARY.entries.keys()].filter(key => key.startsWith('book:')).length;
}

function jsonLd(html) {
    const match = /<script type="application\/ld\+json">([^<]*)<\/script>/.exec(html);
    assert.ok(match, 'the page must carry structured data');
    return JSON.parse(match[1])['@graph'];
}

async function publish(env, slug, { html = BOOK_HTML, token, meta = {}, contentType = 'text/html; charset=utf-8', ctx } = {}) {
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
    return call(env, `https://elysiumdr.eu/library/api/books/${slug}`, { method: 'PUT', headers, body: html, ctx });
}

function libraryData(html) {
    const match = /<script type="application\/json" id="library-data">([^<]*)<\/script>/.exec(html);
    assert.ok(match, 'the index must embed its catalogue');
    return JSON.parse(match[1]);
}

// ── Rutas ─────────────────────────────────────────────────────────────────────

test('/library sirve el índice indexable, con las tarjetas ya pintadas y el catálogo incrustado', async () => {
    const env = makeEnv();
    assert.equal((await publish(env, 'manual')).status, 201);
    const response = await call(env, 'https://elysiumdr.eu/library');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Robots-Tag'), null);
    // Encontrar y citar, sí; entrenar con libros de terceros, no.
    assert.equal(response.headers.get('Content-Signal'), 'search=yes, ai-input=yes, ai-train=no');
    assert.match(response.headers.get('Cache-Control'), /no-cache/);
    // La CSP general del binding se conserva: la página usa Firebase.
    assert.equal(response.headers.get('Content-Security-Policy'), "default-src 'self'");
    const html = await response.text();
    assert.ok(!html.includes('{{'), 'no placeholder may survive');
    assert.match(html, /<meta name="robots" content="index, follow/);
    assert.match(html, /<link rel="canonical" href="https:\/\/elysiumdr\.eu\/library">/);
    // Sin JavaScript (como leen casi todos los rastreadores) el libro ya está.
    assert.match(html, /<article class="library-card" data-book="manual">/);
    assert.match(html, /<h3 lang="pt-PT"><a href="\/library\/manual">Manual de Técnicas de Expressão e Comunicação<\/a><\/h3>/);
    const [page] = jsonLd(html);
    assert.equal(page['@type'], 'CollectionPage');
    assert.deepEqual(page.mainEntity.itemListElement.map(item => item.url), ['https://elysiumdr.eu/library/manual']);
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

test('la biblioteca se sirve en .es, .pt y .com como espejo noindex de .eu: la región no se pierde', async () => {
    const env = makeEnv();
    await publish(env, 'manual');
    for (const host of ['elysiumdr.es', 'elysiumdr.pt', 'elysiumdr.com']) {
        const index = await call(env, `https://${host}/library`);
        assert.equal(index.status, 200, host);
        const indexHtml = await index.text();
        assert.match(indexHtml, /<link rel="canonical" href="https:\/\/elysiumdr\.eu\/library">/, host);
        assert.match(indexHtml, /<meta name="robots" content="noindex, follow">/, host);
        assert.equal(index.headers.get('X-Robots-Tag'), 'noindex, follow', host);

        const reader = await call(env, `https://${host}/library/manual`);
        assert.equal(reader.status, 200, host);
        const readerHtml = await reader.text();
        assert.match(readerHtml, /<link rel="canonical" href="https:\/\/elysiumdr\.eu\/library\/manual">/, host);
        assert.equal(reader.headers.get('X-Robots-Tag'), 'noindex, follow', host);
        // El iframe del libro es del propio dominio: la región no cambia ni al leer.
        assert.match(readerHtml, /src="\/library\/manual\/book"/, host);

        const book = await call(env, `https://${host}/library/manual/book`);
        assert.equal(book.status, 200, host);
        assert.equal(book.headers.get('X-Robots-Tag'), 'noindex', `${host}: sin «indexifembedded» fuera de .eu`);
        assert.equal((await call(env, `https://${host}/library/manual/download`)).status, 200, host);

        // El sitemap y las URL que anuncia son de `.eu`.
        const sitemap = await call(env, `https://${host}/library/sitemap.xml`);
        assert.equal(sitemap.status, 301, host);
        assert.equal(sitemap.headers.get('Location'), 'https://elysiumdr.eu/library/sitemap.xml', host);
    }
    // `.eu` sigue siendo el indexable.
    const primary = await call(env, 'https://elysiumdr.eu/library/manual');
    assert.equal(primary.headers.get('X-Robots-Tag'), null);
    assert.equal((await call(env, 'https://elysiumdr.eu/library/manual/book')).headers.get('X-Robots-Tag'), 'noindex, indexifembedded');
});

test('la biblioteca de un espejo canoniza sus URL dentro del propio dominio', async () => {
    const env = makeEnv();
    const response = await call(env, 'https://elysiumdr.pt/Library/');
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('Location'), 'https://elysiumdr.pt/library/');
});

test('el lector rellena la plantilla con el libro escapado', async () => {
    const env = makeEnv();
    await publish(env, 'manual', { meta: { title: 'Livro <script>alert(1)</script> & "citas"' } });
    const response = await call(env, 'https://elysiumdr.eu/library/manual');
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(!html.includes('<script>alert(1)</script>'), 'the title must be escaped');
    assert.match(html, /Livro &lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;citas&quot;/);
    assert.match(html, /<iframe class="library-frame" name="library-book" src="\/library\/manual\/book"/);
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
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, follow');
    const html = await response.text();
    assert.match(html, /<meta name="robots" content="noindex, follow">/);
    assert.equal(libraryData(html).missing, 'no-existe');
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
    // Suelto no se indexa; enmarcado en el lector, su texto cuenta para él.
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, indexifembedded');
    assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
    const html = await response.text();
    const helper = html.indexOf('/* Elysium Library */');
    assert.ok(helper > 0 && helper < html.indexOf('</head>'), 'the helper goes inside <head>');
    assert.equal(html.replace(library.BOOK_HELPER, ''), BOOK_HTML, 'nothing else changes');
    // Sin esto, el índice del libro arrastra la página de Elysium en Chrome.
    assert.match(library.BOOK_HELPER, /Element\.prototype\.scrollIntoView = function/);
    // El empaquetador de Cloudflare (esbuild) envuelve funciones con __name; el navegador no lo tiene.
    assert.match(library.BOOK_HELPER, /var __name\s*=\s*function/);
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
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
});

test('HEAD devuelve las mismas cabeceras de seguridad que GET, sin cuerpo', async () => {
    const env = makeEnv();
    await publish(env, 'manual');
    for (const path of ['book', 'download']) {
        const get = await call(env, `https://elysiumdr.eu/library/manual/${path}`);
        const head = await call(env, `https://elysiumdr.eu/library/manual/${path}`, { method: 'HEAD' });
        assert.equal(head.status, 200, path);
        assert.equal(await head.text(), '', path);
        for (const name of ['Content-Security-Policy', 'Content-Disposition', 'X-Robots-Tag', 'Content-Type']) {
            assert.equal(head.headers.get(name), get.headers.get(name), `${path} ${name}`);
        }
    }
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
    assert.equal(storedBooks(env), 1);
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
    // Con el libro se va también su índice (`info:`).
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

test('las propuestas de digitalización se guardan y solo el administrador las gestiona', async () => {
    const env = makeEnv();

    // Envío anónimo por JSON
    const res1 = await call(env, 'https://elysiumdr.eu/library/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Lectora Interesada',
            email: 'lectora@example.com',
            message: 'Propongo transcribir este libro clásico de filosofía.',
            lang: 'es'
        })
    });
    assert.equal(res1.status, 201);
    const body1 = await res1.json();
    assert.ok(body1.ok);
    assert.ok(body1.id);

    // Envío anónimo con FormData y archivo
    const form = new FormData();
    form.append('name', 'Investigador');
    form.append('email', 'investigador@example.com');
    form.append('message', 'Adjunto escaneo del documento en PDF.');
    form.append('lang', 'es');
    const fakeFile = new Blob(['%PDF-1.4 contenido simulado del libro'], { type: 'application/pdf' });
    form.append('file', fakeFile, 'documento-antiguo.pdf');

    const res2 = await call(env, 'https://elysiumdr.eu/library/api/proposals', {
        method: 'POST',
        body: form
    });
    assert.equal(res2.status, 201);
    const body2 = await res2.json();
    assert.ok(body2.id);

    // Acceso no autenticado a listar propuestas -> 401
    const anonGet = await call(env, 'https://elysiumdr.eu/library/api/proposals');
    assert.equal(anonGet.status, 401);

    // Acceso autenticado como Daniel
    const adminToken = await signToken();
    const adminGet = await call(env, 'https://elysiumdr.eu/library/api/proposals', {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(adminGet.status, 200);
    const list = await adminGet.json();
    assert.equal(list.proposals.length, 2);
    const withFile = list.proposals.find(p => p.id === body2.id);
    assert.ok(withFile);
    assert.equal(withFile.hasFile, true);
    assert.equal(withFile.fileName, 'documento-antiguo.pdf');

    // Descarga del archivo adjunto por el admin
    const fileRes = await call(env, `https://elysiumdr.eu/library/api/proposals/${body2.id}/file`, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(fileRes.status, 200);
    assert.match(fileRes.headers.get('Content-Disposition') || '', /documento-antiguo\.pdf/);
    assert.equal(await fileRes.text(), '%PDF-1.4 contenido simulado del libro');

    // Actualización de estado
    const patchRes = await call(env, `https://elysiumdr.eu/library/api/proposals/${body2.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'in_progress' })
    });
    assert.equal(patchRes.status, 200);
    const patchData = await patchRes.json();
    assert.equal(patchData.proposal.status, 'in_progress');

    // Eliminación de propuesta
    const delRes = await call(env, `https://elysiumdr.eu/library/api/proposals/${body1.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(delRes.status, 200);
    const afterDel = await call(env, 'https://elysiumdr.eu/library/api/proposals', {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal((await afterDel.json()).proposals.length, 1);
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

// ── Buscadores ───────────────────────────────────────────────────────────────

const OUTLINED_BOOK = `<!doctype html>
<html lang="pt-PT"><head><meta charset="utf-8"><title>Manual</title>
<meta content="Paulo Nunes da Silva" name="author">
<meta name="description" content="Descrição escrita no próprio livro.">
</head><body>
<h1>Manual de Técnicas de Expressão e Comunicação</h1>
<section class="front" id="apresentacao"><h2>Apresenta&#231;&#227;o</h2></section>
<section class="chapter" id="cap-1"><header class="chap-head"><span class="chap-num">Capítulo 1</span><h2>Discurso académico &amp; literacia</h2></header>
<h3 id="s-1-1">1.1. Literacia e <em>discurso</em> académico</h3>
<h3>Notas</h3>
</section>
<section class="chapter" id="cap-2"><h2>Estilo formal</h2>
<h3 id="s-2-1">2.1. Princípios</h3>
<h3>Notas</h3>
</section>
<div id="solto"></div><h2>Sem âncora</h2>
</body></html>`;

test('del libro se sacan autor, descripción e índice, con el ancla de cada capítulo', () => {
    const info = library.extractBookInfo(OUTLINED_BOOK);
    assert.equal(info.author, 'Paulo Nunes da Silva');
    assert.equal(info.description, 'Descrição escrita no próprio livro.');
    assert.deepEqual(info.outline.map(entry => [entry.l, entry.t, entry.id]), [
        [1, 'Manual de Técnicas de Expressão e Comunicação', ''],
        [2, 'Apresentação', 'apresentacao'],
        // El id está en la <section> que abre el capítulo, no en el título.
        [2, 'Discurso académico & literacia', 'cap-1'],
        [3, '1.1. Literacia e discurso académico', 's-1-1'],
        [2, 'Estilo formal', 'cap-2'],
        [3, '2.1. Princípios', 's-2-1'],
        // Un contenedor ya cerrado no presta su id: mejor sin enlace.
        [2, 'Sem âncora', '']
    ]);
    // «Notas» se repite en cada capítulo: no orienta y no entra.
    assert.ok(!info.outline.some(entry => entry.t === 'Notas'));
    assert.deepEqual(library.extractBookInfo('<!doctype html><p>sin títulos</p>').outline, []);
});

test('el lector escribe lo que lee un buscador: canónica, datos estructurados, índice y más libros', async () => {
    const env = makeEnv();
    await publish(env, 'manual', { html: OUTLINED_BOOK, meta: { description: '' } });
    await publish(env, 'outro', { meta: { title: 'Outro livro', description: 'Uma descrição' } });
    const response = await call(env, 'https://elysiumdr.eu/library/manual');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Robots-Tag'), null);
    assert.equal(response.headers.get('Content-Signal'), 'search=yes, ai-input=yes, ai-train=no');
    const html = await response.text();
    assert.ok(!html.includes('{{'), 'no placeholder may survive');
    assert.match(html, /<title>Manual de Técnicas de Expressão e Comunicação — Elysium λ Library<\/title>/);
    assert.match(html, /<link rel="canonical" href="https:\/\/elysiumdr\.eu\/library\/manual">/);
    // Sin descripción propia, la del libro.
    assert.match(html, /<meta name="description" content="Descrição escrita no próprio livro\.">/);
    assert.match(html, /<meta property="og:locale" content="pt_PT">/);
    assert.match(html, /<p class="library-about-author" lang="pt-PT">Paulo Nunes da Silva<\/p>/);

    // El índice salta dentro del iframe por su nombre, también sin JavaScript.
    assert.match(html, /<a href="\/library\/manual\/book#cap-1" target="library-book" data-library-toc>Discurso académico &amp; literacia<\/a><ol><li><a href="\/library\/manual\/book#s-1-1" target="library-book" data-library-toc>1\.1\. Literacia e discurso académico<\/a><\/li><\/ol>/);
    assert.match(html, /<li><span>Sem âncora<\/span><\/li>/);
    const toc = /<ol class="library-toc-list"[^>]*>([\s\S]*?)<\/ol>\s*<\/nav>/.exec(html)[1];
    assert.ok(!toc.includes('Manual de Técnicas'), 'the title is not a chapter');
    assert.match(html, /<nav class="library-toc" aria-labelledby="library-toc-title" >/);

    // El resto de la biblioteca, enlazado desde cada libro.
    assert.match(html, /<a href="\/library\/outro" lang="pt-PT"><span class="library-more-title">Outro livro<\/span>/);
    const more = /<ul class="library-more-list">([\s\S]*?)<\/ul>/.exec(html)[1];
    assert.match(more, /href="\/library\/outro"/);
    assert.ok(!more.includes('href="/library/manual"'), 'a book does not recommend itself');

    const [book, crumbs] = jsonLd(html);
    assert.equal(book['@type'], 'Book');
    assert.equal(book.url, 'https://elysiumdr.eu/library/manual');
    assert.equal(book.inLanguage, 'pt-PT');
    assert.equal(book.isAccessibleForFree, true);
    assert.deepEqual(book.author, { '@type': 'Person', name: 'Paulo Nunes da Silva' });
    assert.deepEqual(book.hasPart.map(part => part.name), ['Apresentação', 'Discurso académico & literacia', 'Estilo formal', 'Sem âncora']);
    assert.ok(!('publisher' in book) && !('isbn' in book), 'nothing about the original edition');
    assert.deepEqual(crumbs.itemListElement.map(item => item.item), [
        'https://elysiumdr.eu/', 'https://elysiumdr.eu/library', 'https://elysiumdr.eu/library/manual'
    ]);

    // Un libro sin índice ni otros libros no deja secciones vacías a la vista.
    const lonely = makeEnv();
    await publish(lonely, 'solo');
    const plain = await (await call(lonely, 'https://elysiumdr.eu/library/solo')).text();
    assert.match(plain, /<nav class="library-toc" aria-labelledby="library-toc-title" hidden>/);
    assert.match(plain, /<div class="library-more" hidden>/);
    assert.ok(!/"author"/.test(JSON.stringify(jsonLd(plain)[0])), 'no invented author');
});

test('un libro subido antes del índice lo calcula al abrirse y lo guarda', async () => {
    const env = makeEnv();
    await env.LIBRARY.put('book:antigo', new TextEncoder().encode(OUTLINED_BOOK), {
        metadata: library.bookMetadata({ title: 'Antigo', description: '', lang: 'pt-PT', size: 900, file: 'antigo.html', uploadedAt: '2026-09-24T10:00:00.000Z' })
    });
    assert.ok(!env.LIBRARY.entries.has('info:antigo'));
    const html = await (await call(env, 'https://elysiumdr.eu/library/antigo')).text();
    assert.match(html, /book#cap-1/);
    assert.ok(env.LIBRARY.entries.has('info:antigo'));
    // Y una versión vieja de `info:` se recalcula.
    await env.LIBRARY.put('info:antigo', JSON.stringify({ v: 0, outline: [] }));
    await call(env, 'https://elysiumdr.eu/library/antigo');
    assert.equal(JSON.parse(await env.LIBRARY.get('info:antigo')).v, 1);
});

test('la biblioteca tiene su propio sitemap con el índice y cada libro', async () => {
    const env = makeEnv();
    await publish(env, 'manual');
    const response = await call(env, 'https://elysiumdr.eu/library/sitemap.xml');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'application/xml; charset=utf-8');
    const xml = await response.text();
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    assert.match(xml, /<loc>https:\/\/elysiumdr\.eu\/library<\/loc>\n    <lastmod>\d{4}-\d\d-\d\dT/);
    assert.match(xml, /<loc>https:\/\/elysiumdr\.eu\/library\/manual<\/loc>/);
    assert.equal((xml.match(/<url>/g) || []).length, 2);
    const head = await call(env, 'https://elysiumdr.eu/library/sitemap.xml', { method: 'HEAD' });
    assert.equal(await head.text(), '');
    // En los dominios nacionales, al único origen.
    const national = await call(env, 'https://elysiumdr.pt/library/sitemap.xml');
    assert.equal(national.headers.get('Location'), 'https://elysiumdr.eu/library/sitemap.xml');
});

test('la biblioteca se instala como app: manifest con ámbito propio e iconos que existen', async () => {
    const response = await call(makeEnv(), 'https://elysiumdr.eu/library/manifest.webmanifest');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('Content-Type'), /^application\/manifest\+json/);
    const manifest = await response.json();
    assert.equal(manifest.scope, '/library');
    assert.ok(manifest.start_url.startsWith(manifest.scope), 'the start page must be inside the scope');
    assert.equal(manifest.display, 'standalone');
    for (const icon of manifest.icons) assert.ok(existsSync(join(ROOT, icon.src)), icon.src);
});

test('publicar y retirar avisa a IndexNow, solo desde el dominio de verdad', async () => {
    assert.equal(readFileSync(join(ROOT, `${library.INDEXNOW_KEY}.txt`), 'utf8'), library.INDEXNOW_KEY);
    const env = makeEnv();
    const waits = [];
    const ctx = { waitUntil: promise => waits.push(promise) };
    outbound.length = 0;

    assert.equal((await publish(env, 'manual', { ctx })).status, 201);
    await Promise.all(waits);
    assert.equal(outbound.length, 1);
    assert.deepEqual(outbound[0].body, {
        host: 'elysiumdr.eu',
        key: library.INDEXNOW_KEY,
        keyLocation: `https://elysiumdr.eu/${library.INDEXNOW_KEY}.txt`,
        urlList: ['https://elysiumdr.eu/library/manual', 'https://elysiumdr.eu/library']
    });

    await call(env, 'https://elysiumdr.eu/library/api/books/manual', {
        method: 'DELETE', headers: { Authorization: `Bearer ${await signToken()}` }, ctx
    });
    await Promise.all(waits);
    assert.equal(outbound.length, 2);

    // `wrangler dev` o una copia en otro host no avisan a ningún buscador.
    const local = await call(env, 'http://localhost:8787/library/api/books/local', {
        method: 'PUT',
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Library-Meta': encodeURIComponent(JSON.stringify({ title: 'Local', filename: 'local.html' })),
            Authorization: `Bearer ${await signToken()}`
        },
        body: BOOK_HTML,
        ctx
    });
    assert.equal(local.status, 201);
    await Promise.all(waits);
    assert.equal(outbound.length, 2);
});

// ── El pie del sitio ─────────────────────────────────────────────────────────

/**
 * El idioma de una página del portafolio. `_national/com/` es el sitio global:
 * inglés en su raíz y español/portugués en sus carpetas.
 */
function pageLanguage(path) {
    const match = /^(?:_national\/com\/|_national\/)?(es|pt)\//.exec(path);
    return match ? match[1] : 'en';
}

/** Las páginas del portafolio: la raíz, las traducciones y las bases nacionales. */
function portfolioPages() {
    const skip = /^(?:Prototipos|Demo-arbol|VALTRIX Engineering|ONCORE|Dr-Johnny-Piedra|proyecto|Gestor-Patrimonios|CV|Titulos|node_modules|backend|\.)/;
    return readdirSync(ROOT, { recursive: true })
        .map(String)
        .filter(path => path.endsWith('.html') && !skip.test(path) && !/(?:^|\/)(?:node_modules|_comercial|[^/]+\.nosync)\//.test(path));
}

test('todas las páginas con pie completo enlazan la biblioteca, también en móvil, y en el menú si tienen navegación completa', () => {
    let checked = 0;
    for (const path of portfolioPages()) {
        const html = readFileSync(join(ROOT, path), 'utf8');
        if (!html.includes('footer-links')) continue;
        checked += 1;
        const footerAt = html.indexOf('<footer');
        const footer = html.slice(footerAt);
        // La biblioteca se sirve en los cuatro dominios: el enlace es relativo y
        // no saca a nadie de su región (antes, en `.es`, `.pt` y `.com`, iba a `.eu`).
        const href = '/library';
        const label = pageLanguage(path) === 'en' ? 'Library' : 'Biblioteca';
        assert.match(footer, new RegExp(`<li class="footer-library"><a href="${href.replaceAll('.', '\\.')}"(?: data-i18n="\\w+")?>${label}</a></li>`), path);
        // En móvil el pie esconde la columna «Empresa» (repite el menú), pero
        // el enlace de la biblioteca tiene que seguir a la vista.
        const mobileRule = html.includes('pages.css') ? PAGES_CSS : html;
        assert.match(mobileRule, /footer \.footer-grid \.footer-col:nth-child\(2\) li:not\(\.footer-library\)/, `${path}: mobile footer`);
        const navbar = html.slice(html.indexOf('<nav'), html.indexOf('</nav>'));
        if (/portfolio|portafolio|portefólio/i.test(navbar)) {
            assert.match(navbar, new RegExp(`<a href="${href.replaceAll('.', '\\.')}" class="nav-link(?: active)?"(?: data-i18n="[^"]*")?>${label}</a>`), `${path}: header links library`);
        }
    }
    assert.ok(checked >= 80, `only ${checked} pages were checked`);
});

test('todas las páginas con pie completo enlazan Gestor de Patrimonio justo debajo de la biblioteca, en cada idioma, en móvil y en el menú', () => {
    const LABELS = { en: 'Wealth Manager', es: 'Gestor de Patrimonio', pt: 'Gestor de Património' };
    let checked = 0;
    for (const path of portfolioPages()) {
        const html = readFileSync(join(ROOT, path), 'utf8');
        if (!html.includes('footer-links')) continue;
        checked += 1;
        const footer = html.slice(html.indexOf('<footer'));
        const national = path.startsWith('_national/');
        const lang = pageLanguage(path);
        const href = national ? 'https://elysiumdr.eu/Gestor-Patrimonios/' : '/Gestor-Patrimonios/';
        // Las páginas que traducen el pie con JavaScript llevan `data-i18n` y el texto en inglés de partida.
        const anchor = new RegExp(`<a href="${href.replaceAll('.', '\\.')}"(?: data-i18n="footerPatrimonio">${LABELS.en}|>${LABELS[lang]})</a>`);
        assert.match(footer, new RegExp(`<li class="footer-library"><a href="[^"]*library"[^>]*>[^<]+</a></li>\\s*<li class="footer-library">${anchor.source}</li>`), `${path}: debajo de Library`);
        // Lleva la clase de Library: el pie móvil esconde la columna «Empresa» salvo esa clase.
        const mobileRule = html.includes('pages.css') ? PAGES_CSS : html;
        assert.match(mobileRule, /footer \.footer-grid \.footer-col:nth-child\(2\) li:not\(\.footer-library\)/, `${path}: mobile footer`);
        const navbar = html.slice(html.indexOf('<nav'), html.indexOf('</nav>'));
        if (/portfolio|portafolio|portefólio/i.test(navbar)) {
            const navAnchor = new RegExp(`<a href="${href.replaceAll('.', '\\.')}" class="nav-link(?: active)?"(?: data-i18n="[^"]*")?>${LABELS[lang]}</a>`);
            assert.match(navbar, navAnchor, `${path}: header links Gestor-Patrimonios`);
        }
    }
    assert.ok(checked >= 80, `only ${checked} pages were checked`);
});

test('el pie traducido por JavaScript trae «Gestor de Patrimonio» en los tres idiomas', () => {
    const labels = ['Wealth Manager', 'Gestor de Patrimonio', 'Gestor de Património'];
    for (const file of ['JS/library.js', 'JS/profiles.js']) {
        const source = readFileSync(join(ROOT, file), 'utf8');
        const found = [...source.matchAll(/footerPatrimonio: '([^']+)'/g)].map(match => match[1]);
        assert.deepEqual(found, labels, file);
    }
    for (const template of ['library/index.html', 'library/reader.html', 'profiles.html']) {
        assert.match(readFileSync(join(ROOT, template), 'utf8'), /<li class="footer-library"><a href="\/Gestor-Patrimonios\/" data-i18n="footerPatrimonio">Wealth Manager<\/a><\/li>/, template);
        assert.match(readFileSync(join(ROOT, template), 'utf8'), /<a href="\/Gestor-Patrimonios\/" class="nav-link" data-i18n="navPatrimonio">Wealth Manager<\/a>/, template);
    }
});

test('en pantalla completa no hay nada de Elysium encima: el botón de salir es del libro', () => {
    assert.equal((READER_TEMPLATE.match(/data-immersive-open/g) || []).length, 2);
    assert.ok(!/library-immersive-(?:close|bar)/.test(READER_TEMPLATE + LIBRARY_CSS), 'no Elysium control over the book');
    assert.match(READER_TEMPLATE, /<iframe class="library-frame" name="library-book"/);
    assert.match(LIBRARY_JS, /root\.requestFullscreen \|\| root\.webkitRequestFullscreen/);
    assert.match(LIBRARY_JS, /document\.exitFullscreen \|\| document\.webkitExitFullscreen/);
    assert.match(LIBRARY_JS, /addEventListener\('fullscreenchange'/);
    // Solo se escucha al propio libro.
    assert.match(LIBRARY_JS, /event\.source !== frame\.contentWindow/);
    // La página le dice al libro el modo; el libro le devuelve salir y Escape.
    assert.match(LIBRARY_JS, /frame\.contentWindow\.postMessage\(\{ elysiumLibrary: 'immersive', value: active \}, '\*'\)/);
    assert.match(LIBRARY_JS, /if \(type === 'exit'\) exit\(\);/);
    assert.match(library.BOOK_HELPER, /document\.querySelector\('\[data-library-exit\]'\)/);
    assert.match(library.BOOK_HELPER, /event\.source !== window\.parent/);
    assert.match(library.BOOK_HELPER, /send\('exit'\)/);
    assert.match(library.BOOK_HELPER, /send\('escape'\)/);
    // El iframe cambia de tamaño, no de sitio: no se recarga el libro.
    assert.match(LIBRARY_CSS, /html\.library-immersive \.library-frame \{[^}]*position: fixed;[^}]*width: calc\(100vw/);
});

test('toda la tarjeta abre el libro y los botones siguen siendo botones', () => {
    // El enlace del título se estira sobre la tarjeta; lo que se pulsa encima
    // (leer, audiolibro, retirar) queda por delante.
    assert.match(LIBRARY_CSS, /\.library-card h3 a::after \{[^}]*content: "";[^}]*position: absolute;[^}]*inset: 0;/);
    assert.match(LIBRARY_CSS, /\.library-card \{[^}]*position: relative;/);
    assert.match(LIBRARY_CSS, /\.library-card-actions \{[^}]*position: relative;[^}]*z-index: 1;/);
    assert.match(LIBRARY_CSS, /\.library-delete \{[^}]*position: relative;[^}]*z-index: 1;/);
    // Sin JavaScript también: la tarjeta pintada en servidor lleva el enlace en el título.
    assert.match(library.renderBookCards([{ slug: 'x', title: 'X', lang: 'pt-PT', size: 1, uploadedAt: null, description: '' }]), /<h3 lang="pt-PT"><a href="\/library\/x">X<\/a><\/h3>/);
});

test('las traducciones guardadas se sirven con ?lang= y el lector las ofrece', async () => {
    const env = makeEnv();
    await publish(env, 'manual');
    const translated = BOOK_HTML.replace('lang="pt-PT"', 'lang="en-GB"').replace('Olá', 'Hello');
    await env.LIBRARY.put('tr:manual:en-GB', translated, { metadata: { v: 1, lang: 'en-GB', size: translated.length, file: 'Manual.html' } });
    const info = JSON.parse(await env.LIBRARY.get('info:manual'));
    await env.LIBRARY.put('info:manual', JSON.stringify({ ...info, translations: ['en-GB'] }));

    const book = await call(env, 'https://elysiumdr.eu/library/manual/book?lang=en-GB');
    assert.equal(book.status, 200);
    assert.match(await book.text(), /Hello/);
    assert.match(book.headers.get('Content-Security-Policy'), /^sandbox allow-scripts/);
    const download = await call(env, 'https://elysiumdr.eu/library/manual/download?lang=en-GB');
    assert.match(download.headers.get('Content-Disposition'), /filename="Manual\.en-GB\.html"/);
    assert.equal((await call(env, 'https://elysiumdr.eu/library/manual/book?lang=fr-FR')).status, 404);
    assert.equal((await call(env, 'https://elysiumdr.eu/library/manual/book?lang=es-ES')).status, 404);

    const reader = await (await call(env, 'https://elysiumdr.eu/library/manual')).text();
    const data = JSON.parse(/<script type="application\/json" id="library-book">([^<]*)<\/script>/.exec(reader)[1]);
    assert.deepEqual(data.translations, ['en-GB']);
    assert.match(READER_TEMPLATE, /data-library-lang hidden/);
    assert.ok(existsSync(join(ROOT, 'Images', 'Optimized', 'flag-gb-64.webp')), 'the UK flag exists');

    // La tarjeta del índice lleva una etiqueta por idioma, sacada de los metadatos.
    const metadata = library.bookMetadata({ title: 'Manual', description: '', lang: 'pt-PT', size: 1, file: 'Manual.html', uploadedAt: null, translations: ['en-GB', 'es-ES', 'xx'] });
    assert.deepEqual(metadata.tr, ['en-GB', 'es-ES']);
    const cards = library.renderBookCards([{ slug: 'manual', title: 'Manual', lang: 'pt-PT', size: 1, uploadedAt: null, description: '', translations: ['en-GB', 'es-ES'] }]);
    assert.match(cards, /<span class="library-card-langs"><span class="library-chip" lang="en-GB">Portuguese<\/span><span class="library-chip library-chip-translation" lang="en-GB">English<\/span><span class="library-chip library-chip-translation" lang="en-GB">Spanish<\/span><\/span>/);

    // Republicar el libro se lleva sus traducciones: eran del texto anterior.
    await publish(env, 'manual', { meta: { replace: true } });
    assert.equal(env.LIBRARY.entries.has('tr:manual:en-GB'), false);
});

test('la herramienta de traducción cambia solo el texto y conserva el formato', async () => {
    const tool = await import(`file://${join(ROOT, 'scripts', 'library-translation.mjs')}`);
    const html = '<!doctype html><html lang="pt-PT"><head><title>Livro</title><meta name="description" content="Sobre o livro"></head>'
        + '<body><h1 id="t">Título</h1><p class="x">Um <em>bom</em> dia.<sup><a href="#n1">1</a></sup></p>'
        + '<button aria-label="Fechar">×</button><script>var s = \'Início\';</script></body></html>';
    const source = tool.translationSource(html);
    assert.equal(source.u2, 'Um <g1>bom</g1> dia.<g2><g3>1</g3></g2>');
    const english = Object.fromEntries(Object.entries(source).map(([key, value]) => [key, {
        u1: 'Title', u2: 'A <g1>good</g1> day.<g2><g3>1</g3></g2>', a1: 'Close', title: 'Book', description: 'About the book', s1: 'Start'
    }[key] ?? value]));
    const out = tool.applyTranslation(html, english, 'en-GB');
    assert.match(out, /<html lang="en-GB">/);
    assert.match(out, /<p class="x">A <em>good<\/em> day\.<sup><a href="#n1">1<\/a><\/sup><\/p>/);
    assert.match(out, /aria-label="Close"/);
    assert.match(out, /<title>Book<\/title>/);
    assert.match(out, /var s = 'Start';/);
    // Una traducción que pierde un marcador no se aplica.
    assert.throws(() => tool.applyTranslation(html, { ...english, u2: 'A good day.' }, 'en-GB'), /placeholders changed/);
});

test('descargar el HTML funciona al primer toque', () => {
    // Un enlace que nace como «#» lo engancha el desplazamiento suave de
    // main.js al cargar, y al pulsarlo ya con su dirección real lo anulaba.
    for (const [name, html] of [['index', INDEX_TEMPLATE], ['reader', READER_TEMPLATE]]) {
        const link = /<a [^>]*data-audiobook-download[^>]*>/.exec(html)[0];
        assert.match(link, /\sdownload\s/, name);
        assert.ok(!/href="#/.test(link), `${name}: the download link must not start as an anchor`);
    }
    assert.match(READER_TEMPLATE, /href="\/library\/\{\{BOOK_SLUG\}\}\/download" download data-audiobook-download/);
    const main = readFileSync(join(ROOT, 'JS', 'main.js'), 'utf8');
    assert.match(main, /if \(!targetId \|\| targetId === '#' \|\| !targetId\.startsWith\('#'\)\) return;/);
});

// ── Plantillas y textos ──────────────────────────────────────────────────────

test('las dos plantillas llevan la cabecera y el pie de Elysium, y se indexan', () => {
    assert.match(INDEX_TEMPLATE, /<meta name="robots" content="\{\{ROBOTS\}\}">/);
    assert.match(INDEX_TEMPLATE, /<link rel="canonical" href="https:\/\/elysiumdr\.eu\/library">/);
    assert.match(READER_TEMPLATE, /<meta name="robots" content="index, follow[^"]*">/);
    assert.match(READER_TEMPLATE, /<link rel="canonical" href="\{\{BOOK_URL\}\}">/);
    for (const [name, html] of [['index', INDEX_TEMPLATE], ['reader', READER_TEMPLATE]]) {
        assert.ok(!/noindex/.test(html), `${name}: noindex`);
        assert.match(html, /<html lang="en-GB" data-lang-switch="inline">/, name);
        assert.match(html, /<link rel="manifest" href="\/library\/manifest\.webmanifest">/, name);
        assert.match(html, /<nav class="navbar">/, name);
        assert.match(html, /<footer>/, name);
        assert.match(html, /<li class="footer-library"><a href="\/library" data-i18n="footerLibrary">Library<\/a><\/li>/, name);
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
    const untranslatable = new Set(['navContact', 'footerCompany', 'emailLabel', 'originalLanguage']);
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

// ── Libros partidos (mayores que un valor de KV) ──────────────────────────────

const BIG_PARTS = [
    '<!doctype html>\n<html lang="pt-PT"><head><meta charset="utf-8"><title>Grande</title>'
        + '<meta name="author" content="Jean-Louis Backès"></head><body><h2 id="a">Capítulo A</h2><p>Início ',
    'meio com ção e 😀</p><h2 id="b">Capítulo B</h2><p>segundo trozo</p>',
    '<h2 id="c">Capítulo C</h2><p>fim</p></body></html>'
];
const BIG_HTML = BIG_PARTS.join('');
const UPLOAD = 'a1b2c3d4e5f60718';

async function stagePart(env, slug, index, body, { upload = UPLOAD, token, contentType = 'text/html; charset=utf-8' } = {}) {
    const headers = { 'Content-Type': contentType };
    if (token !== null) headers.Authorization = `Bearer ${token ?? await signToken()}`;
    return call(env, `https://elysiumdr.eu/library/api/books/${slug}/parts/${index}?upload=${upload}`, { method: 'PUT', headers, body });
}

async function commitParts(env, slug, body = {}, { token } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token !== null) headers.Authorization = `Bearer ${token ?? await signToken()}`;
    return call(env, `https://elysiumdr.eu/library/api/books/${slug}/commit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            title: 'A Literatura Europeia',
            description: 'Jean-Louis Backès',
            filename: 'Literatura.html',
            upload: UPLOAD,
            parts: BIG_PARTS.length,
            size: new TextEncoder().encode(BIG_HTML).length,
            ...body
        })
    });
}

async function publishInParts(env, slug, options = {}) {
    for (const [index, text] of BIG_PARTS.entries()) {
        const staged = await stagePart(env, slug, index, text, options);
        assert.equal(staged.status, 201, `part ${index}`);
    }
    return commitParts(env, slug, options.commit);
}

test('un libro partido se publica por trozos y se sirve unido, sin límite de un valor de KV', async () => {
    const env = makeEnv();
    const response = await publishInParts(env, 'grande');
    assert.equal(response.status, 201);
    const { book } = await response.json();
    assert.equal(book.size, new TextEncoder().encode(BIG_HTML).length);
    assert.equal(book.lang, 'pt-PT');

    // `book:` es solo el manifiesto; el texto vive en los trozos.
    const stored = env.LIBRARY.entries.get('book:grande');
    assert.equal(stored.metadata.p, 3);
    assert.equal(stored.metadata.rev, UPLOAD);
    assert.ok(stored.bytes.byteLength < 200, 'the manifest is tiny');
    assert.equal(storedBooks(env), 1);
    assert.deepEqual([...env.LIBRARY.entries.keys()].filter(key => key.startsWith('part:')).sort(),
        [0, 1, 2].map(index => `part:grande:${UPLOAD}:${index}`));

    const reader = await call(env, 'https://elysiumdr.eu/library/grande/book');
    assert.equal(reader.status, 200);
    const html = await reader.text();
    assert.ok(html.indexOf('/* Elysium Library */') < html.indexOf('</head>'), 'the helper still goes inside <head>');
    assert.equal(html.replace(library.BOOK_HELPER, ''), BIG_HTML, 'the parts join byte for byte, even across a multibyte character');

    const download = await call(env, 'https://elysiumdr.eu/library/grande/download');
    assert.equal(download.status, 200);
    assert.equal(await download.text(), BIG_HTML);
    assert.match(download.headers.get('Content-Disposition'), /^attachment; filename="Literatura.html"/);

    const head = await call(env, 'https://elysiumdr.eu/library/grande/book', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
});

test('el índice de capítulos y el autor se sacan de todos los trozos', async () => {
    const env = makeEnv();
    await publishInParts(env, 'grande');
    const info = JSON.parse(await env.LIBRARY.get('info:grande'));
    assert.equal(info.author, 'Jean-Louis Backès');
    assert.deepEqual(info.outline.map(entry => entry.t), ['Capítulo A', 'Capítulo B', 'Capítulo C']);
    const page = await (await call(env, 'https://elysiumdr.eu/library/grande')).text();
    assert.match(page, /Capítulo C/);
    assert.match(page, /Jean-Louis Backès/);
});

test('un libro partido sin su info se recalcula leyendo los trozos, no el manifiesto', async () => {
    const env = makeEnv();
    await publishInParts(env, 'grande');
    env.LIBRARY.entries.delete('info:grande');
    const page = await (await call(env, 'https://elysiumdr.eu/library/grande')).text();
    assert.match(page, /Capítulo B/);
    assert.deepEqual(JSON.parse(await env.LIBRARY.get('info:grande')).outline.map(entry => entry.t),
        ['Capítulo A', 'Capítulo B', 'Capítulo C']);
});

test('los trozos solo los sube la cuenta de Daniel y se validan uno a uno', async () => {
    const env = makeEnv();
    assert.equal((await stagePart(env, 'grande', 0, BIG_PARTS[0], { token: null })).status, 401);
    const stranger = await stagePart(env, 'grande', 0, BIG_PARTS[0], { token: await signToken({ email: 'socio@example.com' }) });
    assert.equal(stranger.status, 403);
    assert.equal((await commitParts(env, 'grande', {}, { token: null })).status, 401);
    // El primero tiene que ser un documento; el resto, solo UTF-8 sin nulos.
    assert.equal((await stagePart(env, 'grande', 0, 'no soy html')).status, 415);
    assert.equal((await stagePart(env, 'grande', 1, 'no soy html')).status, 201);
    assert.equal((await stagePart(env, 'grande', 1, new Uint8Array([0x61, 0x00, 0x62]))).status, 415);
    const notUtf8 = await stagePart(env, 'grande', 1, new Uint8Array([0x61, 0xe7, 0x62]));
    assert.equal(notUtf8.status, 415);
    assert.equal((await notUtf8.json()).code, 'library_not_utf8');
    assert.equal((await stagePart(env, 'grande', 1, '')).status, 400);
    assert.equal((await stagePart(env, 'grande', 1, BIG_PARTS[1], { contentType: 'application/pdf' })).status, 415);
    assert.equal((await stagePart(env, 'grande', 1, BIG_PARTS[1], { upload: 'corto' })).status, 400);
    assert.equal((await stagePart(env, 'grande', 99, BIG_PARTS[1])).status, 413);
    assert.equal((await stagePart(env, 'Mal-Slug', 1, BIG_PARTS[1])).status, 400);
    const wrongMethod = await call(env, `https://elysiumdr.eu/library/api/books/grande/parts/0?upload=${UPLOAD}`, { method: 'POST' });
    assert.equal(wrongMethod.status, 405);
    assert.equal(storedBooks(env), 0, 'staging parts never publishes a book');
});

test('cerrar la subida con un trozo ausente o con otro tamaño no publica nada', async () => {
    const env = makeEnv();
    for (const index of [0, 2]) assert.equal((await stagePart(env, 'grande', index, BIG_PARTS[index])).status, 201);
    const missing = await commitParts(env, 'grande');
    assert.equal(missing.status, 409);
    assert.equal((await missing.json()).code, 'library_part_missing');
    assert.equal(storedBooks(env), 0);

    assert.equal((await stagePart(env, 'grande', 1, BIG_PARTS[1])).status, 201);
    const mismatch = await commitParts(env, 'grande', { size: 12345 });
    assert.equal(mismatch.status, 409);
    assert.equal((await mismatch.json()).code, 'library_parts_mismatch');
    assert.equal(storedBooks(env), 0);

    for (const body of [{ parts: 1 }, { parts: 99 }, { parts: 'tres' }, { upload: 'x' }]) {
        assert.equal((await commitParts(env, 'grande', body)).status, 400, JSON.stringify(body));
    }
    assert.equal((await commitParts(env, 'grande', { title: '' })).status, 400);
    assert.equal((await commitParts(env, 'grande', { filename: 'Literatura.pdf' })).status, 415);
    assert.equal(storedBooks(env), 0);
    assert.equal((await commitParts(env, 'grande')).status, 201);
});

test('un libro partido no pisa otro sin pedirlo, y al reemplazarlo no quedan trozos viejos', async () => {
    const env = makeEnv();
    assert.equal((await publish(env, 'grande')).status, 201);
    const taken = await publishInParts(env, 'grande');
    assert.equal(taken.status, 409);
    assert.equal((await taken.json()).code, 'library_slug_taken');
    assert.equal(await (await call(env, 'https://elysiumdr.eu/library/grande/download')).text(), BOOK_HTML, 'the old book stays until the new one is closed');

    const replaced = await publishInParts(env, 'grande', { commit: { replace: true } });
    assert.equal(replaced.status, 200);
    assert.equal((await replaced.json()).replaced, true);
    assert.equal(await (await call(env, 'https://elysiumdr.eu/library/grande/download')).text(), BIG_HTML);

    // Una segunda subida deja solo sus propios trozos (y limpia una a medias).
    await stagePart(env, 'grande', 0, BIG_PARTS[0], { upload: 'ffffffffffffffff' });
    const second = 'b2b2b2b2b2b2b2b2';
    for (const [index, text] of BIG_PARTS.entries()) await stagePart(env, 'grande', index, text, { upload: second });
    assert.equal((await commitParts(env, 'grande', { upload: second, replace: true })).status, 200);
    const parts = [...env.LIBRARY.entries.keys()].filter(key => key.startsWith('part:'));
    assert.deepEqual(parts.sort(), [0, 1, 2].map(index => `part:grande:${second}:${index}`));

    // Y volver a un libro de un solo valor suelta los trozos.
    assert.equal((await publish(env, 'grande', { meta: { replace: true } })).status, 200);
    assert.equal([...env.LIBRARY.entries.keys()].filter(key => key.startsWith('part:')).length, 0);
    assert.equal(await (await call(env, 'https://elysiumdr.eu/library/grande/download')).text(), BOOK_HTML);
});

test('retirar un libro partido borra también sus trozos', async () => {
    const env = makeEnv();
    await publishInParts(env, 'grande');
    const removed = await call(env, 'https://elysiumdr.eu/library/api/books/grande', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${await signToken()}` }
    });
    assert.equal(removed.status, 200);
    assert.equal(env.LIBRARY.entries.size, 0);
    assert.equal((await call(env, 'https://elysiumdr.eu/library/grande/book')).status, 404);
});

test('el panel parte los libros grandes sin cortar un carácter y cierra la subida', () => {
    assert.match(LIBRARY_ADMIN_JS, /const MAX_BOOK_BYTES = 100 \* 1024 \* 1024;/);
    assert.match(LIBRARY_ADMIN_JS, /const SINGLE_UPLOAD_BYTES = 24 \* 1024 \* 1024;/);
    assert.match(LIBRARY_ADMIN_JS, /\/parts\/\$\{index\}\?upload=\$\{upload\}/);
    assert.match(LIBRARY_ADMIN_JS, /\/commit/);
    assert.match(LIBRARY_ADMIN_JS, /& 0xc0\) === 0x80/);
    // La descarga y los textos hablan del mismo límite que el Worker.
    for (const copy of [LIBRARY_JS, INDEX_TEMPLATE]) assert.match(copy, /up to 100 MB/);
    assert.equal(library.MAX_BOOK_BYTES, 100 * 1024 * 1024);
    assert.ok(library.MAX_PART_BYTES < 25 * 1024 * 1024, 'a part has to fit in one KV value');
});
