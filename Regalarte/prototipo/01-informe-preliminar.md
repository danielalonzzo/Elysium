# Informe preliminar · Regalarte

Estado: **pendiente de revisión y aprobación del equipo**  
Tipo de proyecto: **REDISEÑO · Ruta B**  
Fecha: **22 de julio de 2026**

## 1. Retrato de la empresa

Regalarte es una empresa costarricense con más de veinte años de experiencia
declarada en la comercialización minorista y mayorista de souvenirs vinculados
a la cultura y la biodiversidad de Costa Rica. Su oferta incluye peluches y
recuerdos de fauna, textiles, gorras, cerámica, magnéticos, pulseras, títeres,
artículos navideños y productos oficiales de La Sele. Atiende tanto al
consumidor final como a comercios que compran al por mayor; ambos públicos
forman parte del alcance y no se ha declarado uno como prioritario sobre el
otro. (Fuentes: `00-recoleccion/contenido/perfil-y-contacto.md`;
`00-recoleccion/notas-comerciales.md`.)

La empresa declara cobertura nacional y vincula parte de su propuesta con la
educación ambiental, la conservación y la cultura costarricense. También
declara ser Patrocinador Bronce de Rescate Wildlife Rescue Center. Su lenguaje
visual observable utiliza fauna local, follaje tropical, verdes profundos,
fotografía de producto y una subidentidad azul y roja para La Sele. (Fuentes:
`00-recoleccion/contenido/perfil-y-contacto.md`;
`00-recoleccion/identidad/identidad-observable.md`.)

El nombre comercial es Regalarte y el sitio utiliza también la denominación
pública “Regalarte de las Américas”; la razón social legal no consta de forma
inequívoca. La zona de servicio declarada es Costa Rica y el sitio publica una
dirección en San Pedro, San José. Los canales aprobados para la réplica son
`info@regalartecr.com`, WhatsApp `+506 8520-9833`, teléfono
`+506 2253-5340`, Facebook e Instagram. (Fuentes:
`00-recoleccion/notas-comerciales.md`;
`00-recoleccion/contenido/perfil-y-contacto.md`.)

## 2. Estado digital actual

Regalarte dispone de un sitio público activo sobre WordPress y WooCommerce,
construido con Elementor, Elementor Pro y componentes Crocoblock. La
infraestructura observable incluye HTTPS, SiteGround, caché/CDN, Tilopay y un
sitemap generado por Yoast SEO. El sitio permite navegar por contenido
corporativo, catálogo, productos, artículos, formularios, carrito y checkout.
(Fuentes: `00-recoleccion/sitio-actual/comportamiento-e-infraestructura.md`;
`00-recoleccion/sitio-actual/mapa-sitio.md`.)

El sitemap observado contiene 175 registros y 174 URL únicas: 17 páginas,
cuatro artículos, 88 fichas de producto, 15 categorías de producto, 24
etiquetas de producto, archivos editoriales, un autor y diez registros
JetWooBuilder. Las 174 URL únicas fueron validadas; 164 registros responden 200
directamente, diez JetWooBuilder redirigen a Inicio y el checkout vacío
redirige a Carrito. Todos los destinos finales observados responden 200 HTML.
(Fuentes: `00-recoleccion/registro-fuentes.md`;
`00-recoleccion/sitio-actual/validacion-http.md`.)

Los comportamientos incluyen menú móvil, carruseles, acordeón corporativo,
catálogo paginado, filtros, mini-carrito, carrito, checkout como invitado,
formulario de contacto, inscripción mayorista, solicitud de catálogo con carga
de archivos, catálogos externos y WhatsApp. Hay 18 capturas de escritorio y
una auditoría estructural a 375 px de las 17 páginas, los cuatro artículos y
las plantillas representativas de producto, taxonomía, autor, JetWooBuilder y
404. En los estados iniciales inspeccionados no se detectó desbordamiento
horizontal. (Fuentes: `00-recoleccion/sitio-actual/capturas.md`;
`00-recoleccion/sitio-actual/auditoria-movil-estructural.md`;
`00-recoleccion/sitio-actual/comportamiento-e-infraestructura.md`.)

La infraestructura presenta incidencias de arquitectura, conversión,
contenido, accesibilidad y seguridad: recorridos B2C y B2B sin jerarquía clara,
ruta mayorista fragmentada, catálogo sin búsqueda ni ordenación, filtros que
desplazan los productos en móvil, fichas con información comercial limitada,
checkout extenso, errores tipográficos, estructura semántica incompleta,
privacidad enlazada a una página 404, parámetros publicitarios redistribuidos
por caché y una carga pública de archivos con límites amplios. Estas son
observaciones puntuales, no métricas continuas. (Fuentes:
`00-recoleccion/sitio-actual/incidencias-observadas.md`;
`00-recoleccion/sitio-actual/comportamiento-e-infraestructura.md`;
`00-recoleccion/sitio-actual/auditoria-movil-estructural.md`.)

