'use strict';

process.env.STRIPE_SECRET_KEY ||= 'sk_test_elysium_unit_tests';
process.env.STRIPE_WEBHOOK_SECRET ||= 'whsec_elysium_unit_tests';
process.env.GCLOUD_PROJECT ||= 'elysium-unit-tests';
process.env.MEETING_FROM_EMAIL ||= 'Elysium <meetings@elysiumdr.eu>';
process.env.PASSWORD_RESET_FROM_EMAIL ||= 'Elysium Security <security@elysiumdr.eu>';
process.env.RESEND_API_KEY ||= 're_test_elysium_unit_tests';
process.env.PUBLIC_BASE_URL ||= 'https://elysiumdr.eu';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Timestamp } = require('firebase-admin/firestore');
const {
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
  validateIanaTimeZone,
  resolveZonedLocalDateTime,
  normalizeMeetingInput,
  normalizedIdempotencyKey,
  meetingIdForRequest,
  meetingRequestFingerprint,
  buildMeetingEmail,
  buildMeetingIcs,
  meetingResendPayload,
  sendResendEmail,
  serializeMeeting,
  passwordResetRateLimited,
  passwordResetEmail,
  passwordResetEmailConfigured,
  passwordResetContinueUrl
} = require('./stripe-server');

function recurringPrice(overrides = {}) {
  return {
    id: 'price_basic_monthly',
    active: true,
    lookup_key: 'basic_maintenance',
    type: 'recurring',
    currency: 'eur',
    unit_amount: 7000,
    recurring: { interval: 'month', interval_count: 1 },
    product: { active: true },
    ...overrides
  };
}

function subscription(overrides = {}) {
  return {
    id: 'sub_123',
    status: 'active',
    metadata: { planType: 'basic', billingCycle: 'monthly', firebaseUid: 'uid_1' },
    items: { data: [{ quantity: 1, price: recurringPrice() }] },
    ...overrides
  };
}

test('maps every relevant Stripe status to a CRM status', () => {
  assert.equal(crmStatus('trialing'), 'active');
  assert.equal(crmStatus('incomplete'), 'pending_payment');
  assert.equal(crmStatus('paused'), 'suspended');
  assert.equal(crmStatus('incomplete_expired'), 'canceled');
  assert.equal(effectiveCrmStatus({
    status: 'active', latest_invoice: { status: 'open', paid: false, amount_due: 1900 }
  }), 'pending_payment');
  assert.equal(effectiveCrmStatus({
    status: 'active', latest_invoice: { status: 'paid', paid: true, amount_due: 1900 }
  }), 'active');
});

test('accepts only the configured recurring EUR Price and exact cycle', () => {
  assert.equal(validateStripePrice(recurringPrice(), 'basic', 'monthly').id, 'price_basic_monthly');
  assert.throws(() => validateStripePrice(recurringPrice({ currency: 'usd' }), 'basic', 'monthly'), /EUR/);
  assert.throws(() => validateStripePrice(recurringPrice({ type: 'one_time', recurring: null }), 'basic', 'monthly'), /recurring/);
  assert.throws(() => validateStripePrice(recurringPrice({ recurring: { interval: 'year', interval_count: 1 } }), 'basic', 'monthly'), /interval/);
  assert.throws(() => validateStripePrice(recurringPrice({ recurring: { interval: 'month', interval_count: 1, usage_type: 'metered' } }), 'basic', 'monthly'), /licensed/);
  assert.throws(() => validateStripePrice(recurringPrice({ active: false }), 'basic', 'monthly'), /inactive/);
  assert.throws(() => validateStripePrice(recurringPrice({ unit_amount: null }), 'basic', 'monthly'), /fixed amount/);
  assert.throws(() => validateStripePrice(recurringPrice({ unit_amount: 6999 }), 'basic', 'monthly'), /published plan/);
});

test('derives subscription plan from Price and rejects inconsistent metadata', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(subscriptionDescriptor(subscription())).filter(([key]) => key !== 'price')),
    { planType: 'basic', billingCycle: 'monthly' }
  );
  assert.throws(() => subscriptionDescriptor(subscription({
    metadata: { planType: 'advanced', billingCycle: 'monthly' }
  })), /inconsistent plan/);
  assert.throws(() => subscriptionDescriptor(subscription({
    items: { data: [
      { quantity: 1, price: recurringPrice() },
      { quantity: 1, price: recurringPrice() }
    ] }
  })), /exactly one unit/);
});

