"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ExperienceScene } from "./ExperienceScene";
import { QUALITY_SETTINGS, type TreeExperienceProps } from "./types";

/*
 * Avisa cuando la escena ha pintado de verdad. `onCreated` del Canvas llega con
 * el contexto WebGL recién hecho pero antes del primer render: si la Loading
 * Page se fuera ahí, se vería el lienzo en negro. Se esperan dos fotogramas —
 * el primero es el que compila los shaders y suele tardar bastante más.
 */
function FirstFrame({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0);

  useFrame(() => {
    if (frames.current < 0) return;
    frames.current += 1;
    if (frames.current < 2) return;
    frames.current = -1;
    onReady?.();
  });

  return null;
}

/*
 * Entregable #3 · Componente R3F que contiene la escena, cámaras, luces y
 * animaciones atadas al progreso de scroll.
 *
 * Rendimiento: el canvas usa `frameloop="demand"`
 * cuando la escena está pausada (fuera del viewport o pestaña oculta), de modo
 * que no consume batería mientras no se ve.
 */
export function TreeExperience({
  progress,
  quality = "desktop",
  paused = false,
  className,
  style,
  fallback = null,
  onReady,
}: TreeExperienceProps) {
  const settings = QUALITY_SETTINGS[quality];
  const [painted, setPainted] = useState(false);

  /*
   * El lienzo solo se congela DESPUÉS de haber pintado de verdad.
   *
   * `paused` se levanta muy pronto: el IntersectionObserver que lo alimenta
   * entrega su primera lectura durante la hidratación, cuando la capa sticky
   * puede medir todavía cero, y basta esa lectura para entrar en
   * `frameloop="demand"`. Sin bucle, el canvas se queda en blanco —se ve el
   * fondo del documento— y no se rellena hasta que algo fuerza un fotograma
   * suelto: por eso «al moverse se carga bien». Arrancando siempre en `always`
   * la escena aparece sola, y el ahorro de batería entra en cuanto hay algo
   * que congelar.
   */
  const staticCanvas = painted && (quality === "reduced" || paused);

  const handleFirstFrame = useCallback(() => {
    setPainted(true);
    onReady?.();
  }, [onReady]);

  /*
   * Con la pestaña en segundo plano el navegador detiene `requestAnimationFrame`
   * y no habrá primer fotograma por mucho que el bucle esté en `always`. Ahí no
   * hay nada que mirar, así que se suelta la Loading Page en vez de retenerla
   * hasta el timeout de seguridad (8 s).
   */
  useEffect(() => {
    if (!painted && paused) onReady?.();
  }, [painted, paused, onReady]);

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        ...style,
      }}
    >
      <Canvas
        aria-hidden="true"
        tabIndex={-1}
        dpr={settings.dpr}
        frameloop={staticCanvas ? "demand" : "always"}
        camera={{ position: [0.2, 1.9, 19], fov: quality === "mobile" ? 58 : 50, near: 0.1, far: 260 }}
        gl={{
          alpha: true,
          antialias: settings.antialias,
          powerPreference: "high-performance",
          stencil: false,
        }}
        performance={{ min: 0.5 }}
        fallback={fallback}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = quality === "mobile" ? 1.02 : 1.1;
        }}
        style={{ display: "block", width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <ExperienceScene progress={progress} quality={quality} settings={settings} paused={paused} />
        <FirstFrame onReady={handleFirstFrame} />
      </Canvas>
    </div>
  );
}
