import * as THREE from "three";
import { clamp01, seededUnit } from "./storyMath";

/*
 * Modelo procedimental del Árbol de Guanacaste (Enterolobium cyclocarpum).
 *
 * Este módulo es geometría pura y determinista (sin React ni WebGL): construye
 * el esqueleto ramificado, las masas de follaje y las texturas pintadas en
 * canvas. `GuanacasteTree.tsx` sólo lo consume.
 *
 * Morfología objetivo (referencia fotográfica del espécimen solitario):
 *  · Copa HEMISFÉRICA en domo/sombrilla cuya envergadura (2·CROWN_R ≈ 13.8)
 *    supera con holgura la altura total del árbol (≈ 7.9) → expansión X/Z
 *    dominante, tal como exige la especie.
 *  · Tronco masivo, corto e irregular, sin aristas rectas, que se bifurca a
 *    baja altura en extremidades diagonales muy gruesas.
 *  · Raíces tabulares (contrafuertes) que se aferran al terreno.
 *  · Follaje FRACTAL: el esqueleto se subdivide 5 veces y cada punta sostiene
 *    una «nube» de foliolos rodeada de matas menores; nunca un polígono sólido.
 */

const TAU = Math.PI * 2;

/** Suelo de la pradera. */
export const GROUND_Y = -2.35;
/** Altura del tronco antes de la bifurcación (corto en relación a la copa). */
export const TRUNK_H = 2.55;
/** Altura de la horcadura: de aquí nacen las ramas primarias. */
export const FORK_Y = GROUND_Y + TRUNK_H;
export const TRUNK_R_BASE = 1.4;
export const TRUNK_R_TOP = 0.9;
/**
 * Radio de la copa: la envergadura (≈16.4) eclipsa varias veces al tronco y
 * supera con holgura la altura total del árbol (≈6.8 sobre el pasto). Esa
 * dominancia de los ejes X/Z es el rasgo que define a la especie.
 */
export const CROWN_R = 7.6;
/** Altura de la copa por encima de la horcadura. */
export const CROWN_H = 5.6;
export const CROWN_TOP_Y = FORK_Y + CROWN_H;

/** Sectores de copa: cada uno se mece con su propia fase (viento caótico). */
export const SECTORS = 6;
/** Estrechamiento de rama a rama; encaja la base del hijo con la punta del padre. */
const TAPER = 0.66;

/**
 * Perfil del domo. `f` es la fracción radial (0 = eje del tronco, 1 = borde).
 * El exponente 0.62 mantiene la copa llena hasta muy cerca del borde (efecto
 * sombrilla) y el término cúbico final hace caer la falda de hojas, sin llegar
 * a tapar el tronco ni las extremidades primarias: en el espécimen real se ve
 * el hueco entre el pasto y el borde inferior del follaje.
 */
export function domeY(f: number) {
  const c = Math.max(0, 1 - f * f);
  return FORK_Y + CROWN_H * Math.pow(c, 0.58) - 0.2 * f * f * f;
}

function shellPoint(azimuth: number, f: number, out: THREE.Vector3) {
  const r = f * CROWN_R;
  return out.set(Math.cos(azimuth) * r, domeY(f), Math.sin(azimuth) * r);
}

/** Secuencia determinista: mismas posiciones en cada carga de la página. */
type Seeder = { i: number };
function rnd(s: Seeder, salt = 0) {
  s.i += 1;
  return seededUnit(s.i, salt);
}

/** Segmento de rama: se instancia como cilindro troncocónico. */
export type Limb = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
};

/** Masa de foliolos. `shade` 0 = interior en sombra, 1 = hoja expuesta al cielo. */
export type Puff = {
  pos: THREE.Vector3;
  radius: number;
  squash: number;
  spin: THREE.Euler;
  shade: number;
};

export type CanopySectorModel = {
  /** Ramillas finas (profundidad ≥ 2): se mecen con el follaje. */
  limbs: Limb[];
  /** Nubes de follaje en las puntas. */
  puffs: Puff[];
  /** Matas menores que rompen la silueta y dan lectura fractal. */
  tufts: Puff[];
};

export type TreeModel = {
  /** Ramas estructurales (profundidad 0–1): rígidas como el tronco. */
  structural: Limb[];
  sectors: CanopySectorModel[];
  /** Raíces superficiales que se arrastran sobre el pasto. */
  surfaceRoots: { pos: THREE.Vector3; scale: THREE.Vector3; spin: number }[];
  /** Cabezuelas florales (pompón blanco-crema), muy salpicadas. */
  flowers: THREE.Vector3[];
};

