'use strict';

process.env.GCLOUD_PROJECT ||= 'elysium-unit-tests';
process.env.SMTP_HOST ||= 'smtp.example.invalid';
process.env.SMTP_USER ||= 'info@elysiumdr.eu';
process.env.SMTP_PASSWORD ||= 'unit-tests';
process.env.MEETING_FROM_EMAIL ||= 'Elysium <meetings@elysiumdr.eu>';
process.env.PASSWORD_RESET_FROM_EMAIL ||= 'Elysium Security <security@elysiumdr.eu>';
process.env.PUBLIC_BASE_URL ||= 'https://elysiumdr.eu';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Timestamp } = require('firebase-admin/firestore');
const {
  MeetingValidationError,
  MeetingRangeError,
  meetingListRange,
  MAX_MEETING_RANGE_DAYS,
  MEETING_PAGE_SIZE,
  isFirebaseAdmin,
  platformCapabilities,
  normalizedEmail,
  validateIanaTimeZone,
  resolveZonedLocalDateTime,
  normalizeMeetingInput,
  normalizedIdempotencyKey,
  meetingIdForRequest,
  meetingRequestFingerprint,
  buildMeetingEmail,
  buildMeetingAdminEmail,
  emailTheme,
  withElysiumSeal,
  elysiumSealAttachment,
  buildMeetingIcs,
  meetingEmailPayload,
  adminNotificationEmail,
  sendEmail,
  serializeMeeting,
  passwordResetRateLimited,
  MailValidationError,
  mailSenders,
  findMailSender,
  validateMailAttachments,
  safeAttachmentName,
  htmlToPlainText,
  decodeHtmlEntities,
  humanFileSize,
  crmMailIdempotencyKey,
  crmMailFingerprint,
  crmMailReceiptPayload,
  passwordResetEmail,
  passwordResetEmailConfigured,
  passwordResetContinueUrl,
  ProspectValidationError,
  normalizeProspectInput,
  prospectRateLimited
} = require('./platform-server');

test('reports only configured platform capabilities to the CRM', () => {
  const withoutR2 = platformCapabilities({});
  assert.equal(withoutR2.meetings.update, true);
  assert.equal(withoutR2.files.provider, 'cloudflare-r2');
  assert.equal(withoutR2.files.upload, false);

  const withR2 = platformCapabilities({
    R2_ENDPOINT: 'https://account.eu.r2.cloudflarestorage.com',
    R2_BUCKET: 'elysium-private',
    R2_ACCESS_KEY_ID: 'access-key',
    R2_SECRET_ACCESS_KEY: 'secret-key'
  });
  assert.equal(withR2.files.upload, true);
  assert.equal(withR2.files.download, true);
});

test('recognizes only verified configured or claim-backed administrators', () => {
  assert.equal(isFirebaseAdmin({ email: 'daniel.morales@elysiumdr.eu', email_verified: true }), true);
  assert.equal(isFirebaseAdmin({ email: 'admin@example.com', email_verified: true, admin: true }), true);
  assert.equal(isFirebaseAdmin({ email: 'admin@example.com', email_verified: true, crmRole: 'admin' }), true);
  assert.equal(isFirebaseAdmin({ email: 'root@example.com', email_verified: true, role: 'root' }), true);
  assert.equal(isFirebaseAdmin({ email: 'member@example.com', email_verified: true, role: 'partner' }), false);
  assert.equal(isFirebaseAdmin({ email: 'daniel.morales@elysiumdr.eu', email_verified: false }), false);
});

test('resolves ordinary zoned local times to one exact UTC instant', () => {
  assert.equal(validateIanaTimeZone('Europe/Lisbon', 'adminTimeZone'), 'Europe/Lisbon');
  assert.equal(
    resolveZonedLocalDateTime('2026-08-06', '14:30', 'Europe/Lisbon').toISOString(),
    '2026-08-06T13:30:00.000Z'
  );
  assert.equal(
    resolveZonedLocalDateTime('2026-08-06', '07:30', 'America/Costa_Rica').toISOString(),
    '2026-08-06T13:30:00.000Z'
  );
  assert.throws(() => validateIanaTimeZone('Portugal/Lisbonish', 'adminTimeZone'), /IANA/);
});

