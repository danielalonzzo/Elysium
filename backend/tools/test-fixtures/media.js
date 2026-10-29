'use strict';

/**
 * Lo que devuelve `yt-dlp --dump-single-json` para cada tipo de enlace,
 * recortado a los campos que lee `video.js`. Los formatos son los de verdad
 * (comprobados con yt-dlp 2026.10.26), con tamaños redondos para poder sumar.
 */

const YOUTUBE_VIDEO = Object.freeze({
  id: 'abc123def45',
  title: 'Clip de prueba',
  uploader: 'Elysium',
  duration: 125,
  upload_date: '20260115',
  webpage_url: 'https://www.youtube.com/watch?v=abc123def45',
  extractor_key: 'Youtube',
  thumbnail: 'https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg',
  thumbnails: [
    { url: 'https://i.ytimg.com/vi/abc123def45/default.jpg', width: 120, height: 90 },
    { url: 'https://i.ytimg.com/vi/abc123def45/hqdefault.jpg', width: 480, height: 360 },
    { url: 'https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg', width: 1920, height: 1080 }
  ],
  formats: [
    // Los «storyboards» tienen dimensiones pero no son vídeo.
    { format_id: 'sb0', ext: 'mhtml', vcodec: 'none', acodec: 'none', width: 160, height: 90 },
    { format_id: '140', ext: 'm4a', vcodec: 'none', acodec: 'mp4a.40.2', filesize: 2000000 },
    { format_id: '251', ext: 'webm', vcodec: 'none', acodec: 'opus', filesize: 1900000 },
    { format_id: '18', ext: 'mp4', vcodec: 'avc1.42001E', acodec: 'mp4a.40.2', width: 640, height: 360, filesize: 9000000 },
    { format_id: '136', ext: 'mp4', vcodec: 'avc1.4d401f', acodec: 'none', width: 1280, height: 720, filesize: 20000000 },
    { format_id: '137', ext: 'mp4', vcodec: 'avc1.640028', acodec: 'none', width: 1920, height: 1080, filesize: 40000000 },
    { format_id: '248', ext: 'webm', vcodec: 'vp9', acodec: 'none', width: 1920, height: 1080, filesize: 30000000 },
    { format_id: '271', ext: 'webm', vcodec: 'vp9', acodec: 'none', width: 2560, height: 1440, filesize: 80000000 },
    { format_id: '313', ext: 'webm', vcodec: 'vp9', acodec: 'none', width: 3840, height: 2160, filesize: 150000000 }
  ]
});

// Vertical: la resolución es la anchura (576×1024 es «576p»).
const TIKTOK_VIDEO = Object.freeze({
  id: '7300000000000000000',
  title: 'Receta rápida #cocina',
  uploader: 'chef',
  duration: 42,
  webpage_url: 'https://www.tiktok.com/@chef/video/7300000000000000000',
  extractor_key: 'TikTok',
  formats: [
    { format_id: 'audio', ext: 'mp3', vcodec: 'none', acodec: 'mp3' },
    { format_id: 'h264_540p', ext: 'mp4', vcodec: 'h264', acodec: 'aac', width: 576, height: 1024, filesize: 3000000 },
    { format_id: 'bytevc1_720p', ext: 'mp4', vcodec: 'h265', acodec: 'aac', width: 720, height: 1280, filesize: 2500000 }
  ]
});

// Instagram a veces no dice ni códecs ni dimensiones.
const UNDESCRIBED_VIDEO = Object.freeze({
  id: 'aye83DjauH',
  title: 'Video by naomipq',
  webpage_url: 'https://www.instagram.com/p/aye83DjauH/',
  extractor_key: 'Instagram',
  formats: [{ format_id: '0', ext: 'mp4' }, { format_id: '1', ext: 'mp4' }]
});

const YOUTUBE_PLAYLIST = Object.freeze({
  _type: 'playlist',
  id: 'PLtest',
  title: 'Lista de prueba',
  uploader: 'Elysium',
  playlist_count: 12,
  webpage_url: 'https://www.youtube.com/playlist?list=PLtest',
  extractor_key: 'YoutubeTab',
  entries: [
    { _type: 'url', ie_key: 'Youtube', id: 'a1', url: 'https://www.youtube.com/watch?v=a1', title: 'Uno', duration: 60 },
    { _type: 'url', ie_key: 'Youtube', id: 'b2', url: 'https://www.youtube.com/watch?v=b2', title: 'Dos', duration: 75 }
  ]
});

// Un carrusel trae cada vídeo completo: se descarga por su posición.
const INSTAGRAM_CAROUSEL = Object.freeze({
  _type: 'playlist',
  id: 'C1carousel',
  title: 'Post by elysium',
  webpage_url: 'https://www.instagram.com/p/C1carousel/',
  extractor_key: 'Instagram',
  entries: [
    {
      id: 'c1',
      title: 'Video 1 of Post by elysium',
      duration: 12,
      formats: [
        { format_id: 'dash-v', vcodec: 'avc1.4d401f', acodec: 'none', width: 720, height: 1280, filesize: 1000000 },
        { format_id: 'dash-a', vcodec: 'none', acodec: 'mp4a.40.2', filesize: 100000 }
      ]
    },
    {
      id: 'c2',
      title: 'Video 2 of Post by elysium',
      duration: 8,
      formats: [{ format_id: '0', ext: 'mp4', vcodec: 'avc1', acodec: 'mp4a.40.2', width: 1080, height: 1920, filesize: 900000 }]
    }
  ]
});

module.exports = {
  INSTAGRAM_CAROUSEL,
  TIKTOK_VIDEO,
  UNDESCRIBED_VIDEO,
  YOUTUBE_PLAYLIST,
  YOUTUBE_VIDEO
};
