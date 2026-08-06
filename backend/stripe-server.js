'use strict';

/**
 * Elysium subscription service.
 *
 * Stripe owns payment state; Firestore mirrors that state for the CRM. A
 * successful web checkout provisions the same member.subscription, licenses
 * and subscription_payments records used by the CRM's manual payment flow.
 */
const crypto = require('node:crypto');
const express = require('express');
const Stripe = require('stripe');
const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app');
const { FieldValue, Timestamp, getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required.');
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is required; unsigned webhooks are never accepted.');
}

if (getApps().length === 0) {
  initializeApp({ credential: applicationDefault() });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = getFirestore();
const firebaseAuth = getAuth();
const app = express();
const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
// Production runs behind one trusted ingress hop (Cloud Run/Cloudflare proxy),
// allowing Express to expose the originating address through request.ip.
app.set('trust proxy', Number.isInteger(trustProxyHops) && trustProxyHops >= 0 ? trustProxyHops : 1);
const PORT = Number(process.env.PORT || 4242);
const GRACE_PERIOD_DAYS = 15;
// Stripe enforces a 30-minute minimum. Five extra minutes leave enough room
// for transaction retries and process restarts before the API call is replayed.
const CHECKOUT_SESSION_SECONDS = 35 * 60;
const BILLING_CURRENCY = 'eur';
const MEETING_EMAIL_LEASE_MS = 2 * 60 * 1000;
const MAX_MEETING_RANGE_DAYS = 370;
const PASSWORD_RESET_WINDOW_MS = 60 * 60 * 1000;
const PASSWORD_RESET_EMAIL_LIMIT = 5;
const PASSWORD_RESET_IP_LIMIT = 20;
const SUPER_ADMIN_EMAILS = new Set(
  String(process.env.ADMIN_EMAILS || 'danielalonzzo@icloud.com')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)
);
const passwordResetAttempts = new Map();

/** The site's public origin, used in links that travel inside emails. */
function publicBaseUrl() {
  return String(process.env.PUBLIC_BASE_URL || 'https://elysiumdr.eu').replace(/\/$/, '');
}

const PLANS = {
  hosting:      { code: 'H0ST', label: 'Domain & Hosting', amountMinor: { annual: 9900 } },
  basic:        { code: 'EC01', label: 'Presence', amountMinor: { monthly: 7000, annual: 70000 } },
  preferential: { code: 'EC02', label: 'System', amountMinor: { monthly: 9900, annual: 99000 } },
  advanced:     { code: 'EC03', label: 'Operations', amountMinor: { monthly: 12000, annual: 120000 } },
  crm:          { code: 'CRMP', label: 'Custom Core CRM', amountMinor: { monthly: 5000, annual: 50000 }, retired: true }
};

const PERIOD_CODES = { monthly: 'M3N1', annual: 'ANL1' };

// These are the lookup keys already used by the site, plus explicit annual
// variants. They can be replaced without a code deploy via STRIPE_LOOKUP_KEYS_JSON.
// The `*_maintenance` names predate renaming the plans to Presence / System /
// Operations. They stay as they are on purpose: a lookup key is the identifier
// of a live Stripe Price, and renaming it would orphan every running
// subscription. Only the customer-facing labels above changed.
const DEFAULT_LOOKUP_KEYS = {
  hosting:      { annual: 'domain_hosting' },
  basic:        { monthly: 'basic_maintenance',        annual: 'basic_maintenance_annual' },
  preferential: { monthly: 'preferential_maintenance', annual: 'preferential_maintenance_annual' },
  advanced:     { monthly: 'advanced_maintenance',     annual: 'advanced_maintenance_annual' },
  crm:          { monthly: 'custom_core_crm',          annual: 'custom_core_crm_annual' }
};

function parseLookupKeys() {
  if (!process.env.STRIPE_LOOKUP_KEYS_JSON) return DEFAULT_LOOKUP_KEYS;
  try {
    const overrides = JSON.parse(process.env.STRIPE_LOOKUP_KEYS_JSON);
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
      throw new Error('expected an object');
    }
    for (const planType of Object.keys(overrides)) {
      if (!DEFAULT_LOOKUP_KEYS[planType]) throw new Error(`unknown plan '${planType}'`);
    }
    const configured = {};
    for (const [planType, defaults] of Object.entries(DEFAULT_LOOKUP_KEYS)) {
      const override = overrides[planType];
      if (override != null && (typeof override !== 'object' || Array.isArray(override))) {
        throw new Error(`plan '${planType}' must be an object`);
      }
      configured[planType] = { ...defaults, ...(override || {}) };
      for (const [cycle, lookupKey] of Object.entries(configured[planType])) {
        if (!PERIOD_CODES[cycle] || typeof lookupKey !== 'string' || !lookupKey.trim()) {
          throw new Error(`invalid ${planType}/${cycle} lookup key`);
        }
      }
    }
    return configured;
  } catch (error) {
    throw new Error(`Invalid STRIPE_LOOKUP_KEYS_JSON: ${error.message}`);
  }
}

const LOOKUP_KEYS = parseLookupKeys();
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

function publicOrigin(request) {
  const requestedOrigin = String(request.get('origin') || '').replace(/\/$/, '');
  if (allowedOrigins.has(requestedOrigin)) return requestedOrigin;
  return String(process.env.PUBLIC_BASE_URL || 'https://elysiumdr.eu').replace(/\/$/, '');
}

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

function timestampFromUnix(seconds) {
  return Number.isFinite(Number(seconds)) && Number(seconds) > 0
    ? Timestamp.fromMillis(Number(seconds) * 1000)
    : null;
}

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (Number.isFinite(value.seconds)) return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return Number(value) || 0;
}

function subscriptionPeriodEnd(subscription) {
  return subscription.current_period_end || subscription.items?.data?.[0]?.current_period_end || null;
}

function subscriptionPeriodStart(subscription) {
  return subscription.current_period_start || subscription.items?.data?.[0]?.current_period_start || subscription.start_date || null;
}

function licenseCodeFor(planType, billingCycle, subscriptionId) {
  const suffix = crypto.createHash('sha256').update(subscriptionId).digest('hex').slice(0, 8).toUpperCase();
  return `ELY-${PLANS[planType].code}-${PERIOD_CODES[billingCycle]}-${suffix}`;
}

function crmStatus(stripeStatus) {
  if (['active', 'trialing'].includes(stripeStatus)) return 'active';
  if (['past_due', 'incomplete'].includes(stripeStatus)) return 'pending_payment';
  if (['unpaid', 'paused'].includes(stripeStatus)) return 'suspended';
  if (['canceled', 'incomplete_expired'].includes(stripeStatus)) return 'canceled';
  return 'pending_payment';
}

function effectiveCrmStatus(subscription, forcedStatus = null) {
  if (forcedStatus) return forcedStatus;
  const latestInvoice = typeof subscription.latest_invoice === 'object' ? subscription.latest_invoice : null;
  if (subscription.status === 'active'
    && latestInvoice
    && latestInvoice.paid !== true
    && latestInvoice.status === 'open'
    && Number(latestInvoice.amount_due || 0) > 0) {
    return 'pending_payment';
  }
  return crmStatus(subscription.status);
}

function expectedInterval(billingCycle) {
  return billingCycle === 'annual' ? 'year' : billingCycle === 'monthly' ? 'month' : null;
}

function planAndCycleFromLookupKey(lookupKey) {
  for (const [planType, cycles] of Object.entries(LOOKUP_KEYS)) {
    for (const [billingCycle, configuredLookupKey] of Object.entries(cycles)) {
      if (configuredLookupKey === lookupKey) return { planType, billingCycle };
    }
  }
  return null;
}

