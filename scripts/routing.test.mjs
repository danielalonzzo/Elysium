/**
 * Pruebas del enrutado de `worker/index.js`.
 *
 * El enrutado es la pieza más fácil de romper sin enterarse: un fallo aquí no
 * se ve al abrir la portada, se ve tres clics después y solo desde un país
 * concreto. Ya pasó dos veces —los dominios nacionales daban 404 en todo lo que
 * no estaba traducido, y `/profiles` y `/admin` entraban en bucle infinito de
 * redirecciones— y ninguna de las dos se notó desde el navegador de casa.
 *
 * Se prueba el módulo real con un `env.ASSETS` falso que, en vez de servir el
 * fichero, anota qué ruta se le pidió. Así se comprueba la decisión del Worker
 * (a qué asset va, a dónde redirige, con qué código) sin desplegar nada. El
 * país llega en `request.cf.country`, igual que en producción.
 *
 * No cubre lo que decide Cloudflare por su cuenta: `html_handling`
 * (auto-trailing-slash), `_redirects` ni `_headers`.
 *
 * Uso:  node --test scripts/routing.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKER = join(ROOT, 'worker', 'index.js');
const worker = (await import(`file://${WORKER}`)).default;

// env.ASSETS falso: devuelve 200 y anota qué ruta se le pidió.
const env = {
    ASSETS: {
        fetch(request) {
            const assetUrl = new URL(request.url);
            const asked = assetUrl.pathname + assetUrl.search;
            const robotsFixture = [
                'User-agent: *',
                'Allow: /',
                'Disallow: /Demo-arbol/',
                '',
                'User-agent: GPTBot',
                'Allow: /',
                'Disallow: /Demo-arbol/',
                '',
                'Sitemap: https://elysiumdr.eu/sitemap.xml',
                ''
            ].join('\n');
            const body = request.method === 'HEAD'
                ? null
                : assetUrl.pathname === '/robots.txt' ? robotsFixture : 'ok';
            const contentType = assetUrl.pathname === '/robots.txt'
                ? 'text/plain'
                : assetUrl.pathname === '/sitemap.xml' ? 'application/xml' :
                    asked.endsWith('.txt') ? 'text/plain' : 'text/html';
            return new Response(body, {
                status: 200,
                headers: {
                    'X-Asset': asked,
                    'X-Asset-Method': request.method,
                    'Content-Type': contentType
                }
            });
        }
    },
    ELYSIUM_API_ORIGIN: 'https://example.invalid'
};

async function call(url, { country = null, cookie = null, method = 'GET', headers: extraHeaders = {} } = {}) {
    const headers = new Headers(extraHeaders);
    if (cookie) headers.set('Cookie', cookie);
    const request = new Request(url, { headers, method });
    if (country) request.cf = { country };
    const response = await worker.fetch(request, env);
    return {
        status: response.status,
        location: response.headers.get('Location'),
        asset: response.headers.get('X-Asset'),
        assetMethod: response.headers.get('X-Asset-Method'),
        cacheControl: response.headers.get('Cache-Control'),
        setCookie: response.headers.get('Set-Cookie'),
        contentType: response.headers.get('Content-Type'),
        allow: response.headers.get('Allow'),
        body: await response.text()
    };
}

// ── Reparto por país en la portada de .eu ────────────────────────────────────

const EU = 'https://elysiumdr.eu/';

test('.eu — España va a su dominio', async () => {
    const r = await call(EU, { country: 'ES' });
    assert.equal(r.status, 302);
    assert.equal(r.location, 'https://elysiumdr.es/');
});

test('.eu — Portugal va a su dominio', async () => {
    const r = await call(EU, { country: 'PT' });
    assert.equal(r.status, 302);
    assert.equal(r.location, 'https://elysiumdr.pt/');
});

test('.eu — Costa Rica se queda en Europa, en español', async () => {
    const r = await call(EU, { country: 'CR' });
    assert.equal(r.status, 302);
    assert.equal(r.location, 'https://elysiumdr.eu/es/');
});

test('.eu — resto de hispanohablantes, Europa en español', async () => {
    for (const country of ['MX', 'AR', 'CO', 'PE', 'CL', 'GQ', 'PR']) {
        const r = await call(EU, { country });
        assert.equal(r.location, 'https://elysiumdr.eu/es/', country);
    }
});

test('.eu — lusófonos que no son Portugal, Europa en portugués', async () => {
    for (const country of ['BR', 'AO', 'MZ', 'CV', 'TL', 'GW', 'ST', 'MO']) {
        const r = await call(EU, { country });
        assert.equal(r.location, 'https://elysiumdr.eu/pt/', country);
    }
});

test('.eu — cualquier otro país se queda en inglés, sin redirección', async () => {
    for (const country of ['US', 'GB', 'DE', 'FR', 'IT', 'JP', 'NL', 'PL']) {
        const r = await call(EU, { country });
        assert.equal(r.status, 200, country);
        assert.equal(r.asset, '/', country);
    }
});

test('.eu — sin país conocido, inglés', async () => {
    const r = await call(EU);
    assert.equal(r.status, 200);
});

test('.eu — la cookie del selector de región anula el reparto', async () => {
    const r = await call(EU, { country: 'PT', cookie: 'elysium_region_override=true' });
    assert.equal(r.status, 200);
});

test('.eu — el parámetro override anula el reparto por país y fija la cookie', async () => {
    const r = await call('https://elysiumdr.eu/?override=true', { country: 'PT' });
    assert.equal(r.status, 200);
    assert.match(r.setCookie || '', /elysium_region_override=true/);
});

test('.eu — el parámetro region anula el reparto por país y fija la cookie', async () => {
    const r = await call('https://elysiumdr.eu/?region=EU', { country: 'ES' });
    assert.equal(r.status, 200);
    assert.match(r.setCookie || '', /elysium_region_override=true/);
});

test('.eu — /en/services se canoniza a /services', async () => {
    const r = await call('https://elysiumdr.eu/en/services');
    assert.equal(r.status, 301);
    assert.equal(r.location, 'https://elysiumdr.eu/services');
});

test('.eu — los aliases de la portada inglesa fijan Europa antes de volver a la raíz', async () => {
    for (const from of [
        'https://elysiumdr.eu/en',
        'https://elysiumdr.eu/en/',
        'https://elysiumdr.eu/en/index',
        'https://elysiumdr.eu/en/index.html'
    ]) {
        const r = await call(from, { country: 'ES' });
        assert.equal(r.status, 301, from);
        assert.equal(r.location, 'https://elysiumdr.eu/?lang=en&region=EU&override=true', from);
    }
});

test('.eu — la redirección por país nunca se cachea', async () => {
    const r = await call(EU, { country: 'PT' });
    assert.equal(r.cacheControl, 'no-store');
});

test('.eu — /index.html también reparte', async () => {
    const r = await call('https://elysiumdr.eu/index.html', { country: 'ES' });
    assert.equal(r.location, 'https://elysiumdr.es/');
});

test('.eu — un enlace profundo NO se reparte', async () => {
    const r = await call('https://elysiumdr.eu/services', { country: 'PT' });
    assert.equal(r.status, 200);
    assert.equal(r.asset, '/services');
});

test('.eu — el reparto conserva el query', async () => {
    const r = await call('https://elysiumdr.eu/?utm_source=li', { country: 'CR' });
    assert.equal(r.location, 'https://elysiumdr.eu/es/?utm_source=li');
});

test('.eu — www va al ápice antes de repartir', async () => {
    const r = await call('https://www.elysiumdr.eu/', { country: 'ES' });
    assert.equal(r.status, 301);
    assert.equal(r.location, 'https://elysiumdr.eu/');
});

// ── Dominios nacionales ──────────────────────────────────────────────────────

const NATIONAL_PAGES = new Map([
    ['es', [
        '', 'about', 'case-moyra', 'case-pmorais', 'case-valtrix', 'contact',
        'daniel-morales', 'llms-full.txt', 'llms.txt',
        'onboarding', 'portfolio', 'privacy', 'prototype-moyra',
        'prototype-pmorais', 'prototype-valtrix', 'research',
        'research/data-driven-sme-intelligence', 'research/ontology-research',
        'review-pmorais', 'services', 'terms', 'thank-you'
    ]],
    ['pt', [
        '', 'about', 'case-moyra', 'case-pmorais', 'case-valtrix', 'contact',
        'daniel-morales', 'llms-full.txt', 'llms.txt', 'onboarding', 'portfolio', 'privacy',
        'prototype-moyra', 'prototype-pmorais', 'prototype-valtrix', 'research',
        'research/data-driven-sme-intelligence', 'research/ontology-research',
        'review-pmorais', 'services', 'terms', 'thank-you'
    ]]
]);

function nationalAsset(language, page) {
    return page ? `/_national/${language}/${page}` : `/_national/${language}/`;
}

function nationalFile(language, page) {
    const filename = !page ? 'index.html' : page.endsWith('.txt') ? page : `${page}.html`;
    return join(ROOT, '_national', language, filename);
}

function nationalPageIsNoindex(language, page) {
    if (page.endsWith('.txt')) return false;
    return /\bnoindex\b/i.test(readFileSync(nationalFile(language, page), 'utf8'));
}

test('.es — la portada sirve el español', async () => {
    const r = await call('https://elysiumdr.es/');
    assert.equal(r.status, 200);
    assert.equal(r.asset, '/_national/es/');
    assert.equal(r.cacheControl, 'no-cache, max-age=0, must-revalidate');
});

test('.es — todas las páginas nacionales salen de la base privada española', async () => {
    for (const page of NATIONAL_PAGES.get('es')) {
        const path = page ? `/${page}` : '/';
        const r = await call(`https://elysiumdr.es${path}`);
        assert.equal(r.status, 200, page || 'index');
        assert.equal(r.asset, nationalAsset('es', page), page || 'index');
        assert.equal(existsSync(nationalFile('es', page)), true, page || 'index');
    }
});

test('.es — lo que no está traducido se sirve de la raíz, no da 404', async () => {
    for (const path of [
        '/profiles', '/admin', '/auth-action', '/ONCORE/', '/Demo-arbol/',
        '/Dr-Johnny-Piedra/', '/proyecto/', '/VALTRIX%20Engineering/',
        '/selva-y-sal', '/CSS/base.css',
        '/Images/logo.png', '/JS/main.js', '/favicon.svg'
    ]) {
        const r = await call(`https://elysiumdr.es${path}`);
        assert.equal(r.status, 200, path);
        assert.equal(r.asset, path, path);
    }
});

test('.es/.pt — index.html y los HTML localizados canonizan a la URL nacional', async () => {
    for (const [from, to] of [
        ['https://elysiumdr.es/index.html?ref=old', 'https://elysiumdr.es/?ref=old'],
        ['https://elysiumdr.es/services.html', 'https://elysiumdr.es/services'],
        ['https://elysiumdr.es/research/ontology-research.html', 'https://elysiumdr.es/research/ontology-research'],
        ['https://elysiumdr.pt/index', 'https://elysiumdr.pt/'],
        ['https://elysiumdr.pt/services.html', 'https://elysiumdr.pt/services']
    ]) {
        const r = await call(from);
        assert.equal(r.status, 301, from);
        assert.equal(r.location, to, from);
        assert.equal(r.asset, null, from);
    }
});

test('.es — /profiles ya no entra en bucle de redirecciones', async () => {
    const r = await call('https://elysiumdr.es/profiles?subscribe=basic_maintenance');
    assert.equal(r.status, 200);
    assert.equal(r.asset, '/profiles?subscribe=basic_maintenance');
});

test('.es — el prefijo /es/ se canoniza a la raíz del dominio', async () => {
    const r = await call('https://elysiumdr.es/es/services');
    assert.equal(r.status, 301);
    assert.equal(r.location, 'https://elysiumdr.es/services');
});

test('.es — el prefijo propio exacto y su query se canonizan dentro de .es', async () => {
    assert.equal((await call('https://elysiumdr.es/es')).location, 'https://elysiumdr.es/');
    assert.equal(
        (await call('https://elysiumdr.es/es/research?from=legacy')).location,
        'https://elysiumdr.es/research?from=legacy'
    );
});

test('.es — un prefijo portugués conserva ruta e idioma dentro de España', async () => {
    const r = await call('https://elysiumdr.es/pt/portfolio');
    assert.equal(r.status, 302);
    assert.equal(r.location, 'https://elysiumdr.es/portfolio?lang=pt');
    assert.equal(r.cacheControl, 'no-store');
});

test('.es — un prefijo inglés conserva ruta e idioma dentro de España', async () => {
    const r = await call('https://elysiumdr.es/en/services');
    assert.equal(r.status, 302);
    assert.equal(r.location, 'https://elysiumdr.es/services?lang=en');
});

test('.es — la barra final se canoniza', async () => {
    const r = await call('https://elysiumdr.es/research/');
    assert.equal(r.status, 307);
    assert.equal(r.location, 'https://elysiumdr.es/research');
});

test('.pt — la portada sirve el portugués', async () => {
    const r = await call('https://elysiumdr.pt/');
    assert.equal(r.asset, '/_national/pt/');
    assert.equal(r.cacheControl, 'no-cache, max-age=0, must-revalidate');
});

test('.pt — todas las páginas nacionales salen de la base privada portuguesa', async () => {
    for (const page of NATIONAL_PAGES.get('pt')) {
        const path = page ? `/${page}` : '/';
        const r = await call(`https://elysiumdr.pt${path}`);
        assert.equal(r.status, 200, page || 'index');
        assert.equal(r.asset, nationalAsset('pt', page), page || 'index');
        assert.equal(existsSync(nationalFile('pt', page)), true, page || 'index');
    }
});

test('.pt — las páginas compartidas siguen en la raíz', async () => {
    assert.equal((await call('https://elysiumdr.pt/profiles')).asset, '/profiles');
    assert.equal((await call('https://elysiumdr.pt/ONCORE/')).asset, '/ONCORE/');
});

test('.pt — un prefijo español conserva ruta e idioma dentro de Portugal', async () => {
    const r = await call('https://elysiumdr.pt/es/about');
    assert.equal(r.status, 302);
    assert.equal(r.location, 'https://elysiumdr.pt/about?lang=es');
});

test('.pt — un prefijo inglés conserva ruta e idioma dentro de Portugal', async () => {
    const r = await call('https://elysiumdr.pt/en/services');
    assert.equal(r.status, 302);
    assert.equal(r.location, 'https://elysiumdr.pt/services?lang=en');
});

test('.pt — el prefijo propio se canoniza sin salir de .pt', async () => {
    assert.equal(
        (await call('https://elysiumdr.pt/pt/services?from=legacy')).location,
        'https://elysiumdr.pt/services?from=legacy'
    );
    assert.equal((await call('https://elysiumdr.pt/pt')).location, 'https://elysiumdr.pt/');
});

test('.pt — www va al ápice conservando la ruta', async () => {
    const r = await call('https://www.elysiumdr.pt/services');
    assert.equal(r.status, 301);
    assert.equal(r.location, 'https://elysiumdr.pt/services');
});

test('las landings regionales heredadas tienen una sola región canónica', async () => {
    for (const [from, to] of [
        [
            'https://elysiumdr.es/infraestructura-digital-pymes-costa-rica?src=old',
            'https://elysiumdr.eu/es/infraestructura-digital-pymes-costa-rica?src=old'
        ],
        [
            'https://elysiumdr.es/infraestructura-digital-pymes-espana.html?src=old',
            'https://elysiumdr.es/?src=old'
        ],
        [
            'https://elysiumdr.pt/infraestrutura-digital-pme-portugal/',
            'https://elysiumdr.pt/'
        ],
        [
            'https://elysiumdr.eu/es/infraestructura-digital-pymes-espana',
            'https://elysiumdr.es/'
        ],
        [
            'https://elysiumdr.eu/pt/infraestrutura-digital-pme-portugal',
            'https://elysiumdr.pt/'
        ]
    ]) {
        const r = await call(from);
        assert.equal(r.status, 301, from);
        assert.equal(r.location, to, from);
        assert.equal(r.asset, null, from);
    }

    const costaRica = await call('https://elysiumdr.eu/es/infraestructura-digital-pymes-costa-rica');
    assert.equal(costaRica.status, 200);
    assert.equal(costaRica.asset, '/es/infraestructura-digital-pymes-costa-rica');
});

test('/p y sus variantes se canonizan a portfolio sin cambiar de región', async () => {
    for (const [from, to, status = 301] of [
        ['https://elysiumdr.eu/p', 'https://elysiumdr.eu/portfolio'],
        ['https://elysiumdr.eu/es/p.html?x=1', 'https://elysiumdr.eu/es/portfolio?x=1'],
        ['https://elysiumdr.eu/pt/p/', 'https://elysiumdr.eu/pt/portfolio'],
        ['https://elysiumdr.es/p.html', 'https://elysiumdr.es/portfolio'],
        ['https://elysiumdr.pt/es/p', 'https://elysiumdr.pt/portfolio?lang=es', 302],
        ['https://elysiumdr.es/pt/p?from=legacy', 'https://elysiumdr.es/portfolio?from=legacy&lang=pt', 302]
    ]) {
        const r = await call(from);
        assert.equal(r.status, status, from);
        assert.equal(r.location, to, from);
    }
});

test('el prototipo interno no se hace pasar por contenido nacional', async () => {
    for (const origin of ['https://elysiumdr.es', 'https://elysiumdr.pt']) {
        const r = await call(`${origin}/prototype-selva-y-sal.html?from=old`);
        assert.equal(r.status, 301, origin);
        assert.equal(r.location, `${origin}/portfolio?from=old`, origin);
        assert.equal(r.asset, null, origin);
    }
});

// ── SEO por host ────────────────────────────────────────────────────────────

test('.es/.pt — sitemap solo contiene canónicas indexables del mismo dominio', async () => {
    for (const [language, host] of [['es', 'elysiumdr.es'], ['pt', 'elysiumdr.pt']]) {
        const origin = `https://${host}`;
        const r = await call(`${origin}/sitemap.xml`);
        assert.equal(r.status, 200, host);
        assert.equal(r.asset, null, host);
        assert.equal(r.contentType, 'application/xml; charset=utf-8', host);
        assert.match(r.body, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<urlset\b/, host);

        const excludedByRegion = new Set();
        const expected = NATIONAL_PAGES.get(language)
            .filter(page => !nationalPageIsNoindex(language, page) && !excludedByRegion.has(page))
            .map(page => page ? `${origin}/${page}` : `${origin}/`);
        const locations = [...r.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);

        assert.deepEqual(locations, expected, host);
        assert.equal(locations.length, 20, host);
        assert.equal(locations.every(location => location.startsWith(`${origin}/`)), true, host);
        assert.doesNotMatch(r.body, /elysiumdr\.eu|\/_national\/|\/__i18n/, host);
        assert.doesNotMatch(r.body, /\/(?:es|pt)\//, host);
        assert.doesNotMatch(r.body, /\/(?:onboarding|thank-you)<\/loc>/, host);
    }
});

test('.eu — su sitemap físico permanece intacto', async () => {
    const r = await call('https://elysiumdr.eu/sitemap.xml');
    assert.equal(r.status, 200);
    assert.equal(r.asset, '/sitemap.xml');
    assert.equal(r.body, 'ok');
});

test('sitemap nacional admite HEAD, no POST', async () => {
    const head = await call('https://elysiumdr.es/sitemap.xml', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.contentType, 'application/xml; charset=utf-8');
    assert.equal(head.body, '');

    const post = await call('https://elysiumdr.pt/sitemap.xml', { method: 'POST' });
    assert.equal(post.status, 405);
    assert.equal(post.allow, 'GET, HEAD');
});

test('robots.txt es host-specific y bloquea solo los namespaces internos en cada grupo', async () => {
    for (const host of ['elysiumdr.eu', 'elysiumdr.es', 'elysiumdr.pt']) {
        const r = await call(`https://${host}/robots.txt`);
        assert.equal(r.status, 200, host);
        assert.equal(r.asset, null, host);
        assert.equal(r.contentType, 'text/plain; charset=utf-8', host);
        assert.match(r.body, new RegExp(`^Sitemap: https://${host.replaceAll('.', '\\.')}\/sitemap\\.xml$`, 'm'), host);
        assert.equal((r.body.match(/^User-agent:/gm) || []).length, 2, host);
        assert.equal((r.body.match(/^Disallow: \/_national\/$/gm) || []).length, 2, host);
        assert.equal((r.body.match(/^Disallow: \/__i18n$/gm) || []).length, 2, host);
        assert.match(r.body, /^Allow: \/$/m, host);
        assert.doesNotMatch(r.body, /^Disallow: \/$/m, host);
        if (host !== 'elysiumdr.eu') assert.doesNotMatch(r.body, /elysiumdr\.eu/, host);
    }
});

test('robots.txt admite HEAD, no POST', async () => {
    const head = await call('https://elysiumdr.pt/robots.txt', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.asset, null);
    assert.equal(head.body, '');

    const post = await call('https://elysiumdr.eu/robots.txt', { method: 'POST' });
    assert.equal(post.status, 405);
    assert.equal(post.allow, 'GET, HEAD');
});

// ── Bases nacionales privadas y fuente same-origin para i18n ───────────────────

test('/_national nunca es una URL pública, ni siquiera escapada', async () => {
    for (const origin of ['https://elysiumdr.eu', 'https://elysiumdr.es', 'https://elysiumdr.pt']) {
        for (const path of [
            '/_national', '/_national/', '/_national/es/', '/_national/pt/services',
            '/%5fnational/es/', '/%255fnational%252fpt%252fservices'
        ]) {
            const r = await call(origin + path);
            assert.equal(r.status, 404, `${origin}${path}`);
            assert.equal(r.asset, null, `${origin}${path}`);
            assert.equal(r.cacheControl, 'no-store', `${origin}${path}`);
        }
    }
    assert.equal((await call('https://elysiumdr.eu/_nationality')).status, 200);
});

test('/__i18n entrega cada idioma europeo sin navegar ni cambiar el host nacional', async () => {
    const targets = new Map([
        ['en', '/services'],
        ['es', '/es/services'],
        ['pt', '/pt/services']
    ]);

    for (const origin of ['https://elysiumdr.es', 'https://elysiumdr.pt']) {
        for (const [lang, asset] of targets) {
            const params = new URLSearchParams({ lang, path: '/services' });
            const r = await call(`${origin}/__i18n?${params}`);
            assert.equal(r.status, 200, `${origin} ${lang}`);
            assert.equal(r.asset, asset, `${origin} ${lang}`);
            assert.equal(r.location, null, `${origin} ${lang}`);
            assert.equal(r.contentType, 'text/html; charset=utf-8', `${origin} ${lang}`);
            assert.equal(r.cacheControl, 'no-store', `${origin} ${lang}`);
        }
    }
});

test('/__i18n resuelve las tres portadas físicas europeas', async () => {
    for (const [lang, asset] of [['en', '/'], ['es', '/es/'], ['pt', '/pt/']]) {
        const params = new URLSearchParams({ lang, path: '/' });
        assert.equal((await call(`https://elysiumdr.es/__i18n?${params}`)).asset, asset, lang);
        assert.equal((await call(`https://elysiumdr.pt/__i18n?${params}`)).asset, asset, lang);
    }
});

test('/__i18n conserva rutas comunes anidadas', async () => {
    const path = '/research/ontology-research';
    for (const [lang, asset] of [
        ['en', path], ['es', `/es${path}`], ['pt', `/pt${path}`]
    ]) {
        const params = new URLSearchParams({ lang, path });
        assert.equal((await call(`https://elysiumdr.pt/__i18n?${params}`)).asset, asset, lang);
    }
});

test('/__i18n no mezcla landings regionales con la portada de otro idioma', async () => {
    for (const [origin, path] of [
        ['https://elysiumdr.es', '/infraestructura-digital-pymes-espana'],
        ['https://elysiumdr.es', '/infraestructura-digital-pymes-costa-rica'],
        ['https://elysiumdr.pt', '/infraestrutura-digital-pme-portugal']
    ]) {
        const params = new URLSearchParams({ lang: 'en', path });
        const r = await call(`${origin}/__i18n?${params}`);
        assert.equal(r.status, 404, `${origin}${path}`);
        assert.equal(r.asset, null, `${origin}${path}`);
    }
});

test('/__i18n solo acepta una combinación exacta y segura de lang/path', async () => {
    const invalidQueries = [
        '',
        'lang=en',
        'path=%2Fservices',
        'lang=fr&path=%2Fservices',
        'lang=en&lang=pt&path=%2Fservices',
        'lang=en&path=%2Fservices&path=%2Fabout',
        'lang=en&path=services',
        'lang=en&path=%2Fservices%2F',
        'lang=en&path=%2F..%2Fprivacy',
        'lang=en&path=%2F%252e%252e%2Fprivacy',
        'lang=en&path=%2F%255c..%255cprivacy',
        'lang=en&path=%2F%2Fevil.example'
    ];
    for (const query of invalidQueries) {
        const r = await call(`https://elysiumdr.es/__i18n?${query}`);
        assert.equal(r.status, 400, query);
        assert.equal(r.asset, null, query);
    }
});

test('/__i18n no expone páginas arbitrarias ni recursos que no sean HTML', async () => {
    for (const path of ['/admin', '/profiles', '/css/base', '/llms']) {
        const params = new URLSearchParams({ lang: 'en', path });
        const r = await call(`https://elysiumdr.es/__i18n?${params}`);
        assert.equal(r.status, 404, path);
        assert.equal(r.asset, null, path);
    }
});

test('/__i18n solo existe en .es/.pt y solo admite GET o HEAD', async () => {
    const query = new URLSearchParams({ lang: 'en', path: '/services' });
    assert.equal((await call(`https://elysiumdr.eu/__i18n?${query}`)).status, 404);
    assert.equal((await call(`https://elysiumdr.es/__i18n/extra?${query}`)).status, 404);

    const post = await call(`https://elysiumdr.es/__i18n?${query}`, { method: 'POST' });
    assert.equal(post.status, 405);
    assert.equal(post.allow, 'GET, HEAD');
    assert.equal(post.asset, null);

    const head = await call(`https://elysiumdr.pt/__i18n?${query}`, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.asset, '/services');
    assert.equal(head.assetMethod, 'HEAD');
    assert.equal(head.body, '');
});

// ── Rutas heredadas, solo en .eu ─────────────────────────────────────────────

test('.eu — /es/profiles sigue redirigiendo al portal con idioma', async () => {
    const r = await call('https://elysiumdr.eu/es/profiles');
    assert.equal(r.status, 308);
    assert.equal(r.location, 'https://elysiumdr.eu/profiles?lang=es');
});

test('.eu — /admin/ vuelve al CRM', async () => {
    const r = await call('https://elysiumdr.eu/admin/?x=1');
    assert.equal(r.status, 308);
    assert.equal(r.location, 'https://elysiumdr.eu/admin?x=1');
});

test('.eu — los idiomas siguen accesibles por prefijo', async () => {
    assert.equal((await call('https://elysiumdr.eu/es/services')).asset, '/es/services');
    assert.equal((await call('https://elysiumdr.eu/pt/services')).asset, '/pt/services');
});

// ── La API sigue saliendo por el proxy en todos los dominios ─────────────────

test('/api/ no lo toca la localización: llega al backend desde cualquier dominio', async () => {
    for (const origin of ['https://elysiumdr.es', 'https://elysiumdr.pt', 'https://elysiumdr.eu']) {
        const response = await worker.fetch(new Request(`${origin}/api/contact`), {
            ...env,
            ELYSIUM_API_ORIGIN: ''
        });
        // Sin origen configurado el proxy responde 503 `api_not_configured`.
        // Lo que importa es que la petición llegue ahí y no a un asset.
        assert.equal(response.status, 503, origin);
        assert.equal((await response.json()).code, 'api_not_configured', origin);
    }
});

// ── Desafío OAuth de la API ─────────────────────────────────────────────────────

test('los 401 de /api anuncian los metadatos OAuth del host público', async t => {
    t.mock.method(globalThis, 'fetch', async () => new Response('Authentication required.', {
        status: 401
    }));

    for (const host of ['elysiumdr.eu', 'elysiumdr.es', 'elysiumdr.pt']) {
        const response = await worker.fetch(new Request(`https://${host}/api/capabilities`), env);
        assert.equal(response.status, 401, host);
        assert.equal(
            response.headers.get('WWW-Authenticate'),
            `Bearer resource_metadata="https://${host}/.well-known/oauth-protected-resource/api"`,
            host
        );
    }
});

test('el proxy conserva el WWW-Authenticate que ya trae el upstream', async t => {
    const upstreamChallenge = 'Bearer realm="elysium", error="invalid_token"';
    t.mock.method(globalThis, 'fetch', async () => new Response('Invalid token.', {
        status: 401,
        headers: { 'WWW-Authenticate': upstreamChallenge }
    }));

    const response = await worker.fetch(
        new Request('https://elysiumdr.eu/api/capabilities'),
        env
    );
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('WWW-Authenticate'), upstreamChallenge);
});

// ── www ────────────────────────────────────────────────────────────────────────────

test('www — los tres dominios redirigen a su propio ápice', async () => {
    for (const [from, to] of [
        ['https://www.elysiumdr.eu/about', 'https://elysiumdr.eu/about'],
        ['https://www.elysiumdr.es/services', 'https://elysiumdr.es/services'],
        ['https://www.elysiumdr.pt/portfolio', 'https://elysiumdr.pt/portfolio']
    ]) {
        const r = await call(from);
        assert.equal(r.status, 301, from);
        assert.equal(r.location, to, from);
    }
});

test('www — el query sobrevive a la redirección', async () => {
    const r = await call('https://www.elysiumdr.es/profiles?subscribe=basic_maintenance');
    assert.equal(r.location, 'https://elysiumdr.es/profiles?subscribe=basic_maintenance');
});

test('www — nunca sirve contenido: no hay dos URLs para la misma página', async () => {
    for (const url of [
        'https://www.elysiumdr.eu/', 'https://www.elysiumdr.es/', 'https://www.elysiumdr.pt/'
    ]) {
        assert.equal((await call(url)).asset, null, url);
    }
});
