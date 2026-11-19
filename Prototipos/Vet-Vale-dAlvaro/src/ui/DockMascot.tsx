'use client';
import { useEffect, useRef, useState } from 'react';

const ARMING_EVENTS = ['pointermove', 'pointerdown', 'scroll', 'keydown', 'touchstart'] as const;
const STREAK_GAP = 1.6;

type Engine = {
  setActive: (on: boolean) => void;
  trick: () => void;
  cheer?: () => void;
  dispose: () => void;
  ready: Promise<unknown>;
};

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function DockMascot({
  en = false,
  onPresenceChange,
}: {
  en?: boolean;
  onPresenceChange?: (present: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const lastTap = useRef(0);
  const [armed, setArmed] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (armed) return undefined;
    const arm = () => setArmed(true);
    ARMING_EVENTS.forEach((type) => window.addEventListener(type, arm, { once: true, passive: true }));
    return () => ARMING_EVENTS.forEach((type) => window.removeEventListener(type, arm));
  }, [armed]);

  useEffect(() => {
    if (!armed || failed) return undefined;
    let cancelled = false;
    let engine: Engine | null = null;
    const fail = () => {
      if (cancelled) return;
      setFailed(true);
    };
    import('./mascotEngine.js')
      .then(({ createMascot }) => {
        if (cancelled || !containerRef.current) return;
        const dock = containerRef.current.parentElement as HTMLElement | null;
        engine = createMascot({
          container: containerRef.current,
          dock,
          button: buttonRef.current,
          calm: reducedMotion(),
          festive: false,
          halloween: false,
          ground: 'pill',
          dogPx: null,
          onReady: () => {
            if (!cancelled) setReady(true);
          },
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

  useEffect(() => {
    onPresenceChange?.(ready);
  }, [ready, onPresenceChange]);

  function onTap() {
    const engine = engineRef.current;
    if (!engine) return;
    const now = performance.now() / 1000;
    const streak = now - lastTap.current < STREAK_GAP;
    lastTap.current = now;
    if (streak && !reducedMotion() && engine.cheer) engine.cheer();
    else engine.trick();
  }

  if (failed) return null;
  const label = en ? "Vale d'Álvaro dog: tap for a trick" : "O cãozinho da Vale d'Álvaro: toque para um truque";
  return (
    <div ref={containerRef} className={'va-dock-mascot' + (ready ? ' is-ready' : '')}>
      <button
        ref={buttonRef}
        type="button"
        className="va-dock-mascot-hit"
        aria-label={label}
        title={label}
        tabIndex={ready ? 0 : -1}
        onClick={onTap}
      />
    </div>
  );
}
