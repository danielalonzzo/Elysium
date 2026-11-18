'use client';
import {useState, useEffect, useRef} from 'react';
import {ArrowRight, ArrowUpRight, CalendarDays, HeartPulse, MapPin, MessageCircle, Navigation, PawPrint, Phone, Pill, ShieldCheck, ShoppingBag, Star, Stethoscope, Siren, Clock3} from 'lucide-react';
import SiteShell, {Instagram, Facebook} from './SiteShell';
import ContactForm from './ContactForm';
import HeroLogo from './HeroLogo';
import CareDiagnostic from './CareDiagnostic';
import SymptomGuide from './SymptomGuide';
import PetAgeCalculator from './PetAgeCalculator';
import MythQuiz from './MythQuiz';
import Reveal from './Reveal';
import {
  BRAND, ADDRESS_STREET, ADDRESS_POSTAL, ADDRESS_CITY, FULL_ADDRESS, GPS_LAT, GPS_LNG, MAP_EMBED, PHONE, PHONE_RAW,
  TEAM, SEDES, GOOGLE_RATING, INSTAGRAM, FACEBOOK, WHATSAPP, ORIGIN, services, url, getBusinessStatus,
} from '../core/config';

const ICONS: Record<string, typeof Stethoscope> = {Stethoscope, HeartPulse, ShieldCheck, PawPrint, Pill, ShoppingBag};
// Las especies de su biografía de Instagram, tal cual las escribe la clínica.
const SPECIES = [
  {e: '🐕', pt: 'Cães', en: 'Dogs'}, {e: '🐈', pt: 'Gatos', en: 'Cats'}, {e: '🐄', pt: 'Bovinos', en: 'Cattle'},
  {e: '🐖', pt: 'Suínos', en: 'Pigs'}, {e: '🐑', pt: 'Ovinos', en: 'Sheep'}, {e: '🐐', pt: 'Caprinos', en: 'Goats'},
];

export default function PublicPage({slug = '', en = false}: {slug?: string; en?: boolean}) {
  const t = (pt: string, english: string) => (en ? english : pt);
  const p = url(en ? '/en' : '');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VeterinaryCare',
    name: BRAND,
    url: ORIGIN,
    telephone: PHONE_RAW,
    sameAs: [INSTAGRAM, FACEBOOK],
    aggregateRating: {'@type': 'AggregateRating', ratingValue: 4.8, reviewCount: GOOGLE_RATING.count},
    department: SEDES.map((s) => ({'@type': 'VeterinaryCare', name: s.name, telephone: s.phone, address: s.address})),
    address: {'@type': 'PostalAddress', streetAddress: ADDRESS_STREET, addressLocality: ADDRESS_CITY, postalCode: ADDRESS_POSTAL, addressRegion: 'Bragança', addressCountry: 'PT'},
    geo: {'@type': 'GeoCoordinates', latitude: GPS_LAT, longitude: GPS_LNG},
    openingHoursSpecification: [
      {'@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '12:00'},
      {'@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '14:00', closes: '19:00'},
      {'@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:00', closes: '12:00'},
    ],
  };

  return (
    <SiteShell en={en}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}} />
      <main id="main" className="v3">
        {slug ? <SubPage slug={slug} t={t} en={en} /> : <Home t={t} p={p} en={en} />}
      </main>
    </SiteShell>
  );
}

type T = (pt: string, en: string) => string;

