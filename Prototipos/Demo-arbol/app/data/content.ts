/**
 * Fuente única de contenido del sitio: marca, contactos, precios, galerías y
 * navegación. Cambiar aquí propaga a cabecera, pie, Magic Bottom, portada y
 * secciones.
 *
 * ── MARCA FICTICIA ──────────────────────────────────────────────────────────
 * «Raíz y Piedra» no existe: es una empresa inventada para poder enseñar la
 * demo llena de contenido a cualquier cliente, igual que se hizo en
 * `Prototipos/Selva y Sal/`. No metas aquí datos de nadie real.
 *
 * Por eso TODOS los enlaces cuelgan del dominio ficticio `raizypiedra.cr`, que
 * no resuelve. Inventar un `instagram.com/<handle>` o un número de WhatsApp
 * plausible es peor que un enlace muerto: puede caer sobre la cuenta o el
 * teléfono de una persona real.
 * ────────────────────────────────────────────────────────────────────────────
 */

export const CONTACT = {
  whatsapp: "https://raizypiedra.cr/whatsapp",
  email: "hola@raizypiedra.cr",
  instagram: "https://raizypiedra.cr/instagram",
  youtube: "https://raizypiedra.cr/youtube",
  spotify: "https://raizypiedra.cr/podcast",
} as const;

export const BRAND = {
  name: "Raíz y Piedra",
  city: "San José, Costa Rica",
  foundedNote:
    "Casa editora de juegos y objetos de memoria. San José, Costa Rica, desde 2019.",
} as const;

/** Destino seguro para un enlace todavía sin dirección. */
export const linkTo = (value: string) => value || "#";

/**
 * Precios en colones (₡). El multi-divisa (F16) queda fuera del prototipo.
 *
 * Se escriben con punto de millar porque `numericPrice()` (Shop.tsx) extrae
 * `/[\d.,]+/` y borra los separadores: «₡15.000» ordena como 15000.
 */
export const PRICES = {
  game: "₡15.000",
  tee: "₡12.000",
  membership: "desde ₡600 / mes",
} as const;

/** Mensaje pre-cargado para el enlace de WhatsApp (Magic Bottom, F09). */
export const WHATSAPP_LABEL = "Escribir por WhatsApp";

export type Shot = { src: string; alt: string; w: number; h: number };

/*
 * Láminas de producto (`public/images/`). Son SVG dibujados a propósito, no
 * fotografía: la marca es ficticia y una foto falsa de un producto que no
 * existe se lee como un montaje. El sistema visual es común —grecas, la esfera
 * como módulo y la silueta del guanacaste— para que la colección se lea como
 * una sola familia.
 *
 * `w` y `h` son las dimensiones del `viewBox` de cada archivo: `next/image` las
 * usa para reservar el hueco y evitar el salto de maquetación. Deben rehacerse
 * si se sustituye una lámina por otra de distinta proporción.
 *
 * El orden de `merch` alterna prenda, gorra y bolso a propósito: es el carrusel
 * del panel de Merch y así ninguna categoría domina la rotación. La rotación
 * solo arranca con dos o más elementos.
 */
export const SHOTS = {
  game: [
    { src: "/images/caja-frente.svg", alt: "Caja del juego «Raíz y Piedra», con forma de libro, vista de frente", w: 1200, h: 1200 },
    { src: "/images/cartas-abanico.svg", alt: "Tres cartas ilustradas del juego abiertas en abanico: la raíz, la esfera y el amanecer", w: 1400, h: 900 },
    { src: "/images/caja-lomo.svg", alt: "Lomo de la caja con los datos de partida impresos: 2 a 6 jugadores, 11 años en adelante, 80 cartas y 15 minutos", w: 1200, h: 700 },
    { src: "/images/caja-reverso.svg", alt: "Reverso de la caja con el objetivo del juego y las cuatro eras de la línea del tiempo", w: 900, h: 1200 },
  ] satisfies Shot[],
  merch: [
    { src: "/images/camiseta-guanacaste.svg", alt: "Camiseta con la copa del guanacaste serigrafiada en ocre sobre tela cruda", w: 1000, h: 1200 },
    { src: "/images/gorra-greca.svg", alt: "Gorra con la greca precolombina bordada en el frente", w: 1000, h: 500 },
    { src: "/images/bolso-grecas.svg", alt: "Bolso de tela con el logotipo enmarcado en grecas precolombinas", w: 900, h: 900 },
    { src: "/images/camiseta-esfera.svg", alt: "Camiseta gris con la esfera del Diquís estampada en el pecho", w: 1000, h: 1200 },
    { src: "/images/lamina-finca-6.svg", alt: "Lámina serigrafiada del sitio arqueológico Finca 6, con las esferas alineadas", w: 900, h: 1200 },
    { src: "/images/gorra-esfera.svg", alt: "Gorra en color piedra con la esfera bordada en el frente", w: 1000, h: 500 },
    { src: "/images/camiseta-sabanero.svg", alt: "Camiseta con la estampa del sabanero guanacasteco y la cita de la pampa", w: 1000, h: 1200 },
    { src: "/images/bolso-finca-6.svg", alt: "Bolso de tela con el plano de las alineaciones de esferas de Finca 6", w: 900, h: 900 },
  ] satisfies Shot[],
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
