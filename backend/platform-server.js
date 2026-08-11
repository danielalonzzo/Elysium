'use strict';

/**
 * Elysium platform service.
 *
 * Agenda de reuniones, correo profesional del CRM, recuperación de contraseña
 * y recepción protegida de consultas de proyecto. Las suscripciones y licencias
 * las asigna el administrador desde el CRM y viven en Firestore; aquí no se
 * cobra nada.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app');
const { FieldValue, Timestamp, getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

if (getApps().length === 0) {
  initializeApp({ credential: applicationDefault() });
}

const db = getFirestore();
const firebaseAuth = getAuth();
const app = express();
const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
// Production runs behind one trusted ingress hop (Cloud Run/Cloudflare proxy),
// allowing Express to expose the originating address through request.ip.
app.set('trust proxy', Number.isInteger(trustProxyHops) && trustProxyHops >= 0 ? trustProxyHops : 1);
const PORT = Number(process.env.PORT || 4242);
const MEETING_EMAIL_LEASE_MS = 2 * 60 * 1000;
const MAX_MEETING_RANGE_DAYS = 370;
const PASSWORD_RESET_WINDOW_MS = 60 * 60 * 1000;
const PASSWORD_RESET_EMAIL_LIMIT = 5;
const PASSWORD_RESET_IP_LIMIT = 20;
const PROSPECT_WINDOW_MS = 60 * 60 * 1000;
const PROSPECT_EMAIL_LIMIT = 3;
const PROSPECT_IP_LIMIT = 12;
const SUPER_ADMIN_EMAILS = new Set(
  String(process.env.ADMIN_EMAILS || 'danielalonzzo@icloud.com')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)
);
const passwordResetAttempts = new Map();
const prospectAttempts = new Map();

/** The site's public origin, used in links that travel inside emails. */
function publicBaseUrl() {
  return String(process.env.PUBLIC_BASE_URL || 'https://elysiumdr.eu').replace(/\/$/, '');
}

const configuredOrigins = (process.env.ALLOWED_ORIGINS || [
  'https://elysiumdr.eu',
  'https://www.elysiumdr.eu',
  'http://localhost:8787',
  'http://localhost:4242',
  'http://localhost:8123',
  'http://127.0.0.1:8787',
  'http://127.0.0.1:8123'
].join(','))
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowedOrigins = new Set(configuredOrigins);

app.use((request, response, next) => {
  const origin = String(request.get('origin') || '').replace(/\/$/, '');
  if (allowedOrigins.has(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
    response.set('Vary', 'Origin');
    response.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (request.method === 'OPTIONS') return response.sendStatus(204);
  return next();
});

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (Number.isFinite(value.seconds)) return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return Number(value) || 0;
}

app.use(express.urlencoded({ extended: false }));

/* 64 kB es de sobra para todo lo que recibe este servicio menos una cosa: el
   correo que se redacta en el CRM, que lleva adjuntos en base64. Ese camino se
   salta el analizador general y usa el suyo, con un límite mucho mayor; si se
   subiera el global, cualquier ruta aceptaría cuerpos de megabytes. */
const compactJsonBody = express.json({ limit: '64kb' });
app.use((request, response, next) => (
  request.path === '/api/mail/send' ? next() : compactJsonBody(request, response, next)
));

async function requireFirebaseUser(request, response, next) {
  try {
    response.set('Cache-Control', 'no-store');
    const authorization = request.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) return response.status(401).json({ error: 'Authentication required.' });
    request.firebaseUser = await firebaseAuth.verifyIdToken(match[1], true);
    if (!request.firebaseUser.email || request.firebaseUser.email_verified !== true) {
      return response.status(403).json({
        error: 'Verify your email address before continuing.',
        code: 'email_not_verified'
      });
    }
    return next();
  } catch (error) {
    return response.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

function isFirebaseAdmin(identity) {
  if (!identity || identity.email_verified !== true) return false;
  const role = String(identity.role || '').toLowerCase();
  return identity.admin === true
    || ['admin', 'root', 'super_admin'].includes(role)
    || SUPER_ADMIN_EMAILS.has(String(identity.email || '').toLowerCase());
}

function requireFirebaseAdmin(request, response, next) {
  if (!isFirebaseAdmin(request.firebaseUser)) {
    return response.status(403).json({ error: 'Administrator access required.', code: 'admin_required' });
  }
  return next();
}

class MeetingValidationError extends Error {
  constructor(message, code, field = null) {
    super(message);
    this.name = 'MeetingValidationError';
    this.code = code;
    this.field = field;
  }
}

function normalizedEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function normalizedLocale(value) {
  const locale = String(value || '').toLowerCase().split(/[-_]/)[0];
  return ['en', 'es', 'pt'].includes(locale) ? locale : 'en';
}

function safePlainText(value, field, maxLength, { required = false } = {}) {
  const text = String(value || '').trim();
  if (required && !text) {
    throw new MeetingValidationError(`${field} is required.`, 'required', field);
  }
  if (text.length > maxLength || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) {
    throw new MeetingValidationError(`${field} is invalid.`, 'invalid_text', field);
  }
  return text;
}

function normalizedHttpsUrl(value) {
  const raw = String(value || '').trim();
  if (!raw || raw.length > 2048) {
    throw new MeetingValidationError('A meeting link is required.', 'invalid_meeting_url', 'meetingUrl');
  }
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) throw new Error('invalid');
    return url.toString();
  } catch (_error) {
    throw new MeetingValidationError('The meeting link must be a valid HTTPS URL.', 'invalid_meeting_url', 'meetingUrl');
  }
}

function validateIanaTimeZone(value, field) {
  const timeZone = String(value || '').trim();
  if (!timeZone || timeZone.length > 100) {
    throw new MeetingValidationError(`${field} is required.`, 'invalid_time_zone', field);
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format(0);
    return timeZone;
  } catch (_error) {
    throw new MeetingValidationError(`${field} must be a valid IANA time zone.`, 'invalid_time_zone', field);
  }
}

function zonedDateParts(instantMillis, timeZone, existingFormatter = null) {
  const formatter = existingFormatter || new Intl.DateTimeFormat('en-CA', {
      timeZone,
      calendar: 'gregory',
      numberingSystem: 'latn',
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(instantMillis))
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, Number(part.value)])
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute
  };
}

/**
 * Converts an explicitly zoned wall-clock value into one UTC instant. A local
 * time inside a DST gap has no match; a local time inside a DST fold has two.
 * Both are rejected so the admin must choose an unambiguous time.
 */
function resolveZonedLocalDateTime(date, time, timeZone) {
  const dateMatch = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(time || '').match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch) throw new MeetingValidationError('Date must use YYYY-MM-DD.', 'invalid_date', 'date');
  if (!timeMatch) throw new MeetingValidationError('Time must use HH:mm.', 'invalid_time', 'time');

  const wanted = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2])
  };
  const dateCheck = new Date(Date.UTC(wanted.year, wanted.month - 1, wanted.day));
  if (dateCheck.getUTCFullYear() !== wanted.year
    || dateCheck.getUTCMonth() !== wanted.month - 1
    || dateCheck.getUTCDate() !== wanted.day) {
    throw new MeetingValidationError('Date is not valid.', 'invalid_date', 'date');
  }
  if (wanted.hour > 23 || wanted.minute > 59) {
    throw new MeetingValidationError('Time is not valid.', 'invalid_time', 'time');
  }

  const zone = validateIanaTimeZone(timeZone, 'adminTimeZone');
  const nominalUtc = Date.UTC(wanted.year, wanted.month - 1, wanted.day, wanted.hour, wanted.minute);
  const matches = [];
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  for (let offsetMinutes = -16 * 60; offsetMinutes <= 16 * 60; offsetMinutes += 1) {
    const candidate = nominalUtc + offsetMinutes * 60_000;
    const parts = zonedDateParts(candidate, zone, formatter);
    if (parts.year === wanted.year
      && parts.month === wanted.month
      && parts.day === wanted.day
      && parts.hour === wanted.hour
      && parts.minute === wanted.minute) {
      matches.push(candidate);
    }
  }
  const uniqueMatches = [...new Set(matches)];
  if (uniqueMatches.length === 0) {
    throw new MeetingValidationError(
      'That local time does not exist because of a daylight-saving transition.',
      'nonexistent_local_time',
      'time'
    );
  }
  if (uniqueMatches.length > 1) {
    throw new MeetingValidationError(
      'That local time occurs twice because of a daylight-saving transition. Choose another time.',
      'ambiguous_local_time',
      'time'
    );
  }
  return new Date(uniqueMatches[0]);
}

