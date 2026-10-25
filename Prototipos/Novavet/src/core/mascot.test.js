import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MASCOT_NEEDS,
  MASCOT_TRICKS,
  RAMPAGE_TAPS,
  STREAK_GAP,
  STREAK_HINT_FROM,
  TOP_REACH,
  TRAVEL_CLIPS,
  createDirector,
  createTapStreak,
  flattenLaps,
  homeStep,
  isOnTop,
  mascotHiddenInPortal,
  mascotHiddenOnPath,
  needsHome,
  nextTrick,
  pickNeed,
  pillShape,
  travelDistance,
  trickSteps,
  wearsChonete,
  wearsHalloweenCostume,
  wrap,
} from './mascot.js';
import { DEFAULT_SEASONAL_CONFIG, SEASONAL_THEMES } from './seasonalEffects.js';

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

test('el director reparte necesidades con enfriamiento y sin repetir', () => {
  const steps = run(createDirector({ random: seeded(5) }), 2000);
  const needs = steps.filter((step) => MASCOT_NEEDS.includes(step.clip));
  assert.ok(needs.length > 10);
  for (let i = 1; i < needs.length; i += 1) {
    assert.notEqual(needs[i].clip, needs[i - 1].clip);
    assert.ok(needs[i].now - needs[i - 1].now >= 22, `necesidad a los ${needs[i].now - needs[i - 1].now} s de la anterior`);
  }
});

// La dock de escritorio: 233 × 62 px.
const pill = pillShape(233, 62);

