# auth.md — Elysium λ Development & Research

This file describes, for automated clients, how to reach the API behind
<https://elysiumdr.eu>. It is the human- and agent-readable companion to
[`/.well-known/oauth-protected-resource/api`](https://elysiumdr.eu/.well-known/oauth-protected-resource/api)
and [`/openapi.json`](https://elysiumdr.eu/openapi.json).

## What is open, and what is not

| Surface | Credentials |
|---|---|
| The whole website, `/llms.txt`, `/llms-full.txt`, `/sitemap.xml` | None. |
| `GET /api/health` | None. |
| `POST /api/prospects` — record a project enquiry | None, but see the conditions below. |
| `POST /api/auth/password-reset` | None. |
| The MCP server at `/mcp` | None. Read-only. |
| Everything else under `/api/` | A Firebase ID token from an administrator account. |

The interactive page at `/profiles` lets a person create a free partner account,
but that account has no subscription and no administrator claim. It can use its
own portal record; it **cannot** call the protected CRM API described here.
Administrator/API access and licences are provisioned by hand after a contract
exists.

## Agent registration

- **Machine registration endpoint:** none.
- **Supported agent identity types:** none. Elysium does not accept ID-JAG,
  anonymous agent registration or agent-issued email assertions.
- **Agent credential issuance:** none. The site has no agent token, claim,
  client-credentials or delegation flow.
- **Human partner signup:** interactive only at
  [`/profiles`](https://elysiumdr.eu/profiles); it does not grant protected API
  access and must not be automated as a substitute for an agent protocol.

An agent that needs authenticated API access should ask its principal to obtain
the appropriate account and licence through
[the contact page](https://elysiumdr.eu/contact), not attempt to register itself.

## Identity model for the authenticated API

- **Issuer:** `https://securetoken.google.com/elysiumdr-eu` (Firebase
  Authentication, project `elysiumdr-eu`).
- **Discovery:** the issuer publishes its own OpenID Connect metadata at
  `https://securetoken.google.com/elysiumdr-eu/.well-known/openid-configuration`.
  Elysium is a *protected resource*, not an authorization server, so it does not
  publish authorization-server metadata of its own — resolve the issuer above.
- **Token format:** RS256 JWT, presented as `Authorization: Bearer <id-token>`.
- **Audience:** `elysiumdr-eu`.
- **Authorization:** endpoints tagged `crm` in the OpenAPI description also
  require the administrator custom claim on the account. A valid token without
  it gets `403`.
- **Scopes:** none. `scopes_supported` is omitted from the protected-resource
  metadata because RFC 9728 forbids zero-element metadata arrays. No OAuth
  scope value is requested or checked; what an account may do is decided by
  the administrator custom claim on the token.
- **Delegation:** there is no agent-delegation, service-account or
  client-credentials flow. A token always represents a person.

## Calling `POST /api/prospects` as an agent

This is the one write endpoint open to the public, and the intended way for an
agent to hand over an enquiry on behalf of its user. Four conditions apply, and
all four are enforced server-side:

1. **Origin.** A request that carries an `Origin` header outside the allow-list
   is refused with `403 origin_not_allowed`. Server-to-server calls that send no
   `Origin` header are accepted.
2. **The `website` field is a honeypot.** Leave it absent or empty. A filled
   value is answered `202` and thrown away — success-shaped, but nothing is
   stored.
3. **Rate limits** apply per IP address and per email address; over the limit
   the answer is `429 prospect_rate_limited`.
4. **Consent.** The enquiry becomes a personal-data record under the
   [privacy policy](https://elysiumdr.eu/privacy). Send it only with the
   explicit agreement of the person whose name and email address it carries,
   and use their real address — not the agent's.

## Rules for automated clients

- Identify yourself in `User-Agent` with a name and a contact URL.
- Honour `robots.txt`, including the `Content-Signal` directives declared there.
- Do not retry a `429` before the window it names has passed.
- Report a problem to <info@elysiumdr.eu>.

## Contact

Elysium λ Development & Research · <info@elysiumdr.eu> · Bragança, Portugal,
European Union · <https://elysiumdr.eu/contact>
