'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MARK,
  ProgressTracker,
  ToolInputError,
  buildDownloadArguments,
  buildInspectArguments,
  classifyFailure,
  formatArguments,
  isBlockedHostname,
  isPrivateAddress,
  mimeForFile,
  normalizeVideoUrl,
  parseMarkedLine,
  parseOptionId,
  parsePlaylistItem,
  pickThumbnailUrl,
  platformFor,
  postprocessStage,
  summarizeMedia,
  videoOptions
} = require('./video');
const media = require('./test-fixtures/media');

function inputError(fn, code) {
  assert.throws(fn, error => error instanceof ToolInputError && error.code === code);
}

/* ── Enlaces ─────────────────────────────────────────────────────────────── */

test('acepta enlaces sin esquema y el texto del botón «Compartir»', () => {
  assert.equal(normalizeVideoUrl('youtu.be/abc123def45'), 'https://youtu.be/abc123def45');
  assert.equal(
    normalizeVideoUrl('Mira este vídeo 😍 https://vm.tiktok.com/ZMabc123/ #receta'),
    'https://vm.tiktok.com/ZMabc123/'
  );
  assert.equal(
    normalizeVideoUrl('  https://www.instagram.com/reel/CWqAgUZgCku/?igsh=xyz#comments  '),
    'https://www.instagram.com/reel/CWqAgUZgCku/?igsh=xyz'
  );
});

test('rechaza lo que no es un enlace web', () => {
  inputError(() => normalizeVideoUrl(''), 'url_required');
  inputError(() => normalizeVideoUrl('   '), 'url_required');
  inputError(() => normalizeVideoUrl('no es un enlace'), 'url_invalid');
  inputError(() => normalizeVideoUrl('ftp://example.com/video.mp4'), 'url_invalid');
  inputError(() => normalizeVideoUrl('file:///etc/passwd'), 'url_invalid');
  inputError(() => normalizeVideoUrl('javascript:alert(1)'), 'url_invalid');
  inputError(() => normalizeVideoUrl('https://user:pass@example.com/v.mp4'), 'url_invalid');
  inputError(() => normalizeVideoUrl(`https://example.com/${'a'.repeat(2100)}`), 'url_invalid');
});

test('rechaza direcciones privadas, locales y el servidor de metadatos', () => {
  for (const url of [
    'http://localhost:8080/video',
    'http://127.0.0.1/video',
    'http://2130706433/video', // 127.0.0.1 en decimal
    'http://10.0.0.5/video',
    'http://172.20.1.1/video',
    'http://192.168.1.10/video',
    'http://169.254.169.254/computeMetadata/v1/',
    'http://metadata.google.internal/computeMetadata/v1/',
    'http://[::1]/video',
    'http://[::ffff:127.0.0.1]/video',
    'http://[fd00::1]/video',
    'http://intranet/video',
    'http://nas.local/video'
  ]) {
    inputError(() => normalizeVideoUrl(url), 'url_private');
  }
});

test('distingue las IP públicas de las privadas', () => {
  assert.equal(isPrivateAddress('93.184.216.34'), false);
  assert.equal(isPrivateAddress('2606:4700:4700::1111'), false);
  assert.equal(isPrivateAddress('100.64.0.1'), true);
  assert.equal(isPrivateAddress('::ffff:7f00:1'), true);
  assert.equal(isPrivateAddress('fe80::1'), true);
  assert.equal(isBlockedHostname('www.youtube.com'), false);
  assert.equal(isBlockedHostname('printer.lan'), true);
});

test('reconoce la plataforma por el dominio, también en enlaces cortos', () => {
  assert.deepEqual(platformFor('https://youtu.be/x'), { id: 'youtube', name: 'YouTube' });
  assert.deepEqual(platformFor('https://m.youtube.com/watch?v=x'), { id: 'youtube', name: 'YouTube' });
  assert.deepEqual(platformFor('https://vm.tiktok.com/ZM/'), { id: 'tiktok', name: 'TikTok' });
  assert.deepEqual(platformFor('https://twitter.com/a/status/1'), { id: 'x', name: 'X' });
  assert.deepEqual(platformFor('https://fb.watch/abc/'), { id: 'facebook', name: 'Facebook' });
  assert.deepEqual(platformFor('https://videos.example.org/v/1', 'PeerTube'), { id: 'peertube', name: 'PeerTube' });
  assert.deepEqual(platformFor('https://example.org/v.mp4', 'Generic'), { id: 'web', name: 'example.org' });
});

/* ── Opciones y argumentos ───────────────────────────────────────────────── */

