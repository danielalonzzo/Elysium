/**
 * HTML → Markdown, para «Markdown for Agents».
 *
 * Cuando un agente pide una página con `Accept: text/markdown`, el Worker le
 * entrega el mismo contenido sin el andamiaje: sin `<head>`, sin scripts, sin
 * clases. El navegador sigue recibiendo el HTML de siempre — la negociación no
 * cambia nada de lo que ve una persona.
 *
 * Por qué un módulo aparte y no HTMLRewriter: HTMLRewriter solo existe dentro
 * del runtime de Cloudflare, así que una conversión escrita con él únicamente
 * se puede probar desplegando. Esto es una función pura sobre una cadena, y se
 * prueba con `node --test scripts/markdown.test.mjs` contra las páginas reales
 * del repositorio.
 *
 * No es un conversor de propósito general: cubre lo que este sitio escribe
 * (encabezados, párrafos, listas, tablas, enlaces, imágenes, código, citas) y
 * descarta el resto en vez de intentar adivinarlo.
 */

/** Elementos cuyo contenido no es texto de la página: se tiran enteros. */
const DROPPED = ['script', 'style', 'noscript', 'svg', 'template', 'canvas'];

const ENTITIES = new Map(Object.entries({
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', shy: '',
    mdash: '—', ndash: '–', hellip: '…', laquo: '«', raquo: '»',
    lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', copy: '©', reg: '®',
    trade: '™', deg: '°', euro: '€', pound: '£', middot: '·', bull: '•',
    times: '×', divide: '÷', plusmn: '±', frac12: '½', larr: '←', rarr: '→',
    aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
    ntilde: 'ñ', uuml: 'ü', ccedil: 'ç', atilde: 'ã', otilde: 'õ',
    agrave: 'à', egrave: 'è', ocirc: 'ô', acirc: 'â', ecirc: 'ê'
}));

export function decodeEntities(text) {
    return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body) => {
        if (body[0] === '#') {
            const code = body[1] === 'x' || body[1] === 'X'
                ? parseInt(body.slice(2), 16)
                : parseInt(body.slice(1), 10);
            return Number.isFinite(code) ? String.fromCodePoint(code) : match;
        }
        const named = ENTITIES.get(body) ?? ENTITIES.get(body.toLowerCase());
        return named === undefined ? match : named;
    });
}

