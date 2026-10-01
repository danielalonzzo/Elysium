/**
 * Pruebas de la traducción en vivo de `.eu` (`JS/elysium-translate.js`).
 *
 * Lo que se rompe aquí no se ve al abrir el sitio: una página que se queda sin
 * el `<script>`, una CSP a la que le falta un host de Google (el widget carga
 * pero se queda mudo, sin ningún error en consola), un idioma sin bandera o un
 * motor que se activa donde no debe. El comportamiento con un Chrome real y con
 * Google de verdad está en `scripts/e2e/translate.e2e.mjs`.
 *
 * Uso:  node --test scripts/translate.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(ROOT, path), 'utf8');

const ENGINE = read('JS/elysium-translate.js');
const MAIN = read('JS/main.js');
const WORKER = read('worker/index.js');
const HEADERS = read('_headers');

/** Los 22 idiomas de Daniel, en su orden. */
const LANGUAGES = [
    'de', 'bg', 'cs', 'hr', 'da', 'sk', 'sl', 'et', 'fi', 'fr', 'el',
    'hu', 'ga', 'it', 'lv', 'lt', 'mt', 'nl', 'pl', 'ro', 'sv', 'la'
];

// `*` y no `+`: la portada es la cadena vacía `''`, y con `+` las comillas se
// desemparejan y el resto de la lista sale con basura entre comas.
const quotedList = source => [...source.matchAll(/'([^']*)'/g)].map(match => match[1]);

/** El `new Set([...])` que sigue a `marker`, como lista. */
function setAfter(source, marker) {
    const start = source.indexOf(marker);
    assert.ok(start >= 0, `no encuentro «${marker}»`);
    const open = source.indexOf('[', start);
    const close = source.indexOf(']', open);
    return quotedList(source.slice(open, close));
}

const MARKETING_PAGES = setAfter(MAIN, 'const SWITCHABLE_MARKETING_PAGES');

// ── Los datos ────────────────────────────────────────────────────────────────

test('los 22 idiomas del motor son los de Daniel, en su orden', () => {
    const block = ENGINE.slice(ENGINE.indexOf('const LANGUAGES = ['), ENGINE.indexOf('].map('));
    const codes = [...block.matchAll(/\['([a-z]{2})',/g)].map(match => match[1]);
    assert.deepEqual(codes, LANGUAGES);
});

test('cada idioma en vivo tiene su bandera optimizada de 64 px', () => {
    for (const code of LANGUAGES) {
        assert.ok(existsSync(join(ROOT, 'Images', 'Optimized', `flag-${code}-64.webp`)), `falta flag-${code}-64.webp`);
    }
});

test('el Worker conoce los mismos 22 idiomas (el enlace /?lang= anula el reparto por país)', () => {
    const inWorker = setAfter(WORKER, 'const LIVE_TRANSLATION_LANGUAGES');
    assert.deepEqual(inWorker, LANGUAGES);
});

test('las páginas que traduce el motor son las que main.js da por conmutables', () => {
    assert.deepEqual(setAfter(ENGINE, 'const PAGES'), MARKETING_PAGES);
});

// ── Las páginas ──────────────────────────────────────────────────────────────

const pageFile = (folder, page) => `${folder}${page ? `${page}.html` : 'index.html'}`;
const EU_PAGES = ['', 'es/', 'pt/'].flatMap(folder => MARKETING_PAGES
    .map(page => pageFile(folder, page))
    .filter(file => existsSync(join(ROOT, file))));

test('las 60 páginas de marketing de .eu cargan el motor, una vez y después de main.js', () => {
    assert.equal(EU_PAGES.length, 60, 'tres carpetas × veinte páginas');
    for (const file of EU_PAGES) {
        const html = read(file);
        const tags = html.match(/<script src="\/JS\/elysium-translate\.js" defer><\/script>/g) || [];
        assert.equal(tags.length, 1, `${file}: debe cargar elysium-translate.js exactamente una vez`);
        const main = html.search(/<script src="[^"]*(?:JS\/main\.js|JS\/home\.v\d+\.min\.js)/);
        assert.ok(main >= 0 && main < html.indexOf('elysium-translate.js'),
            `${file}: el motor tiene que ir después de main.js, que es quien crea el selector donde falta`);
    }
});

