import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
    collection,
    doc,
    getDocs,
    serverTimestamp,
    setDoc,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytesResumable
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

const NOTEBOOKS_COLLECTION = 'research_notebooks';
const SUPER_ADMIN_EMAIL = 'daniel.morales@elysiumdr.eu';
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const COVER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const AUTHOR_FALLBACK = 'Elysium λ Development & Research';
const RESEARCH_REFRESH_MS = 30000;

const DEFAULT_NOTEBOOKS = [
    {
        id: 'investigacion-inteligencia-artificial',
        slug: 'investigacion-inteligencia-artificial',
        title: 'Investigación en Inteligencia Artificial',
        description: 'Estudios, experimentos y notas sobre inteligencia artificial, aprendizaje automático y sus aplicaciones responsables.',
        order: 0
    },
    {
        id: 'linguistica-aplicada',
        slug: 'linguistica-aplicada',
        title: 'Lingüística Aplicada',
        description: 'Investigaciones sobre lenguaje, comunicación, tecnología y la aplicación práctica del conocimiento lingüístico.',
        order: 1
    },
    {
        id: 'novedades-informatica',
        slug: 'novedades-informatica',
        title: 'Novedades en la Informática',
        description: 'Análisis de avances, herramientas y tendencias emergentes en ingeniería de software e infraestructura digital.',
        order: 2
    }
];

