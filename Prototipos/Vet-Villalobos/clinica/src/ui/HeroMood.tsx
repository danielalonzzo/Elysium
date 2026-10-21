'use client';
import {useState} from 'react';
import {ArrowRight, BedDouble, CalendarDays, ClipboardList, Plane, Scissors, Stethoscope} from 'lucide-react';
import {url} from '../core/config';

const link = (href: string) => href.startsWith('#') ? href : url(href);

/** «Hoy mi mascota…»: la puerta de entrada lúdica del héroe, una por necesidad. */
const MOODS = [
  {id: 'ok', label: 'está perfecta', en: 'is doing great', icon: ClipboardList, href: '#diagnostico', hint: 'Compruébelo en 2 minutos con el diagnóstico de cuidado.', enHint: 'Check it in 2 minutes with the care check-up.'},
  {id: 'odd', label: 'hace algo raro', en: 'is acting oddly', icon: Stethoscope, href: '#orientador', hint: 'Cuatro preguntas para saber qué tan pronto actuar.', enHint: 'Four questions to know how soon to act.'},
  {id: 'vax', label: 'tiene vacuna pendiente', en: 'is due a vaccination', icon: CalendarDays, href: '/citas', hint: 'Elija sede y franja, y reserve en línea.', enHint: 'Choose a clinic and a slot, and book online.'},
  {id: 'bath', label: 'necesita un baño', en: 'needs a bath', icon: Scissors, href: '/grooming', enHref: '/en/grooming', hint: 'Baño, corte y cuidado del pelaje a su medida.', enHint: 'Bathing, haircuts and coat care tailored to them.'},
  {id: 'stay', label: 'se queda unos días', en: 'is staying a few days', icon: BedDouble, href: '/hotel', enHref: '/en/hotel', hint: 'El hotel le cuida mientras usted no está.', enHint: 'Our pet hotel looks after them while you are away.'},
  {id: 'trip', label: 'se va de viaje', en: 'is going on a trip', icon: Plane, href: '/exportacion', enHref: '/en/exportacion', hint: 'Le acompañamos con los trámites según el destino.', enHint: 'We help with the paperwork for each destination.'},
];

export default function HeroMood({en = false}: {en?: boolean}) {
  const [active, setActive] = useState('ok');
  const mood = MOODS.find(m => m.id === active)!;
  return <div className="hero-mood">
    <span className="hero-mood-label">{en ? 'Today my pet…' : 'Hoy mi mascota…'}</span>
    <div className="hero-mood-chips">{MOODS.map(m => <button type="button" key={m.id} className={active === m.id ? 'selected' : ''} aria-pressed={active === m.id} onMouseEnter={() => setActive(m.id)} onFocus={() => setActive(m.id)} onClick={() => setActive(m.id)}><m.icon size={15}/>{en ? m.en : m.label}</button>)}</div>
    <a className="hero-mood-go" href={link(en && mood.enHref ? mood.enHref : mood.href)} key={mood.id}><span>{en ? mood.enHint : mood.hint}</span><ArrowRight size={18}/></a>
  </div>;
}
