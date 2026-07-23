"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import type { catalogProducts } from "../../data/catalog";
import { ProductTile } from "./CommercialHome";
import { setDockAnimationActive } from "../../utils/dockVisibility";

type Product = (typeof catalogProducts)[number];

/**
 * Bloque "Productos destacados". El encabezado (índice, título y "Ver todos")
 * vive AL LADO de la baraja de tarjetas: en escritorio comparten un grid de dos
 * columnas que se fija (pin) mientras las tarjetas se despliegan al hacer scroll.
 *
 * La animación de la baraja se limita, vía `gsap.matchMedia`, a escritorio con
 * movimiento permitido. En móvil/tablet o con `prefers-reduced-motion` no hay
 * pin: las tarjetas caen a un carrusel deslizable definido solo con CSS, de modo
 * que el layout y la animación nunca se contradicen.
 */
export function ProductDeck({
  products,
  onAddProduct,
  eyebrow = "02 · Productos Destacados",
  title = "Los souvenirs más buscados.",
  titleId,
  viewAllHref = "/tienda/",
  viewAllLabel = "Ver todos",
}: {
  products: Product[];
  onAddProduct?: (slug: string) => void;
  eyebrow?: string;
  title?: string;
  titleId?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let mm: ReturnType<typeof import("gsap").gsap.matchMedia> | undefined;
    let cancelled = false;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapModule, scrollModule]) => {
        if (cancelled || !containerRef.current) return;
        const gsap = gsapModule.gsap;
        const ScrollTrigger = scrollModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        mm = gsap.matchMedia();
        // Misma baraja fijada en todos los anchos (incluido móvil); el CSS dibuja la
        // pila en la base y solo el respaldo reduced-motion cae a carrusel sin pin.
        mm.add("(prefers-reduced-motion: no-preference)", () => {
          const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
          if (cards.length < 2) return;
          const flyers = cards.slice(0, -1); // la última queda centrada.

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: `+=${cards.length * 75}%`,
              pin: true,
              scrub: 0.5,
              invalidateOnRefresh: true,
              // En móvil el dock se esconde mientras la baraja está fijada y
              // desplegándose; reaparece justo al terminar la animación.
              onToggle: (self) => setDockAnimationActive("deck", self.isActive),
            },
          });
          timeline.to(flyers, {
            xPercent: (i: number) => (i % 2 === 0 ? -190 : 190),
            yPercent: -14,
            rotation: (i: number) => (i % 2 === 0 ? -20 : 20),
            opacity: 0,
            scale: 0.82,
            stagger: 0.85,
            ease: "power2.inOut",
          });

          // matchMedia revierte estilos inline al salir del media query.
          return () => {
            setDockAnimationActive("deck", false);
            timeline.kill();
          };
        });
      },
    );

    return () => {
      cancelled = true;
      mm?.revert();
    };
  }, [products.length]);

  return (
    <div className="rgx-deck" ref={containerRef}>
      <div className="rgx-deck-copy">
        <p className="rgx-section-index">{eyebrow}</p>
        <h2 id={titleId} className="rgx-deck-title">{title}</h2>
        <Link className="rgx-deck-viewall" href={viewAllHref}>
          <span>{viewAllLabel}</span>
          <i aria-hidden="true">↗</i>
        </Link>
      </div>

      <div className="rgx-deck-stage">
        {products.map((product, i) => {
          // La última tarjeta es la que sobrevive: queda centrada y recta.
          const isLast = i === products.length - 1;
          return (
            <div
              key={product.slug}
              className="rgx-deck-card"
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              style={
                {
                  zIndex: products.length - i,
                  // Abanico sutil: poca rotación/desplazamiento para que las cartas de
                  // atrás no sobresalgan hacia el dock/bordes en pantallas cortas.
                  "--rot": isLast ? "0deg" : `${i % 2 === 0 ? i * 1.4 : -i * 1.4}deg`,
                  "--ty": isLast ? "0px" : `${i * 4}px`,
                } as CSSProperties
              }
            >
              <ProductTile product={product} onAddProduct={onAddProduct} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
