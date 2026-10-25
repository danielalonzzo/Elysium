'use client';
import {useMemo, useState} from 'react';
import {AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, HeartPulse, MessageCircle, RotateCcw, ShieldAlert, Stethoscope} from 'lucide-react';
import {WHATSAPP, url, PHONE_RAW} from '../core/config';

type Answer = 'yes' | 'no' | 'unsure';

const stepsPt = [
  {id: 'red', title: 'Sinais de alarme', question: 'Apresenta algum sinal que necessita de atenção imediata?', help: 'Dificuldade respiratória acentuada, gengivas azuladas ou muito pálidas, colapso, perda de consciência, convulsão, hemorragia abundante, traumatismo grave ou suspeita de intoxicação.'},
  {id: 'pain', title: 'Dor e mobilidade', question: 'A dor parece intensa ou limita visivelmente os movimentos?', help: 'Gemidos, tremores, postura encurvada, incapacidade de se levantar, claudicação (mancar/não pousar a pata), agressividade ao toque ou inquietação persistente.'},
  {id: 'digestive', title: 'Digestão e abdómen', question: 'Existem vómitos repetidos, diarreia hemorrágica ou abdómen dilatado e doloroso?', help: 'Também se inclui o esforço de vómito improdutivo (tentar vomitar sem conseguir), fraqueza extrema ou incapacidade de reter água.'},
  {id: 'duration', title: 'Alterações persistentes', question: 'As alterações duram há mais de 24 horas ou estão a agravar-se?', help: 'Quebra de apetite, prostração, isolamento, lamber compulsivamente uma zona, padrão de sono alterado, dificuldade em urinar ou alterações invulgares de comportamento.'}
];

const stepsEn = [
  {id: 'red', title: 'Warning signs', question: 'Is there any sign that needs immediate attention?', help: 'Difficulty breathing, blue or very pale gums, collapse, loss of consciousness, seizures, heavy bleeding, serious injury or possible poisoning.'},
  {id: 'pain', title: 'Pain and movement', question: 'Does the pain seem intense or clearly limit movement?', help: 'Crying, trembling, hunched posture, inability to stand, limp, aggression when touched or constant restlessness.'},
  {id: 'digestive', title: 'Digestion and abdomen', question: 'Is there repeated vomiting, bloody diarrhoea or a swollen, painful abdomen?', help: 'This also includes unassisted retching, severe weakness or inability to keep water down.'},
  {id: 'duration', title: 'Lasting changes', question: 'Have changes lasted more than 24 hours or are getting worse?', help: 'Loss of appetite, lethargy, hiding, licking one spot, sleeping differently, difficulty urinating or distinct behavioral changes.'}
];

const UI = {
  pt: {
    yes: 'Sim',
    no: 'Não',
    unsure: 'Não tenho a certeza',
    eyebrow: 'ORIENTADOR DE SINTOMAS',
    title: 'Quando algo muda,',
    titleEm: 'cada sinal conta.',
    intro: 'Responda a quatro perguntas rápidas para orientar o próximo passo. Este resultado atua como triagem de apoio e não substitui a avaliação clínica no consultório.',
    note: 'Nunca administre medicamentos de uso humano ao seu animal. Perante dificuldade respiratória, colapso ou hemorragia grave, procure assistência imediata.',
    question: 'PERGUNTA {n} DE {t}',
    back: 'Anterior',
    next: 'Continuar',
    see: 'Ver orientação',
    result: 'RESULTADO ORIENTATIVO',
    whatsapp: 'Falar no WhatsApp',
    call: 'Ligar para o Consultório',
    book: 'Pedir consulta',
    reset: 'Recomeçar',
    footer: 'Se o quadro se agravar ou tiver dúvidas sobre a urgência, contacte de imediato o Dr. Luís Afonso na Novavet em Bragança.',
    wa: 'Olá, utilizei o orientador de sintomas no site da Novavet e gostaria de esclarecer uma situação sobre o meu animal.',
    emergency: [
      'Atenção Imediata Recomendada',
      'As respostas indicam um ou mais sinais de alarme. Desloque-se sem demora ao serviço de atendimento veterinário de urgência mais próximo. Se for seguro, telefone durante o trajeto.'
    ],
    soon: [
      'Consulta Prioritária Recomendada',
      'Recomenda-se contactar a Novavet hoje mesmo para descrever os sintomas ao Dr. Luís Afonso e coordenar uma observação clínica.'
    ],
    observe: [
      'Vigilância e Acompanhamento',
      'Não foram identificados sinais críticos imediatos nestas respostas. Mantenha o animal sob observação atenta, anote a evolução e marque uma consulta caso o quadro persista.'
    ]
  },
  en: {
    yes: 'Yes',
    no: 'No',
    unsure: 'I’m not sure',
    eyebrow: 'SYMPTOM GUIDE',
    title: 'When something changes,',
    titleEm: 'every sign counts.',
    intro: 'Answer four quick questions to determine the next step. This result serves as initial triage and does not replace in-person veterinary assessment.',
    note: 'Never administer human medications to animals. In case of severe breathing distress, collapse or acute bleeding, seek emergency care immediately.',
    question: 'QUESTION {n} OF {t}',
    back: 'Previous',
    next: 'Continue',
    see: 'See guidance',
    result: 'TRIAGE RESULT',
    whatsapp: 'Chat on WhatsApp',
    call: 'Call the Practice',
    book: 'Book consultation',
    reset: 'Start again',
    footer: 'If the condition worsens or you are concerned, contact Dr. Luís Afonso at Novavet in Bragança immediately.',
    wa: 'Hello, I used the symptom triage guide on the Novavet website and would like to ask about my animal.',
    emergency: [
      'Immediate Attention Needed',
      'Your answers indicate a warning sign. Take your animal immediately to the nearest emergency veterinary facility. If safe, call ahead on the way.'
    ],
    soon: [
      'Priority Consultation Advised',
      'It is advisable to contact Novavet today to describe the changes to Dr. Luís Afonso and schedule a timely clinical assessment.'
    ],
    observe: [
      'Monitor and Follow-Up',
      'No critical danger signs were identified in these answers. Keep your animal under close observation, note changes, and book a visit if symptoms persist.'
    ]
  }
};

