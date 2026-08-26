/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  VALTRIX Engineering — Información del Sistema
 *  version-modal.js  |  V1.0.0 BETA
 *
 *  Misma pieza que la de Elysium (etiqueta de versión en el pie que abre una
 *  ficha de sistema), rehecha en el lenguaje visual de VALTRIX: vidrio claro
 *  sobre el fondo titanio, azul #0077B6, tipografía Inter en versalitas y las
 *  cifras técnicas en monoespaciada. No es un recoloreado del modal oscuro de
 *  Elysium: allí la tarjeta es azul noche y aquí es cristal blanco.
 *
 *  Los ajustes son solo los que este sitio puede cumplir de verdad —animaciones
 *  de fondo y botón flotante de contacto—; el idioma y la divisa se muestran
 *  como dato, no como selector, porque el sitio es únicamente en español de
 *  Costa Rica y el precio se cotiza en dólares.
 *
 *  Uso: <script src="js/version-modal.js"></script> antes de </body>.
 *  Sin dependencias.
 * ══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ── Configuración ─────────────────────────────────────────────────────────
    var APP_VERSION = 'V1.0.0 BETA';
    var LICENCIA    = 'ELY-EC01-ANL2-131945256';
    var MODAL_ID    = 'valtrix-system-info-modal';
    var TAG_CLASS   = 'vtx-version-tag';

    var ACCENT      = '#0077B6';   // --color-accent
    var PRIMARY     = '#060A13';   // --color-primary
    var SECONDARY   = '#4A5568';   // --color-text-secondary
    var HAIRLINE    = 'rgba(148, 163, 184, 0.35)';   // --color-border al 35 %

    // Claves de preferencia (localStorage). El sitio no usa cookies.
    var K_MOTION = 'vtx-pref-motion';   // '0' = animaciones de fondo apagadas
    var K_FAB    = 'vtx-pref-fab';      // '0' = botón flotante oculto

    var MONO = '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    var SANS = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // ── Preferencias ──────────────────────────────────────────────────────────
    function pref(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function setPref(key, value) {
        try { localStorage.setItem(key, value); } catch (e) {}
    }

    var motionOn = pref(K_MOTION) !== '0';
    var fabOn    = pref(K_FAB)    !== '0';

    // Se aplica al vuelo, sin esperar a DOMContentLoaded: el script va al final
    // del <body>, así que <html> ya existe y el fondo animado no llega a
    // encenderse un instante antes de apagarse.
    function applyPrefs() {
        var root = document.documentElement;
        root.classList.toggle('vtx-no-motion', !motionOn);
        root.classList.toggle('vtx-no-fab', !fabOn);
    }

    // ── Fecha de compilación ──────────────────────────────────────────────────
    function getBuildDate() {
        var d = new Date(document.lastModified);
        if (!isNaN(d.getTime()) && d.getFullYear() > 2000) {
            var yyyy = d.getFullYear();
            var mm   = String(d.getMonth() + 1).padStart(2, '0');
            var dd   = String(d.getDate()).padStart(2, '0');
            return dd + '-' + mm + '-' + yyyy;
        }
        return '26-08-2026';
    }

    // ── Estilos ───────────────────────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('vtx-sysinfo-styles')) return;

        var css = [
            /* ── Preferencia: animaciones de fondo ─────────────────────────── */
            'html.vtx-no-motion body::before,',
            'html.vtx-no-motion body::after{',
            '  animation:none !important; transform:none !important; opacity:.45 !important;',
            '}',
            'html.vtx-no-motion *,',
            'html.vtx-no-motion *::before,',
            'html.vtx-no-motion *::after{',
            '  animation-duration:.01ms !important; animation-iteration-count:1 !important;',
            '  transition-duration:.01ms !important;',
            '}',
            'html.vtx-no-motion{scroll-behavior:auto !important;}',

            /* ── Preferencia: botón flotante de contacto ───────────────────── */
            'html.vtx-no-fab .fab-wrapper,',
            'html.vtx-no-fab .floating-whatsapp{display:none !important;}',

            /* ── Etiqueta de versión en el pie ─────────────────────────────── */
            '.' + TAG_CLASS + '{',
            '  display:inline-flex; align-items:center; gap:.45em;',
            '  align-self:flex-start; margin-left:.9rem; vertical-align:middle;',
            '  padding:3px 10px; border-radius:9999px;',
            '  border:1px solid rgba(148, 163, 184, .55);',
            '  background:rgba(255, 255, 255, .5);',
            '  font-family:' + MONO + '; font-size:.62rem; letter-spacing:.08em;',
            '  color:' + SECONDARY + '; cursor:pointer; text-decoration:none;',
            '  transition:border-color .2s ease, color .2s ease, background .2s ease;',
            '}',
            '.' + TAG_CLASS + ':hover,',
            '.' + TAG_CLASS + ':focus-visible{',
            '  border-color:' + ACCENT + '; color:' + ACCENT + ';',
            '  background:rgba(255, 255, 255, .9); outline:none;',
            '}',
            '.' + TAG_CLASS + '::before{',
            '  content:""; width:5px; height:5px; border-radius:50%;',
            '  background:' + ACCENT + '; flex-shrink:0;',
            '}',

            /* ── Fondo del modal ──────────────────────────────────────────── */
            '#' + MODAL_ID + '{',
            '  position:fixed; inset:0; z-index:99999;',
            '  background:rgba(6, 10, 19, .45);',
            '  backdrop-filter:blur(10px) saturate(140%);',
            '  -webkit-backdrop-filter:blur(10px) saturate(140%);',
            '  display:flex; align-items:center; justify-content:center; padding:16px;',
            '  opacity:0; pointer-events:none; transition:opacity .25s ease;',
            '}',
            '#' + MODAL_ID + '.vtx-open{opacity:1; pointer-events:auto;}',

            /* ── Tarjeta de vidrio (mismo patrón que .glass-panel) ─────────── */
            '.vtx-sysinfo-card{ outline:none;',
            '  position:relative; width:100%; max-width:420px; max-height:88vh;',
            '  display:flex; flex-direction:column; overflow:hidden;',
            '  border-radius:14px;',
            '  background:linear-gradient(155deg, rgba(255,255,255,.94), rgba(234,239,245,.86));',
            '  backdrop-filter:blur(40px) saturate(180%);',
            '  -webkit-backdrop-filter:blur(40px) saturate(180%);',
            '  border:1px solid rgba(255, 255, 255, .75);',
            '  box-shadow:inset 0 1px 1px rgba(255,255,255,.9), 0 24px 60px rgba(6,10,19,.3);',
            '  color:' + PRIMARY + '; font-family:' + SANS + ';',
            '  transform:translateY(18px) scale(.97);',
            '  transition:transform .28s cubic-bezier(.34,1.56,.64,1);',
            '}',
            '#' + MODAL_ID + '.vtx-open .vtx-sysinfo-card{transform:translateY(0) scale(1);}',

            /* ── Cerrar ───────────────────────────────────────────────────── */
            '.vtx-close-btn{',
            '  position:absolute; top:14px; right:14px; z-index:2;',
            '  width:26px; height:26px; border-radius:50%;',
            '  display:flex; align-items:center; justify-content:center;',
            '  border:1px solid rgba(148, 163, 184, .45);',
            '  background:rgba(255, 255, 255, .65); color:' + SECONDARY + ';',
            '  font-size:.72rem; line-height:1; cursor:pointer;',
            '  transition:background .18s ease, color .18s ease, border-color .18s ease;',
            '}',
            '.vtx-close-btn:hover{background:#fff; color:' + PRIMARY + '; border-color:' + ACCENT + ';}',

            /* ── Cabecera ─────────────────────────────────────────────────── */
            '.vtx-sysinfo-head{',
            '  padding:30px 24px 16px; text-align:center;',
            '  border-bottom:1px solid ' + HAIRLINE + ';',
            '}',
            '.vtx-wordmark{',
            '  font-size:1.2rem; font-weight:800; letter-spacing:-.5px;',
            '  color:' + PRIMARY + '; line-height:1.1;',
            '}',
            '.vtx-wordmark span{color:' + ACCENT + ';}',
            '.vtx-subtitle{',
            '  margin-top:8px; font-size:.6rem; font-weight:700;',
            '  letter-spacing:.22em; text-transform:uppercase; color:' + ACCENT + ';',
            '}',

            /* ── Cuerpo ───────────────────────────────────────────────────── */
            '.vtx-sysinfo-body{flex:1; overflow-y:auto; padding:0 0 10px;}',
            '.vtx-sysinfo-body::-webkit-scrollbar{width:8px;}',
            '.vtx-sysinfo-body::-webkit-scrollbar-thumb{',
            '  background:rgba(148,163,184,.5); border-radius:8px;',
            '  border:2px solid transparent; background-clip:content-box;',
            '}',

            '.vtx-sec-label{',
            '  padding:20px 24px 8px; font-size:.58rem; font-weight:700;',
            '  letter-spacing:.2em; text-transform:uppercase; color:' + SECONDARY + ';',
            '}',

            '.vtx-group{',
            '  margin:0 18px; border-radius:10px; overflow:hidden;',
            '  background:rgba(255, 255, 255, .55);',
            '  border:1px solid ' + HAIRLINE + ';',
            '}',

            '.vtx-row{',
            '  display:flex; align-items:center; justify-content:space-between;',
            '  gap:14px; padding:11px 14px; font-size:.82rem;',
            '  border-top:1px solid ' + HAIRLINE + ';',
            '}',
            '.vtx-row:first-child{border-top:none;}',
            '.vtx-row-label{color:' + PRIMARY + '; flex-shrink:0;}',
            '.vtx-row-value{',
            '  display:flex; align-items:center; gap:8px;',
            '  color:' + SECONDARY + '; text-align:right; font-size:.8rem;',
            '}',
            '.vtx-mono{font-family:' + MONO + '; font-size:.74rem; letter-spacing:.02em;}',
            '.vtx-link-val{',
            '  color:' + ACCENT + '; text-decoration:none; font-size:.8rem;',
            '  transition:opacity .18s ease;',
            '}',
            '.vtx-link-val:hover{opacity:.65; text-decoration:underline;}',

            /* ── Botón Actualizar ─────────────────────────────────────────── */
            '.vtx-update-btn{',
            '  border:1px solid ' + ACCENT + '; color:' + ACCENT + '; background:transparent;',
            '  border-radius:6px; padding:3px 9px; cursor:pointer;',
            '  font-family:inherit; font-size:.6rem; font-weight:700;',
            '  letter-spacing:.08em; text-transform:uppercase;',
            '  transition:background .18s ease, color .18s ease;',
            '}',
            '.vtx-update-btn:hover{background:' + ACCENT + '; color:#fff;}',
            '.vtx-update-btn.busy{opacity:.45; pointer-events:none;}',

            /* ── Interruptor ──────────────────────────────────────────────── */
            '.vtx-switch{position:relative; display:inline-block; width:34px; height:18px; flex-shrink:0;}',
            '.vtx-switch input{opacity:0; width:0; height:0;}',
            '.vtx-slider{',
            '  position:absolute; inset:0; cursor:pointer; border-radius:20px;',
            '  background:rgba(148, 163, 184, .45);',
            '  border:1px solid rgba(148, 163, 184, .35);',
            '  transition:background .25s ease, border-color .25s ease;',
            '}',
            '.vtx-slider::before{',
            '  content:""; position:absolute; left:2px; bottom:2px;',
            '  width:12px; height:12px; border-radius:50%; background:#fff;',
            '  box-shadow:0 1px 2px rgba(6,10,19,.35);',
            '  transition:transform .25s ease;',
            '}',
            '.vtx-switch input:checked + .vtx-slider{',
            '  background:' + ACCENT + '; border-color:' + ACCENT + ';',
            '}',
            '.vtx-switch input:checked + .vtx-slider::before{transform:translateX(16px);}',
            '.vtx-switch input:focus-visible + .vtx-slider{outline:2px solid ' + ACCENT + '; outline-offset:2px;}',

            /* ── Pie del modal ────────────────────────────────────────────── */
            '.vtx-sysinfo-foot{',
            '  padding:20px 24px 20px; text-align:center;',
            '  border-top:1px solid ' + HAIRLINE + ';',
            '  font-size:.66rem; line-height:1.7; color:' + SECONDARY + ';',
            '}',
            '.vtx-sysinfo-foot a{color:' + ACCENT + '; text-decoration:none;}',
            '.vtx-sysinfo-foot a:hover{text-decoration:underline;}',

            /* ── Pantalla de actualización ────────────────────────────────── */
            '#vtx-update-loader{',
            '  position:fixed; inset:0; z-index:999999;',
            '  background:rgba(234, 239, 245, .97);',
            '  backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px);',
            '  display:flex; flex-direction:column; align-items:center; justify-content:center;',
            '  gap:34px; font-family:' + SANS + ';',
            '}',
            '.vtx-update-mark{font-size:1.5rem; font-weight:800; letter-spacing:-.5px; color:' + PRIMARY + ';}',
            '.vtx-update-mark span{color:' + ACCENT + ';}',
            '.vtx-update-ui{display:flex; flex-direction:column; align-items:center; gap:14px; width:240px;}',
            '.vtx-update-msg{',
            '  font-size:.62rem; font-weight:700; letter-spacing:.2em;',
            '  text-transform:uppercase; color:' + SECONDARY + ';',
            '}',
            '.vtx-update-bar{width:100%; height:2px; border-radius:4px; background:rgba(148,163,184,.3); overflow:hidden;}',
            '.vtx-update-fill{',
            '  width:0; height:100%; border-radius:4px; background:' + ACCENT + ';',
            '  animation:vtx-progress 1.5s cubic-bezier(.4,0,.2,1) forwards;',
            '}',
            '@keyframes vtx-progress{0%{width:0}40%{width:60%}80%{width:85%}100%{width:95%}}',

            /* ── Móvil ────────────────────────────────────────────────────── */
            '@media (max-width:480px){',
            '  .vtx-sysinfo-card{max-height:92vh;}',
            '  .vtx-row{font-size:.78rem; padding:10px 12px;}',
            '  .vtx-group{margin:0 12px;}',
            '  .vtx-sec-label{padding:18px 18px 8px;}',
            '  .' + TAG_CLASS + '{margin-left:0; margin-top:.75rem;}',
            '}'
        ].join('\n');

        var style = document.createElement('style');
        style.id = 'vtx-sysinfo-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ── Constructores de fila ─────────────────────────────────────────────────
    function row(label, value, mono) {
        return '<div class="vtx-row">'
             + '<span class="vtx-row-label">' + label + '</span>'
             + '<span class="vtx-row-value' + (mono ? ' vtx-mono' : '') + '">' + value + '</span>'
             + '</div>';
    }

    function linkRow(label, href, text, external) {
        var attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return '<div class="vtx-row">'
             + '<span class="vtx-row-label">' + label + '</span>'
             + '<a href="' + href + '" class="vtx-link-val"' + attrs + '>' + text + '</a>'
             + '</div>';
    }

    function switchRow(id, label, checked) {
        return '<div class="vtx-row">'
             + '<span class="vtx-row-label">' + label + '</span>'
             + '<span class="vtx-row-value">'
             +   '<label class="vtx-switch" title="' + label + '">'
             +     '<input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + '>'
             +     '<span class="vtx-slider"></span>'
             +   '</label>'
             + '</span>'
             + '</div>';
    }

    // ── Construcción del modal ────────────────────────────────────────────────
    function buildModal() {
        var modal = document.createElement('div');
        modal.id = MODAL_ID;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Información del sistema — VALTRIX Engineering');

        modal.innerHTML =
            '<div class="vtx-sysinfo-card" tabindex="-1">'

            + '<button class="vtx-close-btn" id="vtx-close-btn" aria-label="Cerrar">✕</button>'

            // Cabecera
            + '<div class="vtx-sysinfo-head">'
            +   '<div class="vtx-wordmark">VALTRIX <span>Engineering</span></div>'
            +   '<div class="vtx-subtitle">Información del sistema</div>'
            + '</div>'

            + '<div class="vtx-sysinfo-body">'

            // ── Especificaciones del software ──
            + '<div class="vtx-sec-label">Especificaciones del software</div>'
            + '<div class="vtx-group">'
            +   '<div class="vtx-row">'
            +     '<span class="vtx-row-label">Versión de la interfaz</span>'
            +     '<span class="vtx-row-value">'
            +       '<span class="vtx-mono">' + APP_VERSION + '</span>'
            +       '<button class="vtx-update-btn" id="vtx-update-btn">Actualizar</button>'
            +     '</span>'
            +   '</div>'
            +   row('Compilación', getBuildDate(), true)
            +   row('Licencia del producto', LICENCIA, true)
            + '</div>'

            // ── Ajustes del sistema ──
            + '<div class="vtx-sec-label">Ajustes del sistema</div>'
            + '<div class="vtx-group">'
            +   switchRow('vtx-setting-motion', 'Animaciones de fondo', motionOn)
            +   switchRow('vtx-setting-fab', 'Botón flotante de contacto', fabOn)
            +   row('Idioma de la interfaz', 'Español (Costa Rica)')
            +   row('Moneda de referencia', 'USD · aprox. en colones')
            + '</div>'

            // ── Seguridad y conformidad ──
            + '<div class="vtx-sec-label">Seguridad y conformidad</div>'
            + '<div class="vtx-group">'
            +   row('Protección de datos', 'Ley 8968 (CR) · RGPD (UE)')
            +   row('Infraestructura', 'HTTPS · HSTS · CSP N3')
            +   row('Cookies y rastreo', 'Ninguno')
            +   row('Formulario de contacto', 'Se envía desde su correo')
            +   linkRow('Política de privacidad', 'https://elysiumdr.eu/es/privacy', 'Ver documento', true)
            +   linkRow('Términos y condiciones', 'https://elysiumdr.eu/es/terms', 'Ver documento', true)
            + '</div>'

            // ── Información corporativa ──
            + '<div class="vtx-sec-label">Información corporativa</div>'
            + '<div class="vtx-group">'
            +   row('Firma', 'VALTRIX Engineering')
            +   linkRow('Responsable técnica', 'valeria-vargas.html', 'Valeria Vargas', false)
            +   linkRow('Correo', 'mailto:valeria.vargas@valtrix.com', 'valeria.vargas@valtrix.com', false)
            +   linkRow('WhatsApp', 'https://wa.me/50684880406', '+506 8488-0406', true)
            +   row('Cobertura', 'Costa Rica · visita incluida en la GAM')
            + '</div>'

            // ── Atribuciones ──
            + '<div class="vtx-sec-label">Atribuciones del software</div>'
            + '<div class="vtx-group">'
            +   row('Tipografías', 'Inter · Playfair Display')
            +   row('Entrega del servicio', 'Microsoft Power BI · Excel')
            +   row('Alojamiento', 'Cloudflare Workers')
            + '</div>'

            + '</div>'   // fin del cuerpo

            // Pie
            + '<div class="vtx-sysinfo-foot">'
            +   'Desarrollado por <a href="https://elysiumdr.eu" target="_blank" rel="noopener noreferrer">Elysium λ Development &amp; Research</a>.<br>'
            +   '© 2026 VALTRIX Engineering. Todos los derechos reservados.'
            + '</div>'

            + '</div>';  // fin de la tarjeta

        document.body.appendChild(modal);

        // ── Cierre ────────────────────────────────────────────────────────────
        modal.querySelector('#vtx-close-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('vtx-open')) closeModal();
        });

        // ── Actualizar ────────────────────────────────────────────────────────
        modal.querySelector('#vtx-update-btn').addEventListener('click', function () {
            window.valtrixForceUpdate();
        });

        // ── Ajustes ───────────────────────────────────────────────────────────
        var motionToggle = modal.querySelector('#vtx-setting-motion');
        motionToggle.addEventListener('change', function () {
            motionOn = motionToggle.checked;
            setPref(K_MOTION, motionOn ? '1' : '0');
            applyPrefs();
        });

        var fabToggle = modal.querySelector('#vtx-setting-fab');
        fabToggle.addEventListener('change', function () {
            fabOn = fabToggle.checked;
            setPref(K_FAB, fabOn ? '1' : '0');
            applyPrefs();
        });

        return modal;
    }

    // ── Abrir / cerrar ────────────────────────────────────────────────────────
    var lastFocused = null;

    function showModal() {
        var modal = document.getElementById(MODAL_ID) || buildModal();
        lastFocused = document.activeElement;
        document.body.style.overflow = 'hidden';

        // Un reflow forzado, y no requestAnimationFrame, para que la transición
        // arranque: rAF no se ejecuta mientras la pestaña está en segundo plano,
        // y el modal se quedaría invisible pero con el scroll bloqueado.
        void modal.offsetWidth;
        modal.classList.add('vtx-open');

        var card = modal.querySelector('.vtx-sysinfo-card');
        if (card) card.focus();
    }

    function closeModal() {
        var modal = document.getElementById(MODAL_ID);
        if (!modal) return;
        modal.classList.remove('vtx-open');
        document.body.style.overflow = '';
        if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    // ── Pantalla de actualización ─────────────────────────────────────────────
    function showUpdateLoader(message) {
        if (document.getElementById('vtx-update-loader')) return;
        var loader = document.createElement('div');
        loader.id = 'vtx-update-loader';
        loader.innerHTML =
            '<div class="vtx-update-mark">VALTRIX <span>Engineering</span></div>'
            + '<div class="vtx-update-ui">'
            +   '<div class="vtx-update-msg">' + message + '</div>'
            +   '<div class="vtx-update-bar"><div class="vtx-update-fill"></div></div>'
            + '</div>';
        document.body.appendChild(loader);
    }

    // ── Actualización en frío ─────────────────────────────────────────────────
    // Vacía cachés, almacenamiento y service workers y recarga sin caché. Las
    // dos preferencias del visitante se rescatan y se vuelven a escribir: no
    // son estado de la aplicación, son suyas.
    window.valtrixForceUpdate = async function () {
        var reload = function () {
            window.location.href = window.location.pathname + '?_t=' + Date.now();
        };
        var fallback = setTimeout(reload, 1800);

        var btn = document.getElementById('vtx-update-btn');
        if (btn) btn.classList.add('busy');
        showUpdateLoader('Actualizando el sistema');

        var keep = { motion: pref(K_MOTION), fab: pref(K_FAB) };

        try {
            // 1. Cookies (el sitio no pone ninguna; se limpian por si acaso)
            document.cookie.split(';').forEach(function (c) {
                var name = c.replace(/^ +/, '').split('=')[0];
                var exp  = 'expires=' + new Date(0).toUTCString();
                document.cookie = name + '=;' + exp + ';path=/';
                document.cookie = name + '=;' + exp + ';path=/;domain=' + window.location.hostname;
            });

            // 2. Almacenamiento local y de sesión
            try { localStorage.clear(); }   catch (_) {}
            try { sessionStorage.clear(); } catch (_) {}
            if (keep.motion !== null) setPref(K_MOTION, keep.motion);
            if (keep.fab    !== null) setPref(K_FAB,    keep.fab);

            // 3. Cache Storage
            if ('caches' in window) {
                try {
                    var names = await caches.keys();
                    await Promise.all(names.map(function (n) { return caches.delete(n); }));
                } catch (_) {}
            }

            // 4. Service workers
            if ('serviceWorker' in navigator) {
                try {
                    var regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map(function (r) { return r.unregister(); }));
                } catch (_) {}
            }

            clearTimeout(fallback);
            setTimeout(reload, 600);
        } catch (err) {
            clearTimeout(fallback);
            reload();
        }
    };

    // ── Etiqueta de versión en el pie ─────────────────────────────────────────
    function injectVersionTag() {
        if (document.querySelector('.' + TAG_CLASS)) return;

        // Junto al «VALTRIX Engineering © 2026», que es donde el visitante ya
        // está leyendo datos del sitio; si el pie cambiara de forma, cae al
        // contenedor de más arriba en vez de no aparecer.
        var group = document.querySelector('.footer-bottom .footer-bottom-group');
        var host  = (group && group.firstElementChild)
                 || document.querySelector('.footer-bottom')
                 || document.querySelector('footer');
        if (!host) return;

        var tag = document.createElement('span');
        tag.className = TAG_CLASS;
        tag.textContent = APP_VERSION.toLowerCase();
        tag.title = 'Ver información del sistema';
        tag.setAttribute('role', 'button');
        tag.setAttribute('tabindex', '0');

        tag.addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation(); showModal();
        });
        tag.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showModal(); }
        });

        host.appendChild(tag);
    }

    // ── Arranque ──────────────────────────────────────────────────────────────
    applyPrefs();
    injectStyles();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectVersionTag);
    } else {
        injectVersionTag();
    }
})();
