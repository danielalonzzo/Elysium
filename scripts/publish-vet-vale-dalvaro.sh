#!/usr/bin/env bash
# Genera la copia estática de Vale d'Álvaro para el Worker de Elysium.
set -euo pipefail

PREFIX="/vet-vale-dalvaro"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/Prototipos/Vet-Vale-dAlvaro"
OUT="$SRC/dist/client"
DEST="$ROOT$PREFIX"

NEXT_PUBLIC_STATIC_SITE=1 NEXT_PUBLIC_BASE_PATH="$PREFIX" npm --prefix "$SRC" run build

test -s "$OUT/index.html"
test -d "$OUT$PREFIX/_next"

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
rsync -a --exclude='.DS_Store' --exclude='.assetsignore' --exclude='.vite/' \
  --exclude='/_next/' --exclude='/_headers' --exclude='/robots.txt' \
  --exclude='/sitemap.xml' --exclude='/llms*.txt' --exclude='/sw.js' \
  --exclude='/images/novavet/' --exclude='/images/novavet-*' \
  --exclude='/images/products/mascaras-cirurgicas-bemed.jpg' \
  --exclude='/models/valladares-logo-3d.*' \
  --exclude='/vinext-client-entry-manifest.json' "$OUT/" "$STAGE/"
mv "$STAGE$PREFIX/_next" "$STAGE/_next"
rmdir "$STAGE$PREFIX"

bad="$(find "$STAGE" -name '*.html' -print0 |
  xargs -0 perl -ne 'print "$ARGV: $1\n" while /(?:href|src)="(\/(?!\/|vet-vale-dalvaro(?:\/|"))[^"]*)"/g')"
if [ -n "$bad" ]; then
  printf 'Enlaces o recursos fuera de %s:\n%s\n' "$PREFIX" "$bad" >&2
  exit 1
fi

mkdir -p "$DEST"
rsync -a --delete "$STAGE/" "$DEST/"
printf 'Export listo para https://elysiumdr.eu%s/\n' "$PREFIX"
