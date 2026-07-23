/**
 * Subconjunto de iconos auto-alojados.
 *
 * El sitio anterior dibujaba los canales de contacto con glifos tipográficos
 * (`☎`, `✉`, `◎`, `W`, `f`), que dependen de la fuente instalada, no se
 * alinean con el texto y no admiten `currentColor`. Se sustituyen por trazos
 * SVG en línea: sin peticiones de red, sin CDN de terceros y con la CSP en
 * `'self'`. Trazo de 1.7 para que el dibujo respire dentro de los círculos de
 * 42 px del dock y de la cabecera.
 */

type IconProps = { className?: string };

function Stroke({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconSearch = ({ className }: IconProps) => (
  <Stroke className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></Stroke>
);

export const IconBag = ({ className }: IconProps) => (
  <Stroke className={className}><path d="M6 7h12l1 13H5L6 7Z" /><path d="M9 7V5.5a3 3 0 0 1 6 0V7" /></Stroke>
);

export const IconMail = ({ className }: IconProps) => (
  <Stroke className={className}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 7 8.5 6 8.5-6" /></Stroke>
);

export const IconPhone = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M6.5 3h3l1.5 4.5-2 1.2a12.5 12.5 0 0 0 6.3 6.3l1.2-2L21 14.5v3a2.5 2.5 0 0 1-2.7 2.5A16.8 16.8 0 0 1 3.5 5.7 2.5 2.5 0 0 1 6 3Z" />
  </Stroke>
);

export const IconWhatsApp = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M3.6 20.4 5 16.6a8.2 8.2 0 1 1 3.1 3l-4.5.8Z" />
    <path d="M9.2 9.1c.3 1.6 1.3 3.2 2.7 4.3 1 .8 1.9 1 2.6 1.1.5 0 .9-.4 1-.9l.1-.7-2-.9-.7.8a6.4 6.4 0 0 1-2.2-2.3l.8-.7-.8-2-.7.1c-.5.1-.9.5-.8 1.1Z" />
  </Stroke>
);

export const IconInstagram = ({ className }: IconProps) => (
  <Stroke className={className}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17.1" cy="6.9" r=".9" fill="currentColor" stroke="none" />
  </Stroke>
);

export const IconFacebook = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M14.8 21v-7.5h2.5l.5-3h-3V8.8c0-.9.3-1.5 1.6-1.5H18V4.6a21 21 0 0 0-2.3-.1c-2.4 0-4 1.4-4 4.1v2.4H9.2v3h2.5V21" />
  </Stroke>
);

export const IconMapPin = ({ className }: IconProps) => (
  <Stroke className={className}><path d="M12 21s7-5.6 7-10.6a7 7 0 1 0-14 0C5 15.4 12 21 12 21Z" /><circle cx="12" cy="10.3" r="2.6" /></Stroke>
);

export const IconLeaf = ({ className }: IconProps) => (
  <Stroke className={className}>
    <path d="M4 20c-1.5-6 1.5-12.5 9.5-14C17 5.4 19.5 4.6 20.5 3.5c.8 4.7.4 13.7-7.5 15.4A7.7 7.7 0 0 1 6 17.4" />
    <path d="M6.5 17.5c1.4-4 4.3-7 8.5-8.8" />
  </Stroke>
);

export const IconArrowUpRight = ({ className }: IconProps) => (
  <Stroke className={className}><path d="M7.5 16.5 16.5 7.5" /><path d="M9 7.5h7.5V15" /></Stroke>
);

export const IconMoon = ({ className }: IconProps) => (
  <Stroke className={className}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></Stroke>
);

export const IconSun = ({ className }: IconProps) => (
  <Stroke className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4" />
  </Stroke>
);
