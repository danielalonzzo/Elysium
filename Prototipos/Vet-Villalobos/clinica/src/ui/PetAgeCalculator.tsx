'use client';
import {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, Cat, Dog, Info} from 'lucide-react';
import {humanAge, lifeStage, STAGES} from '../core/petAge.mjs';

type Species = 'dog' | 'cat';
type Size = 'small' | 'medium' | 'large';

const COPY = {
  es: {
    eyebrow: 'CALCULADORA DE EDAD', title: '¿Cuántos años tiene ', titleEm: 'en años humanos?',
    body: 'Olvide el «multiplicar por siete»: los primeros años cuentan mucho más, y el tamaño también importa. Mueva la barra y descubra en qué etapa está.',
    source: 'Equivalencias aproximadas según las tablas de etapas de vida de la AAHA y la AAFP. Cada mascota es única.',
    species: 'Especie', dog: 'Perro', cat: 'Gato', size: 'Tamaño', sizes: {small: 'Pequeño', medium: 'Mediano', large: 'Grande'},
    real: 'Edad real:', months: 'meses', year: 'año', years: 'años', decimal: ',',
    equals: 'Equivale a unos', human: 'años humanos', myth: 'Con la regla del ×7 serían {n}.', stage: 'Etapa:', cta: 'Hacer su diagnóstico de cuidado',
    stages: {
      baby: {title: 'Primer año', focus: ['Calendario de vacunas y desparasitación', 'Socialización y primeras rutinas', 'Hablar de esterilización con el veterinario']},
      young: {title: 'Adulto joven', focus: ['Revisión anual y vacunas al día', 'Cuidar el peso y la boca desde ya', 'Grooming según su tipo de pelo']},
      adult: {title: 'Adulto', focus: ['Revisión anual completa', 'Atención a la boca: sarro y aliento', 'Peso y alimentación según su actividad']},
      senior: {title: 'Adulto mayor', focus: ['Revisiones más frecuentes, según indique el veterinario', 'Movilidad, articulaciones y comodidad', 'Vigilar apetito, sed y conducta']},
    } as Record<string, {title: string, focus: string[]}>,
  },
  en: {
    eyebrow: 'AGE CALCULATOR', title: 'How old are they ', titleEm: 'in human years?',
    body: 'Forget “multiply by seven”: the first years count for much more, and size matters too. Move the slider and find out which life stage they are in.',
    source: 'Approximate equivalents based on the AAHA and AAFP life stage tables. Every pet is unique.',
    species: 'Species', dog: 'Dog', cat: 'Cat', size: 'Size', sizes: {small: 'Small', medium: 'Medium', large: 'Large'},
    real: 'Real age:', months: 'months', year: 'year', years: 'years', decimal: '.',
    equals: 'Roughly equivalent to', human: 'human years', myth: 'With the ×7 rule it would be {n}.', stage: 'Stage:', cta: 'Take the care check-up',
    stages: {
      baby: {title: 'First year', focus: ['Vaccination and deworming calendar', 'Socialisation and first routines', 'Discuss neutering with the vet']},
      young: {title: 'Young adult', focus: ['Yearly check-up and vaccinations up to date', 'Look after weight and teeth from now on', 'Grooming suited to their coat']},
      adult: {title: 'Adult', focus: ['Full yearly check-up', 'Watch the mouth: tartar and breath', 'Weight and diet to match their activity']},
      senior: {title: 'Senior', focus: ['More frequent check-ups, as the vet advises', 'Mobility, joints and comfort', 'Keep an eye on appetite, thirst and behaviour']},
    } as Record<string, {title: string, focus: string[]}>,
  },
};
const SIZES: [Size, string][] = [['small', '< 10 kg'], ['medium', '10–25 kg'], ['large', '> 25 kg']];

/** Posición del indicador dentro del tramo de su etapa (los tramos se dibujan iguales). */
function segment(stages: {from: number}[], i: number, age: number, max: number) {
  const end = stages[i + 1]?.from ?? max;
  return Math.max(4, Math.min(96, ((age - stages[i].from) / (end - stages[i].from)) * 100));
}

