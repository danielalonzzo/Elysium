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
  logo: {
    src: "https://regalarte.cr/wp-content/uploads/2025/02/logo-horizontal.webp",
    alt: "",
  },
  favicon: {
    src: "https://regalarte.cr/wp-content/uploads/2025/08/cropped-ico-regalarter-192x192.webp",
    alt: "",
  },
} satisfies Record<string, PublicAsset>;

export const contactDetails = {
  email: "info@regalartecr.com",
  emailHref: "mailto:info@regalartecr.com",
  brokenFooterEmailHref: "mailto:inforegalartecr.com",
  phone: "+506 8520-9833",
  phoneHref: "https://wa.link/elptvj",
  wholesalePhone: "+506 2253-5340",
  wholesalePhoneHref: "https://wa.link/k86j1k",
  address:
    "Barrio los Yoses Sur, 375mts Sur de Ambacar, San Pedro, San Jose, Costa Rica",
  facebookHref: "https://www.facebook.com/regalarte2014",
  instagramHref: "https://www.instagram.com/regalarte.sa/",
  wazeHref:
    "https://ul.waze.com/ul?place=ChIJ46_ISnjjoI8Rk_ClhlKyQBU&ll=9.92783190%2C-84.05950310&navigate=yes&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location",
  mapsHref: "https://maps.app.goo.gl/pqN5kHNHcvgR2LFs9",
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
  { label: "Envelope", href: contactDetails.brokenFooterEmailHref },
  { label: "Whatsapp", href: contactDetails.phoneHref },
  { label: "Waze", href: contactDetails.wazeHref },
  { label: "Map-marker-alt", href: contactDetails.mapsHref },
];

export const homePage = {
  route: "/",
  title: "Inicio",
  browserTitle: "Inicio - Regalarte",
  seoDescription:
    "Líderes en souvenirs de Costa Rica, ofrecemos una amplia variedad de productos auténticos, inspirados en la cultura y la fauna costarricense",
  assets: [siteAssets.logo],
  slides: [
    {
      heading: "Souvenirs de Costa Rica",
      description:
        "Nuestros souvenirs, inspirados en la fauna costarricense, son más que simples juguetes; son herramientas educativas que reflejan la asombrosa biodiversidad de nuestro país.",
      action: { label: "Ver más", href: "https://regalarte.cr/product-category/peluches/" },
      image: { src: null, alt: "peluches web 100 700 px hfffinal" },
    },
    {
      heading: "Textil",
      description:
        "Contamos con una amplia variedad de productos textiles, incluyendo camisetas, hoodies, sudaderas, abrigos y mucho más.",
      action: { label: "Ver más", href: "https://regalarte.cr/product-category/textiles/" },
      image: { src: null, alt: "camisas web 100 700 px hff" },
    },
    {
      heading: "Peluches",
      description:
        "Nuestros peluches, inspirados en la fauna costarricense, son más que simples juguetes; son herramientas educativas que reflejan la asombrosa biodiversidad de nuestro país.",
      action: { label: "Ver más", href: "https://regalarte.cr/tienda/" },
      image: { src: null, alt: "peluches web 100 700 px hf cel" },
    },
    {
      heading: "Textil",
      description:
        "Contamos con una amplia variedad de productos textiles, incluyendo camisetas, hoodies, sudaderas, abrigos y mucho más.",
      action: { label: "Ver más", href: "https://regalarte.cr/tienda/" },
      image: { src: null, alt: "camisas web 100 700 px hff cel" },
    },
  ],
  metrics: [
    { label: "Clientes en\nCosta Rica", value: 400, prefix: "+", suffix: "" },
    { label: "Años de\nExperiencia", value: 20, prefix: "+", suffix: "" },
    { label: "Cobertura\nNacional", value: 100, prefix: "%", suffix: "" },
  ],
  categories: [
    { title: "Gorras", image: { src: "https://regalarte.cr/wp-content/uploads/2025/02/gorras-1024x1024.webp", alt: "" }, href: null },
    { title: "Textil", image: { src: "https://regalarte.cr/wp-content/uploads/2025/02/textil-1024x1024.webp", alt: "" }, href: null },
    { title: "Peluches", image: { src: "https://regalarte.cr/wp-content/uploads/2025/02/peluches-1024x1024.webp", alt: "" }, href: null },
    { title: "Esferas", image: { src: "https://regalarte.cr/wp-content/uploads/2025/02/esferas-1024x1024.webp", alt: "" }, href: null },
    { title: "Shots", image: { src: "https://regalarte.cr/wp-content/uploads/2025/02/shots-1024x1024.webp", alt: "" }, href: null },
    { title: "Souvenirs", image: { src: "https://regalarte.cr/wp-content/uploads/2025/02/imanes-1024x1024.webp", alt: "" }, href: null },
  ],
  promotions: [
    {
      title: "Descuentos & Promociones en Souvenirs",
      description:
        "Aproveche nuestros precios especiales de temporada y adquiera una selección exclusiva de souvenirs a tarifas reducidas. Oferta válida únicamente para compras al por mayor.",
      action: {
        label: "Explorar",
        href: "https://www.canva.com/design/DAG6ebwEnAY/P0q7SRutFWob7b5GCVit9Q/view?utm_content=DAG6ebwEnAY&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h026951cd8a",
      },
      image: { src: "https://regalarte.cr/wp-content/uploads/2026/01/DISENO_WEB-1024x1024.webp", alt: "" },
    },
    {
      title: "Precios especiales para compras al por mayor",
      description:
        "Descubre nuestros precios mayoristas y accede a una amplia gama de souvenirs ideales para tu tienda o negocio.",
      action: { label: "Explorar", href: "https://regalarte.cr/inscripcion-mayoreo/" },
      image: { src: "https://regalarte.cr/wp-content/uploads/2025/05/souvenirs-regalarte-1024x1024.webp", alt: "" },
    },
  ],
};


