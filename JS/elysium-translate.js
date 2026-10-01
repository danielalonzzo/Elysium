/**
 * Elysium — traducción en vivo de elysiumdr.eu a 22 idiomas más.
 *
 * `elysiumdr.eu` tiene tres idiomas nativos y físicos (inglés `/`, español `/es/`
 * y portugués `/pt/`) y esos NO pasan por aquí: el selector sigue navegando entre
 * carpetas. Este fichero añade al mismo selector los demás idiomas de la Unión
 * Europea —alemán, búlgaro, checo, croata, danés, eslovaco, esloveno, estonio,
 * finés, francés, griego, húngaro, irlandés, italiano, letón, lituano, maltés,
 * neerlandés, polaco, rumano y sueco— y el latín, sin una sola página ni un solo
 * fichero de traducción: los traduce Google Website Translator en el navegador
 * de quien los pide.
 *
 * Reglas que no se ven abriendo el sitio:
 *
 *  - **Nunca por el navegador.** `.eu` abre en su idioma aunque el navegador esté
 *    en otro. La traducción solo existe tras una elección explícita: la cookie
 *    `googtrans` (de sesión) o `?lang=xx` en un enlace compartido.
 *  - **Se traduce desde la página en la que se está** (inglés, español o
 *    portugués, según `<html lang>`). No cambia la URL.
 *  - **Volver al original es recargar.** Se borra la cookie y se recarga: es lo
 *    único que no falla, porque el widget no sabe deshacerse sin su barra.
 *  - **Es traducción automática de Google** y el aviso de abajo lo dice. El texto
 *    de la página se envía a Google al traducir (está en la política de
 *    privacidad). El widget solo se descarga si alguien lo pide.
 *  - Solo actúa en las páginas de marketing de `.eu`. En `.es`, `.pt` y `.com` no
 *    hace nada: sus idiomas los gestiona `elysium-i18n.js` o son carpetas.
 *
 * Necesita la CSP de `_headers` abierta a `translate.google.com`,
 * `translate.googleapis.com` y `www.gstatic.com`.
 */
