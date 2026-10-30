/**
 * Herramientas del CRM — el descargador de videos.
 *
 * El trabajo lo hace `elysium-tools` (backend/tools), un servicio de Cloud Run
 * aparte al que el Worker manda `/api/tools/*`. Aquí solo se pinta:
 *
 *   1. Se pega un enlace y se analiza (`POST /api/tools/video/inspect`).
 *   2. Se elige una calidad y se descarga (`POST /api/tools/video/download`),
 *      que responde en NDJSON: una línea por evento, hasta `ready` o `error`.
 *   3. Con `ready`, el fichero se guarda con un enlace `download` a
 *      `/api/tools/files/<token>`: lo baja el navegador por su cuenta,
 *      con su propia barra y sin pasar el video por la memoria de la página.
 *
 * Cada descarga es una fila de «Descargas» con su progreso, así que se puede
 * analizar el siguiente enlace mientras baja el anterior. «Cancelar» o cerrar
 * la pestaña cortan la conexión, y el servicio detiene yt-dlp.
 *
 * El texto sigue el patrón de `admin-research.js`: diccionario propio, idioma
 * de `<html lang>` y repintado con el evento `elysium:language` de `admin.js`.
 */
// En tools.elysiumdr.eu el mismo módulo trabaja sin sesión, con Turnstile y
// textos para el público: ver `tools-public.js`. En el CRM no se carga.
const PUBLIC = document.body.dataset.publicTools === 'true' ? await import('./tools-public.js') : null;
let auth = null;

const SUPER_ADMIN_EMAIL = 'daniel.morales@elysiumdr.eu';
const TOOLS_API = PUBLIC ? '/api/tools/public' : '/api/tools';
const INSPECT_TIMEOUT_MS = 90000;
const SERVICE_RETRY_MS = 30000;
const TAB_STORAGE_KEY = 'elysium_tools_tab';

const CODEC_NAMES = { h264: 'H.264', hevc: 'HEVC', vp9: 'VP9', av1: 'AV1', mp3: 'MP3', aac: 'AAC' };

