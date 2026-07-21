/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FAQ — acordeón de perguntas frequentes (feature de ONCORE)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Comportamiento de acordeón sobre `<details>` nativos: al abrir uno se
 *  cierran los demás. El marcado sigue siendo `<details>/<summary>`, de modo
 *  que el contenido es legible sin JavaScript y extraíble por rastreadores,
 *  requisito del grafo `FAQPage` que emite la página (F20).
 *
 *  API pública  Oncore.initFaq()
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    var Oncore = window.Oncore = window.Oncore || {};

    /**
     * Inicializa el acordeón de FAQ.
     * @param {string} [selector='.faq-item'] Selector de cada `<details>`.
     * @returns {void}
     */
    Oncore.initFaq = function initFaq(selector) {
        var items = document.querySelectorAll(selector || '.faq-item');
        if (!items.length) return;

        items.forEach(function (item) {
            item.addEventListener('toggle', function () {
                if (!item.open) return;
                items.forEach(function (other) {
                    if (other !== item) other.open = false;
                });
            });
        });
    };
})(window, document);
