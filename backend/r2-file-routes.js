'use strict';

/**
 * Archivos privados del CRM sobre Cloudflare R2.
 *
 * El navegador recibe una autorización PUT breve para una clave aleatoria de
 * cuarentena. La clave definitiva sólo la escribe este servicio después de
 * comprobar tamaño, Content-Type y la firma binaria detectable. R2 no admite
 * formularios POST prefirmados con `content-length-range`; por eso el tamaño se
 * vuelve a comprobar con HeadObject y un objeto pendiente nunca se publica.
 *
 * La detección por magic bytes reduce archivos mal etiquetados, pero NO es un
 * antivirus. Los documentos se sirven como descarga. Antes de aceptar formatos
 * ejecutables o renderizarlos inline debe incorporarse un escáner antimalware.
 */
const crypto = require('node:crypto');
const express = require('express');
const {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');

const INTENTS_COLLECTION = 'file_upload_intents';
const FILES_COLLECTION = 'files';
const ACTIVITIES_COLLECTION = 'activities';
const UPLOAD_LEASE_MS = 2 * 60 * 1000;
const DELETE_LEASE_MS = 2 * 60 * 1000;
const DEFAULT_UPLOAD_TTL_SECONDS = 300;
const DEFAULT_DOWNLOAD_TTL_SECONDS = 90;
const MIME_SNIFF_BYTES = 64 * 1024;
const ONE_MIB = 1024 * 1024;
const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;
const TENANT_ID = 'elysiumdr-eu';

const IMAGE_MIMES = Object.freeze({
  'image/jpeg': Object.freeze({ extension: 'jpg', filenameExtensions: ['jpg', 'jpeg'] }),
  'image/png': Object.freeze({ extension: 'png', filenameExtensions: ['png'] }),
  'image/webp': Object.freeze({ extension: 'webp', filenameExtensions: ['webp'] })
});

const PDF_MIME = Object.freeze({
  'application/pdf': Object.freeze({ extension: 'pdf', filenameExtensions: ['pdf'] })
});

const DOCUMENT_MIMES = Object.freeze({
  ...PDF_MIME,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': Object.freeze({
    extension: 'docx',
    filenameExtensions: ['docx']
  })
});

/** La finalidad decide colección, prefijo, formatos y límite; el cliente no. */
const UPLOAD_POLICIES = Object.freeze({
  avatar: Object.freeze({
    entityType: 'user',
    entityCollection: 'users',
    authorizationCollections: Object.freeze(['users']),
    pathSegment: 'avatar',
    maxBytes: 5 * ONE_MIB,
    mimes: IMAGE_MIMES,
    disposition: 'inline',
    cacheControl: 'private, max-age=300'
  }),
  contact_image: Object.freeze({
    entityType: 'contact',
    entityCollection: 'contacts',
    authorizationCollections: Object.freeze(['contacts', 'members', 'prospects']),
    pathSegment: 'images',
    maxBytes: 8 * ONE_MIB,
    mimes: IMAGE_MIMES,
    disposition: 'inline',
    cacheControl: 'private, max-age=300'
  }),
  contact_attachment: Object.freeze({
    entityType: 'contact',
    entityCollection: 'contacts',
    authorizationCollections: Object.freeze(['contacts', 'members', 'prospects']),
    pathSegment: 'attachments',
    maxBytes: 20 * ONE_MIB,
    mimes: DOCUMENT_MIMES,
    disposition: 'attachment',
    cacheControl: 'private, no-store'
  }),
  legal_document: Object.freeze({
    entityType: 'contact',
    entityCollection: 'contacts',
    authorizationCollections: Object.freeze(['contacts', 'members', 'prospects']),
    pathSegment: 'legal',
    maxBytes: 25 * ONE_MIB,
    mimes: PDF_MIME,
    disposition: 'attachment',
    cacheControl: 'private, no-store'
  })
});

class FileRouteError extends Error {
  constructor(message, code, status = 400, field = null) {
    super(message);
    this.name = 'FileRouteError';
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (Number.isFinite(value.seconds)) return value.seconds * 1000;
  return Number(value) || 0;
}

function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

function configuredDomains(value = process.env.CRM_EMAIL_DOMAINS || 'elysiumdr.eu') {
  return new Set(String(value)
    .split(',')
    .map(item => item.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean));
}

function configuredRoles(value = process.env.CRM_FILE_ROLES || 'admin,manager,agent,sales,operations') {
  return new Set(String(value)
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean));
}

function configuredGlobalFileRoles(value = process.env.CRM_FILE_GLOBAL_ROLES || 'manager,operations') {
  return new Set(String(value)
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean));
}