function normalizeMeetingInput(body, nowMillis = Date.now()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new MeetingValidationError('Invalid request body.', 'invalid_body');
  }
  const userId = safePlainText(body.userId, 'userId', 128, { required: true });
  if (!/^[A-Za-z0-9:_-]+$/.test(userId)) {
    throw new MeetingValidationError('userId is invalid.', 'invalid_user_id', 'userId');
  }
  const title = safePlainText(body.title, 'title', 160, { required: true });
  const notes = safePlainText(body.notes, 'notes', 2000);
  const clientRegion = safePlainText(body.clientRegion, 'clientRegion', 100);
  const meetingUrl = normalizedHttpsUrl(body.meetingUrl);
  const adminTimeZone = validateIanaTimeZone(body.adminTimeZone, 'adminTimeZone');
  const clientTimeZone = validateIanaTimeZone(body.clientTimeZone, 'clientTimeZone');
  const date = String(body.date || '');
  const time = String(body.time || '');
  const startAt = resolveZonedLocalDateTime(date, time, adminTimeZone);
  const durationMinutes = Number(body.durationMinutes);
  if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 480) {
    throw new MeetingValidationError(
      'Duration must be a whole number between 15 and 480 minutes.',
      'invalid_duration',
      'durationMinutes'
    );
  }
  if (startAt.getTime() < nowMillis - 5 * 60_000) {
    throw new MeetingValidationError('Meeting time is in the past.', 'meeting_in_past', 'date');
  }
  return {
    userId,
    title,
    notes,
    clientRegion: clientRegion || clientTimeZone,
    meetingUrl,
    adminTimeZone,
    clientTimeZone,
    date,
    time,
    durationMinutes,
    startAt,
    endAt: new Date(startAt.getTime() + durationMinutes * 60_000),
    locale: body.locale ? normalizedLocale(body.locale) : null
  };
}

function normalizedIdempotencyKey(value) {
  const key = String(value || '').trim();
  if (key.length < 8 || key.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
    throw new MeetingValidationError(
      'A valid Idempotency-Key header is required.',
      'invalid_idempotency_key',
      'idempotencyKey'
    );
  }
  return key;
}

function meetingIdForRequest(adminUid, idempotencyKey) {
  return `mtg_${crypto.createHash('sha256').update(`${adminUid}\u0000${idempotencyKey}`).digest('hex').slice(0, 40)}`;
}

function meetingRequestFingerprint(meeting) {
  const canonical = {
    userId: meeting.userId,
    title: meeting.title,
    notes: meeting.notes,
    clientRegion: meeting.clientRegion,
    meetingUrl: meeting.meetingUrl,
    adminTimeZone: meeting.adminTimeZone,
    clientTimeZone: meeting.clientTimeZone,
    date: meeting.date,
    time: meeting.time,
    durationMinutes: meeting.durationMinutes,
    locale: meeting.locale
  };
  return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

function dateFromFirestore(value) {
  if (value instanceof Date) return value;
  if (value && typeof value.toDate === 'function') return value.toDate();
  if (value && Number.isFinite(value.seconds)) return new Date(value.seconds * 1000);
  return new Date(value);
}

function formattedZonedDate(value, timeZone, locale = 'en') {
  const locales = { en: 'en-GB', es: 'es-ES', pt: 'pt-PT' };
  return new Intl.DateTimeFormat(locales[normalizedLocale(locale)], {
    timeZone,
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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style>
    :root { color-scheme: light only; supported-color-schemes: light; }
    body, table, td { color-scheme: light only !important; }
    @media (max-width: 600px) {
      .container { padding: 18px 8px !important; }
      .card { padding: 32px 22px !important; }
      .title { font-size: 24px !important; margin-bottom: 16px !important; }
      .stack-mobile { display: block !important; width: 100% !important; text-align: left !important; }
      .stack-mobile td { display: block !important; text-align: left !important; padding: 4px 0 !important; border: none !important; }
      .stack-mobile td:first-child { padding-top: 16px !important; color: #60748a !important; font-size: 13px !important; }
      .stack-mobile td:last-child { padding-bottom: 16px !important; font-size: 16px !important; }
      .border-top-mobile { border-top: 1px solid #e7edf2 !important; }
      .btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; margin-bottom: 12px !important; }
      .btn-group { margin-top: 24px !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body class="bg-body" bgcolor="#f6f4ef" style="margin:0;background:#f6f4ef;color:#18334b;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f6f4ef" class="bg-body container" style="width:100%;background:#f6f4ef;padding:42px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px">
        <tr><td class="brand-logo" style="padding:0 10px 26px;color:#173e62;font-size:22px;font-weight:700;letter-spacing:.08em"><span style="color:#2997ff">λ</span>&nbsp; ELYSIUM</td></tr>
        <tr><td class="bg-card card" bgcolor="#ffffff" style="background:#ffffff;border:1px solid #e4e9ed;border-radius:30px;padding:48px 42px;box-shadow:0 18px 55px rgba(28,64,92,0.08)">${content}</td></tr>
        <tr><td align="center" style="padding:28px 8px 0">
          <img src="cid:elysium-email-seal" width="78" height="78" alt="Elysium seal" style="display:block;width:78px;height:78px;margin:0 auto 12px;border:0">
          <p class="text-light" style="margin:0;color:#687c8d;font-size:12px;line-height:1.65;text-align:center">Elysium λ Development &amp; Research<br><a href="https://elysiumdr.eu" style="color:#47708f;text-decoration:none">elysiumdr.eu</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Adds the official seal to an uploaded CRM template without a signature. */
function withElysiumSeal(html) {
  const source = String(html || '');
  if (!source.trim() || source.includes('cid:elysium-email-seal')) return source;
  const footer = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;margin-top:28px"><tr><td align="center" style="padding:24px 12px 8px"><img src="cid:elysium-email-seal" width="78" height="78" alt="Sello Elysium" style="display:block;width:78px;height:78px;margin:0 auto 10px;border:0"><p style="margin:0;color:#687c8d;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5">Elysium λ Development &amp; Research</p></td></tr></table>`;
  return /<\/body\s*>/i.test(source)
    ? source.replace(/<\/body\s*>/i, `${footer}</body>`)
    : `${source}${footer}`;
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
    ${notes ? `<div class="notes-box" style="margin:28px 0 0;background:#edf7fd;border:1px solid #d6ebf7;padding:19px 21px;border-radius:18px"><p class="text-muted" style="margin:0;color:#526b7d;font-size:15px;line-height:1.65"><strong class="text-main" style="color:#173e62;display:block;margin-bottom:5px">${escapeHtml(copy.notes)}</strong> ${escapeHtml(notes)}</p></div>` : ''}
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
    ${notes ? `<div class="notes-box" style="margin:28px 0 0;background:#edf7fd;border:1px solid #d6ebf7;padding:19px 21px;border-radius:18px"><p class="text-muted" style="margin:0;color:#526b7d;font-size:15px;line-height:1.65"><strong class="text-main" style="color:#173e62;display:block;margin-bottom:5px">${escapeHtml(copy.notes)}</strong> ${escapeHtml(notes)}</p></div>` : ''}
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

/** Where the administrator's copy goes. */
function adminNotificationEmail() {
  return normalizedEmail(process.env.ADMIN_NOTIFICATION_EMAIL)
    || [...SUPER_ADMIN_EMAILS][0]
    || null;
}

function meetingEmailPayload(meeting, kind = 'confirmation', audience = 'client') {
  const email = audience === 'admin'
    ? buildMeetingAdminEmail(meeting, kind)
    : buildMeetingEmail(meeting, kind);
  return {
    from: process.env.MEETING_FROM_EMAIL || '',
    to: [audience === 'admin' ? adminNotificationEmail() : meeting.clientEmail],
    subject: email.subject,
    html: email.html,
    text: email.text,
    attachments: [{
      filename: kind === 'cancellation' ? 'elysium-meeting-cancelled.ics' : 'elysium-meeting.ics',
      content: Buffer.from(buildMeetingIcs(meeting, kind), 'utf8').toString('base64'),
      // El METHOD del .ics decide si el cliente de correo ofrece «añadir al
      // calendario» o «quitar»; sin él, muchos lo tratan como fichero suelto.
      contentType: `text/calendar; charset=utf-8; method=${kind === 'cancellation' ? 'CANCEL' : 'REQUEST'}`
    }]
  };
}

/* ── Envío por SMTP ──────────────────────────────────────────────────────────
   El correo sale del buzón de la empresa en IONOS, no de un proveedor externo,
   así que el cliente recibe el mensaje desde la misma dirección a la que puede
   responder y que ya conoce.

   Lo que SMTP no tiene es la clave de idempotencia que sí ofrecía la API
   anterior. La protección real está antes, en `claimMeetingNotification`: una
   transacción con reserva temporal impide que dos intentos simultáneos manden
   el mismo correo. Aquí se refuerza con un Message-ID determinista, derivado de
   esa misma clave, para que un reenvío llegue con la identidad del original y
   los servidores que deduplican por Message-ID puedan descartarlo.
   ─────────────────────────────────────────────────────────────────────────── */

let smtpTransport = null;

function smtpConfig() {
  const host = String(process.env.SMTP_HOST || '').trim();
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASSWORD || '');
  const port = Number(process.env.SMTP_PORT || 587);
  return { host, user, pass, port };
}

function emailTransport() {
  if (smtpTransport) return smtpTransport;
  const { host, user, pass, port } = smtpConfig();
  if (!host || !user || !pass) return null;
  const nodemailer = require('nodemailer');
  smtpTransport = nodemailer.createTransport({
    host,
    port,
    // 465 abre TLS desde el principio; 587 empieza en claro y sube con STARTTLS.
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 2,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000
  });
  return smtpTransport;
}

/** Dominio para el Message-ID; el del remitente, no el del servidor. */
function messageIdDomain() {
  const from = String(process.env.MEETING_FROM_EMAIL || process.env.SMTP_USER || '');
  return (extractEmailAddress(from) || 'elysiumdr.eu').split('@').pop();
}

let emailSealBase64 = null;
function elysiumSealAttachment() {
  if (emailSealBase64 == null) {
    emailSealBase64 = fs.readFileSync(
      path.join(__dirname, 'assets', 'elysium-email-seal.png')
    ).toString('base64');
  }
  return {
    filename: 'elysium-email-seal.png',
    content: emailSealBase64,
    contentType: 'image/png',
    cid: 'elysium-email-seal',
    contentDisposition: 'inline'
  };
}

async function sendEmail(payload, idempotencyKey, transportImpl = null) {
  const transport = transportImpl || emailTransport();
  if (!transport || !payload.from || !payload.to?.[0]) {
    const error = new Error('Email delivery is not configured.');
    error.code = 'email_not_configured';
    throw error;
  }
  try {
    const attachments = [...(payload.attachments || [])];
    if (String(payload.html || '').includes('cid:elysium-email-seal')
      && !attachments.some(attachment => attachment.cid === 'elysium-email-seal')) {
      attachments.push(elysiumSealAttachment());
    }
    const info = await transport.sendMail({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
      messageId: `<${idempotencyKey}@${messageIdDomain()}>`,
      attachments: attachments.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        encoding: 'base64',
        contentType: attachment.contentType,
        cid: attachment.cid,
        contentDisposition: attachment.contentDisposition
      }))
    });
    if (!info?.messageId) {
      const error = new Error('SMTP accepted the message without an identifier.');
      error.code = 'email_delivery_failed';
      throw error;
    }
    // Un destinatario rechazado con el resto aceptados no es un envío correcto.
    if (Array.isArray(info.rejected) && info.rejected.length) {
      const error = new Error(`SMTP rejected ${info.rejected.join(', ')}.`);
      error.code = 'email_delivery_failed';
      throw error;
    }
    return { id: info.messageId };
  } catch (error) {
    if (error.code === 'email_delivery_failed' || error.code === 'email_not_configured') throw error;
    const wrapped = new Error(`SMTP delivery failed: ${error.message}`);
    wrapped.code = 'email_delivery_failed';
    wrapped.smtpCode = error.responseCode || error.code || null;
    throw wrapped;
  }
}

function meetingNotificationPath(kind) {
  if (!['confirmation', 'cancellation'].includes(kind)) throw new Error('Invalid notification kind.');
  return `notifications.${kind}`;
}

async function claimMeetingNotification(meetingId, kind, nowMillis = Date.now()) {
  const meetingRef = db.collection('meetings').doc(meetingId);
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(meetingRef);
    if (!snapshot.exists) return { kind: 'missing' };
    const meeting = snapshot.data();
    if (kind === 'confirmation' && meeting.status !== 'scheduled') return { kind: 'suppressed', meeting };
    if (kind === 'cancellation' && meeting.status !== 'cancelled') return { kind: 'suppressed', meeting };
    const current = meeting.notifications?.[kind] || {};
    if (current.status === 'sent') return { kind: 'sent', meeting, delivery: current };
    if (current.status === 'sending' && timestampMillis(current.leaseUntil) > nowMillis) {
      return { kind: 'in_progress', meeting, delivery: current };
    }
    const attemptId = crypto.randomUUID();
    const idempotencyKey = `elysium-meeting-${kind}-${meetingId}`;
    const delivery = {
      ...current,
      status: 'sending',
      attemptId,
      idempotencyKey,
      attemptCount: Number(current.attemptCount || 0) + 1,
      leaseUntil: Timestamp.fromMillis(nowMillis + MEETING_EMAIL_LEASE_MS),
      updatedAt: FieldValue.serverTimestamp()
    };
    transaction.update(meetingRef, { [meetingNotificationPath(kind)]: delivery });
    return { kind: 'claimed', meeting: { id: meetingId, ...meeting }, attemptId, idempotencyKey };
  });
}

async function finishMeetingNotification(meetingId, kind, attemptId, patch) {
  const meetingRef = db.collection('meetings').doc(meetingId);
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(meetingRef);
    if (!snapshot.exists) return false;
    const meeting = snapshot.data();
    const current = meeting.notifications?.[kind] || {};
    if (current.attemptId !== attemptId) return false;
    transaction.update(meetingRef, {
      [meetingNotificationPath(kind)]: {
        ...current,
        ...patch,
        leaseUntil: null,
        updatedAt: FieldValue.serverTimestamp()
      }
    });
    return true;
  });
}

