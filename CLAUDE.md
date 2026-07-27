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

El código fuente de los prototipos **no vive aquí**. Está en la carpeta hermana:

```
Elysium λ/
├── Elysium/       ← este repositorio: el SITIO (lo que se sirve)
└── Prototipos/    ← los PROYECTOS (donde se trabaja)
```

Elysium contiene el resultado ya compilado; Prototipos contiene el código que lo
genera. Se separan así porque una carpeta dentro de Elysium es una URL, y el
código fuente no es una página.

## Qué hay en Elysium

**Páginas del portafolio** — HTML escrito a mano: `index.html`, `about.html`,
`contact.html`, `daniel-morales.html`, `portfolio.html`, `case-*.html`,
`admin.html`. Traducciones en `es/` y `pt/`. Recursos compartidos en `CSS/`,
`JS/`, `Images/`, `sounds/`.

**Subsitios publicados** — cada carpeta con su `index.html` se sirve en la URL de
su nombre, y `portfolio.html` los enlaza:

| Carpeta | URL |
|---|---|
| `historia-de-costa-rica/` | `/historia-de-costa-rica/` |
| `ONCORE/` | `/ONCORE/` |
| `Dr-Johnny-Piedra/` | `/Dr-Johnny-Piedra/` |
| `VALTRIX Engineering/` | `/VALTRIX Engineering/` |
| `puravidapets/` | `/puravidapets/` |

`historia-de-costa-rica/` es **producto compilado**: lo genera entero
`scripts/publish-historia-de-costa-rica.sh` a partir de
`../Prototipos/historia-de-costa-rica/`. Editarlo a mano no sirve de nada, se
pierde en la siguiente publicación.

**Lo propio de Elysium, que no son páginas:**

- `backend/` — `elysium-billing`, el puente entre Stripe y Firebase que provisiona
  las licencias del CRM.
- `CV/` — los europass en EN/ES/PT.
- `research/` — páginas de investigación propias.
- `scripts/` — utilidades y el script de publicación.
- `firestore.rules`, `storage.rules`, `firebase.json`, `_redirects`.

## Qué hay en Prototipos

Los proyectos de cliente. Ninguno se publica desde Elysium salvo por su carpeta
compilada:

- `historia-de-costa-rica/` — aplicación Next 16. Tiene su propio `CLAUDE.md`;
  léelo antes de tocarlo. Se publica en `elysiumdr.eu/historia-de-costa-rica/`.
- `Regalarte/` — aplicación Next que se despliega como **Worker propio** en
  `regalarte.danielalonzzo.workers.dev`. Elysium solo guarda una redirección
  (`/regalarte` → el Worker, en `firebase.json`).
- `ONCORE/`, `Dr-Johnny-Piedra/`, `VALTRIX Engineering/`, `puravidapets/`,
  `Moyra/`, `Kimberly Vargas/`, `Elysium Games CR/`, `proyecto/` — material de
  trabajo. Ojo: las cuatro primeras **también** tienen su copia publicada en
  Elysium, que es la que se sirve.

## Dos paradigmas conviven aquí

Es la causa principal de la confusión al entrar:

- **La mayoría del sitio es HTML plano.** Abres `index.html` y eso es la página.
  Lo que lees es lo que se sirve.
- **Los proyectos de Prototipos con `package.json` no.** Son aplicaciones React
  que **no tienen ningún `index.html`** hasta que se compilan. Su punto de
  entrada es `app/page.tsx`, y su regla es: una carpeta dentro de `app/` = una
  URL. Si buscas su `index.html` y no aparece, no está perdido: aún no existe.

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

## Aviso

**`Prototipos/` no está bajo control de versiones.** Al sacar los proyectos de
Elysium salieron también de git: `Regalarte/` y `historia-de-costa-rica/` ya no
tienen historial ni copia de seguridad más allá de iCloud. Conviene darles un
repositorio propio.