test('ninguna página de .eu impide traducir', () => {
    for (const file of EU_PAGES) {
        const html = read(file);
        assert.doesNotMatch(html, /<meta[^>]+name=["']google["'][^>]+notranslate/i, `${file}: meta notranslate`);
        assert.doesNotMatch(html, /<html[^>]+translate=["']no["']/i, `${file}: <html translate="no">`);
    }
});

test('el marcado escrito a mano del selector sigue siendo solo EN/ES/PT', () => {
    // Los 22 idiomas se añaden en el navegador; si alguien los escribe a mano en
    // las páginas, la prueba de paridad de selectores y este motor se pisan.
    for (const file of EU_PAGES) {
        assert.doesNotMatch(read(file), /lang-translate/, `${file}: lang-translate escrito a mano`);
    }
});

test('las tres políticas de privacidad de .eu cuentan lo de Google Translate y la cookie', () => {
    for (const file of ['privacy.html', 'es/privacy.html', 'pt/privacy.html']) {
        const html = read(file);
        assert.match(html, /Google Translate/, `${file}: Google Translate`);
        assert.match(html, /googtrans/, `${file}: la cookie googtrans`);
    }
});

// ── La CSP y la caché ────────────────────────────────────────────────────────

const GENERAL_CSP = HEADERS.split('\n').find(line => /Content-Security-Policy:.*googletagmanager/.test(line));
const directive = name => {
    const match = new RegExp(`(?:^|[:;]\\s*)${name} ([^;]*)`).exec(GENERAL_CSP);
    return match ? match[1].split(/\s+/) : [];
};

test('la CSP general deja descargar y ejecutar el widget de Google', () => {
    assert.ok(GENERAL_CSP, 'no encuentro la CSP general de _headers');
    // Sin translate-pa.googleapis.com el widget carga, no da ningún error y se
    // queda con el <select> vacío: cuesta una tarde descubrirlo.
    for (const host of ['https://translate.google.com', 'https://translate.googleapis.com', 'https://translate-pa.googleapis.com']) {
        assert.ok(directive('script-src').includes(host), `script-src sin ${host}`);
    }
    assert.ok(directive('style-src').includes('https://www.gstatic.com'), 'style-src sin www.gstatic.com');
    assert.ok(directive('connect-src').includes('https://*.googleapis.com'), 'connect-src sin *.googleapis.com');
    assert.ok(directive('img-src').includes('https:'), 'img-src sin https:');
});

test('abrir la CSP al widget no abre más de lo necesario', () => {
    // `data:` en `frame-src` o `'unsafe-eval'` no hacen falta (se comprobó con
    // un Chrome real): no se añaden «por si acaso».
    assert.ok(!directive('frame-src').includes('data:'), "frame-src con data:");
    assert.ok(!directive('script-src').includes("'unsafe-eval'"), "script-src con 'unsafe-eval'");
});

test('el motor y su CSS se revalidan en cada visita (nombre estable)', () => {
    for (const path of ['/JS/elysium-translate.js', '/CSS/elysium-translate.css']) {
        const block = new RegExp(`^${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n\\s+Cache-Control: ([^\\n]+)`, 'm').exec(HEADERS);
        assert.ok(block, `${path} sin regla de caché`);
        assert.match(block[1], /no-cache/, `${path} no debe ser immutable`);
    }
});

// ── El motor ─────────────────────────────────────────────────────────────────

test('el idioma del navegador no decide nada', () => {
    assert.doesNotMatch(ENGINE, /navigator\.language/);
    assert.doesNotMatch(ENGINE, /navigator\.languages/);
    assert.doesNotMatch(ENGINE, /Accept-Language/i);
});

/** Carga el motor en un «navegador» mínimo y devuelve lo que publica. */
function load({ host, pathname = '/', search = '' }) {
    const touched = [];
    const trap = name => new Proxy({}, {
        get(_, key) { touched.push(`${name}.${String(key)}`); return () => {}; }
    });
    const window = { location: { hostname: host, pathname, search, href: `https://${host}${pathname}` } };
    window.window = window;
    const context = vm.createContext({
        window,
        document: trap('document'),
        URLSearchParams,
        URL,
        Promise,
        console
    });
    vm.runInContext(ENGINE, context);
    return { api: window.ElysiumTranslate, touched };
}

test('en .es, .pt y .com el motor no actúa ni toca el documento', () => {
    for (const host of ['elysiumdr.es', 'elysiumdr.pt', 'elysiumdr.com', 'elysiumdr.cr']) {
        const { api, touched } = load({ host });
        assert.equal(api.enabled, false, host);
        assert.deepEqual(touched, [], `${host}: no debe tocar el documento`);
    }
});

test('en .eu fuera de las páginas de marketing el motor no actúa', () => {
    for (const pathname of ['/profiles', '/admin', '/library', '/Gestor-Patrimonios/', '/library/book/x']) {
        const { api, touched } = load({ host: 'elysiumdr.eu', pathname });
        assert.equal(api.enabled, false, pathname);
        assert.deepEqual(touched, [], `${pathname}: no debe tocar el documento`);
    }
});

test('en local, ?national= apaga el motor igual que en .es y .pt', () => {
    assert.equal(load({ host: 'localhost', pathname: '/about', search: '?national=es' }).api.enabled, false);
    assert.equal(load({ host: 'localhost', pathname: '/about', search: '?national=pt' }).api.enabled, false);
});
