/**
 * Genera todas las ilustraciones de Selva y Sal.
 *
 * El prototipo no usa fotografía de terceros: cada imagen del catálogo, de las
 * categorías, del blog y de la portada se dibuja aquí como SVG a partir de
 * primitivas, con una paleta por categoría y una semilla derivada del slug para
 * que dos productos de la misma familia no salgan idénticos. La única imagen
 * rasterizada es la social (`public/og.jpg`), que se compone en SVG y se
 * convierte con sharp porque las redes no leen vectores.
 *
 *   node scripts/generate-assets.mjs
 */

import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { catalogProducts } from "../app/data/catalog.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");

/* ── Semilla determinista ────────────────────────────────────────────────── */

function hash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Generador reproducible: el mismo slug produce siempre el mismo dibujo. */
function rng(seed) {
  let state = hash(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

/* ── Paleta ──────────────────────────────────────────────────────────────── */

const PALETTES = {
  Expediciones: { sky: "#0d3b34", deep: "#06231f", ink: "#f4f1e6", accent: "#f4c94f" },
  Peluches: { sky: "#f6e6d2", deep: "#e2c39c", ink: "#3b2a1c", accent: "#c96f3f" },
  Textiles: { sky: "#e4ecec", deep: "#b9cccb", ink: "#22383a", accent: "#2f7f74" },
  Gorras: { sky: "#e7ecd9", deep: "#c2cfa6", ink: "#2c3a1c", accent: "#6d8a3a" },
  "Cerámica": { sky: "#f3e3d3", deep: "#d9b393", ink: "#41291a", accent: "#a8522c" },
  Imanes: { sky: "#dfeef2", deep: "#a9d2dd", ink: "#12333c", accent: "#1d7f96" },
  Llaveros: { sky: "#ece8e1", deep: "#cbc3b6", ink: "#332e26", accent: "#8a7351" },
  "Café y cacao": { sky: "#e8d8c4", deep: "#bf9a72", ink: "#33200f", accent: "#7a4a22" },
  "Artesanía": { sky: "#f4e2c4", deep: "#dcb877", ink: "#3d2a10", accent: "#b8761f" },
  Botellas: { sky: "#e2eaf1", deep: "#b2c6d8", ink: "#1c2c3a", accent: "#33637f" },
  Mochilas: { sky: "#e3ebdf", deep: "#b6ccb2", ink: "#1f3325", accent: "#3f7a4c" },
  Libretas: { sky: "#f1ece0", deep: "#d7cdb8", ink: "#35301f", accent: "#7d7040" },
};

const DEFAULT_PALETTE = PALETTES.Expediciones;

function paletteFor(product) {
  return PALETTES[product.categories?.[0]] ?? DEFAULT_PALETTE;
}

/* ── Piezas comunes ──────────────────────────────────────────────────────── */

function defs(id, palette, random) {
  const tilt = 12 + Math.round(random() * 30);
  return `<defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${palette.sky}"/>
      <stop offset="1" stop-color="${palette.deep}"/>
    </linearGradient>
    <radialGradient id="glow-${id}" cx="0.5" cy="${0.28 + random() * 0.12}" r="0.62">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="body-${id}" x1="0" y1="0" x2="${(tilt / 60).toFixed(2)}" y2="1">
      <stop offset="0" stop-color="${palette.accent}"/>
      <stop offset="1" stop-color="${palette.ink}"/>
    </linearGradient>
    <filter id="soft-${id}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
  </defs>`;
}

function backdrop(id, palette, random, size = 800) {
  const rings = Array.from({ length: 3 }, (_, i) => {
    const r = size * (0.3 + i * 0.13) + random() * 24;
    return `<circle cx="${size / 2}" cy="${size * 0.47}" r="${r.toFixed(1)}" fill="none" stroke="${palette.ink}" stroke-opacity="${(0.07 - i * 0.02).toFixed(3)}" stroke-width="2"/>`;
  }).join("");
  return `<rect width="${size}" height="${size}" fill="url(#bg-${id})"/>
    <rect width="${size}" height="${size}" fill="url(#glow-${id})"/>
    ${rings}`;
}

/** Sombra elíptica bajo el objeto, para que no flote. */
function shadow(id, cx, cy, rx) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(rx * 0.19).toFixed(1)}" fill="#000" opacity="0.16" filter="url(#soft-${id})"/>`;
}

