# Mapa del sitio actual

Fuente primaria: `https://regalarte.cr/sitemap_index.xml`, consultado el 22 de
julio de 2026. El mapa registra lo publicado; la validación de las 174 URL
únicas se encuentra en `validacion-http.md` y la inspección móvil por página y
plantilla en `auditoria-movil-estructural.md`.

## Navegación principal observada

- Inicio.
- Nosotros.
- Tienda.
- La Sele.
- Blog.
- Checkout.
- Contacto.
- Carrito / mini-carrito.

## Páginas del sitemap (17)

1. `/`
2. `/sample-page/`
3. `/my-account/`
4. `/checkout/`
5. `/tienda/`
6. `/carrito/`
7. `/solicitud-catalogo/`
8. `/blog/`
9. `/exphore/`
10. `/inscripcion-mayoreo/`
11. `/nosotros/`
12. `/oferta-de-empleo/`
13. `/la-sele/`
14. `/contacto/`
15. `/catalogos-mayoreo/`
16. `/catalogos-detalle/`
17. `/envio-internacional/`

## Artículos (4)

- `/perezosos-de-costa-rica/`
- `/guacamaya-escarlata/`
- `/tucanes-de-costa-rica/`
- `/souvenirs-de-costa-rica/`

## Comercio

- Archivo `/tienda/` con siete estados paginados observados.
- 88 fichas `/product/{slug}/`.
- 15 archivos `/product-category/{slug}/`.
- 24 archivos `/product-tag/{slug}/`.
- Productos simples, variables y fichas cuyo CTA muestra “Leer más”.
- Mini-carrito lateral, carrito, checkout vacío y checkout con productos.
- Cuenta de cliente publicada en `/my-account/`.

Categorías públicas:

`cuellera`, `esponja-bano`, `figuras-ceramica`, `gorras`, `jacket`, `jarras`,
`la-sele`, `magnetico`, `navidad`, `peluches`, `perezosos`, `pulsera-slap`,
`reversible`, `textiles` y `titere`.

## Contenido y archivos

- Una categoría de blog: `/category/educacion/`.
- Catorce etiquetas de blog.
- Archivo de autor público:
  `/author/juanwebdevepgmail-com/`.

## Plantillas JetWooBuilder publicadas (10)

- `/?jet-woo-builder=up-sales-template`
- `/?jet-woo-builder=carrito-vacio`
- `/?jet-woo-builder=agradecimiento`
- `/?jet-woo-builder=top-checkout`
- `/?jet-woo-builder=carrito`
- `/?jet-woo-builder=producto`
- `/?jet-woo-builder=producto-fcrf`
- `/?jet-woo-builder=tienda`
- `/?jet-woo-builder=check-out`
- `/?jet-woo-builder=grid`

## Estados no enumerados por el sitemap

- Búsqueda y resultados vacíos.
- Página 404.
- Estados de validación y éxito de formularios.
- Pedido recibido.
- Variantes agotadas o no disponibles.
- Resultados de filtros individuales y combinados.
- Checkout con otros contenidos de carrito.

Los estados dependientes de sesión que no pueden alcanzarse de forma anónima se
documentan con las capturas aportadas y se recrearán mediante simulaciones
locales. No se ejecutarán transacciones reales para obtenerlos.