const COPY = {
    en: {
        description: 'Manage public notebooks and their research publications.',
        library: 'Notebook library', newNotebook: '+ New notebook', allNotebooks: 'All notebooks',
        notebook: 'Notebook', publications: 'Publications', newPublication: '+ New publication',
        syncReady: 'Firestore synced', syncing: 'Syncing…', syncError: 'Sync error',
        notebookCount: count => `${count} notebook${count === 1 ? '' : 's'}`,
        articleCount: count => `${count} publication${count === 1 ? '' : 's'}`,
        noNotebooksTitle: 'No notebooks yet', noNotebooks: 'Create the first notebook to start the research library.',
        noArticlesTitle: 'No publications yet', noArticles: 'Create a draft or publish the first article in this notebook.',
        open: 'Open notebook', edit: 'Edit', published: 'Published', draft: 'Draft', archived: 'Archived',
        title: 'Title', descriptionLabel: 'Description', slug: 'Public slug', language: 'Language',
        coverUrl: 'Cover URL (optional)', coverFile: 'Or upload a cover', chooseImage: 'Choose image',
        coverHelp: 'JPG, PNG or WebP · max. 5 MB', cancel: 'Cancel', createNotebook: 'Create notebook',
        creating: 'Creating…', newNotebookTitle: 'New notebook',
        articleTitle: 'Title', author: 'Author', excerpt: 'Excerpt', articleCover: 'Card cover URL (optional)',
        newArticleTitle: 'New publication', editArticleTitle: 'Edit publication', saveDraft: 'Save draft',
        publish: 'Publish', updatePublication: 'Update publication', saving: 'Saving…',
        copyHtml: 'Copy HTML', copyMarkdown: 'Copy Markdown', copiedHtml: 'HTML copied.', copiedMarkdown: 'Markdown copied.',
        words: count => `${count} word${count === 1 ? '' : 's'}`,
        seedFailed: 'The initial notebooks could not be created.', loadFailed: 'The research library could not be loaded.',
        slugDuplicate: 'That public slug is already used in this language.',
        coverType: 'Choose a JPG, PNG or WebP image.', coverSize: 'The cover must be 5 MB or smaller.',
        invalidCoverUrl: 'Use a secure HTTPS cover URL.', contentRequired: 'Add article content before publishing.',
        contentTooLarge: 'The HTML and Markdown exports are too large for one publication.',
        notebookCreated: 'Notebook created as a draft.', articleSaved: 'Draft saved.', articlePublished: 'Publication is live and synced.',
        dialogEyebrow: 'Research library', toolbarAria: 'Text formatting', textStyle: 'Text style',
        blockParagraph: 'Paragraph', blockH2: 'Heading 2', blockH3: 'Heading 3', blockH4: 'Heading 4',
        bold: 'Bold', italic: 'Italic',
        bulletList: 'Bulleted list', bulletListShort: '• List',
        numberedList: 'Numbered list', numberedListShort: '1. List',
        quote: 'Quote', quoteShort: '“ Quote',
        codeBlock: 'Code block', codeBlockShort: '</> Code', inlineCode: 'Inline code',
        undo: 'Undo', redo: 'Redo',
        editorAria: 'Publication content', editorPlaceholder: 'Start writing your research…',
        notebookTitlePlaceholder: 'Artificial intelligence research',
        notebookDescriptionPlaceholder: 'Scope and purpose of this notebook',
        articleTitlePlaceholder: 'Publication title', articleSlugPlaceholder: 'publication-title',
        articleExcerptPlaceholder: 'A concise summary for the public card',
        permission: 'Firestore denied this action. Sign in again with an administrator account.'
    },
    es: {
        description: 'Gestiona los cuadernos públicos y sus publicaciones de investigación.',
        library: 'Biblioteca de cuadernos', newNotebook: '+ Nuevo Cuaderno', allNotebooks: 'Todos los cuadernos',
        notebook: 'Cuaderno', publications: 'Publicaciones', newPublication: '+ Nueva Publicación',
        syncReady: 'Sincronizado con Firestore', syncing: 'Sincronizando…', syncError: 'Error de sincronización',
        notebookCount: count => `${count} cuaderno${count === 1 ? '' : 's'}`,
        articleCount: count => `${count} publicación${count === 1 ? '' : 'es'}`,
        noNotebooksTitle: 'Aún no hay cuadernos', noNotebooks: 'Crea el primer cuaderno para iniciar la biblioteca de investigación.',
        noArticlesTitle: 'Aún no hay publicaciones', noArticles: 'Crea un borrador o publica el primer artículo de este cuaderno.',
        open: 'Abrir cuaderno', edit: 'Editar', published: 'Publicado', draft: 'Borrador', archived: 'Archivado',
        title: 'Título', descriptionLabel: 'Descripción', slug: 'Slug público', language: 'Idioma',
        coverUrl: 'URL de portada (opcional)', coverFile: 'O sube una portada', chooseImage: 'Elegir imagen',
        coverHelp: 'JPG, PNG o WebP · máx. 5 MB', cancel: 'Cancelar', createNotebook: 'Crear cuaderno',
        creating: 'Creando…', newNotebookTitle: 'Nuevo Cuaderno',
        articleTitle: 'Título', author: 'Autor', excerpt: 'Resumen', articleCover: 'URL de portada de tarjeta (opcional)',
        newArticleTitle: 'Nueva Publicación', editArticleTitle: 'Editar publicación', saveDraft: 'Guardar borrador',
        publish: 'Publicar', updatePublication: 'Actualizar publicación', saving: 'Guardando…',
        copyHtml: 'Copiar HTML', copyMarkdown: 'Copiar Markdown', copiedHtml: 'HTML copiado.', copiedMarkdown: 'Markdown copiado.',
        words: count => `${count} palabra${count === 1 ? '' : 's'}`,
        seedFailed: 'No se pudieron crear los cuadernos iniciales.', loadFailed: 'No se pudo cargar la biblioteca de investigación.',
        slugDuplicate: 'Ese slug público ya existe en este idioma.',
        coverType: 'Elige una imagen JPG, PNG o WebP.', coverSize: 'La portada debe pesar 5 MB o menos.',
        invalidCoverUrl: 'Usa una URL de portada HTTPS segura.', contentRequired: 'Añade contenido antes de publicar.',
        contentTooLarge: 'Las exportaciones HTML y Markdown son demasiado grandes para una publicación.',
        notebookCreated: 'Cuaderno creado como borrador.', articleSaved: 'Borrador guardado.', articlePublished: 'Publicación visible y sincronizada.',
        dialogEyebrow: 'Biblioteca de investigación', toolbarAria: 'Formato de texto', textStyle: 'Estilo de texto',
        blockParagraph: 'Párrafo', blockH2: 'Título 2', blockH3: 'Título 3', blockH4: 'Título 4',
        bold: 'Negrita', italic: 'Cursiva',
        bulletList: 'Lista con viñetas', bulletListShort: '• Lista',
        numberedList: 'Lista numerada', numberedListShort: '1. Lista',
        quote: 'Cita', quoteShort: '“ Cita',
        codeBlock: 'Bloque de código', codeBlockShort: '</> Código', inlineCode: 'Código en línea',
        undo: 'Deshacer', redo: 'Rehacer',
        editorAria: 'Contenido de la publicación', editorPlaceholder: 'Empieza a escribir tu investigación…',
        notebookTitlePlaceholder: 'Investigación en Inteligencia Artificial',
        notebookDescriptionPlaceholder: 'Alcance y propósito de este cuaderno',
        articleTitlePlaceholder: 'Título de la publicación', articleSlugPlaceholder: 'titulo-de-la-publicacion',
        articleExcerptPlaceholder: 'Un resumen breve para la tarjeta pública',
        permission: 'Firestore rechazó la acción. Inicia sesión de nuevo con una cuenta administradora.'
    },
    pt: {
        description: 'Gira os cadernos públicos e as respetivas publicações de investigação.',
        library: 'Biblioteca de cadernos', newNotebook: '+ Novo Caderno', allNotebooks: 'Todos os cadernos',
        notebook: 'Caderno', publications: 'Publicações', newPublication: '+ Nova Publicação',
        syncReady: 'Sincronizado com Firestore', syncing: 'A sincronizar…', syncError: 'Erro de sincronização',
        notebookCount: count => `${count} caderno${count === 1 ? '' : 's'}`,
        articleCount: count => `${count} publicação${count === 1 ? '' : 'ões'}`,
        noNotebooksTitle: 'Ainda não existem cadernos', noNotebooks: 'Crie o primeiro caderno para iniciar a biblioteca de investigação.',
        noArticlesTitle: 'Ainda não existem publicações', noArticles: 'Crie um rascunho ou publique o primeiro artigo deste caderno.',
        open: 'Abrir caderno', edit: 'Editar', published: 'Publicado', draft: 'Rascunho', archived: 'Arquivado',
        title: 'Título', descriptionLabel: 'Descrição', slug: 'Slug público', language: 'Idioma',
        coverUrl: 'URL da capa (opcional)', coverFile: 'Ou carregue uma capa', chooseImage: 'Escolher imagem',
        coverHelp: 'JPG, PNG ou WebP · máx. 5 MB', cancel: 'Cancelar', createNotebook: 'Criar caderno',
        creating: 'A criar…', newNotebookTitle: 'Novo Caderno',
        articleTitle: 'Título', author: 'Autor', excerpt: 'Resumo', articleCover: 'URL da capa do cartão (opcional)',
        newArticleTitle: 'Nova Publicação', editArticleTitle: 'Editar publicação', saveDraft: 'Guardar rascunho',
        publish: 'Publicar', updatePublication: 'Atualizar publicação', saving: 'A guardar…',
        copyHtml: 'Copiar HTML', copyMarkdown: 'Copiar Markdown', copiedHtml: 'HTML copiado.', copiedMarkdown: 'Markdown copiado.',
        words: count => `${count} palavra${count === 1 ? '' : 's'}`,
        seedFailed: 'Não foi possível criar os cadernos iniciais.', loadFailed: 'Não foi possível carregar a biblioteca de investigação.',
        slugDuplicate: 'Esse slug público já existe neste idioma.',
        coverType: 'Escolha uma imagem JPG, PNG ou WebP.', coverSize: 'A capa deve ter no máximo 5 MB.',
        invalidCoverUrl: 'Use uma URL de capa HTTPS segura.', contentRequired: 'Adicione conteúdo antes de publicar.',
        contentTooLarge: 'As exportações HTML e Markdown são demasiado grandes para uma publicação.',
        notebookCreated: 'Caderno criado como rascunho.', articleSaved: 'Rascunho guardado.', articlePublished: 'Publicação visível e sincronizada.',
        dialogEyebrow: 'Biblioteca de investigação', toolbarAria: 'Formatação de texto', textStyle: 'Estilo de texto',
        blockParagraph: 'Parágrafo', blockH2: 'Título 2', blockH3: 'Título 3', blockH4: 'Título 4',
        bold: 'Negrito', italic: 'Itálico',
        bulletList: 'Lista com marcadores', bulletListShort: '• Lista',
        numberedList: 'Lista numerada', numberedListShort: '1. Lista',
        quote: 'Citação', quoteShort: '“ Citação',
        codeBlock: 'Bloco de código', codeBlockShort: '</> Código', inlineCode: 'Código em linha',
        undo: 'Anular', redo: 'Refazer',
        editorAria: 'Conteúdo da publicação', editorPlaceholder: 'Comece a escrever a sua investigação…',
        notebookTitlePlaceholder: 'Investigação em Inteligência Artificial',
        notebookDescriptionPlaceholder: 'Âmbito e objetivo deste caderno',
        articleTitlePlaceholder: 'Título da publicação', articleSlugPlaceholder: 'titulo-da-publicacao',
        articleExcerptPlaceholder: 'Um resumo breve para o cartão público',
        permission: 'O Firestore recusou a ação. Inicie sessão novamente com uma conta administradora.'
    }
};

