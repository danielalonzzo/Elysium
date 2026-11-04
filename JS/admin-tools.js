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
 * YouTube, desde el servidor, solo descarga con una sesión iniciada: «Cuenta
 * de YouTube» (`/youtube/session`) sube el cookies.txt de quien descarga, ya
 * filtrado aquí a youtube.com, y el servicio lo guarda cifrado. El navegador
 * nunca vuelve a ver esas cookies: solo de qué cuenta son y cuándo se usaron.
 *
 * El texto sigue el patrón de `admin-research.js`: diccionario propio, idioma
 * de `<html lang>` y repintado con el evento `elysium:language` de `admin.js`.
 */
// En tools.elysiumdr.eu el Worker comprueba sesión y licencia; este módulo
// añade Turnstile y textos de Tools mediante `tools-public.js`.
import { videoRecovery } from './tools-video-recovery.js';
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
            bot_check: ({ platform }) => `${platform} blocked this automated request with a bot check. This link cannot be downloaded by the service.`,
            age_restricted: 'The video is age-restricted. Open it on the original platform with an authorized account.',
            private: 'The video is private.',
            geo_blocked: 'The video is not available in the server region.',
            login_required: ({ platform }) => `${platform} requires an authorized account for this link. Open it on the original platform.`,
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
            failed: 'The video could not be downloaded.',
            youtube_session_required: 'YouTube only lets the server download with a signed-in account. Connect your YouTube account and try again.',
            youtube_session_expired: 'The connected YouTube session is no longer valid: it was closed or renewed in the browser. Connect it again.',
            youtube_still_blocked: 'YouTube kept blocking the request even with your account connected. Export the session again from a private window, or try later.'
        },
        thePlatform: 'The platform',
        youtube: {
            title: 'YouTube account',
            none: 'Not connected. From the server, YouTube only allows downloads with a signed-in account.',
            connectedAs: (who, date) => `Connected: ${who} · since ${date}`,
            connected: date => `Connected since ${date}`,
            lastUsed: when => `last used ${when}`,
            expired: 'The session expired: YouTube closed it or the browser renewed it. Connect it again.',
            unknownAccount: 'YouTube account',
            connect: 'Connect',
            replace: 'Replace',
            disconnect: 'Disconnect',
            reconnect: 'Connect again',
            confirmDisconnect: 'Disconnect this YouTube account? The saved session will be deleted.',
            formTitle: 'Connect your YouTube account',
            why: 'Google does not offer a sign-in button that lets a server download videos, so the session comes from your browser in a cookies.txt file, the one yt-dlp uses.',
            steps: [
                'On a computer, open a private window in Chrome or Firefox and sign in to YouTube. A secondary account is best: YouTube may limit accounts that download from servers.',
                'Install the “Get cookies.txt LOCALLY” extension and allow it in private windows:',
                'With youtube.com open, click the extension and choose “Export”: a cookies.txt file is saved.',
                'Close the private window without signing out: signing out ends the exported session.',
                'Upload the file here.'
            ],
            phone: 'Cookies cannot be exported from an iPhone or iPad: do it once from a computer, then download from any device.',
            choose: 'cookies.txt file',
            found: count => `${count} youtube.com cookie${count === 1 ? '' : 's'} ready`,
            paste: 'Or paste the file content',
            privacy: 'Only the youtube.com cookies leave your browser. Elysium stores them encrypted, uses them only for your YouTube downloads and never shows them again. Disconnecting deletes them; to revoke them completely, sign that session out in your Google account (Security → Your devices).',
            submit: 'Connect',
            submitting: 'Checking with YouTube…',
            cancel: 'Cancel',
            guide: 'yt-dlp guide',
            recoveryConnect: 'Connect YouTube account',
            recoveryReconnect: 'Connect YouTube again',
            watch: 'Open in YouTube',
            errors: {
                empty: 'Choose the cookies.txt file or paste its content.',
                youtube_cookies_missing: 'The file has no youtube.com cookies. Export them with youtube.com open.',
                youtube_cookies_invalid: 'This is not a cookies.txt (Netscape) file or a JSON cookie export.',
                youtube_cookies_signed_out: 'The file has no signed-in YouTube session. Export the cookies with your session open on youtube.com.',
                youtube_session_rejected: 'YouTube does not recognize this session: it was probably closed or renewed in the browser. Repeat the export in a new private window.',
                youtube_check_failed: 'YouTube could not be reached to check the session. Try again in a moment.',
                youtube_cookies_too_large: 'The file is too large. Export only the youtube.com cookies.',
                youtube_unavailable: 'Connecting YouTube accounts is not available right now.',
                failed: 'The account could not be connected. Try again.'
            }
        }
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
            bot_check: ({ platform }) => `${platform} ha bloqueado esta solicitud automatizada con una comprobación contra bots. El servicio no puede descargar este enlace.`,
            age_restricted: 'El video tiene restricción de edad. Ábrelo en la plataforma original con una cuenta autorizada.',
            private: 'El video es privado.',
            geo_blocked: 'El video no está disponible en la región del servidor.',
            login_required: ({ platform }) => `${platform} requiere una cuenta autorizada para este enlace. Ábrelo en la plataforma original.`,
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
            failed: 'No se pudo descargar el video.',
            youtube_session_required: 'YouTube solo deja descargar al servidor con una cuenta con la sesión iniciada. Conecta tu cuenta de YouTube y vuelve a intentarlo.',
            youtube_session_expired: 'La sesión de YouTube conectada ya no es válida: se cerró o se renovó en el navegador. Vuelve a conectarla.',
            youtube_still_blocked: 'YouTube siguió bloqueando la solicitud aunque tu cuenta está conectada. Vuelve a exportar la sesión desde una ventana privada o inténtalo más tarde.'
        },
        thePlatform: 'La plataforma',
        youtube: {
            title: 'Cuenta de YouTube',
            none: 'Sin conectar. Desde el servidor, YouTube solo deja descargar con una cuenta con la sesión iniciada.',
            connectedAs: (who, date) => `Conectada: ${who} · desde el ${date}`,
            connected: date => `Conectada desde el ${date}`,
            lastUsed: when => `último uso: ${when}`,
            expired: 'La sesión caducó: YouTube la cerró o el navegador la renovó. Vuelve a conectarla.',
            unknownAccount: 'Cuenta de YouTube',
            connect: 'Conectar',
            replace: 'Reemplazar',
            disconnect: 'Desconectar',
            reconnect: 'Volver a conectar',
            confirmDisconnect: '¿Desconectar esta cuenta de YouTube? Se borrará la sesión guardada.',
            formTitle: 'Conecta tu cuenta de YouTube',
            why: 'Google no ofrece un botón de inicio de sesión que permita a un servidor descargar videos, así que la sesión se trae desde tu navegador en un archivo cookies.txt, el que usa yt-dlp.',
            steps: [
                'En una computadora, abre una ventana privada de Chrome o Firefox e inicia sesión en YouTube. Mejor con una cuenta secundaria: YouTube puede limitar las cuentas que descargan desde servidores.',
                'Instala la extensión «Get cookies.txt LOCALLY» y permite que funcione en ventanas privadas:',
                'Con youtube.com abierto, pulsa la extensión y elige «Export»: se guarda un archivo cookies.txt.',
                'Cierra la ventana privada sin cerrar sesión: si cierras sesión, la sesión exportada deja de valer.',
                'Sube aquí el archivo.'
            ],
            phone: 'Desde un iPhone o un iPad no se pueden exportar cookies: hazlo una vez desde una computadora y después descarga desde cualquier dispositivo.',
            choose: 'Archivo cookies.txt',
            found: count => `${count} cookie${count === 1 ? '' : 's'} de youtube.com ${count === 1 ? 'lista' : 'listas'}`,
            paste: 'O pega el contenido del archivo',
            privacy: 'Solo salen de tu navegador las cookies de youtube.com. Elysium las guarda cifradas, las usa solo para tus descargas de YouTube y no vuelve a mostrarlas. Desconectar las borra; para revocarlas del todo, cierra esa sesión en tu cuenta de Google (Seguridad → Tus dispositivos).',
            submit: 'Conectar',
            submitting: 'Comprobando con YouTube…',
            cancel: 'Cancelar',
            guide: 'Guía de yt-dlp',
            recoveryConnect: 'Conectar cuenta de YouTube',
            recoveryReconnect: 'Volver a conectar YouTube',
            watch: 'Abrir en YouTube',
            errors: {
                empty: 'Elige el archivo cookies.txt o pega su contenido.',
                youtube_cookies_missing: 'El archivo no trae cookies de youtube.com. Expórtalas con youtube.com abierto.',
                youtube_cookies_invalid: 'No es un archivo cookies.txt (Netscape) ni una exportación de cookies en JSON.',
                youtube_cookies_signed_out: 'El archivo no trae una sesión de YouTube iniciada. Exporta las cookies con la sesión abierta en youtube.com.',
                youtube_session_rejected: 'YouTube no reconoce esta sesión: probablemente se cerró o se renovó en el navegador. Repite la exportación en una ventana privada nueva.',
                youtube_check_failed: 'No se pudo contactar con YouTube para comprobar la sesión. Inténtalo en un momento.',
                youtube_cookies_too_large: 'El archivo es demasiado grande. Exporta solo las cookies de youtube.com.',
                youtube_unavailable: 'La conexión de cuentas de YouTube no está disponible en este momento.',
                failed: 'No se pudo conectar la cuenta. Inténtalo de nuevo.'
            }
        }
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
            bot_check: ({ platform }) => `${platform} bloqueou este pedido automatizado com uma verificação contra bots. O serviço não consegue transferir esta ligação.`,
            age_restricted: 'O vídeo tem restrição de idade. Abra-o na plataforma original com uma conta autorizada.',
            private: 'O vídeo é privado.',
            geo_blocked: 'O vídeo não está disponível na região do servidor.',
            login_required: ({ platform }) => `${platform} exige uma conta autorizada para esta ligação. Abra-a na plataforma original.`,
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
            failed: 'Não foi possível transferir o vídeo.',
            youtube_session_required: 'O YouTube só deixa o servidor transferir com uma conta com sessão iniciada. Ligue a sua conta do YouTube e tente novamente.',
            youtube_session_expired: 'A sessão do YouTube ligada já não é válida: foi terminada ou renovada no navegador. Volte a ligá-la.',
            youtube_still_blocked: 'O YouTube continuou a bloquear o pedido, mesmo com a sua conta ligada. Volte a exportar a sessão numa janela privada ou tente mais tarde.'
        },
        thePlatform: 'A plataforma',
        youtube: {
            title: 'Conta do YouTube',
            none: 'Sem ligação. A partir do servidor, o YouTube só deixa transferir com uma conta com sessão iniciada.',
            connectedAs: (who, date) => `Ligada: ${who} · desde ${date}`,
            connected: date => `Ligada desde ${date}`,
            lastUsed: when => `última utilização: ${when}`,
            expired: 'A sessão expirou: o YouTube terminou-a ou o navegador renovou-a. Volte a ligá-la.',
            unknownAccount: 'Conta do YouTube',
            connect: 'Ligar',
            replace: 'Substituir',
            disconnect: 'Desligar',
            reconnect: 'Voltar a ligar',
            confirmDisconnect: 'Desligar esta conta do YouTube? A sessão guardada será apagada.',
            formTitle: 'Ligue a sua conta do YouTube',
            why: 'A Google não oferece um botão de início de sessão que permita a um servidor transferir vídeos, por isso a sessão vem do seu navegador num ficheiro cookies.txt, o que o yt-dlp utiliza.',
            steps: [
                'Num computador, abra uma janela privada do Chrome ou do Firefox e inicie sessão no YouTube. De preferência com uma conta secundária: o YouTube pode limitar as contas que transferem a partir de servidores.',
                'Instale a extensão «Get cookies.txt LOCALLY» e permita que funcione em janelas privadas:',
                'Com youtube.com aberto, clique na extensão e escolha «Export»: é guardado um ficheiro cookies.txt.',
                'Feche a janela privada sem terminar sessão: se terminar sessão, a sessão exportada deixa de valer.',
                'Carregue aqui o ficheiro.'
            ],
            phone: 'Num iPhone ou iPad não é possível exportar cookies: faça-o uma vez num computador e depois transfira a partir de qualquer dispositivo.',
            choose: 'Ficheiro cookies.txt',
            found: count => `${count} cookie${count === 1 ? '' : 's'} de youtube.com ${count === 1 ? 'pronto' : 'prontos'}`,
            paste: 'Ou cole o conteúdo do ficheiro',
            privacy: 'Só saem do seu navegador os cookies de youtube.com. A Elysium guarda-os cifrados, usa-os apenas para as suas transferências do YouTube e não os volta a mostrar. Desligar apaga-os; para os revogar por completo, termine essa sessão na sua conta Google (Segurança → Os seus dispositivos).',
            submit: 'Ligar',
            submitting: 'A verificar com o YouTube…',
            cancel: 'Cancelar',
            guide: 'Guia do yt-dlp',
            recoveryConnect: 'Ligar conta do YouTube',
            recoveryReconnect: 'Voltar a ligar o YouTube',
            watch: 'Abrir no YouTube',
            errors: {
                empty: 'Escolha o ficheiro cookies.txt ou cole o seu conteúdo.',
                youtube_cookies_missing: 'O ficheiro não traz cookies de youtube.com. Exporte-os com youtube.com aberto.',
                youtube_cookies_invalid: 'Não é um ficheiro cookies.txt (Netscape) nem uma exportação de cookies em JSON.',
                youtube_cookies_signed_out: 'O ficheiro não traz uma sessão do YouTube iniciada. Exporte os cookies com a sessão aberta em youtube.com.',
                youtube_session_rejected: 'O YouTube não reconhece esta sessão: provavelmente foi terminada ou renovada no navegador. Repita a exportação numa nova janela privada.',
                youtube_check_failed: 'Não foi possível contactar o YouTube para verificar a sessão. Tente dentro de momentos.',
                youtube_cookies_too_large: 'O ficheiro é demasiado grande. Exporte apenas os cookies de youtube.com.',
                youtube_unavailable: 'A ligação de contas do YouTube não está disponível neste momento.',
                failed: 'Não foi possível ligar a conta. Tente novamente.'
            }
        }
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
// La cuenta de YouTube de quien usa la herramienta. `enabled` lo dice el
// servicio (`/capabilities`): sin clave ni bucket, la sección no se enseña.
const _youtube = { enabled: false, loaded: false, connected: false, status: null, account: null, connectedAt: null,
    lastUsedAt: null, open: false, busy: false, error: null, file: null, retryUrl: null };