test('normalizes EUR minor units without silently accepting another currency', () => {
  assert.equal(minorUnitsToMajor(1999, 'eur'), 19.99);
  assert.equal(minorUnitsToMajor(0, 'EUR'), 0);
  assert.throws(() => minorUnitsToMajor(1000, 'usd'), /Unsupported/);
  assert.throws(() => minorUnitsToMajor(10.5, 'eur'), /invalid/);
});

test('keeps one stable grace deadline until the subscription recovers', () => {
  const first = stableGraceWindow({}, 'sub_123', 'pending_payment', { paymentFailedAt: 1_700_000_000 });
  assert.equal(first.graceStartedAt.seconds, 1_700_000_000);
  assert.equal(first.gracePeriodEnd.seconds, 1_700_000_000 + 15 * 86400);

  const preserved = stableGraceWindow({
    stripeSubscriptionId: 'sub_123',
    status: 'pending_payment',
    graceStartedAt: first.graceStartedAt,
    gracePeriodEnd: first.gracePeriodEnd
  }, 'sub_123', 'pending_payment', { paymentFailedAt: 1_800_000_000 });
  assert.equal(preserved.gracePeriodEnd.seconds, first.gracePeriodEnd.seconds);

  const recovered = stableGraceWindow({
    stripeSubscriptionId: 'sub_123',
    gracePeriodEnd: first.gracePeriodEnd
  }, 'sub_123', 'active', {});
  assert.equal(recovered.gracePeriodEnd, null);
});

test('keeps an initial incomplete subscription recoverable but unlicensed', () => {
  assert.deepEqual(subscriptionEntitlement({
    stripeStatus: 'incomplete', status: 'pending_payment'
  }), { hasEverPaid: false, accessGranted: false });
  assert.deepEqual(subscriptionEntitlement({
    stripeStatus: 'past_due', status: 'pending_payment', sameSubscription: true, previousHasEverPaid: true
  }), { hasEverPaid: true, accessGranted: true });
  assert.deepEqual(subscriptionEntitlement({
    stripeStatus: 'active', status: 'active'
  }), { hasEverPaid: false, accessGranted: false });
  assert.deepEqual(subscriptionEntitlement({
    stripeStatus: 'active', status: 'active', latestInvoicePaid: true
  }), { hasEverPaid: true, accessGranted: true });
  assert.deepEqual(subscriptionEntitlement({
    stripeStatus: 'trialing', status: 'active'
  }), { hasEverPaid: false, accessGranted: true });
});

test('never lets an old subscription replace a newer active one', () => {
  assert.equal(shouldApplyMemberSubscription({ stripeSubscriptionId: 'sub_new', status: 'active' }, 'sub_old', 'canceled'), false);
  assert.equal(shouldApplyMemberSubscription({ stripeSubscriptionId: 'sub_old', status: 'canceled' }, 'sub_new', 'active'), true);
  assert.equal(shouldApplyMemberSubscription({ stripeSubscriptionId: 'sub_same', status: 'canceled' }, 'sub_same', 'active'), true);
  assert.equal(shouldApplyMemberSubscription({}, 'sub_orphan', 'canceled'), false);
  assert.ok(subscriptionEventRank('customer.subscription.deleted', 'canceled') > subscriptionEventRank('invoice.paid', 'active'));
  assert.ok(subscriptionEventRank('invoice.paid', 'active') > subscriptionEventRank('invoice.payment_failed', 'pending_payment'));
  assert.ok(subscriptionEventRank('invoice.payment_failed', 'pending_payment') > subscriptionEventRank('customer.subscription.updated', 'active'));
});

