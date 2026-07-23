# Comportamiento e infraestructura observable

## Comportamiento

- Navegación principal y menú móvil.
- Carruseles automáticos en Inicio y La Sele.
- Acordeón en Nosotros con cuatro paneles.
- Catálogo WooCommerce paginado.
- Quince filtros de categoría visibles.
- Productos simples con cantidad y “Añadir al carrito”.
- Productos variables con “Seleccionar opciones”.
- Productos con “Leer más”.
- Mini-carrito lateral.
- Carrito y checkout como invitado.
- Formulario de contacto.
- Formulario de inscripción mayorista.
- Solicitud de catálogo con carga de archivos.
- Enlaces a catálogos externos y canales sociales.
- WhatsApp mediante `wa.link`.

Para la réplica, pagos, mensajes, pedidos y cargas serán simulados localmente.
No se enviarán datos ni se escribirá en el WordPress actual.

## Infraestructura

- WordPress/PHP renderizado en servidor.
- WooCommerce.
- Hello Elementor, Elementor y Elementor Pro.
- Crocoblock: JetEngine, JetWooBuilder, JetSmartFilters, JetElements y
  JetTricks.
- MonsterInsights.
- Tilopay.
- Flexible Checkout Fields.
- jQuery.
- SiteGround Optimizer y CDN/caché de SiteGround.
- HTTPS y HTTP/2 observados.
- Sitemap generado por Yoast SEO.

## Robots observado

`robots.txt` bloquea rutas de logs y uploads de WooCommerce, parámetros de
`add-to-cart` y `/wp-admin/`, pero después abre un segundo bloque `User-agent:
*` con `Disallow:` vacío. También declara el sitemap de Yoast.

## Métricas de auditoría previa

La auditoría incluida en `../../../regalarte-info.pdf` registró en Tienda,
aproximadamente, 367 KB de HTML, 862 elementos DOM, 41 hojas CSS y un bundle
principal cercano a 351 KB gzip, con TTFB observado de 0,70–0,77 s incluso con
caché HIT. Estas son observaciones puntuales, no una medición continua.
