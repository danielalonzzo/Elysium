# `elysium-core/` — Kit de funciones nucleares

Componentes plug-and-play de Elysium λ Development & Research.
Zero-dependency, prefijos `ely-` / `Elysium*` / `ELYSIUM_*`, JSDoc en toda API.

> ## ⚠️ Desviación documentada del §4.2 del estándar
>
> El §4.2 exige que esta carpeta llegue al proyecto como **submódulo Git** de un
> repositorio central, y prohíbe copiarla y pegarla. **A fecha de esta entrega
> no existe todavía el repositorio central de `elysium-core`**, por lo que los
> componentes se han escrito aquí por primera vez.
>
> **Acción pendiente antes de la siguiente entrega:**
>
> 1. Crear el repositorio central `elysium-core` con este contenido.
> 2. Etiquetarlo `v1.0.0` y abrir su `CHANGELOG.md` obligatorio.
> 3. En este proyecto: `git rm -r --cached elysium-core` y
>    `git submodule add <repo-central> elysium-core`.
>
> Hasta entonces sigue vigente la regla de gobernanza: **este código no se
> modifica dentro del proyecto de cliente**. Toda personalización se hace
> exclusivamente por los objetos de configuración `ELYSIUM_*`. Si una necesidad
> no se resuelve por configuración, es una *feature request* al core.

---

## Componentes

| Archivo | Cubre | Configuración | API |
|---|---|---|---|
| `elysium-preloader.js` | F01 Loading Page | `window.ELYSIUM_PRELOADER` | `ElysiumPreloader.dismiss()` · evento `elysium:preloader:done` |
| `elysium-system-info.js` | F05 Information System + F06 System Update | `window.ELYSIUM_SYSTEM` + `<meta name="app-version">` | `ElysiumSystem.show()` · `window.elysiumForceUpdate(isLogout)` |
| `elysium-compliance.js` | F08 Cookies Management | `window.ELYSIUM_CONSENT` | `ElysiumConsent.get/isGranted/onGranted/open/purgeLocalData` |
| `elysium-seasonal.js` | F11 Efectos de Temporada | `window.ELYSIUM_SEASONAL` | 🚧 reservado — no implementar versiones provisionales |
| `elysium-mouse.js` | F12 Magic Mouse | `window.ELYSIUM_MOUSE` | 🚧 reservado — no implementar versiones provisionales |

Los componentes cooperan pero funcionan de forma independiente:
el flag `sys_action` conecta F06 con el mensaje de F01, y
`ElysiumConsent.purgeLocalData()` reutiliza el pipeline de F06 si está presente.

---

## F01 · `elysium-preloader.js`

Se carga en `<head>`, **antes de cualquier hoja de estilo**.

```html
<script>
  window.ELYSIUM_PRELOADER = {
    brandName: 'MI MARCA',
    tagline: 'Línea secundaria opcional',
    accent: '#2997ff',
    background: '#0B0B0B',
    foreground: '#F5F5F7',
    logoSvg: '<svg …></svg>',
    minDuration: 1000,   // mínimo normativo
    maxDuration: 8000    // máximo normativo (timeout de seguridad)
  };
</script>
<script src="elysium-core/elysium-preloader.js"></script>
```

| Opción | Defecto | Notas |
|---|---|---|
| `minDuration` | `1000` | Acotado a `[0, 8000]` |
| `maxDuration` | `8000` | Acotado a `[1000, 8000]` |
| `locale` | `<html lang>` | `pt` · `es` · `en` |

Salida en dos fases: fade CSS de 600 ms y luego retirada del DOM.
Con `prefers-reduced-motion: reduce` no hay animación y la retirada es inmediata.
Si `sessionStorage.sys_action` vale `update` o `logout`, el overlay lo anuncia y
consume el flag.

---

## F05 + F06 · `elysium-system-info.js`

La versión se lee **siempre** de `<meta name="app-version">`. Es el único punto
de verdad del proyecto: este componente no declara constantes de versión, y
ningún otro JS del proyecto debe hacerlo.

