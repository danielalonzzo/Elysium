# Elysium λ Core Kit · v1.2.0

Componentes nucleares estandarizados del ecosistema Elysium (ver
[`../ELYSIUM-STANDARDS.md`](../ELYSIUM-STANDARDS.md)). Zero-dependency,
white-label, compatibles con ES5+, configurables por objeto global.

**Distribución obligatoria:** esta carpeta se integra en los proyectos como
Git Submodule (o paquete NPM privado `@elysium/core`); nunca se copia y pega,
y queda prohibido modificarla dentro de un proyecto de cliente (§4.2 del
estándar).

| Archivo | Función del catálogo | Config global | API |
|---|---|---|---|
| `elysium-preloader.js` | **F01 · Loading Page** (incluir en `<head>`) | `window.ELYSIUM_PRELOADER` | `ElysiumPreloader.dismiss()` · evento `elysium:preloader:done` |
| `elysium-system-info.js` | **F05 · Information System** + **F06 · System Update** | `window.ELYSIUM_SYSTEM` (+ `<meta name="app-version">`) | `ElysiumSystem.show()` · `elysiumForceUpdate(isLogout)` |
| `elysium-compliance.js` | **F08 · Cookies Management** (RGPD UE / Ley 8968 CR) | `window.ELYSIUM_CONSENT` | `ElysiumConsent.get/isGranted/onGranted/open/purgeLocalData` |
| `elysium-seasonal.js` | **F11 · Efectos de Temporada** | `window.ELYSIUM_SEASONAL` | 🚧 reservado; código de producción en escritura |
| `elysium-mouse.js` | **F12 · Magic Mouse** | `window.ELYSIUM_MOUSE` | `ElysiumMouse.enable()` · `.disable()` |
| `elysium-audio.js` | **F21 · System Sound** | assets en `/sounds` | `ElysiumAudio.play/mute/toggle/setVolume/isMuted/…` |

Orden de carga recomendado:

```html
<head>
  <script> window.ELYSIUM_PRELOADER = { … }; </script>
  <script src="elysium-core/elysium-preloader.js"></script>
</head>
<body>
  …
  <script> window.ELYSIUM_SYSTEM  = { … }; </script>
  <script> window.ELYSIUM_CONSENT = { … }; </script>
  <script src="elysium-core/elysium-system-info.js"></script>
  <script src="elysium-core/elysium-compliance.js"></script>
  <script src="elysium-core/elysium-mouse.js"></script>
  <script src="elysium-core/elysium-audio.js"></script>
</body>
```

Los componentes cooperan entre sí pero funcionan de forma independiente: el
flag `sys_action` conecta el System Update (F06) con el mensaje de la Loading
Page (F01); `purgeLocalData()` (F08) reutiliza el pipeline de F06 si está
presente; y el panel de ajustes (F22), alojado dentro de la modal de
`elysium-system-info.js`, gobierna los motores de cursor (F12) y sonido (F21)
leyendo y escribiendo sus APIs globales, sin duplicar su lógica.

`elysium-audio.js` requiere la carpeta `/sounds` en la raíz del proyecto con
los cuatro samples: `click-en-boton`, `enviado-con-exito`, `error` y
`toque-al-vacio` (formato `.m4a`, con `.wav` de respaldo).
