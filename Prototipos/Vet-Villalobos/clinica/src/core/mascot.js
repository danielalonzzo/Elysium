/**
 * La mascota del botón de atención directa: qué hace en cada momento y por
 * dónde anda.
 *
 * Es el gato del panel rojo del logo, hecho Maine Coon gris (lo modela
 * `scripts/mascot/build_mascot.py`). Aquí no hay nada de three.js ni del DOM, a
 * propósito: el motor 3D (`ui/mascotEngine.js`) solo sabe reproducir pasos; lo
 * que decide la rutina vive en este módulo para poder probarlo con `node --test`.
 *
 * El botón es su planeta: puede caminar por todo el contorno de la pastilla con
 * la gravedad hacia ella, pero su casa es el tramo de arriba. Ahí duerme, come,
 * bebe, se asea y se sienta. Solo da la vuelta por debajo en tres casos: cuando
 * le entra la energía y sale corriendo (sobre todo después de que lo toquen),
 * cuando se aburre y pasea alrededor, o en un truco.
 *
 * Un paso es un objeto plano:
 *
 *   { clip: 'walk', to: 0.4 }                 caminar a un punto de arriba (de -1 a 1)
 *   { clip: 'walk', laps: -1 }                una vuelta entera paseando, al revés
 *   { clip: 'run', laps: 2 }                  dos vueltas corriendo
 *   { clip: 'sit', seconds: 5 }               pose en bucle durante un tiempo
 *   { clip: 'eat', seconds: 4, prop: 'food' } necesidad, con su plato
 *   { clip: 'roll', once: true, face: true }  truco: una pasada, de frente
 *
 * Las vueltas son siempre enteras, así que todo viaje termina arriba. Y si algo
 * lo deja abajo (un toque a media carrera), el motor lo trae de vuelta antes
 * de cualquier paso que no sea un viaje o un truco (`needsHome`).
 */

/** Gestos de gato: rodar, acechar y saltar, perseguirse la cola, estirarse, erguirse, brincar y la carrera loca. */
export const MASCOT_TRICKS = Object.freeze(['roll', 'pounce', 'spin', 'stretch', 'beg', 'jump', 'zoomies']);
/** Lo que hace por su cuenta en casa. Asearse ocupa el sitio de las necesidades del perro de antes. */
export const MASCOT_NEEDS = Object.freeze(['eat', 'drink', 'groom']);
export const TRAVEL_CLIPS = Object.freeze(['walk', 'run']);

/** Cuánto duran los trucos que se repiten en bucle; los demás duran su clip. */
const LOOPED_TRICKS = { beg: 2.6 };

/** Segundos mínimos entre dos necesidades, dos saludos espontáneos y dos siestas. */
export const NEED_COOLDOWN = 22;
export const GREET_COOLDOWN = 25;
export const NAP_COOLDOWN = 40;
/** Durante cuánto le dura la energía después de un toque. */
export const EXCITEMENT = 12;
/** Hasta dónde llega por el tramo de arriba, en fracción de su mitad. */
export const TOP_REACH = 0.85;

const between = (random, min, max) => min + random() * (max - min);
const eitherWay = (random) => (random() < 0.5 ? -1 : 1);

// ── La pastilla ────────────────────────────────────────────────────────────
// Se mide en píxeles de perímetro desde el centro del tramo de arriba, en el
// sentido de las agujas del reloj: arriba, curva derecha, abajo, curva izquierda.

/** `a` es medio tramo recto, `r` el radio de las curvas y `length` el perímetro. */
export function pillShape(width, height) {
  const r = height / 2;
  const a = Math.max(0, width / 2 - r);
  return { a, r, length: 4 * a + 2 * Math.PI * r };
}

export const wrap = (s, length) => ((s % length) + length) % length;

export function isOnTop(s, pill) {
  const t = wrap(s, pill.length);
  return t <= pill.a || t >= pill.length - pill.a;
}

/**
 * Cuántos píxeles de perímetro, con signo, tiene que recorrer para cumplir un
 * paso de viaje. `margin` es lo que no pisa de cada punta del tramo de arriba.
 * Si está fuera de arriba, vuelve por el lado más corto.
 */
export function travelDistance(s, step, pill, margin = 0) {
  if (step.laps) return step.laps * pill.length;
  const target = step.to * Math.max(0, pill.a - margin);
  const t = wrap(s, pill.length);
  if (isOnTop(t, pill)) return target - (t > pill.length / 2 ? t - pill.length : t);
  return t < pill.length / 2 ? target - t : pill.length + target - t;
}

