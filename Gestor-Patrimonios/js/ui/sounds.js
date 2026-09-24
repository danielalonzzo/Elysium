/**
 * Sonidos de interfaz, opcionales (Ajustes → Sonidos).
 *
 * Usa las mismas muestras que el resto de Elysium (`/sounds/`), pero no carga
 * `JS/elysium-audio.js`: ese módulo suena en cada clic y añade su propio botón
 * flotante. Aquí solo suenan los momentos que importan: guardar, completar una
 * meta, un error.
 */
import { app } from '../context.js';

const FILES = {
    success: '/sounds/enviado-con-exito',
    tap: '/sounds/click-en-boton',
    error: '/sounds/error',
    soft: '/sounds/toque-al-vacio'
};
const GAIN = { success: 0.35, tap: 0.22, error: 0.35, soft: 0.3 };

let context = null;
const buffers = new Map();

function extension() {
    const probe = document.createElement('audio');
    return probe.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? '.m4a' : '.wav';
}

async function load(name) {
    if (buffers.has(name)) return buffers.get(name);
    const promise = fetch(FILES[name] + extension())
        .then(response => response.arrayBuffer())
        .then(data => context.decodeAudioData(data))
        .catch(() => null);
    buffers.set(name, promise);
    return promise;
}

export async function play(name) {
    if (!app.prefs.sounds || !FILES[name]) return;
    try {
        context = context || new (window.AudioContext || window.webkitAudioContext)();
        if (context.state === 'suspended') await context.resume();
        const buffer = await load(name);
        if (!buffer) return;
        const source = context.createBufferSource();
        const gain = context.createGain();
        gain.gain.value = GAIN[name] || 0.3;
        source.buffer = buffer;
        source.connect(gain).connect(context.destination);
        source.start();
    } catch { /* sin audio: no pasa nada */ }
}
