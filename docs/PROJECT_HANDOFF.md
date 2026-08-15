# Tital Project Handoff

Status date: **2026-08-15**

This is the current repository-level handoff for Tital. It is intentionally shorter and more operational than the earlier long-form planning handoff. For implementation truth, always reconcile this document with the repository, [CURRENT_STATUS.md](CURRENT_STATUS.md), and recent validation evidence.

## Product definition

**Tital — Evidence-Governed Scientific Film Director**

Tital turns a scientific question or film idea into an evidence-governed production package while preserving provenance, uncertainty, human approval, and visual scientific integrity from research through filmmaking decisions.

Core principle:

> **Evidence → Story, not Story → Evidence.**

North Star:

> A filmmaker should be able to ask, “Why are we saying or showing this?” and receive a traceable scientific answer.

Tital is not intended to be a generic AI video generator, generic research chatbot, or generic storyboard tool.

## Product workflow

The five user-facing product phases remain:

```text
1. DEFINE
2. RESEARCH & VERIFY
3. DEVELOP
4. DIRECT
5. AUDIT & PACKAGE
```

The implemented record chain is more granular:

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
→ ScientificAuditReport
→ ProductionPackage
```

## Governance contract

The central engineering boundary is:

```text
Model proposes
→ service validates
→ application assigns trusted IDs/provenance/status
→ human reviews
→ next stage becomes eligible
```

Models must not silently control workflow status, trusted IDs, or provenance relationships.

Human review states are domain-specific, but common statuses include:

```text
DRAFT
REVIEW_REQUIRED
APPROVED
REJECTED
LOCKED
```

Upstream approval matters. Approved but disconnected/orphaned downstream records do not satisfy provenance coverage.

## Current technical architecture

Current runtime stack:

```text
TypeScript / Node.js
Google ADK
Gemini 2.5 Flash
Vertex AI
Parallel Search MCP
Zod
local JSON persisted MVP sessions
Vitest / TypeScript typecheck
```

Runtime concept:

```text
User / CLI today
→ persisted MVP session
→ execution controller
→ workflow evaluator
→ real service executors
→ Google ADK agents
→ Gemini / Vertex AI
→ Parallel MCP where source discovery is required
→ validated application-owned records
→ human gate
→ deterministic audit
→ ProductionPackage
```

The current interface is CLI-oriented. A production React/web UI is not yet implemented.

## Parallel integration

The current Partner path is real runtime use of Parallel Search MCP for source discovery.

The live integration has used the Search MCP tools to find sources and preserve provider provenance in `SourceRecord` data.

Important limitation:

The evidence pipeline currently operates on approved source records/search excerpts. Tital does not yet perform a dedicated full-content retrieval/verification step for every approved source.

Do not conflate:

```text
source discovery
```

with:

```text
evidence verification
```

## Persisted MVP sessions

Default local storage:

```text
.tital/sessions/<session-id>.json
```

Supported CLI actions:

```text
start
status
continue
review
show
list
```

The persisted state machine is intentionally human-gated and rejection-aware. Rejected records stay in history instead of being deleted.

## First complete live end-to-end validation

On 2026-08-15, the Europa scientific-film test completed the full current MVP path.

Final state:

```text
stage: COMPLETE
productionPackageStatus: READY_FOR_PRODUCTION
blockedBy: []
```

Final counts:

```text
ResearchQuestions  APPROVED 1 / REJECTED 5
Sources            APPROVED 4 / REJECTED 4
Evidence           APPROVED 5 / REJECTED 6
Claims             APPROVED 5 / REJECTED 1
ScriptLines        APPROVED 4
Scenes             APPROVED 2
Shots              APPROVED 5 / REJECTED 2
VisualDecisions    APPROVED 5
```

The run used real Gemini/Vertex AI automated generation and real Parallel MCP source discovery, with explicit human review gates between stages.

Detailed report: [MVP_E2E_VALIDATION.md](MVP_E2E_VALIDATION.md).

## Scientific-governance lessons from the Europa run

### Evidence uncertainty

Evidence generation was hardened so semantic-null strings such as `"null"`, `"None"`, `"N/A"`, or similar placeholders are not accepted as meaningful uncertainty values.

Inference should be described as inference. Proxy/indirect measurements must not be upgraded into direct observation without source support.

### Uncertainty propagation

The run showed both successful uncertainty propagation and a failure case.

Successful path:

```text
Evidence uncertainty
→ Claim uncertainty
→ Script uncertaintyDisclosure
→ Scene uncertaintyDisclosure
```

A separate rejected Claim demonstrated that downstream content can still drop an upstream caveat while remaining superficially plausible.

Future deterministic audit candidate:

```text
UNCERTAINTY_DROPPED
```

This rule must be proposition-aware, not a naive requirement to copy every uncertainty field into every downstream record.

### Visual scientific integrity

Shots and VisualDecisions distinguish representation types such as:

```text
SCIENTIFIC_RECONSTRUCTION
CONCEPTUAL_VISUALIZATION
```

Medium/high visual-integrity risk requires a viewer-facing disclosure.

A live failure exposed that the model could return `disclosure: null` while choosing medium/high risk. The application now preserves the governance requirement and supplies a deterministic fallback disclosure instead of dead-ending solely because that field was omitted.

### Visual constraint governance gap

The system preserves `scientificConstraint` fields, but deterministic semantic detection of constraint weakening/violation is not yet implemented.

Future audit candidate:

```text
SCIENTIFIC_CONSTRAINT_VIOLATION
```

## Current deterministic audit

The implemented audit currently includes repository-defined issue types such as:

```text
BROKEN_PROVENANCE
UNAPPROVED_UPSTREAM_RECORD
VISUAL_CATEGORY_MISMATCH
MISSING_VISUAL_DISCLOSURE
UNSUPPORTED_CLAIM
```

Do not claim that Tital already detects every scientific caveat loss, contradiction, or visual semantic error.

## Known persistence boundary

The local JSON store is an MVP persistence layer, not a production database.

Implemented:

```text
schema validation on load/save
local durable session files
event history
temporary-write + rename behavior
narrow compatibility normalization for one legacy Evidence uncertainty format
```

Not implemented:

```text
authenticated reviewer identity
multi-user collaboration
transactional cloud database
formal versioned migration framework
concurrent editing semantics
cloud backup/synchronization
```

## Immediate next milestone: Tital web UI

The backend vertical slice is now complete enough that the main testing bottleneck is CLI usability.

The next mission is to build a minimal React/TypeScript UI around the existing persisted workflow.

The UI must not bypass or duplicate governance rules.

Minimum UI capabilities:

```text
list/open persisted projects
show current stage, next action, blockers
show pending records at the current human gate
select records
Approve / Reject
Continue / Regenerate
show when an action triggers a live paid/runtime call
trace provenance backward:
  VisualDecision → Shot → Scene → ScriptLine → Claim → Evidence → Source
