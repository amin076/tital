# Product Overview

Tital is an **evidence-governed scientific film direction system**. It helps turn a scientific film idea into a structured production package while preserving provenance, uncertainty, visual-integrity constraints, and explicit human review.

The core principle is:

> Evidence → Story, not Story → Evidence.

Tital is not a generic video generator, generic chatbot, or paper-summary tool. Its differentiator is the governed path between scientific evidence and filmmaking decisions.

## Product goal

A filmmaker or science communicator should be able to ask:

> Why are we saying or showing this?

and trace the answer backward through the scientific chain.

The implemented MVP chain is:

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

## What is implemented now

The current TypeScript/Node.js MVP includes:

- `FilmBrief` generation through Google ADK + Gemini;
- research-question generation;
- live source discovery through Parallel Search MCP;
- structured evidence, claim, script-line, scene, shot, and visual-decision generation;
- Zod validation at domain/model boundaries;
- provenance checks and application-owned IDs/statuses;
- explicit review/approval functions;
- deterministic workflow evaluation and next-step execution control;
- deterministic scientific audit;
- deterministic production-package construction;
- unit tests that use dependency injection/fakes for non-live validation.

## What is not implemented yet

The current repository does not yet provide:

- a production web UI;
- persistent project/database storage;
- authentication or multi-user collaboration;
- durable review history;
- a single persisted end-to-end application session from idea to package;
- final video rendering.

Those are future product/application layers, not current capabilities.

## Human-in-the-loop governance

Tital does not let model output silently become approved scientific content. The intended boundary is:

```text
Model proposes
→ schema validation
→ deterministic provenance checks
→ application-owned record/status
→ human review
→ next stage becomes eligible
```

Status enums are domain-specific. Many generated records use states such as `REVIEW_REQUIRED`, `APPROVED`, and `REJECTED`, while `SourceRecord` begins as `DISCOVERED` after source discovery.

## Visual scientific integrity

Tital treats visuals as scientific claims about what the audience will infer. `ShotRecord` and `VisualDecisionRecord` carry visual-integrity metadata such as representation category, scientific constraints, disclosure, and risk.

The current visual-integrity categories include:

```text
OBSERVATION
EXPERIMENT
SIMULATION
SCIENTIFIC_RECONSTRUCTION
SCHEMATIC
ILLUSTRATION
ANALOGY
ARTIST_IMPRESSION
CONCEPTUAL_VISUALIZATION
```

The deterministic audit currently checks several provenance/approval/visual problems. It does not yet implement every possible future scientific-integrity rule.

## Primary MVP user

The current product is best understood as serving a filmmaker or science communicator developing a short scientific documentary/explainer who needs scientific claims and visual choices to remain traceable and reviewable.

Broader institutional use cases are possible later, but they should not be confused with implemented MVP functionality.