export default function SymptomGuide({embedded = false, en = false}: {embedded?: boolean; en?: boolean}) {
  const u = en ? UI.en : UI.pt;
  const steps = en ? stepsEn : stepsPt;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [done, setDone] = useState(false);
  const current = steps[index];

  const result = useMemo(() => {
    if (answers.red === 'yes' || answers.digestive === 'yes') {
      return {tone: 'emergency', icon: ShieldAlert, title: u.emergency[0], text: u.emergency[1]};
    }
    if (answers.red === 'unsure' || answers.pain === 'yes' || answers.duration === 'yes') {
      return {tone: 'soon', icon: HeartPulse, title: u.soon[0], text: u.soon[1]};
    }
    return {tone: 'observe', icon: CheckCircle2, title: u.observe[0], text: u.observe[1]};
  }, [answers, u]);

  const wa = WHATSAPP + '?text=' + encodeURIComponent(u.wa);

  function reset() {
    setAnswers({});
    setIndex(0);
    setDone(false);
  }

  return (
    <section className={'symptom-guide ' + (embedded ? 'embedded' : '')} id="orientador">
      <div className="guide-intro">
        <span className="eyebrow"><Stethoscope size={15}/> {u.eyebrow}</span>
        <h2>{u.title}<br/><em>{u.titleEm}</em></h2>
        <p>{u.intro}</p>
        <div className="guide-note">
          <AlertTriangle size={20}/>
          <span>{u.note}</span>
        </div>
      </div>

      <div className="guide-card">
        {!done ? (
          <>
            <header>
              <span>{u.question.replace('{n}', String(index + 1)).replace('{t}', String(steps.length))}</span>
              <div>
                {steps.map((s, i) => (
                  <i key={s.id} className={i <= index ? 'active' : ''}/>
                ))}
              </div>
            </header>
            <div className="guide-question" key={current.id}>
              <small>{current.title}</small>
              <h3>{current.question}</h3>
              <p>{current.help}</p>
              <div className="answer-grid">
                {([['yes', u.yes], ['no', u.no], ['unsure', u.unsure]] as [Answer, string][]).map(([value, label]) => (
                  <button
                    type="button"
                    className={answers[current.id] === value ? 'selected' : ''}
                    onClick={() => setAnswers({...answers, [current.id]: value})}
                    key={value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <footer>
              <button type="button" className="guide-back" disabled={!index} onClick={() => setIndex(index - 1)}>
                <ArrowLeft size={16}/>{u.back}
              </button>
              <button
                type="button"
                className="button"
                disabled={!answers[current.id]}
                onClick={() => index === steps.length - 1 ? setDone(true) : setIndex(index + 1)}
              >
                {index === steps.length - 1 ? u.see : u.next}
                <ArrowRight size={16}/>
              </button>
            </footer>
          </>
        ) : (
          <div className={'guide-result ' + result.tone}>
            <result.icon size={48}/>
            <span>{u.result}</span>
            <h3>{result.title}</h3>
            <p>{result.text}</p>
            <div className="result-actions">
              <a className="button" href={wa} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={18}/>{u.whatsapp}
              </a>
              <a className="button outline" href={`tel:${PHONE_RAW}`}>
                {u.call}
              </a>
            </div>
            <button className="guide-reset" onClick={reset}>
              <RotateCcw size={15}/>{u.reset}
            </button>
            <small>{u.footer}</small>
          </div>
        )}
      </div>
    </section>
  );
}
