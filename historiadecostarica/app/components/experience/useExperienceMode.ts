"use client";

import { useEffect, useState } from "react";
import type { ExperienceMode } from "./types";

function canCreateWebGLContext() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2", { powerPreference: "low-power" }) ||
        canvas.getContext("webgl", { powerPreference: "low-power" }),
    );
  } catch {
    return false;
  }
}

/**
 * Resuelve la variante accesible antes de montar el motor 3D.
 * F22 puede forzar `reduced` vía `data-elysium-motion`; la preferencia del
 * sistema (`prefers-reduced-motion`) siempre prevalece. Sin WebGL → estático.
 */
export function useExperienceMode(): ExperienceMode {
  const [mode, setMode] = useState<ExperienceMode>("static");

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resolve = () => {
      const elysiumReduced = document.documentElement.dataset.elysiumMotion === "reduced";
      const lacksWebGL = !canCreateWebGLContext();
      setMode(preference.matches || elysiumReduced || lacksWebGL ? "static" : "cinematic");
    };

    const settingsObserver = new MutationObserver(resolve);
    settingsObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-elysium-motion"],
    });
    resolve();
    preference.addEventListener("change", resolve);
    return () => {
      preference.removeEventListener("change", resolve);
      settingsObserver.disconnect();
    };
  }, []);

  return mode;
}
