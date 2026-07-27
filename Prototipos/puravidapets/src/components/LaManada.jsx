import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// Carga dinámica — agrega fotos a src/assets/Familia/ y aparecen solas al compilar
const imageModules = import.meta.glob(
  '../assets/Familia/*.{png,jpg,jpeg,webp,avif}',
  { eager: true, import: 'default' }
);

const images = Object.entries(imageModules).map(([path, src]) => {
  const fileName = path.split('/').pop().split('.')[0];
  const name = fileName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return { src, name };
});

// ─── Config visual ────────────────────────────────────────────────────────────
const CARD_W   = 130;   // px — ancho de tarjeta
const CARD_H   = 155;   // px — alto de tarjeta
const GAP      = 14;    // px — separación extra entre tarjetas en el cilindro
const TOTAL_MEMBERS = 41; // miembros totales (aunque no todos tengan foto aún)

export default function LaManada() {
  const [selectedDog, setSelectedDog] = useState(null);
  const spinnerRef   = useRef(null);

  // Rotación y física
  const rotation     = useRef(0);
  const velocity     = useRef(0);
  const isDragging   = useRef(false);
  const lastX        = useRef(0);
  const lastTime     = useRef(0);
  const hasMoved     = useRef(false);
  const rafId        = useRef(null);

  const n      = images.length || 1;
  const theta  = 360 / n;                                           // ángulo por tarjeta
  const radius = Math.round((CARD_W / 2) / Math.tan(Math.PI / n)) + GAP; // radio trigonométrico exacto

  // Aplica la rotación al DOM directamente (sin pasar por React state para suavidad)
  const applyRotation = (deg, transition = false) => {
    const el = spinnerRef.current;
    if (!el) return;
    el.style.transition = transition ? 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
    el.style.transform  = `rotate3d(0, 1, 0, ${deg}deg)`;
  };

  // ─── Inercia (centrifugado) ───────────────────────────────────────────────
  const startInertia = () => {
    cancelAnimationFrame(rafId.current);
    const FRICTION = 0.94; // cuánto se frena por frame (0.94 = suave, 0.90 = rápido)

    const tick = () => {
      if (Math.abs(velocity.current) < 0.05) {
        velocity.current = 0;
        return;
      }
      velocity.current *= FRICTION;
      rotation.current += velocity.current;
      applyRotation(rotation.current, false);
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
  };

  // ─── Pointer events ───────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    cancelAnimationFrame(rafId.current);
    isDragging.current = true;
    hasMoved.current   = false;
    velocity.current   = 0;
    lastX.current      = e.pageX;
    lastTime.current   = performance.now();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    const now    = performance.now();
    const delta  = e.pageX - lastX.current;
    const dt     = now - lastTime.current || 16;

    if (Math.abs(delta) > 3) hasMoved.current = true;

    // Velocidad = píxeles por ms → convertida a °/frame a ~60fps
    velocity.current   = (delta / dt) * 16 * 0.35;
    rotation.current  += delta * 0.35;
    lastX.current      = e.pageX;
    lastTime.current   = now;

    applyRotation(rotation.current, false);
  };

  const onPointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    startInertia();
  };

  // Limpieza del RAF al desmontar
  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  return (
    <section
      id="manada"
      className="py-20 bg-[#FFF8F0] dark:bg-[#1A1918] relative"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Cabecera sobria estilo referencia */}
      <div className="text-center mb-10">
        {/* Badge Instagram */}
        <a 
          href="https://www.instagram.com/puravidapets.cr/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#FF8A18] text-white border border-[#FF8A18]/20 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full shadow-sm mb-4 transition-all duration-300 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white hover:border-transparent active:scale-95 cursor-pointer"
        >
          🐾 La Manada
        </a>
        <p className="text-sm text-[#2D2D2D]/50 dark:text-gray-500 font-medium">
          Arrastra para girar &middot; Haz clic para ver
        </p>
      </div>

      {/* Escenario 3D — sin overflow:hidden para no recortar las tarjetas en perspectiva */}
      <div
        style={{
          perspective: '900px',
          perspectiveOrigin: '50% 45%',
          width: '100%',
          height: CARD_H + 80,         // holgura vertical para evitar el recorte
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Spinner / cilindro */}
        <div
          ref={spinnerRef}
          style={{
            position:       'relative',
            width:          CARD_W,
            height:         CARD_H,
            transformStyle: 'preserve-3d',
            willChange:     'transform',
            cursor:         'grab',
            touchAction:    'pan-y',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {images.map((img, i) => {
            const angle = theta * i;
            return (
              <div
                key={img.name + i}
                style={{
                  position:            'absolute',
                  top:                 0,
                  left:                0,
                  width:               CARD_W,
                  height:              CARD_H,
                  borderRadius:        '1rem',
                  overflow:            'hidden',
                  boxShadow:           '0 8px 30px rgba(0,0,0,0.18)',
                  border:              '2px solid var(--color-brand-orange)',
                  transform:           `rotateY(${angle}deg) translateZ(${radius}px)`,
                  backfaceVisibility:  'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  cursor:              'pointer',
                }}
                onClick={() => { if (!hasMoved.current) setSelectedDog(img); }}
              >
                <img
                  src={img.src}
                  alt={img.name}
                  style={{
                    width:         '100%',
                    height:        '100%',
                    objectFit:     'cover',
                    objectPosition: 'center top', // enfoca la cara del perro
                    display:       'block',
                    pointerEvents: 'none',
                  }}
                  draggable={false}
                />
                {/* Nombre */}
                <div style={{
                  position:   'absolute',
                  bottom:     0,
                  left:       0,
                  right:      0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                  padding:    '1.75rem 0.75rem 0.6rem',
                  pointerEvents: 'none',
                  textAlign:  'center',
                }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.03em' }}>
                    {img.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pie */}
      <p className="text-center mt-6 text-xs text-[#2D2D2D]/35 dark:text-gray-600 font-medium tracking-wide">
        🐾 {TOTAL_MEMBERS} miembros de la manada
      </p>

      {/* Modal */}
      <AnimatePresence>
        {selectedDog && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedDog(null)}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative bg-white dark:bg-[#2D2D2D] rounded-[1.75rem] overflow-hidden max-w-xs w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={selectedDog.src}
                  alt={selectedDog.name}
                  className="w-full object-cover"
                  style={{ height: 260, objectPosition: 'center top' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <button
                  className="absolute top-3 right-3 bg-black/40 hover:bg-[var(--color-brand-orange)] text-white rounded-full p-1.5 transition-colors"
                  onClick={() => setSelectedDog(null)}
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="px-5 py-4 text-center">
                <h3 className="text-2xl font-extrabold text-[#2D2D2D] dark:text-[#F5F0E8] mb-1.5">
                  {selectedDog.name}
                </h3>
                <span className="inline-block bg-[var(--color-brand-orange)]/10 text-[var(--color-brand-orange)] text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">
                  🐾 Miembro de La Manada
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
