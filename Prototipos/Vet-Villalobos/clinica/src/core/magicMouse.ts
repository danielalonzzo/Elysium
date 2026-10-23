/**
 * =========================================================================
 * Elysium λ · F12 — Magic Mouse & Luxury Paw Cursor
 * Veterinaria Villalobos (Heredia, Costa Rica)
 *
 * Concepto: "La Patita de Cuidado · Cinemática & Latido Vivo"
 * Transforma el cursor en una auténtica patita veterinaria de alta gama:
 *  - En movimiento: una patita esculpida (4 almohadillas + almohadilla central
 *    con cruz médica veterinaria calada) con gradiente de esmeralda joya,
 *    relieve de luz y sombra suave.
 *  - Estela cinemática: aura-cometa etérea con inercia (Lerp) y estiramiento
 *    aerodinámico que acompaña el trote de la patita.
 *  - Imantación interactiva (Hover): al pasar sobre botones, enlaces y tarjetas,
 *    la patita se ilumina en oro champán y el aura se expande como halo de
 *    cristal esmerilado.
 *  - Reposo ("Latido de Cuidado"): tras 1.2s de calma, el cometa se repliega y
 *    la patita respira con un latido biológico auténtico (doble sístole lub-dub,
 *    60-70 bpm, fulgor esmeralda/lima).
 *  - Clic ("La Pisada"): la patita estampa una onda de choque expansiva que
 *    gira y se difumina como polvillo de luz.
 *  - Top Layer Nativo: integrado con la API de Popover y observador de diálogos
 *    para permanecer SIEMPRE en la capa superior del navegador por encima de
 *    modales (como los ajustes del sistema) y backdrops.
 *  - Táctil (móvil/tablet): estampa táctil de patita al tocar la pantalla sin
 *    bloquear gestos nativos.
 *  - Accesibilidad absoluta: respeta `prefers-reduced-motion` y `pointer: fine`,
 *    gobernada por el interruptor del visitante (`ely-pref-cursor`).
 * =========================================================================
 */

export const PREF_KEY = 'ely-pref-cursor';
export const STYLE_ID = 'ely-vet-magic-mouse-styles';
export const TOUCH_SPLASH_CLASS = 'vet-touch-splash';

/**
 * Silueta de la patita de la clínica:
 * Cuatro almohadillas con orientación orgánica y almohadilla central en forma
 * de corazón con la cruz médica veterinaria calada en relieve.
 *
 * La rotación vive DENTRO del SVG (<g transform='rotate(...)'>) girando sobre
 * su centro (12, 12). Ningún elemento CSS que posicione el motor lleva
 * transformaciones independientes (rotate/translate/scale), previniendo deriva.
 */
export const PAW_SVG = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>"
  + "<g transform='rotate(-10 12 12)'>"
  + "<ellipse cx='5.2' cy='8.5' rx='1.9' ry='2.6' transform='rotate(-20 5.2 8.5)'/>"
  + "<ellipse cx='9.6' cy='5.6' rx='1.85' ry='2.8' transform='rotate(-7 9.6 5.6)'/>"
  + "<ellipse cx='14.4' cy='5.6' rx='1.85' ry='2.8' transform='rotate(7 14.4 5.6)'/>"
  + "<ellipse cx='18.8' cy='8.5' rx='1.9' ry='2.6' transform='rotate(20 18.8 8.5)'/>"
  + "<path fill-rule='evenodd' d='M12 10.5 C8 10.5 5 13.8 5 17.5 C5 21 8.5 23 12 23.2 C15.5 23 19 21 19 17.5 C19 13.8 16 10.5 12 10.5 Z M10.8 14.2 H13.2 V16.2 H15.2 V18.6 H13.2 V20.6 H10.8 V18.6 H8.8 V16.2 H10.8 Z'/>"
  + '</g></svg>';

const PAW_URL = `url("data:image/svg+xml,${encodeURIComponent(PAW_SVG)}")`;

const MASK_PAW = `
  -webkit-mask-image: ${PAW_URL}; mask-image: ${PAW_URL};
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  -webkit-mask-position: center;  mask-position: center;
  -webkit-mask-size: contain;     mask-size: contain;
`;

