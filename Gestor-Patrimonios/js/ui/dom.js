/**
 * Utilidades de DOM.
 *
 * Las vistas se escriben como plantillas de texto (igual que el CRM), pero con
 * `html\`…\`` en lugar de concatenar: todo valor interpolado se escapa salvo
 * que venga envuelto en `raw()` o sea el resultado de otro `html`. Así el
 * nombre de un comercio con «<» no puede inyectar marcado.
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ESCAPES[char]);
}

class Raw {
    constructor(text) { this.text = String(text); }
    toString() { return this.text; }
}

export const raw = text => new Raw(text ?? '');

function interpolate(value) {
    if (value == null) return '';
    // Los booleanos se escriben tal cual para que `aria-pressed="${activo}"`
    // funcione. Las plantillas usan `cond ? html`…` : ''`, nunca `cond && …`.
    if (value === true || value === false) return String(value);
    if (value instanceof Raw) return value.text;
    if (Array.isArray(value)) return value.map(interpolate).join('');
    return esc(value);
}

export function html(strings, ...values) {
    let out = strings[0];
    for (let i = 0; i < values.length; i += 1) out += interpolate(values[i]) + strings[i + 1];
    return new Raw(out);
}

export function uid(prefix = '') {
    const random = globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 20)
        || Math.random().toString(36).slice(2) + Date.now().toString(36);
    return prefix + random;
}

export function debounce(fn, ms = 60) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

/** Vibración corta en Android; en iOS no existe y no pasa nada. */
export function haptic(pattern = 8) {
    try { navigator.vibrate?.(pattern); } catch { /* sin soporte */ }
}

export function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Lectura y escritura tolerantes de localStorage (modo privado, cuota llena…). */
export const local = {
    get(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch { return fallback; }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento */ }
    },
    remove(key) {
        try { localStorage.removeItem(key); } catch { /* sin almacenamiento */ }
    }
};

/** Anima un número de 0 a su valor (las cifras «cuentan» al aparecer). */
export function countUp(element, to, format, duration = 900) {
    if (!element) return;
    if (prefersReducedMotion()) { element.textContent = format(to); return; }
    const start = performance.now();
    const step = now => {
        // El primer fotograma puede traer una marca anterior a `start`: sin el
        // límite inferior, la cifra asomaba negativa un instante.
        const t = Math.min(1, Math.max(0, (now - start) / duration));
        const eased = 1 - Math.pow(1 - t, 4);
        element.textContent = format(Math.round(to * eased));
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

/** Descarga un texto como archivo sin servidor. */
export function downloadText(filename, text, type = 'text/plain') {
    const blob = new Blob([text], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function readFileText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

/**
 * Reduce una foto antes de subirla: 2000 px de lado mayor y WebP/JPEG al 82%.
 * Una foto de iPhone pasa de ~4 MB a ~300 KB y la factura sigue legible.
 */
export async function compressImage(file, maxSide = 2000, quality = 0.82) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        if (scale === 1 && file.size < 900000) return file;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const type = 'image/webp';
        const blob = await new Promise(resolve => { canvas.toBlob(resolve, type, quality); });
        if (!blob || blob.size >= file.size) return file;
        return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type });
    } catch {
        return file;
    }
}
