/**
 * Herramientas del CRM — el editor de PDF.
 *
 * Ordenar, girar y quitar páginas, unir varios PDF y extraer una selección
 * ocurre aquí, en el navegador: pdf.js pinta las miniaturas y pdf-lib escribe
 * el PDF nuevo. El documento no sale del ordenador de quien lo edita.
 *
 * Pasar a Word es lo único que necesita servidor: el PDF editado se envía a
 * `elysium-tools` (`POST /api/tools/pdf/convert`), que lo convierte con
 * pdf2docx y contesta en NDJSON como la descarga de videos, hasta un `ready`
 * con el .docx en `/api/tools/files/<token>`. Pages no tiene un formato
 * abierto que se pueda escribir; abre el .docx directamente.
 *
 * Las dos librerías están en `JS/vendor/` y no en un CDN: el worker de pdf.js
 * tiene que ser del mismo origen (la CSP del CRM no admite workers `blob:`), y
 * así ningún documento depende de un servidor ajeno.
 *
 * El texto sigue el patrón de `admin-research.js`: diccionario propio, idioma
 * de `<html lang>` y repintado con el evento `elysium:language` de `admin.js`.
 */
// En tools.elysiumdr.eu el mismo módulo trabaja sin sesión, con Turnstile y
// textos para el público: ver `tools-public.js`. En el CRM no se carga.
const PUBLIC = document.body.dataset.publicTools === 'true' ? await import('./tools-public.js') : null;
const authReady = PUBLIC ? Promise.resolve(null) : import('./firebase-config.js').then(module => module.auth);

const PDFJS_URL = '/JS/vendor/pdfjs-5.7.284/pdf.min.js';
const PDFJS_WORKER_URL = '/JS/vendor/pdfjs-5.7.284/pdf.worker.min.js';
const PDF_LIB_URL = '/JS/vendor/pdf-lib-1.17.1/pdf-lib.min.js';
const CONVERT_URL = PUBLIC ? '/api/tools/public/pdf/convert' : '/api/tools/pdf/convert';
const MAX_FILE_BYTES = 200 * 1000 * 1000;
const CONVERT_MAX_BYTES = 30 * 1000 * 1000;
const THUMB_WIDTH = 150;
const MAX_HISTORY = 40;
const FILE_HUES = [214, 162, 32, 280, 350, 190, 92, 12];
const LONG_PRESS_MS = 320;