test('checkout decision resumes the same atomic attempt and blocks competing requests', () => {
  const now = 1_700_000_000_000;
  const liveExpiry = Timestamp.fromMillis(now + 60_000);
  const baseMember = { subscription: { status: 'canceled' } };
  const creating = {
    ...baseMember,
    billingCheckout: { status: 'creating', fingerprint: 'same', expiresAt: liveExpiry, attemptId: 'attempt_1' }
  };
  assert.equal(checkoutDecision(creating, 'same', now).kind, 'resume');
  assert.equal(checkoutDecision(creating, 'different', now).kind, 'conflict');
  assert.equal(checkoutDecision({
    ...baseMember,
    billingCheckout: { ...creating.billingCheckout, status: 'open', stripeSessionId: 'cs_1' }
  }, 'same', now).kind, 'reuse');
  assert.equal(checkoutDecision({
    ...baseMember,
    billingCheckout: { ...creating.billingCheckout, expiresAt: Timestamp.fromMillis(now - 1) }
  }, 'same', now).kind, 'claim');
  assert.equal(checkoutDecision({ subscription: { status: 'active' } }, 'same', now).kind, 'subscription');
});

test('checkout payload and fingerprint stay deterministic across retries', () => {
  const checkout = {
    attemptId: 'attempt_1',
    planType: 'basic',
    billingCycle: 'monthly',
    priceId: 'price_1',
    baseUrl: 'https://elysiumdr.eu',
    returnPath: '/es/profiles',
    stripeCustomerId: 'cus_1',
    customerEmail: 'verified@example.com',
    expiresAtSeconds: 1_700_002_100
  };
  const payload = checkoutSessionPayload('uid_1', checkout);
  assert.equal(payload.customer, 'cus_1');
  assert.equal(payload.customer_email, undefined);
  assert.equal(payload.metadata.checkoutAttemptId, 'attempt_1');
  assert.equal(payload.subscription_data.metadata.checkoutAttemptId, 'attempt_1');
  assert.equal(payload.expires_at, checkout.expiresAtSeconds);

  const request = {
    userId: 'uid_1', planType: 'basic', billingCycle: 'monthly', priceId: 'price_1',
    baseUrl: 'https://elysiumdr.eu', returnPath: '/es/profiles'
  };
  assert.equal(checkoutFingerprint(request), checkoutFingerprint({ ...request }));
  assert.notEqual(checkoutFingerprint(request), checkoutFingerprint({ ...request, billingCycle: 'annual' }));
});

test('checkout lifecycle events cannot regress a newer result', () => {
  const checkout = {
    attemptId: 'attempt_1',
    stripeSessionId: 'cs_1',
    status: 'completed',
    latestEventCreated: 200,
    latestEventRank: 30
  };
  const session = { id: 'cs_1', metadata: { checkoutAttemptId: 'attempt_1' } };
  assert.equal(checkoutEventUpdate(checkout, session, 'failed', { id: 'evt_old', created: 199 }, 'now'), null);
  assert.equal(checkoutEventUpdate(checkout, session, 'failed', { id: 'evt_same', created: 200 }, 'now'), null);
  assert.equal(
    checkoutEventUpdate(checkout, session, 'failed', { id: 'evt_new', created: 201 }, 'now').status,
    'failed'
  );
});

test('allows only known return paths and Stripe-hosted recovery URLs', () => {
  assert.equal(normalizedReturnPath('/pt/profiles.html'), '/pt/profiles.html');
  assert.equal(normalizedReturnPath('//evil.example'), '/profiles');
  assert.equal(isStripeHostedUrl('https://checkout.stripe.com/c/pay/test'), true);
  assert.equal(isStripeHostedUrl('https://stripe.com.evil.example/c/pay/test'), false);
  assert.equal(isStripeHostedUrl('javascript:alert(1)'), false);
});

test('recognizes only verified configured or claim-backed administrators', () => {
  assert.equal(isFirebaseAdmin({ email: 'danielalonzzo@icloud.com', email_verified: true }), true);
  assert.equal(isFirebaseAdmin({ email: 'admin@example.com', email_verified: true, admin: true }), true);
  assert.equal(isFirebaseAdmin({ email: 'root@example.com', email_verified: true, role: 'root' }), true);
  assert.equal(isFirebaseAdmin({ email: 'member@example.com', email_verified: true, role: 'partner' }), false);
  assert.equal(isFirebaseAdmin({ email: 'danielalonzzo@icloud.com', email_verified: false }), false);
});