show uncertainty and scientific constraints
show audit findings
show final ProductionPackage status/content
```

The goal is to reproduce the Europa workflow without copying JSON or manually typing record IDs.

## UI architecture guidance

Prefer a thin interface over existing application services.

Do not move business rules into React components.

A sensible boundary is:

```text
React UI
→ local/API adapter
→ existing persisted-session/application services
→ execution controller
→ existing agents/integrations
```

Before choosing the exact server/API shape, inspect the current repository and define the smallest interface needed by the UI.

## After the first UI

Next likely priorities:

1. controlled full-source retrieval before Evidence extraction;
2. deterministic uncertainty-loss and visual-constraint audit rules;
3. downstream staleness propagation after approved upstream edits;
4. persistence/cloud hardening only as required by deployment;
5. Google Cloud deployment;
6. judge-facing three-minute demo and submission packaging.

## Cost discipline

Do not use live Vertex calls for ordinary coding/debugging/tests when deterministic local validation is enough.

```text
npm run typecheck
npm test
```

should remain the normal development validation path.

Commands such as `status`, `show`, `review`, and `list` are local/deterministic.

Live `start`/relevant `continue` stages should be deliberate because they can consume Vertex AI quota/credits.

## Current known environment

Google Cloud project:

```text
scientific-film-director-agent
```

Typical runtime environment:

```text
GOOGLE_CLOUD_PROJECT=scientific-film-director-agent
GOOGLE_CLOUD_LOCATION=global
GOOGLE_GENAI_USE_VERTEXAI=true
```

Authentication uses Google Application Default Credentials.

A stale `GOOGLE_APPLICATION_CREDENTIALS` path previously caused Vertex failures; do not reintroduce a dead file path that overrides ADC.

## Development constraints

- Keep Tital standalone from pre-hackathon projects.
- Do not add unrelated AI runtime providers.
- Preserve real Google/Gemini/Google Cloud runtime use.
- Preserve real Parallel runtime use for the selected Partner path.
- Do not fabricate sources, provider IDs, test results, audit findings, or implementation status.
- Keep the implementation small enough that judges can understand the architecture quickly.
- Do not build video rendering, 3D editing, billing, large multi-tenant systems, or decorative agent complexity before the core UI/deployment/demo path is complete.

## Source-of-truth documents

Use these documents together:

- [README.md](../README.md) — project entry point and developer usage.
- [CURRENT_STATUS.md](CURRENT_STATUS.md) — factual implementation status.
- [MVP_E2E_VALIDATION.md](MVP_E2E_VALIDATION.md) — live Europa validation evidence.
- [ROADMAP.md](ROADMAP.md) — next work, not current implementation.
- architecture/domain/execution documents under `docs/` — detailed subsystem design.

When documents conflict with code, inspect the repository and update the documentation rather than assuming the older prose is correct.
