/*
 * Color del cromo del navegador (barra de estado y barra de direcciones).
 *
 * Safari en iOS muestrea el fondo del documento UNA sola vez, al cargar la
 * página: por eso pintar `body` no bastaba —la barra inferior se quedaba
 * congelada en el verde del césped aunque la escena ya fuera negra y aunque se
 * saliera de la portada—. La etiqueta `<meta name="theme-color">`, en cambio,
 * sí se relee cada vez que cambia, y es la que gobierna las dos barras.
 *
 * Hay dos niveles:
 *   · base      → el color del tema activo (claro #f5f5f5 / oscuro #1a1a1a).
 *   · override  → lo fija la cinemática de portada para seguir el suelo de la
 *                 escena; al terminar lo suelta y vuelve a mandar el tema.
 */

const LIGHT = "#f5f5f5";
const DARK = "#1a1a1a";

let override: string | null = null;
let watching = false;

function baseColor() {
  return document.documentElement.dataset.elysiumTheme === "light" ? LIGHT : DARK;
}

function metaTag() {
  let tag = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = "theme-color";
    document.head.appendChild(tag);
  }
  return tag;
}

/** Reescribe la etiqueta con el color que toque ahora mismo. */
export function applyBrowserChrome() {
  const color = override ?? baseColor();
  const tag = metaTag();
  if (tag.content !== color) tag.content = color;
}

/**
 * La portada llama aquí en cada cuadro con el color del suelo de la escena, y
 * con `null` cuando la cinemática termina o se desmonta.
 */
export function setBrowserChromeOverride(color: string | null) {
  if (override === color) return;
  override = color;
  applyBrowserChrome();
}

/** Engancha el color base al conmutador de tema (F22 / Magic Bottom). */
export function initBrowserChrome() {
  if (watching) return;
  watching = true;

  const observer = new MutationObserver(applyBrowserChrome);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-elysium-theme"],
  });
  window.addEventListener("elysium:settings:changed", applyBrowserChrome);
  applyBrowserChrome();
}
