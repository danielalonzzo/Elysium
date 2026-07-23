# Auditoría móvil estructural

Fecha: 22 de julio de 2026.

Método: inspección en navegador a **375 × 812 px**, sin enviar formularios,
crear cuentas ni completar compras. Se revisaron las 17 páginas del sitemap,
los cuatro artículos y las plantillas representativas de producto simple,
producto variable, categoría, etiqueta, autor, JetWooBuilder y error 404.

## Resultado general

- Todas las rutas inspeccionadas mantuvieron `scrollWidth: 375` con
  `clientWidth: 375`; no se detectó desbordamiento horizontal en el estado
  inicial.
- Inicio, Nosotros, Tienda, La Sele, Blog, Contacto, mayoreo, empleo, catálogos
  y artículos cargaron en el viewport móvil.
- Checkout vacío redirigió a `/carrito/`.
- Carrito, checkout redirigido y My Account declaran `noindex, follow`.
- `/?page_id=3` muestra “Page not found” y declara `noindex, follow`.
- `/solicitud-catalogo/` mantiene un campo de archivo y declara `index, follow`.
- La plantilla JetWooBuilder `?jet-woo-builder=producto` redirigió a Inicio.

## Cobertura por página principal

| Ruta | URL final / título | H1 | `main` | Formularios | Imágenes con `alt=""` |
|---|---|---:|---:|---:|---:|
| `/` | Inicio | 0 | 0 | 0 | 11/11 |
| `/nosotros/` | Nosotros | 0 | 1 | 0 | 6/6 |
| `/tienda/` | Tienda | 0 | 0 | 12 | 14/19 |
| `/la-sele/` | La Sele | 0 | 1 | 0 | 12/14 |
| `/blog/` | Blog | 0 | 1 | 0 | 7/7 |
| `/contacto/` | Contacto | 0 | 1 | 1 | 3/4 |
| `/carrito/` | Carrito | 0 | 0 | 0 | 3/3 |
| `/checkout/` vacío | redirige a Carrito | 0 | 0 | 0 | 3/3 |
| `/my-account/` | My account | 1 | 1 | 1 | 3/3 |
| `/solicitud-catalogo/` | Solicitud catálogo | 0 | 0 | 1 | 0/0 |
| `/inscripcion-mayoreo/` | inscripción mayoreo | 0 | 1 | 1 | 3/4 |
| `/catalogos-mayoreo/` | Catálogos Mayoreo | 0 | 1 | 1 | 5/5 |
| `/exphore/` | Exphore | 0 | 1 | 1 | 3/3 |
| `/oferta-de-empleo/` | Oferta de Empleo | 0 | 1 | 1 | 3/4 |
| `/catalogos-detalle/` | Catálogos Detalle | 0 | 0 | 1 | 4/5 |
| `/envio-internacional/` | Envió internacional | 0 | 1 | 1 | 3/3 |
| `/sample-page/` | Sample Page | 1 | 1 | 0 | 3/3 |

## Artículos

Los cuatro artículos tienen un H1 pero no un landmark `main`. En los estados
inspeccionados presentaron respectivamente 11/22, 11/23, 15/26 y 41/50
imágenes con `alt=""`.

## Plantillas comerciales representativas

| Tipo | Ruta inspeccionada | H1 | `main` | Observación |
|---|---|---:|---:|---|
| Producto simple | `/product/peluche-mono-peq/` | 0 | 0 | 4/5 imágenes con `alt=""` |
| Producto variable | `/product/camiseta-la-sele-blanca/` | 0 | 0 | Formulario de variantes |
| Categoría | `/product-category/perezosos/` | 0 | 0 | 12 formularios de producto |
| Etiqueta | `/product-tag/peluche/` | 0 | 0 | 4 formularios de producto |
| Autor | `/author/juanwebdevepgmail-com/` | 1 | 1 | El título expone un correo derivado |
| Privacidad rota | `/?page_id=3` | 1 | 1 | Página 404 |

Esta auditoría complementa las 18 capturas de escritorio aportadas. No
sustituye la revisión de la futura réplica en un teléfono real exigida por la
Compuerta 2.
