/**
 * Las herramientas del CRM, abiertas al público en tools.elysiumdr.eu.
 *
 * `admin-tools.js` (videos) y `admin-pdf.js` son los mismos módulos en el CRM
 * y en las páginas públicas. Cuando la página lleva
 * `<body data-public-tools="true">` cargan este módulo, que les da lo único
 * que cambia fuera del CRM:
 *
 * 1. Turnstile. El Worker no reenvía ningún POST de la API pública sin un
 *    token de Cloudflare Turnstile, y cada token vale una sola vez:
 *    `humanToken()` pide uno nuevo por operación. El widget no se ve salvo que
 *    Cloudflare necesite que la persona interactúe, y no se carga hasta que
 *    alguien empieza a usar la herramienta: abrir la página no avisa a nadie.
 * 2. Los textos de quien llega sin sesión: límites por hora, plataformas
 *    compatibles y ningún consejo pensado para el administrador («configura
 *    cookies en el servicio»). `mergeCopy` los pone encima del diccionario del
 *    módulo; los tres idiomas tienen que declarar las mismas claves (lo vigila
 *    `scripts/tools.test.mjs`).
 *
 * No toca `document` al importarse, así que las pruebas lo cargan en Node.
 */

const CONFIG_URL = '/api/tools/public/config';
const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TOKEN_TIMEOUT_MS = 120000;

/**
 * Las plataformas que acepta la pasarela pública (`backend/tools/public-tools.js`)
 * y que prometen las páginas (`scripts/tools/content.mjs`). Las tres listas
 * tienen que coincidir; la prueba lo comprueba.
 */
export const PUBLIC_PLATFORMS = ['TikTok', 'Instagram', 'Facebook', 'Pinterest', 'Twitch', 'LinkedIn', 'Snapchat', 'Bluesky'];

const LOCALES = { en: 'en-GB', es: 'es', pt: 'pt-PT' };

function platformList(language) {
    return new Intl.ListFormat(LOCALES[language], { type: 'disjunction' }).format(PUBLIC_PLATFORMS);
}

/* ── Textos ──────────────────────────────────────────────────────────────── */

const COMMON = {
    en: {
        limit_reached: 'You have reached the free hourly limit for this tool. It resets within the hour.',
        busy: 'Another request of yours is still running, or the service is at capacity. Wait a moment and try again.',
        public_tools_disabled: 'This tool is not open to the public yet. Try again later.',
        turnstile_required: 'The security check did not complete. Try again.',
        turnstile_failed: 'The security check did not pass. Reload the page and try again.',
        turnstile_unavailable: 'The security check could not load. Check your connection or any content blocker, then try again.',
        origin_not_allowed: 'Open the tool on tools.elysiumdr.eu to use it.'
    },
    es: {
        limit_reached: 'Alcanzaste el límite gratuito por hora de esta herramienta. Se renueva dentro de la hora.',
        busy: 'Todavía tienes otra operación en curso o el servicio está al límite. Espera un momento e inténtalo de nuevo.',
        public_tools_disabled: 'Esta herramienta todavía no está abierta al público. Inténtalo más tarde.',
        turnstile_required: 'La verificación de seguridad no terminó. Inténtalo de nuevo.',
        turnstile_failed: 'La verificación de seguridad no se superó. Recarga la página e inténtalo de nuevo.',
        turnstile_unavailable: 'No se pudo cargar la verificación de seguridad. Revisa la conexión o el bloqueador de contenido e inténtalo de nuevo.',
        origin_not_allowed: 'Abre la herramienta en tools.elysiumdr.eu para usarla.'
    },
    pt: {
        limit_reached: 'Atingiu o limite gratuito por hora desta ferramenta. Renova-se dentro da hora.',
        busy: 'Ainda tem outra operação em curso ou o serviço está no limite. Aguarde um momento e tente novamente.',
        public_tools_disabled: 'Esta ferramenta ainda não está aberta ao público. Tente mais tarde.',
        turnstile_required: 'A verificação de segurança não terminou. Tente novamente.',
        turnstile_failed: 'A verificação de segurança não foi superada. Recarregue a página e tente novamente.',
        turnstile_unavailable: 'Não foi possível carregar a verificação de segurança. Verifique a ligação ou o bloqueador de conteúdo e tente novamente.',
        origin_not_allowed: 'Abra a ferramenta em tools.elysiumdr.eu para a usar.'
    }
};

