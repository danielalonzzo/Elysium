# Elysium λ — Software Architecture Standards & Tiered Implementation Guide
### v2.1.1 · Julio 2026

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

---

# PARTE I · BIENVENIDA AL ECOSISTEMA ELYSIUM

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

| **Funciones** | Hosting Maintenance | Basic Maintenance | Preferential Maintenance | ⭐ Advanced Maintenance<br>*Most Popular* | Custom CRM |
|---|:---:|:---:|:---:|:---:|:---:|
| | **99 €** / año | **70 €** / mes<br><sub>Opcional: 840 € / año</sub> | **99 €** / mes<br><sub>Opcional: 1 188 € / año</sub> | **120 €** / mes<br><sub>Opcional: 1 440 € / año</sub> | **50 €** / mes<br><sub>Opcional: 600 € / año</sub> |
| Domain and Server Management | ✅ | ✅ | ✅ | ✅ | — |
| Loading Page | — | ✅ | ✅ | ✅ | ✅ |
| Header Mobile-First | — | ✅ | ✅ | ✅ | — |
| Scroll Reveal | — | ✅ | ✅ | ✅ | — |
| Anchor Glide | — | ✅ | ✅ | ✅ | — |
| Information System | — | ✅ | ✅ | ✅ | ✅ |
| System Update | — | ✅ | ✅ | ✅ | ✅ |
| Security Core | — | ✅ | ✅ | ✅ | ✅ |
| Cookies Management | — | ✅ | ✅ | ✅ | ✅ |
| Magic Bottom | — | ✅ | ✅ | ✅ | — |
| Elysium Signature | — | ✅ | ✅ | ✅ | ✅ |
| Efectos de Temporada * | — | ✅ | ✅ | ✅ | ✅ |
| Magic Mouse * | — | ✅ | ✅ | ✅ | ✅ |
| Dynamic Theme | — | — | ✅ | ✅ | — |
| Theme Switcher | — | — | ✅ | ✅ | — |
| Multi-language | — | — | ✅ | ✅ | — |
| Multi-Currency | — | — | ✅ | ✅ | — |
| Web App Downloader | — | — | ✅ | ✅ | — |
| Personalized CRM <sub>(incluye roles, permisos y entorno confidencial)</sub> | — | — | — | ✅ | ✅ |

<sub>* El código de producción de Efectos de Temporada y Magic Mouse está en
proceso de escritura; las secciones F11 y F12 quedan preparadas para integrar
el código final (ver Parte II).</sub>

**Lógica de la escalera.** Hosting Maintenance cubre exclusivamente la
operación de dominio y servidor. Basic añade el desarrollo web corporativo
completo con su paquete de experiencia y cumplimiento legal, junto con los
detalles de temporada y cursor. Preferential suma las funciones de cuidado
continuo: tema, idiomas, divisas y aplicación instalable. Advanced lo incluye
todo, más el CRM privado. Custom CRM es la plataforma CRM sola, sin web pública.

## 3 · Cada función en una frase

| Función | Qué recibe el cliente |
|---|---|
| **Loading Page** | Una pantalla de bienvenida con su logo mientras el sitio termina de cargar; nunca una página a medio pintar. |
| **Header Mobile-First** | Menú superior que se adapta al móvil (hamburguesa) y reacciona con elegancia al hacer scroll. |
| **Scroll Reveal** | Las secciones aparecen con una animación suave a medida que se baja por la página. |
| **Anchor Glide** | Al pulsar un enlace interno, la página se desliza con suavidad hasta la sección exacta, sin que el menú la tape. |
| **Information System** | Un panel discreto en el pie de página con la versión del sitio, licencias, marco legal y estado del sistema. |
| **System Update** | Un botón que actualiza el sitio a la última versión al instante, limpiando cachés y datos antiguos. |
| **Security Core** | Blindaje del sitio con cabeceras de seguridad de nivel corporativo: HSTS, CSP y protección anti clickjacking, entre otras. |
| **Cookies Management** | Aviso y gestor de cookies conforme al RGPD (UE) y a la Ley 8968 (Costa Rica), con preferencias granulares. |
| **Magic Bottom** | Botón flotante de contacto rápido: WhatsApp, redes y acciones directas siempre a un toque. |
| **Elysium Signature** | El sello «Developed by Elysium λ» en el pie de cada entregable. |
| **Efectos de Temporada** | Decoración automática por fechas: nieve en Navidad, fuegos en Año Nuevo y lo que la marca pida. |
| **Magic Mouse** | Un cursor personalizado con la identidad del cliente, con reacciones al pasar sobre botones y enlaces. |
| **Dynamic Theme** | El sitio alterna solo entre modo claro y oscuro según la hora del día. |
| **Theme Switcher** | El control para que cada visitante elija el modo que prefiera; el sitio lo recuerda. |
| **Multi-language** | El sitio en varios idiomas, con detección automática del idioma del visitante. |
| **Multi-Currency** | Los precios se muestran en la divisa del visitante, con tipos de cambio al día. |
| **Web App Downloader** | La web se puede instalar como app en el teléfono y funciona incluso sin conexión. |
| **Personalized CRM** | Plataforma privada de gestión a medida: usuarios, roles, permisos y entorno confidencial. |

