/**
 * La mascota de la dock: qué hace en cada momento y por dónde anda.
 *
 * El perrito es parte de la dock: está siempre que ella está, también en
 * festividades. Aquí no hay nada de three.js ni del DOM, a propósito. El motor
 * 3D (`components/Mascot/mascotEngine.js`) solo sabe reproducir pasos; lo que
 * decide la rutina vive en este módulo para poder probarlo con `node --test`.
 *
 * La dock es su planeta: puede caminar por todo el contorno de la pastilla con
 * la gravedad hacia ella, pero su casa es el tramo de arriba. Ahí duerme, come,
 * bebe, hace sus necesidades y se sienta. Solo da la vuelta por debajo en tres
 * casos: cuando le entra la energía y sale corriendo (sobre todo después de que
 * lo toquen), cuando se aburre y pasea alrededor, o en un truco.
 *
 * Un paso es un objeto plano:
 *
 *   { clip: 'walk', to: 0.4 }                 caminar a un punto de arriba (de -1 a 1)
 *   { clip: 'walk', laps: -1 }                una vuelta entera paseando, al revés
 *   { clip: 'run', laps: 2 }                  dos vueltas corriendo
 *   { clip: 'sit', seconds: 5 }               pose en bucle durante un tiempo
 *   { clip: 'eat', seconds: 4, prop: 'food' } necesidad, con su utilería
 *   { clip: 'roll', once: true, face: true }  truco: una pasada, de frente
 *
 * Las vueltas son siempre enteras, así que todo viaje termina arriba. Y si algo
 * lo deja abajo (un toque a media carrera), el motor lo trae de vuelta antes
 * de cualquier paso que no sea un viaje o un truco (`needsHome`).
 */

import { SEASONAL_THEMES, isSeasonActive } from './seasonalEffects.js';

export const MASCOT_TRICKS = Object.freeze(['roll', 'backflip', 'spin', 'play_dead', 'beg', 'jump', 'zoomies']);
export const MASCOT_NEEDS = Object.freeze(['eat', 'drink', 'pee', 'poop']);
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
// En los paneles (CRM, paseador y portal) el perrito no vive en una pastilla
// sino sobre una línea: la que separa la navegación del pie de la barra
// lateral, o el borde de arriba de la barra inferior en el móvil. Ahí no hay
// contorno al que dar la vuelta, y por debajo de la línea hay botones.

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

// ── Vestuario ──────────────────────────────────────────────────────────────

/**
 * En el Mes Patrio el perrito lleva chonete, igual que el logo. Lo gobierna el
 * mismo interruptor del CRM (`logoChonete`): el perrito es el logo con patas, y
 * dos sombreros con interruptores distintos acabarían descuadrados.
 */
export function wearsChonete(config, now = new Date()) {
  return Boolean(
    config
    && isSeasonActive(config, now)
    && config.activeTheme === SEASONAL_THEMES.MES_PATRIO
    && config.features?.logoChonete,
  );
}

/**
 * En Halloween el perrito va disfrazado de calabaza: un traje con gajos, tallo
 * y cuello de hojas, cosido al cuerpo en el modelo, y el sombrero de bruja del
 * logo de octubre. Lo decide solo el tema de temporada del CRM; no tiene
 * interruptor propio, igual que el logotipo de octubre (`seasonalLogo`).
 */
export function wearsHalloweenCostume(config, now = new Date()) {
  return Boolean(
    config
    && isSeasonActive(config, now)
    && config.activeTheme === SEASONAL_THEMES.HALLOWEEN,
  );
}

// ── Dónde no sale ──────────────────────────────────────────────────────────

/**
 * Pantallas de los paneles donde el perrito no aparece: la mensajería y los
 * paseos en vivo. Ahí lo que importa es la caja de escribir o el botón de
 * cerrar el paseo, y el perro (y el hueco que abre sobre la barra inferior)
 * solo estorba.
 */
export function mascotHiddenOnPath(pathname) {
  const path = String(pathname || '').replace(/^\/en(?=\/|$)/, '');
  return /^\/(crm|walker)\/(mensajes|paseos-en-vivo|paseo)(\/|$)/.test(path);
}

