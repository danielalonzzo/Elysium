/**
 * Fuente única de contenido del sitio: contactos reales del informe aprobado
 * (§6.2), precios (§6) y textos de secciones. Cambiar aquí propaga a cabecera,
 * pie, Magic Bottom y todas las secciones.
 *
 * Datos marcados con `PENDIENTE` en el informe (catálogo de merch más allá de la
 * camiseta, arte de las cartas) NO deben quedar visibles en pantalla como
 * `[PENDIENTE]` (Compuerta 3): se redactan con lo que sí consta.
 */

export const CONTACT = {
  whatsapp: "https://api.whatsapp.com/message/BTRBLFBKQHBRI1",
  email: "historiadecostarica2021@gmail.com",
  instagram: "https://www.instagram.com/historiadecostarica/",
  youtube: "https://www.youtube.com/@historiadecostarica",
  spotify: "https://open.spotify.com/show/05hbZPyY9UKe6JemLiUutL",
} as const;

export const BRAND = {
  name: "Historia de Costa Rica",
  city: "San José, Costa Rica",
  foundedNote: "Un proyecto de divulgación cultural nacido en 2019.",
} as const;

/** Precios en colones (₡). El multi-divisa (F16) queda fuera del prototipo. */
export const PRICES = {
  game: "₡15 000",
  tee: "₡12 000",
  membership: "desde ₡600 / mes",
} as const;

/** Mensaje pre-cargado para el enlace de WhatsApp (Magic Bottom, F09). */
export const WHATSAPP_LABEL = "Escribir por WhatsApp";

export type Shot = { src: string; alt: string; w: number; h: number };

/*
 * Fotografía real de producto entregada por el cliente (`public/images/`).
 *
 * `w` y `h` son las dimensiones REALES en píxeles de cada archivo: `next/image`
 * las usa para reservar el hueco (sin salto de maquetación) y para calcular las
 * variantes que sirve, así que deben rehacerse si se sustituye una foto.
 *
 * El orden de `merch` alterna prenda, gorra y bolso a propósito: es el carrusel
 * del panel de Merch y así ninguna categoría domina la rotación.
 */
export const SHOTS = {
  game: [
    { src: "/images/caja-cartas-frente.png", alt: "Caja del juego Historia de Costa Rica, con forma de libro, vista de frente", w: 1235, h: 1139 },
    { src: "/images/cartas-reverso.png", alt: "Tres cartas ilustradas del juego: la llegada de Cristóbal Colón, la medalla de oro de Claudia Poll y la abolición del ejército", w: 1259, h: 831 },
    { src: "/images/caja-cartas-lado.png", alt: "Caja del juego de lado, con los datos de partida impresos en el lomo: 2 a 6 jugadores, 11 años en adelante, 80 cartas y 15 minutos", w: 1252, h: 685 },
    { src: "/images/caja-caja-reverso.png", alt: "Reverso de la caja: el objetivo del juego y los créditos de la colaboración con Guabaya Games", w: 896, h: 1218 },
  ] satisfies Shot[],
  merch: [
    { src: "/images/camisas-1.png", alt: "Tres camisetas de la colección: «Heroína Nacional», «¡Libertad!» con Juan Rafael Mora Porras y la cita de Alfredo González Flores", w: 1247, h: 1406 },
    { src: "/images/camisas-2.png", alt: "Camiseta gris con la estampa «Resistencia» y la escultura de un indígena con el puño en alto", w: 1133, h: 1683 },
    { src: "/images/bolso-1.png", alt: "Bolso de tela con el logotipo de Historia de Costa Rica enmarcado en grecas precolombinas", w: 687, h: 533 },
    { src: "/images/camisas-3.png", alt: "Camiseta con la estampa «¡Libertad!» de Juan Rafael Mora Porras, presidente de Costa Rica", w: 1138, h: 1655 },
    { src: "/images/gorras-1.png", alt: "Gorras con el logotipo bordado, en gris, azul y verde", w: 773, h: 327 },
    { src: "/images/camisas-4.png", alt: "Camiseta con la cita de Alfredo González Flores: «Que el rico pague como rico y el pobre como pobre»", w: 857, h: 1603 },
    { src: "/images/bolso-2.png", alt: "Bolso de tela con la estampa de la Liga Feminista y el voto femenino", w: 639, h: 818 },
    { src: "/images/camisas-5.png", alt: "Camiseta corta con la estampa de la Liga Feminista: los derechos de la mujer y el voto femenino en el siglo XX", w: 1229, h: 1682 },
    { src: "/images/gorras-2.png", alt: "Gorras con el logotipo bordado, en rojo y en color arena", w: 774, h: 354 },
    { src: "/images/camisas-6.png", alt: "Tres camisetas de la colección combinadas con las gorras bordadas de Historia de Costa Rica", w: 720, h: 811 },
  ] satisfies Shot[],
} as const;

/*
 * Vídeos alojados en las redes del cliente. Se incrustan y, al pulsarlos, abren
 * la publicación original (una capa-enlace cubre el reproductor).
 * El de YouTube se reproduce en bucle y sin sonido; Instagram no permite
 * autoplay ni bucle en su incrustación oficial.
 */
export const VIDEOS = {
  instagram: {
    href: "https://www.instagram.com/p/DB2iBxiRGZo/",
    embed: "https://www.instagram.com/p/DB2iBxiRGZo/embed",
    title: "Reel de Historia de Costa Rica en Instagram",
  },
  youtube: {
    id: "8RW-OAXJ5pw",
    href: "https://www.youtube.com/watch?v=8RW-OAXJ5pw",
    embed:
      "https://www.youtube-nocookie.com/embed/8RW-OAXJ5pw?autoplay=1&mute=1&loop=1&playlist=8RW-OAXJ5pw&controls=0&modestbranding=1&rel=0&playsinline=1",
    title: "Vídeo de Historia de Costa Rica en YouTube",
  },
} as const;

export type NavItem = { label: string; href: string };

/** F02 · F04 — navegación ancla a las secciones de la página única. */
export const NAV: NavItem[] = [
  { label: "Tienda", href: "/tienda" },
  { label: "Podcast", href: "#podcast" },
  { label: "Comunidad", href: "#comunidad" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Contacto", href: "#contacto" },
];
