/** Regalarte · configuración externa de los módulos Elysium aprobados. */
(function () {
  "use strict";

  window.ELYSIUM_PRELOADER = {
    brandName: "Regalarte",
    logoHTML: '<img src="/assets/uploads/2025/02/logo-horizontal.webp" alt="" width="190" height="54">',
    tagline: "Costa Rica, para llevar",
    taglineUpdate: "Actualizando…",
    accent: "#f4c94f",
    background: "#061b15",
    textColor: "#ffffff",
    minDuration: 1000,
    maxDuration: 8000
  };

  window.ELYSIUM_SYSTEM = {
    stage: "Beta",
    license: "PROTOTIPO ELYSIUM",
    brandName: "REGALARTE",
    brandSymbolHTML: '<img src="/assets/uploads/2025/02/logo-horizontal.webp" alt="Regalarte" style="width:130px; margin-bottom:8px;">',
    accent: "#f4c94f",
    theme: "dark",
    portalUrl: "https://regalarte.cr",
    supportEmail: "info@regalartecr.com",
    techEmail: "support@elysiumdr.eu",
    devName: "Elysium λ Development & Research",
    devUrl: "https://elysiumdr.eu",
    legal: { terms: "/sample-page/", privacy: "/privacidad/" },
    legalFramework: "Ley 8968 (CR)",
    securityInfra: "Prototipo privado · noindex",
    privacyDirective: "Sin analítica ni transacciones reales",
    iconEcosystem: "Símbolos nativos y CSS",
    healthEndpoint: "",
    firebaseConfigPath: "",
    locale: "es"
  };

  window.ELYSIUM_SETTINGS = {
    storageKey: "elysium:f22:settings:v1",
    accent: "#f4c94f",
    defaults: {
      text: "standard",
      motion: "system",
      contrast: "standard"
    }
  };
})();
