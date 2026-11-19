import type { Metadata, Viewport } from "next";
import MagicMouse from "@/src/ui/MagicMouse";
import { ORIGIN as origin, STATIC_SITE, url } from "@/src/core/config";
import "./globals.css";
import "./crm-pvp.css";
import "./valedalvaro.css";

const indexable = !STATIC_SITE;

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: "Clínica Veterinária Vale d'Álvaro – Bragança & Vimioso · Pequenos Animais e Pecuária",
    template: "%s | Clínica Veterinária Vale d'Álvaro · Bragança",
  },
  description:
    "Clínica Veterinária Vale d'Álvaro (Bragança, Rua de Montesinho n.º 1/A) e Consultório Veterinário de Vimioso. Clínica e cirurgia de pequenos animais, análises sanguíneas, internamento, tosquias e banhos, hotel, espécies pecuárias e suiniculturas. Registo DGAV PT10089CL.",
  authors: [{ name: "Clínica Veterinária Vale D'Álvaro, Lda." }],
  robots: { index: indexable, follow: indexable },
  alternates: {
    canonical: origin + "/",
    languages: { "pt-PT": origin + "/", en: `${origin}/en`, "x-default": origin + "/" },
  },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: "Clínica Veterinária Vale d'Álvaro",
    title: "Clínica Veterinária Vale d'Álvaro · Bragança & Vimioso",
    description:
      "Clínica e cirurgia de pequenos animais, tosquias e banhos, hotel, espécies pecuárias e suiniculturas em Bragança e Vimioso. Tel. 273 325 357 · 934 682 958.",
    images: [{ url: url("/images/og-clinica.jpg"), width: 1200, height: 630, alt: "Clínica Veterinária Vale d'Álvaro · Bragança" }],
  },
  manifest: url("/manifest.webmanifest"),
  icons: {
    icon: [
      { url: url("/favicon.svg"), type: "image/svg+xml" },
      { url: url("/favicon-32.png"), sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: url("/apple-touch-icon.png"), sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e4d7b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <head>
        <meta name="app-version" content="elysiumOS 1 BETA" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <MagicMouse />
      </body>
    </html>
  );
}
