# API de integración · Inicio rediseñado

El módulo mantiene contenido y conversión en HTML y recibe el render 3D por
inyección. No importa Three.js ni obliga a descargarlo en otras rutas.

## Integración mínima

```tsx
import { RedesignHome } from "./components/redesign";
import "./redesign.css";

<RedesignHome />
```

Sin un motor conectado, la variante cinematográfica utiliza un animatic CSS.
Con `prefers-reduced-motion`, F22, WebGL no disponible o `forceStatic`, muestra
automáticamente el poster estático y conserva los CTA.

## Conexión del motor visual

```tsx
<RedesignHome
  renderVisual={({ progress, activeScene, mode }) => (
    <CinematicScene
      progress={progress}
      activeScene={activeScene}
      mode={mode}
    />
  )}
  onProgress={({ progress }) => {
    cameraTimeline.current?.seek(progress);
  }}
/>
```

`progress` está normalizado entre `0` y `1`; `activeScene` usa los seis IDs
exportados por `RgxSceneId`. La función `renderVisual` queda por debajo del DOM,
sin interacción ni semántica; texto, acciones y progreso siguen en
`NarrativeOverlay`.

## Carrito existente

La portada solo comunica el `slug` para no duplicar modelos de catálogo:

```tsx
<RedesignHome
  onAddProduct={(slug) => {
    const product = PRODUCTS.find((item) => item.slug === slug);
    if (product) add(product);
  }}
/>
```

Si no se facilita `onAddProduct`, las tarjetas conservan el enlace a la ficha
y no presentan una acción de carrito incompleta.

## Props principales

- `renderVisual(context)`: monta el canvas/escena bajo la interfaz.
- `onProgress(context)`: sincroniza una línea de cámara externa.
- `onSkip()`: notifica antes de bajar a la portada comercial.
- `forceStatic`: fuerza la variante sin movimiento.
- `allowWithoutWebGL`: omite solo la prueba de WebGL; no ignora F22 ni la
  preferencia del sistema.
- `featuredProductSlugs`: reemplaza la selección destacada con slugs reales.
- `onAddProduct(slug)`: conecta el carrito existente.

También se exportan `NarrativeStory`, `NarrativeOverlay`, `CommercialHome`,
`RGX_SCENES`, `useExperienceMode` y todos sus tipos.
