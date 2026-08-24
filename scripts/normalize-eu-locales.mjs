#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const localeConfig = {
  es: { htmlLang: 'es-CR', label: 'EUROPA' },
  pt: { htmlLang: 'pt-PT', label: 'EUROPA' }
};

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(absolute);
    return entry.isFile() && entry.name.endsWith('.html') ? [absolute] : [];
  }));
  return nested.flat();
}

function pageSlug(locale, filename) {
  const relative = path.relative(path.join(projectRoot, locale), filename).replaceAll(path.sep, '/');
  return relative === 'index.html' ? '' : relative.replace(/\.html$/, '');
}

function publicUrl(locale, slug) {
  if (locale === 'en') return `https://elysiumdr.eu/${slug}`;
  return `https://elysiumdr.eu/${locale}/${slug}`;
}

function physicalHref(language, slug) {
  const safeSlug = [
    'infraestructura-digital-pymes-costa-rica',
    'infraestructura-digital-pymes-espana',
    'infraestrutura-digital-pme-portugal'
  ].includes(slug) ? '' : slug;
  if (language === 'es') return `/es/${safeSlug}`;
  if (language === 'pt') return `/pt/${safeSlug}`;
  return `/${safeSlug}`;
}

function normalizeLanguageMenus(html, slug) {
  return html.replace(
    /(<div\s+class="lang-switcher-menu"[^>]*>)([\s\S]*?)(<\/div>)/g,
    (_menu, opening, body, closing) => {
      const options = body.replace(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/g, (match, tag, rawAttrs, content) => {
        const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
        const existing = rawAttrs.match(/\bdata-lang="(en|es|pt)"/);
        const language = existing?.[1]
          || (text.includes('portugu') ? 'pt' : text.includes('español') || text.includes('espanol') ? 'es' : text.includes('english') ? 'en' : null);
        if (!language) return match;

        let attrs = rawAttrs.replace(/\sdata-lang="(?:en|es|pt)"/g, '');
        if (tag === 'a') {
          if (/\shref="[^"]*"/.test(attrs)) attrs = attrs.replace(/\shref="[^"]*"/, ` href="${physicalHref(language, slug)}"`);
          else attrs = ` href="${physicalHref(language, slug)}"${attrs}`;
        } else if (!/\stype=/.test(attrs)) {
          attrs = ` type="button"${attrs}`;
        }
        return `<${tag}${attrs} data-lang="${language}">${content}</${tag}>`;
      });
      return `${opening}${options}${closing}`;
    }
  );
}

function normalizeRegionItems(html, language) {
  const labels = language === 'es'
    ? { EU: 'EUROPA', ES: 'ESPAÑA', PT: 'PORTUGAL', CR: 'COSTA RICA' }
    : { EU: 'EUROPA', ES: 'ESPANHA', PT: 'PORTUGAL', CR: 'COSTA RICA' };
  const hrefs = {
    EU: 'https://elysiumdr.eu/?region=EU&amp;override=true',
    ES: 'https://elysiumdr.es/?region=ES',
    PT: 'https://elysiumdr.pt/?region=PT',
    CR: 'https://elysiumdr.eu/es/?region=CR&amp;override=true'
  };

  html = html.replace(/<span class="region-tag">[^<]*<\/span>/g, `<span class="region-tag">${localeConfig[language].label}</span>`);
  return html.replace(/<a\b([^>]*\bdata-region="(EU|ES|PT|CR)"[^>]*)>[\s\S]*?<\/a>/g, (_item, rawAttrs, region) => {
    let attrs = rawAttrs;
    if (/\shref="[^"]*"/.test(attrs)) attrs = attrs.replace(/\shref="[^"]*"/, ` href="${hrefs[region]}"`);
    else attrs = ` href="${hrefs[region]}"${attrs}`;

    const classMatch = attrs.match(/\bclass="([^"]*)"/);
    const classes = new Set((classMatch?.[1] || 'region-item').split(/\s+/).filter(Boolean));
    classes.delete('active');
    if (region === 'EU') classes.add('active');
    const classValue = [...classes].join(' ');
    if (classMatch) attrs = attrs.replace(/\bclass="[^"]*"/, `class="${classValue}"`);
    else attrs += ` class="${classValue}"`;
    attrs = attrs.replace(/\saria-current="[^"]*"/g, '');
    if (region === 'EU') attrs += ' aria-current="true"';

    const indicator = region === 'EU' ? '<span class="region-indicator" aria-hidden="true">●</span> ' : '';
    return `<a${attrs}>${indicator}${labels[region]}</a>`;
  });
}

function normalizeHead(html, locale, slug) {
  const headEnd = html.indexOf('</head>');
  if (headEnd === -1) return html;

  let head = html.slice(0, headEnd);
  const body = html.slice(headEnd);
  const canonical = publicUrl(locale, slug);
  const nativeDomain = locale === 'es' ? 'elysiumdr.es' : locale === 'pt' ? 'elysiumdr.pt' : null;
  if (nativeDomain) head = head.replaceAll(`https://${nativeDomain}`, `https://elysiumdr.eu/${locale}`);
  head = head.replace(/\s*<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="[^"]+"\s*\/?>/g, '');

  const canonicalTag = `<link rel="canonical" href="${canonical}">`;
  if (/<link\s+rel="canonical"[^>]*>/i.test(head)) {
    head = head.replace(/<link\s+rel="canonical"[^>]*>/i, canonicalTag);
  } else {
    head += `\n    ${canonicalTag}\n`;
  }

  const ogUrlTag = `<meta property="og:url" content="${canonical}">`;
  if (/<meta\s+property="og:url"[^>]*>/i.test(head)) {
    head = head.replace(/<meta\s+property="og:url"[^>]*>/i, ogUrlTag);
  } else {
    head += `    ${ogUrlTag}\n`;
  }
  return head + body;
}