const COPY = {
    en: {
        dropTitle: 'Drop your PDF files here',
        dropText: 'Reorder, rotate and delete pages, merge several PDFs or turn them into Word.',
        choose: 'Choose PDF files',
        privacy: 'Pages are edited in this browser: the files do not leave your computer.',
        dropping: 'Drop the PDF files to add them',
        add: '+ Add PDF',
        undo: 'Undo',
        reset: 'Start over',
        selectAll: 'Select all',
        selectNone: 'Clear selection',
        rotate: 'Rotate',
        delete: 'Delete',
        hint: 'Drag the pages to reorder them (on a phone, hold one and drag). Click to select; Shift-click selects a range.',
        pagesAria: 'Pages of the document',
        fileName: 'File name',
        download: 'Download PDF',
        extract: 'Download selected pages',
        convert: 'Convert to Word',
        wordNote: 'Word (.docx) opens in Word, Pages and Google Docs. To convert, the PDF is sent to the Elysium tools service, which does not keep it.',
        summary: (pages, files, selected) => `${pages} page${pages === 1 ? '' : 's'} · ${files} PDF${files === 1 ? '' : 's'}${selected ? ` · ${selected} selected` : ''}`,
        filePages: pages => `${pages} p.`,
        protectedBadge: 'Protected',
        removeFile: name => `Remove ${name}`,
        pageLabel: (position, total, name, original) => `Page ${position} of ${total}: ${name}, page ${original}`,
        rotatePage: 'Rotate the page',
        deletePage: 'Delete the page',
        moveBefore: 'Move earlier',
        moveAfter: 'Move later',
        mergedName: 'merged-document',
        selectionSuffix: 'selection',
        opening: 'Opening the PDF files…',
        building: 'Preparing the PDF…',
        saved: name => `Saved: ${name}`,
        stages: {
            uploading: 'Uploading the PDF…',
            accepted: 'Received. Preparing…',
            starting: 'Preparing…',
            opening: 'Opening the PDF…',
            analyzing: 'Analysing the layout…',
            parsing: 'Reading the pages…',
            creating: 'Writing the Word document…'
        },
        queued: position => `Waiting in line (${position})`,
        reading: (page, pages) => `Reading page ${page} of ${pages}`,
        writing: (page, pages) => `Writing page ${page} of ${pages}`,
        converted: (size, time) => `Word ready · ${size} · available until ${time}`,
        save: 'Save',
        cancel: 'Cancel',
        cancelled: 'Conversion cancelled.',
        scanned: 'This PDF looks scanned: the Word document will hold the pages as images, not editable text.',
        detail: 'Technical detail',
        untitled: 'document',
        errors: {
            not_pdf: name => `${name} is not a PDF.`,
            too_large: (name, size) => `${name} is larger than ${size}.`,
            password: name => `${name} is protected with a password. Remove it and try again.`,
            encrypted: name => `${name} is encrypted: its pages can be viewed but not copied into a new PDF. Convert it to Word as it is, or remove the protection first.`,
            invalid: name => `${name} could not be opened. It may be damaged.`,
            library: 'The PDF tools could not be loaded. Check the connection and try again.',
            build: 'The PDF could not be generated.',
            empty: 'There are no pages to save.',
            convert_too_large: size => `To convert to Word, the PDF must be ${size} or smaller.`,
            pdf_encrypted: 'The PDF is protected with a password.',
            pdf_invalid: 'The tools service could not read this PDF.',
            pdf_too_many_pages: 'The PDF has too many pages to convert (500 at most).',
            pdf_failed: 'The PDF could not be converted to Word.',
            payload_too_large: 'The PDF is too large to convert.',
            timeout: 'The conversion took too long. Try with fewer pages.',
            engine_unavailable: 'The conversion engine is not available on the tools service.',
            tools_not_configured: 'The tools service is not deployed yet, so Word conversion is not available.',
            tools_unreachable: 'The tools service did not answer. Try again in a moment.',
            unauthenticated: 'Your session expired. Sign in again.',
            admin_required: 'Only administrators can use the tools.',
            connection: 'The connection was lost. Try again.',
            failed: 'The PDF could not be converted to Word.'
        }
    },
    es: {
        dropTitle: 'Suelta aquí tus PDF',
        dropText: 'Ordena, gira y elimina páginas, une varios PDF o pásalos a Word.',
        choose: 'Elegir archivos PDF',
        privacy: 'Las páginas se editan en este navegador: los archivos no salen de tu computadora.',
        dropping: 'Suelta los PDF para añadirlos',
        add: '+ Añadir PDF',
        undo: 'Deshacer',
        reset: 'Empezar de nuevo',
        selectAll: 'Seleccionar todo',
        selectNone: 'Quitar selección',
        rotate: 'Girar',
        delete: 'Eliminar',
        hint: 'Arrastra las páginas para ordenarlas (en el celular, mantén una pulsada y arrastra). Haz clic para seleccionar; con Mayús seleccionas un rango.',
        pagesAria: 'Páginas del documento',
        fileName: 'Nombre del archivo',
        download: 'Descargar PDF',
        extract: 'Descargar páginas seleccionadas',
        convert: 'Convertir a Word',
        wordNote: 'Word (.docx) se abre en Word, Pages y Google Docs. Para convertir, el PDF se envía al servicio de herramientas de Elysium, que no lo guarda.',
        summary: (pages, files, selected) => `${pages} página${pages === 1 ? '' : 's'} · ${files} PDF${selected ? ` · ${selected} seleccionada${selected === 1 ? '' : 's'}` : ''}`,
        filePages: pages => `${pages} pág.`,
        protectedBadge: 'Protegido',
        removeFile: name => `Quitar ${name}`,
        pageLabel: (position, total, name, original) => `Página ${position} de ${total}: ${name}, página ${original}`,
        rotatePage: 'Girar la página',
        deletePage: 'Eliminar la página',
        moveBefore: 'Mover antes',
        moveAfter: 'Mover después',
        mergedName: 'documento-unido',
        selectionSuffix: 'seleccion',
        opening: 'Abriendo los PDF…',
        building: 'Preparando el PDF…',
        saved: name => `Guardado: ${name}`,
        stages: {
            uploading: 'Subiendo el PDF…',
            accepted: 'Recibido. Preparando…',
            starting: 'Preparando…',
            opening: 'Abriendo el PDF…',
            analyzing: 'Analizando el diseño…',
            parsing: 'Leyendo las páginas…',
            creating: 'Escribiendo el documento de Word…'
        },
        queued: position => `En cola (${position})`,
        reading: (page, pages) => `Leyendo la página ${page} de ${pages}`,
        writing: (page, pages) => `Escribiendo la página ${page} de ${pages}`,
        converted: (size, time) => `Word listo · ${size} · disponible hasta las ${time}`,
        save: 'Guardar',
        cancel: 'Cancelar',
        cancelled: 'Conversión cancelada.',
        scanned: 'Este PDF parece escaneado: el Word tendrá las páginas como imágenes, no texto editable.',
        detail: 'Detalle técnico',
        untitled: 'documento',
        errors: {
            not_pdf: name => `${name} no es un PDF.`,
            too_large: (name, size) => `${name} pesa más de ${size}.`,
            password: name => `${name} tiene contraseña. Quítasela e inténtalo de nuevo.`,
            encrypted: name => `${name} está cifrado: sus páginas se ven, pero no se pueden copiar a un PDF nuevo. Conviértelo a Word tal cual o quítale antes la protección.`,
            invalid: name => `No se pudo abrir ${name}. Puede estar dañado.`,
            library: 'No se pudieron cargar las herramientas de PDF. Revisa la conexión e inténtalo de nuevo.',
            build: 'No se pudo generar el PDF.',
            empty: 'No hay páginas que guardar.',
            convert_too_large: size => `Para convertir a Word, el PDF debe pesar ${size} o menos.`,
            pdf_encrypted: 'El PDF tiene contraseña.',
            pdf_invalid: 'El servicio de herramientas no pudo leer este PDF.',
            pdf_too_many_pages: 'El PDF tiene demasiadas páginas para convertirlo (500 como máximo).',
            pdf_failed: 'No se pudo convertir el PDF a Word.',
            payload_too_large: 'El PDF es demasiado grande para convertirlo.',
            timeout: 'La conversión tardó demasiado. Prueba con menos páginas.',
            engine_unavailable: 'El motor de conversión no está disponible en el servicio de herramientas.',
            tools_not_configured: 'El servicio de herramientas aún no está desplegado, así que la conversión a Word no está disponible.',
            tools_unreachable: 'El servicio de herramientas no respondió. Inténtalo en un momento.',
            unauthenticated: 'Tu sesión caducó. Vuelve a iniciar sesión.',
            admin_required: 'Solo los administradores pueden usar las herramientas.',
            connection: 'Se perdió la conexión. Inténtalo de nuevo.',
            failed: 'No se pudo convertir el PDF a Word.'
        }
    },
    pt: {
        dropTitle: 'Largue aqui os seus PDF',
        dropText: 'Ordene, rode e elimine páginas, junte vários PDF ou converta-os para Word.',
        choose: 'Escolher ficheiros PDF',
        privacy: 'As páginas são editadas neste navegador: os ficheiros não saem do seu computador.',
        dropping: 'Largue os PDF para os adicionar',
        add: '+ Adicionar PDF',
        undo: 'Anular',
        reset: 'Começar de novo',
        selectAll: 'Selecionar tudo',
        selectNone: 'Limpar seleção',
        rotate: 'Rodar',
        delete: 'Eliminar',
        hint: 'Arraste as páginas para as ordenar (no telemóvel, mantenha uma premida e arraste). Clique para selecionar; com Shift seleciona um intervalo.',
        pagesAria: 'Páginas do documento',
        fileName: 'Nome do ficheiro',
        download: 'Transferir PDF',
        extract: 'Transferir páginas selecionadas',
        convert: 'Converter para Word',
        wordNote: 'O Word (.docx) abre no Word, no Pages e no Google Docs. Para converter, o PDF é enviado ao serviço de ferramentas da Elysium, que não o guarda.',
        summary: (pages, files, selected) => `${pages} página${pages === 1 ? '' : 's'} · ${files} PDF${selected ? ` · ${selected} selecionada${selected === 1 ? '' : 's'}` : ''}`,
        filePages: pages => `${pages} pág.`,
        protectedBadge: 'Protegido',
        removeFile: name => `Retirar ${name}`,
        pageLabel: (position, total, name, original) => `Página ${position} de ${total}: ${name}, página ${original}`,
        rotatePage: 'Rodar a página',
        deletePage: 'Eliminar a página',
        moveBefore: 'Mover para trás',
        moveAfter: 'Mover para a frente',
        mergedName: 'documento-unido',
        selectionSuffix: 'selecao',
        opening: 'A abrir os PDF…',
        building: 'A preparar o PDF…',
        saved: name => `Guardado: ${name}`,
        stages: {
            uploading: 'A enviar o PDF…',
            accepted: 'Recebido. A preparar…',
            starting: 'A preparar…',
            opening: 'A abrir o PDF…',
            analyzing: 'A analisar a paginação…',
            parsing: 'A ler as páginas…',
            creating: 'A escrever o documento Word…'
        },
        queued: position => `Em fila (${position})`,
        reading: (page, pages) => `A ler a página ${page} de ${pages}`,
        writing: (page, pages) => `A escrever a página ${page} de ${pages}`,
        converted: (size, time) => `Word pronto · ${size} · disponível até às ${time}`,
        save: 'Guardar',
        cancel: 'Cancelar',
        cancelled: 'Conversão cancelada.',
        scanned: 'Este PDF parece digitalizado: o Word terá as páginas como imagens, não texto editável.',
        detail: 'Detalhe técnico',
        untitled: 'documento',
        errors: {
            not_pdf: name => `${name} não é um PDF.`,
            too_large: (name, size) => `${name} tem mais de ${size}.`,
            password: name => `${name} tem palavra-passe. Retire-a e tente de novo.`,
            encrypted: name => `${name} está cifrado: as páginas veem-se, mas não podem ser copiadas para um PDF novo. Converta-o para Word tal como está ou retire primeiro a proteção.`,
            invalid: name => `Não foi possível abrir ${name}. Pode estar danificado.`,
            library: 'Não foi possível carregar as ferramentas de PDF. Verifique a ligação e tente de novo.',
            build: 'Não foi possível gerar o PDF.',
            empty: 'Não há páginas para guardar.',
            convert_too_large: size => `Para converter para Word, o PDF deve ter ${size} ou menos.`,
            pdf_encrypted: 'O PDF tem palavra-passe.',
            pdf_invalid: 'O serviço de ferramentas não conseguiu ler este PDF.',
            pdf_too_many_pages: 'O PDF tem demasiadas páginas para ser convertido (500 no máximo).',
            pdf_failed: 'Não foi possível converter o PDF para Word.',
            payload_too_large: 'O PDF é demasiado grande para ser convertido.',
            timeout: 'A conversão demorou demasiado. Tente com menos páginas.',
            engine_unavailable: 'O motor de conversão não está disponível no serviço de ferramentas.',
            tools_not_configured: 'O serviço de ferramentas ainda não está implementado, por isso a conversão para Word não está disponível.',
            tools_unreachable: 'O serviço de ferramentas não respondeu. Tente daqui a pouco.',
            unauthenticated: 'A sua sessão expirou. Inicie sessão de novo.',
            admin_required: 'Só os administradores podem usar as ferramentas.',
            connection: 'A ligação perdeu-se. Tente de novo.',
            failed: 'Não foi possível converter o PDF para Word.'
        }
    }
};