```html
<meta name="app-version" content="v1.4.2-build.89">
…
<script>
  window.ELYSIUM_SYSTEM = {
    stage: 'Beta',
    license: 'ELY-2026-XXXX',
    brandName: 'MI MARCA',
    accent: '#2997ff',
    theme: 'light',                       // apariencia del modal
    logoSvg: '<svg …></svg>',
    legal: { terms: '/terms.html', privacy: '/privacy.html' },
    healthEndpoint: '/manifest.json',
    compliance: {
      privacyDirective: 'Directiva ePrivacy · Cookie Consent v1.0',
      infrastructure: 'HSTS · CSP N3',
      legalFramework: 'RGPD (UE)'
    },
    org: { rows: [
      { label: 'Organización', value: 'Mi Marca S.L.' },
      { label: 'Portal Web', value: 'dominio.com', href: 'https://dominio.com' },
      { label: 'Canal de Apoyo', value: 'info@dominio.com', href: 'mailto:info@dominio.com' }
    ]},
    attributions: [{ label: 'Tipografía', value: 'Inter' }],
    developer: { name: 'Elysium λ Development & Research', url: 'https://elysiumdr.eu' },
    copyright: '© 2026 Mi Marca. Todos los derechos reservados.',
    mountSelector: '.footer-bottom-inner'
  };
</script>
<script src="elysium-core/elysium-system-info.js" defer></script>
```

El bloque «Estado de la Infraestructura» sondea `healthEndpoint` con
`cache: 'no-store'` y muestra disponibilidad y latencia real. Sin
`healthEndpoint` configurado, refleja `navigator.onLine`.

`legal.terms` y `legal.privacy` deben apuntar a páginas reales.
**Nunca `href="#"`** (§6.4 del estándar).

### F06 · `window.elysiumForceUpdate(isLogout)`

Purga cookies, `localStorage`, `sessionStorage`, IndexedDB (borrado *awaited*),
Cache Storage y Service Workers, y recarga con *cache-buster*. Temporizador de
seguridad de 1,8 s. Deja `sys_action` para que F01 anuncie la acción.

---

## F08 · `elysium-compliance.js`

```html
<script>
  window.ELYSIUM_CONSENT = {
    policyVersion: '1.0',                 // al cambiar, se re-solicita el consentimiento
    accent: '#2997ff',
    theme: 'light',
    categories: [{ id: 'analytics' }, { id: 'marketing' }],
    links: { privacy: '/privacy.html', cookies: '/cookie-policy.html' }
  };
</script>
<script src="elysium-core/elysium-compliance.js" defer></script>
```

### Gating real de terceros

Ningún script de analítica o marketing se carga fuera de este gating (§6.4).
Se declara inerte y el componente lo activa solo tras el opt-in:

```html
<script type="text/plain" data-consent="analytics"
        data-src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
```

Para código propio que no pueda declararse así:

```js
ElysiumConsent.onGranted('analytics', function () { /* … */ });
```

### Registro de consentimiento

Se persiste en `localStorage` bajo `elysium_consent`:

```json
{ "version": "1.0", "timestamp": "2026-07-21T18:40:12.000Z",
  "categories": { "necessary": true, "analytics": false, "marketing": false } }
```

Versión más timestamp ISO 8601 constituyen la prueba de consentimiento
explícito del Art. 7 RGPD y del Art. 5 de la Ley 8968.

### Revocación y derecho de supresión

Enlace obligatorio en el footer (§6.3):

```html
<button type="button" onclick="ElysiumConsent.open()">Configuración de cookies</button>
```

`ElysiumConsent.purgeLocalData()` delega en el pipeline de F06 cuando existe.

---

## Eventos públicos

| Evento | Emisor | Detalle |
|---|---|---|
| `elysium:preloader:done` | F01 | — |
| `elysium:consent:change` | F08 | El registro de consentimiento completo |
