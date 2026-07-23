import React from "react";

export function DevelopmentCurtain() {
  return (
    <div className="rgx-curtain-backdrop" role="dialog" aria-modal="true" aria-label="Contenido en desarrollo">
      <div className="rgx-curtain-glow" aria-hidden="true" />
      <div className="rgx-curtain-card">
        <div className="rgx-curtain-icon">
          <span className="rgx-curtain-lambda">λ</span>
        </div>
        <span className="rgx-curtain-eyebrow">ELYSIUM λ PLATFORM</span>
        <h2 className="rgx-curtain-title">Infraestructura en Desarrollo</h2>
        <p className="rgx-curtain-copy">
          Suscríbase a uno de los planes <strong>Elysium λ</strong> para acceder al contenido.
        </p>
        <a
          href="https://elysiumdr.eu/es/services"
          target="_blank"
          rel="noopener noreferrer"
          className="rgx-curtain-button"
        >
          <span>Suscribirse</span>
          <svg
            className="rgx-curtain-arrow"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </a>
      </div>
    </div>
  );
}
