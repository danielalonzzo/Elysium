/**
 * Herramientas del CRM — «Documento de identidad»: las dos caras de una
 * cédula, un DNI o un Cartão de Cidadão en una sola hoja PDF.
 *
 * Quien lo usa sube una foto de cada cara. `id-card-scan.js` encuentra la
 * tarjeta en cada foto, la endereza y la recorta con sus esquinas
 * redondeadas; aquí se dibuja, se dejan corregir las esquinas a mano (con
 * lupa, y con las flechas del teclado) y se escribe el PDF con pdf-lib: a
 * tamaño real, 85,6 × 54 mm, sobre una hoja blanca A4 o carta.
 *
 * Todo ocurre en el navegador. Las fotos de un documento de identidad no
 * salen nunca del dispositivo, ni en el CRM ni en tools.elysiumdr.eu: por eso
 * esta herramienta no pasa por Turnstile ni por el servicio de herramientas.
 *
 * Vive dentro de la pestaña PDF. `admin-pdf.js` lleva el selector entre el
 * editor y esta herramienta, y abre en el editor el PDF que se le pase con
 * el evento `elysium:pdf-open`.
 *
 * Las fotos se pintan en <canvas>, nunca en <img> con una URL `blob:`: la CSP
 * del CRM no las admite en `img-src`.
 *
 * Los textos de admin.html llevan su clave en `data-idcard` (y
 * `data-idcard-label` o `data-idcard-placeholder` para los atributos); los
 * escribe `applyCopy()` con el idioma de `<html lang>`, y
 * `scripts/build-tools.mjs` hace lo mismo al generar las páginas públicas.
 */

const PDF_LIB_URL = '/JS/vendor/pdf-lib-1.17.1/pdf-lib.min.js';
const MAX_PHOTO_BYTES = 40 * 1000 * 1000;
/** La foto con la que se detecta y se endereza; la tarjeta queda casi a 1:1. */
const WORK_SIDE = 2560;
/** La que se ve en pantalla y en la lupa. */
const VIEW_SIDE = 1400;
/** Resolución de la tarjeta en el PDF: ≈ 475 ppp a tamaño real, 317 al ampliarla. */
const PRINT_PX_PER_MM = 1600 / 85.6;
const PREVIEW_PX_PER_MM = 6;
const LARGE_SCALE = 1.5;
const LOUPE_ZOOM = 3;
const OPTIONS_KEY = 'elysium.idcard.options';
const SIDES = ['front', 'back'];
const IMAGE_NAME = /\.(jpe?g|png|webp|heic|heif|avif|gif|bmp|tiff?)$/i;

