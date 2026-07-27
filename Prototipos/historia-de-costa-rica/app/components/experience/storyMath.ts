import * as THREE from "three";

/** Recorta a [0,1] y neutraliza NaN/Infinity (el scroll puede desbordar). */
export function clamp01(value: number) {
  return THREE.MathUtils.clamp(Number.isFinite(value) ? value : 0, 0, 1);
}

/** Rampa suave (smoothstep) entre `start` y `end` sobre `value`. */
export function smoothRange(start: number, end: number, value: number) {
  if (start === end) return value >= end ? 1 : 0;
  const normalized = clamp01((value - start) / (end - start));
  return normalized * normalized * (3 - 2 * normalized);
}

/** Pulso triangular suavizado: 0 en los extremos, 1 en el centro del rango. */
export function bell(start: number, end: number, value: number) {
  const mid = (start + end) / 2;
  const rising = smoothRange(start, mid, value);
  const falling = 1 - smoothRange(mid, end, value);
  return Math.min(rising, falling);
}

export function lerp(start: number, end: number, amount: number) {
  return THREE.MathUtils.lerp(start, end, clamp01(amount));
}

/** Aleatorio determinista por índice: mismas posiciones en cada render. */
export function seededUnit(index: number, salt = 0) {
  const value = Math.sin(index * 91.733 + salt * 37.719) * 43758.5453;
  return value - Math.floor(value);
}
