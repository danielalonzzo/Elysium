/**
 * Fuente única de contenido del sitio. La demo se entrega vacía: todos los
 * textos, enlaces y precios son cadenas vacías a la espera de contenido real.
 *
 * Cambiar aquí propaga a cabecera, pie, Magic Bottom y todas las secciones, así
 * que este fichero es el único punto por el que hay que empezar a rellenar.
 */

/**
 * Enlaces de contacto. Vacíos = enlace inerte: los componentes pasan la cadena
 * por `linkTo()` y sale `#`, para no navegar a ninguna parte.
 */
export const CONTACT = {
  whatsapp: "",
  email: "",
  instagram: "",
  youtube: "",
  spotify: "",
} as const;

export const BRAND = {
  name: "",
  city: "",
  foundedNote: "",
} as const;

/** Destino seguro para un enlace todavía sin dirección. */
export const linkTo = (value: string) => value || "#";

export const PRICES = {
  game: "",
  tee: "",
  membership: "",
} as const;

export const WHATSAPP_LABEL = "";

export type Shot = { src: string; alt: string; w: number; h: number };

/*
 * Fotografía de producto. `w` y `h` son las dimensiones REALES en píxeles de
 * cada archivo: `next/image` las usa para reservar el hueco (sin salto de
 * maquetación) y para calcular las variantes que sirve, así que hay que
 * anotarlas al añadir cada foto.
 *
 * El orden de `merch` conviene que alterne categorías: es el carrusel del panel
 * de Merch y así ninguna domina la rotación.
 */
export const SHOTS = {
  game: [] as Shot[],
  merch: [] as Shot[],
} as const;

/*
 * Vídeos incrustados desde redes. Se muestran y, al pulsarlos, abren la
 * publicación original (una capa-enlace cubre el reproductor). Con `embed`
 * vacío el panel queda en blanco y no se pide nada a terceros — que es también
 * lo que espera la CSP publicada, sin `frame-src`.
 */
export const VIDEOS = {
  instagram: {
    href: "",
    embed: "",
    title: "",
  },
  youtube: {
    id: "",
    href: "",
    embed: "",
    title: "",
  },
} as const;

export type NavItem = { label: string; href: string };

/** F02 · F04 — navegación ancla a las secciones de la página única. */
export const NAV: NavItem[] = [
  { label: "", href: "/tienda" },
  { label: "", href: "#podcast" },
  { label: "", href: "#comunidad" },
  { label: "", href: "#nosotros" },
  { label: "", href: "#contacto" },
];
