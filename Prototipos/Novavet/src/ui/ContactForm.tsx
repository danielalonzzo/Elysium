'use client';
import {useState} from 'react';
import {AlertTriangle, Cat, CheckCircle2, Dog, HeartPulse, LoaderCircle, Mail, MessageCircle, PawPrint, Phone, RotateCcw, Send, ShoppingBag, Stethoscope, Syringe, Users, Tractor} from 'lucide-react';
import {PawBurst, playSound} from './fx';
import {STATIC_SITE, PHONE, PHONE_RAW, EMAIL, ADDRESS_CITY, DGAV_LICENSE} from '../core/config';
import {sendInquiry} from '../core/inquiry';

type Icon = React.ComponentType<{size?: number}>;

const topics: [string, string, Icon][] = [
  ['Consulta Médico-Veterinária', 'Veterinary consultation', Stethoscope],
  ['Vacinação e Desparasitação', 'Vaccinations and deworming', Syringe],
  ['Pequenas Cirurgias', 'Minor surgery', HeartPulse],
  ['Apoio a Exploração Pecuária', 'Livestock farm advisory', Tractor],
  ['Produtos e Medicamentos DGAV', 'DGAV Veterinary medicines', ShoppingBag],
  ['Nutrição e Rações Especiais', 'Nutrition and specialized feeds', PawPrint],
  ['Informações e Outro Assunto', 'General inquiry', MessageCircle],
];

const species: [string, string, Icon][] = [
  ['Cão', 'Dog', Dog],
  ['Gato', 'Cat', Cat],
  ['Ovinos / Caprinos', 'Sheep / Goats', PawPrint],
  ['Bovinos', 'Cattle', Tractor],
  ['Equinos', 'Horses', PawPrint],
  ['Outra', 'Other', PawPrint],
];

const channels: [string, string, Icon][] = [
  ['Telefone', 'Phone call', Phone],
  ['WhatsApp', 'WhatsApp', MessageCircle],
  ['Email', 'Email', Mail],
];

