import { Metadata } from "next";
import { Shop } from "../components/shop/Shop";

export const metadata: Metadata = {
  title: "",
  description: "",
};

export default function TiendaPage() {
  return (
    <main>
      <Shop />
    </main>
  );
}
