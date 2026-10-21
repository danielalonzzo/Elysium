'use client';
import {createContext, useContext, useMemo, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, BookOpen, CalendarDays, Cat, Check, CheckCircle2, ClipboardList, Dog, HeartPulse, Lightbulb, LoaderCircle, MessageCircle, PawPrint as PawIcon, RotateCcw, Send, Sparkles} from 'lucide-react';
import {SECTIONS, toggleMulti, sectionComplete, recommend} from '../core/careDiagnostic.mjs';
import content from '../content/careDiagnostic';
import {STATIC_SITE, WHATSAPP, url} from '../core/config';
import {PawBurst, playSound} from './fx';

type Answers = Record<string, any>;
type Screen = {type: 'section', index: number} | {type: 'card', id: string};
const SCREENS: Screen[] = SECTIONS.flatMap((s: any, index: number) => [{type: 'section', index} as Screen, ...(s.card ? [{type: 'card', id: s.card} as Screen] : [])]);
const fill = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''));
type Copy = typeof content.es;
// Cada pieza lee sus textos del idioma de la página; lo que llega a la clínica va siempre en español.
const CopyContext = createContext<Copy>(content.es);
const useCopy = () => useContext(CopyContext);
const label = (copy: Copy, q: string, o: string) => copy.questions[q]?.options?.[o] || o;

export default function CareDiagnostic({compact = false, en = false}: {compact?: boolean, en?: boolean}) {
  const copy = en ? content.en : content.es;
  const [stage, setStage] = useState<'intro' | 'questions' | 'result'>('intro');
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [otherText, setOtherText] = useState('');
  const [error, setError] = useState('');
  const [burst, setBurst] = useState(0);
  const top = useRef<HTMLDivElement>(null);

  const current = SCREENS[screen];
  const section: any = current?.type === 'section' ? SECTIONS[current.index] : null;
  const sectionNumber = SCREENS.slice(0, screen + 1).filter(s => s.type === 'section').length;
  const outcome = useMemo(() => stage === 'result' ? recommend(answers) : null, [stage, answers]);

  function scrollTop() {
    const el = top.current; if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 110;
    if (Math.abs(window.scrollY - y) > 160) window.scrollTo({top: y, behavior: 'smooth'});
  }
  function set(id: string, value: any) { setAnswers(a => ({...a, [id]: typeof value === 'function' ? value(a[id]) : value})); setError(''); }
  function next() {
    if (section && !sectionComplete(section, answers)) { setError(copy.missing); playSound('error'); return; }
    if (screen === SCREENS.length - 1) { setStage('result'); setBurst(b => b + 1); playSound('enviado-con-exito'); scrollTop(); return; }
    setScreen(screen + 1); scrollTop();
  }
  function back() { setError(''); if (screen === 0) setStage('intro'); else setScreen(screen - 1); }
  function restart() { setAnswers({}); setOtherText(''); setScreen(0); setStage('intro'); scrollTop(); }

  return <CopyContext.Provider value={copy}><section className={'care-diagnostic' + (compact ? ' compact' : '')} id="diagnostico" ref={top}>
    <div className="diag-shell">
      <div className="diag-bar" aria-hidden="true"/>
      {burst > 0 && stage === 'result' && <PawBurst key={burst}/>}
      {stage === 'intro' && <Intro onStart={() => { setStage('questions'); setScreen(0); }}/>}

      {stage === 'questions' && current && <div className="diag-screen" key={screen}>
        <header className="diag-head">
          <span>{current.type === 'section' ? fill(copy.progress, {n: sectionNumber, total: SECTIONS.length}) : copy.cards[current.id].eyebrow}</span>
          <div className="diag-progress" aria-hidden="true">{SECTIONS.map((_: any, i: number) => <i key={i} className={i < sectionNumber ? 'on' : ''}/>)}</div>
        </header>

        {current.type === 'card' ? <EduCard id={current.id}/> : <>
          <h3 className="diag-section-title">{copy.sections[section.id]}</h3>
          {section.questions.map((q: any) => <Question key={q.id} q={q} value={answers[q.id]} onChange={(v: any) => set(q.id, v)} otherText={otherText} setOtherText={setOtherText} answers={answers}/>)}
        </>}

        {error && <p className="diag-error" role="alert">{error}</p>}
        <footer className="diag-foot">
          <button type="button" className="guide-back" onClick={back}><ArrowLeft size={18}/>{copy.actions.back}</button>
          <button type="button" className="button" onClick={next}>
            {screen === SCREENS.length - 1 ? copy.actions.finish : current.type === 'card' ? copy.actions.keep : copy.actions.next}<ArrowRight size={18}/>
          </button>
        </footer>
      </div>}

      {stage === 'result' && outcome && <Result answers={answers} otherText={otherText} outcome={outcome} onRestart={restart}/>}
    </div>
  </section></CopyContext.Provider>;
}