function validateStripePrice(price, planType, billingCycle, { requireActive = true } = {}) {
  const lookupKey = LOOKUP_KEYS[planType]?.[billingCycle];
  if (!lookupKey || !price || price.lookup_key !== lookupKey) {
    throw new Error(`Stripe Price does not match ${planType}/${billingCycle}.`);
  }
  if (requireActive && price.active !== true) throw new Error(`Stripe Price '${lookupKey}' is inactive.`);
  if (price.type !== 'recurring' || !price.recurring) {
    throw new Error(`Stripe Price '${lookupKey}' must be recurring.`);
  }
  if (price.recurring.interval !== expectedInterval(billingCycle) || Number(price.recurring.interval_count || 1) !== 1) {
    throw new Error(`Stripe Price '${lookupKey}' has an invalid billing interval.`);
  }
  if (price.recurring.usage_type && price.recurring.usage_type !== 'licensed') {
    throw new Error(`Stripe Price '${lookupKey}' must use licensed billing.`);
  }
  if (price.billing_scheme && price.billing_scheme !== 'per_unit') {
    throw new Error(`Stripe Price '${lookupKey}' must use per-unit billing.`);
  }
  if (String(price.currency || '').toLowerCase() !== BILLING_CURRENCY) {
    throw new Error(`Stripe Price '${lookupKey}' must use EUR.`);
  }
  if (!Number.isSafeInteger(price.unit_amount) || price.unit_amount <= 0) {
    throw new Error(`Stripe Price '${lookupKey}' must have a positive fixed amount.`);
  }
  const expectedAmountMinor = PLANS[planType]?.amountMinor?.[billingCycle];
  if (requireActive && Number.isSafeInteger(expectedAmountMinor) && price.unit_amount !== expectedAmountMinor) {
    throw new Error(`Stripe Price '${lookupKey}' amount does not match the published plan.`);
  }
  if (requireActive && price.product && typeof price.product === 'object'
    && (price.product.active === false || price.product.deleted === true)) {
    throw new Error(`Stripe Product for '${lookupKey}' is inactive.`);
  }
  return price;
}

function subscriptionDescriptor(subscription) {
  const items = subscription.items?.data || [];
  if (items.length !== 1 || Number(items[0].quantity || 1) !== 1) {
    throw new Error(`Stripe subscription ${subscription.id} must contain exactly one unit.`);
  }
  const price = items[0].price;
  const mapped = planAndCycleFromLookupKey(price?.lookup_key);
  if (!mapped) throw new Error(`Cannot map Stripe subscription ${subscription.id} to an Elysium plan.`);
  validateStripePrice(price, mapped.planType, mapped.billingCycle, { requireActive: false });

  if (subscription.metadata?.planType && subscription.metadata.planType !== mapped.planType) {
    throw new Error(`Stripe subscription ${subscription.id} has inconsistent plan metadata.`);
  }
  if (subscription.metadata?.billingCycle && subscription.metadata.billingCycle !== mapped.billingCycle) {
    throw new Error(`Stripe subscription ${subscription.id} has inconsistent cycle metadata.`);
  }
  return { ...mapped, price };
}

function billingCycleFromSubscription(subscription) {
  return subscriptionDescriptor(subscription).billingCycle;
}

function planFromSubscription(subscription) {
  return subscriptionDescriptor(subscription).planType;
}

function minorUnitsToMajor(amountMinor, currency) {
  const normalizedCurrency = String(currency || '').toLowerCase();
  if (normalizedCurrency !== BILLING_CURRENCY) {
    throw new Error(`Unsupported invoice currency '${currency || 'missing'}'.`);
  }
  const amount = Number(amountMinor);
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Stripe invoice amount is invalid.');
  return amount / 100;
}

function stableGraceWindow(previous, subscriptionId, status, context = {}) {
  const sameSubscription = previous?.stripeSubscriptionId === subscriptionId;
  const previousGraceEnd = previous?.gracePeriodEnd || null;
  const previousGraceStartedAt = previous?.graceStartedAt || null;
  if (status === 'active' || status === 'canceled') {
    return { graceStartedAt: null, gracePeriodEnd: null };
  }
  if (sameSubscription && previousGraceEnd && ['pending_payment', 'suspended'].includes(status)) {
    return { graceStartedAt: previousGraceStartedAt, gracePeriodEnd: previousGraceEnd };
  }
  if (status !== 'pending_payment') return { graceStartedAt: null, gracePeriodEnd: null };

  const baseSeconds = Number(context.paymentFailedAt || context.eventCreated || context.observedAtSeconds || 0);
  if (!baseSeconds) return { graceStartedAt: null, gracePeriodEnd: null };
  return {
    graceStartedAt: timestampFromUnix(baseSeconds),
    gracePeriodEnd: timestampFromUnix(baseSeconds + GRACE_PERIOD_DAYS * 86400)
  };
}

function subscriptionEntitlement({
  invoicePaid = false,
  latestInvoicePaid = false,
  stateHasEverPaid = false,
  previousHasEverPaid = false,
  sameSubscription = false,
  stripeStatus,
  status
}) {
  const hasEverPaid = Boolean(
    invoicePaid
    || latestInvoicePaid
    || stateHasEverPaid
    || sameSubscription && previousHasEverPaid
  );
  return {
    hasEverPaid,
    accessGranted: Boolean(
      status === 'active' && (hasEverPaid || stripeStatus === 'trialing')
      || status === 'pending_payment' && hasEverPaid
    )
  };
}

function isTerminalSubscriptionStatus(status) {
  return ['canceled', 'cancelled'].includes(status);
}

function subscriptionEventRank(eventType, status) {
  if (eventType === 'customer.subscription.deleted' || status === 'canceled') return 100;
  if (eventType === 'invoice.paid' || eventType === 'checkout.session.async_payment_succeeded') return 95;
  if (eventType === 'customer.subscription.resumed') return 90;
  if (['invoice.payment_failed', 'invoice.payment_action_required', 'invoice.finalization_failed',
    'checkout.session.async_payment_failed'].includes(eventType)) return 85;
  if (eventType === 'customer.subscription.paused') return 80;
  if (status === 'active') return 70;
  if (status === 'suspended') return 60;
  if (status === 'pending_payment') return 50;
  return 10;
}

function shouldApplyMemberSubscription(previous = {}, incomingSubscriptionId, incomingStatus) {
  const currentSubscriptionId = previous.stripeSubscriptionId || null;
  if (currentSubscriptionId === incomingSubscriptionId) return true;
  if (!currentSubscriptionId && !previous.status) return !isTerminalSubscriptionStatus(incomingStatus);
  return isTerminalSubscriptionStatus(previous.status) && !isTerminalSubscriptionStatus(incomingStatus);
}

function checkoutFingerprint({ userId, planType, billingCycle, priceId, baseUrl, returnPath }) {
  return crypto.createHash('sha256')
    .update([userId, planType, billingCycle, priceId, baseUrl, returnPath].join('\u0000'))
    .digest('hex');
}

