import { Metadata } from "next";
import { Shop } from "../components/shop/Shop";

export const metadata: Metadata = {
  title: "Tienda Oficial | Historia de Costa Rica",
  description: "Explora la colección de productos oficiales de Historia de Costa Rica.",
};

export default function TiendaPage() {
  return (
    <main>
      <Shop />
    </main>
  );
}
