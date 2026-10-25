/**
 * Emblema vivo de la portada: el modelo de Blender (`scripts/logo3d/build_logo.py`)
 * puesto en una vitrina con luz de estudio.
 *
 * - Entrada: las cuatro piezas llegan desde el fondo, se ensamblan y un hilo de
 *   oro firma cada silueta mientras una luz barre el barniz.
 * - El emblema se inclina hacia el cursor y un punto de luz lo sigue.
 * - Cada animal tiene su gesto: el gato apaga la sala y abre un ojo de ámbar, el
 *   perro late con un electrocardiograma de oro, el loro suelta plumas y el
 *   caballo galopa contra el viento.
 * - Con los cuatro despiertos se separan las piezas, se enciende en los huecos una
 *   cruz de luz y el emblema da una vuelta completa.
 *
 * Los contornos y las anclas de los ojos vienen del JSON que escribe el mismo
 * script de Blender, así que la web nunca adivina dónde está cada silueta.
 */
import {ACESFilmicToneMapping,AdditiveBlending,BufferAttribute,BufferGeometry,CanvasTexture,CatmullRomCurve3,CircleGeometry,Color,CurvePath,DirectionalLight,Group,LineCurve3,Mesh,MeshBasicMaterial,MeshPhysicalMaterial,PerspectiveCamera,PlaneGeometry,PMREMGenerator,PointLight,Points,Raycaster,RingGeometry,Scene,ShaderMaterial,Shape,ShapeGeometry,Sprite,SpriteMaterial,SRGBColorSpace,TubeGeometry,Vector2,Vector3,WebGLRenderer} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {url} from '../core/config';

const MODEL = url('/models/valladares-logo-3d.glb?v=5'), META = url('/models/valladares-logo-3d.json?v=5');
export const ANIMAL_IDS = ['cat', 'dog', 'bird', 'horse'];
const DURATION = {cat: 3.4, dog: 2.9, bird: 3.2, horse: 3.0};
const FINALE = 4.8;
// Luz de estudio: el bloom solo debe recoger el oro encendido, nunca la porcelana.
const ENV = .42, KEY = 1.25, RIM = .7, GLINT = 5, GOLD_ENV = 1.5;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t);};
const win = (v, a, b, c, d) => smooth(a, b, v) * (1 - smooth(c, d, v));
const outQuart = p => 1 - Math.pow(1 - p, 4);
const inOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const damp = (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));
const rand = (a, b) => a + Math.random() * (b - a);
const glow = (hex, k) => new Color(hex).multiplyScalar(k);

const FINISH = {
  'Lacado cobalto': () => new MeshPhysicalMaterial({color: '#0d3a9a', roughness: .34, clearcoat: 1, clearcoatRoughness: .045}),
  'Lacado esmeralda': () => new MeshPhysicalMaterial({color: '#0a7140', roughness: .34, clearcoat: 1, clearcoatRoughness: .045}),
  'Porcelana': () => new MeshPhysicalMaterial({color: '#f3efe7', roughness: .44, clearcoat: .55, clearcoatRoughness: .2, sheen: .5, sheenColor: new Color('#fff3df'), sheenRoughness: .6}),
  'Oro champán': () => new MeshPhysicalMaterial({color: '#e0b574', metalness: 1, roughness: .22, emissive: new Color('#ffc979'), emissiveIntensity: 0}),
};

