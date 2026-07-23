# Incidencias observadas que la réplica debe conservar

Este archivo no autoriza correcciones. En la Ruta B de Elysium, la primera
entrega debe preservar estructura, textos, jerarquía y defectos actuales. Las
mejoras solo se propondrán después de aprobar la réplica.

## Críticas o de riesgo

- Caché pública observada redistribuyendo `fbclid` y parámetros UTM en La Sele
  y enlaces de compra.
- Política de privacidad enlazada desde checkout a `/?page_id=3`, con respuesta
  404.
- `/solicitud-catalogo/` público e indexable, con carga de archivos de hasta
  256 MB y tipos amplios.
- `/sample-page/` y plantillas JetWooBuilder presentes en el sitemap.
- Promoción fechada de La Sele con contador en cero.
- Seis tarjetas de categorías de Inicio parecen accionables pero no enlazan.
- Icono de correo del pie con `mailto:inforegalartecr.com`, sin `@`.

## Arquitectura y conversión

- B2C y B2B conviven sin una jerarquía clara.
- Checkout ocupa el menú principal mientras Mayoreo queda disperso.
- La ruta mayorista se divide entre páginas, formularios y catálogos externos.
- Tienda sin búsqueda, ordenación, precio, disponibilidad, contador ni acción
  visible para limpiar filtros.
- En móvil, los filtros desplazan productos y CTA por debajo del primer
  viewport.
- Fichas sin stock, entrega, devoluciones, tallas, reseñas, relacionados ni
  breadcrumb visible.
- Checkout con once campos obligatorios, textos parcialmente en inglés y poca
  explicación de Tilopay.
- Teléfonos `8520-9833` y `2253-5340` sin función diferenciada.

## Diseño, contenido y accesibilidad

- Uso repetido de follaje, transparencias y verdes próximos reduce jerarquía.
- Fondo rojo de La Sele compite con productos rojos.
- Escalas y encuadres de producto inconsistentes.
- Superficies vacías extensas en Blog, Contacto, Nosotros y carrito vacío.
- Errores visibles: “Eviar”, “%100”, “Tucánes”, “Jacket”, `SKU: N/D` y
  `©2025`.
- Falta de `h1` y de landmark `main` en plantillas auditadas.
- Enlace “Ir al contenido” apunta a un destino inexistente.
- Imágenes con texto alternativo vacío.
- Carruseles sin pausa y con clones expuestos al árbol accesible.

## Restricción de seguridad de la réplica

Los defectos se reproducirán como apariencia o estados locales, pero no se
replicarán vulnerabilidades, seguimiento, identificadores personales, cargas
inseguras ni transacciones reales.
