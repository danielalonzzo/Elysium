'use client';
import {useState, useEffect} from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Pill,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Tractor,
  CheckCircle2,
  Navigation,
  Award,
  Truck,
  Package,
  Layers,
  Sparkles,
  CalendarDays,
  ExternalLink,
  ChevronRight,
  Factory,
  Globe2,
} from 'lucide-react';
import SiteShell from './SiteShell';
import ContactForm from './ContactForm';
import NovavetEmblem from './NovavetEmblem';
import Shop from './Shop';
import Reveal from './Reveal';
import {
  WHATSAPP,
  MAP,
  MAP_EMBED,
  PHONE,
  PHONE_RAW,
  EMAIL,
  ORIGIN,
  url,
  BRAND,
  BRAND_SHORT,
  TAGLINE,
  COMPANY_LEGAL_NAME,
  TECHNICAL_DIRECTOR,
  DGAV_LICENSE,
  ADDRESS_STREET,
  ADDRESS_POSTAL,
  ADDRESS_CITY,
  ADDRESS_REGION,
  FULL_ADDRESS,
  GPS_LAT,
  GPS_LNG,
  getBusinessStatus,
} from '../core/config';

export default function PublicPage({slug = '', en = false}: {slug?: string; en?: boolean}) {
  const t = (pt: string, english: string) => (en ? english : pt);
  const p = url(en ? '/en' : '');
  const home = !slug;
  const origin = ORIGIN;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'VeterinaryCare',
        '@id': origin + '/#clinic',
        name: 'Novavet – Consultório Veterinário (Dr. Luís Afonso)',
        legalName: COMPANY_LEGAL_NAME,
        url: origin,
        telephone: PHONE_RAW,
        email: EMAIL,
        image: origin + '/images/novavet-fachada-web.jpg',
        priceRange: '€€',
        address: {
          '@type': 'PostalAddress',
          streetAddress: ADDRESS_STREET,
          addressLocality: ADDRESS_CITY,
          postalCode: ADDRESS_POSTAL,
          addressRegion: ADDRESS_REGION,
          addressCountry: 'PT',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: GPS_LAT,
          longitude: GPS_LNG,
        },
        hasMap: MAP,
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '12:30',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '14:00',
            closes: '19:00',
          },
        ],
        employee: {
          '@type': 'Person',
          name: TECHNICAL_DIRECTOR,
          jobTitle: 'Médico Veterinário & Responsável Técnico',
          identifier: DGAV_LICENSE,
        },
      },
      {
        '@type': 'Store',
        '@id': origin + '/#store',
        name: 'Novavet – Produtos Agropecuários, Lda.',
        legalName: COMPANY_LEGAL_NAME,
        url: origin,
        telephone: PHONE_RAW,
        email: EMAIL,
        image: origin + '/images/novavet/stock.jpg',
        address: {
          '@type': 'PostalAddress',
          streetAddress: ADDRESS_STREET,
          addressLocality: ADDRESS_CITY,
          postalCode: ADDRESS_POSTAL,
          addressRegion: ADDRESS_REGION,
          addressCountry: 'PT',
        },
      },
    ],
  };

  return (
    <SiteShell en={en}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}} />
      <main id="main">
        {home ? (
          <Home t={t} p={p} en={en} />
        ) : slug === 'tienda' ? (
          <Shop en={en} />
        ) : (
          <StaticPage slug={slug} t={t} p={p} en={en} />
        )}
      </main>
    </SiteShell>
  );
}