const CSS = `
/* ── Ocultar cursor nativo sólo cuando la patita de marca esté activa ── */
html.ely-cursor-active,
html.ely-cursor-active body,
html.ely-cursor-active a,
html.ely-cursor-active button,
html.ely-cursor-active input,
html.ely-cursor-active select,
html.ely-cursor-active textarea,
html.ely-cursor-active dialog,
html.ely-cursor-active dialog *,
html.ely-cursor-active [role="button"],
html.ely-cursor-active *:hover {
  cursor: none !important;
}

/* El contenedor del cursor jamás intercepta eventos del ratón */
.ely-cursor,
.ely-cursor *,
.ely-cursor-paw,
.ely-cursor-comet,
.${TOUCH_SPLASH_CLASS} {
  pointer-events: none !important;
}

/* Contenedor fijo en viewport + compatibilidad con Top Layer (popover) */
.ely-cursor:popover-open,
.ely-cursor {
  position: fixed;
  inset: unset;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  overflow: visible;
  z-index: 2147483647;
  opacity: 1;
  transition: opacity .25s ease;
  will-change: opacity;
}

.ely-cursor::backdrop {
  display: none !important;
  background: transparent !important;
}

/* Capas posicionales del motor */
.ely-cursor-paw,
.ely-cursor-comet {
  position: fixed;
  top: 0;
  left: 0;
  will-change: transform;
}

/* ── 1. La Patita de Marca (sigue inmediatamente al puntero) ── */
.ely-cursor-paw {
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, #ff6a70 0%, #b60000 55%, #7a0000 100%);
  filter: drop-shadow(0 2px 6px rgba(182, 0, 0, 0.45));
  z-index: 3;
  ${MASK_PAW}
  transition: width .25s cubic-bezier(.2, 1, .3, 1),
              height .25s cubic-bezier(.2, 1, .3, 1),
              background .25s ease,
              filter .25s ease,
              opacity .3s ease;
}

/* Modo oscuro: patita bioluminiscente esmeralda y reflejo champán */
:root[data-theme="dark"] .ely-cursor-paw {
  background: linear-gradient(135deg, #ff6a70 0%, #e0303a 60%, #9a0000 100%);
  filter: drop-shadow(0 0 10px rgba(224, 48, 58, 0.75)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

/* ── 2. Aura-cometa cinemática (inercia etérea detrás de la patita) ── */
.ely-cursor-comet {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  z-index: 2;
  transition: width .28s cubic-bezier(.2, 1, .3, 1),
              height .28s cubic-bezier(.2, 1, .3, 1),
              opacity .35s ease,
              border-color .28s ease,
              background .28s ease;
}

.ely-cursor-comet-core {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  will-change: transform;
  transform-origin: center center;
  background: radial-gradient(circle at 50% 50%, rgba(182, 0, 0, 0.28) 0%, rgba(85, 85, 85, 0.14) 45%, rgba(255, 106, 112, 0.08) 65%, transparent 75%);
  transition: background .3s ease;
}

:root[data-theme="dark"] .ely-cursor-comet-core {
  background: radial-gradient(circle at 50% 50%, rgba(224, 48, 58, 0.35) 0%, rgba(255, 106, 112, 0.16) 48%, transparent 75%);
}

/* ── 3. Estado de interacción (Hover sobre botones, enlaces y tarjetas) ── */
.ely-cursor.is-hovering .ely-cursor-paw {
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #ff6a70 0%, #e0303a 60%, #b60000 100%);
  filter: drop-shadow(0 0 14px rgba(255, 106, 112, 0.65)) drop-shadow(0 2px 8px rgba(182, 0, 0, 0.5));
}

.ely-cursor.is-hovering .ely-cursor-comet {
  width: 56px;
  height: 56px;
  opacity: .95;
  border: 1.5px solid rgba(255, 106, 112, 0.5);
  backdrop-filter: blur(2px);
  background: radial-gradient(circle, rgba(182, 0, 0, 0.22) 0%, rgba(255, 106, 112, 0.14) 50%, transparent 72%);
}

/* ── 4. Estado de reposo (Idle: el cometa se repliega y la patita late) ── */
.ely-cursor.is-idle .ely-cursor-comet {
  opacity: 0;
}

.ely-cursor.is-idle .ely-cursor-paw {
  width: 34px;
  height: 34px;
  filter: drop-shadow(0 0 16px rgba(255, 106, 112, 0.6)) drop-shadow(0 2px 10px rgba(182, 0, 0, 0.6));
  animation: vet-paw-heartbeat 2.8s ease-in-out infinite;
}

/* Latido vital auténtico de reposo (ritmo biológico lub-dub con fulgor) */
@keyframes vet-paw-heartbeat {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 2px 7px rgba(182, 0, 0, 0.45));
  }
  14% {
    transform: translate(-50%, -50%) scale(1.18);
    filter: drop-shadow(0 0 18px rgba(255, 106, 112, 0.65));
  }
  26% {
    transform: translate(-50%, -50%) scale(1.03);
  }
  38% {
    transform: translate(-50%, -50%) scale(1.12);
    filter: drop-shadow(0 0 12px rgba(182, 0, 0, 0.6));
  }
  50% {
    transform: translate(-50%, -50%) scale(1);
  }
}

/* ── 5. Onda de choque al hacer clic ("La Pisada") ── */
.ely-ripple {
  position: fixed;
  top: 0;
  left: 0;
  width: 38px;
  height: 38px;
  pointer-events: none !important;
  z-index: 2147483647;
  background: linear-gradient(135deg, #ff6a70 0%, #b60000 100%);
  filter: drop-shadow(0 0 12px rgba(255, 106, 112, 0.6));
  ${MASK_PAW}
  animation: vet-paw-stamp .55s cubic-bezier(.16, 1, .3, 1) forwards;
}

@keyframes vet-paw-stamp {
  0% {
    transform: translate(-50%, -50%) scale(0.4) rotate(-16deg);
    opacity: 0.95;
    filter: drop-shadow(0 0 14px rgba(255, 106, 112, 0.65));
  }
  100% {
    transform: translate(-50%, -50%) scale(2.2) rotate(6deg);
    opacity: 0;
    filter: drop-shadow(0 0 24px rgba(182, 0, 0, 0));
  }
}

/* ── 6. Retroalimentación táctil al tocar pantalla (Mobile Splash) ── */
.${TOUCH_SPLASH_CLASS} {
  position: fixed;
  z-index: 2147483647;
  width: 44px;
  height: 44px;
  margin-left: -22px;
  margin-top: -22px;
  pointer-events: none !important;
  will-change: transform, opacity;
  background: linear-gradient(135deg, #ff6a70 0%, #b60000 100%);
  ${MASK_PAW}
  animation: vet-touch-stamp .55s cubic-bezier(.22, 1, .36, 1) forwards;
}
:root[data-theme="dark"] .${TOUCH_SPLASH_CLASS} {
  background: linear-gradient(135deg, #ff6a70 0%, #e0303a 100%);
}

@keyframes vet-touch-stamp {
  0% {
    transform: scale(.38) rotate(-14deg);
    opacity: .95;
    filter: drop-shadow(0 0 12px rgba(255, 106, 112, 0.6));
  }
  100% {
    transform: scale(1.8) rotate(4deg);
    opacity: 0;
    filter: drop-shadow(0 0 24px rgba(182, 0, 0, 0));
  }
}

/* ── Accesibilidad: sin movimiento, apagado absoluto ── */
@media (prefers-reduced-motion: reduce) {
  html .ely-cursor { display: none !important; }
  .${TOUCH_SPLASH_CLASS} { display: none !important; }
}
`;

function injectStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

// En Villalobos la patita viene apagada: la interfaz se queda con el cursor del
// sistema y quien la quiera la enciende en Ajustes.
export function readPreference(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(PREF_KEY) === '1';
  } catch {
    return false;
  }
}

export function writePreference(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PREF_KEY, enabled ? '1' : '0');
  } catch {
    /* Almacenamiento restringido o modo incógnito */
  }
}

export function hasFinePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: fine)').matches;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ── Cinemática interna ── */
const LERP = 0.32;
const VEL_SMOOTH = 0.2;
const STRETCH_K = 0.016;
const STRETCH_MAX = 0.75;
const IDLE_TIMEOUT_MS = 1200;

let mounted = false;
let rafId: number | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let isIdle = false;
let isHovering = false;
let tapEnabled = true;

let mouseX = 0;
let mouseY = 0;
let auraX = 0;
let auraY = 0;
let velSmooth = 0;
let lastAngle = 0;

let root: HTMLDivElement | null = null;
let paw: HTMLDivElement | null = null;
let comet: HTMLDivElement | null = null;
let cometCore: HTMLDivElement | null = null;
let dialogObserver: MutationObserver | null = null;

function translatePos(x: number, y: number): string {
  return `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
}

/**
 * Promueve el cursor a la capa superior (Top Layer) del navegador usando la
 * API de Popover. Si un diálogo modal se abre con `.showModal()`, se re-ejecuta
 * para colocar el cursor en el tope absoluto de la pila.
 */
function promoteToTopLayer(): void {
  if (!root || typeof (root as any).showPopover !== 'function') return;
  try {
    if (root.matches(':popover-open')) {
      (root as any).hidePopover();
    }
    (root as any).showPopover();
  } catch {
    /* Fallback silencioso si el estado no permite popover */
  }
}

function observeDialogs(): void {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;
  if (dialogObserver) dialogObserver.disconnect();

  dialogObserver = new MutationObserver((mutations) => {
    let shouldPromote = false;
    for (const m of mutations) {
      if (
        (m.type === 'attributes' && m.attributeName === 'open' && (m.target as HTMLElement).tagName === 'DIALOG') ||
        (m.type === 'childList' && document.querySelector('dialog[open]'))
      ) {
        shouldPromote = true;
        break;
      }
    }
    if (shouldPromote) {
      promoteToTopLayer();
    }
  });

  dialogObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['open'],
    childList: true,
    subtree: true,
  });
}

function buildDom(): void {
  if (root) return;

  root = document.createElement('div');
  root.className = 'ely-cursor';
  root.setAttribute('aria-hidden', 'true');

  comet = document.createElement('div');
  comet.className = 'ely-cursor-comet';
  cometCore = document.createElement('div');
  cometCore.className = 'ely-cursor-comet-core';
  comet.appendChild(cometCore);

  paw = document.createElement('div');
  paw.className = 'ely-cursor-paw';

  root.appendChild(comet);
  root.appendChild(paw);

  // Soporte de Top Layer (permanece sobre diálogos modales y backdrops)
  if (typeof (root as any).showPopover === 'function') {
    root.setAttribute('popover', 'manual');
  }

  document.body.appendChild(root);

  promoteToTopLayer();
  observeDialogs();

  const init = translatePos(mouseX, mouseY);
  paw.style.transform = init;
  comet.style.transform = init;
}

function scheduleIdle(): void {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    isIdle = true;
    if (root) root.classList.add('is-idle');
  }, IDLE_TIMEOUT_MS);
}

function onMouseMove(e: MouseEvent): void {
  mouseX = e.clientX;
  mouseY = e.clientY;

  if (root && root.style.opacity === '0') root.style.opacity = '1';

  const pos = translatePos(mouseX, mouseY);
  if (paw) paw.style.transform = pos;

  if (isIdle) {
    isIdle = false;
    if (root) root.classList.remove('is-idle');
  }
  scheduleIdle();
}

function onMouseDown(e: MouseEvent): void {
  if (!mounted || prefersReducedMotion()) return;
  const cx = e.clientX;
  const cy = e.clientY;

  requestAnimationFrame(() => {
    if (!root) return;
    const ripple = document.createElement('div');
    ripple.className = 'ely-ripple';
    ripple.style.transform = translatePos(cx, cy);
    root.appendChild(ripple);

    const cleanup = () => {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    };
    ripple.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 600);
  });
}

const HOVER_SELECTORS = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '.service-card',
  '.myth-card',
  '.bento-card',
  '.pet-card',
  '.logo-animal',
  '.photo-card',
  '.magic-dock button',
  '.chip-row button',
  '.diag-options button',
  '.diag-scale button',
  '.age-toggle button',
  '.age-sizes button',
  '[tabindex="0"]',
].join(',');

function onMouseOver(e: MouseEvent): void {
  const target = e.target as Element | null;
  if (!target) return;
  const interactive = target.closest(HOVER_SELECTORS);
  const shouldHover = Boolean(interactive);
  if (shouldHover !== isHovering) {
    isHovering = shouldHover;
    if (root) {
      root.classList.toggle('is-hovering', isHovering);
    }
  }
}

function onMouseLeave(): void {
  if (root) root.style.opacity = '0';
}

function onMouseEnter(): void {
  if (root) root.style.opacity = '1';
  // Si había un diálogo abierto al reingresar, asegurar que estemos en el Top Layer
  if (document.querySelector('dialog[open]')) {
    promoteToTopLayer();
  }
}

function onDragStart(e: DragEvent): void {
  const target = e.target as HTMLElement | null;
  if (target && target.tagName === 'IMG') {
    e.preventDefault();
  }
}

function tick(): void {
  if (!mounted) return;

  const prevX = auraX;
  const prevY = auraY;
  auraX += (mouseX - auraX) * LERP;
  auraY += (mouseY - auraY) * LERP;

  const vx = auraX - prevX;
  const vy = auraY - prevY;
  const speed = Math.sqrt(vx * vx + vy * vy);
  velSmooth += (speed - velSmooth) * VEL_SMOOTH;

  if (speed > 0.3) {
    lastAngle = Math.atan2(vy, vx);
  }

  let stretch = velSmooth * STRETCH_K;
  if (stretch > STRETCH_MAX) stretch = STRETCH_MAX;

  if (comet && cometCore) {
    comet.style.transform = translatePos(auraX, auraY);
    cometCore.style.transform = `rotate(${lastAngle}rad) scale(${1 + stretch}, ${1 - stretch * 0.45})`;
  }

  rafId = requestAnimationFrame(tick);
}

/* ── Capa táctil (móvil y tablet) ── */
function stampTouch(x: number, y: number): void {
  requestAnimationFrame(() => {
    const splash = document.createElement('div');
    splash.className = TOUCH_SPLASH_CLASS;
    splash.setAttribute('aria-hidden', 'true');
    splash.style.left = `${x}px`;
    splash.style.top = `${y}px`;

    // Si hay un diálogo modal abierto en táctil, estampar sobre el diálogo
    const activeDialog = document.querySelector('dialog[open]');
    if (activeDialog) {
      activeDialog.appendChild(splash);
    } else {
      document.body.appendChild(splash);
    }

    const remove = () => {
      if (splash.parentNode) splash.parentNode.removeChild(splash);
    };
    splash.addEventListener('animationend', remove, { once: true });
    setTimeout(remove, 850);
  });
}

function onPointerDown(e: PointerEvent): void {
  if (!tapEnabled || e.pointerType !== 'touch') return;
  if (prefersReducedMotion()) return;

  // Si el cursor fino ya está activo en esta pantalla, no duplicar
  if (document.documentElement.classList.contains('ely-cursor-active')) return;

  stampTouch(e.clientX, e.clientY);
}

/* ── Activación / Desactivación ── */
export function enableCursor(): void {
  if (typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  tapEnabled = true;

  if (hasFinePointer() && !mounted && document.body) {
    injectStyles();
    buildDom();

    document.documentElement.classList.add('ely-cursor-active');
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mousedown', onMouseDown, { passive: true });
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave, { passive: true });
    document.addEventListener('mouseenter', onMouseEnter, { passive: true });
    document.addEventListener('dragstart', onDragStart, { passive: false });

    mounted = true;
    scheduleIdle();
    rafId = requestAnimationFrame(tick);
  }
}

export function disableCursor(): void {
  tapEnabled = false;

  if (dialogObserver) {
    dialogObserver.disconnect();
    dialogObserver = null;
  }

  if (!mounted) return;

  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }

  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mousedown', onMouseDown);
  document.removeEventListener('mouseover', onMouseOver);
  document.removeEventListener('mouseleave', onMouseLeave);
  document.removeEventListener('mouseenter', onMouseEnter);
  document.removeEventListener('dragstart', onDragStart);

  document.documentElement.classList.remove('ely-cursor-active');

  if (root) {
    if (typeof (root as any).hidePopover === 'function') {
      try {
        if (root.matches(':popover-open')) {
          (root as any).hidePopover();
        }
      } catch {}
    }
    if (root.parentNode) {
      root.parentNode.removeChild(root);
    }
  }
  root = paw = comet = cometCore = null;
  isIdle = false;
  isHovering = false;
  velSmooth = 0;
  mounted = false;
}

export function setMagicMouseEnabled(enabled: boolean): void {
  writePreference(enabled);
  if (enabled) {
    enableCursor();
  } else {
    disableCursor();
  }
}

export function isMagicMouseEnabled(): boolean {
  return readPreference();
}

/**
 * Inicialización idempotente del sistema de cursor de patita y toque.
 */
export function initMagicMouse(): void {
  if (typeof window === 'undefined') return;

  // Registrar escucha global para toques móviles
  if (!(window as any).__vetPointerBound) {
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    (window as any).__vetPointerBound = true;
  }

  // Escuchar cambios dinámicos de entorno
  const fineQuery = window.matchMedia('(pointer: fine)');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const sync = () => {
    if (readPreference() && !prefersReducedMotion()) {
      enableCursor();
    } else {
      disableCursor();
    }
  };

  fineQuery.addEventListener?.('change', sync);
  motionQuery.addEventListener?.('change', sync);

  // Exponer API global canónica de Elysium λ
  (window as any).ElysiumMouse = {
    enable: () => setMagicMouseEnabled(true),
    disable: () => setMagicMouseEnabled(false),
    isEnabled: () => readPreference() && mounted,
    promote: promoteToTopLayer,
    version: '1.0.0-villalobos',
  };
  (window as any).initMagicMouse = initMagicMouse;

  // Si el usuario lo tiene habilitado (por defecto sí), arrancar
  if (readPreference()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', enableCursor, { once: true });
    } else {
      enableCursor();
    }
  } else {
    disableCursor();
  }
}
