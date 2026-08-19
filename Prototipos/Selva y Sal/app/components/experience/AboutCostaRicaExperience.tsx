"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { AboutExperienceScene } from "./AboutExperienceScene";
import { QUALITY_SETTINGS, type CostaRicaExperienceProps } from "./types";

export function AboutCostaRicaExperience({
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
        camera={{ position: [5.75, 3.3, 6.1], fov: quality === "mobile" ? 54 : 48, near: 0.1, far: 80 }}
        gl={{
          alpha: false,
          antialias: settings.antialias,
          powerPreference: "high-performance",
          stencil: false,
        }}
        performance={{ min: 0.55 }}
        fallback={fallback}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = quality === "mobile" ? 1 : 1.08;
        }}
        style={{ display: "block", width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <AboutExperienceScene
          progress={progress}
          quality={quality}
          settings={settings}
          paused={paused}
        />
      </Canvas>
    </div>
  );
}