/** Todo lo que no sea viajar o un truco se hace arriba. */
export const needsHome = (step) => !step.trick && !TRAVEL_CLIPS.includes(step.clip);

// ── Suelo recto ────────────────────────────────────────────────────────────
// En el móvil el botón es un círculo pequeño: el gato vive sobre una línea, la
// de arriba del círculo, y no le da la vuelta.

/**
 * Cambia cada vuelta por ir hasta una punta y volver, con el mismo paso y el
 * mismo ánimo: `{ clip: 'run', laps: 2 }` son cuatro carreras de punta a
 * punta. El sentido de la vuelta decide hacia qué punta sale primero (el
 * sentido del reloj, por arriba, es hacia la derecha).
 */
export function flattenLaps(steps) {
  return steps.flatMap((step) => {
    if (!step.laps) return [step];
    const { laps, ...rest } = step;
    const first = laps > 0 ? 1 : -1;
    return Array.from({ length: Math.abs(laps) * 2 }, (_, leg) => ({
      ...rest,
      to: (leg % 2 ? -first : first) * TOP_REACH,
    }));
  });
}

/** El paso que lo devuelve arriba por la punta más cercana. */
export function homeStep(s, pill) {
  return { clip: 'walk', to: wrap(s, pill.length) < pill.length / 2 ? 0.7 : -0.7 };
}

// ── Trucos ─────────────────────────────────────────────────────────────────

/** Un truco distinto del anterior, para que tocar dos veces siempre sorprenda. */
export function nextTrick(last = null, random = Math.random) {
  const pool = MASCOT_TRICKS.filter((trick) => trick !== last);
  return pool[Math.floor(random() * pool.length) % pool.length];
}

export function trickSteps(trick, random = Math.random) {
  const after = { clip: 'idle', seconds: 1.4, face: true };
  if (trick === 'zoomies') return [{ clip: 'run', laps: eitherWay(random), trick: true }, after];
  const looped = LOOPED_TRICKS[trick];
  return [
    looped ? { clip: trick, seconds: looped, face: true, trick: true } : { clip: trick, once: true, face: true, trick: true },
    after,
  ];
}

// ── Rutina ─────────────────────────────────────────────────────────────────

function needSteps(need, random) {
  switch (need) {
    case 'eat': {
      const steps = [{ clip: 'eat', seconds: between(random, 3.4, 4.6), prop: 'food' }, { clip: 'idle', seconds: 1.2 }];
      // Después de comer, un gato se lava la cara; y a veces cae una siesta.
      if (random() < 0.45) steps.push({ clip: 'groom', seconds: between(random, 3, 4) });
      if (random() < 0.35) steps.push({ clip: 'sleep', seconds: between(random, 7, 11) });
      return steps;
    }
    case 'drink':
      return [{ clip: 'drink', seconds: between(random, 2.6, 3.4), prop: 'water' }, { clip: 'idle', seconds: 1.2 }];
    case 'groom':
      return [{ clip: 'groom', seconds: between(random, 3.2, 4.4) }, { clip: 'idle', seconds: 1 }];
    default:
      return [];
  }
}

/**
 * Elige la siguiente necesidad sin repetir la última. Después de comer lo
 * natural es beber, y después de beber, asearse: esos encadenamientos pesan
 * más, pero nunca son obligatorios.
 */
export function pickNeed(last = null, random = Math.random) {
  const weights = { eat: 3, drink: 3, groom: 2.5 };
  if (last === 'eat') weights.drink += 4;
  if (last === 'drink') weights.groom += 2;
  const pool = MASCOT_NEEDS.filter((need) => need !== last);
  const total = pool.reduce((sum, need) => sum + weights[need], 0);
  let roll = random() * total;
  for (const need of pool) {
    roll -= weights[need];
    if (roll < 0) return need;
  }
  return pool[pool.length - 1];
}

/** Un paseo por arriba hasta un punto que no sea casi el mismo en el que ya está. */
function stroll(random, from) {
  let to = between(random, -TOP_REACH, TOP_REACH);
  if (Math.abs(to - from) < 0.35) to = from > 0 ? -Math.abs(to) : Math.abs(to);
  return { clip: 'walk', to: Math.max(-TOP_REACH, Math.min(TOP_REACH, to)) };
}

const zoomies = (random) => [
  { clip: 'run', laps: eitherWay(random) * (random() < 0.3 ? 2 : 1) },
  { clip: 'idle', seconds: 1.2, face: true },
];

