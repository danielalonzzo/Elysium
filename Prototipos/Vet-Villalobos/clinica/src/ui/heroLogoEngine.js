/**
 * Emblema vivo de la portada: el modelo de Blender (`scripts/logo3d/build_logo.py`)
 * puesto en una vitrina con luz de estudio.
 *
 * - Entrada: el disco de porcelana se asienta, los dos paneles llegan desde los
 *   lados y un hilo de luz firma cada silueta mientras una luz barre el barniz.
 * - El emblema se inclina hacia el cursor y un punto de luz lo sigue.
 * - Cada animal tiene su gesto: el gato apaga la sala y abre un ojo de ámbar, y
 *   el perro ladra con dos impulsos de la cabeza y ondas que salen del hocico.
 * - Con los dos despiertos se separan los paneles, se enciende entre ellos una
 *   línea de luz, el aro de acero brilla y el emblema da una vuelta completa.
 *
 * Los contornos y las anclas (ojo del gato, ojo y hocico del perro) vienen del
 * JSON que escribe el mismo script de Blender, así que la web nunca adivina dónde
 * está cada silueta.
 */
import {ACESFilmicToneMapping,AdditiveBlending,CanvasTexture,CatmullRomCurve3,CircleGeometry,Color,DirectionalLight,Group,Mesh,MeshBasicMaterial,MeshPhysicalMaterial,PerspectiveCamera,PlaneGeometry,PMREMGenerator,PointLight,Raycaster,RingGeometry,Scene,Shape,ShapeGeometry,Sprite,SpriteMaterial,SRGBColorSpace,TubeGeometry,Vector2,Vector3,WebGLRenderer} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {url} from '../core/config';

const MODEL = url('/models/villalobos-logo-3d.glb?v=1'), META = url('/models/villalobos-logo-3d.json?v=1');
export const ANIMAL_IDS = ['cat', 'dog'];
const DURATION = {cat: 3.4, dog: 2.9};
const FINALE = 4.8;
// Luz de estudio: el bloom solo debe recoger lo encendido, nunca la porcelana en reposo.
const ENV = .5, KEY = 1.35, RIM = .6, GLINT = 1.1, STEEL_ENV = 1.6;
// La porcelana guarda un poco de luz propia: en el logo las siluetas son blanco puro.
const PORCELAIN_GLOW = .08;
// El ojo del gato se dibuja a la escala del panel de Valladares; aquí la cabeza es menor.
const EYE = .42;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t);};
const win = (v, a, b, c, d) => smooth(a, b, v) * (1 - smooth(c, d, v));
const outQuart = p => 1 - Math.pow(1 - p, 4);
const inOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const damp = (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));
const glow = (hex, k) => new Color(hex).multiplyScalar(k);

const FINISH = {
  'Lacado rojo': () => new MeshPhysicalMaterial({color: '#b60000', roughness: .32, clearcoat: 1, clearcoatRoughness: .12}),
  'Lacado grafito': () => new MeshPhysicalMaterial({color: '#555555', roughness: .34, clearcoat: 1, clearcoatRoughness: .12}),
  'Porcelana': () => new MeshPhysicalMaterial({color: '#fbfaf8', roughness: .42, clearcoat: .45, clearcoatRoughness: .25, sheen: .4, sheenColor: new Color('#ffffff'), sheenRoughness: .6, emissive: new Color('#ffffff'), emissiveIntensity: PORCELAIN_GLOW}),
  'Acero satinado': () => new MeshPhysicalMaterial({color: '#c8cacd', metalness: 1, roughness: .3, emissive: new Color('#ff3b3b'), emissiveIntensity: 0}),
};