const COPY = {
    en: {
        title: 'Both sides of your ID on one page',
        lead: 'Upload a photo of the front and one of the back. Each side is found, straightened and cut out, then placed at real size on a blank page, ready to send.',
        front: 'Front',
        back: 'Back',
        dropFront: 'Drop the photo of the front here',
        dropBack: 'Drop the photo of the back here',
        choose: 'Choose photo',
        formats: 'JPG, PNG, HEIC or WebP. On a phone you can take the photo now.',
        swap: 'Swap front and back',
        tips: 'For the best result, lay the document on a plain surface of another colour, with even light and no glare, and take the photo from above.',
        sheetAria: 'Preview of the page',
        sheet: 'Paper',
        letter: 'Letter',
        size: 'Size',
        real: 'Real size',
        large: 'Larger',
        tone: 'Image',
        color: 'Colour',
        gray: 'Black and white',
        light: 'Fix light and contrast',
        watermark: 'Watermark (optional)',
        watermarkPlaceholder: 'For example: Only for the job application at…',
        watermarkNote: 'A line of text across each side, so the copy cannot be reused for anything else.',
        fileName: 'File name',
        download: 'Download PDF',
        toEditor: 'Open in the PDF editor',
        reset: 'Start over',
        privacy: 'The photos are processed in this browser: they never leave your device.',
        defaultName: 'id-card',
        pdfTitle: 'Identity document',
        searching: 'Finding the document…',
        found: 'Document found. If an edge is off, drag the corners.',
        notFound: 'The edges were not found: drag the four corners onto the corners of the document.',
        cut: 'Part of the document is outside the photo. Take it again with the whole document in view.',
        edited: 'Corners adjusted by hand.',
        rotate: 'Rotate',
        detect: 'Detect again',
        replace: 'Change photo',
        remove: 'Remove',
        photo: side => `Photo of the ${side.toLowerCase()}`,
        corners: ['Top-left corner', 'Top-right corner', 'Bottom-right corner', 'Bottom-left corner'],
        cornerHelp: 'drag it, or move it with the arrow keys',
        summary: (front, back) => (front && back ? 'Front and back ready'
            : front ? 'Front ready · add the back'
                : back ? 'Back ready · add the front'
                    : 'Add the photos of both sides'),
        building: 'Preparing the PDF…',
        saved: name => `Saved: ${name}`,
        opened: 'The PDF is open in the editor.',
        errors: {
            not_image: name => `${name} is not a photo.`,
            too_large: (name, size) => `${name} is larger than ${size}.`,
            unreadable: name => `${name} could not be opened in this browser. Try a JPG or PNG photo.`,
            library: 'The tool could not be loaded. Check the connection and try again.',
            build: 'The PDF could not be generated.',
            empty: 'Add the photo of at least one side.'
        }
    },
    es: {
        title: 'Las dos caras de tu documento en una hoja',
        lead: 'Sube una foto del frente y otra del reverso. Cada cara se detecta, se endereza y se recorta, y queda a tamaño real sobre una hoja en blanco, lista para enviar.',
        front: 'Frente',
        back: 'Reverso',
        dropFront: 'Suelta aquí la foto del frente',
        dropBack: 'Suelta aquí la foto del reverso',
        choose: 'Elegir foto',
        formats: 'JPG, PNG, HEIC o WebP. En el teléfono puedes tomarla ahora.',
        swap: 'Intercambiar frente y reverso',
        tips: 'Para el mejor resultado, apoya el documento sobre una superficie lisa de otro color, con luz pareja y sin reflejos, y toma la foto desde arriba.',
        sheetAria: 'Vista previa de la hoja',
        sheet: 'Hoja',
        letter: 'Carta',
        size: 'Tamaño',
        real: 'Tamaño real',
        large: 'Más grande',
        tone: 'Imagen',
        color: 'Color',
        gray: 'Blanco y negro',
        light: 'Corregir luz y contraste',
        watermark: 'Marca de agua (opcional)',
        watermarkPlaceholder: 'Por ejemplo: Solo para la solicitud de empleo en…',
        watermarkNote: 'Una línea de texto sobre cada cara, para que la copia no sirva para otra cosa.',
        fileName: 'Nombre del archivo',
        download: 'Descargar PDF',
        toEditor: 'Abrir en el editor de PDF',
        reset: 'Empezar de nuevo',
        privacy: 'Las fotos se procesan en este navegador: nunca salen de tu dispositivo.',
        defaultName: 'documento-de-identidad',
        pdfTitle: 'Documento de identidad',
        searching: 'Buscando el documento…',
        found: 'Documento encontrado. Si un borde no coincide, arrastra las esquinas.',
        notFound: 'No se encontraron los bordes: arrastra las cuatro esquinas a las puntas del documento.',
        cut: 'Una parte del documento queda fuera de la foto. Repítela con el documento entero.',
        edited: 'Esquinas ajustadas a mano.',
        rotate: 'Girar',
        detect: 'Detectar de nuevo',
        replace: 'Cambiar foto',
        remove: 'Quitar',
        photo: side => `Foto del ${side.toLowerCase()}`,
        corners: ['Esquina superior izquierda', 'Esquina superior derecha', 'Esquina inferior derecha', 'Esquina inferior izquierda'],
        cornerHelp: 'arrástrala o muévela con las flechas',
        summary: (front, back) => (front && back ? 'Frente y reverso listos'
            : front ? 'Frente listo · falta el reverso'
                : back ? 'Reverso listo · falta el frente'
                    : 'Sube las fotos de las dos caras'),
        building: 'Preparando el PDF…',
        saved: name => `Guardado: ${name}`,
        opened: 'El PDF está abierto en el editor.',
        errors: {
            not_image: name => `${name} no es una foto.`,
            too_large: (name, size) => `${name} pesa más de ${size}.`,
            unreadable: name => `No se pudo abrir ${name} en este navegador. Prueba con una foto JPG o PNG.`,
            library: 'No se pudo cargar la herramienta. Revisa la conexión e inténtalo de nuevo.',
            build: 'No se pudo generar el PDF.',
            empty: 'Sube la foto de al menos una cara.'
        }
    },
    pt: {
        title: 'As duas faces do seu documento numa folha',
        lead: 'Carregue uma fotografia da frente e outra do verso. Cada face é detetada, endireitada e recortada, e fica em tamanho real numa folha em branco, pronta a enviar.',
        front: 'Frente',
        back: 'Verso',
        dropFront: 'Largue aqui a fotografia da frente',
        dropBack: 'Largue aqui a fotografia do verso',
        choose: 'Escolher fotografia',
        formats: 'JPG, PNG, HEIC ou WebP. No telemóvel pode tirá-la agora.',
        swap: 'Trocar frente e verso',
        tips: 'Para o melhor resultado, pouse o documento numa superfície lisa de outra cor, com luz uniforme e sem reflexos, e tire a fotografia de cima.',
        sheetAria: 'Pré-visualização da folha',
        sheet: 'Folha',
        letter: 'Carta',
        size: 'Tamanho',
        real: 'Tamanho real',
        large: 'Maior',
        tone: 'Imagem',
        color: 'Cor',
        gray: 'Preto e branco',
        light: 'Corrigir luz e contraste',
        watermark: 'Marca de água (opcional)',
        watermarkPlaceholder: 'Por exemplo: Apenas para a candidatura de emprego na…',
        watermarkNote: 'Uma linha de texto sobre cada face, para que a cópia não sirva para outra coisa.',
        fileName: 'Nome do ficheiro',
        download: 'Transferir PDF',
        toEditor: 'Abrir no editor de PDF',
        reset: 'Começar de novo',
        privacy: 'As fotografias são processadas neste navegador: nunca saem do seu dispositivo.',
        defaultName: 'documento-de-identificacao',
        pdfTitle: 'Documento de identificação',
        searching: 'A procurar o documento…',
        found: 'Documento encontrado. Se um bordo não coincidir, arraste os cantos.',
        notFound: 'Não foi possível encontrar os bordos: arraste os quatro cantos para as pontas do documento.',
        cut: 'Parte do documento fica fora da fotografia. Repita-a com o documento inteiro.',
        edited: 'Cantos ajustados à mão.',
        rotate: 'Rodar',
        detect: 'Detetar de novo',
        replace: 'Mudar fotografia',
        remove: 'Retirar',
        photo: side => `Fotografia da ${side.toLowerCase()}`,
        corners: ['Canto superior esquerdo', 'Canto superior direito', 'Canto inferior direito', 'Canto inferior esquerdo'],
        cornerHelp: 'arraste-o ou mova-o com as setas',
        summary: (front, back) => (front && back ? 'Frente e verso prontos'
            : front ? 'Frente pronta · falta o verso'
                : back ? 'Verso pronto · falta a frente'
                    : 'Carregue as fotografias das duas faces'),
        building: 'A preparar o PDF…',
        saved: name => `Guardado: ${name}`,
        opened: 'O PDF está aberto no editor.',
        errors: {
            not_image: name => `${name} não é uma fotografia.`,
            too_large: (name, size) => `${name} tem mais de ${size}.`,
            unreadable: name => `Não foi possível abrir ${name} neste navegador. Experimente uma fotografia JPG ou PNG.`,
            library: 'Não foi possível carregar a ferramenta. Verifique a ligação e tente de novo.',
            build: 'Não foi possível gerar o PDF.',
            empty: 'Carregue a fotografia de pelo menos uma face.'
        }
    }
};

