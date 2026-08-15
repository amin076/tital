# Tital Current Status

This document is a factual snapshot of the current repository after the Phase 4C governed-MVP merge. It distinguishes implemented code from partial capability and future work.

## Implemented

| Area | Status | Notes |
|---|---|---|
| TypeScript / Node.js project | Implemented | Main runtime and services are TypeScript. |
| Google ADK | Implemented | Specialized `LlmAgent` stages and ADK runners are in the repository. |
| Gemini / Vertex AI path | Implemented and previously smoke-tested | Live execution still depends on valid Google Cloud configuration and ADC. |
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
| Human review transitions | Implemented | Review services prevent silent approval of generated records. |
| Workflow evaluator | Implemented | `evaluateMvpWorkflow.ts`. |
| Execution Controller | Implemented | Function-based `executeNextMvpStep.ts`. |
| Real executor wiring | Implemented | `createRealMvpStepExecutors.ts`. |
| Scientific Audit | Implemented | Deterministic current rule set. |
| Production Package builder | Implemented | Deterministic ready/blocked decision. |
| Unit tests / typecheck | Implemented | Standard suite avoids live external calls. |
| Architecture/developer docs | Implemented | `README.md` plus `docs/`. |

## Implemented but intentionally limited

### Scientific Audit

The deterministic audit currently checks the issue codes defined by the repository, including:

```text
BROKEN_PROVENANCE
UNAPPROVED_UPSTREAM_RECORD
VISUAL_CATEGORY_MISMATCH
MISSING_VISUAL_DISCLOSURE
UNSUPPORTED_CLAIM
```

This is not yet a complete scientific-integrity engine. Additional checks such as deterministic uncertainty-loss detection or semantic scientific-constraint comparison remain future work.

### Source content

Parallel Search MCP discovers sources and returns source excerpts/metadata. The current evidence path can operate on those approved source records, but Tital does not yet have a dedicated full-content retrieval stage for every approved source. A future `web_fetch`-based step could strengthen evidence verification where appropriate.

### Workflow orchestration

Tital can evaluate state and execute one legal next stage while respecting human gates. It does not yet provide one durable, persisted user session that automatically stores the whole project between commands/restarts.

## Not implemented yet

```text
production React/web UI
persistent project database/store
authentication
multi-user collaboration/reviewer identities
durable approval history
automatic downstream staleness propagation after upstream edits
full source-document acquisition pipeline
complete contradiction/scientific-status ontology
production deployment
final end-to-end persisted demo runner
final video generation/rendering
hackathon demo/submission packaging
```

## Current product boundary

The strongest accurate description today is:

> Tital is a working TypeScript governed scientific-film workflow core with real Google ADK/Gemini and Parallel MCP integration, structured provenance from research through visual decisions, explicit human gates, deterministic audit, and production-package construction. It is not yet a production web application.

## Validation note

The Phase 4C slices were locally validated before merge with TypeScript type checking and the Vitest suite. Live Vertex/Parallel availability is environment-dependent and should be verified only with deliberate smoke tests.