test('solo admite las opciones que ofrece el servicio', () => {
  for (const option of ['v1080', 'v576', 'v2160', 'best', 'audio-mp3', 'audio-m4a']) {
    assert.equal(parseOptionId(option), option);
  }
  for (const option of ['', 'v10', 'v9999', 'bv*+ba', 'audio-wav', '--exec rm', undefined]) {
    inputError(() => parseOptionId(option), 'option_invalid');
  }
  assert.equal(parseOptionId(' v1080 '), 'v1080');
  assert.equal(parsePlaylistItem(undefined), null);
  assert.equal(parsePlaylistItem(3), 3);
  inputError(() => parsePlaylistItem(0), 'item_invalid');
  inputError(() => parsePlaylistItem('1;rm'), 'item_invalid');
});

test('las calidades se traducen a formatos con MP4 compatible', () => {
  assert.deepEqual(formatArguments('v1080'), [
    '--format', 'bv*+ba/b', '--format-sort', 'res:1080,vcodec:h264,acodec:aac', '--merge-output-format', 'mp4'
  ]);
  assert.deepEqual(formatArguments('best').slice(2, 4), ['--format-sort', 'vcodec:h264,acodec:aac']);
  assert.deepEqual(formatArguments('audio-mp3'), [
    '--format', 'ba/b', '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0'
  ]);
  assert.ok(formatArguments('audio-m4a').includes('m4a'));
});

test('el enlace va siempre detrás de «--» y cada descarga en su carpeta', () => {
  const url = 'https://www.youtube.com/watch?v=abc123def45';
  const settings = { jsRuntimes: 'deno', proxy: 'http://proxy.example:8080', maxBytes: 5000 };
  const args = buildDownloadArguments({ url, option: 'v720', outputDir: '/tmp/job-1', settings, cookiesPath: '/tmp/job-1/cookies.txt' });
  assert.equal(args.at(-1), url);
  assert.equal(args.at(-2), '--');
  assert.equal(args.indexOf(url), args.length - 1);
  assert.ok(args.includes('--no-playlist'));
  assert.ok(!args.includes('--playlist-items'));
  assert.deepEqual(args.slice(args.indexOf('--paths'), args.indexOf('--paths') + 4), ['--paths', '/tmp/job-1', '--paths', 'temp:/tmp/job-1']);
  assert.equal(args[args.indexOf('--max-filesize') + 1], '5000');
  assert.equal(args[args.indexOf('--js-runtimes') + 1], 'deno');
  assert.equal(args[args.indexOf('--cookies') + 1], '/tmp/job-1/cookies.txt');
  assert.equal(args[args.indexOf('--proxy') + 1], 'http://proxy.example:8080');
  assert.ok(args.some(value => value.startsWith(`download:${MARK.progress}`)));
  assert.ok(args.some(value => value.startsWith(`after_move:${MARK.file}`)));

  const item = buildDownloadArguments({ url, option: 'best', item: 2, outputDir: '/tmp/job-2' });
  assert.equal(item[item.indexOf('--playlist-items') + 1], '2');
  assert.ok(!item.includes('--no-playlist'));
  assert.ok(!item.includes('--cookies'));

  const inspect = buildInspectArguments(url, { jsRuntimes: 'node' });
  assert.deepEqual(inspect.slice(-2), ['--', url]);
  assert.ok(inspect.includes('--dump-single-json') && inspect.includes('--flat-playlist') && inspect.includes('--no-playlist'));
});

test('ofrece las resoluciones reales y recomienda 1080p', () => {
  const options = videoOptions(media.YOUTUBE_VIDEO);
  assert.deepEqual(options.map(option => option.id), ['v2160', 'v1440', 'v1080', 'v720', 'v360', 'audio-mp3', 'audio-m4a']);
  const byId = Object.fromEntries(options.map(option => [option.id, option]));
  assert.equal(byId.v1080.recommended, true);
  assert.equal(options.filter(option => option.recommended).length, 1);
  // 1080p en H.264 (137) más el mejor AAC (140).
  assert.equal(byId.v1080.codec, 'h264');
  assert.equal(byId.v1080.bytes, 42000000);
  // Por encima de 1080p YouTube solo tiene VP9.
  assert.equal(byId.v2160.codec, 'vp9');
  assert.equal(byId.v2160.bytes, 152000000);
  assert.equal(byId['audio-m4a'].bytes, 2000000);
  assert.equal(byId['audio-mp3'].bytes, Math.round(125 * 245000 / 8));
});

test('los vídeos verticales se nombran por su anchura', () => {
  const options = videoOptions(media.TIKTOK_VIDEO);
  assert.deepEqual(options.map(option => option.id), ['v720', 'v576', 'audio-mp3', 'audio-m4a']);
  assert.equal(options[0].codec, 'hevc');
  assert.equal(options[0].recommended, true);
  // El formato combinado ya trae audio: no se suma nada.
  assert.equal(options[0].bytes, 2500000);
  assert.equal(options[1].codec, 'h264');
});

