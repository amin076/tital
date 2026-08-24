# Feedback-Driven Live Acceptance — 2026-08-24

Project: **Aurora Grounding Test**

Purpose: verify the product improvements that came directly from user feedback:

1. AI should help the human review large/complex queues without taking approval authority.
2. Broad research should not force every Evidence candidate into the active production workload.
3. A completed production should be reviewable and safely revisable without starting a new project.

This document records observed hosted-product behavior. It is not a claim that Final AI Review proves scientific truth.

## A. Full-source Evidence + Adaptive Evidence Budget

Observed production state:

```text
Research Questions: 5 approved
Sources: 24 total
  21 approved
  3 rejected
Evidence candidates: 123
```

The Human Attention Budget then verified:

```text
123 research candidates
24 active for human review
99 archived and preserved
Auto target: 24
```

AI Review ran on the active subset. Human decisions produced:

```text
21 approved Evidence
3 rejected Evidence
```

The Evidence grounding panel showed:

```text
21/21 active Parallel web_fetch
```

Acceptance result: **PASS**

Key boundary: archived Evidence remained research history; it was not deleted and was not treated as approved production Evidence.

## B. Stage-aware AI Review

### Script

The live Script gate showed 12 pending records before AI review. Gemini evaluated Script-specific risks using approved upstream context plus audience/project settings.

Observed recommendations included HIGH-attention audience mismatch for specialist terminology such as plasma-physics jargon that was inappropriate for the Film Brief's general-public audience.

The Human Gate remained authoritative. Assisted selection only checked boxes; the user still had to explicitly approve/reject.

Acceptance result: **PASS**

### Coverage-gap handling

Rejecting a record that would leave a required branch uncovered opened an explicit dialog:

```text
Reject & try another
Reject & continue with gap
Cancel
```

No silent replacement or hidden omission occurred.

Acceptance result: **PASS**

### Scene / Shot / Visual Decision

Stage-aware AI Review appeared at all three downstream gates with stage-specific candidate types and recommendations.

Observed examples included:

- Scene review checking approved Script synthesis and uncertainty;
- Shot review checking real SOHO/LASCO observational imagery and representation constraints;
- Visual review checking authentic archival imagery, disclosure and avoidance of artificial colorization/motion smoothing.

Acceptance result: **PASS**

## C. First completed package + Final Production Review

The first completed package showed:

```text
Research Questions: 5
Sources: 21
Evidence: 21
Claims: 12
Scientific Script: 10
Scenes: 9
Shots: 23
Visual Decisions: 23
```

Deterministic Governance & Provenance Audit:

```text
0 issues
```

A separate Final Production AI Review reported overall MEDIUM risk and cross-stage findings including:

- Script duplication;
- missing fundamental explanation/coverage;
- narrative-order problem;
- audience-fit issue.

This demonstrated the intended separation:

```text
Structural governance/provenance validity
≠
whole-package semantic/narrative quality
```

Acceptance result: **PASS**

## D. Feedback exposed a missing revision target

Final Review findings were primarily Script/Narrative problems. The Revision Workspace initially supported:

```text
project duration
Source
Claim
Shot
Visual Decision
```

but not Script or Scene. This was a real product gap because the reviewer could identify a problem that the governed revision system could not safely target.

The product was updated to add:

```text
Revise an approved script line
Revise an approved scene
```

Acceptance result after deployment: **PASS**

## E. Deterministic Script revision impact

A completed Script Line was revised because Final AI Review identified high-risk duplicate narration.

Impact Preview reported:

```text
ScriptLineRecord ... affects 6 trusted records across 4 workflow layers.

Script: 1
Scenes: 1
Shots: 2
Visuals: 2
```

Preserved layers:

```text
researchQuestions
sources
evidence
claims
```

Affected layers:

```text
scriptLines
scenes
shots
visualDecisions
```

Acceptance result: **PASS**