function grain(size = 800, opacity = 0.05) {
  return `<rect width="${size}" height="${size}" fill="none" stroke="none"/>
    <g opacity="${opacity}">
      ${Array.from({ length: 46 }, (_, i) => {
        const a = (i * 137.508 * Math.PI) / 180;
        const r = (i / 46) * size * 0.62;
        const x = size / 2 + Math.cos(a) * r;
        const y = size * 0.47 + Math.sin(a) * r;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1 + (i % 3)).toFixed(1)}" fill="#000"/>`;
      }).join("")}
    </g>`;
}

/* ── Ilustraciones por familia ───────────────────────────────────────────── */

const SHAPES = {
  Expediciones(id, p, r) {
    const peak = 250 + r() * 70;
    const second = 330 + r() * 60;
    return `
      <circle cx="${(520 + r() * 80).toFixed(0)}" cy="${(230 + r() * 40).toFixed(0)}" r="62" fill="${p.accent}" opacity="0.9"/>
      <path d="M90 620 L${second.toFixed(0)} 300 L470 620 Z" fill="${p.ink}" opacity="0.45"/>
      <path d="M210 620 L400 ${peak.toFixed(0)} L640 620 Z" fill="url(#body-${id})"/>
      <path d="M330 ${(peak + 60).toFixed(0)} L400 ${peak.toFixed(0)} L470 ${(peak + 60).toFixed(0)} L430 ${(peak + 52).toFixed(0)} L400 ${(peak + 26).toFixed(0)} L370 ${(peak + 52).toFixed(0)} Z" fill="${p.sky}" opacity="0.85"/>
      <path d="M120 640 q140 -40 280 0 t280 0" fill="none" stroke="${p.sky}" stroke-opacity="0.5" stroke-width="8" stroke-linecap="round" stroke-dasharray="26 20"/>`;
  },
  Peluches(id, p, r) {
    const ear = 84 + r() * 22;
    const tilt = -8 + r() * 16;
    return `
      <g transform="rotate(${tilt.toFixed(1)} 400 420)">
        <circle cx="${(400 - 128).toFixed(0)}" cy="300" r="${ear.toFixed(0)}" fill="${p.ink}" opacity="0.9"/>
        <circle cx="${(400 + 128).toFixed(0)}" cy="300" r="${ear.toFixed(0)}" fill="${p.ink}" opacity="0.9"/>
        <ellipse cx="400" cy="470" rx="182" ry="168" fill="url(#body-${id})"/>
        <ellipse cx="400" cy="360" rx="150" ry="132" fill="${p.ink}"/>
        <ellipse cx="400" cy="392" rx="92" ry="74" fill="${p.sky}" opacity="0.92"/>
        <circle cx="356" cy="352" r="17" fill="${p.ink}"/>
        <circle cx="444" cy="352" r="17" fill="${p.ink}"/>
        <ellipse cx="400" cy="392" rx="20" ry="14" fill="${p.ink}"/>
        <path d="M372 418 q28 24 56 0" fill="none" stroke="${p.ink}" stroke-width="7" stroke-linecap="round"/>
      </g>`;
  },
  Textiles(id, p, r) {
    const sleeve = 40 + r() * 26;
    return `
      <path d="M258 268 L340 226 q60 44 120 0 l82 42 l52 96 -74 44 -14 -30 v246 q-146 26 -292 0 V378 l-14 30 -74 -44 Z"
            fill="url(#body-${id})"/>
      <path d="M340 226 q60 44 120 0" fill="none" stroke="${p.sky}" stroke-width="9" stroke-linecap="round" opacity="0.8"/>
      <path d="M330 ${(470 + sleeve).toFixed(0)} h140" stroke="${p.sky}" stroke-width="12" stroke-linecap="round" opacity="0.55"/>
      <path d="M330 ${(510 + sleeve).toFixed(0)} h96" stroke="${p.sky}" stroke-width="12" stroke-linecap="round" opacity="0.35"/>`;
  },
  Gorras(id, p, r) {
    const brim = 96 + r() * 26;
    return `
      <path d="M212 452 q0 -196 188 -196 t188 196 z" fill="url(#body-${id})"/>
      <path d="M212 452 h376 q${brim.toFixed(0)} 6 ${brim.toFixed(0)} 74 q-190 34 -${(376 + brim).toFixed(0)} 0 z" fill="${p.ink}" opacity="0.86"/>
      <circle cx="400" cy="262" r="17" fill="${p.sky}" opacity="0.9"/>
      <path d="M400 262 V452" stroke="${p.sky}" stroke-opacity="0.35" stroke-width="5"/>
      <path d="M318 300 q82 76 164 0" fill="none" stroke="${p.sky}" stroke-opacity="0.45" stroke-width="5"/>`;
  },
  "Cerámica"(id, p, r) {
    const belly = 150 + r() * 34;
    return `
      <path d="M${(400 - belly).toFixed(0)} 300 q${belly.toFixed(0)} -46 ${(belly * 2).toFixed(0)} 0 l-26 268 q-${belly.toFixed(0)} 44 -${(belly * 2 - 52).toFixed(0)} 0 z" fill="url(#body-${id})"/>
      <path d="M${(400 + belly - 14).toFixed(0)} 356 q116 12 88 106 t-104 60" fill="none" stroke="${p.ink}" stroke-width="26" stroke-linecap="round"/>
      <ellipse cx="400" cy="302" rx="${belly.toFixed(0)}" ry="34" fill="${p.sky}" opacity="0.92"/>
      <path d="M300 430 h200" stroke="${p.sky}" stroke-opacity="0.55" stroke-width="10" stroke-linecap="round"/>
      <path d="M312 472 h176" stroke="${p.sky}" stroke-opacity="0.3" stroke-width="10" stroke-linecap="round"/>`;
  },
  Imanes(id, p, r) {
    const notch = 30 + r() * 20;
    return `
      <circle cx="400" cy="420" r="186" fill="url(#body-${id})"/>
      <circle cx="400" cy="420" r="140" fill="none" stroke="${p.sky}" stroke-opacity="0.6" stroke-width="10" stroke-dasharray="${notch.toFixed(0)} 18"/>
      <circle cx="400" cy="420" r="86" fill="${p.sky}" opacity="0.92"/>
      <path d="M356 420 q44 -56 88 0 q-44 56 -88 0 z" fill="${p.ink}"/>`;
  },
  Llaveros(id, p, r) {
    const tag = 150 + r() * 40;
    return `
      <circle cx="400" cy="268" r="72" fill="none" stroke="${p.ink}" stroke-width="24"/>
      <rect x="${(400 - tag / 2).toFixed(0)}" y="352" width="${tag.toFixed(0)}" height="${(tag * 1.42).toFixed(0)}" rx="34" fill="url(#body-${id})"/>
      <circle cx="400" cy="392" r="16" fill="${p.sky}" opacity="0.9"/>
      <path d="M${(400 - tag / 2 + 30).toFixed(0)} 470 h${(tag - 60).toFixed(0)}" stroke="${p.sky}" stroke-opacity="0.55" stroke-width="10" stroke-linecap="round"/>
      <path d="M${(400 - tag / 2 + 30).toFixed(0)} 512 h${(tag - 96).toFixed(0)}" stroke="${p.sky}" stroke-opacity="0.32" stroke-width="10" stroke-linecap="round"/>`;
  },
  "Café y cacao"(id, p, r) {
    const fold = 24 + r() * 16;
    return `
      <path d="M266 300 h268 l24 300 q-158 40 -316 0 z" fill="url(#body-${id})"/>
      <path d="M266 300 q134 -${fold.toFixed(0)} 268 0" fill="none" stroke="${p.ink}" stroke-width="22" stroke-linecap="round"/>
      <ellipse cx="400" cy="452" rx="78" ry="92" fill="${p.sky}" opacity="0.9"/>
      <path d="M400 366 q-34 86 0 172" fill="none" stroke="${p.ink}" stroke-width="12" stroke-linecap="round"/>`;
  },
  "Artesanía"(id, p, r) {
    const w = 150 + r() * 30;
    return `
      <path d="M400 236 q${w.toFixed(0)} 84 ${(w * 0.62).toFixed(0)} 214 q-30 148 -${(w * 0.62).toFixed(0)} 150 q-${(w * 0.62).toFixed(0)} -2 -${(w * 0.62).toFixed(0)} -150 q-${(w * 0.38).toFixed(0)} -130 ${(w * 0.62).toFixed(0)} -214 z" fill="url(#body-${id})"/>
      <circle cx="352" cy="404" r="20" fill="${p.sky}"/>
      <circle cx="448" cy="404" r="20" fill="${p.sky}"/>
      <path d="M348 490 q52 40 104 0" fill="none" stroke="${p.sky}" stroke-width="12" stroke-linecap="round"/>
      <path d="M330 320 q70 -30 140 0" fill="none" stroke="${p.sky}" stroke-opacity="0.6" stroke-width="9"/>`;
  },
  Botellas(id, p, r) {
    const neck = 56 + r() * 20;
    return `
      <rect x="${(400 - neck / 2).toFixed(0)}" y="204" width="${neck.toFixed(0)}" height="76" rx="16" fill="${p.ink}"/>
      <path d="M310 292 q90 -26 180 0 v244 q0 62 -90 62 t-90 -62 z" fill="url(#body-${id})"/>
      <rect x="310" y="368" width="180" height="66" fill="${p.sky}" opacity="0.55"/>
      <path d="M348 470 v70" stroke="${p.sky}" stroke-opacity="0.5" stroke-width="10" stroke-linecap="round"/>`;
  },
  Mochilas(id, p, r) {
    const flap = 120 + r() * 30;
    return `
      <path d="M292 300 q-46 -96 108 -96 t108 96" fill="none" stroke="${p.ink}" stroke-width="26"/>
      <rect x="256" y="296" width="288" height="318" rx="66" fill="url(#body-${id})"/>
      <path d="M256 362 q144 ${flap.toFixed(0)} 288 0 v-66 H256 z" fill="${p.ink}" opacity="0.8"/>
      <rect x="332" y="470" width="136" height="86" rx="26" fill="${p.sky}" opacity="0.85"/>`;
  },
  Libretas(id, p, r) {
    const skew = 6 + r() * 10;
    return `
      <g transform="rotate(-${skew.toFixed(1)} 400 430)">
        <rect x="262" y="240" width="286" height="382" rx="22" fill="${p.ink}" opacity="0.5"/>
        <rect x="246" y="224" width="286" height="382" rx="22" fill="url(#body-${id})"/>
        <rect x="246" y="224" width="46" height="382" rx="22" fill="${p.ink}" opacity="0.55"/>
        <path d="M330 320 h150 M330 372 h150 M330 424 h110" stroke="${p.sky}" stroke-opacity="0.6" stroke-width="10" stroke-linecap="round"/>
        <rect x="470" y="224" width="16" height="382" fill="${p.accent}" opacity="0.9"/>
      </g>`;
  },
};

function illustrationFor(product, id, palette, random) {
  const family = product.categories?.[0];
  const draw = SHAPES[family] ?? SHAPES.Expediciones;
  return draw(id, palette, random);
}

/* ── Fichas de producto ──────────────────────────────────────────────────── */

function productSvg(product) {
  const id = hash(product.slug).toString(36).slice(0, 6);
  const palette = paletteFor(product);
  const random = rng(product.slug);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="${escapeXml(product.name)}">
  ${defs(id, palette, random)}
  ${backdrop(id, palette, random)}
  ${shadow(id, 400, 646, 190)}
  ${illustrationFor(product, id, palette, random)}
  ${grain()}
</svg>`;
}

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]);
}

