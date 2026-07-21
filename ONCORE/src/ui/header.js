/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  F02 · HEADER MOBILE-FIRST — ONCORE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Cabecera responsive: drawer móvil con bloqueo de scroll de fondo, cierre al
 *  navegar y con `Escape`, y reacción al scroll (clase `scrolled` a partir de
 *  50 px).
 *
 *  Extensión propia de ONCORE sobre la implementación canónica: el header
 *  flota sobre secciones de fondo claro y oscuro alternadas, por lo que sondea
 *  la luminancia real del contenido que atraviesa y conmuta entre
 *  `header-on-light` y `header-on-dark`. Sin ello el logotipo desaparece sobre
 *  las secciones oscuras (referenciación y ecosistema).
 *
 *  API pública  Oncore.initHeader()
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    var Oncore = window.Oncore = window.Oncore || {};

    /** Fondo de reserva (crema de marca) si el sondeo no encuentra color opaco. */
    var FALLBACK_BG = { r: 251, g: 247, b: 240, a: 1 };

    /** Umbral de luminancia a partir del cual el fondo se considera claro. */
    var LIGHT_THRESHOLD = 0.62;

    /**
     * Extrae los canales de una cadena `rgb()` / `rgba()` computada.
     * @param {string} color Valor de `background-color` computado.
     * @returns {?{r:number,g:number,b:number,a:number}} Canales, o `null` si no es parseable.
     */
    function parseBackgroundColor(color) {
        var values = color.match(/[\d.]+/g);
        if (!values || values.length < 3) return null;
        return {
            r: Number(values[0]),
            g: Number(values[1]),
            b: Number(values[2]),
            a: values.length > 3 ? Number(values[3]) : 1
        };
    }

    /**
     * Sube por el árbol hasta encontrar el primer ancestro con fondo opaco.
     * @param {?Element} element Nodo de partida.
     * @returns {{r:number,g:number,b:number,a:number}} Color de fondo efectivo.
     */
    function effectiveBackground(element) {
        var current = element;
        while (current) {
            var parsed = parseBackgroundColor(window.getComputedStyle(current).backgroundColor);
            if (parsed && parsed.a > 0.08) return parsed;
            current = current.parentElement;
        }
        return FALLBACK_BG;
    }

    /**
     * Inicializa la cabecera.
     * @param {Object}  [options]
     * @param {string}  [options.headerSel='#header']       Selector de la cabecera.
     * @param {string}  [options.toggleSel='#mobileMenuBtn'] Selector del botón hamburguesa.
     * @param {string}  [options.drawerSel='#navMenu']       Selector del menú desplegable.
     * @returns {void}
     */
    Oncore.initHeader = function initHeader(options) {
        var opts = options || {};
        var header = document.querySelector(opts.headerSel || '#header');
        var toggle = document.querySelector(opts.toggleSel || '#mobileMenuBtn');
        var drawer = document.querySelector(opts.drawerSel || '#navMenu');

        // ── Drawer móvil ────────────────────────────────────────────────────
        if (toggle && drawer) {
            var setMenuState = function (open) {
                var isEnglish = document.documentElement.lang.toLowerCase().indexOf('en') === 0;
                drawer.classList.toggle('active', open);
                document.body.style.overflow = open ? 'hidden' : '';
                toggle.setAttribute('aria-expanded', String(open));
                toggle.setAttribute('aria-label', open
                    ? (isEnglish ? 'Close menu' : 'Fechar menu')
                    : (isEnglish ? 'Open menu' : 'Abrir menu'));

                var icon = toggle.querySelector('i, svg');
                if (icon) {
                    var marker = document.createElement('i');
                    marker.setAttribute('data-lucide', open ? 'x' : 'menu');
                    icon.parentNode.replaceChild(marker, icon);
                    if (window.OncoreIcons) window.OncoreIcons.createIcons(toggle);
                }
            };

            toggle.addEventListener('click', function () {
                setMenuState(!drawer.classList.contains('active'));
            });

            drawer.querySelectorAll('a').forEach(function (link) {
                link.addEventListener('click', function () { setMenuState(false); });
            });

            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape' && drawer.classList.contains('active')) {
                    setMenuState(false);
                    toggle.focus();
                }
            });
        }

        // ── Reacción al scroll y contraste adaptativo ───────────────────────
        if (!header) return;

        var contrastFrame = null;

        var syncHeaderContrast = function () {
            var rect = header.getBoundingClientRect();
            var probeX = Math.round(window.innerWidth / 2);
            var probeY = Math.max(1, Math.min(window.innerHeight - 1, Math.round(rect.top + rect.height / 2)));

            var underlying = document.elementsFromPoint(probeX, probeY).find(function (element) {
                return !element.closest('#header')
                    && !element.closest('.oncore-dock')
                    && !element.closest('#ely-preloader');
            });

            var bg = effectiveBackground(underlying || document.body);
            var luminance = (0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b) / 255;
            var onLight = luminance > LIGHT_THRESHOLD;

            header.classList.toggle('header-on-light', onLight);
            header.classList.toggle('header-on-dark', !onLight);
            contrastFrame = null;
        };

        var requestHeaderContrast = function () {
            if (contrastFrame === null) contrastFrame = window.requestAnimationFrame(syncHeaderContrast);
        };

        var handleScroll = function () {
            header.classList.toggle('scrolled', window.scrollY > 50);
            requestHeaderContrast();
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', requestHeaderContrast, { passive: true });
        document.addEventListener('oncore:theme:change', requestHeaderContrast);
        handleScroll();
    };

    /**
     * Resalta en el menú el enlace de la sección visible.
     * @returns {void}
     */
    Oncore.initNavSpy = function initNavSpy() {
        var sections = document.querySelectorAll('main section[id]');
        var navLinks = document.querySelectorAll('.nav-menu ul a');
        if (!sections.length || !navLinks.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navLinks.forEach(function (link) {
                    link.classList.toggle('nav-active', link.getAttribute('href') === '#' + entry.target.id);
                });
            });
        }, { rootMargin: '-40% 0px -55% 0px' });

        sections.forEach(function (section) { observer.observe(section); });
    };
})(window, document);
