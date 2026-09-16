import Link from "next/link";

export default function NotFound() {
  return (
    <main className="hdc-notfound">
      <div>
        <p className="hdc-eyebrow">404</p>
        <h1>Esta era no está en la baraja</h1>
        <p className="hdc-lead">
          La página que buscas no existe o cambió de sitio. Vuelve al principio
          de la historia.
        </p>
        {/* `next/link`, no `<a href="/">`: del `basePath` se encarga el router.
            Antes apuntaba a `#top`, que es un ancla de la propia página 404 y
            por tanto no llevaba a ninguna parte. */}
        <Link className="hdc-btn hdc-btn--solid" href="/">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