test('rejects nonexistent and ambiguous daylight-saving wall-clock times', () => {
  assert.throws(
    () => resolveZonedLocalDateTime('2026-03-08', '02:30', 'America/New_York'),
    error => error instanceof MeetingValidationError && error.code === 'nonexistent_local_time'
  );
  assert.throws(
    () => resolveZonedLocalDateTime('2026-11-01', '01:30', 'America/New_York'),
    error => error instanceof MeetingValidationError && error.code === 'ambiguous_local_time'
  );
});

test('validates canonical meeting data and produces stable idempotency identifiers', () => {
  const body = {
    userId: 'client_123',
    title: 'Discovery session',
    notes: 'Bring the launch brief.',
    clientRegion: 'Costa Rica',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    adminTimeZone: 'Europe/Lisbon',
    clientTimeZone: 'America/Costa_Rica',
    date: '2030-08-06',
    time: '14:30',
    durationMinutes: 60,
    locale: 'es-CR'
  };
  const meeting = normalizeMeetingInput(body, Date.UTC(2030, 0, 1));
  assert.equal(meeting.startAt.toISOString(), '2030-08-06T13:30:00.000Z');
  assert.equal(meeting.endAt.toISOString(), '2030-08-06T14:30:00.000Z');
  assert.equal(meeting.locale, 'es');
  assert.equal(normalizedIdempotencyKey('admin-ui:request_123'), 'admin-ui:request_123');
  assert.equal(meetingIdForRequest('admin_1', 'admin-ui:request_123'), meetingIdForRequest('admin_1', 'admin-ui:request_123'));
  assert.equal(meetingRequestFingerprint(meeting), meetingRequestFingerprint({ ...meeting }));
  assert.throws(() => normalizeMeetingInput({ ...body, meetingUrl: 'http://meet.example.com' }), /HTTPS/);
  assert.throws(() => normalizeMeetingInput({ ...body, durationMinutes: 10 }), /Duration/);
  assert.throws(() => normalizedIdempotencyKey('short'), /Idempotency-Key/);
});

function emailMeeting(overrides = {}) {
  return {
    id: 'mtg_123',
    userId: 'client_123',
    clientName: 'Ana & Co',
    clientEmail: 'ana@example.com',
    clientRegion: 'Costa Rica',
    clientTimeZone: 'America/Costa_Rica',
    adminTimeZone: 'Europe/Lisbon',
    title: 'Kickoff <Q3>',
    notes: 'Review goals & scope.',
    meetingUrl: 'https://meet.example.com/room?a=1&b=2',
    durationMinutes: 60,
    startAt: new Date('2026-08-06T13:30:00.000Z'),
    endAt: new Date('2026-08-06T14:30:00.000Z'),
    locale: 'es',
    ...overrides
  };
}

test('builds localized, escaped multizone meeting email and calendar invite', () => {
  const meeting = emailMeeting();
  const email = buildMeetingEmail(meeting);
  assert.match(email.subject, /Reunión confirmada/);
  assert.match(email.html, /America\/Costa_Rica/);
  assert.match(email.html, /Europe\/Lisbon/);
  assert.match(email.html, /Kickoff &lt;Q3&gt;/);
  assert.doesNotMatch(email.html, /Kickoff <Q3>/);
  assert.match(email.text, /https:\/\/meet\.example\.com/);

  const invite = buildMeetingIcs(meeting, 'confirmation', new Date('2026-08-01T00:00:00Z'));
  assert.match(invite, /METHOD:REQUEST\r\n/);
  assert.match(invite, /DTSTART:20260806T133000Z/);
  assert.match(invite, /DTEND:20260806T143000Z/);
  assert.match(invite, /STATUS:CONFIRMED/);
  const cancelled = buildMeetingIcs(meeting, 'cancellation', new Date('2026-08-01T00:00:00Z'));
  assert.match(cancelled, /METHOD:CANCEL/);
  assert.match(cancelled, /STATUS:CANCELLED/);
  assert.match(
    buildMeetingIcs(emailMeeting({ meetingUrl: 'https://meet.example.com/room,a;b' })),
    /URL:https:\/\/meet\.example\.com\/room\\,a\\;b/
  );

  const payload = meetingEmailPayload(meeting);
  assert.deepEqual(payload.to, ['ana@example.com']);
  assert.match(Buffer.from(payload.attachments[0].content, 'base64').toString('utf8'), /BEGIN:VCALENDAR/);
});