export const aboutPage = {
  route: "/nosotros/",
  title: "Nosotros",
  browserTitle: "Nosotros - Regalarte",
  seoDescription: null,
  assets: [
    { src: "/assets/uploads/2025/02/nosotros-2-600x600.png", alt: "" },
    { src: "https://regalarte.cr/wp-content/uploads/2025/02/Regalarte-ambiental-681x1024.webp", alt: "" },
    { src: "https://regalarte.cr/wp-content/uploads/2025/11/patroconador-bronce.png", alt: "" },
  ],
  introduction:
    "Regalarte de las Américas es una empresa líder en la comercialización de productos de souvenir en Costa Rica, con presencia en todo el territorio nacional. Con más de 20 años de experiencia, nos destacamos por nuestra constante innovación y diversificación de productos, diseñados para satisfacer las necesidades y deseos de nuestros clientes.",
  panels: [
    {
      title: "Misión",
      paragraphs: [
        "Nuestra misión en Regalarte de las Américas es proporcionar a nuestros clientes una amplia gama de productos de souvenir que representen la rica cultura y belleza de Costa Rica. Nos dedicamos a ofrecer un servicio excepcional, asegurando que cada cliente encuentre el recuerdo perfecto para atesorar sus experiencias y compartir su amor por nuestro país. Nos enfocamos en la expansión y la diversificación de nuestra cartera de clientes, buscando nuevas oportunidades de negocio y colaboraciones estratégicas que nos permitan crecer y fortalecer nuestra presencia en el mercado. Valoramos la innovación, la calidad y la satisfacción del cliente, trabajando con pasión y dedicación para superar sus expectativas y ser su primera opción en souvenirs.",
      ],
      items: [],
    },
    {
      title: "Visión",
      paragraphs: [
        "En Regalarte de las Américas, aspiramos a ser la empresa líder en la comercialización de productos de souvenir en Costa Rica y expandir nuestra presencia a nivel internacional. Con más de 20 años de experiencia, buscamos continuamente innovar y diversificar nuestros productos para satisfacer las necesidades y deseos de nuestros clientes, creando recuerdos inolvidables que conectan a las personas con nuestro país. Nos comprometemos a ofrecer productos de alta calidad, únicos y personalizados.",
      ],
      items: [],
    },
    {
      title: "Valores",
      paragraphs: [],
      items: ["Calidad", "Integridad", "Innovación", "Sostenibilidad", "Servicio al Cliente", "Colaboración", "Responsabilidad Social", "Pasión por la Cultura"],
    },
  ],
  sponsorHeading: "Somos Patrocinadores Bronce de Rescate Wildlife Rescue Center",
  environmentalHeading: "Compromiso Ambiental",
  environmentalCommitment: [
    "En Regalarte, nos inspira la riqueza natural de Costa Rica y queremos contribuir a su conservación a través de la educación y el apoyo a iniciativas ambientales.",
    "Nuestros peluches, diseñados con inspiración en la fauna local, no solo representan especies emblemáticas del país, sino que también buscan generar conciencia sobre su importancia y protección. Creemos que cada producto puede ser una oportunidad para educar y fomentar el amor por la naturaleza.",
    "Además, demostramos nuestro compromiso apoyando campañas ambientales y colaborando con iniciativas que trabajan por la preservación de los ecosistemas y la biodiversidad de Costa Rica. A través de estas acciones, queremos ser parte del cambio y motivar a más personas a sumarse a la protección del medioambiente.",
  ],
};

export const laSelePage = {
  route: "/la-sele/",
  title: "La Sele",
  browserTitle: "La Sele - Regalarte",
  seoDescription: "Adquiera los productos oficiales de la Selección Nacional de Costa Rica",
  assets: [],
  heading: "Productos Oficiales de La Sele",
  hero: { src: "https://regalarte.cr/wp-content/uploads/2026/03/banner-la-sele-nuevo.webp", alt: "" },
  products: [
    {
      id: 2423,
      name: "Botella La Sele",
      price: "₡13.560",
      href: "https://regalarte.cr/product/botella-la-sele/",
      image: { src: "https://regalarte.cr/wp-content/uploads/2026/03/botella-1.webp", alt: "" },
      actionLabel: "Añadir al carrito",
      actionHref:
        "/la-sele/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPNTY3MDY3MzQzMzUyNDI3AAGnzCFm5rzc3PFJi7jn8ZOLLh8oKZtqVhP7Qy0RWEpckgfyey9Y9swj4sbre3E_aem_MEbcnkfkmHRm80BY6lx3-Q&add-to-cart=2423",
    },
    {
      id: 2413,
      name: "Bufanda La Sele",
      price: "₡11.300",
      href: "https://regalarte.cr/product/bufanda-la-sele/",
      image: {
        src: "https://regalarte.cr/wp-content/uploads/2026/03/bufanda-1.webp",
        alt: "Bufanda La Sele, texto oe oe ticos y escudo de la selección nacional",
      },
      actionLabel: "Añadir al carrito",
      actionHref:
        "/la-sele/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPNTY3MDY3MzQzMzUyNDI3AAGnzCFm5rzc3PFJi7jn8ZOLLh8oKZtqVhP7Qy0RWEpckgfyey9Y9swj4sbre3E_aem_MEbcnkfkmHRm80BY6lx3-Q&add-to-cart=2413",
    },
    {
      id: 1412,
      name: "Sudadera La Sele Azul",
      price: "₡33.900",
      href: "https://regalarte.cr/product/sudadera-la-sele-azul/",
      image: { src: "https://regalarte.cr/wp-content/uploads/2025/09/abrigo-azul-provisional-web.webp", alt: "" },
      actionLabel: "Seleccionar opciones",
      actionHref: "https://regalarte.cr/product/sudadera-la-sele-azul/",
    },
    {
      id: 1381,
      name: "Sudadera La Sele Roja",
      price: "₡33.900",
      href: "https://regalarte.cr/product/sudadera-la-sele-roja/",
      image: { src: "https://regalarte.cr/wp-content/uploads/2025/09/hoodie-roja-provisional.webp", alt: "" },
      actionLabel: "Seleccionar opciones",
      actionHref: "https://regalarte.cr/product/sudadera-la-sele-roja/",
    },
    {
      id: 1353,
      name: "Camiseta La Sele Blanca",
      price: "₡14.900",
      href: "https://regalarte.cr/product/camiseta-la-sele-blanca/",
      image: { src: "https://regalarte.cr/wp-content/uploads/2025/09/Camisa-Blanca-FCRF.webp", alt: "" },
      actionLabel: "Seleccionar opciones",
      actionHref: "https://regalarte.cr/product/camiseta-la-sele-blanca/",
    },
    {
      id: 1350,
      name: "Camiseta La Sele Negra",
      price: "₡14.900",
      href: "https://regalarte.cr/product/camiseta-la-sele-negra/",
      image: { src: "https://regalarte.cr/wp-content/uploads/2025/09/Camisa-Negra-FCRF.webp", alt: "" },
      actionLabel: "Seleccionar opciones",
      actionHref: "https://regalarte.cr/product/camiseta-la-sele-negra/",
    },
  ],
  campaign: {
    heading: "Compre y gane con La Sele y Regalarte",
    paragraphs: [
      "Al realizar cualquier compra en nuestra tienda en línea, automáticamente participará en el sorteo de entradas para el partido Costa Rica vs Honduras, el próximo lunes 18 de Noviembre a las 7:00 p.m. en el Estadio Nacional. Además, podrá ganar productos oficiales de la Selección Nacional de Costa Rica.",
      "El sorteo se realizará el 15 de Noviembre a las 7:00 p. m. Los ganadores serán contactados únicamente a través del correo oficial info@regalartecr.com. ⚠️ Nunca solicitaremos datos de tarjetas u otra información confidencial.",
    ],
    countdown: [
      { label: "Días", value: 0 },
      { label: "Horas", value: 0 },
      { label: "Minutos", value: 0 },
      { label: "Segundos", value: 0 },
    ],
    closing: "¡Vamos Ticos!",
    image: { src: "https://regalarte.cr/wp-content/uploads/2025/09/perezoso-regalarte.webp", alt: "" },
  },
};

