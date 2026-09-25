#!/usr/bin/env node
/**
 * Traducciones de los libros de `/library`, hechas una vez y guardadas, igual
 * que las páginas del sitio (`/es/…`, `/pt/…`): el selector de idioma del
 * lector no traduce nada al vuelo, carga la versión que ya existe.
 *
 * Una traducción es el mismo HTML del libro con el texto cambiado: estilos,
 * scripts, imágenes, anclas e índice quedan intactos, así que la versión
 * traducida se lee, se navega y se descarga igual que el original.
 *
 *   node scripts/library-translation.mjs extract <libro.html> <unidades.json>
 *       Saca el texto a traducir: cada párrafo, título, celda o elemento de
 *       lista es una unidad; el formato en línea (cursivas, enlaces, llamadas
 *       a nota…) va como marcadores <g1>…</g1> y <x2/> que hay que conservar.
 *       También los atributos que se leen (title, alt, aria-label…), el
 *       <title>, la descripción y los textos fijos de los scripts del libro.
 *
 *   node scripts/library-translation.mjs apply <libro.html> <traducción.json> <idioma> <salida.html>
 *       Mete la traducción ({ "id": "texto traducido" }) en el HTML original.
 *       Falla, sin escribir nada, si falta una unidad o si alguna no conserva
 *       exactamente sus marcadores.
 *
 * Idiomas: en-GB, es-ES y pt-PT. Un libro en uno de ellos se traduce a los
 * otros dos; uno en otro idioma, a los tres. Ver «/library» en CLAUDE.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TRANSLATION_LANGUAGES = ['en-GB', 'es-ES', 'pt-PT'];

// ── Reglas de troceo ─────────────────────────────────────────────────────────

/** Etiquetas que cortan el texto: cada tramo entre ellas es una unidad. */
const BLOCK = new Set(('address article aside blockquote body caption dd details dialog div dl dt fieldset '
    + 'figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr li main menu nav ol p section summary '
    + 'table tbody thead tfoot tr td th ul legend').split(' '));
/** Cortan y su contenido no se traduce. */
const SKIP_BLOCK = new Set('script style noscript template textarea select pre iframe object video audio canvas head'.split(' '));
/** En línea, sin texto que traducir: van como marcador vacío <xN/>. */
const VOID_INLINE = new Set('img br wbr input svg math code kbd samp var area embed source track'.split(' '));
/** Elementos sin cierre en HTML. */
const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
/** Su contenido es texto crudo hasta la etiqueta de cierre. */
const RAW = new Set(['script', 'style', 'textarea', 'title', 'svg', 'math', 'xmp', 'noscript']);
const CLOSES_P = new Set(('address article aside blockquote details dialog div dl fieldset figcaption figure footer form '
    + 'h1 h2 h3 h4 h5 h6 header hgroup hr main menu nav ol p pre section table ul').split(' '));
const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
/** Atributos que se leen en pantalla o en voz alta. */
const TEXT_ATTRIBUTES = new Set(['title', 'alt', 'aria-label', 'placeholder']);
/** Textos fijos de los scripts de las plantillas de libro (crumb, notas, botones). */
const SCRIPT_STRINGS = ['Início', 'ver nas notas', 'Destacar reconstruções', 'Ocultar reconstruções',
    'Mostrar todas as respostas', 'Ocultar respostas'];

// ── Entidades ────────────────────────────────────────────────────────────────

const ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', shy: '­', ndash: '–', mdash: '—',
    hellip: '…', middot: '·', laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
    copy: '©', reg: '®', deg: '°', ordm: 'º', ordf: 'ª', sect: '§', para: '¶', times: '×', larr: '←',
    rarr: '→', uarr: '↑', darr: '↓', bull: '•', euro: '€', thinsp: ' ', ensp: ' ', emsp: ' '
};

export function decodeEntities(text) {
    return String(text).replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (match, entity) => {
        if (entity[0] === '#') {
            const hex = entity[1] === 'x' || entity[1] === 'X';
            const code = parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
            return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
        }
        return ENTITIES[entity] ?? ENTITIES[entity.toLowerCase()] ?? match;
    });
}

const escapeText = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const escapeAttribute = text => escapeText(text).replaceAll('"', '&quot;');
const INVISIBLE = /[­​-‍⁠﻿]/g;
const PLACEHOLDER = /<\/?[gx]\d+\/?>/g;

// ── Árbol con posiciones ─────────────────────────────────────────────────────

