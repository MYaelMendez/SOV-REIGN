# ÆQR 0.1 — Portable capability addressing for 🍊🦩 Flamingo

**Status:** proposal; no resolver, host adapter, device integration, or registered domain endpoint is claimed.

## Objective

Use a standards-compliant QR code as a **public context pointer** to a versioned Flamingo capability manifest. The QR does not encode credentials, user records, tenant data, access tokens, or authorization. Hosts must separately authenticate the principal, discover their own available capabilities, request least-privilege grants, and enforce approvals.

`$æ🍊🦩` is a **semantic invocation**, not an OpenAI platform-registered command.

## Resolution flow

```text
Human scans ÆQR
  → HTTPS manifest URL (public; allowlisted origin)
  → validate schema, version, integrity and origin
  → identify host capabilities (Chatline / Teams / Codex / future agents or devices)
  → map requested capability to available @plugins and $skills
  → principal identity + host-specific permission gates
  → preview bounded action
  → human approval where consequential
  → provider execution
  → source-linked witness receipt
  → human
```

## Example manifest (proposed; local fixture)

See [flamingo.aeqr.json](../aeqr/flamingo.aeqr.json). It is a **public fixture** with no operational endpoint. To issue a scannable ÆQR, first publish the validated manifest at an HTTPS URL under an owned domain, then encode **only that URL** with a standards-compliant QR generator. Keep the QR quiet zone and error correction intact; emoji overlays must not interfere with scanning.

### Adapter policy

| Host target | Intended behavior | Status |
| --- | --- | --- |
| ChatGPT / Chatline | Conversational widget entry point; verified tools only | Proposed |
| OpenAI team workspace | Shared workflow with workspace permissions | Proposed |
| Codex | Reviewable repo implementation handoff, separate GitHub grant | Proposed |
| Dots | Conditional/ongoing workflow if supported by documented product interfaces | Exploratory |
| Future OpenAI hardware | Context-aware launch only through documented device APIs | Exploratory |

No adapter can inherit a ChatGPT session or GitHub permission merely because the same QR was scanned.

## Threat model / acceptance checks

- Reject unknown schema versions, invalid URLs, untrusted origins, unsupported hosts, and unbound providers.
- Resolve public manifest only; **no private tenant/lease/payment data** in the QR or manifest.
- Prevent redirects to untrusted origins and avoid embedding arbitrary executable instructions.
- Verify publisher provenance; consider a signed manifest when a trustworthy key-distribution model exists.
- Preserve host-specific authentication and least-privilege authorization; no ambient grant transfer.
- Require review for payment, lease, notice, vendor dispatch, and other consequential operations.
- Store only privacy-safe receipt references publicly; private witness records remain access-controlled.
- Label synthetic metrics and disconnected integrations as demo/unbound.
- Test on actual QR scanners and host clients before claiming interoperability.

## First vertical slice

1. Publish an owned HTTPS manifest endpoint.
2. Implement a validator/resolver and a compliant QR encoder.
3. Build one Chatline read-only landlord briefing with a verified data source.
4. Implement Codex handoff as an explicit reviewed artifact, not autonomous repo access.
5. Add a witness receipt for a human-approved test action.
6. Evaluate team permissions and future adapters independently.

**Invariant:** Context may propagate; authority does not. Many agents. One principal.
