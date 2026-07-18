# Elysium billing service

This service is the trusted bridge between Stripe and Firebase. It creates a
Checkout Session for an authenticated Firebase member and provisions the CRM
license from signed Stripe webhook events.

## Required deployment configuration

1. Install dependencies with `npm install` in this directory.
2. Configure the variables shown in `.env.example`. In managed Google hosting,
   Application Default Credentials can replace `GOOGLE_APPLICATION_CREDENTIALS`.
3. Expose the service at the site's `/api/billing/*` route (recommended), or set
   `window.ELYSIUM_BILLING_API_URL` to the service origin before
   `JS/profiles.js` loads. If a separate origin is used, also add it to the
   site's Content Security Policy `connect-src` directive.
4. In Stripe, send these events to `/api/billing/webhook`:
   `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`,
   `customer.subscription.created`, `customer.subscription.updated`, and
   `customer.subscription.deleted`.
5. Create recurring Stripe Prices with the lookup keys in
   `DEFAULT_LOOKUP_KEYS`, or override them with `STRIPE_LOOKUP_KEYS_JSON`.

The webhook is idempotent: Stripe invoice and event IDs are used as Firestore
document IDs. It writes the member subscription, license and payment ledger in
one batch.

## License formats

- Web payments keep the automatic Stripe namespace. The signed webhook derives
  a stable, non-guessable suffix from the Stripe subscription ID.
- External payments are registered by the administrator in the CRM and use
  `ELY-{PLAN}-{PERIOD}-{BUSINESS_ID}`. Maintenance plans use `EC01`, `EC02`, or
  `EC03`; periods use `M3N1` through `M3N9` for months or `ANL1` through `ANL9`
  for years. The CRM replaces the previous license document atomically when any
  of those contract fields changes.
