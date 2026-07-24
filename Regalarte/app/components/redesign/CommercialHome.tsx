import type { CSSProperties } from "react";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { catalogProducts } from "../../data/catalog";
import { aboutPage, homePage, laSelePage } from "../../data/content";
import type { RgxCommercialHomeProps } from "./types";
import { AnimatedMetric } from "./AnimatedMetric";
import { BouncingSouvenirs } from "./BouncingSouvenirs";
import { ProductDeck } from "./ProductDeck";

import { localAsset } from "../../utils/assetPath";
import { useLanguage } from "../LanguageContext";

const DEFAULT_FEATURED = [
  "mochila-perezoso",
  "peluche-perezoso-bonnie",
  "peluche-jaguar",
  "gorra-celeste-g73",
  "figura-perezoso-con-cria",
  "camiseta-tucan-gris",
] as const;

// Souvenirs que orbitan el cierre "Costa Rica con usted".
// Cada uno vive en su propia órbita (radio, velocidad y sentido distintos)
// para lograr un movimiento juguetón pero elegante.
const ORBIT_SOUVENIRS = [
  { src: "2025/10/Rana-peq-sentado.webp",     alt: "Peluche de rana",     d: 372, size: 118, dur: 34, dir: "normal",  delay: -27, bob: 5.4, bobDelay: -1.2 },
  { src: "2025/10/Perezoso-peq-sentado.webp", alt: "Peluche de perezoso", d: 470, size: 114, dur: 55, dir: "reverse", delay: -20, bob: 7.0, bobDelay: -3.5 },
  { src: "2025/10/Mono-peq-sentado.webp",     alt: "Peluche de mono",     d: 424, size: 100, dur: 46, dir: "normal",  delay: -8,  bob: 6.2, bobDelay: -0.6 },
  { src: "2025/10/Tucan-peq-sentado.webp",    alt: "Peluche de tucán",    d: 452, size: 108, dur: 60, dir: "reverse", delay: -45, bob: 5.0, bobDelay: -2.1 },
  { src: "2025/12/mini-taza.webp",            alt: "Taza Pura Vida",      d: 400, size: 84,  dur: 50, dir: "normal",  delay: -15, bob: 6.6, bobDelay: -4.0 },
] as const;

const CATEGORY_LINKS: Record<string, string> = {
  Gorras: "/product-category/gorras/",
  Textil: "/product-category/textiles/",
  Peluches: "/product-category/peluches/",
  Esferas: "/tienda/",
  Shots: "/tienda/",
  Souvenirs: "/tienda/",
};



export function ProductTile({
  product,
  onAddProduct,
}: {
  product: (typeof catalogProducts)[number];
  onAddProduct?: (slug: string) => void;
}) {
  const { t } = useLanguage();
  const productHref = `/product/${product.slug}/`;
  return (
    <article className="rgx-product-card">
      <Link className="rgx-product-media" href={productHref}>
        <img src={localAsset(product.imageUrl)} alt={product.name} loading="lazy" />
        <span className="rgx-product-view">{t("Ver producto", "View product")} <i aria-hidden="true">&#x2197;&#xFE0E;</i></span>
      </Link>
      <div className="rgx-product-info">
        <div>
          <p>{product.categories?.[0] ?? "Souvenir"}</p>
          <h3><Link href={productHref}>{product.name}</Link></h3>
        </div>
        {product.price && <strong>{product.price}</strong>}
      </div>
      {onAddProduct && product.type === "simple" && (
        <button className="rgx-quick-add" type="button" onClick={() => onAddProduct(product.slug)}>
          {t("Añadir al carrito", "Add to cart")} <span aria-hidden="true">＋</span>
        </button>
      )}
    </article>
  );
}

