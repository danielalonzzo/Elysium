#!/bin/bash
# Anuncios Elysium λ · Selva y Sal — 50 fps, sin audio.
# Siete piezas independientes en out/. Las seis primeras van a 1080×1350 (4:5),
# una por cada vídeo de referencia; la séptima es la vertical de TikTok.
#
# Todas salen de la MISMA grabación de escritorio. Lo que cambia de una a otra
# es el encuadre, que es justo lo que hace el conjunto de referencia:
#
#   1 portada      la tarjeta flotando sobre una copia desenfocada de sí misma
#   2 macbook      el mockup 2D sobre un estudio oscuro
#   3 detalle      primer plano del mazo de producto, con bandas
#   4 a sangre     la portada a pantalla completa, anclada al titular
#   5 modo oscuro  banda ancha centrada: el sitio cambiando de claro a oscuro
#   6 cuadrícula   cuatro detalles a la vez, 2×2
#   7 tiktok       1080×1920, el recorrido largo
#
# El sello va abajo a la derecha en las seis primeras. En la de TikTok va
# centrado bajo la tarjeta: esa esquina la tapa la interfaz de la app.
set -e
cd "$(dirname "$0")"

SRCDIR="../../Capturas de pantalla de proyectos"
SRC=$(ls "$SRCDIR"/Grabaci*12.27.45*.mov | head -1)

W=1080; H=1350; FPS=50               # la grabación es de 50 fps: subir a 60
                                     # solo duplicaría fotogramas y el scroll
                                     # se notaría a saltos.

# La grabación es de VENTANA: lleva grabado en negro el hueco de la sombra de
# macOS, y dentro la barra compacta de Safari. El contenido limpio de la página
# empieza en (57,90) y mide 1542×908 — medido pixel a pixel sobre un fotograma,
# no con cropdetect: el filtro no encuentra el borde porque el verde oscuro del
# sitio no es negro puro. Quitar la barra del navegador es lo que deja el
# encuadre igual que en las referencias, que están grabadas a pantalla completa.
PAGE="crop=1542:908:57:90"

# El sello se compone aparte (make-backplate.py) con un disco oscuro difuso
# detrás: el sitio pasa de claro a oscuro dentro de la misma pieza y la
# filigrana blanca sola desaparecía sobre las secciones color crema.
SEAL=150; SEAL_M=54; SEAL_PAD=30     # el PNG mide 420 y se pinta a 210
SEAL_BOX=$((SEAL + 2 * SEAL_PAD))
sx=$((W - SEAL_M - SEAL - SEAL_PAD))
sy=$((H - SEAL_M - SEAL - SEAL_PAD))
SEAL_IN="[SEALIDX:v]scale=$SEAL_BOX:$SEAL_BOX[seal]"

ENC=(-c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -an
     -color_primaries bt709 -color_trc bt709 -colorspace bt709
     -movflags +faststart)

mkdir -p out tmp

# ---------------------------------------------------------------------------
# 1 · portada — la tarjeta sobre una copia desenfocada de sí misma
#
# La referencia no usa fondo de estudio: pone el sitio sobre una ampliación
# borrosa del propio sitio, así que el fondo cambia de color con la página.
# Aquí sale gratis y además resuelve el problema de marca: Selva y Sal es
# ficticia y no tiene fotografía propia que poner detrás.
# ---------------------------------------------------------------------------
portada() {
  local out=$1 ss=$2 dur=$3
  ffmpeg -y -v error -ss "$ss" -t "$dur" -i "$SRC" \
    -i assets/tarjeta-mascara.png -i assets/tarjeta-sombra.png \
    -i assets/sello-compuesto.png \
    -filter_complex "
      [0:v]fps=$FPS,$PAGE,split=2[a][b];
      [a]scale=w=$W:h=$H:force_original_aspect_ratio=increase,crop=$W:$H,
         gblur=sigma=34,eq=brightness=-0.17:saturation=1.12:contrast=1.06,
         vignette=angle=PI/4.2,format=rgba[bg];
      [b]scale=920:542,format=rgba[cd];
      [1:v]format=rgba,alphaextract[ma];
      [cd][ma]alphamerge[card];
      [bg][2:v]overlay=0:0[b1];
      [b1][card]overlay=80:404[b2];
      ${SEAL_IN/SEALIDX/3};
      [b2][seal]overlay=$sx:$sy,format=yuv420p[out]" \
    -map "[out]" -r $FPS -t "$dur" "${ENC[@]}" "$out"
}

