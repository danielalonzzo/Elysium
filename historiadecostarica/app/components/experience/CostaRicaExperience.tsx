"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { ExperienceScene } from "./ExperienceScene";
import { QUALITY_SETTINGS, type CostaRicaExperienceProps } from "./types";

/*
 * Entregable #3 · Componente R3F que contiene la escena, cámaras, luces y
 * animaciones atadas al progreso de scroll.
 *
 * Rendimiento (regla del §6 del informe): el canvas usa `frameloop="demand"`
 * cuando la escena está pausada (fuera del viewport o pestaña oculta), de modo
 * que no consume batería mientras no se ve.
 */
export function CostaRicaExperience({
  progress,
  quality = "desktop",
  paused = false,
  className,
  style,
  fallback = null,
}: CostaRicaExperienceProps) {
  const settings = QUALITY_SETTINGS[quality];
  const staticCanvas = quality === "reduced" || paused;

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        ...style,
      }}
    >
      <Canvas
        aria-hidden="true"
        tabIndex={-1}
        dpr={settings.dpr}
        frameloop={staticCanvas ? "demand" : "always"}
        camera={{ position: [0.2, 1.9, 19], fov: quality === "mobile" ? 58 : 50, near: 0.1, far: 260 }}
        gl={{
          alpha: true,
          antialias: settings.antialias,
          powerPreference: "high-performance",
          stencil: false,
        }}
        performance={{ min: 0.5 }}
        fallback={fallback}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = quality === "mobile" ? 1.02 : 1.1;
        }}
        style={{ display: "block", width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <ExperienceScene progress={progress} quality={quality} settings={settings} paused={paused} />
      </Canvas>
    </div>
  );
}