let _authorized = false;
let _actor = null;
let _notebooks = [];
let _articleCache = new Map();
let _activeNotebook = null;
let _editingArticle = null;
let _lastLoadedAt = 0;
let _loadPromise = null;
let _notebookSlugEdited = false;
let _articleSlugEdited = false;
let _coverPreviewUrl = '';

function lang() {
    const code = String(document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
    return COPY[code] ? code : 'en';
}

function copy() {
    return COPY[lang()];
}

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
}

function slugify(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120)
        .replace(/-+$/g, '');
}

function assetUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
    try {
        const parsed = new URL(raw);
        return parsed.protocol === 'https:' ? parsed.href : '';
    } catch {
        return '';
    }
}

function timestampDate(value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    if (Number.isFinite(value.seconds)) return new Date(value.seconds * 1000);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formattedDate(value) {
    const date = timestampDate(value);
    if (!date) return '';
    const locale = lang() === 'es' ? 'es-ES' : lang() === 'pt' ? 'pt-PT' : 'en-GB';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusLabel(status) {
    return copy()[status] || status;
}

function setSyncState(state, message = '') {
    const element = document.getElementById('research-sync-status');
    if (!element) return;
    element.classList.toggle('is-syncing', state === 'syncing');
    element.classList.toggle('is-error', state === 'error');
    element.textContent = message || (state === 'syncing' ? copy().syncing : state === 'error' ? copy().syncError : copy().syncReady);
}

function setAlert(message = '') {
    const element = document.getElementById('research-alert');
    if (!element) return;
    element.textContent = message;
    element.hidden = !message;
}

function setMessage(id, message = '', kind = '') {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = message;
    element.className = `meeting-form-message${kind ? ` ${kind}` : ''}`;
}

function friendlyError(error, fallback) {
    if (['permission-denied', 'storage/unauthorized', 'storage/unauthenticated'].includes(error?.code)) return copy().permission;
    return `${fallback} ${error?.message || ''}`.trim();
}

async function canManageResearch(user) {
    if (!user) return false;
    try {
        const token = await user.getIdTokenResult();
        if (token?.claims?.admin === true) return true;
    } catch {
        return false;
    }
    return String(user.email || '').toLowerCase() === SUPER_ADMIN_EMAIL;
}

function sortRecords(records) {
    return records.sort((left, right) => {
        const leftOrder = Number.isInteger(left.order) ? left.order : Number.MAX_SAFE_INTEGER;
        const rightOrder = Number.isInteger(right.order) ? right.order : Number.MAX_SAFE_INTEGER;
        return leftOrder - rightOrder || String(left.title || '').localeCompare(String(right.title || ''), 'es');
    });
}

function notebookCover(notebook, className = 'research-notebook-cover') {
    const url = assetUrl(notebook.coverUrl);
    const letter = String(notebook.title || 'N').trim().charAt(0).toUpperCase() || 'N';
    return `<div class="${className}">${url
        ? `<img src="${esc(url)}" alt="${esc(notebook.coverAlt || notebook.title || '')}" loading="lazy">`
        : `<span class="research-cover-monogram" aria-hidden="true">${esc(letter)}</span>`}</div>`;
}

function renderNotebooks() {
    const grid = document.getElementById('research-notebook-grid');
    const count = document.getElementById('research-notebook-count');
    if (!grid || !count) return;
    count.textContent = copy().notebookCount(_notebooks.length);
    if (!_notebooks.length) {
        grid.innerHTML = `<div class="research-empty-state"><strong>${esc(copy().noNotebooksTitle)}</strong><span>${esc(copy().noNotebooks)}</span></div>`;
        return;
    }
    grid.innerHTML = _notebooks.map(notebook => {
        const articles = _articleCache.get(notebook.id) || [];
        return `<article class="research-notebook-card">
            <button type="button" class="research-notebook-open" data-research-notebook="${esc(notebook.id)}" aria-label="${esc(`${copy().open}: ${notebook.title}`)}">
                ${notebookCover(notebook)}
                <span class="research-notebook-body">
                    <span class="research-notebook-topline"><span class="research-locale">${esc(notebook.locale || 'es')}</span><span class="research-status is-${esc(notebook.status || 'draft')}">${esc(statusLabel(notebook.status || 'draft'))}</span></span>
                    <h3>${esc(notebook.title)}</h3>
                    <p>${esc(notebook.description)}</p>
                    <span class="research-notebook-footer"><span>${esc(copy().articleCount(articles.length))}</span><strong>${esc(copy().open)} →</strong></span>
                </span>
            </button>
        </article>`;
    }).join('');
}

function renderDetailCover(notebook) {
    const container = document.getElementById('research-detail-cover');
    if (!container) return;
    container.replaceChildren();
    const url = assetUrl(notebook.coverUrl);
    if (url) {
        const image = document.createElement('img');
        image.src = url;
        image.alt = notebook.coverAlt || notebook.title || '';
        container.appendChild(image);
        return;
    }
    const monogram = document.createElement('span');
    monogram.className = 'research-cover-monogram';
    monogram.setAttribute('aria-hidden', 'true');
    monogram.textContent = String(notebook.title || 'N').trim().charAt(0).toUpperCase() || 'N';
    container.appendChild(monogram);
}

function renderArticles() {
    if (!_activeNotebook) return;
    const articles = _articleCache.get(_activeNotebook.id) || [];
    const count = document.getElementById('research-article-count');
    const list = document.getElementById('research-article-list');
    if (count) count.textContent = copy().articleCount(articles.length);
    if (!list) return;
    if (!articles.length) {
        list.innerHTML = `<div class="research-empty-state"><strong>${esc(copy().noArticlesTitle)}</strong><span>${esc(copy().noArticles)}</span></div>`;
        return;
    }
    list.innerHTML = articles.map(article => {
        const date = formattedDate(article.updatedAt || article.publishedAt || article.createdAt);
        return `<article class="research-article-row">
            <div>
                <div class="research-article-topline"><span class="research-status is-${esc(article.status || 'draft')}">${esc(statusLabel(article.status || 'draft'))}</span><span class="research-locale">${esc(article.locale || _activeNotebook.locale || 'es')}</span></div>
                <h3>${esc(article.title)}</h3>
                <p>${esc(article.excerpt || '')}${date ? ` · ${esc(date)}` : ''}</p>
            </div>
            <div class="research-article-actions"><button type="button" class="btn btn-secondary" data-research-article="${esc(article.id)}">${esc(copy().edit)}</button></div>
        </article>`;
    }).join('');
}

function openNotebook(notebookId) {
    const notebook = _notebooks.find(item => item.id === notebookId);
    if (!notebook) return;
    _activeNotebook = notebook;
    document.getElementById('research-notebooks-view').hidden = true;
    document.getElementById('research-notebook-detail').hidden = false;
    document.getElementById('research-detail-title').textContent = notebook.title || '';
    document.getElementById('research-detail-description').textContent = notebook.description || '';
    document.getElementById('research-detail-eyebrow').textContent = `${copy().notebook} · ${(notebook.locale || 'es').toUpperCase()}`;
    const meta = document.getElementById('research-detail-meta');
    const updated = formattedDate(notebook.updatedAt || notebook.createdAt);
    if (meta) meta.innerHTML = `<span class="research-status is-${esc(notebook.status || 'draft')}">${esc(statusLabel(notebook.status || 'draft'))}</span>${updated ? `<span>${esc(updated)}</span>` : ''}<span>/${esc(notebook.slug || notebook.id)}</span>`;
    renderDetailCover(notebook);
    renderArticles();
}

function closeNotebook() {
    _activeNotebook = null;
    document.getElementById('research-notebook-detail').hidden = true;
    document.getElementById('research-notebooks-view').hidden = false;
}

async function seedDefaultNotebooks(existing) {
    const actorUid = _actor?.uid;
    if (!actorUid) return false;
    const ids = new Set(existing.map(item => item.id));
    const slugLocales = new Set(existing.map(item => `${item.locale || 'es'}:${item.slug || ''}`));
    const missing = DEFAULT_NOTEBOOKS.filter(item => !ids.has(item.id) && !slugLocales.has(`es:${item.slug}`));
    if (!missing.length) return false;

    const batch = writeBatch(db);
    for (const item of missing) {
        const notebookRef = doc(db, NOTEBOOKS_COLLECTION, item.id);
        batch.set(notebookRef, {
            schemaVersion: 1,
            slug: item.slug,
            title: item.title,
            description: item.description,
            coverUrl: '',
            coverPath: '',
            coverAlt: '',
            status: 'published',
            visibility: 'public',
            locale: 'es',
            order: item.order,
            publishedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            createdBy: actorUid,
            updatedAt: serverTimestamp(),
            updatedBy: actorUid
        });
    }
    await batch.commit();
    return true;
}

async function loadResearch({ force = false, preserveNotebookId = '' } = {}) {
    if (!_authorized) return;
    if (!force && _lastLoadedAt && Date.now() - _lastLoadedAt < RESEARCH_REFRESH_MS && _notebooks.length) {
        renderNotebooks();
        if (preserveNotebookId) openNotebook(preserveNotebookId);
        return;
    }
    if (_loadPromise) return _loadPromise;

    _loadPromise = (async () => {
        setAlert('');
        setSyncState('syncing');
        try {
            let snapshot = await getDocs(collection(db, NOTEBOOKS_COLLECTION));
            let records = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
            if (await seedDefaultNotebooks(records)) {
                snapshot = await getDocs(collection(db, NOTEBOOKS_COLLECTION));
                records = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
            }
            _notebooks = sortRecords(records);
            const articleEntries = await Promise.all(_notebooks.map(async notebook => {
                const articleSnapshot = await getDocs(collection(db, NOTEBOOKS_COLLECTION, notebook.id, 'articles'));
                const articles = sortRecords(articleSnapshot.docs.map(item => ({ id: item.id, ...item.data() })));
                return [notebook.id, articles];
            }));
            _articleCache = new Map(articleEntries);
            _lastLoadedAt = Date.now();
            renderNotebooks();
            if (preserveNotebookId) openNotebook(preserveNotebookId);
            else if (_activeNotebook) openNotebook(_activeNotebook.id);
            setSyncState('ready');
        } catch (error) {
            console.error('[Elysium Research] load failed:', error);
            setAlert(friendlyError(error, copy().loadFailed));
            setSyncState('error');
            const grid = document.getElementById('research-notebook-grid');
            if (grid && !_notebooks.length) grid.innerHTML = `<div class="research-empty-state"><strong>${esc(copy().loadFailed)}</strong></div>`;
        } finally {
            _loadPromise = null;
        }
    })();
    return _loadPromise;
}

/**
 * Barra de herramientas del editor. Sus botones son símbolos —«B», «↶», «</>»—,
 * así que lo único que dice qué hacen es el `title` y el nombre accesible: en
 * inglés, un lector de pantalla en español leía «Bold» sobre una «B».
 */
function applyEditorCopy(text) {
    const toolbar = document.getElementById('research-editor-toolbar');
    if (toolbar) toolbar.setAttribute('aria-label', text.toolbarAria);

    const block = document.getElementById('research-editor-block');
    if (block) {
        block.title = text.textStyle;
        block.setAttribute('aria-label', text.textStyle);
        const blockNames = { p: text.blockParagraph, h2: text.blockH2, h3: text.blockH3, h4: text.blockH4 };
        for (const option of block.options) {
            if (blockNames[option.value]) option.textContent = blockNames[option.value];
        }
    }

    // [selector, ayuda emergente, texto del botón (si lo lleva)]
    const buttons = [
        ['[data-editor-command="bold"]', text.bold, null],
        ['[data-editor-command="italic"]', text.italic, null],
        ['[data-editor-command="insertUnorderedList"]', text.bulletList, text.bulletListShort],
        ['[data-editor-command="insertOrderedList"]', text.numberedList, text.numberedListShort],
        ['[data-editor-block-command="blockquote"]', text.quote, text.quoteShort],
        ['[data-editor-block-command="pre"]', text.codeBlock, text.codeBlockShort],
        ['#research-editor-inline-code', text.inlineCode, null],
        ['[data-editor-command="undo"]', text.undo, null],
        ['[data-editor-command="redo"]', text.redo, null]
    ];
    for (const [selector, tooltip, label] of buttons) {
        const button = document.querySelector(`#research-editor-toolbar ${selector}`);
        if (!button) continue;
        button.title = tooltip;
        button.setAttribute('aria-label', tooltip);
        if (label) button.textContent = label;
    }

    const editor = document.getElementById('research-article-editor');
    if (editor) {
        editor.setAttribute('aria-label', text.editorAria);
        editor.dataset.placeholder = text.editorPlaceholder;
    }
}

function applyCopy() {
    const text = copy();
    const values = {
        'research-description': text.description,
        'research-library-title': text.library,
        'research-new-notebook': text.newNotebook,
        'research-back-label': text.allNotebooks,
        'research-detail-eyebrow': text.notebook,
        'research-publications-title': text.publications,
        'research-new-article': text.newPublication,
        'research-notebook-dialog-title': text.newNotebookTitle,
        'research-notebook-title-label': text.title,
        'research-notebook-description-label': text.descriptionLabel,
        'research-notebook-slug-label': text.slug,
        'research-notebook-locale-label': text.language,
        'research-notebook-cover-url-label': text.coverUrl,
        'research-notebook-cover-file-label': text.coverFile,
        'research-cover-picker-title': text.chooseImage,
        'research-cover-picker-copy': text.coverHelp,
        'research-notebook-cancel': text.cancel,
        'research-notebook-save': text.createNotebook,
        'research-article-title-label': text.articleTitle,
        'research-article-slug-label': text.slug,
        'research-article-cover-label': text.articleCover,
        'research-article-author-label': text.author,
        'research-article-excerpt-label': text.excerpt,
        'research-article-cancel': text.cancel,
        'research-article-draft': text.saveDraft,
        'research-article-publish': text.publish,
        'research-copy-html': text.copyHtml,
        'research-copy-markdown': text.copyMarkdown,
        'research-notebook-dialog-eyebrow': text.dialogEyebrow,
        'research-editor-block-label': text.textStyle
    };
    for (const [id, value] of Object.entries(values)) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    // Los ejemplos de los campos. Van aparte porque son `placeholder`, no
    // texto: se quedaban en inglés aunque su etiqueta ya cambiara de idioma.
    const placeholders = {
        'research-notebook-title': text.notebookTitlePlaceholder,
        'research-notebook-description-input': text.notebookDescriptionPlaceholder,
        'research-article-title': text.articleTitlePlaceholder,
        'research-article-slug': text.articleSlugPlaceholder,
        'research-article-excerpt': text.articleExcerptPlaceholder
    };
    for (const [id, value] of Object.entries(placeholders)) {
        const element = document.getElementById(id);
        if (element) element.placeholder = value;
    }

    applyEditorCopy(text);
    setSyncState('ready');
    renderNotebooks();
    if (_activeNotebook) openNotebook(_activeNotebook.id);
    updateWordCount();
}

function resetCoverPreview() {
    if (_coverPreviewUrl) URL.revokeObjectURL(_coverPreviewUrl);
    _coverPreviewUrl = '';
    const preview = document.getElementById('research-cover-preview');
    if (preview) {
        preview.style.backgroundImage = '';
        preview.textContent = '↑';
    }
    const title = document.getElementById('research-cover-picker-title');
    if (title) title.textContent = copy().chooseImage;
}

function previewCover(file) {
    resetCoverPreview();
    if (!file) return;
    _coverPreviewUrl = URL.createObjectURL(file);
    const preview = document.getElementById('research-cover-preview');
    if (preview) {
        preview.style.backgroundImage = `url("${_coverPreviewUrl.replaceAll('"', '%22')}")`;
        preview.textContent = '';
    }
    const title = document.getElementById('research-cover-picker-title');
    if (title) title.textContent = file.name;
}

function openNotebookDialog() {
    const form = document.getElementById('research-notebook-form');
    form.reset();
    resetCoverPreview();
    _notebookSlugEdited = false;
    document.getElementById('research-notebook-locale').value = ['en', 'es', 'pt'].includes(lang()) ? lang() : 'es';
    setMessage('research-notebook-message');
    document.getElementById('research-notebook-dialog').showModal();
    requestAnimationFrame(() => document.getElementById('research-notebook-title').focus());
}

function validateCover(file) {
    if (!file) return '';
    if (!COVER_TYPES.has(file.type)) return copy().coverType;
    if (!file.size || file.size > MAX_COVER_BYTES) return copy().coverSize;
    return '';
}

function uploadNotebookCover(notebookId, file) {
    const safeOriginal = file.name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-190) || 'cover';
    const fileName = `${Date.now()}_${safeOriginal}`;
    const path = `research/notebooks/${notebookId}/cover/${fileName}`;
    const storageRef = ref(storage, path);
    const progress = document.getElementById('research-cover-upload-progress');
    const bar = document.getElementById('research-cover-upload-bar');
    const label = document.getElementById('research-cover-upload-label');
    if (progress) progress.hidden = false;

    return new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file, { contentType: file.type });
        task.on('state_changed', snapshot => {
            const percentage = snapshot.totalBytes ? Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100) : 0;
            if (bar) bar.style.width = `${percentage}%`;
            if (label) label.textContent = `${copy().syncing} ${percentage}%`;
        }, error => {
            if (progress) progress.hidden = true;
            reject(error);
        }, async () => {
            try {
                const url = await getDownloadURL(task.snapshot.ref);
                if (progress) progress.hidden = true;
                resolve({ coverUrl: url, coverPath: path });
            } catch (error) {
                if (progress) progress.hidden = true;
                reject(error);
            }
        });
    });
}