test('sin dimensiones se ofrece «la mejor disponible»', () => {
  const options = videoOptions(media.UNDESCRIBED_VIDEO);
  assert.deepEqual(options.map(option => option.id), ['best', 'audio-mp3', 'audio-m4a']);
  assert.equal(options[0].recommended, true);
  assert.deepEqual(videoOptions({ formats: [] }), []);
});

test('resume un vídeo, una lista y un carrusel', () => {
  const video = summarizeMedia(media.YOUTUBE_VIDEO, 'https://youtu.be/abc123def45');
  assert.equal(video.kind, 'video');
  assert.deepEqual(video.platform, { id: 'youtube', name: 'YouTube' });
  assert.equal(video.url, 'https://www.youtube.com/watch?v=abc123def45');
  assert.equal(video.title, 'Clip de prueba');
  assert.equal(video.duration, 125);
  assert.equal(video.uploadDate, '2026-01-15');
  assert.equal(video.isLive, false);

  const playlist = summarizeMedia(media.YOUTUBE_PLAYLIST, 'https://www.youtube.com/playlist?list=PLtest');
  assert.equal(playlist.kind, 'playlist');
  assert.equal(playlist.entryCount, 12);
  assert.deepEqual(playlist.entries[0], { index: 1, title: 'Uno', duration: 60, url: 'https://www.youtube.com/watch?v=a1' });

  const carousel = summarizeMedia(media.INSTAGRAM_CAROUSEL, 'https://www.instagram.com/p/C1carousel/');
  assert.equal(carousel.kind, 'playlist');
  assert.equal(carousel.entries[1].index, 2);
  assert.equal(carousel.entries[1].url, undefined);
  assert.deepEqual(carousel.entries[1].options.map(option => option.id), ['v1080', 'audio-mp3', 'audio-m4a']);
});

test('elige una miniatura mediana y segura', () => {
  assert.equal(pickThumbnailUrl(media.YOUTUBE_VIDEO), 'https://i.ytimg.com/vi/abc123def45/hqdefault.jpg');
  assert.equal(pickThumbnailUrl({ thumbnail: 'https://cdn.example/t.jpg' }), 'https://cdn.example/t.jpg');
  assert.equal(pickThumbnailUrl({ thumbnail: 'http://cdn.example/t.jpg' }), null);
});

/* ── Lo que contesta yt-dlp ──────────────────────────────────────────────── */

test('clasifica los errores reales de yt-dlp', () => {
  const cases = [
    ['ERROR: Unsupported URL: https://example.com/', 'unsupported'],
    ['ERROR: [youtube] abc: Sign in to confirm you’re not a bot. Use --cookies-from-browser or --cookies for the authentication.', 'bot_check'],
    ['ERROR: [youtube] abc: Sign in to confirm your age. This video may be inappropriate for some users. Use --cookies…', 'age_restricted'],
    ["ERROR: [youtube] abc: Private video. Sign in if you've been granted access to this video. Use --cookies…", 'private'],
    ['ERROR: [youtube] abc: Video unavailable. The uploader has not made this video available in your country', 'geo_blocked'],
    ['ERROR: [Instagram] abc: Instagram sent an empty media response. Check if this post is accessible in your browser without being logged-in.', 'login_required'],
    ['ERROR: [Instagram] abc: Requested content is not available, rate-limit reached or login required. Use --cookies…', 'login_required'],
    ['ERROR: [vimeo] 76979871: The web client only works when logged-in. Use --cookies, --cookies-from-browser…', 'login_required'],
    ['ERROR: [TikTok] 1: Unable to download webpage: HTTP Error 429: Too Many Requests', 'rate_limited'],
    ['ERROR: [youtube] aaaaaaaaaaa: This video is unavailable', 'unavailable'],
    ['ERROR: [youtube] abc: This live event will begin in 3 hours.', 'live'],
    ['ERROR: [twitter] 1585713233457061888: No video could be found in this tweet', 'no_media'],
    ['ERROR: [generic] Unable to download webpage: <urlopen error timed out>', 'network'],
    ['ERROR: something nobody expected', 'failed']
  ];
  for (const [line, code] of cases) {
    assert.equal(classifyFailure(['[info] algo', line]).code, code, line);
  }
  assert.equal(classifyFailure(['[download] Directo does not pass filter (!is_live), skipping ..']).code, 'live');
  assert.equal(classifyFailure(['[download] File is larger than max-filesize (2000 bytes > 1000 bytes). Aborting.']).code, 'too_large');
  assert.equal(classifyFailure([]).code, 'failed');
});

