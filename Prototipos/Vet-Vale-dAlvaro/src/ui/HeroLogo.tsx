'use client';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { playBark, playSound } from './fx';
import { DGAV_LICENSE } from '../core/config';
import { ValeEmblem } from './ValeEmblem';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener?.('change', onChange);
  return () => mq.removeEventListener?.('change', onChange);
}
const getReducedMotion = () => window.matchMedia(REDUCED_QUERY).matches;
const getServerReducedMotion = () => false;

type Engine = {
  play: (id: string) => void;
  finale: () => void;
  focus: (id: string) => void;
  setPaused: (paused: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  destroy: () => void;
};

const PARTS = [
  {
    id: 'tile',
    pt: 'O Azulejo',
    en: 'The Tile',
    ptTitle: 'Porta aberta em Bragança e Vimioso',
    enTitle: 'Open door in Bragança & Vimioso',
    ptText: `Rua de Montesinho, 1-A (Bragança) e Consultório de Vimioso · CAMV autorizado DGAV ${DGAV_LICENSE}.`,
    enText: `Rua de Montesinho, 1-A (Bragança) & Vimioso clinic · Licensed CAMV DGAV ${DGAV_LICENSE}.`,
  },
  {
    id: 'vale',
    pt: 'O Vale',
    en: 'The Valley',
    ptTitle: 'Cidade e campo de mãos dadas',
    enTitle: 'Town and farm together',
    ptText: 'Clínica e cirurgia de espécies pecuárias e equipa de sanidade e reprodução em suiniculturas por Trás-os-Montes.',
    enText: 'Livestock medicine, surgery and dedicated mobile swine herd-health team across Trás-os-Montes.',
  },
  {
    id: 'dog',
    pt: 'O Cão',
    en: 'The Dog',
    ptTitle: 'Companhia bem cuidada',
    enTitle: 'Cared-for companions',
    ptText: 'Consultas, vacinas, análises sanguíneas, cirurgia, internamento, tosquias, banhos e hotel veterinário.',
    enText: 'Consultations, vaccines, blood tests, surgery, hospitalization, grooming and vet-supervised pet hotel.',
  },
  {
    id: 'cat',
    pt: 'O Gato',
    en: 'The Cat',
    ptTitle: 'Calma e carinho em cada visita',
    enTitle: 'Calm, gentle visits',
    ptText: 'Atendimento tranquilo por médicos e enfermeiros veterinários. Entidade aderente ao Cheque Veterinário OMV.',
    enText: 'Unhurried care by vets and veterinary nurses. Registered OMV Cheque Veterinário partner.',
  },
] as const;

type CardState = {
  id: string;
  kicker: string;
  title: string;
  text: string;
};

export default function HeroLogo({ en = false }: { en?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Engine | null>(null);
  const found = useRef(new Set<string>());
  const celebrated = useRef(false);
  const timers = useRef<number[]>([]);
  const onPick = useRef<(id: string) => void>(() => {});

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion
  );
  const [hover, setHover] = useState('');
  const [woken, setWoken] = useState<string[]>([]);
  const [card, setCard] = useState<CardState | null>(null);
  const [displayCard, setDisplayCard] = useState<CardState | null>(null);

  useEffect(() => {
    if (card) {
      setDisplayCard(card);
    } else {
      const t = setTimeout(() => setDisplayCard(null), 350);
      return () => clearTimeout(t);
    }
  }, [card]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const dismissCard = useCallback(() => {
    clearTimers();
    setCard(null);
  }, [clearTimers]);

  useEffect(() => {
    engine.current?.setReducedMotion(reduced);
  }, [reduced]);

  useEffect(() => {
    let alive = true;
    const initialReduced = window.matchMedia(REDUCED_QUERY).matches;

    (async () => {
      try {
        const { mountHeroLogo } = await import('./heroLogoEngine.js');
        if (!alive || !canvas.current) return;
        const e = await mountHeroLogo(canvas.current, {
          container: rootRef.current,
          onSelect: (id: string) => onPick.current(id),
          onHover: setHover,
          onContextLost: () => {
            if (alive) {
              setReady(false);
              setFailed(true);
            }
          },
          onContextRestored: () => {
            if (alive) {
              setFailed(false);
              setReady(true);
            }
          },
          reducedMotion: initialReduced,
        });
        if (!alive) {
          e.destroy();
          return;
        }
        engine.current = e;
        setReady(true);
      } catch (err) {
        console.warn('mountHeroLogo fallback:', err);
        if (alive) setFailed(true);
      }
    })();

    return () => {
      alive = false;
      clearTimers();
      engine.current?.destroy();
      engine.current = null;
    };
  }, [clearTimers]);

  useEffect(() => {
    if (!card) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissCard();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [card, dismissCard]);

  function wake(id: string) {
    const part = PARTS.find((x) => x.id === id);
    if (!part) return;
    engine.current?.play(id);
    if (id === 'dog') playBark();
    else playSound('click-en-boton');
    found.current.add(id);
    setWoken([...found.current]);
    setCard({
      id: part.id,
      kicker: en ? part.en : part.pt,
      title: en ? part.enTitle : part.ptTitle,
      text: en ? part.enText : part.ptText,
    });
    clearTimers();
    if (found.current.size === 4 && !celebrated.current) {
      celebrated.current = true;
      later(2200, () => {
        engine.current?.finale();
        playSound('enviado-con-exito');
        setCard({
          id: 'finale',
          kicker: en ? 'All four' : 'Os quatro',
          title: en ? "Vale d'Álvaro · Bragança" : "Clínica Vale d'Álvaro",
          text: en
            ? 'Warm, dependable care for pets and farms across Trás-os-Montes.'
            : 'Cuidado próximo e honesto para os animais de Bragança e Trás-os-Montes.',
        });
      });
      later(9500, () => setCard(null));
    } else {
      later(6500, () => setCard(null));
    }
  }

  useEffect(() => {
    onPick.current = wake;
  });

  function togglePause() {
    const next = !paused;
    setPaused(next);
    engine.current?.setPaused(next);
  }

  const hovered = PARTS.find((p) => p.id === hover);
  const kicker = hovered
    ? `${en ? hovered.en : hovered.pt} · ${en ? hovered.enTitle : hovered.ptTitle}`
    : woken.length === 4
      ? en
        ? 'All 4 pieces explored'
        : '4 de 4 peças descobertas'
      : en
        ? 'Touch or pick a piece of the emblem'
        : 'Toque no emblema ou escolha uma peça';

  return (
    <div
      ref={rootRef}
      className={
        'va-emblem-showcase' +
        (ready ? ' is-ready' : '') +
        (failed ? ' is-fallback' : '')
      }
    >
      <div className="va-emblem-top">
        <span className="va-emblem-kicker">{kicker}</span>
        <div className="va-emblem-meta">
          <span className="va-emblem-count" aria-hidden="true">
            {woken.length}/4
          </span>
          {ready && !reduced && (
            <button
              type="button"
              className="va-emblem-pause"
              onClick={togglePause}
              aria-label={
                paused
                  ? en
                    ? 'Play 3D emblem animation'
                    : 'Retomar animação do emblema 3D'
                  : en
                    ? 'Pause 3D emblem animation'
                    : 'Pausar animação do emblema 3D'
              }
            >
              {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>

      <div className="va-emblem-stage">
        <div className="va-emblem-placeholder" aria-hidden={ready && !failed}>
          <ValeEmblem
            size={240}
            className="va-emblem-svg-art"
            decorative={ready && !failed}
            title={
              en
                ? "Clínica Veterinária Vale d'Álvaro emblem"
                : "Emblema da Clínica Veterinária Vale d'Álvaro"
            }
          />
        </div>
        {!failed && <canvas ref={canvas} className="va-emblem-canvas" aria-hidden="true" />}
      </div>

      <div
        className="va-emblem-parts"
        role="group"
        aria-label={en ? 'Interactive emblem pieces' : 'Peças interativas do emblema'}
      >
        {PARTS.map((p) => {
          const isWoken = woken.includes(p.id);
          const isActive = card?.id === p.id;
          return (
            <button
              type="button"
              key={p.id}
              data-part={p.id}
              className={
                'va-emblem-part' +
                (isWoken ? ' is-woken' : '') +
                (isActive ? ' is-active' : '')
              }
              aria-pressed={isActive}
              onClick={() => wake(p.id)}
              onMouseEnter={() => engine.current?.focus(p.id)}
              onMouseLeave={() => engine.current?.focus('')}
              onFocus={() => engine.current?.focus(p.id)}
              onBlur={() => engine.current?.focus('')}
            >
              <i aria-hidden="true" />
              <span>{en ? p.en : p.pt}</span>
            </button>
          );
        })}
      </div>

      <div className={'va-emblem-panel' + (card ? ' is-open' : '')} aria-live="polite">
        <div className="va-emblem-panel-inner">
          {displayCard && (
            <div className="va-emblem-story">
              <div className="va-emblem-story-head">
                <small>{displayCard.kicker}</small>
                <button
                  type="button"
                  className="va-emblem-close"
                  onClick={dismissCard}
                  aria-label={en ? 'Close emblem detail' : 'Fechar detalhe do emblema'}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
              <strong>{displayCard.title}</strong>
              <p>{displayCard.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
