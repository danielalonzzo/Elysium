/**
 * Todo el texto del sitio de Selva y Sal, en un solo módulo.
 *
 * Marca ficticia: ver `app/data/brand.ts`. Ni la empresa, ni los precios, ni
 * los teléfonos, ni las direcciones corresponden a nada real; existen para que
 * el prototipo se pueda enseñar lleno de contenido sin usar activos de nadie.
 *
 * Las páginas se declaran como datos y los componentes solo las pintan: así el
 * mismo recorrido se puede reetiquetar entero sin tocar la interfaz.
 */

import { brand, brandAssets, contact } from "./brand";

export type Nullable<T> = T | null;

export interface PublicAsset {
  src: Nullable<string>;
  alt: Nullable<string>;
}

export interface TextLink {
  label: string;
  href: Nullable<string>;
}

export interface PageBase {
  route: string;
  title: string;
  browserTitle: string;
  seoDescription: Nullable<string>;
  assets: PublicAsset[];
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox" | "file";
  placeholder: Nullable<string>;
  required: boolean;
  options: string[];
  value: Nullable<string>;
  helperText: Nullable<string>;
}

export interface FormDefinition {
  sourceName: string;
  submitLabel: string;
  fields: FormField[];
}

export interface FormPage extends PageBase {
  heading: string;
  introduction: string[];
  form: FormDefinition;
  location: Nullable<string>;
  links: TextLink[];
}

export interface ArticleSection {
  heading: Nullable<string>;
  paragraphs: string[];
  items: string[];
  image: Nullable<PublicAsset>;
  caption: Nullable<string>;
  productSlugs: string[];
}

export interface BlogArticle extends PageBase {
  slug: string;
  publishedAt: string;
  modifiedAt: string;
  hero: PublicAsset;
  introduction: string[];
  sections: ArticleSection[];
}

export interface CatalogEntry {
  title: string;
  href: string;
  image: Nullable<PublicAsset>;
}

export const siteAssets = {
  logo: { src: brandAssets.logo, alt: brand.name },
  logoLight: { src: brandAssets.logoLight, alt: brand.name },
  favicon: { src: brandAssets.favicon, alt: "" },
} satisfies Record<string, PublicAsset>;

/* Datos de contacto: un único punto de verdad para cabecera, pie, dock,
   contacto y formularios. Todos apuntan a `brand.ts`. */
export const contactDetails = {
  email: contact.email,
  emailHref: contact.emailHref,
  wholesaleEmail: contact.wholesaleEmail,
  wholesaleEmailHref: contact.wholesaleEmailHref,
  phone: contact.phone,
  phoneHref: contact.phoneHref,
  whatsappHref: contact.whatsapp,
  wholesalePhone: contact.wholesalePhone,
  wholesalePhoneHref: contact.wholesalePhoneHref,
  wholesaleWhatsappHref: contact.wholesaleWhatsapp,
  address: contact.address,
  facebookHref: contact.facebook,
  instagramHref: contact.instagram,
};

const contactFields: FormField[] = [
  { id: "name", label: "Nombre", type: "text", placeholder: "Nombre", required: true, options: [], value: null, helperText: null },
  { id: "last-name", label: "Apellidos", type: "text", placeholder: "Apellidos", required: true, options: [], value: null, helperText: null },
  { id: "email", label: "Email", type: "email", placeholder: "Email", required: true, options: [], value: null, helperText: null },
  { id: "phone", label: "Teléfono", type: "tel", placeholder: "Teléfono", required: true, options: [], value: null, helperText: null },
  { id: "message", label: "Mensaje", type: "textarea", placeholder: "Mensaje", required: false, options: [], value: null, helperText: null },
];

const generalContactLinks: TextLink[] = [
  { label: contactDetails.email, href: contactDetails.emailHref },
  { label: contactDetails.phone, href: contactDetails.phoneHref },
  { label: "Facebook", href: contactDetails.facebookHref },
  { label: "Instagram", href: contactDetails.instagramHref },
  { label: "Envelope", href: contactDetails.emailHref },
  { label: "Whatsapp", href: contactDetails.whatsappHref },
  { label: "Map-marker-alt", href: null },
];

