/**
* ══════════════════════════════════════════════════════════════════════════════
* Elysium λ Core Kit — Componente B: Footer Version Tag + System Info Modal
* elysium-system-info.js | v1.0.0 | Zero-dependency
*
* Unifica las 4 implementaciones detectadas (pmorais → Elysium → ONCORE →
* puravidapets) en un único componente white-label configurable por marca.
*
* Mejores prácticas fusionadas:
* · Etiqueta de versión inyectada en footer con role=button + teclado (Elysium/ONCORE)
* · Resolución de versión: config → <meta name="app-version"> → def. (nuevo, exigido
* por el estándar: la versión se extrae de la configuración del proyecto)
* · Modal seccionado: Software / Seguridad / Corporativo / Atribuciones (4/4)
* · Fila de estado de red e infraestructura conectada (health endpoint) (nuevo)
* · Hard Reset completo con fallback timer y limpieza total (4/4, mejor
* variante: espera awaited de IndexedDB de Elysium/ONCORE)
* · Logout Firebase por importación dinámica opcional (Elysium)
*
* USO (antes de </body>):
*
* <script>
* window.ELYSIUM_SYSTEM = {
* version: 'v1.4.2-build.89', // o <meta name="app-version" content="…">
* stage: 'Beta', // '' para estable
* license: 'ELY-2026-XXXX',
* brandName: 'MI MARCA',
* brandSymbolHTML: 'λ',
* accent: '#2997ff',
* theme: 'dark', // 'dark' | 'light'
* portalUrl: 'https://mimarca.com',
* supportEmail: 'info@mimarca.com',
* techEmail: 'daniel.morales@elysiumdr.eu',
* legal: { terms: 'terms.html', privacy: 'privacy.html' },
* legalFramework: 'RGPD (UE) · Ley 8968 (CR)',
* healthEndpoint: '/manifest.json', // recurso propio para medir latencia
* firebaseConfigPath: 'JS/firebase-config.js', // '' si no hay Firebase
* locale: 'es' // 'es' | 'en' | 'pt' (o autodetección)
* };
* </script>
* <script src="elysium-core/elysium-system-info.js"></script>
*
* API pública:
* window.ElysiumSystem.show() — abre el modal
* window.elysiumForceUpdate(isLogout) — pipeline de Hard Reset
* ══════════════════════════════════════════════════════════════════════════════
*/
(function () {
'use strict';

// ── Resolución de configuración ───────────────────────────────────────────
var meta = document.querySelector('meta[name="app-version"]');

var cfg = Object.assign({
version: (meta && meta.content) || 'v0.0.0',
stage: '',
license: '—',
brandName: 'ELYSIUM',
brandSymbolHTML: 'λ',
accent: '#2997ff',
theme: 'dark',
portalUrl: 'https://elysiumdr.eu',
supportEmail: 'support@elysiumdr.eu',
techEmail: 'daniel.morales@elysiumdr.eu',
devName: 'Elysium λ Development & Research',
devUrl: 'https://elysiumdr.eu',
legal: { terms: '#', privacy: '#' },
legalFramework: 'RGPD (UE) · Ley 8968 (CR)',
securityInfra: 'HSTS · CSP N3 · HMAC-SHA256',
privacyDirective: 'ePrivacy Directive · Cookie Consent v1.0',
iconEcosystem: 'Lucide Icons',
healthEndpoint: '',
firebaseConfigPath: '',
locale: null,
i18n: {} // overrides parciales por clave
}, window.ELYSIUM_SYSTEM || {});

if (window.ELYSIUM_SYSTEM && window.ELYSIUM_SYSTEM.version) {
cfg.version = window.ELYSIUM_SYSTEM.version;
}

var MODAL_ID = 'elysium-system-info-modal';
var TAG_CLASS = 'elysium-version-tag';

// ── Autodetección de idioma por ruta (/es/, /en/, /pt/) ──────────────────
var path = window.location.pathname;
var locale = cfg.locale
|| (path.indexOf('/pt/') !== -1 || /\/pt$/.test(path) ? 'pt'
: path.indexOf('/en/') !== -1 || /\/en$/.test(path) || path.indexOf('index-en') !== -1 ? 'en'
: 'es');

// ── i18n base (overrides vía cfg.i18n) ───────────────────────────────────
var STRINGS = {
es: {
subtitle: 'INFORMACIÓN DEL SISTEMA', secSoftware: 'Especificaciones de Software',
labelVersion: 'Versión de Interfaz', labelBuild: 'Compilación (Build)',
labelLicense: 'Licencia del Producto', btnUpdate: 'Actualizar',
secSecurity: 'Seguridad y Conformidad', labelPrivDir: 'Directiva de Privacidad',
labelInfra: 'Infraestructura de Seguridad', labelLegal: 'Marco Legal',
labelTerms: 'Términos y Condiciones', labelPrivacy: 'Política de Privacidad',
viewDoc: 'Ver documento', secStatus: 'Estado de la Infraestructura',
labelNetwork: 'Conexión de Red', online: 'En línea', offline: 'Sin conexión',
labelLatency: 'Latencia del Servicio', measuring: 'Midiendo…', unavailable: 'No disponible',
secCorp: 'Información Corporativa', labelOrg: 'Organización',
labelPortal: 'Portal Web', labelSupport: 'Canal de Soporte', labelTech: 'Soporte Técnico',
secAttrib: 'Atribuciones de Software', labelIcons: 'Ecosistema de Iconos',
secSettings: 'Ajustes del Sistema',
labelAccText: 'Tamaño del texto', optTextStd: 'Estándar · 100 %', optTextLg: 'Ampliado · 112,5 %',
labelAccMotion: 'Movimiento', optMotSys: 'Seguir el sistema', optMotRed: 'Reducir movimiento',
labelAccContrast: 'Contraste', optConStd: 'Estándar', optConEnh: 'Reforzado',
devBy: 'Desarrollado por', close: 'Cerrar',
updating: 'Actualizando…', signingOut: 'Cerrando sesión…',
tagTitle: 'Ver información del sistema'
},
en: {
subtitle: 'SYSTEM INFORMATION', secSoftware: 'Software Specifications',
labelVersion: 'Interface Version', labelBuild: 'Build Compilation',
labelLicense: 'Product License', btnUpdate: 'Update',
secSecurity: 'Security & Compliance', labelPrivDir: 'Privacy Directive',
labelInfra: 'Security Infrastructure', labelLegal: 'Legal Framework',
labelTerms: 'Terms & Conditions', labelPrivacy: 'Privacy Policy',
viewDoc: 'View document', secStatus: 'Infrastructure Status',
labelNetwork: 'Network Connection', online: 'Online', offline: 'Offline',
labelLatency: 'Service Latency', measuring: 'Measuring…', unavailable: 'Unavailable',
secCorp: 'Corporate Information', labelOrg: 'Organization',
labelPortal: 'Web Portal', labelSupport: 'Support Channel', labelTech: 'Technical Support',
secAttrib: 'Software Attributions', labelIcons: 'Icon Ecosystem',
secSettings: 'System Settings',
labelAccText: 'Text Size', optTextStd: 'Standard · 100%', optTextLg: 'Large · 112.5%',
labelAccMotion: 'Motion', optMotSys: 'Follow system', optMotRed: 'Reduce motion',
labelAccContrast: 'Contrast', optConStd: 'Standard', optConEnh: 'Enhanced',
devBy: 'Developed by', close: 'Close',
updating: 'Updating…', signingOut: 'Signing out…',
tagTitle: 'View system information'
},
pt: {
subtitle: 'INFORMAÇÃO DO SISTEMA', secSoftware: 'Especificações de Software',
labelVersion: 'Versão da Interface', labelBuild: 'Compilação (Build)',
labelLicense: 'Licença do Produto', btnUpdate: 'Atualizar',
secSecurity: 'Segurança e Conformidade', labelPrivDir: 'Diretiva de Privacidade',
labelInfra: 'Infraestrutura de Segurança', labelLegal: 'Quadro Legal',
labelTerms: 'Termos e Condições', labelPrivacy: 'Política de Privacidade',
viewDoc: 'Ver documento', secStatus: 'Estado da Infraestrutura',
labelNetwork: 'Ligação de Rede', online: 'Online', offline: 'Sem ligação',
labelLatency: 'Latência do Serviço', measuring: 'A medir…', unavailable: 'Indisponível',
secCorp: 'Informação Corporativa', labelOrg: 'Organização',
labelPortal: 'Portal Web', labelSupport: 'Canal de Apoio', labelTech: 'Suporte Técnico',
secAttrib: 'Atribuições de Software', labelIcons: 'Ecossistema de Ícones',
secSettings: 'Ajustes do Sistema',
labelAccText: 'Tamanho do texto', optTextStd: 'Padrão · 100 %', optTextLg: 'Ampliado · 112,5 %',
labelAccMotion: 'Movimento', optMotSys: 'Seguir o sistema', optMotRed: 'Reduzir movimento',
labelAccContrast: 'Contraste', optConStd: 'Padrão', optConEnh: 'Reforçado',
devBy: 'Desenvolvido por', close: 'Fechar',
updating: 'A atualizar…', signingOut: 'A terminar sessão…',
tagTitle: 'Ver informação do sistema'
}
};

var t = Object.assign({}, STRINGS[locale] || STRINGS.es, cfg.i18n);

// ── Paletas por tema ──────────────────────────────────────────────────────
var P = cfg.theme === 'light'
? { bg: '#FFFFFF', card: '#FBFAF8', text: '#1D1D1F', dim: '#6E6E73',
line: 'rgba(0,0,0,.08)', groupBg: '#FFFFFF',
overlay: 'rgba(30,30,35,.45)' }
: { bg: '#0E1220', card: 'rgba(16,24,44,.92)', text: '#E1E1E5', dim: '#A0A5B5',
line: 'rgba(255,255,255,.07)', groupBg: 'rgba(255,255,255,.03)',
overlay: 'rgba(2,4,16,.6)' };

// ── Fecha de build a partir de document.lastModified ──────────────────────
function getBuildDate() {
var d = new Date(document.lastModified);
if (!isNaN(d.getTime()) && d.getFullYear() > 2000) {
return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
return '—';
}

// ── Estilos ───────────────────────────────────────────────────────────────
function injectStyles() {
if (document.getElementById(MODAL_ID + '-styles')) return;

var css = [
'.' + TAG_CLASS + '{',
' display:inline-flex;align-items:center;justify-content:center;gap:6px;',
' padding:4px 12px;font-size:.68rem;',
' font-family:"SF Mono",Menlo,Consolas,monospace;',
' color:' + P.dim + ';background:' + P.groupBg + ';',
' border:1px solid ' + P.line + ';border-radius:999px;',
' cursor:pointer;letter-spacing:.06em;transition:all .2s ease;',
'}',
'.' + TAG_CLASS + ':hover,.' + TAG_CLASS + ':focus-visible{',
' color:' + cfg.accent + ';border-color:' + cfg.accent + ';outline:none;',
'}',
'#' + MODAL_ID + '{',
' position:fixed;inset:0;z-index:99999;background:' + P.overlay + ';',
' backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);',
' display:flex;justify-content:center;align-items:center;padding:16px;',
' opacity:0;pointer-events:none;transition:opacity .25s ease;',
'}',
'#' + MODAL_ID + '.ely-open{opacity:1;pointer-events:all;}',
'.ely-sys-card{',
' position:relative;width:100%;max-width:420px;max-height:88vh;',
' background:' + P.card + ';border-radius:16px;',
' border:1px solid ' + P.line + ';color:' + P.text + ';',
' box-shadow:0 24px 70px -30px rgba(0,0,0,.55);',
' display:flex;flex-direction:column;overflow:hidden;',
' font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
' transform:translateY(18px) scale(.97);',
' transition:transform .28s cubic-bezier(.34,1.56,.64,1);',
'}',
'#' + MODAL_ID + '.ely-open .ely-sys-card{transform:translateY(0) scale(1);}',
'.ely-sys-close{',
' position:absolute;top:14px;right:14px;z-index:2;width:28px;height:28px;',
' border-radius:50%;border:1px solid ' + P.line + ';',
' background:transparent;color:' + P.dim + ';cursor:pointer;font-size:.7rem;',
' display:flex;align-items:center;justify-content:center;transition:all .2s;',
'}',
'.ely-sys-close:hover{background:' + cfg.accent + ';color:#fff;border-color:' + cfg.accent + ';}',
'.ely-sys-head{padding:28px 24px 16px;text-align:center;}',
'.ely-sys-symbol{font-size:2rem;font-weight:700;color:' + cfg.accent + ';line-height:1;margin-bottom:6px;}',
'.ely-sys-head h2{margin:0;font-size:1.2rem;font-weight:800;letter-spacing:.08em;}',
'.ely-sys-subtitle{font-size:.6rem;letter-spacing:.16em;color:' + P.dim + ';margin-top:4px;font-weight:600;}',
'.ely-sys-body{padding:0 0 10px;overflow-y:auto;flex:1;}',
'.ely-sys-label{display:block;font-size:.74rem;color:' + P.dim + ';font-weight:600;}',
'.ely-sys-val{display:block;font-size:.8rem;color:' + P.text + ';margin-top:2px;font-weight:500;}',
'.ely-sys-select{appearance:none;background:' + P.bg + ';color:' + P.text + ';border:1px solid ' + P.line + ';border-radius:6px;padding:4px 8px;font-size:14px;outline:none;cursor:pointer;font-family:inherit;width:120px;text-align:right;}',
'.ely-sys-select:focus-visible{border-color:' + cfg.accent + ';}',
'.ely-status-dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0;}',
'.ely-status-dot.ok{background:#34C759;box-shadow:0 0 6px rgba(52,199,89,.6);}',
'.ely-status-dot.ko{background:#FF453A;box-shadow:0 0 6px rgba(255,69,58,.6);}',
'.ely-sec-label{',
' padding:18px 26px 6px;font-size:.6rem;letter-spacing:.13em;color:' + P.dim + ';',
' font-weight:700;text-transform:uppercase;',
'}',
'.ely-sys-group{',
' margin:0 16px;background:' + P.groupBg + ';',
' border:1px solid ' + P.line + ';border-radius:12px;overflow:hidden;',
'}',
'.ely-sys-row{',
' display:flex;justify-content:space-between;align-items:center;gap:12px;',
' padding:12px 16px;border-top:1px solid ' + P.line + ';font-size:.82rem;',
'}',
'.ely-sys-row:first-of-type{border-top:none;}',
'.ely-stage-badge{',
' display:inline-block;padding:1px 8px;background:' + cfg.accent + ';color:#fff;',
' border-radius:999px;font-size:.58rem;font-weight:700;letter-spacing:.08em;',
' text-transform:uppercase;vertical-align:middle;',
'}',
'.ely-update-btn{',
' border:1px solid ' + cfg.accent + ';color:' + cfg.accent + ';background:transparent;',
' border-radius:999px;padding:3px 12px;font-size:.68rem;font-weight:600;',
' cursor:pointer;transition:all .2s;font-family:inherit;',
'}',
'.ely-update-btn:hover{background:' + cfg.accent + ';color:#fff;}',
'.ely-update-btn.busy{opacity:.45;pointer-events:none;}',
'.ely-sys-foot{',
' padding:16px 26px 20px;text-align:center;border-top:1px solid ' + P.line + ';',
' font-size:.68rem;color:' + P.dim + ';line-height:1.7;',
'}',
'.ely-sys-foot a{color:' + cfg.accent + ';text-decoration:none;font-weight:600;}',
/* Loader de sistema (actualización / logout) */
'#ely-sys-loader{',
' position:fixed;inset:0;z-index:999999;background:' + P.bg + ';',
' display:flex;flex-direction:column;align-items:center;justify-content:center;gap:32px;',
'}',
'.ely-sys-loader-symbol{font-size:2.6rem;color:' + cfg.accent + ';',
' animation:ely-sys-pulse 1.5s ease-in-out infinite;}',
'.ely-sys-loader-ui{display:flex;flex-direction:column;align-items:center;gap:14px;width:240px;}',
'.ely-sys-loader-msg{font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;',
' color:' + P.text + ';font-weight:600;text-align:center;}',
'.ely-sys-loader-bar{width:100%;height:2px;background:' + P.line + ';border-radius:2px;overflow:hidden;}',
'.ely-sys-loader-fill{width:0%;height:100%;background:' + cfg.accent + ';border-radius:2px;',
' animation:ely-sys-progress 1.5s cubic-bezier(.4,0,.2,1) forwards;}',
'@keyframes ely-sys-progress{0%{width:0%}40%{width:60%}80%{width:85%}100%{width:95%}}',
'@keyframes ely-sys-pulse{0%,100%{opacity:.6;transform:scale(.95)}50%{opacity:1;transform:scale(1.05)}}'
].join('\n');
var style = document.createElement('style');
style.id = MODAL_ID + '-styles';
style.textContent = css;
document.head.appendChild(style);
}

// ── Helpers de filas ──────────────────────────────────────────────────────
function row(label, valueHTML) {
return '<div class="ely-sys-row"><span class="ely-sys-label">' + label
+ '</span><span class="ely-sys-val">' + valueHTML + '</span></div>';
}
function linkRow(label, href, val, mono) {
var c = mono ? 'class="ely-sys-val" style="font-family:monospace;letter-spacing:0;"' : 'class="ely-sys-val"';
return '<div class="ely-sys-row"><span class="ely-sys-label">' + label + '</span>'
+ '<a href="' + href + '" ' + c + ' style="color:' + cfg.accent + ';text-decoration:none;" target="_blank" rel="noopener noreferrer">' + val + '</a></div>';
}

function selectRow(label, id, options) {
var optsHtml = options.map(function(opt) {
return '<option value="' + opt.val + '">' + opt.text + '</option>';
}).join('');
return '<div class="ely-sys-row" style="align-items:center;">'
+ '<span class="ely-sys-label">' + label + '</span>'
+ '<select id="' + id + '" class="ely-sys-select">' + optsHtml + '</select>'
+ '</div>';
}

// ── Telemetría: red + latencia contra healthEndpoint ─────────────────────
function renderStatus() {
var netDot = document.getElementById('ely-net-dot');
var netVal = document.getElementById('ely-net-val');
var latVal = document.getElementById('ely-lat-val');
if (!netDot) return;

var online = navigator.onLine;
netDot.className = 'ely-status-dot ' + (online ? 'ok' : 'ko');
netVal.textContent = online ? t.online : t.offline;

if (!latVal) return;
if (!online || !cfg.healthEndpoint) {
latVal.textContent = online ? '—' : t.unavailable;
return;
}

latVal.textContent = t.measuring;
var t0 = performance.now();
fetch(cfg.healthEndpoint, { method: 'HEAD', cache: 'no-store' })
.then(function (r) {
var ms = Math.round(performance.now() - t0);
latVal.textContent = r.ok ? ms + ' ms' : t.unavailable;
})
.catch(function () { latVal.textContent = t.unavailable; });
}

// ── Construcción del modal ────────────────────────────────────────────────
function buildModal() {
var modal = document.createElement('div');
modal.id = MODAL_ID;
modal.setAttribute('role', 'dialog');
modal.setAttribute('aria-modal', 'true');
modal.setAttribute('aria-label', t.subtitle);

var stageBadge = cfg.stage ? ' <span class="ely-stage-badge">' + cfg.stage + '</span>' : '';
var statusSection = ''
+ '<div class="ely-sec-label">' + t.secStatus + '</div>'
+ '<div class="ely-sys-group">'
+ row(t.labelNetwork, '<span class="ely-status-dot ok" id="ely-net-dot"></span><span id="ely-net-val">…</span>')
+ (cfg.healthEndpoint ? row(t.labelLatency, '<span id="ely-lat-val">…</span>') : '')
+ '</div>';

modal.innerHTML =
'<div class="ely-sys-card">'
+ '<button class="ely-sys-close" id="ely-sys-close" aria-label="' + t.close + '">✕</button>'
+ '<div class="ely-sys-head">'
+ '<div class="ely-sys-symbol">' + cfg.brandSymbolHTML + '</div>'
+ '<h2>' + cfg.brandName + '</h2>'
+ '<div class="ely-sys-subtitle">' + t.subtitle + '</div>'
+ '</div>'
+ '<div class="ely-sys-body">'
+ '<div class="ely-sec-label">' + t.secSoftware + '</div>'
+ '<div class="ely-sys-group">'
+ row(t.labelVersion, cfg.version + stageBadge
+ '&nbsp;<button class="ely-update-btn" id="ely-update-btn">' + t.btnUpdate + '</button>')
+ row(t.labelBuild, getBuildDate())
+ row(t.labelLicense, cfg.license)
+ '</div>'
+ '<div class="ely-sec-label">' + t.secSettings + '</div>'
+ '<div class="ely-sys-group">'
+ selectRow(t.labelAccText, 'ely-set-text', [{val: 'standard', text: t.optTextStd}, {val: 'large', text: t.optTextLg}])
+ selectRow(t.labelAccMotion, 'ely-set-motion', [{val: 'system', text: t.optMotSys}, {val: 'reduced', text: t.optMotRed}])
+ selectRow(t.labelAccContrast, 'ely-set-contrast', [{val: 'standard', text: t.optConStd}, {val: 'enhanced', text: t.optConEnh}])
+ '</div>'
+ statusSection
+ '<div class="ely-sec-label">' + t.secSecurity + '</div>'
+ '<div class="ely-sys-group">'
+ row(t.labelPrivDir, cfg.privacyDirective)
+ row(t.labelInfra, cfg.securityInfra)
+ row(t.labelLegal, cfg.legalFramework)
+ linkRow(t.labelTerms, cfg.legal.terms, t.viewDoc)
+ linkRow(t.labelPrivacy, cfg.legal.privacy, t.viewDoc)
+ '</div>'
+ '<div class="ely-sec-label">' + t.secCorp + '</div>'
+ '<div class="ely-sys-group">'
+ row(t.labelOrg, cfg.brandName)
+ linkRow(t.labelPortal, cfg.portalUrl, cfg.portalUrl.replace(/^https?:\/\//, ''), true)
+ linkRow(t.labelSupport, 'mailto:' + cfg.supportEmail, cfg.supportEmail)
+ linkRow(t.labelTech, 'mailto:' + cfg.techEmail, cfg.techEmail)
+ '</div>'
+ '<div class="ely-sec-label">' + t.secAttrib + '</div>'
+ '<div class="ely-sys-group">'
+ row(t.labelIcons, cfg.iconEcosystem)
+ '</div>'
+ '</div>'
+ '<div class="ely-sys-foot">'
+ t.devBy + ' <a href="' + cfg.devUrl + '" target="_blank" rel="noopener noreferrer">' + cfg.devName + '</a>.<br>'
+ '© ' + new Date().getFullYear() + ' ' + cfg.brandName + '.'
+ '</div>'
+ '</div>';

document.body.appendChild(modal);

function closeModal() {
modal.classList.remove('ely-open');
document.body.style.overflow = '';
}
document.getElementById('ely-sys-close').addEventListener('click', closeModal);
modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', function (e) {
if (e.key === 'Escape' && modal.classList.contains('ely-open')) closeModal();
});

document.getElementById('ely-update-btn').addEventListener('click', function () {
this.classList.add('busy');
window.elysiumForceUpdate(false);
});

return modal;
}

function bindSettings() {
if (!window.ElysiumSettings) return;
var cur = window.ElysiumSettings.get();
var textSel = document.getElementById('ely-set-text');
var motionSel = document.getElementById('ely-set-motion');
var contrastSel = document.getElementById('ely-set-contrast');
if (textSel) textSel.value = cur.text;
if (motionSel) motionSel.value = cur.motion;
if (contrastSel) contrastSel.value = cur.contrast;
function update() {
window.ElysiumSettings.set({
text: textSel ? textSel.value : 'standard',
motion: motionSel ? motionSel.value : 'system',
contrast: contrastSel ? contrastSel.value : 'standard'
});
}
if (textSel) textSel.addEventListener('change', update);
if (motionSel) motionSel.addEventListener('change', update);
if (contrastSel) contrastSel.addEventListener('change', update);
}

function showModal() {
injectStyles();
var modal = document.getElementById(MODAL_ID) || buildModal();
document.body.style.overflow = 'hidden';
requestAnimationFrame(function () {
modal.classList.add('ely-open');
renderStatus();
bindSettings();
});
}

// ── Loader de sistema ─────────────────────────────────────────────────────
function showSystemLoader(message) {
if (document.getElementById('ely-sys-loader')) return;
injectStyles();
var loader = document.createElement('div');
loader.id = 'ely-sys-loader';
loader.setAttribute('role', 'status');
loader.setAttribute('aria-live', 'polite');
loader.innerHTML =
'<div class="ely-sys-loader-symbol">' + cfg.brandSymbolHTML + '</div>'
+ '<div class="ely-sys-loader-ui">'
+ ' <div class="ely-sys-loader-msg">' + message + '</div>'
+ ' <div class="ely-sys-loader-bar"><div class="ely-sys-loader-fill"></div></div>'
+ '</div>';
document.body.appendChild(loader);
}

function cleanReload() {
window.location.href = window.location.pathname + '?_t=' + Date.now();
}

// ── HARD RESET ────────────────────────────────────────────────────────────
// elysiumForceUpdate(false) → actualización · elysiumForceUpdate(true) → logout
window.elysiumForceUpdate = async function (isLogout) {
isLogout = !!isLogout;
showSystemLoader(isLogout ? t.signingOut : t.updating);

// Temporizador de seguridad: recarga obligatoria a los 1.8 s si algo bloquea
var fallback = setTimeout(cleanReload, 1800);

try {
// 1. Logout Firebase (opcional, por importación dinámica)
if (cfg.firebaseConfigPath) {
try {
var fb = await import(cfg.firebaseConfigPath);
if (fb && fb.auth) {
var fbAuth = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
await fbAuth.signOut(fb.auth);
}
} catch (_) { /* la página no usa Firebase */ }
}
window.dispatchEvent(new Event('force-firebase-logout'));

// 2. Cookies — expiración en raíz y dominio actual
document.cookie.split(';').forEach(function (c) {
var eq = c.indexOf('=');
var name = (eq > -1 ? c.substr(0, eq) : c).trim();
var exp = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
document.cookie = name + '=;' + exp + ';path=/';
document.cookie = name + '=;' + exp + ';path=/;domain=' + window.location.hostname;
});

// 3. Storages (sys_action sobrevive para que el preloader informe la acción)
try { localStorage.clear(); } catch (_) {}
try { sessionStorage.clear(); } catch (_) {}
try { sessionStorage.setItem('sys_action', isLogout ? 'logout' : 'update'); } catch (_) {}

// 4. IndexedDB — borrado awaited de todas las bases (incl. internas de Firebase)
if (window.indexedDB) {
var deleteDB = function (name) {
return new Promise(function (resolve) {
try {
var req = window.indexedDB.deleteDatabase(name);
req.onsuccess = req.onerror = req.onblocked = resolve;
} catch (_) { resolve(); }
});
};
var known = ['firebaseLocalStorageDb', 'firebase-heartbeat-database', 'firebase-installations-database'];
if (typeof window.indexedDB.databases === 'function') {
try {
var dbs = await window.indexedDB.databases();
dbs.forEach(function (db) {
if (db && db.name && known.indexOf(db.name) === -1) known.push(db.name);
});
} catch (_) {}
}
await Promise.all(known.map(deleteDB));
}

// 5. Cache Storage (PWA)
if ('caches' in window) {
try {
var names = await caches.keys();
await Promise.all(names.map(function (n) { return caches.delete(n); }));
} catch (_) {}
}

// 6. Service Workers
if ('serviceWorker' in navigator) {
try {
var regs = await navigator.serviceWorker.getRegistrations();
await Promise.all(regs.map(function (r) { return r.unregister(); }));
} catch (_) {}
}

// 7. Recarga limpia (600 ms para que la barra de progreso sea visible)
clearTimeout(fallback);
setTimeout(cleanReload, 600);
} catch (err) {
clearTimeout(fallback);
cleanReload();
}
};

// ── Inyección de la etiqueta en el footer ─────────────────────────────────
function injectVersionTag() {
if (document.querySelector('.' + TAG_CLASS)) return;

var container = document.querySelector('.footer-bottom-inner')
|| document.querySelector('.footer-bottom')
|| document.querySelector('footer');

if (!container) return;

var tag = document.createElement('span');
tag.className = TAG_CLASS;
tag.textContent = cfg.version.toLowerCase() + (cfg.stage ? ' ' + cfg.stage.toLowerCase() : '');
tag.title = t.tagTitle;
tag.setAttribute('role', 'button');
tag.setAttribute('tabindex', '0');
tag.setAttribute('aria-haspopup', 'dialog');

tag.addEventListener('click', function (e) { e.preventDefault(); showModal(); });
tag.addEventListener('keydown', function (e) {
if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showModal(); }
});

if (container.firstChild) container.insertBefore(tag, container.firstChild);
else container.appendChild(tag);
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

// ── API pública ───────────────────────────────────────────────────────────
window.ElysiumSystem = {
show: showModal,
showLoader: showSystemLoader,
version: cfg.version
};

})();