const state = {
    sides: { front: emptySide(), back: emptySide() },
    options: { sheet: 'a4', size: 'real', tone: 'color', light: true, watermark: '' },
    nameEdited: false,
    busy: false,
    alert: null
};
let _scan = null;
let _pdfLib = null;
let _drag = null;
let _sheetFrame = 0;

function emptySide() {
    return { status: 'empty', file: null, work: null, levels: null, view: null, corners: null, auto: null, found: false, cut: false, edited: false, turns: 0, preview: null, previewKey: '', error: null, token: 0 };
}

/* ── Utilidades ──────────────────────────────────────────────────────────── */

function lang() {
    const code = String(document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
    return COPY[code] ? code : 'en';
}

function copy() {
    return COPY[lang()];
}

function $(id) {
    return document.getElementById(id);
}

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
}

function formatBytes(bytes) {
    return new Intl.NumberFormat(document.documentElement.lang || 'en-GB', {
        style: 'unit', unit: 'megabyte', unitDisplay: 'short', maximumFractionDigits: 0
    }).format(bytes / 1000 / 1000);
}

function baseName(name) {
    return String(name || '').replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Deja pintar la pantalla antes de un trabajo largo. */
function nextFrame() {
    return new Promise(resolve => window.requestAnimationFrame(() => window.setTimeout(resolve, 0)));
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
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function announce(message) {
    const element = $('idcard-announcer');
    if (element) element.textContent = message;
}

function isImage(file) {
    return /^image\//.test(file?.type || '') || IMAGE_NAME.test(file?.name || '');
}

function readySides() {
    return SIDES.filter(side => state.sides[side].status === 'ready');
}

/* ── Librerías ───────────────────────────────────────────────────────────── */

function loadScan() {
    _scan ??= import('./id-card-scan.js').catch(error => {
        _scan = null;
        throw Object.assign(error, { code: 'library' });
    });
    return _scan;
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
        throw Object.assign(error, { code: 'library' });
    });
    return _pdfLib;
}

/* ── Fotos ───────────────────────────────────────────────────────────────── */

function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

/**
 * La foto decodificada y con la orientación EXIF aplicada. Si el navegador
 * no la abre con `createImageBitmap`, se intenta con una <img> y una URL
 * `data:` (las `blob:` no pasan la CSP del CRM).
 */
async function decodePhoto(file) {
    try {
        return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
        // Navegadores sin `from-image`: lo aplican por defecto.
    }
    try {
        return await createImageBitmap(file);
    } catch {
        // Lo intenta la <img>.
    }
    const image = new Image();
    image.decoding = 'async';
    image.src = await readAsDataUrl(file);
    await image.decode();
    return image;
}

function scaledCanvas(source, maxSide) {
    const width = source.width;
    const height = source.height;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas;
}

async function setPhoto(side, file) {
    if (!file) return;
    hideAlert();
    if (!isImage(file)) {
        showAlert({ code: 'not_image', name: file.name });
        return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
        showAlert({ code: 'too_large', name: file.name });
        return;
    }
    const slot = state.sides[side];
    const token = slot.token + 1;
    Object.assign(slot, emptySide(), { status: 'loading', file, token });
    renderSides();
    try {
        const scan = await loadScan();
        await nextFrame();
        const decoded = await decodePhoto(file);
        if (slot.token !== token) return;
        const workCanvas = scaledCanvas(decoded, WORK_SIDE);
        decoded.close?.();
        const work = workCanvas.getContext('2d').getImageData(0, 0, workCanvas.width, workCanvas.height);
        slot.view = scaledCanvas(workCanvas, VIEW_SIDE);
        workCanvas.width = 0;
        workCanvas.height = 0;
        await nextFrame();
        if (slot.token !== token) return;
        const result = scan.detectCard(work);
        if (slot.token !== token) return;
        Object.assign(slot, {
            status: 'ready',
            work,
            corners: result.corners,
            auto: result.corners.map(point => ({ ...point })),
            found: result.found,
            cut: result.found && scan.isCut(result.corners, work.width, work.height)
        });
        if (!state.nameEdited) $('idcard-name').value = copy().defaultName;
    } catch (error) {
        if (slot.token !== token) return;
        Object.assign(slot, emptySide(), { status: 'error', token });
        showAlert({ code: error?.code === 'library' ? 'library' : 'unreadable', name: file.name });
    }
    renderSides();
    scheduleSheet();
}

/** Varias fotos a la vez: van a las caras vacías, frente primero. */
function addPhotos(files, preferred = null) {
    const photos = [...(files || [])].filter(Boolean);
    if (!photos.length) return;
    if (photos.length === 1 && preferred) {
        setPhoto(preferred, photos[0]);
        return;
    }
    const empty = SIDES.filter(side => state.sides[side].status !== 'ready' && state.sides[side].status !== 'loading');
    const targets = empty.length >= photos.length ? empty : SIDES;
    photos.slice(0, 2).forEach((file, index) => setPhoto(targets[index] || SIDES[index], file));
}

function removePhoto(side) {
    const slot = state.sides[side];
    Object.assign(slot, emptySide(), { token: slot.token + 1 });
    renderSides();
    scheduleSheet();
}

function swapSides() {
    [state.sides.front, state.sides.back] = [state.sides.back, state.sides.front];
    SIDES.forEach(clearStage);
    renderSides();
    scheduleSheet();
}

function reset() {
    SIDES.forEach(side => {
        Object.assign(state.sides[side], emptySide(), { token: state.sides[side].token + 1 });
        clearStage(side);
    });
    state.nameEdited = false;
    $('idcard-name').value = '';
    $('idcard-watermark').value = '';
    state.options.watermark = '';
    hideAlert();
    renderSides();
    scheduleSheet();
}

/* ── Las caras: foto, esquinas y lupa ────────────────────────────────────── */

