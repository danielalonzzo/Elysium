# Demo-arbol

Demo de primer contacto del portafolio de Elysium: la pieza que se enseña
cuando hay que mostrar de qué es capaz el estudio antes de que exista un
proyecto. Nació como el sitio de un cliente concreto; al no cerrarse el negocio
se vació entera —textos, fotos, productos y logotipo— y se conservó lo único que
importaba: la arquitectura.

**Hoy va vestida con una marca ficticia, «Raíz y Piedra».** Es el mismo
procedimiento que `Selva y Sal/`: una demo vacía no demuestra nada, así que se
rellenó con una empresa inventada —una casa editora costarricense de juegos y
objetos de memoria— para poder enseñarla llena a cualquier cliente sin usar el
material de ninguno.

Stack: Next 16 (App Router) · React 19 · React Three Fiber + three · GSAP ·
Tailwind 4. Requiere Node ≥ 22.13.

---

## La marca es inventada

«Raíz y Piedra» **no existe**. No es un cliente, no vende nada y ninguno de sus
productos, precios o contactos es real. Tres cosas se derivan de eso y no se
tocan sin pensarlo:

1. **El aviso de entrada lo declara.** El paso 2 de `ElysiumPrototypePopup.tsx`
   dice que la marca es ficticia y que cualquier parecido es casual. En el
   prototipo original ese paso decía justo lo contrario —que la identidad era
   propiedad del cliente—, así que al reutilizarlo hay que leerlo, no copiarlo.
2. **Ningún enlace apunta a una cuenta real.** Todo cuelga del dominio ficticio
   `raizypiedra.cr`, que no resuelve. Inventar un `instagram.com/<handle>` o un
   número de WhatsApp plausible es peor que un enlace muerto: puede caer sobre
   la cuenta o el teléfono de una persona real.
3. **Lo inventado es la empresa, no el patrimonio.** El guanacaste y las esferas
   del Diquís sí existen. Los datos que se publican sobre ellos —árbol nacional
   desde 1959, gabro, Patrimonio Mundial en 2014, las coordenadas de Finca 6—
   son ciertos y deben seguir siéndolo.

El nombre bautiza los dos objetos que la escena 3D ya construía: la raíz del
guanacaste y la piedra de la esfera.

## Dónde vive el contenido

Si hay que revestirla para otro cliente, **el orden es este**:

1. `app/data/content.ts` — marca, contactos, precios, galerías (`SHOTS`) y
   navegación. Es la fuente única: cambiar aquí propaga a cabecera, pie, Magic
   Bottom, portada y secciones.
2. `app/data/catalog.ts` — los doce productos de `/tienda`, con su ficha técnica
   (`specs`). La rejilla, el buscador, los filtros y la paginación se alimentan
   solos de esa lista.
3. `public/js/elysium-config.js` — marca y logotipo de los módulos Elysium
   (preloader F01, ventana de sistema F05/F06/F10, ajustes F22).
4. Los rótulos que viven en el JSX: las escenas de `NarrativeOverlay.tsx`, los
   tres actos y el bento de `Sections.tsx`, los rótulos de `Shop.tsx` —los chips
   de categoría y el orden están ahí, no en los datos— y los pasos del aviso de
   entrada.

Cuatro detalles que evitan sorpresas:

- **Un enlace sin dirección se pasa por `linkTo()`** (en `content.ts`), que
  devuelve `#`. Un `href=""` recarga la página actual, y un `mailto:` sin
  destinatario abre el cliente de correo en blanco.
- **La CSP publicada va con `frame-src 'none'`.** La demo no incrusta ningún
  reproductor de terceros. Si se vuelve a empotrar Spotify o YouTube, hay que
  abrirles hueco en el bloque `/Demo-arbol/*` de `_headers`, en la raíz.
- **El `StaticHero` de `CinematicStory.tsx` repite la escena I a mano.** Es la
  portada sin WebGL y lo que pinta el servidor, así que si cambia el rótulo de
  la escena I hay que cambiarlo en los dos sitios o dirán cosas distintas.
