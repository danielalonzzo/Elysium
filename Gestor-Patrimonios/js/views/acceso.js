/**
 * Acceso: entrar, crear cuenta, recuperar contraseña, y la espera de la
 * licencia (que el administrador activa desde el CRM).
 *
 * El proyecto tiene activada la protección contra enumeración de correos:
 * recuperar contraseña «funciona» exista o no la cuenta, así que el mensaje de
 * éxito es condicional y nombra al remitente para buscarlo en spam.
 */
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { rosette } from '../ui/guilloche.js';
import * as fb from '../firebase.js';

function brand() {
    return html`<a class="brand" href="#/" aria-label="Elysium Patrimonio">
        <span class="brand-mark">${rosette({ seed: 'patrimonio-brand', size: 120, layers: 2, strokeWidth: 1 })}<b>λ</b></span>
        <span class="brand-text"><b>Patrimonio</b><small>Elysium</small></span>
    </a>`;
}

function art() {
    return html`<aside class="auth-art">
        ${rosette({ seed: 'auth', size: 780, layers: 6, strokeWidth: 0.5 })}
        ${brand()}
        <div class="auth-quote">
            <h2>Su dinero, <em>con un plan.</em></h2>
            <p>Registre en segundos, vea a dónde va cada colón y sepa cuándo llega a sus sueños: el carro, la finca, el viaje.</p>
        </div>
        <div class="auth-points"><ul>
            <li>${icon('target')}Metas con fecha real de llegada</li>
            <li>${icon('scale')}«¿Me alcanza?» antes de comprar</li>
            <li>${icon('bell')}Alertas de presupuesto y pagos por correo</li>
            <li>${icon('receipt')}Lee sus facturas electrónicas de Hacienda</li>
        </ul></div>
    </aside>`;
}

