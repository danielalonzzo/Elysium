'use strict';

process.env.GCLOUD_PROJECT ||= 'elysium-unit-tests';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const {
  FileRouteError,
  UPLOAD_POLICIES,
  assertManagedFileKey,
  createR2Client,
  createR2FileRouter,
  defaultCanAccessEntity,
  defaultFileTypeDetector,
  isCorporateIdentity,
  normalizeUploadIntentInput,
  objectKeys,
  safeStorageSegment,
  validateDetectedType,
  validateUploadedHead
} = require('./r2-file-routes');

const corporateUser = Object.freeze({
  uid: 'user_123',
  email: 'agent@elysiumdr.eu',
  email_verified: true,
  role: 'agent'
});

test('corporate identity requires a verified exact domain or explicit permission', () => {
  assert.equal(isCorporateIdentity(corporateUser), true);
  assert.equal(isCorporateIdentity({
    uid: 'external_1', email: 'consultant@example.com', email_verified: true,
    crmAccess: true, crmTenantId: 'elysiumdr-eu'
  }), true);
  assert.equal(isCorporateIdentity({
    uid: 'external_wrong_tenant', email: 'consultant@example.com', email_verified: true,
    crmAccess: true, crmTenantId: 'other-tenant'
  }), false);
  assert.equal(isCorporateIdentity({
    uid: 'external_manager', email: 'manager@example.com', email_verified: true,
    crmRole: 'manager', crmTenantId: 'elysiumdr-eu'
  }), true);
  assert.equal(isCorporateIdentity({
    uid: 'external_role_only', email: 'manager@example.com', email_verified: true,
    crmRole: 'manager'
  }), false);
  assert.equal(isCorporateIdentity({
    uid: 'external_2', email: 'person@notelysiumdr.eu', email_verified: true
  }), false);
  assert.equal(isCorporateIdentity({
    uid: 'user_2', email: 'person@elysiumdr.eu', email_verified: false
  }), false);
  assert.equal(isCorporateIdentity({
    uid: 'user_3', email: 'person@elysiumdr.eu', email_verified: true, crmDisabled: true
  }), false);
});

test('upload policy owns MIME, size, extension and object prefixes', () => {
  const upload = normalizeUploadIntentInput({
    purpose: 'contact_attachment',
    entityId: 'contact_abc',
    originalName: 'Propuesta final.pdf',
    contentType: 'application/pdf',
    size: 2048
  }, corporateUser);
  assert.equal(upload.policy.maxBytes, 20 * 1024 * 1024);
  assert.equal(upload.extension, 'pdf');

  const keys = objectKeys({
    identity: corporateUser,
    intentId: 'intent_123',
    upload,
    now: new Date('2026-08-18T12:00:00.000Z')
  });
  assert.equal(keys.quarantineKey, '_quarantine/elysiumdr-eu/user_123/intent_123/payload');
  assert.match(safeStorageSegment('uid/with/slash'), /^sha256-[a-f0-9]{64}$/);
  assert.equal(
    keys.finalKey,
    'crm/elysiumdr-eu/contacts/contact_abc/attachments/2026/08/intent_123.pdf'
  );

  assert.throws(() => normalizeUploadIntentInput({
    purpose: 'contact_attachment', entityId: 'contact_abc', originalName: '../malware.pdf',
    contentType: 'application/pdf', size: 10
  }, corporateUser), error => error instanceof FileRouteError && error.code === 'filename_invalid');
  assert.throws(() => normalizeUploadIntentInput({
    purpose: 'avatar', entityId: corporateUser.uid, originalName: 'avatar.svg',
    contentType: 'image/svg+xml', size: 10
  }, corporateUser), error => error.code === 'content_type_invalid');
  assert.throws(() => normalizeUploadIntentInput({
    purpose: 'legal_document', entityId: 'contact_abc', originalName: 'contract.pdf',
    contentType: 'application/pdf', size: UPLOAD_POLICIES.legal_document.maxBytes + 1
  }, corporateUser), error => error.code === 'file_size_invalid');
  assert.throws(() => normalizeUploadIntentInput({
    purpose: 'contact_attachment', entityId: 'contact_abc', originalName: 'contract.docx',
    contentType: 'application/pdf', size: 100
  }, corporateUser), error => error.code === 'filename_type_mismatch');
  assert.throws(() => normalizeUploadIntentInput({
    purpose: 'contact_attachment', entityId: 'contact_abc', originalName: 'x\ud800.pdf',
    contentType: 'application/pdf', size: 100
  }, corporateUser), error => error.code === 'filename_invalid');
});

