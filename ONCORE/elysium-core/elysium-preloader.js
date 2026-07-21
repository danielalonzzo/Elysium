/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  F01 · LOADING PAGE — Elysium λ Development & Research
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Overlay de carga a pantalla completa con logotipo de marca, duración mínima
 *  garantizada (evita el parpadeo en cargas rápidas), bloqueo de scroll, salida
 *  en dos fases (fade CSS y luego retirada del DOM) y timeout de seguridad.
 *
 *  Respeta `prefers-reduced-motion` (WCAG 2.1 AA) y anuncia «Actualizando…» o
 *  «Cerrando sesión…» cuando la recarga proviene de un System Update (F06),
 *  leyendo el flag `sys_action` de `sessionStorage`.
 *
 *  Se carga en `<head>`, antes de cualquier hoja de estilo, para que no exista
 *  ni un fotograma de página a medio pintar.
 *
 *  Configuración   window.ELYSIUM_PRELOADER
 *  API pública     ElysiumPreloader.dismiss()
 *  Evento          'elysium:preloader:done' (en document)
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    /**
     * @typedef  {Object} ElysiumPreloaderConfig
     * @property {string}  [brandName]   Nombre de marca mostrado bajo el logotipo.
     * @property {string}  [tagline]     Línea secundaria opcional.
     * @property {string}  [accent]      Color de acento (hex).
     * @property {string}  [background]  Color de fondo del overlay.
     * @property {string}  [foreground]  Color del texto del overlay.
     * @property {string}  [logoSvg]     SVG inline del logotipo. Sin marca si se omite.
     * @property {number}  [minDuration] Exhibición mínima en ms (defecto 1000).
     * @property {number}  [maxDuration] Timeout de seguridad en ms (defecto 8000).
     * @property {string}  [locale]      'pt' | 'es' | 'en'. Defecto: <html lang>.
     */

    var cfg = window.ELYSIUM_PRELOADER || {};

    var MIN_DURATION = clamp(cfg.minDuration, 1000, 0, 8000);
    var MAX_DURATION = clamp(cfg.maxDuration, 8000, 1000, 8000);
    var ACCENT       = cfg.accent     || '#2997ff';
    var BACKGROUND   = cfg.background || '#0B0B0B';
    var FOREGROUND   = cfg.foreground || '#F5F5F7';
    var OVERLAY_ID   = 'ely-preloader';
    var STYLE_ID     = 'ely-preloader-styles';
    var ROOT_CLASS   = 'ely-preloading';
    var FADE_MS      = 600;

    var startedAt = Date.now();
    var dismissed = false;
    var reduceMotion = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /**
     * Devuelve `value` si es un número finito dentro del rango; si no, `fallback`.
     * @param {*} value
     * @param {number} fallback
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    function clamp(value, fallback, min, max) {
        var n = typeof value === 'number' ? value : NaN;
        if (!isFinite(n)) return fallback;
        return Math.min(Math.max(n, min), max);
    }

    // ── Mensajes de acción del sistema (F06) ────────────────────────────────
    var MESSAGES = {
        pt: { update: 'A atualizar…',  logout: 'A terminar sessão…' },
        es: { update: 'Actualizando…', logout: 'Cerrando sesión…'   },
        en: { update: 'Updating…',     logout: 'Signing out…'       }
    };

    /**
     * Resuelve el idioma efectivo del overlay.
     * @returns {'pt'|'es'|'en'}
     */
    function resolveLocale() {
        var raw = cfg.locale || document.documentElement.getAttribute('lang') || 'en';
        var base = String(raw).toLowerCase().split('-')[0];
        return MESSAGES[base] ? base : 'en';
    }

    /**
     * Lee y consume el flag `sys_action` dejado por F06 System Update.
     * @returns {string} Mensaje a mostrar, o cadena vacía si no hubo acción.
     */
    function consumeSystemAction() {
        var action = '';
        try {
            action = window.sessionStorage.getItem('sys_action') || '';
            if (action) window.sessionStorage.removeItem('sys_action');
        } catch (_) {
            return '';
        }
        var dict = MESSAGES[resolveLocale()];
        return dict[action] || '';
    }

    // ── Estilos ─────────────────────────────────────────────────────────────

    /**
     * Inyecta la hoja de estilo del overlay en `<head>`.
     * Incluye un fondo de guarda sobre `<html>` que pinta en el primer
     * fotograma, antes incluso de que exista `<body>`.
     * @returns {void}
     */
    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        var css = [
            'html.' + ROOT_CLASS + ', html.' + ROOT_CLASS + ' body {',
            '  overflow: hidden !important;',
            '}',
            /* Guarda de primer fotograma: cubre la ventana aunque el overlay
               aún no se haya podido montar porque <body> no existe. */
            'html.' + ROOT_CLASS + '::before {',
            '  content: ""; position: fixed; inset: 0; z-index: 99998;',
            '  background: ' + BACKGROUND + ';',
            '}',
            '#' + OVERLAY_ID + ' {',
            '  position: fixed; inset: 0; z-index: 99999;',
            '  display: flex; align-items: center; justify-content: center;',
            '  background: ' + BACKGROUND + '; color: ' + FOREGROUND + ';',
            '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;',
            '  opacity: 1; transition: opacity ' + FADE_MS + 'ms ease;',
            '}',
            '#' + OVERLAY_ID + '.is-out { opacity: 0; }',
            '.ely-preloader-inner {',
            '  display: flex; flex-direction: column; align-items: center; gap: 14px;',
            '  text-align: center; padding: 24px;',
            '}',
            '.ely-preloader-mark {',
            '  width: 56px; height: 56px; border-radius: 50%;',
            '  display: flex; align-items: center; justify-content: center;',
            '  color: ' + ACCENT + '; background: rgba(255,255,255,.05);',
            '  border: 1px solid ' + hexToRgba(ACCENT, 0.28) + ';',
            '  animation: ely-preloader-pulse 1.6s ease-in-out infinite;',
            '}',
            '.ely-preloader-mark svg { width: 26px; height: 26px; }',
            '.ely-preloader-brand {',
            '  font-size: 1.05rem; font-weight: 600; letter-spacing: .18em;',
            '  text-transform: uppercase;',
            '}',
            '.ely-preloader-tagline {',
            '  font-size: .7rem; letter-spacing: .12em; opacity: .6;',
            '}',
            '.ely-preloader-status {',
            '  min-height: 1em; margin-top: 6px;',
            '  font-size: .66rem; letter-spacing: .2em; text-transform: uppercase;',
            '  font-weight: 600; color: ' + ACCENT + ';',
            '}',
            '.ely-preloader-bar {',
            '  width: 180px; height: 2px; border-radius: 2px; overflow: hidden;',
            '  background: rgba(255,255,255,.12);',
            '}',
            '.ely-preloader-fill {',
            '  height: 100%; width: 0; border-radius: 2px; background: ' + ACCENT + ';',
            '  animation: ely-preloader-progress 1.4s cubic-bezier(.4,0,.2,1) forwards;',
            '}',
            '@keyframes ely-preloader-pulse {',
            '  0%, 100% { opacity: .55; transform: scale(.94); }',
            '  50%      { opacity: 1;   transform: scale(1.06); }',
            '}',
            '@keyframes ely-preloader-progress {',
            '  0% { width: 0; } 45% { width: 62%; } 80% { width: 86%; } 100% { width: 96%; }',
            '}',
            /* WCAG 2.1 AA — sin movimiento ni transiciones si el usuario lo pide */
            '@media (prefers-reduced-motion: reduce) {',
            '  #' + OVERLAY_ID + ' { transition: none; }',
            '  .ely-preloader-mark { animation: none; }',
            '  .ely-preloader-fill { animation: none; width: 96%; }',
            '}'
        ].join('\n');

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }

    /**
     * Convierte un color hex de 6 dígitos a `rgba()` con la alfa indicada.
     * @param {string} hex
     * @param {number} alpha
     * @returns {string}
     */
    function hexToRgba(hex, alpha) {
        var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex));
        if (!m) return 'rgba(255,255,255,' + alpha + ')';
        return 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ','
             + parseInt(m[3], 16) + ',' + alpha + ')';
    }

    // ── Montaje ─────────────────────────────────────────────────────────────

    /**
     * Construye e inserta el overlay en cuanto `<body>` esté disponible.
     * Se reintenta con `requestAnimationFrame`, que se ejecuta antes del
     * pintado, de modo que nunca hay un fotograma sin overlay.
     * @returns {void}
     */
    function mount() {
        if (dismissed) return;
        if (!document.body) {
            window.requestAnimationFrame(mount);
            return;
        }
        if (document.getElementById(OVERLAY_ID)) return;

        var overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
        overlay.setAttribute('aria-label', cfg.brandName || 'Loading');

        var parts = ['<div class="ely-preloader-inner">'];
        if (cfg.logoSvg) parts.push('<div class="ely-preloader-mark">' + cfg.logoSvg + '</div>');
        if (cfg.brandName) parts.push('<div class="ely-preloader-brand">' + escapeHtml(cfg.brandName) + '</div>');
        if (cfg.tagline) parts.push('<div class="ely-preloader-tagline">' + escapeHtml(cfg.tagline) + '</div>');
        parts.push('<div class="ely-preloader-bar"><div class="ely-preloader-fill"></div></div>');
        parts.push('<div class="ely-preloader-status">' + escapeHtml(consumeSystemAction()) + '</div>');
        parts.push('</div>');

        overlay.innerHTML = parts.join('');
        document.body.appendChild(overlay);
    }

    /**
     * Escapa texto para inserción segura en HTML.
     * @param {string} value
     * @returns {string}
     */
    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    // ── Salida en dos fases ─────────────────────────────────────────────────

    /**
     * Retira el overlay: fase 1 fade por CSS, fase 2 eliminación del DOM.
     * Idempotente. Emite `elysium:preloader:done` al completarse.
     * @param {boolean} [immediate=false] Omite la espera de duración mínima.
     * @returns {void}
     */
    function dismiss(immediate) {
        if (dismissed) return;
        dismissed = true;

        var elapsed = Date.now() - startedAt;
        var wait = immediate ? 0 : Math.max(0, MIN_DURATION - elapsed);

        window.setTimeout(function () {
            var overlay = document.getElementById(OVERLAY_ID);
            var root = document.documentElement;

            if (!overlay) {
                root.classList.remove(ROOT_CLASS);
                emitDone();
                return;
            }

            overlay.classList.add('is-out');                 // fase 1 · fade CSS
            var removeDelay = reduceMotion ? 0 : FADE_MS;
            window.setTimeout(function () {                  // fase 2 · fuera del DOM
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                root.classList.remove(ROOT_CLASS);
                emitDone();
            }, removeDelay);
        }, wait);
    }

    /**
     * Emite el evento público de finalización.
     * @returns {void}
     */
    function emitDone() {
        document.dispatchEvent(new CustomEvent('elysium:preloader:done'));
    }

    // ── Arranque ────────────────────────────────────────────────────────────

    document.documentElement.classList.add(ROOT_CLASS);
    injectStyles();
    mount();

    window.addEventListener('load', function () { dismiss(false); });
    window.setTimeout(function () { dismiss(true); }, MAX_DURATION);   // seguridad

    /** @namespace ElysiumPreloader */
    window.ElysiumPreloader = {
        /** Retira el overlay respetando la duración mínima. */
        dismiss: function () { dismiss(false); }
    };

})(window, document);
