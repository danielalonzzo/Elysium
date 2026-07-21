/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  F05 · INFORMATION SYSTEM  +  F06 · SYSTEM UPDATE
 *  Elysium λ Development & Research
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  F05 — Etiqueta de versión inyectada en el footer que despliega el modal de
 *  información del sistema: versión y build, licencia de producto, marco legal
 *  y de seguridad, estado de la infraestructura conectada (red y latencia
 *  medidas contra `healthEndpoint`), información corporativa y atribuciones de
 *  software.
 *
 *  La versión se resuelve SIEMPRE desde `<meta name="app-version">`. Es el
 *  único punto de verdad del proyecto: este archivo no declara constantes de
 *  versión y no debe hacerlo ningún otro JS.
 *
 *  F06 — Pipeline de hard reset disparado desde el botón «Actualizar» del modal
 *  o al cerrar sesión: purga cookies, localStorage, sessionStorage, IndexedDB
 *  (borrado awaited), Cache Storage y Service Workers, y recarga con
 *  cache-buster. Un temporizador de seguridad de 1,8 s garantiza la recarga
 *  aunque el navegador bloquee alguna promesa. El flag `sys_action` sobrevive
 *  en `sessionStorage` para que F01 informe de la acción tras la recarga.
 *
 *  Configuración   window.ELYSIUM_SYSTEM  +  <meta name="app-version">
 *  API pública     ElysiumSystem.show() · window.elysiumForceUpdate(isLogout)
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    /**
     * @typedef  {Object} ElysiumSystemConfig
     * @property {string}  [stage]          Etiqueta de estado ('Beta'); vacío = estable.
     * @property {string}  [license]        Código de licencia de producto.
     * @property {string}  [brandName]      Nombre de marca en la cabecera del modal.
     * @property {string}  [accent]         Color de acento (hex).
     * @property {string}  [theme]          'light' | 'dark'. Apariencia del modal.
     * @property {string}  [logoSvg]        SVG inline del logotipo.
     * @property {string}  [locale]         'pt' | 'es' | 'en'. Defecto: <html lang>.
     * @property {Object}  [legal]          { terms, privacy } — rutas reales, nunca '#'.
     * @property {string}  [healthEndpoint] Recurso sondeado para medir red y latencia.
     * @property {Object}  [org]            Bloque de información corporativa.
     * @property {Object}  [compliance]     Directiva de privacidad, infraestructura, marco legal.
     * @property {Array}   [attributions]   [{ label, value }] de software de terceros.
     * @property {Object}  [developer]      { name, url } del proveedor.
     * @property {string}  [copyright]      Línea de copyright del pie del modal.
     * @property {string}  [mountSelector]  Selector donde se inyecta la etiqueta de versión.
     */

    var cfg = window.ELYSIUM_SYSTEM || {};

    var MODAL_ID   = 'ely-system-info';
    var LOADER_ID  = 'ely-system-loader';
    var STYLE_ID   = 'ely-system-styles';
    var TAG_CLASS  = 'ely-version-tag';

    var ACCENT = cfg.accent || '#2997ff';
    var IS_DARK = cfg.theme === 'dark';

    // Paleta derivada del tema declarado por el proyecto.
    var C = IS_DARK
        ? { surface: '#18181A', card: '#202024', text: '#F5F5F7', dim: '#A1A1A6',
            line: 'rgba(255,255,255,.10)', veil: 'rgba(11,11,11,.55)' }
        : { surface: '#FFFFFF', card: '#FAFAFA', text: '#1D1D1F', dim: '#6E6E73',
            line: 'rgba(0,0,0,.09)',        veil: 'rgba(29,29,31,.55)' };

    // ── i18n ────────────────────────────────────────────────────────────────
    var I18N = {
        pt: {
            subtitle: 'INFORMAÇÃO DO SISTEMA', close: 'Fechar', update: 'Atualizar',
            secSoftware: 'Especificações de Software', version: 'Versão da Interface',
            build: 'Compilação (Build)', license: 'Licença do Produto',
            secSecurity: 'Segurança e Conformidade', privDir: 'Diretiva de Privacidade',
            infra: 'Infraestrutura de Segurança', legal: 'Enquadramento Legal',
            terms: 'Termos e Condições', privacy: 'Política de Privacidade', viewDoc: 'Ver documento',
            secStatus: 'Estado da Infraestrutura', network: 'Ligação de Rede', latency: 'Latência',
            checking: 'A verificar…', online: 'Operacional', offline: 'Sem ligação',
            secCorp: 'Informação Corporativa', secAttrib: 'Atribuições de Software',
            devBy: 'Desenvolvido por', updating: 'A atualizar…', signingOut: 'A terminar sessão…'
        },
        es: {
            subtitle: 'INFORMACIÓN DEL SISTEMA', close: 'Cerrar', update: 'Actualizar',
            secSoftware: 'Especificaciones de Software', version: 'Versión de la Interfaz',
            build: 'Compilación (Build)', license: 'Licencia del Producto',
            secSecurity: 'Seguridad y Cumplimiento', privDir: 'Directiva de Privacidad',
            infra: 'Infraestructura de Seguridad', legal: 'Marco Legal',
            terms: 'Términos y Condiciones', privacy: 'Política de Privacidad', viewDoc: 'Ver documento',
            secStatus: 'Estado de la Infraestructura', network: 'Conexión de Red', latency: 'Latencia',
            checking: 'Verificando…', online: 'Operativo', offline: 'Sin conexión',
            secCorp: 'Información Corporativa', secAttrib: 'Atribuciones de Software',
            devBy: 'Desarrollado por', updating: 'Actualizando…', signingOut: 'Cerrando sesión…'
        },
        en: {
            subtitle: 'SYSTEM INFORMATION', close: 'Close', update: 'Update',
            secSoftware: 'Software Specifications', version: 'Interface Version',
            build: 'Build Compilation', license: 'Product License',
            secSecurity: 'Security & Compliance', privDir: 'Privacy Directive',
            infra: 'Security Infrastructure', legal: 'Legal Framework',
            terms: 'Terms & Conditions', privacy: 'Privacy Policy', viewDoc: 'View document',
            secStatus: 'Infrastructure Status', network: 'Network Connection', latency: 'Latency',
            checking: 'Checking…', online: 'Operational', offline: 'Offline',
            secCorp: 'Corporate Information', secAttrib: 'Software Attributions',
            devBy: 'Developed by', updating: 'Updating…', signingOut: 'Signing out…'
        }
    };

    /**
     * Resuelve el diccionario de textos según el idioma de la página.
     * @returns {Object}
     */
    function dict() {
        var raw = cfg.locale || document.documentElement.getAttribute('lang') || 'en';
        var base = String(raw).toLowerCase().split('-')[0];
        return I18N[base] || I18N.en;
    }

    var t = dict();

    // ── Versión: punto único de verdad ──────────────────────────────────────

    /**
     * Lee la versión del proyecto desde `<meta name="app-version">`.
     * Nunca se declara una constante de versión en JavaScript.
     * @returns {string} Versión completa, p. ej. 'v1.4.2-build.89'.
     */
    function readVersion() {
        var meta = document.querySelector('meta[name="app-version"]');
        var value = meta && meta.getAttribute('content');
        if (!value) {
            console.warn('[Elysium F05] Falta <meta name="app-version">; la versión es desconocida.');
            return '—';
        }
        return value.trim();
    }

    /**
     * Separa la versión pública del identificador de compilación.
     * @param {string} full
     * @returns {{version: string, build: string}}
     */
    function splitVersion(full) {
        var parts = String(full).split('-build.');
        return {
            version: parts[0] || full,
            build: parts.length > 1 ? parts[1] : buildDateFallback()
        };
    }

    /**
     * Compilación derivada de la última modificación del documento cuando la
     * versión no declara `-build.N`.
     * @returns {string} 'AAAA-MM'
     */
    function buildDateFallback() {
        var d = new Date(document.lastModified);
        if (!isNaN(d.getTime()) && d.getFullYear() > 2000) {
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        }
        return '—';
    }

    // ── Estilos ─────────────────────────────────────────────────────────────

    /**
     * Inyecta la hoja de estilo del componente.
     * @returns {void}
     */
    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        var css = [
            '.' + TAG_CLASS + '{',
            '  display:inline-flex;align-items:center;gap:6px;padding:4px 12px;',
            '  font-size:.68rem;font-family:"SF Mono",Menlo,Consolas,monospace;',
            '  color:currentColor;opacity:.55;background:transparent;',
            '  border:1px solid currentColor;border-radius:999px;',
            '  cursor:pointer;text-decoration:none;letter-spacing:.06em;',
            '  transition:opacity .2s ease,color .2s ease;',
            '}',
            '.' + TAG_CLASS + ':hover,.' + TAG_CLASS + ':focus-visible{',
            '  opacity:1;color:' + ACCENT + ';outline:none;',
            '}',

            '#' + MODAL_ID + '{',
            '  position:fixed;inset:0;z-index:99999;display:flex;',
            '  align-items:center;justify-content:center;padding:16px;',
            '  background:' + C.veil + ';',
            '  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);',
            '  opacity:0;pointer-events:none;transition:opacity .25s ease;',
            '}',
            '#' + MODAL_ID + '.is-open{opacity:1;pointer-events:auto;}',

            '.ely-sys-card{',
            '  position:relative;width:100%;max-width:420px;',
            '  background:' + C.surface + ';color:' + C.text + ';',
            '  border:1px solid ' + C.line + ';border-radius:20px;overflow:hidden;',
            '  box-shadow:0 24px 70px -30px rgba(0,0,0,.6);',
            '  display:flex;flex-direction:column;',
            '  font-family:inherit;',
            '  transform:translateY(18px) scale(.97);',
            '  transition:transform .28s cubic-bezier(.34,1.56,.64,1);',
            '}',
            '#' + MODAL_ID + '.is-open .ely-sys-card{transform:none;}',

            '.ely-sys-close{',
            '  position:absolute;top:14px;right:14px;z-index:2;',
            '  width:28px;height:28px;border-radius:50%;line-height:1;',
            '  border:1px solid ' + C.line + ';background:' + C.card + ';color:' + C.dim + ';',
            '  cursor:pointer;font-size:.72rem;display:flex;',
            '  align-items:center;justify-content:center;transition:all .2s;',
            '}',
            '.ely-sys-close:hover{background:' + ACCENT + ';color:#fff;border-color:' + ACCENT + ';}',

            '.ely-sys-head{padding:30px 24px 14px;text-align:center;}',
            '.ely-sys-mark{',
            '  width:46px;height:46px;border-radius:50%;margin:0 auto 12px;',
            '  background:' + C.card + ';color:' + ACCENT + ';border:1px solid ' + C.line + ';',
            '  display:flex;align-items:center;justify-content:center;',
            '}',
            '.ely-sys-mark svg{width:22px;height:22px;}',
            '.ely-sys-head h2{margin:0;font-size:1.4rem;font-weight:700;letter-spacing:.1em;}',
            '.ely-sys-sub{margin-top:5px;font-size:.62rem;font-weight:600;letter-spacing:.18em;color:' + ACCENT + ';}',

            '.ely-sys-body{padding:0 0 10px;overflow-y:auto;max-height:56vh;}',
            '.ely-sys-sec{padding:16px 26px 7px;font-size:.62rem;font-weight:700;',
            '  text-transform:uppercase;letter-spacing:.12em;color:' + C.dim + ';}',
            '.ely-sys-group{margin:0 18px;background:' + C.card + ';',
            '  border:1px solid ' + C.line + ';border-radius:14px;overflow:hidden;}',
            '.ely-sys-row{display:flex;justify-content:space-between;align-items:center;gap:14px;',
            '  padding:12px 16px;border-top:1px solid ' + C.line + ';font-size:.8rem;}',
            '.ely-sys-row:first-child{border-top:none;}',
            '.ely-sys-row > span:first-child{font-weight:600;flex-shrink:0;}',
            '.ely-sys-val{color:' + C.dim + ';text-align:right;min-width:0;overflow-wrap:anywhere;}',
            '.ely-sys-link{color:' + ACCENT + ';text-decoration:none;font-weight:500;',
            '  text-align:right;min-width:0;overflow-wrap:anywhere;}',
            '.ely-sys-link:hover{text-decoration:underline;}',

            '.ely-sys-badge{display:inline-block;margin-left:6px;padding:1px 8px;',
            '  background:' + ACCENT + ';color:#fff;border-radius:999px;',
            '  font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}',

            '.ely-sys-update{margin-left:8px;padding:3px 12px;border-radius:999px;',
            '  border:1px solid ' + ACCENT + ';color:' + ACCENT + ';background:transparent;',
            '  font:inherit;font-size:.68rem;font-weight:600;cursor:pointer;transition:all .2s;}',
            '.ely-sys-update:hover{background:' + ACCENT + ';color:#fff;}',

            '.ely-sys-dot{display:inline-block;width:7px;height:7px;border-radius:50%;',
            '  margin-right:7px;background:' + C.dim + ';vertical-align:middle;}',
            '.ely-sys-dot.is-online{background:#30D158;}',
            '.ely-sys-dot.is-offline{background:#FF453A;}',

            '.ely-sys-foot{padding:14px 26px 20px;text-align:center;font-size:.68rem;',
            '  line-height:1.7;color:' + C.dim + ';border-top:1px solid ' + C.line + ';}',
            '.ely-sys-foot a{color:' + ACCENT + ';text-decoration:none;font-weight:600;}',
            '.ely-sys-foot a:hover{text-decoration:underline;}',

            '#' + LOADER_ID + '{',
            '  position:fixed;inset:0;z-index:999999;display:flex;',
            '  flex-direction:column;align-items:center;justify-content:center;gap:28px;',
            '  background:' + (IS_DARK ? 'rgba(11,11,11,.98)' : 'rgba(29,29,31,.98)') + ';',
            '  backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);color:#fff;',
            '}',
            '.ely-sys-loader-mark{width:64px;height:64px;border-radius:50%;',
            '  display:flex;align-items:center;justify-content:center;color:' + ACCENT + ';',
            '  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);',
            '  animation:ely-sys-pulse 1.5s ease-in-out infinite;}',
            '.ely-sys-loader-mark svg{width:28px;height:28px;}',
            '.ely-sys-loader-ui{display:flex;flex-direction:column;align-items:center;gap:12px;width:240px;}',
            '.ely-sys-loader-msg{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;font-weight:600;}',
            '.ely-sys-loader-bar{width:100%;height:2px;border-radius:2px;overflow:hidden;background:rgba(255,255,255,.12);}',
            '.ely-sys-loader-fill{height:100%;width:0;background:' + ACCENT + ';border-radius:2px;',
            '  animation:ely-sys-progress 1.5s cubic-bezier(.4,0,.2,1) forwards;}',
            '@keyframes ely-sys-progress{0%{width:0;}40%{width:60%;}80%{width:85%;}100%{width:95%;}}',
            '@keyframes ely-sys-pulse{0%,100%{opacity:.6;transform:scale(.95);}50%{opacity:1;transform:scale(1.05);}}',

            '@media (prefers-reduced-motion: reduce){',
            '  #' + MODAL_ID + ',.ely-sys-card{transition:none;}',
            '  .ely-sys-loader-mark{animation:none;}',
            '  .ely-sys-loader-fill{animation:none;width:95%;}',
            '}'
        ].join('\n');

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ── Utilidades de plantilla ─────────────────────────────────────────────

    /**
     * Escapa texto para inserción segura en HTML.
     * @param {*} value
     * @returns {string}
     */
    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    /**
     * Fila etiqueta / valor.
     * @param {string} label
     * @param {string} value  HTML ya escapado o seguro.
     * @param {string} [id]
     * @returns {string}
     */
    function row(label, value, id) {
        return '<div class="ely-sys-row"><span>' + esc(label) + '</span>'
             + '<span class="ely-sys-val"' + (id ? ' id="' + id + '"' : '') + '>' + value + '</span></div>';
    }

    /**
     * Fila etiqueta / enlace.
     * @param {string} label
     * @param {string} href
     * @param {string} text
     * @param {boolean} [external]
     * @returns {string}
     */
    function linkRow(label, href, text, external) {
        var attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return '<div class="ely-sys-row"><span>' + esc(label) + '</span>'
             + '<a class="ely-sys-link" href="' + esc(href) + '"' + attrs + '>' + esc(text) + '</a></div>';
    }

    // ── Modal ───────────────────────────────────────────────────────────────

    /**
     * Construye el modal de información del sistema y lo inserta en el DOM.
     * @returns {HTMLElement}
     */
    function buildModal() {
        var v = splitVersion(readVersion());
        var legal = cfg.legal || {};
        var org = cfg.org || {};
        var comp = cfg.compliance || {};
        var dev = cfg.developer || { name: 'Elysium λ Development & Research', url: 'https://elysiumdr.eu' };
        var badge = cfg.stage ? '<span class="ely-sys-badge">' + esc(cfg.stage) + '</span>' : '';

        var html = ['<div class="ely-sys-card" role="document">',
            '<button class="ely-sys-close" type="button" aria-label="' + esc(t.close) + '">&#10005;</button>',
            '<div class="ely-sys-head">',
            cfg.logoSvg ? '<div class="ely-sys-mark">' + cfg.logoSvg + '</div>' : '',
            '<h2>' + esc(cfg.brandName || '') + '</h2>',
            '<div class="ely-sys-sub">' + esc(t.subtitle) + '</div>',
            '</div>',
            '<div class="ely-sys-body">',

            // 1 · Especificaciones de software
            '<div class="ely-sys-sec">' + esc(t.secSoftware) + '</div>',
            '<div class="ely-sys-group">',
            '<div class="ely-sys-row"><span>' + esc(t.version) + '</span>',
            '<span class="ely-sys-val">' + esc(v.version) + badge,
            '<button class="ely-sys-update" type="button">' + esc(t.update) + '</button>',
            '</span></div>',
            row(t.build, esc(v.build)),
            cfg.license ? row(t.license, esc(cfg.license)) : '',
            '</div>',

            // 2 · Seguridad y cumplimiento
            '<div class="ely-sys-sec">' + esc(t.secSecurity) + '</div>',
            '<div class="ely-sys-group">',
            comp.privacyDirective ? row(t.privDir, esc(comp.privacyDirective)) : '',
            comp.infrastructure ? row(t.infra, esc(comp.infrastructure)) : '',
            comp.legalFramework ? row(t.legal, esc(comp.legalFramework)) : '',
            legal.terms ? linkRow(t.terms, legal.terms, t.viewDoc) : '',
            legal.privacy ? linkRow(t.privacy, legal.privacy, t.viewDoc) : '',
            '</div>',

            // 3 · Estado de la infraestructura conectada
            '<div class="ely-sys-sec">' + esc(t.secStatus) + '</div>',
            '<div class="ely-sys-group">',
            row(t.network, '<span class="ely-sys-dot" id="ely-sys-dot"></span><span id="ely-sys-net">'
                + esc(t.checking) + '</span>'),
            row(t.latency, '<span id="ely-sys-lat">' + esc(t.checking) + '</span>'),
            '</div>',

            // 4 · Información corporativa
            '<div class="ely-sys-sec">' + esc(t.secCorp) + '</div>',
            '<div class="ely-sys-group">',
            (org.rows || []).map(function (r) {
                return r.href
                    ? linkRow(r.label, r.href, r.value, /^https?:/.test(r.href))
                    : row(r.label, esc(r.value));
            }).join(''),
            '</div>',

            // 5 · Atribuciones de software
            '<div class="ely-sys-sec">' + esc(t.secAttrib) + '</div>',
            '<div class="ely-sys-group">',
            (cfg.attributions || []).map(function (a) { return row(a.label, esc(a.value)); }).join(''),
            '</div>',

            '</div>',
            '<div class="ely-sys-foot">',
            esc(t.devBy) + ' <a href="' + esc(dev.url) + '" target="_blank" rel="noopener noreferrer">'
                + esc(dev.name) + '</a>.<br>' + esc(cfg.copyright || ''),
            '</div>',
            '</div>'].join('');

        var modal = document.createElement('div');
        modal.id = MODAL_ID;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', t.subtitle);
        modal.innerHTML = html;
        document.body.appendChild(modal);

        modal.querySelector('.ely-sys-close').addEventListener('click', close);
        modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
        });
        modal.querySelector('.ely-sys-update').addEventListener('click', function () {
            window.elysiumForceUpdate(false);
        });

        return modal;
    }

    /** Cierra el modal y devuelve el foco a la etiqueta de versión. */
    function close() {
        var modal = document.getElementById(MODAL_ID);
        if (!modal) return;
        modal.classList.remove('is-open');
        var tag = document.querySelector('.' + TAG_CLASS);
        if (tag) tag.focus();
    }

    /**
     * Abre el modal y lanza la sonda de estado de infraestructura.
     * @returns {void}
     */
    function show() {
        var modal = document.getElementById(MODAL_ID) || buildModal();
        modal.classList.add('is-open');
        modal.querySelector('.ely-sys-close').focus();
        probeHealth();
    }

    /**
     * Mide disponibilidad y latencia contra `healthEndpoint` y actualiza el
     * bloque de estado. Sin endpoint configurado, refleja `navigator.onLine`.
     * @returns {void}
     */
    function probeHealth() {
        var dot = document.getElementById('ely-sys-dot');
        var net = document.getElementById('ely-sys-net');
        var lat = document.getElementById('ely-sys-lat');
        if (!dot || !net || !lat) return;

        /**
         * @param {boolean} online
         * @param {number|null} ms
         */
        var render = function (online, ms) {
            dot.className = 'ely-sys-dot ' + (online ? 'is-online' : 'is-offline');
            net.textContent = online ? t.online : t.offline;
            lat.textContent = online && ms != null ? Math.round(ms) + ' ms' : '—';
        };

        if (!cfg.healthEndpoint || typeof window.fetch !== 'function') {
            render(navigator.onLine !== false, null);
            return;
        }

        var startedAt = (window.performance && performance.now()) || Date.now();
        var url = cfg.healthEndpoint + (cfg.healthEndpoint.indexOf('?') > -1 ? '&' : '?')
                + '_hc=' + Date.now();

        window.fetch(url, { method: 'GET', cache: 'no-store' })
            .then(function (res) {
                var now = (window.performance && performance.now()) || Date.now();
                render(res.ok, now - startedAt);
            })
            .catch(function () { render(false, null); });
    }

    // ── F06 · System Update ─────────────────────────────────────────────────

    /**
     * Muestra el ecrã de carga del sistema durante el hard reset.
     * @param {string} message
     * @returns {void}
     */
    function showLoader(message) {
        if (document.getElementById(LOADER_ID)) return;
        injectStyles();

        var loader = document.createElement('div');
        loader.id = LOADER_ID;
        loader.setAttribute('role', 'status');
        loader.setAttribute('aria-live', 'polite');
        loader.innerHTML =
            (cfg.logoSvg ? '<div class="ely-sys-loader-mark">' + cfg.logoSvg + '</div>' : '')
            + '<div class="ely-sys-loader-ui">'
            + '<div class="ely-sys-loader-msg">' + esc(message) + '</div>'
            + '<div class="ely-sys-loader-bar"><div class="ely-sys-loader-fill"></div></div>'
            + '</div>';
        document.body.appendChild(loader);
    }

    /**
     * Recarga sin caché ni proxy intermedio.
     * @returns {void}
     */
    function cleanReload() {
        window.location.href = window.location.pathname + '?_t=' + Date.now();
    }

    /**
     * F06 · Hard reset completo del cliente y recarga con cache-buster.
     * Purga cookies, storages, IndexedDB, Cache Storage y Service Workers.
     * Deja `sys_action` en `sessionStorage` para que F01 anuncie la acción.
     *
     * @param {boolean} isLogout `true` cierra sesión, `false` actualiza.
     * @returns {Promise<void>}
     */
    window.elysiumForceUpdate = async function (isLogout) {
        showLoader(isLogout ? t.signingOut : t.updating);

        // Seguridad: la recarga ocurre a los 1,8 s pase lo que pase.
        var fallback = window.setTimeout(cleanReload, 1800);

        try {
            // A · Cookies — expiradas en la raíz y en el dominio actual
            document.cookie.split(';').forEach(function (cookie) {
                var eq = cookie.indexOf('=');
                var name = (eq > -1 ? cookie.substr(0, eq) : cookie).trim();
                if (!name) return;
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain='
                                + window.location.hostname;
            });

            // B · Storages — el flag sobrevive a la recarga en esta pestaña
            try { window.localStorage.clear(); } catch (_) {}
            try {
                window.sessionStorage.clear();
                window.sessionStorage.setItem('sys_action', isLogout ? 'logout' : 'update');
            } catch (_) {}

            // C · IndexedDB — borrado awaited, incluidas las bases de Firebase
            if (window.indexedDB && typeof window.indexedDB.databases === 'function') {
                var dbs = await window.indexedDB.databases();
                await Promise.all(dbs.map(function (db) {
                    if (!db || !db.name) return Promise.resolve();
                    return new Promise(function (resolve) {
                        var req = window.indexedDB.deleteDatabase(db.name);
                        req.onsuccess = req.onerror = req.onblocked = resolve;
                    });
                }));
            }

            // D · Cache Storage — assets antiguos de la PWA
            if ('caches' in window) {
                var names = await caches.keys();
                await Promise.all(names.map(function (n) { return caches.delete(n); }));
            }

            // E · Service Workers
            if ('serviceWorker' in navigator) {
                var regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(function (r) { return r.unregister(); }));
            }

            window.clearTimeout(fallback);
            window.setTimeout(cleanReload, 600);   // deja ver la barra de progreso
        } catch (_) {
            cleanReload();
        }
    };

    // ── Etiqueta de versión en el footer ────────────────────────────────────

    /**
     * Inyecta la etiqueta de versión clicable en el footer.
     * @returns {void}
     */
    function injectVersionTag() {
        if (document.querySelector('.' + TAG_CLASS)) return;

        var host = (cfg.mountSelector && document.querySelector(cfg.mountSelector))
                || document.querySelector('.footer-bottom-inner')
                || document.querySelector('.footer-bottom')
                || document.querySelector('footer');
        if (!host) return;

        var v = splitVersion(readVersion());
        var tag = document.createElement('button');
        tag.type = 'button';
        tag.className = TAG_CLASS;
        tag.textContent = v.version + (cfg.stage ? ' ' + cfg.stage : '');
        tag.setAttribute('aria-haspopup', 'dialog');
        tag.addEventListener('click', show);

        host.appendChild(tag);
    }

    /** Arranque del componente. */
    function init() {
        injectStyles();
        injectVersionTag();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /** @namespace ElysiumSystem */
    window.ElysiumSystem = {
        /** Abre el modal de información del sistema. */
        show: show,
        /** Cierra el modal. */
        close: close,
        /** Muestra el ecrã de carga del sistema con un mensaje arbitrario. */
        showLoader: showLoader,
        /** Devuelve la versión declarada en `<meta name="app-version">`. */
        version: readVersion
    };

})(window, document);
