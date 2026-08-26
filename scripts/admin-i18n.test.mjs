/**
 * Auditoría de idioma del CRM (`admin.html`, `JS/admin.js`, `JS/admin-research.js`).
 *
 * El panel se sirve en un solo HTML y cambia de idioma en el navegador. Eso
 * quiere decir que un rótulo nuevo se ve perfecto —en inglés— aunque nadie lo
 * haya traducido: no falla nada, no hay 404, no hay consola roja. Así se quedó
 * la mayor parte del CRM en un idioma mientras el conmutador EN/ES/PT traducía
 * media docena de textos.
 *
 * Esta prueba convierte ese silencio en un fallo. Exige que **cada texto
 * visible** de `admin.html` declare quién lo traduce:
 *
 *   data-i18n="clave"        → `applyStaticCopy()` lo escribe desde ADMIN_COPY
 *   data-i18n-dynamic="qué"  → lo escribe el JS al pintar su vista
 *   translate="no"           → no se traduce (marcas, siglas, ejemplos, código)
 *
 * Y comprueba que los cuatro diccionarios tengan exactamente las mismas claves
 * en `en`, `es` y `pt`: una clave que sólo exista en inglés cae al inglés en
 * silencio, que es justo el fallo que se quiere impedir.
 *
 * Uso:  node --test scripts/admin-i18n.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(ROOT, 'admin.html'), 'utf8');
const adminSource = readFileSync(join(ROOT, 'JS', 'admin.js'), 'utf8');
const researchSource = readFileSync(join(ROOT, 'JS', 'admin-research.js'), 'utf8');

const { ADMIN_COPY, copyValue } = await import(join(ROOT, 'JS', 'admin-i18n.js'));

const LANGUAGES = ['en', 'es', 'pt'];

/* ── Utilidades ──────────────────────────────────────────────────────────── */

/** Aplana un diccionario a rutas `a.b.c`. Las funciones cuentan como hoja. */
function flatten(value, prefix = '') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [prefix];
    return Object.entries(value).flatMap(([key, child]) =>
        flatten(child, prefix ? `${prefix}.${key}` : key));
}

/** Exige que los tres idiomas de un diccionario declaren las mismas claves. */
function assertParity(name, dictionary) {
    const sets = Object.fromEntries(LANGUAGES.map(lang => {
        assert.ok(dictionary[lang], `${name}: falta el idioma ${lang}`);
        return [lang, new Set(flatten(dictionary[lang]))];
    }));
    const every = new Set(LANGUAGES.flatMap(lang => [...sets[lang]]));
    for (const lang of LANGUAGES) {
        const missing = [...every].filter(key => !sets[lang].has(key)).sort();
        assert.deepEqual(missing, [], `${name}: claves ausentes en «${lang}»`);
    }
    return every;
}

/**
 * Extrae un objeto literal de nivel superior de un módulo de navegador.
 *
 * Los diccionarios de `admin.js` no se pueden importar en Node —el módulo trae
 * Firebase desde la CDN y toca el DOM—, así que se recorta por llaves contando
 * cadenas y comentarios, y se evalúa. Es el mismo truco que usa
 * `crm-logic.test.mjs`, por la misma razón: una copia se queda obsoleta.
 */
function extractObject(source, name) {
    const declaration = source.indexOf(`const ${name} = {`);
    assert.notEqual(declaration, -1, `No se encuentra ${name}`);
    const start = source.indexOf('{', declaration);
    let depth = 0;
    let quote = null;
    let escaped = false;
    for (let index = start; index < source.length; index += 1) {
        const character = source[index];
        if (quote) {
            if (escaped) escaped = false;
            else if (character === '\\') escaped = true;
            else if (character === quote) quote = null;
            continue;
        }
        if (character === '"' || character === "'" || character === '`') { quote = character; continue; }
        if (character === '/' && source[index + 1] === '/') { index = source.indexOf('\n', index); continue; }
        if (character === '{') depth += 1;
        else if (character === '}') {
            depth -= 1;
            if (depth === 0) return (0, eval)(`(${source.slice(start, index + 1)})`);
        }
    }
    throw new Error(`Llaves sin cerrar en ${name}`);
}

/* ── Lector de `admin.html` ──────────────────────────────────────────────── */

const VOID_ELEMENTS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

// Fuera del inventario: no son texto de interfaz.
const IGNORED_ELEMENTS = new Set(['script', 'style', 'svg', 'title', 'noscript', 'datalist']);

const TRANSLATABLE_ATTRIBUTES = {
    placeholder: 'data-i18n-placeholder',
    title: 'data-i18n-title',
    'aria-label': 'data-i18n-aria-label',
    alt: 'data-i18n-alt',
    'data-placeholder': 'data-i18n-data-placeholder'
};

