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
const PORT = Number(process.env.PORT || 4242);
const GRACE_PERIOD_DAYS = 15;

const PLANS = {
  hosting:      { code: 'H0ST', label: 'Domain & Hosting' },
  basic:        { code: 'EC01', label: 'Presence' },
  preferential: { code: 'EC02', label: 'System' },
  advanced:     { code: 'EC03', label: 'Operations' },
  crm:          { code: 'CRMP', label: 'Custom Core CRM' }
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
    return { ...DEFAULT_LOOKUP_KEYS, ...JSON.parse(process.env.STRIPE_LOOKUP_KEYS_JSON) };
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
  'http://127.0.0.1:8787'
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
    response.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (request.method === 'OPTIONS') return response.sendStatus(204);
  return next();
});

function timestampFromUnix(seconds) {
  return seconds ? Timestamp.fromMillis(seconds * 1000) : null;
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

function billingCycleFromSubscription(subscription) {
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
  return interval === 'year' ? 'annual' : 'monthly';
}

function planFromSubscription(subscription) {
  const metadataPlan = subscription.metadata?.planType;
  if (PLANS[metadataPlan]) return metadataPlan;

  const lookupKey = subscription.items?.data?.[0]?.price?.lookup_key;
  for (const [planType, cycles] of Object.entries(LOOKUP_KEYS)) {
    if (Object.values(cycles).includes(lookupKey)) return planType;
  }
  throw new Error(`Cannot map Stripe subscription ${subscription.id} to an Elysium plan.`);
}

function firebaseUidFrom(subscription, context = {}) {
  return subscription.metadata?.firebaseUid || context.firebaseUid || context.session?.client_reference_id || null;
}

function invoiceSubscriptionId(invoice) {
  const subscription = invoice.subscription || invoice.parent?.subscription_details?.subscription;
  return typeof subscription === 'string' ? subscription : subscription?.id || null;
}

async function syncStripeSubscription(subscription, context = {}) {
  const userId = firebaseUidFrom(subscription, context);
  if (!userId) throw new Error(`Stripe subscription ${subscription.id} has no Firebase user ID.`);

  const memberRef = db.collection('members').doc(userId);
  const memberSnap = await memberRef.get();
  if (!memberSnap.exists) throw new Error(`Firebase member ${userId} does not exist.`);

  const member = memberSnap.data();
  const planType = planFromSubscription(subscription);
  const billingCycle = subscription.metadata?.billingCycle || billingCycleFromSubscription(subscription);
  const status = context.forcedStatus || crmStatus(subscription.status);
  const periodEndSeconds = subscriptionPeriodEnd(subscription);
  const periodStartSeconds = subscriptionPeriodStart(subscription);
  const nextBillingDate = timestampFromUnix(periodEndSeconds);
  const gracePeriodEnd = status === 'pending_payment' && periodEndSeconds
    ? Timestamp.fromMillis((periodEndSeconds + GRACE_PERIOD_DAYS * 86400) * 1000)
    : null;
  const existingLicense = member.subscription?.licenseCode || member.licenseCode || null;
  const licenseCode = existingLicense || licenseCodeFor(planType, billingCycle, subscription.id);
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  const now = FieldValue.serverTimestamp();

  const subscriptionRecord = {
    planType,
    planLabel: PLANS[planType].label,
    billingCycle,
    status,
    licenseCode,
    source: 'stripe',
    isManual: false,
    startDate: timestampFromUnix(subscription.start_date || periodStartSeconds),
    currentPeriodStart: timestampFromUnix(periodStartSeconds),
    nextBillingDate,
    gracePeriodEnd,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    stripeCustomerId: customerId || null,
    stripeSubscriptionId: subscription.id,
    stripeCheckoutSessionId: context.session?.id || member.subscription?.stripeCheckoutSessionId || null,
    latestStripeEventId: context.eventId || null,
    updatedAt: now
  };

  const batch = db.batch();
  batch.set(memberRef, { subscription: subscriptionRecord, licenseCode }, { merge: true });
  batch.set(db.collection('licenses').doc(licenseCode), {
    code: licenseCode,
    userId,
    userName: member.name || null,
    userEmail: member.email || null,
    planType,
    planLabel: PLANS[planType].label,
    billingCycle,
    status,
    source: 'stripe',
    assignedTo: member.name || member.email || userId,
    assignedAt: member.subscription?.startDate || timestampFromUnix(subscription.start_date),
    nextBillingDate,
    stripeCustomerId: customerId || null,
    stripeSubscriptionId: subscription.id,
    updatedAt: now
  }, { merge: true });

  if (context.invoice) {
    const invoice = context.invoice;
    const paidAt = invoice.status_transitions?.paid_at || invoice.created;
    batch.set(db.collection('subscription_payments').doc(`stripe_${invoice.id}`), {
      userId,
      userName: member.name || null,
      userEmail: member.email || null,
      planType,
      planLabel: PLANS[planType].label,
      billingCycle,
      licenseCode,
      amount: Number(invoice.amount_paid || 0) / 100,
      currency: String(invoice.currency || 'eur').toUpperCase(),
      invoiceUrl: invoice.invoice_pdf || invoice.hosted_invoice_url || null,
      paymentDate: timestampFromUnix(paidAt),
      recordedAt: now,
      recordedBy: 'stripe_webhook',
      source: 'stripe',
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId: subscription.id,
      stripeEventId: context.eventId || null
    }, { merge: true });
  }

  if (context.eventId) {
    batch.set(db.collection('activities').doc(`stripe_${context.eventId}`), {
      memberId: userId,
      memberName: member.name || null,
      type: context.activityType || 'subscription_updated',
      payload: { planType, billingCycle, licenseCode, status, source: 'stripe' },
      actorUid: null,
      actorEmail: null,
      actorRole: 'system',
      createdAt: now
    }, { merge: true });
  }

  await batch.commit();
  return { userId, licenseCode, status };
}

async function retrieveSubscription(subscriptionId) {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price']
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
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription' || !session.subscription) break;
        const subscription = await retrieveSubscription(session.subscription);
        await syncStripeSubscription(subscription, {
          eventId: event.id,
          session,
          firebaseUid: session.metadata?.firebaseUid,
          activityType: 'subscription_assigned'
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
          invoice,
          activityType: 'subscription_payment_received'
        });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoiceSubscriptionId(invoice);
        if (!subscriptionId) break;
        const subscription = await retrieveSubscription(subscriptionId);
        await syncStripeSubscription(subscription, {
          eventId: event.id,
          forcedStatus: 'pending_payment',
          activityType: 'subscription_payment_failed'
        });
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncStripeSubscription(event.data.object, {
          eventId: event.id,
          activityType: event.type === 'customer.subscription.deleted' ? 'subscription_canceled' : 'subscription_updated'
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
    const authorization = request.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) return response.status(401).json({ error: 'Authentication required.' });
    request.firebaseUser = await firebaseAuth.verifyIdToken(match[1]);
    return next();
  } catch (error) {
    return response.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

app.get(['/health', '/api/billing/health'], (_request, response) => {
  response.json({ ok: true, service: 'elysium-billing' });
});

app.post(['/create-checkout-session', '/api/billing/create-checkout-session'], requireFirebaseUser, async (request, response) => {
  try {
    const planType = String(request.body.planType || '');
    const billingCycle = String(request.body.billingCycle || '');
    const lookupKey = LOOKUP_KEYS[planType]?.[billingCycle];
    if (!PLANS[planType] || !PERIOD_CODES[billingCycle] || !lookupKey) {
      return response.status(400).json({ error: 'Invalid plan or billing cycle.' });
    }

    const memberRef = db.collection('members').doc(request.firebaseUser.uid);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) return response.status(404).json({ error: 'Member profile not found.' });
    const member = memberSnap.data();

    const prices = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    const price = prices.data[0];
    if (!price) return response.status(409).json({ error: `Stripe price '${lookupKey}' is not configured.` });

    const requestedPath = String(request.body.returnPath || '/profiles.html');
    const returnPath = /^\/(?:es\/|pt\/)?profiles\.html$/.test(requestedPath) ? requestedPath : '/profiles.html';
    const baseUrl = publicOrigin(request);
    const metadata = {
      firebaseUid: request.firebaseUser.uid,
      planType,
      billingCycle
    };
    const existingCustomerId = member.subscription?.stripeCustomerId;
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      client_reference_id: request.firebaseUser.uid,
      customer: existingCustomerId || undefined,
      customer_email: existingCustomerId ? undefined : request.firebaseUser.email,
      line_items: [{ price: price.id, quantity: 1 }],
      mode: 'subscription',
      metadata,
      subscription_data: { metadata },
      success_url: `${baseUrl}${returnPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${returnPath}?checkout=cancelled`
    });

    return response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session failed:', error);
    return response.status(500).json({ error: 'Unable to start secure checkout.' });
  }
});

app.post(['/create-portal-session', '/api/billing/create-portal-session'], requireFirebaseUser, async (request, response) => {
  try {
    const memberSnap = await db.collection('members').doc(request.firebaseUser.uid).get();
    const customerId = memberSnap.data()?.subscription?.stripeCustomerId;
    if (!customerId) return response.status(409).json({ error: 'This subscription is not managed by Stripe.' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${publicOrigin(request)}/profiles.html`
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
    console.log(`Elysium billing service listening on port ${PORT}`);
  });
}

module.exports = { app, syncStripeSubscription, licenseCodeFor, crmStatus };