/* ── Escenas: categorías, blog, portada ──────────────────────────────────── */

function sceneSvg({ slug, width, height, palette, title, kind }) {
  const id = hash(slug).toString(36).slice(0, 6);
  const random = rng(slug);
  const layers = [];

  // Cielo y sol
  layers.push(`<rect width="${width}" height="${height}" fill="url(#bg-${id})"/>`);
  layers.push(`<rect width="${width}" height="${height}" fill="url(#glow-${id})"/>`);
  layers.push(
    `<circle cx="${(width * (0.66 + random() * 0.16)).toFixed(0)}" cy="${(height * 0.3).toFixed(0)}" r="${(height * 0.14).toFixed(0)}" fill="${palette.accent}" opacity="0.85"/>`,
  );

  // Cordillera en tres planos, del más lejano al más cercano, con una banda de
  // bruma entre cada uno: es lo que da la sensación de profundidad.
  const base = height * (kind === "ocean" ? 0.68 : 0.86);
  for (let i = 0; i < 3; i += 1) {
    const h = height * (0.3 + i * 0.13) + random() * height * 0.05;
    const offset = width * (0.16 + i * 0.2);
    layers.push(
      `<path d="M${(-width * 0.1).toFixed(0)} ${base.toFixed(0)} L${offset.toFixed(0)} ${(base - h).toFixed(0)} L${(offset + width * 0.42).toFixed(0)} ${base.toFixed(0)} Z" fill="${palette.ink}" opacity="${(0.22 + i * 0.22).toFixed(2)}"/>`,
    );
    layers.push(
      `<path d="M${(width * 0.42).toFixed(0)} ${base.toFixed(0)} L${(width * (0.62 + i * 0.08)).toFixed(0)} ${(base - h * 0.82).toFixed(0)} L${(width * 1.12).toFixed(0)} ${base.toFixed(0)} Z" fill="${palette.ink}" opacity="${(0.18 + i * 0.2).toFixed(2)}"/>`,
    );
    layers.push(
      `<rect x="0" y="${(base - h * 0.34).toFixed(0)}" width="${width}" height="${(height * 0.035).toFixed(0)}" fill="${palette.sky}" opacity="${(0.22 - i * 0.05).toFixed(2)}"/>`,
    );
  }

  // Mar o dosel según el tipo de escena
  if (kind === "ocean") {
    layers.push(`<rect x="0" y="${base.toFixed(0)}" width="${width}" height="${(height - base).toFixed(0)}" fill="${palette.ink}" opacity="0.55"/>`);
    layers.push(
      `<path d="M0 ${base.toFixed(0)} h${width} v${(height - base).toFixed(0)} H0 Z" fill="url(#glow-${id})" opacity="0.5"/>`,
    );
    for (let i = 0; i < 7; i += 1) {
      const y = base + (height - base) * (0.12 + i * 0.13);
      layers.push(
        `<path d="M0 ${y.toFixed(0)} q${(width * 0.12).toFixed(0)} -14 ${(width * 0.25).toFixed(0)} 0 t${(width * 0.25).toFixed(0)} 0 t${(width * 0.25).toFixed(0)} 0 t${(width * 0.25).toFixed(0)} 0" fill="none" stroke="${palette.sky}" stroke-opacity="0.5" stroke-width="6" stroke-linecap="round"/>`,
      );
    }
  } else {
    // Franja de bosque: coníferas de dos tamaños recortadas contra la ladera.
    layers.push(`<rect x="0" y="${base.toFixed(0)}" width="${width}" height="${(height - base).toFixed(0)}" fill="${palette.ink}" opacity="0.7"/>`);
    const trees = Math.max(10, Math.round(width / 90));
    for (let i = 0; i <= trees; i += 1) {
      const x = (width / trees) * i + (random() - 0.5) * (width / trees) * 0.6;
      const h = (height - base) * (0.5 + random() * 0.85);
      const w = h * 0.42;
      layers.push(
        `<path d="M${x.toFixed(0)} ${(base - h).toFixed(0)} L${(x + w).toFixed(0)} ${(base + height * 0.02).toFixed(0)} L${(x - w).toFixed(0)} ${(base + height * 0.02).toFixed(0)} Z" fill="${palette.ink}" opacity="0.75"/>`,
      );
      layers.push(
        `<path d="M${x.toFixed(0)} ${(base - h * 0.72).toFixed(0)} L${(x + w * 0.62).toFixed(0)} ${(base - h * 0.12).toFixed(0)} L${(x - w * 0.62).toFixed(0)} ${(base - h * 0.12).toFixed(0)} Z" fill="${palette.deep}" opacity="0.5"/>`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(title)}">
  ${defs(id, palette, random)}
  ${layers.join("\n  ")}
</svg>`;
}

/** Fondo tenue que se repite detrás de las páginas interiores. */
function textureSvg() {
  const p = PALETTES.Expediciones;
  const leaves = Array.from({ length: 26 }, (_, i) => {
    const random = rng(`hoja-${i}`);
    const x = random() * 1200;
    const y = random() * 1200;
    const rot = random() * 360;
    const scale = 0.6 + random() * 0.9;
    return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${rot.toFixed(0)}) scale(${scale.toFixed(2)})" opacity="0.07">
      <path d="M0 0 q54 -46 108 0 q-54 46 -108 0 z" fill="${p.ink}"/>
      <path d="M0 0 h108" stroke="${p.deep}" stroke-width="3"/>
    </g>`;
  }).join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200" aria-hidden="true">
  <rect width="1200" height="1200" fill="${p.deep}"/>
  ${leaves}
</svg>`;
}

/* ── Marca ───────────────────────────────────────────────────────────────── */

function isotypeSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Selva y Sal">
  <rect width="96" height="96" rx="24" fill="#06231f"/>
  <path d="M20 60 L38 30 L54 60 Z" fill="#f4c94f"/>
  <path d="M42 60 L58 36 L74 60 Z" fill="#2f7f74"/>
  <path d="M16 70 q12 -8 24 0 t24 0 t24 0" fill="none" stroke="#8fd4c4" stroke-width="5" stroke-linecap="round"/>
</svg>`;
}

