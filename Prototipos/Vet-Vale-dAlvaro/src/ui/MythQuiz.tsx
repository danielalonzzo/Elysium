'use client';
import { useState } from 'react';
import { ArrowRight, Check, RotateCcw, Sparkles, X } from 'lucide-react';
import { PawBurst, playSound } from './fx';

const MYTHS_EN = [
  {
    q: 'If my dog’s nose is dry, it has a fever.',
    a: 'Nose moisture changes naturally throughout the day. The only reliable way to check temperature is with a clinical thermometer.',
  },
  {
    q: 'One dog year equals seven human years.',
    a: 'The first two years advance much faster, and ageing depends on size too. Try the age calculator right above.',
  },
  {
    q: 'Grapes and raisins can damage a dog’s kidneys.',
    a: 'They can cause acute kidney injury and no safe dose is known. If ingested, call Clínica Veterinária Vale d’Álvaro immediately.',
  },
  {
    q: 'If my cat never goes outdoors, it does not need veterinary visits.',
    a: 'Cats hide discomfort very well. A yearly check-up catches dental, weight and kidney issues early.',
  },
  {
    q: 'Household paracetamol is lethal for cats.',
    a: 'It is extremely toxic to cats even in tiny doses. Never give human medicines without veterinary guidance.',
  },
  {
    q: 'Cow’s milk is healthy for adult cats.',
    a: 'Most adult cats are lactose intolerant and develop digestive upset. Clean fresh water is all they need.',
  },
];

const MYTHS_PT = [
  {
    q: 'Se o focinho do cão estiver seco, significa que tem febre.',
    truth: false,
    a: 'A humidade do focinho varia naturalmente ao longo do dia. A única forma rigorosa de avaliar a temperatura é com termómetro clínico.',
  },
  {
    q: 'Um ano de vida de um cão equivale sempre a sete anos humanos.',
    truth: false,
    a: 'Os dois primeiros anos avançam muito mais depressa e o envelhecimento varia com o porte. Experimente a calculadora de idade acima.',
  },
  {
    q: 'Uvas e passas podem causar insuficiência renal grave em cães.',
    truth: true,
    a: "Podem originar lesão renal aguda severa e não existe dose segura. Em caso de ingestão, ligue de imediato para a Clínica Vale d'Álvaro.",
  },
  {
    q: 'Um gato que viva apenas dentro de casa não precisa de consultas.',
    truth: false,
    a: 'Os gatos escondem muito bem o desconforto. A consulta anual previne problemas dentários, renais e mantém as desparasitações em dia.',
  },
  {
    q: 'O paracetamol de uso humano é altamente tóxico para gatos.',
    truth: true,
    a: 'É extremamente tóxico para felinos, mesmo em quantidades mínimas. Nunca dê medicação humana sem indicação veterinária.',
  },
  {
    q: 'O leite de vaca é recomendado para gatos adultos.',
    truth: false,
    a: 'A maioria dos gatos adultos não tolera a lactose, podendo ter cólicas e diarreia. Água fresca e limpa é o ideal.',
  },
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
    next: 'Próxima pergunta',
    seeScore: 'Ver resultado',
    perfect: 'Pontuação máxima! O seu animal está em ótimas mãos.',
    good: 'Muito bem! Informação rigorosa evita sustos desnecessários.',
    ok: 'Agora já sabe a resposta certa — cuidar bem também começa por saber.',
    again: 'Jogar novamente',
    open: '«',
    close: '»',
  },
  en: {
    eyebrow: 'TEST YOUR KNOWLEDGE',
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
    next: 'Next question',
    seeScore: 'See result',
    perfect: 'Perfect score! Your pet is in great hands.',
    good: 'Well done! Reliable facts prevent unnecessary scares.',
    ok: 'Now you know — good information is part of everyday care too.',
    again: 'Play again',
    open: '“',
    close: '”',
  },
};

export default function MythQuiz({ en = false }: { en?: boolean }) {
  const u = en ? UI.en : UI.pt;
  const myths = en ? MYTHS_EN : MYTHS_PT;
  const [answers, setAnswers] = useState<(boolean | null)[]>(myths.map(() => null));
  const [current, setCurrent] = useState(0);

  const answered = answers.filter((a) => a !== null).length;
  const score = answers.filter((a, i) => a !== null && a === MYTHS_PT[i].truth).length;
  const done = answered === myths.length;

  function answer(i: number, value: boolean) {
    if (answers[i] !== null) return;
    playSound(value === MYTHS_PT[i].truth ? 'click-en-boton' : 'toque-al-vacio');
    if (answers.filter((a) => a === null).length === 1) {
      window.setTimeout(() => playSound('enviado-con-exito'), 320);
    }
    setAnswers((prev) => prev.map((a, j) => (j === i && a === null ? value : a)));
  }

  return (
    <section className="myths section" id="mitos">
      <div className="myths-head">
        <div>
          <span className="eyebrow">
            <Sparkles size={14} />
            {u.eyebrow}
          </span>
          <h2>
            {u.title}
            <em>{u.titleEm}</em>
          </h2>
        </div>
        <div className="myths-score" aria-live="polite">
          <div className="myths-dots" aria-hidden="true">
            {answers.map((a, i) => (
              <i key={i} className={a === null ? '' : a === MYTHS_PT[i].truth ? 'ok' : 'ko'} />
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

      {current < myths.length ? (
        <div className="myths-grid myths-sequential">
          {myths.map((m, i) => {
            if (i !== current) return null;
            const a = answers[i];
            const flipped = a !== null;
            const isTruthExpected = MYTHS_PT[i].truth;
            const right = a === isTruthExpected;

            return (
              <article key={i} className={'myth-card' + (flipped ? ' flipped' : '')}>
                <div className="myth-inner">
                  <div className="myth-face myth-front" aria-hidden={flipped}>
                    <span className="myth-n">
                      0{i + 1} / 0{myths.length}
                    </span>
                    <p>
                      {u.open}
                      {m.q}
                      {u.close}
                    </p>
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
                      {right ? <Check size={16} /> : <X size={16} />}
                      {right ? u.right : u.wrong}
                      {isTruthExpected ? u.isTrue : u.isMyth}
                    </span>
                    <p>{m.a}</p>
                  </div>
                </div>
              </article>
            );
          })}

          {answers[current] !== null && (
            <div className="myth-next-row">
              <button type="button" className="button small" onClick={() => setCurrent((v) => v + 1)}>
                {current === myths.length - 1 ? u.seeScore : u.next}
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="myths-done">
          {score === myths.length && <PawBurst />}
          <p>{score === myths.length ? u.perfect : score >= 4 ? u.good : u.ok}</p>
          <button
            type="button"
            className="button small outline"
            onClick={() => {
              setAnswers(myths.map(() => null));
              setCurrent(0);
            }}
          >
            <RotateCcw size={15} />
            {u.again}
          </button>
        </div>
      )}
    </section>
  );
}
