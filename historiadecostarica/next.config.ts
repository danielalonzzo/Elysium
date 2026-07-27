import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Subcarpeta desde la que el sitio de Elysium sirve el prototipo
// (elysiumdr.eu/historia-de-costa-rica/). La fija `scripts/publish-historiadecostarica.sh`
// al compilar; en `npm run dev` queda vacía y todo sigue colgando de la raíz.
const basePath = process.env.HDC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // El prototipo es una pieza privada: nunca debe indexarse (§4.1 del protocolo).
  // El `noindex, nofollow` se refuerza además en `robots.txt` y en la metadata.
  reactStrictMode: true,
  // La raíz del proyecto convive con otros lockfiles del monorepo Elysium; se
  // fija explícitamente para que Turbopack no infiera una carpeta superior.
  turbopack: { root: projectRoot },
  // El prototipo se publica como sitio estático dentro del portafolio: `next build`
  // deja el resultado en `out/` y no hace falta ningún servidor de Node.
  output: "export",
  // Cada ruta se emite como `ruta/index.html`, que es lo que saben servir tanto
  // Firebase Hosting como los assets del Worker de Cloudflare.
  trailingSlash: true,
  // Sin servidor no hay optimizador de imágenes; se sirven los PNG tal cual.
  images: { unoptimized: true },
  // `distDir` aparte al publicar para no pisar el `.next` de un `npm run dev` abierto.
  ...(basePath ? { basePath, assetPrefix: basePath, distDir: ".next-export" } : {}),
};

export default nextConfig;
