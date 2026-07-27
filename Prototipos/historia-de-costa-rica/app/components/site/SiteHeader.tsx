"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CONTACT, NAV } from "../../data/content";
import { IconWhatsApp } from "./Icons";

/*
 * F02 · Header Mobile-First. La estructura (#header/.navbar/.nav-pill/.nav-menu/
 * .menu-toggle) es la que espera `site-features.js`, que gestiona el cajón
 * móvil, el estado `scrolled`, el contraste adaptativo de la píldora y el
 * Anchor Glide (F04) hacia las secciones.
 */

/*
 * Enlace del menú.
 *
 * Un ancla de la MISMA página tiene que ir como `<a>` puro. Con `next/link` el
 * App Router trata `/#podcast` como una navegación y, al resolverla, hace su
 * propio salto al hash (`scrollIntoView`) — que ocurre DESPUÉS del Anchor Glide
 * y lo pisa. El resultado es un menú que parece muerto en escritorio: el enlace
 * responde, pero el desplazamiento bueno (con el alto del header descontado y
 * esquivando el carrusel anclado por GSAP) se sobreescribe con el del router.
 *
 * Desde otra ruta sí hace falta viajar primero a la portada, y eso sí es
 * navegación de Next: así el `basePath` de la publicación se aplica solo.
 */
function NavLink({
  href,
  className,
  ariaLabel,
  children,
}: {
  href: string;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const hash = href.startsWith("#") ? href : null;

  if (hash && pathname === "/") {
    return (
      <a className={className} href={hash} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={hash ? `/${hash}` : href} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  useEffect(() => {
    // Sincronizar contraste del header al cambiar de página en Next.js
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("scroll"));
    }, 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <header id="header" className="navbar header-on-dark">
      <div className="nav-pill">
        <NavLink className="brand" href="#top" ariaLabel="Historia de Costa Rica, inicio">
          <img src="/logo.jpg" alt="" width={40} height={40} />
          <span className="brand-name">Historia de Costa&nbsp;Rica</span>
        </NavLink>

        <nav className="nav-menu" id="navMenu" aria-label="Navegación principal">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
          <div className="nav-drawer-foot">
            <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
              Escribir por WhatsApp
            </a>
          </div>
        </nav>

        <div className="nav-actions">
          <a
            className="nav-cta"
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Pedir por WhatsApp"
          >
            <IconWhatsApp className="nav-cta-ico" />
            <span>Pedir</span>
          </a>
          <button className="menu-toggle" type="button" aria-expanded="false" aria-controls="navMenu" aria-label="Abrir menú">
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
