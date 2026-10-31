/**
 * Graba el sitio de Raíz y Piedra en una secuencia de fotogramas, pilotando
 * Chrome sin cabeza por CDP. Sin dependencias: Node 22+ trae `WebSocket` y
 * `fetch` de serie.
 *
 * ── POR QUÉ TIEMPO VIRTUAL ──────────────────────────────────────────────────
 * No hay grabación de pantalla de este proyecto, así que el metraje se genera.
 * La tentación es mover el scroll y hacer una captura detrás de otra, pero el
 * reloj de la página seguiría siendo el de pared: con SwiftShader cada captura
 * tarda cientos de milisegundos, y el viento de la copa, el giro de las cartas
 * y los `scrub` de GSAP (0.4 s en la portada, 1 s en el carrusel) avanzarían
 * ese mismo rato entre fotograma y fotograma. El follaje saldría hirviendo.
 *
 * `Emulation.setVirtualTimePolicy` congela el reloj del navegador y lo avanza a
 * demanda: 1/fps por fotograma. `requestAnimationFrame`, `performance.now()` y
 * los temporizadores van con él, así que el resultado es idéntico se tarde lo
 * que se tarde en rasterizar. Es el mismo mecanismo detrás de
 * `--virtual-time-budget`, pero paso a paso.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9222;

// Vista de captura. 1440 CSS px es un escritorio de verdad (por encima del
// corte de 1023 del sitio) y 1440×812 da 1.773, que es exactamente la
// proporción del panel del iMac medida en `layers/geometry.json` (894×504).
export const VIEW = { width: 1440, height: 812 };
const FPS = 60;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Un cuelgue de CDP tiene que salir como error, no dejar el proceso parado. */
const withTimeout = (p, ms, what) => Promise.race([
  p, new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT: ${what}`)), ms)),
]);

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== undefined) {
        const p = this.pending.get(msg.id);
        if (!p) return;
        this.pending.delete(msg.id);
        msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result);
      } else {
        (this.listeners.get(msg.method) || []).forEach((fn) => fn(msg.params));
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
  }
  once(method) {
    return new Promise((resolve) => {
      const fn = (p) => {
        const arr = this.listeners.get(method);
        arr.splice(arr.indexOf(fn), 1);
        resolve(p);
      };
      this.on(method, fn);
    });
  }
}

export async function launch(profileDir) {
  rmSync(profileDir, { recursive: true, force: true });
  mkdirSync(profileDir, { recursive: true });
  const proc = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profileDir}`,
    // SwiftShader: sin GPU real, pero la escena R3F necesita WebGL de verdad.
    "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    "--mute-audio",
    "--no-first-run",
    "--disable-extensions",
    "--force-color-profile=srgb",
    "--force-device-scale-factor=1",
    `--window-size=${VIEW.width},${VIEW.height}`,
    "about:blank",
  ], { stdio: "ignore" });

  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await r.json();
      const page = targets.find((t) => t.type === "page");
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((res, rej) => {
          ws.addEventListener("open", res, { once: true });
          ws.addEventListener("error", rej, { once: true });
        });
        return { proc, cdp: new CDP(ws) };
      }
    } catch {}
    await sleep(250);
  }
  throw new Error("Chrome no levantó el puerto de depuración");
}

/**
 * Captura un tramo.
 *
 * @param scroll  función (t 0..1) → posición de scroll en px. Se le pasa la
 *                altura desplazable medida, para poder trabajar en fracciones.
 */
