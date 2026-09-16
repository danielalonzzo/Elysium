import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogProducts } from "../../data/catalog";
import { ProductTile } from "../../components/shop/ProductTile";
import { BRAND, CONTACT, linkTo } from "../../data/content";
import { IconArrowUpRight, IconWhatsApp } from "../../components/site/Icons";

/*
 * Ficha de producto. `ProductTile` siempre enlazó a `/tienda/<slug>`, pero la
 * ruta no existía: cada click de la rejilla caía en el 404. Con `output:
 * "export"` no hay servidor, así que las doce fichas se emiten en el build a
 * partir de `generateStaticParams()`; `dynamicParams: false` deja claro que no
 * hay nada más que servir.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return catalogProducts.map((product) => ({ slug: product.slug }));
}

const find = (slug: string) => catalogProducts.find((p) => p.slug === slug);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = find((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription ?? undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const product = find((await params).slug);
  if (!product) notFound();

  const category = product.categories?.[0] ?? null;
  // Otras piezas de la misma categoría; si es hija única, se rellena con el
  // resto del catálogo para que el pie de la ficha nunca quede vacío.
  const related = [
    ...catalogProducts.filter((p) => p.slug !== product.slug && category && p.categories?.includes(category)),
    ...catalogProducts.filter((p) => p.slug !== product.slug && (!category || !p.categories?.includes(category))),
  ].slice(0, 3);

  return (
    <main className="rgx-shop">
      <div className="rgx-pdp">
        <nav className="rgx-pdp-back" aria-label="Migas de pan">
          <Link href="/tienda">
            <span aria-hidden="true">&larr;</span> Toda la colección
          </Link>
        </nav>

        <div className="rgx-pdp-layout">
          <div className="rgx-pdp-media">
            {product.imageUrl && <img src={product.imageUrl} alt={product.name} />}
          </div>

          <div className="rgx-pdp-info">
            {category && <p className="rgx-pdp-category">{category}</p>}
            <h1 className="rgx-pdp-title">{product.name}</h1>
            {product.price && <strong className="rgx-pdp-price">{product.price}</strong>}
            {product.shortDescription && (
              <p className="rgx-pdp-desc">{product.shortDescription}</p>
            )}

            {product.specs && product.specs.length > 0 && (
              <ul className="rgx-pdp-specs">
                {product.specs.map((spec) => (
                  <li key={spec}>{spec}</li>
                ))}
              </ul>
            )}

            <div className="rgx-pdp-actions">
              <a
                className="rgx-pdp-cta"
                href={linkTo(CONTACT.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconWhatsApp className="rgx-pdp-cta-ico" />
                Pedir por WhatsApp
              </a>
              <Link className="rgx-pdp-cta rgx-pdp-cta--ghost" href="/tienda">
                Seguir viendo
                <IconArrowUpRight className="rgx-pdp-cta-ico" />
              </Link>
            </div>

            <p className="rgx-pdp-note">
              Hecho en {BRAND.city} en tiradas cortas. Entrega en 3 a 5 días
              hábiles dentro del país.
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <section className="rgx-pdp-related" aria-label="Otras piezas">
            <h2>Otras piezas</h2>
            <div className="rgx-shop-grid rgx-shop-grid-wide">
              {related.map((item) => (
                <ProductTile key={item.slug} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
