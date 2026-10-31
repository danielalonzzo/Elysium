#!/usr/bin/env node
/**
 * Genera tools.elysiumdr.eu (Elysium Tools) en `tools/`: las páginas en los
 * tres idiomas, sus 404, el sitemap, robots.txt, llms.txt, llms-full.txt y
 * catalog.json. El texto está en `scripts/tools/content.mjs`; las páginas no
 * se editan a mano.
 *
 *   node scripts/build-tools.mjs           escribe lo que haya cambiado
 *   node scripts/build-tools.mjs --check   falla si algo está desactualizado
 *   node scripts/build-tools.mjs --og      rehace además las imágenes para
 *                                          redes sociales (necesita Chrome)
 *
 * Cómo se sirve: el Worker atiende el host `tools.elysiumdr.eu` aparte
 * (`worker/tools-site.js`) y busca cada página en `tools/`:
 * `tools.elysiumdr.eu/es/unir-pdf/` es `tools/es/unir-pdf/index.html`. En
 * elysiumdr.eu esa carpeta no es una URL: `/tools` redirige al subdominio.
 *
 * Las herramientas son las del CRM, no una copia: el panel se saca de
 * `admin.html` y lo mueven los mismos módulos (`JS/admin-tools.js`,
 * `JS/admin-pdf.js`, `JS/admin-id-card.js`) con
 * `<body data-public-tools="true">`, que los pone en modo público
 * (`JS/tools-public.js`). Sus rótulos se escriben ya traducidos desde el
 * diccionario de cada módulo, para que la página tenga sentido antes de
 * ejecutar nada: es lo que leen los rastreadores que no ejecutan JS y la
 * versión Markdown para agentes.
 *
 * La pestaña PDF lleva dos herramientas, el editor y «Documento de
 * identidad». Una página con `mode: 'idcard'` llega ya con la segunda
 * elegida.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    CARDS, LABELS, LANGUAGES, LIMITS, LOCALES, MAIN_SITE, NOT_FOUND, OG_LOCALES, ORIGIN, PAGES, PLATFORMS, UI, UPDATED
} from './tools/content.mjs';
import { PDF_COPY, PUBLIC_PLATFORMS, VIDEO_COPY, mergeCopy } from '../JS/tools-public.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'tools';
const BRAND = 'Elysium Tools';
const PUBLISHER = 'Elysium λ Development & Research';
const ORGANIZATION_ID = 'https://elysiumdr.eu/#organization';
const HREFLANG = { en: 'en', es: 'es', pt: 'pt-PT' };
const LANGUAGE_NAMES = { en: 'English', es: 'Español', pt: 'Português' };
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const read = path => readFileSync(join(ROOT, path), 'utf8');

/* ── Utilidades ──────────────────────────────────────────────────────────── */

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
}

const VALUES = {
    videoMaxMb: LIMITS.videoMaxMb,
    pdfEditMaxMb: LIMITS.pdfEditMaxMb,
    pdfConvertMaxMb: LIMITS.pdfConvertMaxMb,
    pdfConvertMaxPages: LIMITS.pdfConvertMaxPages,
    fileMinutes: LIMITS.fileMinutes,
    inspections: LIMITS.inspectionsPerHour,
    downloads: LIMITS.downloadsPerHour,
    conversions: LIMITS.conversionsPerHour
};

/** Sustituye `{videoMaxMb}` y compañía por los límites reales. */
function fill(text) {
    return String(text).replace(/\{(\w+)\}/g, (match, name) => {
        if (!(name in VALUES)) throw new Error(`Marcador desconocido ${match} en «${text}»`);
        return String(VALUES[name]);
    });
}

function version(path) {
    return createHash('sha256').update(readFileSync(join(ROOT, path))).digest('hex').slice(0, 10);
}

/** El objeto literal `const NOMBRE = {…}` de un módulo del navegador, evaluado. */
function sourceObject(path, name) {
    const source = read(path);
    const declaration = source.indexOf(`const ${name} = {`);
    if (declaration < 0) throw new Error(`No se encuentra ${name} en ${path}`);
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
    throw new Error(`Llaves sin cerrar en ${name} (${path})`);
}

/* ── Páginas y direcciones ───────────────────────────────────────────────── */

const AVAILABLE = new Set(PLATFORMS.filter(platform => platform.available).map(platform => platform.id));
const platformName = id => PLATFORMS.find(platform => platform.id === id).name;

// Una página de plataforma solo existe mientras la plataforma funciona.
const SITE_PAGES = PAGES.filter(page => page.type !== 'platform' || AVAILABLE.has(page.platform));
const byId = id => SITE_PAGES.find(page => page.id === id);
const platformPages = () => SITE_PAGES.filter(page => page.type === 'platform');
const taskPages = () => SITE_PAGES.filter(page => page.type === 'pdf-task');

function pathFor(page, language) {
    const slug = page.slugs[language];
    return `/${language === 'en' ? '' : `${language}/`}${slug ? `${slug}/` : ''}`;
}

const urlFor = (page, language) => ORIGIN + pathFor(page, language);
const homePath = language => (language === 'en' ? '/' : `/${language}/`);
const ogImage = language => `${ORIGIN}/Images/tools/og-${language}.png`;
const label = (page, language) => (page.type === 'platform' ? platformName(page.platform) : LABELS[page.id][language]);

/* ── Paneles del CRM ─────────────────────────────────────────────────────── */

const ADMIN = read('admin.html');

function slice(text, start, end) {
    const from = text.indexOf(start);
    const to = from < 0 ? -1 : text.indexOf(end, from);
    if (from < 0 || to < 0) throw new Error(`admin.html: no se encuentra el tramo «${start}»`);
    return text.slice(from, to);
}

const PANELS = {
    video: slice(ADMIN, '<div class="tools-panel" id="tools-panel-video"', '<!-- Editor de PDF'),
    pdf: slice(ADMIN, '<div class="tools-panel" id="tools-panel-pdf"', '\n        </section>')
};

const TEXT = {
    video: mergeCopy(sourceObject('JS/admin-tools.js', 'COPY'), VIDEO_COPY),
    pdf: mergeCopy(sourceObject('JS/admin-pdf.js', 'COPY'), PDF_COPY),
    idcard: sourceObject('JS/admin-id-card.js', 'COPY')
};