---

# PARTE II · CATÁLOGO TÉCNICO DE FUNCIONES

Cada función tiene un identificador estable (`F01` a `F18`), una especificación y
su implementación canónica. Las tres funciones nucleares (F01, F05 con F06, y
F08) viven como componentes plug-and-play en [`elysium-core/`](elysium-core/);
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

Etiqueta de versión (`v1.4.2-build.89`) inyectada en el footer que despliega el
modal de información del sistema: versión y build, licencia de producto, marco
legal y de seguridad, estado de la infraestructura conectada (red y latencia
contra un `healthEndpoint`), información corporativa y atribuciones de software.
La versión se resuelve desde `<meta name="app-version">`; es **un único punto de
verdad por proyecto**, nunca constantes duplicadas en JS.

**Código:** componente nuclear en [`elysium-core/elysium-system-info.js`](elysium-core/elysium-system-info.js).

```html
<meta name="app-version" content="v1.4.2-build.89">
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
Se entrega en **todos los planes con desarrollo web** (Basic o superior y
Custom CRM).

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

> 🚧 **Estado: código de producción en escritura.** Esta sección define el
> contrato de integración; el bloque de código se sustituirá por la versión
> final cuando esté lista. No implemente versiones provisionales por su cuenta.

Cursor personalizado con la identidad del cliente: diseño único del puntero con
reacciones al pasar sobre enlaces y botones. Se entrega en **todos los planes
con desarrollo web** (Basic o superior y Custom CRM).

**Contrato de integración (vinculante para el código final):**

| Aspecto | Especificación |
|---|---|
| Archivo destino | `elysium-core/elysium-mouse.js` |
| Configuración | `window.ELYSIUM_MOUSE = { accent, ringSize, dotSize }` |
| API pública | `ElysiumMouse.enable()` · `ElysiumMouse.disable()` |
| Restricciones | Solo con `pointer:fine` (nunca en táctiles); desactivado con `prefers-reduced-motion`; `z-index` 999999; sin dependencias externas; sin bloquear la interacción nativa. |

```js
/* ══════════════════════════════════════════════════════════════════
 * [RESERVADO · F12 MAGIC MOUSE]
 * Integrar aquí el código final de producción cuando esté aprobado.
 * Debe cumplir el contrato de integración descrito arriba.
 * ══════════════════════════════════════════════════════════════════ */
```

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

## 4 · Kit `elysium-core/`: componentes y distribución

### 4.1 · Componentes empaquetados

| Archivo | Cubre | Config | API |
|---|---|---|---|
| `elysium-core/elysium-preloader.js` | F01 Loading Page | `window.ELYSIUM_PRELOADER` | `ElysiumPreloader.dismiss()` · evento `elysium:preloader:done` |
| `elysium-core/elysium-system-info.js` | F05 Information System + F06 System Update | `window.ELYSIUM_SYSTEM` + `<meta name="app-version">` | `ElysiumSystem.show()` · `elysiumForceUpdate(isLogout)` |
| `elysium-core/elysium-compliance.js` | F08 Cookies Management | `window.ELYSIUM_CONSENT` | `ElysiumConsent.get/isGranted/onGranted/open/purgeLocalData` |
| `elysium-core/elysium-seasonal.js` | F11 Efectos de Temporada | `window.ELYSIUM_SEASONAL` | 🚧 pendiente de integración (ver contrato en F11) |
| `elysium-core/elysium-mouse.js` | F12 Magic Mouse | `window.ELYSIUM_MOUSE` | 🚧 pendiente de integración (ver contrato en F12) |

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

```text
proyecto-cliente/
├── index.html
├── manifest.json                    (F17; solo Preferential o superior)
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
   (`<meta name="app-version">`). Prohibido duplicarla en JS. Formato
   `vMAJOR.MINOR.PATCH[-build.N]` y Conventional Commits.
