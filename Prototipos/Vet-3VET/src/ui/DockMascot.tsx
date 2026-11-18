'use client';
import {useEffect, useRef, useState} from 'react';

/**
 * El perro de 3VET que vive en la dock: el cão de traço del logotipo en 3D
 * (`scripts/mascot/build_mascot.py`), que pasea por el contorno de la pastilla,
 * come, bebe, se sienta, duerme y hace trucos (`core/mascot.js` decide qué).
 *
 * Igual que en Pura Vida Pets, el motor (three.js y el modelo) no viaja en el
 * arranque: se pide con la primera señal de que hay alguien delante (mover el
 * ratón, tocar, desplazarse, una tecla). Sin esa señal no se carga nada, así que
 * un rastreador o una pestaña de fondo no pagan un motor 3D que nadie mira.
 *
 * Tocarlo le saca un truco; varios toques seguidos lo ponen contento. Con
 * «reducir movimiento» sigue ahí, tranquilo, sin pasear ni dar vueltas. Si no
 * hay WebGL, la dock se queda como estaba.
 */
const ARMING_EVENTS = ['pointermove', 'pointerdown', 'scroll', 'keydown', 'touchstart'] as const;
const STREAK_GAP = 1.6;

type Engine = {
  setActive: (on: boolean) => void;
  trick: () => void;
  cheer: () => void;
  dispose: () => void;
  ready: Promise<unknown>;
};

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function DockMascot({en = false, onPresenceChange}: {en?: boolean; onPresenceChange?: (present: boolean) => void}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const lastTap = useRef(0);
  const [armed, setArmed] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // 1. Esperar a la primera señal de que hay alguien delante.
  useEffect(() => {
    if (armed) return undefined;
    const arm = () => setArmed(true);
    ARMING_EVENTS.forEach((type) => window.addEventListener(type, arm, {once: true, passive: true}));
    return () => ARMING_EVENTS.forEach((type) => window.removeEventListener(type, arm));
  }, [armed]);

  // 2. Cargar el motor; cualquier fallo deja la dock sin perro y sin romper nada.
  useEffect(() => {
    if (!armed || failed) return undefined;
    let cancelled = false;
    let engine: Engine | null = null;
    const fail = (error: unknown) => {
      if (cancelled) return;
      console.warn('O cão da dock não pôde carregar:', error);
      setFailed(true);
    };
    import('./mascotEngine.js')
      .then(({createMascot}) => {
        if (cancelled || !containerRef.current) return;
        engine = createMascot({
          container: containerRef.current,
          dock: containerRef.current.parentElement,
          button: buttonRef.current,
          calm: reducedMotion(),
          onReady: () => { if (!cancelled) setReady(true); },
        }) as Engine;
        engineRef.current = engine;
        engine.setActive(true);
        engine.ready.catch(fail);
      })
      .catch(fail);
    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
      setReady(false);
    };
  }, [armed, failed]);

  useEffect(() => { onPresenceChange?.(ready); }, [ready, onPresenceChange]);

  function onTap() {
    const engine = engineRef.current;
    if (!engine) return;
    const now = performance.now() / 1000;
    const streak = now - lastTap.current < STREAK_GAP;
    lastTap.current = now;
    if (streak && !reducedMotion()) engine.cheer();
    else engine.trick();
  }

  if (failed) return null;
  const label = en ? 'The 3VET dog: tap for a trick' : 'O cão da 3VET: toque para um truque';
  return (
    <div ref={containerRef} className={'v3-dock-mascot' + (ready ? ' is-ready' : '')}>
      <button ref={buttonRef} type="button" className="v3-dock-mascot-hit" aria-label={label} title={label} tabIndex={ready ? 0 : -1} onClick={onTap} />
    </div>
  );
}
