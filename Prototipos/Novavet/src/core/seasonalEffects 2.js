export const STORAGE_KEY = 'pvp_seasonal_effects_config';
export const EVENT_CONFIG_UPDATED = 'pvp:seasonal-config-updated';

let dbInstance = null;
async function getDb() {
  if (!dbInstance) {
    const { db } = await import('./firebase.js');
    dbInstance = db;
  }
  return dbInstance;
}

let confettiPromise = null;
async function getConfetti() {
  if (typeof window === 'undefined') return null;
  if (!confettiPromise) {
    confettiPromise = import('canvas-confetti').then((mod) => mod.default || mod);
  }
  return confettiPromise;
}

export const SEASONAL_THEMES = Object.freeze({
  NONE: 'none',
  MES_PATRIO: 'mes-patrio',
  HALLOWEEN: 'halloween',
  NAVIDAD: 'navidad',
  VERANO: 'verano',
});

export const DEFAULT_SEASONAL_CONFIG = Object.freeze({
  enabled: true,
  activeTheme: SEASONAL_THEMES.MES_PATRIO,
  forceAlwaysActive: false,
  dateRange: {
    startMonth: 9, // Septiembre
    startDay: 1,
    endMonth: 9,
    endDay: 30,
  },
  features: {
    fullReskin: true,
    patrioticPaws: true,
    carnivalAmbience: true,
    wavingFlag: true,
    footerFireworks: true,
    tricolorHeader: true,
    torchScroll: true,
    hangingLanterns: true,
    patrioticRibbon: true,
    logoChonete: true,
    confettiOnClick: true,
    sarchiDividers: true,
    seasonalFavicon: true,
  },
  updatedAt: null,
});

export const THEME_DATE_RANGES = Object.freeze({
  [SEASONAL_THEMES.MES_PATRIO]: Object.freeze({ startMonth: 9, startDay: 1, endMonth: 9, endDay: 30 }),
  [SEASONAL_THEMES.HALLOWEEN]: Object.freeze({ startMonth: 10, startDay: 1, endMonth: 10, endDay: 31 }),
});

/**
 * De dónde sale la temporada que manda en el primer pintado.
 *
 * Hay tres fuentes y no siempre dicen lo mismo:
 *
 *   · `DEFAULT_SEASONAL_CONFIG` es el calendario, no la decisión. Dice que en
 *     septiembre toca Mes Patrio, y es cierto salvo cuando la administración lo
 *     apaga desde el CRM, que es una decisión que solo vive en Firestore.
 *   · El retrato horneado en el HTML es lo que `/system/seasonal` decía cuando
 *     se compiló. Lo escribe `scripts/prerender.js` en cada subida.
 *   · `localStorage` es lo que Firestore confirmó en la última visita.
 *
 * Antes solo se miraban la caché y el calendario, y a quien llegaba sin caché
 * se le pintaba el Mes Patrio entero, cabecera tricolor y diorama de 187 KiB
 * incluidos, para que Firestore lo desmontara novecientos milisegundos después.
 * Eso mueve el héroe, la cabecera, el faldón y todo lo que va debajo: 0,25 de
 * CLS que la auditoría cobra (§6.10) y que el visitante ve. Con el retrato de
 * la compilación, la primera pintura ya sabe lo que decidió la administración.
 *
 * Entre el retrato y la caché manda el `updatedAt` más reciente: la caché es de
 * la última visita y el retrato de la última subida, y cualquiera de los dos
 * puede ser el nuevo.
 */
const SNAPSHOT_ID = 'pvp-temporada';
let snapshotLeido = false;
let snapshotTemporada = null;

