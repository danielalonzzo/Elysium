/**
 * Bloqueo con PIN, opcional y por dispositivo.
 *
 * Es privacidad de pantalla (que quien tome el teléfono no vea tus cuentas),
 * no cifrado: los datos siguen protegidos por la sesión de Firebase. El PIN no
 * se guarda: se guarda su derivación PBKDF2 con sal, en este dispositivo.
 */
import { html, local } from './dom.js';
import { icon } from './icons.js';
import { rosette } from './guilloche.js';

const KEY = 'patrimonio-lock';
let hiddenAt = null;
let locked = false;

function bytesToHex(bytes) {
    return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function derive(pin, saltHex) {
    const salt = new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16)));
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, material, 256);
    return bytesToHex(bits);
}

export function lockConfig() {
    return local.get(KEY, null);
}

export async function setPin(pin, minutes = 5) {
    const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    local.set(KEY, { salt, hash: await derive(pin, salt), minutes });
}

export function setLockMinutes(minutes) {
    const config = lockConfig();
    if (config) local.set(KEY, { ...config, minutes });
}

export function removePin() {
    local.remove(KEY);
}

async function verify(pin) {
    const config = lockConfig();
    if (!config) return true;
    return (await derive(pin, config.salt)) === config.hash;
}

export function showLock() {
    const config = lockConfig();
    if (!config || locked) return;
    locked = true;
    const screen = document.createElement('div');
    screen.className = 'lock-screen';
    screen.setAttribute('role', 'dialog');
    screen.setAttribute('aria-modal', 'true');
    screen.setAttribute('aria-label', 'Patrimonio bloqueado');
    let value = '';
    const draw = (error = false) => {
        screen.innerHTML = String(html`
            <div class="lock-inner ${error ? 'is-error' : ''}">
                <div class="splash-mark">${rosette({ seed: 'lock', size: 200, layers: 3 })}<b>λ</b></div>
                <p class="eyebrow is-gold">Elysium Patrimonio</p>
                <h2>Digite su PIN</h2>
                <div class="pin-dots">${Array.from({ length: 6 }, (_, i) => html`<span class="${i < value.length ? 'is-on' : ''}"></span>`)}</div>
                <div class="pin-pad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(key => key === ''
                    ? html`<span></span>`
                    : html`<button type="button" data-key="${key}" aria-label="${key === 'del' ? 'Borrar' : key}">${key === 'del' ? icon('arrow-left', { size: 20 }) : key}</button>`)}</div>
                ${error ? html`<p class="field-error">PIN incorrecto</p>` : html`<p class="faint">Bloqueado tras ${config.minutes} min sin uso</p>`}
            </div>`);
    };
    const press = async key => {
        if (key === 'del') value = value.slice(0, -1);
        else if (value.length < 6) value += key;
        draw();
        if (value.length >= 4 && await verify(value)) {
            locked = false;
            screen.classList.add('is-gone');
            setTimeout(() => screen.remove(), 300);
            document.removeEventListener('keydown', onKey, true);
        } else if (value.length === 6) {
            value = '';
            draw(true);
            try { navigator.vibrate?.([12, 40, 12]); } catch { /* sin vibración */ }
        }
    };
    const onKey = event => {
        if (/^\d$/.test(event.key)) { event.preventDefault(); event.stopPropagation(); press(event.key); }
        else if (event.key === 'Backspace') { event.preventDefault(); event.stopPropagation(); press('del'); }
        else if (event.key !== 'Tab') { event.stopPropagation(); }
    };
    screen.addEventListener('click', event => {
        const key = event.target.closest('[data-key]');
        if (key) press(key.dataset.key);
    });
    document.addEventListener('keydown', onKey, true);
    draw();
    document.body.append(screen);
}

/** Bloquea al abrir y al volver tras N minutos en segundo plano. */
export function initLock() {
    if (lockConfig()) showLock();
    document.addEventListener('visibilitychange', () => {
        const config = lockConfig();
        if (!config) return;
        if (document.visibilityState === 'hidden') hiddenAt = Date.now();
        else if (hiddenAt && Date.now() - hiddenAt > config.minutes * 60000) showLock();
    });
}