if (PUBLIC) PUBLIC.mergeCopy(COPY, PUBLIC.PDF_COPY);

const state = {
    files: new Map(),
    pages: [],
    history: [],
    anchor: null,
    busy: false,
    nameEdited: false,
    conversion: null,
    alert: null
};
const cards = new Map();
let _pdfjs = null;
let _pdfLib = null;
let _observer = null;
let _fileCounter = 0;
let _pageCounter = 0;
let _drag = null;

/* ── Utilidades ──────────────────────────────────────────────────────────── */

function lang() {
    const code = String(document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
    return COPY[code] ? code : 'en';
}

function copy() {
    return COPY[lang()];
}

function locale() {
    return document.documentElement.lang || 'en-GB';
}

function $(id) {
    return document.getElementById(id);
}

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
}

/** Tamaños como los da el Finder: múltiplos de 1000. */
function formatBytes(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value <= 0) return '';
    const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'];
    let unit = 0;
    let amount = value;
    while (amount >= 1000 && unit < units.length - 1) {
        amount /= 1000;
        unit += 1;
    }
    return new Intl.NumberFormat(locale(), {
        style: 'unit', unit: units[unit], unitDisplay: 'short', maximumFractionDigits: unit >= 2 ? 1 : 0
    }).format(amount);
}

