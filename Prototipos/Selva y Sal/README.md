# Selva y Sal · Del volcán al mar

Sitio de comercio funcional y responsive construido con Next.js (vinext) y
desplegado sobre Cloudflare Workers.

## La marca es ficticia

**Selva y Sal no existe.** Es una casa de expediciones y recuerdos inventada por
Elysium λ para poder enseñar el prototipo lleno de contenido —catálogo, precios,
blog, formularios— sin usar los activos de ningún cliente. Nombre, textos,
teléfonos (patrón `555-01xx`), direcciones y perfiles sociales son invención, y
las imágenes no son fotografía: las dibuja `scripts/generate-assets.mjs` como
SVG. Si el sitio se le enseña a alguien, el aviso de bienvenida lo deja claro en
su segunda pantalla.

Para reetiquetar el prototipo con otra marca basta con `app/data/brand.ts`,
`app/data/content.ts` y `app/data/catalog.ts`: los componentes solo pintan datos.

## Características

- Portada narrativa «Del volcán al mar» con escena 3D procedural Arenal →
  bosque → Pacífico → costa.
- Calidad adaptativa, pausa fuera de pantalla y alternativa estática para
  movimiento reducido o ausencia de WebGL.
- Recorridos diferenciados para tienda, mayoreo y expediciones.
- Acceso privado: `noindex, nofollow` en todo el sitio.
- Los formularios, la cuenta, el carrito y el checkout son simulaciones locales
  seguras (no hay backend transaccional; nada se envía a terceros).

## Desarrollo local

Requiere Node.js 22.13 o posterior.

```bash
npm install
npm run dev
```

El servidor local queda disponible en `http://localhost:3000/`.

## Verificación

```bash
npm run build
node --test tests/rendered-html.test.mjs
npm run lint
```

Las pruebas validan el renderizado, rutas representativas, metadatos, el 404 y
—esto importa— que no quede rastro de ninguna marca de cliente en el HTML.

## Regenerar las imágenes

```bash
node scripts/generate-assets.mjs
```

Redibuja las 88 fichas del catálogo, las escenas, los archivos de marca y la
imagen social a partir de `app/data/catalog.ts`. Es determinista: el mismo slug
produce siempre el mismo dibujo.

## Estructura principal

- `app/data/brand.ts`: identidad, contacto y rutas de los activos de marca.
- `app/data/catalog.ts`: los 88 productos, expediciones incluidas.
- `app/data/content.ts`: textos, formularios y artículos de todas las páginas.
- `app/components/redesign/`: portada narrativa y módulos comerciales.
- `app/components/experience/`: motor 3D procedural y perfiles de calidad.
- `app/redesign.css`: sistema visual mobile-first y adaptaciones de escritorio.
- `public/js/`: funciones Elysium específicas del proyecto.
- `public/elysium-core/`: core canónico de solo lectura; ver
  `CORE-PROVENANCE.md`.
- `worker/index.ts`: entry point del Cloudflare Worker.
- `tests/rendered-html.test.mjs`: pruebas de integración del renderizado.

El inventario funcional se mantiene en F01, F02, F03, F04, F05, F22, F06, F09 y
F10. La experiencia 3D es progresiva y no modifica el flujo de compra ni las
restricciones transaccionales del sitio.
