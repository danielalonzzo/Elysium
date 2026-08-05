# Elysium λ — Software Architecture Standards & Tiered Implementation Guide
### v2.9.0 · Julio 2026

> **Cómo leer este documento.** Está escrito en cuatro niveles de profundidad.
> La Parte I está pensada para cualquier persona que se incorpora al equipo,
> sin tecnicismos. La Parte II es el catálogo técnico de cada función con su
> código canónico, junto con las reglas de distribución del núcleo y la
> arquitectura de carpetas. La Parte III es la especificación estricta que
> siguen los asistentes de IA al generar código para Elysium. La Parte IV es
> el protocolo de arranque que el empleado copia y pega para iniciar una
> sesión de trabajo con la IA. Si usted es nuevo, empiece por el principio y
> deténgase donde lo necesite; si usted es un agente de IA, las Partes III y
> IV son vinculantes y el resto es su contexto.
>
> **Documento complementario.** El proceso comercial previo (recolección de
> datos del prospecto, informe de diagnóstico, generación y publicación del
> prototipo) se rige por [`ELYSIUM-PROTOTYPING.md`](ELYSIUM-PROTOTYPING.md).

---

# PARTE I · BIENVENIDO AL ECOSISTEMA ELYSIUM

## 1 · Qué hacemos

