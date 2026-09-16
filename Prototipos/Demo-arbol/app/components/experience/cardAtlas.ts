import * as THREE from "three";

/*
 * Atlas de ilustraciones para las cartas del Acto 4.
 *
 * Se dibuja en un `<canvas>` en tiempo de ejecución y NO se carga de disco, por
 * coherencia con el resto de la escena: el árbol (`guanacasteModel.ts`) y la
 * esfera (`DiquisSphere.tsx`) también se construyen por código, y así la pieza
 * sigue sin depender de ningún asset —ni un modelo, ni una textura— además de
 * ahorrarse rasterizar SVG en el build.
 *
 * Rejilla de 4×4. Las 16 casillas son caras distintas, no hay reverso: la
 * `boxGeometry` instanciada da las mismas UV a la cara delantera y a la
 * trasera, así que una casilla de reverso se vería igualmente por delante.
 *
 * Proporción de casilla 256×384 ≈ 0.667, que es la de la carta en la escena
 * (0.56 × 0.86 ≈ 0.651): si fuera cuadrada, el dibujo saldría estirado a lo
 * alto al mapearse sobre la cara.
 */

export const ATLAS_COLS = 4;
export const ATLAS_ROWS = 4;
const TILE_W = 256;
const TILE_H = 384;

const PAPER = "#fdfaf3";
const INK = "#2e150b";
const OCRE = "#a75d39";
const OCRE_SOFT = "#d4805a";
const GOLD = "#e0b65c";
const STONE = "#8b8d88";
const STONE_DK = "#53565a";
const MOSS = "#2c5525";

/** Meandro escalonado, la misma greca que llevan las láminas de producto. */
function greca(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  const u = h * 1.45;
  const n = Math.max(1, Math.floor(w / u));
  const pad = (w - n * u) / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, h * 0.18);
  ctx.lineCap = "square";
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const ox = x + pad + i * u;
    ctx.moveTo(ox, y + h);
    ctx.lineTo(ox, y + h * 0.18);
    ctx.lineTo(ox + u * 0.72, y + h * 0.18);
    ctx.lineTo(ox + u * 0.72, y + h * 0.66);
    ctx.lineTo(ox + u * 0.38, y + h * 0.66);
    ctx.lineTo(ox + u * 0.38, y + h * 0.44);
  }
  ctx.stroke();
  ctx.restore();
}

const CLUMPS: Array<[number, number, number, number]> = [
  [300, 96, 148, 62], [176, 122, 132, 58], [424, 122, 132, 58],
  [240, 158, 128, 56], [360, 158, 128, 56], [92, 162, 100, 48],
  [508, 162, 100, 48], [300, 182, 168, 52],
];

