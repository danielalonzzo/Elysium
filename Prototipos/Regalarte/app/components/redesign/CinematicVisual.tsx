"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const LazyCostaRicaExperience = dynamic(
  () => import("../experience").then((module) => module.CostaRicaExperience),
  { ssr: false },
);

export function CinematicVisual({ progress }: { progress: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inViewRef = useRef(true);
  const [quality, setQuality] = useState<"desktop" | "mobile">("mobile");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const compact = window.matchMedia("(max-width: 767px)");
    const updateQuality = () => setQuality(compact.matches ? "mobile" : "desktop");
    updateQuality();
    compact.addEventListener("change", updateQuality);

    const updateVisibility = () => setPaused(document.visibilityState !== "visible" || !inViewRef.current);
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
    <div ref={rootRef} className="rgx-cinematic-canvas" aria-hidden="true">
      <LazyCostaRicaExperience
        progress={progress}
        quality={quality}
        paused={paused}
        className="rgx-cinematic-experience"
      />
    </div>
  );
}