test('permite llamadas sin enlace y no genera URLs vacías en correo o calendario', () => {
  const call = emailMeeting({ type: 'call', meetingUrl: '' });
  const normalized = normalizeMeetingInput({
    contactId: 'contact_123',
    contactCollection: 'contacts',
    type: 'call',
    title: call.title,
    notes: call.notes,
    clientRegion: call.clientRegion,
    adminTimeZone: call.adminTimeZone,
    clientTimeZone: call.clientTimeZone,
    date: '2030-08-06',
    time: '14:30',
    durationMinutes: 30,
    locale: 'es'
  }, Date.UTC(2030, 0, 1));
  assert.equal(normalized.type, 'call');
  assert.equal(normalized.contactCollection, 'contacts');
  assert.equal(normalized.meetingUrl, '');

  const email = buildMeetingEmail(call);
  assert.match(email.subject, /Llamada agendada/);
  assert.match(email.html, /Tu llamada con Elysium ha sido agendada/);
  assert.doesNotMatch(email.html, /href=""/);
  assert.doesNotMatch(email.text, /Acceder a la reunión:\s*$/m);

  const invite = buildMeetingIcs(call, 'confirmation', new Date('2026-08-01T00:00:00Z'));
  assert.doesNotMatch(invite, /^URL:/m);
  assert.match(invite, /METHOD:REQUEST\r\n/);
  assert.equal(meetingEmailPayload(call).attachments[0].filename, 'elysium-call.ics');
});

test('envía por SMTP con Message-ID determinista y sin conexión real', async () => {
  let captured = null;
  const transport = { sendMail: async message => { captured = message; return { messageId: message.messageId, rejected: [] }; } };

  const meeting = emailMeeting();
  const result = await sendEmail(meetingEmailPayload(meeting), 'meeting-key-123', transport);

  assert.equal(result.id, '<meeting-key-123@elysiumdr.eu>');
  // El Message-ID sale de la clave de reserva, así que un reenvío del mismo
  // aviso llega con la identidad del original en lugar de como mensaje nuevo.
  assert.equal(captured.messageId, '<meeting-key-123@elysiumdr.eu>');
  assert.equal(captured.to[0], meeting.clientEmail);
  assert.match(captured.attachments[0].contentType, /method=REQUEST/);
  assert.equal(captured.attachments[0].encoding, 'base64');
});

test('una cancelación adjunta el calendario con METHOD CANCEL', () => {
  const payload = meetingEmailPayload(emailMeeting(), 'cancellation');
  assert.match(payload.attachments[0].contentType, /method=CANCEL/);
  assert.equal(payload.attachments[0].filename, 'elysium-meeting-cancelled.ics');
});

test('sin buzón configurado no se intenta enviar', async () => {
  const saved = process.env.SMTP_HOST;
  delete process.env.SMTP_HOST;
  try {
    await assert.rejects(
      () => sendEmail(meetingEmailPayload(emailMeeting()), 'k', null),
      error => error.code === 'email_not_configured'
    );
  } finally {
    process.env.SMTP_HOST = saved;
  }
});

test('un destinatario rechazado por SMTP no cuenta como enviado', async () => {
  const transport = { sendMail: async () => ({ messageId: '<x@y>', rejected: ['cliente@example.com'] }) };
  await assert.rejects(
    () => sendEmail(meetingEmailPayload(emailMeeting()), 'k', transport),
    error => error.code === 'email_delivery_failed'
  );
});

