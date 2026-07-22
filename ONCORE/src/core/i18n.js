/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  F15 · MULTI-LANGUAGE — ONCORE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Arquitectura multi-idioma por prefijo de ruta. El portugués, idioma de la
 *  clínica y de su público, vive en la raíz; el inglés bajo `/en/`:
 *
 *      /                       ·  /en/
 *      /privacy-policy.html    ·  /en/privacy-policy.html
 *      /cookie-policy.html     ·  /en/cookie-policy.html
 *
 *  Detección del idioma del navegador (las familias romances resuelven hacia
 *  el portugués, el resto hacia el inglés), redirección solo en la primera
 *  visita, conmutador manual con preferencia persistida y resolución de
 *  enlaces relativa a la profundidad de la página.
 *
 *  La redirección automática nunca se aplica si ya hay preferencia guardada ni
 *  si la URL trae `?lang=` explícito, para que un enlace compartido en un
 *  idioma concreto llegue siempre a ese idioma.
 *
 *  API pública  OncoreI18n.toggle() · OncoreI18n.current() · window.toggleLanguage()
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    /** Clave de la preferencia de idioma. */
    var STORAGE_KEY = 'lang_pref';

    /** Prefijo de ruta del árbol en inglés. */
    var EN_PREFIX = '/ONCORE/en/';

    /** Idiomas de navegador que resuelven hacia el árbol portugués. */
    var LOCAL_PREFIXES = ['pt', 'es', 'gl', 'ca', 'fr', 'it', 'ro'];

    /** Idioma local del proyecto. */
    var LOCAL_LANG = 'pt';

    var path = window.location.pathname;
    var onEnglish = path === '/ONCORE/en' || path.indexOf(EN_PREFIX) === 0;

    /**
     * Traduce una ruta al otro árbol de idioma.
     * @param {string}  currentPath Ruta actual.
     * @param {boolean} toEnglish   `true` para obtener la variante inglesa.
     * @returns {string} Ruta equivalente en el idioma pedido.
     */
    function translatePath(currentPath, toEnglish) {
        var bare = (currentPath === '/ONCORE/en' || currentPath.indexOf(EN_PREFIX) === 0)
            ? '/ONCORE/' + currentPath.replace(/^\/en\/?/, '')
            : currentPath;

        if (!toEnglish) return bare || '/ONCORE/';
        return bare === '/ONCORE/' ? EN_PREFIX : EN_PREFIX + bare.replace(/^\//, '');
    }

    /**
     * Lee la preferencia guardada.
     * @returns {?string} `'pt'`, `'en'`, o `null` si no hay ninguna.
     */
    function storedPref() {
        try { return window.localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
    }

    /**
     * Guarda la preferencia de idioma.
     * @param {string} lang `'pt'` o `'en'`.
     * @returns {void}
     */
    function savePref(lang) {
        try { window.localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    }

    /**
     * Idioma del documento actual.
     * @returns {string} `'pt'` o `'en'`.
     */
    function current() {
        return onEnglish ? 'en' : LOCAL_LANG;
    }

    /**
     * Cambia al otro idioma conservando la página y guardando la preferencia.
     * @returns {void}
     */
    function toggle() {
        var toEnglish = !onEnglish;
        savePref(toEnglish ? 'en' : LOCAL_LANG);
        window.location.href = translatePath(path, toEnglish);
    }

    // ── Redirección de primera visita ───────────────────────────────────────
    // Solo sobre documentos HTML, nunca sobre recursos, y nunca si la persona
    // ya eligió idioma o llegó con `?lang=` explícito.
    var explicit = /[?&]lang=/.test(window.location.search);
    var pref = storedPref();
    var isDocument = path === '/ONCORE/' || path === '/ONCORE/en' || /\/$|\.html$/.test(path);

    if (explicit) {
        savePref(current());
    } else if (!pref && isDocument) {
        var nav = (window.navigator.language || '').toLowerCase().split('-')[0];
        pref = LOCAL_PREFIXES.indexOf(nav) === -1 ? 'en' : LOCAL_LANG;
        savePref(pref);

        if (pref === 'en' && !onEnglish) {
            window.location.replace(translatePath(path, true));
        } else if (pref === LOCAL_LANG && onEnglish) {
            window.location.replace(translatePath(path, false));
        }
    }

    window.OncoreI18n = { toggle: toggle, current: current, translatePath: translatePath };
    window.toggleLanguage = toggle;
})(window, document);
