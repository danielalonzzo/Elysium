/**
 * Selva y Sal — marca ficticia de demostración.
 *
 * Este prototipo no representa a ninguna empresa real. Nombre, textos,
 * catálogo, precios, teléfonos, direcciones y perfiles sociales son
 * invenciones creadas por Elysium λ para enseñar la arquitectura del sitio
 * sin usar los activos de ningún cliente. Los teléfonos siguen el patrón
 * 555-01xx, reservado por convención para material de ficción.
 *
 * Punto único de verdad: cabecera, pie, dock, contacto y metadatos leen de
 * aquí. Si cambia un dato de marca, cambia en un solo sitio.
 */

export const brand = {
  name: "Selva y Sal",
  legalName: "Selva y Sal Expediciones S.A.",
  shortName: "Selva y Sal",
  tagline: "Vive la aventura, llévate el recuerdo.",
  taglineEn: "Live the adventure, take the memory home.",
  narrative: "Del volcán al mar",
  narrativeEn: "From the volcano to the sea",
  foundedYear: 2009,
  /** Año de referencia del copyright y de los cálculos de trayectoria. */
  currentYear: 2026,
  siteUrl: "https://selvaysal.cr",
  fictionNotice:
    "Selva y Sal es una marca ficticia creada para esta demostración. No corresponde a ninguna empresa real.",
} as const;

export const contact = {
  email: "hola@selvaysal.cr",
  emailHref: "mailto:hola@selvaysal.cr",
  wholesaleEmail: "mayoreo@selvaysal.cr",
  wholesaleEmailHref: "mailto:mayoreo@selvaysal.cr",
  jobsEmail: "equipo@selvaysal.cr",
  phone: "+506 8555-0147",
  phoneHref: "tel:+50685550147",
  whatsapp: "https://wa.me/50685550147",
  wholesalePhone: "+506 2555-0110",
  wholesalePhoneHref: "tel:+50625550110",
  wholesaleWhatsapp: "https://wa.me/50625550110",
  address:
    "Calle del Bosque, 400 m norte del parque de La Fortuna, San Carlos, Alajuela, Costa Rica",
  addressShort: "La Fortuna, San Carlos, Alajuela",
  /** Base de operaciones: La Fortuna, al pie del Arenal. */
  latitude: 10.4678,
  longitude: -84.6427,
  instagram: "https://www.instagram.com/selvaysal.cr/",
  facebook: "https://www.facebook.com/selvaysal.cr/",
} as const;

/** Rutas de los activos de marca. Ilustraciones propias, sin fotografía. */
export const brandAssets = {
  logo: "/assets/marca/selva-y-sal.svg",
  logoLight: "/assets/marca/selva-y-sal-claro.svg",
  isotype: "/assets/marca/isotipo.svg",
  favicon: "/assets/marca/isotipo.svg",
  leafBackground: "/assets/escena/textura-selva.svg",
  social: "/og.jpg",
} as const;
