/**
 * Pruebas del descubrimiento para agentes: los ficheros de `/.well-known/`, la
 * negociación de Markdown y el servidor MCP de `/mcp`.
 *
 * Lo que se comprueba aquí no se ve abriendo el sitio. Un `Content-Type`
 * equivocado en `/.well-known/api-catalog`, un `Vary` que falta en la respuesta
 * en Markdown o una herramienta MCP que entrega `/admin` no cambian nada de lo
 * que ve una persona en el navegador: solo se notan desde un cliente
 * automático, y para entonces ya están publicados.
 *
 * El `env.ASSETS` falso lee los ficheros de verdad del repositorio y reproduce
 * el `html_handling: auto-trailing-slash` de Cloudflare, así que `/services`
 * entrega `services.html` igual que en producción.
 *
 * Uso:  node --test scripts/agents.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const worker = (await import(`file://${join(ROOT, 'worker', 'index.js')}`)).default;

const TYPES = new Map(Object.entries({
    html: 'text/html; charset=utf-8',
    json: 'application/json',
    md: 'text/markdown',
    txt: 'text/plain; charset=utf-8',
    xml: 'application/xml'
}));

const exists = path => { try { return statSync(path).isFile(); } catch { return false; } };

/** Resuelve una ruta pública a un fichero, como hacen los assets de Cloudflare. */
function resolveAsset(pathname) {
    const relative = decodeURIComponent(pathname).replace(/^\/+/, '');
    const candidates = [
        relative,
        `${relative}.html`,
        join(relative, 'index.html')
    ];
    for (const candidate of candidates) {
        const full = join(ROOT, candidate);
        if (candidate && exists(full)) return full;
    }
    return null;
}

const env = {
    ASSETS: {
        fetch(request) {
            const { pathname } = new URL(request.url);
            const file = resolveAsset(pathname);
            if (!file) return new Response('not found', { status: 404 });
            const type = TYPES.get(file.split('.').pop()) || 'application/octet-stream';
            return new Response(readFileSync(file), {
                status: 200,
                headers: {
                    'Content-Type': type,
                    'Cache-Control': 'public, max-age=3600',
                    ETag: '"asset-compartido"',
                    'Last-Modified': 'Mon, 24 Aug 2026 00:00:00 GMT'
                }
            });
        }
    },
    ELYSIUM_API_ORIGIN: 'https://example.invalid'
};

const call = (url, init = {}) => worker.fetch(new Request(url, init), env);

// ── Ficheros de descubrimiento ───────────────────────────────────────────────

test('el catálogo de APIs se sirve sin extensión y como linkset', async () => {
    const response = await call('https://elysiumdr.eu/.well-known/api-catalog');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'application/linkset+json');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
    const body = await response.json();
    assert.ok(Array.isArray(body.linkset) && body.linkset.length > 0);
    const [api] = body.linkset;
    assert.equal(api.anchor, 'https://elysiumdr.eu/api');
    assert.equal(
        api['service-meta'][0].href,
        'https://elysiumdr.eu/.well-known/oauth-protected-resource/api'
    );

    const metadataResponse = await call(api['service-meta'][0].href);
    assert.equal(metadataResponse.status, 200);
    const metadata = await metadataResponse.json();
    assert.equal(metadata.resource, api.anchor);
});

test('el manifiesto ARD lleva CORS abierto, como exige la especificación', async () => {
    const response = await call('https://elysiumdr.eu/.well-known/ai-catalog.json');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'application/json');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
    const body = await response.json();
    assert.ok(body.entries.every(entry => ('url' in entry) !== ('data' in entry)));
    assert.ok(body.entries.every(entry => entry.representativeQueries.length >= 2
        && entry.representativeQueries.length <= 5));
    const authentication = body.entries.find(
        entry => entry.identifier === 'urn:air:elysiumdr.eu:auth:protected-resource'
    );
    assert.equal(
        authentication?.url,
        'https://elysiumdr.eu/.well-known/oauth-protected-resource/api'
    );
});

test('OpenAPI enlaza la documentación de autenticación de forma estructurada', async () => {
    const response = await call('https://elysiumdr.eu/openapi.json');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'application/openapi+json');
    const body = await response.json();
    assert.equal(body.externalDocs?.url, 'https://elysiumdr.eu/auth.md');
});

/**
 * La clave es `identifier`, no `id`.
 *
 * Se publicó como `id` y el manifiesto entero se daba por inválido desde la
 * primera entrada, sin que nada fallara: es JSON correcto y el sitio se sigue
 * viendo igual. Lo mismo vale para el `host`, que necesita nombre e
 * identificador propios.
 */