export const homePage = {
  route: "/",
  title: "Inicio",
  browserTitle: `Inicio · ${brand.name}`,
  seoDescription:
    "Expediciones guiadas del volcán Arenal al Pacífico y una línea propia de recuerdos hechos en Costa Rica.",
  assets: [siteAssets.logo],
  slides: [
    {
      heading: "Expediciones guiadas",
      description:
        "Once rutas por volcán, río, bosque nuboso y océano, con guías locales certificados y grupos pequeños.",
      action: { label: "Ver más", href: "/expediciones/" },
      image: { src: "/assets/escena/categoria-expediciones.svg", alt: "Sendero hacia el volcán" },
    },
    {
      heading: "Recuerdos de la ruta",
      description:
        "Diseñamos y producimos nuestra propia línea: textiles, cerámica, café y artesanía de talleres costarricenses.",
      action: { label: "Ver más", href: "/tienda/" },
      image: { src: "/assets/escena/categoria-ceramica.svg", alt: "Cerámica de la línea propia" },
    },
    {
      heading: "Para hoteles y lodges",
      description:
        "Abastecemos tiendas de hotel y lodges de todo el país con precios de mayoreo y reposición mensual.",
      action: { label: "Ver más", href: "/mayoreo/" },
      image: { src: "/assets/escena/promo-mayoreo.svg", alt: "Cajas de reposición para comercios" },
    },
    {
      heading: "Del volcán al mar",
      description:
        "Tres días que atraviesan el país de punta a punta: Arenal, Tilarán y Pacífico Sur, con todo resuelto.",
      action: { label: "Ver más", href: "/expediciones/" },
      image: { src: "/assets/escena/banner-expediciones.svg", alt: "La ruta del volcán al mar" },
    },
  ],
  metrics: [
    { label: "Aventureros\ncada año", value: 9400, prefix: "+", suffix: "" },
    { label: "Años\nrecorriendo", value: 17, prefix: "+", suffix: "" },
    { label: "Huella\ncompensada", value: 100, prefix: "", suffix: "%" },
  ],
  categories: [
    { title: "Expediciones", image: { src: "/assets/escena/categoria-expediciones.svg", alt: "" }, href: "/expediciones/" },
    { title: "Textiles", image: { src: "/assets/escena/categoria-textiles.svg", alt: "" }, href: null },
    { title: "Peluches", image: { src: "/assets/escena/categoria-peluches.svg", alt: "" }, href: null },
    { title: "Gorras", image: { src: "/assets/escena/categoria-gorras.svg", alt: "" }, href: null },
    { title: "Cerámica", image: { src: "/assets/escena/categoria-ceramica.svg", alt: "" }, href: null },
    { title: "Café y cacao", image: { src: "/assets/escena/categoria-cafe.svg", alt: "" }, href: null },
  ],
  promotions: [
    {
      title: "Temporada verde: expediciones a mitad de aforo",
      description:
        "De mayo a noviembre los grupos bajan a seis personas y el precio no cambia. Llueve por la tarde; salimos temprano.",
      action: { label: "Explorar", href: "/expediciones/" },
      image: { src: "/assets/escena/promo-temporada.svg", alt: "" },
    },
    {
      title: "Precios especiales para comercios",
      description:
        "Tiendas de hotel, lodges y cafeterías: catálogo de mayoreo, pedido mínimo bajo y reposición coordinada.",
      action: { label: "Explorar", href: "/inscripcion-mayoreo/" },
      image: { src: "/assets/escena/promo-mayoreo.svg", alt: "" },
    },
  ],
};

export const aboutPage = {
  route: "/nosotros/",
  title: "Nosotros",
  browserTitle: `Nosotros · ${brand.name}`,
  seoDescription:
    "Quiénes somos: una casa de expediciones de La Fortuna que además diseña sus propios recuerdos.",
  assets: [
    { src: "/assets/escena/equipo-selva-y-sal.svg", alt: "El equipo de guías de Selva y Sal" },
    { src: "/assets/escena/compromiso-ambiental.svg", alt: "Bosque en regeneración" },
    { src: "/assets/escena/detalle-taller.svg", alt: "Taller de artesanía aliado" },
  ],
  introduction:
    "Selva y Sal nació en 2009 en La Fortuna, cuando dos guías dejaron de trabajar para agencias ajenas y empezaron a llevar a la gente al Arenal por su cuenta. Diecisiete años después seguimos siendo una casa pequeña: once expediciones propias, veintidós guías y una tienda que diseña sus propios recuerdos en lugar de revender los de siempre.",
  panels: [
    {
      title: "Misión",
      paragraphs: [
        "Llevar a cada visitante a un pedazo real de Costa Rica y devolverlo con algo que valga la pena guardar. Eso significa grupos pequeños, guías de la zona pagados por encima del mercado y recuerdos que se fabrican aquí, con talleres que conocemos por su nombre.",
        "No vendemos experiencias que no hayamos caminado, ni productos que no usemos nosotros. Si una ruta se satura o un proveedor deja de cumplir, sale del catálogo.",
      ],
      items: [],
    },
    {
      title: "Visión",
      paragraphs: [
        "Que una empresa de aventura pueda crecer sin volverse una fábrica de turnos. Queremos llegar a veinte rutas sin pasar de doce personas por salida, y que la línea de recuerdos sostenga por sí sola a los talleres que la producen.",
      ],
      items: [],
    },
    {
      title: "Valores",
      paragraphs: [],
      items: [
        "Grupos pequeños",
        "Guías locales",
        "Producción costarricense",
        "Precio claro, sin extras al final",
        "Huella compensada",
        "Nada de fauna en cautiverio",
      ],
    },
  ],
  sponsorHeading: "Compensamos el 100 % de la huella de cada salida con el vivero de Chachagua",
  environmentalHeading: "Compromiso ambiental",
  environmentalCommitment: [
    "Cada expedición se calcula en kilómetros de transporte y se compensa con siembra en el corredor de Chachagua, donde llevamos ocho años reponiendo bosque de galería junto a los dueños de las fincas.",
    "En ruta no alimentamos fauna, no se toca a los animales y no trabajamos con centros que los mantengan en cautiverio para la foto. Es la regla que más clientes nos ha costado y la que no vamos a mover.",
    "En la tienda, el 70 % del catálogo se fabrica a menos de cien kilómetros de La Fortuna. El resto son piezas de talleres borucas y chorotegas que compramos a precio pactado con ellos, no a precio de regateo.",
  ],
};

