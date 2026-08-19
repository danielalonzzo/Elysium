"use client";

import { CommercialHome } from "./CommercialHome";
import { NarrativeStory } from "./NarrativeOverlay";
import type { RgxRedesignHomeProps } from "./types";

/**
 * Composición completa de Inicio. El motor 3D es una dependencia invertida:
 * se conecta con `renderVisual` y recibe progreso/escena, mientras contenido,
 * navegación y fallback continúan funcionando sin él.
 */
export function RedesignHome({
  renderVisual,
  forceStatic,
  allowWithoutWebGL,
  onProgress,
  onSkip,
  onAddProduct,
  featuredProductSlugs,
  storyClassName,
  commercialClassName,
}: RgxRedesignHomeProps) {
  return (
    <div className="rgx-home">
      <NarrativeStory
        renderVisual={renderVisual}
        forceStatic={forceStatic}
        allowWithoutWebGL={allowWithoutWebGL}
        onProgress={onProgress}
        onSkip={onSkip}
        className={storyClassName}
      />
      <CommercialHome
        onAddProduct={onAddProduct}
        featuredProductSlugs={featuredProductSlugs}
        className={commercialClassName}
      />
    </div>
  );
}