2. **Regla de carga obligatoria.** Todo proyecto incluye F01 en `<head>`.
   Duración mínima 1 000 ms, máxima 8 000 ms.
3. **Footer obligatorio.** F05 (etiqueta de versión), F10 (Elysium Signature) y
   enlace «Configuración de cookies» hacia `ElysiumConsent.open()`.
4. **Compliance-by-Design.** Ningún script de analytics o marketing se carga
   fuera del gating de F08. Las páginas legales (`terms`, `privacy`,
   `cookie-policy`) son entregables desde el plan Basic; nunca `href="#"`.
5. **Seguridad.** Plantilla base F07. CSP sin `unsafe-inline` en `script-src`
   (hashes, nunca nonces estáticos). Credenciales y claves **jamás** en el
   repositorio: Secret Manager o variables de entorno.
6. **Accesibilidad y rendimiento.** WCAG 2.1 AA, HTML semántico,
   `prefers-reduced-motion` respetado por toda animación (F01, F03, F11, F12) y
   Core Web Vitals (LCP, INP, CLS) como criterio de aceptación.
7. **Movimiento y táctil.** Los efectos de puntero (F12) solo con
   `pointer:fine`; la densidad de partículas (F11) se reduce en móvil.
8. **Auditoría de calidad obligatoria (QA).** Antes de cualquier paso a
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

---

# PARTE III · ESPECIFICACIÓN PARA AGENTES DE IA

Esta sección es **vinculante** para cualquier asistente de IA que genere o
modifique código en proyectos Elysium. Las Partes I y II son su contexto; la
Parte IV define cómo el empleado inicia la sesión con usted.

## 7 · Inyección de contexto (orden obligatorio)

Antes de generar código, el agente debe recibir, en este orden:

1. Este documento completo (`ELYSIUM-STANDARDS.md`).
2. Las APIs del kit (`elysium-core/README.md` y encabezados de cada archivo).
3. El plan contratado por el cliente y, con él, el subconjunto exacto de
   funciones de la matriz del §2 que aplican al proyecto.
4. La configuración del proyecto: `<meta name="app-version">`, paleta de marca,
   idiomas, zona horaria y `healthEndpoint`.
5. Si hay backend: esquema de datos y reglas de seguridad vigentes.

## 8 · Reglas de generación (MUST / NEVER)

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
- Envolver todo script de terceros en el gating de F08
  (`type="text/plain" data-consent="…"`).
- Verificar contra la matriz del §2: si una función no está en el plan del
  cliente, **no se incluye** en el entregable.
- Generar la configuración de CI del §6.8 (Lighthouse bloqueante) en todo
  proyecto nuevo.

**NEVER**

- Omitir secciones de código con comentarios del tipo
  `// … resto del código anterior`. Prohibido sin excepciones.
- Modificar archivos dentro de `elysium-core/`: es un submódulo de solo
  lectura; los cambios al core se proponen en su repositorio central (§4.2).
- Implementar versiones provisionales de F11 o F12: sus bloques están
  reservados para el código final de producción (contratos en F11 y F12).
- Introducir dependencias externas (CDN, npm) en las funciones F01 a F17 sin
  aprobación explícita: son zero-dependency por contrato.
- Usar `unsafe-inline`, nonces estáticos o relajar la CSP del Security Core.
- Escribir credenciales, claves o tokens en el código o en el repositorio.
- Añadir animaciones que ignoren `prefers-reduced-motion`, o efectos de
  puntero activos en dispositivos táctiles.

## 9 · Formato de salida exigido al agente

- Un bloque de código independiente y completo por archivo generado o
  modificado, precedido de su ruta.
- Mapeo explícito al catálogo: cada componente entregado se etiqueta con su
  ID (`F01` a `F18`) en el encabezado del archivo.
- Commits en formato Conventional Commits
  (`feat(F11): seasonal effects engine`, `fix(F05): …`).
- Tras cualquier cambio de alcance, regenerar la fila correspondiente de la
  matriz del §2 del proyecto y actualizar `<meta name="app-version">`.

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
   las funciones (F01 a F18) que aplican a este proyecto.
2. Que aplicará las reglas MUST/NEVER de la Parte III, incluida la
   prohibición de modificar elysium-core/ y de implementar F11/F12
   provisionales.
3. Qué información adicional necesita para comenzar el desarrollo.
```

---

*Elysium λ Development & Research · Estándar interno v2.1.1 · Los componentes
de `elysium-core/` son la fuente única de las funciones nucleares; este
documento es la fuente única del alcance por plan.*