/**
 * El director: decide la rutina cuando la cola se vacía, responde al toque
 * y concede o niega los saludos espontáneos. `now` va en segundos.
 *
 * `calm` es para quien pidió reducir el movimiento: el gato sigue en el botón,
 * pero no pasea ni come; se sienta o duerme, y al tocarlo responde con un
 * saludo corto en vez de un truco.
 *
 * `laps: false` es el suelo recto del móvil: la rutina es la misma, pero cada
 * vuelta sale ya convertida en idas y venidas (`flattenLaps`).
 */
export function createDirector({ random = Math.random, calm = false, laps = true } = {}) {
  const ground = laps ? (steps) => steps : flattenLaps;
  let lastNeed = null;
  let needReadyAt = 6;
  let greetReadyAt = 0;
  let napReadyAt = 30;
  let excitedUntil = -Infinity;
  let lastTrick = null;

  return {
    /** Lo primero que hace al aparecer: saludar. */
    greet(now) {
      greetReadyAt = now + GREET_COOLDOWN;
      if (calm) return [{ clip: 'sit', seconds: 4, face: true }];
      return [{ clip: 'wave', seconds: 2.4, face: true }, { clip: 'idle', seconds: 1 }];
    },

    /** Saludo espontáneo al acercarse el puntero: solo si le toca y está desocupado. */
    maybeGreet(now, current) {
      if (calm || now < greetReadyAt) return null;
      if (current && (current.laps || !['walk', 'idle', 'sit'].includes(current.clip))) return null;
      return this.greet(now);
    },

    /** La siguiente tanda de pasos. `x` es dónde está en el tramo de arriba, de -1 a 1. */
    nextBeat(now, x = 0) {
      return ground(this.beat(now, x));
    },

    /** La tanda tal como la pide la pastilla, con sus vueltas. */
    beat(now, x = 0) {
      if (calm) {
        return [random() < 0.5
          ? { clip: 'sleep', seconds: between(random, 10, 16) }
          : { clip: 'sit', seconds: between(random, 6, 10), face: true }];
      }
      // Con energía, a correr alrededor del planeta.
      if (now < excitedUntil && random() < 0.6) {
        excitedUntil = -Infinity;
        return zoomies(random);
      }
      if (now >= needReadyAt && random() < 0.5) {
        const need = pickNeed(lastNeed, random);
        lastNeed = need;
        needReadyAt = now + NEED_COOLDOWN + between(random, 0, 10);
        return needSteps(need, random);
      }
      const roll = random();
      if (roll < 0.42) return [stroll(random, x), { clip: 'idle', seconds: between(random, 1.6, 3.4) }];
      if (roll < 0.6) return [{ clip: 'sit', seconds: between(random, 3.5, 6.5) }];
      if (roll < 0.72 && now >= napReadyAt) {
        napReadyAt = now + NAP_COOLDOWN;
        return [{ clip: 'sleep', seconds: between(random, 8, 14) }, { clip: 'idle', seconds: 1 }];
      }
      // Aburrido: una vuelta paseando.
      if (roll < 0.8) return [{ clip: 'walk', laps: eitherWay(random) }, { clip: 'idle', seconds: 1.5 }];
      // A veces la energía llega sola.
      if (roll < 0.85) return zoomies(random);
      if (roll < 0.92 && now >= greetReadyAt) return this.greet(now);
      return [{ clip: 'idle', seconds: between(random, 2, 3.5) }];
    },

    /**
     * El toque. Si ya está haciendo un truco, el siguiente espera su turno
     * (uno como mucho: diez toques seguidos no deben encolar diez trucos). Si
     * no, el truco interrumpe lo que esté haciendo, sea lo que sea: quien toca
     * espera respuesta ya. Además lo deja con energía un rato.
     */
    tap(current, queued = false, now = 0) {
      if (calm) {
        if (current?.trick) return { mode: 'ignore', steps: [] };
        return { mode: 'interrupt', steps: [{ clip: 'wave', seconds: 2, face: true, trick: true }, { clip: 'sit', seconds: 4, face: true }] };
      }
      excitedUntil = now + EXCITEMENT;
      if (current?.trick) {
        if (queued) return { mode: 'ignore', steps: [] };
        lastTrick = nextTrick(lastTrick, random);
        return { mode: 'queue', steps: ground(trickSteps(lastTrick, random)) };
      }
      lastTrick = nextTrick(lastTrick, random);
      return { mode: 'interrupt', steps: ground(trickSteps(lastTrick, random)) };
    },
  };
}
