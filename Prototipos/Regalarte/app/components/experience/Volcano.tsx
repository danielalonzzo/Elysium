"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { lerp, seededUnit, smoothRange } from "./storyMath";
import type { ExperienceMotion, QualitySettings } from "./types";

type VolcanoProps = {
  motion: MutableRefObject<ExperienceMotion>;
  settings: QualitySettings;
  staticMotion: boolean;
};

function makeVolcanoGeometry(settings: QualitySettings) {
  const geometry = new THREE.CylinderGeometry(
    0.28,
    4.25,
    4.8,
    settings.volcanoRadialSegments,
    settings.volcanoHeightSegments,
    false,
  );
  const positions = geometry.attributes.position as THREE.BufferAttribute;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const angle = Math.atan2(z, x);
    const altitude = (y + 2.4) / 4.8;
    const ridge =
      1 +
      Math.sin(angle * 5 + altitude * 8.4) * 0.055 +
      Math.sin(angle * 11 - altitude * 5.1) * 0.025;
    const weathering = 1 + Math.sin(altitude * 31 + angle * 3) * 0.018;
    positions.setX(index, x * ridge * weathering);
    positions.setZ(index, z * ridge * weathering);
    positions.setY(index, y + Math.sin(angle * 7) * (1 - altitude) * 0.035);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function InstancedForest({
  motion,
  settings,
}: Pick<VolcanoProps, "motion" | "settings">) {
  const group = useRef<THREE.Group>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    if (!trunks.current || !crowns.current) return;

    for (let index = 0; index < settings.treeCount; index += 1) {
      const angle = seededUnit(index, 1) * Math.PI * 2;
      const radius = 2.6 + seededUnit(index, 2) * 4.2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius - 0.45;
      const scale = 0.68 + seededUnit(index, 3) * 0.72;

      dummy.position.set(x, -1.88, z);
      dummy.rotation.set(0, seededUnit(index, 4) * Math.PI, 0);
      dummy.scale.set(scale * 0.13, scale * 0.58, scale * 0.13);
      dummy.updateMatrix();
      trunks.current.setMatrixAt(index, dummy.matrix);

      dummy.position.set(x, -1.15 + scale * 0.15, z);
      dummy.rotation.set(0, seededUnit(index, 5) * Math.PI, 0);
      dummy.scale.set(scale * 0.43, scale * 0.82, scale * 0.43);
      dummy.updateMatrix();
      crowns.current.setMatrixAt(index, dummy.matrix);
    }

    trunks.current.instanceMatrix.needsUpdate = true;
    crowns.current.instanceMatrix.needsUpdate = true;
    trunks.current.computeBoundingSphere();
    crowns.current.computeBoundingSphere();
  }, [dummy, settings.treeCount]);

  useFrame(() => {
    if (!group.current) return;
    const progress = motion.current.progress;
    const arrival = smoothRange(0.08, 0.31, progress);
    const tide = smoothRange(0.58, 0.82, progress);
    const scale = lerp(0.78, 1, arrival);
    group.current.scale.setScalar(scale);
    group.current.position.x = lerp(0, -3.4, tide);
    group.current.position.y = lerp(-0.42, 0, arrival) - tide * 0.14;
    group.current.rotation.y = tide * -0.12;
  });

  return (
    <group ref={group}>
      <instancedMesh ref={trunks} args={[undefined, undefined, settings.treeCount]}>
        <cylinderGeometry args={[0.42, 0.64, 2, 5]} />
        <meshStandardMaterial color="#4f2d1c" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, settings.treeCount]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#1e6a3f" roughness={0.95} flatShading />
      </instancedMesh>
    </group>
  );
}

function MountainMist({
  motion,
  settings,
  staticMotion,
}: VolcanoProps) {
  const mist = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    if (!mist.current) return;
    for (let index = 0; index < settings.mistCount; index += 1) {
      const angle = seededUnit(index, 11) * Math.PI * 2;
      const radius = 1.6 + seededUnit(index, 12) * 4.8;
      dummy.position.set(
        Math.cos(angle) * radius,
        -0.6 + seededUnit(index, 13) * 2.6,
        Math.sin(angle) * radius + 0.4,
      );
      dummy.scale.set(
        1.5 + seededUnit(index, 14) * 1.7,
        0.22 + seededUnit(index, 15) * 0.25,
        0.42 + seededUnit(index, 16) * 0.5,
      );
      dummy.updateMatrix();
      mist.current.setMatrixAt(index, dummy.matrix);
    }
    mist.current.instanceMatrix.needsUpdate = true;
    mist.current.computeBoundingSphere();
  }, [dummy, settings.mistCount]);

  useFrame(() => {
    if (!mist.current) return;
    const progress = motion.current.progress;
    const drift = staticMotion ? 0 : Math.sin(motion.current.time * 0.12) * 0.16;
    mist.current.position.x = drift + lerp(0, -3.5, smoothRange(0.58, 0.82, progress));
    mist.current.position.y = lerp(0.2, -0.35, smoothRange(0.03, 0.3, progress));
    mist.current.rotation.y = staticMotion ? 0 : motion.current.time * 0.008;
  });

  return (
    <instancedMesh
      ref={mist}
      args={[undefined, undefined, settings.mistCount]}
      renderOrder={2}
    >
      <sphereGeometry args={[1, 10, 6]} />
      <meshBasicMaterial
        color="#d9eee0"
        transparent
        opacity={0.095}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export function Volcano({ motion, settings, staticMotion }: VolcanoProps) {
  const volcano = useRef<THREE.Group>(null);
  const geometry = useMemo(() => makeVolcanoGeometry(settings), [settings]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    if (!volcano.current) return;
    const progress = motion.current.progress;
    const arrival = smoothRange(0.02, 0.34, progress);
    const tide = smoothRange(0.57, 0.82, progress);
    const scale = lerp(0.62, 1.16, arrival) * lerp(1, 0.82, tide);
    volcano.current.scale.setScalar(scale);
    volcano.current.position.set(
      lerp(0, -3.5, tide),
      lerp(-2.1, -0.12, arrival) - tide * 0.18,
      lerp(-0.9, -1.4, arrival),
    );
    volcano.current.rotation.y = lerp(-0.06, -0.25, smoothRange(0.34, 0.63, progress));
  });

  return (
    <>
      <group ref={volcano}>
        <mesh geometry={geometry}>
          <meshStandardMaterial color="#214b31" roughness={0.98} flatShading />
        </mesh>
        <mesh position={[0, 2.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.27, 0.085, 8, 32]} />
          <meshStandardMaterial color="#152b21" roughness={1} />
        </mesh>
        <mesh position={[0, -2.37, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[6.1, 48]} />
          <meshStandardMaterial color="#153c2b" roughness={1} />
        </mesh>
      </group>
      <InstancedForest motion={motion} settings={settings} />
      <MountainMist motion={motion} settings={settings} staticMotion={staticMotion} />
    </>
  );
}
