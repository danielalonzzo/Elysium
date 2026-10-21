import { notFound } from "next/navigation";
import PublicPage from "@/src/ui/PublicPage";
import { STATIC_SITE } from "@/src/core/config";

const pages = new Set(["", "sobre-mi", "servicios", "trabajo-social", "grooming", "cirugia", "exportacion", "tienda", "contacto", "orientador", "diagnostico"]);
export function generateStaticParams() { return STATIC_SITE ? [...pages].map(name => ({ slug: name ? [name] : [] })) : []; }
export default async function EnglishPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  const name = slug.join("/");
  if (!pages.has(name)) notFound();
  return <PublicPage slug={name} en />;
}
