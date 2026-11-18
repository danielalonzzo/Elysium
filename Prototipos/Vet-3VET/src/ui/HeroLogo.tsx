'use client';
import {useEffect, useRef, useState} from 'react';
import {playBark, playSound} from './fx';
import {url} from '../core/config';

type Engine = {play: (id: string) => void; finale: () => void; focus: (id: string) => void; destroy: () => void};
type Copy = {pt: string; en: string};
// Cada gesto enseña algo cierto: de la clínica (el «3», las urgencias) o del animal.
const PARTS: {id: string; name: Copy; title: Copy; text: Copy}[] = [
  {
    id: 'three',
    name: {pt: 'O «3»', en: 'The “3”'},
    title: {pt: 'Três veterinários', en: 'Three vets'},
    text: {
      pt: 'Dr. Nuno Morais, Dra. Ália Santos e Dr. Francisco Morais: cada um com a sua linha direta.',
      en: 'Dr Nuno Morais, Dr Ália Santos and Dr Francisco Morais: each with a direct line.',
    },
  },
  {
    id: 'vet',
    name: {pt: 'VET', en: 'VET'},
    title: {pt: 'Urgências 24 h', en: '24 h emergencies'},
    text: {pt: '917 788 992 · 963 057 504 · 961 544 749 — a qualquer hora.', en: '917 788 992 · 963 057 504 · 961 544 749 — day or night.'},
  },
  {
    id: 'cat',
    name: {pt: 'Gato', en: 'Cat'},
    title: {pt: 'Ouvido fino', en: 'Sharp ears'},
    text: {pt: 'Cada orelha tem cerca de 30 músculos e roda quase 180° para localizar um som.', en: 'Each ear has around 30 muscles and turns almost 180° to find a sound.'},
  },
  {
    id: 'dog',
    name: {pt: 'Cão', en: 'Dog'},
    title: {pt: 'Nariz de campeão', en: 'Champion nose'},
    text: {pt: 'Tem até 300 milhões de recetores olfativos; nós temos uns 6 milhões.', en: 'Up to 300 million scent receptors; we have about 6 million.'},
  },
];

export default function HeroLogo({en = false}: {en?: boolean}) {
  const canvas = useRef<HTMLCanvasElement>(null), engine = useRef<Engine | null>(null), found = useRef(new Set<string>()), celebrated = useRef(false), timers = useRef<number[]>([]), onPick = useRef<(id: string) => void>(() => {});
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [hover, setHover] = useState(''), [woken, setWoken] = useState<string[]>([]), [card, setCard] = useState<{kicker: string; title: string; text: string} | null>(null);
  const L = (c: Copy) => (en ? c.en : c.pt);
  const later = (ms: number, fn: () => void) => {timers.current.push(window.setTimeout(fn, ms));};

  useEffect(() => {
    let alive = true;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    (async () => {
      try {
        const {mountHeroLogo} = await import('./heroLogoEngine.js');
        if (!alive || !canvas.current) return;
        const e = await mountHeroLogo(canvas.current, {onSelect: (id: string) => onPick.current(id), onHover: setHover, reducedMotion});
        if (!alive) {e.destroy(); return;}
        engine.current = e; setReady(true);
      } catch (err) {console.error('mountHeroLogo error:', err); if (alive) setFailed(true);}
    })();
    const t = timers.current;
    return () => {alive = false; t.forEach(clearTimeout); engine.current?.destroy(); engine.current = null;};
  }, []);

  function wake(id: string) {
    const a = PARTS.find(x => x.id === id); if (!a) return;
    engine.current?.play(id);
    if (id === 'dog') playBark(); else playSound('click-en-boton');
    found.current.add(id); setWoken([...found.current]);
    setCard({kicker: L(a.name), title: L(a.title), text: L(a.text)});
    timers.current.forEach(clearTimeout); timers.current = [];
    if (found.current.size === PARTS.length && !celebrated.current) {
      celebrated.current = true;
      later(3000, () => {
        engine.current?.finale(); playSound('enviado-con-exito');
        setCard({
          kicker: 'Macedo de Cavaleiros · Mirandela',
          title: en ? 'Two clinics, one 3VET' : 'Duas clínicas, uma 3VET',
          text: en ? 'Dogs, cats and farm animals: the same three vets, the same care.' : 'Cães, gatos e animais da quinta: os mesmos três veterinários, o mesmo cuidado.',
        });
      });
      later(10500, () => setCard(null));
    } else later(6500, () => setCard(null));
  }

  useEffect(() => {onPick.current = wake;});
  const hovered = PARTS.find(a => a.id === hover);
  const kicker = hovered ? `${L(hovered.name)} · ${L(hovered.title)}` : woken.length === PARTS.length ? (en ? 'Touch any part again' : 'Toque outra vez em qualquer parte') : (en ? 'Touch the 3, VET, the cat and the dog' : 'Toque no 3, em VET, no gato e no cão');
  return (
    <div className={'hero-logo-scene emblem-vitrine v3-emblem' + (ready ? ' is-ready' : '')}>
      <canvas ref={canvas} className="emblem-canvas" aria-hidden="true" />
      {!ready && !failed && <div className="emblem-loading" aria-hidden="true"><i /></div>}
      {/* eslint-disable-next-line @next/next/no-img-element -- sin WebGL: el mismo calco en SVG */}
      {failed && <img className="emblem-fallback" src={url('/images/3vet/3vet-lockup.svg')} alt="3VET Saúde Animal" />}
      <div className="emblem-head" aria-hidden="true">
        <span className="emblem-kicker" key={kicker}>{kicker}</span>
        <span className="emblem-pips">{PARTS.map(a => <i key={a.id} data-part={a.id} className={woken.includes(a.id) ? 'on' : ''} />)}</span>
      </div>
      <div className="emblem-keys" role="group" aria-label={en ? 'Living logo: wake each part' : 'Logótipo vivo: desperte cada parte'}>
        {PARTS.map(a => (
          <button type="button" key={a.id} onClick={() => wake(a.id)} onFocus={() => engine.current?.focus(a.id)} onBlur={() => engine.current?.focus('')}>
            {(en ? 'Wake: ' : 'Despertar: ') + L(a.name)}
          </button>
        ))}
      </div>
      <div className={'emblem-card' + (card ? ' show' : '')} aria-live="polite">
        {card && <><small>{card.kicker}</small><strong>{card.title}</strong><span>{card.text}</span></>}
      </div>
      <span className="emblem-sign" aria-hidden="true">{en ? 'Modelled in Blender' : 'Modelado em Blender'} · Trás-os-Montes</span>
    </div>
  );
}