function formatClock(timestamp) {
    return new Intl.DateTimeFormat(locale(), { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
}

function fileLetter(file) {
    return String.fromCharCode(65 + (file.order % 26));
}

function baseName(name) {
    return String(name || '').replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    // El navegador ya tiene el fichero; un minuto de margen por si lo lee tarde.
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function announce(message) {
    const element = $('pdf-announcer');
    if (element) element.textContent = message;
}

/* ── Librerías ───────────────────────────────────────────────────────────── */

function loadPdfJs() {
    _pdfjs ??= import(PDFJS_URL).then(module => {
        module.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        return module;
    }).catch(error => {
        _pdfjs = null;
        throw error;
    });
    return _pdfjs;
}

function loadPdfLib() {
    _pdfLib ??= new Promise((resolve, reject) => {
        if (window.PDFLib) {
            resolve(window.PDFLib);
            return;
        }
        const script = document.createElement('script');
        script.src = PDF_LIB_URL;
        script.async = true;
        script.onload = () => (window.PDFLib ? resolve(window.PDFLib) : reject(new Error('pdf-lib did not load')));
        script.onerror = () => reject(new Error('pdf-lib did not load'));
        document.head.append(script);
    }).catch(error => {
        _pdfLib = null;
        throw error;
    });
    return _pdfLib;
}

/* ── Abrir ───────────────────────────────────────────────────────────────── */

function isPdf(file) {
    return file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
}

async function openFile(pdfjs, file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    // pdf.js se queda con el buffer que recibe (lo pasa al worker): una copia.
    const task = pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false });
    let doc;
    try {
        doc = await task.promise;
    } catch (error) {
        throw Object.assign(new Error(error?.message || 'invalid'), { code: error?.name === 'PasswordException' ? 'password' : 'invalid' });
    }
    const info = await doc.getMetadata().then(meta => meta.info || {}).catch(() => ({}));
    return { bytes, doc, encrypted: Boolean(info.EncryptFilterName) };
}

async function addFiles(fileList) {
    const files = [...(fileList || [])];
    if (!files.length || state.busy) return;
    hideAlert();
    let pdfjs;
    try {
        pdfjs = await loadPdfJs();
    } catch {
        showAlert({ code: 'library' });
        return;
    }
    setBusy(true, copy().opening);
    const problems = [];
    const before = snapshot();
    let added = 0;
    try {
        for (const file of files) {
            if (!isPdf(file)) {
                problems.push({ code: 'not_pdf', name: file.name });
                continue;
            }
            if (file.size > MAX_FILE_BYTES) {
                problems.push({ code: 'too_large', name: file.name });
                continue;
            }
            try {
                const opened = await openFile(pdfjs, file);
                const id = `f${++_fileCounter}`;
                const entry = {
                    id,
                    name: file.name,
                    size: file.size,
                    order: state.files.size,
                    hue: FILE_HUES[state.files.size % FILE_HUES.length],
                    pageCount: opened.doc.numPages,
                    ...opened
                };
                state.files.set(id, entry);
                for (let index = 0; index < entry.pageCount; index += 1) {
                    state.pages.push({ id: `p${++_pageCounter}`, fileId: id, index, rotation: 0, selected: false });
                }
                if (entry.encrypted) problems.push({ code: 'encrypted', name: file.name });
                added += 1;
            } catch (error) {
                problems.push({ code: error.code || 'invalid', name: file.name });
            }
        }
    } finally {
        setBusy(false);
    }
    if (added) {
        pushHistory(before);
        if (!state.nameEdited) $('pdf-name').value = defaultName();
    }
    if (problems.length) showAlert({ problems });
    render();
}

function defaultName() {
    const used = usedFiles();
    if (used.length === 1) return baseName(used[0].name) || copy().untitled;
    return used.length ? copy().mergedName : '';
}

/** Los ficheros que aún tienen alguna página en el documento, en su orden. */
function usedFiles() {
    const ids = new Set(state.pages.map(page => page.fileId));
    return [...state.files.values()].filter(file => ids.has(file.id)).sort((left, right) => left.order - right.order);
}

/* ── Historial ───────────────────────────────────────────────────────────── */

function snapshot() {
    return state.pages.map(page => ({ ...page }));
}

function pushHistory(before) {
    state.history.push(before);
    if (state.history.length > MAX_HISTORY) state.history.shift();
}

/** Cambia el documento guardando el estado anterior para «Deshacer». */
function change(mutator) {
    const before = snapshot();
    mutator();
    pushHistory(before);
    render();
}

function undo() {
    const previous = state.history.pop();
    if (!previous) return;
    state.pages = previous;
    render();
}

/* ── Operaciones sobre páginas ───────────────────────────────────────────── */

function selectedPages() {
    return state.pages.filter(page => page.selected);
}

function rotatePages(ids) {
    const targets = new Set(ids);
    change(() => {
        state.pages.forEach(page => {
            if (targets.has(page.id)) page.rotation = (page.rotation + 90) % 360;
        });
    });
}

function deletePages(ids) {
    const targets = new Set(ids);
    change(() => {
        state.pages = state.pages.filter(page => !targets.has(page.id));
    });
}

/** Mueve un grupo de páginas para que empiece en `target` (posición sin ellas). */
function movePages(ids, target) {
    const moving = state.pages.filter(page => ids.includes(page.id));
    if (!moving.length) return;
    change(() => {
        const rest = state.pages.filter(page => !ids.includes(page.id));
        const at = Math.max(0, Math.min(target, rest.length));
        state.pages = [...rest.slice(0, at), ...moving, ...rest.slice(at)];
    });
}

function moveBy(id, offset) {
    const index = state.pages.findIndex(page => page.id === id);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= state.pages.length) return;
    movePages([id], target);
    focusCard(id);
}

function toggleSelection(id, { range = false } = {}) {
    const index = state.pages.findIndex(page => page.id === id);
    if (index < 0) return;
    if (range && state.anchor) {
        const anchor = state.pages.findIndex(page => page.id === state.anchor);
        if (anchor >= 0) {
            const [from, to] = anchor < index ? [anchor, index] : [index, anchor];
            state.pages.forEach((page, position) => {
                if (position >= from && position <= to) page.selected = true;
            });
            render();
            return;
        }
    }
    state.pages[index].selected = !state.pages[index].selected;
    state.anchor = id;
    render();
}

function setAllSelected(selected) {
    state.pages.forEach(page => { page.selected = selected; });
    render();
}

function removeFile(fileId) {
    change(() => {
        state.pages = state.pages.filter(page => page.fileId !== fileId);
    });
    if (!state.nameEdited) $('pdf-name').value = defaultName();
}

function reset() {
    state.conversion?.controller?.abort();
    for (const file of state.files.values()) file.doc?.destroy?.();
    state.files.clear();
    state.pages = [];
    state.history = [];
    state.anchor = null;
    state.nameEdited = false;
    state.conversion = null;
    cards.forEach(card => _observer?.unobserve(card));
    cards.clear();
    $('pdf-pages').innerHTML = '';
    $('pdf-name').value = '';
    hideAlert();
    render();
    renderConversion();
}

/* ── Construir el PDF ────────────────────────────────────────────────────── */

/** ¿El documento es exactamente uno de los ficheros, sin tocar? */
function untouchedFile(pages) {
    const file = state.files.get(pages[0]?.fileId);
    if (!file || pages.length !== file.pageCount) return null;
    return pages.every((page, position) => page.fileId === file.id && page.index === position && !page.rotation) ? file : null;
}

async function buildPdf(pages) {
    const untouched = untouchedFile(pages);
    if (untouched) return untouched.bytes;
    const { PDFDocument, degrees } = await loadPdfLib();
    const output = await PDFDocument.create();
    const copied = new Map();
    for (const file of usedFiles()) {
        const indices = [...new Set(pages.filter(page => page.fileId === file.id).map(page => page.index))];
        if (!indices.length) continue;
        let source;
        try {
            source = await PDFDocument.load(file.bytes, { updateMetadata: false });
        } catch (error) {
            const encrypted = /encrypt/i.test(`${error?.name} ${error?.message}`);
            throw Object.assign(new Error(error?.message || 'build'), { code: encrypted ? 'encrypted' : 'build', name: file.name });
        }
        const result = await output.copyPages(source, indices);
        copied.set(file.id, new Map(indices.map((index, position) => [index, result[position]])));
    }
    for (const page of pages) {
        const copy = copied.get(page.fileId)?.get(page.index);
        if (!copy) continue;
        if (page.rotation) copy.setRotation(degrees((copy.getRotation().angle + page.rotation) % 360));
        output.addPage(copy);
    }
    output.setTitle(baseName($('pdf-name').value) || copy().untitled);
    output.setCreator('Elysium CRM');
    output.setProducer('Elysium λ Development & Research');
    return output.save();
}

function exportName(suffix = '') {
    const name = baseName($('pdf-name').value) || defaultName() || copy().untitled;
    return `${name}${suffix ? `-${suffix}` : ''}`;
}