export async function captureSegment(cdp, {
  url, dir, frames, scroll, settleMs = 7000, label, minHeight = 0,
  virtualTime = true, realStepMs = 45,
}) {
  mkdirSync(dir, { recursive: true });

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: VIEW.width, height: VIEW.height, deviceScaleFactor: 1, mobile: false,
  });

  /*
   * La carga va en tiempo REAL, no virtual. Arrancar ya en
   * `pauseIfNetworkFetchesPending` cuelga indefinidamente: basta con que quede
   * una petición sin cerrar para que el presupuesto no expire nunca y el evento
   * `virtualTimeBudgetExpired` no llegue. El reloj se congela después, cuando
   * la página ya está en pie y solo queda avanzar fotograma a fotograma.
   */
  const loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url });
  await loaded;
  await sleep(settleMs);

  /*
   * Sin `awaitPromise`. Con el reloj virtual pausado, pedirle a CDP que espere
   * una promesa no vuelve nunca: la cola de microtareas necesita que el tiempo
   * avance para drenarse, y el tiempo solo avanza cuando se lo pedimos. Nada de
   * lo que se evalúa aquí es asíncrono, así que la opción sobraba.
   */
  const evalJS = async (expression) => {
    const r = await withTimeout(
      cdp.send("Runtime.evaluate", { expression, returnByValue: true }),
      20000, `evaluate ${expression.slice(0, 40)}`);
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };

  /*
   * El tiempo virtual solo hace falta donde hay animación propia que se
   * desincronizaría: la portada, con su cinemática 3D y sus `scrub` de GSAP.
   *
   * En la tienda y en la ficha no hay nada que animar por su cuenta, y ahí el
   * reloj congelado es un estorbo: `Page.captureScreenshot` se queda esperando
   * un fotograma del compositor que no llega —falla siempre en el mismo, el 37
   * de la ficha, justo cuando el scroll se despega de cero— y ni tres
   * reintentos con empujón de tiempo lo desbloquean. Esas dos se graban con el
   * reloj de pared, que para una página quieta da exactamente lo mismo.
   */
  const step = 1000 / FPS;
  const advance = virtualTime
    ? async (n = 1) => {
        const done = cdp.once("Emulation.virtualTimeBudgetExpired");
        await cdp.send("Emulation.setVirtualTimePolicy", { policy: "advance", budget: step * n });
        await withTimeout(done, 30000, "avance de tiempo virtual");
      }
    : async (n = 1) => sleep(realStepMs * n);

  /*
   * El sitio lleva `html { scroll-behavior: smooth }`, así que `scrollTo`
   * ANIMA hasta el destino en vez de saltar. Con el reloj virtual eso es fatal:
   * cada fotograma solo avanza 16 ms, el scroll se queda a medio camino y la
   * cinemática no llega a arrancar —el primer montaje se pasó 24 fotogramas
   * enteros sin salir de la escena I—. Se fuerza el salto instantáneo desde la
   * captura, no tocando el sitio: ahí el scroll suave es una función buena.
   */
  await evalJS(`(() => {
    const st = document.createElement('style');
    st.textContent = 'html{scroll-behavior:auto !important}';
    document.head.appendChild(st);
  })()`);

  // Unos fotogramas virtuales para que ScrollTrigger recalcule con la página ya
  // montada —la portada pasa de una pantalla a 397vh al resolverse el modo—.
  await advance(8);
  const max = await evalJS(
    "Math.max(0, document.documentElement.scrollHeight - window.innerHeight)");
  /*
   * Solo la portada tiene que crecer: al resolverse el modo cinemático pasa de
   * una pantalla a 397vh. La tienda y la ficha son páginas normales y cortas
   * —la ficha mide 1132 px de recorrido— así que exigirles altura las daba por
   * rotas. El mínimo se pide por tramo, no en general.
   */
  if (max < minHeight) {
    throw new Error(`${label}: la página no creció (alto ${max} < ${minHeight})`);
  }

  for (let i = 0; i < frames; i++) {
    const t = frames > 1 ? i / (frames - 1) : 0;
    const y = Math.round(scroll(t, max));
    const landed = await evalJS(`(window.scrollTo(0, ${y}), Math.round(window.scrollY))`);
    if (Math.abs(landed - Math.min(y, max)) > 2) {
      throw new Error(`el scroll no aterrizó: pedido ${y}, real ${landed}`);
    }
    await advance(1);
    /*
     * `Page.captureScreenshot` espera a que el compositor entregue un fotograma
     * nuevo. Con el reloj virtual pausado y una página quieta —la tienda y la
     * ficha no tienen animación propia— ese fotograma puede no llegar nunca y
     * la llamada se queda colgada. Un empujón de tiempo obliga a componer otra
     * vez; con tres intentos no ha vuelto a fallar.
     */
    let shot = null;
    for (let intento = 0; intento < 3 && !shot; intento++) {
      try {
        shot = await withTimeout(cdp.send("Page.captureScreenshot", {
          format: "jpeg", quality: 92, captureBeyondViewport: false,
        }), 8000, `captura del fotograma ${i}`);
      } catch (err) {
        if (!String(err.message).startsWith("TIMEOUT")) throw err;
        await advance(1);
      }
    }
    if (!shot) throw new Error(`no se pudo capturar el fotograma ${i}`);
    writeFileSync(join(dir, `f${String(i).padStart(5, "0")}.jpg`),
                  Buffer.from(shot.data, "base64"));
    if (i % 60 === 0) {
      process.stdout.write(`\r  ${label}  ${i + 1}/${frames}  scroll ${y}/${max}   `);
    }
  }
  process.stdout.write(`\r  ${label}  ${frames}/${frames}  listo (alto ${max})        \n`);
  return max;
}

/** Suavizado de entrada y salida, para que el scroll arranque y pare sin tirón. */
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