function isCorporateIdentity(identity, {
  domains = configuredDomains(),
  roles = configuredRoles(),
  isAdmin = () => false
} = {}) {
  if (!identity || identity.email_verified !== true || identity.crmDisabled === true) return false;
  const email = String(identity.email || '').trim().toLowerCase();
  const at = email.lastIndexOf('@');
  const domain = at >= 0 ? email.slice(at + 1) : '';
  const role = String(identity.crmRole || identity.role || '').trim().toLowerCase();
  const explicitTenantAccess = String(identity.crmTenantId || identity.tenantId || '') === TENANT_ID
    && (
      identity.crmAccess === true
      || identity.crm_access === true
      || identity.staff === true
      || roles.has(role)
    );
  return domains.has(domain)
    || explicitTenantAccess
    || isAdmin(identity);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeOriginalName(value) {
  const raw = String(value || '');
  if (!raw.isWellFormed()) {
    throw new FileRouteError('The original file name is invalid.', 'filename_invalid', 400, 'originalName');
  }
  const name = raw.normalize('NFC').trim();
  if (!name || name.length > 180 || name === '.' || name === '..'
    || /[\u0000-\u001f\u007f/\\\u200e\u200f\u202a-\u202e\u2066-\u2069]/.test(name)) {
    throw new FileRouteError('The original file name is invalid.', 'filename_invalid', 400, 'originalName');
  }
  return name;
}

function identityPermissions(identity) {
  const raw = identity?.permissions;
  if (Array.isArray(raw)) return new Set(raw.map(value => String(value).trim().toLowerCase()));
  if (typeof raw === 'string') {
    return new Set(raw.split(',').map(value => value.trim().toLowerCase()).filter(Boolean));
  }
  return new Set();
}

/**
 * ACL por registro. Los managers/operations configurados pueden operar sobre
 * toda la entidad; el resto necesita ser owner/assignee/creator o colaborador.
 * Los documentos legacy sin ownership quedan, de forma deliberada, sólo para
 * roles globales hasta que una migración les asigne `ownerId`.
 */
function defaultCanAccessEntity(identity, entity, {
  action,
  entityCollection,
  entityId,
  isAdmin = () => false,
  globalRoles = configuredGlobalFileRoles()
} = {}) {
  if (!identity || !entity) return false;
  if (isAdmin(identity) || identity.crmFilesAll === true || identity.fileAccessAll === true) return true;

  const role = String(identity.crmRole || identity.role || '').trim().toLowerCase();
  if (globalRoles.has(role)) return true;
  if (entityCollection === 'users') return entityId === identity.uid;

  const permissions = identityPermissions(identity);
  if (permissions.has('files:all')
    || permissions.has(`${entityCollection}:files:all`)
    || permissions.has(`${entityCollection}:files:${action}:all`)) {
    return true;
  }

  const directIds = [
    entity.ownerId,
    entity.ownerUid,
    entity.assigneeId,
    entity.createdBy,
    entity.createdByUid
  ].filter(value => typeof value === 'string');
  if (directIds.includes(identity.uid)) return true;

  const sharedFields = ['authorizedUserIds', 'collaboratorUids', 'teamMemberIds'];
  if (action === 'read') sharedFields.push('readerUids');
  if (action === 'write') sharedFields.push('editorUids');
  return sharedFields.some(field => Array.isArray(entity[field]) && entity[field].includes(identity.uid));
}

function safeStorageSegment(value) {
  const raw = String(value || '');
  if (SAFE_ID.test(raw)) return raw;
  return `sha256-${crypto.createHash('sha256').update(raw).digest('hex')}`;
}

function filenameExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 && lastDot < filename.length - 1
    ? filename.slice(lastDot + 1).toLowerCase()
    : '';
}

function normalizeUploadIntentInput(body, identity, { isAdmin = () => false } = {}) {
  if (!isPlainObject(body)) {
    throw new FileRouteError('A JSON object is required.', 'body_invalid');
  }
  const allowedKeys = new Set(['purpose', 'entityId', 'originalName', 'contentType', 'size']);
  const unexpected = Object.keys(body).filter(key => !allowedKeys.has(key));
  if (unexpected.length) {
    throw new FileRouteError('The upload request contains unsupported fields.', 'body_fields_invalid');
  }

  const purpose = String(body.purpose || '').trim();
  const policy = UPLOAD_POLICIES[purpose];
  if (!policy) {
    throw new FileRouteError('The upload purpose is not allowed.', 'purpose_invalid', 400, 'purpose');
  }

  const entityId = String(body.entityId || '').trim();
  if (!SAFE_ID.test(entityId)) {
    throw new FileRouteError('The related record identifier is invalid.', 'entity_id_invalid', 400, 'entityId');
  }
  if (purpose === 'avatar' && entityId !== identity.uid && !isAdmin(identity)) {
    throw new FileRouteError('You cannot upload an avatar for another user.', 'entity_forbidden', 403);
  }

  const contentType = String(body.contentType || '').trim().toLowerCase();
  const mimePolicy = policy.mimes[contentType];
  if (!mimePolicy) {
    throw new FileRouteError('This file type is not allowed for that purpose.', 'content_type_invalid', 400, 'contentType');
  }

  const size = Number(body.size);
  if (!Number.isSafeInteger(size) || size <= 0 || size > policy.maxBytes) {
    throw new FileRouteError(
      `The file must be between 1 byte and ${Math.floor(policy.maxBytes / ONE_MIB)} MiB.`,
      'file_size_invalid',
      400,
      'size'
    );
  }

  const originalName = safeOriginalName(body.originalName);
  if (!mimePolicy.filenameExtensions.includes(filenameExtension(originalName))) {
    throw new FileRouteError('The file extension does not match its declared type.', 'filename_type_mismatch', 400, 'originalName');
  }

  return {
    purpose,
    entityId,
    entityType: policy.entityType,
    entityCollection: policy.entityCollection,
    originalName,
    contentType,
    size,
    extension: mimePolicy.extension,
    policy
  };
}

function normalizedIdentifier(value, field = 'id') {
  const id = String(value || '').trim();
  if (!SAFE_ID.test(id)) {
    throw new FileRouteError('The identifier is invalid.', 'id_invalid', 400, field);
  }
  return id;
}