function useCountUp(value: number) {
  const [shown, setShown] = useState(value), from = useRef(value);
  useEffect(() => {
    const start = performance.now(), a = from.current, duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 450;
    let frame = 0;
    const tick = (t: number) => { const k = Math.min(1, (t - start) / duration), e = 1 - Math.pow(1 - k, 3); const v = a + (value - a) * e; setShown(v); from.current = v; if (k < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [value]);
  return Math.round(shown);
}

export default function PetAgeCalculator({en = false}: {en?: boolean}) {
  const c = en ? COPY.en : COPY.es;
  const [species, setSpecies] = useState<Species>('dog'), [size, setSize] = useState<Size>('medium'), [age, setAge] = useState(4);
  const human: number = humanAge(species, age, size), stage: string = lifeStage(species, age, size), shown = useCountUp(human);
  const stages: {id: string, from: number}[] = (STAGES as any)[species === 'dog' && size === 'large' ? 'dogLarge' : species];
  const max = species === 'cat' ? 22 : 18, pin = Math.min(100, (age / max) * 100);
  const years = age < 1 ? `${Math.round(age * 12)} ${c.months}` : `${age % 1 ? age.toFixed(1).replace('.', c.decimal) : age} ${age === 1 ? c.year : c.years}`;
  return <section className="age-calc section" id="edad">
    <div className="age-intro">
      <span className="eyebrow">{c.eyebrow}</span>
      <h2>{c.title}<em>{c.titleEm}</em></h2>
      <p>{c.body}</p>
      <p className="age-source"><Info size={14}/>{c.source}</p>
    </div>
    <div className="age-card">
      <div className="age-toggle" role="radiogroup" aria-label={c.species}>
        {(['dog', 'cat'] as Species[]).map(s => <button type="button" role="radio" aria-checked={species === s} key={s} className={species === s ? 'selected' : ''} onClick={() => { setSpecies(s); setAge(a => Math.min(a, s === 'cat' ? 22 : 18)); }}>{s === 'dog' ? <Dog/> : <Cat/>}{s === 'dog' ? c.dog : c.cat}</button>)}
      </div>
      {species === 'dog' && <div className="age-sizes" role="radiogroup" aria-label={c.size}>{SIZES.map(([id, kg]) => <button type="button" role="radio" aria-checked={size === id} key={id} className={size === id ? 'selected' : ''} onClick={() => setSize(id)}><strong>{c.sizes[id]}</strong><small>{kg}</small></button>)}</div>}
      <label className="age-slider">
        <span>{c.real} <strong>{years}</strong></span>
        <input type="range" min={0.25} max={max} step={0.25} value={age} onChange={e => setAge(+e.target.value)} style={{'--fill': `${pin}%`} as React.CSSProperties}/>
      </label>
      <div className="age-result" aria-live="polite">
        <div className={'age-avatar ' + species + ' ' + stage}>{species === 'dog' ? <Dog/> : <Cat/>}</div>
        <div><span>{c.equals}</span><strong>{shown}</strong><span>{c.human}</span></div>
        <p className="age-myth">{c.myth.replace('{n}', String(Math.round(age * 7)))}</p>
      </div>
      <div className="age-track" aria-hidden="true">
        {stages.map((s, i) => <span key={s.id} className={s.id === stage ? 'on' : ''}>{c.stages[s.id].title}{s.id === stage && <i style={{left: `${segment(stages, i, age, max)}%`}}/>}</span>)}
      </div>
      <div className="age-stage" key={stage}>
        <strong>{c.stage} {c.stages[stage].title}</strong>
        <ul>{c.stages[stage].focus.map(f => <li key={f}>{f}</li>)}</ul>
        <a className="text-link" href="#diagnostico">{c.cta}<ArrowUpRight size={16}/></a>
      </div>
    </div>
  </section>;
}
