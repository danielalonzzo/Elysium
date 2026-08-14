import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import "./redesign.css";
import "./premium.css";
import ElysiumPrototypePopup from "./components/redesign/ElysiumPrototypePopup";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") || incoming.get("host") || "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  let origin = "http://localhost:3000";
  try { origin = new URL(`${protocol}://${host}`).origin; } catch {}
  const socialImage = `${origin}/og-redesign.jpg`;

  return {
    title: {
      default: "Regalarte | Costa Rica, para llevar",
      template: "%s | Regalarte",
    },
    description: "Recuerdos inspirados en la fauna, los paisajes y la energía de Costa Rica. Del Arenal al Pacífico.",
    robots: { index: false, follow: false, nocache: true },
    icons: { icon: "/assets/uploads/2025/02/logo-horizontal.webp" },
    openGraph: {
      title: "Regalarte · Costa Rica, para llevar",
      description: "Del volcán al mar: recuerdos con la esencia de Costa Rica.",
      images: [{ url: socialImage, width: 1200, height: 630, alt: "Regalarte: del volcán Arenal al Pacífico" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Regalarte · Costa Rica, para llevar",
      description: "Del volcán al mar: recuerdos con la esencia de Costa Rica.",
      images: [socialImage],
    },
    other: {
      "app-version": "V1.6.0",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#061b15",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="referrer" content="no-referrer" />
        <link rel="stylesheet" href="/css/components/f22-system-settings.css" />
        <Script src="/js/elysium-config.js?v=2" strategy="beforeInteractive" />
        <Script src="/js/features/f22-system-settings.js" strategy="beforeInteractive" />
        <Script src="/elysium-core/elysium-preloader.js" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ElysiumPrototypePopup />
      </body>
    </html>
  );
}
