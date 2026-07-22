/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  F17 · WEB APP DOWNLOADER — registro del Service Worker (ONCORE)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Registra `sw.js` para que el sitio se pueda instalar como app y tolere
 *  cortes de red. El registro se aplaza al evento `load` para no competir por
 *  ancho de banda con el primer pintado.
 *
 *  Si el navegador no soporta Service Workers, no ocurre nada: el sitio
 *  funciona igual, solo sin instalación ni caché.
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, navigator) {
    'use strict';

    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/ONCORE/sw.js', { scope: '/ONCORE/' })
            .catch(function (error) {
                if (window.console) console.warn('[F17] no se pudo registrar el Service Worker:', error);
            });
    });
})(window, navigator);