test('entity ACL grants owners and configured global roles, not unrelated agents', () => {
  const entity = { id: 'contact_abc', ownerId: corporateUser.uid };
  const context = {
    action: 'read', entityCollection: 'contacts', entityId: entity.id,
    isAdmin: () => false, globalRoles: new Set(['manager', 'operations'])
  };
  assert.equal(defaultCanAccessEntity(corporateUser, entity, context), true);
  assert.equal(defaultCanAccessEntity({ ...corporateUser, uid: 'other_agent' }, entity, context), false);
  assert.equal(defaultCanAccessEntity({ ...corporateUser, uid: 'manager_1', role: 'manager' }, entity, context), true);
  assert.equal(defaultCanAccessEntity({ ...corporateUser, uid: 'manager_2', role: null, crmRole: 'manager' }, entity, context), true);
});

test('completion validation fails closed on size, headers and detected MIME', () => {
  const intent = {
    expectedBytes: 1024,
    maxBytes: 2048,
    contentType: 'application/pdf'
  };
  assert.deepEqual(validateUploadedHead({
    ContentLength: 1024, ContentType: 'application/pdf', ETag: '"etag"'
  }, intent), { bytes: 1024, contentType: 'application/pdf', etag: '"etag"' });
  assert.equal(validateDetectedType({ mime: 'application/pdf' }, intent), 'application/pdf');
  assert.throws(
    () => validateUploadedHead({ ContentLength: 1025, ContentType: 'application/pdf', ETag: 'x' }, intent),
    error => error.code === 'uploaded_size_mismatch'
  );
  assert.throws(
    () => validateDetectedType({ mime: 'application/zip' }, intent),
    error => error.code === 'file_type_unverified'
  );
});

test('managed file records must match their bucket, purpose, entity and dated key', () => {
  const file = {
    id: 'intent_123', provider: 'cloudflare-r2', bucket: 'elysium-private',
    entityType: 'contact', entityId: 'contact_abc', purpose: 'contact_attachment',
    contentType: 'application/pdf', size: 1024,
    objectKey: 'crm/elysiumdr-eu/contacts/contact_abc/attachments/2026/08/intent_123.pdf'
  };
  assert.equal(assertManagedFileKey(file, 'elysium-private'), file.objectKey);
  assert.throws(
    () => assertManagedFileKey({ ...file, bucket: 'old-bucket' }, 'elysium-private'),
    error => error.code === 'file_record_invalid'
  );
  assert.throws(
    () => assertManagedFileKey({ ...file, entityId: 'another_contact' }, 'elysium-private'),
    error => error.code === 'file_record_invalid'
  );
});

test('the CommonJS backend can load the ESM detector and recognize PDF bytes', async () => {
  const detected = await defaultFileTypeDetector(Buffer.from('%PDF-1.7\n1 0 obj\n'));
  assert.equal(detected?.mime, 'application/pdf');
  assert.equal(detected?.ext, 'pdf');
});

test('the real R2 presigner fixes Content-Length without an empty-body checksum', async t => {
  const client = createR2Client({
    ready: true,
    endpoint: 'https://00000000000000000000000000000000.eu.r2.cloudflarestorage.com',
    accessKeyId: 'unit-test-access-key',
    secretAccessKey: 'unit-test-secret-key'
  });
  t.after(() => client.destroy());

  const signedUrl = await getSignedUrl(client, new PutObjectCommand({
    Bucket: 'elysium-test-private',
    Key: '_quarantine/elysiumdr-eu/test/intent/payload',
    ContentType: 'application/pdf',
    ContentLength: 123,
    IfNoneMatch: '*'
  }), {
    expiresIn: 300,
    signableHeaders: new Set(['content-length', 'content-type', 'if-none-match'])
  });
  const query = new URL(signedUrl).searchParams;
  const signedHeaders = new Set(query.get('X-Amz-SignedHeaders').split(';'));

  assert.equal(query.get('x-amz-checksum-crc32'), null);
  assert.equal(query.get('x-amz-sdk-checksum-algorithm'), null);
  assert.deepEqual(signedHeaders, new Set([
    'content-length', 'content-type', 'host', 'if-none-match'
  ]));
});

