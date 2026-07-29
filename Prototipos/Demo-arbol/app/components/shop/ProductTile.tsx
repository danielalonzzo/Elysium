import Link from "next/link";
import { type CatalogProduct } from "../../data/catalog";

export function ProductTile({
  product,
  onAddProduct,
}: {
  product: CatalogProduct;
  onAddProduct?: (slug: string) => void;
}) {
  const productHref = `/tienda/${product.slug}`;
  return (
    <article className="rgx-product-card">
      <Link className="rgx-product-media" href={productHref}>
        {/* Sin `imageUrl` no se pinta ningún `img`: uno con `src` vacío pide de
            nuevo la página actual y el navegador lo dibuja como imagen rota. */}
        {product.imageUrl && <img src={product.imageUrl} alt={product.name} loading="lazy" />}
        <span className="rgx-product-view"><i aria-hidden="true">&#x2197;&#xFE0E;</i></span>
      </Link>
      <div className="rgx-product-info">
        <div>
          <p>{product.categories?.[0] ?? ""}</p>
          <h3><Link href={productHref}>{product.name}</Link></h3>
        </div>
        {product.price && <strong>{product.price}</strong>}
      </div>
      {onAddProduct && product.type === "simple" && (
        <button className="rgx-quick-add" type="button" onClick={() => onAddProduct(product.slug)}>
          <span aria-hidden="true">＋</span>
        </button>
      )}
    </article>
  );
}
