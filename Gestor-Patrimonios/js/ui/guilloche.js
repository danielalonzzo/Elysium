/**
 * Guilloché: el grabado de líneas entrelazadas de los billetes.
 *
 * Es el motivo propio de Patrimonio. Se genera, no se dibuja: cada roseta es
 * una familia de hipotrocoides (la curva del espirógrafo) con parámetros que
 * salen de una semilla, así que cada meta tiene su propio sello y siempre el
 * mismo. Sin imágenes: funciona sin conexión y se tiñe con `currentColor`.
 */
import { raw } from './dom.js';

function hash(text) {
    let h = 2166136261;
    for (const char of String(text)) {
        h ^= char.charCodeAt(0);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function rng(seed) {
    let state = hash(seed) || 1;
    return () => {
        state ^= state << 13; state >>>= 0;
        state ^= state >>> 17;
        state ^= state << 5; state >>>= 0;
        return state / 4294967296;
    };
}

function hypotrochoidPath(cx, cy, R, r, d, scale, perTurn = 170) {
    // Con R y r coprimos la curva cierra tras r vueltas y dibuja R pétalos.
    const k = (R - r) / r;
    const steps = r * perTurn;
    let path = '';
    for (let i = 0; i <= steps; i += 1) {
        const t = (i / steps) * Math.PI * 2 * r;
        const x = cx + scale * ((R - r) * Math.cos(t) + d * Math.cos(k * t));
        const y = cy + scale * ((R - r) * Math.sin(t) - d * Math.sin(k * t));
        path += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return path + 'Z';
}

function gcd(a, b) {
    return b ? gcd(b, a % b) : a;
}

/**
 * Roseta de billete.
 * @param {{seed?: string, size?: number, layers?: number, strokeWidth?: number, className?: string}} [options]
 */
const cache = new Map();

export function rosette(options = {}) {
    const key = JSON.stringify(options);
    if (!cache.has(key)) {
        if (cache.size > 200) cache.clear();
        cache.set(key, buildRosette(options));
    }
    return raw(cache.get(key));
}

function buildRosette({ seed = 'elysium', size = 240, layers = 5, strokeWidth = 0.6, className = '' } = {}) {
    // La densidad de puntos sigue al tamaño: un medallón de 80 px no necesita
    // la resolución del héroe, y el HTML de las listas se mantiene ligero.
    const perTurn = Math.round(Math.min(150, Math.max(46, size / 2.6)));
    const random = rng(seed);
    const c = size / 2;
    const petals = [30, 32, 36, 40, 42, 44, 48][Math.floor(random() * 7)];
    let turns = [5, 7, 9, 11][Math.floor(random() * 4)];
    while (gcd(petals, turns) !== 1) turns += 2;
    const R = petals;
    const r = turns;
    const baseD = r * (1.6 + random() * 1.6);
    const scale = (size * 0.47) / (R - r + baseD);
    let paths = '';
    for (let i = 0; i < layers; i += 1) {
        const d = baseD * (1 - i * 0.16);
        const opacity = (1 - i * 0.14).toFixed(2);
        paths += `<path d="${hypotrochoidPath(c, c, R, r, d, scale * (1 - i * 0.04), perTurn)}" stroke-opacity="${opacity}"/>`;
    }
    return `<svg class="guilloche ${className}" viewBox="0 0 ${size} ${size}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" aria-hidden="true" focusable="false">${paths}</svg>`;
}

/** Banda de ondas entrelazadas, para fondos de tarjetas. */
export function waveBand({ seed = 'elysium', width = 600, height = 200, lines = 22, strokeWidth = 0.55, className = '' } = {}) {
    const random = rng(seed + ':wave');
    const freq = 1.5 + random() * 1.5;
    const amp = height * (0.16 + random() * 0.1);
    const drift = random() * Math.PI * 2;
    let paths = '';
    for (let i = 0; i < lines; i += 1) {
        const phase = drift + i * (Math.PI / lines) * 2.2;
        const offset = height * 0.5 + (i - lines / 2) * (height / lines) * 0.55;
        let path = '';
        for (let x = 0; x <= width; x += 6) {
            const t = (x / width) * Math.PI * 2 * freq;
            const y = offset + amp * Math.sin(t + phase) * Math.cos(t * 0.5 - phase * 0.3);
            path += `${x ? 'L' : 'M'}${x} ${y.toFixed(1)}`;
        }
        paths += `<path d="${path}"/>`;
    }
    return raw(`<svg class="guilloche-band ${className}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" aria-hidden="true" focusable="false">${paths}</svg>`);
}

/*
 * Los medallones se repiten decenas de veces en Logros: su grabado y su
 * escala graduada se definen una sola vez como <symbol> y cada medallón los
 * reutiliza con <use>. El HTML de la vista baja de cientos de KB a unos pocos.
 */
const symbols = new Set();

function ensureSymbol(id, viewBox, body) {
    if (typeof document === 'undefined' || symbols.has(id)) return;
    let sprite = document.getElementById('guilloche-sprite');
    if (!sprite) {
        sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        sprite.id = 'guilloche-sprite';
        sprite.setAttribute('aria-hidden', 'true');
        sprite.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
        document.body.prepend(sprite);
    }
    sprite.insertAdjacentHTML('beforeend', `<symbol id="${id}" viewBox="${viewBox}">${body}</symbol>`);
    symbols.add(id);
}

function medalSymbols() {
    const ticks = Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2;
        const r1 = 43;
        const r2 = i % 5 === 0 ? 39.5 : 41.2;
        return `<line x1="${(50 + r1 * Math.cos(a)).toFixed(2)}" y1="${(50 + r1 * Math.sin(a)).toFixed(2)}" x2="${(50 + r2 * Math.cos(a)).toFixed(2)}" y2="${(50 + r2 * Math.sin(a)).toFixed(2)}"/>`;
    }).join('');
    ensureSymbol('medal-ticks', '0 0 100 100', ticks);
    const engraving = buildRosette({ seed: 'medalla', size: 120, layers: 2, strokeWidth: 0.5 })
        .replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    ensureSymbol('medal-rosette', '0 0 120 120', engraving);
}

/** Medallón de insignia: grabado dentro de un anillo graduado, con un icono al centro. */
export function medallion({ iconSvg = '', tier = 'gold', locked = false, size = 88 }) {
    medalSymbols();
    return raw(`<span class="medallion is-${tier}${locked ? ' is-locked' : ''}" style="--size:${size}px">
        <svg class="medallion-ring" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <circle cx="50" cy="50" r="47" class="medallion-disc"/>
            <g class="medallion-ticks"><use href="#medal-ticks"/></g>
            <circle cx="50" cy="50" r="36.5" class="medallion-inner"/>
        </svg>
        <span class="medallion-rosette"><svg class="guilloche" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width=".5" aria-hidden="true" focusable="false"><use href="#medal-rosette"/></svg></span>
        <span class="medallion-icon">${iconSvg}</span>
    </span>`);
}