function stageMarkup(side) {
    const text = copy();
    const handles = text.corners.map((label, index) => `<button type="button" class="idcard-handle" data-corner="${index}" aria-label="${esc(`${label}: ${text.cornerHelp}`)}" title="${esc(label)}"></button>`).join('');
    return `<div class="idcard-photo">
            <canvas class="idcard-canvas" role="img" aria-label="${esc(text.photo(text[side]))}"></canvas>
            <svg class="idcard-overlay" aria-hidden="true" preserveAspectRatio="none"><path class="idcard-shade"/><polygon class="idcard-outline"/></svg>
            ${handles}
            <canvas class="idcard-loupe" aria-hidden="true" hidden></canvas>
        </div>
        <div class="idcard-tools">
            <button type="button" class="btn btn-secondary tools-btn-compact" data-idcard-action="rotate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>${esc(text.rotate)}</button>
            <button type="button" class="btn btn-secondary tools-btn-compact" data-idcard-action="detect">${esc(text.detect)}</button>
            <label class="btn btn-secondary tools-btn-compact" for="idcard-${side}-input">${esc(text.replace)}</label>
            <button type="button" class="crm-text-action" data-idcard-action="remove">${esc(text.remove)}</button>
        </div>`;
}

function sideState(slot) {
    const text = copy();
    if (slot.status === 'loading') return { text: text.searching, tone: '' };
    if (slot.status !== 'ready') return { text: '', tone: '' };
    if (slot.edited) return { text: text.edited, tone: 'is-good' };
    if (!slot.found) return { text: text.notFound, tone: 'is-warning' };
    if (slot.cut) return { text: text.cut, tone: 'is-warning' };
    return { text: text.found, tone: 'is-good' };
}

function renderSides() {
    SIDES.forEach(renderSide);
    const ready = readySides();
    const any = SIDES.some(side => state.sides[side].status !== 'empty');
    $('idcard-swap').hidden = ready.length < 2;
    $('idcard-reset').hidden = !any;
    updateControls();
}

function renderSide(side) {
    const slot = state.sides[side];
    const container = $(`idcard-${side}`);
    const stage = $(`idcard-${side}-stage`);
    if (!container || !stage) return;
    const drop = container.querySelector('.idcard-drop');
    const ready = slot.status === 'ready';
    container.classList.toggle('is-loading', slot.status === 'loading');
    container.classList.toggle('is-ready', ready);
    drop.hidden = ready || slot.status === 'loading';
    const status = sideState(slot);
    const label = $(`idcard-${side}-state`);
    label.textContent = status.text;
    label.className = `idcard-side-state ${status.tone}`.trim();
    if (slot.status === 'loading') {
        clearStage(side);
        stage.hidden = false;
        stage.innerHTML = '<div class="idcard-photo is-placeholder"><span class="idcard-spinner" aria-hidden="true"></span></div>';
        return;
    }
    if (!ready) {
        clearStage(side);
        stage.hidden = true;
        return;
    }
    stage.hidden = false;
    let photo = stage.querySelector('.idcard-photo:not(.is-placeholder)');
    if (!photo || photo.dataset.view !== String(slot.token)) {
        clearStage(side);
        stage.innerHTML = stageMarkup(side);
        photo = stage.querySelector('.idcard-photo');
        photo.dataset.view = String(slot.token);
        photo.style.setProperty('--photo-ratio', `${slot.work.width} / ${slot.work.height}`);
        photo.style.setProperty('--photo-aspect', String(slot.work.width / slot.work.height));
        stage.querySelector('.idcard-overlay').setAttribute('viewBox', `0 0 ${slot.work.width} ${slot.work.height}`);
        _photoObserver?.observe(photo);
    }
    drawPhoto(side);
    drawOverlay(side);
}

const _photoObserver = 'ResizeObserver' in window ? new ResizeObserver(entries => {
    for (const entry of entries) {
        const side = entry.target.closest('.idcard-side')?.dataset.side;
        if (side) drawPhoto(side);
    }
}) : null;

/** Vacía la cara y deja de observar el lienzo que se va. */
function clearStage(side) {
    const stage = $(`idcard-${side}-stage`);
    if (!stage) return;
    stage.querySelectorAll('.idcard-photo').forEach(photo => _photoObserver?.unobserve(photo));
    stage.innerHTML = '';
}

function drawPhoto(side) {
    const slot = state.sides[side];
    const canvas = $(`idcard-${side}-stage`)?.querySelector('.idcard-canvas');
    if (!canvas || !slot.view) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
    const context = canvas.getContext('2d');
    context.imageSmoothingQuality = 'high';
    context.drawImage(slot.view, 0, 0, width, height);
}

function drawOverlay(side) {
    const slot = state.sides[side];
    const stage = $(`idcard-${side}-stage`);
    if (!stage || !slot.corners) return;
    const { width, height } = slot.work;
    const points = slot.corners.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
    // Fuera del cuadrilátero, la foto se oscurece: se ve qué se va a recortar.
    stage.querySelector('.idcard-shade')?.setAttribute('d', `M0,0H${width}V${height}H0Z M${points.split(' ').join(' L')}Z`);
    stage.querySelector('.idcard-outline')?.setAttribute('points', points);
    stage.querySelectorAll('.idcard-handle').forEach(handle => {
        const point = slot.corners[Number(handle.dataset.corner)];
        handle.style.left = `${(point.x / width) * 100}%`;
        handle.style.top = `${(point.y / height) * 100}%`;
    });
}