test('cada entrada del manifiesto ARD se identifica como manda la especificación', async () => {
    const response = await call('https://elysiumdr.eu/.well-known/ai-catalog.json');
    const body = await response.json();

    assert.equal(typeof body.specVersion, 'string');
    assert.ok(body.specVersion.length > 0);
    assert.equal(body.host.identifier, 'urn:air:elysiumdr.eu');
    assert.ok(body.host.displayName);

    for (const entry of body.entries) {
        assert.ok(entry.identifier?.startsWith('urn:air:elysiumdr.eu:'),
            `entrada sin identifier en forma urn:air: ${JSON.stringify(entry.displayName)}`);
        assert.ok(entry.displayName, `${entry.identifier} no tiene displayName`);
        assert.ok(entry.type, `${entry.identifier} no declara tipo de medio`);
        assert.ok(!('id' in entry), `${entry.identifier} conserva la clave vieja "id"`);
    }
});

test('los metadatos de recurso protegido apuntan al emisor real de Firebase', async () => {
    const response = await call('https://elysiumdr.eu/.well-known/oauth-protected-resource');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'application/json');
    const body = await response.json();
    assert.equal(body.resource, 'https://elysiumdr.eu');
    assert.deepEqual(body.authorization_servers, ['https://securetoken.google.com/elysiumdr-eu']);
    assert.deepEqual(body.bearer_methods_supported, ['header']);
    // RFC 9728 prohíbe los arrays vacíos. La API no usa scopes, así que no se
    // inventa uno para satisfacer comprobadores que exigen una lista no vacía.
    assert.ok(!('scopes_supported' in body));
    // Estas claves describirían firmas de respuestas del recurso, no las claves
    // con las que Firebase firma los ID tokens que recibe la API.
    assert.ok(!('jwks_uri' in body));
    assert.ok(!('resource_signing_alg_values_supported' in body));
    assert.equal(response.headers.get('ETag'), null);
    assert.equal(response.headers.get('Last-Modified'), null);
});

test('los metadatos de recurso protegido se atan al host y al path solicitados', async () => {
    const national = await (await call(
        'https://elysiumdr.pt/.well-known/oauth-protected-resource'
    )).json();
    assert.equal(national.resource, 'https://elysiumdr.pt');
    assert.equal(national.resource_documentation, 'https://elysiumdr.pt/auth.md');

    const api = await (await call(
        'https://elysiumdr.eu/.well-known/oauth-protected-resource/api'
    )).json();
    assert.equal(api.resource, 'https://elysiumdr.eu/api');
});

/**
 * El encabezado de `/auth.md` tiene que nombrar el propio formato.
 *
 * Es lo que busca quien comprueba desde fuera si el fichero es un Auth.md, y no
 * un texto cualquiera que casualmente se llama así.
 */
test('auth.md se anuncia como Auth.md en su encabezado', async () => {
    const response = await call('https://elysiumdr.eu/auth.md');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('Content-Type'), /^text\/markdown/);
    const text = await response.text();
    const heading = text.split('\n').find(line => line.startsWith('# '));
    assert.match(heading, /auth\.md/i);
    assert.ok(text.includes(
        'https://elysiumdr.eu/.well-known/oauth-protected-resource/api'
    ));
});

test('los SKILL.md se sirven como Markdown, y su digest coincide con el índice', async () => {
    const index = await (await call('https://elysiumdr.eu/.well-known/agent-skills/index.json')).json();
    const { createHash } = await import('node:crypto');
    for (const skill of index.skills) {
        const response = await call(skill.url);
        assert.equal(response.status, 200, skill.name);
        assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
        const body = Buffer.from(await response.arrayBuffer());
        assert.equal(createHash('sha256').update(body).digest('hex'), skill.sha256, skill.name);
    }
});

test('los ficheros de descubrimiento contestan la preflight de CORS', async () => {
    const response = await call('https://elysiumdr.eu/.well-known/ai-catalog.json', { method: 'OPTIONS' });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
});

test('HEAD nunca entrega cuerpo, ni cuando falta un fichero de descubrimiento', async () => {
    const present = await call('https://elysiumdr.eu/auth.md', { method: 'HEAD' });
    assert.equal(present.status, 200);
    assert.equal(await present.text(), '');

    const missing = await call(
        'https://elysiumdr.eu/.well-known/agent-skills/missing/SKILL.md',
        { method: 'HEAD' }
    );
    assert.equal(missing.status, 404);
    assert.equal(await missing.text(), '');
});

/**
 * Las herramientas del navegador solo existen si la portada carga el fichero.
 *
 * Las tres portadas físicas ya cargaban `JS/webmcp.js`, pero las dos bases que
 * realmente sirven `.es` y `.pt` después de la reescritura no. No hay forma de
 * verlo abriendo el sitio —la portada se ve igual con el script y sin él—, así
 * que se comprueban las cinco fuentes aquí.
 */
