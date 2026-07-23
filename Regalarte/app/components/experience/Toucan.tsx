"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { lerp, smoothRange } from "./storyMath";
import type { ExperienceMotion } from "./types";

type ToucanProps = {
  motion: MutableRefObject<ExperienceMotion>;
  staticMotion: boolean;
};

export function Toucan({ motion, staticMotion }: ToucanProps) {
  const bird = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Group>(null);
  const rightWing = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!bird.current || !leftWing.current || !rightWing.current) return;
    const progress = motion.current.progress;
    const flight = smoothRange(0.7, 0.98, progress);
    const visible = smoothRange(0.67, 0.73, progress) * (1 - smoothRange(0.985, 1, progress));
    const arc = Math.sin(flight * Math.PI);
    const flutter = staticMotion ? 0.08 : Math.sin(motion.current.time * 11.5) * 0.54;

    bird.current.visible = visible > 0.01;
    bird.current.position.set(
      lerp(-2.5, 12.5, flight),
      0.5 + arc * 0.8 + (staticMotion ? 0 : Math.sin(motion.current.time * 2.2) * 0.08),
      lerp(-3.5, -1.2, flight),
    );
    bird.current.rotation.set(
      -0.08 + arc * 0.08,
      -0.6 - Math.PI / 2 - (40 * Math.PI) / 180 + Math.sin(flight * Math.PI * 2) * 0.09,
      Math.sin(flight * Math.PI * 2) * 0.08,
    );
    bird.current.scale.setScalar(lerp(0.32, 0.72, arc) * visible);
    leftWing.current.rotation.z = 0.28 + flutter;
    rightWing.current.rotation.z = -0.28 - flutter;
  });

  return (
    <group ref={bird} visible={false}>
      <mesh scale={[0.72, 0.56, 0.48]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#101715" roughness={0.8} />
      </mesh>
      <mesh position={[0.12, -0.18, 0]} scale={[0.46, 0.42, 0.39]}>
        <sphereGeometry args={[1, 14, 9]} />
        <meshStandardMaterial color="#f2d765" roughness={0.82} />
      </mesh>
      <mesh position={[-0.56, 0.28, 0]} scale={[0.46, 0.44, 0.42]}>
        <sphereGeometry args={[1, 14, 9]} />
        <meshStandardMaterial color="#111b18" roughness={0.82} />
      </mesh>
      <mesh position={[-1.15, 0.31, 0]} scale={[0.92, 0.26, 0.3]}>
        <sphereGeometry args={[1, 14, 8]} />
        <meshStandardMaterial color="#f2a13c" roughness={0.72} />
      </mesh>
      <mesh position={[-1.73, 0.31, 0]} scale={[0.25, 0.2, 0.25]}>
        <sphereGeometry args={[1, 12, 7]} />
        <meshStandardMaterial color="#66b76f" roughness={0.74} />
      </mesh>
      <mesh position={[-0.78, 0.43, 0.36]} scale={[0.07, 0.07, 0.04]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#f7f3d8" />
      </mesh>
      <mesh position={[-0.79, 0.44, 0.39]} scale={[0.034, 0.034, 0.025]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      <group ref={leftWing} position={[0.05, 0.1, 0.42]}>
        <mesh position={[0.38, 0, 0]} scale={[0.72, 0.16, 0.34]} rotation={[0, 0, -0.18]}>
          <sphereGeometry args={[1, 12, 7]} />
          <meshStandardMaterial color="#17251f" roughness={0.9} />
        </mesh>
      </group>
      <group ref={rightWing} position={[0.05, 0.1, -0.42]}>
        <mesh position={[0.38, 0, 0]} scale={[0.72, 0.16, 0.34]} rotation={[0, 0, 0.18]}>
          <sphereGeometry args={[1, 12, 7]} />
          <meshStandardMaterial color="#17251f" roughness={0.9} />
        </mesh>
      </group>
      <mesh position={[0.68, 0.03, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[0.65, 0.22, 0.22]}>
        <coneGeometry args={[0.62, 1.4, 5]} />
        <meshStandardMaterial color="#121b18" roughness={0.9} />
      </mesh>
    </group>
  );
}