test('addresses the administrator separately from the client', () => {
  const meeting = emailMeeting();
  const client = meetingEmailPayload(meeting, 'confirmation', 'client');
  const admin = meetingEmailPayload(meeting, 'confirmation', 'admin');

  // Two different messages, two different recipients: the client is never
  // handed the administrator's address and vice versa.
  assert.deepEqual(client.to, ['ana@example.com']);
  assert.deepEqual(admin.to, [adminNotificationEmail()]);
  assert.notEqual(client.subject, admin.subject);

  // The administrator's copy carries what the CRM needs and stays escaped.
  assert.match(admin.subject, /Ana & Co/);
  assert.match(admin.html, /Nueva reuni\u00f3n en la agenda/);
  assert.match(admin.html, /Ana &amp; Co/);
  assert.ok(!admin.html.includes('Ana & Co'), 'client name must be HTML-escaped');
  assert.match(admin.html, /\/admin\?client=client_123/);
  assert.match(admin.text, /ana@example\.com/);

  // Both still carry the calendar invitation.
  assert.equal(client.attachments[0].filename, 'elysium-meeting.ics');
  assert.equal(admin.attachments[0].filename, 'elysium-meeting.ics');

  // A cancellation swaps the wording and drops the join button.
  const cancelled = meetingEmailPayload(meeting, 'cancellation', 'admin');
  assert.match(cancelled.html, /Reuni\u00f3n retirada de la agenda/);
  assert.ok(!cancelled.html.includes(meeting.meetingUrl));
});

test('serializes meeting and nested delivery timestamps as ISO strings', () => {
  const instant = Timestamp.fromMillis(Date.UTC(2026, 7, 6, 13, 30));
  const serialized = serializeMeeting('mtg_123', {
    userId: 'client_123',
    startAt: instant,
    notifications: { confirmation: { status: 'sent', sentAt: instant } }
  });
  assert.equal(serialized.startAt, '2026-08-06T13:30:00.000Z');
  assert.equal(serialized.notifications.confirmation.sentAt, '2026-08-06T13:30:00.000Z');
});

test('la ventana por defecto de la agenda mira atras y adelante', () => {
  const now = Date.parse('2026-08-18T12:00:00Z');
  const { from, to, userId } = meetingListRange({}, now);
  const day = 86400_000;
  // El defecto anterior arrancaba en now-7d y vaciaba la pestana «Past».
  assert.ok(now - from.getTime() >= 300 * day, 'el defecto debe incluir historico');
  assert.ok(to.getTime() - now >= 300 * day, 'y tambien futuro');
  assert.equal(userId, null);
  assert.ok(to.getTime() - from.getTime() <= MAX_MEETING_RANGE_DAYS * day,
    'el defecto tiene que caber en el tope, o el endpoint se rechaza a si mismo');
});

test('la ventana que pide el CRM (365+365) es aceptada', () => {
  const now = Date.parse('2026-08-18T12:00:00Z');
  const day = 86400_000;
  const range = meetingListRange({
    from: new Date(now - 365 * day).toISOString(),
    to: new Date(now + 365 * day).toISOString()
  }, now);
  assert.equal(range.from.getTime(), now - 365 * day);
  assert.equal(range.to.getTime(), now + 365 * day);
});

test('rangos invalidos y userId malformado se rechazan con su codigo', () => {
  const now = Date.parse('2026-08-18T12:00:00Z');
  const day = 86400_000;
  const rejects = (query, code) => {
    assert.throws(() => meetingListRange(query, now), error => {
      assert.ok(error instanceof MeetingRangeError);
      assert.equal(error.code, code);
      return true;
    });
  };
  rejects({ from: 'no-es-fecha' }, 'invalid_meeting_range');
  rejects({ from: '2026-08-18', to: '2026-08-17' }, 'invalid_meeting_range');
  rejects({
    from: new Date(now).toISOString(),
    to: new Date(now + (MAX_MEETING_RANGE_DAYS + 1) * day).toISOString()
  }, 'invalid_meeting_range');
  rejects({ userId: 'con espacios' }, 'invalid_user_id');
  rejects({ userId: 'x'.repeat(129) }, 'invalid_user_id');
});

