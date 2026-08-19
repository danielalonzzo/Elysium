'use client';

import React, { useState, useEffect } from 'react';
import './ElysiumPrototypePopup.css';
import { brand } from '../../data/brand';

export default function ElysiumPrototypePopup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  /* La bienvenida se salta en dos casos: dentro de un iframe (el CRM incrusta
     la demo en una miniatura de 300 px, donde el aviso solo tapa) y con
     `?intro=off`, que es lo que usan las capturas del portafolio. Se resuelve
     después de hidratar para que el HTML del servidor no dependa del cliente. */
  useEffect(() => {
    const embedded = window.self !== window.top;
    const disabled = new URLSearchParams(window.location.search).get('intro') === 'off';
    if (embedded || disabled) setIsVisible(false);
  }, []);

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
      content: "Prototipo desarrollado por Elysium λ Development & Research",
      highlight: true
    },
    {
      title: "Marca ficticia",
      content: (
        <>
          <strong>{brand.name}</strong> no existe. El nombre, el catálogo, los precios,
          los teléfonos y las direcciones de este sitio son invención de{" "}
          <strong>Elysium λ Development &amp; Research</strong>, creados para poder
          enseñar la arquitectura completa sin usar los activos de ningún cliente.
          Cualquier parecido con una empresa real es casual.
        </>
      ),
    },
    {
      title: "Qué se está enseñando",
      content: (
        <>
          Un recorrido de comercio completo sobre <strong>Next.js</strong> y{" "}
          <strong>Cloudflare Workers</strong>: portada narrativa con escena 3D
          procedural, tienda con filtros, ficha de producto, carrito, checkout,
          blog y formularios. Todo el contenido vive como datos, así que la marca
          se puede sustituir entera sin tocar la interfaz.
        </>
      ),
    },
    {
      title: "Nada es real",
      content: (
        <>
          No hay pasarela de pago, no hay cuentas y ningún formulario envía datos:
          el carrito y las preferencias se guardan solo en este dispositivo.
          Reservar una expedición o finalizar una compra son simulaciones locales.
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
