"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CONTACT, PRICES, SHOTS } from "../../data/content";
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

function WhatsAppCTA({ children }: { children: React.ReactNode }) {
  return (
    <a
      className="hdc-btn hdc-btn--solid"
      href={CONTACT.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeIndex === 0) {
      interval = setInterval(() => {
        setGameImageIndex((prev) => (prev + 1) % SHOTS.game.length);
      }, 3500);
    } else if (activeIndex === 1) {
      interval = setInterval(() => {
        setMerchImageIndex((prev) => (prev + 1) % SHOTS.merch.length);
      }, 3500);
    }
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

  const features = [
    { k: "80", v: "cartas ilustradas" },
    { k: "2–6", v: "jugadores" },
    { k: "2", v: "caras por carta" },
    { k: "1", v: "línea del tiempo" },
  ];

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
        <div className={`hdc-sticky-object${activeIndex === 2 ? " is-active" : ""}`}>
          <iframe
            title="Podcast de Historia de Costa Rica en Spotify"
            src="https://open.spotify.com/embed/show/05hbZPyY9UKe6JemLiUutL?theme=0"
            width="100%"
            height="352"
            allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="rounded-[24px] border-0"
          />
        </div>
      </div>

      {/* Capa de las tarjetas · GSAP la desplaza en X cuando está anclada */}
      <div className="hdc-split-scroll" ref={trackRef}>
        
        {/* Act 1: El Juego */}
        <div className="hdc-narrative-section" id="juego">
          <p className="hdc-narrative-index">
            <span>01</span>El producto estrella
          </p>
          <h2 className="hdc-narrative-title">El Juego de Mesa</h2>
          <p className="hdc-narrative-copy">
            80 cartas ilustradas a doble cara con las que 2 a 6 jugadores reconstruyen
            la cronología de Costa Rica. Se juega, se aprende y se conversa: historia
            que pasa de mano en mano.
          </p>
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
            <WhatsAppCTA>Pedir el juego</WhatsAppCTA>
          </div>
        </div>

        {/* Act 2: Merch */}
        <div className="hdc-narrative-section" id="merch">
          <p className="hdc-narrative-index">
            <span>02</span>Llévalo puesto
          </p>
          <h2 className="hdc-narrative-title">Merch con Historia</h2>
          <p className="hdc-narrative-copy">
            Camisetas y accesorios de temática histórica para mostrar de qué estamos
            hechos. Ediciones pensadas para quienes viven la historia de Costa Rica.
          </p>
          <div className="hdc-narrative-actions">
            <span className="hdc-narrative-price">Desde {PRICES.tee}</span>
            <WhatsAppCTA>Consultar merch</WhatsAppCTA>
          </div>
        </div>

        {/* Act 3: Podcast */}
        <div className="hdc-narrative-section" id="podcast">
          <p className="hdc-narrative-index">
            <span>03</span>Escucha
          </p>
          <h2 className="hdc-narrative-title">El Podcast</h2>
          <p className="hdc-narrative-copy">
            Conversaciones sobre la historia y la cultura de Costa Rica, disponibles
            en Spotify y YouTube. Dale play mientras armas tu línea del tiempo.
          </p>
          <div className="hdc-narrative-actions">
            <a
              className="hdc-btn hdc-btn--ghost"
              href={CONTACT.youtube}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconYouTube className="hdc-btn-ico text-red-500" /> Ver en YouTube
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
      
      {/* Celda Historia / Nosotros (Grande) */}
      <div className="hdc-bento-cell hdc-bento-cell--large hdc-bento-cell--flush" id="nosotros">
        <AutoScrollCredits>
          <div className="hdc-credits-wrapper">
            <h4 className="hdc-credits-section-title">— La Historia —</h4>
            <p className="hdc-credits-text">
              Historia de Costa Rica nace en el año 2019 de la mano de su fundador, Luis Martinez Solano, como una página de Instagram dedicada a la divulgación histórica de Costa Rica, de una forma resumida, visualmente atractiva y accesible para todo publico. Con el tiempo, el proyecto se consolidó como una fuente de consulta y un espacio de descubrimiento sobre el pasado del pais.
            </p>
            <p className="hdc-credits-text">
              A inicios del 2021 se incorpora al proyecto Gabriel Cerdas Monge, quien aporta una nueva visión, renueva la identidad visual del proyecto y fortalece la página en Instagram, el contenido se expande a nuevas plataformas como Facebook, TikTok y YouTube. También promueve la creación de «El Podcast de Historia de Costa Rica» en 2023 y del juego de mesa educativo «Historia de Costa Rica: El Juego de Mesa» en 2024.
            </p>
            <p className="hdc-credits-text">
              En el año 2024, el Ministerio de Cultura y Juventud otorga al proyecto una mención de honor en el Premio Nacional de Comunicación Cultural Joaquín Garcia Monge 2023.
            </p>
            <p className="hdc-credits-text">
              En 2025, reciben el Galardón Inés Sánchez de Revuelta a la Gestión en Medios de Comunicación con Fomento a la Educación y la Cultura, en la categoría de Comunicador Influencer.
            </p>

            <h4 className="hdc-credits-section-title" style={{ marginTop: "3rem" }}>— El Podcast —</h4>
            <p className="hdc-credits-text">
              El Podcast de Historia de Costa Rica es una propuesta fresca, educativa y profundamente necesaria para quienes desean conocer y comprender el pasado del pais sin necesidad de abrir un libro de texto. Creado como una extensión del proyecto Historia de Costa Rica, este podcast combina juventud con la experiencia de los invitados.
            </p>
            <p className="hdc-credits-text">
              Cada episodio aborda un tema histórico relevante; desde batallas, presidentes, reformas y personajes olvidados, con el objetivo de despertar la curiosidad, el pensamiento crítico y el amor por la historia nacional.
            </p>
            <p className="hdc-credits-text">
              A lo largo de sus episodios, el podcast logra lo que pocos espacios logran en Costa Rica: convertir la historia en una experiencia cercana, entretenida y profundamente conectada con el presente. Es ideal para estudiantes, docentes, apasionados por la historia o cualquier persona que quiera entender mejor el pais que habita.
            </p>

            <h4 className="hdc-credits-section-title" style={{ marginTop: "3rem" }}>— El Juego —</h4>
            <p className="hdc-credits-text">
              «Historia de Costa Rica: El Juego de Mesa» es una innovadora propuesta lúdica que transforma el estudio de la historia nacional en una experiencia accesible, competitiva y entretenida para todas las edades. Este juego invita a los participantes a construir una línea del tiempo utilizando eventos históricos reales.
            </p>
            <p className="hdc-credits-text">
              Con una mecánica simple pero desafiante, el juego reta a los jugadores a colocar correctamente las cartas cronológicamente, fomentando la memoria, la lógica y el aprendizaje histórico. Con 80 cartas ilustradas a doble cara, el juego no solo destaca por su contenido riguroso, sino también por su diseño visual atractivo y su capacidad para generar conversación y reflexión en cada partida.
            </p>
            <p className="hdc-credits-text">
              Pensado para 2 a 6 jugadores, es ideal tanto para espacios educativos como para encuentros familiares o con amigos. Su equilibrio entre diversión y contenido lo convierte en una herramienta pedagógica de alto valor y en un ejemplo de cómo los juegos pueden ser aliados poderosos en la divulgación cultural.
            </p>
          </div>
        </AutoScrollCredits>
      </div>

      {/* Celda Podcast Animada (Vinyl) */}
      <a 
        href={CONTACT.spotify}
        target="_blank"
        rel="noopener noreferrer" 
        className="hdc-bento-cell hdc-bento-cell--half hdc-podcast-cell"
      >
        <div className="hdc-vinyl">
           <div className="hdc-vinyl-label" />
        </div>
        <div className="hdc-bento-content">
          <h3 className="hdc-bento-title">En Spotify</h3>
          <p className="hdc-bento-copy">Nuevos episodios cada semana.</p>
          <IconArrowUpRight className="hdc-bento-arrow" />
        </div>
      </a>

      {/* Celda Instagram */}
      <a
        href="https://www.instagram.com/reel/DB2iBxiRGZo/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA=="
        target="_blank"
        rel="noopener noreferrer"
        className="hdc-bento-cell hdc-bento-cell--half hdc-bento-cell--centered hdc-bento-cell--video"
      >
        <video 
          className="hdc-video-bg" 
          autoPlay 
          loop 
          muted 
          playsInline 
          poster="/images/ig-thumb.jpg"
        >
          <source src="/videos/ig-bg.mp4" type="video/mp4" />
        </video>
        <div className="hdc-video-overlay"></div>
        <div className="hdc-bento-content">
          <div className="hdc-bento-icon-circle hdc-bento-icon-circle--ig">
            <IconInstagram className="hdc-bento-icon-lg" />
          </div>
          <h3 className="hdc-bento-title hdc-bento-title--sm">Síguenos en<br />Instagram</h3>
        </div>
      </a>

      {/* Celda Comunidad (Ancha) */}
      <a 
        href="https://www.youtube.com/watch?v=L3ERIhTY-Ro&list=PLV4OPsIUVZaAmjaYn-kTANdr93WbyIdXT&index=5"
        target="_blank"
        rel="noopener noreferrer"
        className="hdc-bento-cell hdc-bento-cell--wide hdc-bento-cell--video"
        id="comunidad"
      >
        {/* El fondo es el propio vídeo enlazado, servido desde YouTube en bucle
            mudo: no hay copia local del archivo. `pointer-events: none` en el
            envoltorio mantiene el clic de la celda hacia YouTube, y el iframe
            manda solo el origen como referente porque el documento va con
            `no-referrer` y YouTube responde «error 153» si no recibe ninguno. */}
        <span className="hdc-video-bg hdc-video-embed" aria-hidden="true">
          <iframe
            src="https://www.youtube-nocookie.com/embed/L3ERIhTY-Ro?autoplay=1&mute=1&loop=1&playlist=L3ERIhTY-Ro&start=3&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&iv_load_policy=3&cc_load_policy=0"
            title="Vídeo de la comunidad de Historia de Costa Rica"
            allow="autoplay; encrypted-media"
            referrerPolicy="origin"
            loading="lazy"
            tabIndex={-1}
          />
        </span>
        <div className="hdc-video-overlay"></div>
        <div className="hdc-bento-content">
          <p className="hdc-narrative-index"><span>—</span>Únete</p>
          <h2 className="hdc-bento-title hdc-bento-title--wide">Sé parte de la comunidad</h2>
          <p className="hdc-bento-copy">
            Apoya el proyecto y accede a contenido y beneficios con las membresías de YouTube, {PRICES.membership}. Tu aporte mantiene viva la divulgación.
          </p>
          <div className="hdc-bento-cta hdc-bento-cta--yt">
            <IconYouTube className="hdc-btn-ico" /> Ver Video
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
