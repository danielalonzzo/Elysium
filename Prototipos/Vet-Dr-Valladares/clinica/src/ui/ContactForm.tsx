'use client';
import {useState} from 'react';
import {AlertTriangle, Cat, CheckCircle2, Dog, HeartPulse, LoaderCircle, Mail, MessageCircle, PawPrint, Phone, Plane, RotateCcw, Scissors, Send, ShoppingBag, Stethoscope, Syringe, Users} from 'lucide-react';
import {PawBurst, playSound} from './fx';
import {STATIC_SITE} from '../core/config';
import {sendInquiry} from '../core/inquiry';

type Icon = React.ComponentType<{size?: number}>;
// El primer valor es el dato que llega al CRM y va siempre en español; el segundo, la etiqueta en inglés.
const topics: [string, string, Icon][] = [
  ['Consulta veterinaria', 'Veterinary consultation', Stethoscope], ['Vacunas y desparasitación', 'Vaccinations and deworming', Syringe], ['Grooming', 'Grooming', Scissors], ['Cirugía', 'Surgery', HeartPulse],
  ['Viajes y exportación', 'Travel and export', Plane], ['Productos y medicamentos', 'Products and medication', ShoppingBag], ['Trabajo social', 'Community work', Users], ['Otra consulta', 'Something else', MessageCircle],
];
const species: [string, string, Icon][] = [['Perro', 'Dog', Dog], ['Gato', 'Cat', Cat], ['Otra', 'Other', PawPrint]];
const channels: [string, string, Icon][] = [['WhatsApp', 'WhatsApp', MessageCircle], ['Llamada', 'Phone call', Phone], ['Correo', 'Email', Mail]];

const COPY = {
  es: {
    pickTopic: 'Elija el motivo de su consulta.', sendError: 'No se pudo enviar el mensaje.',
    sentTitle: '¡Mensaje recibido!', greeting: 'Un saludo para {pet}. ', sentBody: 'La clínica ya tiene su consulta y le responderá por {channel}. Si es urgente, no espere: llame al +506 8837 3246.',
    channelNames: {Correo: 'correo', Llamada: 'teléfono', WhatsApp: 'WhatsApp'} as Record<string, string>, another: 'Enviar otra consulta',
    eyebrow: 'CONTACTO DIRECTO', title: 'Cuéntenos qué necesita.', intro: 'Comparta los datos esenciales. No incluya información financiera ni documentos sensibles.',
    urgentTitle: '¿Es una urgencia?', urgentBody: 'No use el formulario: llame ahora.',
    topic: '¿En qué le ayudamos?', topicName: 'Motivo de contacto', patient: '¿Quién es el paciente?', optional: '(opcional)', speciesName: 'Especie',
    name: 'Nombre completo', namePh: 'Nombre y apellido', petName: 'Nombre de la mascota', optionalPh: 'Opcional', phone: 'Teléfono o WhatsApp', email: 'Correo electrónico', emailPh: 'nombre@correo.com',
    message: 'Mensaje', messagePet: 'Cuéntenos qué le pasa a {pet}, desde cuándo y cualquier dato relevante.', messagePh: 'Describa brevemente la consulta, desde cuándo ocurre y cualquier dato relevante.',
    channel: 'Prefiero que me contacten por', channelName: 'Medio de contacto', consent: 'Autorizo el uso de estos datos para responder esta solicitud.', sending: 'Enviando…', send: 'Enviar mensaje',
    sendWhatsApp: 'Continuar en WhatsApp', whatsAppTitle: 'Su mensaje está listo en WhatsApp.', whatsAppBody: 'Envíelo desde WhatsApp para que llegue a la clínica. Si es urgente, llame al +506 8837 3246.',
  },
  en: {
    pickTopic: 'Please choose the reason for your enquiry.', sendError: 'The message could not be sent.',
    sentTitle: 'Message received!', greeting: 'Say hello to {pet} for us. ', sentBody: 'The clinic now has your enquiry and will reply by {channel}. If it is urgent, don’t wait: call +506 8837 3246.',
    channelNames: {Correo: 'email', Llamada: 'phone', WhatsApp: 'WhatsApp'} as Record<string, string>, another: 'Send another enquiry',
    eyebrow: 'DIRECT CONTACT', title: 'Tell us what you need.', intro: 'Share the essential details. Please do not include financial information or sensitive documents.',
    urgentTitle: 'Is it an emergency?', urgentBody: 'Don’t use the form: call now.',
    topic: 'How can we help?', topicName: 'Reason for contact', patient: 'Who is the patient?', optional: '(optional)', speciesName: 'Species',
    name: 'Full name', namePh: 'First and last name', petName: 'Pet’s name', optionalPh: 'Optional', phone: 'Phone or WhatsApp', email: 'Email', emailPh: 'name@email.com',
    message: 'Message', messagePet: 'Tell us what is happening with {pet}, since when, and anything relevant.', messagePh: 'Briefly describe your enquiry, since when it has been happening and anything relevant.',
    channel: 'I’d prefer to be contacted by', channelName: 'Contact method', consent: 'I authorise the use of this data to answer this request.', sending: 'Sending…', send: 'Send message',
    sendWhatsApp: 'Continue in WhatsApp', whatsAppTitle: 'Your message is ready in WhatsApp.', whatsAppBody: 'Send it from WhatsApp so it reaches the clinic. If it is urgent, call +506 8837 3246.',
  },
};

