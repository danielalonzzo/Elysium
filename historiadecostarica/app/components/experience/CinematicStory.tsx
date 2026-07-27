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

/*
 * Color del lienzo del documento a lo largo de la cinemática. Safari en iOS
 * pinta con él la barra de direcciones, así que replica lo que se ve en el
 * borde inferior de la escena: césped en penumbra (Acto 1) → vacío (Acto 2) →
 * amanecer frío (Actos 3–4). Ver `html.hdc-immersive` en globals.css.
 */
const CANVAS_RAMP: Array<{ at: number; rgb: [number, number, number] }> = [
  { at: 0.0, rgb: [32, 48, 22] },
  { at: 0.13, rgb: [32, 48, 22] },
  { at: 0.22, rgb: [6, 6, 9] },
  { at: 1.0, rgb: [14, 15, 18] },
];

function canvasColor(p: number) {
  let lo = CANVAS_RAMP[0];
  let hi = CANVAS_RAMP[CANVAS_RAMP.length - 1];
  for (let i = 1; i < CANVAS_RAMP.length; i += 1) {
    if (p <= CANVAS_RAMP[i].at) {
      lo = CANVAS_RAMP[i - 1];
      hi = CANVAS_RAMP[i];
      break;
    }
  }
  const span = hi.at - lo.at;
  const t = span > 0 ? clamp((p - lo.at) / span) : 0;
  const mix = (i: number) => Math.round(lo.rgb[i] + (hi.rgb[i] - lo.rgb[i]) * t);
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
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

    const docRoot = document.documentElement;
    const paintChrome = (p: number) => {
      docRoot.style.setProperty("--hdc-canvas", canvasColor(p));
      docRoot.classList.toggle("hdc-immersive", p < 0.995);
    };

    const rawProgress = () => {
      const root = rootRef.current;
      if (!root) return 0;
      const rect = root.getBoundingClientRect();
      return -rect.top / Math.max(root.offsetHeight - window.innerHeight, 1);
    };

    // El cromo entra ya teñido: si esperásemos al primer `commit`, la barra
    // parpadearía en blanco hasta el primer scroll. Se parte de la posición
    // real —no de cero— por si el navegador restaura el scroll a media página.
    paintChrome(warpProgress(clamp(rawProgress())));

    const commit = (next: number) => {
      const safe = warpProgress(clamp(next));
      if (Math.abs(safe - last) < 0.001) return;
      last = safe;
      setProgress(safe);
      // El dock reaparece limpiamente al alcanzar el final de la cinemática.
      setDockAnimationActive("portada", safe < 0.98);
      // El cromo del navegador acompaña al suelo de la escena.
      paintChrome(safe);
    };

    const measure = () => {
      if (!rootRef.current) return;
      commit(rawProgress());
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
      docRoot.classList.remove("hdc-immersive");
      docRoot.style.removeProperty("--hdc-canvas");
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