function Home({t, p, en}: any) {
  const [status, setStatus] = useState(getBusinessStatus());

  useEffect(() => {
    setStatus(getBusinessStatus());
    const interval = setInterval(() => setStatus(getBusinessStatus()), 30000);
    return () => clearInterval(interval);
  }, []);

  const businessDivisions = [
    {
      id: 'pharma',
      title: 'Pharma',
      subtitle: t('Medicamentos & Vacinas', 'Medicines & Vaccines'),
      desc: t(
        'Medicamentos de uso veterinário, vacinas e produtos farmacêuticos sujeitos a controlo e registo DGAV PT 1 0124 CN.',
        'Veterinary pharmaceuticals, vaccines and regulated medicines under DGAV PT 1 0124 CN.'
      ),
      icon: Pill,
      color: '#009bb0',
      badge: 'DGAV PT 1 0124 CN',
    },
    {
      id: 'tech',
      title: 'Tech',
      subtitle: t('Equipamento Médico-Cirúrgico', 'Surgical & Diagnostic Equipment'),
      desc: t(
        'Equipamentos cirúrgicos, diagnóstico clínico veterinário, reagentes laboratoriais e consumíveis hospitalares.',
        'Surgical instruments, clinical diagnostic devices, reagents and hospital consumables.'
      ),
      icon: Stethoscope,
      color: '#0e6d42',
      badge: t('Clínico & Hospitalar', 'Clinical & Diagnostic'),
    },
    {
      id: 'agro',
      title: 'Agro',
      subtitle: t('Agropecuária & Nutrição', 'Livestock Feeds & Agronomy'),
      desc: t(
        'Fitofármacos, sementes selecionadas, corretores minerais e equipamentos para explorações de ovinos, caprinos e bovinos.',
        'Phytopharmaceuticals, seeds, mineral correctors and supplies for sheep, goat and cattle farms.'
      ),
      icon: Tractor,
      color: '#8ec63f',
      badge: t('Trás-os-Montes', 'Livestock Support'),
    },
    {
      id: 'clean',
      title: 'Clean',
      subtitle: t('Higiene & Biossegurança', 'Hygiene & Biosecurity'),
      desc: t(
        'Soluções de desinfeção profissional, controlo microbiológico e protocolos rigorosos de biossegurança e segurança alimentar.',
        'Professional disinfection solutions, microbiological control and biosecurity protocols.'
      ),
      icon: ShieldCheck,
      color: '#007585',
      badge: t('Segurança Alimentar', 'Food Safety'),
    },
    {
      id: 'pets',
      title: 'Pets',
      subtitle: t('Nutrição & Artigos Pet', 'Pet Food & Care'),
      desc: t(
        'Pet food clínica e dietas de manutenção para cães e gatos, suplementação e artigos de bem-estar animal.',
        'Clinical and maintenance pet foods for dogs and cats, dietary supplements and wellbeing items.'
      ),
      icon: ShoppingBag,
      color: '#283931',
      badge: t('Gamas Clínicas', 'Clinical Pet Diets'),
    },
  ];

  return (
    <>
      {/* ── HERO CORPORATIVO: NOVAVET - O PARCEIRO CERTO ───────────────────── */}
      <section className="novavet-hero">
        <div className="novavet-hero-container">
          <div className="novavet-hero-content">
            <div className="novavet-hero-badge-wrap">
              <span className="novavet-badge" suppressHydrationWarning>
                <span
                  className="status-dot"
                  style={{
                    background: status.isOpen ? '#22c55e' : status.state === 'lunch' ? '#eab308' : '#ef4444',
                    boxShadow: status.isOpen ? '0 0 10px #22c55e' : undefined,
                  }}
                />
                {status.text} · {t('BRAGANÇA', 'BRAGANÇA')}
              </span>
              <span className="novavet-badge-sub">
                {t('Desde 1986 · DGAV PT 1 0124 CN', 'Est. 1986 · DGAV PT 1 0124 CN')}
              </span>
            </div>

            <div className="novavet-title-lockup">
              <h1 className="novavet-main-title">
                novavet
                <span className="novavet-signature">o parceiro certo.</span>
              </h1>
            </div>

            <p className="novavet-hero-lead">
              {t(
                'Empresa líder de mercado na distribuição farmacêutica e agropecuária e consultório médico-veterinário sob a direção técnica do Dr. Luís Manuel Madureira Afonso. Mais de 35 anos ao serviço da saúde animal e dos produtores em Bragança, Portugal e no mercado internacional.',
                'Market leader in pharmaceutical & agricultural distribution, and veterinary practice under the technical direction of Dr. Luís Manuel Madureira Afonso. Over 35 years serving animal health and farmers in Bragança, Portugal and internationally.'
              )}
            </p>

            {/* FAIXA DE MÉTRICAS INSTITUCIONAIS */}
            <div className="novavet-metrics-grid">
              <div className="novavet-metric-card">
                <strong>+35 Anos</strong>
                <span>{t('História & Solidez (desde 1986)', 'Experience & Trust (since 1986)')}</span>
              </div>
              <div className="novavet-metric-card">
                <strong>+30.000</strong>
                <span>{t('Referências com stock controlado', 'Controlled stock references')}</span>
              </div>
              <div className="novavet-metric-card">
                <strong>24 Horas</strong>
                <span>{t('Entregas rápidas em Portugal', 'Fast delivery across Portugal')}</span>
              </div>
              <div className="novavet-metric-card">
                <strong>PT 1 0124 CN</strong>
                <span>{t('Registo Oficial DGAV', 'Official DGAV License')}</span>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO PRINCIPAL */}
            <div className="novavet-hero-actions">
              <a className="button" href={`tel:${PHONE_RAW}`}>
                <Phone size={17} />
                {t(`Ligar: ${PHONE}`, `Call: ${PHONE}`)}
              </a>
              <a className="button outline" href="#consultorio">
                <Stethoscope size={17} />
                {t('Consultório Dr. Luís Afonso', 'Dr. Luís Afonso Clinic')}
              </a>
              <a className="button outline" href={p + '/tienda'}>
                <ShoppingBag size={17} />
                {t('Catálogo de Produtos', 'Product Catalog')}
              </a>
              <a
                className="novavet-gps-link"
                href={MAP}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin size={15} />
                {t('Rua do Loreto, Bragança (GPS)', 'Rua do Loreto, Bragança (GPS)')}
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          {/* VITRINE VISUAL DE INSTALAÇÕES E RIGOR FARMACÊUTICO */}
          <div className="novavet-hero-visual">
            <div className="novavet-showcase-frame">
              <img
                src={url('/images/novavet-fachada-web.jpg')}
                alt="Instalações Novavet na Rua do Loreto, Bragança"
                className="novavet-hero-img-main"
                width="800"
                height="560"
              />
              <div className="novavet-showcase-overlay">
                <div className="novavet-showcase-badge">
                  <ShieldCheck size={16} />
                  <span>REGISTO DGAV: PT 1 0124 CN</span>
                </div>
                <h3>{t('Consultório Veterinário & Sede em Bragança', 'Veterinary Practice & Headquarters in Bragança')}</h3>
                <p>
                  {ADDRESS_STREET}, {ADDRESS_POSTAL} {ADDRESS_CITY} · {t('Direção:', 'Director:')} {TECHNICAL_DIRECTOR}
                </p>
              </div>
            </div>

            <div className="novavet-floating-trust-cards">
              <div className="novavet-trust-mini">
                <Truck size={18} />
                <div>
                  <strong>{t('Entregas Rápidas', 'Fast Deliveries')}</strong>
                  <small>{t('Portugal, Europa e África', 'Portugal, Europe & Africa')}</small>
                </div>
              </div>
              <div className="novavet-trust-mini">
                <Package size={18} />
                <div>
                  <strong>{t('Armazém Climatizado', 'Climate-Controlled')}</strong>
                  <small>{t('Temperatura e humidade fiscalizadas', 'Monitored temperature & humidity')}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OS TRÊS PILARES DE VALOR NOVAVET (EXTRATO OFICIAL NOVAVET.PT) ──── */}
      <Reveal>
        <section className="section novavet-pillars-section">
          <div className="novavet-section-header">
            <span className="eyebrow">{t('QUALIDADE & CAPACIDADE DE RESPOSTA', 'QUALITY & LOGISTICAL CAPACITY')}</span>
            <h2>
              {t('A estrutura que garante segurança,', 'The infrastructure ensuring safety,')}
              <br />
              <span>{t('proximidade e rapidez.', 'closeness and speed.')}</span>
            </h2>
            <p>
              {t(
                'Desde o aconselhamento clínico no consultório até ao fornecimento de grandes explorações pecuárias em Trás-os-Montes e distribuição a nível nacional.',
                'From in-person clinical advisory to supplying large livestock farms in Trás-os-Montes and nationwide distribution.'
              )}
            </p>
          </div>

          <div className="novavet-pillars-grid">
            <article className="novavet-pillar-card">
              <div className="novavet-pillar-media">
                <img
                  src={url('/images/novavet/apoio.jpg')}
                  alt="Linha de Apoio ao Cliente Novavet"
                  width="500"
                  height="260"
                  loading="lazy"
                />
              </div>
              <div className="novavet-pillar-body">
                <span className="novavet-pillar-tag">01 · {t('APOIO DEDICADO', 'DEDICATED SUPPORT')}</span>
                <h3>{t('Linha de Apoio & Aconselhamento', 'Support Line & Advisory')}</h3>
                <p>
                  {t(
                    'Prestamos um aconselhamento personalizado médico-veterinário e zootécnico. O Dr. Luís Afonso e a equipa técnica esclarecem as suas dúvidas com rigor científico e conhecimento das realidades de campo.',
                    'We provide personalized veterinary and zootechnical guidance. Dr. Luís Afonso and our technical staff address your queries with scientific precision and practical farm experience.'
                  )}
                </p>
                <a className="text-link" href={`tel:${PHONE_RAW}`}>
                  {t('Ligar para esclarecimentos', 'Call for information')} <ArrowRight size={15} />
                </a>
              </div>
            </article>

            <article className="novavet-pillar-card">
              <div className="novavet-pillar-media">
                <img
                  src={url('/images/novavet/stock.jpg')}
                  alt="Grande Capacidade de Stock Novavet"
                  width="500"
                  height="260"
                  loading="lazy"
                />
              </div>
              <div className="novavet-pillar-body">
                <span className="novavet-pillar-tag">02 · {t('SEGURANÇA FARMACÊUTICA', 'PHARMA SECURITY')}</span>
                <h3>{t('Grande Capacidade de Stock', 'High Stock Capacity')}</h3>
                <p>
                  {t(
                    'Capacidade de stock de mais de 30.000 referências com temperatura e humidade rigorosamente controladas em conformidade com as exigências da DGAV e normas europeias de boas práticas de distribuição.',
                    'Stock capacity of over 30,000 references under rigorously monitored temperature and humidity, complying with DGAV standards and European good distribution practice.'
                  )}
                </p>
                <a className="text-link" href={p + '/tienda'}>
                  {t('Explorar referências em catálogo', 'Explore catalog items')} <ArrowRight size={15} />
                </a>
              </div>
            </article>

            <article className="novavet-pillar-card">
              <div className="novavet-pillar-media">
                <img
                  src={url('/images/novavet/entregas.jpg')}
                  alt="Entregas Rápidas Novavet"
                  width="500"
                  height="260"
                  loading="lazy"
                />
              </div>
              <div className="novavet-pillar-body">
                <span className="novavet-pillar-tag">03 · {t('LOGÍSTICA EFICAZ', 'EFFICIENT LOGISTICS')}</span>
                <h3>{t('Entregas Rápidas em 24 Horas', 'Fast Deliveries in 24 Hours')}</h3>
                <p>
                  {t(
                    'Entregas em menos de 24 horas em Portugal Continental de segunda a sábado e máxima rapidez logística nas ligações regulares para o resto da Europa e África.',
                    'Deliveries within 24 hours across mainland Portugal from Monday to Saturday, with optimal logistical efficiency connecting to Europe and Africa.'
                  )}
                </p>
                <a className="text-link" href={`mailto:${EMAIL}`}>
                  {t('Consultar condições de entrega', 'Inquire delivery terms')} <ArrowRight size={15} />
                </a>
              </div>
            </article>
          </div>
        </section>
      </Reveal>

      {/* ── DR. LUÍS MANUEL MADUREIRA AFONSO & SOBRE A NOVAVET ──────────────── */}
      <Reveal>
        <section className="section novavet-profile-section" id="sobre-nos">
          <div className="novavet-profile-grid">
            <div className="novavet-profile-image-wrap">
              <img
                src={url('/images/novavet/novavet_30anos.jpg')}
                alt="Novavet - Mais de 30 Anos de História"
                className="novavet-profile-photo"
                width="800"
                height="600"
                loading="lazy"
              />
              <div className="novavet-profile-caption">
                <NovavetEmblem size={28} />
                <div>
                  <strong>{TECHNICAL_DIRECTOR}</strong>
                  <span>{t('Médico Veterinário · Diretor Técnico e Fundador', 'Veterinary Surgeon · Technical Director & Founder')}</span>
                </div>
              </div>
            </div>

            <div className="novavet-profile-copy">
              <span className="eyebrow">{t('DIREÇÃO TÉCNICA & LIDERANÇA', 'TECHNICAL DIRECTION & LEADERSHIP')}</span>
              <h2>
                Dr. Luís Manuel
                <br />
                <span>Madureira Afonso</span>
              </h2>
              <div className="novavet-doctor-role-badge">
                <Award size={18} />
                <span>{t('Médico Veterinário · Registo DGAV Oficial PT 1 0124 CN', 'Veterinary Doctor · DGAV License PT 1 0124 CN')}</span>
              </div>

              <p className="novavet-profile-text">
                {t(
                  'Com uma sólida carreira de mais de três décadas dedicada à medicina veterinária e ao fomento da atividade agropecuária em Trás-os-Montes, o Dr. Luís Afonso fundou a Novavet em 1986 na cidade de Bragança. Sob a sua direção clínica e visão empresarial, a Novavet cresceu de uma prática local para uma das empresas de maior prestígio na distribuição farmacêutica e saúde animal em Portugal.',
                  'With over three decades dedicated to veterinary medicine and livestock farming in Trás-os-Montes, Dr. Luís Afonso founded Novavet in 1986 in Bragança. Under his clinical and business direction, Novavet expanded from a local veterinary clinic into one of Portugal’s premier animal health and pharmaceutical distribution enterprises.'
                )}
              </p>

              <p className="novavet-profile-text">
                {t(
                  'No consultório da Rua do Loreto, o Dr. Luís Afonso assegura consultas clínicas com diagnóstico rigoroso para animais de companhia (cães e gatos) e planos sanitários contínuos para explorações de pecuária extensiva (ovinos, caprinos e bovinos). Um compromisso inegociável com a ética profissional, o bem-estar animal e o apoio próximo às famílias e criadores transmontanos.',
                  'At the practice on Rua do Loreto, Dr. Luís Afonso provides thorough clinical consultations for pets (dogs, cats) and herd-health protocols for sheep, goat and cattle producers across Trás-os-Montes. An unwavering commitment to medical ethics, animal welfare and local community support.'
                )}
              </p>

              <div className="novavet-profile-highlights">
                <div className="novavet-highlight-item">
                  <CheckCircle2 size={18} color="var(--green)" />
                  <span>{t('Atendimento clínico personalizado a animais de companhia', 'Personalized companion animal clinical care')}</span>
                </div>
                <div className="novavet-highlight-item">
                  <CheckCircle2 size={18} color="var(--green)" />
                  <span>{t('Acompanhamento sanitário profilático a explorações pecuárias', 'Sanitary prophylaxis for regional livestock farms')}</span>
                </div>
                <div className="novavet-highlight-item">
                  <CheckCircle2 size={18} color="var(--green)" />
                  <span>{t('Cumprimento integral dos regulamentos farmacêuticos da DGAV', 'Strict compliance with DGAV pharmaceutical regulations')}</span>
                </div>
                <div className="novavet-highlight-item">
                  <CheckCircle2 size={18} color="var(--green)" />
                  <span>{t('Inovação industrial em Bragança com a unidade fabril Bemed', 'Industrial innovation in Bragança with Bemed manufacturing')}</span>
                </div>
              </div>

              <div style={{display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap'}}>
                <a className="button" href={`tel:${PHONE_RAW}`}>
                  <Phone size={16} />
                  {t('Contactar o Dr. Luís Afonso', 'Contact Dr. Luís Afonso')}
                </a>
                <a className="button outline" href="#contacto">
                  <CalendarDays size={16} />
                  {t('Agendar Consulta no Consultório', 'Book Consultation at Clinic')}
                </a>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── CONSULTÓRIO MÉDICO-VETERINÁRIO EM BRAGANÇA ──────────────────────── */}
      <Reveal>
        <section className="section novavet-clinic-section" id="consultorio">
          <div className="novavet-section-header">
            <span className="eyebrow">{t('SERVIÇOS MÉDICO-VETERINÁRIOS', 'VETERINARY CLINICAL SERVICES')}</span>
            <h2>
              {t('Consultório Veterinário em Bragança', 'Veterinary Practice in Bragança')}
              <br />
              <span>{t('Cuidado clínico de excelência para pequenos e grandes animais.', 'Clinical excellence for companion and production animals.')}</span>
            </h2>
            <p>
              {t(
                'Instalações autorizadas pelo Ministério da Agricultura e DGAV na Rua do Loreto, nº 36 ABC, com equipamento de exame clínico, vacinação, cirurgia e aconselhamento sanitário.',
                'Authorized clinical facilities on Rua do Loreto nº 36 ABC under DGAV licensing, equipped for clinical examinations, vaccination, soft-tissue surgeries and health advisory.'
              )}
            </p>
          </div>

          <div className="novavet-clinic-grid">
            <div className="novavet-clinic-card">
              <div className="novavet-card-icon">
                <Stethoscope size={28} />
              </div>
              <h3>{t('Consultas & Medicina Preventiva', 'Consultations & Prevention')}</h3>
              <p>
                {t(
                  'Avaliação clínica detalhada do estado geral de saúde, diagnóstico precoce, maneio alimentar e orientação preventiva para animais de companhia de qualquer idade.',
                  'Thorough clinical assessment, early diagnosis, dietary advice and preventive guidance for companion animals of all life stages.'
                )}
              </p>
              <ul className="novavet-card-bullets">
                <li>{t('Exame físico completo e anamnese detalhada', 'Comprehensive physical examination')}</li>
                <li>{t('Planos de vacinação adaptados ao estilo de vida', 'Tailored vaccination protocols')}</li>
                <li>{t('Desparasitação interna e externa orientada', 'Targeted internal & external parasite control')}</li>
              </ul>
            </div>

            <div className="novavet-clinic-card">
              <div className="novavet-card-icon">
                <Tractor size={28} />
              </div>
              <h3>{t('Apoio a Explorações Pecuárias', 'Livestock & Herd Health')}</h3>
              <p>
                {t(
                  'Acompanhamento zootécnico e médico-veterinário a rebanhos de ovinos, caprinos e manadas de bovinos em Trás-os-Montes. Programas de profilaxia e controlo de doenças.',
                  'Veterinary and zootechnical support for sheep, goat and cattle producers in Trás-os-Montes. Herd prophylaxis, mineral balance and disease control.'
                )}
              </p>
              <ul className="novavet-card-bullets">
                <li>{t('Controlo reprodutivo e maneio profilático', 'Reproductive management and prophylaxis')}</li>
                <li>{t('Suplementação mineral e vitamínica de campo', 'Field mineral & vitamin supplementation')}</li>
                <li>{t('Prescrição de medicamentos veterinários oficiais', 'Official veterinary pharmaceutical prescriptions')}</li>
              </ul>
            </div>

            <div className="novavet-clinic-card">
              <div className="novavet-card-icon">
                <Pill size={28} />
              </div>
              <h3>{t('Pequenas Cirurgias & Identificação SIAC', 'Minor Surgeries & SIAC Registration')}</h3>
              <p>
                {t(
                  'Intervenções cirúrgicas de tecidos moles, esterilização profilática e identificação eletrónica obrigatória com aplicação de microchip e registo na plataforma nacional SIAC.',
                  'Soft-tissue surgeries, neutering/spaying procedures, mandatory microchipping and official pet registration on Portugal’s national SIAC database.'
                )}
              </p>
              <ul className="novavet-card-bullets">
                <li>{t('Cirurgias eletivas e de rotina', 'Elective and routine surgical interventions')}</li>
                <li>{t('Aplicação de microchip e emissão de documento SIAC', 'Microchip implantation and SIAC documentation')}</li>
                <li>{t('Boletim sanitário e passaporte para viagens', 'Official health book and EU pet passports')}</li>
              </ul>
            </div>
          </div>

          <div className="novavet-booking-cta-banner">
            <div>
              <span className="eyebrow" style={{color: 'var(--sage-glow)'}}>
                {t('HORÁRIO & CONTACTO DIRECTO', 'HOURS & DIRECT CONTACT')}
              </span>
              <h3>{t('Precisa de agendar uma consulta com o Dr. Luís Afonso?', 'Need to schedule an appointment with Dr. Luís Afonso?')}</h3>
              <p>
                {t(
                  'Segunda a Sexta: 09:00–12:30 e 14:00–19:00 na Rua do Loreto, Bragança. Contacte-nos pelo telefone ou envie mensagem direta.',
                  'Monday to Friday: 09:00–12:30 and 14:00–19:00 at Rua do Loreto, Bragança. Call our clinic or message us directly.'
                )}
              </p>
            </div>
            <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
              <a className="button" href={`tel:${PHONE_RAW}`}>
                <Phone size={16} />
                {PHONE}
              </a>
              <a className="button outline" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} />
                WhatsApp
              </a>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── AS 5 ÁREAS DE NEGÓCIO NOVAVET GROUP (OFICIAL NOVAVET.PT) ───────── */}
      <Reveal>
        <section className="section novavet-divisions-section" id="areas-negocio">
          <div className="novavet-section-header">
            <span className="eyebrow">{t('NOVAVET GROUP · ÁREAS DE NEGÓCIO', 'NOVAVET GROUP · BUSINESS DIVISIONS')}</span>
            <h2>
              {t('Promoção, representação e distribuição', 'Promotion, representation & distribution')}
              <br />
              <span>{t('com alcance nacional e internacional.', 'with national and international reach.')}</span>
            </h2>
            <p>
              {t(
                'Com sede em Bragança e plataformas logísticas modernas, a Novavet atua em cinco grandes vetores especializados no setor farmacêutico, veterinário e agropecuário.',
                'Headquartered in Bragança with specialized logistics hubs, Novavet operates across five dedicated divisions in animal health, pharmaceuticals and agriculture.'
              )}
            </p>
          </div>

          <div className="novavet-divisions-grid">
            {businessDivisions.map(div => {
              const Icon = div.icon;
              return (
                <div className="novavet-division-card" key={div.id}>
                  <div className="novavet-division-head">
                    <span className="novavet-div-badge">{div.badge}</span>
                    <Icon size={26} color="var(--teal)" />
                  </div>
                  <h3 className="novavet-div-title">{div.title}</h3>
                  <h4 className="novavet-div-subtitle">{div.subtitle}</h4>
                  <p className="novavet-div-desc">{div.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Destaque Moagem do Loreto */}
          <div className="novavet-moagem-banner">
            <div className="novavet-moagem-content">
              <span className="eyebrow">{t('SETOR ALIMENTAR & AGROPECUÁRIO', 'FOOD & GRAIN SECTOR')}</span>
              <h3>{t('Moagem do Loreto (Afonso Lopes e Cª Lda)', 'Moagem do Loreto (Afonso Lopes & Cª Lda)')}</h3>
              <p>
                {t(
                  'No setor alimentar, a Novavet detém a maioria do capital social da Moagem do Loreto em Bragança, produzindo farinhas de trigo e de centeio para a indústria da panificação, bem como farelo de trigo, centeio e misturas de cereais para nutrição e alimentação animal.',
                  'In the agro-food sector, Novavet holds the majority stake in Moagem do Loreto in Bragança, producing wheat and rye flours for bakery industries, as well as wheat bran, rye bran and grain blends for high-quality animal nutrition.'
                )}
              </p>
              <div style={{display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap'}}>
                <span className="novavet-mini-tag">{t('Farinhas de Trigo & Centeio', 'Wheat & Rye Flour')}</span>
                <span className="novavet-mini-tag">{t('Farelos para Nutrição Pecuária', 'Livestock Feed Bran')}</span>
                <span className="novavet-mini-tag">{t('Misturas de Cereais Tradicionais', 'Traditional Grain Blends')}</span>
              </div>
            </div>
            <div className="novavet-moagem-icon">
              <Tractor size={54} color="var(--green)" />
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── BEMED: UNIDADE INDUSTRIAL EM BRAGANÇA (OFICIAL NOVAVET.PT) ──────── */}
      <Reveal>
        <section className="section novavet-bemed-section" id="bemed">
          <div className="novavet-bemed-grid">
            <div className="novavet-bemed-image-wrap">
              <img
                src={url('/images/novavet/fabrica_bemed.jpg')}
                alt="Unidade Fabril Bemed em Bragança"
                className="novavet-bemed-img"
                width="750"
                height="370"
                loading="lazy"
              />
              <div className="novavet-bemed-floating-badge">
                <Factory size={18} />
                <span>{t('Fábrica em Bragança · Sala Limpa Farmacêutica', 'Bragança Plant · Cleanroom Standard')}</span>
              </div>
            </div>

            <div className="novavet-bemed-copy">
              <span className="eyebrow">{t('INOVAÇÃO INDUSTRIAL & DISPOSITIVOS MÉDICOS', 'INDUSTRIAL INNOVATION & MEDICAL DEVICES')}</span>
              <h2>
                BEMED
                <br />
                <span>{t('Produção em ambiente farmacêutico.', 'Pharmaceutical-grade production.')}</span>
              </h2>

              <p>
                {t(
                  'A Bemed é uma marca industrial desenvolvida pela Novavet com uma moderna unidade de produção localizada na Zona Industrial de Bragança. Com um investimento tecnológico de 600 mil euros cofinanciado pelo Sistema de Incentivos à Inovação Produtiva, a fábrica opera com duas linhas automatizadas instaladas numa sala limpa com filtração de ar e pressão positiva.',
                  'Bemed is an industrial brand developed by Novavet with a cutting-edge production facility in Bragança’s Industrial Zone. Representing a 600,000 euro investment co-funded by Portugal’s Productive Innovation System, the plant runs automated lines inside positive-pressure, HEPA-filtered cleanrooms.'
                )}
              </p>

              <div className="novavet-bemed-features">
                <div className="novavet-feature-box">
                  <strong>2 Milhões / Mês</strong>
                  <p>{t('Capacidade de produção de máscaras cirúrgicas e respiradores FFP2 certificados.', 'Monthly capacity for certified surgical masks and FFP2 respirators.')}</p>
                </div>
                <div className="novavet-feature-box">
                  <strong>{t('Sala Limpa', 'Clean Room')}</strong>
                  <p>{t('Filtração de ar e controlo rigoroso de partículas em conformidade farmacêutica.', 'HEPA air filtration and particulate monitoring under pharma criteria.')}</p>
                </div>
              </div>

              <a
                className="button outline"
                href="https://novavet.pt/pt/bemed/"
                target="_blank"
                rel="noopener noreferrer"
                style={{marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8}}
              >
                {t('Saber mais sobre a Bemed', 'Learn more about Bemed')}
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── CHAMADA PARA O CATÁLOGO & LOJA (DISTRIBUIÇÃO AGRO-PECUÁRIA & FARMACÊUTICA) ── */}
      <Reveal>
        <section className="section novavet-catalog-cta-section" id="catalogo">
          <div className="novavet-catalog-cta-card">
            <div className="novavet-catalog-cta-content">
              <span className="eyebrow">
                <ShoppingBag size={14} />
                {t('CATÁLOGO TÉCNICO & LOJA EM BRAGANÇA', 'TECHNICAL CATALOGUE & BRAGANÇA STORE')}
              </span>
              <h2>
                {t('Mais de 30.000 referências para a', 'Over 30,000 references for')}
                <br />
                <span>{t('saúde animal e explorações pecuárias.', 'animal health & livestock farming.')}</span>
              </h2>
              <p>
                {t(
                  'Disponibilizamos medicamentos veterinários autorizados pela DGAV, alimentação clínica para cães e gatos, nutrição especializada para ruminantes (ovinos, caprinos e bovinos), biossegurança de instalações e dispositivos médicos Bemed. Consulte o catálogo completo ou levante o seu pedido diretamente na Rua do Loreto, nº 36 ABC em Bragança.',
                  'We provide DGAV-licensed veterinary pharmaceuticals, clinical pet nutrition, livestock feeds (sheep, goats, cattle), farm biosecurity and Bemed medical devices. Browse our catalogue or collect directly at Rua do Loreto nº 36 ABC in Bragança.'
                )}
              </p>

              {/* Destaques das 4 grandes linhas */}
              <div className="novavet-catalog-highlights">
                <div className="novavet-highlight-pill">
                  <Pill size={15} />
                  <span>{t('Medicamentos & Vacinas DGAV', 'DGAV Medicines & Vaccines')}</span>
                </div>
                <div className="novavet-highlight-pill">
                  <Tractor size={15} />
                  <span>{t('Nutrição Pecuária & Ruminantes', 'Livestock Feeds & Minerals')}</span>
                </div>
                <div className="novavet-highlight-pill">
                  <ShieldCheck size={15} />
                  <span>{t('Alimentação Clínica Cão & Gato', 'Pet Clinical Diets')}</span>
                </div>
                <div className="novavet-highlight-pill">
                  <Sparkles size={15} />
                  <span>{t('Dispositivos Médicos Bemed', 'Bemed Medical Devices')}</span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="novavet-catalog-cta-actions">
                <a className="button" href={p + '/tienda'}>
                  <ShoppingBag size={18} />
                  {t('Explorar Catálogo Completo', 'Browse Product Catalogue')}
                  <ArrowRight size={17} />
                </a>
                <a
                  className="button outline"
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={18} />
                  {t('Consultar Stock no WhatsApp', 'Check Stock on WhatsApp')}
                </a>
                <a className="button ghost" href={`tel:${PHONE_RAW}`}>
                  <Phone size={16} />
                  {t(`Ligue: ${PHONE}`, `Call: ${PHONE}`)}
                </a>
              </div>

              <div className="novavet-catalog-cta-address">
                <MapPin size={14} />
                <span>
                  {t(
                    `Levantamento imediato em loja: ${ADDRESS_STREET}, ${ADDRESS_POSTAL} ${ADDRESS_CITY} · Expedição rápida em 24h para todo o país`,
                    `In-store pickup: ${ADDRESS_STREET}, ${ADDRESS_POSTAL} ${ADDRESS_CITY} · Fast 24h national delivery`
                  )}
                </span>
              </div>
            </div>

            <div className="novavet-catalog-cta-visual">
              <div className="novavet-catalog-preview-grid">
                <a href={p + '/tienda'} className="novavet-preview-item">
                  <img src={url('/images/products/cao-adulto-cordeiro.jpg')} alt="Alimento Clínico Cão" loading="lazy" />
                  <span>{t('Alimentação Clínica', 'Clinical Nutrition')}</span>
                </a>
                <a href={p + '/tienda'} className="novavet-preview-item">
                  <img src={url('/images/products/alimento-borregos-crescimento.jpg')} alt="Ração Pecuária Borregos" loading="lazy" />
                  <span>{t('Nutrição Pecuária', 'Livestock Feeds')}</span>
                </a>
                <a href={p + '/tienda'} className="novavet-preview-item">
                  <img src={url('/images/products/desinfetante-instalacoes-pecuarias.jpg')} alt="Desinfetante DGAV" loading="lazy" />
                  <span>{t('Biossegurança DGAV', 'DGAV Biosecurity')}</span>
                </a>
                <a href={p + '/tienda'} className="novavet-preview-item">
                  <img src={url('/images/products/mascaras-cirurgicas-bemed.jpg')} alt="Dispositivos Bemed" loading="lazy" />
                  <span>{t('Dispositivos Bemed', 'Bemed Devices')}</span>
                </a>
              </div>
              <div className="novavet-cta-tag">
                <span className="dot" />
                <strong>+30.000</strong> {t('referências com stock controlado', 'controlled stock references')}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── ENTIDADES REGULADORAS OFICIAIS (OFICIAL NOVAVET.PT) ─────────────── */}
      <Reveal>
        <section className="section novavet-regulatory-section" id="regulatorio">
          <div className="novavet-regulatory-header">
            <span className="eyebrow">{t('CONFORMIDADE & RIGOR REGULAMENTAR', 'REGULATORY COMPLIANCE')}</span>
            <h2>{t('Entidades Reguladoras', 'Regulatory Authorities')}</h2>
            <p>
              {t(
                'A Novavet rege-se estritamente pelas diretivas, boas práticas e determinações técnicas das entidades oficiais que tutelam e fiscalizam o setor médico-veterinário e farmacêutico em Portugal.',
                'Novavet strictly abides by directives, good practices and technical standards set by the official regulatory bodies overseeing the veterinary and pharmaceutical sectors in Portugal.'
              )}
            </p>
          </div>

          <div className="novavet-regulatory-logos-grid">
            <a
              href="https://www.dgav.pt/"
              target="_blank"
              rel="noopener noreferrer"
              className="novavet-reg-card"
              title="DGAV - Direção-Geral de Alimentação e Veterinária"
            >
              <img src={url('/images/novavet/dgav.png')} alt="DGAV" width="168" height="114" loading="lazy" />
              <span>DGAV</span>
              <small>Direção-Geral de Alimentação e Veterinária</small>
            </a>

            <a
              href="https://www.dgs.pt/"
              target="_blank"
              rel="noopener noreferrer"
              className="novavet-reg-card"
              title="DGS - Direção-Geral da Saúde"
            >
              <img src={url('/images/novavet/dgs.png')} alt="DGS" width="248" height="72" loading="lazy" />
              <span>DGS</span>
              <small>Direção-Geral da Saúde</small>
            </a>

            <a
              href="http://medvet.dgav.pt/"
              target="_blank"
              rel="noopener noreferrer"
              className="novavet-reg-card"
              title="MEDVET - Sistema de Informação de Medicamentos Veterinários"
            >
              <img src={url('/images/novavet/medvet.png')} alt="MEDVET" width="226" height="100" loading="lazy" />
              <span>MEDVET</span>
              <small>Medicamentos de Uso Veterinário</small>
            </a>

            <a
              href="https://www.infarmed.pt/"
              target="_blank"
              rel="noopener noreferrer"
              className="novavet-reg-card"
              title="INFARMED - Autoridade Nacional do Medicamento"
            >
              <img src={url('/images/novavet/infarmed.png')} alt="INFARMED" width="300" height="106" loading="lazy" />
              <span>INFARMED</span>
              <small>Autoridade Nacional do Medicamento</small>
            </a>

            <a
              href="http://www.simposiumvet.pt/"
              target="_blank"
              rel="noopener noreferrer"
              className="novavet-reg-card"
              title="SIMPOSIUM VET"
            >
              <img src={url('/images/novavet/simposiumvet.png')} alt="Simposium Vet" width="300" height="42" loading="lazy" />
              <span>SIMPOSIUM VET</span>
              <small>Guia Terapêutico Veterinário</small>
            </a>
          </div>
        </section>
      </Reveal>

      {/* ── PROJETOS DE INOVAÇÃO & FUNDOS EUROPEUS (OFICIAL NOVAVET.PT) ─────── */}
      <Reveal>
        <section className="section novavet-projects-section">
          <div className="novavet-projects-container">
            <div className="novavet-projects-copy">
              <span className="eyebrow">{t('DESENVOLVIMENTO REGIONAL & INOVAÇÃO', 'REGIONAL INNOVATION')}</span>
              <h2>{t('Projetos Cofinanciados & Crescimento', 'Co-funded Projects & Growth')}</h2>
              <p>
                {t(
                  'A Novavet participa ativamente em projetos de modernização tecnológica, inovação produtiva e valorização dos recursos naturais de Trás-os-Montes, no âmbito do programa Portugal 2020 e Portugal 2030.',
                  'Novavet actively participates in technological modernization, manufacturing innovation and natural resource valorization programs under Portugal 2020 and Portugal 2030.'
                )}
              </p>
              <div className="novavet-project-links">
                <span className="novavet-proj-tag">Projeto +Coeso</span>
                <span className="novavet-proj-tag">Inovação Produtiva Covid-19</span>
                <span className="novavet-proj-tag">Internacionalização</span>
                <span className="novavet-proj-tag">Projeto Valor Natural</span>
              </div>
            </div>

            <div className="novavet-projects-badges">
              <img
                src={url('/images/novavet/norte2020.png')}
                alt="Programa Operacional Regional do Norte 2020"
                className="novavet-project-img"
                width="300"
                height="46"
                loading="lazy"
              />
              <img
                src={url('/images/novavet/logos2030.png')}
                alt="Norte 2030 e União Europeia"
                className="novavet-project-img"
                width="300"
                height="41"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── LOCALIZAÇÃO, MAPA & CONTACTOS EM BRAGANÇA ──────────────────────── */}
      <Reveal>
        <section className="section novavet-contact-section" id="contacto">
          <div className="novavet-contact-grid">
            <div className="novavet-contact-info-col">
              <span className="eyebrow">{t('CONTACTOS & ATENDIMENTO', 'CONTACT & VISITING')}</span>
              <h2>
                {t('Estamos à sua disposição', 'We are at your service')}
                <br />
                <span>{t('na Rua do Loreto em Bragança.', 'at Rua do Loreto in Bragança.')}</span>
              </h2>

              <p className="novavet-contact-lead">
                {t(
                  'Visite as nossas instalações para consultas médico-veterinárias com o Dr. Luís Afonso, aquisição de medicamentos veterinários sob receita ou fornecimento de rações e produtos agropecuários.',
                  'Visit our facilities for veterinary clinical care with Dr. Luís Afonso, purchasing prescription veterinary pharmaceuticals or collecting feeds and farm supplies.'
                )}
              </p>

              <div className="novavet-info-lines">
                <div className="novavet-info-line">
                  <MapPin className="novavet-info-icon" />
                  <div>
                    <strong>{ADDRESS_STREET}</strong>
                    <span>{ADDRESS_POSTAL} {ADDRESS_CITY} (Trás-os-Montes)</span>
                    <small>Coordenadas GPS: {GPS_LAT}, {GPS_LNG}</small>
                  </div>
                </div>

                <div className="novavet-info-line">
                  <Clock3 className="novavet-info-icon" />
                  <div>
                    <strong>{t('Horário de Funcionamento', 'Opening Hours')}</strong>
                    <span>Segunda a Sexta: 09:00–12:30 | 14:00–19:00</span>
                    <small suppressHydrationWarning style={{color: status.isOpen ? 'var(--green)' : '#c0392b', fontWeight: 700}}>
                      {status.text}
                    </small>
                  </div>
                </div>

                <div className="novavet-info-line">
                  <Phone className="novavet-info-icon" />
                  <div>
                    <strong>Telefone Consultório & Sede</strong>
                    <a href={`tel:${PHONE_RAW}`} style={{fontSize: '17px', fontWeight: 800, color: 'var(--green)'}}>
                      {PHONE}
                    </a>
                    <span>Linha Secundária: (+351) 273 381 582</span>
                  </div>
                </div>

                <div className="novavet-info-line">
                  <Mail className="novavet-info-icon" />
                  <div>
                    <strong>Correio Eletrónico</strong>
                    <a href={`mailto:${EMAIL}`} style={{fontWeight: 700}}>
                      {EMAIL}
                    </a>
                  </div>
                </div>

                <div className="novavet-info-line">
                  <ShieldCheck className="novavet-info-icon" />
                  <div>
                    <strong>Registo de Funcionamento DGAV</strong>
                    <span>{DGAV_LICENSE} · {TECHNICAL_DIRECTOR}</span>
                  </div>
                </div>
              </div>

              <div className="novavet-quick-action-btns">
                <a className="button" href={MAP} target="_blank" rel="noopener noreferrer">
                  <Navigation size={16} />
                  {t('Como Chegar (Navegação GPS)', 'Open in Google Maps')}
                  <ArrowUpRight size={14} />
                </a>
                <a className="button outline" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={16} />
                  {t('Enviar WhatsApp', 'Send WhatsApp')}
                </a>
              </div>
            </div>

            <div className="novavet-contact-form-col">
              <div className="novavet-form-card">
                <div className="novavet-form-head">
                  <span className="eyebrow">{t('FORMULÁRIO DE CONTACTO', 'INQUIRY FORM')}</span>
                  <h3>{t('Envie-nos a sua mensagem ou pedido', 'Send us your message or request')}</h3>
                  <p>{t('A nossa equipa clínica e técnica responderá no próprio dia útil.', 'Our technical and clinical team will reply promptly.')}</p>
                </div>
                <ContactForm en={en} />
              </div>
            </div>
          </div>

          {/* MAPA GOOGLE EMBED INTEGRADO */}
          <div className="novavet-map-wrapper">
            <iframe
              src={MAP_EMBED}
              width="100%"
              height="380"
              style={{border: 0, borderRadius: '24px', display: 'block'}}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização da Novavet na Rua do Loreto, Bragança"
            />
          </div>
        </section>
      </Reveal>
    </>
  );
}

