# Hardening review / v0.1.1

Scope: the existing `MYaelMendez/SOV-REIGN` reference kernel and local preview.
Parent: `5888aa7d556498aa8c8eb812839e14056ff06c9e` (PR #1).
Work branch: `hardening/fail-closed-regressions`.
No merge, deployment, account change or external executor is included.

## Findings and repairs

| Area | Prior behavior / gap | Change |
| --- | --- | --- |
| Preparation concurrency | 80 concurrent preparations could bypass the 64-proposal check before hashing completed. | Reserve capacity synchronously, including in-flight work. Old generations cannot adjust new counters after clear. |
| Lifecycle capacity | Consumed/expired proposals could leave a local session full. | Consume removes both records; prepare sweeps expired proposals and associated approvals. Per-generation capacity stays bounded. |
| Expiry and clock | A proposal could expire during hashing; unrepresentable Date values failed too late. | Recheck expiry after hashing; reject out-of-range expiry; detected clock faults revoke outstanding work and require a fresh session. |
| Public data validation | Accessors, hidden/symbol fields, sparse arrays and custom map methods were not strictly rejected. | Inspect own data descriptors and standard dense arrays without calling accessors or custom serialization. Reject unexpected fields and malformed Unicode. |
| Digests and receipts | A matching digest alone could accompany malformed metadata or imported authority in a manifest. | Bounded sorted-key JSON, full public-projection validation, strict receipt shape and fail-closed verification. |
| Local HTTP boundary | Loopback binding did not reject unexpected Host/Origin or URL normalization into allowed paths. | Exact local authority and origin checks; reject cross-site requests and non-allowlisted raw targets. No request bodies or write methods. |
| Resource exposure | No explicit request-budget tuning; local connect-src allowed network fetches. | Header/request/socket limits; connect-src none; same-origin resource policy; still only five static assets. |
| UI approval | Silent field edits could diverge from the previously reviewed form; lifecycle state could persist. | Compare current fields with the reviewed digest before export and again before download; clear intention and approvals on pagehide / persisted pageshow. |

## Tests, not promises

Baseline: 25 tests passed. A first set of 21 adversarial/stronger-contract regression tests failed on the baseline. These are overlapping cases and new stricter requirements, **not 21 separately proven vulnerabilities**.

Final: 60 tests passed, 0 failed. This includes the original behavior tests, 27 hardening tests (with a bounded 200-case mutation corpus), and 8 Node DOM-harness tests of the actual UI module. The one original HTTP assertion was intentionally tightened from `connect-src 'self'` to `connect-src 'none'`; existing guards were not removed.

Real browser navigation was attempted with Playwright 1.57.0 / Chromium 144.0.7559.96 and was blocked with `ERR_BLOCKED_BY_ADMINISTRATOR`. That policy was not bypassed. DOM-harness tests do not validate browser sandbox behavior, real downloads, layout, navigation or device compatibility. `tests/browser_smoke.py` supplies the separate release gate for an authorized browser environment; only Python syntax checking was completed for that script here.

## Deliberate limitations

- This is not authentication. Same-process code can call `approve`; an external system must never trust its local boolean or ticket.
- The digest covers public content, not the authenticity of receipt metadata. A plausibly rewritten UUID/time cannot be detected without signatures or trusted storage. A test explicitly records that limitation; copied receipts never become executable tickets.
- Sorted-key JSON is a local v0.1.1 digest contract, **not RFC 8785**. Recompute old v0.1.0 order-dependent digests and review again; do not silently treat old receipts as a new grant.
- Live hostile JavaScript Proxies, altered prototypes, compromised runtimes, extensions and hostile clocks are not sandboxed. Trust boundaries must accept parsed data, not executable objects.
- Private intention is excluded from manifests and receipts. Public name/purpose can contain sensitive material if entered there; review remains necessary. Lifecycle events are best-effort and can be omitted by browser/OS termination.
- GitHub Pages does not acquire this preview server's HTTP headers from source files. Real hosting headers, authenticated approvals, durable replay protection and provider evidence remain separate production gates.

## Reproduce

```sh
npm run check
npm run demo
npm run test:coverage
# Optional separate browser gate (requires authorized browser/network environment):
python -m pip install -r requirements-browser.txt
python -m playwright install chromium
python tests/browser_smoke.py
```

Implementation references checked for this work:
- https://nodejs.org/download/release/v22.16.0/docs/api/http.html
- https://nodejs.org/download/release/v22.16.0/docs/api/webcrypto.html
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptors
- https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event

The references document primitives; they are not certification of this project.
