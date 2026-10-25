'use client';
import {useState} from 'react';
import {ArrowRight, CalendarDays, ClipboardList, Stethoscope, ShoppingBag, Tractor} from 'lucide-react';
import {url} from '../core/config';

const link = (href: string) => href.startsWith('#') ? href : url(href);

const MOODS = [
  {
    id: 'ok',
    label: 'está impecável',
    en: 'is doing great',
    icon: ClipboardList,
    href: '#diagnostico',
    hint: 'Confirme em 2 minutos com a nossa avaliação de cuidados de rotina.',
    enHint: 'Check it in 2 minutes with our routine care check-up.'
  },
  {
    id: 'odd',
    label: 'apresenta sintomas invulgares',
    en: 'is showing odd symptoms',
    icon: Stethoscope,
    href: '#orientador',
    hint: 'Quatro perguntas rápidas para perceber com que prontidão deve consultar o médico veterinário.',
    enHint: 'Four quick questions to know how soon to consult the veterinary doctor.'
  },
  {
    id: 'vax',
    label: 'tem vacina ou desparasitação a expirar',
    en: 'needs vaccination or deworming',
    icon: CalendarDays,
    href: '#contacto',
    hint: 'Contacte o consultório pelo (+351) 273 331 286 para atualizar o boletim sanitário.',
    enHint: 'Call the practice at (+351) 273 331 286 to bring the health card up to date.'
  },
  {
    id: 'food',
    label: 'necessita de nutrição ou ração',
    en: 'needs nutrition or feed',
    icon: ShoppingBag,
    href: '#loja',
    hint: 'Consulte gamas clínicas e rações selecionadas disponíveis na loja da Rua do Loreto.',
    enHint: 'Explore clinical feeds and pet diets available at our store in Rua do Loreto.'
  },
  {
    id: 'farm',
    label: 'necessita de produtos agropecuários',
    en: 'needs farm/livestock supplies',
    icon: Tractor,
    href: '#agropecuaria',
    hint: 'Medicamentos veterinários autorizados e apoio a explorações pecuárias transmontanas.',
    enHint: 'Authorized veterinary pharmaceuticals and farm supplies in Trás-os-Montes.'
  },
];

export default function HeroMood({en = false}: {en?: boolean}) {
  const [active, setActive] = useState('ok');
  const mood = MOODS.find(m => m.id === active) || MOODS[0];

  return (
    <div className="hero-mood">
      <span className="hero-mood-label">{en ? 'Today my animal…' : 'Hoje o meu animal…'}</span>
      <div className="hero-mood-chips">
        {MOODS.map(m => (
          <button
            type="button"
            key={m.id}
            className={active === m.id ? 'selected' : ''}
            aria-pressed={active === m.id}
            onMouseEnter={() => setActive(m.id)}
            onFocus={() => setActive(m.id)}
            onClick={() => setActive(m.id)}
          >
            <m.icon size={15}/>
            {en ? m.en : m.label}
          </button>
        ))}
      </div>
      <a className="hero-mood-go" href={link(mood.href)} key={mood.id}>
        <span>{en ? mood.enHint : mood.hint}</span>
        <ArrowRight size={18}/>
      </a>
    </div>
  );
}
