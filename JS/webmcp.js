/**
 * WebMCP — las herramientas que el sitio ofrece al agente que lo abre.
 *
 * Es la versión en el navegador de lo mismo que sirve `/mcp`: un agente que
 * llega con un navegador (Chrome con WebMCP, una extensión) no puede hablar
 * JSON-RPC con el Worker, pero sí puede llamar a lo que la página declare en
 * `document.modelContext`. Las tres herramientas de consulta son las mismas;
 * `open_page` añade una navegación visible dentro del propio sitio.
 * Durante la transición se conserva `navigator.modelContext` como respaldo:
 * fue la ubicación de la prueba temprana y todavía la inyectan algunos
 * comprobadores externos.
 *
 * `get_page` no lleva conversor propio: pide la página con
 * `Accept: text/markdown` y es el Worker quien la convierte, así que el texto
 * que ve el agente en el navegador y el que recibe por `/mcp` son el mismo.
 *
 * Nada de esto escribe. Enviar el formulario de contacto sigue exigiendo que lo
 * haga una persona: es un dato personal de alguien, y no algo que un agente
 * deba poder disparar por su cuenta. `open_page` es la única que actúa, y lo
 * único que hace es navegar — el usuario lo ve.
 *
 * Si el navegador no trae WebMCP, este fichero no hace absolutamente nada.
 */
