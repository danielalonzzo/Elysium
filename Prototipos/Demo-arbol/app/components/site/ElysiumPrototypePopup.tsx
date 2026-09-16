'use client';

import { useState, useEffect } from 'react';
import './ElysiumPrototypePopup.css';

/*
 * Aviso de entrada de la demo (cinco pasos).
 *
 * El paso 2 es el que justifica que este componente exista. En el prototipo
 * original decía que la identidad de la marca era propiedad del cliente; aquí
 * va al revés, porque «Raíz y Piedra» no existe: es una empresa inventada para
 * poder enseñar la pieza llena de contenido sin usar el material de nadie. Un
 * visitante tiene que saberlo antes de ver la primera pantalla.
 */
export default function ElysiumPrototypePopup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    /*
     * El bloqueo va en una clase sobre `<html>`, no en `body.style.overflow`.
     * El preloader de Elysium usa ese mismo estilo en línea y lo limpia al
     * retirarse (`retire()`), cosa que ocurre a mitad del aviso —son cinco
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
     * El bloqueo se propaga al viewport: mientras el aviso está abierto el
     * documento mide una sola pantalla. Los ScrollTrigger que se crean o se
     * recalculan en ese rato (la portada y el carrusel anclado de «El juego de
     * mesa») se quedan con marcas falsas, y al cerrar el aviso el carrusel se
     * ancla antes de tiempo: la portada aún se ve arriba mientras el cuerpo ya
     * ha empezado a desplazarse. Remedimos en cuanto se libera.
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

  const steps = [
    {
      title: 'BIENVENIDA/O',
      content: 'Prototipo desarrollado por Elysium λ Development & Research',
      highlight: true,
    },
    {
      title: 'Aviso Legal',
      content: (
        <>
          <strong>Raíz y Piedra es una marca ficticia.</strong> No existe como
          empresa, no vende nada y ninguno de sus productos, precios o contactos
          es real. La inventamos en{' '}
          <strong>Elysium λ Development &amp; Research</strong> para poder
          enseñar esta pieza llena de contenido sin usar el material de ningún
          cliente. Cualquier parecido con una empresa real es casual.
        </>
      ),
    },
    {
      title: 'Qué estás viendo',
      content: (
        <>
          Una demostración de arquitectura, no un proyecto entregado. La escena
          3D —el guanacaste, la esfera del Diquís y las ochenta cartas— se
          construye entera por código: no hay ni un modelo ni una textura en
          disco. La tienda, el buscador y las fichas de producto funcionan de
          verdad sobre datos inventados.
        </>
      ),
    },
    {
      title: 'Lo que sí es real',
      content: (
        <>
          El árbol de guanacaste y las esferas de piedra del Diquís sí existen:
          son el árbol nacional de Costa Rica y un Patrimonio Mundial declarado
          en 2014. Lo inventado es la empresa que los usa como marca, no el
          patrimonio que retrata.
        </>
      ),
    },
    {
      title: 'EXPLORAR',
      content: (
        <>
          Esta Experiencia es{' '}
          <strong className="elysium-magic-text">Inmersiva</strong>
        </>
      ),
    },
  ];

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        setIsVisible(false);
      }
      setIsAnimating(false);
    }, 600); // espera al fundido de salida
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

        {/* Decorativos del efecto de vidrio líquido */}
        <div className="elysium-orb orb-1"></div>
        <div className="elysium-orb orb-2"></div>
      </div>
    </div>
  );
}
