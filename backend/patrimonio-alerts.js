'use strict';

/**
 * Alertas por correo de Elysium Patrimonio (`/Gestor-Patrimonios/`).
 *
 * El contenido de cada correo lo calcula el servidor con los datos de la
 * persona, leídos con Admin SDK, y con el mismo modelo que usa la app
 * (`patrimonio-core/model.js`, copia generada de `Gestor-Patrimonios/js`):
 * lo que dice el correo es lo que se ve en pantalla. La app nunca manda texto,
 * solo el aviso de que hubo un cambio.
 *
 * Rutas:
 * - POST /api/patrimonio/alerts/check   la app, tras guardar un movimiento.
 *   Envía las alertas «inmediatas» nuevas (presupuesto al 80/100 %, tarjeta
 *   cerca del límite).
 * - POST /api/patrimonio/alerts/run     Cloud Scheduler, cada mañana a las 7
 *   (hora de Costa Rica). Resumen de la mañana con lo pendiente, resumen
 *   semanal los lunes e informe del mes el día en que empieza el período.
 * - POST /api/patrimonio/access-request aviso al administrador de que alguien
 *   pidió acceso (la solicitud ya está en Firestore; esto solo avisa).
 *
 * Cada correo tiene una clave (`budget:comida:2026-09:80`, `weekly:2026-W39`)
 * que se reclama en `patrimonio/{uid}/email_log/{clave}` con `create()` antes
 * de enviar: aunque dos instancias corran a la vez, sale una sola vez.
 *
 * Todo el texto va en español de Costa Rica y de usted.
 */

const crypto = require('node:crypto');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const express = require('express');

const APP_URL = 'https://elysiumdr.eu/Gestor-Patrimonios/';
const DATA_COLLECTIONS = ['accounts', 'categories', 'transactions', 'budgets', 'goals', 'contributions', 'recurring', 'debts'];
const CHECK_MIN_INTERVAL_MS = 20_000;
/** Licencias que se leen de una vez; las siguientes páginas se piden a continuación. */
const USERS_PAGE_SIZE = 200;
/** Tope de seguridad de una pasada: por encima de esto algo va mal, no hay tanta gente con licencia. */
const MAX_USERS_PER_RUN = 5000;
const MEMORY_TTL_MS = 60 * 60_000;

