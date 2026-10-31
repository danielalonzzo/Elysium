import { ACCOUNT_COPY } from './tools-account-copy.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.8.0/';
const language = String(document.documentElement.lang).slice(0, 2);
const copy = ACCOUNT_COPY[language] || ACCOUNT_COPY.en;
const gate = document.querySelector('[data-tools-account]');
const workspace = document.querySelector('[data-tools-workspace]');
let auth, sdk, user, loaded = false, everLoaded = false, refreshId = 0, busy = false, sessionUid = null;
const status = gate?.querySelector('[data-account-status]');
const show = (selector, visible) => { const element = gate.querySelector(selector); if (element) element.hidden = !visible; };
const message = text => { status.textContent = text; };
const removeWorkspace = () => { if (workspace) workspace.replaceChildren(); loaded = false; };

async function api(path, { method = 'GET', body } = {}) {
    const headers = { Authorization: `Bearer ${await user.getIdToken()}` };
    if (body) headers['Content-Type'] = 'application/json';
    const response = await fetch(`/api/tools/account/${path}`, { method, headers,
        body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.code || 'account_error'), { code: data.code });
    return data;
}

async function mountWorkspace(id, uid) {
    if (!workspace || loaded) return;
    if (everLoaded) { location.reload(); return; }
    const query = new URLSearchParams({ page: workspace.dataset.page, lang: language });
    const response = await fetch(`/api/tools/workspace?${query}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('workspace_unavailable');
    const html = await response.text();
    if (id !== refreshId || auth.currentUser?.uid !== uid) return;
    workspace.innerHTML = html;
    loaded = everLoaded = true;
    for (const module of JSON.parse(workspace.dataset.modules)) await import(module);
}

async function refresh() {
    const id = ++refreshId;
    user = auth.currentUser;
    if (sessionUid !== user?.uid) removeWorkspace();
    sessionUid = user?.uid;
    show('[data-account-auth]', !user);
    show('[data-account-profile]', Boolean(user));
    show('[data-account-request]', false);
    show('[data-account-verify]', false);
    show('[data-account-active]', false);
    if (!user) { removeWorkspace(); message(''); return; }
    if (!user.emailVerified) {
        await sdk.reload(user).catch(() => {});
        if (id !== refreshId) return;
        if (user.emailVerified) await user.getIdToken(true);
    }
    gate.querySelector('[data-account-email]').textContent = user.email || '';
    if (!user.emailVerified) {
        removeWorkspace(); show('[data-account-verify]', true); message(copy.verify); return;
    }
    try {
        const data = await api('session', { method: 'POST' });
        if (id !== refreshId) return;
        const state = data.license?.status || data.request?.status;
        if (data.allowed === true) {
            show('[data-account-active]', true);
            gate.querySelector('[data-account-license]').textContent = data.license.licenseCode;
            message(copy.active);
            await mountWorkspace(id, user.uid);
        } else {
            removeWorkspace();
            show('[data-account-request]', !state);
            gate.querySelector('[name="name"]').value = data.profile?.name || user.displayName || '';
            message(copy[state] || copy.intro);
        }
    } catch {
        if (id !== refreshId) return;
        removeWorkspace(); message(copy.error);
    }
}

async function action(operation) {
    if (busy) return;
    busy = true;
    gate.querySelectorAll('button').forEach(button => { button.disabled = true; });
    try { await operation(); }
    catch (error) { message(error.code === 'auth/email-already-in-use' ? copy.emailInUse : error.code?.startsWith('auth/') ? copy.authError : copy.error); }
    finally { busy = false; gate.querySelectorAll('button').forEach(button => { button.disabled = false; }); }
}

if (gate) {
    message(copy.loading);
    try {
        const [appMod, authMod] = await Promise.all([import(`${SDK}firebase-app.js`), import(`${SDK}firebase-auth.js`)]);
        sdk = authMod;
        const app = appMod.getApps().find(app => app.name === 'elysium-tools') || appMod.initializeApp({
            apiKey: 'AIzaSyABcv1SqIHF78JqU5QVkLd3I94pI2YNPoE', authDomain: 'elysiumdr-eu.firebaseapp.com',
            projectId: 'elysiumdr-eu', appId: '1:392918383359:web:b4c661f025f9162d4d6aca'
        }, 'elysium-tools');
        auth = sdk.getAuth(app);
        auth.languageCode = language;
        sdk.onIdTokenChanged(auth, () => refresh());
        const returnUrl = () => ({ url: `${location.origin}/${language === 'en' ? '' : `${language}/`}` });
        gate.querySelector('[data-signin-form]').addEventListener('submit', event => {
            event.preventDefault(); const form = event.currentTarget;
            action(async () => { await sdk.signInWithEmailAndPassword(auth, form.email.value.trim(), form.password.value); form.reset(); });
        });
        gate.querySelector('[data-signup-form]').addEventListener('submit', event => {
            event.preventDefault(); const form = event.currentTarget;
            action(async () => {
                const credential = await sdk.createUserWithEmailAndPassword(auth, form.email.value.trim(), form.password.value);
                await sdk.updateProfile(credential.user, { displayName: form.fullName.value.trim() });
                await sdk.sendEmailVerification(credential.user, returnUrl());
                form.reset(); message(copy.registered);
            });
        });
        gate.querySelector('[data-account-request]').addEventListener('submit', event => {
            event.preventDefault(); const form = event.currentTarget;
            action(async () => { await api('request', { method: 'POST', body: { name: form.elements.name.value,
                note: form.note.value, language, responsibleUse: form.responsibleUse.checked } }); await refresh(); });
        });
        gate.addEventListener('click', event => {
            const button = event.target.closest('[data-account-action]');
            if (!button) return;
            const kind = button.dataset.accountAction;
            if (kind === 'login' || kind === 'register') {
                show('[data-signin-form]', kind === 'login'); show('[data-signup-form]', kind === 'register'); message(''); return;
            }
            action(async () => {
                if (kind === 'logout') {
                    await fetch('/api/tools/account/session', { method: 'DELETE' });
                    removeWorkspace(); await sdk.signOut(auth); location.reload();
                } else if (kind === 'refresh') {
                    if (auth.currentUser) { await sdk.reload(auth.currentUser); await auth.currentUser.getIdToken(true); }
                    await refresh();
                } else if (kind === 'resend') {
                    await sdk.sendEmailVerification(auth.currentUser, returnUrl()); message(copy.sent);
                } else if (kind === 'reset') {
                    const email = gate.querySelector('[data-signin-form] [name="email"]');
                    if (!email.reportValidity() || !email.value.trim()) return;
                    await sdk.sendPasswordResetEmail(auth, email.value.trim(), returnUrl()); message(copy.sent);
                }
            });
        });
        // A suspended license is enforced on every server request; this also removes an idle workspace.
        setInterval(() => { if (document.visibilityState === 'visible' && auth.currentUser && !busy) refresh(); }, 60000);
        window.addEventListener('focus', () => { if (!busy) refresh(); });
    } catch { message(copy.error); }
}
