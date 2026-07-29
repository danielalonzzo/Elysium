"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { bell, clamp01, lerp, seededUnit, smoothRange } from "./storyMath";
import type { ExperienceMotion, QualitySettings } from "./types";

/*
 * ACTO 3 · El Misterio del Diquís (progress 0.46–0.75) y
 * ACTO 4 · La Revelación (fragmentación, progress 0.75–1.00).
 *
 * Esfera de piedra precolombina. La referencia son las esferas de gabro del
 * Museo Nacional: asombrosamente redondas pero ni lisas ni perfectas, con una
 * cúpula clara lavada por la lluvia y el sol, bases y hendiduras oscurecidas
 * por humedad, musgo y sombra propia, y una superficie porosa y desgastada.
 * La forma grande vive en la geometría; los poros y el grano, en el sombreador,
 * para que el detalle no dependa del recuento de polígonos.
 *
 * En el umbral del Acto 4 la esfera levita y se despieza en fragmentos que
 * salen despedidos, emitiendo anillos de luz cálida.
 *
 * ── ASSET HOOK ──────────────────────────────────────────────────────────────
 * Sustituir por un GLTF pre-fracturado con texturas PBR reales (normal +
 * roughness) manteniendo `core` (pieza íntegra) y `Shards` (despiece) para no
 * tocar la coreografía de fragmentación.
 * ────────────────────────────────────────────────────────────────────────────
 */

type SphereProps = {
  motion: MutableRefObject<ExperienceMotion>;
  settings: QualitySettings;
  staticMotion: boolean;
};

const RADIUS = 1.55;
const SPHERE_POS = new THREE.Vector3(0, 0.4, -6);

/*
 * Paleta del gabro (>90% de las esferas): roca ígnea gris, ligeramente
 * azulada, SIN tintes ocres que la volverían anaranjada. Las esferas reales no
 * tienen un color uniforme, así que estos cinco tonos se reparten por posición:
 * la cúpula tira a `WASHED`, las hendiduras y la base a `DAMP` y `MOSS`.
 */
const STONE_DAMP = new THREE.Color("#2e3134"); // fondo de hendidura, cara húmeda
const STONE_GABRO = new THREE.Color("#53565a"); // gabro limpio
const STONE_WASHED = new THREE.Color("#8b8d88"); // cúpula lavada por la lluvia
const STONE_LICHEN = new THREE.Color("#a8ada4"); // costra de liquen, gris verdoso
const STONE_MOSS = new THREE.Color("#3a3d36"); // musgo en las juntas bajas

/* ── Ruido de valor 3D ──────────────────────────────────────────────────────
 * El mismo algoritmo vive dos veces: aquí en TypeScript (forma y color por
 * vértice) y más abajo en GLSL (poros y grano por píxel). Manteniéndolos
 * idénticos, el relieve grande y el fino describen la misma piedra.
 * ──────────────────────────────────────────────────────────────────────────*/

const fract = (value: number) => value - Math.floor(value);

function hash31(x: number, y: number, z: number) {
  const px = fract(x * 0.3183099 + 0.1) * 17;
  const py = fract(y * 0.3183099 + 0.2) * 17;
  const pz = fract(z * 0.3183099 + 0.3) * 17;
  return fract(px * py * pz * (px + py + pz));
}

function vnoise(x: number, y: number, z: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  /*
   * Interpolación quíntica, no cúbica. El micro-relieve se dibuja DERIVANDO
   * esta altura, y la cúbica deja la segunda derivada discontinua en las caras
   * del retículo: los poros salían escalonados, con esquinas rectas.
   */
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const uz = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
  const c00 = lerpN(hash31(ix, iy, iz), hash31(ix + 1, iy, iz), ux);
  const c10 = lerpN(hash31(ix, iy + 1, iz), hash31(ix + 1, iy + 1, iz), ux);
  const c01 = lerpN(hash31(ix, iy, iz + 1), hash31(ix + 1, iy, iz + 1), ux);
  const c11 = lerpN(hash31(ix, iy + 1, iz + 1), hash31(ix + 1, iy + 1, iz + 1), ux);
  return lerpN(lerpN(c00, c10, uy), lerpN(c01, c11, uy), uz);
}