function PadlockCarousel({ products }: { products: typeof laSelePage.products }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const cards = cardRefs.current.filter(Boolean) as HTMLAnchorElement[];
    const count = cards.length;
    if (!viewport || count === 0) return;

    // Geometry of the endless cylinder.
    const RADIUS = 300;          // depth of the wheel (px)
    const ANGLE = 25;            // degrees between adjacent cards
    const DEG2RAD = Math.PI / 180;

    let pos = 0;                 // current center index (float, rendered)
    let target = 0;              // where the wheel wants to settle
    let raf = 0;
    let dwell = 0;               // ms accumulated while resting at a card
    let last = performance.now();
    let interacting = false;     // pointer down / recent wheel
    let hovering = false;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DWELL_MS = 2600;       // pause at each centered card before advancing

    // Wrap a signed distance into [-count/2, count/2) so the wheel is seamless.
    const wrap = (d: number) => {
      const h = count / 2;
      return ((((d + h) % count) + count) % count) - h;
    };

    const render = () => {
      for (let i = 0; i < count; i++) {
        const card = cards[i];
        const d = wrap(i - pos);
        const abs = Math.abs(d);
        const theta = d * ANGLE * DEG2RAD;
        const ty = Math.sin(theta) * RADIUS;
        const tz = (Math.cos(theta) - 1) * RADIUS;
        const rot = -d * ANGLE * 0.55;
        const scale = Math.max(0.62, 1 - abs * 0.12);
        // Focus: 1 exactly at center, quickly falling off for the neighbours.
        const focus = Math.max(0, 1 - abs);
        // Keep near cards visible (glass shows through) but let the far
        // back of the wheel fade for depth and legibility of the front card.
        const opacity = Math.max(0.05, Math.min(1, 1.08 - abs * 0.34));
        const blur = Math.min(6, abs * 2.1);

        card.style.transform =
          `translateX(-50%) translateY(calc(-50% + ${ty.toFixed(2)}px)) ` +
          `translateZ(${tz.toFixed(2)}px) rotateX(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.zIndex = String(Math.round(1000 - abs * 100));
        card.style.setProperty("--focus", focus.toFixed(3));
        card.style.setProperty("--blur", `${blur.toFixed(2)}px`);
        card.style.pointerEvents = abs < 0.5 ? "auto" : "none";
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;

      // Auto-advance: dwell on the centered card, then glide to the next.
      const settled = Math.abs(target - pos) < 0.002;
      if (!reduceMotion && !interacting && !hovering) {
        if (settled) {
          dwell += dt;
          if (dwell >= DWELL_MS) {
            target += 1;
            dwell = 0;
          }
        } else {
          dwell = 0;
        }
      } else {
        dwell = 0;
      }

      // Critically-damped-ish spring toward the target.
      pos += (target - pos) * (1 - Math.pow(0.001, dt / 1000));

      if (settled) {
        // Normalise so the floats never drift far from zero.
        const k = Math.round(pos);
        if (Math.abs(k) >= count) {
          pos -= k - (k % count);
          target -= k - (k % count);
        }
      }

      render();
      raf = requestAnimationFrame(frame);
    };

    // ---- Wheel: scrub the cylinder, then snap to the nearest card. ----
    let wheelTimer = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      interacting = true;
      target += e.deltaY * 0.006;
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        target = Math.round(target);
        interacting = false;
      }, 140);
    };

    // ---- Drag / swipe ----
    let dragging = false;
    let startY = 0;
    let startPos = 0;
    let pointerId = -1;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      interacting = true;
      startY = e.clientY;
      startPos = target;
      pointerId = e.pointerId;
      viewport.setPointerCapture(pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dy = e.clientY - startY;
      target = startPos - dy / 88; // ~88px per card
    };
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      target = Math.round(target);
      interacting = false;
      if (pointerId !== -1 && viewport.hasPointerCapture(pointerId)) {
        viewport.releasePointerCapture(pointerId);
      }
      pointerId = -1;
    };

    const onEnter = () => { hovering = true; };
    const onLeave = () => { hovering = false; };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("mouseenter", onEnter);
    viewport.addEventListener("mouseleave", onLeave);

    render();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(wheelTimer);
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", endDrag);
      viewport.removeEventListener("pointercancel", endDrag);
      viewport.removeEventListener("mouseenter", onEnter);
      viewport.removeEventListener("mouseleave", onLeave);
    };
  }, [products.length]);

  return (
    <div className="rgx-sele-products-cell" ref={viewportRef}>
      <div className="rgx-sele-products-track">
        {products.map((product, index) => (
          <Link
            className="rgx-sele-premium-card"
            href={`/product/${product.href.split("/").filter(Boolean).at(-1)}/`}
            key={product.id}
            ref={(el) => { cardRefs.current[index] = el; }}
            draggable={false}
          >
            <div className="rgx-sele-card-img-wrap">
              <img src={localAsset(product.image.src)} alt={product.name} loading="lazy" draggable={false} />
            </div>
            <div className="rgx-sele-card-info">
              <span>{product.name}</span>
              <strong>{product.price}</strong>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CommercialHome({
  onAddProduct,
  featuredProductSlugs = DEFAULT_FEATURED,
  className = "",
}: RgxCommercialHomeProps) {
  const { t } = useLanguage();
  const featured = featuredProductSlugs
    .map((slug) => catalogProducts.find((product) => product.slug === slug))
    .filter((product): product is (typeof catalogProducts)[number] => Boolean(product));
  const visibleFeatured = featured.length >= 4 ? featured : catalogProducts.slice(0, 6);
  const storyImage = localAsset(aboutPage.assets[0]?.src ?? null);
  
  const bouncingImages = [
    localAsset(catalogProducts.find(p => p.slug === "mochila-perezoso")?.imageUrl ?? ""),
    localAsset(catalogProducts.find(p => p.slug === "peluche-perezoso-bonnie")?.imageUrl ?? ""),
    localAsset(catalogProducts.find(p => p.slug === "esponja-de-bano-perezoso")?.imageUrl ?? ""),
    localAsset(catalogProducts.find(p => p.slug === "perezoso-huevo-peq")?.imageUrl ?? ""),
    localAsset(catalogProducts.find(p => p.slug === "cuellera-c-perezoso")?.imageUrl ?? ""),
    localAsset(catalogProducts.find(p => p.slug === "cuellera-perezoso")?.imageUrl ?? ""),
  ].filter(Boolean);

  const seleHeroImg = localAsset(catalogProducts.find(p => p.slug === "sudadera-la-sele-azul")?.imageUrl ?? laSelePage.hero.src);

  return (
    <div className={`rgx-commerce ${className}`.trim()}>
      <section className="rgx-intro rgx-shell" aria-labelledby="rgx-intro-title">
        <p className="rgx-section-index">01 · {t("Categorías", "Categories")}</p>
        <div className="rgx-intro-grid">
          <h2 id="rgx-intro-title">{t("Una selección exclusiva", "An exclusive selection")}<br />{t("de souvenirs.", "of souvenirs.")}</h2>
          <div className="rgx-intro-copy">
            <p>{t("Contamos con una amplia variedad de productos para llevar la esencia de Costa Rica a cualquier lugar del mundo.", "We offer a wide variety of products to carry the essence of Costa Rica anywhere in the world.")}</p>
            <Link className="rgx-text-link" href="/tienda/">{t("Explorar toda la tienda", "Explore entire shop")} <span aria-hidden="true">&#x2197;&#xFE0E;</span></Link>
          </div>
        </div>
        <div className="rgx-category-strip">
          {homePage.categories.map((category, index) => (
            <Link className="rgx-category-card" href={CATEGORY_LINKS[category.title] ?? "/tienda/"} key={category.title}>
              <img src={localAsset(category.image.src)} alt="" loading={index > 2 ? "lazy" : "eager"} />
              <span className="rgx-category-number">0{index + 1}</span>
              <h3>{category.title}</h3>
              <span className="rgx-category-arrow" aria-hidden="true">&#x2197;&#xFE0E;</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rgx-featured rgx-shell" aria-labelledby="rgx-featured-title">
        <ProductDeck
          products={visibleFeatured.slice(0, 6)}
          onAddProduct={onAddProduct}
          eyebrow={t("02 · Productos Destacados", "02 · Featured Products")}
          title={t("Los souvenirs más buscados.", "The most popular souvenirs.")}
          titleId="rgx-featured-title"
          viewAllHref="/tienda/"
          viewAllLabel={t("Ver todos", "View all")}
        />
      </section>

      <section className="rgx-wholesale rgx-shell" aria-labelledby="rgx-wholesale-title">
        <div className="rgx-wholesale-bento">
          <div className="rgx-wholesale-glass-card">
            <p className="rgx-section-index">03 · Promociones</p>
            <p className="rgx-wholesale-meta">Descuentos exclusivos</p>
            <h2 id="rgx-wholesale-title">Precios especiales<br />al por mayor.</h2>
            <p>Adquiera nuestra selección premium a tarifas preferenciales. Beneficios únicos para aliados comerciales.</p>
            <div className="rgx-wholesale-actions">
              <Link className="rgx-button rgx-button-sun" href="/inscripcion-mayoreo/">Comprar al por mayor <span aria-hidden="true">&#x2197;&#xFE0E;</span></Link>
              <Link className="rgx-text-link rgx-text-link-light" href="/catalogos-mayoreo/">Ver catálogos</Link>
            </div>
          </div>
          <div className="rgx-wholesale-art" aria-hidden="true">
             <div className="rgx-glass-overlay" />
             <BouncingSouvenirs images={bouncingImages} />
          </div>
        </div>
      </section>

      <section className="rgx-sele rgx-shell" aria-labelledby="rgx-sele-title">
        <div className="rgx-sele-bento">
          <div className="rgx-sele-hero-cell">
            <span className="rgx-sele-stamp">Producto oficial exclusivo</span>
            <div className="rgx-sele-bg-wrapper">
              <img className="rgx-sele-bg-img" src={seleHeroImg} alt="" loading="lazy" />
            </div>
            <div className="rgx-sele-hero-content">
              <h2 id="rgx-sele-title">La Sele.</h2>
              <p>Viva cada partido con la colección oficial.</p>
              <Link className="rgx-button rgx-button-glass-dark" href="/la-sele/">Conocer la colección <span aria-hidden="true">&#x2197;&#xFE0E;</span></Link>
            </div>
          </div>
          <PadlockCarousel products={laSelePage.products} />
        </div>
      </section>

      <section className="rgx-story-bento-grid rgx-shell" aria-labelledby="rgx-story-title">
        <div className="rgx-story-intro-cell">
          <p className="rgx-section-index">05 · Nosotros</p>
          <h2 id="rgx-story-title">Líderes en souvenirs<br />en Costa Rica.</h2>
          <p>{aboutPage.introduction}</p>
          <Link className="rgx-magic-button" href="/nosotros/"><span>Nuestra historia</span> <i aria-hidden="true">&#x2197;&#xFE0E;</i></Link>
        </div>
        <div className="rgx-story-img-cell">
           <img src={storyImage} alt="Equipo de Regalarte" loading="lazy" />
        </div>
        <div className="rgx-metrics-bento">
          {homePage.metrics.map((metric) => (
            <div className="rgx-metric-cell" key={metric.label}>
              <div className="rgx-metric-glow" />
              <dd className="rgx-metric-value">
                <AnimatedMetric 
                  value={metric.value} 
                  prefix={metric.prefix} 
                  suffix={metric.suffix} 
                />
              </dd>
              <dt className="rgx-metric-label">{metric.label.replace("\n", " ")}</dt>
            </div>
          ))}
        </div>
      </section>

      <section className="rgx-closing-premium rgx-shell" aria-labelledby="rgx-closing-title">
        <div className="rgx-closing-blackhole">
          <div className="rgx-accretion-disk" aria-hidden="true"><span /><span /></div>
          <div className="rgx-event-horizon" />
          <div className="rgx-souvenir-field" aria-hidden="true">
            {ORBIT_SOUVENIRS.map((s) => (
              <div
                className="rgx-orbit"
                key={s.alt}
                style={{
                  "--d": `${s.d}px`,
                  "--size": `${s.size}px`,
                  "--dur": `${s.dur}s`,
                  "--dir": s.dir,
                  "--delay": `${s.delay}s`,
                } as CSSProperties}
              >
                <div className="rgx-souvenir">
                  <img
                    src={localAsset(s.src)}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    style={{ "--bob": `${s.bob}s`, "--bob-delay": `${s.bobDelay}s` } as CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="rgx-closing-content">
            <p className="rgx-section-index rgx-gold-text">Contáctenos</p>
            <h2 id="rgx-closing-title">¿Listo para llevar<br />Costa Rica con usted?</h2>
            <div className="rgx-hero-actions">
              <Link className="rgx-button rgx-button-sun" href="/tienda/">Entrar a la tienda <span aria-hidden="true">&#x2197;&#xFE0E;</span></Link>
              <Link className="rgx-button rgx-button-glass-outline" href="/contacto/">Hablar con nosotros</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