test('todas las portadas públicas declaran las herramientas WebMCP y el manifiesto ARD', () => {
    const portadas = [
        ['index.html', 'JS/webmcp.js'],
        ['es/index.html', '../JS/webmcp.js'],
        ['pt/index.html', '../JS/webmcp.js'],
        ['_national/es/index.html', '../JS/webmcp.js'],
        ['_national/pt/index.html', '../JS/webmcp.js']
    ];
    for (const [page, src] of portadas) {
        const html = readFileSync(join(ROOT, page), 'utf8');
        assert.ok(html.includes(`<script src="${src}"`), `${page} no carga ${src}`);
        assert.ok(html.includes('rel="ai-catalog"'), `${page} no enlaza el manifiesto ARD`);
    }
});

/** El fichero usa la API vigente y conserva compatibilidad con el comprobador. */
test('WebMCP prefiere document.registerTool y conserva el respaldo antiguo', () => {
    const source = readFileSync(join(ROOT, 'JS', 'webmcp.js'), 'utf8');
    assert.match(source, /document\.modelContext/);
    assert.match(source, /navigator\.modelContext/);
    assert.match(source, /registerTool/);
    assert.match(source, /provideContext/);
    assert.match(source, /AbortController/);
});

test('WebMCP registra cuatro herramientas y las retira al abandonar la página', async () => {
    const source = readFileSync(join(ROOT, 'JS', 'webmcp.js'), 'utf8');
    const registrations = [];
    let onPageHide = null;

    await runInNewContext(source, {
        document: {
            modelContext: {
                registerTool(tool, options) {
                    registrations.push({ tool, signal: options.signal });
                    return Promise.resolve();
                }
            }
        },
        navigator: {
            modelContext: {
                registerTool() {
                    throw new Error('No debe usarse navigator cuando document ofrece la API vigente.');
                }
            }
        },
        AbortController,
        URL,
        location: { origin: 'https://elysiumdr.eu', assign() {} },
        fetch() { throw new Error('Registrar herramientas no debe hacer peticiones.'); },
        addEventListener(type, listener) {
            if (type === 'pagehide') onPageHide = listener;
        },
        console
    });

    assert.deepEqual(
        registrations.map(({ tool }) => tool.name),
        ['search_elysium', 'list_pages', 'get_page', 'open_page']
    );
    assert.ok(registrations.every(({ signal }) => !signal.aborted));
    assert.equal(
        registrations.find(({ tool }) => tool.name === 'open_page').tool.annotations.readOnlyHint,
        false
    );
    assert.equal(typeof onPageHide, 'function');
    onPageHide();
    assert.ok(registrations.every(({ signal }) => signal.aborted));
});

test('los dominios nacionales sirven los mismos ficheros, sin prefijo de idioma', async () => {
    const response = await call('https://elysiumdr.es/.well-known/api-catalog');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'application/linkset+json');
});

// ── Markdown para agentes ────────────────────────────────────────────────────

