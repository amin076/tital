# Tital Current Status

Status date: **2026-08-24**

Tital is a working, hosted **Evidence-Governed Scientific Film Director** with a public completed demo, authenticated Director Workspace, persistent Cloud Storage state, Google ADK/Gemini agents, Parallel source discovery and full-source grounding, stage-aware AI-assisted review, explicit human gates, governed revisions, versioned production packages, runtime diagnostics, and a deterministic governance/provenance audit.

Core principle:

> **Evidence → Story, not Story → Evidence.**

Current product direction:

> **AI does the volume. Human owns the judgment. Tital owns governed state, provenance, revision impact, and production history.**

## Current runtime stack

| Area | Current state |
|---|---|
| LLM | `gemini-3.5-flash` |
| Agent framework | Google ADK TypeScript |
| Model access | Vertex AI |
| Hosted application | Google Cloud Run |
| Persistent state | Google Cloud Storage |
| Authentication | Firebase Authentication + Firebase Admin verification |
| Web research | Parallel Search MCP `web_search` |
| Full-source Evidence | Parallel MCP `web_fetch` exact approved URL |
| Front end | React 19 + Vite + Material UI |
| Validation | Zod + deterministic application-owned provenance mapping |
| CI/CD | GitHub Actions + Workload Identity Federation + post-deploy health/release verification |

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

Every generative transition remains bounded by human review. Models do not own approval status, trusted identity, or provenance links.

## Feedback-driven product evolution now implemented

### Stage-aware AI-assisted human review

The independent Gemini Review Evaluator is no longer limited to Source/Evidence. It can be requested at every active human gate:

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

Each stage has its own semantic rubric and receives relevant approved upstream context rather than being judged as isolated prose. Examples include Claim→Evidence support, Script→Claim fidelity/audience/pacing, Shot→Scene/Script/Director Brief compatibility, and Visual→Shot/disclosure/representation integrity.

Recommendations contain attention level, confidence, reasons, risks, and flags. They are advisory only. Assisted selection may check boxes, but a human must explicitly approve or reject before trusted state changes.

Review is **optional and user-triggered** so productions can choose where the value of a second Gemini pass justifies its API cost and latency. Evidence remains the special high-volume case: deterministic Adaptive Evidence Budget runs before Evidence AI review.

### Full-source Evidence grounding

New Evidence extraction no longer treats discovery snippets as the Evidence basis. The Evidence Agent must call Parallel `web_fetch` for the exact approved Source URL before returning Evidence proposals. Grounding provenance is stored on new EvidenceRecords.

### Adaptive Evidence Budget

The live 5-minute Aurora smoke test exposed an overproduction case: **21 approved Sources → 123 Evidence candidates**, with approximately **16m47s** of measured Evidence-stage wall time and 29 external calls/executions visible in the runtime profile.

Tital now separates research breadth from active production Evidence:

```text
Candidate Evidence Pool
→ Adaptive Evidence Budget
→ REVIEW_REQUIRED active subset
→ ARCHIVED_CANDIDATE preserved remainder
```

The 5-minute default target is 24 active Evidence records. The live persisted Aurora project verified the intended production behavior:

```text
123 research candidates
→ 24 active human-review candidates
→ 99 archived candidates retained
→ AI Review on active subset
→ 21 human-approved / 3 human-rejected
```

The same run verified **21/21 active Evidence source branches using Parallel `web_fetch`**.

Evidence extraction also asks for a compact strongest set and application code caps production Evidence output to 3 proposals per Source.

See `docs/ADAPTIVE_EVIDENCE_BUDGET.md`.

### Final Production AI Review

A `READY_FOR_PRODUCTION` package can receive a separate advisory whole-package Gemini review for scientific fidelity, uncertainty handling, narrative/pacing, audience fit, visual-integrity risk, and Director Brief consistency. This is distinct from per-gate review: the stage-aware evaluator helps with the current candidate decision; Final Production Review looks across the completed package.

### Governed revision and selective repair

A completed production can be revised without starting a new project. Tital supports impact preview, targeted `STALE` invalidation, selective repair, optional stage-aware review of repaired candidates, human re-review, re-audit, and package rebuilding.

Current revision targets include duration, Source approval revocation, Claim, Shot, and Visual Decision.

### Versioned production history

Production packages are stored as versioned milestones. A revised package can supersede an earlier version while preserving change/revision history and compact comparison information.

## Human collaboration

The project-level Director Brief persists collaboration mode, pacing, camera movement, representation preference, optional visual style/notes, and explicit avoid constraints.

The human can:

