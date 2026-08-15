# Tital Current Status

Status date: **2026-08-15**

This document is a factual snapshot of the governed MVP codebase. It distinguishes implemented code, live-validated behavior, intentionally limited capability, and future work.

## Implemented

| Area | Status | Notes |
|---|---|---|
| TypeScript / Node.js project | Implemented | Main runtime and services are TypeScript. |
| Google ADK | Implemented | Specialized `LlmAgent` stages and ADK runners are in the repository. |
| Gemini / Vertex AI path | Implemented and live-validated | Live generation was used during the completed Europa MVP session. |
| Parallel Search MCP | Implemented and live-validated | Used by `parallelSourceAgent` for real source discovery during the completed Europa MVP session. |
| FilmBrief | Implemented | Structured generation and validation. |
| ResearchQuestion | Implemented | Generated from eligible FilmBrief input. |
| SourceRecord | Implemented | Parallel-backed discovery, provider provenance, review lifecycle. |
| EvidenceRecord | Implemented | Extracted from approved question/source inputs. |
| ClaimRecord | Implemented | Grounded in approved evidence IDs. |
| ScriptLineRecord | Implemented | Generated from approved claims. |
| SceneRecord | Implemented | Generated from approved script lines. |
| ShotRecord | Implemented | Includes camera direction, visual-integrity category, scientific constraint, uncertainty. |
| VisualDecisionRecord | Implemented | Includes visual category, decision, constraint, disclosure, risk. |
| Human review transitions | Implemented and live-validated | Generated records cannot silently approve themselves; selective approve/reject was exercised in the Europa session. |
| Workflow evaluator | Implemented | Coverage-aware `evaluateMvpWorkflow.ts`. |
| Execution Controller | Implemented | Function-based `executeNextMvpStep.ts`. |
| Real executor wiring | Implemented | Incremental `createRealMvpStepExecutors.ts`. |
| Rejection recovery | Implemented and live-validated | Rejected history is retained; approved coverage can still progress the workflow. |
| Provenance-connected coverage | Implemented | Approved but orphaned downstream records do not satisfy progression. |
| Local persisted MVP session | Implemented and live-validated | JSON sessions survive separate CLI invocations/restarts. |
| Session event history | Implemented | Records creation, automation, human decisions, audit, and packaging events locally. |
| Scientific Audit | Implemented | Deterministic current rule set over the approved provenance chain. |
| Production Package builder | Implemented and live-validated | Completed Europa session reached `READY_FOR_PRODUCTION`. |
| Unit tests / typecheck infrastructure | Implemented | Standard suite is designed to avoid live external calls. |
| Architecture/developer docs | Implemented | `README.md` plus `docs/`. |

## First complete live MVP validation

On **2026-08-15**, Tital completed its first persisted, human-governed, end-to-end scientific-film workflow using the Europa subsurface-ocean evidence question as the demonstration project.

The validated path was:

```text
Film idea
→ FilmBrief
→ ResearchQuestion
→ real Parallel MCP source discovery
→ Source review
→ Evidence extraction and review
→ Claim generation and review
→ ScriptLine generation and review
→ Scene generation and review
→ Shot generation and review
→ VisualDecision generation and review
→ deterministic Scientific Audit
→ ProductionPackage
→ COMPLETE
```

Final workflow state:

```text
stage: COMPLETE
productionPackageStatus: READY_FOR_PRODUCTION
blockedBy: []
```

Final approved/rejected counts from that session:

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

This was a **manual CLI-driven live validation**, not a production deployment or UI test. It proves the current governed vertical slice can complete from film idea to production package while making real Google/Gemini and Parallel runtime calls at the relevant automated stages.

See [MVP End-to-End Validation](MVP_E2E_VALIDATION.md) for the detailed record of what this test proved and what it did not prove.

## Persisted MVP session boundary

The MVP has a local durable project-session layer:

```text
film idea
→ FilmBrief
→ persist
→ explicit human review
→ continue
→ next automated proposal stage
→ persist
→ explicit human review
→ ...
→ deterministic audit
→ ProductionPackage
```

Default storage:

```text
.tital/sessions/<session-id>.json
```

