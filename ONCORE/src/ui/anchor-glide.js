/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  F04 · ANCHOR GLIDE — ONCORE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Scroll suave a anclas internas descontando la altura de la cabecera fija,
 *  para que el título de la sección nunca quede oculto tras el header.
 *
 *  El header de ONCORE es una píldora flotante con margen superior propio, por
 *  lo que al alto del elemento se le suma su desplazamiento respecto al borde
 *  del viewport; con `offsetHeight` a secas el título quedaba parcialmente
 *  tapado en escritorio.
 *
 *  Respeta `prefers-reduced-motion`: sin animación, salto directo.
 *
 *  API pública  Oncore.initAnchorGlide()
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    var Oncore = window.Oncore = window.Oncore || {};

    /** Holgura visual entre la cabecera y el título de la sección de destino. */
    var BREATHING_ROOM = 18;

    /**
     * Inicializa el desplazamiento suave a anclas internas.
     * @param {string} [headerSel='#header'] Selector de la cabecera fija.
     * @returns {void}
     */
    Oncore.initAnchorGlide = function initAnchorGlide(headerSel) {
        var selector = headerSel || '#header';

        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (event) {
                var href = this.getAttribute('href');
                if (!href || href === '#') return;

                var target = document.getElementById(href.slice(1));
                if (!target) return;

                event.preventDefault();

                var header = document.querySelector(selector);
                var offset = 0;
                if (header) {
                    var rect = header.getBoundingClientRect();
                    offset = rect.height + Math.max(0, rect.top) + BREATHING_ROOM;
                }

                var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.pageYOffset - offset,
                    behavior: reduceMotion ? 'auto' : 'smooth'
                });

                // Mantiene la URL compartible y el foco donde corresponde.
                if (window.history && window.history.pushState) {
                    window.history.pushState(null, '', href);
                }
                target.setAttribute('tabindex', '-1');
                target.focus({ preventScroll: true });
            });
        });
    };
})(window, document);
