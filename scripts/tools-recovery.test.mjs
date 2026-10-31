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

test('YouTube bot checks offer official owner export routes in three languages', () => {
    for (const language of ['en', 'es', 'pt']) {
        const recovery = videoRecovery({ code: 'bot_check', platform: 'YouTube' }, { sourceUrl: canonical, language });
        assert.ok(recovery.explanation.length > 80);
        assert.deepEqual(recovery.links.map(link => link.url), [canonical, 'https://studio.youtube.com/',
            'https://takeout.google.com/', `https://support.google.com/youtube/answer/56100?hl=${language}`]);
        assert.ok(recovery.links.every(link => link.label.length > 5));
    }
    assert.equal(videoRecovery({ code: 'network', platform: 'YouTube' }, { sourceUrl: canonical }), null);
    assert.equal(videoRecovery({ code: 'bot_check', platform: 'Instagram' }, { sourceUrl: 'https://instagram.com/reel/123/' }), null);
});

test('Malformed input never becomes a recovery destination', () => {
    const recovery = videoRecovery({ code: 'bot_check', platform: 'YouTube' }, { sourceUrl: 'https://attacker.test/', language: 'unknown' });
    assert.equal(recovery.links.length, 3);
    assert.ok(recovery.links.every(link => !link.url.includes('attacker')));
});
