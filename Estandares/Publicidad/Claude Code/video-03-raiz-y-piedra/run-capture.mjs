/**
 * Guion de cámara: qué se graba, cuánto dura y dónde se detiene.
 *
 * Uso:  node run-capture.mjs <carpeta-de-fotogramas>
 *
 * Los fotogramas se escriben FUERA de iCloud a propósito (la carpeta se pasa
 * por argumento y el `build.sh` la pone en /private/tmp): son ~1400 JPEG y
 * dejarlos en el repositorio de iCloud siembra duplicados de conflicto.
 *
 * El scroll no es un barrido uniforme. La cinemática tiene cuatro actos y, a
 * ritmo constante, la esfera y las cartas pasan de largo antes de que se lean.
 * Cada tramo se define con fotogramas clave «segundo → píxel de scroll» y entre
 * ellos se interpola con suavizado, de modo que el recorrido arranca, se
 * detiene donde hay algo que mirar y vuelve a arrancar.
 */
import { launch, captureSegment } from "./capture.mjs";

const FPS = 60;
const BASE = "http://localhost:4173";

/** Suavizado entre dos claves: sin tirón al entrar ni al salir. */
const smooth = (t) => t * t * (3 - 2 * t);

/**
 * Convierte una lista de claves [segundo, fracción del scroll] en la función
 * que espera `captureSegment`. La fracción se resuelve contra el alto real
 * medido en el navegador, así que el guion no depende de un alto fijo.
 */
function keyframes(keys, seconds) {
  return (t, max) => {
    const now = t * seconds;
    if (now <= keys[0][0]) return keys[0][1] * max;
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, v0] = keys[i];
      const [t1, v1] = keys[i + 1];
      if (now <= t1) {
        const k = t1 === t0 ? 1 : (now - t0) / (t1 - t0);
        return (v0 + (v1 - v0) * smooth(k)) * max;
      }
    }
    return keys[keys.length - 1][1] * max;
  };
}

/*
 * Tramo 1 · la portada (17 s).
 *
 * Las fracciones están tomadas sobre el alto total de la página: la cinemática
 * ocupa 397vh, algo más de la mitad del documento, y las secciones el resto.
 * Las mesetas son las paradas: el árbol al empezar, la esfera cuando aparece y
 * las cartas cuando terminan de desplegarse.
 */
const PORTADA = {
  url: `${BASE}/`,
  seconds: 17,
  // La única que debe crecer: si no llega, es que no resolvió el modo cinemático.
  minHeight: 4000,
  keys: [
    [0.0, 0.000],   // el guanacaste, quieto
    [1.4, 0.000],
    [4.4, 0.255],   // travesía por la copa hacia el vacío
    [6.0, 0.350],   // la esfera del Diquís
    [7.4, 0.350],   // parada: la cartela de la esfera
    [9.8, 0.520],   // fragmentación → las 80 cartas
    [11.2, 0.545],  // deriva lenta sobre la línea del tiempo
    [13.4, 0.665],  // «El juego de mesa»
    [15.0, 0.780],  // «Objetos con historia»
    [16.2, 0.930],  // el bento
    [17.0, 0.985],
  ],
};

/* Tramo 2 · la tienda (3,2 s): cabecera y rejilla. */
const TIENDA = {
  url: `${BASE}/tienda/`,
  seconds: 3.2,
  virtualTime: false,
  keys: [[0.0, 0.0], [0.6, 0.0], [3.2, 0.62]],
};

/* Tramo 3 · una ficha (2,8 s): el producto ancla, de arriba a la ficha técnica. */
const FICHA = {
  url: `${BASE}/tienda/raiz-y-piedra-el-juego/`,
  seconds: 2.8,
  virtualTime: false,
  keys: [[0.0, 0.0], [0.5, 0.0], [2.8, 0.86]],
};

const SHOTS = [
  { name: "01-portada", ...PORTADA },
  { name: "02-tienda", ...TIENDA },
  { name: "03-ficha", ...FICHA },
];

const OUT = process.argv[2];
if (!OUT) {
  console.error("uso: node run-capture.mjs <carpeta-de-fotogramas> [tramo…]");
  process.exit(1);
}

/*
 * Se pueden pedir tramos sueltos por nombre. La portada son 1020 fotogramas y
 * bajo SwiftShader tarda ~9 min: cuando solo cambia la tienda, no hay por qué
 * volver a grabarla.
 */
const only = process.argv.slice(3);
const plan = only.length ? SHOTS.filter((s) => only.includes(s.name)) : SHOTS;
if (!plan.length) {
  console.error("ningún tramo coincide. Hay: " + SHOTS.map((s) => s.name).join(", "));
  process.exit(1);
}

/*
 * Un Chrome por tramo, y no uno para los tres.
 *
 * Al terminar un tramo el reloj virtual queda PAUSADO (el último `advance`
 * agotó su presupuesto). Si con ese estado se navega al tramo siguiente, la
 * carga no avanza nunca —no corren temporizadores ni llega `load`— y el
 * proceso se queda colgado para siempre. El primer tramo siempre salía bien y
 * el segundo no: costó verlo. Relanzar cuesta 0,7 s y borra el arrastre.
 */
for (const shot of plan) {
  const frames = Math.round(shot.seconds * FPS);
  const { proc, cdp } = await launch(`${OUT}/_chrome-profile`);
  try {
    await captureSegment(cdp, {
      url: shot.url,
      dir: `${OUT}/${shot.name}`,
      frames,
      label: shot.name,
      // El preloader F01 tiene un mínimo de 1200 ms y suelta al primer
      // fotograma real de WebGL, que bajo SwiftShader tarda. 9 s de margen
      // dejan el primer fotograma ya limpio de overlay.
      settleMs: 9000,
      minHeight: shot.minHeight ?? 0,
      virtualTime: shot.virtualTime ?? true,
      scroll: keyframes(shot.keys, shot.seconds),
    });
  } finally {
    proc.kill();
  }
}
console.log("captura completa");
process.exit(0);
