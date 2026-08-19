# Incident: Visual Decision category drift

Date: 2026-08-19

## Observed hosted failure

During the hosted Lorestan end-to-end run, Tital reached the Visual Decisions stage after 34 ShotRecords had been approved. A live Visual Decision proposal failed with:

```text
Visual integrity category mismatch: approved shot is "OBSERVATION", proposal is "SCIENTIFIC_RECONSTRUCTION".
```

The deterministic service correctly rejected the mismatch, so no inconsistent VisualDecisionRecord entered trusted workflow state.

## Root cause

The approved ShotRecord already contained the human-reviewed `visualIntegrityCategory`, but the Visual Decision Agent was also asked to return a category. This made the model re-echo an already-trusted classification. As with earlier trusted-ID echo defects, a model disagreement could dead-end the workflow even though the application already knew the authoritative value.

The same reasoning applies to the approved ShotRecord `scientificConstraint`: it is upstream policy and does not need to be rewritten by the Visual Decision Agent.

## Corrected trust boundary

The Visual Decision Agent now proposes only:

```text
decision
disclosure
riskLevel
```

The application deterministically inherits:

```text
shotId              <- approved ShotRecord.id
researchQuestionId  <- approved ShotRecord.researchQuestionId
category            <- approved ShotRecord.visualIntegrityCategory
scientificConstraint <- approved ShotRecord.scientificConstraint
status              <- REVIEW_REQUIRED
```

This extends Tital's trust rule:

> Models propose semantic content. The application owns identity, provenance, workflow status, and already-approved policy/classification fields.

## Disclosure behavior

Disclosure fallback now labels the visual using the trusted ShotRecord category rather than a model-returned category. MEDIUM/HIGH risk remains subject to viewer-facing disclosure requirements.

## Regression coverage

Tests cover:

- proposal parsing without category/constraint echo fields;
- application-owned `shotId`;
- application-owned visual category;
- application-owned scientific constraint;
- OBSERVATION inheritance even when proposal wording could otherwise tempt reclassification;
- medium/high disclosure fallback from shot uncertainty/category;
- generic fallback disclosure;
- low-risk nullable disclosure.

## Operational recovery

The persisted Lorestan session does not need to be restarted. After this fix is validated, merged, and deployed, the same session can continue from `VISUAL_DECISIONS` because the failed proposal was not persisted as trusted state.
