/**
 * Elysium λ — Library · administración
 *
 * Publicar y retirar libros de /library. Lo carga `library.js` bajo demanda.
 * La sesión es la de Firebase de todo el sitio (la misma app `[DEFAULT]` que el
 * CRM): quien ya entró en /admin llega identificado.
 *
 * Lo que se decide aquí es solo la interfaz. Quién puede publicar y qué se
 * acepta lo vuelve a comprobar el Worker (`worker/library.js`) con el token:
 * este fichero puede adelantar un error, nunca conceder un permiso.
 */
import { auth } from './firebase-config.js';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const MAX_BOOK_BYTES = 24 * 1024 * 1024;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(['api', 'index', 'reader', 'book', 'download']);
/** El mismo criterio que `isLibraryAdmin()` en el Worker: solo esta cuenta. */
const ADMIN_EMAILS = new Set(['daniel.morales@elysiumdr.eu']);

const ERROR_COPY = {
    library_file_empty: 'fileEmpty',
    library_file_too_large: 'fileTooLarge',
    library_not_html: 'fileNotHtml',
    library_not_utf8: 'fileNotUtf8',
    library_title_missing: 'titleMissing',
    library_slug_invalid: 'slugInvalid',
    library_slug_taken: 'slugTaken',
    library_auth_required: 'sessionExpired',
    library_auth_expired: 'sessionExpired',
    library_auth_invalid: 'sessionExpired',
    library_admin_required: 'adminForbidden',
    library_not_configured: 'adminNotConfigured'
};

export function slugify(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80)
        .replace(/-+$/g, '');
}

function isValidSlug(slug) {
    return SLUG.test(slug) && slug.length <= 80 && !RESERVED_SLUGS.has(slug);
}

function isAdminClaims(claims) {
    if (!claims || claims.email_verified !== true) return false;
    return ADMIN_EMAILS.has(String(claims.email || '').toLowerCase());
}

/** Título, descripción e idioma del propio HTML, para rellenar el formulario. */
function readDocumentDetails(text) {
    const headEnd = text.search(/<\/head\s*>/i);
    const head = text.slice(0, headEnd === -1 ? 64 * 1024 : Math.min(headEnd + 7, 256 * 1024));
    // DOMParser no ejecuta scripts ni pide recursos: solo se leen tres datos.
    const parsed = new DOMParser().parseFromString(head, 'text/html');
    const title = (parsed.querySelector('title')?.textContent || '').replace(/\s+/g, ' ').trim();
    const description = (parsed.querySelector('meta[name="description" i]')?.getAttribute('content') || '')
        .replace(/\s+/g, ' ')
        .trim();
    return { title, description };
}

function looksLikeHtmlDocument(text) {
    let rest = text.slice(0, 64 * 1024).replace(/^\uFEFF/, '');
    for (;;) {
        rest = rest.replace(/^\s+/, '');
        if (!rest.startsWith('<!--')) break;
        const end = rest.indexOf('-->', 4);
        if (end === -1) return false;
        rest = rest.slice(end + 3);
    }
    return /^<!doctype\s+html(?:[\s>])/i.test(rest) || /^<html(?:[\s>])/i.test(rest);
}

class LibraryAdminError extends Error {
    constructor(copyKey, userMessage) {
        super(copyKey);
        this.copyKey = copyKey;
        this.userMessage = userMessage;
    }
}