test('un userId valido se devuelve para filtrar dentro de la consulta', () => {
  // Aplicado despues del limit, pedir la agenda de un cliente podia devolver
  // cero citas aunque existieran. El handler lo usa como `where`.
  const { userId } = meetingListRange({ userId: 'abc-123:XYZ_9' }, Date.now());
  assert.equal(userId, 'abc-123:XYZ_9');
  assert.ok(MEETING_PAGE_SIZE > 0);
});

test('password-reset helpers remain neutral, localized and rate limited', () => {
  assert.equal(normalizedEmail(' User@Example.com '), 'user@example.com');
  assert.equal(normalizedEmail('not-an-email'), null);
  assert.equal(passwordResetContinueUrl('es'), 'https://elysiumdr.eu/es/profiles?passwordReset=complete');
  assert.equal(passwordResetContinueUrl('en'), 'https://elysiumdr.eu/profiles?passwordReset=complete');
  assert.equal(passwordResetEmailConfigured(), true);
  // Sin buzón SMTP no hay envío posible, aunque el remitente esté puesto.
  const savedHost = process.env.SMTP_HOST;
  delete process.env.SMTP_HOST;
  assert.equal(passwordResetEmailConfigured(), false);
  process.env.SMTP_HOST = savedHost;
  // Y sin remitente tampoco, aunque el buzón esté configurado.
  const savedResetFrom = process.env.PASSWORD_RESET_FROM_EMAIL;
  const savedMeetingFrom = process.env.MEETING_FROM_EMAIL;
  delete process.env.PASSWORD_RESET_FROM_EMAIL;
  delete process.env.MEETING_FROM_EMAIL;
  assert.equal(passwordResetEmailConfigured(), false);
  process.env.PASSWORD_RESET_FROM_EMAIL = savedResetFrom;
  process.env.MEETING_FROM_EMAIL = savedMeetingFrom;
  assert.equal(passwordResetEmailConfigured(), true);
  const reset = passwordResetEmail('user@example.com', 'https://example.com/reset?oobCode=a&lang=es', 'es');
  assert.match(reset.subject, /Restablece/);
  assert.match(reset.html, /oobCode=a&amp;lang=es/);
  assert.doesNotMatch(reset.html, /oobCode=a&lang=es/);

  const attempts = new Map();
  assert.equal(passwordResetRateLimited('email:key', 2, 1_000, attempts), false);
  assert.equal(passwordResetRateLimited('email:key', 2, 1_001, attempts), false);
  assert.equal(passwordResetRateLimited('email:key', 2, 1_002, attempts), true);
  assert.equal(passwordResetRateLimited('email:key', 2, 1_000 + 60 * 60 * 1000, attempts), false);
});

test('public project enquiries are normalized and rate limited before Firestore', () => {
  assert.deepEqual(normalizeProspectInput({
    name: ' Ana Silva ',
    company: ' Atelier Norte ',
    email: 'ANA@EXAMPLE.COM',
    projectDescription: 'A multilingual portal.',
    isExistingClient: false,
    licenseCode: 'ignored'
  }), {
    name: 'Ana Silva',
    company: 'Atelier Norte',
    email: 'ana@example.com',
    projectDescription: 'A multilingual portal.',
    isExistingClient: false,
    licenseCode: null
  });
  assert.throws(() => normalizeProspectInput({ name: '<b>Ana</b>', company: 'A', email: 'a@example.com' }), ProspectValidationError);
  assert.throws(() => normalizeProspectInput({ name: 'Ana', company: 'A', email: 'invalid' }), ProspectValidationError);
  assert.throws(() => normalizeProspectInput({
    name: 'Ana', company: 'A', email: 'a@example.com', isExistingClient: true, licenseCode: 'wrong'
  }), ProspectValidationError);

  const attempts = new Map();
  assert.equal(prospectRateLimited('ip:key', 2, 1_000, attempts), false);
  assert.equal(prospectRateLimited('ip:key', 2, 1_001, attempts), false);
  assert.equal(prospectRateLimited('ip:key', 2, 1_002, attempts), true);
  assert.equal(prospectRateLimited('ip:key', 2, 1_000 + 60 * 60 * 1000, attempts), false);
});

