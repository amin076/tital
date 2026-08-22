# Product Overview

Tital is an **evidence-governed scientific film direction system**. It turns a scientific film idea into a structured production package while preserving provenance, uncertainty, visual-integrity constraints, explicit human review, and human director control.

> **Evidence → Story, not Story → Evidence.**

Tital is not a generic video generator, generic chatbot, or paper-summary tool. Its differentiator is the governed path between scientific evidence and filmmaking decisions.

## Product goal

A filmmaker or science communicator should be able to ask:

> Why are we saying or showing this?

and trace the answer through scientific provenance **and** distinguish a scientific requirement from an AI recommendation or human creative preference.

Current chain:

```text
FilmProjectInput (+ optional DirectorBrief)
→ FilmBrief
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

`CoverageWaiver` records preserve explicit human decisions to continue with an intentional missing branch.

## What is implemented now

- hosted React / Vite / MUI web application;
- Node HTTP API on the same Cloud Run service;
- Firebase Email/Password authentication and backend token verification;
- Cloud Storage persisted user-scoped sessions;
- Google ADK + Gemini / Vertex AI proposal generation;
- Parallel Search MCP source discovery;
- governed Evidence, Claim, Script, Scene, Shot, and Visual Decision generation;
- explicit human review gates;
- coverage-aware Retry / Waive / Cancel recovery;
- duplicate-resistant targeted replacement instead of silent regeneration;
- project-level Director Brief for cinematic guidance;
- application-owned cinematic decision provenance;
- bounded parallel execution of independent external calls inside a stage;
- lightweight runtime timing traces;
- deterministic governance/provenance audit;
- final ProductionPackage + traceability + JSON/text/PDF-oriented output;
- GitHub Actions validation and Workload Identity Federation deployment path.

The completed hosted dinosaur project reached `READY_FOR_PRODUCTION` through this workflow.

## Human director versus AI

Scientific evidence can constrain what a visual must not imply, but it cannot uniquely determine the director's visual language.

Tital therefore uses this authority model:

```text
science / uncertainty / visual integrity
        ↓ hard constraints
human director guidance
        ↓ creative intent
AI cinematic recommendation
        ↓ proposal
human review
        ↓
approved production decision
```

The Director Brief is deliberately compact: collaboration mode, pacing, camera behavior, representation preference, free-text visual style/notes, and avoid rules. It is not a giant technical slider panel.

See [../DIRECTOR_CONTROL.md](../DIRECTOR_CONTROL.md).

## Human review and coverage

Generated content never silently becomes approved state. Rejected content remains historical state and is not automatically regenerated.

If rejection creates a required gap, the user chooses:

```text
Retry replacement
Waive intentional gap
Cancel
```

This gives the reviewer authority to say both “this answer is not good enough; try again” and “I do not want this branch in the final film.”

## Visual scientific integrity

`ShotRecord` and `VisualDecisionRecord` carry representation category, scientific constraints, uncertainty/disclosure metadata, and risk information.

Categories include:

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

The audit checks implemented provenance/approval/visual-integrity conditions. It is not independent scientific peer review.

## Performance model

The workflow must preserve scientific dependencies, but independent work inside one approved stage does not need to be serialized. Tital now uses bounded concurrency for independent searches/generations and persists lightweight timing traces for future live measurement.

No before/after performance percentage is claimed until a comparable hosted benchmark is run.

See [../PERFORMANCE.md](../PERFORMANCE.md).

## What is not implemented yet

Important current limits include:

- dedicated full-source retrieval/verification before Evidence extraction;
- optimistic locking for concurrent session mutations;
- complete general edit → downstream-staleness lifecycle;
- reusable cross-project Director Profile storage;
- simultaneous side-by-side cinematic alternatives as a standard workflow;
- generalized lock/unlock/version comparison UX;
- final film rendering.

The downstream invalidation foundation and sanitized anonymous-demo promotion are implemented. The remaining edit limitation is the generalized user-facing edit/version-comparison lifecycle.

## Primary user

The current product is best understood as serving a filmmaker, documentary director, or science communicator planning a short scientific documentary/explainer who needs scientific claims and visual choices to remain traceable, reviewable, and creatively controllable.
