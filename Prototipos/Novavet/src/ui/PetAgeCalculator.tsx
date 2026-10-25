'use client';
import {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, Cat, Dog, Info} from 'lucide-react';
import {humanAge, lifeStage, STAGES} from '../core/petAge.mjs';

type Species = 'dog' | 'cat';
type Size = 'small' | 'medium' | 'large';

const COPY = {
  pt: {
    eyebrow: 'CALCULADORA DE IDADE',
    title: 'Quantos anos tem ',
    titleEm: 'em anos humanos?',
    body: 'Esqueça a regra clássica de «multiplicar por sete»: os primeiros anos avançam muito mais depressa, e o porte do animal é determinante. Deslize a barra para descobrir em que fase de vida se encontra.',
    source: 'Equivalências aproximadas calculadas segundo as diretrizes clínicas da AAHA e AAFP. Cada animal tem o seu próprio ritmo biológico.',
    species: 'Espécie',
    dog: 'Cão',
    cat: 'Gato',
    size: 'Porte',
    sizes: {small: 'Pequeno (< 10 kg)', medium: 'Médio (10–25 kg)', large: 'Grande (> 25 kg)'},
    real: 'Idade cronológica:',
    months: 'meses',
    year: 'ano',
    years: 'anos',
    decimal: ',',
    equals: 'Equivale aproximadamente a',
    human: 'anos humanos',
    myth: 'Pela regra antiga do ×7 seriam {n} anos.',
    stage: 'Fase de vida:',
    cta: 'Avaliar os cuidados do animal',
    stages: {
      baby: {title: 'Primeiro Ano', focus: ['Plano de vacinas e desparasitação seriada', 'Socialização e primeiras rotinas sanitárias', 'Aconselhamento sobre esterilização com o Dr. Luís Afonso']},
      young: {title: 'Jovem Adulto', focus: ['Consulta anual e vacinas em dia', 'Controlo de peso e higiene oral desde cedo', 'Nutrição animal adequada ao nível de exercício']},
      adult: {title: 'Adulto', focus: ['Check-up clínico anual completo', 'Atenção redobrada à boca: tártaro e gengivites', 'Alimentação equilibrada e proteção antiparasitária contínua']},
      senior: {title: 'Sénior / Idoso', focus: ['Acompanhamento clínico mais frequente no consultório', 'Mobilidade, articulações e conforto', 'Vigilância apertada do apetite, ingestão de água e comportamento']},
    } as Record<string, {title: string, focus: string[]}>,
  },
  en: {
    eyebrow: 'AGE CALCULATOR',
    title: 'How old are they ',
    titleEm: 'in human years?',
    body: 'Forget “multiply by seven”: the first years count for much more, and size matters too. Move the slider and find out which life stage they are in.',
    source: 'Approximate equivalents based on AAHA and AAFP life stage tables. Every pet is unique.',
    species: 'Species',
    dog: 'Dog',
    cat: 'Cat',
    size: 'Size',
    sizes: {small: 'Small (< 10 kg)', medium: 'Medium (10–25 kg)', large: 'Large (> 25 kg)'},
    real: 'Real age:',
    months: 'months',
    year: 'year',
    years: 'years',
    decimal: '.',
    equals: 'Roughly equivalent to',
    human: 'human years',
    myth: 'With the ×7 rule it would be {n} years.',
    stage: 'Stage:',
    cta: 'Take the care check-up',
    stages: {
      baby: {title: 'First year', focus: ['Vaccination and deworming schedule', 'Socialization and initial routines', 'Discuss neutering with the vet']},
      young: {title: 'Young adult', focus: ['Yearly check-up and vaccinations up to date', 'Look after weight and teeth early on', 'Nutrition tailored to activity level']},
      adult: {title: 'Adult', focus: ['Full yearly clinical check-up', 'Watch the mouth: tartar and breath', 'Balanced diet and continuous parasite protection']},
      senior: {title: 'Senior', focus: ['More frequent check-ups at the clinic', 'Mobility, joints and comfort', 'Keep an eye on appetite, thirst and behaviour']},
    } as Record<string, {title: string, focus: string[]}>,
  },
};
const SIZES: [Size, string][] = [['small', '< 10 kg'], ['medium', '10–25 kg'], ['large', '> 25 kg']];

function segment(stages: {from: number}[], i: number, age: number, max: number) {
  const end = stages[i + 1]?.from ?? max;
  return Math.max(4, Math.min(96, ((age - stages[i].from) / (end - stages[i].from)) * 100));
}

