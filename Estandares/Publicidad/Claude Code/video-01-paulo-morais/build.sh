#!/bin/bash
# Anuncios Elysium λ · Paulo Morais — 1080×1350 (4:5), 60 fps, sin audio.
# Tres piezas independientes en out/.
#
# Cada plano se compone en cuatro capas:
#   fondo de gimnasio  → desenfocado (DoF), gradado y con viñeta
#   aparato            → capa Hardware del mockup 2D de Pixelmator
#   pantalla           → el vídeo, recortado con la máscara de la pantalla
#   sello              → esquina inferior derecha
#
# La pantalla va ENCIMA del aparato porque en estos mockups la capa Hardware
# tiene el panel opaco; la máscara le da las esquinas redondeadas.
set -e
cd "$(dirname "$0")"

SRC="../../Capturas de pantalla de proyectos"
W=1080; H=1350; FPS=60
SEAL=150; SEAL_M=54                  # a 110 px la filigrana se perdía sobre el suelo claro

MAC_X=40;  MAC_Y=370                 # capa 1000×611, pantalla +91,+13 (819×529)
PHO_X=299; PHO_Y=175                 # capa 483×1001, pantalla +18,+16 (446×970)

# Los .mov del Mac son grabaciones de VENTANA: llevan grabado en negro el hueco
# de la sombra de macOS. Sin recortarlo, ese negro entra en el panel y el
# portátil parece tener biseles enormes. Medido con cropdetect y confirmado
# contra el alfa de la captura PNG equivalente (márgenes 56/56/38/74).
CROP_MAC="crop=1544:960:56:38,"
CROP_PHO=""                          # el iPhone graba a pantalla completa

GRADE_MAC="eq=brightness=-0.06:saturation=0.82:contrast=1.06"
GRADE_PHO="eq=brightness=-0.10:saturation=0.88:contrast=1.05"

seal_x=$((W - SEAL - SEAL_M)); seal_y=$((H - SEAL - SEAL_M))

# shot <salida> <fondo> <vídeo> <inicio> <duración> <aparato> <dx> <dy>
#      <sx> <sy> <sw> <sh> <grade> <crop>
shot() {
  local out=$1 bg=$2 vid=$3 ss=$4 dur=$5 dev=$6 dx=$7 dy=$8
  local sx=$9 sy=${10} sw=${11} sh=${12} grade=${13} crop=${14}
  local lw lh
  if [ "$dur" = full ]; then
    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC/$vid")
    dur=$(echo "$dur - $ss" | bc)
  fi
  lw=$(sips -g pixelWidth  "layers/$dev-hardware.png" | tail -1 | tr -dc 0-9)
  lh=$(sips -g pixelHeight "layers/$dev-hardware.png" | tail -1 | tr -dc 0-9)

  # La ventana de Safari (1544×960 = 1,608) es algo más apaisada que el panel
  # del MacBook (1,547). Se escala para CUBRIR y se recorta a los lados: así no
  # queda ni un pixel de bisel, que es justo lo que había que evitar.
  ffmpeg -y -v error \
    -loop 1 -i "assets/$bg" \
    -ss "$ss" -t "$dur" -i "$SRC/$vid" \
    -i "layers/$dev-hardware.png" \
    -i "layers/$dev-mask.png" \
    -i assets/sello-blanco.png \
    -filter_complex "
      [0:v]scale=w=$W:h=$H:force_original_aspect_ratio=increase,crop=$W:$H,
           gblur=sigma=20,$grade,vignette=angle=PI/4.5,format=rgba[bg];
      [1:v]fps=$FPS,${crop}
           scale=w=$sw:h=$sh:force_original_aspect_ratio=increase,crop=$sw:$sh,
           format=rgba,pad=$lw:$lh:$sx:$sy:color=0x00000000[scr];
      [3:v]format=rgba,alphaextract[a];
      [scr][a]alphamerge[scrm];
      [bg][2:v]overlay=$dx:$dy[b1];
      [b1][scrm]overlay=$dx:$dy[b2];
      [4:v]scale=$SEAL:$SEAL[seal];
      [b2][seal]overlay=$seal_x:$seal_y,format=yuv420p[out]" \
    -map "[out]" -r $FPS -t "$dur" \
    -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -an "$out"
}

mac()   { shot "$1" backplate-mac.png    "$2" "$3" "$4" mac    $MAC_X $MAC_Y 91 13 819 529 "$GRADE_MAC" "$CROP_MAC"; }
phone() { shot "$1" backplate-iphone.png "$2" "$3" "$4" iphone $PHO_X $PHO_Y 18 16 446 970 "$GRADE_PHO" "$CROP_PHO"; }

mkdir -p out tmp

# Las piezas 1 y 2 van con la grabación entera, de principio a fin.
echo "1 · escritorio — recorrido del sitio"
mac   out/01-escritorio.mp4 "Paulo Morais - Mac.mov" 0 full

echo "2 · movil — responsividad"
phone out/02-movil.mp4 "Paulo Morais - iPhone.MP4" 0 full

# La grabación de la agenda se queda en negro entre el segundo 6 y el 9
# cerrando sesión: se salta con un corte duro en vez de arrastrar el hueco.
echo "3 · escritorio — agenda y acceso de cliente"
mac   tmp/3a.mp4 "Agenda - Mac.mov" 2.0  3.6
mac   tmp/3b.mp4 "Agenda - Mac.mov" 10.4 4.4
printf "file '../tmp/3a.mp4'\nfile '../tmp/3b.mp4'\n" > tmp/list.txt
ffmpeg -y -v error -f concat -safe 0 -i tmp/list.txt -c copy out/03-agenda.mp4
rm -rf tmp

for f in out/*.mp4; do
  printf '%-24s ' "$f"
  ffprobe -v error -select_streams v:0 \
    -show_entries stream=width,height,r_frame_rate:format=duration \
    -of csv=p=0:nk=1 "$f" | tr '\n' ' '; echo
done
