# Tital Post-MVP Review

Status date: **2026-08-17**

This review records the project state after the governed web UI milestone merged in PR #10 and identifies the smallest correct post-MVP priorities.

## Executive conclusion

Tital has crossed the MVP boundary.

The main open question is no longer:

> Can the governed evidence-to-film workflow complete?

That has been demonstrated twice: first through a persisted CLI-driven Europa run and then through a complete React web UI Black-hole run.

The correct post-MVP question is now:

> How do we make the existing governed vertical slice hosted, scientifically stronger, editable, and submission-ready without diluting its core architecture?

The recommendation is **not** to add more agents or a video-generation stack next.

The next major milestone should be:

> **Cloud Deployment Foundation**

## What is strong today

### Governed application boundary

Tital has a clear trust contract:

```text
model proposes
→ deterministic service validates
→ application assigns trusted IDs / provenance / status
→ human reviews
→ deterministic workflow decides eligibility
```

This is stronger than a generic agent chain where model output directly mutates trusted state.

### Complete evidence-to-production chain

Implemented:

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
→ audit
→ ProductionPackage
```

### Real partner/tool integration

Parallel Search MCP is used as a real runtime tool in source discovery rather than as a documentation-only dependency.

### Human review and rejection recovery

Human approval remains explicit. Rejected records stay in history. Missing approved coverage can be regenerated without silently restoring rejected records.

### Coverage semantics

Progression depends on approved provenance-connected coverage rather than arbitrary record counts.

### Web product loop

The React UI now supports the complete local project journey:

```text
create
→ review
→ continue
→ recover coverage
→ complete
→ inspect package
→ trace provenance
→ export
```

### Final outputs

The product now has distinct machine- and human-facing outputs:

```text
Machine:
JSON ProductionPackage

Human:
readable UI
text report
styled PDF-oriented report
```

## Live validation evidence

### Europa run

The Europa project validated the complete persisted backend workflow with real Gemini/Vertex AI and real Parallel MCP source discovery.

### Black-hole web run

The Black-hole project validated the web application across the full workflow.

Final approved production chain:

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

This run also exposed two high-value reliability problems:

1. Shot proposals were asked to echo `sceneId` and Gemini changed one character.
2. VisualDecision proposals were asked to echo `shotId` and Gemini changed one character.

Both were corrected by moving trusted parent-ID ownership fully into application code.

This is an important architectural lesson:

> Models should not be asked to reproduce trusted application identifiers when the application already knows them.

## Important scientific interpretation of the Black-hole run

The Black-hole project was an **end-to-end product test**, not an expert scientific review.

Some approvals/rejections were intentionally random in order to exercise recovery and stage progression.

Therefore:

```text
workflow COMPLETE
≠
independent scientific validation of every approved record
```

The final report terminology was corrected accordingly. The current deterministic check is a **Governance & provenance audit**.

## Current gap ranking

### 1. Hosted deployment — highest priority

Current product runtime is local:

```text
Web: 127.0.0.1:5173
API: 127.0.0.1:8787
Store: .tital/sessions/*.json
```

This is the largest gap between the current MVP and a judge-testable application.

Target:

```text
public hosted URL
→ hosted React UI
→ hosted Node API
→ durable cloud sessions
→ deployed Vertex AI / Gemini
→ deployed Parallel MCP
→ completed hosted E2E run
```

### 2. Full-source verification before Evidence

Current Evidence extraction uses approved `SourceRecord` excerpts returned by source discovery.

That is enough for the current MVP but is not a complete source-verification pipeline.

Recommended next scientific architecture:

```text
Research Question
→ Parallel web_search
→ discovered SourceRecord
→ human source approval
→ controlled approved-source retrieval / web_fetch
→ retrieved source content + provenance
→ Evidence Extraction
→ human Evidence review
```

This separates:

```text
discovery
from
verification
```

### 3. Edit / regenerate / downstream staleness

The current workflow handles rejection during review, but it does not provide a complete post-approval editing lifecycle.

Needed behavior:

```text
approved upstream record changes
→ dependent records identified
→ dependent records become stale
→ audit/package invalidated
→ only affected work regenerated
→ human review required again
```

### 4. Scientific governance expansion

Two high-value future checks:

```text
UNCERTAINTY_DROPPED
SCIENTIFIC_CONSTRAINT_VIOLATION
```

These must be semantic/proposition-aware rather than naive text or field inheritance rules.

### 5. Production persistence and reviewer identity

Current local JSON persistence is intentionally MVP-level.

Future production work includes:

```text
cloud storage
schema versioning / migrations
concurrency / optimistic locking
transactional state + events
project ownership
reviewer identity
backup / restore
```

## What should not be the next step

Do **not** prioritize the following before the hosted vertical slice is stable:

```text
more decorative agents
large video-generation stack
3D editor
mobile application
billing
enterprise multi-tenancy
custom foundation model
large knowledge graph
```

These can increase scope without improving the core evidence-governed product proof.

## Recommended post-MVP sequence

```text
POST-MVP-0
Documentation Truth Reset
        ↓
POST-MVP-1
Cloud Deployment Foundation
        ↓
POST-MVP-2
Approved-Source Full-Content Verification
        ↓
POST-MVP-3
Edit / Regenerate / Staleness
        ↓
POST-MVP-4
Scientific Governance Expansion
        ↓
POST-MVP-5
Hackathon Demo / Submission Hardening
```

## POST-MVP-1 definition of done

Cloud Deployment Foundation is complete when:

1. A public hosted Tital URL exists.
2. The hosted UI can create/open a project.
3. The hosted API drives the existing governed services rather than bypassing them.
4. Session state is durable across container/process replacement.
5. Vertex AI / Gemini works in the deployed runtime.
6. Parallel MCP source discovery works in the deployed runtime.
7. One complete hosted project reaches `COMPLETE / READY_FOR_PRODUCTION`.
8. Provenance, human review, coverage, final results, and exports remain visible.
9. Runtime configuration/secrets are not committed to the repository.
10. The hosted run is documented for hackathon/demo evidence.

## Guardrails for cloud work

Cloud deployment must not change the core trust model.

Preserve:

```text
Model proposes
Application owns IDs/provenance/status
Human approves
Workflow is deterministic
Audit is narrowly described
```

Prefer an infrastructure adapter around the existing application rather than rewriting the domain/workflow for a cloud provider.

A likely persistence direction is:

```text
MvpSessionStore contract
├── JsonMvpSessionStore          # local development/tests
└── cloud-durable implementation # deployment
```

The exact cloud persistence technology should be selected during POST-MVP-1 design after checking deployment constraints and the smallest reliable implementation.

## Product positioning after MVP

The strongest accurate description now is:

> Tital is a working evidence-governed scientific-film application with a React web UI, real Google ADK/Gemini and Parallel MCP integration, explicit human review, provenance-connected workflow progression, rejection recovery, deterministic governance auditing, final production-package construction, traceability, and human/machine-readable exports. The complete vertical slice is live-validated locally; the next milestone is hosted cloud deployment and stronger full-source verification.