function wordmarkSvg({ ink, sub }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 110" width="430" height="110" role="img" aria-label="Selva y Sal">
  <g transform="translate(6 14)">
    <rect width="82" height="82" rx="22" fill="#06231f"/>
    <path d="M17 52 L32 26 L46 52 Z" fill="#f4c94f"/>
    <path d="M36 52 L50 31 L64 52 Z" fill="#2f7f74"/>
    <path d="M14 61 q10 -7 20 0 t20 0 t20 0" fill="none" stroke="#8fd4c4" stroke-width="4.5" stroke-linecap="round"/>
  </g>
  <text x="104" y="58" font-family="Georgia, 'Times New Roman', serif" font-size="41" letter-spacing="0.5" fill="${ink}">Selva y Sal</text>
  <text x="106" y="83" font-family="Helvetica, Arial, sans-serif" font-size="14.5" letter-spacing="4.2" fill="${sub}">DEL VOLCÁN AL MAR</text>
</svg>`;
}

/* ── Imagen social ───────────────────────────────────────────────────────── */

function socialSvg() {
  const p = PALETTES.Expediciones;
  const scene = sceneSvg({ slug: "og", width: 1200, height: 630, palette: p, title: "Selva y Sal", kind: "ocean" })
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  ${scene}
  <rect width="1200" height="630" fill="#06231f" opacity="0.42"/>
  <text x="86" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="82" fill="#f4f1e6">Selva y Sal</text>
  <text x="88" y="356" font-family="Helvetica, Arial, sans-serif" font-size="25" letter-spacing="6" fill="#f4c94f">DEL VOLCÁN AL MAR</text>
  <text x="88" y="420" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="#cfe4dc">Aventuras guiadas y recuerdos de Costa Rica</text>
</svg>`;
}