/** Lo mismo para el portal del cliente, donde las pantallas son pestañas y no rutas. */
export function mascotHiddenInPortal(activeTab, hasLiveWalk = false) {
  return activeTab === 'mensajes' || (activeTab === 'mis_citas' && Boolean(hasLiveWalk));
}

// ── Trucos ─────────────────────────────────────────────────────────────────

// ── Los diez toques ────────────────────────────────────────────────────────
// El secreto del perrito: quien lo toca diez veces seguidas lo despierta en
// grande (`components/Mascot/rampage.js`). Desde el primer toque aparece sobre
// su cabeza la cuenta de lo que falta. El primero le saca un truco, como
// siempre; desde el segundo se queda quieto, de frente, pidiendo el siguiente:
// corriendo no habría quien le atinara diez veces.

/** Toques seguidos que despiertan al perro gigante. */
export const RAMPAGE_TAPS = 10;
/** Desde qué toque se ve la cuenta: desde el primero, lo pidió el negocio (12/10/2026). */
export const STREAK_HINT_FROM = 1;
/** Segundos que pueden pasar entre dos toques sin que la cuenta vuelva a cero. */
export const STREAK_GAP = 1.6;

/**
 * Cuenta los toques seguidos. `tap(now)` (en segundos) dice cuántos lleva,
 * cuántos faltan, si toca enseñar la cuenta y si ya llegó a la meta; al
 * llegar, la cuenta vuelve a cero sola.
 */
export function createTapStreak({ goal = RAMPAGE_TAPS, gap = STREAK_GAP, hintFrom = STREAK_HINT_FROM } = {}) {
  let count = 0;
  let last = -Infinity;
  return {
    tap(now) {
      count = now - last <= gap ? count + 1 : 1;
      last = now;
      const done = count >= goal;
      const answer = { count, remaining: Math.max(0, goal - count), hint: !done && count >= hintFrom, done };
      if (done) this.reset();
      return answer;
    },
    reset() {
      count = 0;
      last = -Infinity;
    },
  };
}

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
      // Con la panza llena, a veces cae una siesta.
      if (random() < 0.35) steps.push({ clip: 'sleep', seconds: between(random, 7, 11) });
      return steps;
    }
    case 'drink':
      return [{ clip: 'drink', seconds: between(random, 2.6, 3.4), prop: 'water' }, { clip: 'idle', seconds: 1.2 }];
    case 'pee':
      return [{ clip: 'pee', seconds: 2.6, prop: 'puddle' }, { clip: 'idle', seconds: 0.8 }];
    case 'poop':
      return [
        { clip: 'poop', seconds: 2.8, prop: 'poop' },
        { clip: 'scratch', seconds: 1.6, prop: 'poop', vanish: true },
        { clip: 'idle', seconds: 1 },
      ];
    default:
      return [];
  }
}

/**
 * Elige la siguiente necesidad sin repetir la última. Después de comer lo
 * natural es beber, y después de beber, el pipí: esos encadenamientos pesan
 * más, pero nunca son obligatorios.
 */
export function pickNeed(last = null, random = Math.random) {
  const weights = { eat: 3, drink: 3, pee: 2, poop: 1.5 };
  if (last === 'eat') weights.drink += 4;
  if (last === 'drink') weights.pee += 3;
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
 * `calm` es para quien pidió reducir el movimiento: el perrito sigue en la
 * dock, pero no pasea ni hace sus necesidades; se sienta o duerme, y al
 * tocarlo responde con un saludo corto en vez de una voltereta.
 *
 * `laps: false` es el suelo recto de los paneles: la rutina es la misma, pero
 * cada vuelta sale ya convertida en idas y venidas (`flattenLaps`).
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
      if (roll < 0.45) return [stroll(random, x), { clip: 'idle', seconds: between(random, 1.6, 3.4) }];
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

    /**
     * Un toque de racha (ver `createTapStreak`): en vez de otro truco, se queda
     * donde está, de frente y pidiendo el siguiente. Se le quita la energía del
     * primer toque para que no salga corriendo en mitad de la cuenta.
     */
    cheer() {
      excitedUntil = -Infinity;
      return [{ clip: 'beg', seconds: STREAK_GAP + 0.8, face: true, trick: true }, { clip: 'idle', seconds: 1.2, face: true }];
    },
  };
}
