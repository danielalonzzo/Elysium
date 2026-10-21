/**
 * Motor 3D de la mascota de la dock.
 *
 * Este módulo es el único que importa three.js, y se pide con `import()` fuera
 * del arranque (ver `DockMascot.jsx`): el paquete de entrada no lo lleva.
 *
 * La dock es el planeta del perrito. Puede caminar por todo el contorno de la
 * pastilla (el tramo de arriba, las dos curvas y el tramo de abajo, boca
 * abajo) con la gravedad siempre hacia ella: su «arriba» es la normal del
 * contorno en el punto donde pisa. El recorrido se mide en píxeles de
 * perímetro (`s`), empezando en el centro del tramo de arriba y avanzando en
 * el sentido de las agujas del reloj. Su casa es el tramo de arriba: lo que
 * decide cuándo da la vuelta está en `core/mascot.js`.
 *
 * Qué más hace:
 * - Carga el GLB que genera `scripts/mascot/build_mascot.py` (modelo, esqueleto,
 *   18 animaciones y utilería) y lo pinta con sombreado de caricatura.
 * - Dibuja el trazo negro del logo como casco invertido en el sombreador,
 *   reutilizando la geometría: por eso el GLB no lo trae.
 * - Ejecuta los pasos que decide el director de `core/mascot.js`.
 * - Mantiene sobre el perro un botón invisible que recibe el toque y el teclado,
 *   porque el lienzo deja pasar los clics para no tapar la página.
 * - Solo anima mientras la dock está a la vista y la pestaña activa.
 *
 * Con `ground: 'line'` el planeta se aplana: el suelo es una línea recta (la
 * del pie de la barra lateral de los paneles, o el borde de la barra inferior
 * en el móvil). Es la misma pastilla con radio cero, así que todo lo demás
 * funciona igual; lo único que cambia es que el director no pide vueltas
 * (`flattenLaps`) y que el tamaño del perro lo fija `dogPx`, porque una línea
 * no tiene alto del que sacarlo.
 */

