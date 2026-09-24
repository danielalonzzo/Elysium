/**
 * Hojas, diálogos, avisos y confirmaciones.
 *
 * Una sola pieza, `openSheet`, se ve como hoja que sube desde abajo en el
 * móvil y como diálogo centrado en el escritorio (lo decide el CSS). Cada hoja
 * abierta añade una entrada al historial: el gesto «atrás» de Android o el
 * botón del navegador la cierran en vez de sacar a la persona de la app.
 */
import { html, $, haptic } from './dom.js';
import { icon } from './icons.js';

const stack = [];
let idCounter = 0;
let ignoreNextPop = 0;

function host(id) {
    let element = document.getElementById(id);
    if (!element) {
        element = document.createElement('div');
        element.id = id;
        document.body.append(element);
    }
    return element;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function trapFocus(event, container) {
    if (event.key !== 'Tab') return;
    const items = [...container.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

window.addEventListener('popstate', () => {
    if (ignoreNextPop > 0) { ignoreNextPop -= 1; return; }
    const top = stack[stack.length - 1];
    if (top) top.dismiss({ fromHistory: true });
});

window.addEventListener('keydown', event => {
    const top = stack[stack.length - 1];
    if (!top) return;
    if (event.key === 'Escape' && top.dismissible) {
        event.preventDefault();
        top.close();
    } else {
        trapFocus(event, top.panel);
    }
});

/**
 * @param {{title: string, subtitle?: string, content: any, size?: 'sm'|'md'|'lg'|'xl',
 *          onMount?: (body: HTMLElement, api: object) => void|(() => void),
 *          onClose?: () => void, dismissible?: boolean, className?: string, footer?: any}} options
 */
export function openSheet(options) {
    const id = `sheet-${++idCounter}`;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = String(html`
        <div class="sheet sheet-${options.size || 'md'} ${options.className || ''}" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
            <div class="sheet-grab" aria-hidden="true"><span></span></div>
            <header class="sheet-head">
                <div class="sheet-titles">
                    ${options.subtitle ? html`<p class="eyebrow">${options.subtitle}</p>` : ''}
                    <h2 id="${id}-title">${options.title}</h2>
                </div>
                ${options.dismissible === false ? '' : html`<button type="button" class="icon-btn" data-sheet-close aria-label="Cerrar">${icon('x')}</button>`}
            </header>
            <div class="sheet-body">${options.content}</div>
            ${options.footer ? html`<footer class="sheet-foot">${options.footer}</footer>` : ''}
        </div>`);
    host('overlays').append(overlay);
    document.documentElement.classList.add('has-overlay');

    const panel = overlay.querySelector('.sheet');
    const body = overlay.querySelector('.sheet-body');
    const previousFocus = document.activeElement;
    let cleanup = null;
    let closed = false;
    let resolveClosed;
    const closedPromise = new Promise(resolve => { resolveClosed = resolve; });

    const entry = {
        panel,
        dismissible: options.dismissible !== false,
        dismiss({ fromHistory = false } = {}) {
            if (closed) return closedPromise;
            closed = true;
            const index = stack.indexOf(entry);
            if (index !== -1) stack.splice(index, 1);
            if (!fromHistory) {
                ignoreNextPop += 1;
                history.back();
            }
            overlay.classList.add('is-leaving');
            const finish = () => {
                overlay.remove();
                entry.removeSwipe?.();
                if (!stack.length) document.documentElement.classList.remove('has-overlay');
                try { cleanup?.(); } catch { /* vista ya desmontada */ }
                options.onClose?.();
                if (previousFocus?.focus && document.contains(previousFocus)) previousFocus.focus({ preventScroll: true });
                resolveClosed();
            };
            const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            if (reduce) finish(); else setTimeout(finish, 220);
            return closedPromise;
        },
        close() { return entry.dismiss(); }
    };
    stack.push(entry);
    history.pushState({ patrimonioSheet: id }, '');

    const api = {
        body,
        panel,
        close: () => entry.close(),
        closed: closedPromise,
        setTitle(text) { const h = overlay.querySelector(`#${id}-title`); if (h) h.textContent = text; },
        setContent(content) { body.innerHTML = String(content); }
    };

    overlay.addEventListener('pointerdown', event => {
        if (event.target === overlay && entry.dismissible) entry.close();
    });
    overlay.querySelector('[data-sheet-close]')?.addEventListener('click', () => entry.close());
    entry.removeSwipe = enableSwipeToClose(panel, entry);

    requestAnimationFrame(() => {
        overlay.classList.add('is-open');
        const autofocus = panel.querySelector('[autofocus]') || panel.querySelector('.sheet-body ' + FOCUSABLE) || panel;
        if (autofocus === panel) panel.setAttribute('tabindex', '-1');
        autofocus.focus({ preventScroll: true });
    });

    const result = options.onMount?.(body, api);
    if (typeof result === 'function') cleanup = result;
    return api;
}

/** En el móvil la hoja se cierra arrastrándola hacia abajo desde su asa. */
function enableSwipeToClose(panel, entry) {
    const grab = panel.querySelector('.sheet-grab');
    const head = panel.querySelector('.sheet-head');
    let startY = null;
    let delta = 0;
    const down = event => {
        if (!entry.dismissible || window.innerWidth > 760) return;
        startY = event.clientY;
        delta = 0;
        panel.style.transition = 'none';
    };
    const move = event => {
        if (startY === null) return;
        delta = Math.max(0, event.clientY - startY);
        panel.style.transform = `translateY(${delta}px)`;
    };
    const up = () => {
        if (startY === null) return;
        panel.style.transition = '';
        panel.style.transform = '';
        if (delta > 110) entry.close();
        startY = null;
    };
    for (const handle of [grab, head]) {
        handle?.addEventListener('pointerdown', down);
    }
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
    };
}

/** Cierra todas las hojas deshaciendo sus entradas de historial de una vez. */
export function closeAllSheets() {
    const all = [...stack].reverse();
    if (!all.length) return Promise.resolve();
    ignoreNextPop += 1;
    history.go(-all.length);
    return Promise.all(all.map(entry => entry.dismiss({ fromHistory: true })));
}

export function hasOpenSheet() {
    return stack.length > 0;
}

/* ── Avisos ──────────────────────────────────────────────────────────────── */

/**
 * @param {string} message
 * @param {{tone?: 'success'|'info'|'error'|'gold', action?: {label: string, onClick: () => void}, duration?: number, iconName?: string}} [options]
 */
export function toast(message, options = {}) {
    const region = host('toasts');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('role', 'status');
    const element = document.createElement('div');
    const tone = options.tone || 'info';
    const iconName = options.iconName || { success: 'check-circle', error: 'alert-circle', gold: 'sparkle', info: 'info' }[tone];
    element.className = `toast is-${tone}`;
    element.innerHTML = String(html`
        <span class="toast-icon">${icon(iconName, { size: 18 })}</span>
        <span class="toast-text">${message}</span>
        ${options.action ? html`<button type="button" class="toast-action">${options.action.label}</button>` : ''}`);
    region.append(element);
    requestAnimationFrame(() => element.classList.add('is-in'));
    if (tone === 'error') haptic([10, 40, 10]);
    const remove = () => {
        element.classList.remove('is-in');
        setTimeout(() => element.remove(), 250);
    };
    element.querySelector('.toast-action')?.addEventListener('click', () => {
        options.action.onClick();
        remove();
    });
    setTimeout(remove, options.duration || (options.action ? 6000 : 3200));
    return remove;
}

/* ── Confirmación ────────────────────────────────────────────────────────── */

/**
 * @param {{title: string, body?: string, confirmLabel?: string, danger?: boolean, requireText?: string}} options
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title, body = '', confirmLabel = 'Confirmar', danger = false, requireText = '' }) {
    return new Promise(resolve => {
        let answered = false;
        openSheet({
            title,
            size: 'sm',
            className: 'is-confirm',
            content: html`
                ${body ? html`<p class="confirm-body">${body}</p>` : ''}
                ${requireText ? html`<label class="field"><span>Escriba <b>${requireText}</b> para confirmar</span><input type="text" data-confirm-text autocomplete="off" autocapitalize="off"></label>` : ''}
                <div class="confirm-actions">
                    <button type="button" class="btn btn-ghost" data-answer="no">Cancelar</button>
                    <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-answer="yes" ${requireText ? 'disabled' : ''}>${confirmLabel}</button>
                </div>`,
            onMount(bodyEl, api) {
                const yes = bodyEl.querySelector('[data-answer="yes"]');
                bodyEl.querySelector('[data-confirm-text]')?.addEventListener('input', event => {
                    yes.disabled = event.target.value.trim().toUpperCase() !== requireText.toUpperCase();
                });
                bodyEl.addEventListener('click', event => {
                    const button = event.target.closest('[data-answer]');
                    if (!button) return;
                    answered = true;
                    resolve(button.dataset.answer === 'yes');
                    api.close();
                });
            },
            onClose() { if (!answered) resolve(false); }
        });
    });
}

/**
 * Menú de acciones (en móvil, hoja; en escritorio, diálogo compacto).
 * @param {{title: string, subtitle?: string, actions: Array<{label: string, icon?: string, danger?: boolean, hint?: string, onClick: () => void}>}} options
 */
export function actionSheet({ title, subtitle, actions }) {
    return openSheet({
        title,
        subtitle,
        size: 'sm',
        content: html`<div class="action-list">${actions.map((action, index) => html`
            <button type="button" class="action-item${action.danger ? ' is-danger' : ''}" data-action-index="${index}">
                ${action.icon ? html`<span class="action-icon">${icon(action.icon)}</span>` : ''}
                <span class="action-label">${action.label}${action.hint ? html`<small>${action.hint}</small>` : ''}</span>
                ${icon('chevron-right', { size: 16, className: 'action-chevron' })}
            </button>`)}</div>`,
        onMount(body, api) {
            body.addEventListener('click', async event => {
                const button = event.target.closest('[data-action-index]');
                if (!button) return;
                const action = actions[Number(button.dataset.actionIndex)];
                await api.close();
                action.onClick();
            });
        }
    });
}
