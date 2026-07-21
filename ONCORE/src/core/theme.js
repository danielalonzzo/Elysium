/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  F13 · DYNAMIC THEME  +  F14 · THEME SWITCHER — ONCORE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  F13 · El sitio alterna entre claro y oscuro según la franja horaria de
 *  Lisboa, aplicando las variables de `src/styles/tokens.css` sobre
 *  `:root[data-theme]`.
 *
 *  F14 · Si el visitante fija su modo con el conmutador, esa preferencia
 *  persiste en `localStorage` y prevalece sobre el modo automático en visitas
 *  futuras. El ciclo del conmutador es auto → claro → oscuro → auto, de modo
 *  que siempre se puede devolver el control al reloj.
 *
 *  Se ejecuta de forma síncrona en `<head>`, antes de pintar, para que no haya
 *  ni un fotograma con el tema equivocado.
 *
 *  Configuración  window.ONCORE_THEME = { timeZone, lightStart, lightEnd }
 *  API pública    OncoreTheme.apply() · OncoreTheme.toggle() · OncoreTheme.setMode()
 *  Evento         'oncore:theme:change' (en document), con { theme, mode }
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    var cfg = window.ONCORE_THEME || {};

    /** Clave de la preferencia manual (F14). */
    var STORAGE_KEY = 'theme_mode';

    /** Zona horaria de referencia: la sede de la clínica. */
    var TIME_ZONE = cfg.timeZone || 'Europe/Lisbon';

    /** Hora a la que empieza y termina la franja clara. */
    var LIGHT_START = typeof cfg.lightStart === 'number' ? cfg.lightStart : 7;
    var LIGHT_END = typeof cfg.lightEnd === 'number' ? cfg.lightEnd : 19;

    /** Modos admitidos por el conmutador, en orden de ciclo. */
    var MODES = ['auto', 'light', 'dark'];

    /**
     * Hora actual (0-23) en la zona horaria de referencia.
     * @returns {number} Hora local de la sede.
     */
    function hourNow() {
        try {
            return parseInt(new Date().toLocaleString('en-US', {
                timeZone: TIME_ZONE, hour12: false, hour: 'numeric'
            }), 10);
        } catch (_) {
            return new Date().getHours();
        }
    }

    /**
     * Lee la preferencia manual guardada.
     * @returns {string} `'auto'` | `'light'` | `'dark'`.
     */
    function storedMode() {
        var mode;
        try { mode = window.localStorage.getItem(STORAGE_KEY); } catch (_) {}
        return MODES.indexOf(mode) === -1 ? 'auto' : mode;
    }

    /**
     * Resuelve y aplica el tema sobre `:root[data-theme]`.
     * @param {string} [mode] Modo a aplicar. Por defecto, el guardado.
     * @returns {string} El tema efectivo: `'light'` o `'dark'`.
     */
    function apply(mode) {
        var active = mode || storedMode();
        var hour = hourNow();
        var isLight = active === 'light'
            || (active === 'auto' && hour >= LIGHT_START && hour < LIGHT_END);
        var theme = isLight ? 'light' : 'dark';

        document.documentElement.dataset.theme = theme;
        document.documentElement.dataset.themeMode = active;

        // Mantiene la barra del navegador en móvil a juego con el fondo real.
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', isLight ? '#FBF7F0' : '#141A17');

        return theme;
    }

    /**
     * Fija el modo, lo persiste y notifica el cambio.
     * @param {string} mode `'auto'` | `'light'` | `'dark'`.
     * @returns {void}
     */
    function setMode(mode) {
        var next = MODES.indexOf(mode) === -1 ? 'auto' : mode;
        try { window.localStorage.setItem(STORAGE_KEY, next); } catch (_) {}

        var theme = apply(next);
        document.dispatchEvent(new CustomEvent('oncore:theme:change', {
            detail: { theme: theme, mode: next }
        }));
    }

    /**
     * Avanza al siguiente modo del ciclo auto → claro → oscuro → auto.
     * @returns {void}
     */
    function toggle() {
        setMode(MODES[(MODES.indexOf(storedMode()) + 1) % MODES.length]);
    }

    apply();

    // El modo automático debe seguir vivo si la pestaña queda abierta al
    // cruzar el amanecer o el anochecer.
    window.setInterval(function () {
        if (storedMode() === 'auto') apply('auto');
    }, 60000);

    window.OncoreTheme = { apply: apply, toggle: toggle, setMode: setMode, getMode: storedMode };
})(window, document);