function memoryRepository() {
  const intents = new Map();
  const files = new Map();
  const activities = [];
  return {
    intents,
    files,
    activities,
    async entityExists(collection, id) {
      return collection === 'contacts' && id === 'contact_abc';
    },
    async getEntity(collection, id) {
      if (collection !== 'contacts' || id !== 'contact_abc') return null;
      return { id, ownerId: corporateUser.uid, displayName: 'Test Contact' };
    },
    async createIntent(intent) {
      intents.set(intent.id, { ...intent });
    },
    async getIntent(id) {
      return intents.get(id) || null;
    },
    async claimIntent(id, uid, attemptId, nowMillis) {
      const intent = intents.get(id);
      if (!intent) throw new FileRouteError('not found', 'intent_not_found', 404);
      if (intent.actorUid !== uid) throw new FileRouteError('forbidden', 'intent_forbidden', 403);
      if (intent.status === 'completed') return { kind: 'completed', intent: { ...intent } };
      if (intent.expiresAt.toMillis() <= nowMillis) throw new FileRouteError('expired', 'intent_expired', 410);
      Object.assign(intent, { status: 'completing', attemptId });
      return { kind: 'claimed', intent: { ...intent } };
    },
    async releaseIntent(id, attemptId, errorCode) {
      const intent = intents.get(id);
      if (intent?.attemptId === attemptId) Object.assign(intent, { status: 'pending', attemptId: null, lastError: errorCode });
    },
    async rejectIntent(id, attemptId, errorCode) {
      const intent = intents.get(id);
      if (intent && (intent.attemptId === attemptId || attemptId == null)) {
        Object.assign(intent, { status: 'rejected', attemptId: null, lastError: errorCode });
      }
    },
    async completeIntent(intent, file, identity, canAccessEntity) {
      const entity = await this.getEntity(
        intent.authorizationCollection || intent.entityCollection,
        intent.entityId
      );
      if (!entity || canAccessEntity(entity) !== true) {
        throw new FileRouteError('not found', 'entity_not_found', 404);
      }
      const storedIntent = intents.get(intent.id);
      Object.assign(storedIntent, { status: 'completed', fileId: file.id, attemptId: null });
      files.set(file.id, { ...file });
      activities.push({ type: 'file_uploaded', fileId: file.id, actorUid: identity.uid });
    },
    async getFile(id) {
      return files.get(id) || null;
    },
    async claimFileDeletion(id, uid, attemptId, _nowMillis, canAdminDelete) {
      const file = files.get(id);
      if (!file) throw new FileRouteError('not found', 'file_not_found', 404);
      if (!canAdminDelete && file.uploadedByUid !== uid) {
        throw new FileRouteError('forbidden', 'file_delete_forbidden', 403);
      }
      if (file.status === 'deleted') return { kind: 'deleted', file: { ...file } };
      Object.assign(file, { status: 'deleting', deleteAttemptId: attemptId });
      return { kind: 'claimed', file: { ...file } };
    },
    async releaseFileDeletion(id, attemptId, errorCode) {
      const file = files.get(id);
      if (file?.deleteAttemptId === attemptId) {
        Object.assign(file, { status: 'ready', deleteAttemptId: null, lastDeleteError: errorCode });
      }
    },
    async completeFileDeletion(file, identity) {
      const stored = files.get(file.id);
      Object.assign(stored, { status: 'deleted', objectKey: null });
      activities.push({ type: 'file_deleted', fileId: file.id, actorUid: identity.uid });
    }
  };
}