// Lo que cada módulo escribe al arrancar, elemento a elemento.
const PANEL_TEXT = {
    video: {
        'tools-video-url-label': 'urlLabel',
        'tools-video-paste': 'paste',
        'tools-video-submit': 'find',
        'tools-video-jobs-title': 'jobsTitle',
        'tools-video-footnote': 'footnote'
    },
    pdf: {
        'pdf-drop-title': 'dropTitle',
        'pdf-drop-text': 'dropText',
        'pdf-choose-label': 'choose',
        'pdf-privacy': 'privacy',
        'pdf-add-label': 'add',
        'pdf-undo': 'undo',
        'pdf-reset': 'reset',
        'pdf-select-all': 'selectAll',
        'pdf-rotate-selected': 'rotate',
        'pdf-delete-selected': 'delete',
        'pdf-hint': 'hint',
        'pdf-name-label': 'fileName',
        'pdf-download': 'download',
        'pdf-extract': 'extract',
        'pdf-convert': 'convert',
        'pdf-word-note': 'wordNote',
        'pdf-dropping': 'dropping',
        'pdf-mode-edit-label': 'modeEdit',
        'pdf-mode-idcard-label': 'modeIdCard'
    }
};

function replaceOnce(html, pattern, replacement, what) {
    let count = 0;
    const result = html.replace(pattern, (...match) => {
        count += 1;
        return typeof replacement === 'function' ? replacement(...match) : replacement;
    });
    if (count !== 1) throw new Error(`Panel: ${count} coincidencias para ${what}`);
    return result;
}

function setText(html, id, text) {
    const pattern = new RegExp(`(<([a-z0-9]+)\\b[^>]*\\bid="${id}"[^>]*>)[^<]*(</\\2>)`);
    return replaceOnce(html, pattern, (match, open, tag, close) => `${open}${esc(text)}${close}`, `#${id}`);
}

/**
 * Los textos de «Documento de identidad» van por clave, como los escribe
 * `admin-id-card.js`: `data-idcard="clave"` en el contenido y
 * `data-idcard-label` / `data-idcard-placeholder` en los atributos.
 */
