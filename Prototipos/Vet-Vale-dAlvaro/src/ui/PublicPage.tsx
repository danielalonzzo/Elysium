'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Heart,
  HeartPulse,
  Home as HomeIcon,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Pause,
  PawPrint,
  Phone,
  Play,
  Scissors,
  ShieldCheck,
  Siren,
  Star,
  Stethoscope,
  Tractor,
} from 'lucide-react';
import SiteShell from './SiteShell';
import ContactForm from './ContactForm';
import CareDiagnostic from './CareDiagnostic';
import SymptomGuide from './SymptomGuide';
import PetAgeCalculator from './PetAgeCalculator';
import MythQuiz from './MythQuiz';
import HeroMood from './HeroMood';
import HeroLogo from './HeroLogo';
import Shop from './Shop';
import Reveal from './Reveal';
import { FacebookIcon, InstagramIcon, TileDivider, ValeEmblem } from './ValeEmblem';
import {
  ADDRESS_CITY,
  ADDRESS_POSTAL,
  ADDRESS_STREET,
  BRAND,
  BRAND_SHORT,
  CLINICAL_TEAM,
  COMPANY_LEGAL_NAME,
  DGAV_LICENSE,
  EMAIL,
  FACEBOOK,
  FACEBOOK_LABEL,
  FACEBOOK_RATING,
  FULL_ADDRESS,
  GOOGLE_RATING,
  GPS_LAT,
  GPS_LNG,
  HOURS,
  INSTAGRAM,
  INSTAGRAM_HANDLE,
  MAP,
  MAP_EMBED,
  MOBILE,
  MOBILE_INTL,
  MOBILE_RAW,
  NIF,
  ORIGIN,
  PHONE,
  PHONE_INTL,
  PHONE_RAW,
  TECHNICAL_DIRECTOR,
  VIMIOSO_ADDRESS,
  VIMIOSO_NAME,
  WHATSAPP,
  getBusinessStatus,
  services,
  url,
} from '../core/config';

const SERVICE_ICONS: Record<string, typeof Stethoscope> = {
  Stethoscope,
  HeartPulse,
  Tractor,
  Scissors,
  Home: HomeIcon,
  ShieldCheck,
};

const SPECIES = [
  { id: 'dog', icon: '🐕', pt: 'Cães', en: 'Dogs' },
  { id: 'cat', icon: '🐈', pt: 'Gatos', en: 'Cats' },
  { id: 'horse', icon: '🐴', pt: 'Equídeos', en: 'Equids' },
  { id: 'cattle', icon: '🐄', pt: 'Bovinos', en: 'Cattle' },
  { id: 'sheep', icon: '🐑', pt: 'Ovinos', en: 'Sheep' },
  { id: 'goat', icon: '🐐', pt: 'Caprinos', en: 'Goats' },
  { id: 'pig', icon: '🐖', pt: 'Suínos', en: 'Pigs' },
  { id: 'exotics', icon: '🐰', pt: 'Coelhos & Aves', en: 'Rabbits & Birds' },
] as const;

type T = (pt: string, en: string) => string;

export default function PublicPage({ slug = '', en = false }: { slug?: string; en?: boolean }) {
  const t: T = (pt, english) => (en ? english : pt);
  const p = url(en ? '/en' : '');
  const home = !slug;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VeterinaryCare',
    name: BRAND,
    legalName: COMPANY_LEGAL_NAME,
    taxID: NIF,
    url: ORIGIN,
    telephone: PHONE_RAW,
    email: EMAIL,
    sameAs: [INSTAGRAM, FACEBOOK],
    areaServed: ['Bragança', 'Vimioso', 'Trás-os-Montes'],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: GOOGLE_RATING.value,
      reviewCount: GOOGLE_RATING.count,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: ADDRESS_STREET,
      addressLocality: ADDRESS_CITY,
      postalCode: ADDRESS_POSTAL,
      addressRegion: 'Bragança',
      addressCountry: 'PT',
    },
    geo: { '@type': 'GeoCoordinates', latitude: GPS_LAT, longitude: GPS_LNG },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '13:00',
      },
    ],
  };

  return (
    <SiteShell en={en}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main id="main" className="va">
        {home ? (
          <Home t={t} p={p} en={en} />
        ) : slug === 'tienda' ? (
          <Shop en={en} />
        ) : (
          <SubPage slug={slug} t={t} p={p} en={en} />
        )}
      </main>
    </SiteShell>
  );
}

