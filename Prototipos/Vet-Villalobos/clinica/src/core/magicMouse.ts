/**
 * El cursor de la casa Villalobos.
 *
 * Un punto y un aro finos, en blanco con fusión «diferencia»: sobre la
 * porcelana se ven casi negros y sobre el noir, blancos, sin tener que saber
 * qué hay debajo. El punto va pegado al puntero y el aro lo sigue con un poco
 * de inercia. Sobre lo que se puede tocar el aro se abre; sobre una tarjeta, un
 * teléfono o el gato, se vuelve un disco rojo con la acción escrita
 * (`data-cursor="Ver"`). Los botones se dejan atraer unos píxeles. En los campos
 * de texto se aparta y deja el cursor del sistema.
 *
 * Sustituye a la patita que traía del prototipo de Valladares. Solo con ratón o
 * trackpad, sin movimiento reducido y si quien visita no lo apagó en Ajustes
 * (`ely-pref-cursor`). Las decisiones puras están en `cursor.mjs`.
 *
 * Los diálogos modales (`showModal`) van a la capa superior del navegador, por
 * encima de cualquier z-index: las tres piezas del cursor son popovers y se
 * vuelven a abrir encima cada vez que se abre uno (`ElysiumMouse.promote`).
 */
import { MAGNETIC, cursorTarget, magnetOffset, shouldEnable } from './cursor.mjs';

export const PREF_KEY = 'ely-pref-cursor';
const ON = 'vl-cursor-on';
const FOLLOW = 0.2;

type Piece = HTMLElement & { showPopover?: () => void; hidePopover?: () => void };
let pieces: { ring: Piece; dot: Piece; tag: Piece; label: HTMLElement } | null = null;
let enabled = false;
let raf = 0;
const pointer = { x: -100, y: -100 };
const ring = { x: -100, y: -100 };
let mode = 'idle';
let magnet: HTMLElement | null = null;
let dialogs: MutationObserver | null = null;

function readPreference(): string | null {
  try {
    return localStorage.getItem(PREF_KEY);
  } catch {
    return null;
  }
}

function environmentAllows(): boolean {
  return typeof window !== 'undefined'
    && matchMedia('(pointer: fine) and (hover: hover)').matches
    && !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function piece(className: string, inner: string): Piece {
  const el = document.createElement('div') as Piece;
  el.className = `vl-cursor ${className}`;
  el.setAttribute('aria-hidden', 'true');
  if (typeof el.showPopover === 'function') el.setAttribute('popover', 'manual');
  el.innerHTML = inner;
  document.body.appendChild(el);
  return el;
}

function build() {
  if (pieces) return pieces;
  const ringEl = piece('vl-cursor-ring', '<i></i>');
  const dotEl = piece('vl-cursor-dot', '<i></i>');
  const tagEl = piece('vl-cursor-tag', '<i><span></span></i>');
  pieces = { ring: ringEl, dot: dotEl, tag: tagEl, label: tagEl.querySelector('span') as HTMLElement };
  return pieces;
}

/** Vuelve a poner las piezas encima de todo, también de un diálogo recién abierto. */
function promote() {
  if (!pieces) return;
  [pieces.ring, pieces.dot, pieces.tag].forEach((el) => {
    if (typeof el.showPopover !== 'function') return;
    try {
      if (el.matches(':popover-open')) el.hidePopover?.();
      el.showPopover();
    } catch { /* fuera del documento o sin soporte: se queda como está */ }
  });
}

function setMode(next: string, label = '') {
  if (!pieces) return;
  if (label) pieces.label.textContent = label;
  if (next === mode) return;
  mode = next;
  document.documentElement.dataset.cursorMode = next;
}

function release() {
  if (!magnet) return;
  magnet.style.transform = '';
  magnet = null;
}

function frame() {
  if (!pieces) return;
  ring.x += (pointer.x - ring.x) * FOLLOW;
  ring.y += (pointer.y - ring.y) * FOLLOW;
  pieces.dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
  pieces.ring.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
  pieces.tag.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
  // Quieto el aro, se para el bucle: no gasta nada mientras nadie mueve el ratón.
  raf = Math.abs(pointer.x - ring.x) + Math.abs(pointer.y - ring.y) > 0.2 ? requestAnimationFrame(frame) : 0;
}

function onMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  document.documentElement.classList.add('vl-cursor-in');
  const target = event.target as Element | null;
  const { mode: next, label } = cursorTarget(target) as { mode: string; label?: string };
  setMode(next, label);

  const button = target?.closest?.(MAGNETIC) as HTMLElement | null;
  if (button !== magnet) release();
  if (button && next !== 'text') {
    const box = button.getBoundingClientRect();
    const { x, y } = magnetOffset(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2));
    button.style.transform = `translate(${x}px, ${y}px)`;
    magnet = button;
  }
  if (!raf) raf = requestAnimationFrame(frame);
}

function onLeave() {
  document.documentElement.classList.remove('vl-cursor-in');
  release();
}

/** Sin elemento de llegada, el puntero salió de la ventana. */
function onOut(event: PointerEvent) {
  if (!event.relatedTarget) onLeave();
}

function onDown() { document.documentElement.classList.add('vl-cursor-down'); }
function onUp() { document.documentElement.classList.remove('vl-cursor-down'); }

function enableCursor() {
  if (enabled || !environmentAllows()) return;
  enabled = true;
  build();
  promote();
  document.documentElement.classList.add(ON);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointerout', onOut);
  window.addEventListener('blur', onLeave);
  dialogs = new MutationObserver((changes) => {
    if (changes.some((change) => (change.target as Element).matches?.('dialog[open]'))) promote();
  });
  dialogs.observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
}

function disableCursor() {
  if (!enabled) return;
  enabled = false;
  cancelAnimationFrame(raf);
  raf = 0;
  release();
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerdown', onDown);
  window.removeEventListener('pointerup', onUp);
  window.removeEventListener('pointerout', onOut);
  window.removeEventListener('blur', onLeave);
  dialogs?.disconnect();
  dialogs = null;
  document.documentElement.classList.remove(ON, 'vl-cursor-in', 'vl-cursor-down');
  delete document.documentElement.dataset.cursorMode;
  mode = 'idle';
  pieces?.ring.remove();
  pieces?.dot.remove();
  pieces?.tag.remove();
  pieces = null;
}

export function isMagicMouseEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return shouldEnable({ fine: environmentAllows(), reduced: false, pref: readPreference() });
}

export function setMagicMouseEnabled(value: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, value ? '1' : '0');
  } catch { /* almacenamiento bloqueado: vale solo para esta visita */ }
  if (value) enableCursor();
  else disableCursor();
}

/** Idempotente: lo llaman el layout y la cabecera, y cada uno puede ser el primero. */
export function initMagicMouse(): void {
  if (typeof window === 'undefined') return;
  (window as any).ElysiumMouse = { promote };
  if (isMagicMouseEnabled()) enableCursor();
}
