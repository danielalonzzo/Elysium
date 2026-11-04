'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createToolsLicenseRouter } = require('./tools-license-routes');

function memoryDb() {
  const data = new Map();
  let reads = 0;
  const db = { data, get reads() { return reads; }, collection: name => ({ doc: id => ({ id, path: `${name}/${id}`,
    async get() { reads += 1; return { id, exists: data.has(`${name}/${id}`), data: () => data.get(`${name}/${id}`) }; } }) }) };
  return db;
}

async function fixture(t) {
  const db = memoryDb(); const app = express(); app.use(express.json());
  const identities = {
    client: { uid: 'client', email: 'client@example.com', email_verified: true, name: 'Client' },
    stranger: { uid: 'stranger', email: 'stranger@example.com', email_verified: true },
    admin: { uid: 'admin', email: 'daniel.morales@elysiumdr.eu', email_verified: true },
    team: { uid: 'team', email: 'social.media@elysiumdr.eu', email_verified: true },
    granted: { uid: 'granted', email: 'partner@example.org', email_verified: true, crmAccess: true, crmTenantId: 'elysiumdr-eu' },
    otherTenant: { uid: 'other', email: 'partner@example.org', email_verified: true, crmAccess: true, crmTenantId: 'another' },
    unverified: { uid: 'unverified', email: 'unverified@example.com', email_verified: false }
  };
  app.use('/api/tools-license', createToolsLicenseRouter({ db,
    isAdmin: identity => identity.email === 'daniel.morales@elysiumdr.eu',
    requireUser: (req, res, next) => {
      req.firebaseUser = identities[req.get('authorization')?.replace('Bearer ', '')];
      if (!req.firebaseUser) return res.status(401).json({ code: 'unauthenticated' });
      if (!req.firebaseUser.email_verified) return res.status(403).json({ code: 'email_not_verified' }); next();
    } }));
  const server = await new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/tools-license`;
  async function call(path, identity = 'client', { method = 'GET', body } = {}) {
    const response = await fetch(`${base}${path}`, { method, headers: {
      Authorization: `Bearer ${identity}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json().catch(() => null), cache: response.headers.get('cache-control') };
  }
  return { db, call };
}

test('Tools: a session is required and the email must be verified', async t => {
  const { call } = await fixture(t);
  assert.equal((await call('/access', 'missing')).status, 401);
  const unverified = await call('/access', 'unverified');
  assert.equal(unverified.status, 403);
  assert.equal(unverified.data.code, 'email_not_verified');
});

test('Tools: an existing Elysium client account opens the tools at once, with nothing to request', async t => {
  const { call, db } = await fixture(t);
  db.data.set('members/client', { name: 'Existing client', email: 'client@example.com', role: 'partner', subscription: null });
  const access = await call('/access');
  assert.equal(access.status, 200);
  assert.equal(access.cache, 'private, no-store');
  assert.deepEqual(access.data, { allowed: true, uid: 'client', account: { status: 'active', kind: 'client' },
    profile: { name: 'Existing client', email: 'client@example.com' } });
});

test('Tools: the team enters without a CRM profile; another tenant does not', async t => {
  const { call } = await fixture(t);
  for (const identity of ['admin', 'team', 'granted']) {
    const access = await call('/access', identity);
    assert.equal(access.data.allowed, true, identity);
    assert.deepEqual(access.data.account, { status: 'active', kind: 'team' }, identity);
  }
  assert.equal((await call('/access', 'otherTenant')).data.allowed, false);
});

test('Tools: an account that is not an Elysium client gets no access and is not registered', async t => {
  const { call, db } = await fixture(t);
  const access = await call('/access', 'stranger');
  assert.equal(access.data.allowed, false);
  assert.deepEqual(access.data.account, { status: 'no_account', kind: null });
  assert.equal(db.data.size, 0);
});

test('Tools: a deactivated profile is cut off, except for an administrator', async t => {
  const { call, db } = await fixture(t);
  db.data.set('members/client', { name: 'Client', isDeactivated: true });
  db.data.set('members/admin', { name: 'Daniel', isDeactivated: true });
  assert.deepEqual((await call('/access')).data.account, { status: 'suspended', kind: 'client' });
  assert.equal((await call('/access')).data.allowed, false);
  assert.equal((await call('/access', 'admin')).data.allowed, true);
});

test('Tools: the old request and approval endpoints are gone', async t => {
  const { call, db } = await fixture(t);
  assert.equal((await call('/request', 'client', { method: 'POST', body: { name: 'A', responsibleUse: true } })).status, 404);
  assert.equal((await call('/admin', 'admin')).status, 404);
  assert.equal((await call('/admin/client', 'admin', { method: 'POST', body: { action: 'approve' } })).status, 404);
  assert.equal(db.data.size, 0);
});
