'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { publicTarget, sameSecret } = { ...require('./public-network'), ...require('./public-tools') };

test('public outbound connections reject metadata, private DNS, alternate ports and userinfo', async () => {
  for (const url of ['http://169.254.169.254/latest/meta-data','http://localhost/','https://127.0.0.1/','https://[::ffff:7f00:1]/','https://example.com:8080/','https://u:p@example.com/']) await assert.rejects(publicTarget(url));
  await assert.rejects(publicTarget('https://metadata.google.internal/'));
  await assert.rejects(publicTarget('https://example.com/', { lookup: async () => [{ address: '93.184.216.34', family: 4 }, { address: '10.0.0.1', family: 4 }] }));
  await assert.rejects(publicTarget('localhost:443', { tunnel: true }));
});
test('each outbound connection pins a freshly validated public address', async () => {
  let calls = 0;
  const lookup = async () => [{ address: ++calls === 1 ? '93.184.216.34' : '127.0.0.1', family: 4 }];
  const target = await publicTarget('example.com:443', { tunnel: true, lookup });
  assert.equal(target.address, '93.184.216.34');
  assert.equal(target.port, 443);
  await assert.rejects(publicTarget('example.com:443', { tunnel: true, lookup }));
  assert.equal(calls, 2);
});
test('gateway secrets cannot be omitted, truncated or replaced', () => {
  const secret = 'a'.repeat(48);
  assert.ok(sameSecret(secret, secret));
  assert.ok(!sameSecret('', secret)); assert.ok(!sameSecret('b'.repeat(48), secret)); assert.ok(!sameSecret('a', 'a'));
});
