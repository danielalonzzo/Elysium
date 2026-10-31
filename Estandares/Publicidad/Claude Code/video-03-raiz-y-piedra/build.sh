#!/usr/bin/env bash
# Monta las piezas de Raíz y Piedra a partir de una sola captura del sitio.
#
#   bash build.sh                    # captura si hace falta y monta las dos
#   bash build.sh --solo-montaje     # usa los fotogramas ya capturados
#   bash build.sh --solo-montaje tarjeta   # solo una pieza
#
# Las dos piezas salen del MISMO metraje: se captura una vez a 1440×812 y cada
# montaje lo coloca donde le toca. Volver a grabar la portada cuesta ~9 min bajo
# SwiftShader, así que conviene no hacerlo por un cambio de encuadre.
#
# Los fotogramas no viven aquí: son ~1400 JPEG y esta carpeta está en iCloud,
# que ante un volcado así siembra duplicados de conflicto. Van a /private/tmp y
# se pueden borrar sin perder nada, porque se regeneran.
set -euo pipefail
cd "$(dirname "$0")"

FRAMES="${FRAMES_DIR:-/private/tmp/raiz-y-piedra-frames}"
SITE_PORT=4173
SITE_DIR="../../../../λ/Elysium/Prototipos/Demo-arbol/out"
FPS=60
W=1080; H=1350          # 4:5, el formato de las dos referencias
SEAL=118; SEAL_M=42     # tamaño y margen del sello

# Pieza 1 · el iMac. Esquina del aparato y pantalla dentro de él; las imprimen
# make-backplate.py y layers/geometry.json.
DEV_X=70; DEV_Y=400
SCR_X=23; SCR_Y=23; SCR_W=894; SCR_H=504

# Pieza 2 · la tarjeta flotante. Las imprime make-card.py.
CARD_X=68; CARD_Y=409; CARD_W=944; CARD_H=532

# Pieza 3 · el mosaico. El tablero lo genera make-board.py.
MOSAIC_SECS=9

# Pieza 4 · la vertical de TikTok. El aparato lo coloca make-backplate.py.
TT_W=1080; TT_H=1920
TT_DEV_X=70; TT_DEV_Y=251
TT_SEAL_Y=1210

ENC=(-c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -movflags +faststart)

mkdir -p out

# ── el sitio, servido estático ──────────────────────────────────────────────
# Se sirve el EXPORT de producción, no `npm run dev`: el servidor de desarrollo
# pinta su propio distintivo de Next en la esquina y saldría en el vídeo.
serve_site() {
  if curl -fsS -o /dev/null "http://localhost:$SITE_PORT/"; then return; fi
  [ -d "$SITE_DIR" ] || { echo "falta $SITE_DIR: compila con 'npm run build'"; exit 1; }
  python3 -m http.server "$SITE_PORT" -d "$SITE_DIR" >/dev/null 2>&1 &
  echo $! > /tmp/rp-site.pid
  for _ in $(seq 40); do
    curl -fsS -o /dev/null "http://localhost:$SITE_PORT/" && return
    sleep 0.25
  done
  echo "el servidor estático no levantó"; exit 1
}

MODE="${1:-}"
ONLY="${2:-}"

if [ "$MODE" != "--solo-montaje" ]; then
  serve_site
  echo "▸ Capturando el sitio…"
  node run-capture.mjs "$FRAMES"
fi

for seg in 01-portada 02-tienda 03-ficha; do
  [ -d "$FRAMES/$seg" ] || { echo "faltan fotogramas de $seg"; exit 1; }
done

# ── el recorrido, a resolución de captura ───────────────────────────────────
# Se deja a 1440×812 y sin escalar: cada pieza lo reduce a su medida. Escalarlo
# aquí obligaría a rehacerlo al cambiar un encuadre.
if [ ! -f "$FRAMES/_pantalla.mp4" ] || [ "$MODE" != "--solo-montaje" ]; then
  echo "▸ Preparando el recorrido…"
  for seg in 01-portada 02-tienda 03-ficha; do
    ffmpeg -v error -y -framerate $FPS -pattern_type glob -i "$FRAMES/$seg/*.jpg" \
      -vf "format=yuv420p" -c:v libx264 -crf 15 -preset medium "$FRAMES/_$seg.mp4"
  done
  printf "file '%s'\n" "$FRAMES/_01-portada.mp4" "$FRAMES/_02-tienda.mp4" \
    "$FRAMES/_03-ficha.mp4" > "$FRAMES/_lista.txt"
  ffmpeg -v error -y -f concat -safe 0 -i "$FRAMES/_lista.txt" -c copy "$FRAMES/_pantalla.mp4"
fi

