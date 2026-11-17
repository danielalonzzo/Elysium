/**
 * Correo de VALTRIX: el cierre del mes y los avisos de mantenimiento.
 *
 * Tres reglas, las mismas que en ONCORE:
 *
 *   · **El correo es cortesía, no parte del contrato.** El informe del mes
 *     existe y se ve en la cuenta aunque el correo falle o no haya con qué
 *     enviarlo. Ningún envío fallido deshace nada.
 *
 *   · **Cada intento queda escrito** en `mailLog`: enviado, fallido u omitido,
 *     con su motivo. «No me llegó» se contesta mirando ahí.
 *
 *   · **Sin transporte configurado, se omite y se dice.** Hoy VALTRIX no tiene
 *     buzón (el dominio `valtrix.com` es de otra empresa), así que todo queda
 *     como `skipped / NO_TRANSPORT`. El día que haya buzón: secretos SMTP_USER
 *     y SMTP_PASSWORD, o el binding `EMAIL` de Cloudflare, y la variable
 *     MAIL_FROM. Nada más cambia.
 *
 * Un correo lleva cifras del negocio —ventas del mes, quién debe—, y por eso
 * solo se envía a los propietarios del negocio, nunca a VALTRIX.
 */

import { money, time } from '../core.js';
import { sendSmtp, smtpConfigured } from './smtp.js';

const BRAND = { dark: '#101c2a', ink: '#13232c', muted: '#4a616b', paper: '#f4f7f6', line: '#d5e1df', accent: '#71e5ff', teal: '#076487', bad: '#9a3e20', good: '#126043' };

const TONE_COLOR = { bad: BRAND.bad, warn: '#8a5a12', info: BRAND.teal, good: BRAND.good };
const TONE_LABEL = { bad: 'Urgente', warn: 'Atención', info: 'Para saber', good: 'Va bien' };

export const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/**
 * La plantilla única: banda oscura con la marca, título, cifras en una tabla,
 * bloques con su tono, lista de acciones y un botón. Siempre en claro.
 */
