/**
* ══════════════════════════════════════════════════════════════════════════════
* Elysium λ Core Kit — Componente A: Global Preloader / Loading Screen
* elysium-preloader.js | v1.0.0 | Zero-dependency
*
* Síntesis de la mejor práctica interna detectada en los 6 proyectos:
* · Duración mínima con compensación de tiempo transcurrido (Elysium, puravidapets, VALTRIX)
* · Bloqueo de scroll durante la carga (6/6 proyectos)
* · Salida en dos fases: clase CSS → remove() del DOM (6/6 proyectos)
* · Timeout de seguridad anti-bloqueo (8 s) (pmorais)
* · Integración con el flag `sys_action` del Hard Reset (pmorais)
*
* USO (incluir como PRIMER script dentro de <head>, sin defer, para
* garantizar pintura inmediata del overlay y evitar FOUC):
*
* <script>
* window.ELYSIUM_PRELOADER = {
* brandName: 'Mi Marca',
* logoHTML: '<img src="logo.svg" alt="" width="72" height="72">',
* tagline: 'Cargando…',
* accent: '#2997ff',
* background: '#0B0B0B',
* textColor: '#F5F5F7',
* minDuration: 1000
* };
* </script>
* <script src="elysium-core/elysium-preloader.js"></script>
*
* Eventos: window → 'elysium:preloader:done' (al retirarse del DOM)
* API: window.ElysiumPreloader.dismiss() (retirada manual anticipada)
* ══════════════════════════════════════════════════════════════════════════════
*/
(function () {
'use strict';

/** @typedef {Object} PreloaderConfig
* @property {string} [brandName] Nombre de marca mostrado bajo el logo.
* @property {string} [logoHTML] HTML del logotipo (img/svg inline).
* @property {string} [tagline] Texto secundario bajo los puntos.
* @property {string} [accent] Color de acento (puntos animados).
* @property {string} [background] Color de fondo del overlay.
* @property {string} [textColor] Color del nombre de marca.
* @property {number} [minDuration] Duración mínima visible en ms (def. 1000).
* @property {number} [maxDuration] Timeout de seguridad en ms (def. 8000).
*/

var cfg = Object.assign({
brandName: '',
logoHTML: '<span style="font-size:3rem;line-height:1">λ</span>',
tagline: '',
accent: '#2997ff',
background: '#0B0B0B',
textColor: '#F5F5F7',
minDuration: 1000,
maxDuration: 8000
}, window.ELYSIUM_PRELOADER || {});

var ID = 'elysium-preloader';
var startedAt = Date.now();
var dismissed = false;

// ── Integración con Hard Reset: si venimos de una actualización/logout,
// el mensaje del preloader lo refleja (flag sembrado por elysium-system-info.js)
var sysAction = null;
try {
sysAction = sessionStorage.getItem('sys_action');
if (sysAction) sessionStorage.removeItem('sys_action');
} catch (_) {}
if (sysAction === 'update') cfg.tagline = cfg.taglineUpdate || 'Actualizando…';
if (sysAction === 'logout') cfg.tagline = cfg.taglineLogout || 'Cerrando sesión…';

// ── CSS ───────────────────────────────────────────────────────────────────
var css = [
'#' + ID + '{',
' position:fixed;inset:0;z-index:999998;',
' background:' + cfg.background + ';',
' display:flex;flex-direction:column;align-items:center;justify-content:center;',
' gap:1.5rem;',
' transition:opacity .7s ease,transform .7s ease;',
'}',
'#' + ID + '.is-loaded{opacity:0;transform:translateY(-20px);pointer-events:none;}',
'#' + ID + ' .ely-pre-logo{color:' + cfg.accent + ';display:flex;align-items:center;justify-content:center;}',
'#' + ID + ' .ely-pre-brand{',
' color:' + cfg.textColor + ';font-size:1.6rem;font-weight:700;',
' font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
'}',
'#' + ID + ' .ely-pre-dots{display:flex;gap:8px;}',
'#' + ID + ' .ely-pre-dot{',
' width:8px;height:8px;border-radius:50%;background:' + cfg.accent + ';',
' animation:ely-dot-bounce 1.2s ease-in-out infinite;',
'}',
'#' + ID + ' .ely-pre-dot:nth-child(2){animation-delay:.15s;}',
'#' + ID + ' .ely-pre-dot:nth-child(3){animation-delay:.3s;}',
'#' + ID + ' .ely-pre-tagline{',
' font-size:.75rem;color:' + cfg.textColor + ';opacity:.55;',
' letter-spacing:.12em;text-transform:uppercase;font-weight:600;',
' font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
'}',
'@keyframes ely-dot-bounce{',
' 0%,80%,100%{transform:translateY(0);opacity:.4;}',
' 40%{transform:translateY(-10px);opacity:1;}',
'}',
/* Accesibilidad: usuarios con reduced-motion ven el overlay sin animación */
'@media (prefers-reduced-motion:reduce){',
' #' + ID + ' .ely-pre-dot{animation:none;}',
' #' + ID + '{transition:opacity .3s ease;}',
'}'
].join('\n');
var style = document.createElement('style');
style.id = ID + '-styles';
style.textContent = css;
document.head.appendChild(style);

// ── Overlay (inyección síncrona: se pinta antes que el resto del body) ────
var overlay = document.createElement('div');
overlay.id = ID;
overlay.setAttribute('role', 'status');
overlay.setAttribute('aria-live', 'polite');
overlay.setAttribute('aria-label', cfg.tagline || 'Loading');
overlay.innerHTML =
'<div class="ely-pre-logo">' + cfg.logoHTML + '</div>'
+ (cfg.brandName ? '<div class="ely-pre-brand">' + cfg.brandName + '</div>' : '')
+ '<div class="ely-pre-dots"><div class="ely-pre-dot"></div><div class="ely-pre-dot"></div><div class="ely-pre-dot"></div></div>'
+ (cfg.tagline ? '<span class="ely-pre-tagline">' + cfg.tagline + '</span>' : '');

function mount() {
if (!document.body) return;
document.body.appendChild(overlay);
document.body.style.overflow = 'hidden';
}

if (document.body) { mount(); }
else { document.addEventListener('DOMContentLoaded', mount); }

// ── Retirada en dos fases con duración mínima garantizada ─────────────────
function dismiss() {
if (dismissed) return;
dismissed = true;

var elapsed = Date.now() - startedAt;
var remaining = Math.max(0, cfg.minDuration - elapsed);

setTimeout(function () {
overlay.classList.add('is-loaded');
setTimeout(function () {
overlay.remove();
document.body.style.overflow = '';
window.dispatchEvent(new Event('elysium:preloader:done'));
}, 750);
}, remaining);
}

if (document.readyState === 'complete') { dismiss(); }
else { window.addEventListener('load', dismiss); }

// Timeout de seguridad: nunca dejar al usuario atrapado tras el overlay
setTimeout(dismiss, cfg.maxDuration);

// ── API pública ───────────────────────────────────────────────────────────
window.ElysiumPreloader = { dismiss: dismiss };

})();
