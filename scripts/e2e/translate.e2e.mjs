/**
 * Verificación de extremo a extremo de la traducción en vivo de `.eu`
 * (`JS/elysium-translate.js`), con un Chrome real y el Worker de verdad (ver
 * `harness.mjs`).
 *
 *   Qué comprueba: que elegir un idioma traduce la página, que la elección
 *   sobrevive al cambio de página y al enlace compartido (`?lang=`), que
 *   «Ver original» y los idiomas nativos (EN/ES/PT) la deshacen, que la
 *   traducción parte del idioma de la página (`/es/` → español), que el idioma
 *   del navegador no traduce nada y que `.es`, `.pt` y `.com` no la ofrecen.
 *
 * REQUIERE RED: el widget lo descarga y lo ejecuta Google. Sin conexión, o si
 * Google lo cambia, estas comprobaciones fallan: es lo que se quiere saber.
 * No replica la CSP de `_headers`; la vigila `scripts/translate.test.mjs`.
 *
 * Uso:  node scripts/e2e/translate.e2e.mjs
 */
import { startServer, launchChrome, newPage, sleep } from './harness.mjs';

const results = [];
const check = (ok, name, detail = '') => { results.push({ ok, name, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  ← ' + detail}`); };
const eq = (actual, expected, name) => check(actual === expected, name, `esperado «${expected}», obtenido «${actual}»`);

const EU = 'https://elysiumdr.eu';
const googtrans = `document.cookie.split('; ').filter(c => c.startsWith('googtrans=')).length`;
const h1 = `(document.querySelector('h1') || {}).textContent?.trim()`;

/** Espera a que Google haya terminado de traducir la página. */
async function translated(page, timeout = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await page.eval(`/translated-/.test(document.documentElement.className)`)) { await sleep(400); return true; }
    await sleep(500);
  }
  return false;
}

async function open(page, url) {
  await page.session.send('Network.clearBrowserCookies');
  await page.goto(url, { settle: 800 });
  for (let attempt = 0; attempt < 30 && !(await page.eval('!!window.ElysiumTranslate')); attempt += 1) await sleep(200);
}

const server = await startServer();
const chrome = await launchChrome({ harnessPort: server.port, debugPort: 9340 });
try {
  const page = await newPage(chrome, { width: 1440, height: 900 });

  // ── 1. Elegir un idioma traduce, y el selector refleja la elección ─────────
  await open(page, `${EU}/about`);
  let menu = await page.eval(`(() => { const m = document.querySelector('.navbar .lang-switcher-menu'); return { translate: m.querySelectorAll('.lang-translate').length, native: [...m.querySelectorAll('a[data-lang]')].map(a => a.dataset.lang).join() }; })()`);
  eq(menu.translate, 22, '[.eu] el menú ofrece los 22 idiomas en vivo');
  eq(menu.native, 'en,es,pt', '[.eu] el menú conserva los tres idiomas nativos (enlaces a carpetas)');
  eq(await page.eval(`window.ElysiumTranslate.language`), null, '[.eu] sin elegir nada, la página no está traducida');

  await page.eval(`document.querySelector('.navbar .lang-translate[data-translate-lang="de"]').click()`);
  check(await translated(page), '[.eu → de] Google traduce la página');
  eq(await page.eval(h1), 'Unser Ethos', '[.eu → de] el título está en alemán');
  eq(await page.eval(`document.querySelector('.navbar .lang-current-label').textContent`), 'DE', '[.eu → de] el selector muestra DE');
  eq(await page.eval(`document.querySelector('.navbar .lang-switcher-trigger img').getAttribute('src').replace(/.*flag-/, '')`), 'de-64.webp', '[.eu → de] el selector muestra la bandera alemana');
  eq(await page.eval(`!!document.querySelector('.elysium-translate-banner')`), true, '[.eu → de] aparece el aviso de traducción automática');
  eq(await page.eval(`document.querySelector('.navbar .lang-current-label').closest('.lang-switcher-dropdown').classList.contains('notranslate')`), true, '[.eu → de] el selector está protegido: no se traduce a sí mismo');

  // ── 2. La elección sobrevive al cambio de página ───────────────────────────
  await page.eval(`location.assign('/services')`);
  await sleep(1500);
  check(await translated(page), '[.eu → de] al cambiar de página sigue traducida');
  eq(await page.eval(h1), 'Dienstleistungen', '[.eu → de] /services también en alemán');

  // ── 3. «Ver original» ──────────────────────────────────────────────────────
  await page.eval(`document.querySelector('[data-translate-restore]').click()`);
  await sleep(2500);
  eq(await page.eval(h1), 'Services', '[.eu → original] «Ver original» devuelve el inglés');
  eq(await page.eval(googtrans), 0, '[.eu → original] no queda ninguna cookie googtrans');
  eq(await page.eval(`window.ElysiumTranslate.language`), null, '[.eu → original] la página ya no está traducida');

  // ── 3b. El aviso se puede cerrar, y «Ver original» sigue en el menú ─────────
  await open(page, `${EU}/about`);
  eq(await page.eval(`[...document.querySelectorAll('.navbar .lang-translate-restore')].every(item => item.hidden)`), true, '[.eu] sin traducir, «Ver original» no aparece en el menú');
  await page.eval(`document.querySelector('.navbar .lang-translate[data-translate-lang="de"]').click()`);
  check(await translated(page), '[.eu → de] vuelve a traducir para probar el aviso');
  eq(await page.eval(`!!document.querySelector('.elysium-translate-banner [data-translate-dismiss]')`), true, '[aviso] tiene una cruz para cerrarlo');
  eq(await page.eval(`document.querySelector('.navbar .lang-translate-restore').hidden`), false, '[aviso] con traducción activa, «Ver original» aparece en el menú');
  await page.eval(`document.querySelector('[data-translate-dismiss]').click()`);
  await sleep(300);
  eq(await page.eval(`!!document.querySelector('.elysium-translate-banner')`), false, '[aviso] al cerrarlo desaparece');
  eq(await page.eval(`/translated-/.test(document.documentElement.className)`), true, '[aviso] cerrarlo no deshace la traducción');
  await page.eval(`location.assign('/services')`);
  await sleep(1500);
  check(await translated(page), '[aviso] cerrado, la página siguiente sigue traducida');
  eq(await page.eval(`!!document.querySelector('.elysium-translate-banner')`), false, '[aviso] y no vuelve a aparecer en la visita');
  await page.eval(`document.querySelector('.navbar .lang-translate-restore').click()`);
  await sleep(2500);
  eq(await page.eval(h1), 'Services', '[aviso] «Ver original» del menú devuelve el inglés');
  eq(await page.eval(googtrans), 0, '[aviso] y borra la cookie de traducción');
  await page.eval(`document.querySelector('.navbar .lang-translate[data-translate-lang="de"]').click()`);
  check(await translated(page), '[.eu → de] elegir otro idioma después de restaurar traduce de nuevo');
  eq(await page.eval(`!!document.querySelector('.elysium-translate-banner')`), true, '[aviso] tras restaurar, el aviso vuelve (la sesión de cierre se reinicia)');
  await page.eval(`document.querySelector('[data-translate-restore]').click()`);
  await sleep(2500);

  // ── 4. Enlace compartido con ?lang= ────────────────────────────────────────
  await open(page, `${EU}/about?lang=fr`);
  check(await translated(page), '[.eu ?lang=fr] el enlace compartido traduce');
  eq(await page.eval(h1), 'Notre philosophie', '[.eu ?lang=fr] el título está en francés');
  await page.eval(`document.querySelector('[data-translate-restore]').click()`);
  await sleep(2500);
  eq(await page.eval(`location.search`), '', '[.eu ?lang=fr] «Ver original» quita ?lang= de la dirección');
  eq(await page.eval(h1), 'Our Ethos', '[.eu ?lang=fr] y deja la página en inglés');

  // ── 5. Se traduce desde el idioma de la página ─────────────────────────────
  await open(page, `${EU}/es/about`);
  eq(await page.eval(`window.ElysiumTranslate.sourceLanguage`), 'es', '[.eu/es] el origen de la traducción es el español');
  await page.eval(`document.querySelector('.navbar .lang-translate[data-translate-lang="it"]').click()`);
  check(await translated(page), '[.eu/es → it] Google traduce desde el español');
  eq(await page.eval(`document.cookie.includes('googtrans=/es/it')`), true, '[.eu/es → it] la cookie lleva el origen español');

  // ── 6. Elegir un idioma nativo termina la traducción ───────────────────────
  await page.eval(`document.querySelector('.navbar .lang-switcher-menu a[data-lang="en"]').click()`);
  await sleep(2500);
  eq(await page.eval(`location.pathname`), '/about', '[.eu/es → EN] el selector nativo navega a la carpeta inglesa');
  eq(await page.eval(googtrans), 0, '[.eu/es → EN] y la cookie de traducción desaparece');
  eq(await page.eval(`/translated-/.test(document.documentElement.className)`), false, '[.eu/es → EN] la página inglesa no se traduce sola');

  // ── 7. El idioma del navegador no traduce nada ─────────────────────────────
  {
    const german = await newPage(chrome, { width: 1440, height: 900, acceptLanguage: 'de-DE,de' });
    await open(german, `${EU}/about`);
    await sleep(2500);
    eq(await german.eval(h1), 'Our Ethos', '[navegador en alemán] .eu abre en inglés, sin traducir');
    eq(await german.eval(`!!document.getElementById('elysium-google-translate')`), false, '[navegador en alemán] ni siquiera se descarga el widget');
    await german.close();
  }

  // ── 8. Fuera de .eu no hay traducción en vivo ──────────────────────────────
  for (const host of ['elysiumdr.es', 'elysiumdr.pt', 'elysiumdr.com']) {
    const other = await newPage(chrome, { width: 1440, height: 900 });
    await open(other, `https://${host}/about`);
    await sleep(800);
    eq(await other.eval(`window.ElysiumTranslate ? window.ElysiumTranslate.enabled : 'sin motor'`) === true, false, `[${host}] el motor de traducción en vivo no actúa`);
    eq(await other.eval(`document.querySelectorAll('.lang-translate').length`), 0, `[${host}] el selector no gana los 22 idiomas`);
    await other.close();
  }

  eq(page.session.console.filter(line => !/Failed to load resource|ERR_|net::/.test(line)).length, 0, 'sin errores de JavaScript');
  await page.close();
} finally { chrome.close(); server.close(); }

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas`);
if (failed.length) { console.log('FALLOS:'); failed.forEach(f => console.log(' -', f.name, '→', f.detail)); process.exit(1); }