test('resolves ordinary zoned local times to one exact UTC instant', () => {
  assert.equal(validateIanaTimeZone('Europe/Lisbon', 'adminTimeZone'), 'Europe/Lisbon');
  assert.equal(
    resolveZonedLocalDateTime('2026-08-06', '14:30', 'Europe/Lisbon').toISOString(),
    '2026-08-06T13:30:00.000Z'
  );
  assert.equal(
    resolveZonedLocalDateTime('2026-08-06', '07:30', 'America/Costa_Rica').toISOString(),
    '2026-08-06T13:30:00.000Z'
  );
  assert.throws(() => validateIanaTimeZone('Portugal/Lisbonish', 'adminTimeZone'), /IANA/);
});

test('rejects nonexistent and ambiguous daylight-saving wall-clock times', () => {
  assert.throws(
    () => resolveZonedLocalDateTime('2026-03-08', '02:30', 'America/New_York'),
    error => error instanceof MeetingValidationError && error.code === 'nonexistent_local_time'
  );
  assert.throws(
    () => resolveZonedLocalDateTime('2026-11-01', '01:30', 'America/New_York'),
    error => error instanceof MeetingValidationError && error.code === 'ambiguous_local_time'
  );
});

test('validates canonical meeting data and produces stable idempotency identifiers', () => {
  const body = {
    userId: 'client_123',
    title: 'Discovery session',
    notes: 'Bring the launch brief.',
    clientRegion: 'Costa Rica',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    adminTimeZone: 'Europe/Lisbon',
    clientTimeZone: 'America/Costa_Rica',
    date: '2030-08-06',
    time: '14:30',
    durationMinutes: 60,
    locale: 'es-CR'
  };
  const meeting = normalizeMeetingInput(body, Date.UTC(2030, 0, 1));
  assert.equal(meeting.startAt.toISOString(), '2030-08-06T13:30:00.000Z');
  assert.equal(meeting.endAt.toISOString(), '2030-08-06T14:30:00.000Z');
  assert.equal(meeting.locale, 'es');
  assert.equal(normalizedIdempotencyKey('admin-ui:request_123'), 'admin-ui:request_123');
  assert.equal(meetingIdForRequest('admin_1', 'admin-ui:request_123'), meetingIdForRequest('admin_1', 'admin-ui:request_123'));
  assert.equal(meetingRequestFingerprint(meeting), meetingRequestFingerprint({ ...meeting }));
  assert.throws(() => normalizeMeetingInput({ ...body, meetingUrl: 'http://meet.example.com' }), /HTTPS/);
  assert.throws(() => normalizeMeetingInput({ ...body, durationMinutes: 10 }), /Duration/);
  assert.throws(() => normalizedIdempotencyKey('short'), /Idempotency-Key/);
});

function emailMeeting(overrides = {}) {
  return {
    id: 'mtg_123',
    userId: 'client_123',
    clientName: 'Ana & Co',
    clientEmail: 'ana@example.com',
    clientRegion: 'Costa Rica',
    clientTimeZone: 'America/Costa_Rica',
    adminTimeZone: 'Europe/Lisbon',
    title: 'Kickoff <Q3>',
    notes: 'Review goals & scope.',
    meetingUrl: 'https://meet.example.com/room?a=1&b=2',
    durationMinutes: 60,
    startAt: new Date('2026-08-06T13:30:00.000Z'),
    endAt: new Date('2026-08-06T14:30:00.000Z'),
    locale: 'es',
    ...overrides
  };
}

