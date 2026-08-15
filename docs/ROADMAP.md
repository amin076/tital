# Tital Roadmap

This document describes recommended next development work. It is **not** a list of capabilities that already exist. For current implementation status, see [CURRENT_STATUS.md](CURRENT_STATUS.md).

## Priority 1 — runnable governed end-to-end MVP session

The workflow evaluator, Execution Controller, real executor wiring, review services, audit, and package builder already exist. The next product step is to connect them into one developer/demo-facing project session that can:

```text
create/load project state
→ execute one legal stage
→ persist updated state
→ stop at a human gate
→ accept an explicit approve/reject action
→ continue from the stored state
→ run audit
→ build ProductionPackage
```

The key requirement is persistence without bypassing review. A demo mode may explicitly simulate approvals, but it must be labelled as simulation rather than pretending those decisions were human-reviewed.

## Priority 2 — strengthen source-to-evidence verification

Current Parallel integration uses Search MCP for source discovery and preserves source excerpts/provider provenance. A stronger evidence workflow should add a controlled source-content retrieval step for approved sources where appropriate.

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

Before implementing this, verify the current Parallel MCP tool contract and usage limits. Do not store full copyrighted documents unnecessarily.

## Priority 3 — minimal product UI

After the persisted workflow is runnable, add a small web interface focused on Tital's differentiator rather than generic dashboard complexity.

A useful first UI should make these actions visible:

```text
Define
Research
Evidence / Claims
Script
Scenes / Shots
Visual Decisions
Audit
Package
```

The most important interaction is provenance navigation: a user should be able to move from a script line/shot backward to claims, evidence, and sources.

## Priority 4 — persistence model

Introduce a project store only after the state contract is clear. Persistence should retain record IDs, statuses, provenance relationships, source retrieval timestamps/provider IDs, and audit/package state.

Do not build a large database abstraction before the single-project workflow works.

## Priority 5 — dependency invalidation / staleness

The current MVP enforces approval gates but does not yet automatically propagate staleness after an approved upstream record changes.

Future behavior should support relationships such as:

```text
Source/Evidence changed
→ Claim potentially stale
→ ScriptLine potentially stale
→ Scene/Shot/VisualDecision potentially stale
→ Audit required again
```

Start with deterministic dependency invalidation before designing a large knowledge-graph system.

## Priority 6 — expand Scientific Audit

The current deterministic audit should remain the base. Candidate future rules include:

- uncertainty/caveat lost downstream;
- scientific constraint weakened between Shot and VisualDecision;
- stronger cross-record research-question consistency checks;
- contradictory evidence unresolved before a claim is approved;
- representation-specific disclosure requirements;
- provenance coverage metrics.

Do not claim these checks until they are implemented and tested.

## Priority 7 — scientific status and contradiction model

The handoff vision includes richer epistemic status and contradiction handling. The current `ClaimRecord` is intentionally smaller.

A future schema iteration can explore categories such as observation, experiment, strong inference, model-dependent inference, theoretical prediction, consensus, debate, hypothesis, or analogy—but only after the ontology is designed and migration implications are understood.

## Priority 8 — deployment and hackathon demo

Once the vertical slice works as one product session:

1. deploy the runnable application using the chosen Google Cloud path;
2. verify Gemini/Google Cloud use in the deployed runtime;
3. verify real Parallel MCP use in the deployed/demo runtime;
4. log enough runtime evidence for the demo;
5. create the three-minute demonstration around one scientific film project;
6. complete Devpost submission materials.

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
