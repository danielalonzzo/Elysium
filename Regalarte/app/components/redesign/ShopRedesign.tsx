"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { catalogProducts } from "../../data/catalog";
import { ProductTile } from "./CommercialHome";
import { localAsset } from "../../utils/assetPath";
import { useLanguage } from "../LanguageContext";

/* ── Constants ──────────────────────────────────────────────────────────── */

const LEAF_BG = "/assets/uploads/2025/02/portada-oscura-copia.webp";

/**
 * Agrupaciones de categorías visibles como chips. Cada chip puede agrupar
 * varias categorías del catálogo para simplificar la navegación.
 * `match` es un array de strings que se buscarán en `product.categories`.
 */
const CATEGORY_CHIPS: { label: string; slug: string; match: string[] }[] = [
  { label: "Todos", slug: "todos", match: [] },
  { label: "Peluches", slug: "peluches", match: ["Peluches", "Perezosos", "Reversible"] },
  { label: "Gorras", slug: "gorras", match: ["Gorras"] },
  { label: "Textiles", slug: "textiles", match: ["Textiles"] },
  { label: "Cerámica e Imanes", slug: "ceramica-imanes", match: ["Figuras cerámica", "Magnético"] },
  { label: "Jarras & Tazas", slug: "jarras", match: ["Jarras"] },
  { label: "La Sele", slug: "la-sele", match: ["La Sele"] },
  { label: "Navidad", slug: "navidad", match: ["Navidad"] },
  { label: "Accesorios", slug: "accesorios", match: ["Pulsera slap", "Cuellera", "Esponja baño", "Títere"] },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Destacados" },
  { value: "name", label: "Nombre A – Z" },
  { value: "price-low", label: "Precio: menor a mayor" },
  { value: "price-high", label: "Precio: mayor a menor" },
] as const;

const ITEMS_PER_PAGE = 15;