async function downloadPdf({ selectionOnly = false } = {}) {
    const pages = selectionOnly ? selectedPages() : state.pages;
    if (!pages.length) {
        showAlert({ code: 'empty' });
        return;
    }
    hideAlert();
    setBusy(true, copy().building);
    try {
        const bytes = await buildPdf(pages);
        const name = `${exportName(selectionOnly ? copy().selectionSuffix : '')}.pdf`;
        saveBlob(new Blob([bytes], { type: 'application/pdf' }), name);
        announce(copy().saved(name));
    } catch (error) {
        showAlert(error?.code === 'encrypted' ? { code: 'encrypted', name: error.name } : { code: error?.message?.includes('pdf-lib') ? 'library' : 'build', detail: error?.message });
    } finally {
        setBusy(false);
    }
}

/* ── Convertir a Word ────────────────────────────────────────────────────── */

function conversionError(payload = {}, status = 0) {
    const code = payload.code
        || (status === 401 ? 'unauthenticated' : status === 403 ? 'admin_required' : status === 413 ? 'payload_too_large' : 'failed');
    return Object.assign(new Error(payload.error || code), { code, detail: payload.detail || null });
}

async function readEvents(response, onEvent) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const flush = line => {
        if (!line.trim()) return;
        try {
            onEvent(JSON.parse(line));
        } catch {
            // Una línea rota no tumba la conversión: la siguiente trae el estado.
        }
    };
    for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let index;
        while ((index = buffer.indexOf('\n')) >= 0) {
            flush(buffer.slice(0, index));
            buffer = buffer.slice(index + 1);
        }
    }
    flush(buffer + decoder.decode());
}

async function convertToWord() {
    if (!state.pages.length) {
        showAlert({ code: 'empty' });
        return;
    }
    if (state.conversion?.state === 'running') return;
    hideAlert();
    const conversion = { state: 'running', stage: 'uploading', controller: new AbortController(), warning: null };
    state.conversion = conversion;
    renderConversion();
    try {
        const bytes = await buildPdf(state.pages);
        if (bytes.byteLength > CONVERT_MAX_BYTES) {
            throw Object.assign(new Error('too large'), { code: 'convert_too_large' });
        }
        const headers = { 'Content-Type': 'application/pdf' };
        if (PUBLIC) {
            // Sin sesión: la conversión lleva su propio token de Turnstile.
            headers['X-Turnstile-Token'] = await PUBLIC.humanToken({ signal: conversion.controller.signal });
        } else {
            const user = (await authReady)?.currentUser;
            if (!user) throw conversionError({ code: 'unauthenticated' }, 401);
            headers.Authorization = `Bearer ${await user.getIdToken()}`;
        }
        const name = exportName();
        const response = await fetch(`${CONVERT_URL}?name=${encodeURIComponent(name)}`, {
            method: 'POST',
            headers,
            body: new Blob([bytes], { type: 'application/pdf' }),
            cache: 'no-store',
            signal: conversion.controller.signal
        });
        if (!response.ok) throw conversionError(await response.json().catch(() => ({})), response.status);
        await readEvents(response, event => handleConversionEvent(conversion, event));
        if (conversion.state === 'running') {
            conversion.state = 'error';
            conversion.error = { code: 'connection' };
        }
    } catch (error) {
        if (conversion.controller.signal.aborted) {
            conversion.state = 'cancelled';
        } else {
            conversion.state = 'error';
            const code = error?.code || (error?.name === 'TypeError' ? 'connection' : 'failed');
            conversion.error = code === 'encrypted' ? { code, name: error.name } : { code, detail: error?.detail || null };
        }
    } finally {
        renderConversion();
    }
}

function handleConversionEvent(conversion, event) {
    switch (event?.type) {
        case 'accepted':
        case 'stage':
            conversion.stage = event.type === 'accepted' ? 'accepted' : event.stage;
            break;
        case 'queued':
            conversion.stage = 'queued';
            conversion.position = event.position;
            break;
        case 'progress':
            conversion.progress = event;
            break;
        case 'warning':
            if (event.code === 'scanned') conversion.warning = 'scanned';
            break;
        case 'ready':
            conversion.state = 'ready';
            conversion.file = event.file;
            conversion.expiresAt = Date.parse(event.expiresAt) || Date.now() + 15 * 60 * 1000;
            saveRemote(event.file);
            announce(copy().saved(event.file.name));
            break;
        case 'error':
            conversion.state = 'error';
            conversion.error = { code: event.code, detail: event.detail || null };
            break;
        default:
            return;
    }
    renderConversion();
}

function saveRemote(file) {
    if (!file?.url) return;
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
}

/* ── Pintar ──────────────────────────────────────────────────────────────── */

function errorText(error = {}) {
    const text = copy();
    const entry = text.errors[error.code] || text.errors.failed;
    if (typeof entry !== 'function') return entry;
    if (error.code === 'too_large') return entry(error.name, formatBytes(MAX_FILE_BYTES));
    if (error.code === 'convert_too_large') return entry(formatBytes(CONVERT_MAX_BYTES));
    return entry(error.name || '');
}

function showAlert(alert) {
    state.alert = alert;
    const element = $('pdf-alert');
    if (!element) return;
    const problems = alert.problems || [alert];
    const detail = alert.detail
        ? `<details class="tools-alert-detail"><summary>${esc(copy().detail)}</summary><code translate="no">${esc(alert.detail)}</code></details>`
        : '';
    element.className = `portal-alert ${problems.every(problem => problem.code === 'encrypted') ? 'is-warning' : 'is-error'}`;
    element.innerHTML = `${problems.map(problem => `<p>${esc(errorText(problem))}</p>`).join('')}${detail}`;
    element.hidden = false;
}

function hideAlert() {
    state.alert = null;
    const element = $('pdf-alert');
    if (element) element.hidden = true;
}

function setBusy(busy, message = '') {
    state.busy = busy;
    const status = $('pdf-busy');
    if (status) {
        status.hidden = !busy;
        status.textContent = message;
    }
    updateControls();
}

function updateControls() {
    const hasPages = state.pages.length > 0;
    const selected = selectedPages().length;
    const converting = state.conversion?.state === 'running';
    const set = (id, disabled) => {
        const element = $(id);
        if (element) element.disabled = disabled;
    };
    set('pdf-undo', state.busy || !state.history.length);
    set('pdf-select-all', state.busy || !hasPages);
    set('pdf-rotate-selected', state.busy || !selected);
    set('pdf-delete-selected', state.busy || !selected);
    set('pdf-download', state.busy || !hasPages);
    set('pdf-extract', state.busy || !selected);
    set('pdf-convert', state.busy || !hasPages || converting);
    const selectAll = $('pdf-select-all');
    if (selectAll) selectAll.textContent = hasPages && selected === state.pages.length ? copy().selectNone : copy().selectAll;
}

