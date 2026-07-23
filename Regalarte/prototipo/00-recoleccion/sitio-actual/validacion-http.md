# Validación HTTP del sitemap completo

Fecha: 22 de julio de 2026.

Método: GET de solo lectura sobre los nueve submapas y todas sus entradas,
usando un agente de navegador estándar. No se enviaron formularios, compras ni
datos personales.

## Cobertura

- 175 registros del sitemap.
- 174 URL únicas: `/tienda/` aparece tanto en el sitemap de páginas como en el
  de productos.
- 164/175 objetivos responden `200` directamente.
- 10/175 consultas JetWooBuilder responden `301` hacia `/`.
- `/checkout/` responde `302` hacia `/carrito/` con la sesión vacía.
- Los 175 destinos finales responden `200 text/html`.

## Canonical e indexación

- Las 175 respuestas finales contienen exactamente un canonical.
- En 175/175, el canonical coincide con la URL efectiva.
- 172/175 declaran `index, follow`.
- `/my-account/`, `/checkout/` y `/carrito/` declaran `noindex, follow`.
- Ninguna respuesta HTML comprobada incluye `X-Robots-Tag`.

## Excepciones

- Los diez registros `?jet-woo-builder=...` están dentro del sitemap, pero
  redirigen a la portada.
- `/sample-page/` responde 200, es autocanónica y se declara indexable.
- `/tienda/` está duplicada entre dos submapas.
- Checkout vacío no permite observar la vista de pago: redirige a Carrito. La
  vista con productos queda documentada por la captura aportada.
- Un agente descriptivo de auditoría recibió 403 en todo el sitio; un agente
  Chrome estándar obtuvo los resultados anteriores. La validación representa
  la experiencia de navegador y no garantiza una respuesta idéntica para todo
  crawler.

## Cierre de cobertura

La cobertura estructural/HTTP alcanza las 174 URL únicas. La cobertura visual
se organiza por plantilla: las 17 páginas y cuatro artículos fueron
inspeccionados a 375 px, al igual que producto simple, producto variable,
categoría, etiqueta, autor, JetWooBuilder y 404. Las 18 capturas aportadas
cubren las vistas principales de escritorio y estados comerciales. Los estados
dependientes de sesión se documentan con las capturas disponibles y se
simularán de forma segura en la réplica.
