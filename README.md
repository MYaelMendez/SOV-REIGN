# Open Sovereign

**^æ / Agency 001 - Agentic Electronic Engineering**

> Return value to the human. ❤️ Human intention comes first.
> Many agents. One principal. Context may propagate; authority does not.

Open Sovereign now inhabits **MYaelMendez/SOV-REIGN**. This is a dependency-free, runnable **reference sovereignty kernel**, not a production identity service or an independently authorized agent.

## Run locally

Node.js 22 or newer. No npm installation or API key is required.

```sh
npm run check
npm run demo
npm start
# Open http://127.0.0.1:4173
```

The preview is local-only. It does not connect to doola, OpenAI, Codex, email, payments, or deployment services.

## The first useful operation

1. Write a private intention in the browser tab: what value should return to you?
2. Choose a public agency name, public purpose, and preferred executor.
3. Prepare and inspect the exact public manifest. Private intention is excluded.
4. Confirm that record. Approval is bound to its digest, session, operation and expiry.
5. Download the public draft with an unsigned local receipt. Changing a field invalidates review.

This is **local review and export**, not legal formation, authenticated human identity, or publication. The principal must not put secrets into the public name or purpose fields.

## What is implemented

- Strict public-manifest input validation and allowlisted projection.
- Local entry aliases: `$ae`, `æ`, `$æ`, `$mcp`, `&mcp`, `$@❤️`, and a public-review address. The supported exact strings are in `src/kernel.mjs`.
- In-memory, digest-bound, expiring, single-use approval tickets for `manifest.export` only.
- Rejection of forged/imported/replayed/cross-session approvals and unknown operations.
- Molt context envelopes with a parent and public references, without inherited authority.
- SHA-256 output-integrity checks, with receipts explicitly marked unsigned and local.
- A mobile-friendly reference UI, synthetic founding-agency example, local demo, tests, and a manual GitHub validation workflow.

## Architecture and boundaries

`Human intention -> prepare -> review -> local approval -> public draft -> receipt`

The original **MYaelMendez.github.io** monosite stays in its existing repository. The chat cockpit and the existing OpenAI Site remain peer destinations; neither is replaced. This repository supplies a proposed shared policy layer, not automatic synchronization.

`^æ` is the founding agency. Other users may adapt the example under their own identity. Model, agent and viewport roles (MoM / MoA / MoV) are composition vocabulary; there is no connected inference runtime here. Choosing Codex changes a preference only.

**Molt Context Protocol** is this project's context vocabulary, not an implementation or replacement of the external Model Context Protocol standard. Symbolic aliases and coordinates are local conventions, not registered platform commands or permissions.

Read [the architecture](docs/ARCHITECTURE.md), [the threat model](docs/SECURITY.md), [publication gates](docs/PUBLISHING.md), and [verification evidence](VALIDATION.md).

## Source map

| Path | Purpose |
| --- | --- |
| `src/kernel.mjs` | Public projection, aliases, local approval gate, context and receipts |
| `index.html`, `web/` | Reference UI; private intention remains in memory |
| `examples/agency-ae.json` | Synthetic Agency 001 public configuration |
| `scripts/` | Loopback-only static preview and terminal demo |
| `tests/` | Kernel and HTTP-boundary tests |
| `.github/workflows/validate.yml` | Manual, read-only validation; no deployment |

## Release status

The implementation is prepared for review. No production deployment, provider pairing, plugin update, domain change or release to the existing monosite is included. A local receipt demonstrates local output integrity, not external success.

MIT applies to the original code in this repository. It does not license external brands, the separate monosite, third-party services or model weights. New license and implementation are review-branch proposals until merged.
