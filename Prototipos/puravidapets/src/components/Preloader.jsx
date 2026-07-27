import { useEffect, useState } from 'react';

export default function Preloader() {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Block scroll while preloader is active
    document.body.style.overflow = 'hidden';

    const minDuration = 1200; // ms — ensures animations are fully visible
    const startTime = Date.now();

    const handleLoad = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);

      setTimeout(() => {
        // Begin CSS exit animation
        setIsExiting(true);

        // Remove from DOM after animation completes
        setTimeout(() => {
          setIsVisible(false);
          document.body.style.overflow = '';
        }, 700);
      }, remaining);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
      document.body.style.overflow = '';
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes pvp-paw-bounce {
          0%, 100% { transform: scale(1) rotate(-10deg); }
          50% { transform: scale(1.15) rotate(10deg); }
        }
        @keyframes pvp-paw-shine {
          0% { opacity: 0.3; transform: translateX(-100%) skewX(-20deg); }
          100% { opacity: 0.6; transform: translateX(400%) skewX(-20deg); }
        }
        @keyframes pvp-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-10px); opacity: 1; }
        }
        @keyframes pvp-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pvp-exit {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }

        .pvp-preloader {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background-color: #FFF8F0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        .pvp-preloader.is-exiting {
          opacity: 0;
          transform: translateY(-20px);
          pointer-events: none;
        }

        .pvp-paw-wrapper {
          position: relative;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF8A00, #FF6D00);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pvp-paw-bounce 1.6s ease-in-out infinite;
          box-shadow: 0 0 0 8px rgba(255,138,0,0.12), 0 0 0 16px rgba(255,138,0,0.06);
          overflow: hidden;
        }

        .pvp-paw-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
          animation: pvp-paw-shine 2s ease-in-out infinite;
        }

        .pvp-brand-name {
          animation: pvp-fade-in 0.8s ease forwards;
          animation-delay: 0.2s;
          opacity: 0;
          text-align: center;
        }

        .pvp-dots {
          display: flex;
          gap: 8px;
          animation: pvp-fade-in 0.8s ease forwards;
          animation-delay: 0.4s;
          opacity: 0;
        }

        .pvp-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #FF8A00;
          animation: pvp-dot-bounce 1.2s ease-in-out infinite;
        }
        .pvp-dot:nth-child(2) { animation-delay: 0.15s; }
        .pvp-dot:nth-child(3) { animation-delay: 0.3s; }

        .pvp-tagline {
          font-size: 0.75rem;
          color: #9CA3AF;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 600;
          animation: pvp-fade-in 0.8s ease forwards;
          animation-delay: 0.5s;
          opacity: 0;
        }
      `}</style>

      <div className={`pvp-preloader${isExiting ? ' is-exiting' : ''}`}>
        {/* Animated paw icon */}
        <div className="pvp-paw-wrapper">
          <div className="pvp-paw-shine" />
          {/* Paw print SVG */}
          <svg width="52" height="52" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="5" cy="9" rx="2" ry="2.5" />
            <ellipse cx="9.5" cy="6.5" rx="2" ry="2.5" />
            <ellipse cx="14.5" cy="6.5" rx="2" ry="2.5" />
            <ellipse cx="19" cy="9" rx="2" ry="2.5" />
            <path d="M12 11c-3.5 0-7 2.5-6 6.5 0.5 2 2.5 3.5 6 3.5s5.5-1.5 6-3.5c1-4-2.5-6.5-6-6.5z" />
          </svg>
        </div>

        {/* Brand name */}
        <div className="pvp-brand-name">
          <div
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: '2rem',
              fontWeight: 700,
              color: '#2D2D2D',
              lineHeight: 1.1,
            }}
          >
            Pura Vida Pets
          </div>
        </div>

        {/* Loading dots */}
        <div className="pvp-dots">
          <div className="pvp-dot" />
          <div className="pvp-dot" />
          <div className="pvp-dot" />
        </div>

        {/* Tagline */}
        <span className="pvp-tagline">Cargando tu aventura 🐾</span>
      </div>
    </>
  );
}
