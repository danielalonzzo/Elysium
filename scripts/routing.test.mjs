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
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const WORKER = join(dirname(fileURLToPath(import.meta.url)), '..', 'worker', 'index.js');
const worker = (await import(`file://${WORKER}`)).default;

// env.ASSETS falso: devuelve 200 y anota qué ruta se le pidió.
const env = {
    ASSETS: {
        fetch(request) {
            const asked = new URL(request.url).pathname + new URL(request.url).search;
            return new Response('ok', { status: 200, headers: { 'X-Asset': asked } });
        }
    },
    ELYSIUM_API_ORIGIN: 'https://example.invalid'
};

async function call(url, { country = null, cookie = null } = {}) {
    const headers = cookie ? { Cookie: cookie } : {};
    const request = new Request(url, { headers });
    if (country) request.cf = { country };
    const response = await worker.fetch(request, env);
    return {
        status: response.status,
        location: response.headers.get('Location'),
        asset: response.headers.get('X-Asset'),
        cacheControl: response.headers.get('Cache-Control')
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

test('.es — la portada sirve el español', async () => {
    const r = await call('https://elysiumdr.es/');
    assert.equal(r.status, 200);
    assert.equal(r.asset, '/es/');
});

test('.es — las páginas traducidas se sirven sin prefijo en la URL', async () => {
    for (const [path, asset] of [
        ['/services', '/es/services'],
        ['/about', '/es/about'],
        ['/contact', '/es/contact'],
        ['/portfolio', '/es/portfolio'],
        ['/case-moyra', '/es/case-moyra'],
        ['/llms.txt', '/es/llms.txt'],
        ['/llms-full.txt', '/es/llms-full.txt'],
        ['/research', '/es/research'],
        ['/research/ontology-research', '/es/research/ontology-research'],
        ['/infraestructura-digital-pymes-espana', '/es/infraestructura-digital-pymes-espana']
    ]) {
        const r = await call(`https://elysiumdr.es${path}`);
        assert.equal(r.status, 200, path);
        assert.equal(r.asset, asset, path);
    }
});

test('.es — lo que no está traducido se sirve de la raíz, no da 404', async () => {
    for (const path of [
        '/profiles', '/admin', '/auth-action', '/ONCORE/', '/Demo-arbol/',
        '/Dr-Johnny-Piedra/', '/proyecto/', '/VALTRIX%20Engineering/',
        '/selva-y-sal', '/sitemap.xml', '/robots.txt', '/CSS/base.css',
        '/Images/logo.png', '/JS/main.js', '/favicon.svg', '/services.html'
    ]) {
        const r = await call(`https://elysiumdr.es${path}`);
        assert.equal(r.status, 200, path);
        assert.equal(r.asset, path, path);
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

test('.es — el prefijo /pt/ se va al dominio portugués', async () => {
    const r = await call('https://elysiumdr.es/pt/portfolio');
    assert.equal(r.status, 301);
    assert.equal(r.location, 'https://elysiumdr.pt/portfolio');
});

test('.es — la barra final se canoniza', async () => {
    const r = await call('https://elysiumdr.es/research/');
    assert.equal(r.status, 307);
    assert.equal(r.location, 'https://elysiumdr.es/research');
});

test('.pt — la portada sirve el portugués', async () => {
    const r = await call('https://elysiumdr.pt/');
    assert.equal(r.asset, '/pt/');
});

test('.pt — páginas traducidas y compartidas', async () => {
    assert.equal((await call('https://elysiumdr.pt/services')).asset, '/pt/services');
    assert.equal((await call('https://elysiumdr.pt/profiles')).asset, '/profiles');
    assert.equal((await call('https://elysiumdr.pt/ONCORE/')).asset, '/ONCORE/');
    assert.equal(
        (await call('https://elysiumdr.pt/infraestrutura-digital-pme-portugal')).asset,
        '/pt/infraestrutura-digital-pme-portugal'
    );
});

test('.pt — el prefijo /es/ se va al dominio español', async () => {
    const r = await call('https://elysiumdr.pt/es/about');
    assert.equal(r.status, 301);
    assert.equal(r.location, 'https://elysiumdr.es/about');
});

test('.pt — www va al ápice conservando la ruta', async () => {
    const r = await call('https://www.elysiumdr.pt/services');
    assert.equal(r.status, 301);
    assert.equal(r.location, 'https://elysiumdr.pt/services');
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

// ── www ──────────────────────────────────────────────────────────────────────

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
