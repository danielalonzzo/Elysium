/**
 * Pruebas de tools.elysiumdr.eu (Elysium Tools).
 *
 * Tres cosas que no se ven abriendo las páginas:
 *
 * 1. Que lo publicado esté al día y diga la verdad. `tools/` lo genera
 *    `scripts/build-tools.mjs`: si alguien edita el contenido y no regenera, o
 *    cambia un límite del servicio y no el texto, las páginas prometen algo
 *    que no existe. Se comparan con el generador y con los límites reales.
 * 2. El SEO de cada página: un `h1`, canónica, `hreflang` recíprocos, datos
 *    estructurados válidos y las mismas preguntas que se ven, enlaces que
 *    existen y un sitemap con todas y solo las indexables.
 * 3. El enrutado del Worker para el subdominio y su API pública: Turnstile,
 *    origen, cabeceras de la pasarela, y que `/tools` en los demás dominios
 *    lleve allí en su idioma.
 *
 * Uso:  node --test scripts/tools.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(ROOT, path), 'utf8');
const { buildSite, site } = await import(pathToFileURL(join(ROOT, 'scripts', 'build-tools.mjs')));
const content = await import(pathToFileURL(join(ROOT, 'scripts', 'tools', 'content.mjs')));
const publicCopy = await import(pathToFileURL(join(ROOT, 'JS', 'tools-public.js')));
const worker = (await import(pathToFileURL(join(ROOT, 'worker', 'index.js')))).default;
const require = createRequire(join(ROOT, 'backend', 'tools', 'server.js'));
const backend = require(join(ROOT, 'backend', 'tools', 'public-tools.js'));

const FILES = buildSite();
const ORIGIN = 'https://tools.elysiumdr.eu';
const PAGES = [...FILES.keys()].filter(path => path.endsWith('/index.html'));

/** La URL pública de un fichero generado: `tools/es/unir-pdf/index.html` → `/es/unir-pdf/`. */
const publicPath = file => file.slice('tools'.length).replace(/index\.html$/, '');

function jsonLd(html) {
    const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    assert.ok(match, 'sin JSON-LD');
    return JSON.parse(match[1]);
}

function nodes(html, type) {
    return jsonLd(html)['@graph'].filter(node => [].concat(node['@type']).includes(type));
}

const decode = text => text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/* ── 1. Al día y verdadero ───────────────────────────────────────────────── */

test('tools/ está al día con scripts/build-tools.mjs', () => {
    const stale = [...FILES].filter(([path, contents]) => !existsSync(join(ROOT, path)) || read(path) !== contents).map(([path]) => path);
    assert.deepEqual(stale, [], 'Ejecute node scripts/build-tools.mjs');
    for (const language of content.LANGUAGES) {
        const image = join(ROOT, 'Images', 'tools', `og-${language}.png`);
        assert.ok(existsSync(image) && statSync(image).size > 10000, `falta la imagen para redes ${language}`);
    }
});