/** Interpolación cruda, sin el recorte a [0,1] de `lerp`: aquí `t` ya es válido. */
function lerpN(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Cuatro octavas normalizadas a 0..1. Entre octava y octava el dominio se gira:
 * el ruido de valor vive sobre un retículo entero y, sin ese giro, las manchas
 * salen alineadas con los ejes y la piedra se llena de esquinas rectas.
 */
function fbm(x: number, y: number, z: number) {
  let sum = 0;
  let amp = 0.5;
  let px = x;
  let py = y;
  let pz = z;
  for (let i = 0; i < 4; i += 1) {
    sum += amp * vnoise(px, py, pz);
    const rx = -0.8 * py - 0.6 * pz;
    const ry = 0.8 * px + 0.36 * py - 0.48 * pz;
    const rz = 0.6 * px - 0.48 * py + 0.64 * pz;
    px = rx * 2.03;
    py = ry * 2.03;
    pz = rz * 2.03;
    amp *= 0.5;
  }
  return sum / 0.9375;
}

/**
 * Desviación del radio, en unidades de radio, para una dirección de la esfera.
 * Las esferas reales son asombrosamente redondas, pero no son bolas de billar:
 * conservan la ondulación del pulido a mano (`macro`), el desgaste desigual de
 * la intemperie (`meso`), hendiduras poco profundas abiertas por siglos a la
 * intemperie (`hollow`) y una piel granular (`grain`). El total se queda por
 * debajo del 4% del radio: se lee irregular sin dejar de leerse esférica.
 */
function stoneRelief(nx: number, ny: number, nz: number) {
  const macro = fbm(nx * 1.7 + 11.3, ny * 1.7 + 4.1, nz * 1.7 + 7.9) - 0.5;
  const meso = fbm(nx * 4.4 + 2.7, ny * 4.4 + 9.5, nz * 4.4 + 1.2) - 0.5;
  const hollow = smoothRange(0.56, 0.94, vnoise(nx * 3.2 + 21.7, ny * 3.2 + 5.3, nz * 3.2 + 13.1));
  const grain = fbm(nx * 12.5, ny * 12.5, nz * 12.5) - 0.5;
  return macro * 0.045 + meso * 0.02 - hollow * 0.016 + grain * 0.008;
}

function makeStoneGeometry(detail: number) {
  const base = new THREE.IcosahedronGeometry(RADIUS, detail);
  /*
   * El poliedro llega sin índice (tres vértices propios por cara) y con UV que
   * tienen costura. Se borran los atributos que no usamos ANTES de soldar: si
   * no, las UV distintas a ambos lados de la costura impedirían fusionar esos
   * vértices y quedaría una línea de iluminación bajando por la esfera.
   */
  base.deleteAttribute("uv");
  base.deleteAttribute("normal");
  const geometry = mergeVertices(base);
  base.dispose();

  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i).normalize();
    const nx = v.x;
    const ny = v.y;
    const nz = v.z;

    const relief = stoneRelief(nx, ny, nz);
    v.multiplyScalar(RADIUS * (1 + relief));
    // Asentamiento: ninguna esfera del Diquís es de revolución perfecta.
    pos.setXYZ(i, v.x * 1.004, v.y * 0.99, v.z * 1.002);

    /*
     * Lavado vertical. La lluvia y el sol blanquean la cúpula; el agua que
     * escurre y no llega a secarse oscurece la mitad baja. El límite entre
     * ambas zonas no es una línea de latitud, así que lo desordenamos con
     * ruido antes de convertirlo en rampa.
     */
    const drip = fbm(nx * 2.4 + 31.4, ny * 2.4 + 6.2, nz * 2.4 + 18.8) - 0.5;
    const washed = smoothRange(-0.5, 0.72, ny + drip * 0.6);

    c.copy(STONE_DAMP).lerp(STONE_GABRO, smoothRange(0, 0.5, washed));
    /*
     * El salto de tono se queda deliberadamente corto: en la fotografía buena
     * parte del contraste cúpula/base lo pone la luz del cielo, y el
     * hemisférico de la escena ya lo aporta. Subirlo aquí lo contaría dos veces
     * y la piedra saldría con la cúpula quemada.
     */
    c.lerp(STONE_WASHED, smoothRange(0.28, 1, washed) * 0.5);

    // Costras de liquen: manchas claras, más frecuentes en la cara expuesta.
    const lichen = smoothRange(0.54, 0.82, fbm(nx * 6.1 + 3.3, ny * 6.1 + 12.9, nz * 6.1 + 5.5));
    c.lerp(STONE_LICHEN, lichen * (0.3 + washed * 0.7) * 0.4);

    // Las hendiduras acumulan sombra propia, humedad y —abajo— musgo.
    const cavity = clamp01(-relief / 0.026);
    c.lerp(STONE_DAMP, cavity * 0.6);
    const moss = cavity * (1 - washed) * smoothRange(0.48, 0.8, fbm(nx * 8.3 + 15.1, ny * 8.3 + 2.4, nz * 8.3 + 9.7));
    c.lerp(STONE_MOSS, moss * 0.15);

    // Moteado de grano: ninguna zona de la piedra queda en color plano.
    const speck = 0.93 + vnoise(nx * 38, ny * 38, nz * 38) * 0.14;
    colors[i * 3] = c.r * speck;
    colors[i * 3 + 1] = c.g * speck;
    colors[i * 3 + 2] = c.b * speck;
  }

  pos.needsUpdate = true;
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/* ── Micro-relieve por píxel ────────────────────────────────────────────────
 * Los poros y la arenilla son demasiado finos para la malla: se resuelven
 * perturbando la normal en el fragmento, con la misma técnica que el `bumpMap`
 * de three (gradiente por derivadas de pantalla) pero leyendo una altura
 * procedural en vez de una textura. Así la piedra conserva el grano tanto en
 * primer plano como de lejos, y no cuesta ni un vértice más.
 * ──────────────────────────────────────────────────────────────────────────*/

