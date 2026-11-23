/**
 * Verificación de extremo a extremo de las cuatro regiones, con un Chrome real
 * y el Worker de verdad (ver `harness.mjs`).
 *
 *   Comprueba el idioma del navegador, los selectores de idioma y región,
 *   la sugerencia por país y el comportamiento al aceptarla o rechazarla.
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
  cr: { es: 'Infraestructura Digital para pequeñas empresas y emprendedores de Costa Rica:' },
  com: { en: 'Digital infrastructure for small-businesses and startups:', es: 'Infraestructura Digital para pequeñas empresas y emprendedores:', pt: 'Infraestrutura Digital para pequenas empresas e startups:' }
};
const DOMAIN = { eu: 'https://elysiumdr.eu', es: 'https://elysiumdr.es', pt: 'https://elysiumdr.pt', cr: 'https://elysiumdr.cr', com: 'https://elysiumdr.com' };

const server = await startServer();
const chrome = await launchChrome({ harnessPort: server.port });
try {
  // ── 1. Idioma del navegador e inglés cuando no hay traducción ──────────────
  const NATIVE = {
    eu: { host: 'elysiumdr.eu', path: '/' }, es: { host: 'elysiumdr.es', path: '/' },
    pt: { host: 'elysiumdr.pt', path: '/' }, cr: { host: 'elysiumdr.cr', path: '/' },
    com: { host: 'elysiumdr.com', path: '/' }
  };
  for (const [browserLang, code] of [['en-US,en', 'en'], ['es-ES,es', 'es'], ['pt-BR,pt', 'pt'], ['ja-JP,ja', 'en']]) {
    for (const d of ['eu', 'es', 'pt', 'cr', 'com']) {
      const page = await newPage(chrome, { acceptLanguage: browserLang });
      await page.session.send('Storage.clearDataForOrigin', { origin: new URL(DOMAIN[d]).origin, storageTypes: 'all' });
      await page.goto(DOMAIN[d] + '/');
      const s = await page.eval(SNAP);
      const n = NATIVE[d];
      const locale = code === 'es' ? (d === 'cr' || d === 'com' ? 'es-CR' : 'es-ES')
        : code === 'pt' ? 'pt-PT' : 'en-GB';
      const path = (d === 'eu' || d === 'com') && code !== 'en' ? `/${code}/` : n.path;
      const tag = `[${d} · navegador ${browserLang.split(',')[0]}]`;
      eq(s.htmlLang, locale, `${tag} <html lang>`);
      eq(s.langLabel, code.toUpperCase(), `${tag} idioma activo`);
      check(new URL(s.href).hostname === n.host && new URL(s.href).pathname === path, `${tag} el idioma conserva la región`, s.href);
      await page.close();
    }
  }

  // ── 2. Selector de región: cinco regiones (Europa, España, Portugal, Costa Rica, Global) ───
  for (const d of ['eu', 'es', 'pt', 'cr', 'com']) {
    const page = await newPage(chrome, { width: 1440, height: 900 });
    await page.goto(DOMAIN[d] + '/');
    const s = await page.eval(SNAP);
    const want = ['EU', 'ES', 'PT', 'CR', 'GLOBAL'].map(r => r + ({ eu: 'EU', es: 'ES', pt: 'PT', cr: 'CR', com: 'GLOBAL' }[d] === r ? '*' : '')).sort();
    const got = s.regionItems.map(x => x.split(':')[0]).sort();
    eq(JSON.stringify(got), JSON.stringify(want), `[${d}] el selector lista Europa, España, Portugal, Costa Rica y Global (y activa la suya)`);
    check(!s.regionItems.some(x => /WORLDWIDE/i.test(x)), `[${d}] sin «Worldwide» como región`, s.regionItems.join(' | '));
    await page.close();
  }

  // ── 3. Banderas del español por región ──────────────────────────────────────
  for (const [d, path, expectFlag] of [['eu', '/es/', 'es'], ['com', '/es/', 'cr'], ['cr', '/', 'cr'], ['eu', '/', 'es'], ['com', '/', 'cr'], ['es', '/', 'es'], ['pt', '/', 'es']]) {
    const page = await newPage(chrome, { width: 1440, height: 900 });
    await page.goto(DOMAIN[d] + path + (d === 'cr' ? '?lang=es' : ''));
    const s = await page.eval(SNAP);
    const spanishOption = s.optionFlags.find(x => x.startsWith('es:'));
    eq(spanishOption, `es:${expectFlag}`, `[${d}${path}] bandera de «Español» en el selector de idioma`);
    if (path === '/es/' || d === 'cr') eq(s.langFlag, expectFlag, `[${d}${path}] bandera del idioma activo (español)`);
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

  // ── 5. Traducción dinámica en .es, .pt y .com/cr/ (sin cambiar de ruta) ─────
  for (const [d, steps] of [
    ['es', [['en', 'Digital Infrastructure for small businesses and entrepreneurs in Spain:'], ['pt', 'Infraestrutura Digital para pequenas empresas e empreendedores de Espanha:'], ['es', 'Infraestructura Digital para pequeñas empresas y emprendedores de España:']]],
    ['pt', [['en', 'Digital Infrastructure for small businesses and startups in Portugal:'], ['es', 'Infraestructura Digital para pequeñas empresas y startups de Portugal:'], ['pt', 'Infraestrutura Digital para pequenas empresas e startups de Portugal:']]],
    ['cr', [['en', 'Digital Infrastructure for small businesses and entrepreneurs in Costa Rica:'], ['pt', 'Infraestrutura Digital para pequenas empresas e empreendedores da Costa Rica:'], ['es', 'Infraestructura Digital para pequeñas empresas y emprendedores de Costa Rica:']]]
  ]) {
    const page = await newPage(chrome, { width: 1440, height: 900, acceptLanguage: 'fr-FR,fr' });
    await page.session.send('Storage.clearDataForOrigin', { origin: new URL(DOMAIN[d]).origin, storageTypes: 'all' });
    await page.goto(DOMAIN[d] + '/');
    for (const [code, hero] of steps) {
      await page.eval(`(document.querySelector('.navbar .lang-switcher-menu [data-lang="${code}"]'))?.click()`);
      await sleep(2500);
      const s = await page.eval(SNAP);
      eq(s.hero, hero, `[${d}] traducción a ${code}: titular regional`);
      check(new URL(s.href).hostname === NATIVE[d].host && new URL(s.href).pathname === NATIVE[d].path, `[${d}] traducción a ${code}: sigue en su ruta sin crear subcarpetas`, s.href);
      eq(s.region, { es: { en: 'SPAIN', pt: 'ESPANHA', es: 'ESPAÑA' }, pt: { en: 'PORTUGAL', es: 'PORTUGAL', pt: 'PORTUGAL' }, cr: { en: 'COSTA RICA', pt: 'COSTA RICA', es: 'COSTA RICA' } }[d][code], `[${d}] traducción a ${code}: etiqueta de región traducida`);
    }
    await page.close();
  }

  // ── 6. El selector de región conserva el idioma del dispositivo ─────────────────────────
  for (const [from, fromPath, region, expectHost] of [
    ['eu', '/es/', 'ES', 'elysiumdr.es'], ['eu', '/es/', 'PT', 'elysiumdr.pt'], ['eu', '/es/', 'CR', 'elysiumdr.com'], ['eu', '/es/', 'GLOBAL', 'elysiumdr.com'],
    ['es', '/', 'EU', 'elysiumdr.eu'], ['es', '/', 'CR', 'elysiumdr.com'], ['es', '/', 'GLOBAL', 'elysiumdr.com'], ['es', '/', 'PT', 'elysiumdr.pt'],
    ['pt', '/', 'ES', 'elysiumdr.es'], ['pt', '/', 'EU', 'elysiumdr.eu'],
    ['cr', '/', 'GLOBAL', 'elysiumdr.com'], ['cr', '/', 'ES', 'elysiumdr.es'],
    ['com', '/es/', 'CR', 'elysiumdr.com'], ['com', '/es/', 'EU', 'elysiumdr.eu'], ['com', '/es/', 'ES', 'elysiumdr.es'], ['com', '/pt/', 'PT', 'elysiumdr.pt']
  ]) {
    const page = await newPage(chrome, { width: 1440, height: 900, acceptLanguage: 'es-ES,es' });
    for (const origin of new Set(Object.values(DOMAIN).map(url => new URL(url).origin))) {
      await page.session.send('Storage.clearDataForOrigin', { origin, storageTypes: 'all' });
    }
    await page.goto(DOMAIN[from] + fromPath);
    await page.eval(`document.querySelector('.navbar .region-item[data-region="${region}"]').click()`);
    await sleep(2500);
    const s = await page.eval(SNAP);
    const url = new URL(s.href);
    check(url.hostname === expectHost, `[${from}${fromPath} → ${region}] aterriza en ${expectHost}`, s.href);
    const isCostaRicanSpanish = region === 'CR' || region === 'GLOBAL';
    eq(s.htmlLang, isCostaRicanSpanish ? 'es-CR' : 'es-ES', `[${from}${fromPath} → ${region}] abre en el idioma del dispositivo`);
    await page.close();
  }

  // ── 7. Sugerencias de región con confirmación ────────────────────────────
  for (const [from, country, expected, regionCopy] of [
    ['https://elysiumdr.com/services?utm_source=qa#plans', 'PL', 'https://elysiumdr.eu/services?utm_source=qa#plans', 'Europe'],
    ['https://elysiumdr.eu/', 'CA', 'https://elysiumdr.com/', 'global'],
    ['https://elysiumdr.pt/', 'ES', 'https://elysiumdr.es/', 'Spain'],
    ['https://elysiumdr.es/', 'PT', 'https://elysiumdr.pt/', 'Portugal'],
    ['https://elysiumdr.com/about', 'CR', 'https://elysiumdr.cr/about', 'Costa Rica'],
    ['https://elysiumdr.cr/', 'CA', 'https://elysiumdr.com/', 'global'],
    ['https://elysiumdr.eu/', 'PL', null],
    ['https://elysiumdr.cr/', 'CR', null]
  ]) {
    const page = await newPage(chrome, { width: 390, height: 844, acceptLanguage: 'en-GB,en', country });
    for (const origin of new Set(Object.values(DOMAIN).map(url => new URL(url).origin))) {
      await page.session.send('Storage.clearDataForOrigin', { origin, storageTypes: 'all' });
    }

    const href = await page.goto(from);
    const tag = `[${from} desde ${country}]`;
    eq(href, from, `${tag} no cambia de sitio al entrar`);
    const notice = '.elysium-region-notice';
    eq(await page.eval(`document.querySelector('${notice} a')?.href ?? null`), expected, `${tag} sugerencia regional`);
    if (expected) {
      check(await page.eval(`document.querySelector('${notice} p').textContent.includes(${JSON.stringify(regionCopy)})`), `${tag} explica cuál sitio sugiere`);
      check(await page.eval(`(() => { const rect = document.querySelector('${notice}').getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight; })()`), `${tag} aviso completo en móvil`);
      if (country === 'CA' && from.includes('.eu')) {
        await page.eval(`document.querySelector('${notice} button').click()`);
        eq(await page.eval('location.href'), from, `${tag} rechazar conserva la página`);
        await page.goto('https://elysiumdr.eu/about');
        eq(await page.eval(`Boolean(document.querySelector('${notice}'))`), false, `${tag} no repite el aviso en la visita`);
      } else {
        await page.eval(`document.querySelector('${notice} a').click()`);
        await sleep(2250);
        eq(await page.eval('location.href'), expected, `${tag} cambia de sitio al aceptar`);
        eq(await page.eval(`Boolean(document.querySelector('${notice}'))`), false, `${tag} no hay aviso al llegar a la región correspondiente`);
      }
    }
    await page.close();
  }

  // ── 8. Páginas interiores: región, bandera e idioma ─────────────────────────
  for (const [d, path, lang, flag, region] of [['eu', '/es/about', 'es-ES', 'es', 'EUROPA'], ['com', '/es/about', 'es-CR', 'cr', 'GLOBAL'], ['com', '/pt/services', 'pt-PT', 'pt', 'GLOBAL'], ['eu', '/pt/terms', 'pt-PT', 'pt', 'EUROPA'], ['com', '/privacy', 'en-GB', 'eu', 'GLOBAL'], ['es', '/about', 'es-ES', 'es', 'ESPAÑA'], ['pt', '/contact', 'pt-PT', 'pt', 'PORTUGAL'], ['cr', '/about', 'es-CR', 'cr', 'COSTA RICA'], ['cr', '/services', 'es-CR', 'cr', 'COSTA RICA'], ['cr', '/privacy', 'es-CR', 'cr', 'COSTA RICA'], ['cr', '/contact', 'es-CR', 'cr', 'COSTA RICA'], ['com', '/es/research/ontology-research', 'es-CR', 'cr', 'GLOBAL'], ['eu', '/es/research/ontology-research', 'es-ES', 'es', 'EUROPA']]) {
    const page = await newPage(chrome, { width: 1440, height: 900 });
    await page.goto(DOMAIN[d] + path + '?lang=' + lang.slice(0, 2));
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
    ['https://elysiumdr.cr/', 'COSTA RICA', 'es-CR', 'ES'],
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
        const isNational = /\.(es|pt)$/.test(new URL(home).hostname) || new URL(home).pathname.startsWith('/cr');
        await page.eval(`localStorage.clear(); ${isNational ? '' : `localStorage.setItem('elysium_lang_pref', '${contrary}'); localStorage.setItem('elysium_lang', '${contrary}');`}`);
        await page.goto(`${home}?lang=${lang.slice(0, 2)}`);
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
  for (const [home, lang] of [['https://elysiumdr.es/', 'es-ES'], ['https://elysiumdr.cr/', 'es-CR'], ['https://elysiumdr.com/es/', 'es-CR'], ['https://elysiumdr.eu/pt/', 'pt-PT'], ['https://elysiumdr.pt/', 'pt-PT'], ['https://elysiumdr.com/', 'en-GB']]) {
    const page = await newPage(chrome, { width: 1440, height: 900, acceptLanguage: 'fr-FR,fr' });
    await page.goto(`${home}?lang=${lang.slice(0, 2)}`);
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

  // Cambiar de región desde la biblioteca aplica el idioma del dispositivo.
  for (const [from, region, host, lang] of [['https://elysiumdr.es/', 'EU', 'elysiumdr.eu', 'en-GB'], ['https://elysiumdr.com/es/', 'PT', 'elysiumdr.pt', 'en-GB'], ['https://elysiumdr.pt/', 'GLOBAL', 'elysiumdr.com', 'en-GB']]) {
    const page = await newPage(chrome, { width: 1440, height: 900, acceptLanguage: 'en-GB,en' });
    await page.session.send('Storage.clearDataForOrigin', { origin: `https://${host}`, storageTypes: 'all' });
    await page.goto(`${from}?override=true`);
    await page.eval(`document.querySelector('.nav-link[href*="library"]').click()`);
    await sleep(3000);
    await page.eval(`document.querySelector('.navbar .region-item[data-region="${region}"]').click()`);
    await sleep(3000);
    const s = await page.eval(SNAP);
    eq(new URL(s.href).hostname, host, `[biblioteca de ${from.replace('https://', '')} → ${region}] aterriza en ${host}`);
    eq(s.htmlLang, lang, `[biblioteca de ${from.replace('https://', '')} → ${region}] abre en el idioma del dispositivo`);
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