test('builds localized, escaped multizone meeting email and calendar invite', () => {
  const meeting = emailMeeting();
  const email = buildMeetingEmail(meeting);
  assert.match(email.subject, /Reunión confirmada/);
  assert.match(email.html, /America\/Costa_Rica/);
  assert.match(email.html, /Europe\/Lisbon/);
  assert.match(email.html, /Kickoff &lt;Q3&gt;/);
  assert.doesNotMatch(email.html, /Kickoff <Q3>/);
  assert.match(email.text, /https:\/\/meet\.example\.com/);

  const invite = buildMeetingIcs(meeting, 'confirmation', new Date('2026-08-01T00:00:00Z'));
  assert.match(invite, /METHOD:REQUEST\r\n/);
  assert.match(invite, /DTSTART:20260806T133000Z/);
  assert.match(invite, /DTEND:20260806T143000Z/);
  assert.match(invite, /STATUS:CONFIRMED/);
  const cancelled = buildMeetingIcs(meeting, 'cancellation', new Date('2026-08-01T00:00:00Z'));
  assert.match(cancelled, /METHOD:CANCEL/);
  assert.match(cancelled, /STATUS:CANCELLED/);
  assert.match(
    buildMeetingIcs(emailMeeting({ meetingUrl: 'https://meet.example.com/room,a;b' })),
    /URL:https:\/\/meet\.example\.com\/room\\,a\\;b/
  );

  const payload = meetingResendPayload(meeting);
  assert.deepEqual(payload.to, ['ana@example.com']);
  assert.match(Buffer.from(payload.attachments[0].content, 'base64').toString('utf8'), /BEGIN:VCALENDAR/);
});

test('sends Resend payload with provider idempotency and no live request', async () => {
  let captured = null;
  const fetchMock = async (url, options) => {
    captured = { url, options };
    return { ok: true, status: 200, json: async () => ({ id: 'email_123' }) };
  };
  const result = await sendResendEmail(meetingResendPayload(emailMeeting()), 'meeting-key-123', fetchMock);
  assert.equal(result.id, 'email_123');
  assert.equal(captured.url, 'https://api.resend.com/emails');
  assert.equal(captured.options.headers['Idempotency-Key'], 'meeting-key-123');
  assert.equal(captured.options.headers.Authorization, 'Bearer re_test_elysium_unit_tests');
});

test('serializes meeting and nested delivery timestamps as ISO strings', () => {
  const instant = Timestamp.fromMillis(Date.UTC(2026, 7, 6, 13, 30));
  const serialized = serializeMeeting('mtg_123', {
    userId: 'client_123',
    startAt: instant,
    notifications: { confirmation: { status: 'sent', sentAt: instant } }
  });
  assert.equal(serialized.startAt, '2026-08-06T13:30:00.000Z');
  assert.equal(serialized.notifications.confirmation.sentAt, '2026-08-06T13:30:00.000Z');
});

test('password-reset helpers remain neutral, localized and rate limited', () => {
  assert.equal(normalizedEmail(' User@Example.com '), 'user@example.com');
  assert.equal(normalizedEmail('not-an-email'), null);
  assert.equal(passwordResetContinueUrl('es'), 'https://elysiumdr.eu/es/profiles?passwordReset=complete');
  assert.equal(passwordResetContinueUrl('en'), 'https://elysiumdr.eu/profiles?passwordReset=complete');
  assert.equal(passwordResetEmailConfigured(), true);
  const savedApiKey = process.env.RESEND_API_KEY;
  const savedResetFrom = process.env.PASSWORD_RESET_FROM_EMAIL;
  const savedMeetingFrom = process.env.MEETING_FROM_EMAIL;
  delete process.env.RESEND_API_KEY;
  delete process.env.PASSWORD_RESET_FROM_EMAIL;
  delete process.env.MEETING_FROM_EMAIL;
  assert.equal(passwordResetEmailConfigured(), false);
  process.env.RESEND_API_KEY = savedApiKey;
  process.env.PASSWORD_RESET_FROM_EMAIL = savedResetFrom;
  process.env.MEETING_FROM_EMAIL = savedMeetingFrom;
  const reset = passwordResetEmail('user@example.com', 'https://example.com/reset?oobCode=a&lang=es', 'es');
  assert.match(reset.subject, /Restablece/);
  assert.match(reset.html, /oobCode=a&amp;lang=es/);
  assert.doesNotMatch(reset.html, /oobCode=a&lang=es/);

  const attempts = new Map();
  assert.equal(passwordResetRateLimited('email:key', 2, 1_000, attempts), false);
  assert.equal(passwordResetRateLimited('email:key', 2, 1_001, attempts), false);
  assert.equal(passwordResetRateLimited('email:key', 2, 1_002, attempts), true);
  assert.equal(passwordResetRateLimited('email:key', 2, 1_000 + 60 * 60 * 1000, attempts), false);
});
