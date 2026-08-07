/**
 * Reglas de negocio compartidas por el CRM (`admin.js`), el portal del cliente
 * (`profiles.js`) y el onboarding (`onboarding.js`).
 *
 * Antes vivían duplicadas en cada fichero y ya habían divergido de verdad: el
 * mismo cliente podía aparecer con el onboarding «Completado» en el CRM y «Sin
 * iniciar» en su propio portal, porque cada lado improvisaba su propia forma de
 * suplir una bandera que nadie escribía. Aquí hay una sola respuesta por
 * pregunta; si cambia una política, cambia en un solo sitio.
 *
 * La misma lógica de suscripción está además en `storage.rules`, escrita en el
 * lenguaje de reglas. Ese tercer sitio no se puede importar: si tocas
 * GRACE_PERIOD_DAYS, actualiza también `subscriptionAllowsAccess()` allí.
 */

// ── Tiempo ───────────────────────────────────────────────────────────────────

/** Firestore Timestamp, {seconds}, Date o cadena → milisegundos (0 si no vale). */
export function timestampMillis(value) {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (Number.isFinite(value.seconds)) return value.seconds * 1000;
    const millis = new Date(value).getTime();
    return Number.isFinite(millis) ? millis : 0;
}

// ── Estado de la suscripción ─────────────────────────────────────────────────

export const GRACE_PERIOD_DAYS = 15;
const GRACE_PERIOD_MS = GRACE_PERIOD_DAYS * 86_400_000;

/**
 * El estado real de una suscripción, que no es siempre el que hay guardado: una
 * renovación vencida degrada a `pending_payment` y, pasado el periodo de
 * gracia, a `suspended`.
 */
export function subscriptionStatus(subscription) {
    if (!subscription) return null;
    const stored = subscription.status || 'active';
    if (['suspended', 'canceled', 'cancelled'].includes(stored)) return stored;

    const renewal = timestampMillis(subscription.nextBillingDate);
    const renewalGrace = renewal ? renewal + GRACE_PERIOD_MS : 0;
    const paymentGrace = timestampMillis(subscription.gracePeriodEnd) || renewalGrace;

    if (stored === 'pending_payment') {
        return !paymentGrace || Date.now() > paymentGrace ? 'suspended' : stored;
    }
    if (stored === 'active') {
        if (renewalGrace && Date.now() > renewalGrace) return 'suspended';
        if (renewal && Date.now() > renewal) return 'pending_payment';
    }
    return stored;
}

// ── Identidad del proyecto ───────────────────────────────────────────────────

/**
 * Las cuentas anteriores a los proyectos múltiples guardaban su único proyecto
 * en los campos raíz del miembro. Al sintetizarlo en memoria, cada pantalla le
 * puso un identificador distinto —`legacy` en el perfil, `project-1` en el
 * resumen—, así que cuál se acababa guardando dependía de qué pestaña se
 * hubiera abierto primero. Y las entregas de onboarding de aquella época no
 * llevan `projectId` en absoluto.
 *
 * Los tres son el mismo proyecto. `canonicalProjectId` los reduce a uno solo,
 * y todo lo demás compara por ahí. Para escrituras nuevas se usa siempre
 * LEGACY_PROJECT_ID; `project-1` se sigue reconociendo porque hay documentos
 * reales que ya lo llevan.
 */
export const LEGACY_PROJECT_ID = 'legacy';
const LEGACY_PROJECT_ALIASES = new Set(['legacy', 'project-1']);

export function canonicalProjectId(projectId) {
    if (projectId == null) return LEGACY_PROJECT_ID;
    const id = String(projectId);
    if (id.length === 0 || LEGACY_PROJECT_ALIASES.has(id)) return LEGACY_PROJECT_ID;
    return id;
}

export function isLegacyProjectId(projectId) {
    return canonicalProjectId(projectId) === LEGACY_PROJECT_ID;
}

export function projectIdsMatch(a, b) {
    return canonicalProjectId(a) === canonicalProjectId(b);
}

