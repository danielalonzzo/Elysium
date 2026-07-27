"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { DiquisSphere } from "./DiquisSphere";
import { GuanacasteTree } from "./GuanacasteTree";
import { TimelineCards } from "./TimelineCards";
import { clamp01, lerp, smoothRange } from "./storyMath";
import type { ExperienceMotion, ExperienceQuality, QualitySettings } from "./types";

type ExperienceSceneProps = {
  progress: number;
  quality: ExperienceQuality;
  settings: QualitySettings;
  paused: boolean;
};

// Fondos por régimen: selva → vacío etéreo → amanecer cálido.
const FOREST_BG = new THREE.Color("#000000");
const VOID_BG = new THREE.Color("#060609");
const DAWN_BG = new THREE.Color("#141619");
// Bruma pálida de la pradera abierta del Acto 1 (cielo parcialmente nublado).
const MEADOW_FOG = new THREE.Color("#cdd8cd");

// Luz direccional: sol velado por nubes → noche fría → amanecer.
const FOREST_SUN = new THREE.Color("#fbf7ef");
const NIGHT_SUN = new THREE.Color("#33447a");
// Amanecer casi neutro: aclara la escena sin teñir de naranja la piedra gris.
const DAWN_SUN = new THREE.Color("#e9e7e2");

const _bg = new THREE.Color();
const _fog = new THREE.Color();
const _sun = new THREE.Color();
const _tmp = new THREE.Color();
const _target = new THREE.Vector3();

