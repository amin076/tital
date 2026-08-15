# Tital MVP End-to-End Validation

Validation date: **2026-08-15**

This document records the first completed live, persisted, human-governed Tital MVP workflow. It is a validation report, not a claim that the product is production-ready.

## Test project

Scientific-film idea:

> A short scientific film explaining the evidence for a subsurface ocean on Europa.

FilmBrief title:

> Unveiling Europa's Hidden Ocean: The Evidence

The test intentionally narrowed the research fan-out by approving one research question and rejecting the other generated questions. The approved question focused on Galileo magnetic-field evidence for a subsurface conductive layer.

## Runtime path exercised

The validation exercised the actual product path rather than a synthetic unit-test-only path:

```text
User / CLI
→ persisted MVP session
→ Google ADK
→ Gemini on Vertex AI
→ Parallel Search MCP during source discovery
→ structured Tital records
→ explicit human review gates
→ deterministic audit
→ ProductionPackage
```

The workflow made real external runtime calls at the automated generation/search stages. Human review, status inspection, tests, and deterministic operations remained local.

## End-to-end stage result

The completed session reached:

```text
stage: COMPLETE
nextAction: Production package is ready.
blockedBy: []
productionPackageStatus: READY_FOR_PRODUCTION
```

Final record counts:

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

## Provenance path demonstrated

The run demonstrated connected progression through:

```text
ResearchQuestion
→ SourceRecord
→ EvidenceRecord
→ ClaimRecord
→ ScriptLineRecord
→ SceneRecord
→ ShotRecord
→ VisualDecisionRecord
```

Rejected records remained in the persisted project history while only approved, connected records were eligible for downstream production coverage.

## Human gates exercised

The test used explicit review decisions at all major generated-record gates:

```text
FilmBrief
ResearchQuestions
Sources
Evidence
Claims
ScriptLines
Scenes
Shots
VisualDecisions
```

Selective review was important. The test did not approve everything simply to force workflow completion.

Examples included:

- approving one research question while rejecting five others to limit unnecessary research fan-out and runtime cost;
- approving authoritative/primary source candidates while rejecting weaker candidates;
- rejecting evidence/claims that overstated certainty;
- rejecting shots that presented an inferred salty ocean too directly without preserving the relevant visual uncertainty.

## Scientific uncertainty behavior observed

The run demonstrated useful uncertainty propagation in several records.

One approved Evidence record based on Galileo magnetic-field measurements explicitly separated the observation from the interpretation: the conductive subsurface layer is inferred from the magnetic signature, while the specific liquid state/composition is not directly observed by those magnetic measurements alone.

That uncertainty propagated into a Claim and then into a ScriptLine and Scene.

However, the run also exposed an important future audit gap: a separate generated Claim combined caveated Evidence while dropping the relevant uncertainty. The human reviewer rejected it.

This is evidence for a future deterministic rule such as:

```text
UNCERTAINTY_DROPPED
```

The rule must be proposition-aware rather than blindly requiring every downstream record that references uncertain Evidence to copy the uncertainty field.

## Visual-integrity behavior observed

The run exercised the distinction between:

```text
SCIENTIFIC_RECONSTRUCTION
CONCEPTUAL_VISUALIZATION
```

A strong example used a conceptual cutaway to show an electrically conductive subsurface layer while explicitly avoiding labeling that layer as liquid/salty in the shot where the interpretation was not directly observed.

Later visual decisions used viewer-facing disclosures such as explaining that magnetic field lines are invisible and that a cutaway/ocean representation is a reconstruction or interpretation rather than direct imagery.

## Visual-disclosure dead-end found and fixed

During the live run, VisualDecision generation initially stopped with:

```text
MEDIUM or HIGH visual-integrity risk requires a viewer-facing disclosure.
```

The governance rule itself was correct: medium/high risk must not silently omit a disclosure.

The failure mode was improved so the workflow no longer dead-ends merely because the model omits the disclosure field. The current behavior preserves the requirement while allowing application code to derive a deterministic fallback disclosure from approved Shot uncertainty when available, or a generic reconstruction warning when necessary.

This avoids a repeated paid model retry for a missing field while keeping the scientific-integrity rule intact.

## Persistence compatibility issue found and fixed

Earlier persisted Evidence records contained legacy semantic-null strings such as:

```json
"uncertainty": "null"
```

New Evidence validation correctly rejects those sentinels. A narrow load-time compatibility normalization was added so known legacy semantic-null values can be read as actual `null` without weakening strict validation for new records.

This is a targeted compatibility fix, not a general versioned migration framework.

## What this test proves

This validation supports the following claims about the current codebase:

1. The persisted session state machine can complete the intended MVP vertical slice.
2. Google ADK + Gemini/Vertex AI are used by real automated stages.
3. Parallel Search MCP is used for real source discovery.
4. Human approval/rejection gates genuinely affect downstream progression.
5. Rejected history is retained rather than silently deleted or auto-restored.
6. Provenance-connected records can progress from scientific research into film-direction decisions.
7. Scientific uncertainty can survive multiple downstream stages.
8. Visual-integrity categories, scientific constraints, risk levels, and viewer disclosures are represented in the governed workflow.
9. The deterministic audit/package tail can finish the project as `READY_FOR_PRODUCTION` when the approved chain satisfies current rules.

## What this test does NOT prove

It does **not** prove that Tital is production-ready.

Not validated by this run:

```text
React/web UI
multi-user use
cloud persistence/database behavior
authenticated reviewer identity
concurrent editing
formal downstream STALE propagation after upstream edits
full source-document retrieval for every source
complete contradiction/scientific-status ontology
complete uncertainty-loss detection
semantic scientific-constraint violation detection
production deployment
hackathon judge-facing deployment reliability
video rendering
```

The current evidence extraction path also relies on approved source records/search excerpts rather than a dedicated full-content fetch/verification step for every approved source.

## Main product-development finding

The governed backend workflow is now far enough along that the main testing bottleneck is **usability**, not absence of the core state machine.

The completed test required repeated CLI commands, large JSON inspection, manual record-ID copying, and external review of each gate. That process is too slow for normal product iteration.

Therefore the next major milestone is a minimal Tital web UI that exposes the existing workflow rather than replacing it.

The first UI should let a reviewer:

```text
open a persisted project
see current stage/blockers
inspect pending records
select records
approve/reject
continue or regenerate
trace provenance
see uncertainty and visual constraints
inspect audit findings
open the Production Package
```

## Cost discipline learned from the run

Live automated stages can consume Vertex AI quota/credits. Normal development validation should continue to separate:

```text
npm run typecheck / npm test
→ local, deterministic

status / show / review / list
→ local, deterministic

mvp start / relevant mvp continue stages
→ deliberate live runtime calls
```

The UI must preserve this distinction and make it obvious when an action will trigger a live model/tool operation.