- **Las láminas de `public/images/` son SVG dibujados, no fotos.** Con una marca
  inventada, una foto falsa de un producto que no existe se lee como un montaje.
  El sistema visual es común —greca, la esfera como módulo y la copa del
  guanacaste— para que la colección se lea como una sola familia.

## Las dos carpetas

Es **la** fuente de confusión del proyecto, así que va primero. Hay dos carpetas
`Demo-arbol`, las dos dentro del repositorio de Elysium:

| Ruta | Qué es | Se edita a mano |
|---|---|---|
| `Elysium/Prototipos/Demo-arbol/` | **El código fuente.** Es esta carpeta. Aquí se trabaja. | **Sí** |
| `Elysium/Demo-arbol/` | **El resultado compilado**, que es lo que se sirve en `elysiumdr.eu/Demo-arbol/` | **Nunca** |

La segunda se genera entera a partir de la primera. Cualquier edición hecha
directamente allí se pierde en la siguiente publicación, porque el script hace
`rm -rf` de la carpeta antes de copiar el resultado nuevo.

**Por qué la carpeta publicada se llama así y no se puede renombrar sin más:**
la raíz del repositorio de Elysium *es* la raíz de la web. El nombre de esa
carpeta no es una elección, **es la dirección**: `Demo-arbol/` →
`elysiumdr.eu/Demo-arbol/`. Además `admin.html` la enlaza. Por eso lo que se
apartó fue el código fuente, a `Prototipos/`, que está excluido de las tres
listas de despliegue y por tanto no se sirve.

El compilado sí se versiona en el git de Elysium a propósito: el sitio se
despliega desde ese repositorio, así que tiene que estar presente. Para que no
ensucie los `git diff` con HTML minificado, está marcado como generado en el
`.gitattributes` de Elysium.

## Los dos comandos

```bash
npm run dev
```

Desarrollo en `localhost:3000`. Aquí todo cuelga de la raíz (`/images/…`), sin
prefijo de subcarpeta.

```bash
cd ../.. && ./scripts/publish-demo-arbol.sh
```

Publicación. **El script vive en la raíz de Elysium, no aquí**, porque su
trabajo termina escribiendo dentro del sitio. Localiza esta carpeta por su
cuenta (en `Prototipos/Demo-arbol`) y aborta con un error claro si no la
encuentra. Hace cuatro cosas:

1. Compila con `DEMO_ARBOL_BASE_PATH=/Demo-arbol`, lo que hace que Next prefije
   sus propios assets y los `next/link`.
2. Reescribe con `perl` las rutas absolutas que Next **no** toca porque están
   escritas a mano en el código (`/images`, `/videos`, `/js`, `/css`,
   `/elysium-core`). Por eso el código fuente puede seguir usando rutas de raíz
   y funcionar en `npm run dev`. **Solo recursos, nunca rutas de navegación**:
   ver la regla de abajo.
3. Recorta cualquier vídeo de más de 8 MB (los assets del Worker de Cloudflare
   cortan en 25 MiB por archivo).
4. Reemplaza `Demo-arbol/` con el resultado.

## Estructura

**Aquí no hay ningún `index.html`, y es correcto.** Es una aplicación React: el
`index.html` no existe hasta que se compila. El punto de entrada equivalente es
**`app/page.tsx`** (la portada) junto a `app/layout.tsx` (el armazón común:
`<head>`, fuentes, scripts). La ruta `/tienda` es `app/tienda/page.tsx`. Esa es
la convención del App Router de Next: **una carpeta = una URL, y el `page.tsx`
de dentro es su contenido**.

```
app/
  layout.tsx, page.tsx, not-found.tsx, globals.css
  tienda/page.tsx          La rejilla
  tienda/[slug]/page.tsx   La ficha de producto (`generateStaticParams`)
  components/
    experience/   La pieza 3D: escena R3F, esfera de piedra, árbol, narrativa
                  cinemática y la matemática del scroll (storyMath.ts)
    shop/         Tienda: rejilla de producto y fichas
    site/         Cabecera, pie, dock inferior, iconos, popup de prototipo
  data/           catalog.ts (productos) y content.ts (textos y redes)
  lib/            Utilidades de navegador (chrome, visibilidad del dock)
public/           Lo único que Next sirve: images, css, js, elysium-core,
                  robots.txt
```