/* ── Correo del CRM ───────────────────────────────────────────────────────── */

test('the CRM sender list is closed and comes from the server', () => {
  const saved = {
    senders: process.env.CRM_MAIL_SENDERS,
    host: process.env.SMTP_HOST,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  };
  process.env.CRM_MAIL_SENDERS =
    'Elysium <info@elysiumdr.eu>, Daniel Morales <daniel.morales@elysiumdr.eu>';

  const senders = mailSenders();
  assert.equal(senders.length, 2);
  assert.equal(senders[0].address, 'info@elysiumdr.eu');
  assert.equal(senders[0].name, 'Elysium');
  assert.equal(senders[1].name, 'Daniel Morales');
  assert.equal(senders[1].envSuffix, 'DANIEL_MORALES');

  // El buzón autenticado puede enviar; el otro no, mientras no traiga sus
  // propias credenciales. Es lo que impide que IONOS rechace el envío después
  // de que el administrador haya redactado el mensaje.
  assert.equal(senders[0].ready, true);
  assert.equal(senders[1].ready, false);

  // A matching SMTP_USER is not enough. The UI must not offer a sender that
  // cannot actually connect because the shared host or password is missing.
  delete process.env.SMTP_HOST;
  assert.equal(mailSenders()[0].ready, false);
  process.env.SMTP_HOST = saved.host;
  delete process.env.SMTP_PASSWORD;
  assert.equal(mailSenders()[0].ready, false);
  process.env.SMTP_PASSWORD = saved.pass;

  process.env.SMTP_USER_DANIEL_MORALES = 'daniel.morales@elysiumdr.eu';
  process.env.SMTP_PASSWORD_DANIEL_MORALES = 'unit-tests';
  assert.equal(mailSenders()[1].ready, true);
  delete process.env.SMTP_USER_DANIEL_MORALES;
  delete process.env.SMTP_PASSWORD_DANIEL_MORALES;

  // Una dirección que no esté en la lista no se resuelve: no hay forma de que
  // el navegador imponga un remitente.
  assert.equal(findMailSender('info@elysiumdr.eu').address, 'info@elysiumdr.eu');
  assert.equal(findMailSender('INFO@elysiumdr.eu').address, 'info@elysiumdr.eu');
  assert.equal(findMailSender('cualquiera@gmail.com'), null);
  assert.equal(findMailSender(''), null);

  if (saved.senders == null) delete process.env.CRM_MAIL_SENDERS;
  else process.env.CRM_MAIL_SENDERS = saved.senders;
  process.env.SMTP_HOST = saved.host;
  process.env.SMTP_USER = saved.user;
  process.env.SMTP_PASSWORD = saved.pass;
});

