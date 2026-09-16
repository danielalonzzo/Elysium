"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { ATLAS_COLS, ATLAS_ROWS, makeCardAtlas } from "./cardAtlas";
import { clamp01, lerp, seededUnit, smoothRange } from "./storyMath";
import type { ExperienceMotion, QualitySettings } from "./types";

/*
 * ACTO 4 · La Revelación del Producto (progress 0.75–1.00).
 *
 * De la órbita de la esfera surgen las cartas (80 en el producto
 * real) y se ordenan en una línea del tiempo helicoidal y flotante. Cada carta
 * emerge de forma escalonada por índice → lectura cronológica.
 *
 * El arte sale de un atlas de 4×4 dibujado en un `<canvas>` (`cardAtlas.ts`),
 * no de un archivo: la escena entera es procedimental y así sigue sin depender
 * de ningún asset en disco. Cada instancia recibe su casilla en el atributo
 * `aTile` y el desplazamiento de UV se inyecta en el vértice, que es lo único
 * que permite variar la textura entre instancias de un `InstancedMesh`.
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

  const atlas = useMemo(() => makeCardAtlas(), []);

  /*
   * Material propio en vez de `<meshStandardMaterial>` como hijo: `onBeforeCompile`
   * tiene que estar puesto antes de la primera compilación del shader.
   *
   * El desplazamiento se aplica sobre las varyings de UV ya calculadas por
   * `uv_vertex`, con sus propios `#ifdef`: así vale igual para el mapa de color
   * y para el emisivo, y no se rompe si three deja de declarar alguno.
   */
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.62,
      metalness: 0,
      emissive: new THREE.Color("#efe7d6"),
      // Con ilustración, el emisivo plano de antes (0.26) lavaba el dibujo. Se
      // baja y se modula con el propio atlas: las cartas siguen leyéndose en el
      // vacío oscuro del Acto 4 sin comerse el arte.
      emissiveIntensity: atlas ? 0.12 : 0.26,
    });
    if (atlas) {
      mat.map = atlas;
      mat.emissiveMap = atlas;
      const su = 1 / ATLAS_COLS;
      const sv = 1 / ATLAS_ROWS;
      mat.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "attribute vec2 aTile;\n#include <common>")
          .replace(
            "#include <uv_vertex>",
            `#include <uv_vertex>
            #ifdef USE_MAP
              vMapUv = vMapUv * vec2( ${su.toFixed(6)}, ${sv.toFixed(6)} ) + aTile;
            #endif
            #ifdef USE_EMISSIVEMAP
              vEmissiveMapUv = vEmissiveMapUv * vec2( ${su.toFixed(6)}, ${sv.toFixed(6)} ) + aTile;
            #endif`
          );
      };
    }
    return mat;
  }, [atlas]);

  useEffect(
    () => () => {
      material.dispose();
      atlas?.dispose();
    },
    [material, atlas]
  );

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
    const mesh_ = mesh.current;
    if (!mesh_) return;
    // `aTile` es la esquina de la casilla del atlas, ya en coordenadas UV.
    const tiles = new Float32Array(count * 2);
    const total = ATLAS_COLS * ATLAS_ROWS;
    for (let i = 0; i < count; i += 1) {
      const tile = i % total;
      tiles[i * 2] = (tile % ATLAS_COLS) / ATLAS_COLS;
      tiles[i * 2 + 1] = Math.floor(tile / ATLAS_COLS) / ATLAS_ROWS;
      // El tinte por instancia se conserva: multiplica al atlas y devuelve la
      // variación de pergamino carta a carta.
      _parchment.copy(PARCH_A).lerp(PARCH_B, seededUnit(i, 41));
      mesh_.setColorAt(i, _parchment);
    }
    mesh_.geometry.setAttribute("aTile", new THREE.InstancedBufferAttribute(tiles, 2));
    if (mesh_.instanceColor) mesh_.instanceColor.needsUpdate = true;
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
      {/* Sin `vertexColors`: el color por instancia viaja en `instanceColor`, que
          three multiplica por su cuenta. Activar `vertexColors` sin atributo
          `color` en la geometría multiplicaría por negro y apagaría el pergamino. */}
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} material={material}>
        <boxGeometry args={[CARD.w, CARD.h, CARD.d]} />
      </instancedMesh>
    </group>
  );
}
