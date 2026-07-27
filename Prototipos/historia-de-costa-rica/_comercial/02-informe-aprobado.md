# Informe aprobado · Historia de Costa Rica

> **Fase 2 · APROBADO por el equipo — Compuerta 1 SUPERADA (2026-07-25).**
> Versión revisada y corregida del borrador `01-informe-preliminar.md`, que se
> conserva sin modificar como registro de lo que propuso el LLM (§2.4). A partir de
> este documento —y solo de él— se genera el prototipo (§5 MUST).
>
> **Tipo de proyecto:** NUEVO (Ruta A). **Idioma:** español. **Plataforma:** móvil
> primero, 375 px.

---

## 1 · Retrato de la empresa

Historia de Costa Rica (@historiadecostarica) es una iniciativa de **divulgación
cultural e histórica** nacida en 2019 (Luis Martínez Solano; en 2021 se integra
Gabriel Cerdas Monge) que convirtió una comunidad digital en una casa de producto:
un **juego de mesa educativo** de 80 cartas ilustradas a doble cara con las que 2 a
6 jugadores reconstruyen una línea del tiempo cronológica de la historia del país,
además de **mercancía** de temática histórica, un **podcast** (Spotify y YouTube) y
**membresías de YouTube** (comunidad). Opera desde **San José, Costa Rica**, de cara
al público costarricense y en español. Su tono es divulgativo y cercano; su producto
central es a la vez juego y herramienta didáctica.

Su credibilidad no es solo de audiencia: cuenta con **reconocimientos del Ministerio
de Cultura y Juventud en 2024 y 2025**, un activo de marca que hoy no tiene dónde
exhibirse.

## 2 · Estado digital actual

El prospecto **no tiene web propia**. Su presencia vive enteramente en plataformas
de terceros —Instagram, YouTube, Spotify— y la venta se resuelve por **WhatsApp y
enlaces de terceros**, con envío manual de fotos y datos bancarios. En la práctica:

- No existe un lugar propio donde el catálogo (juego, merch, podcast, membresías) se
  presente completo y se compre; cada producto depende de un canal distinto.
- El reconocimiento institucional (MCJ 2024–2025) y la historia del proyecto **no
  están publicados** en ningún dominio propio.
- La conversión depende de un intercambio manual por mensaje, lo que **quema la
  venta por impulso** (ver §4).

Datos de tráfico, tamaño de comunidad y volumen de ventas: **no constan** (no
bloquean el prototipo).

## 3 · Análisis FODA de infraestructura

|  | Origen interno | Origen externo |
|---|---|---|
| **Favorable** | **Fortalezas:** marca reconocida por el MCJ (2024, 2025); producto central visualmente potente (80 cartas / línea de tiempo) idóneo para una portada memorable; comunidad y contenido ya existentes (podcast, redes, membresías de YouTube); logotipo disponible. | **Oportunidades:** el espacio de «historia de CR como producto con web propia» no parece ocupado; el juego se presta a una experiencia cronológica que ninguna red social permite; el sello del MCJ diferencia frente a merch genérico. |
| **Desfavorable** | **Debilidades:** cero infraestructura propia; venta 100 % manual por WhatsApp + transferencia BAC; sin fichas de producto ni precios publicados hasta ahora; identidad visual incompleta (se fija en §6.1). | **Amenazas:** dependencia de terceros (un cambio de algoritmo o de políticas corta la venta); enlaces de terceros frágiles; sin dominio propio, la marca es fácil de suplantar y difícil de encontrar. |

## 4 · El dolor

**Historia de Costa Rica tiene una comunidad y un producto premiados, pero vende a
través de un embudo manual que no controla: cada compra depende de mandar fotos por
WhatsApp y datos bancarios, sin una web propia donde el juego se explique, se desee y
se compre — y eso quema la venta por impulso.**

*Cita textual del prospecto (resuelve §1.3.4):* el equipo fundador expresó, en
conversaciones previas al brief:

> «Es un dolor de cabeza tener que mandar fotos de las cartas por WhatsApp y los
> números de cuenta del BAC cada vez que alguien quiere comprar el juego o una
> camisa; perdemos muchas ventas de impulso.»

El dolor es de **canal**, no de contenido: la evidencia confirma que la fricción
vive en el momento de la compra, no en la falta de material.

## 5 · Hipótesis de solución

El prototipo se aprueba si demuestra, verificable en un teléfono real, que:

1. Los cuatro frentes (juego, merch, podcast, membresías) **caben en una sola web
   propia** navegable desde el móvil, sin depender de un tercero.
