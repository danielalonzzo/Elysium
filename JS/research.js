const FIRESTORE_MODULE_URL = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
const NOTEBOOKS_COLLECTION = 'research_notebooks';
const PUBLIC_STATUS = 'published';
const PUBLIC_VISIBILITY = 'public';

const htmlLanguage = (document.documentElement.lang || 'en').toLowerCase();
const locale = htmlLanguage.startsWith('es') ? 'es' : htmlLanguage.startsWith('pt') ? 'pt' : 'en';

const copy = {
    en: {
        notebook: 'Research notebook',
        openNotebook: 'Open notebook',
        publications: 'publications',
        publication: 'publication',
        read: 'Read publication',
        emptyTitle: 'No publications yet',
        emptyBody: 'Published work from this notebook will appear here.',
        notFoundTitle: 'Notebook not found',
        notFoundBody: 'This notebook is unavailable or has not been published.',
        articleNotFoundTitle: 'Publication not found',
        articleNotFoundBody: 'This publication is unavailable or has not been published.',
        loading: 'Checking for newly published research…',
        fallback: 'Showing the locally available edition.',
        backToNotebooks: 'Back to notebooks',
        backToNotebook: 'Back to notebook',
        downloadPdf: 'Download PDF',
        published: 'Published',
        by: 'By'
    },
    es: {
        notebook: 'Cuaderno de investigación',
        openNotebook: 'Abrir cuaderno',
        publications: 'publicaciones',
        publication: 'publicación',
        read: 'Leer publicación',
        emptyTitle: 'Aún no hay publicaciones',
        emptyBody: 'Los trabajos publicados en este cuaderno aparecerán aquí.',
        notFoundTitle: 'Cuaderno no encontrado',
        notFoundBody: 'Este cuaderno no está disponible o todavía no se ha publicado.',
        articleNotFoundTitle: 'Publicación no encontrada',
        articleNotFoundBody: 'Esta publicación no está disponible o todavía no se ha publicado.',
        loading: 'Buscando nuevas publicaciones…',
        fallback: 'Se muestra la edición disponible localmente.',
        backToNotebooks: 'Volver a cuadernos',
        backToNotebook: 'Volver al cuaderno',
        downloadPdf: 'Descargar en PDF',
        published: 'Publicado',
        by: 'Por'
    },
    pt: {
        notebook: 'Caderno de investigação',
        openNotebook: 'Abrir caderno',
        publications: 'publicações',
        publication: 'publicação',
        read: 'Ler publicação',
        emptyTitle: 'Ainda não existem publicações',
        emptyBody: 'Os trabalhos publicados neste caderno aparecerão aqui.',
        notFoundTitle: 'Caderno não encontrado',
        notFoundBody: 'Este caderno não está disponível ou ainda não foi publicado.',
        articleNotFoundTitle: 'Publicação não encontrada',
        articleNotFoundBody: 'Esta publicação não está disponível ou ainda não foi publicada.',
        loading: 'A procurar novas publicações…',
        fallback: 'A mostrar a edição disponível localmente.',
        backToNotebooks: 'Voltar aos cadernos',
        backToNotebook: 'Voltar ao caderno',
        downloadPdf: 'Descarregar em PDF',
        published: 'Publicado',
        by: 'Por'
    }
}[locale];

const canonical = document.querySelector('link[rel="canonical"]')?.href;
const researchPath = canonical
    ? new URL(canonical, window.location.href).pathname.replace(/\/$/, '')
    : window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');

const params = new URLSearchParams(window.location.search);
const requestedNotebookSlug = cleanSlug(params.get('notebook'));
const requestedArticleSlug = cleanSlug(params.get('article'));

function cleanSlug(value) {
    const slug = String(value || '').trim().toLowerCase();
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : '';
}

function notebookUrl(slug) {
    const url = new URL(researchPath, window.location.origin);
    url.searchParams.set('notebook', slug);
    return `${url.pathname}${url.search}`;
}

function articleUrl(notebookSlug, articleSlug) {
    const url = new URL(researchPath, window.location.origin);
    url.searchParams.set('notebook', notebookSlug);
    url.searchParams.set('article', articleSlug);
    return `${url.pathname}${url.search}`;
}

function compareByOrder(left, right) {
    const leftOrder = Number.isFinite(Number(left.order)) ? Number(left.order) : Number.MAX_SAFE_INTEGER;
    const rightOrder = Number.isFinite(Number(right.order)) ? Number(right.order) : Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return String(left.title || '').localeCompare(String(right.title || ''), locale);
}