type Node = {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  radius: number;
  len: number;
  depth: number;
  goalA: number;
  goalF: number;
  sector: number;
};

function randomSpin(s: Seeder) {
  return new THREE.Euler(rnd(s, 21) * TAU, rnd(s, 22) * TAU, rnd(s, 23) * TAU);
}

/**
 * Añade la nube de follaje de una punta de rama y sus matas satélite. La
 * exposición a la luz se calcula por altura y por cercanía a la superficie del
 * domo: las hojas del exterior reflejan el cielo, las interiores quedan muy
 * oscuras.
 */
function addCanopy(sector: CanopySectorModel, tip: THREE.Vector3, f: number, tufts: number, s: Seeder) {
  const belowShell = Math.max(0, domeY(f) - tip.y);
  const heightFrac = clamp01((tip.y - FORK_Y) / CROWN_H);
  const exposure = clamp01(1 - belowShell / 2.2) * (0.3 + 0.7 * heightFrac);
  const radius = 0.56 + rnd(s, 24) * 0.34;

  sector.puffs.push({
    pos: tip.clone(),
    radius,
    squash: 0.62 + rnd(s, 25) * 0.14,
    spin: randomSpin(s),
    // Variación por agrupación: ninguna nube recibe la luz igual que su vecina,
    // que es lo que da el moteado de claros y sombras del árbol real.
    shade: clamp01(exposure * (0.66 + rnd(s, 31) * 0.34)),
  });

  // Matas satélite: rompen la silueta y dan la lectura granular del follaje
  // real, donde no hay dos agrupaciones iguales.
  for (let i = 0; i < tufts; i += 1) {
    const dx = (rnd(s, 26) - 0.5) * 3.0 * radius;
    const dy = (rnd(s, 27) - 0.5) * 1.9 * radius;
    const dz = (rnd(s, 28) - 0.5) * 3.0 * radius;
    sector.tufts.push({
      pos: new THREE.Vector3(tip.x + dx, tip.y + dy, tip.z + dz),
      radius: 0.21 + rnd(s, 29) * 0.22,
      squash: 0.66 + rnd(s, 30) * 0.2,
      spin: randomSpin(s),
      // Arriba del centro de la nube = luz; debajo = sombra profunda.
      shade: clamp01(exposure * (0.7 + rnd(s, 32) * 0.3) + dy * 0.9),
    });
  }
}

/**
 * Construye el árbol completo. `budget` es el presupuesto de instancias de
 * follaje (viene de QUALITY_SETTINGS.crownPuffs) y elige el nivel de detalle.
 */