function useCountUp(value: number) {
  const [shown, setShown] = useState(value), from = useRef(value);
  useEffect(() => {
    const start = performance.now(), a = from.current, duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 450;
    let frame = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration), e = 1 - Math.pow(1 - k, 3);
      const v = a + (value - a) * e;
      setShown(v);
      from.current = v;
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return Math.round(shown);
}

export default function PetAgeCalculator({en = false}: {en?: boolean}) {
  const c = en ? COPY.en : COPY.pt;
  const [species, setSpecies] = useState<Species>('dog');
  const [size, setSize] = useState<Size>('medium');
  const [age, setAge] = useState(4);

  const maxAge = species === 'dog' ? 18 : 20;
  const stages = STAGES[species === 'dog' && size === 'large' ? 'dogLarge' : species];
  const currentStage = lifeStage(species, age, size);
  const stageInfo = c.stages[currentStage] || c.stages.adult;
  const human = humanAge(species, age, size);
  const animatedHuman = useCountUp(human);
  const stageIndex = stages.findIndex((s, i) => age >= s.from && (i === stages.length - 1 || age < stages[i + 1].from));

  const ageLabel = age < 1
    ? `${Math.round(age * 12)} ${c.months}`
    : age === 1
      ? `1 ${c.year}`
      : `${String(age).replace('.', c.decimal)} ${c.years}`;

  return (
    <section className="pet-age-section" id="idade">
      <div className="age-card">
        <header className="age-head">
          <span className="eyebrow">{c.eyebrow}</span>
          <h2>{c.title}<em>{c.titleEm}</em></h2>
          <p>{c.body}</p>
        </header>

        <div className="age-controls">
          <div className="age-selector-group">
            <span className="selector-label">{c.species}</span>
            <div className="segmented-control" role="radiogroup" aria-label={c.species}>
              <button
                type="button"
                role="radio"
                aria-checked={species === 'dog'}
                className={species === 'dog' ? 'active' : ''}
                onClick={() => setSpecies('dog')}
              >
                <Dog size={16}/>{c.dog}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={species === 'cat'}
                className={species === 'cat' ? 'active' : ''}
                onClick={() => setSpecies('cat')}
              >
                <Cat size={16}/>{c.cat}
              </button>
            </div>
          </div>

          {species === 'dog' && (
            <div className="age-selector-group">
              <span className="selector-label">{c.size}</span>
              <div className="segmented-control sizes" role="radiogroup" aria-label={c.size}>
                {SIZES.map(([s, label]) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={size === s}
                    className={size === s ? 'active' : ''}
                    onClick={() => setSize(s)}
                  >
                    <span>{c.sizes[s]}</span>
                    <small>{label}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="slider-box">
          <div className="slider-top">
            <span>{c.real}</span>
            <strong>{ageLabel}</strong>
          </div>
          <input
            type="range"
            min="0.25"
            max={maxAge}
            step="0.25"
            value={age}
            onChange={e => setAge(parseFloat(e.target.value))}
            aria-label={c.real}
          />
          <div className="slider-ticks" aria-hidden="true">
            <span>0</span>
            <span>{Math.round(maxAge / 2)}</span>
            <span>{maxAge} {c.years}</span>
          </div>
        </div>

        <div className="stage-timeline" aria-label={c.stage}>
          {stages.map((st, i) => {
            const isActive = i === stageIndex;
            const isPast = i < stageIndex;
            const pct = isActive ? segment(stages, i, age, maxAge) : (isPast ? 100 : 0);
            return (
              <div key={st.id} className={`timeline-seg ${isActive ? 'current' : ''} ${isPast ? 'past' : ''}`}>
                <div className="seg-bar"><span style={{width: `${pct}%`}}/></div>
                <span className="seg-title">{c.stages[st.id]?.title || st.id}</span>
                <small className="seg-from">{st.from === 0 ? '0' : `${st.from} a`}</small>
              </div>
            );
          })}
        </div>

        <div className="age-result">
          <div className="result-metric">
            <span className="result-prefix">{c.equals}</span>
            <div className="result-number">
              <strong>{animatedHuman}</strong>
              <span>{c.human}</span>
            </div>
            <small className="result-myth">{c.myth.replace('{n}', String(Math.round(age * 7)))}</small>
          </div>

          <div className="stage-focus">
            <div className="focus-header">
              <span className="focus-badge">{c.stage} <strong>{stageInfo.title}</strong></span>
            </div>
            <ul>
              {stageInfo.focus.map((f: string, i: number) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <a href="#diagnostico" className="stage-cta">
              {c.cta} <ArrowUpRight size={14}/>
            </a>
          </div>
        </div>

        <footer className="age-foot">
          <Info size={14}/>
          <small>{c.source}</small>
        </footer>
      </div>
    </section>
  );
}