export const expeditionsPage = {
  route: "/expediciones/",
  title: "Expediciones",
  browserTitle: `Expediciones · ${brand.name}`,
  seoDescription: "Las once rutas guiadas de Selva y Sal, del volcán Arenal al Pacífico Sur.",
  assets: [],
  heading: "Nuestras expediciones",
  hero: { src: "/assets/escena/banner-expediciones.svg", alt: "La ruta del volcán al mar" },
  products: [
    {
      id: 101,
      name: "Arenal al Amanecer",
      price: "₡42.000",
      href: "/product/expedicion-arenal-amanecer/",
      image: { src: "/assets/catalogo/expedicion-arenal-amanecer.svg", alt: "" },
      actionLabel: "Seleccionar opciones",
      actionHref: "/product/expedicion-arenal-amanecer/",
    },
    {
      id: 102,
      name: "Rafting Río Balsa",
      price: "₡38.500",
      href: "/product/expedicion-rafting-balsa/",
      image: { src: "/assets/catalogo/expedicion-rafting-balsa.svg", alt: "" },
      actionLabel: "Seleccionar opciones",
      actionHref: "/product/expedicion-rafting-balsa/",
    },
    {
      id: 103,
      name: "Canopy sobre el Dosel",
      price: "₡46.000",
      href: "/product/expedicion-canopy-dosel/",
      image: { src: "/assets/catalogo/expedicion-canopy-dosel.svg", alt: "" },
      actionLabel: "Seleccionar opciones",
      actionHref: "/product/expedicion-canopy-dosel/",
    },
    {
      id: 104,
      name: "Caminata Nocturna de Fauna",
      price: "₡29.000",
      href: "/product/expedicion-caminata-nocturna/",
      image: { src: "/assets/catalogo/expedicion-caminata-nocturna.svg", alt: "" },
      actionLabel: "Seleccionar opciones",
      actionHref: "/product/expedicion-caminata-nocturna/",
    },
    {
      id: 105,
      name: "Snorkel del Pacífico Sur",
      price: "₡52.000",
      href: "/product/expedicion-snorkel-pacifico/",
      image: { src: "/assets/catalogo/expedicion-snorkel-pacifico.svg", alt: "" },
      actionLabel: "Seleccionar opciones",
      actionHref: "/product/expedicion-snorkel-pacifico/",
    },
    {
      id: 106,
      name: "Del Volcán al Mar · 3 días",
      price: "₡295.000",
      href: "/product/expedicion-volcan-al-mar/",
      image: { src: "/assets/catalogo/expedicion-volcan-al-mar.svg", alt: "" },
      actionLabel: "Leer más",
      actionHref: "/product/expedicion-volcan-al-mar/",
    },
  ],
  campaign: {
    heading: "Cómo funciona una salida",
    paragraphs: [
      "Se reserva con el 30 % y se paga el resto el día de la salida. Recogemos en cualquier hotel de La Fortuna sin cargo; fuera del cantón coordinamos punto de encuentro.",
      "Si el clima obliga a cancelar, se reprograma sin coste o se devuelve el depósito completo. No cobramos por cambios avisados con 24 horas.",
    ],
    countdown: [
      { label: "Rutas", value: 11 },
      { label: "Máx. por grupo", value: 8 },
      { label: "Guías", value: 22 },
      { label: "Años", value: 17 },
    ],
    closing: "Nos vemos en el sendero.",
    image: { src: "/assets/escena/detalle-arenal.svg", alt: "" },
  },
};

export const blogIndexPage = {
  route: "/blog/",
  title: "Blog",
  browserTitle: `Blog · ${brand.name}`,
  seoDescription: null,
  assets: [],
  heading: "Blog",
  cards: [
    {
      title: "La ruta del Arenal",
      excerpt:
        "El volcán se ve despejado unas tres horas al día, y casi nunca son las que la gente reserva. Esto es lo que hemos aprendido en diecisiete años de madrugones.",
      href: "/la-ruta-del-arenal/",
      image: { src: "/assets/escena/blog-ruta-arenal.svg", alt: "" },
      actionLabel: "Leer más »",
    },
    {
      title: "Qué llevar al bosque nuboso",
      excerpt:
        "Doce grados, humedad del noventa por ciento y lluvia horizontal. La lista corta de lo que sí sirve y lo que sobra en la mochila.",
      href: "/que-llevar-al-bosque-nuboso/",
      image: { src: "/assets/escena/blog-bosque-nuboso.svg", alt: "" },
      actionLabel: "Leer más »",
    },
    {
      title: "Tres días en el Pacífico Sur",
      excerpt:
        "Cómo encajan snorkel, manglar y surf en un fin de semana largo sin pasar el viaje entero dentro de una buseta.",
      href: "/tres-dias-en-el-pacifico-sur/",
      image: { src: "/assets/escena/blog-pacifico-sur.svg", alt: "" },
      actionLabel: "Leer más »",
    },
    {
      title: "Cómo elegir un recuerdo honesto",
      excerpt:
        "Casi todo lo que se vende como artesanía costarricense se fabrica a diez mil kilómetros. Cuatro señales para distinguir lo que sí se hizo aquí.",
      href: "/como-elegir-un-recuerdo-honesto/",
      image: { src: "/assets/escena/blog-recuerdo-honesto.svg", alt: "" },
      actionLabel: "Leer más »",
    },
  ],
};

const rutaProductSlugs = [
  "mochila-sendero-25l",
  "botella-termica-arenal",
  "chaqueta-impermeable-sendero",
  "gorra-arenal-verde",
  "libreta-cuaderno-de-ruta",
  "llavero-brujula-sendero",
  "cafe-tueste-volcan",
  "camiseta-del-volcan-al-mar",
];

const brumaProductSlugs = [
  "hoodie-bruma-verde",
  "cuellera-bosque-nuboso",
  "cantimplora-acero-bruma",
  "peluche-quetzal-nuboso",
  "libreta-avistamientos",
  "calcetines-perezoso",
  "gorra-bruma-gris",
  "vaso-plegable-sendero",
];

const costaProductSlugs = [
  "visera-pacifico",
  "pareo-manuel-antonio",
  "rinonera-marea",
  "botella-termica-pacifico",
  "cuellera-oleaje",
  "iman-ola-pacifica",
  "pulsera-tejida-marea",
  "sudadera-marea-baja",
];

const tallerProductSlugs = [
  "mascara-boruca-luna",
  "carreta-tipica-miniatura",
  "cuenco-madera-guanacaste",
  "jarra-artesanal-turquesa",
  "collar-semilla-selva",
  "campana-viento-bambu",
  "figura-tallada-tortuga",
  "plato-decorativo-guanacaste",
];