/** Atributos de una etiqueta de apertura, en minúsculas y sin comillas. */
function attributesOf(tag) {
    const attributes = {};
    const pattern = /([a-zA-Z_:][-\w:.]*)\s*(?:=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
    let match;
    let first = true;
    while ((match = pattern.exec(tag)) !== null) {
        if (first) { first = false; continue; }   // el nombre del elemento
        const value = match[2] ? match[2].replace(/^["']|["']$/g, '') : '';
        attributes[match[1].toLowerCase()] = decodeEntities(value);
    }
    return attributes;
}

/** Resuelve una URL relativa contra la de la página; deja intactas las absolutas. */
function absolute(href, base) {
    if (!href || !base) return href || '';
    if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(href)) return href;
    try {
        return new URL(href, base).toString();
    } catch {
        return href;
    }
}

/** Escapa lo que Markdown interpretaría como sintaxis dentro de texto normal. */
function escapeText(text) {
    return text.replace(/([\\`*_[\]])/g, '\\$1');
}

/**
 * La región con el contenido: `<main>` si la página lo declara, y si no el
 * `<body>` entero. Las páginas del portafolio no son homogéneas —solo la
 * portada tiene `<main>`— y descartar el encabezado y el pie por su etiqueta
 * dejaría fuera los datos de contacto, que en varias páginas solo están ahí.
 */
function contentRegion(html) {
    const main = /<main\b[^>]*>([\s\S]*?)<\/main\s*>/i.exec(html);
    if (main) return main[1];
    const body = /<body\b[^>]*>([\s\S]*?)<\/body\s*>/i.exec(html);
    return body ? body[1] : html;
}

export function htmlToMarkdown(html, { baseUrl = '' } = {}) {
    const title = (/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html)?.[1] || '').trim();
    const description = /<meta\b[^>]*\bname=["']description["'][^>]*>/i.exec(html)?.[0];
    const summary = description ? (attributesOf(description).content || '').trim() : '';

    let source = contentRegion(html).replace(/<!--[\s\S]*?-->/g, '');
    for (const element of DROPPED) {
        source = source.replace(
            new RegExp(`<${element}\\b[^>]*>[\\s\\S]*?<\\/${element}\\s*>`, 'gi'),
            ''
        );
        source = source.replace(new RegExp(`<${element}\\b[^>]*\\/?>`, 'gi'), '');
    }

    const out = [];
    const push = text => { if (text) out.push(text); };

    /** Texto emitido desde `start`, retirándolo de la salida. */
    const take = start => {
        const text = out.splice(start).join('');
        return text.replace(/\s+/g, ' ').trim();
    };

    const lists = [];            // { ordered, index }
    const links = [];            // { start, href }
    const tables = [];           // { rows, cells, cellStart, headerDone }
    let quoteDepth = 0;
    let preformatted = 0;
    let pendingBlank = false;
    let lineStarted = false;

    /** Separación entre bloques: se difiere hasta que haya algo que separar. */
    const block = () => { pendingBlank = true; lineStarted = false; };
    const newline = () => { push('\n'); lineStarted = false; };

    const beforeText = () => {
        if (pendingBlank) {
            if (out.length) push('\n\n');
            pendingBlank = false;
        }
        if (!lineStarted) {
            if (quoteDepth) push('> '.repeat(quoteDepth));
            lineStarted = true;
        }
    };

    const listPrefix = () => {
        const depth = lists.length - 1;
        const current = lists[depth];
        const indent = '  '.repeat(Math.max(0, depth));
        return current.ordered ? `${indent}${current.index}. ` : `${indent}- `;
    };

    const pattern = /<\/?([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)\/?>|([^<]+)/g;
    let token;
    while ((token = pattern.exec(source)) !== null) {
        const [raw, name, , text] = token;

        if (text !== undefined) {
            if (preformatted) { push(decodeEntities(text)); continue; }
            const flat = decodeEntities(text).replace(/\s+/g, ' ');
            if (!flat.trim()) {
                // Un espacio entre dos palabras sí cuenta; el sangrado del HTML no.
                if (flat === ' ' && lineStarted) push(' ');
                continue;
            }
            beforeText();
            push(escapeText(lineStarted && out.length ? flat : flat.replace(/^ /, '')));
            continue;
        }

        const tag = name.toLowerCase();
        const closing = raw[1] === '/';
        const attributes = closing ? {} : attributesOf(raw);

        switch (tag) {
            case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
                if (closing) { block(); break; }
                block();
                beforeText();
                push('#'.repeat(Number(tag[1])) + ' ');
                break;
            }
            case 'p': case 'div': case 'section': case 'article': case 'header':
            case 'footer': case 'nav': case 'aside': case 'main': case 'figure':
            case 'figcaption': case 'form': case 'address': case 'details':
            case 'summary': case 'dl': case 'dt': case 'dd':
                block();
                break;
            case 'br':
                if (!closing) newline();
                break;
            case 'hr':
                if (!closing) { block(); beforeText(); push('---'); block(); }
                break;
            case 'ul': case 'ol':
                if (closing) { lists.pop(); block(); }
                else { block(); lists.push({ ordered: tag === 'ol', index: 1 }); }
                break;
            case 'li': {
                if (closing) break;
                if (!lists.length) lists.push({ ordered: false, index: 1 });
                if (out.length) { push('\n'); lineStarted = false; }
                pendingBlank = false;
                beforeText();
                push(listPrefix());
                lists[lists.length - 1].index += 1;
                break;
            }
            case 'blockquote':
                if (closing) { quoteDepth = Math.max(0, quoteDepth - 1); }
                else { block(); quoteDepth += 1; }
                block();
                break;
            case 'strong': case 'b':
                beforeText();
                push('**');
                break;
            case 'em': case 'i':
                beforeText();
                push('*');
                break;
            case 'code':
                if (!preformatted) { beforeText(); push('`'); }
                break;
            case 'pre':
                if (closing) { preformatted -= 1; push('\n```'); block(); }
                else { preformatted += 1; block(); beforeText(); push('```\n'); }
                break;
            case 'a': {
                if (closing) {
                    const link = links.pop();
                    if (!link) break;
                    const label = take(link.start);
                    if (!label) break;
                    if (!link.href || link.href.startsWith('#')) push(label);
                    else push(`[${label}](${link.href})`);
                    break;
                }
                beforeText();
                links.push({ start: out.length, href: absolute(attributes.href, baseUrl) });
                break;
            }
            case 'img': {
                if (closing || !attributes.src) break;
                if (attributes.alt === '' || attributes['aria-hidden'] === 'true') break;
                beforeText();
                push(`![${attributes.alt || ''}](${absolute(attributes.src, baseUrl)})`);
                break;
            }
            case 'table':
                if (closing) {
                    tables.pop();
                    block();
                } else {
                    block();
                    tables.push({ cells: [], cellStart: -1, headerDone: false });
                }
                break;
            case 'tr': {
                const table = tables[tables.length - 1];
                if (!table) break;
                if (!closing) { table.cells = []; break; }
                if (!table.cells.length) break;
                if (out.length) push('\n');
                lineStarted = false;
                pendingBlank = false;
                push(`| ${table.cells.join(' | ')} |`);
                if (!table.headerDone) {
                    push(`\n| ${table.cells.map(() => '---').join(' | ')} |`);
                    table.headerDone = true;
                }
                lineStarted = false;
                break;
            }
            case 'th': case 'td': {
                const table = tables[tables.length - 1];
                if (!table) break;
                if (closing) {
                    if (table.cellStart < 0) break;
                    table.cells.push(take(table.cellStart).replace(/\|/g, '\\|'));
                    table.cellStart = -1;
                } else {
                    table.cellStart = out.length;
                    lineStarted = true;
                    pendingBlank = false;
                }
                break;
            }
            default:
                break;
        }
    }

    let markdown = out.join('')
        .replace(/\*\*\s*\*\*/g, '')
        .replace(/(?<!\*)\*\s*\*(?!\*)/g, '')
        .replace(/``/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    const front = [];
    if (title) front.push(`# ${title}`);
    if (summary) front.push(`> ${summary}`);
    if (front.length) markdown = `${front.join('\n\n')}\n\n${markdown}`;

    return markdown ? `${markdown}\n` : '';
}

/**
 * Longitud aproximada en tokens, para la cabecera `x-markdown-tokens`.
 * Es una estimación declarada como tal: sirve para que un agente decida si le
 * cabe la página en su contexto, no para facturar nada.
 */
export function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
