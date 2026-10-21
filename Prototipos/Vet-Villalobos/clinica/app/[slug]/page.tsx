import { notFound } from "next/navigation";
import PublicPage from "@/src/ui/PublicPage";
import { STATIC_SITE } from "@/src/core/config";

const pages = new Set(["nosotros", "servicios", "sedes", "trabaje-con-nosotros", "grooming", "hotel", "exportacion", "farmacia", "contacto", "orientador", "diagnostico", "privacidad", "terminos", "politica-cookies"]);
// La copia estática de Elysium escribe una página por slug; en ChatGPT Sites se
// siguen renderizando bajo demanda, como antes.
export function generateStaticParams() { return STATIC_SITE ? [...pages].map(slug => ({ slug })) : []; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!pages.has(slug)) notFound();
  return <PublicPage slug={slug} />;
}
