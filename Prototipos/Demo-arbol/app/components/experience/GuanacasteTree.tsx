"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import {
  buildGuanacaste,
  CROWN_R,
  FORK_Y,
  GROUND_Y,
  makeBarkTexture,
  makeButtressGeometry,
  makeGrassTexture,
  makeLimbGeometry,
  makePuffGeometry,
  makeShadowTexture,
  makeSkyTexture,
  makeTrunkGeometry,
  TRUNK_R_BASE,
  type CanopySectorModel,
  type Limb,
  type Puff,
} from "./guanacasteModel";
import { bell, lerp, seededUnit, smoothRange } from "./storyMath";
import type { ExperienceMotion, QualitySettings } from "./types";

/*
 * ACTO 1 · El Árbol Nacional (progress 0.00–0.35) y
 * ACTO 2 · El Umbral (progress 0.35–0.46).
 *
 * Enterolobium cyclocarpum (Árbol Nacional, 1959) como espécimen solitario en
 * una pradera abierta, según la referencia fotográfica de dirección de arte:
 *
 *  · Volumetría fractal, NO low-poly: el esqueleto se subdivide cinco veces y
 *    cada punta sostiene una nube de foliolos con matas satélite.
 *  · Copa hemisférica (domo/sombrilla) cuya envergadura eclipsa varias veces al
 *    tronco y supera la altura total → expansión X/Z dominante.
 *  · Tronco masivo, corto, irregular y con raíces tabulares que se aferran al
 *    terreno; corteza rugosa gris-café con grietas en sombra profunda.
 *  · Iluminación de cielo parcialmente nublado (difusor gigante): hojas
 *    exteriores claras, agrupaciones interiores muy oscuras.
 *  · Sombra elíptica extensa y difusa bajo la copa, con núcleo profundo.
 *  · Grupos de árboles pequeños en el fondo que dan escala por comparación.
 *  · Base rígida y extremos fluidos: la copa se mece por sectores con fases
 *    independientes; el tronco permanece inamovible.
 *
 * La geometría procedimental vive en `guanacasteModel.ts` (determinista, sin
 * React). Se representa el árbol SIN fruto: las vainas «oreja de mono» quedan
 * fuera del modelo por decisión de dirección de arte.
 *
 * ── ASSET HOOK ──────────────────────────────────────────────────────────────
 * Para sustituir por arte real: cargar un GLTF del Guanacaste + planos con
 * textura de canal Alpha para el follaje, conservando la jerarquía de `group` y
 * las curvas de opacidad por acto.
 * ────────────────────────────────────────────────────────────────────────────
 */

type TreeProps = {
  motion: MutableRefObject<ExperienceMotion>;
  settings: QualitySettings;
  staticMotion: boolean;
};

// Verdes de la copa: sombra profunda → verde medio → hoja al cielo.
const LEAF_DEEP = new THREE.Color("#0a1a0e");
const LEAF_MID = new THREE.Color("#2c5525");
const LEAF_LIT = new THREE.Color("#93bb47");

const _color = new THREE.Color();
const _up = new THREE.Vector3(0, 1, 0);
const _dir = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _matrix = new THREE.Matrix4();

/** Tono de la hoja según su exposición al cielo (tres paradas). */
function leafColor(shade: number, target: THREE.Color) {
  if (shade < 0.5) return target.copy(LEAF_DEEP).lerp(LEAF_MID, shade * 2);
  return target.copy(LEAF_MID).lerp(LEAF_LIT, (shade - 0.5) * 2);
}

/** Escribe un segmento de rama en la matriz de instancia (eje Y → dirección). */
function limbMatrix(limb: Limb, yOffset: number) {
  _dir.copy(limb.end).sub(limb.start);
  const len = _dir.length() || 1e-4;
  _dir.divideScalar(len);
  _quat.setFromUnitVectors(_up, _dir);
  _mid.copy(limb.start).add(limb.end).multiplyScalar(0.5);
  _scale.set(limb.radius, len, limb.radius);
  return _matrix.compose(_mid.setY(_mid.y - yOffset), _quat, _scale);
}