## 3. Análisis FODA de infraestructura

| | Origen interno | Origen externo |
|---|---|---|
| **Favorable** | **Fortalezas.** Regalarte ya dispone de logotipo, fotografía, identidad tropical reconocible, catálogo amplio y una infraestructura de comercio con navegación, productos, carrito, checkout, formularios y canales de contacto. Son activos reutilizables que la réplica debe conservar. (Fuentes: `00-recoleccion/identidad/identidad-observable.md`; `00-recoleccion/contenido/perfil-y-contacto.md`; `00-recoleccion/sitio-actual/comportamiento-e-infraestructura.md`.) | **Oportunidades.** WhatsApp, Facebook, Instagram, catálogos externos y el interés en ventas mayoristas ofrecen canales ya disponibles para articular recorridos medibles y coherentes. No consta su rendimiento actual ni una auditoría comparativa de competidores, por lo que no se atribuyen ventajas competitivas no demostradas. (Fuentes: `00-recoleccion/contenido/perfil-y-contacto.md`; `00-recoleccion/referencias/referencias-del-prospecto.md`; `00-recoleccion/notas-comerciales.md`.) |
| **Desfavorable** | **Debilidades.** Los recorridos minorista y mayorista carecen de jerarquía inequívoca; la ruta B2B está fragmentada; el catálogo carece de búsqueda, ordenación y limpieza visible de filtros; en móvil los filtros desplazan productos y llamadas a la acción; las fichas y el checkout ofrecen información insuficiente o inconsistente; y existen defectos de texto, semántica, accesibilidad, privacidad y enlaces. (Fuentes: `00-recoleccion/sitio-actual/incidencias-observadas.md`; `00-recoleccion/sitio-actual/auditoria-movil-estructural.md`.) | **Amenazas.** La operación pública depende de WordPress, WooCommerce, Elementor, Crocoblock, SiteGround, Tilopay y servicios externos. Esto constituye un riesgo operativo inferido si un proveedor o integración cambia o falla; no consta un incidente confirmado por esa causa. La privacidad rota, la carga pública de archivos y la contaminación de enlaces mediante caché amplían la exposición potencial ante abuso externo, requisitos legales o pérdida de confianza. (Fuentes: `00-recoleccion/sitio-actual/comportamiento-e-infraestructura.md`; `00-recoleccion/sitio-actual/incidencias-observadas.md`.) |

## 4. El dolor

**“La web actual no representa la calidad de Regalarte y dificulta la compra
tanto al detalle como al por mayor.”** (Fuente:
`00-recoleccion/notas-comerciales.md`.)

La evidencia es la ausencia de una jerarquía clara entre B2C y B2B, la
dispersión del recorrido mayorista, la falta de búsqueda y ordenación en la
tienda, la colocación de filtros y llamadas a la acción fuera del primer
viewport móvil, la información incompleta en fichas y checkout, las
inconsistencias visuales y los errores visibles de contenido y funcionamiento.
(Fuentes: `00-recoleccion/sitio-actual/incidencias-observadas.md`;
`00-recoleccion/sitio-actual/auditoria-movil-estructural.md`;
`00-recoleccion/sitio-actual/mapa-sitio.md`.)

## 5. Hipótesis de solución

La primera entrega seguirá la Ruta B: una réplica fiel que conserve estructura,
textos, jerarquía y defectos observados para establecer una línea base
verificable. La réplica no probará todavía una mejora; permitirá demostrar que
la arquitectura y los recorridos actuales fueron comprendidos antes de
intervenirlos. (Fuentes: `00-recoleccion/sitio-actual/incidencias-observadas.md`;
`00-recoleccion/referencias/referencias-del-prospecto.md`.)

Después de aprobar esa réplica, el informe de mejoras podrá someter a prueba
estas hipótesis:

- Si Inicio y la navegación ofrecen accesos diferenciados y visibles para
  detalle y mayoreo, ambos públicos podrán identificar su recorrido desde el
  primer viewport y el menú principal. (Fuentes:
  `00-recoleccion/notas-comerciales.md`;
  `00-recoleccion/sitio-actual/incidencias-observadas.md`.)
- Si el catálogo a 375 px prioriza productos y llamadas a la acción, y permite
  buscar, ordenar, filtrar y limpiar filtros, podrá verificarse una reducción
  de los pasos necesarios para localizar un producto. (Fuentes:
  `00-recoleccion/sitio-actual/incidencias-observadas.md`;
  `00-recoleccion/sitio-actual/comportamiento-e-infraestructura.md`.)
- Si inscripción, catálogos, contacto y condiciones mayoristas forman un
  recorrido único, podrá verificarse que el comprador B2B lo completa sin
  saltos ambiguos entre páginas y servicios externos. (Fuentes:
  `00-recoleccion/sitio-actual/mapa-sitio.md`;
  `00-recoleccion/sitio-actual/incidencias-observadas.md`.)
