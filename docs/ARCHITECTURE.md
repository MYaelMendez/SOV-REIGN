# Open Sovereign architecture / reference v0.1

## Human intention is the origin

The heart symbol is the pivot of human intention, not a cardiovascular product. A person decides what should matter. The agency prepares bounded work; it does not decide the person's goals or inherit authority from a prompt.

Origin: `x0:y0:z0:æ:æ`
Public projection: `x0:y0:z:0:æ:æ:æ`

These exact strings are constants in the kernel. Their named states mean local intention and public review, not authentication levels.

## Contracts

`publicManifest(profile)` accepts exactly `id`, `name`, `purpose`, `preferredExecutor`, and `capabilities`. It rejects extra keys and projects an explicit draft with null authority and unverified runtime connections. Free text must be reviewed: exclusion of private fields is not automatic PII detection.

`createSession()` owns isolated in-memory proposals and approvals. `prepare` validates and digests the fixed public projection. `approve` binds explicit local confirmation to the exact review digest. `execute` returns only a public draft. The approval is consumed before asynchronous return. `clear` cancels in-flight preparation and revokes all remaining approvals.

The only operation is `manifest.export`. No shell, provider API, email, purchase, filing, or publish adapter is installed. An approval ticket is an object identity: copying its JSON or moving it to another session does not authorize anything.

`moltContext(parentId, publicRefs)` creates a new envelope containing bounded public record identifiers and parent lineage. It accepts no payload or grants. References do not establish trust in the content they identify.

`verifyLocalReceiptIntegrity` compares a SHA-256 digest of the exact serialized public output. It does not verify a sender, digital signature, legal approval or provider result. JSON key ordering must be preserved; this is not a cross-language canonical signing format.

## Layers without false readiness

- Open Sovereign: policy contracts and educational reference implementation.
- ^æ: founding agency configuration; no separate legal entity is claimed.
- MoM / MoA / MoV: models, agents and viewports to compose later.
- MoW: proposed composition of independently governed widgets.
- molt.earth: intended discovery destination; not deployed by this package.
- GitHub: versioned source, reviews and optional manual validation.
- Existing chat and Site: peer destinations. Links do not prove login, synchronization, runtime pairing or tool availability.

## Next bounded integration

Connect one read-only consumer of the public manifest. Verify the same ID/version in each destination. Next, implement separately authenticated server-side policy for one real provider action, with minimum scopes, replay protection and provider evidence. No port of this local approval API should be exposed as public authentication.