export const blogArticles: BlogArticle[] = [
  {
    route: "/la-ruta-del-arenal/",
    slug: "la-ruta-del-arenal",
    title: "La ruta del Arenal",
    browserTitle: `La ruta del Arenal · ${brand.name}`,
    seoDescription:
      "Cuándo se ve el volcán despejado, por dónde entrar y qué esperar de cada mirador de la ruta del Arenal.",
    publishedAt: "2026-02-11T13:00:00+00:00",
    modifiedAt: "2026-05-03T16:20:00+00:00",
    assets: [],
    hero: { src: "/assets/escena/blog-ruta-arenal.svg", alt: "" },
    introduction: [
      "El Arenal se ve despejado una media de tres horas al día, y casi nunca son las que la gente reserva. La bruma sube desde la laguna a media mañana y no se vuelve a abrir hasta el atardecer, si es que se abre. De ahí que nuestra salida al volcán empiece a las 4:30 y no a las 8:00, aunque cueste llenarla.",
      "Esto es lo que hemos ido aprendiendo de tanto madrugar, por si sube por su cuenta.",
    ],
    sections: [
      {
        heading: "🌋 La ventana buena",
        paragraphs: [
          "De diciembre a abril, el cono suele estar limpio entre las cinco y las ocho de la mañana. En temporada verde la ventana se corre: hay días de mayo en que amanece cerrado y abre de golpe a las cuatro de la tarde, justo antes del aguacero.",
          "Lo que no funciona nunca es el mediodía. Si solo tiene una mañana, gástela temprano.",
        ],
        items: [
          "Diciembre–abril: mejor de 5:00 a 8:00, con luz rasante sobre la ladera oeste.",
          "Mayo–noviembre: segunda ventana a última hora, entre las 15:30 y las 17:00.",
          "Cualquier mes: si a las 9:00 sigue cerrado, ese día ya no abre por la mañana.",
        ],
        image: { src: "/assets/escena/detalle-arenal.svg", alt: "" },
        caption: "El cono desde el sendero del mirador oeste",
        productSlugs: rutaProductSlugs,
      },
      {
        heading: "🥾 Por dónde entrar",
        paragraphs: [
          "Hay tres accesos y no dan la misma caminata. El del parque nacional es el más ordenado y el que tiene los senderos de colada; el del sector norte es más corto y menos transitado; el tercero, por finca privada, es el único desde el que se ve el volcán y la laguna en el mismo encuadre.",
          "Nuestra salida usa el tercero antes del amanecer y baja por el del parque cuando ya hay luz, para no repetir paisaje.",
        ],
        items: [],
        image: null,
        caption: null,
        productSlugs: [],
      },
      {
        heading: "🎒 Lo que sí hace falta",
        paragraphs: [
          "El error clásico es subir con ropa de playa porque en La Fortuna hace calor. A las cinco de la mañana, en la ladera, hay quince grados y viento.",
        ],
        items: [
          "Capa impermeable ligera: llueve sin avisar todo el año.",
          "Zapato cerrado con suela: la colada antigua es piedra suelta y corta.",
          "Litro y medio de agua por persona, mínimo.",
          "Linterna frontal si sale antes del amanecer, no la del teléfono.",
        ],
        image: null,
        caption: null,
        productSlugs: [],
      },
      {
        heading: "⚠️ Lo que no vamos a hacer",
        paragraphs: [
          "No subimos al cráter. El volcán está activo y el sector alto lleva cerrado desde 1998 por buenas razones; cualquiera que le ofrezca la cumbre le está vendiendo una infracción, no una expedición.",
        ],
        items: [],
        image: null,
        caption: null,
        productSlugs: [],
      },
    ],
  },
  {
    route: "/que-llevar-al-bosque-nuboso/",
    slug: "que-llevar-al-bosque-nuboso",
    title: "Qué llevar al bosque nuboso",
    browserTitle: `Qué llevar al bosque nuboso · ${brand.name}`,
    seoDescription:
      "La lista corta de equipo para la Cordillera de Tilarán: doce grados, humedad del noventa por ciento y lluvia horizontal.",
    publishedAt: "2026-03-19T15:30:00+00:00",
    modifiedAt: "2026-03-19T15:30:00+00:00",
    assets: [],
    hero: { src: "/assets/escena/blog-bosque-nuboso.svg", alt: "" },
    introduction: [
      "El bosque nuboso engaña. Está a dos horas de la playa y a la gente le cuesta creer que va a pasar frío, hasta que lleva veinte minutos dentro de una nube a doce grados con el viento metiéndole el agua por el cuello.",
      "Esta es la lista que damos a quien reserva la cabalgata de Tilarán o el recorrido de fauna. Es corta a propósito.",
    ],
    sections: [
      {
        heading: "🧥 Las tres capas",
        paragraphs: [
          "La regla es la misma de cualquier montaña húmeda: una capa que saque el sudor, una que abrigue y una que corte el agua y el viento. Lo que cambia aquí es que la tercera no puede ser un poncho de plástico, porque el viento lo levanta y termina de adorno.",
          "El algodón, para esto, es el peor material posible: se moja y ya no seca en todo el día.",
        ],
        items: [
          "Primera capa sintética o de lana fina, nunca de algodón.",
          "Segunda capa con capucha, para las paradas largas.",
          "Impermeable con costuras selladas y capucha ajustable.",
        ],
        image: { src: "/assets/escena/detalle-bosque.svg", alt: "" },
        caption: "Camino de la cordillera a media mañana",
        productSlugs: brumaProductSlugs,
      },
      {
        heading: "🔭 Para ver algo",
        paragraphs: [
          "El bosque nuboso no se mira, se escucha primero. El quetzal se localiza por el canto y casi siempre está más cerca y más alto de lo que uno cree.",
          "Unos binoculares modestos rinden más que una cámara con teleobjetivo si no sabe usarla rápido: el pájaro se va en cuatro segundos.",
        ],
        items: [
          "Binoculares 8×42, el estándar que usan nuestros guías.",
          "Libreta para anotar hora, altura y especie: sirve más de lo que parece.",
          "Nada de reproducir cantos por el altavoz para atraerlos. Estresa a las aves y está prohibido en las reservas.",
        ],
        image: null,
        caption: null,
        productSlugs: [],
      },
      {
        heading: "🎒 Lo que sobra",
        paragraphs: [],
        items: [
          "Paraguas: dura hasta la primera ráfaga.",
          "Zapato de suela lisa: el barro de Tilarán es jabón.",
          "Repelente de aerosol dentro de la reserva: use crema y aplíquela fuera.",
          "Dron: no se puede volar en ninguna de las reservas de la ruta.",
        ],
        image: null,
        caption: null,
        productSlugs: [],
      },
    ],
  },
  {
    route: "/tres-dias-en-el-pacifico-sur/",
    slug: "tres-dias-en-el-pacifico-sur",
    title: "Tres días en el Pacífico Sur",
    browserTitle: `Tres días en el Pacífico Sur · ${brand.name}`,
    seoDescription:
      "Cómo encajar snorkel, manglar y surf en un fin de semana largo sin pasar el viaje dentro de una buseta.",
    publishedAt: "2026-04-08T11:15:00+00:00",
    modifiedAt: "2026-06-01T09:40:00+00:00",
    assets: [],
    hero: { src: "/assets/escena/blog-pacifico-sur.svg", alt: "" },
    introduction: [
      "La costa sur está lejos de todo y esa es justamente la gracia. El error habitual es intentar meter cinco lugares en tres días: se terminan pasando nueve horas en carretera para ver todo con prisa.",
      "Este es el reparto que usamos nosotros, y el que recomendamos a quien va por su cuenta.",
    ],
    sections: [
      {
        heading: "📍 Día uno: llegar y no hacer nada",
        paragraphs: [
          "Son seis horas largas desde el Valle Central. Llegar y salir corriendo al agua es la manera más rápida de arruinar el resto del viaje.",
          "Deje la tarde para la playa que tenga más cerca y para preguntar por la marea del día siguiente, que es lo único que de verdad manda aquí.",
        ],
        items: [],
        image: { src: "/assets/escena/detalle-costa.svg", alt: "" },
        caption: "Bajamar en la costa sur",
        productSlugs: costaProductSlugs,
      },
      {
        heading: "🤿 Día dos: snorkel temprano, manglar al atardecer",
        paragraphs: [
          "El agua está clara antes de las diez; después el oleaje levanta arena y se ve la mitad. Nuestra salida de snorkel arranca a las 7:00 por eso, no por madrugar de más.",
          "El manglar es lo contrario: hay que entrar con la marea subiendo y a última hora, cuando bajan a comer las garzas y los ibis.",
        ],
        items: [],
        image: null,
        caption: null,
        productSlugs: [],
      },
      {
        heading: "🏄 Día tres: la primera ola",
        paragraphs: [
          "Las playas de la zona tienen fondo de arena y series largas: es de los mejores sitios del país para meterse por primera vez a una tabla.",
          "Dos horas de clase bastan para ponerse de pie. Tres, no: se acaba el brazo y se acaba la paciencia.",
        ],
        items: [
          "Licra de manga larga, más útil que el bloqueador para dos horas de agua.",
          "Bloqueador mineral, sin oxibenzona: el arrecife está a doscientos metros.",
          "Agua y fruta: la clase deshidrata más de lo que parece.",
        ],
        image: null,
        caption: null,
        productSlugs: [],
      },
    ],
  },
  {
    route: "/como-elegir-un-recuerdo-honesto/",
    slug: "como-elegir-un-recuerdo-honesto",
    title: "Cómo elegir un recuerdo honesto",
    browserTitle: `Cómo elegir un recuerdo honesto · ${brand.name}`,
    seoDescription:
      "Cuatro señales para distinguir la artesanía costarricense real de la que se fabrica a diez mil kilómetros.",
    publishedAt: "2026-05-27T18:00:00+00:00",
    modifiedAt: "2026-05-27T18:00:00+00:00",
    assets: [],
    hero: { src: "/assets/escena/blog-recuerdo-honesto.svg", alt: "" },
    introduction: [
      "Buena parte de lo que se vende como artesanía costarricense en las tiendas del aeropuerto se fabrica a diez mil kilómetros de aquí y llega en contenedor. No es ilegal ni es un escándalo, pero conviene saberlo antes de pagar el triple por una pieza \"local\".",
      "Cuatro cosas que miramos nosotros antes de meter algo en el catálogo.",
    ],
    sections: [
      {
        heading: "1. Que la pieza no sea idéntica a la de al lado",
        paragraphs: [
          "Una jarra torneada a mano tiene el borde ligeramente desigual y el esmalte más grueso de un lado. Si en la estantería hay cuarenta exactamente iguales, salieron de un molde industrial.",
          "Esto no las hace peores, pero sí explica por qué cuestan lo que cuestan.",
        ],
        items: [],
        image: { src: "/assets/escena/detalle-taller.svg", alt: "" },
        caption: "Taller de cerámica aliado, en Guaitil",
        productSlugs: tallerProductSlugs,
      },
      {
        heading: "2. Que se sepa de qué taller salió",
        paragraphs: [
          "Las máscaras borucas que vendemos vienen firmadas por detrás, con el nombre del tallador. Es información que cualquier tienda seria puede darle sin dudar: si nadie sabe quién la hizo, probablemente nadie de por aquí la hizo.",
        ],
        items: [],
        image: null,
        caption: null,
        productSlugs: [],
      },
      {
        heading: "3. Que el material tenga sentido",
        paragraphs: [
          "La madera de guanacaste y el cedro son pesados y huelen. La balsa es tan ligera que sorprende. Si una talla \"de madera tropical\" pesa como un plástico y no huele a nada, no es lo que dice ser.",
        ],
        items: [],
        image: null,
        caption: null,
        productSlugs: [],
      },
      {
        heading: "4. Que no venga de un animal",
        paragraphs: [
          "Carey, coral, plumas, dientes y caparazones: no los compre, ni aquí ni en ningún sitio. Casi todo eso es ilegal de sacar del país y, sobre todo, hubo que matar algo para ponerlo en el mostrador.",
          "Semillas, madera de reforestación y fibras vegetales dan piezas igual de bonitas y no dejan ese rastro.",
        ],
        items: [],
        image: null,
        caption: null,
        productSlugs: [],
      },
    ],
  },
];