test('attachments are capped and their names sanitised', () => {
  assert.deepEqual(validateMailAttachments(null), []);

  const small = Buffer.from('hola').toString('base64');
  const ok = validateMailAttachments([{ filename: 'a/../b factura 2026.pdf', content: small }]);
  assert.equal(ok[0].filename, 'b factura 2026.pdf');
  assert.equal(ok[0].contentType, 'application/octet-stream');

  assert.throws(() => validateMailAttachments('nope'), MailValidationError);
  assert.throws(() => validateMailAttachments([{ filename: 'x', content: '' }]), MailValidationError);
  assert.throws(() => validateMailAttachments([{ filename: 'x', content: '!!!!' }]), MailValidationError);
  assert.throws(() => validateMailAttachments([{ filename: 'x', content: 'data:text/plain;base64,aG9sYQ==' }]), MailValidationError);
  assert.throws(() => validateMailAttachments([{ filename: 'x', content: 'aG9sYQ==', contentType: 'text/plain\r\nBcc: victim@example.com' }]), MailValidationError);
  assert.throws(
    () => validateMailAttachments(Array.from({ length: 11 }, () => ({ filename: 'x', content: small }))),
    MailValidationError);

  // 9 MB reales pasan del tope por archivo (8 MB).
  const tooBig = { filename: 'big.zip', content: 'A'.repeat(Math.ceil(9 * 1024 * 1024 * 4 / 3)) };
  assert.throws(() => validateMailAttachments([tooBig]), MailValidationError);

  // Dos de 7 MB caben por separado pero superan el total (12 MB).
  const sevenMb = () => ({ filename: 'f.pdf', content: 'A'.repeat(Math.ceil(7 * 1024 * 1024 * 4 / 3)) });
  assert.throws(() => validateMailAttachments([sevenMb(), sevenMb()]), MailValidationError);

  // Los dígitos sobreviven al saneado; los caracteres de control, no.
  assert.equal(safeAttachmentName('informe-2026.pdf', 0), 'informe-2026.pdf');
  assert.equal(safeAttachmentName('mal\u0000nombre<>.txt', 0), 'malnombre.txt');
  assert.equal(safeAttachmentName('', 3), 'adjunto-4');
});

test('the plain-text part is derived from the HTML body', () => {
  const text = htmlToPlainText('<h1>Hola</h1><p>Una <strong>prueba</strong>&nbsp;con &lambda; y &amp;.</p><br>Fin');
  assert.match(text, /Hola/);
  assert.match(text, /Una prueba con λ y &\./);
  assert.doesNotMatch(text, /</);
  assert.equal(htmlToPlainText('<style>p{color:red}</style><script>x()</script><p>Sólo esto</p>').trim(), 'Sólo esto');
});

