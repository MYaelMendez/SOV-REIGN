# Verification record / v0.1.1 hardening

Source parent: `5888aa7d556498aa8c8eb812839e14056ff06c9e`.
The uploaded v0.1 source archive was compared by Git blob hashes with all 19 files in that GitHub tree before editing; every file matched.

## Executed locally

- Node.js v22.16.0 / npm 10.9.2 / Linux.
- Baseline `npm run check`: **25 passed, 0 failed**.
- First regression set against the baseline: **21 failed** (overlapping findings and stricter contracts, not a vulnerability count).
- Final `npm run check`: **60 passed, 0 failed**. No core npm dependencies.
- `npm run demo`: local prepare / approve / return-draft sequence completed and content integrity matched.
- `npm run test:coverage`: **60 passed**. Kernel instrumentation reported 100% lines, 99.07% branches; coverage is not a security audit. UI module query imports make aggregate UI coverage unsuitable as a browser metric.
- HTTP tests made real requests to a loopback server: allowlist, headers, methods, raw paths, hostile Host/Origin, timeouts and bodyless HEAD.
- Eight DOM-harness tests execute web/app.mjs with synthetic controls: privacy exclusion, invalidation, silent edits, concurrent download clicks, cancellation, lifecycle clearing, aliases and text rendering.
- Python syntax check of the optional browser release-gate script passed.

## Not completed

Playwright / Chromium navigation to the local server failed with `ERR_BLOCKED_BY_ADMINISTRATOR`. No policy was changed or bypassed. This is an environmental block, not a passing UI test. Real-browser export/layout, iPhone/Android, accessibility, BFCache behavior and browser-header enforcement remain unverified.

No GitHub Actions run, Site/monosite update, deployment, live provider integration, authenticated identity, legal filing, payment, external email or signed attestation occurred. The existing GitHub workflow stays manual and read-only.

## Reproduction and scope

Run `npm run check`, `npm run demo`, and optionally `npm run test:coverage`. Run `python tests/browser_smoke.py` only after installing the optional pinned test tool and using an authorized browser environment. See docs/HARDENING.md and docs/SECURITY.md for limits.

These results cover this local reference, not the whole constellation. Public drafts and unsigned local receipts do not transfer human authority.
