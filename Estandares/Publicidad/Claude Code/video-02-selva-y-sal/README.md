# Vídeos 02 · Selva y Sal

Siete piezas independientes. Seis a 1080×1350 (4:5) y una a 1080×1920 (9:16).
50 fps, sin audio, sello Elysium λ en todas.

Las seis primeras replican, una a una, los seis vídeos de referencia de
`../../Inspiracion/`. La séptima es la vertical para TikTok, que no estaba en la
referencia y se añadió después.

| Archivo | Duración | Encuadre |
|---|---|---|
| `out/01-portada.mp4` | 13,6 s | la tarjeta flotando sobre una copia desenfocada de sí misma |
| `out/02-macbook.mp4` | 12,0 s | el mockup 2D del MacBook sobre un estudio oscuro |
| `out/03-detalle.mp4` | 4,8 s | primer plano del mazo de producto, con bandas negras |
| `out/04-a-sangre.mp4` | 8,8 s | la portada de borde a borde, sin marco |
| `out/05-modo-oscuro.mp4` | 5,4 s | banda ancha centrada: el sitio cambiando de claro a oscuro |
| `out/06-cuadricula.mp4` | 6,0 s | cuatro detalles a la vez, 2×2 |
| `out/07-tiktok.mp4` | 22,0 s | vertical, el recorrido largo |

## Cómo se construye

    bash build.sh            # las siete piezas
    python3 make-layers.py   # solo si cambia el mockup del aparato
    python3 make-backplate.py # solo si cambia la escenografía

`make-layers.py` viene de `../video-01-paulo-morais` sin tocar más que la lista
final: aquí solo se genera el MacBook, porque no hay grabación de móvil de este
proyecto. Parte `mac-2d-source.svg` en dos capas PNG —el aparato con el entorno
transparente y la pantalla en blanco sobre transparente— y escribe su geometría
en `layers/geometry.json`. La capa `Hardware` tiene el panel opaco, así que el
vídeo va **encima** del aparato y la máscara le da las esquinas redondeadas;
por eso hacen falta dos capas y no una.

`make-backplate.py` dibuja lo que no sale de la grabación —el estudio oscuro, la
máscara y la sombra de la tarjeta flotante, y el sello compuesto— y lo rasteriza
con Chrome sin cabeza, igual que las capas del aparato.

## Lo que hay de partida

Una sola grabación: `../../Capturas de pantalla de proyectos/Grabación de
pantalla 2026-08-21 a las 12.27.45 a. m..mov`. 1656×1072, 50 fps, 49,6 s, **sin
pista de audio**. Recorre la portada en modo oscuro, baja por tienda, mayoreo,
expediciones y pie, cambia a modo oscuro en el segundo 18 y vuelve a subir.

Las siete piezas salen de ahí. No hay grabación de móvil, así que no hay pieza
de responsividad; el conjunto de referencia tampoco tenía ninguna.

## Decisiones

**El recorte quita dos cosas, no una.** El `.mov` es una grabación de *ventana*:
lleva grabado en negro el hueco de la sombra de macOS. Dentro va además la barra
compacta de Safari, con la URL a la vista. El contenido limpio de la página
empieza en **(57,90) y mide 1542×908**.

Los 51 px de la barra del navegador se quitan a propósito: los seis vídeos de
referencia están grabados a pantalla completa y no enseñan navegador. Dejarla
habría sido la única diferencia visible entre este conjunto y aquel.

La medición se hizo pixel a pixel sobre un fotograma, no con `cropdetect`. El
filtro devuelve el fotograma entero: el verde oscuro del sitio no es negro puro
y no encuentra el borde. Es el fallo inverso al de Paulo Morais, donde
`cropdetect` sí lo encontraba en el Mac y daba un falso positivo en el iPhone.

**50 fps y no 60.** La grabación es de 50. Subirla a 60 solo duplica fotogramas
de forma desigual y el scroll —que es casi todo lo que pasa en pantalla— se nota
a saltos. La pieza de Paulo Morais iba a 60 porque su grabación iba a 60.

**El sello lleva un disco oscuro detrás.** En Paulo Morais bastaba con la
viñeta, porque aquel sitio era negro de principio a fin. Aquí el sitio cambia a
modo claro a mitad de recorrido y la filigrana blanca desaparecía sobre las
secciones color crema. El disco (42 % de negro, difuminado hasta el borde) no se
ve sobre fondo oscuro y despega el sello sobre fondo claro sin meter ninguna
caja. Se compone una vez en `make-backplate.py` y se reutiliza en las siete.

**El estudio está pintado, no fotografiado.** Selva y Sal es una marca ficticia
—lo dice su propio README— y sus imágenes son SVG generados. Meterle debajo una
fotografía de stock habría sido material ajeno dentro de una pieza que presume
de no tenerlo. El fondo de la pieza 2 se pinta entero con CSS: pared verde casi
negra, suelo de hormigón entrando por la esquina inferior izquierda y la sombra
dura del portátil cruzándolo en diagonal, que es la escena de la referencia. La
línea del suelo cae justo en la base del portátil para que apoye en vez de
flotar.