function checkoutDecision(member, fingerprint, nowMillis) {
  if (!member) return { kind: 'missing_member' };
  if (member.isDeactivated === true) return { kind: 'deactivated' };

  const subscription = member.subscription || null;
  if (subscription && !isTerminalSubscriptionStatus(subscription.status)) {
    return { kind: 'subscription', subscription, checkout: member.billingCheckout || null };
  }

  const checkout = member.billingCheckout || null;
  const expiresAtMillis = timestampMillis(checkout?.expiresAt);
  const stillLive = expiresAtMillis > nowMillis;
  if (checkout && ['creating', 'open'].includes(checkout.status) && stillLive) {
    if (checkout.fingerprint !== fingerprint) return { kind: 'conflict', checkout };
    return { kind: checkout.status === 'open' ? 'reuse' : 'resume', checkout };
  }
  if (checkout?.status === 'completed' && stillLive) return { kind: 'processing', checkout };
  return { kind: 'claim' };
}

function checkoutEventUpdate(checkout, session, status, event, now) {
  const attemptId = session.metadata?.checkoutAttemptId || null;
  if (checkout.stripeSessionId !== session.id && checkout.attemptId !== attemptId) return null;
  const eventCreated = Number(event.created || 0);
  const previousEventCreated = Number(checkout.latestEventCreated || 0);
  const ranks = { expired: 10, failed: 20, completed: 30 };
  const eventRank = ranks[status] || 0;
  const previousEventRank = Number(checkout.latestEventRank || 0);
  if (eventCreated && previousEventCreated && (
    eventCreated < previousEventCreated
    || eventCreated === previousEventCreated && eventRank < previousEventRank
  )) return null;
  return {
    ...checkout,
    status,
    stripeSessionId: session.id,
    latestEventId: event.id || checkout.latestEventId || null,
    latestEventCreated: eventCreated || previousEventCreated || null,
    latestEventRank: eventCreated ? eventRank : previousEventRank || null,
    [`${status}At`]: now,
    updatedAt: now
  };
}

function firebaseUidFrom(subscription, context = {}) {
  const candidates = [
    subscription.metadata?.firebaseUid,
    context.firebaseUid,
    context.session?.metadata?.firebaseUid,
    context.session?.client_reference_id
  ].filter(Boolean);
  if (new Set(candidates).size > 1) {
    throw new Error(`Stripe subscription ${subscription.id} has inconsistent Firebase user IDs.`);
  }
  return candidates[0] || null;
}

function invoiceSubscriptionId(invoice) {
  const subscription = invoice.subscription || invoice.parent?.subscription_details?.subscription;
  return typeof subscription === 'string' ? subscription : subscription?.id || null;
}

