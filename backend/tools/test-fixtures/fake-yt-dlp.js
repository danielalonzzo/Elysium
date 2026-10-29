'use strict';

/**
 * Un yt-dlp de mentira para las pruebas: lee los mismos argumentos que
 * `video.js` construye y escribe lo mismo que escribiría el de verdad con esas
 * plantillas (`@@ELYSIUM:…`, `ERROR: …`), sin tocar la red.
 *
 * Qué pasa lo decide el enlace:
 *   …unsupported… / …login… / …bot…   el `ERROR:` real de cada caso
 *   …playlist… / …carousel…           una lista o un carrusel
 *   …tiktok…                          un vídeo vertical
 *   …slow…                            descarga que no termina hasta que la cancelen
 *   …huge…                            más bytes de los que permite --max-filesize
 *   …live…                            un directo: sale sin fichero, como con !is_live
 */
const fs = require('node:fs');
const path = require('node:path');
const media = require('./media');

const args = process.argv.slice(2);
const url = args[args.indexOf('--') + 1] || '';
const valueOf = flag => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};
const out = line => process.stdout.write(`${line}\n`);
const err = line => process.stderr.write(`${line}\n`);
const json = value => JSON.stringify(value);

function fail(message) {
  err(`ERROR: ${message}`);
  process.exit(1);
}

if (args.includes('--version')) {
  out('2026.10.26');
  process.exit(0);
}

if (url.includes('unsupported')) fail(`Unsupported URL: ${url}`);
if (url.includes('login')) {
  fail('[Instagram] abc123: Instagram sent an empty media response. Check if this post is accessible in your browser '
    + 'without being logged-in. If it is not, then use --cookies-from-browser or --cookies for the authentication. '
    + 'See  https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp  for how to manually pass cookies.');
}
if (url.includes('bot')) {
  fail('[youtube] abc123def45: Sign in to confirm you’re not a bot. Use --cookies-from-browser or --cookies for the '
    + 'authentication. See  https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp  for how to manually pass cookies.');
}

if (args.includes('--dump-single-json')) {
  const info = url.includes('playlist') ? media.YOUTUBE_PLAYLIST
    : url.includes('carousel') ? media.INSTAGRAM_CAROUSEL
      : url.includes('tiktok') ? media.TIKTOK_VIDEO
        : media.YOUTUBE_VIDEO;
  out(json(info));
  process.exit(0);
}

const outputDir = args.filter((_, index) => args[index - 1] === '--paths').find(value => !value.startsWith('temp:'));
const audio = args.includes('--extract-audio');
const extension = audio ? valueOf('--audio-format') : 'mp4';
const parts = audio ? [['140', 'none', 'mp4a.40.2', 500]] : [['137', 'avc1.640028', 'none', 1000], ['140', 'none', 'mp4a.40.2', 500]];

if (url.includes('live')) {
  out('[download] Directo de prueba does not pass filter (!is_live), skipping ..');
  process.exit(0);
}

out(`@@ELYSIUM:SEL ${json({ format_id: parts.map(part => part[0]).join('+'), ext: extension, filesize_approx: 1500 })}`);

function progress([fid, vcodec, acodec], status, downloaded, total) {
  out(`@@ELYSIUM:P {"fid":${json(fid)},"v":${json(vcodec)},"a":${json(acodec)},"p":${json({
    status,
    downloaded_bytes: downloaded,
    total_bytes: total,
    speed: 1000,
    eta: 1
  })}}`);
}

if (url.includes('slow')) {
  let downloaded = 0;
  setInterval(() => {
    downloaded += 10;
    progress(parts[0], 'downloading', downloaded, 1000000);
  }, 50);
  process.on('SIGTERM', () => process.exit(143));
} else if (url.includes('huge')) {
  const limit = Number(valueOf('--max-filesize'));
  progress(parts[0], 'downloading', limit + 1, null);
  setInterval(() => {}, 1000);
} else {
  for (const part of parts) {
    progress(part, 'downloading', part[3] / 2, part[3]);
    progress(part, 'finished', part[3], part[3]);
  }
  if (parts.length > 1) {
    err('@@ELYSIUM:PP {"status": "started", "postprocessor": "Merger"}');
    err('@@ELYSIUM:PP {"status": "finished", "postprocessor": "Merger"}');
  }
  if (audio) {
    err('@@ELYSIUM:PP {"status": "started", "postprocessor": "ExtractAudio"}');
    err('@@ELYSIUM:PP {"status": "finished", "postprocessor": "ExtractAudio"}');
  }
  err('@@ELYSIUM:PP {"status": "started", "postprocessor": "MoveFiles"}');
  const file = path.join(outputDir, `Clip de prueba.${extension}`);
  fs.writeFileSync(file, Buffer.alloc(1500, 7));
  err('@@ELYSIUM:PP {"status": "finished", "postprocessor": "MoveFiles"}');
  out(`@@ELYSIUM:FILE ${json(file)}`);
}