/** Escribe una nube de follaje en la matriz de instancia. */
function puffMatrix(puff: Puff, yOffset: number) {
  _quat.setFromEuler(puff.spin);
  _scale.set(puff.radius, puff.radius * puff.squash, puff.radius);
  _mid.copy(puff.pos).setY(puff.pos.y - yOffset);
  return _matrix.compose(_mid, _quat, _scale);
}

// ─────────────────────────────────────────────────────────────────────────────
// Recursos compartidos por toda la pieza.
//
// Cada material que debe desvanecerse al salir del Acto 1 lleva `userData.fade`
// con su factor de opacidad. La escena los recorre desde el `group` raíz (ver
// `fadeScene`) en vez de mutar el objeto de recursos: el compilador de React
// prohíbe modificar valores creados durante el render, y la travesía del grafo
// es además el patrón que ya usa el resto de la experiencia.
// ─────────────────────────────────────────────────────────────────────────────

function createAssets() {
  const bark = makeBarkTexture();
  const grass = makeGrassTexture();
  const shadow = makeShadowTexture();
  const sky = makeSkyTexture();

  const textures = [bark, grass, shadow, sky];

  const geometries = {
    trunk: makeTrunkGeometry(),
    limb: makeLimbGeometry(),
    puff: makePuffGeometry(1, 3.1),
    tuft: makePuffGeometry(0, 7.4),
    flower: new THREE.IcosahedronGeometry(1, 1),
    // Siete contrafuertes de tamaño desigual, como en el espécimen real.
    buttresses: Array.from({ length: 7 }, (_, i) =>
      makeButtressGeometry(
        1.45 + seededUnit(i, 61) * 1.0,
        1.5 + seededUnit(i, 62) * 1.15,
        0.3 + seededUnit(i, 63) * 0.22,
      ),
    ),
  };

  const materials = {
    bark: new THREE.MeshStandardMaterial({
      map: bark,
      bumpMap: bark,
      bumpScale: 0.7,
      color: "#ab9e8d",
      roughness: 1,
      transparent: true,
    }),
    limb: new THREE.MeshStandardMaterial({ color: "#584c40", roughness: 1, transparent: true }),
    // Sin `vertexColors`: el color por instancia viaja en `instanceColor`, que
    // three multiplica por su cuenta. Activar `vertexColors` sin atributo
    // `color` en la geometría multiplicaría por negro y apagaría la copa.
    leaf: new THREE.MeshStandardMaterial({
      roughness: 0.92,
      transparent: true,
      flatShading: true,
    }),
    // Sin emisivo: bajo luz difusa una cabezuela no brilla, sólo es más clara.
    flower: new THREE.MeshStandardMaterial({
      color: "#dbd5ae",
      roughness: 0.9,
      transparent: true,
    }),
    grass: new THREE.MeshStandardMaterial({ map: grass, color: "#eef3e4", roughness: 1, transparent: true }),
    shadow: new THREE.MeshBasicMaterial({
      map: shadow,
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
    sky: new THREE.MeshBasicMaterial({
      map: sky,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
    distant: new THREE.MeshStandardMaterial({ color: "#395730", roughness: 1, transparent: true }),
  };

  // Factor de desvanecimiento por material. El calco de sombra se apaga algo
  // antes: cuando entra la oscuridad no debe quedar rastro de la pradera.
  Object.values(materials).forEach((m) => {
    m.userData.fade = 1;
  });
  materials.shadow.userData.fade = 0.95;

  return { textures, geometries, materials };
}

type Assets = ReturnType<typeof createAssets>;

/** Aplica la opacidad del acto a todo material marcado con `userData.fade`. */
function fadeScene(group: THREE.Object3D, opacity: number) {
  group.traverse((object) => {
    const material = (object as THREE.Mesh).material;
    if (!material || Array.isArray(material)) return;
    const factor = material.userData.fade as number | undefined;
    if (factor !== undefined) material.opacity = opacity * factor;
  });
}

function disposeAssets({ textures, geometries, materials }: Assets) {
  textures.forEach((t) => t.dispose());
  geometries.buttresses.forEach((g) => g.dispose());
  geometries.trunk.dispose();
  geometries.limb.dispose();
  geometries.puff.dispose();
  geometries.tuft.dispose();
  geometries.flower.dispose();
  Object.values(materials).forEach((m) => m.dispose());
}

// ─────────────────────────────────────────────────────────────────────────────
// Piezas
// ─────────────────────────────────────────────────────────────────────────────

/** Tronco irregular + raíces tabulares + raíces superficiales. Rígido. */
function Trunk({ assets, roots }: { assets: Assets; roots: ReturnType<typeof buildGuanacaste>["surfaceRoots"] }) {
  const { geometries, materials } = assets;
  const rootMesh = useRef<THREE.InstancedMesh>(null);

  const buttresses = useMemo(
    () =>
      geometries.buttresses.map((geo, i) => ({
        geo,
        // Reparto desigual del azimut: nada de simetría radial perfecta.
        angle: (i / geometries.buttresses.length) * Math.PI * 2 + (seededUnit(i, 64) - 0.5) * 0.6,
        inset: TRUNK_R_BASE * (0.42 + seededUnit(i, 65) * 0.2),
      })),
    [geometries.buttresses],
  );

  useLayoutEffect(() => {
    if (!rootMesh.current) return;
    roots.forEach((root, i) => {
      _quat.setFromAxisAngle(_up, root.spin);
      _matrix.compose(root.pos, _quat, root.scale);
      rootMesh.current!.setMatrixAt(i, _matrix);
    });
    rootMesh.current.instanceMatrix.needsUpdate = true;
    rootMesh.current.computeBoundingSphere();
  }, [roots]);

  return (
    <group>
      <mesh geometry={geometries.trunk} material={materials.bark} />
      {/* Nudo de la horcadura: entierra la unión tronco → extremidades. */}
      <mesh position={[0, FORK_Y - 0.22, 0]} material={materials.bark}>
        <sphereGeometry args={[0.95, 16, 12]} />
      </mesh>
      {buttresses.map((b, i) => (
        <mesh
          key={`bt${i}`}
          geometry={b.geo}
          material={materials.bark}
          position={[Math.cos(b.angle) * b.inset, GROUND_Y, Math.sin(b.angle) * b.inset]}
          rotation={[0, -b.angle, 0]}
        />
      ))}
      <instancedMesh
        ref={rootMesh}
        args={[geometries.puff, materials.limb, roots.length]}
        frustumCulled={false}
      />
    </group>
  );
}

/** Ramas: un cilindro troncocónico por segmento, en una sola instancia. */
function Limbs({
  limbs,
  assets,
  yOffset = 0,
}: {
  limbs: Limb[];
  assets: Assets;
  yOffset?: number;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    limbs.forEach((limb, i) => mesh.current!.setMatrixAt(i, limbMatrix(limb, yOffset)));
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [limbs, yOffset]);

  if (!limbs.length) return null;
  return (
    <instancedMesh
      ref={mesh}
      args={[assets.geometries.limb, assets.materials.limb, limbs.length]}
      frustumCulled={false}
    />
  );
}

/** Masas de follaje coloreadas por exposición al cielo. */
function Foliage({
  puffs,
  geometry,
  assets,
  yOffset,
}: {
  puffs: Puff[];
  geometry: THREE.BufferGeometry;
  assets: Assets;
  yOffset: number;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    puffs.forEach((puff, i) => {
      mesh.current!.setMatrixAt(i, puffMatrix(puff, yOffset));
      mesh.current!.setColorAt(i, leafColor(puff.shade, _color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [puffs, yOffset]);

  if (!puffs.length) return null;
  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, assets.materials.leaf, puffs.length]}
      frustumCulled={false}
    />
  );
}

/**
 * Sector de copa: ramillas finas + follaje que pivotan sobre la horcadura con
 * fase propia. Al girar alrededor del pivote, el desplazamiento crece con la
 * distancia: las puntas ondean y la base no se mueve, como en el árbol real.
 */
function CanopySector({
  sector,
  index,
  assets,
  motion,
  staticMotion,
}: {
  sector: CanopySectorModel;
  index: number;
  assets: Assets;
  motion: MutableRefObject<ExperienceMotion>;
  staticMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const phase = index * 2.17;

  useFrame(() => {
    if (!group.current || staticMotion) return;
    const t = motion.current.time;
    // Ráfagas: la amplitud respira, así el movimiento no lee periódico.
    const gust = 0.011 + 0.009 * Math.sin(t * 0.23 + phase * 0.7);
    group.current.rotation.x = Math.sin(t * 0.94 + phase) * gust;
    group.current.rotation.z = Math.cos(t * 0.71 + phase * 1.43) * gust;
    group.current.rotation.y = Math.sin(t * 0.37 + phase * 0.9) * gust * 0.6;
  });

  return (
    <group ref={group} position={[0, FORK_Y, 0]}>
      <Limbs limbs={sector.limbs} assets={assets} yOffset={FORK_Y} />
      <Foliage puffs={sector.puffs} geometry={assets.geometries.puff} assets={assets} yOffset={FORK_Y} />
      <Foliage puffs={sector.tufts} geometry={assets.geometries.tuft} assets={assets} yOffset={FORK_Y} />
    </group>
  );
}

/** Flores en cabezuela (pompón) blanco-crema salpicando la copa. */
function Flowers({ positions, assets }: { positions: THREE.Vector3[]; assets: Assets }) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    positions.forEach((pos, i) => {
      _quat.identity();
      const s = 0.07 + seededUnit(i, 71) * 0.05;
      _matrix.compose(pos, _quat, _scale.setScalar(s));
      mesh.current!.setMatrixAt(i, _matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [positions]);

  if (!positions.length) return null;
  return (
    <instancedMesh
      ref={mesh}
      args={[assets.geometries.flower, assets.materials.flower, positions.length]}
      frustumCulled={false}
    />
  );
}

/**
 * Entorno: pradera abierta, cielo nublado, sombra elíptica y grupos de árboles
 * lejanos que dan escala. No rota ni escala con el árbol.
 */
function Environment({ assets, settings }: { assets: Assets; settings: QualitySettings }) {
  const { geometries, materials } = assets;
  const mesh = useRef<THREE.InstancedMesh>(null);

  // Arbolitos agrupados en el fondo (coordenadas Z lejanas).
  const distant = useMemo(() => {
    const out: { pos: THREE.Vector3; scale: THREE.Vector3 }[] = [];
    const clusters = settings.crownPuffs >= 420 ? 11 : 6;
    for (let c = 0; c < clusters; c += 1) {
      // Repartidos por el hemisferio del fondo (Z negativa), que es el que la
      // cámara del Acto 1 encuadra: son la referencia de escala del árbol.
      const azimuth = Math.PI + seededUnit(c, 81) * Math.PI;
      const dist = 34 + seededUnit(c, 82) * 36;
      const cx = Math.cos(azimuth) * dist;
      const cz = Math.sin(azimuth) * dist;
      const trees = 2 + Math.floor(seededUnit(c, 83) * 5);
      for (let t = 0; t < trees; t += 1) {
        const k = c * 11 + t;
        const h = 2.1 + seededUnit(k, 84) * 2.3;
        const r = 1.1 + seededUnit(k, 85) * 1.0;
        const px = cx + (seededUnit(k, 86) - 0.5) * 11;
        const pz = cz + (seededUnit(k, 87) - 0.5) * 11;
        // Dos masas por copa: una ancha abajo, otra menor arriba.
        out.push({
          pos: new THREE.Vector3(px, GROUND_Y + h * 0.55, pz),
          scale: new THREE.Vector3(r, h * 0.36, r),
        });
        out.push({
          pos: new THREE.Vector3(px + r * 0.2, GROUND_Y + h * 0.86, pz - r * 0.2),
          scale: new THREE.Vector3(r * 0.66, h * 0.26, r * 0.66),
        });
      }
    }
    return out;
  }, [settings.crownPuffs]);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    distant.forEach((tree, i) => {
      _quat.setFromAxisAngle(_up, seededUnit(i, 88) * Math.PI * 2);
      _matrix.compose(tree.pos, _quat, tree.scale);
      mesh.current!.setMatrixAt(i, _matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [distant]);

  return (
    <group>
      {/*
        Cielo parcialmente nublado: el difusor que baña la escena. El radio se
        mantiene holgadamente dentro del plano lejano de la cámara para que la
        bóveda no se recorte por detrás.
      */}
      <mesh material={materials.sky} renderOrder={-1}>
        <sphereGeometry args={[58, 32, 16]} />
      </mesh>
      {/* Pradera abierta de pasto uniforme; su borde muere dentro de la niebla. */}
      <mesh position={[0, GROUND_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.grass}>
        <planeGeometry args={[400, 400]} />
      </mesh>
      {/* Sombra elíptica extensa: delimita el territorio del árbol en el suelo. */}
      <mesh
        position={[0.85, GROUND_Y + 0.014, -0.35]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1, 0.62, 1]}
        material={materials.shadow}
      >
        <planeGeometry args={[CROWN_R * 2.3, CROWN_R * 2.3]} />
      </mesh>
      <instancedMesh
        ref={mesh}
        args={[geometries.puff, materials.distant, distant.length]}
        frustumCulled={false}
      />
    </group>
  );
}

/** Cortina de follaje del Acto 2: envuelve la cámara al atravesar la copa. */
function CanopyCurtain({ motion }: { motion: MutableRefObject<ExperienceMotion> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (!material.current || !mesh.current) return;
    const veil = bell(0.13, 0.29, motion.current.progress);
    material.current.opacity = veil * 0.94;
    mesh.current.visible = veil > 0.002;
    mesh.current.scale.setScalar(lerp(4.2, 3.0, smoothRange(0.13, 0.29, motion.current.progress)));
  });

  return (
    <mesh ref={mesh} position={[0, 3.2, 1.8]}>
      <sphereGeometry args={[1, 18, 12]} />
      <meshBasicMaterial ref={material} color="#13301c" side={THREE.BackSide} transparent depthWrite={false} opacity={0} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function GuanacasteTree({ motion, settings, staticMotion }: TreeProps) {
  const root = useRef<THREE.Group>(null);
  const tree = useRef<THREE.Group>(null);

  const model = useMemo(() => buildGuanacaste(settings.crownPuffs), [settings.crownPuffs]);

  /*
   * Texturas, geometrías y materiales se crean una sola vez y se guardan en
   * estado: son recursos imperativos de WebGL cuya opacidad muta cada
   * fotograma (la salida del Acto 1), algo que no cabe en un valor memoizado.
   */
  const [assets] = useState(createAssets);
  useEffect(() => () => disposeAssets(assets), [assets]);

  useFrame(() => {
    if (!root.current || !tree.current) return;
    const p = motion.current.progress;
    const approach = smoothRange(0.0, 0.13, p);
    // El árbol se retira en cuanto cae la oscuridad (0.15), a la vez que se
    // desvanece su cartela.
    const exit = smoothRange(0.15, 0.27, p);
    const opacity = 1 - exit;

    // Sólo el árbol crece y gira; la pradera y el cielo se quedan quietos.
    tree.current.scale.setScalar(lerp(0.92, 1.12, approach));
    tree.current.position.y = lerp(-0.2, 0, approach);
    const drift = staticMotion ? 0 : motion.current.time * 0.03;
    tree.current.rotation.y = p * 0.55 + drift;

    fadeScene(root.current, opacity);

    root.current.visible = p < 0.32;
  });

  return (
    <group ref={root}>
      <Environment assets={assets} settings={settings} />
      <group ref={tree}>
        <Trunk assets={assets} roots={model.surfaceRoots} />
        <Limbs limbs={model.structural} assets={assets} />
        {model.sectors.map((sector, i) => (
          <CanopySector
            key={`s${i}`}
            sector={sector}
            index={i}
            assets={assets}
            motion={motion}
            staticMotion={staticMotion}
          />
        ))}
        <Flowers positions={model.flowers} assets={assets} />
      </group>
      <CanopyCurtain motion={motion} />
    </group>
  );
}
