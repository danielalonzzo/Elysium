'use client';
import { useState } from 'react';
import {
  AlertTriangle,
  Cat,
  CheckCircle2,
  Dog,
  HeartPulse,
  Home,
  LoaderCircle,
  Mail,
  MessageCircle,
  PawPrint,
  Phone,
  RotateCcw,
  Scissors,
  Send,
  Stethoscope,
  Syringe,
  Tractor,
} from 'lucide-react';
import { PawBurst, playSound } from './fx';
import { BRAND, BRAND_SHORT, EMAIL, MOBILE, PHONE, WHATSAPP } from '../core/config';
import { sendInquiry } from '../core/inquiry';

type Icon = React.ComponentType<{ size?: number }>;

const topics: [string, string, Icon][] = [
  ['Consulta Médico-Veterinária', 'Veterinary consultation', Stethoscope],
  ['Vacinação, SIAC & Cheque OMV', 'Vaccination, SIAC & OMV voucher', Syringe],
  ['Cirurgia, Análises ou Internamento', 'Surgery, labs or hospitalization', HeartPulse],
  ['Tosquias & Banhos', 'Grooming & bathing', Scissors],
  ['Hotel / Alojamento Animal', 'Pet hotel boarding', Home],
  ['Pecuária, Suiniculturas & Domicílios', 'Livestock, swine & farm calls', Tractor],
  ['Nutrição, Vimioso ou Outro', 'Nutrition, Vimioso or other', MessageCircle],
];

const species: [string, string, Icon][] = [
  ['Cão', 'Dog', Dog],
  ['Gato', 'Cat', Cat],
  ['Equídeos', 'Equids', PawPrint],
  ['Bovinos', 'Cattle', Tractor],
  ['Ovinos / Caprinos', 'Sheep / Goats', PawPrint],
  ['Suínos', 'Pigs', PawPrint],
  ['Coelho / Ave / Outra', 'Rabbit / Bird / Other', PawPrint],
];

const channels: [string, string, Icon][] = [
  ['Telefone', 'Phone call', Phone],
  ['WhatsApp', 'WhatsApp', MessageCircle],
  ['Email', 'Email', Mail],
];

const COPY = {
  pt: {
    pickTopic: 'Por favor, selecione o motivo do seu contacto.',
    sendError: `Não foi possível enviar o pedido. Por favor, ligue para ${PHONE} ou ${MOBILE}, ou escreva por WhatsApp.`,
    sentTitle: 'Pedido recebido com sucesso!',
    greeting: 'Obrigado pelo seu contacto sobre {pet}. ',
    sentBody: `A equipa da ${BRAND} recebeu a sua mensagem e responderá por {channel} assim que possível. Em caso de urgência, ligue diretamente para ${PHONE} ou ${MOBILE}.`,
    channelNames: { Email: 'email', Telefone: 'telefone', WhatsApp: 'WhatsApp' } as Record<string, string>,
    another: 'Enviar outro pedido',
    eyebrow: `CONTACTO DIRETO · ${BRAND_SHORT.toUpperCase()}`,
    title: 'Como podemos ajudar?',
    intro: 'Deixe os dados essenciais do seu pedido para Bragança ou Consultório de Vimioso. Respondemos com calma e brevidade.',
    urgentTitle: 'Situação urgente?',
    urgentBody: `Não espere pelo formulário: ligue já para ${PHONE} ou ${MOBILE}.`,
    topic: 'Motivo do contacto',
    topicName: 'Motivo de contacto',
    optional: '(opcional)',
    speciesName: 'Espécie',
    name: 'O seu nome (ou nome da exploração)',
    namePh: 'Ex.: Maria Silva ou Quinta do Vale',
    petName: 'Nome do animal / efetivo',
    optionalPh: 'Opcional',
    phone: 'Telefone de contacto',
    email: 'Endereço de email',
    emailPh: EMAIL,
    message: 'Mensagem',
    messagePet: 'Conte-nos o que precisa para {pet}, datas pretendidas ou sinais observados.',
    messagePh: 'Descreva brevemente o motivo da consulta, datas para hotel/tosquia, domicílio ou apoio pecuário.',
    channel: 'Prefiro resposta por',
    channelName: 'Canal preferencial',
    consent: `Autorizo a ${BRAND} a tratar estes dados para responder e acompanhar este pedido.`,
    sending: 'A enviar pedido…',
    send: 'Enviar pedido',
    sendWhatsApp: 'Continuar no WhatsApp',
    whatsAppTitle: 'A sua mensagem está pronta no WhatsApp.',
    whatsAppBody: `Envie-a pelo WhatsApp para a equipa da ${BRAND}. Telefones: ${PHONE} · ${MOBILE}.`,
  },
  en: {
    pickTopic: 'Please choose the reason for your enquiry.',
    sendError: `Could not send your message. Please call ${PHONE} or ${MOBILE}, or reach us on WhatsApp.`,
    sentTitle: 'Message received!',
    greeting: 'Thank you for reaching out about {pet}. ',
    sentBody: `The ${BRAND} team has received your request and will get back to you via {channel}. For urgent matters, please call ${PHONE} or ${MOBILE} directly.`,
    channelNames: { Email: 'email', Telefone: 'phone', WhatsApp: 'WhatsApp' } as Record<string, string>,
    another: 'Send another message',
    eyebrow: `DIRECT CONTACT · ${BRAND_SHORT.toUpperCase()}`,
    title: 'How can we help?',
    intro: 'Share the key details of your visit or question for Bragança or our Vimioso clinic. We will reply promptly.',
    urgentTitle: 'Urgent situation?',
    urgentBody: `Do not wait for the form: please call ${PHONE} or ${MOBILE} right away.`,
    topic: 'Reason for enquiry',
    topicName: 'Topic',
    optional: '(optional)',
    speciesName: 'Species',
    name: 'Your name (or farm name)',
    namePh: 'E.g.: John Silva or Quinta do Vale',
    petName: 'Animal name / herd reference',
    optionalPh: 'Optional',
    phone: 'Phone number',
    email: 'Email address',
    emailPh: EMAIL,
    message: 'Message',
    messagePet: 'Tell us what {pet} needs, preferred dates or observed signs.',
    messagePh: 'Briefly describe your visit, grooming/boarding dates, home call or livestock enquiry.',
    channel: 'Preferred contact method',
    channelName: 'Channel',
    consent: `I authorise ${BRAND} to use these details to reply to my enquiry.`,
    sending: 'Sending…',
    send: 'Send message',
    sendWhatsApp: 'Continue on WhatsApp',
    whatsAppTitle: 'Your message is ready in WhatsApp.',
    whatsAppBody: `Send it via WhatsApp to the ${BRAND} team. Phones: ${PHONE} · ${MOBILE}.`,
  },
};

