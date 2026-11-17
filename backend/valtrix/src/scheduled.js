/**
 * Los procesos automáticos: lo que el sistema hace sin que nadie lo pida.
 *
 * El cron del Worker despierta una vez al día a una hora fija UTC y recorre
 * los negocios. Para cada uno hace, como mucho, tres cosas:
 *
 *   1. **Marca el pago vencido.** Si el período pagado terminó y nadie liquidó
 *      el siguiente, la suscripción pasa a `past_due`. El servicio sigue
 *      completo: es un aviso para VALTRIX, no un castigo para el cliente.
 *      **Suspender no es automático**: lo decide una persona, con su motivo.
 *      Que a un negocio se le corte el registro porque a alguien se le pasó
 *      confirmar un SINPE sería peor que cobrar unos días tarde.
 *
 *   2. **Cierra el mes anterior** si el negocio tiene auditoría, ya pasaron
 *      los días de gracia y todavía no hay informe. Y se lo envía a sus
 *      propietarios.
 *
 *   3. **Avisa de los mantenimientos** que entran en su ventana de aviso o que
 *      vencen, una vez por cada cosa.
 *
 * Tres propiedades que hacen esto seguro de ejecutar:
 *
 *   · **Repetirlo no hace daño.** Cada paso mira antes si ya está hecho: el
 *     informe se crea con «no debe existir», el aviso deja su marca en el
 *     equipo. Dos ejecuciones el mismo día dan lo mismo que una.
 *
 *   · **Un negocio que falla no detiene a los demás.** Su error se registra y
 *     se sigue con el siguiente.
 *
 *   · **Cada negocio va en su hora.** «Hoy» y «el mes pasado» se calculan en
 *     la zona horaria del negocio, no en la del servidor.
 *
 * Aquí el motor trabaja como VALTRIX (`systemEngine`), no como una persona
 * del negocio: no hay nadie llamando.
 */

import { audit, qms, time } from './core.js';
import { entitlementsOf } from './lib/context.js';
import { firestore } from './lib/firebase.js';
import { maintenanceEmail, reportEmail, sendMail } from './lib/mail.js';
import { ownersOf } from './lib/members.js';
import { systemEngine } from './lib/store.js';

/** Estados en los que el negocio registra y recibe el servicio completo. */
const SERVED = ['active', 'past_due', 'cancel_at_period_end'];

const SYSTEM = { uid: 'system', name: 'VALTRIX' };

async function notifyOwners(env, db, tenant, message, template) {
    const owners = await ownersOf(db, tenant.id);
    let sent = 0;
    for (const owner of owners) {
        const status = await sendMail(env, db, { to: owner.email, ...message, template, tenantId: tenant.id });
        if (status === 'sent') sent += 1;
    }
    return sent;
}

async function runTenant(env, db, tenant, now, summary) {
    const subscription = tenant.subscription || { state: 'pending_activation', paidPeriods: 0 };
    const timezone = tenant.timezone || 'America/Costa_Rica';
    const today = time.businessDay(now(), timezone);

    if (subscription.state === 'active' && subscription.currentPeriodEnd && subscription.currentPeriodEnd < today) {
        const at = now().toISOString();
        await db.commit([
            db.write.update('tenants', tenant.id, { subscription: { ...subscription, state: 'past_due', updatedAt: at, updatedBy: SYSTEM.uid } }, { updateTime: tenant._updateTime }),
            db.write.create(`tenants/${tenant.id}/subscriptionLog`, `${now().getTime()}-vencido`, {
                from: 'active', to: 'past_due', paidPeriods: subscription.paidPeriods || 0,
                reason: `El período pagado terminó el ${time.dayLabel(subscription.currentPeriodEnd)}`, at, by: SYSTEM.uid
            })
        ]);
        summary.pastDue += 1;
    }

    // `past_due` sigue recibiendo todo; un negocio suspendido, cancelado o sin
    // activar no genera cierres ni avisos.
    if (!SERVED.includes(subscription.state)) return;
    const entitlements = entitlementsOf(subscription);
    const engine = systemEngine(db, { ...tenant, timezone }, SYSTEM, now);

    if (entitlements.audit) {
        const report = await audit.closeIfDue(engine, { modules: { qms: Boolean(entitlements.qms) } });
        if (report) {
            summary.reports += 1;
            summary.mailed += await notifyOwners(env, db, tenant, reportEmail(env, tenant, report), 'monthly-report');
        }
    }

    if (entitlements.qms) {
        const { alerts, today: day } = await qms.pendingAlerts(engine);
        if (alerts.length) {
            summary.alerts += alerts.length;
            summary.mailed += await notifyOwners(env, db, tenant, maintenanceEmail(env, tenant, alerts, day), 'maintenance');
            // La marca se pone aunque el correo se haya omitido: el aviso
            // queda en `mailLog` y en la cuenta, y repetirlo cada día no lo
            // haría llegar mejor.
            for (const alert of alerts) await qms.markNotified(engine, alert.id, alert.nextDueOn, alert.status);
        }
    }
}

/**
 * Una pasada completa. Devuelve cuánto hizo, para el registro del Worker y
 * para quien la dispare a mano desde la administración.
 */
export async function runScheduled(env, { now = () => new Date(), db = firestore(env) } = {}) {
    const summary = { tenants: 0, pastDue: 0, reports: 0, alerts: 0, mailed: 0, errors: 0 };
    const tenants = await db.query('tenants', { limit: 1000 });
    for (const tenant of tenants) {
        summary.tenants += 1;
        try {
            await runTenant(env, db, tenant, now, summary);
        } catch (error) {
            summary.errors += 1;
            console.error('valtrix cron', tenant.id, String(error?.stack || error).slice(0, 400));
        }
    }
    return summary;
}