async function syncStripeSubscription(subscription, context = {}) {
  const userId = firebaseUidFrom(subscription, context);
  if (!userId) throw new Error(`Stripe subscription ${subscription.id} has no Firebase user ID.`);

  const memberRef = db.collection('members').doc(userId);
  const subscriptionStateRef = db.collection('stripe_subscription_states').doc(subscription.id);
  const processedEventRef = context.eventId
    ? db.collection('stripe_webhook_events').doc(context.eventId)
    : null;
  const { planType, billingCycle, price } = subscriptionDescriptor(subscription);
  const status = effectiveCrmStatus(subscription, context.forcedStatus);
  const periodEndSeconds = subscriptionPeriodEnd(subscription);
  const periodStartSeconds = subscriptionPeriodStart(subscription);
  const nextBillingDate = timestampFromUnix(periodEndSeconds);
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  const now = FieldValue.serverTimestamp();
  const eventCreated = Number(context.eventCreated || 0);
  const eventRank = subscriptionEventRank(context.eventType, status);
  const invoicePayment = context.invoice ? {
    amountMinor: Number(context.invoice.amount_paid),
    amount: minorUnitsToMajor(context.invoice.amount_paid, context.invoice.currency),
    currency: String(context.invoice.currency).toUpperCase(),
    paidAt: context.invoice.status_transitions?.paid_at || context.invoice.created
  } : null;

  return db.runTransaction(async transaction => {
    const memberSnap = await transaction.get(memberRef);
    if (!memberSnap.exists) throw new Error(`Firebase member ${userId} does not exist.`);
    const subscriptionStateSnap = await transaction.get(subscriptionStateRef);
    const processedEventSnap = processedEventRef ? await transaction.get(processedEventRef) : null;
    if (processedEventSnap?.exists) {
      return {
        userId,
        licenseCode: subscriptionStateSnap.data()?.licenseCode || memberSnap.data()?.subscription?.licenseCode || null,
        status: subscriptionStateSnap.data()?.status || memberSnap.data()?.subscription?.status || null,
        duplicate: true,
        stale: false
      };
    }

    const member = memberSnap.data();
    const previous = member.subscription || {};
    const subscriptionState = subscriptionStateSnap.exists ? subscriptionStateSnap.data() : {};
    if (subscriptionState.userId && subscriptionState.userId !== userId) {
      throw new Error(`Stripe subscription ${subscription.id} is already assigned to another Firebase user.`);
    }
    const latestSubscriptionEventCreated = Number(subscriptionState.latestEventCreated || 0);
    const latestSubscriptionEventRank = Number(subscriptionState.latestEventRank || 0);
    const stale = Boolean(eventCreated && latestSubscriptionEventCreated && (
      eventCreated < latestSubscriptionEventCreated
      || eventCreated === latestSubscriptionEventCreated && eventRank < latestSubscriptionEventRank
    ));
    const memberUsesIncomingSubscription = previous.stripeSubscriptionId === subscription.id;
    const canReuseLicense = subscriptionState.planType === planType
      && subscriptionState.billingCycle === billingCycle
      && subscriptionState.licenseCode
      || memberUsesIncomingSubscription
        && previous.planType === planType
        && previous.billingCycle === billingCycle
        && previous.licenseCode;
    const licenseCode = canReuseLicense
      ? subscriptionState.licenseCode || previous.licenseCode
      : licenseCodeFor(planType, billingCycle, subscription.id);

    // Payment and audit effects belong to the Stripe event, not to whichever
    // subscription currently owns the member profile. They must still be
    // committed for an older event or an older, replaced subscription.
    if (context.invoice) {
      const invoice = context.invoice;
      transaction.set(db.collection('subscription_payments').doc(`stripe_${invoice.id}`), {
        userId,
        userName: member.name || null,
        userEmail: member.email || null,
        planType,
        planLabel: PLANS[planType].label,
        billingCycle,
        licenseCode,
        stripePriceId: price.id,
        amount: invoicePayment.amount,
        amountMinor: invoicePayment.amountMinor,
        currency: invoicePayment.currency,
        invoiceUrl: invoice.invoice_pdf || invoice.hosted_invoice_url || null,
        paymentDate: timestampFromUnix(invoicePayment.paidAt),
        recordedAt: now,
        recordedBy: 'stripe_webhook',
        source: 'stripe',
        stripeInvoiceId: invoice.id,
        stripeSubscriptionId: subscription.id,
        stripeEventId: context.eventId || null
      }, { merge: true });
    }

    if (context.eventId) {
      transaction.set(db.collection('activities').doc(`stripe_${context.eventId}`), {
        memberId: userId,
        memberName: member.name || null,
        type: context.activityType || 'subscription_updated',
        payload: {
          planType,
          billingCycle,
          licenseCode,
          status,
          source: 'stripe',
          stripeSubscriptionId: subscription.id,
          stale
        },
        actorUid: null,
        actorEmail: null,
        actorRole: 'system',
        createdAt: now
      }, { merge: true });
      transaction.create(processedEventRef, {
        eventId: context.eventId,
        eventType: context.eventType || null,
        eventCreated: eventCreated || null,
        stripeSubscriptionId: subscription.id,
        userId,
        stale,
        processedAt: now
      });
    }

    if (stale) {
      if (context.invoice) {
        const historicalAccessGranted = subscriptionState.selectedForMember !== false
          && ['active', 'pending_payment'].includes(subscriptionState.status);
        transaction.set(subscriptionStateRef, {
          hasEverPaid: true,
          accessGranted: historicalAccessGranted,
          updatedAt: now
        }, { merge: true });
        transaction.set(db.collection('licenses').doc(licenseCode), {
          hasEverPaid: true,
          accessGranted: historicalAccessGranted,
          updatedAt: now
        }, { merge: true });
        if (memberUsesIncomingSubscription && ['active', 'pending_payment'].includes(previous.status)) {
          transaction.update(memberRef, {
            'subscription.hasEverPaid': true,
            'subscription.accessGranted': true,
            'subscription.updatedAt': now
          });
        }
      }
      if (context.session && context.checkoutStatus) {
        const billingCheckout = checkoutEventUpdate(
          member.billingCheckout || {},
          context.session,
          context.checkoutStatus,
          { id: context.eventId, created: eventCreated },
          now
        );
        if (billingCheckout) transaction.set(memberRef, { billingCheckout }, { merge: true });
      }
      return { userId, licenseCode, status: subscriptionState.status || previous.status, stale: true, duplicate: false };
    }

    const applyToMember = shouldApplyMemberSubscription(previous, subscription.id, status);
    const previousForGrace = memberUsesIncomingSubscription ? previous : {};
    const grace = stableGraceWindow(previousForGrace, subscription.id, status, {
      ...context,
      observedAtSeconds: Math.floor(Date.now() / 1000)
    });
    const startDate = subscriptionState.assignedAt
      || (memberUsesIncomingSubscription ? previous.startDate : null)
      || timestampFromUnix(subscription.start_date || periodStartSeconds);
    const { hasEverPaid, accessGranted } = subscriptionEntitlement({
      invoicePaid: Boolean(context.invoice),
      latestInvoicePaid: Boolean(
        typeof subscription.latest_invoice === 'object'
        && (subscription.latest_invoice.paid === true || subscription.latest_invoice.status === 'paid')
      ),
      stateHasEverPaid: Boolean(subscriptionState.hasEverPaid),
      previousHasEverPaid: Boolean(previous.hasEverPaid || previous.accessGranted),
      sameSubscription: memberUsesIncomingSubscription,
      stripeStatus: subscription.status,
      status
    });
    const subscriptionConflict = !applyToMember && !isTerminalSubscriptionStatus(status);
    const subscriptionStateRecord = {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId || null,
      planType,
      billingCycle,
      status,
      stripeStatus: subscription.status,
      stripePriceId: price.id,
      unitAmountMinor: price.unit_amount,
      currency: String(price.currency).toUpperCase(),
      licenseCode,
      hasEverPaid,
      accessGranted,
      selectedForMember: applyToMember,
      conflict: subscriptionConflict,
      assignedAt: startDate,
      currentPeriodStart: timestampFromUnix(periodStartSeconds),
      nextBillingDate,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      latestEventId: context.eventId || subscriptionState.latestEventId || null,
      latestEventCreated: eventCreated || latestSubscriptionEventCreated || null,
      latestEventRank: eventCreated ? eventRank : latestSubscriptionEventRank || null,
      updatedAt: now
    };
    transaction.set(subscriptionStateRef, subscriptionStateRecord, { merge: true });
    transaction.set(db.collection('licenses').doc(licenseCode), {
      code: licenseCode,
      userId,
      userName: member.name || null,
      userEmail: member.email || null,
      planType,
      planLabel: PLANS[planType].label,
      billingCycle,
      status: subscriptionConflict ? 'conflict' : status,
      stripeStatus: subscription.status,
      hasEverPaid,
      accessGranted: subscriptionConflict ? false : accessGranted,
      source: 'stripe',
      assignedTo: member.name || member.email || userId,
      assignedAt: startDate,
      nextBillingDate,
      stripeCustomerId: customerId || null,
      stripeSubscriptionId: subscription.id,
      stripePriceId: price.id,
      unitAmountMinor: price.unit_amount,
      currency: String(price.currency).toUpperCase(),
      updatedAt: now
    }, { merge: true });

    if (!applyToMember) {
      return { userId, licenseCode, status, stale: false, duplicate: false, superseded: true };
    }

    const subscriptionRecord = {
      planType,
      planLabel: PLANS[planType].label,
      billingCycle,
      status,
      stripeStatus: subscription.status,
      stripePriceId: price.id,
      unitAmountMinor: price.unit_amount,
      currency: String(price.currency).toUpperCase(),
      licenseCode,
      hasEverPaid,
      accessGranted,
      source: 'stripe',
      isManual: false,
      startDate,
      currentPeriodStart: timestampFromUnix(periodStartSeconds),
      nextBillingDate,
      graceStartedAt: grace.graceStartedAt,
      gracePeriodEnd: grace.gracePeriodEnd,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      stripeCustomerId: customerId || null,
      stripeSubscriptionId: subscription.id,
      stripeCheckoutSessionId: context.session?.id
        || (memberUsesIncomingSubscription ? previous.stripeCheckoutSessionId : null)
        || null,
      latestStripeEventId: context.eventId || (memberUsesIncomingSubscription ? previous.latestStripeEventId : null),
      latestStripeEventCreated: eventCreated
        || (memberUsesIncomingSubscription ? Number(previous.latestStripeEventCreated || 0) : null),
      updatedAt: now
    };
    const memberUpdate = { subscription: subscriptionRecord, licenseCode };
    if (context.session && context.checkoutStatus) {
      const billingCheckout = checkoutEventUpdate(
        member.billingCheckout || {},
        context.session,
        context.checkoutStatus,
        { id: context.eventId, created: eventCreated },
        now
      );
      if (billingCheckout) memberUpdate.billingCheckout = billingCheckout;
    }
    transaction.set(memberRef, memberUpdate, { merge: true });

    if (previous.stripeSubscriptionId && previous.stripeSubscriptionId !== subscription.id) {
      transaction.set(db.collection('stripe_subscription_states').doc(previous.stripeSubscriptionId), {
        selectedForMember: false,
        replacedBySubscriptionId: subscription.id,
        updatedAt: now
      }, { merge: true });
    }

    const previousLicenseCode = previous.licenseCode || member.licenseCode || null;
    if (previousLicenseCode
      && previousLicenseCode !== licenseCode
      && (memberUsesIncomingSubscription || isTerminalSubscriptionStatus(previous.status))) {
      transaction.set(db.collection('licenses').doc(previousLicenseCode), {
        status: 'replaced', accessGranted: false, replacedBy: licenseCode, replacedAt: now, updatedAt: now
      }, { merge: true });
    }

    return { userId, licenseCode, status, stale: false, duplicate: false, superseded: false };
  });
}

async function retrieveSubscription(subscriptionId) {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product', 'latest_invoice']
  });
}

async function canonicalSubscription(eventSubscription, eventType) {
  if (eventType === 'customer.subscription.deleted') return eventSubscription;
  try {
    return await retrieveSubscription(eventSubscription.id);
  } catch (error) {
    if (error?.code === 'resource_missing') return { ...eventSubscription, status: 'canceled' };
    throw error;
  }
}

