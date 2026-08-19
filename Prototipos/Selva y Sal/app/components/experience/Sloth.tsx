"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { lerp, smoothRange } from "./storyMath";
import type { ExperienceMotion } from "./types";

type SlothProps = {
  motion: MutableRefObject<ExperienceMotion>;
  staticMotion: boolean;
};

export function Sloth({ motion, staticMotion }: SlothProps) {
  const slothRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!slothRef.current) return;
    const progress = motion.current.progress;
    const reveal = smoothRange(0.68, 0.91, progress);
    
    // Position exactly in the center of the island
    // Island position is [7.1, lerp(-3.1, -1.06, reveal), -5.6]
    slothRef.current.position.set(
      7.1,
      lerp(-3.1, -1.06, reveal) + 1.75, // +1.75 to rest the bottom of the sloth on top of the island mesh
      -5.6
    );
    
    // Face the camera (camera is +Z relative to the island, so we rotate by 90 degrees)
    // The sloth was built facing -X, so rotating Math.PI / 2 points it to +Z.
    slothRef.current.rotation.set(0, Math.PI / 2 - 0.2, 0); // Slight offset to look directly at the offset camera

    // Always visible, scaled up slightly
    slothRef.current.visible = true;
    
    // Gentle breathing animation
    const breath = staticMotion ? 0 : Math.sin(motion.current.time * 2.0) * 0.03;
    const baseScale = lerp(0.54, 0.8, reveal); // Match the island's scale but keep the sloth slightly smaller
    slothRef.current.scale.set(
      baseScale * (1 + breath * 0.5),
      baseScale * (1 - breath),
      baseScale * (1 + breath * 0.5)
    );
  });

  return (
    <group ref={slothRef} visible={false}>
      {/* Main Body */}
      <mesh scale={[0.6, 0.45, 0.5]} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      
      {/* Face Mask (Lighter color) */}
      <mesh scale={[0.3, 0.25, 0.25]} position={[-0.45, 0.1, 0]}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#E6D3B3" roughness={0.8} />
      </mesh>
      
      {/* Eye patches (Dark) */}
      <mesh scale={[0.08, 0.08, 0.04]} position={[-0.65, 0.15, 0.15]} rotation={[0, -0.4, 0]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#4A3B2B" roughness={0.9} />
      </mesh>
      <mesh scale={[0.08, 0.08, 0.04]} position={[-0.65, 0.15, -0.15]} rotation={[0, 0.4, 0]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#4A3B2B" roughness={0.9} />
      </mesh>
      
      {/* Eyes (Black) */}
      <mesh scale={[0.025, 0.025, 0.025]} position={[-0.72, 0.15, 0.15]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh scale={[0.025, 0.025, 0.025]} position={[-0.72, 0.15, -0.15]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* Nose */}
      <mesh scale={[0.04, 0.03, 0.04]} position={[-0.72, 0.05, 0]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#2B1D12" roughness={0.8} />
      </mesh>
      
      {/* Arms (Resting) */}
      <mesh scale={[0.25, 0.15, 0.15]} position={[-0.2, -0.2, 0.4]} rotation={[0, 0, 0.4]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#7A654A" roughness={0.9} />
      </mesh>
      <mesh scale={[0.25, 0.15, 0.15]} position={[-0.2, -0.2, -0.4]} rotation={[0, 0, 0.4]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#7A654A" roughness={0.9} />
      </mesh>
      
      {/* Back legs */}
      <mesh scale={[0.2, 0.15, 0.15]} position={[0.3, -0.25, 0.3]} rotation={[0, 0, -0.2]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#7A654A" roughness={0.9} />
      </mesh>
      <mesh scale={[0.2, 0.15, 0.15]} position={[0.3, -0.25, -0.3]} rotation={[0, 0, -0.2]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#7A654A" roughness={0.9} />
      </mesh>
    </group>
  );
}
