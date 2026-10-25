import type { Metadata, Viewport } from "next";
import MagicMouse from "@/src/ui/MagicMouse";
import { ORIGIN as origin, STATIC_SITE, url } from "@/src/core/config";
import "./globals.css";

const indexable = true;

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: "Novavet – Consultório Veterinário & Produtos Agropecuários | Bragança",
    template: "%s | Novavet Bragança",
  },
  description:
    "Consultório médico-veterinário (Dr. Luís Afonso) e distribuição de produtos agropecuários e nutrição animal em Bragança, Trás-os-Montes. Número de funcionamento DGAV: PT 1 0124 CN.",
  authors: [{ name: "Novavet - Produtos Agro-Pecuários, Lda." }],
  keywords: [
    "veterinário Bragança",
    "consultório veterinário Bragança",
    "Dr. Luís Afonso veterinário",
    "produtos agropecuários Bragança",
    "nutrição animal Trás-os-Montes",
    "medicamentos veterinários DGAV",
    "apoio pecuário Trás-os-Montes",
    "vacinação animais Bragança",
    "Novavet",
  ],
  robots: {
    index: indexable,
    follow: indexable,
    googleBot: {
      index: indexable,
      follow: indexable,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: origin + "/",
    languages: {
      "pt-PT": origin + "/",
      en: `${origin}/en`,
      "x-default": origin + "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: "Novavet – Consultório Veterinário e Agropecuária",
    title: "Novavet – Consultório Veterinário (Dr. Luís Afonso) e Agropecuária",
    description:
      "Saúde animal e fornecimento agropecuário de excelência em Bragança. DGAV PT 1 0124 CN · Rua do Loreto, nº 36 ABC.",
    images: [
      {
        url: origin + "/images/og-clinica.jpg",
        width: 1200,
        height: 630,
        alt: "Novavet – Consultório Veterinário e Produtos Agropecuários",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Novavet – Consultório Veterinário & Produtos Agropecuários",
    description: "Saúde animal e fornecimento agropecuário em Bragança, Portugal.",
    images: [origin + "/images/og-clinica.jpg"],
  },
  manifest: url("/manifest.webmanifest"),
  icons: {
    icon: [
      { url: url("/favicon.svg"), type: "image/svg+xml" },
      { url: url("/favicon-32.png"), sizes: "32x32" },
    ],
    apple: url("/apple-touch-icon.png"),
  },
  other: {
    "geo.region": "PT-04",
    "geo.placename": "Bragança",
    "geo.position": "41.80328;-6.75951",
    ICBM: "41.80328, -6.75951",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#006570",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <MagicMouse />
      </body>
    </html>
  );
}