La escena 3D es **procedimental de punta a punta: no hay ni un modelo ni una
textura en disco.** `guanacasteModel.ts` construye el árbol, `DiquisSphere.tsx`
la esfera de piedra y `cardAtlas.ts` dibuja en un `<canvas>` el atlas 4×4 con el
arte de las 80 cartas del Acto 4. Por eso vaciar la demo de imágenes no le quita
nada a la escena: sigue entera.

El atlas es la única parte que toca el material de un `InstancedMesh`. Todas las
instancias comparten geometría y UV, así que la casilla de cada carta viaja en
un atributo instanciado (`aTile`) y el desplazamiento de UV se inyecta en el
vértice con `onBeforeCompile`, sobre las varyings que ya calcula `uv_vertex`. Al
poner mapa hubo que bajar el emisivo —el 0.26 plano de antes lavaba el dibujo—.

## Reglas que no se rompen

- **Un enlace de navegación se arregla con `next/link`, nunca reescribiendo la
  ruta en el script.** De las rutas se encarga `basePath`, y para eso el router
  tiene que seguir viendo la suya sin prefijo: guarda `/tienda` y lo añade él al
  navegar. El script llegó a reescribir también `"/tienda"` dentro del bundle, y
  el resultado fue que al pulsar «Tienda» el router pedía
  `/Demo-arbol/Demo-arbol/tienda`. Lo desconcertante del fallo es que la
  dirección directa funcionaba: ahí no interviene el router. Si un enlace
  interno aparece sin prefijo en el HTML publicado, es que está escrito con
  `<a href="/…">` y hay que pasarlo a `Link`.
- **Esta carpeta nunca debe acabar dentro de una carpeta publicada.** Vive
  dentro del repositorio, pero `Prototipos/` está excluido de las tres listas de
  despliegue. Si el proyecto termina copiado dentro de una carpeta que sí se
  publica, todo lo que es interno se serviría en abierto. Ya pasó una vez. Como
  red de seguridad, esas tres listas — `firebase.json` (`hosting.ignore`),
  `.assetsignore` y `.cloudflareignore` — excluyen `_comercial/`, `_fuentes/`,
  `node_modules/` y `package.json` **a cualquier profundidad**.
- **El prototipo no se indexa.** `noindex, nofollow` está en la metadata, en
  `public/robots.txt`, en el `Disallow` del `robots.txt` de la raíz y en la
  cabecera `X-Robots-Tag` del bloque `/Demo-arbol/*` de `_headers`.
- **Nada pesado en `public/videos/`.** Límite duro de 25 MiB por archivo en el
  despliegue; el script recorta a partir de 8 MB, pero no conviene depender de
  eso.

## iCloud

El repositorio vive en iCloud Drive. iCloud intenta sincronizar cada archivo
temporal que escribe el compilador, no lo consigue, y siembra duplicados de
conflicto (`archivo 2.js`, `carpeta 3`). En julio de 2026 había 190 repartidos
por el repositorio.

La defensa es el sufijo **`.nosync`**, que iCloud respeta y no sincroniza:

- `node_modules` → enlace simbólico a `node_modules.nosync`
- `.next` → enlace simbólico a `.next.nosync`
- `.next-export.nosync` → fijado en `next.config.ts` como `distDir` de publicación

Si alguna vez hay que reinstalar dependencias desde cero, hay que **rehacer el
enlace**, porque `npm install` puede reemplazarlo por una carpeta normal:

```bash
rm -rf node_modules node_modules.nosync && npm install
mv node_modules node_modules.nosync && ln -s node_modules.nosync node_modules
```

Consecuencia importante: como el directorio real se llama `node_modules.nosync`,
`tsconfig.json` tiene que excluirlo **por ese nombre**. Si no, `include: **/*.ts`
se mete a comprobar tipos dentro de las dependencias y la compilación falla.
