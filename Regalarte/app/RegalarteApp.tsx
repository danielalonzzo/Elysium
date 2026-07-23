"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  IconArrowUpRight,
  IconBag,
  IconFacebook,
  IconInstagram,
  IconLeaf,
  IconMail,
  IconMapPin,
  IconMoon,
  IconPhone,
  IconSearch,
  IconSun,
  IconWhatsApp,
} from "./components/Icons";
import { CinematicVisual } from "./components/redesign/CinematicVisual";
import { AboutPremium } from "./components/redesign/AboutPremium";
import { AboutCinematicVisual } from "./components/redesign/AboutCinematicVisual";
import { AboutContent } from "./components/redesign/AboutContent";
import { RedesignHome } from "./components/redesign/RedesignHome";
import { DevelopmentCurtain } from "./components/redesign/DevelopmentCurtain";
import { ShopRedesign } from "./components/redesign/ShopRedesign";
import { LanguageProvider, useLanguage } from "./components/LanguageContext";
import { isAnyDockAnimationActive, subscribeDockAnimations } from "./utils/dockVisibility";
import { catalogProducts as sourceProducts } from "./data/catalog";
import {
  aboutPage,
  blogArticles,
  blogIndexPage,
  contactPage,
  employmentPage,
  exphorePage,
  internationalShippingPage,
  laSelePage,
  requestCatalogPage,
  retailCatalogPage,
  samplePage,
  wholesaleCatalogPage,
  wholesaleRegistrationPage,
  type FormDefinition,
} from "./data/content";

const ASSET = "/assets/uploads";
const LEAF_BG = `${ASSET}/2025/02/portada-oscura-copia.webp`;
const LOGO = `${ASSET}/2025/02/logo-horizontal.webp`;

/* Datos de contacto: un único punto de verdad. El sitio anterior repartía dos
   teléfonos distintos entre plantillas sin aclarar cuál era ventas y cuál
   oficina, y el icono de correo del pie apuntaba a `mailto:inforegalartecr.com`,
   sin arroba. Aquí se declaran una vez y se consumen desde cabecera, pie, dock
   y contacto. */
const WHATSAPP = "https://wa.link/elptvj";
const PHONE_SALES = "+506 8520-9833";
const PHONE_SALES_HREF = "tel:+50685209833";
const EMAIL = "info@regalartecr.com";
const ADDRESS = "Barrio Los Yoses Sur, 375 m sur de Ambacar, San Pedro, San José, Costa Rica";
const INSTAGRAM = "https://www.instagram.com/regalarte.sa/";
const FACEBOOK = "https://www.facebook.com/regalarte2014";

type Product = {
  slug: string;
  name: string;
  price: string | null;
  image: string;
  categories: string[];
  tags: string[];
  action: "add" | "options" | "read" | null;
  description?: string;
};

type CartLine = { product: Product; quantity: number };

const FALLBACK_IMAGES = [
  `${ASSET}/2025/02/peluches-1024x1024.webp`,
  `${ASSET}/2025/02/gorras-1024x1024.webp`,
  `${ASSET}/2025/02/textil-1024x1024.webp`,
  `${ASSET}/2025/02/imanes-1024x1024.webp`,
];

function normalizeProduct(raw: unknown, index: number): Product {
  const item = (raw || {}) as Record<string, unknown>;
  const rawImages = Array.isArray(item.images) ? item.images : [];
  const rawTags = Array.isArray(item.tags) ? item.tags.map(String) : [];
  const rawCategories = Array.isArray(item.categories) ? item.categories.map(String) : [];
  const name = String(item.name || item.title || `Producto Regalarte ${index + 1}`);
  const slug = String(item.slug || name.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, "-").replace(/^-|-$/g, ""));
  const kind = String(item.action || item.cta || item.type || "").toLowerCase();
  const action: Product["action"] = kind.includes("leer") || kind.includes("read")
    ? "read"
    : kind.includes("opcion") || kind.includes("variable") || kind.includes("select")
      ? "options"
      : kind.includes("simple") || kind.includes("add") ? "add" : null;
  return {
    slug,
    name,
    price: item.price || item.priceText || item.displayPrice ? String(item.price || item.priceText || item.displayPrice) : null,
    image: localizeAsset(String(item.image || item.imageUrl || item.featuredImage || rawImages[0] || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length])),
    categories: rawCategories.length
      ? rawCategories.map(slugify)
      : item.category || item.categorySlug ? [slugify(String(item.category || item.categorySlug))] : [],
    tags: rawTags,
    action,
    description: item.description ? String(item.description) : item.shortDescription ? String(item.shortDescription) : undefined,
  };
}