This is the strongest live proof that Tital can revise finished downstream production without discarding valid upstream scientific research.

## F. Revision-state bug found and fixed

After the first Apply Revision smoke test, affected records correctly became `STALE`, but the ordinary workflow could still advance to Audit/Package before selective repair had started.

That was incorrect.

A state-machine guard was added so an `APPLIED` revision waiting for repair:

```text
cannot advance to Audit
cannot build a package
cannot report Complete
```

The session is held at the earliest affected stage and direct advance requests are rejected with:

```text
REVISION_REPAIR_REQUIRED
```

The active revision UI then correctly showed:

```text
SCRIPT REVISION
status: APPLIED
Repair affected branch
```

Acceptance result after fix: **PASS**

## G. Selective repair + human review + rebuild

`Repair affected branch` produced replacement Script candidates rather than regenerating the whole project.

The repaired Script candidates returned to:

```text
AI Review Assistant
→ Human Gate
```

The human approved/rejected the replacement candidates.

Activity history then showed:

```text
REVISION COMPLETED
AUDIT EXECUTED
PACKAGE BUILT
```

The rebuilt package returned to:

```text
READY_FOR_PRODUCTION
Governance & provenance audit: 0 issues
```

Latest observed active-package counts after repair:

```text
Research Questions: 5
Sources: 21
Evidence: 21
Claims: 12
Scientific Script: 11
Scenes: 8
Shots: 21
Visual Decisions: 21
```

Historical rejected/stale/archive records remained visible outside the active package.

Acceptance result: **PASS**

## H. Second Final Production Review

A new Final Production Review was run against the rebuilt package.

The activity history recorded:

```text
PRODUCTION REVIEWED
6 findings
medium overall risk
```

Examples included:

- unmapped Script Lines / omitted reconnection-trigger visuals;
- excessive technical jargon for a general audience;
- scientific-fidelity/directional-context concerns.

No further repair was required for this acceptance exercise. The important verified behavior is that the rebuilt package can be reviewed again, findings remain advisory, and trusted state is unchanged until a human opens another governed revision.

Acceptance result: **PASS**

## I. Product conclusions from the acceptance run

The live run supports these product claims:

1. **AI review assistance can reduce/focus human workload without becoming approval authority.**
2. **Research breadth can be preserved while active Evidence workload is bounded.**
3. **A deterministic audit and an advisory semantic reviewer can coexist because they check different properties.**
4. **A completed production can be selectively revised without rebuilding unaffected upstream science.**
5. **Old trusted records remain visible as rejected/stale/archive history rather than being destructively overwritten.**
6. **Revision itself is governed state: Apply does not mean Complete; repair, human review and re-audit are required.**
7. **Final Review can surface additional advisory findings after repair; the human decides whether another revision is worth the cost/time.**

## J. Submission evidence selection

Recommended screenshots/video moments from this run:

1. `123 research candidates / 24 active / 99 archived` Human Attention Budget.
2. Script AI Review with a HIGH audience-mismatch finding and Human Gate still pending.
3. Coverage-gap dialog showing Retry / explicit gap choices.
4. Scene or Shot/Visual stage-aware reviewer with LOW-risk approve suggestions.
5. `READY_FOR_PRODUCTION` + audit `0 issues` beside Final AI Review findings.
6. Revision dropdown showing Script and Scene revision targets.
7. Deterministic impact preview: `1 Script / 1 Scene / 2 Shots / 2 Visuals`, upstream layers preserved.
8. Active revision `APPLIED` with `Repair affected branch`.
9. Repaired Script AI Review/Human Gate.
10. Activity history showing `REVISION COMPLETED`, `AUDIT EXECUTED`, `PACKAGE BUILT`.
11. Rebuilt package `READY_FOR_PRODUCTION` with audit `0 issues`.

Do not include private authentication tokens, billing identifiers, private Cloud Storage paths or unrelated account information in submission media.
