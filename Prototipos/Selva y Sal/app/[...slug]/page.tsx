import { SelvaYSalApp } from "../SelvaYSalApp";
import { catalogProducts } from "../data/catalog";
import { notFound } from "next/navigation";

const fixedRoutes = new Set([
  "nosotros", "tienda", "mayoreo", "expediciones", "blog", "contacto", "privacidad",
  "carrito", "checkout", "my-account", "terminos", "solicitud-catalogo",
  "inscripcion-mayoreo", "catalogos-mayoreo", "catalogos-detalle", "expoferia",
  "oferta-de-empleo", "envio-internacional", "la-ruta-del-arenal",
  "que-llevar-al-bosque-nuboso", "tres-dias-en-el-pacifico-sur",
  "como-elegir-un-recuerdo-honesto",
]);
const productSlugs = new Set<string>(catalogProducts.map((product) => product.slug));

export default async function CatchAllPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const route = slug.join("/");
  const allowedArchive = slug.length === 2 && ["product-category", "product-tag", "category", "tag", "author"].includes(slug[0]);
  const allowedProduct = slug.length === 2 && slug[0] === "product" && productSlugs.has(slug[1]);
  if (!(slug.length === 1 && fixedRoutes.has(slug[0])) && !allowedArchive && !allowedProduct) notFound();
  const productPageValue = Array.isArray(query["product-page"]) ? query["product-page"][0] : query["product-page"];
  const productPage = Number(productPageValue);
  return <SelvaYSalApp initialPath={`/${route}/`} initialProductPage={Number.isInteger(productPage) ? productPage : 1} />;
}
