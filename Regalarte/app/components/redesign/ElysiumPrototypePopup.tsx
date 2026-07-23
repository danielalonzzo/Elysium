'use client';

import React, { useState, useEffect } from 'react';
import './ElysiumPrototypePopup.css';

export default function ElysiumPrototypePopup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // We want to render this ALWAYS on page load.
  useEffect(() => {
    // Prevent scrolling when popup is active
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const steps = [
    {
      title: "BIENVENIDA/O",
      content: "Prototipos de Elysium λ Development & Research",
      highlight: true
    },
    {
      title: "Aviso Legal",
      content: (
        <>
          Este prototipo es un material demostrativo creado en exclusiva para <strong>Regalarte de las Américas</strong>. <strong>Elysium λ Development & Research</strong> conserva los derechos de autoría y propiedad del diseño, por lo que no se autoriza su uso, distribución a terceros ni comercialización sin previo acuerdo.
        </>
      ),
    },
    {
      title: "Nuestra Visión",
      content: (
        <>
          Con la visión de llevar a <strong>Regalarte de las Américas</strong> al siguiente nivel, en <strong>Elysium λ</strong> hemos diseñado este prototipo web. Queremos compartir con ustedes esta propuesta y mostrarles lo que somos capaces de construir juntos.
        </>
      ),
    },
    {
      title: "EXPLORAR",
      content: (
        <>
          Esta Experiencia es <strong className="elysium-magic-text">Inmersiva</strong>
        </>
      ),
      footer: "Este prototipo es propiedad intelectual de Elysium λ Development & Research"
    }
  ];

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsVisible(false);
      }
      setIsAnimating(false);
    }, 600); // Wait for fade out
  };

  return (
    <div className="elysium-popup-overlay">
      <div className={`elysium-popup-glass ${isAnimating ? 'elysium-popup-animating' : ''}`}>
        
        <div className="elysium-popup-content-wrapper">
          <div className="elysium-popup-step-indicator">
            {steps.map((_, index) => (
              <div 
                key={index} 
                className={`elysium-step-dot ${index === currentStep ? 'active' : index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>

          <div className="elysium-popup-text-container">
            <h2 className="elysium-popup-title">
              {steps[currentStep].title}
            </h2>
            <p className={`elysium-popup-text ${steps[currentStep].highlight ? 'elysium-text-highlight' : ''}`}>
              {steps[currentStep].content}
            </p>
          </div>

          <div className="elysium-popup-action">
            <button onClick={handleNext} className={`elysium-popup-button ${currentStep === steps.length - 1 ? 'elysium-button-magic' : ''}`}>
              <span className="elysium-button-text">
                {currentStep === steps.length - 1 ? 'Comenzar' : 'Continuar'}
              </span>
              <div className="elysium-button-glow"></div>
            </button>
          </div>
        </div>

        {steps[currentStep].footer && (
          <div className="elysium-popup-footer">
            {steps[currentStep].footer}
          </div>
        )}
        
        {/* Decorative elements for the liquid glass effect */}
        <div className="elysium-orb orb-1"></div>
        <div className="elysium-orb orb-2"></div>
      </div>
    </div>
  );
}
