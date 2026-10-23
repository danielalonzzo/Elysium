import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  MASCOT_NEEDS,
  MASCOT_TRICKS,
  TOP_REACH,
  TRAVEL_CLIPS,
  createDirector,
  flattenLaps,
  homeStep,
  isOnTop,
  needsHome,
  nextTrick,
  pickNeed,
  pillShape,
  travelDistance,
  trickSteps,
  wrap,
} from './mascot.js';

/** Aleatorio reproducible (LCG) para recorrer muchas rutinas sin depender de la suerte. */
function seeded(seed = 7) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Recorre muchas tandas del director y devuelve todos sus pasos, con su instante. */
function run(director, seconds = 3000, every = 4) {
  const steps = [];
  for (let now = 0; now < seconds; now += every) {
    director.nextBeat(now).forEach((step) => steps.push({ ...step, now }));
  }
  return steps;
}

// Las animaciones que graba el script de Blender, leídas de su lista `ACTIONS`.
const BAKED = new Set([...readFileSync(new URL('../../scripts/mascot/build_mascot.py', import.meta.url), 'utf8')
  .matchAll(/^\s+\('(\w+)', \d+, act_\w+,/gm)].map((match) => match[1]));

test('todo lo que el director puede pedir existe en el modelo', () => {
  const asked = new Set([...TRAVEL_CLIPS, ...MASCOT_NEEDS, 'idle', 'sit', 'wave', 'sleep', 'wag']);
  MASCOT_TRICKS.forEach((trick) => trickSteps(trick, seeded(1)).forEach((step) => asked.add(step.clip)));
  const director = createDirector({ random: seeded(6) });
  run(director, 6000).forEach((step) => asked.add(step.clip));
  for (let now = 0; now < 200; now += 2) director.tap({ clip: 'idle' }, false, now).steps.forEach((step) => asked.add(step.clip));
  asked.forEach((clip) => assert.ok(BAKED.has(clip), `el modelo no trae la animación «${clip}»`));
});

test('es un gato: ningún gesto del perro de antes', () => {
  const steps = run(createDirector({ random: seeded(13) }), 8000);
  const clips = new Set(steps.map((step) => step.clip));
  ['pee', 'poop', 'scratch', 'backflip', 'play_dead'].forEach((clip) => {
    assert.ok(!clips.has(clip), `pide «${clip}»`);
    assert.ok(!BAKED.has(clip), `el modelo aún trae «${clip}»`);
  });
  assert.ok(steps.some((step) => step.prop === 'food') && steps.some((step) => step.prop === 'water'));
  assert.ok(steps.every((step) => !step.prop || ['food', 'water'].includes(step.prop)), 'solo usa los dos platos');
});

test('nextTrick nunca repite el truco anterior y los recorre todos', () => {
  const random = seeded(3);
  const seen = new Set();
  let last = null;
  for (let i = 0; i < 300; i += 1) {
    const trick = nextTrick(last, random);
    assert.ok(MASCOT_TRICKS.includes(trick));
    assert.notEqual(trick, last);
    seen.add(trick);
    last = trick;
  }
  assert.equal(seen.size, MASCOT_TRICKS.length);
});

test('pickNeed nunca encadena dos veces la misma necesidad', () => {
  const random = seeded(11);
  let last = null;
  const seen = new Set();
  for (let i = 0; i < 500; i += 1) {
    const need = pickNeed(last, random);
    assert.ok(MASCOT_NEEDS.includes(need));
    assert.notEqual(need, last);
    seen.add(need);
    last = need;
  }
  assert.equal(seen.size, MASCOT_NEEDS.length);
});

test('el director reparte necesidades con enfriamiento', () => {
  const director = createDirector({ random: seeded(5) });
  const starts = [];
  for (let now = 0; now < 2000; now += 4) {
    const steps = director.nextBeat(now);
    if (MASCOT_NEEDS.includes(steps[0].clip)) starts.push({ clip: steps[0].clip, now });
  }
  assert.ok(starts.length > 10);
  for (let i = 1; i < starts.length; i += 1) {
    assert.notEqual(starts[i].clip, starts[i - 1].clip);
    assert.ok(starts[i].now - starts[i - 1].now >= 22, `necesidad a los ${starts[i].now - starts[i - 1].now} s de la anterior`);
  }
});

test('después de comer, a veces se lava la cara y a veces se duerme', () => {
  const steps = run(createDirector({ random: seeded(12) }), 6000);
  const meals = steps.map((step, i) => (step.clip === 'eat' ? steps.slice(i + 1, i + 4).map((s) => s.clip) : null)).filter(Boolean);
  assert.ok(meals.some((after) => after.includes('groom')), 'algún aseo después de comer');
  assert.ok(meals.some((after) => after.includes('sleep')), 'alguna siesta con la panza llena');
  assert.ok(steps.filter((step) => step.clip === 'sleep').length > 5);
});

// El botón de atención directa en escritorio: unos 214 × 52 px.
const pill = pillShape(214, 52);

test('la pastilla: dos tramos rectos y dos semicírculos', () => {
  assert.equal(pill.r, 26);
  assert.equal(pill.a, 81);
  assert.ok(Math.abs(pill.length - (4 * 81 + 2 * Math.PI * 26)) < 1e-9);
  assert.equal(pillShape(52, 52).a, 0, 'el botón del móvil es un círculo');
});

test('isOnTop distingue el tramo de arriba del resto del contorno', () => {
  assert.ok(isOnTop(0, pill));
  assert.ok(isOnTop(pill.a, pill));
  assert.ok(isOnTop(-pill.a, pill));
  assert.ok(isOnTop(pill.length * 3 + 10, pill));
  assert.ok(!isOnTop(pill.a + 5, pill), 'la curva derecha no es arriba');
  assert.ok(!isOnTop(pill.length / 2, pill), 'el centro de abajo no es arriba');
});

test('los viajes por arriba van en línea recta hasta su punto', () => {
  assert.equal(travelDistance(0, { to: 1 }, pill), pill.a);
  assert.equal(travelDistance(20, { to: -0.5 }, pill), -pill.a / 2 - 20);
  assert.equal(travelDistance(pill.length - 10, { to: 0 }, pill), 10, 'a la izquierda del centro, sin dar la vuelta');
  assert.equal(travelDistance(0, { to: 1 }, pill, 12), pill.a - 12, 'respeta el margen de las puntas');
});

test('desde abajo, vuelve arriba por el lado más corto y termina arriba', () => {
  for (const s of [pill.a + 20, pill.length * 0.4, pill.length * 0.6, pill.length - pill.a - 20]) {
    const home = homeStep(s, pill);
    const distance = travelDistance(s, home, pill, 12);
    assert.ok(Math.abs(distance) <= pill.length / 2 + pill.a, `desde ${s.toFixed(0)} recorre ${distance.toFixed(0)}`);
    assert.ok(isOnTop(s + distance, pill), `desde ${s.toFixed(0)} no termina arriba`);
  }
});

test('las vueltas son enteras: todo viaje con vueltas termina donde empezó', () => {
  const steps = run(createDirector({ random: seeded(8) }));
  const laps = steps.filter((step) => step.laps);
  assert.ok(laps.some((step) => step.clip === 'walk'), 'hay paseos de aburrimiento');
  assert.ok(laps.some((step) => step.clip === 'run'), 'hay carreras de energía');
  laps.forEach((step) => {
    assert.ok(Number.isInteger(step.laps) && step.laps !== 0);
    assert.equal(wrap(10 + travelDistance(10, step, pill), pill.length).toFixed(6), (10).toFixed(6));
  });
});

test('los paseos cotidianos se quedan en el tramo de arriba', () => {
  const walks = run(createDirector({ random: seeded(8) })).filter((step) => step.clip === 'walk' && !step.laps);
  assert.ok(walks.length > 20);
  walks.forEach(({ to }) => assert.ok(Math.abs(to) <= TOP_REACH, `paseo hasta ${to}`));
  assert.ok(walks.some(({ to }) => to > 0) && walks.some(({ to }) => to < 0));
});

test('dormir, comer y asearse piden estar arriba; viajar y los trucos no', () => {
  for (const clip of ['sleep', 'eat', 'drink', 'groom', 'sit', 'idle', 'wave']) {
    assert.ok(needsHome({ clip }), clip);
  }
  TRAVEL_CLIPS.forEach((clip) => assert.ok(!needsHome({ clip, laps: 1 }), clip));
  assert.ok(!needsHome({ clip: 'pounce', trick: true }));
});

test('la carrera loca es uno de los trucos: una vuelta corriendo', () => {
  const [first] = trickSteps('zoomies', seeded(2));
  assert.equal(first.clip, 'run');
  assert.equal(Math.abs(first.laps), 1);
  assert.ok(first.trick);
});

test('después de un toque, le entra la energía y sale corriendo', () => {
  let excited = 0;
  let calmBaseline = 0;
  for (let seed = 1; seed <= 200; seed += 1) {
    const director = createDirector({ random: seeded(seed) });
    director.tap({ clip: 'idle' }, false, 100);
    if (director.nextBeat(102).some((step) => step.clip === 'run')) excited += 1;
    const other = createDirector({ random: seeded(seed + 1000) });
    if (other.nextBeat(102).some((step) => step.clip === 'run')) calmBaseline += 1;
  }
  assert.ok(excited > 100, `${excited} de 200 corren tras el toque`);
  assert.ok(calmBaseline < 40, `${calmBaseline} de 200 corren sin motivo`);
});

test('un toque interrumpe cualquier rutina, incluida una necesidad', () => {
  const director = createDirector({ random: seeded(9) });
  for (const clip of ['walk', 'idle', 'sit', 'eat', 'drink', 'groom']) {
    const answer = director.tap({ clip });
    assert.equal(answer.mode, 'interrupt', clip);
    assert.ok(answer.steps[0].trick);
    // La carrera loca se reproduce con el clip de correr.
    assert.ok(MASCOT_TRICKS.includes(answer.steps[0].clip) || answer.steps[0].clip === 'run');
  }
});

test('durante un truco se encola uno más como mucho', () => {
  const director = createDirector({ random: seeded(9) });
  const first = director.tap({ clip: 'idle' });
  const current = first.steps[0];
  const second = director.tap(current, false);
  assert.equal(second.mode, 'queue');
  assert.notEqual(second.steps[0].clip, current.clip);
  assert.equal(director.tap(current, true).mode, 'ignore');
});

test('los saludos espontáneos respetan su enfriamiento y no cortan una necesidad', () => {
  const director = createDirector({ random: seeded(2) });
  assert.ok(director.greet(0).some((step) => step.clip === 'wave'));
  assert.equal(director.maybeGreet(10, { clip: 'idle' }), null);
  assert.equal(director.maybeGreet(40, { clip: 'eat' }), null);
  assert.ok(director.maybeGreet(40, { clip: 'walk' }));
});

test('con movimiento reducido el gato sigue ahí, pero quieto y sin necesidades', () => {
  const director = createDirector({ random: seeded(4), calm: true });
  const steps = [...director.greet(0), ...run(director)];
  assert.ok(steps.length > 100);
  steps.forEach((step) => assert.ok(['sit', 'sleep'].includes(step.clip), `paso ${step.clip} en modo tranquilo`));
  assert.equal(director.maybeGreet(100, { clip: 'sit' }), null);
});

test('con movimiento reducido, tocarlo responde con un saludo y nunca con un truco', () => {
  const director = createDirector({ random: seeded(4), calm: true });
  const answer = director.tap({ clip: 'sit' });
  assert.equal(answer.mode, 'interrupt');
  assert.equal(answer.steps[0].clip, 'wave');
  assert.equal(director.tap(answer.steps[0]).mode, 'ignore');
});

// ── Suelo recto: el círculo del móvil ─────────────────────────────────────

test('en suelo recto cada vuelta es ir a una punta y volver, con el mismo paso', () => {
  assert.deepEqual(flattenLaps([{ clip: 'run', laps: 1, trick: true }, { clip: 'idle', seconds: 1 }]), [
    { clip: 'run', to: TOP_REACH, trick: true },
    { clip: 'run', to: -TOP_REACH, trick: true },
    { clip: 'idle', seconds: 1 },
  ]);
  const back = flattenLaps([{ clip: 'walk', laps: -2 }]);
  assert.equal(back.length, 4);
  assert.deepEqual(back.map((step) => step.to), [-TOP_REACH, TOP_REACH, -TOP_REACH, TOP_REACH]);
});

test('sobre una línea el gato nunca da la vuelta por debajo, ni al tocarlo', () => {
  const random = seeded(11);
  const director = createDirector({ random, laps: false });
  const steps = run(director);
  for (let now = 0; now < 400; now += 3) {
    steps.push(...director.tap({ clip: 'walk' }, false, now).steps);
  }
  assert.ok(steps.some((step) => step.clip === 'run'), 'sigue corriendo cuando le entra la energía');
  assert.ok(steps.every((step) => !step.laps), 'ningún paso pide una vuelta');
  steps.filter((step) => TRAVEL_CLIPS.includes(step.clip)).forEach((step) => {
    assert.ok(Math.abs(step.to) <= TOP_REACH, `se queda en la línea: ${step.to}`);
  });
});

test('la pastilla del escritorio conserva sus vueltas', () => {
  const steps = run(createDirector({ random: seeded(11) }));
  assert.ok(steps.some((step) => step.laps), 'en el botón sigue dando la vuelta');
});
