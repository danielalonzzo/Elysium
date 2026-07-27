"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { catalogProducts } from "../../data/catalog";
import { ProductTile } from "./ProductTile";

const CATEGORY_CHIPS = [
  { label: "Todos", slug: "todos", match: [] as string[] },
  { label: "Juegos", slug: "juegos", match: ["Juegos"] },
  { label: "Textiles", slug: "textiles", match: ["Textiles"] },
  { label: "Gorras", slug: "gorras", match: ["Gorras"] },
  { label: "Bolsos", slug: "bolsos", match: ["Bolsos"] },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Destacados" },
  { value: "name", label: "Nombre A – Z" },
  { value: "price-low", label: "Precio: menor a mayor" },
  { value: "price-high", label: "Precio: mayor a menor" },
];

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

export function Shop() {
  const [activeChip, setActiveChip] = useState("todos");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"compact" | "wide">("wide");
  const gridRef = useRef<HTMLElement>(null);
  const chipBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPage(1);
  }, [activeChip, query, sort]);

  const products = catalogProducts;

  const filtered = useMemo(() => {
    const chip = CATEGORY_CHIPS.find((c) => c.slug === activeChip);
    const needle = slugify(query.trim());

    const result = products.filter((product) => {
      if (chip && chip.match.length > 0) {
        const cats = product.categories ?? [];
        if (!chip.match.some((m) => cats.includes(m))) return false;
      }
      if (needle) {
        const haystack = slugify(
          [product.name, product.shortDescription, ...(product.categories ?? [])].filter(Boolean).join(" ")
        );
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    return [...result].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "es");
      if (sort === "price-low")
        return (numericPrice(a.price) || Number.MAX_SAFE_INTEGER) - (numericPrice(b.price) || Number.MAX_SAFE_INTEGER);
      if (sort === "price-high") return numericPrice(b.price) - numericPrice(a.price);
      return 0;
    });
  }, [products, activeChip, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

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

  const changePage = (newPage: number) => {
    setPage(newPage);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeLabel = CATEGORY_CHIPS.find((c) => c.slug === activeChip)?.label ?? "Tienda";
  const isFiltered = activeChip !== "todos" || query.trim() !== "";

  return (
    <div className="rgx-shop">
      <header className="rgx-shop-hero">
        <div className="rgx-shop-hero-bg" aria-hidden="true">
          <img src="/images/caja-cartas-frente.png" alt="" loading="eager" />
        </div>
        <div className="rgx-shop-hero-content">
          <p className="rgx-shop-eyebrow">
            <span className="rgx-shop-eyebrow-dot" aria-hidden="true" />
            Catálogo Oficial
          </p>
          <h1 className="rgx-shop-heading">
            Tienda<br /><em>Historia de Costa Rica</em>
          </h1>
          <p className="rgx-shop-subtitle">
            {filtered.length} {filtered.length === 1 ? "producto" : "productos"} oficiales
          </p>
        </div>
      </header>

      <div className="rgx-shop-controls" ref={chipBarRef}>
        <div className="rgx-shop-controls-inner">
          <div className="rgx-shop-toolbar">
            <label className="rgx-shop-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar el juego, camisetas, gorras..."
                aria-label="Buscar productos"
              />
              {query && (
                <button type="button" className="rgx-search-clear" onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
                  ×
                </button>
              )}
            </label>

            <label className="rgx-shop-sort">
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar productos">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
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
                Limpiar todo
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rgx-shop-content">
        <aside className="rgx-shop-sidebar">
          <nav className="rgx-shop-chips" aria-label="Filtrar por categoría">
            {CATEGORY_CHIPS.map((chip) => (
              <button
                key={chip.slug}
                type="button"
                className={`rgx-chip${activeChip === chip.slug ? " is-active" : ""}`}
                onClick={() => setActiveChip(chip.slug)}
                aria-pressed={activeChip === chip.slug}
              >
                {chip.label}
                {chipCounts[chip.slug] > 0 && (
                  <span className="rgx-chip-count">{chipCounts[chip.slug]}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <section
          ref={gridRef}
          className={`rgx-shop-grid ${viewMode === "compact" ? "rgx-shop-grid-compact" : "rgx-shop-grid-wide"}`}
          aria-label="Productos"
          aria-live="polite"
        >
          {visible.length > 0 ? (
            visible.map((product) => (
              <ProductTile key={product.slug} product={product} />
            ))
          ) : (
            <div className="rgx-shop-empty">
              <h2>No encontramos coincidencias</h2>
              <p>Prueba otro término o cambia los filtros de categoría.</p>
              <button type="button" className="rgx-shop-reset" onClick={() => { setActiveChip("todos"); setQuery(""); }}>
                Mostrar todos los productos
              </button>
            </div>
          )}
        </section>

        {totalPages > 1 && (
          <nav className="rgx-shop-pagination" aria-label="Paginación de productos">
            <button
              type="button"
              className="rgx-page-arrow"
              disabled={safePage <= 1}
              onClick={() => changePage(safePage - 1)}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                className={`rgx-page-num${num === safePage ? " is-current" : ""}`}
                onClick={() => changePage(num)}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              className="rgx-page-arrow"
              disabled={safePage >= totalPages}
              onClick={() => changePage(safePage + 1)}
            >
              ›
            </button>
            <span className="rgx-page-info">
              {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
            </span>
          </nav>
        )}
      </div>
    </div>
  );
}
