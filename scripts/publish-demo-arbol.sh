#!/usr/bin/env bash
#
# Publica el prototipo «Demo-arbol» dentro del sitio de Elysium.
#
# El código fuente y el sitio publicado conviven en el repositorio:
#
#   Prototipos/Demo-arbol/  → código fuente (Next 16)
#   Demo-arbol/             → sitio publicado en elysiumdr.eu/Demo-arbol/
#
# Los dos no pueden llamarse igual en la raíz, y la fuente de una app Next no es
# una página: no tiene ningún `index.html` hasta que se compila. Por eso la raíz
# guarda solo el resultado, que es lo que se sirve — la raíz del repositorio es
# la raíz de la web y el nombre de la carpeta ES la dirección. En Prototipos/ no
# se trabaja el sitio, se trabaja el proyecto.
#
# Uso:  ./scripts/publish-demo-arbol.sh
#
set -euo pipefail

PREFIX="/Demo-arbol"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# `cd … && pwd` resuelve la ruta y aborta con un error claro si Prototipos/ no
# está donde se espera, en vez de compilar en el vacío.
SRC="$(cd "$ROOT/Prototipos/Demo-arbol" 2>/dev/null && pwd)" || {
  echo "✗ No se encontró el código fuente en «Prototipos/Demo-arbol»." >&2
  exit 1
}
DEST="$ROOT/Demo-arbol"
# Umbral por archivo del despliegue: los assets del Worker de Cloudflare cortan
# en 25 MiB, así que nada pesado debe llegar a la carpeta publicada.
MAX_VIDEO_BYTES=$((8 * 1024 * 1024))

rm -rf "$SRC/out" "$SRC/.next-export.nosync"

echo "▸ Compilando el export estático (basePath $PREFIX)…"
DEMO_ARBOL_BASE_PATH="$PREFIX" npm --prefix "$SRC" run build

# Next 16 escribe el export en `distDir` cuando este se personaliza; se aceptan
# ambas ubicaciones para no depender de ese detalle.
OUT="$SRC/out"
[ -f "$OUT/index.html" ] || OUT="$SRC/.next-export.nosync"
[ -f "$OUT/index.html" ] || { echo "✗ No se encontró el export estático."; exit 1; }

# Next prefija sus propios assets (`_next/…`) y los `next/link`, pero no las rutas
# absolutas escritas a mano en el código del prototipo (`/images`, `/videos`, `/js`,
# `/css`, `/elysium-core`). Se reescriben aquí para no tener que ensuciar el
# código fuente, que sigue sirviéndose desde la raíz con `npm run dev`.
# El lookbehind evita duplicar el prefijo en lo que Next ya haya reescrito.
#
# AQUÍ SOLO SE TOCAN RECURSOS, NUNCA RUTAS DE NAVEGACIÓN. De las rutas se encarga
# `basePath`, y hace falta que el router siga viendo la suya sin prefijo: guarda
# `/tienda` y lo añade él al navegar. Este script llegó a reescribir también
# `"/tienda"`, con lo que el router acababa pidiendo
# `/Demo-arbol/Demo-arbol/tienda` y el enlace no abría — la dirección directa sí
# funcionaba, porque ahí no interviene el router. Si aparece un enlace de
# navegación que necesite parche, el arreglo es usar `next/link` en el código
# fuente, no reescribirlo aquí.
echo "▸ Reescribiendo rutas absolutas al prefijo…"
find "$OUT" -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.txt' \) -print0 |
  xargs -0 perl -0pi -e '
    s{(?<!/Demo-arbol)/(images|videos|js|css|elysium-core)/}{/Demo-arbol/$1/}g;
  '

# Red de seguridad: hoy no hay ningún vídeo local, pero si alguna vez se cuela un
# archivo pesado en `public/videos/` se publica recortado en lugar de reventar el
# límite de 25 MiB por archivo.
echo "▸ Aligerando vídeos de fondo…"
while IFS= read -r -d '' video; do
  size=$(stat -f%z "$video")
  [ "$size" -le "$MAX_VIDEO_BYTES" ] && continue
  echo "  · $(basename "$video") ($((size / 1024 / 1024)) MB) → bucle de 20 s"
  avconvert --source "$video" --output "$video.web.mp4" \
    --preset Preset640x480 --start 12 --duration 20 --replace >/dev/null
  mv "$video.web.mp4" "$video"
done < <(find "$OUT" -type f -name '*.mp4' -print0)

echo "▸ Sincronizando en ${DEST}…"
rm -rf "$DEST"
cp -R "$OUT" "$DEST"

echo "✓ Listo: ${DEST}  ($(du -sh "$DEST" | cut -f1))  →  https://elysiumdr.eu$PREFIX/"
