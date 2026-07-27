"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { lerp, seededUnit, smoothRange } from "./storyMath";
import type { ExperienceMotion, QualitySettings } from "./types";

type PacificProps = {
  motion: MutableRefObject<ExperienceMotion>;
  settings: QualitySettings;
  staticMotion: boolean;
};

const OCEAN_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  varying float vWave;
  varying float vDepth;

  void main() {
    vec3 p = position;
    float primary = sin(p.x * 0.62 + uTime * 0.9) * 0.10;
    float crossing = sin(p.y * 0.86 - uTime * 1.15 + p.x * 0.18) * 0.065;
    float detail = sin((p.x + p.y) * 1.75 + uTime * 1.55) * 0.025;
    float wave = (primary + crossing + detail) * uReveal;
    p.z += wave;
    vWave = wave;
    vDepth = clamp((p.y + 7.0) / 14.0, 0.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const OCEAN_FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;
  varying float vWave;
  varying float vDepth;

  void main() {
    vec3 deep = vec3(0.015, 0.235, 0.285);
    vec3 lagoon = vec3(0.02, 0.63, 0.62);
    vec3 color = mix(deep, lagoon, vDepth * 0.72 + 0.12);
    float crest = smoothstep(0.09, 0.18, vWave);
    color = mix(color, vec3(0.77, 0.97, 0.89), crest * 0.56);
    gl_FragColor = vec4(color, uOpacity);
  }
`;

function Ocean({ motion, settings, staticMotion }: PacificProps) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uOpacity: { value: 0 },
    }),
    [],
  );

  useFrame(() => {
    if (!group.current || !material.current) return;
    const progress = motion.current.progress;
    const reveal = smoothRange(0.54, 0.79, progress);
    material.current.uniforms.uTime.value = staticMotion ? 0.75 : motion.current.time;
    material.current.uniforms.uReveal.value = staticMotion ? 0.34 : reveal;
    material.current.uniforms.uOpacity.value = lerp(0, 0.94, reveal);
    group.current.position.z = lerp(9.5, -3.2, reveal);
    group.current.position.y = lerp(-1.55, -1.12, reveal);
    group.current.rotation.z = lerp(-0.06, 0, reveal);
  });

  return (
    <group ref={group} position={[4.6, -1.55, 9.5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
        <planeGeometry args={[25, 14, settings.waveSegments, settings.waveSegments]} />
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={OCEAN_VERTEX_SHADER}
          fragmentShader={OCEAN_FRAGMENT_SHADER}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Palms({ motion, settings }: Pick<PacificProps, "motion" | "settings">) {
  const group = useRef<THREE.Group>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    if (!trunks.current || !crowns.current) return;

    for (let index = 0; index < settings.palmCount; index += 1) {
      const angle = seededUnit(index, 31) * Math.PI * 2;
      const radius = 1.1 + seededUnit(index, 32) * 2.15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.72 + seededUnit(index, 33) * 0.56;

      dummy.position.set(x, 0.55, z);
      dummy.rotation.set(0, seededUnit(index, 34) * Math.PI, seededUnit(index, 35) * 0.1 - 0.05);
      dummy.scale.set(scale * 0.12, scale * 0.5, scale * 0.12);
      dummy.updateMatrix();
      trunks.current.setMatrixAt(index, dummy.matrix);

      dummy.position.set(x, 1.14 * scale + 0.2, z);
      dummy.rotation.set(0, seededUnit(index, 36) * Math.PI, 0);
      dummy.scale.set(scale * 0.78, scale * 0.42, scale * 0.78);
      dummy.updateMatrix();
      crowns.current.setMatrixAt(index, dummy.matrix);
    }

    trunks.current.instanceMatrix.needsUpdate = true;
    crowns.current.instanceMatrix.needsUpdate = true;
    trunks.current.computeBoundingSphere();
    crowns.current.computeBoundingSphere();
  }, [dummy, settings.palmCount]);

  useFrame(() => {
    if (!group.current) return;
    const reveal = smoothRange(0.69, 0.9, motion.current.progress);
    group.current.scale.setScalar(lerp(0.5, 1, reveal));
    group.current.position.y = lerp(-1.2, 0, reveal);
  });

  return (
    <group ref={group}>
      <instancedMesh ref={trunks} args={[undefined, undefined, settings.palmCount]}>
        <cylinderGeometry args={[0.48, 0.7, 2, 6]} />
        <meshStandardMaterial color="#74512f" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, settings.palmCount]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#22845b" roughness={0.9} flatShading />
      </instancedMesh>
    </group>
  );
}

function ManuelAntonio({ motion, settings }: Pick<PacificProps, "motion" | "settings">) {
  const island = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!island.current) return;
    const reveal = smoothRange(0.68, 0.91, motion.current.progress);
    island.current.position.y = lerp(-3.1, -1.06, reveal);
    island.current.scale.setScalar(lerp(0.68, 1, reveal));
    island.current.rotation.y = lerp(0.18, -0.04, reveal);
  });

  return (
    <group ref={island} position={[7.1, -3.1, -5.6]}>
      <mesh scale={[3.7, 1.25, 2.25]}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshStandardMaterial color="#355f43" roughness={1} flatShading />
      </mesh>
      <mesh position={[-2.15, -0.18, 1.05]} scale={[2.4, 0.46, 1.35]}>
        <sphereGeometry args={[1, 16, 8]} />
        <meshStandardMaterial color="#d6b578" roughness={1} />
      </mesh>
      <mesh position={[2.7, -0.48, -0.9]} scale={[1.4, 0.82, 1.08]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#294a39" roughness={1} flatShading />
      </mesh>
      <Palms motion={motion} settings={settings} />
    </group>
  );
}

export function Pacific(props: PacificProps) {
  return (
    <>
      <Ocean {...props} />
      <ManuelAntonio motion={props.motion} settings={props.settings} />
    </>
  );
}