/* ── Escenas declaradas ──────────────────────────────────────────────────── */

const SCENES = [
  { file: "escena/categoria-expediciones.svg", w: 900, h: 900, palette: PALETTES.Expediciones, title: "Expediciones", kind: "forest" },
  { file: "escena/categoria-peluches.svg", w: 900, h: 900, palette: PALETTES.Peluches, title: "Peluches", kind: "forest" },
  { file: "escena/categoria-textiles.svg", w: 900, h: 900, palette: PALETTES.Textiles, title: "Textiles", kind: "ocean" },
  { file: "escena/categoria-gorras.svg", w: 900, h: 900, palette: PALETTES.Gorras, title: "Gorras", kind: "forest" },
  { file: "escena/categoria-ceramica.svg", w: 900, h: 900, palette: PALETTES["Cerámica"], title: "Cerámica", kind: "forest" },
  { file: "escena/categoria-cafe.svg", w: 900, h: 900, palette: PALETTES["Café y cacao"], title: "Café y cacao", kind: "forest" },
  { file: "escena/banner-expediciones.svg", w: 1600, h: 420, palette: PALETTES.Expediciones, title: "Expediciones guiadas", kind: "ocean" },
  { file: "escena/promo-mayoreo.svg", w: 1024, h: 1024, palette: PALETTES["Artesanía"], title: "Mayoreo", kind: "forest" },
  { file: "escena/promo-temporada.svg", w: 1024, h: 1024, palette: PALETTES.Botellas, title: "Temporada", kind: "ocean" },
  { file: "escena/equipo-selva-y-sal.svg", w: 1200, h: 1200, palette: PALETTES.Mochilas, title: "El equipo de Selva y Sal", kind: "forest" },
  { file: "escena/compromiso-ambiental.svg", w: 900, h: 1200, palette: PALETTES.Expediciones, title: "Compromiso ambiental", kind: "forest" },
  { file: "escena/tienda-la-fortuna.svg", w: 1200, h: 630, palette: PALETTES.Llaveros, title: "La tienda de La Fortuna", kind: "forest" },
  { file: "escena/blog-ruta-arenal.svg", w: 1600, h: 630, palette: PALETTES.Expediciones, title: "La ruta del Arenal", kind: "forest" },
  { file: "escena/blog-bosque-nuboso.svg", w: 1600, h: 630, palette: PALETTES.Textiles, title: "El bosque nuboso", kind: "forest" },
  { file: "escena/blog-pacifico-sur.svg", w: 1600, h: 630, palette: PALETTES.Botellas, title: "El Pacífico Sur", kind: "ocean" },
  { file: "escena/blog-recuerdo-honesto.svg", w: 1600, h: 630, palette: PALETTES["Artesanía"], title: "Un recuerdo honesto", kind: "forest" },
  { file: "escena/detalle-arenal.svg", w: 900, h: 600, palette: PALETTES.Expediciones, title: "Arenal", kind: "forest" },
  { file: "escena/detalle-bosque.svg", w: 900, h: 600, palette: PALETTES.Mochilas, title: "Bosque", kind: "forest" },
  { file: "escena/detalle-costa.svg", w: 900, h: 600, palette: PALETTES.Botellas, title: "Costa", kind: "ocean" },
  { file: "escena/detalle-taller.svg", w: 900, h: 600, palette: PALETTES["Artesanía"], title: "Taller", kind: "forest" },
];