async function createNotebook(event) {
    event.preventDefault();
    if (!_authorized || !_actor) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const title = document.getElementById('research-notebook-title').value.trim();
    const description = document.getElementById('research-notebook-description-input').value.trim();
    const locale = document.getElementById('research-notebook-locale').value;
    const slug = slugify(document.getElementById('research-notebook-slug').value || title);
    const rawCoverUrl = document.getElementById('research-notebook-cover-url').value.trim();
    const externalCoverUrl = assetUrl(rawCoverUrl);
    const file = document.getElementById('research-notebook-cover-file').files?.[0] || null;

    if (_notebooks.some(item => item.locale === locale && item.slug === slug)) {
        setMessage('research-notebook-message', copy().slugDuplicate, 'is-error');
        return;
    }
    if (rawCoverUrl && !externalCoverUrl) {
        setMessage('research-notebook-message', copy().invalidCoverUrl, 'is-error');
        return;
    }
    const coverError = validateCover(file);
    if (coverError) {
        setMessage('research-notebook-message', coverError, 'is-error');
        return;
    }

    const button = document.getElementById('research-notebook-save');
    button.disabled = true;
    button.textContent = copy().creating;
    setMessage('research-notebook-message');
    setSyncState('syncing');
    const notebookRef = doc(collection(db, NOTEBOOKS_COLLECTION));
    let uploadedPath = '';
    try {
        let cover = { coverUrl: externalCoverUrl, coverPath: '' };
        if (file) {
            cover = await uploadNotebookCover(notebookRef.id, file);
            uploadedPath = cover.coverPath;
        }
        const maxOrder = _notebooks.reduce((highest, item) => Number.isInteger(item.order) ? Math.max(highest, item.order) : highest, -1);
        await setDoc(notebookRef, {
            schemaVersion: 1,
            slug,
            title,
            description,
            coverUrl: cover.coverUrl || '',
            coverPath: cover.coverPath || '',
            coverAlt: title,
            status: 'draft',
            visibility: 'unlisted',
            locale,
            order: maxOrder + 1,
            publishedAt: null,
            createdAt: serverTimestamp(),
            createdBy: _actor.uid,
            updatedAt: serverTimestamp(),
            updatedBy: _actor.uid
        });
        document.getElementById('research-notebook-dialog').close();
        setAlert('');
        _lastLoadedAt = 0;
        await loadResearch({ force: true });
        setSyncState('ready', copy().notebookCreated);
    } catch (error) {
        console.error('[Elysium Research] notebook create failed:', error);
        if (uploadedPath) deleteObject(ref(storage, uploadedPath)).catch(() => {});
        setMessage('research-notebook-message', friendlyError(error, copy().loadFailed), 'is-error');
        setSyncState('error');
    } finally {
        button.disabled = false;
        button.textContent = copy().createNotebook;
    }
}

