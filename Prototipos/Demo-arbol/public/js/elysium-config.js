/** Demo-arbol · configuración externa de los módulos Elysium. */
(function () {
  "use strict";

  /*
   * Emblema de «Raíz y Piedra»: la copa del guanacaste dentro del círculo de la
   * esfera. Va como SVG en línea, no como `<img src="/images/…">`, porque lo
   * pinta el preloader: un recurso externo aquí es una petición más justo en el
   * instante que el módulo existe para cubrir.
   */
  var EMBLEM =
    '<svg viewBox="0 0 64 64" width="72" height="72" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="23" fill="none" stroke="#A75D39" stroke-width="3"/>' +
    '<g fill="#D4805A" transform="translate(32 36) scale(0.058) translate(-300 -182)">' +
    '<path d="M264 196 H336 L348 302 H252 Z M252 302 C228 312 208 324 194 342 H406 C392 324 372 312 348 302 Z"/>' +
    '<ellipse cx="300" cy="96" rx="148" ry="62"/><ellipse cx="176" cy="122" rx="132" ry="58"/>' +
    '<ellipse cx="424" cy="122" rx="132" ry="58"/><ellipse cx="240" cy="158" rx="128" ry="56"/>' +
    '<ellipse cx="360" cy="158" rx="128" ry="56"/><ellipse cx="92" cy="162" rx="100" ry="48"/>' +
    '<ellipse cx="508" cy="162" rx="100" ry="48"/><ellipse cx="300" cy="182" rx="168" ry="52"/>' +
    "</g></svg>";

  // F01 · Loading Page. Cubre la carga de los assets 3D de la portada para que el
  // usuario nunca vea el canvas a medio pintar.
  window.ELYSIUM_PRELOADER = {
    brandName: "Raíz y Piedra",
    logoHTML: EMBLEM,
    tagline: "Juegos y objetos de la memoria costarricense",
    taglineUpdate: "Actualizando la colección…",
    accent: "#A75D39",
    background: "#1A1A1A",
    textColor: "#F5F5F5",
    minDuration: 1200,
    maxDuration: 8000
  };

  // F05 · Information System · F06 · System Update · F10 · Elysium Signature.
  // `stage: "Beta"` es obligatorio en fase de prototipo (§3.2.1); la etiqueta del
  // pie se muestra como «v1.0.0 beta» y no avanza por muchas revisiones internas.
  //
  // `portalUrl` y `supportEmail` apuntan al dominio ficticio de la marca, que no
  // resuelve: ver la cabecera de `app/data/content.ts`.
  window.ELYSIUM_SYSTEM = {
    stage: "Beta",
    license: "PROTOTIPO ELYSIUM",
    brandName: "Raíz y Piedra",
    brandSymbolHTML: EMBLEM,
    accent: "#A75D39",
    theme: "dark",
    portalUrl: "https://raizypiedra.cr",
    supportEmail: "hola@raizypiedra.cr",
    techEmail: "support@elysiumdr.eu",
    devName: "Elysium λ Development & Research",
    devUrl: "https://elysiumdr.eu",
    legal: { terms: "#contacto", privacy: "#contacto" },
    legalFramework: "RGPD (UE) · Ley 8968 (CR)",
    securityInfra: "Prototipo privado · noindex",
    privacyDirective: "Sin analítica ni transacciones reales",
    iconEcosystem: "Símbolos nativos y CSS",
    healthEndpoint: "",
    firebaseConfigPath: "",
    locale: "es"
  };

  // F22 · System Settings (tamaño de texto, movimiento, contraste).
  window.ELYSIUM_SETTINGS = {
    storageKey: "elysium:f22:settings:v1",
    accent: "#A75D39",
    defaults: {
      text: "standard",
      motion: "system",
      contrast: "standard"
    }
  };
})();
