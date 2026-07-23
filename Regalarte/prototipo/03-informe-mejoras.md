# Informe de mejoras · Regalarte

Estado: **APROBADO · IMPLEMENTACIÓN AUTORIZADA**  
Tipo de proyecto: **REDISEÑO · Ruta B**  
Fecha: **22 de julio de 2026**  
Base autorizada: `02-informe-aprobado.md` y réplica fiel aprobada por el
equipo el 22 de julio de 2026.

Aprobación del equipo: **“aprobada, procede”**, recibida el 22 de julio de 2026.

Este documento corresponde al Paso 2 de la Fase 3 del protocolo Elysium. No
implementa ninguna mejora. El rediseño solo puede comenzar cuando el equipo
apruebe expresamente este informe.

## Dirección recomendada

La visión planteada por el prospecto —el Arenal que crece con el scroll, un giro
de cámara y la llegada del mar hasta Manuel Antonio, acompañados por tucanes 3D—
tiene potencial para convertir a Regalarte en una experiencia digital
reconocible y no en otra tienda tropical genérica.

La recomendación es concentrar el gran efecto en **una sola secuencia
cinematográfica de la portada** y utilizar el resto de la web para comprar con
claridad. Si todo se mueve, nada sorprende. El concepto rector propuesto es:

> **Costa Rica, para llevar · Del volcán al mar.**

La dirección artística recomendada es un **realismo mágico costarricense,
premium y ligeramente estilizado**: atmósfera, escala, vegetación y materiales
táctiles, sin parecer un videojuego ni recurrir a una suma de clichés
turísticos. El espectáculo debe conducir a dos acciones de negocio visibles:
comprar al detalle y comprar al por mayor.

---

## 1. Mejoras estructurales

Propuestas ordenadas de mayor a menor impacto.

### E01 · Convertir Inicio en relato y embudo de conversión

- **Impacto:** muy alto.
- **Qué se cambia:** la portada se divide en dos capas. La primera es una
  experiencia narrativa de cuatro a cinco alturas de pantalla, del Arenal a
  Manuel Antonio. La segunda es una portada comercial convencional con
  categorías, productos, La Sele, historia/compromiso y llamadas a la acción.
  Un CTA de compra y una opción para saltar la experiencia permanecen
  disponibles desde el comienzo.
- **Por qué:** hoy la identidad tropical no construye una historia distintiva
  ni conduce con suficiente claridad a la compra.
- **Mejora esperada:** mayor recordación de marca sin esconder el catálogo ni
  retrasar al visitante que ya llega con intención de compra.
- **Aprobación:** incluida en la aprobación global de este informe. Los nuevos
  titulares y recursos visuales son **sujetos a aprobación del prospecto**.

### E02 · Separar con claridad detalle y mayoreo

- **Impacto:** muy alto.
- **Qué se cambia:** se presentan dos caminos visibles desde Inicio y desde la
  navegación: `Comprar al detalle` y `Comprar al por mayor`. El segundo reúne
  requisitos, solicitud de cuenta, catálogos y contacto comercial en un solo
  centro de mayoreo.
- **Por qué:** los recorridos B2C y B2B actuales compiten entre sí y el mayoreo
  está fragmentado en varias páginas.
- **Mejora esperada:** menos decisiones ambiguas, menor abandono y un recorrido
  comercial entendible para cada audiencia.
- **Aprobación:** incluida en la aprobación global de este informe. La
  reescritura de requisitos o mensajes comerciales es **sujeta a aprobación
  del prospecto**.

### E03 · Simplificar la arquitectura principal

- **Impacto:** alto.
- **Qué se cambia:** la navegación principal propuesta es `Tienda`, `Mayoreo`,
  `La Sele`, `Nuestra historia`, `Blog` y `Contacto`; el logotipo conduce a
  Inicio. Checkout deja de ser una opción del menú y se accede desde el
  carrito. Las rutas auditadas se conservan durante el prototipo y se definen
  redirecciones para cualquier consolidación futura.
- **Por qué:** la estructura actual mezcla navegación institucional, compra y
  pasos transaccionales, y expone páginas residuales.
- **Mejora esperada:** orientación más rápida, un encabezado más limpio y menos
  entradas accidentales a estados que dependen del carrito.
- **Aprobación:** incluida en la aprobación global de este informe. Los nombres
  definitivos del menú son **sujetos a aprobación del prospecto**.

