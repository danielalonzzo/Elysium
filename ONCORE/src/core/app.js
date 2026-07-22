/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ARRANQUE — ONCORE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Orquesta las funciones del plan contratado sobre el DOM ya disponible.
 *  Cada función vive en su capa (`ui/`, `features/`) y expone su inicializador
 *  en el espacio de nombres `Oncore`; aquí solo se decide el orden.
 *
 *  Funciones cableadas desde este archivo:
 *
 *      F02 Header Mobile-First   ·  F03 Scroll Reveal
 *      F04 Anchor Glide          ·  F09 Magic Bottom
 *      F14 Theme Switcher        ·  F15 Multi-language (conmutador)
 *      F16 Multi-Currency
 *
 *  F01, F05, F06 y F08 se autoinicializan desde `elysium-core/` con la
 *  configuración de `src/core/elysium-config.js`.
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    var Oncore = window.Oncore = window.Oncore || {};

    /**
     * Marca el cuerpo como listo para lanzar la entrada cénica del hero.
     * @returns {void}
     */
    function revealHero() {
        if (document.body) document.body.classList.add('hero-ready');
    }

    /**
     * Cablea el conmutador de tema (F14) y refleja el estado en el botón.
     * @returns {void}
     */
    function initThemeSwitcher() {
        var buttons = document.querySelectorAll('[data-theme-toggle]');
        if (!buttons.length || !window.OncoreTheme) return;

        var isEnglish = document.documentElement.lang.toLowerCase().indexOf('en') === 0;
        var LABELS = {
            auto: isEnglish ? 'Theme: automatic' : 'Tema: automático',
            light: isEnglish ? 'Theme: light' : 'Tema: claro',
            dark: isEnglish ? 'Theme: dark' : 'Tema: escuro'
        };

        var sync = function () {
            var mode = window.OncoreTheme.getMode();
            buttons.forEach(function (button) {
                button.setAttribute('aria-label', LABELS[mode]);
                button.setAttribute('data-tooltip', LABELS[mode]);
                button.setAttribute('data-mode', mode);
            });
        };

        buttons.forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                window.OncoreTheme.toggle();
            });
        });

        document.addEventListener('oncore:theme:change', sync);
        sync();
    }

    /**
     * Cablea el conmutador de idioma de la dock (F15).
     * @returns {void}
     */
    function initLanguageSwitcher() {
        document.querySelectorAll('[data-lang-toggle]').forEach(function (link) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                if (window.OncoreI18n) window.OncoreI18n.toggle();
            });
        });
    }

    /**
     * Cablea el enlace de configuración de cookies del footer (§6.3, F08).
     *
     * Se hace con `addEventListener` y no con `onclick` en el HTML porque la
     * CSP del Security Core (F07) no admite `unsafe-inline`, que también
     * bloquea los manejadores incrustados en atributos.
     * @returns {void}
     */
    function initCookieSettings() {
        document.querySelectorAll('[data-cookie-settings]').forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                if (window.ElysiumConsent) window.ElysiumConsent.open();
            });
        });
    }

    /**
     * Inicializa todas las funciones del plan.
     * @returns {void}
     */
    Oncore.start = function start() {
        // Los iconos primero: el resto de módulos consulta y sustituye nodos.
        if (window.OncoreIcons) window.OncoreIcons.createIcons();

        if (Oncore.initHeader) Oncore.initHeader();
        if (Oncore.initNavSpy) Oncore.initNavSpy();
        if (Oncore.initAnchorGlide) Oncore.initAnchorGlide();
        if (Oncore.initScrollReveal) Oncore.initScrollReveal();
        if (Oncore.initMagicBottom) Oncore.initMagicBottom();
        if (Oncore.initLoopVideos) Oncore.initLoopVideos();

        if (Oncore.initTestimonials) Oncore.initTestimonials();
        if (Oncore.initFaq) Oncore.initFaq();
        if (Oncore.initGlossary) Oncore.initGlossary();
        if (Oncore.initContactForm) Oncore.initContactForm();
        if (Oncore.initMultiCurrency) Oncore.initMultiCurrency();

        initThemeSwitcher();
        initLanguageSwitcher();
        initCookieSettings();
    };

    // El hero entra cuando F01 retira el overlay; si el componente no estuviera
    // presente, la carga de la ventana sirve de red de seguridad.
    document.addEventListener('elysium:preloader:done', revealHero);
    window.addEventListener('load', revealHero);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', Oncore.start);
    } else {
        Oncore.start();
    }
})(window, document);
