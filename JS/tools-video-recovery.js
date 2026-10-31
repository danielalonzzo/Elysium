const COPY = {
    en: { explanation: 'A YouTube account does not enable server downloads through this bot check. For videos uploaded to your own channel, use YouTube Studio or export them with Google Takeout.',
        watch: 'Open in YouTube', studio: 'My videos in YouTube Studio', export: 'Export my videos', help: 'YouTube download instructions' },
    es: { explanation: 'Una cuenta de YouTube no habilita las descargas del servidor a través de esta comprobación. Si el vídeo pertenece a tu canal, recupéralo desde YouTube Studio o expórtalo con Google Takeout.',
        watch: 'Abrir en YouTube', studio: 'Mis vídeos en YouTube Studio', export: 'Exportar mis vídeos', help: 'Instrucciones de descarga de YouTube' },
    pt: { explanation: 'Uma conta do YouTube não ativa as transferências do servidor através desta verificação. Se o vídeo pertence ao seu canal, obtenha-o no YouTube Studio ou exporte-o com o Google Takeout.',
        watch: 'Abrir no YouTube', studio: 'Os meus vídeos no YouTube Studio', export: 'Exportar os meus vídeos', help: 'Instruções de transferência do YouTube' }
};

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

export function videoRecovery(error, { sourceUrl = '', language = 'en' } = {}) {
    if (error?.code !== 'bot_check') return null;
    const watch = youtubeWatchUrl(sourceUrl);
    if (!watch && String(error.platform || '').toLowerCase() !== 'youtube') return null;
    const lang = Object.hasOwn(COPY, language) ? language : 'en';
    const t = COPY[lang];
    return { explanation: t.explanation, links: [
        ...(watch ? [{ label: t.watch, url: watch }] : []),
        { label: t.studio, url: 'https://studio.youtube.com/' },
        { label: t.export, url: 'https://takeout.google.com/' },
        { label: t.help, url: `https://support.google.com/youtube/answer/56100?hl=${lang}` }
    ] };
}