### E04 · Reconstruir Tienda alrededor de encontrar productos

- **Impacto:** alto.
- **Qué se cambia:** se incorporan búsqueda y ordenación; los filtros pasan a
  un panel desplegable en móvil y a una columna compacta en escritorio; se
  muestran resultados, estado de filtros y una acción clara para limpiarlos.
  En móvil los productos aparecen antes que el listado completo de filtros.
- **Por qué:** el catálogo actual exige demasiado recorrido, especialmente en
  pantallas pequeñas, y no ofrece herramientas básicas de localización.
- **Mejora esperada:** menor tiempo para encontrar un artículo, mayor
  exploración del inventario y mejor continuidad entre categoría y producto.
- **Aprobación:** incluida en la aprobación global de este informe; no altera
  precios ni inventario.

### E05 · Reordenar producto, carrito y checkout

- **Impacto:** alto.
- **Qué se cambia:** la ficha prioriza galería, nombre, precio, variaciones,
  disponibilidad existente y CTA; la información de compra se agrupa cerca de
  la decisión. Carrito y checkout eliminan distracciones 3D, traducen y
  ordenan sus campos, y conservan un resumen visible del pedido.
- **Por qué:** las fichas actuales tienen información comercial limitada y el
  checkout es extenso e inconsistente.
- **Mejora esperada:** mayor confianza, menos errores y menor fricción en la
  parte más sensible del recorrido.
- **Aprobación:** incluida en la aprobación global de este informe. Cualquier
  texto nuevo sobre envíos, stock, devoluciones o atributos es **sujeto a
  aprobación del prospecto**. No se propone cambiar precios.

### E06 · Preservar alcance, rutas y seguridad del prototipo

- **Impacto:** medio.
- **Qué se cambia:** el nuevo sistema visual se aplica sobre el alcance
  aprobado de 88 productos y las plantillas existentes. Formularios, cuenta,
  carrito y checkout mantienen comportamiento local de demostración. Se
  conservan `noindex, nofollow`, `V1.0.0 Beta` y las nueve funciones Elysium
  exactas: F01, F02, F03, F04, F05, F22, F06, F09 y F10.
- **Por qué:** un rediseño visual no autoriza a ampliar integraciones ni a
  convertir el prototipo en un sistema transaccional real.
- **Mejora esperada:** comparación honesta entre antes y después, menor riesgo
  técnico y cumplimiento del alcance aprobado.
- **Aprobación:** control normativo; no requiere alteración de contenido.

---

## 2. Mejoras de diseño

Propuestas ordenadas de mayor a menor impacto.

### D01 · Construir una escena maestra “Arenal → Pacífico”

- **Impacto:** muy alto.
- **Qué se cambia:** Inicio utiliza un único lienzo 3D fijado visualmente
  mientras el scroll nativo controla una secuencia continua. La progresión
  conceptual es:

  | Progreso | Escena | Movimiento y función |
  |---:|---|---|
  | 0–15 % | Amanecer | Arenal visible tras vegetación y neblina; titular y CTA ya presentes. |
  | 15–38 % | Ascenso | La cámara se acerca; el volcán gana escala y profundidad sin “inflarse” artificialmente. |
  | 38–58 % | Giro | Arco lateral controlado de aproximadamente 60–75°; las capas del bosque revelan el horizonte. |
  | 58–76 % | Invasión del mar | Agua y espuma entran desde un costado y transforman la paleta volcánica en Pacífico. |
  | 76–92 % | Manuel Antonio | Playa, roca, selva y horizonte; aparecen productos destacados y la acción de compra. |
  | 92–100 % | Tucán y salida | Un vuelo protagonista guía hacia la portada comercial en HTML. |

- **Por qué:** convierte la idea del prospecto en un relato con principio,
  transición y desenlace, en lugar de efectos 3D aislados.
- **Mejora esperada:** una firma visual propia, una demostración memorable de
  Costa Rica y una transición natural hacia los productos.
- **Aprobación:** los modelos, paisajes, composición y sustitución o creación
  de imágenes son **sujetos a aprobación del prospecto**.

### D02 · Adoptar un sistema visual costarricense, no una decoración tropical

- **Impacto:** muy alto.
- **Qué se cambia:** la identidad se construye con basalto del Arenal, verde
  selva, jade, azul Pacífico, arena cálida y acentos papaya, guaria morada y
  amarillo tucán. Los materiales evocan piedra volcánica, madera, fibras,
  textiles, cerámica y papel. Curvas topográficas, coordenadas y siluetas
  botánicas forman el lenguaje secundario.
