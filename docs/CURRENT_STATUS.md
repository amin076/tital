# Tital Current Status

Status date: **2026-08-24**

Tital is now in **hackathon feature freeze**. The hosted product has completed a feedback-driven production acceptance run covering full-source grounding, Adaptive Evidence Budget, stage-aware AI-assisted human review, Final Production Review, governed revision, selective repair, re-audit, and rebuilt production packaging.

Core principle:

> **Evidence → Story, not Story → Evidence.**

Product operating model:

> **AI does the volume. Human owns the judgment. Tital owns governed state, provenance, revision impact and production history.**

## Runtime stack

| Area | Current state |
|---|---|
| LLM | `gemini-3.5-flash` |
| Agent framework | Google ADK TypeScript |
| Model access | Vertex AI |
| Hosting | Google Cloud Run |
| Persistence | Google Cloud Storage |
| Authentication | Firebase Authentication + Firebase Admin verification |
| Source discovery | Parallel Search MCP `web_search` |
| Full-source Evidence | Parallel MCP `web_fetch` on exact approved URL |
| Front end | React 19 + Vite + Material UI |
| Validation | Zod + deterministic application-owned provenance mapping |
| CI/CD | GitHub Actions + Workload Identity Federation |

## Implemented governed chain

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
→ Governance / provenance audit
→ ProductionPackage
```

Models never own trusted IDs, provenance links or approval status.

## Feedback-driven features now live

### 1. Stage-aware AI-assisted human review

The independent Gemini Review Evaluator can be invoked at every active human gate:

```text
FilmBrief
ResearchQuestion
Source
Evidence
Claim
Script
Scene
Shot
Visual Decision
```

The evaluator receives relevant approved upstream context and a stage-specific rubric. Recommendations include attention level, confidence, reasons, risks and flags, but remain advisory until a human explicitly approves/rejects.

### 2. Full-source Evidence grounding

After human Source approval, Evidence extraction must call Parallel `web_fetch` on the exact approved URL. Discovery snippets are not treated as the Evidence basis.

### 3. Adaptive Evidence Budget

The live five-minute Aurora acceptance run verified:

```text
21 approved Sources
→ 123 full-source Evidence candidates
→ 24 active for review
→ 99 archived and preserved
→ 21 approved / 3 rejected by the human
```

The same run verified `21/21` active Evidence Source branches using Parallel `web_fetch`.

### 4. Final Production AI Review

A completed package can receive a separate Gemini review across the whole production. This reviewer has already demonstrated that it can find cross-stage narrative/coverage problems even when the deterministic governance/provenance audit reports `0 issues`.

### 5. Governed revision and selective repair

Current revision targets:

- project duration;
- approved Source;
- approved Claim;
- approved Script Line;
- approved Scene;
- approved Shot;
- approved Visual Decision.

The live Script revision test previewed exactly:

```text
Affected:
Script 1
Scene 1
Shots 2
Visuals 2

