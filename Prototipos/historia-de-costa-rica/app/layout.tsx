import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

/*
 * Documento base + cableado de los módulos Elysium.
 *  · F01 preloader, F22 settings y la config de marca cargan `beforeInteractive`
 *    (pintura inmediata del overlay, sin FOUC).
 *  · site-features (F02/F03/F04/F09) y system-info (F05/F06/F10) cargan
 *    `afterInteractive`, cuando ya existe el DOM del pie.
 *  · noindex, nofollow en toda la pieza (§4.1 del protocolo).
 */

export const metadata: Metadata = {
  title: {
    default: "Historia de Costa Rica · El juego de mesa",
    template: "%s · Historia de Costa Rica",
  },
  description:
    "El juego de mesa que reconstruye la cronología de Costa Rica con 80 cartas ilustradas. Juego, merch, podcast y comunidad.",
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: "/logo.jpg" },
  other: { "app-version": "V1.5.1" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1A1A1A",
};

import { SiteHeader } from "./components/site/SiteHeader";
import { SiteFooter } from "./components/site/SiteFooter";
import { MagicBottom } from "./components/site/MagicBottom";
import { BrowserChrome } from "./components/site/BrowserChrome";
import ElysiumPrototypePopup from "./components/site/ElysiumPrototypePopup";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="referrer" content="no-referrer" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700;800&display=swap"
        />
        <link rel="stylesheet" href="/css/components/f22-system-settings.css" />
        <Script src="/js/elysium-config.js" strategy="beforeInteractive" />
        <Script src="/js/features/f22-system-settings.js" strategy="beforeInteractive" />
        <Script src="/elysium-core/elysium-preloader.js" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning>
        <BrowserChrome />
        <SiteHeader />
        <span id="top" className="hdc-top-anchor" aria-hidden="true" />
        {children}
        <SiteFooter />
        <MagicBottom />
        <ElysiumPrototypePopup />
        <Script src="/js/site-features.js?v=1.0.1" strategy="afterInteractive" />
        <Script src="/elysium-core/elysium-system-info.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
