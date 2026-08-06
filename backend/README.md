# Elysium platform service

This service is the trusted bridge between Stripe and Firebase. It creates a
Checkout Session for an authenticated Firebase member and provisions the CRM
license from signed Stripe webhook events. It also owns administrator meeting
scheduling, transactional email delivery, calendar invitations and branded
password-reset email.

## Required deployment configuration

1. Install dependencies with `npm install` in this directory.
2. Configure the variables shown in `.env.example`. In managed Google hosting,
   Application Default Credentials can replace `GOOGLE_APPLICATION_CREDENTIALS`.
3. Expose the service at the site's `/api/billing/*` route (recommended), or set
   `window.ELYSIUM_BILLING_API_URL` to the service origin before
   `JS/profiles.js` loads. If a separate origin is used, also add it to the
   site's Content Security Policy `connect-src` directive.
4. In Stripe, send these events to `/api/billing/webhook`:
   `checkout.session.completed`, `checkout.session.expired`,
   `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `invoice.paid`,
   `invoice.payment_failed`, `invoice.payment_action_required`,
   `invoice.finalization_failed`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.paused`, `customer.subscription.resumed`, and
   `customer.subscription.deleted`.
5. Create one active, fixed-amount, recurring EUR Stripe Price for every lookup
   key in `DEFAULT_LOOKUP_KEYS`, or override them with
   `STRIPE_LOOKUP_KEYS_JSON`. Monthly keys must recur every month and annual
   keys every year; currency and fixed amounts must match the EUR prices
   published in the portal. The service rejects a mismatch before Checkout.
6. Verify `elysiumdr.eu` as a sending domain in Resend (including its DKIM/SPF
   records), then set `RESEND_API_KEY`, `MEETING_FROM_EMAIL` and optionally
   `PASSWORD_RESET_FROM_EMAIL`. The sender values may use the form
   `Elysium <meetings@elysiumdr.eu>`.
7. Set `ADMIN_EMAILS` to the comma-separated fallback administrator allowlist.
   Custom Firebase claims `admin: true` or `role: admin|root|super_admin` are
   also accepted. All administrator tokens must have a verified email.
8. `TRUST_PROXY_HOPS` defaults to `1`, matching the intended single trusted
   production ingress hop. Change it to match the actual deployment topology;
   password-reset IP throttling uses Express's resulting `request.ip`.

Billing requests require a non-revoked Firebase ID token whose email is
verified. Checkout creation uses a Firestore transaction plus a stable Stripe
idempotency key, so concurrent clicks and process retries resolve to one
Checkout Session. An open session or an incomplete subscription is recovered
before a new session is allowed. An initial `incomplete` subscription remains
unlicensed (`accessGranted: false`) until Stripe confirms a trial or a paid
invoice; a later payment failure preserves prior access only for the stable
grace window.

During migration, the portal and Firebase rules accept an older Stripe record
with `status: active` when `accessGranted` is absent; the former service never
used `active` for an initial unpaid subscription. An explicit
`accessGranted: false` always blocks access, and every event handled by this
service writes the field so legacy records converge automatically.

The webhook is idempotent: Stripe invoice and event IDs are used as Firestore
document IDs. It updates the member, per-subscription cursor, license, activity,
and payment ledger in one Firestore transaction. Event ordering is tracked per
Stripe subscription, so a late event for an old subscription cannot overwrite
the current one; its invoice is still recorded exactly once.

Run `npm run check && npm test` before deployment. The unit suite covers Price
validation, currency conversion, stable grace periods, entitlement gating,
old/new subscription ordering, Checkout lock decisions, role checks, strict
meeting validation, timezone/DST conversion, ICS generation, Resend requests
and password-reset throttling.

## Frontend API origin

The preferred production layout proxies the service under the same public
origin, so the browser calls `/api/meetings`, `/api/auth/password-reset` and
`/api/billing/*`. If the API is hosted separately, expose one frontend setting
such as `window.ELYSIUM_API_URL = 'https://api.elysiumdr.eu'`, prepend it to all
three API groups, add that exact origin to `ALLOWED_ORIGINS`, and allow it in
the site's CSP `connect-src`. Never place the Resend or Firebase Admin secrets
in browser code.