2. El **producto estrella** —las 80 cartas y su línea de tiempo— se comunica con una
   **portada cinemática** que transmite su valor histórico antes de vender.
3. La conversión **se concentra en un punto de contacto real** (Magic Bottom · F09 →
   WhatsApp del prospecto), matando la fricción de fotos+banco descrita en el dolor.
4. La marca **proyecta la seriedad de sus reconocimientos** (MCJ 2024–2025).

## 6 · Alcance del prototipo (aprobado)

Una **sola página larga con secciones ancladas** (F04), móvil primero (375 px):

| # | Sección | Rol |
|---|---|---|
| 0 | **Portada cinemática** (4 actos) | Árbol de Guanacaste → travesía por la copa → esfera del Diquís → las 80 cartas formando la línea del tiempo. |
| 1 | **El Juego de Mesa** | Ficha: 80 cartas doble cara, 2–6 jugadores, cómo se juega. **₡15 000**. CTA → WhatsApp (F09). |
| 2 | **Merch** | Mercancía histórica. Camisetas **₡12 000**. CTA → WhatsApp. |
| 3 | **El Podcast** | Enlaces/embeds a Spotify y YouTube. |
| 4 | **Comunidad / Membresías** | Membresías de YouTube **desde ₡600/mes**. CTA → unirse. |
| 5 | **Nosotros + reconocimientos** | Historia (2019 / 2021) y sellos del MCJ 2024–2025. |
| 6 | **Contacto** | Canales reales; refuerzo del Magic Bottom. |

**Nueve funciones obligatorias (§3.2), ni más ni menos:** F01 Loading Page · F02
Header Mobile-First · F03 Scroll Reveal · F04 Anchor Glide · F05 Information System ·
F22 System Settings · F06 System Update · F09 Magic Bottom (→ WhatsApp real) · F10
Elysium Signature. Pie **V1.0.0 Beta** exacto + `<meta name="app-version"
content="V1.0.0">` y `window.ELYSIUM_SYSTEM.stage='Beta'` (§3.2.1). **noindex,
nofollow** en todas las páginas (§4.1).

**Fuera del alcance (§3.2), confirmado:** F16 conversión/selección de divisa (el
brief la pedía en el Acto 4 — se descarta; precios en ₡), checkout transaccional y
pasarela de pago, F18 CRM, F15 multi-idioma (solo español), F17 PWA, F19 Discovery
Core, F20 SEO, F21 sonido, F12 cursor. Se ofrecerán como *upgrades* tras firmar
(ver §7).

### 6.1 · Identidad visual (aprobada)

- **Paleta:** acento **`#8B6F4E`** (ocre/tierra — pergamino e historia), superficie
  oscura **`#1A1A1A`**, texto **`#F5F5F5`**.
- **Tipografías:** títulos **Playfair Display** (elegancia clásica/histórica);
  cuerpo **Inter** (con **Roboto** como alternativa) para legibilidad moderna.
- Logotipo: `logo.jpg` en la raíz. Arte de las 80 cartas: aún no entregado → la
  portada usa geometría procedimental con hookpoints comentados para sustituir por
  `.gltf`/texturas reales (nota técnica del §6, sin cambios).

### 6.2 · Datos de contacto reales (para el Magic Bottom, F09)

- **WhatsApp:** `https://api.whatsapp.com/message/BTRBLFBKQHBRI1`
- **Correo:** `historiadecostarica2021@gmail.com`
- **Instagram:** `instagram.com/historiadecostarica`
- **YouTube:** `youtube.com/@historiadecostarica`
- **Spotify:** `open.spotify.com/show/05hbZPyY9UKe6JemLiUutL`

## 7 · Plan recomendado (aprobado)

**Basic Maintenance — 70 €/mes.** Es el primer escalón que incluye el desarrollo web
corporativo completo, la **Loading Page** (vital para la cinemática), el **Magic
Bottom** (para ordenar su WhatsApp) y las garantías de accesibilidad y rendimiento.
El **e-commerce transaccional y el multi-divisa** —que requieren Preferential /
Advanced— se ofrecerán como *upgrades* una vez firmado el contrato base.

---

### Estado final

- **Compuerta 1: SUPERADA.** Este documento es la única fuente para la Fase 3.
- `[PENDIENTE]` remanente antes de fase comercial (no bloquea el código, sí la
  publicación · Compuerta 3): archivos de arte de las cartas; catálogo de merch más
  allá de camisetas; tamaño de comunidad. Ningún `[PENDIENTE]` debe quedar **visible
  en pantalla** en el prototipo entregado.
