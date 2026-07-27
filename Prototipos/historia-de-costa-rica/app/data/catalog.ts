export type CatalogProductType = "simple" | "variable" | "read-more";

export type CatalogProduct = {
  slug: string;
  name: string;
  price: string | null;
  categories: readonly string[] | null;
  type: CatalogProductType | null;
  imageUrl: string | null;
  shortDescription: string | null;
};

export const catalogProducts: CatalogProduct[] = [
  {
    slug: "juego-de-mesa",
    name: "Historia de Costa Rica (El Juego)",
    price: "₡15.000",
    categories: ["Juegos"],
    type: "simple",
    imageUrl: "/images/caja-cartas-frente.png",
    shortDescription: "Caja del juego Historia de Costa Rica, con forma de libro, vista de frente. De 2 a 6 jugadores, 11 años en adelante, 80 cartas y 15 minutos."
  },
  {
    slug: "camisetas-coleccion-heroina",
    name: "Colección Camisetas Históricas",
    price: "₡12.000",
    categories: ["Textiles"],
    type: "variable",
    imageUrl: "/images/camisas-1.png",
    shortDescription: "Tres camisetas de la colección: «Heroína Nacional», «¡Libertad!» con Juan Rafael Mora Porras y la cita de Alfredo González Flores."
  },
  {
    slug: "camiseta-resistencia",
    name: "Camiseta Resistencia",
    price: "₡12.000",
    categories: ["Textiles"],
    type: "simple",
    imageUrl: "/images/camisas-2.png",
    shortDescription: "Camiseta gris con la estampa «Resistencia» y la escultura de un indígena con el puño en alto."
  },
  {
    slug: "bolso-grecas",
    name: "Bolso Grecas Precolombinas",
    price: "₡8.500",
    categories: ["Bolsos"],
    type: "simple",
    imageUrl: "/images/bolso-1.png",
    shortDescription: "Bolso de tela con el logotipo de Historia de Costa Rica enmarcado en grecas precolombinas."
  },
  {
    slug: "camiseta-libertad",
    name: "Camiseta ¡Libertad!",
    price: "₡12.000",
    categories: ["Textiles"],
    type: "simple",
    imageUrl: "/images/camisas-3.png",
    shortDescription: "Camiseta con la estampa «¡Libertad!» de Juan Rafael Mora Porras, presidente de Costa Rica."
  },
  {
    slug: "gorras-logo",
    name: "Gorras Logo Bordado",
    price: "₡10.000",
    categories: ["Gorras"],
    type: "variable",
    imageUrl: "/images/gorras-1.png",
    shortDescription: "Gorras con el logotipo bordado, en gris, azul y verde."
  },
  {
    slug: "camiseta-alfredo",
    name: "Camiseta Alfredo González Flores",
    price: "₡12.000",
    categories: ["Textiles"],
    type: "simple",
    imageUrl: "/images/camisas-4.png",
    shortDescription: "Camiseta con la cita de Alfredo González Flores: «Que el rico pague como rico y el pobre como pobre»."
  },
  {
    slug: "bolso-liga-feminista",
    name: "Bolso Liga Feminista",
    price: "₡8.500",
    categories: ["Bolsos"],
    type: "simple",
    imageUrl: "/images/bolso-2.png",
    shortDescription: "Bolso de tela con la estampa de la Liga Feminista y el voto femenino."
  },
  {
    slug: "camiseta-liga-feminista",
    name: "Camiseta Liga Feminista",
    price: "₡12.000",
    categories: ["Textiles"],
    type: "simple",
    imageUrl: "/images/camisas-5.png",
    shortDescription: "Camiseta corta con la estampa de la Liga Feminista: los derechos de la mujer y el voto femenino en el siglo XX."
  },
  {
    slug: "gorras-colores",
    name: "Gorras Colores",
    price: "₡10.000",
    categories: ["Gorras"],
    type: "variable",
    imageUrl: "/images/gorras-2.png",
    shortDescription: "Gorras con el logotipo bordado, en rojo y en color arena."
  },
  {
    slug: "outfit-completo",
    name: "Outfit Historia de Costa Rica",
    price: "₡20.000",
    categories: ["Textiles", "Gorras"],
    type: "variable",
    imageUrl: "/images/camisas-6.png",
    shortDescription: "Tres camisetas de la colección combinadas con las gorras bordadas de Historia de Costa Rica."
  }
];
