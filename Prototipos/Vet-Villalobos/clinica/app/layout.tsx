import type { Metadata, Viewport } from "next";
import MagicMouse from "@/src/ui/MagicMouse";
import { ORIGIN as origin, STATIC_SITE, url } from "@/src/core/config";
import "./globals.css";

// La copia de elysiumdr.eu/Vet-Villalobos/ es un prototipo: no se indexa.
const indexable = !STATIC_SITE;

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: { default: "Veterinaria Villalobos | Cuatro sedes en Heredia", template: "%s | Veterinaria Villalobos" },
  description: "Consulta, vacunación, farmacia, grooming, pet shop, hotel y exportación para mascotas en Santa Cecilia, San Lorenzo, Santa Lucía y San Francisco de Heredia, Costa Rica.",
  authors: [{ name: "Veterinaria Villalobos" }],
  robots: { index: indexable, follow: indexable, googleBot: { index: indexable, follow: indexable, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 } },
  alternates: { canonical: origin + "/", languages: { "es-CR": origin + "/", en: `${origin}/en`, "x-default": origin + "/" } },
  openGraph: { type: "website", locale: "es_CR", siteName: "Veterinaria Villalobos", title: "Villalobos Servicios Veterinarios", description: "Cuatro sedes en Heredia: consulta, vacunación, grooming, hotel y exportación para su mascota.", images: [{ url: origin + "/images/og-home.jpg", width: 1200, height: 630, alt: "Villalobos Servicios Veterinarios" }] },
  twitter: { card: "summary_large_image", title: "Veterinaria Villalobos", description: "Cuatro sedes en Heredia, Costa Rica.", images: [origin + "/images/og-home.jpg"] },
  manifest: url("/manifest.webmanifest"),
  icons: { icon: [{ url: url("/favicon.svg"), type: "image/svg+xml" }, { url: url("/favicon-32.png"), sizes: "32x32" }], apple: url("/apple-touch-icon.png") },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#b60000" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CR" suppressHydrationWarning>
      <head><meta name="app-version" content="ELYSIUM OS 1.0.0 BETA" /></head>
      <body>
        {children}
        <MagicMouse />
      </body>
    </html>
  );
}
