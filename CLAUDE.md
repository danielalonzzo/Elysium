# Elysium — mapa del repositorio

## La regla que lo explica todo

**La raíz de este repositorio es la raíz de la web.** No hay carpeta `dist/` que
envuelva el sitio: lo que ves en la raíz es lo que hay en `elysiumdr.eu`. De ahí
salen las dos cosas que más desconciertan:

1. **El nombre de una carpeta de la raíz es su URL.** `ONCORE/` se ve en
   `elysiumdr.eu/ONCORE/`. No se puede renombrar sin cambiar la dirección
   pública, y el portafolio la enlaza.
2. **Todo lo que no deba ser público hay que excluirlo a mano**, en las tres
   listas de despliegue: `firebase.json` (`hosting.ignore`), `.assetsignore`
   (assets del Worker de Cloudflare) y `.cloudflareignore`. Si algo entra y no se
   actualizan las tres, se publica.

## Quién sirve el sitio (y por qué importa)

Lo sirve **Cloudflare Workers static assets**. Se despliega solo: un push a
`main` en GitHub dispara el build. `firebase.json` sigue en el repositorio y
`"public": "."` describe bien la idea de que la raíz es la web, pero **Firebase
Hosting no atiende el dominio**, así que nada de lo que se configure ahí llega a
producción. Es la confusión más cara del repositorio: costó que la política de
seguridad entera llevara meses sin aplicarse y que Search Console se llenara de
avisos de indexación. Dos consecuencias que hay que tener presentes siempre:

1. **Las URLs públicas no llevan `.html`.** Cloudflare aplica `html_handling:
   auto-trailing-slash`: `/about.html` responde 307 hacia `/about`,
   `/index.html` hacia `/`, y `/es` hacia `/es/`. La URL canónica de una página
   es la de sin extensión. Cualquier enlace, `canonical`, `og:url` o entrada del
   sitemap escrita con `.html` apunta a una redirección.
2. **Las cabeceras se configuran en `_headers`, no en `firebase.json`.** Ahí
   están la CSP, HSTS y las demás. Cuidado con una regla del formato: si dos
   bloques declaran la misma cabecera, Cloudflare **une los valores con una
   coma**, y dos CSP unidas se aplican como intersección. Un bloque específico
   tiene que desprender primero la general con `! Content-Security-Policy`.

Para probar en local, `python3 -m http.server` engaña: sirve los ficheros tal
cual, así que `/about.html` funciona y `/about` da 404 — justo al revés que en
producción. Usa **`scripts/serve-local.py`**, que replica el `html_handling` y
aplica `_headers`. Está versionado a la fuerza, como
`publish-demo-arbol.sh`: `*.py` y `*.sh` están en `.gitignore` para
los scripts de usar y tirar, no para las herramientas del repositorio.

## Dónde está cada cosa

Todo vive dentro de este repositorio, con un único git. Un proyecto solo sale de
aquí cuando hay contrato y pasa a ser un negocio real: entonces se lleva su
propio repositorio y su propio dominio (así salió `Moyra/`, que hoy está en
`λ/Moyra/`, y así salió Pura Vida Pets, que hoy está en
`λ/Pura Vida Pets/puravidapetscr/` y se publica en `puravidapetscr.com`).

Dentro, el reparto lo decide una sola pregunta: **¿esto es una página?**

```
Elysium/
├── ONCORE/          ← sitios: la carpeta ES la URL, se sirven tal cual
├── Demo-arbol/
├── …
└── Prototipos/      ← lo que NO es una página: fuentes sin compilar,
                       documentos, grabaciones. Excluido del despliegue.
```

La raíz es la web, así que solo puede haber ahí lo que se pueda servir. Una app
Next no se puede servir: no tiene ningún `index.html` hasta que se compila. Su
código va a `Prototipos/` y lo que aterriza en la raíz es el resultado.

## Qué hay en Elysium

**Páginas del portafolio** — HTML escrito a mano: `index.html`, `about.html`,
`contact.html`, `daniel-morales.html`, `portfolio.html`, `case-*.html`,
`admin.html`. Traducciones en `es/` y `pt/`. Recursos compartidos en `CSS/`,
`JS/`, `Images/`, `sounds/`.

**Subsitios publicados** — cada carpeta con su `index.html` se sirve en la URL de
su nombre, y `portfolio.html` los enlaza:

| Carpeta | URL | Se edita en |
|---|---|---|
| `ONCORE/` | `/ONCORE/` | la propia carpeta |
| `Dr-Johnny-Piedra/` | `/Dr-Johnny-Piedra/` | la propia carpeta |
| `VALTRIX Engineering/` | `/VALTRIX Engineering/` | la propia carpeta |
| `proyecto/` | `/proyecto/` | la propia carpeta |
| `Demo-arbol/` | `/Demo-arbol/` | `Prototipos/Demo-arbol/` |

