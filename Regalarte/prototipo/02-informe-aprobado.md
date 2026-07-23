# Informe aprobado · Regalarte

Estado: **APROBADO · COMPUERTA 1 SUPERADA**  
Tipo de proyecto: **REDISEÑO · Ruta B**  
Fecha de aprobación: **22 de julio de 2026**  
Aprobación del equipo: **“aprobado. sigue con de desarrollo de la pagina de prototipo”**

Este documento es la única especificación autorizada para generar la réplica
fiel. Sustituye al borrador `01-informe-preliminar.md` sin borrarlo.

## 1. Retrato de la empresa

Regalarte es una empresa costarricense con más de veinte años de experiencia
declarada en la comercialización minorista y mayorista de souvenirs vinculados
a la cultura y la biodiversidad de Costa Rica. Su oferta incluye peluches y
recuerdos de fauna, textiles, gorras, cerámica, magnéticos, pulseras, títeres,
artículos navideños y productos oficiales de La Sele. Atiende al consumidor
final y a comercios que compran al por mayor; ambos públicos forman parte del
alcance sin prioridad declarada entre ellos.

La empresa declara cobertura nacional, Patrocinio Bronce de Rescate Wildlife
Rescue Center y un compromiso con educación ambiental y conservación. Su
lenguaje visual usa fauna local, follaje tropical, verdes profundos,
fotografía de producto y una subidentidad azul/roja para La Sele.

El nombre comercial es Regalarte. “Regalarte de las Américas” es una
denominación pública; la razón social legal no consta de forma inequívoca. La
zona de servicio declarada es Costa Rica.

Contactos autorizados para la réplica:

- Correo: `info@regalartecr.com`.
- WhatsApp: `+506 8520-9833` mediante `https://wa.link/elptvj`.
- Teléfono publicado: `+506 2253-5340`.
- Facebook: `https://www.facebook.com/regalarte2014`.
- Instagram: `https://www.instagram.com/regalarte.sa/`.
- Dirección publicada: Barrio los Yoses Sur, 375mts Sur de Ambacar, San Pedro,
  San Jose, Costa Rica.

## 2. Estado digital actual

El sitio actual funciona sobre WordPress, WooCommerce, Elementor/Pro y
Crocoblock, con SiteGround, Tilopay, Yoast SEO y otros plugins. Ofrece páginas
corporativas, catálogo, 88 productos, filtros, artículos, formularios,
mini-carrito, carrito y checkout.

El sitemap contiene 175 registros y 174 URL únicas. Incluye 17 páginas, cuatro
artículos, 88 productos, 15 categorías de producto, 24 etiquetas de producto,
archivos editoriales, un autor y diez registros JetWooBuilder. Las URL únicas
fueron validadas. Diez rutas JetWooBuilder redirigen a Inicio y checkout vacío
redirige a Carrito.

Se dispone de 18 capturas de escritorio y una auditoría estructural a 375 px
de todas las páginas y plantillas representativas. No se detectó desbordamiento
horizontal en sus estados iniciales.

Incidencias que la réplica debe conservar como apariencia o comportamiento
local:

- recorridos B2C y B2B sin jerarquía clara;
- Checkout en la navegación y Mayoreo fragmentado;
- Tienda sin búsqueda ni ordenación;
- filtros extensos antes de productos en móvil;
- información comercial limitada en fichas;
- checkout extenso y parcialmente en inglés;
- promoción vencida de La Sele;
- tarjetas de Inicio con apariencia accionable pero sin enlace;
- errores “Eviar”, “%100”, “Tucánes”, “Jacket”, `SKU: N/D` y `©2025`;
- `mailto:inforegalartecr.com` sin arroba en el icono del pie;
- privacidad enlazada a `/?page_id=3`, que muestra 404;
- Sample Page y archivos/plantillas residuales publicados;
- carencias de H1, landmarks, alternativas textuales y controles de carrusel.

No se reproducirán vulnerabilidades, tracking, contaminación UTM/fbclid,
cargas inseguras, transacciones reales ni exposición adicional de datos.

## 3. Análisis FODA de infraestructura

