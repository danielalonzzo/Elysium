'use client';
import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  Download,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  Navigation,
  Phone,
  Settings,
  ShieldCheck,
  Siren,
  Sun,
  X,
} from 'lucide-react';
import {
  ADDRESS_CITY,
  ADDRESS_POSTAL,
  ADDRESS_STREET,
  BRAND,
  BRAND_SHORT,
  COMPANY_LEGAL_NAME,
  DGAV_LICENSE,
  EMAIL,
  FACEBOOK,
  FACEBOOK_LABEL,
  FULL_ADDRESS,
  HOURS,
  INSTAGRAM,
  INSTAGRAM_HANDLE,
  MAP,
  MOBILE,
  MOBILE_INTL,
  MOBILE_RAW,
  NIF,
  PHONE,
  PHONE_INTL,
  PHONE_RAW,
  STATIC_SITE,
  VIMIOSO_ADDRESS,
  VIMIOSO_NAME,
  WHATSAPP,
  getBusinessStatus,
  url,
  type BusinessStatus,
} from '../core/config';
import { FacebookIcon, InstagramIcon, TileDivider, ValeEmblem, ValeWordmark } from './ValeEmblem';
import DockMascot from './DockMascot';

export default function SiteShell({
  children,
  en = false,
}: {
  children: React.ReactNode;
  en?: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const [magic, setMagic] = useState(false);
  const [dockHidden, setDockHidden] = useState(false);
  const [hasMascot, setHasMascot] = useState(false);
  const [theme, setTheme] = useState('light');
  const [version] = useState('elysiumOS 1 BETA');
  const [consent, setConsent] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [bizStatus, setBizStatus] = useState<BusinessStatus>(() => getBusinessStatus());
  const [accountReady, setAccountReady] = useState(false);

  const settings = useRef<HTMLDialogElement>(null);
  const cookies = useRef<HTMLDialogElement>(null);
  const install = useRef<any>(null);

  const prefix = url(en ? '/en' : '');
  const home = url(en ? '/en' : '/');
  const other = url(en ? '/' : '/en');
  const t = (pt: string, english: string) => (en ? english : pt);

  useEffect(() => {
    const value = localStorage.getItem('theme_mode') === 'dark' ? 'dark' : 'light';
    setTheme(value);
    document.documentElement.dataset.theme = value;
    setConsent(!localStorage.getItem('ely-consent-v1'));

    if (!STATIC_SITE) {
      fetch(url('/api/auth/session'), { credentials: 'same-origin' })
        .then((response) => (response.ok ? response.json() : { authenticated: false }))
        .then((session) => {
          const authenticated = session !== null && typeof session === 'object' && 'authenticated' in session;
          setAccountReady(authenticated && session.authenticated === true);
        })
        .catch(() => setAccountReady(false));
    }

    const updateStatus = () => setBizStatus(getBusinessStatus());
    updateStatus();
    const statusInterval = window.setInterval(updateStatus, 30000);
    const timer = window.setTimeout(() => setReady(true), 420);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      install.current = event;
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e: PointerEvent, dialog: HTMLDialogElement) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog[closedby="any"]')) {
        let pressedOutside = false;
        dialog.addEventListener('pointerdown', (e) => {
          pressedOutside = outside(e, dialog);
        });
        dialog.addEventListener('pointerup', (e) => {
          if (pressedOutside && outside(e, dialog)) dialog.close();
        });
      }
    }

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(statusInterval);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  // Ocultar suavemente a barra flutuante sobre o rodapé, formulários e simuladores para nunca tapar controlos
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        const hidden = visible.size > 0;
        setDockHidden(hidden);
        if (hidden) setMagic(false);
      },
      { threshold: 0.2 }
    );
    document
      .querySelectorAll('.va-footer, .va-contact-section, .contact-form, .pet-age-section, .symptom-guide, .care-diagnostic, .myths')
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [children]);

  const nav: [string, string, string][] = [
    ['/#servicos', 'Serviços', 'Services'],
    ['/#clinica', 'A Clínica', 'Clinic'],
    ['/#ferramentas', 'Simuladores', 'Tools'],
    ['/#contacto', 'Contactos', 'Contact'],
  ];

  function changeTheme(mode: string) {
    setTheme(mode);
    document.documentElement.dataset.theme = mode;
    localStorage.setItem('theme_mode', mode);
  }

  function saveConsent() {
    setConsent(false);
    localStorage.setItem(
      'ely-consent-v1',
      JSON.stringify({ version: '2.1', timestamp: new Date().toISOString(), necessary: true })
    );
    cookies.current?.close();
  }

  return (
    <>
      <a className="skip-link" href="#main">
        {t('Saltar para o conteúdo', 'Skip to content')}
      </a>

      {!ready && (
        <div className="preloader va-preloader" aria-label={t(`A carregar ${BRAND}`, `Loading ${BRAND}`)}>
          <ValeEmblem size={68} />
          <span className="va-preloader-name">{BRAND}</span>
          <small className="va-preloader-city">Bragança · Trás-os-Montes</small>
          <i />
        </div>
      )}

      <div className="va-topbar">
        <div className="va-topbar-inner">
          <div className="va-topbar-left">
            <span className={`va-status ${bizStatus.state}`} suppressHydrationWarning>
              <i aria-hidden="true" />
              <span className="va-status-full" suppressHydrationWarning>
                {en ? bizStatus.enText : bizStatus.text}
              </span>
              <span className="va-status-short" suppressHydrationWarning>
                {en ? bizStatus.shortEnText : bizStatus.shortText}
              </span>
            </span>
            <a className="va-topbar-addr" href={MAP} target="_blank" rel="noopener noreferrer">
              <MapPin size={13} aria-hidden="true" />
              {ADDRESS_STREET} · {ADDRESS_CITY}
            </a>
          </div>
          <div className="va-topbar-right">
            <span className="va-topbar-urg">
              <Siren size={13} aria-hidden="true" />
              {t('Bragança & Vimioso · Urgências sob contacto', 'Bragança & Vimioso · Emergencies by call')}
            </span>
            <a className="va-topbar-phone" href={`tel:${PHONE_RAW}`}>
              <Phone size={13} aria-hidden="true" />
              {PHONE}
            </a>
          </div>
        </div>
      </div>

      <div className="va-header-wrap">
        <header className="va-header">
          <a className="va-brand" href={home} aria-label={BRAND}>
            <ValeWordmark compact />
          </a>

          <nav className={menu ? 'va-nav open' : 'va-nav'} aria-label={t('Menu principal', 'Main navigation')}>
            {nav.map(([path, pt, english]) => (
              <a
                key={path}
                onClick={() => setMenu(false)}
                href={path.startsWith('/#') ? (en ? url('/en') + path.slice(1) : url(path)) : prefix + path}
              >
                {t(pt, english)}
              </a>
            ))}
            <a className="va-nav-extra is-cta" onClick={() => setMenu(false)} href={url('/demo')}>
              <CalendarDays size={15} aria-hidden="true" /> {accountReady ? t('Conta', 'Account') : t('Marcar Consulta', 'Book a Visit')}
            </a>
          </nav>

          <div className="va-header-actions">
            <a className="va-lang" href={other} aria-label={t('English version', 'Versão em Português')}>
              {en ? 'PT' : 'EN'}
            </a>
            <a className="va-btn va-btn-primary va-btn-sm" href={url('/demo')}>
              <CalendarDays size={15} aria-hidden="true" />
              <span>{accountReady ? t('Conta', 'Account') : t('Marcar Consulta', 'Book Visit')}</span>
            </a>
            <button
              type="button"
              className="va-menu-button"
              aria-label={menu ? t('Fechar menu', 'Close menu') : t('Abrir menu', 'Open menu')}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>
      </div>

      {children}

      <footer className="va-footer">
        <TileDivider variant="dark" />
        <div className="va-footer-inner">
          <div className="va-footer-grid">
            <div className="va-footer-brand">
              <ValeWordmark light />
              <p>
                {t(
                  'Clínica Veterinária em Bragança (Rua de Montesinho) e Consultório Veterinário de Vimioso. Pequenos animais, espécies pecuárias e suiniculturas com a calma, o rigor e a proximidade de Trás-os-Montes.',
                  'Veterinary clinic in Bragança (Rua de Montesinho) and Vimioso practice. Companion animals, livestock and swine herd health with the warmth and thoroughness of Trás-os-Montes.'
                )}
              </p>
              <div className="va-social">
                <a
                  href={INSTAGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Instagram ${INSTAGRAM_HANDLE}`}
                  title={`Instagram ${INSTAGRAM_HANDLE}`}
                >
                  <InstagramIcon size={18} />
                </a>
                <a
                  href={FACEBOOK}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Facebook ${FACEBOOK_LABEL}`}
                  title={`Facebook ${FACEBOOK_LABEL}`}
                >
                  <FacebookIcon size={18} />
                </a>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp">
                  <MessageCircle size={18} />
                </a>
                <a
                  href={MAP}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('Abrir no Google Maps', 'Open in Google Maps')}
                  title={t('Abrir no Google Maps', 'Open in Google Maps')}
                >
                  <Navigation size={18} />
                </a>
              </div>
            </div>

            <div>
              <h3>{t('Serviços', 'Services')}</h3>
              <a href={prefix + '/servicios'}>{t('Clínica & Prevenção', 'Consultations & Prevention')}</a>
              <a href={prefix + '/servicios'}>{t('Cirurgia, Análises & Internamento', 'Surgery, Labs & Hospitalization')}</a>
              <a href={prefix + '/servicios'}>{t('Pecuária & Suiniculturas', 'Livestock & Swine Health')}</a>
              <a href={prefix + '/servicios'}>{t('Tosquias, Banhos & Hotel', 'Grooming & Pet Hotel')}</a>
              <a href={prefix + '/orientador'}>{t('Orientador de Sintomas', 'Symptom Guide')}</a>
              <a href={prefix + '/diagnostico'}>{t('Check-up de Cuidados', 'Care Check-up')}</a>
            </div>

            <div>
              <h3>{t('Horário', 'Opening Hours')}</h3>
              <ul className="va-footer-hours">
                {HOURS.map((h) => (
                  <li key={h.days}>
                    <strong>{en ? h.enDays : h.days}</strong>
                    <span>{en && 'enTime' in h ? h.enTime : h.time}</span>
                  </li>
                ))}
              </ul>
              <span className="va-footer-note">
                <Clock3 size={14} aria-hidden="true" />
                {t('Entidade aderente ao Cheque Veterinário OMV.', 'OMV Cheque Veterinário partner clinic.')}
              </span>
            </div>

            <div className="va-footer-contact">
              <h3>{t('Onde Estamos', 'Find Us')}</h3>
              <p className="va-footer-addr">
                <strong>{ADDRESS_STREET}</strong>
                <br />
                {ADDRESS_POSTAL} {ADDRESS_CITY}
                <br />
                <small>{VIMIOSO_NAME} · {VIMIOSO_ADDRESS}</small>
              </p>
              <div className="va-footer-phones">
                <a className="va-footer-phone" href={`tel:${PHONE_RAW}`}>
                  <Phone size={14} aria-hidden="true" />
                  <span>{PHONE_INTL}</span>
                </a>
                <a className="va-footer-phone" href={`tel:${MOBILE_RAW}`}>
                  <Phone size={14} aria-hidden="true" />
                  <span>{MOBILE_INTL}</span>
                </a>
              </div>
              <a className="va-footer-mail" href={`mailto:${EMAIL}`}>
                <Mail size={14} aria-hidden="true" /> {EMAIL}
              </a>
              <a className="va-footer-map" href={MAP} target="_blank" rel="noopener noreferrer">
                <Navigation size={13} aria-hidden="true" /> {t('Abrir no Google Maps', 'Open in Google Maps')}
              </a>
            </div>

            <div>
              <h3>{t('Espaço Digital', 'Online Services')}</h3>
              <a href={url('/demo')}>{accountReady ? t('Conta', 'Account') : t('Marcar Consulta', 'Book Online')}</a>
              <a href={prefix + '/tienda'}>{t('Nutrição & Farmácia', 'Nutrition & Pharmacy')}</a>
            </div>
          </div>

          <div className="va-footer-reg">
            <div>
              <strong>{COMPANY_LEGAL_NAME}</strong>
              <span>NIPC {NIF} · {FULL_ADDRESS}</span>
            </div>
            <div>
              <strong>CAMV · Registo Oficial DGAV {DGAV_LICENSE}</strong>
              <span>
                {t(
                  `Cheque Veterinário OMV · Bragança & ${VIMIOSO_NAME}`,
                  `OMV Voucher Partner · Bragança & ${VIMIOSO_NAME}`
                )}
              </span>
            </div>
            <div>
              <strong>{t('Proteção de Dados & Registo SIAC', 'Data Privacy & SIAC')}</strong>
              <span>RGPD (UE) 2016/679 · Lei n.º 58/2019 (CNPD)</span>
            </div>
          </div>

          <div className="va-footer-bottom">
            <span>
              © {new Date().getFullYear()} {BRAND} · DGAV {DGAV_LICENSE}
            </span>
            <div>
              <a href={url('/privacidad')}>{t('Privacidade & RGPD', 'Privacy & GDPR')}</a>
              <button type="button" onClick={() => cookies.current?.showModal()}>
                {t('Cookies', 'Cookies')}
              </button>
              <button type="button" className="va-version-btn" onClick={() => settings.current?.showModal()}>
                <Settings size={13} aria-hidden="true" />
                {version}
              </button>
            </div>
            <a href="https://elysiumdr.pt" target="_blank" rel="noopener noreferrer">
              {t('Desenvolvido por Elysium λ Development & Research', 'Built by Elysium λ Development & Research')}
            </a>
          </div>
        </div>
      </footer>

      <div
        className={'magic-wrap' + (hasMascot ? ' has-mascot' : '') + (dockHidden ? ' is-concealed' : '')}
        aria-hidden={dockHidden}
      >
        <div className="magic-dock">
          <DockMascot en={en} onPresenceChange={setHasMascot} />
          <a href={url('/demo')} aria-label={accountReady ? t('Conta', 'Account') : t('Marcar consulta', 'Book a visit')} tabIndex={dockHidden ? -1 : 0}>
            <CalendarDays size={19} />
          </a>
          <span aria-hidden="true" />
          <button
            type="button"
            aria-label={t('Contacto rápido', 'Quick contact')}
            aria-expanded={magic}
            tabIndex={dockHidden ? -1 : 0}
            onClick={() => setMagic(!magic)}
          >
            {magic ? <X size={20} /> : <MessageCircle size={20} />}
          </button>
          <span aria-hidden="true" />
          <a href={`tel:${PHONE_RAW}`} aria-label={t(`Ligar ${PHONE}`, `Call ${PHONE}`)} tabIndex={dockHidden ? -1 : 0}>
            <Phone size={18} />
          </a>
        </div>
        {magic && !dockHidden && (
          <>
            <button
              type="button"
              className="magic-outside"
              aria-label={t('Fechar menu rápido', 'Close quick menu')}
              onClick={() => setMagic(false)}
            />
            <div className="magic-menu">
              <a href={`tel:${PHONE_RAW}`}>
                <Phone size={16} /> {PHONE}
              </a>
              <a href={`tel:${MOBILE_RAW}`}>
                <Phone size={16} /> {MOBILE}
              </a>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} /> WhatsApp {BRAND_SHORT}
              </a>
              <a href={MAP} target="_blank" rel="noopener noreferrer">
                <Navigation size={16} /> {t('Como chegar', 'Directions')}
              </a>
              <a href={url('/demo')}>
                <CalendarDays size={16} /> {accountReady ? t('Conta', 'Account') : t('Marcar Consulta', 'Book a visit')}
              </a>
            </div>
          </>
        )}
      </div>

      {consent && (
        <aside className="cookie-banner va-cookie-banner" aria-label="Cookies">
          <ShieldCheck size={22} />
          <div>
            <strong>{t('Privacidade simples e transparente.', 'Simple, transparent privacy.')}</strong>
            <p>
              {t(
                'Guardamos apenas preferências técnicas essenciais (como tema claro/escuro) e os dados que escolher enviar nas marcações.',
                'We only keep essential technical preferences (such as light/dark mode) and the details you choose to send when booking.'
              )}
            </p>
          </div>
          <button type="button" onClick={() => cookies.current?.showModal()}>
            {t('Detalhes', 'Details')}
          </button>
          <button type="button" className="va-btn va-btn-primary va-btn-sm" onClick={saveConsent}>
            {t('Aceitar essenciais', 'Accept essential')}
          </button>
        </aside>
      )}

      <dialog ref={settings} {...({ closedby: 'any' } as any)} className="modal va-modal" aria-labelledby="settings-title">
        <button
          type="button"
          className="modal-close icon-button"
          onClick={() => settings.current?.close()}
          aria-label={t('Fechar', 'Close')}
        >
          <X />
        </button>
        <span className="va-eyebrow">{BRAND_SHORT.toUpperCase()} · BRAGANÇA</span>
        <h2 id="settings-title">{t('Preferências', 'Preferences')}</h2>
        <div className="setting">
          <span>{t('Aspeto visual', 'Appearance')}</span>
          <button
            type="button"
            className="va-btn va-btn-ghost va-btn-sm"
            onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'light' ? t('Modo Claro', 'Light Mode') : t('Modo Escuro', 'Dark Mode')}
          </button>
        </div>
        <div className="setting">
          <span>{t('Hora oficial da clínica', 'Clinic time zone')}</span>
          <strong>Europe/Lisbon ({ADDRESS_CITY}, PT)</strong>
        </div>
        <button
          type="button"
          className="va-btn va-btn-primary va-btn-full"
          onClick={async () => {
            if (install.current) {
              await install.current.prompt();
            } else {
              setMessage(
                t(
                  `No telemóvel, escolha «Adicionar ao ecrã principal» para guardar a app da ${BRAND_SHORT}.`,
                  `On mobile, choose “Add to Home Screen” to install the ${BRAND_SHORT} app.`
                )
              );
            }
          }}
        >
          <Download size={16} /> {t(`Instalar App ${BRAND_SHORT}`, `Install ${BRAND_SHORT} App`)}
        </button>
        {message && (
          <p role="status" className="va-modal-status">
            {message}
          </p>
        )}
      </dialog>

      <dialog ref={cookies} {...({ closedby: 'any' } as any)} className="modal va-modal" aria-labelledby="cookies-title">
        <button
          type="button"
          className="modal-close icon-button"
          onClick={() => cookies.current?.close()}
          aria-label={t('Fechar', 'Close')}
        >
          <X />
        </button>
        <h2 id="cookies-title">{t('Cookies & Privacidade', 'Cookies & Privacy')}</h2>
        <p>
          {t(
            'Este portal cumpre o RGPD (UE) 2016/679 e a Lei n.º 58/2019 (CNPD). Não utilizamos cookies publicitários nem rastreamento comercial de terceiros.',
            'This portal complies with EU GDPR 2016/679 and Portuguese Law 58/2019. We do not use advertising cookies or third-party tracking.'
          )}
        </p>
        <button type="button" className="va-btn va-btn-primary va-btn-full" onClick={saveConsent}>
          {t('Guardar preferências', 'Save preferences')}
        </button>
      </dialog>
    </>
  );
}