function renderFiles() {
    const list = $('pdf-files');
    if (!list) return;
    const text = copy();
    list.innerHTML = usedFiles().map(file => {
        const pages = state.pages.filter(page => page.fileId === file.id).length;
        return `<li class="pdf-file" style="--file-hue: ${file.hue}">
            <span class="pdf-file-letter" aria-hidden="true">${fileLetter(file)}</span>
            <span class="pdf-file-name" translate="no">${esc(file.name)}</span>
            <span class="pdf-file-pages">${esc(text.filePages(pages))}</span>
            ${file.encrypted ? `<span class="pdf-file-badge">${esc(text.protectedBadge)}</span>` : ''}
            <button type="button" class="pdf-file-remove" data-remove-file="${esc(file.id)}" aria-label="${esc(text.removeFile(file.name))}" title="${esc(text.removeFile(file.name))}">×</button>
        </li>`;
    }).join('');
}

function cardMarkup() {
    const text = copy();
    return `<div class="pdf-page-sheet"><canvas aria-hidden="true"></canvas></div>
        <div class="pdf-page-meta"><span class="pdf-page-number" translate="no"></span><span class="pdf-page-source" translate="no"></span></div>
        <div class="pdf-page-tools">
            <button type="button" data-page-action="before" aria-label="${esc(text.moveBefore)}" title="${esc(text.moveBefore)}">‹</button>
            <button type="button" data-page-action="rotate" aria-label="${esc(text.rotatePage)}" title="${esc(text.rotatePage)}">↻</button>
            <button type="button" data-page-action="delete" aria-label="${esc(text.deletePage)}" title="${esc(text.deletePage)}">×</button>
            <button type="button" data-page-action="after" aria-label="${esc(text.moveAfter)}" title="${esc(text.moveAfter)}">›</button>
        </div>
        <span class="pdf-page-check" aria-hidden="true">✓</span>`;
}

function updateCard(card, page, position, total) {
    const file = state.files.get(page.fileId);
    card.classList.toggle('is-selected', page.selected);
    card.style.setProperty('--file-hue', file.hue);
    card.setAttribute('aria-selected', page.selected ? 'true' : 'false');
    card.setAttribute('aria-label', copy().pageLabel(position + 1, total, file.name, page.index + 1));
    card.querySelector('.pdf-page-number').textContent = String(position + 1);
    card.querySelector('.pdf-page-source').textContent = `${fileLetter(file)} · ${page.index + 1}`;
    if (card.dataset.renderedRotation !== undefined && Number(card.dataset.renderedRotation) !== page.rotation) {
        card.dataset.renderedRotation = '';
        delete card.dataset.renderedRotation;
        if (card.dataset.visible === 'true') renderThumbnail(card, page);
    }
}

function render() {
    const hasPages = state.pages.length > 0;
    $('pdf-start').hidden = hasPages;
    $('pdf-editor').hidden = !hasPages;
    const list = $('pdf-pages');
    const alive = new Set(state.pages.map(page => page.id));
    for (const [id, card] of cards) {
        if (alive.has(id)) continue;
        _observer?.unobserve(card);
        card.remove();
        cards.delete(id);
    }
    state.pages.forEach((page, position) => {
        let card = cards.get(page.id);
        if (!card) {
            card = document.createElement('li');
            card.className = 'pdf-page';
            card.tabIndex = 0;
            card.dataset.pageId = page.id;
            card.setAttribute('role', 'option');
            card.innerHTML = cardMarkup();
            cards.set(page.id, card);
            _observer?.observe(card);
        }
        updateCard(card, page, position, state.pages.length);
        list.append(card);
    });
    const files = usedFiles().length;
    $('pdf-summary').textContent = hasPages ? copy().summary(state.pages.length, files, selectedPages().length) : '';
    renderFiles();
    updateControls();
}

/* Miniaturas: se pintan al entrar en pantalla, dos a la vez, y se repintan
   solo si cambia el giro. */
const _renderQueue = [];
let _rendering = 0;

function renderThumbnail(card, page) {
    if (!_renderQueue.some(item => item.card === card)) _renderQueue.push({ card, page });
    pumpThumbnails();
}

function pumpThumbnails() {
    while (_rendering < 2 && _renderQueue.length) {
        const { card } = _renderQueue.shift();
        const page = state.pages.find(candidate => candidate.id === card.dataset.pageId);
        if (!page || !card.isConnected) continue;
        _rendering += 1;
        drawThumbnail(card, page).finally(() => {
            _rendering -= 1;
            pumpThumbnails();
        });
    }
}

async function drawThumbnail(card, page) {
    const file = state.files.get(page.fileId);
    if (!file?.doc) return;
    const rotation = page.rotation;
    try {
        const pdfPage = await file.doc.getPage(page.index + 1);
        const angle = (pdfPage.rotate + rotation) % 360;
        const base = pdfPage.getViewport({ scale: 1, rotation: angle });
        const ratio = Math.min(2, window.devicePixelRatio || 1);
        const viewport = pdfPage.getViewport({ scale: (THUMB_WIDTH * ratio) / base.width, rotation: angle });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        canvas.setAttribute('aria-hidden', 'true');
        await pdfPage.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
        const current = state.pages.find(candidate => candidate.id === page.id);
        if (!current || current.rotation !== rotation) return;
        card.querySelector('.pdf-page-sheet').replaceChildren(canvas);
        card.dataset.renderedRotation = String(rotation);
    } catch {
        // Una página que pdf.js no sabe pintar se queda en blanco; se exporta igual.
        card.dataset.renderedRotation = String(rotation);
    }
}

function ensureObserver() {
    if (_observer || !('IntersectionObserver' in window)) return;
    _observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
            const card = entry.target;
            card.dataset.visible = entry.isIntersecting ? 'true' : 'false';
            if (!entry.isIntersecting || card.dataset.renderedRotation !== undefined) continue;
            const page = state.pages.find(candidate => candidate.id === card.dataset.pageId);
            if (page) renderThumbnail(card, page);
        }
    }, { rootMargin: '600px 0px' });
}