/** La lupa: el entorno de la esquina, ampliado, encima del dedo. */
function drawLoupe(side, index) {
    const slot = state.sides[side];
    const stage = $(`idcard-${side}-stage`);
    const photo = stage?.querySelector('.idcard-photo');
    const loupe = stage?.querySelector('.idcard-loupe');
    if (!photo || !loupe || !slot.view) return;
    const rect = photo.getBoundingClientRect();
    const size = loupe.clientWidth || 112;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    if (loupe.width !== Math.round(size * ratio)) {
        loupe.width = Math.round(size * ratio);
        loupe.height = Math.round(size * ratio);
    }
    const point = slot.corners[index];
    // Cuántos píxeles de la foto de trabajo hay por píxel de pantalla.
    const workPerCss = slot.work.width / rect.width;
    const span = (size / LOUPE_ZOOM) * workPerCss;
    const viewScale = slot.view.width / slot.work.width;
    const context = loupe.getContext('2d');
    context.fillStyle = '#05080d';
    context.fillRect(0, 0, loupe.width, loupe.height);
    context.imageSmoothingQuality = 'high';
    context.drawImage(slot.view, (point.x - span / 2) * viewScale, (point.y - span / 2) * viewScale, span * viewScale, span * viewScale, 0, 0, loupe.width, loupe.height);
    // Los dos lados que llegan a la esquina, y una cruz en la punta.
    const toLoupe = other => ({ x: ((other.x - point.x) / span + 0.5) * loupe.width, y: ((other.y - point.y) / span + 0.5) * loupe.height });
    context.strokeStyle = '#5ea2ff';
    context.lineWidth = 1.5 * ratio;
    context.beginPath();
    const before = toLoupe(slot.corners[(index + 3) % 4]);
    const after = toLoupe(slot.corners[(index + 1) % 4]);
    context.moveTo(before.x, before.y);
    context.lineTo(loupe.width / 2, loupe.height / 2);
    context.lineTo(after.x, after.y);
    context.stroke();
    context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    context.lineWidth = 1 * ratio;
    context.beginPath();
    context.moveTo(loupe.width / 2 - 8 * ratio, loupe.height / 2);
    context.lineTo(loupe.width / 2 + 8 * ratio, loupe.height / 2);
    context.moveTo(loupe.width / 2, loupe.height / 2 - 8 * ratio);
    context.lineTo(loupe.width / 2, loupe.height / 2 + 8 * ratio);
    context.stroke();
    // Arriba de la esquina (el dedo tapa lo de abajo); si no cabe, debajo.
    const x = (point.x / slot.work.width) * rect.width;
    const y = (point.y / slot.work.height) * rect.height;
    const above = y - size - 28 >= -rect.top + 8;
    loupe.style.left = `${Math.max(0, Math.min(rect.width - size, x - size / 2))}px`;
    loupe.style.top = `${above ? y - size - 28 : y + 28}px`;
    loupe.hidden = false;
}

function hideLoupe(side) {
    const loupe = $(`idcard-${side}-stage`)?.querySelector('.idcard-loupe');
    if (loupe) loupe.hidden = true;
}

function moveCorner(side, index, x, y) {
    const slot = state.sides[side];
    const { width, height } = slot.work;
    slot.corners[index] = {
        x: Math.max(-width * 0.1, Math.min(width * 1.1, x)),
        y: Math.max(-height * 0.1, Math.min(height * 1.1, y))
    };
    slot.edited = true;
    drawOverlay(side);
}

/**
 * Al soltar una esquina, sus dos lados se ajustan al canto si lo hay cerca
 * (con Alt pulsado, no). La mano deja la esquina a unos píxeles de pantalla,
 * que en la foto son diez o treinta. Solo se ajusta si los dos lados siguen
 * un canto de punta a punta: si las esquinas vecinas aún están mal puestas,
 * la que se acaba de soltar se queda donde la dejaron.
 */
async function snapCorner(side, index) {
    const slot = state.sides[side];
    const photo = $(`idcard-${side}-stage`)?.querySelector('.idcard-photo');
    if (!photo) return;
    const scan = await loadScan();
    const workPerCss = slot.work.width / photo.getBoundingClientRect().width;
    const dropped = slot.corners[index];
    const corners = slot.corners.map(point => ({ ...point }));
    // Primero a cinco píxeles de pantalla del lado; luego, a uno y medio.
    for (const search of [Math.round(Math.max(10, workPerCss * 5)), Math.round(Math.max(6, workPerCss * 1.5))]) {
        const before = scan.fitSide(slot.work, corners[(index + 3) % 4], corners[index], { search, shift: search });
        const after = scan.fitSide(slot.work, corners[index], corners[(index + 1) % 4], { search, shift: search });
        if (!before || !after || before.inliers < 0.5 || after.inliers < 0.5) return;
        const point = scan.intersect(before, after);
        if (!point || Math.hypot(point.x - dropped.x, point.y - dropped.y) > workPerCss * 10) return;
        corners[index] = point;
    }
    slot.corners[index] = corners[index];
    drawOverlay(side);
}

function onPointerDown(event) {
    const handle = event.target.closest('.idcard-handle');
    const side = handle?.closest('.idcard-side')?.dataset.side;
    if (!handle || !side || event.button > 0) return;
    event.preventDefault();
    handle.setPointerCapture?.(event.pointerId);
    handle.classList.add('is-dragging');
    handle.focus({ preventScroll: true });
    _drag = { side, index: Number(handle.dataset.corner), handle, pointerId: event.pointerId, snap: !event.altKey };
    drawLoupe(side, _drag.index);
}

function onPointerMove(event) {
    if (!_drag || event.pointerId !== _drag.pointerId) return;
    event.preventDefault();
    const slot = state.sides[_drag.side];
    const photo = $(`idcard-${_drag.side}-stage`).querySelector('.idcard-photo');
    const rect = photo.getBoundingClientRect();
    moveCorner(_drag.side, _drag.index, ((event.clientX - rect.left) / rect.width) * slot.work.width, ((event.clientY - rect.top) / rect.height) * slot.work.height);
    drawLoupe(_drag.side, _drag.index);
}

async function onPointerUp(event) {
    if (!_drag || event.pointerId !== _drag.pointerId) return;
    const { side, index, handle, snap } = _drag;
    _drag = null;
    handle.classList.remove('is-dragging');
    hideLoupe(side);
    if (snap && state.sides[side].edited) await snapCorner(side, index);
    renderSide(side);
    scheduleSheet();
}

