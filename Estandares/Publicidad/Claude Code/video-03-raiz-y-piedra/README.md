# Vídeo 03 · Raíz y Piedra

Cuatro piezas a 60 fps, sin audio, con el sello Elysium λ. Tres en 4:5 y una
vertical para TikTok. **Las cuatro salen del mismo metraje**: el sitio se graba
una sola vez y cada montaje lo usa a su manera.

| Archivo | Formato | Duración | Referencia | Encuadre |
|---|---|---|---|---|
| `out/raiz-y-piedra-imac.mp4` | 1080×1350 | 23,0 s | `…5-25-11….mov` | un iMac sobre un escritorio de madera contra una pared cálida |
| `out/raiz-y-piedra-tarjeta.mp4` | 1080×1350 | 23,0 s | `…5-27-11….mov` | el sitio flotando como tarjeta sobre un fondo desenfocado, sin aparato |
| `out/raiz-y-piedra-mosaico.mp4` | 1080×1350 | 9,0 s | `…5-29-03….mov` | un moodboard de doce vistas y una cámara que lo recorre |
| `out/raiz-y-piedra-tiktok.mp4` | 1080×1920 | 23,0 s | la pieza 1, reencuadrada | la misma escena del iMac, colocada para la interfaz de TikTok |

Las dos referencias están archivadas en `../../Inspiracion/`. Ojo con sus
nombres: llevan un ESPACIO ESTRECHO SIN SALTO (U+202F) antes de «p. m.», así que
en la terminal hay que llegar a ellos por comodín, no escribiéndolos.

Las dos primeras enseñan el mismo recorrido de 23 s; la tercera son doce
fotogramas sueltos de ese mismo recorrido.

El recorrido son tres tramos encadenados con corte duro:

| Tramo | Duración | Contenido |
|---|---|---|
| `01-portada` | 17,0 s | los cuatro actos: guanacaste → travesía por la copa → esfera del Diquís → las 80 cartas; luego las secciones y el bento |
| `02-tienda` | 3,2 s | la cabecera de la colección y la rejilla |
| `03-ficha` | 2,8 s | «Raíz y Piedra · El Juego», hasta la ficha técnica |

## Cómo se construye

    bash build.sh                          # captura y monta las dos
    bash build.sh --solo-montaje
    bash build.sh --solo-montaje tarjeta   # una pieza: imac|tarjeta|mosaico|tiktok
    python3 make-layers.py     # solo si cambia el mockup del aparato
    python3 make-backplate.py  # solo si cambia la escenografía
    python3 make-card.py       # solo si cambia la tarjeta flotante
    python3 make-board.py <carpeta>   # el tablero del mosaico
    node run-capture.mjs <carpeta> [tramo…]   # regrabar un tramo suelto

El recorrido intermedio se guarda sin escalar, a 1440×812, y cada pieza lo
reduce a su medida. Así cambiar un encuadre no obliga a regrabar: la portada
son 1020 fotogramas y bajo SwiftShader tarda unos nueve minutos.

## Lo que hay de partida — y lo que no

**No hay grabación de pantalla de este proyecto.** Los vídeos 01 y 02 partían de
un `.mov` de `../../Capturas de pantalla de proyectos/`; esa carpeta está vacía.
Así que el metraje se genera: `capture.mjs` pilota Chrome sin cabeza por CDP y
escribe la secuencia de fotogramas.

Sale ganando. El scroll deja de ser un pulso de rueda y pasa a ser un guion:
`run-capture.mjs` lo define con claves «segundo → fracción de la página», así
que la cinemática se detiene donde hay algo que mirar —la cartela de la esfera,
las cartas ya desplegadas— y no pasa de largo. Regrabar un tramo con otro ritmo
es cambiar cuatro números.

## Decisiones de la pieza 4 · la vertical de TikTok

**No es un recorte del 4:5.** El aparato se recoloca y la escenografía se genera
aparte, en 1080×1920, porque lo que manda no es la estética sino por dónde pasa
la interfaz de la app. Sobre ese lienzo TikTok ocupa la columna de botones por
la derecha (y≈950 a 1700), el usuario y el pie de texto abajo a la izquierda
(y≈1550 a 1850) y la barra de progreso al borde.

De ahí salen las tres decisiones:

- **El aparato sube.** Va de y=251 a y=1043, así que la pantalla —lo único que
  hay que leer— queda entera por encima de la columna de botones. Solo el pie
  del iMac le entra un poco, y ahí no hay nada que mirar.
- **El sello NO va en la esquina.** Esa esquina la tapan los botones. Va
  centrado bajo el escritorio, en la única franja ancha que la interfaz deja
  libre. Es la misma decisión que en `../video-02-selva-y-sal`.
- **La mitad inferior queda vacía a propósito.** Es escritorio en penumbra, y es
  el hueco donde caen el usuario y el pie de texto. Fuera de la app se ve
  desahogada; dentro, es exactamente el sitio que hace falta.

