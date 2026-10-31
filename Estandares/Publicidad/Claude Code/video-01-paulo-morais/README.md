# Vídeos 01 · Paulo Morais

Tres piezas independientes. 1080×1350 (4:5) · 60 fps · sin audio.

| Archivo | Duración | Contenido |
|---|---|---|
| `out/01-escritorio.mp4` | 14,8 s | recorrido del sitio en MacBook (grabación entera) |
| `out/02-movil.mp4` | 37 s | responsividad en iPhone (grabación entera) |
| `out/03-agenda.mp4` | 8 s | resumen de agenda y acceso de cliente |

## Cómo se construye

    bash build.sh          # las tres piezas
    python3 make-layers.py # solo si cambian los mockups de aparato

`make-layers.py` parte un mockup 2D de Pixelmator (`*-model-2d.svg`) en dos
capas PNG y escribe su geometría en `layers/geometry.json`:

- `<aparato>-hardware.png` — el aparato, con el entorno transparente
- `<aparato>-mask.png` — la pantalla en blanco sobre transparente

En estos mockups la capa `Hardware` tiene el **panel opaco**, así que el vídeo
no puede ir debajo: va encima del aparato y la máscara le da las esquinas
redondeadas del panel. Ese es el motivo de que hagan falta dos capas y no una.

## Decisiones

**El recorte de las grabaciones del Mac.** Los `.mov` son grabaciones de
**ventana**, no de pantalla completa: llevan grabado en negro el hueco de la
sombra de macOS. Sin recortarlo, ese negro entra dentro del panel y el portátil
parece tener biseles enormes. El contenido real es **1544×960 a partir de
(56,38)** dentro de un fotograma de 1656×1072 — medido con `cropdetect` y
confirmado contra el alfa de la captura PNG equivalente (márgenes 56/56/38/74).

El del iPhone **no se recorta**: graba a pantalla completa. `cropdetect` sugiere
un recorte ahí, pero es un falso positivo — la web de Paulo Morais es negra y
el filtro confunde el fondo de la página con bandas.

**Escalado para cubrir.** La ventana de Safari (1544×960 = 1,608) es algo más
apaisada que el panel del MacBook (3456×2234 = 1,547, un 16" real). Se escala
para cubrir y se recorta ~1,6 % a cada lado, en vez de ajustar por ancho, para
que no quede ni un pixel de bisel visible.

**La muesca del MacBook, tapada.** En el mockup la muesca está recortada en el
propio path de la pantalla, así que el aparato la pintaba por encima del vídeo.
La máscara la rellena (`cover_notch=True` en `make-layers.py`) y la imagen pasa
por delante. Decisión de marca: el portátil real la tiene, pero no conviene
fijarla en una pieza que va a seguir circulando cuando ya no exista.

**Duraciones.** Las piezas 1 y 2 llevan la grabación completa (`full` en la
llamada). La 3 no puede: ver abajo.

**El corte dentro de la pieza 3.** La grabación de la agenda se queda en negro
entre el segundo 6 y el 9 cerrando sesión. La pieza salta ese hueco con un
corte duro entre el resumen de agenda y el acceso de cliente.

**Sello a 150 px.** A 110 la filigrana blanca desaparecía sobre el suelo claro
desenfocado. La viñeta (`vignette=angle=PI/4.5`) cierra las esquinas y le da
fondo.

**Sin audio.** Las grabaciones traen el sonido del sistema y en Instagram el
vídeo arranca silenciado. Si se quiere música, se añade en el montaje final.

## Ajustes rápidos

| Qué | Dónde |
|---|---|
| Duración y punto de entrada | llamadas a `mac` / `phone` al final de `build.sh` |
| Formato 9:16 (Reels) | `W`/`H` y las posiciones `MAC_Y` / `PHO_Y` |
| Fuerza del desenfoque | `gblur=sigma=20` |
| Gradación del fondo | `GRADE_MAC` / `GRADE_PHO` |
| Tamaño del aparato | `width` en `make-layers.py`, luego regenerar capas |

## Lo que no lleva

Manos. Los dispositivos van limpios sobre el gimnasio desenfocado. Para el look
*lifestyle* de las referencias haría falta una placa real —vídeo de las manos
sobre el teclado— y sobre ella sí se puede hacer seguimiento e incrustar la
pantalla con corrección de perspectiva.
