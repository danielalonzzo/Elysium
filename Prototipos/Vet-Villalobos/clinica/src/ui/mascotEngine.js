/**
 * Motor 3D de la mascota: el Maine Coon gris que vive sobre el botón de
 * atención directa.
 *
 * Este módulo es el único que importa three.js, y se pide con `import()` fuera
 * del arranque (ver `Mascot.tsx`): el paquete de entrada no lo lleva.
 *
 * El botón es el planeta del gato. Puede caminar por todo el contorno de la
 * pastilla (el tramo de arriba, las dos curvas y el tramo de abajo, boca
 * abajo) con la gravedad siempre hacia ella: su «arriba» es la normal del
 * contorno en el punto donde pisa. El recorrido se mide en píxeles de
 * perímetro (`s`), empezando en el centro del tramo de arriba y avanzando en
 * el sentido de las agujas del reloj. Su casa es el tramo de arriba: lo que
 * decide cuándo da la vuelta está en `core/mascot.js`.
 *
 * Qué más hace:
 * - Carga el GLB que genera `scripts/mascot/build_mascot.py` (modelo, esqueleto,
 *   16 animaciones y los dos platos) y lo pinta con sombreado de caricatura.
 * - Dibuja el trazo negro como casco invertido en el sombreador, reutilizando
 *   la geometría: por eso el GLB no lo trae.
 * - Ejecuta los pasos que decide el director de `core/mascot.js`.
 * - Mantiene sobre el gato un botón invisible que recibe el toque y el teclado,
 *   porque el lienzo deja pasar los clics para no tapar la página.
 * - Solo anima mientras el botón está a la vista y la pestaña activa.
 *
 * Con `ground: 'line'` el planeta se aplana: el suelo es una línea recta. Es la
 * misma pastilla con radio cero, así que todo lo demás funciona igual; lo único
 * que cambia es que el director no pide vueltas (`flattenLaps`). En el móvil el
 * botón es un círculo demasiado pequeño para darle la vuelta: ahí sigue siendo
 * pastilla, para que pise su borde, pero sin vueltas (`laps: false`).
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
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { url } from '../core/config';
const modelUrl = url('/mascot/villalobos-coon.glb');
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

/** Altura del gato hasta el mechón de la oreja, en unidades del modelo. */
export const MASCOT_HEIGHT = 1.02;
/**
 * Alto del gato frente al alto del botón: unas siete décimas. Acompaña a la
 * pastilla sin competir con ella ni tapar lo que hay detrás.
 */
const MASCOT_TO_DOCK = 0.69;
/**
 * Rumbo del gato sobre el suelo, en radianes: 0 es de perfil avanzando en el
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

/**
 * Gestos que colocan la cola ellos mismos (sentado la enrosca al costado,
 * dormido lo rodea): ahí el vaivén de `wag` baja a un susurro.
 */
const LIMP_TAIL = new Set(['sit', 'wave', 'beg', 'eat', 'drink', 'groom', 'sleep']);
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

