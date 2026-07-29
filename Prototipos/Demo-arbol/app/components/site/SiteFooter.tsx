import Link from "next/link";
import { BRAND, CONTACT, NAV, linkTo } from "../../data/content";

/*
 * F10 · Elysium Signature + F05 · Information System. `elysium-system-info.js`
 * inyecta la etiqueta de versión («v1.0.0 beta») como primer hijo de
 * `.footer-bottom-inner` y abre desde ella la ventana de sistema (versión,
 * seguridad, ajustes F22 y actualización F06). Aquí sólo se aporta el contenedor
 * y el crédito de autoría.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          {/* Sin logotipo: la marca es solo el rótulo, vacío hasta que haya uno. */}
          <a href="#top" className="footer-logo" aria-label="Inicio">
            <span>{BRAND.name}</span>
          </a>
          <p className="footer-tagline" />
        </div>

        <div className="footer-col">
          <h4 />
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                {/* Los anclas de la misma página van con `<a>`; las rutas, con
                    `Link`, para que el `basePath` de la publicación se aplique
                    solo. Un `<a href="/tienda">` aquí se publicaría sin prefijo
                    y llevaría a la raíz del dominio. */}
                {item.href.startsWith("#") ? (
                  <a href={item.href}>{item.label}</a>
                ) : (
                  <Link href={item.href}>{item.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h4 />
          <ul>
            <li><a href={linkTo(CONTACT.youtube)} target="_blank" rel="noopener noreferrer" /></li>
            <li><a href={linkTo(CONTACT.spotify)} target="_blank" rel="noopener noreferrer" /></li>
            <li><a href={linkTo(CONTACT.instagram)} target="_blank" rel="noopener noreferrer" /></li>
          </ul>
        </div>

        <div className="footer-col" id="contacto">
          <h4 />
          <ul>
            <li><a href={linkTo(CONTACT.whatsapp)} target="_blank" rel="noopener noreferrer" /></li>
            {/* Sin dirección no hay `mailto:`: quedaría un enlace que abre el
                cliente de correo con el destinatario vacío. */}
            <li><a href={linkTo(CONTACT.email && `mailto:${CONTACT.email}`)}>{CONTACT.email}</a></li>
            <li><span>{BRAND.city}</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          {/* La etiqueta de versión de Elysium se inyecta aquí como primer hijo. */}
          <span className="footer-legal">{BRAND.name}</span>
          <p className="footer-credit">
            Desarrollado por{" "}
            <a href="https://elysiumdr.eu" target="_blank" rel="noopener noreferrer">Elysium λ Development &amp; Research</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
