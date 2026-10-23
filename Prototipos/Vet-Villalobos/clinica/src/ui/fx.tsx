'use client';
import {url} from '../core/config';
/**
 * Efectos compartidos de la parte pública: el sonido del sistema y la lluvia de
 * patitas con la que se celebra terminar algo (un diagnóstico, un mensaje).
 *
 * El sonido respeta el ajuste del sistema (`ely-audio-muted`, silenciado por
 * defecto) y su volumen. Las patitas son CSS puro y se congelan con
 * `prefers-reduced-motion`.
 */
export function playSound(name: 'enviado-con-exito' | 'error' | 'toque-al-vacio' | 'click-en-boton') {
  try {
    if (localStorage.getItem('ely-audio-muted') !== '0') return;
    const audio = new Audio(url(`/sounds/${name}.m4a`));
    audio.volume = Number(localStorage.getItem('ely-audio-volume') || .3);
    audio.play().catch(() => {});
  } catch { /* almacenamiento bloqueado: sin sonido */ }
}

export function playBark() {
  try {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('ely-audio-muted') === '1') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const vol = Number(localStorage.getItem('ely-audio-volume') || .35);

    function woof(time: number, pitch: number, duration: number) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(pitch * 2.2, time);
      filter.Q.setValueAtTime(3.2, time);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, time);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.45, time + duration);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(vol * 0.7, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    }

    woof(now + 0.16, 280, 0.14);
    woof(now + 0.82, 310, 0.15);
  } catch {}
}

export function PawPrint({className = ''}: {className?: string}) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="12" cy="15.5" rx="4.5" ry="3.5"/><ellipse cx="6" cy="10" rx="2" ry="2.8" transform="rotate(-15 6 10)"/><ellipse cx="10" cy="6.5" rx="1.8" ry="2.6" transform="rotate(-5 10 6.5)"/><ellipse cx="14" cy="6.5" rx="1.8" ry="2.6" transform="rotate(5 14 6.5)"/><ellipse cx="18" cy="10" rx="2" ry="2.8" transform="rotate(15 18 10)"/></svg>;
}

// Trayectorias fijas: misma lluvia en cada render, sin aleatoriedad que hidratar.
const BURST = Array.from({length: 16}, (_, i) => ({
  angle: i * 22.5 + (i % 2 ? 9 : -6),
  distance: 120 + (i * 37) % 110,
  size: 16 + (i * 7) % 16,
  delay: (i % 5) * 40,
  spin: (i % 2 ? 1 : -1) * (90 + (i * 29) % 180),
}));

/** Se monta con una `key` nueva cada vez que se quiere repetir. */
export function PawBurst() {
  return <div className="paw-burst" aria-hidden="true">{BURST.map((p, i) =>
    <span key={i} style={{'--a': `${p.angle}deg`, '--d': `${p.distance}px`, '--s': `${p.size}px`, '--delay': `${p.delay}ms`, '--spin': `${p.spin}deg`} as React.CSSProperties}><PawPrint/></span>)}</div>;
}
