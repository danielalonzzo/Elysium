"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// El motor 3D se carga en cliente y sólo cuando hace falta (no en SSR).
const LazyTreeExperience = dynamic(
  () => import("./TreeExperience").then((m) => m.TreeExperience),
  { ssr: false },
);

/**
 * Envuelve el canvas: elige la calidad (móvil/escritorio) y lo pausa cuando la
 * portada sale del viewport o la pestaña se oculta, para no gastar batería.
 */
export function CinematicVisual({
  progress,
  onReady,
}: {
  progress: number;
  onReady?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inViewRef = useRef(true);
  const [quality, setQuality] = useState<"desktop" | "mobile">("mobile");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const compact = window.matchMedia("(max-width: 767px)");
    const updateQuality = () => setQuality(compact.matches ? "mobile" : "desktop");
    updateQuality();
    compact.addEventListener("change", updateQuality);

    const updateVisibility = () =>
      setPaused(document.visibilityState !== "visible" || !inViewRef.current);
    document.addEventListener("visibilitychange", updateVisibility);
    updateVisibility();

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0.01 },
    );
    if (rootRef.current) observer.observe(rootRef.current);

    return () => {
      compact.removeEventListener("change", updateQuality);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="hdc-cinematic-canvas" aria-hidden="true">
      <LazyTreeExperience
        progress={progress}
        quality={quality}
        paused={paused}
        className="hdc-cinematic-experience"
        onReady={onReady}
      />
    </div>
  );
}
