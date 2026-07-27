# Elysium — mapa del repositorio

## La regla que lo explica todo

En `firebase.json`, el sitio se sirve con **`"public": "."`**.

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

## Dónde está cada cosa

Todo vive dentro de este repositorio, con un único git. Un proyecto solo sale de
aquí cuando hay contrato y pasa a ser un negocio real: entonces se lleva su
propio repositorio y su propio dominio (así salió `Moyra/`, que hoy está en
`λ/Moyra/`).

Dentro, el reparto lo decide una sola pregunta: **¿esto es una página?**

```
Elysium/
├── ONCORE/          ← sitios: la carpeta ES la URL, se sirven tal cual
├── puravidapets/
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
| `historia-de-costa-rica/` | `/historia-de-costa-rica/` | `Prototipos/historia-de-costa-rica/` |
| `puravidapets/` | `/puravidapets/` | `Prototipos/puravidapets/` |

Las cuatro primeras son HTML plano: la carpeta es a la vez el proyecto y el
sitio, y se trabaja directamente ahí.

Las dos últimas son **producto compilado**. Editarlas a mano no sirve de nada, se
pierde en la siguiente publicación:

- `historia-de-costa-rica/` la genera entera
  `scripts/publish-historia-de-costa-rica.sh` desde
  `Prototipos/historia-de-costa-rica/` (Next 16).
- `puravidapets/` es el `vite build` de `Prototipos/puravidapets/`. El
  `index.html` de la fuente es el punto de entrada de Vite y apunta a
  `/src/main.jsx`: en producción no funciona, por eso lo que se publica es la
  compilación.

**Lo propio de Elysium, que no son páginas:**

- `backend/` — `elysium-billing`, el puente entre Stripe y Firebase que provisiona
  las licencias del CRM.
- `CV/` — los europass en EN/ES/PT.
- `research/` — páginas de investigación propias.
- `scripts/` — utilidades y el script de publicación.
- `firestore.rules`, `storage.rules`, `firebase.json`, `_redirects`.

## Qué hay en Prototipos

Lo que no se puede servir tal cual. **Está excluido de las tres listas de
despliegue**, porque si no se serviría en `elysiumdr.eu/Prototipos/`:

- `historia-de-costa-rica/` — aplicación Next 16. Tiene su propio `CLAUDE.md`;
  léelo antes de tocarlo. Se publica con el script, en la raíz.
- `puravidapets/` — aplicación Vite/React. Se publica con `vite build`, en la
  raíz.
- `Regalarte/` — aplicación Next que se despliega como **Worker propio** en
  `regalarte.danielalonzzo.workers.dev`. Elysium solo guarda una redirección
  (`/regalarte` → el Worker, en `firebase.json`), así que no tiene carpeta
  publicada.
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
  mientras viva aquí. `Regalarte/` e `historia-de-costa-rica/` traían uno de
  antes; se retiró y su historial quedó guardado como `.bundle` en
  `λ/_git-backup/`, fuera del repositorio.