function objectKeys({ identity, intentId, upload, now = new Date() }) {
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const actorSegment = safeStorageSegment(identity.uid);
  return {
    quarantineKey: `_quarantine/elysiumdr-eu/${actorSegment}/${intentId}/payload`,
    finalKey: `crm/elysiumdr-eu/${upload.entityCollection}/${upload.entityId}/${
      upload.policy.pathSegment}/${year}/${month}/${intentId}.${upload.extension}`
  };
}

function encodeCopySource(bucket, key) {
  return `${encodeURIComponent(bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function hasUnsafeKeySegments(key) {
  return key.includes('\u0000') || key.split('/').some(segment => !segment || segment === '.' || segment === '..');
}

function assertManagedIntentKeys(intent) {
  const policy = UPLOAD_POLICIES[intent?.purpose];
  const expectedQuarantine = `_quarantine/elysiumdr-eu/${safeStorageSegment(intent?.actorUid)}/${intent?.id}/payload`;
  const finalPrefix = policy
    ? `crm/elysiumdr-eu/${policy.entityCollection}/${intent.entityId}/${policy.pathSegment}/`
    : '';
  const finalSuffix = `/${intent?.id}.${intent?.extension}`;
  const finalKey = String(intent?.finalKey || '');
  const datePath = finalKey.startsWith(finalPrefix) && finalKey.endsWith(finalSuffix)
    ? finalKey.slice(finalPrefix.length, -finalSuffix.length)
    : '';
  const mime = policy?.mimes?.[intent?.contentType];
  const authorizationCollections = policy?.authorizationCollections || [policy?.entityCollection];
  if (!policy
    || intent.entityType !== policy.entityType
    || intent.entityCollection !== policy.entityCollection
    || !authorizationCollections.includes(intent.authorizationCollection || intent.entityCollection)
    || intent.maxBytes !== policy.maxBytes
    || !mime
    || mime.extension !== intent.extension
    || intent.quarantineKey !== expectedQuarantine
    || !finalKey.startsWith(finalPrefix)
    || !finalKey.endsWith(finalSuffix)
    || !/^\d{4}\/(0[1-9]|1[0-2])$/.test(datePath)
    || hasUnsafeKeySegments(intent.finalKey)) {
    throw new FileRouteError('The upload intent contains invalid storage metadata.', 'intent_record_invalid', 409);
  }
  return intent;
}

function assertManagedFileKey(file, expectedBucket = null) {
  const key = String(file?.objectKey || '');
  const policy = UPLOAD_POLICIES[file?.purpose];
  const mime = policy?.mimes?.[file?.contentType];
  const prefix = policy && SAFE_ID.test(String(file?.entityId || ''))
    ? `crm/elysiumdr-eu/${policy.entityCollection}/${file.entityId}/${policy.pathSegment}/`
    : '';
  const suffix = mime && SAFE_ID.test(String(file?.id || ''))
    ? `/${file.id}.${mime.extension}`
    : '';
  const datePath = prefix && suffix && key.startsWith(prefix) && key.endsWith(suffix)
    ? key.slice(prefix.length, -suffix.length)
    : '';
  const authorizationCollections = policy?.authorizationCollections || [policy?.entityCollection];
  if (file?.provider !== 'cloudflare-r2'
    || (expectedBucket !== null && file.bucket !== expectedBucket)
    || !policy
    || file.entityType !== policy.entityType
    || !authorizationCollections.includes(file.authorizationCollection || policy.entityCollection)
    || !mime
    || !prefix
    || !suffix
    || !key.startsWith(prefix)
    || !key.endsWith(suffix)
    || !/^\d{4}\/(0[1-9]|1[0-2])$/.test(datePath)
    || !Number.isSafeInteger(file.size)
    || file.size <= 0
    || file.size > policy.maxBytes
    || hasUnsafeKeySegments(key)) {
    throw new FileRouteError('The file record contains an invalid storage key.', 'file_record_invalid', 409);
  }
  return key;
}

function contentDisposition(mode, filename) {
  const ascii = filename
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_')
    .slice(0, 150);
  const encoded = encodeURIComponent(filename)
    .replace(/['()*]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${mode}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

function validateUploadedHead(head, intent) {
  const actualBytes = Number(head?.ContentLength);
  if (!Number.isSafeInteger(actualBytes)
    || actualBytes !== intent.expectedBytes
    || actualBytes <= 0
    || actualBytes > intent.maxBytes) {
    throw new FileRouteError('The uploaded object has an unexpected size.', 'uploaded_size_mismatch', 422);
  }
  const actualType = String(head?.ContentType || '').trim().toLowerCase();
  if (actualType !== intent.contentType) {
    throw new FileRouteError('The uploaded object has an unexpected Content-Type.', 'uploaded_type_mismatch', 422);
  }
  if (!String(head?.ETag || '').trim()) {
    throw new FileRouteError('R2 did not return an object identifier.', 'uploaded_etag_missing', 502);
  }
  return { bytes: actualBytes, contentType: actualType, etag: String(head.ETag) };
}

function validateDetectedType(detected, intent) {
  const detectedMime = String(detected?.mime || '').trim().toLowerCase();
  if (!detectedMime || detectedMime !== intent.contentType) {
    throw new FileRouteError(
      'The binary content does not match the allowed file type.',
      'file_type_unverified',
      422
    );
  }
  return detectedMime;
}

function serializeFile(file) {
  if (!file) return null;
  return {
    id: file.id,
    tenantId: file.tenantId,
    status: file.status,
    entityType: file.entityType,
    entityId: file.entityId,
    purpose: file.purpose,
    originalName: file.originalName,
    contentType: file.contentType,
    size: file.size,
    bytes: file.bytes ?? file.size,
    uploadedByUid: file.uploadedByUid
  };
}

async function bodyToBuffer(body, maximumBytes = MIME_SNIFF_BYTES) {
  if (!body) throw new FileRouteError('R2 returned an empty object.', 'uploaded_body_missing', 502);
  if (typeof body.transformToByteArray === 'function') {
    const bytes = await body.transformToByteArray();
    if (bytes.byteLength > maximumBytes) {
      throw new FileRouteError('The inspection response exceeded its bound.', 'inspection_too_large', 502);
    }
    return Buffer.from(bytes);
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of body) {
    const buffer = Buffer.from(chunk);
    total += buffer.length;
    if (total > maximumBytes) {
      throw new FileRouteError('The inspection response exceeded its bound.', 'inspection_too_large', 502);
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks, total);
}

async function defaultFileTypeDetector(buffer) {
  // `file-type` es ESM; la importación dinámica mantiene CommonJS en el backend.
  const { fileTypeFromBuffer } = await import('file-type');
  return fileTypeFromBuffer(buffer);
}

function r2Configuration(environment = process.env) {
  const endpoint = String(environment.R2_ENDPOINT || '').trim().replace(/\/$/, '');
  const bucket = String(environment.R2_BUCKET || '').trim();
  const accessKeyId = String(environment.R2_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = String(environment.R2_SECRET_ACCESS_KEY || '').trim();
  let endpointValid = false;
  try {
    const parsed = new URL(endpoint);
    endpointValid = parsed.protocol === 'https:' && parsed.username === '' && parsed.password === '';
  } catch (_error) {
    endpointValid = false;
  }
  return {
    endpoint,
    bucket,
    accessKeyId,
    secretAccessKey,
    uploadTtlSeconds: boundedInteger(
      environment.R2_UPLOAD_URL_TTL_SECONDS,
      DEFAULT_UPLOAD_TTL_SECONDS,
      60,
      600
    ),
    downloadTtlSeconds: boundedInteger(
      environment.R2_DOWNLOAD_URL_TTL_SECONDS,
      DEFAULT_DOWNLOAD_TTL_SECONDS,
      30,
      300
    ),
    ready: endpointValid && Boolean(bucket && accessKeyId && secretAccessKey)
  };
}

function createR2Client(configuration) {
  if (!configuration?.ready) return null;
  return new S3Client({
    region: 'auto',
    endpoint: configuration.endpoint,
    // AWS SDK v3 puede calcular CRC32 de un Body ausente al prefirmar. En un
    // PUT de navegador ese valor representaría un cuerpo vacío y R2 podría
    // rechazar cualquier archivo real. Conservamos checksums sólo si el API
    // los exige expresamente y validamos el objeto al completar la carga.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    credentials: {
      accessKeyId: configuration.accessKeyId,
      secretAccessKey: configuration.secretAccessKey
    }
  });
}

function actorActivity(identity, type, file, extraPayload = {}) {
  const uploaded = type === 'file_uploaded';
  return {
    schemaVersion: 1,
    tenantId: TENANT_ID,
    type,
    entityType: file.entityType,
    entityId: file.entityId,
    contactId: file.entityType === 'contact' ? file.entityId : null,
    opportunityId: null,
    meetingId: null,
    fileId: file.id,
    summary: uploaded ? 'Archivo adjuntado' : 'Archivo eliminado',
    body: file.originalName,
    actorUid: identity.uid,
    actorEmail: identity.email,
    actorRole: String(identity.crmRole || identity.role || (identity.admin === true ? 'admin' : 'staff')),
    payload: {
      purpose: file.purpose,
      originalName: file.originalName,
      contentType: file.contentType,
      size: file.size,
      ...extraPayload
    },
    // `occurredAt` alimenta las consultas tenant-aware del CRM nuevo;
    // `createdAt` preserva compatibilidad con el historial legacy.
    occurredAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp()
  };
}

function createFirestoreFileRepository(db) {
  if (!db) throw new TypeError('A Firestore instance is required.');

  return {
    async entityExists(collection, id) {
      return (await db.collection(collection).doc(id).get()).exists;
    },

    async getEntity(collection, id) {
      const snapshot = await db.collection(collection).doc(id).get();
      return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
    },

    async createIntent(intent) {
      await db.collection(INTENTS_COLLECTION).doc(intent.id).create({
        ...intent,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      return intent;
    },

    async getIntent(id) {
      const snapshot = await db.collection(INTENTS_COLLECTION).doc(id).get();
      return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
    },

    async claimIntent(id, uid, attemptId, nowMillis) {
      const reference = db.collection(INTENTS_COLLECTION).doc(id);
      return db.runTransaction(async transaction => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) throw new FileRouteError('Upload intent not found.', 'intent_not_found', 404);
        const current = { id: snapshot.id, ...snapshot.data() };
        if (current.actorUid !== uid) {
          throw new FileRouteError('This upload intent belongs to another user.', 'intent_forbidden', 403);
        }
        if (current.status === 'completed') return { kind: 'completed', intent: current };
        if (current.status === 'rejected') {
          throw new FileRouteError('This upload was rejected.', 'intent_rejected', 409);
        }
        if (timestampMillis(current.expiresAt) <= nowMillis) {
          throw new FileRouteError('This upload intent has expired.', 'intent_expired', 410);
        }
        if (current.status === 'completing' && timestampMillis(current.leaseUntil) > nowMillis) {
          throw new FileRouteError('This upload is already being verified.', 'intent_in_progress', 409);
        }
        transaction.update(reference, {
          status: 'completing',
          attemptId,
          leaseUntil: Timestamp.fromMillis(nowMillis + UPLOAD_LEASE_MS),
          updatedAt: FieldValue.serverTimestamp()
        });
        return { kind: 'claimed', intent: { ...current, status: 'completing', attemptId } };
      });
    },

    async releaseIntent(id, attemptId, errorCode) {
      const reference = db.collection(INTENTS_COLLECTION).doc(id);
      await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) return;
        const current = snapshot.data();
        if (current.status !== 'completing' || current.attemptId !== attemptId) return;
        transaction.update(reference, {
          status: 'pending',
          attemptId: null,
          leaseUntil: null,
          lastError: errorCode || 'completion_failed',
          updatedAt: FieldValue.serverTimestamp()
        });
      });
    },

    async rejectIntent(id, attemptId, errorCode) {
      const reference = db.collection(INTENTS_COLLECTION).doc(id);
      await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) return;
        const current = snapshot.data();
        const ownsCompletionLease = current.status === 'completing' && current.attemptId === attemptId;
        const unsignedPendingIntent = current.status === 'pending' && attemptId == null;
        if (!ownsCompletionLease && !unsignedPendingIntent) return;
        transaction.update(reference, {
          status: 'rejected',
          attemptId: null,
          leaseUntil: null,
          lastError: errorCode || 'upload_rejected',
          rejectedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      });
    },

    async completeIntent(intent, file, identity, canAccessEntity) {
      const intentReference = db.collection(INTENTS_COLLECTION).doc(intent.id);
      // Los contactos comerciales nuevos viven en `contacts`; durante la
      // migración un adjunto también puede estar autorizado por el registro
      // legacy homólogo de `members` o `prospects`. La colección resuelta al
      // emitir el intent se fija y se vuelve a comprobar en esta transacción.
      const authorizationCollection = intent.authorizationCollection || intent.entityCollection;
      const entityReference = db.collection(authorizationCollection).doc(intent.entityId);
      const fileReference = db.collection(FILES_COLLECTION).doc(file.id);
      const activityReference = db.collection(ACTIVITIES_COLLECTION).doc();
      await db.runTransaction(async transaction => {
        const intentSnapshot = await transaction.get(intentReference);
        const entitySnapshot = await transaction.get(entityReference);
        if (!intentSnapshot.exists) throw new FileRouteError('Upload intent not found.', 'intent_not_found', 404);
        if (!entitySnapshot.exists) {
          throw new FileRouteError('The related CRM record no longer exists.', 'entity_not_found', 404);
        }
        const entity = { id: entitySnapshot.id, ...entitySnapshot.data() };
        if (typeof canAccessEntity !== 'function' || canAccessEntity(entity) !== true) {
          // 404 evita confirmar si existe una entidad a la que no se tiene acceso.
          throw new FileRouteError('The related CRM record was not found.', 'entity_not_found', 404);
        }
        const current = intentSnapshot.data();
        if (current.status === 'completed') return;
        if (current.status !== 'completing' || current.attemptId !== intent.attemptId) {
          throw new FileRouteError('The upload verification lease was lost.', 'intent_lease_lost', 409);
        }
        transaction.create(fileReference, {
          ...file,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
        transaction.update(intentReference, {
          status: 'completed',
          fileId: file.id,
          attemptId: null,
          leaseUntil: null,
          completedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
        transaction.create(activityReference, actorActivity(identity, 'file_uploaded', file));
      });
    },

    async getFile(id) {
      const snapshot = await db.collection(FILES_COLLECTION).doc(id).get();
      return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
    },

    async claimFileDeletion(id, uid, attemptId, nowMillis, canAdminDelete) {
      const reference = db.collection(FILES_COLLECTION).doc(id);
      return db.runTransaction(async transaction => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) throw new FileRouteError('File not found.', 'file_not_found', 404);
        const current = { id: snapshot.id, ...snapshot.data() };
        if (!canAdminDelete && current.uploadedByUid !== uid) {
          throw new FileRouteError('Only the uploader or an administrator may delete this file.', 'file_delete_forbidden', 403);
        }
        if (current.status === 'deleted') return { kind: 'deleted', file: current };
        if (current.status === 'deleting' && timestampMillis(current.deleteLeaseUntil) > nowMillis) {
          throw new FileRouteError('This file is already being deleted.', 'file_delete_in_progress', 409);
        }
        if (current.status !== 'ready' && current.status !== 'deleting') {
          throw new FileRouteError('This file is not available for deletion.', 'file_not_ready', 409);
        }
        transaction.update(reference, {
          status: 'deleting',
          deleteAttemptId: attemptId,
          deleteLeaseUntil: Timestamp.fromMillis(nowMillis + DELETE_LEASE_MS),
          updatedAt: FieldValue.serverTimestamp()
        });
        return { kind: 'claimed', file: current };
      });
    },

    async releaseFileDeletion(id, attemptId, errorCode) {
      const reference = db.collection(FILES_COLLECTION).doc(id);
      await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) return;
        const current = snapshot.data();
        if (current.status !== 'deleting' || current.deleteAttemptId !== attemptId) return;
        transaction.update(reference, {
          status: 'ready',
          deleteAttemptId: null,
          deleteLeaseUntil: null,
          lastDeleteError: errorCode || 'delete_failed',
          updatedAt: FieldValue.serverTimestamp()
        });
      });
    },

    async completeFileDeletion(file, identity, attemptId) {
      const fileReference = db.collection(FILES_COLLECTION).doc(file.id);
      const activityReference = db.collection(ACTIVITIES_COLLECTION).doc();
      await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(fileReference);
        if (!snapshot.exists) throw new FileRouteError('File not found.', 'file_not_found', 404);
        const current = snapshot.data();
        if (current.status === 'deleted') return;
        if (current.status !== 'deleting' || current.deleteAttemptId !== attemptId) {
          throw new FileRouteError('The deletion lease was lost.', 'file_delete_lease_lost', 409);
        }
        transaction.update(fileReference, {
          status: 'deleted',
          objectKey: null,
          deleteAttemptId: null,
          deleteLeaseUntil: null,
          deletedByUid: identity.uid,
          deletedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
        transaction.create(activityReference, actorActivity(identity, 'file_deleted', file));
      });
    }
  };
}

function sendFileError(response, error) {
  if (error instanceof FileRouteError) {
    const payload = { error: error.message, code: error.code };
    if (error.field) payload.field = error.field;
    return response.status(error.status).json(payload);
  }
  console.error('[r2-files] unexpected error:', error);
  return response.status(500).json({ error: 'The file service failed.', code: 'file_service_failed' });
}

async function bestEffortDelete(r2Client, configuration, key) {
  if (!r2Client || !key) return;
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: configuration.bucket, Key: key }));
  } catch (error) {
    // El lifecycle de `_quarantine/` es la segunda barrera de limpieza.
    console.error('[r2-files] could not remove quarantine object:', error?.name || error?.message || error);
  }
}

function createR2FileRouter(options = {}) {
  const router = express.Router();
  const firebaseAuth = options.firebaseAuth;
  const isAdmin = options.isFirebaseAdmin || (identity => identity?.admin === true);
  const domains = options.domains || configuredDomains();
  const roles = options.roles || configuredRoles();
  const globalFileRoles = options.globalFileRoles || configuredGlobalFileRoles();
  const canAccessEntity = options.canAccessEntity || defaultCanAccessEntity;
  const configuration = options.configuration || r2Configuration();
  const r2Client = Object.hasOwn(options, 'r2Client')
    ? options.r2Client
    : createR2Client(configuration);
  const repository = options.repository || createFirestoreFileRepository(options.db);
  const signUrl = options.signUrl || getSignedUrl;
  const detectFileType = options.detectFileType || defaultFileTypeDetector;
  const now = options.now || (() => new Date());
  const randomUUID = options.randomUUID || (() => crypto.randomUUID());

  const entityAccessContext = (identity, descriptor, action) => ({
    action,
    entityCollection: descriptor.authorizationCollection || descriptor.entityCollection,
    entityId: descriptor.entityId,
    entityType: descriptor.entityType,
    purpose: descriptor.purpose,
    isAdmin,
    globalRoles: globalFileRoles
  });

  const entityIsAccessible = (identity, entity, descriptor, action) => (
    canAccessEntity(identity, entity, entityAccessContext(identity, descriptor, action)) === true
  );

  async function requireEntityAccess(identity, descriptor, action) {
    if (typeof repository.getEntity !== 'function') {
      throw new FileRouteError('Entity authorization is not configured.', 'entity_authorization_not_configured', 503);
    }
    const policy = UPLOAD_POLICIES[descriptor.purpose];
    const candidates = descriptor.authorizationCollection
      ? [descriptor.authorizationCollection]
      : (policy?.authorizationCollections || [descriptor.entityCollection]);
    for (const authorizationCollection of candidates) {
      const entity = await repository.getEntity(authorizationCollection, descriptor.entityId);
      if (!entity) continue;
      const resolvedDescriptor = { ...descriptor, authorizationCollection };
      if (!entityIsAccessible(identity, entity, resolvedDescriptor, action)) {
        // No se busca otra colección con el mismo ID tras una denegación: eso
        // permitiría usar un registro legacy para eludir el ACL del contacto.
        throw new FileRouteError('The related CRM record was not found.', 'entity_not_found', 404);
      }
      return { entity, authorizationCollection };
    }
    // La misma respuesta para ausencia y denegación evita enumerar registros.
    throw new FileRouteError('The related CRM record was not found.', 'entity_not_found', 404);
  }

  router.use(async (request, response, next) => {
    try {
      response.set('Cache-Control', 'no-store');
      const match = String(request.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
      if (!match) throw new FileRouteError('Authentication required.', 'authentication_required', 401);
      if (!firebaseAuth || typeof firebaseAuth.verifyIdToken !== 'function') {
        throw new FileRouteError('Authentication is not configured.', 'authentication_not_configured', 503);
      }
      const identity = await firebaseAuth.verifyIdToken(match[1], true);
      if (!identity.email || identity.email_verified !== true) {
        throw new FileRouteError('Verify your email address before continuing.', 'email_not_verified', 403);
      }
      if (!isCorporateIdentity(identity, { domains, roles, isAdmin })) {
        throw new FileRouteError('Corporate CRM access is required.', 'crm_access_required', 403);
      }
      request.firebaseUser = identity;
      return next();
    } catch (error) {
      if (error instanceof FileRouteError) return sendFileError(response, error);
      return response.status(401).json({ error: 'Invalid or expired authentication token.', code: 'token_invalid' });
    }
  });

  router.use((_request, response, next) => {
    if (!configuration.ready || !r2Client) {
      return response.status(503).json({
        error: 'Private file storage is not configured.',
        code: 'r2_not_configured'
      });
    }
    return next();
  });

  router.post('/upload-intents', async (request, response) => {
    try {
      const identity = request.firebaseUser;
      const requestedUpload = normalizeUploadIntentInput(request.body, identity, { isAdmin });
      const resolvedEntity = await requireEntityAccess(identity, requestedUpload, 'write');
      const upload = {
        ...requestedUpload,
        authorizationCollection: resolvedEntity.authorizationCollection
      };

      // TODO de escalado: reservar cuota diaria por UID en una transacción de
      // Firestore o aplicar un rate limit distribuido en el ingress. Un Map en
      // memoria no protege un servicio con varias instancias y por eso no se usa.
      const issuedAt = now();
      const intentId = randomUUID();
      const keys = objectKeys({ identity, intentId, upload, now: issuedAt });
      const expiresAt = new Date(issuedAt.getTime() + configuration.uploadTtlSeconds * 1000);
      const intent = {
        id: intentId,
        tenantId: TENANT_ID,
        status: 'pending',
        actorUid: identity.uid,
        actorEmail: identity.email,
        entityType: upload.entityType,
        entityCollection: upload.entityCollection,
        authorizationCollection: upload.authorizationCollection,
        entityId: upload.entityId,
        purpose: upload.purpose,
        originalName: upload.originalName,
        contentType: upload.contentType,
        expectedBytes: upload.size,
        maxBytes: upload.policy.maxBytes,
        extension: upload.extension,
        quarantineKey: keys.quarantineKey,
        finalKey: keys.finalKey,
        disposition: upload.policy.disposition,
        cacheControl: upload.policy.cacheControl,
        expiresAt: Timestamp.fromDate(expiresAt)
      };
      await repository.createIntent(intent);

      const command = new PutObjectCommand({
        Bucket: configuration.bucket,
        Key: keys.quarantineKey,
        ContentType: upload.contentType,
        // El navegador no permite establecer este header manualmente, pero
        // fetch lo calcula. Firmarlo fija el tamaño esperado como defensa
        // adicional; HeadObject sigue siendo la comprobación autoritativa.
        ContentLength: upload.size,
        IfNoneMatch: '*'
      });
      let uploadUrl;
      try {
        uploadUrl = await signUrl(r2Client, command, {
          expiresIn: configuration.uploadTtlSeconds,
          signableHeaders: new Set(['content-length', 'content-type', 'if-none-match'])
        });
      } catch (error) {
        await repository.rejectIntent(intentId, null, 'upload_signature_failed').catch(() => {});
        throw new FileRouteError('Could not authorize the R2 upload.', 'upload_signature_failed', 502);
      }

      return response.status(201).json({
        intentId,
        method: 'PUT',
        uploadUrl,
        expiresAt: expiresAt.toISOString(),
        expectedBytes: upload.size,
        maxBytes: upload.policy.maxBytes,
        requiredHeaders: {
          'Content-Type': upload.contentType,
          'If-None-Match': '*'
        }
      });
    } catch (error) {
      return sendFileError(response, error);
    }
  });

  router.post('/upload-intents/:intentId/complete', async (request, response) => {
    const identity = request.firebaseUser;
    const intentId = (() => {
      try { return normalizedIdentifier(request.params.intentId, 'intentId'); } catch (error) { return error; }
    })();
    if (intentId instanceof Error) return sendFileError(response, intentId);

    const attemptId = randomUUID();
    let claimed = null;
    try {
      const nowMillis = now().getTime();
      claimed = await repository.claimIntent(intentId, identity.uid, attemptId, nowMillis);
      if (claimed.kind === 'completed') {
        const existing = await repository.getFile(claimed.intent.fileId);
        if (existing) {
          const policy = UPLOAD_POLICIES[existing.purpose];
          await requireEntityAccess(identity, {
            ...existing,
            entityCollection: policy?.entityCollection
          }, 'read');
        }
        return response.status(200).json({ ok: true, idempotent: true, file: serializeFile(existing) });
      }
      const intent = { ...claimed.intent, attemptId };
      assertManagedIntentKeys(intent);
      await requireEntityAccess(identity, intent, 'write');

      const head = await r2Client.send(new HeadObjectCommand({
        Bucket: configuration.bucket,
        Key: intent.quarantineKey
      }));
      const inspected = validateUploadedHead(head, intent);
      const ranged = await r2Client.send(new GetObjectCommand({
        Bucket: configuration.bucket,
        Key: intent.quarantineKey,
        Range: `bytes=0-${MIME_SNIFF_BYTES - 1}`,
        IfMatch: inspected.etag
      }));
      const prefix = await bodyToBuffer(ranged.Body, MIME_SNIFF_BYTES);
      let detected;
      try {
        detected = await detectFileType(prefix);
      } catch (_error) {
        // Los parsers pueden lanzar ante contenedores truncados o deliberadamente
        // malformados. Se trata como contenido no verificable, no como un 500
        // reintentable que conservaría indefinidamente el objeto sospechoso.
        throw new FileRouteError(
          'The binary content could not be verified.',
          'file_type_unverified',
          422
        );
      }
      validateDetectedType(detected, intent);

      await r2Client.send(new CopyObjectCommand({
        Bucket: configuration.bucket,
        Key: intent.finalKey,
        CopySource: encodeCopySource(configuration.bucket, intent.quarantineKey),
        CopySourceIfMatch: inspected.etag,
        MetadataDirective: 'REPLACE',
        ContentType: intent.contentType,
        ContentDisposition: contentDisposition(intent.disposition, intent.originalName),
        CacheControl: intent.cacheControl,
        Metadata: {
          'elysium-file-id': intent.id,
          'elysium-entity-id': intent.entityId,
          'elysium-purpose': intent.purpose
        }
      }));

      const file = {
        id: intent.id,
        schemaVersion: 1,
        tenantId: TENANT_ID,
        status: 'ready',
        provider: 'cloudflare-r2',
        bucket: configuration.bucket,
        objectKey: intent.finalKey,
        entityType: intent.entityType,
        entityId: intent.entityId,
        authorizationCollection: intent.authorizationCollection,
        purpose: intent.purpose,
        originalName: intent.originalName,
        contentType: intent.contentType,
        size: inspected.bytes,
        bytes: inspected.bytes,
        etag: inspected.etag,
        uploadedByUid: identity.uid,
        uploadedByEmail: identity.email
      };
      await repository.completeIntent(
        intent,
        file,
        identity,
        entity => entityIsAccessible(identity, entity, intent, 'write')
      );

      // No se elimina inmediatamente la cuarentena: mientras la URL PUT siga
      // vigente, borrarla permitiría reutilizar una vez el mismo bearer URL
      // porque lleva If-None-Match: *. Conservar el objeto bloquea esa segunda
      // escritura; la regla lifecycle obligatoria lo retira al día siguiente.

      return response.status(201).json({ ok: true, idempotent: false, file: serializeFile(file) });
    } catch (error) {
      if (claimed?.kind === 'claimed') {
        const validationFailure = error instanceof FileRouteError && error.status === 422;
        if (validationFailure) {
          await bestEffortDelete(r2Client, configuration, claimed.intent.quarantineKey);
          await repository.rejectIntent(intentId, attemptId, error.code).catch(() => {});
        } else {
          await repository.releaseIntent(intentId, attemptId, error?.code || 'completion_failed').catch(() => {});
        }
      }
      if (error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404) {
        return response.status(409).json({ error: 'The R2 upload has not completed.', code: 'upload_missing' });
      }
      return sendFileError(response, error);
    }
  });

  router.post('/:fileId/download-url', async (request, response) => {
    try {
      const fileId = normalizedIdentifier(request.params.fileId, 'fileId');
      const file = await repository.getFile(fileId);
      if (!file || file.status !== 'ready' || !file.objectKey) {
        throw new FileRouteError('File not found.', 'file_not_found', 404);
      }
      const policy = UPLOAD_POLICIES[file.purpose];
      await requireEntityAccess(request.firebaseUser, {
        ...file,
        entityCollection: policy?.entityCollection
      }, 'read');
      const objectKey = assertManagedFileKey(file, configuration.bucket);
      const url = await signUrl(
        r2Client,
        new GetObjectCommand({ Bucket: configuration.bucket, Key: objectKey }),
        { expiresIn: configuration.downloadTtlSeconds }
      );
      const expiresAt = new Date(now().getTime() + configuration.downloadTtlSeconds * 1000);
      return response.json({ url, expiresAt: expiresAt.toISOString() });
    } catch (error) {
      return sendFileError(response, error);
    }
  });

  router.delete('/:fileId', async (request, response) => {
    const identity = request.firebaseUser;
    const fileId = (() => {
      try { return normalizedIdentifier(request.params.fileId, 'fileId'); } catch (error) { return error; }
    })();
    if (fileId instanceof Error) return sendFileError(response, fileId);
    const attemptId = randomUUID();
    let claimed = null;
    let objectDeleted = false;
    try {
      claimed = await repository.claimFileDeletion(
        fileId,
        identity.uid,
        attemptId,
        now().getTime(),
        isAdmin(identity)
      );
      if (claimed.kind === 'deleted') {
        return response.json({ ok: true, idempotent: true });
      }
      const policy = UPLOAD_POLICIES[claimed.file.purpose];
      await requireEntityAccess(identity, {
        ...claimed.file,
        entityCollection: policy?.entityCollection
      }, 'write');
      const objectKey = assertManagedFileKey(claimed.file, configuration.bucket);
      await r2Client.send(new DeleteObjectCommand({
        Bucket: configuration.bucket,
        Key: objectKey
      }));
      objectDeleted = true;
      await repository.completeFileDeletion(claimed.file, identity, attemptId);
      return response.json({ ok: true, idempotent: false });
    } catch (error) {
      if (claimed?.kind === 'claimed' && !objectDeleted) {
        await repository.releaseFileDeletion(fileId, attemptId, error?.code || 'delete_failed').catch(() => {});
      }
      // Si R2 ya respondió satisfactoriamente, el registro permanece en
      // `deleting`. Tras expirar el lease, repetir DELETE es idempotente y
      // permite finalizar Firestore sin volver a ofrecer una URL rota.
      return sendFileError(response, error);
    }
  });

  return router;
}

module.exports = {
  FileRouteError,
  UPLOAD_POLICIES,
  assertManagedFileKey,
  assertManagedIntentKeys,
  bodyToBuffer,
  configuredDomains,
  configuredGlobalFileRoles,
  configuredRoles,
  contentDisposition,
  createFirestoreFileRepository,
  createR2Client,
  createR2FileRouter,
  defaultCanAccessEntity,
  defaultFileTypeDetector,
  encodeCopySource,
  isCorporateIdentity,
  normalizeUploadIntentInput,
  objectKeys,
  r2Configuration,
  safeOriginalName,
  safeStorageSegment,
  serializeFile,
  validateDetectedType,
  validateUploadedHead
};