import {
  AmbientLight,
  AnimationMixer,
  BackSide,
  DataTexture,
  DirectionalLight,
  Group,
  LoopOnce,
  LoopRepeat,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  PerspectiveCamera,
  RedFormat,
  Scene,
  Shape,
  ShapeGeometry,
  SkinnedMesh,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { url } from '../core/config';
const modelUrl = url('/mascot/villalobos-collie.glb');
import {
  TRAVEL_CLIPS,
  createDirector,
  flattenLaps,
  homeStep,
  isOnTop,
  needsHome,
  pillShape,
  travelDistance,
  wrap,
} from '../core/mascot.js';

/** Altura del perro hasta la punta de la oreja, en unidades del modelo. */
export const DOG_HEIGHT = 1.02;
/**
 * Alto del perro frente al alto de la dock: unas siete décimas. Acompaña a la
 * pastilla sin competir con ella ni tapar lo que hay detrás.
 */
const DOG_TO_DOCK = 0.69;
/**
 * Rumbo del perro sobre el suelo, en radianes: 0 es de perfil avanzando en el
 * sentido del reloj, π/2 es de frente a quien mira y π de perfil al revés.
 * Al caminar se gira un poco hacia la pantalla para que se le vea la cara.
 */
const SIDE = 0.45;
const FACE = Math.PI / 2;
/** Acompasado con el ciclo de `walk` (16 fotogramas) para que las patas no patinen. */
const WALK_SPEED = 0.6;
/** La carrera loca, acompasada con el galope de `run` (12 fotogramas). */
const RUN_SPEED = 1.8;
/** Lo que no pisa de cada punta del tramo de arriba: ahí ya empieza la curva. */
const EDGE_PX = 12;
const TURN_SPEED = 5;
const FADE = 0.28;
const FOV = 20;
/** Grosor del trazo, en píxeles CSS. */
const OUTLINE_PX = 1;
/** Cuánto se hunden las patas en el canto de la pastilla, para que pise y no flote. */
const SINK_PX = 3;

const LIMP_TAIL = new Set(['pee', 'poop', 'scratch', 'play_dead', 'sleep']);
/**
 * Trucos que ponen la cabeza boca abajo o contra el suelo. La copa del sombrero
 * de bruja es alta y va rígida en la cabeza: ahí se clavaría en la dock, así que
 * se lo quita al empezar y se lo vuelve a poner al acabar.
 */
const HATLESS = new Set(['roll', 'backflip', 'play_dead']);
const TRAVEL = new Set(TRAVEL_CLIPS);
const LOOKING = new Set(['idle', 'sit', 'wave', 'beg']);
const Z = new Vector3(0, 0, 1);

const ease = (u) => { const t = MathUtils.clamp(u, 0, 1); return t * t * (3 - 2 * t); };
const backOut = (u) => { const t = MathUtils.clamp(u, 0, 1) - 1; return 1 + t * t * (2.7 * t + 1.7); };

export function toonGradient() {
  const texture = new DataTexture(new Uint8Array([120, 196, 255]), 3, 1, RedFormat);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Trazo del logo: se infla la malla por sus normales y se pintan solo las caras de atrás. */
export function outlineMaterial(width) {
  const material = new MeshBasicMaterial({ color: 0x181916, side: BackSide });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.outlineWidth = width;
    shader.vertexShader = `uniform float outlineWidth;\n${shader.vertexShader}`.replace(
      '#include <skinning_vertex>',
      `#include <skinning_vertex>
      #if defined( USE_ENVMAP ) || defined( USE_SKINNING )
        transformed += normalize( objectNormal ) * outlineWidth;
      #else
        transformed += normalize( normal ) * outlineWidth;
      #endif`,
    );
  };
  return material;
}

/**
 * Viste el GLB con el sombreado de caricatura y le cuelga el trazo del logo a
 * cada malla. Lo comparten la dock y el perro gigante de los diez toques
 * (`rampage.js`), que carga su propia copia del modelo.
 */
export function dressModel(root, { toon, flat, outline, disposables }) {
  // Primero se recogen las mallas y luego se tocan: el trazo se cuelga como
  // hijo de cada una, y dentro del mismo `traverse` se visitaría a sí mismo.
  const meshes = [];
  root.traverse((node) => { if (node.isMesh) meshes.push(node); });
  meshes.forEach((node) => {
    node.geometry.computeVertexNormals();
    const isDetail = node.material.name === 'PVP_Detail';
    node.material.dispose();
    node.material = isDetail ? flat : toon;
    node.frustumCulled = false;
    disposables.push(node.geometry);
    if (!isDetail) {
      const hull = node.isSkinnedMesh ? new SkinnedMesh(node.geometry, outline) : new Mesh(node.geometry, outline);
      if (node.isSkinnedMesh) hull.bind(node.skeleton, node.bindMatrix);
      hull.frustumCulled = false;
      node.add(hull);
    }
  });
}

function heartGeometry() {
  const s = new Shape();
  s.moveTo(0, -0.05);
  s.bezierCurveTo(-0.075, 0.0, -0.062, 0.062, 0, 0.034);
  s.bezierCurveTo(0.062, 0.062, 0.075, 0.0, 0, -0.05);
  return new ShapeGeometry(s, 6);
}

/** La «Z» del sueño, gruesa para que se lea a este tamaño. */
function zeeGeometry() {
  const s = new Shape();
  [[-0.035, 0.035], [0.035, 0.035], [0.035, 0.022], [-0.012, -0.022], [0.035, -0.022], [0.035, -0.035],
    [-0.035, -0.035], [-0.035, -0.022], [0.012, 0.022], [-0.035, 0.022]]
    .forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  return new ShapeGeometry(s);
}

function sparkleGeometry() {
  const s = new Shape();
  for (let i = 0; i < 8; i += 1) {
    const r = i % 2 === 0 ? 0.05 : 0.014;
    const a = (Math.PI / 4) * i;
    if (i === 0) s.moveTo(Math.sin(a) * r, Math.cos(a) * r);
    else s.lineTo(Math.sin(a) * r, Math.cos(a) * r);
  }
  return new ShapeGeometry(s);
}

/**
 * Crea la mascota dentro de `container`, que rodea la dock con el mismo margen
 * por los cuatro lados. `dock` es la pastilla y `button` el botón invisible
 * que recibe los toques. `calm` la deja quieta (movimiento reducido),
 * `festive` le pone el chonete del Mes Patrio y `halloween`, el traje de
 * calabaza y el sombrero de bruja de octubre.
 *
 * Devuelve el control al momento; el modelo llega después (`ready`). Si el
 * navegador no tiene WebGL, lanza, y quien llama se queda sin mascota.
 */
export function createMascot({
  container, dock, button, onReady, calm = false, festive = false, halloween = false, ground = 'pill', dogPx = null,
}) {
  const onLine = ground === 'line';
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  container.prepend(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 2, 0.1, 80);
  scene.add(new AmbientLight(0xffffff, 1.7));
  const sun = new DirectionalLight(0xffffff, 2.1);
  sun.position.set(-1.6, 3, 2.6);
  scene.add(sun);

  const gradientMap = toonGradient();
  const toon = new MeshToonMaterial({ vertexColors: true, gradientMap });
  const flat = new MeshBasicMaterial({ vertexColors: true });
  const outlineWidth = { value: 0.02 };
  const outline = outlineMaterial(outlineWidth);
  const disposables = [renderer, gradientMap, toon, flat, outline];

  const dog = new Group();
  dog.visible = false;
  scene.add(dog);

  // ── Estado ──────────────────────────────────────────────────────────────
  const director = createDirector({ calm, laps: !onLine });
  const tmp = new Vector3();
  const basis = new Matrix4();
  const axisX = new Vector3();
  const forward = new Vector3();
  const here = { point: new Vector3(), normal: new Vector3(), tangent: new Vector3() };
  const there = { point: new Vector3(), normal: new Vector3(), tangent: new Vector3() };
  let unitsPerPx = DOG_HEIGHT / 42;
  let pill = pillShape(233, 62);
  let size = { w: 0, h: 0 };
  let lastTime = 0;
  let elapsed = 0;
  let frame = 0;
  let running = false;
  let active = false;
  let disposed = false;
  let loaded = false;

  let mixer = null;
  const actions = {};
  let current = null;
  const bones = {};
  let headRest = null;
  const props = {};
  let kibble = null;
  let water = null;
  let puddleMaterial = null;
  let hat = null;
  let wearingHat = false;
  let costume = null;
  let witchHat = null;
  let wearingCostume = false;
  let hatless = false;
  let puff = 1;
  const PUFF = {};

  let queue = [];
  let step = null;
  let stepTime = 0;
  let stepDone = false;
  let pendingTrick = null;
  let s = 0;
  let heading = FACE;
  let sideHeading = SIDE;
  let mood = 0.4;
  let entrance = 0;
  const look = { yaw: 0, pitch: 0 };
  let pointer = null;
  let lastGreetCheck = 0;
  let puddleTimer = -1;
  let dripTimer = 0;
  let dustTimer = 0;
  let zeeTimer = 0;
  const tweens = [];
  const particles = [];

  // ── El planeta ──────────────────────────────────────────────────────────
  /**
   * Punto, normal y tangente del contorno a `at` píxeles del centro de arriba.
   * Los ejes van con Y hacia arriba y el origen en el centro de la pastilla.
   */
  function surface(at, out) {
    const { a, r, length } = pill;
    const cap = Math.PI * r;
    let t = ((at % length) + length) % length;
    let px; let py; let nx; let ny;
    if (t < a) {
      px = t; py = r; nx = 0; ny = 1;
    } else if ((t -= a) < cap) {
      nx = Math.sin(t / r); ny = Math.cos(t / r); px = a + r * nx; py = r * ny;
    } else if ((t -= cap) < 2 * a) {
      px = a - t; py = -r; nx = 0; ny = -1;
    } else if ((t -= 2 * a) < cap) {
      nx = -Math.sin(t / r); ny = -Math.cos(t / r); px = -a + r * nx; py = r * ny;
    } else {
      t -= cap; px = -a + t; py = r; nx = 0; ny = 1;
    }
    out.point.set(px * unitsPerPx, py * unitsPerPx, 0);
    out.normal.set(nx, ny, 0);
    out.tangent.set(ny, -nx, 0);
    return out;
  }

  /** Orienta un objeto de pie sobre el contorno, con `ang` como rumbo. */
  function orient(object, where, ang) {
    forward.copy(where.tangent).multiplyScalar(Math.cos(ang)).addScaledVector(Z, Math.sin(ang));
    axisX.crossVectors(where.normal, forward);
    basis.makeBasis(axisX, where.normal, forward);
    object.quaternion.setFromRotationMatrix(basis);
  }

  // ── Encaje en la dock ───────────────────────────────────────────────────
  function layout() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    size = { w, h };
    renderer.setSize(w, h, false);

    const dockW = dock.offsetWidth || w / 2;
    const dockH = dock.offsetHeight || 60;
    unitsPerPx = DOG_HEIGHT / (dogPx || MathUtils.clamp(dockH * DOG_TO_DOCK, 34, 46));
    // En pantallas de densidad 1 un trazo de 1 px se deshace con el suavizado y
    // queda a trozos: ahí se engorda hasta 1,5 px.
    outlineWidth.value = Math.max(OUTLINE_PX, 1.5 / renderer.getPixelRatio()) * unitsPerPx;

    // La pastilla: dos tramos rectos de 2a y dos semicírculos de radio r. Si
    // cambia de tamaño, el perro conserva la fracción de vuelta en la que iba.
    const fraction = s / pill.length;
    pill = pillShape(dockW, onLine ? 0 : dockH);
    s = fraction * pill.length;

    // Cámara de frente, sin inclinación: el suelo del perrito es el contorno de
    // la pastilla, que está en el plano de la pantalla.
    camera.aspect = w / h;
    camera.position.set(0, 0, (h * unitsPerPx) / (2 * Math.tan(MathUtils.degToRad(FOV / 2))));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(container);
  resizeObserver.observe(dock);

  // ── Modelo ──────────────────────────────────────────────────────────────
  const ready = new GLTFLoader().loadAsync(modelUrl).then((gltf) => {
    if (disposed) return;
    const root = gltf.scene;
    dressModel(root, { toon, flat, outline, disposables });

    const rig = root.getObjectByName('PVP_Rig');
    dog.add(rig);
    ['root', 'head', 'hips', 'tail_3', 'ear_L', 'ear_R', 'paw_FL', 'paw_FR', 'paw_HL', 'paw_HR'].forEach((name) => {
      bones[name] = rig.getObjectByName(name);
    });
    headRest = bones.head.quaternion.clone();
    // El chonete viene colgado del hueso de la cabeza: la sigue solo.
    hat = rig.getObjectByName('acc_chonete');
    if (hat) hat.visible = false;
    // El traje de calabaza lleva los huesos del cuerpo: se dobla con él solo.
    costume = rig.getObjectByName('acc_halloween');
    if (costume) costume.visible = false;
    // El sombrero de bruja va con el traje y, como el chonete, en la cabeza.
    witchHat = rig.getObjectByName('acc_witch_hat');
    if (witchHat) witchHat.visible = false;

    const group = (names) => {
      const holder = new Group();
      names.forEach((name) => { const node = root.getObjectByName(name); if (node) holder.add(node); });
      holder.visible = false;
      scene.add(holder);
      return holder;
    };
    props.food = group(['prop_food_bowl', 'prop_kibble']);
    props.water = group(['prop_water_bowl', 'prop_water']);
    props.puddle = group(['prop_puddle']);
    props.poop = group(['prop_poop']);
    kibble = props.food.getObjectByName('prop_kibble');
    water = props.water.getObjectByName('prop_water');
    puddleMaterial = flat.clone();
    puddleMaterial.transparent = true;
    props.puddle.getObjectByName('prop_puddle').material = puddleMaterial;
    disposables.push(puddleMaterial);

    mixer = new AnimationMixer(rig);
    gltf.animations.forEach((clip) => { actions[clip.name] = mixer.clipAction(clip); });
    mixer.addEventListener('finished', (event) => {
      if (event.action === current && step?.once) stepDone = true;
    });
    actions.wag?.play();

    loaded = true;
    setFestive(festive);
    setHalloween(halloween);
    dog.visible = true;
    dog.scale.setScalar(0.001);
    queue = director.greet(0);
    layout();
    onReady?.();
    if (active) start();
  });

  // ── Animaciones ─────────────────────────────────────────────────────────
  function play(name, { once = false } = {}) {
    const next = actions[name];
    if (!next || (next === current && !once)) return;
    next.reset();
    next.setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity);
    next.clampWhenFinished = once;
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);
    if (current && current !== next) next.crossFadeFrom(current, FADE, false);
    else next.fadeIn(FADE);
    next.play();
    current = next;
  }

  // ── Utilería ────────────────────────────────────────────────────────────
  function tween(target, duration, fn, done) {
    for (let i = tweens.length - 1; i >= 0; i -= 1) if (tweens[i].target === target) tweens.splice(i, 1);
    tweens.push({ target, duration, fn, done, t: 0 });
  }

  /**
   * Coloca utilería en el suelo, a una distancia del perro dada en sus propios
   * ejes: `side` hacia su izquierda y `ahead` hacia delante. Sobre el suelo
   * local, sus ejes son la tangente del contorno y la profundidad (Z); al
   * convertir, lo que va por la tangente se vuelve a proyectar sobre el
   * contorno, para que en las curvas el plato también quede apoyado.
   *
   * `ang` es el rumbo con el que el perro va a hacer el paso, no el que tiene
   * ahora: al empezar a beber puede venir aún de frente (tras un truco o un
   * saludo) y terminar de girarse ya con el plato puesto. Con el rumbo de ese
   * instante, el plato quedaba detrás de la cola y bebía del aire.
   */
  function placeNear(holder, side, ahead, ang) {
    const along = side * Math.sin(ang) + ahead * Math.cos(ang);
    const depth = -side * Math.cos(ang) + ahead * Math.sin(ang);
    surface(s + along / unitsPerPx, there);
    holder.position.copy(there.point).addScaledVector(Z, depth);
    orient(holder, there, FACE);
  }

  /** Pone o quita un sombrero, con un saltito para que se note el cambio. */
  function popHat(object, value) {
    if (value) {
      object.visible = true;
      object.scale.setScalar(0.001);
      tween(object, 0.45, (u) => object.scale.setScalar(Math.max(0.001, backOut(u))));
    } else {
      tween(object, 0.25, (u) => object.scale.setScalar(Math.max(0.001, 1 - ease(u))), () => { object.visible = false; });
    }
  }

  function setFestive(value) {
    festive = value;
    if (!hat || value === wearingHat) return;
    wearingHat = value;
    popHat(hat, value);
  }

  /** El sombrero de bruja se ve si va disfrazado y no está en un truco boca abajo. */
  function dressWitchHat() {
    if (!witchHat) return;
    witchHat.visible = wearingCostume && !hatless;
    witchHat.scale.setScalar(1);
  }

  /**
   * Pone o quita el disfraz de Halloween: traje de calabaza y sombrero de
   * bruja. El traje no crece como el chonete: es una malla con esqueleto y su
   * escala no cuenta, la coloca el esqueleto. El cambio va dentro de un soplo
   * de destellos, con un respingo de todo el perro.
   */
  function setHalloween(value) {
    halloween = value;
    if ((!costume && !witchHat) || value === wearingCostume) return;
    wearingCostume = value;
    if (!running || entrance < 1) {
      if (costume) costume.visible = value;
      dressWitchHat();
      return;
    }
    poof();
    tween(PUFF, 0.4, (u) => {
      puff = 1 + 0.14 * Math.sin(Math.PI * u);
      if (u >= 0.5 && costume) costume.visible = wearingCostume;
      if (u >= 0.5 && witchHat?.visible !== (wearingCostume && !hatless)) dressWitchHat();
    }, () => { puff = 1; });
  }

  /** Se quita el sombrero de bruja para los trucos boca abajo (`HATLESS`). */
  function tipWitchHat(off) {
    if (off === hatless) return;
    hatless = off;
    if (witchHat && wearingCostume) popHat(witchHat, !off);
  }

  function showProp(holder) {
    holder.visible = true;
    holder.scale.setScalar(0.001);
    tween(holder, 0.35, (u) => holder.scale.setScalar(Math.max(0.001, backOut(u))));
  }

  function hideProp(holder) {
    if (!holder.visible) return;
    tween(holder, 0.25, (u) => holder.scale.setScalar(Math.max(0.001, 1 - ease(u))), () => { holder.visible = false; });
  }

  // ── Partículas ──────────────────────────────────────────────────────────
  // Cada una cae hacia el planeta desde donde nació: la gravedad es la normal
  // del contorno en ese punto, no el «abajo» de la pantalla.
  const particleGeometries = {
    drop: new SphereGeometry(0.016, 6, 4),
    dust: new SphereGeometry(0.035, 7, 5),
    heart: heartGeometry().scale(1.6, 1.6, 1),
    sparkle: sparkleGeometry().scale(1.4, 1.4, 1),
    zee: zeeGeometry().scale(2, 2, 1),
  };
  const particleColors = { drop: 0xf2d23c, dust: 0xe9d7ba, heart: 0xe75582, sparkle: 0xffc83d, zee: 0x5a92cd };
  const FLOATING = new Set(['heart', 'sparkle', 'zee']);
  Object.values(particleGeometries).forEach((g) => disposables.push(g));

  function emit(kind, position, velocity, life, where) {
    let particle = particles.find((p) => !p.alive && p.kind === kind);
    if (!particle) {
      const material = new MeshBasicMaterial({ color: particleColors[kind], transparent: true, depthWrite: false });
      particle = { kind, mesh: new Mesh(particleGeometries[kind], material), velocity: new Vector3(), up: new Vector3(), ground: new Vector3() };
      particle.mesh.frustumCulled = false;
      scene.add(particle.mesh);
      particles.push(particle);
      disposables.push(material);
    }
    particle.alive = true;
    particle.age = 0;
    particle.life = life;
    particle.mesh.visible = true;
    particle.mesh.position.copy(position);
    particle.velocity.copy(velocity);
    particle.up.copy(where.normal);
    particle.ground.copy(where.point);
    particle.roll = Math.atan2(-where.normal.x, where.normal.y);
    particle.spin = (Math.random() - 0.5) * 6;
  }

  function updateParticles(dt) {
    particles.forEach((p) => {
      if (!p.alive) return;
      p.age += dt;
      const u = p.age / p.life;
      if (u >= 1) { p.alive = false; p.mesh.visible = false; return; }
      if (p.kind === 'drop') p.velocity.addScaledVector(p.up, -4 * dt);
      if (p.kind === 'dust') p.velocity.multiplyScalar(1 - 2.5 * dt);
      p.mesh.position.addScaledVector(p.velocity, dt);
      if (p.kind === 'drop' && tmp.copy(p.mesh.position).sub(p.ground).dot(p.up) < 0.006) {
        p.alive = false;
        p.mesh.visible = false;
        return;
      }
      if (FLOATING.has(p.kind)) {
        const wobble = { sparkle: p.spin * p.age, heart: Math.sin(p.age * 6) * 0.25, zee: Math.sin(p.age * 3) * 0.3 }[p.kind];
        p.mesh.quaternion.copy(camera.quaternion);
        p.mesh.rotateZ(p.roll + wobble);
      }
      const grow = p.kind === 'dust' ? 0.6 + u * 1.4 : p.kind === 'drop' ? 1 : backOut(Math.min(1, u * 4));
      p.mesh.scale.setScalar(grow);
      p.mesh.material.opacity = p.kind === 'drop' ? 1 : 1 - ease((u - 0.55) / 0.45);
    });
  }

  function hearts() {
    bones.head.getWorldPosition(tmp);
    for (let i = 0; i < 3; i += 1) {
      const origin = tmp.clone().addScaledVector(here.normal, 0.38 + Math.random() * 0.08).addScaledVector(here.tangent, (i - 1) * 0.16);
      const velocity = here.normal.clone().multiplyScalar(0.32 + Math.random() * 0.12).addScaledVector(here.tangent, (i - 1) * 0.1);
      emit('heart', origin, velocity, 1.2, here);
    }
  }

  /** Destellos alrededor del cuerpo, como el truco de un mago. */
  function poof() {
    bones.hips.getWorldPosition(tmp);
    for (let i = 0; i < 9; i += 1) {
      const a = (Math.PI * 2 * i) / 9;
      const origin = tmp.clone().addScaledVector(here.tangent, Math.cos(a) * 0.3).addScaledVector(here.normal, 0.2 + Math.sin(a) * 0.25);
      const velocity = here.tangent.clone().multiplyScalar(Math.cos(a) * 0.5).addScaledVector(here.normal, 0.25 + Math.sin(a) * 0.35);
      emit('sparkle', origin, velocity, 0.7, here);
    }
  }

  /** Las «Z» salen de la cabeza y suben hacia fuera del planeta, meciéndose. */
  function snore() {
    const lean = Math.cos(heading) >= 0 ? 1 : -1;
    bones.head.getWorldPosition(tmp);
    const origin = tmp.clone().addScaledVector(here.normal, 0.3).addScaledVector(here.tangent, 0.12 * lean);
    const velocity = here.normal.clone().multiplyScalar(0.22).addScaledVector(here.tangent, 0.07 * lean);
    emit('zee', origin, velocity, 2.2, here);
  }

  function sparkles(holder) {
    surface(holder.userData.s ?? s, there);
    for (let i = 0; i < 7; i += 1) {
      const a = (Math.PI * 2 * i) / 7;
      const origin = holder.position.clone().addScaledVector(there.normal, 0.06);
      const velocity = there.tangent.clone().multiplyScalar(Math.cos(a) * 0.45).addScaledVector(there.normal, 0.3 + Math.sin(a) * 0.22);
      emit('sparkle', origin, velocity, 0.7, there);
    }
  }

  /** Lo que hace la utilería mientras dura el paso. */
  function propFrame(dt, progress) {
    switch (step.prop) {
      case 'food':
        kibble.scale.setScalar(Math.max(0.05, 1 - 0.85 * ease(progress)));
        break;
      case 'water':
        water.position.y = 0.04 - 0.014 * ease(progress);
        break;
      case 'puddle': {
        const grow = ease((progress - 0.12) / 0.6);
        props.puddle.scale.set(Math.max(0.001, grow), 1, Math.max(0.001, grow));
        dripTimer -= dt;
        if (progress > 0.08 && progress < 0.82 && dripTimer <= 0) {
          dripTimer = 0.045;
          const origin = dog.localToWorld(new Vector3(0.07, 0.19, -0.2));
          const velocity = new Vector3(0.55, 0.3, -0.04).applyQuaternion(dog.quaternion);
          emit('drop', origin, velocity, 0.6, here);
        }
        break;
      }
      case 'poop':
        if (step.clip === 'poop') {
          const grow = ease((progress - 0.35) / 0.5);
          props.poop.scale.set(Math.max(0.001, grow), Math.max(0.001, grow * (1 + 0.15 * Math.sin(progress * 30))), Math.max(0.001, grow));
        } else {
          dustTimer -= dt;
          if (dustTimer <= 0 && progress < 0.8) {
            dustTimer = 0.1;
            const origin = dog.localToWorld(new Vector3((Math.random() - 0.5) * 0.2, 0.03, -0.32));
            const velocity = new Vector3((Math.random() - 0.5) * 0.4, 0.25, -0.5).applyQuaternion(dog.quaternion);
            emit('dust', origin, velocity, 0.7, here);
          }
          if (step.vanish && progress >= 0.8 && props.poop.visible && !step.vanished) {
            step.vanished = true;
            sparkles(props.poop);
            hideProp(props.poop);
          }
        }
        break;
      default:
    }
  }

  function beginProp() {
    const ang = step.face ? FACE : sideHeading;
    switch (step.prop) {
      case 'food':
        kibble.scale.setScalar(1);
        placeNear(props.food, 0, 0.66, ang);
        showProp(props.food);
        break;
      case 'water':
        water.position.y = 0.04;
        placeNear(props.water, 0, 0.7, ang);
        showProp(props.water);
        break;
      case 'puddle':
        puddleTimer = -1;
        puddleMaterial.opacity = 0.85;
        placeNear(props.puddle, 0.17, -0.22, ang);
        props.puddle.visible = true;
        props.puddle.scale.set(0.001, 1, 0.001);
        break;
      case 'poop':
        if (!props.poop.visible) {
          placeNear(props.poop, 0, -0.52, ang);
          props.poop.userData.s = s - (0.52 * Math.cos(ang)) / unitsPerPx;
          props.poop.visible = true;
          props.poop.scale.setScalar(0.001);
        }
        break;
      default:
    }
  }

  /** Al terminar o interrumpirse un paso, la utilería no puede quedarse colgada. */
  function endProp(interrupted) {
    if (!step?.prop) return;
    if (step.prop === 'food') hideProp(props.food);
    if (step.prop === 'water') hideProp(props.water);
    if (step.prop === 'puddle') puddleTimer = 3.5;
    if (step.prop === 'poop' && (interrupted || step.vanish) && props.poop.visible) {
      if (!step.vanished) sparkles(props.poop);
      hideProp(props.poop);
    }
  }

  // ── Pasos ───────────────────────────────────────────────────────────────
  /** Dónde está en el tramo de arriba, de -1 a 1 (0 si anda por otra parte). */
  function topX() {
    if (!isOnTop(s, pill)) return 0;
    const t = wrap(s, pill.length);
    const along = t > pill.length / 2 ? t - pill.length : t;
    return MathUtils.clamp(along / Math.max(1, pill.a - EDGE_PX), -1, 1);
  }

  function beginStep(next) {
    step = { ...next };
    stepTime = 0;
    stepDone = false;
    tipWitchHat(HATLESS.has(step.clip));
    if (TRAVEL.has(step.clip)) {
      step.remaining = travelDistance(s, step, pill, EDGE_PX);
      if (Math.abs(step.remaining) < 1) { stepDone = true; return; }
      sideHeading = step.remaining > 0 ? SIDE : Math.PI - SIDE;
      play(step.clip);
      return;
    }
    play(step.clip, { once: step.once });
    beginProp();
  }

  function endStep(interrupted = false) {
    if (!step) return;
    endProp(interrupted);
    if (step.trick && !interrupted) {
      hearts();
      mood = 1;
    }
    step = null;
    if (pendingTrick) {
      queue = pendingTrick;
      pendingTrick = null;
    }
  }

  function updateStep(dt) {
    if (!step) {
      if (!queue.length) queue = director.nextBeat(elapsed, topX());
      let next = queue.shift();
      // Su vida es arriba: si algo lo dejó abajo, primero vuelve a casa.
      if (needsHome(next) && !isOnTop(s, pill)) {
        queue.unshift(next);
        next = homeStep(s, pill);
      }
      beginStep(next);
    }
    stepTime += dt;

    const want = step.face ? FACE : sideHeading;
    heading += MathUtils.clamp(want - heading, -TURN_SPEED * dt, TURN_SPEED * dt);

    if (TRAVEL.has(step.clip)) {
      if (Math.abs(want - heading) < 0.3) {
        const dir = Math.sign(step.remaining);
        const speed = step.clip === 'run' ? RUN_SPEED : WALK_SPEED;
        const stride = Math.min(Math.abs(step.remaining), (speed / unitsPerPx) * dt);
        s += dir * stride;
        step.remaining -= dir * stride;
        if (Math.abs(step.remaining) < 0.5) {
          s = wrap(s, pill.length);
          stepDone = true;
        }
      }
    } else if (step.seconds) {
      if (step.clip === 'sleep') {
        zeeTimer -= dt;
        if (zeeTimer <= 0 && stepTime > 1) { zeeTimer = 1.1; snore(); }
      }
      if (step.prop) propFrame(dt, stepTime / step.seconds);
      if (stepTime >= step.seconds) stepDone = true;
    } else if (step.once) {
      const clip = actions[step.clip]?.getClip();
      if (!clip || stepTime > clip.duration + 0.5) stepDone = true;
    }

    if (stepDone) endStep();
  }

  /**
   * Un toque de racha de los diez (ver `createTapStreak`): se planta donde
   * esté, de frente y pidiendo otro, con un respingo en cada toque.
   */
  function cheer() {
    if (!loaded) return;
    mood = 1;
    endStep(true);
    pendingTrick = null;
    queue = director.cheer();
    tween(PUFF, 0.24, (u) => { puff = 1 + 0.12 * Math.sin(Math.PI * u); }, () => { puff = 1; });
  }

  /**
   * Dónde está el perro en la ventana: el punto entre sus patas, en píxeles
   * de la pantalla, y su alto. El perro gigante nace ahí mismo.
   */
  function pose() {
    if (!loaded) return null;
    const rect = container.getBoundingClientRect();
    tmp.copy(dog.position).project(camera);
    return {
      x: rect.left + ((tmp.x + 1) / 2) * size.w,
      y: rect.top + ((1 - tmp.y) / 2) * size.h,
      px: (DOG_HEIGHT / unitsPerPx) * dog.scale.x,
      upright: here.normal.y > 0.5,
    };
  }

  function tap() {
    if (!loaded) return;
    const answer = director.tap(step, Boolean(pendingTrick), elapsed);
    mood = 1;
    if (answer.mode === 'interrupt') {
      endStep(true);
      pendingTrick = null;
      queue = answer.steps;
    } else if (answer.mode === 'queue') {
      pendingTrick = answer.steps;
    }
  }

  // ── Puntero: mirar y saludar ────────────────────────────────────────────
  function onPointerMove(event) {
    if (event.pointerType === 'touch') return;
    pointer = { x: event.clientX, y: event.clientY, at: elapsed };
    if (!loaded || elapsed - lastGreetCheck < 0.25) return;
    lastGreetCheck = elapsed;
    const rect = dock.getBoundingClientRect();
    const near = event.clientX > rect.left - 90 && event.clientX < rect.right + 90 && event.clientY > rect.top - 110 && event.clientY < rect.bottom + 90;
    if (!near) return;
    const greeting = director.maybeGreet(elapsed, step);
    if (greeting) {
      endStep(true);
      queue = greeting;
    }
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  /** Gira la cabeza hacia el puntero cuando está de frente, en sus propios ejes. */
  function updateLook(dt) {
    let wantYaw = 0;
    let wantPitch = 0;
    const fresh = pointer && elapsed - pointer.at < 3;
    if (fresh && step && LOOKING.has(step.clip) && Math.abs(heading - FACE) < 0.35) {
      const rect = container.getBoundingClientRect();
      const px = (pointer.x - rect.left - size.w / 2) * unitsPerPx;
      const py = (size.h / 2 - (pointer.y - rect.top)) * unitsPerPx;
      bones.head.getWorldPosition(tmp);
      const dx = px - tmp.x;
      const dy = py - tmp.y;
      axisX.setFromMatrixColumn(dog.matrixWorld, 0).normalize();
      const reach = 240 * unitsPerPx;
      wantYaw = MathUtils.clamp((dx * axisX.x + dy * axisX.y) / reach, -1, 1) * 0.6;
      wantPitch = -MathUtils.clamp((dx * here.normal.x + dy * here.normal.y) / reach, -1, 1) * 0.35;
    }
    const k = 1 - Math.exp(-6 * dt);
    look.yaw += (wantYaw - look.yaw) * k;
    look.pitch += (wantPitch - look.pitch) * k;
  }

  // ── Botón sobre el perro ────────────────────────────────────────────────
  const hitPoints = ['head', 'ear_L', 'ear_R', 'paw_FL', 'paw_FR', 'paw_HL', 'paw_HR', 'tail_3', 'hips'];
  let hitRect = '';
  function updateHitArea() {
    let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity;
    const include = () => {
      tmp.project(camera);
      const px = (tmp.x + 1) / 2 * size.w;
      const py = (1 - tmp.y) / 2 * size.h;
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    };
    hitPoints.forEach((name) => { bones[name].getWorldPosition(tmp); include(); });
    bones.head.getWorldPosition(tmp).addScaledVector(here.normal, 0.3);
    include();
    const pad = 6;
    const next = [minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2].map(Math.round);
    const key = next.join(',');
    if (key === hitRect) return;
    hitRect = key;
    button.style.transform = `translate(${next[0]}px, ${next[1]}px)`;
    button.style.width = `${Math.max(0, next[2])}px`;
    button.style.height = `${Math.max(0, next[3])}px`;
  }

  // ── Bucle ───────────────────────────────────────────────────────────────
  function tick() {
    if (!running) return;
    frame = requestAnimationFrame(tick);
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    elapsed += dt;

    updateStep(dt);
    updateLook(dt);

    mood = Math.max(0.35, mood - dt * 0.12);
    const wag = actions.wag;
    if (wag) {
      const limp = step && LIMP_TAIL.has(step.clip);
      wag.setEffectiveWeight(limp ? 0.25 : 1);
      wag.setEffectiveTimeScale(limp ? 0.5 : 0.7 + 1.5 * mood);
    }

    bones.head.quaternion.copy(headRest);
    mixer.update(dt);
    if (look.yaw || look.pitch) {
      bones.head.rotateY(look.yaw);
      bones.head.rotateX(look.pitch);
    }

    surface(s, here);
    dog.position.copy(here.point).addScaledVector(here.normal, -SINK_PX * unitsPerPx);
    orient(dog, here, heading);
    entrance = Math.min(1, entrance + dt / 0.45);
    dog.scale.setScalar(Math.max(0.001, backOut(entrance) * puff));

    for (let i = tweens.length - 1; i >= 0; i -= 1) {
      const tw = tweens[i];
      tw.t += dt;
      tw.fn(Math.min(1, tw.t / tw.duration));
      if (tw.t >= tw.duration) { tweens.splice(i, 1); tw.done?.(); }
    }
    if (puddleTimer >= 0) {
      puddleTimer -= dt;
      if (puddleTimer < 1.5) puddleMaterial.opacity = 0.85 * Math.max(0, puddleTimer / 1.5);
      if (puddleTimer <= 0) { props.puddle.visible = false; puddleTimer = -1; }
    }
    updateParticles(dt);

    renderer.render(scene, camera);
    updateHitArea();
  }

  function start() {
    if (running || disposed || !loaded || document.hidden) return;
    running = true;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  function onVisibility() {
    if (document.hidden) stop();
    else if (active) start();
  }
  document.addEventListener('visibilitychange', onVisibility);

  layout();

  const api = {
    ready,
    trick: tap,
    cheer,
    pose,
    setFestive,
    setHalloween,
    setActive(value) {
      active = value;
      if (active) start();
      else stop();
    },
    dispose() {
      disposed = true;
      stop();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      mixer?.stopAllAction();
      disposables.forEach((item) => item.dispose?.());
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };

  // Solo en desarrollo: forzar una rutina desde la consola para revisarla,
  // p. ej. `__pvpMascot.run('poop')`, o llevar al perro a un punto de la vuelta
  // con `__pvpMascot.goTo(0.5)` (0 es el centro de arriba; 0,5, abajo).
  if (import.meta.env?.DEV) {
    window.__pvpMascot = {
      ...api,
      run(clip) {
        const steps = {
          eat: [{ clip: 'eat', seconds: 4, prop: 'food' }],
          drink: [{ clip: 'drink', seconds: 3, prop: 'water' }],
          pee: [{ clip: 'pee', seconds: 2.6, prop: 'puddle' }],
          poop: [{ clip: 'poop', seconds: 2.8, prop: 'poop' }, { clip: 'scratch', seconds: 1.6, prop: 'poop', vanish: true }],
          wave: [{ clip: 'wave', seconds: 2.4, face: true }],
          sit: [{ clip: 'sit', seconds: 4 }],
          sleep: [{ clip: 'sleep', seconds: 10 }],
          wander: [{ clip: 'walk', laps: 1 }],
          zoomies: [{ clip: 'run', laps: 1, trick: true }],
        }[clip] || [{ clip, once: !['beg', 'idle'].includes(clip), seconds: ['beg', 'idle'].includes(clip) ? 3 : undefined, face: true, trick: true }];
        endStep(true);
        queue = [...(onLine ? flattenLaps(steps) : steps), { clip: 'idle', seconds: 30 }];
      },
      goTo(fraction) { s = fraction * pill.length; },
      state: () => ({ step: step?.clip, s, fraction: s / pill.length, onTop: isOnTop(s, pill), heading, pill, unitsPerPx, size }),
      scene,
      outlineWidth,
      /** Para revisar de cerca: más resolución que la pantalla real. */
      setPixelRatio(ratio) { renderer.setPixelRatio(ratio); layout(); },
    };
  }

  return api;
}