(function () {
    'use strict';

    if (window.ElysiumTranslate) return;

    const COOKIE = 'googtrans';
    const REGION_OVERRIDE_COOKIE = 'elysium_region_override=true; path=/; max-age=31536000; SameSite=Lax';
    const WIDGET_URL = 'https://translate.google.com/translate_a/element.js';
    const WIDGET_CALLBACK = 'elysiumTranslateInit';
    const WIDGET_HOLDER_ID = 'elysium-google-translate';
    const STYLESHEET = '/CSS/elysium-translate.css';
    const FLAG_PATH = '/Images/Optimized/flag-';
    const WIDGET_TIMEOUT_MS = 12000;
    // El aviso se puede cerrar y se queda cerrado el resto de la visita.
    const NOTICE_DISMISSED_KEY = 'elysium_translate_notice_dismissed';

    // Orden de Daniel: alemán, búlgaro, checo, croata, danés, eslovaco, esloveno,
    // estonio, finés, francés, griego, húngaro, irlandés, italiano, letón,
    // lituano, maltés, neerlandés, polaco, rumano, sueco y latín.
    const LANGUAGES = [
        ['de', 'Deutsch'], ['bg', 'Български'], ['cs', 'Čeština'], ['hr', 'Hrvatski'],
        ['da', 'Dansk'], ['sk', 'Slovenčina'], ['sl', 'Slovenščina'], ['et', 'Eesti'],
        ['fi', 'Suomi'], ['fr', 'Français'], ['el', 'Ελληνικά'], ['hu', 'Magyar'],
        ['ga', 'Gaeilge'], ['it', 'Italiano'], ['lv', 'Latviešu'], ['lt', 'Lietuvių'],
        ['mt', 'Malti'], ['nl', 'Nederlands'], ['pl', 'Polski'], ['ro', 'Română'],
        ['sv', 'Svenska'], ['la', 'Latina']
    ].map(([code, name]) => ({ code, name }));
    const LANGUAGE_CODES = new Set(LANGUAGES.map(language => language.code));

    // Mismo texto en el idioma de la página: el selector y el aviso hablan como ella.
    const COPY = {
        en: {
            heading: 'Machine translation',
            notice: 'Machine-translated by Google Translate. The original text prevails.',
            original: 'Show original',
            close: 'Close notice'
        },
        es: {
            heading: 'Traducción automática',
            notice: 'Traducción automática de Google Translate. Manda el texto original.',
            original: 'Ver original',
            close: 'Cerrar aviso'
        },
        pt: {
            heading: 'Tradução automática',
            notice: 'Tradução automática do Google Translate. Prevalece o texto original.',
            original: 'Ver original',
            close: 'Fechar aviso'
        }
    };

    // Las páginas de marketing de `.eu`: las mismas que `main.js` da por
    // conmutables (`SWITCHABLE_MARKETING_PAGES`). Fuera de ellas —portal, CRM,
    // biblioteca— no se hace nada. `translate.test.mjs` vigila que coincidan.
    const PAGES = new Set([
        '', 'about', 'case-moyra', 'case-pmorais', 'case-valtrix', 'contact',
        'daniel-morales', 'onboarding', 'portfolio', 'privacy',
        'prototype-moyra', 'prototype-pmorais', 'prototype-valtrix',
        'research', 'research/data-driven-sme-intelligence',
        'research/ontology-research', 'review-pmorais', 'services', 'terms',
        'thank-you'
    ]);

    // Lo que el widget no debe traducir: el propio selector, la marca y el aviso.
    const PROTECTED = [
        '.region-switcher-dropdown', '.lang-switcher-dropdown', '.nav-brand',
        '.elysium-version-tag', '#elysium-system-info-modal'
    ].join(',');

    // ── Dónde y cuándo ───────────────────────────────────────────────────────

    function isEuropeanSite() {
        const host = (window.location.hostname || '').toLowerCase();
        if (host === 'elysiumdr.eu') return true;
        // En local `.eu` es lo que no lleva `?national=`.
        if (host === 'localhost' || host === '127.0.0.1') {
            return !new URLSearchParams(window.location.search).get('national');
        }
        return false;
    }

    function canonicalPage() {
        let path = window.location.pathname || '/';
        if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
        if (path.endsWith('.html')) path = path.slice(0, -5);
        path = path.replace(/^\/(?:es|pt)(?=\/|$)/, '').replace(/^\//, '');
        return path === 'index' ? '' : path;
    }

    if (!isEuropeanSite() || !PAGES.has(canonicalPage())) {
        window.ElysiumTranslate = Object.freeze({
            enabled: false,
            translate: function () { return Promise.resolve(false); },
            restore: function () {}
        });
        return;
    }

    // El idioma de la página, leído ANTES de que el widget cambie `<html lang>`.
    const sourceLanguage = (function () {
        const declared = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
        return COPY[declared] ? declared : 'en';
    })();
    const copy = COPY[sourceLanguage];

    const state = {
        active: null,
        widget: null
    };

    // ── Cookie ───────────────────────────────────────────────────────────────

    function readCookie() {
        const match = new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]*)`).exec(document.cookie || '');
        if (!match) return null;
        const target = decodeURIComponent(match[1]).split('/').filter(Boolean)[1];
        return LANGUAGE_CODES.has(target) ? target : null;
    }

    function writeCookie(code) {
        try {
            document.cookie = `${COOKIE}=/${sourceLanguage}/${code}; path=/; SameSite=Lax`;
        } catch (error) {
            // Sin cookies el widget no puede recordar el idioma; la traducción
            // de esta página sigue funcionando.
        }
    }

    // El widget guarda la cookie en el host y, según la versión, también en el
    // dominio: hay que borrar todas las variantes o la traducción vuelve sola.
    function clearCookie() {
        const host = (window.location.hostname || '').toLowerCase();
        const domains = ['', `; domain=${host}`, `; domain=.${host}`];
        try {
            domains.forEach(domain => {
                document.cookie = `${COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
            });
        } catch (error) {
            // Nada que borrar si el navegador no deja escribir cookies.
        }
    }

    function requestedLanguage() {
        let queryLanguage = null;
        try {
            queryLanguage = new URLSearchParams(window.location.search).get('lang');
        } catch (error) {
            queryLanguage = null;
        }
        queryLanguage = queryLanguage ? queryLanguage.toLowerCase() : null;
        if (queryLanguage && LANGUAGE_CODES.has(queryLanguage)) return queryLanguage;
        return readCookie();
    }

    // ── Interfaz ─────────────────────────────────────────────────────────────

    function markProtected() {
        document.querySelectorAll(PROTECTED).forEach(element => {
            element.setAttribute('translate', 'no');
            element.classList.add('notranslate');
        });
    }

    function loadStylesheet() {
        if (document.querySelector(`link[href="${STYLESHEET}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = STYLESHEET;
        document.head.appendChild(link);
    }

    function flagImage(code) {
        const image = document.createElement('img');
        image.src = `${FLAG_PATH}${code}-64.webp`;
        image.alt = code.toUpperCase();
        image.width = 64;
        image.height = 64;
        image.decoding = 'async';
        image.loading = 'lazy';
        image.className = 'flag-icon';
        return image;
    }

    function languageOption(language) {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'lang-option lang-translate';
        option.setAttribute('role', 'menuitem');
        option.setAttribute('lang', language.code);
        option.dataset.translateLang = language.code;
        option.append(`${language.name} `, flagImage(language.code));
        return option;
    }

    // Se añade a los menús que ya existen (cabecera y pie): el marcado de las
    // páginas no cambia, así que el selector de siempre sigue siendo el mismo.
    function injectMenus() {
        // El menú ya tiene 25 entradas y necesita su CSS (desplazable, banderas)
        // en cuanto se abre, no solo cuando alguien traduce.
        loadStylesheet();
        document.querySelectorAll('.lang-switcher-menu').forEach(menu => {
            if (menu.classList.contains('has-machine-translation')) return;
            menu.classList.add('has-machine-translation');

            // Con el aviso cerrado, esta es la salida al original.
            const original = document.createElement('button');
            original.type = 'button';
            original.className = 'lang-option lang-translate-restore';
            original.setAttribute('role', 'menuitem');
            original.dataset.translateRestore = '';
            original.hidden = true;
            original.textContent = copy.original;
            menu.appendChild(original);

            const heading = document.createElement('div');
            heading.className = 'lang-menu-heading';
            heading.setAttribute('role', 'presentation');
            heading.textContent = copy.heading;
            menu.appendChild(heading);
            LANGUAGES.forEach(language => menu.appendChild(languageOption(language)));
        });
    }

    function updateTriggers(code) {
        document.querySelectorAll('.lang-switcher-dropdown').forEach(dropdown => {
            const label = dropdown.querySelector('.lang-current-label');
            const flag = dropdown.querySelector('.lang-switcher-trigger img');
            if (label && !label.dataset.nativeLabel) label.dataset.nativeLabel = label.textContent;
            if (flag && !flag.dataset.nativeSrc) {
                flag.dataset.nativeSrc = flag.getAttribute('src');
                flag.dataset.nativeAlt = flag.getAttribute('alt') || '';
            }
            if (label) label.textContent = code ? code.toUpperCase() : label.dataset.nativeLabel;
            if (flag) {
                flag.setAttribute('src', code ? `${FLAG_PATH}${code}-64.webp` : flag.dataset.nativeSrc);
                flag.setAttribute('alt', code ? code.toUpperCase() : flag.dataset.nativeAlt);
            }
            dropdown.querySelectorAll('.lang-translate-restore').forEach(option => {
                option.hidden = !code;
            });
            dropdown.querySelectorAll('.lang-translate').forEach(option => {
                const current = option.dataset.translateLang === code;
                option.classList.toggle('active', current);
                if (current) option.setAttribute('aria-current', 'true');
                else option.removeAttribute('aria-current');
            });
        });
    }

    function closeMenus() {
        document.querySelectorAll('.lang-switcher-dropdown.is-open').forEach(dropdown => {
            dropdown.classList.remove('is-open');
            const trigger = dropdown.querySelector('.lang-switcher-trigger');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
    }

    function noticeDismissed() {
        try {
            return window.sessionStorage.getItem(NOTICE_DISMISSED_KEY) === '1';
        } catch (error) {
            return false;
        }
    }

    function showNotice() {
        if (noticeDismissed() || document.querySelector('.elysium-translate-banner')) return;
        const banner = document.createElement('div');
        banner.className = 'elysium-translate-banner notranslate elysium-translate-ui';
        banner.setAttribute('translate', 'no');
        banner.setAttribute('role', 'status');

        const text = document.createElement('span');
        text.textContent = copy.notice;
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.translateRestore = '';
        button.textContent = copy.original;
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'elysium-translate-dismiss';
        close.dataset.translateDismiss = '';
        close.setAttribute('aria-label', copy.close);
        close.textContent = '×';
        banner.append(text, button, close);
        document.body.appendChild(banner);
    }

    // Cerrar el aviso no deshace la traducción: solo lo quita de en medio el
    // resto de la visita. «Ver original» sigue en el menú de idioma.
    function dismissNotice() {
        try {
            window.sessionStorage.setItem(NOTICE_DISMISSED_KEY, '1');
        } catch (error) {
            // Sin sessionStorage el aviso vuelve en la página siguiente; no es grave.
        }
        hideNotice();
    }

    function hideNotice() {
        document.querySelectorAll('.elysium-translate-banner').forEach(banner => banner.remove());
    }

    // ── El widget de Google ──────────────────────────────────────────────────

    // El `<select>` aparece antes que sus opciones, y en algunos navegadores
    // nunca las recibe: solo vale cuando ya tiene idiomas que elegir.
    function waitForCombo(resolve, reject) {
        const startedAt = Date.now();
        (function poll() {
            const combo = document.querySelector(`#${WIDGET_HOLDER_ID} select.goog-te-combo`);
            if (combo && combo.options.length > 0) return resolve(combo);
            if (Date.now() - startedAt > WIDGET_TIMEOUT_MS) {
                return reject(new Error('Google Translate did not start.'));
            }
            return window.setTimeout(poll, 100);
        })();
    }

    function loadWidget() {
        if (state.widget) return state.widget;

        state.widget = new Promise((resolve, reject) => {
            const holder = document.createElement('div');
            holder.id = WIDGET_HOLDER_ID;
            holder.className = 'notranslate elysium-translate-ui';
            holder.setAttribute('translate', 'no');
            holder.setAttribute('aria-hidden', 'true');
            document.body.appendChild(holder);

            window[WIDGET_CALLBACK] = function () {
                try {
                    // Sin `layout`: el diseño por defecto es el que crea el
                    // `<select class="goog-te-combo">` que este fichero maneja.
                    // `SIMPLE` pinta un menú propio en un iframe y no lo crea.
                    new window.google.translate.TranslateElement({
                        pageLanguage: sourceLanguage,
                        includedLanguages: LANGUAGES.map(language => language.code).join(','),
                        autoDisplay: false
                    }, WIDGET_HOLDER_ID);
                } catch (error) {
                    return reject(error);
                }
                return waitForCombo(resolve, reject);
            };

            const script = document.createElement('script');
            script.async = true;
            script.src = `${WIDGET_URL}?cb=${WIDGET_CALLBACK}`;
            script.onerror = () => reject(new Error('Google Translate could not be loaded.'));
            document.head.appendChild(script);
        });
        return state.widget;
    }

    function selectLanguage(code) {
        return loadWidget().then(combo => {
            if (combo.value === code) return true;
            combo.value = code;
            // Si el widget no ofrece ese idioma el valor no cambia: mejor
            // abandonar que dejar el aviso de «traducido» sobre un texto sin traducir.
            if (combo.value !== code) throw new Error(`Google Translate does not offer ${code}.`);
            combo.dispatchEvent(new Event('change'));
            return true;
        });
    }

    // ── Elegir y volver ──────────────────────────────────────────────────────

    function setActive(code) {
        state.active = code;
        document.documentElement.setAttribute('data-machine-translation', code);
        loadStylesheet();
        markProtected();
        updateTriggers(code);
        showNotice();
    }

    // Si Google no responde (sin red, bloqueado) la página se queda como estaba:
    // sin cookie, sin aviso y con el selector en su estado original.
    function abandon() {
        clearCookie();
        state.active = null;
        state.widget = null;
        document.documentElement.removeAttribute('data-machine-translation');
        updateTriggers(null);
        hideNotice();
    }

    function translate(code) {
        const target = typeof code === 'string' ? code.toLowerCase() : '';
        if (!LANGUAGE_CODES.has(target)) return Promise.resolve(false);
        if (state.active === target) return Promise.resolve(true);

        writeCookie(target);
        try {
            // Como el cambio de idioma físico de `main.js`: quien elige a mano
            // no debe ser repartido por país si vuelve a la portada.
            document.cookie = REGION_OVERRIDE_COOKIE;
        } catch (error) {
            // El reparto solo afecta a la portada; la traducción sigue.
        }
        setActive(target);
        return selectLanguage(target).catch(() => {
            abandon();
            return false;
        });
    }

    function restore() {
        clearCookie();
        try {
            window.sessionStorage.removeItem(NOTICE_DISMISSED_KEY);
        } catch (error) {
            // Nada que borrar.
        }
        const url = new URL(window.location.href);
        if (url.searchParams.has('lang')) {
            url.searchParams.delete('lang');
            window.location.replace(url.toString());
        } else {
            window.location.reload();
        }
    }

    // ── Eventos ──────────────────────────────────────────────────────────────

    function onClick(event) {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;

        const option = target.closest('.lang-translate');
        if (option) {
            // Captura + stopImmediatePropagation: `main.js` no debe tomar este
            // botón por un idioma físico ni navegar a otra carpeta.
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            closeMenus();
            translate(option.dataset.translateLang);
            return;
        }

        if (target.closest('[data-translate-dismiss]')) {
            event.preventDefault();
            dismissNotice();
            return;
        }

        if (target.closest('[data-translate-restore]')) {
            event.preventDefault();
            restore();
            return;
        }

        // Elegir inglés, español o portugués es navegar a su carpeta: la
        // traducción en vivo termina ahí, para que `/es/` no herede `/en/de`.
        if (target.closest('.lang-switcher-menu a[data-lang]')) clearCookie();
    }

    function initialise() {
        injectMenus();
        markProtected();

        const wanted = requestedLanguage();
        if (wanted) translate(wanted);
    }

    document.addEventListener('click', onClick, true);

    // `main.js` crea el selector donde falta en su `DOMContentLoaded`; este
    // fichero se carga después, así que su manejador corre cuando ya existe.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialise, { once: true });
    } else {
        initialise();
    }

    window.ElysiumTranslate = Object.freeze({
        enabled: true,
        languages: LANGUAGES.map(language => language.code),
        sourceLanguage,
        get language() { return state.active; },
        translate,
        restore
    });
})();