export const requestCatalogPage: FormPage = {
  route: "/solicitud-catalogo/",
  title: "Solicitud de catálogo",
  browserTitle: `Solicitud de catálogo · ${brand.name}`,
  seoDescription:
    "Pida el catálogo de mayoreo de Selva y Sal o proponga cambios en las fichas de producto.",
  assets: [{ src: "/assets/escena/promo-mayoreo.svg", alt: "" }],
  heading: "Solicitud de catálogo",
  introduction: [
    "Este formulario sirve para pedir el catálogo vigente y también para proponer cambios: productos nuevos, correcciones de ficha o ajustes de código. Las propuestas de producto nuevo tardan porque implican hablar con el taller que lo fabricaría.",
  ],
  form: {
    sourceName: "Solicitud de catálogo",
    submitLabel: "Enviar",
    fields: [
      { id: "requester-name", label: "Nombre completo", type: "text", placeholder: "Nombre completo", required: true, options: [], value: null, helperText: null },
      { id: "requester-email", label: "Email", type: "email", placeholder: "Email", required: true, options: [], value: null, helperText: null },
      { id: "work-area", label: "Empresa o puesto", type: "text", placeholder: "Empresa o puesto", required: true, options: [], value: null, helperText: null },
      { id: "catalog", label: "Catálogo", type: "text", placeholder: "Catálogo", required: true, options: [], value: null, helperText: null },
      {
        id: "suggestion",
        label: "Qué necesita",
        type: "select",
        placeholder: null,
        required: true,
        options: ["Recibir el catálogo", "Proponer un producto", "Corregir una ficha", "Consultar disponibilidad"],
        value: null,
        helperText: null,
      },
      {
        id: "related-files",
        label: "Archivos relacionados (pdf, jpg, png, webp, doc, xls, svg)",
        type: "file",
        placeholder: null,
        required: false,
        options: [],
        value: null,
        helperText: "25 MB máximo por archivo",
      },
      { id: "message", label: "Mensaje", type: "textarea", placeholder: "Mensaje", required: false, options: [], value: null, helperText: null },
    ],
  },
  location: null,
  links: [],
};