function ServicesDeck({ en, t }: { en: boolean; t: T }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    const el = track.current;
    if (!el) return;
    const bounded = Math.max(0, Math.min(services.length - 1, index));
    el.scrollTo({ left: bounded * el.clientWidth, behavior: 'smooth' });
    setActive(bounded);
  }

  return (
    <>
      <div className="va-services-grid">
        {services.map((srv, idx) => {
          const Icon = SERVICE_ICONS[srv.icon] || PawPrint;
          return (
            <article key={srv.id} className={`va-service-card is-${srv.tone}`}>
              <div className="va-service-top">
                <span className="va-service-icon" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <span className="va-service-num">0{idx + 1}</span>
              </div>
              <small className="va-service-tag">{en ? srv.enTag : srv.tag}</small>
              <h3>{en ? srv.en : srv.name}</h3>
              <p>{en ? srv.english : srv.text}</p>
              <a className="va-service-link" href={url('/citas')}>
                {t('Marcar ou pedir informação', 'Book or ask about this')}
                <ArrowRight size={15} aria-hidden="true" />
              </a>
            </article>
          );
        })}
      </div>

      <div className="va-services-mobile">
        <div
          ref={track}
          className="va-service-carousel"
          role="region"
          aria-label={t('Lista de serviços clínicos', 'Clinical services list')}
          onScroll={() => {
            const el = track.current;
            if (el && el.clientWidth > 0) setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {services.map((srv, idx) => {
            const Icon = SERVICE_ICONS[srv.icon] || PawPrint;
            return (
              <article key={srv.id} className={`va-service-card is-${srv.tone}`}>
                <div className="va-service-top">
                  <span className="va-service-icon" aria-hidden="true">
                    <Icon size={22} />
                  </span>
                  <span className="va-service-num">0{idx + 1}</span>
                </div>
                <small className="va-service-tag">{en ? srv.enTag : srv.tag}</small>
                <h3>{en ? srv.en : srv.name}</h3>
                <p>{en ? srv.english : srv.text}</p>
                <a className="va-service-link" href={url('/citas')}>
                  {t('Marcar consulta', 'Book a visit')}
                  <ArrowRight size={15} aria-hidden="true" />
                </a>
              </article>
            );
          })}
        </div>
        <div className="va-carousel-controls">
          <button
            type="button"
            className="va-carousel-arrow"
            aria-label={t('Serviço anterior', 'Previous service')}
            disabled={active === 0}
            onClick={() => goTo(active - 1)}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="va-carousel-dots">
            {services.map((srv, idx) => (
              <button
                key={srv.id}
                type="button"
                aria-label={en ? srv.en : srv.name}
                aria-current={active === idx ? 'true' : undefined}
                onClick={() => goTo(idx)}
              />
            ))}
          </div>
          <button
            type="button"
            className="va-carousel-arrow"
            aria-label={t('Serviço seguinte', 'Next service')}
            disabled={active === services.length - 1}
            onClick={() => goTo(active + 1)}
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

function ToolsCarousel({ t }: { t: T }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const primarySetRef = useRef<HTMLDivElement>(null);
  const cloneSetRef = useRef<HTMLDivElement>(null);
  const [userPaused, setUserPaused] = useState(false);
  const userPausedRef = useRef(false);
  const wakeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    userPausedRef.current = userPaused;
    wakeRef.current?.();
  }, [userPaused]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const primarySet = primarySetRef.current;
    const cloneSet = cloneSetRef.current;
    if (!viewport || !track || !primarySet || !cloneSet) return undefined;

    const mobileMql = window.matchMedia('(max-width: 720px)');
    const reducedMql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const BASE_SPEED = 32; // px/s — suave, legível e contínuo

    let animId = 0;
    let lastFrameTime = 0;
    let offset = 0;
    let loopWidth = 0;
    let currentSpeed = BASE_SPEED;
    let isHovering = false;
    let isFocused = false;
    let isInView = true;
    let isVisible = !document.hidden;
    let wheelPauseUntil = 0;

    let isPointerDown = false;
    let activePointerId: number | null = null;
    let isDragging = false;
    let dragLockedVertical = false;
    let suppressClickUntil = 0;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastMoveTime = 0;
    let dragVelocity = 0;

    const isActive = () => mobileMql.matches && !reducedMql.matches;

    const wrapOffset = (val: number) => {
      if (loopWidth <= 10) return 0;
      return ((val % loopWidth) + loopWidth) % loopWidth;
    };

    const applyTransform = () => {
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    };

    const measure = () => {
      if (!isActive()) {
        loopWidth = 0;
        offset = 0;
        currentSpeed = BASE_SPEED;
        track.style.transform = '';
        viewport.classList.remove('is-marquee', 'is-dragging');
        return;
      }
      viewport.classList.add('is-marquee');
      const diff = cloneSet.getBoundingClientRect().left - primarySet.getBoundingClientRect().left;
      if (diff > 10) {
        loopWidth = diff;
        offset = wrapOffset(offset);
        applyTransform();
      }
    };

    const tick = (now: number) => {
      animId = 0;
      if (!isActive() || !isInView || !isVisible) {
        lastFrameTime = 0;
        return;
      }

      if (!lastFrameTime) lastFrameTime = now;
      const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
      lastFrameTime = now;

      if (loopWidth <= 10) measure();

      if (loopWidth > 10 && !isDragging) {
        const shouldPause =
          userPausedRef.current ||
          isHovering ||
          isFocused ||
          isPointerDown ||
          now < wheelPauseUntil;

        const targetSpeed = shouldPause ? 0 : BASE_SPEED;
        const easeRate = Math.abs(currentSpeed) > BASE_SPEED * 1.5 ? 4.2 : 6.5;
        currentSpeed += (targetSpeed - currentSpeed) * (1 - Math.exp(-easeRate * dt));

        if (targetSpeed === 0 && Math.abs(currentSpeed) < 0.2) {
          currentSpeed = 0;
        }

        if (currentSpeed !== 0) {
          offset = wrapOffset(offset + currentSpeed * dt);
          applyTransform();
        }
      }

      animId = window.requestAnimationFrame(tick);
    };

    const ensureRunning = () => {
      if (!animId && isActive() && isInView && isVisible) {
        lastFrameTime = 0;
        animId = window.requestAnimationFrame(tick);
      }
    };

    wakeRef.current = ensureRunning;

    const onEnvChange = () => {
      measure();
      if (isActive()) {
        ensureRunning();
      } else if (animId) {
        window.cancelAnimationFrame(animId);
        animId = 0;
      }
    };

    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') isHovering = true;
    };

    const onPointerLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        isHovering = false;
        ensureRunning();
      }
    };

    const onFocusIn = () => {
      isFocused = true;
    };

    const onFocusOut = (e: FocusEvent) => {
      if (!viewport.contains(e.relatedTarget as Node | null)) {
        isFocused = false;
        ensureRunning();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!isActive() || loopWidth <= 10 || isPointerDown) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      isPointerDown = true;
      activePointerId = e.pointerId;
      isDragging = false;
      dragLockedVertical = false;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastMoveTime = performance.now();
      dragVelocity = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown || dragLockedVertical || e.pointerId !== activePointerId) return;
      const dxTotal = e.clientX - startX;
      const dyTotal = e.clientY - startY;

      if (!isDragging) {
        if (Math.abs(dyTotal) > 6 && Math.abs(dyTotal) > Math.abs(dxTotal)) {
          dragLockedVertical = true;
          isPointerDown = false;
          activePointerId = null;
          return;
        }
        if (Math.abs(dxTotal) > 6 && Math.abs(dxTotal) > Math.abs(dyTotal)) {
          isDragging = true;
          viewport.classList.add('is-dragging');
          lastX = e.clientX;
          lastMoveTime = performance.now();
        } else {
          return;
        }
      }

      const now = performance.now();
      const dx = e.clientX - lastX;
      const elapsed = Math.max(now - lastMoveTime, 4);
      lastX = e.clientX;
      lastMoveTime = now;

      const instantVel = (-dx / elapsed) * 1000;
      dragVelocity = dragVelocity * 0.6 + instantVel * 0.4;

      offset = wrapOffset(offset - dx);
      applyTransform();
    };

    const finishDrag = (e: PointerEvent) => {
      if (activePointerId !== null && e.pointerId !== activePointerId) return;
      if (!isPointerDown && !isDragging) return;
      const wasDragging = isDragging;
      isPointerDown = false;
      activePointerId = null;
      isDragging = false;
      dragLockedVertical = false;
      viewport.classList.remove('is-dragging');

      if (wasDragging) {
        suppressClickUntil = performance.now() + 280;
        const stale = performance.now() - lastMoveTime > 90;
        currentSpeed = stale ? 0 : Math.max(-950, Math.min(950, dragVelocity));
        ensureRunning();
      }
    };

    const onClickCapture = (e: MouseEvent) => {
      if (performance.now() < suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!isActive() || loopWidth <= 10) return;
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 1) return;
      e.preventDefault();
      offset = wrapOffset(offset + e.deltaX);
      applyTransform();
      currentSpeed = 0;
      wheelPauseUntil = performance.now() + 650;
      ensureRunning();
    };

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        ensureRunning();
      } else if (animId) {
        window.cancelAnimationFrame(animId);
        animId = 0;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isInView = entry.isIntersecting;
        if (isInView) {
          ensureRunning();
        } else if (animId) {
          window.cancelAnimationFrame(animId);
          animId = 0;
        }
      },
      { threshold: 0 }
    );
    io.observe(viewport);

    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    ro.observe(primarySet);

    mobileMql.addEventListener('change', onEnvChange);
    reducedMql.addEventListener('change', onEnvChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    viewport.addEventListener('pointerenter', onPointerEnter);
    viewport.addEventListener('pointerleave', onPointerLeave);
    viewport.addEventListener('focusin', onFocusIn);
    viewport.addEventListener('focusout', onFocusOut);
    viewport.addEventListener('pointerdown', onPointerDown, { passive: true });
    viewport.addEventListener('click', onClickCapture, true);
    viewport.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);

    measure();
    ensureRunning();

    return () => {
      wakeRef.current = null;
      if (animId) window.cancelAnimationFrame(animId);
      io.disconnect();
      ro.disconnect();
      mobileMql.removeEventListener('change', onEnvChange);
      reducedMql.removeEventListener('change', onEnvChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      viewport.removeEventListener('pointerenter', onPointerEnter);
      viewport.removeEventListener('pointerleave', onPointerLeave);
      viewport.removeEventListener('focusin', onFocusIn);
      viewport.removeEventListener('focusout', onFocusOut);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('click', onClickCapture, true);
      viewport.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
      track.style.transform = '';
      viewport.classList.remove('is-marquee', 'is-dragging');
    };
  }, []);

  const items = [
    {
      num: '01',
      href: '#orientador',
      Icon: HeartPulse,
      title: t('Orientador de Sintomas', 'Symptom Guide'),
      body: t(
        'Quatro perguntas rápidas para saber se deve ligar já ou vigiar em casa.',
        'Four quick questions to know whether to call right away or monitor at home.'
      ),
      cta: t('Abrir', 'Open'),
    },
    {
      num: '02',
      href: '#diagnostico',
      Icon: ClipboardList,
      title: t('Check-up de Cuidados', 'Care Check-up'),
      body: t(
        'Reveja vacinas, desparasitação e rotina para receber uma orientação.',
        'Review vaccines, parasites and routine for a tailored recommendation.'
      ),
      cta: t('Fazer', 'Start'),
    },
    {
      num: '03',
      href: '#idade',
      Icon: CalendarDays,
      title: t('Calculadora de Idade', 'Age Calculator'),
      body: t(
        'Descubra a idade humana aproximada e os cuidados da fase atual.',
        'Discover approximate human age and care priorities for their stage.'
      ),
      cta: t('Calcular', 'Calculate'),
    },
    {
      num: '04',
      href: url('/portal'),
      Icon: LockKeyhole,
      title: t('Área Privada do Tutor', 'Client Portal'),
      body: t(
        'Consulte fichas dos seus animais, próximas vacinas SIAC e marcações.',
        'View your pets’ records, upcoming vaccines and appointments.'
      ),
      cta: t('Entrar', 'Sign in'),
    },
  ];

  const renderCards = (clone: boolean) =>
    items.map(({ num, href, Icon, title, body, cta }) => (
      <a
        key={clone ? `clone-${num}` : num}
        className="va-tool-card"
        href={href}
        draggable={false}
        tabIndex={clone ? -1 : undefined}
      >
        <span className="va-tool-num" aria-hidden="true">
          {num}
        </span>
        <Icon size={24} aria-hidden="true" />
        <h3>{title}</h3>
        <p>{body}</p>
        <em>
          {cta} <ArrowRight size={14} aria-hidden="true" />
        </em>
      </a>
    ));

  return (
    <div
      className="va-tools-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={t('Simuladores práticos', 'Practical tools')}
    >
      <div
        ref={viewportRef}
        className="va-tools-viewport"
        onDragStart={(e) => e.preventDefault()}
      >
        <div ref={trackRef} className="va-tools-track">
          <div ref={primarySetRef} className="va-tools-set is-primary">
            {renderCards(false)}
          </div>
          <div ref={cloneSetRef} className="va-tools-set is-clone" aria-hidden="true">
            {renderCards(true)}
          </div>
        </div>
      </div>

      <div className="va-tools-bar">
        <span className="va-tools-hint" aria-hidden="true">
          {t('Deslize ou toque num simulador', 'Swipe or tap a tool')}
        </span>
        <button
          type="button"
          className="va-tools-toggle"
          onClick={() => setUserPaused((paused) => !paused)}
        >
          {userPaused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
          <span>{userPaused ? t('Continuar', 'Play') : t('Pausar', 'Pause')}</span>
        </button>
      </div>
    </div>
  );
}