function setKeyedText(html, text) {
    const lookup = key => {
        if (typeof text[key] !== 'string') throw new Error(`admin-id-card.js: no hay texto para «${key}»`);
        return esc(text[key]);
    };
    return html
        .replace(/(<([a-z0-9]+)\b[^>]*\bdata-idcard="([A-Za-z]+)"[^>]*>)[^<]*(<\/\2>)/g, (match, open, tag, key, close) => `${open}${lookup(key)}${close}`)
        .replace(/<[^>]*\bdata-idcard-label="([A-Za-z]+)"[^>]*>/g, (tag, key) => tag.replace(/aria-label="[^"]*"/, `aria-label="${lookup(key)}"`))
        .replace(/<[^>]*\bdata-idcard-placeholder="([A-Za-z]+)"[^>]*>/g, (tag, key) => tag.replace(/placeholder="[^"]*"/, `placeholder="${lookup(key)}"`));
}

/** La página de la cédula abre con su herramienta elegida, sin esperar al JS. */
function chooseIdCardMode(html) {
    html = replaceOnce(html, /<button type="button" class="pdf-mode is-active" role="tab" id="pdf-mode-edit" aria-selected="true"/, '<button type="button" class="pdf-mode" role="tab" id="pdf-mode-edit" aria-selected="false" tabindex="-1"', 'la pestaña del editor');
    html = replaceOnce(html, /<button type="button" class="pdf-mode" role="tab" id="pdf-mode-idcard" aria-selected="false" aria-controls="idcard" tabindex="-1">/, '<button type="button" class="pdf-mode is-active" role="tab" id="pdf-mode-idcard" aria-selected="true" aria-controls="idcard">', 'la pestaña de la cédula');
    html = replaceOnce(html, /(<div class="pdf-mode-panel" id="pdf-edit" role="tabpanel" aria-labelledby="pdf-mode-edit")>/, (match, open) => `${open} hidden>`, 'el panel del editor');
    return replaceOnce(html, /(<div class="pdf-mode-panel idcard" id="idcard" role="tabpanel" aria-labelledby="pdf-mode-idcard") hidden>/, (match, open) => `${open}>`, 'el panel de la cédula');
}

/** El panel de `admin.html`, traducido y sin lo que solo tiene sentido en el CRM. */
function panelMarkup(tool, language, page) {
    const text = TEXT[tool][language];
    const toolLabel = LABELS[tool][language];
    let html = PANELS[tool]
        .replace(/<!--[\s\S]*?-->\s*/g, '')
        .replace(/ data-i18n-dynamic="[^"]*"/g, '');
    html = replaceOnce(html, / role="tabpanel" aria-labelledby="tools-tab-(?:video|pdf)"(?: hidden)?/, ` role="region" aria-label="${esc(toolLabel)}"`, 'el rol de pestaña');
    for (const [id, key] of Object.entries(PANEL_TEXT[tool])) html = setText(html, id, text[key]);

    if (tool === 'video') {
        html = replaceOnce(html, /placeholder="[^"]*"/, `placeholder="${esc(page.placeholder)}"`, 'el ejemplo de enlace');
        const names = PLATFORMS.filter(platform => platform.available).map(platform => platform.name).join(' · ');
        html = replaceOnce(html, /<p class="tools-platforms">[\s\S]*?<\/p>/, `<p class="tools-platforms"><span translate="no">${esc(names)}</span></p>`, 'la lista de plataformas');
        html = replaceOnce(html, /\n( *)<\/form>/, (match, indent) => `${match}\n${indent}<div class="tools-human-check" id="tools-human-check"></div>`, 'el final del formulario');
    } else {
        html = replaceOnce(html, /aria-label="Pages of the document"/, `aria-label="${esc(text.pagesAria)}"`, 'la lista de páginas');
        html = replaceOnce(html, /aria-label="PDF tools"/, `aria-label="${esc(text.modes)}"`, 'el selector de herramientas PDF');
        html = replaceOnce(html, /\n( *)(<div class="pdf-status" id="pdf-status")/, (match, indent, open) => `\n${indent}<div class="tools-human-check" id="tools-human-check"></div>\n${indent}${open}`, 'el estado de la conversión');
        html = setKeyedText(html, TEXT.idcard[language]);
        if (page.mode === 'idcard') html = chooseIdCardMode(html);
    }
    // La sangría es la de admin.html, que coincide con la de la página.
    return html.trimEnd();
}

/* ── Piezas de página ────────────────────────────────────────────────────── */

const ICONS = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" width="16" height="16"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>'
};

function header(language, page) {
    const ui = UI[language];
    const section = page?.tool;
    const navLink = id => {
        const target = byId(id);
        const current = page?.id === id ? ' aria-current="page"' : section === id ? ' class="is-section"' : '';
        return `<a href="${pathFor(target, language)}"${current}>${esc(LABELS[id][language])}</a>`;
    };
    const languages = LANGUAGES.map(other => {
        const href = page ? pathFor(page, other) : homePath(other);
        const current = other === language ? ' aria-current="true"' : '';
        return `<a href="${href}" lang="${LOCALES[other]}" hreflang="${HREFLANG[other]}" title="${LANGUAGE_NAMES[other]}"${current}>${other.toUpperCase()}</a>`;
    }).join('');
    return `<header class="ts-header">
    <div class="ts-container ts-header-inner">
        <a class="ts-brand" href="${homePath(language)}"><span class="ts-brand-mark" aria-hidden="true">λ</span><span>${BRAND}</span></a>
        <nav class="ts-nav" aria-label="${esc(ui.footerTools)}">${navLink('video')}${navLink('pdf')}</nav>
        <nav class="ts-lang" aria-label="${esc(ui.language)}">${languages}</nav>
    </div>
</header>`;
}

function footer(language, page) {
    const ui = UI[language];
    const link = target => `<li><a href="${pathFor(target, language)}">${esc(label(target, language))}</a></li>`;
    const languages = LANGUAGES.map(other => `<a href="${page ? pathFor(page, other) : homePath(other)}" lang="${LOCALES[other]}" hreflang="${HREFLANG[other]}">${LANGUAGE_NAMES[other]}</a>`).join('');
    return `<footer class="ts-footer">
    <div class="ts-container">
        <div class="ts-footer-grid">
            <div class="ts-footer-about">
                <h2>${BRAND}</h2>
                <p>${esc(ui.aboutText)}</p>
                <p><a href="${MAIN_SITE[language]}">${esc(ui.mainSite)}</a></p>
            </div>
            <div>
                <h2>${esc(ui.footerTools)}</h2>
                <ul>${link(byId('video'))}${link(byId('pdf'))}${link(byId('home'))}</ul>
            </div>
            <div>
                <h2>${esc(ui.footerPlatforms)}</h2>
                <ul>${platformPages().map(link).join('')}</ul>
            </div>
            <div>
                <h2>${esc(ui.footerPdf)}</h2>
                <ul>${taskPages().map(link).join('')}</ul>
            </div>
        </div>
        <div class="ts-footer-bottom">
            <p>© ${UPDATED.slice(0, 4)} ${esc(PUBLISHER)} · <a href="${pathFor(byId('legal'), language)}">${esc(ui.legal)}</a></p>
            <nav aria-label="${esc(ui.language)}">${languages}</nav>
        </div>
    </div>
</footer>`;
}

function breadcrumb(page, language) {
    const trail = [byId('home')];
    if (page.type === 'platform') trail.push(byId('video'));
    if (page.type === 'pdf-task') trail.push(byId('pdf'));
    const items = trail.map(step => `<li><a href="${pathFor(step, language)}">${esc(step.id === 'home' ? UI[language].crumbHome : label(step, language))}</a></li>`);
    items.push(`<li><span aria-current="page">${esc(label(page, language))}</span></li>`);
    return `<nav class="ts-breadcrumb" aria-label="${esc(UI[language].breadcrumb)}"><ol>${items.join('')}</ol></nav>`;
}

function badges(language) {
    return `<ul class="ts-badges">${UI[language].badges.map(badge => `<li>${ICONS.check}${esc(badge)}</li>`).join('')}</ul>`;
}

function faq(entries) {
    return `<div class="ts-faq">${entries.map(([question, answer]) => `
            <details>
                <summary>${esc(fill(question))}</summary>
                <p>${esc(fill(answer))}</p>
            </details>`).join('')}
        </div>`;
}

function card(target, language, text) {
    return `<li><a class="ts-card" href="${pathFor(target, language)}"><strong>${esc(label(target, language))}</strong><span>${esc(text)}</span></a></li>`;
}

/** Las plataformas: con página, enlace; sin página, nombre; y las que faltan. */
function platformCards(language, exclude = null) {
    const ui = UI[language];
    const linked = platformPages().filter(page => page.id !== exclude).map(page => card(page, language, CARDS[page.id][language]));
    const plain = PLATFORMS.filter(platform => platform.available && !SITE_PAGES.some(page => page.platform === platform.id));
    const soon = PLATFORMS.filter(platform => !platform.available);
    const pending = soon.map(platform => `<li><div class="ts-card ts-card-soon" aria-disabled="true"><strong>${esc(platform.name)}</strong><em>${esc(ui.soon)}</em></div></li>`);
    return `<ul class="ts-cards">${[...linked, ...pending].join('')}</ul>${plain.length ? `
        <ul class="ts-chips" aria-label="${esc(ui.relatedVideo)}">${plain.map(platform => `<li translate="no">${esc(platform.name)}</li>`).join('')}</ul>` : ''}`;
}

function taskCards(language, exclude = null) {
    return `<ul class="ts-cards">${taskPages().filter(page => page.id !== exclude).map(page => card(page, language, CARDS[page.id][language])).join('')}</ul>`;
}

/* ── Datos estructurados ─────────────────────────────────────────────────── */

const ORGANIZATION = {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: PUBLISHER,
    url: 'https://elysiumdr.eu/',
    logo: 'https://elysiumdr.eu/Images/favicon-512.png'
};

function website(language) {
    return {
        '@type': 'WebSite',
        '@id': `${ORIGIN}/#website`,
        url: `${ORIGIN}/`,
        name: BRAND,
        description: fill(byId('home').copy[language].description),
        inLanguage: LANGUAGES.map(other => LOCALES[other]),
        publisher: { '@id': ORGANIZATION_ID }
    };
}

function featureList(page, copy) {
    return [...(copy.sections || []).map(([title]) => title), ...(page.tool === 'video' ? ['MP4', 'MP3', 'M4A'] : [])];
}

function structuredData(page, language) {
    const copy = page.copy[language];
    const url = urlFor(page, language);
    const ui = UI[language];
    const hub = page.type === 'home' || page.type === 'video' || page.type === 'pdf';
    const graph = [ORGANIZATION];
    if (page.type === 'home') graph.push(website(language));
    const webPage = {
        '@type': hub ? 'CollectionPage' : 'WebPage',
        '@id': `${url}#page`,
        url,
        name: copy.title,
        description: fill(copy.description),
        inLanguage: LOCALES[language],
        isPartOf: { '@id': `${ORIGIN}/#website` },
        publisher: { '@id': ORGANIZATION_ID },
        dateModified: UPDATED,
        primaryImageOfPage: { '@type': 'ImageObject', url: ogImage(language), width: 1200, height: 630 }
    };
    graph.push(webPage);

    if (page.type !== 'home') {
        const trail = [byId('home')];
        if (page.type === 'platform') trail.push(byId('video'));
        if (page.type === 'pdf-task') trail.push(byId('pdf'));
        trail.push(page);
        webPage.breadcrumb = { '@id': `${url}#breadcrumb` };
        graph.push({
            '@type': 'BreadcrumbList',
            '@id': `${url}#breadcrumb`,
            itemListElement: trail.map((step, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: step.id === 'home' ? ui.crumbHome : label(step, language),
                item: urlFor(step, language)
            }))
        });
    }

    if (page.tool) {
        webPage.mainEntity = { '@id': `${url}#app` };
        graph.push({
            '@type': 'WebApplication',
            '@id': `${url}#app`,
            name: copy.h1,
            url,
            description: fill(copy.description),
            applicationCategory: page.tool === 'video' ? 'MultimediaApplication' : 'UtilitiesApplication',
            operatingSystem: 'Any',
            browserRequirements: 'Requires JavaScript and a modern web browser.',
            inLanguage: LOCALES[language],
            isAccessibleForFree: true,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
            featureList: featureList(page, copy),
            publisher: { '@id': ORGANIZATION_ID },
            image: ogImage(language)
        });
        if (copy.steps) {
            graph.push({
                '@type': 'HowTo',
                '@id': `${url}#howto`,
                name: copy.h1,
                inLanguage: LOCALES[language],
                tool: { '@type': 'HowToTool', name: BRAND },
                step: copy.steps.map((step, index) => ({ '@type': 'HowToStep', position: index + 1, text: fill(step) }))
            });
        }
    }

    const questions = faqEntries(page, language);
    if (questions.length) {
        graph.push({
            '@type': 'FAQPage',
            '@id': `${url}#faq`,
            inLanguage: LOCALES[language],
            mainEntity: questions.map(([question, answer]) => ({
                '@type': 'Question',
                name: fill(question),
                acceptedAnswer: { '@type': 'Answer', text: fill(answer) }
            }))
        });
    }

    const listed = page.type === 'home' ? [byId('video'), ...platformPages(), byId('pdf'), ...taskPages()]
        : page.type === 'video' ? platformPages()
            : page.type === 'pdf' ? taskPages() : [];
    if (listed.length) {
        graph.push({
            '@type': 'ItemList',
            '@id': `${url}#tools`,
            itemListElement: listed.map((target, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: label(target, language),
                url: urlFor(target, language)
            }))
        });
    }
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

