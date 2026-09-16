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

/*
 * El icono se declara como ruta absoluta escrita a mano (`/images/…`), que es
 * justo el patrón que `scripts/publish-demo-arbol.sh` reescribe con `perl`
 * para anteponerle el `basePath`. Así funciona igual en `npm run dev` —donde
 * todo cuelga de la raíz— y publicado bajo `/Demo-arbol/`.
 */
export const metadata: Metadata = {
  title: {
    default: "Raíz y Piedra · Juegos y objetos de la memoria costarricense",
    template: "%s · Raíz y Piedra",
  },
  description:
    "Casa editora de juegos y objetos de memoria en San José, Costa Rica. Del guanacaste a las esferas del Diquís: 80 cartas y una línea del tiempo.",
  icons: { icon: [{ url: "/images/favicon.svg", type: "image/svg+xml" }] },
  robots: { index: false, follow: false, nocache: true },
  other: { "app-version": "V1.8.2" },
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
        {/* El aviso de entrada de cinco pasos queda desmontado a propósito: la
            demo se enseña en directo y un modal bloqueante estorba. El
            componente sigue en `components/site/ElysiumPrototypePopup.tsx` por
            si hay que reponerlo. La declaración de marca ficticia que llevaba
            dentro NO se pierde: vive ahora en el pie, visible siempre. */}
        <Script src="/js/site-features.js?v=1.0.1" strategy="afterInteractive" />
        <Script src="/elysium-core/elysium-system-info.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