La carpeta `../../fondo/` está vacía. Si aparece ahí una placa de fondo real,
la pieza 2 puede cambiarse a esa placa tocando solo la entrada `-loop 1 -i` de
`macbook()`.

**El fondo de las piezas 1 y 7 es la propia grabación.** La referencia no usa
escenografía: pone el sitio sobre una ampliación desenfocada de sí mismo, así
que el fondo cambia de color con la página. Sale gratis, no necesita fotografía
y resuelve el mismo problema de marca.

**El aparato se redujo a 900 px.** A 1000 sobre un lienzo de 1080 quedaban 40 px
de margen a cada lado y el portátil se veía embutido. A 900 quedan 90.

**La pieza 4 no tiene paneo.** Meter una página de 1,70 en un 4:5 deja fuera el
53 % del ancho, así que el encuadre tiene que elegir mitad. El primer montaje
llevaba un paneo lento de izquierda a derecha; se descartó porque la ventana
cruza por encima de los titulares y los va partiendo por la mitad de la palabra.
El titular de la portada cambia de lado según el capítulo —del 1 al 3 va a la
izquierda, el 4 a la derecha— así que la pieza son dos planos anclados a lados
opuestos con un corte duro entre medias. Cada uno enseña su titular entero.

**La pieza 3 llega hasta el precio.** El primer encuadre se acercaba 1,54× y
dejaba el dibujo del producto enorme y mudo: sin nombre y sin precio no hay nada
que leer. Se abrió a 1,35× para que entre la ficha completa. También se movió a
la derecha para no dejar entrando por el borde un trozo del titular —«sale / or.»—
que se leía como ruido.

**La cuadrícula va ralentizada, y cada casilla a su ritmo.** La grabación es un
scroll continuo: no se para en ninguna sección más de dos segundos. A velocidad
normal, a mitad de plano las cuatro casillas han bajado y enseñan un titular
cortado por la mitad. Cada casilla se ralentiza con `setpts` hasta que su trozo
cubre los seis segundos.

El factor va por casilla porque no todas necesitan lo mismo: el bloque de «Una
casa pequeña» solo está quieto segundo y medio y necesita 4×, pero como durante
ese rato no se mueve nada, ralentizarlo no se nota. Al mazo de fichas y a los
iconos flotantes, que tienen animación propia, se les da 2,4× para no volverles
el movimiento a trompicones.

Las cuatro casillas se eligieron por lo mismo: son piezas que se bastan solas
dentro de un recorte vertical —una ficha, un bloque de texto corto, una fila de
categorías, unos iconos flotando— y ninguna parte una palabra. Una es de modo
claro y tres de modo oscuro, para que la retícula tenga los dos tonos igual que
la referencia.

**Las duraciones las manda la grabación.** Cada pieza dura lo que está en
pantalla lo que enseña: 4,8 s el mazo de producto, 5,4 s el cambio de tema.
Estirarlas obligaría a arrastrar el scroll siguiente dentro del plano.

**En TikTok el sello no va en la esquina.** Esa esquina la tapa la columna de
botones de la app —perfil, corazón, comentarios, compartir—, que ocupa de los
950 px de alto a los 1750, y debajo van el usuario y el pie de texto. El sello va
centrado bajo la tarjeta, que es la única franja ancha que la interfaz deja
libre; por eso la tarjeta va algo por encima del centro.

**Sin audio.** La grabación no trae pista de sonido, y en Instagram y TikTok el
vídeo arranca silenciado de todos modos. Si se quiere música, se añade en el
montaje final.

## Ajustes rápidos

| Qué | Dónde |
|---|---|
| Duración y punto de entrada | llamadas al final de `build.sh` |
| Casillas de la cuadrícula | argumentos `ss:x:y:ralentí` de `cuadricula` |
| Posición del sello | `SEAL_M` y, en vertical, `TT_SEAL_Y` |
| Tamaño del aparato | `width` en `make-layers.py`, luego regenerar capas y `FLOOR_Y` |
| Luz y suelo del estudio | constantes de `make-backplate.py` |
| Fuerza del desenfoque del fondo | `gblur=sigma=` en `portada()` y `tiktok()` |

## El texto del post

`caption.md` no presenta esto como el lanzamiento de un cliente, porque no lo
es: Selva y Sal es una marca ficticia. Lo presenta como un diseño del catálogo
de Elysium, disponible para adquirir y adaptar dentro de una suscripción y sin
coste de desarrollo. Ahí la ficción deja de ser un pero y pasa a ser el
argumento: el diseño está vacío de marca a propósito.

Ese archivo deja anotadas tres cosas que hay que resolver antes de publicar —el
enlace público, qué plan se puede nombrar y qué no se puede decir del checkout.

## Lo que no lleva

Ninguna pieza de móvil: no hay grabación de iPhone de este proyecto. Cuando la
haya, la función `phone()` de `../video-01-paulo-morais/build.sh` sirve tal cual;
solo hay que generar las capas del iPhone con `make-layers.py`.

Tampoco lleva manos ni escritorio real. Para el *look* de estilo de vida haría
falta una placa rodada —vídeo de unas manos sobre el teclado— y sobre ella sí se
puede hacer seguimiento e incrustar la pantalla con corrección de perspectiva.