function canvasTexture(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}
const dotTexture = () => canvasTexture(64, (g, s) => {
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,236,200,.75)'); r.addColorStop(1, 'rgba(255,220,160,0)');
  g.fillStyle = r; g.fillRect(0, 0, s, s);
});
const featherTexture = () => canvasTexture(128, (g, s) => {
  g.translate(s / 2, s / 2); g.rotate(-.5);
  const body = new Path2D(); body.moveTo(0, -56); body.bezierCurveTo(20, -36, 22, 18, 3, 50); body.lineTo(-3, 50); body.bezierCurveTo(-22, 16, -18, -36, 0, -56);
  const fill = g.createLinearGradient(0, -56, 0, 50); fill.addColorStop(0, 'rgba(255,255,255,.95)'); fill.addColorStop(1, 'rgba(255,214,150,.55)');
  g.fillStyle = fill; g.fill(body);
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1;
  for (let y = -44; y < 40; y += 6) {g.beginPath(); g.moveTo(0, y); g.lineTo(16, y - 9); g.moveTo(0, y); g.lineTo(-16, y - 9); g.stroke();}
  g.strokeStyle = 'rgba(255,240,215,1)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -50); g.lineTo(0, 60); g.stroke();
});
const streakTexture = () => canvasTexture(128, (g, s) => {
  const r = g.createLinearGradient(0, 0, s, 0);
  r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(.2, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, s * .4, s, s * .2);
});
const flareTexture = () => canvasTexture(256, (g, s) => {
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.12, 'rgba(255,230,180,.7)'); r.addColorStop(.5, 'rgba(255,200,120,.08)'); r.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = r; g.fillRect(0, 0, s, s);
  g.globalCompositeOperation = 'lighter';
  for (const [w, h] of [[s, 3], [3, s]]) {
    const l = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    l.addColorStop(0, 'rgba(255,240,210,.9)'); l.addColorStop(1, 'rgba(255,240,210,0)');
    g.fillStyle = l; g.fillRect((s - w) / 2, (s - h) / 2, w, h);
  }
});

