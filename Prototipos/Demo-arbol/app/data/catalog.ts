/*
 * Catálogo de `/tienda`. Marca ficticia: ver la cabecera de `content.ts`.
 *
 * `shortDescription` NO se pinta en ningún sitio: alimenta solo el índice del
 * buscador (`Shop.tsx`), que compara sobre `[name, shortDescription,
 * ...categories]` slugificado. Por eso se redacta con los términos por los que
 * alguien buscaría la pieza —material, motivo, era— y no como copy de venta.
 *
 * `price` es texto libre: `numericPrice()` extrae `/[\d.,]+/` y borra los
 * separadores, así que «₡15.000» ordena como 15000. Un precio nulo cae al final
 * en los dos órdenes por precio.
 *
 * Los `slug` son la URL de la ficha (`/tienda/<slug>`), que genera
 * `app/tienda/[slug]/page.tsx` con `generateStaticParams()`.
 */

export type CatalogProductType = "simple" | "variable" | "read-more";

export type CatalogProduct = {
  slug: string;
  name: string;
  price: string | null;
  categories: readonly string[] | null;
  type: CatalogProductType | null;
  imageUrl: string | null;
  shortDescription: string | null;
  /** Ficha técnica de la página de producto (`/tienda/<slug>`). */
  specs?: readonly string[];
};