**Elysium λ Development & Research** ([elysiumdr.eu](https://elysiumdr.eu)) construye
infraestructura digital para pequeñas y medianas empresas: sitios web, plataformas
y CRMs privados, siempre bajo el modelo de **«0 € de costes de desarrollo»**; el
cliente no paga el software por adelantado, sino una suscripción que lo mantiene
vivo, seguro y en evolución.

Todo lo que entregamos se arma con **funciones estandarizadas**: piezas de
software que ya están diseñadas, probadas y documentadas. Cada plan de
suscripción incluye un conjunto concreto de esas funciones. Este documento es
el mapa completo: qué funciones existen, qué hace cada una, en qué plan se
entrega y cómo se implementa.

## 2 · Los 5 planes y sus funciones

Parrilla oficial, idéntica a la publicada en [elysiumdr.eu/services](https://elysiumdr.eu/services),
expresada en funciones estandarizadas:

| **Funciones** | Alojamiento | Presencia | Sistema | ⭐ Operación<br>*Más popular* |
|---|:---:|:---:|:---:|:---:|
| | **99 €** / año | **70 €** / mes<br><sub>Opcional: 700 € / año</sub> | **99 €** / mes<br><sub>Opcional: 990 € / año</sub> | **120 €** / mes<br><sub>Opcional: 1 200 € / año</sub> |
| Domain and Server Management | ✅ | ✅ | ✅ | ✅ |
| Loading Page | — | ✅ | ✅ | ✅ |
| Header Mobile-First | — | ✅ | ✅ | ✅ |
| Scroll Reveal | — | ✅ | ✅ | ✅ |
| Anchor Glide | — | ✅ | ✅ | ✅ |
| Information System | — | ✅ | ✅ | ✅ |
| System Settings | — | ✅ | ✅ | ✅ |
| System Update | — | ✅ | ✅ | ✅ |
| Security Core | — | ✅ | ✅ | ✅ |
| Cookies Management | — | ✅ | ✅ | ✅ |
| Magic Bottom | — | ✅ | ✅ | ✅ |
| Elysium Signature | — | ✅ | ✅ | ✅ |
| Efectos de Temporada * | — | ✅ | ✅ | ✅ |
| Magic Mouse | — | ✅ | ✅ | ✅ |
| System Sound | — | ✅ | ✅ | ✅ |
| Clean URLs | — | ✅ | ✅ | ✅ |
| Discovery Core | — | ✅ | ✅ | ✅ |
| SEO | — | ✅ | ✅ | ✅ |
| Dynamic Theme | — | ✅ | ✅ | ✅ |
| Theme Switcher | — | ✅ | ✅ | ✅ |
| Multi-language | — | ✅ | ✅ | ✅ |
| Multi-Currency | — | ✅ | ✅ | ✅ |
| Web App Downloader | — | ✅ | ✅ | ✅ |
| Personalized CRM <sub>(incluye roles, permisos y entorno confidencial)</sub> | — | — | ✅ | ✅ |

<sub>* El código de producción de Efectos de Temporada está en proceso de
escritura; la sección F11 queda preparada para integrar el código final. El
resto de funciones están operativas (ver Parte II).</sub>

**Lógica de la escalera.** Alojamiento cubre exclusivamente la operación de
dominio y servidor. Presencia añade el desarrollo web completo con todo el
paquete de experiencia, preferencias e idiomas: tema, divisas, aplicación
instalable y cumplimiento legal. Sistema añade el CRM privado y el área del
cliente. Operación añade la capa de dinero.

Conviene leer esta parrilla sabiendo qué **no** dice. Recoge las funciones
técnicas ya implementadas (F1–F21), y a ese nivel Presencia y Sistema comparten
casi todo: la diferencia comercial entre planes no está en el front-end, sino en
la capa operativa —agenda, ficha de cliente, cobro, bonos de sesiones e informes
de ocupación— que la web ya publica y que esta parrilla todavía no numera.
Cuando esas funciones se estandaricen habrá que darles su código F y añadirlas
aquí; hasta entonces, **esta tabla ya no es idéntica a la de
elysiumdr.eu/services** y la que manda comercialmente es la de la web.

## 3 · Cada función en una frase

| Función | Qué recibe el cliente |
|---|---|
| **Loading Page** | Una pantalla de bienvenida con su logo mientras el sitio termina de cargar; nunca una página a medio pintar. |
| **Header Mobile-First** | Menú superior que se adapta al móvil (hamburguesa) y reacciona con elegancia al hacer scroll. |
| **Scroll Reveal** | Las secciones aparecen con una animación suave a medida que se baja por la página. |
| **Anchor Glide** | Al pulsar un enlace interno, la página se desliza con suavidad hasta la sección exacta, sin que el menú la tape. |
| **Information System** | Un panel discreto en el pie de página con la versión del sitio, licencias, marco legal y estado del sistema. |
| **System Settings** | Dentro de ese mismo panel, los controles con los que cada visitante ajusta a su gusto el sonido, el cursor, el tema, el idioma, la divisa y la región. |
| **System Update** | Un botón que actualiza el sitio a la última versión al instante, limpiando cachés y datos antiguos. |
| **Security Core** | Blindaje del sitio con cabeceras de seguridad de nivel corporativo: HSTS, CSP y protección anti clickjacking, entre otras. |
| **Cookies Management** | Aviso y gestor de cookies conforme al RGPD (UE) y a la Ley 8968 (Costa Rica), con preferencias granulares. |
| **Magic Bottom** | Botón flotante de contacto rápido: WhatsApp, redes y acciones directas siempre a un toque. |
| **Elysium Signature** | El sello «Developed by Elysium λ» en el pie de cada entregable. |
| **Efectos de Temporada** | Decoración automática por fechas: nieve en Navidad, fuegos en Año Nuevo y lo que la marca pida. |
| **Magic Mouse** | Un cursor personalizado con la identidad del cliente, con reacciones al pasar sobre botones y enlaces. |
| **System Sound** | Respuesta sonora discreta al pulsar: confirmación, error o clic, con control de volumen y silencio. |
| **Clean URLs** | Enlaces bonitos y sin `.html`, el logo del cliente en la pestaña del navegador y una tarjeta con imagen cuando alguien comparte el enlace por WhatsApp o LinkedIn. |
| **Discovery Core** | Los archivos que le abren la puerta a Google y a las IA: mapa del sitio, permisos de rastreo y una ficha que explica el negocio a ChatGPT, Gemini y Perplexity. |
| **SEO** | Todo lo que hace que Google entienda, posicione y muestre bien cada página, y que las IA la citen sin inventar. |
| **Dynamic Theme** | El sitio alterna solo entre modo claro y oscuro según la hora del día. |
| **Theme Switcher** | El control para que cada visitante elija el modo que prefiera; el sitio lo recuerda. |
| **Multi-language** | El sitio en varios idiomas, con detección automática del idioma del visitante. |
| **Multi-Currency** | Los precios se muestran en la divisa del visitante, con tipos de cambio al día. |
| **Web App Downloader** | La web se puede instalar como app en el teléfono y funciona incluso sin conexión. |
| **Personalized CRM** | Plataforma privada de gestión a medida: usuarios, roles, permisos y entorno confidencial. |

---

# PARTE II · CATÁLOGO TÉCNICO DE FUNCIONES

Cada función tiene un identificador estable (`F01` a `F23`), una especificación y
su implementación canónica. Las funciones nucleares (F01, F05 con F06,
F08, F12 y F21) viven como componentes plug-and-play en [`elysium-core/`](elysium-core/);
el resto se implementa con el código canónico de esta sección. Todo el código es
**zero-dependency**, con prefijos `ely-` y `Elysium*`, y JSDoc.

---

### F01 · Loading Page

Overlay de carga a pantalla completa con logotipo de marca, duración mínima
garantizada (evita el parpadeo en cargas rápidas), bloqueo de scroll, salida en
dos fases (fade CSS y luego retirada del DOM) y timeout de seguridad de 8 s.
Respeta `prefers-reduced-motion` (WCAG 2.1 AA) y muestra «Actualizando…» o
«Cerrando sesión…» cuando la recarga proviene de un System Update (flag
`sys_action`).

**Código:** componente nuclear en [`elysium-core/elysium-preloader.js`](elysium-core/elysium-preloader.js).

```html
<head>
  <script> window.ELYSIUM_PRELOADER = { brandName:'Mi Marca', accent:'#2997ff', minDuration:1000 }; </script>
  <script src="elysium-core/elysium-preloader.js"></script>
</head>
```

---

### F02 · Header Mobile-First

Cabecera responsive completa: menú hamburguesa con drawer animado, bloqueo del
scroll de fondo mientras está abierto, cierre automático al navegar o pulsar
`Escape`, y comportamiento reactivo al scroll (clase `scrolled` a partir de
50 px; opcionalmente se oculta al bajar y reaparece al subir).

```js
/** Header Mobile-First — implementación canónica */
function initHeader({ headerSel = '.navbar', toggleSel = '.menu-toggle', drawerSel = '.nav-menu', hideOnScroll = false } = {}) {
    const header = document.querySelector(headerSel);
    const toggle = document.querySelector(toggleSel);
    const drawer = document.querySelector(drawerSel);

    // Drawer móvil
    if (toggle && drawer) {
        const open  = () => { drawer.classList.add('open');    document.body.style.overflow = 'hidden'; toggle.setAttribute('aria-expanded','true'); };
        const close = () => { drawer.classList.remove('open'); document.body.style.overflow = '';       toggle.setAttribute('aria-expanded','false'); };

        toggle.addEventListener('click', () => drawer.classList.contains('open') ? close() : open());
        drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }

    // Reacción al scroll
    if (header) {
        let lastY = window.scrollY;
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            header.classList.toggle('scrolled', y > 50);
            if (hideOnScroll) header.classList.toggle('header-hidden', y > lastY && y > 100);
            lastY = y;
        }, { passive: true });
    }
}
```

---

### F03 · Scroll Reveal

Los elementos con clase `.reveal` entran con fade-up cuando alcanzan el
viewport, una sola vez (`unobserve` tras revelar, para liberar memoria).

```js
/** Scroll Reveal — implementación canónica */
function initScrollReveal(selector = '.reveal') {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);          // revelar una sola vez
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll(selector).forEach(el => observer.observe(el));
}
```
```css
.reveal { opacity: 0; transform: translateY(24px); transition: opacity .6s ease, transform .6s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; transition: none; } }
```

---

### F04 · Anchor Glide

Scroll suave a anclas internas descontando la altura de la cabecera fija, para
que el título de la sección nunca quede oculto tras el header.

```js
/** Anchor Glide — implementación canónica */
function initAnchorGlide(headerSel = '.navbar') {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.getElementById(href.slice(1));
            if (!target) return;
            e.preventDefault();
            const offset = document.querySelector(headerSel)?.offsetHeight || 0;
            window.scrollTo({
                top: target.getBoundingClientRect().top + window.pageYOffset - offset,
                behavior: 'smooth'
            });
        });
    });
}
```

---

### F05 · Information System

Etiqueta de versión (`V3.6.2`, según el sistema del §7) inyectada en el footer que despliega el
modal de información del sistema: versión y build, licencia de producto, marco
legal y de seguridad, estado de la infraestructura conectada (red y latencia
contra un `healthEndpoint`), información corporativa y atribuciones de software.
La versión se resuelve desde `<meta name="app-version">`; es **un único punto de
verdad por proyecto**, nunca constantes duplicadas en JS.

> **Relación con F22 System Settings.** Esta modal es el **contenedor**; los
> ajustes del visitante son una función aparte que se inyecta dentro de ella
> como una sección más. F05 informa (solo lectura); F22 modifica (escritura).
> Un proyecto puede llevar F05 sin F22 y la modal se pinta igual.

**Código:** componente nuclear en [`elysium-core/elysium-system-info.js`](elysium-core/elysium-system-info.js).

```html
<meta name="app-version" content="V3.6.2">
…
<script>
  window.ELYSIUM_SYSTEM = {
    stage: 'Beta', license: 'ELY-2026-XXXX',
    brandName: 'MI MARCA', accent: '#2997ff', theme: 'dark',
    legal: { terms: '/terms.html', privacy: '/privacy.html' },
    healthEndpoint: '/manifest.json'
  };
</script>
<script src="elysium-core/elysium-system-info.js"></script>
```

---

### F06 · System Update

Pipeline de *hard reset* disparado desde el botón «Actualizar» del Information
System o al cerrar sesión: purga cookies, `localStorage` y `sessionStorage`,
IndexedDB (borrado *awaited*, incluidas las bases internas de Firebase), Cache
Storage y Service Workers, y recarga con *cache-buster*. Un temporizador de
seguridad (1,8 s) garantiza la recarga aunque el navegador bloquee alguna
promesa. El flag `sys_action` sobrevive en `sessionStorage` para que la Loading
Page informe de la acción tras la recarga.

**Código:** incluido en [`elysium-core/elysium-system-info.js`](elysium-core/elysium-system-info.js); API `window.elysiumForceUpdate(isLogout)`.

---

### F07 · Security Core

Plantilla de cabeceras de seguridad servidas por el hosting: HSTS con preload,
`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy` y Content-Security-Policy, más *cache tiering* por tipo de
archivo (HTML `no-cache`, media 1 año, CSS/JS 1 semana, `sw.js` `no-store`).

```jsonc
// Security Core — bloque canónico (firebase.json o _headers equivalente)
{
  "source": "**",
  "headers": [
    { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
    { "key": "X-Frame-Options",           "value": "SAMEORIGIN" },
    { "key": "X-Content-Type-Options",    "value": "nosniff" },
    { "key": "Referrer-Policy",           "value": "strict-origin-when-cross-origin" },
    { "key": "Permissions-Policy",        "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
    { "key": "Content-Security-Policy",   "value": "default-src 'self'; script-src 'self' 'sha256-…'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" }
  ]
}
```

> **Regla:** `script-src` **sin** `unsafe-inline` y **sin nonces estáticos**;
> un nonce fijo equivale a no tener nonce. En hosting estático se usan hashes
> `sha256-…` de cada inline script.

---

### F08 · Cookies Management

Banner de primera visita más gestor granular de preferencias con registro
**versionado y con timestamp ISO** (prueba de consentimiento explícito, Art. 7
RGPD y Art. 5 Ley 8968), re-solicitud automática al cambiar la versión de la
política, *gating* real de scripts de terceros (los analytics no se cargan sin
opt-in) y API de derechos: revocación desde el footer y purga local de datos
(derecho de supresión, reutiliza F06).

**Código:** componente nuclear en [`elysium-core/elysium-compliance.js`](elysium-core/elysium-compliance.js).

```html
<!-- Script de terceros condicionado al consentimiento -->
<script type="text/plain" data-consent="analytics"
        data-src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
```

---

### F09 · Magic Bottom

Botón flotante (FAB) de contacto y acciones rápidas: WhatsApp, redes y, según el
proyecto, accesos directos. Expansión al toque, cierre al pulsar fuera y
posicionamiento que no colisiona con el footer.

```js
/** Magic Bottom — implementación canónica */
function initMagicBottom(mainSel = '#fab-main', wrapperSel = '#fab-wrapper') {
    const main = document.querySelector(mainSel);
    const wrap = document.querySelector(wrapperSel);
    if (!main || !wrap) return;

    main.addEventListener('click', e => { e.stopPropagation(); wrap.classList.toggle('active'); });
    document.addEventListener('click', e => {
        if (wrap.classList.contains('active') && !wrap.contains(e.target)) wrap.classList.remove('active');
    });
}
```

---

### F10 · Elysium Signature

Sello de autoría «Developed by Elysium λ Development & Research» con enlace a
elysiumdr.eu en el footer de todo entregable con interfaz. Es canal de captación
orgánica y garantía de origen. El Information System (F05) lo emite también en
el pie de su modal.

```html
<p class="footer-credit">
  Developed by
  <a href="https://elysiumdr.eu" target="_blank" rel="noopener noreferrer">
    Elysium λ Development &amp; Research</a>.
</p>
```

---

### F11 · Efectos de Temporada

> 🚧 **Estado: código de producción en escritura.** Esta sección define el
> contrato de integración; el bloque de código se sustituirá por la versión
> final cuando esté lista. No implemente versiones provisionales por su cuenta.

Motor de decoración estacional activado automáticamente por ventanas de fechas:
nieve en Navidad, confeti o fuegos en Año Nuevo y cualquier campaña de marca.
Se entrega en **todos los planes con desarrollo web** (Presencia o superior).

**Contrato de integración (vinculante para el código final):**

| Aspecto | Especificación |
|---|---|
| Archivo destino | `elysium-core/elysium-seasonal.js` |
| Configuración | `window.ELYSIUM_SEASONAL = { seasons: [{ name, from:'MM-DD', to:'MM-DD', effect, color }] }` |
| API pública | `ElysiumSeasonal.start()` · `ElysiumSeasonal.stop()` |
| Restricciones | Canvas con `pointer-events:none`; `z-index` 99997 (bajo modales); desactivado con `prefers-reduced-motion`; densidad reducida en móvil; soporte de ventanas que cruzan el año (ej. `12-31` a `01-02`). |

```js
/* ══════════════════════════════════════════════════════════════════
 * [RESERVADO · F11 EFECTOS DE TEMPORADA]
 * Integrar aquí el código final de producción cuando esté aprobado.
 * Debe cumplir el contrato de integración descrito arriba.
 * ══════════════════════════════════════════════════════════════════ */
```

---

### F12 · Magic Mouse

Cursor de estado múltiple bajo el concepto «Gravedad Lambda Etérea»: sustituye
el puntero nativo por un sistema de tres capas que reacciona a la cinemática
del movimiento. Se entrega en **todos los planes con desarrollo web** (Presencia o
superior).

**Código:** componente nuclear en [`elysium-core/elysium-mouse.js`](elysium-core/elysium-mouse.js)
(reproducido íntegro en el Anexo F).

**Los cuatro estados del cursor.**

| Estado | Comportamiento |
|---|---|
| Movimiento | Núcleo que sigue al ratón sin retardo; aura-cometa que lo persigue por interpolación (`LERP 0.35`) y se **estira en la dirección del desplazamiento**, comprimiéndose en perpendicular, en proporción a la velocidad suavizada. |
| Reposo | Tras `idleTimeout` (1 500 ms), el núcleo se desvanece y revela el símbolo `λ`, mientras un halo exterior entra en ciclo de respiración de 3,4 s. |
| Clic | Onda de choque (`ripple`) que se expande y desvanece en 0,5 s desde el punto exacto de la pulsación. |
| Salida del viewport | Desvanecimiento del conjunto y reaparición al volver a entrar. |

**Configuración y API.**

```js
// Configuración (opcional, antes de cargar el script)
window.ELYSIUM_MOUSE = {
    accent:       'var(--color-accent, #2997ff)',  // hereda el acento del sitio
    ringSize:     32,      // px — radio base del aura-cometa
    dotSize:      8,       // px — diámetro del núcleo
    lambdaSymbol: 'λ',     // carácter revelado en reposo
    idleTimeout:  1500     // ms de inactividad hasta el estado de reposo
};

// API pública — la consume F22 System Settings
window.ElysiumMouse = {
    enable:  function () {},   // monta el cursor personalizado
    disable: function () {}    // lo retira y devuelve el cursor nativo
};
```

**Garantías de rendimiento y accesibilidad.** Solo se monta si el dispositivo
tiene puntero de precisión (`pointer: fine`) y el visitante no ha pedido reducir
el movimiento; ambas condiciones se vigilan en vivo con `matchMedia`, de modo
que conectar o desconectar un ratón activa o desactiva el cursor sin recargar.
El bucle de animación escribe **únicamente `transform`** (nunca `top`/`left`),
por lo que no provoca reflow; todas las capas llevan `pointer-events: none` para
no interceptar clics, y el `ripple` se crea dentro de `requestAnimationFrame`
para no mutar el DOM durante el `mousedown` y no romper la selección de texto.

---

### F13 · Dynamic Theme

Motor de tema automático: el sitio alterna entre claro y oscuro según la franja
horaria (límites y zona horaria configurables), aplicando variables CSS sobre
`:root[data-theme]`. Si existe una preferencia manual guardada por el Theme
Switcher (F14), esta manda.

```js
/** Dynamic Theme — implementación canónica */
function initDynamicTheme({ timeZone = undefined, lightStart = 6, lightEnd = 18 } = {}) {
    const mode = localStorage.getItem('theme_mode') || 'auto';   // 'light' | 'dark' | 'auto'

    const hourNow = () => {
        try { return parseInt(new Date().toLocaleString('en-US', { timeZone, hour12: false, hour: 'numeric' })); }
        catch { return new Date().getHours(); }
    };

    const isLight = mode === 'light' || (mode === 'auto' && hourNow() >= lightStart && hourNow() < lightEnd);
    document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
    return isLight;
}
```
```css
:root[data-theme="dark"]  { --color-bg:#0B0B0B; --color-surface:#18181A; --color-text:#F5F5F7; --color-text-dim:#A1A1A6; }
:root[data-theme="light"] { --color-bg:#FAFAFA; --color-surface:#FFFFFF; --color-text:#1D1D1F; --color-text-dim:#6E6E73; }
```

---

### F14 · Theme Switcher

Control visible (en el header o en el Magic Bottom) para que el visitante fije
su modo preferido; la elección persiste en `localStorage` y prevalece sobre el
Dynamic Theme en visitas futuras.

```js
/** Theme Switcher — implementación canónica (complementa F13) */
function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme_mode', next);       // la preferencia manual manda sobre el modo auto
    document.documentElement.dataset.theme = next;
}
```

---

### F15 · Multi-language

Arquitectura multi-idioma por prefijo de ruta (`/en/`, `/es/`, `/pt/`):
detección del idioma del navegador (familias romances hacia el idioma local, el
resto hacia inglés), redirección inicial, conmutador manual con preferencia
persistida y resolución de enlaces relativa a la profundidad de página.

```js
/** Multi-language — implementación canónica */
(function initLangRouting({ localPrefixes = ['pt','es','fr','it','ro','ca','gl'], localLang = 'es', storageKey = 'lang_pref' } = {}) {
    let pref = localStorage.getItem(storageKey);
    if (!pref) {
        const nav = (navigator.language || '').toLowerCase().split('-')[0];
        pref = localPrefixes.includes(nav) ? localLang : 'en';
    }
    const path = window.location.pathname;
    const onEn = path.startsWith('/en/') || path === '/en';

    if (pref === 'en' && !onEn && (path.endsWith('.html') || path.endsWith('/') || path === '')) {
        window.location.replace('/en' + path);
    } else if (pref === localLang && onEn) {
        window.location.replace(path.replace(/^\/en\/?/, '/') || '/');
    }

    window.toggleLanguage = function () {
        const toEn = !onEn;
        localStorage.setItem(storageKey, toEn ? 'en' : localLang);
        window.location.href = toEn ? '/en' + path : (path.replace(/^\/en\/?/, '/') || '/');
    };
})();
```

---

### F16 · Multi-Currency

Conversión de divisas en tiempo real: los elementos con `data-price` (valor en
divisa base) se re-formatean en la divisa elegida por el visitante, con tipos de
cambio cacheados 12 h y formato local vía `Intl.NumberFormat`.

```js
/** Multi-Currency — implementación canónica */
async function initMultiCurrency({
    base = 'EUR',
    apiUrl = 'https://api.frankfurter.dev/v1/latest',
    storageKey = 'currency_pref',
    cacheKey = 'currency_rates',
    ttlMs = 12 * 3600 * 1000
} = {}) {
    // 1. Tipos de cambio con caché de 12 h
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(cacheKey)); } catch (_) {}
    if (!cached || Date.now() - cached.at > ttlMs) {
        const res = await fetch(apiUrl + '?base=' + base);
        cached = { at: Date.now(), rates: (await res.json()).rates };
        cached.rates[base] = 1;
        try { localStorage.setItem(cacheKey, JSON.stringify(cached)); } catch (_) {}
    }

    // 2. Render de precios en la divisa activa
    const render = currency => {
        const rate = cached.rates[currency];
        if (!rate) return;
        const fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency });
        document.querySelectorAll('[data-price]').forEach(el => {
            el.textContent = fmt.format(parseFloat(el.dataset.price) * rate);
        });
        localStorage.setItem(storageKey, currency);
    };

    render(localStorage.getItem(storageKey) || base);
    window.setCurrency = render;    // <select onchange="setCurrency(this.value)">
}
```

---

### F17 · Web App Downloader

`manifest.json` más Service Worker: el sitio es instalable en el móvil como app,
arranca al instante y tolera cortes de red. Estrategia **stale-while-revalidate**
(sirve caché de inmediato y actualiza en segundo plano); el propio `sw.js` se
sirve con `Cache-Control: no-store` (regla del Security Core) para que los
despliegues lleguen siempre.

```js
/** Web App Downloader — sw.js canónico (stale-while-revalidate) */
const CACHE = 'app-cache-v1';
const PRECACHE = ['/', '/index.html', '/css/style.css', '/js/main.js'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE))));
self.addEventListener('activate', e => e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
));
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
        caches.match(e.request).then(cached => {
            const fresh = fetch(e.request).then(res => {
                if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
                return res;
            }).catch(() => cached);
            return cached || fresh;      // caché al instante, red en segundo plano
        })
    );
});
```

---

### F18 · Personalized CRM

Plataforma CRM privada a medida con usuarios, roles, permisos y entorno
confidencial: autenticación Firebase, Firestore con reglas de seguridad por rol
(root, admin, client), anti-escalada de privilegios, validación de esquema en
la creación de documentos y Cloud Functions para email transaccional (tokens
HMAC de baja), integraciones de calendario y secretos en Secret Manager; nunca
credenciales en el repositorio.

```text
// Personalized CRM — reglas de seguridad canónicas (firestore.rules)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    function isOwner(userId) { return request.auth != null && request.auth.uid == userId; }

    match /users/{userId} {
      allow read:   if isOwner(userId) || isAdmin();
      // El usuario no puede autoasignarse 'admin' al crearse…
      allow create: if isOwner(userId)
                    && (!('role' in request.resource.data) || request.resource.data.role == 'client');
      // …ni cambiar su rol al actualizar (anti-escalada de privilegios)
      allow update: if (isOwner(userId)
                        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']))
                    || isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

---

### F19 · Discovery Core

Los archivos de raíz que le dicen a las máquinas qué existe en el sitio, qué
pueden leer y dónde está la información fiable. Es la capa de acceso; el
significado y el posicionamiento los aporta F20.

Se entregan cinco piezas: `robots.txt`, `sitemap.xml`, `llms.txt`,
`llms-full.txt` y la verificación de Google Search Console.

**1 · `robots.txt` con política de crawlers de IA.**

> ⚠️ **La regla que casi todos incumplen.** Según el protocolo de exclusión de
> robots (RFC 9309), un rastreador obedece **únicamente al grupo más específico
> que le corresponde**, y ese grupo **sustituye por completo** al de
> `User-agent: *`. Por tanto, declarar `User-agent: GPTBot` con solo `Allow: /`
> no hereda las restricciones del grupo genérico: deja las rutas privadas
> abiertas a ese rastreador. **Todo grupo específico debe repetir íntegramente
> sus `Disallow`.** Es un fallo silencioso y frecuente; se verifica en cada
> entrega.

La postura por defecto de Elysium es de **máxima visibilidad**: se permite a
todos los rastreadores de IA, tanto los de búsqueda con citación como los de
entrenamiento, porque la presencia en las respuestas generativas es hoy un
canal de captación equivalente al buscador. Los límites de seguridad son los
mismos que para cualquier rastreador: las rutas de cuenta, administración y
flujo privado quedan fuera para todos.

Se usa la sintaxis de grupo (varias líneas `User-agent:` consecutivas
compartiendo un solo conjunto de reglas), que es válida en el estándar y evita
mantener veinte bloques duplicados.

```text
# ═══ Páginas públicas rastreables. Cuenta, administración y flujo, no. ═══
User-agent: *
Allow: /
Disallow: /admin*
Disallow: /onboarding*
Disallow: /auth-action*
Disallow: /perfil*
Disallow: /*.py$

# ═══ Asistentes y buscadores de IA: mismas fronteras de seguridad ═══
# Un grupo específico NO hereda del grupo *; por eso se repiten los Disallow.
User-agent: GPTBot
User-agent: ChatGPT-User
User-agent: OAI-SearchBot
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: Google-Extended
User-agent: GoogleOther
User-agent: Applebot
User-agent: Applebot-Extended
User-agent: Amazonbot
User-agent: CCBot
User-agent: Bytespider
User-agent: cohere-ai
User-agent: MistralAI-User
User-agent: meta-externalagent
User-agent: meta-externalfetcher
Allow: /
Disallow: /admin*
Disallow: /onboarding*
Disallow: /auth-action*
Disallow: /perfil*

Sitemap: https://dominio.com/sitemap.xml
```

Cada proveedor separa el bot que entrena modelos del que alimenta las respuestas
con citación (`GPTBot` frente a `OAI-SearchBot`, `ClaudeBot` frente a
`Claude-SearchBot`, `Applebot` frente a `Applebot-Extended`). Si un cliente pide
excluirse del entrenamiento, se restringe **solo** el bot de entrenamiento y se
deja intacto el de búsqueda, y la decisión se documenta por escrito con su firma.

**2 · `sitemap.xml`.** Una entrada por URL indexable, con `lastmod` real (nunca
la fecha de hoy por defecto) y las alternativas de idioma con `xhtml:link`
cuando aplique F15. Incluye todos los árboles de idioma; nunca páginas con
`noindex`, redirecciones ni rutas bloqueadas en `robots.txt`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://dominio.com/</loc>
    <lastmod>2026-07-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="es" href="https://dominio.com/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://dominio.com/en/"/>
  </url>
</urlset>
```

**3 · `llms.txt`.** Índice curado en Markdown, en la raíz del dominio, que
presenta el sitio a los modelos de lenguaje: qué es la organización, cuáles son
las páginas canónicas con una línea de contexto cada una, los datos de contacto
y las advertencias de uso.

```markdown
# Nombre de la organización

> Una frase que define qué hace, dónde opera y en qué idiomas.

Párrafo breve de contexto: naturaleza del negocio, ubicación, alcance y
disponibilidad lingüística del sitio.

IMPORTANTE: para responder correctamente sobre esta organización, lea el
archivo ampliado, que contiene el contenido vigente de todas las páginas:
- [Texto completo para modelos de lenguaje](https://dominio.com/llms-full.txt)

## Páginas esenciales

- [Inicio](https://dominio.com/): Qué encuentra el visitante en esta página.
- [Servicios](https://dominio.com/servicios): Planes, precios y condiciones.
- [Sobre nosotros](https://dominio.com/nosotros): Trayectoria y metodología.

## Contacto y acceso

- Correo: info@dominio.com
- Teléfono y WhatsApp: +506 0000 0000
- Ubicación: Heredia, Costa Rica
- Área de clientes: https://dominio.com/perfil (requiere autenticación)

## Notas de uso

- Prefiera las URL canónicas limpias listadas arriba.
- Trate las reservas, formularios, perfiles y administración como rutas
  privadas de flujo de trabajo.
- No infiera precios, diagnósticos, garantías ni disponibilidad que no estén
  publicados de forma explícita en el sitio.
```

**4 · `llms-full.txt`.** Representación factual ampliada en texto plano: el
contenido vigente de todas las páginas públicas, con secciones por tema y, en
sitios multilingües, un bloque por idioma. Estructura canónica de sus
encabezados:

```text
# Marca — Representación factual ampliada
## Identidad
## Enfoque
## Servicios
## Trayectoria
## Opiniones de clientes
## Contacto
## Reservas y área de clientes
## Mapa del sitio público
## Páginas legales y de privacidad
## Arquitectura de descubrimiento
## Orientación para asistentes y sistemas de búsqueda
```

La sección final es la más importante y suele omitirse: fija por escrito qué
puede afirmar un asistente sobre el cliente y qué no (precios no publicados,
diagnósticos, garantías, disponibilidad). Es la única defensa práctica ante una
IA que responda de más en nombre del cliente.

> **Expectativa realista sobre `llms.txt`.** Google ha declarado que no lo
> admite ni piensa admitirlo, y los grandes rastreadores suelen ir directo al
> HTML. Elysium lo entrega igualmente por tres razones: cuesta poco, algunos
> asistentes sí lo consultan cuando se les da la URL, y obliga al equipo a
> redactar la síntesis factual del cliente, que después se reutiliza en el
> grafo de F20. **Nunca sustituye al HTML bien hecho ni se usa como control de
> acceso**; para eso está `robots.txt`.

**5 · Servicio y verificación.** Los tres archivos de texto se sirven con tipo
de contenido y caché explícitos, para que ningún proveedor los entregue como
descarga ni los sirva obsoletos:

```jsonc
{
  "source": "{llms.txt,llms-full.txt,robots.txt}",
  "headers": [
    { "key": "Content-Type",  "value": "text/plain; charset=utf-8" },
    { "key": "Cache-Control", "value": "no-cache, must-revalidate" }
  ]
}
```

La propiedad se verifica en **Google Search Console**, preferentemente por
registro DNS TXT (cubre el dominio entero, incluidos subdominios); si se usa el
archivo HTML de verificación, se conserva en la raíz de forma permanente y se
excluye del sitemap. Tras el lanzamiento: envío del sitemap, revisión del
informe de indexación y consulta del informe de rendimiento de IA generativa a
los 30 días. En negocios con sede física se activa además el Perfil de Empresa
de Google, que es de donde el buscador toma horarios, dirección y reseñas.

---

### F20 · SEO

La capa de significado: lo que va dentro de cada página para que Google la
posicione y para que los sistemas de IA la entiendan y la citen correctamente.
F19 da acceso; F20 da comprensión.

> **Fundamento.** Google es explícito: para aparecer en sus experiencias de IA
> no se exige marcado especial ni archivos nuevos. El requisito real es que la
> página esté indexada y sea elegible para mostrarse **con fragmento**. De ahí
> que `max-snippet:-1` sea obligatorio en el estándar: sin fragmento, la página
> queda fuera de las respuestas generativas.

**1 · Bloque `<head>` canónico.** Se replica en cada página cambiando solo los
valores; lo marcado como condicional aplica únicamente con F15 Multi-language.

```html
<!DOCTYPE html>
<html lang="es-CR">                        <!-- idioma y región reales de la página -->
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Únicos por página: título 50-60 caracteres, descripción 140-160 -->
  <title>Servicio principal · Marca | Ciudad</title>
  <meta name="description" content="Propuesta de valor concreta en una frase, con el término por el que busca el cliente y una llamada a la acción.">
  <meta name="author" content="Nombre del titular">

  <!-- max-snippet:-1 es obligatorio: sin fragmento no hay respuestas con IA -->
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">

  <!-- Canónica absoluta y autorreferencial en todas las páginas -->
  <link rel="canonical" href="https://dominio.com/pagina">

  <!-- hreflang recíproco con x-default (condicional: solo con F15) -->
  <link rel="alternate" hreflang="es"        href="https://dominio.com/pagina">
  <link rel="alternate" hreflang="en"        href="https://dominio.com/en/pagina">
  <link rel="alternate" hreflang="x-default" href="https://dominio.com/pagina">

  <!-- Favicon y tarjeta de enlace compartido: los emite F23 Clean URLs.
       Fuente única; no duplicar aquí las etiquetas og: ni twitter:. -->
</head>
```

> **Prohibido `<meta name="keywords">`.** Google lo ignora desde 2009 y su único
> efecto real es enseñarle la estrategia de posicionamiento a la competencia. Si
> aparece en un proyecto heredado, se retira.

**2 · Grafo semántico `@graph`.** Un único bloque JSON-LD por página, con los
nodos enlazados por `@id`, en lugar de varios bloques sueltos y repetidos. Es la
diferencia entre que un motor entienda «esta organización, este servicio y esta
persona son la misma entidad a lo largo del sitio» o que vea fichas aisladas.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://dominio.com/#organizacion",
      "name": "Marca",
      "url": "https://dominio.com",
      "logo": "https://dominio.com/images/logo-512.png",
      "email": "info@dominio.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Heredia",
        "addressCountry": "CR"
      },
      "founder": { "@id": "https://dominio.com/#titular" },
      "sameAs": [
        "https://www.linkedin.com/company/…",
        "https://www.instagram.com/…"
      ]
    },
    {
      "@type": "Person",
      "@id": "https://dominio.com/#titular",
      "name": "Nombre del titular",
      "jobTitle": "Cargo",
      "worksFor": { "@id": "https://dominio.com/#organizacion" }
    },
    {
      "@type": "WebSite",
      "@id": "https://dominio.com/#website",
      "url": "https://dominio.com",
      "name": "Marca",
      "inLanguage": ["es", "en"],
      "publisher": { "@id": "https://dominio.com/#organizacion" }
    },
    {
      "@type": "WebPage",
      "@id": "https://dominio.com/pagina#webpage",
      "url": "https://dominio.com/pagina",
      "name": "Título de la página",
      "isPartOf": { "@id": "https://dominio.com/#website" },
      "about":    { "@id": "https://dominio.com/#organizacion" },
      "datePublished": "2026-01-15",
      "dateModified":  "2026-07-20"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://dominio.com/pagina#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio",    "item": "https://dominio.com/" },
        { "@type": "ListItem", "position": 2, "name": "Servicios", "item": "https://dominio.com/pagina" }
      ]
    }
  ]
}
</script>
```

**Tipos según la naturaleza del negocio.** Se elige el más específico que
describa la realidad, nunca uno más prestigioso o inexacto:

| Negocio | Tipo raíz | Nodos complementarios |
|---|---|---|
| Servicios profesionales, agencia | `ProfessionalService` | `Service`, `OfferCatalog`, `Offer` |
| Local con sede física | `LocalBusiness` o subtipo | `PostalAddress`, `GeoCoordinates`, `openingHoursSpecification` |
| Salud y terapias | `MedicalBusiness`, `MedicalTherapy` | `MedicalSpecialty`, `Physician` |
| Formación | `EducationalOrganization` | `Course`, `Person` |
| Contenido editorial | `Article`, `BlogPosting` | `author`, `datePublished`, `dateModified` |
| Preguntas frecuentes reales | `FAQPage` | `Question`, `AcceptedAnswer` |

Reglas de validez: el marcado describe **contenido visible** en la página;
`AggregateRating` y `Review` solo con reseñas reales y verificables; toda página
se valida en la Prueba de Resultados Enriquecidos de Google antes del
despliegue, y cero errores es criterio de aceptación.

**3 · Contenido e imágenes.** Un solo `<h1>` por página, jerarquía `h2`/`h3` sin
saltos y HTML semántico (`header`, `nav`, `main`, `article`, `section`,
`footer`). Todas las imágenes con `alt` descriptivo (vacío solo si son
decorativas), `width` y `height` explícitos para no generar CLS,
`loading="lazy"` salvo la imagen LCP, y formatos modernos con `<picture>`.

```html
<picture>
  <source srcset="/images/servicio.avif" type="image/avif">
  <source srcset="/images/servicio.webp" type="image/webp">
  <img src="/images/servicio.jpg" alt="Descripción precisa de lo que muestra la imagen"
       width="1200" height="800" loading="lazy" decoding="async">
</picture>
```

**4 · Legibilidad para máquinas.** Una IA solo puede citar el texto que logra
extraer y atribuir. Por tanto: el contenido sustantivo va en HTML, nunca solo
dentro de imágenes ni de JavaScript que se ejecute tras una interacción; cada
página responde a una intención concreta con encabezados que formulan la
pregunta real del usuario; los datos de contacto, precios y horarios aparecen
como texto visible **y** como dato estructurado; y se aporta criterio propio y
experiencia verificable en lugar de contenido genérico, que es justamente lo
que Google premia en sus experiencias generativas.

---

### F21 · System Sound

Capa sonora del ecosistema: respuesta acústica discreta a cada pulsación,
resuelta automáticamente según qué se pulsó. Se entrega en **todos los planes
con desarrollo web** (Presencia o superior).

**Código:** componente nuclear en [`elysium-core/elysium-audio.js`](elysium-core/elysium-audio.js)
(reproducido íntegro en el Anexo G).

**Las cuatro voces.** Cada una lleva su propia ganancia para compensar el nivel
del sample, ya que los archivos llegan casi a 0 dBFS. La voz `void` suena en casi
cada clic, así que va deliberadamente más contenida.

| Voz | Archivo | Cuándo suena |
|---|---|---|
| `button` | `click-en-boton.m4a` | Botones, enlaces y cualquier elemento interactivo real |
| `success` | `enviado-con-exito.m4a` | Formulario enviado, inicio de sesión, plan elegido |
| `error` | `error.m4a` | Validación fallida, credenciales incorrectas, fallo de operación |
| `void` | `toque-al-vacio.m4a` | Clic en cualquier zona no interactiva de la página |

**Resolución automática de la voz.** El motor escucha el clic globalmente en
**fase de captura** y recorre el árbol desde el elemento pulsado hacia arriba,
con esta prioridad: el marcado explícito `data-ely-sound` manda sobre todo lo
demás (y admite el valor `none` para silenciar una zona concreta); después, los
elementos de plan de suscripción suenan como confirmación; después, cualquier
elemento interactivo suena como botón; y si nada coincide, es zona muerta.

```html
<!-- Control explícito del sonido en cualquier elemento -->
<button data-ely-sound="success">Confirmar reserva</button>
<div    data-ely-sound="none">Zona deliberadamente silenciosa</div>
```

**Política de autoplay y anti-acumulación.** El `AudioContext` se crea al
cargar, nace en estado `suspended` (lo cual permite descargar y decodificar los
samples por adelantado) y solo se reanuda con el primer gesto real del usuario,
cumpliendo la política de reproducción automática de los navegadores. Para
evitar el apilamiento de ruido, una misma voz repetida en menos de 70 ms se
ignora, y si vuelve a dispararse, la instancia anterior se corta con un fundido
de 50 ms en lugar de solaparse.

**Configuración y API.**

```js
// API pública — la consume F22 System Settings
window.ElysiumAudio = {
    play:      function (voice) {},  // 'button' | 'success' | 'error' | 'void'
    mute:      function () {},
    unmute:    function () {},
    toggle:    function () {},
    isMuted:   function () { return false; },
    setMuted:  function (v) {},      // booleano
    getVolume: function () { return 0.6; },
    setVolume: function (v) {},      // flotante de 0.0 a 1.0
    ready:     function (voice) { return true; }   // ¿sample ya decodificado?
};
```

Persistencia en `localStorage` con las claves `ely-audio-muted` (`0`/`1`) y
`ely-audio-volume` (flotante). La ruta de la carpeta `/sounds` se deduce del
propio `<script>`, de modo que funciona igual desde `/`, `/es/` o
`/es/research/` sin rutas absolutas. Si un sample no está disponible, esa voz
queda muda sin romper el resto.

> **Regla de sobriedad.** El sonido acompaña, nunca interrumpe. Se entrega
> siempre con un control de silencio visible y accesible, y jamás se emplea en
> reproducción automática ni en bucles. En proyectos sanitarios o de contextos
> sensibles se entrega **silenciado por defecto**.

---

### F22 · System Settings

**Qué es.** El puesto de mando del visitante: el único lugar del sitio donde
puede ajustar a su gusto cómo se comporta la interfaz. Vive **dentro** de la
modal de Information System (F05), como una sección más entre las de versión,
seguridad e información corporativa, pero es una **función independiente** con
su propio alcance, su propio contrato y su propia línea en la matriz de planes.

**Por qué es una función aparte y no parte de F05.** Information System es un
panel de **lectura**: informa de la versión, el marco legal y el estado de la
infraestructura. System Settings es un panel de **escritura**: modifica el
comportamiento de otras funciones en vivo. Comparten contenedor por comodidad
del visitante (un solo punto de entrada desde el pie de página), pero se
facturan, se implementan y se prueban por separado. Un proyecto puede llevar
F05 sin F22, y la modal se pinta igual sin la sección de ajustes.

Se entrega en **todos los planes con desarrollo web** (Presencia o superior).

---

#### 22.1 · Principio de arquitectura: desacoplamiento estricto

El panel **no contiene la lógica de ningún motor**. Hace exactamente tres cosas:

1. **Lee** el estado actual de cada motor al abrirse la modal, mediante su
   *getter*.
2. **Escribe** en el motor cuando el visitante interactúa, mediante su *setter*.
3. **Anuncia** el cambio al resto de la aplicación mediante un evento, cuando el
   ajuste no pertenece a un motor con API propia.

Cada motor sigue siendo el dueño de su comportamiento y de su persistencia. La
consecuencia práctica es que **si un motor no está cargado, su fila no se
pinta** y el resto del panel funciona con normalidad; y que cambiar la
implementación de un motor nunca obliga a tocar el panel.

```js
// Patrón canónico de cada control: comprobar → leer → escribir
if (window.MotorX) {                       // 1. ¿existe el motor?
    control.checked = window.MotorX.getEstado();          // 2. leer
    control.addEventListener('change', function (e) {
        window.MotorX.setEstado(e.target.checked);        // 3. escribir
    });
}
```

**Respaldo cuando el motor no está disponible.** En los ajustes que deben
sobrevivir aunque su motor no haya cargado (por ejemplo, el sonido en una página
sin audio), el control escribe directamente en `localStorage` con la misma clave
que usaría el motor. Así, cuando el motor arranque en la siguiente página,
encontrará la preferencia ya fijada.

```js
if (window.ElysiumAudio) {
    window.ElysiumAudio.setMuted(!enabled);
} else {
    // El motor no está en esta página: se persiste con su misma clave
    try { localStorage.setItem('ely-audio-muted', enabled ? '0' : '1'); } catch (e) {}
}
```

---

#### 22.2 · Inventario de controles

Estos son los ocho ajustes del catálogo. Cada uno indica el motor que gobierna,
la clave de persistencia y el plan a partir del cual se entrega. Un proyecto
solo pinta las filas de las funciones que tiene contratadas.

| Ajuste | Control | Motor / API | Persistencia | Plan |
|---|---|---|---|---|
| Sonido del sistema | Interruptor | F21 `ElysiumAudio.setMuted()` | `ely-audio-muted` | Presencia |
| Nivel de volumen | `range` 0–100 | F21 `ElysiumAudio.setVolume()` | `ely-audio-volume` | Presencia |
| Cursor personalizado | Interruptor | F12 `ElysiumMouse.enable()` / `.disable()` | `ely-pref-cursor` | Presencia |
| Modo automático de tema | Interruptor | F13 `setThemeAutoMode()` | `theme_mode` | Presencia |
| Inicio del modo claro | `time` | F13 `setThemeSchedule()` | `theme_schedule` | Presencia |
| Inicio del modo oscuro | `time` | F13 `setThemeSchedule()` | `theme_schedule` | Presencia |
| Idioma predeterminado | `select` | F15 · evento `elysium:lang-changed` | `ely-pref-lang` | Presencia |
| Divisa por defecto | `select` | F16 · evento `elysium:currency-changed` | `ely-pref-currency` | Presencia |
| Región del usuario | `select` | evento `elysium:region-changed` | `ely-pref-region` | Presencia |

> **Unificación de claves.** El estándar fija los nombres de la tabla. Los
> proyectos existentes que usen otras claves (por ejemplo `user_region` en lugar
> de `ely-pref-region`) se migran en su siguiente ciclo de mantenimiento, para
> que una misma preferencia signifique lo mismo en toda la cartera.

**Bus de eventos.** Los ajustes que no pertenecen a un motor con API propia
anuncian su cambio con un `CustomEvent` sobre `window`, de modo que cualquier
parte de la aplicación pueda reaccionar sin que el panel sepa quién escucha:

```js
window.dispatchEvent(new CustomEvent('elysium:currency-changed', {
    detail: { currency: 'CRC' }
}));

// En cualquier otro módulo:
window.addEventListener('elysium:currency-changed', function (e) {
    renderPrices(e.detail.currency);
});
```

Eventos normalizados: `elysium:lang-changed`, `elysium:currency-changed` y
`elysium:region-changed`.

---

#### 22.3 · Estructura de inyección

Se emite como un grupo más de la modal, respetando el marcado de F05. Los
interruptores son un `checkbox` nativo oculto bajo un diseño CSS; se emplean
componentes nativos de HTML5 por su ligereza y su soporte en iOS y Android.

```html
<div class="ely-sec-label">AJUSTES DEL SISTEMA</div>
<div class="ely-sysinfo-group">

  <!-- Sonido del sistema (F21) -->
  <div class="ely-row">
    <span class="ely-row-label">Sonido del Sistema</span>
    <span class="ely-row-value">
      <label class="ely-toggle-switch">
        <input type="checkbox" id="ely-setting-sound">
        <span class="ely-slider"></span>
      </label>
    </span>
  </div>

  <!-- Volumen (F21) — la fila se atenúa cuando el sonido está silenciado -->
  <div class="ely-row" id="ely-vol-row">
    <span class="ely-row-label">Nivel de Volumen</span>
    <span class="ely-row-value">
      <div class="ely-range-wrapper">
        <input type="range" id="ely-setting-volume" min="0" max="100" class="ely-range-input">
        <span class="ely-range-val" id="ely-vol-val">60%</span>
      </div>
    </span>
  </div>

  <!-- Cursor personalizado (F12) -->
  <div class="ely-row">
    <span class="ely-row-label">Cursor Personalizado</span>
    <span class="ely-row-value">
      <label class="ely-toggle-switch">
        <input type="checkbox" id="ely-setting-cursor">
        <span class="ely-slider"></span>
      </label>
    </span>
  </div>

  <!-- Tema automático y horarios (F13) -->
  <div class="ely-row">
    <span class="ely-row-label">Modo Automático</span>
    <span class="ely-row-value">
      <label class="ely-toggle-switch">
        <input type="checkbox" id="ely-setting-auto-theme">
        <span class="ely-slider"></span>
      </label>
    </span>
  </div>
  <div class="ely-row">
    <span class="ely-row-label">Inicio del Modo Claro</span>
    <span class="ely-row-value">
      <input type="time" id="ely-setting-light-time" class="ely-sys-select">
    </span>
  </div>
  <div class="ely-row">
    <span class="ely-row-label">Inicio del Modo Oscuro</span>
    <span class="ely-row-value">
      <input type="time" id="ely-setting-dark-time" class="ely-sys-select">
    </span>
  </div>

  <!-- Idioma, divisa y región (F15 · F16) -->
  <div class="ely-row">
    <span class="ely-row-label">Idioma Predeterminado</span>
    <span class="ely-row-value">
      <select id="ely-setting-lang" class="ely-sys-select">
        <option value="es">Español (ES)</option>
        <option value="en">English (EN)</option>
        <option value="pt">Português (PT)</option>
      </select>
    </span>
  </div>
  <div class="ely-row">
    <span class="ely-row-label">Divisa por Defecto</span>
    <span class="ely-row-value">
      <select id="ely-setting-currency" class="ely-sys-select">
        <option value="EUR">EUR (€)</option>
        <option value="USD">USD ($)</option>
        <option value="CRC">CRC (₡)</option>
      </select>
    </span>
  </div>

</div>
```

---

#### 22.4 · Vinculación de eventos

Se ejecuta justo después de inyectar la modal en el DOM. Cada bloque comprueba
la existencia de su motor antes de tocar nada.

```js
/** System Settings — sincronización con los motores (implementación canónica) */
function bindSystemSettings(modal) {

    /* ── Sonido y volumen (F21) ──────────────────────────────────────── */
    var soundToggle = modal.querySelector('#ely-setting-sound');
    var volumeInput = modal.querySelector('#ely-setting-volume');
    var volumeRow   = modal.querySelector('#ely-vol-row');
    var volumeVal   = modal.querySelector('#ely-vol-val');

    if (soundToggle) {
        // Estado inicial: del motor si existe; si no, de la clave persistida
        var muted = window.ElysiumAudio
            ? window.ElysiumAudio.isMuted()
            : localStorage.getItem('ely-audio-muted') === '1';
        soundToggle.checked = !muted;

        soundToggle.addEventListener('change', function () {
            var enabled = soundToggle.checked;
            if (window.ElysiumAudio) {
                window.ElysiumAudio.setMuted(!enabled);
                if (enabled) window.ElysiumAudio.play('button');   // confirmación audible
            } else {
                try { localStorage.setItem('ely-audio-muted', enabled ? '0' : '1'); } catch (e) {}
            }
            // La fila de volumen se atenúa y se desactiva al silenciar
            if (volumeRow) {
                volumeRow.style.opacity = enabled ? '1' : '0.5';
                volumeRow.style.pointerEvents = enabled ? 'auto' : 'none';
            }
        });
    }

    if (volumeInput) {
        var applyVolume = function () {
            var val = parseInt(volumeInput.value, 10);
            if (volumeVal) volumeVal.textContent = val + '%';
            if (window.ElysiumAudio) {
                window.ElysiumAudio.setVolume(val / 100);
            } else {
                try { localStorage.setItem('ely-audio-volume', String(val / 100)); } catch (e) {}
            }
        };
        volumeInput.addEventListener('input', applyVolume);
        // Al soltar, una muestra audible del nivel elegido
        volumeInput.addEventListener('change', function () {
            applyVolume();
            if (window.ElysiumAudio && !window.ElysiumAudio.isMuted()) {
                window.ElysiumAudio.play('button');
            }
        });
    }

    /* ── Cursor personalizado (F12) ──────────────────────────────────── */
    var cursorToggle = modal.querySelector('#ely-setting-cursor');
    if (cursorToggle && window.ElysiumMouse) {
        cursorToggle.checked = localStorage.getItem('ely-pref-cursor') !== '0';
        cursorToggle.addEventListener('change', function () {
            if (cursorToggle.checked) {
                window.ElysiumMouse.enable();
                localStorage.setItem('ely-pref-cursor', '1');
            } else {
                window.ElysiumMouse.disable();
                localStorage.setItem('ely-pref-cursor', '0');
            }
        });
    }

    /* ── Tema automático y horarios (F13) ────────────────────────────── */
    var autoTheme = modal.querySelector('#ely-setting-auto-theme');
    if (autoTheme && window.getThemeAutoMode) {
        autoTheme.checked = window.getThemeAutoMode();
        autoTheme.addEventListener('change', function () {
            window.setThemeAutoMode(autoTheme.checked);
        });
    }

    var lightTime = modal.querySelector('#ely-setting-light-time');
    var darkTime  = modal.querySelector('#ely-setting-dark-time');
    if (lightTime && darkTime && window.getThemeSchedule) {
        var schedule = window.getThemeSchedule();
        lightTime.value = schedule.lightStart;
        darkTime.value  = schedule.darkStart;
        var updateSchedule = function () {
            window.setThemeSchedule(lightTime.value, darkTime.value);
        };
        lightTime.addEventListener('change', updateSchedule);
        darkTime.addEventListener('change', updateSchedule);
    }

    /* ── Idioma, divisa y región — persistir y anunciar ──────────────── */
    [
        { sel: '#ely-setting-lang',     key: 'ely-pref-lang',     evt: 'elysium:lang-changed',     prop: 'language' },
        { sel: '#ely-setting-currency', key: 'ely-pref-currency', evt: 'elysium:currency-changed', prop: 'currency' },
        { sel: '#ely-setting-region',   key: 'ely-pref-region',   evt: 'elysium:region-changed',   prop: 'region'   }
    ].forEach(function (c) {
        var el = modal.querySelector(c.sel);
        if (!el) return;
        var saved = localStorage.getItem(c.key);
        if (saved) el.value = saved;
        el.addEventListener('change', function () {
            var detail = {};
            detail[c.prop] = el.value;
            try { localStorage.setItem(c.key, el.value); } catch (e) {}
            window.dispatchEvent(new CustomEvent(c.evt, { detail: detail }));
        });
    });
}
```

---

#### 22.5 · Reglas de entrega

La preferencia del visitante **siempre prevalece** sobre la automática: si
alguien desactiva el cursor o fija el tema a mano, esa decisión persiste entre
visitas y por encima de cualquier regla horaria.

No existe botón de guardar; cada ajuste se aplica en el momento, por lo que
`Escape` cierra la modal sin descartar nada. El panel se recorre de arriba abajo
con teclado, cada control tiene su etiqueta asociada y los interruptores exponen
su estado a los lectores de pantalla.

Toda fila cuyo motor no esté presente se omite: si Magic Mouse no llegó a
montarse por tratarse de un dispositivo táctil, su interruptor no aparece, en
lugar de mostrarse inerte.

---

### F23 · Clean URLs

**Qué es.** Todo lo que hace que un enlace del cliente se vea profesional en
cualquier sitio donde aparezca: la dirección limpia en la barra del navegador,
el logotipo en la pestaña, y la tarjeta con imagen, título y descripción que se
despliega cuando alguien pega ese enlace en WhatsApp, LinkedIn, Slack o un
correo.

Es la **identidad visual del enlace**, distinta de F20 SEO: F20 se ocupa de que
Google entienda y posicione la página; F23 se ocupa de cómo luce el enlace ante
una persona. Por eso F23 es la **fuente única** de las etiquetas `og:` y
`twitter:`, del juego de favicons y de la configuración de rutas limpias; el
bloque `<head>` de F20 no las duplica.

Se entrega en **todos los planes con desarrollo web** (Presencia o superior).
Nota histórica: en el retirado Custom CRM aplicaban solo las capas de rutas
limpias y favicon, ya que sus rutas
son privadas y autenticadas: una tarjeta de previsualización carece de sentido.

---

#### 23.1 · Enlaces estéticos (rutas limpias)

Ninguna URL pública termina en `.html` ni expone la extensión del archivo. Se
entrega `dominio.com/servicios`, nunca `dominio.com/servicios.html`.

**Configuración por proveedor.** Se activa en el servidor, no con JavaScript.

```jsonc
// Firebase Hosting — firebase.json
{
  "hosting": {
    "cleanUrls": true,        // sirve /servicios desde servicios.html
    "trailingSlash": false    // /servicios, nunca /servicios/
  }
}
```

```text
# Cloudflare Pages · Netlify — archivo _redirects
/servicios.html   /servicios   301
/nosotros.html    /nosotros    301
```

```apache
# Apache — .htaccess
RewriteEngine On
# Redirección permanente de la URL antigua con extensión
RewriteCond %{THE_REQUEST} \s/+(.+?)\.html[\s?] [NC]
RewriteRule ^ /%1 [R=301,L]
# Servir el archivo real sin exponer la extensión
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.+)$ $1.html [L]
```

**Reglas de coherencia.** Activar la opción del servidor es solo la mitad del
trabajo; una ruta limpia mal migrada duplica contenido y reparte la autoridad
entre dos direcciones. Al activarla se revisa, en este orden:

1. **Redirección 301** de cada URL antigua con `.html` hacia la limpia. Nunca
   302: la permanente es la que transfiere la autoridad acumulada.
2. **Enlaces internos** del sitio, sin `.html` en ningún `href`.
3. **Canónica y `hreflang`** (F20), apuntando siempre a la forma limpia.
4. **`sitemap.xml`, `llms.txt` y `llms-full.txt`** (F19), con las URL limpias.
5. **Barra final**: se elige una forma y se mantiene; el servidor redirige la
   otra. El estándar fija **sin barra final**.
6. **Minúsculas y guiones**: `/nuestros-servicios`, jamás `/Nuestros_Servicios`.
   La URL describe el contenido en el idioma de la página.

> **Migración de un sitio existente.** Mientras convivan ambas formas, Google ve
> contenido duplicado. La secuencia segura es: publicar las redirecciones 301,
> actualizar canónicas y enlaces internos, regenerar el sitemap y solo entonces
> solicitar el reindexado en Search Console.

---

#### 23.2 · Favicon (logotipos de pestaña y de dispositivo)

El juego completo cubre navegador, marcador, pantalla de inicio de iOS y
Android, y el mosaico de Windows. Los archivos viven en la raíz del dominio,
que es donde los navegadores los buscan por convención.

```html
<!-- Juego canónico de favicon — en el <head> de todas las páginas -->

<!-- SVG: escala a cualquier tamaño y admite modo oscuro; lo prefieren los
     navegadores modernos -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml">

<!-- PNG de respaldo para navegadores sin soporte SVG -->
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png">

<!-- ICO en la raíz: lo piden agregadores y navegadores heredados aunque no
     esté declarado -->
<link rel="alternate icon" href="/favicon.ico" sizes="any">

<!-- iOS: pantalla de inicio. Sin transparencia y sin esquinas redondeadas
     (iOS aplica su propia máscara) -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">

<!-- Safari: pestaña anclada, silueta monocroma -->
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#2997ff">

<!-- Android e instalación como app: los iconos van en el manifiesto -->
<link rel="manifest" href="/manifest.json">

<!-- Color de la barra del navegador en móvil -->
<meta name="theme-color" content="#2997ff">
```

**Archivos requeridos.**

| Archivo | Tamaño | Destino |
|---|---|---|
| `favicon.svg` | vectorial | Navegadores modernos |
| `favicon.ico` | 32×32 | Navegadores heredados y agregadores |
| `favicon-16.png` · `favicon-32.png` | 16 y 32 | Pestaña y marcadores |
| `apple-touch-icon.png` | 180×180 | Pantalla de inicio de iOS |
| `safari-pinned-tab.svg` | vectorial | Pestaña anclada de Safari |
| `icon-192.png` · `icon-512.png` | 192 y 512 | Manifiesto (Android, instalación) |
| `icon-512-maskable.png` | 512 | Icono adaptable de Android |

**Iconos del manifiesto.** Cada entrada declara su tamaño real. Un mismo archivo
declarado a la vez como 192 y como 512 es una declaración falsa: el navegador lo
escalará mal y el icono se verá borroso.

```jsonc
{
  "icons": [
    { "src": "/icon-192.png",          "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png",          "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

> **`any` y `maskable` son archivos distintos.** El adaptable (*maskable*) lleva
> el logotipo dentro de una zona segura central del 80 %, porque Android le
> recorta los bordes. Declarar `"purpose": "any maskable"` sobre un único archivo
> obliga a elegir entre un icono con márgenes excesivos en la pestaña o un
> logotipo recortado en la pantalla de inicio. Se entregan dos archivos.

**Diseño.** El favicon no es el logotipo reducido: a 16 píxeles, un logotipo con
texto se vuelve una mancha. Se entrega una marca simplificada (símbolo,
monograma o isotipo), con contraste suficiente sobre fondo claro y oscuro. El
`favicon.svg` puede adaptarse al tema del sistema:

```html
<style>
  /* Dentro del propio favicon.svg */
  path { fill: #0B0B0B; }
  @media (prefers-color-scheme: dark) { path { fill: #F5F5F7; } }
</style>
```

---

#### 23.3 · Link preview / Rich link (tarjeta del enlace compartido)

Las etiquetas que construyen la tarjeta que aparece al pegar el enlace en
mensajería y redes. Se emiten en **todas** las páginas públicas, con valores
propios de cada una; una tarjeta idéntica en todo el sitio desaprovecha el
formato.

```html
<!-- Open Graph — lo consumen WhatsApp, LinkedIn, Facebook, Slack, Telegram,
     Discord e iMessage -->
<meta property="og:type"             content="website">
<meta property="og:url"              content="https://dominio.com/servicios">
<meta property="og:title"            content="Servicio principal · Marca">
<meta property="og:description"      content="Frase de una línea pensada para quien recibe el enlace, no para Google.">
<meta property="og:image"            content="https://dominio.com/images/og-servicios.jpg">
<meta property="og:image:width"      content="1200">
<meta property="og:image:height"     content="630">
<meta property="og:image:alt"        content="Descripción de la imagen para lectores de pantalla">
<meta property="og:site_name"        content="Marca">
<meta property="og:locale"           content="es_CR">
<meta property="og:locale:alternate" content="en_GB">

<!-- Twitter / X — usa las og: como respaldo, pero la tarjeta grande exige
     declarar el tipo explícitamente -->
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:title"       content="Servicio principal · Marca">
<meta name="twitter:description" content="Frase de una línea pensada para quien recibe el enlace, no para Google.">
<meta name="twitter:image"       content="https://dominio.com/images/og-servicios.jpg">
```

**Especificación de la imagen.**

| Requisito | Valor |
|---|---|
| Dimensiones | 1200 × 630 px (proporción 1,91:1) |
| Peso | Menos de 1 MB; muchos servicios descartan lo que exceda 5 MB |
| Formato | JPG o PNG. **Nunca WebP ni SVG**: varios previsualizadores no los renderizan |
| URL | Absoluta y con `https://`; una ruta relativa no se resuelve |
| Contenido | Texto grande y centrado; los bordes se recortan según la plataforma |
| Acceso | Nunca tras autenticación ni bloqueada en `robots.txt` |

**Reglas operativas.** Las dimensiones se declaran siempre con
`og:image:width` y `og:image:height`: sin ellas, algunos clientes muestran un
hueco en la primera carga, mientras descargan la imagen para medirla. Y como las
plataformas cachean la tarjeta de forma agresiva, tras cambiar la imagen hay que
forzar el refresco en el depurador de cada red, o publicar la imagen con un
nombre nuevo.

---

#### 23.4 · Los tres textos: descripción, previsualización y fragmento

Se confunden a menudo porque los tres describen la página, pero los consume
gente distinta en momentos distintos.

| Concepto | Etiqueta | Quién lo muestra | Longitud | Nota |
|---|---|---|---|---|
| **Meta descripción** | `<meta name="description">` (F20) | Resultados de búsqueda | 140–160 car. | Google puede reescribirla si juzga que otro fragmento responde mejor |
| **Preview description** | `og:description` · `twitter:description` (F23) | Tarjeta de WhatsApp, LinkedIn, Slack | 60–120 car. | Se muestra **literal**: es la única que se controla por completo |
| **Meta snippet** | Directivas `max-snippet` · `data-nosnippet` | Cuánto texto puede extraer Google | — | Gobierna el fragmento, no lo redacta |

Como la previsualización se muestra literal y con menos espacio, se redacta
aparte y más corta: la meta descripción persuade a quien busca en Google, la
previsualización a quien ya recibió el enlace de un conocido.

**Control del fragmento.** La directiva vive en el bloque `<head>` de F20 y es
obligatoria en su forma permisiva:

```html
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
```

`max-snippet:-1` autoriza a Google a mostrar el fragmento que considere
oportuno, sin límite de caracteres. Es requisito para las respuestas con IA:
sin fragmento, la página deja de ser elegible. Para excluir del fragmento un
fragmento concreto de texto (un precio volátil, una nota interna), se marca en
el HTML sin ocultarlo a los usuarios:

```html
<p>Consulta desde 45 € <span data-nosnippet>(tarifa sujeta a revisión trimestral)</span></p>
```

---

#### 23.5 · Verificación antes de entregar

1. Ninguna URL pública responde con `.html`; las antiguas devuelven **301** a la
   limpia.
2. Canónicas, `hreflang`, enlaces internos, `sitemap.xml` y `llms.txt` usan la
   forma limpia y sin barra final.
3. El favicon se ve nítido en pestaña, en marcador y en pantalla de inicio, con
   tema claro y oscuro.
4. `apple-touch-icon` sin transparencia; iconos `any` y `maskable` como archivos
   distintos, con sus tamaños reales declarados.
5. La tarjeta se comprueba en los depuradores oficiales de cada plataforma y en
   un envío real por WhatsApp, que es el cliente más restrictivo.
6. Cada página pública tiene su propio `og:title`, `og:description` e imagen; no
   se repite la tarjeta de la portada en todo el sitio.

---

## 4 · Kit `elysium-core/`: componentes y distribución

### 4.1 · Componentes empaquetados

| Archivo | Cubre | Config | API |
|---|---|---|---|
| `elysium-core/elysium-preloader.js` | F01 Loading Page | `window.ELYSIUM_PRELOADER` | `ElysiumPreloader.dismiss()` · evento `elysium:preloader:done` |
| `elysium-core/elysium-system-info.js` | F05 Information System + F06 System Update | `window.ELYSIUM_SYSTEM` + `<meta name="app-version">` | `ElysiumSystem.show()` · `elysiumForceUpdate(isLogout)` |
| `elysium-core/elysium-compliance.js` | F08 Cookies Management | `window.ELYSIUM_CONSENT` | `ElysiumConsent.get/isGranted/onGranted/open/purgeLocalData` |
| `elysium-core/elysium-seasonal.js` | F11 Efectos de Temporada | `window.ELYSIUM_SEASONAL` | 🚧 pendiente de integración (ver contrato en F11) |
| `elysium-core/elysium-mouse.js` | F12 Magic Mouse | `window.ELYSIUM_MOUSE` | `ElysiumMouse.enable()` · `.disable()` |
| `elysium-core/elysium-audio.js` | F21 System Sound | — (assets en `/sounds`) | `ElysiumAudio.play/mute/setVolume/…` |

Los componentes cooperan entre sí pero funcionan de forma independiente: el flag
`sys_action` conecta F06 con el mensaje de F01, y `purgeLocalData()` (F08)
reutiliza el pipeline de F06 si está presente.

### 4.2 · Distribución y gobernanza del núcleo (regla obligatoria)

La carpeta `elysium-core/` **nunca se copia y pega** en los proyectos. Se
integra por uno de estos dos mecanismos, según el stack:

1. **Git Submodule** (proyectos estáticos y Firebase Hosting):
   `git submodule add <repo-central-elysium-core> elysium-core`. La
   actualización se hace con `git submodule update --remote` **solo después de
   revisar el CHANGELOG** del core y verificar el tag semver.
2. **Paquete NPM privado** `@elysium/core` (proyectos con bundler: Vite,
   React): se fija la versión con rango acotado (`~1.0.0`) y se actualiza de
   forma deliberada, nunca con rangos abiertos.

Reglas de gobernanza:

- Queda **estrictamente prohibido** alterar el código de `elysium-core/` dentro
  de un proyecto de cliente. Cualquier mejora o corrección se hace en el
  repositorio central del core, se versiona (semver + tag) y se propaga a los
  proyectos mediante la actualización del submódulo o del paquete.
- El repositorio central del core mantiene `CHANGELOG.md` obligatorio; cada
  versión indica si el cambio es `patch`, `minor` o `major` y qué proyectos
  deben actualizar con prioridad.
- La personalización por cliente se hace **exclusivamente** vía los objetos de
  configuración (`ELYSIUM_*`); si una necesidad no se puede resolver por
  configuración, es una feature request al core, no un parche local.

## 5 · Arquitectura estándar de carpetas

Todo proyecto sigue este esqueleto normativo. Con stacks distintos (estático
puro frente a Vite/React) cambian las extensiones, no la separación lógica.

**Dos principios rigen la arquitectura, por encima del árbol concreto:**

- **Amigable para el equipo.** Cualquier persona del equipo debe poder abrir el
  proyecto y encontrar un elemento por su nombre, sin preguntar. Las carpetas y
  los archivos se nombran por lo que **son** (`features/agenda/`, `ui/boton.js`),
  no por quién los hizo ni cuándo. Nada de `nuevo/`, `viejo/`, `temp/`,
  `pruebas/`, `final/`, `final-2/` ni nombres de persona. Un elemento vive en un
  solo lugar; si se duplica «por si acaso», se elige uno y se borra el otro.
- **Listo para go-live en todo momento.** El código en la rama principal está
  siempre en estado de poder publicarse: sin `console.log` de depuración, sin
  bloques comentados «por si acaso», sin dependencias sin usar, sin rutas de
  prueba, sin datos de ejemplo incrustados. Lo que no está listo para
  producción vive en una rama, no en `main`. Optimizar no es una fase final: es
  la condición por defecto de cada entrega.

```text
proyecto-cliente/
├── index.html
├── favicon.svg · favicon.ico        (F23; juego completo en la raíz)
├── apple-touch-icon.png             (F23; 180x180, sin transparencia)
├── robots.txt                       (F19; con el bloque de crawlers de IA)
├── sitemap.xml                      (F19)
├── llms.txt                         (F19; índice curado para modelos)
├── llms-full.txt                    (F19; representación factual ampliada)
├── googleXXXXXXXX.html              (F19; verificación de Search Console)
├── sounds/                          (F21; samples de las cuatro voces)
├── manifest.json                    (F17; desde Presencia)
├── firebase.json  ·  _headers       (F07 Security Core)
├── elysium-core/                    (submódulo Git; SOLO LECTURA)
├── src/
│   ├── core/                        (lógica de negocio; adaptadores sobre elysium-core)
│   ├── ui/                          (componentes de interfaz reutilizables)
│   ├── features/                    (módulos específicos del cliente: blog, agenda, reservas…)
│   └── styles/                      (tokens.css, typography.css, components/)
├── functions/                       (Cloud Functions; solo planes con F18)
│   ├── index.js
│   └── package.json                 (secretos vía Secret Manager, jamás archivos de credenciales)
├── en/  ·  pt/                      (árboles de idioma; solo planes con F15)
└── sw.js                            (F17)
```

Reglas de ubicación:

- `src/core/` contiene la lógica de negocio pura y los adaptadores que
  configuran `elysium-core`; no contiene UI.
- `src/ui/` contiene componentes visuales reutilizables sin lógica de negocio.
- `src/features/` agrupa cada módulo del cliente en su propia carpeta
  autocontenida (`features/blog/`, `features/agenda/`); un feature no importa
  internals de otro feature, solo de `core/` y `ui/`.
- `functions/` es el único lugar con código de servidor; toda credencial vive
  en Secret Manager o variables de entorno.
- Si dos personas (o dos IAs) implementan el mismo plan, el resultado debe
  tener la misma estructura de carpetas. Cualquier desviación se justifica por
  escrito en el PR.

## 6 · Estándares transversales

1. **Versionado.** La versión vive en **un solo lugar** por proyecto
   (`<meta name="app-version">`). Prohibido duplicarla en JS. El formato es
   `VAÑO.MAYOR.MENOR` según el sistema de versionado Elysium del §7; los
   commits siguen Conventional Commits.
2. **Regla de carga obligatoria.** Todo proyecto incluye F01 en `<head>`.
   Duración mínima 1 000 ms, máxima 8 000 ms.
3. **Footer obligatorio.** F05 (etiqueta de versión), F10 (Elysium Signature) y
   enlace «Configuración de cookies» hacia `ElysiumConsent.open()`.
4. **Compliance-by-Design.** Ningún script de analytics o marketing se carga
   fuera del gating de F08. Las páginas legales (`terms`, `privacy`,
   `cookie-policy`) son entregables desde el plan Presencia; nunca `href="#"`.
5. **Seguridad.** Plantilla base F07. CSP sin `unsafe-inline` en `script-src`
   (hashes, nunca nonces estáticos). Credenciales y claves **jamás** en el
   repositorio: Secret Manager o variables de entorno.
6. **Accesibilidad y rendimiento.** WCAG 2.1 AA, HTML semántico,
   `prefers-reduced-motion` respetado por toda animación (F01, F03, F11, F12) y
   Core Web Vitals (LCP, INP, CLS) como criterio de aceptación.
7. **Movimiento y táctil.** Los efectos de puntero (F12) solo con
   `pointer:fine`; la densidad de partículas (F11) se reduce en móvil.
8. **Descubribilidad.** Todo sitio público nace con los cinco archivos de raíz
   de F19 (`robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt` y la
   verificación de Search Console) y, en cada página, el bloque `<head>` y el
   grafo `@graph` de F20. `max-snippet:-1` es obligatorio: sin fragmento, la
   página queda fuera de las respuestas con IA de Google. Las etiquetas `og:`
   y `twitter:`, el juego de favicon y las rutas limpias son competencia
   exclusiva de F23; no se duplican en el `<head>` de F20. Ninguna web se
   entrega sin propiedad verificada en Search Console y sitemap enviado.
9. **Despliegue manual.** Las subidas a GitHub, Firebase, Cloudflare o cualquier
   otra plataforma son **siempre manuales**, ejecutadas por una persona del
   equipo. Ningún asistente de IA ni proceso automático publica, hace `push`,
   `deploy`, `merge` a la rama principal ni cambia infraestructura por su
   cuenta. La única excepción es que el usuario lo solicite **explícitamente**
   en esa conversación; una autorización dada una vez no se extiende a la
   siguiente. El detalle del flujo de publicación se rige por el §8.
10. **Auditoría de calidad obligatoria (QA).** Antes de cualquier paso a
   producción, el proyecto debe superar una puntuación mínima de **90 en
   Lighthouse en las cuatro categorías** (Performance, Accessibility,
   Best Practices, SEO). La auditoría se automatiza en CI; una puntuación
   inferior **bloquea el despliegue**. Los agentes de IA deben generar la
   configuración de GitHub Actions (o GitLab CI equivalente) en todo proyecto
   nuevo:

```yaml
# .github/workflows/qa-lighthouse.yml — auditoría bloqueante (canónica)
name: QA Lighthouse
on:
  push: { branches: [main] }
  pull_request:
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Servir el sitio
        run: npx http-server . -p 8080 &
      - name: Auditoría Lighthouse
        uses: treosh/lighthouse-ci-action@v11
        with:
          urls: http://localhost:8080
          uploadArtifacts: true
        env:
          LHCI_ASSERT: '{"assertions":{"categories:performance":["error",{"minScore":0.9}],"categories:accessibility":["error",{"minScore":0.9}],"categories:best-practices":["error",{"minScore":0.9}],"categories:seo":["error",{"minScore":0.9}]}}'
```

11. **Lista de verificación de lanzamiento (F19 Discovery Core y F20 SEO).** Ninguna web pasa a
   producción sin recorrer estos puntos; se archiva con la fecha y la
   persona que los verificó:

   1. Cada página tiene `<title>` y `meta description` únicos y dentro de rango.
   2. Canónica absoluta y autorreferencial en todas las páginas, en su
      forma limpia y sin `.html` (F23).
   3. `max-snippet:-1` presente; ningún `noindex` accidental en producción.
   4. `sitemap.xml` completo, con `lastmod` real, enviado en Search Console.
   5. `robots.txt` con el bloque de crawlers de IA **repitiendo sus
      `Disallow`**, y el sitemap declarado.
   6. Grafo `@graph` validado sin errores en la Prueba de Resultados
      Enriquecidos de Google.
   7. hreflang recíproco y con `x-default` (solo si aplica F15).
   8. Imágenes con `alt`, dimensiones explícitas y `loading="lazy"` salvo la
      imagen LCP.
   9. `llms.txt` y `llms-full.txt` publicados, servidos como `text/plain`
      y con la sección de orientación para asistentes.
   10. Juego de favicon completo y tarjeta de enlace verificada en un envío
       real por WhatsApp (F23).
   11. Propiedad verificada en Search Console y, si hay sede física, Perfil
       de Empresa de Google activo.

---

## 7 · Sistema de versionado Elysium

La versión que aparece en el pie de cada sitio (F05 Information System) no sigue
el versionado semántico habitual del software. Sigue un esquema propio que
cuenta **la vida del sitio como servicio**, y que el visitante puede leer sin
conocimientos técnicos.

### 7.1 · Lectura del número

```text
V 3 . 6 . 2
  │   │   └── MENOR:  correcciones y ajustes dentro de esa actualización
  │   └────── MAYOR:  grandes actualizaciones hechas durante ese año
  └────────── AÑO:    años del sitio desde su lanzamiento con Elysium
```

**`V3.6.2` se lee así:** tercer año del sitio desde que se lanzó con Elysium;
sexta gran actualización de ese año; segunda corrección dentro de esa sexta
actualización.

| Posición | Significado | Cuándo cambia | Se reinicia |
|---|---|---|---|
| **Año** | Antigüedad del sitio en años cumplidos | En cada aniversario del lanzamiento | Nunca; solo crece |
| **Mayor** | Grandes actualizaciones de ese año | Al publicar una actualización de alcance | En cada aniversario |
| **Menor** | Correcciones y ajustes menores | Al publicar un arreglo o retoque | En cada actualización mayor |

### 7.2 · Qué cuenta como mayor y qué como menor

| Actualización **mayor** | Actualización **menor** |
|---|---|
| Nueva página o nueva sección | Corrección de un error |
| Alta de una función del catálogo | Ajuste de textos ya publicados |
| Rediseño de una parte del sitio | Sustitución de imágenes |
| Cambio de arquitectura o de rutas | Retoques de espaciado o color |
| Migración de infraestructura | Parches de seguridad y de dependencias |
| Alta de un idioma o de una divisa | Actualización de precios o de horarios |

Ante la duda, la pregunta es si el cliente lo notaría y lo contaría como algo
nuevo. Si la respuesta es sí, es una mayor.

### 7.3 · Progresión de ejemplo

```text
V1.0.0 Beta   Prototipo y desarrollo, antes del lanzamiento
V1.0.0        Día del lanzamiento; se retira la etiqueta Beta
V1.0.1        Corrección de un enlace roto detectado la primera semana
V1.0.2        Ajuste de un texto a petición del cliente
V1.1.0        Primera gran actualización: se añade la página de servicios
V1.1.1        Corrección de una imagen dentro de esa nueva página
V1.2.0        Segunda gran actualización del primer año: blog
V2.0.0        Primer aniversario; el contador de año avanza y los otros dos vuelven a cero
V2.1.0        Primera gran actualización del segundo año
V3.6.2        Tercer año, sexta gran actualización, segunda corrección de esa actualización
```

**El año avanza aunque no haya cambios.** En el aniversario, un sitio en
`V1.4.2` pasa a `V2.0.0` aunque ese mes no se haya tocado nada. Es deliberado:
la primera cifra comunica que el sitio lleva años vivo y acompañado, no
abandonado, que es justamente lo que sostiene el modelo de suscripción.

### 7.4 · La etapa Beta

Antes del lanzamiento, la versión se muestra siempre como **`V1.0.0 Beta`**. La
etiqueta se retira el día de la publicación oficial y el sitio queda en
`V1.0.0`. El detalle del prototipado se rige por
[`ELYSIUM-PROTOTYPING.md`](ELYSIUM-PROTOTYPING.md).

### 7.5 · Dónde se declara

La versión vive en un solo lugar del proyecto, según §6.1, y la etapa se pasa
por configuración:

```html
<meta name="app-version" content="V3.6.2">
<script>
  window.ELYSIUM_SYSTEM = {
    stage: '',        // 'Beta' antes del lanzamiento; vacío en producción
    // …resto de la configuración
  };
</script>
```

> **Este esquema no es versionado semántico.** No confunda las dos cosas: los
> **proyectos de cliente** usan `VAÑO.MAYOR.MENOR`, mientras que los artefactos
> internos de Elysium (el kit `elysium-core/` y los propios documentos de
> estándares) siguen usando semver, porque no tienen fecha de lanzamiento con un
> cliente ni ciclo anual. Un agente de IA nunca debe aplicar semver a la
> etiqueta del pie de un sitio de cliente.

---

## 8 · Protocolo de publicación y control de versiones

### 8.1 · Toda subida es manual

Publicar o subir código a cualquier plataforma (GitHub, Firebase, Cloudflare,
Netlify, servidores propios) es un acto **manual** de una persona del equipo.
Ni los asistentes de IA ni los procesos automáticos ejecutan `git push`,
`deploy`, `merge` a la rama principal, ni cambian configuración de
infraestructura, salvo que el usuario lo pida de forma **explícita** en la
conversación. La aprobación es por acción y por sesión: autorizar una subida hoy
no autoriza la siguiente.

El asistente sí puede **preparar** el trabajo (dejar los cambios listos,
redactar el mensaje de commit, resumir qué se subiría), pero se detiene antes de
ejecutar la subida y cede el control a la persona.

### 8.2 · Antes de cada subida a Git: subir la versión

Toda subida a Git empieza por actualizar la versión del pie (F05). El orden es
siempre este:

1. **Preguntar al usuario la versión nueva.** El asistente propone la que
   corresponde según el §7.2 (mayor o menor), explicando por qué, pero **la
   decide el usuario**. No se inventa ni se salta este paso.
2. **Actualizar `<meta name="app-version">`** con la versión confirmada, en su
   único lugar del proyecto.
3. **Recién entonces** preparar el commit.

### 8.3 · Formato del mensaje de commit

El mensaje tiene tres capas, de lo general a lo técnico:

- **Título:** la versión, dos puntos, y un resumen breve en lenguaje llano de
  los cambios, separados por comas. Es lo que un no técnico entiende de un
  vistazo.
- **Descripción:** el detalle técnico completo de todo lo aplicado, archivo por
  archivo o cambio por cambio, con el porqué de cada decisión relevante.

```text
Título:
V1.0.4: corrección de colores, conexión a base de datos y sistema de registro de usuario

Descripción:
- Colores: se corrigió el contraste de los botones primarios (--color-accent
  de #1E7FE0 a #2997ff) para cumplir WCAG 2.1 AA; ajustados los tokens en
  src/styles/tokens.css.
- Base de datos: se implementó la conexión a Firestore en src/core/db.js,
  con las reglas de seguridad por rol de F18; credenciales vía Secret Manager,
  nunca en el repositorio.
- Registro de usuario: alta del flujo en src/features/auth/, con validación de
  esquema en el `create` de Firestore y anti-escalada de privilegios.
```

Reglas del mensaje:

- El **título** siempre empieza por la versión (`V1.0.4:`), coincide con la que
  quedó en `<meta name="app-version">`, y su resumen se lee sin tecnicismos.
- La **descripción** es exhaustiva: quien la lea dentro de un año debe entender
  qué se cambió y por qué, sin abrir el código.
- Un commit, una versión: no se acumulan varios cambios de versión en una sola
  subida.

### 8.4 · Secuencia completa

```text
1. El equipo revisa y aprueba los cambios.
2. El asistente propone la versión nueva (mayor/menor, con su razón).
3. El usuario confirma la versión.
4. Se actualiza <meta name="app-version">.
5. El asistente redacta el mensaje de commit (título + descripción).
6. LA PERSONA ejecuta el commit y la subida.  ← paso manual, nunca la IA
```

---

# PARTE III · ESPECIFICACIÓN PARA AGENTES DE IA

Esta sección es **vinculante** para cualquier asistente de IA que genere o
modifique código en proyectos Elysium. Las Partes I y II son su contexto; la
Parte IV define cómo el empleado inicia la sesión con usted.

## 9 · Inyección de contexto (orden obligatorio)

Antes de generar código, el agente debe recibir, en este orden:

1. Este documento completo (`ELYSIUM-STANDARDS.md`).
2. Las APIs del kit (`elysium-core/README.md` y encabezados de cada archivo).
3. El plan contratado por el cliente y, con él, el subconjunto exacto de
   funciones de la matriz del §2 que aplican al proyecto.
4. La configuración del proyecto: `<meta name="app-version">`, paleta de marca,
   idiomas, zona horaria y `healthEndpoint`.
5. Si hay backend: esquema de datos y reglas de seguridad vigentes.

## 10 · Reglas de generación (MUST / NEVER)

**MUST**

- Implementar cada función usando su implementación canónica del catálogo o el
  componente de `elysium-core/` correspondiente; cualquier desviación se
  documenta en el propio PR con su justificación.
- Entregar archivos **completos y funcionales**, con JSDoc en toda utilidad
  compartida y tipado estricto (TypeScript donde el stack lo permita).
- Respetar los namespaces: `Elysium*` para APIs globales, prefijo `ely-` para
  clases CSS e IDs inyectados, `ELYSIUM_*` para objetos de configuración.
- Respetar la arquitectura de carpetas del §5; cada archivo nuevo se crea en la
  capa que le corresponde (`core`, `ui`, `features`, `functions`).
- Leer la versión desde `<meta name="app-version">`; nunca introducir
  constantes de versión en JS.
- Aplicar el esquema `VAÑO.MAYOR.MENOR` del §7 al versionar un proyecto de
  cliente, y razonar en voz alta qué cifra avanza y por qué antes de tocarla.
- Envolver todo script de terceros en el gating de F08
  (`type="text/plain" data-consent="…"`).
- Verificar contra la matriz del §2: si una función no está en el plan del
  cliente, **no se incluye** en el entregable.
- Generar la configuración de CI del §6.10 (Lighthouse bloqueante) en todo
  proyecto nuevo.
- Antes de preparar cualquier subida a Git, **preguntar al usuario la versión
  nueva** (§8.2), actualizar `<meta name="app-version">` y solo entonces
  redactar el commit con el formato del §8.3 (título con versión y resumen
  llano; descripción con el detalle técnico completo).
- Mantener el código en estado de go-live (§5): sin `console.log` de
  depuración, código muerto, dependencias sin usar ni datos de ejemplo.
- Emitir en cada página pública el bloque `<head>` completo y un único grafo
  `@graph` (F20), con valores reales del proyecto, jamás de ejemplo.
- Mantener `sitemap.xml`, `robots.txt`, `llms.txt` y `llms-full.txt` (F19)
  sincronizados con las páginas que realmente existen tras cada cambio de
  alcance.
- Repetir íntegramente los `Disallow` dentro de cada grupo específico de
  `robots.txt`: un grupo con nombre sustituye al de `User-agent: *` y no
  hereda ninguna de sus restricciones.

**NEVER**

- Omitir secciones de código con comentarios del tipo
  `// … resto del código anterior`. Prohibido sin excepciones.
- **Publicar o subir por su cuenta.** Ningún `git push`, `deploy`, `merge` a la
  rama principal ni cambio de infraestructura (GitHub, Firebase, Cloudflare…)
  sin que el usuario lo pida de forma explícita en esa conversación (§8.1). El
  asistente deja todo listo y cede el paso final a la persona.
- Nombrar carpetas o archivos por su estado o autor (`nuevo/`, `viejo/`,
  `temp/`, `final-2/`, nombres de persona) en lugar de por lo que son (§5).
- Modificar archivos dentro de `elysium-core/`: es un submódulo de solo
  lectura; los cambios al core se proponen en su repositorio central (§4.2).
- Implementar una versión provisional de F11: su bloque está reservado para
  el código final de producción (contrato en F11).
- Duplicar en el panel de F22 la lógica de un motor: el panel solo lee y
  escribe las APIs globales (`ElysiumAudio`, `ElysiumMouse`), nunca reimplementa
  su comportamiento ni su persistencia.
- Introducir dependencias externas (CDN, npm) en las funciones F01 a F17 y
  F19 a F23 sin
  aprobación explícita: son zero-dependency por contrato.
- Usar `unsafe-inline`, nonces estáticos o relajar la CSP del Security Core.
- Escribir credenciales, claves o tokens en el código o en el repositorio.
- Añadir animaciones que ignoren `prefers-reduced-motion`, o efectos de
  puntero activos en dispositivos táctiles.
- Emitir `<meta name="keywords">`, datos estructurados que describan contenido
  inexistente en la página, o reseñas y valoraciones no verificables: es
  incumplimiento de las políticas de spam de Google y puede acarrear sanción
  manual del dominio del cliente.
- Bloquear crawlers de IA sin autorización escrita del cliente, ni introducir
  `noindex`, `nosnippet` o `Disallow` en páginas públicas por iniciativa propia.
- Usar `llms.txt` como mecanismo de control de acceso: no lo es y ningún
  proveedor se compromete a respetarlo. Las restricciones van en `robots.txt`.
- Aplicar versionado semántico a la etiqueta del pie de un sitio de cliente:
  esa etiqueta sigue el esquema propio del §7. El semver queda reservado a
  los artefactos internos de Elysium.
- Prometer posiciones concretas en Google. F19 y F20 garantizan la base técnica
  y la elegibilidad, nunca un puesto en el ranking.

## 11 · Formato de salida exigido al agente

- Un bloque de código independiente y completo por archivo generado o
  modificado, precedido de su ruta.
- Mapeo explícito al catálogo: cada componente entregado se etiqueta con su
  ID (`F01` a `F23`) en el encabezado del archivo.
- Commits en formato Conventional Commits
  (`feat(F11): seasonal effects engine`, `fix(F05): …`).
- Tras cualquier cambio de alcance, regenerar la fila correspondiente de la
  matriz del §2 del proyecto y actualizar `<meta name="app-version">`,
  indicando si el cambio es mayor o menor conforme al §7.2.

---

# PARTE IV · PROTOCOLO DE ARRANQUE PARA EMPLEADOS

Cuando usted abra una sesión con un asistente de IA (Claude, Gemini, Cursor u
otro) para trabajar en un proyecto Elysium, siga estos tres pasos **siempre**:

1. Adjunte `ELYSIUM-STANDARDS.md` completo y, si el proyecto ya existe, el
   `README.md` de `elysium-core/`.
2. Copie y pegue la plantilla siguiente, rellenando los campos entre corchetes.
3. **No permita que la IA escriba código** hasta que haya confirmado la matriz
   de funciones del plan y las reglas de la Parte III.

**Plantilla de arranque (copiar y pegar):**

```text
Actúe como un desarrollador sénior de Elysium λ Development & Research.
Adjunto el documento ELYSIUM-STANDARDS.md; es vinculante en su totalidad,
en especial las Partes III y IV.

Vamos a trabajar en un proyecto bajo el plan: [INSERTAR PLAN].

Configuración del proyecto:
  · Marca / cliente:        [NOMBRE]
  · Versión actual:         [vX.Y.Z-build.N]
  · Color de acento:        [#HEX]
  · Idiomas contratados:    [es / en / pt]
  · Zona horaria:           [America/Costa_Rica]
  · healthEndpoint:         [/manifest.json]
  · Stack:                  [estático / Vite+React / Firebase]

No escriba código todavía. Confirme primero:
1. Que procesó la matriz de funciones del §2 para el plan indicado y liste
   las funciones (F01 a F23) que aplican a este proyecto.
2. Que aplicará las reglas MUST/NEVER de la Parte III, incluida la
   prohibición de modificar elysium-core/ y de implementar F11/F12
   provisionales.
3. Qué información adicional necesita para comenzar el desarrollo.
```

---

*Elysium λ Development & Research · Estándar interno v2.9.0 · Los componentes
de `elysium-core/` son la fuente única de las funciones nucleares; este
documento es la fuente única del alcance por plan.*
