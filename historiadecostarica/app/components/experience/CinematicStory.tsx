"use client";

import { useEffect, useRef, useState } from "react";
import { setDockAnimationActive } from "../../lib/dockVisibility";
import { CONTACT, PRICES } from "../../data/content";
import { IconArrowUpRight, IconWhatsApp } from "../site/Icons";
import { CinematicVisual } from "./CinematicVisual";
import { NarrativeOverlay } from "./NarrativeOverlay";
import { useExperienceMode } from "./useExperienceMode";

/*
 * Entregable #2 · Orquestador de GSAP ScrollTrigger.
 *
 * Apila dos capas dentro de un contenedor `sticky`: la capa visual 3D (WebGL) y
 * la capa narrativa 2D (HTML/CSS). ScrollTrigger convierte el desplazamiento del
 * usuario en una variable de progreso 0→1 que alimenta ambas capas. Si GSAP no
 * carga, un cálculo nativo de scroll toma el relevo.
 *
 * El Magic Bottom (F09) permanece oculto durante la cinemática y reaparece al
 * llegar a progress ≈ 0.98 (brief · Acto 4).
 */

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/*
 * Reparto del scroll entre actos. El Acto 1 (árbol) consume solo ACT1_SCROLL del
 * desplazamiento total, pero internamente sigue recorriendo 0 → ACT1_STORY del
 * progreso narrativo: así se acorta su duración sin tocar ni una sola de las
 * marcas de los actos posteriores (0.35 / 0.46 / 0.75).
 */
const ACT1_SCROLL = 0.21; // mitad del scroll que ocupaba antes
const ACT1_STORY = 0.27; // frontera Acto 1 → Acto 2 (oscuridad ya completa)

function warpProgress(raw: number) {
  if (raw <= ACT1_SCROLL) return (raw / ACT1_SCROLL) * ACT1_STORY;
  return ACT1_STORY + ((raw - ACT1_SCROLL) / (1 - ACT1_SCROLL)) * (1 - ACT1_STORY);
}

/** Portada estática para reduced-motion / sin WebGL (variante accesible). */
function StaticHero() {
  return (
    <div className="hdc-static-hero">
      <div className="hdc-static-aura" aria-hidden="true" />
      <div className="hdc-static-copy">
        <p className="hdc-scene-kicker"><span>I</span>Historia de Costa Rica</p>
        <h1 className="hdc-scene-title">La historia de un país, en tus manos.</h1>
        <p className="hdc-scene-desc">
          El juego de mesa que reconstruye la cronología de Costa Rica con 80 cartas
          ilustradas, para 2 a 6 jugadores.
        </p>
        <div className="hdc-commerce">
          <span className="hdc-price-tag">{PRICES.game}</span>
          <div className="hdc-cta-row">
            <a className="hdc-btn hdc-btn--solid" href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
              <IconWhatsApp className="hdc-btn-ico" /> Pedir por WhatsApp
            </a>
            <a className="hdc-btn hdc-btn--ghost" href="#juego">
              Explorar el juego <IconArrowUpRight className="hdc-btn-ico" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CinematicStory() {
  const rootRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const mode = useExperienceMode();

  useEffect(() => {
    if (mode !== "cinematic") return;

    let disposed = false;
    let last = -1;
    let cleanup = () => {};
    setDockAnimationActive("portada", true);

    const commit = (next: number) => {
      const safe = warpProgress(clamp(next));
      if (Math.abs(safe - last) < 0.001) return;
      last = safe;
      setProgress(safe);
      // El dock reaparece limpiamente al alcanzar el final de la cinemática.
      setDockAnimationActive("portada", safe < 0.98);
    };

    const measure = () => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const travel = Math.max(root.offsetHeight - window.innerHeight, 1);
      commit(-rect.top / travel);
    };

    const setupNativeScroll = () => {
      let frame = 0;
      const schedule = () => {
        if (frame) return;
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          measure();
        });
      };
      measure();
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      return () => {
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        if (frame) window.cancelAnimationFrame(frame);
      };
    };

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([gsapModule, scrollModule]) => {
        if (disposed || !rootRef.current) return;
        const gsap = gsapModule.gsap;
        const ScrollTrigger = scrollModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
        const timeline = { progress: 0 };
        const tween = gsap.to(timeline, {
          progress: 1,
          ease: "none",
          onUpdate: () => commit(timeline.progress),
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.4,
            invalidateOnRefresh: true,
          },
        });
        // Al resolver el modo, la portada pasa de una pantalla a varias. Las
        // secciones de abajo ya crearon sus ScrollTrigger con el alto anterior,
        // así que hay que remedir toda la página.
        ScrollTrigger.refresh();
        cleanup = () => tween.kill();
      })
      .catch(() => {
        if (!disposed) cleanup = setupNativeScroll();
      });

    return () => {
      disposed = true;
      setDockAnimationActive("portada", false);
      cleanup();
    };
  }, [mode]);

  return (
    <section
      ref={rootRef}
      className={`hdc-story hdc-story--${mode}`}
      aria-label="Un viaje por la historia de Costa Rica, del árbol nacional al juego de mesa"
    >
      <div className="hdc-story-sticky">
        {mode === "cinematic" ? (
          <>
            <div className="hdc-visual-layer">
              <CinematicVisual progress={progress} />
            </div>
            <NarrativeOverlay progress={progress} />
          </>
        ) : (
          <StaticHero />
        )}
      </div>
    </section>
  );
}
