"use client";

import { useState } from "react";
import { localAsset } from "../../utils/assetPath";
import type { aboutPage as AboutPageData } from "../../data/content";

type AboutContentProps = {
  content: typeof AboutPageData;
};

function AccordionItem({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rgx-accordion-item ${isOpen ? "is-open" : ""}`}>
      <button className="rgx-accordion-toggle" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        <span className="rgx-accordion-icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
        <span className="rgx-accordion-title">{title}</span>
      </button>
      <div className="rgx-accordion-content" style={{ maxHeight: isOpen ? "1000px" : "0px", opacity: isOpen ? 1 : 0 }}>
        <div className="rgx-accordion-inner">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AboutContent({ content }: AboutContentProps) {
  const foundersImage = content.assets[0];
  const environmentalImage = content.assets[1];
  const sponsorImage = content.assets[2];

  return (
    <section className="rgx-about-content-section">
      {/* Misión, Visión, Valores */}
      <div className="rgx-shell rgx-about-grid">
        <div className="rgx-about-left">
          <h2 className="rgx-about-section-title">{content.title}</h2>
          
          <div className="rgx-accordion">
            <AccordionItem title="Nosotros" defaultOpen={true}>
              <p>{content.introduction}</p>
            </AccordionItem>
            
            {content.panels.map((panel) => (
              <AccordionItem key={panel.title} title={panel.title}>
                {panel.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {panel.items && panel.items.length > 0 && (
                  <ul className="rgx-about-list">
                    {panel.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </AccordionItem>
            ))}
          </div>
        </div>
        
        <div className="rgx-about-right">
          <div className="rgx-founders-card">
            {foundersImage && (
              <img src={foundersImage.src} alt={foundersImage.alt || "Fundadores"} loading="lazy" />
            )}
          </div>
        </div>
      </div>

      {/* Compromiso Ambiental */}
      <div className="rgx-shell rgx-env-grid">
        <div className="rgx-env-left">
          <div className="rgx-env-image-wrapper">
            {environmentalImage && (
              <img src={environmentalImage.src} alt={environmentalImage.alt || "Compromiso Ambiental"} loading="lazy" />
            )}
          </div>
          {sponsorImage && (
            <div className="rgx-sponsor-badge">
              <img src={sponsorImage.src} alt="Patrocinador" />
              <p>{content.sponsorHeading}</p>
            </div>
          )}
        </div>
        
        <div className="rgx-env-right">
          <div className="rgx-env-glass-card">
            <h2 className="rgx-about-section-title">{content.environmentalHeading}</h2>
            <div className="rgx-env-text">
              {content.environmentalCommitment.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