Las cuatro primeras son HTML plano: la carpeta es a la vez el proyecto y el
sitio, y se trabaja directamente ahí.

La última es **producto compilado**. Editarla a mano no sirve de nada, se pierde
en la siguiente publicación: `Demo-arbol/` la genera entera
`scripts/publish-demo-arbol.sh` desde `Prototipos/Demo-arbol/` (Next 16).

**Pura Vida Pets ya no vive aquí.** Se firmó contrato y salió del repositorio: su
código está en `λ/Pura Vida Pets/puravidapetscr/`, con git propio
(`github.com/danielalonzzo/puravidapets`) y dominio propio. En Elysium ya no
queda ni `puravidapets/` ni `Prototipos/puravidapets/`; `portfolio.html` solo
enlaza a `https://puravidapetscr.com`, igual que hace con Moyra.

**Lo propio de Elysium, que no son páginas:**

- `backend/` — `elysium-platform`, el servicio que agenda las reuniones, envía
  sus correos y atiende la recuperación de contraseña. Las licencias las asigna
  el administrador desde el CRM.
- `CV/` — los europass en EN/ES/PT.
- `research/` — páginas de investigación propias.
- `scripts/` — utilidades y el script de publicación.
- `_headers` y `_redirects` — las cabeceras y las redirecciones que aplica
  Cloudflare. Cuidado: son de los pocos ficheros que empiezan por `_` y **sí**
  tienen que subir (Cloudflare los lee y no los publica); la convención de más
  abajo vale para carpetas.
- `firestore.rules`, `storage.rules`, `firebase.json` — este último ya no sirve
  el dominio; ver «Quién sirve el sitio».

## Qué hay en Prototipos

Lo que no se puede servir tal cual. **Está excluido de las tres listas de
despliegue**, porque si no se serviría en `elysiumdr.eu/Prototipos/`:

- `Demo-arbol/` — aplicación Next 16. Es la demo de primer contacto del
  portafolio y **está vacía de contenido a propósito**: se enseña para mostrar
  la arquitectura, no un proyecto. Tiene su propio `CLAUDE.md`; léelo antes de
  tocarla. Se publica con el script, en la raíz.
- `Selva y Sal/` — aplicación Next que se despliega como **Worker propio** en
  `selva-y-sal.danielalonzzo.workers.dev`. Elysium solo guarda la redirección
  (`/selva-y-sal` → el Worker, en `_redirects`), así que no tiene carpeta
  publicada. **La marca es ficticia a propósito**: se construyó para un cliente
  que no cerró y, al retirar su oferta, se le quitó todo rastro suyo y se
  rellenó con una empresa inventada, para poder enseñar la demo llena de
  contenido a cualquier otro cliente. No metas ahí datos de nadie real; hay una
  prueba en `tests/rendered-html.test.mjs` que falla si vuelve a colarse una
  marca de cliente en el HTML.
- `Elysium Games CR/`, `Ideas/` — documentos y grabaciones, no son webs. Las
  grabaciones (`*.mov`) están fuera de git: sin git-lfs, un vídeo se queda para
  siempre en el historial aunque luego se borre.

## Dos paradigmas conviven aquí

Es la causa principal de la confusión al entrar:

- **La mayoría del sitio es HTML plano.** Abres `index.html` y eso es la página.
  Lo que lees es lo que se sirve.
- **Los proyectos de Prototipos con `package.json` no.** Son aplicaciones React.
  Su punto de entrada es `app/page.tsx`, y su regla es: una carpeta dentro de
  `app/` = una URL. Si buscas su `index.html` y no aparece, no está perdido: aún
  no existe. Y si aparece, cuidado: en un proyecto Vite el `index.html` de la
  raíz es el andamio del servidor de desarrollo, no la página.

## Convenciones

- **`_` al principio = no se publica.** Dentro de los proyectos, `_comercial/`
  guarda informes y notas del cliente. Las tres listas de despliegue lo excluyen
  **a cualquier profundidad**, por si una carpeta de proyecto acaba dentro de una
  publicada.
- **Sufijo `.nosync` = iCloud no lo sincroniza.** Todo esto vive en iCloud Drive,
  que intenta sincronizar cada archivo temporal que escribe un compilador, falla,
  y siembra duplicados de conflicto (`archivo 2.js`, `carpeta 3`). Por eso
  `node_modules` y `.next` son enlaces simbólicos a carpetas `*.nosync`.
- **El compilado se versiona.** Las carpetas compiladas se guardan en git a
  propósito, porque el sitio se despliega desde el repositorio. Van marcadas como
  generadas en `.gitattributes` para que no ensucien los `git diff`.
- **Un solo git.** Ningún proyecto tiene repositorio, rama ni remoto propios
  mientras viva aquí. `Selva y Sal/` y `Demo-arbol/` traían uno de antes; se
  retiró y su historial quedó guardado como `.bundle` en `λ/_git-backup/`, fuera
  del repositorio.
