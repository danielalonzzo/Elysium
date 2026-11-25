// Sección Reviews del CRM: las valoraciones que llegan desde /review.
//
// Solo lee y ordena. Publicar una valoración en la portada o en una página
// `review-*` es trabajo manual: aquí se lee, se marca como seleccionada o
// archivada y se copia el texto. Todo lo que viene del formulario es texto de
// terceros: se pinta siempre con `textContent`, nunca con `innerHTML`, y el
// logotipo solo se usa si es un data URL de imagen (lo exige también
// `firestore.rules`).
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const SUPER_ADMIN_EMAIL = 'daniel.morales@elysiumdr.eu';
const FORM_URL = 'https://elysiumdr.eu/review';

const COPY = {
    en: {
        description: 'Client reviews sent from the public form. Nothing is published automatically.',
        copyLink: 'Copy form link', copied: 'Link copied', refresh: 'Refresh',
        inbox: 'Inbox', selected: 'Selected', archived: 'Archived',
        empty: 'No reviews here yet.', denied: 'Only the administrator can read reviews.',
        loadError: 'Reviews could not be loaded.', saveError: 'The change could not be saved.',
        statusNew: 'New', statusRead: 'Read', statusSelected: 'Selected', statusArchived: 'Archived',
        startingPoint: 'The Starting Point', objective: 'Main objective', expectations: 'Expectations',
        impact: 'Impact and Results', internalImpact: 'Internally', experience: 'The Working Experience',
        recommendation: 'Recommendation', rating: 'Rating', website: 'Website', language: 'Form language',
        select: 'Mark as selected', unselect: 'Back to inbox', archive: 'Archive', restore: 'Restore',
        remove: 'Delete', confirmDelete: 'Delete this review permanently? It cannot be undone.',
        copyText: 'Copy text', textCopied: 'Text copied', note: 'Private note', saveNote: 'Save note', noteSaved: 'Note saved',
        consent: 'Publication authorised by the client', close: 'Close'
    },
    es: {
        description: 'Valoraciones de clientes enviadas desde el formulario público. Nada se publica solo.',
        copyLink: 'Copiar enlace del formulario', copied: 'Enlace copiado', refresh: 'Actualizar',
        inbox: 'Bandeja', selected: 'Seleccionadas', archived: 'Archivadas',
        empty: 'Todavía no hay valoraciones aquí.', denied: 'Solo el administrador puede leer las valoraciones.',
        loadError: 'No se han podido cargar las valoraciones.', saveError: 'No se ha podido guardar el cambio.',
        statusNew: 'Nueva', statusRead: 'Leída', statusSelected: 'Seleccionada', statusArchived: 'Archivada',
        startingPoint: 'El punto de partida', objective: 'Objetivo principal', expectations: 'Expectativas',
        impact: 'Impacto y resultados', internalImpact: 'De puertas adentro', experience: 'La experiencia de trabajo',
        recommendation: 'Recomendación', rating: 'Valoración', website: 'Sitio web', language: 'Idioma del formulario',
        select: 'Marcar como seleccionada', unselect: 'Volver a la bandeja', archive: 'Archivar', restore: 'Restaurar',
        remove: 'Eliminar', confirmDelete: '¿Eliminar esta valoración para siempre? No se puede deshacer.',
        copyText: 'Copiar texto', textCopied: 'Texto copiado', note: 'Nota privada', saveNote: 'Guardar nota', noteSaved: 'Nota guardada',
        consent: 'Publicación autorizada por el cliente', close: 'Cerrar'
    },
    pt: {
        description: 'Avaliações de clientes enviadas pelo formulário público. Nada é publicado automaticamente.',
        copyLink: 'Copiar link do formulário', copied: 'Link copiado', refresh: 'Atualizar',
        inbox: 'Caixa de entrada', selected: 'Selecionadas', archived: 'Arquivadas',
        empty: 'Ainda não há avaliações aqui.', denied: 'Só o administrador pode ler as avaliações.',
        loadError: 'Não foi possível carregar as avaliações.', saveError: 'Não foi possível guardar a alteração.',
        statusNew: 'Nova', statusRead: 'Lida', statusSelected: 'Selecionada', statusArchived: 'Arquivada',
        startingPoint: 'O ponto de partida', objective: 'Objetivo principal', expectations: 'Expectativas',
        impact: 'Impacto e resultados', internalImpact: 'Internamente', experience: 'A experiência de trabalho',
        recommendation: 'Recomendação', rating: 'Avaliação', website: 'Website', language: 'Idioma do formulário',
        select: 'Marcar como selecionada', unselect: 'Voltar à caixa de entrada', archive: 'Arquivar', restore: 'Restaurar',
        remove: 'Eliminar', confirmDelete: 'Eliminar esta avaliação para sempre? Não é possível anular.',
        copyText: 'Copiar texto', textCopied: 'Texto copiado', note: 'Nota privada', saveNote: 'Guardar nota', noteSaved: 'Nota guardada',
        consent: 'Publicação autorizada pelo cliente', close: 'Fechar'
    }
};

