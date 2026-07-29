'use client';

import React, { useState, useEffect } from 'react';
import './ElysiumPrototypePopup.css';

export default function ElysiumPrototypePopup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // We want to render this ALWAYS on page load.
  useEffect(() => {
    /*
     * El bloqueo va en una clase sobre `<html>`, no en `body.style.overflow`.
     * El preloader de Elysium usa ese mismo estilo en línea y lo limpia al
     * retirarse (`retire()`), cosa que ocurre a mitad del aviso —son varios
     * pasos—: el candado del aviso se perdía y la página se desplazaba por
     * detrás del modal. Sobre el elemento raíz, además, el bloqueo manda
     * siempre: el `overflow` del body solo se propaga al viewport cuando el de
     * `<html>` es `visible`.
     */
    if (isVisible) {
      document.documentElement.classList.add('hdc-scroll-locked');
      return () => {
        document.documentElement.classList.remove('hdc-scroll-locked');
      };
    }

    document.documentElement.classList.remove('hdc-scroll-locked');
    /*
     * El bloqueo se propaga al viewport: mientras el aviso
     * está abierto el documento mide una sola pantalla. Los ScrollTrigger que
     * se crean o se recalculan en ese rato (la portada y el carrusel anclado
     * de las secciones) se quedan con marcas falsas, y al cerrar el aviso el
     * carrusel se ancla antes de tiempo: la portada aún se ve arriba mientras
     * el cuerpo ya ha empezado a desplazarse. Remedimos en cuanto se libera.
     */
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        import('gsap/ScrollTrigger')
          .then(({ ScrollTrigger }) => ScrollTrigger.refresh())
          .catch(() => {});
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [isVisible]);

  if (!isVisible) return null;

  /*
   * Pasos del aviso de entrada. Los de marca del cliente se han vaciado: queda
   * solo lo que es de Elysium λ. Al añadir un cliente nuevo se reponen aquí el
   * aviso legal de titularidad y la política de retención que le correspondan.
   */
  const steps = [
    {
      title: "BIENVENIDA/O",
      content: "Prototipo desarrollado por Elysium λ Development & Research",
      highlight: true
    },
    {
      title: "Aviso Legal",
      content: (
        <>
          Prototipo conceptual. Esta interfaz y experiencia de usuario ha sido desarrollada por <strong>Elysium λ Development &amp; Research</strong>.
        </>
      ),
    },
    {
      title: "EXPLORAR",
      content: (
        <>
          Esta Experiencia es <strong className="elysium-magic-text">Inmersiva</strong>
        </>
      )
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
        
        {/* Decorative elements for the liquid glass effect */}
        <div className="elysium-orb orb-1"></div>
        <div className="elysium-orb orb-2"></div>
      </div>
    </div>
  );
}
