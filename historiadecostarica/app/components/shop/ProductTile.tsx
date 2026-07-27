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
        <img src={product.imageUrl || ""} alt={product.name} loading="lazy" />
        <span className="rgx-product-view">Ver producto <i aria-hidden="true">&#x2197;&#xFE0E;</i></span>
      </Link>
      <div className="rgx-product-info">
        <div>
          <p>{product.categories?.[0] ?? "Colección"}</p>
          <h3><Link href={productHref}>{product.name}</Link></h3>
        </div>
        {product.price && <strong>{product.price}</strong>}
      </div>
      {onAddProduct && product.type === "simple" && (
        <button className="rgx-quick-add" type="button" onClick={() => onAddProduct(product.slug)}>
          Comprar <span aria-hidden="true">＋</span>
        </button>
      )}
    </article>
  );
}
