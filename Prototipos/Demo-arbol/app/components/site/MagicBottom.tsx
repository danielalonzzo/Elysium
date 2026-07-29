"use client";

import { useSyncExternalStore, useEffect } from "react";
import { CONTACT, linkTo } from "../../data/content";
import { isAnyDockAnimationActive, subscribeDockAnimations } from "../../lib/dockVisibility";
import { IconInstagram, IconSpotify, IconWhatsApp, IconYouTube, IconSun, IconMoon } from "./Icons";

type Theme = "light" | "dark";

declare global {
  interface Window {
    /** Ajustes del sistema F22 (`public/js/features/f22-system-settings.js`). */
    ElysiumSettings?: {
      get: () => { theme?: Theme } | undefined;
      set: (patch: { theme: Theme }) => void;
    };
  }
}

/*
 * El tema vive en el DOM (`data-elysium-theme`), que es donde lo dejan tanto
 * F22 como este dock: es la única fuente de verdad. Se lee de ahí en vez de
 * duplicarlo en un `useState`, que obligaba a sincronizarlo con un efecto —y
 * React 19 marca ese `setState` síncrono como render en cascada.
 */
function readTheme(): Theme {
  const fromDom = document.documentElement.dataset.elysiumTheme;
  if (fromDom === "light" || fromDom === "dark") return fromDom;
  return window.ElysiumSettings?.get()?.theme === "dark" ? "dark" : "light";
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-elysium-theme"],
  });
  window.addEventListener("elysium:settings:changed", onChange);
  return () => {
    observer.disconnect();
    window.removeEventListener("elysium:settings:changed", onChange);
  };
}

/*
 * F09 · Magic Bottom. Concentra el contacto a un toque: el punto único de
 * conversión de la pieza. Los destinos salen de `CONTACT` y, mientras estén
 * vacíos, los iconos siguen ahí pero no llevan a ninguna parte.
 *
 * Se oculta mientras se reproduce la cinemática de portada (dockVisibility) y
 * `site-features.js` lo repliega al llegar al pie (`is-tucked`). El snapshot de
 * servidor devuelve `true` para pintar la portada sin destello del dock.
 */
export function MagicBottom() {
  const animationsActive = useSyncExternalStore(
    subscribeDockAnimations,
    isAnyDockAnimationActive,
    () => true,
  );

  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as const);

  // El tema resuelto se fija en el DOM: si venía solo de los ajustes de F22,
  // el atributo aún no estaba puesto y el CSS no tenía de dónde leerlo.
  useEffect(() => {
    document.documentElement.dataset.elysiumTheme = readTheme();
  }, []);

  const toggleTheme = () => {
    // Se parte del tema que hay puesto ahora mismo, no del que capturó este
    // render: dos pulsaciones seguidas dentro del mismo fotograma veían el
    // valor viejo y la segunda no devolvía al tema anterior.
    const nextTheme: Theme = readTheme() === "dark" ? "light" : "dark";
    // Escribir el atributo basta para repintar: `subscribeTheme` lo observa.
    document.documentElement.dataset.elysiumTheme = nextTheme;
    if (window.ElysiumSettings) {
      window.ElysiumSettings.set({ theme: nextTheme });
    } else {
      try {
        const key = "elysium:f22:settings:v1";
        const current = JSON.parse(localStorage.getItem(key) || "{}");
        current.theme = nextTheme;
        localStorage.setItem(key, JSON.stringify(current));
      } catch {}
    }
  };

  return (
    <div className={`hdc-dock${animationsActive ? " is-anim-hidden" : ""}`} id="contact-dock">
      <div className="hdc-dock-items" role="group" aria-label="Contacto rápido">
        <a className="hdc-dock-item is-whatsapp" href={linkTo(CONTACT.whatsapp)} target="_blank" rel="noopener noreferrer" data-tooltip="WhatsApp" aria-label="WhatsApp">
          <IconWhatsApp />
        </a>
        <span className="hdc-dock-divider" aria-hidden="true" />
        <a className="hdc-dock-item" href={linkTo(CONTACT.instagram)} target="_blank" rel="noopener noreferrer" data-tooltip="Instagram" aria-label="Instagram">
          <IconInstagram />
        </a>
        <a className="hdc-dock-item" href={linkTo(CONTACT.youtube)} target="_blank" rel="noopener noreferrer" data-tooltip="YouTube" aria-label="YouTube">
          <IconYouTube />
        </a>
        <a className="hdc-dock-item" href={linkTo(CONTACT.spotify)} target="_blank" rel="noopener noreferrer" data-tooltip="Spotify" aria-label="Spotify">
          <IconSpotify />
        </a>

        <span className="hdc-dock-divider" aria-hidden="true" />
        <button className="hdc-dock-item" onClick={toggleTheme} data-tooltip={theme === "dark" ? "Modo Claro" : "Modo Oscuro"} aria-label="Cambiar tema">
          {theme === "dark" ? <IconSun /> : <IconMoon />}
        </button>
      </div>
    </div>
  );
}