# ── Pieza 1 · el iMac sobre el escritorio ───────────────────────────────────
# Orden de capas: escenografía → aparato → la pantalla ENCIMA del aparato.
# El panel del mockup es opaco, así que el vídeo no puede ir debajo; la máscara
# es la que le devuelve las esquinas redondeadas del iMac.
imac() {
  echo "▸ Pieza 1 · iMac…"
  ffmpeg -v error -y \
    -loop 1 -i assets/backplate-escritorio.png \
    -i "$FRAMES/_pantalla.mp4" \
    -i layers/imac-hardware.png \
    -i layers/imac-mask.png \
    -loop 1 -i assets/sello-compuesto.png \
    -filter_complex "
      [0:v]scale=$W:$H,setsar=1[fondo];
      [3:v]format=gray,crop=$SCR_W:$SCR_H:$SCR_X:$SCR_Y[mascara];
      [1:v]scale=$SCR_W:$SCR_H:flags=lanczos,format=yuva420p[pant];
      [pant][mascara]alphamerge[pantcut];
      [fondo][2:v]overlay=$DEV_X:$DEV_Y[conmac];
      [conmac][pantcut]overlay=$((DEV_X+SCR_X)):$((DEV_Y+SCR_Y)):shortest=1[conpant];
      [4:v]scale=$SEAL:$SEAL[sello];
      [conpant][sello]overlay=W-w-$SEAL_M:H-h-$SEAL_M:shortest=1,format=yuv420p[v]
    " -map "[v]" -r $FPS "${ENC[@]}" out/raiz-y-piedra-imac.mp4
}

# ── Pieza 2 · la tarjeta flotante ───────────────────────────────────────────
# El sitio flotando como tarjeta sobre un fondo desenfocado, sin aparato.
#
# La referencia pone detrás una fotografía —una escultura clara sobre follaje— y
# aquí no cabe: «Raíz y Piedra» es una marca inventada y sus imágenes son SVG
# generados, así que una foto de stock sería material ajeno dentro de una pieza
# que presume de no tenerlo.
#
# El primer intento siguió a `../video-02-selva-y-sal`, que en su portada usa el
# sitio sobre una ampliación desenfocada de SÍ MISMO. Allí funciona; aquí no.
# Esta cinemática es casi negra en tres de sus cuatro actos, así que la tarjeta
# y su propio fondo quedaban igual de oscuros: el fotograma entero salía negro,
# sin separación y sin que se viera siquiera la sombra.
#
# La solución es reutilizar el decorado de la pieza 1 —pared cálida y
# escritorio— muy desenfocado. Es un espacio de la misma marca, no hace falta
# arte nuevo, ata las dos piezas como el mismo plató y, sobre todo, da un fondo
# claro constante contra el que la tarjeta siempre se lee.
#
# Ojo con `shortest` en las capas fijas: la sombra es una imagen de un solo
# fotograma y con `shortest=1` el montaje entero salía de 0,016 s. Sin él,
# `overlay` repite el último fotograma, que es lo que se quiere. El sello sí lo
# lleva, porque va con `-loop 1` y sin `shortest` no terminaría nunca.
tarjeta() {
  echo "▸ Pieza 2 · tarjeta…"
  ffmpeg -v error -y \
    -loop 1 -i assets/backplate-escritorio.png \
    -i "$FRAMES/_pantalla.mp4" \
    -i assets/tarjeta-mascara.png \
    -i assets/tarjeta-sombra.png \
    -loop 1 -i assets/sello-compuesto.png \
    -filter_complex "
      [0:v]scale=$W:$H,setsar=1,gblur=sigma=26,
         eq=brightness=-0.04:saturation=1.06:contrast=1.03,
         vignette=angle=PI/4.2,format=rgba[fondo];
      [1:v]scale=$CARD_W:$CARD_H:flags=lanczos,format=rgba[cd];
      [2:v]format=rgba,alphaextract[ma];
      [cd][ma]alphamerge[tarjeta];
      [fondo][3:v]overlay=0:0[consombra];
      [consombra][tarjeta]overlay=$CARD_X:$CARD_Y:shortest=1[contarjeta];
      [4:v]scale=$SEAL:$SEAL[sello];
      [contarjeta][sello]overlay=W-w-$SEAL_M:H-h-$SEAL_M:shortest=1,format=yuv420p[v]
    " -map "[v]" -r $FPS "${ENC[@]}" out/raiz-y-piedra-tarjeta.mp4
}

