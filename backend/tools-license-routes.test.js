'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createToolsLicenseRouter } = require('./tools-license-routes');

function memoryDb() {
  const data = new Map(); let sequence = 0;
  const snapshot = ref => ({ id: ref.id, exists: data.has(ref.path), data: () => data.get(ref.path) });
  const ref = (name, id = `audit-${++sequence}`) => ({ id, path: `${name}/${id}`, get: async function () { return snapshot(this); } });
  const db = { data, collection: name => ({ doc: id => ref(name, id), orderBy: () => {
    let after = '', limit = 101;
    const query = { startAfter: id => { after = id; return query; }, limit: n => { limit = n; return query; },
      get: async () => ({ docs: [...data.keys()].filter(path => path.startsWith(`${name}/`) && path.slice(name.length + 1) > after)
        .sort().slice(0, limit).map(path => snapshot(ref(name, path.slice(name.length + 1)))) }) };
    return query;
  } }), runTransaction: async callback => {
    const writes = [];
    await callback({ get: async ref => snapshot(ref), set: (ref, value, options) => writes.push(() => data.set(ref.path, options?.merge ? { ...data.get(ref.path), ...value } : value)),
      update: (ref, value) => writes.push(() => data.set(ref.path, { ...data.get(ref.path), ...value })) });
    writes.forEach(write => write());
  } };
  return db;
}

async function fixture(t) {
  const db = memoryDb(); const app = express(); app.use(express.json());
  const identities = {
    member: { uid: 'member', email: 'member@example.com', email_verified: true, name: 'Member' },
    admin: { uid: 'admin', email: 'admin@example.com', email_verified: true, admin: true },
    unverified: { uid: 'unverified', email: 'unverified@example.com', email_verified: false }
  };
  app.use('/api/tools-license', createToolsLicenseRouter({ db, timestamp: () => new Date('2026-10-31T16:00:00Z'),
    requireUser: (req, res, next) => {
      req.firebaseUser = identities[req.get('authorization')?.replace('Bearer ', '')];
      if (!req.firebaseUser) return res.status(401).json({ code: 'unauthenticated' });
      if (!req.firebaseUser.email_verified) return res.status(403).json({ code: 'email_not_verified' }); next();
    }, requireAdmin: (req, res, next) => req.firebaseUser.admin ? next() : res.status(403).json({ code: 'admin_required' }) }));
  const server = await new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/tools-license`;
  async function call(path, identity = 'member', body) {
    const response = await fetch(`${base}${path}`, { method: body ? 'POST' : 'GET', headers: {
      Authorization: `Bearer ${identity}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json() };
  }
  return { db, call };
}

test('Tools: anonymous, unverified and non-admin accounts cannot obtain a grant', async t => {
  const { call, db } = await fixture(t);
  assert.equal((await call('/access', 'missing')).status, 401);
  assert.equal((await call('/request', 'unverified', { name: 'A', responsibleUse: true })).status, 403);
  assert.equal((await call('/admin/member', 'member', { action: 'approve' })).status, 403);
  assert.equal((await call('/admin', 'member')).status, 403);
  assert.equal(db.data.size, 0);
});

test('Tools: requests create an Elysium profile, ignore privileged fields and remain idempotent', async t => {
  const { call, db } = await fixture(t);
  assert.equal((await call('/request', 'member', { name: 'A' })).status, 400);
  assert.equal((await call('/request', 'member', { name: 'Example', responsibleUse: true, status: 'active', role: 'admin', email: 'other@example.com' })).data.status, 'pending');
  assert.equal(db.data.get('members/member').role, 'partner');
  assert.equal(db.data.get('tools_requests/member').email, 'member@example.com');
  assert.equal((await call('/access')).data.allowed, false);
  const size = db.data.size;
  await call('/request', 'member', { name: 'Changed', responsibleUse: true });
  assert.equal(db.data.size, size);
  assert.equal(db.data.get('tools_requests/member').name, 'Example');
});

test('Tools: approval, suspension and reactivation keep the same conventional license and paid subscription', async t => {
  const { call, db } = await fixture(t);
  const subscription = { planType: 'advanced', licenseCode: 'PAID-EXISTING' };
  db.data.set('members/member', { name: 'Existing', email: 'member@example.com', role: 'partner', subscription });
  await call('/request', 'member', { name: 'Existing', responsibleUse: true });
  assert.equal((await call('/admin/member', 'admin', { action: 'approve' })).status, 200);
  let access = (await call('/access')).data;
  assert.equal(access.allowed, true);
  const code = access.license.licenseCode;
  assert.match(code, /^ELY-TOOLS-FREE-[A-F0-9]{12}$/);
  assert.equal(db.data.get(`licenses/${code}`).userId, 'member');
  assert.equal(db.data.get(`licenses/${code}`).amount, 0);
  assert.deepEqual(db.data.get('members/member').subscription, subscription);
  assert.equal(db.data.get('members/member').toolsLicense.licenseCode, code);
  await call('/admin/member', 'admin', { action: 'suspend' });
  assert.equal((await call('/access')).data.allowed, false);
  await call('/admin/member', 'admin', { action: 'reactivate' });
  access = (await call('/access')).data;
  assert.equal(access.allowed, true); assert.equal(access.license.licenseCode, code);
  assert.equal((await call('/admin/member', 'admin', { action: 'reject' })).status, 409);
});

test('Tools: rejection cannot be reopened by the requester; CRM pagination returns the request and profile', async t => {
  const { call, db } = await fixture(t);
  await call('/request', 'member', { name: 'Example', responsibleUse: true });
  await call('/admin/member', 'admin', { action: 'reject' });
  assert.equal((await call('/request', 'member', { name: 'Example', responsibleUse: true })).data.status, 'rejected');
  assert.equal((await call('/access')).data.allowed, false);
  const list = await call('/admin', 'admin');
  assert.equal(list.data.rows[0].userId, 'member');
  assert.equal(list.data.rows[0].status, 'rejected');
  assert.equal((await call('/admin/missing', 'admin', { action: 'approve' })).status, 404);
  assert.equal(db.data.has('tools_access/member'), false);
});
