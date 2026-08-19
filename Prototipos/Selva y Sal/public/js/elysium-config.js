/** Selva y Sal · configuración externa de los módulos Elysium aprobados. */
(function () {
  "use strict";

  window.ELYSIUM_PRELOADER = {
    brandName: "Selva y Sal",
    logoHTML: '<img src="/assets/marca/selva-y-sal-claro.svg" alt="" width="190" height="49">',
    tagline: "Del volcán al mar",
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
    brandName: "SELVA Y SAL",
    brandSymbolHTML: '<img src="/assets/marca/selva-y-sal-claro.svg" alt="Selva y Sal" style="width:130px; margin-bottom:8px;">',
    accent: "#f4c94f",
    theme: "dark",
    portalUrl: "https://selvaysal.cr",
    supportEmail: "hola@selvaysal.cr",
    techEmail: "support@elysiumdr.eu",
    devName: "Elysium λ Development & Research",
    devUrl: "https://elysiumdr.eu",
    legal: { terms: "/terminos/", privacy: "/privacidad/" },
    legalFramework: "Ley 8968 (CR)",
    securityInfra: "Prototipo privado · noindex",
    privacyDirective: "Marca ficticia · sin analítica ni transacciones reales",
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