test('limpia el mensaje técnico de la coletilla de yt-dlp', () => {
  const { detail } = classifyFailure([
    'ERROR: [Instagram] abc123: Instagram sent an empty media response. Check if this post is accessible. '
      + 'See  https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp  for how to manually pass cookies. '
      + 'Otherwise, if the post is accessible in browser without being logged-in, please report this issue on  https://github.com/yt-dlp/yt-dlp/issues?q= , '
      + 'filling out the appropriate issue template. Confirm you are on the latest version using  yt-dlp -U'
  ]);
  assert.equal(detail, 'Instagram sent an empty media response. Check if this post is accessible.');

  const bot = classifyFailure([
    'ERROR: [youtube] abc123def45: Sign in to confirm you’re not a bot. Use --cookies-from-browser or --cookies for the '
      + 'authentication. See  https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp  for how to manually '
      + 'pass cookies. Also see  https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies  for tips on '
      + 'effectively exporting YouTube cookies'
  ]);
  assert.equal(bot.detail, 'Sign in to confirm you’re not a bot. Use --cookies-from-browser or --cookies for the authentication.');
});

test('lee solo las líneas marcadas', () => {
  assert.deepEqual(parseMarkedLine('@@ELYSIUM:SEL {"format_id": "134+140", "ext": "mp4", "filesize_approx": 631667}'), {
    kind: 'selected',
    value: { format_id: '134+140', ext: 'mp4', filesize_approx: 631667 }
  });
  assert.equal(parseMarkedLine('@@ELYSIUM:FILE "/tmp/job/Clip.mp4"').value, '/tmp/job/Clip.mp4');
  assert.equal(parseMarkedLine('@@ELYSIUM:PP {"status": "started", "postprocessor": "Merger"}').kind, 'post');
  assert.equal(parseMarkedLine('[download] 42.0% of 10MiB'), null);
  assert.equal(parseMarkedLine('@@ELYSIUM:P {roto'), null);
});

test('une el progreso del vídeo y del audio en una sola barra', () => {
  const tracker = new ProgressTracker();
  tracker.select({ format_id: '137+140', filesize_approx: 1500 });
  const video = { fid: '137', v: 'avc1.640028', a: 'none' };
  const audio = { fid: '140', v: 'none', a: 'mp4a.40.2' };

  let snapshot = tracker.update({ ...video, p: { status: 'downloading', downloaded_bytes: 500, total_bytes: 1000, speed: 100 } });
  assert.deepEqual([snapshot.part, snapshot.parts, snapshot.kind], [1, 2, 'video']);
  assert.equal(snapshot.percent, 33.3);
  assert.equal(snapshot.eta, 10);

  snapshot = tracker.update({ ...video, p: { status: 'finished', downloaded_bytes: 1000, total_bytes: 1000 } });
  assert.equal(snapshot.percent, 66.7);

  snapshot = tracker.update({ ...audio, p: { status: 'downloading', downloaded_bytes: 250, total_bytes: 500 } });
  assert.deepEqual([snapshot.part, snapshot.kind, snapshot.percent], [2, 'audio', 83.3]);

  snapshot = tracker.update({ ...audio, p: { status: 'finished', downloaded_bytes: 500, total_bytes: 500 } });
  // Nunca el 100 % antes de que el fichero esté listo.
  assert.equal(snapshot.percent, 99);
  assert.equal(snapshot.downloaded, 1500);
});

test('sin tamaño conocido, la barra no inventa un porcentaje', () => {
  const tracker = new ProgressTracker();
  const snapshot = tracker.update({ fid: 'hls-1', v: 'avc1', a: 'mp4a', p: { status: 'downloading', downloaded_bytes: 4096 } });
  assert.equal(snapshot.percent, null);
  assert.equal(snapshot.total, null);
  assert.equal(snapshot.kind, 'media');
});

test('nombra las fases de ffmpeg y los tipos de fichero', () => {
  assert.equal(postprocessStage({ status: 'started', postprocessor: 'Merger' }), 'merging');
  assert.equal(postprocessStage({ status: 'started', postprocessor: 'ExtractAudio' }), 'extracting');
  assert.equal(postprocessStage({ status: 'started', postprocessor: 'FixupM3u8' }), 'processing');
  assert.equal(postprocessStage({ status: 'finished', postprocessor: 'Merger' }), null);
  assert.equal(mimeForFile('Clip.mp4'), 'video/mp4');
  assert.equal(mimeForFile('Clip.MP3'), 'audio/mpeg');
  assert.equal(mimeForFile('Clip.m4a'), 'audio/mp4');
  assert.equal(mimeForFile('Clip.unknown'), 'application/octet-stream');
});