# ── Pieza 3 · el mosaico ────────────────────────────────────────────────────
# Un moodboard de doce vistas del sitio y una cámara que lo recorre con un
# empuje lento, como la tercera referencia.
#
# El tablero es 4:5 igual que la salida, y no por capricho: `zoompan` recorta
# `iw/zoom × ih/zoom`, que conserva la proporción del ORIGINAL. Con un tablero
# de otra proporción, el escalado al cuadro final lo estiraría.
#
# El zoom va de 1,30 a 2,05. El primer montaje arrancaba en 1,90 y el plano
# abría tan cerrado que solo cabía una lámina: la referencia empieza viendo dos
# o tres, que es lo que cuenta la amplitud. A 1,30 la ventana es de 2000×2500
# sobre el tablero —dos columnas— y al final, en 2,05, una lámina llena el
# cuadro. La cámara cruza en diagonal, de arriba a la izquierda a abajo a la
# derecha, que es el recorrido de la referencia.
mosaico() {
  echo "▸ Pieza 3 · mosaico…"
  local n=$((MOSAIC_SECS * FPS))
  ffmpeg -v error -y \
    -i assets/mosaico.png \
    -loop 1 -i assets/sello-compuesto.png \
    -filter_complex "
      [0:v]zoompan=
             z='1.30+0.75*on/$((n-1))':
             x='(iw-iw/zoom)*(0.10+0.72*on/$((n-1)))':
             y='(ih-ih/zoom)*(0.05+0.85*on/$((n-1)))':
             d=$n:s=${W}x${H}:fps=$FPS,
           format=rgba[board];
      [1:v]scale=$SEAL:$SEAL[sello];
      [board][sello]overlay=W-w-$SEAL_M:H-h-$SEAL_M:shortest=1,format=yuv420p[v]
    " -map "[v]" -r $FPS -t $MOSAIC_SECS "${ENC[@]}" out/raiz-y-piedra-mosaico.mp4
}

# ── Pieza 4 · la vertical para TikTok ───────────────────────────────────────
# La misma escena que la pieza 1, reencuadrada a 9:16. No es un recorte del 4:5:
# el aparato se recoloca y la escenografía se genera aparte, porque lo que manda
# aquí no es la estética sino por dónde pasa la interfaz de la app.
#
# Sobre 1080×1920, TikTok ocupa: la columna de botones —perfil, corazón,
# comentarios, compartir— por la derecha, de y≈950 a y≈1700; el usuario y el pie
# de texto abajo a la izquierda, de y≈1550 a y≈1850; y la barra de progreso al
# borde. Por eso:
#
#   · El aparato sube. Va de y=251 a y=1043, casi entero por encima de la
#     columna de botones; solo el pie del iMac le entra un poco.
#   · EL SELLO NO VA EN LA ESQUINA. Esa esquina la tapan los botones. Va
#     centrado bajo el escritorio, en la única franja ancha que la interfaz
#     deja libre —la misma decisión que en `../video-02-selva-y-sal`—.
#   · Lo que queda debajo es escritorio en penumbra a propósito: es el hueco
#     donde caen el usuario y el pie de texto.
tiktok() {
  echo "▸ Pieza 4 · TikTok…"
  ffmpeg -v error -y \
    -loop 1 -i assets/backplate-escritorio-9x16.png \
    -i "$FRAMES/_pantalla.mp4" \
    -i layers/imac-hardware.png \
    -i layers/imac-mask.png \
    -loop 1 -i assets/sello-compuesto.png \
    -filter_complex "
      [0:v]scale=$TT_W:$TT_H,setsar=1[fondo];
      [3:v]format=gray,crop=$SCR_W:$SCR_H:$SCR_X:$SCR_Y[mascara];
      [1:v]scale=$SCR_W:$SCR_H:flags=lanczos,format=yuva420p[pant];
      [pant][mascara]alphamerge[pantcut];
      [fondo][2:v]overlay=$TT_DEV_X:$TT_DEV_Y[conmac];
      [conmac][pantcut]overlay=$((TT_DEV_X+SCR_X)):$((TT_DEV_Y+SCR_Y)):shortest=1[conpant];
      [4:v]scale=$SEAL:$SEAL[sello];
      [conpant][sello]overlay=(W-w)/2:$TT_SEAL_Y:shortest=1,format=yuv420p[v]
    " -map "[v]" -r $FPS "${ENC[@]}" out/raiz-y-piedra-tiktok.mp4
}

case "$ONLY" in
  imac)     imac ;;
  tarjeta)  tarjeta ;;
  mosaico)  mosaico ;;
  tiktok)   tiktok ;;
  *)        imac; tarjeta; mosaico; tiktok ;;
esac

[ -f /tmp/rp-site.pid ] && kill "$(cat /tmp/rp-site.pid)" 2>/dev/null && rm -f /tmp/rp-site.pid

for f in out/*.mp4; do
  printf "%-42s %s\n" "$f" \
    "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" | cut -c1-5)s  $(du -h "$f" | cut -f1)"
done
