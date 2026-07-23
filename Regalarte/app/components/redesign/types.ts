import type { ReactNode } from "react";

export type RgxExperienceMode = "cinematic" | "static";

export type RgxSceneId =
  | "origin"
  | "arenal"
  | "forest"
  | "crossing"
  | "manuel-antonio"
  | "souvenir";

export interface RgxScene {
  id: RgxSceneId;
  index: string;
  eyebrow: string | { es: string; en: string };
  title: string | { es: string; en: string };
  description: string | { es: string; en: string };
  start: number;
  end: number;
  align: "start" | "end" | "center";
}

export interface RgxVisualContext {
  /** Progreso normalizado de la secuencia: 0 al entrar y 1 al salir. */
  progress: number;
  activeScene: RgxSceneId;
  mode: RgxExperienceMode;
}

export interface RgxNarrativeStoryProps {
  /** Permite que el motor 3D externo pinte por debajo de la interfaz HTML. */
  renderVisual?: (context: RgxVisualContext) => ReactNode;
  /** Fuerza el poster accesible, útil para F22, QA y equipos limitados. */
  forceStatic?: boolean;
  /** Desactiva únicamente la comprobación WebGL; nunca ignora reduced-motion. */
  allowWithoutWebGL?: boolean;
  /** Notifica el progreso al motor de cámara sin capturar el scroll. */
  onProgress?: (context: RgxVisualContext) => void;
  onSkip?: () => void;
  className?: string;
}

export interface RgxCommercialHomeProps {
  onAddProduct?: (slug: string) => void;
  featuredProductSlugs?: readonly string[];
  className?: string;
}

export interface RgxRedesignHomeProps
  extends Omit<RgxNarrativeStoryProps, "className">,
    RgxCommercialHomeProps {
  storyClassName?: string;
  commercialClassName?: string;
}