for (const [locale, config] of Object.entries(localeConfig)) {
  const files = await htmlFiles(path.join(projectRoot, locale));
  for (const filename of files) {
    const slug = pageSlug(locale, filename);
    let html = await readFile(filename, 'utf8');
    html = html.replace(/<html\s+lang="[^"]*">/i, `<html lang="${config.htmlLang}">`);
    html = html.replace(/^\s*<script\s+src="(?:\.\.\/)+JS\/elysium-i18n\.js"[^>]*><\/script>\s*\r?\n/gm, '');
    html = normalizeHead(html, locale, slug);
    html = normalizeRegionItems(html, locale);
    html = normalizeLanguageMenus(html, slug);
    html = html.replaceAll('flag-es-64.webp', 'flag-cr-64.webp');
    html = html.replace(/(<img\b[^>]*flag-cr-64\.webp[^>]*\balt=")ES("[^>]*>)/g, '$1CR$2');
    await writeFile(filename, html);
  }
}

// English is the physical root of the European site. Normalize only pages that
// also have both replicated locale files, so private utilities and one-off
// prototypes are never exposed through language-switcher links accidentally.
const esFiles = new Set((await htmlFiles(path.join(projectRoot, 'es')))
  .map(filename => path.relative(path.join(projectRoot, 'es'), filename).replaceAll(path.sep, '/')));
const ptFiles = new Set((await htmlFiles(path.join(projectRoot, 'pt')))
  .map(filename => path.relative(path.join(projectRoot, 'pt'), filename).replaceAll(path.sep, '/')));
const rootEntries = await readdir(projectRoot, { withFileTypes: true });
const englishFiles = rootEntries
  .filter(entry => entry.isFile() && entry.name.endsWith('.html') && esFiles.has(entry.name) && ptFiles.has(entry.name))
  .map(entry => path.join(projectRoot, entry.name));
for (const relative of [...esFiles].filter(filename => filename.startsWith('research/') && ptFiles.has(filename))) {
  englishFiles.push(path.join(projectRoot, relative));
}

for (const filename of englishFiles) {
  const relative = path.relative(projectRoot, filename).replaceAll(path.sep, '/');
  const slug = relative === 'index.html' ? '' : relative.replace(/\.html$/, '');
  let html = await readFile(filename, 'utf8');
  html = normalizeHead(html, 'en', slug);
  html = normalizeLanguageMenus(html, slug);
  await writeFile(filename, html);
}

const englishRelativeFiles = new Set(englishFiles
  .map(filename => path.relative(projectRoot, filename).replaceAll(path.sep, '/')));

function addHreflangCluster(html, relative, currentLanguage) {
  const headEnd = html.indexOf('</head>');
  if (headEnd === -1) return html;
  let head = html.slice(0, headEnd);
  const tail = html.slice(headEnd);
  head = head.replace(/\s*<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="[^"]+"\s*\/?>/g, '');

  const slug = relative === 'index.html' ? '' : relative.replace(/\.html$/, '');
  const candidates = [
    ['en-GB', 'en', englishRelativeFiles.has(relative)],
    ['es-CR', 'es', esFiles.has(relative)],
    ['pt-PT', 'pt', ptFiles.has(relative)]
  ].filter(([, , exists]) => exists);
  if (!candidates.length) return html;

  const links = candidates.map(([hreflang, locale]) =>
    `    <link rel="alternate" hreflang="${hreflang}" href="${publicUrl(locale, slug)}">`
  );
  const defaultLocale = englishRelativeFiles.has(relative) ? 'en' : currentLanguage;
  links.push(`    <link rel="alternate" hreflang="x-default" href="${publicUrl(defaultLocale, slug)}">`);
  const block = `\n${links.join('\n')}`;
  if (/<link\s+rel="canonical"[^>]*>/i.test(head)) {
    head = head.replace(/(<link\s+rel="canonical"[^>]*>)/i, `$1${block}`);
  } else {
    head += block;
  }
  return head + tail;
}

const physicalTrees = [
  ...englishFiles.map(filename => ['en', filename]),
  ...[...esFiles].map(relative => ['es', path.join(projectRoot, 'es', relative)]),
  ...[...ptFiles].map(relative => ['pt', path.join(projectRoot, 'pt', relative)])
];
for (const [language, filename] of physicalTrees) {
  const base = language === 'en' ? projectRoot : path.join(projectRoot, language);
  const relative = path.relative(base, filename).replaceAll(path.sep, '/');
  const html = await readFile(filename, 'utf8');
  await writeFile(filename, addHreflangCluster(html, relative, language));
}

console.log('Normalized all three physical European language trees.');
