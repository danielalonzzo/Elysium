/**
 * Emblema vivo 3D da Clínica Veterinária Vale d'Álvaro (Bragança).
 * Carrega a escultura otimizada em porcelana/azulejo e ouro mel gerada em Blender
 * (`scripts/logo3d/build_logo.py`) com iluminação de estúdio suave, materiais
 * adaptados a mobile/desktop (sem recompilações de shader), loop pausado fora de
 * ecrã/em repouso e 4 gestos interativos (O Azulejo, O Vale, O Cão, O Gato) + final.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Points,
  Raycaster,
  RingGeometry,
  Scene,
  ShaderMaterial,
  Shape,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { url } from '../core/config';

const MODEL = url('/models/valedalvaro-logo-3d.glb?v=3');
const META = url('/models/valedalvaro-logo-3d.json?v=3');

export const GROUP_IDS = ['tile', 'vale', 'dog', 'cat'];
const DURATION = { tile: 2.6, vale: 2.8, dog: 2.8, cat: 2.8 };
const FINALE = 4.4;
const INTRO_END = 1.45;

const AZULEJO = '#1e4d7b';
const GOLD = '#df9a38';
const HONEY = '#c67822';
const SUN = '#f2c361';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const win = (v, a, b, c, d) => smooth(a, b, v) * (1 - smooth(c, d, v));
const outQuart = (p) => 1 - Math.pow(1 - p, 4);
const outBack = (p) => {
  const c = 1.35;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
};
const inOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const damp = (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));
const rand = (a, b) => a + Math.random() * (b - a);
const glow = (hex, k) => new Color(hex).multiplyScalar(k);
const pulse = (d, at, len) => {
  const p = (d - at) / len;
  return p > 0 && p < 1 ? Math.sin(p * Math.PI) : 0;
};

const _v2 = new Vector2();
const _v3 = new Vector3();
const _c = new Color();

function canvasTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) draw(ctx, size);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

const dotTexture = () =>
  canvasTexture(64, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.32, 'rgba(255,255,255,0.72)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  });

const flareTexture = () =>
  canvasTexture(128, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.2, 'rgba(242,195,97,0.62)');
    r.addColorStop(0.55, 'rgba(223,154,56,0.1)');
    r.addColorStop(1, 'rgba(223,154,56,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  });

const shadowTexture = () =>
  canvasTexture(128, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, s * 0.1, s / 2, s / 2, s * 0.5);
    r.addColorStop(0, 'rgba(19,52,86,0.16)');
    r.addColorStop(0.52, 'rgba(19,52,86,0.06)');
    r.addColorStop(1, 'rgba(19,52,86,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  });

class Particles {
  constructor(max, map) {
    this.max = max;
    this.live = [];
    this.hadParticles = false;
    const g = new BufferGeometry();
    this.attr = {
      position: new Float32Array(max * 3),
      aAlpha: new Float32Array(max),
      aSize: new Float32Array(max),
      aTint: new Float32Array(max * 3),
    };
    g.setAttribute('position', new BufferAttribute(this.attr.position, 3));
    g.setAttribute('aAlpha', new BufferAttribute(this.attr.aAlpha, 1));
    g.setAttribute('aSize', new BufferAttribute(this.attr.aSize, 1));
    g.setAttribute('aTint', new BufferAttribute(this.attr.aTint, 3));
    g.setDrawRange(0, 0);

    this.material = new ShaderMaterial({
      uniforms: { uMap: { value: map }, uScale: { value: 480 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader:
        'attribute float aAlpha,aSize;attribute vec3 aTint;uniform float uScale;varying float vAlpha;varying vec3 vTint;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=aSize*uScale/-mv.z;vAlpha=aAlpha;vTint=aTint;}',
      fragmentShader:
        'uniform sampler2D uMap;varying float vAlpha;varying vec3 vTint;void main(){vec4 t=texture2D(uMap,gl_PointCoord);gl_FragColor=vec4(t.rgb*vTint,t.a*vAlpha);}',
    });
    this.points = new Points(g, this.material);
    this.points.frustumCulled = false;
    this.points.visible = false;
  }

  spawn(p) {
    if (this.live.length < this.max) {
      this.live.push({ age: 0, drag: 1.2, gravity: 0.25, ...p });
    }
  }

  clear() {
    this.live.length = 0;
    this.points.visible = false;
    this.points.geometry.setDrawRange(0, 0);
    this.hadParticles = false;
  }

  update(dt) {
    const countBefore = this.live.length;
    if (countBefore === 0 && !this.hadParticles) return false;

    let write = 0;
    const { position, aAlpha, aSize, aTint } = this.attr;
    for (let i = 0; i < countBefore; i++) {
      const p = this.live[i];
      p.age += dt;
      if (p.age >= p.life) continue;
      p.vy -= p.gravity * dt;
      const k = Math.exp(-p.drag * dt);
      p.vx *= k;
      p.vy *= k;
      p.vz *= k;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      const a = p.age / p.life;
      const w3 = write * 3;
      position[w3] = p.x;
      position[w3 + 1] = p.y;
      position[w3 + 2] = p.z;
      aTint[w3] = p.tr;
      aTint[w3 + 1] = p.tg;
      aTint[w3 + 2] = p.tb;
      aAlpha[write] = smooth(0, 0.14, a) * (1 - smooth(0.55, 1, a)) * p.alpha;
      aSize[write] = p.size;
      this.live[write] = p;
      write++;
    }
    this.live.length = write;

    const g = this.points.geometry;
    g.setDrawRange(0, write);
    this.points.visible = write > 0;
    this.hadParticles = write > 0;

    if (write > 0) {
      g.attributes.position.needsUpdate = true;
      g.attributes.aAlpha.needsUpdate = true;
      g.attributes.aSize.needsUpdate = true;
      g.attributes.aTint.needsUpdate = true;
    }
    return write > 0;
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *   container?: HTMLElement | null,
 *   onSelect?: (id: string) => void,
 *   onHover?: (id: string) => void,
 *   onContextLost?: () => void,
 *   onContextRestored?: () => void,
 *   reducedMotion?: boolean,
 * }} [options]
 */