export const VIDEO_COPY = {
    en: {
        service: {
            missing: 'The video downloader is not open to the public yet. Try again later.',
            error: 'The download service did not answer. You can still try: it may be starting up.',
            degraded: 'The download engine is not available right now. Try again later.'
        },
        errors: {
            ...COMMON.en,
            unsupported: () => `This site is not supported yet. Paste a public link from ${platformList('en')}.`,
            coming_soon: ({ platform }) => `${platform} downloads are coming soon. For now, paste a link from ${platformList('en')}.`,
            short_link: ({ platform }) => `Short ${platform} links cannot be opened here. Open the link in your browser and paste the full address.`,
            bot_check: ({ platform }) => `${platform} is blocking automated downloads right now. Try again later.`,
            login_required: ({ platform }) => `${platform} only shows this post to signed-in accounts. Only public posts can be downloaded.`,
            age_restricted: 'The video is age-restricted, so it needs an account to watch. Only public videos can be downloaded.',
            engine_unavailable: 'The download engine is not available right now. Try again later.',
            tools_not_configured: 'The video downloader is not open to the public yet.',
            tools_unreachable: 'The download service did not answer. Try again in a moment.'
        }
    },
    es: {
        service: {
            missing: 'El descargador de videos todavía no está abierto al público. Inténtalo más tarde.',
            error: 'El servicio de descargas no respondió. Puedes intentarlo igualmente: quizá esté arrancando.',
            degraded: 'El motor de descarga no está disponible en este momento. Inténtalo más tarde.'
        },
        errors: {
            ...COMMON.es,
            unsupported: () => `Este sitio todavía no es compatible. Pega un enlace público de ${platformList('es')}.`,
            coming_soon: ({ platform }) => `Las descargas de ${platform} llegarán pronto. Por ahora, pega un enlace de ${platformList('es')}.`,
            short_link: ({ platform }) => `Los enlaces cortos de ${platform} no se pueden abrir aquí. Abre el enlace en el navegador y pega la dirección completa.`,
            bot_check: ({ platform }) => `${platform} está bloqueando las descargas automáticas en este momento. Inténtalo más tarde.`,
            login_required: ({ platform }) => `${platform} solo muestra esta publicación a cuentas con sesión iniciada. Solo se pueden descargar publicaciones públicas.`,
            age_restricted: 'El video tiene restricción de edad, así que hace falta una cuenta para verlo. Solo se pueden descargar videos públicos.',
            engine_unavailable: 'El motor de descarga no está disponible en este momento. Inténtalo más tarde.',
            tools_not_configured: 'El descargador de videos todavía no está abierto al público.',
            tools_unreachable: 'El servicio de descargas no respondió. Inténtalo en un momento.'
        }
    },
    pt: {
        service: {
            missing: 'O descarregador de vídeos ainda não está aberto ao público. Tente mais tarde.',
            error: 'O serviço de transferências não respondeu. Pode tentar na mesma: talvez esteja a arrancar.',
            degraded: 'O motor de transferência não está disponível neste momento. Tente mais tarde.'
        },
        errors: {
            ...COMMON.pt,
            unsupported: () => `Este site ainda não é compatível. Cole uma ligação pública do ${platformList('pt')}.`,
            coming_soon: ({ platform }) => `As transferências do ${platform} chegarão em breve. Por agora, cole uma ligação do ${platformList('pt')}.`,
            short_link: ({ platform }) => `As ligações curtas do ${platform} não podem ser abertas aqui. Abra a ligação no navegador e cole o endereço completo.`,
            bot_check: ({ platform }) => `O ${platform} está a bloquear as transferências automáticas neste momento. Tente mais tarde.`,
            login_required: ({ platform }) => `O ${platform} só mostra esta publicação a contas com sessão iniciada. Só é possível descarregar publicações públicas.`,
            age_restricted: 'O vídeo tem restrição de idade, por isso é preciso uma conta para o ver. Só é possível descarregar vídeos públicos.',
            engine_unavailable: 'O motor de transferência não está disponível neste momento. Tente mais tarde.',
            tools_not_configured: 'O descarregador de vídeos ainda não está aberto ao público.',
            tools_unreachable: 'O serviço de transferências não respondeu. Tente dentro de momentos.'
        }
    }
};

export const PDF_COPY = {
    en: {
        wordNote: 'Word (.docx) opens in Word, Pages and Google Docs. To convert, the PDF is sent to the Elysium server, which deletes it as soon as the Word file is ready.',
        errors: {
            ...COMMON.en,
            public_tools_disabled: 'Word conversion is not open to the public yet. Editing pages works as usual.',
            engine_unavailable: 'Word conversion is not available right now. Try again later.',
            tools_not_configured: 'Word conversion is not open to the public yet.',
            tools_unreachable: 'The conversion service did not answer. Try again in a moment.'
        }
    },
    es: {
        wordNote: 'El Word (.docx) se abre en Word, Pages y Google Docs. Para convertir, el PDF se envía al servidor de Elysium, que lo borra en cuanto el Word está listo.',
        errors: {
            ...COMMON.es,
            public_tools_disabled: 'La conversión a Word todavía no está abierta al público. La edición de páginas funciona igual.',
            engine_unavailable: 'La conversión a Word no está disponible en este momento. Inténtalo más tarde.',
            tools_not_configured: 'La conversión a Word todavía no está abierta al público.',
            tools_unreachable: 'El servicio de conversión no respondió. Inténtalo en un momento.'
        }
    },
    pt: {
        wordNote: 'O Word (.docx) abre no Word, no Pages e no Google Docs. Para converter, o PDF é enviado para o servidor da Elysium, que o apaga assim que o Word está pronto.',
        errors: {
            ...COMMON.pt,
            public_tools_disabled: 'A conversão para Word ainda não está aberta ao público. A edição de páginas funciona na mesma.',
            engine_unavailable: 'A conversão para Word não está disponível neste momento. Tente mais tarde.',
            tools_not_configured: 'A conversão para Word ainda não está aberta ao público.',
            tools_unreachable: 'O serviço de conversão não respondeu. Tente dentro de momentos.'
        }
    }
};