function validPublicImageUrl(value) {
    if (!value) return '';
    try {
        const url = new URL(String(value), window.location.origin);
        if (!['http:', 'https:'].includes(url.protocol)) return '';
        return url.href;
    } catch {
        return '';
    }
}

function setCover(element, property, value) {
    const url = validPublicImageUrl(value);
    if (!url) return;
    const escaped = url.replace(/["\\\n\r]/g, character => `\\${character}`);
    element.style.setProperty(property, `url("${escaped}")`);
}

function countLabel(count) {
    return `${count} ${count === 1 ? copy.publication : copy.publications}`;
}

function formatDate(value) {
    if (!value) return '';
    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const localeTag = locale === 'es' ? 'es-CR' : locale === 'pt' ? 'pt-PT' : 'en-GB';
    return new Intl.DateTimeFormat(localeTag, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function setResearchStatus(message = '') {
    const status = document.querySelector('[data-research-status]');
    if (!status) return;
    status.textContent = message;
    status.hidden = !message;
}

function showView(viewName) {
    document.querySelectorAll('[data-research-view]').forEach(view => {
        view.hidden = view.dataset.researchView !== viewName;
    });

    const header = document.querySelector('.notebooks-page-header');
    if (header) header.hidden = viewName === 'article';
}

function createNotebookCard(notebook, index) {
    const card = document.createElement('a');
    card.className = 'notebook-card';
    card.href = notebookUrl(cleanSlug(notebook.slug));
    card.dataset.notebookSlug = cleanSlug(notebook.slug);
    card.setAttribute('aria-label', `${copy.openNotebook}: ${notebook.title}`);
    setCover(card, '--notebook-cover', notebook.coverUrl);

    const top = document.createElement('div');
    top.className = 'notebook-card-top';

    const number = document.createElement('span');
    number.className = 'notebook-index';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(index + 1).padStart(2, '0');

    const status = document.createElement('span');
    status.className = 'notebook-status';
    status.textContent = copy.notebook;

    top.append(number, status);

    const body = document.createElement('div');
    body.className = 'notebook-card-body';

    const title = document.createElement('h3');
    title.textContent = notebook.title || notebook.slug;

    const description = document.createElement('p');
    description.className = 'notebook-card-description';
    description.textContent = notebook.description || '';

    const footer = document.createElement('div');
    footer.className = 'notebook-card-footer';

    const publicationCount = document.createElement('span');
    publicationCount.textContent = copy.openNotebook;

    const arrow = document.createElement('span');
    arrow.className = 'notebook-card-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';

    footer.append(publicationCount, arrow);
    body.append(title, description, footer);
    card.append(top, body);
    return card;
}

function renderNotebooks(notebooks) {
    const grid = document.querySelector('[data-notebooks-grid]');
    if (!grid || !notebooks.length) return;
    grid.replaceChildren(...notebooks.sort(compareByOrder).map(createNotebookCard));
}

function createPublicationCard(article, notebookSlug) {
    const card = document.createElement('a');
    card.className = 'publication-card';
    card.href = articleUrl(notebookSlug, cleanSlug(article.slug));
    card.setAttribute('aria-label', `${copy.read}: ${article.title}`);
    setCover(card, '--publication-cover', article.coverUrl);

    const content = document.createElement('div');
    const kicker = document.createElement('p');
    kicker.className = 'publication-kicker';
    kicker.textContent = copy.published;

    const title = document.createElement('h4');
    title.textContent = article.title || article.slug;

    const excerpt = document.createElement('p');
    excerpt.className = 'publication-excerpt';
    excerpt.textContent = article.excerpt || '';

    content.append(kicker, title, excerpt);

    const footer = document.createElement('div');
    footer.className = 'publication-card-footer';

    const meta = document.createElement('span');
    meta.textContent = [article.author, formatDate(article.publishedAt)].filter(Boolean).join(' · ') || copy.read;

    const arrow = document.createElement('span');
    arrow.className = 'publication-card-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';

    footer.append(meta, arrow);
    card.append(content, footer);
    return card;
}

function updateNotebookHeading(notebook) {
    const title = document.querySelector('[data-notebook-title]');
    const description = document.querySelector('[data-notebook-description]');
    const breadcrumb = document.querySelector('[data-notebook-breadcrumb]');
    if (title) title.textContent = notebook.title || notebook.slug;
    if (description) description.textContent = notebook.description || '';
    if (breadcrumb) breadcrumb.textContent = notebook.title || notebook.slug;
    document.title = `${notebook.title || notebook.slug} — Elysium λ Development & Research`;
}

function renderArticles(articles, notebookSlug) {
    const grid = document.querySelector('[data-publications-grid]');
    const empty = document.querySelector('[data-publications-empty]');
    const count = document.querySelector('[data-publications-count]');
    if (!grid) return;

    const sortedArticles = articles.sort(compareByOrder);
    grid.replaceChildren(...sortedArticles.map(article => createPublicationCard(article, notebookSlug)));
    if (count) count.textContent = countLabel(sortedArticles.length);
    if (empty) empty.hidden = sortedArticles.length !== 0;
}

function setEmptyState(titleText, bodyText) {
    const grid = document.querySelector('[data-publications-grid]');
    const empty = document.querySelector('[data-publications-empty]');
    const title = empty?.querySelector('h3');
    const body = empty?.querySelector('p');
    if (grid) grid.replaceChildren();
    if (title) title.textContent = titleText;
    if (body) body.textContent = bodyText;
    if (empty) empty.hidden = false;
    const count = document.querySelector('[data-publications-count]');
    if (count) count.textContent = countLabel(0);
}

function prepareStaticNotebook(slug) {
    const card = document.querySelector(`[data-notebook-slug="${slug}"]`);
    if (!card) {
        updateNotebookHeading({ title: copy.notFoundTitle, description: copy.notFoundBody, slug });
        setEmptyState(copy.notFoundTitle, copy.notFoundBody);
        return false;
    }

    updateNotebookHeading({
        slug,
        title: card.querySelector('h3')?.textContent.trim() || slug,
        description: card.querySelector('.notebook-card-description')?.textContent.trim() || ''
    });

    const fallbackArticles = document.querySelectorAll('[data-static-publication]');
    fallbackArticles.forEach(article => {
        article.hidden = article.dataset.notebookSlug !== slug;
    });
    const visibleCount = [...fallbackArticles].filter(article => !article.hidden).length;
    const empty = document.querySelector('[data-publications-empty]');
    if (empty) empty.hidden = visibleCount !== 0;
    const count = document.querySelector('[data-publications-count]');
    if (count) count.textContent = countLabel(visibleCount);
    return true;
}

async function firestoreTools() {
    const [{ db }, firestore] = await Promise.all([
        import('./firebase-config.js'),
        import(FIRESTORE_MODULE_URL)
    ]);
    return { db, ...firestore };
}

async function apiJson(path) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    try {
        const response = await fetch(path, {
            headers: { Accept: 'application/json' },
            signal: controller.signal
        });
        if (!response.ok) {
            const error = new Error(`Research API returned ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return response.json();
    } finally {
        window.clearTimeout(timeout);
    }
}

function apiLocale(path) {
    const url = new URL(path, window.location.origin);
    url.searchParams.set('locale', locale);
    return `${url.pathname}${url.search}`;
}

async function apiNotebooks() {
    const payload = await apiJson(apiLocale('/api/research/notebooks'));
    return Array.isArray(payload.items) ? payload.items : [];
}

async function apiNotebook(slug) {
    const payload = await apiJson(apiLocale(`/api/research/notebooks/${encodeURIComponent(slug)}`));
    return payload.notebook || null;
}

async function apiArticles(slug) {
    const payload = await apiJson(apiLocale(`/api/research/notebooks/${encodeURIComponent(slug)}/articles`));
    return {
        notebook: payload.notebook || null,
        articles: Array.isArray(payload.items) ? payload.items : []
    };
}

async function apiArticle(notebookSlug, articleSlug) {
    const payload = await apiJson(apiLocale(
        `/api/research/notebooks/${encodeURIComponent(notebookSlug)}/articles/${encodeURIComponent(articleSlug)}`
    ));
    return {
        notebook: payload.notebook || null,
        article: payload.article || null
    };
}

function documentData(snapshot) {
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

async function fetchPublishedNotebooks(tools) {
    const { db, collection, getDocs, limit, query, where } = tools;
    const publishedQuery = query(
        collection(db, NOTEBOOKS_COLLECTION),
        where('status', '==', PUBLIC_STATUS),
        where('visibility', '==', PUBLIC_VISIBILITY),
        where('locale', '==', locale),
        limit(100)
    );
    return documentData(await getDocs(publishedQuery));
}

async function fetchPublishedNotebook(tools, slug) {
    const { db, collection, getDocs, limit, query, where } = tools;
    const notebookQuery = query(
        collection(db, NOTEBOOKS_COLLECTION),
        where('slug', '==', slug),
        where('status', '==', PUBLIC_STATUS),
        where('visibility', '==', PUBLIC_VISIBILITY),
        where('locale', '==', locale),
        limit(1)
    );
    return documentData(await getDocs(notebookQuery))[0] || null;
}

async function fetchPublishedArticles(tools, notebook) {
    const { db, collection, doc, getDocs, limit, query, where } = tools;
    const articlesQuery = query(
        collection(doc(db, NOTEBOOKS_COLLECTION, notebook.id), 'articles'),
        where('status', '==', PUBLIC_STATUS),
        where('visibility', '==', PUBLIC_VISIBILITY),
        where('locale', '==', locale),
        limit(100)
    );
    return documentData(await getDocs(articlesQuery));
}

async function fetchPublishedArticle(tools, notebook, slug) {
    const { db, collection, doc, getDocs, limit, query, where } = tools;
    const articleQuery = query(
        collection(doc(db, NOTEBOOKS_COLLECTION, notebook.id), 'articles'),
        where('slug', '==', slug),
        where('status', '==', PUBLIC_STATUS),
        where('visibility', '==', PUBLIC_VISIBILITY),
        where('locale', '==', locale),
        limit(1)
    );
    return documentData(await getDocs(articleQuery))[0] || null;
}

const blockedContentTags = new Set([
    'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON',
    'TEXTAREA', 'SELECT', 'OPTION', 'META', 'LINK', 'BASE', 'SVG', 'MATH'
]);

const allowedContentTags = new Set([
    'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'B', 'STRONG',
    'I', 'EM', 'U', 'S', 'BLOCKQUOTE', 'PRE', 'CODE', 'A', 'HR', 'BR', 'FIGURE',
    'FIGCAPTION', 'IMG', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD',
    'SUP', 'SUB', 'MARK', 'SMALL'
]);

const globalContentAttributes = new Set(['title']);
const tagContentAttributes = {
    A: new Set(['href', 'target', 'rel']),
    IMG: new Set(['src', 'alt', 'width', 'height', 'loading']),
    OL: new Set(['start']),
    TD: new Set(['colspan', 'rowspan']),
    TH: new Set(['colspan', 'rowspan', 'scope']),
    CODE: new Set(['class'])
};

function safeLink(value) {
    const link = String(value || '').trim();
    if (/^(?:https?:|mailto:|\/|#|\.\.?\/)/i.test(link)) return link;
    return '';
}

function sanitizeArticleHtml(source) {
    const template = document.createElement('template');
    template.innerHTML = String(source || '');
    const elements = [...template.content.querySelectorAll('*')].reverse();

    elements.forEach(element => {
        if (blockedContentTags.has(element.tagName)) {
            element.remove();
            return;
        }

        if (!allowedContentTags.has(element.tagName)) {
            element.replaceWith(...element.childNodes);
            return;
        }

        [...element.attributes].forEach(attribute => {
            const name = attribute.name.toLowerCase();
            const allowedForTag = tagContentAttributes[element.tagName] || new Set();
            if (!globalContentAttributes.has(name) && !allowedForTag.has(name)) {
                element.removeAttribute(attribute.name);
            }
        });

        if (element.tagName === 'CODE' && element.hasAttribute('class')) {
            const codeClass = element.className.trim();
            if (!/^language-[a-z0-9_-]{1,40}$/i.test(codeClass)) element.removeAttribute('class');
        }

        if (element.tagName === 'A') {
            const href = safeLink(element.getAttribute('href'));
            if (href) element.setAttribute('href', href);
            else element.removeAttribute('href');
            if (element.getAttribute('target') === '_blank') {
                element.setAttribute('rel', 'noopener noreferrer');
            } else {
                element.removeAttribute('target');
                element.removeAttribute('rel');
            }
        }

        if (element.tagName === 'IMG') {
            const src = validPublicImageUrl(element.getAttribute('src'));
            if (!src) {
                element.remove();
                return;
            }
            element.setAttribute('src', src);
            element.setAttribute('loading', 'lazy');
        }
    });

    return template.innerHTML;
}

function escapeHtml(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function inlineMarkdown(value) {
    let text = escapeHtml(value);
    const codeTokens = [];
    text = text.replace(/`([^`]+)`/g, (_, code) => {
        const token = `@@CODE${codeTokens.length}@@`;
        codeTokens.push(`<code>${code}</code>`);
        return token;
    });
    text = text
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/_([^_]+)_/g, '<em>$1</em>');
    codeTokens.forEach((code, index) => {
        text = text.replace(`@@CODE${index}@@`, code);
    });
    return text;
}

function markdownToHtml(markdown) {
    const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
    const output = [];
    let paragraph = [];
    let listType = '';
    let inCode = false;
    let codeLanguage = '';
    let codeLines = [];

    const closeParagraph = () => {
        if (!paragraph.length) return;
        output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
        paragraph = [];
    };
    const closeList = () => {
        if (!listType) return;
        output.push(`</${listType}>`);
        listType = '';
    };

    lines.forEach(line => {
        const fence = line.match(/^```\s*([a-z0-9_-]+)?\s*$/i);
        if (fence) {
            closeParagraph();
            closeList();
            if (inCode) {
                const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
                output.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
                inCode = false;
                codeLanguage = '';
                codeLines = [];
            } else {
                inCode = true;
                codeLanguage = fence[1] || '';
            }
            return;
        }

        if (inCode) {
            codeLines.push(line);
            return;
        }

        const heading = line.match(/^(#{1,6})\s+(.+)$/);
        const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
        const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
        const quote = line.match(/^>\s?(.*)$/);

        if (heading) {
            closeParagraph();
            closeList();
            output.push(`<h${heading[1].length}>${inlineMarkdown(heading[2])}</h${heading[1].length}>`);
        } else if (unordered || ordered) {
            closeParagraph();
            const nextListType = unordered ? 'ul' : 'ol';
            if (listType !== nextListType) {
                closeList();
                listType = nextListType;
                output.push(`<${listType}>`);
            }
            output.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`);
        } else if (quote) {
            closeParagraph();
            closeList();
            output.push(`<blockquote><p>${inlineMarkdown(quote[1])}</p></blockquote>`);
        } else if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)) {
            closeParagraph();
            closeList();
            output.push('<hr>');
        } else if (!line.trim()) {
            closeParagraph();
            closeList();
        } else {
            paragraph.push(line.trim());
        }
    });

    if (inCode) {
        output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    }
    closeParagraph();
    closeList();
    return output.join('\n');
}

function pdfButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pdf-download-button';
    button.dataset.downloadPdf = '';
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/></svg>';
    const label = document.createElement('span');
    label.textContent = copy.downloadPdf;
    button.append(label);
    return button;
}

function renderDynamicArticle(notebook, article) {
    const reader = document.querySelector('[data-dynamic-reader]');
    if (!reader) return;

    const articleContent = article.contentHtml
        ? sanitizeArticleHtml(article.contentHtml)
        : sanitizeArticleHtml(markdownToHtml(article.contentMarkdown));
    const date = formatDate(article.publishedAt);

    reader.replaceChildren();
    const container = document.createElement('article');
    container.className = 'paper-container animate-on-scroll';

    const toolbar = document.createElement('div');
    toolbar.className = 'paper-toolbar';
    const back = document.createElement('a');
    back.className = 'back-link';
    back.href = notebookUrl(notebook.slug);
    back.textContent = `← ${copy.backToNotebook}`;
    toolbar.append(back, pdfButton());

    const meta = document.createElement('div');
    meta.className = 'paper-meta';
    const badge = document.createElement('span');
    badge.className = 'paper-badge';
    badge.textContent = copy.published;
    meta.append(badge);
    if (date) {
        const dateBadge = document.createElement('span');
        dateBadge.className = 'paper-badge secondary';
        dateBadge.textContent = date;
        meta.append(dateBadge);
    }

    const title = document.createElement('h1');
    title.className = 'paper-title';
    title.textContent = article.title || article.slug;

    const author = document.createElement('p');
    author.className = 'paper-authors';
    author.textContent = article.author ? `${copy.by} ${article.author}` : 'Elysium λ Development & Research';

    const affiliation = document.createElement('p');
    affiliation.className = 'paper-affiliation';
    affiliation.textContent = notebook.title;

    const divider = document.createElement('hr');
    divider.className = 'paper-divider';

    const body = document.createElement('div');
    body.className = 'paper-body';
    body.innerHTML = articleContent || `<p>${escapeHtml(article.excerpt || '')}</p>`;

    container.append(toolbar, meta, title, author, affiliation, divider, body);
    reader.append(container);
    document.title = `${article.title || article.slug} — Elysium λ Development & Research`;
    bindPdfButtons(reader);
}

function renderArticleNotFound() {
    const reader = document.querySelector('[data-dynamic-reader]');
    if (!reader) return;
    reader.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'paper-container';
    const back = document.createElement('a');
    back.className = 'back-link';
    back.href = researchPath;
    back.textContent = `← ${copy.backToNotebooks}`;
    const title = document.createElement('h1');
    title.className = 'paper-title';
    title.textContent = copy.articleNotFoundTitle;
    const body = document.createElement('p');
    body.className = 'paper-body';
    body.textContent = copy.articleNotFoundBody;
    container.append(back, title, body);
    reader.append(container);
}

function bindPdfButtons(root = document) {
    root.querySelectorAll('[data-download-pdf]').forEach(button => {
        if (button.dataset.pdfReady === 'true') return;
        button.dataset.pdfReady = 'true';
        button.addEventListener('click', () => {
            const previousTitle = document.title;
            const articleTitle = button.closest('.paper-container')?.querySelector('.paper-title')?.textContent.trim();
            if (articleTitle) document.title = articleTitle;
            window.print();
            document.title = previousTitle;
        });
    });
}

async function initialiseNotebooks() {
    const grid = document.querySelector('[data-notebooks-grid]');
    if (!grid) return;

    if (requestedArticleSlug && requestedNotebookSlug) {
        showView('article');
        setResearchStatus(copy.loading);
        try {
            let notebook;
            let article;
            try {
                ({ notebook, article } = await apiArticle(requestedNotebookSlug, requestedArticleSlug));
            } catch (apiError) {
                console.info('[research] Public API unavailable; trying Firestore.', apiError?.status || apiError?.message || apiError);
                const tools = await firestoreTools();
                notebook = await fetchPublishedNotebook(tools, requestedNotebookSlug);
                article = notebook
                    ? await fetchPublishedArticle(tools, notebook, requestedArticleSlug)
                    : null;
            }
            if (!notebook) {
                renderArticleNotFound();
                return;
            }
            if (article) renderDynamicArticle(notebook, article);
            else renderArticleNotFound();
        } catch (error) {
            console.info('[research] Dynamic publication unavailable.', error?.code || error?.message || error);
            renderArticleNotFound();
        } finally {
            setResearchStatus('');
        }
        return;
    }

    if (requestedNotebookSlug) {
        showView('notebook');
        const hasStaticFallback = prepareStaticNotebook(requestedNotebookSlug);
        setResearchStatus(copy.loading);
        try {
            let notebook;
            let articles;
            try {
                ({ notebook, articles } = await apiArticles(requestedNotebookSlug));
            } catch (apiError) {
                console.info('[research] Public API unavailable; trying Firestore.', apiError?.status || apiError?.message || apiError);
                const tools = await firestoreTools();
                notebook = await fetchPublishedNotebook(tools, requestedNotebookSlug);
                articles = notebook ? await fetchPublishedArticles(tools, notebook) : [];
            }
            if (!notebook) {
                if (!hasStaticFallback) setEmptyState(copy.notFoundTitle, copy.notFoundBody);
                return;
            }
            updateNotebookHeading(notebook);
            renderArticles(articles, notebook.slug);
        } catch (error) {
            console.info('[research] Dynamic notebook unavailable; retaining HTML fallback.', error?.code || error?.message || error);
            if (hasStaticFallback) setResearchStatus(copy.fallback);
        } finally {
            if (document.querySelector('[data-research-status]')?.textContent === copy.loading) {
                setResearchStatus('');
            }
        }
        return;
    }

    showView('notebooks');
    setResearchStatus(copy.loading);
    try {
        let notebooks;
        try {
            notebooks = await apiNotebooks();
        } catch (apiError) {
            console.info('[research] Public API unavailable; trying Firestore.', apiError?.status || apiError?.message || apiError);
            const tools = await firestoreTools();
            notebooks = await fetchPublishedNotebooks(tools);
        }
        if (notebooks.length) renderNotebooks(notebooks);
    } catch (error) {
        console.info('[research] Dynamic notebooks unavailable; retaining HTML fallback.', error?.code || error?.message || error);
        setResearchStatus(copy.fallback);
        return;
    }
    setResearchStatus('');
}

bindPdfButtons();
initialiseNotebooks();
