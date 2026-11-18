import type { Metadata, Viewport } from "next";
import MagicMouse from "@/src/ui/MagicMouse";
import { ORIGIN as origin, STATIC_SITE, url } from "@/src/core/config";
import "./globals.css";
import "./crm-pvp.css";
import "./vet3vet.css";

const indexable = !STATIC_SITE;

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: "3VET Saúde Animal – Clínicas veterinárias em Macedo de Cavaleiros e Mirandela",
    template: "%s | 3VET Saúde Animal",
  },
  description:
    "Três veterinários, duas clínicas: Centro Veterinário Dr. Nuno Morais (Macedo de Cavaleiros) e Clínica Veterinária de Mirandela. Cães, gatos e animais de produção, com urgências 24 horas.",
  authors: [{ name: "3VET Saúde Animal" }],
  robots: { index: indexable, follow: indexable },
  alternates: {
    canonical: origin + "/",
    languages: { "pt-PT": origin + "/", en: `${origin}/en`, "x-default": origin + "/" },
  },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: "3VET Saúde Animal",
    title: "3VET Saúde Animal – Macedo de Cavaleiros e Mirandela",
    description: "Três veterinários, duas clínicas e urgências 24 horas na Terra Quente Transmontana.",
  },
  manifest: url("/manifest.webmanifest"),
  icons: {
    icon: [{ url: url("/favicon.svg"), type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f39323",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <head>
        <meta name="app-version" content="ELYSIUM OS · 3VET 1.1 PT" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Nunito: terminales redondos como VET. Barlow Semi Condensed: la rotulación del cartel y la tarjeta. */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <MagicMouse />
      </body>
    </html>
  );
}