```text
Approve
Reject
Reject & try another + scoped instruction
Ask Gemini to review the current gate
Select AI-suggested approvals/rejections without auto-committing them
Explicitly remember selected feedback
Retry / Waive / Cancel coverage gaps
Review final-package AI findings
Preview/apply a governed revision
Repair only the affected branch
```

Scientific precedence remains:

```text
science / provenance / uncertainty / visual-integrity constraints
> approved production constraints
> director guidance
> AI cinematic preference
```

## Trusted-reference hardening

When a model must refer to upstream records, Tital prefers numbered semantic references and maps them back to trusted IDs in application code. Single-parent IDs are application-owned when possible.

The stage-aware Review Evaluator similarly receives model-safe candidate context and does not receive authority to assign trusted IDs/statuses.

## Public demo

The detached Dinosaur demo remains anonymously available at:

```text
COMPLETE
READY_FOR_PRODUCTION
```

It is a sanitized read-only snapshot rather than the authenticated user's live mutable session.

## Performance and resilience status

General independent external calls use bounded concurrency. Full-source Evidence uses a separate conservative default because every Source requires a Gemini turn plus Parallel `web_fetch`.

```text
TITAL_EXTERNAL_CONCURRENCY=3
TITAL_EVIDENCE_CONCURRENCY=1
```

Stage-aware AI review is deliberately on-demand instead of automatically doubling model work at every gate.

Recent live smoke testing exposed and fixed two distinct 429 classes:

1. **Vertex/ADK rate limit during Evidence extraction** — transient rate limits are classified and retried with bounded backoff; Evidence concurrency is conservative. Billing/auth/safety/schema/provenance failures are not blindly retried.
2. **Cloud Run `Rate exceeded.` while one long request occupied the only serving slot** — HTTP serving capacity was separated from model-call concurrency so UI/read/health requests do not need to starve during a long agent operation.

The live Aurora test then exposed the third performance/product issue: Evidence volume itself. Adaptive Evidence Budget addresses that human/downstream workload rather than merely increasing concurrency.

See `docs/PERFORMANCE.md`.

## Governance, staleness and versioning

Current trust model includes:

- application-owned IDs/provenance;
- stage-aware advisory review separated from human authority;
- rejection history;
- explicit retry and waivers;
- `ARCHIVED_CANDIDATE` Evidence archive state;
- `STALE` lifecycle for governed revisions;
- deterministic downstream invalidation;
- audit/package invalidation after affected changes;
- selective branch repair;
- final-package semantic review separated from deterministic audit;
- versioned production packages.

## Audit scope

The deterministic audit is correctly described as a **Governance & provenance audit**. It checks structural trust conditions and representation/disclosure rules. It does **not** independently establish scientific truth, source authority, or expert peer-review quality.

Full-source `web_fetch` grounding improves traceability, but source choice and interpretation still require scientific/human judgment.

## Current major limits

- no optimistic locking for concurrent mutation of one session;
- no dedicated UI yet to browse/promote `ARCHIVED_CANDIDATE` Evidence;
- V1 Evidence Budget still full-fetches/extracts approved Sources before global compaction;
- source-content caching and coverage-aware research early stopping remain future performance work;
- independent scientific peer-review/source-authority verification remains outside the deterministic audit;
- deeper contradiction/epistemic-state modeling remains roadmap;
- stage-aware AI review is an advisory second model pass and therefore adds cost/latency when requested;
- Tital produces a governed production package rather than rendering the final film.

## Current smoke-test focus

The active `Aurora Grounding Test` has already verified full-source retrieval and Adaptive Evidence Budget in production and has progressed through Claims into Script. It is now the live acceptance project for stage-aware review.

Current acceptance sequence:

```text
existing 12 ScriptLineRecord candidates
→ deployed stage-aware Review Assistant appears at SCRIPT gate
→ Ask Gemini to review
→ 12 pending statuses remain unchanged
→ recommendations include claim fidelity / uncertainty / audience / pacing risks
→ human decisions
→ repeat at Scene / Shot / Visual gates
→ Final Production Review
→ duration revision / selective repair / package v2
```

## Submission readiness

The All Things Agentic materials are maintained under `docs/hackathon/all-things-agentic/`. The submission story should emphasize the governed collaboration system, not merely the number of agents:

```text
broad research
→ full-source grounding
→ adaptive human-attention budget
→ stage-aware AI assistance
→ human authority
→ traceable production
→ final cross-stage review
→ revisable/versioned final package
```

## Validation

Every merge should pass:

```bash
npm run verify:submission
```

Live Vertex/Parallel smoke tests remain deliberate because they consume quota/credits and can expose runtime constraints that deterministic tests cannot reproduce.
