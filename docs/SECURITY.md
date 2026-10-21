# Security and privacy boundaries

This is a **local reference**, not a production authorization server.

## What the local gate demonstrates

Default denial; strict input shape; output review; scope bound to one non-network operation; five-minute maximum expiry; single-use tickets; revocation; cancellation; and no authority inheritance. These are behavior tests inside one trusted process. The caller of `approve` is already trusted. A boolean confirmation does not authenticate a human.

## Threats outside this reference's guarantees

Malicious same-origin code, browser extensions, compromised runtimes, hostile clocks, memory inspection, and UI spoofing can subvert a local demo. No CSS label, digest, checkbox, or public JSON document establishes a real-world principal. SHA-256 is used for content integrity only; there is no signing key, signature or independent witness.

A production executor must independently authenticate the human, verify current privileges, bind approval to the exact actor/resource/operation/payload, enforce expiry and revocation durably, prevent replay across workers, retain minimal protected audit evidence, and verify provider outcomes. Importing a profile must never import authority. Failed effects require reconciliation, not blind retries.

## Data handling

- Private intention remains a DOM value in this tab. The application neither persists it nor includes it in a digest/export. Browser/OS behavior is not controlled by this app.
- Public name and public purpose are intentionally exported and can contain personal data if a user enters it. Human review remains mandatory.
- The page performs no telemetry, external fetches, postMessage handoff, session transfer or secret storage.
- Receipt payloads contain a random proposal ID and a digest of public output, not private intention.
- External destination links are explicit choices with `rel=noreferrer`; opening them is separate from data synchronization or account linking.
- The local server exposes only five allowlisted assets, accepts GET/HEAD only, binds to loopback, and sets a restrictive CSP, no-referrer and no-store headers. It is not a production host.
- Never commit founder documents, medical history, payment details, keys, private messages or grants to this public repository.

## Reporting

Do not open public issues containing sensitive information. Report a redacted reproduction to the repository owner using a private contact channel already verified with them.

## Implementation references consulted

- Node Web Crypto: https://nodejs.org/api/webcrypto.html
- GitHub minimum workflow permissions: https://docs.github.com/en/actions/tutorials/authenticate-with-github_token

These references support implementation primitives; they do not certify this package.

## v0.1.1 hardening boundaries

Read [HARDENING.md](HARDENING.md) for findings, digest-version migration and regression evidence. Input validation accepts bounded data-only records and dense arrays; it does not sandbox live Proxies or compromised JavaScript. Approval capacity is bounded per session generation and reserved before async hashing. Local preview requests must name an exact loopback Host and matching Origin; no cross-site resource fetch or URL-normalized traversal is accepted. The default CLI still binds only to 127.0.0.1.

Receipt shape validation is not authenticity. A plausible metadata alteration cannot be detected by the unsigned content digest. A receipt is never a ticket. Detected clock faults revoke the session; create a new session to continue. Lifecycle clearing is best-effort, not a guarantee of secure erasure or browser-event delivery.
