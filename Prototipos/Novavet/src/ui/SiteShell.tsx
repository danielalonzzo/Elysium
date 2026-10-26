'use client';
import {useEffect, useRef, useState} from 'react';
import {Menu, X, ArrowUpRight, Phone, Mail, MapPin, Sun, Moon, Settings, MessageCircle, CalendarDays, ShieldCheck, Download, ShoppingBag, Clock, Building2, Stethoscope, Compass} from 'lucide-react';
import {BRAND, BRAND_SHORT, TAGLINE, COMPANY_LEGAL_NAME, TECHNICAL_DIRECTOR, DGAV_LICENSE, ADDRESS_STREET, ADDRESS_POSTAL, ADDRESS_CITY, ADDRESS_REGION, FULL_ADDRESS, PHONE, PHONE_RAW, EMAIL, WHATSAPP, MAP, GPS_LAT, GPS_LNG, STATIC_SITE, url, getBusinessStatus, type BusinessStatus} from '../core/config';
import NovavetEmblem from './NovavetEmblem';
import {useCart} from '../core/cart';

export default function SiteShell({children, en = false}: {children: React.ReactNode, en?: boolean}) {
  const [menu, setMenu] = useState(false);
  const [magic, setMagic] = useState(false);
  const [theme, setTheme] = useState('light');
  const [version, setVersion] = useState('');
  const [consent, setConsent] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [bizStatus, setBizStatus] = useState<BusinessStatus>({
    isOpen: false,
    state: 'closed',
    badge: 'Consultório',
    text: 'A calcular horário...',
    next: '09:00',
  });

  const settings = useRef<HTMLDialogElement>(null);
  const cookies = useRef<HTMLDialogElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const install = useRef<any>(null);

  const [cart] = useCart();
  const bag = cart.reduce((n, l) => n + l.qty, 0);

  const prefix = url(en ? '/en' : '');
  const home = url(en ? '/en' : '/');
  const other = url(en ? '/' : '/en');
  const t = (pt: string, english: string) => (en ? english : pt);

  useEffect(() => {
    setVersion(document.querySelector('meta[name="app-version"]')?.getAttribute('content') || 'NOVAVET OS 1.0.0 PT');
    // Modo claro sempre; só muda se a pessoa escolher o escuro nas preferências.
    const value = localStorage.getItem('theme_mode') === 'dark' ? 'dark' : 'light';
    setTheme(value);
    document.documentElement.dataset.theme = value;
    setMuted(localStorage.getItem('ely-audio-muted') !== '0');
    setConsent(!localStorage.getItem('ely-consent-v1'));

    // Actualiza o estado do consultório em tempo real (Europe/Lisbon)
    const updateStatus = () => setBizStatus(getBusinessStatus());
    updateStatus();
    const statusInterval = setInterval(updateStatus, 30000);

    const timer = setTimeout(() => setReady(true), 600);
    const onInstall = (e: Event) => {
      e.preventDefault();
      install.current = e;
    };
    window.addEventListener('beforeinstallprompt', onInstall);
    if (!STATIC_SITE && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

    return () => {
      clearTimeout(timer);
      clearInterval(statusInterval);
      window.removeEventListener('beforeinstallprompt', onInstall);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenu(false);
        setMagic(false);
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', key);
    };
  }, [menu]);

  const nav = [
    ['/', 'Início', 'Home'],
    ['/#sobre-nos', 'Sobre Nós', 'About Us'],
    ['/#consultorio', 'Consultório', 'Clinic'],
    ['/#areas-negocio', 'Áreas de Negócio', 'Business'],
    ['/#bemed', 'Bemed', 'Bemed'],
    ['/tienda', 'Catálogo', 'Store'],
    ['/#regulatorio', 'Regulação', 'Regulators'],
    ['/#contacto', 'Contactos', 'Contact'],
  ];

  function openSettings() {
    settings.current?.showModal();
  }

  function openCookies() {
    cookies.current?.showModal();
  }

  function saveConsent() {
    setConsent(false);
    localStorage.setItem('ely-consent-v1', 'accepted');
    cookies.current?.close();
  }

  function update() {
    window.location.reload();
  }

  function changeTheme(mode: string) {
    setTheme(mode);
    document.documentElement.dataset.theme = mode;
    localStorage.setItem('theme_mode', mode);
  }

  return (
    <>
      <a className="skip-link" href="#main">
        {t('Saltar para o conteúdo', 'Skip to content')}
      </a>

      {!ready && (
        <div className="preloader" aria-label={t('A carregar Novavet', 'Loading Novavet')}>
          <NovavetEmblem size={68} />
          <span style={{fontWeight: 800, letterSpacing: '-0.02em', marginTop: 12}}>
            {BRAND_SHORT} · <small style={{fontWeight: 500}}>{TAGLINE}</small>
          </span>
          <i />
        </div>
      )}

      {/* Topbar com indicador em tempo real de funcionamento fuso horário Europe/Lisbon */}
      <div className="topbar">
        <div className="topbar-left" style={{display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap'}}>
          <span
            className={`status-pill ${bizStatus.state}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 9px',
              borderRadius: '99px',
              background: bizStatus.isOpen
                ? 'rgba(34, 197, 94, 0.16)'
                : bizStatus.state === 'lunch'
                ? 'rgba(234, 179, 8, 0.18)'
                : 'rgba(239, 68, 68, 0.12)',
              color: bizStatus.isOpen ? '#15803d' : bizStatus.state === 'lunch' ? '#b45309' : '#b91c1c',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: bizStatus.isOpen ? '#22c55e' : bizStatus.state === 'lunch' ? '#eab308' : '#ef4444',
                boxShadow: bizStatus.isOpen ? '0 0 8px #22c55e' : undefined,
              }}
            />
            {bizStatus.text}
          </span>
          <span style={{display: 'inline-flex', alignItems: 'center', gap: 4, opacity: 0.85}}>
            <MapPin size={12} /> {ADDRESS_CITY}, {ADDRESS_REGION}
          </span>
        </div>

        <div className="topbar-right" style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <a href={`tel:${PHONE_RAW}`} style={{display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700}}>
            <Phone size={12} /> {PHONE}
          </a>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" style={{display: 'inline-flex', alignItems: 'center', gap: 4, opacity: 0.9}}>
            <MessageCircle size={12} /> WhatsApp
          </a>
        </div>
      </div>

      <div className="header-wrap">
        <header className="header">
          <a className="brand" href={home} style={{display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0}}>
            <img
              src={url('/images/novavet/logo_novavet_group.png')}
              alt="Novavet Group"
              style={{height: '32px', width: 'auto', objectFit: 'contain', background: 'transparent', border: 'none', padding: 0, boxShadow: 'none'}}
            />
            <span style={{fontSize: '11px', color: '#006570', fontWeight: 800, whiteSpace: 'nowrap', borderLeft: '1.5px solid #c8dbd2', paddingLeft: '9px', lineHeight: 1.2}}>
              Dr. Luís Afonso
            </span>
          </a>

          <nav className={menu ? 'nav open' : 'nav'} aria-label={t('Menu principal', 'Main navigation')}>
            {nav.map(([path, pt, english]) =>
              path === '/tienda' ? (
                <a
                  key={path}
                  className="nav-shop"
                  onClick={() => setMenu(false)}
                  href={prefix + path}
                  aria-label={bag ? t(`Loja, ${bag} produtos no pedido`, `Shop, ${bag} in cart`) : undefined}
                >
                  <ShoppingBag size={14} />
                  {t(pt, english)}
                  {bag > 0 && <b aria-hidden="true">{bag}</b>}
                </a>
              ) : (
                <a key={path} onClick={() => setMenu(false)} href={path === '/' ? home : prefix + path}>
                  {t(pt, english)}
                </a>
              )
            )}
          </nav>

          <div className="header-actions">
            <a className="language" href={other} aria-label={t('Versão em Inglês', 'Portuguese version')}>
              {en ? 'PT' : 'EN'}
            </a>
            <a className="button small header-cta" href={`tel:${PHONE_RAW}`} style={{gap: 6}}>
              <Phone size={14} />
              {t('Contactar', 'Call')}
            </a>
            <button
              className="icon-button menu-button"
              aria-label={menu ? t('Fechar menu', 'Close menu') : t('Abrir menu', 'Open menu')}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>
        {menu && <button className="header-outside" aria-label={t('Fechar menu', 'Close menu')} onClick={() => setMenu(false)} />}
      </div>

      {children}

      <footer className="footer">
        <div className="footer-top">
          <div>
            <span className="eyebrow" style={{color: 'var(--sage-glow)'}}>
              {t('O PARCEIRO CERTO NA SAÚDE ANIMAL', 'THE RIGHT PARTNER IN ANIMAL HEALTH')}
            </span>
            <h2>{t('Tradição clínica e apoio agropecuário em Bragança.', 'Clinical care and agricultural dedication in Bragança.')}</h2>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14}}>
              <a href={`tel:${PHONE_RAW}`} className="footer-phone" style={{color: '#fff', textDecoration: 'none'}}>
                {PHONE} <ArrowUpRight />
              </a>
            </div>
            <p style={{fontSize: '13px', color: '#c3d6cd', marginTop: 12, maxWidth: 440, lineHeight: 1.5}}>
              Atendimento clínico veterinário para animais de companhia e de produção, dispensação autorizada de medicamentos veterinários e suprimento integral para explorações pecuárias em Trás-os-Montes.
            </p>
          </div>

          <div>
            <h3>{t('Consultório', 'The Clinic')}</h3>
            <a href={prefix + '/servicios'}>{t('Consultas & Vacinação', 'Consultations & Vaccines')}</a>
            <a href={prefix + '/servicios'}>{t('Pequenas Cirurgias', 'Minor Surgeries')}</a>
            <a href={prefix + '/servicios'}>{t('Apoio a Explorações Pecuárias', 'Livestock Farm Support')}</a>
            <a href={prefix + '/diagnostico'}>{t('Diagnóstico de Cuidado', 'Care Check-up')}</a>
            <a href={prefix + '/orientador'}>{t('Orientador de Sintomas', 'Symptom Guide')}</a>
          </div>

          <div>
            <h3>{t('Agropecuária & Nutrição', 'Agro-Livestock & Feed')}</h3>
            <a href={prefix + '/tienda'}>{t('Medicamentos Veterinários DGAV', 'DGAV Veterinary Medicines')}</a>
            <a href={prefix + '/tienda'}>{t('Nutrição Clínica & Rações', 'Clinical Nutrition & Feeds')}</a>
            <a href={prefix + '/tienda'}>{t('Suplementação & Minerais', 'Supplements & Minerals')}</a>
            <a href={prefix + '/tienda'}>{t('Higiene & Biossegurança', 'Hygiene & Biosecurity')}</a>
            <a href={prefix + '/contacto'}>{t('Apoio ao Produtor Agrícola', 'Farmer Advisory')}</a>
          </div>

          <div>
            <h3>{t('Localização & Horário', 'Location & Hours')}</h3>
            <span style={{color: '#e5f2eb', fontWeight: 700}}>{ADDRESS_STREET}</span>
            <span>{ADDRESS_POSTAL} {ADDRESS_CITY}</span>
            <small style={{color: '#9db0a7', marginTop: 6}}>
              Segunda a Sexta:<br />
              09:00–12:30 e 14:00–19:00<br />
              (Encerrado ao fim de semana)
            </small>
            <a href={MAP} target="_blank" rel="noopener noreferrer" style={{color: 'var(--sage-glow)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8}}>
              <MapPin size={14} /> {t('Abrir no Google Maps', 'Open in Google Maps')} ↗
            </a>
            <a href={`mailto:${EMAIL}`} style={{color: '#fff', marginTop: 4}}>
              {EMAIL}
            </a>
          </div>
        </div>

        {/* FAIXA REGULATÓRIA DGAV OBRIGATÓRIA */}
        <div
          style={{
            marginTop: 45,
            padding: '20px 24px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 18,
            fontSize: '11px',
            lineHeight: 1.5,
            color: '#c4d7ce',
          }}
        >
          <div>
            <strong style={{display: 'block', color: '#fff', fontSize: '12px', marginBottom: 2}}>
              {COMPANY_LEGAL_NAME}
            </strong>
            <span>{FULL_ADDRESS}</span>
          </div>
          <div>
            <strong style={{display: 'block', color: 'var(--sage-glow)', fontSize: '12px', marginBottom: 2}}>
              Registo DGAV Oficial: {DGAV_LICENSE}
            </strong>
            <span>Classificação: Consultório médico-veterinário (Decreto-Lei nº 184/2009)</span>
          </div>
          <div>
            <strong style={{display: 'block', color: '#fff', fontSize: '12px', marginBottom: 2}}>
              Responsável Técnico:
            </strong>
            <span>{TECHNICAL_DIRECTOR}</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap'}}>
            <span style={{padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800}}>DGAV</span>
            <span style={{padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800}}>DGS</span>
            <span style={{padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800}}>MEDVET</span>
            <span style={{padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800}}>INFARMED</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {BRAND_SHORT} · {COMPANY_LEGAL_NAME} · {DGAV_LICENSE}
          </span>
          <div>
            <a href={url('/privacidad')}>{t('Privacidade e Termos', 'Privacy & Terms')}</a>
            <a href={url('/contacto')}>{t('Livro de Reclamações', 'Complaints Book')}</a>
            <button onClick={openCookies}>{t('Preferências de Cookies', 'Cookie Settings')}</button>
          </div>
          <a href="https://elysiumdr.eu" target="_blank" rel="noopener noreferrer">
            Desenvolvido por Elysium λ
          </a>
        </div>

        <button className="version" onClick={openSettings}>
          <span className="status-dot" style={{background: bizStatus.isOpen ? '#22c55e' : '#eab308'}} />
          {version}
          <Settings size={12} />
        </button>
      </footer>

      {/* Dock flutuante corporativo de contacto e apoio ao cliente */}
      <div className="magic-wrap">
        <div className="magic-dock">
          <a href={`tel:${PHONE_RAW}`} aria-label={t('Ligar para o consultório', 'Call the clinic')}>
            <Phone size={19} />
          </a>
          <span />
          <button aria-label={t('Contacto rápido', 'Quick contact')} aria-expanded={magic} onClick={() => setMagic(!magic)}>
            {magic ? <X size={20} /> : <MessageCircle size={20} />}
          </button>
          <span />
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <MessageCircle size={18} />
          </a>
        </div>

        {magic && (
          <>
            <button className="magic-outside" aria-label={t('Fechar contacto', 'Close contact')} onClick={() => setMagic(false)} />
            <div className="magic-menu">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={18} /> WhatsApp Novavet
              </a>
              <a href={`tel:${PHONE_RAW}`}>
                <Phone size={18} /> {t('Ligar:', 'Call:')} {PHONE}
              </a>
              <a href={`mailto:${EMAIL}`}>
                <Mail size={18} /> {EMAIL}
              </a>
              <a href={MAP} target="_blank" rel="noopener noreferrer">
                <MapPin size={18} /> {t('Como chegar (GPS)', 'Directions (GPS)')}
              </a>
            </div>
          </>
        )}
      </div>

      {consent && (
        <aside className="cookie-banner" aria-label="Cookies">
          <ShieldCheck size={22} />
          <div>
            <strong>{t('A sua privacidade é prioritária.', 'Your privacy comes first.')}</strong>
            <p>
              {t(
                'Utilizamos apenas armazenamento essencial para funcionamento e preferências locais. Sem rastreadores publicitários invasivos.',
                'We only use essential local storage for functionality and preferences. No invasive advertising trackers.'
              )}
            </p>
          </div>
          <button onClick={openCookies}>{t('Preferências', 'Preferences')}</button>
          <button className="button small" onClick={() => saveConsent()}>
            {t('Apenas necessárias', 'Essential only')}
          </button>
        </aside>
      )}

      {/* Modal de Configurações */}
      <dialog ref={settings} className="modal">
        <button className="modal-close icon-button" onClick={() => settings.current?.close()} aria-label="Fechar">
          <X />
        </button>
        <span className="eyebrow">NOVAVET · SISTEMA</span>
        <h2>{t('Preferências do utilizador', 'Make it yours')}</h2>
        <p className="muted">{version}</p>
        <div className="setting">
          <span>{t('Aspeto visual', 'Appearance')}</span>
          <button className="button outline small" onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Sun size={17} /> : <Moon size={17} />} {theme === 'light' ? t('Modo Claro', 'Light') : t('Modo Escuro', 'Dark')}
          </button>
        </div>

        <div className="setting">
          <span>{t('Idioma', 'Language')}</span>
          <a href={other}>{en ? 'Português (Portugal)' : 'English (EN)'} ↗</a>
        </div>
        <div className="setting">
          <span>{t('Fuso horário oficial', 'Official time zone')}</span>
          <strong>Europe/Lisbon (Portugal)</strong>
        </div>
        <div className="setting">
          <span>{t('Horário de funcionamento', 'Operating hours')}</span>
          <small>Seg–Sex: 09:00–12:30 | 14:00–19:00</small>
        </div>
        <button
          className="button outline full"
          onClick={async () => {
            if (install.current) {
              await install.current.prompt();
            } else {
              setMessage(t('No menu do seu navegador, escolha «Instalar aplicação» ou «Adicionar ao ecrã principal».', 'Choose Install or Add to Home Screen from your browser menu.'));
            }
          }}
        >
          <Download size={17} />
          {t('Instalar aplicação Novavet', 'Install Novavet app')}
        </button>
        <button className="text-button" onClick={update}>
          {t('Verificar atualizações e recarregar', 'Refresh application')}
        </button>
        <p role="status">{message}</p>
        <p className="micro">
          {DGAV_LICENSE} · {COMPANY_LEGAL_NAME}
        </p>
      </dialog>

      {/* Modal de Cookies */}
      <dialog ref={cookies} className="modal">
        <button className="modal-close icon-button" onClick={() => cookies.current?.close()} aria-label="Fechar">
          <X />
        </button>
        <h2>{t('Privacidade e Cookies', 'Privacy & cookies')}</h2>
        <p>
          {t(
            'O armazenamento local permite memorizar preferências de visualização, tema e carrinho de encomendas. Os dados não são vendidos nem cedidos a redes publicitárias de terceiros.',
            'Essential storage remembers settings and your order cart. Preferences are stored locally with no third-party tracking.'
          )}
        </p>
        <div className="setting">
          <span>{t('Cookies Essenciais', 'Essential')}</span>
          <strong>{t('Necessárias', 'Required')}</strong>
        </div>
        <div className="setting">
          <span>Marketing & Terceiros</span>
          <strong>{t('Não utilizados', 'Not installed')}</strong>
        </div>
        <button className="button full" onClick={() => saveConsent()}>
          {t('Guardar preferências', 'Save preferences')}
        </button>
      </dialog>
    </>
  );
}