export function renderEmail({ title, intro = '', rows = [], blocks = [], actions = [], cta = null, note = '' }) {
    const font = "Helvetica,Arial,sans-serif";
    const detail = rows.filter(([, value]) => value !== undefined && value !== null && value !== '').map(([label, value]) => `
            <tr>
              <td style="padding:10px 0;border-top:1px solid ${BRAND.line};font:500 12px/1.4 ${font};letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};width:46%;vertical-align:top;">${escapeHtml(label)}</td>
              <td style="padding:10px 0;border-top:1px solid ${BRAND.line};font:600 15px/1.4 ${font};color:${BRAND.ink};text-align:right;vertical-align:top;">${escapeHtml(value)}</td>
            </tr>`).join('');
    const blockRows = blocks.map(block => `
          <tr><td style="padding:14px 32px 0;">
            <div style="border-left:3px solid ${TONE_COLOR[block.tone] || BRAND.teal};padding:2px 0 2px 14px;">
              <div style="font:700 11px/1.4 ${font};letter-spacing:.08em;text-transform:uppercase;color:${TONE_COLOR[block.tone] || BRAND.teal};">${escapeHtml(TONE_LABEL[block.tone] || '')}</div>
              <div style="font:700 15px/1.35 ${font};color:${BRAND.ink};margin-top:2px;">${escapeHtml(block.title)}</div>
              ${block.detail ? `<div style="font:400 14px/1.5 ${font};color:${BRAND.muted};margin-top:4px;">${escapeHtml(block.detail)}</div>` : ''}
            </div>
          </td></tr>`).join('');
    const actionRows = actions.length ? `
          <tr><td style="padding:26px 32px 0;">
            <div style="font:700 12px/1.4 ${font};letter-spacing:.08em;text-transform:uppercase;color:${BRAND.teal};">Para el mes siguiente</div>
            <ol style="margin:10px 0 0;padding:0 0 0 20px;font:400 15px/1.55 ${font};color:${BRAND.ink};">${actions.map(action => `<li style="margin:0 0 8px;">${escapeHtml(action)}</li>`).join('')}</ol>
          </td></tr>` : '';
    const button = cta ? `
          <tr><td style="padding:24px 32px 8px;">
            <a href="${escapeHtml(cta.url)}" style="display:inline-block;background:${BRAND.accent};color:${BRAND.ink};text-decoration:none;font:700 14px/1 ${font};padding:14px 20px;border-radius:10px;">${escapeHtml(cta.label)} &rarr;</a>
          </td></tr>` : '';

    const html = `<!doctype html>
<html lang="es-CR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.paper};color-scheme:light only;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BRAND.line};border-radius:14px;overflow:hidden;">
        <tr><td style="background:${BRAND.dark};padding:22px 32px;">
          <span style="font:800 18px/1 ${font};letter-spacing:.08em;color:#ffffff;">VALTRIX</span>
          <span style="font:700 10px/1 ${font};letter-spacing:.12em;color:${BRAND.accent};"> ENGINEERING</span>
        </td></tr>
        <tr><td style="padding:30px 32px 4px;">
          <h1 style="margin:0;font:800 24px/1.15 ${font};letter-spacing:-.02em;color:${BRAND.ink};">${escapeHtml(title)}</h1>
          ${intro ? `<p style="margin:14px 0 0;font:400 15px/1.6 ${font};color:${BRAND.muted};">${escapeHtml(intro)}</p>` : ''}
        </td></tr>
        ${detail ? `<tr><td style="padding:18px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detail}
            <tr><td colspan="2" style="border-top:1px solid ${BRAND.line};font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>` : ''}
        ${blockRows}
        ${actionRows}
        ${button}
        ${note ? `<tr><td style="padding:14px 32px 0;font:400 13px/1.6 ${font};color:${BRAND.muted};">${escapeHtml(note)}</td></tr>` : ''}
        <tr><td style="padding:26px 32px 28px;font:400 11px/1.6 ${font};color:${BRAND.muted};">Mensaje automático de su cuenta VALTRIX. Lo reciben solo los propietarios del negocio.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const text = [
        'VALTRIX Engineering', '', title, intro, '',
        ...rows.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`),
        '',
        ...blocks.flatMap(block => [`[${TONE_LABEL[block.tone] || ''}] ${block.title}`, block.detail || '', '']),
        actions.length ? 'Para el mes siguiente:' : '',
        ...actions.map((action, index) => `${index + 1}. ${action}`),
        cta ? `\n${cta.label}: ${cta.url}` : '',
        note ? `\n${note}` : '',
        '', 'Mensaje automático de su cuenta VALTRIX.'
    ].filter(line => line !== undefined).join('\n');
    return { html, text };
}

/** Dónde abre la cuenta: el origen público configurado, o nada. */
const portalUrl = (env, hash) => (env.PUBLIC_ORIGIN ? `${String(env.PUBLIC_ORIGIN).replace(/\/$/, '')}/cuenta#/${hash}` : null);

/** El correo del cierre del mes, a partir del informe ya emitido. */
export function reportEmail(env, tenant, report) {
    const currency = report.currency;
    const format = minor => money.formatMoney(minor, currency);
    const url = portalUrl(env, `informes/${report.period}`);
    return {
        subject: `Cierre de ${report.label} · ${tenant.name}`,
        ...renderEmail({
            title: `Cierre de ${report.label}`,
            intro: `${tenant.name}. Esto es lo que dejó el mes y lo que conviene hacer en el siguiente.`,
            rows: [
                ['Ventas', format(report.sales.totalMinor)],
                ['Ganancia bruta', report.sales.marginBp === null ? '' : `${format(report.sales.profitMinor)} (${money.formatPercent(report.sales.marginBp)})`],
                ['Entró en caja', format(report.cash.inMinor)],
                ['Le deben', format(report.receivables.totalMinor)],
                ['De eso, vencido', report.receivables.overdueMinor ? format(report.receivables.overdueMinor) : ''],
                ['En bodega', format(report.inventory.valueMinor)]
            ],
            blocks: report.findings.slice(0, 6).map(finding => ({ tone: finding.tone, title: finding.title, detail: finding.detail })),
            actions: report.actions,
            cta: url ? { label: 'Ver el informe completo', url } : null,
            note: `La cartera y la bodega se miran al ${time.dayLabel(report.asOf)}, que es cuando se emitió el cierre.`
        })
    };
}

/** El aviso de mantenimiento: los equipos vencidos y los que están por vencer. */
export function maintenanceEmail(env, tenant, alerts, today) {
    const overdue = alerts.filter(row => row.status === 'overdue');
    const url = portalUrl(env, 'equipos');
    return {
        subject: overdue.length
            ? `Mantenimiento vencido · ${tenant.name}`
            : `Mantenimiento próximo · ${tenant.name}`,
        ...renderEmail({
            title: alerts.length === 1 ? `A ${alerts[0].name} le toca mantenimiento` : `${alerts.length} equipos piden mantenimiento`,
            intro: `${tenant.name}. Una máquina parada cuesta más que su revisión.`,
            rows: alerts.map(row => [row.name, row.status === 'overdue'
                ? `Vencido ${time.relativeDays(today, row.nextDueOn)}`
                : `Toca ${time.relativeDays(today, row.nextDueOn)} (${time.dayLabel(row.nextDueOn, { short: true })})`]),
            cta: url ? { label: 'Ver los equipos', url } : null,
            note: 'Al registrar el mantenimiento en la cuenta, el sistema calcula la próxima fecha.'
        })
    };
}

/**
 * Envía y registra. Nunca lanza: devuelve 'sent' | 'failed' | 'skipped'.
 * Transporte, por orden: SMTP del buzón y, si no, el binding `EMAIL`.
 */
export async function sendMail(env, db, { to, subject, html, text, template, tenantId = null }) {
    const recipient = String(to || '').toLowerCase();
    const from = env.SMTP_FROM || env.MAIL_FROM || env.SMTP_USER || '';
    const entry = { to: recipient, subject, template, tenantId, createdAt: new Date().toISOString(), status: 'skipped', transport: null, error: null, messageId: null };
    if (!recipient) {
        entry.error = 'NO_RECIPIENT';
    } else if (smtpConfigured(env)) {
        entry.transport = 'smtp';
        try {
            const result = await sendSmtp(env, { from, fromName: 'VALTRIX', to: recipient, replyTo: env.MAIL_REPLY_TO || from, subject, html, text, domain: from.split('@')[1] || 'valtrix' });
            entry.status = 'sent';
            entry.messageId = result.messageId || null;
        } catch (error) {
            entry.status = 'failed';
            entry.error = String(error?.message || error).slice(0, 160);
        }
    } else if (env.EMAIL && typeof env.EMAIL.send === 'function' && from) {
        entry.transport = 'cloudflare';
        try {
            const result = await env.EMAIL.send({ to: recipient, from: { email: from, name: 'VALTRIX' }, replyTo: env.MAIL_REPLY_TO || from, subject, html, text });
            entry.status = 'sent';
            entry.messageId = result?.messageId || null;
        } catch (error) {
            entry.status = 'failed';
            entry.error = String(error?.code || error?.message || error).slice(0, 160);
        }
    } else {
        entry.error = 'NO_TRANSPORT';
    }
    try {
        await db.create('mailLog', crypto.randomUUID(), entry);
    } catch (error) {
        console.error('valtrix mail log', String(error).slice(0, 160));
    }
    return entry.status;
}