const YOUTUBE_SESSION_CODES = new Set(['youtube_session_required', 'youtube_session_expired']);
const YOUTUBE_MAX_UPLOAD = 48 * 1024;
const YOUTUBE_LINKS = Object.freeze({
    chrome: 'https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc',
    firefox: 'https://addons.mozilla.org/firefox/addon/get-cookies-txt-locally/',
    guide: 'https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies'
});

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

function isYoutubeError(error = {}) {
    return String(error.platform || '').toLowerCase() === 'youtube' || YOUTUBE_SESSION_CODES.has(error.code);
}

function errorMessage(error = {}) {
    const text = copy();
    // Con la cuenta conectada, un bloqueo de YouTube no se arregla conectándola.
    const code = error.code === 'bot_check' && _youtube.connected && _youtube.status === 'active' && isYoutubeError(error)
        ? 'youtube_still_blocked' : error.code;
    const entry = text.errors[code] || text.errors.failed;
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
        // La sesión de Tools viaja en cookie HttpOnly; cada POST o PUT añade Turnstile.
        if (method === 'POST' || method === 'PUT') headers['X-Turnstile-Token'] = await PUBLIC.humanToken({ signal });
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
            _youtube.enabled = _engine?.youtubeSessions === true;
            if (_youtube.enabled && !_youtube.loaded) loadYoutube();
            renderYoutube();
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
        showAlert(controller.signal.reason === 'timeout' ? { code: 'timeout' } : { ...errorInfo(error), sourceUrl: rawUrl });
        if (error?.code === 'youtube_session_expired') loadYoutube();
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

/** Un fallo de YouTube que se arregla con la sesión ofrece conectarla ahí mismo. */
function recoveryMarkup(error, sourceUrl) {
    const recovery = videoRecovery(error, { sourceUrl, youtubeSessions: _youtube.enabled });
    if (!recovery) return '';
    const text = copy().youtube;
    const connect = recovery.connect
        ? `<button type="button" class="btn btn-primary tools-btn-compact" data-youtube-action="open">${esc(_youtube.connected ? text.recoveryReconnect : text.recoveryConnect)}</button>`
        : '';
    const watch = recovery.watchUrl
        ? `<a class="btn btn-secondary tools-btn-compact" href="${esc(recovery.watchUrl)}" target="_blank" rel="noopener noreferrer">${esc(text.watch)} ↗</a>`
        : '';
    return connect || watch ? `<div class="tools-recovery"><div class="tools-recovery-actions">${connect}${watch}</div></div>` : '';
}

function showAlert(error) {
    _alert = error;
    const element = document.getElementById('tools-video-alert');
    if (!element) return;
    const detail = error.detail && !hidesDetail(error)
        ? `<details class="tools-alert-detail"><summary>${esc(copy().detail)}</summary><code translate="no">${esc(error.detail)}</code></details>`
        : '';
    element.innerHTML = `<p>${esc(errorMessage(error))}</p>${recoveryMarkup(error, error.sourceUrl)}${detail}`;
    element.hidden = false;
}

// El texto de yt-dlp para estos casos pide «--cookies»: aquí no ayuda a nadie.
function hidesDetail(error) {
    return error?.code === 'bot_check' || YOUTUBE_SESSION_CODES.has(error?.code);
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
    } else if (job.error?.code !== 'bot_check' || isYoutubeError(job.error)) {
        // Con YouTube, tras conectar la cuenta, reintentar sí sirve.
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
    const detail = job.state === 'error' && job.error?.detail && !hidesDetail(job.error)
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
            ${job.state === 'error' ? recoveryMarkup(job.error, job.media.url || job.request?.url) : ''}
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
            // La sesión de YouTube acaba de usarse: la tarjeta lo dice.
            if (job.media.platform?.id === 'youtube' && _youtube.connected) loadYoutube();
            break;
        case 'error':
            job.state = 'error';
            job.error = { code: event.code, detail: event.detail || null, platform: event.platform || job.media.platform?.name };
            announce(copy().announceError(job.media.title || copy().untitled));
            if (event.code === 'youtube_session_expired') loadYoutube();
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

/* ── Cuenta de YouTube ───────────────────────────────────────────────────── */

const YOUTUBE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3Z"/></svg>';

function isYoutubeHost(domain) {
    const host = String(domain || '').trim().toLowerCase().replace(/^\./, '');
    return host === 'youtube.com' || host.endsWith('.youtube.com');
}

/**
 * Del fichero elegido solo sale lo de youtube.com: una exportación del
 * navegador entero lleva las sesiones de todas las webs, y esas no se suben.
 * `count` es -1 si no parece una exportación de cookies.
 */
function youtubeOnly(raw) {
    const text = String(raw || '').replace(/^﻿/, '').trim();
    if (/^[[{]/.test(text)) {
        try {
            const data = JSON.parse(text);
            const list = Array.isArray(data) ? data : Array.isArray(data?.cookies) ? data.cookies : null;
            if (!list) return { text: '', count: -1 };
            const kept = list.filter(entry => entry && isYoutubeHost(entry.domain));
            return { text: JSON.stringify(kept), count: kept.length };
        } catch {
            return { text: '', count: -1 };
        }
    }
    // Las HttpOnly llevan `#HttpOnly_` delante: no son comentarios.
    const rows = text.split(/\r?\n/)
        .filter(line => line.startsWith('#HttpOnly_') || !line.startsWith('#'))
        .filter(line => line.split('\t').length >= 6);
    if (!rows.length) return { text: '', count: -1 };
    const kept = rows.filter(line => isYoutubeHost(line.replace(/^#HttpOnly_/, '').split('\t')[0]));
    return { text: ['# Netscape HTTP Cookie File', ...kept, ''].join('\n'), count: kept.length };
}

function applyYoutube(payload = {}) {
    Object.assign(_youtube, {
        loaded: true,
        enabled: _youtube.enabled && payload.ready !== false,
        connected: payload.connected === true,
        status: payload.status || null,
        account: payload.account || null,
        connectedAt: payload.connectedAt || null,
        lastUsedAt: payload.lastUsedAt || null
    });
}

async function loadYoutube() {
    if (!_authorized || !_youtube.enabled) return;
    try {
        const response = await toolsFetch('/youtube/session', { method: 'GET' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw toolsError(payload, response.status);
        applyYoutube(payload);
    } catch {
        // Sin respuesta, la sección se queda como estaba; el próximo /capabilities lo reintenta.
    }
    renderYoutube();
}

function formatDay(value) {
    return new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short' }).format(new Date(value));
}

function formatWhen(value) {
    return new Date(value).toDateString() === new Date().toDateString() ? formatClock(value) : formatDay(value);
}

function youtubeStatusLine(text) {
    if (!_youtube.connected) return text.none;
    if (_youtube.status !== 'active') return text.expired;
    const { name, handle } = _youtube.account || {};
    const who = [name, handle && handle !== name ? `(${handle})` : ''].filter(Boolean).join(' ');
    const since = _youtube.connectedAt ? formatDay(_youtube.connectedAt) : '';
    const line = who ? text.connectedAs(who, since) : text.connected(since);
    return _youtube.lastUsedAt ? `${line} · ${text.lastUsed(formatWhen(_youtube.lastUsedAt))}` : line;
}

function youtubeFormMarkup(text) {
    const { busy, file } = _youtube;
    const error = _youtube.error ? text.errors[_youtube.error] || copy().errors[_youtube.error] || text.errors.failed : '';
    const disabled = busy ? ' disabled' : '';
    const link = (url, label) => `<a href="${url}" target="_blank" rel="noopener noreferrer" translate="no">${esc(label)} ↗</a>`;
    return `<form class="tools-youtube-connect" id="tools-youtube-form" novalidate aria-labelledby="tools-youtube-form-title" aria-busy="${busy ? 'true' : 'false'}">
        <h3 id="tools-youtube-form-title" tabindex="-1">${esc(text.formTitle)}</h3>
        <p>${esc(text.why)}</p>
        <ol class="tools-youtube-steps">
            ${text.steps.map((step, index) => `<li>${esc(step)}${index === 1 ? ` ${link(YOUTUBE_LINKS.chrome, 'Chrome')} · ${link(YOUTUBE_LINKS.firefox, 'Firefox')}` : ''}</li>`).join('')}
        </ol>
        <p class="tools-youtube-note">${esc(text.phone)} <a href="${YOUTUBE_LINKS.guide}" target="_blank" rel="noopener noreferrer">${esc(text.guide)} ↗</a></p>
        <div class="tools-youtube-file">
            <label for="tools-youtube-file">${esc(text.choose)}</label>
            <input type="file" id="tools-youtube-file" accept=".txt,.json,text/plain,application/json"${disabled}>
            ${file ? `<small translate="no">${esc(file.name)} · ${esc(text.found(file.count))}</small>` : ''}
        </div>
        <details class="tools-youtube-paste"${_youtube.pasted ? ' open' : ''}>
            <summary>${esc(text.paste)}</summary>
            <textarea id="tools-youtube-text" rows="4" spellcheck="false" autocomplete="off" translate="no" aria-label="${esc(text.paste)}"${disabled}>${esc(_youtube.pasted)}</textarea>
        </details>
        <p class="tools-youtube-note">${esc(text.privacy)}</p>
        <p class="tools-youtube-error" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>
        <div class="tools-youtube-form-actions">
            <button type="submit" class="btn btn-primary"${disabled}>${esc(busy ? text.submitting : text.submit)}</button>
            <button type="button" class="btn btn-secondary" data-youtube-action="cancel"${disabled}>${esc(text.cancel)}</button>
        </div>
    </form>`;
}

function renderYoutube() {
    const host = document.getElementById('tools-youtube');
    if (!host) return;
    const visible = _authorized && _youtube.enabled && _youtube.loaded;
    host.hidden = !visible;
    if (!visible) {
        host.innerHTML = '';
        return;
    }
    const text = copy().youtube;
    const state = !_youtube.connected ? 'none' : _youtube.status === 'active' ? 'active' : 'expired';
    const button = (action, label, kind = 'secondary') => `<button type="button" class="btn btn-${kind} tools-btn-compact" data-youtube-action="${action}"${_youtube.busy ? ' disabled' : ''}>${esc(label)}</button>`;
    const actions = state === 'none' ? [button('open', text.connect, 'primary')]
        : state === 'active' ? [button('open', text.replace), button('disconnect', text.disconnect)]
            : [button('open', text.reconnect, 'primary'), button('disconnect', text.disconnect)];
    host.innerHTML = `<div class="tools-youtube-card is-${state}">
            <span class="tools-youtube-icon">${YOUTUBE_ICON}</span>
            <div class="tools-youtube-text"><strong>${esc(text.title)}</strong><span>${esc(youtubeStatusLine(text))}</span></div>
            <div class="tools-youtube-actions">${_youtube.open ? '' : actions.join('')}</div>
        </div>${_youtube.open ? youtubeFormMarkup(text) : ''}`;
}

function openYoutube() {
    if (!_youtube.enabled) return;
    Object.assign(_youtube, { open: true, error: null });
    renderYoutube();
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('tools-youtube')?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    document.getElementById('tools-youtube-form-title')?.focus({ preventScroll: true });
}

function closeYoutube() {
    Object.assign(_youtube, { open: false, busy: false, error: null, file: null, pasted: '' });
    renderYoutube();
}

async function readYoutubeFile(input) {
    const chosen = input.files?.[0];
    if (!chosen) return;
    // Una exportación del navegador entero puede pesar varios megas: se lee aquí
    // y solo sube lo de youtube.com.
    const filtered = chosen.size > 8 * 1024 * 1024 ? { count: -1 } : youtubeOnly(await chosen.text());
    _youtube.file = filtered.count > 0 ? { name: chosen.name, text: filtered.text, count: filtered.count } : null;
    _youtube.error = filtered.count > 0 ? null : filtered.count < 0 ? 'youtube_cookies_invalid' : 'youtube_cookies_missing';
    renderYoutube();
}

async function connectYoutube() {
    if (_youtube.busy) return;
    // Lo pegado manda sobre el fichero: es lo último que se ha tocado.
    const source = _youtube.pasted.trim() ? youtubeOnly(_youtube.pasted) : _youtube.file;
    const problem = !source ? 'empty' : source.count < 0 ? 'youtube_cookies_invalid' : source.count === 0 ? 'youtube_cookies_missing'
        : source.text.length > YOUTUBE_MAX_UPLOAD ? 'youtube_cookies_too_large' : null;
    if (problem) {
        _youtube.error = problem;
        renderYoutube();
        return;
    }
    Object.assign(_youtube, { busy: true, error: null });
    renderYoutube();
    try {
        const response = await toolsFetch('/youtube/session', { method: 'PUT', body: { cookies: source.text } });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw toolsError(payload, response.status);
        applyYoutube(payload);
        closeYoutube();
        // El enlace que pedía la cuenta se vuelve a analizar solo.
        if (_alert?.sourceUrl && isYoutubeError(_alert)) inspect(_alert.sourceUrl);
    } catch (error) {
        Object.assign(_youtube, { busy: false, error: errorInfo(error).code });
        renderYoutube();
    }
}

async function disconnectYoutube() {
    if (_youtube.busy || !window.confirm(copy().youtube.confirmDisconnect)) return;
    _youtube.busy = true;
    renderYoutube();
    try {
        const response = await toolsFetch('/youtube/session', { method: 'DELETE' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw toolsError(payload, response.status);
        applyYoutube(payload);
    } catch (error) {
        showAlert(errorInfo(error));
    } finally {
        _youtube.busy = false;
        renderYoutube();
    }
}

function bindYoutube() {
    const host = document.getElementById('tools-youtube');
    if (!host) return;
    host.addEventListener('click', event => {
        const action = event.target.closest('[data-youtube-action]')?.dataset.youtubeAction;
        if (action === 'open') openYoutube();
        else if (action === 'cancel') closeYoutube();
        else if (action === 'disconnect') disconnectYoutube();
    });
    host.addEventListener('change', event => {
        if (event.target.id === 'tools-youtube-file') readYoutubeFile(event.target);
    });
    host.addEventListener('input', event => {
        if (event.target.id === 'tools-youtube-text') _youtube.pasted = event.target.value;
    });
    host.addEventListener('submit', event => {
        if (event.target.id !== 'tools-youtube-form') return;
        event.preventDefault();
        connectYoutube();
    });
    // «Conectar cuenta de YouTube» también sale en el aviso y en cada descarga fallida.
    for (const id of ['tools-video-alert', 'tools-video-job-list']) {
        document.getElementById(id)?.addEventListener('click', event => {
            if (event.target.closest('[data-youtube-action="open"]')) openYoutube();
        });
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
    renderYoutube();
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
    bindYoutube();
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
