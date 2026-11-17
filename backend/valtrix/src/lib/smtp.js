/**
 * Cliente SMTP mínimo para Cloudflare Workers (`cloudflare:sockets`).
 *
 * Es el de ONCORE (`λ/ONCORE/ONCORE/worker/lib/smtp.js`), que a su vez sigue a
 * Pura Vida Pets: el correo sale de un buzón real, con TLS implícito en el
 * puerto 465 y AUTH LOGIN, y lleva la versión HTML y la de texto.
 *
 * **En VALTRIX todavía no ha enviado nada.** No hay buzón: el dominio
 * `valtrix.com` es de otra empresa y falta la dirección real. Está aquí para
 * que el día que exista baste con poner los secretos, no para dar por hecho
 * que funciona: la primera vez hay que comprobarlo con un envío de verdad.
 *
 * Secretos del Worker (`wrangler secret put`): SMTP_USER (el buzón, no un
 * alias: un alias no autentica) y SMTP_PASSWORD. Variables opcionales:
 * SMTP_HOST (smtp.ionos.es) y SMTP_PORT (465).
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const smtpConfigured = env => Boolean(env.SMTP_USER && env.SMTP_PASSWORD);

function b64(value) {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
}

/** Base64 partido en líneas de 76 caracteres, como pide MIME. */
const wrap = value => b64(value).replace(/.{1,76}/g, line => `${line}\r\n`);

/** Cabecera con texto no ASCII (asunto, nombre del remitente). */
const header = value => (/^[\x20-\x7E]*$/.test(value) ? value : `=?UTF-8?B?${b64(value)}?=`);

const address = (name, email) => (name ? `${header(name)} <${email}>` : `<${email}>`);

export function buildMessage({ from, fromName, to, replyTo, subject, html, text, domain }) {
    const id = crypto.randomUUID();
    const boundary = `alt-${id}`;
    const head = [
        `From: ${address(fromName, from)}`,
        `To: <${to}>`,
        replyTo ? `Reply-To: <${replyTo}>` : null,
        `Subject: ${header(subject)}`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: <${id}@${domain}>`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`
    ].filter(Boolean);
    const body = [
        `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap(text || ''),
        `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap(html || ''),
        `--${boundary}--`, ''
    ].join('\r\n');
    return `${head.join('\r\n')}\r\n\r\n${body}`;
}

/** Envía un mensaje. Lanza con el código SMTP si el servidor lo rechaza. */
export async function sendSmtp(env, message) {
    const host = env.SMTP_HOST || 'smtp.ionos.es';
    const port = Number(env.SMTP_PORT || 465);
    // Importación perezosa: solo existe en el runtime de Workers (las pruebas corren en Node, sin SMTP).
    const { connect } = await import('cloudflare:sockets');
    const socket = connect({ hostname: host, port }, { secureTransport: 'on', allowHalfOpen: false });
    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();
    let buffer = '';

    async function reply() {
        // Una respuesta termina en la línea «NNN texto» (las intermedias son «NNN-texto»).
        for (;;) {
            const lines = buffer.split('\r\n');
            for (let i = 0; i < lines.length - 1; i += 1) {
                if (/^\d{3} /.test(lines[i])) {
                    buffer = lines.slice(i + 1).join('\r\n');
                    return { code: Number(lines[i].slice(0, 3)), text: lines.slice(0, i + 1).join('\n') };
                }
            }
            const { value, done } = await reader.read();
            if (done) throw new Error('SMTP_CLOSED');
            buffer += decoder.decode(value, { stream: true });
        }
    }
    async function command(line, expect) {
        if (line !== null) await writer.write(encoder.encode(`${line}\r\n`));
        const answer = await reply();
        if (!expect.includes(answer.code)) throw new Error(`SMTP_${answer.code}: ${answer.text.slice(0, 120)}`);
        return answer;
    }

    try {
        await command(null, [220]);
        await command(`EHLO ${message.domain}`, [250]);
        await command('AUTH LOGIN', [334]);
        await command(b64(env.SMTP_USER), [334]);
        await command(b64(env.SMTP_PASSWORD), [235]);
        await command(`MAIL FROM:<${message.from}>`, [250]);
        await command(`RCPT TO:<${message.to}>`, [250, 251]);
        await command('DATA', [354]);
        // Transparencia: una línea que empiece por «.» se duplica.
        const data = buildMessage(message).replace(/\r\n\./g, '\r\n..');
        await writer.write(encoder.encode(`${data}\r\n.\r\n`));
        const accepted = await reply();
        if (accepted.code !== 250) throw new Error(`SMTP_${accepted.code}: ${accepted.text.slice(0, 120)}`);
        await command('QUIT', [221]).catch(() => {});
        return { messageId: accepted.text.slice(4, 120) };
    } finally {
        try { writer.releaseLock(); reader.releaseLock(); await socket.close(); } catch { /* ya cerrado */ }
    }
}
