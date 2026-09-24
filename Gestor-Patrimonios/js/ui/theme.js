/** Tema (Medianoche, Marfil o el del sistema) y modo discreto, por dispositivo. */
import { local } from './dom.js';

export function getTheme() {
    return local.get('patrimonio-theme', 'dark');
}

export function setTheme(theme) {
    local.set('patrimonio-theme', theme);
    const root = document.documentElement;
    if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
    document.dispatchEvent(new CustomEvent('patrimonio:theme'));
}

export function isPrivate() {
    return document.documentElement.classList.contains('is-private');
}

export function setPrivate(value) {
    local.set('patrimonio-private', Boolean(value));
    document.documentElement.classList.toggle('is-private', Boolean(value));
    document.dispatchEvent(new CustomEvent('patrimonio:private'));
}