function renderConversion() {
    const element = $('pdf-status');
    if (!element) return;
    const conversion = state.conversion;
    element.hidden = !conversion;
    if (!conversion) {
        updateControls();
        return;
    }
    const text = copy();
    let status = '';
    let actions = '';
    let bar = '';
    if (conversion.state === 'running') {
        const progress = conversion.progress;
        if (conversion.stage === 'queued') status = text.queued(conversion.position || 1);
        else if (progress?.page && progress.pages) status = progress.stage === 'creating' ? text.writing(progress.page, progress.pages) : text.reading(progress.page, progress.pages);
        else status = text.stages[conversion.stage] || text.stages.starting;
        const percent = Number.isFinite(progress?.percent) ? progress.percent : null;
        bar = `<div class="tools-job-bar${percent === null ? ' is-indeterminate' : ''}" role="progressbar" aria-label="${esc(text.convert)}" aria-valuemin="0" aria-valuemax="100"${percent === null ? '' : ` aria-valuenow="${percent}"`}><span style="width: ${percent ?? 0}%"></span></div>`;
        actions = `<button type="button" class="btn btn-secondary tools-btn-compact" data-conversion-action="cancel">${esc(text.cancel)}</button>`;
    } else if (conversion.state === 'ready') {
        const expired = conversion.expiresAt <= Date.now();
        status = expired ? text.errors.failed : text.converted(formatBytes(conversion.file.bytes), formatClock(conversion.expiresAt));
        if (!expired) actions = `<a class="btn btn-primary tools-btn-compact" href="${esc(conversion.file.url)}" download="${esc(conversion.file.name)}">${esc(text.save)}</a>`;
    } else if (conversion.state === 'cancelled') {
        status = text.cancelled;
    } else {
        status = errorText(conversion.error);
    }
    const warning = conversion.warning === 'scanned' ? `<p class="pdf-status-warning">${esc(text.scanned)}</p>` : '';
    const detail = conversion.state === 'error' && conversion.error?.detail
        ? `<details class="tools-alert-detail"><summary>${esc(text.detail)}</summary><code translate="no">${esc(conversion.error.detail)}</code></details>`
        : '';
    element.className = `pdf-status is-${conversion.state}`;
    element.innerHTML = `<div class="pdf-status-body"><strong class="pdf-status-title">${esc(text.convert)}</strong>${bar}<p class="pdf-status-text">${esc(status)}</p>${warning}${detail}</div><div class="pdf-status-actions">${actions}</div>`;
    updateControls();
}

function focusCard(id) {
    window.requestAnimationFrame(() => cards.get(id)?.focus());
}

/* ── Arrastrar para ordenar ──────────────────────────────────────────────── */

function dropTarget(clientX, clientY) {
    const card = document.elementFromPoint(clientX, clientY)?.closest?.('.pdf-page');
    if (!card || !cards.has(card.dataset.pageId)) return null;
    const rect = card.getBoundingClientRect();
    return { card, before: clientX < rect.left + rect.width / 2 };
}

function clearDropMarkers() {
    document.querySelectorAll('.pdf-page.is-drop-before, .pdf-page.is-drop-after')
        .forEach(card => card.classList.remove('is-drop-before', 'is-drop-after'));
}

function startDrag() {
    const drag = _drag;
    const page = state.pages.find(candidate => candidate.id === drag.id);
    if (!page) return;
    drag.active = true;
    // Arrastrar una página seleccionada mueve toda la selección.
    drag.ids = page.selected ? selectedPages().map(candidate => candidate.id) : [page.id];
    drag.ids.forEach(id => cards.get(id)?.classList.add('is-dragging'));
    const ghost = drag.card.cloneNode(true);
    ghost.className = 'pdf-page pdf-drag-ghost';
    ghost.removeAttribute('tabindex');
    ghost.setAttribute('aria-hidden', 'true');
    const original = drag.card.querySelector('canvas');
    const clone = ghost.querySelector('canvas');
    if (original && clone) {
        clone.width = original.width;
        clone.height = original.height;
        clone.getContext('2d')?.drawImage(original, 0, 0);
    }
    if (drag.ids.length > 1) ghost.dataset.count = String(drag.ids.length);
    const rect = drag.card.getBoundingClientRect();
    drag.offsetX = drag.startX - rect.left;
    drag.offsetY = drag.startY - rect.top;
    ghost.style.width = `${rect.width}px`;
    document.body.append(ghost);
    drag.ghost = ghost;
    document.body.classList.add('pdf-is-dragging');
}

function moveGhost(clientX, clientY) {
    const drag = _drag;
    drag.ghost.style.transform = `translate(${clientX - drag.offsetX}px, ${clientY - drag.offsetY}px)`;
    clearDropMarkers();
    const target = dropTarget(clientX, clientY);
    drag.target = target;
    if (target && !drag.ids.includes(target.card.dataset.pageId)) {
        target.card.classList.add(target.before ? 'is-drop-before' : 'is-drop-after');
    }
    // Cerca de los bordes, la página se desplaza sola.
    const scroller = $('portal-main') || document.scrollingElement;
    const edge = 72;
    const bounds = scroller === document.scrollingElement ? { top: 0, bottom: window.innerHeight } : scroller.getBoundingClientRect();
    if (clientY < bounds.top + edge) scroller.scrollBy(0, -14);
    else if (clientY > bounds.bottom - edge) scroller.scrollBy(0, 14);
}

function endDrag(commit) {
    const drag = _drag;
    _drag = null;
    window.clearTimeout(drag?.timer);
    if (!drag?.active) return;
    drag.ghost?.remove();
    document.body.classList.remove('pdf-is-dragging');
    drag.ids.forEach(id => cards.get(id)?.classList.remove('is-dragging'));
    clearDropMarkers();
    const target = drag.target;
    if (!commit || !target || drag.ids.includes(target.card.dataset.pageId)) return;
    const rest = state.pages.filter(page => !drag.ids.includes(page.id));
    const position = rest.findIndex(page => page.id === target.card.dataset.pageId);
    movePages(drag.ids, position + (target.before ? 0 : 1));
}

function onPointerDown(event) {
    if (event.button !== 0 || event.target.closest('button') || state.busy) return;
    const card = event.target.closest('.pdf-page');
    if (!card) return;
    _drag = {
        id: card.dataset.pageId,
        card,
        startX: event.clientX,
        startY: event.clientY,
        pointerId: event.pointerId,
        touch: event.pointerType === 'touch',
        active: false,
        moved: false
    };
    if (_drag.touch) {
        // En pantallas táctiles se arrastra tras mantener pulsado: así el gesto
        // normal sigue desplazando la página.
        _drag.timer = window.setTimeout(() => {
            if (_drag && !_drag.moved) {
                startDrag();
                moveGhost(_drag.startX, _drag.startY);
                navigator.vibrate?.(12);
            }
        }, LONG_PRESS_MS);
    }
}

