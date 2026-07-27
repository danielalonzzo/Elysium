# Informe preliminar · Historia de Costa Rica

> Fase 2 · Diagnóstico de infraestructura digital. Estructura fija según §2.2 del
> Protocolo de Prototipado v1.2.0. Cada afirmación se apoya en
> `00-recoleccion/notas-comerciales.md` (en adelante, *notas*) y, a través de
> ella, en el brief del cliente. Ante cualquier dato ausente se escribe «no
> consta» (§2.3). No se prometen posiciones en buscadores, plazos ni resultados de
> negocio.
>
> **Tipo de proyecto:** NUEVO (Ruta A · prospecto sin sitio previo).
> **Estado:** borrador del LLM. Requiere revisión del equipo →
> `02-informe-aprobado.md` para abrir la Compuerta 1.

---

## 1 · Retrato de la empresa

Historia de Costa Rica (@historiadecostarica) es una iniciativa de **divulgación
cultural e histórica** nacida en 2019 (Luis Martínez Solano; en 2021 se integra
Gabriel Cerdas Monge) que convirtió una comunidad digital en una pequeña casa de
producto: un **juego de mesa educativo** de 80 cartas ilustradas con las que 2 a 6
jugadores reconstruyen una línea del tiempo cronológica de la historia del país,
además de **mercancía**, un **podcast** (Spotify y YouTube) y **membresías** de
comunidad (*notas · Servicios o productos*). Su tono es divulgativo y cercano, con
un producto central que es a la vez juego y herramienta didáctica.

Su credibilidad no es solo de audiencia: cuenta con **reconocimientos del
Ministerio de Cultura y Juventud en 2024 y 2025** (*notas · Historia y
credenciales*), un activo de marca que hoy no tiene dónde exhibirse. El proyecto
opera de cara al público costarricense, en español (*notas · Idiomas*).

## 2 · Estado digital actual

El prospecto **no tiene web propia** (*notas · Sitio actual*). Su presencia vive
enteramente en plataformas de terceros —Instagram, YouTube, Spotify— y la venta se
resuelve por **WhatsApp y enlaces de terceros** (*notas · Contacto real*). En la
práctica esto significa que:

- No existe un lugar propio donde el catálogo (juego, merch, podcast, membresías)
  se presente completo y se compre; cada producto depende de un canal distinto.
- El reconocimiento institucional (MCJ 2024–2025) y la historia del proyecto **no
  están publicados** en ningún dominio propio.
- La conversión depende de un intercambio manual por mensaje, sin una ficha de
  producto que explique el juego antes de escribir.

El costo de esa ausencia es doble: fricción en cada venta (todo pasa por un chat
manual) y **dependencia total de algoritmos ajenos** para ser encontrado. Datos de
tráfico, tamaño de comunidad y volumen de ventas: **no constan**.

## 3 · Análisis FODA de infraestructura

|  | Origen interno | Origen externo |
|---|---|---|
| **Favorable** | **Fortalezas:** marca reconocida por el MCJ (2024, 2025); un producto central visualmente potente (80 cartas / línea de tiempo) idóneo para una portada memorable; comunidad y contenido ya existentes (podcast, redes); logotipo disponible. | **Oportunidades:** ningún competidor directo de «historia de CR como producto» parece ocupar el espacio de una web propia; el juego se presta a una experiencia cronológica que ninguna red social permite; el sello del MCJ diferencia frente a merch genérico. |
| **Desfavorable** | **Debilidades:** cero infraestructura propia; venta 100 % manual por WhatsApp; sin fichas de producto ni precios publicados (*notas*); identidad visual incompleta (colores/tipografías no constan). | **Amenazas:** dependencia de terceros (un cambio de algoritmo o de políticas corta la venta); enlaces de terceros frágiles; sin dominio propio, la marca es fácil de suplantar y difícil de encontrar. |

## 4 · El dolor

**Historia de Costa Rica tiene una comunidad y un producto premiados, pero vende a
través de un embudo que no controla: cada compra depende de un mensaje de WhatsApp
y de enlaces de terceros, sin una web propia donde el juego se explique, se desee y
se compre.**

*Evidencia:* el brief describe explícitamente que «carecen de una web propia,
sufriendo cuellos de botella en la venta de sus productos por WhatsApp y enlaces de
terceros» (*notas · Estado del criterio de suficiencia*). ⚠️ La **cita textual del
propio prospecto** exigida por §1.3.4 **no consta**; el dolor aquí enunciado
procede del brief, no de una frase literal del cliente, y debe confirmarse en la
revisión del equipo.

## 5 · Hipótesis de solución

El prototipo se aprueba si demuestra, de forma verificable en un teléfono real,
que:

1. Los cuatro frentes del negocio (juego, merch, podcast, membresías) **caben en
   una sola web propia** navegable desde el móvil, sin depender de un tercero.
2. El **producto estrella** —el juego de 80 cartas y su línea de tiempo— puede
   comunicarse con una **portada cinemática** que transmita su valor histórico
   antes de cualquier texto de venta.
