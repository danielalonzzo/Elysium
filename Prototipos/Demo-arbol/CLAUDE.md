# Demo-arbol

Demo de primer contacto del portafolio de Elysium: la pieza que se enseña
cuando hay que mostrar de qué es capaz el estudio antes de que exista un
proyecto. **No tiene contenido a propósito.** Nació como el sitio de un cliente
concreto; al no cerrarse el negocio se vació entera —textos, fotos, productos y
logotipo— y se conservó lo único que importaba: la arquitectura.

Stack: Next 16 (App Router) · React 19 · React Three Fiber + three · GSAP ·
Tailwind 4. Requiere Node ≥ 22.13.

---

## Vacía por diseño

Todos los textos son cadenas vacías y no hay ni una imagen. Eso es el estado
correcto, no un trabajo a medias. Al vestir la demo para un cliente, **el orden
es este**:

1. `app/data/content.ts` — marca, contactos, precios, galerías (`SHOTS`) y
   navegación. Es la fuente única: cambiar aquí propaga a cabecera, pie, Magic
   Bottom, portada y secciones.
2. `app/data/catalog.ts` — los productos de `/tienda`. Con la lista vacía la
   rejilla, el buscador, los filtros y la paginación siguen montados y se
   activan solos en cuanto haya productos.
3. `public/js/elysium-config.js` — marca y logotipo de los módulos Elysium
   (preloader F01, ventana de sistema F05/F06/F10, ajustes F22).
4. Los rótulos que viven en el JSX: las escenas de `NarrativeOverlay.tsx`, los
   tres actos de `Sections.tsx` y los pasos del aviso de entrada
   (`ElysiumPrototypePopup.tsx`, donde va el aviso legal de titularidad).

Dos detalles que evitan sorpresas:

- **Un enlace sin dirección se pasa por `linkTo()`** (en `content.ts`), que
  devuelve `#`. Un `href=""` recarga la página actual, y un `mailto:` sin
  destinatario abre el cliente de correo en blanco.
- **La CSP publicada va con `frame-src 'none'`.** La demo ya no incrusta ningún
  reproductor de terceros. Si se vuelve a empotrar Spotify o YouTube, hay que
  abrirles hueco en el bloque `/Demo-arbol/*` de `_headers`, en la raíz.

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
  tienda/page.tsx
  components/
    experience/   La pieza 3D: escena R3F, esfera de piedra, árbol, narrativa
                  cinemática y la matemática del scroll (storyMath.ts)
    shop/         Tienda: rejilla de producto y fichas
    site/         Cabecera, pie, dock inferior, iconos, popup de prototipo
  data/           catalog.ts (productos) y content.ts (textos y redes)
  lib/            Utilidades de navegador (chrome, visibilidad del dock)
public/           Lo único que Next sirve: css, js, elysium-core, robots.txt
```

La geometría 3D es **procedimental**: no hay ni un modelo ni una textura en
disco. `guanacasteModel.ts` construye el árbol y `DiquisSphere.tsx` la esfera de
piedra, los dos de forma determinista desde código. Por eso vaciar la demo de
imágenes no le quita nada a la escena: sigue entera.

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
