/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  ONCORE — System Info Modal & Hard Reset Utility
 *  Etiqueta de versão no footer + modal de informação do sistema.
 *  Sem dependências. Estilo alinhado com css/oncore.css (paleta quente premium).
 * ══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ── CONFIGURAÇÃO ──────────────────────────────────────────────────────────
    var APP_VERSION       = 'V1.0.0';
    var APP_STAGE         = 'Beta';              // etiqueta de estado (vazio = estável)
    var PRODUCT_LICENSE   = 'ONC-2026-RBC1-MFPT';
    var PORTAL_URL        = 'https://oncore.pt';
    var SUPPORT_EMAIL     = 'info@oncore.pt';
    var TECH_EMAIL        = 'daniel.morales@elysiumdr.eu';
    var DEV_NAME          = 'Elysium λ Development & Research';
    var DEV_URL           = 'https://elysiumdr.eu';
    var TERMS_URL         = '#';                 // atualizar quando existir página legal
    var PRIVACY_URL       = '#';                 // atualizar quando existir página legal
    var MODAL_ID          = 'oncore-system-info-modal';
    var VERSION_TAG_CLASS = 'oncore-version-tag';

    // Paleta ONCORE (espelha :root de css/oncore.css)
    var C = {
        cream:      '#FBF7F0',
        sand:       '#F1E7D8',
        ink:        '#27332E',
        inkSoft:    '#55625C',
        terracotta: '#C1683F',
        gold:       '#D9A96B'
    };

    // Ícone da marca (traçado "activity", inline para não depender do Lucide)
    var LOGO_SVG =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
        + 'stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true">'
        + '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';

    // ── DETEÇÃO DE IDIOMA (index.html = PT · index-en.html = EN) ──────────────
    var path = window.location.pathname;
    var locale = path.indexOf('index-en') !== -1 ? 'en' : 'pt';

    // ── TEXTOS (i18n) ─────────────────────────────────────────────────────────
    var i18n = {
        pt: {
            title:         'ONCORE',
            subtitle:      'INFORMAÇÃO DO SISTEMA',
            secSoftware:   'Especificações de Software',
            labelVersion:  'Versão da Interface',
            labelBuild:    'Compilação (Build)',
            labelLicense:  'Licença do Produto',
            btnUpdate:     'Atualizar',
            secSecurity:   'Segurança e Conformidade',
            labelPrivDir:  'Diretiva de Privacidade',
            privDirVal:    'Diretiva ePrivacy · Cookie Consent v1.0',
            labelInfra:    'Infraestrutura de Segurança',
            infraVal:      'HSTS · CSP N3 · HMAC-SHA256',
            labelLegal:    'Enquadramento Legal',
            legalVal:      'RGPD (UE) · Lei 58/2019 (PT) · CNPD',
            labelTerms:    'Termos e Condições',
            labelPrivacy:  'Política de Privacidade',
            viewDoc:       'Ver documento',
            secCorp:       'Informação Corporativa',
            labelOrg:      'Organização',
            orgVal:        'ONCORE — Cancer Recovery & Survivorship Center',
            labelFounder:  'Founder & CEO',
            founderVal:    'Paulo Morais',
            labelPortal:   'Portal Web',
            portalVal:     'oncore.pt',
            labelSupport:  'Canal de Apoio',
            labelTech:     'Suporte Técnico',
            secAttrib:     'Atribuições de Software',
            labelIcons:    'Ecossistema de Ícones',
            iconsVal:      'Lucide Icons',
            labelFonts:    'Tipografia',
            fontsVal:      'Playfair Display · Inter (Google Fonts)',
            labelStack:    'Tecnologia Web',
            stackVal:      'PWA · Service Worker · HTML5/CSS3',
            devBy:         'Desenvolvido por',
            copyright:     '© 2026 ONCORE. Todos os direitos reservados.',
            updating:      'A atualizar…',
            signingOut:    'A terminar sessão…',
            close:         'Fechar'
        },
        en: {
            title:         'ONCORE',
            subtitle:      'SYSTEM INFORMATION',
            secSoftware:   'Software Specifications',
            labelVersion:  'Interface Version',
            labelBuild:    'Build Compilation',
            labelLicense:  'Product License',
            btnUpdate:     'Update',
            secSecurity:   'Security & Compliance',
            labelPrivDir:  'Privacy Directive',
            privDirVal:    'ePrivacy Directive · Cookie Consent v1.0',
            labelInfra:    'Security Infrastructure',
            infraVal:      'HSTS · CSP N3 · HMAC-SHA256',
            labelLegal:    'Legal Framework',
            legalVal:      'GDPR (EU) · Law 58/2019 (PT) · CNPD',
            labelTerms:    'Terms & Conditions',
            labelPrivacy:  'Privacy Policy',
            viewDoc:       'View document',
            secCorp:       'Corporate Information',
            labelOrg:      'Organization',
            orgVal:        'ONCORE — Cancer Recovery & Survivorship Center',
            labelFounder:  'Founder & CEO',
            founderVal:    'Paulo Morais',
            labelPortal:   'Web Portal',
            portalVal:     'oncore.pt',
            labelSupport:  'Support Channel',
            labelTech:     'Technical Support',
            secAttrib:     'Software Attributions',
            labelIcons:    'Icon Ecosystem',
            iconsVal:      'Lucide Icons',
            labelFonts:    'Typography',
            fontsVal:      'Playfair Display · Inter (Google Fonts)',
            labelStack:    'Web Technology',
            stackVal:      'PWA · Service Worker · HTML5/CSS3',
            devBy:         'Developed by',
            copyright:     '© 2026 ONCORE. All rights reserved.',
            updating:      'Updating…',
            signingOut:    'Signing out…',
            close:         'Close'
        }
    };

    var t = i18n[locale] || i18n.pt;
    var versionLabel = APP_VERSION + (APP_STAGE ? ' ' + APP_STAGE : '');

    // Mês/ano da última modificação do documento
    function getBuildDate() {
        var d = new Date(document.lastModified);
        if (!isNaN(d.getTime()) && d.getFullYear() > 2000) {
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        }
        return '2026-07';
    }

    // ── ESTILOS (injetados, sem CSS externo) ──────────────────────────────────
    function injectStyles() {
        if (document.getElementById('oncore-sysinfo-styles')) return;

        var css = [
            /* Etiqueta de versão no footer (fundo escuro --ink) */
            '.' + VERSION_TAG_CLASS + '{',
            '  display:inline-flex;align-items:center;justify-content:center;gap:6px;',
            '  padding:4px 12px;',
            '  font-size:.68rem;font-family:"SF Mono",Menlo,Consolas,monospace;',
            '  color:rgba(251,247,240,.5);background:rgba(251,247,240,.05);',
            '  border:1px solid rgba(251,247,240,.14);border-radius:999px;',
            '  cursor:pointer;text-decoration:none;letter-spacing:.06em;',
            '  transition:color .2s ease,border-color .2s ease,background .2s ease;',
            '  margin-right:64px;', /* margem default para mobile */
            '}',
            '@media (min-width: 769px) { .' + VERSION_TAG_CLASS + ' { margin-right: 230px; } }', /* evita colisão com a dock larga no desktop */
            '.' + VERSION_TAG_CLASS + ':hover,',
            '.' + VERSION_TAG_CLASS + ':focus-visible{',
            '  color:' + C.gold + ';border-color:' + C.gold + ';',
            '  background:rgba(217,169,107,.08);outline:none;',
            '}',

            /* Overlay */
            '#' + MODAL_ID + '{',
            '  position:fixed;inset:0;z-index:99999;',
            '  background:rgba(39,51,46,.55);',
            '  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);',
            '  display:flex;justify-content:center;align-items:center;padding:16px;',
            '  opacity:0;pointer-events:none;transition:opacity .25s ease;',
            '}',
            '#' + MODAL_ID + '.open{opacity:1;pointer-events:all;}',

            /* Cartão */
            '.oncore-sysinfo-card{',
            '  position:relative;width:100%;max-width:420px;',
            '  background:' + C.cream + ';border-radius:20px;',
            '  box-shadow:0 24px 70px -30px rgba(39,51,46,.6);',
            '  border:1px solid rgba(39,51,46,.08);',
            '  color:' + C.ink + ';display:flex;flex-direction:column;overflow:hidden;',
            '  font-family:"Inter",-apple-system,sans-serif;',
            '  transform:translateY(18px) scale(.97);',
            '  transition:transform .28s cubic-bezier(.34,1.56,.64,1);',
            '}',
            '#' + MODAL_ID + '.open .oncore-sysinfo-card{transform:translateY(0) scale(1);}',

            /* Fechar */
            '.oncore-close-btn{',
            '  position:absolute;top:14px;right:14px;z-index:2;',
            '  width:28px;height:28px;border-radius:50%;',
            '  border:1px solid rgba(39,51,46,.15);',
            '  background:' + C.cream + ';color:' + C.inkSoft + ';',
            '  cursor:pointer;font-size:.7rem;display:flex;',
            '  align-items:center;justify-content:center;transition:all .2s;',
            '}',
            '.oncore-close-btn:hover{background:' + C.ink + ';color:' + C.cream + ';border-color:' + C.ink + ';}',

            /* Cabeçalho com logótipo */
            '.oncore-sysinfo-head{padding:30px 24px 14px;text-align:center;}',
            '.oncore-logo-mark{',
            '  width:46px;height:46px;border-radius:50%;margin:0 auto 12px;',
            '  background:' + C.ink + ';color:' + C.gold + ';',
            '  display:flex;align-items:center;justify-content:center;',
            '}',
            '.oncore-sysinfo-head h2{',
            '  margin:0;font-family:"Playfair Display",Georgia,serif;',
            '  font-size:1.45rem;font-weight:700;letter-spacing:.1em;color:' + C.ink + ';',
            '}',
            '.oncore-sysinfo-head .oncore-subtitle{',
            '  font-size:.62rem;color:' + C.terracotta + ';margin-top:5px;',
            '  letter-spacing:.18em;font-weight:600;',
            '}',
            '.oncore-sysinfo-body{padding:0 0 10px;overflow-y:auto;max-height:56vh;}',
            '.oncore-sec-label{',
            '  padding:16px 26px 7px;font-size:.62rem;color:' + C.inkSoft + ';',
            '  font-weight:700;text-transform:uppercase;letter-spacing:.12em;',
            '}',
            '.oncore-sysinfo-group{',
            '  margin:0 18px;background:#FFFFFF;',
            '  border:1px solid rgba(39,51,46,.08);border-radius:14px;overflow:hidden;',
            '}',
            '.oncore-row{',
            '  display:flex;justify-content:space-between;align-items:center;gap:14px;',
            '  padding:12px 16px;border-top:1px solid rgba(39,51,46,.07);font-size:.8rem;',
            '}',
            '.oncore-row:first-of-type{border-top:none;}',
            '.oncore-row > span:first-child{font-weight:600;flex-shrink:0;}',
            '.oncore-row-value{color:' + C.inkSoft + ';text-align:right;min-width:0;overflow-wrap:anywhere;}',
            '.oncore-link-val{color:' + C.terracotta + ';text-decoration:none;font-weight:500;min-width:0;overflow-wrap:anywhere;text-align:right;}',
            '.oncore-link-val:hover{text-decoration:underline;}',

            /* Selo Beta */
            '.oncore-stage-badge{',
            '  display:inline-block;margin-left:6px;padding:1px 8px;',
            '  background:' + C.gold + ';color:' + C.ink + ';border-radius:999px;',
            '  font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;',
            '  vertical-align:middle;',
            '}',

            /* Botão atualizar */
            '.oncore-update-btn{',
            '  border:1px solid ' + C.terracotta + ';color:' + C.terracotta + ';',
            '  background:transparent;border-radius:999px;padding:3px 12px;',
            '  font-size:.68rem;font-weight:600;cursor:pointer;transition:all .2s;',
            '  font-family:inherit;margin-left:8px;',
            '}',
            '.oncore-update-btn:hover{background:' + C.terracotta + ';color:#FFF;}',

            /* Rodapé do cartão */
            '.oncore-sysinfo-foot{',
            '  padding:14px 26px 20px;text-align:center;',
            '  border-top:1px solid rgba(39,51,46,.08);',
            '  font-size:.68rem;color:' + C.inkSoft + ';line-height:1.7;',
            '}',
            '.oncore-sysinfo-foot a{color:' + C.terracotta + ';text-decoration:none;font-weight:600;}',
            '.oncore-sysinfo-foot a:hover{text-decoration:underline;}',

            /* Loader de sistema (atualização / logout) */
            '#oncore-update-loader{',
            '  position:fixed;inset:0;z-index:999999;',
            '  background:rgba(39,51,46,.98);',
            '  backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);',
            '  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;',
            '  opacity:1;transition:opacity .3s ease;',
            '}',
            '.oncore-loader-logo{',
            '  width:64px;height:64px;border-radius:50%;',
            '  background:rgba(251,247,240,.06);color:' + C.gold + ';',
            '  border:1px solid rgba(217,169,107,.25);',
            '  display:flex;align-items:center;justify-content:center;',
            '  animation:oncore-pulse-logo 1.5s ease-in-out infinite;',
            '}',
            '.oncore-loader-logo svg{width:28px;height:28px;}',
            '.oncore-loader-ui{',
            '  display:flex;flex-direction:column;align-items:center;gap:12px;width:240px;',
            '}',
            '.oncore-loader-msg{',
            '  font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;',
            '  color:' + C.cream + ';font-family:"Inter",sans-serif;font-weight:600;',
            '  text-align:center;',
            '}',
            '.oncore-loader-bar{',
            '  width:100%;height:2px;background:rgba(251,247,240,.1);',
            '  border-radius:2px;overflow:hidden;',
            '}',
            '.oncore-loader-fill{',
            '  width:0%;height:100%;background:' + C.terracotta + ';border-radius:2px;',
            '  animation:oncore-progress 1.5s cubic-bezier(.4,0,.2,1) forwards;',
            '}',
            /* Simulação de carga: arranque rápido, abrandamento, espera do refresh */
            '@keyframes oncore-progress{',
            '  0%{width:0%;}',
            '  40%{width:60%;}',
            '  80%{width:85%;}',
            '  100%{width:95%;}',
            '}',
            '@keyframes oncore-pulse-logo{',
            '  0%,100%{opacity:.6;transform:scale(.95);}',
            '  50%{opacity:1;transform:scale(1.05);}',
            '}'
        ].join('\n');

        var style = document.createElement('style');
        style.id = 'oncore-sysinfo-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function row(label, value) {
        return '<div class="oncore-row"><span>' + label + '</span><span class="oncore-row-value">' + value + '</span></div>';
    }
    function linkRow(label, href, text, external) {
        var attrs = external ? ' target="_blank" rel="noopener"' : '';
        return '<div class="oncore-row"><span>' + label + '</span>'
             + '<a class="oncore-link-val" href="' + href + '"' + attrs + '>' + text + '</a></div>';
    }

    // ── MODAL ─────────────────────────────────────────────────────────────────
    function buildModal() {
        var modal = document.createElement('div');
        modal.id = MODAL_ID;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', t.subtitle);

        var stageBadge = APP_STAGE ? '<span class="oncore-stage-badge">' + APP_STAGE + '</span>' : '';

        modal.innerHTML =
            '<div class="oncore-sysinfo-card">'
            + '  <button class="oncore-close-btn" id="oncore-close-btn" aria-label="' + t.close + '">✕</button>'
            + '  <div class="oncore-sysinfo-head">'
            + '    <div class="oncore-logo-mark">' + LOGO_SVG + '</div>'
            + '    <h2>' + t.title + '</h2>'
            + '    <div class="oncore-subtitle">' + t.subtitle + '</div>'
            + '  </div>'
            + '  <div class="oncore-sysinfo-body">'

            // 1 · Especificações de Software
            + '    <div class="oncore-sec-label">' + t.secSoftware + '</div>'
            + '    <div class="oncore-sysinfo-group">'
            + '      <div class="oncore-row"><span>' + t.labelVersion + '</span>'
            + '        <span class="oncore-row-value">' + APP_VERSION + stageBadge
            + '          <button class="oncore-update-btn" id="oncore-update-btn">' + t.btnUpdate + '</button>'
            + '        </span>'
            + '      </div>'
            +        row(t.labelBuild, getBuildDate())
            +        row(t.labelLicense, PRODUCT_LICENSE)
            + '    </div>'

            // 2 · Segurança e Conformidade
            + '    <div class="oncore-sec-label">' + t.secSecurity + '</div>'
            + '    <div class="oncore-sysinfo-group">'
            +        row(t.labelPrivDir, t.privDirVal)
            +        row(t.labelInfra, t.infraVal)
            +        row(t.labelLegal, t.legalVal)
            +        linkRow(t.labelTerms, TERMS_URL, t.viewDoc)
            +        linkRow(t.labelPrivacy, PRIVACY_URL, t.viewDoc)
            + '    </div>'

            // 3 · Informação Corporativa
            + '    <div class="oncore-sec-label">' + t.secCorp + '</div>'
            + '    <div class="oncore-sysinfo-group">'
            +        row(t.labelOrg, t.orgVal)
            +        row(t.labelFounder, t.founderVal)
            +        linkRow(t.labelPortal, PORTAL_URL, t.portalVal, true)
            +        linkRow(t.labelSupport, 'mailto:' + SUPPORT_EMAIL, SUPPORT_EMAIL)
            +        linkRow(t.labelTech, 'mailto:' + TECH_EMAIL, TECH_EMAIL)
            + '    </div>'

            // 4 · Atribuições de Software
            + '    <div class="oncore-sec-label">' + t.secAttrib + '</div>'
            + '    <div class="oncore-sysinfo-group">'
            +        row(t.labelIcons, t.iconsVal)
            +        row(t.labelFonts, t.fontsVal)
            +        row(t.labelStack, t.stackVal)
            + '    </div>'

            + '  </div>'
            + '  <div class="oncore-sysinfo-foot">'
            + '    ' + t.devBy + ' <a href="' + DEV_URL + '" target="_blank" rel="noopener">' + DEV_NAME + '</a>.<br>'
            + '    ' + t.copyright
            + '  </div>'
            + '</div>';

        document.body.appendChild(modal);

        function closeModal() { modal.classList.remove('open'); }
        document.getElementById('oncore-close-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
        });

        document.getElementById('oncore-update-btn').addEventListener('click', function () {
            window.oncoreForceUpdate(false);
        });

        return modal;
    }

    function showModal() {
        var modal = document.getElementById(MODAL_ID) || buildModal();
        modal.classList.add('open');
    }

    // ── ECRÃ DE CARREGAMENTO DO SISTEMA ───────────────────────────────────────
    // Logótipo pulsante + mensagem dinâmica + barra de progresso simulada.
    function showSystemUpdateLoader(message) {
        if (document.getElementById('oncore-update-loader')) return;
        injectStyles();

        var loader = document.createElement('div');
        loader.id = 'oncore-update-loader';
        loader.setAttribute('role', 'status');
        loader.setAttribute('aria-live', 'polite');
        loader.innerHTML =
            '<div class="oncore-loader-logo">' + LOGO_SVG + '</div>'
            + '<div class="oncore-loader-ui">'
            + '  <div class="oncore-loader-msg">' + message + '</div>'
            + '  <div class="oncore-loader-bar"><div class="oncore-loader-fill"></div></div>'
            + '</div>';
        document.body.appendChild(loader);
    }

    // Recarga fresca, ignorando qualquer cache ou proxy intermédio
    function cleanReload() {
        window.location.href = window.location.pathname + '?_t=' + Date.now();
    }

    // ── HARD RESET (atualização ou fim de sessão) ─────────────────────────────
    // oncoreForceUpdate(false) → atualizar · oncoreForceUpdate(true) → logout
    window.oncoreForceUpdate = async function (isLogout) {
        // 1. Mensagem consoante a ação e o idioma
        showSystemUpdateLoader(isLogout ? t.signingOut : t.updating);

        // 2. Temporizador de segurança: recarga obrigatória aos 1.8s
        //    caso alguma promise de limpeza fique bloqueada pelo navegador
        var fallback = setTimeout(cleanReload, 1800);

        try {
            // A. Cookies — expiradas na raiz e no domínio atual
            document.cookie.split(';').forEach(function (cookie) {
                var eqPos = cookie.indexOf('=');
                var name = (eqPos > -1 ? cookie.substr(0, eqPos) : cookie).trim();
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
            });

            // B. Storages (o flag sys_action sobrevive à recarga nesta aba,
            //    permitindo à app saber que ação acabou de ocorrer)
            localStorage.clear();
            sessionStorage.clear();
            sessionStorage.setItem('sys_action', isLogout ? 'logout' : 'update');

            // C. IndexedDB — destruição de todas as bases de dados locais
            if (window.indexedDB && typeof window.indexedDB.databases === 'function') {
                var dbs = await window.indexedDB.databases();
                await Promise.all(dbs.map(function (db) {
                    return db && db.name
                        ? new Promise(function (resolve) {
                            var req = window.indexedDB.deleteDatabase(db.name);
                            req.onsuccess = req.onerror = req.onblocked = resolve;
                        })
                        : Promise.resolve();
                }));
            }

            // D. Cache Storage (assets antigos da PWA / Service Worker)
            if ('caches' in window) {
                var names = await caches.keys();
                await Promise.all(names.map(function (n) { return caches.delete(n); }));
            }

            // E. Service Workers
            if ('serviceWorker' in navigator) {
                var regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(function (r) { return r.unregister(); }));
            }

            // 3. Recarga limpa aos 600ms — tempo para o utilizador
            //    visualizar a animação da barra de progresso
            clearTimeout(fallback);
            setTimeout(cleanReload, 600);
        } catch (e) {
            cleanReload();
        }
    };

    // API pública reutilizável (ex.: botão de logout futuro)
    window.oncoreShowLoader = showSystemUpdateLoader;

    // ── INJEÇÃO DA ETIQUETA NO FOOTER ─────────────────────────────────────────
    function injectVersionTag() {
        if (document.querySelector('.' + VERSION_TAG_CLASS)) return;

        var container = document.querySelector('.footer-bottom-inner')
                     || document.querySelector('.footer-bottom')
                     || document.querySelector('footer');
        if (!container) return;

        var tag = document.createElement('span');
        tag.className = VERSION_TAG_CLASS;
        tag.textContent = versionLabel;
        tag.setAttribute('role', 'button');
        tag.setAttribute('tabindex', '0');
        tag.setAttribute('aria-haspopup', 'dialog');

        tag.addEventListener('click', function (e) { e.preventDefault(); showModal(); });
        tag.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showModal(); }
        });

        container.appendChild(tag);
    }

    function init() {
        injectStyles();
        injectVersionTag();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