- **Por qué:** “poner hojas” no basta para expresar una procedencia; el paisaje,
  los materiales y el ritmo deben formar un sistema coherente.
- **Mejora esperada:** mayor autenticidad percibida, consistencia entre
  secciones y una marca reconocible aun cuando no haya una escena 3D.
- **Aprobación:** la nueva dirección de color, tipografía, imágenes y materiales
  es **sujeta a aprobación del prospecto**.

### D03 · Diseñar escritorio y móvil como dos composiciones hermanas

- **Impacto:** alto.
- **Qué se cambia:** escritorio aprovecha el campo horizontal, una cámara más
  amplia y el arco completo. Móvil conserva la misma historia en un lienzo de
  `100svh`, con Arenal en el tercio superior, giro más corto, menos partículas,
  una sola pasada de tucán y controles dentro de zonas alcanzables. Navegación,
  carrito, CTA y opción de saltar permanecen utilizables en ambos formatos.
- **Por qué:** reducir la escena de escritorio produciría textos pequeños,
  encuadres rotos y una carga desproporcionada en teléfonos.
- **Mejora esperada:** experiencia espectacular a 1440/1920 px y completa,
  legible y fluida desde 375 px.
- **Aprobación:** incluida en la aprobación global de este informe.

### D04 · Reservar el 3D pesado para Inicio

- **Impacto:** alto.
- **Qué se cambia:** Tienda, producto, Nosotros, Blog, Mayoreo y Contacto usan
  profundidad 2.5D, recortes de producto, topografía, vegetación y
  microinteracciones livianas. Carrito y checkout permanecen serenos. La Sele
  usa su propia energía deportiva sin copiar la escena natural.
- **Por qué:** repetir un lienzo WebGL complejo en cada ruta aumenta la carga,
  distrae de las tareas y desgasta el efecto sorpresa.
- **Mejora esperada:** mejor rendimiento, mayor foco comercial y continuidad
  visual sin monotonía.
- **Aprobación:** los nuevos fondos, recortes e ilustraciones son **sujetos a
  aprobación del prospecto**.

### D05 · Tratar los tucanes como personajes, no como ruido

- **Impacto:** alto.
- **Qué se cambia:** uno o dos tucanes estilizados realizan vuelos
  coreografiados en transiciones concretas; pueden reaparecer como motivo
  gráfico o posarse en un límite de sección. No vuelan permanentemente sobre
  textos, filtros ni controles.
- **Por qué:** la repetición aleatoria convertiría el recurso más distintivo en
  una distracción y afectaría legibilidad y rendimiento.
- **Mejora esperada:** carácter de marca, sorpresa dosificada y una narrativa
  visual fácil de recordar.
- **Aprobación:** el diseño y animación del ave son **sujetos a aprobación del
  prospecto**.

### D06 · Aplicar mejora progresiva, accesibilidad y movimiento reducido

- **Impacto:** alto.
- **Qué se cambia:** titulares, precios, enlaces y CTA permanecen en HTML por
  encima del lienzo 3D. El contenido aparece antes de cargar WebGL. Sin WebGL,
  con dispositivo limitado o con movimiento reducido se ofrece la misma
  historia mediante composiciones estáticas o transiciones breves. F22 y
  `prefers-reduced-motion: reduce` eliminan giros, olas invasivas, parallax y
  vuelos; el visitante llega al contenido de forma inmediata. No se incorpora
  audio automático ni un ajuste de sonido, porque queda fuera del contrato F22.
- **Por qué:** los movimientos de escala, cámara y parallax pueden provocar
  malestar; además, un lienzo no debe ocultar la semántica ni bloquear la compra.
- **Mejora esperada:** recorrido usable con teclado, lector de pantalla,
  equipos modestos y preferencias de accesibilidad, sin perder el concepto.
- **Aprobación:** control obligatorio de calidad y alcance.

### D07 · Elevar tarjetas y fichas sin competir con el producto

- **Impacto:** medio.
- **Qué se cambia:** tarjetas con jerarquía estable, recortes consistentes,
  precio y CTA visibles; inclinación o profundidad sutil solo en dispositivos
  compatibles. En ficha, el producto ocupa el protagonismo visual sobre una
  superficie material. Una vista 360° se utilizará únicamente cuando exista un
  modelo aprobado y optimizado.
