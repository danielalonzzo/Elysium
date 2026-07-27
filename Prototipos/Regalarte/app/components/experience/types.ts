import type { CSSProperties, ReactNode } from "react";

export type ExperienceQuality = "desktop" | "mobile" | "reduced";

export type ExperienceStage =
  | "mist"
  | "arenal"
  | "orbit"
  | "tide"
  | "manuel-antonio";

export type CostaRicaExperienceProps = {
  /** Normalized native document-scroll progress. Values outside 0..1 are clamped. */
  progress: number;
  /** Controls scene density and motion; use `reduced` for prefers-reduced-motion. */
  quality?: ExperienceQuality;
  /** Freezes ambient motion while preserving the requested story position. */
  paused?: boolean;
  /** Applied to the decorative wrapper rather than the WebGL canvas. */
  className?: string;
  style?: CSSProperties;
  /** Decorative fallback rendered only when WebGL canvas creation fails. */
  fallback?: ReactNode;
};

export type ExperienceMotion = {
  progress: number;
  time: number;
};

export type QualitySettings = {
  dpr: number | [number, number];
  antialias: boolean;
  volcanoRadialSegments: number;
  volcanoHeightSegments: number;
  treeCount: number;
  palmCount: number;
  waveSegments: number;
  mistCount: number;
};

export const QUALITY_SETTINGS: Record<ExperienceQuality, QualitySettings> = {
  desktop: {
    dpr: [1, 1.6],
    antialias: true,
    volcanoRadialSegments: 48,
    volcanoHeightSegments: 22,
    treeCount: 72,
    palmCount: 9,
    waveSegments: 64,
    mistCount: 14,
  },
  mobile: {
    dpr: [1, 1.25],
    antialias: false,
    volcanoRadialSegments: 32,
    volcanoHeightSegments: 14,
    treeCount: 38,
    palmCount: 6,
    waveSegments: 32,
    mistCount: 8,
  },
  reduced: {
    dpr: 1,
    antialias: false,
    volcanoRadialSegments: 24,
    volcanoHeightSegments: 10,
    treeCount: 24,
    palmCount: 5,
    waveSegments: 16,
    mistCount: 5,
  },
};

export function getExperienceStage(progress: number): ExperienceStage {
  const safeProgress = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  if (safeProgress < 0.14) return "mist";
  if (safeProgress < 0.38) return "arenal";
  if (safeProgress < 0.59) return "orbit";
  if (safeProgress < 0.79) return "tide";
  return "manuel-antonio";
}