export const blogIndexPage = {
  route: "/blog/",
  title: "Blog",
  browserTitle: "Blog - Regalarte",
  seoDescription: null,
  assets: [],
  heading: "Blog",
  cards: [
    {
      title: "Souvenirs de Costa Rica",
      excerpt:
        "Costa Rica es mucho más que playas paradisíacas, volcanes activos, selvas tropicales y biodiversidad. Cada viaje deja recuerdos inolvidables, y",
      href: "https://regalarte.cr/souvenirs-de-costa-rica/",
      image: { src: "https://regalarte.cr/wp-content/uploads/2025/02/peluches-web-100-700-px-h-1024x373.webp", alt: "" },
      actionLabel: "Leer más »",
    },
    {
      title: "Tucánes de Costa Rica",
      excerpt:
        "Costa Rica alberga una biodiversidad impresionante, y entre sus habitantes más llamativos están los tucanes: aves de colores vibrantes y",
      href: "https://regalarte.cr/tucanes-de-costa-rica/",
      image: { src: "https://regalarte.cr/wp-content/uploads/2025/04/tucanes-de-costa-rica-1024x403.webp", alt: "" },
      actionLabel: "Leer más »",
    },
    {
      title: "Guacamaya Escarlata",
      excerpt:
        "Con su plumaje rojo brillante, alas azules y toques de amarillo, la guacamaya escarlata (Ara macao) es una de las",
      href: "https://regalarte.cr/guacamaya-escarlata/",
      image: { src: "https://regalarte.cr/wp-content/uploads/2025/04/Guacamaya-roja-1024x403.webp", alt: "" },
      actionLabel: "Leer más »",
    },
    {
      title: "Perezosos de Costa Rica",
      excerpt:
        "Si alguna vez has caminado por los bosques lluviosos de Costa Rica, es muy probable que hayas levantado la mirada con la esperanza de ver una figura peluda colgando de un árbol.",
      href: "https://regalarte.cr/perezosos-de-costa-rica/",
      image: { src: "https://regalarte.cr/wp-content/uploads/2025/04/perezoso-costa-rica-1024x403.webp", alt: "" },
      actionLabel: "Leer más »",
    },
  ],
};

const firstEditorialProductSlugs = [
  "perezoso-acostado",
  "cuellera-mapache",
  "cuellera-perezoso",
  "cuellera-c-perezoso",
  "cuellera-c-mapache",
  "botella-la-sele",
  "bufanda-la-sele",
  "jacket-impermeable-cr",
  "jacket-impermeable-brujula",
  "jacket-impermeable-montanas",
];

const secondEditorialProductSlugs = [
  "perezoso-acostado",
  "cuellera-mapache",
  "cuellera-perezoso",
  "cuellera-c-perezoso",
  "cuellera-c-mapache",
  "peluche-j-m-15cm",
  "peluche-mapache-perezoso-15cm",
  "peluche-mapache-perezoso",
  "peluche-jaguar-mono",
  "perezoso-bruno-con-hoja",
];