/**
 * Envía la notificación de una reunión y traduce el resultado a algo que el CRM
 * pueda enseñar.
 *
 * `deliverMeetingNotification` estaba escrita entera —reserva por lease,
 * idempotencia, reintentos, copia al administrador— pero no la llamaba nadie:
 * la creación de la reunión dejaba `notifications.confirmation.status` en
 * `pending` y ahí se quedaba para siempre. No es que el correo fallara, es que
 * nunca se intentaba, así que ninguna reunión ha confirmado nunca.
 *
 * Nunca lanza: una reunión guardada no puede convertirse en un error HTTP
 * porque el proveedor de correo esté caído. Y reintentar es seguro, porque el
 * claim y la Idempotency-Key impiden el envío doble.
 */
async function dispatchMeetingEmail(meetingId, kind, transportImpl = null) {
  try {
    const result = await deliverMeetingNotification(meetingId, kind, transportImpl);
    return result.kind;
  } catch (error) {
    console.error(
      `Meeting ${kind} email failed for ${meetingId}:`,
      error.code || error.message || 'unknown_error'
    );
    return error.code === 'email_not_configured' ? 'not_configured' : 'failed';
  }
}

async function deliverMeetingNotification(meetingId, kind, transportImpl = null) {
  const claim = await claimMeetingNotification(meetingId, kind);
  if (claim.kind !== 'claimed') return claim;

  // Re-read after claiming to avoid sending a confirmation that was cancelled
  // immediately before the external provider call.
  const latestSnapshot = await db.collection('meetings').doc(meetingId).get();
  const latestMeeting = latestSnapshot.data();
  if (!latestMeeting
    || kind === 'confirmation' && latestMeeting.status !== 'scheduled'
    || kind === 'cancellation' && latestMeeting.status !== 'cancelled') {
    await finishMeetingNotification(meetingId, kind, claim.attemptId, { status: 'suppressed' });
    return { kind: 'suppressed' };
  }

  try {
    // The client is told, and so is the administrator. Both go out under the
    // same claim with their own idempotency key, so a retry after a partial
    // failure re-sends only the one that never left.
    const meeting = { id: meetingId, ...latestMeeting };
    const adminEmail = adminNotificationEmail();
    const [providerResult, adminResult] = await Promise.all([
      sendEmail(meetingEmailPayload(meeting, kind, 'client'), claim.idempotencyKey, transportImpl),
      adminEmail
        ? sendEmail(meetingEmailPayload(meeting, kind, 'admin'), `${claim.idempotencyKey}-admin`, transportImpl)
        : Promise.resolve(null)
    ]);
    await finishMeetingNotification(meetingId, kind, claim.attemptId, {
      status: 'sent',
      provider: 'smtp',
      providerMessageId: providerResult.id,
      adminMessageId: adminResult?.id || null,
      sentAt: FieldValue.serverTimestamp(),
      lastError: null
    });
    return { kind: 'sent', providerMessageId: providerResult.id, adminMessageId: adminResult?.id || null };
  } catch (error) {
    await finishMeetingNotification(meetingId, kind, claim.attemptId, {
      status: 'failed',
      lastError: error.code || 'email_delivery_failed',
      failedAt: FieldValue.serverTimestamp()
    });
    throw error;
  }
}

function serializeMeeting(id, meeting) {
  function serializeValue(value) {
    if (value instanceof Date) return value.toISOString();
    if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
    if (Array.isArray(value)) return value.map(serializeValue);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, serializeValue(child)]));
    }
    return value;
  }
  return { id, ...serializeValue(meeting) };
}