function Chips({
  name,
  items,
  value,
  onChange,
  en,
  small = false,
}: {
  name: string;
  items: [string, string, Icon][];
  value: string;
  onChange: (v: string) => void;
  en: boolean;
  small?: boolean;
}) {
  return (
    <div className={'chip-row' + (small ? ' small' : '')} role="radiogroup" aria-label={name}>
      {items.map(([id, english, Icon]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          className={value === id ? 'selected' : ''}
          onClick={() => onChange(id)}
        >
          <Icon size={small ? 14 : 16} />
          {en ? english : id}
        </button>
      ))}
    </div>
  );
}

export default function ContactForm({ en = false }: { en?: boolean }) {
  const c = en ? COPY.en : COPY.pt;
  const [topic, setTopic] = useState<string>('Consulta Médico-Veterinária');
  const [spec, setSpec] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [pet, setPet] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [channel, setChannel] = useState<string>('Telefone');
  const [consent, setConsent] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!topic) {
      setError(c.pickTopic);
      return;
    }

    setSending(true);
    try {
      const payload = {
        topic,
        species: spec,
        name,
        petName: pet,
        phone,
        email,
        message,
        channel,
        consent: consent ? 'yes' : '',
        lang: en ? 'en' : 'pt-PT',
      };

      const result = await sendInquiry(payload, c.sendError);
      if (result === 'whatsapp') {
        const text = [topic, name, phone, pet || spec, message].filter(Boolean).join(' · ');
        setWhatsAppUrl(`${WHATSAPP}?text=${encodeURIComponent(text)}`);
      }
      setSent(true);
      playSound('enviado-con-exito');
    } catch {
      setError(c.sendError);
      playSound('error');
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setSent(false);
    setWhatsAppUrl('');
    setMessage('');
    setPet('');
  }

  if (sent) {
    return (
      <div className="contact-form sent-panel">
        <PawBurst />
        <span className="sent-icon">
          <CheckCircle2 size={44} />
        </span>
        <h2>{c.sentTitle}</h2>
        <p>
          {pet ? c.greeting.replace('{pet}', pet) : ''}
          {c.sentBody.replace('{channel}', c.channelNames[channel] || channel)}
        </p>

        {whatsAppUrl ? (
          <div style={{ marginTop: 20 }}>
            <a className="button full" href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} />
              {c.sendWhatsApp}
            </a>
            <p className="micro" style={{ marginTop: 10 }}>
              {c.whatsAppBody}
            </p>
          </div>
        ) : null}

        <button type="button" className="button outline small" onClick={reset} style={{ marginTop: 24 }}>
          <RotateCcw size={15} /> {c.another}
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-heading">
        <span>{c.eyebrow}</span>
        <h2>{c.title}</h2>
        <p>{c.intro}</p>
      </div>

      <div className="urgent-note">
        <AlertTriangle size={18} />
        <div>
          <strong>{c.urgentTitle}</strong> {c.urgentBody}
        </div>
      </div>

      <div className="form-fields">
        <div className="field-group wide">
          <span className="field-label">{c.topic}</span>
          <Chips name={c.topicName} items={topics} value={topic} onChange={setTopic} en={en} />
        </div>

        <div className="field-group wide">
          <span className="field-label">
            {c.speciesName} <small>{c.optional}</small>
          </span>
          <Chips name={c.speciesName} items={species} value={spec} onChange={setSpec} en={en} small />
        </div>

        <label>
          {c.name}
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={c.namePh}
            autoComplete="name"
          />
        </label>

        <label>
          {c.petName} <small>{c.optional}</small>
          <input
            type="text"
            value={pet}
            onChange={(e) => setPet(e.target.value)}
            placeholder={c.optionalPh}
          />
        </label>

        <label>
          {c.phone}
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(+351) 9XX XXX XXX"
            autoComplete="tel"
          />
        </label>

        <label>
          {c.email}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={c.emailPh}
            autoComplete="email"
          />
        </label>

        <div className="field-group wide">
          <label>
            {pet ? c.messagePet.replace('{pet}', pet) : c.message}
            <textarea
              rows={2}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={c.messagePh}
            />
          </label>
        </div>

        <div className="field-group wide">
          <span className="field-label">{c.channel}</span>
          <Chips name={c.channelName} items={channels} value={channel} onChange={setChannel} en={en} small />
        </div>

        <label className="wide consent">
          <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>{c.consent}</span>
        </label>
      </div>

      {error && (
        <p className="form-status error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="button contact-submit" disabled={sending}>
        {sending ? (
          <>
            <LoaderCircle className="spin" size={17} /> {c.sending}
          </>
        ) : (
          <>
            <Send size={17} /> {c.send}
          </>
        )}
      </button>
    </form>
  );
}
