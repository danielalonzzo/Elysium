import * as THREE from "three";

export function clamp01(value: number) {
  return THREE.MathUtils.clamp(Number.isFinite(value) ? value : 0, 0, 1);
}

export function smoothRange(start: number, end: number, value: number) {
  if (start === end) return value >= end ? 1 : 0;
  const normalized = clamp01((value - start) / (end - start));
  return normalized * normalized * (3 - 2 * normalized);
}

export function lerp(start: number, end: number, amount: number) {
  return THREE.MathUtils.lerp(start, end, clamp01(amount));
}

export function seededUnit(index: number, salt = 0) {
  const value = Math.sin(index * 91.733 + salt * 37.719) * 43758.5453;
  return value - Math.floor(value);
}
