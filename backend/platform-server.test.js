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
  isFirebaseAdmin,
  normalizedEmail,
  validateIanaTimeZone,
  resolveZonedLocalDateTime,
  normalizeMeetingInput,
  normalizedIdempotencyKey,
  meetingIdForRequest,
  meetingRequestFingerprint,
  buildMeetingEmail,
  buildMeetingIcs,
  meetingEmailPayload,
  adminNotificationEmail,
  sendEmail,
  serializeMeeting,
  passwordResetRateLimited,
  passwordResetEmail,
  passwordResetEmailConfigured,
  passwordResetContinueUrl
} = require('./platform-server');

test('recognizes only verified configured or claim-backed administrators', () => {
  assert.equal(isFirebaseAdmin({ email: 'danielalonzzo@icloud.com', email_verified: true }), true);
  assert.equal(isFirebaseAdmin({ email: 'admin@example.com', email_verified: true, admin: true }), true);
  assert.equal(isFirebaseAdmin({ email: 'root@example.com', email_verified: true, role: 'root' }), true);
  assert.equal(isFirebaseAdmin({ email: 'member@example.com', email_verified: true, role: 'partner' }), false);
  assert.equal(isFirebaseAdmin({ email: 'danielalonzzo@icloud.com', email_verified: false }), false);
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
