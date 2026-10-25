'use client';

interface EmblemProps {
  size?: number | string;
  className?: string;
  withTagline?: boolean;
  withText?: boolean;
  monochrome?: boolean;
}

export default function NovavetEmblem({
  size = 48,
  className = '',
  withText = false,
  withTagline = false,
  monochrome = false,
}: EmblemProps) {
  // Cores oficiais da Novavet (Consultório & Agropecuária):
  // Teal médico / ciano clínico, Lima agrícola transmontano, e interseção verde-floresta
  const teal = monochrome ? 'currentColor' : '#009bb0';
  const lime = monochrome ? 'currentColor' : '#8ec63f';
  const deepTeal = monochrome ? 'currentColor' : '#006570';
  const lightTeal = monochrome ? 'currentColor' : '#4dc4d4';
  const lightLime = monochrome ? 'currentColor' : '#a8d959';

  const mark = (
    <svg
      viewBox="0 0 200 200"
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      style={typeof size === 'string' ? { width: size, height: size } : undefined}
      className={`novavet-emblem-svg ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Emblema Oficial Novavet"
    >
      <defs>
        <radialGradient id="tealGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22b9ce" />
          <stop offset="100%" stopColor="#008ea0" />
        </radialGradient>
        <radialGradient id="limeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a3df46" />
          <stop offset="100%" stopColor="#7cb32b" />
        </radialGradient>
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
        </filter>
      </defs>

      <g filter="url(#softShadow)">
        {/* Pétala Superior - Verde Lima */}
        <circle cx="100" cy="58" r="42" fill={monochrome ? 'currentColor' : 'url(#limeGlow)'} opacity="0.95" />

        {/* Pétala Inferior - Verde Lima */}
        <circle cx="100" cy="142" r="42" fill={monochrome ? 'currentColor' : 'url(#limeGlow)'} opacity="0.95" />

        {/* Pétala Esquerda - Ciano Clínico */}
        <circle cx="58" cy="100" r="42" fill={monochrome ? 'currentColor' : 'url(#tealGlow)'} opacity="0.92" />

        {/* Pétala Direita - Ciano Clínico */}
        <circle cx="142" cy="100" r="42" fill={monochrome ? 'currentColor' : 'url(#tealGlow)'} opacity="0.92" />

        {/* Interseções e pétalas diagonais da marca registrada */}
        <circle cx="72" cy="72" r="30" fill={deepTeal} opacity="0.85" />
        <circle cx="128" cy="72" r="30" fill={deepTeal} opacity="0.85" />
        <circle cx="72" cy="128" r="30" fill={deepTeal} opacity="0.85" />
        <circle cx="128" cy="128" r="30" fill={deepTeal} opacity="0.85" />

        {/* Centro côncavo em diamante arredondado característico da Novavet */}
        <path
          d="M 100 76 Q 100 100 124 100 Q 100 100 100 124 Q 100 100 76 100 Q 100 100 100 76 Z"
          fill="#ffffff"
          stroke="rgba(0, 155, 176, 0.15)"
          strokeWidth="1.5"
        />
        {/* Ponto sutil no núcleo */}
        <circle cx="100" cy="100" r="3.5" fill={deepTeal} />
      </g>
    </svg>
  );

  if (!withText) return mark;

  return (
    <div className={`novavet-lockup flex items-center gap-3 ${className}`}>
      {mark}
      <div className="novavet-brand-text flex flex-col justify-center leading-none">
        <span className="novavet-name font-bold tracking-tight text-[#006570] text-2xl" style={{ fontFamily: 'var(--font-brand, sans-serif)' }}>
          novavet
        </span>
        {withTagline && (
          <span className="novavet-tagline text-xs font-medium text-emerald-800/80 tracking-normal mt-0.5">
            o parceiro certo
          </span>
        )}
      </div>
    </div>
  );
}
