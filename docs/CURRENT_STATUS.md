# Tital Current Status

Status date: **2026-08-20**

Tital is a working **evidence-governed scientific film director** with a hosted Cloud Run application, Cloud Storage session persistence, Firebase-authenticated live workflow, public landing/demo shell, human-governed recovery from rejected content, and a provenance chain from scientific idea to production package.

Core principle:

> **Evidence → Story, not Story → Evidence.**

Implemented chain:

```text
FilmBrief
→ ResearchQuestion
→ SourceRecord
→ EvidenceRecord
→ ClaimRecord
→ ScriptLineRecord
→ SceneRecord
→ ShotRecord
→ VisualDecisionRecord
→ Governance / provenance audit
→ ProductionPackage
```

## Trust boundary

The application, not the model, owns trusted IDs, statuses, provenance links, approval transitions, session ownership, workflow eligibility, audit execution, and final package construction.

The hardened model-reference rule is:

```text
model sees numbered approved inputs
→ model returns numbered references
→ application maps numbers to trusted IDs
```

This is used where the model must refer to approved upstream records. Parent identity is attached by application code whenever possible.

## Implemented / validated areas

| Area | Status | Notes |
|---|---|---|
| TypeScript / Node.js core | Implemented | Domain, services, orchestration, API and persistence. |
| Google ADK + Gemini / Vertex AI | Implemented and live-validated | Specialized proposal-generating agents. |
| Parallel Search MCP | Implemented and live-validated | Source discovery uses Parallel MCP; malformed candidates are isolated rather than failing a valid batch. |
| React / Vite / MUI web UI | Implemented and live-validated | Human review, workflow progression, production results. |
| Cloud Run | Deployed and live-validated | Hosted service in `australia-southeast1`. |
| Cloud Storage persistence | Implemented and live-validated | Authenticated sessions persist across revisions. |
| Firebase Email/Password auth | Implemented and live-validated | Client sign-in + backend ID-token verification. |
| User session isolation | Implemented | Hosted user sessions are namespaced by Firebase `uid`. |
| Public landing/demo shell | Implemented | Completed public demo requires safe promotion/configuration of a curated session snapshot. |
| Human review gates | Implemented and live-validated | No silent model approval. |
| Rejection recovery | Implemented and live-validated | No silent regeneration; explicit Retry / Waive / Cancel. |
| Coverage waivers | Implemented and live-validated | Intentional omissions persist as `CoverageWaiver` governance records. |
| Governance/provenance audit | Implemented | Deterministic integrity checks; not independent scientific peer review. |
| Production package + exports | Implemented and live-validated | JSON, readable text, styled browser/PDF workflow. |
| GitHub Actions WIF CI/CD | Implemented and validated | PR validation and main push deployment use short-lived Workload Identity Federation credentials. |
| Project Director Brief | Implemented in current hardening | Project-level cinematic preferences feed Scene/Shot/Visual generation without overriding science. |
| Cinematic decision provenance | Implemented in current hardening | Application records whether AI recommendation used Director Brief/scoped instruction. |
| Bounded external-call concurrency | Implemented in current hardening | Independent calls inside a stage run with conservative bounded concurrency; true stage dependencies remain sequential. |
| Runtime timing traces | Implemented in current hardening | New automation events can persist per-stage and per-external-call timing. |

## Recent reliability fixes

### Rejected Evidence regeneration loop

A Source whose generated Evidence had all been rejected previously looked uncovered because coverage inspected only approved Evidence. The executor could therefore regenerate semantically identical Evidence with new IDs.

Fix:

```text
any Evidence attempt for a Source
→ Source is not automatically re-extracted
```

Explicit human retry is required for a replacement.

### Evidence coverage semantics

Source approval means a Source is acceptable for consideration; it does **not** force a reviewer to approve some Evidence from every Source.

Evidence coverage therefore requires approved Evidence for each required approved Research Question through approved provenance, not approved Evidence from every approved Source.

### Rejection recovery generalized to every governed stage

The same silent-regeneration risk existed downstream. Tital now treats rejected content as terminal history across Sources, Evidence, Claims, Script Lines, Scenes, Shots and Visual Decisions.

If rejection would create a required coverage gap:

```text
Reject
→ warning
→ Retry replacement | Waive intentional gap | Cancel
```

Targeted retry applies duplicate filtering. Waive persists a `CoverageWaiver` rather than pretending the gap never existed.

## Completed dinosaur E2E

The hosted project **What Really Killed the Dinosaurs?** completed the governed workflow through `READY_FOR_PRODUCTION` and audit on 2026-08-20.

