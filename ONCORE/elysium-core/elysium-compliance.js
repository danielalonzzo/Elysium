/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  F08 · COOKIES MANAGEMENT — Elysium λ Development & Research
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Banner de primera visita más gestor granular de preferencias con registro
 *  versionado y con timestamp ISO (prueba de consentimiento explícito, Art. 7
 *  RGPD y Art. 5 Ley 8968), re-solicitud automática al cambiar la versión de
 *  la política, gating real de scripts de terceros y API de derechos:
 *  revocación desde el footer y purga local de datos (derecho de supresión,
 *  reutiliza el pipeline de F06).
 *
 *  Gating: los scripts de terceros se declaran inertes y solo se activan tras
 *  el opt-in de su categoría.
 *
 *      <script type="text/plain" data-consent="analytics"
 *              data-src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
 *
 *  Configuración   window.ELYSIUM_CONSENT
 *  API pública     ElysiumConsent.get() · .isGranted(cat) · .onGranted(cat, fn)
 *                  .open() · .purgeLocalData()
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    /**
     * @typedef  {Object} ElysiumConsentConfig
     * @property {string}   [policyVersion] Versión de la política. Al cambiar, se re-solicita.
     * @property {string}   [storageKey]    Clave de `localStorage` del registro.
     * @property {string}   [accent]        Color de acento (hex).
     * @property {string}   [theme]         'light' | 'dark'.
     * @property {string}   [locale]        'pt' | 'es' | 'en'. Defecto: <html lang>.
     * @property {Array}    [categories]    [{ id, required }] además de 'necessary'.
     * @property {Object}   [links]         { privacy, cookies } — rutas reales, nunca '#'.
     */

    var cfg = window.ELYSIUM_CONSENT || {};

    var STORAGE_KEY    = cfg.storageKey || 'elysium_consent';
    var POLICY_VERSION = cfg.policyVersion || '1.0';
    var ACCENT         = cfg.accent || '#2997ff';
    var IS_DARK        = cfg.theme === 'dark';

    var BANNER_ID = 'ely-consent-banner';
    var PANEL_ID  = 'ely-consent-panel';
    var STYLE_ID  = 'ely-consent-styles';

    var C = IS_DARK
        ? { surface: '#18181A', card: '#202024', text: '#F5F5F7', dim: '#A1A1A6',
            line: 'rgba(255,255,255,.10)', veil: 'rgba(11,11,11,.55)', track: 'rgba(255,255,255,.18)' }
        : { surface: '#FFFFFF', card: '#FAFAFA', text: '#1D1D1F', dim: '#6E6E73',
            line: 'rgba(0,0,0,.09)',        veil: 'rgba(29,29,31,.55)', track: 'rgba(0,0,0,.16)' };

    /** Categorías gestionadas. 'necessary' siempre presente y no revocable. */
    var CATEGORIES = [{ id: 'necessary', required: true }].concat(
        (cfg.categories || [{ id: 'analytics' }, { id: 'marketing' }])
            .filter(function (c) { return c && c.id && c.id !== 'necessary'; })
    );

    // ── i18n ────────────────────────────────────────────────────────────────
    var I18N = {
        pt: {
            bannerTitle: 'Valorizamos a sua privacidade',
            bannerText: 'Utilizamos cookies para garantir o funcionamento do site e, com a sua autorização, para analisar a utilização. Apenas as cookies estritamente necessárias estão ativas por defeito.',
            acceptAll: 'Aceitar todas', rejectAll: 'Rejeitar não essenciais', manage: 'Gerir preferências',
            panelTitle: 'Preferências de cookies',
            panelIntro: 'Escolha que categorias autoriza. Pode alterar esta decisão a qualquer momento a partir do rodapé.',
            save: 'Guardar preferências', close: 'Fechar', always: 'Sempre ativas',
            privacy: 'Política de Privacidade', cookies: 'Política de Cookies',
            purge: 'Apagar os meus dados neste dispositivo',
            recorded: 'Consentimento registado a', version: 'Versão da política',
            cat: {
                necessary: { name: 'Estritamente necessárias', desc: 'Indispensáveis para a navegação, a segurança e a memória das suas preferências. Não podem ser desativadas.' },
                analytics: { name: 'Análise de utilização', desc: 'Ajudam-nos a perceber como o site é usado, de forma agregada, para o melhorar.' },
                marketing: { name: 'Marketing', desc: 'Permitem medir campanhas e mostrar conteúdos relevantes fora deste site.' },
                functional: { name: 'Funcionalidades adicionais', desc: 'Ativam conteúdos incorporados e funcionalidades de conveniência.' }
            }
        },
        es: {
            bannerTitle: 'Valoramos su privacidad',
            bannerText: 'Utilizamos cookies para garantizar el funcionamiento del sitio y, con su autorización, para analizar su uso. Solo las estrictamente necesarias están activas por defecto.',
            acceptAll: 'Aceptar todas', rejectAll: 'Rechazar no esenciales', manage: 'Gestionar preferencias',
            panelTitle: 'Preferencias de cookies',
            panelIntro: 'Elija qué categorías autoriza. Puede cambiar esta decisión en cualquier momento desde el pie de página.',
            save: 'Guardar preferencias', close: 'Cerrar', always: 'Siempre activas',
            privacy: 'Política de Privacidad', cookies: 'Política de Cookies',
            purge: 'Borrar mis datos en este dispositivo',
            recorded: 'Consentimiento registrado el', version: 'Versión de la política',
            cat: {
                necessary: { name: 'Estrictamente necesarias', desc: 'Imprescindibles para la navegación, la seguridad y recordar sus preferencias. No se pueden desactivar.' },
                analytics: { name: 'Análisis de uso', desc: 'Nos ayudan a entender de forma agregada cómo se usa el sitio para mejorarlo.' },
                marketing: { name: 'Marketing', desc: 'Permiten medir campañas y mostrar contenidos relevantes fuera de este sitio.' },
                functional: { name: 'Funcionalidades adicionales', desc: 'Activan contenidos incrustados y funciones de conveniencia.' }
            }
        },
        en: {
            bannerTitle: 'We value your privacy',
            bannerText: 'We use cookies to keep the site working and, with your permission, to analyse how it is used. Only strictly necessary cookies are active by default.',
            acceptAll: 'Accept all', rejectAll: 'Reject non-essential', manage: 'Manage preferences',
            panelTitle: 'Cookie preferences',
            panelIntro: 'Choose which categories you allow. You can change this at any time from the footer.',
            save: 'Save preferences', close: 'Close', always: 'Always on',
            privacy: 'Privacy Policy', cookies: 'Cookie Policy',
            purge: 'Erase my data on this device',
            recorded: 'Consent recorded on', version: 'Policy version',
            cat: {
                necessary: { name: 'Strictly necessary', desc: 'Required for navigation, security and remembering your preferences. These cannot be switched off.' },
                analytics: { name: 'Usage analytics', desc: 'Help us understand, in aggregate, how the site is used so we can improve it.' },
                marketing: { name: 'Marketing', desc: 'Allow campaign measurement and relevant content outside this site.' },
                functional: { name: 'Additional features', desc: 'Enable embedded content and convenience features.' }
            }
        }
    };

    /**
     * Diccionario de textos según el idioma de la página.
     * @returns {Object}
     */
    function dict() {
        var raw = cfg.locale || document.documentElement.getAttribute('lang') || 'en';
        var base = String(raw).toLowerCase().split('-')[0];
        return I18N[base] || I18N.en;
    }

    var t = dict();

    // ── Registro de consentimiento ──────────────────────────────────────────

    /**
     * Lee el registro almacenado.
     * @returns {{version: string, timestamp: string, categories: Object}|null}
     */
    function readRecord() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            return (parsed && parsed.categories) ? parsed : null;
        } catch (_) {
            return null;
        }
    }

    /**
     * Persiste el registro con versión de política y timestamp ISO 8601.
     * Es la prueba de consentimiento explícito exigida por el Art. 7 RGPD y el
     * Art. 5 de la Ley 8968.
     *
     * @param {Object<string, boolean>} categories
     * @returns {void}
     */
    function writeRecord(categories) {
        var record = {
            version: POLICY_VERSION,
            timestamp: new Date().toISOString(),
            categories: categories
        };
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
        } catch (_) {
            /* almacenamiento no disponible: el banner se volverá a mostrar */
        }
        applyConsent(record);
        document.dispatchEvent(new CustomEvent('elysium:consent:change', { detail: record }));
    }

    /**
     * Determina si procede solicitar consentimiento: no hay registro, o la
     * versión de la política ha cambiado desde que se otorgó.
     * @returns {boolean}
     */
    function needsPrompt() {
        var record = readRecord();
        return !record || record.version !== POLICY_VERSION;
    }

    /**
     * Estado actual por categoría; las no decididas se consideran denegadas.
     * @returns {Object<string, boolean>}
     */
    function currentState() {
        var record = readRecord();
        var state = {};
        CATEGORIES.forEach(function (c) {
            state[c.id] = c.required ? true
                : !!(record && record.version === POLICY_VERSION && record.categories[c.id]);
        });
        return state;
    }

    /**
     * Construye un estado con todas las categorías en el mismo valor.
     * @param {boolean} value
     * @returns {Object<string, boolean>}
     */
    function allCategories(value) {
        var state = {};
        CATEGORIES.forEach(function (c) { state[c.id] = c.required ? true : value; });
        return state;
    }

    // ── Gating real de scripts de terceros ──────────────────────────────────

    /**
     * Activa los `<script type="text/plain" data-consent="…">` cuya categoría
     * haya sido autorizada, sustituyéndolos por scripts ejecutables. Los que no
     * tengan permiso permanecen inertes: nunca llegan a solicitarse.
     *
     * @param {{categories: Object<string, boolean>}} record
     * @returns {void}
     */
    function applyConsent(record) {
        var granted = record && record.categories ? record.categories : {};

        document.querySelectorAll('script[type="text/plain"][data-consent]').forEach(function (node) {
            var category = node.getAttribute('data-consent');
            if (!granted[category]) return;

            var script = document.createElement('script');
            for (var i = 0; i < node.attributes.length; i++) {
                var attr = node.attributes[i];
                if (attr.name === 'type' || attr.name === 'data-consent' || attr.name === 'data-src') continue;
                script.setAttribute(attr.name, attr.value);
            }
            var src = node.getAttribute('data-src');
            if (src) {
                script.src = src;
                script.async = true;
            } else {
                script.textContent = node.textContent;
            }
            node.parentNode.replaceChild(script, node);
        });

        Object.keys(listeners).forEach(function (category) {
            if (!granted[category]) return;
            listeners[category].splice(0).forEach(function (fn) {
                try { fn(); } catch (e) { console.error('[Elysium F08]', e); }
            });
        });
    }

    /** @type {Object<string, Function[]>} Callbacks en espera por categoría. */
    var listeners = {};

    // ── Estilos ─────────────────────────────────────────────────────────────

    /**
     * Inyecta la hoja de estilo del componente.
     * @returns {void}
     */
    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        var css = [
            '#' + BANNER_ID + '{',
            '  position:fixed;left:16px;right:16px;bottom:16px;z-index:99990;',
            '  max-width:520px;margin-inline:auto;padding:22px 24px;',
            '  background:' + C.surface + ';color:' + C.text + ';',
            '  border:1px solid ' + C.line + ';border-radius:18px;',
            '  box-shadow:0 24px 60px -28px rgba(0,0,0,.55);',
            '  font-size:.86rem;line-height:1.6;',
            '  transform:translateY(16px);opacity:0;transition:opacity .3s ease,transform .3s ease;',
            '}',
            '#' + BANNER_ID + '.is-open{opacity:1;transform:none;}',
            '#' + BANNER_ID + ' h2{margin:0 0 8px;font-size:1rem;font-weight:700;}',
            '#' + BANNER_ID + ' p{margin:0 0 16px;color:' + C.dim + ';font-size:.82rem;}',
            '#' + BANNER_ID + ' a{color:' + ACCENT + ';}',
            '.ely-consent-actions{display:flex;flex-wrap:wrap;gap:10px;}',

            '.ely-consent-btn{',
            '  flex:1 1 auto;padding:10px 16px;border-radius:999px;cursor:pointer;',
            '  font:inherit;font-size:.78rem;font-weight:600;transition:all .2s;',
            '  border:1px solid ' + C.line + ';background:transparent;color:' + C.text + ';',
            '}',
            '.ely-consent-btn:hover{border-color:' + ACCENT + ';color:' + ACCENT + ';}',
            '.ely-consent-btn.is-primary{background:' + ACCENT + ';border-color:' + ACCENT + ';color:#fff;}',
            '.ely-consent-btn.is-primary:hover{filter:brightness(1.08);color:#fff;}',
            '.ely-consent-btn.is-quiet{flex:1 1 100%;border:none;color:' + C.dim + ';text-decoration:underline;}',

            '#' + PANEL_ID + '{',
            '  position:fixed;inset:0;z-index:99995;display:flex;',
            '  align-items:center;justify-content:center;padding:16px;',
            '  background:' + C.veil + ';backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);',
            '  opacity:0;pointer-events:none;transition:opacity .25s ease;',
            '}',
            '#' + PANEL_ID + '.is-open{opacity:1;pointer-events:auto;}',
            '.ely-consent-card{',
            '  width:100%;max-width:480px;max-height:86vh;overflow:hidden;',
            '  display:flex;flex-direction:column;',
            '  background:' + C.surface + ';color:' + C.text + ';',
            '  border:1px solid ' + C.line + ';border-radius:20px;',
            '  box-shadow:0 24px 70px -30px rgba(0,0,0,.6);',
            '  transform:translateY(18px) scale(.97);transition:transform .28s cubic-bezier(.34,1.56,.64,1);',
            '}',
            '#' + PANEL_ID + '.is-open .ely-consent-card{transform:none;}',
            '.ely-consent-head{padding:24px 26px 12px;}',
            '.ely-consent-head h2{margin:0 0 6px;font-size:1.15rem;font-weight:700;}',
            '.ely-consent-head p{margin:0;font-size:.8rem;line-height:1.6;color:' + C.dim + ';}',
            '.ely-consent-body{padding:8px 18px;overflow-y:auto;}',
            '.ely-consent-item{',
            '  padding:14px 16px;margin-bottom:10px;border-radius:14px;',
            '  background:' + C.card + ';border:1px solid ' + C.line + ';',
            '}',
            '.ely-consent-item-top{display:flex;align-items:center;justify-content:space-between;gap:14px;}',
            '.ely-consent-item-name{font-size:.86rem;font-weight:600;}',
            '.ely-consent-item-desc{margin:6px 0 0;font-size:.76rem;line-height:1.55;color:' + C.dim + ';}',
            '.ely-consent-always{font-size:.68rem;font-weight:600;letter-spacing:.06em;',
            '  text-transform:uppercase;color:' + C.dim + ';white-space:nowrap;}',

            /* Interruptor accesible: el input real conserva foco y semántica */
            '.ely-consent-switch{position:relative;flex-shrink:0;width:44px;height:26px;}',
            '.ely-consent-switch input{position:absolute;inset:0;width:100%;height:100%;',
            '  margin:0;opacity:0;cursor:pointer;z-index:2;}',
            '.ely-consent-track{position:absolute;inset:0;border-radius:999px;',
            '  background:' + C.track + ';transition:background .2s ease;pointer-events:none;}',
            '.ely-consent-track::after{content:"";position:absolute;top:3px;left:3px;',
            '  width:20px;height:20px;border-radius:50%;background:#fff;',
            '  transition:transform .2s ease;box-shadow:0 1px 3px rgba(0,0,0,.3);}',
            '.ely-consent-switch input:checked ~ .ely-consent-track{background:' + ACCENT + ';}',
            '.ely-consent-switch input:checked ~ .ely-consent-track::after{transform:translateX(18px);}',
            '.ely-consent-switch input:focus-visible ~ .ely-consent-track{outline:2px solid ' + ACCENT + ';outline-offset:2px;}',
            '.ely-consent-switch input:disabled{cursor:not-allowed;}',

            '.ely-consent-foot{padding:14px 26px 22px;border-top:1px solid ' + C.line + ';}',
            '.ely-consent-meta{margin:0 0 12px;font-size:.68rem;line-height:1.6;color:' + C.dim + ';}',
            '.ely-consent-meta a{color:' + ACCENT + ';}',
            '.ely-consent-purge{background:none;border:none;padding:0;cursor:pointer;',
            '  font:inherit;font-size:.68rem;color:' + C.dim + ';text-decoration:underline;}',
            '.ely-consent-purge:hover{color:' + ACCENT + ';}',

            '@media (prefers-reduced-motion: reduce){',
            '  #' + BANNER_ID + ',#' + PANEL_ID + ',.ely-consent-card,',
            '  .ely-consent-track,.ely-consent-track::after{transition:none;}',
            '}'
        ].join('\n');

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ── Utilidades ──────────────────────────────────────────────────────────

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
     * Etiquetas de una categoría, con posibilidad de sobrescritura por config.
     * @param {{id: string, labels?: Object}} category
     * @returns {{name: string, desc: string}}
     */
    function labelsFor(category) {
        var override = category.labels && (category.labels[t === I18N.pt ? 'pt' : t === I18N.es ? 'es' : 'en']);
        if (override) return override;
        return t.cat[category.id] || { name: category.id, desc: '' };
    }

    /**
     * Enlaces legales disponibles, renderizados como lista separada por puntos.
     * @returns {string}
     */
    function legalLinks() {
        var links = cfg.links || {};
        var out = [];
        if (links.privacy) out.push('<a href="' + esc(links.privacy) + '">' + esc(t.privacy) + '</a>');
        if (links.cookies) out.push('<a href="' + esc(links.cookies) + '">' + esc(t.cookies) + '</a>');
        return out.join(' · ');
    }

    // ── Banner ──────────────────────────────────────────────────────────────

    /**
     * Construye y muestra el banner de primera visita.
     * @returns {void}
     */
    function showBanner() {
        if (document.getElementById(BANNER_ID)) return;

        var banner = document.createElement('aside');
        banner.id = BANNER_ID;
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-live', 'polite');
        banner.setAttribute('aria-label', t.bannerTitle);
        banner.innerHTML =
            '<h2>' + esc(t.bannerTitle) + '</h2>'
            + '<p>' + esc(t.bannerText) + ' ' + legalLinks() + '</p>'
            + '<div class="ely-consent-actions">'
            + '<button type="button" class="ely-consent-btn" data-act="reject">' + esc(t.rejectAll) + '</button>'
            + '<button type="button" class="ely-consent-btn is-primary" data-act="accept">' + esc(t.acceptAll) + '</button>'
            + '<button type="button" class="ely-consent-btn is-quiet" data-act="manage">' + esc(t.manage) + '</button>'
            + '</div>';

        document.body.appendChild(banner);
        window.requestAnimationFrame(function () { banner.classList.add('is-open'); });

        banner.addEventListener('click', function (e) {
            var act = e.target.getAttribute && e.target.getAttribute('data-act');
            if (act === 'accept') { writeRecord(allCategories(true));  hideBanner(); }
            if (act === 'reject') { writeRecord(allCategories(false)); hideBanner(); }
            if (act === 'manage') { open(); }
        });
    }

    /**
     * Retira el banner del DOM.
     * @returns {void}
     */
    function hideBanner() {
        var banner = document.getElementById(BANNER_ID);
        if (!banner) return;
        banner.classList.remove('is-open');
        window.setTimeout(function () {
            if (banner.parentNode) banner.parentNode.removeChild(banner);
        }, 300);
    }

    // ── Panel granular ──────────────────────────────────────────────────────

    /**
     * Construye el gestor granular de preferencias.
     * @returns {HTMLElement}
     */
    function buildPanel() {
        var panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-label', t.panelTitle);

        var items = CATEGORIES.map(function (category) {
            var l = labelsFor(category);
            var control = category.required
                ? '<span class="ely-consent-always">' + esc(t.always) + '</span>'
                : '<span class="ely-consent-switch">'
                    + '<input type="checkbox" data-cat="' + esc(category.id) + '"'
                    + ' aria-label="' + esc(l.name) + '">'
                    + '<span class="ely-consent-track"></span></span>';

            return '<div class="ely-consent-item">'
                 + '<div class="ely-consent-item-top">'
                 + '<span class="ely-consent-item-name">' + esc(l.name) + '</span>'
                 + control
                 + '</div>'
                 + '<p class="ely-consent-item-desc">' + esc(l.desc) + '</p>'
                 + '</div>';
        }).join('');

        panel.innerHTML =
            '<div class="ely-consent-card" role="document">'
            + '<div class="ely-consent-head">'
            + '<h2>' + esc(t.panelTitle) + '</h2>'
            + '<p>' + esc(t.panelIntro) + '</p>'
            + '</div>'
            + '<div class="ely-consent-body">' + items + '</div>'
            + '<div class="ely-consent-foot">'
            + '<p class="ely-consent-meta" id="ely-consent-meta"></p>'
            + '<div class="ely-consent-actions">'
            + '<button type="button" class="ely-consent-btn" data-act="close">' + esc(t.close) + '</button>'
            + '<button type="button" class="ely-consent-btn is-primary" data-act="save">' + esc(t.save) + '</button>'
            + '</div>'
            + '<p class="ely-consent-meta" style="margin:12px 0 0">'
            + '<button type="button" class="ely-consent-purge">' + esc(t.purge) + '</button></p>'
            + '</div>'
            + '</div>';

        document.body.appendChild(panel);

        panel.addEventListener('click', function (e) {
            var act = e.target.getAttribute && e.target.getAttribute('data-act');
            if (act === 'close') closePanel();
            if (act === 'save') {
                var state = { necessary: true };
                panel.querySelectorAll('input[data-cat]').forEach(function (input) {
                    state[input.getAttribute('data-cat')] = input.checked;
                });
                writeRecord(state);
                closePanel();
                hideBanner();
            }
            if (e.target === panel) closePanel();
        });

        panel.querySelector('.ely-consent-purge').addEventListener('click', purgeLocalData);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
        });

        return panel;
    }

    /**
     * Abre el gestor granular, reflejando el estado y el registro vigentes.
     * @returns {void}
     */
    function open() {
        injectStyles();
        var panel = document.getElementById(PANEL_ID) || buildPanel();
        var state = currentState();

        panel.querySelectorAll('input[data-cat]').forEach(function (input) {
            input.checked = !!state[input.getAttribute('data-cat')];
        });

        var record = readRecord();
        var meta = panel.querySelector('#ely-consent-meta');
        var parts = [legalLinks()];
        if (record) {
            parts.push(esc(t.recorded) + ' ' + esc(new Date(record.timestamp).toLocaleString()));
            parts.push(esc(t.version) + ' ' + esc(record.version));
        }
        meta.innerHTML = parts.filter(Boolean).join('<br>');

        panel.classList.add('is-open');
        var first = panel.querySelector('input[data-cat], .ely-consent-btn');
        if (first) first.focus();
    }

    /**
     * Cierra el gestor granular.
     * @returns {void}
     */
    function closePanel() {
        var panel = document.getElementById(PANEL_ID);
        if (panel) panel.classList.remove('is-open');
    }

    // ── Derechos del interesado ─────────────────────────────────────────────

    /**
     * Derecho de supresión: borra todo rastro local del visitante. Reutiliza el
     * pipeline de hard reset de F06 cuando está presente; si no, purga los
     * storages accesibles y recarga.
     * @returns {void}
     */
    function purgeLocalData() {
        if (typeof window.elysiumForceUpdate === 'function') {
            window.elysiumForceUpdate(true);
            return;
        }
        try { window.localStorage.clear(); } catch (_) {}
        try { window.sessionStorage.clear(); } catch (_) {}
        window.location.reload();
    }

    // ── Arranque ────────────────────────────────────────────────────────────

    /**
     * Aplica el consentimiento vigente y solicita decisión si procede.
     * @returns {void}
     */
    function init() {
        injectStyles();

        var record = readRecord();
        if (record && record.version === POLICY_VERSION) {
            applyConsent(record);
        } else {
            // Versión de política nueva o primera visita: nada de terceros aún.
            applyConsent({ categories: { necessary: true } });
        }

        if (needsPrompt()) showBanner();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /** @namespace ElysiumConsent */
    window.ElysiumConsent = {
        /**
         * Registro de consentimiento vigente.
         * @returns {{version: string, timestamp: string, categories: Object}|null}
         */
        get: function () { return readRecord(); },

        /**
         * Indica si una categoría está autorizada.
         * @param {string} category
         * @returns {boolean}
         */
        isGranted: function (category) { return !!currentState()[category]; },

        /**
         * Ejecuta `fn` cuando la categoría esté autorizada; de inmediato si ya
         * lo está. Es el punto de enganche para todo script de analítica o
         * marketing que no pueda declararse como `type="text/plain"`.
         * @param {string} category
         * @param {Function} fn
         * @returns {void}
         */
        onGranted: function (category, fn) {
            if (typeof fn !== 'function') return;
            if (currentState()[category]) { fn(); return; }
            (listeners[category] = listeners[category] || []).push(fn);
        },

        /** Abre el gestor granular de preferencias (enlace del footer). */
        open: open,

        /** Derecho de supresión: purga local de datos. */
        purgeLocalData: purgeLocalData
    };

})(window, document);
