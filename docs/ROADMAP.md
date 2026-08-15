# Tital Roadmap

This document describes recommended next development work. It is **not** a list of capabilities that already exist. For current implementation status, see [CURRENT_STATUS.md](CURRENT_STATUS.md).

## Completed MVP foundation — persisted governed project session

The earlier highest-priority orchestration goal is now implemented in the codebase:

```text
create project session
→ persist state locally
→ execute the next legal automated stage
→ persist generated records
→ stop at a human gate
→ accept explicit approve/reject
→ recover missing coverage after rejection
→ continue from stored state
→ run deterministic audit
→ build ProductionPackage
```

The implementation deliberately does not auto-approve model output. Local persistence is an MVP JSON store, not the final production database architecture.

## Priority 1 — strengthen source-to-evidence verification

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

## Priority 2 — minimal product UI

Add a small React/TypeScript interface around the persisted workflow rather than creating a generic dashboard.

The first UI should expose:

```text
Project / current gate
Define
Research
Evidence / Claims
Script
Scenes / Shots
Visual Decisions
Audit
Package
```

The most important interaction is provenance navigation: a user should be able to move from a script line/shot backward to claims, evidence, and sources. Review actions must remain explicit and visible.

## Priority 3 — persistence hardening

The local JSON session store is sufficient for the MVP/developer workflow. Before multi-user or deployed production use, define a stronger persistence contract for:

- schema/session versioning and migrations;
- project ownership and reviewer identity;
- concurrency/optimistic locking;
- transactional state + event updates;
- cloud/database storage;
- backup/export/import behavior.

Do not replace the simple store with a large abstraction until the web UI and single-project workflow requirements are clear.

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

## Priority 5 — expand Scientific Audit

The current deterministic audit should remain the base. Candidate future rules include:

- uncertainty/caveat lost downstream;
- scientific constraint weakened between Shot and VisualDecision;
- stronger cross-record research-question consistency checks;
- contradictory evidence unresolved before a claim is approved;
- representation-specific disclosure requirements;
- provenance coverage metrics.

Do not claim these checks until they are implemented and tested.

## Priority 6 — scientific status and contradiction model

The product vision includes richer epistemic status and contradiction handling. The current `ClaimRecord` is intentionally smaller.

A future schema iteration can explore categories such as observation, experiment, strong inference, model-dependent inference, theoretical prediction, consensus, debate, hypothesis, or analogy—but only after the ontology is designed and migration implications are understood.

## Priority 7 — deployment and hackathon demo

Once the persisted vertical slice is locally green:

1. wrap the workflow with the minimal UI or a polished demo-facing CLI path;
2. deploy the runnable application using the chosen Google Cloud path;
3. verify Gemini/Google Cloud use in the deployed runtime;
4. verify real Parallel MCP use in the deployed/demo runtime;
5. capture enough runtime evidence for judging/submission;
6. create the three-minute demonstration around one scientific film project;
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
