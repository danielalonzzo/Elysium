"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useExperienceMode } from "./useExperienceMode";
import type { RgxExperienceMode } from "./types";

const ABOUT_SCENES = [
  {
    id: "manuel-antonio",
    index: "01",
    eyebrow: "Nuestra Esencia",
    title: "Donde la selva toca el mar.",
    description: "Inspirados por la belleza natural de nuestras costas, creamos piezas que celebran la biodiversidad.",
    start: 0,
    end: 0.45,
    align: "start",
  },
  {
    id: "souvenir",
    index: "02",
    eyebrow: "Nuestro Propósito",
    title: "Llévate Costa Rica contigo.",
    description: "Cada souvenir es una conexión con la fauna, los paisajes y la calidez de un país inolvidable.",
    start: 0.55,
    end: 1,
    align: "end",
  },
] as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

function sceneAt(progress: number) {
  let closest: (typeof ABOUT_SCENES)[number] = ABOUT_SCENES[0];
  for (const scene of ABOUT_SCENES) {
    if (progress >= scene.start) closest = scene;
  }
  return closest;
}

function localProgress(progress: number, start: number, end: number) {
  return clamp((progress - start) / Math.max(end - start, 0.001));
}

function visualStyle(progress: number): CSSProperties {
  const ocean = localProgress(progress, 0.0, 0.5);
  const bird = localProgress(progress, 0.4, 1.0);
  
  return {
    "--rgx-progress": progress,
    "--rgx-ocean-opacity": ocean,
    "--rgx-bird-opacity": bird < 0.08 || bird > 0.97 ? 0 : 1,
    "--rgx-bird-x": `${108 - bird * 132}%`,
    "--rgx-bird-y": `${34 - Math.sin(bird * Math.PI) * 13}%`,
  } as CSSProperties;
}

function AboutStaticVisual() {
  return (
    <div className="rgx-static-poster rgx-static-light" aria-hidden="true">
      <div className="rgx-static-sky-light" />
      <div className="rgx-static-sun-light" />
      <div className="rgx-static-ocean"><span /><span /><span /></div>
      <div className="rgx-static-coast" />
      <div className="rgx-static-bird"><span /><i /><b /></div>
      <div className="rgx-static-grain" />
    </div>
  );
}

function AboutAmbientPlaceholder() {
  return (
    <div className="rgx-ambient-world rgx-ambient-light" aria-hidden="true">
      <div className="rgx-ambient-glow" />
      <div className="rgx-ambient-water"><span /><span /></div>
      <div className="rgx-ambient-bird"><span /><i /><b /></div>
      <div className="rgx-static-grain" />
    </div>
  );
}

export function AboutPremiumOverlay({
  progress,
  mode,
}: {
  progress: number;
  mode: RgxExperienceMode;
}) {
  const active = sceneAt(progress);

  return (
    <div className="rgx-narrative rgx-narrative-light">
      <div className="rgx-scene-stack">
        {ABOUT_SCENES.map((scene) => {
          const isActive = scene.id === active.id;
          return (
            <article
              className={`rgx-scene-copy rgx-align-${scene.align}${isActive ? " rgx-is-active" : ""}`}
              key={scene.id}
              aria-hidden={!isActive}
            >
              <p className="rgx-scene-kicker"><span>{scene.index}</span>{scene.eyebrow}</p>
              <h1>{scene.title}</h1>
              <p className="rgx-scene-description">{scene.description}</p>
              {scene.id === "manuel-antonio" && <p className="rgx-scroll-cue"><span aria-hidden="true">↓</span> Desliza para conocer más</p>}
              {scene.id === "souvenir" && (
                <div className="rgx-hero-actions">
                  <Link className="rgx-button rgx-button-sun" href="/tienda/">Ver colecciones <span aria-hidden="true">&#x2197;&#xFE0E;</span></Link>
                  <Link className="rgx-button rgx-button-glass-dark" href="/contacto/">Contáctenos</Link>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="rgx-chapter-rail rgx-chapter-rail-light" role="group" aria-label="Progreso">
        <ol>
          {ABOUT_SCENES.map((scene) => (
            <li className={scene.id === active.id ? "rgx-is-active" : ""} key={scene.id}>
              <span className="rgx-rail-dot" aria-hidden="true" />
              <span className="rgx-rail-label">{scene.index}</span>
              <span className="rgx-visually-hidden">{scene.title}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function AboutPremium({
  renderVisual,
  className = "",
}: {
  renderVisual?: (props: { progress: number; mode: RgxExperienceMode }) => React.ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const mode = useExperienceMode({ forceStatic: false, allowWithoutWebGL: true });

  useEffect(() => {
    let disposed = false;
    let last = -1;
    let cleanup = () => {};
    
    const commit = (next: number) => {
      const safe = clamp(next);
      if (Math.abs(safe - last) < 0.001) return;
      last = safe;
      setProgress(safe);
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
      cleanup();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className={`rgx-story rgx-mode-${mode} rgx-story-light ${className}`.trim()}
      aria-label="Acerca de Regalarte"
      style={visualStyle(progress)}
    >
      <div className="rgx-story-sticky">
        <div className="rgx-visual-layer" aria-hidden="true">
          {mode === "static" ? <AboutStaticVisual /> : renderVisual?.({ progress, mode }) ?? <AboutAmbientPlaceholder />}
        </div>
        <AboutPremiumOverlay progress={progress} mode={mode} />
      </div>
    </section>
  );
}
