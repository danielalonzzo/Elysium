#!/usr/bin/env bash
#
# Publica el prototipo de la Clínica Veterinaria Dr. Luis Valladares dentro del
# sitio de Elysium, como subpágina estática.
#
#   Prototipos/Vet-Dr-Valladares/clinica/  → código fuente (vinext / Next 16)
#   Vet-Dr-Valladares/                     → sitio publicado en elysiumdr.eu/Vet-Dr-Valladares/
#
# La app nació en ChatGPT Sites, con servidor: inicio de sesión de ChatGPT, base
# D1 y una API. Aquí no hay nada de eso —la raíz del repositorio es la raíz de la
# web y se sirve tal cual—, así que se compila otra versión sin servidor
# (`NEXT_PUBLIC_STATIC_SITE=1`, ver `src/core/config.ts`): el portal, el CRM y las
# citas abren en modo demostración y los formularios pasan el mensaje a
# WhatsApp. La versión de ChatGPT Sites sigue compilándose igual que antes.
#
# Uso:  ./scripts/publish-vet-dr-valladares.sh
#
set -euo pipefail

PREFIX="/Vet-Dr-Valladares"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$(cd "$ROOT/Prototipos/Vet-Dr-Valladares/clinica" 2>/dev/null && pwd)" || {
  echo "✗ No se encontró el código fuente en «Prototipos/Vet-Dr-Valladares/clinica»." >&2
  exit 1
}
DEST="$ROOT/Vet-Dr-Valladares"
OUT="$SRC/dist/client"

[ -d "$SRC/node_modules" ] || { echo "✗ Faltan las dependencias: npm --prefix \"$SRC\" run install:ci" >&2; exit 1; }

echo "▸ Compilando el export estático (prefijo $PREFIX)…"
NEXT_PUBLIC_STATIC_SITE=1 NEXT_PUBLIC_BASE_PATH="$PREFIX" npm --prefix "$SRC" run build

[ -f "$OUT/index.html" ] || { echo "✗ No se encontró el export estático en $OUT." >&2; exit 1; }
# `assetPrefix` deja los recursos de vinext en `dist/client/Vet-Dr-Valladares/_next/`
# y las páginas en la raíz del export. En la carpeta publicada van juntos.
[ -d "$OUT$PREFIX/_next" ] || { echo "✗ No se encontraron los recursos en $OUT$PREFIX/_next." >&2; exit 1; }

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
cp -R "$OUT/" "$STAGE/site"
rm -rf "$STAGE/site/_next"
mv "$STAGE/site$PREFIX/_next" "$STAGE/site/_next"
rmdir "$STAGE/site$PREFIX"

# Lo que es de ChatGPT Sites y aquí sobra o estorba:
#  - `_headers`: Cloudflare solo lee el de la raíz; este se publicaría como fichero
#    y además trae `X-Frame-Options: DENY`, que no aplica aquí.
#  - `robots.txt`, `sitemap.xml`, `llms*.txt`: describen chatgpt.site y en una
#    subcarpeta no los lee nadie. La copia de Elysium no se indexa (`_headers`).
#  - `sw.js`: la copia estática no registra service worker; el origen es de Elysium.
#  - `vinext-client-entry-manifest.json`: manifiesto de compilación.
rm -f "$STAGE/site/"{_headers,robots.txt,sitemap.xml,llms.txt,llms-full.txt,sw.js,vinext-client-entry-manifest.json}

# Red de seguridad: ninguna ruta propia puede quedarse sin prefijo. Las páginas
# solo pueden nombrar `/…` en el payload de React (su propia ruta), nunca en un
# atributo.
bad="$(find "$STAGE/site" -name '*.html' -print0 |
  xargs -0 perl -ne 'print "  $ARGV: $1\n" while m{(?:href|src)="(/(?!Vet-Dr-Valladares/|Vet-Dr-Valladares")[^"]*)"}g')"
if [ -n "$bad" ]; then
  echo "✗ Hay enlaces o recursos sin el prefijo $PREFIX:" >&2
  echo "$bad" | head -20 >&2
  exit 1
fi

echo "▸ Sincronizando en ${DEST}…"
rm -rf "$DEST"
cp -R "$STAGE/site" "$DEST"

echo "✓ Listo: ${DEST}  ($(du -sh "$DEST" | cut -f1))  →  https://elysiumdr.eu$PREFIX/"
