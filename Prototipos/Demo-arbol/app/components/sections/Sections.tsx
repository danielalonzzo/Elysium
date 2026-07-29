"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CONTACT, PRICES, SHOTS, linkTo } from "../../data/content";
import { IconArrowUpRight, IconInstagram, IconWhatsApp, IconYouTube } from "../site/Icons";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks & Utilities
// ─────────────────────────────────────────────────────────────────────────────

/*
 * Movimiento reducido: la preferencia del sistema o el ajuste F22
 * (`data-elysium-motion`). Mismo criterio que `useExperienceMode` en la portada.
 */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resolve = () => {
      setReduced(
        preference.matches || document.documentElement.dataset.elysiumMotion === "reduced",
      );
    };

    const settingsObserver = new MutationObserver(resolve);
    settingsObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-elysium-motion"],
    });
    resolve();
    preference.addEventListener("change", resolve);
    return () => {
      preference.removeEventListener("change", resolve);
      settingsObserver.disconnect();
    };
  }, []);

  return reduced;
}

function WhatsAppCTA({ children }: { children?: React.ReactNode }) {
  return (
    <a
      className="hdc-btn hdc-btn--solid"
      href={linkTo(CONTACT.whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
    >
      <IconWhatsApp className="hdc-btn-ico" /> {children}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Credits Auto-Scroll Component
// ─────────────────────────────────────────────────────────────────────────────

function AutoScrollCredits({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserInteractingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const exactScrollRef = useRef(0);

  const markInteraction = useCallback(() => {
    isUserInteractingRef.current = true;
    
    // Sync the exact scroll position with the current DOM position
    if (scrollRef.current) {
      exactScrollRef.current = scrollRef.current.scrollTop;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 1500);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const speed = 0.031; // increased speed by 25% (px/ms)

    const step = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (!isUserInteractingRef.current && scrollRef.current) {
        const el = scrollRef.current;
        const blockHeight = el.scrollHeight / 2;
        
        if (blockHeight > 50) {
          exactScrollRef.current += speed * delta;
          if (exactScrollRef.current >= blockHeight) {
            exactScrollRef.current -= blockHeight;
          }
          el.scrollTop = exactScrollRef.current;
        }
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div 
      ref={scrollRef}
      onTouchStart={markInteraction}
      onTouchMove={markInteraction}
      onWheel={markInteraction}
      onPointerDown={markInteraction}
      className="hdc-credits-container"
    >
      <div className="hdc-credits-content">
        <div className="hdc-credits-block">{children}</div>
        <div className="hdc-credits-block">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Split-Screen Sticky Section (Juego, Merch, Podcast)
// ─────────────────────────────────────────────────────────────────────────────

/** Scroll vertical que consume el carrusel móvil, en múltiplos del recorrido en X. */
const HIJACK_SCROLL_FACTOR = 1.3;

function SplitScreenNarrative() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [gameImageIndex, setGameImageIndex] = useState(0);
  const [merchImageIndex, setMerchImageIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  /*
   * Rotación del carrusel de cada panel. Con la galería vacía no se programa
   * nada: el resto (`% 0`) es NaN y dejaría el índice inservible en cuanto se
   * añadiera la primera foto.
   */
  useEffect(() => {
    const total = activeIndex === 0 ? SHOTS.game.length : activeIndex === 1 ? SHOTS.merch.length : 0;
    if (total < 2) return;

    const advance = activeIndex === 0 ? setGameImageIndex : setMerchImageIndex;
    const interval = setInterval(() => advance((prev) => (prev + 1) % total), 3500);
    return () => clearInterval(interval);
  }, [activeIndex]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const panelsOf = () =>
        gsap.utils.toArray<HTMLElement>(".hdc-narrative-section", containerRef.current);

      // La imagen sigue a la tarjeta que entra en pantalla (sin anclar nada).
      const syncOnEnter = (panels: HTMLElement[], start: string, end: string) => {
        panels.forEach((panel, i) => {
          ScrollTrigger.create({
            trigger: panel,
            start,
            end,
            onToggle: (self) => {
              if (self.isActive) setActiveIndex(i);
            },
          });
        });
      };

      // ── Escritorio: scroll vertical tradicional con 2 columnas ────────────
      mm.add("(min-width: 1024px)", () => {
        const panels = panelsOf();
        syncOnEnter(panels, "top center", "bottom center");

        panels.forEach((panel) => {
          gsap.fromTo(
            panel,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: panel,
                start: "top 80%",
              },
            }
          );
        });
      });

      // ── Móvil: Horizontal Scroll Hijacking ────────────────────────────────
      mm.add("(max-width: 1023px)", () => {
        const section = containerRef.current;
        const track = trackRef.current;
        const panels = panelsOf();
        if (!section || !track || panels.length < 2) return;

        // Con movimiento reducido no se secuestra el scroll: queda la pila
        // vertical con la imagen pegajosa arriba (el modo que pinta el server).
        if (reducedMotion) {
          syncOnEnter(panels, "top 65%", "bottom 35%");
          return;
        }

        // A partir de aquí manda el CSS de `[data-mode="pinned"]`: la sección
        // mide una pantalla, las tarjetas se ponen en fila y la imagen baja.
        section.dataset.mode = "pinned";

        // Recorrido horizontal real = el ancho de la fila que no cabe en pantalla.
        const travel = () => Math.max(0, track.scrollWidth - window.innerWidth);

        gsap.to(track, {
          x: () => -travel(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            // Scroll vertical que consume el carrusel; el factor lo hace algo
            // más pausado que el desplazamiento en X, para poder leer.
            end: () => "+=" + travel() * HIJACK_SCROLL_FACTOR,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            // Cada acto es un alto: al soltar, el carrusel se acomoda en el
            // panel más cercano en vez de quedarse a medio camino.
            snap: {
              snapTo: 1 / (panels.length - 1),
              duration: { min: 0.2, max: 0.5 },
              delay: 0.04,
              ease: "power2.inOut",
            },
            onUpdate: (self) => {
              const index = Math.round(self.progress * (panels.length - 1));
              setActiveIndex((current) => (current === index ? current : index));
            },
          },
        });

        return () => {
          delete section.dataset.mode;
        };
      });
    }, containerRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  /** Cifras destacadas del primer panel. Vacías hasta que haya producto. */
  const features: Array<{ k: string; v: string }> = [];

  return (
    <section ref={containerRef} className="hdc-split-screen" id="narrativa">
      {/* Capa del producto · abajo en móvil, columna pegajosa en escritorio */}
      <div className="hdc-split-sticky">
        <div className={`hdc-sticky-object${activeIndex === 0 ? " is-active" : ""}`}>
          {SHOTS.game.map((shot, i) => (
            <Image
              key={shot.src}
              src={shot.src}
              alt={shot.alt}
              width={shot.w}
              height={shot.h}
              sizes="(max-width: 1023px) 92vw, 44vw"
              priority={i === 0}
              className={`transition-opacity duration-1000 ${gameImageIndex === i ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
        <div className={`hdc-sticky-object${activeIndex === 1 ? " is-active" : ""}`}>
          {SHOTS.merch.map((shot, i) => (
            <Image
              key={shot.src}
              src={shot.src}
              alt={shot.alt}
              width={shot.w}
              height={shot.h}
              sizes="(max-width: 1023px) 92vw, 44vw"
              className={`transition-opacity duration-1000 ${merchImageIndex === i ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
        {/* Tercer panel: hueco del reproductor incrustado. Sin `embed` no se
            pide nada a terceros, que es lo que espera la CSP publicada. */}
        <div className={`hdc-sticky-object${activeIndex === 2 ? " is-active" : ""}`} />
      </div>

      {/* Capa de las tarjetas · GSAP la desplaza en X cuando está anclada */}
      <div className="hdc-split-scroll" ref={trackRef}>
        
        {/* Act 1 */}
        <div className="hdc-narrative-section" id="juego">
          <p className="hdc-narrative-index">
            <span>01</span>
          </p>
          <h2 className="hdc-narrative-title" />
          <p className="hdc-narrative-copy" />
          <ul className="hdc-narrative-facts">
            {features.map((f) => (
              <li key={f.v}>
                <strong>{f.k}</strong>
                <span>{f.v}</span>
              </li>
            ))}
          </ul>
          <div className="hdc-narrative-actions">
            <span className="hdc-narrative-price">{PRICES.game}</span>
            <WhatsAppCTA />
          </div>
        </div>

        {/* Act 2 */}
        <div className="hdc-narrative-section" id="merch">
          <p className="hdc-narrative-index">
            <span>02</span>
          </p>
          <h2 className="hdc-narrative-title" />
          <p className="hdc-narrative-copy" />
          <div className="hdc-narrative-actions">
            <span className="hdc-narrative-price">{PRICES.tee}</span>
            <WhatsAppCTA />
          </div>
        </div>

        {/* Act 3 */}
        <div className="hdc-narrative-section" id="podcast">
          <p className="hdc-narrative-index">
            <span>03</span>
          </p>
          <h2 className="hdc-narrative-title" />
          <p className="hdc-narrative-copy" />
          <div className="hdc-narrative-actions">
            <a
              className="hdc-btn hdc-btn--ghost"
              href={linkTo(CONTACT.youtube)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <IconYouTube className="hdc-btn-ico text-red-500" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bento Grid Section (Comunidad, Nosotros, Contacto)
// ─────────────────────────────────────────────────────────────────────────────

function BentoGrid() {
  const bentoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hdc-bento-cell",
        { opacity: 0, scale: 0.9, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: bentoRef.current,
            start: "top 85%",
          },
        }
      );
    }, bentoRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="hdc-bento" ref={bentoRef}>
      
      {/* Celda Historia / Nosotros (Grande) · el texto se desplaza solo en
          bucle; con los párrafos vacíos la celda queda en blanco y el bucle,
          sin altura que recorrer, se queda quieto por su cuenta. */}
      <div className="hdc-bento-cell hdc-bento-cell--large hdc-bento-cell--flush" id="nosotros">
        <AutoScrollCredits>
          <div className="hdc-credits-wrapper">
            <h4 className="hdc-credits-section-title" />
            <p className="hdc-credits-text" />
          </div>
        </AutoScrollCredits>
      </div>

      {/* Celda Podcast Animada (Vinyl) */}
      <a
        href={linkTo(CONTACT.spotify)}
        target="_blank"
        rel="noopener noreferrer"
        className="hdc-bento-cell hdc-bento-cell--half hdc-podcast-cell"
        aria-label="Spotify"
      >
        <div className="hdc-vinyl">
           <div className="hdc-vinyl-label" />
        </div>
        <div className="hdc-bento-content">
          <h3 className="hdc-bento-title" />
          <p className="hdc-bento-copy" />
          <IconArrowUpRight className="hdc-bento-arrow" />
        </div>
      </a>

      {/* Celda Instagram · sin vídeo de fondo: la celda queda con su degradado. */}
      <a
        href={linkTo(CONTACT.instagram)}
        target="_blank"
        rel="noopener noreferrer"
        className="hdc-bento-cell hdc-bento-cell--half hdc-bento-cell--centered hdc-bento-cell--video"
        aria-label="Instagram"
      >
        <div className="hdc-video-overlay"></div>
        <div className="hdc-bento-content">
          <div className="hdc-bento-icon-circle hdc-bento-icon-circle--ig">
            <IconInstagram className="hdc-bento-icon-lg" />
          </div>
          <h3 className="hdc-bento-title hdc-bento-title--sm" />
        </div>
      </a>

      {/* Celda Comunidad (Ancha) · el fondo era el propio vídeo enlazado,
          incrustado desde YouTube en bucle mudo. Sin vídeo no se incrusta nada
          y la celda se queda con su degradado. */}
      <a
        href={linkTo(CONTACT.youtube)}
        target="_blank"
        rel="noopener noreferrer"
        className="hdc-bento-cell hdc-bento-cell--wide hdc-bento-cell--video"
        id="comunidad"
        aria-label="YouTube"
      >
        <div className="hdc-video-overlay"></div>
        <div className="hdc-bento-content">
          <p className="hdc-narrative-index"><span>—</span></p>
          <h2 className="hdc-bento-title hdc-bento-title--wide" />
          <p className="hdc-bento-copy">{PRICES.membership}</p>
          <div className="hdc-bento-cta hdc-bento-cta--yt">
            <IconYouTube className="hdc-btn-ico" />
          </div>
        </div>
      </a>

    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Content Export
// ─────────────────────────────────────────────────────────────────────────────

export function MainContent() {
  return (
    <>
      <SplitScreenNarrative />
      <BentoGrid />
    </>
  );
}
