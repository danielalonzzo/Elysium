'use client';
import {useEffect, useRef, useState} from 'react';
import {Menu, X, Phone, Sun, Moon, Settings, MessageCircle, CalendarDays, ShieldCheck, Download, UserRound, MapPin} from 'lucide-react';
import DockMascot from './DockMascot';
import {BRAND, MAP_EMBED, TEAM, SEDES, WHATSAPP, INSTAGRAM, FACEBOOK, url, getBusinessStatus, type BusinessStatus} from '../core/config';

export const Instagram = ({size = 18}: {size?: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>
);
export const Facebook = ({size = 18}: {size?: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V21M6 11h8"/></svg>
);

/** Logótipo calcado del cartel (scripts/logo3d/build_logo.py → 3vet-wordmark.svg). */
export function Wordmark({height = 40}: {height?: number}) {
  // eslint-disable-next-line @next/next/no-img-element -- SVG estático del calco
  return <img className="v3-wordmark" src={url('/images/3vet/3vet-wordmark.svg')} alt="3VET Saúde Animal" height={height} style={{height, width: 'auto'}} />;
}

// Supply the server-verified customer session when registration is connected.
// Demo portal access must not be treated as an authenticated session.
export type CustomerSession = {userId: string} | null;

export default function SiteShell({children, en = false, session = null}: {children: React.ReactNode; en?: boolean; session?: CustomerSession}) {
  const [menu, setMenu] = useState(false);
  const [magic, setMagic] = useState(false);
  const [dockHidden, setDockHidden] = useState(false);
  const [bannerSlide, setBannerSlide] = useState(0);
  const [theme, setTheme] = useState('light');
  const version = 'elysiumOS 1.0.0 BETA';
  const [consent, setConsent] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [hasMascot, setHasMascot] = useState(false);
  const [bizStatus, setBizStatus] = useState<BusinessStatus>(() => getBusinessStatus());

  const settings = useRef<HTMLDialogElement>(null);
  const cookies = useRef<HTMLDialogElement>(null);
  const install = useRef<any>(null);

  useEffect(() => {
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      const hidden = visible.size > 0;
      setDockHidden(hidden);
      if (hidden) setMagic(false);
    });
    document.querySelectorAll('.v3-footer, .contact-form').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [children]);

  useEffect(() => {
    const timer = window.setInterval(() => setBannerSlide(slide => (slide + 1) % (TEAM.length + 1)), 4000);
    return () => window.clearInterval(timer);
  }, []);

  const prefix = url(en ? '/en' : '');
  const home = url(en ? '/en' : '/');
  const other = url(en ? '/' : '/en');
  const t = (pt: string, english: string) => (en ? english : pt);

  useEffect(() => {
    const value = localStorage.getItem('theme_mode') === 'dark' ? 'dark' : 'light';
    setTheme(value);
    document.documentElement.dataset.theme = value;
    setConsent(!localStorage.getItem('ely-consent-v1'));
    const updateStatus = () => setBizStatus(getBusinessStatus());
    updateStatus();
    const statusInterval = setInterval(updateStatus, 30000);
    const timer = setTimeout(() => setReady(true), 450);

    // Fallback for <dialog closedby="any"> per modern-web-guidance: dialog
    if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e: PointerEvent, dialog: HTMLDialogElement) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog[closedby="any"]')) {
        let pressedOutside = false;
        dialog.addEventListener('pointerdown', (e) => { pressedOutside = outside(e, dialog); });
        dialog.addEventListener('pointerup', (e) => { if (pressedOutside && outside(e, dialog)) dialog.close(); });
      }
    }

    return () => {
      clearTimeout(timer);
      clearInterval(statusInterval);
    };
  }, []);

  const nav = [
    ['/#equipa', 'Equipa', 'Team'],
    ['/#clinicas', 'Clínicas', 'Clinics'],
    ['/#servicos', 'Serviços', 'Services'],
    ['/orientador', 'Orientador', 'Symptom guide'],
    ['/#contacto', 'Contactos', 'Contact'],
  ];

  function changeTheme(mode: string) {
    setTheme(mode);
    document.documentElement.dataset.theme = mode;
    localStorage.setItem('theme_mode', mode);
  }

  function saveConsent() {
    setConsent(false);
    localStorage.setItem('ely-consent-v1', JSON.stringify({version: '1.0', timestamp: new Date().toISOString(), necessary: true}));
    cookies.current?.close();
  }

  return (
    <>
      <a className="skip-link" href="#main">
        {t('Saltar para o conteúdo', 'Skip to content')}
      </a>

      {!ready && (
        <div className="preloader v3-preloader" aria-label={t('A carregar 3VET Saúde Animal', 'Loading 3VET')}>
          {/* eslint-disable-next-line @next/next/no-img-element -- logótipo completo calcado do cartel */}
          <img src={url('/images/3vet/3vet-lockup.svg')} alt="3VET Saúde Animal" width={180} height={192} />
          <i />
        </div>
      )}

      <div className="v3-topbar" data-slide={bannerSlide}>
        <span className={`v3-status ${bizStatus.state}`} suppressHydrationWarning>
          <i />
          {bizStatus.text}
        </span>
        <span className="v3-topbar-urg">
          <strong>+ {t('URGÊNCIAS 24H', '24H EMERGENCIES')}</strong>
          {TEAM.map((v, index) => (
            <a key={v.id} className={bannerSlide === index + 1 ? 'is-active' : ''} href={`tel:${v.raw}`} title={en ? v.en : v.name}>
              {v.display}
            </a>
          ))}
        </span>
      </div>

      <div className="v3-header-wrap">
        <header className="v3-header">
          <a className="v3-brand" href={home} aria-label={BRAND}>
            <Wordmark height={42} />
          </a>

          <nav className={menu ? 'v3-nav open' : 'v3-nav'} aria-label={t('Menu principal', 'Main navigation')}>
            {nav.map(([path, pt, english]) => (
              <a key={path} onClick={() => setMenu(false)} href={prefix + path}>
                {t(pt, english)}
              </a>
            ))}
          </nav>

          <div className="v3-header-actions">
            <a className="v3-lang" href={other} aria-label={t('English version', 'Versão em português')}>
              {en ? 'PT' : 'EN'}
            </a>
            <a className="v3-btn v3-btn-primary" href={url(session ? '/portal' : '/crm')} aria-label={session ? t('Conta', 'Account') : t('Marcar consulta', 'Book a visit')}>
              {session ? <UserRound size={16} /> : <CalendarDays size={16} />}
              <span>{session ? t('Conta', 'Account') : t('Marcar consulta', 'Book a visit')}</span>
            </a>
            <button
              className="v3-menu-button"
              aria-label={menu ? t('Fechar menu', 'Close menu') : t('Abrir menu', 'Open menu')}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>
      </div>

      {children}

      <footer className="v3-footer">
        <div className="v3-footer-grid">
          <div className="v3-footer-brand">
            {/* eslint-disable-next-line @next/next/no-img-element -- logótipo calcado */}
            <img src={url('/images/3vet/3vet-lockup.svg')} alt="3VET Saúde Animal" width={150} height={160} />
            <p>{t('Três veterinários em Macedo de Cavaleiros e Mirandela. Cães, gatos e animais da quinta.', 'Three vets in Macedo de Cavaleiros and Mirandela. Dogs, cats and farm animals.')}</p>
            <div className="v3-social">
              <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Instagram 3VET"><Instagram size={18} /></a>
              <a href={FACEBOOK} target="_blank" rel="noopener noreferrer" aria-label="Facebook 3VET"><Facebook size={18} /></a>
            </div>
          </div>

          <div>
            <h3>{t('Urgências 24 h', '24 h emergencies')}</h3>
            {TEAM.map((v) => (
              <a key={v.id} className="v3-footer-line" href={`tel:${v.raw}`} style={{'--c': v.color} as React.CSSProperties}>
                <strong>{v.display}</strong>
                <small>{en ? v.en : v.name}</small>
              </a>
            ))}
          </div>

          {SEDES.map((s) => (
            <div key={s.id}>
              <h3>{s.id === 'macedo' ? 'Macedo de Cavaleiros' : 'Mirandela'}</h3>
              <span className="v3-footer-strong">{s.name}</span>
              <span>{en ? s.en : s.address}</span>
              <span className="v3-footer-hours">{en ? s.enHours : s.hours}</span>
              <a href={s.map} target="_blank" rel="noopener noreferrer" className="v3-footer-map">
                <MapPin size={14} /> {t('Ver no mapa', 'View on map')}
              </a>
            </div>
          ))}

          <div>
            <h3>{t('Plataforma', 'Platform')}</h3>
            <a href={url('/crm')}>{t('Marcar consulta', 'Book a visit')}</a>
            <a href={url('/portal')}>{t('Área do tutor', 'Client area')}</a>
            <a href={prefix + '/orientador'}>{t('Orientador de sintomas', 'Symptom guide')}</a>
            <a href={prefix + '/diagnostico'}>{t('Check-up de cuidados', 'Care check-up')}</a>
            <a href={url('/crm')}>{t('CRM da equipa (demo)', 'Team CRM (demo)')}</a>
          </div>
        </div>

        <div className="v3-footer-location">
          <div className="v3-footer-location-heading">
            <span><MapPin size={16} /> {t('Visite a 3VET', 'Visit 3VET')}</span>
            <a href={SEDES.find(s => s.id === 'mirandela')?.map} target="_blank" rel="noopener noreferrer">{t('Como chegar', 'Directions')} ↗</a>
          </div>
          <iframe src={MAP_EMBED} loading="lazy" title={t('Mapa da clínica 3VET em Mirandela', '3VET clinic map in Mirandela')} />
        </div>

        <div className="v3-footer-bottom">
          <span>© {new Date().getFullYear()} 3VET Saúde Animal</span>
          <div>
            <a href={url('/privacidad')}>{t('Privacidade', 'Privacy')}</a>
            <button type="button" onClick={() => cookies.current?.showModal()}>Cookies</button>
            <button type="button" className="v3-version" onClick={() => settings.current?.showModal()}>
              {version} <Settings size={12} />
            </button>
          </div>
          <a href="https://elysiumdr.eu/" target="_blank" rel="noopener noreferrer">
            {t('Desenvolvido por Elysium λ Development & Research.', 'Developed by Elysium λ Development & Research.')}
          </a>
        </div>
      </footer>

      <div inert={dockHidden} aria-hidden={dockHidden} className={'magic-wrap' + (hasMascot ? ' has-mascot' : '') + (dockHidden ? ' is-concealed' : '')}>
        <div className="magic-dock">
          <DockMascot en={en} onPresenceChange={setHasMascot} />
          <a href={url('/crm')} aria-label="Marcar consulta">
            <CalendarDays size={19} />
          </a>
          <span />
          <button type="button" aria-label="Contacto rápido" aria-expanded={magic} onClick={() => setMagic(!magic)}>
            {magic ? <X size={20} /> : <MessageCircle size={20} />}
          </button>
          <span />
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <Phone size={18} />
          </a>
        </div>
        {magic && (
          <div className="magic-menu">
            {TEAM.map((v) => (
              <a key={v.id} href={`tel:${v.raw}`}>
                <Phone size={16} /> {v.display} · {v.name}
              </a>
            ))}
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={16} /> WhatsApp 3VET
            </a>
            <a href={url('/portal')}>
              <LockKeyhole size={16} /> Área Privada do Tutor
            </a>
          </div>
        )}
      </div>

      {consent && (
        <aside className="cookie-banner" aria-label="Cookies">
          <ShieldCheck size={22} />
          <div>
            <strong>{t('Privacidade (RGPD e Lei n.º 58/2019).', 'Privacy (GDPR).')}</strong>
            <p>{t('Utilizamos apenas armazenamento técnico essencial para preferências locais e agendamento clínico.', 'We only use essential technical storage for local preferences and clinical booking.')}</p>
          </div>
          <button type="button" onClick={() => cookies.current?.showModal()}>{t('Detalhes', 'Details')}</button>
          <button type="button" className="v3-btn v3-btn-primary v3-btn-sm" onClick={saveConsent}>{t('Aceitar essenciais', 'Accept essential')}</button>
        </aside>
      )}

      {/* Native modal <dialog> without redundant role="dialog"/aria-modal (modern-web-guidance: dialog) */}
      <dialog ref={settings} closedby="any" className="modal" aria-labelledby="settings-title">
        <button type="button" className="modal-close icon-button" onClick={() => settings.current?.close()} aria-label="Fechar">
          <X />
        </button>
        <span className="eyebrow">3VET · SISTEMA</span>
        <h2 id="settings-title">{t('Preferências do Utilizador', 'User Preferences')}</h2>
        <div className="setting">
          <span>{t('Aspeto visual', 'Appearance')}</span>
          <button type="button" className="button outline small" onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Sun size={17} /> : <Moon size={17} />} {theme === 'light' ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        </div>
        <div className="setting">
          <span>Fuso horário oficial</span>
          <strong>Europe/Lisbon (Mirandela, PT)</strong>
        </div>
        <button
          type="button"
          className="button outline full"
          onClick={async () => {
            if (install.current) await install.current.prompt();
            else setMessage('No navegador móvel, selecione «Adicionar ao ecrã principal» para instalar a PWA da 3VET.');
          }}
        >
          <Download size={17} /> Instalar App 3VET (PWA)
        </button>
        {message && <p role="status">{message}</p>}
      </dialog>

      <dialog ref={cookies} closedby="any" className="modal" aria-labelledby="cookies-title">
        <button type="button" className="modal-close icon-button" onClick={() => cookies.current?.close()} aria-label="Fechar">
          <X />
        </button>
        <h2 id="cookies-title">{t('Política de Cookies & RGPD', 'Cookies & GDPR Policy')}</h2>
        <p>Em cumprimento do Regulamento Geral sobre a Proteção de Dados (UE) 2016/679 e da Lei n.º 58/2019 (CNPD), este portal não utiliza cookies publicitários de terceiros.</p>
        <button type="button" className="button full" onClick={saveConsent}>{t('Guardar preferências', 'Save preferences')}</button>
      </dialog>
    </>
  );
}