(async () => {
    'use strict';

    const contexts = [document.modelContext, navigator.modelContext].filter(Boolean);
    const modernContext = contexts.find(context => typeof context.registerTool === 'function');
    const legacyContext = contexts.find(context => typeof context.provideContext === 'function');
    if (!modernContext && !legacyContext) return;

    const text = value => ({ content: [{ type: 'text', text: value }] });
    const failure = value => ({ content: [{ type: 'text', text: value }], isError: true });

    /** Sin acentos y en minúsculas: «investigación» e «investigacion» buscan igual. */
    const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    /** Solo rutas de este sitio: nunca se sale del origen. */
    const samePath = raw => {
        try {
            const resolved = new URL(String(raw || ''), location.origin);
            return resolved.origin === location.origin ? resolved : null;
        } catch {
            return null;
        }
    };

    const PRIVATE = /^\/(admin|profiles|onboarding|seed-licenses|auth-action|api\/|Titulos\/|Demo-arbol\/|\.)/;

    let corpus = null;
    async function siteCorpus(signal) {
        if (corpus === null) {
            const response = await fetch('/llms-full.txt', {
                headers: { Accept: 'text/plain' },
                signal
            });
            corpus = response.ok ? await response.text() : '';
        }
        return corpus;
    }

    const tools = [
        {
            name: 'search_elysium',
            description: 'Search everything Elysium λ Development & Research publishes — services, subscription tiers and prices, portfolio, research, the founder profile, the terms of service and the privacy policy, in English, Spanish and Portuguese — and return the passages that match.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Words to look for.' },
                    limit: { type: 'integer', minimum: 1, maximum: 20, description: 'How many passages to return. Default 5.' }
                },
                required: ['query'],
                additionalProperties: false
            },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            async execute({ query, limit }, { signal } = {}) {
                const words = fold(String(query || '')).match(/[\p{L}\p{N}]+/gu) || [];
                if (!words.length) return failure('Give at least one word to search for.');

                const source = await siteCorpus(signal);
                if (!source) return failure('The site corpus could not be read.');

                let heading = '';
                const passages = [];
                for (const block of source.split(/\n\s*\n/)) {
                    const passage = block.trim();
                    if (!passage) continue;
                    const title = /^#{1,6}\s+(.*)$/m.exec(passage);
                    if (title && passage.split('\n').length === 1) { heading = title[1].trim(); continue; }
                    const folded = fold(passage);
                    const matched = words.filter(word => folded.includes(word));
                    if (matched.length) passages.push({ heading, passage, score: matched.length });
                }
                if (!passages.length) return text(`Nothing on elysiumdr.eu matches "${query}".`);

                const wanted = Math.min(Math.max(Number(limit) || 5, 1), 20);
                return text(passages
                    .sort((a, b) => b.score - a.score)
                    .slice(0, wanted)
                    .map(found => `## ${found.heading || 'elysiumdr.eu'}\n\n${found.passage.slice(0, 1500)}`)
                    .join('\n\n---\n\n'));
            }
        },
        {
            name: 'list_pages',
            description: 'List every page published on this site, in the three languages, with its canonical URL. Public URLs carry no .html extension.',
            inputSchema: { type: 'object', properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            async execute(_input, { signal } = {}) {
                const response = await fetch('/sitemap.xml', { signal });
                if (!response.ok) return failure('The sitemap could not be read.');
                const urls = [...(await response.text()).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
                    .map(match => match[1])
                    .filter(url => !PRIVATE.test(new URL(url).pathname));
                return text(urls.map(url => `- ${url}`).join('\n'));
            }
        },
        {
            name: 'get_page',
            description: 'Read the full text of one page of this site as Markdown. Give a path such as "/services", "/es/portfolio" or "/research/ontology-research".',
            inputSchema: {
                type: 'object',
                properties: { path: { type: 'string', description: 'Path on this site, starting with "/".' } },
                required: ['path'],
                additionalProperties: false
            },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            async execute({ path }, { signal } = {}) {
                const target = samePath(path);
                if (!target) return failure(`"${path}" is not a path on this site.`);
                if (PRIVATE.test(target.pathname)) return failure(`${target.pathname} is not part of the public site.`);
                const response = await fetch(target, {
                    headers: { Accept: 'text/markdown' },
                    signal
                });
                if (!response.ok) {
                    return failure(`${target.pathname} does not exist. Use list_pages to see the published URLs.`);
                }
                return text(await response.text());
            }
        },
        {
            name: 'open_page',
            description: 'Navigate this browser tab to a page of the site, so the person can see it. Use it when they ask to be taken somewhere, not to read a page — get_page does that without moving them.',
            inputSchema: {
                type: 'object',
                properties: { path: { type: 'string', description: 'Path on this site, starting with "/".' } },
                required: ['path'],
                additionalProperties: false
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute({ path }) {
                const target = samePath(path);
                if (!target) return failure(`"${path}" is not a path on this site.`);
                if (PRIVATE.test(target.pathname)) return failure(`${target.pathname} is not part of the public site.`);
                location.assign(target.toString());
                return text(`Opening ${target.pathname}.`);
            }
        }
    ];

    /**
     * `registerTool` primero, `provideContext` solo para navegadores antiguos.
     *
     * La API vigente vive en `document` y `registerTool` devuelve una promesa.
     * La señal del `AbortController` es la que retira las herramientas; no hay
     * un handle con `destroy`. `provideContext` quedó fuera del borrador, pero
     * se conserva como último respaldo para implementaciones de la prueba
     * temprana. Nunca se llaman las dos: repetir un nombre es un error.
     *
     * El `AbortController` retira las herramientas al dejar la página. Sin él,
     * una navegación dentro del sitio —que es justo lo que hace `open_page`—
     * puede dejar declarada una herramienta cuyo `execute` ya no existe.
     */
    const controller = new AbortController();
    let clearLegacyContext = null;

    try {
        if (modernContext) {
            await Promise.all(tools.map(tool => (
                modernContext.registerTool(tool, { signal: controller.signal })
            )));
        } else {
            await legacyContext.provideContext({ tools });
            clearLegacyContext = () => legacyContext.clearContext?.();
        }
    } catch (error) {
        controller.abort();
        console.warn('WebMCP no disponible:', error);
        return;
    }

    addEventListener('pagehide', () => {
        controller.abort();
        clearLegacyContext?.();
    }, { once: true });
})();