export const blogArticles: BlogArticle[] = [
  {
    route: "/perezosos-de-costa-rica/",
    slug: "perezosos-de-costa-rica",
    title: "Perezosos de Costa Rica",
    browserTitle: "Perezosos de Costa Rica - Regalarte",
    seoDescription:
      "Si alguna vez has caminado por los bosques lluviosos de Costa Rica, es muy probable que hayas levantado la mirada con la esperanza de ver una figura peluda colgando de un árbol.",
    publishedAt: "2025-04-22T19:58:27+00:00",
    modifiedAt: "2025-04-22T23:33:26+00:00",
    assets: [],
    hero: { src: "https://regalarte.cr/wp-content/uploads/2025/04/perezoso-costa-rica-scaled.webp", alt: "" },
    introduction: [
      "Si alguna vez has caminado por los bosques lluviosos de Costa Rica, es muy probable que hayas levantado la mirada con la esperanza de ver una figura peluda colgando de un árbol. Se mueven despacio, casi como si el tiempo no los tocara, y son uno de los animales más queridos por locales y visitantes: los perezosos.",
    ],
    sections: [
      {
        heading: "🦥 ¿Cuántas especies hay en Costa Rica?",
        paragraphs: [
          "En Costa Rica habitan dos especies de perezosos:",
          "Ambos tienen adaptaciones increíbles que les permiten sobrevivir en las copas de los árboles, moviéndose con lentitud para conservar energía y evitar ser detectados por depredadores.",
        ],
        items: [
          "Perezoso de dos dedos (Choloepus hoffmanni): Más grande, de pelaje rubio o marrón claro, y activo tanto de día como de noche.",
          "Perezoso de tres dedos (Bradypus variegatus): De tamaño más pequeño, con un característico “antifaz” oscuro y una sonrisa permanente.",
        ],
        image: { src: "https://regalarte.cr/wp-content/uploads/2025/04/perezoso-de-3-dedos.webp", alt: "" },
        caption: "Perezoso de Tres dedos",
        productSlugs: firstEditorialProductSlugs,
      },
      {
        heading: "🔍 ¿Por qué son tan lentos?",
        paragraphs: [
          "La lentitud del perezoso es una estrategia de supervivencia. Su metabolismo es muy bajo, y su dieta —basada principalmente en hojas— no les da mucha energía. Pero esa lentitud los hace casi invisibles a muchos depredadores.",
          "Además, su pelaje alberga algas verdes y pequeños insectos, lo que les ayuda a camuflarse aún más entre las ramas.",
        ],
        items: [],
        image: null,
        caption: null,
        productSlugs: [],
      },
      {
        heading: "⚠️ Amenazas y conservación",
        paragraphs: [
          "Aunque son adorables, los perezosos enfrentan grandes peligros:",
          "Por eso, es vital apoyar iniciativas de conservación y elegir experiencias turísticas responsables.",
        ],
        items: [
          "Pérdida de hábitat: La deforestación fragmenta los bosques y los expone a carreteras y líneas eléctricas.",
          "Mascotismo y selfies: Muchos perezosos son sacados de su hábitat para ser usados como atracción turística. Esto es ilegal y muy dañino para su salud.",
        ],
        image: { src: "https://regalarte.cr/wp-content/uploads/2025/04/Perezoso-de-2-dedos.webp", alt: "" },
        caption: "Perezoso de dos dedos",
        productSlugs: [],
      },
      {
        heading: "🌎 ¿Qué podemos hacer?",
        paragraphs: [],
        items: [
          "Apoyar santuarios certificados que trabajan por su bienestar.",
          "No tocarlos ni tomarse fotos con ellos.",
          "Difundir información real sobre su biología y conservación.",
          "Promover la reforestación y los corredores biológicos.",
        ],
        image: null,
        caption: null,
        productSlugs: [],
      },
    ],
  },
  {
    route: "/guacamaya-escarlata/",
    slug: "guacamaya-escarlata",
    title: "Guacamaya Escarlata",
    browserTitle: "Guacamaya Escarlata - Regalarte",
    seoDescription: null,
    publishedAt: "2025-04-22T23:35:17+00:00",
    modifiedAt: "2025-04-28T23:22:47+00:00",
    assets: [],
    hero: { src: "https://regalarte.cr/wp-content/uploads/2025/04/Guacamaya-roja-scaled.webp", alt: "" },
    introduction: [
      "Con su plumaje rojo brillante, alas azules y toques de amarillo, la guacamaya escarlata (Ara macao) es una de las aves más espectaculares que habitan los cielos de Costa Rica. Verla volar en pareja sobre la selva tropical es una experiencia inolvidable, y un símbolo vivo del esplendor natural del país.",
    ],
    sections: [
      {
        heading: "📍 ¿Dónde habita en Costa Rica?",
        paragraphs: [
          "Aunque alguna vez fue común en gran parte del país, hoy en día la guacamaya escarlata se encuentra principalmente en:",
          "Suelen desplazarse en parejas o pequeños grupos, y son fáciles de reconocer por sus colores intensos y su potente graznido.",
        ],
        items: [
          "Península de Osa y Parque Nacional Corcovado",
          "Caribe Sur (Cahuita, Gandoca-Manzanillo)",
          "Zona de Tárcoles y Carara, gracias a esfuerzos de reintroducción",
          "La región de Sarapiquí, donde hay programas de conservación activos",
        ],
        image: { src: "https://regalarte.cr/wp-content/uploads/2025/04/guacamaya-roja-2.webp", alt: "" },
        caption: "Guacamaya Escarlata (Ara Macao)",
        productSlugs: firstEditorialProductSlugs,
      },
      {
        heading: "🐦 Características y comportamiento",
        paragraphs: [
          "Son aves inteligentes y sociales, con una personalidad juguetona. Pueden vivir más de 40 años en libertad.",
        ],
        items: [
          "Tamaño: Hasta 85 cm de largo, incluida su larga cola.",
          "Vida en pareja: Forman vínculos de por vida y suelen verse siempre en dúo.",
          "Dieta: Frutas, semillas, nueces y algunos brotes tiernos.",
          "Nidificación: Anidan en cavidades de árboles grandes, lo que las hace vulnerables a la pérdida de bosque primario.",
        ],
        image: null,
        caption: null,
        productSlugs: [],
      },
      {
        heading: "⚠️ Amenazas y conservación",
        paragraphs: ["La guacamaya escarlata enfrenta serios desafíos:"],
        items: [
          "Pérdida de hábitat: La tala de árboles viejos y grandes limita sus sitios de anidación.",
          "Tráfico ilegal: Son víctimas del comercio ilegal de fauna silvestre, especialmente para el mercado de mascotas.",
          "Caza y perturbación humana: A pesar de ser protegidas, aún son perseguidas en algunas zonas.",
        ],
        image: { src: "https://regalarte.cr/wp-content/uploads/2025/04/Guacamaya-alas.webp", alt: "" },
        caption: "Plumaje Guacamaya Escarlata",
        productSlugs: [],
      },
      {
        heading: "🌱 Acciones de conservación en Costa Rica",
        paragraphs: [
          "Costa Rica ha sido pionera en proteger a estas majestuosas aves mediante:",
          "Gracias a estas acciones, las poblaciones han comenzado a recuperarse lentamente.",
        ],
        items: [
          "Proyectos de reintroducción, como los realizados por Asociación Ara y Macaw Recovery Network.",
          "Educación ambiental en comunidades cercanas a hábitats críticos.",
          "Leyes estrictas contra el tráfico de fauna silvestre.",
          "Turismo responsable enfocado en la observación de aves (birdwatching).",
        ],
        image: null,
        caption: null,
        productSlugs: [],
      },
      {
        heading: "🌍 ¿Cómo ayudar a las guacamayas?",
        paragraphs: [],
        items: [
          "Nunca compres animales silvestres ni productos derivados.",
          "Apoya proyectos de conservación locales.",
          "Si haces tours, elige guías certificados y comprometidos con la naturaleza.",
          "Planta árboles nativos si tienes espacio o apoya campañas de reforestación.",
        ],
        image: null,
        caption: null,
        productSlugs: [],
      },
    ],
  },
  {
    route: "/tucanes-de-costa-rica/",
    slug: "tucanes-de-costa-rica",
    title: "Tucánes de Costa Rica",
    browserTitle: "Tucánes de Costa Rica - Regalarte",
    seoDescription: null,
    publishedAt: "2025-04-24T21:55:47+00:00",
    modifiedAt: "2025-09-02T18:19:53+00:00",
    assets: [],
    hero: { src: "https://regalarte.cr/wp-content/uploads/2025/04/tucanes-de-costa-rica-scaled.webp", alt: "" },
    introduction: [
      "Costa Rica alberga una biodiversidad impresionante, y entre sus habitantes más llamativos están los tucanes: aves de colores vibrantes y picos extravagantes que cumplen funciones ecológicas vitales en nuestros ecosistemas tropicales. A pesar de compartir una misma familia (Ramphastidae), las seis especies que habitan en el país presentan comportamientos, hábitats y adaptaciones únicas.",
      "Aquí te las presentamos con más profundidad:",
    ],
    sections: [
      {
        heading: "1. Tucán Pico Iris (Ramphastos sulfuratus)",
        paragraphs: [
          "Este es el más conocido de todos y una especie clave para el ecoturismo en Costa Rica. Su colorido pico, aunque parece pesado, está compuesto por queratina liviana con cavidades internas, lo que lo hace sorprendentemente ligero. Es altamente social y se comunica con graznidos que recuerdan a un sapo croando.",
          "🔍 Dato curioso: Aunque no lo parezca, puede regular su temperatura corporal a través de su pico, funcionando como un radiador natural.",
        ],
        items: [
          "Tamaño: Hasta 50 cm.",
          "Peso: 400-500 g",
          "Alimentación: Frutas (80%), insectos, lagartijas y huevos de otras aves.",
          "Hábitat: Bosques húmedos de baja altitud, del Caribe hasta partes del Pacífico.",
        ],
        image: { src: "https://regalarte.cr/wp-content/uploads/2025/04/tucan-pico-iris.webp", alt: "" },
        caption: "Tucán Pico Iris",
        productSlugs: secondEditorialProductSlugs,
      },
      {
        heading: "2. Tucancillo de Swainson (Pteroglossus frantzii)",
        paragraphs: [
          "Esta especie es una joya para quienes practican “birdwatching” en lugares como Monteverde y Braulio Carrillo. A diferencia de los tucanes más grandes, este arasarí es más activo y acrobático al desplazarse entre las ramas. Tiene un papel importante en la dispersión de semillas de árboles como el higuero.",
          "🔍 Dato curioso: A menudo comparte nidos con otras especies, usando huecos abandonados de pájaros carpinteros.",
        ],
        items: [
          "Tamaño: 40 cm aprox.",
          "Hábitat: Zonas de bosque húmedo premontano en ambas vertientes.",
          "Conducta: Gregario; se le ve en grupos de hasta 10 individuos.",
        ],
        image: { src: "https://regalarte.cr/wp-content/uploads/2025/04/aracari-Pteroglossus-frantzii.webp", alt: "" },
        caption: "Tucancillo de Swainson",
        productSlugs: [],
      },
      {
        heading: "3. Arasarí Fajado (Pteroglossus torquatus)",
        paragraphs: [
          "Su dieta es mayormente frugívora, pero complementa con insectos y pequeños vertebrados. Como otros tucanes, juega un papel vital como dispersor de semillas en los bosques donde habita.",
          "🔍 Dato curioso: Puede hacer nidos en grupo y turnarse para incubar huevos, mostrando un comportamiento cooperativo poco común entre aves tropicales.",
        ],
        items: [
          "Tamaño: 40 cm",
          "Diferencias con Swainson: Más robusto, con un collar negro más definido y pico más grueso.",
          "Regiones: Caribe, Golfo Dulce y algunas zonas de transición.",
        ],
        image: { src: "https://regalarte.cr/wp-content/uploads/2025/04/Pteroglossus-torquatus.webp", alt: "" },
        caption: "Pteroglossus torquatus",
        productSlugs: [],
      },
      {
        heading: "4. Tucancillo orejiamarillo (Selenidera spectabilis)",
        paragraphs: [
          "Habita en la bajura húmeda del Caribe, moviéndose en los niveles bajos del dosel, lo que lo hace un desafío para observadores. Se alimenta principalmente de frutos pequeños del sotobosque.",
          "🔍 Dato curioso: Su presencia indica buen estado de conservación del bosque primario.",
        ],
        items: [
          "Tamaño: 35 cm.",
          "Diferencia sexual: El macho tiene un collar blanco, la hembra es más opaca.",
          "Conducta: Es más solitario que otros tucanes, y muy difícil de ver.",
        ],
        image: { src: "https://regalarte.cr/wp-content/uploads/2025/04/tucancillo-orejiamarillo.webp", alt: "" },
        caption: "Selenidera spectabilis",
        productSlugs: [],
      },
      {
        heading: "5. Tucancillo Verde (Aulacorhynchus prasinus)",
        paragraphs: [
          "Es el más pequeño y silencioso del grupo, y uno de los más activos cazadores de insectos. También consume frutos, lo que lo convierte en un excelente dispersor de semillas en zonas altas.",
          "🔍 Dato curioso: Tiene un canto muy suave, similar a un murmullo, lo que hace que muchas veces pase desapercibido.",
        ],
        items: [
          "Tamaño: 30–35 cm",
          "Coloración: Verde esmeralda con líneas negras y anaranjadas en el pico.",
          "Hábitat: Bosques montanos de 1,000 a 2,500 m, como Monteverde y San Gerardo de Dota.",
        ],
        image: { src: "https://regalarte.cr/wp-content/uploads/2025/04/Aulacorhynchus-prasinus.webp", alt: "" },
        caption: "Pteroglossus torquatus",
        productSlugs: [],
      },
    ],
  },
  {
    route: "/souvenirs-de-costa-rica/",
    slug: "souvenirs-de-costa-rica",
    title: "Souvenirs de Costa Rica",
    browserTitle: "Souvenirs de Costa Rica - Regalarte",
    seoDescription: null,
    publishedAt: "2026-04-24T17:37:52+00:00",
    modifiedAt: "2026-04-24T17:52:49+00:00",
    assets: [],
    hero: { src: "https://regalarte.cr/wp-content/uploads/2025/02/peluches-web-100-700-px-h.webp", alt: "" },
    introduction: [
      "Costa Rica es mucho más que playas paradisíacas, volcanes activos, selvas tropicales y biodiversidad. Cada viaje deja recuerdos inolvidables, y una de las mejores maneras de conservar esa experiencia es a través de los souvenirs de Costa Rica, piezas que representan la cultura, la naturaleza y la esencia del país.",
      "Desde productos artesanales hasta artículos inspirados en la fauna costarricense, los souvenirs son una forma auténtica de llevarse un recuerdo especial o compartir un detalle significativo con familiares y amigos.",
      "En esta guía descubrirá cuáles son los mejores souvenirs de Costa Rica, qué representan, dónde encontrarlos y cómo elegir opciones auténticas y de calidad.",
    ],
    sections: [
      {
        heading: "Los Souvenirs Más Populares de Costa Rica",
        paragraphs: [],
        items: [],
        image: null,
        caption: null,
        productSlugs: secondEditorialProductSlugs,
      },
      {
        heading: "1. Gorras Inspiradas en Costa Rica",
        paragraphs: [
          "Las gorras son uno de los souvenirs más buscados por turistas nacionales e internacionales.",
          "Además de ser funcionales para protegerse del sol tropical, las gorras representan un accesorio práctico y moderno.",
        ],
        items: [],
        image: null,
        caption: null,
        productSlugs: ["gorra-g50", "gorra-celeste-g73", "gorra-verde-militar-g46", "gorra-negra-g11", "gorra-azul-33", "gorra-gris-g77", "gorra-negra-tiburon-g55", "gorra-negra-g51", "gorra-corcho-azul", "gorra-jeans-g66"],
      },
      {
        heading: "2. Souvenirs Inspirados en la Fauna Costarricense",
        paragraphs: ["La fauna costarricense es una de las principales razones por las cuales miles de turistas visitan el país."],
        items: [],
        image: null,
        caption: null,
        productSlugs: ["titere-perezoso-souvenir-costa-rica", "titere-mapache-souvenir-costa-rica", "figura-perezoso-con-cria-g", "figura-perezoso-con-cria", "figura-mono-en-rama", "figura-tucan-en-rama", "figura-perezoso-en-rama", "iman-perezoso-con-cria", "iman-perezoso-en-rama", "iman-perezoso-senas"],
      },
      {
        heading: "3. Tazas y Cerámica Artesanal",
        paragraphs: ["Las tazas decorativas son uno de los souvenirs más tradicionales."],
        items: [],
        image: null,
        caption: null,
        productSlugs: ["mini-jarra-lisa-oscura", "mini-jarra-lisa-azul", "mini-jarra-lisa-turqueza", "mini-jarra-lisa-rosa", "jarra-lisa-beige", "jarra-lisa-rosa", "jarra-ceramica-lisa-turqueza", "jarra-ceramica-lisa-vino"],
      },
      {
        heading: null,
        paragraphs: [
          "Los souvenirs de Costa Rica son una forma auténtica de conservar la esencia del país.",
          "Desde productos inspirados en la fauna costarricense hasta textiles, artesanías y accesorios, cada recuerdo representa una parte de la experiencia “Pura Vida”.",
          "Elegir un souvenir de calidad permite llevar consigo algo más que un objeto: una conexión con la cultura, la naturaleza y los paisajes únicos de Costa Rica.",
          "Si busca recuerdos auténticos, funcionales y representativos, Costa Rica ofrece una enorme variedad de opciones para todos los gustos.",
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
  title: "Solicitud catálogo",
  browserTitle: "Solicitud catálogo - Regalarte",
  seoDescription:
    "Somos una empresa líder en la comercialización de productos de souvenir en Costa Rica, con presencia en todo el territorio nacional. Con más de 20 años de experiencia, nos destacamos por nuestra constante innovación y diversificación de productos, diseñados para satisfacer las necesidades y deseos de nuestros clientes.",
  assets: [
    { src: "https://regalarte.cr/wp-content/uploads/2025/02/imagen-portada-scaled.webp", alt: "" },
  ],
  heading: "Solicitud Catálogo",
  introduction: [
    "Este formulario permite solicitar cambios en el catálogo, como adiciones, correcciones y otros ajustes. Te pedimos que uses este recurso de manera responsable, especialmente al solicitar la incorporación de nuevos productos, ya que este tipo de solicitudes requiere un tiempo considerable para su procesamiento.",
  ],
  form: {
    sourceName: "Solicitud Catálogo",
    submitLabel: "Enviar",
    fields: [
      { id: "requester-name", label: "Nombre Completo Solicitante", type: "text", placeholder: "Nombre Completo Solicitante", required: true, options: [], value: null, helperText: null },
      { id: "requester-email", label: "Email", type: "email", placeholder: "Email", required: true, options: [], value: null, helperText: null },
      { id: "work-area", label: "Área Laboral o Puesto", type: "text", placeholder: "Área Laboral o Puesto", required: true, options: [], value: null, helperText: null },
      { id: "catalog", label: "Catálogo a Modificar", type: "text", placeholder: "Catálogo a Modificar", required: true, options: [], value: null, helperText: null },
      {
        id: "suggestion",
        label: "Sugerencia",
        type: "select",
        placeholder: null,
        required: true,
        options: ["Ingresar Producto", "Corregir Código de Producto", "Eliminar Producto", "Modificar SKU del Producto"],
        value: null,
        helperText: null,
      },
      {
        id: "related-files",
        label: "Archivos relacionados (256mb máx) (pdf,jpg,jpeg,png,webp,doc,xlx,xls,svg)",
        type: "file",
        placeholder: null,
        required: false,
        options: [],
        value: null,
        helperText: "256mb máx (pdf,jpg,jpeg,png,webp,doc,xlx,xls,svg)",
      },
      { id: "message", label: "Mensaje", type: "textarea", placeholder: "Mensaje", required: false, options: [], value: null, helperText: null },
    ],
  },
  location: null,
  links: [],
};

export const exphorePage: FormPage = {
  route: "/exphore/",
  title: "Exphore",
  browserTitle: "Exphore - Regalarte",
  seoDescription: null,
  assets: [],
  heading: "¡Giveaway!",
  introduction: [
    "Participe en nuestro GIVEAWAY exclusivo de EXPHORE completando el siguiente formulario :",
  ],
  form: {
    sourceName: "Solicitud Catálogo",
    submitLabel: "Enviar",
    fields: [
      { id: "full-name", label: "Nombre Completo", type: "text", placeholder: "Nombre Completo", required: true, options: [], value: null, helperText: null },
      { id: "phone", label: "Teléfono", type: "tel", placeholder: "Teléfono", required: true, options: [], value: null, helperText: null },
      { id: "email", label: "Email", type: "email", placeholder: "Email", required: true, options: [], value: null, helperText: null },
      { id: "company", label: "Empresa", type: "text", placeholder: "Empresa", required: true, options: [], value: null, helperText: null },
      { id: "heard-before", label: "¿Había escuchado antes sobre nuestra empresa?", type: "select", placeholder: null, required: false, options: ["Sí", "No"], value: null, helperText: null },
      { id: "discovery", label: "¿Cómo se enteró de nuestra empresa?", type: "select", placeholder: null, required: false, options: ["Redes Sociales", "Sitio Web", "Tienda/Restaurante", "EXPHORE", "Otro"], value: null, helperText: null },
      {
        id: "marketing",
        label: "Quiero mantenerme informado sobre productos y ofertas especiales.",
        type: "checkbox",
        placeholder: null,
        required: false,
        options: [],
        value: "Quiero mantenerme informado sobre productos y ofertas especiales.",
        helperText: null,
      },
    ],
  },
  location: null,
  links: [],
};

export const wholesaleRegistrationPage: FormPage = {
  route: "/inscripcion-mayoreo/",
  title: "inscripción mayoreo",
  browserTitle: "inscripción mayoreo - Regalarte",
  seoDescription:
    "Somos una empresa líder en la comercialización de productos de souvenir en Costa Rica, con presencia en todo el territorio nacional. Con más de 20 años de experiencia, nos destacamos por nuestra constante innovación y diversificación de productos, diseñados para satisfacer las necesidades y deseos de nuestros clientes.",
  assets: [
    { src: "https://regalarte.cr/wp-content/uploads/2025/02/imagen-portada-scaled.webp", alt: "" },
    { src: "https://regalarte.cr/wp-content/uploads/2025/02/vista-para-enlaces-1-1024x538.png", alt: "Variedad de souvenirs de Costa Rica" },
  ],
  heading: "Únase a nuestra familia",
  introduction: [
    "Al completar este formulario, uno de nuestros asesores de ventas le enviará nuestros catálogos de mayoreo o coordinará una visita a su negocio para presentarle nuestra amplia gama de opciones.",
    "Estamos a su disposición. Escríbanos a info@regalartecr.com o llámenos al +506 2253-5340. También puede completar el formulario y le responderemos a la brevedad.",
  ],
  form: {
    sourceName: "Inscripción Mayoreo",
    submitLabel: "Enviar",
    fields: [
      { id: "full-name", label: "Nombre Completo", type: "text", placeholder: "Nombre", required: true, options: [], value: null, helperText: null },
      { id: "company", label: "Empresa o Negocio (opcional)", type: "text", placeholder: "Empresa o Negocio", required: false, options: [], value: null, helperText: null },
      { id: "company-type", label: "Tipo de Empresa o negocio", type: "select", placeholder: null, required: true, options: ["Souvenir", "Restaurante", "Tienda", "Otro"], value: null, helperText: null },
      { id: "province", label: "Provincia", type: "select", placeholder: null, required: true, options: ["San José", "Alajuela", "Heredia", "Cartago", "Puntarenas", "Limón", "Guanacaste"], value: null, helperText: null },
      { id: "phone", label: "Teléfono", type: "tel", placeholder: "Teléfono", required: true, options: [], value: null, helperText: null },
      { id: "email", label: "Email", type: "email", placeholder: "Email", required: true, options: [], value: null, helperText: null },
      { id: "message", label: "Mensaje", type: "textarea", placeholder: "Mensaje", required: false, options: [], value: null, helperText: null },
    ],
  },
  location: contactDetails.address,
  links: [
    { label: contactDetails.email, href: contactDetails.emailHref },
    { label: contactDetails.wholesalePhone, href: contactDetails.wholesalePhoneHref },
    { label: "Facebook", href: contactDetails.facebookHref },
    { label: "Instagram", href: contactDetails.instagramHref },
    { label: "Envelope", href: contactDetails.brokenFooterEmailHref },
    { label: "Whatsapp", href: "https://wa.link/tv29rr" },
    { label: "Waze", href: contactDetails.wazeHref },
    { label: "Map-marker-alt", href: contactDetails.mapsHref },
  ],
};

export const employmentPage: FormPage = {
  route: "/oferta-de-empleo/",
  title: "Oferta de Empleo",
  browserTitle: "Oferta de Empleo - Regalarte",
  seoDescription: null,
  assets: [
    { src: "https://regalarte.cr/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-08-at-10.54.06-PM.jpeg", alt: "" },
    { src: "https://regalarte.cr/wp-content/uploads/2025/02/vista-para-enlaces-1-1024x538.png", alt: "Variedad de souvenirs de Costa Rica" },
  ],
  heading: "Estamos Contratando: Bodeguero (Temporal)",
  introduction: [
    "Complete este formulario o, si lo prefiere, envíenos su currículum al correo electrónicorh@regalartecr.com",
  ],
  form: {
    sourceName: "Empleos",
    submitLabel: "Eviar",
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
  browserTitle: "Contacto - Regalarte",
  seoDescription: null,
  assets: [
    { src: "https://regalarte.cr/wp-content/uploads/2025/02/vista-para-enlaces-1-1024x538.png", alt: "Variedad de souvenirs de Costa Rica" },
  ],
  heading: "Contáctenos",
  introduction: [
    "Estamos a su disposición. Escríbanos a info@regalartecr.com o llámenos al +506 8520-9833. También puede completar el formulario y le responderemos a la brevedad.",
  ],
  form: { sourceName: "Contacto", submitLabel: "Eviar", fields: contactFields },
  location: contactDetails.address,
  links: generalContactLinks,
};

export const notFoundPage = { route: "/?page_id=3", title: "Page not found", status: 404, paragraphs: [] as string[], assets: [] as PublicAsset[] };

export const samplePage = {
  route: "/sample-page/",
  title: "Sample Page",
  browserTitle: "Sample Page - Regalarte",
  seoDescription: null,
  assets: [] as PublicAsset[],
  heading: "Sample Page",
  paragraphs: [
    "This is an example page. It’s different from a blog post because it will stay in one place and will show up in your site navigation (in most themes).",
  ],
  paragraphsContinued: ["Most people start with an About page that introduces them to potential site visitors. It might say something like this:"],
  firstExample: ["Hi there! I’m a bike messenger by day, aspiring actor by night, and this is my website."],
  firstExampleContinued: "I live in Los Angeles, have a great dog named Jack, and I like piña coladas. (And gettin’ caught in the rain.)",
  secondExampleIntroduction: "…or something like this:",
  secondExample: "The XYZ Doohickey Company was founded in 1971, and has been providing quality doohickeys to the public ever since.",
  secondExampleContinued: "Located in Gotham City, XYZ employs over 2,000 people and does all kinds of awesome things for the Gotham community.",
  closing: "As a new WordPress user, you should go to your dashboard to delete this page and create new pages for your content. Have fun!",
  links: [{ label: "your dashboard", href: "https://regalarte.cr/wp-admin/" }],
};

export const internationalShippingPage: FormPage = {
  route: "/envio-internacional/",
  title: "Envió internacional",
  browserTitle: "Envió internacional - Regalarte",
  seoDescription:
    "Somos una empresa líder en la comercialización de productos de souvenir en Costa Rica, con presencia en todo el territorio nacional. Con más de 20 años de experiencia, nos destacamos por nuestra constante innovación y diversificación de productos, diseñados para satisfacer las necesidades y deseos de nuestros clientes.",
  assets: [
    { src: "https://regalarte.cr/wp-content/uploads/2025/02/imagen-portada-scaled.webp", alt: "" },
  ],
  heading: "Envío internacional",
  introduction: [
    "Estamos a su disposición. Escríbanos a info@regalartecr.com o llámenos al +506 8520 9833. También puede completar el formulario y le responderemos a la brevedad.",
  ],
  form: {
    sourceName: "Envío Internacional",
    submitLabel: "Enviar",
    fields: [
      { id: "name", label: "Nombre", type: "text", placeholder: "Nombre", required: true, options: [], value: null, helperText: null },
      { id: "last-name", label: "Apellidos", type: "text", placeholder: "Nombre", required: true, options: [], value: null, helperText: null },
      { id: "identification", label: "ID (documento de identificación o pasaporte)", type: "text", placeholder: "ID", required: true, options: [], value: null, helperText: null },
      { id: "country", label: "País/Región", type: "text", placeholder: "País/Región", required: false, options: [], value: null, helperText: null },
      { id: "province", label: "Provincia/Estado", type: "text", placeholder: "Provincia/Estado", required: true, options: [], value: null, helperText: null },
      { id: "address", label: "Dirección Exacta", type: "text", placeholder: "Dirección Exacta", required: true, options: [], value: null, helperText: null },
      { id: "address-extra", label: "Casa,apartamento,etc...", type: "text", placeholder: "Casa,apartamento,etc...", required: true, options: [], value: null, helperText: null },
      { id: "postal-code", label: "Código Postal", type: "text", placeholder: "Código Postal", required: true, options: [], value: null, helperText: null },
      { id: "phone", label: "Teléfono", type: "tel", placeholder: "Teléfono", required: true, options: [], value: null, helperText: null },
      { id: "email", label: "Email", type: "email", placeholder: "Email", required: true, options: [], value: null, helperText: null },
      {
        id: "message",
        label: "Mensaje (descripción de el o los articulos seleccionados)",
        type: "textarea",
        placeholder: "Descripción de el o los articulos seleccionados",
        required: false,
        options: [],
        value: null,
        helperText: null,
      },
    ],
  },
  location: null,
  links: [
    { label: "info@regalartecr.com", href: "mailto:info@regalartecr.com" },
    { label: "+506 8520 9833", href: "https://wa.link/elptvj" },
  ],
};

export const wholesaleCatalogPage = {
  route: "/catalogos-mayoreo/",
  title: "Catálogos Mayoreo Regalarte",
  browserTitle: "Catálogos Mayoreo Regalarte - Regalarte",
  seoDescription:
    "Somos una empresa líder en la comercialización de productos de souvenir en Costa Rica, con presencia en todo el territorio nacional. Con más de 20 años de experiencia, nos destacamos por nuestra constante innovación y diversificación de productos, diseñados para satisfacer las necesidades y deseos de nuestros clientes.",
  assets: [
    { src: "https://regalarte.cr/wp-content/uploads/2025/02/imagen-portada-scaled.webp", alt: "" },
    siteAssets.logo,
    { src: "https://regalarte.cr/wp-content/uploads/2026/01/DISENO_WEB-1024x1024.webp", alt: "" },
  ],
  entries: [
    { title: "Catálogo Gorras", href: "https://www.canva.com/design/DAGfYY1HvA4/HZktDJkNvEg5x8WFaX7DDA/view?utm_content=DAGfYY1HvA4&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h79e42e231e", image: null },
    { title: "Catálogo Peluches", href: "https://www.canva.com/design/DAGP1U6oZJ8/_IbFzbbY6nmx9xWXJiIBmA/view?utm_content=DAGP1U6oZJ8&utm_campaign=designshare&utm_medium=link&utm_source=editor", image: null },
    { title: "Catálogo Souvenirs", href: "https://www.canva.com/design/DAGfYamxFOM/ALt9XYyp2PegcAf_b8spfg/view?utm_content=DAGfYamxFOM&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h526b29c64b", image: null },
    { title: "Catálogo Ropa", href: "https://www.canva.com/design/DAGjdbs-ems/MvzKxgy7rAtkJuA5I5vOlA/view?utm_content=DAGjdbs-ems&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hbb1971a250", image: null },
    { title: "Catálogo La Sele", href: "https://www.canva.com/design/DAGyuGrImC0/2sh07u4LssmaoHtXAOJGVQ/view?utm_content=DAGyuGrImC0&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h44c2090b83", image: null },
    { title: "Descuentos & Promociones", href: "https://www.canva.com/design/DAG6eSnu7a4/5CHjuE8ASA2lYVHwTmEe8A/view?utm_content=DAG6eSnu7a4&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hcab575f573", image: null },
  ] satisfies CatalogEntry[],
  contactHeading: "Contáctenos",
  contactIntroduction:
    "Estamos a su disposición. Escríbanos a info@regalartecr.com o llámenos al +506 8520-9833. También puede completar el formulario y le responderemos a la brevedad.",
  form: { sourceName: "New Form", submitLabel: "Enviar", fields: contactFields },
  location: contactDetails.address,
  links: generalContactLinks,
};

export const retailCatalogPage = {
  route: "/catalogos-detalle/",
  title: "Catálogos Detalle Regalarte",
  browserTitle: "Catálogos Detalle Regalarte - Regalarte",
  seoDescription:
    "Somos una empresa líder en la comercialización de productos de souvenir en Costa Rica, con presencia en todo el territorio nacional. Con más de 20 años de experiencia, nos destacamos por nuestra constante innovación y diversificación de productos, diseñados para satisfacer las necesidades y deseos de nuestros clientes.",
  assets: [
    { src: "https://regalarte.cr/wp-content/uploads/2025/02/vista-para-enlaces.png", alt: "" },
    { src: "https://regalarte.cr/wp-content/uploads/2025/02/vista-para-enlaces-1-1024x538.png", alt: "Variedad de souvenirs de Costa Rica" },
    siteAssets.logo,
  ],
  entries: [
    {
      title: "Catálogo Gorras",
      href: "https://www.canva.com/design/DAGTwcYxleY/bYHlXKjqcQznZietvJZPhA/view?utm_content=DAGTwcYxleY&utm_campaign=designshare&utm_medium=link&utm_source=editor",
      image: null,
    },
    {
      title: "Catálogo Peluches",
      href: "https://www.canva.com/design/DAGSQhy4pkg/GIhZY3D3K0PUGZDdyuwJAg/view?utm_content=DAGSQhy4pkg&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h400e8b18d6",
      image: null,
    },
    {
      title: "Catálogo Souvenirs",
      href: "https://www.canva.com/design/DAGS6dK-2kE/jMulFlVnvWoJ5L4Z0GpKTg/view?utm_content=DAGS6dK-2kE&utm_campaign=designshare&utm_medium=link&utm_source=editor",
      image: null,
    },
    {
      title: "Catálogo Ropa",
      href: "https://www.canva.com/design/DAGRVgCZL2E/yYXBzoR40NQw3O3d7bMKFg/view?utm_content=DAGRVgCZL2E&utm_campaign=designshare&utm_medium=link&utm_source=editor",
      image: null,
    },
    {
      title: "Catálogo La Sele",
      href: "https://regalarte.cr/la-sele/",
      image: null,
    },
  ] as CatalogEntry[],
  contactHeading: "Contáctenos",
  contactIntroduction:
    "Estamos a su disposición. Escríbanos a info@regalartecr.com o llámenos al +506 8520 9833. También puede completar el formulario y le responderemos a la brevedad.",
  form: { sourceName: "Formulario Detalle", submitLabel: "Enviar", fields: contactFields },
  location: contactDetails.address,
  links: [
    { label: contactDetails.email, href: contactDetails.emailHref },
    { label: "+506 8520 9833", href: contactDetails.phoneHref },
    ...generalContactLinks.slice(2),
  ],
};

export const siteContent = {
  identity: { assets: siteAssets, contact: contactDetails },
  pages: { home: homePage, about: aboutPage, laSele: laSelePage, blog: blogIndexPage, contact: contactPage },
  articles: blogArticles,
  forms: {
    requestCatalog: requestCatalogPage,
    exphore: exphorePage,
    wholesaleRegistration: wholesaleRegistrationPage,
    employment: employmentPage,
    internationalShipping: internationalShippingPage,
  },
  catalogs: { wholesale: wholesaleCatalogPage, retail: retailCatalogPage },
  utility: { sample: samplePage, notFound: notFoundPage },
};
