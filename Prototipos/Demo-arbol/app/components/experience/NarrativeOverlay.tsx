"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { CONTACT, PRICES, linkTo } from "../../data/content";
import { IconArrowUpRight, IconWhatsApp } from "../site/Icons";

/*
 * Capa narrativa 2D (HTML/CSS) sobre el canvas 3D. Los textos aparecen y se
 * desvanecen sincronizados con el progreso de los cuatro actos:
 *   Acto 1 (raíz)        → presentación de marca y misión.
 *   Acto 2 (umbral)      → sin texto: la travesía por la copa respira.
 *   Acto 3 (esfera)      → el legado y la antesala a la experiencia.
 *   Acto 4 (revelación)  → el producto + interfaz de conversión (E-Commerce).
 *
 * Los textos salen vacíos en la demo. Las marcas de tiempo (`start`/`end`) SÍ
 * son estructura y no se tocan: son las que sincronizan cada rótulo con su acto
 * de la cinemática.
 */

type Scene = {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  start: number;
  end: number;
  align: "start" | "center";
  scrollCue?: boolean;
  commerce?: boolean;
};

const SCENES: Scene[] = [
  {
    id: "raiz",
    index: "I",
    eyebrow: "",
    title: "",
    description: "",
    start: -0.08,
    end: 0.24,
    align: "start",
    scrollCue: true,
  },
  {
    id: "esfera",
    index: "II",
    eyebrow: "",
    title: "",
    description: "",
    start: 0.49,
    end: 0.72,
    align: "start",
  },
  {
    id: "revelacion",
    index: "III",
    eyebrow: "",
    title: "",
    description: "",
    start: 0.8,
    end: 1.0,
    align: "center",
    commerce: true,
  },
];

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/*
 * Cartelas de identificación (estilo ficha de museo) para las dos piezas que
 * protagonizan la cinemática. La de la esfera se apaga justo cuando esta se
 * fragmenta en las cartas: a partir de ahí la pieza ya no es la esfera.
 *
 * En móvil la cartela se convierte en una pastilla táctil arriba a la derecha
 * —enfrente de las coordenadas— que solo muestra el nombre y despliega la ficha
 * completa al tocarla o al pasar el puntero (ver globals.css).
 */
type Specimen = { id: string; name: string; note: React.ReactNode; start: number; end: number };

const SPECIMENS: Specimen[] = [
  {
    id: "arbol",
    name: "",
    note: "",
    // Arranca en negativo para estar ya del todo visible en el primer fotograma,
    // sin esperar a que el visitante deslice.
    start: -0.06,
    // Se retira entre 0.12 y 0.17, justo cuando entra la oscuridad que lleva a
    // la esfera: deja el sitio libre para la segunda cartela.
    end: 0.17,
  },
  {
    id: "esfera",
    name: "",
    note: "",
    start: 0.55,
    end: 0.75, // se retira al empezar la fragmentación
  },
];

/** Opacidad con entrada y salida suaves dentro del rango de la cartela. */
function specimenOpacity(p: number, s: Specimen) {
  return Math.min(clamp((p - s.start) / 0.05), 1 - clamp((p - (s.end - 0.05)) / 0.05));
}

/** Opacidad tipo campana: entra al inicio del rango y sale al final. */
function sceneOpacity(p: number, s: Scene) {
  const appear = clamp((p - s.start) / 0.06);
  const leave = 1 - clamp((p - (s.end - 0.06)) / 0.06);
  return Math.min(appear, leave);
}

// Instante en que empieza la oscuridad etérea (cruce selva → vacío, justo antes
// de la esfera). La lectura de coordenadas del recorrido pasa por el origen en
// ese punto: al no haber emplazamiento real, se parte de 0 · 0.
const DARK_ONSET = 0.45;
const DARK_LAT_N = 0;
const DARK_LON_O = 0;

export function NarrativeOverlay({ progress }: { progress: number }) {
  const [openSpecimen, setOpenSpecimen] = useState<string | null>(null);
  const activeIndex = SCENES.reduce((acc, s, i) => (progress >= s.start ? i : acc), 0);
  const latN = DARK_LAT_N + (progress - DARK_ONSET) * 0.45;
  const lonO = DARK_LON_O - (progress - DARK_ONSET) * 0.23;

  return (
    <div className="hdc-narrative" aria-hidden="true">
      {/* Coordenadas vivas: pequeño guiño de «expedición» por la historia. */}
      <div className="hdc-coords">
        <span className="hdc-coords-beacon" />
        <span>{latN.toFixed(4)}° N</span>
        <span className="hdc-coords-sep">·</span>
        <span>{lonO.toFixed(4)}° O</span>
      </div>

      <div className="hdc-scene-stack">
        {SCENES.map((scene) => {
          const opacity = sceneOpacity(progress, scene);
          const style: CSSProperties = {
            opacity,
            transform: `translateY(${(1 - opacity) * 22}px)`,
            pointerEvents: opacity > 0.6 ? "auto" : "none",
          };
          return (
            <article
              key={scene.id}
              className={`hdc-scene hdc-scene--${scene.align} hdc-scene--${scene.id}`}
              style={style}
            >
              <p className="hdc-scene-kicker">
                <span>{scene.index}</span>
                {scene.eyebrow}
              </p>
              <h1 className="hdc-scene-title">{scene.title}</h1>
              <p className="hdc-scene-desc">{scene.description}</p>

              {scene.scrollCue && (
                <p className="hdc-scroll-cue">
                  <span aria-hidden="true">↓</span>
                </p>
              )}

              {scene.commerce && (
                <div className="hdc-commerce">
                  <span className="hdc-price-tag">{PRICES.game}</span>
                  <div className="hdc-cta-row">
                    <a className="hdc-btn hdc-btn--solid" href={linkTo(CONTACT.whatsapp)} target="_blank" rel="noopener noreferrer">
                      <IconWhatsApp className="hdc-btn-ico" />
                    </a>
                    <Link className="hdc-btn hdc-btn--ghost" href="/tienda">
                      <IconArrowUpRight className="hdc-btn-ico" />
                    </Link>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Cartelas: identifican el árbol y las esferas mientras están en escena. */}
      {SPECIMENS.map((sp) => {
        const opacity = specimenOpacity(progress, sp);
        if (opacity <= 0) return null;
        const isOpen = openSpecimen === sp.id;
        return (
          <button
            key={sp.id}
            type="button"
            /* Decorativa: vive dentro de una capa aria-hidden, así que no entra
               en el orden de tabulación (el mismo dato se lee en las secciones). */
            tabIndex={-1}
            className={`hdc-specimen${isOpen ? " is-open" : ""}`}
            style={
              {
                opacity,
                "--hdc-specimen-rise": `${(1 - opacity) * 10}px`,
              } as CSSProperties
            }
            onClick={() => setOpenSpecimen(isOpen ? null : sp.id)}
          >
            <span className="hdc-specimen-name">{sp.name}</span>
            <span className="hdc-specimen-note">
              <span className="hdc-specimen-note-inner">{sp.note}</span>
            </span>
          </button>
        );
      })}

      {/* Riel de capítulos: I · II · III. */}
      <ol className="hdc-chapter-rail">
        {SCENES.map((scene, i) => (
          <li key={scene.id} className={i === activeIndex ? "is-active" : ""}>
            <span className="hdc-rail-dot" />
            <span className="hdc-rail-label">{scene.index}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
