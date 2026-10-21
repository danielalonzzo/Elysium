'use client';
import {useState} from 'react';
import {Clock3, MapPin, MessageCircle, Navigation, Phone} from 'lucide-react';
import {SEDES, WHATSAPP, tel} from '../core/config';
import {playSound} from './fx';

/**
 * El poste de señales de su cartel de «Ubicación», hecho con los colores del
 * logo: cada flecha es una sede y al tocarla se abre su ficha. Las flechas se
 * alternan a izquierda y derecha, rojo y grafito, como los dos paneles del logo.
 */
export default function SedesBoard({en = false}: {en?: boolean}) {
  const [active, setActive] = useState<string>(SEDES[0].id);
  const t = (es: string, english: string) => en ? english : es;
  const sede = SEDES.find(s => s.id === active)!;
  const address = en ? sede.en : sede.address;
  const hours = en ? sede.enHours : sede.hours;
  return <div className="sedes-board">
    <div className="signpost" role="group" aria-label={t('Elija una sede', 'Choose a clinic')}>
      <span className="signpost-pole" aria-hidden="true"/>
      {SEDES.map((s, i) => <button type="button" key={s.id} className={'sign ' + (i % 2 ? 'sign-right' : 'sign-left') + (active === s.id ? ' active' : '')} aria-pressed={active === s.id} style={{'--i': i} as React.CSSProperties} onClick={() => { setActive(s.id); playSound('click-en-boton'); }}>
        <MapPin size={16}/><strong>{s.name}</strong><small>{s.phone}</small>
      </button>)}
    </div>
    <article className="sede-detail" key={sede.id} aria-live="polite">
      <span className="eyebrow">{t('SEDE', 'CLINIC')} · {SEDES.indexOf(sede) + 1}/4</span>
      <h3>{sede.name}</h3>
      <p className="sede-line"><MapPin size={16}/>{address || t('Dirección: confírmela al llamar a la sede.', 'Address: please confirm it when you call.')}</p>
      <p className="sede-line"><Clock3 size={16}/>{hours || t('Horario: consúltelo directamente con la sede.', 'Opening hours: please check with the clinic.')}</p>
      <div className="sede-actions">
        <a className="button small" href={tel(sede.phone)}><Phone size={16}/>{t('Llamar', 'Call')} {sede.phone}</a>
        <a className="button small outline" href={sede.map} target="_blank" rel="noopener noreferrer"><Navigation size={16}/>{address ? t('Cómo llegar', 'Directions') : t('Buscar en Maps', 'Find on Maps')}</a>
        <a className="text-link" href={WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/>WhatsApp</a>
      </div>
    </article>
  </div>;
}