- Si fichas y checkout muestran de forma consistente variantes,
  disponibilidad, entrega, devoluciones, cantidades y contexto del pago, podrá
  comprobarse que la información necesaria aparece antes de una acción
  comercial simulada. (Fuente:
  `00-recoleccion/sitio-actual/incidencias-observadas.md`.)
- Si se aplica una jerarquía visual coherente y se corrigen errores de
  contenido, semántica y accesibilidad, podrá verificarse la consistencia entre
  plantillas mediante revisión visual y pruebas de teclado, estructura y
  movimiento reducido. (Fuentes:
  `00-recoleccion/identidad/identidad-observable.md`;
  `00-recoleccion/sitio-actual/auditoria-movil-estructural.md`.)

## 6. Alcance propuesto del prototipo

La réplica abarcará la navegación global, encabezado, pie, canales de contacto
y los recorridos públicos documentados. Incluye Inicio; Nosotros y sus cuatro
paneles; La Sele; Blog y cuatro artículos; Contacto; Tienda y siete estados
paginados; 88 fichas mediante las plantillas simple, variable y “Leer más”;
archivos de categorías y etiquetas; mini-carrito; carrito; checkout vacío y
con productos; cuenta; solicitud de catálogo; inscripción y catálogos
mayoristas; catálogo de detalle; envío internacional; Exphore; oferta de
empleo; archivos editoriales; Sample Page; rutas JetWooBuilder redirigidas y
404. (Fuentes: `00-recoleccion/sitio-actual/mapa-sitio.md`;
`00-recoleccion/sitio-actual/validacion-http.md`;
`00-recoleccion/sitio-actual/capturas.md`.)

La réplica preservará apariencia, textos, jerarquía y defectos visibles hasta
su aprobación. Formularios, archivos, mensajes, pedidos, pagos, autenticación y
checkout se representarán mediante estados locales y no transmitirán
información al sitio actual ni a terceros. Las vulnerabilidades, el
seguimiento, identificadores personales y cargas inseguras no se reproducirán
como capacidades reales. (Fuentes:
`00-recoleccion/sitio-actual/incidencias-observadas.md`;
`00-recoleccion/sitio-actual/comportamiento-e-infraestructura.md`.)

El prototipo se compondrá primero a 375 px, se adaptará posteriormente y
contendrá exactamente F01, F02, F03, F04, F05, F22, F06, F09 y F10. F22 se
regirá por `CONTRATO-F22-PROPUESTO.md` si el equipo lo aprueba junto con este
informe. Todas las páginas declararán `noindex, nofollow` y el pie mostrará
exactamente `V1.0.0 Beta`. (Fuentes:
`00-recoleccion/notas-comerciales.md`;
`00-recoleccion/pendientes-fase-1.md`; normativa vinculante
`../ELYSIUM-PROTOTYPING.md`.)

Quedan deliberadamente fuera de la réplica el rediseño, las correcciones de
contenido y arquitectura, transacciones reales, el backoffice de WordPress o
WooCommerce, una cuenta autenticada funcional, CRM, PWA, múltiples idiomas,
múltiples divisas, Discovery Core, SEO, analítica y nuevas integraciones no
documentadas. F08 no se incorpora porque el protocolo específico exige
exactamente nueve funciones; esta interpretación deberá confirmarse al aprobar
el informe. (Fuentes: `00-recoleccion/notas-comerciales.md`;
`00-recoleccion/pendientes-fase-1.md`; `INCONSISTENCIAS-NORMATIVAS.md`.)

## 7. Plan recomendado

Se recomienda **Basic Maintenance** como encaje mínimo dentro de los cinco
planes del estándar. Regalarte necesita mantener una web pública de marca con
navegación móvil, tienda, contenidos y contacto; Hosting Maintenance solo
cubre dominio y servidor y no cubre el desarrollo web requerido. (Fuentes:
`00-recoleccion/sitio-actual/mapa-sitio.md`;
`00-recoleccion/sitio-actual/comportamiento-e-infraestructura.md`; normativa
`../../proyecto/ELYSIUM-STANDARDS.md`, §2.)

No consta una necesidad aprobada de tema dinámico, selector de tema, múltiples
idiomas, múltiples divisas, instalación como aplicación o CRM personalizado.
La evidencia no justifica Preferential Maintenance, Advanced Maintenance ni
Custom CRM. Esta recomendación comercial no modifica el conjunto específico
de funciones exigido por el protocolo para el prototipo. (Fuentes:
`00-recoleccion/notas-comerciales.md`;
`00-recoleccion/pendientes-fase-1.md`; normativa
`../../proyecto/ELYSIUM-STANDARDS.md`, §2.)