function Intro({onStart}: {onStart: () => void}) {
  const copy = useCopy();
  return <div className="diag-intro">
    <div className="diag-pets" aria-hidden="true"><span><Dog/></span><span><Cat/></span><span><HeartPulse/></span></div>
    <span className="eyebrow"><ClipboardList size={14}/>{copy.intro.eyebrow}</span>
    <h2>{copy.intro.title}</h2>
    <p>{copy.intro.body}</p>
    <ul className="diag-meta">{copy.intro.meta.map(m => <li key={m}><Check size={14}/>{m}</li>)}</ul>
    <button type="button" className="button diag-start" onClick={onStart}><Sparkles size={18}/>{copy.intro.start}</button>
  </div>;
}

function Question({q, value, onChange, otherText, setOtherText, answers}: any) {
  const copy = useCopy(), text = copy.questions[q.id];
  const fb = feedbackFor(copy, q.id, value, answers);
  return <fieldset className="diag-question">
    <legend>{text.label}{q.optional && <small>{copy.optional}</small>}</legend>
    {q.type === 'multi' && <p className="diag-hint">{copy.multiHint}</p>}
    {q.type === 'scale' ? <Scale q={q} value={value} onChange={onChange} text={text}/> :
      <div className={'diag-options' + (q.id === 'species' ? ' species' : '')}>{q.options.map((o: string) => {
        const selected = q.type === 'multi' ? (value || []).includes(o) : value === o;
        return <button type="button" key={o} aria-pressed={selected} className={selected ? 'selected' : ''}
          onClick={() => onChange(q.type === 'multi' ? (prev: string[]) => toggleMulti(q, prev || [], o) : o)}>
          {q.id === 'species' && (o === 'dog' ? <Dog/> : o === 'cat' ? <Cat/> : <PawIcon/>)}
          <span>{text.options?.[o]}</span>{selected && q.type === 'multi' && <Check size={15}/>}
        </button>;
      })}</div>}
    {q.other && (value || []).includes(q.other) && <input className="diag-other" maxLength={200} value={otherText} onChange={e => setOtherText(e.target.value)} placeholder={copy.otherPlaceholder} aria-label={copy.otherPlaceholder}/>}
    {fb && <p className="diag-feedback" key={fb}><Lightbulb size={16}/>{fb}</p>}
  </fieldset>;
}

function feedbackFor(copy: Copy, id: string, value: any, answers: Answers) {
  const f = copy.feedback;
  if (id === 'lastVisit' && value) return ['over12', 'onlySick', 'never'].includes(value) ? f.lastVisitBehind : value === 'under6' ? f.lastVisitGood : '';
  if (id === 'obstacles' && (value || []).includes('stress')) return f.stress;
  if (id === 'peace' && value) return value <= 4 ? f.peaceLow : value <= 7 ? f.peaceMid : f.peaceHigh;
  if (id === 'feeling' && (value || []).includes('guilt')) return f.guilt;
  void answers; return '';
}

