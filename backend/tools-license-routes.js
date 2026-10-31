'use strict';

const express = require('express');
const { randomBytes } = require('node:crypto');
const { FieldValue } = require('firebase-admin/firestore');

const text = (value, max = 120) => String(value || '').trim().replace(/[<>\u0000-\u001f]/g, '').slice(0, max);
const publicLicense = data => data ? {
  licenseCode: data.licenseCode, status: data.status, planType: 'tools', amount: 0
} : null;

/** Free Tools licenses are separate from paid subscriptions. All writes are server-owned. */
function createToolsLicenseRouter({ db, requireUser, requireAdmin, timestamp = () => FieldValue.serverTimestamp() }) {
  const router = express.Router();
  router.use(requireUser);
  router.use((_req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); });
  const refs = uid => ({
    member: db.collection('members').doc(uid), request: db.collection('tools_requests').doc(uid),
    access: db.collection('tools_access').doc(uid)
  });
  const audit = (tx, user, uid, type, payload) => tx.set(db.collection('activities').doc(), {
    memberId: uid, memberName: payload.name || user.name || '', type, payload, tenantId: 'elysiumdr-eu', actorUid: user.uid,
    actorEmail: user.email, actorRole: user.uid === uid ? 'member' : 'admin', createdAt: timestamp()
  });

  router.get('/access', async (req, res, next) => {
    try {
      const r = refs(req.firebaseUser.uid);
      const [access, request, member] = await Promise.all([r.access.get(), r.request.get(), r.member.get()]);
      const stored = access.exists ? access.data() : null;
      const license = stored && member.data()?.isDeactivated === true ? { ...stored, status: 'suspended' } : stored;
      res.json({ allowed: license?.status === 'active', license: publicLicense(license),
        request: request.exists ? { status: request.data().status } : null,
        profile: { name: member.data()?.name || req.firebaseUser.name || '', email: req.firebaseUser.email } });
    } catch (error) { next(error); }
  });

  router.post('/request', async (req, res, next) => {
    try {
      const user = req.firebaseUser;
      const name = text(req.body?.name || user.name);
      const note = text(req.body?.note, 500);
      if (!name || req.body?.responsibleUse !== true) return res.status(400).json({ code: 'invalid_request' });
      const language = ['en', 'es', 'pt'].includes(req.body?.language) ? req.body.language : 'en';
      const r = refs(user.uid);
      let status;
      await db.runTransaction(async tx => {
        const [member, request, access] = await Promise.all([tx.get(r.member), tx.get(r.request), tx.get(r.access)]);
        if (access.data()?.status === 'active') { status = 'active'; return; }
        // Repeated clicks do not duplicate requests or reopen an administrator's decision.
        if (request.exists) { status = request.data().status; return; }
        if (!member.exists) tx.set(r.member, { name, email: user.email, company: null, role: 'partner',
          subscription: null, onboardingCompleted: false, createdAt: timestamp(), source: 'tools' });
        tx.set(r.request, { userId: user.uid, name, email: user.email, language, note,
          responsibleUse: true, termsVersion: '2026-10-31', status: 'pending',
          requestedAt: timestamp(), updatedAt: timestamp() });
        audit(tx, user, user.uid, 'tools_license_requested', { product: 'tools', name });
        status = 'pending';
      });
      res.json({ status });
    } catch (error) { next(error); }
  });

  router.get('/admin', requireAdmin, async (req, res, next) => {
    try {
      const cursor = text(req.query.cursor, 150);
      let query = db.collection('tools_requests').orderBy('__name__').limit(101);
      if (cursor) query = query.startAfter(cursor);
      const requests = await query.get();
      const page = requests.docs.slice(0, 100);
      const rows = await Promise.all(page.map(async item => {
        const access = await refs(item.id).access.get();
        const data = item.data();
        return { userId: item.id, name: data.name, email: data.email, note: data.note,
          status: data.status, requestedAt: data.requestedAt?.toDate?.().toISOString() || null,
          license: publicLicense(access.data()) };
      }));
      res.json({ rows, nextCursor: requests.docs.length > 100 ? page.at(-1).id : null });
    } catch (error) { next(error); }
  });

  router.post('/admin/:uid', requireAdmin, async (req, res, next) => {
    try {
      const uid = req.params.uid;
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) return res.status(400).json({ code: 'invalid_user' });
      const action = req.body?.action;
      if (!['approve', 'reject', 'suspend', 'reactivate'].includes(action)) return res.status(400).json({ code: 'invalid_action' });
      const r = refs(uid);
      await db.runTransaction(async tx => {
        const [request, access, member] = await Promise.all([tx.get(r.request), tx.get(r.access), tx.get(r.member)]);
        if (!request.exists || !member.exists) throw Object.assign(new Error('Request not found.'), { status: 404 });
        if (['suspend', 'reactivate'].includes(action) && !access.exists) {
          throw Object.assign(new Error('License not found.'), { status: 409 });
        }
        if (action === 'reject' && access.exists) {
          throw Object.assign(new Error('Suspend the existing license instead.'), { status: 409 });
        }
        const status = action === 'reject' ? 'rejected' : action === 'suspend' ? 'suspended' : 'active';
        tx.update(r.request, { status, updatedAt: timestamp(), reviewedBy: req.firebaseUser.uid });
        if (action !== 'reject') {
          const old = access.data();
          const licenseCode = old?.licenseCode || `ELY-TOOLS-FREE-${randomBytes(6).toString('hex').toUpperCase()}`;
          const license = { userId: uid, name: request.data().name, email: request.data().email,
            licenseCode, status, planType: 'tools', planLabel: 'Elysium Tools', amount: 0,
            currency: 'EUR', source: 'manual', updatedAt: timestamp(), updatedBy: req.firebaseUser.uid,
            grantedAt: old?.grantedAt || timestamp() };
          tx.set(r.access, license);
          tx.set(db.collection('licenses').doc(licenseCode), { ...license, assignedTo: uid, product: 'tools' }, { merge: true });
          tx.update(r.member, { toolsLicense: { licenseCode, status, planType: 'tools', amount: 0 }, updatedAt: timestamp() });
        }
        audit(tx, req.firebaseUser, uid, `tools_license_${action}`, { product: 'tools', status });
      });
      res.json({ ok: true });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      next(error);
    }
  });
  return router;
}

module.exports = { createToolsLicenseRouter };