function StaticPage({slug, t, p, en}: any) {
  const titles: Record<string, string> = {
    'sobre-nos': t('Sobre a Novavet: o parceiro certo', 'About Novavet: the right partner'),
    'servicios': t('Consultório Veterinário & Serviços', 'Veterinary Practice & Services'),
    'contacto': t('Contactos & Localização em Bragança', 'Contacts & Location in Bragança'),
    'privacidad': t('Informação Legal & Registo DGAV', 'Legal & Regulatory Information'),
  };

  const currentTitle = titles[slug] || t('Novavet Bragança', 'Novavet Bragança');

  return (
    <div className="section novavet-static-page">
      <div className="page-hero">
        <span className="eyebrow">NOVAVET · DR. LUÍS AFONSO · BRAGANÇA</span>
        <h1>{currentTitle}</h1>
        <p>
          {t(
            'Consultório médico-veterinário e produtos agropecuários em Bragança, Portugal. Registo oficial DGAV nº PT 1 0124 CN.',
            'Veterinary practice and agricultural supplies in Bragança, Portugal. Official DGAV License nº PT 1 0124 CN.'
          )}
        </p>
      </div>

      <div style={{maxWidth: '1000px', margin: '40px auto'}}>
        {slug === 'contacto' ? (
          <ContactForm en={en} />
        ) : slug === 'privacidad' ? (
          <div className="legal" style={{lineHeight: 1.7, color: 'var(--ink)'}}>
            <h2>Novavet - Produtos Agro-Pecuários, Lda.</h2>
            <p><strong>Firma:</strong> Novavet - Produtos Agro-Pecuários, Lda.</p>
            <p><strong>Direção Técnica:</strong> {TECHNICAL_DIRECTOR} (Médico Veterinário)</p>
            <p><strong>Número de Funcionamento DGAV:</strong> {DGAV_LICENSE}</p>
            <p><strong>Enquadramento Legal:</strong> Consultório Médico-Veterinário e Entidade Distribuidora a Retalho de Medicamentos Veterinários, em conformidade com o Decreto-Lei nº 184/2009 e legislação aplicável.</p>
            <p><strong>Morada:</strong> {FULL_ADDRESS}</p>
            <p><strong>Contacto:</strong> {PHONE} | {EMAIL}</p>
          </div>
        ) : (
          <p style={{fontSize: '17px', color: 'var(--muted)'}}>
            {t(
              'A Novavet alia mais de 35 anos de dedicação à medicina veterinária com uma das mais sólidas estruturas de distribuição farmacêutica e agropecuária de Portugal.',
              'Novavet combines over 35 years of clinical dedication to veterinary medicine with one of Portugal’s most robust pharmaceutical and farm distribution infrastructures.'
            )}
          </p>
        )}
      </div>
    </div>
  );
}