export function buildGuanacaste(budget: number): TreeModel {
  const lod =
    budget >= 900
      ? { depth: 5, tufts: 7, fill: 150, surface: 130 }
      : budget >= 420
        ? { depth: 4, tufts: 5, fill: 80, surface: 78 }
        : { depth: 3, tufts: 4, fill: 32, surface: 34 };

  const s: Seeder = { i: 0 };
  const structural: Limb[] = [];
  const sectors: CanopySectorModel[] = Array.from({ length: SECTORS }, () => ({
    limbs: [],
    puffs: [],
    tufts: [],
  }));

  const goal = new THREE.Vector3();
  const stack: Node[] = [];

  // ── Bifurcación baja: extremidades muy gruesas en diagonal ────────────────
  for (let k = 0; k < SECTORS; k += 1) {
    const azimuth = (k / SECTORS) * TAU + (rnd(s, 1) - 0.5) * 0.55;
    // Una extremidad sube hacia el centro del domo; el resto se lanza al borde.
    const reach = k === 1 ? 0.3 + rnd(s, 2) * 0.12 : 0.62 + rnd(s, 2) * 0.38;
    const start = new THREE.Vector3(
      Math.cos(azimuth) * TRUNK_R_TOP * 0.4,
      FORK_Y - 0.5,
      Math.sin(azimuth) * TRUNK_R_TOP * 0.4,
    );
    shellPoint(azimuth, reach, goal);
    const dir = goal.clone().sub(start).normalize().add(new THREE.Vector3(0, 0.5, 0)).normalize();
    stack.push({
      pos: start,
      dir,
      radius: 0.58,
      len: 2.3,
      depth: 0,
      goalA: azimuth,
      goalF: reach,
      sector: k,
    });
  }

  // ── Subdivisión fractal hacia la superficie del domo ──────────────────────
  while (stack.length) {
    const node = stack.pop()!;
    shellPoint(node.goalA, node.goalF, goal);
    const toGoal = goal.clone().sub(node.pos);
    const dist = toGoal.length();
    const dirGoal = toGoal.divideScalar(Math.max(dist, 1e-4));

    const wander = 0.34 / (node.depth * 0.55 + 1);
    const dir = node.dir
      .clone()
      .multiplyScalar(0.55)
      .addScaledVector(dirGoal, 0.9)
      .add(
        new THREE.Vector3(
          (rnd(s, 3) - 0.5) * wander,
          (rnd(s, 4) - 0.5) * wander * 0.7,
          (rnd(s, 5) - 0.5) * wander,
        ),
      )
      .normalize();

    const len = Math.min(node.len, Math.max(0.5, dist * 0.68));
    const end = node.pos.clone().addScaledVector(dir, len);
    const limb: Limb = { start: node.pos.clone(), end, radius: node.radius };
    if (node.depth <= 1) structural.push(limb);
    else sectors[node.sector].limbs.push(limb);

    if (node.depth >= lod.depth || dist < 0.55) {
      addCanopy(sectors[node.sector], end, node.goalF, lod.tufts, s);
      continue;
    }

    const kids = rnd(s, 6) < 0.34 ? 3 : 2;
    const spread = 0.66 / (node.depth * 0.6 + 1);
    for (let c = 0; c < kids; c += 1) {
      const aOff = (c - (kids - 1) / 2) * spread + (rnd(s, 7) - 0.5) * 0.2;
      const fOff = (rnd(s, 8) - 0.5) * 0.3 + 0.04;
      stack.push({
        pos: end.clone(),
        dir: dir.clone(),
        radius: node.radius * TAPER,
        len: node.len * 0.78,
        depth: node.depth + 1,
        goalA: node.goalA + aOff,
        goalF: THREE.MathUtils.clamp(node.goalF + fOff, 0.16, 1),
        sector: node.sector,
      });
    }
  }

  // ── Relleno interior: masas oscuras que cierran los huecos del domo ───────
  for (let i = 0; i < lod.fill; i += 1) {
    const azimuth = rnd(s, 9) * TAU;
    const f = 0.18 + Math.sqrt(rnd(s, 10)) * 0.74;
    const y = domeY(f) - (0.5 + rnd(s, 11) * 1.6);
    if (y < FORK_Y + 0.15) continue;
    const sector = Math.min(SECTORS - 1, Math.floor((azimuth / TAU) * SECTORS));
    sectors[sector].puffs.push({
      pos: new THREE.Vector3(Math.cos(azimuth) * f * CROWN_R, y, Math.sin(azimuth) * f * CROWN_R),
      radius: 0.7 + rnd(s, 12) * 0.5,
      squash: 0.6 + rnd(s, 13) * 0.2,
      spin: randomSpin(s),
      shade: 0.05 + rnd(s, 14) * 0.22,
    });
  }

  // ── Cierre de la copa: masas sobre la propia superficie del domo ──────────
  // Las puntas de rama por sí solas dejan claros; estas nubes cosen la
  // superficie para que la silueta lea maciza sin dejar de ser irregular.
  for (let i = 0; i < lod.surface; i += 1) {
    const azimuth = rnd(s, 33) * TAU;
    const f = 0.12 + rnd(s, 34) * 0.86;
    const y = domeY(f) - 0.16 - rnd(s, 35) * 0.34;
    const heightFrac = clamp01((y - FORK_Y) / CROWN_H);
    const sector = Math.min(SECTORS - 1, Math.floor((azimuth / TAU) * SECTORS));
    sectors[sector].puffs.push({
      pos: new THREE.Vector3(Math.cos(azimuth) * f * CROWN_R, y, Math.sin(azimuth) * f * CROWN_R),
      radius: 0.5 + rnd(s, 36) * 0.36,
      squash: 0.6 + rnd(s, 37) * 0.2,
      spin: randomSpin(s),
      shade: clamp01((0.34 + 0.66 * heightFrac) * (0.68 + rnd(s, 38) * 0.32)),
    });
  }

  // ── Raíces superficiales: se arrastran desde la base sobre el pasto ───────
  const surfaceRoots: TreeModel["surfaceRoots"] = [];
  for (let i = 0; i < 9; i += 1) {
    const azimuth = (i / 9) * TAU + (rnd(s, 15) - 0.5) * 0.4;
    const reach = 1.9 + rnd(s, 16) * 1.5;
    surfaceRoots.push({
      pos: new THREE.Vector3(
        Math.cos(azimuth) * reach * 0.62,
        GROUND_Y + 0.04,
        Math.sin(azimuth) * reach * 0.62,
      ),
      scale: new THREE.Vector3(reach * 0.72, 0.2 + rnd(s, 17) * 0.12, 0.3 + rnd(s, 18) * 0.18),
      spin: -azimuth,
    });
  }

  // Flores en cabezuela: presencia testimonial y menuda, apenas salpicaduras
  // sobre el verde. La copa la manda el follaje.
  const flowers: THREE.Vector3[] = [];
  const flowerCount = budget >= 900 ? 14 : budget >= 420 ? 9 : 5;
  for (let i = 0; i < flowerCount; i += 1) {
    const azimuth = rnd(s, 19) * TAU;
    // Sólo en la mitad alta e iluminada de la copa: sobre el verde en sombra
    // parecerían motas fuera de sitio.
    const f = 0.22 + rnd(s, 20) * 0.4;
    flowers.push(
      new THREE.Vector3(
        Math.cos(azimuth) * f * CROWN_R,
        domeY(f) + 0.02,
        Math.sin(azimuth) * f * CROWN_R,
      ),
    );
  }

  return { structural, sectors, surfaceRoots, flowers };
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometrías
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Nube de follaje: icosaedro deformado con ruido derivado de la POSICIÓN (no
 * del índice), de modo que los vértices duplicados de la geometría no indexada
 * se desplazan igual y la malla no se abre.
 */
export function makePuffGeometry(detail: number, seed: number) {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i);
    const h = Math.sin(v.x * 12.9898 + v.y * 78.233 + v.z * 37.719 + seed) * 43758.5453;
    const n = 1 + ((h - Math.floor(h)) - 0.5) * 0.44;
    pos.setXYZ(i, v.x * n, v.y * n, v.z * n);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Tronco masivo, ensanchado en la base y sin una sola arista recta. */
export function makeTrunkGeometry() {
  const geo = new THREE.CylinderGeometry(TRUNK_R_TOP, TRUNK_R_BASE, TRUNK_H, 24, 9, true);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i);
    const t = (v.y + TRUNK_H / 2) / TRUNK_H; // 0 base · 1 horcadura
    const a = Math.atan2(v.z, v.x);
    const flare = 1 + Math.pow(1 - t, 3.1) * 0.42;
    // Múltiplos enteros del azimut → el vértice de la costura coincide.
    const lumps =
      1 +
      0.1 * Math.sin(a * 3 + t * 1.4) +
      0.06 * Math.sin(a * 5 - t * 3.1) +
      0.045 * Math.sin(t * 7.5 + a * 2);
    const k = flare * lumps;
    pos.setXYZ(i, v.x * k, v.y, v.z * k);
  }
  geo.translate(0, GROUND_Y + TRUNK_H / 2, 0);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Raíz tabular (contrafuerte): aleta extruida cuyo perfil sube pegado al
 * tronco y baja en curva cóncava hasta el terreno. Local +X = hacia afuera,
 * +Y = altura, ±Z = grosor.
 */