function temporadaDeCompilacion() {
  // Va como bloque de datos y no como script ejecutable a propósito: la CSP de
  // `firebase.json` (F07) no admite `script-src 'unsafe-inline'`, así que un
  // `<script>` con código dentro quedaría bloqueado en producción y el retrato
  // no llegaría nunca. Un `type="application/json"` no se ejecuta, se lee.
  if (snapshotLeido) return snapshotTemporada;
  snapshotLeido = true;
  if (typeof document === 'undefined') return null;
  try {
    const node = document.getElementById(SNAPSHOT_ID);
    snapshotTemporada = node ? JSON.parse(node.textContent) : null;
  } catch (error) {
    console.warn('Error al leer la temporada horneada en el HTML:', error);
    snapshotTemporada = null;
  }
  return snapshotTemporada;
}

function temporadaEnCache() {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Error al leer configuración de temporada local:', error);
    return null;
  }
}

const marcaDeTiempo = (config) => {
  const parsed = config && config.updatedAt ? Date.parse(config.updatedAt) : NaN;
  return Number.isNaN(parsed) ? -Infinity : parsed;
};

/** Rellena con los valores por defecto lo que la fuente no traiga. */
function completar(parsed) {
  if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SEASONAL_CONFIG };
  return {
    ...DEFAULT_SEASONAL_CONFIG,
    ...parsed,
    features: {
      ...DEFAULT_SEASONAL_CONFIG.features,
      ...(parsed.features || {}),
    },
    dateRange: {
      ...DEFAULT_SEASONAL_CONFIG.dateRange,
      ...(parsed.dateRange || {}),
    },
  };
}

/**
 * La configuración más reciente que se conoce sin tocar la red. Es síncrona a
 * propósito: la llama `initSeasonalReskin()` antes de montar la aplicación.
 */
export function getStoredSeasonalConfig() {
  const horneada = temporadaDeCompilacion();
  const cache = temporadaEnCache();
  if (!horneada) return completar(cache);
  if (!cache) return completar(horneada);
  return completar(marcaDeTiempo(cache) >= marcaDeTiempo(horneada) ? cache : horneada);
}

/**
 * Determina si el tema actual debe mostrarse según interruptor maestro y calendario.
 */
export function isSeasonActive(config, now = new Date()) {
  if (!config || !config.enabled) return false;
  if (!config.activeTheme || config.activeTheme === SEASONAL_THEMES.NONE) return false;
  if (config.forceAlwaysActive) return true;

  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Costa_Rica', month: 'numeric', day: 'numeric' }).formatToParts(now);
  const currentMonth = Number(parts.find(p => p.type === 'month').value);
  const currentDay = Number(parts.find(p => p.type === 'day').value);

  const range = config.dateRange || DEFAULT_SEASONAL_CONFIG.dateRange;
  const startMonth = Number(range.startMonth || 9);
  const startDay = Number(range.startDay || 1);
  const endMonth = Number(range.endMonth || 9);
  const endDay = Number(range.endDay || 30);

  const current = currentMonth * 100 + currentDay;
  const start = startMonth * 100 + startDay;
  const end = endMonth * 100 + endDay;
  return start <= end ? current >= start && current <= end : current >= start || current <= end;
}

/**
 * La carpeta de `public/seasonal/` con el logotipo de la temporada, o `null`
 * para el de siempre.
 *
 * En el Mes Patrio sale el corgi con chonete solo si el interruptor
 * `logoChonete` del CRM está encendido. En Halloween, el del sombrero de bruja
 * con la calabacita, sin interruptor propio: lo decide el tema, igual que el
 * disfraz del perrito. `preview` es la vista previa del CRM, que enseña el tema
 * elegido aunque el calendario o el interruptor general digan que no toca.
 */
export function seasonalLogo(config, now = new Date(), { preview = false } = {}) {
  if (!config || !(preview || isSeasonActive(config, now))) return null;
  if (config.activeTheme === SEASONAL_THEMES.MES_PATRIO) return config.features?.logoChonete ? 'mes-patrio' : null;
  if (config.activeTheme === SEASONAL_THEMES.HALLOWEEN) return 'halloween';
  return null;
}