| | Origen interno | Origen externo |
|---|---|---|
| **Favorable** | **Fortalezas.** Logotipo, fotografía, identidad tropical, catálogo amplio, comercio, formularios y canales de contacto ya existen y deben preservarse. | **Oportunidades.** WhatsApp, redes y catálogos mayoristas ya están disponibles para articular recorridos coherentes. Su rendimiento actual no consta y no se atribuyen ventajas competitivas no demostradas. |
| **Desfavorable** | **Debilidades.** Arquitectura B2C/B2B ambigua, catálogo con herramientas limitadas, fricción móvil, fichas y checkout incompletos, errores de contenido, semántica, accesibilidad, privacidad y enlaces. | **Amenazas.** Dependencia de múltiples plugins y terceros; exposición potencial por privacidad rota, carga pública de archivos y enlaces contaminados por caché. No consta un incidente operativo confirmado atribuible a un proveedor. |

## 4. El dolor

**“La web actual no representa la calidad de Regalarte y dificulta la compra
tanto al detalle como al por mayor.”**

La evidencia es la jerarquía ambigua entre B2C y B2B, el recorrido mayorista
disperso, las limitaciones del catálogo, los filtros móviles, la información
incompleta en producto y checkout, las inconsistencias visuales y los errores
de contenido y funcionamiento.

## 5. Hipótesis de solución

La primera entrega es una réplica fiel. Su objetivo es establecer una línea
base verificable y demostrar que la arquitectura, los textos, la jerarquía y
los recorridos actuales fueron comprendidos antes de intervenirlos.

Solo después de aprobar la réplica se redactará `03-informe-mejoras.md` para
evaluar estas hipótesis:

- accesos diferenciados a compra al detalle y mayoreo;
- catálogo móvil con productos y CTA priorizados, búsqueda, ordenación y
  filtros manejables;
- recorrido mayorista unificado;
- fichas y checkout con información comercial consistente;
- jerarquía visual, semántica y accesibilidad coherentes.

Ninguna de estas mejoras se implementa en la réplica.

## 6. Alcance aprobado de la réplica

### Rutas y estados

La réplica incluye:

- Inicio.
- Nosotros con Nosotros, Misión, Visión, Valores y Compromiso Ambiental.
- Tienda con siete estados paginados, 15 categorías y los tres tipos de CTA.
- Las 88 fichas públicas mediante plantillas simple, variable y “Leer más”.
- Categorías y etiquetas comerciales.
- La Sele con banner, productos, promoción vencida y contador en cero.
- Blog, cuatro artículos, categoría, etiquetas y autor.
- Contacto.
- Mini-carrito, Carrito vacío/con productos y Checkout vacío/con productos.
- My Account como estado local.
- Solicitud de catálogo, inscripción mayorista, catálogos de mayoreo y detalle.
- Exphore, oferta de empleo y envío internacional.
- Sample Page, 404 y redirecciones JetWooBuilder documentadas.

La fuente autorizada de estructura, textos, productos e imágenes es el sitio
público `https://regalarte.cr/`, sus sitemaps y las capturas aportadas. El
equipo autorizó reutilizar esos activos en la réplica.

### Comportamiento seguro

- Formularios: estados locales; no envían datos.
- Catálogos externos: enlaces visibles, sin automatización.
- Carrito: persistencia local de demostración.
- Checkout: simulación; no conecta con Tilopay ni procesa pedidos.
- Cuenta: interfaz simulada; no autentica.
- Carga de archivos: apariencia y validación local; no sube archivos.
- WhatsApp, correo y redes: canales reales en F09; durante QA no se activarán
  acciones que transmitan datos sin intervención del usuario.

### Identidad y configuración

- Nombre: Regalarte.
- Idioma: español.
- Divisa mostrada en contenidos existentes: colón costarricense.
- Acento principal observable: `#538D22`.
- Verde profundo observable: `#245501`.
- Fondos crema observables: `#F5ECD0` y `#F8F2DD`.
- Rojo La Sele observable: `#D83D40` / `#E52529`.
- Tipografías observables: Mulish, Roboto y Roboto Slab.
- Logotipo público autorizado:
  `https://regalarte.cr/wp-content/uploads/2025/02/logo-horizontal.webp`.

Los valores observables se usan para reproducir el sitio; no se declaran como
manual oficial de marca.

### Requisitos Elysium no negociables

- Primera composición y validación a 375 px; adaptación posterior a tablet y
  escritorio, con comparación contra las capturas aportadas de 1920 px.
