export const ASSET_ROOT = "/assets/";

/** Ilustración que se usa cuando una ficha se queda sin imagen propia. */
export const ASSET_FALLBACK = "/assets/escena/categoria-expediciones.svg";

/**
 * Todas las imágenes del sitio son locales y se declaran ya con su ruta final
 * en `data/`, así que aquí solo queda normalizar el caso vacío. Se mantiene la
 * función porque es el único punto por el que pasan las imágenes: si algún día
 * vuelven a servirse desde un CDN, se reescribe aquí y no en cada componente.
 */
export function localAsset(source: string | null | undefined) {
  if (!source) return ASSET_FALLBACK;
  return source.startsWith("/") ? source : `${ASSET_ROOT}${source}`;
}