export function ExperienceScene({ progress, quality, settings, paused }: ExperienceSceneProps) {
  const motion = useRef<ExperienceMotion>({ progress: clamp01(progress), time: 0 });
  const staticMotion = quality === "reduced" || paused;
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const sphereGlow = useRef<THREE.PointLight>(null);

  useFrame(({ camera, scene, gl }, delta) => {
    const safe = clamp01(progress);
    motion.current.progress = staticMotion
      ? safe
      : THREE.MathUtils.damp(motion.current.progress, safe, 6, Math.min(delta, 0.1));
    if (!staticMotion) motion.current.time += Math.min(delta, 0.05);
    const p = motion.current.progress;

    // ── Fases de la coreografía ──────────────────────────────────────────────
    const zoom = smoothRange(0.0, 0.14, p); // Acto 1: acercamiento a la copa
    const pierce = smoothRange(0.14, 0.28, p); // Acto 2: ascenso por el follaje
    const reveal = smoothRange(0.32, 0.52, p); // Acto 3: aparición de la esfera
    const dawn = smoothRange(0.42, 0.7, p); // noche → amanecer
    const cards = smoothRange(0.8, 1.0, p); // Acto 4: retroceso y línea del tiempo
    // La oscuridad entra rápido para tapar la colisión de cámara que ocurre
    // en las coordenadas GPS equivalentes a p=0.166.
    const inSpace = smoothRange(0.12, 0.166, p); // 0 selva · 1 espacio oscuro
    const fragment = smoothRange(0.75, 0.95, p);

    // ── Cámara: un único recorrido continuo por los cuatro actos ────────────
    // La cámara NUNCA entra en el tronco (eje Z=0, radio ≤1.5): se detiene a
    // Z≈2.4 y asciende por encima de la copa (el tronco acaba en Y≈-0.2).
    //
    // El plano de apertura se calcula desde el frustum real: la copa del
    // Guanacaste es MÁS ANCHA QUE ALTA, así que en apaisado manda la
    // envergadura y en vertical la altura (ningún retrato contiene 15 unidades
    // de copa sin alejarse hasta perder el árbol). Se suma el radio de la copa
    // porque su cara delantera está mucho más cerca que su centro.
    const lens = camera as THREE.PerspectiveCamera;
    const halfV = THREE.MathUtils.degToRad(lens.fov) * 0.5;
    const halfH = Math.atan(Math.tan(halfV) * lens.aspect);
    const fitSpan = 9.1 / Math.tan(halfH);
    const fitHeight = 5.6 / Math.tan(halfV);
    const openZ = Math.min(Math.max(fitSpan, fitHeight), 25) + 6.8;
    let camZ = lerp(openZ, openZ * 0.34, zoom);
    camZ = lerp(camZ, 2.4, pierce);
    camZ = lerp(camZ, -1.1, reveal);
    // Acto 4: la cámara se retira FUERA de la hélice (radio 7 centrado en Z=-6)
    // para que se lea como una espiral de cartas y no como una pared.
    camZ = lerp(camZ, 11.5, cards);

    // Altura de observador, no de dron: el árbol se mira desde abajo y gana
    // monumentalidad (el suelo está en Y=-2.35).
    let camY = lerp(1.9, 3.0, zoom);
    camY = lerp(camY, 3.8, pierce);
    camY = lerp(camY, 0.5, reveal);
    camY = lerp(camY, 1.7, cards);

    let camX = lerp(0.2, 0, zoom);
    const orbit = reveal * 0.8 - cards * 0.4;
    camX += orbit + (staticMotion ? 0 : Math.sin(motion.current.time * 0.12) * 0.15 * reveal);

    camera.position.set(camX, camY, camZ);

    // Durante la travesía la mirada sube hacia el follaje, no baja hacia el tronco.
    let tgtY = lerp(2.3, 4.1, pierce);
    tgtY = lerp(tgtY, 0.5, reveal);

    let tgtZ = lerp(0, -3.2, pierce);
    tgtZ = lerp(tgtZ, -6, reveal);

    /*
     * En móvil la cámara mira por debajo del motivo para subirlo dentro del
     * encuadre y dejar libre la mitad inferior, donde van los bloques de texto.
     *
     * `lift` es la fracción de ALTURA DE PANTALLA que sube el motivo, y se
     * traduce a unidades de mundo con la distancia real cámara→objetivo: el
     * ángulo se mantiene aunque el recorrido acerque o aleje la cámara. Se usa
     * la distancia y no `camZ`, que en el Acto 3 es negativo (la cámara cruza a
     * Z=-1.1 para mirar la esfera en Z=-6) y allí invertía el desvío.
     *
     * La esfera del Diquís sube más que el árbol o las cartas porque su bloque
     * de texto es el más alto de los tres.
     */
    if (quality === "mobile") {
      // El relevo hacia las cartas baja el desvío ANTES de que entre su bloque
      // de texto (0.8), para que el Acto 4 conserve su encuadre de siempre.
      const handoff = smoothRange(0.72, 0.84, p);
      let lift = lerp(0.075, 0.2, reveal);
      lift = lerp(lift, 0.05, handoff);
      const dist = Math.hypot(camX, camY - tgtY, camZ - tgtZ);
      tgtY -= lift * 2 * dist * Math.tan(halfV);
    }
    _target.set(0, tgtY, tgtZ);
    camera.lookAt(_target);

    // ── Fondo y niebla ──────────────────────────────────────────────────────
    _bg.copy(FOREST_BG).lerp(VOID_BG, inSpace).lerp(DAWN_BG, dawn * 0.6);
    
    // Mostramos el degradado CSS de fondo (globals.css) mientras estemos en el Acto 1.
    // Al entrar al espacio (inSpace > 0) o al amanecer, el fondo 3D se vuelve opaco.
    const bgAlpha = clamp01(inSpace * 3 + dawn);
    gl.setClearColor(_bg, bgAlpha);
    
    if (scene.background instanceof THREE.Color) scene.background.copy(_bg);
    if (scene.fog instanceof THREE.Fog) {
      // Acto 1: la niebla es la bruma clara del horizonte de la pradera y se
      // abre muy lejos; al entrar la oscuridad recupera el vacío de siempre.
      _fog.copy(MEADOW_FOG).lerp(_bg, inSpace);
      scene.fog.color.copy(_fog);
      scene.fog.near = lerp(45, 12, inSpace);
      scene.fog.far = lerp(150, 46, inSpace);
    }

    // ── Iluminación por régimen ─────────────────────────────────────────────
    if (sun.current) {
      _tmp.copy(NIGHT_SUN).lerp(DAWN_SUN, dawn);
      _sun.copy(FOREST_SUN).lerp(_tmp, inSpace);
      sun.current.color.copy(_sun);
      // Cielo nublado = difusor gigante: sol de baja intensidad y muy alto, de
      // modo que el contraste lo pone el hemisférico y no una luz dura.
      sun.current.intensity = lerp(0.95, lerp(0.45, 1.7, dawn), inSpace);
      sun.current.position.set(lerp(-6, 4.5, dawn), lerp(13, 4, dawn), lerp(7, 2, inSpace));
    }
    if (hemi.current) hemi.current.intensity = lerp(2.15, 0.32, inSpace);
    // El Acto 4 sube el relleno para que las cartas (el producto) lean claras.
    if (ambient.current) ambient.current.intensity = lerp(0.5, 0.14, inSpace) + dawn * 0.16 + cards * 0.5;
    if (sphereGlow.current) {
      sphereGlow.current.intensity = dawn * 0.9 + fragment * 2.4;
      sphereGlow.current.position.set(0, 0.6, -6);
    }
  });

  return (
    <>
      <fog attach="fog" args={[MEADOW_FOG.getHex(), 45, 150]} />
      {/* Cielo nublado arriba, rebote del pasto abajo. */}
      <hemisphereLight ref={hemi} args={["#e9f2f7", "#54682f", 2.15]} />
      <directionalLight ref={sun} position={[-6, 13, 7]} color={FOREST_SUN.getHex()} intensity={0.95} />
      <ambientLight ref={ambient} intensity={0.5} />
      <pointLight ref={sphereGlow} color="#d5dade" intensity={0} distance={22} position={[0, 0.6, -6]} />

      <GuanacasteTree motion={motion} settings={settings} staticMotion={staticMotion} />
      <DiquisSphere motion={motion} settings={settings} staticMotion={staticMotion} />
      <TimelineCards motion={motion} settings={settings} staticMotion={staticMotion} />
    </>
  );
}