const STONE_NOISE_GLSL = /* glsl */ `
varying vec3 vStonePos;

float hdcHash31(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3)) * 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float hdcVnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  // Quíntica: la cúbica deja la segunda derivada discontinua y, como el relieve
  // se obtiene derivando esta altura, los poros salen escalonados.
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(mix(hdcHash31(i), hdcHash31(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hdcHash31(i + vec3(0.0, 1.0, 0.0)), hdcHash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hdcHash31(i + vec3(0.0, 0.0, 1.0)), hdcHash31(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hdcHash31(i + vec3(0.0, 1.0, 1.0)), hdcHash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

// Giro entre octavas: sin él, el retículo entero del ruido de valor deja
// esquinas rectas por toda la piedra.
const mat3 HDC_ROT = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);

float hdcFbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * hdcVnoise(p);
    p = HDC_ROT * p * 2.03;
    amp *= 0.5;
  }
  return sum / 0.9375;
}

/*
 * Altura de la piel: ondulación, menos los poros abiertos, más la arenilla.
 *
 * Los poros se quedan con las cuatro octavas: con menos, las picaduras salen
 * todas del mismo tamaño y el patrón se vuelve repetitivo. La arenilla, en
 * cambio, baja a una sola: sus octavas altas caen por debajo del píxel, así que
 * solo aportan parpadeo al girar la esfera y coste en el fragmento.
 */
float hdcStoneMicro(vec3 p) {
  float h = hdcFbm(p * 11.0) * 0.6;                      // ondulación de la piel
  h -= smoothstep(0.50, 0.78, hdcFbm(p * 24.0)) * 0.5;   // poros y picaduras
  h += hdcVnoise(p * 58.0) * 0.12;                       // arenilla
  return h;
}
`;

