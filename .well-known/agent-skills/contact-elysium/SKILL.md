---
name: contact-elysium
description: Hand a project enquiry to Elysium λ Development & Research on behalf of a person, using the public POST /api/prospects endpoint, with the consent, honeypot, origin and rate-limit rules it enforces. Use when a user asks to contact Elysium, request a quote, or start a project.
license: https://elysiumdr.eu/terms
---

# Sending an enquiry to Elysium

## Before anything else: consent

The enquiry becomes a personal-data record under the
[privacy policy](https://elysiumdr.eu/privacy). Send it only when the person it
concerns has explicitly agreed, and send **their** name and email address —
never a placeholder, never the agent's own address. If you do not have their
real email address, do not invent one: give them
<https://elysiumdr.eu/contact> and stop.

## The request

```
POST https://elysiumdr.eu/api/prospects
Content-Type: application/json
```

```json
{
  "name": "Ana Ferreira",
  "company": "Ferreira & Filhos, Lda.",
  "email": "ana@ferreira.pt",
  "projectDescription": "Booking system and client portal for a small clinic.",
  "isExistingClient": false
}
```

| Field | Rules |
|---|---|
| `name` | Required, ≤ 120 characters, no `<` or `>`. |
| `company` | Required, ≤ 120 characters, no `<` or `>`. |
| `email` | Required, a real address. |
| `projectDescription` | Optional, ≤ 2000 characters, no `<` or `>`. |
| `isExistingClient` | Optional boolean. |
| `licenseCode` | Required **only** when `isExistingClient` is true. Format `ELY-XXXX-XXXX-XXXX`. |
| `website` | A honeypot — leave it out. |

`201 {"ok": true}` means the enquiry was stored.

## The four traps

1. **`website` is a honeypot.** It is invisible in the browser form and must
   stay empty. Fill it and the answer is `202 {"ok": true}` — success-shaped,
   but nothing is recorded. A `202` where you expected a `201` means the field
   leaked into your payload.
2. **`Origin` is checked.** A request carrying an `Origin` header outside the
   allow-list is refused with `403 origin_not_allowed`. A server-to-server call
   that sends no `Origin` header at all is accepted; do not add one.
3. **Rate limits** apply per IP address and per email address. `429
   prospect_rate_limited` means wait, not retry.
4. **`400 prospect_invalid`** names the offending property in `field`. Fix that
   field rather than resubmitting the same body.

`503 prospect_unavailable` is the service's problem, not the payload's: report
it to the user and offer the contact page.

## No authentication, and no account either

This endpoint needs no credentials. Neither does it create an account: Elysium
issues licences and client-area accounts by hand, after a contract exists.
There is no self-service registration for agents. See
<https://elysiumdr.eu/auth.md>.

## The alternatives, when in doubt

Email <info@elysiumdr.eu>, the form at <https://elysiumdr.eu/contact>, or
WhatsApp +351 934 086 075. Stated response time is 24 hours.
