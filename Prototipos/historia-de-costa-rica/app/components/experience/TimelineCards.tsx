"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { clamp01, lerp, seededUnit, smoothRange } from "./storyMath";
import type { ExperienceMotion, QualitySettings } from "./types";

/*
 * ACTO 4 · La Revelación del Producto (progress 0.75–1.00).
 *
 * De la órbita de la esfera surgen las cartas del juego (80 en el producto
 * real) y se ordenan en una línea del tiempo helicoidal y flotante. Cada carta
 * emerge de forma escalonada por índice → lectura cronológica.
 *
 * ── ASSET HOOK ──────────────────────────────────────────────────────────────
 * Para el arte real: sustituir la cara instanciada por un atlas de texturas con
 * las 80 ilustraciones (o 80 planos con su textura) manteniendo el helicoide y
 * el escalonado de aparición.
 * ────────────────────────────────────────────────────────────────────────────
 */

type CardsProps = {
  motion: MutableRefObject<ExperienceMotion>;
  settings: QualitySettings;
  staticMotion: boolean;
};

const CENTER = new THREE.Vector3(0, 0.4, -6); // órbita de la esfera del Diquís
/*
 * El perímetro de la hélice debe superar la suma de los anchos de carta, o las
 * 80 cartas se solapan y se leen como una banda continua en vez de como cartas.
 * Con radio 7.0 y 1.35 vueltas: perímetro ≈ 59 u · hueco por carta ≈ 0.74 u,
 * frente a 0.56 u de ancho → queda aire visible entre carta y carta.
 */
const RING_RADIUS = 7.0;
const TURNS = 1.35;
const CARD = { w: 0.56, h: 0.86, d: 0.03 };

const _parchment = new THREE.Color();
// Blanco hueso → beige claro: las cartas deben leerse como CARTAS contra el
// vacío oscuro del Acto 4, no como fragmentos de piedra.
const PARCH_A = new THREE.Color("#fdfaf3");
const PARCH_B = new THREE.Color("#e9dcc2");

export function TimelineCards({ motion, settings, staticMotion }: CardsProps) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = settings.cardCount;

  // Destino helicoidal de cada carta (línea del tiempo) y su punto de origen
  // agrupado junto a la esfera.
  const layout = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const t = count > 1 ? i / (count - 1) : 0;
      const angle = t * Math.PI * 2 * TURNS - Math.PI * TURNS;
      const target = new THREE.Vector3(
        Math.cos(angle) * RING_RADIUS,
        lerp(-2.5, 2.5, t),
        Math.sin(angle) * RING_RADIUS,
      );
      const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();
      const origin = dir.clone().multiplyScalar(0.2 + seededUnit(i, 31) * 0.2);
      return { t, target, origin };
    });
  }, [count]);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    for (let i = 0; i < count; i += 1) {
      _parchment.copy(PARCH_A).lerp(PARCH_B, seededUnit(i, 41));
      mesh.current.setColorAt(i, _parchment);
    }
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [count]);

  useFrame(() => {
    if (!mesh.current || !group.current) return;
    const p = motion.current.progress;
    const emergence = smoothRange(0.78, 1.0, p);
    group.current.visible = p > 0.74;

    // Giro lento de toda la línea del tiempo alrededor de su eje.
    const drift = staticMotion ? 0 : motion.current.time * 0.05;
    group.current.rotation.y = lerp(-0.5, 0.35, emergence) + drift;

    for (let i = 0; i < count; i += 1) {
      const card = layout[i];
      // Aparición escalonada: las cartas «tempranas» salen primero.
      const local = clamp01((emergence - card.t * 0.28) / 0.55);
      dummy.position.lerpVectors(card.origin, card.target, local);
      // La carta mira hacia afuera del anillo (su cara ve a la cámara en el arco cercano).
      dummy.lookAt(0, dummy.position.y, 0);
      const s = lerp(0.02, 1, local);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group} position={[CENTER.x, CENTER.y, CENTER.z]} visible={false}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <boxGeometry args={[CARD.w, CARD.h, CARD.d]} />
        {/* Emisivo cálido tenue: las cartas leen como pergamino incluso en el
            espacio oscuro, sin depender solo de la luz de escena.
            Sin `vertexColors`: el color por instancia viaja en `instanceColor`, que
            three multiplica por su cuenta. Activar `vertexColors` sin atributo
            `color` en la geometría multiplicaría por negro y apagaría el pergamino. */}
        <meshStandardMaterial roughness={0.62} metalness={0} emissive="#efe7d6" emissiveIntensity={0.26} />
      </instancedMesh>
    </group>
  );
}