function Chips({name, items, value, onChange, en, small = false}: {name: string, items: [string, string, Icon][], value: string, onChange: (v: string) => void, en: boolean, small?: boolean}) {
  return <div className={'chip-row' + (small ? ' small' : '')} role="radiogroup" aria-label={name}>{items.map(([id, english, Icon]) =>
    <button type="button" role="radio" aria-checked={value === id} key={id} className={value === id ? 'selected' : ''} onClick={() => onChange(value === id ? '' : id)}><Icon size={small ? 15 : 17}/>{en ? english : id}</button>)}</div>;
}

export default function ContactForm({compact = false, en = false}: {compact?: boolean, en?: boolean}) {
  const c = en ? COPY.en : COPY.es;
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle'), [message, setMessage] = useState(''), [via, setVia] = useState<'saved' | 'whatsapp'>('saved');
  const [topic, setTopic] = useState(''), [pet, setPet] = useState(''), [channel, setChannel] = useState('WhatsApp'), [length, setLength] = useState(0), [petName, setPetName] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!topic) { setState('error'); setMessage(c.pickTopic); playSound('error'); return; }
    setState('sending'); setMessage('');
    const form = e.currentTarget, data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const note = `Prefiere que le contacten por: ${channel}` + (en ? '\nEscrito desde la versión en inglés: conviene responder en inglés.' : '');
    const body = {...data, topic, species: pet, message: `${data.message}\n\n${note}`};
    try {
      setVia(await sendInquiry(body, c.sendError));
      form.reset(); setState('sent'); setLength(0); playSound('enviado-con-exito');
    } catch (error) { setState('error'); setMessage(error instanceof Error ? error.message : c.sendError); playSound('error'); }
  }

  if (state === 'sent') return <div className={'contact-form contact-sent ' + (compact ? 'compact' : '')} role="status">
    <PawBurst/>
    <span className="sent-icon"><CheckCircle2/></span>
    <h2>{via === 'whatsapp' ? c.whatsAppTitle : c.sentTitle}</h2>
    <p>{petName && <strong>{c.greeting.replace('{pet}', petName)}</strong>}{via === 'whatsapp' ? c.whatsAppBody : c.sentBody.replace('{channel}', c.channelNames[channel] || channel)}</p>
    <button type="button" className="button outline" onClick={() => { setState('idle'); setTopic(''); setPet(''); setPetName(''); }}><RotateCcw size={17}/>{c.another}</button>
  </div>;

  return <form className={'contact-form ' + (compact ? 'compact' : '')} onSubmit={submit}>
    <div className="form-heading"><span>{c.eyebrow}</span><h2>{c.title}</h2><p>{c.intro}</p></div>
    <a className="urgent-note" href="tel:+50688373246"><AlertTriangle size={18}/><span><strong>{c.urgentTitle}</strong> {c.urgentBody}</span><Phone size={16}/></a>
    <div className="form-fields">
      <div className="wide field-group"><span className="field-label">{c.topic}</span><Chips en={en} name={c.topicName} items={topics} value={topic} onChange={v => { setTopic(v); if (state === 'error') setState('idle'); }}/></div>
      <div className="wide field-group"><span className="field-label">{c.patient} <small>{c.optional}</small></span><Chips en={en} name={c.speciesName} items={species} value={pet} onChange={setPet}/></div>
      <label>{c.name}<input name="name" autoComplete="name" maxLength={100} required placeholder={c.namePh}/></label>
      <label>{c.petName}<input name="petName" maxLength={80} placeholder={c.optionalPh} value={petName} onChange={e => setPetName(e.target.value)}/></label>
      <label>{c.phone}<input name="phone" inputMode="tel" autoComplete="tel" maxLength={30} required placeholder="+506 8888 8888"/></label>
      <label>{c.email}<input name="email" type="email" autoComplete="email" maxLength={150} placeholder={c.emailPh}/></label>
      <label className="wide">{c.message}<textarea name="message" minLength={12} maxLength={1600} rows={5} required onChange={e => setLength(e.target.value.length)} placeholder={petName ? c.messagePet.replace('{pet}', petName) : c.messagePh}/><small className="char-count">{length}/1600</small></label>
      <div className="wide field-group"><span className="field-label">{c.channel}</span><Chips en={en} name={c.channelName} items={channels} value={channel} onChange={v => setChannel(v || 'WhatsApp')} small/></div>
      <label className="consent wide"><input type="checkbox" name="consent" value="yes" required/><span>{c.consent}</span></label><input className="honey" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
    </div>
    <button className="button contact-submit" disabled={state === 'sending'}>{state === 'sending' ? <LoaderCircle className="spin"/> : <Send/>}{state === 'sending' ? c.sending : STATIC_SITE ? c.sendWhatsApp : c.send}</button>
    {message && <p className={'form-status ' + state} role="alert">{message}</p>}
  </form>;
}