3. La conversión puede **concentrarse en un solo punto de contacto real**
   (Magic Bottom · F09 → WhatsApp del prospecto) en lugar de dispersarse.
4. La marca puede **proyectar la seriedad de sus reconocimientos** (MCJ 2024–2025)
   en un espacio que hoy no existe.

## 6 · Alcance propuesto del prototipo

**Plataforma:** móvil primero, primera composición a 375 px (§3.1). **Idioma:**
español únicamente. Estructura de **una sola página larga con secciones ancladas**
(F04 · Anchor Glide), recorrida de arriba abajo:

| # | Sección | Rol |
|---|---|---|
| 0 | **Portada cinemática** (los 4 actos del brief) | Árbol de Guanacaste → travesía por la copa → esfera del Diquís → las 80 cartas formando la línea del tiempo. Impacto de marca y del producto. |
| 1 | **El Juego de Mesa** | Ficha del producto central: qué es, 80 cartas, 2–6 jugadores, cómo se juega. CTA de compra → WhatsApp (F09). |
| 2 | **Merch** | Presentación de la mercancía histórica. CTA → WhatsApp. |
| 3 | **El Podcast** | Enlaces/embeds a Spotify y YouTube. |
| 4 | **Comunidad / Membresías** | Qué ofrece la membresía mensual. CTA → contacto. |
| 5 | **Nosotros + reconocimientos** | Historia (2019/2021) y sellos del MCJ 2024–2025. |
| 6 | **Contacto** | Canales reales; refuerzo del Magic Bottom. |

**Las nueve funciones obligatorias (§3.2), ni más ni menos:** F01 Loading Page ·
F02 Header Mobile-First · F03 Scroll Reveal · F04 Anchor Glide · F05 Information
System · F22 System Settings · F06 System Update · F09 Magic Bottom (→ WhatsApp
real) · F10 Elysium Signature. Pie con etiqueta **V1.0.0 Beta** exacta y
`<meta name="app-version" content="V1.0.0">` + `window.ELYSIUM_SYSTEM.stage='Beta'`
(§3.2.1). **noindex, nofollow** en todas las páginas (§4.1).

**Queda deliberadamente fuera** (§3.2), aunque el brief lo insinúe:

- **F16 · Conversión / selección de divisa** — el brief la pedía en el Acto 4; se
  **descarta**: es función de proyecto contratado. Los precios se mostrarán en
  colones (₡) cuando el prospecto los facilite.
- **Checkout transaccional / pasarela de pago y F18 · CRM** — fuera. La compra se
  resuelve por el Magic Bottom (WhatsApp), que es justo lo que el dolor pide
  ordenar. Una tienda con carrito y pago es alcance de producción.
- **F15 multi-idioma, F17 PWA, F19 Discovery Core, F20 SEO** — fuera.
- **F21 sonido y F12 cursor** — solo si esta aprobación lo justifica; por defecto,
  fuera.

**Nota técnica de la portada cinemática.** El concepto 3D del brief (React Three
Fiber + GSAP ScrollTrigger) es compatible con F01/F03 y con la regla de
rendimiento (`frameloop="demand"` / pausa por `IntersectionObserver`). Siguiendo la
arquitectura de producción vigente de Elysium (proyecto de referencia adjunto), la
geometría se construirá **de forma procedimental/paramétrica** (árbol, esfera,
cartas), con puntos de conexión comentados para sustituir por modelos `.gltf` y
texturas reales cuando existan. Esto evita bloquear el prototipo con assets que hoy
no constan.

## 7 · Plan recomendado

El diagnóstico encaja con un **plan de presencia + catálogo con portada de alto
impacto**: una sola web propia que centraliza los cuatro frentes del negocio,
resuelve la venta por el Magic Bottom y usa el producto estrella como pieza
cinemática de marca. **El nombre exacto del plan (de los cinco del estándar) queda
como «no consta»**: `ELYSIUM-STANDARDS.md` no está en este repositorio y nombrar un
plan concreto sería inventar. Se recomienda fijarlo en la revisión del equipo a
partir del catálogo del estándar.

*Justificación:* el dolor es de **canal**, no de contenido; el prospecto ya
produce material y comunidad. Lo que falta es **infraestructura propia** que
convierta atención en venta y exhiba la credibilidad institucional. El plan mínimo
viable que demuestra eso es exactamente el alcance del §6.

---

### Cierre

Este informe abre la **Compuerta 1**. Según §2.4 y §5 (MUST), **no se escribe una
sola línea de código del prototipo** hasta que el equipo lo revise, lo corrija y lo
apruebe como `_comercial/02-informe-aprobado.md`. Puntos que la revisión debería
zanjar: (a) confirmar/obtener la cita textual del dolor; (b) precios y ubicación;
(c) nombre del plan del estándar; (d) dirección de identidad visual (paleta y
tipografías) a proponer.