async function recordCheckoutLifecycle(session, event, status, activityType) {
  const userId = session.metadata?.firebaseUid || session.client_reference_id || null;
  if (!userId) throw new Error(`Stripe Checkout Session ${session.id} has no Firebase user ID.`);
  const memberRef = db.collection('members').doc(userId);
  const eventRef = db.collection('stripe_webhook_events').doc(event.id);
  const now = FieldValue.serverTimestamp();
  return db.runTransaction(async transaction => {
    const memberSnap = await transaction.get(memberRef);
    const eventSnap = await transaction.get(eventRef);
    if (eventSnap.exists) return { duplicate: true };
    if (!memberSnap.exists) throw new Error(`Firebase member ${userId} does not exist.`);

    const member = memberSnap.data();
    const checkout = member.billingCheckout || {};
    const attemptId = session.metadata?.checkoutAttemptId || null;
    const matches = checkout.stripeSessionId === session.id || checkout.attemptId === attemptId;
    const billingCheckout = checkoutEventUpdate(checkout, session, status, event, now);
    if (billingCheckout) transaction.set(memberRef, { billingCheckout }, { merge: true });
    transaction.set(db.collection('activities').doc(`stripe_${event.id}`), {
      memberId: userId,
      memberName: member.name || null,
      type: activityType,
      payload: {
        source: 'stripe',
        stripeCheckoutSessionId: session.id,
        checkoutAttemptId: attemptId,
        status,
        matchedCheckout: matches,
        appliedToCheckout: Boolean(billingCheckout)
      },
      actorUid: null,
      actorEmail: null,
      actorRole: 'system',
      createdAt: now
    }, { merge: true });
    transaction.create(eventRef, {
      eventId: event.id,
      eventType: event.type,
      eventCreated: event.created || null,
      stripeCheckoutSessionId: session.id,
      userId,
      processedAt: now
    });
    return { duplicate: false, matches };
  });
}

// Stripe requires the unparsed request body to verify the webhook signature.
// This route must remain before express.json()/express.urlencoded().
app.post(['/webhook', '/api/billing/webhook'], express.raw({ type: 'application/json' }), async (request, response) => {
  try {
    const signature = request.get('stripe-signature');
    const event = stripe.webhooks.constructEvent(
      request.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        if (session.mode !== 'subscription' || !session.subscription) break;
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
        const subscription = await retrieveSubscription(subscriptionId);
        await syncStripeSubscription(subscription, {
          eventId: event.id,
          eventType: event.type,
          eventCreated: event.created,
          session,
          checkoutStatus: 'completed',
          firebaseUid: session.metadata?.firebaseUid,
          activityType: 'subscription_assigned'
        });
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object;
        if (session.mode === 'subscription') {
          await recordCheckoutLifecycle(session, event, 'expired', 'subscription_checkout_expired');
        }
        break;
      }
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;
        if (!session.subscription) {
          await recordCheckoutLifecycle(session, event, 'failed', 'subscription_checkout_payment_failed');
          break;
        }
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
        const subscription = await retrieveSubscription(subscriptionId);
        await syncStripeSubscription(subscription, {
          eventId: event.id,
          eventType: event.type,
          eventCreated: event.created,
          paymentFailedAt: event.created,
          forcedStatus: 'pending_payment',
          session,
          checkoutStatus: 'failed',
          firebaseUid: session.metadata?.firebaseUid,
          activityType: 'subscription_checkout_payment_failed'
        });
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoiceSubscriptionId(invoice);
        if (!subscriptionId) break;
        const subscription = await retrieveSubscription(subscriptionId);
        await syncStripeSubscription(subscription, {
          eventId: event.id,
          eventType: event.type,
          eventCreated: event.created,
          invoice,
          activityType: 'subscription_payment_received'
        });
        break;
      }
      case 'invoice.payment_failed':
      case 'invoice.payment_action_required':
      case 'invoice.finalization_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoiceSubscriptionId(invoice);
        if (!subscriptionId) break;
        const subscription = await retrieveSubscription(subscriptionId);
        await syncStripeSubscription(subscription, {
          eventId: event.id,
          eventType: event.type,
          eventCreated: event.created,
          paymentFailedAt: invoice.created || event.created,
          forcedStatus: 'pending_payment',
          activityType: event.type === 'invoice.payment_failed'
            ? 'subscription_payment_failed'
            : event.type === 'invoice.payment_action_required'
              ? 'subscription_payment_action_required'
              : 'subscription_invoice_finalization_failed'
        });
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
      case 'customer.subscription.deleted': {
        const subscription = await canonicalSubscription(event.data.object, event.type);
        const activityTypes = {
          'customer.subscription.deleted': 'subscription_canceled',
          'customer.subscription.paused': 'subscription_paused',
          'customer.subscription.resumed': 'subscription_resumed'
        };
        await syncStripeSubscription(subscription, {
          eventId: event.id,
          eventType: event.type,
          eventCreated: event.created,
          activityType: activityTypes[event.type] || 'subscription_updated'
        });
        break;
      }
      default:
        break;
    }

    response.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook failed:', error);
    const statusCode = error.type === 'StripeSignatureVerificationError' ? 400 : 500;
    response.status(statusCode).json({ error: error.message });
  }
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '64kb' }));

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

function normalizedReturnPath(value) {
  const requestedPath = String(value || '/profiles');
  return /^\/(?:es\/|pt\/)?profiles(?:\.html)?$/.test(requestedPath) ? requestedPath : '/profiles';
}

function isStripeHostedUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'stripe.com' || url.hostname.endsWith('.stripe.com'));
  } catch (_error) {
    return false;
  }
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
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#06162d;color:#eaf3ff;font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#06162d;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px">
        <tr><td style="padding:0 8px 22px;color:#fff;font-size:21px;font-weight:700;letter-spacing:.08em"><span style="color:#28a8ff">λ</span> ELYSIUM</td></tr>
        <tr><td style="background:#0d2e55;border:1px solid #23598a;border-radius:18px;padding:34px">${content}</td></tr>
        <tr><td style="padding:20px 8px;color:#839bb7;font-size:12px;line-height:1.6;text-align:center">Elysium Digital Experiences · elysiumdr.eu</td></tr>
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
    <p style="margin:28px 0 4px"><a href="${escapeHtml(meeting.meetingUrl)}" style="display:inline-block;background:#fff;color:#071a33;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px">${escapeHtml(copy.join)}</a></p>`;
  const content = `
    <p style="margin:0 0 8px;color:#7fc9ff;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(heading)}</p>
    <h1 style="margin:0 0 18px;color:#fff;font-size:27px;line-height:1.25">${escapeHtml(meeting.title)}</h1>
    <p style="margin:0 0 24px;color:#c8d8e9;font-size:16px;line-height:1.6">${escapeHtml(copy.hello)} ${escapeHtml(meeting.clientName || '')}, ${escapeHtml(intro)}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#092441;border-radius:12px;padding:6px 18px;color:#eaf3ff">
      <tr><td style="padding:13px 0;color:#8fabca;font-size:13px">${escapeHtml(copy.yourTime)}</td><td style="padding:13px 0;text-align:right;font-weight:700">${escapeHtml(clientDate)}<br><span style="color:#8fabca;font-size:12px">${escapeHtml(meeting.clientTimeZone)}</span></td></tr>
      <tr><td style="padding:13px 0;border-top:1px solid #1c466e;color:#8fabca;font-size:13px">${escapeHtml(copy.adminTime)}</td><td style="padding:13px 0;border-top:1px solid #1c466e;text-align:right">${escapeHtml(adminDate)}<br><span style="color:#8fabca;font-size:12px">${escapeHtml(meeting.adminTimeZone)}</span></td></tr>
      <tr><td style="padding:13px 0;border-top:1px solid #1c466e;color:#8fabca;font-size:13px">${escapeHtml(copy.duration)}</td><td style="padding:13px 0;border-top:1px solid #1c466e;text-align:right">${Number(meeting.durationMinutes)} ${escapeHtml(copy.minutes)}</td></tr>
      <tr><td style="padding:13px 0;border-top:1px solid #1c466e;color:#8fabca;font-size:13px">${escapeHtml(copy.region)}</td><td style="padding:13px 0;border-top:1px solid #1c466e;text-align:right">${escapeHtml(meeting.clientRegion || meeting.clientTimeZone)}</td></tr>
    </table>
    ${notes ? `<p style="margin:22px 0 0;color:#a9bed3;font-size:14px;line-height:1.55"><strong style="color:#eaf3ff">${escapeHtml(copy.notes)}:</strong> ${escapeHtml(notes)}</p>` : ''}
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
  const row = (label, value, extra = '') => `
      <tr><td style="padding:13px 0;border-top:1px solid #1c466e;color:#8fabca;font-size:13px">${escapeHtml(label)}</td><td style="padding:13px 0;border-top:1px solid #1c466e;text-align:right">${escapeHtml(value)}${extra}</td></tr>`;
  const content = `
    <p style="margin:0 0 8px;color:#7fc9ff;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(heading)}</p>
    <h1 style="margin:0 0 18px;color:#fff;font-size:27px;line-height:1.25">${escapeHtml(meeting.title)}</h1>
    <p style="margin:0 0 24px;color:#c8d8e9;font-size:16px;line-height:1.6">${escapeHtml(intro)}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#092441;border-radius:12px;padding:6px 18px;color:#eaf3ff">
      <tr><td style="padding:13px 0;color:#8fabca;font-size:13px">${escapeHtml(copy.adminClient)}</td><td style="padding:13px 0;text-align:right;font-weight:700">${escapeHtml(meeting.clientName || '—')}</td></tr>
      ${row(copy.adminEmail, meeting.clientEmail || '—')}
      ${row(copy.adminTime, adminDate, `<br><span style="color:#8fabca;font-size:12px">${escapeHtml(meeting.adminTimeZone)}</span>`)}
      ${row(copy.yourTime, clientDate, `<br><span style="color:#8fabca;font-size:12px">${escapeHtml(meeting.clientTimeZone)}</span>`)}
      ${row(copy.duration, `${Number(meeting.durationMinutes)} ${copy.minutes}`)}
      ${row(copy.region, meeting.clientRegion || meeting.clientTimeZone || '—')}
    </table>
    ${notes ? `<p style="margin:22px 0 0;color:#a9bed3;font-size:14px;line-height:1.55"><strong style="color:#eaf3ff">${escapeHtml(copy.notes)}:</strong> ${escapeHtml(notes)}</p>` : ''}
    <p style="margin:28px 0 4px">
      ${cancelled ? '' : `<a href="${escapeHtml(meeting.meetingUrl)}" style="display:inline-block;background:#fff;color:#071a33;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px">${escapeHtml(copy.join)}</a>&nbsp;`}
      <a href="${escapeHtml(crmUrl)}" style="display:inline-block;border:1px solid #23598a;color:#cfe6ff;text-decoration:none;font-weight:700;padding:13px 23px;border-radius:999px">${escapeHtml(copy.adminOpenCrm)}</a>
    </p>`;
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

function meetingResendPayload(meeting, kind = 'confirmation', audience = 'client') {
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
      content: Buffer.from(buildMeetingIcs(meeting, kind), 'utf8').toString('base64')
    }]
  };
}