test('la pastilla: dos tramos rectos y dos semicírculos', () => {
  assert.equal(pill.r, 31);
  assert.equal(pill.a, 85.5);
  assert.ok(Math.abs(pill.length - (4 * 85.5 + 2 * Math.PI * 31)) < 1e-9);
  assert.equal(pillShape(40, 60).a, 0, 'una pastilla más alta que ancha es un círculo');
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

test('dormir, comer y las necesidades piden estar arriba; viajar y los trucos no', () => {
  for (const clip of ['sleep', 'eat', 'drink', 'pee', 'poop', 'scratch', 'sit', 'idle', 'wave']) {
    assert.ok(needsHome({ clip }), clip);
  }
  TRAVEL_CLIPS.forEach((clip) => assert.ok(!needsHome({ clip, laps: 1 }), clip));
  assert.ok(!needsHome({ clip: 'roll', trick: true }));
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

test('duerme la siesta de vez en cuando, y a veces después de comer', () => {
  const steps = run(createDirector({ random: seeded(12) }), 4000);
  const naps = steps.filter((step) => step.clip === 'sleep');
  assert.ok(naps.length > 5);
  const afterMeal = steps.some((step, i) => step.clip === 'sleep' && steps[i - 2]?.clip === 'eat');
  assert.ok(afterMeal, 'alguna siesta llega con la panza llena');
});

test('hacer caca termina rascando y haciendo desaparecer la caca', () => {
  const director = createDirector({ random: seeded(1) });
  let steps = [];
  for (let now = 6; now < 5000 && !steps.some((step) => step.clip === 'poop'); now += 40) {
    steps = director.nextBeat(now);
  }
  const poop = steps.findIndex((step) => step.clip === 'poop');
  assert.ok(poop >= 0, 'la rutina de caca aparece');
  assert.deepEqual(
    { clip: steps[poop + 1].clip, vanish: steps[poop + 1].vanish, prop: steps[poop + 1].prop },
    { clip: 'scratch', vanish: true, prop: 'poop' },
  );
});

test('un toque interrumpe cualquier rutina, incluida una necesidad', () => {
  const director = createDirector({ random: seeded(9) });
  for (const clip of ['walk', 'idle', 'sit', 'eat', 'pee', 'poop', 'scratch']) {
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

test('con movimiento reducido el perrito sigue ahí, pero quieto y sin necesidades', () => {
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

const septiembre = new Date('2026-09-18T18:00:00Z');
const octubre = new Date('2026-10-02T18:00:00Z');

test('en el Mes Patrio lleva chonete, y fuera de septiembre no', () => {
  assert.equal(wearsChonete(DEFAULT_SEASONAL_CONFIG, septiembre), true);
  assert.equal(wearsChonete(DEFAULT_SEASONAL_CONFIG, octubre), false);
  assert.equal(wearsChonete(DEFAULT_SEASONAL_CONFIG, new Date('2026-08-31T18:00:00Z')), false);
});

test('el chonete sigue al interruptor del logo y a la temporada del CRM', () => {
  const sinChonete = { ...DEFAULT_SEASONAL_CONFIG, features: { ...DEFAULT_SEASONAL_CONFIG.features, logoChonete: false } };
  assert.equal(wearsChonete(sinChonete, septiembre), false);
  assert.equal(wearsChonete({ ...DEFAULT_SEASONAL_CONFIG, enabled: false }, septiembre), false);
  assert.equal(wearsChonete({ ...DEFAULT_SEASONAL_CONFIG, activeTheme: SEASONAL_THEMES.NAVIDAD }, septiembre), false);
  assert.equal(wearsChonete({ ...DEFAULT_SEASONAL_CONFIG, forceAlwaysActive: true }, octubre), true);
  assert.equal(wearsChonete(null, septiembre), false);
});

test('el traje de calabaza se viste solo con Halloween activo', () => {
  const halloween = {
    ...DEFAULT_SEASONAL_CONFIG,
    activeTheme: SEASONAL_THEMES.HALLOWEEN,
    dateRange: { startMonth: 10, startDay: 1, endMonth: 10, endDay: 31 },
  };
  assert.equal(wearsHalloweenCostume(halloween, octubre), true);
  assert.equal(wearsHalloweenCostume(halloween, septiembre), false);
  assert.equal(wearsHalloweenCostume({ ...halloween, features: { ...halloween.features, logoChonete: false } }, octubre), true);
  assert.equal(wearsHalloweenCostume({ ...halloween, enabled: false }, octubre), false);
});

// ── Suelo recto: la línea de la barra lateral y la barra inferior ─────────

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

test('sobre una línea el perrito nunca da la vuelta por debajo, ni al tocarlo', () => {
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

test('la pastilla de la dock conserva sus vueltas', () => {
  const steps = run(createDirector({ random: seeded(11) }));
  assert.ok(steps.some((step) => step.laps), 'en la dock sigue dando la vuelta');
});

test('el perrito no sale en la mensajería ni en los paseos en vivo, y sí en el resto de los paneles', () => {
  ['/crm/mensajes', '/walker/mensajes', '/crm/paseos-en-vivo', '/walker/paseo', '/en/crm/mensajes'].forEach((path) => {
    assert.equal(mascotHiddenOnPath(path), true, `${path} lo oculta`);
  });
  ['/crm', '/crm/agenda', '/crm/clientes', '/crm/respuestas', '/walker', '/walker/agenda', '/walker/historial', '/crm/mensajes-viejos']
    .forEach((path) => {
      assert.equal(mascotHiddenOnPath(path), false, `${path} lo deja`);
    });
});

test('en el portal lo ocultan los mensajes y el seguimiento de un paseo en curso', () => {
  assert.equal(mascotHiddenInPortal('mensajes', false), true);
  assert.equal(mascotHiddenInPortal('mis_citas', true), true);
  // «Mis citas» sin paseo en vivo es una lista como cualquier otra.
  assert.equal(mascotHiddenInPortal('mis_citas', false), false);
  assert.equal(mascotHiddenInPortal('mi_plan', true), false);
  assert.equal(mascotHiddenInPortal('agendar', false), false);
});

test('diez toques seguidos sueltan al perro gigante, con la cuenta a la vista desde el primero', () => {
  assert.equal(STREAK_HINT_FROM, 1);
  const streak = createTapStreak();
  const answers = Array.from({ length: RAMPAGE_TAPS }, (_, i) => streak.tap(i * 0.5));
  assert.deepEqual(
    answers.slice(0, -1).map((answer) => answer.remaining),
    [9, 8, 7, 6, 5, 4, 3, 2, 1],
    'cuenta atrás de lo que falta',
  );
  assert.ok(answers.slice(0, -1).every((answer) => answer.hint && !answer.done));
  const last = answers[answers.length - 1];
  assert.equal(last.done, true);
  assert.equal(last.hint, false, 'al llegar, la cuenta desaparece');
  // Y vuelve a empezar de cero: el undécimo toque es un toque normal.
  assert.equal(streak.tap(RAMPAGE_TAPS * 0.5).count, 1);
});

test('si se deja de tocar, la cuenta vuelve a cero', () => {
  const streak = createTapStreak();
  for (let i = 0; i < 6; i += 1) streak.tap(i * 0.4);
  const late = streak.tap(5 * 0.4 + STREAK_GAP + 0.01);
  assert.equal(late.count, 1);
  assert.equal(late.remaining, RAMPAGE_TAPS - 1, 'la cuenta empieza otra vez desde arriba');
  // Justo en el límite todavía cuenta.
  const edge = createTapStreak();
  edge.tap(0);
  assert.equal(edge.tap(STREAK_GAP).count, 2);
});

test('en la racha el perro se planta de frente pidiendo otro, sin salir corriendo', () => {
  const steps = createDirector({ random: seeded(5) }).cheer();
  assert.equal(steps[0].clip, 'beg');
  assert.equal(steps[0].face, true);
  assert.equal(steps[0].trick, true, 'pide donde está, sin volver antes a casa');
  assert.ok(steps[0].seconds > STREAK_GAP, 'no se cansa de pedir antes de que se acabe el plazo del siguiente toque');
  assert.ok(steps.every((step) => !TRAVEL_CLIPS.includes(step.clip)));
});

test('la racha le quita la energía del primer toque: al acabar no sale corriendo', () => {
  // Con el mismo azar, el que solo recibió el toque sale a la carrera loca y el
  // que además recibió la racha se queda paseando.
  const excited = createDirector({ random: () => 0.1 });
  const calmed = createDirector({ random: () => 0.1 });
  excited.tap(null, false, 0);
  calmed.tap(null, false, 0);
  calmed.cheer();
  assert.equal(excited.nextBeat(1)[0].clip, 'run');
  assert.equal(calmed.nextBeat(1)[0].clip, 'walk');
});