function Scale({q, value, onChange, text}: any) {
  const values = Array.from({length: q.max - q.min + 1}, (_, i) => q.min + i);
  return <div className="diag-scale">
    <div role="radiogroup" aria-label={text.label}>{values.map(n => <button type="button" role="radio" aria-checked={value === n} key={n} className={value === n ? 'selected' : ''} style={{'--hue': `${(n - 1) * 13}`} as React.CSSProperties} onClick={() => onChange(n)}>{n}</button>)}</div>
    <div className="diag-scale-legend"><span>{text.min}</span><span>{text.max}</span></div>
  </div>;
}

function EduCard({id}: {id: string}) {
  const copy = useCopy(), c = copy.cards[id];
  return <article className="diag-card">
    <span className="diag-card-icon"><BookOpen/></span>
    <h3>{c.title}</h3>
    <p>{c.body}</p>
    <blockquote>{c.fact}<cite>{copy.ui.source} {c.source}</cite></blockquote>
    {c.note && <p className="diag-card-note">{c.note}</p>}
  </article>;
}

function summaryLines(copy: Copy, answers: Answers, otherText: string) {
  const label_ = (q: string, o: string) => label(copy, q, o);
  const list = (q: string, values: string[] = []) => values.map(v => v === 'other' && otherText ? `${copy.ui.other}: ${otherText}` : label_(q, v)).join(', ');
  return {
    care: `${label_('lastVisit', answers.lastVisit)} · ${copy.ui.vaccines}: ${copy === content.es ? label_('vaccines', answers.vaccines).toLowerCase() : label_('vaccines', answers.vaccines)}`,
    obstacles: (answers.obstacles || []).includes('none') ? copy.result.noObstacles : list('obstacles', answers.obstacles),
    signs: ['nothing', 'unsure'].some(x => (answers.signs || []).includes(x)) ? label_('signs', answers.signs[0]) : list('signs', answers.signs),
    improve: label_('improve', answers.improve),
  };
}

function messageFor(copy: Copy, answers: Answers, otherText: string, outcome: any) {
  const s = summaryLines(copy, answers, otherText), r = copy.result, es = copy === content.es;
  return [
    es ? 'Diagnóstico de cuidado (web)' : 'Care check-up (website)',
    `${es ? 'Paciente' : 'Patient'}: ${label(copy, 'species', answers.species)} · ${label(copy, 'lifeStage', answers.lifeStage)}`,
    `${r.rows.care}: ${s.care}`,
    `${r.rows.obstacles}: ${s.obstacles}`,
    `${r.rows.signs}: ${s.signs}`,
    `${r.rows.improve}: ${s.improve}`,
    `${copy.ui.peaceToday}: ${answers.peace}/10`,
    answers.values?.length ? `${es ? 'Valora' : 'Values'}: ${answers.values.map((v: string) => label(copy, 'values', v)).join(', ')}` : '',
    `${r.recommendationTitle}: ${r.kinds[outcome.kind].title}`,
  ].filter(Boolean).join('\n').slice(0, 1700);
}