function onHandleKey(event) {
    const handle = event.target.closest('.idcard-handle');
    const side = handle?.closest('.idcard-side')?.dataset.side;
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!handle || !side || !step) return;
    event.preventDefault();
    const slot = state.sides[side];
    const index = Number(handle.dataset.corner);
    const rect = handle.closest('.idcard-photo').getBoundingClientRect();
    const unit = (slot.work.width / rect.width) * (event.shiftKey ? 10 : 1);
    const point = slot.corners[index];
    moveCorner(side, index, point.x + step[0] * unit, point.y + step[1] * unit);
    renderSide(side);
    scheduleSheet();
}

function sideAction(side, action) {
    const slot = state.sides[side];
    if (slot.status !== 'ready') return;
    if (action === 'rotate') {
        slot.turns = (slot.turns + 1) % 4;
    } else if (action === 'detect') {
        slot.corners = slot.auto.map(point => ({ ...point }));
        slot.edited = false;
    } else if (action === 'remove') {
        removePhoto(side);
        return;
    }
    renderSide(side);
    scheduleSheet();
}

/* ── La hoja ─────────────────────────────────────────────────────────────── */

function previewCard(scan, side) {
    const slot = state.sides[side];
    const key = JSON.stringify([slot.corners.map(point => [Math.round(point.x), Math.round(point.y)]), slot.turns, state.options.light, state.options.tone]);
    if (slot.preview && slot.previewKey === key) return slot.preview;
    slot.levels ??= scan.pyramid(slot.work);
    const rendered = scan.renderCard(slot.levels, slot.corners, {
        pxPerMm: PREVIEW_PX_PER_MM,
        turns: slot.turns,
        light: state.options.light,
        grayscale: state.options.tone === 'gray',
        crisp: false
    });
    const canvas = document.createElement('canvas');
    canvas.width = rendered.image.width;
    canvas.height = rendered.image.height;
    canvas.getContext('2d').putImageData(new ImageData(rendered.image.data, rendered.image.width, rendered.image.height), 0, 0);
    slot.preview = { canvas, mm: rendered.mm };
    slot.previewKey = key;
    return slot.preview;
}

function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
}

/** Tamaño y ángulo de la marca de agua para una caja: en la diagonal, sin salirse. */
function watermarkFit(width, height, measure) {
    const angle = Math.atan2(height, width);
    const diagonal = Math.hypot(width, height);
    const size = Math.min(height * 0.13, (diagonal * 0.8) / Math.max(1e-6, measure(1)));
    return { angle, size };
}

function scheduleSheet() {
    window.cancelAnimationFrame(_sheetFrame);
    _sheetFrame = window.requestAnimationFrame(() => drawSheet().catch(() => {}));
    updateControls();
}