function patchStoneShader(shader: { vertexShader: string; fragmentShader: string }) {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vStonePos;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\n\tvStonePos = position;");

  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>\n${STONE_NOISE_GLSL}`)
    .replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>
	// La cara lavada queda pulverulenta; la húmeda apenas devuelve un brillo.
	roughnessFactor = clamp(roughnessFactor * (0.86 + 0.22 * hdcVnoise(vStonePos * 6.5)), 0.0, 1.0);`
    )
    .replace(
      "#include <normal_fragment_begin>",
      `#include <normal_fragment_begin>
	{
		float hdcH = hdcStoneMicro(vStonePos);
		// En el borde de la silueta la perturbación empujaría normales hacia el
		// otro lado y saldría un moteado negro: allí se apaga.
		float hdcFacing = smoothstep(0.0, 0.32, dot(normal, normalize(vViewPosition)));
		vec2 hdcDeriv = vec2(dFdx(hdcH), dFdy(hdcH)) * (4.5 * hdcFacing);
		vec3 hdcSurf = - vViewPosition;
		vec3 hdcSigmaX = normalize(dFdx(hdcSurf));
		vec3 hdcSigmaY = normalize(dFdy(hdcSurf));
		vec3 hdcR1 = cross(hdcSigmaY, normal);
		vec3 hdcR2 = cross(normal, hdcSigmaX);
		float hdcDet = dot(hdcSigmaX, hdcR1) * faceDirection;
		vec3 hdcGrad = sign(hdcDet) * (hdcDeriv.x * hdcR1 + hdcDeriv.y * hdcR2);
		normal = normalize(abs(hdcDet) * normal - hdcGrad);
	}`
    );
}

