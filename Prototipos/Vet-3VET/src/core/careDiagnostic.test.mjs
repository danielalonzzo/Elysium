import test from 'node:test';
import assert from 'node:assert/strict';
import {SECTIONS, QUESTIONS, toggleMulti, sectionComplete, recommend} from './careDiagnostic.mjs';
import {humanAge, lifeStage} from './petAge.mjs';
import content from '../content/careDiagnostic.ts';

const keys = (o, prefix = '') => Object.entries(o).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? keys(v, prefix + k + '.') : [prefix + k]).sort();

test('español e inglés tienen las mismas claves', () => {
  assert.deepEqual(keys(content.en), keys(content.es));
});

for (const [lang, copy] of Object.entries(content)) test(`cada pregunta y cada opción tienen su texto (${lang})`, () => {
  for (const q of Object.values(QUESTIONS)) {
    assert.ok(copy.questions[q.id]?.label, q.id);
    for (const o of q.options || []) assert.ok(copy.questions[q.id].options?.[o], `${q.id}.${o}`);
  }
  for (const s of SECTIONS) { assert.ok(copy.sections[s.id], s.id); if (s.card) assert.ok(copy.cards[s.card], s.card); }
  for (const k of ['assessment', 'skin', 'upToDate', 'firstYear', 'senior', 'travel', 'keep']) assert.ok(copy.result.kinds[k], k);
});

test('las opciones excluyentes no conviven con las demás', () => {
  const q = QUESTIONS.obstacles;
  assert.deepEqual(toggleMulti(q, ['time', 'cost'], 'none'), ['none']);
  assert.deepEqual(toggleMulti(q, ['none'], 'time'), ['time']);
  assert.deepEqual(toggleMulti(q, ['time'], 'time'), []);
});

test('una sección incompleta no deja avanzar; la pregunta opcional sí', () => {
  const values = SECTIONS.find(s => s.id === 'values');
  assert.equal(sectionComplete(values, {}), false);
  assert.equal(sectionComplete(values, {values: ['clear']}), true);
});

test('el motor recomienda con prudencia', () => {
  const base = {species: 'dog', lifeStage: 'adult', lastVisit: 'under6', vaccines: 'current', obstacles: ['none'], signs: ['nothing'], peace: 8, improve: 'keep', values: ['clear']};
  assert.equal(recommend(base).kind, 'keep');
  assert.equal(recommend({...base, signs: ['breath']}).kind, 'assessment');
  assert.equal(recommend({...base, signs: ['itch']}).kind, 'skin');
  assert.equal(recommend({...base, vaccines: 'unsure'}).kind, 'upToDate');
  assert.equal(recommend({...base, lifeStage: 'senior'}).frequency, 'semiannual');
  const r = recommend({...base, lifeStage: 'senior', signs: ['mobility'], lastVisit: 'never', obstacles: ['stress', 'cost']});
  assert.equal(r.kind, 'assessment');
  assert.equal(r.priority, 'soon');
  assert.deepEqual(r.extras, ['upToDate', 'senior']);
  assert.deepEqual(r.tips, ['stress', 'cost']);
});

test('edad humana y etapa', () => {
  assert.equal(humanAge('dog', 1), 15);
  assert.equal(humanAge('cat', 2), 24);
  assert.equal(humanAge('dog', 10, 'small'), 56);
  assert.equal(lifeStage('dog', 6.5, 'large'), 'senior');
  assert.equal(lifeStage('dog', 6.5, 'small'), 'adult');
  assert.equal(lifeStage('cat', 12), 'senior');
});
