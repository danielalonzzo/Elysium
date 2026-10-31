# Elysium Tools deployment

Elysium Tools runs at https://tools.elysiumdr.eu/ through the Elysium Cloudflare Worker. English, Spanish and Portuguese pages are generated from `scripts/tools/content.mjs` with `node scripts/build-tools.mjs`. Run the same command with `--check` to verify the generated files. The former catalogue input is retained under `scripts/tools/legacy/content.json` for reference.

The Worker routes `/api/tools/*` to the separate `elysium-tools` Cloud Run service. Public operations require the production Turnstile widget, matching gateway secrets in the Worker and Cloud Run, origin validation and per-visitor limits. The administrator routes retain Firebase authentication. Configuration and deployment instructions are maintained in `backend/tools/README.md` and `CLAUDE.md`.

The catalogue, public modules and backend declare the same supported platforms and limits. YouTube remains marked as coming soon. PDF page editing and ID-card PDF creation run in the browser; PDF-to-Word conversion runs in Cloud Run. Automated tests use fixture engines and do not establish live platform compatibility.

Validate with `node --test scripts/*.test.mjs`, `npm test --prefix backend` and `npm test --prefix backend/tools`. Local HTTP tests require permission to bind ports. Confirm the production health endpoints, public configuration, page status, redirects and generated discovery documents after deployment. Search indexing is independent of publication and remains subject to the search engines.