# ---------------------------------------------------------------------------
# 2 · macbook — el mockup 2D sobre el estudio oscuro
#
# La pantalla va ENCIMA del aparato: en este mockup la capa Hardware tiene el
# panel opaco, así que el vídeo no puede ir debajo. La máscara le da las
# esquinas redondeadas y tapa la muesca.
#
# La página (1542×908 = 1,698) es más apaisada que el panel (737×476 = 1,548).
# Se escala para CUBRIR y se recorta ~4,4 % a cada lado: así no queda ni un
# pixel de bisel a la vista, que es el error que delata un mockup.
# ---------------------------------------------------------------------------
MAC_X=90; MAC_Y=430                  # capa 900×550, pantalla +81,+12 (737×476)
macbook() {
  local out=$1 ss=$2 dur=$3
  ffmpeg -y -v error \
    -loop 1 -i assets/backplate-estudio.png \
    -ss "$ss" -t "$dur" -i "$SRC" \
    -i layers/mac-hardware.png -i layers/mac-mask.png \
    -i assets/sello-compuesto.png \
    -filter_complex "
      [0:v]format=rgba[bg];
      [1:v]fps=$FPS,$PAGE,
           scale=w=737:h=476:force_original_aspect_ratio=increase,crop=737:476,
           eq=brightness=-0.02:saturation=1.04:contrast=1.03,
           format=rgba,pad=900:550:81:12:color=0x00000000[scr];
      [3:v]format=rgba,alphaextract[a];
      [scr][a]alphamerge[scrm];
      [bg][2:v]overlay=$MAC_X:$MAC_Y[b1];
      [b1][scrm]overlay=$MAC_X:$MAC_Y[b2];
      ${SEAL_IN/SEALIDX/4};
      [b2][seal]overlay=$sx:$sy,format=yuv420p[out]" \
    -map "[out]" -r $FPS -t "$dur" "${ENC[@]}" "$out"
}

# ---------------------------------------------------------------------------
# 3 · detalle — primer plano con bandas arriba y abajo
#
# 800×518 de la página estirados a 1080×700: 1,35× de aumento. Es el encuadre
# de la referencia, que se acerca a un carrusel de fichas hasta que se leen los
# nombres, y por eso la ventana tiene que llegar hasta el precio: acercarse solo
# al dibujo deja un primer plano bonito y mudo.
# ---------------------------------------------------------------------------
BAND_H=700; BAND_Y=$(( (1350 - 700) / 2 ))
CROP_W=800; CROP_H=518
detalle() {
  local out=$1 ss=$2 dur=$3 px=$4 py=$5
  ffmpeg -y -v error -f lavfi -t "$dur" -i "color=c=black:s=${W}x${H}:r=$FPS" \
    -ss "$ss" -t "$dur" -i "$SRC" -i assets/sello-compuesto.png \
    -filter_complex "
      [1:v]fps=$FPS,$PAGE,crop=$CROP_W:$CROP_H:$px:$py,scale=$W:$BAND_H,
           eq=brightness=-0.01:saturation=1.05:contrast=1.03[band];
      [0:v][band]overlay=0:$BAND_Y[b1];
      ${SEAL_IN/SEALIDX/2};
      [b1][seal]overlay=$sx:$sy,format=yuv420p[out]" \
    -map "[out]" -r $FPS -t "$dur" "${ENC[@]}" "$out"
}

# ---------------------------------------------------------------------------
# 4 · a sangre — sin marco, de borde a borde
#
# Meter una página de 1,70 dentro de un 4:5 deja fuera el 53 % del ancho, así
# que el encuadre tiene que elegir mitad. El primer intento fue un paneo lento
# de izquierda a derecha, y se descartó: la ventana cruza por encima de los
# titulares y los va partiendo por la mitad de la palabra. Aquí el titular
# cambia de lado con el capítulo —del 1 al 3 va a la izquierda, el 4 a la
# derecha— así que cada plano se ancla al lado donde está el texto y no se
# mueve. El corte duro entre los dos es el que separa los dos capítulos.
# ---------------------------------------------------------------------------
FULL_W=2293                          # 1542 escalado a 1350 de alto
sangre() {
  local out=$1 ss=$2 dur=$3 px=$4
  ffmpeg -y -v error -ss "$ss" -t "$dur" -i "$SRC" \
    -i assets/sello-compuesto.png \
    -filter_complex "
      [0:v]fps=$FPS,$PAGE,scale=$FULL_W:$H,crop=$W:$H:$px:0,
           eq=brightness=-0.01:saturation=1.05:contrast=1.03[v];
      ${SEAL_IN/SEALIDX/1};
      [v][seal]overlay=$sx:$sy,format=yuv420p[out]" \
    -map "[out]" -r $FPS -t "$dur" "${ENC[@]}" "$out"
}