/** ¿Esta entrega de onboarding pertenece al proyecto indicado? */
export function submissionMatchesProject(submission, projectId) {
    return projectIdsMatch(submission?.projectId, projectId);
}

/**
 * Los identificadores canónicos de los proyectos que ya tienen una entrega
 * publicada. Las entregas sin `projectId` cuentan para el proyecto heredado.
 */
export function completedProjectIds(submissions) {
    return new Set((submissions || []).map(submission => canonicalProjectId(submission?.projectId)));
}

// ── Onboarding ───────────────────────────────────────────────────────────────

/**
 * Si el onboarding de un proyecto está publicado. Se responde igual en el CRM y
 * en el portal, por orden de fiabilidad:
 *
 *   1. existe una entrega publicada para ese proyecto — prueba directa;
 *   2. la bandera del propio proyecto, que `onboarding.js` escribe desde ahora;
 *   3. sólo para datos anteriores a esa bandera, la del miembro, y únicamente
 *      si `lastOnboardingProjectId` apunta a este proyecto (o no apunta a
 *      ninguno, en cuyo caso la cuenta tenía uno solo).
 */
export function projectOnboardingCompleted(project, member, completed = new Set()) {
    if (completed.has(canonicalProjectId(project?.id))) return true;
    if (project?.onboardingCompleted === true) return true;
    // Una bandera presente y falsa es una respuesta, no una laguna.
    if (project && Object.hasOwn(project, 'onboardingCompleted')) return false;

    if (member?.onboardingCompleted !== true) return false;
    const last = member.lastOnboardingProjectId;
    return last == null || projectIdsMatch(last, project?.id);
}

// ── Proyectos ────────────────────────────────────────────────────────────────

/**
 * La lista de proyectos de un miembro, sintetizando el proyecto heredado a
 * partir de los campos raíz cuando todavía no se ha migrado. Devuelve siempre
 * un array; vacío significa que la cuenta aún no tiene proyecto.
 */
export function normalizeProjects(member, fallbackName = 'Proyecto 1') {
    const projects = Array.isArray(member?.projects) ? member.projects : [];
    const usable = projects.filter(project => project && typeof project === 'object');
    if (usable.length) return usable;

    const hasLegacyProject = member?.projectUrl || member?.projectStage
        || member?.onboardingCompleted || member?.financials;
    if (!hasLegacyProject) return [];

    return [{
        id: LEGACY_PROJECT_ID,
        name: member.company || member.name || fallbackName,
        projectUrl: member.projectUrl || null,
        projectStage: member.projectStage || 'first_contact',
        financials: member.financials || null,
        reports: Array.isArray(member.reports) ? member.reports : [],
        timeline: Array.isArray(member.timeline) ? member.timeline : [],
        projectDescription: member.projectDescription || '',
        lastUpdated: member.lastUpdated || null
    }];
}

// ── Ingresos ─────────────────────────────────────────────────────────────────

/**
 * El dinero cobrado vive en `subscription_payments`, y sólo ahí. Las gráficas
 * leían en cambio los documentos de proyecto con importe, así que en cuanto un
 * comprobante se movía al libro de pagos el importe desaparecía de las gráficas
 * mientras el KPI de al lado lo seguía contando.
 *
 * Las monedas no se suman entre sí: sumar euros con colones sería mentir.
 */
export function revenueByCurrency(payments) {
    return (payments || []).reduce((totals, payment) => {
        const value = Number.parseFloat(payment?.amount);
        if (!Number.isFinite(value)) return totals;
        const code = payment?.currency || 'EUR';
        totals[code] = (totals[code] || 0) + value;
        return totals;
    }, {});
}

export const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', CRC: '₡' };

export function formatRevenue(totals, emptySymbol = '€') {
    const entries = Object.entries(totals || {});
    if (!entries.length) return `${emptySymbol}0`;
    return entries
        .map(([code, value]) => `${CURRENCY_SYMBOLS[code] || code}${value.toLocaleString(undefined, {
            minimumFractionDigits: 0, maximumFractionDigits: 2
        })}`)
        .join(' · ');
}