`make-backplate.py` genera los dos fondos de una pasada, desde la misma función:
solo cambian el lienzo y las tres fracciones que sitúan el escritorio.

## Decisiones de la pieza 3 · el mosaico

**Láminas fijas, no vídeo en cada casilla.** Lo que cuenta el plano es la
amplitud —cuántas caras distintas tiene el sitio—, y doce casillas
reproduciendo a la vez el mismo recorrido enseñarían doce veces el mismo
instante. Doce fotogramas elegidos enseñan doce momentos. De paso evita doce
decodificaciones simultáneas.

**El tablero es 4:5, como la salida, y eso no es opcional.** `zoompan` recorta
`iw/zoom × ih/zoom`, que conserva la proporción del original; con un tablero de
otra proporción, el escalado al cuadro final lo estiraría.

**Los índices de fotograma se comprobaron uno a uno.** Estimarlos por el guion
de cámara —«la esfera cae sobre el segundo 7»— daba números del acto siguiente:
el primer tablero salió con el árbol dos veces y «El juego de mesa» otras dos.
Hay que mirar los JPEG antes de fijarlos.

**El plano abre ancho.** El primer montaje arrancaba con zoom 1,90 y solo cabía
una lámina; la referencia empieza viendo dos o tres, que es lo que comunica la
amplitud. Ahora va de 1,30 a 2,05: entra con dos columnas a la vista y termina
con una lámina llenando el cuadro.

## Decisiones de la pieza 2 · la tarjeta

**Medida sobre la referencia:** la tarjeta ocupa 1032×578 en (73, 446) de un
cuadro de 1180×1460 — el 87,5 % del ancho y centrada en vertical. Aquí son
944×532 en (68, 409), conservando la proporción de la captura (1,7734) para que
el sitio no se deforme.

**El fondo NO es una fotografía, y tampoco el propio sitio.** La referencia pone
detrás una foto —una escultura clara sobre follaje—, y eso queda descartado por
lo de siempre: la marca es inventada y sus imágenes son SVG generados, así que
una foto de stock sería material ajeno.

El primer intento siguió a `../video-02-selva-y-sal`, que en su portada usa el
sitio sobre una ampliación desenfocada de **sí mismo**. Allí funciona; aquí no.
Esta cinemática es casi negra entre el segundo 2,4 y el 8,4, así que la tarjeta
y su propio fondo quedaban igual de oscuros: el fotograma salía negro entero,
sin separación y sin que se viera ni la sombra.

Lo que se usa es el **decorado de la pieza 1 —pared y escritorio— muy
desenfocado**. Es un espacio de la misma marca, no hace falta arte nuevo, ata
las dos piezas como el mismo plató y da un fondo claro constante contra el que
la tarjeta siempre se lee.

**Cuidado con `shortest` en las capas fijas.** La sombra es una imagen de un
solo fotograma: con `shortest=1` en su `overlay`, el montaje entero salía de
0,016 s. Sin él, `overlay` repite el último fotograma, que es lo que se quiere.
El sello sí lo lleva, porque va con `-loop 1` y sin `shortest` no terminaría.

**Y `#` no es un comentario dentro de un filtergraph.** Poner uno hace fallar la
llamada entera con «Invalid argument». Las explicaciones van fuera, como
comentario de shell.

## Decisiones de la pieza 1 · el iMac

**El iMac es el mockup 2D, no el modelo 3D.** `../../imac-2021-3d/` existe, pero
su fuente es un `.rar` que hay que abrir en Blender, y aquí no hay Blender. El
2D es además el camino del precedente y basta: la referencia es un plano frontal
sin paralaje.

**El SVG del iMac no trae capa `Display`.** El del MacBook sí, y por eso
`../video-02-selva-y-sal/make-layers.py` podía leer el rectángulo de pantalla
del propio archivo. Aquí solo hay `Hardware`, así que la pantalla se **mide
sobre el PNG ya rasterizado**, buscando la mancha oscura opaca dentro del marco:
sale (23, 23) 894×504, que es 16:9 con dos milésimas de margen. De ahí viene el
tamaño de captura, 1440×812.

**Tiempo virtual en la portada, reloj de pared en las otras dos.** Bajo
SwiftShader cada captura cuesta cientos de milisegundos. Si el reloj de la
página corriera mientras tanto, el viento de la copa y los `scrub` de GSAP
(0,4 s en la portada, 1 s en el carrusel) avanzarían ese mismo rato entre
fotograma y fotograma: el follaje saldría hirviendo. `Emulation.setVirtualTimePolicy`
congela el reloj y lo avanza 1/60 s exacto por fotograma.

