import { notFound } from "next/navigation";
import PublicPage from "@/src/ui/PublicPage";
import { STATIC_SITE } from "@/src/core/config";

const pages = new Set(["", "nosotros", "servicios", "sedes", "trabaje-con-nosotros", "grooming", "hotel", "exportacion", "farmacia", "contacto", "orientador", "diagnostico"]);
export function generateStaticParams() { return STATIC_SITE ? [...pages].map(name => ({ slug: name ? [name] : [] })) : []; }
export default async function EnglishPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  const name = slug.join("/");
  if (!pages.has(name)) notFound();
  return <PublicPage slug={name} en />;
}
