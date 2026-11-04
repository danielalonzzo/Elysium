import test from 'node:test';
import assert from 'node:assert/strict';
import { youtubeWatchUrl, videoRecovery } from '../JS/tools-video-recovery.js';

const id = '6VTYE3XS8oc';
const canonical = `https://www.youtube.com/watch?v=${id}`;

test('YouTube recovery reconstructs only canonical public watch URLs', () => {
    for (const url of [`${canonical}&t=247s`, `https://youtu.be/${id}`, `youtube.com/shorts/${id}`,
        `https://m.youtube.com/watch?v=${id}`, `https://www.youtube-nocookie.com/embed/${id}`]) {
        assert.equal(youtubeWatchUrl(url), canonical, url);
    }
    for (const url of ['https://youtube.com.evil.test/watch?v='+id, 'https://youtube.com@evil.test/watch?v='+id,
        'https://user:password@youtube.com/watch?v='+id, 'https://youtube.com:8443/watch?v='+id,
        'https://youtube.com/watch?v=invalid', 'https://example.com/?v='+id, '/watch?v='+id]) {
        assert.equal(youtubeWatchUrl(url), null, url);
    }
});

test('YouTube failures that need a session offer to connect the YouTube account', () => {
    for (const code of ['youtube_session_required', 'youtube_session_expired', 'bot_check', 'login_required', 'age_restricted']) {
        assert.deepEqual(videoRecovery({ code, platform: 'YouTube' }, { sourceUrl: canonical, youtubeSessions: true }),
            { connect: true, watchUrl: canonical }, code);
    }
    // Sin sesiones en el servicio, solo queda abrir el video en YouTube.
    assert.deepEqual(videoRecovery({ code: 'bot_check', platform: 'YouTube' }, { sourceUrl: canonical }), { connect: false, watchUrl: canonical });
    assert.equal(videoRecovery({ code: 'network', platform: 'YouTube' }, { sourceUrl: canonical, youtubeSessions: true }), null);
    assert.equal(videoRecovery({ code: 'bot_check', platform: 'Instagram' }, { sourceUrl: 'https://instagram.com/reel/123/', youtubeSessions: true }), null);
    assert.equal(videoRecovery({ code: 'login_required', platform: 'Instagram' }, { sourceUrl: 'https://instagram.com/reel/123/', youtubeSessions: true }), null);
});

test('Malformed input never becomes a recovery destination', () => {
    const recovery = videoRecovery({ code: 'youtube_session_required', platform: 'YouTube' }, { sourceUrl: 'https://attacker.test/', youtubeSessions: true });
    assert.deepEqual(recovery, { connect: true, watchUrl: null });
});