function faqEntries(page, language) {
    const copy = page.copy[language];
    const ui = UI[language];
    // Las comunes del PDF hablan de subir PDF y de pasar a Word: la página de
    // la cédula responde a lo suyo en sus propias preguntas.
    const shared = page.tool === 'video' ? ui.sharedFaqVideo : page.tool === 'pdf' && page.mode !== 'idcard' ? ui.sharedFaqPdf : [];
    return [...(copy.faq || []), ...shared];
}

/* ── Documento ───────────────────────────────────────────────────────────── */

const ASSETS = {
    site: `/CSS/tools-site.css?v=${version('CSS/tools-site.css')}`,
    tools: `/CSS/admin-tools.css?v=${version('CSS/admin-tools.css')}`,
    video: `/JS/admin-tools.js?v=${version('JS/admin-tools.js')}`,
    pdf: `/JS/admin-pdf.js?v=${version('JS/admin-pdf.js')}`,
    idcard: `/JS/admin-id-card.js?v=${version('JS/admin-id-card.js')}`
};

function documentHtml({ language, page, title, description, body, indexable = true }) {
    const head = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        `<title>${esc(title)}</title>`,
        `<meta name="description" content="${esc(description)}">`,
        `<meta name="robots" content="${indexable ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' : 'noindex, follow'}">`
    ];
    if (indexable) {
        const url = urlFor(page, language);
        head.push(`<link rel="canonical" href="${url}">`);
        for (const other of LANGUAGES) head.push(`<link rel="alternate" hreflang="${HREFLANG[other]}" href="${urlFor(page, other)}">`);
        head.push(`<link rel="alternate" hreflang="x-default" href="${urlFor(page, 'en')}">`);
        head.push(
            '<meta property="og:type" content="website">',
            `<meta property="og:site_name" content="${BRAND}">`,
            `<meta property="og:title" content="${esc(page.copy[language].title)}">`,
            `<meta property="og:description" content="${esc(description)}">`,
            `<meta property="og:url" content="${url}">`,
            `<meta property="og:locale" content="${OG_LOCALES[language]}">`,
            ...LANGUAGES.filter(other => other !== language).map(other => `<meta property="og:locale:alternate" content="${OG_LOCALES[other]}">`),
            `<meta property="og:image" content="${ogImage(language)}">`,
            '<meta property="og:image:width" content="1200">',
            '<meta property="og:image:height" content="630">',
            `<meta property="og:image:alt" content="${esc(`${BRAND}: ${byId('home').copy[language].title}`)}">`,
            '<meta name="twitter:card" content="summary_large_image">'
        );
    }
    head.push(
        '<meta name="theme-color" content="#020410">',
        '<meta name="color-scheme" content="dark">',
        '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
        '<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">',
        '<link rel="apple-touch-icon" href="/Images/apple-touch-icon.png">',
        `<link rel="stylesheet" href="${ASSETS.site}">`
    );
    if (page?.tool) {
        head.push(`<link rel="stylesheet" href="${ASSETS.tools}">`);
        head.push(`<link rel="modulepreload" href="/JS/tools-public.js">`);
    }
    // La página de la cédula detecta en cuanto llega la primera foto.
    if (page?.mode === 'idcard') head.push(`<link rel="modulepreload" href="/JS/id-card-scan.js">`);
    if (indexable) head.push(`<script type="application/ld+json">${structuredData(page, language)}</script>`);
    const scripts = page?.tool === 'pdf' ? [ASSETS.pdf, ASSETS.idcard] : page?.tool ? [ASSETS[page.tool]] : [];
    const script = scripts.map(src => `\n<script type="module" src="${src}"></script>`).join('');
    return `<!doctype html>
<html lang="${LOCALES[language]}">
<head>
${head.join('\n')}
</head>
<body class="tools-app customer-portal is-admin"${page?.tool ? ' data-public-tools="true"' : ''}>
<a class="ts-skip" href="#main">${esc(UI[language].skip)}</a>
${header(language, page)}
<main id="main" class="ts-main">
    <div class="ts-container">
${body}
    </div>
</main>
${footer(language, page)}${script}
</body>
</html>
`;
}

