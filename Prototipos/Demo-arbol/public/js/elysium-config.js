/** Demo-arbol · configuración externa de los módulos Elysium. */
(function () {
  "use strict";

  // F01 · Loading Page. Cubre la carga de los assets 3D de la portada para que el
  // usuario nunca vea el canvas a medio pintar.
  // `logoHTML` vacío: la demo no lleva logotipo y el módulo se limita a pintar
  // el rótulo, que también sale vacío.
  window.ELYSIUM_PRELOADER = {
    brandName: "",
    logoHTML: "",
    tagline: "",
    taglineUpdate: "",
    accent: "#A75D39",
    background: "#1A1A1A",
    textColor: "#F5F5F5",
    minDuration: 1200,
    maxDuration: 8000
  };

  // F05 · Information System · F06 · System Update · F10 · Elysium Signature.
  // `stage: "Beta"` es obligatorio en fase de prototipo (§3.2.1); la etiqueta del
  // pie se muestra como «v1.0.0 beta» y no avanza por muchas revisiones internas.
  window.ELYSIUM_SYSTEM = {
    stage: "Beta",
    license: "PROTOTIPO ELYSIUM",
    brandName: "",
    brandSymbolHTML: "",
    accent: "#A75D39",
    theme: "dark",
    portalUrl: "",
    supportEmail: "",
    techEmail: "support@elysiumdr.eu",
    devName: "Elysium λ Development & Research",
    devUrl: "https://elysiumdr.eu",
    legal: { terms: "#contacto", privacy: "#contacto" },
    legalFramework: "",
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
