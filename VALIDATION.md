# Verification record / 2026-10-20

## Executed

- Runtime: Node.js v22.16.0, npm 10.9.2, Linux.
- `npm run check`: syntax checks plus **25 tests passed, 0 failed**.
- Tests cover aliases, public projection, private-field rejection, Codex as preference only, parent-linked context, exact digest review, explicit consent, forged and cross-session ticket rejection, replay/concurrency, expiry, revocation, clock regression, local receipt integrity and read-only HTTP serving.
- `npm run demo`: completed the local prepare / approve / return-draft sequence. Output integrity matched. No remote service was contacted.
- Static HTML/CSS rendered in Chromium at 1440x1000, 390x844, 320x568 and 844x390. No horizontal overflow. Phone layout visually inspected. These are static layout checks, not full interactive end-to-end tests.

## Not completed

- Browser navigation to the local preview returned `ERR_BLOCKED_BY_ADMINISTRATOR`. Full interactive browser testing, including the download control, must be completed in an authorized browser environment. The policy was not changed or bypassed.
- No actual iOS Safari or Android device test, screen-reader audit, cross-host integration, real identity authentication, provider authorization or signed attestation.
- No GitHub Actions run, deployment, external email, legal filing, payment or new OpenAI Site/plugin.

## Reproduce

Run `npm run check`, then `npm run demo`. For interactive verification run `npm start` and follow the steps in docs/PUBLISHING.md. Confirm that changing any field resets approval and the private intention never appears in the downloaded record. Checks describe this reference only, not the entire constellation.