- La entrega debe ser completa tanto en móvil como en escritorio. Ninguna
  decisión de escritorio puede degradar navegación, filtros, productos,
  carrito, formularios o checkout en móvil.
- Exactamente nueve funciones: F01, F02, F03, F04, F05, F22, F06, F09 y F10.
- `noindex, nofollow` en todas las páginas y rutas del prototipo.
- Pie con versión exacta `V1.0.0 Beta` y `stage: 'Beta'`.
- Nada de CRM, PWA, multi-idioma, selector de divisas, Discovery Core, SEO,
  analítica, F08, F11, F12 ni otras funciones.
- `elysium-core/` es de solo lectura. F01 y F05/F06 usarán el core canónico.
- F02, F03, F04, F09 y F10 seguirán las implementaciones canónicas del
  estándar.
- F22 se implementará como módulo de proyecto según el anexo de este documento.
- JavaScript externo compatible con CSP; no `unsafe-inline`.
- Todas las interacciones por teclado, foco visible y movimiento reducido.

### Exclusiones

Quedan fuera: rediseño, correcciones editoriales, cambios de arquitectura,
transacciones reales, backoffice, autenticación real, CRM, PWA, múltiples
idiomas/divisas, Discovery, SEO, analítica e integraciones nuevas.

## 7. Plan recomendado

Se aprueba **Basic Maintenance** como encaje mínimo. Regalarte necesita una web
pública de marca con navegación móvil, tienda, contenidos y contacto; Hosting
Maintenance no cubre el desarrollo web. No consta necesidad aprobada de tema
dinámico, selector de tema, múltiples idiomas, múltiples divisas, PWA o CRM,
por lo que no se recomiendan Preferential, Advanced ni Custom CRM.

Esta recomendación comercial no amplía el inventario exacto de nueve funciones
del prototipo.

## Anexo A · Contrato aprobado de F22 System Settings

F22 es un panel accesible de preferencias de lectura que adapta localmente la
presentación sin cambiar contenidos, precios, idioma, datos comerciales ni
lógica de negocio. Su estado inicial debe ser visualmente idéntico a la
réplica.

Controles:

1. Tamaño de texto: Estándar 100 % o Ampliado 112,5 %.
2. Movimiento: Seguir el sistema o Reducir movimiento. La reducción desactiva
   el desplazamiento suave de F04 y revela inmediatamente F03;
   `prefers-reduced-motion: reduce` siempre prevalece.
3. Contraste: Estándar o Reforzado, sin convertirse en tema claro/oscuro.
4. Restablecer: elimina únicamente el estado de F22.

Interfaz:

- botón “Ajustes” en el pie, próximo a F05 pero independiente;
- diálogo “Ajustes del sistema” con aplicación inmediata;
- cierre por botón, `Escape` o fondo, con restauración de foco;
- `role="dialog"`, `aria-modal="true"`, título asociado y trampa de foco;
- objetivos de 44 × 44 px y panel de ancho completo a 375 px.

Persistencia:

- clave `elysium:f22:settings:v1` en `localStorage`;
- valores `text`, `motion` y `contrast` con esquema 1;
- fallback seguro en memoria si el almacenamiento falla;
- sin cookies, red, analítica ni servidor;
- F06 elimina la clave durante su limpieza global.

Integración:

- atributos `data-elysium-text`, `data-elysium-motion` y
  `data-elysium-contrast` en `<html>`;
- evento `elysium:settings:changed`;
- API `ElysiumSettings.show()`, `.close()`, `.get()`, `.set()` y `.reset()`;
- módulo `js/features/f22-system-settings.js` y estilo
  `css/components/f22-system-settings.css`;
- prefijos `ely-settings-`; no modificar ni inyectar en `elysium-core/`.

F22 excluye sonido/volumen, tema automático, selector claro/oscuro, idioma,
divisa, región, PWA, cookies/consentimiento, analítica y sincronización remota.

Criterios de aceptación:

- ajustes inmediatos y persistentes;
- texto ampliado sin solapamientos a 375 px;
- contraste reforzado al menos WCAG 2.1 AA;
- teclado, foco y restauración de foco correctos;
- fallo de almacenamiento no rompe la interfaz;
- F06 limpia F22;
- ninguna solicitud de red desde F22;
- `elysium-core/` permanece sin modificaciones;
- inventario funcional continúa siendo exactamente las nueve funciones
  aprobadas.
