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


## Chat Kernel / MoV v0.1 increment

Inspected base: `a6f8e76b152128b979ac3a1af2279efe44dfccad`. The 25 locally materialized baseline files matched connector-retrieved Git blob hashes; unchanged `docs/CHAT-KERNEL.md` remains preserved in the remote base tree. The in-progress branch was resumed rather than duplicated.

- Baseline rerun: 60 tests passed, zero failed.
- Final `npm run check`: 92 tests passed, zero failed on Node.js v22.16.0. All previous tests remain.
- 32 added tests: 21 registry/composition/alias tests (including a bounded 64-case authority-injection corpus), 10 Node DOM-harness UI tests, and one actual loopback HTTP integration test covering all new routes and existing restrictions.
- Tests check URL shapes, synthetic/public-only data, malformed/private/authority fields, exact source retention, unique bounded selection, stable digests, detached snapshots, stale UI review, private reflection exclusion, lifecycle clearing, text rendering and aliases.
- Test-client correction: fetch normalized traversal targets and ignored a spoofed Host header. Those assertions now send raw node:http request targets and headers. This was a test-harness correction, not a newly discovered server vulnerability.
- `npm run demo`: original local export demonstration passed. Approval and receipt semantics were not expanded.
- New browser script: Python syntax checked only. The existing browser gate was attempted with installed `/usr/bin/chromium`; navigation to loopback failed with `ERR_BLOCKED_BY_ADMINISTRATOR`. No bypass or passing browser test is claimed.
- No CI dispatch, production deployment, existing Site/monosite change, installed Skill/plugin update, external provider action or account change.

Run `npm run check`; for authorized real-browser validation run `python tests/mov_browser_smoke.py`. Node DOM tests are not visual, accessibility, device or browser-header verification. These results cover the local reference slice only.
