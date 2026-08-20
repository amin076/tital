# Domain Models

Tital's governed workflow is built from Zod-validated domain records under `src/domain/`. These records are the application-level source of truth for legal structure, provenance references, and status values.

## Implemented provenance chain

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
→ ScientificAuditReport
→ ProductionPackage
```

`CoverageWaiver` records can resolve an intentional human-approved coverage omission without pretending that approved downstream content exists.

## `FilmProjectInput` and `DirectorBrief`

`FilmProjectInput` preserves the user's project setup rather than treating it as disposable prompt text. It includes the raw scientific idea and optional title/duration/audience/format/tone controls.

It can now include a project-scoped `DirectorBrief`:

```text
collaborationMode
pacing
cameraMovement
representationPreference
visualStyle?
notes?
avoid[]
```

The Director Brief is creative guidance. It does not override scientific provenance, uncertainty, or visual-integrity constraints.

## Core record responsibilities

### `FilmBrief`
Defines scientific and communication intent: title/topic/question, audience, format, duration, tone, learning goals, scope, constraints, and research requirements.

### `ResearchQuestion`
Links a focused research question to a `FilmBrief` through `filmBriefId`, with purpose, priority, and review status.

### `SourceRecord`
Represents a source discovered for a Research Question. Parallel-backed records preserve provider metadata, URL/title/date, excerpts, retrieval time, and review status. New source candidates begin as `DISCOVERED`.

### `EvidenceRecord`
Represents an evidence item extracted from an approved Source for an approved Research Question, preserving source/question provenance, excerpt, interpretation, strength, uncertainty, and review status.

Source approval does not force Evidence approval. Required Evidence coverage is evaluated at the Research Question level through approved Source provenance.

### `ClaimRecord`
Represents a scientific claim grounded in approved Evidence through `evidenceIds`, with confidence, uncertainty, and review status.

### `ScriptLineRecord`
Represents scientific narration/dialogue generated from approved Claims. It preserves `claimIds`, text, uncertainty disclosure, and review/lock status.

### `SceneRecord`
Represents a directed scene created from approved Script Lines. It preserves question/script provenance, title, purpose, visual summary, uncertainty disclosure, and review/lock status.

New Scene records can also contain optional application-owned `decisionProvenance`.

### `ShotRecord`
Represents a shot derived from an approved Scene and approved scene-local Script Lines. It includes description, camera direction, visual-integrity category, scientific constraint, uncertainty disclosure, and review/lock status.

Current visual-integrity categories:

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

New Shot records can contain optional application-owned `decisionProvenance`.

### `VisualDecisionRecord`
Represents the governed visual treatment for an approved Shot, including category, decision text, scientific constraint, viewer disclosure, risk level, and review/lock status.

New Visual Decision records can contain optional application-owned `decisionProvenance`.

## `CinematicDecisionProvenance`

This compact object records the origin/context of an AI cinematic recommendation without treating the AI as the final decision maker:

```text
recommendationSource = AI
evidenceGoverned = true
directorBriefApplied: boolean
directorInstruction: string | null
```

Human approval remains represented by the parent record status. Provenance says how a proposal was formed; status says what the human decided.

Fields are optional on records for backward compatibility with persisted sessions created before this capability.

## `CoverageWaiver`

When rejecting the last candidate for a required branch would leave a coverage gap, the human can explicitly choose to continue without that branch.

A `CoverageWaiver` preserves:

```text
id
stage
targetType
targetId
reason
rejectedRecordIds
createdAt
```

Waivers remain visible governance history and are included in the machine-readable `ProductionPackage`.

## `MvpSessionEvent` performance trace

Session events can now optionally contain a lightweight `performance` object:

```text
durationMs
externalCallCount
operations[]
  name
  targetId
  durationMs
  success
```

This is operational telemetry, not scientific provenance. Older events remain valid because the field is optional.

## `ScientificAuditReport`

Contains deterministic audit issues plus `passed`. The audit verifies governance/provenance integrity according to implemented rules; it does not independently establish scientific truth or source authority.

## `ProductionPackage`

Aggregates the governed approved chain, optional `coverageWaivers`, and audit result. Package construction is deterministic. A package is `READY_FOR_PRODUCTION` only when workflow readiness and audit requirements pass.

## Status values are domain-specific

Tital does not use one universal status enum. Common values include:

```text
DRAFT
DISCOVERED
REVIEW_REQUIRED
APPROVED
REJECTED
LOCKED
```

Always inspect the actual Zod schema for the record being modified.

## Model proposals versus final records

Many model-assisted stages use a separate proposal schema:

```text
LLM proposal
→ JSON parsing
→ proposal Zod validation
→ numbered-reference/provenance checks
→ application-generated trusted fields
→ final domain-schema validation
→ human review
```

The model does not write trusted IDs, statuses, coverage waivers, or cinematic decision-provenance metadata.