function onPointerMove(event) {
    const drag = _drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.active) {
        if (distance < 6) return;
        drag.moved = true;
        if (drag.touch) return;
        startDrag();
    }
    event.preventDefault();
    moveGhost(event.clientX, event.clientY);
}

function onPointerUp(event) {
    const drag = _drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (drag.active) {
        endDrag(true);
        return;
    }
    _drag = null;
    window.clearTimeout(drag.timer);
    if (!drag.moved) toggleSelection(drag.id, { range: event.shiftKey });
}

/* ── Texto y arranque ────────────────────────────────────────────────────── */

function applyCopy() {
    const text = copy();
    const values = {
        'pdf-drop-title': text.dropTitle,
        'pdf-drop-text': text.dropText,
        'pdf-choose-label': text.choose,
        'pdf-privacy': text.privacy,
        'pdf-add-label': text.add,
        'pdf-undo': text.undo,
        'pdf-reset': text.reset,
        'pdf-rotate-selected': text.rotate,
        'pdf-delete-selected': text.delete,
        'pdf-hint': text.hint,
        'pdf-name-label': text.fileName,
        'pdf-download': text.download,
        'pdf-extract': text.extract,
        'pdf-convert': text.convert,
        'pdf-word-note': text.wordNote,
        'pdf-dropping': text.dropping
    };
    for (const [id, value] of Object.entries(values)) {
        const element = $(id);
        if (element) element.textContent = value;
    }
    $('pdf-pages')?.setAttribute('aria-label', text.pagesAria);
    // Los botones de cada página llevan su texto dentro: se rehacen.
    cards.forEach(card => {
        const canvas = card.querySelector('canvas');
        card.innerHTML = cardMarkup();
        if (canvas) card.querySelector('.pdf-page-sheet').replaceChildren(canvas);
    });
    if (state.files.size && !state.nameEdited) $('pdf-name').value = defaultName();
    render();
    renderConversion();
    if (state.alert) showAlert(state.alert);
}

function bindPdfUi() {
    const panel = $('tools-panel-pdf');
    const list = $('pdf-pages');
    if (!panel || !list) return;
    ensureObserver();

    $('pdf-file-input').addEventListener('change', event => {
        addFiles(event.target.files);
        event.target.value = '';
    });
    $('pdf-add-input').addEventListener('change', event => {
        addFiles(event.target.files);
        event.target.value = '';
    });

    // Soltar PDF en cualquier punto del panel.
    let depth = 0;
    const hasFiles = event => [...(event.dataTransfer?.types || [])].includes('Files');
    panel.addEventListener('dragenter', event => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        depth += 1;
        panel.classList.add('is-dropping');
    });
    panel.addEventListener('dragover', event => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });
    panel.addEventListener('dragleave', event => {
        if (!hasFiles(event)) return;
        depth = Math.max(0, depth - 1);
        if (!depth) panel.classList.remove('is-dropping');
    });
    panel.addEventListener('drop', event => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        depth = 0;
        panel.classList.remove('is-dropping');
        addFiles(event.dataTransfer.files);
    });

    $('pdf-undo').addEventListener('click', undo);
    $('pdf-reset').addEventListener('click', reset);
    $('pdf-select-all').addEventListener('click', () => setAllSelected(selectedPages().length !== state.pages.length));
    $('pdf-rotate-selected').addEventListener('click', () => rotatePages(selectedPages().map(page => page.id)));
    $('pdf-delete-selected').addEventListener('click', () => deletePages(selectedPages().map(page => page.id)));
    $('pdf-download').addEventListener('click', () => downloadPdf());
    $('pdf-extract').addEventListener('click', () => downloadPdf({ selectionOnly: true }));
    $('pdf-convert').addEventListener('click', convertToWord);
    $('pdf-name').addEventListener('input', () => { state.nameEdited = true; });
    $('pdf-files').addEventListener('click', event => {
        const button = event.target.closest('[data-remove-file]');
        if (button) removeFile(button.dataset.removeFile);
    });
    $('pdf-status').addEventListener('click', event => {
        if (event.target.closest('[data-conversion-action="cancel"]')) state.conversion?.controller?.abort();
    });

    list.addEventListener('click', event => {
        const button = event.target.closest('[data-page-action]');
        const card = event.target.closest('.pdf-page');
        if (!button || !card) return;
        const id = card.dataset.pageId;
        const action = button.dataset.pageAction;
        if (action === 'rotate') rotatePages([id]);
        else if (action === 'delete') deletePages([id]);
        else if (action === 'before') moveBy(id, -1);
        else if (action === 'after') moveBy(id, 1);
    });
    list.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', () => endDrag(false));
    // Mientras se arrastra con el dedo, el desplazamiento de la página se frena.
    document.addEventListener('touchmove', event => {
        if (_drag?.active) event.preventDefault();
    }, { passive: false });

    list.addEventListener('keydown', event => {
        const card = event.target.closest('.pdf-page');
        if (!card || event.target !== card) return;
        const id = card.dataset.pageId;
        const index = state.pages.findIndex(page => page.id === id);
        const modifier = event.altKey || event.metaKey || event.ctrlKey;
        if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && modifier) {
            event.preventDefault();
            moveBy(id, event.key === 'ArrowLeft' ? -1 : 1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            const next = state.pages[index + (event.key === 'ArrowLeft' ? -1 : 1)];
            if (next) focusCard(next.id);
        } else if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            toggleSelection(id, { range: event.shiftKey });
            focusCard(id);
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault();
            const targets = state.pages[index].selected ? selectedPages().map(page => page.id) : [id];
            const neighbour = state.pages.find((page, position) => position > index && !targets.includes(page.id))
                || [...state.pages].reverse().find((page, position) => state.pages.length - 1 - position < index && !targets.includes(page.id));
            deletePages(targets);
            if (neighbour) focusCard(neighbour.id);
        } else if (event.key.toLowerCase() === 'r' && !modifier) {
            event.preventDefault();
            rotatePages(state.pages[index].selected ? selectedPages().map(page => page.id) : [id]);
        }
    });
    panel.addEventListener('keydown', event => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !event.shiftKey && event.target.tagName !== 'INPUT') {
            event.preventDefault();
            undo();
        }
    });

    document.addEventListener('elysium:language', () => queueMicrotask(applyCopy));
}

function start() {
    bindPdfUi();
    applyCopy();
}

// En modo público el `await` del principio hace que el módulo acabe de
// evaluarse después de DOMContentLoaded (el documento ya está leído): se
// arranca sin esperarlo, o no arrancaría nunca.
if (PUBLIC) start();
else document.addEventListener('DOMContentLoaded', start);