- **Por qué:** el catálogo necesita coherencia y lectura rápida; un efecto
  distinto por tarjeta degradaría la comparación de productos.
- **Mejora esperada:** mayor escaneabilidad, mejor percepción de calidad y CTA
  más claros.
- **Aprobación:** cualquier recorte, retoque, sustitución o modelo de producto
  es **sujeto a aprobación del prospecto**.

---

## 3. Mejoras de estilo y contenido

Propuestas ordenadas de mayor a menor impacto. Todas las que alteran textos,
precios o imágenes llevan la marca exigida por el protocolo.

### C01 · Crear una voz de marca asociada al viaje

- **Impacto:** alto.
- **Qué se cambia:** se propone usar `Costa Rica, para llevar` como idea
  rectora y explorar el titular `Costa Rica no cabe en una postal. Pero sí en
  un regalo.` Los textos conectan paisaje, fauna, cultura y objeto, y terminan
  siempre en una acción comercial clara.
- **Por qué:** la escena necesita una promesa verbal que explique por qué el
  viaje termina en Regalarte y no en una web de turismo.
- **Mejora esperada:** posicionamiento más memorable y una relación clara entre
  emoción, procedencia y producto.
- **Aprobación:** **sujeta a aprobación del prospecto** por modificar textos.

### C02 · Corregir y unificar todo el contenido comercial

- **Impacto:** alto.
- **Qué se cambia:** se corrigen `Eviar`, `%100`, `Tucánes`, `Jacket`,
  `SKU: N/D`, `©2025`, el enlace de correo sin arroba y la privacidad rota; se
  eliminan o redirigen páginas residuales y promociones vencidas una vez
  confirmada su vigencia. Español, mayúsculas, botones y mensajes de estado se
  normalizan en todas las plantillas.
- **Por qué:** los errores actuales reducen confianza y hacen que la interfaz
  parezca inconclusa.
- **Mejora esperada:** mayor credibilidad, coherencia editorial y menos
  confusión durante la compra.
- **Aprobación:** **sujeta a aprobación del prospecto** por modificar textos y
  estados publicados.

### C03 · Completar información de producto y compra con datos confirmados

- **Impacto:** alto.
- **Qué se cambia:** se define una ficha mínima por producto: nombre, precio,
  variación, disponibilidad, material/medida cuando exista, cuidado, entrega y
  CTA. No se inventan atributos; los vacíos quedan señalados para recolección.
- **Por qué:** la información actual es desigual y obliga al visitante a
  decidir con datos incompletos.
- **Mejora esperada:** menos dudas, menos consultas repetitivas y decisiones de
  compra mejor informadas.
- **Aprobación:** **sujeta a aprobación del prospecto** por modificar textos.
  **No se propone cambiar precios**; cualquier corrección de precio requerirá
  aprobación expresa y una fuente comercial vigente.

### C04 · Producir un sistema visual original y con licencias verificadas

- **Impacto:** alto.
- **Qué se cambia:** se crea un inventario de activos para Arenal, Manuel
  Antonio, mar, vegetación, neblina, tucán y productos. Cada modelo, textura,
  fotografía o ilustración debe ser propio, comisionado o contar con licencia
  compatible; el paisaje se valida por semejanza reconocible sin pretender una
  reproducción geográfica exacta.
- **Por qué:** la calidad del “wow” depende más de la dirección artística y de
  los activos que del framework. Activos genéricos o sin licencia debilitarían
  el resultado y crearían riesgo legal.
- **Mejora esperada:** una identidad propia, calidad visual consistente y una
  cadena de uso documentada.
- **Aprobación:** **sujeta a aprobación del prospecto** por crear o reemplazar
  imágenes.

### C05 · Dar tratamiento editorial propio a cada familia de páginas

- **Impacto:** medio.
- **Qué se cambia:** Nosotros funciona como mapa del origen y compromiso;
  Blog como cuaderno de campo; Mayoreo como herramienta comercial; La Sele
  mantiene rojo/azul y una energía deportiva; Contacto usa un mapa ilustrado y
  datos directos. Carrito y checkout emplean mensajes breves y funcionales.
- **Por qué:** todas las páginas no tienen la misma intención y no deben recibir
  la misma cantidad de movimiento ni el mismo tono.
- **Mejora esperada:** jerarquía editorial, personalidad sin perder usabilidad
  y mejor correspondencia entre mensaje y tarea.