const COPY = {
  es: {
    pickTopic: 'Por favor, selecione o motivo do seu contacto.',
    sendError: 'Não foi possível enviar a mensagem. Por favor, tente via telefone ou WhatsApp.',
    sentTitle: 'Mensagem recebida com sucesso!',
    greeting: 'Agradecemos o seu contacto em relação a {pet}. ',
    sentBody: `A equipa da Novavet já recebeu a sua consulta e entrará em contacto por {channel}. Em caso de emergência ou dúvida urgente, ligue diretamente para ${PHONE}.`,
    channelNames: {Email: 'email', Telefone: 'telefone', WhatsApp: 'WhatsApp'} as Record<string, string>,
    another: 'Enviar outra mensagem',
    eyebrow: 'CONTACTO DIRETO · NOVAVET',
    title: 'Como podemos ajudar?',
    intro: 'Preencha os dados essenciais para o seu pedido ou dúvida. Respondemos com a máxima brevidade.',
    urgentTitle: 'Situação clínica urgente?',
    urgentBody: `Não aguarde pelo formulário: contacte-nos já por telefone (${PHONE}).`,
    topic: 'Qual o motivo da consulta?',
    topicName: 'Motivo de contacto',
    patient: 'Identificação do animal ou exploração',
    optional: '(opcional)',
    speciesName: 'Espécie',
    name: 'Nome completo / Nome do produtor',
    namePh: 'Ex.: Maria Silva ou Quinta do Vale',
    petName: 'Nome do animal / Nº de efetivo',
    optionalPh: 'Opcional',
    phone: 'Telefone de contacto',
    email: 'Endereço de email',
    emailPh: 'exemplo@novavet.pt',
    message: 'Mensagem detalhada',
    messagePet: 'Descreva a necessidade de {pet}, sinais observados ou produtos pretendidos.',
    messagePh: 'Descreva detalhadamente a sua dúvida clínica, produtos pretendidos ou apoio zootécnico necessário.',
    channel: 'Prefiro ser contactado por',
    channelName: 'Canal preferencial',
    consent: 'Autorizo o tratamento destes dados para resposta e acompanhamento deste pedido pela Novavet.',
    sending: 'A enviar mensagem…',
    send: 'Enviar mensagem',
    sendWhatsApp: 'Continuar no WhatsApp',
    whatsAppTitle: 'A sua mensagem está preparada no WhatsApp.',
    whatsAppBody: `Envie-a através do WhatsApp para que a equipa da Novavet em Bragança possa responder de imediato. Telefone direto: ${PHONE}.`,
  },
  en: {
    pickTopic: 'Please choose the reason for your enquiry.',
    sendError: 'The message could not be sent. Please contact us via phone or WhatsApp.',
    sentTitle: 'Message received successfully!',
    greeting: 'Thank you for contacting us regarding {pet}. ',
    sentBody: `The Novavet team has received your enquiry and will reply via {channel}. For urgent medical situations, please call us directly at ${PHONE}.`,
    channelNames: {Email: 'email', Telefone: 'phone', WhatsApp: 'WhatsApp'} as Record<string, string>,
    another: 'Send another enquiry',
    eyebrow: 'DIRECT CONTACT · NOVAVET',
    title: 'How can we assist you?',
    intro: 'Share the essential details. We will respond as soon as possible.',
    urgentTitle: 'Urgent medical matter?',
    urgentBody: `Please do not wait for the form: call us immediately at ${PHONE}.`,
    topic: 'Reason for enquiry',
    topicName: 'Topic',
    patient: 'Animal or Farm details',
    optional: '(optional)',
    speciesName: 'Species',
    name: 'Full name / Producer name',
    namePh: 'E.g.: John Doe or Farm Name',
    petName: 'Pet name / Herd reference',
    optionalPh: 'Optional',
    phone: 'Contact phone',
    email: 'Email address',
    emailPh: 'name@example.com',
    message: 'Message',
    messagePet: 'Tell us about {pet}, observed symptoms or required supplies.',
    messagePh: 'Please describe your clinical query or requested agricultural supplies.',
    channel: 'Preferred contact method',
    channelName: 'Channel',
    consent: 'I authorise Novavet to process these details to reply to my request.',
    sending: 'Sending…',
    send: 'Send message',
    sendWhatsApp: 'Continue on WhatsApp',
    whatsAppTitle: 'Your message is ready in WhatsApp.',
    whatsAppBody: `Send it via WhatsApp so the Novavet team in Bragança can reply promptly. Direct phone: ${PHONE}.`,
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

export default function ContactForm({en = false}: {en?: boolean}) {
  const c = en ? COPY.en : COPY.es;
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
        pet,
        phone,
        email,
        message,
        channel,
        lang: en ? 'en' : 'pt-PT',
      };

      const result = await sendInquiry(payload);
      if (result.type === 'whatsapp') {
        setWhatsAppUrl(result.url);
      }
      setSent(true);
      playSound('enviado-con-exito');
    } catch (err: any) {
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
          <div style={{marginTop: 20}}>
            <a
              className="button full"
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8}}
            >
              <MessageCircle size={18} />
              {c.sendWhatsApp}
            </a>
            <p className="micro" style={{marginTop: 10}}>
              {c.whatsAppBody}
            </p>
          </div>
        ) : null}

        <button className="button outline small" onClick={reset} style={{marginTop: 24}}>
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
            onChange={e => setName(e.target.value)}
            placeholder={c.namePh}
            autoComplete="name"
          />
        </label>

        <label>
          {c.petName} <small>{c.optional}</small>
          <input
            type="text"
            value={pet}
            onChange={e => setPet(e.target.value)}
            placeholder={c.optionalPh}
          />
        </label>

        <label>
          {c.phone}
          <input
            type="tel"
            required
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="(+351) 9XX XXX XXX"
            autoComplete="tel"
          />
        </label>

        <label>
          {c.email}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={c.emailPh}
            autoComplete="email"
          />
        </label>

        <div className="field-group wide">
          <label>
            {pet ? c.messagePet.replace('{pet}', pet) : c.message}
            <textarea
              rows={4}
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={c.messagePh}
            />
          </label>
        </div>

        <div className="field-group wide">
          <span className="field-label">{c.channel}</span>
          <Chips name={c.channelName} items={channels} value={channel} onChange={setChannel} en={en} small />
        </div>

        <label className="wide consent">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
          />
          <span>{c.consent}</span>
        </label>
      </div>

      {error && <p className="form-status error">{error}</p>}

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
