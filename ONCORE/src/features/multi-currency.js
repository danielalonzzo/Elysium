/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  F16 · MULTI-CURRENCY — ONCORE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Los elementos con `data-price` (valor en divisa base) se re-formatean en la
 *  divisa elegida por el visitante, con tipos de cambio cacheados 12 h y
 *  formato local vía `Intl.NumberFormat`.
 *
 *  ESTADO EN ESTE PROYECTO: el plan contratado (Advanced Maintenance) incluye
 *  la función, y el motor se entrega completo, pero ONCORE no publica precios
 *  en el sitio: los programas clínicos se presupuestan tras la avaliação
 *  inicial. Por eso el módulo se autodesactiva si no encuentra ningún
 *  `[data-price]`, y no inyecta selector alguno. En el momento en que la
 *  clínica publique tarifas basta con marcarlas:
 *
 *      <span data-price="1200">1 200 €</span>
 *
 *  y añadir el selector de divisa; el motor ya está operativo. No se inventan
 *  precios ni se muestra un conmutador sin nada que convertir.
 *
 *  Configuración  window.ONCORE_CURRENCY
 *  API pública    Oncore.initMultiCurrency() · window.setCurrency(code)
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    var Oncore = window.Oncore = window.Oncore || {};

    /**
     * Inicializa la conversión de divisas.
     * @param {Object} [options]
     * @param {string} [options.base='EUR']    Divisa en la que están los `data-price`.
     * @param {string} [options.apiUrl]        Endpoint de tipos de cambio.
     * @param {string} [options.storageKey]    Clave de la preferencia de divisa.
     * @param {string} [options.cacheKey]      Clave de la caché de tipos.
     * @param {number} [options.ttlMs]         Vigencia de la caché, en ms.
     * @returns {Promise<void>}
     */
    Oncore.initMultiCurrency = function initMultiCurrency(options) {
        var opts = options || window.ONCORE_CURRENCY || {};
        var base = opts.base || 'EUR';
        var apiUrl = opts.apiUrl || 'https://api.frankfurter.dev/v1/latest';
        var storageKey = opts.storageKey || 'currency_pref';
        var cacheKey = opts.cacheKey || 'currency_rates';
        var ttlMs = opts.ttlMs || 12 * 3600 * 1000;

        // Sin precios marcados no hay nada que convertir: no se toca la red.
        if (!document.querySelector('[data-price]')) return Promise.resolve();

        var cached = null;
        try { cached = JSON.parse(window.localStorage.getItem(cacheKey)); } catch (_) {}

        var ready = (cached && Date.now() - cached.at <= ttlMs)
            ? Promise.resolve(cached)
            : window.fetch(apiUrl + '?base=' + base)
                .then(function (res) { return res.json(); })
                .then(function (json) {
                    var fresh = { at: Date.now(), rates: json.rates || {} };
                    fresh.rates[base] = 1;
                    try { window.localStorage.setItem(cacheKey, JSON.stringify(fresh)); } catch (_) {}
                    return fresh;
                })
                .catch(function () { return cached; });

        return ready.then(function (rates) {
            if (!rates) return;

            /**
             * Re-formatea todos los precios en la divisa indicada.
             * @param {string} currency Código ISO 4217.
             * @returns {void}
             */
            var render = function (currency) {
                var rate = rates.rates[currency];
                if (!rate) return;

                var fmt = new Intl.NumberFormat(document.documentElement.lang || undefined, {
                    style: 'currency', currency: currency
                });

                document.querySelectorAll('[data-price]').forEach(function (el) {
                    var amount = parseFloat(el.getAttribute('data-price'));
                    if (!isFinite(amount)) return;
                    el.textContent = fmt.format(amount * rate);
                });

                try { window.localStorage.setItem(storageKey, currency); } catch (_) {}
            };

            var stored = null;
            try { stored = window.localStorage.getItem(storageKey); } catch (_) {}

            render(stored || base);
            window.setCurrency = render;    // <select onchange="setCurrency(this.value)">
        });
    };
})(window, document);