# ---------------------------------------------------------------------------
# 5 · modo oscuro — banda ancha centrada sobre negro
#
# La página entera cabe a lo ancho (1080×636) y el resto es negro. Es el
# encuadre que la referencia reserva para un momento concreto; aquí ese momento
# es el cambio de tema, que tarda algo menos de dos segundos.
# ---------------------------------------------------------------------------
WIDE_H=636; WIDE_Y=$(( (1350 - 636) / 2 ))
banda() {
  local out=$1 ss=$2 dur=$3
  ffmpeg -y -v error -f lavfi -t "$dur" -i "color=c=black:s=${W}x${H}:r=$FPS" \
    -ss "$ss" -t "$dur" -i "$SRC" -i assets/sello-compuesto.png \
    -filter_complex "
      [1:v]fps=$FPS,$PAGE,scale=$W:$WIDE_H[band];
      [0:v][band]overlay=0:$WIDE_Y[b1];
      ${SEAL_IN/SEALIDX/2};
      [b1][seal]overlay=$sx:$sy,format=yuv420p[out]" \
    -map "[out]" -r $FPS -t "$dur" "${ENC[@]}" "$out"
}

# ---------------------------------------------------------------------------
# 6 · cuadrícula — cuatro detalles a la vez
#
# 532×667 cada uno, 16 px de calle: 532·2+16 = 1080 y 667·2+16 = 1350, así que
# la retícula llega justa a los cuatro bordes. Cada casilla es un momento
# distinto de la misma grabación, y como son vídeo se mueven solas.
#
# A velocidad normal no funciona. La grabación es un scroll continuo: no se para
# en ninguna sección más de dos segundos, así que a mitad de plano las cuatro
# casillas han bajado y enseñan otra cosa —normalmente un titular cortado por la
# mitad, que es lo que peor queda—. Cada casilla se ralentiza con setpts hasta
# que su trozo de grabación cubre los seis segundos del plano.
#
# El factor va por casilla, no global, y es lo que aguanta la pieza: el bloque
# de «Una casa pequeña» solo se está quieto segundo y medio y necesita 4×, pero
# como durante ese rato no se mueve nada, ralentizarlo no se nota. Al mazo de
# fichas y a los iconos flotantes, que sí tienen animación propia, se les da
# 2,4× para no volverles el movimiento a trompicones.
#
# Las cuatro casillas se eligieron por lo mismo: son piezas que se bastan solas
# dentro de un recorte vertical —una ficha, un bloque de texto corto, una fila
# de categorías, unos iconos flotando— y ninguna parte una palabra por la mitad.
# Una es de modo claro y tres de modo oscuro, para que la retícula tenga los dos
# tonos igual que la referencia.
# ---------------------------------------------------------------------------
PW=532; PH=667; GAP=16
CW=480; CH=602                       # recorte en la página, misma proporción
cuadricula() {
  local out=$1 dur=$2; shift 2
  local args=() fc="" i=1
  for spec in "$@"; do               # spec = ss:x:y:ralentí
    IFS=: read -r ss px py slow <<<"$spec"
    args+=(-ss "$ss" -t "$(echo "$dur / $slow" | bc -l)" -i "$SRC")
    fc+="[$i:v]$PAGE,crop=$CW:$CH:$px:$py,scale=$PW:$PH,"
    fc+="setpts=$slow*PTS,fps=$FPS,"
    fc+="eq=brightness=-0.01:saturation=1.05:contrast=1.03[p$i];"
    i=$((i + 1))
  done
  ffmpeg -y -v error -f lavfi -t "$dur" -i "color=c=black:s=${W}x${H}:r=$FPS" \
    "${args[@]}" -i assets/sello-compuesto.png \
    -filter_complex "
      $fc
      [0:v][p1]overlay=0:0[g1];
      [g1][p2]overlay=$((PW + GAP)):0[g2];
      [g2][p3]overlay=0:$((PH + GAP))[g3];
      [g3][p4]overlay=$((PW + GAP)):$((PH + GAP))[g4];
      ${SEAL_IN/SEALIDX/5};
      [g4][seal]overlay=$sx:$sy,format=yuv420p[out]" \
    -map "[out]" -r $FPS -t "$dur" "${ENC[@]}" "$out"
}