/** Partículas con giro propio: plumas y polvo dorado comparten el mismo sombreador. */
class Particles {
  constructor(max, map) {
    this.max = max; this.live = [];
    const g = new BufferGeometry();
    this.attr = {position: new Float32Array(max * 3), aAlpha: new Float32Array(max), aSize: new Float32Array(max), aAngle: new Float32Array(max), aTint: new Float32Array(max * 3)};
    for (const [k, v] of Object.entries(this.attr)) g.setAttribute(k, new BufferAttribute(v, k === 'position' || k === 'aTint' ? 3 : 1));
    this.material = new ShaderMaterial({
      uniforms: {uMap: {value: map}, uScale: {value: 600}}, transparent: true, depthWrite: false, blending: AdditiveBlending,
      vertexShader: 'attribute float aAlpha,aSize,aAngle;attribute vec3 aTint;uniform float uScale;varying float vAlpha,vAngle;varying vec3 vTint;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=aSize*uScale/-mv.z;vAlpha=aAlpha;vAngle=aAngle;vTint=aTint;}',
      fragmentShader: 'uniform sampler2D uMap;varying float vAlpha,vAngle;varying vec3 vTint;void main(){vec2 c=gl_PointCoord-.5;float s=sin(vAngle),k=cos(vAngle);c=mat2(k,-s,s,k)*c+.5;if(c.x<0.||c.y<0.||c.x>1.||c.y>1.)discard;vec4 t=texture2D(uMap,c);gl_FragColor=vec4(t.rgb*vTint,t.a*vAlpha);}',
    });
    this.points = new Points(g, this.material); this.points.frustumCulled = false;
  }
  spawn(p) {if (this.live.length < this.max) this.live.push({age: 0, angle: 0, spin: 0, sway: 0, phase: Math.random() * 6, drag: 1, gravity: 0, ...p});}
  update(dt) {
    const {position, aAlpha, aSize, aAngle, aTint} = this.attr;
    this.live = this.live.filter(p => (p.age += dt) < p.life);
    this.live.forEach((p, i) => {
      p.vy -= p.gravity * dt; p.vx *= Math.exp(-p.drag * dt); p.vy *= Math.exp(-p.drag * dt); p.vz *= Math.exp(-p.drag * dt);
      p.x += (p.vx + Math.sin(p.age * 2.4 + p.phase) * p.sway) * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.angle += p.spin * dt;
      const k = p.age / p.life;
      position.set([p.x, p.y, p.z], i * 3); aTint.set(p.tint, i * 3);
      aAlpha[i] = smooth(0, .12, k) * (1 - smooth(.55, 1, k)) * p.alpha; aSize[i] = p.size; aAngle[i] = p.angle + Math.sin(p.age * 3 + p.phase) * .4 * p.sway;
    });
    const g = this.points.geometry; g.setDrawRange(0, this.live.length);
    for (const k of Object.keys(this.attr)) g.attributes[k].needsUpdate = true;
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{onSelect?: (id: string) => void, onHover?: (id: string) => void, reducedMotion?: boolean}} [options]
 */
export async function mountHeroLogo(canvas, {onSelect = () => {}, onHover = () => {}, reducedMotion = false} = {}) {
  const renderer = new WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
  const scene = new Scene(), camera = new PerspectiveCamera(30, 1, .1, 80);
  const pmrem = new PMREMGenerator(renderer), env = pmrem.fromScene(new RoomEnvironment(), .04);
  scene.environment = env.texture; scene.environmentIntensity = ENV;

  const key = new DirectionalLight(0xfff0dc, KEY); key.position.set(-4, 5, 8);
  const rim = new DirectionalLight(0x8fb4ff, RIM); rim.position.set(5, -4, 3);
  const glint = new PointLight(0xffe2b8, GLINT, 11, 2); glint.position.set(0, 0, 3.2);
  const sweep = new PointLight(0xfff6e8, 0, 9, 2);
  scene.add(key, rim, glint, sweep);

  const tex = {dot: dotTexture(), feather: featherTexture(), streak: streakTexture(), flare: flareTexture()};
  const shadowTex = canvasTexture(256, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, s * 0.14, s / 2, s / 2, s * 0.48);
    r.addColorStop(0, 'rgba(16, 38, 28, 0.16)');
    r.addColorStop(0.38, 'rgba(16, 38, 28, 0.07)');
    r.addColorStop(0.72, 'rgba(16, 38, 28, 0.02)');
    r.addColorStop(1, 'rgba(16, 38, 28, 0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  });

  const holder = new Group(), spinner = new Group(); holder.add(spinner); scene.add(holder);
  const [gltf, meta] = await Promise.all([new GLTFLoader().loadAsync(MODEL), fetch(META).then(r => r.json())]);
  const model = gltf.scene; spinner.add(model);

  const gold = (k, opacity = 0) => new MeshBasicMaterial({color: glow('#ffd08a', k), transparent: true, opacity, depthWrite: false, blending: AdditiveBlending});
  const feathers = new Particles(80, tex.feather), dust = new Particles(160, tex.dot);
  spinner.add(feathers.points, dust.points);
  const top = meta.reliefTop + .012;

  // Hilo de oro que recorre la silueta; la chispa marca la punta mientras dibuja.
  function thread(curve, segments, radius) {
    const geo = new TubeGeometry(curve, segments, radius, 6, curve.closed);
    const mesh = new Mesh(geo, gold(2.1)); mesh.visible = false;
    const spark = new Sprite(new SpriteMaterial({map: tex.dot, color: glow('#fff1d6', 3), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending}));
    spark.scale.setScalar(.15); spark.visible = false;
    return {mesh, spark, curve, total: geo.index.count, unit: 36};
  }
  function drawThread(t, head, alpha) {
    const on = alpha > .002 && head > 0;
    t.mesh.visible = t.spark.visible = on; if (!on) return;
    t.mesh.material.opacity = alpha;
    t.mesh.geometry.setDrawRange(0, Math.floor(head * t.total / t.unit) * t.unit);
    t.spark.material.opacity = alpha * (1 - smooth(.92, 1, head));
    t.curve.getPointAt(Math.min(head, .9999), t.spark.position);
  }

  const tiles = {};
  ANIMAL_IDS.forEach((id, i) => {
    const node = model.getObjectByName('Animal_' + id), data = meta.animals[id];
    const golds = [];
    node.traverse(o => {
      const make = o.isMesh && FINISH[o.material.name];
      if (!make) return;
      o.material.dispose(); o.material = make();
      // El oro lleva su propio reflejo: con el del resto se apagaba hasta parecer bronce.
      if (o.material.metalness === 1) {o.material.envMap = env.texture; o.material.envMapIntensity = GOLD_ENV; golds.push(o.material);}
    });
    const outline = thread(new CatmullRomCurve3(data.outline.map(([x, y]) => new Vector3(x, y, top)), true, 'centripetal'), 720, .0065);
    node.add(outline.mesh, outline.spark);
    const home = node.position.clone();
    tiles[id] = {id, i, node, home, golds, outline, data, dir: new Vector2(Math.sign(home.x), Math.sign(home.y)), hover: 0, focus: false, start: -1, fired: new Set()};
  });

  // Gato: ojo de ámbar con pupila rasgada.
  const cat = tiles.cat, eye = new Group();
  {
    const w = .082, h = .046, almond = new Shape();
    almond.moveTo(-w, 0); almond.quadraticCurveTo(0, h * 2, w, 0); almond.quadraticCurveTo(0, -h * 2, -w, 0);
    const iris = new Mesh(new ShapeGeometry(almond, 24), new MeshBasicMaterial({color: glow('#ffb432', 2.4), transparent: true, opacity: 0, depthWrite: false}));
    const pupil = new Mesh(new CircleGeometry(1, 32), new MeshBasicMaterial({color: 0x04070b, transparent: true, opacity: 0, depthWrite: false}));
    pupil.scale.set(.011, .044, 1); pupil.position.z = .002;
    const shine = new Mesh(new CircleGeometry(.009, 16), new MeshBasicMaterial({color: glow('#ffffff', 2), transparent: true, opacity: 0, depthWrite: false}));
    shine.position.set(.022, .016, .004);
    const halo = new Sprite(new SpriteMaterial({map: tex.dot, color: glow('#ffae3a', 1.6), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending}));
    halo.scale.set(.5, .32, 1);
    eye.add(halo, iris, pupil, shine); eye.position.set(cat.data.eye[0], cat.data.eye[1], top + .004); eye.rotation.z = .16;
    eye.userData.parts = [iris, pupil, shine, halo]; eye.visible = false; cat.node.add(eye);
  }

  // Perro: ondas de sonido y ladrido alegre que irradian desde el hocico.
  const dog = tiles.dog;
  const ripples = [0, 1].map(() => {const m = new Mesh(new RingGeometry(.95, 1, 96), gold(2.6)); m.position.z = top + .02; m.visible = false; dog.node.add(m); return m;});

  // Caballo: ráfagas de viento que cruzan la pieza a contrapelo.
  const horse = tiles.horse;
  const streaks = Array.from({length: 9}, (_, k) => {
    const m = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({map: tex.streak, color: glow('#fff0d6', 2.2), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending}));
    m.visible = false; m.userData = {delay: .15 + k * .19 + rand(0, .08), y: rand(-.78, .78), len: rand(.5, 1.1), speed: rand(3.4, 4.6)};
    m.position.z = top + .1; horse.node.add(m); return m;
  });

  // Final: cruz de luz en los huecos y destello central.
  const span = meta.step + meta.half * 2, gap = meta.step - meta.half * 2;
  const cross = new Group();
  for (const [w, h] of [[gap * .42, span], [span, gap * .42]]) cross.add(new Mesh(new PlaneGeometry(w, h), gold(3.4)));
  cross.position.z = -.04; cross.visible = false; spinner.add(cross);
  const flare = new Sprite(new SpriteMaterial({map: tex.flare, color: glow('#fff3dd', 2.2), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending}));
  flare.position.z = .3; flare.visible = false; spinner.add(flare);

  // Sombra difusa de contacto para asentar el emblema sobre el fondo de la portada.
  const shadow = new Mesh(new PlaneGeometry(span * 1.5, span * 1.5), new MeshBasicMaterial({map: shadowTex, transparent: true, opacity: 0.85, depthWrite: false}));
  shadow.position.z = -.05; spinner.add(shadow);

  let width = 0, height = 0;
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    if (w === width && h === height) return;
    width = w; height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // El emblema ocupa el 60 % del lado corto y sube un poco: abajo vive la tarjeta.
    const fov = Math.tan(camera.fov * Math.PI / 360), need = (span / 2) / .6, halfH = Math.max(need, need / camera.aspect);
    camera.position.set(0, -halfH * .13, halfH / fov);
    camera.updateProjectionMatrix();
    const scale = h * renderer.getPixelRatio() / (2 * fov);
    feathers.material.uniforms.uScale.value = dust.material.uniforms.uScale.value = scale;
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();

  // Puntero: inclinación, luz que lo sigue, selección.
  const pointer = new Vector2(), aim = new Vector2(), ray = new Raycaster();
  let pointerIn = false, hovered = '', down = null, lastTouch = performance.now() / 1000;
  function pick(x, y) {
    ray.setFromCamera(new Vector2(x, y), camera);
    let o = ray.intersectObject(model, true)[0]?.object;
    while (o && !o.name.startsWith('Animal_')) o = o.parent;
    return o ? o.name.slice(7) : '';
  }
  function local(e) {const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1];}
  function move(e) {
    const [x, y] = local(e); pointer.set(x, y); pointerIn = e.pointerType === 'mouse';
    const id = e.pointerType === 'mouse' ? pick(x, y) : '';
    if (id !== hovered) {hovered = id; canvas.style.cursor = id ? 'pointer' : ''; onHover(id);}
  }
  function leave() {pointerIn = false; if (hovered) {hovered = ''; canvas.style.cursor = ''; onHover('');}}
  function press(e) {down = {x: e.clientX, y: e.clientY};}
  function release(e) {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) return;
    down = null; const id = pick(...local(e)); if (id) onSelect(id);
  }
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('pointerdown', press); canvas.addEventListener('pointerup', release);

  const played = new Set();
  let finaleStart = -1, introStart = -1, clockStart = performance.now(), last = 0, frame = 0, dead = false, visible = true, dim = 0, invite = 0;
  const now = () => (performance.now() - clockStart) / 1000;

  function play(id) {
    const t = tiles[id]; if (!t) return;
    const n = now(); lastTouch = n;
    if (t.start >= 0 && n - t.start < .7) return;
    t.start = n; t.fired.clear(); played.add(id);
  }
  function finale() {const n = now(); if (finaleStart < 0 || n - finaleStart > FINALE) finaleStart = n; lastTouch = n;}

  function burstFeathers(t) {
    const c = t.node.position;
    for (let k = 0; k < 26; k++) feathers.spawn({
      x: c.x + rand(-.35, .55), y: c.y + rand(-.25, .45), z: top + .1, vx: rand(-.7, .7), vy: rand(.5, 1.5), vz: rand(.4, 1.1),
      drag: 1.1, gravity: .18, sway: rand(.15, .35), spin: rand(-1.4, 1.4), angle: rand(-.6, .6), life: rand(2.2, 3), size: rand(.22, .38), alpha: rand(.7, 1),
      tint: Math.random() < .5 ? [1, .95, .86] : [1, .8, .52],
    });
  }
  function kickDust(t) {
    const c = t.node.position;
    for (let k = 0; k < 9; k++) dust.spawn({
      x: c.x + rand(-.2, .7), y: c.y - .82 + rand(0, .2), z: top + .05, vx: rand(-1.6, -.5), vy: rand(.15, .6), vz: rand(.1, .5),
      drag: 1.6, gravity: .3, life: rand(.8, 1.4), size: rand(.05, .11), alpha: rand(.6, 1), tint: [1, .82, .55],
    });
  }

  function update(t, dt) {
    const reduced = reducedMotion;
    // Inclinación hacia el cursor; sin cursor, una deriva lenta.
    aim.x = damp(aim.x, pointerIn ? pointer.x : Math.sin(t * .35) * .25, 3, dt);
    aim.y = damp(aim.y, pointerIn ? pointer.y : Math.cos(t * .27) * .18, 3, dt);
    if (!reduced) {holder.rotation.y = aim.x * .26; holder.rotation.x = -aim.y * .2;}
    glint.position.set(aim.x * 3.4, aim.y * 2.8, 3.1);

    const intro = introStart < 0 ? 0 : t - introStart;
    const f = finaleStart < 0 ? -1 : (t - finaleStart) / FINALE;
    const finaleOn = f >= 0 && f <= 1;
    const sep = finaleOn && !reduced ? .2 * win(f, 0, .16, .74, .95) : 0;
    spinner.rotation.y = finaleOn && !reduced ? inOut(clamp((f - .12) / .68)) * Math.PI * 2 : 0;
    const crossK = finaleOn ? win(f, .06, .22, .78, 1) : 0;
    cross.visible = crossK > .002; cross.scale.set(outQuart(clamp((f - .04) / .3)) || .001, outQuart(clamp((f - .04) / .3)) || .001, 1);
    cross.children.forEach(m => {m.material.opacity = crossK;});
    const flareK = finaleOn ? win(f, .12, .24, .3, .55) : 0;
    flare.visible = flareK > .002; flare.material.opacity = flareK; flare.scale.setScalar(.6 + 3.2 * flareK);

    // Invitación: si nadie toca, el marco del siguiente animal por descubrir destella.
    const pending = ANIMAL_IDS.filter(id => !played.has(id));
    const idle = t - lastTouch - 4.5, invited = pending.length && idle > 0 ? pending[Math.floor(idle / 5.5) % pending.length] : '';
    invite = invited ? win(idle % 5.5, 0, .35, .5, 1.3) : 0;

    let dimTarget = 0;
    for (const T of Object.values(tiles)) {
      const {node, home, dir} = T;
      let px = home.x, py = home.y, pz = 0, rx = 0, ry = 0, rz = 0, s = 1, shine = 0;
      if (!reduced) {
        const e = outQuart(clamp((intro - .1 - T.i * .12) / 1.6)), r = 1 - e;
        px += dir.x * r * 1.5; py += dir.y * r * 1.5; pz -= 5 * r * r; rx += dir.y * r * 1.1; ry -= dir.x * r * 1.1; rz += dir.x * dir.y * r * .5;
      }
      px += dir.x * sep; py += dir.y * sep;
      T.hover = damp(T.hover, hovered === T.id || T.focus ? 1 : 0, 9, dt);
      pz += T.hover * .14; shine += T.hover * .3 + (invited === T.id ? invite * .9 : 0) + (finaleOn ? .9 * win(f, .1, .3, .7, 1) : 0);

      // Firma de entrada: los cuatro hilos de oro a la vez, ya ensambladas.
      const sig = intro - 1.55;
      let head = sig > 0 ? outQuart(clamp(sig / 1.5)) : 0, alpha = sig > 0 ? 1 - smooth(1.7, 2.5, sig) : 0;

      const d = T.start < 0 ? -1 : t - T.start, D = DURATION[T.id];
      if (d >= 0 && d < D) {
        const lift = win(d, 0, .35, D - .9, D - .1);
        if (!reduced) {pz += lift * .26; s += lift * .03;}
        shine += lift * .7;
        head = outQuart(clamp(d / 1.2)); alpha = 1 - smooth(1.4, 2.1, d);
        const once = (k, at, fn) => {if (d >= at && !T.fired.has(k)) {T.fired.add(k); fn();}};
        if (T.id === 'cat') {
          dimTarget = Math.max(dimTarget, win(d, .1, .6, 2.6, 3.2));
          if (!reduced) {ry -= .22 * win(d, .3, 1, 1.9, 2.6); rz += Math.sin(d * 52) * .0035 * win(d, .5, .8, 2.2, 2.6);}
          const open = win(d, .55, .95, 2.5, 3), blink = reduced ? 0 : win(d, 1.7, 1.77, 1.8, 1.9);
          eye.visible = open > .002; eye.scale.set(1, Math.max(.06, 1 - .94 * blink), 1);
          eye.userData.parts.forEach((m, k) => {m.material.opacity = open * (k === 3 ? .9 : 1);});
        }
        if (T.id === 'dog') {
          // Ladrido: dos impulsos vivos de la cabeza hacia el frente y ondas que salen del hocico
          const barkImpulse = at => {
            const p = d - at;
            return p >= 0 && p <= .42 ? Math.sin(p / .42 * Math.PI) : 0;
          };
          const b1 = barkImpulse(.18), b2 = barkImpulse(.85);
          if (!reduced) {
            pz += (b1 * 1.1 + b2 * .9) * .22;
            rx -= (b1 * 1.2 + b2 * .95) * .13;
            ry += (b1 - b2 * .7) * .06;
            rz += (b1 * .06 - b2 * .04);
          }
          // Ondas acústicas que se expanden desde el hocico del perro
          [.18, .85].forEach((at, k) => {
            const q = (d - at) / .95, m = ripples[k];
            if (!m) return;
            const on = q > 0 && q < 1;
            m.visible = on;
            if (on) {
              m.position.set(.42, -.06, top + .02);
              m.scale.setScalar(.16 + 1.2 * outQuart(clamp(q)));
              m.material.opacity = .75 * (1 - clamp(q)) * (1 - clamp(q));
            }
          });
        }
        if (T.id === 'bird') {
          if (!reduced) {const e = win(d, .05, .2, 1, 1.8); rx += Math.sin(d * 21) * .1 * e; ry += Math.sin(d * 7) * .05 * e; pz += .22 * win(d, 0, .4, 1.6, 2.6);}
          once('feathers', .12, () => burstFeathers(T));
        }
        if (T.id === 'horse') {
          const env = win(d, .05, .3, 2, 2.6), ph = d * Math.PI * 2 * 2.4;
          if (!reduced) {rx += Math.sin(ph) * .11 * env; rz += Math.sin(ph + 1) * .035 * env; pz += Math.abs(Math.sin(ph)) * .1 * env; px += Math.sin(ph * .5) * .03 * env;}
          once('beat' + Math.floor(ph / Math.PI), .05, () => {if (env > .2) kickDust(T);});
          for (const m of streaks) {
            const {delay, y, len, speed} = m.userData, q = d - delay, x = 1.35 - q * speed;
            m.visible = q > 0 && x > -1.6; m.position.set(x, y, top + .1); m.scale.set(len, .016, 1);
            m.material.opacity = .9 * smooth(1.35, 1, x) * smooth(-1.6, -1.1, x);
          }
        }
      } else if (T.start >= 0) {
        if (T.id === 'cat') eye.visible = false;
        if (T.id === 'dog') {ripples.forEach(m => {m.visible = false;});}
        if (T.id === 'horse') streaks.forEach(m => {m.visible = false;});
      }
      drawThread(T.outline, head, alpha);
      node.position.set(px, py, pz); node.rotation.set(rx, ry, rz); node.scale.setScalar(s);
      for (const g of T.golds) {g.emissiveIntensity = shine; g.envMapIntensity = GOLD_ENV * (1 - .7 * dim);}
    }

    // La sala se apaga cuando el gato abre el ojo.
    dim = damp(dim, dimTarget, 5, dt);
    key.intensity = KEY * (1 - .75 * dim); rim.intensity = RIM * (1 - .4 * dim); glint.intensity = GLINT * (1 - .7 * dim);
    scene.environmentIntensity = ENV * (1 - .78 * dim);

    // Barrido de luz sobre el barniz justo al terminar de ensamblarse.
    const sw = (intro - 1.2) / 1.7;
    sweep.intensity = reduced || sw <= 0 || sw >= 1 ? 0 : 22 * Math.sin(Math.PI * sw);
    sweep.position.set(-4.2 + 8.4 * sw, 3.4 - 6.8 * sw, 2.2);

    feathers.update(dt); dust.update(dt);
  }

  function render() {
    if (dead) return;
    frame = requestAnimationFrame(render);
    if (!visible) return;
    resize();
    const t = now(), dt = Math.min(.05, t - last || .016); last = t;
    if (introStart < 0) introStart = t;
    update(t, dt);
    renderer.render(scene, camera);
  }
  // Fuera de pantalla o con la pestaña oculta no se dibuja nada.
  const io = new IntersectionObserver(([e]) => {visible = e.isIntersecting && !document.hidden;}); io.observe(canvas);
  const onVis = () => {visible = !document.hidden; last = now();}; document.addEventListener('visibilitychange', onVis);
  render();

  return {
    play, finale,
    focus(id) {for (const T of Object.values(tiles)) T.focus = T.id === id;},
    destroy() {
      dead = true; cancelAnimationFrame(frame); observer.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointerdown', press); canvas.removeEventListener('pointerup', release);
      scene.traverse(o => {o.geometry?.dispose(); [].concat(o.material || []).forEach(m => m?.dispose?.());});
      if (tex) Object.values(tex).forEach(x => x?.dispose?.());
      if (shadowTex) shadowTex.dispose?.();
      env?.dispose?.(); pmrem?.dispose?.(); renderer?.dispose?.();
    },
  };
}