function Home({ t, en }: { t: T; p: string; en: boolean }) {
  const [status, setStatus] = useState(() => getBusinessStatus());
  const speciesBandRef = useRef<HTMLDivElement>(null);
  const heroBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setStatus(getBusinessStatus()), 30000);
    return () => window.clearInterval(id);
  }, []);

  // Fallback para navegadores sem Scroll-Driven Animations nativas
  useEffect(() => {
    const speciesEl = speciesBandRef.current;
    const heroBodyEl = heroBodyRef.current;
    if (typeof CSS === 'undefined') return undefined;
    const supportsScrollDriven = CSS.supports('(animation-timeline: scroll()) and (animation-range: 0px 1px)');
    const wantsMotion = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    if (supportsScrollDriven || !wantsMotion) return undefined;

    const sync = () => {
      const scrollY = window.scrollY;
      if (speciesEl) speciesEl.dataset.scrollState = scrollY >= 48 ? 'visible' : 'hidden';
      if (heroBodyEl) heroBodyEl.dataset.scrollState = scrollY >= 18 ? 'visible' : 'hidden';
    };
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    return () => {
      window.removeEventListener('scroll', sync);
      if (speciesEl) delete speciesEl.dataset.scrollState;
      if (heroBodyEl) delete heroBodyEl.dataset.scrollState;
    };
  }, []);

  return (
    <>
      {/* ── 1. HERO: Emblema 3D vivo em Blender + acolhimento transmontano ── */}
      <section className="va-hero">
        <div className="va-hero-grid">
          <div className="va-hero-copy">
            <div className="va-hero-chips">
              <span className="va-chip va-chip-place">
                <MapPin size={14} aria-hidden="true" />
                {ADDRESS_STREET} · {ADDRESS_CITY}
              </span>
              <span className={`va-chip va-chip-status ${status.state}`} suppressHydrationWarning>
                <i aria-hidden="true" />
                {en ? status.enText : status.text}
              </span>
            </div>

            <div ref={heroBodyRef} className="va-hero-body">
              <h1 className="va-h1">
                {t('Cuidamos dos seus animais com o amor ', 'Caring for your animals with the love ')}
                <em>{t('de quem é da terra.', 'of neighbours who know you.')}</em>
              </h1>

              <p className="va-hero-lead">
                {t(
                  "Na Clínica Veterinária Vale d'Álvaro de Bragança e no Consultório Veterinário de Vimioso cuidamos de pequenos animais e acompanhamos espécies pecuárias e suiniculturas com dedicação, rigor clínico e proximidade.",
                  "At Clínica Veterinária Vale d'Álvaro in Bragança and our Vimioso practice we care for companion animals and support livestock and swine farms with dedication, clinical rigor and proximity."
                )}
              </p>

              <div className="va-hero-actions">
                <a className="va-btn va-btn-primary va-btn-lg" href={url('/citas')}>
                  <CalendarDays size={18} aria-hidden="true" />
                  {t('Marcar consulta', 'Book a visit')}
                </a>
                <a className="va-btn va-btn-azulejo va-btn-lg" href={`tel:${PHONE_RAW}`}>
                  <Phone size={18} aria-hidden="true" />
                  {t(`Ligar · ${PHONE}`, `Call · ${PHONE}`)}
                </a>
                <a className="va-text-link" href={MAP} target="_blank" rel="noopener noreferrer">
                  <Navigation size={15} aria-hidden="true" />
                  {t('Ver no mapa', 'View map')}
                </a>
              </div>

              <div className="va-hero-mood-desktop">
                <HeroMood en={en} />
              </div>
            </div>
          </div>

          <div className="va-hero-visual">
            <HeroLogo en={en} />
            <div className="va-hero-mood-mobile">
              <HeroMood en={en} />
            </div>
          </div>
        </div>
      </section>

      <TileDivider />

      <div ref={speciesBandRef} className="va-species-band">
        <ul className="va-species-bar" aria-label={t('Espécies que acompanhamos', 'Species we care for')}>
          {SPECIES.map((s) => (
            <li key={s.id}>
              <span aria-hidden="true">{s.icon}</span>
              {en ? s.en : s.pt}
            </li>
          ))}
        </ul>
      </div>

      {/* ── 2. FAIXA DE URGÊNCIAS & CONTACTO DIRETO ── */}
      <section className="va-urgent-band" aria-labelledby="urgencias-heading">
        <div className="va-urgent-card">
          <div className="va-urgent-seal">
            <ValeEmblem size={76} />
            <span>CAMV · DGAV {DGAV_LICENSE}</span>
          </div>

          <div className="va-urgent-body">
            <span className="va-urgent-kicker">
              <Siren size={15} aria-hidden="true" />
              {t('Bragança & Vimioso · Atendimento de Proximidade', 'Bragança & Vimioso · Local Care')}
            </span>
            <h2 id="urgencias-heading">
              {t('Urgências sob contacto telefónico e serviço ambulatório.', 'Emergencies by prior phone call & mobile care.')}
            </h2>
            <p>
              {t(
                'Em caso de urgência (incluindo fora do horário habitual ou ao domingo), ligue sempre antes para confirmar a disponibilidade da equipa. Dispomos de internamento, transporte de animais doentes, serviço ao domicílio e somos entidade aderente ao Cheque Veterinário OMV.',
                'In case of an emergency (including outside regular hours or on Sundays), please call ahead to confirm team availability. We provide hospitalization, sick animal transport, home visits and OMV Cheque Veterinário care.'
              )}
            </p>
            <div className="va-urgent-actions">
              <a className="va-urgent-tel" href={`tel:${PHONE_RAW}`}>
                <Phone size={19} aria-hidden="true" />
                <span>
                  <small>{t('Clínica (rede fixa nacional)', 'Clinic landline')}</small>
                  <strong>{PHONE}</strong>
                </span>
              </a>
              <a className="va-urgent-tel" href={`tel:${MOBILE_RAW}`}>
                <Phone size={19} aria-hidden="true" />
                <span>
                  <small>{t('Telemóvel / Urgências', 'Mobile / Emergencies')}</small>
                  <strong>{MOBILE}</strong>
                </span>
              </a>
              <a className="va-btn va-btn-linen" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={17} aria-hidden="true" />
                WhatsApp
              </a>
              <a className="va-btn va-btn-outline-light" href={MAP} target="_blank" rel="noopener noreferrer">
                <Navigation size={16} aria-hidden="true" />
                {t('Como chegar', 'Directions')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SERVIÇOS ── */}
      <Reveal>
        <section className="va-section" id="servicos">
          <header className="va-section-head">
            <span className="va-eyebrow">{t('Serviços Clínicos & Bem-Estar', 'Clinical & Care Services')}</span>
            <h2>
              {t('Da sala de consulta na Rua de Montesinho ', 'From our Rua de Montesinho clinic ')}
              <em>{t('às explorações da serra.', 'to the farms of Montesinho.')}</em>
            </h2>
            <p>
              {t(
                'Tudo o que precisa para acompanhar a saúde do seu companheiro ou do seu efetivo pecuário, com explicações claras e acompanhamento contínuo.',
                'Everything you need to look after your companion animal or livestock herd, with plain explanations and steady follow-up.'
              )}
            </p>
          </header>

          <ServicesDeck en={en} t={t} />
        </section>
      </Reveal>

      {/* ── 4. A NOSSA CASA EM BRAGANÇA (Banda Azul Azulejo) ── */}
      <Reveal>
        <section className="va-story-band" id="clinica">
          <div className="va-story-inner">
            <div className="va-story-left">
              <div className="va-story-crest-card">
                <ValeEmblem size={102} />
                <span className="va-story-place">Bragança &amp; Vimioso</span>
                <p>
                  {t(
                    'Desde 2015 com o lema «Animais sãos e donos felizes», sob direção clínica do Dr. Luís Asseiro de Sá.',
                    'Guided since 2015 by “Healthy animals and happy owners”, led by Dr. Luís Asseiro de Sá.'
                  )}
                </p>
                <div className="va-story-badges">
                  <span>DGAV {DGAV_LICENSE}</span>
                  <span>Cheque Veterinário OMV</span>
                  <span>{VIMIOSO_NAME}</span>
                </div>
              </div>

              <div className="va-hours-card">
                <div className="va-hours-head">
                  <Clock3 size={18} aria-hidden="true" />
                  <h3>{t('Horário de Atendimento', 'Opening Hours')}</h3>
                </div>
                <dl>
                  {HOURS.map((h) => (
                    <div key={h.days}>
                      <dt>{en ? h.enDays : h.days}</dt>
                      <dd>{en && 'enTime' in h ? h.enTime : h.time}</dd>
                    </div>
                  ))}
                </dl>
                <small>
                  {t(
                    `Bragança (${ADDRESS_STREET}) e ${VIMIOSO_NAME} (${VIMIOSO_ADDRESS}). Para consultas, tosquias, hotel ou visitas de campo, ligue ${PHONE} ou ${MOBILE}.`,
                    `Bragança (${ADDRESS_STREET}) and ${VIMIOSO_NAME} (${VIMIOSO_ADDRESS}). For consultations, grooming, boarding or farm visits, call ${PHONE} or ${MOBILE}.`
                  )}
                </small>
              </div>
            </div>

            <div className="va-story-right">
              <span className="va-eyebrow is-light">{t('A Nossa Equipa & Maneira de Cuidar', 'Our Team & Way of Caring')}</span>
              <h2>
                {t('Medicina séria, trato humano ', 'Dependable medicine, human warmth ')}
                <em>{t('e porta aberta à vizinhança.', 'and an open door to our neighbours.')}</em>
              </h2>
              <p className="va-story-text">
                {t(
                  'A nossa equipa, composta pelos médicos veterinários Dr. Luís Asseiro de Sá, Dra. Lina Freire, Dra. Susana Alves e Dr. Miguel Pinheiro, e pelos enfermeiros veterinários Susana de Sá, Felipe Cazarin, Inês Lestre da Silva, Juliana Pereira e Rita Dias, acompanha cada caso com tempo, explicações claras e contacto próximo com os tutores, na clínica em Bragança, no Consultório Veterinário de Vimioso e nas explorações de Trás-os-Montes.',
                  'Our team — veterinarians Dr. Luís Asseiro de Sá, Dra. Lina Freire, Dra. Susana Alves and Dr. Miguel Pinheiro alongside veterinary nurses Susana de Sá, Felipe Cazarin, Inês Lestre da Silva, Juliana Pereira and Rita Dias — cares for every patient with time, clear explanations and close follow-up in Bragança, at our Vimioso practice and across farms in Trás-os-Montes.'
                )}
              </p>

              <ul className="va-pillars">
                <li>
                  <Heart size={18} aria-hidden="true" />
                  <div>
                    <strong>{t('Carinho e acompanhamento próximo', 'Warmth and close follow-up')}</strong>
                    <span>
                      {t(
                        'Respeitamos o ritmo de cada animal e mantemos os tutores informados durante todo o tratamento e internamento.',
                        'We respect each animal’s pace and keep owners informed throughout treatment and hospitalization.'
                      )}
                    </span>
                  </div>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <div>
                    <strong>{t('Clínica, cirurgia e diagnóstico no local', 'In-house medicine, surgery and lab work')}</strong>
                    <span>
                      {t(
                        'Análises sanguíneas, esfregaços, cirurgia de pequenos animais, internamento, tosquias, banhos e hotel.',
                        'Blood tests, smears, small-animal surgery, hospitalization, grooming, bathing and pet hotel.'
                      )}
                    </span>
                  </div>
                </li>
                <li>
                  <ShieldCheck size={18} aria-hidden="true" />
                  <div>
                    <strong>{t('Cidade e campo · Bragança e Vimioso', 'Town and countryside · Bragança & Vimioso')}</strong>
                    <span>
                      {t(
                        'Frota ambulatória para domicílios, clínica e cirurgia pecuária e equipa dedicada à sanidade em suiniculturas.',
                        'Ambulatory fleet for home visits, livestock medicine & surgery and dedicated swine herd-health fieldwork.'
                      )}
                    </span>
                  </div>
                </li>
              </ul>

              <figure className="va-review-card">
                <div className="va-review-stars" aria-label={`${GOOGLE_RATING.score} em 5 estrelas`}>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <Star key={n} size={16} fill="currentColor" aria-hidden="true" />
                  ))}
                  <strong>{GOOGLE_RATING.score}</strong>
                  <span>
                    · {GOOGLE_RATING.count} {t('opiniões no Google Maps', 'reviews on Google Maps')} · {FACEBOOK_RATING.percent}%{' '}
                    {t(`recomendam no Facebook (${FACEBOOK_RATING.count})`, `recommend on Facebook (${FACEBOOK_RATING.count})`)}
                  </span>
                </div>
                <blockquote>
                  {t(
                    '«Sempre disponíveis para os nossos animais. Trato incrível, explicam tudo com calma e acompanham cada passo — até ao domingo em urgência.»',
                    '“Always available for our animals. Wonderful care, calm explanations and close follow-up — even on Sundays in an emergency.”'
                  )}
                </blockquote>
                <figcaption>
                  {t(
                    'Síntese de críticas reais de tutores · Google Maps & Facebook',
                    'Summary of real pet owners’ reviews · Google Maps & Facebook'
                  )}
                </figcaption>
              </figure>
            </div>
          </div>
        </section>
      </Reveal>

      <TileDivider />

      {/* ── 5. SIMULADORES (cada um pensado para caber numa só vista de ecrã) ── */}
      <Reveal>
        <section className="va-section va-section-sand" id="ferramentas">
          <header className="va-section-head">
            <span className="va-eyebrow">{t('Antes da Consulta', 'Before Your Visit')}</span>
            <h2>
              {t('Simuladores práticos para decidir ', 'Practical tools to decide ')}
              <em>{t('com tranquilidade.', 'with peace of mind.')}</em>
            </h2>
            <p>
              {t(
                'Não substituem o médico veterinário, mas ajudam a perceber quando ligar, rever vacinas e preparar melhor a sua visita.',
                'They do not replace a veterinary exam, but help you gauge urgency, review preventive care and prepare for your clinic visit.'
              )}
            </p>
          </header>

          <ToolsCarousel t={t} />

          <div className="va-interactive-stack">
            <SymptomGuide embedded en={en} />
            <div className="va-care-age-row">
              <CareDiagnostic en={en} />
              <PetAgeCalculator en={en} />
            </div>
            <MythQuiz en={en} />
          </div>
        </section>
      </Reveal>

      {/* ── 6. CONTACTOS & FORMULÁRIO (ajustado a 1 ecrã em desktop e mobile) ── */}
      <Reveal>
        <section className="va-section va-contact-section" id="contacto">
          <div className="va-contact-grid">
            <div className="va-contact-aside">
              <span className="va-eyebrow">{t('Contactos & Morada em Bragança', 'Contact & Location in Bragança')}</span>
              <h2>
                {t('Passe pela Rua de Montesinho ', 'Drop by Rua de Montesinho ')}
                <em>{t('ou fale connosco.', 'or drop us a line.')}</em>
              </h2>
              <p className="va-contact-lead">
                {t(
                  'Para marcar consulta, reservar hotel ou tosquia, pedir ração ou tirar uma dúvida. Em urgência, ligue diretamente.',
                  'To book a consultation, reserve boarding or grooming, or ask a question. In an emergency, please phone directly.'
                )}
              </p>

              <div className="va-contact-channels">
                {/* Canal principal: Teléfonos y Correo */}
                <div className="va-contact-group">
                  <span className="va-contact-group-label">{t('Linhas diretas & Atendimento', 'Direct lines & Enquiries')}</span>
                  <div className="va-contact-cards">
                    <a href={`tel:${PHONE_RAW}`} className="va-channel-card">
                      <div className="va-channel-icon">
                        <Phone size={18} aria-hidden="true" />
                      </div>
                      <div className="va-channel-info">
                        <span className="va-channel-tag">{t('Rede fixa nacional', 'Landline')}</span>
                        <strong className="va-channel-value">{PHONE_INTL}</strong>
                      </div>
                      <ArrowUpRight size={15} className="va-channel-arrow" aria-hidden="true" />
                    </a>

                    <a href={`tel:${MOBILE_RAW}`} className="va-channel-card is-urgent">
                      <div className="va-channel-icon">
                        <Phone size={18} aria-hidden="true" />
                      </div>
                      <div className="va-channel-info">
                        <span className="va-channel-tag">{t('Telemóvel & Urgências', 'Mobile & Emergencies')}</span>
                        <strong className="va-channel-value">{MOBILE_INTL}</strong>
                      </div>
                      <ArrowUpRight size={15} className="va-channel-arrow" aria-hidden="true" />
                    </a>

                    <a href={`mailto:${EMAIL}`} className="va-channel-card">
                      <div className="va-channel-icon">
                        <Mail size={18} aria-hidden="true" />
                      </div>
                      <div className="va-channel-info">
                        <span className="va-channel-tag">{t('Correio eletrónico', 'Email')}</span>
                        <strong className="va-channel-value">{EMAIL}</strong>
                      </div>
                      <ArrowUpRight size={15} className="va-channel-arrow" aria-hidden="true" />
                    </a>
                  </div>
                </div>

                {/* Ubicación / Morada */}
                <div className="va-contact-group">
                  <span className="va-contact-group-label">{t('Clínica & Localização', 'Clinic & Location')}</span>
                  <a href={MAP} target="_blank" rel="noopener noreferrer" className="va-channel-card va-channel-card-address">
                    <div className="va-channel-icon">
                      <MapPin size={18} aria-hidden="true" />
                    </div>
                    <div className="va-channel-info">
                      <span className="va-channel-tag">Bragança</span>
                      <strong className="va-channel-value">{ADDRESS_STREET}</strong>
                      <span className="va-channel-sub">{ADDRESS_POSTAL} {ADDRESS_CITY} · Polo Vimioso</span>
                    </div>
                    <ArrowUpRight size={15} className="va-channel-arrow" aria-hidden="true" />
                  </a>
                </div>

                {/* Redes Sociales en pastillas compactas */}
                <div className="va-contact-group">
                  <span className="va-contact-group-label">{t('Comunidade & Redes', 'Community & Social')}</span>
                  <div className="va-social-row">
                    <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="va-social-pill">
                      <InstagramIcon size={16} />
                      <span>{INSTAGRAM_HANDLE}</span>
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </a>
                    <a href={FACEBOOK} target="_blank" rel="noopener noreferrer" className="va-social-pill">
                      <FacebookIcon size={16} />
                      <span>Facebook</span>
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="va-map-frame">
                <iframe
                  src={MAP_EMBED}
                  width="100%"
                  height="175"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t(`Mapa da ${BRAND} em Bragança`, `${BRAND} map in Bragança`)}
                />
              </div>
            </div>

            <div className="va-form-wrap">
              <ContactForm en={en} />
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}

