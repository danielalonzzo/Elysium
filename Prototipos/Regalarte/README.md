# Regalarte · Costa Rica, para llevar

Sitio funcional y responsive de Regalarte, construido con Next.js (vinext) y
desplegado sobre Cloudflare Workers.

## Características

- Portada narrativa “Costa Rica, para llevar · Del volcán al mar”.
- Escena 3D procedural Arenal → bosque → Pacífico → Manuel Antonio.
- Calidad adaptativa, pausa fuera de pantalla y alternativa estática para
  movimiento reducido o ausencia de WebGL.
- Recorridos diferenciados para tienda, mayoreo y La Sele.
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

Las pruebas validan el renderizado, rutas representativas, metadatos, 404,
redirecciones heredadas y el contenido esencial del sitio.

## Estructura principal

- `app/components/redesign/`: portada narrativa y módulos comerciales.
- `app/components/experience/`: motor 3D procedural y perfiles de calidad.
- `app/data/catalog.ts`: los 88 productos del catálogo.
- `app/data/content.ts`: textos, formularios, artículos y activos documentados.
- `app/redesign.css`: sistema visual mobile-first y adaptaciones de escritorio.
- `public/js/`: funciones Elysium específicas del proyecto.
- `public/elysium-core/`: core canónico de solo lectura; ver
  `CORE-PROVENANCE.md`.
- `worker/index.ts`: entry point del Cloudflare Worker.
- `tests/rendered-html.test.mjs`: pruebas de integración del renderizado.

El inventario funcional se mantiene en F01, F02, F03, F04, F05, F22, F06, F09 y
F10. La experiencia 3D es progresiva y no modifica el flujo de compra ni las
restricciones transaccionales del sitio.