function Result({answers, otherText, outcome, onRestart}: any) {
  const copy = useCopy(), r = copy.result, kind = r.kinds[outcome.kind], s = summaryLines(copy, answers, otherText);
  const wa = WHATSAPP + '?text=' + encodeURIComponent(copy.ui.whatsappIntro + '\n\n' + messageFor(copy, answers, otherText, outcome));
  // El CRM de la clínica está en español: lo que se guarda va siempre en español.
  const message = messageFor(content.es, answers, otherText, outcome);
  return <div className="diag-result">
    <div className="diag-result-head">
      <span className="diag-medal"><PawIcon/></span>
      <span className="eyebrow">{r.eyebrow}</span>
      <h3>{r.title}</h3>
      <p>{fill(r.thanks, {pet: r.pets[answers.species] || r.pets.other})}</p>
    </div>
    <div className="diag-result-grid">
      <div>
        <h4>{r.identified}</h4>
        <dl className="diag-summary">{(Object.keys(r.rows) as (keyof typeof r.rows)[]).map(k => <div key={k}><dt>{r.rows[k]}</dt><dd>{s[k]}</dd></div>)}</dl>
        <div className="diag-peace" style={{'--peace': answers.peace} as React.CSSProperties}><span>{copy.ui.peaceToday}</span><i><b/></i><strong>{answers.peace}/10</strong></div>
      </div>
      <div>
        <h4>{r.recommendationTitle}</h4>
        <article className={'diag-reco ' + outcome.kind}>
          <span className="diag-badge">{kind.badge}</span>
          <h5>{kind.title}</h5>
          <p>{kind.body}</p>
          {outcome.priority === 'soon' && <p className="diag-soon"><HeartPulse size={16}/>{r.soon}</p>}
          <small>{r.frequency[outcome.frequency as 'annual' | 'semiannual']}</small>
        </article>
        {outcome.extras.length > 0 && <div className="diag-extras"><strong>{r.extrasTitle}</strong>{outcome.extras.map((e: string) => <span key={e}><Check size={14}/>{r.extras[e]}</span>)}</div>}
      </div>
    </div>
    {outcome.tips.length > 0 && <div className="diag-tips"><h4>{r.tipsTitle}</h4><div>{outcome.tips.map((t: string, i: number) => <article key={t} style={{'--i': i} as React.CSSProperties}><Lightbulb size={18}/><strong>{r.tips[t].title}</strong><p>{r.tips[t].body}</p></article>)}</div></div>}
    {/* Sin servidor no hay a dónde enviarlo: queda el botón de WhatsApp de abajo, con el mismo diagnóstico. */}
    {!STATIC_SITE && <SendToClinic answers={answers} message={message}/>}
    <div className="diag-actions">
      <a className="button" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>{r.whatsapp}</a>
      <a className="button outline" href={url('/citas')}><CalendarDays size={18}/>{r.book}</a>
      <button type="button" className="guide-reset" onClick={onRestart}><RotateCcw size={16}/>{r.restart}</button>
    </div>
    <p className="diag-final">{r.finalNote}</p>
  </div>;
}

function SendToClinic({answers, message}: {answers: Answers, message: string}) {
  const copy = useCopy(), ui = copy.ui;
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle'), [note, setNote] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setState('sending'); setNote('');
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch('/api/contact', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({
        name: f.name, phone: f.phone, email: '', topic: 'Diagnóstico de cuidado', petName: f.petName || '',
        species: label(content.es, 'species', answers.species), message, consent: f.consent, website: f.website,
      })});
      const j: any = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || ui.sendError);
      setState('sent'); playSound('enviado-con-exito');
    } catch (err) { setState('error'); setNote(err instanceof Error ? err.message : ui.sendError); playSound('error'); }
  }
  const r = copy.result;
  if (state === 'sent') return <div className="diag-send sent" role="status"><CheckCircle2/><p>{r.sent}</p></div>;
  return <form className="diag-send" onSubmit={submit}>
    <div><h4>{r.sendTitle}</h4><p>{r.sendBody}</p></div>
    <div className="diag-send-fields">
      <input name="name" required maxLength={100} autoComplete="name" placeholder={ui.name} aria-label={ui.name}/>
      <input name="phone" required maxLength={30} inputMode="tel" autoComplete="tel" placeholder={ui.phone} aria-label={ui.phone}/>
      <input name="petName" maxLength={80} placeholder={ui.petName} aria-label={ui.petNameLabel}/>
      <button className="button" disabled={state === 'sending'}>{state === 'sending' ? <LoaderCircle className="spin" size={18}/> : <Send size={18}/>}{state === 'sending' ? ui.sending : ui.send}</button>
    </div>
    <label className="diag-consent"><input type="checkbox" name="consent" value="yes" required/><span>{ui.consent}</span></label>
    <input className="honey" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
    {note && <p className="form-status error" role="alert">{note}</p>}
  </form>;
}
