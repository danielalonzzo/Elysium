/**
 * Emblema vivo de la portada de 3VET: el modelo de Blender
 * (`scripts/logo3d/build_logo.py`), calcado del cartel de la clínica de
 * Mirandela, puesto sobre la página con luz de estudio cálida.
 *
 * - Entrada: los tres tramos del «3» llegan uno a uno desde el fondo, las letras
 *   V, E y T caen con un pequeño rebote, «Saúde Animal» se asienta y el gato y el
 *   perro se dibujan con un hilo de oro antes de aparecer.
 * - El emblema se inclina hacia el cursor y un punto de luz lo sigue.
 * - Cuatro gestos, cada uno con algo cierto de la clínica:
 *   · el «3» son tres veterinarios: sus tres tramos se separan, giran por turnos
 *     y sueltan polvo de su propio color;
 *   · «VET» late dos veces y un electrocardiograma de oro lo cruza: urgencias 24 h;
 *   · el gato parpadea, ladea la cabeza y mueve los bigotes;
 *   · el perro sonríe, menea la cabeza y ladra en ondas desde el hocico.
 * - Con los cuatro despiertos, el gato y el perro se acercan, sube un corazón con
 *   el degradado de la marca y el emblema da una vuelta completa.
 *
 * Piezas, centros, cajas y contornos vienen del JSON que escribe el mismo script
 * de Blender: la web nunca adivina dónde está cada trazo.
 */
import {AdditiveBlending,BufferAttribute,BufferGeometry,CanvasTexture,CatmullRomCurve3,Color,CurvePath,DirectionalLight,ExtrudeGeometry,Group,LineCurve3,Mesh,MeshBasicMaterial,MeshPhysicalMaterial,NeutralToneMapping,PerspectiveCamera,PlaneGeometry,PMREMGenerator,PointLight,Points,Raycaster,RingGeometry,Scene,ShaderMaterial,Shape,Sprite,SpriteMaterial,SRGBColorSpace,TubeGeometry,Vector2,Vector3,WebGLRenderer} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {url} from '../core/config';

const MODEL = url('/models/3vet-logo-3d.glb?v=1'), META = url('/models/3vet-logo-3d.json?v=1');
export const GROUP_IDS = ['three', 'vet', 'cat', 'dog'];
const DURATION = {three: 3.6, vet: 3.2, cat: 3.2, dog: 3};
const FINALE = 5.2;
const ENV = .55, KEY = 1.35, RIM = .55, GLINT = 4;
// Los tres colores del «3», sacados del cartel: naranja, amarillo de unión y verde petróleo.
const TRIO = {top: '#ef7d1f', dot: '#f2d21b', bottom: '#11a9a0'};
const GOLD = '#e7ac12';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t);};
const win = (v, a, b, c, d) => smooth(a, b, v) * (1 - smooth(c, d, v));
const outQuart = p => 1 - Math.pow(1 - p, 4);
const outBack = p => {const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);};
const inOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const damp = (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));
const rand = (a, b) => a + Math.random() * (b - a);
const glow = (hex, k) => new Color(hex).multiplyScalar(k);
const pulse = (d, at, len) => {const p = (d - at) / len; return p > 0 && p < 1 ? Math.sin(p * Math.PI) : 0;};

function canvasTexture(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}
const dotTexture = () => canvasTexture(64, (g, s) => {
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.3, 'rgba(255,255,255,.7)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, s, s);
});
const flareTexture = () => canvasTexture(256, (g, s) => {
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.14, 'rgba(255,226,150,.65)'); r.addColorStop(.5, 'rgba(255,190,90,.08)'); r.addColorStop(1, 'rgba(255,190,90,0)');
  g.fillStyle = r; g.fillRect(0, 0, s, s);
});
const shadowTexture = () => canvasTexture(256, (g, s) => {
  const r = g.createRadialGradient(s / 2, s / 2, s * .1, s / 2, s / 2, s * .5);
  r.addColorStop(0, 'rgba(70,45,10,.14)'); r.addColorStop(.45, 'rgba(70,45,10,.05)'); r.addColorStop(1, 'rgba(70,45,10,0)');
  g.fillStyle = r; g.fillRect(0, 0, s, s);
});

