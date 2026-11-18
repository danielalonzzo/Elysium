/**
 * Diagnóstico de cuidado: las preguntas «de dolor» de la clínica.
 *
 * Es la adaptación del diagnóstico de rutina de Pura Vida Pets. Allí se pregunta
 * por los paseos; aquí, por lo que hace difícil cuidar la salud de una mascota:
 * cuándo fue la última revisión, qué complica ir a consulta, qué se ha notado en
 * casa y qué tranquilidad busca la familia.
 *
 * Este módulo guarda el esquema y el motor de recomendación, sin textos: los
 * identificadores son el dato que llega a la clínica y no se traducen. Las
 * etiquetas viven en `src/content/careDiagnostic.ts`.
 *
 * El motor es determinista (mismas respuestas, misma recomendación) y prudente:
 * no diagnostica. Si se notó algo, la recomendación es una valoración; las
 * señales de urgencia son cosa del orientador de síntomas, no de esto.
 */

export const DIAGNOSTIC_VERSION = '2026-10-15';

export const SECTIONS = Object.freeze([
  {id: 'pet', questions: [
    {id: 'species', type: 'single', options: ['dog', 'cat', 'other']},
    {id: 'lifeStage', type: 'single', options: ['baby', 'young', 'adult', 'senior', 'unsure']},
  ]},
  {id: 'care', card: 'prevention', questions: [
    {id: 'lastVisit', type: 'single', options: ['under6', 'under12', 'over12', 'onlySick', 'never']},
    {id: 'vaccines', type: 'single', options: ['current', 'pending', 'notCurrent', 'unsure']},
  ]},
  {id: 'obstacles', card: 'stress', questions: [
    {id: 'obstacles', type: 'multi', exclusive: ['none'], other: 'other',
      options: ['time', 'stress', 'cost', 'forget', 'transport', 'trust', 'onlyWhenSick', 'none', 'other']},
  ]},
  {id: 'signs', card: 'dental', questions: [
    {id: 'signs', type: 'multi', exclusive: ['nothing', 'unsure'],
      options: ['itch', 'breath', 'weight', 'coat', 'appetite', 'energy', 'mobility', 'behavior', 'nothing', 'unsure']},
  ]},
  {id: 'peace', questions: [
    {id: 'peace', type: 'scale', min: 1, max: 10},
    {id: 'improve', type: 'single', options: ['upToDate', 'checkup', 'discomfort', 'skin', 'travel', 'aging', 'keep']},
  ]},
  {id: 'values', questions: [
    {id: 'values', type: 'multi', options: ['clear', 'gentle', 'reminders', 'prices', 'fast', 'oneplace', 'followup']},
    {id: 'feeling', type: 'multi', optional: true, exclusive: ['calm'],
      options: ['missSomething', 'guilt', 'overwhelmed', 'calm']},
  ]},
]);

export const QUESTIONS = Object.freeze(Object.fromEntries(SECTIONS.flatMap(s => s.questions.map(q => [q.id, q]))));

/** Alterna una opción de selección múltiple respetando las excluyentes. */
export function toggleMulti(question, current = [], option) {
  const exclusive = question.exclusive || [];
  if (current.includes(option)) return current.filter(x => x !== option);
  if (exclusive.includes(option)) return [option];
  return [...current.filter(x => !exclusive.includes(x)), option];
}

export function isAnswered(question, value) {
  if (question.optional) return true;
  if (question.type === 'multi') return Array.isArray(value) && value.length > 0;
  if (question.type === 'scale') return Number.isInteger(value) && value >= question.min && value <= question.max;
  return typeof value === 'string' && question.options.includes(value);
}

export function sectionComplete(section, answers) {
  return section.questions.every(q => isAnswered(q, answers[q.id]));
}

/** Señales que piden que un veterinario mire a la mascota, no solo un baño. */
const CLINICAL_SIGNS = ['breath', 'weight', 'appetite', 'energy', 'mobility', 'behavior'];
const SKIN_SIGNS = ['itch', 'coat'];

/**
 * La recomendación: un tipo principal, los puntos que se destacan según lo que
 * complica las visitas y la frecuencia de revisión orientativa.
 */
export function recommend(answers) {
  const signs = answers.signs || [];
  const obstacles = answers.obstacles || [];
  const clinical = signs.filter(s => CLINICAL_SIGNS.includes(s));
  const skin = signs.filter(s => SKIN_SIGNS.includes(s));
  const behind = ['over12', 'onlySick', 'never'].includes(answers.lastVisit)
    || ['pending', 'notCurrent', 'unsure'].includes(answers.vaccines);
  const senior = answers.lifeStage === 'senior';

  let kind = 'keep';
  if (clinical.length) kind = 'assessment';
  else if (skin.length) kind = 'skin';
  else if (behind) kind = 'upToDate';
  else if (answers.lifeStage === 'baby') kind = 'firstYear';
  else if (senior || answers.improve === 'aging') kind = 'senior';
  else if (answers.improve === 'travel') kind = 'travel';
  else if (answers.improve === 'skin') kind = 'skin';
  else if (answers.improve === 'checkup' || answers.improve === 'upToDate') kind = 'upToDate';

  // Qué se suma a la recomendación principal sin cambiarla.
  const extras = [];
  if (kind !== 'upToDate' && behind) extras.push('upToDate');
  if (kind !== 'skin' && skin.length) extras.push('skin');
  if (kind !== 'senior' && senior) extras.push('senior');
  if (kind !== 'travel' && answers.improve === 'travel') extras.push('travel');

  const tips = ['time', 'stress', 'cost', 'forget', 'transport', 'trust', 'onlyWhenSick'].filter(o => obstacles.includes(o));

  return {
    kind,
    extras,
    tips,
    clinical,
    frequency: senior ? 'semiannual' : 'annual',
    priority: clinical.length >= 2 || (clinical.length && senior) ? 'soon' : 'normal',
  };
}