const ALLOWED_EDITOR_TAGS = new Set(['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'a', 'br', 'hr']);
const BLOCK_EDITOR_TAGS = new Set(['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'blockquote', 'pre', 'hr']);

function replaceElementTag(element, tagName) {
    const replacement = element.ownerDocument.createElement(tagName);
    while (element.firstChild) replacement.appendChild(element.firstChild);
    element.replaceWith(replacement);
    return replacement;
}

function sanitizeEditorHtml(rawHtml) {
    const parsed = new DOMParser().parseFromString(String(rawHtml || ''), 'text/html');

    function clean(node) {
        if (node.nodeType === Node.COMMENT_NODE) {
            node.remove();
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        [...node.childNodes].forEach(clean);
        let element = node;
        let tag = element.tagName.toLowerCase();
        if (tag === 'b') tag = 'strong';
        if (tag === 'i') tag = 'em';
        if (tag === 'h1') tag = 'h2';
        if (tag === 'div') {
            const hasBlockChild = [...element.children].some(child => BLOCK_EDITOR_TAGS.has(child.tagName.toLowerCase()));
            if (hasBlockChild) {
                element.replaceWith(...element.childNodes);
                return;
            }
            tag = 'p';
        }
        if (tag !== element.tagName.toLowerCase()) element = replaceElementTag(element, tag);
        if (!ALLOWED_EDITOR_TAGS.has(tag)) {
            element.replaceWith(...element.childNodes);
            return;
        }
        const href = tag === 'a' ? assetUrl(element.getAttribute('href')) : '';
        [...element.attributes].forEach(attribute => element.removeAttribute(attribute.name));
        if (tag === 'a' && href) {
            element.setAttribute('href', href);
            element.setAttribute('rel', 'noopener noreferrer');
        } else if (tag === 'a') {
            element.replaceWith(...element.childNodes);
        }
    }

    [...parsed.body.childNodes].forEach(clean);
    const output = parsed.createElement('div');
    let paragraph = null;
    const flush = () => { paragraph = null; };
    [...parsed.body.childNodes].forEach(node => {
        const tag = node.nodeType === Node.ELEMENT_NODE ? node.tagName.toLowerCase() : '';
        const isBlock = BLOCK_EDITOR_TAGS.has(tag);
        if (isBlock) {
            flush();
            output.appendChild(node);
            return;
        }
        if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
        if (!paragraph) {
            paragraph = parsed.createElement('p');
            output.appendChild(paragraph);
        }
        paragraph.appendChild(node);
    });
    return output.innerHTML.trim();
}

function markdownText(value) {
    return String(value || '').replace(/([\\*_[\]])/g, '\\$1');
}

function inlineCode(value) {
    const text = String(value || '');
    const runs = text.match(/`+/g) || [];
    const fence = '`'.repeat(Math.max(1, ...runs.map(run => run.length + 1)));
    const padding = /^`|`$|^\s|\s$/.test(text) ? ' ' : '';
    return `${fence}${padding}${text}${padding}${fence}`;
}

function markdownList(element, depth = 0) {
    const ordered = element.tagName.toLowerCase() === 'ol';
    const items = [...element.children].filter(child => child.tagName.toLowerCase() === 'li');
    return items.map((item, index) => {
        const nested = [...item.children].filter(child => ['ul', 'ol'].includes(child.tagName.toLowerCase()));
        const main = [...item.childNodes].filter(child => !nested.includes(child)).map(child => markdownNode(child, depth + 1)).join('').trim().replace(/\n{2,}/g, '\n');
        const prefix = ordered ? `${index + 1}. ` : '- ';
        const continuation = main.replace(/\n/g, `\n${' '.repeat(depth * 2 + prefix.length)}`);
        const children = nested.map(child => markdownList(child, depth + 1).trimEnd()).join('\n');
        return `${'  '.repeat(depth)}${prefix}${continuation}${children ? `\n${children}` : ''}`;
    }).join('\n') + '\n\n';
}

function markdownNode(node, depth = 0) {
    if (node.nodeType === Node.TEXT_NODE) return markdownText(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const tag = node.tagName.toLowerCase();
    const children = () => [...node.childNodes].map(child => markdownNode(child, depth)).join('');
    if (tag === 'strong') return `**${children()}**`;
    if (tag === 'em') return `*${children()}*`;
    if (tag === 'code' && node.parentElement?.tagName.toLowerCase() !== 'pre') return inlineCode(node.textContent);
    if (tag === 'a') return `[${children()}](${node.getAttribute('href') || ''})`;
    if (tag === 'br') return '  \n';
    if (tag === 'hr') return '\n---\n\n';
    if (/^h[2-4]$/.test(tag)) return `${'#'.repeat(Number(tag[1]))} ${children().trim()}\n\n`;
    if (tag === 'p') return `${children().trim()}\n\n`;
    if (tag === 'ul' || tag === 'ol') return markdownList(node, depth);
    if (tag === 'li') return children();
    if (tag === 'blockquote') {
        const body = children().trim().split('\n').map(line => `> ${line}`.trimEnd()).join('\n');
        return `${body}\n\n`;
    }
    if (tag === 'pre') {
        const text = node.textContent.replace(/\n$/, '');
        const runs = text.match(/`{3,}/g) || [];
        const fence = '`'.repeat(Math.max(3, ...runs.map(run => run.length + 1)));
        return `${fence}\n${text}\n${fence}\n\n`;
    }
    return children();
}

function htmlToMarkdown(cleanHtml) {
    const parsed = new DOMParser().parseFromString(cleanHtml, 'text/html');
    return [...parsed.body.childNodes].map(node => markdownNode(node)).join('').replace(/\n{3,}/g, '\n\n').trim();
}

function editorExports() {
    const editor = document.getElementById('research-article-editor');
    const html = sanitizeEditorHtml(editor?.innerHTML || '');
    return { html, markdown: htmlToMarkdown(html) };
}

function updateWordCount() {
    const editor = document.getElementById('research-article-editor');
    const words = String(editor?.innerText || '').trim().split(/\s+/).filter(Boolean).length;
    const element = document.getElementById('research-editor-word-count');
    if (element) element.textContent = copy().words(words);
}

function openArticleDialog(articleId = '') {
    if (!_activeNotebook) return;
    const articles = _articleCache.get(_activeNotebook.id) || [];
    _editingArticle = articleId ? articles.find(item => item.id === articleId) || null : null;
    _articleSlugEdited = Boolean(_editingArticle);
    const form = document.getElementById('research-article-form');
    form.reset();
    const title = document.getElementById('research-article-title');
    const slug = document.getElementById('research-article-slug');
    const author = document.getElementById('research-article-author');
    const excerpt = document.getElementById('research-article-excerpt');
    const coverUrl = document.getElementById('research-article-cover-url');
    const editor = document.getElementById('research-article-editor');
    title.value = _editingArticle?.title || '';
    slug.value = _editingArticle?.slug || '';
    slug.readOnly = Boolean(_editingArticle);
    slug.setAttribute('aria-readonly', String(Boolean(_editingArticle)));
    author.value = _editingArticle?.author || _actor?.displayName || AUTHOR_FALLBACK;
    excerpt.value = _editingArticle?.excerpt || '';
    coverUrl.value = _editingArticle?.coverUrl || '';
    editor.innerHTML = sanitizeEditorHtml(_editingArticle?.contentHtml || '');
    document.getElementById('research-editor-notebook-name').textContent = _activeNotebook.title;
    document.getElementById('research-article-dialog-title').textContent = _editingArticle ? copy().editArticleTitle : copy().newArticleTitle;
    const draftButton = document.getElementById('research-article-draft');
    draftButton.hidden = _editingArticle?.status === 'published';
    draftButton.value = 'draft';
    draftButton.textContent = copy().saveDraft;
    const publishButton = document.getElementById('research-article-publish');
    publishButton.textContent = _editingArticle?.status === 'published' ? copy().updatePublication : copy().publish;
    setMessage('research-article-message');
    updateWordCount();
    document.getElementById('research-article-dialog').showModal();
    requestAnimationFrame(() => title.focus());
}

function selectionInsideEditor(range, editor) {
    const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
    return container === editor || editor.contains(container);
}

function applyInlineCode() {
    const editor = document.getElementById('research-article-editor');
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!selectionInsideEditor(range, editor)) return;
    const code = document.createElement('code');
    if (range.collapsed) {
        code.textContent = 'code';
        range.insertNode(code);
        range.selectNodeContents(code);
    } else {
        code.appendChild(range.extractContents());
        range.insertNode(code);
        range.selectNodeContents(code);
    }
    selection.removeAllRanges();
    selection.addRange(range);
    editor.focus();
    updateWordCount();
}

async function copyExport(format) {
    const exports = editorExports();
    const value = format === 'html' ? exports.html : exports.markdown;
    try {
        await navigator.clipboard.writeText(value);
    } catch {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
    }
    setMessage('research-article-message', format === 'html' ? copy().copiedHtml : copy().copiedMarkdown, 'is-success');
}

async function saveArticle(event) {
    event.preventDefault();
    if (!_activeNotebook || !_actor) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const targetStatus = event.submitter?.value === 'published' ? 'published' : 'draft';
    const title = document.getElementById('research-article-title').value.trim();
    const slug = _editingArticle?.slug || slugify(document.getElementById('research-article-slug').value || title);
    const author = document.getElementById('research-article-author').value.trim();
    const excerpt = document.getElementById('research-article-excerpt').value.trim();
    const rawCoverUrl = document.getElementById('research-article-cover-url').value.trim();
    const coverUrl = assetUrl(rawCoverUrl);
    const exports = editorExports();
    const articles = _articleCache.get(_activeNotebook.id) || [];
    if (!_editingArticle && articles.some(item => item.locale === _activeNotebook.locale && item.slug === slug)) {
        setMessage('research-article-message', copy().slugDuplicate, 'is-error');
        return;
    }
    if (rawCoverUrl && !coverUrl) {
        setMessage('research-article-message', copy().invalidCoverUrl, 'is-error');
        return;
    }
    const textContent = new DOMParser().parseFromString(exports.html, 'text/html').body.textContent.trim();
    if (targetStatus === 'published' && (!textContent || !exports.markdown)) {
        setMessage('research-article-message', copy().contentRequired, 'is-error');
        return;
    }
    if (exports.html.length + exports.markdown.length > 740000) {
        setMessage('research-article-message', copy().contentTooLarge, 'is-error');
        return;
    }

    const draftButton = document.getElementById('research-article-draft');
    const publishButton = document.getElementById('research-article-publish');
    draftButton.disabled = true;
    publishButton.disabled = true;
    const originalDraftLabel = draftButton.textContent;
    const originalPublishLabel = publishButton.textContent;
    event.submitter.textContent = copy().saving;
    setMessage('research-article-message');
    setSyncState('syncing');

    const notebookId = _activeNotebook.id;
    const articleRef = _editingArticle
        ? doc(db, NOTEBOOKS_COLLECTION, notebookId, 'articles', _editingArticle.id)
        : doc(collection(db, NOTEBOOKS_COLLECTION, notebookId, 'articles'));
    const maxOrder = articles.reduce((highest, item) => Number.isInteger(item.order) ? Math.max(highest, item.order) : highest, -1);
    const order = Number.isInteger(_editingArticle?.order) ? _editingArticle.order : maxOrder + 1;
    const visibility = targetStatus === 'published' ? 'public' : 'unlisted';
    const publishedAt = targetStatus === 'published'
        ? (_editingArticle?.status === 'published' && _editingArticle.publishedAt ? _editingArticle.publishedAt : serverTimestamp())
        : null;

    try {
        const batch = writeBatch(db);
        const articleFields = {
            title,
            author,
            excerpt,
            contentHtml: exports.html,
            contentMarkdown: exports.markdown,
            coverUrl,
            coverPath: _editingArticle?.coverPath || '',
            coverAlt: title,
            status: targetStatus,
            visibility,
            order,
            publishedAt,
            updatedAt: serverTimestamp(),
            updatedBy: _actor.uid
        };
        if (_editingArticle) {
            batch.update(articleRef, articleFields);
        } else {
            batch.set(articleRef, {
                schemaVersion: 1,
                notebookId,
                slug,
                ...articleFields,
                locale: _activeNotebook.locale,
                createdAt: serverTimestamp(),
                createdBy: _actor.uid
            });
        }

        if (targetStatus === 'published' && (_activeNotebook.status !== 'published' || _activeNotebook.visibility !== 'public')) {
            batch.update(doc(db, NOTEBOOKS_COLLECTION, notebookId), {
                status: 'published',
                visibility: 'public',
                publishedAt: _activeNotebook.status === 'published' && _activeNotebook.publishedAt
                    ? _activeNotebook.publishedAt
                    : serverTimestamp(),
                updatedAt: serverTimestamp(),
                updatedBy: _actor.uid
            });
        }
        await batch.commit();
        document.getElementById('research-article-dialog').close();
        _lastLoadedAt = 0;
        await loadResearch({ force: true, preserveNotebookId: notebookId });
        setSyncState('ready', targetStatus === 'published' ? copy().articlePublished : copy().articleSaved);
    } catch (error) {
        console.error('[Elysium Research] article save failed:', error);
        setMessage('research-article-message', friendlyError(error, copy().loadFailed), 'is-error');
        setSyncState('error');
    } finally {
        draftButton.disabled = false;
        publishButton.disabled = false;
        draftButton.textContent = originalDraftLabel;
        publishButton.textContent = originalPublishLabel;
    }
}

function bindEditor() {
    const editor = document.getElementById('research-article-editor');
    const toolbar = document.getElementById('research-editor-toolbar');
    toolbar.addEventListener('mousedown', event => {
        if (event.target.closest('button')) event.preventDefault();
    });
    toolbar.addEventListener('click', event => {
        const command = event.target.closest('[data-editor-command]')?.dataset.editorCommand;
        const block = event.target.closest('[data-editor-block-command]')?.dataset.editorBlockCommand;
        if (command) {
            editor.focus();
            document.execCommand(command, false);
        }
        if (block) {
            editor.focus();
            document.execCommand('formatBlock', false, block);
        }
        updateWordCount();
    });
    document.getElementById('research-editor-block').addEventListener('change', event => {
        editor.focus();
        document.execCommand('formatBlock', false, event.target.value);
        event.target.value = 'p';
    });
    document.getElementById('research-editor-inline-code').addEventListener('click', applyInlineCode);
    editor.addEventListener('input', updateWordCount);
    editor.addEventListener('paste', event => {
        event.preventDefault();
        const html = event.clipboardData?.getData('text/html');
        const plain = event.clipboardData?.getData('text/plain') || '';
        const safe = html
            ? sanitizeEditorHtml(html)
            : plain.split(/\n{2,}/).map(paragraph => `<p>${esc(paragraph).replace(/\n/g, '<br>')}</p>`).join('');
        document.execCommand('insertHTML', false, safe);
        updateWordCount();
    });
}

function bindResearchUi() {
    document.getElementById('research-new-notebook').addEventListener('click', openNotebookDialog);
    document.getElementById('research-back-notebooks').addEventListener('click', closeNotebook);
    document.getElementById('research-new-article').addEventListener('click', () => openArticleDialog());
    document.getElementById('research-notebook-form').addEventListener('submit', createNotebook);
    document.getElementById('research-article-form').addEventListener('submit', saveArticle);
    document.getElementById('research-notebook-title').addEventListener('input', event => {
        if (!_notebookSlugEdited) document.getElementById('research-notebook-slug').value = slugify(event.target.value);
    });
    document.getElementById('research-notebook-slug').addEventListener('input', () => { _notebookSlugEdited = true; });
    document.getElementById('research-article-title').addEventListener('input', event => {
        if (!_articleSlugEdited) document.getElementById('research-article-slug').value = slugify(event.target.value);
    });
    document.getElementById('research-article-slug').addEventListener('input', () => { _articleSlugEdited = true; });
    document.getElementById('research-notebook-cover-file').addEventListener('change', event => previewCover(event.target.files?.[0]));
    document.getElementById('research-notebook-grid').addEventListener('click', event => {
        const button = event.target.closest('[data-research-notebook]');
        if (button) openNotebook(button.dataset.researchNotebook);
    });
    document.getElementById('research-article-list').addEventListener('click', event => {
        const button = event.target.closest('[data-research-article]');
        if (button) openArticleDialog(button.dataset.researchArticle);
    });
    document.getElementById('research-copy-html').addEventListener('click', () => copyExport('html'));
    document.getElementById('research-copy-markdown').addEventListener('click', () => copyExport('markdown'));
    document.querySelectorAll('[data-research-close]').forEach(button => button.addEventListener('click', () => {
        document.getElementById(button.dataset.researchClose)?.close();
    }));
    document.querySelectorAll('#research-notebook-dialog, #research-article-dialog').forEach(dialog => {
        dialog.addEventListener('click', event => {
            if (event.target === dialog) dialog.close();
        });
    });
    document.getElementById('nav-research').addEventListener('click', () => {
        queueMicrotask(() => loadResearch({ force: Date.now() - _lastLoadedAt >= RESEARCH_REFRESH_MS }));
    });
    // `admin.js` avisa cada vez que fija el idioma, y no sólo al pulsar el
    // conmutador: el idioma real se decide al arrancar (por dominio nacional,
    // por `?lang=` o por lo guardado) y llega **después** de este módulo. Con
    // sólo el clic, Research abría siempre en el inglés del `<html lang="en">`
    // aunque el resto del panel estuviera en español.
    document.addEventListener('elysium:language', () => queueMicrotask(applyCopy));
    bindEditor();
}

document.addEventListener('DOMContentLoaded', () => {
    bindResearchUi();
    applyCopy();

    const section = document.getElementById('research');
    new MutationObserver(() => {
        if (section.classList.contains('active') && _authorized) loadResearch();
    }).observe(section, { attributes: true, attributeFilter: ['class'] });

    onAuthStateChanged(auth, async user => {
        _authorized = await canManageResearch(user);
        _actor = _authorized ? user : null;
        if (!_authorized) return;
        if (section.classList.contains('active')) loadResearch();
        setTimeout(() => {
            if (section.classList.contains('active')) loadResearch();
        }, 250);
    });
});
