import {ArrowUpRight, Clock3, MapPin} from 'lucide-react';
import {SEDES, tel} from '../core/config';

/**
 * Las cuatro sedes como un índice: número, nombre, dónde está, cuándo abre y su
 * teléfono, todo a la vista y sin tener que tocar nada. Solo se escribe lo que
 * la clínica publica; lo que falta se dice («confírmela al llamar»).
 */
export default function SedesIndex({en = false}: {en?: boolean}) {
  const t = (es: string, english: string) => en ? english : es;
  return <div className="sedes-index">
    {SEDES.map((s, i) => {
      const address = en ? s.en : s.address, hours = en ? s.enHours : s.hours;
      return <article className="sede-row" id={'sede-' + s.id} key={s.id}>
        <span className="sede-n">0{i + 1}</span>
        <h3>{s.name}</h3>
        <div className="sede-facts">
          <p><MapPin size={15}/>{address || t('Dirección: confírmela al llamar a la sede.', 'Address: please confirm it when you call.')}</p>
          <p><Clock3 size={15}/>{hours || t('Horario: consúltelo directamente con la sede.', 'Opening hours: please check with the clinic.')}</p>
        </div>
        <div className="sede-links">
          <a className="sede-phone" href={tel(s.phone)} aria-label={t('Llamar a ', 'Call ') + s.name + ', ' + s.phone}>{s.phone}</a>
          <a className="text-link" href={s.map} target="_blank" rel="noopener noreferrer">{address ? t('Cómo llegar', 'Directions') : t('Buscar en Maps', 'Find on Maps')}<ArrowUpRight/></a>
        </div>
      </article>;
    })}
  </div>;
}