function numericPrice(value: string | null) {
  if (!value) return 0;
  const match = value.match(/[\d.,]+/);
  return match ? Number(match[0].replace(/[.,]/g, "")) || 0 : 0;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function ShopRedesign({
  onAddProduct,
  forcedCategory,
  forcedTag,
}: {
  onAddProduct?: (slug: string) => void;
  forcedCategory?: string;
  forcedTag?: string;
}) {
  const { t } = useLanguage();
  /* ── State ── */
  const [activeChip, setActiveChip] = useState(() => {
    if (forcedCategory) {
      const found = CATEGORY_CHIPS.find(
        (c) => c.match.some((m) => slugify(m) === forcedCategory) || c.slug === forcedCategory
      );
      return found?.slug ?? "todos";
    }
    return "todos";
  });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<string>("featured");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"compact" | "wide">("wide");
  const gridRef = useRef<HTMLElement>(null);
  const chipBarRef = useRef<HTMLDivElement>(null);

  /* Reset page when filters change */
  useEffect(() => { setPage(1); }, [activeChip, query, sort]);

  /* ── Derived data ── */
  const products = catalogProducts as typeof catalogProducts;

  const filtered = useMemo(() => {
    const chip = CATEGORY_CHIPS.find((c) => c.slug === activeChip);
    const needle = slugify(query.trim());

    const result = products.filter((product) => {
      // Category chip filter
      if (chip && chip.match.length > 0) {
        const cats = product.categories ?? [];
        if (!chip.match.some((m) => cats.includes(m))) return false;
      }

      // Forced tag filter (from product-tag routes)
      if (forcedTag) {
        const name = product.name.toLowerCase();
        if (!name.includes(forcedTag.toLowerCase())) return false;
      }

      // Search
      if (needle) {
        const haystack = slugify(
          [product.name, product.shortDescription, ...(product.categories ?? [])].filter(Boolean).join(" ")
        );
        if (!haystack.includes(needle)) return false;
      }

      return true;
    });

    // Sort
    return [...result].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "es");
      if (sort === "price-low")
        return (numericPrice(a.price) || Number.MAX_SAFE_INTEGER) - (numericPrice(b.price) || Number.MAX_SAFE_INTEGER);
      if (sort === "price-high") return numericPrice(b.price) - numericPrice(a.price);
      return 0;
    });
  }, [products, activeChip, forcedTag, query, sort]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  /* ── Category counts ── */
  const chipCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const chip of CATEGORY_CHIPS) {
      if (chip.match.length === 0) {
        counts[chip.slug] = products.length;
      } else {
        counts[chip.slug] = products.filter((p) => {
          const cats = p.categories ?? [];
          return chip.match.some((m) => cats.includes(m));
        }).length;
      }
    }
    return counts;
  }, [products]);

  /* ── Scroll to grid on page change ── */
  const changePage = (newPage: number) => {
    setPage(newPage);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ── Active chip label for the hero ── */
  const activeLabelRaw = CATEGORY_CHIPS.find((c) => c.slug === activeChip)?.label ?? "Tienda";
  
  const TRANSLATED_CHIPS: Record<string, string> = {
    "Todos": "All",
    "Peluches": "Plushies",
    "Gorras": "Caps",
    "Textiles": "Apparel",
    "Cerámica e Imanes": "Ceramics & Magnets",
    "Jarras & Tazas": "Mugs & Cups",
    "La Sele": "National Team",
    "Navidad": "Christmas",
    "Accesorios": "Accessories",
    "Tienda": "Shop"
  };
  const activeLabel = t(activeLabelRaw, TRANSLATED_CHIPS[activeLabelRaw] ?? activeLabelRaw);
  
  const isFiltered = activeChip !== "todos" || query.trim() !== "" || !!forcedTag;

  /* ── Banner intercalados data ── */
  const showSeleBanner = activeChip === "todos" && !isFiltered && safePage === 1;
  const showPerezosoBanner = activeChip === "todos" && !isFiltered && safePage === 1;

  return (
    <div className="rgx-shop">
      {/* ── Hero Editorial ── */}
      <header className="rgx-shop-hero">
        <div className="rgx-shop-hero-bg" aria-hidden="true">
          <img src={LEAF_BG} alt="" loading="eager" />
        </div>
        <div className="rgx-shop-hero-content">
          <p className="rgx-shop-eyebrow">
            <span className="rgx-shop-eyebrow-dot" aria-hidden="true" />
            {t("Catálogo Artesanal", "Artisanal Catalog")}
          </p>
          <h1 className="rgx-shop-heading">
            {forcedCategory || forcedTag ? (
              <>{t("Colección", "Collection")}<br /><em>{forcedTag || activeLabel}</em></>
            ) : (
              <>{t("Tienda", "Shop")}<br /><em>Regalarte</em></>
            )}
          </h1>
          <p className="rgx-shop-subtitle">
            {filtered.length} {filtered.length === 1 ? t("producto artesanal", "artisanal product") : t("productos artesanales", "artisanal products")} {t("de Costa Rica", "from Costa Rica")}
          </p>
        </div>
      </header>

      {/* ── Sticky Toolbar + Chips ── */}
      <div className="rgx-shop-controls" ref={chipBarRef}>
        <div className="rgx-shop-controls-inner">

          {/* Search + Sort + View */}
          <div className="rgx-shop-toolbar">
            <label className="rgx-shop-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Buscar peluches, gorras, souvenirs…", "Search plushies, caps, souvenirs…")}
                aria-label={t("Buscar productos", "Search products")}
              />
              {query && (
                <button type="button" className="rgx-search-clear" onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
                  ×
                </button>
              )}
            </label>

            <label className="rgx-shop-sort">
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar productos">
                {SORT_OPTIONS.map((o) => {
                  const TRANSLATED_SORT: Record<string, string> = {
                    "Destacados": "Featured",
                    "Nombre A – Z": "Name A – Z",
                    "Precio: menor a mayor": "Price: low to high",
                    "Precio: mayor a menor": "Price: high to low",
                  };
                  return <option key={o.value} value={o.value}>{t(o.label, TRANSLATED_SORT[o.label] ?? o.label)}</option>;
                })}
              </select>
            </label>

            <div className="rgx-view-toggle" role="radiogroup" aria-label="Modo de vista">
              <button
                type="button"
                className={viewMode === "wide" ? "is-active" : ""}
                onClick={() => setViewMode("wide")}
                aria-pressed={viewMode === "wide"}
                aria-label="Vista amplia"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                  <rect x="0" y="0" width="8" height="8" rx="2"/>
                  <rect x="10" y="0" width="8" height="8" rx="2"/>
                  <rect x="0" y="10" width="8" height="8" rx="2"/>
                  <rect x="10" y="10" width="8" height="8" rx="2"/>
                </svg>
              </button>
              <button
                type="button"
                className={viewMode === "compact" ? "is-active" : ""}
                onClick={() => setViewMode("compact")}
                aria-pressed={viewMode === "compact"}
                aria-label="Vista compacta"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                  <rect x="0" y="0" width="5" height="5" rx="1.5"/>
                  <rect x="6.5" y="0" width="5" height="5" rx="1.5"/>
                  <rect x="13" y="0" width="5" height="5" rx="1.5"/>
                  <rect x="0" y="6.5" width="5" height="5" rx="1.5"/>
                  <rect x="6.5" y="6.5" width="5" height="5" rx="1.5"/>
                  <rect x="13" y="6.5" width="5" height="5" rx="1.5"/>
                  <rect x="0" y="13" width="5" height="5" rx="1.5"/>
                  <rect x="6.5" y="13" width="5" height="5" rx="1.5"/>
                  <rect x="13" y="13" width="5" height="5" rx="1.5"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Active filters pills */}
          {isFiltered && (
            <div className="rgx-active-filters" aria-live="polite">
              {activeChip !== "todos" && (
                <span className="rgx-filter-pill">
                  {activeLabel}
                  <button type="button" onClick={() => setActiveChip("todos")} aria-label={`Quitar filtro ${activeLabel}`}>×</button>
                </span>
              )}
              {query.trim() && (
                <span className="rgx-filter-pill">
                  &ldquo;{query.trim()}&rdquo;
                  <button type="button" onClick={() => setQuery("")} aria-label="Quitar búsqueda">×</button>
                </span>
              )}
              <button
                type="button"
                className="rgx-clear-all"
                onClick={() => { setActiveChip("todos"); setQuery(""); }}
              >
                {t("Limpiar todo", "Clear all")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rgx-shop-content">
        <aside className="rgx-shop-sidebar">
          {/* Category Chips */}
          <nav className="rgx-shop-chips" aria-label="Filtrar por categoría">
            {CATEGORY_CHIPS.map((chip) => (
              <button
                key={chip.slug}
                type="button"
                className={`rgx-chip${activeChip === chip.slug ? " is-active" : ""}`}
                onClick={() => setActiveChip(chip.slug)}
                aria-pressed={activeChip === chip.slug}
              >
                {t(chip.label, TRANSLATED_CHIPS[chip.label] ?? chip.label)}
                {chipCounts[chip.slug] > 0 && (
                  <span className="rgx-chip-count">{chipCounts[chip.slug]}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Product Grid ── */}
        <section
        ref={gridRef}
        className={`rgx-shop-grid ${viewMode === "compact" ? "rgx-shop-grid-compact" : "rgx-shop-grid-wide"}`}
        aria-label="Productos"
        aria-live="polite"
      >
        {visible.length > 0 ? (
          <>
            {visible.map((product, index) => (
              <ProductTile
                key={product.slug}
                product={product}
                onAddProduct={onAddProduct}
              />
            ))}

            {/* Banner Intercalado: La Sele */}
            {showSeleBanner && visible.length >= 6 && (
              <Link href="/la-sele/" className="rgx-shop-banner rgx-shop-banner-sele">
                <div className="rgx-shop-banner-content">
                  <span className="rgx-shop-banner-tag">{t("Colección Exclusiva", "Exclusive Collection")}</span>
                  <h3>La Sele</h3>
                  <p>{t("Producto oficial de la Selección Nacional", "Official National Team Product")}</p>
                  <span className="rgx-shop-banner-cta">{t("Ver colección", "View collection")} <i aria-hidden="true">&#x2197;&#xFE0E;</i></span>
                </div>
                <img
                  src={localAsset("2026/03/banner-la-sele-nuevo.webp")}
                  alt=""
                  loading="lazy"
                />
              </Link>
            )}
          </>
        ) : (
          <div className="rgx-shop-empty">
            <div className="rgx-shop-empty-icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
                <path d="M8 11h6"/>
              </svg>
            </div>
            <h2>{t("No encontramos coincidencias", "No matches found")}</h2>
            <p>{t("Prueba otro término o cambia los filtros de categoría.", "Try another term or change the category filters.")}</p>
            <button
              type="button"
              className="rgx-shop-reset"
              onClick={() => { setActiveChip("todos"); setQuery(""); }}
            >
              {t("Mostrar todos los productos", "Show all products")}
            </button>
          </div>
        )}
      </section>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <nav className="rgx-shop-pagination" aria-label="Paginación de productos">
          <button
            type="button"
            className="rgx-page-arrow"
            disabled={safePage <= 1}
            onClick={() => changePage(safePage - 1)}
            aria-label="Página anterior"
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              className={`rgx-page-num${num === safePage ? " is-current" : ""}`}
              onClick={() => changePage(num)}
              aria-current={num === safePage ? "page" : undefined}
              aria-label={`Página ${num}`}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            className="rgx-page-arrow"
            disabled={safePage >= totalPages}
            onClick={() => changePage(safePage + 1)}
            aria-label="Página siguiente"
          >
            ›
          </button>

          <span className="rgx-page-info">
            {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} {t("de", "of")} {filtered.length}
          </span>
        </nav>
      )}
      </div>
    </div>
  );
}