const COPY = {
    en: {
        title: 'Tools',
        description: 'Everyday utilities for the team. Paste a link and get the video.',
        tabsAria: 'Tools',
        tabVideo: 'Video downloader',
        tabPdf: 'PDF editor',
        urlLabel: 'Video link',
        paste: 'Paste',
        find: 'Find video',
        finding: 'Finding…',
        platformsMore: 'and 1,800+ more sites',
        footnote: 'Download only your own content or content you have permission to use.',
        quality: 'Quality',
        videoGroup: 'Video',
        audioGroup: 'Audio only',
        best: 'Best available',
        recommended: 'Recommended',
        overLimit: size => `Over the ${size} limit`,
        approx: size => `≈ ${size}`,
        codecNote: codec => `${codec} plays in Chrome and VLC, but not in QuickTime or Keynote. Choose 1080p or lower for H.264.`,
        download: 'Download',
        openOriginal: 'Open original',
        playlistIntro: count => `This link has ${count} video${count === 1 ? '' : 's'}. Choose one:`,
        playlistShown: shown => `Showing the first ${shown}.`,
        item: index => `Video ${index}`,
        choose: 'Choose',
        backToList: '← Back to the list',
        jobsTitle: 'Downloads',
        stages: {
            accepted: 'Connecting…',
            starting: 'Preparing…',
            merging: 'Joining video and audio…',
            extracting: 'Extracting the audio…',
            converting: 'Converting…',
            processing: 'Processing…',
            finishing: 'Finishing…'
        },
        queued: position => `Waiting in line (${position})`,
        downloadingVideo: 'Downloading video',
        downloadingAudio: 'Downloading audio',
        downloadingMedia: 'Downloading',
        partOf: (part, parts) => `part ${part} of ${parts}`,
        left: time => `${time} left`,
        perSecond: size => `${size}/s`,
        readyStatus: (size, time) => `Ready · ${size} · available until ${time}`,
        expired: 'Expired. Download it again.',
        cancelled: 'Cancelled.',
        cancel: 'Cancel',
        save: 'Save',
        retry: 'Retry',
        remove: 'Remove from the list',
        announceReady: title => `Ready to save: ${title}`,
        announceError: title => `Could not download: ${title}`,
        progressAria: title => `Download progress: ${title}`,
        detail: 'Technical detail',
        untitled: 'Untitled video',
        service: {
            missing: 'The tools service is not deployed yet. The downloader will work as soon as it is.',
            error: 'The tools service did not answer. You can still try; it may be starting up.',
            degraded: 'The download engine is not available on the tools service.'
        },
        errors: {
            url_required: 'Paste the link to a video first.',
            url_invalid: 'That does not look like a valid link.',
            url_private: 'Links to private or local addresses are not allowed.',
            host_not_found: 'That site could not be found. Check the link.',
            option_invalid: 'Choose one of the offered qualities.',
            item_invalid: 'That video is not part of the post.',
            unsupported: 'This site is not supported.',
            bot_check: ({ platform }) => `${platform} asked the server to prove it is not a bot. Try again later, or set up cookies or a proxy for the tools service.`,
            age_restricted: 'The video is age-restricted: it needs a signed-in account (cookies) on the tools service.',
            private: 'The video is private.',
            geo_blocked: 'The video is not available in the server region.',
            login_required: ({ platform }) => `${platform} asks for a signed-in account for this link. The post may be private, or the tools service needs cookies.`,
            rate_limited: 'The platform is limiting requests. Try again in a few minutes.',
            too_large: ({ size }) => `The file is larger than the ${size} limit. Choose a lower quality.`,
            live: 'Live streams can be downloaded once they end.',
            unavailable: 'The video is unavailable or was removed.',
            no_media: 'No downloadable video was found at that link.',
            network: 'The platform could not be reached. Try again.',
            timeout: 'The platform took too long to answer. Try again.',
            engine_unavailable: 'The download engine is not available on the tools service.',
            file_expired: 'This download expired. Download it again.',
            tools_not_configured: 'The tools service is not deployed yet.',
            tools_unreachable: 'The tools service did not answer. Try again in a moment.',
            unauthenticated: 'Your session expired. Sign in again.',
            admin_required: 'Only administrators can use the tools.',
            connection: 'The connection was lost. Check your internet and try again.',
            failed: 'The video could not be downloaded.'
        },
        thePlatform: 'The platform'
    },
    es: {
        title: 'Herramientas',
        description: 'Utilidades del día a día para el equipo. Pega un enlace y llévate el video.',
        tabsAria: 'Herramientas',
        tabVideo: 'Descargador de videos',
        tabPdf: 'Editor de PDF',
        urlLabel: 'Enlace del video',
        paste: 'Pegar',
        find: 'Buscar video',
        finding: 'Buscando…',
        platformsMore: 'y más de 1.800 sitios',
        footnote: 'Descarga solo contenido propio o que tengas permiso para usar.',
        quality: 'Calidad',
        videoGroup: 'Video',
        audioGroup: 'Solo audio',
        best: 'La mejor disponible',
        recommended: 'Recomendada',
        overLimit: size => `Supera el límite de ${size}`,
        approx: size => `≈ ${size}`,
        codecNote: codec => `${codec} se reproduce en Chrome y VLC, pero no en QuickTime ni en Keynote. Elige 1080p o menos para obtener H.264.`,
        download: 'Descargar',
        openOriginal: 'Ver original',
        playlistIntro: count => `Este enlace tiene ${count} video${count === 1 ? '' : 's'}. Elige uno:`,
        playlistShown: shown => `Se muestran los primeros ${shown}.`,
        item: index => `Video ${index}`,
        choose: 'Elegir',
        backToList: '← Volver a la lista',
        jobsTitle: 'Descargas',
        stages: {
            accepted: 'Conectando…',
            starting: 'Preparando…',
            merging: 'Uniendo video y audio…',
            extracting: 'Extrayendo el audio…',
            converting: 'Convirtiendo…',
            processing: 'Procesando…',
            finishing: 'Terminando…'
        },
        queued: position => `En cola (${position})`,
        downloadingVideo: 'Descargando el video',
        downloadingAudio: 'Descargando el audio',
        downloadingMedia: 'Descargando',
        partOf: (part, parts) => `parte ${part} de ${parts}`,
        left: time => `faltan ${time}`,
        perSecond: size => `${size}/s`,
        readyStatus: (size, time) => `Listo · ${size} · disponible hasta las ${time}`,
        expired: 'Caducó. Vuelve a descargarlo.',
        cancelled: 'Cancelada.',
        cancel: 'Cancelar',
        save: 'Guardar',
        retry: 'Reintentar',
        remove: 'Quitar de la lista',
        announceReady: title => `Listo para guardar: ${title}`,
        announceError: title => `No se pudo descargar: ${title}`,
        progressAria: title => `Progreso de la descarga: ${title}`,
        detail: 'Detalle técnico',
        untitled: 'Video sin título',
        service: {
            missing: 'El servicio de herramientas aún no está desplegado. El descargador funcionará en cuanto lo esté.',
            error: 'El servicio de herramientas no respondió. Puedes intentarlo igualmente; quizá esté arrancando.',
            degraded: 'El motor de descarga no está disponible en el servicio de herramientas.'
        },
        errors: {
            url_required: 'Primero pega el enlace de un video.',
            url_invalid: 'Eso no parece un enlace válido.',
            url_private: 'No se admiten enlaces a direcciones privadas o locales.',
            host_not_found: 'No se encontró ese sitio. Revisa el enlace.',
            option_invalid: 'Elige una de las calidades que se ofrecen.',
            item_invalid: 'Ese video no forma parte de la publicación.',
            unsupported: 'Este sitio no es compatible.',
            bot_check: ({ platform }) => `${platform} pidió al servidor demostrar que no es un bot. Inténtalo más tarde o configura cookies o un proxy en el servicio de herramientas.`,
            age_restricted: 'El video tiene restricción de edad: necesita una cuenta con sesión iniciada (cookies) en el servicio de herramientas.',
            private: 'El video es privado.',
            geo_blocked: 'El video no está disponible en la región del servidor.',
            login_required: ({ platform }) => `${platform} pide una cuenta con sesión iniciada para este enlace. Puede que la publicación sea privada o que el servicio de herramientas necesite cookies.`,
            rate_limited: 'La plataforma está limitando las peticiones. Inténtalo en unos minutos.',
            too_large: ({ size }) => `El archivo supera el límite de ${size}. Elige una calidad menor.`,
            live: 'Las transmisiones en directo se pueden descargar cuando terminan.',
            unavailable: 'El video no está disponible o se eliminó.',
            no_media: 'No se encontró ningún video descargable en ese enlace.',
            network: 'No se pudo contactar con la plataforma. Inténtalo de nuevo.',
            timeout: 'La plataforma tardó demasiado en responder. Inténtalo de nuevo.',
            engine_unavailable: 'El motor de descarga no está disponible en el servicio de herramientas.',
            file_expired: 'Esta descarga caducó. Vuelve a descargarla.',
            tools_not_configured: 'El servicio de herramientas aún no está desplegado.',
            tools_unreachable: 'El servicio de herramientas no respondió. Inténtalo en un momento.',
            unauthenticated: 'Tu sesión caducó. Vuelve a iniciar sesión.',
            admin_required: 'Solo los administradores pueden usar las herramientas.',
            connection: 'Se perdió la conexión. Revisa tu internet e inténtalo de nuevo.',
            failed: 'No se pudo descargar el video.'
        },
        thePlatform: 'La plataforma'
    },
    pt: {
        title: 'Ferramentas',
        description: 'Utilitários do dia a dia para a equipa. Cole uma ligação e fique com o vídeo.',
        tabsAria: 'Ferramentas',
        tabVideo: 'Transferidor de vídeos',
        tabPdf: 'Editor de PDF',
        urlLabel: 'Ligação do vídeo',
        paste: 'Colar',
        find: 'Procurar vídeo',
        finding: 'A procurar…',
        platformsMore: 'e mais de 1800 sites',
        footnote: 'Transfira apenas conteúdo próprio ou que tenha autorização para usar.',
        quality: 'Qualidade',
        videoGroup: 'Vídeo',
        audioGroup: 'Só áudio',
        best: 'A melhor disponível',
        recommended: 'Recomendada',
        overLimit: size => `Ultrapassa o limite de ${size}`,
        approx: size => `≈ ${size}`,
        codecNote: codec => `${codec} reproduz-se no Chrome e no VLC, mas não no QuickTime nem no Keynote. Escolha 1080p ou menos para obter H.264.`,
        download: 'Transferir',
        openOriginal: 'Ver original',
        playlistIntro: count => `Esta ligação tem ${count} vídeo${count === 1 ? '' : 's'}. Escolha um:`,
        playlistShown: shown => `Mostram-se os primeiros ${shown}.`,
        item: index => `Vídeo ${index}`,
        choose: 'Escolher',
        backToList: '← Voltar à lista',
        jobsTitle: 'Transferências',
        stages: {
            accepted: 'A ligar…',
            starting: 'A preparar…',
            merging: 'A juntar vídeo e áudio…',
            extracting: 'A extrair o áudio…',
            converting: 'A converter…',
            processing: 'A processar…',
            finishing: 'A terminar…'
        },
        queued: position => `Em fila (${position})`,
        downloadingVideo: 'A transferir o vídeo',
        downloadingAudio: 'A transferir o áudio',
        downloadingMedia: 'A transferir',
        partOf: (part, parts) => `parte ${part} de ${parts}`,
        left: time => `faltam ${time}`,
        perSecond: size => `${size}/s`,
        readyStatus: (size, time) => `Pronto · ${size} · disponível até às ${time}`,
        expired: 'Expirou. Volte a transferi-lo.',
        cancelled: 'Cancelada.',
        cancel: 'Cancelar',
        save: 'Guardar',
        retry: 'Tentar de novo',
        remove: 'Retirar da lista',
        announceReady: title => `Pronto para guardar: ${title}`,
        announceError: title => `Não foi possível transferir: ${title}`,
        progressAria: title => `Progresso da transferência: ${title}`,
        detail: 'Detalhe técnico',
        untitled: 'Vídeo sem título',
        service: {
            missing: 'O serviço de ferramentas ainda não está implementado. O transferidor funcionará assim que estiver.',
            error: 'O serviço de ferramentas não respondeu. Pode tentar na mesma; talvez esteja a arrancar.',
            degraded: 'O motor de transferência não está disponível no serviço de ferramentas.'
        },
        errors: {
            url_required: 'Cole primeiro a ligação de um vídeo.',
            url_invalid: 'Isso não parece uma ligação válida.',
            url_private: 'Não são permitidas ligações para endereços privados ou locais.',
            host_not_found: 'Não foi possível encontrar esse site. Verifique a ligação.',
            option_invalid: 'Escolha uma das qualidades disponíveis.',
            item_invalid: 'Esse vídeo não faz parte da publicação.',
            unsupported: 'Este site não é suportado.',
            bot_check: ({ platform }) => `${platform} pediu ao servidor que provasse não ser um bot. Tente mais tarde ou configure cookies ou um proxy no serviço de ferramentas.`,
            age_restricted: 'O vídeo tem restrição de idade: precisa de uma conta com sessão iniciada (cookies) no serviço de ferramentas.',
            private: 'O vídeo é privado.',
            geo_blocked: 'O vídeo não está disponível na região do servidor.',
            login_required: ({ platform }) => `${platform} exige uma conta com sessão iniciada para esta ligação. A publicação pode ser privada ou o serviço de ferramentas precisa de cookies.`,
            rate_limited: 'A plataforma está a limitar os pedidos. Tente daqui a alguns minutos.',
            too_large: ({ size }) => `O ficheiro ultrapassa o limite de ${size}. Escolha uma qualidade inferior.`,
            live: 'As transmissões em direto podem ser transferidas quando terminarem.',
            unavailable: 'O vídeo não está disponível ou foi removido.',
            no_media: 'Não foi encontrado nenhum vídeo transferível nessa ligação.',
            network: 'Não foi possível contactar a plataforma. Tente de novo.',
            timeout: 'A plataforma demorou demasiado a responder. Tente de novo.',
            engine_unavailable: 'O motor de transferência não está disponível no serviço de ferramentas.',
            file_expired: 'Esta transferência expirou. Volte a transferi-la.',
            tools_not_configured: 'O serviço de ferramentas ainda não está implementado.',
            tools_unreachable: 'O serviço de ferramentas não respondeu. Tente daqui a pouco.',
            unauthenticated: 'A sua sessão expirou. Inicie sessão de novo.',
            admin_required: 'Só os administradores podem usar as ferramentas.',
            connection: 'A ligação perdeu-se. Verifique a internet e tente de novo.',
            failed: 'Não foi possível transferir o vídeo.'
        },
        thePlatform: 'A plataforma'
    }
};

