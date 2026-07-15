/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  Elysium λ — System Info Modal
 *  version-modal.js  |  v1.0.0
 *
 *  Design: Matches pmorais.pt reference — clean light modal, row-divider
 *  layout, amber accent links, sectioned with small-caps labels.
 *
 *  Usage: <script src="JS/version-modal.js"></script> before </body>
 *  Zero dependencies. Works across all Elysium pages (EN / ES / PT).
 * ══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ── Configuration ─────────────────────────────────────────────────────────
    var APP_VERSION       = 'V1.2.4';
    var MODAL_ID          = 'elysium-system-info-modal';
    var VERSION_TAG_CLASS = 'elysium-version-tag';
    var ACCENT            = '#2997ff';   // Elysium brand electric blue

    // ── Locale detection ──────────────────────────────────────────────────────
    var path = window.location.pathname;
    var locale = path.includes('/pt/') || path.endsWith('/pt') ? 'pt'
               : path.includes('/es/') || path.endsWith('/es') ? 'es'
               : 'en';

    // ── i18n strings ─────────────────────────────────────────────────────────
    var i18n = {
        en: {
            subtitle:       'SYSTEM INFORMATION',
            // Software specs
            secSoftware:    'SOFTWARE SPECIFICATIONS',
            labelVersion:   'Interface Version',
            labelBuild:     'Build Compilation',
            labelLicence:   'Product Licence',
            licenceVal:     'ELY-28LB-NL5H-MFFF',
            btnUpdate:      'Update',
            // Security
            secSecurity:    'SECURITY & COMPLIANCE',
            labelPrivDir:   'Privacy Directive',
            privDirVal:     'ePrivacy Directive · Cookie Consent v1.0',
            labelSecInfra:  'Security Infrastructure',
            secInfraVal:    'HSTS · CSP L3 · HMAC-SHA256',
            labelLegalFrm:  'Legal Framework',
            legalFrmVal:    'GDPR (EU) · Law 8968 (CR)',
            labelTerms:     'Terms & Conditions',
            labelPrivacy:   'Privacy Policy',
            viewDoc:        'View document',
            // Corporate
            secCorp:        'CORPORATE INFORMATION',
            labelOrg:       'Organisation',
            orgVal:         'Elysium \u03bb Development & Research',
            labelPortal:    'Web Portal',
            portalVal:      'elysiumdr.eu',
            labelSupport:   'Support Channel',
            supportVal:     'info@elysiumdr.eu',
            labelTechSup:   'Technical Support',
            techSupVal:     'daniel.morales@elysiumdr.eu',
            // Attributions
            secAttr:        'SOFTWARE ATTRIBUTIONS',
            labelIcons:     'Icon Ecosystem',
            iconsVal:       'Lucide Icons v0.460.0',
            labelCerts:     'Cloud Certifications',
            certsVal:       'ISO 27001 · SOC 2/3 · PCI-DSS · Firebase',
            // Footer
            devBy:          'Developed by',
            devLink:        'Elysium \u03bb Development & Research',
            copyright:      '\u00a9 2026 Elysium \u03bb Development & Research. All rights reserved.',
            // Links
            termsHref:      'terms.html',
            privacyHref:    'privacy.html',
        },
        es: {
            subtitle:       'INFORMACIÓN DEL SISTEMA',
            secSoftware:    'ESPECIFICACIONES DE SOFTWARE',
            labelVersion:   'Versión de Interfaz',
            labelBuild:     'Compilación (Build)',
            labelLicence:   'Licencia del Producto',
            licenceVal:     'ELY-28LB-NL5H-MFFF',
            btnUpdate:      'Actualizar',
            secSecurity:    'SEGURIDAD Y CONFORMIDAD',
            labelPrivDir:   'Directiva de Privacidad',
            privDirVal:     'Directiva ePrivacy · Cookie Consent v1.0',
            labelSecInfra:  'Infraestructura de Seguridad',
            secInfraVal:    'HSTS · CSP N3 · HMAC-SHA256',
            labelLegalFrm:  'Marco Legal',
            legalFrmVal:    'RGPD (UE) · Ley 8968 / PRODHAB (CR)',
            labelTerms:     'Términos y Condiciones',
            labelPrivacy:   'Política de Privacidad',
            viewDoc:        'Ver documento',
            secCorp:        'INFORMACIÓN CORPORATIVA',
            labelOrg:       'Organización',
            orgVal:         'Elysium \u03bb Development & Research',
            labelPortal:    'Portal Web',
            portalVal:      'elysiumdr.eu',
            labelSupport:   'Canal de Soporte',
            supportVal:     'info@elysiumdr.eu',
            labelTechSup:   'Soporte Técnico',
            techSupVal:     'daniel.morales@elysiumdr.eu',
            secAttr:        'ATRIBUCIONES DE SOFTWARE',
            labelIcons:     'Ecosistema de Iconos',
            iconsVal:       'Lucide Icons v0.460.0',
            labelCerts:     'Certificaciones Cloud',
            certsVal:       'ISO 27001 · SOC 2/3 · PCI-DSS · Firebase',
            devBy:          'Desarrollado por',
            devLink:        'Elysium \u03bb Development & Research',
            copyright:      '\u00a9 2026 Elysium \u03bb Development & Research. Todos los derechos reservados.',
            termsHref:      'terms.html',
            privacyHref:    'privacy.html',
        },
        pt: {
            subtitle:       'INFORMAÇÃO DO SISTEMA',
            secSoftware:    'ESPECIFICAÇÕES DE SOFTWARE',
            labelVersion:   'Versão da Interface',
            labelBuild:     'Compilação (Build)',
            labelLicence:   'Licença do Produto',
            licenceVal:     'ELY-28LB-NL5H-MFFF',
            btnUpdate:      'Actualizar',
            secSecurity:    'SEGURANÇA E CONFORMIDADE',
            labelPrivDir:   'Directiva de Privacidade',
            privDirVal:     'Directiva ePrivacy · Cookie Consent v1.0',
            labelSecInfra:  'Infraestrutura de Segurança',
            secInfraVal:    'HSTS · CSP N3 · HMAC-SHA256',
            labelLegalFrm:  'Quadro Legal',
            legalFrmVal:    'RGPD (UE) · Lei 8968 / PRODHAB (CR)',
            labelTerms:     'Termos e Condições',
            labelPrivacy:   'Política de Privacidade',
            viewDoc:        'Ver documento',
            secCorp:        'INFORMAÇÃO CORPORATIVA',
            labelOrg:       'Organização',
            orgVal:         'Elysium \u03bb Development & Research',
            labelPortal:    'Portal Web',
            portalVal:      'elysiumdr.eu',
            labelSupport:   'Canal de Suporte',
            supportVal:     'info@elysiumdr.eu',
            labelTechSup:   'Suporte Técnico',
            techSupVal:     'daniel.morales@elysiumdr.eu',
            secAttr:        'ATRIBUIÇÕES DE SOFTWARE',
            labelIcons:     'Ecossistema de Ícones',
            iconsVal:       'Lucide Icons v0.460.0',
            labelCerts:     'Certificações Cloud',
            certsVal:       'ISO 27001 · SOC 2/3 · PCI-DSS · Firebase',
            devBy:          'Desenvolvido por',
            devLink:        'Elysium \u03bb Development & Research',
            copyright:      '\u00a9 2026 Elysium \u03bb Development & Research. Todos os direitos reservados.',
            termsHref:      'privacy.html',
            privacyHref:    'privacy.html',
        }
    };

    var t = i18n[locale];

    // ── Build Date ────────────────────────────────────────────────────────────
    function getBuildDate() {
        var d = new Date(document.lastModified);
        if (!isNaN(d.getTime()) && d.getFullYear() > 2000) {
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        }
        return '2026-07';
    }

    // ── Resolve links relative to current page depth ──────────────────────────
    function resolveHref(enPath, esPath, ptPath) {
        var segments = window.location.pathname.split('/').filter(function(s) { return s && s.indexOf('.') === -1; });
        var prefix = segments.length > 0 ? '../'.repeat(segments.length) : '';
        if (locale === 'pt') return prefix + ptPath;
        if (locale === 'es') return prefix + esPath;
        return prefix + enPath;
    }

    // ── Inject CSS (once) ─────────────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('elysium-sysinfo-styles')) return;

        var css = [
            /* Version tag in footer */
            '.' + VERSION_TAG_CLASS + '{',
            '  display:inline-flex; align-items:center; justify-content:center;',
            '  margin-top:12px; padding:4px 10px;',
            '  font-size:.65rem; font-family:"SF Mono","Fira Code","Courier New",monospace;',
            '  color:#A0A5B5; background:rgba(255, 255, 255, 0.03);',
            '  border:1px solid rgba(255, 255, 255, 0.06); border-radius:9999px;',
            '  cursor:pointer; text-decoration:none;',
            '  transition:all .2s ease; letter-spacing:.05em;',
            '}',
            '.' + VERSION_TAG_CLASS + ':hover{',
            '  background:rgba(41, 151, 255, 0.1); color:#E1E1E5;',
            '  border-color:rgba(41, 151, 255, 0.3);',
            '}',

            /* Backdrop */
            '#' + MODAL_ID + '{',
            '  position:fixed;inset:0;z-index:99999;',
            '  background:rgba(2, 4, 16, 0.6);',
            '  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);',
            '  display:flex;justify-content:center;align-items:center;padding:16px;',
            '  opacity:0;pointer-events:none;',
            '  transition:opacity .25s ease;',
            '}',
            '#' + MODAL_ID + '.ely-open{opacity:1;pointer-events:all;}',

            /* Card */
            '.ely-sysinfo-card{',
            '  position:relative;width:100%;max-width:400px;max-height:88vh;',
            '  background:rgba(10, 20, 40, 0.6);border-radius:14px;',
            '  box-shadow:0 8px 32px 0 rgba(0, 5, 20, 0.5);',
            '  border: 1px solid rgba(225, 225, 229, 0.15);',
            '  color:#E1E1E5;display:flex;flex-direction:column;overflow:hidden;',
            '  transform:translateY(18px) scale(.97);',
            '  transition:transform .28s cubic-bezier(.34,1.56,.64,1);',
            '}',
            '#' + MODAL_ID + '.ely-open .ely-sysinfo-card{transform:translateY(0) scale(1);}',

            /* Close button */
            '.ely-close-btn{',
            '  position:absolute;top:14px;right:14px;',
            '  width:26px;height:26px;border-radius:50%;',
            '  border:1px solid rgba(225, 225, 229, 0.15);',
            '  background:rgba(10, 20, 40, 0.4);color:#A0A5B5;',
            '  cursor:pointer;font-size:.7rem;display:flex;',
            '  align-items:center;justify-content:center;',
            '  transition:background .18s;z-index:1;',
            '}',
            '.ely-close-btn:hover{background:rgba(20, 30, 60, 0.5); color:#E1E1E5;}',

            /* Header */
            '.ely-sysinfo-head{',
            '  display:flex;flex-direction:column;align-items:center;',
            '  gap:4px;padding:28px 24px 18px;text-align:center;',
            '}',
            '.ely-sysinfo-head .ely-brand-symbol{',
            '  font-size:2rem;font-weight:700;color:' + ACCENT + ';',
            '  font-family:"Playfair Display","Georgia",serif;line-height:1;',
            '  margin-bottom:6px;',
            '}',
            '.ely-sysinfo-head h2{',
            '  margin:0;font-size:1.15rem;font-weight:800;',
            '  letter-spacing:.08em;color:#E1E1E5;',
            '  font-family:-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;',
            '}',
            '.ely-sysinfo-head .ely-subtitle{',
            '  font-size:.6rem;letter-spacing:.14em;color:#A0A5B5;',
            '  font-family:-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;',
            '  margin-top:2px;',
            '}',

            /* Scrollable body */
            '.ely-sysinfo-body{',
            '  padding:0 0 8px;overflow-y:auto;flex:1;',
            '}',

            /* Section label */
            '.ely-sec-label{',
            '  padding:20px 24px 6px;',
            '  font-size:.58rem;letter-spacing:.14em;color:#6B7280;',
            '  font-family:-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;',
            '  font-weight:600;text-transform:uppercase;',
            '}',

            /* Grouped List */
            '.ely-sysinfo-group{',
            '  margin: 0 16px;',
            '  background: rgba(255, 255, 255, 0.03);',
            '  border: 1px solid rgba(255, 255, 255, 0.05);',
            '  border-radius: 12px;',
            '  overflow: hidden;',
            '}',

            /* Row */
            '.ely-row{',
            '  display:flex;justify-content:space-between;align-items:center;',
            '  padding:12px 16px;',
            '  border-top:1px solid rgba(255, 255, 255, 0.05);',
            '  font-size:.82rem;gap:12px;',
            '}',
            '.ely-row:first-of-type{border-top:none;}',
            '.ely-row-label{color:#E1E1E5;flex-shrink:0;}',
            '.ely-row-value{',
            '  color:#A0A5B5;text-align:right;font-size:.82rem;',
            '  display:flex;align-items:center;gap:8px;',
            '}',

            /* Accent link value */
            '.ely-link-val{',
            '  color:' + ACCENT + ';text-decoration:none;font-size:.82rem;',
            '  transition:opacity .18s;',
            '}',
            '.ely-link-val:hover{opacity:.7;}',

            /* Update button */
            '.ely-update-btn{',
            '  border:1px solid ' + ACCENT + ';color:' + ACCENT + ';background:transparent;',
            '  border-radius:5px;padding:2px 8px;font-size:.65rem;',
            '  cursor:pointer;font-weight:600;letter-spacing:.03em;',
            '  transition:background .18s,color .18s;',
            '}',
            '.ely-update-btn:hover{background:' + ACCENT + ';color:#E1E1E5;}',
            '.ely-update-btn.busy{opacity:.45;pointer-events:none;}',

            /* Footer */
            '.ely-sysinfo-foot{',
            '  padding:24px 24px 18px;text-align:center;',
            '  font-size:.68rem;color:#6B7280;line-height:1.6;',
            '}',
            '.ely-sysinfo-foot a{color:' + ACCENT + ';text-decoration:none;}',
            '.ely-sysinfo-foot a:hover{text-decoration:underline;}',
        ].join('\n');

        var style = document.createElement('style');
        style.id = 'elysium-sysinfo-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ── Helper: build a plain row ─────────────────────────────────────────────
    function row(label, valueHTML) {
        return '<div class="ely-row">'
             + '<span class="ely-row-label">' + label + '</span>'
             + '<span class="ely-row-value">' + valueHTML + '</span>'
             + '</div>';
    }

    // ── Helper: link row (accent colored) ────────────────────────────────────
    function linkRow(label, href, text, external) {
        var attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return '<div class="ely-row">'
             + '<span class="ely-row-label">' + label + '</span>'
             + '<a href="' + href + '" class="ely-link-val"' + attrs + '>' + text + '</a>'
             + '</div>';
    }

    // ── Build & mount modal ───────────────────────────────────────────────────
    function buildModal() {
        var build      = getBuildDate();
        var termsHref  = resolveHref('terms.html',   'es/terms.html',   'pt/terms.html');
        var privHref   = resolveHref('privacy.html', 'es/privacy.html', 'pt/privacy.html');

        var modal = document.createElement('div');
        modal.id = MODAL_ID;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'System Information');

        modal.innerHTML =
            '<div class="ely-sysinfo-card">'

            // Close
            + '<button class="ely-close-btn" id="ely-close-btn" aria-label="Close">\u2715</button>'

            // Header
            + '<div class="ely-sysinfo-head">'
            +   '<div class="ely-brand-symbol">\u03bb</div>'
            +   '<h2>ELYSIUM</h2>'
            +   '<div class="ely-subtitle">' + t.subtitle + '</div>'
            + '</div>'

            // Body
            + '<div class="ely-sysinfo-body">'

            // ── Software Specifications ──
            + '<div class="ely-sec-label">' + t.secSoftware + '</div>'
            + '<div class="ely-sysinfo-group">'
            +   '<div class="ely-row">'
            +     '<span class="ely-row-label">' + t.labelVersion + '</span>'
            +     '<span class="ely-row-value">'
            +       APP_VERSION
            +       '&nbsp;<button class="ely-update-btn" id="ely-update-btn">' + t.btnUpdate + '</button>'
            +     '</span>'
            +   '</div>'
            +   row(t.labelBuild, build)
            +   row(t.labelLicence, t.licenceVal)
            + '</div>'

            // ── Security & Compliance ──
            + '<div class="ely-sec-label">' + t.secSecurity + '</div>'
            + '<div class="ely-sysinfo-group">'
            +   row(t.labelPrivDir,  t.privDirVal)
            +   row(t.labelSecInfra, t.secInfraVal)
            +   row(t.labelLegalFrm, t.legalFrmVal)
            +   linkRow(t.labelTerms,   termsHref, t.viewDoc, false)
            +   linkRow(t.labelPrivacy, privHref,  t.viewDoc, false)
            + '</div>'

            // ── Corporate Information ──
            + '<div class="ely-sec-label">' + t.secCorp + '</div>'
            + '<div class="ely-sysinfo-group">'
            +   row(t.labelOrg, t.orgVal)
            +   linkRow(t.labelPortal,  'https://elysiumdr.eu',           t.portalVal,  true)
            +   linkRow(t.labelSupport, 'mailto:info@elysiumdr.eu',        t.supportVal, false)
            +   linkRow(t.labelTechSup, 'mailto:daniel.morales@elysiumdr.eu', t.techSupVal, false)
            + '</div>'

            // ── Software Attributions ──
            + '<div class="ely-sec-label">' + t.secAttr + '</div>'
            + '<div class="ely-sysinfo-group">'
            +   row(t.labelIcons, t.iconsVal)
            +   row(t.labelCerts, t.certsVal)
            + '</div>'

            + '</div>'  // end body

            // Footer
            + '<div class="ely-sysinfo-foot">'
            +   t.devBy + ' <a href="https://elysiumdr.eu" target="_blank" rel="noopener noreferrer">' + t.devLink + '</a>.<br>'
            +   t.copyright
            + '</div>'

            + '</div>';  // end card

        document.body.appendChild(modal);

        // Close logic
        function closeModal() {
            modal.classList.remove('ely-open');
            document.body.style.overflow = '';
        }

        document.getElementById('ely-close-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('ely-open')) closeModal();
        });

        // Update button
        var updateBtn = document.getElementById('ely-update-btn');
        if (updateBtn) {
            updateBtn.addEventListener('click', function() {
                window.elysiusForceUpdate();
            });
        }

        return modal;
    }

    // ── Show modal ────────────────────────────────────────────────────────────
    function showModal() {
        var modal = document.getElementById(MODAL_ID);
        if (!modal) modal = buildModal();
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function() { modal.classList.add('ely-open'); });
    }

    // ── System Update Loader Screen ───────────────────────────────────────────
    function showSystemUpdateLoader(message) {
        var existing = document.getElementById('ely-update-loader');
        if (existing) return;

        var loaderCSS = [
            '#ely-update-loader{',
            '  position:fixed;inset:0;z-index:999999;',
            '  background:rgba(2, 4, 16, 0.98);',
            '  backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);',
            '  display:flex;flex-direction:column;align-items:center;justify-content:center;',
            '  gap:40px;',
            '}',
            '.ely-update-ui{',
            '  display:flex;flex-direction:column;align-items:center;gap:16px;',
            '  width:240px;',
            '}',
            '.ely-update-msg{',
            '  font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;',
            '  color:#E1E1E5;',
            '  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;',
            '}',
            '.ely-update-progress-bar{',
            '  width:100%;height:2px;',
            '  background:rgba(255,255,255,0.08);',
            '  border-radius:4px;overflow:hidden;',
            '}',
            '.ely-update-progress-fill{',
            '  width:0%;height:100%;',
            '  background:#2997ff;',
            '  box-shadow:0 0 10px rgba(41,151,255,0.6);',
            '  border-radius:4px;',
            '  animation:ely-progress 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;',
            '}',
            '@keyframes ely-progress{0%{width:0%}40%{width:60%}80%{width:85%}100%{width:95%}}'
        ].join('\n');

        var styleEl = document.createElement('style');
        styleEl.id = 'ely-update-loader-styles';
        styleEl.textContent = loaderCSS;
        document.head.appendChild(styleEl);

        var loader = document.createElement('div');
        loader.id = 'ely-update-loader';
        loader.innerHTML =
            '<div class="preloader-content"><span class="preloader-lambda">\u03bb</span></div>'
            + '<div class="ely-update-ui">'
            + '  <div class="ely-update-msg">' + (message || 'Updating...') + '</div>'
            + '  <div class="ely-update-progress-bar"><div class="ely-update-progress-fill"></div></div>'
            + '</div>';
        document.body.appendChild(loader);
    }

    // ── Hard Reset (Full Production) ──────────────────────────────────────────
    window.elysiusForceUpdate = async function (isLogout) {
        // Fallback garantizado: si algo falla, forzamos recarga a los 1.8s
        var fallbackTimer = setTimeout(function() {
            window.location.href = window.location.pathname + '?_t=' + Date.now();
        }, 1800);

        isLogout = !!isLogout;
        var btn = document.getElementById('ely-update-btn');
        if (btn) btn.classList.add('busy');

        var loaderMsg = isLogout
            ? (locale === 'pt' ? 'A terminar sess\u00e3o...'
             : locale === 'es' ? 'Cerrando sesi\u00f3n...'
             : 'Signing out...')
            : (locale === 'pt' ? 'A atualizar...'
             : locale === 'es' ? 'Actualizando...'
             : 'Updating...');

        showSystemUpdateLoader(loaderMsg);

        try {
            // 1. Firebase logout mediante importación dinámica
            try {
                var segments = window.location.pathname.split('/').filter(function(s) { return s && s.indexOf('.') === -1; });
                var prefix = segments.length > 0 ? '../'.repeat(segments.length) : '';
                var fbConfigPath = prefix + 'JS/firebase-config.js';
                
                var fbConfig = await import(fbConfigPath);
                if (fbConfig && fbConfig.auth) {
                    var fbAuth = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
                    await fbAuth.signOut(fbConfig.auth);
                }
            } catch(e) {
                // Ignore if Firebase is not used on this page
            }
            window.dispatchEvent(new Event('force-firebase-logout'));

            // 2. Clear all cookies
            document.cookie.split(';').forEach(function(c) {
                var name = c.replace(/^ +/, '').split('=')[0];
                var exp  = 'expires=' + new Date(0).toUTCString();
                document.cookie = name + '=;' + exp + ';path=/';
                document.cookie = name + '=;' + exp + ';path=/;domain=' + window.location.hostname;
            });

            // 3. Clear localStorage & sessionStorage
            try { localStorage.clear(); }   catch(_) {}
            try { sessionStorage.clear(); } catch(_) {}
            try { sessionStorage.setItem('sys_action', isLogout ? 'logout' : 'update'); } catch(_) {}

            // 4. Wipe IndexedDB (incl. all Firebase internal DBs)
            if (window.indexedDB) {
                var deleteDB = function(name) {
                    return new Promise(function(resolve) {
                        try {
                            var req = window.indexedDB.deleteDatabase(name);
                            req.onsuccess = resolve;
                            req.onerror   = resolve;
                            req.onblocked = resolve;
                        } catch(e) { resolve(); }
                    });
                };

                var dbsToDelete = [
                    'firebaseLocalStorageDb',
                    'firebase-heartbeat-database',
                    'firebase-installations-database'
                ];

                if (window.indexedDB.databases) {
                    try {
                        var dbs = await window.indexedDB.databases();
                        dbs.forEach(function(db) {
                            if (db.name && !dbsToDelete.includes(db.name)) {
                                dbsToDelete.push(db.name);
                            }
                        });
                    } catch(_) {}
                }

                await Promise.all(dbsToDelete.map(function(n) { return deleteDB(n); }));
            }

            // 5. Clear Cache Storage (PWA / Service Worker caches)
            if ('caches' in window) {
                try {
                    var names = await caches.keys();
                    await Promise.all(names.map(function(n) { return caches.delete(n); }));
                } catch(_) {}
            }

            // 6. Unregister all Service Workers
            if ('serviceWorker' in navigator) {
                try {
                    var regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map(function(r) { return r.unregister(); }));
                } catch(_) {}
            }

            // 7. Hard reload after a short delay
            clearTimeout(fallbackTimer);
            setTimeout(function() {
                window.location.href = window.location.pathname + '?_t=' + Date.now();
            }, 600);

        } catch(err) {
            console.error('[Elysium] forceUpdate error:', err);
            window.location.href = window.location.pathname + '?_t=' + Date.now();
        }
    };

    // ── Inject version tag into footer ────────────────────────────────────────
    function injectVersionTag() {
        if (document.querySelector('.' + VERSION_TAG_CLASS)) return;

        var footerBottoms = document.querySelectorAll('.footer-bottom');
        var container = footerBottoms.length > 0
            ? footerBottoms[footerBottoms.length - 1]
            : document.querySelector('footer');

        if (!container) return;

        var tag = document.createElement('span');
        tag.className = VERSION_TAG_CLASS;
        tag.textContent = APP_VERSION.toLowerCase();
        tag.title = locale === 'pt' ? 'Ver informa\u00e7\u00e3o do sistema'
                  : locale === 'es' ? 'Ver informaci\u00f3n del sistema'
                  : 'View system information';
        tag.setAttribute('role', 'button');
        tag.setAttribute('tabindex', '0');

        tag.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation(); showModal();
        });
        tag.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showModal(); }
        });

        // Insert as first child of footer-bottom (before the copyright span)
        if (container.firstChild) {
            container.insertBefore(tag, container.firstChild);
        } else {
            container.appendChild(tag);
        }
    }

    // ── Bootstrap ─────────────────────────────────────────────────────────────
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