# ---------------------------------------------------------------------------
# 7 · tiktok — 1080×1920 (9:16), la única pieza vertical
#
# Mismo tratamiento que la pieza 1 —la tarjeta sobre su propio desenfoque—
# porque es el que mejor aguanta el cambio de proporción: la página no se
# recorta, solo cambia cuánto fondo hay alrededor.
#
# El sello NO va abajo a la derecha aquí. Esa esquina es donde TikTok pinta su
# columna de botones (perfil, corazón, comentarios, compartir), que ocupa de
# los 950 px de alto a los 1750, y debajo van el usuario y el pie de texto. El
# sello va centrado justo bajo la tarjeta, que es la única franja ancha que la
# interfaz deja libre; por eso la tarjeta se sube unos 60 px sobre el centro.
# ---------------------------------------------------------------------------
TT_W=1080; TT_H=1920
TT_CARD_X=40; TT_CARD_Y=680           # tarjeta 1000×589
TT_SEAL_X=$(( (TT_W - SEAL_BOX) / 2 ))
TT_SEAL_Y=1330
tiktok() {
  local out=$1 ss=$2 dur=$3
  ffmpeg -y -v error -ss "$ss" -t "$dur" -i "$SRC" \
    -i assets/tarjeta-mascara-9x16.png -i assets/tarjeta-sombra-9x16.png \
    -i assets/sello-compuesto.png \
    -filter_complex "
      [0:v]fps=$FPS,$PAGE,split=2[a][b];
      [a]scale=w=$TT_W:h=$TT_H:force_original_aspect_ratio=increase,
         crop=$TT_W:$TT_H,gblur=sigma=40,
         eq=brightness=-0.17:saturation=1.12:contrast=1.06,
         vignette=angle=PI/4.2,format=rgba[bg];
      [b]scale=1000:589,format=rgba[cd];
      [1:v]format=rgba,alphaextract[ma];
      [cd][ma]alphamerge[card];
      [bg][2:v]overlay=0:0[b1];
      [b1][card]overlay=$TT_CARD_X:$TT_CARD_Y[b2];
      ${SEAL_IN/SEALIDX/3};
      [b2][seal]overlay=$TT_SEAL_X:$TT_SEAL_Y,format=yuv420p[out]" \
    -map "[out]" -r $FPS -t "$dur" "${ENC[@]}" "$out"
}

# ---------------------------------------------------------------------------

echo "1 · portada — la tarjeta sobre su propio desenfoque"
portada   out/01-portada.mp4     0.4  13.6

echo "2 · macbook — mockup sobre estudio oscuro"
macbook   out/02-macbook.mp4    37.6  12.0

# El mazo se queda quieto pasando fichas entre el 33,6 y el 38,4; a partir de
# ahí la página baja a las categorías. La pieza dura lo que dura el mazo.
echo "3 · detalle — el mazo de producto de cerca"
detalle   out/03-detalle.mp4    33.6   4.8   700 220

# Dos planos anclados a lados opuestos, con corte duro entre capítulos.
echo "4 · a sangre — portada de borde a borde"
sangre    tmp/4a.mp4             0.4   4.6      0    # capítulos 1-3, texto a la izquierda
sangre    tmp/4b.mp4            41.8   4.2   1213    # capítulo 4, texto a la derecha
printf "file '../tmp/4a.mp4'\nfile '../tmp/4b.mp4'\n" > tmp/list.txt
ffmpeg -y -v error -f concat -safe 0 -i tmp/list.txt -c copy out/04-a-sangre.mp4

echo "5 · modo oscuro — el sitio cambiando de tema"
banda     out/05-modo-oscuro.mp4 17.0   5.4

# ss : x : y : ralentí — el ralentí sale de cuánto aguanta quieta cada sección.
echo "6 · cuadrícula — cuatro detalles"
cuadricula out/06-cuadricula.mp4 6.0 \
  8.3:790:130:2.4   20.8:60:120:4.0 \
  38.8:135:306:3.0  29.8:820:120:2.4

# La única vertical. Lleva el recorrido largo —portada, tienda, mayoreo,
# expediciones y el cambio a modo oscuro— porque en TikTok el vídeo se ve
# entero y no como una tarjeta más de un carrusel.
echo "7 · tiktok — 9:16 vertical"
tiktok    out/07-tiktok.mp4      0.4  22.0

rm -rf tmp

for f in out/*.mp4; do
  printf '%-26s ' "$f"
  ffprobe -v error -select_streams v:0 \
    -show_entries stream=width,height,r_frame_rate:format=duration \
    -of csv=p=0:nk=1 "$f" | tr '\n' ' '; echo
done