export function renderAuth(root, mode = 'login', notice = null) {
    const titles = {
        login: ['Bienvenido de nuevo', 'Ingrese para ver su patrimonio.'],
        register: ['Cree su cuenta', 'Su acceso lo activa Elysium. Le avisamos por correo.'],
        reset: ['Recupere su acceso', 'Le enviaremos un enlace para crear una contraseña nueva.']
    };
    const [title, lead] = titles[mode];
    root.innerHTML = String(html`<div class="auth">
        ${art()}
        <main class="auth-panel">
            <div class="auth-card">
                <div class="auth-mobile-brand">${brand()}</div>
                <h1>${title}</h1>
                <p>${lead}</p>
                <form class="form" novalidate data-auth-form>
                    ${mode === 'register' ? html`<label class="field"><span>Nombre</span><input name="name" autocomplete="name" required maxlength="80" autofocus></label>` : ''}
                    <label class="field"><span>Correo</span><input name="email" type="email" autocomplete="email" inputmode="email" required ${mode !== 'register' ? 'autofocus' : ''}></label>
                    ${mode !== 'reset' ? html`<label class="field"><span>Contraseña ${mode === 'login' ? html`<button type="button" class="link-btn" data-mode="reset" style="font-size:.76rem">¿La olvidó?</button>` : html`<small>mínimo 8 caracteres</small>`}</span>
                        <input name="password" type="password" autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}" required minlength="${mode === 'register' ? 8 : 1}"></label>` : ''}
                    <button type="submit" class="btn btn-primary btn-lg btn-block">${{ login: 'Ingresar', register: 'Crear cuenta y solicitar acceso', reset: 'Enviar enlace' }[mode]}</button>
                    <div data-notice>${notice ? html`<div class="auth-note ${notice.kind ? 'is-' + notice.kind : ''}">${notice.text}</div>` : ''}</div>
                </form>
                <p class="auth-foot">
                    ${mode === 'login' ? html`¿Primera vez? <button type="button" class="link-btn" data-mode="register">Cree su cuenta</button>` : html`<button type="button" class="link-btn" data-mode="login">Volver a ingresar</button>`}
                    · <a href="#/demo" data-demo>Ver la demostración</a>
                </p>
            </div>
        </main>
    </div>`);

    root.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => renderAuth(root, button.dataset.mode)));
    root.querySelector('[data-demo]')?.addEventListener('click', event => {
        event.preventDefault();
        try { sessionStorage.setItem('patrimonio-demo', '1'); } catch { /* sin sesión */ }
        location.hash = '#/inicio';
        location.reload();
    });
    const form = root.querySelector('[data-auth-form]');
    const noticeHost = root.querySelector('[data-notice]');
    const say = (text, kind = '') => { noticeHost.innerHTML = String(html`<div class="auth-note ${kind ? 'is-' + kind : ''}">${text}</div>`); };
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        const submit = form.querySelector('[type="submit"]');
        if (!/^\S+@\S+\.\S+$/.test(String(data.email || '').trim())) return say('Escriba un correo válido.', 'error');
        if (mode === 'register' && String(data.password || '').length < 8) return say('La contraseña necesita al menos 8 caracteres.', 'error');
        if (mode === 'register' && !String(data.name || '').trim()) return say('Escriba su nombre.', 'error');
        submit.disabled = true;
        try {
            if (mode === 'login') await fb.signIn(data.email, data.password);
            else if (mode === 'register') await fb.register(data.name, data.email, data.password);
            else {
                await fb.resetPassword(data.email);
                say(html`Si existe una cuenta para <b>${data.email}</b>, recibirá un enlace para cambiar la contraseña. Llega desde <b>noreply@elysiumdr-eu.firebaseapp.com</b>; revise también el correo no deseado.`, 'ok');
            }
        } catch (error) {
            say(fb.authErrorMessage(error), 'error');
        } finally {
            submit.disabled = false;
        }
    });
}

/**
 * Pantalla de espera: la cuenta existe pero la licencia de Patrimonio aún no
 * está activa (o está suspendida). Se actualiza sola cuando cambia en el CRM.
 */
export function renderPending(root, { user, access, request }) {
    const suspended = access && access.active === false;
    const verified = user.emailVerified;
    root.innerHTML = String(html`<div class="auth">
        ${art()}
        <main class="auth-panel">
            <div class="auth-card">
                <div class="auth-mobile-brand">${brand()}</div>
                ${suspended ? html`
                    <h1>Acceso en pausa</h1>
                    <p>Su licencia de Elysium Patrimonio está suspendida. Sus datos siguen guardados y vuelven en cuanto se reactive.</p>
                    <a class="btn btn-ghost btn-block" href="mailto:info@elysiumdr.eu?subject=Elysium%20Patrimonio">${icon('mail', { size: 17 })}Escribir a Elysium</a>`
                : request ? html`
                    <h1>Solicitud enviada</h1>
                    <p>Hola${user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}. Elysium revisará su acceso; cuando se active, esta pantalla se abrirá sola.</p>
                    <div class="stack">
                        <div class="callout ${verified ? 'is-ok' : 'is-warn'}">${icon(verified ? 'check-circle' : 'mail')}<span>${verified
                            ? html`Correo <b>${user.email}</b> verificado.`
                            : html`Verifique <b>${user.email}</b> con el enlace que le enviamos. Sin eso no podremos mandarle alertas por correo.`}</span></div>
                        <div class="callout">${icon('hourglass')}<span>Solicitado ${request.requestedAt?.toDate ? 'el ' + request.requestedAt.toDate().toLocaleDateString('es-CR', { day: 'numeric', month: 'long' }) : 'hace un momento'}.</span></div>
                        ${verified ? '' : html`<div class="row wrap"><button type="button" class="btn btn-ghost" data-resend>${icon('refresh', { size: 16 })}Reenviar correo</button><button type="button" class="btn btn-quiet" data-check>Ya lo verifiqué</button></div>`}
                    </div>`
                : html`
                    <h1>Solicite su acceso</h1>
                    <p>Su cuenta está lista. Elysium Patrimonio funciona con licencia: envíe la solicitud y le avisamos al activarla.</p>
                    <form class="form" data-request>
                        <label class="field"><span>Mensaje <small>opcional</small></span><textarea name="note" maxlength="280" rows="3" placeholder="Por ejemplo, quién le recomendó la app"></textarea></label>
                        <button type="submit" class="btn btn-gold btn-lg btn-block">${icon('sparkle', { size: 18 })}Solicitar acceso</button>
                    </form>`}
                <div data-notice></div>
                <p class="auth-foot">${user.email} · <button type="button" class="link-btn" data-signout>Cerrar sesión</button></p>
            </div>
        </main>
    </div>`);

    const noticeHost = root.querySelector('[data-notice]');
    const say = (text, kind = '') => { noticeHost.innerHTML = String(html`<div class="auth-note ${kind ? 'is-' + kind : ''}">${text}</div>`); };
    root.querySelector('[data-signout]')?.addEventListener('click', () => fb.signOutUser());
    root.querySelector('[data-resend]')?.addEventListener('click', async () => {
        try { await fb.resendVerification(); say('Correo reenviado. Revise también el correo no deseado.', 'ok'); } catch (error) { say(fb.authErrorMessage(error), 'error'); }
    });
    root.querySelector('[data-check]')?.addEventListener('click', async () => {
        const fresh = await fb.reloadUser();
        if (fresh?.emailVerified) renderPending(root, { user: fresh, access, request });
        else say('Todavía no aparece verificado. Abra el enlace del correo y vuelva a probar.', 'error');
    });
    root.querySelector('[data-request]')?.addEventListener('submit', async event => {
        event.preventDefault();
        const button = event.target.querySelector('[type="submit"]');
        button.disabled = true;
        try {
            await fb.requestAccess(user, new FormData(event.target).get('note'));
        } catch (error) {
            console.error(error);
            say('No se pudo enviar la solicitud. Revise su conexión y vuelva a intentarlo.', 'error');
            button.disabled = false;
        }
    });
}
