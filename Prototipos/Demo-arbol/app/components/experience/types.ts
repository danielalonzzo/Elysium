import type { CSSProperties, ReactNode } from "react";

export type ExperienceQuality = "desktop" | "mobile" | "reduced";
export type ExperienceMode = "cinematic" | "static";

/**
 * Los cuatro actos, mapeados sobre el progreso normalizado:
 *  raiz        0.00–0.35  El árbol
 *  umbral      0.35–0.46  Travesía por la copa
 *  esfera      0.46–0.75  La esfera de piedra (noche → amanecer)
 *  revelacion  0.75–1.00  Fragmentación y línea del tiempo de cartas
 */
export type ExperienceStage = "raiz" | "umbral" | "esfera" | "revelacion";

export type TreeExperienceProps = {
  /** Progreso de scroll normalizado. Los valores fuera de 0..1 se recortan. */
  progress: number;
  /** Densidad y movimiento de la escena; usa `reduced` para reduced-motion. */
  quality?: ExperienceQuality;
  /** Congela el movimiento ambiental preservando la posición de la historia. */
  paused?: boolean;
  /** Se aplica al contenedor decorativo, no al canvas WebGL. */
  className?: string;
  style?: CSSProperties;
  /** Fallback decorativo si falla la creación del canvas WebGL. */
  fallback?: ReactNode;
  /** Se llama una sola vez, cuando la escena ya ha pintado de verdad. */
  onReady?: () => void;
};

export type ExperienceMotion = {
  progress: number;
  time: number;
};

export type QualitySettings = {
  dpr: number | [number, number];
  antialias: boolean;
  /**
   * Presupuesto de masas de follaje de la copa. Elige el nivel de detalle
   * del esqueleto fractal (nº de subdivisiones y de matas por punta), así que
   * el recuento final de instancias ronda —sin igualar— esta cifra.
   */
  crownPuffs: number;
  shardCount: number; // fragmentos de la esfera
  cardCount: number; // cartas de la línea del tiempo
};

export const QUALITY_SETTINGS: Record<ExperienceQuality, QualitySettings> = {
  desktop: { dpr: [1, 1.6], antialias: true, crownPuffs: 1200, shardCount: 48, cardCount: 80 },
  mobile: { dpr: [1, 1.25], antialias: false, crownPuffs: 620, shardCount: 30, cardCount: 80 },
  reduced: { dpr: 1, antialias: false, crownPuffs: 260, shardCount: 16, cardCount: 40 },
};

export function getExperienceStage(progress: number): ExperienceStage {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  if (p < 0.35) return "raiz";
  if (p < 0.46) return "umbral";
  if (p < 0.75) return "esfera";
  return "revelacion";
}