function hero(page, language, { home = false } = {}) {
    const copy = page.copy[language];
    return `        <header class="ts-hero${home ? ' ts-hero-home' : ''}">
            ${page.type === 'legal' ? '' : badges(language)}
            <h1>${esc(copy.h1)}</h1>
            <p class="ts-lead">${esc(fill(copy.lead))}</p>
        </header>`;
}

function stepsBlock(copy, language) {
    if (!copy.steps) return '';
    return `
        <section class="ts-block" aria-labelledby="how">
            <h2 id="how">${esc(UI[language].how)}</h2>
            <ol class="ts-steps">${copy.steps.map(step => `<li>${esc(fill(step))}</li>`).join('')}</ol>
        </section>`;
}

function sectionsBlock(copy) {
    if (!copy.sections) return '';
    return `
        <div class="ts-sections">${copy.sections.map(([title, text]) => `
            <section>
                <h2>${esc(title)}</h2>
                <p>${esc(fill(text))}</p>
            </section>`).join('')}
        </div>`;
}

function faqBlock(page, language) {
    const entries = faqEntries(page, language);
    if (!entries.length) return '';
    return `
        <section class="ts-block" aria-labelledby="faq">
            <h2 id="faq">${esc(UI[language].faq)}</h2>
            ${faq(entries)}
        </section>`;
}

function block(id, title, inner) {
    return `
        <section class="ts-block" aria-labelledby="${id}">
            <h2 id="${id}">${esc(title)}</h2>
            ${inner}
        </section>`;
}

function workspace(page, language) {
    // En la página de la cédula, el titular de la página ya dice lo que la
    // introducción del panel: `data-mode` la esconde (CSS/tools-site.css).
    const mode = page.mode ? ` data-mode="${page.mode}"` : '';
    return `
        <div class="ts-workspace tools-workspace active" id="tools"${mode}>
            ${panelMarkup(page.tool, language, page)}
        </div>
        <noscript><p class="ts-noscript">${esc(UI[language].noscript)}</p></noscript>`;
}

function homeBody(page, language) {
    const copy = page.copy[language];
    const ui = UI[language];
    const tool = (target, icon, text) => `
            <li class="ts-tool">
                <span class="ts-tool-icon">${ICONS[icon]}</span>
                <h2>${esc(label(target, language))}</h2>
                <p>${esc(text)}</p>
                <a class="ts-button" href="${pathFor(target, language)}">${esc(ui.open)} ${ICONS.arrow}</a>
            </li>`;
    return `${hero(page, language, { home: true })}
        <ul class="ts-tools">${tool(byId('video'), 'video', copy.cardVideo)}${tool(byId('pdf'), 'pdf', copy.cardPdf)}
            <li class="ts-tool ts-tool-future">
                <span class="ts-tool-icon">${ICONS.plus}</span>
                <h2>${esc(copy.future)}</h2>
                <p>${esc(copy.cardFuture)}</p>
            </li>
        </ul>${block('platforms', ui.footerPlatforms, platformCards(language))}${block('pdf-tools', ui.footerPdf, taskCards(language))}
        <section class="ts-block ts-prose" aria-labelledby="why">
            <h2 id="why">${esc(copy.why)}</h2>
            ${copy.whyText.map(paragraph => `<p>${esc(fill(paragraph))}</p>`).join('\n            ')}
        </section>${faqBlock(page, language)}`;
}

function toolBody(page, language) {
    const copy = page.copy[language];
    const ui = UI[language];
    const related = page.type === 'video' ? block('platforms', ui.footerPlatforms, platformCards(language))
        : page.type === 'platform' ? block('related', ui.relatedVideo, platformCards(language, page.id))
            : page.type === 'pdf' ? block('pdf-tools', ui.footerPdf, taskCards(language))
                : block('related', ui.relatedPdf, taskCards(language, page.id));
    const note = page.tool === 'video' ? `
        <p class="ts-note">${esc(ui.responsible)}</p>` : '';
    return `${breadcrumb(page, language)}
${hero(page, language)}${workspace(page, language)}${stepsBlock(copy, language)}${sectionsBlock(copy)}${related}${faqBlock(page, language)}${note}`;
}

function legalBody(page, language) {
    const copy = page.copy[language];
    return `${breadcrumb(page, language)}
${hero(page, language)}
        <div class="ts-prose">${copy.sections.map(([title, text]) => `
            <section>
                <h2>${esc(title)}</h2>
                <p>${esc(fill(text))}</p>
            </section>`).join('')}
        </div>`;
}

function pageHtml(page, language) {
    const copy = page.copy[language];
    const body = page.type === 'home' ? homeBody(page, language)
        : page.type === 'legal' ? legalBody(page, language)
            : toolBody(page, language);
    return documentHtml({
        language,
        page,
        title: `${copy.title} | ${BRAND}`,
        description: fill(copy.description),
        body
    });
}

function notFoundHtml(language) {
    const copy = NOT_FOUND[language];
    const cards = [byId('video'), byId('pdf'), ...platformPages(), ...taskPages()]
        .map(target => card(target, language, target.type === 'video' || target.type === 'pdf' ? '' : CARDS[target.id][language]).replace('<span></span>', ''));
    return documentHtml({
        language,
        page: null,
        title: `${copy.title} | ${BRAND}`,
        description: copy.lead,
        indexable: false,
        body: `        <section class="ts-missing">
            <h1>${esc(copy.h1)}</h1>
            <p class="ts-lead">${esc(copy.lead)}</p>
            <ul class="ts-cards">${cards.join('')}</ul>
        </section>`
    });
}

/* ── Descubrimiento: sitemap, robots, llms y catálogo ────────────────────── */

function sitemap() {
    const entries = SITE_PAGES.flatMap(page => LANGUAGES.map(language => {
        const alternates = [...LANGUAGES.map(other => `    <xhtml:link rel="alternate" hreflang="${HREFLANG[other]}" href="${urlFor(page, other)}"/>`),
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(page, 'en')}"/>`];
        return `  <url>\n    <loc>${urlFor(page, language)}</loc>\n    <lastmod>${UPDATED}</lastmod>\n${alternates.join('\n')}\n  </url>`;
    }));
    return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generado por scripts/build-tools.mjs: no se edita a mano. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
}

function robots() {
    return `# Elysium Tools — tools.elysiumdr.eu
# Generado por scripts/build-tools.mjs. Todo es público salvo la API.
# Content-Signal (contentsignals.org): se puede indexar, citar y usar para
# entrenar, igual que elysiumdr.eu.

User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
Disallow: /api/

Sitemap: ${ORIGIN}/sitemap.xml
`;
}

