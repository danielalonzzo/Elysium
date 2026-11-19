'use client';
import { useState } from 'react';
import { ArrowRight, CalendarDays, HeartPulse, Scissors, Stethoscope, Tractor } from 'lucide-react';
import { playSound } from './fx';
import { MOBILE, PHONE, PHONE_RAW, url } from '../core/config';

type Intent = {
  id: string;
  pt: string;
  en: string;
  replyPt: string;
  replyEn: string;
  ctaPt: string;
  ctaEn: string;
  href: string;
  icon: typeof Stethoscope;
};

const INTENTS: Intent[] = [
  {
    id: 'consulta',
    pt: 'Consulta ou vacina',
    en: 'Visit or vaccine',
    replyPt: 'Marcamos a consulta, análises ou reforço vacinal (e Cheque Veterinário OMV) sem demoras.',
    replyEn: 'We book your consultation, blood tests or vaccine booster (and OMV voucher) right away.',
    ctaPt: 'Escolher dia e hora',
    ctaEn: 'Pick day & time',
    href: url('/citas'),
    icon: Stethoscope,
  },
  {
    id: 'sintoma',
    pt: 'Notei um sintoma',
    en: 'I noticed a symptom',
    replyPt: `Responda a 4 perguntas rápidas no orientador ou ligue diretamente para ${PHONE} / ${MOBILE}.`,
    replyEn: `Answer 4 quick questions in our triage guide or call ${PHONE} / ${MOBILE} directly.`,
    ctaPt: 'Abrir orientador',
    ctaEn: 'Open triage guide',
    href: '#orientador',
    icon: HeartPulse,
  },
  {
    id: 'banho-hotel',
    pt: 'Tosquia, banho ou hotel',
    en: 'Grooming or pet hotel',
    replyPt: 'Tosquias, banhos tranquilos e alojamento com vigilância veterinária na Rua de Montesinho.',
    replyEn: 'Gentle grooming, baths and vet-supervised boarding right on Rua de Montesinho.',
    ctaPt: 'Pedir vaga',
    ctaEn: 'Request a spot',
    href: '#contacto',
    icon: Scissors,
  },
  {
    id: 'pecuaria',
    pt: 'Pecuária & suiniculturas',
    en: 'Livestock & swine',
    replyPt: 'Clínica e cirurgia de espécies pecuárias, equídeos e sanidade/reprodução em suiniculturas.',
    replyEn: 'Livestock & equine field medicine plus swine farm reproduction and herd health across Bragança & Vimioso.',
    ctaPt: `Ligar · ${PHONE}`,
    ctaEn: `Call · ${PHONE}`,
    href: `tel:${PHONE_RAW}`,
    icon: Tractor,
  },
];

export default function HeroMood({ en = false }: { en?: boolean }) {
  const [selected, setSelected] = useState<string>('consulta');
  const active = INTENTS.find((item) => item.id === selected) || INTENTS[0];

  function pick(id: string) {
    setSelected(id);
    playSound('click-en-boton');
  }

  return (
    <div className="va-mood" aria-label={en ? 'How can we help today?' : 'Em que podemos ajudar hoje?'}>
      <span className="va-mood-label">
        <CalendarDays size={15} aria-hidden="true" />
        {en ? 'What brings you here today?' : 'O que o traz hoje à clínica?'}
      </span>
      <div className="va-mood-chips" role="tablist" aria-label={en ? 'Quick topics' : 'Assuntos rápidos'}>
        {INTENTS.map((item) => {
          const Icon = item.icon;
          const isSelected = item.id === selected;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={isSelected ? 'is-active' : ''}
              onClick={() => pick(item.id)}
            >
              <Icon size={15} aria-hidden="true" />
              {en ? item.en : item.pt}
            </button>
          );
        })}
      </div>
      <a className="va-mood-reply" href={active.href}>
        <span>{en ? active.replyEn : active.replyPt}</span>
        <strong>
          {en ? active.ctaEn : active.ctaPt}
          <ArrowRight size={15} aria-hidden="true" />
        </strong>
      </a>
    </div>
  );
}
