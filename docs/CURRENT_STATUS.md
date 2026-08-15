# Tital Current Status

This document is a factual snapshot of the governed MVP codebase. It distinguishes implemented code from intentionally limited capability and future work.

## Implemented

| Area | Status | Notes |
|---|---|---|
| TypeScript / Node.js project | Implemented | Main runtime and services are TypeScript. |
| Google ADK | Implemented | Specialized `LlmAgent` stages and ADK runners are in the repository. |
| Gemini / Vertex AI path | Implemented and previously smoke-tested | Live execution depends on valid Google Cloud configuration and ADC. |
| Parallel Search MCP | Implemented and previously smoke-tested | Used by `parallelSourceAgent` for source discovery. |
| FilmBrief | Implemented | Structured generation and validation. |
| ResearchQuestion | Implemented | Generated from eligible FilmBrief input. |
| SourceRecord | Implemented | Parallel-backed discovery, provider provenance, review lifecycle. |
| EvidenceRecord | Implemented | Extracted from approved question/source inputs. |
| ClaimRecord | Implemented | Grounded in approved evidence IDs. |
| ScriptLineRecord | Implemented | Generated from approved claims. |
| SceneRecord | Implemented | Generated from approved script lines. |
| ShotRecord | Implemented | Includes camera direction, visual-integrity category, scientific constraint, uncertainty. |
| VisualDecisionRecord | Implemented | Includes visual category, decision, constraint, disclosure, risk. |
| Human review transitions | Implemented | Generated records cannot silently approve themselves. |
| Workflow evaluator | Implemented | Coverage-aware `evaluateMvpWorkflow.ts`. |
| Execution Controller | Implemented | Function-based `executeNextMvpStep.ts`. |
| Real executor wiring | Implemented | Incremental `createRealMvpStepExecutors.ts`. |
| Rejection recovery | Implemented | Rejected history is retained; missing approved coverage can be regenerated. |
| Provenance-connected coverage | Implemented | Approved but orphaned downstream records do not satisfy progression. |
| Local persisted MVP session | Implemented | JSON sessions survive separate CLI invocations/restarts. |
| Session event history | Implemented | Records creation, automation, human decisions, audit, and packaging events locally. |
| Scientific Audit | Implemented | Deterministic current rule set over the approved provenance chain. |
| Production Package builder | Implemented | Excludes rejected/unconnected history and produces ready/blocked result. |
| Unit tests / typecheck infrastructure | Implemented | Standard suite is designed to avoid live external calls. |
| Architecture/developer docs | Implemented | `README.md` plus `docs/`. |

## Persisted MVP session boundary

The MVP now has a local durable project-session layer:

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

Human gates remain explicit. Rejection is terminal history rather than deletion; if required approved coverage disappears, the controller can generate replacement candidates on a later continuation.

## Implemented but intentionally limited

### Persistence and review history

The local JSON store validates sessions on read/write and uses temporary-write-plus-rename behavior. The event log provides a local history of major workflow actions.

Still missing for production use:

- authenticated reviewer identity;
- cryptographic/signature-level approval evidence;
- concurrent/multi-user editing semantics;
- transactional database guarantees;
- cloud synchronization/backups;
- migrations/versioned persisted-session compatibility.

### Scientific Audit

The deterministic audit currently checks the issue codes defined by the repository, including:

```text
BROKEN_PROVENANCE
UNAPPROVED_UPSTREAM_RECORD
VISUAL_CATEGORY_MISMATCH
MISSING_VISUAL_DISCLOSURE
UNSUPPORTED_CLAIM
```

The workflow now feeds the audit only the approved, provenance-connected chain. This is still not a complete scientific-integrity engine. Additional checks such as deterministic uncertainty-loss detection or semantic scientific-constraint comparison remain future work.

### Source content

Parallel Search MCP discovers sources and returns source excerpts/metadata. The current evidence path can operate on those approved source records, but Tital does not yet have a dedicated full-content retrieval stage for every approved source. A future `web_fetch`-based step can strengthen evidence verification where appropriate.

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

## Current product boundary

The strongest accurate description is:

> Tital is a working TypeScript evidence-governed scientific-film workflow core with real Google ADK/Gemini and Parallel MCP integration, structured provenance from research through visual decisions, explicit human gates, a local persisted project-session runner, rejection-aware recovery, deterministic scientific audit, and production-package construction. It is not yet a production web application or multi-user cloud service.

## Validation note

Normal local validation is:

```bash
npm run typecheck
npm test
```

These checks do not require live Vertex AI or Parallel MCP. Live runtime availability remains environment-dependent and should be verified only with deliberate smoke tests.
