# Tital Current Status

Status date: **2026-08-17**

This document is the factual implementation snapshot for Tital after the governed web UI milestone merged in PR #10. It distinguishes implemented code, live-validated behavior, current limits, and immediate post-MVP work.

## Product status

Tital is a working **evidence-governed scientific film director** that turns a scientific-film idea into a human-reviewed, provenance-connected production package.

Core principle:

> **Evidence → Story, not Story → Evidence.**

The implemented chain is:

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

The application, not the model, owns trusted IDs, statuses, provenance links, approval transitions, workflow eligibility, audit execution, and final package construction.

## Implemented now

| Area | Status | Notes |
|---|---|---|
| TypeScript / Node.js core | Implemented | Main domain, services, persistence, API, and orchestration are TypeScript. |
| Google ADK | Implemented | Specialized `LlmAgent` stages are used as proposal generators. |
| Gemini / Vertex AI | Implemented and live-validated | Used in completed live sessions. |
| Parallel Search MCP | Implemented and live-validated | Real MCP-backed source discovery through `parallelSourceAgent`. |
| React / Vite / MUI web UI | Implemented and live-validated | Drives persisted sessions without copying CLI JSON or record IDs. |
| Local HTTP API | Implemented | Session create/list/read/review/continue adapter around existing governed services. |
| FilmBrief through VisualDecision domain chain | Implemented | Structured, schema-validated records with explicit provenance. |
| Human review gates | Implemented and live-validated | Generated records do not silently approve themselves. |
| Coverage-aware workflow evaluator | Implemented | Progression depends on approved provenance-connected coverage, not simple counts. |
| Rejection recovery | Implemented and live-validated | Rejected history remains persisted while missing approved coverage can be regenerated. |
| Trusted parent-ID ownership | Implemented | Shot `sceneId` and VisualDecision `shotId` are assigned by application code, not echoed by Gemini. |
| Local JSON session persistence | Implemented and live-validated | Sessions survive process restarts and separate UI/API runs. |
| Session event history | Implemented | Records automation, review decisions, audit, and package events. |
| Governance / provenance audit | Implemented | Deterministic integrity checks over the approved production chain. |
| Production package | Implemented and live-validated | Deterministic final package built from approved provenance-connected records. |
| Traceability UI | Implemented | Shows approved chain from sources/evidence through claims, script, scenes, shots, and visual decisions. |
| Human-readable final results | Implemented | Final package is readable in the UI rather than exposed as raw JSON. |
| JSON export | Implemented | Canonical machine-readable production package for APIs and downstream systems. |
| Text export | Implemented | Human-readable text report. |
| Styled PDF workflow | Implemented and live-validated | Browser print report with dedicated A4 styling and improved pagination. |
| Tests / typecheck / web build | Implemented | Latest validated UI branch reported 34 test files / 172 tests plus successful typecheck and production web build. |

## Live end-to-end validations

### 1. Europa — first complete persisted MVP run

On **2026-08-15**, Tital completed its first persisted human-governed end-to-end workflow using the evidence for Europa's subsurface ocean.

That run validated the full backend/session path with real Gemini/Vertex AI and real Parallel MCP source discovery, while review was still driven through the CLI.

See [MVP_E2E_VALIDATION.md](MVP_E2E_VALIDATION.md).

### 2. Black-hole film — complete web-UI run

On **2026-08-16**, the new web UI drove a second complete persisted end-to-end project:

> **Unveiling the Invisible: How We Know Black Holes Exist**

The run exercised:

```text
New Project UI
→ FilmBrief review
→ Research Question review
→ Source review
→ Evidence review and rejection recovery
→ Claim review
→ Script review
→ Scene review
→ Shot review
→ Visual Decision review
→ deterministic audit
→ Production Package
→ COMPLETE
```

The approved production package contained:

```text
Research Questions   4
Sources             18
Evidence            24
Claims              10
Script Lines        12
Scenes               8
Shots               14
Visual Decisions    14
```

The same run exposed and led to fixes for two reliability defects where Gemini had been asked to echo trusted parent IDs. Application code now owns those relationships.

The styled PDF report was generated and reviewed. Pagination improvements reduced the tested report from 38 pages to 31 pages while preserving the full package content.

**Important:** this Black-hole run was an end-to-end product test. Human approve/reject choices were intentionally not treated as a scientific expert review. Therefore the final audit must be described accurately as a governance/provenance audit, not as independent proof that all approved scientific content is true.

## Current web application boundary

Current local runtime:

```text
React / Vite / MUI web UI
        ↓ HTTP
local Node API
        ↓
persisted session/application services
        ↓
JsonMvpSessionStore
        ↓
Google ADK / Gemini / Parallel MCP when an automated stage requires them
```

Useful commands:

```bash
npm run api:dev
npm run web:dev
npm run typecheck
npm test
npm run web:build
```

Default local endpoints:

```text
Web: http://127.0.0.1:5173/
API: http://127.0.0.1:8787/
```

Default local session storage:

```text
.tital/sessions/<session-id>.json
```

## Audit scope

The deterministic audit checks repository-defined governance and provenance rules such as:

```text
BROKEN_PROVENANCE
UNAPPROVED_UPSTREAM_RECORD
VISUAL_CATEGORY_MISMATCH
MISSING_VISUAL_DISCLOSURE
UNSUPPORTED_CLAIM
```

The final UI/report wording intentionally describes this as a **Governance & provenance audit**.

It does **not** independently verify the scientific truth, authority, or quality of all human-approved content.

High-value future rules still include:

```text
UNCERTAINTY_DROPPED
SCIENTIFIC_CONSTRAINT_VIOLATION
```

These should be proposition-aware / semantic checks rather than naive field-copy rules.

## Important current limits

### Source verification

Parallel MCP currently discovers public-web sources and preserves excerpts/metadata in `SourceRecord`. Evidence extraction operates on the approved source record excerpts.

Tital does **not yet** perform a dedicated full-content retrieval step for every approved source. Source discovery and evidence verification must not be described as the same thing.

### Persistence

`JsonMvpSessionStore` is a good local MVP store, not a production cloud database.

Still missing for production use:

- cloud-durable session persistence;
- schema/session versioning and general migrations;
- concurrency / optimistic locking;
- transactional project state + event updates;
- authenticated ownership and reviewer identity;
- backup / restore semantics.

### Editing and staleness

The current product supports create, review, continue, recovery, audit, and package construction. It does not yet provide a full user-facing edit/replace workflow with deterministic downstream staleness propagation.

Future behavior should support:

```text
upstream approved record changes
→ dependent downstream records become stale
→ affected stages are regenerated / re-reviewed
→ audit becomes required again
```

### Deployment

The application is currently a local web/API product. A public hosted deployment has not yet been completed.

### Final media execution

Tital produces a governed **production package**. It does not currently render the final film, operate a 3D editor, or act as a generic video generator.

## Immediate post-MVP milestone

The minimal governed web UI milestone is complete.

The next major engineering milestone is now:

> **Cloud Deployment Foundation**

Target outcome:

```text
public hosted Tital URL
→ hosted React UI
→ hosted API
→ Vertex AI / Gemini works in deployed runtime
→ Parallel MCP works in deployed runtime
→ durable cloud sessions
→ one completed hosted end-to-end project
```

After that, the highest-value scientific improvement is controlled full-source retrieval / verification for approved sources before evidence extraction.

See [ROADMAP.md](ROADMAP.md) and [POST_MVP_REVIEW.md](POST_MVP_REVIEW.md).
