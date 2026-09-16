import { Metadata } from "next";
import { Shop } from "../components/shop/Shop";

export const metadata: Metadata = {
  title: "Tienda",
  description:
    "El juego, las expansiones y los objetos de Raíz y Piedra. Impresos y cosidos en Costa Rica, en tiradas cortas.",
};

export default function TiendaPage() {
  return (
    <main>
      <Shop />
    </main>
  );
}