function canvasTexture(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}
const dotTexture = () => canvasTexture(64, (g, s) => {
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,240,236,.75)'); r.addColorStop(1, 'rgba(255,220,214,0)');
  g.fillStyle = r; g.fillRect(0, 0, s, s);
});
const flareTexture = () => canvasTexture(256, (g, s) => {
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.12, 'rgba(255,226,222,.7)'); r.addColorStop(.5, 'rgba(255,120,110,.08)'); r.addColorStop(1, 'rgba(255,120,110,0)');
  g.fillStyle = r; g.fillRect(0, 0, s, s);
  g.globalCompositeOperation = 'lighter';
  for (const [w, h] of [[s, 3], [3, s]]) {
    const l = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    l.addColorStop(0, 'rgba(255,240,236,.9)'); l.addColorStop(1, 'rgba(255,240,236,0)');
    g.fillStyle = l; g.fillRect((s - w) / 2, (s - h) / 2, w, h);
  }
});

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

  const key = new DirectionalLight(0xfff6ee, KEY); key.position.set(-4, 5, 8);
  const rim = new DirectionalLight(0xdfe6ff, RIM); rim.position.set(5, -4, 3);
  const glint = new PointLight(0xfff1ea, GLINT, 9, 2); glint.position.set(0, 0, 3.2);
  const sweep = new PointLight(0xffffff, 0, 7, 2);
  scene.add(key, rim, glint, sweep);

  const tex = {dot: dotTexture(), flare: flareTexture()};
  const shadowTex = canvasTexture(256, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, s * 0.14, s / 2, s / 2, s * 0.48);
    r.addColorStop(0, 'rgba(27, 27, 29, 0.2)');
    r.addColorStop(0.38, 'rgba(27, 27, 29, 0.08)');
    r.addColorStop(0.72, 'rgba(27, 27, 29, 0.02)');
    r.addColorStop(1, 'rgba(27, 27, 29, 0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  });

  const holder = new Group(), spinner = new Group(); holder.add(spinner); scene.add(holder);
  const [gltf, meta] = await Promise.all([new GLTFLoader().loadAsync(MODEL), fetch(META).then(r => r.json())]);
  const model = gltf.scene; spinner.add(model);

  const light = (k, opacity = 0) => new MeshBasicMaterial({color: glow('#fff4f0', k), transparent: true, opacity, depthWrite: false, blending: AdditiveBlending});
  const top = meta.reliefTop + .01;

  // Hilo de luz que recorre la silueta; la chispa marca la punta mientras dibuja.
  function thread(curve, segments, radius) {
    const geo = new TubeGeometry(curve, segments, radius, 6, curve.closed);
    const mesh = new Mesh(geo, light(2.1)); mesh.visible = false;
    const spark = new Sprite(new SpriteMaterial({map: tex.dot, color: glow('#ffffff', 3), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending}));
    spark.scale.setScalar(.08); spark.visible = false;
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

  // Disco y aro: base común. El acero lleva su propio reflejo y se enciende en el final.
  const base = model.getObjectByName('Emblem_base'), steels = [];
  base.traverse(o => {
    const make = o.isMesh && FINISH[o.material.name];
    if (!make) return;
    o.material.dispose(); o.material = make();
    if (o.material.metalness === 1) {o.material.envMap = env.texture; o.material.envMapIntensity = STEEL_ENV; steels.push(o.material);}
  });

  const tiles = {};
  ANIMAL_IDS.forEach((id, i) => {
    const node = model.getObjectByName('Animal_' + id), data = meta.animals[id];
    const reliefs = [];
    node.traverse(o => {
      const name = o.isMesh && o.material.name, make = FINISH[name];
      if (!make) return;
      o.material.dispose(); o.material = make();
      // La silueta de porcelana es la que se ilumina al pasar el cursor.
      if (name === 'Porcelana') reliefs.push(o.material);
    });
    const outline = thread(new CatmullRomCurve3(data.outline.map(([x, y]) => new Vector3(x, y, top)), true, 'centripetal'), 720, .0035);
    node.add(outline.mesh, outline.spark);
    const home = node.position.clone();
    tiles[id] = {id, i, node, home, reliefs, outline, data, dir: Math.sign(home.x) || 1, hover: 0, focus: false, start: -1, fired: new Set()};
  });

  // Gato: ojo de ámbar con pupila rasgada.
  const cat = tiles.cat, eye = new Group();
  {
    const w = .082, h = .046, almond = new Shape();
    almond.moveTo(-w, 0); almond.quadraticCurveTo(0, h * 2, w, 0); almond.quadraticCurveTo(0, -h * 2, -w, 0);
    const iris = new Mesh(new ShapeGeometry(almond, 24), new MeshBasicMaterial({color: glow('#ffb432', 2.4), transparent: true, opacity: 0, depthWrite: false}));
    const pupil = new Mesh(new CircleGeometry(1, 32), new MeshBasicMaterial({color: 0x050506, transparent: true, opacity: 0, depthWrite: false}));
    pupil.scale.set(.011, .044, 1); pupil.position.z = .002;
    const shine = new Mesh(new CircleGeometry(.009, 16), new MeshBasicMaterial({color: glow('#ffffff', 2), transparent: true, opacity: 0, depthWrite: false}));
    shine.position.set(.022, .016, .004);
    const halo = new Sprite(new SpriteMaterial({map: tex.dot, color: glow('#ffae3a', 1.6), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending}));
    halo.scale.set(.5, .32, 1);
    eye.add(halo, iris, pupil, shine); eye.position.set(cat.data.eye[0], cat.data.eye[1], top + .004); eye.rotation.z = .28;
    eye.scale.setScalar(EYE);
    eye.userData.parts = [iris, pupil, shine, halo]; eye.visible = false; cat.node.add(eye);
  }

  // Perro: ondas del ladrido que salen del hocico.
  const dog = tiles.dog, mouth = dog.data.mouth;
  const ripples = [0, 1].map(() => {const m = new Mesh(new RingGeometry(.9, 1, 96), light(2.6)); m.position.set(mouth[0], mouth[1], top + .02); m.visible = false; dog.node.add(m); return m;});

  // Final: línea de luz en la ranura entre paneles y destello central.
  const gapX = (cat.home.x + cat.data.half[0] + dog.home.x - dog.data.half[0]) / 2, span = meta.ring[1] * 2;
  const seam = new Mesh(new PlaneGeometry(.022, cat.data.half[1] * 2 + .08), light(3.4));
  seam.position.set(gapX, 0, -.03); seam.visible = false; spinner.add(seam);
  const flare = new Sprite(new SpriteMaterial({map: tex.flare, color: glow('#fff3ef', 2.2), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending}));
  flare.position.z = .25; flare.visible = false; spinner.add(flare);

  // Sombra difusa de contacto para asentar el emblema sobre el fondo de la portada.
  const shadow = new Mesh(new PlaneGeometry(span * 1.5, span * 1.5), new MeshBasicMaterial({map: shadowTex, transparent: true, opacity: 0.85, depthWrite: false}));
  shadow.position.z = -.2; spinner.add(shadow);

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

  function update(t, dt) {
    const reduced = reducedMotion;
    // Inclinación hacia el cursor; sin cursor, una deriva lenta.
    aim.x = damp(aim.x, pointerIn ? pointer.x : Math.sin(t * .35) * .25, 3, dt);
    aim.y = damp(aim.y, pointerIn ? pointer.y : Math.cos(t * .27) * .18, 3, dt);
    if (!reduced) {holder.rotation.y = aim.x * .26; holder.rotation.x = -aim.y * .2;}
    glint.position.set(aim.x * 2.6, aim.y * 2.2, 3.2);

    const intro = introStart < 0 ? 0 : t - introStart;
    if (!reduced) base.scale.setScalar(.9 + .1 * outQuart(clamp(intro / 1.3)));
    const f = finaleStart < 0 ? -1 : (t - finaleStart) / FINALE;
    const finaleOn = f >= 0 && f <= 1;
    const sep = finaleOn && !reduced ? .07 * win(f, 0, .16, .74, .95) : 0;
    spinner.rotation.y = finaleOn && !reduced ? inOut(clamp((f - .12) / .68)) * Math.PI * 2 : 0;
    const seamK = finaleOn ? win(f, .06, .22, .78, 1) : 0;
    seam.visible = seamK > .002; seam.scale.set(1, outQuart(clamp((f - .04) / .3)) || .001, 1); seam.material.opacity = seamK;
    const flareK = finaleOn ? win(f, .12, .24, .3, .55) : 0;
    flare.visible = flareK > .002; flare.material.opacity = flareK; flare.scale.setScalar(.4 + 2.2 * flareK);
    for (const s of steels) s.emissiveIntensity = finaleOn ? .9 * win(f, .1, .3, .7, 1) : 0;

    // Invitación: si nadie toca, la silueta del siguiente animal por descubrir destella.
    const pending = ANIMAL_IDS.filter(id => !played.has(id));
    const idle = t - lastTouch - 4.5, invited = pending.length && idle > 0 ? pending[Math.floor(idle / 5.5) % pending.length] : '';
    invite = invited ? win(idle % 5.5, 0, .35, .5, 1.3) : 0;

    let dimTarget = 0;
    for (const T of Object.values(tiles)) {
      const {node, home, dir} = T;
      let px = home.x, py = home.y, pz = 0, rx = 0, ry = 0, rz = 0, s = 1, shine = 0;
      if (!reduced) {
        const e = outQuart(clamp((intro - .25 - T.i * .14) / 1.5)), r = 1 - e;
        px += dir * r * 1.4; pz -= 4 * r * r; ry -= dir * r * 1.1;
      }
      px += dir * sep;
      T.hover = damp(T.hover, hovered === T.id || T.focus ? 1 : 0, 9, dt);
      pz += T.hover * .08; shine += T.hover * .08 + (invited === T.id ? invite * .22 : 0);

      // Firma de entrada: los dos hilos de luz a la vez, ya ensamblados.
      const sig = intro - 1.6;
      let head = sig > 0 ? outQuart(clamp(sig / 1.5)) : 0, alpha = sig > 0 ? 1 - smooth(1.7, 2.5, sig) : 0;

      const d = T.start < 0 ? -1 : t - T.start, D = DURATION[T.id];
      if (d >= 0 && d < D) {
        const lift = win(d, 0, .35, D - .9, D - .1);
        if (!reduced) {pz += lift * .16; s += lift * .03;}
        shine += lift * .12;
        head = outQuart(clamp(d / 1.2)); alpha = 1 - smooth(1.4, 2.1, d);
        if (T.id === 'cat') {
          dimTarget = Math.max(dimTarget, win(d, .1, .6, 2.6, 3.2));
          if (!reduced) {ry -= .22 * win(d, .3, 1, 1.9, 2.6); rz += Math.sin(d * 52) * .0035 * win(d, .5, .8, 2.2, 2.6);}
          const open = win(d, .55, .95, 2.5, 3), blink = reduced ? 0 : win(d, 1.7, 1.77, 1.8, 1.9);
          eye.visible = open > .002; eye.scale.set(EYE, EYE * Math.max(.06, 1 - .94 * blink), EYE);
          eye.userData.parts.forEach((m, k) => {m.material.opacity = open * (k === 3 ? .9 : 1);});
        }
        if (T.id === 'dog') {
          // Ladrido: dos impulsos de la cabeza hacia el frente y ondas que salen del hocico.
          const barkImpulse = at => {
            const p = d - at;
            return p >= 0 && p <= .42 ? Math.sin(p / .42 * Math.PI) : 0;
          };
          const b1 = barkImpulse(.18), b2 = barkImpulse(.85);
          if (!reduced) {
            pz += (b1 * 1.1 + b2 * .9) * .14;
            rx -= (b1 * 1.2 + b2 * .95) * .1;
            ry -= (b1 - b2 * .7) * .06;
            rz -= (b1 * .05 - b2 * .035);
          }
          [.18, .85].forEach((at, k) => {
            const q = (d - at) / .95, m = ripples[k];
            const on = q > 0 && q < 1;
            m.visible = on;
            if (on) {
              m.scale.setScalar(.03 + .42 * outQuart(clamp(q)));
              m.material.opacity = .8 * (1 - clamp(q)) * (1 - clamp(q));
            }
          });
        }
      } else if (T.start >= 0) {
        if (T.id === 'cat') eye.visible = false;
        if (T.id === 'dog') ripples.forEach(m => {m.visible = false;});
      }
      drawThread(T.outline, head, alpha);
      node.position.set(px, py, pz); node.rotation.set(rx, ry, rz); node.scale.setScalar(s);
      for (const m of T.reliefs) m.emissiveIntensity = (PORCELAIN_GLOW + shine + (finaleOn ? .18 * win(f, .1, .3, .7, 1) : 0)) * (1 - .6 * dim);
    }

    // La sala se apaga cuando el gato abre el ojo.
    dim = damp(dim, dimTarget, 5, dt);
    key.intensity = KEY * (1 - .75 * dim); rim.intensity = RIM * (1 - .4 * dim); glint.intensity = GLINT * (1 - .7 * dim);
    scene.environmentIntensity = ENV * (1 - .78 * dim);
    for (const s of steels) s.envMapIntensity = STEEL_ENV * (1 - .7 * dim);

    // Barrido de luz sobre el barniz justo al terminar de ensamblarse.
    const sw = (intro - 1.3) / 1.7;
    sweep.intensity = reduced || sw <= 0 || sw >= 1 ? 0 : 16 * Math.sin(Math.PI * sw);
    sweep.position.set(-3 + 6 * sw, 2.4 - 4.8 * sw, 1.6);
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
      Object.values(tex).forEach(x => x?.dispose?.());
      shadowTex.dispose?.();
      env?.dispose?.(); pmrem?.dispose?.(); renderer?.dispose?.();
    },
  };
}