const PLATFORM_LIST = PLATFORMS.filter(platform => platform.available).map(platform => platform.name);
const SOON_LIST = PLATFORMS.filter(platform => !platform.available).map(platform => platform.name);

function facts() {
    return [
        `- Price: free. No advertising, no subscriptions, no accounts and no analytics or advertising cookies.`,
        `- Publisher: ${PUBLISHER} (Bragança, Portugal), https://elysiumdr.eu/`,
        `- Video downloader: public links from ${PLATFORM_LIST.join(', ')}. Not available yet: ${SOON_LIST.join(', ')} (coming soon). Private posts, content behind a login, age-restricted videos and live streams in progress cannot be downloaded.`,
        `- Video quality: the resolutions the platform publishes for each video (up to 4K or 8K when they exist); nothing is upscaled. MP4 with H.264/AAC up to 1080p where the platform offers it, VP9 or AV1 above that on some platforms. Audio only as MP3 or M4A. Posts with several videos: the user chooses one.`,
        `- Video limits: up to ${LIMITS.videoMaxMb} MB per file; the file is deleted ${LIMITS.fileMinutes} minutes after it is ready.`,
        `- PDF editor: merge PDFs, reorder, rotate, delete and extract pages inside the browser (files are not uploaded for these tasks), up to ${LIMITS.pdfEditMaxMb} MB per file. PDF to Word (.docx) runs on the Elysium server: up to ${LIMITS.pdfConvertMaxMb} MB and ${LIMITS.pdfConvertMaxPages} pages; the PDF is deleted as soon as the .docx exists and the .docx after ${LIMITS.fileMinutes} minutes. The .docx opens in Microsoft Word, Apple Pages, Google Docs and LibreOffice. Scanned PDFs become page images (no OCR). Password-protected PDFs are not supported.`,
        `- ID card to PDF: photos of the front and back of an identity card, residence permit or driving licence are detected, straightened and cut out from the background, and both sides are placed at real size (ID-1, 85.6 × 54 mm) or 1.5× on one A4 or Letter page, with an optional watermark. Everything runs in the browser: the photos are never uploaded.`,
        `- Fair-use limits per visitor and hour: ${LIMITS.inspectionsPerHour} link checks, ${LIMITS.downloadsPerHour} video downloads and ${LIMITS.conversionsPerHour} Word conversions. Each operation is checked by Cloudflare Turnstile.`,
        `- Languages: English, Spanish and European Portuguese.`
    ];
}

function llms() {
    const entry = (page, language) => `- [${label(page, language) === LABELS.home?.[language] ? BRAND : page.copy[language].h1}](${urlFor(page, language)}): ${fill(page.copy[language].description)}`;
    const list = language => SITE_PAGES.filter(page => page.type !== 'home').map(page => entry(page, language)).join('\n');
    return `# ${BRAND}

> Free online tools by ${PUBLISHER}, with no ads and no sign-up: a video downloader for public videos from ${PLATFORM_LIST.join(', ')} in every resolution the platform offers (MP4, MP3 or M4A), a PDF editor that merges, reorders, rotates, deletes and extracts pages in the browser and converts PDF to Word, and a tool that puts both sides of an ID card on one PDF page without uploading the photos.

${facts().join('\n')}

## Tools (English)

${list('en')}

## Herramientas (español)

${list('es')}

## Ferramentas (português europeu)

${list('pt')}

## Optional

- [Full text of every page](${ORIGIN}/llms-full.txt)
- [Machine-readable catalogue](${ORIGIN}/catalog.json)
- [${PUBLISHER}](https://elysiumdr.eu/): the company behind the tools.
`;
}

function llmsFull() {
    const pageText = (page, language) => {
        const copy = page.copy[language];
        const parts = [`## ${copy.h1}`, '', `URL: ${urlFor(page, language)}`, '', fill(copy.lead)];
        if (copy.steps) parts.push('', `### ${UI[language].how}`, '', ...copy.steps.map((step, index) => `${index + 1}. ${fill(step)}`));
        for (const [title, text] of copy.sections || []) parts.push('', `### ${title}`, '', fill(text));
        if (copy.whyText) parts.push('', `### ${copy.why}`, '', ...copy.whyText.map(fill));
        const questions = faqEntries(page, language);
        if (questions.length) parts.push('', `### ${UI[language].faq}`, '', ...questions.flatMap(([question, answer]) => [`**${fill(question)}**`, fill(answer), '']));
        return parts.join('\n').trimEnd();
    };
    const sections = LANGUAGES.map(language => {
        const heading = { en: '# English', es: '# Español', pt: '# Português (Portugal)' }[language];
        return `${heading}\n\n${SITE_PAGES.map(page => pageText(page, language)).join('\n\n')}`;
    });
    return `# ${BRAND} — full text

> Every page of ${ORIGIN}, in English, Spanish and European Portuguese. Generated from the same source as the pages.

${facts().join('\n')}

${sections.join('\n\n')}
`;
}

function catalog() {
    const urls = page => Object.fromEntries(LANGUAGES.map(language => [HREFLANG[language], urlFor(page, language)]));
    return `${JSON.stringify({
        name: BRAND,
        url: `${ORIGIN}/`,
        description: 'Free online video downloader, PDF editor and ID card to PDF tool, with no ads and no sign-up.',
        publisher: { name: PUBLISHER, url: 'https://elysiumdr.eu/' },
        updated: UPDATED,
        price: 'free',
        advertising: false,
        account: 'not required',
        languages: LANGUAGES.map(language => LOCALES[language]),
        limits: {
            perVisitorPerHour: {
                linkChecks: LIMITS.inspectionsPerHour,
                videoDownloads: LIMITS.downloadsPerHour,
                wordConversions: LIMITS.conversionsPerHour
            },
            videoMaxMegabytes: LIMITS.videoMaxMb,
            pdfEditMaxMegabytes: LIMITS.pdfEditMaxMb,
            pdfToWordMaxMegabytes: LIMITS.pdfConvertMaxMb,
            pdfToWordMaxPages: LIMITS.pdfConvertMaxPages,
            fileRetentionMinutes: LIMITS.fileMinutes
        },
        tools: [
            {
                id: 'video-downloader',
                name: 'Video downloader',
                urls: urls(byId('video')),
                status: 'available',
                processing: 'server',
                platforms: { available: PLATFORM_LIST, comingSoon: SOON_LIST },
                platformPages: Object.fromEntries(platformPages().map(page => [platformName(page.platform), urls(page)])),
                formats: ['MP4', 'MP3', 'M4A'],
                resolutions: 'every resolution the platform publishes for the video, up to 4320p; no upscaling'
            },
            {
                id: 'pdf-editor',
                name: 'PDF editor',
                urls: urls(byId('pdf')),
                status: 'available',
                processing: 'browser for page editing; server for PDF to Word',
                tasks: Object.fromEntries(taskPages().map(page => [LABELS[page.id].en, urls(page)])),
                outputs: ['PDF', 'DOCX']
            },
            {
                id: 'id-card-to-pdf',
                name: 'ID card to PDF',
                urls: urls(byId('id-card')),
                status: 'available',
                processing: 'browser only; the photos are never uploaded',
                inputs: ['JPEG', 'PNG', 'HEIC', 'WebP'],
                documents: 'ID-1 cards (85.6 × 54 mm): national identity cards, residence permits, driving licences',
                outputs: ['PDF'],
                options: ['A4 or Letter', 'real size or 1.5×', 'colour or black and white', 'light correction', 'watermark']
            }
        ],
        documents: {
            llms: `${ORIGIN}/llms.txt`,
            llmsFull: `${ORIGIN}/llms-full.txt`,
            sitemap: `${ORIGIN}/sitemap.xml`,
            privacyAndTerms: urls(byId('legal'))
        }
    }, null, 2)}\n`;
}