async function sendResendEmail(payload, idempotencyKey, fetchImpl = globalThis.fetch) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (!apiKey || !payload.from) {
    const error = new Error('Email delivery is not configured.');
    error.code = 'email_not_configured';
    throw error;
  }
  if (typeof fetchImpl !== 'function') throw new Error('fetch is unavailable.');
  const result = await fetchImpl('https://api.resend.com/emails', {
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
    error.code = 'email_delivery_failed';
    error.status = result.status;
    throw error;
  }
  const data = await result.json();
  if (!data?.id) {
    const error = new Error('Email provider returned no delivery ID.');
    error.code = 'email_delivery_failed';
    throw error;
  }
  return data;
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

async function deliverMeetingNotification(meetingId, kind, fetchImpl = globalThis.fetch) {
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
      sendResendEmail(meetingResendPayload(meeting, kind, 'client'), claim.idempotencyKey, fetchImpl),
      adminEmail
        ? sendResendEmail(meetingResendPayload(meeting, kind, 'admin'), `${claim.idempotencyKey}-admin`, fetchImpl)
        : Promise.resolve(null)
    ]);
    await finishMeetingNotification(meetingId, kind, claim.attemptId, {
      status: 'sent',
      provider: 'resend',
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
    <p style="margin:0 0 8px;color:#7fc9ff;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Elysium Security</p>
    <h1 style="margin:0 0 18px;color:#fff;font-size:27px">${escapeHtml(copy.heading)}</h1>
    <p style="margin:0 0 24px;color:#c8d8e9;font-size:16px;line-height:1.6">${escapeHtml(copy.intro)}</p>
    <p style="margin:0 0 24px"><a href="${escapeHtml(resetLink)}" style="display:inline-block;background:#fff;color:#071a33;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px">${escapeHtml(copy.button)}</a></p>
    <p style="margin:0;color:#8fa8c2;font-size:13px;line-height:1.6">${escapeHtml(copy.expiry)}</p>`;
  return {
    from: process.env.PASSWORD_RESET_FROM_EMAIL || process.env.MEETING_FROM_EMAIL || '',
    to: [email],
    subject: copy.subject,
    html: emailTheme(content, copy.subject),
    text: `${copy.intro}\n${copy.button}: ${resetLink}\n\n${copy.expiry}`
  };
}

function passwordResetEmailConfigured() {
  return Boolean(
    String(process.env.RESEND_API_KEY || '').trim()
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

async function configuredPrice(planType, billingCycle) {
  const lookupKey = LOOKUP_KEYS[planType]?.[billingCycle];
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 10,
    expand: ['data.product']
  });
  const validPrices = [];
  const validationErrors = [];
  for (const price of prices.data) {
    try {
      validPrices.push(validateStripePrice(price, planType, billingCycle));
    } catch (error) {
      validationErrors.push(error.message);
    }
  }
  if (validPrices.length !== 1) {
    const detail = validationErrors.length ? ` ${validationErrors.join(' ')}` : '';
    throw new Error(`Stripe lookup key '${lookupKey}' must resolve to exactly one valid EUR recurring Price.${detail}`);
  }
  return validPrices[0];
}

async function claimCheckoutAttempt(userId, requestData) {
  const memberRef = db.collection('members').doc(userId);
  const nowMillis = Date.now();
  const expiresAtSeconds = Math.floor(nowMillis / 1000) + CHECKOUT_SESSION_SECONDS;
  const attemptId = crypto.randomUUID();
  const fingerprint = checkoutFingerprint({ userId, ...requestData });
  return db.runTransaction(async transaction => {
    const memberSnap = await transaction.get(memberRef);
    const member = memberSnap.exists ? memberSnap.data() : null;
    const decision = checkoutDecision(member, fingerprint, nowMillis);
    if (decision.kind !== 'claim') return { ...decision, member };

    const checkout = {
      attemptId,
      fingerprint,
      status: 'creating',
      planType: requestData.planType,
      billingCycle: requestData.billingCycle,
      priceId: requestData.priceId,
      baseUrl: requestData.baseUrl,
      returnPath: requestData.returnPath,
      stripeCustomerId: member.subscription?.stripeCustomerId || null,
      customerEmail: requestData.customerEmail,
      expiresAt: timestampFromUnix(expiresAtSeconds),
      expiresAtSeconds,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    transaction.set(memberRef, { billingCheckout: checkout }, { merge: true });
    return { kind: 'create', checkout, member };
  });
}

async function updateCheckoutAttempt(userId, attemptId, patch) {
  const memberRef = db.collection('members').doc(userId);
  return db.runTransaction(async transaction => {
    const memberSnap = await transaction.get(memberRef);
    if (!memberSnap.exists) return false;
    const checkout = memberSnap.data().billingCheckout || {};
    if (checkout.attemptId !== attemptId) return false;
    if (checkout.status === 'completed' && patch.status !== 'completed') return false;
    if (checkout.latestEventCreated && ['creating', 'open'].includes(patch.status)) return false;
    if (checkout.latestEventCreated && checkout.status === 'failed' && patch.status === 'completed') return false;
    transaction.set(memberRef, {
      billingCheckout: { ...checkout, ...patch, updatedAt: FieldValue.serverTimestamp() }
    }, { merge: true });
    return true;
  });
}

async function markMissingSubscriptionCanceled(userId, stripeSubscriptionId) {
  const memberRef = db.collection('members').doc(userId);
  return db.runTransaction(async transaction => {
    const memberSnap = await transaction.get(memberRef);
    if (!memberSnap.exists) return false;
    const member = memberSnap.data();
    const subscription = member.subscription || {};
    if (subscription.stripeSubscriptionId !== stripeSubscriptionId) return false;
    const now = FieldValue.serverTimestamp();
    transaction.set(memberRef, {
      subscription: {
        ...subscription,
        status: 'canceled',
        stripeStatus: 'missing',
        accessGranted: false,
        graceStartedAt: null,
        gracePeriodEnd: null,
        updatedAt: now
      }
    }, { merge: true });
    transaction.set(db.collection('stripe_subscription_states').doc(stripeSubscriptionId), {
      status: 'canceled', stripeStatus: 'missing', accessGranted: false, updatedAt: now
    }, { merge: true });
    if (subscription.licenseCode) {
      transaction.set(db.collection('licenses').doc(subscription.licenseCode), {
        status: 'canceled', stripeStatus: 'missing', accessGranted: false, updatedAt: now
      }, { merge: true });
    }
    return true;
  });
}

async function recoverExistingSubscription(userId, member) {
  const checkout = member.billingCheckout || {};
  if (checkout.stripeSessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(checkout.stripeSessionId);
      if (session.status === 'open') {
        if (!isStripeHostedUrl(session.url)) throw new Error('Open Stripe Checkout Session has no valid hosted URL.');
        return { kind: 'url', url: session.url, recovery: true };
      }
      if (session.status === 'expired') {
        await updateCheckoutAttempt(userId, checkout.attemptId, { status: 'expired' });
      } else if (session.status === 'complete') {
        await updateCheckoutAttempt(userId, checkout.attemptId, { status: 'completed' });
      }
    } catch (error) {
      if (error?.code !== 'resource_missing') throw error;
    }
  }

  const storedSubscription = member.subscription || {};
  const subscriptionId = storedSubscription.stripeSubscriptionId;
  if (!subscriptionId) {
    return {
      kind: 'blocked',
      code: 'subscription_exists',
      portalAvailable: false,
      error: 'A non-Stripe subscription already exists.'
    };
  }

  let subscription;
  try {
    subscription = await retrieveSubscription(subscriptionId);
  } catch (error) {
    if (error?.code !== 'resource_missing') throw error;
    await markMissingSubscriptionCanceled(userId, subscriptionId);
    return { kind: 'retry' };
  }
  const canonicalLatestInvoice = typeof subscription.latest_invoice === 'object'
    ? subscription.latest_invoice
    : null;
  const canonicalInvoicePaid = canonicalLatestInvoice?.paid === true || canonicalLatestInvoice?.status === 'paid';
  const preservePendingPayment = storedSubscription.status === 'pending_payment'
    && subscription.status === 'active'
    && !canonicalInvoicePaid;
  await syncStripeSubscription(subscription, {
    firebaseUid: userId,
    observedAtSeconds: Math.floor(Date.now() / 1000),
    forcedStatus: preservePendingPayment ? 'pending_payment' : null,
    activityType: 'subscription_reconciled'
  });

  const currentStatus = preservePendingPayment ? 'pending_payment' : effectiveCrmStatus(subscription);
  if (isTerminalSubscriptionStatus(currentStatus)) return { kind: 'retry' };
  const latestInvoice = canonicalLatestInvoice;
  const needsPaymentRecovery = currentStatus === 'pending_payment';
  if (needsPaymentRecovery && isStripeHostedUrl(latestInvoice?.hosted_invoice_url)) {
    return { kind: 'url', url: latestInvoice.hosted_invoice_url, recovery: true };
  }
  return {
    kind: 'blocked',
    code: needsPaymentRecovery
      ? 'payment_recovery_required'
      : 'subscription_exists',
    portalAvailable: Boolean(
      (typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id)
      || storedSubscription.stripeCustomerId
    ),
    error: needsPaymentRecovery
      ? 'Payment must be completed through the billing portal.'
      : 'An active subscription already exists. Manage it through the billing portal.'
  };
}

function checkoutSessionPayload(userId, checkout) {
  const metadata = {
    firebaseUid: userId,
    planType: checkout.planType,
    billingCycle: checkout.billingCycle,
    checkoutAttemptId: checkout.attemptId
  };
  return {
    billing_address_collection: 'auto',
    client_reference_id: userId,
    customer: checkout.stripeCustomerId || undefined,
    customer_email: checkout.stripeCustomerId ? undefined : checkout.customerEmail,
    line_items: [{ price: checkout.priceId, quantity: 1 }],
    mode: 'subscription',
    metadata,
    subscription_data: { metadata },
    success_url: `${checkout.baseUrl}${checkout.returnPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${checkout.baseUrl}${checkout.returnPath}?checkout=cancelled`,
    expires_at: checkout.expiresAtSeconds
  };
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
        await sendResendEmail(passwordResetEmail(email, resetLink, locale), deliveryKey);
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

    let delivery;
    try {
      delivery = await deliverMeetingNotification(meetingId, 'confirmation');
    } catch (error) {
      console.error('Meeting confirmation delivery failed:', meetingId, error?.code || error?.message);
      return response.status(error?.code === 'email_not_configured' ? 503 : 502).json({
        error: 'The meeting was saved, but its confirmation email could not be delivered. Retry with the same idempotency key.',
        code: 'meeting_saved_email_failed',
        meetingId
      });
    }
    const persisted = await meetingRef.get();
    const status = delivery.kind === 'in_progress' ? 202 : result.kind === 'created' ? 201 : 200;
    return response.status(status).json({
      meeting: serializeMeeting(meetingId, persisted.data()),
      emailStatus: delivery.kind,
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

    let delivery;
    try {
      delivery = await deliverMeetingNotification(meetingId, 'cancellation');
    } catch (error) {
      console.error('Meeting cancellation delivery failed:', meetingId, error?.code || error?.message);
      return response.status(error?.code === 'email_not_configured' ? 503 : 502).json({
        error: 'The meeting was cancelled, but its cancellation email could not be delivered. Retry this request.',
        code: 'meeting_cancelled_email_failed',
        meetingId
      });
    }
    const persisted = await meetingRef.get();
    return response.status(delivery.kind === 'in_progress' ? 202 : 200).json({
      meeting: serializeMeeting(meetingId, persisted.data()),
      emailStatus: delivery.kind,
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

app.get(['/health', '/api/health', '/api/billing/health'], (_request, response) => {
  response.json({ ok: true, service: 'elysium-platform-api' });
});

app.post(['/create-checkout-session', '/api/billing/create-checkout-session'], requireFirebaseUser, async (request, response) => {
  try {
    const planType = String(request.body.planType || '');
    const billingCycle = String(request.body.billingCycle || '');
    const lookupKey = LOOKUP_KEYS[planType]?.[billingCycle];
    if (!PLANS[planType] || PLANS[planType].retired || !PERIOD_CODES[billingCycle] || !lookupKey) {
      return response.status(400).json({ error: 'Invalid plan or billing cycle.' });
    }
    const userId = request.firebaseUser.uid;
    const returnPath = normalizedReturnPath(request.body.returnPath);
    const baseUrl = publicOrigin(request);
    let price = null;

    const initialMemberSnap = await db.collection('members').doc(userId).get();
    if (!initialMemberSnap.exists) return response.status(404).json({ error: 'Member profile not found.' });
    const initialMember = initialMemberSnap.data();
    if (initialMember.isDeactivated === true) {
      return response.status(403).json({ error: 'This account is deactivated.', code: 'account_deactivated' });
    }
    if (initialMember.subscription && !isTerminalSubscriptionStatus(initialMember.subscription.status)) {
      const recovery = await recoverExistingSubscription(userId, initialMember);
      if (recovery.kind === 'url') return response.json(recovery);
      if (recovery.kind === 'blocked') return response.status(409).json(recovery);
    }

    for (let pass = 0; pass < 3; pass += 1) {
      if (!price) {
        try {
          price = await configuredPrice(planType, billingCycle);
        } catch (error) {
          console.error('Stripe Price configuration failed:', error);
          return response.status(409).json({
            error: 'This billing option is not configured correctly.',
            code: 'billing_price_invalid'
          });
        }
      }

      const decision = await claimCheckoutAttempt(userId, {
        planType,
        billingCycle,
        priceId: price.id,
        baseUrl,
        returnPath,
        customerEmail: request.firebaseUser.email
      });
      if (decision.kind === 'missing_member') {
        return response.status(404).json({ error: 'Member profile not found.' });
      }
      if (decision.kind === 'deactivated') {
        return response.status(403).json({ error: 'This account is deactivated.', code: 'account_deactivated' });
      }
      if (decision.kind === 'conflict') {
        return response.status(409).json({
          error: 'Another checkout is already in progress.',
          code: 'checkout_in_progress'
        });
      }
      if (decision.kind === 'processing') {
        return response.status(409).json({
          error: 'Your previous payment is still being confirmed.',
          code: 'checkout_processing'
        });
      }
      if (decision.kind === 'subscription') {
        const recovery = await recoverExistingSubscription(userId, decision.member);
        if (recovery.kind === 'retry') continue;
        if (recovery.kind === 'url') return response.json(recovery);
        return response.status(409).json(recovery);
      }
      if (decision.kind === 'reuse') {
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(decision.checkout.stripeSessionId);
          if (existingSession.status === 'open') {
            if (!isStripeHostedUrl(existingSession.url)) {
              throw new Error('Open Stripe Checkout Session has no valid hosted URL.');
            }
            return response.json({ url: existingSession.url, reused: true });
          }
          await updateCheckoutAttempt(userId, decision.checkout.attemptId, {
            status: existingSession.status === 'complete' ? 'completed' : 'expired'
          });
          if (existingSession.status === 'complete') {
            return response.status(409).json({
              error: 'Your previous payment is still being confirmed.',
              code: 'checkout_processing'
            });
          }
          continue;
        } catch (error) {
          if (error?.code !== 'resource_missing') throw error;
          await updateCheckoutAttempt(userId, decision.checkout.attemptId, { status: 'expired' });
          continue;
        }
      }

      const checkout = decision.checkout;
      const idempotencyKey = `ely_checkout_${checkout.attemptId}`;
      let session;
      try {
        session = await stripe.checkout.sessions.create(
          checkoutSessionPayload(userId, checkout),
          { idempotencyKey }
        );
      } catch (error) {
        if (Number(error?.statusCode) >= 400 && Number(error?.statusCode) < 500) {
          await updateCheckoutAttempt(userId, checkout.attemptId, {
            status: 'failed',
            failureCode: error.code || error.type || 'stripe_request_rejected'
          });
        }
        throw error;
      }
      await updateCheckoutAttempt(userId, checkout.attemptId, {
        status: session.status === 'complete' ? 'completed' : 'open',
        stripeSessionId: session.id,
        expiresAt: timestampFromUnix(session.expires_at || checkout.expiresAtSeconds),
        expiresAtSeconds: session.expires_at || checkout.expiresAtSeconds
      });
      if (!isStripeHostedUrl(session.url)) throw new Error('Stripe Checkout Session has no valid hosted URL.');
      return response.json({ url: session.url, reused: decision.kind === 'resume' });
    }

    return response.status(409).json({
      error: 'Billing state changed while checkout was starting. Please try again.',
      code: 'checkout_state_changed'
    });
  } catch (error) {
    console.error('Checkout session failed:', error);
    return response.status(500).json({ error: 'Unable to start secure checkout.' });
  }
});

app.post(['/create-portal-session', '/api/billing/create-portal-session'], requireFirebaseUser, async (request, response) => {
  try {
    const memberSnap = await db.collection('members').doc(request.firebaseUser.uid).get();
    if (!memberSnap.exists) return response.status(404).json({ error: 'Member profile not found.' });
    const member = memberSnap.data();
    if (member.isDeactivated === true) {
      return response.status(403).json({ error: 'This account is deactivated.', code: 'account_deactivated' });
    }
    if (member.subscription && ['pending_payment', 'suspended'].includes(member.subscription.status)) {
      const recovery = await recoverExistingSubscription(request.firebaseUser.uid, member);
      if (recovery.kind === 'url') return response.json(recovery);
    }
    const customerId = member.subscription?.stripeCustomerId;
    if (!customerId) return response.status(409).json({ error: 'This subscription is not managed by Stripe.' });

    const returnPath = normalizedReturnPath(request.body.returnPath);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${publicOrigin(request)}${returnPath}`
    });
    return response.json({ url: session.url });
  } catch (error) {
    console.error('Billing portal failed:', error);
    return response.status(500).json({ error: 'Unable to open the billing portal.' });
  }
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
  syncStripeSubscription,
  licenseCodeFor,
  crmStatus,
  effectiveCrmStatus,
  validateStripePrice,
  subscriptionDescriptor,
  minorUnitsToMajor,
  stableGraceWindow,
  subscriptionEntitlement,
  shouldApplyMemberSubscription,
  subscriptionEventRank,
  checkoutFingerprint,
  checkoutDecision,
  checkoutEventUpdate,
  normalizedReturnPath,
  isStripeHostedUrl,
  checkoutSessionPayload,
  MeetingValidationError,
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
  adminNotificationEmail,
  buildMeetingIcs,
  meetingResendPayload,
  sendResendEmail,
  serializeMeeting,
  passwordResetRateLimited,
  passwordResetEmail,
  passwordResetEmailConfigured,
  passwordResetContinueUrl
};