export const catalogProducts: CatalogProduct[] = [
  {
    slug: "raiz-y-piedra-el-juego",
    name: "Raíz y Piedra · El Juego",
    price: "₡15.000",
    categories: ["Juegos"],
    type: "simple",
    imageUrl: "/images/caja-frente.svg",
    shortDescription:
      "Juego de mesa de cartas sobre la memoria de Costa Rica. Caja con forma de libro, 80 cartas ilustradas, de 2 a 6 jugadores, 11 años en adelante, partida de 15 minutos.",
    specs: [
      "80 cartas ilustradas a dos caras",
      "De 2 a 6 jugadores · 11 años en adelante",
      "Partida de 15 minutos",
      "Caja con forma de libro, 14 × 21 cm",
    ],
  },
  {
    slug: "caja-de-coleccionista",
    name: "Caja de Coleccionista",
    price: "₡28.000",
    categories: ["Juegos"],
    type: "simple",
    imageUrl: "/images/caja-coleccionista.svg",
    shortDescription:
      "Edición en madera de cenízaro con grabado de greca, las 80 cartas en canto dorado y un separador por era. Tirada numerada de 500 unidades.",
    specs: [
      "Madera de cenízaro con greca grabada",
      "80 cartas con canto dorado",
      "Cuatro separadores, uno por era",
      "Tirada numerada de 500 ejemplares",
    ],
  },
  {
    slug: "expansion-volcanes",
    name: "Expansión · Volcanes",
    price: "₡7.500",
    categories: ["Juegos"],
    type: "simple",
    imageUrl: "/images/expansion-volcanes.svg",
    shortDescription:
      "Veinte cartas nuevas sobre la cordillera volcánica: Arenal, Poás, Irazú, Turrialba y Rincón de la Vieja. Requiere el juego base.",
    specs: [
      "20 cartas nuevas",
      "Requiere el juego base",
      "Cinco volcanes de la cordillera",
    ],
  },
  {
    slug: "camiseta-guanacaste",
    name: "Camiseta Guanacaste",
    price: "₡12.000",
    categories: ["Textiles"],
    type: "variable",
    imageUrl: "/images/camiseta-guanacaste.svg",
    shortDescription:
      "Camiseta de algodón crudo con la copa del guanacaste serigrafiada en ocre. Enterolobium cyclocarpum, árbol nacional. Tallas S a XL.",
    specs: [
      "Algodón peinado 100 %, 180 g",
      "Serigrafía a una tinta",
      "Tallas S · M · L · XL",
    ],
  },
  {
    slug: "camiseta-esfera",
    name: "Camiseta Esfera del Diquís",
    price: "₡12.000",
    categories: ["Textiles"],
    type: "simple",
    imageUrl: "/images/camiseta-esfera.svg",
    shortDescription:
      "Camiseta gris jaspeado con la esfera de piedra estampada al pecho, en tinta piedra. Patrimonio Mundial desde 2014.",
    specs: [
      "Algodón jaspeado, 180 g",
      "Serigrafía a una tinta",
      "Tallas S · M · L · XL",
    ],
  },
  {
    slug: "camiseta-sabanero",
    name: "Camiseta Sabanero",
    price: "₡12.000",
    categories: ["Textiles"],
    type: "simple",
    imageUrl: "/images/camiseta-sabanero.svg",
    shortDescription:
      "Camiseta con la estampa del sabanero de la pampa guanacasteca y la cita de la sabana seca. Tinta ocre sobre tela arena.",
    specs: [
      "Algodón peinado 100 %, 180 g",
      "Serigrafía a dos tintas",
      "Tallas S · M · L · XL",
    ],
  },
  {
    slug: "bolso-grecas",
    name: "Bolso Grecas",
    price: "₡8.500",
    categories: ["Bolsos"],
    type: "simple",
    imageUrl: "/images/bolso-grecas.svg",
    shortDescription:
      "Bolso de lona cruda con el logotipo enmarcado en grecas precolombinas chorotegas. Asa larga, costura reforzada.",
    specs: [
      "Lona de algodón cruda, 340 g",
      "38 × 42 cm · asa de 60 cm",
      "Costura lateral reforzada",
    ],
  },
  {
    slug: "bolso-finca-6",
    name: "Bolso Finca 6",
    price: "₡8.500",
    categories: ["Bolsos"],
    type: "simple",
    imageUrl: "/images/bolso-finca-6.svg",
    shortDescription:
      "Bolso de lona con el plano de las alineaciones de esferas del sitio arqueológico Finca 6, en el delta del Diquís, Osa.",
    specs: [
      "Lona de algodón cruda, 340 g",
      "38 × 42 cm · asa de 60 cm",
      "Serigrafía a una tinta",
    ],
  },
  {
    slug: "gorra-greca",
    name: "Gorra Greca Bordada",
    price: "₡10.000",
    categories: ["Gorras"],
    type: "variable",
    imageUrl: "/images/gorra-greca.svg",
    shortDescription:
      "Gorra de algodón con la greca precolombina bordada al frente. Disponible en verde musgo, ocre y piedra.",
    specs: [
      "Algodón con cierre metálico",
      "Bordado en hilo de tres cabos",
      "Verde musgo · ocre · piedra",
    ],
  },
  {
    slug: "gorra-esfera",
    name: "Gorra Esfera",
    price: "₡10.000",
    categories: ["Gorras"],
    type: "simple",
    imageUrl: "/images/gorra-esfera.svg",
    shortDescription:
      "Gorra color piedra con la esfera del Diquís bordada en hilo crudo. Cierre metálico regulable.",
    specs: [
      "Algodón con cierre metálico",
      "Bordado en hilo crudo",
      "Talla única regulable",
    ],
  },
  {
    slug: "lamina-finca-6",
    name: "Lámina Finca 6",
    price: "₡9.000",
    categories: ["Papelería"],
    type: "simple",
    imageUrl: "/images/lamina-finca-6.svg",
    shortDescription:
      "Lámina serigrafiada a dos tintas sobre papel de algodón de 300 g, 30 × 40 cm. Las esferas alineadas del delta del Diquís.",
    specs: [
      "Papel de algodón de 300 g",
      "30 × 40 cm",
      "Serigrafía a dos tintas",
      "Firmada y numerada",
    ],
  },
  {
    slug: "cuaderno-de-campo",
    name: "Cuaderno de Campo",
    price: "₡6.500",
    categories: ["Papelería"],
    type: "simple",
    imageUrl: "/images/cuaderno-de-campo.svg",
    shortDescription:
      "Cuaderno cosido de 96 páginas con papel crema, tapa de cartón gris y las coordenadas de Finca 6 grabadas en seco.",
    specs: [
      "96 páginas de papel crema",
      "Cosido a hilo, abre plano",
      "Tapa de cartón gris, grabado en seco",
      "14 × 21 cm",
    ],
  },
];