function passwordResetRateLimited(key, limit, nowMillis = Date.now(), attempts = passwordResetAttempts) {
  const current = attempts.get(key);
  if (!current || current.resetAt <= nowMillis) {
    attempts.set(key, { count: 1, resetAt: nowMillis + PASSWORD_RESET_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

function cleanupPasswordResetAttempts(nowMillis = Date.now()) {
  if (passwordResetAttempts.size < 1000) return;
  for (const [key, value] of passwordResetAttempts) {
    if (value.resetAt <= nowMillis) passwordResetAttempts.delete(key);
  }
}

function passwordResetEmail(email, resetLink, locale = 'en') {
  const language = normalizedLocale(locale);
  const copy = {
    en: { subject: 'Reset your Elysium password', heading: 'Reset your password', intro: 'We received a request to reset your Elysium password.', button: 'Choose a new password', expiry: 'For your security, use this link only once. If you did not request it, you can ignore this email.' },
    es: { subject: 'Restablece tu contraseña de Elysium', heading: 'Restablece tu contraseña', intro: 'Recibimos una solicitud para restablecer tu contraseña de Elysium.', button: 'Elegir una nueva contraseña', expiry: 'Por tu seguridad, utiliza este enlace una sola vez. Si no hiciste la solicitud, puedes ignorar este correo.' },
    pt: { subject: 'Repor a palavra-passe da Elysium', heading: 'Repor a palavra-passe', intro: 'Recebemos um pedido para repor a sua palavra-passe da Elysium.', button: 'Escolher uma nova palavra-passe', expiry: 'Para sua segurança, utilize esta ligação apenas uma vez. Se não fez o pedido, pode ignorar este email.' }
  }[language];
  const content = `
    <p style="margin:0 0 12px;color:#28a8ff;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Elysium Security</p>
    <h1 class="title text-main" style="margin:0 0 20px;color:#0f172a;font-size:28px;font-weight:700;line-height:1.2;letter-spacing:-0.02em">${escapeHtml(copy.heading)}</h1>
    <p class="text-muted" style="margin:0 0 32px;color:#475569;font-size:16px;line-height:1.6">${escapeHtml(copy.intro)}</p>
    <div class="btn-group" style="margin-top:32px;margin-bottom:32px">
      <a href="${escapeHtml(resetLink)}" class="btn" style="display:inline-block;background:linear-gradient(135deg, #28a8ff, #0077ff);color:#fff;text-decoration:none;font-weight:600;padding:16px 28px;border-radius:999px;font-size:15px;letter-spacing:0.02em;box-shadow:0 4px 12px rgba(40,168,255,0.25)">${escapeHtml(copy.button)}</a>
    </div>
    <p class="text-light" style="margin:0;color:#64748b;font-size:13px;line-height:1.6">${escapeHtml(copy.expiry)}</p>`;
  return {
    from: process.env.PASSWORD_RESET_FROM_EMAIL || process.env.MEETING_FROM_EMAIL || '',
    to: [email],
    subject: copy.subject,
    html: emailTheme(content, copy.subject),
    text: `${copy.intro}\n${copy.button}: ${resetLink}\n\n${copy.expiry}`
  };
}

function passwordResetEmailConfigured() {
  const { host, user, pass } = smtpConfig();
  return Boolean(
    host && user && pass
    && String(process.env.PASSWORD_RESET_FROM_EMAIL || process.env.MEETING_FROM_EMAIL || '').trim()
  );
}

function passwordResetContinueUrl(locale) {
  const base = String(process.env.PUBLIC_BASE_URL || 'https://elysiumdr.eu').replace(/\/$/, '');
  const prefix = normalizedLocale(locale) === 'en' ? '' : `/${normalizedLocale(locale)}`;
  return `${base}${prefix}/profiles?passwordReset=complete`;
}

function resetAttemptKey(kind, value) {
  return `${kind}:${crypto.createHash('sha256').update(String(value || '')).digest('hex')}`;
}

async function minimumResponseDelay(startedAt, milliseconds = 650) {
  const remaining = milliseconds - (Date.now() - startedAt);
  if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
}

app.post('/api/auth/password-reset', async (request, response) => {
  const startedAt = Date.now();
  const genericResponse = {
    ok: true,
    message: 'If an eligible account exists, a password reset email will arrive shortly.'
  };
  response.set('Cache-Control', 'no-store');
  if (!passwordResetEmailConfigured()) {
    await minimumResponseDelay(startedAt);
    return response.status(503).json({
      ok: false,
      error: 'Password reset email is not configured.',
      code: 'email_not_configured'
    });
  }
  const email = normalizedEmail(request.body?.email);
  const locale = normalizedLocale(request.body?.locale);
  const remoteAddress = request.ip || 'unknown';
  cleanupPasswordResetAttempts(startedAt);
  const limited = !email
    || passwordResetRateLimited(resetAttemptKey('ip', remoteAddress), PASSWORD_RESET_IP_LIMIT, startedAt)
    || passwordResetRateLimited(resetAttemptKey('email', email), PASSWORD_RESET_EMAIL_LIMIT, startedAt);

  if (!limited) {
    try {
      const account = await firebaseAuth.getUserByEmail(email);
      if (!account.disabled) {
        const resetLink = await firebaseAuth.generatePasswordResetLink(email, {
          url: passwordResetContinueUrl(locale),
          handleCodeInApp: false
        });
        const deliveryKey = `elysium-password-reset-${crypto.createHash('sha256').update(resetLink).digest('hex')}`;
        await sendEmail(passwordResetEmail(email, resetLink, locale), deliveryKey);
      }
    } catch (error) {
      // The response is deliberately identical for missing accounts, disabled
      // accounts, provider failures and successful sends. Operational errors
      // remain visible in server logs without printing the requested address.
      if (error?.code !== 'auth/user-not-found') {
        console.error('Password reset delivery failed:', error?.code || error?.message || 'unknown_error');
      }
    }
  }

  await minimumResponseDelay(startedAt);
  return response.status(202).json(genericResponse);
});

class ProspectValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ProspectValidationError';
    this.field = field;
  }
}

function normalizeProspectInput(body = {}) {
  const name = String(body.name || '').trim();
  const company = String(body.company || '').trim();
  const email = normalizedEmail(body.email);
  const projectDescription = String(body.projectDescription || '').trim();
  const isExistingClient = body.isExistingClient === true;
  const licenseCode = String(body.licenseCode || '').trim().toUpperCase();
  const safeText = (value, maximum, required = false) => (
    (!required || value.length > 0) && value.length <= maximum && !/[<>]/.test(value)
  );
  if (!safeText(name, 120, true)) throw new ProspectValidationError('Enter a valid name.', 'name');
  if (!safeText(company, 120, true)) throw new ProspectValidationError('Enter a valid company.', 'company');
  if (!email) throw new ProspectValidationError('Enter a valid email address.', 'email');
  if (!safeText(projectDescription, 2000)) {
    throw new ProspectValidationError('The project description is invalid.', 'projectDescription');
  }
  if (isExistingClient && !/^ELY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4,20}$/.test(licenseCode)) {
    throw new ProspectValidationError('Enter a valid Elysium licence.', 'licenseCode');
  }
  return {
    name,
    company,
    email,
    projectDescription,
    isExistingClient,
    licenseCode: isExistingClient ? licenseCode : null
  };
}

function prospectRateLimited(key, limit, nowMillis = Date.now(), attempts = prospectAttempts) {
  const current = attempts.get(key);
  if (!current || current.resetAt <= nowMillis) {
    attempts.set(key, { count: 1, resetAt: nowMillis + PROSPECT_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

function cleanupProspectAttempts(nowMillis = Date.now()) {
  if (prospectAttempts.size < 1000) return;
  for (const [key, value] of prospectAttempts) {
    if (value.resetAt <= nowMillis) prospectAttempts.delete(key);
  }
}

app.post('/api/prospects', async (request, response) => {
  response.set('Cache-Control', 'no-store');
  const origin = String(request.get('origin') || '').replace(/\/$/, '');
  if (origin && !allowedOrigins.has(origin)) {
    return response.status(403).json({ error: 'Origin not allowed.', code: 'origin_not_allowed' });
  }
  // Invisible field: ordinary users never fill it. Returning the same success
  // shape prevents simple form bots from learning how to bypass the trap.
  if (String(request.body?.website || '').trim()) {
    return response.status(202).json({ ok: true });
  }
  try {
    const prospect = normalizeProspectInput(request.body);
    const nowMillis = Date.now();
    cleanupProspectAttempts(nowMillis);
    const remoteAddress = request.ip || 'unknown';
    const limited = prospectRateLimited(resetAttemptKey('prospect-ip', remoteAddress), PROSPECT_IP_LIMIT, nowMillis)
      || prospectRateLimited(resetAttemptKey('prospect-email', prospect.email), PROSPECT_EMAIL_LIMIT, nowMillis);
    if (limited) {
      return response.status(429).json({ error: 'Too many requests. Try again later.', code: 'prospect_rate_limited' });
    }
    await db.collection('prospects').add({
      ...prospect,
      createdAt: FieldValue.serverTimestamp(),
      status: 'pending'
    });
    return response.status(201).json({ ok: true });
  } catch (error) {
    if (error instanceof ProspectValidationError) {
      return response.status(400).json({ error: error.message, code: 'prospect_invalid', field: error.field });
    }
    console.error('[prospect] create failed:', error?.code || error?.message || 'unknown_error');
    return response.status(503).json({ error: 'The request could not be saved.', code: 'prospect_unavailable' });
  }
});

app.get('/api/meetings', requireFirebaseUser, requireFirebaseAdmin, async (request, response) => {
  try {
    const now = Date.now();
    const from = request.query.from ? new Date(String(request.query.from)) : new Date(now - 7 * 86400_000);
    const to = request.query.to ? new Date(String(request.query.to)) : new Date(now + 360 * 86400_000);
    if (!Number.isFinite(from.getTime())
      || !Number.isFinite(to.getTime())
      || to <= from
      || to.getTime() - from.getTime() > MAX_MEETING_RANGE_DAYS * 86400_000) {
      return response.status(400).json({
        error: `Meeting range must be valid and no longer than ${MAX_MEETING_RANGE_DAYS} days.`,
        code: 'invalid_meeting_range'
      });
    }
    const requestedUserId = request.query.userId ? String(request.query.userId) : null;
    if (requestedUserId && !/^[A-Za-z0-9:_-]{1,128}$/.test(requestedUserId)) {
      return response.status(400).json({ error: 'Invalid userId.', code: 'invalid_user_id' });
    }
    const snapshot = await db.collection('meetings')
      .where('startAt', '>=', Timestamp.fromDate(from))
      .where('startAt', '<=', Timestamp.fromDate(to))
      .orderBy('startAt', 'asc')
      .limit(250)
      .get();
    const meetings = snapshot.docs
      .filter(document => !requestedUserId || document.data().userId === requestedUserId)
      .map(document => serializeMeeting(document.id, document.data()));
    return response.json({ meetings });
  } catch (error) {
    console.error('Meeting list failed:', error);
    return response.status(500).json({ error: 'Unable to load meetings.', code: 'meeting_list_failed' });
  }
});

app.post('/api/meetings', requireFirebaseUser, requireFirebaseAdmin, async (request, response) => {
  try {
    const normalized = normalizeMeetingInput(request.body);
    const idempotencyKey = normalizedIdempotencyKey(
      request.get('idempotency-key') || request.body?.idempotencyKey
    );
    const meetingId = meetingIdForRequest(request.firebaseUser.uid, idempotencyKey);
    const fingerprint = meetingRequestFingerprint(normalized);
    const meetingRef = db.collection('meetings').doc(meetingId);
    const memberRef = db.collection('members').doc(normalized.userId);
    const result = await db.runTransaction(async transaction => {
      const [memberSnapshot, meetingSnapshot] = await Promise.all([
        transaction.get(memberRef),
        transaction.get(meetingRef)
      ]);
      if (!memberSnapshot.exists) return { kind: 'missing_member' };
      const member = memberSnapshot.data();
      if (member.isDeactivated === true) return { kind: 'deactivated_member' };
      if (['admin', 'root'].includes(String(member.role || '').toLowerCase())
        || SUPER_ADMIN_EMAILS.has(String(member.email || '').toLowerCase())) {
        return { kind: 'invalid_member' };
      }
      const clientEmail = normalizedEmail(member.email);
      if (!clientEmail) return { kind: 'invalid_member_email' };

      if (meetingSnapshot.exists) {
        const existing = meetingSnapshot.data();
        if (existing.requestFingerprint !== fingerprint) return { kind: 'idempotency_conflict' };
        return { kind: 'existing', meeting: existing };
      }

      const now = FieldValue.serverTimestamp();
      const meeting = {
        userId: normalized.userId,
        clientName: safePlainText(member.name || member.company || 'Elysium client', 'clientName', 160, { required: true }),
        clientEmail,
        clientRegion: normalized.clientRegion,
        clientTimeZone: normalized.clientTimeZone,
        adminTimeZone: normalized.adminTimeZone,
        title: normalized.title,
        notes: normalized.notes,
        meetingUrl: normalized.meetingUrl,
        localDate: normalized.date,
        localTime: normalized.time,
        durationMinutes: normalized.durationMinutes,
        startAt: Timestamp.fromDate(normalized.startAt),
        endAt: Timestamp.fromDate(normalized.endAt),
        locale: normalized.locale || normalizedLocale(member.preferredLanguage),
        status: 'scheduled',
        requestFingerprint: fingerprint,
        notifications: {
          confirmation: {
            status: 'pending',
            attemptCount: 0,
            idempotencyKey: `elysium-meeting-confirmation-${meetingId}`,
            requestedAt: now
          }
        },
        audit: {
          createdByUid: request.firebaseUser.uid,
          createdByEmail: String(request.firebaseUser.email || '').toLowerCase(),
          createdAt: now,
          updatedByUid: request.firebaseUser.uid,
          updatedByEmail: String(request.firebaseUser.email || '').toLowerCase(),
          updatedAt: now
        },
        createdAt: now,
        updatedAt: now
      };
      transaction.create(meetingRef, meeting);
      transaction.set(db.collection('activities').doc(`meeting_created_${meetingId}`), {
        memberId: normalized.userId,
        memberName: meeting.clientName,
        type: 'meeting_created',
        payload: {
          meetingId,
          title: normalized.title,
          startAt: meeting.startAt,
          adminTimeZone: normalized.adminTimeZone,
          clientTimeZone: normalized.clientTimeZone
        },
        actorUid: request.firebaseUser.uid,
        actorEmail: String(request.firebaseUser.email || '').toLowerCase(),
        actorRole: 'admin',
        createdAt: now
      }, { merge: true });
      return { kind: 'created', meeting };
    });

    if (result.kind === 'missing_member') {
      return response.status(404).json({ error: 'Client profile not found.', code: 'member_not_found' });
    }
    if (result.kind === 'deactivated_member') {
      return response.status(409).json({ error: 'This client account is deactivated.', code: 'member_deactivated' });
    }
    if (result.kind === 'invalid_member' || result.kind === 'invalid_member_email') {
      return response.status(400).json({ error: 'The selected record is not an eligible client.', code: result.kind });
    }
    if (result.kind === 'idempotency_conflict') {
      return response.status(409).json({
        error: 'This idempotency key was already used for a different meeting.',
        code: 'idempotency_conflict'
      });
    }

    // El envío va antes de responder para que el CRM diga si el correo salió
    // de verdad, en vez de un «pending» eterno que no significaba nada.
    const emailStatus = await dispatchMeetingEmail(meetingId, 'confirmation');
    const persisted = await meetingRef.get();
    const status = result.kind === 'created' ? 201 : 200;
    return response.status(status).json({
      meeting: serializeMeeting(meetingId, persisted.data()),
      emailStatus,
      idempotent: result.kind === 'existing'
    });
  } catch (error) {
    if (error instanceof MeetingValidationError) {
      return response.status(400).json({ error: error.message, code: error.code, field: error.field });
    }
    console.error('Meeting creation failed:', error);
    return response.status(500).json({ error: 'Unable to schedule meeting.', code: 'meeting_create_failed' });
  }
});

app.post('/api/meetings/:meetingId/cancel', requireFirebaseUser, requireFirebaseAdmin, async (request, response) => {
  try {
    const meetingId = String(request.params.meetingId || '');
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(meetingId)) {
      return response.status(400).json({ error: 'Invalid meeting ID.', code: 'invalid_meeting_id' });
    }
    const reason = safePlainText(request.body?.reason, 'reason', 500);
    const meetingRef = db.collection('meetings').doc(meetingId);
    const result = await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(meetingRef);
      if (!snapshot.exists) return { kind: 'missing' };
      const meeting = snapshot.data();
      if (meeting.status === 'cancelled') return { kind: 'existing', meeting };
      if (meeting.status !== 'scheduled') return { kind: 'invalid_status', meeting };
      const now = FieldValue.serverTimestamp();
      transaction.update(meetingRef, {
        status: 'cancelled',
        cancellationReason: reason || null,
        cancelledAt: now,
        cancelledByUid: request.firebaseUser.uid,
        cancelledByEmail: String(request.firebaseUser.email || '').toLowerCase(),
        'notifications.cancellation': {
          status: 'pending',
          attemptCount: 0,
          idempotencyKey: `elysium-meeting-cancellation-${meetingId}`,
          requestedAt: now
        },
        'audit.updatedByUid': request.firebaseUser.uid,
        'audit.updatedByEmail': String(request.firebaseUser.email || '').toLowerCase(),
        'audit.updatedAt': now,
        updatedAt: now
      });
      transaction.set(db.collection('activities').doc(`meeting_cancelled_${meetingId}`), {
        memberId: meeting.userId,
        memberName: meeting.clientName || null,
        type: 'meeting_cancelled',
        payload: { meetingId, title: meeting.title, reason: reason || null },
        actorUid: request.firebaseUser.uid,
        actorEmail: String(request.firebaseUser.email || '').toLowerCase(),
        actorRole: 'admin',
        createdAt: now
      }, { merge: true });
      return { kind: 'cancelled', meeting: { ...meeting, status: 'cancelled' } };
    });
    if (result.kind === 'missing') {
      return response.status(404).json({ error: 'Meeting not found.', code: 'meeting_not_found' });
    }
    if (result.kind === 'invalid_status') {
      return response.status(409).json({ error: 'Only scheduled meetings can be cancelled.', code: 'invalid_meeting_status' });
    }

    // Cancelar también avisa al cliente y retira la entrada de calendario.
    const emailStatus = await dispatchMeetingEmail(meetingId, 'cancellation');
    const persisted = await meetingRef.get();
    return response.status(200).json({
      meeting: serializeMeeting(meetingId, persisted.data()),
      emailStatus,
      idempotent: result.kind === 'existing'
    });
  } catch (error) {
    if (error instanceof MeetingValidationError) {
      return response.status(400).json({ error: error.message, code: error.code, field: error.field });
    }
    console.error('Meeting cancellation failed:', error);
    return response.status(500).json({ error: 'Unable to cancel meeting.', code: 'meeting_cancel_failed' });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   Correo redactado desde el CRM

   La regla que gobierna todo este bloque: **el remitente lo decide el
   servidor**. El navegador manda una dirección, pero sólo sirve para elegir de
   una lista cerrada que vive aquí. Si se aceptara el `from` tal cual, cualquiera
   con una sesión iniciada podría enviar correo firmado como Elysium.

   IONOS sólo deja enviar como el buzón autenticado o un alias suyo, así que
   cada remitente puede traer sus propias credenciales SMTP. Cuando no las trae
   y no es el buzón por defecto, la petición se rechaza con un mensaje que dice
   qué variable falta: es preferible a enviar en silencio desde otra dirección.
   ─────────────────────────────────────────────────────────────────────────── */

const MAIL_MAX_ATTACHMENTS = 10;
const MAIL_MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAIL_MAX_TOTAL_ATTACHMENT_BYTES = 12 * 1024 * 1024;
const MAIL_MAX_HTML_BYTES = 1024 * 1024;

/** `daniel.morales@elysiumdr.eu` → `DANIEL_MORALES`, el sufijo de sus variables. */
function senderEnvSuffix(address) {
  return String(address || '').split('@')[0].toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

/**
 * Los remitentes que el CRM puede usar. `CRM_MAIL_SENDERS` acepta la forma
 * `Nombre <correo>` separada por comas; si no está definida, se usa el buzón de
 * `MEETING_FROM_EMAIL`, que es el que ya envía la agenda.
 */
function mailSenders() {
  const configured = String(process.env.CRM_MAIL_SENDERS || process.env.MEETING_FROM_EMAIL || '')
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

  const defaultSmtp = smtpConfig();
  const defaultUser = defaultSmtp.user.toLowerCase();
  const seen = new Set();
  const senders = [];

  for (const entry of configured) {
    const address = normalizedEmail(extractEmailAddress(entry));
    if (!address || seen.has(address)) continue;
    seen.add(address);

    const nameMatch = entry.match(/^\s*"?([^"<]+?)"?\s*</);
    const suffix = senderEnvSuffix(address);
    const ownUser = String(process.env[`SMTP_USER_${suffix}`] || '').trim();
    const ownPass = String(process.env[`SMTP_PASSWORD_${suffix}`] || '');
    const isDefaultMailbox = address === defaultUser;
    const ownMailboxReady = Boolean(defaultSmtp.host && ownUser && ownPass);
    const defaultMailboxReady = Boolean(
      defaultSmtp.host && defaultSmtp.user && defaultSmtp.pass && isDefaultMailbox
    );

    senders.push({
      address,
      name: (nameMatch?.[1] || '').trim() || 'Elysium',
      // Credenciales propias, o las del buzón por defecto cuando es él mismo.
      auth: ownMailboxReady
        ? { user: ownUser, pass: ownPass }
        : (isDefaultMailbox ? null : undefined),
      ready: ownMailboxReady || defaultMailboxReady,
      envSuffix: suffix
    });
  }
  return senders;
}

function findMailSender(address) {
  const wanted = normalizedEmail(address);
  return wanted ? mailSenders().find(sender => sender.address === wanted) || null : null;
}

/**
 * Transporte para un remitente concreto. `auth === null` significa «el buzón por
 * defecto», que ya tiene su transporte compartido con pool; el resto abre el
 * suyo y se cachea por usuario para no reconectar en cada envío.
 */
const senderTransports = new Map();
function transportForSender(sender) {
  if (!sender?.auth) return emailTransport();
  const cached = senderTransports.get(sender.auth.user);
  if (cached) return cached;

  const { host, port } = smtpConfig();
  if (!host) return null;
  const nodemailer = require('nodemailer');
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: sender.auth.user, pass: sender.auth.pass },
    pool: true,
    maxConnections: 2,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000
  });
  senderTransports.set(sender.auth.user, transport);
  return transport;
}

/** Versión de texto plano a partir del HTML, para la parte `text/plain`. */
function htmlToPlainText(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&middot;/gi, '·')
    .replace(/&lambda;/gi, 'λ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Quita rutas y caracteres de control del nombre que llega del navegador. */
function safeAttachmentName(value, index) {
  const base = String(value || '')
    .split(/[\\/]/).pop()
    // Se retiran los caracteres de control y los que rompen un nombre de
    // archivo o una cabecera MIME.
    .replace(/[\x00-\x1f<>:"|?*]/g, '')
    .trim()
    .slice(0, 120);
  return base || `adjunto-${index + 1}`;
}

class MailValidationError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.name = 'MailValidationError';
    this.code = code;
    this.status = status;
  }
}

function validateMailAttachments(rawAttachments) {
  if (rawAttachments == null) return [];
  if (!Array.isArray(rawAttachments)) {
    throw new MailValidationError('Attachments must be a list.', 'attachments_invalid');
  }
  if (rawAttachments.length > MAIL_MAX_ATTACHMENTS) {
    throw new MailValidationError(
      `Up to ${MAIL_MAX_ATTACHMENTS} attachments per message.`, 'attachments_too_many');
  }

  let total = 0;
  return rawAttachments.map((attachment, index) => {
    const content = String(attachment?.content || '').trim();
    const paddingIndex = content.indexOf('=');
    const padding = paddingIndex === -1 ? '' : content.slice(paddingIndex);
    if (!content || content.startsWith('data:') || content.length % 4 !== 0
      || /[^A-Za-z0-9+/=]/.test(content)
      || paddingIndex !== -1 && !/^={1,2}$/.test(padding)) {
      throw new MailValidationError('An attachment has invalid base64 content.', 'attachment_invalid');
    }
    const buffer = Buffer.from(content, 'base64');
    if (!buffer.length || buffer.toString('base64') !== content) {
      throw new MailValidationError('An attachment arrived empty.', 'attachment_empty');
    }
    const bytes = buffer.length;
    if (bytes > MAIL_MAX_ATTACHMENT_BYTES) {
      throw new MailValidationError(
        `"${safeAttachmentName(attachment?.filename, index)}" exceeds the ${
          Math.round(MAIL_MAX_ATTACHMENT_BYTES / 1024 / 1024)} MB limit per file.`,
        'attachment_too_large');
    }
    total += bytes;
    if (total > MAIL_MAX_TOTAL_ATTACHMENT_BYTES) {
      throw new MailValidationError(
        `The attachments add up to more than ${
          Math.round(MAIL_MAX_TOTAL_ATTACHMENT_BYTES / 1024 / 1024)} MB.`,
        'attachments_too_large');
    }
    const requestedType = String(attachment?.contentType || 'application/octet-stream').trim();
    if (!/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(requestedType)) {
      throw new MailValidationError('An attachment has an invalid content type.', 'attachment_type_invalid');
    }
    return {
      filename: safeAttachmentName(attachment?.filename, index),
      content,
      contentType: requestedType.slice(0, 120),
      bytes,
      sha256: crypto.createHash('sha256').update(buffer).digest('hex')
    };
  });
}

const CRM_MAIL_DELIVERY_LEASE_MS = 2 * 60 * 1000;

function crmMailIdempotencyKey(request) {
  const value = String(request.get('idempotency-key') || '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{15,199}$/.test(value)) {
    throw new MailValidationError(
      'A valid Idempotency-Key header is required.', 'idempotency_key_invalid');
  }
  return value;
}

function crmMailFingerprint({ actorUid, from, recipients, replyTo, subject, html, attachments }) {
  return crypto.createHash('sha256').update(JSON.stringify({
    actorUid,
    from,
    recipients,
    replyTo: replyTo || null,
    subject,
    htmlSha256: crypto.createHash('sha256').update(html).digest('hex'),
    attachments: attachments.map(item => ({
      filename: item.filename,
      contentType: item.contentType,
      bytes: item.bytes,
      sha256: item.sha256
    }))
  })).digest('hex');
}

function crmMailDeliveryRef(actorUid, idempotencyKey) {
  const documentId = crypto.createHash('sha256')
    .update(`${actorUid}:${idempotencyKey}`)
    .digest('hex');
  return db.collection('crm_mail_deliveries').doc(documentId);
}

async function claimCrmMailDelivery({ actorUid, actorEmail, idempotencyKey, fingerprint, from, recipients }) {
  const reference = crmMailDeliveryRef(actorUid, idempotencyKey);
  const nowMillis = Date.now();
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(reference);
    const current = snapshot.exists ? snapshot.data() : {};
    if (current.fingerprint && current.fingerprint !== fingerprint) {
      throw new MailValidationError(
        'That Idempotency-Key was already used for a different message.',
        'idempotency_conflict', 409);
    }
    if (current.status === 'sent') {
      return { kind: 'replay', reference, delivery: current };
    }
    if (current.status === 'sending' && timestampMillis(current.leaseUntil) > nowMillis) {
      throw new MailValidationError(
        'This message is already being delivered. Wait a moment before checking again.',
        'mail_in_progress', 409);
    }
    const deliveries = Array.isArray(current.deliveries) ? current.deliveries : [];
    const attemptId = crypto.randomUUID();
    const claim = {
      fingerprint,
      idempotencyKey,
      actorUid,
      actorEmail,
      from,
      recipients,
      status: 'sending',
      attemptId,
      deliveries,
      adminReceiptStatus: current.adminReceiptStatus || 'pending',
      attemptCount: Number(current.attemptCount || 0) + 1,
      leaseUntil: Timestamp.fromMillis(nowMillis + CRM_MAIL_DELIVERY_LEASE_MS),
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: current.createdAt || FieldValue.serverTimestamp()
    };
    transaction.set(reference, claim, { merge: true });
    return { kind: 'claimed', reference, delivery: { ...current, ...claim } };
  });
}

function crmMailClaimLost() {
  return new MailValidationError(
    'This delivery was resumed by another request. Check its status before retrying.',
    'idempotency_lease_lost',
    409
  );
}

async function updateCrmMailClaim(claim, changes, { renewLease = true } = {}) {
  if (claim?.kind !== 'claimed' || !claim.reference || !claim.delivery?.attemptId) {
    throw crmMailClaimLost();
  }
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(claim.reference);
    const current = snapshot.exists ? snapshot.data() : {};
    if (current.status !== 'sending'
      || current.fingerprint !== claim.delivery.fingerprint
      || current.attemptId !== claim.delivery.attemptId) {
      throw crmMailClaimLost();
    }
    const patch = {
      ...changes,
      updatedAt: FieldValue.serverTimestamp()
    };
    if (renewLease) {
      patch.leaseUntil = Timestamp.fromMillis(Date.now() + CRM_MAIL_DELIVERY_LEASE_MS);
    }
    transaction.set(claim.reference, patch, { merge: true });
    return { ...current, ...patch };
  });
}