function ServiceCards({en}: {en: boolean}) {
  const track = useRef<HTMLDivElement>(null);
  const interacting = useRef(false);
  const [active, setActive] = useState(0);
  const regular = services.filter(service => service.id !== 'urgencias');
  const urgent = services.find(service => service.id === 'urgencias');
  useEffect(() => {
    const timer = window.setInterval(() => {
      const element = track.current;
      if (!element || interacting.current || !window.matchMedia('(max-width: 620px)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const current = Math.round(element.scrollLeft / element.clientWidth);
      element.scrollTo({left: ((current + 1) % regular.length) * element.clientWidth, behavior: 'smooth'});
    }, 5000);
    return () => window.clearInterval(timer);
  }, [regular.length]);
  const card = (srv: typeof services[number]) => {
    const Icon = ICONS[srv.icon] || PawPrint;
    return <article className={'v3-service' + (srv.id === 'urgencias' ? ' is-urg' : '')} key={srv.id}>
      <span className="v3-service-icon"><Icon size={22} /></span>
      <small>{srv.tag}</small>
      <h3>{en ? srv.en : srv.name}</h3>
      <p>{en ? srv.english : srv.text}</p>
    </article>;
  };
  return <>
    <div className="v3-services v3-services-desktop">{services.map(card)}</div>
    <div className="v3-services-mobile">
      {urgent && card(urgent)}
      <div ref={track} className="v3-service-carousel" role="region" aria-label={en ? 'Services' : 'Serviços'}
        onTouchStart={() => { interacting.current = true; }} onTouchEnd={() => { interacting.current = false; }}
        onFocusCapture={() => { interacting.current = true; }} onBlurCapture={() => { interacting.current = false; }}
        onScroll={() => { const element = track.current; if (element) setActive(Math.round(element.scrollLeft / element.clientWidth)); }}>
        {regular.map(card)}
      </div>
      <div className="v3-service-dots">{regular.map((service, index) => <button key={service.id} type="button" aria-label={en ? service.en : service.name} aria-current={active === index ? 'true' : undefined} onClick={() => track.current?.scrollTo({left: index * track.current.clientWidth, behavior: 'smooth'})} />)}</div>
    </div>
  </>;
}

function Home({t, p, en}: {t: T; p: string; en: boolean}) {
  const [status, setStatus] = useState(() => getBusinessStatus());
  useEffect(() => {
    const i = setInterval(() => setStatus(getBusinessStatus()), 30000);
    return () => clearInterval(i);
  }, []);

  return (
    <>
      {/* PORTADA: el emblema vivo es la marca misma, calcada en Blender */}
      <section className="v3-hero">
        <div className="v3-hero-copy">
          <div className="v3-hero-chips">
            <span className="v3-chip"><MapPin size={14} /> Macedo de Cavaleiros · Mirandela</span>
            <span className={`v3-chip v3-chip-status ${status.state}`} suppressHydrationWarning><i /> {status.text}</span>
          </div>
          <h1 className="v3-h1">
            {t('Três veterinários.', 'Three vets.')}
            <br />
            {t('Duas clínicas.', 'Two clinics.')}
            <br />
            <span className="v3-sunrise-text">{t('O mesmo cuidado.', 'The same care.')}</span>
          </h1>
          <p className="v3-lead">
            {t(
              'A 3VET junta o Centro Veterinário Dr. Nuno Morais, em Macedo de Cavaleiros, e a Clínica Veterinária de Mirandela. Cuidamos de cães e gatos, e também de vacas, porcos, ovelhas e cabras. Dispomos de urgências 24 horas.',
              '3VET brings together the Dr. Nuno Morais Veterinary Centre in Macedo de Cavaleiros and the Mirandela Veterinary Clinic. We care for dogs and cats, and for cattle, pigs, sheep and goats too — with 24-hour emergencies.',
            )}
          </p>
          <div className="v3-hero-actions">
            <a className="v3-btn v3-btn-primary v3-btn-lg" href={url('/crm')}>
              <CalendarDays size={18} /> {t('Marcar consulta', 'Book a visit')}
            </a>
            <a className="v3-btn v3-btn-urg v3-btn-lg" href={`tel:${TEAM[0].raw}`}>
              <Siren size={18} /> {t('Urgência 24 h', '24 h emergency')}
            </a>
          </div>
          <ul className="v3-species" aria-label={t('Espécies que tratamos', 'Species we treat')}>
            {SPECIES.map((s) => (
              <li key={s.pt}><span aria-hidden="true">{s.e}</span>{en ? s.en : s.pt}</li>
            ))}
          </ul>
        </div>
        <div className="v3-hero-visual">
          <HeroLogo en={en} />
        </div>
      </section>

      {/* URGÊNCIAS: a composição do próprio cartel da clínica */}
      <section className="v3-banner" aria-labelledby="urgencias">
        <div className="v3-banner-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- calco do cartel */}
          <img src={url('/images/3vet/3vet-lockup.svg')} alt="" width={190} height={200} />
        </div>
        <div className="v3-banner-orange">
          <span className="v3-banner-kicker">{t('Clínica Veterinária', 'Veterinary clinic')}</span>
          <h2 id="urgencias">
            <span>+</span> {t('Urgências 24H', '24H Emergencies')}
          </h2>
          <p>{t('Fora de horas, ligue para uma das três linhas diretas dos veterinários.', 'Out of hours, call one of the vets’ three direct lines.')}</p>
          <div className="v3-banner-lines">
            {TEAM.map((v) => (
              <a key={v.id} href={`tel:${v.raw}`}>
                <strong>{v.display}</strong>
                <small>{en ? v.en : v.name}</small>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPA: o «3» são três pessoas */}
      <Reveal>
        <section className="v3-section" id="equipa">
          <header className="v3-section-head">
            <span className="v3-eyebrow">{t('A equipa', 'The team')}</span>
            <h2>{t('O 3 da 3VET tem nome.', 'The 3 in 3VET has names.')}</h2>
            <p>{t('Cada veterinário tem a sua linha direta, a mesma que está no cartão que entregamos na clínica. Ligue para quem já conhece o seu animal.', 'Each vet has a direct line — the same one on the card we hand out at the clinic. Call the person who already knows your animal.')}</p>
          </header>
          <div className="v3-team">
            {TEAM.map((v, i) => (
              <article key={v.id} className="v3-vet" style={{'--c': v.color} as React.CSSProperties}>
                <span className="v3-vet-mark" data-part={v.part} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element -- o «3» com o seu tramo aceso */}
                  <img src={url('/images/3vet/3vet-mark.svg')} alt="" width={46} height={60} />
                </span>
                <span className="v3-vet-n">0{i + 1}</span>
                <h3>{en ? v.en : v.name}</h3>
                <p>{t(v.role, 'Veterinary surgeon')} · 3VET</p>
                <a className="v3-vet-line" href={`tel:${v.raw}`}>
                  <Phone size={16} /> {v.display}
                </a>
              </article>
            ))}
          </div>
          <figure className="v3-review">
            <div className="v3-stars" aria-label={`${GOOGLE_RATING.score} de 5`}>
              {[0, 1, 2, 3, 4].map((k) => <Star key={k} size={18} fill="currentColor" />)}
              <strong>{GOOGLE_RATING.score}</strong>
              <span>· {GOOGLE_RATING.count} {t('críticas no Google', 'Google reviews')}</span>
            </div>
            <blockquote>«Veterinários muito profissionais, cuidadosos e além de tudo simpáticos.»</blockquote>
            <figcaption>{t('Crítica de uma cliente no Google Maps', 'A client review on Google Maps')}</figcaption>
          </figure>
        </section>
      </Reveal>

      {/* DUAS CLÍNICAS: como na fotografia de perfil — verde e gato em Macedo, laranja e cão em Mirandela */}
      <Reveal>
        <section className="v3-section v3-section-tint" id="clinicas">
          <header className="v3-section-head">
            <span className="v3-eyebrow">{t('Duas clínicas', 'Two clinics')}</span>
            <h2>{t('Perto de casa, na Terra Quente.', 'Close to home in the Terra Quente.')}</h2>
          </header>
          <div className="v3-clinics">
            {[...SEDES].reverse().map((s) => (
              <article key={s.id} className={`v3-clinic v3-clinic-${s.id}`}>
                <div className="v3-clinic-art" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element -- gato e cão de traço da marca */}
                  <img src={url(s.id === 'macedo' ? '/images/3vet/3vet-cat.svg' : '/images/3vet/3vet-dog.svg')} alt="" />
                </div>
                <span className="v3-clinic-town">{s.id === 'macedo' ? 'Macedo de Cavaleiros' : 'Mirandela'}</span>
                <h3>{s.name}</h3>
                <p className="v3-clinic-addr"><MapPin size={16} /> {en ? s.en : s.address}</p>
                <p className="v3-clinic-hours"><Clock3 size={16} /> {en ? s.enHours : s.hours}</p>
                <div className="v3-clinic-actions">
                  <a className="v3-btn v3-btn-light" href={`tel:${s.phone.replace(/\s/g, '')}`}><Phone size={15} /> {s.phone}</a>
                  <a className="v3-btn v3-btn-outline-light" href={s.map} target="_blank" rel="noopener noreferrer"><Navigation size={15} /> {t('Como chegar', 'Directions')}</a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      {/* SERVIÇOS */}
      <Reveal>
        <section className="v3-section" id="servicos">
          <header className="v3-section-head">
            <span className="v3-eyebrow">{t('Serviços', 'Services')}</span>
            <h2>{t('Da sala de espera ao curral.', 'From the waiting room to the farm.')}</h2>
          </header>
          <ServiceCards en={en} />
        </section>
      </Reveal>

      {/* ANTES DA CONSULTA */}
      <Reveal>
        <section className="v3-section v3-section-tint" id="ferramentas">
          <header className="v3-section-head">
            <span className="v3-eyebrow">{t('Antes da consulta', 'Before the visit')}</span>
            <h2>{t('Ajuda para decidir com calma.', 'Help to decide calmly.')}</h2>
            <p>{t('Não substituem a consulta, mas ajudam a perceber quando ligar e o que perguntar.', 'They do not replace a visit, but help you know when to call and what to ask.')}</p>
          </header>
          <div className="v3-tools">
            <a className="v3-tool" href={p + '/orientador'}>
              <HeartPulse size={26} />
              <strong>{t('Orientador de sintomas', 'Symptom guide')}</strong>
              <span>{t('É urgente ou pode esperar? Responda a três perguntas.', 'Urgent or can it wait? Answer three questions.')}</span>
              <em>{t('Abrir', 'Open')} <ArrowRight size={15} /></em>
            </a>
            <a className="v3-tool" href={p + '/diagnostico'}>
              <Stethoscope size={26} />
              <strong>{t('Check-up de cuidados', 'Care check-up')}</strong>
              <span>{t('Vacinas, desparasitação e idade: veja o que está em falta.', 'Vaccines, parasites and age: see what is due.')}</span>
              <em>{t('Abrir', 'Open')} <ArrowRight size={15} /></em>
            </a>
            <a className="v3-tool" href={url('/crm')}>
              <CalendarDays size={26} />
              <strong>{t('Marcação online', 'Online booking')}</strong>
              <span>{t('Escolha a clínica, o dia e a hora sem telefonar.', 'Choose the clinic, day and time without calling.')}</span>
              <em>{t('Marcar', 'Book')} <ArrowRight size={15} /></em>
            </a>
          </div>
          <div className="v3-quiz"><MythQuiz en={en} /></div>
        </section>
      </Reveal>

      {/* CONTACTO */}
      <Reveal>
        <section className="v3-section" id="contacto">
          <div className="v3-contact">
            <div>
              <span className="v3-eyebrow">{t('Contactos', 'Contact')}</span>
              <h2>{t('Fale connosco.', 'Talk to us.')}</h2>
              <p className="v3-contact-lead">{t('Para marcar, tirar uma dúvida ou pedir uma ração. Em urgência, ligue: não espere pela resposta ao formulário.', 'To book, ask a question or order food. In an emergency, call — do not wait for a form reply.')}</p>
              <ul className="v3-contact-list">
                {TEAM.map((v) => (
                  <li key={v.id} style={{'--c': v.color} as React.CSSProperties}>
                    <a href={`tel:${v.raw}`}><Phone size={16} /> <strong>{v.display}</strong> <small>{en ? v.en : v.name}</small></a>
                  </li>
                ))}
                <li><a href={WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> <strong>WhatsApp</strong> <small>961 544 749</small></a></li>
                <li><a href={INSTAGRAM} target="_blank" rel="noopener noreferrer"><Instagram size={16} /> <strong>@3vet_macedo.mirandela</strong></a></li>
                <li><a href={FACEBOOK} target="_blank" rel="noopener noreferrer"><Facebook size={16} /> <strong>3Vet · Clínica Veterinária de Mirandela</strong></a></li>
              </ul>

            </div>
            <div className="v3-form-card">
              <ContactForm en={en} />
            </div>
              <div className="v3-map">
                <iframe src={MAP_EMBED} width="100%" height="220" loading="lazy" title={t('Mapa da clínica 3VET em Mirandela', '3VET clinic map in Mirandela')} />
              </div>
          </div>

        </section>
      </Reveal>
    </>
  );
}

function SubPage({slug, t, en}: {slug: string; t: T; en: boolean}) {
  const titles: Record<string, [string, string]> = {
    orientador: ['Orientador de sintomas', 'Symptom guide'],
    diagnostico: ['Check-up de cuidados', 'Care check-up'],
    servicios: ['Serviços', 'Services'],
    privacidad: ['Privacidade', 'Privacy'],
  };
  const [pt, english] = titles[slug] || ['Contactos', 'Contact'];
  return (
    <div className="v3-section v3-subpage">
      <header className="v3-section-head">
        <span className="v3-eyebrow">3VET Saúde Animal · Macedo de Cavaleiros · Mirandela</span>
        <h1>{t(pt, english)}</h1>
      </header>
      {slug === 'orientador' ? (
        <SymptomGuide en={en} />
      ) : slug === 'diagnostico' ? (
        <>
          <CareDiagnostic en={en} />
          <PetAgeCalculator en={en} />
          <MythQuiz en={en} />
        </>
      ) : slug === 'servicios' ? (
        <div className="v3-services">
          {services.map((srv) => (
            <article className="v3-service" key={srv.id}>
              <small>{srv.tag}</small>
              <h3>{en ? srv.en : srv.name}</h3>
              <p>{en ? srv.english : srv.text}</p>
              <a className="v3-link" href={url('/crm')}>{t('Marcar', 'Book')} <ArrowUpRight size={14} /></a>
            </article>
          ))}
        </div>
      ) : slug === 'privacidad' ? (
        <div className="v3-legal">
          <h2>{t('Proteção de dados (RGPD e Lei n.º 58/2019)', 'Data protection (GDPR)')}</h2>
          <p><strong>{t('Responsável', 'Controller')}:</strong> 3VET Saúde Animal — Centro Veterinário Dr. Nuno Morais (Macedo de Cavaleiros) e Clínica Veterinária de Mirandela.</p>
          <p><strong>{t('Morada', 'Address')}:</strong> {FULL_ADDRESS}</p>
          <p><strong>{t('Contacto', 'Contact')}:</strong> {PHONE}</p>
          <p>{t('Os dados recolhidos servem apenas para prestar cuidados médico-veterinários, gerir marcações, registar a identificação no SIAC e enviar os lembretes que o tutor autorizar.', 'Data is used only to provide veterinary care, manage bookings, register SIAC identification and send reminders the owner authorises.')}</p>
          <p className="v3-legal-note">{t('Protótipo: a razão social, o NIF e o número de registo DGAV da clínica serão confirmados com a 3VET antes da publicação.', 'Prototype: the clinic’s legal name, tax number and DGAV registration will be confirmed with 3VET before publication.')}</p>
        </div>
      ) : (
        <div className="v3-form-card" style={{maxWidth: 860, margin: '0 auto'}}>
          <ContactForm en={en} />
        </div>
      )}
    </div>
  );
}