test('CRM email theming stays light and embeds the official seal once', () => {
  const themed = emailTheme('<p>Contenido</p>', 'Vista previa');
  assert.match(themed, /color-scheme" content="light only"/);
  assert.doesNotMatch(themed, /prefers-color-scheme:\s*dark/);
  assert.match(themed, /cid:elysium-email-seal/);

  const uploaded = '<!doctype html><html><body><p>Hola</p></body></html>';
  const sealed = withElysiumSeal(uploaded);
  assert.equal((sealed.match(/cid:elysium-email-seal/g) || []).length, 1);
  assert.equal(withElysiumSeal(sealed), sealed);

  const seal = elysiumSealAttachment();
  assert.equal(seal.contentType, 'image/png');
  assert.equal(seal.cid, 'elysium-email-seal');
  assert.deepEqual(Buffer.from(seal.content, 'base64').subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});

test('CRM idempotency keys and fingerprints are stable and content-bound', () => {
  const request = { get: name => name === 'idempotency-key' ? 'crm-mail:1234567890abcdef' : '' };
  assert.equal(crmMailIdempotencyKey(request), 'crm-mail:1234567890abcdef');
  assert.throws(() => crmMailIdempotencyKey({ get: () => 'short' }), MailValidationError);

  const message = {
    actorUid: 'admin-1',
    from: 'info@elysiumdr.eu',
    recipients: ['one@example.com'],
    replyTo: null,
    subject: 'Proposal',
    html: '<p>Hello</p>',
    attachments: [{ filename: 'brief.pdf', contentType: 'application/pdf', bytes: 4, sha256: 'abc' }]
  };
  assert.equal(crmMailFingerprint(message), crmMailFingerprint({ ...message }));
  assert.notEqual(crmMailFingerprint(message), crmMailFingerprint({ ...message, subject: 'Different' }));
  assert.notEqual(crmMailFingerprint(message), crmMailFingerprint({ ...message, html: '<p>Changed</p>' }));
});

test('the separate administrator receipt escapes content and preserves a safe copy', () => {
  const payload = crmMailReceiptPayload({
    sender: { name: 'Elysium', address: 'info@elysiumdr.eu' },
    actorEmail: 'admin@example.com',
    recipients: ['client@example.com'],
    subject: '<script>alert(1)</script>',
    html: '<h1>Hello</h1><script>unsafe()</script>',
    text: 'Hello <client>',
    attachments: [{ filename: '<invoice>.pdf', contentType: 'application/pdf', bytes: 42 }],
    sentAt: new Date('2026-08-11T12:00:00.000Z'),
    locale: 'es'
  });
  assert.deepEqual(payload.to, [adminNotificationEmail()]);
  assert.match(payload.subject, /^Confirmación de envío/);
  assert.doesNotMatch(payload.html, /<script>alert\(1\)<\/script>/);
  assert.match(payload.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(payload.html, /&lt;invoice&gt;\.pdf/);
  assert.equal(payload.attachments[0].contentType, 'text/plain');
  assert.equal(Buffer.from(payload.attachments[0].content, 'base64').toString('utf8'), '<h1>Hello</h1><script>unsafe()</script>');
});

test('the receipt renders accents, readable sizes and a bounded excerpt', () => {
  // El acuse mostraba «Adri&aacute;n» porque solo se traducían cinco entidades.
  assert.equal(decodeHtmlEntities('Adri&aacute;n &mdash; Clasificaci&oacute;n'), 'Adrián — Clasificación');
  assert.equal(decodeHtmlEntities('contrase&ntilde;a &uacute;nica'), 'contraseña única');
  assert.equal(decodeHtmlEntities('&#233;&#x41;'), 'éA');
  // `&amp;` se resuelve la última: si no, «&amp;aacute;» acabaría en «á».
  assert.equal(decodeHtmlEntities('&amp;aacute;'), '&aacute;');
  assert.equal(decodeHtmlEntities('&noexiste;'), '&noexiste;');
  assert.equal(htmlToPlainText('<p>Adri&aacute;n</p><p>Pochet</p>'), 'Adrián\nPochet');

  assert.equal(humanFileSize(42), '42 B');
  assert.equal(humanFileSize(881362), '861 KB');
  assert.equal(humanFileSize(5 * 1024 * 1024), '5.0 MB');

  const long = 'x'.repeat(4000);
  const payload = crmMailReceiptPayload({
    sender: { name: 'Elysium', address: 'info@elysiumdr.eu' },
    actorEmail: 'admin@example.com',
    recipients: ['client@example.com'],
    subject: 'Asunto',
    html: `<p>${long}</p>`,
    text: long,
    attachments: [{ filename: 'a.pdf', contentType: 'application/pdf', bytes: 881362 }],
    sentAt: new Date('2026-08-11T12:53:58.682Z'),
    locale: 'es'
  });
  // La copia va acotada: el mensaje entero ya viaja como adjunto.
  assert.ok(payload.html.includes('…'));
  assert.ok(!payload.html.includes(long));
  assert.match(payload.html, /861 KB/);
  // La fecha ya no sale en ISO crudo.
  assert.doesNotMatch(payload.html, /2026-08-11T12:53:58\.682Z/);
  assert.match(payload.html, /2026/);
});

test('the agenda has three automatic notices, all from the configured mailbox', () => {
  const meeting = emailMeeting({ locale: 'es' });
  // El recordatorio no existía: la agenda solo avisaba al confirmar y cancelar.
  const reminder = buildMeetingEmail(meeting, 'reminder');
  assert.match(reminder.subject, /Recordatorio/);
  assert.match(reminder.html, /Tu reuni\u00f3n es ma\u00f1ana/);
  // Sigue llevando el enlace: un recordatorio sin acceso no sirve de nada.
  assert.match(reminder.html, /meet\.example\.com/);

  const adminReminder = buildMeetingAdminEmail(meeting, 'reminder');
  assert.match(adminReminder.subject, /Recordatorio enviado/);

  // Los tres avisos salen del mismo buzon, el de MEETING_FROM_EMAIL.
  const senders = new Set(['confirmation', 'cancellation', 'reminder']
    .map(kind => meetingEmailPayload(meeting, kind, 'client').from));
  assert.equal(senders.size, 1);
  assert.equal([...senders][0], process.env.MEETING_FROM_EMAIL);
});