export async function mountHeroLogo(
  canvas,
  {
    container = null,
    onSelect = () => {},
    onHover = () => {},
    onContextLost = () => {},
    onContextRestored = () => {},
    reducedMotion: initialReduced = false,
  } = {}
) {
  const isMobile =
    typeof window !== 'undefined' &&
    (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    stencil: false,
    powerPreference: isMobile ? 'default' : 'high-performance',
  });
  const getDpr = () => Math.min(window.devicePixelRatio || 1, isMobile ? 1.75 : 2);
  renderer.setPixelRatio(getDpr());
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.04;

  const scene = new Scene();
  const camera = new PerspectiveCamera(26, 1, 0.1, 60);

  // Ambiente de estúdio leve — liberta PMREM e RoomEnvironment imediatamente após gerar a textura
  const pmrem = new PMREMGenerator(renderer);
  const envScene = new RoomEnvironment();
  const env = pmrem.fromScene(envScene, 0.04);
  envScene.dispose();
  pmrem.dispose();
  scene.environment = env.texture;
  scene.environmentIntensity = isMobile ? 0.68 : 0.62;

  // Iluminação quente e suave (luzes direcionais sem reflexo circular duro no centro do azulejo)
  const hemi = new HemisphereLight(0xfff9ee, 0x1e4d7b, 0.5);
  const key = new DirectionalLight(0xfff6e8, 1.32);
  key.position.set(-3.6, 4.8, 7.6);
  const rim = new DirectionalLight(0xc2dfff, 0.68);
  rim.position.set(4.6, -3.0, 4.2);
  const glint = new DirectionalLight(0xffe9c2, 0.42);
  glint.position.set(1.4, 2.0, 6.2);
  const sweep = new PointLight(0xfff8eb, 0, 12, 2);
  scene.add(hemi, key, rim, glint, sweep);

  const tex = { dot: dotTexture(), flare: flareTexture(), shadow: shadowTexture() };
  const holder = new Group();
  const spinner = new Group();
  holder.add(spinner);
  scene.add(holder);

  const [gltf, meta] = await Promise.all([
    new GLTFLoader().loadAsync(MODEL),
    fetch(META).then((r) => {
      if (!r.ok) throw new Error(`Failed to load 3D metadata (${r.status})`);
      return r.json();
    }),
  ]);

  const model = gltf.scene;
  const [bx0, by0, bx1, by1] = meta.bounds;
  const BW = bx1 - bx0;
  const BH = by1 - by0;
  const top = (meta.reliefTop || 0.52) + 0.02;

  // Materiais sempre opacos (zero recompilação de shader) e partilhados por (grupo, material)
  const makeMat = (name) => {
    const spec =
      name === 'Azulejo Azul'
        ? { color: AZULEJO, roughness: 0.3, metalness: 0.04, clearcoat: 0.42, clearcoatRoughness: 0.28, emissive: '#3a7ab8' }
        : name === 'Azulejo Profundo'
          ? { color: '#133556', roughness: 0.28, metalness: 0.05, clearcoat: 0.45, clearcoatRoughness: 0.24, emissive: '#3a7ab8' }
          : name === 'Ouro Mel' || name === 'Sol Montesinho'
            ? {
                color: name === 'Sol Montesinho' ? SUN : GOLD,
                roughness: 0.26,
                metalness: 0.36,
                clearcoat: 0.42,
                clearcoatRoughness: 0.2,
                emissive: '#f2c361',
              }
            : name === 'Mel Quente'
              ? { color: HONEY, roughness: 0.3, metalness: 0.22, clearcoat: 0.38, clearcoatRoughness: 0.22, emissive: '#df9a38' }
              : name === 'Ardosia'
                ? { color: '#18232e', roughness: 0.32, metalness: 0.05, clearcoat: 0.3, clearcoatRoughness: 0.26, emissive: '#223344' }
                : {
                    color: name === 'Creme Suave' ? '#f2e7d3' : '#fdfaf3',
                    roughness: 0.22,
                    metalness: 0.02,
                    clearcoat: 0.48,
                    clearcoatRoughness: 0.2,
                    emissive: '#fff4dc',
                  };

    if (isMobile) {
      return new MeshStandardMaterial({
        color: spec.color,
        roughness: spec.roughness,
        metalness: spec.metalness,
        emissive: new Color(spec.emissive),
        emissiveIntensity: 0,
      });
    }
    return new MeshPhysicalMaterial({
      color: spec.color,
      roughness: spec.roughness,
      metalness: spec.metalness,
      clearcoat: spec.clearcoat,
      clearcoatRoughness: spec.clearcoatRoughness,
      emissive: new Color(spec.emissive),
      emissiveIntensity: 0,
    });
  };

  const groups = {};
  for (const id of GROUP_IDS) {
    const g = new Group();
    g.name = 'G_' + id;
    const pivot = meta.groupPivots?.[id];
    if (pivot) {
      g.position.set(pivot[0], pivot[1], 0);
    } else {
      const ids = meta.groups[id] || [];
      const xs = ids.map((k) => meta.pieces[k].center[0]);
      const ys = ids.map((k) => meta.pieces[k].center[1]);
      g.position.set(
        xs.reduce((a, b) => a + b, 0) / (xs.length || 1),
        ys.reduce((a, b) => a + b, 0) / (ys.length || 1),
        0
      );
    }
    g.userData.home = g.position.clone();
    spinner.add(g);
    groups[id] = {
      id,
      node: g,
      pieces: [],
      mats: [],
      matMap: new Map(),
      hover: 0,
      focus: false,
      start: -1,
      fired: new Set(),
      threads: [],
    };
  }

  const meshes = [];
  model.updateWorldMatrix(true, true);
  model.traverse((obj) => {
    if (obj.isMesh) meshes.push(obj);
  });

  // Peças com destaque emissivo próprio recebem instância dedicada; restantes partilham por (grupo, material)
  const SOLO_MAT_PIECES = new Set(['tile-rim', 'tile-cross', 'vale-sun']);

  for (const mesh of meshes) {
    const pieceKey = meta.pieces[mesh.name]
      ? mesh.name
      : meta.pieces[mesh.parent?.name || '']
        ? mesh.parent.name
        : '';
    const info = meta.pieces[pieceKey];
    if (!info) continue;
    const G = groups[info.group];
    const oldName = mesh.material?.name || 'Porcelana Creme';
    mesh.material?.dispose?.();

    const cacheKey = SOLO_MAT_PIECES.has(pieceKey) ? `${oldName}:${pieceKey}` : oldName;
    let mat = G.matMap.get(cacheKey);
    if (!mat) {
      mat = makeMat(oldName);
      G.matMap.set(cacheKey, mat);
      G.mats.push(mat);
    }
    mesh.material = mat;

    mesh.getWorldPosition(_v3);
    G.node.add(mesh);
    mesh.position.copy(_v3.sub(G.node.position));
    mesh.userData = {
      id: pieceKey,
      role: info.role,
      home: mesh.position.clone(),
      homeScale: mesh.scale.clone(),
      info,
    };
    G.pieces.push(mesh);
  }

  const piece = (gid, id) => groups[gid].pieces.find((m) => m.userData.id === id);
  const rolePieces = (gid, re) => groups[gid].pieces.filter((m) => re.test(m.userData.role));

  // Pivôs articulados para orelhas do cão e bigodes do gato (dobradiças reais de `meta.pieces[*].hinge`)
  for (const G of Object.values(groups)) {
    for (const m of G.pieces) {
      const hinge = m.userData.info.hinge;
      if (!hinge) continue;
      const pivot = new Group();
      pivot.position.set(hinge[0] - G.node.position.x, hinge[1] - G.node.position.y, 0);
      G.node.add(pivot);
      const localPos = m.position.clone().sub(pivot.position);
      pivot.add(m);
      m.position.copy(localPos);
      m.userData.home = localPos.clone();
      m.userData.pivot = pivot;
      m.userData.side = m.userData.role.endsWith('-l') ? -1 : 1;
    }
  }

  // Fios dourados leves (5 segmentos radiais -> 30 índices por segmento tubular)
  const RADIAL_SEGS = 5;
  const UNIT_INDICES = RADIAL_SEGS * 6;
  const goldLine = (k, opacity = 0) =>
    new MeshBasicMaterial({
      color: glow('#f5cb6e', k),
      transparent: true,
      opacity,
      depthWrite: false,
      blending: AdditiveBlending,
    });

  function thread(curve, segments, radius, parent) {
    const geo = new TubeGeometry(curve, segments, radius, RADIAL_SEGS, curve.closed);
    const mesh = new Mesh(geo, goldLine(1.95));
    mesh.visible = false;
    const spark = new Sprite(
      new SpriteMaterial({
        map: tex.dot,
        color: glow('#fff5dc', 2.4),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: AdditiveBlending,
      })
    );
    spark.scale.setScalar(0.13);
    spark.visible = false;
    parent.add(mesh, spark);
    return { mesh, spark, curve, total: geo.index ? geo.index.count : 0 };
  }

  function drawThread(t, head, alpha) {
    const on = alpha > 0.004 && head > 0.002;
    t.mesh.visible = t.spark.visible = on;
    if (!on) return;
    t.mesh.material.opacity = alpha;
    t.mesh.geometry.setDrawRange(0, Math.floor((head * t.total) / UNIT_INDICES) * UNIT_INDICES);
    t.spark.material.opacity = alpha * (1 - smooth(0.88, 1, head));
    t.curve.getPointAt(Math.min(head, 0.9999), t.spark.position);
  }

  for (const G of Object.values(groups)) {
    for (const m of G.pieces) {
      const o = m.userData.info.outline;
      if (!o || o.length < 4) continue;
      const P = G.node.position;
      const zPlane = (m.userData.info.zTop || 0.3) + 0.014;
      const pts = o.map(([x, y]) => new Vector3(x - P.x, y - P.y, zPlane));
      const segs = G.id === 'tile' ? 56 : 40;
      G.threads.push(thread(new CatmullRomCurve3(pts, true, 'centripetal'), segs, 0.009, G.node));
    }
  }

  // Ondas suaves de ladrido do cão
  const nose = meta.pieces['dog-muzzle'];
  const ripples = [0, 1].map(() => {
    const m = new Mesh(new RingGeometry(0.92, 1, 40), goldLine(2.0));
    m.position.set(
      nose.center[0] - groups.dog.node.position.x,
      nose.center[1] - groups.dog.node.position.y,
      top + 0.03
    );
    m.visible = false;
    groups.dog.node.add(m);
    return m;
  });

  // Coração dourado no final (quando os 4 elementos são despertados)
  const heartShape = new Shape();
  heartShape.moveTo(0, -0.24);
  heartShape.bezierCurveTo(-0.05, -0.18, -0.3, -0.03, -0.3, 0.1);
  heartShape.bezierCurveTo(-0.3, 0.24, -0.15, 0.3, 0, 0.18);
  heartShape.bezierCurveTo(0.15, 0.3, 0.3, 0.24, 0.3, 0.1);
  heartShape.bezierCurveTo(0.3, -0.03, 0.05, -0.18, 0, -0.24);
  const heartGeo = new ExtrudeGeometry(heartShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.032,
    bevelSize: 0.028,
    bevelSegments: 2,
    curveSegments: 14,
  });
  heartGeo.center();
  const heart = new Mesh(
    heartGeo,
    isMobile
      ? new MeshStandardMaterial({
          color: GOLD,
          roughness: 0.24,
          metalness: 0.42,
          transparent: true,
          opacity: 0,
        })
      : new MeshPhysicalMaterial({
          color: GOLD,
          roughness: 0.24,
          metalness: 0.42,
          clearcoat: 0.7,
          clearcoatRoughness: 0.16,
          transparent: true,
          opacity: 0,
        })
  );
  heart.visible = false;
  spinner.add(heart);
  const heartHome = new Vector3(0, 0.08, top + 0.14);

  const flare = new Sprite(
    new SpriteMaterial({
      map: tex.flare,
      color: glow('#fff3d4', 2.0),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
    })
  );
  flare.visible = false;
  spinner.add(flare);

  const dust = new Particles(isMobile ? 96 : 160, tex.dot);
  spinner.add(dust.points);

  const shadow = new Mesh(
    new PlaneGeometry(BW * 1.48, BH * 1.32),
    new MeshBasicMaterial({ map: tex.shadow, transparent: true, depthWrite: false })
  );
  shadow.position.set((bx0 + bx1) / 2, (by0 + by1) / 2 - 0.14, -0.14);
  spinner.add(shadow);
  spinner.position.set(-(bx0 + bx1) / 2, -(by0 + by1) / 2, 0);

  let width = 0;
  let height = 0;
  let lastDpr = 0;
  function resize() {
    const w = Math.round(canvas.clientWidth);
    const h = Math.round(canvas.clientHeight);
    const dpr = getDpr();
    if (w < 2 || h < 2) return;
    if (w === width && h === height && dpr === lastDpr) return;
    width = w;
    height = h;
    lastDpr = dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const fov = Math.tan((camera.fov * Math.PI) / 360);
    // Enquadramento perfeitamente centrado com margem confortável para inclinação, sol e coração
    const fill = isMobile ? 0.86 : 0.84;
    const needH = BH / 2 / fill;
    const needW = BW / 2 / fill;
    const halfH = Math.max(needH, needW / camera.aspect);
    camera.position.set(0, 0, halfH / fov);
    camera.updateProjectionMatrix();
    dust.material.uniforms.uScale.value = (h * dpr) / (2 * fov);
  }

  // Hit-testing preciso + pequena assistência tátil para dedos em ecrãs estreitos
  const pointer = new Vector2();
  const aim = new Vector2();
  const ray = new Raycaster();
  let pointerIn = false;
  let hovered = '';
  let down = null;
  let lastTouch = 0;

  const dogCenter = meta.pieces['dog-head']?.center || [-0.5, -0.04, 0.37];
  const catCenter = meta.pieces['cat-head']?.center || [0.5, -0.05, 0.37];
  const sunCenter = meta.pieces['vale-sun']?.center || [0, 0.48, 0.25];

  function pick(x, y, coarse = false) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return '';
    _v2.set(x, y);
    ray.setFromCamera(_v2, camera);
    const hits = ray.intersectObject(spinner, true);
    const hit = hits.find((h) => h.object.isMesh && h.object.userData.info);
    if (!hit) return '';

    let o = hit.object;
    while (o && !o.name.startsWith('G_')) o = o.parent;
    const directId = o ? o.name.slice(2) : '';

    // Em toque mobile, se o dedo tocar a margem azul mesmo ao lado do cão/gato/sol, ajuda a acertar
    if (coarse && directId === 'tile' && hit.object.userData.id === 'tile-body') {
      _v3.copy(hit.point);
      spinner.worldToLocal(_v3);
      if (Math.hypot(_v3.x - dogCenter[0], _v3.y - dogCenter[1]) < 0.39) return 'dog';
      if (Math.hypot(_v3.x - catCenter[0], _v3.y - catCenter[1]) < 0.39) return 'cat';
      if (Math.hypot(_v3.x - sunCenter[0], _v3.y - sunCenter[1]) < 0.31) return 'vale';
    }
    return directId;
  }

  function local(e) {
    const r = canvas.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return [NaN, NaN];
    return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1];
  }

  function move(e) {
    if (e.pointerType !== 'mouse') return;
    const [x, y] = local(e);
    if (!Number.isFinite(x)) return;
    pointer.set(x, y);
    pointerIn = true;
    const id = pick(x, y, false);
    if (id !== hovered) {
      hovered = id;
      canvas.style.cursor = id ? 'pointer' : '';
      onHover(id);
      requestFrame();
    }
  }

  function leave() {
    pointerIn = false;
    if (hovered) {
      hovered = '';
      canvas.style.cursor = '';
      onHover('');
      requestFrame();
    }
  }

  function press(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    down = { id: e.pointerId, x: e.clientX, y: e.clientY, type: e.pointerType };
  }

  function cancel(e) {
    if (down && down.id === e.pointerId) down = null;
  }

  function release(e) {
    if (!down || down.id !== e.pointerId) return;
    const slop = down.type === 'mouse' ? 10 : 18;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const coarse = down.type !== 'mouse';
    down = null;
    if (moved > slop) return;
    const [x, y] = local(e);
    const id = pick(x, y, coarse);
    if (id) onSelect(id);
  }

  canvas.addEventListener('pointermove', move, { passive: true });
  canvas.addEventListener('pointerleave', leave, { passive: true });
  canvas.addEventListener('pointerdown', press, { passive: true });
  canvas.addEventListener('pointerup', release, { passive: true });
  canvas.addEventListener('pointercancel', cancel, { passive: true });

  const played = new Set();
  let finaleStart = -1;
  let introStart = -1;
  const clockStart = performance.now();
  let last = 0;
  let frame = 0;
  let dead = false;
  let contextLost = false;
  let inView = true;
  let pageVisible = typeof document === 'undefined' ? true : !document.hidden;
  let reducedMotion = initialReduced;
  let userPaused = false;

  const now = () => (performance.now() - clockStart) / 1000;

  function hasTransientMotion(t) {
    if (introStart >= 0 && !reducedMotion && t - introStart < INTRO_END + 0.15) return true;
    if (finaleStart >= 0 && t - finaleStart <= FINALE + 0.05) return true;
    if (dust.live.length > 0) return true;
    for (const G of Object.values(groups)) {
      if (G.start >= 0 && t - G.start < DURATION[G.id] + 0.05) return true;
      const hoverTarget = hovered === G.id || G.focus ? 1 : 0;
      if (Math.abs(G.hover - hoverTarget) > 0.01) return true;
    }
    return false;
  }

  function canAnimateContinuous() {
    return inView && pageVisible && !dead && !contextLost && !reducedMotion && !userPaused;
  }

  function stopLoop() {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function startLoop() {
    if (dead || contextLost || frame) return;
    if (!inView || !pageVisible) return;
    last = now();
    frame = requestAnimationFrame(render);
  }

  function requestFrame() {
    if (dead || contextLost || !inView || !pageVisible) return;
    if (!frame) {
      last = now();
      frame = requestAnimationFrame(render);
    }
  }

  function play(id) {
    const G = groups[id];
    if (!G) return;
    const n = now();
    lastTouch = n;
    if (G.start >= 0 && n - G.start < 0.45) return;
    G.start = n;
    G.fired.clear();
    played.add(id);
    requestFrame();
  }

  function finale() {
    const n = now();
    if (finaleStart < 0 || n - finaleStart > FINALE) finaleStart = n;
    lastTouch = n;
    requestFrame();
  }

  function burst(m, hex, n = 14) {
    if (!m || reducedMotion) return;
    m.getWorldPosition(_v3);
    spinner.worldToLocal(_v3);
    _c.set(hex);
    const count = isMobile ? Math.ceil(n * 0.7) : n;
    for (let k = 0; k < count; k++) {
      dust.spawn({
        x: _v3.x + rand(-0.22, 0.22),
        y: _v3.y + rand(-0.22, 0.22),
        z: top + 0.06,
        vx: rand(-0.9, 0.9),
        vy: rand(-0.2, 1.15),
        vz: rand(0.2, 0.85),
        drag: 1.55,
        gravity: 0.45,
        life: rand(0.85, 1.45),
        size: rand(0.065, 0.125),
        alpha: rand(0.6, 0.9),
        tr: _c.r * 1.45,
        tg: _c.g * 1.45,
        tb: _c.b * 1.45,
      });
    }
  }

  function update(t, dt) {
    const calm = reducedMotion || userPaused;
    const targetAimX = calm ? 0 : pointerIn ? pointer.x : Math.sin(t * 0.35) * 0.2;
    const targetAimY = calm ? 0 : pointerIn ? pointer.y : Math.cos(t * 0.27) * 0.12;
    aim.x = calm ? 0 : damp(aim.x, targetAimX, 3.2, dt);
    aim.y = calm ? 0 : damp(aim.y, targetAimY, 3.2, dt);

    holder.rotation.y = calm ? 0 : aim.x * 0.22;
    holder.rotation.x = calm ? 0 : -aim.y * 0.14;
    glint.position.set(1.4 + aim.x * 3.0, 2.0 + aim.y * 2.4, 6.2);

    const intro = introStart < 0 ? 0 : reducedMotion ? 99 : t - introStart;
    const f = finaleStart < 0 ? -1 : (t - finaleStart) / FINALE;
    const finaleOn = f >= 0 && f <= 1;
    spinner.rotation.y = finaleOn && !calm ? inOut(clamp((f - 0.46) / 0.46)) * Math.PI * 2 : 0;

    const pending = GROUP_IDS.filter((id) => !played.has(id));
    const idle = t - Math.max(lastTouch, introStart + 2.2) - 2.6;
    const invited = !calm && pending.length && idle > 0 ? pending[Math.floor(idle / 4.2) % pending.length] : '';
    const invite = invited ? win(idle % 4.2, 0, 0.35, 0.5, 1.2) : 0;

    for (const G of Object.values(groups)) {
      const { node } = G;
      const home = node.userData.home;
      let px = home.x;
      let py = home.y;
      let pz = 0;
      const rx = 0;
      const ry = 0;
      let rz = 0;
      let s = 1;
      let shine = 0;

      G.hover = damp(G.hover, hovered === G.id || G.focus ? 1 : 0, 9, dt);
      shine += G.hover * 0.24 + (invited === G.id ? invite * 0.55 : 0);

      const d = G.start < 0 ? -1 : t - G.start;
      const D = DURATION[G.id];
      const active = d >= 0 && d < D;
      const lift = active ? win(d, 0, 0.24, D - 0.65, D - 0.08) : 0;
      shine += lift * 0.45 + (finaleOn ? 0.5 * win(f, 0.1, 0.28, 0.72, 1) : 0);

      // Elevação segura por camada Z: `tile` (placa de fundo) NUNCA avança sobre os relevos!
      if (G.id === 'dog' || G.id === 'cat') {
        pz += G.hover * 0.055 + (calm ? 0 : lift * 0.085);
      } else if (G.id === 'vale') {
        pz += G.hover * 0.015 + (calm ? 0 : lift * 0.022);
      } else if (G.id === 'tile') {
        s *= 1 + (calm ? 0 : lift * 0.016 + G.hover * 0.01);
      }

      for (const mat of G.mats) {
        if (mat.emissive) mat.emissiveIntensity = 0.22 * shine;
      }

      // Repor transformações locais das peças e pivôs articulados
      for (const m of G.pieces) {
        m.position.copy(m.userData.home);
        m.rotation.set(0, 0, 0);
        m.scale.copy(m.userData.homeScale);
        if (m.userData.pivot) m.userData.pivot.rotation.set(0, 0, 0);
      }

      // Entrada escultural opaca (zero transparent toggling, zero recompilação de shader)
      if (intro < INTRO_END) {
        if (G.id === 'tile') {
          const p = clamp(intro / 0.55);
          const e = outQuart(p);
          pz -= 0.45 * (1 - e);
          s *= 0.88 + 0.12 * e;
          node.visible = true;
        } else if (G.id === 'vale') {
          const p = clamp((intro - 0.22) / 0.55);
          const e = outBack(p);
          py -= 0.16 * (1 - e);
          s *= Math.max(0.001, p === 0 ? 0.001 : 0.78 + 0.22 * e);
          node.visible = p > 0.01;
        } else {
          const offset = G.id === 'dog' ? 0.42 : 0.56;
          const p = clamp((intro - offset) / 0.52);
          const e = outBack(p);
          pz -= 0.12 * (1 - clamp(p));
          s *= Math.max(0.001, p === 0 ? 0.001 : e);
          node.visible = p > 0.01;
          if (!active) {
            const td = intro - offset;
            G.threads.forEach((th) =>
              drawThread(th, outQuart(clamp(td / 0.65)), td > 0 ? (1 - smooth(0.65, 1.05, td)) * 0.75 : 0)
            );
          }
        }
      } else {
        node.visible = true;
        if (!active && G.start < 0) {
          for (const th of G.threads) {
            if (th.mesh.visible) drawThread(th, 0, 0);
          }
        }
      }

      // Gestos ao tocar / clicar em cada elemento
      if (active) {
        const once = (k, at, fn) => {
          if (d >= at && !G.fired.has(k)) {
            G.fired.add(k);
            fn();
          }
        };

        G.threads.forEach((th) => drawThread(th, outQuart(clamp(d / 0.95)), 1 - smooth(1.15, 1.85, d)));

        if (G.id === 'tile') {
          const cross = piece('tile', 'tile-cross');
          const tileRim = piece('tile', 'tile-rim');
          const beat = pulse(d, 0.2, 0.28) + 0.72 * pulse(d, 0.54, 0.28) + pulse(d, 1.2, 0.28);
          if (cross) {
            if (!reducedMotion) {
              cross.scale.setScalar(1 + 0.18 * beat);
              cross.position.z += 0.05 * beat;
            }
            if (cross.material?.emissive) cross.material.emissiveIntensity = 0.45 * lift + 0.35 * beat;
          }
          if (tileRim?.material?.emissive) {
            tileRim.material.emissiveIntensity = 0.52 * lift;
          }
          once('tile-burst', 0.28, () => burst(cross, SUN, 14));
        }

        if (G.id === 'vale') {
          const sun = piece('vale', 'vale-sun');
          const hillL = piece('vale', 'vale-hill-left');
          const hillR = piece('vale', 'vale-hill-right');
          const rise = win(d, 0.12, 0.58, 1.9, 2.65);
          if (sun) {
            if (!reducedMotion) {
              // Sobe suavemente mantendo folga azul visível abaixo da cruz veterinária
              sun.position.y += 0.032 * rise;
              sun.position.z += 0.022 * rise;
              sun.scale.setScalar(1 + 0.08 * rise);
            }
            if (sun.material?.emissive) sun.material.emissiveIntensity = 0.72 * rise;
          }
          if (!reducedMotion) {
            const wave = Math.sin(d * 4.2) * 0.015 * rise;
            if (hillL) hillL.position.y += wave;
            if (hillR) hillR.position.y -= wave * 0.8;
          }
          once('vale-burst', 0.35, () => burst(sun, GOLD, 18));
        }

        if (G.id === 'dog') {
          const b1 = pulse(d, 0.18, 0.32);
          const b2 = pulse(d, 0.72, 0.32);
          if (!reducedMotion) {
            rz += Math.sin(d * 8.2) * 0.08 * win(d, 0.08, 0.28, 1.95, 2.6);
            pz += (b1 + b2 * 0.8) * 0.07;
          }
          // Orelhas caídas articuladas a partir da dobradiça superior
          const earL = piece('dog', 'dog-ear-l');
          const earR = piece('dog', 'dog-ear-r');
          if (earL?.userData.pivot && earR?.userData.pivot && !reducedMotion) {
            const flap = Math.sin(d * 16) * 0.14 * win(d, 0.12, 0.32, 1.9, 2.5);
            earL.userData.pivot.rotation.z = flap - 0.06 * lift;
            earR.userData.pivot.rotation.z = -flap + 0.06 * lift;
          }
          const muzzle = piece('dog', 'dog-muzzle');
          if (muzzle && !reducedMotion) {
            muzzle.scale.set(1 + 0.11 * (b1 + b2), 1 + 0.15 * (b1 + b2), 1);
          }
          [0.18, 0.72].forEach((at, k) => {
            const q = (d - at) / 0.78;
            const m = ripples[k];
            const on = !reducedMotion && q > 0 && q < 1;
            m.visible = on;
            if (on) {
              m.scale.setScalar(0.14 + 0.76 * outQuart(clamp(q)));
              m.material.opacity = 0.72 * (1 - q) * (1 - q);
            }
          });
          once('dog-burst', 0.3, () => burst(muzzle, GOLD, 14));
        }

        if (G.id === 'cat') {
          const blink = Math.max(
            win(d, 0.38, 0.46, 0.5, 0.6),
            win(d, 0.76, 0.84, 0.88, 0.98),
            win(d, 1.85, 1.93, 1.97, 2.07)
          );
          rolePieces('cat', /^eye/).forEach((m) => {
            m.scale.y = Math.max(0.08, 1 - 0.92 * blink);
          });
          if (!reducedMotion) {
            rz -= 0.1 * win(d, 0.18, 0.6, 1.95, 2.65);
          }
          rolePieces('cat', /^whisker/).forEach((m, k) => {
            const e = win(d, 0.65, 0.88, 1.85, 2.3);
            if (m.userData.pivot && !reducedMotion) {
              m.userData.pivot.rotation.z = Math.sin(d * 30 + k) * 0.14 * e * m.userData.side;
            }
          });
          once('cat-burst', 0.75, () => burst(piece('cat', 'cat-muzzle'), SUN, 14));
        }
      } else if (G.start >= 0) {
        if (G.id === 'dog') ripples.forEach((m) => (m.visible = false));
        for (const th of G.threads) {
          if (th.mesh.visible) drawThread(th, 0, 0);
        }
        G.start = -1;
      }

      // Final: o cão e o gato aproximam-se suavemente
      if (finaleOn && !calm) {
        const lean = win(f, 0.05, 0.24, 0.6, 0.8);
        if (G.id === 'dog') {
          px += 0.09 * lean;
          rz -= 0.08 * lean;
        }
        if (G.id === 'cat') {
          px -= 0.09 * lean;
          rz += 0.08 * lean;
        }
      }

      node.position.set(px, py, pz);
      node.rotation.set(rx, ry, rz);
      node.scale.setScalar(s);
    }

    // Coração final
    const hk = finaleOn ? win(f, 0.12, 0.28, 0.76, 0.94) : 0;
    heart.visible = hk > 0.004;
    heart.material.opacity = hk;
    if (heart.visible) {
      heart.position.copy(heartHome);
      heart.position.y += 0.36 * outQuart(clamp((f - 0.12) / 0.36)) + (calm ? 0 : Math.sin(t * 3) * 0.02);
      heart.scale.setScalar(0.55 + 0.48 * outBack(clamp((f - 0.12) / 0.25)));
      heart.rotation.y = calm ? 0 : Math.sin(t * 2.2) * 0.28;
    }

    const fk = finaleOn && !reducedMotion ? win(f, 0.12, 0.2, 0.28, 0.48) : 0;
    flare.visible = fk > 0.004;
    flare.material.opacity = fk;
    flare.scale.setScalar(0.55 + 2.2 * fk);
    flare.position.copy(heartHome);
    if (finaleOn && f > 0.16 && !groups.tile.fired.has('finale-dust')) {
      groups.tile.fired.add('finale-dust');
      burst(heart, GOLD, 16);
      burst(heart, '#4b92d1', 12);
    }
    if (!finaleOn) {
      groups.tile.fired.delete('finale-dust');
      if (finaleStart >= 0 && f > 1) finaleStart = -1;
    }

    const sw = (intro - 0.7) / 1.1;
    sweep.intensity = calm || sw <= 0 || sw >= 1 ? 0 : 6 * Math.sin(Math.PI * sw);
    sweep.position.set(-3.6 + 7.2 * sw, 2.6 - 5.2 * sw, 2.8);
    dust.update(dt);
  }

  function render() {
    frame = 0;
    if (dead || contextLost || !inView || !pageVisible) return;
    const t = now();
    const dt = Math.min(0.05, Math.max(0.001, t - last || 0.016));
    last = t;
    if (introStart < 0) introStart = t;
    update(t, dt);
    renderer.render(scene, camera);

    // Mantém rAF ativo apenas quando há movimento contínuo ou animação transitória em curso
    if (canAnimateContinuous() || hasTransientMotion(t)) {
      frame = requestAnimationFrame(render);
    }
  }

  // Observação de tamanho via ResizeObserver (nunca força layout dentro do loop de render!)
  const ro = new ResizeObserver(() => {
    resize();
    requestFrame();
  });
  ro.observe(canvas);
  resize();

  // Pausa real quando fora do ecrã ou com aba em segundo plano
  const io = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (inView && pageVisible) requestFrame();
      else stopLoop();
    },
    { rootMargin: '120px' }
  );
  io.observe(canvas);

  const onContentVis = (e) => {
    if (e.skipped) {
      inView = false;
      stopLoop();
    } else {
      inView = true;
      if (pageVisible) requestFrame();
    }
  };
  const visTarget = container || canvas;
  visTarget.addEventListener('contentvisibilityautostatechange', onContentVis);

  const onVis = () => {
    pageVisible = !document.hidden;
    if (pageVisible && inView) requestFrame();
    else stopLoop();
  };
  document.addEventListener('visibilitychange', onVis);

  const onLost = (e) => {
    e.preventDefault();
    contextLost = true;
    stopLoop();
    onContextLost();
  };
  const onRestored = () => {
    contextLost = false;
    resize();
    onContextRestored();
    requestFrame();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  // Primeiro fotograma imediato para transição suave desde o SVG sem flash vazio
  introStart = now();
  last = introStart;
  update(introStart, 0.016);
  renderer.render(scene, camera);
  if (canAnimateContinuous() || hasTransientMotion(introStart)) {
    startLoop();
  }

  return {
    play,
    finale,
    focus(id) {
      let changed = false;
      for (const G of Object.values(groups)) {
        const next = G.id === id;
        if (G.focus !== next) {
          G.focus = next;
          changed = true;
        }
      }
      if (changed) requestFrame();
    },
    setPaused(paused) {
      userPaused = Boolean(paused);
      if (userPaused) {
        // Desenha um último fotograma em pose calma e suspende o loop contínuo
        requestFrame();
      } else {
        requestFrame();
      }
    },
    setReducedMotion(reduced) {
      reducedMotion = Boolean(reduced);
      if (reducedMotion) dust.clear();
      requestFrame();
    },
    destroy() {
      dead = true;
      stopLoop();
      ro.disconnect();
      io.disconnect();
      visTarget.removeEventListener('contentvisibilityautostatechange', onContentVis);
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointerdown', press);
      canvas.removeEventListener('pointerup', release);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        if (Array.isArray(o.material)) o.material.forEach((m) => m?.dispose?.());
        else o.material?.dispose?.();
      });
      Object.values(tex).forEach((x) => x?.dispose?.());
      env?.dispose?.();
      renderer?.dispose?.();
    },
  };
}