export function initLibraryAdmin(library) {
    const { t } = library;
    const states = [...document.querySelectorAll('[data-admin-state]')];
    const identity = document.querySelector('[data-admin-identity]');
    const emailLabel = document.querySelector('[data-admin-email]');
    const signOutButton = document.querySelector('[data-admin-signout]');
    const signInForm = document.querySelector('[data-admin-signin]');
    const signInStatus = document.querySelector('[data-signin-status]');
    const form = document.querySelector('[data-upload-form]');
    const dropzone = document.querySelector('[data-dropzone]');
    const fileInput = document.querySelector('[data-file-input]');
    const fileName = document.querySelector('[data-file-name]');
    const replaceRow = document.querySelector('[data-replace-row]');
    const submitButton = document.querySelector('[data-upload-submit]');
    const progress = document.querySelector('[data-upload-progress]');
    const uploadStatus = document.querySelector('[data-upload-status]');

    let currentState = 'loading';
    let selectedFile = null;
    let slugEdited = false;
    let titleAutofilled = '';
    let descriptionAutofilled = '';
    let busy = false;
    let lastStatus = null;

    function showState(name) {
        currentState = name;
        states.forEach(node => { node.hidden = node.getAttribute('data-admin-state') !== name; });
    }

    function setStatus(target, tone, copyKey, extra) {
        if (!target) return;
        target.replaceChildren();
        target.removeAttribute('data-tone');
        if (!copyKey) return;
        if (tone) target.setAttribute('data-tone', tone);
        target.append(document.createTextNode(t(copyKey, extra?.values)));
        if (extra?.link) {
            const link = document.createElement('a');
            link.href = extra.link.href;
            link.textContent = extra.link.text;
            target.append(document.createTextNode(' '), link, document.createTextNode('. '));
            if (extra.after) target.append(document.createTextNode(t(extra.after)));
        }
        if (target === uploadStatus) lastStatus = { tone, copyKey, extra };
    }

    // ── Sesión ───────────────────────────────────────────────────────────────

    const api = {
        async remove(slug) {
            const response = await authorizedFetch(`/library/api/books/${encodeURIComponent(slug)}`, { method: 'DELETE' });
            if (!response.ok) throw await responseError(response, 'removeFailed');
        }
    };

    async function idToken() {
        const user = auth.currentUser;
        if (!user) throw new LibraryAdminError('sessionExpired', t('sessionExpired'));
        return user.getIdToken();
    }

    async function authorizedFetch(url, options) {
        const token = await idToken();
        try {
            return await fetch(url, {
                ...options,
                headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` }
            });
        } catch {
            throw new LibraryAdminError('networkError', t('networkError'));
        }
    }

    async function responseError(response, fallback) {
        let code = '';
        try { code = (await response.json()).code || ''; } catch { /* sin cuerpo JSON */ }
        const copyKey = ERROR_COPY[code] || fallback;
        return new LibraryAdminError(copyKey, t(copyKey));
    }

    onAuthStateChanged(auth, async user => {
        if (!user) {
            identity.hidden = true;
            library.setAdmin(false);
            showState('signed-out');
            return;
        }
        emailLabel.textContent = user.email || '';
        identity.hidden = false;
        let admin = false;
        try {
            const token = await user.getIdTokenResult();
            admin = isAdminClaims(token.claims);
        } catch (error) {
            console.warn('[library] could not read the session claims:', error);
        }
        if (!admin) {
            library.setAdmin(false);
            showState('forbidden');
            return;
        }
        library.setAdmin(true, api);
        showState(library.configured ? 'admin' : 'not-configured');
    });

    signInForm?.addEventListener('submit', async event => {
        event.preventDefault();
        const email = signInForm.email.value.trim();
        const password = signInForm.password.value;
        if (!email || !password) {
            setStatus(signInStatus, 'error', 'signInMissing');
            return;
        }
        const button = signInForm.querySelector('button[type="submit"]');
        button.disabled = true;
        setStatus(signInStatus, '', 'signingIn');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            signInForm.reset();
            setStatus(signInStatus, '', '');
        } catch (error) {
            const code = error?.code || '';
            const key = code === 'auth/too-many-requests'
                ? 'signInTooMany'
                : code === 'auth/network-request-failed' ? 'signInNetwork' : 'signInFailed';
            setStatus(signInStatus, 'error', key);
        } finally {
            button.disabled = false;
        }
    });

    signOutButton?.addEventListener('click', () => {
        signOut(auth).catch(error => console.warn('[library] sign-out failed:', error));
    });

    // ── Fichero ──────────────────────────────────────────────────────────────

    function slugInput() { return form.elements.slug; }

    function refreshReplaceRow() {
        const slug = slugInput().value;
        const exists = library.books().some(entry => entry.slug === slug);
        replaceRow.hidden = !exists;
        if (!exists) form.elements.replace.checked = false;
    }

    async function chooseFile(file) {
        setStatus(uploadStatus, '', '');
        selectedFile = null;
        fileName.textContent = '';
        if (!file) return;

        if (!/\.html?$/i.test(file.name) || (file.type && file.type !== 'text/html')) {
            setStatus(uploadStatus, 'error', 'fileNotHtml');
            fileInput.value = '';
            return;
        }
        if (file.size === 0) { setStatus(uploadStatus, 'error', 'fileEmpty'); fileInput.value = ''; return; }
        if (file.size > MAX_BOOK_BYTES) { setStatus(uploadStatus, 'error', 'fileTooLarge'); fileInput.value = ''; return; }

        let text;
        try {
            // `fatal` rechaza un fichero que no esté en UTF-8 antes de subirlo.
            text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
        } catch {
            setStatus(uploadStatus, 'error', 'fileNotUtf8');
            fileInput.value = '';
            return;
        }
        if (!looksLikeHtmlDocument(text)) {
            setStatus(uploadStatus, 'error', 'fileNotHtml');
            fileInput.value = '';
            return;
        }

        selectedFile = file;
        fileName.textContent = file.name;
        const details = readDocumentDetails(text);
        const titleField = form.elements.title;
        const descriptionField = form.elements.description;
        const fallbackTitle = file.name.replace(/\.html?$/i, '').replace(/[-_]+/g, ' ').trim();
        if (!titleField.value || titleField.value === titleAutofilled) {
            titleAutofilled = details.title || fallbackTitle;
            titleField.value = titleAutofilled;
        }
        if (!descriptionField.value || descriptionField.value === descriptionAutofilled) {
            descriptionAutofilled = details.description.slice(0, 400);
            descriptionField.value = descriptionAutofilled;
        }
        if (!slugEdited || !slugInput().value) {
            slugInput().value = slugify(titleField.value || fallbackTitle);
            slugEdited = false;
        }
        refreshReplaceRow();
    }

    fileInput.addEventListener('change', () => chooseFile(fileInput.files && fileInput.files[0]));

    ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => {
        event.preventDefault();
        dropzone.classList.add('is-dragging');
    }));
    ['dragleave', 'dragend', 'drop'].forEach(type => dropzone.addEventListener(type, () => {
        dropzone.classList.remove('is-dragging');
    }));
    dropzone.addEventListener('drop', event => {
        event.preventDefault();
        const file = event.dataTransfer?.files?.[0];
        if (!file) return;
        // El input queda con el mismo fichero para que el formulario sea
        // coherente si se vuelve a elegir.
        try {
            const transfer = new DataTransfer();
            transfer.items.add(file);
            fileInput.files = transfer.files;
        } catch { /* Safari antiguo: basta con el fichero en memoria */ }
        chooseFile(file);
    });

    form.elements.title.addEventListener('input', () => {
        if (!slugEdited) slugInput().value = slugify(form.elements.title.value);
        refreshReplaceRow();
    });

    slugInput().addEventListener('input', () => {
        const input = slugInput();
        const cleaned = input.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').slice(0, 80);
        if (cleaned !== input.value) input.value = cleaned;
        slugEdited = true;
        refreshReplaceRow();
    });
    slugInput().addEventListener('blur', () => {
        slugInput().value = slugify(slugInput().value);
        refreshReplaceRow();
    });

    // ── Publicar ─────────────────────────────────────────────────────────────

    function upload(url, token, file, meta) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open('PUT', url);
            request.setRequestHeader('Authorization', `Bearer ${token}`);
            request.setRequestHeader('Content-Type', 'text/html; charset=utf-8');
            request.setRequestHeader('X-Library-Meta', encodeURIComponent(JSON.stringify(meta)));
            request.responseType = 'json';
            request.upload.addEventListener('progress', event => {
                if (!event.lengthComputable) return;
                const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
                progress.value = percent;
                setStatus(uploadStatus, '', percent >= 99 ? 'processing' : 'publishing', { values: { percent } });
            });
            request.addEventListener('load', () => resolve({ status: request.status, body: request.response || {} }));
            request.addEventListener('error', () => reject(new LibraryAdminError('networkError', t('networkError'))));
            request.addEventListener('abort', () => reject(new LibraryAdminError('uploadFailed', t('uploadFailed'))));
            request.send(file);
        });
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (busy) return;

        const title = form.elements.title.value.replace(/\s+/g, ' ').trim();
        const slug = slugify(slugInput().value);
        slugInput().value = slug;
        const replace = form.elements.replace.checked;
        const exists = library.books().some(entry => entry.slug === slug);

        if (!selectedFile) return setStatus(uploadStatus, 'error', 'fileMissing');
        if (!title) return setStatus(uploadStatus, 'error', 'titleMissing');
        if (!isValidSlug(slug)) return setStatus(uploadStatus, 'error', 'slugInvalid');
        if (exists && !replace) {
            refreshReplaceRow();
            return setStatus(uploadStatus, 'error', 'slugTaken');
        }

        busy = true;
        submitButton.disabled = true;
        progress.hidden = false;
        progress.value = 0;
        setStatus(uploadStatus, '', 'publishing', { values: { percent: 0 } });

        try {
            const token = await idToken();
            const { status, body } = await upload(`/library/api/books/${encodeURIComponent(slug)}`, token, selectedFile, {
                title,
                description: form.elements.description.value.replace(/\s+/g, ' ').trim(),
                filename: selectedFile.name,
                replace
            });
            if (status !== 200 && status !== 201) {
                const copyKey = ERROR_COPY[body?.code] || 'uploadFailed';
                if (body?.code === 'library_slug_taken') replaceRow.hidden = false;
                throw new LibraryAdminError(copyKey, t(copyKey));
            }
            progress.value = 100;
            library.upsertBook(body.book);
            const href = library.bookUrl(body.book.slug);
            setStatus(uploadStatus, 'success', body.replaced ? 'replaced' : 'published', {
                link: { href, text: `elysiumdr.eu/library/${body.book.slug}` },
                after: 'propagation'
            });
            form.reset();
            selectedFile = null;
            fileName.textContent = '';
            slugEdited = false;
            titleAutofilled = '';
            descriptionAutofilled = '';
            replaceRow.hidden = true;
        } catch (error) {
            setStatus(uploadStatus, 'error', error instanceof LibraryAdminError ? error.copyKey : 'uploadFailed');
        } finally {
            busy = false;
            submitButton.disabled = false;
            progress.hidden = true;
        }
    });

    // Los mensajes que ya están en pantalla cambian de idioma con la página.
    library.onLanguageChange(() => {
        if (lastStatus && lastStatus.copyKey) setStatus(uploadStatus, lastStatus.tone, lastStatus.copyKey, lastStatus.extra);
    });

    showState(currentState);
    return api;
}
