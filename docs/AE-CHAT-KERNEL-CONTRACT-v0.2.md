# $æ / Chat Kernel contract v0.2 candidate

**The Great Conversation is the human experience. The Chat Kernel is the architecture that helps turn that experience into understanding, capability, and action.**

This is an incremental source change on `feat/ae-chat-kernel-contract-v02`, based on `a6f8e76b152128b979ac3a1af2279efe44dfccad`. It does not update the installed personal Skill, existing OpenAI Site, monosite, permissions, or deployed services.

## Three ports, no implicit authority

- **Conversation:** express intention, inspect context and reflect. Chat stays an operating destination, not a compulsory website launcher.
- **Engineering memory:** GitHub stores source, specifications, reviews and evidence. It is not private conversation storage.
- **Execution:** trusted software must independently authenticate and authorize consequential operations. No external execution adapter is added by this slice.

`INTENT -> CONTEXT -> COMPOSITION -> REVIEW -> ACTION -> WITNESS -> REFLECTION` is a possible human-led traversal, not an autonomous loop. This slice implements **read-only context inspection and composition review**; it deliberately does not advance to external ACTION.

## MoV v0.1 / implemented local slice

Run `npm start`, then open `http://127.0.0.1:4173/mov/` in an authorized browser. The existing local authority interface links to the same route. This is a route in the existing reference, not a new hosted Site.

1. Select Garden, Sanctuary, Mobility, and/or Learning.
2. Inspect the exact source URL, fixture revision, classification and capability.
3. Give the composition a public name and prepare its JSON and local digest.
4. Changing selection or name invalidates the displayed review. Changes during hashing are rechecked.
5. Reflect privately. Reflection is not read into composition, digests, storage or exports. Clear and lifecycle handlers remove local reflection best-effort.

All four entries are **synthetic**; their `example.invalid` URLs are deliberately not live. Sources are displayed as text, never fetched, embedded, navigated or granted privileges. This is not QR scanning, geographic lookup, medical guidance, inference, vehicle operation or a live provider feed.

The browser presents selections in registry order; the pure composition API preserves the supplied selection order. Same selection, title and registry produce the same content digest. A different order or title produces different content to review.

## Data contract

`parseRegistry(jsonText)` accepts at most 32 KiB of JSON text, not live JavaScript objects. It validates exact fields, schema/version, source revision, up to 16 unique viewport identifiers, public classification, synthetic provenance, text rendering, and the sole capability `viewport.read`. A composition accepts one to four unique known IDs.

Each source URL must be an unambiguous HTTPS DNS URL without credentials, port, query, fragment, local/IP target, ambiguous path or control characters. Unicode domain spelling is retained in the displayed original URL. These checks constrain identifiers; they are **not** remote-origin authentication, DNS verification or SSRF protection for a future fetching service. There is no source-fetching service here.

The returned composition includes exact origin/public labels, selected viewport records, registry provenance, empty effects, null grant, no inheritance, no dispatch, unverified provider connection and draft publication status. Additional authority, credential or private fields are rejected. Public free text can still contain sensitive information entered by a human; it requires review.

`reviewComposition` reuses the hardened kernel's local sorted-key digest. The digest describes public content only. It is not a signature, identity proof, external witness, deploy approval or executable ticket. No new approval system or export operation is introduced; the existing `manifest.export` gate remains unchanged.

The catalogue module is trusted bundled application code exporting JSON. Untrusted registries must be passed as JSON text, never imported as executable modules. The JSON parser has ordinary JavaScript duplicate-member semantics; parsed output, not raw-text spelling, is what gets reviewed. Live hostile Proxies, modified runtimes and malicious same-origin code are outside this local reference's guarantees.

## Entry continuity

`$chat` and `>_æ://CHAT_KERNEL` now resolve to the same local intention view as existing heart/ae/MCP entries. The ASCII identifier `$ae` remains supported. No global command registration or plugin installation is asserted.

The existing OpenAI Site and chat remain peer destinations. The MoV page is an optional local reference interface; it does not move or synchronize this conversation.

## Files and verification

- `src/viewports.mjs`: data validation, detached inspection and deterministic read-only composition.
- `mov/catalog.mjs`: four synthetic fixtures with an explicitly labelled inspected base revision.
- `mov/index.html`, `mov/app.mjs`, `mov/style.css`: local responsive interface; data uses textContent/value, not innerHTML.
- `tests/viewports*.test.mjs`: 32 added tests, including 10 DOM-harness cases and actual loopback HTTP checks.
- `tests/mov_browser_smoke.py`: optional separate browser gate. Not a passing browser result.

The local HTTP preview retains exact Host/Origin checks, GET/HEAD-only access and `connect-src 'none'`. Its allowlist adds the MoV HTML, styles and local modules; it does not gain a proxy or API route. These server headers do not automatically apply on GitHub Pages.

See `VALIDATION.md` for actual results. No new core dependencies, external requests, publication, model selection changes, account access or permission expansion.

## Next release gates

Review the source and run the browser script in an authorized environment. Test real mobile layouts, keyboard/screen-reader behavior, source inspection, stale-state invalidation and no external requests. Establish independently authenticated provider policy before adding any real operation. Preserve original third-party QR destinations and require an explicit compatible handoff when QR support is implemented.

**Compound capability, not dependency. Return value to the human.**

Implementation references checked for this change:
- https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
- https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
- https://nodejs.org/download/release/v22.16.0/docs/api/test.html
