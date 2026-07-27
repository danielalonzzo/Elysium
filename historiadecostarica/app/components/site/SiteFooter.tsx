import { BRAND, CONTACT, NAV } from "../../data/content";

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
          <a href="#top" className="footer-logo" aria-label="Historia de Costa Rica, inicio">
            <img src="/logo.jpg" alt="" width={52} height={52} />
            <span>{BRAND.name}</span>
          </a>
          <p className="footer-tagline">La historia de Costa Rica, para jugar, escuchar y compartir.</p>
        </div>

        <div className="footer-col">
          <h4>Explorar</h4>
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h4>Escúchanos</h4>
          <ul>
            <li><a href={CONTACT.youtube} target="_blank" rel="noopener noreferrer">YouTube</a></li>
            <li><a href={CONTACT.spotify} target="_blank" rel="noopener noreferrer">Spotify</a></li>
            <li><a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contacto</h4>
          <ul>
            <li><a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
            <li><span>{BRAND.city}</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          {/* La etiqueta de versión de Elysium se inyecta aquí como primer hijo. */}
          <span className="footer-legal">© {new Date().getFullYear()} {BRAND.name}. Todos los derechos reservados.</span>
          <p className="footer-credit">
            Desarrollado por{" "}
            <a href="https://elysiumdr.eu" target="_blank" rel="noopener noreferrer">Elysium λ Development &amp; Research</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
