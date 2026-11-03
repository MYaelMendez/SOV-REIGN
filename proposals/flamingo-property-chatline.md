# 🦩 Flamingo · Sovereign Property Chatline

> **Hey, you, landlord. This is your Chatline. ❤️ Work here.**

Status: **proposal / conceptual prototype**. No live property, resident, payment, vendor, or regulatory integration is asserted.

## Purpose

A human-owned conversational operating environment for solo landlords managing **2–10 rental units**, extensible to multifamily property teams and residential community development.

Flamingo does **not** replace the property owner's judgment or become a legal property manager. It composes existing **@plugins** (authorized external capabilities) and **$skills** (reusable workflows) into reviewable **$9_16 agentic widgets**.

```text
HUMAN://principal
  → $flamingo (intent + portfolio context)
  → DISCOVER @plugin capability
  → SELECT $skill workflow
  → BIND verified provider + least privilege
  → PREVIEW proposed result
  → HUMAN APPROVAL (for consequential action)
  → EXECUTE through authorized provider
  → WITNESS actual result + provenance
  → HUMAN://value ❤️
```

**Invariant:** Many agents. One principal. Context may propagate; authority does not.

## Initial widget surfaces

| Widget | Human request | Required source / gate | Output |
| --- | --- | --- | --- |
| 🏡 Portfolio | “Show my rentals” | Authorized unit/property records | Occupancy, unit roster, lease milestones |
| 💵 Rent | “Who paid?” | Verified ledger/payment provider | Collections, exceptions, follow-up drafts |
| 🔧 Repairs | “What's broken?” | Authorized work-order and vendor records | Triage, estimates, approval queue |
| 📅 Today | “What needs my attention?” | Calendar + authorized property records | Daily briefing and prioritized actions |
| 🧾 Books | “Prepare my monthly report” | Verified transaction and expense data | Reviewable operating statement and receipts |
| 📨 Residents | “Draft a response” | Authorized communications | Draft for human review; no automatic sensitive send |
| 🌴 Community | “Plan the property” | Survey, GIS, engineering and ecology inputs | Concept master plan, constraints, phased tasks |

The **15-acre / 55% water / 12-home** Flamingo Living village is a separate **illustrative design scenario**, not a verified, permitted development. Its preliminary land allocation is 8.25 acres water, 4.50 acres habitat, and 2.25 acres housing/paths/shared use. Feasibility requires surveys, hydrology, floodplain and wetland review, utility planning, access, and permits.

## Capability registry contract (proposal)

```json
{
  "id": "flamingo.property.daily-brief",
  "symbol": "🦩",
  "invocation": "$flamingo",
  "audience": "owner-operator",
  "provider": null,
  "required_scopes": ["property.read", "ledger.read", "workorders.read"],
  "skill": "property-daily-brief",
  "state": "unbound",
  "actions": ["preview"],
  "approval": "human-required-for-writes",
  "witness": ["source", "timestamp", "scope", "result"],
  "public_address": null
}
```

Provider, scope, skill identifiers, and address are **proposed contracts**, not registered permissions or live bindings. A public OPEN QR may carry a safe widget identity or manifest URL, **never credentials, private tenant data, or authority**.

## Privacy, safety and operational boundaries

- Tenant data is private by default; minimize access and retention, isolate properties and principals.
- Payments, rent notices, lease changes, screening, vendor dispatch, and legal actions require applicable permissions and human review.
- Fair-housing, privacy, habitability, local licensing, and notice rules require jurisdiction-specific professional/legal review.
- Skills do not grant external authority. A discoverable plugin is not necessarily installed, connected, or authorized.
- Distinguish sample metrics from verified live data; never fabricate collections, vacancies, balances, or receipts.
- Witness records reflect actual provider confirmations; draft previews are not execution receipts.
- No deployment or automatic actions are enabled by this document.

## Delivery milestones

1. **Discover**: inventory relevant connected @plugins and existing $skills; record supported read/write operations.
2. **Bind**: create an owner-approved property data schema and provider adapters, with least-privilege scopes.
3. **Demonstrate**: build a $9_16 mobile-first widget with synthetic fixtures and explicit demo labels.
4. **Verify**: test read-only portfolio, rent and maintenance summaries against permitted test accounts.
5. **Gate**: implement approval previews, action logs, idempotency and failure handling before any writes.
6. **Pilot**: onboard one consenting 2–10-unit landlord; measure time saved, correctness and usability.
7. **Expand**: add multi-property operations and the separate Flamingo Living development studio.

## Acceptance criteria for first release

- A landlord can request a daily brief conversationally without navigating several apps.
- Every live figure links to an authorized source and as-of timestamp.
- Missing integrations are visibly **unbound**.
- No consequential write occurs without review and provider authorization.
- The human can inspect a witness receipt and return to the Chatline.

**Positioning:** *Your properties. Your decisions. Your Chatline.* ❤️
