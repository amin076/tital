# Review Workflow

Human review is a hard governance boundary in Tital. AI-generated material is a proposal until deterministic application code validates it and a human makes the required review decision.

## Core rule

```text
model/tool proposes
→ service validates and establishes trusted provenance
→ human reviews
→ deterministic workflow evaluates approved or explicitly waived coverage
→ next stage becomes eligible
```

The model does not own trusted IDs, approval state, provenance links, coverage rules, or workflow progression.

## Statuses are model-specific

There is no universal status enum for every record. Common values include:

```text
DRAFT
DISCOVERED
REVIEW_REQUIRED
APPROVED
REJECTED
LOCKED
```

Always consult the relevant Zod domain schema before adding a transition.

## Rejection is terminal by default

A rejected record remains in persisted history and is excluded from the approved production chain. Tital does **not** interpret rejection as permission to silently call the model again.

This rule was hardened after live workflow failures where rejected Evidence and later a rejected Scene could be regenerated with new random IDs. Automatic generation is now first-attempt-only for Sources, Evidence, Claims, Script Lines, Scenes, Shots, and Visual Decisions.

## Coverage-aware rejection

If the selected rejection is safe because another approved record already covers the required parent, Tital applies the rejection normally.

If rejecting the selected records would remove the final candidate for required coverage, the review is paused and Tital requires an explicit resolution:

1. **Reject & try another (`RETRY`)** — reject the current candidate and request replacement candidates only for the uncovered target.
2. **Reject & continue with gap (`WAIVE`)** — reject the candidate and persist an intentional `CoverageWaiver` for the uncovered branch.
3. **Cancel** — return to review without changing the records.

A waiver is governance history, not hidden success. Coverage views distinguish approved coverage from intentional omission, and waivers are included in the machine-readable production package.

The project cannot waive away every Research Question; at least one approved research branch is required.

## Targeted retry and duplicate protection

`retryMvpCoverage` regenerates only the requested target and filters semantically duplicate candidates using stage-appropriate signatures. This prevents the old pattern:

```text
human rejects candidate
→ same semantic answer generated again
→ new UUID
→ human sees an apparently new candidate
```

Retries are explicit human actions.

## Director instruction on cinematic retries

For Scene, Shot, and Visual Decision replacement, the human can supply a scoped natural-language instruction such as:

```text
Use a quieter camera.
Prefer macro photography instead of a diagram.
Avoid orbiting movement.
Keep this replacement observational and realistic.
```

That instruction is passed only to the targeted cinematic generation together with the project's Director Brief. Scientific evidence, uncertainty, and approved visual-integrity constraints have higher precedence than artistic preferences.

## Director Brief versus review decisions

The project-level `DirectorBrief` describes persistent cinematic preferences. It influences initial Scene, Shot, and Visual Decision proposals.

A scoped retry instruction is narrower and applies to a specific replacement request. It does not rewrite the project-wide Director Brief.

The precedence rule is:

```text
scientific evidence / uncertainty / visual-integrity constraints
> approved production constraints
> scoped director instruction + project Director Brief
> AI cinematic preference
```

## Cinematic decision provenance

New Scene, Shot, and Visual Decision records can carry application-owned `decisionProvenance` indicating that:

- the proposal originated from AI;
- it remained evidence-governed;
- a Director Brief was applied or not;
- a scoped director instruction was applied or not.

Human approval remains represented by the record status; provenance does not imply approval.

## Orchestration boundary

`executeNextMvpStep` returns `AWAITING_HUMAN_REVIEW` when a gate is active. `advanceMvpSession` intentionally stops at that boundary. The only automatic multi-step tail is deterministic audit → package construction.

```text
automation
→ review
→ human decision
→ automation
→ review
→ ...
```

## Locking

Some record schemas include `LOCKED`, but Tital does not yet expose a generalized lock/unlock/version-comparison product experience. Do not document locking as a complete editing system until that lifecycle exists.
