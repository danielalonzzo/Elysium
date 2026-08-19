"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { clamp01, lerp, smoothRange } from "./storyMath";
import type { ExperienceMotion, ExperienceQuality, QualitySettings } from "./types";
import { Volcano } from "./Volcano";

type ExperienceSceneProps = {
  progress: number;
  quality: ExperienceQuality;
  settings: QualitySettings;
  paused: boolean;
};

const FOREST_SKY = new THREE.Color("#071f1a");
const PACIFIC_SKY = new THREE.Color("#71c9c2");
const DUSK_SKY = new THREE.Color("#163f38");
const cameraTarget = new THREE.Vector3();
const blendedSky = new THREE.Color();

export function ExperienceScene({
  progress,
  quality,
  settings,
  paused,
}: ExperienceSceneProps) {
  const motion = useRef<ExperienceMotion>({ progress: clamp01(progress), time: 0 });
  const staticMotion = quality === "reduced" || paused;
  const sun = useRef<THREE.DirectionalLight>(null);

  useFrame(({ camera, scene }, delta) => {
    const safeTarget = clamp01(progress);
    const reducedTarget = safeTarget < 0.59 ? 0.22 : 0.88;
    const target = quality === "reduced" ? reducedTarget : safeTarget;
    motion.current.progress = staticMotion
      ? target
      : THREE.MathUtils.damp(motion.current.progress, target, 5.5, Math.min(delta, 0.1));
    if (!staticMotion) motion.current.time += Math.min(delta, 0.05);

    const current = motion.current.progress;
    const approach = smoothRange(0.02, 0.36, current);
    const orbit = smoothRange(0.33, 0.64, current);

    const volcanoCameraX = lerp(0.15, 5.75, orbit);
    const volcanoCameraY = lerp(2.55, 3.3, approach);
    const volcanoCameraZ = lerp(11.4, 6.1, Math.max(approach * 0.72, orbit));

    camera.position.set(volcanoCameraX, volcanoCameraY, volcanoCameraZ);
    cameraTarget.set(0, 0.2, -1.15);
    camera.lookAt(cameraTarget);

    blendedSky.copy(FOREST_SKY).lerp(DUSK_SKY, orbit * 0.45);
    if (scene.background instanceof THREE.Color) scene.background.copy(blendedSky);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(blendedSky);
      scene.fog.near = 5.8;
      scene.fog.far = 18;
    }
    if (sun.current) {
      sun.current.intensity = 1.35;
      sun.current.position.x = -5;
    }
  });

  return (
    <>
      <color attach="background" args={[FOREST_SKY]} />
      <fog attach="fog" args={[FOREST_SKY, 5.8, 18]} />
      <hemisphereLight args={["#d9f2d4", "#07150f", 1.7]} />
      <directionalLight ref={sun} position={[-5, 8, 6]} color="#ffe4b5" intensity={1.35} />
      <ambientLight intensity={0.28} />
      <Volcano motion={motion} settings={settings} staticMotion={staticMotion} />
    </>
  );
}