- **Aprobación:** **sujeta a aprobación del prospecto** por modificar textos e
  imágenes.

### C06 · Incorporar alternativas textuales y etiquetas comprensibles

- **Impacto:** medio.
- **Qué se cambia:** imágenes informativas reciben textos alternativos
  concretos; las decorativas se omiten del árbol accesible; iconos, filtros,
  variaciones, galerías y estados de carrito tienen nombres y mensajes claros.
- **Por qué:** la réplica confirma carencias de alternativas, landmarks y
  controles identificables.
- **Mejora esperada:** comprensión con lector de pantalla, menor ambigüedad y
  mejor semántica general.
- **Aprobación:** **sujeta a aprobación del prospecto** en lo que constituye
  nuevo contenido descriptivo.

---

## Arquitectura técnica propuesta

Esta arquitectura demuestra viabilidad; no autoriza todavía su instalación o
implementación.

1. **Documento primero.** Next.js conserva estructura, contenido, CTA y rutas
   en HTML. El lienzo visual es una capa progresiva, decorativa y sin captura
   de teclado o gestos; no es la fuente del contenido.
2. **Módulo aislado.** La experiencia se encapsula en `CinematicHome`, se carga
   dinámicamente solo en Inicio y no obliga a Tienda, producto o checkout a
   descargar Three.js. Un póster renderizado desde el servidor ocupa su lugar
   hasta que la escena está lista.
3. **Una escena persistente.** React Three Fiber/Three.js administran un solo
   lienzo en Inicio. GSAP ScrollTrigger traduce el scroll nativo a una línea de
   tiempo con `scrub`; no se bloquea la rueda, no se simula otro scroll y no se
   actualiza estado React en cada frame.
4. **Render bajo demanda.** ScrollTrigger escribe el progreso en una referencia
   normalizada; cada cambio invalida solo el frame necesario. La escena pausa
   fuera de viewport o cuando la pestaña no está visible.
5. **Activos para tiempo real.** Modelos en glTF/GLB, geometría comprimida con
   Draco o Meshopt y texturas KTX2/Basis. Las escenas posteriores se cargan por
   etapas y geometrías, materiales y vegetación se comparten o instancian para
   reducir draw calls.
6. **Mar optimizado.** Olas y espuma se resuelven con geometría y shaders
   controlados; no se incorpora un motor de física. El postprocesado costoso se
   limita o desactiva en móvil.
7. **Adaptación por capacidad.** Se limita la resolución interna, se reduce la
   complejidad de la escena y se ofrece un póster/secuencia estática cuando el
   dispositivo no puede sostenerla. No se depende exclusivamente de WebGPU.
8. **Integración Elysium.** F22 controla movimiento reducido; F04 no interfiere
   con la línea de tiempo; F03 revela contenido DOM, no objetos indispensables
   del lienzo. `elysium-core/` permanece intacto.
9. **Prueba de compatibilidad previa.** Antes de producir arte final se fija y
   valida una combinación compatible de `three`, React Three Fiber, Drei y GSAP
   sobre Next.js 16, React 19, Vinext 0.0.50 y Vite 8. La compilación debe
   confirmar una sola instancia de `three` y desmontaje limpio de recursos GPU.

### Presupuesto inicial de aceptación

Los valores son objetivos internos que se comprobarán en dispositivos reales,
no promesas obtenidas por el simple uso de una librería.

| Área | Objetivo de prototipo |
|---|---|
| Primer contenido | Titular, CTA y póster visibles sin esperar la escena 3D. |
| Carga 3D inicial | Hasta 5 MB comprimidos como techo; Arenal primero y costa diferida. El greybox intentará reducir este valor, especialmente en móvil. |
| Texturas | Preferencia por 1K en móvil y hasta 2K en escritorio, en KTX2 cuando proceda. |
| Resolución interna | DPR limitado por perfil; no asumir el DPR máximo del teléfono. |
| Fluidez | Meta de 60 fps en escritorio y 30 fps estables en móvil compatible. |
| Movimiento reducido | Cero giros de cámara, oleaje invasivo o vuelos obligatorios. |
| Interacción | Scroll, navegación, carrito y CTA utilizables antes, durante y después de la secuencia. |
| Fallo/fallback | La tienda y todos los recorridos siguen disponibles sin WebGL. |

