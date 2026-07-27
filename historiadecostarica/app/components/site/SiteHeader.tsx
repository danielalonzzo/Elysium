"use client";

import { useEffect } from "react";
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
        <Link className="brand" href="/#top" aria-label="Historia de Costa Rica, inicio">
          <img src="/logo.jpg" alt="" width={40} height={40} />
          <span className="brand-name">Historia de Costa&nbsp;Rica</span>
        </Link>

        <nav className="nav-menu" id="navMenu" aria-label="Navegación principal">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
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