const CRM_RECEIPT_COPY = {
  en: {
    eyebrow: 'CRM DELIVERY RECEIPT', title: 'Email sent successfully', intro: 'The recipient server accepted this message.',
    actor: 'Sent by', from: 'From', to: 'To', subject: 'Subject', date: 'Accepted at', files: 'Attachments',
    copy: 'Plain-text copy of the sent message', none: 'No attachments', htmlAttachment: 'The original HTML is attached as a safe text file.',
    subjectPrefix: 'Delivery confirmation'
  },
  es: {
    eyebrow: 'CONFIRMACIÓN DEL CRM', title: 'Correo enviado correctamente', intro: 'El servidor del destinatario aceptó este mensaje.',
    actor: 'Enviado por', from: 'De', to: 'Para', subject: 'Asunto', date: 'Aceptado el', files: 'Adjuntos',
    copy: 'Copia en texto del correo enviado', none: 'Sin adjuntos', htmlAttachment: 'El HTML original va adjunto como archivo de texto seguro.',
    subjectPrefix: 'Confirmación de envío'
  },
  pt: {
    eyebrow: 'CONFIRMAÇÃO DO CRM', title: 'Email enviado com sucesso', intro: 'O servidor do destinatário aceitou esta mensagem.',
    actor: 'Enviado por', from: 'De', to: 'Para', subject: 'Assunto', date: 'Aceite em', files: 'Anexos',
    copy: 'Cópia em texto do email enviado', none: 'Sem anexos', htmlAttachment: 'O HTML original segue anexo como ficheiro de texto seguro.',
    subjectPrefix: 'Confirmação de envio'
  }
};