En la tienda y en la ficha ese mismo mecanismo estorba. No tienen animación
propia, y con el reloj congelado `Page.captureScreenshot` se queda esperando un
fotograma del compositor que no llega: fallaba siempre en el mismo, el 37 de la
ficha, justo cuando el scroll se despega de cero, y ni tres reintentos con
empujón de tiempo lo desbloqueaban. Para una página quieta el reloj de pared da
exactamente el mismo resultado.

**Un Chrome por tramo.** Al terminar un tramo el reloj virtual queda pausado, y
con ese estado la navegación siguiente no completa nunca: no corren
temporizadores ni llega `load`. El síntoma desconcierta porque el primer tramo
siempre sale bien y el segundo se cuelga sin decir nada. Relanzar cuesta 0,7 s.

**El scroll se fuerza instantáneo.** El sitio lleva `html { scroll-behavior:
smooth }`, así que `scrollTo` anima hasta el destino. Con el reloj virtual eso
significa avanzar 16 ms por fotograma: el primer montaje se pasó 24 fotogramas
enteros sin salir de la escena I, con el titular clavado en pantalla. Se
inyecta `scroll-behavior:auto` **desde la captura**, no tocando el sitio, donde
el scroll suave es una función buena.

**Se graba el export de producción, no `npm run dev`.** El servidor de
desarrollo pinta su propio distintivo de Next en la esquina y saldría en el
vídeo.

**La escenografía está pintada, no fotografiada.** Misma razón que en
`../video-02-selva-y-sal`: «Raíz y Piedra» es una marca inventada y sus imágenes
son SVG generados, así que una fotografía de stock sería material ajeno —y con
licencia de otro— dentro de una pieza que presume de no tener ninguno. Los
colores sí están muestreados de la referencia, franja a franja: la pared da
(216,200,177) arriba, el canto del escritorio (93,58,34).

**El escritorio va desenfocado.** En la referencia la cámara enfoca la pantalla
y la madera del primer término sale suave. Sin ese desenfoque la escena se lee
como un montaje: tres bandas de color con bordes de vector. Se aplica con una
máscara en degradado para que la transición no marque escalón.

**Nada de sombra del cuerpo sobre la pared.** El primer intento la llevaba y se
veía como una mancha gris rectangular detrás del monitor. En la referencia la
pared está limpia; lo único que queda es un rebote cálido muy tenue.

**El sello lleva disco y se compone con PIL.** Sobre madera clara la filigrana
blanca se pierde, así que va sobre un disco negro difuminado, como en el vídeo
02. Se compone con PIL y no rasterizando CSS en Chrome porque el navegador
devolvía un recorte descentrado del sello y no compensa depurar CSS para una
estampa de 118 px.

**Ojo con el archivo del sello:** `SELLO-ELYSIUM-MARCA-BLANCO-2048.png` es el
único de `../../SELLO-MARCA/` **sin canal alfa**, así que compuesto da un
recuadro blanco. Se usa el mismo que el vídeo 02, que sí lo tiene.

**Los fotogramas no viven aquí.** Son ~1400 JPEG. Esta carpeta está en iCloud, y
un volcado así siembra duplicados de conflicto. Van a `/private/tmp` y se
regeneran cuando haga falta.

**Sin audio.** La referencia trae pista, pero es la del post original de
Instagram —de hecho lleva grabada encima su interfaz: el «1/6» del carrusel y el
botón de silencio, que obviamente no se replican—. En Instagram y TikTok el
vídeo arranca silenciado igualmente. Si se quiere música, se añade al montar.

## Ajustes rápidos

| Qué | Dónde |
|---|---|
| Ritmo y paradas del recorrido | las `keys` de cada tramo en `run-capture.mjs` |
| Duración de un tramo | su `seconds` |
| Tamaño del aparato | `WIDTH` en `make-layers.py`, luego regenerar capas y `DEV_*` |
| Pared, madera y desenfoque | constantes de `make-backplate.py` |
| Posición del sello | `SEAL` y `SEAL_M` en `build.sh` |
| Tamaño y sitio de la tarjeta | constantes de `make-card.py`, luego `CARD_*` en `build.sh` |
| Fuerza del desenfoque del fondo | `gblur=sigma=` en `tarjeta()` |
| Qué sale en el mosaico | `PICKS` y `ROWS` en `make-board.py` |
| Recorrido de la cámara | las expresiones de `zoompan` en `mosaico()` |
| Encuadre de la vertical | `FORMATOS["9x16"]` en `make-backplate.py`, luego `TT_*` en `build.sh` |
| Resolución de captura | `VIEW` en `capture.mjs` (debe mantener 1.773) |

## Lo que no lleva

Ninguna captura de móvil: el sitio es responsivo y se comprobó a 375×812, pero
no hay pieza que lo enseñe. Haría falta grabar un tramo con `VIEW` en vertical.

Tampoco lleva manos sobre el teclado. Para lo segundo haría falta una
placa rodada y seguimiento con corrección de perspectiva.