export const tradeShowPage: FormPage = {
  route: "/expoferia/",
  title: "Expoferia",
  browserTitle: `Expoferia · ${brand.name}`,
  seoDescription: null,
  assets: [],
  heading: "Nos vemos en la Expoferia",
  introduction: [
    "Estaremos en el stand 42 con las once expediciones y la línea completa de recuerdos. Deje sus datos y le apartamos una cita con el equipo comercial durante la feria.",
  ],
  form: {
    sourceName: "Expoferia",
    submitLabel: "Enviar",
    fields: [
      { id: "full-name", label: "Nombre completo", type: "text", placeholder: "Nombre completo", required: true, options: [], value: null, helperText: null },
      { id: "phone", label: "Teléfono", type: "tel", placeholder: "Teléfono", required: true, options: [], value: null, helperText: null },
      { id: "email", label: "Email", type: "email", placeholder: "Email", required: true, options: [], value: null, helperText: null },
      { id: "company", label: "Empresa", type: "text", placeholder: "Empresa", required: true, options: [], value: null, helperText: null },
      { id: "heard-before", label: "¿Nos conocía antes de la feria?", type: "select", placeholder: null, required: false, options: ["Sí", "No"], value: null, helperText: null },
      { id: "discovery", label: "¿Cómo nos conoció?", type: "select", placeholder: null, required: false, options: ["Redes sociales", "Sitio web", "Un hotel o lodge", "La feria", "Otro"], value: null, helperText: null },
      {
        id: "marketing",
        label: "Quiero recibir el calendario de salidas y las novedades del catálogo.",
        type: "checkbox",
        placeholder: null,
        required: false,
        options: [],
        value: "Quiero recibir el calendario de salidas y las novedades del catálogo.",
        helperText: null,
      },
    ],
  },
  location: null,
  links: [],
};