Las guías técnicas consultadas respaldan la estrategia: React Three Fiber
recomienda controlar el render y escalar el rendimiento; Three.js advierte del
costo de renderizar al DPR completo y permite integrar compresión Draco,
Meshopt y KTX2 mediante GLTFLoader; Khronos recomienda glTF y texturas KTX para
entrega eficiente; GSAP ScrollTrigger permite vincular progreso y scroll con
`scrub`; y MDN documenta la necesidad de responder a
`prefers-reduced-motion`.

Fuentes primarias:

- [React Three Fiber · Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [React Three Fiber · Performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)
- [GSAP · ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Three.js · GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
- [Three.js · Responsive rendering](https://threejs.org/manual/en/responsive.html)
- [Khronos · glTF](https://www.khronos.org/gltf/)
- [Khronos · KTX](https://www.khronos.org/ktx/)
- [Khronos · Real-time asset creation guidelines](https://www.khronos.org/assets/uploads/apis/3DCommerce-Realtime-sset-Creation-Guidelines_Jul20.pdf)
- [MDN · Motion accessibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using_for_accessibility)

## Límites de diseño

- La portada debe seguir siendo una tienda, no convertirse en un micrositio de
  turismo.
- No se secuestra el scroll, no se reproducen vídeos ni audio automáticos y no
  se ocultan CTA dentro de WebGL.
- El volcán gana presencia principalmente por aproximación de cámara y
  composición; no se escala como un objeto inflable.
- El giro es corto y legible; no se utiliza una vuelta de 360° ni movimiento
  brusco.
- Las olas son una transición, no una capa que impida leer o accionar controles.
- Los tucanes aparecen con intención y nunca atraviesan formularios, precio,
  filtros o checkout.
- La experiencia completa se diseña primero a 375 px y después se expande a
  tablet, 1440 px y 1920 px.

## Criterios de aceptación del rediseño

1. La secuencia Arenal, giro, mar y Manuel Antonio se entiende sin explicación
   y termina en una acción comercial visible.
2. Detalle y mayoreo se distinguen desde Inicio y navegación.
3. Todo el contenido y los CTA esenciales funcionan sin WebGL y permanecen en
   HTML semántico.
4. A 375 px no hay desbordamiento, texto oculto ni controles fuera de alcance;
   la historia visual sigue completa.
5. A 1440 y 1920 px la escena usa el campo horizontal sin ampliar
   desproporcionadamente textos o activos.
6. F22 y `prefers-reduced-motion` entregan una alternativa inmediata y sin
   movimientos vestibulares.
7. Tienda, filtros, producto, carrito, checkout y formularios son operables con
   teclado y foco visible.
8. La escena cumple el presupuesto acordado o desciende automáticamente a una
   variante más ligera.
9. Se conservan las nueve funciones Elysium exactas, la seguridad local, la
   versión Beta y `noindex, nofollow`.
10. Ningún texto, precio o imagen modificados se considera final sin la
    aprobación correspondiente del prospecto.

## Secuencia de implementación posterior a la aprobación

1. Storyboard y tres fotogramas de dirección visual: Arenal, transición y
   Manuel Antonio.
2. Animatic/greybox sin activos finales para validar scroll, cámara y encuadres
   de escritorio y móvil.
3. Sistema de navegación, Inicio comercial, Tienda y plantillas internas en
   HTML/CSS responsive.
4. Producción, aprobación y optimización de modelos, texturas e imágenes.
5. Integración de la escena, fallbacks, F22 y movimiento reducido.
6. Aplicación del sistema visual a todas las rutas preservadas.
7. QA funcional, accesible, visual y de rendimiento en 375, 1440 y 1920 px,
   además de pruebas en teléfonos reales de capacidades distintas.

## Decisión solicitada en esta compuerta

Se solicita aprobar:

1. el concepto **“Costa Rica, para llevar · Del volcán al mar”**;
2. una escena 3D maestra solo en Inicio y un sistema 2.5D más ligero en el resto;
3. la nueva arquitectura con caminos separados para detalle y mayoreo;
4. la dirección artística de realismo mágico costarricense, premium y
   ligeramente estilizado;
5. el enfoque mobile-first, los fallbacks y los límites de rendimiento;
6. la producción posterior de nuevos textos e imágenes, todos sujetos a una
   revisión específica del prospecto antes de considerarse finales.

El informe fue aprobado expresamente. La réplica fiel queda preservada en
`replica-fiel-v1.0.0/` y el rediseño se implementa en `prototipo/`.