function crmMailReceiptPayload({ sender, actorEmail, recipients, subject, html, text, attachments, sentAt, locale }) {
  const copy = CRM_RECEIPT_COPY[normalizedLocale(locale)] || CRM_RECEIPT_COPY.es;
  const attachmentSummary = attachments.length
    ? attachments.map(item => `${escapeHtml(item.filename)} · ${escapeHtml(item.contentType)} · ${item.bytes} B`).join('<br>')
    : escapeHtml(copy.none);
  const row = (label, value) => `<tr><td style="padding:10px 0;color:#6b7e8e;font-size:13px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:10px 0;color:#18334b;font-size:13px;font-weight:600;text-align:right;vertical-align:top">${value}</td></tr>`;
  const safeText = String(text || '').slice(0, 100_000);
  const content = `
    <p style="margin:0 0 10px;color:#2997ff;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">${escapeHtml(copy.eyebrow)}</p>
    <h1 class="title text-main" style="margin:0 0 12px;color:#173e62;font-size:28px;line-height:1.22">${escapeHtml(copy.title)}</h1>
    <p class="text-muted" style="margin:0 0 28px;color:#526b7d;font-size:15px;line-height:1.65">${escapeHtml(copy.intro)}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse">
      ${row(copy.actor, escapeHtml(actorEmail || '—'))}
      ${row(copy.from, escapeHtml(sender.address))}
      ${row(copy.to, escapeHtml(recipients.join(', ')))}
      ${row(copy.subject, escapeHtml(subject))}
      ${row(copy.date, escapeHtml(sentAt.toISOString()))}
      ${row(copy.files, attachmentSummary)}
    </table>
    <div style="margin-top:26px;padding:20px;border-radius:18px;background:#f4f8fb">
      <strong style="display:block;margin-bottom:10px;color:#173e62;font-size:13px">${escapeHtml(copy.copy)}</strong>
      <pre style="margin:0;color:#526b7d;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word">${escapeHtml(safeText)}</pre>
    </div>
    <p style="margin:16px 0 0;color:#748797;font-size:11px;line-height:1.5">${escapeHtml(copy.htmlAttachment)}</p>`;
  return {
    from: `${sender.name} <${sender.address}>`,
    to: [adminNotificationEmail()],
    subject: `${copy.subjectPrefix} · ${subject}`.slice(0, 250),
    html: emailTheme(content, `${copy.subjectPrefix}: ${subject}`),
    text: [copy.title, `${copy.actor}: ${actorEmail || '—'}`, `${copy.from}: ${sender.address}`,
      `${copy.to}: ${recipients.join(', ')}`, `${copy.subject}: ${subject}`, `${copy.date}: ${sentAt.toISOString()}`,
      `${copy.files}: ${attachments.length ? attachments.map(item => item.filename).join(', ') : copy.none}`,
      '', copy.copy, safeText].join('\n'),
    attachments: [{
      filename: 'mensaje-enviado.html.txt',
      content: Buffer.from(html, 'utf8').toString('base64'),
      contentType: 'text/plain'
    }]
  };
}