The resulting package demonstrated:

- five approved Research Questions;
- real Parallel-discovered Sources;
- Evidence → Claims → Script → Scenes → Shots → Visual Decisions;
- explicit human rejection decisions;
- one intentional Scene coverage waiver;
- scientific-reconstruction / conceptual-visualization disclosures;
- final governance/provenance audit.

This run exposed and validated the coverage-gap/retry/waiver product requirement.

Scientific caveat: a passed governance audit confirms chain integrity, not source authority or scientific truth. The dinosaur run also showed why future source-authority and uncertainty-preservation checks remain valuable.

## Director control

Tital should not treat a scientifically supported scene as having one objectively correct cinematic solution.

The current Director-control increment adds a project-level `DirectorBrief` with compact structured preferences and free-text notes, inherited by Scene, Shot and Visual Decision generation. Scoped instructions can also guide targeted cinematic replacement retries.

Precedence:

```text
science / provenance / uncertainty / visual-integrity constraints
> approved production constraints
> director guidance
> AI cinematic preference
```

See [DIRECTOR_CONTROL.md](DIRECTOR_CONTROL.md).

## Performance status

Static inspection found a clear application bottleneck: independent external calls within a stage were executed serially. Examples included source discovery per Research Question and Evidence extraction per Source.

The current performance increment adds conservative bounded concurrency and lightweight timing traces. No before/after percentage is claimed yet because the earlier dinosaur run did not contain comparable timing telemetry.

See [PERFORMANCE.md](PERFORMANCE.md).

## Hosted architecture

```text
Browser
  ↓
Cloud Run: tital
  ├─ React production UI
  └─ Node /api
       ↓
Firebase ID-token verification
       ↓
user-scoped session store
       ↓
Cloud Storage
       ↓
Vertex AI / Gemini + Parallel MCP when required
```

The Cloud Run endpoint is public at the network layer; application-level authentication protects live session routes. Anonymous access is intended for the landing page and a curated read-only demo only.

## Persistence

Local development:

```text
.tital/sessions/<session-id>.json
```

Hosted authenticated layout:

```text
gs://<bucket>/<prefix>/users/<firebase-uid>/<session-id>.json
```

Current limitation: no optimistic locking/session-version precondition yet. Conservative Cloud Run request concurrency remains appropriate until concurrent-update protection is implemented.

## Authentication

Public web configuration is supplied by `/api/public/config`. Firebase signs in the user; protected API requests send an ID token; Firebase Admin verifies it; decoded `uid` determines the session namespace.

The Firebase Web configuration is not a secret. Service-account keys, access/refresh tokens, judge passwords and other real secrets must never be committed or exposed to browser code.

## Public demo status

The landing and read-only demo route exist, but the completed authenticated dinosaur session must not simply be referenced by `TITAL_DEMO_SESSION_ID` because `/api/public/demo` reads from the base public store while authenticated sessions live under user-scoped prefixes.

The safe next step is a sanitized, immutable public-demo snapshot or an explicit promotion mechanism, followed by anonymous smoke testing.

## Source verification limit

Parallel MCP discovers public-web sources and preserves excerpts/metadata. Tital does **not yet** perform dedicated full-content retrieval/verification for every approved source before Evidence extraction.

```text
source discovery ≠ full source verification
```

Approved-source full-content verification remains a major scientific-quality milestone.

## Audit scope

The deterministic audit checks governance/provenance integrity such as broken links, unapproved upstream records, unsupported provenance, visual-category mismatch and required disclosure conditions.

It does **not** independently establish scientific truth or source authority.

High-value future semantic rules include:

```text
UNCERTAINTY_DROPPED
SCIENTIFIC_CONSTRAINT_VIOLATION
proposition-aware unsupported-claim detection
source-authority / citation evaluation
```

## Current major limitations

- no dedicated full-source retrieval/verification stage;
- no optimistic locking for concurrent session writes;
- public demo promotion/snapshot still needs final implementation and live anonymous validation;
- no complete general edit + downstream-staleness lifecycle;
- no reusable cross-project Director Profile store yet;
- no generalized lock/unlock/version-comparison UX for cinematic decisions;
- no live before/after performance benchmark yet for the new concurrency path;
- scientific audit remains governance/provenance validation, not peer review;
- final film rendering remains outside Tital's current product boundary.

## Validation commands

Every merge/deploy must pass:

```bash
npm run typecheck
npm test
npm run build
```

Live Vertex/Parallel performance measurements remain deliberate because they consume external quota/credits.
