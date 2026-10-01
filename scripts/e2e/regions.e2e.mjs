/**
 * Verificación de extremo a extremo de las cuatro regiones, con un Chrome real
 * y el Worker de verdad (ver `harness.mjs`).
 *
 *   Qué comprueba: que cada región abre en su idioma con cualquier idioma de
 *   navegador, el titular y la bandera de cada una, el selector de región, el
 *   cambio de idioma (navegando en `.eu` y `.com`; traduciendo en vivo en `.es`
 *   y `.pt`), el cambio de región, el reparto por país de la portada de `.eu`
 *   y que no haya errores de JavaScript.
 *
 * Uso:  node scripts/e2e/regions.e2e.mjs      (tarda un par de minutos)
 */
import { startServer, launchChrome, newPage, sleep } from './harness.mjs';

const results = [];
const check = (ok, name, detail = '') => { results.push({ ok, name, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  ← ' + detail}`); };
const eq = (actual, expected, name) => check(actual === expected, name, `esperado «${expected}», obtenido «${actual}»`);

const SNAP = `(() => {
  const h1 = document.querySelector('h1');
  const heroText = h1 ? [...h1.childNodes].filter(n => n.nodeType === 3 || (n.nodeType === 1 && !n.classList.contains('hero-title-suffix'))).map(n => n.textContent).join('').replace(/\\s+/g, ' ').trim() : null;
  const trigger = document.querySelector('.navbar .lang-switcher-trigger');
  return {
    href: location.href,
    htmlLang: document.documentElement.lang,
    navLang: navigator.language,
    hero: heroText,
    region: document.querySelector('.navbar .region-tag')?.textContent.trim(),
    regionItems: [...document.querySelectorAll('.navbar .region-item')].map(a => a.dataset.region + (a.classList.contains('active') ? '*' : '') + ':' + a.textContent.replace(/[●\\s]+/g, ' ').trim()),
    langLabel: trigger?.querySelector('.lang-current-label')?.textContent.trim(),
    langFlag: (trigger?.querySelector('img')?.getAttribute('src') || '').replace(/.*flag-/, '').replace('-64.webp', ''),
    optionFlags: [...document.querySelectorAll('.navbar .lang-switcher-menu [data-lang]')].map(o => o.dataset.lang + ':' + (o.querySelector('img')?.getAttribute('src') || '').replace(/.*flag-/, '').replace('-64.webp', '')),
  };
})()`;

const HERO = {
  eu: { en: 'Pan-European digital infrastructure for small-businesses and startups:', es: 'Infraestructura Digital Paneuropea para pequeñas empresas y emprendedores:', pt: 'Infraestrutura Digital Pan-Europeia para pequenas empresas e startups:' },
  es: { es: 'Infraestructura Digital para pequeñas empresas y emprendedores de España:' },
  pt: { pt: 'Infraestrutura Digital para pequenas empresas e startups de Portugal:' },
  com: { en: 'Digital infrastructure for small-businesses and startups:', es: 'Infraestructura Digital para pequeñas empresas y emprendedores:', pt: 'Infraestrutura Digital para pequenas empresas e startups:' }
};
const DOMAIN = { eu: 'https://elysiumdr.eu', es: 'https://elysiumdr.es', pt: 'https://elysiumdr.pt', com: 'https://elysiumdr.com' };

const server = await startServer();
const chrome = await launchChrome({ harnessPort: server.port });
try {
  // ── 1. Cada región abre en su idioma, sin importar el navegador ─────────────
  const NATIVE = { eu: { lang: 'en-GB', code: 'en', region: 'EUROPE', flag: 'eu' }, es: { lang: 'es-ES', code: 'es', region: 'ESPAÑA', flag: 'es' }, pt: { lang: 'pt-PT', code: 'pt', region: 'PORTUGAL', flag: 'pt' }, com: { lang: 'en-GB', code: 'en', region: 'GLOBAL', flag: 'eu' } };
  for (const browserLang of ['en-US,en', 'es-ES,es', 'es-CR,es', 'pt-BR,pt', 'pt-PT,pt', 'fr-FR,fr', 'de-DE,de']) {
    for (const d of ['eu', 'es', 'pt', 'com']) {
      const page = await newPage(chrome, { width: 1440, height: 900, acceptLanguage: browserLang });
      await page.session.send('Storage.clearDataForOrigin', { origin: DOMAIN[d], storageTypes: 'all' });
      await page.goto(DOMAIN[d] + '/');
      const s = await page.eval(SNAP);
      const n = NATIVE[d];
      const tag = `[${d} · navegador ${browserLang.split(',')[0]}]`;
      eq(s.hero, HERO[d][n.code], `${tag} titular nativo`);
      eq(s.htmlLang, n.lang, `${tag} <html lang>`);
      eq(s.region, n.region, `${tag} región en la cabecera`);
      eq(s.langLabel, n.code.toUpperCase(), `${tag} idioma activo`);
      eq(s.langFlag, n.flag, `${tag} bandera del idioma activo`);
      check(new URL(s.href).hostname === `elysiumdr.${d}` && new URL(s.href).pathname === '/', `${tag} se queda en su dominio y en la portada`, s.href);
      await page.close();
    }
  }

  // ── 2. Selector de región: cuatro regiones, ninguna Costa Rica / Worldwide ───
  for (const d of ['eu', 'es', 'pt', 'com']) {
    const page = await newPage(chrome, { width: 1440, height: 900 });
    await page.goto(DOMAIN[d] + '/');
    const s = await page.eval(SNAP);
    const want = ['EU', 'ES', 'PT', 'GLOBAL'].map(r => r + ({ eu: 'EU', es: 'ES', pt: 'PT', com: 'GLOBAL' }[d] === r ? '*' : '')).sort();
    const got = s.regionItems.map(x => x.split(':')[0]).sort();
    eq(JSON.stringify(got), JSON.stringify(want), `[${d}] el selector lista Europa, España, Portugal y Global (y activa la suya)`);
    check(!s.regionItems.some(x => /COSTA|WORLDWIDE/i.test(x)), `[${d}] sin «Costa Rica» ni «Worldwide» como región`, s.regionItems.join(' | '));
    await page.close();
  }

  // ── 3. Banderas del español por región ──────────────────────────────────────
  for (const [d, path, expectFlag] of [['eu', '/es/', 'es'], ['com', '/es/', 'cr'], ['eu', '/', 'es'], ['com', '/', 'cr'], ['es', '/', 'es'], ['pt', '/', 'es']]) {
    const page = await newPage(chrome, { width: 1440, height: 900 });
    await page.goto(DOMAIN[d] + path);
    const s = await page.eval(SNAP);
    const spanishOption = s.optionFlags.find(x => x.startsWith('es:'));
    eq(spanishOption, `es:${expectFlag}`, `[${d}${path}] bandera de «Español» en el selector de idioma`);
    if (path === '/es/') eq(s.langFlag, expectFlag, `[${d}${path}] bandera del idioma activo (español)`);
    await page.close();
  }

  // ── 4. Cambio de idioma dentro de cada región ───────────────────────────────
  {
    const page = await newPage(chrome, { width: 1440, height: 900, acceptLanguage: 'fr-FR,fr' });
    for (const d of ['eu', 'com']) {
      await page.goto(DOMAIN[d] + '/');
      for (const [code, path, lang] of [['es', '/es/', d === 'com' ? 'es-CR' : 'es-ES'], ['pt', '/pt/', 'pt-PT'], ['en', '/', 'en-GB']]) {
        await page.eval(`document.querySelector('.navbar .lang-switcher-menu [data-lang="${code}"]').click()`);
        await sleep(1500);
        const s = await page.eval(SNAP);
        const url = new URL(s.href);
        check(url.hostname === `elysiumdr.${d}` && url.pathname === path, `[${d}] idioma ${code} → ${path}`, s.href);
        eq(s.htmlLang, lang, `[${d}] idioma ${code}: <html lang>`);
        eq(s.hero, HERO[d][code], `[${d}] idioma ${code}: titular`);
        eq(s.region, { en: { eu: 'EUROPE', com: 'GLOBAL' }, es: { eu: 'EUROPA', com: 'GLOBAL' }, pt: { eu: 'EUROPA', com: 'GLOBAL' } }[code][d], `[${d}] idioma ${code}: etiqueta de región en ese idioma`);
      }
    }
    await page.close();
  }

  // ── 5. Traducción dinámica en .es y .pt (sin salir del dominio) ─────────────
  for (const [d, steps] of [
    ['es', [['en', 'Digital Infrastructure for small businesses and entrepreneurs in Spain:'], ['pt', 'Infraestrutura Digital para pequenas empresas e empreendedores de Espanha:'], ['es', 'Infraestructura Digital para pequeñas empresas y emprendedores de España:']]],
    ['pt', [['en', 'Digital Infrastructure for small businesses and startups in Portugal:'], ['es', 'Infraestructura Digital para pequeñas empresas y startups de Portugal:'], ['pt', 'Infraestrutura Digital para pequenas empresas e startups de Portugal:']]]
  ]) {
    const page = await newPage(chrome, { width: 1440, height: 900, acceptLanguage: 'fr-FR,fr' });
    await page.session.send('Storage.clearDataForOrigin', { origin: DOMAIN[d], storageTypes: 'all' });
    await page.goto(DOMAIN[d] + '/');
    for (const [code, hero] of steps) {
      await page.eval(`(document.querySelector('.navbar .lang-switcher-menu [data-lang="${code}"]'))?.click()`);
      await sleep(2500);
      const s = await page.eval(SNAP);
      eq(s.hero, hero, `[${d}] traducción a ${code}: titular regional`);
      check(new URL(s.href).hostname === `elysiumdr.${d}`, `[${d}] traducción a ${code}: sigue en su dominio`, s.href);
      eq(s.region, { es: { en: 'SPAIN', pt: 'ESPANHA', es: 'ESPAÑA' }, pt: { en: 'PORTUGAL', es: 'PORTUGAL', pt: 'PORTUGAL' } }[d][code], `[${d}] traducción a ${code}: etiqueta de región traducida`);
    }
    await page.close();
  }

  // ── 6. Cambio de región: cada una abre en SU idioma ─────────────────────────
  for (const [from, fromPath, region, expectHost, expectLang] of [
    ['eu', '/es/', 'ES', 'elysiumdr.es', 'es-ES'], ['eu', '/es/', 'PT', 'elysiumdr.pt', 'pt-PT'], ['eu', '/es/', 'GLOBAL', 'elysiumdr.com', 'en-GB'],
    ['es', '/', 'EU', 'elysiumdr.eu', 'en-GB'], ['es', '/', 'GLOBAL', 'elysiumdr.com', 'en-GB'], ['es', '/', 'PT', 'elysiumdr.pt', 'pt-PT'],
    ['pt', '/', 'ES', 'elysiumdr.es', 'es-ES'], ['pt', '/', 'EU', 'elysiumdr.eu', 'en-GB'],
    ['com', '/es/', 'EU', 'elysiumdr.eu', 'en-GB'], ['com', '/es/', 'ES', 'elysiumdr.es', 'es-ES'], ['com', '/pt/', 'PT', 'elysiumdr.pt', 'pt-PT']
  ]) {
    const page = await newPage(chrome, { width: 1440, height: 900, acceptLanguage: 'es-ES,es' });
    await page.session.send('Network.clearBrowserCookies');
    await page.goto(DOMAIN[from] + fromPath + (from === 'es' || from === 'pt' ? '' : ''));
    await page.eval(`document.querySelector('.navbar .region-item[data-region="${region}"]').click()`);
    await sleep(2500);
    const s = await page.eval(SNAP);
    const url = new URL(s.href);
    check(url.hostname === expectHost, `[${from}${fromPath} → ${region}] aterriza en ${expectHost}`, s.href);
    eq(s.htmlLang, expectLang, `[${from}${fromPath} → ${region}] abre en el idioma de la región`);
    await page.close();
  }

  // ── 7. Reparto por país en la portada de .eu ────────────────────────────────
  for (const [country, expected] of [['ES', 'https://elysiumdr.es/'], ['PT', 'https://elysiumdr.pt/'], ['CR', 'https://elysiumdr.com/es/'], ['MX', 'https://elysiumdr.com/es/'], ['BR', 'https://elysiumdr.com/pt/'], ['US', 'https://elysiumdr.eu/'], ['DE', 'https://elysiumdr.eu/']]) {
    const page = await newPage(chrome, { width: 1440, height: 900, acceptLanguage: 'en-US,en', country });
    await page.session.send('Network.clearBrowserCookies');
    const href = await page.goto('https://elysiumdr.eu/');
    eq(href, expected, `[.eu desde ${country}] reparto por país`);
    await page.close();
  }

  // ── 8. Páginas interiores: región, bandera e idioma ─────────────────────────
  for (const [d, path, lang, flag, region] of [['eu', '/es/about', 'es-ES', 'es', 'EUROPA'], ['com', '/es/about', 'es-CR', 'cr', 'GLOBAL'], ['com', '/pt/services', 'pt-PT', 'pt', 'GLOBAL'], ['eu', '/pt/terms', 'pt-PT', 'pt', 'EUROPA'], ['com', '/privacy', 'en-GB', 'eu', 'GLOBAL'], ['es', '/about', 'es-ES', 'es', 'ESPAÑA'], ['pt', '/contact', 'pt-PT', 'pt', 'PORTUGAL'], ['com', '/es/research/ontology-research', 'es-CR', 'cr', 'GLOBAL'], ['eu', '/es/research/ontology-research', 'es-ES', 'es', 'EUROPA']]) {
    const page = await newPage(chrome, { width: 1440, height: 900 });
    await page.goto(DOMAIN[d] + path);
    const s = await page.eval(SNAP);
    eq(s.htmlLang, lang, `[${d}${path}] <html lang>`);
    eq(s.region, region, `[${d}${path}] región`);
    eq(s.langFlag, flag, `[${d}${path}] bandera del idioma activo`);
    const errors = page.session.console.filter(m => !/GTM|googletagmanager|gtag|google-analytics|Failed to load resource|net::ERR|favicon|ERR_|CSP|Content Security/i.test(m));
    check(errors.length === 0, `[${d}${path}] sin errores de JavaScript`, errors.join(' | '));
    await page.close();
  }

  // ── 9. «Biblioteca» y «Cuenta» respetan la región y el idioma de la región ──
  // Con el navegador en otro idioma y con una elección guardada que contradice a la región.
  const REGION_VIEW = [
    // [desde, región, <html lang>, idioma]
    ['https://elysiumdr.eu/', 'EUROPE', 'en-GB', 'EN'],
    ['https://elysiumdr.eu/es/', 'EUROPA', 'es-ES', 'ES'],
    ['https://elysiumdr.eu/pt/', 'EUROPA', 'pt-PT', 'PT'],
    ['https://elysiumdr.es/', 'ESPAÑA', 'es-ES', 'ES'],
    ['https://elysiumdr.pt/', 'PORTUGAL', 'pt-PT', 'PT'],
    ['https://elysiumdr.com/', 'GLOBAL', 'en-GB', 'EN'],
    ['https://elysiumdr.com/es/', 'GLOBAL', 'es-CR', 'ES'],
    ['https://elysiumdr.com/pt/', 'GLOBAL', 'pt-PT', 'PT']
  ];
  for (const [home, region, lang, label] of REGION_VIEW) {
    for (const [selector, name] of [['.nav-link[href*="library"]', 'Biblioteca'], ['.nav-link[href*="profiles"]', 'Cuenta']]) {
      for (const browser of ['fr-FR,fr', 'es-ES,es', 'pt-BR,pt']) {
        const page = await newPage(chrome, { width: 1440, height: 900, acceptLanguage: browser });
        const origin = new URL(home).origin;
        // Una elección guardada de otra vez, en el idioma contrario al de la región.
        await page.goto(`${origin}/robots.txt`, { settle: 200 });
        const contrary = lang.startsWith('pt') ? 'es' : 'pt';
        await page.eval(`localStorage.clear(); ${new URL(home).hostname.match(/\.(es|pt)$/) ? '' : `localStorage.setItem('elysium_lang_pref', '${contrary}'); localStorage.setItem('elysium_lang', '${contrary}');`}`);
        await page.goto(`${home}?override=true`);
        await page.eval(`document.querySelector('${selector}').click()`);
        await sleep(3500);
        const s = await page.eval(SNAP);
        const where = `[${home.replace('https://', '')} → ${name} · navegador ${browser.slice(0, 5)}]`;
        eq(new URL(s.href).hostname, new URL(home).hostname, `${where} se queda en su dominio`);
        eq(s.region, region, `${where} región`);
        eq(s.htmlLang, lang, `${where} idioma de la región`);
        await page.close();
      }
    }
  }

  // El índice → un libro conserva el idioma; la región, también.
  for (const [home, lang] of [['https://elysiumdr.es/', 'es-ES'], ['https://elysiumdr.com/es/', 'es-CR'], ['https://elysiumdr.eu/pt/', 'pt-PT'], ['https://elysiumdr.pt/', 'pt-PT'], ['https://elysiumdr.com/', 'en-GB']]) {
    const page = await newPage(chrome, { width: 1440, height: 900, acceptLanguage: 'fr-FR,fr' });
    await page.goto(`${home}?override=true`);
    await page.eval(`document.querySelector('.nav-link[href*="library"]').click()`);
    await sleep(3000);
    await page.eval(`document.querySelector('.library-card a, a[href^="/library/manual"]').click()`);
    await sleep(3000);
    const s = await page.eval(SNAP);
    const where = `[${home.replace('https://', '')} → biblioteca → libro]`;
    check(/\/library\/manual/.test(s.href) && new URL(s.href).hostname === new URL(home).hostname, `${where} el libro abre en el mismo dominio`, s.href);
    eq(s.htmlLang, lang, `${where} idioma de la región (el libro está en portugués y el navegador en francés)`);
    await page.close();
  }

  // Cambiar de región desde la biblioteca abre la región nueva en SU idioma.
  for (const [from, region, host, lang] of [['https://elysiumdr.es/', 'EU', 'elysiumdr.eu', 'en-GB'], ['https://elysiumdr.com/es/', 'PT', 'elysiumdr.pt', 'pt-PT'], ['https://elysiumdr.pt/', 'GLOBAL', 'elysiumdr.com', 'en-GB']]) {
    const page = await newPage(chrome, { width: 1440, height: 900 });
    await page.goto(`${from}?override=true`);
    await page.eval(`document.querySelector('.nav-link[href*="library"]').click()`);
    await sleep(3000);
    await page.eval(`document.querySelector('.navbar .region-item[data-region="${region}"]').click()`);
    await sleep(3000);
    const s = await page.eval(SNAP);
    eq(new URL(s.href).hostname, host, `[biblioteca de ${from.replace('https://', '')} → ${region}] aterriza en ${host}`);
    eq(s.htmlLang, lang, `[biblioteca de ${from.replace('https://', '')} → ${region}] abre en el idioma de la región`);
    await page.close();
  }

  // La administración solo existe en .eu: en los espejos el botón lleva allí.
  {
    const page = await newPage(chrome, { width: 1440, height: 900 });
    await page.goto('https://elysiumdr.es/library');
    await sleep(1500);
    const hidden = await page.eval(`(()=>{const s=document.querySelector('[data-library-admin-section]');return !s || s.hidden})()`);
    check(hidden, '[.es/library] la administración no se ofrece fuera de .eu');
    await page.close();
  }
} finally { chrome.close(); server.close(); }

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas`);
if (failed.length) { console.log('FALLOS:'); failed.forEach(f => console.log(' -', f.name, '→', f.detail)); process.exit(1); }