/** Pone `overrides` encima de `target`, idioma a idioma y clave a clave. */
export function mergeCopy(target, overrides) {
    const merge = (into, from) => {
        for (const [key, value] of Object.entries(from)) {
            if (value && typeof value === 'object' && !Array.isArray(value) && into[key] && typeof into[key] === 'object') {
                merge(into[key], value);
            } else {
                into[key] = value;
            }
        }
    };
    for (const [language, values] of Object.entries(overrides)) {
        if (target[language]) merge(target[language], values);
    }
    return target;
}

/* ── Turnstile ───────────────────────────────────────────────────────────── */

let _widget = null;   // Promise<{ turnstile, widgetId }>
let _pending = null;  // { resolve, reject } del token que se está pidiendo
let _used = false;    // el widget ya entregó un token: hay que reiniciarlo
let _queue = Promise.resolve();

function humanError(code) {
    return Object.assign(new Error(code), { code });
}

function abortReason(signal) {
    return signal.reason ?? Object.assign(new Error('Aborted'), { name: 'AbortError' });
}

async function siteKey() {
    let response;
    try {
        response = await fetch(CONFIG_URL, { cache: 'no-store' });
    } catch {
        throw humanError('connection');
    }
    const config = response.ok ? await response.json().catch(() => ({})) : {};
    if (!config.turnstileSiteKey) throw humanError(response.ok ? 'public_tools_disabled' : 'tools_unreachable');
    return config.turnstileSiteKey;
}

function loadScript() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = TURNSTILE_URL;
        script.async = true;
        script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(humanError('turnstile_unavailable')));
        script.onerror = () => {
            script.remove();
            reject(humanError('turnstile_unavailable'));
        };
        document.head.append(script);
    });
}

async function createWidget() {
    const [sitekey, turnstile] = await Promise.all([siteKey(), loadScript()]);
    let container = document.getElementById('tools-human-check');
    if (!container) {
        container = document.createElement('div');
        container.id = 'tools-human-check';
        container.className = 'tools-human-check';
        document.body.append(container);
    }
    const widgetId = turnstile.render(container, {
        sitekey,
        action: 'tools',
        execution: 'execute',
        appearance: 'interaction-only',
        language: String(document.documentElement.lang || 'en').slice(0, 2),
        'refresh-expired': 'manual',
        callback: token => _pending?.resolve(token),
        'error-callback': () => {
            _pending?.reject(humanError('turnstile_failed'));
            return true;
        },
        'timeout-callback': () => _pending?.reject(humanError('turnstile_failed')),
        'unsupported-callback': () => _pending?.reject(humanError('turnstile_unavailable'))
    });
    return { turnstile, widgetId };
}

function widget() {
    if (!_widget) {
        _widget = createWidget();
        // Un fallo (sin red, sin clave) no se queda guardado: se reintenta.
        _widget.catch(() => { _widget = null; });
    }
    return _widget;
}

async function requestToken(signal) {
    if (signal?.aborted) throw abortReason(signal);
    const { turnstile, widgetId } = await widget();
    return new Promise((resolve, reject) => {
        const settle = (handler, value) => {
            _pending = null;
            _used = true;
            window.clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
            handler(value);
        };
        const onAbort = () => settle(reject, abortReason(signal));
        const timer = window.setTimeout(() => settle(reject, humanError('turnstile_failed')), TOKEN_TIMEOUT_MS);
        signal?.addEventListener('abort', onAbort, { once: true });
        _pending = { resolve: token => settle(resolve, token), reject: error => settle(reject, error) };
        if (_used) turnstile.reset(widgetId);
        turnstile.execute(widgetId);
    });
}

/**
 * Un token de Turnstile nuevo. Las peticiones se atienden de una en una: hay
 * un solo widget y cada token se gasta en una operación.
 */
export function humanToken({ signal } = {}) {
    const attempt = _queue.then(() => requestToken(signal));
    _queue = attempt.catch(() => {});
    return attempt;
}

/**
 * Carga Turnstile en cuanto alguien empieza a usar `element` (foco, toque o
 * arrastre), para que el primer token no espere a la descarga del script.
 */
export function prepareOnUse(element) {
    if (!element) return;
    const events = ['focusin', 'pointerdown', 'dragenter'];
    const warm = () => {
        events.forEach(type => element.removeEventListener(type, warm));
        widget().catch(() => {});
    };
    events.forEach(type => element.addEventListener(type, warm, { passive: true }));
}