export const wholesaleRegistrationPage: FormPage = {
  route: "/inscripcion-mayoreo/",
  title: "Inscripción mayoreo",
  browserTitle: `Inscripción mayoreo · ${brand.name}`,
  seoDescription:
    "Registro comercial para tiendas de hotel, lodges y cafeterías que quieran vender la línea de Selva y Sal.",
  assets: [
    { src: "/assets/escena/promo-mayoreo.svg", alt: "" },
    { src: "/assets/escena/tienda-la-fortuna.svg", alt: "La tienda de La Fortuna" },
  ],
  heading: "Venda nuestra línea en su negocio",
  introduction: [
    "Abastecemos tiendas de hotel, lodges, cafeterías y puntos de venta de todo el país. Pedido mínimo bajo, reposición coordinada y precios de mayoreo desde la primera compra.",
    `Escríbanos a ${contact.wholesaleEmail} o llame al ${contact.wholesalePhone}. También puede completar el formulario y le respondemos en un día hábil.`,
  ],
  form: {
    sourceName: "Inscripción mayoreo",
    submitLabel: "Enviar",
    fields: [
      { id: "full-name", label: "Nombre completo", type: "text", placeholder: "Nombre", required: true, options: [], value: null, helperText: null },
      { id: "company", label: "Empresa o negocio (opcional)", type: "text", placeholder: "Empresa o negocio", required: false, options: [], value: null, helperText: null },
      { id: "company-type", label: "Tipo de negocio", type: "select", placeholder: null, required: true, options: ["Tienda de hotel", "Lodge", "Cafetería o restaurante", "Tienda de souvenirs", "Agencia de tours", "Otro"], value: null, helperText: null },
      { id: "province", label: "Provincia", type: "select", placeholder: null, required: true, options: ["San José", "Alajuela", "Heredia", "Cartago", "Puntarenas", "Limón", "Guanacaste"], value: null, helperText: null },
      { id: "phone", label: "Teléfono", type: "tel", placeholder: "Teléfono", required: true, options: [], value: null, helperText: null },
      { id: "email", label: "Email", type: "email", placeholder: "Email", required: true, options: [], value: null, helperText: null },
      { id: "message", label: "Mensaje", type: "textarea", placeholder: "Mensaje", required: false, options: [], value: null, helperText: null },
    ],
  },
  location: contactDetails.address,
  links: [
    { label: contactDetails.wholesaleEmail, href: contactDetails.wholesaleEmailHref },
    { label: contactDetails.wholesalePhone, href: contactDetails.wholesalePhoneHref },
    { label: "Facebook", href: contactDetails.facebookHref },
    { label: "Instagram", href: contactDetails.instagramHref },
    { label: "Envelope", href: contactDetails.wholesaleEmailHref },
    { label: "Whatsapp", href: contactDetails.wholesaleWhatsappHref },
    { label: "Map-marker-alt", href: null },
  ],
};

export const employmentPage: FormPage = {
  route: "/oferta-de-empleo/",
  title: "Oferta de empleo",
  browserTitle: `Oferta de empleo · ${brand.name}`,
  seoDescription: null,
  assets: [
    { src: "/assets/escena/equipo-selva-y-sal.svg", alt: "" },
    { src: "/assets/escena/detalle-bosque.svg", alt: "" },
  ],
  heading: "Buscamos guía naturalista (temporada alta)",
  introduction: [
    `Contrato de temporada, de diciembre a abril, con base en La Fortuna. Se pide certificación del ICT vigente, inglés conversacional y experiencia en senderos. Complete el formulario o mándenos el currículum a ${contact.jobsEmail}.`,
  ],
  form: {
    sourceName: "Empleo",
    submitLabel: "Enviar",
    fields: [
      ...contactFields.slice(0, 4),
      { id: "cv", label: "Currículum", type: "file", placeholder: null, required: true, options: [], value: null, helperText: null },
      contactFields[4],
    ],
  },
  location: contactDetails.address,
  links: generalContactLinks.slice(2),
};

export const contactPage: FormPage = {
  route: "/contacto/",
  title: "Contacto",
  browserTitle: `Contacto · ${brand.name}`,
  seoDescription: null,
  assets: [{ src: "/assets/escena/tienda-la-fortuna.svg", alt: "La tienda de La Fortuna" }],
  heading: "Contáctenos",
  introduction: [
    `Estamos en La Fortuna, de lunes a sábado de 7:00 a 18:00. Escríbanos a ${contact.email} o llame al ${contact.phone}. También puede completar el formulario y le respondemos a la brevedad.`,
  ],
  form: { sourceName: "Contacto", submitLabel: "Enviar", fields: contactFields },
  location: contactDetails.address,
  links: generalContactLinks,
};

export const notFoundPage = { route: "/__404__/", title: "Página no encontrada", status: 404, paragraphs: [] as string[], assets: [] as PublicAsset[] };

export const termsPage = {
  route: "/terminos/",
  title: "Términos de uso",
  browserTitle: `Términos de uso · ${brand.name}`,
  seoDescription: null,
  assets: [] as PublicAsset[],
  heading: "Términos de uso",
  paragraphs: [
    "Este sitio es una demostración técnica. Las reservas, el carrito, la cuenta y el pago son simulaciones que se resuelven en el propio navegador: no se cobra nada, no se aparta ninguna plaza y no se envía información a ningún servidor.",
  ],
  paragraphsContinued: [
    "Lo que sí describe con exactitud es el recorrido de compra completo, de la portada al acuse de pedido, para poder evaluarlo antes de construir la versión real.",
  ],
  firstExample: [
    "Marca ficticia. Selva y Sal, su catálogo, sus precios y sus datos de contacto son invención de Elysium λ para esta demostración.",
  ],
  firstExampleContinued:
    "Cualquier parecido con una empresa existente es casual y no intencionado.",
  secondExampleIntroduction: "Sobre los datos que introduzca:",
  secondExample:
    "Los formularios validan el formato en el navegador y muestran el acuse, pero descartan el contenido en cuanto se recarga la página.",
  secondExampleContinued:
    "El carrito y las preferencias de lectura se guardan solo en este dispositivo y se pueden borrar desde los ajustes del sistema, en el pie de página.",
  closing:
    "Para hablar de una implantación real de este recorrido, escriba a Elysium λ Development & Research.",
  links: [{ label: "elysiumdr.eu", href: "https://elysiumdr.eu" }],
};

