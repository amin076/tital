# Tital Project Handoff

Status date: **2026-08-17**

This is the current operational handoff for Tital after PR #10 merged the governed React web UI, final production-package view, workflow coverage display, provenance traceability, and readable exports.

For implementation truth, reconcile this document with the repository, [CURRENT_STATUS.md](CURRENT_STATUS.md), [ROADMAP.md](ROADMAP.md), and [POST_MVP_REVIEW.md](POST_MVP_REVIEW.md).

## Product definition

**Tital — Evidence-Governed Scientific Film Director**

Tital turns a scientific question or film idea into an evidence-governed production package while preserving provenance, uncertainty, human approval, and visual scientific integrity from research through filmmaking decisions.

Core principle:

> **Evidence → Story, not Story → Evidence.**

North Star:

> A filmmaker should be able to ask, “Why are we saying or showing this?” and receive a traceable scientific answer.

Tital is not intended to be a generic AI video generator, generic research chatbot, or generic storyboard tool.

## Product phases

The five user-facing phases remain:

```text
1. DEFINE
2. RESEARCH & VERIFY
3. DEVELOP
4. DIRECT
5. AUDIT & PACKAGE
```

The implemented record chain is:

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

## Governance contract

The central engineering boundary is:

```text
Model proposes
→ deterministic service validates
→ application assigns trusted IDs / provenance / status
→ human reviews
→ next stage becomes eligible
```

Models do not silently control workflow status, trusted IDs, provenance relationships, or human approval.

This boundary was strengthened during the Black-hole UI run: `sceneId` for Shot records and `shotId` for VisualDecision records are now assigned by application code rather than echoed by Gemini.

## Current technical architecture

Current stack:

```text
TypeScript / Node.js
React 19
Vite
MUI
Google ADK
Gemini 2.5 Flash
Vertex AI
Parallel Search MCP
Zod
Vitest
local JSON persisted sessions
small local Node HTTP API
```

Current runtime concept:

```text
User / Reviewer
→ React Web UI
→ local Node API adapter
→ persisted MVP session
→ execution controller
→ workflow evaluator
→ real service executors
→ Google ADK agents
→ Gemini / Vertex AI
→ Parallel MCP for source discovery
→ validated application-owned records
→ human gate
→ deterministic governance/provenance audit
→ ProductionPackage
```

The CLI remains available for development and inspection, but the main demonstrated product interaction is now the web UI.

## Implemented web UI

The merged web milestone supports:

```text
create project from a raw scientific-film idea
list/open persisted projects
see current stage and next action
see counts and approval/rejection status
inspect human-readable pending records
select one or many pending records
approve/reject
continue the governed workflow
recover missing approved coverage after rejection
see full stage progress
see approved-chain coverage ratios
inspect final Production Package
trace source/evidence → claim → script → scene → shot → visual decision
export JSON
export text
print/save styled PDF
```

JSON remains the canonical machine-readable output. Human-facing UI and reports intentionally present readable structured content instead of JSON dumps.

## Parallel integration

The current partner path is real runtime use of Parallel Search MCP for source discovery.

`parallelSourceAgent` is required to call Parallel `web_search` before returning source candidates. The application preserves provider provenance including `providerSearchId` when present.

Current limitation:

```text
source discovery
≠
full source verification
```

Evidence extraction currently operates from approved `SourceRecord` search excerpts. Tital does not yet perform a dedicated full-content retrieval step for every approved source.

The next scientific-strengthening milestone should introduce controlled approved-source retrieval before evidence extraction.

## Persisted sessions

Default local storage:

```text
.tital/sessions/<session-id>.json
```

The local store validates the complete session schema on load/save and uses temporary-write-plus-rename behavior.

CLI actions remain available:

```text
start
status
continue
review
show
list
```

The web UI uses the same underlying governed session/application services through a small HTTP adapter; it does not re-implement workflow rules in React.

## Live end-to-end validation history

### Europa — 2026-08-15

The first complete persisted MVP run used the Europa subsurface-ocean evidence question.

It validated the backend workflow, real Gemini/Vertex calls, real Parallel MCP source discovery, explicit human review, rejection-aware progression, deterministic audit, and final production package.

This run was CLI-driven.

Detailed report: [MVP_E2E_VALIDATION.md](MVP_E2E_VALIDATION.md).

### Black-hole web run — 2026-08-16

The second complete end-to-end project was driven through the React web UI:

> **Unveiling the Invisible: How We Know Black Holes Exist**

Final approved production-chain counts:

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

The run validated:

```text
web project creation
human review UI
selective approve/reject
rejection recovery
coverage-based progression
complete governed workflow
final results UI
traceability UI
JSON / text export
styled PDF report
```

The run intentionally used non-expert/random approve/reject choices in places to exercise workflow behavior. It must not be presented as a scientific expert validation of the resulting Black-hole content.

## Audit terminology

The deterministic audit checks governance/provenance conditions such as:

```text
BROKEN_PROVENANCE
UNAPPROVED_UPSTREAM_RECORD
VISUAL_CATEGORY_MISMATCH
MISSING_VISUAL_DISCLOSURE
UNSUPPORTED_CLAIM
```

Final human-facing output should call this a:

> **Governance & provenance audit**

It does not independently prove the scientific truth, source authority, or expert quality of every human-approved record.

Future high-value rules include:

```text
UNCERTAINTY_DROPPED
SCIENTIFIC_CONSTRAINT_VIOLATION
```

## Current important limitations

### Local-only deployment

The current web app and API are local development surfaces. No public hosted deployment exists yet.

Default endpoints:

```text
Web: http://127.0.0.1:5173/
API: http://127.0.0.1:8787/
```

### Local JSON persistence

The current store is appropriate for MVP/local development, not cloud concurrency or multi-user production.

Missing:

```text
cloud-durable storage
formal schema migrations
optimistic locking / concurrency
transactional state + event persistence
authenticated ownership
reviewer identity
backup / restore policy
```

### No general edit/staleness lifecycle

Tital can create, review, reject, recover coverage, audit, and package. It does not yet provide a full edit/replace workflow that deterministically marks dependent downstream records stale.

### No final video rendering

Tital currently produces a governed production package. It does not render the final video or replace a video-generation/rendering platform.

## Immediate next milestone

The minimal governed web UI milestone is complete.

Next major milestone:

> **Cloud Deployment Foundation**

Target:

```text
public hosted URL
→ hosted UI and API
→ durable cloud sessions
→ Vertex AI / Gemini works in deployed runtime
→ Parallel MCP works in deployed runtime
→ one complete hosted end-to-end run
```

After hosted deployment, the next highest-value scientific improvement is approved-source full-content retrieval / verification before Evidence extraction.

## Development rules to preserve

1. Models propose; application code governs trusted state.
2. Never let model output silently approve itself.
3. Keep application-owned IDs and provenance out of model trust.
4. Preserve rejected records as history.
5. Progress by approved provenance-connected coverage, not arbitrary counts.
6. Keep JSON canonical for machines and readable views for humans.
7. Keep audit claims narrower than actual implemented checks.
8. Avoid unnecessary live Gemini/Parallel calls in tests.
9. Add deterministic tests before paid/live runtime validation.
10. Prefer the smallest product step that strengthens the evidence-to-film chain.
