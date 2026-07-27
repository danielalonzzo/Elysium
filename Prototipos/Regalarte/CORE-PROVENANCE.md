# Procedencia de Elysium Core

Los dos archivos de `public/elysium-core/` son copias de solo lectura del core
canónico de Elysium. Se mantienen como activos locales porque el sitio debe
servirlos directamente en el navegador; no se modificaron para Regalarte. Los
hashes SHA-256 de abajo permiten verificar su integridad frente al core.

Fecha de verificación: 22 de julio de 2026.

| Archivo | SHA-256 canónico y local |
|---|---|
| `elysium-preloader.js` | `69e9ea6412bea9c5c2089f288f6686abb8034230c0c49f5a108d154a25cc7dfe` |
| `elysium-system-info.js` | `e6deb6d89e7d85a3a86fd3288875e19fbc30a3653348ffbd7a0a7bcee2bea03d` |

La configuración y los módulos específicos del proyecto viven fuera del core,
en `public/js/` y `public/css/components/`.