/** Viste el GLB con el sombreado de caricatura y le cuelga el trazo a cada malla. */
export function dressModel(root, { toon, flat, outline, disposables }) {
  // Primero se recogen las mallas y luego se tocan: el trazo se cuelga como
  // hijo de cada una, y dentro del mismo `traverse` se visitaría a sí mismo.
  const meshes = [];
  root.traverse((node) => { if (node.isMesh) meshes.push(node); });
  meshes.forEach((node) => {
    node.geometry.computeVertexNormals();
    const isDetail = node.material.name === 'Mascot_Detail';
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
 * Crea la mascota dentro de `container`, que rodea el botón con el mismo margen
 * por los cuatro lados. `dock` es la pastilla y `button` el botón invisible
 * que recibe los toques. `calm` la deja quieta (movimiento reducido) y
 * `laps: false` le quita las vueltas al botón (el círculo del móvil).
 *
 * Devuelve el control al momento; el modelo llega después (`ready`). Si el
 * navegador no tiene WebGL, lanza, y quien llama se queda sin mascota.
 */
export function createMascot({
  container, dock, button, onReady, calm = false, ground = 'pill', laps = ground !== 'line', mascotPx = null,
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

  const cat = new Group();
  cat.visible = false;
  scene.add(cat);

  // ── Estado ──────────────────────────────────────────────────────────────
  const director = createDirector({ calm, laps });
  const tmp = new Vector3();
  const basis = new Matrix4();
  const axisX = new Vector3();
  const forward = new Vector3();
  const here = { point: new Vector3(), normal: new Vector3(), tangent: new Vector3() };
  const there = { point: new Vector3(), normal: new Vector3(), tangent: new Vector3() };
  let unitsPerPx = MASCOT_HEIGHT / 42;
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
    unitsPerPx = MASCOT_HEIGHT / (mascotPx || MathUtils.clamp(dockH * MASCOT_TO_DOCK, 34, 46));
    // En pantallas de densidad 1 un trazo de 1 px se deshace con el suavizado y
    // queda a trozos: ahí se engorda hasta 1,5 px.
    outlineWidth.value = Math.max(OUTLINE_PX, 1.5 / renderer.getPixelRatio()) * unitsPerPx;

    // La pastilla: dos tramos rectos de 2a y dos semicírculos de radio r. Si
    // cambia de tamaño, el gato conserva la fracción de vuelta en la que iba.
    const fraction = s / pill.length;
    pill = pillShape(dockW, onLine ? 0 : dockH);
    s = fraction * pill.length;

    // Cámara de frente, sin inclinación: el suelo del gato es el contorno de la
    // pastilla, que está en el plano de la pantalla.
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

    const rig = root.getObjectByName('Mascot_Rig');
    cat.add(rig);
    ['root', 'head', 'hips', 'tail_3', 'ear_L', 'ear_R', 'paw_FL', 'paw_FR', 'paw_HL', 'paw_HR'].forEach((name) => {
      bones[name] = rig.getObjectByName(name);
    });
    headRest = bones.head.quaternion.clone();

    const group = (names) => {
      const holder = new Group();
      names.forEach((name) => { const node = root.getObjectByName(name); if (node) holder.add(node); });
      holder.visible = false;
      scene.add(holder);
      return holder;
    };
    props.food = group(['prop_food_bowl', 'prop_kibble']);
    props.water = group(['prop_water_bowl', 'prop_water']);
    kibble = props.food.getObjectByName('prop_kibble');
    water = props.water.getObjectByName('prop_water');

    mixer = new AnimationMixer(rig);
    gltf.animations.forEach((clip) => { actions[clip.name] = mixer.clipAction(clip); });
    mixer.addEventListener('finished', (event) => {
      if (event.action === current && step?.once) stepDone = true;
    });
    actions.wag?.play();

    loaded = true;
    cat.visible = true;
    cat.scale.setScalar(0.001);
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
   * Coloca utilería en el suelo, a una distancia del gato dada en sus propios
   * ejes: `side` hacia su izquierda y `ahead` hacia delante. Sobre el suelo
   * local, sus ejes son la tangente del contorno y la profundidad (Z); al
   * convertir, lo que va por la tangente se vuelve a proyectar sobre el
   * contorno, para que en las curvas el plato también quede apoyado.
   *
   * `ang` es el rumbo con el que el gato va a hacer el paso, no el que tiene
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
    heart: heartGeometry().scale(1.6, 1.6, 1),
    sparkle: sparkleGeometry().scale(1.4, 1.4, 1),
    zee: zeeGeometry().scale(2, 2, 1),
  };
  // El rojo del panel del gato, champán y plata: los colores de la casa.
  const particleColors = { heart: 0xd81e24, sparkle: 0xe6c48a, zee: 0xa9aeb7 };
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
      p.mesh.position.addScaledVector(p.velocity, dt);
      const wobble = { sparkle: p.spin * p.age, heart: Math.sin(p.age * 6) * 0.25, zee: Math.sin(p.age * 3) * 0.3 }[p.kind];
      p.mesh.quaternion.copy(camera.quaternion);
      p.mesh.rotateZ(p.roll + wobble);
      p.mesh.scale.setScalar(backOut(Math.min(1, u * 4)));
      p.mesh.material.opacity = 1 - ease((u - 0.55) / 0.45);
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

  /** Las «Z» salen de la cabeza y suben hacia fuera del planeta, meciéndose. */
  function snore() {
    const lean = Math.cos(heading) >= 0 ? 1 : -1;
    bones.head.getWorldPosition(tmp);
    const origin = tmp.clone().addScaledVector(here.normal, 0.3).addScaledVector(here.tangent, 0.12 * lean);
    const velocity = here.normal.clone().multiplyScalar(0.22).addScaledVector(here.tangent, 0.07 * lean);
    emit('zee', origin, velocity, 2.2, here);
  }

  /** Lo que hace la utilería mientras dura el paso. */
  function propFrame(progress) {
    if (step.prop === 'food') kibble.scale.setScalar(Math.max(0.05, 1 - 0.85 * ease(progress)));
    if (step.prop === 'water') water.position.y = 0.04 - 0.014 * ease(progress);
  }

  function beginProp() {
    const ang = step.face ? FACE : sideHeading;
    if (step.prop === 'food') {
      kibble.scale.setScalar(1);
      placeNear(props.food, 0, 0.58, ang);
      showProp(props.food);
    }
    if (step.prop === 'water') {
      water.position.y = 0.04;
      placeNear(props.water, 0, 0.6, ang);
      showProp(props.water);
    }
  }

  /** Al terminar o interrumpirse un paso, el plato no puede quedarse colgado. */
  function endProp() {
    if (step?.prop === 'food') hideProp(props.food);
    if (step?.prop === 'water') hideProp(props.water);
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

  function endStep() {
    if (!step) return;
    endProp();
    if (step.trick && stepDone) {
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
      if (step.prop) propFrame(stepTime / step.seconds);
      if (stepTime >= step.seconds) stepDone = true;
    } else if (step.once) {
      const clip = actions[step.clip]?.getClip();
      if (!clip || stepTime > clip.duration + 0.5) stepDone = true;
    }

    if (stepDone) endStep();
  }

  function tap() {
    if (!loaded) return;
    const answer = director.tap(step, Boolean(pendingTrick), elapsed);
    mood = 1;
    if (answer.mode === 'interrupt') {
      endStep();
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
      endStep();
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
      axisX.setFromMatrixColumn(cat.matrixWorld, 0).normalize();
      const reach = 240 * unitsPerPx;
      wantYaw = MathUtils.clamp((dx * axisX.x + dy * axisX.y) / reach, -1, 1) * 0.6;
      wantPitch = -MathUtils.clamp((dx * here.normal.x + dy * here.normal.y) / reach, -1, 1) * 0.35;
    }
    const k = 1 - Math.exp(-6 * dt);
    look.yaw += (wantYaw - look.yaw) * k;
    look.pitch += (wantPitch - look.pitch) * k;
  }

  // ── Botón sobre el gato ────────────────────────────────────────────────
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
    cat.position.copy(here.point).addScaledVector(here.normal, -SINK_PX * unitsPerPx);
    orient(cat, here, heading);
    entrance = Math.min(1, entrance + dt / 0.45);
    cat.scale.setScalar(Math.max(0.001, backOut(entrance)));

    for (let i = tweens.length - 1; i >= 0; i -= 1) {
      const tw = tweens[i];
      tw.t += dt;
      tw.fn(Math.min(1, tw.t / tw.duration));
      if (tw.t >= tw.duration) { tweens.splice(i, 1); tw.done?.(); }
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
  // p. ej. `__villalobosMascot.run('groom')`, o llevar al gato a un punto de la
  // vuelta con `__villalobosMascot.goTo(0.5)` (0 es el centro de arriba; 0,5, abajo).
  if (import.meta.env?.DEV) {
    window.__villalobosMascot = {
      ...api,
      run(clip) {
        const steps = {
          eat: [{ clip: 'eat', seconds: 4, prop: 'food' }],
          drink: [{ clip: 'drink', seconds: 3, prop: 'water' }],
          groom: [{ clip: 'groom', seconds: 4 }],
          wave: [{ clip: 'wave', seconds: 2.4, face: true }],
          sit: [{ clip: 'sit', seconds: 4 }],
          sleep: [{ clip: 'sleep', seconds: 10 }],
          wander: [{ clip: 'walk', laps: 1 }],
          zoomies: [{ clip: 'run', laps: 1, trick: true }],
        }[clip] || [{ clip, once: !['beg', 'idle'].includes(clip), seconds: ['beg', 'idle'].includes(clip) ? 3 : undefined, face: true, trick: true }];
        endStep();
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