This is intentionally **not** described as a production database. It is a simple, schema-validated local store for the hackathon/developer vertical slice.

The session CLI supports:

```text
start
status
continue
review
show
list
```

Human gates remain explicit. Rejection is retained as history rather than deleted. Where approved coverage still satisfies the workflow, progression can continue without silently restoring rejected records.

## Governance fixes validated during the Europa run

The live session exposed and helped harden several important scientific-governance behaviors:

- Legacy persisted Evidence values using semantic-null strings such as `"null"` are normalized on load without weakening strict validation for newly generated Evidence.
- Evidence prompting and schemas reject semantic-null uncertainty sentinels and distinguish observation from inference more explicitly.
- Medium/high visual-integrity risk still requires a viewer-facing disclosure.
- If the model omits that disclosure, application code now provides a deterministic fallback instead of dead-ending the workflow or requiring a paid retry solely for the missing field.
- The application, not the model, remains responsible for trusted IDs, status, provenance wiring, and workflow transitions.

## Implemented but intentionally limited

### Persistence and review history

The local JSON store validates sessions on read/write and uses temporary-write-plus-rename behavior. The event log provides a local history of major workflow actions.

There is limited compatibility normalization for a known legacy Evidence uncertainty format, but there is **not** yet a general versioned migration framework.

Still missing for production use:

- authenticated reviewer identity;
- cryptographic/signature-level approval evidence;
- concurrent/multi-user editing semantics;
- transactional database guarantees;
- cloud synchronization/backups;
- formal schema/session versioning and migration infrastructure.

### Scientific Audit

The deterministic audit currently checks the issue codes defined by the repository, including:

```text
BROKEN_PROVENANCE
UNAPPROVED_UPSTREAM_RECORD
VISUAL_CATEGORY_MISMATCH
MISSING_VISUAL_DISCLOSURE
UNSUPPORTED_CLAIM
```

The workflow feeds the audit only the approved, provenance-connected chain. This is still not a complete scientific-integrity engine.

Important future rules include:

```text
UNCERTAINTY_DROPPED
SCIENTIFIC_CONSTRAINT_VIOLATION
```

The Europa run showed why these matter. One rejected Claim combined caveated Evidence while dropping the relevant uncertainty, demonstrating that uncertainty propagation cannot be treated as a simple field-copy rule; the rule must consider what proposition the downstream record is making.

### Source content

Parallel Search MCP discovers sources and returns source excerpts/metadata. The current evidence path can operate on those approved source records, but Tital does not yet have a dedicated full-content retrieval stage for every approved source. A future controlled `web_fetch`/content-retrieval step can strengthen evidence verification where appropriate.

## Not implemented yet

```text
production React/web UI
production database/cloud project store
authentication
multi-user collaboration/reviewer identities
automatic downstream staleness propagation after upstream edits
full source-document acquisition pipeline
complete contradiction/scientific-status ontology
expanded scientific-integrity rule set
production deployment
final hackathon demo/submission packaging
final video generation/rendering
```

## Immediate next milestone

The next major product milestone is the **minimal Tital web UI** around the already-working persisted workflow.

The goal is not a decorative dashboard. The UI must replace the slow CLI review loop with a usable governed workflow that exposes:

```text
current project stage
generated records
provenance links
scientific uncertainty
visual-integrity constraints
Approve / Reject actions
Continue / Regenerate actions
Audit findings
Production Package
```

The completed Europa run demonstrated that continuing serious product testing through copy/pasted CLI JSON is now the main usability bottleneck.

## Current product boundary

The strongest accurate description is:

> Tital is a working TypeScript evidence-governed scientific-film workflow core with real Google ADK/Gemini and Parallel MCP integration, structured provenance from research through visual decisions, explicit human gates, a local persisted project-session runner, rejection-aware recovery, deterministic scientific audit, and production-package construction. Its first live end-to-end Europa session reached `COMPLETE` and `READY_FOR_PRODUCTION`. It is not yet a production web application or multi-user cloud service.

## Validation note

Normal local validation is:

```bash
npm run typecheck
npm test
```

These checks do not require live Vertex AI or Parallel MCP. Live runtime calls should remain deliberate because they can consume quota/credits.
