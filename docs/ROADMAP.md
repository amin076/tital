# Tital Roadmap

Status date: **2026-08-15**

This document describes recommended next development work. It is **not** a list of capabilities that already exist. For current implementation status, see [CURRENT_STATUS.md](CURRENT_STATUS.md).

## Completed foundation — governed end-to-end MVP core

The core persisted workflow is now implemented and has completed a live end-to-end Europa validation:

```text
create project session
→ persist state locally
→ execute the next legal automated stage
→ persist generated records
→ stop at a human gate
→ accept explicit approve/reject
→ retain rejected history
→ continue from stored state
→ run deterministic audit
→ build ProductionPackage
→ COMPLETE / READY_FOR_PRODUCTION
```

The live test used real Gemini/Vertex AI generation and real Parallel Search MCP source discovery. The implementation deliberately does not auto-approve model output. Local persistence remains an MVP JSON store, not a production database architecture.

See [MVP End-to-End Validation](MVP_E2E_VALIDATION.md).

## Priority 1 — minimal product UI

The next major milestone is a small React/TypeScript interface around the already-working persisted workflow.

This priority moved ahead of further backend expansion because the completed Europa test showed that CLI review, copied JSON, and manual record-ID commands are now the main usability bottleneck.

The first UI should expose:

```text
Project / current gate
Define
Research Questions
Sources
Evidence / Claims
Script
Scenes / Shots
Visual Decisions
Audit
Package
```

Required interactions:

```text
Approve
Reject
Continue
Regenerate when coverage is missing
Inspect source/evidence/claim provenance
Inspect uncertainty and scientific constraints
Inspect audit findings
Open final Production Package
```

The most important experience is provenance navigation: a user should be able to move from a script line, scene, shot, or visual decision backward to claims, evidence, and sources.

The UI must call the existing governed services/state machine rather than re-implementing business rules in the frontend.

### UI milestone definition of done

A user should be able to repeat the current Europa workflow without manually copying JSON or typing record IDs into review commands.

At minimum:

```text
open/list persisted projects
see current stage and blockers
inspect pending records
select one or more records
approve/reject visibly
continue the workflow
see generation/runtime errors
trace provenance backward
inspect audit result
inspect final package status
```

## Priority 2 — strengthen source-to-evidence verification

Current Parallel integration uses Search MCP for source discovery and preserves source excerpts/provider provenance. A stronger evidence workflow should add controlled source-content retrieval for approved sources where appropriate.

Candidate direction:

```text
Parallel web_search
→ SourceRecord DISCOVERED
→ human source approval
→ Parallel web_fetch / approved content retrieval
→ validated source content
→ Evidence Extraction Agent
→ EvidenceRecord REVIEW_REQUIRED
```

Before implementation, verify the current Parallel MCP tool contract and usage limits. Do not store full copyrighted documents unnecessarily.

This work should follow the first usable UI unless the absence of full-content retrieval blocks the hackathon demo's scientific credibility.

## Priority 3 — deterministic uncertainty and visual-constraint governance

The Europa run exposed two high-value audit gaps:

```text
UNCERTAINTY_DROPPED
SCIENTIFIC_CONSTRAINT_VIOLATION
```

These should not be implemented as naive text-field inheritance rules.

For example, a Claim may legitimately reference an Evidence record containing uncertainty about an interpretation while making only a direct observational statement. The uncertainty rule therefore needs to consider whether the downstream proposition depends on the uncertain inference.

Likewise, VisualDecision constraint checking should detect meaningful weakening or contradiction of the approved Shot constraint rather than only comparing categories.

## Priority 4 — dependency invalidation / staleness

The current session layer invalidates the stored audit after new generation/review decisions, but it does not yet propagate formal downstream staleness after an approved upstream record is edited/replaced.

Future behavior should support relationships such as:

```text
Source/Evidence changed
→ Claim potentially stale
→ ScriptLine potentially stale
→ Scene/Shot/VisualDecision potentially stale
→ Audit required again
```

Start with deterministic dependency invalidation before designing a large knowledge-graph system.

## Priority 5 — persistence hardening

The local JSON session store is sufficient for the MVP/developer workflow. Before multi-user or deployed production use, define a stronger persistence contract for:

- schema/session versioning and migrations;
- project ownership and reviewer identity;
- concurrency/optimistic locking;
- transactional state + event updates;
- cloud/database storage;
- backup/export/import behavior.

A known legacy Evidence uncertainty representation is already normalized on load, but this is not yet a general migration framework.

Do not replace the simple store with a large abstraction until the web UI and deployment requirements are clear.

## Priority 6 — scientific status and contradiction model

The product vision includes richer epistemic status and contradiction handling. The current `ClaimRecord` is intentionally smaller.

A future schema iteration can explore categories such as observation, experiment, strong inference, model-dependent inference, theoretical prediction, consensus, debate, hypothesis, or analogy—but only after the ontology is designed and migration implications are understood.

## Priority 7 — deployment and hackathon demo

After the minimal UI can drive the existing governed vertical slice:

1. deploy the runnable application using the chosen Google Cloud path;
2. verify Gemini/Google Cloud use in the deployed runtime;
3. verify real Parallel MCP use in the deployed/demo runtime;
4. preserve visible provenance and human-gate behavior in the deployed UI;
5. capture enough runtime evidence for judging/submission;
6. create the three-minute demonstration around the validated Europa-style scientific-film journey;
7. complete Devpost submission materials.

## Explicitly deferred

Unless required to prove the core workflow, do not prioritize:

```text
advanced authentication/billing
mobile apps
large multi-tenant architecture
video rendering engine
3D editor
general production-management suite
custom ML models
large knowledge-graph infrastructure
many decorative agents
```

## Guiding question

For every roadmap item ask:

> Does this make it easier for a filmmaker to transform scientific evidence into a scientifically defensible film decision while preserving traceability?

If not, it is probably not an MVP priority.