app.get('/api/mail/senders', requireFirebaseUser, requireFirebaseAdmin, (_request, response) => {
  response.json({
    senders: mailSenders().map(({ address, name, ready, envSuffix }) => ({
      address, name, ready, envSuffix
    }))
  });
});

app.post(
  '/api/mail/send',
  requireFirebaseUser,
  requireFirebaseAdmin,
  express.json({ limit: '20mb' }),
  async (request, response) => {
    let deliveryClaim = null;
    try {
      const body = request.body || {};

      const sender = findMailSender(body.from);
      if (!sender) {
        return response.status(400).json({
          error: 'That sender is not on the allowlist.', code: 'sender_not_allowed'
        });
      }
      if (!sender.ready) {
        return response.status(503).json({
          error: `No SMTP credentials for ${sender.address}. Set SMTP_USER_${
            sender.envSuffix} and SMTP_PASSWORD_${sender.envSuffix} on the service.`,
          code: 'sender_not_configured'
        });
      }

      const rawRecipients = Array.isArray(body.to) ? body.to : [body.to];
      const normalizedRecipients = rawRecipients.map(normalizedEmail);
      if (!rawRecipients.length || normalizedRecipients.some(address => !address)) {
        return response.status(400).json({ error: 'A valid recipient is required.', code: 'to_invalid' });
      }
      const recipients = [...new Set(normalizedRecipients)];
      if (recipients.length > 20) {
        return response.status(400).json({ error: 'Up to 20 recipients per message.', code: 'to_too_many' });
      }

      const subject = String(body.subject || '').trim().slice(0, 250);
      if (!subject) {
        return response.status(400).json({ error: 'A subject is required.', code: 'subject_missing' });
      }

      const html = String(body.html || '');
      if (!html.trim()) {
        return response.status(400).json({ error: 'The message body is empty.', code: 'html_missing' });
      }
      if (Buffer.byteLength(html, 'utf8') > MAIL_MAX_HTML_BYTES) {
        return response.status(400).json({ error: 'The HTML body is too large.', code: 'html_too_large' });
      }

      const attachments = validateMailAttachments(body.attachments);
      const replyTo = body.replyTo ? normalizedEmail(body.replyTo) : null;
      if (body.replyTo && !replyTo) {
        return response.status(400).json({ error: 'Reply-To is invalid.', code: 'reply_to_invalid' });
      }
      const text = String(body.text || '').trim() || htmlToPlainText(html);
      const sealedHtml = withElysiumSeal(html);
      const idempotencyKey = crmMailIdempotencyKey(request);
      const fingerprint = crmMailFingerprint({
        actorUid: request.firebaseUser.uid,
        from: sender.address,
        recipients,
        replyTo,
        subject,
        html,
        attachments
      });
      const claim = await claimCrmMailDelivery({
        actorUid: request.firebaseUser.uid,
        actorEmail: request.firebaseUser.email,
        idempotencyKey,
        fingerprint,
        from: sender.address,
        recipients
      });
      deliveryClaim = claim;
      if (claim.kind === 'replay') {
        const previous = Array.isArray(claim.delivery.deliveries) ? claim.delivery.deliveries : [];
        return response.status(200).json({
          ok: true,
          idempotent: true,
          messageId: previous[0]?.messageId || null,
          messageIds: previous.map(item => item.messageId),
          recipients: previous.map(item => item.recipient),
          adminReceiptStatus: claim.delivery.adminReceiptStatus || 'unknown'
        });
      }

      const transport = transportForSender(sender);
      const previousDeliveries = Array.isArray(claim.delivery.deliveries) ? claim.delivery.deliveries : [];
      const deliveredByRecipient = new Map(previousDeliveries.map(item => [item.recipient, item]));
      for (const [index, recipient] of recipients.entries()) {
        if (deliveredByRecipient.has(recipient)) continue;
        // The lease is renewed before every external SMTP call. A batch may
        // contain 20 recipients, so a single fixed lease would expire while a
        // valid request was still working and allow a concurrent retry to send
        // the same message again.
        await updateCrmMailClaim(claim, {});
        const sent = await sendEmail({
          from: `${sender.name} <${sender.address}>`,
          to: [recipient],
          subject,
          html: sealedHtml,
          text,
          replyTo: replyTo || undefined,
          attachments
        }, `${idempotencyKey}-recipient-${index + 1}`, transport);
        const delivery = { recipient, messageId: sent.id };
        deliveredByRecipient.set(recipient, delivery);
        await updateCrmMailClaim(claim, {
          deliveries: FieldValue.arrayUnion(delivery)
        });
      }

      const deliveries = recipients.map(recipient => deliveredByRecipient.get(recipient)).filter(Boolean);
      const sentAt = new Date();
      let adminReceiptStatus = claim.delivery.adminReceiptStatus === 'sent' ? 'sent' : 'not_configured';
      let adminReceiptMessageId = claim.delivery.adminReceiptMessageId || null;
      if (adminNotificationEmail() && adminReceiptStatus !== 'sent') {
        try {
          await updateCrmMailClaim(claim, {});
          const receipt = await sendEmail(crmMailReceiptPayload({
            sender,
            actorEmail: request.firebaseUser.email,
            recipients,
            subject,
            html,
            text,
            attachments,
            sentAt,
            locale: body.locale
          }), `${idempotencyKey}-admin-receipt`, transport);
          adminReceiptStatus = 'sent';
          adminReceiptMessageId = receipt.id;
          await updateCrmMailClaim(claim, { adminReceiptStatus, adminReceiptMessageId });
        } catch (receiptError) {
          adminReceiptStatus = 'failed';
          await updateCrmMailClaim(claim, {
            adminReceiptStatus,
            adminReceiptMessageId: null
          }).catch(auditError => {
            console.error('[crm-mail] could not persist receipt failure:', auditError?.message || auditError);
          });
          console.error('[crm-mail] admin receipt failed:', receiptError?.code || receiptError?.message || 'unknown_error');
        }
      }

      await updateCrmMailClaim(claim, {
        status: 'sent',
        deliveries,
        adminReceiptStatus,
        adminReceiptMessageId,
        sentAt: FieldValue.serverTimestamp(),
        leaseUntil: null,
        attemptId: null
      }, { renewLease: false });

      // Rastro de auditoría: quién envió, desde qué dirección y a quién. Este
      // extremo puede firmar correo como la empresa; sin registro no habría
      // forma de reconstruir un envío indebido.
      console.log('[crm-mail] sent', JSON.stringify({
        actor: request.firebaseUser.email,
        from: sender.address,
        to: recipients,
        subject,
        attachments: attachments.length,
        messageIds: deliveries.map(item => item.messageId),
        adminReceiptStatus
      }));

      return response.status(200).json({
        ok: true,
        idempotent: false,
        messageId: deliveries[0]?.messageId || null,
        messageIds: deliveries.map(item => item.messageId),
        recipients,
        adminReceiptStatus
      });
    } catch (error) {
      if (deliveryClaim?.kind === 'claimed') {
        await updateCrmMailClaim(deliveryClaim, {
          status: 'failed',
          leaseUntil: null,
          attemptId: null,
          lastError: error?.code || 'mail_send_failed',
          failedAt: FieldValue.serverTimestamp()
        }, { renewLease: false }).catch(auditError => {
          console.error('[crm-mail] could not persist failure:', auditError?.message || auditError);
        });
      }
      if (error instanceof MailValidationError) {
        return response.status(error.status || 400).json({ error: error.message, code: error.code });
      }
      if (error?.code === 'email_not_configured') {
        return response.status(503).json({
          error: 'Email delivery is not configured on the service.', code: 'email_not_configured'
        });
      }
      console.error('[crm-mail] send failed:', error);
      // El texto del servidor SMTP dice cosas accionables ("relay denied",
      // "authentication failed"): se pasa tal cual al administrador.
      return response.status(502).json({
        error: error?.response || error?.message || 'The mail server rejected the message.',
        code: 'mail_send_failed'
      });
    }
  }
);

