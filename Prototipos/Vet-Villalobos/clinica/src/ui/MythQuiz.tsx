'use client';
import {useState} from 'react';
import {Check, RotateCcw, Sparkles, X} from 'lucide-react';
import {PawBurst, playSound} from './fx';

/**
 * «¿Mito o verdad?»: seis creencias comunes. Cada respuesta voltea la tarjeta y
 * explica por qué. Solo afirmaciones bien establecidas; nada de dosis ni
 * tratamientos caseros.
 */
const MYTHS_EN = [
  {q: 'If my dog’s nose is dry, it has a fever.', a: 'Nose moisture changes throughout the day and says nothing about temperature. The only reliable way is a thermometer, at the clinic.'},
  {q: 'One dog year equals seven human years.', a: 'The first two years count for much more, and after that it depends on size. Try the age calculator on this page.'},
  {q: 'Grapes and raisins can damage a dog’s kidneys.', a: 'They can cause serious kidney injury, and no amount is known to be safe. If your dog ate some, call the clinic even if it looks fine.'},
  {q: 'If my cat never goes outside, it doesn’t need the vet.', a: 'Cats are very good at hiding discomfort. The yearly check-up catches dental, weight or kidney problems in time, and decides which vaccinations they need.'},
  {q: 'Household paracetamol (acetaminophen) is dangerous for cats.', a: 'It is toxic to them even in small doses. Never give human medicines to a pet without veterinary advice.'},
  {q: 'Milk is good for adult cats.', a: 'Many adult cats tolerate lactose poorly and milk can give them diarrhoea. What they need is fresh water, always available.'},
];
const UI = {
  es: {eyebrow: 'PONGA A PRUEBA LO QUE SABE', title: '¿Mito o ', titleEm: 'verdad?', score: '¡Acertó {s} de {t}!', progress: '{n} de {t} respondidas', myth: 'Mito', truth: 'Verdad', right: '¡Correcto! ', wrong: 'Casi. ', isTrue: 'Es verdad.', isMyth: 'Es un mito.', perfect: '¡Puntaje perfecto! Su mascota está en buenas manos.', good: 'Muy bien. Cada dato que conoce es un susto menos.', ok: 'Ahora ya lo sabe, y eso también es cuidarle.', again: 'Jugar otra vez', open: '«', close: '»'},
  en: {eyebrow: 'PUT YOUR KNOWLEDGE TO THE TEST', title: 'Myth or ', titleEm: 'truth?', score: 'You got {s} out of {t}!', progress: '{n} of {t} answered', myth: 'Myth', truth: 'Truth', right: 'Correct! ', wrong: 'Not quite. ', isTrue: 'It’s true.', isMyth: 'It’s a myth.', perfect: 'Perfect score! Your pet is in good hands.', good: 'Well done. Every fact you know is one less scare.', ok: 'Now you know, and that is part of caring for them too.', again: 'Play again', open: '“', close: '”'},
};

const MYTHS = [
  {q: 'Si la nariz de mi perro está seca, tiene fiebre.', truth: false, a: 'La humedad de la nariz cambia a lo largo del día y no sirve para medir la temperatura. La única forma fiable es con termómetro, en consulta.'},
  {q: 'Un año de perro equivale a siete años humanos.', truth: false, a: 'Los primeros dos años cuentan mucho más, y después depende del tamaño. Pruebe la calculadora de edad de esta página.'},
  {q: 'Las uvas y las pasas pueden dañar los riñones de un perro.', truth: true, a: 'Pueden causar una lesión renal grave, y no se sabe qué cantidad es segura. Si comió, llame a la clínica aunque se vea bien.'},
  {q: 'Si mi gato nunca sale de casa, no necesita ir al veterinario.', truth: false, a: 'Los gatos disimulan muy bien el malestar. La revisión anual detecta a tiempo problemas dentales, de peso o de riñón, y define qué vacunas le corresponden.'},
  {q: 'El acetaminofén de la casa es peligroso para los gatos.', truth: true, a: 'Es tóxico para ellos incluso en dosis pequeñas. Nunca dé medicamentos humanos a una mascota sin indicación veterinaria.'},
  {q: 'A los gatos adultos les hace bien tomar leche.', truth: false, a: 'Muchos gatos adultos toleran mal la lactosa y la leche les puede causar diarrea. Lo que necesitan es agua fresca siempre disponible.'},
];

export default function MythQuiz({en = false}: {en?: boolean}) {
  const u = en ? UI.en : UI.es, text = (i: number) => en ? MYTHS_EN[i] : MYTHS[i];
  const [answers, setAnswers] = useState<(boolean | null)[]>(MYTHS.map(() => null));
  const answered = answers.filter(a => a !== null).length;
  const score = answers.filter((a, i) => a !== null && a === MYTHS[i].truth).length;
  const done = answered === MYTHS.length;
  function answer(i: number, value: boolean) {
    if (answers[i] !== null) return;
    playSound(value === MYTHS[i].truth ? 'click-en-boton' : 'toque-al-vacio');
    if (answers.filter(a => a === null).length === 1) setTimeout(() => playSound('enviado-con-exito'), 350);
    setAnswers(prev => prev.map((a, j) => j === i && a === null ? value : a));
  }
  return <section className="myths section" id="mitos">
    <div className="myths-head">
      <div><span className="eyebrow"><Sparkles size={14}/>{u.eyebrow}</span><h2>{u.title}<em>{u.titleEm}</em></h2></div>
      <div className="myths-score" aria-live="polite">
        <div className="myths-dots" aria-hidden="true">{answers.map((a, i) => <i key={i} className={a === null ? '' : a === MYTHS[i].truth ? 'ok' : 'ko'}/>)}</div>
        <span>{(done ? u.score : u.progress).replace('{s}', String(score)).replace('{n}', String(answered)).replace('{t}', String(MYTHS.length))}</span>
      </div>
    </div>
    <div className="myths-grid">{MYTHS.map((m, i) => {
      const a = answers[i], flipped = a !== null, right = a === m.truth;
      return <article key={i} className={'myth-card' + (flipped ? ' flipped' : '')} style={{'--i': i} as React.CSSProperties}>
        <div className="myth-inner">
          <div className="myth-face myth-front" aria-hidden={flipped}>
            <span className="myth-n">0{i + 1}</span>
            <p>{u.open}{text(i).q}{u.close}</p>
            <div className="myth-buttons"><button type="button" tabIndex={flipped ? -1 : 0} onClick={() => answer(i, false)}>{u.myth}</button><button type="button" tabIndex={flipped ? -1 : 0} onClick={() => answer(i, true)}>{u.truth}</button></div>
          </div>
          <div className={'myth-face myth-back ' + (m.truth ? 'is-true' : 'is-false')} aria-hidden={!flipped}>
            <span className="myth-verdict">{right ? <Check size={16}/> : <X size={16}/>}{right ? u.right : u.wrong}{m.truth ? u.isTrue : u.isMyth}</span>
            <p>{text(i).a}</p>
          </div>
        </div>
      </article>;
    })}</div>
    {done && <div className="myths-done">{score === MYTHS.length && <PawBurst/>}<p>{score === MYTHS.length ? u.perfect : score >= 4 ? u.good : u.ok}</p><button type="button" className="guide-reset" onClick={() => setAnswers(MYTHS.map(() => null))}><RotateCcw size={16}/>{u.again}</button></div>}
  </section>;
}
