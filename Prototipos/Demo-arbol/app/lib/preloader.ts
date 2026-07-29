/*
 * F01 · Loading Page. Puente con `elysium-core/elysium-preloader.js`.
 *
 * El overlay se retira con el `load` del navegador, que llega mucho antes de
 * que la portada 3D haya pintado nada: el módulo del motor todavía se está
 * descargando (va por `next/dynamic`), y después quedan el contexto WebGL y la
 * compilación de shaders. El visitante veía desaparecer la pantalla de carga
 * sobre un lienzo vacío.
 *
 * Quien tenga algo que terminar retiene el overlay al importarse —eso ocurre
 * durante la hidratación, antes de `load`— y lo suelta cuando de verdad está en
 * pantalla. El timeout de seguridad del preloader (8 s) sigue siendo el techo.
 */

type PreloaderApi = {
  dismiss: () => void;
  hold?: () => void;
  release?: () => void;
};

declare global {
  interface Window {
    ElysiumPreloader?: PreloaderApi;
  }
}

let held = false;

/** Retiene la Loading Page. Idempotente: una pieza no puede retener dos veces. */
export function holdPreloader() {
  if (typeof window === "undefined" || held) return;
  held = true;
  window.ElysiumPreloader?.hold?.();
}

/** Suelta la retención. Seguro de llamar de más (y sin haber retenido). */
export function releasePreloader() {
  if (typeof window === "undefined" || !held) return;
  held = false;
  window.ElysiumPreloader?.release?.();
}