function localizeAsset(url: string) {
  const relative = url.replace("https://regalarte.cr/wp-content/uploads/", "").replace(/^\/assets\/uploads\//, "");
  const aliases: Record<string, string> = {
    "2025/02/nosotros-2-1024x1024.webp": "2025/02/nosotros-2-600x600.webp",
    "2025/02/Regalarte-ambiental-681x1024.webp": "2025/02/Regalarte-ambiental-scaled-600x902.webp",
    "2025/11/patroconador-bronce.png": "2025/11/patroconador-bronce-600x608.png",
    "2026/03/banner-la-sele-nuevo.webp": "2026/03/banner-la-sele-nuevo-600x156.webp",
    "2026/03/banner-la-sele-nuevo-1536x400.webp": "2026/03/banner-la-sele-nuevo-600x156.webp",
    "2025/04/tucanes-de-costa-rica-1024x403.webp": "2025/04/tucanes-de-costa-rica-scaled-600x236.webp",
    "2025/04/Guacamaya-roja-1024x403.webp": "2025/04/Guacamaya-roja-scaled-600x236.webp",
    "2025/02/peluches-web-100-700-px-h-1024x373.webp": "2025/02/peluches-web-100-700-px-h-600x219.webp",
    "2025/02/vista-para-enlaces-1-1024x538.png": "2025/02/vista-para-enlaces-1-600x315.png",
    "2025/04/perezoso-costa-rica-scaled.webp": "2025/04/perezoso-costa-rica-scaled-600x236.webp",
    "2025/04/Guacamaya-roja-scaled.webp": "2025/04/Guacamaya-roja-scaled-600x236.webp",
    "2025/04/tucanes-de-costa-rica-scaled.webp": "2025/04/tucanes-de-costa-rica-scaled-600x236.webp",
    "2025/02/peluches-web-100-700-px-h.webp": "2025/02/peluches-web-100-700-px-h-600x219.webp",
    "2025/04/perezoso-de-3-dedos.webp": "2025/04/perezoso-de-3-dedos-600x192.webp",
    "2025/04/Perezoso-de-2-dedos.webp": "2025/04/Perezoso-de-2-dedos-600x192.webp",
    "2025/04/guacamaya-roja-2.webp": "2025/04/guacamaya-roja-2-600x192.webp",
    "2025/04/Guacamaya-alas.webp": "2025/04/Guacamaya-alas-600x192.webp",
    "2025/04/tucan-pico-iris.webp": "2025/04/tucan-pico-iris-600x192.webp",
    "2025/04/aracari-Pteroglossus-frantzii.webp": "2025/04/aracari-Pteroglossus-frantzii-600x192.webp",
    "2025/04/Pteroglossus-torquatus.webp": "2025/04/Pteroglossus-torquatus-600x192.webp",
    "2025/04/tucancillo-orejiamarillo.webp": "2025/04/tucancillo-orejiamarillo-600x192.webp",
    "2025/04/Aulacorhynchus-prasinus.webp": "2025/04/Aulacorhynchus-prasinus-600x192.webp",
    "2025/09/perezoso-regalarte.webp": "2026/05/Peluche-perezoso-acostado.webp",
  };
  return `${ASSET}/${aliases[relative] || relative}`;
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function cleanExternalHref(value: string) {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return value;
  }
}

function correctedCopy(value: string) {
  return value.replaceAll("Tucánes", "Tucanes").replaceAll("%100", "100 %");
}

const PRODUCTS: Product[] = (sourceProducts as readonly unknown[]).map(normalizeProduct);

const NAV = [
  ["Tienda", "/tienda/"],
  ["Mayoreo", "/mayoreo/"],
  ["La Sele", "/la-sele/"],
  ["Nuestra historia", "/nosotros/"],
  ["Blog", "/blog/"],
  ["Contacto", "/contacto/"],
];

const CATEGORIES = [
  ["cuellera", "Cuellera"], ["esponja-bano", "Esponja baño"],
  ["figuras-ceramica", "Figuras cerámica"], ["gorras", "Gorras"],
  ["jacket", "Chaquetas"], ["jarras", "Jarras"], ["la-sele", "La Sele"],
  ["magnetico", "Magnético"], ["navidad", "Navidad"], ["peluches", "Peluches"],
  ["perezosos", "Perezosos"], ["pulsera-slap", "Pulsera slap"],
  ["reversible", "Reversible"], ["textiles", "Textiles"], ["titere", "Títere"],
];

const POSTS = blogIndexPage.cards.map((card) => {
  const slug = card.href.split("/").filter(Boolean).at(-1) || "";
  const article = blogArticles.find((item) => item.slug === slug);
  return {
    slug,
    title: correctedCopy(card.title),
    image: localizeAsset(card.image.src || ""),
    excerpt: card.excerpt,
    date: article ? new Intl.DateTimeFormat("es-CR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(article.publishedAt)) : "",
  };
});

function money(value: number) {
  return `₡${Math.round(value).toLocaleString("es-CR")}`;
}

function numericPrice(value: string | null) {
  if (!value) return 0;
  const match = value.match(/[\d.,]+/);
  return match ? Number(match[0].replace(/[.,]/g, "")) || 0 : 0;
}

function Header({ path, dark, count, subtotal, onCart }: { path: string; dark: boolean; count: number; subtotal: number; onCart: () => void }) {
  const { t } = useLanguage();
  const sele = path.startsWith("/la-sele");
  const wholesalePath = ["/mayoreo/", "/solicitud-catalogo/", "/inscripcion-mayoreo/", "/catalogos-mayoreo/", "/envio-internacional/"].includes(path);
  const navItems = [
    [t("Tienda", "Shop"), "/tienda/"],
    [t("Mayoreo", "Wholesale"), "/mayoreo/"],
    [t("La Sele", "La Sele"), "/la-sele/"],
    [t("Nuestra historia", "Our Story"), "/nosotros/"],
    [t("Blog", "Blog"), "/blog/"],
    [t("Contacto", "Contact"), "/contacto/"],
  ];
  return (
    <header id="header" className={`navbar${sele ? " sele-nav" : ""} ${dark ? "header-on-dark" : "header-on-light"}`}>
      <div className="nav-pill">
        <Link className="brand" href="/" aria-label="Regalarte, inicio">
          <img src={LOGO} alt="Regalarte" width="215" height="77" />
        </Link>
        <nav className="nav-menu" id="navMenu" aria-label="Navegación principal">
          <ul>
            {navItems.map(([label, href]) => (
              <li key={href}>
                <Link className={(href === "/mayoreo/" ? wholesalePath : path.startsWith(href)) ? "active" : ""} href={href}>{label}</Link>
              </li>
            ))}
          </ul>
          {/* Duplicado sólo para el cajón móvil */}
          <div className="nav-drawer-foot">
            <Link href="/tienda/">{t("Buscar en la tienda", "Search in shop")}</Link>
            <a className="is-quiet" href={WHATSAPP} target="_blank" rel="noopener noreferrer">{t("Escribir por WhatsApp", "Message on WhatsApp")}</a>
          </div>
        </nav>
        <div className="nav-actions">
          <Link className="nav-icon" href="/tienda/" aria-label={t("Buscar productos", "Search products")}><IconSearch /></Link>
          <button className="cart-pill" type="button" onClick={onCart} aria-label={`${t("Abrir carrito", "Open cart")}, ${count} ${count === 1 ? t("artículo", "item") : t("artículos", "items")}`}>
            {count > 0 && <span className="cart-amount">{money(subtotal)}</span>}
            <b>{t("Carrito", "Cart")}</b>
            <span className="cart-glyph" aria-hidden="true"><IconBag /></span>
            {count > 0 && <em className="cart-count" aria-hidden="true">{count}</em>}
          </button>
          <button className="menu-toggle" type="button" aria-expanded="false" aria-controls="navMenu" aria-label="Abrir menú">
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}

function HomePage({ add }: { add: (product: Product, quantity?: number) => void }) {
  return (
    <RedesignHome
      renderVisual={({ progress, mode }) => mode === "cinematic" ? <CinematicVisual progress={progress} /> : null}
      onAddProduct={(slug) => {
        const product = PRODUCTS.find((item) => item.slug === slug);
        if (product) add(product);
      }}
    />
  );
}

function AboutPage() {
  return (
    <main className="rgx-main about-page-premium rgx-home">
      <AboutPremium 
        renderVisual={({ progress, mode }) => mode === "cinematic" ? <AboutCinematicVisual progress={progress} /> : null} 
      />
      <AboutContent content={aboutPage} />
    </main>
  );
}

function Filters({ selected, onChange, onClear, open }: { selected: string[]; onChange: (slug: string) => void; onClear: () => void; open: boolean }) {
  return (
    <aside className={`shop-filters${open ? " is-open" : ""}`} id="shop-filters" aria-label="Filtros de producto">
      <div className="filter-heading"><div><p>Explorar</p><h2>Categorías</h2></div>{selected.length > 0 && <button type="button" onClick={onClear}>Limpiar</button>}</div>
      <form onSubmit={(event) => event.preventDefault()}>
        {CATEGORIES.map(([slug, label]) => (
          <label key={slug}><input type="checkbox" checked={selected.includes(slug)} onChange={() => onChange(slug)} /><span>{label}</span></label>
        ))}
      </form>
    </aside>
  );
}

function ProductCard({ product, add }: { product: Product; add: (product: Product, quantity?: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  return (
    <article className="product-card reveal">
      <Link className="product-image" href={`/product/${product.slug}/`}><img src={product.image} alt={product.name} loading="lazy" /></Link>
      <div className="product-copy">
        <h2><Link href={`/product/${product.slug}/`}>{product.name}</Link></h2>
        {product.price && <p className="price">{product.price}</p>}
        {product.action === "add" ? (
          <div className="product-action"><input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} aria-label={`Cantidad de ${product.name}`} /><button type="button" onClick={() => add(product, quantity)}>Añadir al carrito</button></div>
        ) : product.action === "options" ? (
          <Link className="product-button" href={`/product/${product.slug}/`}>Seleccionar opciones</Link>
        ) : product.action === "read" ? (
          <Link className="product-button" href={`/product/${product.slug}/`}>Leer más</Link>
        ) : null}
      </div>
    </article>
  );
}

function ShopPage({ add, forcedCategory, forcedTag, initialPage = 1 }: { add: (product: Product, quantity?: number) => void; forcedCategory?: string; forcedTag?: string; initialPage?: number }) {
  const [selected, setSelected] = useState<string[]>(forcedCategory ? [forcedCategory] : []);
  const [page, setPage] = useState(initialPage >= 1 && initialPage <= 7 ? initialPage : 1);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtered = useMemo(() => {
    const needle = slugify(query.trim());
    const result = PRODUCTS.filter((product) => {
      const categoryMatch = !selected.length || selected.some((category) => product.categories.includes(category));
      const tagMatch = !forcedTag || product.tags.some((tag) => tag.toLowerCase().includes(forcedTag.toLowerCase())) || product.name.toLowerCase().includes(forcedTag.toLowerCase());
      const searchMatch = !needle || slugify([product.name, product.description, ...product.categories, ...product.tags].filter(Boolean).join(" ")).includes(needle);
      return categoryMatch && tagMatch && searchMatch;
    });
    return [...result].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "es");
      if (sort === "price-low") return (numericPrice(a.price) || Number.MAX_SAFE_INTEGER) - (numericPrice(b.price) || Number.MAX_SAFE_INTEGER);
      if (sort === "price-high") return numericPrice(b.price) - numericPrice(a.price);
      return 0;
    });
  }, [selected, forcedTag, query, sort]);
  const pageSizes = [16, 12, 12, 12, 16, 16, 4];
  const offset = pageSizes.slice(0, page - 1).reduce((sum, size) => sum + size, 0);
  const refined = Boolean(selected.length || forcedTag || query.trim());
  const visible = refined ? filtered : filtered.slice(offset, offset + pageSizes[page - 1]);
  const toggle = (slug: string) => {
    setPage(1);
    setSelected((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
  };
  const clearFilters = () => {
    setPage(1);
    setQuery("");
    setSelected(forcedCategory ? [forcedCategory] : []);
  };
  const archiveName = forcedCategory ? CATEGORIES.find(([slug]) => slug === forcedCategory)?.[1] : forcedTag ? forcedTag : null;
  return (
    <div className="shop-page leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}>
      <header className="archive-title"><p>{archiveName ? "Colección" : "Hecho para recordar"}</p><h1>{archiveName || "Tienda Regalarte"}</h1><span>{filtered.length} productos</span></header>
      <div className="shop-layout">
        <Filters selected={selected} onChange={toggle} onClear={clearFilters} open={filtersOpen} />
        <div className="shop-results">
          <div className="shop-toolbar">
            <button className="filter-toggle" type="button" aria-controls="shop-filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((current) => !current)}>Filtros {selected.length > 0 && <span>{selected.length}</span>}</button>
            <label className="shop-search"><span className="sr-only">Buscar productos</span><input type="search" value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} placeholder="Buscar recuerdos, fauna o textiles" /></label>
            <label className="shop-sort"><span className="sr-only">Ordenar productos</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Destacados</option><option value="name">Nombre A–Z</option><option value="price-low">Precio: menor a mayor</option><option value="price-high">Precio: mayor a menor</option></select></label>
          </div>
          <p className="results-summary" aria-live="polite">{filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}</p>
          <section className="product-grid" aria-label="Productos">
            {visible.length ? visible.map((product) => <ProductCard key={product.slug} product={product} add={add} />) : <div className="empty-results"><h2>No encontramos coincidencias</h2><p>Prueba otro término o limpia los filtros.</p><button type="button" onClick={clearFilters}>Mostrar todos</button></div>}
          </section>
        </div>
      </div>
      {!refined && <nav className="pagination" aria-label="Paginación de productos">
        {Array.from({ length: 7 }, (_, index) => index + 1).map((number) => <Link className={page === number ? "current" : ""} href={`/tienda/?product-page=${number}`} key={number}>{number}</Link>)}
      </nav>}
    </div>
  );
}

function ProductPage({ product, add }: { product: Product; add: (product: Product, quantity?: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState("");
  return (
    <div className="product-detail leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}>
      <article className="product-detail-inner reveal">
        <div className="detail-image"><img src={product.image} alt={product.name} /></div>
        <div className="detail-copy">
          <h1>{product.name}</h1>
          {product.price && <p className="detail-price">{product.price}</p>}
          {product.action === "options" && <label className="variant-label">Elige una opción<select value={variant} onChange={(event) => setVariant(event.target.value)}><option value="">Elegir una opción</option><option>Pequeño</option><option>Mediano</option><option>Grande</option></select></label>}
          {(product.action === "add" || product.action === "options") && <div className="detail-action"><input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} aria-label="Cantidad" /><button type="button" disabled={product.action === "options" && !variant} onClick={() => add(product, quantity)}>Añadir al carrito</button></div>}
          {product.action === "read" && <p className="notice">Este producto está disponible bajo consulta.</p>}
          {product.description && <p>{product.description}</p>}
          <div className="product-assurance"><p>Consulta disponibilidad, tiempos de entrega y opciones de mayoreo directamente con nuestro equipo.</p><a href={WHATSAPP} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp <IconArrowUpRight /></a></div>
        </div>
      </article>
    </div>
  );
}

function SelePage({ add }: { add: (product: Product, quantity?: number) => void }) {
  const [start, setStart] = useState(0);
  const seleProducts: Product[] = laSelePage.products.map((product) => ({
    slug: product.href.split("/").filter(Boolean).at(-1) || String(product.id),
    name: product.name,
    price: product.price,
    image: localizeAsset(product.image.src || ""),
    categories: ["la-sele"],
    tags: [],
    action: product.actionLabel === "Seleccionar opciones" ? "options" : "add",
  }));
  const shown = Array.from({ length: 3 }, (_, index) => seleProducts[(start + index) % seleProducts.length]);
  return (
    <div className="sele-page">
      <section className="sele-banner reveal"><img src={localizeAsset(laSelePage.hero.src || "")} alt="" /></section>
      <section className="sele-products">
        <h1>{laSelePage.heading}</h1>
        <div className="sele-carousel">
          <button type="button" aria-label="Producto anterior" onClick={() => setStart((start + seleProducts.length - 1) % seleProducts.length)}>‹</button>
          <div className="sele-grid">{shown.slice(0, 3).map((product) => <ProductCard key={product.slug} product={product} add={add} />)}</div>
          <button type="button" aria-label="Producto siguiente" onClick={() => setStart((start + 1) % seleProducts.length)}>›</button>
        </div>
      </section>
      <section className="expired-promo reveal">
        <img src={localizeAsset(laSelePage.campaign.image.src || "")} alt="" />
        <h2>{laSelePage.campaign.heading}</h2>
        {laSelePage.campaign.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <div className="countdown">{laSelePage.campaign.countdown.map((item) => <span key={item.label}><b>{item.value}</b>{item.label}</span>)}</div>
        <h3>{laSelePage.campaign.closing}</h3>
      </section>
    </div>
  );
}

function BlogPage() {
  return (
    <div className="blog-page leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}>
      <header className="blog-title"><h1>Blog</h1></header>
      <section className="post-grid page-container">
        {POSTS.map((post) => <article className="post-card reveal" key={post.slug}>
          <Link href={`/${post.slug}/`}><img src={post.image} alt="" /></Link>
          <div className="post-copy"><span>EDUCACIÓN</span><h2><Link href={`/${post.slug}/`}>{post.title}</Link></h2><p>{post.excerpt}</p><Link className="read-more" href={`/${post.slug}/`}>LEER MÁS »</Link></div>
          <footer><span>{post.date}</span><span>Sin comentarios</span></footer>
        </article>)}
      </section>
    </div>
  );
}

function ArticlePage({ slug }: { slug: string }) {
  const post = blogArticles.find((item) => item.slug === slug) || blogArticles[0];
  return (
    <article className="article-page leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}>
      <div className="article-inner reveal">
        <img className="article-hero" src={localizeAsset(post.hero.src || "")} alt="" />
        <p className="eyebrow">EDUCACIÓN</p><h1>{correctedCopy(post.title)}</h1><p className="article-meta">{new Intl.DateTimeFormat("es-CR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(post.publishedAt))} · Regalarte</p>
        {post.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {post.sections.map((section, index) => <section className="article-section" key={`${section.heading || "seccion"}-${index}`}>
          {section.heading && <h2>{section.heading}</h2>}
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.items.length > 0 && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
          {section.image?.src && <figure><img src={localizeAsset(section.image.src)} alt="" />{section.caption && <figcaption>{section.caption}</figcaption>}</figure>}
          {section.productSlugs.length > 0 && <div className="article-product-row">{section.productSlugs.slice(0, 4).map((productSlug) => {
            const product = PRODUCTS.find((item) => item.slug === productSlug);
            return product ? <Link href={`/product/${product.slug}/`} key={product.slug}><img src={product.image} alt="" /><span>{product.name}</span></Link> : null;
          })}</div>}
        </section>)}
      </div>
    </article>
  );
}

function LocalForm({ title, kind = "contact" }: { title: string; kind?: string }) {
  const [status, setStatus] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Información validada localmente. Este prototipo no envía datos.");
  };
  return (
    <form className="local-form" onSubmit={submit}>
      <h1>{title}</h1><span className="heading-rule" />
      <div className="form-row"><label>Nombre *<input name="nombre" required /></label><label>Apellidos *<input name="apellidos" required /></label></div>
      <label>Correo electrónico *<input name="correo" type="email" required /></label>
      {kind !== "account" && <label>Teléfono *<input name="telefono" type="tel" required /></label>}
      {(kind === "wholesale" || kind === "international") && <label>Empresa<input name="empresa" /></label>}
      {kind === "international" && <label>País *<input name="pais" required /></label>}
      {kind === "job" && <label>Currículum *<input name="archivo" type="file" accept=".pdf,.doc,.docx" required /></label>}
      {kind !== "account" && <label>Mensaje<textarea name="mensaje" rows={5} /></label>}
      {kind === "account" && <label>Contraseña *<input name="password" type="password" required /></label>}
      <button type="submit">{kind === "account" ? "Acceder" : "Enviar"}</button>
      {status && <p className="form-status" role="status">{status}</p>}
    </form>
  );
}

function ContentForm({ title, definition }: { title: string; definition: FormDefinition }) {
  const [status, setStatus] = useState("");
  const { t } = useLanguage();
  const tField = (label: string) => {
    switch (label) {
      case "Nombre": return t("Nombre", "Name");
      case "Apellidos": return t("Apellidos", "Last Name");
      case "Correo electrónico": return t("Correo electrónico", "Email");
      case "Teléfono": return t("Teléfono", "Phone");
      case "Mensaje": return t("Mensaje", "Message");
      case "Empresa": return t("Empresa", "Company");
      case "País": return t("País", "Country");
      case "Currículum": return t("Currículum", "Resume");
      case "Contraseña": return t("Contraseña", "Password");
      default: return label;
    }
  };
  return <form className="local-form" onSubmit={(event) => { event.preventDefault(); setStatus(t("Información validada localmente. Este prototipo no envía datos.", "Information validated locally. This prototype does not send data.")); }}>
    <h1>{title}</h1><span className="heading-rule" />
    {definition.fields.map((field) => {
      const label = tField(field.label);
      if (field.type === "textarea") return <label key={field.id}>{label}{field.required ? " *" : ""}<textarea name={field.id} placeholder={field.placeholder || undefined} required={field.required} rows={3} /></label>;
      if (field.type === "select") return <label key={field.id}>{label}{field.required ? " *" : ""}<select name={field.id} required={field.required} defaultValue={field.value || ""}><option value="">{t("Seleccione", "Select")}</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select></label>;
      if (field.type === "checkbox") return <label className="checkbox-field" key={field.id}><input name={field.id} type="checkbox" required={field.required} />{label}</label>;
      return <label key={field.id}>{label}{field.required ? " *" : ""}<input name={field.id} type={field.type} placeholder={field.placeholder || undefined} required={field.required} accept={field.type === "file" ? ".pdf,.doc,.docx" : undefined} /></label>;
    })}
    <button type="submit">{t(correctedCopy(definition.submitLabel === "Eviar" ? "Enviar" : definition.submitLabel), "Send")}</button>
    {status && <p className="form-status" role="status">{status}</p>}
  </form>;
}

function ContactMap() {
  const { t } = useLanguage();
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Coordenadas aproximadas de la tienda en Los Yoses Sur
  const STORE_LAT = 9.9272;
  const STORE_LON = -84.0617;

  const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    setError(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const d = calcDistance(position.coords.latitude, position.coords.longitude, STORE_LAT, STORE_LON);
        setDistance(d);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      }
    );
  };

  return (
    <div className="map-placeholder" id="direccion" role="img" aria-label={t("Mapa de San Pedro, San José", "Map of San Pedro, San Jose")}>
      <img src={LOGO} alt="Regalarte" className="map-logo" />
      <button 
        type="button"
        className="distance-btn" 
        onClick={distance === null && !loading ? handleGetLocation : undefined}
      >
        <IconMapPin />
        {loading ? t("Calculando...", "Calculating...") 
          : distance !== null ? 
            (distance < 1 ? t(`A ${Math.round(distance * 1000)} m de ti`, `${Math.round(distance * 1000)} m away`) : t(`A ${distance.toFixed(1)} km de ti`, `${distance.toFixed(1)} km away`))
          : error ? t("Ubicación denegada", "Location denied")
          : t("Calcular distancia", "Calculate distance")}
      </button>
      <div className="address-discrete">{ADDRESS}</div>
    </div>
  );
}

function ContactPage() {
  const { t } = useLanguage();
  return (
    <div className="contact-page leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}>
      <section className="contact-layout page-container reveal">
        <ContentForm title={t(contactPage.heading, "Contact Us")} definition={contactPage.form} />
        <div className="contact-media">
          <img src={localizeAsset("https://regalarte.cr/wp-content/uploads/2025/02/vista-para-enlaces-1-1024x538.png")} alt={t("Productos Regalarte", "Regalarte Products")} />
          <ContactMap />
          <div className="contact-icons">
            <a href={PHONE_SALES_HREF} aria-label={t("Llamar a ventas", "Call sales")}><IconPhone /></a>
            <a href={`mailto:${EMAIL}`} aria-label={t("Escribir un correo", "Send an email")}><IconMail /></a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label={t("Escribir por WhatsApp", "Message on WhatsApp")}><IconWhatsApp /></a>
            <a href={FACEBOOK} target="_blank" rel="noopener noreferrer" aria-label={t("Facebook de Regalarte", "Regalarte on Facebook")}><IconFacebook /></a>
            <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label={t("Instagram de Regalarte", "Regalarte on Instagram")}><IconInstagram /></a>
            <a href="#direccion" aria-label={t("Ir a la dirección", "Go to address")}><IconMapPin /></a>
          </div>
        </div>
      </section>
    </div>
  );
}

function CartPage({ lines, update, remove }: { lines: CartLine[]; update: (slug: string, quantity: number) => void; remove: (slug: string) => void }) {
  if (!lines.length) return <EmptyCart />;
  const total = lines.reduce((sum, line) => sum + numericPrice(line.product.price) * line.quantity, 0);
  return (
    <div className="cart-page leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}>
      <section className="cart-panel reveal"><h1>Carrito</h1>
        <div className="cart-table">{lines.map((line) => <article key={line.product.slug}><img src={line.product.image} alt="" /><div><h2>{line.product.name}</h2><p>{line.product.price}</p></div><input type="number" min="1" value={line.quantity} onChange={(event) => update(line.product.slug, Number(event.target.value) || 1)} aria-label={`Cantidad de ${line.product.name}`} /><button type="button" onClick={() => remove(line.product.slug)} aria-label={`Eliminar ${line.product.name}`}>×</button></article>)}</div>
        <div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div>
        <div className="cart-buttons"><Link className="outline-button" href="/tienda/">Seguir comprando</Link><Link className="solid-button" href="/checkout/">Finalizar compra</Link></div>
      </section>
    </div>
  );
}

function EmptyCart() {
  return <div className="empty-cart leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}><section className="empty-cart-banner reveal"><p>Tu carrito está vacío.</p><Link href="/tienda/">Volver a la tienda</Link></section></div>;
}

function CheckoutPage({ lines }: { lines: CartLine[] }) {
  const [status, setStatus] = useState("");
  if (!lines.length) return <EmptyCart />;
  const total = lines.reduce((sum, line) => sum + numericPrice(line.product.price) * line.quantity, 0);
  return (
    <div className="checkout-page leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}>
      <div className="coupon-bar">¿Tienes un cupón? Haz clic aquí para introducir tu código</div>
      <form className="checkout-grid" onSubmit={(event) => { event.preventDefault(); setStatus("Pedido simulado. No se procesó ningún pago ni se enviaron datos."); }}>
        <section className="billing-panel"><h1>Datos de facturación</h1><div className="form-row"><label>Nombre *<input required /></label><label>Apellidos *<input required /></label></div><label>País o región *<select defaultValue="Costa Rica"><option>Costa Rica</option></select></label><label>Dirección *<input required placeholder="Calle y número" /><input placeholder="Apartamento, oficina u otra referencia (opcional)" /></label><label>Provincia *<select defaultValue="San José"><option>San José</option><option>Alajuela</option><option>Cartago</option></select></label><label>Cantón *<input required /></label><label>Distrito *<input required /></label><label>Código postal *<input required /></label><label>Teléfono *<input type="tel" required /></label><label>Correo electrónico *<input type="email" required /></label><label>Notas del pedido (opcional)<textarea rows={4} /></label></section>
        <section className="order-panel"><h2>Resumen del pedido</h2><div className="order-table"><div><b>Producto</b><b>Subtotal</b></div>{lines.map((line) => <div key={line.product.slug}><span>{line.product.name} × {line.quantity}</span><span>{money(numericPrice(line.product.price) * line.quantity)}</span></div>)}<div><b>Total</b><strong>{money(total)}</strong></div></div><div className="tilopay"><h3>Tilopay</h3><p>Paga con tarjeta de crédito o débito.</p><div className="payment-placeholder">VISA · Mastercard</div><p>Consulta cómo tratamos la información de esta demostración en nuestra <Link href="/privacidad/">política de privacidad</Link>.</p><button type="submit">Simular pedido</button><p className="prototype-warning">Demostración local: no se procesan pagos ni se envían datos.</p>{status && <p role="status">{status}</p>}</div></section>
      </form>
    </div>
  );
}

function WholesaleHubPage() {
  const routes = [
    { eyebrow: "01", title: "Quiero comprar al por mayor", copy: "Registra tu comercio y comparte los datos necesarios para iniciar la conversación.", href: "/inscripcion-mayoreo/", action: "Iniciar registro" },
    { eyebrow: "02", title: "Explorar catálogos", copy: "Consulta las colecciones disponibles para comercios y puntos de venta.", href: "/catalogos-mayoreo/", action: "Ver catálogos" },
    { eyebrow: "03", title: "Solicitar información", copy: "Cuéntanos qué tipo de productos buscas y cómo podemos contactarte.", href: "/solicitud-catalogo/", action: "Enviar solicitud" },
    { eyebrow: "04", title: "Envíos internacionales", copy: "Revisa el formulario para consultas comerciales fuera de Costa Rica.", href: "/envio-internacional/", action: "Consultar envío" },
  ];
  return (
    <div className="wholesale-hub leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}>
      <header className="wholesale-hero page-container"><p className="eyebrow">MAYOREO REGALARTE</p><h1>Hecho en Costa Rica.<br />Listo para tu tienda.</h1><p>Precios especiales, tarifas reducidas y promociones de temporada para comercios. Un solo punto de entrada para catálogos, registro comercial, solicitudes y consultas de distribución.</p><a className="solid-button" href={WHATSAPP} target="_blank" rel="noopener noreferrer">Hablar con el equipo <IconArrowUpRight /></a></header>
      <section className="wholesale-grid page-container" aria-label="Opciones de mayoreo">{routes.map((route) => <article className="wholesale-card reveal" key={route.href}><span>{route.eyebrow}</span><h2>{route.title}</h2><p>{route.copy}</p><Link href={route.href}>{route.action}<b aria-hidden="true">↗</b></Link></article>)}</section>
    </div>
  );
}

function PrivacyPage() {
  return (
    <div className="privacy-page leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}>
      <article className="privacy-inner page-container"><p className="eyebrow">REGALARTE</p><h1>Privacidad en este prototipo</h1><p>Esta versión de demostración no procesa pagos, no crea cuentas reales y no envía la información introducida en sus formularios.</p><p>El carrito y los ajustes de lectura se guardan únicamente en este dispositivo para demostrar el recorrido. Puedes eliminarlos desde los ajustes del sistema del pie de página.</p><p>Para solicitar la política comercial vigente de Regalarte, escribe a <a href="mailto:info@regalartecr.com">info@regalartecr.com</a>.</p><Link className="outline-button" href="/contacto/">Ir a contacto</Link></article>
    </div>
  );
}

function AuxiliaryPage({ path }: { path: string }) {
  const pages: Record<string, { title: string; introduction: string[]; form: FormDefinition; entries: { title: string; href: string }[] }> = {
    "/solicitud-catalogo/": { title: requestCatalogPage.heading, introduction: requestCatalogPage.introduction, form: requestCatalogPage.form, entries: [] },
    "/inscripcion-mayoreo/": { title: wholesaleRegistrationPage.heading, introduction: wholesaleRegistrationPage.introduction, form: wholesaleRegistrationPage.form, entries: [] },
    "/catalogos-mayoreo/": { title: wholesaleCatalogPage.title, introduction: [wholesaleCatalogPage.contactIntroduction], form: wholesaleCatalogPage.form, entries: wholesaleCatalogPage.entries },
    "/catalogos-detalle/": { title: retailCatalogPage.title, introduction: [retailCatalogPage.contactIntroduction], form: retailCatalogPage.form, entries: retailCatalogPage.entries },
    "/exphore/": { title: exphorePage.heading, introduction: exphorePage.introduction, form: exphorePage.form, entries: [] },
    "/oferta-de-empleo/": { title: employmentPage.heading, introduction: employmentPage.introduction, form: employmentPage.form, entries: [] },
    "/envio-internacional/": { title: internationalShippingPage.heading, introduction: internationalShippingPage.introduction, form: internationalShippingPage.form, entries: [] },
  };
  const page = pages[path];
  if (!page) return <NotFound />;
  return <div className="aux-page leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}><section className="aux-inner reveal"><div className="aux-copy"><p className="eyebrow">REGALARTE</p><h1>{page.title}</h1>{page.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{page.entries.map((entry) => <div className="catalog-preview" key={entry.title}><span>{entry.title}</span><a href={cleanExternalHref(entry.href)} target="_blank" rel="noopener noreferrer">Ver catálogo</a></div>)}</div><ContentForm title={page.title} definition={page.form} /></section></div>;
}

function AccountPage() {
  return <div className="account-page leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}><section className="account-inner reveal"><LocalForm title="Mi cuenta" kind="account" /><p>Este acceso es una simulación local y no autentica usuarios.</p></section></div>;
}

function SamplePage() {
  return <div className="sample-page leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}><article className="sample-inner"><h1>{samplePage.heading}</h1>{samplePage.paragraphs.map((value) => <p key={value}>{value}</p>)}{samplePage.paragraphsContinued.map((value) => <p key={value}>{value}</p>)}<blockquote>{samplePage.firstExample.map((value) => <p key={value}>{value}</p>)}<p>{samplePage.firstExampleContinued}</p></blockquote><p>{samplePage.secondExampleIntroduction}</p><blockquote><p>{samplePage.secondExample}</p><p>{samplePage.secondExampleContinued}</p></blockquote><p>{samplePage.closing}</p></article></div>;
}

function NotFound() {
  return <div className="not-found leaf-page" style={{ "--leaf-bg": `url(${LEAF_BG})` } as React.CSSProperties}><section><p>404</p><h1>Este sendero no existe</h1><Link href="/">Volver al inicio</Link></section></div>;
}

/* El pie separa los dos embudos que el sitio anterior mezclaba: comprar al
   detalle y comprar al por mayor tienen su propia columna. */
const FOOTER_SHOP = [
  ["Toda la tienda", "/tienda/"],
  ["Peluches", "/product-category/peluches/"],
  ["Textiles", "/product-category/textiles/"],
  ["Gorras", "/product-category/gorras/"],
  ["La Sele", "/la-sele/"],
];

const FOOTER_WHOLESALE = [
  ["Comprar al por mayor", "/mayoreo/"],
  ["Registro comercial", "/inscripcion-mayoreo/"],
  ["Catálogos mayoreo", "/catalogos-mayoreo/"],
  ["Envíos internacionales", "/envio-internacional/"],
];

const FOOTER_NOSOTROS = [
  ["Nuestra historia", "/nosotros/"],
  ["Blog", "/blog/"],
  ["Privacidad", "/privacidad/"],
  ["Escríbenos", "/contacto/"],
];

function Footer({ sele }: { sele: boolean }) {
  return (
    <footer className={sele ? "site-footer sele-footer" : "site-footer"}>
      <div className="footer-grid page-container">
        <div className="footer-brand">
          <Link href="/" className="footer-logo"><img src={LOGO} alt="Regalarte" /></Link>
          <p className="footer-tagline">Costa Rica, para llevar.</p>
          <p className="footer-desc">
            Más de veinte años creando recuerdos que conectan a las personas con la
            biodiversidad, la cultura y el color de Costa Rica. Cobertura nacional
            para público general y comercios.
          </p>
          <a href="https://rescatewildlife.org" target="_blank" rel="noopener noreferrer" className="footer-badge">
            <IconLeaf />
            Patrocinador Bronce del Rescate Wildlife Rescue Center
          </a>
        </div>

        <div className="footer-col footer-col-shop">
          <h4>Comprar</h4>
          <ul>
            {FOOTER_SHOP.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}
          </ul>
        </div>

        <div className="footer-col">
          <h4>Mayoreo</h4>
          <ul>
            {FOOTER_WHOLESALE.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}
          </ul>
        </div>

        <div className="footer-col">
          <h4>Nosotros</h4>
          <ul>
            {FOOTER_NOSOTROS.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contacto</h4>
          <ul>
            <li className="footer-contact-line"><IconPhone /><a href={PHONE_SALES_HREF}>{PHONE_SALES}<br />Ventas y WhatsApp</a></li>
            <li className="footer-contact-line"><IconMail /><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
            <li className="footer-contact-line"><IconMapPin /><span>Barrio Los Yoses Sur, 375 m sur de Ambacar,<br />San Pedro, San José, Costa Rica</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <div className="footer-legal">
            <span className="footer-legal-copyright">© 2026 Regalarte de las Américas. Todos los derechos reservados.</span>
            <span className="footer-sep footer-sep-hide-mobile" aria-hidden="true">·</span>
            <button className="elysium-version-tag" type="button" aria-haspopup="dialog" onClick={() => (window as typeof window & { ElysiumSystem?: { show: () => void } }).ElysiumSystem?.show()}>v1.0.0 beta</button>
          </div>
          <p className="footer-credit">Desarrollado por <a href="https://elysiumdr.eu" target="_blank" rel="noopener noreferrer">Elysium λ Development &amp; Research</a></p>
        </div>
      </div>
    </footer>
  );
}

/* Dock de contacto: siempre visible, sin desplegable. El FAB anterior escondía
   los canales tras un `+`, lo que añadía un toque a la acción más frecuente del
   sitio (escribir por WhatsApp). `site-features.js` lo repliega al llegar al
   pie para no tapar los enlaces legales. */
function ContactDock({ path, theme, onToggleTheme }: { path: string; theme: "light" | "dark"; onToggleTheme: () => void }) {
  const [tucked, setTucked] = useState(false);
  const isHome = path === "/";
  const isShop = path === "/tienda/" || path.startsWith("/product-category/") || path.startsWith("/product-tag/");
  const showThemeToggle = isHome || isShop || path === "/contacto/";
  const isDark = theme === "dark";
  const { lang, toggleLang } = useLanguage();
  /* En móvil el dock se esconde mientras se reproduce cada animación
     cinemática de Inicio (portada y baraja de destacados) y reaparece justo al
     terminar cada una. El snapshot de servidor devuelve `true` para que Inicio
     se pinte oculto (sin destellar sobre la portada antes de que arranquen las
     animaciones). En escritorio la clase es inerte (la media query solo esconde
     en móvil). */
  const animationsActive = useSyncExternalStore(
    subscribeDockAnimations,
    isAnyDockAnimationActive,
    () => true,
  );
  const animHidden = isHome && animationsActive;

  useEffect(() => {
    const footer = document.querySelector(".site-footer");
    if (!footer || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setTucked(entry.isIntersecting);
        });
      },
      { rootMargin: "0px 0px -15% 0px" }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`rg-dock ${tucked ? "is-tucked" : ""} ${animHidden ? "is-anim-hidden" : ""}`} id="contact-dock">
      <div className="rg-dock-items" role="group" aria-label="Contacto rápido y configuración">
        <a className="rg-dock-item is-whatsapp" href={WHATSAPP} target="_blank" rel="noopener noreferrer" data-tooltip="WhatsApp" aria-label="Escribir por WhatsApp"><IconWhatsApp /></a>
        <span className="rg-dock-divider" aria-hidden="true" />
        <a className="rg-dock-item" href={INSTAGRAM} target="_blank" rel="noopener noreferrer" data-tooltip="Instagram" aria-label="Instagram de Regalarte"><IconInstagram /></a>
        <a className="rg-dock-item" href={FACEBOOK} target="_blank" rel="noopener noreferrer" data-tooltip="Facebook" aria-label="Facebook de Regalarte"><IconFacebook /></a>
        <span className="rg-dock-divider" aria-hidden="true" />
        <button
          type="button"
          className="rg-dock-item rg-dock-lang"
          onClick={toggleLang}
          data-tooltip={lang === "es" ? "English" : "Español"}
          aria-label={lang === "es" ? "Switch to English" : "Cambiar a Español"}
        >
          <span>{lang === "es" ? "EN" : "ES"}</span>
        </button>
        {/* Interruptor de tema: en Inicio y en la Tienda.
            Muestra el destino del cambio (luna = pasar a oscuro, sol = volver a
            claro), como es convención en los interruptores de tema. */}
        {showThemeToggle && (
          <>
            <span className="rg-dock-divider" aria-hidden="true" />
            <button
              type="button"
              className={`rg-dock-item rg-dock-theme${isDark ? " is-dark" : ""}`}
              onClick={onToggleTheme}
              data-tooltip={isDark ? "Modo claro" : "Modo oscuro"}
              aria-pressed={isDark}
              aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
            >
              {isDark ? <IconSun /> : <IconMoon />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MiniCart({ open, lines, close, remove }: { open: boolean; lines: CartLine[]; close: () => void; remove: (slug: string) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.classList.add("drawer-open");
    closeRef.current?.focus();
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { close(); return; }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a,button,input,[tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { window.cancelAnimationFrame(focusFrame); document.body.classList.remove("drawer-open"); document.removeEventListener("keydown", key); previousFocus.current?.focus(); };
  }, [open, close]);
  const total = lines.reduce((sum, line) => sum + numericPrice(line.product.price) * line.quantity, 0);
  return <div className={`cart-overlay${open ? " open" : ""}`} aria-hidden={!open} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>{open && <aside ref={panelRef} className="mini-cart" role="dialog" aria-modal="true" aria-label="Carrito"><header><h2>Carrito</h2><button ref={closeRef} type="button" onClick={close} aria-label="Cerrar carrito" autoFocus>×</button></header><div className="mini-lines">{lines.length ? lines.map((line) => <article key={line.product.slug}><img src={line.product.image} alt="" /><div><h3>{line.product.name}</h3><p>{line.quantity} × {line.product.price}</p></div><button type="button" onClick={() => remove(line.product.slug)} aria-label={`Eliminar ${line.product.name}`}>×</button></article>) : <p>Tu carrito está vacío.</p>}</div><footer><div><span>Subtotal:</span><b>{money(total)}</b></div><Link href="/carrito/">Ver carrito</Link><Link href="/checkout/">Finalizar compra</Link></footer></aside>}</div>;
}

export function RegalarteApp({ initialPath, initialProductPage = 1 }: { initialPath: string; initialProductPage?: number }) {
  const path = initialPath.endsWith("/") ? initialPath : `${initialPath}/`;
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [miniOpen, setMiniOpen] = useState(false);
  /* Modo oscuro exclusivo de Inicio. Arranca en claro para coincidir con el
     HTML del servidor (sin localStorage) y se hidrata desde el dispositivo en
     el mismo cuadro que el carrito. La preferencia se recuerda entre visitas. */
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const toggleTheme = useCallback(() => setTheme((current) => (current === "dark" ? "light" : "dark")), []);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("regalarte:cart:v1") || "[]") as unknown;
        const hydrated = Array.isArray(saved) ? saved.flatMap((entry) => {
          const candidate = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
          const storedProduct = candidate.product && typeof candidate.product === "object" ? candidate.product as Record<string, unknown> : {};
          const slug = String(candidate.slug || storedProduct.slug || "");
          const product = PRODUCTS.find((item) => item.slug === slug);
          const quantity = Math.max(1, Math.min(99, Number(candidate.quantity) || 1));
          return product ? [{ product, quantity }] : [];
        }) : [];
        setCart(hydrated);
      } catch {}
      try {
        if (localStorage.getItem("regalarte:theme:v1") === "dark") setTheme("dark");
      } catch {}
      setCartHydrated(true);
    });
    ["/js/site-features.js", "/elysium-core/elysium-system-info.js"].forEach((src) => {
      if (document.querySelector(`script[src="${src}"]`)) return;
      const script = document.createElement("script");
      script.src = src;
      script.dataset.elysiumRuntime = "true";
      document.body.appendChild(script);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!cartHydrated) return;
    try { localStorage.setItem("regalarte:cart:v1", JSON.stringify(cart.map((line) => ({ slug: line.product.slug, quantity: line.quantity })))); } catch {}
  }, [cart, cartHydrated]);
  useEffect(() => {
    if (!cartHydrated) return;
    try { localStorage.setItem("regalarte:theme:v1", theme); } catch {}
  }, [theme, cartHydrated]);
  useEffect(() => {
    if (cartHydrated && path === "/checkout/" && cart.length === 0) window.location.replace("/carrito/");
  }, [cart.length, cartHydrated, path]);
  const closeMiniCart = useCallback(() => setMiniOpen(false), []);
  const openMiniCart = useCallback(() => {
    document.querySelector(".nav-menu")?.classList.remove("open");
    document.querySelector(".menu-toggle")?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
    setMiniOpen(true);
    window.setTimeout(() => document.querySelector<HTMLButtonElement>('.mini-cart [aria-label="Cerrar carrito"]')?.focus({ preventScroll: true }), 20);
  }, []);
  const add = (product: Product, quantity = 1) => {
    setCart((current) => {
      const found = current.find((line) => line.product.slug === product.slug);
      return found ? current.map((line) => line.product.slug === product.slug ? { ...line, quantity: line.quantity + quantity } : line) : [...current, { product, quantity }];
    });
    openMiniCart();
  };
  const update = (slug: string, quantity: number) => setCart((current) => current.map((line) => line.product.slug === slug ? { ...line, quantity: Math.max(1, quantity) } : line));
  const remove = (slug: string) => setCart((current) => current.filter((line) => line.product.slug !== slug));
  const productMatch = path.match(/^\/product\/([^/]+)\/$/);
  const categoryMatch = path.match(/^\/product-category\/([^/]+)\/$/);
  const tagMatch = path.match(/^\/product-tag\/([^/]+)\/$/);
  const postSlug = path.replace(/^\//, "").replace(/\/$/, "");
  const post = POSTS.some((item) => item.slug === postSlug);
  const sele = path.startsWith("/la-sele/");
  /* `darkHeader` marca las páginas cuyo primer viewport es una banda oscura
     (portada, mayoreo, La Sele y el 404), donde la píldora tiene que arrancar
     en su variante de cristal oscuro. Se resuelve junto a la ruta para que no
     haya dos listas de rutas que puedan divergir. */
  let page: React.ReactNode;
  let darkHeader = false;
  if (path === "/") { page = <HomePage add={add} />; darkHeader = true; }
  else if (path === "/nosotros/") page = <AboutPage />;
  else if (path === "/tienda/") { page = <ShopRedesign onAddProduct={(slug) => { const p = PRODUCTS.find((item) => item.slug === slug); if (p) add(p); }} />; darkHeader = true; }
  else if (categoryMatch) { page = <ShopRedesign onAddProduct={(slug) => { const p = PRODUCTS.find((item) => item.slug === slug); if (p) add(p); }} forcedCategory={decodeURIComponent(categoryMatch[1])} />; darkHeader = true; }
  else if (tagMatch) { page = <ShopRedesign onAddProduct={(slug) => { const p = PRODUCTS.find((item) => item.slug === slug); if (p) add(p); }} forcedTag={decodeURIComponent(tagMatch[1])} />; darkHeader = true; }
  else if (productMatch) {
    const found = PRODUCTS.find((product) => product.slug === decodeURIComponent(productMatch[1]));
    page = found ? <ProductPage product={found} add={add} /> : <NotFound />;
    darkHeader = !found;
  }
  else if (path === "/la-sele/") { page = <SelePage add={add} />; darkHeader = true; }
  else if (path === "/blog/" || path.startsWith("/category/") || path.startsWith("/author/") || path.startsWith("/tag/")) page = <BlogPage />;
  else if (post) page = <ArticlePage slug={postSlug} />;
  else if (path === "/contacto/") page = <ContactPage />;
  else if (path === "/mayoreo/") { page = <WholesaleHubPage />; darkHeader = true; }
  else if (path === "/privacidad/") page = <PrivacyPage />;
  else if (path === "/carrito/") page = <CartPage lines={cart} update={update} remove={remove} />;
  else if (path === "/checkout/") page = <CheckoutPage lines={cart} />;
  else if (path === "/my-account/") page = <AccountPage />;
  else if (path === "/sample-page/") page = <SamplePage />;
  else if (["/solicitud-catalogo/", "/inscripcion-mayoreo/", "/catalogos-mayoreo/", "/catalogos-detalle/", "/exphore/", "/oferta-de-empleo/", "/envio-internacional/"].includes(path)) page = <AuxiliaryPage path={path} />;
  else { page = <NotFound />; darkHeader = true; }
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => sum + numericPrice(line.product.price) * line.quantity, 0);

  const isDevCurtain =
    path === "/checkout/" ||
    path === "/mayoreo/" ||
    ["/solicitud-catalogo/", "/inscripcion-mayoreo/", "/catalogos-mayoreo/", "/catalogos-detalle/", "/exphore/", "/oferta-de-empleo/", "/envio-internacional/"].includes(path) ||
    path === "/la-sele/" || path.startsWith("/la-sele/") ||
    path === "/nosotros/" || path.startsWith("/nosotros/") ||
    path === "/blog/" || path.startsWith("/blog/") || path.startsWith("/category/") || path.startsWith("/author/") || path.startsWith("/tag/") || post;

  return (
    <LanguageProvider>
      <div className={`site-shell${sele ? " sele-shell" : ""}${path === "/" ? " home-shell" : ""}`} data-rg-theme={theme}>
        <a className="skip-link" href="#content">Ir al contenido</a>
        <Header path={path} dark={darkHeader} count={count} subtotal={subtotal} onCart={openMiniCart} />
        <main id="content" tabIndex={-1}>
          {page}
          {isDevCurtain && <DevelopmentCurtain />}
        </main>
        <Footer sele={sele} />
        <ContactDock path={path} theme={theme} onToggleTheme={toggleTheme} />
        <MiniCart open={miniOpen} lines={cart} close={closeMiniCart} remove={remove} />
      </div>
    </LanguageProvider>
  );
}