export const internationalShippingPage: FormPage = {
  route: "/envio-internacional/",
  title: "Envío internacional",
  browserTitle: `Envío internacional · ${brand.name}`,
  seoDescription:
    "Consultas de envío fuera de Costa Rica para la línea de recuerdos de Selva y Sal.",
  assets: [{ src: "/assets/escena/promo-temporada.svg", alt: "" }],
  heading: "Envío internacional",
  introduction: [
    `Enviamos fuera de Costa Rica bajo cotización: el coste depende del peso y del destino, y las piezas de cerámica viajan con embalaje reforzado. Escríbanos a ${contact.email} o al ${contact.phone}, o complete el formulario.`,
  ],
  form: {
    sourceName: "Envío internacional",
    submitLabel: "Enviar",
    fields: [
      { id: "name", label: "Nombre", type: "text", placeholder: "Nombre", required: true, options: [], value: null, helperText: null },
      { id: "last-name", label: "Apellidos", type: "text", placeholder: "Apellidos", required: true, options: [], value: null, helperText: null },
      { id: "identification", label: "Documento de identidad o pasaporte", type: "text", placeholder: "Documento", required: true, options: [], value: null, helperText: null },
      { id: "country", label: "País o región", type: "text", placeholder: "País o región", required: false, options: [], value: null, helperText: null },
      { id: "province", label: "Provincia o estado", type: "text", placeholder: "Provincia o estado", required: true, options: [], value: null, helperText: null },
      { id: "address", label: "Dirección exacta", type: "text", placeholder: "Dirección exacta", required: true, options: [], value: null, helperText: null },
      { id: "address-extra", label: "Casa, apartamento, etc.", type: "text", placeholder: "Casa, apartamento, etc.", required: true, options: [], value: null, helperText: null },
      { id: "postal-code", label: "Código postal", type: "text", placeholder: "Código postal", required: true, options: [], value: null, helperText: null },
      { id: "phone", label: "Teléfono", type: "tel", placeholder: "Teléfono", required: true, options: [], value: null, helperText: null },
      { id: "email", label: "Email", type: "email", placeholder: "Email", required: true, options: [], value: null, helperText: null },
      {
        id: "message",
        label: "Mensaje (qué artículos le interesan)",
        type: "textarea",
        placeholder: "Qué artículos le interesan",
        required: false,
        options: [],
        value: null,
        helperText: null,
      },
    ],
  },
  location: null,
  links: [
    { label: contactDetails.email, href: contactDetails.emailHref },
    { label: contactDetails.phone, href: contactDetails.phoneHref },
  ],
};

export const wholesaleCatalogPage = {
  route: "/catalogos-mayoreo/",
  title: "Catálogos de mayoreo",
  browserTitle: `Catálogos de mayoreo · ${brand.name}`,
  seoDescription:
    "Los catálogos de mayoreo de Selva y Sal, por familia de producto, para comercios y puntos de venta.",
  assets: [
    { src: "/assets/escena/promo-mayoreo.svg", alt: "" },
    siteAssets.logo,
    { src: "/assets/escena/tienda-la-fortuna.svg", alt: "" },
  ],
  entries: [
    { title: "Catálogo Textiles", href: "/product-category/textiles/", image: null },
    { title: "Catálogo Peluches", href: "/product-category/peluches/", image: null },
    { title: "Catálogo Cerámica", href: "/product-category/ceramica/", image: null },
    { title: "Catálogo Café y cacao", href: "/product-category/cafe-y-cacao/", image: null },
    { title: "Catálogo Artesanía", href: "/product-category/artesania/", image: null },
    { title: "Catálogo Accesorios", href: "/tienda/", image: null },
  ] satisfies CatalogEntry[],
  contactHeading: "Contáctenos",
  contactIntroduction: `Escríbanos a ${contact.wholesaleEmail} o llame al ${contact.wholesalePhone}. También puede completar el formulario y le respondemos en un día hábil.`,
  form: { sourceName: "Catálogos de mayoreo", submitLabel: "Enviar", fields: contactFields },
  location: contactDetails.address,
  links: generalContactLinks,
};

export const retailCatalogPage = {
  route: "/catalogos-detalle/",
  title: "Catálogos de tienda",
  browserTitle: `Catálogos de tienda · ${brand.name}`,
  seoDescription:
    "Los catálogos de venta al detalle de Selva y Sal: expediciones y línea de recuerdos.",
  assets: [
    { src: "/assets/escena/tienda-la-fortuna.svg", alt: "" },
    { src: "/assets/escena/categoria-textiles.svg", alt: "" },
    siteAssets.logo,
  ],
  entries: [
    { title: "Catálogo Expediciones", href: "/expediciones/", image: null },
    { title: "Catálogo Textiles", href: "/product-category/textiles/", image: null },
    { title: "Catálogo Peluches", href: "/product-category/peluches/", image: null },
    { title: "Catálogo Cerámica", href: "/product-category/ceramica/", image: null },
    { title: "Catálogo Café y cacao", href: "/product-category/cafe-y-cacao/", image: null },
  ] as CatalogEntry[],
  contactHeading: "Contáctenos",
  contactIntroduction: `Escríbanos a ${contact.email} o llame al ${contact.phone}. También puede completar el formulario y le respondemos a la brevedad.`,
  form: { sourceName: "Catálogos de tienda", submitLabel: "Enviar", fields: contactFields },
  location: contactDetails.address,
  links: generalContactLinks,
};

export const siteContent = {
  identity: { assets: siteAssets, contact: contactDetails },
  pages: { home: homePage, about: aboutPage, expeditions: expeditionsPage, blog: blogIndexPage, contact: contactPage },
  articles: blogArticles,
  forms: {
    requestCatalog: requestCatalogPage,
    tradeShow: tradeShowPage,
    wholesaleRegistration: wholesaleRegistrationPage,
    employment: employmentPage,
    internationalShipping: internationalShippingPage,
  },
  catalogs: { wholesale: wholesaleCatalogPage, retail: retailCatalogPage },
  utility: { terms: termsPage, notFound: notFoundPage },
};