/**
 * Zonas donde el disfraz de temporada NO se pinta.
 *
 * La temporada es del sitio público. La cuenta de un cliente, el panel del
 * paseador y el CRM (asesores, administración y desarrollo) son herramientas de
 * trabajo: el reskin reescribe las variables de color de la raíz, y esas mismas
 * variables son las que pintan esos paneles. Lo único que viaja con la
 * temporada a todas partes es el perrito de la dock, que no depende de estas
 * clases.
 */
const PRIVATE_PREFIXES = Object.freeze(['/crm', '/portal', '/walker', '/onboarding', '/app']);

/** ¿Esta ruta es del sitio público, es decir, admite disfraz de temporada? */
export function isSeasonalSurface(pathname) {
  const path = String(pathname || '/').replace(/^\/en(?=\/|$)/, '') || '/';
  return !PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

const SEASONAL_ROOT_CLASSES = Object.freeze([
  'mes-patrio', 'patrio-reskin', 'patrio-carnival', 'halloween', 'halloween-reskin', 'halloween-flash',
]);

/** Deja la raíz sin ninguna clase de temporada. */
export function clearSeasonalRootClasses() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove(...SEASONAL_ROOT_CLASSES);
}

/**
 * Pinta en la raíz las tres clases que gobiernan el disfraz de temporada.
 *
 * Vive aquí y no dentro de un efecto porque el reskin no es una decoración que
 * se añade encima: cambia el tamaño del titular, el relleno del héroe y el
 * cuerpo de los botones. Aplicarlo después de la primera pintura movía la
 * columna del héroe entera y la auditoría lo cobraba como desplazamiento de
 * diseño (§6.10). Es la misma razón por la que `initDynamicTheme()` corre antes
 * de montar la aplicación.
 *
 * En una ruta privada no pinta nada y retira lo que hubiera: el arranque deja
 * las clases puestas antes de saber a dónde va la persona (la aplicación
 * instalada abre en `/app` y la portada nunca llega a montarse para limpiarlas).
 */
export function applySeasonalRootClasses(
  config,
  now = new Date(),
  pathname = typeof window === 'undefined' ? '/' : window.location.pathname,
) {
  if (typeof document === 'undefined') return;
  if (!isSeasonalSurface(pathname)) {
    clearSeasonalRootClasses();
    return;
  }
  const seasonActive = Boolean(config && isSeasonActive(config, now));
  const active = seasonActive && config.activeTheme === SEASONAL_THEMES.MES_PATRIO;
  const halloween = seasonActive && config.activeTheme === SEASONAL_THEMES.HALLOWEEN;
  const features = (config && config.features) || {};
  const root = document.documentElement;
  root.classList.toggle('mes-patrio', active);
  root.classList.toggle('patrio-reskin', active && Boolean(features.fullReskin));
  root.classList.toggle('patrio-carnival', active && Boolean(features.carnivalAmbience));
  root.classList.toggle('halloween', halloween);
  root.classList.toggle('halloween-reskin', halloween && Boolean(features.fullReskin));
}

/**
 * Lo mismo, con la configuración que ya está en caché. Se llama desde
 * `main.jsx` antes de montar: sin red, sin esperas y sin repintado.
 */
export function initSeasonalReskin() {
  applySeasonalRootClasses(getStoredSeasonalConfig());
}

/**
 * Suscripción en tiempo real al documento Firestore `/system/seasonal`.
 * Respalda en localStorage y notifica en cada cambio.
 */
