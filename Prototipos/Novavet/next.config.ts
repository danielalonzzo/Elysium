import type { NextConfig } from "next";

// `NEXT_PUBLIC_STATIC_SITE=1` compila la copia estática que se publica dentro de
// Elysium (ver `src/core/config.ts`). Las páginas que necesitan servidor tienen
// dos versiones en la misma carpeta: `page.live.tsx` (ChatGPT Sites, con inicio
// de sesión) y `page.static.tsx` (demostración sin servidor). La extensión
// decide cuál de las dos es la ruta en cada compilación.
const staticSite = process.env.NEXT_PUBLIC_STATIC_SITE === "1";

const nextConfig: NextConfig = {
  pageExtensions: [staticSite ? "static.tsx" : "live.tsx", "tsx", "ts", "jsx", "js"],
  // `assetPrefix` y no `basePath`: con `basePath`, el prerender de vinext
  // 1.0.0-beta.5 pide las rutas dinámicas sin el prefijo y todas dan 404. Las
  // páginas se exportan sin prefijo y las rutas propias ya lo llevan por
  // `url()`; solo faltan los recursos de `_next/`, que es lo que hace esto.
  ...(staticSite
    ? { output: "export", assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "" }
    : {}),
};

export default nextConfig;