function SubPage({ slug, t, p, en }: { slug: string; t: T; p: string; en: boolean }) {
  const titles: Record<string, [string, string]> = {
    orientador: ['Orientador de Sintomas', 'Symptom Guide'],
    diagnostico: ['Check-up de Cuidados & Idade', 'Care Check-up & Age'],
    servicios: ['Serviços Clínicos & Bem-Estar', 'Clinical & Care Services'],
    'sobre-mi': ["Sobre a Clínica Vale d'Álvaro", "About Vale d'Álvaro Clinic"],
    cirugia: ['Cirurgia & Internamento', 'Surgery & Hospitalization'],
    grooming: ['Banhos, Tosquias & Hotel', 'Grooming & Pet Hotel'],
    privacidad: ['Privacidade, RGPD & Registo DGAV', 'Privacy, GDPR & DGAV Registry'],
    'politica-cookies': ['Política de Cookies', 'Cookie Policy'],
    terminos: ['Informações do Serviço', 'Service Terms'],
  };
  const [ptTitle, enTitle] = titles[slug] || ['Contactos & Marcações', 'Contact & Bookings'];

  return (
    <div className="va-subpage">
      <section className="va-subhero">
        <div className="va-subhero-inner">
          <nav className="va-breadcrumb" aria-label={t('Navegação', 'Breadcrumb')}>
            <a href={p || url('/')}>{BRAND_SHORT}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{t(ptTitle, enTitle)}</span>
          </nav>
          <span className="va-eyebrow is-light">
            {BRAND.toUpperCase()} · DGAV {DGAV_LICENSE}
          </span>
          <h1>{t(ptTitle, enTitle)}</h1>
          <p>
            {FULL_ADDRESS} · Tel. {PHONE}
          </p>
        </div>
      </section>
      <TileDivider />

      <div className="va-section">
        {slug === 'orientador' ? (
          <div className="va-interactive-stack">
            <SymptomGuide en={en} />
            <CareDiagnostic en={en} />
          </div>
        ) : slug === 'diagnostico' ? (
          <div className="va-interactive-stack">
            <div className="va-care-age-row">
              <CareDiagnostic en={en} />
              <PetAgeCalculator en={en} />
            </div>
            <MythQuiz en={en} />
          </div>
        ) : slug === 'servicios' || slug === 'cirugia' || slug === 'grooming' ? (
          <ServicesDeck en={en} t={t} />
        ) : slug === 'sobre-mi' ? (
          <div className="va-about-card">
            <ValeEmblem size={104} />
            <div>
              <h2>{BRAND}</h2>
              <p>
                {t(
                  `A ${COMPANY_LEGAL_NAME} (NIPC ${NIF} · CAMV DGAV ${DGAV_LICENSE}) funciona desde 2015 na ${ADDRESS_STREET}, em Bragança, contando também com o ${VIMIOSO_NAME} (${VIMIOSO_ADDRESS}). Prestamos clínica e cirurgia de pequenos animais (com internamento e análises sanguíneas), tosquias e banhos, hotel animal, clínica e cirurgia de espécies pecuárias e reprodução e sanidade em suiniculturas.`,
                  `${COMPANY_LEGAL_NAME} (Tax ID ${NIF} · CAMV DGAV ${DGAV_LICENSE}) has served Bragança since 2015 from ${ADDRESS_STREET}, alongside ${VIMIOSO_NAME} (${VIMIOSO_ADDRESS}). We provide small-animal medicine, surgery, blood diagnostics and hospitalization, grooming and bathing, pet hotel, livestock medicine & surgery, and swine herd reproduction & health.`
                )}
              </p>
              <p>
                <strong>{t('Médicos Veterinários', 'Veterinarians')}:</strong>{' '}
                {CLINICAL_TEAM.vets.map((v) => v.name).join(' · ')}
                <br />
                <strong>{t('Enfermeiros Veterinários', 'Veterinary Nurses')}:</strong>{' '}
                {CLINICAL_TEAM.nurses.join(' · ')}
              </p>
              <div className="va-hero-actions">
                <a className="va-btn va-btn-primary" href={url('/citas')}>
                  <CalendarDays size={17} /> {t('Marcar consulta', 'Book a visit')}
                </a>
                <a className="va-btn va-btn-azulejo" href={`tel:${PHONE_RAW}`}>
                  <Phone size={17} /> {PHONE}
                </a>
                <a className="va-btn va-btn-ghost" href={`tel:${MOBILE_RAW}`}>
                  <Phone size={17} /> {MOBILE}
                </a>
              </div>
            </div>
          </div>
        ) : slug === 'privacidad' || slug === 'politica-cookies' || slug === 'terminos' ? (
          <article className="va-legal-card">
            <h2>{t('Informação Regulamentar & Proteção de Dados', 'Regulatory & Data Protection Notice')}</h2>
            <p>
              <strong>{t('Entidade', 'Entity')}:</strong> {COMPANY_LEGAL_NAME} (NIPC {NIF})
            </p>
            <p>
              <strong>{t('Direção Clínica', 'Clinical Direction')}:</strong> {TECHNICAL_DIRECTOR}
            </p>
            <p>
              <strong>{t('Registo Oficial DGAV', 'Official DGAV License')}:</strong> {DGAV_LICENSE}
            </p>
            <p>
              <strong>{t('Sede (Bragança)', 'Main Clinic (Bragança)')}:</strong> {FULL_ADDRESS}
            </p>
            <p>
              <strong>{t('Outra Unidade', 'Second Practice')}:</strong> {VIMIOSO_NAME} — {VIMIOSO_ADDRESS}
            </p>
            <p>
              <strong>{t('Contactos', 'Contacts')}:</strong> {PHONE_INTL} · {MOBILE_INTL} · {EMAIL}
            </p>
            <p>
              {t(
                'Os dados pessoais e clínicos recolhidos destinam-se exclusivamente à prestação de cuidados médico-veterinários, registo SIAC, gestão de marcações e lembretes sanitários autorizados pelo tutor, nos termos do RGPD (UE) 2016/679 e da Lei n.º 58/2019 (CNPD).',
                'Personal and clinical data collected are used solely for veterinary care, SIAC registration, appointment management and owner-authorized reminders under EU GDPR 2016/679 and Portuguese Law 58/2019.'
              )}
            </p>
          </article>
        ) : (
          <div className="va-form-single">
            <ContactForm en={en} />
          </div>
        )}
      </div>
    </div>
  );
}