/** Copa del guanacaste, el mismo cúmulo de elipses del resto de la marca. */
function tree(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-300, -182);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(264, 196); ctx.lineTo(336, 196); ctx.lineTo(348, 302); ctx.lineTo(252, 302);
  ctx.closePath();
  ctx.moveTo(252, 302); ctx.bezierCurveTo(228, 312, 208, 324, 194, 342);
  ctx.lineTo(406, 342); ctx.bezierCurveTo(392, 324, 372, 312, 348, 302);
  ctx.closePath();
  ctx.fill();
  for (const [x, y, rx, ry] of CLUMPS) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function stoneSphere(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.34, r * 0.1, cx, cy, r);
  g.addColorStop(0, "#a8ada4");
  g.addColorStop(0.55, STONE);
  g.addColorStop(1, STONE_DK);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function sun(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.strokeStyle = OCRE;
  ctx.lineWidth = 5;
  for (let k = 0; k < 10; k++) {
    const a = (k * Math.PI) / 5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 1.28, cy + Math.sin(a) * r * 1.28);
    ctx.lineTo(cx + Math.cos(a) * r * 1.62, cy + Math.sin(a) * r * 1.62);
    ctx.stroke();
  }
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function volcano(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = STONE_DK;
  ctx.beginPath();
  ctx.moveTo(-70, 46); ctx.lineTo(-20, -40); ctx.lineTo(20, -40); ctx.lineTo(70, 46);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = OCRE;
  ctx.beginPath();
  ctx.moveTo(-20, -40); ctx.lineTo(20, -40); ctx.lineTo(34, -14); ctx.lineTo(-34, -14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function pot(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = OCRE;
  ctx.beginPath();
  ctx.moveTo(-26, -52); ctx.lineTo(26, -52); ctx.lineTo(30, -34);
  ctx.bezierCurveTo(62, -18, 62, 34, 0, 52);
  ctx.bezierCurveTo(-62, 34, -62, -18, -30, -34);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-44, 2); ctx.lineTo(44, 2);
  ctx.stroke();
  ctx.restore();
}

function waves(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.strokeStyle = "#4a6b78";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  for (let r = -1; r <= 1; r++) {
    ctx.beginPath();
    for (let x = -70; x <= 70; x += 2) {
      const y = r * 30 + Math.sin(x / 18) * 9;
      if (x === -70) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function spiral(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.strokeStyle = OCRE;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let t = 0; t < Math.PI * 5; t += 0.08) {
    const r = 5 + t * 7;
    const x = Math.cos(t) * r;
    const y = Math.sin(t) * r;
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function mountains(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = MOSS;
  ctx.beginPath();
  ctx.moveTo(-80, 46); ctx.lineTo(-24, -44); ctx.lineTo(28, 46);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.moveTo(-14, 46); ctx.lineTo(36, -22); ctx.lineTo(82, 46);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const MOTIFS = [
  (c: CanvasRenderingContext2D) => tree(c, 128, 158, 0.3, MOSS),
  (c: CanvasRenderingContext2D) => stoneSphere(c, 128, 158, 58),
  (c: CanvasRenderingContext2D) => sun(c, 128, 158, 38),
  (c: CanvasRenderingContext2D) => volcano(c, 128, 158, 1.05),
  (c: CanvasRenderingContext2D) => pot(c, 128, 158, 1.0),
  (c: CanvasRenderingContext2D) => waves(c, 128, 158, 0.95),
  (c: CanvasRenderingContext2D) => spiral(c, 128, 158, 0.9),
  (c: CanvasRenderingContext2D) => mountains(c, 128, 158, 1.05),
  (c: CanvasRenderingContext2D) => tree(c, 128, 158, 0.3, OCRE),
  (c: CanvasRenderingContext2D) => stoneSphere(c, 128, 158, 44),
  (c: CanvasRenderingContext2D) => sun(c, 128, 158, 30),
  (c: CanvasRenderingContext2D) => volcano(c, 128, 158, 0.85),
  (c: CanvasRenderingContext2D) => pot(c, 128, 158, 0.82),
  (c: CanvasRenderingContext2D) => waves(c, 128, 158, 0.78),
  (c: CanvasRenderingContext2D) => spiral(c, 128, 158, 0.72),
  (c: CanvasRenderingContext2D) => mountains(c, 128, 158, 0.85),
];

const ROMAN = ["I", "II", "III", "IV"];

/** Dibuja una carta completa en el origen de la casilla (0,0)–(256,384). */
function drawCard(ctx: CanvasRenderingContext2D, index: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, TILE_W, TILE_H);

  // Marco interior
  ctx.strokeStyle = OCRE;
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, TILE_W - 24, TILE_H - 24);

  greca(ctx, 26, 26, TILE_W - 52, 18, OCRE_SOFT);
  greca(ctx, 26, TILE_H - 44, TILE_W - 52, 18, OCRE_SOFT);

  MOTIFS[index % MOTIFS.length](ctx);

  // Numeral de era, arriba a la izquierda.
  ctx.fillStyle = OCRE;
  ctx.font = "bold 22px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText(ROMAN[index % 4], 30, 74);

  /*
   * El rótulo va como reglones y no como texto: a la escala a la que se ven las
   * cartas en el Acto 4 —80 repartidas en una hélice— ninguna palabra sería
   * legible, y un texto real solo añadiría ruido al mipmap.
   */
  ctx.fillStyle = INK;
  ctx.globalAlpha = 0.82;
  ctx.fillRect(40, 250, TILE_W - 80, 7);
  ctx.globalAlpha = 0.4;
  ctx.fillRect(58, 272, TILE_W - 116, 5);
  ctx.globalAlpha = 0.26;
  ctx.fillRect(46, 296, TILE_W - 92, 4);
  ctx.fillRect(46, 310, TILE_W - 118, 4);
  ctx.globalAlpha = 1;
}

/**
 * Construye el atlas. Devuelve `null` fuera del navegador (no hay `document`),
 * en cuyo caso las cartas se quedan con su color pergamino liso.
 */
export function makeCardAtlas(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = TILE_W * ATLAS_COLS;
  canvas.height = TILE_H * ATLAS_ROWS;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  for (let row = 0; row < ATLAS_ROWS; row++) {
    for (let col = 0; col < ATLAS_COLS; col++) {
      ctx.save();
      ctx.translate(col * TILE_W, row * TILE_H);
      drawCard(ctx, row * ATLAS_COLS + col);
      ctx.restore();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Sin repetición: el desplazamiento de UV por instancia ya cae dentro de la
  // casilla, y envolver haría que una carta mordiera la casilla vecina.
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  return texture;
}
