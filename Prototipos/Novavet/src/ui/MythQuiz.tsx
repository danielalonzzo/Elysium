'use client';
import {useState} from 'react';
import {Check, RotateCcw, Sparkles, X} from 'lucide-react';
import {PawBurst, playSound} from './fx';

const MYTHS_EN = [
  {q: 'If my dog’s nose is dry, it has a fever.', a: 'Nose moisture changes throughout the day and says nothing about temperature. The only reliable measurement is with a clinical thermometer at the practice.'},
  {q: 'One dog year equals seven human years.', a: 'The first two years advance much faster, and subsequent aging depends heavily on breed size. Try the age calculator on this page.'},
  {q: 'Grapes and raisins can damage a dog’s kidneys.', a: 'They can cause acute kidney injury, and no quantity is considered safe. If ingested, call the practice immediately.'},
  {q: 'If my cat never goes outdoors, it does not need veterinary care.', a: 'Cats are masters at masking discomfort. An annual clinical check-up catches dental, weight and kidney issues early.'},
  {q: 'Household paracetamol (acetaminophen) is lethal for cats.', a: 'It is highly toxic to felines even in tiny fractions of a dose. Never administer human medicines without veterinary direction.'},
  {q: 'Cow’s milk is healthy for adult cats.', a: 'Most adult felines are lactose intolerant; milk frequently triggers gastrointestinal upset. Clean fresh water is all they need.'},
];

const UI = {
  pt: {
    eyebrow: 'TESTE OS SEUS CONHECIMENTOS',
    title: 'Mito ou ',
    titleEm: 'verdade?',
    score: 'Acertou em {s} de {t}!',
    progress: '{n} de {t} respondidas',
    myth: 'Mito',
    truth: 'Verdade',
    right: 'Correto! ',
    wrong: 'Não é bem assim. ',
    isTrue: 'É verdade.',
    isMyth: 'É um mito.',
    perfect: 'Pontuação máxima! O seu animal está em excelentes mãos.',
    good: 'Muito bem! Cada facto esclarecido evita preocupações e sustos desnecessários.',
    ok: 'Agora já sabe a resposta correta, e a informação rigorosa também é saúde animal.',
    again: 'Jogar novamente',
    open: '«',
    close: '»',
  },
  en: {
    eyebrow: 'PUT YOUR KNOWLEDGE TO THE TEST',
    title: 'Myth or ',
    titleEm: 'truth?',
    score: 'You got {s} out of {t}!',
    progress: '{n} of {t} answered',
    myth: 'Myth',
    truth: 'Truth',
    right: 'Correct! ',
    wrong: 'Not quite. ',
    isTrue: 'It’s true.',
    isMyth: 'It’s a myth.',
    perfect: 'Perfect score! Your animal is in good hands.',
    good: 'Well done! Every fact you know is one less scare.',
    ok: 'Now you know, and good information is part of preventive care too.',
    again: 'Play again',
    open: '“',
    close: '”',
  },
};

const MYTHS_PT = [
  {q: 'Se o focinho do cão estiver seco, significa que tem febre.', truth: false, a: 'A humidade do focinho varia naturalmente ao longo do dia. A única forma rigorosa de avaliar a temperatura é com termómetro clínico no consultório.'},
  {q: 'Um ano de vida de um cão equivale sempre a sete anos humanos.', truth: false, a: 'O desenvolvimento biológico nos dois primeiros anos é muito mais rápido e difere conforme o porte do animal. Experimente a calculadora de idade nesta página.'},
  {q: 'Uvas e passas podem causar insuficiência renal grave em cães.', truth: true, a: 'Podem originar lesão renal aguda severa e não se conhece dose segura. Em caso de ingestão, contacte de imediato a Novavet.'},
  {q: 'Um gato que viva exclusivamente dentro de casa não necessita de consultas.', truth: false, a: 'Os gatos dissimulam o mal-estar com grande facilidade. A consulta anual previne patologias dentárias, renais e ajusta as desparasitações.'},
  {q: 'O paracetamol de uso humano caseiro é altamente tóxico para gatos.', truth: true, a: 'É extremamente tóxico para felinos, mesmo em doses residuais. Nunca administre medicação humana sem estrita indicação veterinária.'},
  {q: 'O leite de vaca é recomendado para gatos adultos.', truth: false, a: 'A maioria dos gatos adultos não tolera a lactose, desenvolvendo cólicas e diarreia. O animal necessita apenas de água fresca e limpa.'},
];