/** Partículas con giro propio y tinte por partícula: el polvo de color de cada veterinario. */
class Particles {
  constructor(max, map) {
    this.max = max; this.live = [];
    const g = new BufferGeometry();
    this.attr = {position: new Float32Array(max * 3), aAlpha: new Float32Array(max), aSize: new Float32Array(max), aTint: new Float32Array(max * 3)};
    for (const [k, v] of Object.entries(this.attr)) g.setAttribute(k, new BufferAttribute(v, k === 'position' || k === 'aTint' ? 3 : 1));
    this.material = new ShaderMaterial({
      uniforms: {uMap: {value: map}, uScale: {value: 600}}, transparent: true, depthWrite: false, blending: AdditiveBlending,
      vertexShader: 'attribute float aAlpha,aSize;attribute vec3 aTint;uniform float uScale;varying float vAlpha;varying vec3 vTint;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=aSize*uScale/-mv.z;vAlpha=aAlpha;vTint=aTint;}',
      fragmentShader: 'uniform sampler2D uMap;varying float vAlpha;varying vec3 vTint;void main(){vec4 t=texture2D(uMap,gl_PointCoord);gl_FragColor=vec4(t.rgb*vTint,t.a*vAlpha);}',
    });
    this.points = new Points(g, this.material); this.points.frustumCulled = false;
  }
  spawn(p) {if (this.live.length < this.max) this.live.push({age: 0, drag: 1, gravity: 0, ...p});}
  update(dt) {
    const {position, aAlpha, aSize, aTint} = this.attr;
    this.live = this.live.filter(p => (p.age += dt) < p.life);
    this.live.forEach((p, i) => {
      p.vy -= p.gravity * dt; const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      const a = p.age / p.life;
      position.set([p.x, p.y, p.z], i * 3); aTint.set(p.tint, i * 3);
      aAlpha[i] = smooth(0, .1, a) * (1 - smooth(.5, 1, a)) * p.alpha; aSize[i] = p.size;
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
  // Neutral y no ACES: el naranja, el amarillo y el petróleo de la marca no se lavan.
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = NeutralToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new Scene(), camera = new PerspectiveCamera(28, 1, .1, 80);
  const pmrem = new PMREMGenerator(renderer), env = pmrem.fromScene(new RoomEnvironment(), .04);
  scene.environment = env.texture; scene.environmentIntensity = ENV;

  const key = new DirectionalLight(0xfff1dc, KEY); key.position.set(-4, 5, 8);
  const rim = new DirectionalLight(0xbfe9ff, RIM); rim.position.set(5, -4, 3);
  const glint = new PointLight(0xffe7c0, GLINT, 12, 2); glint.position.set(0, 0, 3.4);
  const sweep = new PointLight(0xfff6e8, 0, 10, 2);
  scene.add(key, rim, glint, sweep);

  const tex = {dot: dotTexture(), flare: flareTexture(), shadow: shadowTexture()};
  const holder = new Group(), spinner = new Group(); holder.add(spinner); scene.add(holder);
  const [gltf, meta] = await Promise.all([new GLTFLoader().loadAsync(MODEL), fetch(META).then(r => r.json())]);
  const model = gltf.scene;
  const [bx0, by0, bx1, by1] = meta.bounds;
  const BW = bx1 - bx0, BH = by1 - by0, top = meta.reliefTop + .02;

  // Materiales: lacado con el color del cartel por vértice, esmalte de oro para los
  // trazos y oliva para «Saúde Animal». Cada grupo tiene los suyos para poder encenderlos aparte.
  const lacquer = () => new MeshPhysicalMaterial({vertexColors: true, roughness: .26, clearcoat: 1, clearcoatRoughness: .05, sheen: .25, sheenColor: new Color('#fff4dc'), emissive: new Color('#ffffff'), emissiveIntensity: 0, transparent: true, opacity: 1});
  const enamel = () => new MeshPhysicalMaterial({color: GOLD, metalness: .42, roughness: .3, clearcoat: .8, clearcoatRoughness: .08, emissive: new Color('#ffc21a'), emissiveIntensity: 0, transparent: true, opacity: 1});
  const olive = new MeshPhysicalMaterial({color: '#8a7427', metalness: .25, roughness: .42, clearcoat: .3, transparent: true, opacity: 1});

  const groups = {};
  for (const id of GROUP_IDS) {
    const g = new Group(); g.name = 'G_' + id;
    const ids = meta.groups[id] || [];
    const xs = ids.map(k => meta.pieces[k].center[0]), ys = ids.map(k => meta.pieces[k].center[1]);
    g.position.set(xs.reduce((a, b) => a + b, 0) / xs.length, ys.reduce((a, b) => a + b, 0) / ys.length, 0);
    g.userData.home = g.position.clone();
    spinner.add(g);
    groups[id] = {id, node: g, pieces: [], mats: [], hover: 0, focus: false, start: -1, fired: new Set(), threads: []};
  }
  const vivid = new Color();
  for (const mesh of [...model.children]) {
    if (!mesh.isMesh) continue;
    const info = meta.pieces[mesh.name] || (mesh.name === 'Saude' ? meta.pieces['vet-tagline'] : null);
    if (!info) continue;
    const G = groups[info.group];
    const old = mesh.material.name;
    mesh.material.dispose();
    if (old === 'Lacado 3VET') {
      // Un poco más de saturación: el JPEG del cartel apaga los colores.
      const col = mesh.geometry.getAttribute('color');
      if (col) for (let i = 0; i < col.count; i++) {
        vivid.setRGB(col.getX(i), col.getY(i), col.getZ(i));
        const hsl = {}; vivid.getHSL(hsl); vivid.setHSL(hsl.h, clamp(hsl.s * 1.18), clamp(hsl.l * .97));
        col.setXYZ(i, vivid.r, vivid.g, vivid.b);
      }
      mesh.material = lacquer();
    } else if (old === 'Texto oliva') mesh.material = olive;
    else mesh.material = enamel();
    if (mesh.name === 'three-dot') {mesh.material.vertexColors = false; mesh.material.color.set(TRIO.dot); mesh.material.emissive.set(TRIO.dot);}
    G.mats.push(mesh.material);
    const wp = mesh.position.clone();
    G.node.add(mesh); mesh.position.copy(wp.sub(G.node.position));
    mesh.userData = {id: mesh.name === 'Saude' ? 'vet-tagline' : mesh.name, role: info.role, home: mesh.position.clone(), homeScale: mesh.scale.clone(), info};
    G.pieces.push(mesh);
  }
  const piece = (gid, id) => groups[gid].pieces.find(m => m.userData.id === id);
  const rolePieces = (gid, re) => groups[gid].pieces.filter(m => re.test(m.userData.role));

  // Bigotes: giran desde su punta interior, no desde el centro.
  for (const m of rolePieces('cat', /^whisker/)) {
    const [x0, , x1] = m.userData.info.box, left = m.userData.role === 'whisker-l';
    const pivot = new Group(), G = groups.cat.node;
    pivot.position.set((left ? x1 : x0) - G.position.x, m.userData.info.center[1] - G.position.y, 0);
    G.add(pivot); const local = m.position.clone().sub(pivot.position); pivot.add(m); m.position.copy(local); m.userData.home = local.clone();
    m.userData.pivot = pivot; m.userData.side = left ? -1 : 1;
  }

  // Hilos de oro: dibujan cada trazo del gato y del perro en la entrada, y el
  // contorno de cada pieza que se toca.
  const goldLine = (k, opacity = 0) => new MeshBasicMaterial({color: glow('#ffd36a', k), transparent: true, opacity, depthWrite: false, blending: AdditiveBlending});
  function thread(curve, segments, radius, parent) {
    const geo = new TubeGeometry(curve, segments, radius, 6, curve.closed);
    const mesh = new Mesh(geo, goldLine(2.2)); mesh.visible = false;
    const spark = new Sprite(new SpriteMaterial({map: tex.dot, color: glow('#fff1d0', 3), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending}));
    spark.scale.setScalar(.16); spark.visible = false;
    parent.add(mesh, spark);
    return {mesh, spark, curve, total: geo.index.count, unit: 36};
  }
  function drawThread(t, head, alpha) {
    const on = alpha > .002 && head > 0;
    t.mesh.visible = t.spark.visible = on; if (!on) return;
    t.mesh.material.opacity = alpha;
    t.mesh.geometry.setDrawRange(0, Math.floor(head * t.total / t.unit) * t.unit);
    t.spark.material.opacity = alpha * (1 - smooth(.9, 1, head));
    t.curve.getPointAt(Math.min(head, .9999), t.spark.position);
  }
  for (const G of Object.values(groups)) {
    for (const m of G.pieces) {
      const o = m.userData.info.outline; if (!o) continue;
      const P = G.node.position;
      const pts = o.map(([x, y]) => new Vector3(x - P.x, y - P.y, top + .01));
      const big = G.id === 'three' || G.id === 'vet';
      G.threads.push(thread(new CatmullRomCurve3(pts, true, 'centripetal'), big ? 360 : 240, big ? .012 : .008, G.node));
    }
  }

  // VET: electrocardiograma que cruza las letras (urgencias 24 h).
  const vetBox = ['vet-V', 'vet-E', 'vet-T'].map(k => meta.pieces[k].box);
  const ex0 = Math.min(...vetBox.map(b => b[0])) - .25, ex1 = Math.max(...vetBox.map(b => b[2])) + .25;
  const ey = (Math.min(...vetBox.map(b => b[1])) + Math.max(...vetBox.map(b => b[3]))) / 2 - groups.vet.node.position.y;
  const ecgPts = [[0, 0], [.2, 0], [.26, .08], [.3, 0], [.37, 0], [.4, -.14], [.44, .78], [.48, -.42], [.52, 0], [.62, 0], [.67, .16], [.73, 0], [1, 0]];
  const ecgPath = new CurvePath();
  const ex = x => ex0 + (ex1 - ex0) * x - groups.vet.node.position.x;
  for (let i = 1; i < ecgPts.length; i++) {
    const [ax, ay] = ecgPts[i - 1], [bx, by] = ecgPts[i];
    ecgPath.add(new LineCurve3(new Vector3(ex(ax), ey + ay * .9, top + .14), new Vector3(ex(bx), ey + by * .9, top + .14)));
  }
  const ecg = thread(ecgPath, 520, .022, groups.vet.node);
  ecg.mesh.material.color = glow('#ffe08a', 2.6);

  // Perro: ondas de ladrido desde el hocico.
  const nose = meta.pieces['dog-muzzle'];
  const ripples = [0, 1].map(() => {
    const m = new Mesh(new RingGeometry(.95, 1, 96), goldLine(2.4));
    m.position.set(nose.box[2] - groups.dog.node.position.x - .05, (nose.box[1] + nose.box[3]) / 2 - groups.dog.node.position.y + .2, top + .05);
    m.visible = false; groups.dog.node.add(m); return m;
  });

  // Final: corazón con el degradado de la marca entre el gato y el perro.
  const heartShape = new Shape();
  heartShape.moveTo(0, -.32);
  heartShape.bezierCurveTo(-.06, -.24, -.4, -.04, -.4, .14);
  heartShape.bezierCurveTo(-.4, .32, -.2, .4, 0, .24);
  heartShape.bezierCurveTo(.2, .4, .4, .32, .4, .14);
  heartShape.bezierCurveTo(.4, -.04, .06, -.24, 0, -.32);
  const heartGeo = new ExtrudeGeometry(heartShape, {depth: .08, bevelEnabled: true, bevelThickness: .05, bevelSize: .04, bevelSegments: 4, curveSegments: 24});
  heartGeo.center();
  {
    const pos = heartGeo.getAttribute('position'), cols = new Float32Array(pos.count * 3), c = new Color(), a = new Color(TRIO.top), b = new Color(TRIO.dot), d = new Color(TRIO.bottom);
    for (let i = 0; i < pos.count; i++) {
      const k = clamp((pos.getY(i) + .36) / .72);
      if (k > .5) c.copy(b).lerp(a, (k - .5) * 2); else c.copy(d).lerp(b, k * 2);
      cols.set([c.r, c.g, c.b], i * 3);
    }
    heartGeo.setAttribute('color', new BufferAttribute(cols, 3));
  }
  const heart = new Mesh(heartGeo, new MeshPhysicalMaterial({vertexColors: true, roughness: .22, clearcoat: 1, clearcoatRoughness: .04, transparent: true, opacity: 0}));
  heart.visible = false; spinner.add(heart);
  const heartHome = new Vector3((meta.pieces['cat-head'].box[2] + meta.pieces['dog-head'].box[0]) / 2, (meta.pieces['cat-head'].box[3] + meta.pieces['vet-tagline'].box[1]) / 2, .3);
  const flare = new Sprite(new SpriteMaterial({map: tex.flare, color: glow('#fff1d8', 2), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending}));
  flare.visible = false; spinner.add(flare);

  const dust = new Particles(260, tex.dot);
  spinner.add(dust.points);
  const shadow = new Mesh(new PlaneGeometry(BW * 1.7, BH * 1.5), new MeshBasicMaterial({map: tex.shadow, transparent: true, depthWrite: false}));
  shadow.position.set((bx0 + bx1) / 2, (by0 + by1) / 2, -.08); spinner.add(shadow);
  spinner.position.set(-(bx0 + bx1) / 2, -(by0 + by1) / 2, 0);

  let width = 0, height = 0;
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    if (w === width && h === height) return;
    width = w; height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // El emblema ocupa el 64 % del alto y sube: abajo vive la tarjeta del gesto.
    const fov = Math.tan(camera.fov * Math.PI / 360), needH = (BH / 2) / .58, needW = (BW / 2) / .72;
    const halfH = Math.max(needH, needW / camera.aspect);
    camera.position.set(0, -halfH * .25, halfH / fov);
    camera.updateProjectionMatrix();
    dust.material.uniforms.uScale.value = h * renderer.getPixelRatio() / (2 * fov);
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();

  // Puntero: inclinación, luz que lo sigue, selección por grupo.
  const pointer = new Vector2(), aim = new Vector2(), ray = new Raycaster();
  let pointerIn = false, hovered = '', down = null, lastTouch = 0;
  function pick(x, y) {
    ray.setFromCamera(new Vector2(x, y), camera);
    let o = ray.intersectObject(spinner, true).find(h => h.object.isMesh && h.object.userData.info)?.object;
    while (o && !o.name.startsWith('G_')) o = o.parent;
    return o ? o.name.slice(2) : '';
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
  let finaleStart = -1, introStart = -1, clockStart = performance.now(), last = 0, frame = 0, dead = false, visible = true, invite = 0;
  const now = () => (performance.now() - clockStart) / 1000;

  function play(id) {
    const G = groups[id]; if (!G) return;
    const n = now(); lastTouch = n;
    if (G.start >= 0 && n - G.start < .7) return;
    G.start = n; G.fired.clear(); played.add(id);
  }
  function finale() {const n = now(); if (finaleStart < 0 || n - finaleStart > FINALE) finaleStart = n; lastTouch = n;}

  function burst(m, hex, n = 22) {
    const p = new Vector3(); m.getWorldPosition(p); spinner.worldToLocal(p);
    const c = new Color(hex);
    for (let k = 0; k < n; k++) dust.spawn({
      x: p.x + rand(-.3, .3), y: p.y + rand(-.3, .3), z: top + .1, vx: rand(-1.2, 1.2), vy: rand(-.6, 1.4), vz: rand(.3, 1.2),
      drag: 1.5, gravity: .5, life: rand(1, 1.8), size: rand(.08, .17), alpha: rand(.7, 1), tint: [c.r * 1.6, c.g * 1.6, c.b * 1.6],
    });
  }

  function update(t, dt) {
    const reduced = reducedMotion;
    aim.x = damp(aim.x, pointerIn ? pointer.x : Math.sin(t * .33) * .22, 3, dt);
    aim.y = damp(aim.y, pointerIn ? pointer.y : Math.cos(t * .25) * .16, 3, dt);
    if (!reduced) {holder.rotation.y = aim.x * .24; holder.rotation.x = -aim.y * .18;}
    glint.position.set(aim.x * 3.6, aim.y * 3, 3.3);

    const intro = introStart < 0 ? 0 : (reduced ? 99 : t - introStart);
    const f = finaleStart < 0 ? -1 : (t - finaleStart) / FINALE;
    const finaleOn = f >= 0 && f <= 1;
    spinner.rotation.y = finaleOn && !reduced ? inOut(clamp((f - .5) / .45)) * Math.PI * 2 : 0;

    const pending = GROUP_IDS.filter(id => !played.has(id));
    const idle = t - Math.max(lastTouch, introStart + 4) - 3.5, invited = pending.length && idle > 0 ? pending[Math.floor(idle / 5) % pending.length] : '';
    invite = invited ? win(idle % 5, 0, .35, .5, 1.3) : 0;

    for (const G of Object.values(groups)) {
      const {node} = G;
      const home = node.userData.home;
      let px = home.x, py = home.y, pz = 0, rx = 0, ry = 0, rz = 0, s = 1, shine = 0;
      G.hover = damp(G.hover, hovered === G.id || G.focus ? 1 : 0, 9, dt);
      pz += G.hover * .16; shine += G.hover * .25 + (invited === G.id ? invite * .8 : 0);
      const d = G.start < 0 ? -1 : t - G.start, D = DURATION[G.id];
      const active = d >= 0 && d < D;
      const lift = active ? win(d, 0, .3, D - .8, D - .1) : 0;
      shine += lift * .5 + (finaleOn ? .6 * win(f, .1, .3, .7, 1) : 0);
      // Brillo de base; los gestos del «3» y de VET lo sustituyen por el suyo.
      for (const m of G.mats) {
        if (!m.emissive) continue;
        if (m.vertexColors) m.emissive.set('#ffffff');
        else if (G.id === 'three') m.emissive.set(TRIO.dot);
        m.emissiveIntensity = (m.vertexColors ? .12 : G.id === 'three' ? .3 : .9) * shine;
      }

      // Entrada por grupo.
      let reveal = 1;
      for (const m of G.pieces) {m.position.copy(m.userData.home); m.rotation.set(0, 0, 0); m.scale.copy(m.userData.homeScale);}
      if (G.id === 'three') {
        G.pieces.forEach(m => {
          const i = ['top', 'dot', 'bottom'].indexOf(m.userData.role);
          const e = outQuart(clamp((intro - .1 - i * .22) / 1.3)), r = 1 - e;
          m.position.z -= 6 * r * r; m.position.x -= 1.6 * r; m.rotation.y = -2.2 * r; m.material.opacity = smooth(0, .25, e);
        });
      } else if (G.id === 'vet') {
        G.pieces.forEach(m => {
          const i = ['V', 'E', 'T', 'tagline'].indexOf(m.userData.role);
          const p = clamp((intro - .55 - i * .14) / .9), e = outBack(p);
          if (m.userData.role === 'tagline') {m.position.y -= .25 * (1 - outQuart(p)); m.material.opacity = smooth(0, .6, p);} else {m.position.y += 2.6 * (1 - e); m.material.opacity = smooth(0, .15, p);}
        });
      } else {
        // El gato y el perro: primero el hilo de oro, después el esmalte.
        const d0 = intro - (G.id === 'cat' ? 1.2 : 1.5);
        reveal = smooth(.9, 1.6, d0);
        G.mats.forEach(mm => {mm.opacity = reveal;});
        G.threads.forEach(th => drawThread(th, outQuart(clamp(d0 / 1.2)), d0 > 0 ? 1 - smooth(1.3, 2.1, d0) : 0));
      }

      if (active) {
        if (!reduced) pz += lift * .22;
        const once = (k, at, fn) => {if (d >= at && !G.fired.has(k)) {G.fired.add(k); fn();}};
        // Contorno de oro de cada pieza al despertarla.
        if (G.id === 'three' || G.id === 'vet') G.threads.forEach(th => drawThread(th, outQuart(clamp(d / 1.3)), 1 - smooth(1.5, 2.3, d)));

        if (G.id === 'three') {
          // Tres veterinarios: cada tramo se separa, gira a su turno y suelta su color.
          G.pieces.forEach(m => {
            const role = m.userData.role, i = ['top', 'dot', 'bottom'].indexOf(role);
            const out = win(d, .1, .5, 2.6, 3.3);
            const dir = role === 'top' ? [-.18, .32, .25] : role === 'dot' ? [.32, 0, .6] : [-.18, -.32, .25];
            if (!reduced) {
              m.position.x += dir[0] * out; m.position.y += dir[1] * out; m.position.z += dir[2] * out;
              m.rotation.y += inOut(clamp((d - .5 - i * .5) / .8)) * Math.PI * 2;
            }
            m.material.emissive.set(TRIO[role]); m.material.emissiveIntensity = .12 + .55 * win(d, .5 + i * .5, .8 + i * .5, 1.3 + i * .5, 1.9 + i * .5);
            once('dust' + role, .9 + i * .5, () => burst(m, TRIO[role]));
          });
        }
        if (G.id === 'vet') {
          // Urgências 24h: dos latidos y el electrocardiograma.
          const beat = pulse(d, .25, .28) + .7 * pulse(d, .55, .28) + pulse(d, 1.45, .28) + .7 * pulse(d, 1.75, .28);
          if (!reduced) s += beat * .07;
          drawThread(ecg, clamp((d - .2) / 1.7), 1 - smooth(2.3, 3, d));
          G.pieces.forEach(m => {if (m.material.vertexColors) {m.material.emissive.set('#ffb347'); m.material.emissiveIntensity = .06 + beat * .35;}});
        }
        if (G.id === 'cat') {
          // Parpadeo doble, cabeza ladeada y bigotes que tiemblan.
          const blink = Math.max(win(d, .5, .58, .62, .72), win(d, .85, .93, .97, 1.07), win(d, 2.2, 2.28, 2.32, 2.42));
          rolePieces('cat', /^eye/).forEach(m => {m.scale.y = Math.max(.08, 1 - .92 * blink);});
          if (!reduced) rz += .14 * win(d, .2, .7, 2.2, 2.9);
          rolePieces('cat', /^whisker/).forEach((m, k) => {
            const e = win(d, .9, 1.1, 2, 2.4);
            m.userData.pivot.rotation.z = Math.sin(d * 38 + k) * .16 * e * m.userData.side;
          });
          once('dust', 1, () => burst(piece('cat', 'cat-muzzle'), GOLD, 12));
        }
        if (G.id === 'dog') {
          const b1 = pulse(d, .2, .4), b2 = pulse(d, .85, .4);
          if (!reduced) {rz += Math.sin(d * 9) * .07 * win(d, .1, .3, 2.2, 2.8); pz += (b1 + b2 * .8) * .12;}
          const muzzle = piece('dog', 'dog-muzzle');
          if (muzzle) {muzzle.scale.set(1 + .08 * (b1 + b2), 1 + .14 * (b1 + b2), 1); muzzle.position.y += .05 * (b1 + b2);}
          rolePieces('dog', /^head/).forEach(m => {m.rotation.z = Math.sin(d * 16) * .03 * win(d, .1, .3, 1.8, 2.4);});
          [.2, .85].forEach((at, k) => {
            const q = (d - at) / .95, m = ripples[k], on = q > 0 && q < 1;
            m.visible = on;
            if (on) {m.scale.setScalar(.15 + 1.1 * outQuart(clamp(q))); m.material.opacity = .8 * (1 - q) * (1 - q);}
          });
        }
      } else if (G.start >= 0) {
        if (G.id === 'dog') ripples.forEach(m => {m.visible = false;});
        if (G.id === 'vet') drawThread(ecg, 0, 0);
        if (G.id === 'three' || G.id === 'vet') G.threads.forEach(th => drawThread(th, 0, 0));
        rolePieces('cat', /^whisker/).forEach(m => {if (G.id === 'cat') m.userData.pivot.rotation.z = 0;});
      }

      // Final: el gato y el perro se acercan; el resto se enciende.
      if (finaleOn) {
        const lean = win(f, .05, .25, .6, .8);
        if (!reduced && G.id === 'cat') {px += .14 * lean; rz -= .12 * lean;}
        if (!reduced && G.id === 'dog') {px -= .14 * lean; rz += .12 * lean;}
      }

      node.position.set(px, py, pz); node.rotation.set(rx, ry, rz); node.scale.setScalar(s);
    }

    // Corazón del final.
    const hk = finaleOn ? win(f, .15, .32, .78, .95) : 0;
    heart.visible = hk > .002; heart.material.opacity = hk;
    if (heart.visible) {
      heart.position.copy(heartHome); heart.position.y += .5 * outQuart(clamp((f - .15) / .4)) + Math.sin(t * 3) * .03;
      heart.scale.setScalar(.6 + .55 * outBack(clamp((f - .15) / .25))); heart.rotation.y = Math.sin(t * 2) * .35;
    }
    const fk = finaleOn ? win(f, .14, .22, .26, .5) : 0;
    flare.visible = fk > .002; flare.material.opacity = fk; flare.scale.setScalar(.6 + 3 * fk); flare.position.copy(heartHome);
    if (finaleOn && f > .2 && !groups.cat.fired.has('finale-dust')) {
      groups.cat.fired.add('finale-dust');
      burst(heart, TRIO.top, 14); burst(heart, TRIO.dot, 14); burst(heart, TRIO.bottom, 14);
    }
    if (!finaleOn) groups.cat.fired.delete('finale-dust');

    const sw = (intro - 1.6) / 1.6;
    sweep.intensity = reduced || sw <= 0 || sw >= 1 ? 0 : 18 * Math.sin(Math.PI * sw);
    sweep.position.set(-4.4 + 8.8 * sw, 3.4 - 6.8 * sw, 2.4);
    dust.update(dt);
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
  const io = new IntersectionObserver(([e]) => {visible = e.isIntersecting && !document.hidden;}); io.observe(canvas);
  const onVis = () => {visible = !document.hidden; last = now();}; document.addEventListener('visibilitychange', onVis);
  render();

  return {
    play, finale,
    focus(id) {for (const G of Object.values(groups)) G.focus = G.id === id;},
    destroy() {
      dead = true; cancelAnimationFrame(frame); observer.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointerdown', press); canvas.removeEventListener('pointerup', release);
      scene.traverse(o => {o.geometry?.dispose(); [].concat(o.material || []).forEach(m => m?.dispose?.());});
      Object.values(tex).forEach(x => x?.dispose?.());
      env?.dispose?.(); pmrem?.dispose?.(); renderer?.dispose?.();
    },
  };
}