export function subscribeToSeasonalConfig(onData, onError) {
  let isSubscribed = true;

  // Emitir primero el estado en caché local para cero parpadeo
  const initial = getStoredSeasonalConfig();
  onData(initial);

  if (typeof window === 'undefined') return () => {};

  const onLocal = event => { if (isSubscribed) onData(event.detail); };
  const onStorage = event => { if (event.key === STORAGE_KEY && isSubscribed) onData(getStoredSeasonalConfig()); };
  window.addEventListener(EVENT_CONFIG_UPDATED, onLocal);
  window.addEventListener('storage', onStorage);
  let unsubscribeDoc = null;

  (async () => {
    try {
      const database = await getDb();
      const { doc, onSnapshot } = await import('firebase/firestore');
      const docRef = doc(database, 'system', 'seasonal');

      if (!isSubscribed) return;
      unsubscribeDoc = onSnapshot(
        docRef,
        (snapshot) => {
          if (!isSubscribed) return;
          if (snapshot.exists()) {
            const remoteData = snapshot.data();
            const merged = {
              ...DEFAULT_SEASONAL_CONFIG,
              ...remoteData,
              features: {
                ...DEFAULT_SEASONAL_CONFIG.features,
                ...(remoteData.features || {}),
              },
              dateRange: {
                ...DEFAULT_SEASONAL_CONFIG.dateRange,
                ...(remoteData.dateRange || {}),
              },
            };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch {
              // Ignorar en modo privado
            }
            onData(merged);
          } else {
            onData(initial);
          }
        },
        (error) => {
          console.warn('No fue posible sincronizar Firestore /system/seasonal (usando fallback local):', error);
          onError?.(error);
        }
      );
    } catch (error) {
      console.warn('Error al iniciar escucha de temporada:', error);
      onError?.(error);
    }
  })();

  return () => {
    isSubscribed = false;
    window.removeEventListener(EVENT_CONFIG_UPDATED, onLocal);
    window.removeEventListener('storage', onStorage);
    if (unsubscribeDoc) unsubscribeDoc();
  };
}

/**
 * Guarda la configuración en Firestore y actualiza el caché local.
 */
export async function updateSeasonalConfig(patch) {
  const current = getStoredSeasonalConfig();
  const next = {
    ...current,
    ...patch,
    features: {
      ...current.features,
      ...(patch.features || {}),
    },
    dateRange: {
      ...current.dateRange,
      ...(patch.dateRange || {}),
    },
    updatedAt: new Date().toISOString(),
  };


  {
    const database = await getDb();
    const { doc, serverTimestamp, setDoc } = await import('firebase/firestore');
    const docRef = doc(database, 'system', 'seasonal');
    await setDoc(
      docRef,
      {
        ...next,
        serverUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignorar en privado
  }

  // Notificar en la misma ventana de inmediato
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_CONFIG_UPDATED, { detail: next }));
  }

  return next;
}

/**
 * Lanza una explosión de confeti patrio costarricense (Azul, Blanco, Rojo y Dorado festivo).
 */
let lastCelebration = 0;
export async function triggerPatrioticConfetti(originX = 0.5, originY = 0.3) {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (Date.now() - lastCelebration < 1500) return;
  lastCelebration = Date.now();
  const confetti = await getConfetti();
  if (!confetti) return;
  const colors = ['#143d75', '#fff4dc', '#c52d43', '#ddb66d'];
  const common = { colors, disableForReducedMotion: true, zIndex: 120, ticks: 190, gravity: .7, decay: .94 };
  // Two choreographed fans of paper, followed by slow golden rosettes.
  confetti({ ...common, particleCount: 48, origin: { x: originX, y: originY }, angle: 65, spread: 38, startVelocity: 33, scalar: 1.1, shapes: ['square'] });
  confetti({ ...common, particleCount: 48, origin: { x: originX, y: originY }, angle: 115, spread: 38, startVelocity: 33, scalar: .8, shapes: ['square'] });
  const rosette = confetti.shapeFromPath({ path: 'M0 -8L2 -4L6 -6L5 -2L9 0L5 2L6 6L2 4L0 8L-2 4L-6 6L-5 2L-9 0L-5 -2L-6 -6L-2 -4Z' });
  confetti({ ...common, particleCount: 14, origin: { x: originX, y: originY }, spread: 100, startVelocity: 26, scalar: 1.5, gravity: .45, colors: ['#e8c27b', '#c52d43'], shapes: [rosette] });
}