test('git no guarda en tools/ nada que el generador ya no produzca', () => {
    let tracked;
    try {
        tracked = execFileSync('git', ['ls-files', 'tools'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
    } catch {
        return; // fuera de un repositorio no hay nada que comprobar
    }
    assert.deepEqual(tracked.filter(path => !FILES.has(path)), [], 'una página retirada se quita con git rm');
});

test('las plataformas prometidas son las que acepta el servicio', () => {
    const promised = content.PLATFORMS.filter(platform => platform.available);
    assert.deepEqual(promised.map(platform => platform.name), publicCopy.PUBLIC_PLATFORMS);
    assert.deepEqual(promised.map(platform => platform.id), [...backend.PUBLIC_PLATFORMS]);
    const soon = content.PLATFORMS.filter(platform => !platform.available).map(platform => platform.id);
    assert.deepEqual(soon, [...backend.COMING_SOON]);
});

test('los límites que se publican son los del servicio', () => {
    const { LIMITS } = content;
    assert.equal(LIMITS.inspectionsPerHour, backend.LIMITS.inspect);
    assert.equal(LIMITS.downloadsPerHour, backend.LIMITS.download);
    assert.equal(LIMITS.conversionsPerHour, backend.LIMITS.convert);
    assert.match(read('backend/tools/public-tools.js'), new RegExp(`PUBLIC_MAX_BYTES = ${LIMITS.videoMaxMb} \\* 1000 \\* 1000`));
    const pdf = read('JS/admin-pdf.js');
    assert.match(pdf, new RegExp(`MAX_FILE_BYTES = ${LIMITS.pdfEditMaxMb} \\* 1000 \\* 1000`));
    assert.match(pdf, new RegExp(`CONVERT_MAX_BYTES = ${LIMITS.pdfConvertMaxMb} \\* 1000 \\* 1000`));
    assert.match(read('backend/tools/pdf-routes.js'), new RegExp(`\\b${LIMITS.pdfConvertMaxPages}\\b`));
    assert.match(read('backend/tools/workspace.js'), new RegExp(`fileTtlMs: ${LIMITS.fileMinutes} \\* 60 \\* 1000`));
});

test('los textos públicos de las herramientas declaran las mismas claves en los tres idiomas', () => {
    const keys = value => Object.entries(value).flatMap(([key, child]) =>
        child && typeof child === 'object' ? keys(child).map(sub => `${key}.${sub}`) : [key]).sort();
    for (const [name, dictionary] of Object.entries({ VIDEO_COPY: publicCopy.VIDEO_COPY, PDF_COPY: publicCopy.PDF_COPY })) {
        assert.deepEqual(keys(dictionary.es), keys(dictionary.en), `${name}: es`);
        assert.deepEqual(keys(dictionary.pt), keys(dictionary.en), `${name}: pt`);
    }
    // Cada código que pueden devolver el Worker o la pasarela tiene su texto.
    const codes = ['limit_reached', 'busy', 'public_tools_disabled', 'turnstile_required', 'turnstile_failed',
        'turnstile_unavailable', 'origin_not_allowed'];
    for (const language of content.LANGUAGES) {
        for (const code of [...codes, 'coming_soon', 'short_link', 'unsupported']) assert.ok(publicCopy.VIDEO_COPY[language].errors[code], `${language}: ${code}`);
        for (const code of codes) assert.ok(publicCopy.PDF_COPY[language].errors[code], `${language}: ${code}`);
    }
});

/* ── 2. SEO ──────────────────────────────────────────────────────────────── */

test('cada página tiene un h1, título y descripción a la medida, y su idioma', () => {
    for (const file of PAGES) {
        const html = FILES.get(file);
        assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, file);
        const title = decode(html.match(/<title>(.*?)<\/title>/)[1]);
        assert.ok(title.length <= 70, `${file}: título de ${title.length} caracteres`);
        const description = decode(html.match(/<meta name="description" content="([^"]*)"/)[1]);
        assert.ok(description.length >= 100 && description.length <= 160, `${file}: descripción de ${description.length} caracteres`);
        const language = /^tools\/(es|pt)\//.exec(file)?.[1] || 'en';
        assert.match(html, new RegExp(`<html lang="${content.LOCALES[language]}">`), file);
        assert.match(html, /<meta name="robots" content="index, follow/);
        assert.ok(!/data-i18n|\$1|undefined|\{\w+\}/.test(html), `${file}: restos del CRM o marcadores sin sustituir`);
    }
});

test('canónica y hreflang: cada idioma apunta a los otros dos y a sí mismo', () => {
    for (const file of PAGES) {
        const html = FILES.get(file);
        const url = ORIGIN + publicPath(file);
        assert.ok(html.includes(`<link rel="canonical" href="${url}">`), file);
        const alternates = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map(match => match[1] && [match[1], match[2]]));
        assert.deepEqual(Object.keys(alternates).sort(), ['en', 'es', 'pt-PT', 'x-default'], file);
        assert.ok(Object.values(alternates).includes(url), `${file}: no se nombra a sí misma`);
        for (const href of Object.values(alternates)) {
            const target = `tools${href.slice(ORIGIN.length)}index.html`;
            assert.ok(FILES.has(target), `${file}: hreflang a ${href}, que no existe`);
            assert.ok(FILES.get(target).includes(`hreflang="${Object.keys(alternates).find(key => alternates[key] === url && key !== 'x-default')}" href="${url}"`), `${href} no devuelve el hreflang a ${url}`);
        }
    }
});

test('datos estructurados: página, migas, aplicación gratis y las preguntas que se ven', () => {
    for (const file of PAGES) {
        const html = FILES.get(file);
        const url = ORIGIN + publicPath(file);
        const graph = jsonLd(html)['@graph'];
        const page = graph.find(node => node['@id'] === `${url}#page`);
        assert.ok(page, `${file}: sin WebPage`);
        assert.equal(page.url, url);
        assert.ok(graph.some(node => node['@id'] === 'https://elysiumdr.eu/#organization'));
        const isHome = /^tools\/(?:(?:es|pt)\/)?index\.html$/.test(file);
        if (isHome) assert.equal(nodes(html, 'WebSite').length, 1, file);
        else assert.equal(nodes(html, 'BreadcrumbList')[0].itemListElement.at(-1).item, url, file);

        const tool = /data-public-tools="true"/.test(html);
        const apps = nodes(html, 'WebApplication');
        assert.equal(apps.length, tool ? 1 : 0, file);
        if (tool) {
            assert.equal(apps[0].isAccessibleForFree, true);
            assert.deepEqual(apps[0].offers, { '@type': 'Offer', price: '0', priceCurrency: 'EUR' });
            assert.ok(!('aggregateRating' in apps[0]), 'nada de valoraciones inventadas');
        }
        for (const faq of nodes(html, 'FAQPage')) {
            const visible = [...html.matchAll(/<summary>(.*?)<\/summary>/g)].map(match => decode(match[1]));
            assert.deepEqual(faq.mainEntity.map(question => question.name), visible, `${file}: el FAQ de datos no es el que se ve`);
        }
    }
});

test('los enlaces internos llevan a páginas o recursos que existen', () => {
    const shared = /^\/(?:CSS|JS|Images)\/|^\/favicon/;
    for (const file of [...FILES.keys()].filter(path => path.endsWith('.html'))) {
        for (const [, href] of FILES.get(file).matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
            const path = href.split(/[?#]/)[0];
            if (shared.test(path)) {
                assert.ok(existsSync(join(ROOT, path)), `${file}: ${href} no existe`);
            } else {
                assert.ok(FILES.has(`tools${path}index.html`), `${file}: enlace roto ${href}`);
            }
        }
    }
});

test('las páginas en español y portugués no se quedan con rótulos en inglés', () => {
    const english = ['Video link', 'Find video', 'Drop your PDF files here', 'Choose PDF files', 'Convert to Word', 'Download PDF', 'aria-label="Breadcrumb"',
        'Drop the photo of the front here', 'Both sides of your ID on one page', 'aria-label="PDF tools"'];
    for (const file of PAGES.filter(path => /^tools\/(es|pt)\//.test(path))) {
        for (const text of english) assert.ok(!FILES.get(file).includes(text), `${file}: «${text}»`);
    }
});

test('nadie promete YouTube: aparece solo como «próximamente»', () => {
    for (const file of PAGES) {
        const html = FILES.get(file);
        assert.ok(!/<p class="tools-platforms">[^<]*<span[^>]*>[^<]*YouTube/.test(html), `${file}: YouTube en la lista de plataformas`);
        assert.ok(!html.includes('youtube.com/watch'), `${file}: ejemplo de enlace de YouTube`);
    }
    assert.match(FILES.get('tools/llms.txt'), /Not available yet: YouTube \(coming soon\)/);
});

test('el sitemap tiene todas y solo las páginas indexables, con sus alternativas', () => {
    const sitemap = FILES.get('tools/sitemap.xml');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    assert.deepEqual([...locs].sort(), PAGES.map(file => ORIGIN + publicPath(file)).sort());
    assert.equal(new Set(locs).size, locs.length);
    assert.equal((sitemap.match(/hreflang="x-default"/g) || []).length, locs.length);
    assert.match(FILES.get('tools/robots.txt'), new RegExp(`Sitemap: ${ORIGIN}/sitemap.xml`));
    assert.match(FILES.get('tools/robots.txt'), /Disallow: \/api\//);
    for (const language of ['', 'es/', 'pt/']) {
        const notFound = FILES.get(`tools/${language}404.html`);
        assert.match(notFound, /<meta name="robots" content="noindex/);
        assert.ok(!notFound.includes('rel="canonical"'));
    }
});

test('llms.txt enlaza cada página y el catálogo es JSON con las URL reales', () => {
    const llms = FILES.get('tools/llms.txt');
    for (const file of PAGES.filter(path => !/^tools\/(?:(?:es|pt)\/)?index\.html$/.test(path))) {
        assert.ok(llms.includes(`](${ORIGIN}${publicPath(file)})`), `llms.txt sin ${publicPath(file)}`);
    }
    const catalog = JSON.parse(FILES.get('tools/catalog.json'));
    const urls = JSON.stringify(catalog).match(/https:\/\/tools\.elysiumdr\.eu\/[^"]*/g);
    for (const url of urls) {
        const path = url.slice(ORIGIN.length);
        assert.ok(FILES.has(`tools${path}index.html`) || FILES.has(`tools${path}`), `catalog.json: ${url}`);
    }
});

/* ── 3. El Worker ────────────────────────────────────────────────────────── */

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.png': 'image/png', '.svg': 'image/svg+xml' };

/** Los assets como los sirve Cloudflare con `html_handling: auto-trailing-slash`. */
const ASSETS = {
    async fetch(request) {
        const { pathname } = new URL(request.url);
        const file = rel => join(ROOT, decodeURIComponent(rel));
        const serve = rel => new Response(request.method === 'HEAD' ? null : readFileSync(file(rel)), {
            headers: { 'Content-Type': TYPES[extname(rel)] || 'application/octet-stream' }
        });
        const isFile = rel => existsSync(file(rel)) && statSync(file(rel)).isFile();
        if (pathname.endsWith('/')) return isFile(`${pathname}index.html`) ? serve(`${pathname}index.html`) : new Response('Not found', { status: 404 });
        if (isFile(pathname)) return serve(pathname);
        if (!extname(pathname) && isFile(`${pathname}.html`)) return serve(`${pathname}.html`);
        if (isFile(`${pathname}/index.html`)) return new Response(null, { status: 307, headers: { Location: `${pathname}/` } });
        return new Response('Not found', { status: 404 });
    }
};

const SECRETS = {
    ELYSIUM_TOOLS_ORIGIN: 'https://tools-service.test',
    TOOLS_PUBLIC_GATEWAY_KEY: 'gateway-key-for-tests-0123456789abcdef',
    TURNSTILE_SITE_KEY: '0x4AAAAAAAtestsitekey',
    TURNSTILE_SECRET_KEY: '0x4AAAAAAAtestsecret'
};

/** `fetch` de mentira: siteverify y el servicio de herramientas. */
function stubNetwork(t, { verify = { success: true, hostname: 'tools.elysiumdr.eu' } } = {}) {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
        const request = input instanceof Request ? input : new Request(input, init);
        calls.push(request);
        if (request.url.startsWith('https://challenges.cloudflare.com/')) {
            if (verify === 'down') throw new TypeError('network down');
            return Response.json(verify);
        }
        return new Response('{"ok":true}\n', { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } });
    };
    t.after(() => { globalThis.fetch = original; });
    return calls;
}

function tools(path, options = {}, env = {}) {
    return worker.fetch(new Request(`${ORIGIN}${path}`, options), { ASSETS, ...env }, {});
}

test('subdominio: las páginas en su URL, con barra final y sin .html', async () => {
    for (const file of PAGES) {
        const response = await tools(publicPath(file));
        assert.equal(response.status, 200, publicPath(file));
        assert.equal(await response.text(), FILES.get(file));
        assert.match(response.headers.get('Vary'), /Accept/);
    }
    const cases = [
        ['/es', 301, `${ORIGIN}/es/`],
        ['/es/unir-pdf', 301, `${ORIGIN}/es/unir-pdf/`],
        ['/es/unir-pdf?x=1', 301, `${ORIGIN}/es/unir-pdf/?x=1`],
        ['/index.html', 301, `${ORIGIN}/`],
        ['/merge-pdf/index.html', 301, `${ORIGIN}/merge-pdf/`],
        ['/es/inventada', 404],
        ['/es/inventada/', 404],
        ['/merge-pdf.html', 404],
        ['/tools/', 404],
        ['/content.json', 404],
        ['/.well-known/ai-catalog.json', 404],
        ['/about', 404]
    ];
    for (const [path, status, location] of cases) {
        const response = await tools(path);
        assert.equal(response.status, status, path);
        if (location) assert.equal(response.headers.get('Location'), location, path);
    }
});

test('subdominio: el 404 va en el idioma de la ruta y no se indexa', async () => {
    for (const [path, lang] of [['/no-existe/', 'en-GB'], ['/es/no-existe/', 'es'], ['/pt/nao-existe/', 'pt-PT']]) {
        const response = await tools(path);
        assert.equal(response.status, 404);
        assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
        assert.match(await response.text(), new RegExp(`<html lang="${lang}">`));
    }
});

test('subdominio: HEAD sin cuerpo, nada de POST a las páginas, Markdown para agentes', async () => {
    const head = await tools('/es/', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    assert.equal((await tools('/es/', { method: 'POST' })).status, 405);
    const markdown = await tools('/es/descargar-videos/', { headers: { Accept: 'text/markdown' } });
    assert.match(markdown.headers.get('Content-Type'), /text\/markdown/);
    const text = await markdown.text();
    assert.match(text, /# Descargar videos online gratis/);
    assert.match(text, /TikTok/);
});

test('subdominio: robots, sitemap, llms y catálogo en la raíz; recursos compartidos', async () => {
    for (const path of ['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt', '/catalog.json']) {
        const response = await tools(path);
        assert.equal(response.status, 200, path);
        assert.equal(await response.text(), FILES.get(`tools${path}`), path);
    }
    for (const path of ['/CSS/tools-site.css', '/JS/tools-public.js', '/Images/tools/og-es.png', '/favicon.svg']) {
        assert.equal((await tools(path)).status, 200, path);
    }
});

test('API pública: sin configurar, 503 y ninguna llamada al servicio', async t => {
    const calls = stubNetwork(t);
    const response = await tools('/api/tools/public/video/inspect', { method: 'POST', headers: { Origin: ORIGIN } });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'public_tools_disabled');
    assert.equal(calls.length, 0);
    const config = await tools('/api/tools/public/config', {}, SECRETS);
    assert.deepEqual(await config.json(), { turnstileSiteKey: SECRETS.TURNSTILE_SITE_KEY });
});

test('API pública: origen, Turnstile y cabeceras de la pasarela', async t => {
    const calls = stubNetwork(t);
    const post = (headers = {}) => tools('/api/tools/public/video/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.9', 'X-Turnstile-Token': 'token-ok', ...headers },
        body: '{"url":"https://www.tiktok.com/@a/video/1"}'
    }, SECRETS);

    const foreign = await post({ Origin: 'https://otra-web.example' });
    assert.equal(foreign.status, 403);
    assert.equal((await foreign.json()).code, 'origin_not_allowed');
    const tokenless = await post({ 'X-Turnstile-Token': '' });
    assert.equal((await tokenless.json()).code, 'turnstile_required');
    assert.equal(calls.length, 0);

    const response = await post({
        Authorization: 'Bearer sesion-del-crm',
        Cookie: 'sesion=1',
        'X-Elysium-Public-Key': 'inventada',
        'X-Elysium-Client-IP': '10.0.0.1'
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
    const [verify, upstream] = calls;
    const form = await verify.formData();
    assert.equal(form.get('secret'), SECRETS.TURNSTILE_SECRET_KEY);
    assert.equal(form.get('response'), 'token-ok');
    assert.equal(form.get('remoteip'), '203.0.113.9');
    assert.equal(upstream.url, `${SECRETS.ELYSIUM_TOOLS_ORIGIN}/api/tools/public/video/inspect`);
    assert.equal(upstream.headers.get('X-Elysium-Public-Key'), SECRETS.TOOLS_PUBLIC_GATEWAY_KEY);
    assert.equal(upstream.headers.get('X-Elysium-Client-IP'), '203.0.113.9');
    assert.equal(upstream.headers.get('Authorization'), null);
    assert.equal(upstream.headers.get('Cookie'), null);
    assert.equal(upstream.headers.get('X-Turnstile-Token'), null);
    assert.equal(await upstream.text(), '{"url":"https://www.tiktok.com/@a/video/1"}');
});

test('API pública: Turnstile caído, rechazado o de otro host', async t => {
    const post = () => tools('/api/tools/public/pdf/convert', {
        method: 'POST',
        headers: { Origin: ORIGIN, 'X-Turnstile-Token': 'token' },
        body: '%PDF-1.4'
    }, SECRETS);
    await t.test('caído', async st => {
        stubNetwork(st, { verify: 'down' });
        const response = await post();
        assert.equal(response.status, 503);
        assert.equal((await response.json()).code, 'turnstile_unavailable');
    });
    await t.test('rechazado', async st => {
        stubNetwork(st, { verify: { success: false, 'error-codes': ['invalid-input-response'] } });
        assert.equal((await (await post()).json()).code, 'turnstile_failed');
    });
    await t.test('emitido en otra web', async st => {
        stubNetwork(st, { verify: { success: true, hostname: 'otra-web.example' } });
        assert.equal((await (await post()).json()).code, 'turnstile_failed');
    });
});

test('API pública: lo que no necesita Turnstile y lo que no existe aquí', async t => {
    const calls = stubNetwork(t);
    const capabilities = await tools('/api/tools/public/capabilities', {}, SECRETS);
    assert.equal(capabilities.status, 200);
    assert.equal(calls.length, 1, 'un GET no pasa por Turnstile');
    assert.equal(calls[0].headers.get('X-Elysium-Public-Key'), SECRETS.TOOLS_PUBLIC_GATEWAY_KEY);

    const file = await tools('/api/tools/files/abc123', {}, SECRETS);
    assert.equal(file.status, 200);
    assert.equal(calls[1].headers.get('X-Elysium-Public-Key'), null, 'el fichero no lleva la clave de la pasarela');
    assert.equal((await tools('/api/tools/files/abc123', { method: 'POST' }, SECRETS)).status, 405);
    // La API del CRM no existe en este host.
    assert.equal((await tools('/api/tools/video/inspect', { method: 'POST' }, SECRETS)).status, 404);
    assert.equal((await tools('/api/tools/capabilities', {}, SECRETS)).status, 404);
});

test('dominios de la empresa: /tools lleva al subdominio en su idioma', async () => {
    const cases = [
        ['elysiumdr.eu', '/tools', `${ORIGIN}/`],
        ['elysiumdr.eu', '/tools/', `${ORIGIN}/`],
        ['elysiumdr.eu', '/tools/video-downloader/', `${ORIGIN}/`],
        ['elysiumdr.eu', '/tools.html', `${ORIGIN}/`],
        ['elysiumdr.eu', '/es/tools/', `${ORIGIN}/es/`],
        ['elysiumdr.eu', '/pt/tools/pdf-editor/', `${ORIGIN}/pt/`],
        ['elysiumdr.es', '/tools/', `${ORIGIN}/es/`],
        ['elysiumdr.pt', '/tools', `${ORIGIN}/pt/`],
        ['elysiumdr.com', '/tools/', `${ORIGIN}/`],
        ['elysiumdr.com', '/es/tools/', `${ORIGIN}/es/`],
        ['www.elysiumdr.eu', '/tools/', 'https://elysiumdr.eu/tools/']
    ];
    for (const [host, path, location] of cases) {
        const response = await worker.fetch(new Request(`https://${host}${path}`), { ASSETS }, {});
        assert.equal(response.status, 301, `${host}${path}`);
        assert.equal(response.headers.get('Location'), location, `${host}${path}`);
    }
    // `/toolsx` o `/tool` no son la sección.
    assert.equal(site.ORIGIN, ORIGIN);
});

test('dominios de la empresa: la API pública no existe fuera del subdominio', async t => {
    const calls = stubNetwork(t);
    for (const host of ['elysiumdr.eu', 'elysiumdr.es', 'elysiumdr.com']) {
        const response = await worker.fetch(new Request(`https://${host}/api/tools/public/capabilities`), { ASSETS, ...SECRETS }, {});
        assert.equal(response.status, 404, host);
    }
    assert.equal(calls.length, 0);
});