async function startTestApi(t, overrides = {}) {
  const repository = overrides.repository || memoryRepository();
  const commands = [];
  const signatures = [];
  const pdf = Buffer.from('%PDF-1.7\n% Elysium test\n');
  const r2Client = overrides.r2Client || {
    async send(command) {
      commands.push(command);
      switch (command.constructor.name) {
        case 'HeadObjectCommand':
          return { ContentLength: pdf.length, ContentType: 'application/pdf', ETag: '"pdf-etag"' };
        case 'GetObjectCommand':
          return { Body: { transformToByteArray: async () => new Uint8Array(pdf) } };
        case 'CopyObjectCommand':
          return { CopyObjectResult: { ETag: '"copy-etag"' } };
        case 'DeleteObjectCommand':
          return {};
        default:
          throw new Error(`Unexpected command ${command.constructor.name}`);
      }
    }
  };
  const users = {
    'staff-token': corporateUser,
    'other-staff-token': {
      uid: 'other_agent', email: 'other.agent@elysiumdr.eu', email_verified: true, role: 'agent'
    },
    'manager-token': {
      uid: 'manager_1', email: 'manager@elysiumdr.eu', email_verified: true, crmRole: 'manager'
    },
    'external-token': {
      uid: 'external_1', email: 'person@example.com', email_verified: true, role: 'viewer'
    }
  };
  const ids = ['intent_123', 'complete_123', 'delete_123'];
  const router = createR2FileRouter({
    firebaseAuth: {
      async verifyIdToken(token, checkRevoked) {
        assert.equal(checkRevoked, true);
        if (!users[token]) throw new Error('bad token');
        return users[token];
      }
    },
    isFirebaseAdmin: identity => identity?.admin === true,
    repository,
    r2Client,
    configuration: {
      ready: true,
      bucket: 'elysium-test-private',
      uploadTtlSeconds: 300,
      downloadTtlSeconds: 90
    },
    signUrl: async (_client, command, settings) => {
      signatures.push({ command, settings });
      return `https://signed.example/${command.constructor.name}/${encodeURIComponent(command.input.Key)}`;
    },
    detectFileType: async () => ({ mime: 'application/pdf', ext: 'pdf' }),
    now: () => new Date('2026-08-18T12:00:00.000Z'),
    randomUUID: () => ids.shift() || 'fallback_id',
    ...overrides
  });
  const app = express();
  app.use(express.json({ limit: '64kb' }));
  app.use('/api/files', router);
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, '127.0.0.1', error => error ? reject(error) : resolve(instance));
  });
  t.after(() => new Promise(resolve => {
    // Undici conserva conexiones keep-alive; cerrarlas evita que el callback
    // de `server.close()` deje colgada la suite tras completar los asserts.
    server.closeAllConnections();
    server.close(resolve);
  }));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}/api/files`,
    repository,
    commands,
    signatures,
    pdf
  };
}

async function jsonResponse(response) {
  return { status: response.status, body: await response.json() };
}

test('R2 router completes the private upload, signs download and audits deletion', async t => {
  const api = await startTestApi(t);
  const headers = { Authorization: 'Bearer staff-token', 'Content-Type': 'application/json' };

  const denied = await jsonResponse(await fetch(`${api.baseUrl}/upload-intents`, {
    method: 'POST',
    headers: { ...headers, Authorization: 'Bearer external-token' },
    body: JSON.stringify({
      purpose: 'contact_attachment', entityId: 'contact_abc', originalName: 'brief.pdf',
      contentType: 'application/pdf', size: api.pdf.length
    })
  }));
  assert.equal(denied.status, 403);
  assert.equal(denied.body.code, 'crm_access_required');

  const issued = await jsonResponse(await fetch(`${api.baseUrl}/upload-intents`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      purpose: 'contact_attachment', entityId: 'contact_abc', originalName: 'brief.pdf',
      contentType: 'application/pdf', size: api.pdf.length
    })
  }));
  assert.equal(issued.status, 201);
  assert.equal(issued.body.intentId, 'intent_123');
  assert.equal(issued.body.method, 'PUT');
  assert.equal(issued.body.expectedBytes, api.pdf.length);
  assert.deepEqual(issued.body.requiredHeaders, {
    'Content-Type': 'application/pdf',
    'If-None-Match': '*'
  });
  assert.equal(api.signatures[0].command.constructor.name, 'PutObjectCommand');
  assert.equal(api.signatures[0].command.input.ContentLength, api.pdf.length);
  assert.equal(api.signatures[0].command.input.IfNoneMatch, '*');
  assert.equal(api.signatures[0].settings.signableHeaders.has('content-length'), true);
  assert.match(api.signatures[0].command.input.Key, /^_quarantine\//);

  const completed = await jsonResponse(await fetch(
    `${api.baseUrl}/upload-intents/${issued.body.intentId}/complete`,
    { method: 'POST', headers }
  ));
  assert.equal(completed.status, 201);
  assert.equal(completed.body.file.status, 'ready');
  assert.equal(completed.body.file.tenantId, 'elysiumdr-eu');
  assert.equal(completed.body.file.bytes, api.pdf.length);
  assert.equal(completed.body.file.originalName, 'brief.pdf');
  assert.equal('objectKey' in completed.body.file, false, 'internal R2 key must not leave the API');
  assert.deepEqual(api.commands.map(command => command.constructor.name), [
    'HeadObjectCommand', 'GetObjectCommand', 'CopyObjectCommand'
  ]);
  const copy = api.commands.find(command => command.constructor.name === 'CopyObjectCommand');
  assert.match(copy.input.Key, /^crm\/elysiumdr-eu\/contacts\/contact_abc\/attachments\//);
  assert.equal(copy.input.CopySourceIfMatch, '"pdf-etag"');
  assert.match(copy.input.ContentDisposition, /^attachment;/);
  assert.equal(api.repository.activities[0].type, 'file_uploaded');

  const unrelatedUpload = await jsonResponse(await fetch(`${api.baseUrl}/upload-intents`, {
    method: 'POST',
    headers: { ...headers, Authorization: 'Bearer other-staff-token' },
    body: JSON.stringify({
      purpose: 'contact_attachment', entityId: 'contact_abc', originalName: 'other.pdf',
      contentType: 'application/pdf', size: api.pdf.length
    })
  }));
  assert.equal(unrelatedUpload.status, 404);
  assert.equal(unrelatedUpload.body.code, 'entity_not_found');

  const unrelatedDownload = await jsonResponse(await fetch(
    `${api.baseUrl}/${completed.body.file.id}/download-url`,
    { method: 'POST', headers: { ...headers, Authorization: 'Bearer other-staff-token' } }
  ));
  assert.equal(unrelatedDownload.status, 404);
  assert.equal(unrelatedDownload.body.code, 'entity_not_found');

  const download = await jsonResponse(await fetch(
    `${api.baseUrl}/${completed.body.file.id}/download-url`,
    { method: 'POST', headers }
  ));
  assert.equal(download.status, 200);
  assert.match(download.body.url, /^https:\/\/signed\.example\/GetObjectCommand\//);
  assert.equal(api.signatures.at(-1).settings.expiresIn, 90);

  const removed = await jsonResponse(await fetch(`${api.baseUrl}/${completed.body.file.id}`, {
    method: 'DELETE', headers
  }));
  assert.equal(removed.status, 200);
  assert.deepEqual(removed.body, { ok: true, idempotent: false });
  assert.equal(api.repository.files.get(completed.body.file.id).status, 'deleted');
  assert.equal(api.repository.activities.at(-1).type, 'file_deleted');
  const finalDelete = api.commands.at(-1);
  assert.equal(finalDelete.constructor.name, 'DeleteObjectCommand');
  assert.match(finalDelete.input.Key, /^crm\/elysiumdr-eu\//);
});

test('legacy members and prospects can authorize contact attachments without changing the R2 key model', async t => {
  const repository = memoryRepository();
  repository.getEntity = async (collection, id) => (
    collection === 'members' && id === 'member_abc'
      ? { id, name: 'Legacy Member' }
      : null
  );
  const api = await startTestApi(t, { repository });
  const requestBody = JSON.stringify({
    purpose: 'contact_attachment', entityId: 'member_abc', originalName: 'legacy.pdf',
    contentType: 'application/pdf', size: api.pdf.length
  });

  const denied = await jsonResponse(await fetch(`${api.baseUrl}/upload-intents`, {
    method: 'POST',
    headers: { Authorization: 'Bearer staff-token', 'Content-Type': 'application/json' },
    body: requestBody
  }));
  assert.equal(denied.status, 404, 'an ordinary agent must not attach to an unassigned legacy record');

  const issued = await jsonResponse(await fetch(`${api.baseUrl}/upload-intents`, {
    method: 'POST',
    headers: { Authorization: 'Bearer manager-token', 'Content-Type': 'application/json' },
    body: requestBody
  }));
  assert.equal(issued.status, 201);
  const intent = repository.intents.get(issued.body.intentId);
  assert.equal(intent.entityCollection, 'contacts');
  assert.equal(intent.authorizationCollection, 'members');
  assert.match(intent.finalKey, /^crm\/elysiumdr-eu\/contacts\/member_abc\/attachments\//);

  const completed = await jsonResponse(await fetch(
    `${api.baseUrl}/upload-intents/${issued.body.intentId}/complete`,
    { method: 'POST', headers: { Authorization: 'Bearer manager-token' } }
  ));
  assert.equal(completed.status, 201);
  assert.equal(repository.files.get(completed.body.file.id).authorizationCollection, 'members');
  assert.equal(repository.files.get(completed.body.file.id).entityId, 'member_abc');
});

test('a mismatched uploaded size is rejected and quarantine is deleted', async t => {
  const repository = memoryRepository();
  const commands = [];
  const r2Client = {
    async send(command) {
      commands.push(command);
      if (command.constructor.name === 'HeadObjectCommand') {
        return { ContentLength: 999, ContentType: 'application/pdf', ETag: '"bad"' };
      }
      if (command.constructor.name === 'DeleteObjectCommand') return {};
      throw new Error(`Unexpected command ${command.constructor.name}`);
    }
  };
  const api = await startTestApi(t, { repository, r2Client });
  const headers = { Authorization: 'Bearer staff-token', 'Content-Type': 'application/json' };
  const issued = await jsonResponse(await fetch(`${api.baseUrl}/upload-intents`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      purpose: 'contact_attachment', entityId: 'contact_abc', originalName: 'brief.pdf',
      contentType: 'application/pdf', size: api.pdf.length
    })
  }));
  const completed = await jsonResponse(await fetch(
    `${api.baseUrl}/upload-intents/${issued.body.intentId}/complete`,
    { method: 'POST', headers }
  ));
  assert.equal(completed.status, 422);
  assert.equal(completed.body.code, 'uploaded_size_mismatch');
  assert.deepEqual(commands.map(command => command.constructor.name), [
    'HeadObjectCommand', 'DeleteObjectCommand'
  ]);
  assert.equal(repository.intents.get(issued.body.intentId).status, 'rejected');
  assert.equal(repository.files.size, 0);
});

test('a malformed file that makes the detector throw is rejected, not retried as a 500', async t => {
  const repository = memoryRepository();
  const api = await startTestApi(t, {
    repository,
    detectFileType: async () => { throw new Error('malformed container'); }
  });
  const headers = { Authorization: 'Bearer staff-token', 'Content-Type': 'application/json' };
  const issued = await jsonResponse(await fetch(`${api.baseUrl}/upload-intents`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      purpose: 'contact_attachment', entityId: 'contact_abc', originalName: 'brief.pdf',
      contentType: 'application/pdf', size: api.pdf.length
    })
  }));
  const completed = await jsonResponse(await fetch(
    `${api.baseUrl}/upload-intents/${issued.body.intentId}/complete`,
    { method: 'POST', headers }
  ));
  assert.equal(completed.status, 422);
  assert.equal(completed.body.code, 'file_type_unverified');
  assert.equal(repository.intents.get(issued.body.intentId).status, 'rejected');
  assert.deepEqual(api.commands.map(command => command.constructor.name), [
    'HeadObjectCommand', 'GetObjectCommand', 'DeleteObjectCommand'
  ]);
});

test('a Firestore failure after R2 deletion never restores a broken file to ready', async t => {
  t.mock.method(console, 'error', () => {});
  const repository = memoryRepository();
  let releaseCalls = 0;
  const originalRelease = repository.releaseFileDeletion.bind(repository);
  repository.releaseFileDeletion = async (...args) => {
    releaseCalls += 1;
    return originalRelease(...args);
  };
  repository.completeFileDeletion = async () => {
    throw new Error('simulated Firestore outage after R2 delete');
  };
  const api = await startTestApi(t, { repository });
  const headers = { Authorization: 'Bearer staff-token', 'Content-Type': 'application/json' };

  const issued = await jsonResponse(await fetch(`${api.baseUrl}/upload-intents`, {
    method: 'POST', headers,
    body: JSON.stringify({
      purpose: 'contact_attachment', entityId: 'contact_abc', originalName: 'brief.pdf',
      contentType: 'application/pdf', size: api.pdf.length
    })
  }));
  const completed = await jsonResponse(await fetch(
    `${api.baseUrl}/upload-intents/${issued.body.intentId}/complete`,
    { method: 'POST', headers }
  ));
  const removed = await jsonResponse(await fetch(`${api.baseUrl}/${completed.body.file.id}`, {
    method: 'DELETE', headers
  }));

  assert.equal(removed.status, 500);
  assert.equal(releaseCalls, 0);
  assert.equal(repository.files.get(completed.body.file.id).status, 'deleting');
  assert.equal(api.commands.at(-1).constructor.name, 'DeleteObjectCommand');
});