export default function MythQuiz({en = false}: {en?: boolean}) {
  const u = en ? UI.en : UI.pt;
  const myths = en ? MYTHS_EN : MYTHS_PT;
  const [answers, setAnswers] = useState<(boolean | null)[]>(myths.map(() => null));
  const answered = answers.filter(a => a !== null).length;
  const score = answers.filter((a, i) => a !== null && a === MYTHS_PT[i].truth).length;
  const done = answered === myths.length;

  function answer(i: number, value: boolean) {
    if (answers[i] !== null) return;
    playSound(value === MYTHS_PT[i].truth ? 'click-en-boton' : 'toque-al-vacio');
    if (answers.filter(a => a === null).length === 1) setTimeout(() => playSound('enviado-con-exito'), 350);
    setAnswers(prev => prev.map((a, j) => j === i && a === null ? value : a));
  }

  return (
    <section className="myths section" id="mitos">
      <div className="myths-head">
        <div>
          <span className="eyebrow"><Sparkles size={14}/>{u.eyebrow}</span>
          <h2>{u.title}<em>{u.titleEm}</em></h2>
        </div>
        <div className="myths-score" aria-live="polite">
          <div className="myths-dots" aria-hidden="true">
            {answers.map((a, i) => (
              <i key={i} className={a === null ? '' : a === MYTHS_PT[i].truth ? 'ok' : 'ko'}/>
            ))}
          </div>
          <span>
            {(done ? u.score : u.progress)
              .replace('{s}', String(score))
              .replace('{n}', String(answered))
              .replace('{t}', String(myths.length))}
          </span>
        </div>
      </div>

      <div className="myths-grid">
        {myths.map((m, i) => {
          const a = answers[i];
          const flipped = a !== null;
          const isTruthExpected = MYTHS_PT[i].truth;
          const right = a === isTruthExpected;

          return (
            <article key={i} className={'myth-card' + (flipped ? ' flipped' : '')} style={{'--i': i} as React.CSSProperties}>
              <div className="myth-inner">
                <div className="myth-face myth-front" aria-hidden={flipped}>
                  <span className="myth-n">0{i + 1}</span>
                  <p>{u.open}{m.q}{u.close}</p>
                  <div className="myth-buttons">
                    <button type="button" tabIndex={flipped ? -1 : 0} onClick={() => answer(i, false)}>
                      {u.myth}
                    </button>
                    <button type="button" tabIndex={flipped ? -1 : 0} onClick={() => answer(i, true)}>
                      {u.truth}
                    </button>
                  </div>
                </div>

                <div className={'myth-face myth-back ' + (isTruthExpected ? 'is-true' : 'is-false')} aria-hidden={!flipped}>
                  <span className="myth-verdict">
                    {right ? <Check size={16}/> : <X size={16}/>}
                    {right ? u.right : u.wrong}
                    {isTruthExpected ? u.isTrue : u.isMyth}
                  </span>
                  <p>{m.a}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {done && (
        <div className="myths-done">
          {score === myths.length && <PawBurst/>}
          <p>{score === myths.length ? u.perfect : score >= 4 ? u.good : u.ok}</p>
          <button type="button" className="guide-reset" onClick={() => setAnswers(myths.map(() => null))}>
            <RotateCcw size={16}/>{u.again}
          </button>
        </div>
      )}
    </section>
  );
}
