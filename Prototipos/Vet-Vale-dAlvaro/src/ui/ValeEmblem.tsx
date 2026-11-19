import React, { useId } from "react";

/**
 * Emblema limpo e modesto da Clínica Veterinária Vale d'Álvaro (Bragança).
 * Mesma geometria e paleta exatas da escultura 3D em Blender (`scripts/logo3d/build_logo.py`):
 * arco em Azul Azulejo (#1e4d7b), filete e colinas em «V» em Mel Dourado (#df9a38 / #c67822),
 * sol suave, cruz veterinária discreta e cão + gato em porcelana clara com bigodes dourados.
 */
export function ValeEmblem({
  size = 44,
  className = "",
  title = "Emblema da Clínica Veterinária Vale d'Álvaro, Bragança",
  decorative = false,
}: {
  size?: number;
  className?: string;
  title?: string;
  decorative?: boolean;
}) {
  const clipId = useId();
  return (
    <svg
      viewBox="0 0 120 128"
      width={size}
      height={Math.round(size * (128 / 120))}
      className={`va-emblem ${className}`.trim()}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative ? "true" : undefined}
    >
      {/* Arco Azulejo Azul */}
      <path
        d="M60 4 C90 4 114 27 114 57 V102 C114 114 104 124 92 124 H28 C16 124 6 114 6 102 V57 C6 27 30 4 60 4 Z"
        fill="#1E4D7B"
      />
      {/* Colinas em «V» perfeitamente encaixadas no interior do filete */}
      <clipPath id={clipId}>
        <path d="M60 12.5 C85 12.5 105.5 31.5 105.5 57 V101 C105.5 108.5 99.5 115 91.5 115 H28.5 C20.5 115 14.5 108.5 14.5 101 V57 C14.5 31.5 35 12.5 60 12.5 Z" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <path d="M12 87 Q38 82 72 108 L68 117 H12 Z" fill="#C67822" />
        <path d="M46 117 Q74 86 108 85 V117 Z" fill="#DF9A38" />
      </g>
      {/* Filete interior dourado mel */}
      <path
        d="M60 11 C86 11 107 31 107 57 V101 C107 109.5 100 116.5 91.5 116.5 H28.5 C20 116.5 13 109.5 13 101 V57 C13 31 34 11 60 11 Z"
        stroke="#DF9A38"
        strokeWidth="3.8"
      />
      {/* Cruz veterinária limpa */}
      <rect x="57.2" y="17.5" width="5.6" height="15" rx="2.1" fill="#FDFAF3" />
      <rect x="52.5" y="22.2" width="15" height="5.6" rx="2.1" fill="#FDFAF3" />
      {/* Sol quente do Vale (com folga limpa para a cruz e as orelhas) */}
      <circle cx="60" cy="46.5" r="8.8" fill="#F2C361" />

      {/* Cão à esquerda (orelhas caídas mel + cara porcelana + focinho + sorriso) */}
      <path d="M29 58.5 C22 60.5 21 74 25.8 79.5 C29.5 81.5 33.5 76.5 33.5 69 Z" fill="#C67822" />
      <path d="M49 58.5 C56 60.5 57 74 52.2 79.5 C48.5 81.5 44.5 76.5 44.5 69 Z" fill="#C67822" />
      <ellipse cx="39" cy="68" rx="11.4" ry="12.6" fill="#FDFAF3" />
      <ellipse cx="39" cy="72.4" rx="6.6" ry="5.3" fill="#F2E7D3" />
      <circle cx="34.9" cy="64.8" r="1.7" fill="#18232E" />
      <circle cx="43.1" cy="64.8" r="1.7" fill="#18232E" />
      <path d="M36.3 69.5 H41.7 L39 72.7 Z" fill="#18232E" />
      <path d="M35.3 74.6 Q39 77.6 42.7 74.6" stroke="#18232E" strokeWidth="1.75" strokeLinecap="round" />

      {/* Gato à direita (bigodes dourados + orelhas pontiagudas + cara porcelana + nariz mel) */}
      <line x1="70.5" y1="69" x2="64.8" y2="68.1" stroke="#DF9A38" strokeWidth="1.45" strokeLinecap="round" />
      <line x1="70.7" y1="71.3" x2="65.2" y2="72.6" stroke="#DF9A38" strokeWidth="1.45" strokeLinecap="round" />
      <line x1="91.5" y1="69" x2="97.2" y2="68.1" stroke="#DF9A38" strokeWidth="1.45" strokeLinecap="round" />
      <line x1="91.3" y1="71.3" x2="96.8" y2="72.6" stroke="#DF9A38" strokeWidth="1.45" strokeLinecap="round" />
      <path d="M70.5 65.5 L70.8 53.5 L79.5 60 Z" fill="#FDFAF3" />
      <path d="M91.5 65.5 L91.2 53.5 L82.5 60 Z" fill="#FDFAF3" />
      <path d="M72.4 62 L72.6 56.6 L77 59.8 Z" fill="#DF9A38" />
      <path d="M89.6 62 L89.4 56.6 L85 59.8 Z" fill="#DF9A38" />
      <ellipse cx="81" cy="68.5" rx="11.6" ry="10.4" fill="#FDFAF3" />
      <circle cx="77.2" cy="67" r="1.65" fill="#18232E" />
      <circle cx="84.8" cy="67" r="1.65" fill="#18232E" />
      <path d="M79.1 70.1 H82.9 L81 72.4 Z" fill="#C67822" />
    </svg>
  );
}

export function ValeWordmark({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <span className={`va-wordmark ${compact ? "is-compact" : ""} ${light ? "is-light" : ""}`}>
      <ValeEmblem size={compact ? 38 : 48} />
      <span className="va-wordmark-text">
        <small>Clínica Veterinária · Bragança</small>
        <strong>Vale d&apos;Álvaro</strong>
      </span>
    </span>
  );
}

export function TileDivider({ variant = "default" }: { variant?: "default" | "dark" }) {
  return <div className={`va-tile-strip ${variant === "dark" ? "is-dark" : ""}`} aria-hidden="true" />;
}

export function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export default ValeEmblem;