Preserved:
Research Questions
Sources
Evidence
Claims
```

After Apply, old records remained `STALE` history. The revision then required targeted repair, optional AI review of repaired candidates, explicit human decisions, re-audit and package rebuild.

A production-state bug discovered during this smoke test was also fixed: an `APPLIED` revision waiting for repair can no longer jump directly to Audit/Package/Complete. The session is held at the earliest affected stage until repair begins; direct advance requests are blocked with `REVISION_REPAIR_REQUIRED`.

### 6. Versioned production history

Completed packages remain immutable milestones. Governed revisions supersede prior packages while preserving revision activity, stale records and package history.

## Live acceptance evidence — 2026-08-24

The `Aurora Grounding Test` verified the feedback-driven workflow in the hosted product:

1. Research and Source review completed.
2. 123 full-source Evidence candidates were compacted to 24 active + 99 archived.
3. Gemini Evidence review assisted the human; final active decisions were 21 approved / 3 rejected.
4. Claims and Script were generated from the approved chain.
5. Stage-aware Script review identified audience/jargon risk while leaving status human-controlled.
6. Coverage-gap handling forced explicit Retry/Waive rather than silent omission/regeneration.
7. Stage-aware Scene, Shot and Visual review ran successfully.
8. Governance/provenance audit passed with `0 issues`.
9. Final Production AI Review found cross-stage semantic/narrative findings.
10. Final-review feedback exposed a missing Script/Scene revision capability; both revision targets were added.
11. Script impact preview correctly preserved upstream science and targeted `1 Script → 1 Scene → 2 Shots → 2 Visuals`.
12. Applying the revision exposed a package-completion guard bug; that guard was fixed and regression-tested.
13. Active revision repair generated replacement Script candidates and returned them to human review.
14. Human-reviewed repair was re-audited and rebuilt into a `READY_FOR_PRODUCTION` package.
15. Activity history recorded `REVISION COMPLETED`, `AUDIT EXECUTED`, and `PACKAGE BUILT`.
16. A second Final Production Review ran against the rebuilt package and produced new advisory findings without mutating trusted state.

See `docs/submission/feedback-driven-e2e/README.md`.

## Current product counts from the repaired package

The latest observed repaired package showed:

```text
Research Questions  5
Sources             21
Evidence            21
Claims              12
Scientific Script   11
Scenes               8
Shots               21
Visual Decisions    21
Audit issues         0
```

Historical rejected/stale/archive counts remain visible outside the active package and are intentionally preserved.

## Human collaboration model

The human can:

```text
Approve
Reject
Reject & try another + scoped instruction
Ask Gemini to review the current gate
Use AI-suggested checkbox selection without auto-committing it
Remember selected feedback explicitly
Retry / Waive / Cancel coverage gaps
Review whole-package AI findings
Preview/apply a governed revision
Repair only the affected branch
```

Scientific precedence:

```text
science / provenance / uncertainty / visual-integrity constraints
> approved production constraints
> director guidance
> AI cinematic preference
```

## Performance/resilience status

```text
TITAL_EXTERNAL_CONCURRENCY=3
TITAL_EVIDENCE_CONCURRENCY=1
```

Live testing has already exposed and hardened three distinct production concerns:

1. transient Vertex/ADK 429 during Evidence extraction → conservative Evidence concurrency + bounded retry/backoff;
2. Cloud Run request starvation during a long model call → HTTP serving capacity separated from model concurrency;
3. large Evidence volume → Adaptive Evidence Budget rather than simply increasing concurrency.

Stage-aware AI review remains user-triggered so the extra semantic pass does not automatically double every stage's model cost.

## Governance boundary

The deterministic audit checks structural trust conditions: approved-chain links, stale/unapproved upstream records, visual category/disclosure consistency and package readiness. It **does not** establish scientific truth or peer-review quality.

Likewise, `web_fetch` provides approved-source grounding, not independent scientific certification.

## Current major limits

- no optimistic locking for concurrent mutation of a single session;
- no dedicated UI yet to browse/promote `ARCHIVED_CANDIDATE` Evidence;
- Evidence Budget v1 still full-fetches/extracts approved Sources before global compaction;
- source caching and coverage-aware early stopping remain future optimization work;
- independent expert scientific peer review remains outside the deterministic audit;
- Final AI Review may surface additional advisory findings after each repaired package, and the product intentionally leaves the decision to revise with the human;
- Tital produces a governed production package rather than rendering the final film.

## Freeze decision

**No additional product features should be added before submission unless required for critical correctness or hackathon compliance.**

Remaining work:

- final docs/compliance synchronization;
- curated screenshots and evidence selection;
- demo recording/editing;
- logged-out/public-demo verification;
- final CI/deployment cleanliness checks;
- Devpost submission completion;
- critical bugs only.

## Submission readiness

All Things Agentic materials live under `docs/hackathon/all-things-agentic/`.

The strongest current submission story is:

```text
broad research
→ full-source grounding
→ adaptive human-attention budget
→ stage-aware AI assistance
→ explicit human authority
→ traceable cinematic production
→ independent whole-package review
→ governed selective revision
→ re-audited versioned package
```

For Agentic Cinema, track-specific compliance must be evaluated separately from product readiness; do not equate a working Parallel MCP integration with compliance unless the current official Partner-track requirement explicitly accepts that integration.

## Validation

Every merge should pass:

```bash
npm run verify:submission
```

Live Vertex/Parallel smoke tests remain deliberate because they consume quota/credits and should now be reserved for critical final validation rather than feature exploration.
