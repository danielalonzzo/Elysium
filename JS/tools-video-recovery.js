/**
 * Qué se ofrece cuando YouTube no deja descargar al servidor: conectar la
 * cuenta de YouTube de quien descarga (si el servicio lo admite, ver
 * `backend/tools/youtube-session.js`) y abrir el video en YouTube. Los textos
 * están en el diccionario de `admin-tools.js`; aquí solo se decide.
 */
const CONNECTABLE = new Set(['youtube_session_required', 'youtube_session_expired', 'bot_check', 'login_required', 'age_restricted']);

/** Only reconstruct a public watch URL; never forward credentials or arbitrary destinations. */
export function youtubeWatchUrl(rawUrl) {
    try {
        const value = String(rawUrl || '').trim();
        const match = value.match(/https?:\/\/[^\s<>"']+/i);
        const url = new URL(match?.[0] || (/^[\w.-]+\//.test(value) ? `https://${value}` : value));
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null;
        const host = url.hostname.toLowerCase();
        const youtube = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'];
        let id;
        if (['youtu.be', 'www.youtu.be'].includes(host)) id = url.pathname.split('/')[1];
        else if (youtube.includes(host)) id = url.pathname === '/watch' ? url.searchParams.get('v')
            : /^\/(?:shorts|live|embed)\/([^/]+)/.exec(url.pathname)?.[1];
        if (!/^[A-Za-z0-9_-]{11}$/.test(id || '')) return null;
        return `https://www.youtube.com/watch?v=${id}`;
    } catch { return null; }
}

/** `{ connect, watchUrl }` para un fallo de YouTube que pide sesión; `null` para todo lo demás. */
export function videoRecovery(error, { sourceUrl = '', youtubeSessions = false } = {}) {
    if (!CONNECTABLE.has(error?.code)) return null;
    const watchUrl = youtubeWatchUrl(sourceUrl);
    const youtube = Boolean(watchUrl) || String(error.platform || '').toLowerCase() === 'youtube' || String(error.code).startsWith('youtube_');
    if (!youtube) return null;
    return { connect: youtubeSessions === true, watchUrl };
}
