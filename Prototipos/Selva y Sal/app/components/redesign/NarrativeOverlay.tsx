"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  RgxExperienceMode,
  RgxNarrativeStoryProps,
  RgxScene,
  RgxSceneId,
  RgxVisualContext,
} from "./types";
import { useExperienceMode } from "./useExperienceMode";
import { setDockAnimationActive } from "../../utils/dockVisibility";
import { IconArrowUpRight } from "../Icons";

import { useLanguage } from "../LanguageContext";

export const RGX_SCENES = [
  {
    id: "origin",
    index: "01",
    eyebrow: {
      es: "Selva y Sal",
      en: "Selva y Sal",
    },
    title: {
      es: "Del volcán al mar.",
      en: "From the volcano to the sea.",
    },
    description: {
      es: "Once expediciones guiadas que atraviesan el país de punta a punta: el Arenal al amanecer, el bosque nuboso de Tilarán y el arrecife del Pacífico Sur.",
      en: "Eleven guided expeditions crossing the country end to end: Arenal at dawn, the Tilarán cloud forest and the reef of the southern Pacific.",
    },
    start: 0,
    end: 0.16,
    align: "start",
  },
  {
    id: "arenal",
    index: "02",
    eyebrow: {
      es: "Expediciones",
      en: "Expeditions",
    },
    title: {
      es: "Ocho personas, nunca más.",
      en: "Eight people, never more.",
    },
    description: {
      es: "Grupos pequeños y guías de la zona. Salimos a las 4:30 porque el volcán se despeja tres horas al día y casi nunca son las que la gente reserva.",
      en: "Small groups and local guides. We leave at 4:30 because the volcano only clears for about three hours a day — rarely the hours people book.",
    },
    start: 0.12,
    end: 0.39,
    align: "end",
  },
  {
    id: "forest",
    index: "03",
    eyebrow: {
      es: "Recuerdos",
      en: "Keepsakes",
    },
    title: {
      es: "Hechos para llevar.",
      en: "Made to take home.",
    },
    description: {
      es: "Diseñamos nuestra propia línea en lugar de revender la de siempre: textiles, cerámica, café y artesanía de talleres que conocemos por su nombre.",
      en: "We design our own line instead of reselling the usual: textiles, ceramics, coffee and craft from workshops we know by name.",
    },
    start: 0.34,
    end: 0.59,
    align: "start",
  },
  {
    id: "crossing",
    index: "04",
    eyebrow: {
      es: "Diecisiete años",
      en: "Seventeen years",
    },
    title: {
      es: "Guías de aquí.",
      en: "Guides from here.",
    },
    description: {
      es: "Desde 2009 en La Fortuna, con veintidós guías, más de nueve mil personas al año y el 100 % de la huella de cada salida compensada.",
      en: "Based in La Fortuna since 2009, with twenty-two guides, over nine thousand travellers a year and 100 % of every trip's footprint offset.",
    },
    start: 0.54,
    end: 1,
    align: "end",
  },
] as const satisfies readonly RgxScene[];

const clamp = (value: number) => Math.min(1, Math.max(0, value));

function sceneAt(progress: number): RgxScene {
  let closest: RgxScene = RGX_SCENES[0];
  for (const scene of RGX_SCENES) {
    if (progress >= scene.start) closest = scene;
  }
  return closest;
}

function localProgress(progress: number, start: number, end: number) {
  return clamp((progress - start) / Math.max(end - start, 0.001));
}

function visualStyle(progress: number): CSSProperties {
  const volcano = localProgress(progress, 0.08, 0.38);
  const turn = localProgress(progress, 0.35, 0.62);
  return {
    "--rgx-progress": progress,
    "--rgx-volcano": volcano,
    "--rgx-turn": turn,
    "--rgx-volcano-scale": 0.76 + volcano * 0.54,
    "--rgx-volcano-x": `${48 - turn * 16}%`,
    "--rgx-canopy-x": `${turn * -7}%`,
  } as CSSProperties;
}