## Administrator meeting API

All meeting routes require `Authorization: Bearer <Firebase ID token>` from a
verified administrator. Meeting documents use `userId` as the owning client
field so Firestore rules can grant the client narrowly scoped reads later.

### Schedule a meeting

`POST /api/meetings` requires an `Idempotency-Key` header (8–128 safe
characters). Repeating the same body and key returns the original meeting and
retries a failed email without creating a duplicate. Reusing the key with a
different body returns `409 idempotency_conflict`.

```json
{
  "userId": "firebase-client-uid",
  "title": "Project review",
  "date": "2026-08-20",
  "time": "15:30",
  "durationMinutes": 60,
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "adminTimeZone": "Europe/Lisbon",
  "clientTimeZone": "America/Costa_Rica",
  "clientRegion": "Costa Rica",
  "locale": "es",
  "notes": "Optional preparation notes"
}
```

`date` and `time` are interpreted in `adminTimeZone`; both timezone fields must
be IANA identifiers. The API stores canonical UTC `startAt`/`endAt` values plus
both zones and the original local input. A nonexistent or duplicated wall-clock
time during a DST transition is rejected instead of silently shifting the
meeting. The client must already exist in `members`, be active, and have a
valid canonical email.

The confirmation email shows the meeting in both Elysium's and the client's
local timezone and carries a standard `METHOD:REQUEST` ICS invitation. Email
delivery uses a transactional Firestore outbox lease and a stable Resend
idempotency key. If delivery fails, the meeting remains saved and the API
returns `meeting_saved_email_failed` with its `meetingId`; retry the identical
request with the same idempotency key.

### Agenda and cancellation

- `GET /api/meetings?from=<ISO instant>&to=<ISO instant>&userId=<optional uid>`
  returns meetings ordered by UTC start time. The window may not exceed 370
  days; the endpoint returns at most 250 records.
- `POST /api/meetings/:meetingId/cancel` accepts an optional JSON `reason`.
  It is idempotent, records the administrator audit fields and sends a branded
  cancellation email with a `METHOD:CANCEL` ICS update. Retry the same URL if
  the response reports `meeting_cancelled_email_failed`.

Creation and cancellation also write deterministic `meeting_created` and
`meeting_cancelled` activity records for the CRM timeline. The `meetings`
document stores status, owner/client identity, UTC instants, both IANA zones,
region, link, delivery state and administrator audit metadata.

## Branded password reset

`POST /api/auth/password-reset` is public and accepts:

```json
{ "email": "client@example.com", "locale": "es" }
```

It always returns the same generic `202` response for valid, invalid, missing,
disabled, throttled and delivery-failure cases, preventing account enumeration.
For an eligible account, Firebase Admin generates the single-use reset link and
Resend delivers it with the Elysium email design. Configure `PUBLIC_BASE_URL`
and ensure its EN/ES/PT profile URLs are present in Firebase Authentication's
authorized domains. The process-local limiter allows five attempts per email
and twenty per remote address per hour; production ingress rate limiting is
still recommended when the service runs with multiple instances.

When the Resend API key or effective reset sender is absent globally, the route
returns the same configuration-level `503 email_not_configured` for every
address, before looking up any Firebase account. The frontend may then fall
back to Firebase's standard password-reset sender without leaking whether a
specific account exists.

## License formats

- Web payments keep the automatic Stripe namespace. The signed webhook derives
  a stable, non-guessable suffix from the Stripe subscription ID.
- External payments are registered by the administrator in the CRM and use
  `ELY-{PLAN}-{PERIOD}-{BUSINESS_ID}`. Maintenance plans use `EC01`, `EC02`, or
  `EC03`; periods use `M3N1` through `M3N9` for months or `ANL1` through `ANL9`
  for years. The CRM replaces the previous license document atomically when any
  of those contract fields changes.