app.get(['/health', '/api/health', '/api/billing/health'], (_request, response) => {
  response.json({ ok: true, service: 'elysium-platform-api' });
});

if (require.main === module) {
  app.listen(PORT, error => {
    if (error) {
      console.error('Unable to start Elysium billing service:', error);
      process.exitCode = 1;
      return;
    }
    console.log(`Elysium platform service listening on port ${PORT}`);
  });
}

module.exports = {
  app,
  MeetingValidationError,
  deliverMeetingNotification,
  dispatchMeetingEmail,
  isFirebaseAdmin,
  normalizedEmail,
  normalizedLocale,
  validateIanaTimeZone,
  resolveZonedLocalDateTime,
  normalizeMeetingInput,
  normalizedIdempotencyKey,
  meetingIdForRequest,
  meetingRequestFingerprint,
  formattedZonedDate,
  escapeHtml,
  buildMeetingEmail,
  buildMeetingAdminEmail,
  emailTheme,
  withElysiumSeal,
  elysiumSealAttachment,
  adminNotificationEmail,
  buildMeetingIcs,
  meetingEmailPayload,
  sendEmail,
  smtpConfig,
  serializeMeeting,
  passwordResetRateLimited,
  passwordResetEmail,
  passwordResetEmailConfigured,
  passwordResetContinueUrl,
  ProspectValidationError,
  normalizeProspectInput,
  prospectRateLimited,
  MailValidationError,
  mailSenders,
  findMailSender,
  validateMailAttachments,
  safeAttachmentName,
  htmlToPlainText,
  crmMailIdempotencyKey,
  crmMailFingerprint,
  crmMailReceiptPayload
};