/* ── El bloque «Elysium Tools» de los llms.txt del sitio de la empresa ─────── */

// Los dieciséis llms de las cuatro regiones presentan las herramientas con un
// bloque entre marcas que escribe este script, en el idioma de cada fichero:
// si cambian las plataformas o los límites, no se quedan diciendo lo de antes.
const MAIN_LLMS = {
    'llms.txt': 'en', 'llms-full.txt': 'en',
    'es/llms.txt': 'es', 'es/llms-full.txt': 'es',
    'pt/llms.txt': 'pt', 'pt/llms-full.txt': 'pt',
    '_national/es/llms.txt': 'es', '_national/es/llms-full.txt': 'es',
    '_national/pt/llms.txt': 'pt', '_national/pt/llms-full.txt': 'pt',
    '_national/com/llms.txt': 'en', '_national/com/llms-full.txt': 'en',
    '_national/com/es/llms.txt': 'es', '_national/com/es/llms-full.txt': 'es',
    '_national/com/pt/llms.txt': 'pt', '_national/com/pt/llms-full.txt': 'pt'
};
const TOOLS_BLOCK = /\n*<!-- BEGIN TOOLS -->[\s\S]*?<!-- END TOOLS -->\n*/;

function mainLlmsBlock(language) {
    const list = new Intl.ListFormat(LOCALES[language], { type: 'conjunction' }).format(PLATFORM_LIST);
    const video = byId('video');
    const pdf = byId('pdf');
    const idCard = byId('id-card');
    const home = urlFor(byId('home'), language);
    const others = LANGUAGES.filter(other => other !== language);
    const names = {
        en: { en: 'English', es: 'Spanish', pt: 'Portuguese' },
        es: { en: 'Inglés', es: 'Español', pt: 'Portugués' },
        pt: { en: 'Inglês', es: 'Espanhol', pt: 'Português' }
    }[language];
    const languages = others.map(other => `${names[other]}: ${urlFor(byId('home'), other)}`).join(' · ');
    const lines = {
        en: [
            `Free online tools by ${PUBLISHER} on their own site, ${home}: no ads, no sign-up, with fair-use limits per hour.`,
            `- [${LABELS.video.en}](${urlFor(video, 'en')}): public videos from ${list}, in every resolution the platform offers, as MP4, MP3 or M4A.${SOON_LIST.length ? ` ${SOON_LIST.join(', ')}: coming soon.` : ''}`,
            `- [${LABELS.pdf.en}](${urlFor(pdf, 'en')}): merge PDFs and reorder, rotate, delete or extract pages inside the browser; convert PDF to Word (.docx).`,
            `- [${LABELS['id-card'].en}](${urlFor(idCard, 'en')}): both sides of an ID card, straightened and at real size on one PDF page, without uploading the photos.`,
            `- ${languages} · For language models: ${ORIGIN}/llms.txt`
        ],
        es: [
            `Herramientas online gratuitas de ${PUBLISHER} en su propio sitio, ${home}: sin anuncios, sin registro y con límites de uso justo por hora.`,
            `- [${LABELS.video.es}](${urlFor(video, 'es')}): videos públicos de ${list}, en todas las resoluciones que ofrece la plataforma, en MP4, MP3 o M4A.${SOON_LIST.length ? ` ${SOON_LIST.join(', ')}: próximamente.` : ''}`,
            `- [${LABELS.pdf.es}](${urlFor(pdf, 'es')}): unir PDF y ordenar, girar, eliminar o extraer páginas dentro del navegador; convertir PDF a Word (.docx).`,
            `- [${LABELS['id-card'].es}](${urlFor(idCard, 'es')}): las dos caras de una cédula o un DNI, enderezadas y a tamaño real en una hoja PDF, sin subir las fotos.`,
            `- ${languages} · Para modelos de lenguaje: ${ORIGIN}/llms.txt`
        ],
        pt: [
            `Ferramentas online gratuitas da ${PUBLISHER} no seu próprio site, ${home}: sem anúncios, sem registo e com limites de utilização justa por hora.`,
            `- [${LABELS.video.pt}](${urlFor(video, 'pt')}): vídeos públicos do ${list}, em todas as resoluções que a plataforma oferece, em MP4, MP3 ou M4A.${SOON_LIST.length ? ` ${SOON_LIST.join(', ')}: em breve.` : ''}`,
            `- [${LABELS.pdf.pt}](${urlFor(pdf, 'pt')}): juntar PDF e ordenar, rodar, eliminar ou extrair páginas dentro do navegador; converter PDF para Word (.docx).`,
            `- [${LABELS['id-card'].pt}](${urlFor(idCard, 'pt')}): as duas faces de um Cartão de Cidadão, endireitadas e em tamanho real numa folha PDF, sem enviar as fotografias.`,
            `- ${languages} · Para modelos de linguagem: ${ORIGIN}/llms.txt`
        ]
    }[language];
    return `<!-- BEGIN TOOLS -->\n## ${BRAND}\n\n${lines[0]}\n\n${lines.slice(1).join('\n')}\n<!-- END TOOLS -->\n`;
}

function withToolsBlock(path, language) {
    const text = read(path).replace(TOOLS_BLOCK, '\n').trimEnd();
    return `${text}\n\n${mainLlmsBlock(language)}`;
}