function parseAttributes(raw) {
    const attributes = {};
    for (const match of raw.matchAll(/([a-zA-Z0-9:_.-]+)(?:\s*=\s*"([^"]*)")?/g)) {
        if (!match[1]) continue;
        attributes[match[1].toLowerCase()] = match[2] ?? '';
    }
    return attributes;
}

/** ¿Este elemento, o alguno de sus antepasados, declara quién lo traduce? */
function isDeclared(stack) {
    return stack.some(node => 'data-i18n' in node.attributes
        || 'data-i18n-dynamic' in node.attributes
        || node.attributes.translate === 'no');
}

/**
 * Recorre el HTML y devuelve todo lo que un administrador puede leer: los
 * textos sueltos y los atributos que se muestran (placeholder, title, alt…),
 * cada uno con la pila de elementos que lo contiene.
 */
function readVisibleCopy(source) {
    const cleaned = source.replace(/<!--[\s\S]*?-->/g, '').replace(/<!DOCTYPE[^>]*>/gi, '');
    const findings = { texts: [], attributes: [], bindings: [] };
    const stack = [];
    let ignoreDepth = 0;
    let cursor = 0;
    const tag = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|[^>])*?)(\/?)>/g;
    let match;
    while ((match = tag.exec(cleaned))) {
        const text = cleaned.slice(cursor, match.index).trim();
        if (text && !ignoreDepth && /[A-Za-zÀ-ÿ]{2,}/.test(text) && !isDeclared(stack)) {
            findings.texts.push({ text, path: stack.map(node => node.name).join('>') });
        }
        cursor = tag.lastIndex;

        const [, closing, rawName, rawAttributes, selfClosing] = match;
        const name = rawName.toLowerCase();
        if (closing) {
            if (IGNORED_ELEMENTS.has(name) && ignoreDepth) ignoreDepth -= 1;
            const index = stack.map(node => node.name).lastIndexOf(name);
            if (index >= 0) stack.length = index;
            continue;
        }

        const attributes = parseAttributes(rawAttributes);
        const node = { name, attributes };

        for (const [key, value] of Object.entries(attributes)) {
            if (key.startsWith('data-i18n')) findings.bindings.push({ key, path: value, element: name });
        }
        for (const [attribute, binding] of Object.entries(TRANSLATABLE_ATTRIBUTES)) {
            if (!(attribute in attributes)) continue;
            if (!/[A-Za-zÀ-ÿ]{2,}/.test(attributes[attribute])) continue;
            const covered = binding in attributes
                || 'data-i18n-dynamic' in attributes
                || attributes.translate === 'no'
                || isDeclared(stack);
            if (!covered) {
                findings.attributes.push({ element: name, attribute, value: attributes[attribute] });
            }
        }

        if (IGNORED_ELEMENTS.has(name)) {
            if (!selfClosing && !VOID_ELEMENTS.has(name)) ignoreDepth += 1;
            continue;
        }
        if (!selfClosing && !VOID_ELEMENTS.has(name)) stack.push(node);
    }
    return findings;
}

const found = readVisibleCopy(html);

/* ── Pruebas ─────────────────────────────────────────────────────────────── */

test('ADMIN_COPY declara las mismas claves en los tres idiomas', () => {
    assertParity('ADMIN_COPY', ADMIN_COPY);
});

test('translations de admin.js declara las mismas claves en los tres idiomas', () => {
    assertParity('translations', extractObject(adminSource, 'translations'));
});

test('AGENDA_COPY declara las mismas claves en los tres idiomas', () => {
    assertParity('AGENDA_COPY', extractObject(adminSource, 'AGENDA_COPY'));
});

test('V2_LABELS del onboarding declara las mismas claves en los tres idiomas', () => {
    assertParity('V2_LABELS', extractObject(adminSource, 'V2_LABELS'));
});

test('COPY de admin-research.js declara las mismas claves en los tres idiomas', () => {
    assertParity('COPY', extractObject(researchSource, 'COPY'));
});

test('ningún texto visible de admin.html se queda sin traductor', () => {
    const orphans = found.texts.map(item => `${item.path}: «${item.text}»`);
    assert.deepEqual(orphans, [], 'textos sin data-i18n, data-i18n-dynamic ni translate="no"');
});

test('ningún atributo visible de admin.html se queda sin traductor', () => {
    const orphans = found.attributes.map(item => `<${item.element} ${item.attribute}="${item.value}">`);
    assert.deepEqual(orphans, [], 'atributos sin enlace de traducción');
});

test('cada clave data-i18n de admin.html existe en los tres idiomas', () => {
    const missing = [];
    for (const binding of found.bindings) {
        if (binding.key === 'data-i18n-dynamic') continue;
        for (const lang of LANGUAGES) {
            const value = copyValue(lang, binding.path);
            if (typeof value !== 'string') missing.push(`${lang}: ${binding.path} (<${binding.element}>)`);
        }
    }
    assert.deepEqual(missing.sort(), [], 'claves declaradas en el HTML que el diccionario no resuelve');
});
