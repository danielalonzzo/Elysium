"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Pacific } from "./Pacific";
import { clamp01, lerp } from "./storyMath";
import { Toucan } from "./Toucan";
import { Sloth } from "./Sloth";
import type { ExperienceMotion, ExperienceQuality, QualitySettings } from "./types";

type AboutExperienceSceneProps = {
  progress: number;
  quality: ExperienceQuality;
  settings: QualitySettings;
  paused: boolean;
};

// Bright, sunny day colors
const SUNNY_SKY = new THREE.Color("#90d2f0");
const SUNNY_HORIZON = new THREE.Color("#e0f4fc");

const cameraTarget = new THREE.Vector3();
const blendedSky = new THREE.Color();

export function AboutExperienceScene({
  progress,
  quality,
  settings,
  paused,
}: AboutExperienceSceneProps) {
  // We map the 0..1 page progress to the 0.5..1.0 range of the original animation
  const mappedProgress = lerp(0.5, 1.0, clamp01(progress));
  
  const motion = useRef<ExperienceMotion>({ progress: mappedProgress, time: 0 });
  const staticMotion = quality === "reduced" || paused;
  const sun = useRef<THREE.DirectionalLight>(null);

  useFrame(({ camera, scene }, delta) => {
    const safeTarget = lerp(0.5, 1.0, clamp01(progress));
    const target = quality === "reduced" ? 0.9 : safeTarget;
    
    motion.current.progress = staticMotion
      ? target
      : THREE.MathUtils.damp(motion.current.progress, target, 5.5, Math.min(delta, 0.1));
    
    if (!staticMotion) motion.current.time += Math.min(delta, 0.05);

    const current = motion.current.progress;
    
    // We only care about the coast portion (0.58 to 0.9) to position the camera
    const coast = clamp01((current - 0.58) / (0.9 - 0.58));

    // Camera starts a bit pulled back and moves into the coast
    camera.position.set(
      lerp(5.75, 7.1, coast),
      lerp(3.3, 3.15, coast),
      lerp(6.1, 8.4, coast),
    );
    cameraTarget.set(
      lerp(5.0, 7.0, coast),
      lerp(0.5, -0.15, coast),
      lerp(-2.0, -4.6, coast),
    );
    camera.lookAt(cameraTarget);

    blendedSky.copy(SUNNY_SKY).lerp(SUNNY_HORIZON, 1 - coast * 0.5);
    if (scene.background instanceof THREE.Color) scene.background.copy(blendedSky);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(blendedSky);
      scene.fog.near = lerp(6.0, 8.2, coast);
      scene.fog.far = lerp(20, 28, coast);
    }
    
    if (sun.current) {
      sun.current.intensity = 2.2;
      sun.current.position.set(8, 12, 4); // High sunny angle
    }
  });

  return (
    <>
      <color attach="background" args={[SUNNY_SKY]} />
      <fog attach="fog" args={[SUNNY_SKY, 8, 25]} />
      <hemisphereLight args={["#ffffff", "#447766", 2.0]} />
      <directionalLight ref={sun} position={[8, 12, 4]} color="#fffaeb" intensity={2.2} />
      <ambientLight intensity={0.6} />
      <Pacific motion={motion} settings={settings} staticMotion={staticMotion} />
      <Sloth motion={motion} staticMotion={staticMotion} />
      <Toucan motion={motion} staticMotion={staticMotion} />
    </>
  );
}
