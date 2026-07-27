# Historia de Costa Rica

Sitio de la marca **Historia de Costa Rica**, construido como pieza de primer
contacto dentro del portafolio de Elysium. No es un experimento desechable: el
código de `app/` es la versión buena y se mantiene como tal.

Stack: Next 16 (App Router) · React 19 · React Three Fiber + three · GSAP ·
Tailwind 4. Requiere Node ≥ 22.13.

---

## Las dos carpetas

Esta es **la** fuente de confusión del proyecto, así que va primero. Hay dos
carpetas con este nombre, las dos dentro del repositorio de Elysium:

| Ruta | Qué es | Se edita a mano |
|---|---|---|
| `Elysium/Prototipos/historia-de-costa-rica/` | **El código fuente.** Es esta carpeta. Aquí se trabaja. | **Sí** |
| `Elysium/historia-de-costa-rica/` | **El resultado compilado**, que es lo que se sirve en `elysiumdr.eu/historia-de-costa-rica/` | **Nunca** |

La segunda se genera entera a partir de la primera. Cualquier edición hecha
directamente allí se pierde en la siguiente publicación, porque el script hace
`rm -rf` de la carpeta antes de copiar el resultado nuevo.

**Por qué la carpeta publicada se llama así y no se puede renombrar:** en
`firebase.json` el sitio se sirve con `"public": "."`, es decir, la raíz del
repositorio de Elysium *es* la raíz de la web. El nombre de esa carpeta no es una
elección, **es la dirección**: `historia-de-costa-rica/` →
`elysiumdr.eu/historia-de-costa-rica/`. Además `portfolio.html` la enlaza. Por eso
lo que se apartó fue el código fuente, a `Prototipos/`, que está excluido de las
tres listas de despliegue y por tanto no se sirve.

El compilado sí se versiona en el git de Elysium a propósito: el sitio se
despliega desde ese repositorio, así que tiene que estar presente. Para que no
ensucie los `git diff` con HTML minificado, está marcado como generado en el
`.gitattributes` de Elysium.

El código fuente sí está en el git de Elysium, que es el único que hay: ningún
proyecto tiene repositorio ni rama propios mientras viva aquí.

## Los dos comandos

```bash
npm run dev
```

Desarrollo en `localhost:3000`. Aquí todo cuelga de la raíz (`/images/…`), sin
prefijo de subcarpeta.

```bash
cd ../.. && ./scripts/publish-historia-de-costa-rica.sh
```

Publicación. **El script vive en la raíz de Elysium, no aquí**, porque su trabajo
termina escribiendo dentro del sitio. Localiza esta carpeta por su cuenta (en
`Prototipos/historia-de-costa-rica`) y aborta con un error claro si no la
encuentra. Hace cuatro cosas:

1. Compila con `HDC_BASE_PATH=/historia-de-costa-rica`, lo que hace que Next
   prefije sus propios assets y los `next/link`.
2. Reescribe con `perl` las rutas absolutas que Next **no** toca porque están
   escritas a mano en el código (`/images`, `/videos`, `/js`, `/css`,
   `/elysium-core`, `/logo.jpg`). Por eso el código fuente puede seguir usando
   rutas de raíz y funcionar en `npm run dev`. **Solo recursos, nunca rutas de
   navegación**: ver la regla de abajo.
3. Recorta cualquier vídeo de más de 8 MB (los assets del Worker de Cloudflare
   cortan en 25 MiB por archivo).
4. Reemplaza `historia-de-costa-rica/` con el resultado.

## Estructura

**Aquí no hay ningún `index.html`, y es correcto.** Es el único proyecto del
repositorio que no es HTML escrito a mano: es una aplicación React, y el
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
    experience/   La pieza 3D: escena R3F, esfera diquís, árbol de Guanacaste,
                  narrativa cinemática y la matemática del scroll (storyMath.ts)
    shop/         Tienda: rejilla de producto y fichas
    site/         Cabecera, pie, dock inferior, iconos, popup de prototipo
  data/           catalog.ts (producto) y content.ts (textos y redes)
  lib/            Utilidades de navegador (chrome, visibilidad del dock)
public/           Lo único que Next sirve: css, js, images, videos,
                  elysium-core, logo.jpg, robots.txt
_comercial/       Informes y notas del proyecto. Se versiona como memoria, pero
                  nunca llega al sitio (Next solo publica `public/`).
```

## Reglas que no se rompen

- **Un enlace de navegación se arregla con `next/link`, nunca reescribiendo la
  ruta en el script.** De las rutas se encarga `basePath`, y para eso el router
  tiene que seguir viendo la suya sin prefijo: guarda `/tienda` y lo añade él al
  navegar. El script llegó a reescribir también `"/tienda"` dentro del bundle, y
  el resultado fue que al pulsar «Tienda» el router pedía
  `/historia-de-costa-rica/historia-de-costa-rica/tienda`. Lo desconcertante del
  fallo es que la dirección directa funcionaba: ahí no interviene el router. Si
  un enlace interno aparece sin prefijo en el HTML publicado, es que está escrito
  con `<a href="/…">` y hay que pasarlo a `Link`.
- **Esta carpeta nunca debe acabar dentro de una carpeta publicada.** Vive dentro
  del repositorio, pero `Prototipos/` está excluido de las tres listas de
  despliegue. Si el proyecto termina copiado dentro de una carpeta que sí se
  publica, `_comercial/` (los informes internos del cliente) se serviría en
  abierto. Ya pasó una vez. Como red de seguridad, esas tres listas —
  `firebase.json` (`hosting.ignore`), `.assetsignore` y `.cloudflareignore` —
  excluyen `_comercial/`, `_fuentes/`, `node_modules/` y `package.json` **a
  cualquier profundidad**.
- **El prototipo no se indexa.** `noindex, nofollow` está en la metadata y en
  `public/robots.txt`.
- **Nada pesado en `public/videos/`.** Límite duro de 25 MiB por archivo en el
  despliegue; el script recorta a partir de 8 MB, pero no conviene depender de eso.

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