// Mismo orden que la historia de Paulo Morais (review-pmorais).
const SECTIONS = [
    ['startingPoint', 'objective'],
    ['expectations'],
    ['impact', 'internalImpact'],
    ['experience', 'recommendation']
];

const state = { reviews: [], filter: 'active', openId: null, loaded: false, allowed: false };

function lang() {
    const code = String(document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
    return COPY[code] ? code : 'en';
}
const t = () => COPY[lang()];
const $ = id => document.getElementById(id);

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

async function isAdmin(user) {
    if (!user) return false;
    try {
        const token = await user.getIdTokenResult();
        if (token?.claims?.admin === true) return true;
    } catch {
        return false;
    }
    return String(user.email || '').toLowerCase() === SUPER_ADMIN_EMAIL;
}

function millis(value) {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    return Number(new Date(value)) || 0;
}

function formatDate(value) {
    const ms = millis(value);
    if (!ms) return '';
    const locale = lang() === 'es' ? 'es-ES' : lang() === 'pt' ? 'pt-PT' : 'en-GB';
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(ms);
}

function statusLabel(status) {
    const c = t();
    return { new: c.statusNew, read: c.statusRead, selected: c.statusSelected, archived: c.statusArchived }[status] || c.statusNew;
}

function safeLogo(value) {
    return typeof value === 'string' && /^data:image\/(webp|png|jpeg);base64,/.test(value) ? value : '';
}

function safeWebsite(value) {
    try {
        const url = new URL(value);
        return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

function logoNode(review, size) {
    const box = el('div', 'reviews-logo');
    box.style.width = box.style.height = `${size}px`;
    const src = safeLogo(review.logo);
    if (src) {
        const img = el('img');
        img.src = src;
        img.alt = '';
        box.append(img);
    } else {
        box.textContent = (review.company || review.name || 'λ').trim().charAt(0).toUpperCase();
    }
    return box;
}

function stars(rating) {
    const n = Math.max(0, Math.min(5, Number(rating) || 0));
    const node = el('span', 'reviews-stars', '★'.repeat(n) + '☆'.repeat(5 - n));
    node.setAttribute('aria-label', `${n}/5`);
    return node;
}

function showAlert(message) {
    const alert = $('reviews-alert');
    if (!alert) return;
    alert.textContent = message || '';
    alert.hidden = !message;
}

function visibleReviews() {
    return state.reviews.filter(review => {
        const status = review.status || 'new';
        if (state.filter === 'selected') return status === 'selected';
        if (state.filter === 'archived') return status === 'archived';
        return status === 'new' || status === 'read';
    });
}

function updateBadge() {
    const badge = $('sidebar-reviews-count');
    if (!badge) return;
    const unread = state.reviews.filter(review => (review.status || 'new') === 'new').length;
    badge.textContent = String(unread);
    badge.hidden = unread === 0;
}

function renderList() {
    const list = $('reviews-list');
    if (!list) return;
    list.replaceChildren();
    if (!state.allowed) {
        list.append(el('p', 'reviews-empty', t().denied));
        return;
    }
    const items = visibleReviews();
    if (!items.length) {
        list.append(el('p', 'reviews-empty', t().empty));
        return;
    }
    for (const review of items) {
        const card = el('button', 'reviews-card');
        card.type = 'button';
        card.dataset.id = review.id;
        if (review.id === state.openId) card.classList.add('is-open');
        if ((review.status || 'new') === 'new') card.classList.add('is-new');
        const body = el('div', 'reviews-card-body');
        const head = el('div', 'reviews-card-head');
        head.append(el('strong', '', review.name || '—'), stars(review.rating));
        body.append(
            head,
            el('span', 'reviews-card-meta', [review.role, review.company].filter(Boolean).join(' · ')),
            el('span', 'reviews-card-quote', (review.startingPoint || '').slice(0, 140) + ((review.startingPoint || '').length > 140 ? '…' : '')),
            el('span', 'reviews-card-date', `${statusLabel(review.status)} · ${formatDate(review.submittedAt)}`)
        );
        card.append(logoNode(review, 44), body);
        card.addEventListener('click', () => openReview(review.id));
        list.append(card);
    }
}

function plainText(review) {
    const c = t();
    const lines = [
        `${review.name} — ${review.role}, ${review.company}`,
        review.website || '',
        `${c.rating}: ${review.rating}/5`,
        ''
    ];
    for (const group of SECTIONS) {
        for (const key of group) {
            if (!review[key]) continue;
            lines.push(c[key].toUpperCase(), review[key], '');
        }
    }
    return lines.filter((line, i, all) => !(line === '' && all[i - 1] === '')).join('\n').trim();
}

function actionButton(label, className, handler) {
    const button = el('button', `btn ${className}`, label);
    button.type = 'button';
    button.addEventListener('click', handler);
    return button;
}

async function saveStatus(review, status) {
    try {
        await updateDoc(doc(db, 'reviews', review.id), { status, updatedAt: serverTimestamp() });
        review.status = status;
        showAlert('');
    } catch (error) {
        console.error('[reviews]', error?.code || error);
        showAlert(t().saveError);
    }
    updateBadge();
    renderList();
    renderDetail();
}

function renderDetail() {
    const detail = $('reviews-detail');
    if (!detail) return;
    const review = state.reviews.find(item => item.id === state.openId);
    detail.replaceChildren();
    detail.hidden = !review;
    if (!review) return;
    const c = t();

    const close = actionButton('×', 'reviews-close', () => { state.openId = null; renderList(); renderDetail(); });
    close.setAttribute('aria-label', c.close);

    const profile = el('header', 'reviews-profile');
    const who = el('div', 'reviews-who');
    who.append(el('h2', '', review.name || '—'), el('div', 'reviews-role', review.role || ''), el('div', 'reviews-company', review.company || ''));
    const website = safeWebsite(review.website);
    if (website) {
        const link = el('a', 'reviews-website', website.replace(/^https?:\/\//, '').replace(/\/$/, ''));
        link.href = website;
        link.target = '_blank';
        link.rel = 'noopener noreferrer nofollow';
        who.append(link);
    }
    profile.append(logoNode(review, 88), who);

    const meta = el('div', 'reviews-meta');
    meta.append(
        stars(review.rating),
        el('span', `reviews-status is-${review.status || 'new'}`, statusLabel(review.status)),
        el('span', '', formatDate(review.submittedAt)),
        el('span', '', `${c.language}: ${String(review.lang || '').toUpperCase()}`)
    );

    const quote = el('blockquote', 'reviews-quote', `“${review.startingPoint || ''}”`);

    const story = el('div', 'reviews-story');
    for (const group of SECTIONS) {
        for (const key of group) {
            if (!review[key] || key === 'startingPoint') continue;
            const block = el('section', 'reviews-block');
            block.append(el('h3', '', c[key]), el('p', '', review[key]));
            story.append(block);
        }
    }

    const consent = el('p', 'reviews-consent', `✓ ${c.consent}`);

    const actions = el('div', 'reviews-actions');
    const status = review.status || 'new';
    if (status === 'selected') actions.append(actionButton(c.unselect, 'btn-outline', () => saveStatus(review, 'read')));
    else if (status !== 'archived') actions.append(actionButton(c.select, 'btn-primary', () => saveStatus(review, 'selected')));
    actions.append(status === 'archived'
        ? actionButton(c.restore, 'btn-outline', () => saveStatus(review, 'read'))
        : actionButton(c.archive, 'btn-outline', () => saveStatus(review, 'archived')));
    const copy = actionButton(c.copyText, 'btn-outline', async () => {
        try {
            await navigator.clipboard.writeText(plainText(review));
            copy.textContent = c.textCopied;
            setTimeout(() => { copy.textContent = c.copyText; }, 1600);
        } catch { /* sin permiso de portapapeles */ }
    });
    actions.append(copy, actionButton(c.remove, 'reviews-danger', async () => {
        if (!window.confirm(c.confirmDelete)) return;
        try {
            await deleteDoc(doc(db, 'reviews', review.id));
            state.reviews = state.reviews.filter(item => item.id !== review.id);
            state.openId = null;
            updateBadge();
            renderList();
            renderDetail();
        } catch (error) {
            console.error('[reviews]', error?.code || error);
            showAlert(c.saveError);
        }
    }));

    const noteBox = el('label', 'reviews-note');
    const noteArea = el('textarea');
    noteArea.rows = 3;
    noteArea.maxLength = 4000;
    noteArea.value = review.note || '';
    const noteSave = actionButton(c.saveNote, 'btn-outline', async () => {
        try {
            await updateDoc(doc(db, 'reviews', review.id), { note: noteArea.value, updatedAt: serverTimestamp() });
            review.note = noteArea.value;
            noteSave.textContent = c.noteSaved;
            setTimeout(() => { noteSave.textContent = c.saveNote; }, 1600);
        } catch (error) {
            console.error('[reviews]', error?.code || error);
            showAlert(c.saveError);
        }
    });
    noteBox.append(el('span', '', c.note), noteArea, noteSave);

    detail.append(close, profile, meta, quote, story, consent, actions, noteBox);
}

function openReview(id) {
    state.openId = id;
    const review = state.reviews.find(item => item.id === id);
    renderList();
    renderDetail();
    $('reviews-detail')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (review && (review.status || 'new') === 'new') saveStatus(review, 'read');
}

async function loadReviews() {
    if (!state.allowed) return renderList();
    const list = $('reviews-list');
    if (list && !state.loaded) list.innerHTML = '<div class="loader-container"><div class="premium-loader"></div></div>';
    try {
        const snapshot = await getDocs(query(collection(db, 'reviews'), orderBy('submittedAt', 'desc')));
        state.reviews = snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() }));
        state.loaded = true;
        showAlert('');
    } catch (error) {
        console.error('[reviews]', error?.code || error);
        showAlert(t().loadError);
    }
    updateBadge();
    renderList();
    renderDetail();
}

function applyCopy() {
    const c = t();
    const set = (id, text) => { const node = $(id); if (node) node.textContent = text; };
    set('reviews-description', c.description);
    set('reviews-copy-link', c.copyLink);
    set('reviews-refresh', c.refresh);
    document.querySelectorAll('#reviews-filters [data-filter]').forEach(button => {
        button.textContent = { active: c.inbox, selected: c.selected, archived: c.archived }[button.dataset.filter];
    });
    renderList();
    renderDetail();
}

function bind() {
    $('nav-reviews')?.addEventListener('click', () => loadReviews());
    $('reviews-refresh')?.addEventListener('click', () => loadReviews());
    $('reviews-copy-link')?.addEventListener('click', async event => {
        const button = event.currentTarget;
        try {
            await navigator.clipboard.writeText(FORM_URL);
            button.textContent = t().copied;
            setTimeout(() => { button.textContent = t().copyLink; }, 1600);
        } catch { /* sin permiso de portapapeles */ }
    });
    document.querySelectorAll('#reviews-filters [data-filter]').forEach(button => {
        button.addEventListener('click', () => {
            state.filter = button.dataset.filter;
            document.querySelectorAll('#reviews-filters [data-filter]').forEach(other => other.classList.toggle('is-active', other === button));
            renderList();
        });
    });
    document.addEventListener('elysium:language', () => queueMicrotask(applyCopy));
    onAuthStateChanged(auth, async user => {
        state.allowed = await isAdmin(user);
        state.loaded = false;
        if (state.allowed) loadReviews();
        else { state.reviews = []; updateBadge(); renderList(); }
    });
    applyCopy();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
else bind();