export function makeButtressGeometry(len: number, height: number, thick: number) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(len, 0.03);
  shape.quadraticCurveTo(len * 0.3, height * 0.22, 0.02, height);
  shape.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: true,
    bevelSize: thick * 0.34,
    bevelThickness: thick * 0.3,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.translate(0, 0, -thick / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Cilindro troncocónico unitario: la punta encaja con la base de sus hijas. */
export function makeLimbGeometry() {
  return new THREE.CylinderGeometry(TAPER, 1, 1, 6, 1, false);
}

// ─────────────────────────────────────────────────────────────────────────────
// Texturas pintadas en canvas (sin assets externos)
// ─────────────────────────────────────────────────────────────────────────────

function canvas2d(w: number, h: number) {
  const el = document.createElement("canvas");
  el.width = w;
  el.height = h;
  return { el, ctx: el.getContext("2d")! };
}

function finish(el: HTMLCanvasElement, repeat?: [number, number]) {
  const tex = new THREE.CanvasTexture(el);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
    tex.anisotropy = 4;
  }
  tex.needsUpdate = true;
  return tex;
}

/** Corteza rugosa: vetas verticales, líquenes y grietas profundas. */
export function makeBarkTexture() {
  const { el, ctx } = canvas2d(256, 512);
  ctx.fillStyle = "#4b4238";
  ctx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 700; i += 1) {
    const x = seededUnit(i, 31) * 256;
    const y = seededUnit(i, 32) * 512;
    const h = 12 + seededUnit(i, 33) * 70;
    const w = 1 + seededUnit(i, 34) * 4;
    const tone = seededUnit(i, 35);
    ctx.fillStyle =
      tone > 0.62 ? `rgba(126,119,104,${0.1 + tone * 0.2})` : `rgba(30,25,19,${0.12 + tone * 0.3})`;
    ctx.fillRect(x, y, w, h);
  }
  // Grietas: sombras intensas que recorren el tronco de arriba abajo.
  ctx.lineCap = "round";
  for (let i = 0; i < 34; i += 1) {
    ctx.beginPath();
    let x = seededUnit(i, 36) * 256;
    ctx.moveTo(x, -10);
    for (let y = 0; y <= 522; y += 26) {
      x += (seededUnit(i * 40 + y, 37) - 0.5) * 13;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(16,12,9,${0.42 + seededUnit(i, 38) * 0.4})`;
    ctx.lineWidth = 1.4 + seededUnit(i, 39) * 3.4;
    ctx.stroke();
  }
  return finish(el, [3, 2]);
}

/** Pasto uniforme y brillante, con moteado suave para que no lea plano. */
export function makeGrassTexture() {
  const { el, ctx } = canvas2d(256, 256);
  ctx.fillStyle = "#6f9440";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1500; i += 1) {
    const x = seededUnit(i, 41) * 256;
    const y = seededUnit(i, 42) * 256;
    const r = 2 + seededUnit(i, 43) * 12;
    const tone = seededUnit(i, 44);
    ctx.fillStyle =
      tone > 0.5 ? `rgba(140,175,84,${0.05 + tone * 0.16})` : `rgba(74,102,48,${0.05 + tone * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  for (let i = 0; i < 2600; i += 1) {
    ctx.fillStyle = seededUnit(i, 45) > 0.5 ? "rgba(168,196,104,0.16)" : "rgba(62,88,42,0.16)";
    ctx.fillRect(seededUnit(i, 46) * 256, seededUnit(i, 47) * 256, 1.4, 2.6);
  }
  return finish(el, [26, 26]);
}

/** Calco de sombra: núcleo profundo bajo el tronco, borde muy difuso. */
export function makeShadowTexture() {
  const { el, ctx } = canvas2d(256, 256);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(0,0,0,0.86)");
  g.addColorStop(0.22, "rgba(0,0,0,0.66)");
  g.addColorStop(0.55, "rgba(0,0,0,0.32)");
  g.addColorStop(0.82, "rgba(0,0,0,0.09)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(el);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Cielo parcialmente nublado (mapa equirectangular). Actúa de difusor gigante:
 * azul suave en el cenit, pálido en el horizonte y nubes de borde blando.
 */
export function makeSkyTexture() {
  const { el, ctx } = canvas2d(1024, 512);
  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, "#5d92c4");
  sky.addColorStop(0.3, "#84aed0");
  sky.addColorStop(0.44, "#b4cddc");
  sky.addColorStop(0.52, "#d9e2e0");
  sky.addColorStop(1, "#d3ddd4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 512);

  // Cúmulos: acumulación de gradientes radiales de borde suave.
  for (let i = 0; i < 260; i += 1) {
    const cx = seededUnit(i, 51) * 1024;
    // Repartidas por todo el hemisferio visible, densificando hacia el
    // horizonte, que es la franja de cielo que el encuadre deja ver.
    const cy = 20 + Math.pow(seededUnit(i, 52), 0.85) * 265;
    const r = 22 + seededUnit(i, 53) * 92;
    const alpha = 0.14 + seededUnit(i, 54) * 0.46;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const bright = seededUnit(i, 55) > 0.32;
    g.addColorStop(0, bright ? `rgba(255,255,254,${alpha})` : `rgba(188,199,205,${alpha})`);
    g.addColorStop(0.6, bright ? `rgba(248,250,250,${alpha * 0.5})` : `rgba(178,190,199,${alpha * 0.5})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * (0.42 + seededUnit(i, 56) * 0.3), 0, 0, TAU);
    ctx.fill();
  }
  // Velo tenue justo sobre el horizonte: bruma, no muro blanco.
  const haze = ctx.createLinearGradient(0, 256, 0, 330);
  haze.addColorStop(0, "rgba(232,236,229,0)");
  haze.addColorStop(1, "rgba(232,236,229,0.42)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 256, 1024, 74);
  return finish(el);
}