/* ── Ejecución ───────────────────────────────────────────────────────────── */

async function write(relative, contents) {
  const target = join(PUBLIC, relative);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents, "utf8");
}

async function main() {
  // Se rehacen desde cero para que no sobreviva ningún archivo de una tanda
  // anterior con otro catálogo.
  await rm(join(PUBLIC, "assets/catalogo"), { recursive: true, force: true });
  await rm(join(PUBLIC, "assets/escena"), { recursive: true, force: true });
  await rm(join(PUBLIC, "assets/marca"), { recursive: true, force: true });

  for (const product of catalogProducts) {
    await write(`assets/catalogo/${product.slug}.svg`, productSvg(product));
  }

  for (const scene of SCENES) {
    await write(
      `assets/${scene.file}`,
      sceneSvg({ slug: scene.file, width: scene.w, height: scene.h, palette: scene.palette, title: scene.title, kind: scene.kind }),
    );
  }

  await write("assets/escena/textura-selva.svg", textureSvg());
  await write("assets/marca/isotipo.svg", isotypeSvg());
  await write("assets/marca/selva-y-sal.svg", wordmarkSvg({ ink: "#0d3b34", sub: "#5c7d72" }));
  await write("assets/marca/selva-y-sal-claro.svg", wordmarkSvg({ ink: "#f4f1e6", sub: "#a8c6bb" }));

  const social = Buffer.from(socialSvg());
  await sharp(social).jpeg({ quality: 86 }).toFile(join(PUBLIC, "og.jpg"));

  console.log(
    `Generados ${catalogProducts.length} productos, ${SCENES.length + 1} escenas, 3 archivos de marca y og.jpg`,
  );
}

await main();
