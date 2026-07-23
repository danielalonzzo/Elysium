"use client";

import { useEffect, useState } from "react";
import type { RgxExperienceMode } from "./types";

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
 * Resuelve la variante accesible antes de montar cualquier motor 3D.
 * F22 puede usar `forceStatic`; la preferencia del sistema siempre prevalece.
 */
export function useExperienceMode({
  forceStatic = false,
  allowWithoutWebGL = false,
}: {
  forceStatic?: boolean;
  allowWithoutWebGL?: boolean;
} = {}): RgxExperienceMode {
  const [mode, setMode] = useState<RgxExperienceMode>("static");

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resolve = () => {
      const lacksWebGL = !allowWithoutWebGL && !canCreateWebGLContext();
      const elysiumReduced = document.documentElement.dataset.elysiumMotion === "reduced";
      setMode(forceStatic || preference.matches || elysiumReduced || lacksWebGL ? "static" : "cinematic");
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
  }, [allowWithoutWebGL, forceStatic]);

  return mode;
}