/* ── Construcción ────────────────────────────────────────────────────────── */

function checkConsistency() {
    const promised = PLATFORMS.filter(platform => platform.available).map(platform => platform.name);
    if (JSON.stringify(promised) !== JSON.stringify(PUBLIC_PLATFORMS)) {
        throw new Error(`Las plataformas de content.mjs (${promised}) y de JS/tools-public.js (${PUBLIC_PLATFORMS}) no coinciden.`);
    }
    for (const page of PAGES) {
        for (const language of LANGUAGES) {
            if (!page.copy[language]) throw new Error(`${page.id}: falta el idioma ${language}`);
            if (page.slugs[language] === undefined) throw new Error(`${page.id}: falta el slug en ${language}`);
        }
    }
}

/** Todo lo que se genera: ruta relativa a la raíz del repositorio → contenido. */
export function buildSite() {
    checkConsistency();
    const files = new Map();
    for (const page of SITE_PAGES) {
        for (const language of LANGUAGES) {
            files.set(`${OUT}${pathFor(page, language)}index.html`, pageHtml(page, language));
        }
    }
    for (const language of LANGUAGES) {
        files.set(`${OUT}${language === 'en' ? '' : `/${language}`}/404.html`, notFoundHtml(language));
    }
    files.set(`${OUT}/sitemap.xml`, sitemap());
    files.set(`${OUT}/robots.txt`, robots());
    files.set(`${OUT}/llms.txt`, llms());
    files.set(`${OUT}/llms-full.txt`, llmsFull());
    files.set(`${OUT}/catalog.json`, catalog());
    for (const [path, language] of Object.entries(MAIN_LLMS)) files.set(path, withToolsBlock(path, language));
    return files;
}

export const site = { SITE_PAGES, LANGUAGES, HREFLANG, pathFor, urlFor, label, ORIGIN };

/** Los ficheros de `tools/` que no salen del generador: se avisa, nunca se borran. */
function leftovers(files) {
    const absolute = join(ROOT, OUT);
    if (!existsSync(absolute)) return [];
    return readdirSync(absolute, { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile() && entry.name !== '.DS_Store')
        .map(entry => relative(ROOT, join(entry.parentPath ?? entry.path, entry.name)).split(sep).join('/'))
        .filter(path => !files.has(path));
}

/** Las tarjetas para redes sociales, una por idioma, con Chrome sin ventana. */
function renderOgImages() {
    if (!existsSync(CHROME)) throw new Error(`No está Chrome en ${CHROME}: hace falta para --og.`);
    const scratch = mkdtempSync(join(tmpdir(), 'elysium-tools-og-'));
    mkdirSync(join(ROOT, 'Images', 'tools'), { recursive: true });
    for (const language of LANGUAGES) {
        const home = byId('home').copy[language];
        const ui = UI[language];
        const page = join(scratch, `og-${language}.html`);
        writeFileSync(page, `<!doctype html><html lang="${LOCALES[language]}"><meta charset="utf-8"><style>
            *{box-sizing:border-box;margin:0}
            body{width:1200px;height:630px;overflow:hidden;color:#e8ecf4;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif;
                background:radial-gradient(circle at 88% 0%,rgba(41,151,255,.32),transparent 520px),radial-gradient(circle at 0% 100%,rgba(56,217,174,.14),transparent 560px),#020410;padding:72px 80px;display:flex;flex-direction:column}
            .brand{display:flex;align-items:center;gap:18px;font-size:30px;font-weight:700;letter-spacing:.01em}
            .mark{width:58px;height:58px;border:1.5px solid rgba(148,163,184,.4);border-radius:16px;display:grid;place-items:center;font-size:34px;font-weight:300;background:rgba(255,255,255,.06)}
            h1{margin-top:auto;font-size:68px;line-height:1.05;letter-spacing:-.025em;font-weight:750;max-width:1000px}
            ul{display:flex;gap:14px;list-style:none;padding:0;margin-top:34px}
            li{padding:10px 22px;border:1.5px solid rgba(56,217,174,.45);border-radius:999px;color:#bdf3e3;background:rgba(56,217,174,.1);font-size:24px;font-weight:650}
            .url{margin-top:38px;color:#a3adbd;font-size:24px;letter-spacing:.02em}
        </style><body><div class="brand"><span class="mark">λ</span>${BRAND}</div><h1>${esc(home.title)}</h1><ul>${ui.badges.map(badge => `<li>${esc(badge)}</li>`).join('')}</ul><p class="url">tools.elysiumdr.eu</p></body></html>`);
        const output = join(ROOT, 'Images', 'tools', `og-${language}.png`);
        execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
            '--window-size=1200,630', `--screenshot=${output}`, `file://${page}`], { stdio: 'ignore' });
        console.log(`✓ Images/tools/og-${language}.png`);
    }
    rmSync(scratch, { recursive: true, force: true });
}

function main() {
    const check = process.argv.includes('--check');
    if (process.argv.includes('--og')) renderOgImages();
    const files = buildSite();
    const stale = [];
    for (const [path, contents] of files) {
        const absolute = join(ROOT, path);
        const current = existsSync(absolute) ? readFileSync(absolute, 'utf8') : null;
        if (current === contents) continue;
        stale.push(path);
        if (!check) {
            mkdirSync(dirname(absolute), { recursive: true });
            writeFileSync(absolute, contents);
        }
    }
    const missingImages = LANGUAGES.filter(language => !existsSync(join(ROOT, 'Images', 'tools', `og-${language}.png`)));
    // Lo que sobra en `tools/` no se borra solo: puede ser trabajo de alguien.
    // Una página retirada del contenido se quita a mano, con git rm.
    const extra = leftovers(files);
    if (extra.length) console.warn(`! En tools/ hay ficheros que no genera este script:\n  ${extra.join('\n  ')}`);
    if (check) {
        const problems = [...stale.map(path => `desactualizado: ${path}`),
            ...missingImages.map(language => `falta: Images/tools/og-${language}.png (node scripts/build-tools.mjs --og)`)];
        if (problems.length) {
            console.error(`✗ tools.elysiumdr.eu no está al día. Ejecute node scripts/build-tools.mjs\n  ${problems.join('\n  ')}`);
            process.exit(1);
        }
        console.log(`✓ tools.elysiumdr.eu al día (${files.size} ficheros)`);
        return;
    }
    console.log(`✓ ${files.size} ficheros; ${stale.length} reescritos.`);
    if (missingImages.length) console.warn(`! Faltan las imágenes para redes (${missingImages.join(', ')}): node scripts/build-tools.mjs --og`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