const TOKEN = /<!--[\s\S]*?(?:-->|$)|<![^>]*>|<\?[^>]*>|<\/([a-zA-Z][^\s/>]*)\s*>|<([a-zA-Z][^\s/>]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|[^<]+|</g;

/**
 * Lo justo de un analizador HTML para trocear libros bien formados: cierres
 * implícitos de p, li, dt/dd, tr, td/th y títulos, elementos vacíos y texto
 * crudo. Cada nodo guarda sus posiciones en el fuente para poder sustituir el
 * texto sin tocar nada más.
 */
export function parseDocument(html) {
    const root = { tag: '#root', children: [], start: 0, openEnd: 0, closeEnd: html.length };
    const stack = [root];
    const top = () => stack[stack.length - 1];
    const closeTo = (index, at) => {
        while (stack.length - 1 >= index) {
            const node = stack.pop();
            if (node.closeEnd === undefined) node.closeEnd = at;
        }
    };
    const findOpen = (names, boundaries) => {
        for (let i = stack.length - 1; i > 0; i -= 1) {
            if (names.has(stack[i].tag)) return i;
            if (boundaries.has(stack[i].tag)) return -1;
        }
        return -1;
    };
    const P_SCOPE = new Set(['button', 'table', 'td', 'th', 'caption', 'template', 'object', 'html', 'body']);
    const LIST_SCOPE = new Set(['ul', 'ol', 'menu', 'table', 'body', 'html']);
    const DL_SCOPE = new Set(['dl', 'body', 'html']);
    const TABLE_SCOPE = new Set(['table', 'body', 'html']);
    const ROW_SCOPE = new Set(['tr', 'table', 'body', 'html']);
    TOKEN.lastIndex = 0;
    let match;
    while ((match = TOKEN.exec(html))) {
        const [token, closeName, openName, attributes] = match;
        const start = match.index;
        const end = start + token.length;
        if (token.startsWith('<!') || token.startsWith('<?')) continue;
        if (closeName !== undefined) {
            const tag = closeName.toLowerCase();
            for (let i = stack.length - 1; i > 0; i -= 1) {
                if (stack[i].tag === tag) {
                    closeTo(i + 1, start);
                    stack[i].closeStart = start;
                    stack[i].closeEnd = end;
                    stack.length = i;
                    break;
                }
            }
            continue;
        }
        if (openName !== undefined) {
            const tag = openName.toLowerCase();
            if (CLOSES_P.has(tag)) {
                const p = findOpen(new Set(['p']), P_SCOPE);
                if (p > 0) closeTo(p, start);
            }
            if (HEADINGS.has(tag) && HEADINGS.has(top().tag)) closeTo(stack.length - 1, start);
            if (tag === 'li') { const i = findOpen(new Set(['li']), LIST_SCOPE); if (i > 0) closeTo(i, start); }
            if (tag === 'dt' || tag === 'dd') { const i = findOpen(new Set(['dt', 'dd']), DL_SCOPE); if (i > 0) closeTo(i, start); }
            if (tag === 'tr') { const i = findOpen(new Set(['tr']), TABLE_SCOPE); if (i > 0) closeTo(i, start); }
            if (tag === 'td' || tag === 'th') { const i = findOpen(new Set(['td', 'th']), ROW_SCOPE); if (i > 0) closeTo(i, start); }
            if (tag === 'option') { const i = findOpen(new Set(['option']), new Set(['select', 'body'])); if (i > 0) closeTo(i, start); }
            const node = { tag, attributes, start, openEnd: end, attributeStart: start + 1 + openName.length, children: [] };
            top().children.push(node);
            if (VOID.has(tag)) { node.closeEnd = end; continue; }
            if (RAW.has(tag)) {
                const closer = new RegExp(`</${tag}\\s*>`, 'ig');
                closer.lastIndex = end;
                const found = closer.exec(html);
                node.raw = html.slice(end, found ? found.index : html.length);
                node.closeStart = found ? found.index : html.length;
                node.closeEnd = found ? found.index + found[0].length : html.length;
                TOKEN.lastIndex = node.closeEnd;
                continue;
            }
            stack.push(node);
            continue;
        }
        top().children.push({ text: token, start, end });
    }
    closeTo(1, html.length);
    return root;
}

function attributeValue(node, name) {
    const found = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i').exec(node.attributes || '');
    return found ? (found[1] ?? found[2] ?? found[3]) : null;
}

/** Atributos de texto de un elemento, con la posición de su valor en el fuente. */
function textAttributes(node) {
    const found = [];
    const pattern = /([^\s"'>/=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let match;
    while ((match = pattern.exec(node.attributes || ''))) {
        const name = match[1].toLowerCase();
        if (!TEXT_ATTRIBUTES.has(name)) continue;
        const valueStart = node.attributeStart + match.index + match[0].length - match[2].length + 1;
        const raw = match[3] ?? match[4];
        found.push({ name, raw, start: valueStart, end: valueStart + raw.length });
    }
    return found;
}

const isSkipInline = node => VOID_INLINE.has(node.tag) || attributeValue(node, 'translate') === 'no';

function containsBlock(node) {
    if (node.blocky !== undefined) return node.blocky;
    node.blocky = (node.children || []).some(child => child.tag && !isSkipInline(child)
        && (BLOCK.has(child.tag) || SKIP_BLOCK.has(child.tag) || containsBlock(child)));
    return node.blocky;
}

// ── Unidades ─────────────────────────────────────────────────────────────────

/**
 * Serializa un tramo en línea: el texto, con los elementos como marcadores
 * numerados. Cada hueco entre marcadores recuerda qué nodos de texto lo
 * forman y dónde insertar texto si no había ninguno.
 */
function serializeRun(nodes) {
    let id = 0;
    let text = '';
    const gaps = [];
    let gap = { texts: [], insertAt: nodes[0].start };
    const mark = (placeholder, insertAt) => {
        text += placeholder;
        gaps.push(gap);
        gap = { texts: [], insertAt };
    };
    const visit = node => {
        if (node.text !== undefined) {
            gap.texts.push(node);
            text += escapeText(decodeEntities(node.text));
            return;
        }
        const k = ++id;
        if (isSkipInline(node)) { mark(`<x${k}/>`, node.closeEnd); return; }
        mark(`<g${k}>`, node.openEnd);
        node.children.forEach(visit);
        mark(`</g${k}>`, node.closeEnd);
    };
    nodes.forEach(visit);
    gaps.push(gap);
    return { text: text.replace(INVISIBLE, '').replace(/\s+/g, ' ').trim(), gaps };
}

function hasWords(text) {
    return (text.replace(PLACEHOLDER, '').match(/\p{L}/gu) || []).length >= 2;
}

/** Todo lo traducible de un libro: unidades de texto, atributos, cabecera y scripts. */
export function extractTranslatableUnits(html) {
    const root = parseDocument(html);
    const units = [];
    const attributes = [];
    const scripts = [];
    const find = (node, tag) => {
        for (const child of node.children || []) {
            if (child.tag === tag) return child;
            const inner = child.tag && find(child, tag);
            if (inner) return inner;
        }
        return null;
    };
    const body = find(root, 'body') || root;

    const collectAttributes = node => {
        for (const child of node.children || []) {
            if (!child.tag) continue;
            if (child.tag === 'script' && child.raw) scripts.push(child);
            if (SKIP_BLOCK.has(child.tag)) continue;
            for (const attribute of textAttributes(child)) {
                const value = decodeEntities(attribute.raw).replace(/\s+/g, ' ').trim();
                if (hasWords(escapeText(value))) attributes.push({ ...attribute, text: escapeText(value) });
            }
            if (!RAW.has(child.tag)) collectAttributes(child);
        }
    };
    collectAttributes(root);

    const walk = container => {
        let run = [];
        const flush = () => {
            if (!run.length) return;
            const unit = serializeRun(run);
            if (hasWords(unit.text)) units.push(unit);
            run = [];
        };
        for (const child of container.children) {
            if (child.text !== undefined) { run.push(child); continue; }
            if (SKIP_BLOCK.has(child.tag)) { flush(); continue; }
            if (BLOCK.has(child.tag)) { flush(); walk(child); continue; }
            if (isSkipInline(child)) { run.push(child); continue; }
            if (containsBlock(child)) { flush(); walk(child); continue; }
            run.push(child);
        }
        flush();
    };
    walk(body);

    const title = find(root, 'title');
    const description = /<meta\s+name="description"\s+content="([^"]*)"/i.exec(html);
    const scriptStrings = SCRIPT_STRINGS.filter(value => scripts.some(script => script.raw.includes(value)));
    return { root, units, attributes, title, description, scriptStrings };
}

/** El fichero que se traduce: `{ id: texto }` con los marcadores en su sitio. */
export function translationSource(html) {
    const { units, attributes, title, description, scriptStrings } = extractTranslatableUnits(html);
    const source = {};
    units.forEach((unit, index) => { source[`u${index + 1}`] = unit.text; });
    attributes.forEach((attribute, index) => { source[`a${index + 1}`] = attribute.text; });
    if (title) source.title = escapeText(decodeEntities(title.raw).replace(/\s+/g, ' ').trim());
    if (description) source.description = escapeText(decodeEntities(description[1]));
    scriptStrings.forEach((value, index) => { source[`s${index + 1}`] = escapeText(value); });
    return source;
}

function placeholders(text) {
    return (String(text).match(PLACEHOLDER) || []).join('');
}

/**
 * El HTML traducido. Cada unidad sustituye solo el texto de sus nodos, con el
 * espacio en blanco del original alrededor; lo demás del fichero no cambia.
 */
export function applyTranslation(html, translation, language) {
    if (!TRANSLATION_LANGUAGES.includes(language)) throw new Error(`Unknown language: ${language}`);
    const { units, attributes, title, description, scriptStrings } = extractTranslatableUnits(html);
    const source = translationSource(html);
    const problems = [];
    for (const [id, text] of Object.entries(source)) {
        if (typeof translation[id] !== 'string') problems.push(`${id}: missing`);
        else if (placeholders(translation[id]) !== placeholders(text)) problems.push(`${id}: placeholders changed`);
    }
    if (problems.length) {
        const error = new Error(`The translation does not fit the book:\n${problems.slice(0, 40).join('\n')}`);
        error.problems = problems;
        throw error;
    }

    const edits = [];
    const decode = text => decodeEntities(text);
    units.forEach((unit, index) => {
        const pieces = translation[`u${index + 1}`].split(PLACEHOLDER);
        unit.gaps.forEach((gap, gapIndex) => {
            const translated = decode(pieces[gapIndex] ?? '');
            if (!gap.texts.length) {
                if (translated.trim()) edits.push({ start: gap.insertAt, end: gap.insertAt, text: escapeText(translated) });
                return;
            }
            gap.texts.forEach((node, nodeIndex) => {
                const lead = /^\s+/.exec(node.text)?.[0] ?? '';
                const trail = /\s+$/.exec(node.text)?.[0] ?? '';
                const body = nodeIndex === 0 ? translated.trim() : '';
                const whole = body ? lead + escapeText(body) + trail : (lead || trail ? ' ' : '');
                edits.push({ start: node.start, end: node.end, text: node.text.trim() || body ? whole : node.text });
            });
        });
    });
    attributes.forEach((attribute, index) => {
        edits.push({ start: attribute.start, end: attribute.end, text: escapeAttribute(decode(translation[`a${index + 1}`])) });
    });
    if (title) {
        const start = title.openEnd;
        edits.push({ start, end: start + title.raw.length, text: escapeText(decode(translation.title)) });
    }
    if (description) {
        const start = description.index + description[0].length - description[1].length - 1;
        edits.push({ start, end: start + description[1].length, text: escapeAttribute(decode(translation.description)) });
    }

    edits.sort((a, b) => b.start - a.start || b.end - a.end);
    let output = html;
    let limit = Infinity;
    for (const edit of edits) {
        if (edit.end > limit) throw new Error(`Overlapping edit at ${edit.start}`);
        output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
        limit = edit.start;
    }
    // Los textos fijos de los scripts del libro. Van dentro de literales entre
    // comillas simples (a veces en medio de un trozo de HTML), así que se
    // escapan para ese contexto.
    output = output.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, script => {
        let result = script;
        scriptStrings.forEach((value, index) => {
            const translated = decode(translation[`s${index + 1}`])
                .replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('<', '\\x3c');
            result = result.split(value).join(translated);
        });
        return result;
    });
    return output.replace(/<html\b([^>]*?)\slang\s*=\s*"[^"]*"/i, `<html$1 lang="${language}"`);
}

// ── Línea de órdenes ─────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const [command, ...args] = process.argv.slice(2);
    if (command === 'extract' && args.length === 2) {
        const source = translationSource(readFileSync(args[0], 'utf8'));
        writeFileSync(args[1], `${JSON.stringify(source, null, 1)}\n`);
        const words = Object.values(source).join(' ').replace(PLACEHOLDER, ' ').match(/\p{L}+/gu)?.length ?? 0;
        console.log(`${Object.keys(source).length} units, ${words} words → ${args[1]}`);
    } else if (command === 'apply' && args.length === 4) {
        const html = readFileSync(args[0], 'utf8');
        const translation = JSON.parse(readFileSync(args[1], 'utf8'));
        writeFileSync(args[3], applyTranslation(html, translation, args[2]));
        console.log(`${args[2]} → ${args[3]}`);
    } else {
        console.error('Usage:\n  extract <book.html> <units.json>\n  apply <book.html> <translation.json> <en-GB|es-ES|pt-PT> <out.html>');
        process.exit(2);
    }
}