let corePromise = null;
function loadCore() {
  if (!corePromise) {
    const load = file => import(pathToFileURL(path.join(__dirname, 'patrimonio-core', file)).href);
    corePromise = Promise.all([
      load('model.js'),
      load('core/money.js'),
      load('core/dates.js')
    ]).then(([model, money, dates]) => ({ ...model, ...money, ...dates }));
  }
  return corePromise;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeKey(key) {
  // Los ids de documento no admiten «/»; el resto de la clave se conserva legible.
  return String(key).replace(/\//g, '_').slice(0, 400);
}

/* ── Datos ─────────────────────────────────────────────────────────────────── */

/** Solo el perfil: permite descartar un aviso sin leer todos sus movimientos. */
async function loadProfile(db, uid) {
  const snap = await db.collection('patrimonio').doc(uid).get();
  return snap.exists ? { id: uid, ...snap.data() } : null;
}

/** Guarda una marca de tiempo por clave y olvida las de más de una hora, para que los mapas no crezcan sin fin. */
function remember(map, key, at = Date.now()) {
  map.set(key, at);
  if (map.size > 500) {
    for (const [known, when] of map) if (at - when > MEMORY_TTL_MS) map.delete(known);
  }
}

/**
 * Lee todo lo que el modelo necesita de una persona y lo presenta como un
 * almacén. Con `profile` (ya leído) no se pide otra vez.
 */
async function loadUserStore(db, uid, profile = undefined) {
  const base = db.collection('patrimonio').doc(uid);
  const [profileSnap, ...snapshots] = await Promise.all([
    profile === undefined ? base.get() : Promise.resolve(null),
    ...DATA_COLLECTIONS.map(name => base.collection(name).get())
  ]);
  const data = Object.fromEntries(DATA_COLLECTIONS.map((name, index) => [
    name,
    snapshots[index].docs.map(doc => ({ id: doc.id, ...doc.data() }))
  ]));
  return {
    mode: 'server',
    version: 0,
    profile: profile !== undefined ? profile : (profileSnap.exists ? { id: uid, ...profileSnap.data() } : null),
    list: name => data[name] || []
  };
}

/** Reclama una clave de correo. Devuelve false si ya se envió (o se está enviando). */
async function claim(db, uid, key, meta) {
  try {
    await db.collection('patrimonio').doc(uid).collection('email_log').doc(safeKey(key))
      .create({ status: 'sending', claimedAt: new Date(), ...meta });
    return true;
  } catch (error) {
    if (error?.code === 6 || /already exists/i.test(String(error?.message))) return false;
    throw error;
  }
}

async function settle(db, uid, key, status) {
  const ref = db.collection('patrimonio').doc(uid).collection('email_log').doc(safeKey(key));
  if (status === 'failed') await ref.delete().catch(() => null);
  else await ref.set({ status, sentAt: new Date() }, { merge: true });
}

async function logged(db, uid, keys) {
  if (!keys.length) return new Set();
  const refs = keys.map(key => db.collection('patrimonio').doc(uid).collection('email_log').doc(safeKey(key)));
  const snaps = await db.getAll(...refs);
  return new Set(snaps.filter(snap => snap.exists).map(snap => snap.id));
}

/* ── Correos ───────────────────────────────────────────────────────────────── */

function patrimonioShell({ eyebrow, title, intro, blocks, cta, ctaHref, preheader, emailTheme }) {
  const content = `
    <p style="margin:0 0 10px;color:#9a7719;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">${escapeHtml(eyebrow)}</p>
    <h1 class="title" style="margin:0 0 14px;color:#173e62;font-size:28px;line-height:1.2;font-weight:700">${escapeHtml(title)}</h1>
    ${intro ? `<p style="margin:0 0 24px;color:#40566b;font-size:15px;line-height:1.6">${intro}</p>` : ''}
    ${blocks.join('')}
    <table role="presentation" cellspacing="0" cellpadding="0" class="btn-group" style="margin-top:30px"><tr><td>
      <a class="btn" href="${escapeHtml(ctaHref)}" style="display:inline-block;padding:14px 26px;border-radius:14px;background:#173e62;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none">${escapeHtml(cta)}</a>
    </td></tr></table>
    <p style="margin:28px 0 0;color:#7b8b99;font-size:12px;line-height:1.6">Recibe este correo porque activó las alertas de Elysium Patrimonio. Puede elegir cuáles recibir en <a href="${APP_URL}#/ajustes" style="color:#47708f">Ajustes → Alertas y correo</a>.</p>`;
  return emailTheme(content, preheader).replace('<html lang="en">', '<html lang="es-CR">');
}

function alertRows(alerts) {
  const tone = { danger: '#c23b3b', warning: '#a86b00', info: '#1f63c0', success: '#8a6a10' };
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:separate;border-spacing:0 10px">${alerts.map(alert => `
    <tr><td style="padding:16px 18px;border-radius:16px;background:#f7f5ef;border-left:4px solid ${tone[alert.severity] || '#1f63c0'}">
      <p style="margin:0 0 4px;color:#173e62;font-size:15px;font-weight:700">${escapeHtml(alert.title)}</p>
      <p style="margin:0;color:#40566b;font-size:14px;line-height:1.55">${escapeHtml(alert.body)}</p>
    </td></tr>`).join('')}</table>`;
}

function figureRows(rows) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;margin:6px 0 10px">${rows.map(([label, value], index) => `
    <tr class="stack-mobile"><td style="padding:12px 0;${index ? 'border-top:1px solid #e7edf2;' : ''}color:#60748a;font-size:14px">${escapeHtml(label)}</td>
    <td align="right" style="padding:12px 0;${index ? 'border-top:1px solid #e7edf2;' : ''}color:#173e62;font-size:15px;font-weight:700">${escapeHtml(value)}</td></tr>`).join('')}</table>`;
}

function subheading(text) {
  return `<p style="margin:24px 0 6px;color:#9a7719;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">${escapeHtml(text)}</p>`;
}

function firstName(profile) {
  return String(profile?.displayName || '').trim().split(/\s+/)[0] || '';
}

function buildAlertsEmail({ alerts, profile, kind, emailTheme }) {
  const name = firstName(profile);
  const immediate = kind === 'immediate';
  const single = alerts.length === 1;
  const subject = immediate
    ? (single ? `Alerta: ${alerts[0].title}` : `Patrimonio: ${alerts.length} alertas nuevas`)
    : `Su resumen de la mañana: ${alerts.length} ${alerts.length === 1 ? 'aviso' : 'avisos'}`;
  const intro = immediate
    ? `${name ? `${escapeHtml(name)}, ` : ''}con su último movimiento hay algo que conviene mirar.`
    : `Buenos días${name ? `, ${escapeHtml(name)}` : ''}. Esto es lo que merece su atención hoy.`;
  const html = patrimonioShell({
    eyebrow: immediate ? 'Alerta' : 'Resumen de la mañana',
    title: immediate ? (single ? alerts[0].title : 'Nuevas alertas') : 'Para hoy',
    intro,
    blocks: [alertRows(alerts)],
    cta: 'Abrir Patrimonio',
    ctaHref: `${APP_URL}${alerts[0]?.route || '#/inicio'}`,
    preheader: alerts.map(alert => alert.title).join(' · '),
    emailTheme
  });
  const text = [
    immediate ? 'Alerta de Elysium Patrimonio' : 'Resumen de la mañana — Elysium Patrimonio',
    '',
    ...alerts.map(alert => `• ${alert.title}: ${alert.body}`),
    '',
    `Abrir: ${APP_URL}`,
    `Ajustes de alertas: ${APP_URL}#/ajustes`
  ].join('\n');
  return { subject, html, text };
}

function buildWeeklyEmail({ model, core, profile, emailTheme }) {
  const lastMonday = core.addDays(core.startOfWeek(model.today), -7);
  const lastSunday = core.addDays(lastMonday, 6);
  const { totals: weekTotals, byCategory } = weekFigures(model, core, lastMonday, lastSunday);
  const top = byCategory.slice(0, 3).map(entry => [model.catById.get(entry.categoryId)?.name || 'Sin categoría', core.formatMoney(entry.total, model.fx.base)]);
  const goals = model.goals.filter(entry => !entry.progress.done).slice(0, 3)
    .map(entry => [entry.goal.name, `${Math.round(entry.progress.pct)} % · faltan ${core.formatMoney(entry.progress.remaining, entry.goal.currency)}`]);
  const upcoming = model.upcoming.filter(item => item.rule.type === 'expense' && item.daysUntil <= 7)
    .map(item => [item.rule.name, `${core.formatMoney(item.rule.amountMinor, item.rule.currency)} · ${core.formatDate(item.date, 'short')}`]);
  const name = firstName(profile);
  const blocks = [
    figureRows([
      ['Gastó la semana pasada', core.formatMoney(weekTotals.expense, model.fx.base)],
      ['Ingresos de la semana', core.formatMoney(weekTotals.income, model.fx.base)],
      [`Ahorro de ${model.periodLabel} hasta hoy`, core.formatMoney(model.totals.net, model.fx.base)],
      ['Puede gastar por día', core.formatMoney(Math.max(0, model.spendable.perDay), model.fx.base)]
    ])
  ];
  if (top.length) blocks.push(subheading('Dónde más gastó'), figureRows(top));
  if (goals.length) blocks.push(subheading('Sus sueños'), figureRows(goals));
  if (upcoming.length) blocks.push(subheading('Pagos de esta semana'), figureRows(upcoming));
  return {
    subject: `Su semana en Patrimonio: ${core.formatMoney(weekTotals.expense, model.fx.base)} en gastos`,
    html: patrimonioShell({
      eyebrow: 'Resumen semanal',
      title: `Semana del ${core.formatDate(lastMonday, 'short')} al ${core.formatDate(lastSunday, 'short')}`,
      intro: `${name ? `${escapeHtml(name)}, así` : 'Así'} le fue la semana pasada.`,
      blocks,
      cta: 'Ver el detalle',
      ctaHref: `${APP_URL}#/reportes`,
      preheader: `Gastó ${core.formatMoney(weekTotals.expense, model.fx.base)} la semana pasada.`,
      emailTheme
    }),
    text: [
      `Resumen semanal — ${core.formatDate(lastMonday, 'short')} al ${core.formatDate(lastSunday, 'short')}`,
      `Gastos: ${core.formatMoney(weekTotals.expense, model.fx.base)} · Ingresos: ${core.formatMoney(weekTotals.income, model.fx.base)}`,
      ...top.map(([label, value]) => `• ${label}: ${value}`),
      `Abrir: ${APP_URL}#/reportes`
    ].join('\n')
  };
}

function weekFigures(model, core, start, end) {
  let income = 0;
  let expense = 0;
  const categories = new Map();
  for (const tx of model.txs) {
    if (tx.date < start || tx.date > end || tx.adjustment || (tx.type !== 'income' && tx.type !== 'expense')) continue;
    const amount = core.inBase(tx.amountMinor, tx.currency, model.fx);
    if (tx.type === 'income') income += amount;
    else {
      expense += amount;
      categories.set(tx.categoryId, (categories.get(tx.categoryId) || 0) + amount);
    }
  }
  return {
    totals: { income, expense },
    byCategory: [...categories.entries()].map(([categoryId, total]) => ({ categoryId, total })).sort((a, b) => b.total - a.total)
  };
}

function buildMonthlyEmail({ model, core, profile, emailTheme }) {
  const period = model.prevPeriod;
  const series = model.series12.find(item => item.key === period.key) || { income: 0, expense: 0, net: 0, savingsRate: 0 };
  const label = core.monthLabel(period.key, { long: true, year: true });
  const top = weekFigures(model, core, period.start, period.end).byCategory.slice(0, 4)
    .map(entry => [model.catById.get(entry.categoryId)?.name || 'Sin categoría', core.formatMoney(entry.total, model.fx.base)]);
  const goals = model.goals.slice(0, 4).map(entry => [entry.goal.name, `${Math.round(entry.progress.pct)} %`]);
  const name = firstName(profile);
  const blocks = [
    figureRows([
      ['Ingresos', core.formatMoney(series.income, model.fx.base)],
      ['Gastos', core.formatMoney(series.expense, model.fx.base)],
      ['Ahorro', core.formatMoney(series.net, model.fx.base)],
      ['Tasa de ahorro', `${Math.round(series.savingsRate)} %`],
      ['Patrimonio neto hoy', core.formatMoney(model.worth.net, model.fx.base)]
    ])
  ];
  if (top.length) blocks.push(subheading('En qué se fue'), figureRows(top));
  if (goals.length) blocks.push(subheading('Avance de sus metas'), figureRows(goals));
  return {
    subject: `Su informe de ${label}: ahorró ${core.formatMoney(series.net, model.fx.base)}`,
    html: patrimonioShell({
      eyebrow: 'Informe del mes',
      title: label.charAt(0).toUpperCase() + label.slice(1),
      intro: `${name ? `${escapeHtml(name)}, este` : 'Este'} es el cierre de su mes.`,
      blocks,
      cta: 'Ver el informe completo',
      ctaHref: `${APP_URL}#/reportes`,
      preheader: `Ingresos ${core.formatMoney(series.income, model.fx.base)} · Gastos ${core.formatMoney(series.expense, model.fx.base)}`,
      emailTheme
    }),
    text: [
      `Informe de ${label}`,
      `Ingresos: ${core.formatMoney(series.income, model.fx.base)}`,
      `Gastos: ${core.formatMoney(series.expense, model.fx.base)}`,
      `Ahorro: ${core.formatMoney(series.net, model.fx.base)} (${Math.round(series.savingsRate)} %)`,
      `Abrir: ${APP_URL}#/reportes`
    ].join('\n')
  };
}

/* ── Proceso ───────────────────────────────────────────────────────────────── */

/**
 * @param {object} deps
 * @param {object} deps.db          Firestore (Admin SDK)
 * @param {object} deps.auth        Auth (Admin SDK): getUser(uid)
 * @param {Function} deps.sendEmail (payload, idempotencyKey) → Promise
 * @param {Function} deps.emailTheme
 * @param {() => string} deps.from   remitente
 * @param {() => string|null} deps.adminEmail
 * @param {() => Date} [deps.now]
 */
function createPatrimonioService(deps) {
  const now = deps.now || (() => new Date());

  async function recipientFor(uid) {
    const user = await deps.auth.getUser(uid);
    if (!user?.email || user.emailVerified !== true || user.disabled) return null;
    return user.email;
  }

  /**
   * El «hoy» de cada persona sale de su zona horaria (Costa Rica si no eligió otra):
   * a quien vive en Madrid no se le habla del día anterior.
   */
  async function modelFor(uid, profile = undefined) {
    const core = await loadCore();
    const store = await loadUserStore(deps.db, uid, profile);
    if (!store.profile?.onboarded) return { core, store, model: null };
    return { core, store, model: core.buildModel(store, core.todayISO(now(), store.profile?.settings?.timeZone)) };
  }

  async function deliver(uid, key, to, email, meta = {}) {
    if (!(await claim(deps.db, uid, key, meta))) return 'skipped';
    try {
      await deps.sendEmail({ from: deps.from(), to: [to], subject: email.subject, html: email.html, text: email.text }, `patrimonio-${crypto.createHash('sha256').update(`${uid}:${key}`).digest('hex').slice(0, 32)}`);
      await settle(deps.db, uid, key, 'sent');
      return 'sent';
    } catch (error) {
      await settle(deps.db, uid, key, 'failed');
      throw error;
    }
  }

  /** Alertas de un tipo que aún no se enviaron. */
  async function pending(uid, alerts) {
    const already = await logged(deps.db, uid, alerts.map(alert => alert.id));
    return alerts.filter(alert => !already.has(safeKey(alert.id)));
  }

  async function checkImmediate(uid) {
    // Con el perfil basta para saber si hay algo que hacer: sin avisos inmediatos, o con los
    // dos grupos que los generan apagados, no se leen todas sus colecciones (una lectura por documento).
    const profile = await loadProfile(deps.db, uid);
    if (!profile?.onboarded) return { sent: 0, reason: 'not_onboarded' };
    const groups = profile.settings?.alerts || {};
    if (profile.settings?.email?.immediate === false || (groups.budget === false && groups.cards === false)) return { sent: 0, reason: 'disabled' };
    const { model, store } = await modelFor(uid, profile);
    if (!model) return { sent: 0, reason: 'not_onboarded' };
    const alerts = await pending(uid, model.alerts.filter(alert => alert.email === 'immediate'));
    if (!alerts.length) return { sent: 0 };
    const to = await recipientFor(uid);
    if (!to) return { sent: 0, reason: 'email_not_verified' };
    const email = buildAlertsEmail({ alerts, profile: store.profile, kind: 'immediate', emailTheme: deps.emailTheme });
    // Una sola clave por lote, más una por alerta: así ninguna se repite otro día.
    const batchKey = `immediate:${alerts.map(alert => alert.id).sort().join('|')}`;
    const outcome = await deliver(uid, batchKey, to, email, { kind: 'immediate' });
    if (outcome === 'sent') {
      await Promise.all(alerts.map(alert => claim(deps.db, uid, alert.id, { kind: 'immediate', via: batchKey })
        .then(created => created && settle(deps.db, uid, alert.id, 'sent'))));
    }
    return { sent: outcome === 'sent' ? alerts.length : 0 };
  }

  async function runForUser(uid) {
    const { model, store, core } = await modelFor(uid);
    if (!model) return { sent: 0, reason: 'not_onboarded' };
    const to = await recipientFor(uid);
    if (!to) return { sent: 0, reason: 'email_not_verified' };
    const prefs = model.settings.email || {};
    let sent = 0;

    if (prefs.daily !== false) {
      const alerts = await pending(uid, model.alerts.filter(alert => alert.email === 'daily' || alert.email === 'immediate'));
      if (alerts.length) {
        const email = buildAlertsEmail({ alerts, profile: store.profile, kind: 'daily', emailTheme: deps.emailTheme });
        if (await deliver(uid, `daily:${model.today}`, to, email, { kind: 'daily' }) === 'sent') {
          sent += 1;
          await Promise.all(alerts.map(alert => claim(deps.db, uid, alert.id, { kind: 'daily' })
            .then(created => created && settle(deps.db, uid, alert.id, 'sent'))));
        }
      }
    }
    if (prefs.weekly !== false && core.weekday(model.today) === 1) {
      const key = `weekly:${core.isoWeekKey(model.today)}`;
      if (await deliver(uid, key, to, buildWeeklyEmail({ model, core, profile: store.profile, emailTheme: deps.emailTheme }), { kind: 'weekly' }) === 'sent') sent += 1;
    }
    if (prefs.monthly !== false && model.today === model.period.start && model.txs.some(tx => tx.date >= model.prevPeriod.start && tx.date <= model.prevPeriod.end)) {
      const key = `monthly:${model.prevPeriod.key}`;
      if (await deliver(uid, key, to, buildMonthlyEmail({ model, core, profile: store.profile, emailTheme: deps.emailTheme }), { kind: 'monthly' }) === 'sent') sent += 1;
    }
    return { sent };
  }

  /** Recorre todas las licencias activas por páginas: pasado el tamaño de una página, nadie se queda sin su resumen. */
  async function runAll() {
    const pageSize = deps.pageSize || USERS_PAGE_SIZE;
    const results = { users: 0, sent: 0, skipped: 0, failed: 0 };
    let last = null;
    for (;;) {
      let query = deps.db.collection('patrimonio_access').where('active', '==', true).orderBy('__name__').limit(pageSize);
      if (last) query = query.startAfter(last);
      const page = await query.get();
      for (const doc of page.docs) {
        results.users += 1;
        try {
          const outcome = await runForUser(doc.id);
          if (outcome.sent) results.sent += outcome.sent; else results.skipped += 1;
        } catch (error) {
          results.failed += 1;
          console.error('[patrimonio-alerts] usuario', doc.id, error?.code || error?.message || error);
        }
      }
      if (page.docs.length < pageSize) break;
      if (results.users >= MAX_USERS_PER_RUN) {
        console.error('[patrimonio-alerts] tope de usuarios por pasada alcanzado', MAX_USERS_PER_RUN);
        break;
      }
      last = page.docs[page.docs.length - 1];
    }
    return results;
  }

  async function notifyAccessRequest(uid) {
    const snap = await deps.db.collection('patrimonio_requests').doc(uid).get();
    if (!snap.exists) return 'no_request';
    const request = snap.data();
    const to = deps.adminEmail();
    if (!to) return 'no_admin';
    // La clave sale de la hora de la solicitud: un aviso por solicitud, aunque
    // la app vuelva a llamar. Una solicitud nueva (otra hora) avisa de nuevo.
    const requestedAt = typeof request.requestedAt?.toMillis === 'function'
      ? request.requestedAt.toMillis()
      : request.requestedAt instanceof Date ? request.requestedAt.getTime() : null;
    const key = `access-request:${requestedAt ? Math.floor(requestedAt / 1000) : 'sin-fecha'}`;
    const html = patrimonioShell({
      eyebrow: 'Elysium Patrimonio',
      title: 'Nueva solicitud de acceso',
      intro: `<b>${escapeHtml(request.name || 'Sin nombre')}</b> (${escapeHtml(request.email || '')}) pidió una licencia de Patrimonio.${request.note ? `<br><br><i>«${escapeHtml(request.note)}»</i>` : ''}`,
      blocks: [],
      cta: 'Revisar en el CRM',
      ctaHref: 'https://elysiumdr.eu/admin',
      preheader: `${request.email || ''} pidió acceso a Patrimonio`,
      emailTheme: deps.emailTheme
    });
    return deliver(uid, key, to, {
      subject: `Solicitud de acceso a Patrimonio: ${request.name || request.email || uid}`,
      html,
      text: `${request.name || ''} (${request.email || ''}) pidió acceso a Elysium Patrimonio.\n${request.note || ''}\nCRM: https://elysiumdr.eu/admin`
    }, { kind: 'access-request' });
  }

  return { checkImmediate, runForUser, runAll, notifyAccessRequest };
}

/* ── Rutas ─────────────────────────────────────────────────────────────────── */

function schedulerAuthorised(request, isAdmin) {
  const configured = String(process.env.PATRIMONIO_ALERTS_TOKEN || '').trim();
  const provided = String(request.get('x-elysium-patrimonio-token') || '').trim();
  if (configured && provided && provided.length === configured.length
    && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(configured))) {
    return true;
  }
  return isAdmin(request.firebaseUser);
}

