export type CatalogProductType = "simple" | "variable" | "read-more";

export type CatalogProduct = {
  slug: string;
  name: string;
  price: string | null;
  categories: readonly string[] | null;
  type: CatalogProductType | null;
  imageUrl: string | null;
  shortDescription: string | null;
};

/**
 * Catálogo de la tienda. Vacío en la demo: la rejilla, el buscador, los filtros
 * por categoría y la paginación siguen montados y se activan solos en cuanto
 * haya productos.
 */
export const catalogProducts: CatalogProduct[] = [];
