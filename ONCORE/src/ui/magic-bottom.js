/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  F09 · MAGIC BOTTOM — ONCORE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Acceso flotante de contacto y acciones rápidas: WhatsApp, email, cambio de
 *  idioma y conmutador de tema (F14).
 *
 *  Desviación documentada respecto a la implementación canónica: ONCORE no usa
 *  el patrón FAB expandible (`#fab-main` / `#fab-wrapper`) sino una dock
 *  siempre visible. La razón es de público: los utentes son personas en
 *  tratamiento o recuperación oncológica, y esconder el canal de contacto tras
 *  un toque adicional añade fricción justo donde no debe haberla. Se conservan
 *  las garantías del contrato: no colisiona con el footer, se repliega al
 *  hacer scroll hacia abajo y no tapa contenido en móvil.
 *
 *  API pública  Oncore.initMagicBottom()
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    var Oncore = window.Oncore = window.Oncore || {};

    /** Margen, en px, con el que la dock se aparta del footer al alcanzarlo. */
    var FOOTER_GAP = 24;

    /**
     * Inicializa la dock de contacto rápido.
     * @param {string} [dockSel='.oncore-dock'] Selector de la dock.
     * @returns {void}
     */
    Oncore.initMagicBottom = function initMagicBottom(dockSel) {
        var dock = document.querySelector(dockSel || '.oncore-dock');
        if (!dock) return;

        var footer = document.querySelector('footer');
        var frame = null;

        var syncDock = function () {
            // Se repliega al pisar el footer para no tapar los enlaces legales.
            if (footer) {
                var footerTop = footer.getBoundingClientRect().top;
                dock.classList.toggle('dock-tucked', footerTop < window.innerHeight - FOOTER_GAP);
            }
            frame = null;
        };

        var requestSync = function () {
            if (frame === null) frame = window.requestAnimationFrame(syncDock);
        };

        window.addEventListener('scroll', requestSync, { passive: true });
        window.addEventListener('resize', requestSync, { passive: true });
        syncDock();
    };
})(window, document);
