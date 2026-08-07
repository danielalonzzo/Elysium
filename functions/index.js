const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// ===== Helpers from Elysium Backend =====

function normalizedLocale(locale) {
  const normalized = String(locale || '').trim().toLowerCase().slice(0, 2);
  return ['en', 'es', 'pt'].includes(normalized) ? normalized : 'en';
}

function normalizedEmail(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

function dateFromFirestore(value) {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (Number.isFinite(value.seconds)) return new Date(value.seconds * 1000);
  return new Date(value);
}

function formattedZonedDate(value, timeZone, locale = 'en') {
  const locales = { en: 'en-GB', es: 'es-ES', pt: 'pt-PT' };
  return new Intl.DateTimeFormat(locales[normalizedLocale(locale)], {
    timeZone: timeZone || 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(dateFromFirestore(value));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function emailTheme(content, preheader = '') {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#030a16;color:#eaf3ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#030a16;padding:40px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px">
        <tr><td style="padding:0 8px 32px;color:#fff;font-size:24px;font-weight:800;letter-spacing:.05em"><span style="color:#28a8ff">λ</span> ELYSIUM</td></tr>
        <tr><td style="background:#07152b;border:1px solid #142e4d;border-radius:24px;padding:48px 40px;box-shadow:0 12px 40px rgba(0,0,0,0.4)">${content}</td></tr>
        <tr><td style="padding:32px 8px;color:#6482a3;font-size:13px;line-height:1.6;text-align:center">Elysium Digital Experiences<br>elysiumdr.eu</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const MEETING_COPY = {
  en: {
    confirmed: 'Meeting confirmed', cancelled: 'Meeting cancelled', hello: 'Hello',
    intro: 'Your meeting with Elysium has been scheduled.', cancelledIntro: 'This Elysium meeting has been cancelled.',
    yourTime: 'Your local time', adminTime: 'Elysium time', duration: 'Duration', region: 'Client region',
    join: 'Join meeting', minutes: 'minutes', notes: 'Notes', subjectConfirmed: 'Meeting confirmed', subjectCancelled: 'Meeting cancelled',
    adminHeading: 'New meeting in the agenda', adminHeadingCancelled: 'Meeting removed from the agenda',
    adminIntro: 'The confirmation and the calendar invitation have already been sent to the client.',
    adminIntroCancelled: 'The client has been told the meeting will not take place.',
    adminClient: 'Client', adminEmail: 'Email', adminOpenCrm: 'Open in the CRM',
    adminSubjectConfirmed: 'New meeting', adminSubjectCancelled: 'Meeting cancelled'
  },
  es: {
    confirmed: 'Reunión confirmada', cancelled: 'Reunión cancelada', hello: 'Hola',
    intro: 'Tu reunión con Elysium ha sido agendada.', cancelledIntro: 'Esta reunión con Elysium ha sido cancelada.',
    yourTime: 'Tu hora local', adminTime: 'Hora de Elysium', duration: 'Duración', region: 'Región del cliente',
    join: 'Acceder a la reunión', minutes: 'minutos', notes: 'Notas', subjectConfirmed: 'Reunión confirmada', subjectCancelled: 'Reunión cancelada',
    adminHeading: 'Nueva reunión en la agenda', adminHeadingCancelled: 'Reunión retirada de la agenda',
    adminIntro: 'La confirmación y la invitación de calendario ya han salido hacia el cliente.',
    adminIntroCancelled: 'Se ha avisado al cliente de que la reunión no se celebrará.',
    adminClient: 'Cliente', adminEmail: 'Correo', adminOpenCrm: 'Abrir en el CRM',
    adminSubjectConfirmed: 'Nueva reunión', adminSubjectCancelled: 'Reunión cancelada'
  },
  pt: {
    confirmed: 'Reunião confirmada', cancelled: 'Reunião cancelada', hello: 'Olá',
    intro: 'A sua reunião com a Elysium foi agendada.', cancelledIntro: 'Esta reunião com a Elysium foi cancelada.',
    yourTime: 'A sua hora local', adminTime: 'Hora da Elysium', duration: 'Duração', region: 'Região do cliente',
    join: 'Entrar na reunião', minutes: 'minutos', notes: 'Notas', subjectConfirmed: 'Reunião confirmada', subjectCancelled: 'Reunião cancelada',
    adminHeading: 'Nova reunião na agenda', adminHeadingCancelled: 'Reunião retirada da agenda',
    adminIntro: 'A confirmação e o convite de calendário já seguiram para o cliente.',
    adminIntroCancelled: 'O cliente foi avisado de que a reunião não se vai realizar.',
    adminClient: 'Cliente', adminEmail: 'Email', adminOpenCrm: 'Abrir no CRM',
    adminSubjectConfirmed: 'Nova reunião', adminSubjectCancelled: 'Reunião cancelada'
  }
};

function buildMeetingEmail(meeting, kind = 'confirmation') {
  const locale = normalizedLocale(meeting.locale);
  const copy = MEETING_COPY[locale];
  const cancelled = kind === 'cancellation';
  const heading = cancelled ? copy.cancelled : copy.confirmed;
  const intro = cancelled ? copy.cancelledIntro : copy.intro;
  const clientDate = formattedZonedDate(meeting.startAt, meeting.clientTimeZone, locale);
  const adminDate = formattedZonedDate(meeting.startAt, meeting.adminTimeZone, locale);
  const notes = meeting.cancellationReason || meeting.notes || '';
  const button = cancelled ? '' : `
    <p style="margin:32px 0 4px"><a href="${escapeHtml(meeting.meetingUrl)}" style="display:inline-block;background:linear-gradient(135deg, #28a8ff, #0077ff);color:#fff;text-decoration:none;font-weight:600;padding:16px 28px;border-radius:999px;font-size:15px;letter-spacing:0.02em;box-shadow:0 4px 12px rgba(40,168,255,0.3)">${escapeHtml(copy.join)}</a></p>`;
  const content = `
    <p style="margin:0 0 12px;color:#28a8ff;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(heading)}</p>
    <h1 style="margin:0 0 20px;color:#fff;font-size:28px;font-weight:700;line-height:1.2;letter-spacing:-0.02em">${escapeHtml(meeting.title)}</h1>
    <p style="margin:0 0 32px;color:#a3c2e0;font-size:16px;line-height:1.6">${escapeHtml(copy.hello)} ${escapeHtml(meeting.clientName || '')}, ${escapeHtml(intro)}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#030a16;border:1px solid #142a4a;border-radius:16px;padding:8px 24px;color:#eaf3ff">
      <tr><td style="padding:16px 0;color:#6482a3;font-size:14px">${escapeHtml(copy.yourTime)}</td><td style="padding:16px 0;text-align:right;font-weight:600;font-size:15px">${escapeHtml(clientDate)}<br><span style="color:#6482a3;font-size:13px;font-weight:400">${escapeHtml(meeting.clientTimeZone)}</span></td></tr>
      <tr><td style="padding:16px 0;border-top:1px solid #142a4a;color:#6482a3;font-size:14px">${escapeHtml(copy.adminTime)}</td><td style="padding:16px 0;border-top:1px solid #142a4a;text-align:right;font-size:15px">${escapeHtml(adminDate)}<br><span style="color:#6482a3;font-size:13px;font-weight:400">${escapeHtml(meeting.adminTimeZone)}</span></td></tr>
      <tr><td style="padding:16px 0;border-top:1px solid #142a4a;color:#6482a3;font-size:14px">${escapeHtml(copy.duration)}</td><td style="padding:16px 0;border-top:1px solid #142a4a;text-align:right;font-size:15px">${Number(meeting.durationMinutes)} ${escapeHtml(copy.minutes)}</td></tr>
      <tr><td style="padding:16px 0;border-top:1px solid #142a4a;color:#6482a3;font-size:14px">${escapeHtml(copy.region)}</td><td style="padding:16px 0;border-top:1px solid #142a4a;text-align:right;font-size:15px">${escapeHtml(meeting.clientRegion || meeting.clientTimeZone)}</td></tr>
    </table>
    ${notes ? `<div style="margin:28px 0 0;background:#0a1930;border-left:4px solid #28a8ff;padding:16px 20px;border-radius:0 12px 12px 0"><p style="margin:0;color:#a3c2e0;font-size:15px;line-height:1.6"><strong style="color:#fff;display:block;margin-bottom:4px">${escapeHtml(copy.notes)}</strong> ${escapeHtml(notes)}</p></div>` : ''}
    ${button}`;
  const subjectLabel = cancelled ? copy.subjectCancelled : copy.subjectConfirmed;
  const text = [
    `${heading}: ${meeting.title}`,
    `${copy.yourTime}: ${clientDate} (${meeting.clientTimeZone})`,
    `${copy.adminTime}: ${adminDate} (${meeting.adminTimeZone})`,
    `${copy.duration}: ${meeting.durationMinutes} ${copy.minutes}`,
    !cancelled ? `${copy.join}: ${meeting.meetingUrl}` : '',
    notes ? `${copy.notes}: ${notes}` : ''
  ].filter(Boolean).join('\n');
  return {
    subject: `${subjectLabel} · ${meeting.title}`,
    html: emailTheme(content, `${subjectLabel}: ${meeting.title}`),
    text
  };
}

function icsEscape(value) {
  return String(value || '')
    .replaceAll('\\', '\\\\')
    .replaceAll('\r\n', '\\n')
    .replaceAll('\n', '\\n')
    .replaceAll(',', '\\,')
    .replaceAll(';', '\\;');
}

function foldIcsLine(line) {
  const chunks = [];
  let chunk = '';
  for (const character of String(line)) {
    if (Buffer.byteLength(chunk + character, 'utf8') > 73) {
      chunks.push(chunk);
      chunk = character;
    } else {
      chunk += character;
    }
  }
  chunks.push(chunk);
  return chunks.join('\r\n ');
}

function icsUtc(value) {
  return dateFromFirestore(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function extractEmailAddress(value) {
  const match = String(value || '').match(/<([^>]+)>/);
  return normalizedEmail(match ? match[1] : value) || 'hello@elysiumdr.eu';
}

function buildMeetingIcs(meeting, kind = 'confirmation', now = new Date()) {
  const cancelled = kind === 'cancellation';
  // Fallback to hello@elysiumdr.eu if env variable is missing
  const organizerEmail = extractEmailAddress(process.env.MEETING_FROM_EMAIL || 'hello@elysiumdr.eu');
  const description = cancelled
    ? `Cancelled: ${meeting.title}`
    : `${meeting.notes || ''}${meeting.notes ? '\n\n' : ''}${meeting.meetingUrl}`;
  const lines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Elysium Digital Experiences//Meetings//EN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    `METHOD:${cancelled ? 'CANCEL' : 'REQUEST'}`,
    'BEGIN:VEVENT',
    `UID:${icsEscape(meeting.id)}@elysiumdr.eu`,
    `DTSTAMP:${icsUtc(now)}`,
    `DTSTART:${icsUtc(meeting.startAt)}`,
    `DTEND:${icsUtc(meeting.endAt)}`,
    `SEQUENCE:${cancelled ? 1 : 0}`,
    `STATUS:${cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    `SUMMARY:${icsEscape(meeting.title)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `URL:${icsEscape(meeting.meetingUrl)}`,
    `ORGANIZER;CN=Elysium:mailto:${organizerEmail}`,
    `ATTENDEE;CN=${icsEscape(meeting.clientName || meeting.clientEmail)};RSVP=TRUE:mailto:${meeting.clientEmail}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
}

function publicBaseUrl() {
  return String(process.env.PUBLIC_BASE_URL || 'https://elysiumdr.eu').replace(/\/$/, '');
}

function buildMeetingAdminEmail(meeting, kind = 'confirmation') {
  const locale = normalizedLocale(meeting.locale);
  const copy = MEETING_COPY[locale];
  const cancelled = kind === 'cancellation';
  const heading = cancelled ? copy.adminHeadingCancelled : copy.adminHeading;
  const intro = cancelled ? copy.adminIntroCancelled : copy.adminIntro;
  const clientDate = formattedZonedDate(meeting.startAt, meeting.clientTimeZone, locale);
  const adminDate = formattedZonedDate(meeting.startAt, meeting.adminTimeZone, locale);
  const notes = meeting.cancellationReason || meeting.notes || '';
  const crmUrl = `${publicBaseUrl()}/admin?client=${encodeURIComponent(meeting.userId || '')}`;
  const row = (label, value, extra = '') => `
      <tr><td style="padding:16px 0;border-top:1px solid #142a4a;color:#6482a3;font-size:14px">${escapeHtml(label)}</td><td style="padding:16px 0;border-top:1px solid #142a4a;text-align:right;font-size:15px">${escapeHtml(value)}${extra}</td></tr>`;
  const buttonGroup = `
    <p style="margin:32px 0 4px">
      ${cancelled ? '' : `<a href="${escapeHtml(meeting.meetingUrl)}" style="display:inline-block;background:linear-gradient(135deg, #28a8ff, #0077ff);color:#fff;text-decoration:none;font-weight:600;padding:16px 28px;border-radius:999px;font-size:15px;letter-spacing:0.02em;box-shadow:0 4px 12px rgba(40,168,255,0.3)">${escapeHtml(copy.join)}</a>&nbsp;&nbsp;&nbsp;`}
      <a href="${escapeHtml(crmUrl)}" style="display:inline-block;border:1px solid #28a8ff;color:#28a8ff;text-decoration:none;font-weight:600;padding:15px 27px;border-radius:999px;font-size:15px;letter-spacing:0.02em">${escapeHtml(copy.adminOpenCrm)}</a>
    </p>`;
  const content = `
    <p style="margin:0 0 12px;color:#28a8ff;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(heading)}</p>
    <h1 style="margin:0 0 20px;color:#fff;font-size:28px;font-weight:700;line-height:1.2;letter-spacing:-0.02em">${escapeHtml(meeting.title)}</h1>
    <p style="margin:0 0 32px;color:#a3c2e0;font-size:16px;line-height:1.6">${escapeHtml(intro)}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#030a16;border:1px solid #142a4a;border-radius:16px;padding:8px 24px;color:#eaf3ff">
      <tr><td style="padding:16px 0;color:#6482a3;font-size:14px">${escapeHtml(copy.adminClient)}</td><td style="padding:16px 0;text-align:right;font-weight:600;font-size:15px">${escapeHtml(meeting.clientName || '—')}</td></tr>
      ${row(copy.adminEmail, meeting.clientEmail || '—')}
      ${row(copy.adminTime, adminDate, `<br><span style="color:#6482a3;font-size:13px;font-weight:400">${escapeHtml(meeting.adminTimeZone)}</span>`)}
      ${row(copy.yourTime, clientDate, `<br><span style="color:#6482a3;font-size:13px;font-weight:400">${escapeHtml(meeting.clientTimeZone)}</span>`)}
      ${row(copy.duration, `${Number(meeting.durationMinutes)} ${copy.minutes}`)}
      ${row(copy.region, meeting.clientRegion || meeting.clientTimeZone || '—')}
    </table>
    ${notes ? `<div style="margin:28px 0 0;background:#0a1930;border-left:4px solid #28a8ff;padding:16px 20px;border-radius:0 12px 12px 0"><p style="margin:0;color:#a3c2e0;font-size:15px;line-height:1.6"><strong style="color:#fff;display:block;margin-bottom:4px">${escapeHtml(copy.notes)}</strong> ${escapeHtml(notes)}</p></div>` : ''}
    ${buttonGroup}`;
  const subjectLabel = cancelled ? copy.adminSubjectCancelled : copy.adminSubjectConfirmed;
  const who = meeting.clientName || meeting.clientEmail || '';
  const text = [
    `${heading}: ${meeting.title}`,
    `${copy.adminClient}: ${who}`,
    `${copy.adminEmail}: ${meeting.clientEmail || '—'}`,
    `${copy.adminTime}: ${adminDate} (${meeting.adminTimeZone})`,
    `${copy.yourTime}: ${clientDate} (${meeting.clientTimeZone})`,
    `${copy.duration}: ${meeting.durationMinutes} ${copy.minutes}`,
    !cancelled ? `${copy.join}: ${meeting.meetingUrl}` : '',
    notes ? `${copy.notes}: ${notes}` : '',
    `${copy.adminOpenCrm}: ${crmUrl}`
  ].filter(Boolean).join('\n');
  return {
    subject: `${subjectLabel} · ${who} · ${meeting.title}`.trim(),
    html: emailTheme(content, `${subjectLabel}: ${meeting.title}`),
    text
  };
}

function adminNotificationEmail() {
  return normalizedEmail(process.env.ADMIN_NOTIFICATION_EMAIL) || 'hello@elysiumdr.eu';
}

function meetingResendPayload(meeting, kind = 'confirmation', audience = 'client') {
  const email = audience === 'admin'
    ? buildMeetingAdminEmail(meeting, kind)
    : buildMeetingEmail(meeting, kind);
  return {
    from: process.env.MEETING_FROM_EMAIL || 'Elysium <hello@elysiumdr.eu>',
    to: [audience === 'admin' ? adminNotificationEmail() : meeting.clientEmail],
    subject: email.subject,
    html: email.html,
    text: email.text,
    attachments: [{
      filename: kind === 'cancellation' ? 'elysium-meeting-cancelled.ics' : 'elysium-meeting.ics',
      content: Buffer.from(buildMeetingIcs(meeting, kind), 'utf8').toString('base64')
    }]
  };
}

async function sendResendEmail(payload, idempotencyKey) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (!apiKey || !payload.from) {
    console.error('Email delivery is not configured. Missing RESEND_API_KEY or MEETING_FROM_EMAIL.');
    throw new Error('Email delivery is not configured.');
  }
  
  const result = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify(payload)
  });
  
  if (!result.ok) {
    const error = new Error(`Email provider rejected the request (${result.status}).`);
    error.status = result.status;
    throw error;
  }
  const data = await result.json();
  if (!data?.id) {
    throw new Error('Email provider returned no delivery ID.');
  }
  return data;
}

// ===== Firestore Trigger =====

exports.onMeetingWritten = functions
  .region('europe-west1')
  .firestore
  .document('meetings/{meetingId}')
  .onWrite(async (change, context) => {
    // If the document was deleted, do nothing
    if (!change.after.exists) return null;

    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.data();
    const meetingId = context.params.meetingId;
    const meeting = { id: meetingId, ...afterData };

    // 1. Detect New Meeting (Scheduled)
    const isNewScheduled = (!beforeData && afterData.status === 'scheduled') || 
                           (beforeData && beforeData.status !== 'scheduled' && afterData.status === 'scheduled');
    
    // 2. Detect Cancellation
    const isNewlyCancelled = (beforeData && beforeData.status === 'scheduled' && afterData.status === 'cancelled');

    let kind = null;
    if (isNewScheduled) kind = 'confirmation';
    else if (isNewlyCancelled) kind = 'cancellation';

    // If neither, no email to send
    if (!kind) return null;

    // Check if we already sent this kind of notification to avoid duplicates
    const currentNotifications = meeting.notifications || {};
    if (currentNotifications[kind] && currentNotifications[kind].status === 'sent') {
      console.log(`Notification ${kind} for meeting ${meetingId} already sent.`);
      return null;
    }

    const idempotencyKey = `elysium-meeting-${kind}-${meetingId}-${Date.now()}`;

    console.log(`Sending ${kind} email for meeting: ${meetingId}`);

    try {
      const adminEmail = adminNotificationEmail();
      const [providerResult, adminResult] = await Promise.all([
        sendResendEmail(meetingResendPayload(meeting, kind, 'client'), idempotencyKey),
        adminEmail
          ? sendResendEmail(meetingResendPayload(meeting, kind, 'admin'), `${idempotencyKey}-admin`)
          : Promise.resolve(null)
      ]);

      // Update the meeting document to record that the email was sent
      await db.collection('meetings').doc(meetingId).update({
        [`notifications.${kind}`]: {
          status: 'sent',
          provider: 'resend',
          providerMessageId: providerResult.id,
          adminMessageId: adminResult?.id || null,
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });
      
      console.log(`Successfully sent ${kind} email for meeting ${meetingId}`);
      return { success: true };
    } catch (error) {
      console.error(`Failed to send ${kind} email for meeting ${meetingId}:`, error);
      
      await db.collection('meetings').doc(meetingId).update({
        [`notifications.${kind}`]: {
          status: 'failed',
          lastError: error.message || 'email_delivery_failed',
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });
      
      return null; // Return null to prevent infinite retries if not configured
    }
  });