async function drawSheet() {
    const canvas = $('idcard-sheet');
    if (!canvas) return;
    const ready = readySides();
    const scan = ready.length ? await loadScan() : null;
    const sheets = { a4: { width: 595.28, height: 841.89 }, letter: { width: 612, height: 792 } };
    const sheet = sheets[state.options.sheet] || sheets.a4;
    canvas.style.aspectRatio = `${sheet.width} / ${sheet.height}`;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round((canvas.clientWidth || 240) * ratio));
    const height = Math.round((width * sheet.height) / sheet.width);
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    const k = width / sheet.width;
    const scale = state.options.size === 'large' ? LARGE_SCALE : 1;
    if (!scan) {
        // Sin fotos, el sitio de las dos caras, en gris.
        const mm = { width: 85, height: 53.4 };
        const placeholder = (72 / 25.4) * k;
        const gap = 14 * placeholder;
        const w = mm.width * placeholder * scale;
        const h = mm.height * placeholder * scale;
        let top = (height - (h * 2 + gap * scale)) / 2;
        context.setLineDash([4 * ratio, 4 * ratio]);
        context.strokeStyle = '#c3c9d3';
        context.lineWidth = ratio;
        context.fillStyle = '#9aa3b2';
        context.font = `600 ${Math.round(11 * ratio)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        ['1', '2'].forEach(label => {
            roundedRect(context, (width - w) / 2, top, w, h, 3 * placeholder * scale);
            context.stroke();
            context.fillText(label, width / 2, top + h / 2);
            top += h + gap * scale;
        });
        context.setLineDash([]);
        return;
    }
    const cards = ready.map(side => previewCard(scan, side));
    const layout = scan.sheetLayout({ sheet: state.options.sheet, scale, cards });
    const watermark = scan.pdfSafeText(state.options.watermark);
    layout.boxes.forEach((box, index) => {
        const x = box.x * k;
        const y = (sheet.height - box.y - box.height) * k;
        const w = box.width * k;
        const h = box.height * k;
        context.imageSmoothingQuality = 'high';
        context.drawImage(cards[index].canvas, x, y, w, h);
        roundedRect(context, x, y, w, h, (scan.ID1.radius - scan.CARD_INSET_MM) * scan.MM_TO_PT * layout.scale * k);
        context.strokeStyle = 'rgba(120, 128, 140, 0.55)';
        context.lineWidth = Math.max(0.5, 0.5 * k);
        context.stroke();
        if (watermark) {
            context.save();
            context.font = `700 100px Helvetica, Arial, sans-serif`;
            const fit = watermarkFit(w, h, size => (context.measureText(watermark).width / 100) * size);
            context.font = `700 ${fit.size}px Helvetica, Arial, sans-serif`;
            context.translate(x + w / 2, y + h / 2);
            context.rotate(-fit.angle);
            context.fillStyle = 'rgba(70, 76, 88, 0.34)';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(watermark, 0, 0);
            context.restore();
        }
    });
}

/* ── El PDF ──────────────────────────────────────────────────────────────── */

function roundedPath(width, height, radius) {
    // Curvas de Bézier (k ≈ 0,5523) en vez de arcos: pdf-lib traduce el path
    // de SVG a operadores de PDF y así no depende de cómo aproxime los arcos.
    const r = Math.min(radius, width / 2, height / 2);
    const c = r * (1 - 0.5523);
    return [
        `M ${r} 0`, `L ${width - r} 0`, `C ${width - c} 0 ${width} ${c} ${width} ${r}`,
        `L ${width} ${height - r}`, `C ${width} ${height - c} ${width - c} ${height} ${width - r} ${height}`,
        `L ${r} ${height}`, `C ${c} ${height} 0 ${height - c} 0 ${height - r}`,
        `L 0 ${r}`, `C 0 ${c} ${c} 0 ${r} 0`, 'Z'
    ].join(' ');
}

async function jpegBytes(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d').putImageData(new ImageData(image.data, image.width, image.height), 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    canvas.width = 0;
    canvas.height = 0;
    if (!blob) throw new Error('JPEG encoding failed');
    return new Uint8Array(await blob.arrayBuffer());
}

function exportName() {
    return baseName($('idcard-name').value) || copy().defaultName;
}

async function buildPdf() {
    const ready = readySides();
    if (!ready.length) throw Object.assign(new Error('empty'), { code: 'empty' });
    const [scan, { PDFDocument, StandardFonts, degrees, rgb }] = await Promise.all([loadScan(), loadPdfLib()]);
    const cards = [];
    for (const side of ready) {
        const slot = state.sides[side];
        await nextFrame();
        slot.levels ??= scan.pyramid(slot.work);
        const rendered = scan.renderCard(slot.levels, slot.corners, {
            pxPerMm: PRINT_PX_PER_MM,
            turns: slot.turns,
            light: state.options.light,
            grayscale: state.options.tone === 'gray'
        });
        cards.push({ bytes: await jpegBytes(rendered.image), mm: rendered.mm });
    }
    const layout = scan.sheetLayout({ sheet: state.options.sheet, scale: state.options.size === 'large' ? LARGE_SCALE : 1, cards });
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([layout.width, layout.height]);
    const watermark = scan.pdfSafeText(state.options.watermark);
    const font = watermark ? await pdf.embedFont(StandardFonts.HelveticaBold) : null;
    const radius = (scan.ID1.radius - scan.CARD_INSET_MM) * scan.MM_TO_PT * layout.scale;
    for (const [index, card] of cards.entries()) {
        const box = layout.boxes[index];
        const image = await pdf.embedJpg(card.bytes);
        page.drawImage(image, { x: box.x, y: box.y, width: box.width, height: box.height });
        // Un filo gris: una tarjeta clara sobre papel blanco se sigue viendo.
        page.drawSvgPath(roundedPath(box.width, box.height, radius), {
            x: box.x,
            y: box.y + box.height,
            borderColor: rgb(0.71, 0.74, 0.78),
            borderWidth: 0.5
        });
        if (font) {
            const fit = watermarkFit(box.width, box.height, size => font.widthOfTextAtSize(watermark, size));
            const textWidth = font.widthOfTextAtSize(watermark, fit.size);
            const capHeight = fit.size * 0.7;
            const cos = Math.cos(fit.angle);
            const sin = Math.sin(fit.angle);
            page.drawText(watermark, {
                x: box.x + box.width / 2 - (textWidth / 2) * cos + (capHeight / 2) * sin,
                y: box.y + box.height / 2 - (textWidth / 2) * sin - (capHeight / 2) * cos,
                size: fit.size,
                font,
                color: rgb(0.27, 0.3, 0.35),
                opacity: 0.34,
                rotate: degrees((fit.angle * 180) / Math.PI)
            });
        }
    }
    pdf.setTitle(copy().pdfTitle);
    pdf.setLanguage?.(document.documentElement.lang || 'en');
    pdf.setCreator(document.body.dataset.publicTools === 'true' ? 'Elysium Tools' : 'Elysium CRM');
    pdf.setProducer('Elysium λ Development & Research');
    return pdf.save();
}

async function exportPdf(target) {
    if (state.busy) return;
    hideAlert();
    setBusy(true);
    try {
        const bytes = await buildPdf();
        const name = `${exportName()}.pdf`;
        if (target === 'editor') {
            const file = new File([bytes], name, { type: 'application/pdf' });
            document.dispatchEvent(new CustomEvent('elysium:pdf-open', { detail: { files: [file] } }));
            announce(copy().opened);
        } else {
            saveBlob(new Blob([bytes], { type: 'application/pdf' }), name);
            announce(copy().saved(name));
        }
    } catch (error) {
        showAlert({ code: error?.code || 'build', detail: error?.code ? null : error?.message });
    } finally {
        setBusy(false);
    }
}

/* ── Pintar ──────────────────────────────────────────────────────────────── */

function errorText(error = {}) {
    const entry = copy().errors[error.code] || copy().errors.build;
    if (typeof entry !== 'function') return entry;
    if (error.code === 'too_large') return entry(error.name, formatBytes(MAX_PHOTO_BYTES));
    return entry(error.name || '');
}

function showAlert(alert) {
    state.alert = alert;
    const element = $('idcard-alert');
    if (!element) return;
    const detail = alert.detail
        ? `<details class="tools-alert-detail"><summary>${esc(lang() === 'es' ? 'Detalle técnico' : lang() === 'pt' ? 'Detalhe técnico' : 'Technical detail')}</summary><code translate="no">${esc(alert.detail)}</code></details>`
        : '';
    element.innerHTML = `<p>${esc(errorText(alert))}</p>${detail}`;
    element.hidden = false;
}

function hideAlert() {
    state.alert = null;
    const element = $('idcard-alert');
    if (element) element.hidden = true;
}

function setBusy(busy) {
    state.busy = busy;
    const status = $('idcard-busy');
    if (status) {
        status.hidden = !busy;
        status.textContent = busy ? copy().building : '';
    }
    updateControls();
}

function updateControls() {
    const ready = readySides();
    const empty = !ready.length;
    const download = $('idcard-download');
    if (download) download.disabled = state.busy || empty;
    const editor = $('idcard-to-editor');
    if (editor) editor.disabled = state.busy || empty;
    const summary = $('idcard-summary');
    if (summary) summary.textContent = copy().summary(ready.includes('front'), ready.includes('back'));
}

function applyCopy() {
    const panel = $('idcard');
    if (!panel) return;
    const text = copy();
    panel.querySelectorAll('[data-idcard]').forEach(element => {
        const value = text[element.dataset.idcard];
        if (typeof value === 'string') element.textContent = value;
    });
    panel.querySelectorAll('[data-idcard-label]').forEach(element => element.setAttribute('aria-label', text[element.dataset.idcardLabel]));
    panel.querySelectorAll('[data-idcard-placeholder]').forEach(element => element.setAttribute('placeholder', text[element.dataset.idcardPlaceholder]));
    if (!state.nameEdited && readySides().length) $('idcard-name').value = text.defaultName;
    // Las caras con foto llevan sus botones dentro: se rehacen.
    SIDES.forEach(clearStage);
    renderSides();
    if (state.alert) showAlert(state.alert);
    if (state.busy) setBusy(true);
}

/* ── Opciones ────────────────────────────────────────────────────────────── */

function loadOptions() {
    try {
        const saved = JSON.parse(localStorage.getItem(OPTIONS_KEY) || '{}');
        if (saved.sheet === 'a4' || saved.sheet === 'letter') state.options.sheet = saved.sheet;
        if (saved.size === 'real' || saved.size === 'large') state.options.size = saved.size;
        if (saved.tone === 'color' || saved.tone === 'gray') state.options.tone = saved.tone;
        if (typeof saved.light === 'boolean') state.options.light = saved.light;
    } catch {
        // Sin almacenamiento local, se empieza con las opciones de siempre.
    }
    for (const name of ['sheet', 'size', 'tone']) {
        const input = document.querySelector(`input[name="idcard-${name}"][value="${state.options[name]}"]`);
        if (input) input.checked = true;
    }
    $('idcard-light').checked = state.options.light;
}

function saveOptions() {
    try {
        const { sheet, size, tone, light } = state.options;
        localStorage.setItem(OPTIONS_KEY, JSON.stringify({ sheet, size, tone, light }));
    } catch {
        // No se recuerdan; no pasa nada.
    }
}

/* ── Arranque ────────────────────────────────────────────────────────────── */

function bindSide(side) {
    const container = $(`idcard-${side}`);
    const input = $(`idcard-${side}-input`);
    if (!container || !input) return;
    input.addEventListener('change', () => {
        setPhoto(side, input.files?.[0]);
        input.value = '';
    });
    let depth = 0;
    const hasFiles = event => [...(event.dataTransfer?.types || [])].includes('Files');
    container.addEventListener('dragenter', event => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        depth += 1;
        container.classList.add('is-dropping');
    });
    container.addEventListener('dragover', event => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });
    container.addEventListener('dragleave', event => {
        if (!hasFiles(event)) return;
        depth = Math.max(0, depth - 1);
        if (!depth) container.classList.remove('is-dropping');
    });
    container.addEventListener('drop', event => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        event.stopPropagation();
        depth = 0;
        container.classList.remove('is-dropping');
        addPhotos(event.dataTransfer.files, side);
    });
    const stage = $(`idcard-${side}-stage`);
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('keydown', onHandleKey);
    stage.addEventListener('click', event => {
        const action = event.target.closest('[data-idcard-action]')?.dataset.idcardAction;
        if (action) sideAction(side, action);
    });
}

function bindIdCardUi() {
    const panel = $('idcard');
    if (!panel) return;
    SIDES.forEach(bindSide);
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);

    // Dos fotos soltadas fuera de las caras: frente y reverso, por orden.
    panel.addEventListener('dragover', event => {
        if ([...(event.dataTransfer?.types || [])].includes('Files')) event.preventDefault();
    });
    panel.addEventListener('drop', event => {
        if (!event.dataTransfer?.files?.length) return;
        event.preventDefault();
        addPhotos(event.dataTransfer.files);
    });
    // Una captura pegada (⌘V) va a la primera cara vacía.
    document.addEventListener('paste', event => {
        if (panel.hidden || !panel.offsetParent || /^(INPUT|TEXTAREA)$/.test(event.target.tagName)) return;
        const photos = [...(event.clipboardData?.files || [])].filter(isImage);
        if (!photos.length) return;
        event.preventDefault();
        addPhotos(photos);
    });

    panel.addEventListener('change', event => {
        const input = event.target;
        if (input.name === 'idcard-sheet' || input.name === 'idcard-size' || input.name === 'idcard-tone') {
            state.options[input.name.replace('idcard-', '')] = input.value;
        } else if (input.id === 'idcard-light') {
            state.options.light = input.checked;
        } else {
            return;
        }
        saveOptions();
        scheduleSheet();
    });
    $('idcard-watermark').addEventListener('input', event => {
        state.options.watermark = event.target.value;
        scheduleSheet();
    });
    $('idcard-name').addEventListener('input', () => { state.nameEdited = true; });
    $('idcard-swap').addEventListener('click', swapSides);
    $('idcard-reset').addEventListener('click', reset);
    $('idcard-download').addEventListener('click', () => exportPdf('download'));
    $('idcard-to-editor').addEventListener('click', () => exportPdf('editor'));

    const sheet = $('idcard-sheet');
    if ('ResizeObserver' in window) new ResizeObserver(() => scheduleSheet()).observe(sheet);
    // La herramienta estaba oculta: al enseñarla, los lienzos tienen ya tamaño.
    document.addEventListener('elysium:pdf-mode', event => {
        if (event.detail?.mode !== 'idcard') return;
        SIDES.forEach(drawPhoto);
        scheduleSheet();
    });
    document.addEventListener('elysium:language', () => queueMicrotask(() => {
        applyCopy();
        scheduleSheet();
    }));
}

function start() {
    bindIdCardUi();
    loadOptions();
    applyCopy();
    scheduleSheet();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
