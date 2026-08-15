# Domain Models

Tital's governed workflow is built from Zod-validated domain records under `src/domain/`. These records are the application-level source of truth for legal structure, provenance references, and status values.

## Implemented provenance chain

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

The names above are the implemented record names. Documentation should avoid shortening them to generic labels such as `Source`, `Evidence`, or `Claim` when discussing code-level behavior.

## Record responsibilities

### `FilmBrief`
Defines the film's scientific and communication intent: title/topic/question, audience, format, duration, tone, learning goals, scope, constraints, and research requirements.

### `ResearchQuestion`
Links a focused research question to a `FilmBrief` through `filmBriefId`, with purpose, priority, and review status.

### `SourceRecord`
Represents a source discovered for a specific research question. The current Parallel-backed implementation records:

- `researchQuestionId`;
- `provider = "PARALLEL"`;
- `providerSearchId` when the provider actually returns one;
- URL/title/date metadata;
- source excerpts returned during discovery;
- retrieval time;
- source review status.

Source discovery initially creates:

```text
status = DISCOVERED
```

A source must be reviewed before it is treated as approved upstream material.

### `EvidenceRecord`
Represents a specific evidence item extracted from an approved source for an approved research question. It preserves:

- `sourceId`;
- `researchQuestionId`;
- excerpt;
- interpretation;
- strength (`HIGH | MEDIUM | LOW`);
- uncertainty;
- review status.

Evidence is created as `REVIEW_REQUIRED`.

### `ClaimRecord`
Represents a scientific claim grounded in one or more approved evidence records. It includes:

- `researchQuestionId`;
- `evidenceIds`;
- claim text;
- confidence (`HIGH | MEDIUM | LOW`);
- uncertainty;
- review status.

The application verifies that referenced evidence IDs exist and belong to the same approved research context.

### `ScriptLineRecord`
Represents scientific narration/dialogue generated from approved claims. It keeps:

- `researchQuestionId`;
- `claimIds`;
- text;
- `uncertaintyDisclosure`;
- review/lock status.

### `SceneRecord`
Represents a directed scene created from approved script lines. It includes:

- `researchQuestionId`;
- `scriptLineIds`;
- title;
- purpose;
- `visualSummary`;
- `uncertaintyDisclosure`;
- review/lock status.

### `ShotRecord`
Represents a shot derived from an approved scene and approved referenced script lines. It adds filmmaking/scientific-integrity metadata including:

- `sceneId`;
- `scriptLineIds`;
- description;
- `cameraDirection`;
- `visualIntegrityCategory`;
- `scientificConstraint`;
- `uncertaintyDisclosure`;
- review/lock status.

Current visual-integrity categories are:

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

### `VisualDecisionRecord`
Represents the visual treatment decision for an approved shot. The implemented record includes:

- `researchQuestionId`;
- `shotId`;
- visual category;
- decision text;
- scientific constraint;
- disclosure;
- risk level (`LOW | MEDIUM | HIGH`);
- review/lock status.

### `ScientificAuditReport`
Contains deterministic audit issues plus the final `passed` boolean. Current audit issue codes are defined in `src/domain/scientificAudit.ts`; the schema/service are authoritative because audit coverage will evolve over time.

### `ProductionPackage`
Aggregates the governed project records and audit result. Package construction is deterministic. A package is only marked ready when the audit passes and the required workflow records are approved/locked according to the implemented builder rules; otherwise it remains blocked.

## Status values are domain-specific

Tital does not use one universal status enum.

Common values include:

```text
DRAFT
REVIEW_REQUIRED
APPROVED
REJECTED
LOCKED
```

`SourceRecord` also uses:

```text
DISCOVERED
```

Always inspect the actual Zod schema for the record you are modifying.

## Model proposals vs final records

Many model-assisted stages use a separate proposal schema. The model proposes content, while application code owns trusted metadata.

```text
LLM proposal
→ JSON parsing
→ proposal Zod validation
→ provenance checks
→ application-generated ID/status
→ final domain-schema validation
→ human review
```

This separation is fundamental to Tital's architecture: model output is not automatically trusted application state.
