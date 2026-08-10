const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

admin.initializeApp();
const db = getFirestore();

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
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @media (prefers-color-scheme: dark) {
      .bg-body { background: #030a16 !important; }
      .bg-card { background: #07152b !important; border: 1px solid #142e4d !important; box-shadow: 0 12px 40px rgba(0,0,0,0.4) !important; }
      .text-main { color: #ffffff !important; }
      .text-muted { color: #a3c2e0 !important; }
      .text-light { color: #6482a3 !important; }
      .border-top { border-top: 1px solid #142a4a !important; }
      .notes-box { background: #0a1930 !important; }
      .brand-logo { color: #ffffff !important; }
    }
    @media (max-width: 600px) {
      .container { padding: 20px 8px !important; }
      .card { padding: 32px 24px !important; border-radius: 20px !important; }
      .title { font-size: 24px !important; margin-bottom: 16px !important; }
      .stack-mobile { display: block !important; width: 100% !important; text-align: left !important; }
      .stack-mobile td { display: block !important; text-align: left !important; padding: 4px 0 !important; border: none !important; }
      .stack-mobile td:first-child { padding-top: 16px !important; color: #6482a3 !important; font-size: 13px !important; }
      .stack-mobile td:last-child { padding-bottom: 16px !important; font-size: 16px !important; }
      .border-top-mobile { border-top: 1px solid #e3eaf3 !important; }
      @media (prefers-color-scheme: dark) {
        .border-top-mobile { border-top: 1px solid #142a4a !important; }
      }
      .btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; margin-bottom: 12px !important; }
      .btn-group { margin-top: 24px !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body class="bg-body" style="margin:0;background:#f4f7fb;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="bg-body container" style="background:#f4f7fb;padding:40px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px">
        <tr><td class="brand-logo" style="padding:0 8px 32px;color:#0f172a;font-size:24px;font-weight:800;letter-spacing:.05em"><span style="color:#28a8ff">λ</span> ELYSIUM</td></tr>
        <tr><td class="bg-card card" style="background:#ffffff;border:1px solid #e3eaf3;border-radius:24px;padding:48px 40px;box-shadow:0 12px 40px rgba(0,0,0,0.04)">${content}</td></tr>
        <tr><td class="text-light" style="padding:32px 8px;color:#64748b;font-size:13px;line-height:1.6;text-align:center">Elysium Digital Experiences<br>elysiumdr.eu</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
    <div class="btn-group" style="margin-top:32px">
      <a href="${escapeHtml(meeting.meetingUrl)}" class="btn" style="display:inline-block;background:linear-gradient(135deg, #28a8ff, #0077ff);color:#fff;text-decoration:none;font-weight:600;padding:16px 28px;border-radius:999px;font-size:15px;letter-spacing:0.02em;box-shadow:0 4px 12px rgba(40,168,255,0.25)">${escapeHtml(copy.join)}</a>
    </div>`;
    
  const row = (label, value, extra = '', i = 1) => {
    const topStyle = i === 0 ? '' : 'border-top:1px solid #e3eaf3;';
    const topClass = i === 0 ? '' : 'border-top';
    return `<tr class="stack-mobile border-top-mobile ${topClass}"><td class="${topClass} text-light" style="padding:16px 0;${topStyle}color:#64748b;font-size:14px">${escapeHtml(label)}</td><td class="${topClass} text-main" style="padding:16px 0;${topStyle}text-align:right;font-size:15px;color:#0f172a;font-weight:${i===0?'600':'400'}">${escapeHtml(value)}${extra}</td></tr>`;
  };

  const content = `
    <p style="margin:0 0 12px;color:#28a8ff;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(heading)}</p>
    <h1 class="title text-main" style="margin:0 0 20px;color:#0f172a;font-size:28px;font-weight:700;line-height:1.2;letter-spacing:-0.02em">${escapeHtml(meeting.title)}</h1>
    <p class="text-muted" style="margin:0 0 32px;color:#475569;font-size:16px;line-height:1.6">${escapeHtml(copy.hello)} ${escapeHtml(meeting.clientName || '')}, ${escapeHtml(intro)}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="bg-body" style="background:#f8fafc;border:1px solid #e3eaf3;border-radius:16px;padding:8px 24px">
      ${row(copy.yourTime, clientDate, `<br><span class="text-light" style="color:#64748b;font-size:13px;font-weight:400">${escapeHtml(meeting.clientTimeZone)}</span>`, 0)}
      ${row(copy.adminTime, adminDate, `<br><span class="text-light" style="color:#64748b;font-size:13px;font-weight:400">${escapeHtml(meeting.adminTimeZone)}</span>`, 1)}
      ${row(copy.duration, `${Number(meeting.durationMinutes)} ${escapeHtml(copy.minutes)}`, '', 2)}
      ${row(copy.region, meeting.clientRegion || meeting.clientTimeZone, '', 3)}
    </table>
    ${notes ? `<div class="notes-box" style="margin:28px 0 0;background:#f8fafc;border-left:4px solid #28a8ff;padding:16px 20px;border-radius:0 12px 12px 0"><p class="text-muted" style="margin:0;color:#475569;font-size:15px;line-height:1.6"><strong class="text-main" style="color:#0f172a;display:block;margin-bottom:4px">${escapeHtml(copy.notes)}</strong> ${escapeHtml(notes)}</p></div>` : ''}
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

/**
 * The administrator's own copy. Same theme, different job: it confirms the
 * client has already been told, and carries the details the CRM needs at a
 * glance — who, which address, and a link straight to their profile.
 */
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
  
  const buttonGroup = `
    <div class="btn-group" style="margin-top:32px">
      ${cancelled ? '' : `<a href="${escapeHtml(meeting.meetingUrl)}" class="btn" style="display:inline-block;background:linear-gradient(135deg, #28a8ff, #0077ff);color:#fff;text-decoration:none;font-weight:600;padding:16px 28px;border-radius:999px;font-size:15px;letter-spacing:0.02em;box-shadow:0 4px 12px rgba(40,168,255,0.25)">${escapeHtml(copy.join)}</a><span class="hide-mobile">&nbsp;&nbsp;&nbsp;</span>`}
      <a href="${escapeHtml(crmUrl)}" class="btn" style="display:inline-block;border:1px solid #28a8ff;color:#28a8ff;text-decoration:none;font-weight:600;padding:15px 27px;border-radius:999px;font-size:15px;letter-spacing:0.02em">${escapeHtml(copy.adminOpenCrm)}</a>
    </div>`;

  const row = (label, value, extra = '', i = 1) => {
    const topStyle = i === 0 ? '' : 'border-top:1px solid #e3eaf3;';
    const topClass = i === 0 ? '' : 'border-top';
    return `<tr class="stack-mobile border-top-mobile ${topClass}"><td class="${topClass} text-light" style="padding:16px 0;${topStyle}color:#64748b;font-size:14px">${escapeHtml(label)}</td><td class="${topClass} text-main" style="padding:16px 0;${topStyle}text-align:right;font-size:15px;color:#0f172a;font-weight:${i===0?'600':'400'}">${escapeHtml(value)}${extra}</td></tr>`;
  };

  const content = `
    <p style="margin:0 0 12px;color:#28a8ff;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(heading)}</p>
    <h1 class="title text-main" style="margin:0 0 20px;color:#0f172a;font-size:28px;font-weight:700;line-height:1.2;letter-spacing:-0.02em">${escapeHtml(meeting.title)}</h1>
    <p class="text-muted" style="margin:0 0 32px;color:#475569;font-size:16px;line-height:1.6">${escapeHtml(intro)}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="bg-body" style="background:#f8fafc;border:1px solid #e3eaf3;border-radius:16px;padding:8px 24px">
      ${row(copy.adminClient, meeting.clientName || '—', '', 0)}
      ${row(copy.adminEmail, meeting.clientEmail || '—', '', 1)}
      ${row(copy.adminTime, adminDate, `<br><span class="text-light" style="color:#64748b;font-size:13px;font-weight:400">${escapeHtml(meeting.adminTimeZone)}</span>`, 2)}
      ${row(copy.yourTime, clientDate, `<br><span class="text-light" style="color:#64748b;font-size:13px;font-weight:400">${escapeHtml(meeting.clientTimeZone)}</span>`, 3)}
      ${row(copy.duration, `${Number(meeting.durationMinutes)} ${escapeHtml(copy.minutes)}`, '', 4)}
      ${row(copy.region, meeting.clientRegion || meeting.clientTimeZone || '—', '', 5)}
    </table>
    ${notes ? `<div class="notes-box" style="margin:28px 0 0;background:#f8fafc;border-left:4px solid #28a8ff;padding:16px 20px;border-radius:0 12px 12px 0"><p class="text-muted" style="margin:0;color:#475569;font-size:15px;line-height:1.6"><strong class="text-main" style="color:#0f172a;display:block;margin-bottom:4px">${escapeHtml(copy.notes)}</strong> ${escapeHtml(notes)}</p></div>` : ''}
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
          sentAt: FieldValue.serverTimestamp()
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
          failedAt: FieldValue.serverTimestamp()
        }
      });
      
      return null; // Return null to prevent infinite retries if not configured
    }
  });

// ─── CORREO DEL CRM ────────────────────────────────────────────────────────
//
// Aquí vivía `sendCustomEmail`, una función invocable que aceptaba `from`, `to`,
// `subject`, `html` y adjuntos y los enviaba por Resend. Se ha retirado por dos
// motivos, y ninguno se arregla ajustándola:
//
//  1. **No comprobaba que quien llamaba fuese administrador.** Su propio
//     comentario lo decía: «let's allow any authenticated user for now». Como
//     el portal de cliente permite registrarse, cualquier cliente con sesión
//     podía enviar correo con `from: info@elysiumdr.eu` y adjuntos arbitrarios
//     a cualquier dirección. Era un relé abierto para suplantar a la empresa.
//  2. **Enviaba por Resend**, que no está configurado en este repositorio:
//     `RESEND_API_KEY` no aparece en ningún `.env.example` ni en el despliegue.
//     El correo que sale de verdad es el de `backend/platform-server.js`, por
//     SMTP contra el buzón de IONOS, que es además quien posee las direcciones
//     `info@` y `daniel.morales@`.
//
// El CRM redacta ahora contra `POST /api/mail/send` de ese servicio: exige el
// claim de administrador, elige el remitente de una lista cerrada del servidor
// y limita tamaño y número de adjuntos.