test('sin Accept: text/markdown se sigue sirviendo HTML', async () => {
    const response = await call('https://elysiumdr.eu/services', {
        headers: { Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' }
    });
    assert.match(response.headers.get('Content-Type'), /text\/html/);
});

test('con Accept: text/markdown la página llega en Markdown', async () => {
    const response = await call('https://elysiumdr.eu/services', {
        headers: { Accept: 'text/markdown' }
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.equal(response.headers.get('Vary'), 'Accept');
    assert.ok(Number(response.headers.get('x-markdown-tokens')) > 0);

    const body = await response.text();
    assert.match(body, /^# Services/);
    assert.doesNotMatch(body, /<div|<script/);
    // Los enlaces relativos salen resueltos a la URL pública, sin `.html`.
    assert.match(body, /\]\(https:\/\/elysiumdr\.eu\/portfolio\)/);
});

test('el comodín de un navegador no se confunde con pedir Markdown', async () => {
    const response = await call('https://elysiumdr.eu/services', {
        headers: { Accept: 'text/html,application/xhtml+xml;q=0.9,text/markdown;q=0.1' }
    });
    assert.match(response.headers.get('Content-Type'), /text\/html/);
});

test('la respuesta en Markdown no se cachea: una caché la serviría a un navegador', async () => {
    const response = await call('https://elysiumdr.eu/services', { headers: { Accept: 'text/markdown' } });
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('el dominio nacional entrega su idioma en Markdown', async () => {
    const response = await call('https://elysiumdr.es/services', { headers: { Accept: 'text/markdown' } });
    assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    const body = await response.text();
    assert.match(body, /Servicios|Servicio/);
});

test('lo que no es HTML pasa intacto aunque se pida Markdown', async () => {
    const response = await call('https://elysiumdr.eu/sitemap.xml', { headers: { Accept: 'text/markdown' } });
    assert.match(response.headers.get('Content-Type'), /xml/);
});

// ── Servidor MCP ─────────────────────────────────────────────────────────────

const rpc = (method, params, id = 1) => call('https://elysiumdr.eu/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params })
});

test('initialize anuncia la versión del protocolo y las herramientas', async () => {
    const body = await (await rpc('initialize', { protocolVersion: '2025-06-18' })).json();
    assert.equal(body.jsonrpc, '2.0');
    assert.equal(body.result.protocolVersion, '2025-06-18');
    assert.ok(body.result.capabilities.tools);
    assert.equal(body.result.serverInfo.name, 'elysiumdr.eu');
});

test('la tarjeta publicada coincide con lo que responde el servidor', async () => {
    const card = await (await call('https://elysiumdr.eu/.well-known/mcp/server-card.json')).json();
    const body = await (await rpc('initialize', {})).json();
    assert.equal(card.serverInfo.name, body.result.serverInfo.name);
    assert.equal(card.serverInfo.version, body.result.serverInfo.version);
    assert.equal(card.protocolVersion, body.result.protocolVersion);
    assert.equal(card.transport.endpoint, 'https://elysiumdr.eu/mcp');
});

test('tools/list declara las tres herramientas con su esquema', async () => {
    const body = await (await rpc('tools/list')).json();
    const names = body.result.tools.map(tool => tool.name).sort();
    assert.deepEqual(names, ['get_page', 'list_pages', 'search_site']);
    for (const tool of body.result.tools) {
        assert.equal(tool.inputSchema.type, 'object');
        assert.ok(tool.description.length > 20);
    }
});

test('list_pages sale del sitemap y no incluye lo privado', async () => {
    const body = await (await rpc('tools/call', { name: 'list_pages', arguments: {} })).json();
    const text = body.result.content[0].text;
    assert.match(text, /https:\/\/elysiumdr\.eu\/services/);
    assert.doesNotMatch(text, /\/admin|\/profiles|\/Titulos\//);
});

test('get_page entrega Markdown de una página pública', async () => {
    const body = await (await rpc('tools/call', { name: 'get_page', arguments: { path: '/contact' } })).json();
    assert.notEqual(body.result.isError, true);
    assert.match(body.result.content[0].text, /info@elysiumdr\.eu/);
});

test('get_page se niega a entregar el portal, el CRM o los diplomas', async () => {
    for (const path of ['/admin', '/profiles', '/Titulos/algo.pdf', '/api/health', '/onboarding']) {
        const body = await (await rpc('tools/call', { name: 'get_page', arguments: { path } })).json();
        assert.equal(body.result.isError, true, path);
    }
});

test('get_page no se escapa del sitio con una URL de otro origen', async () => {
    const body = await (await rpc('tools/call', {
        name: 'get_page',
        arguments: { path: 'https://example.com/secret' }
    })).json();
    // La ruta se resuelve contra el propio origen: nunca sale de elysiumdr.eu.
    assert.equal(body.result.isError, true);
});

test('search_site encuentra los planes y dice de qué sección salen', async () => {
    const body = await (await rpc('tools/call', {
        name: 'search_site', arguments: { query: 'Ecosystem subscription', limit: 3 }
    })).json();
    const text = body.result.content[0].text;
    assert.notEqual(body.result.isError, true);
    assert.match(text, /##/);
});

test('search_site ignora los acentos', async () => {
    const withAccent = await (await rpc('tools/call', {
        name: 'search_site', arguments: { query: 'investigación', limit: 1 }
    })).json();
    const without = await (await rpc('tools/call', {
        name: 'search_site', arguments: { query: 'investigacion', limit: 1 }
    })).json();
    // Solo cambia la consulta que se devuelve citada; el pasaje es el mismo.
    const passage = text => text.slice(text.indexOf('\n\n'));
    assert.equal(passage(withAccent.result.content[0].text),
        passage(without.result.content[0].text));
});

test('una herramienta inexistente da error JSON-RPC, no un 500', async () => {
    const response = await rpc('tools/call', { name: 'delete_everything', arguments: {} });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.error.code, -32602);
});

test('una notificación no lleva respuesta', async () => {
    const response = await call('https://elysiumdr.eu/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })
    });
    assert.equal(response.status, 202);
});

test('un cuerpo que no es JSON da -32700, no una excepción', async () => {
    const response = await call('https://elysiumdr.eu/mcp', { method: 'POST', body: 'no soy json' });
    const body = await response.json();
    assert.equal(body.error.code, -32700);
});

test('GET /mcp explica que no hay flujo SSE', async () => {
    const body = await (await call('https://elysiumdr.eu/mcp')).json();
    assert.equal(body.error.code, -32601);
});

test('/mcp contesta la preflight de CORS', async () => {
    const response = await call('https://elysiumdr.eu/mcp', { method: 'OPTIONS' });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
});