if (PUBLIC) PUBLIC.mergeCopy(COPY, PUBLIC.VIDEO_COPY);

let _authorized = Boolean(PUBLIC);
let _service = 'unknown';
let _serviceCheckedAt = 0;
let _engine = null;
let _inspecting = null;
let _media = null;
let _parent = null;
let _selected = null;
let _alert = null;
const _jobs = [];
const _paintQueue = new Set();
let _paintFrame = 0;

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
        style: 'unit',
        unit: units[unit],
        unitDisplay: 'short',
        maximumFractionDigits: unit >= 2 ? 1 : 0
    }).format(amount);
}

function formatDuration(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const rest = String(total % 60).padStart(2, '0');
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

function formatPercent(percent) {
    return new Intl.NumberFormat(locale(), { style: 'percent', maximumFractionDigits: 0 }).format(percent / 100);
}

function formatClock(timestamp) {
    return new Intl.DateTimeFormat(locale(), { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
}

function optionLabel(option) {
    if (option.id === 'audio-mp3') return 'MP3';
    if (option.id === 'audio-m4a') return 'M4A';
    if (option.id === 'best') return copy().best;
    return `${option.height}p`;
}

function jobLabel(option) {
    return option.type === 'audio' ? optionLabel(option) : `${optionLabel(option)} · MP4`;
}

function initial(media) {
    return String(media?.platform?.name || media?.title || '?').trim().charAt(0).toUpperCase() || '?';
}

function thumbnailMarkup(media, className) {
    // Solo `data:` del propio servicio: nunca una URL de la plataforma.
    const source = /^data:image\/(?:jpeg|png|webp|gif|avif);base64,/.test(String(media?.thumbnail || '')) ? media.thumbnail : '';
    return `<div class="${className}" data-platform="${esc(media?.platform?.id || 'web')}">${source
        ? `<img src="${esc(source)}" alt="" loading="lazy" decoding="async">`
        : `<span aria-hidden="true">${esc(initial(media))}</span>`}</div>`;
}

function errorMessage(error = {}) {
    const text = copy();
    const entry = text.errors[error.code] || text.errors.failed;
    return typeof entry === 'function'
        ? entry({
            platform: error.platform || text.thePlatform,
            size: formatBytes(_engine?.maxBytes || 1e9)
        })
        : entry;
}

/* ── Servicio ────────────────────────────────────────────────────────────── */

function toolsError(payload = {}, status = 0) {
    const error = new Error(payload.error || `HTTP ${status}`);
    error.code = payload.code
        || (status === 401 ? 'unauthenticated' : status === 403 ? 'admin_required' : 'failed');
    error.detail = payload.detail || null;
    error.platform = payload.platform || null;
    return error;
}

function errorInfo(error) {
    // `fetch` rechaza con TypeError cuando se cae la red.
    const code = error?.code || (error?.name === 'TypeError' ? 'connection' : 'failed');
    return { code, detail: error?.detail || null, platform: error?.platform || null };
}

async function toolsFetch(path, { method = 'POST', body, signal } = {}) {
    const headers = body ? { 'Content-Type': 'application/json' } : {};
    if (PUBLIC) {
        // Sin sesión: cada POST lleva su propio token de Turnstile.
        if (method === 'POST') headers['X-Turnstile-Token'] = await PUBLIC.humanToken({ signal });
    } else {
        const user = auth?.currentUser;
        if (!user) throw toolsError({ code: 'unauthenticated' }, 401);
        headers.Authorization = `Bearer ${await user.getIdToken()}`;
    }
    return fetch(`${TOOLS_API}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
        signal
    });
}

async function checkService({ force = false } = {}) {
    if (!_authorized) return;
    if (!force && _service !== 'unknown' && (_service !== 'error' || Date.now() - _serviceCheckedAt < SERVICE_RETRY_MS)) return;
    _serviceCheckedAt = Date.now();
    try {
        const response = await toolsFetch('/capabilities', { method: 'GET' });
        const payload = await response.json().catch(() => ({}));
        if (response.status === 503 && ['tools_not_configured', 'public_tools_disabled'].includes(payload.code)) {
            _service = 'missing';
        } else if (!response.ok) {
            _service = 'error';
        } else {
            _engine = payload.video || null;
            _service = _engine?.ready ? 'ready' : 'degraded';
            // Si el análisis llegó antes que el límite, la tarjeta se repinta
            // con las calidades que no caben ya marcadas.
            if (_media?.options) {
                const current = _media.options.find(option => option.id === _selected);
                if (!fits(current)) _selected = defaultOption(_media);
                renderMedia();
            }
        }
    } catch {
        _service = 'error';
    }
    renderService();
}

/** Lee el NDJSON de una descarga y entrega cada evento según llega. */
async function readEvents(response, onEvent) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const flush = line => {
        if (!line.trim()) return;
        try {
            onEvent(JSON.parse(line));
        } catch {
            // Una línea rota no tumba la descarga: la siguiente trae el estado.
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

/* ── Analizar ────────────────────────────────────────────────────────────── */

/** Lo que el servicio rechazaría por tamaño no se ofrece como elegible. */
function fits(option) {
    return !(_engine?.maxBytes && option?.bytes && option.bytes > _engine.maxBytes);
}

function defaultOption(media) {
    const options = (media?.options || []).filter(fits);
    return (options.find(option => option.recommended) || options[0])?.id || null;
}

function setFinding(finding) {
    const button = document.getElementById('tools-video-submit');
    if (!button) return;
    button.disabled = finding || _service === 'missing';
    button.textContent = finding ? copy().finding : copy().find;
    document.getElementById('tools-video-form')?.setAttribute('aria-busy', finding ? 'true' : 'false');
}

async function inspect(rawUrl, { parent = null } = {}) {
    hideAlert();
    if (!String(rawUrl || '').trim()) {
        showAlert({ code: 'url_required' });
        return;
    }
    if (!_authorized) {
        showAlert({ code: 'admin_required' });
        return;
    }
    _inspecting?.abort();
    const controller = new AbortController();
    _inspecting = controller;
    const timer = window.setTimeout(() => controller.abort('timeout'), INSPECT_TIMEOUT_MS);
    setFinding(true);
    try {
        const response = await toolsFetch('/video/inspect', { body: { url: rawUrl }, signal: controller.signal });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw toolsError(payload, response.status);
        _media = payload;
        _parent = parent;
        _selected = defaultOption(payload);
        renderMedia({ focus: true });
        if (_service !== 'ready') checkService({ force: true });
    } catch (error) {
        if (controller !== _inspecting) return;
        if (controller.signal.aborted && controller.signal.reason !== 'timeout') return;
        showAlert(controller.signal.reason === 'timeout' ? { code: 'timeout' } : errorInfo(error));
    } finally {
        window.clearTimeout(timer);
        if (controller === _inspecting) {
            _inspecting = null;
            setFinding(false);
        }
    }
}

/** Una entrada de lista con su propio enlace se analiza aparte; la de un
 *  carrusel ya trae sus calidades y se descarga por su posición. */
function chooseEntry(index) {
    const playlist = _media;
    const entry = playlist?.entries?.[index];
    if (!entry) return;
    if (entry.url && !entry.options) {
        inspect(entry.url, { parent: playlist });
        return;
    }
    const options = entry.options?.length ? entry.options : [
        { id: 'best', type: 'video', height: null, codec: null, bytes: null, recommended: true },
        { id: 'audio-mp3', type: 'audio', height: null, codec: 'mp3', bytes: null, recommended: false },
        { id: 'audio-m4a', type: 'audio', height: null, codec: 'aac', bytes: null, recommended: false }
    ];
    _media = {
        kind: 'video',
        platform: playlist.platform,
        url: playlist.url,
        item: entry.index,
        title: entry.title || copy().item(entry.index),
        uploader: playlist.uploader,
        duration: entry.duration,
        thumbnail: playlist.thumbnail,
        options
    };
    _parent = playlist;
    _selected = defaultOption(_media);
    renderMedia({ focus: true });
}

/* ── Pintar ──────────────────────────────────────────────────────────────── */

function showAlert(error) {
    _alert = error;
    const element = document.getElementById('tools-video-alert');
    if (!element) return;
    const detail = error.detail
        ? `<details class="tools-alert-detail"><summary>${esc(copy().detail)}</summary><code translate="no">${esc(error.detail)}</code></details>`
        : '';
    element.innerHTML = `<p>${esc(errorMessage(error))}</p>${detail}`;
    element.hidden = false;
}

function hideAlert() {
    _alert = null;
    const element = document.getElementById('tools-video-alert');
    if (element) element.hidden = true;
}

function renderService() {
    const element = document.getElementById('tools-service-alert');
    const input = document.getElementById('tools-video-url');
    const engine = document.getElementById('tools-video-engine');
    if (!element) return;
    const message = copy().service[_service];
    element.hidden = !message;
    element.textContent = message || '';
    if (input) input.disabled = _service === 'missing';
    setFinding(Boolean(_inspecting));
    if (engine) engine.textContent = _engine?.ytDlp ? `yt-dlp ${_engine.ytDlp}` : '';
}

function optionMarkup(option) {
    const text = copy();
    const allowed = fits(option);
    const facts = [
        option.bytes ? text.approx(formatBytes(option.bytes)) : '',
        CODEC_NAMES[option.codec] || ''
    ].filter(Boolean).join(' · ');
    return `<label class="tools-option${allowed ? '' : ' is-disabled'}">
        <input type="radio" name="tools-video-option" value="${esc(option.id)}"${option.id === _selected ? ' checked' : ''}${allowed ? '' : ' disabled'}>
        <span class="tools-option-body">
            <strong translate="no">${esc(optionLabel(option))}</strong>
            ${facts ? `<small translate="no">${esc(facts)}</small>` : ''}
            ${allowed ? '' : `<small class="tools-option-limit">${esc(text.overLimit(formatBytes(_engine.maxBytes)))}</small>`}
        </span>
        ${option.recommended && allowed ? `<em>${esc(text.recommended)}</em>` : ''}
    </label>`;
}

function videoMarkup(media) {
    const text = copy();
    const video = media.options.filter(option => option.type === 'video');
    const audio = media.options.filter(option => option.type === 'audio');
    const selected = media.options.find(option => option.id === _selected);
    const note = selected && ['vp9', 'av1'].includes(selected.codec) ? text.codecNote(CODEC_NAMES[selected.codec]) : '';
    return `<article class="tools-media">
        <div class="tools-media-visual">
            ${thumbnailMarkup(media, 'tools-media-thumb')}
            ${media.duration ? `<span class="tools-media-duration" translate="no">${esc(formatDuration(media.duration))}</span>` : ''}
        </div>
        <div class="tools-media-body">
            <p class="tools-media-meta"><span class="tools-platform" data-platform="${esc(media.platform?.id || 'web')}" translate="no">${esc(media.platform?.name || '')}</span>${media.uploader ? `<span translate="no">${esc(media.uploader)}</span>` : ''}</p>
            <h2 class="tools-media-title" id="tools-media-title" tabindex="-1">${esc(media.title || text.untitled)}</h2>
            <div class="tools-media-links">
                ${_parent ? `<button type="button" class="crm-text-action" data-tools-back>${esc(text.backToList)}</button>` : ''}
                ${media.url ? `<a class="crm-text-action" href="${esc(media.url)}" target="_blank" rel="noopener noreferrer">${esc(text.openOriginal)} ↗</a>` : ''}
            </div>
            <fieldset class="tools-options">
                <legend>${esc(text.quality)}</legend>
                ${video.length ? `<div class="tools-option-group"><span class="tools-option-heading">${esc(text.videoGroup)}</span><div class="tools-option-row">${video.map(optionMarkup).join('')}</div></div>` : ''}
                ${audio.length ? `<div class="tools-option-group"><span class="tools-option-heading">${esc(text.audioGroup)}</span><div class="tools-option-row">${audio.map(optionMarkup).join('')}</div></div>` : ''}
            </fieldset>
            <p class="tools-codec-note" id="tools-codec-note"${note ? '' : ' hidden'}>${esc(note)}</p>
            <div class="tools-media-actions">
                <button type="button" class="btn btn-primary" data-tools-download${_selected ? '' : ' disabled'}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
                    <span>${esc(text.download)}</span>
                </button>
            </div>
        </div>
    </article>`;
}

function playlistMarkup(media) {
    const text = copy();
    const entries = media.entries || [];
    const count = Math.max(media.entryCount || 0, entries.length);
    return `<article class="tools-media is-playlist">
        <div class="tools-media-visual">${thumbnailMarkup(media, 'tools-media-thumb')}</div>
        <div class="tools-media-body">
            <p class="tools-media-meta"><span class="tools-platform" data-platform="${esc(media.platform?.id || 'web')}" translate="no">${esc(media.platform?.name || '')}</span>${media.uploader ? `<span translate="no">${esc(media.uploader)}</span>` : ''}</p>
            <h2 class="tools-media-title" id="tools-media-title" tabindex="-1">${esc(media.title || text.untitled)}</h2>
            <p class="tools-playlist-intro">${esc(text.playlistIntro(count))}${count > entries.length ? ` ${esc(text.playlistShown(entries.length))}` : ''}</p>
            <ol class="tools-entries">
                ${entries.map((entry, index) => `<li>
                    <span class="tools-entry-index" translate="no">${entry.index}</span>
                    <span class="tools-entry-title">${esc(entry.title || text.item(entry.index))}</span>
                    <span class="tools-entry-duration" translate="no">${entry.duration ? esc(formatDuration(entry.duration)) : ''}</span>
                    <button type="button" class="btn btn-secondary tools-btn-compact" data-tools-entry="${index}">${esc(text.choose)}</button>
                </li>`).join('')}
            </ol>
        </div>
    </article>`;
}

function renderMedia({ focus = false } = {}) {
    const container = document.getElementById('tools-video-result');
    if (!container) return;
    if (!_media) {
        container.hidden = true;
        container.innerHTML = '';
        return;
    }
    container.innerHTML = _media.kind === 'playlist' ? playlistMarkup(_media) : videoMarkup(_media);
    container.hidden = false;
    if (focus) document.getElementById('tools-media-title')?.focus({ preventScroll: false });
}

function updateCodecNote() {
    const note = document.getElementById('tools-codec-note');
    const selected = _media?.options?.find(option => option.id === _selected);
    if (!note) return;
    const codec = selected && ['vp9', 'av1'].includes(selected.codec) ? CODEC_NAMES[selected.codec] : '';
    note.textContent = codec ? copy().codecNote(codec) : '';
    note.hidden = !codec;
}

/* ── Descargas ───────────────────────────────────────────────────────────── */

function jobStatus(job) {
    const text = copy();
    if (job.state === 'ready') {
        return job.expiresAt <= Date.now()
            ? text.expired
            : text.readyStatus(formatBytes(job.file?.bytes), formatClock(job.expiresAt));
    }
    if (job.state === 'error') return errorMessage(job.error);
    if (job.state === 'cancelled') return text.cancelled;
    if (job.stage === 'queued') return text.queued(job.position || 1);
    if (job.stage === 'downloading' && job.progress) {
        const progress = job.progress;
        const label = progress.kind === 'video' ? text.downloadingVideo
            : progress.kind === 'audio' ? text.downloadingAudio : text.downloadingMedia;
        return [
            label,
            progress.parts > 1 ? text.partOf(progress.part, progress.parts) : '',
            Number.isFinite(progress.percent) ? formatPercent(progress.percent) : formatBytes(progress.downloaded),
            progress.speed ? text.perSecond(formatBytes(progress.speed)) : '',
            Number.isFinite(progress.eta) && progress.eta > 0 ? text.left(formatDuration(progress.eta)) : ''
        ].filter(Boolean).join(' · ');
    }
    return text.stages[job.stage] || text.stages.accepted;
}

function jobActions(job) {
    const text = copy();
    const buttons = [];
    if (job.state === 'running') {
        buttons.push(`<button type="button" class="btn btn-secondary tools-btn-compact" data-job-action="cancel">${esc(text.cancel)}</button>`);
    } else if (job.state === 'ready' && job.expiresAt > Date.now()) {
        buttons.push(`<a class="btn btn-primary tools-btn-compact" data-job-action="save" href="${esc(job.file.url)}" download="${esc(job.file.name)}">${esc(text.save)}</a>`);
    } else {
        buttons.push(`<button type="button" class="btn btn-secondary tools-btn-compact" data-job-action="retry">${esc(text.retry)}</button>`);
    }
    if (job.state !== 'running') {
        buttons.push(`<button type="button" class="tools-job-remove" data-job-action="remove" aria-label="${esc(text.remove)}" title="${esc(text.remove)}">×</button>`);
    }
    return buttons.join('');
}

function jobMarkup(job) {
    const text = copy();
    const running = job.state === 'running';
    const percent = running && job.stage === 'downloading' && Number.isFinite(job.progress?.percent) ? job.progress.percent : null;
    const indeterminate = running && percent === null;
    const detail = job.state === 'error' && job.error?.detail
        ? `<details class="tools-alert-detail"><summary>${esc(text.detail)}</summary><code translate="no">${esc(job.error.detail)}</code></details>`
        : '';
    return `${thumbnailMarkup(job.media, 'tools-job-thumb')}
        <div class="tools-job-body">
            <div class="tools-job-head">
                <strong class="tools-job-title">${esc(job.media.title || text.untitled)}</strong>
                <span class="tools-job-option" translate="no">${esc(jobLabel(job.option))}</span>
            </div>
            ${running ? `<div class="tools-job-bar${indeterminate ? ' is-indeterminate' : ''}" role="progressbar" aria-label="${esc(text.progressAria(job.media.title || text.untitled))}" aria-valuemin="0" aria-valuemax="100"${percent === null ? '' : ` aria-valuenow="${Math.round(percent)}"`}><span style="width: ${percent === null ? 0 : percent}%"></span></div>` : ''}
            <p class="tools-job-status">${esc(jobStatus(job))}</p>
            ${detail}
        </div>
        <div class="tools-job-actions">${jobActions(job)}</div>`;
}

function paintJob(job) {
    const list = document.getElementById('tools-video-job-list');
    if (!list) return;
    let row = list.querySelector(`[data-job-id="${job.id}"]`);
    if (!row) {
        row = document.createElement('li');
        row.dataset.jobId = job.id;
        list.prepend(row);
    }
    row.className = `tools-job is-${job.state}${job.state === 'ready' && job.expiresAt <= Date.now() ? ' is-expired' : ''}`;
    // Mientras baja, solo cambian la barra y el estado: se tocan en su sitio
    // para no rehacer la fila (ni robar el foco del botón «Cancelar») cuatro
    // veces por segundo.
    const bar = row.querySelector('.tools-job-bar');
    if (job.state === 'running' && bar && row.dataset.paintedState === 'running') {
        const percent = job.stage === 'downloading' && Number.isFinite(job.progress?.percent) ? job.progress.percent : null;
        bar.classList.toggle('is-indeterminate', percent === null);
        if (percent === null) bar.removeAttribute('aria-valuenow');
        else bar.setAttribute('aria-valuenow', String(Math.round(percent)));
        bar.firstElementChild.style.width = `${percent === null ? 0 : percent}%`;
        row.querySelector('.tools-job-status').textContent = jobStatus(job);
        return;
    }
    row.innerHTML = jobMarkup(job);
    row.dataset.paintedState = job.state;
}

function schedulePaint(job) {
    _paintQueue.add(job);
    if (_paintFrame) return;
    _paintFrame = window.requestAnimationFrame(() => {
        _paintFrame = 0;
        const jobs = [..._paintQueue];
        _paintQueue.clear();
        jobs.forEach(paintJob);
    });
}

function renderJobs() {
    const section = document.getElementById('tools-video-jobs');
    const list = document.getElementById('tools-video-job-list');
    if (!section || !list) return;
    section.hidden = _jobs.length === 0;
    list.innerHTML = '';
    // `paintJob` antepone cada fila: de la más antigua a la más nueva, la
    // última descarga queda arriba.
    _jobs.forEach(paintJob);
}

function announce(message) {
    const element = document.getElementById('tools-video-announcer');
    if (element) element.textContent = message;
}

function saveFile(job) {
    if (!job.file?.url || job.expiresAt <= Date.now()) return;
    const link = document.createElement('a');
    link.href = job.file.url;
    link.download = job.file.name;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
}

function handleJobEvent(job, event) {
    switch (event?.type) {
        case 'accepted':
            job.stage = 'accepted';
            break;
        case 'queued':
            job.stage = 'queued';
            job.position = event.position;
            break;
        case 'stage':
            job.stage = event.stage;
            break;
        case 'progress':
            job.stage = 'downloading';
            job.progress = event;
            break;
        case 'ready':
            job.state = 'ready';
            job.file = event.file;
            job.expiresAt = Date.parse(event.expiresAt) || Date.now() + 15 * 60 * 1000;
            announce(copy().announceReady(job.media.title || copy().untitled));
            saveFile(job);
            break;
        case 'error':
            job.state = 'error';
            job.error = { code: event.code, detail: event.detail || null, platform: event.platform || job.media.platform?.name };
            announce(copy().announceError(job.media.title || copy().untitled));
            break;
        default:
            return;
    }
    schedulePaint(job);
}

function updateUnloadGuard() {
    const running = _jobs.some(job => job.state === 'running');
    window.onbeforeunload = running ? event => {
        event.preventDefault();
        event.returnValue = '';
        return '';
    } : null;
}

async function runJob(job) {
    job.controller = new AbortController();
    Object.assign(job, { state: 'running', stage: 'accepted', progress: null, file: null, error: null, position: null });
    schedulePaint(job);
    updateUnloadGuard();
    try {
        const response = await toolsFetch('/video/download', { body: job.request, signal: job.controller.signal });
        if (!response.ok) throw toolsError(await response.json().catch(() => ({})), response.status);
        await readEvents(response, event => handleJobEvent(job, event));
        if (job.state === 'running') {
            job.state = 'error';
            job.error = { code: 'connection' };
        }
    } catch (error) {
        if (job.controller?.signal.aborted) {
            job.state = 'cancelled';
        } else {
            job.state = 'error';
            job.error = { ...errorInfo(error), platform: error?.platform || job.media.platform?.name };
        }
    } finally {
        job.controller = null;
        schedulePaint(job);
        updateUnloadGuard();
        scheduleExpiryRefresh();
    }
}

function startDownload() {
    const media = _media;
    const option = media?.options?.find(candidate => candidate.id === _selected);
    if (!media || media.kind !== 'video' || !option) return;
    const job = {
        id: `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        media: { title: media.title, platform: media.platform, thumbnail: media.thumbnail },
        option,
        request: { url: media.url, option: option.id, ...(media.item ? { item: media.item } : {}) },
        state: 'running',
        stage: 'accepted'
    };
    _jobs.push(job);
    document.getElementById('tools-video-jobs').hidden = false;
    runJob(job);
}

let _expiryTimer = 0;
/** Las filas listas pasan a «Caducó» solas cuando vence su enlace. */
function scheduleExpiryRefresh() {
    window.clearTimeout(_expiryTimer);
    const next = _jobs
        .filter(job => job.state === 'ready' && job.expiresAt > Date.now())
        .reduce((soonest, job) => Math.min(soonest, job.expiresAt), Infinity);
    if (!Number.isFinite(next)) return;
    _expiryTimer = window.setTimeout(() => {
        _jobs.filter(job => job.state === 'ready').forEach(schedulePaint);
        scheduleExpiryRefresh();
    }, Math.max(1000, next - Date.now() + 500));
}

function handleJobAction(event) {
    const button = event.target.closest('[data-job-action]');
    const row = button?.closest('[data-job-id]');
    const job = row && _jobs.find(candidate => candidate.id === row.dataset.jobId);
    if (!job) return;
    const action = button.dataset.jobAction;
    if (action === 'cancel') {
        job.controller?.abort();
    } else if (action === 'retry') {
        runJob(job);
    } else if (action === 'remove') {
        _jobs.splice(_jobs.indexOf(job), 1);
        row.remove();
        document.getElementById('tools-video-jobs').hidden = _jobs.length === 0;
    } else if (action === 'save' && job.expiresAt <= Date.now()) {
        event.preventDefault();
        schedulePaint(job);
    }
}

/* ── Texto y arranque ────────────────────────────────────────────────────── */

function applyCopy() {
    const text = copy();
    const values = {
        'tools-title': text.title,
        'tools-description': text.description,
        'tools-tab-video-label': text.tabVideo,
        'tools-tab-pdf-label': text.tabPdf,
        'tools-video-url-label': text.urlLabel,
        'tools-video-paste': text.paste,
        'tools-video-platforms-more': text.platformsMore,
        'tools-video-jobs-title': text.jobsTitle,
        'tools-video-footnote': text.footnote
    };
    for (const [id, value] of Object.entries(values)) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }
    document.getElementById('tools-tabs')?.setAttribute('aria-label', text.tabsAria);
    setFinding(Boolean(_inspecting));
    renderService();
    renderMedia();
    renderJobs();
    if (_alert) showAlert(_alert);
}

async function canUseTools(user) {
    if (!user) return false;
    try {
        const token = await user.getIdTokenResult();
        if (token?.claims?.admin === true) return true;
    } catch {
        return false;
    }
    return String(user.email || '').toLowerCase() === SUPER_ADMIN_EMAIL;
}

/**
 * Pestañas: clic, o flechas e Inicio/Fin cuando una tiene el foco, como pide
 * el patrón `tablist`. La última elegida se recuerda en este navegador.
 */
function selectTab(name, { focus = false } = {}) {
    const tabs = [...document.querySelectorAll('#tools-tabs [role="tab"]')];
    const chosen = tabs.find(tab => tab.id === `tools-tab-${name}`) || tabs[0];
    if (!chosen) return;
    tabs.forEach(tab => {
        const active = tab === chosen;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.tabIndex = active ? 0 : -1;
        const panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (panel) panel.hidden = !active;
    });
    if (focus) chosen.focus();
    try {
        localStorage.setItem(TAB_STORAGE_KEY, chosen.id.replace('tools-tab-', ''));
    } catch {
        // Sin almacenamiento local, la pestaña simplemente no se recuerda.
    }
}

function bindTabs() {
    const list = document.getElementById('tools-tabs');
    if (!list) return;
    list.addEventListener('click', event => {
        const tab = event.target.closest('[role="tab"]');
        if (tab) selectTab(tab.id.replace('tools-tab-', ''));
    });
    list.addEventListener('keydown', event => {
        const tabs = [...list.querySelectorAll('[role="tab"]')];
        const index = tabs.indexOf(document.activeElement);
        if (index < 0) return;
        const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        const target = tabs[(next + tabs.length) % tabs.length];
        selectTab(target.id.replace('tools-tab-', ''), { focus: true });
    });
    let saved = null;
    try {
        saved = localStorage.getItem(TAB_STORAGE_KEY);
    } catch {
        saved = null;
    }
    const requested = new URLSearchParams(window.location.search).get('tool');
    selectTab(requested === 'pdf' || requested === 'video' ? requested : saved || 'video');
}

function bindToolsUi() {
    const form = document.getElementById('tools-video-form');
    const input = document.getElementById('tools-video-url');
    const result = document.getElementById('tools-video-result');
    const paste = document.getElementById('tools-video-paste');
    if (!form || !input || !result) return;

    form.addEventListener('submit', event => {
        event.preventDefault();
        inspect(input.value);
    });
    // Pegar ya es pedir: se busca sin tener que pulsar el botón.
    input.addEventListener('paste', () => window.setTimeout(() => form.requestSubmit(), 0));

    if (!navigator.clipboard?.readText) paste.hidden = true;
    paste.addEventListener('click', async () => {
        try {
            const text = (await navigator.clipboard.readText()).trim();
            if (!text) return;
            input.value = text;
            inspect(text);
        } catch {
            input.focus();
            input.select();
        }
    });

    result.addEventListener('change', event => {
        if (event.target.name !== 'tools-video-option') return;
        _selected = event.target.value;
        updateCodecNote();
    });
    result.addEventListener('click', event => {
        if (event.target.closest('[data-tools-download]')) {
            startDownload();
            return;
        }
        if (event.target.closest('[data-tools-back]') && _parent) {
            _media = _parent;
            _parent = null;
            _selected = null;
            renderMedia({ focus: true });
            return;
        }
        const entry = event.target.closest('[data-tools-entry]');
        if (entry) chooseEntry(Number(entry.dataset.toolsEntry));
    });

    document.getElementById('tools-video-job-list')?.addEventListener('click', handleJobAction);
    bindTabs();
    document.addEventListener('elysium:language', () => queueMicrotask(applyCopy));
}

async function start() {
    bindToolsUi();
    applyCopy();

    const section = document.getElementById('tools');
    if (!section) return;
    new MutationObserver(() => {
        if (section.classList.contains('active')) checkService();
    }).observe(section, { attributes: true, attributeFilter: ['class'] });

    if (PUBLIC) {
        PUBLIC.prepareOnUse(document.getElementById('tools-video-form'));
        if (section.classList.contains('active')) checkService();
        return;
    }
    const [config, firebase] = await Promise.all([import('./firebase-config.js'), import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js')]);
    auth = config.auth;
    firebase.onAuthStateChanged(auth, async user => {
        _authorized = await canUseTools(user);
        if (_authorized && section.classList.contains('active')) checkService();
    });
}

// En modo público el `await` del principio hace que el módulo acabe de
// evaluarse después de DOMContentLoaded (el documento ya está leído): se
// arranca sin esperarlo, o no arrancaría nunca.
if (PUBLIC) start();
else document.addEventListener('DOMContentLoaded', start);
