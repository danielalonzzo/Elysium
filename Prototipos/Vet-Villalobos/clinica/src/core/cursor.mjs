/**
 * Lo que decide el cursor de la casa sin tocar el DOM, para poder probarlo con
 * `node --test`. El cursor en sí está en `magicMouse.ts`.
 */

/** Campos donde se escribe: ahí manda el cursor de texto del sistema. */
export const TEXT_ENTRY = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]),textarea,select,[contenteditable="true"]';
/** Todo lo que se puede tocar. */
export const INTERACTIVE = 'a[href],button,[role="button"],[role="radio"],label,summary,[data-cursor],input[type="checkbox"],input[type="radio"],input[type="range"]';
/**
 * Lo que se deja atraer un poco por el cursor. El botón de atención directa no:
 * el gato pisa su borde y se quedaría flotando.
 */
export const MAGNETIC = '.button';

/** Cuánto se deja llevar un botón magnético hacia el puntero, y su tope en píxeles. */
export const MAGNET_PULL = 0.22;
export const MAGNET_MAX = 7;

/**
 * Qué hace el cursor sobre `element`:
 * - `text`: se aparta y deja el del sistema.
 * - `label`: disco rojo con la acción escrita (`data-cursor="Ver"`).
 * - `button`: se funde con el botón, que ya responde con su imán y su color
 *   (sobre el rojo, el aro en «diferencia» saldría cian).
 * - `link`: el aro se abre.
 * - `idle`: punto y aro.
 */
export function cursorTarget(element) {
  if (!element?.closest) return { mode: 'idle' };
  if (element.closest(TEXT_ENTRY)) return { mode: 'text' };
  const labelled = element.closest('[data-cursor]');
  if (labelled?.dataset?.cursor) return { mode: 'label', label: labelled.dataset.cursor };
  if (element.closest(MAGNETIC)) return { mode: 'button' };
  const target = element.closest(INTERACTIVE);
  if (target && !target.disabled && target.getAttribute?.('aria-disabled') !== 'true') return { mode: 'link' };
  return { mode: 'idle' };
}

/**
 * Solo con ratón o trackpad, sin movimiento reducido y si no se apagó en
 * Ajustes. Viene encendido: `pref` es lo guardado en `ely-pref-cursor`.
 */
export function shouldEnable({ fine, reduced, pref }) {
  return Boolean(fine && !reduced && pref !== '0');
}

/** El desplazamiento de un botón magnético para un puntero a (dx, dy) de su centro. */
export function magnetOffset(dx, dy) {
  const clamp = (v) => Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, v * MAGNET_PULL));
  return { x: clamp(dx), y: clamp(dy) };
}
