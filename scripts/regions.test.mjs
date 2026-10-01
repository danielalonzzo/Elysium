/**
 * Pruebas de las cuatro regiones: qué dice cada una de sí misma, en qué idioma
 * abre y con qué bandera, y cómo sirve el Worker el sitio global.
 *
 * El contrato (decidido por Daniel, octubre de 2026):
 *
 *   Europa   · elysiumdr.eu  · inglés europeo (`/`), español de España (`/es/`) y portugués de Portugal (`/pt/`)
 *   España   · elysiumdr.es  · español de España, más traducción a los otros idiomas
 *   Portugal · elysiumdr.pt  · portugués de Portugal, más traducción a los otros idiomas
 *   Global   · elysiumdr.com · inglés europeo (`/`), español de Costa Rica (`/es/`) y portugués de Portugal (`/pt/`)
 *
 * Cada región abre en SU idioma, sin importar el del navegador. Estas pruebas
 * leen los ficheros y ejecutan el Worker; lo que solo se ve en un navegador
 * (banderas pintadas, el selector funcionando, la traducción en vivo) lo cubre
 * `scripts/e2e/regions.e2e.mjs`, que usa un Chrome real.
 *
 * Uso:  node --test scripts/regions.test.mjs
 *       UPDATE_IMMUTABLE=1 node --test scripts/regions.test.mjs   (tras versionar un recurso)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFileSync(join(ROOT, relative), 'utf8');
const worker = (await import(`file://${join(ROOT, 'worker', 'index.js')}`)).default;

const PAGES = [
    '', 'about', 'case-moyra', 'case-pmorais', 'case-valtrix', 'contact', 'daniel-morales',
    'onboarding', 'portfolio', 'privacy', 'prototype-moyra', 'prototype-pmorais',
    'prototype-valtrix', 'research', 'research/data-driven-sme-intelligence',
    'research/ontology-research', 'review-pmorais', 'services', 'terms', 'thank-you'
];
const file = page => page === '' ? 'index.html' : `${page}.html`;

// Las ocho carpetas de páginas traducidas: [clave, directorio, <html lang>, región activa, idioma]
const TREES = [
    ['eu-en', '', 'en-GB', 'EU', 'en'],
    ['eu-es', 'es', 'es-ES', 'EU', 'es'],
    ['eu-pt', 'pt', 'pt-PT', 'EU', 'pt'],
    ['es', '_national/es', 'es-ES', 'ES', 'es'],
    ['pt', '_national/pt', 'pt-PT', 'PT', 'pt'],
    ['com-en', '_national/com', 'en-GB', 'GLOBAL', 'en'],
    ['com-es', '_national/com/es', 'es-CR', 'GLOBAL', 'es'],
    ['com-pt', '_national/com/pt', 'pt-PT', 'GLOBAL', 'pt']
];
const treeFile = (dir, page) => join(dir, file(page));

// ── Contenido ─────────────────────────────────────────────────────────────────

function heroTitle(html) {
    const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html);
    assert.ok(h1, 'la portada tiene h1');
    return h1[1]
        .replace(/<span class="hero-title-suffix">[\s\S]*?<\/span>/, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

test('el titular de la portada de cada región habla de sí misma, en su idioma', () => {
    const expected = {
        'eu-en': 'Pan-European digital infrastructure for small-businesses and startups:',
        'eu-es': 'Infraestructura Digital Paneuropea para pequeñas empresas y emprendedores:',
        'eu-pt': 'Infraestrutura Digital Pan-Europeia para pequenas empresas e startups:',
        es: 'Infraestructura Digital para pequeñas empresas y emprendedores de España:',
        pt: 'Infraestrutura Digital para pequenas empresas e startups de Portugal:',
        'com-en': 'Digital infrastructure for small-businesses and startups:',
        'com-es': 'Infraestructura Digital para pequeñas empresas y emprendedores:',
        'com-pt': 'Infraestrutura Digital para pequenas empresas e startups:'
    };
    for (const [key, dir] of TREES) {
        assert.equal(heroTitle(read(treeFile(dir, ''))), expected[key], key);
    }
});

test('cada árbol declara el idioma y la región reales de sus páginas', () => {
    for (const [key, dir, lang] of TREES) {
        for (const page of PAGES) {
            const html = read(treeFile(dir, page));
            assert.equal(/<html\s+lang="([^"]+)"/.exec(html)?.[1], lang, `${key}/${page || 'index'}`);
        }
    }
    // `og:locale` acompaña al idioma en las páginas que lo declaran.
    const locale = { 'en-GB': 'en_GB', 'es-ES': 'es_ES', 'es-CR': 'es_CR', 'pt-PT': 'pt_PT' };
    for (const [key, dir, lang] of TREES) {
        const declared = /property="og:locale"\s+content="([^"]+)"/.exec(read(treeFile(dir, '')))?.[1];
        if (declared) assert.equal(declared, locale[lang], key);
    }
});

test('el selector de región ofrece Europa, España, Portugal y Global; ni Costa Rica ni Worldwide', () => {
    const labels = {
        en: { EU: 'EUROPE', ES: 'SPAIN', PT: 'PORTUGAL', GLOBAL: 'GLOBAL' },
        es: { EU: 'EUROPA', ES: 'ESPAÑA', PT: 'PORTUGAL', GLOBAL: 'GLOBAL' },
        pt: { EU: 'EUROPA', ES: 'ESPANHA', PT: 'PORTUGAL', GLOBAL: 'GLOBAL' }
    };
    for (const [key, dir, , region, language] of TREES) {
        for (const page of PAGES) {
            const where = `${key}/${page || 'index'}`;
            const html = read(treeFile(dir, page));
            assert.doesNotMatch(html, /data-region="CR"|WORLDWIDE|COSTA RICA<\/a>/, where);
            const menu = /<div\s+class="region-switcher-menu"[^>]*>([\s\S]*?)<\/div>/.exec(html);
            if (!menu) continue; // research/*: el selector lo inyecta main.js, que pone las mismas cuatro
            const items = [...menu[1].matchAll(/<a\b[^>]*class="region-item( active)?"[^>]*data-region="([A-Z]+)"[^>]*>([\s\S]*?)<\/a>/g)]
                .map(m => ({ active: Boolean(m[1]), code: m[2], text: m[3].replace(/<[^>]+>/g, '').replace(/[●\s]+/g, ' ').trim() }));
            assert.deepEqual(items.map(i => i.code), ['EU', 'ES', 'PT', 'GLOBAL'], where);
            assert.deepEqual(items.filter(i => i.active).map(i => i.code), [region], where);
            for (const item of items) assert.equal(item.text, labels[language][item.code], `${where} ${item.code}`);
            assert.equal(/<span class="region-tag">([^<]*)<\/span>/.exec(html)[1], labels[language][region], where);
        }
    }
});

test('el español lleva la bandera de su región: España en .eu y .es, Costa Rica en .com', () => {
    // La imagen tiene que estar dentro de la propia opción, no en la siguiente.
    const spanishFlags = html => [...html.matchAll(/<(a|button)\b[^>]*data-lang="es"[^>]*>((?:(?!<\/\1>)[\s\S])*)<\/\1>/g)]
        .map(m => /<img\b[^>]*src="([^"]+)"/.exec(m[2])?.[1])
        .filter(Boolean)
        .map(src => src.replace(/.*\//, ''));
    for (const [key, dir] of TREES) {
        const global = key.startsWith('com');
        for (const page of PAGES) {
            const flags = spanishFlags(read(treeFile(dir, page)));
            for (const flag of flags) {
                assert.ok(global ? /^(flag-cr-64\.webp|costa-rica\.png)$/.test(flag) : /^(flag-es-64\.webp|espana\.png)$/.test(flag),
                    `${key}/${page || 'index'}: ${flag}`);
            }
        }
    }
    // El selector que inyecta main.js (y el portal) decide por dominio, con la misma regla.
    assert.match(read('JS/main.js'), /const SPANISH_FLAG = isGlobalDomain \? 'cr' : 'es';/);
    assert.match(read('JS/profiles.js'), /isGlobalDomain\s*\?\s*\{ src: '\/Images\/Optimized\/flag-cr-64\.webp'/);
});

test('canonical, hreflang y og:url de cada árbol apuntan a su propio dominio', () => {
    const origin = { 'eu-en': 'https://elysiumdr.eu', 'eu-es': 'https://elysiumdr.eu', 'eu-pt': 'https://elysiumdr.eu',
        es: 'https://elysiumdr.es', pt: 'https://elysiumdr.pt',
        'com-en': 'https://elysiumdr.com', 'com-es': 'https://elysiumdr.com', 'com-pt': 'https://elysiumdr.com' };
    const prefix = { 'eu-en': '', 'eu-es': '/es', 'eu-pt': '/pt', es: '', pt: '', 'com-en': '', 'com-es': '/es', 'com-pt': '/pt' };
    for (const [key, dir] of TREES) {
        for (const page of PAGES) {
            const html = read(treeFile(dir, page));
            const where = `${key}/${page || 'index'}`;
            const canonical = /<link\s+rel="canonical"\s+href="([^"]+)"/.exec(html)?.[1];
            assert.equal(canonical, `${origin[key]}${prefix[key]}/${page}`, where);
            const ogUrl = /property="og:url"\s+content="([^"]+)"/.exec(html)?.[1];
            if (ogUrl) assert.equal(ogUrl, canonical, `${where} og:url`);

            const alternates = [...html.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/g)].map(m => [m[1], m[2]]);
            if (key.startsWith('eu') || key.startsWith('com')) {
                const host = origin[key];
                const spanish = key.startsWith('com') ? 'es-CR' : 'es-ES';
                assert.deepEqual(alternates, [
                    ['en-GB', `${host}/${page}`],
                    [spanish, `${host}/es/${page}`],
                    ['pt-PT', `${host}/pt/${page}`],
                    ['x-default', `${host}/${page}`]
                ], where);
            }
        }
    }
});

test('.eu no cita la ley, la autoridad ni los consumidores de Costa Rica', () => {
    for (const [key, dir] of TREES.filter(([k]) => k.startsWith('eu'))) {
        for (const page of PAGES) {
            const html = read(treeFile(dir, page));
            assert.doesNotMatch(html, /8968|PRODHAB|\bMEIC\b|Ley N[.º° ]*7472|consumidorenlinea/i, `${key}/${page || 'index'}`);
        }
    }
});

test('el español de España no arrastra el léxico de Costa Rica', () => {
    for (const [key, dir] of TREES.filter(([k]) => k === 'eu-es' || k === 'es')) {
        for (const page of PAGES) {
            const text = read(treeFile(dir, page)).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
            // «el costo oculto…» (case-valtrix) es la frase de un cliente costarricense, entre comillas.
            const found = /\b[Cc]ostos\b|\bCosto\b|\b[Cc]omputadoras?\b|qué le deja plata/.exec(text);
            assert.equal(found && found[0], null, `${key}/${page || 'index'}`);
        }
    }
});

test('el sitio global tiene todas las páginas, y lo que el Worker anuncia existe', () => {
    for (const [, dir] of TREES.filter(([k]) => k.startsWith('com'))) {
        for (const page of PAGES) assert.ok(existsSync(join(ROOT, dir, file(page))), `${dir}/${file(page)}`);
        for (const name of ['llms.txt', 'llms-full.txt']) assert.ok(existsSync(join(ROOT, dir, name)), `${dir}/${name}`);
    }
    assert.ok(existsSync(join(ROOT, '_national/com/es/infraestructura-digital-pymes-costa-rica.html')));
});

test('los textos para modelos de lenguaje de cada sitio hablan de su región', () => {
    assert.match(read('_national/com/llms.txt'), /https:\/\/elysiumdr\.com\/llms-full\.txt/);
    assert.doesNotMatch(read('_national/com/llms.txt'), /https:\/\/elysiumdr\.eu\/(?!library|Gestor|VALTRIX)/);
    assert.match(read('es/llms.txt'), /\(Europa\)/);
    assert.doesNotMatch(read('es/llms.txt'), /elysiumdr\.es/);
    assert.match(read('pt/llms.txt'), /\(Europa\)/);
    assert.doesNotMatch(read('pt/llms.txt'), /elysiumdr\.pt/);
    assert.doesNotMatch(read('llms.txt'), /PRODHAB|Law No\. 7472/);
    assert.match(read('_national/com/es/llms.txt'), /\(Global\)/);
});

// ── Recursos versionados: un fichero inmutable no se edita en sitio ───────────

const HOMEPAGES = [
    'index.html', 'es/index.html', 'pt/index.html', '_national/es/index.html', '_national/pt/index.html',
    '_national/com/index.html', '_national/com/es/index.html', '_national/com/pt/index.html'
];

test('las portadas cargan los mismos bundles versionados, que existen y son inmutables', () => {
    const headers = read('_headers');
    const used = new Set();
    for (const page of HOMEPAGES) {
        const html = read(page);
        const css = /href="(?:\.\.\/)?CSS\/(home\.v\d+\.min\.css)"/.exec(html)?.[1];
        const js = /src="(?:\.\.\/)?JS\/(home\.v\d+\.min\.js)"/.exec(html)?.[1];
        const critical = /data-critical-css="(home-v\d+)"/.exec(html)?.[1];
        assert.ok(css && js && critical, page);
        used.add(`${css} ${js} ${critical}`);
        assert.ok(existsSync(join(ROOT, 'CSS', css)) && existsSync(join(ROOT, 'JS', js)), page);
        for (const asset of [`/CSS/${css}`, `/JS/${js}`]) {
            const block = new RegExp(`^${asset.replace(/[.]/g, '\\.')}\\n\\s+Cache-Control: public, max-age=31536000, immutable`, 'm');
            assert.match(headers, block, `${page}: ${asset} necesita su entrada inmutable en _headers`);
        }
    }
    assert.equal(used.size, 1, `las ocho portadas cargan el mismo bundle: ${[...used].join(' | ')}`);
});

test('el bundle de portada incluye las regiones nuevas (no se quedó en la versión anterior)', () => {
    const js = /src="(?:\.\.\/)?JS\/(home\.v\d+\.min\.js)"/.exec(read('index.html'))[1];
    const bundle = read(`JS/${js}`);
    assert.match(bundle, /elysiumdr\.com/);
    assert.match(bundle, /flag-\$\{/);
    assert.doesNotMatch(bundle, /region=CR|COSTA RICA|WORLDWIDE/);
    assert.doesNotMatch(bundle, /G-PY4LMCTNG9/, 'la portada carga GA4 por su cuenta con google-analytics.js; no debe duplicarlo');
});

test('ningún recurso inmutable se ha editado sin cambiarle el nombre o el ?v=', () => {
    const manifestPath = join(ROOT, 'scripts', 'fixtures', 'immutable-assets.json');
    const tracked = {
        'CSS/home.v20261001.min.css': 'name', 'CSS/home-critical.v20261001.min.css': 'name',
        'JS/home.v20261001.min.js': 'name', 'CSS/components.css': 'query'
    };
    const digest = relative => createHash('sha256').update(readFileSync(join(ROOT, relative))).digest('hex');
    const current = Object.fromEntries(Object.keys(tracked).map(relative => [relative, digest(relative)]));
    if (process.env.UPDATE_IMMUTABLE === '1') {
        writeFileSync(manifestPath, `${JSON.stringify(current, null, 2)}\n`);
        return;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    for (const [relative, kind] of Object.entries(tracked)) {
        assert.equal(current[relative], manifest[relative],
            `${relative} cambió y se sirve como «immutable» (un año): los navegadores que ya lo tienen no lo volverán a pedir. `
            + (kind === 'name'
                ? 'Cree una copia con otro nombre (home.vAAAAMMDD…), cámbiela en las portadas y en _headers, y actualice el manifiesto.'
                : 'Cambie el ?v= de components.css en todas las páginas y actualice el manifiesto.')
            + ' Manifiesto: UPDATE_IMMUTABLE=1 node --test scripts/regions.test.mjs');
    }
});

test('todas las páginas interiores piden components.css con el mismo ?v=', () => {
    const tokens = new Set();
    for (const [, dir] of TREES) {
        for (const page of PAGES.filter(Boolean)) {
            const token = /CSS\/components\.css\?v=(\d+)/.exec(read(treeFile(dir, page)))?.[1];
            assert.ok(token, `${dir}/${page}`);
            tokens.add(token);
        }
    }
    assert.equal(tokens.size, 1, `tokens distintos: ${[...tokens].join(', ')}`);
});

// ── Worker: el sitio global ───────────────────────────────────────────────────

const env = {
    ASSETS: {
        fetch(request) {
            const assetUrl = new URL(request.url);
            const asked = assetUrl.pathname + assetUrl.search;
            const body = request.method === 'HEAD' ? null
                : assetUrl.pathname === '/robots.txt' ? 'User-agent: *\nAllow: /\nSitemap: https://elysiumdr.eu/sitemap.xml\n' : 'ok';
            return new Response(body, {
                status: 200,
                headers: { 'X-Asset': asked, 'Content-Type': asked.endsWith('.txt') ? 'text/plain' : 'text/html' }
            });
        }
    },
    ELYSIUM_API_ORIGIN: 'https://example.invalid'
};

async function call(url, { country = null, cookie = null } = {}) {
    const headers = new Headers();
    if (cookie) headers.set('Cookie', cookie);
    const request = new Request(url, { headers });
    if (country) request.cf = { country };
    const response = await worker.fetch(request, env);
    return {
        status: response.status,
        location: response.headers.get('Location'),
        asset: response.headers.get('X-Asset'),
        cacheControl: response.headers.get('Cache-Control'),
        body: await response.text()
    };
}

const COM = 'https://elysiumdr.com';

test('.com — la portada abre en inglés, sin repartir por país ni mirar el navegador', async () => {
    for (const country of [null, 'ES', 'PT', 'CR', 'BR', 'FR', 'US']) {
        const r = await call(`${COM}/`, { country });
        assert.equal(r.status, 200, String(country));
        assert.equal(r.asset, '/_national/com/', String(country));
    }
});

test('.com — /es/ y /pt/ son carpetas físicas con sus propias páginas', async () => {
    for (const [from, asset] of [
        ['/es/', '/_national/com/es/'],
        ['/pt/', '/_national/com/pt/'],
        ['/es/about', '/_national/com/es/about'],
        ['/pt/services', '/_national/com/pt/services'],
        ['/es/research/ontology-research', '/_national/com/es/research/ontology-research'],
        ['/about', '/_national/com/about'],
        ['/es/infraestructura-digital-pymes-costa-rica', '/_national/com/es/infraestructura-digital-pymes-costa-rica'],
        ['/es/llms.txt', '/_national/com/es/llms.txt'],
        ['/llms-full.txt', '/_national/com/llms-full.txt']
    ]) {
        const r = await call(`${COM}${from}`);
        assert.equal(r.status, 200, from);
        assert.equal(r.asset, asset, from);
    }
});

test('.com — las URL se canonizan como en .eu', async () => {
    for (const [from, to, status] of [
        ['/es', '/es/', 307],
        ['/pt', '/pt/', 307],
        ['/es/about/', '/es/about', 307],
        ['/about/', '/about', 307],
        ['/es/about.html', '/es/about', 301],
        ['/about.html', '/about', 301],
        ['/es/index.html', '/es/', 301],
        ['/index.html', '/', 301],
        ['/en/services', '/services', 301],
        ['/en', '/', 301]
    ]) {
        const r = await call(`${COM}${from}`);
        assert.equal(r.status, status, from);
        assert.equal(r.location, `${COM}${to}`, from);
    }
});

test('.com — lo que no está traducido sale de los assets compartidos', async () => {
    for (const path of ['/ONCORE/', '/profiles', '/CSS/components.css', '/Images/Optimized/flag-cr-64.webp', '/VALTRIX%20Engineering/']) {
        const r = await call(`${COM}${path}`);
        assert.equal(r.status, 200, path);
        assert.equal(r.asset, path, path);
    }
    const legacy = await call(`${COM}/es/profiles`);
    assert.equal(legacy.status, 308);
    assert.equal(legacy.location, `${COM}/profiles?lang=es`);
});

test('.com — la base interna no es una URL pública, y la traducción en vivo no existe', async () => {
    for (const path of ['/_national/com/', '/_national/com/es/about', '/%5Fnational/com/']) {
        assert.equal((await call(`${COM}${path}`)).status, 404, path);
    }
    assert.equal((await call(`${COM}/__i18n?lang=es&path=/`)).status, 404);
});

test('.com — Elysium Patrimonio vive solo en .eu, pero la biblioteca se sirve aquí, en la región', async () => {
    const patrimonio = await call(`${COM}/Gestor-Patrimonios/`);
    assert.equal(patrimonio.status, 301);
    assert.equal(patrimonio.location, 'https://elysiumdr.eu/Gestor-Patrimonios/');
    // La biblioteca no salta a `.eu`: seguiría en otra región y en otro idioma.
    const library = await call(`${COM}/library`);
    assert.notEqual(library.status, 301);
    assert.equal(library.location, null);
});

test('.com — su sitemap lista las tres carpetas con sus hreflang y sin páginas noindex', async () => {
    const r = await call(`${COM}/sitemap.xml`);
    assert.equal(r.status, 200);
    assert.equal(r.asset, null);
    const locations = [...r.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    assert.ok(locations.includes(`${COM}/`) && locations.includes(`${COM}/es/`) && locations.includes(`${COM}/pt/`));
    assert.ok(locations.includes(`${COM}/es/about`) && locations.includes(`${COM}/pt/research/ontology-research`));
    assert.ok(locations.includes(`${COM}/es/infraestructura-digital-pymes-costa-rica`));
    assert.ok(locations.every(location => location.startsWith(`${COM}/`)));
    assert.doesNotMatch(r.body, /elysiumdr\.eu|\.txt<|onboarding|thank-you|_national/);
    assert.match(r.body, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
    assert.match(r.body, /<xhtml:link rel="alternate" hreflang="es-CR" href="https:\/\/elysiumdr\.com\/es\/about"\/>/);
    assert.match(r.body, /<xhtml:link rel="alternate" hreflang="x-default" href="https:\/\/elysiumdr\.com\/about"\/>/);
});

test('.eu — sus aterrizajes de Costa Rica, España y Portugal ya no se sirven: cada uno va a su región', async () => {
    for (const [from, to] of [
        ['https://elysiumdr.eu/es/infraestructura-digital-pymes-costa-rica', `${COM}/es/infraestructura-digital-pymes-costa-rica`],
        ['https://elysiumdr.eu/es/infraestructura-digital-pymes-espana', 'https://elysiumdr.es/'],
        ['https://elysiumdr.eu/pt/infraestrutura-digital-pme-portugal', 'https://elysiumdr.pt/']
    ]) {
        const r = await call(from);
        assert.equal(r.status, 301, from);
        assert.equal(r.location, to, from);
    }
});

test('el reparto por país nunca decide por el navegador: ni Accept-Language ni cookies de idioma', async () => {
    const request = new Request('https://elysiumdr.eu/', {
        headers: { 'Accept-Language': 'es-ES,es;q=0.9,pt;q=0.8', Cookie: 'elysium_lang_pref=es; langOverride=true' }
    });
    request.cf = { country: 'DE' };
    const response = await worker.fetch(request, env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Asset'), '/');
});
