/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GLOSSÁRIO — termos explicativos en línea (feature de ONCORE)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Los términos clínicos marcados con `.term-tooltip` despliegan su definición
 *  al pasar el puntero, al tocarlos o con el teclado. Pensado para un público
 *  que llega sin vocabulario clínico previo: la definición vive en el atributo
 *  `data-tooltip`, siempre presente en el HTML, y no depende de JavaScript
 *  para poder ser leída por un rastreador.
 *
 *  API pública  Oncore.initGlossary()
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    var Oncore = window.Oncore = window.Oncore || {};

    /**
     * Inicializa los términos explicativos.
     * @param {string} [selector='.term-tooltip'] Selector de los términos.
     * @returns {void}
     */
    Oncore.initGlossary = function initGlossary(selector) {
        var terms = document.querySelectorAll(selector || '.term-tooltip');
        if (!terms.length) return;

        var closeAll = function (except) {
            terms.forEach(function (term) {
                if (term !== except) term.classList.remove('is-open');
            });
        };

        terms.forEach(function (term) {
            // Anuncia la definición a los lectores de pantalla sin duplicar texto.
            var definition = term.getAttribute('data-tooltip');
            if (definition) {
                term.setAttribute('role', 'button');
                term.setAttribute('aria-label', term.textContent.trim() + '. ' + definition);
            }

            term.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                var wasOpen = term.classList.contains('is-open');
                closeAll(term);
                term.classList.toggle('is-open', !wasOpen);
            });

            term.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') {
                    term.classList.remove('is-open');
                    term.blur();
                    return;
                }
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    var wasOpen = term.classList.contains('is-open');
                    closeAll(term);
                    term.classList.toggle('is-open', !wasOpen);
                }
            });
        });

        document.addEventListener('click', function () { closeAll(); });
        window.addEventListener('scroll', function () { closeAll(); }, { passive: true });
    };
})(window, document);