/**
 * @param {object} deps  las de createPatrimonioService, más
 *   verifyUser (middleware que deja request.firebaseUser o null) e isAdmin.
 */
function createPatrimonioRouter(deps) {
  const router = express.Router();
  const service = createPatrimonioService(deps);
  const lastCheck = new Map();
  const lastRequestMail = new Map();
  /** Personas cuya revisión está en curso: una segunda petición no lee otra vez todos sus datos. */
  const checking = new Set();

  router.use((request, response, next) => { response.set('Cache-Control', 'no-store'); next(); });

  router.post('/alerts/check', deps.verifyUser, async (request, response) => {
    const uid = request.firebaseUser?.uid;
    if (!uid) return response.status(401).json({ error: 'Authentication required.' });
    const previous = lastCheck.get(uid) || 0;
    if (checking.has(uid) || Date.now() - previous < CHECK_MIN_INTERVAL_MS) return response.status(202).json({ ok: true, throttled: true });
    remember(lastCheck, uid);
    checking.add(uid);
    try {
      const access = await deps.db.collection('patrimonio_access').doc(uid).get();
      if (!access.exists || access.data()?.active !== true) return response.status(403).json({ error: 'No Patrimonio license.', code: 'no_license' });
      const result = await service.checkImmediate(uid);
      return response.status(200).json({ ok: true, ...result });
    } catch (error) {
      console.error('[patrimonio-alerts] check', error?.code || error?.message || error);
      return response.status(error?.code === 'email_not_configured' ? 503 : 500).json({ error: 'Unable to check alerts.', code: 'patrimonio_check_failed' });
    } finally {
      checking.delete(uid);
    }
  });

  router.post('/alerts/run', deps.verifyUser, async (request, response) => {
    if (!schedulerAuthorised(request, deps.isAdmin)) {
      return response.status(403).json({ error: 'Administrator access required.', code: 'admin_required' });
    }
    try {
      const results = await service.runAll();
      console.log('[patrimonio-alerts] run', JSON.stringify(results));
      return response.status(200).json({ ok: true, ...results });
    } catch (error) {
      console.error('[patrimonio-alerts] run failed', error?.code || error?.message || error);
      return response.status(500).json({ error: 'Unable to run Patrimonio alerts.', code: 'patrimonio_run_failed' });
    }
  });

  router.post('/access-request', deps.verifyUser, async (request, response) => {
    const uid = request.firebaseUser?.uid;
    if (!uid) return response.status(401).json({ error: 'Authentication required.' });
    const previous = lastRequestMail.get(uid) || 0;
    if (Date.now() - previous < 10 * 60_000) return response.status(202).json({ ok: true, throttled: true });
    remember(lastRequestMail, uid);
    try {
      const outcome = await service.notifyAccessRequest(uid);
      return response.status(202).json({ ok: true, outcome });
    } catch (error) {
      console.error('[patrimonio-alerts] access request', error?.code || error?.message || error);
      return response.status(202).json({ ok: true, outcome: 'not_sent' });
    }
  });

  return router;
}

module.exports = {
  createPatrimonioRouter,
  createPatrimonioService,
  buildAlertsEmail,
  buildWeeklyEmail,
  buildMonthlyEmail,
  loadUserStore,
  loadCore,
  safeKey,
  APP_URL
};