function Shards({
  settings,
  motion,
}: {
  settings: QualitySettings;
  motion: MutableRefObject<ExperienceMotion>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Direcciones de vuelo por fragmento (esfera de Fibonacci) + eje/velocidad de giro.
  const shards = useMemo(() => {
    const items: { dir: THREE.Vector3; spin: THREE.Vector3; dist: number; scale: number }[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < settings.shardCount; i += 1) {
      const y = 1 - (i / (settings.shardCount - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      const dir = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).normalize();
      const spin = new THREE.Vector3(seededUnit(i, 21) - 0.5, seededUnit(i, 22) - 0.5, seededUnit(i, 23) - 0.5).normalize();
      items.push({ dir, spin, dist: 1.4 + seededUnit(i, 24) * 2.6, scale: 0.34 + seededUnit(i, 25) * 0.22 });
    }
    return items;
  }, [settings.shardCount]);

  useFrame(() => {
    if (!mesh.current || !material.current) return;
    const p = motion.current.progress;
    const fragment = smoothRange(0.75, 0.94, p);
    // Los fragmentos entran y luego se apagan: el Acto 4 debe quedar limpio,
    // solo con las cartas.
    const shardOpacity = smoothRange(0.73, 0.8, p) * (1 - smoothRange(0.85, 0.95, p));
    material.current.opacity = shardOpacity;
    mesh.current.visible = shardOpacity > 0.004;

    const spinAmount = fragment * Math.PI * 1.4;
    for (let i = 0; i < shards.length; i += 1) {
      const s = shards[i];
      const out = RADIUS * 0.9 + fragment * s.dist;
      dummy.position.copy(s.dir).multiplyScalar(out);
      dummy.rotation.set(s.spin.x * spinAmount, s.spin.y * spinAmount, s.spin.z * spinAmount);
      const sc = s.scale * lerp(0.9, 1, fragment);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, settings.shardCount]} visible={false}>
      <tetrahedronGeometry args={[1, 0]} />
      {/* Cara de fractura: piedra recién partida, sin la pátina de la superficie. */}
      <meshStandardMaterial ref={material} color="#474d51" roughness={0.98} metalness={0} transparent flatShading />
    </instancedMesh>
  );
}

/** Anillos de luz que se expanden desde la esfera al fragmentarse. */
function LightRings({ motion }: { motion: MutableRefObject<ExperienceMotion> }) {
  const rings = [0, 1, 2];
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame(() => {
    const p = motion.current.progress;
    rings.forEach((_, i) => {
      const ring = refs.current[i];
      const mat = mats.current[i];
      if (!ring || !mat) return;
      const phase = 0.75 + i * 0.04;
      const pulse = bell(phase, phase + 0.16, p);
      const s = lerp(0.4, 4.2 + i * 0.8, smoothRange(phase, phase + 0.18, p));
      ring.scale.set(s, s, s);
      mat.opacity = pulse * 0.34;
      ring.visible = pulse > 0.002;
    });
  });

  return (
    <>
      {rings.map((i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          rotation={[Math.PI / 2, 0, 0]}
          visible={false}
        >
          <torusGeometry args={[1, 0.03, 8, 64]} />
          <meshBasicMaterial
            ref={(el) => { mats.current[i] = el; }}
            color="#c8d0d6"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

export function DiquisSphere({ motion, settings, staticMotion }: SphereProps) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);

  // El presupuesto de fragmentos hace de indicador de calidad (ver QUALITY_SETTINGS).
  const detail = settings.shardCount >= 48 ? 5 : settings.shardCount >= 30 ? 4 : 3;
  const geometry = useMemo(() => makeStoneGeometry(detail), [detail]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      // Gabro intemperizado: mate absoluto y sin nada de metal.
      roughness: 1,
      metalness: 0,
      // Rescoldo interior del amanecer. Se mantiene apagado para no lavar la
      // pátina: el brillo sube con `emissiveIntensity` en la coreografía.
      emissive: new THREE.Color("#6f767b"),
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0,
    });
    // `customProgramCacheKey` se deja en su valor por defecto: three lo deriva
    // del código de `onBeforeCompile`, así que cada versión del sombreador
    // obtiene su propio programa. Fijarlo a una constante hacía que se
    // reutilizara el programa anterior al editar el GLSL.
    mat.onBeforeCompile = patchStoneShader;
    return mat;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    if (!group.current) return;
    const p = motion.current.progress;
    const reveal = smoothRange(0.32, 0.52, p); // aparece en el espacio oscuro
    const fragment = smoothRange(0.75, 0.94, p); // se despieza

    // Levitación + rotación que atrae la mirada.
    const drift = staticMotion ? 0 : motion.current.time * 0.15;

    // En pantallas pequeñas (detectado por la configuración de calidad reducida),
    // achicamos la esfera completa para que no se corte en los bordes.
    const isMobile = settings.shardCount <= 30;

    // Bajamos la esfera un poco en móvil para que no choque con el header superior.
    const mobileYOffset = isMobile ? -0.5 : 0;
    group.current.position.set(SPHERE_POS.x, SPHERE_POS.y + fragment * 0.7 + mobileYOffset, SPHERE_POS.z);

    group.current.rotation.y = p * 2.2 + drift;
    group.current.scale.setScalar(isMobile ? 0.75 : 1.0);

    group.current.visible = p > 0.28;

    if (core.current) {
      const s = lerp(0.001, 1, reveal) * lerp(1, 0.35, fragment);
      core.current.scale.setScalar(s);
      // El material se toma de la malla, no de la variable del `useMemo`: así
      // la animación no muta un valor capturado en el render.
      const mat = core.current.material as THREE.MeshStandardMaterial;
      mat.opacity = reveal * (1 - fragment);
      // Brillo interior que crece con el amanecer y estalla al fragmentar.
      mat.emissiveIntensity = smoothRange(0.5, 0.75, p) * 0.5 + fragment * 0.9;
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={core} geometry={geometry} material={material} />
      <Shards settings={settings} motion={motion} />
      <LightRings motion={motion} />
    </group>
  );
}
