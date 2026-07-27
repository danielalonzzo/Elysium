/**
* ══════════════════════════════════════════════════════════════════════════════
* Elysium λ Core Kit — Componente C: Consentimiento de Cookies y Cumplimiento
* elysium-compliance.js | v1.0.0 | Zero-dependency
*
* Base: implementación granular de pmorais (mejor práctica interna 2/6),
* generalizada como white-label y ampliada con:
* · Registro de consentimiento versionado con timestamp ISO (prueba de
* consentimiento explícito — Art. 7 RGPD / Art. 5 Ley 8968 CR)
* · Re-solicitud automática cuando cambia CONSENT_VERSION
* · Categorías configurables (esenciales + analíticas + marketing…)
* · Gating de scripts de terceros: <script type="text/plain"
* data-consent="analytics" data-src="…"> solo se activa tras el opt-in
* · API de derechos ARCO: purga de datos local (derecho de supresión)
*
* USO (antes de </body>):
*
* <script>
* window.ELYSIUM_CONSENT = {
* storageKey: 'mimarca_cookie_consent',
* consentVersion: '1.0',
* accent: '#2997ff',
* privacyUrl: '/privacy.html',
* locale: 'es',
* categories: [
* { id: 'analytics', labelKey: 'analytics' }
* // añadir p. ej. { id:'marketing', label:'Marketing', desc:'…' }
* ]
* };
* </script>
* <script src="elysium-core/elysium-compliance.js"></script>
*
* API pública (window.ElysiumConsent):
* .get() → registro completo o null
* .isGranted('analytics')→ boolean
* .onGranted(cat, cb) → ejecuta cb ahora o cuando se otorgue
* .open() → reabre el gestor de preferencias (footer "Cookies")
* .purgeLocalData() → borrado local completo (derecho de supresión)
* ══════════════════════════════════════════════════════════════════════════════
*/
(function () {
'use strict';

var cfg = Object.assign({
storageKey: 'elysium_cookie_consent',
consentVersion: '1.0',
accent: '#2997ff',
surface: '#16181D',
text: '#F5F5F7',
dim: '#A1A1A6',
privacyUrl: '/privacy.html',
locale: null,
categories: [{ id: 'analytics', labelKey: 'analytics' }],
i18n: {}
}, window.ELYSIUM_CONSENT || {});

// ── Autodetección de idioma ───────────────────────────────────────────────
var path = window.location.pathname;
var locale = cfg.locale
|| (path.indexOf('/pt/') !== -1 ? 'pt'
: path.indexOf('/en/') !== -1 || /\/en$/.test(path) ? 'en'
: 'es');

var STRINGS = {
es: {
title: 'Utilizamos cookies 🍪',
body: 'Usamos cookies esenciales para el funcionamiento del sitio y, con su consentimiento, cookies opcionales para mejorar su experiencia. Puede gestionar sus preferencias en cualquier momento.',
acceptAll: 'Aceptar todas', rejectAll: 'Rechazar no esenciales',
manage: 'Gestionar preferencias', manageTitle: 'Preferencias de Cookies',
essential: 'Cookies esenciales',
essentialDesc: 'Necesarias para el funcionamiento del sitio. No pueden desactivarse.',
analytics: 'Cookies analíticas',
analyticsDesc: 'Nos ayudan a entender cómo utiliza el sitio. Solo se activan con su consentimiento.',
savePrefs: 'Guardar preferencias', privacyText: 'Política de Privacidad',
legalNote: 'Conforme al RGPD (UE) 2016/679 y a la Ley N.º 8968 (Costa Rica).'
},
en: {
title: 'We use cookies 🍪',
body: 'We use essential cookies for the website to function and, with your consent, optional cookies to improve your experience. You can manage your preferences at any time.',
acceptAll: 'Accept All', rejectAll: 'Reject Non-Essential',
manage: 'Manage Preferences', manageTitle: 'Cookie Preferences',
essential: 'Essential Cookies',
essentialDesc: 'Required for the website to function. Cannot be disabled.',
analytics: 'Analytics Cookies',
analyticsDesc: 'Help us understand how you use the site. Only activated with your consent.',
savePrefs: 'Save Preferences', privacyText: 'Privacy Policy',
legalNote: 'Compliant with GDPR (EU) 2016/679 and Law No. 8968 (Costa Rica).'
},
pt: {
title: 'Utilizamos cookies 🍪',
body: 'Usamos cookies essenciais para o funcionamento do site e, com o seu consentimento, cookies opcionais para melhorar a sua experiência. Pode gerir as suas preferências a qualquer momento.',
acceptAll: 'Aceitar Todos', rejectAll: 'Rejeitar Não Essenciais',
manage: 'Gerir Preferências', manageTitle: 'Preferências de Cookies',
essential: 'Cookies Essenciais',
essentialDesc: 'Necessários para o funcionamento do site. Não podem ser desativados.',
analytics: 'Cookies Analíticos',
analyticsDesc: 'Ajudam-nos a perceber como utiliza o site. Só são ativados com o seu consentimento.',
savePrefs: 'Guardar Preferências', privacyText: 'Política de Privacidade',
legalNote: 'Em conformidade com o RGPD (UE) 2016/679 e a Lei N.º 8968 (Costa Rica).'
}
};

var t = Object.assign({}, STRINGS[locale] || STRINGS.es, cfg.i18n);
var grantCallbacks = {}; // { categoria: [callbacks] }

// ── Persistencia del consentimiento ───────────────────────────────────────
/** Devuelve el registro de consentimiento vigente o null si no existe /
* pertenece a una versión anterior de la política. */
function getConsent() {
try {
var raw = localStorage.getItem(cfg.storageKey);
if (!raw) return null;
var data = JSON.parse(raw);
if (data.version !== cfg.consentVersion) return null;
return data;
} catch (_) { return null; }
}

/** Guarda el registro con versión + timestamp (prueba de consentimiento). */
function saveConsent(categories) {
var data = {
version: cfg.consentVersion,
timestamp: new Date().toISOString(),
essential: true,
categories: categories
};
try { localStorage.setItem(cfg.storageKey, JSON.stringify(data)); } catch (_) {}
applyConsent(data);
return data;
}

function isGranted(cat) {
var c = getConsent();
return !!(c && c.categories && c.categories[cat]);
}

// ── Activación de scripts condicionados ───────────────────────────────────
// Los scripts de terceros se declaran inertes en el HTML:
// <script type="text/plain" data-consent="analytics" data-src="https://…"></script>
// <script type="text/plain" data-consent="analytics">/* inline */</script>
function activateGatedScripts(cat) {
var gated = document.querySelectorAll('script[type="text/plain"][data-consent="' + cat + '"]');
gated.forEach(function (old) {
var s = document.createElement('script');
if (old.dataset.src) { s.src = old.dataset.src; s.async = true; }
else { s.textContent = old.textContent; }
old.parentNode.replaceChild(s, old);
});
}

function applyConsent(data) {
Object.keys(data.categories || {}).forEach(function (cat) {
if (!data.categories[cat]) return;
activateGatedScripts(cat);
(grantCallbacks[cat] || []).forEach(function (cb) {
try { cb(); } catch (_) {}
});
grantCallbacks[cat] = [];
});
}

// ── Estilos ───────────────────────────────────────────────────────────────
function injectStyles() {
if (document.getElementById('ely-consent-styles')) return;

var css = [
'#ely-cookie-banner{',
' position:fixed;bottom:0;left:0;right:0;z-index:99998;',
' background:' + cfg.surface + ';border-top:1px solid ' + cfg.accent + '40;',
' padding:20px 24px;box-shadow:0 -8px 40px rgba(0,0,0,.5);',
' font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
' animation:ely-slide-up .4s cubic-bezier(.16,1,.3,1);',
'}',
'@keyframes ely-slide-up{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}',
'#ely-cookie-banner .ely-ck-inner{',
' max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:20px;flex-wrap:wrap;',
'}',
'#ely-cookie-banner .ely-ck-text{flex:1;min-width:260px;}',
'#ely-cookie-banner h3{color:' + cfg.accent + ';font-size:1rem;font-weight:700;margin:0 0 6px;}',
'#ely-cookie-banner p{color:' + cfg.dim + ';font-size:.82rem;margin:0;line-height:1.5;}',
'#ely-cookie-banner a{color:' + cfg.accent + ';text-decoration:underline;}',
'#ely-cookie-banner .ely-ck-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;flex-shrink:0;}',
'.ely-ck-btn{',
' padding:10px 20px;border-radius:50px;font-size:.8rem;font-weight:700;cursor:pointer;',
' border:none;transition:all .2s ease;white-space:nowrap;letter-spacing:.04em;',
'}',
'.ely-ck-accept{background:' + cfg.accent + ';color:#fff;}',
'.ely-ck-accept:hover{filter:brightness(1.1);transform:translateY(-1px);}',
'.ely-ck-reject{background:transparent;color:' + cfg.dim + ';border:1px solid rgba(255,255,255,.15);}',
'.ely-ck-reject:hover{border-color:rgba(255,255,255,.35);color:' + cfg.text + ';}',
'.ely-ck-manage{background:transparent;color:' + cfg.dim + ';border:1px solid rgba(255,255,255,.1);font-size:.72rem;}',
'.ely-ck-manage:hover{border-color:' + cfg.accent + ';color:' + cfg.accent + ';}',
'#ely-cookie-modal{',
' display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.75);',
' backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:16px;',
'}',
'#ely-cookie-modal.open{display:flex;}',
'#ely-cookie-modal .ely-ck-box{',
' background:' + cfg.surface + ';border:1px solid ' + cfg.accent + '30;',
' border-radius:20px;padding:32px;max-width:500px;width:100%;',
' box-shadow:0 20px 60px rgba(0,0,0,.6);',
' font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
'}',
'#ely-cookie-modal h3{color:' + cfg.accent + ';font-size:1.1rem;font-weight:700;margin:0 0 20px;}',
'.ely-pref-row{',
' display:flex;align-items:flex-start;justify-content:space-between;gap:16px;',
' padding:14px 0;border-bottom:1px solid rgba(255,255,255,.06);',
'}',
'.ely-pref-row:last-of-type{border-bottom:none;}',
'.ely-pref-label strong{display:block;color:' + cfg.text + ';font-size:.9rem;font-weight:600;margin-bottom:4px;}',
'.ely-pref-label span{color:' + cfg.dim + ';font-size:.78rem;line-height:1.4;}',
'.ely-toggle{position:relative;flex-shrink:0;width:44px;height:24px;}',
'.ely-toggle input{opacity:0;width:0;height:0;}',
'.ely-toggle-slider{',
' position:absolute;inset:0;background:rgba(255,255,255,.1);border-radius:24px;',
' cursor:pointer;transition:.3s;',
'}',
'.ely-toggle-slider:before{',
' content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;',
' background:#fff;border-radius:50%;transition:.3s;',
'}',
'.ely-toggle input:checked + .ely-toggle-slider{background:' + cfg.accent + ';}',
'.ely-toggle input:checked + .ely-toggle-slider:before{transform:translateX(20px);}',
'.ely-toggle input:disabled + .ely-toggle-slider{opacity:.4;cursor:not-allowed;}',
'.ely-ck-modal-actions{margin-top:24px;display:flex;gap:10px;justify-content:flex-end;}',
'.ely-ck-legal-note{margin-top:16px;font-size:.68rem;color:' + cfg.dim + ';opacity:.75;line-height:1.5;}',
'@media (max-width:600px){',
' #ely-cookie-banner .ely-ck-inner{flex-direction:column;align-items:flex-start;}',
' #ely-cookie-banner .ely-ck-actions{width:100%;}',
' #ely-cookie-banner .ely-ck-btn{flex:1;text-align:center;}',
'}'
].join('\n');
var style = document.createElement('style');
style.id = 'ely-consent-styles';
style.textContent = css;
document.head.appendChild(style);
}

// ── Banner ────────────────────────────────────────────────────────────────
function buildBanner() {
var banner = document.createElement('div');
banner.id = 'ely-cookie-banner';
banner.setAttribute('role', 'dialog');
banner.setAttribute('aria-label', t.title);
banner.innerHTML =
'<div class="ely-ck-inner">'
+ '<div class="ely-ck-text">'
+ '<h3>' + t.title + '</h3>'
+ '<p>' + t.body + ' <a href="' + cfg.privacyUrl + '" target="_blank" rel="noopener">' + t.privacyText + '</a>.</p>'
+ '</div>'
+ '<div class="ely-ck-actions">'
+ '<button class="ely-ck-btn ely-ck-accept" id="ely-ck-accept">' + t.acceptAll + '</button>'
+ '<button class="ely-ck-btn ely-ck-reject" id="ely-ck-reject">' + t.rejectAll + '</button>'
+ '<button class="ely-ck-btn ely-ck-manage" id="ely-ck-manage">' + t.manage + '</button>'
+ '</div>'
+ '</div>';
return banner;
}

// ── Modal de preferencias ─────────────────────────────────────────────────
function buildModal() {
var rows = ''
+ '<div class="ely-pref-row">'
+ '<div class="ely-pref-label"><strong>' + t.essential + '</strong><span>' + t.essentialDesc + '</span></div>'
+ '<label class="ely-toggle"><input type="checkbox" checked disabled><span class="ely-toggle-slider"></span></label>'
+ '</div>';

cfg.categories.forEach(function (cat) {
var label = cat.label || t[cat.labelKey] || cat.id;
var desc = cat.desc || t[cat.labelKey + 'Desc'] || '';
rows +=
'<div class="ely-pref-row">'
+ '<div class="ely-pref-label"><strong>' + label + '</strong><span>' + desc + '</span></div>'
+ '<label class="ely-toggle"><input type="checkbox" data-ely-cat="' + cat.id + '"><span class="ely-toggle-slider"></span></label>'
+ '</div>';
});

var modal = document.createElement('div');
modal.id = 'ely-cookie-modal';
modal.setAttribute('role', 'dialog');
modal.setAttribute('aria-modal', 'true');
modal.setAttribute('aria-label', t.manageTitle);
modal.innerHTML =
'<div class="ely-ck-box">'
+ '<h3>' + t.manageTitle + '</h3>'
+ rows
+ '<div class="ely-ck-modal-actions">'
+ '<button class="ely-ck-btn ely-ck-reject" id="ely-ck-modal-close" aria-label="✕">✕</button>'
+ '<button class="ely-ck-btn ely-ck-accept" id="ely-ck-save">' + t.savePrefs + '</button>'
+ '</div>'
+ '<p class="ely-ck-legal-note">' + t.legalNote + '</p>'
+ '</div>';
return modal;
}

function collectCategories(allGranted) {
var out = {};
cfg.categories.forEach(function (cat) {
if (typeof allGranted === 'boolean') { out[cat.id] = allGranted; return; }
var input = document.querySelector('input[data-ely-cat="' + cat.id + '"]');
out[cat.id] = !!(input && input.checked);
});
return out;
}

function hideBanner() {
var banner = document.getElementById('ely-cookie-banner');
if (!banner) return;
banner.style.transition = 'transform .3s ease,opacity .3s ease';
banner.style.transform = 'translateY(100%)';
banner.style.opacity = '0';
setTimeout(function () { banner.remove(); }, 350);
}

// ── Montaje ───────────────────────────────────────────────────────────────
function mountUI(showBanner) {
injectStyles();

var modal = document.getElementById('ely-cookie-modal');
if (!modal) {
modal = buildModal();
document.body.appendChild(modal);

document.getElementById('ely-ck-modal-close').addEventListener('click', function () {
modal.classList.remove('open');
});

modal.addEventListener('click', function (e) {
if (e.target === modal) modal.classList.remove('open');
});

document.getElementById('ely-ck-save').addEventListener('click', function () {
saveConsent(collectCategories());
modal.classList.remove('open');
hideBanner();
});
}

if (showBanner && !document.getElementById('ely-cookie-banner')) {
var banner = buildBanner();
document.body.appendChild(banner);

document.getElementById('ely-ck-accept').addEventListener('click', function () {
saveConsent(collectCategories(true));
hideBanner();
});
document.getElementById('ely-ck-reject').addEventListener('click', function () {
saveConsent(collectCategories(false));
hideBanner();
});
document.getElementById('ely-ck-manage').addEventListener('click', function () {
modal.classList.add('open');
});
}

return modal;
}

function init() {
var existing = getConsent();
if (existing) { applyConsent(existing); return; }
mountUI(true);
}

if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init);
} else {
init();
}

