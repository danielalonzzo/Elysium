"use client";

import { useSyncExternalStore, useEffect, useState } from "react";
import { CONTACT } from "../../data/content";
import { isAnyDockAnimationActive, subscribeDockAnimations } from "../../lib/dockVisibility";
import { IconInstagram, IconSpotify, IconWhatsApp, IconYouTube, IconSun, IconMoon } from "./Icons";

/*
 * F09 · Magic Bottom. Concentra el contacto real del prospecto a un toque —el
 * punto único de conversión que resuelve el dolor diagnosticado (WhatsApp en
 * lugar de fotos + datos bancarios sueltos).
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

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof document !== "undefined") {
      const currentTheme =
        (document.documentElement.dataset.elysiumTheme as "light" | "dark") ||
        (window as any).ElysiumSettings?.get()?.theme ||
        "light";
      setTheme(currentTheme);
      document.documentElement.dataset.elysiumTheme = currentTheme;

      const listener = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail?.theme) setTheme(detail.theme);
      };
      window.addEventListener("elysium:settings:changed", listener);
      return () => window.removeEventListener("elysium:settings:changed", listener);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.elysiumTheme = nextTheme;
    }
    if (typeof window !== "undefined") {
      if ((window as any).ElysiumSettings) {
        (window as any).ElysiumSettings.set({ theme: nextTheme });
      } else {
        try {
          const key = "elysium:f22:settings:v1";
          const current = JSON.parse(localStorage.getItem(key) || "{}");
          current.theme = nextTheme;
          localStorage.setItem(key, JSON.stringify(current));
        } catch (_) {}
      }
    }
  };

  return (
    <div className={`hdc-dock${animationsActive ? " is-anim-hidden" : ""}`} id="contact-dock">
      <div className="hdc-dock-items" role="group" aria-label="Contacto rápido">
        <a className="hdc-dock-item is-whatsapp" href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" data-tooltip="WhatsApp" aria-label="Escribir por WhatsApp">
          <IconWhatsApp />
        </a>
        <span className="hdc-dock-divider" aria-hidden="true" />
        <a className="hdc-dock-item" href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" data-tooltip="Instagram" aria-label="Instagram">
          <IconInstagram />
        </a>
        <a className="hdc-dock-item" href={CONTACT.youtube} target="_blank" rel="noopener noreferrer" data-tooltip="YouTube" aria-label="YouTube">
          <IconYouTube />
        </a>
        <a className="hdc-dock-item" href={CONTACT.spotify} target="_blank" rel="noopener noreferrer" data-tooltip="Spotify" aria-label="Spotify">
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