function StaticCostaRicaPoster() {
  return (
    <div className="rgx-static-poster" aria-hidden="true">
      <div className="rgx-static-sky" />
      <div className="rgx-static-sun" />
      <div className="rgx-static-volcano rgx-static-volcano-back" />
      <div className="rgx-static-volcano rgx-static-volcano-front" />
      <div className="rgx-static-mist rgx-static-mist-one" />
      <div className="rgx-static-mist rgx-static-mist-two" />
      <div className="rgx-static-forest rgx-static-forest-back" />
      <div className="rgx-static-forest rgx-static-forest-front" />
      <div className="rgx-static-grain" />
    </div>
  );
}

function AmbientCinematicPlaceholder() {
  return (
    <div className="rgx-ambient-world" aria-hidden="true">
      <div className="rgx-ambient-glow" />
      <div className="rgx-ambient-volcano" />
      <div className="rgx-ambient-canopy" />
      <div className="rgx-static-grain" />
    </div>
  );
}

export function NarrativeOverlay({
  progress,
  mode,
  onSkip,
}: {
  progress: number;
  mode: RgxExperienceMode;
  onSkip?: () => void;
}) {
  const active = sceneAt(progress);
  const { lang, t } = useLanguage();

  const getProp = (val: string | { es: string; en: string }) =>
    typeof val === "string" ? val : val[lang] || val.es;

  if (mode === "static") {
    return (
      <div className="rgx-narrative rgx-static-narrative">
        <div className="rgx-static-copy">
          <p className="rgx-scene-kicker"><span>17</span>{t("Años recorriendo", "Years on the trail")}</p>
          <h1>{t("Del volcán al mar.", "From the volcano to the sea.")}</h1>
          <p className="rgx-scene-description">
            {t(
              "Once expediciones guiadas que atraviesan el país de punta a punta, y una línea de recuerdos que diseñamos y fabricamos aquí.",
              "Eleven guided expeditions crossing the country end to end, and a line of keepsakes we design and make right here."
            )}
          </p>
          <ol className="rgx-static-route" aria-label={t("Ruta visual del volcán al mar", "Visual route from volcano to sea")}>
            {RGX_SCENES.slice(0, -1).map((scene) => <li key={scene.id}>{getProp(scene.title)}</li>)}
          </ol>
          <div className="rgx-hero-actions">
            <Link className="rgx-button rgx-button-sun" href="/tienda/">{t("Entrar a la tienda", "Enter the shop")} <IconArrowUpRight className="rgx-btn-arrow" /></Link>
            <Link className="rgx-button rgx-button-glass" href="/expediciones/">{t("Ver expediciones", "See expeditions")}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rgx-narrative">
      <div className="rgx-narrative-tools">
        <div className="rgx-place-mark">
          <span className="rgx-gps-beacon" aria-hidden="true" />
          <span>{(9.7489 + progress * 0.4511).toFixed(4).padStart(7, '0')}° N</span>
          <span className="rgx-gps-sep">•</span>
          <span>{(83.7534 - progress * 0.2301).toFixed(4).padStart(7, '0')}° W</span>
        </div>
        {mode === "cinematic" && (
          <button className="rgx-skip" type="button" onClick={onSkip}>
            {t("Saltar experiencia", "Skip experience")} <span aria-hidden="true">↓</span>
          </button>
        )}
      </div>

      <div className="rgx-scene-stack">
        {RGX_SCENES.map((scene) => {
          const isActive = scene.id === active.id;
          const eyebrow = getProp(scene.eyebrow);
          const title = getProp(scene.title);
          const description = getProp(scene.description);

          return (
            <article
              className={`rgx-scene-copy rgx-align-${scene.align}${isActive ? " rgx-is-active" : ""}`}
              key={scene.id}
              aria-hidden={!isActive}
            >
              <p className="rgx-scene-kicker"><span>{scene.index}</span>{eyebrow}</p>
              <h1>{title}</h1>
              <p className="rgx-scene-description">{description}</p>
              {scene.id === "origin" && (
                <p className="rgx-scroll-cue">
                  <span aria-hidden="true">↓</span> {t("Desliza para recorrer", "Scroll to explore")}
                </p>
              )}
              {scene.id === "crossing" && (
                <div className="rgx-hero-actions">
                  <Link className="rgx-button rgx-button-sun" href="/tienda/">{t("Entrar a la tienda", "Enter the shop")} <IconArrowUpRight className="rgx-btn-arrow" /></Link>
                  <Link className="rgx-button rgx-button-glass" href="/expediciones/">{t("Ver expediciones", "See expeditions")}</Link>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="rgx-chapter-rail" role="group" aria-label={t("Progreso del recorrido", "Tour progress")}>
        <ol>
          {RGX_SCENES.map((scene) => (
            <li className={scene.id === active.id ? "rgx-is-active" : ""} key={scene.id}>
              <span className="rgx-rail-dot" aria-hidden="true" />
              <span className="rgx-rail-label">{scene.index}</span>
              <span className="rgx-visually-hidden">{getProp(scene.title)}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rgx-location-label" aria-hidden="true">
        <span className="rgx-location-dot" />
        <span>{active.id === "crossing" ? t("Volcán Arenal", "Arenal Volcano") : t("Cordillera de Tilarán", "Tilarán Mountain Range")}</span>
        <i />
      </div>
    </div>
  );
}

export function NarrativeStory({
  renderVisual,
  forceStatic,
  allowWithoutWebGL,
  onProgress,
  onSkip,
  className = "",
}: RgxNarrativeStoryProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const mode = useExperienceMode({ forceStatic, allowWithoutWebGL });
  const resolvedProgress = mode === "static" ? 1 : progress;
  const activeScene = useMemo(() => sceneAt(resolvedProgress).id, [resolvedProgress]);
  const context: RgxVisualContext = { progress: resolvedProgress, activeScene, mode };

  useEffect(() => {
    if (mode === "static") return;

    let disposed = false;
    let last = -1;
    let cleanup = () => {};
    // El dock de contacto se mantiene oculto en móvil mientras la portada se
    // recorre y reaparece justo al salir de la última escena (progreso ≈ 1).
    setDockAnimationActive("portada", true);
    const commit = (next: number) => {
      const safe = clamp(next);
      if (Math.abs(safe - last) < 0.001) return;
      last = safe;
      setProgress(safe);
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

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, scrollModule]) => {
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
          scrub: 0.35,
          invalidateOnRefresh: true,
        },
      });
      cleanup = () => tween.kill();
    }).catch(() => {
      if (!disposed) cleanup = setupNativeScroll();
    });

    return () => {
      disposed = true;
      setDockAnimationActive("portada", false);
      cleanup();
    };
  }, [mode]);

  useEffect(() => {
    onProgress?.({ progress: resolvedProgress, activeScene, mode });
  }, [activeScene, mode, onProgress, resolvedProgress]);

  const skip = () => {
    onSkip?.();
    rootRef.current?.nextElementSibling?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      ref={rootRef}
      className={`rgx-story rgx-mode-${mode} ${className}`.trim()}
      aria-label="Un recorrido de Costa Rica, del volcán al mar"
      style={visualStyle(resolvedProgress)}
    >
      <div className="rgx-story-sticky">
        <div className="rgx-visual-layer" aria-hidden="true">
          {mode === "static" ? <StaticCostaRicaPoster /> : renderVisual?.(context) ?? <AmbientCinematicPlaceholder />}
        </div>
        <NarrativeOverlay progress={resolvedProgress} mode={mode} onSkip={skip} />
      </div>
    </section>
  );
}

export type { RgxSceneId };