// ── API pública ───────────────────────────────────────────────────────────
window.ElysiumConsent = {
get: getConsent,
isGranted: isGranted,

/** Ejecuta cb inmediatamente si la categoría está otorgada; si no,
* la encola hasta que el usuario la otorgue. */
onGranted: function (cat, cb) {
if (isGranted(cat)) { cb(); return; }
(grantCallbacks[cat] = grantCallbacks[cat] || []).push(cb);
},

/** Reabre el gestor de preferencias — enlazar desde el footer
* («Configuración de cookies») para cumplir la revocabilidad. */
open: function () {
var modal = mountUI(false);
var current = getConsent();
if (current) {
cfg.categories.forEach(function (cat) {
var input = document.querySelector('input[data-ely-cat="' + cat.id + '"]');
if (input) input.checked = !!current.categories[cat.id];
});
}
modal.classList.add('open');
},

/** Derecho de supresión (RGPD Art. 17 / Ley 8968 Art. 7): borrado
* completo del rastro local. Reutiliza el pipeline de Hard Reset
* si está presente; si no, hace la limpieza mínima local. */
purgeLocalData: function () {
if (typeof window.elysiumForceUpdate === 'function') {
return window.elysiumForceUpdate(true);
}
try { localStorage.clear(); } catch (_) {}
try { sessionStorage.clear(); } catch (_) {}
document.cookie.split(';').forEach(function (c) {
var name = c.split('=')[0].trim();
document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
});
window.location.reload();
}
};

})();
