#!/bin/zsh
set -eu
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

url=${1:-$(pbpaste)}
if [[ ! "$url" =~ '^https://((www\.|m\.)?youtube\.com/(watch\?|shorts/|live/)|youtu\.be/)[^[:space:]]+$' ]]; then
  print -u2 'Copia el enlace de un vídeo de YouTube y vuelve a abrir este archivo.'
  exit 1
fi

for dependency in python3 node ffmpeg ffprobe; do
  if ! command -v "$dependency" >/dev/null; then
    print -u2 "Falta $dependency para descargar vídeos."
    exit 1
  fi
done

runtime="$HOME/Library/Caches/Elysium/YouTube"
engine="$runtime/venv/bin/yt-dlp"
if [[ ! -x "$engine" ]]; then
  mkdir -p "$runtime"
  python3 -m venv "$runtime/venv"
  "$runtime/venv/bin/python" -m pip install 'yt-dlp[default]'
fi

downloads="$HOME/Downloads"
workdir=$(mktemp -d "$downloads/.elysium-video.XXXXXX")
trap 'rm -rf -- "$workdir"' EXIT
print -u2 'Descargando el vídeo en MP4 (hasta 720p)…'

file=$("$engine" --ignore-config --no-playlist \
  --js-runtimes "node:$(command -v node)" \
  -f 'bv[height<=720][vcodec^=avc1]+ba[ext=m4a]/b[height<=720][ext=mp4]' \
  --merge-output-format mp4 --trim-filenames 140 \
  --print after_move:filepath -o "$workdir/%(title)s [%(id)s].%(ext)s" -- "$url")

tracks=$(ffprobe -v error -show_entries stream=codec_type -of csv=p=0 "$file")
if [[ ! -s "$file" ]] || ! grep -qx video <<<"$tracks" || ! grep -qx audio <<<"$tracks"; then
  print -u2 'El archivo descargado está incompleto o no contiene vídeo y audio.'
  exit 1
fi

destination="$downloads/${file:t}"
if ! ln -- "$file" "$destination"; then
  print -u2 'No se pudo guardar el vídeo. Comprueba si ya existe un archivo con el mismo nombre.'
  exit 1
fi
print -r -- "$destination"
