# Tital — All Things Agentic Submission Kit

Primary category: **Collaborative Partner**

Hosted app: **https://tital-o7za4b3w5q-ts.a.run.app/**

Repository: **https://github.com/amin076/tital**

Status: **feedback-driven E2E acceptance verified; product feature-frozen for submission except critical fixes.**

## Files

- [`SUBMISSION.md`](./SUBMISSION.md) — copy-ready narrative, features, findings, stack and safe-claim boundaries.
- [`COMPLIANCE.md`](./COMPLIANCE.md) — requirement matrix and final go/no-go checklist.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — hosted architecture and trust boundary.
- [`architecture.svg`](./architecture.svg) — static architecture graphic.
- [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) — ~4-minute demo plan using the verified acceptance story.
- [`BONUS_CONTENT.md`](./BONUS_CONTENT.md) — optional public social/blog drafts.
- [`../../ADAPTIVE_EVIDENCE_BUDGET.md`](../../ADAPTIVE_EVIDENCE_BUDGET.md) — Evidence-volume design and honest V1 limits.
- [`../../submission/e2e-gemini-35-smoke-test/gemini-35-e2e-report.md`](../../submission/e2e-gemini-35-smoke-test/gemini-35-e2e-report.md) — earlier authenticated Gemini 3.5 Aurora E2E report.
- [`../../submission/e2e-gemini-35-smoke-test/selected/`](../../submission/e2e-gemini-35-smoke-test/selected/) — earlier curated runtime screenshots.
- [`../../submission/feedback-driven-e2e/README.md`](../../submission/feedback-driven-e2e/README.md) — 2026-08-24 live acceptance report for Evidence Budget, stage-aware review, Final Review and governed revision.

## Product readiness

### Hosted/core

- [x] Working hosted Cloud Run application.
- [x] Public detached read-only completed demo.
- [x] Gemini 3.5 Flash through Google ADK / Vertex AI.
- [x] Persistent authenticated Cloud Storage sessions.
- [x] Firebase authentication/per-user namespaces.
- [x] GitHub Actions + Workload Identity Federation deployment.
- [x] Safe runtime/release metadata and post-deploy health assertion.

### Governed production workflow

- [x] FilmBrief → Research → Sources → Evidence → Claims → Script → Scenes → Shots → Visuals → Audit → Package.
- [x] Parallel `web_search` discovery.
- [x] Exact approved-URL Parallel `web_fetch` before new production Evidence.
- [x] Full-source grounding metadata.
- [x] Human review boundaries throughout the generative workflow.
- [x] Explicit rejection/retry/waiver governance.
- [x] Director Brief + opt-in project feedback memory.
- [x] Evidence-to-visual provenance chain.

### Feedback-driven acceptance — verified live

- [x] Stage-aware AI Review Assistant at Source/Evidence/Claim/Script/Scene/Shot/Visual gates; recommendations remain advisory.
- [x] `LOW / MEDIUM / HIGH` human-attention triage with reasons/risks/flags.
- [x] Adaptive Evidence Budget verified on persisted Aurora state: `123 → 24 active + 99 archived`.
- [x] Human Evidence decisions verified: `21 approved / 3 rejected`.
- [x] `21/21` active Evidence Source branches verified with Parallel `web_fetch`.
- [x] Coverage-gap UI forces explicit Retry/Waive/Cancel rather than silent omission.
- [x] Final Production AI Review separated from deterministic audit.
- [x] Deterministic audit reached `0 issues` on completed and rebuilt packages.
- [x] Script and Scene added as governed revision targets after live Final Review exposed the need.
- [x] Script revision impact preview verified: `1 Script → 1 Scene → 2 Shots → 2 Visuals`; Research/Source/Evidence/Claims preserved.
- [x] `STALE` history preserved instead of destructive overwrite.
- [x] Repair-before-audit/package guard added after live state-machine bug discovery.
- [x] Selective repair returned replacement Script candidates to AI-assisted Human Review.
- [x] Re-audit + package rebuild verified.
- [x] Activity history verified `REVISION COMPLETED`, `AUDIT EXECUTED`, `PACKAGE BUILT`.
- [x] Rebuilt package returned to `READY_FOR_PRODUCTION`.
- [x] A second Final Production Review ran on the rebuilt package without mutating trusted state.

## Observed performance/resilience findings

The live Aurora work exposed and hardened real production constraints:

- 21 approved Sources generated 123 Evidence candidates;
- one Evidence-stage profile showed about 16m47s and 29 external calls/executions;
- transient Vertex/ADK 429 → conservative Evidence concurrency + bounded retry/backoff;
- Cloud Run `Rate exceeded.` during long single-slot work → HTTP serving capacity separated from model-call concurrency;
- Evidence overproduction → Adaptive Evidence Budget instead of merely increasing throughput;
- active governed revision could previously reach package completion before repair → repair-before-audit/package state guard.

These are live-smoke observations, not generalized performance percentages.

## Remaining submission actions

- [x] Merge/deploy Adaptive Evidence Budget.
- [x] Verify `candidate → active → archived` behavior on persisted Aurora project.
- [x] Verify stage-aware Script/Scene/Shot/Visual review.
- [x] Verify Final Production Review.
- [x] Verify Script/Scene governed revision capability.
- [x] Verify selective impact, repair, re-audit and rebuilt package.
- [ ] Curate the final 6–10 strongest screenshots into submission evidence.
- [ ] Confirm architecture export reflects the final revision/review lifecycle.
- [ ] Record/edit/upload the ~4-minute demo.
- [ ] Add final public video URL to Devpost.
- [ ] Run final logged-out/public-demo/link check.
- [ ] Complete personal/legal Devpost fields.
- [ ] Submit and re-check links before deadline.

## Recommended demo story

```text
Why not just use Gemini chat?
→ exact-URL full-source grounding
→ 123 research candidates / 24 active / 99 archived
→ stage-aware Gemini review + Human Gate
→ explicit coverage-gap decision
→ audit 0 issues + separate Final AI Review finding
→ Script revision impact 1 / 1 / 2 / 2
→ selective repair + human re-review
→ re-audit + rebuilt READY_FOR_PRODUCTION package
→ Google runtime/deployment proof
```

## Safe positioning

> **Tital scales human judgment without giving AI the authority to replace it.**

> **Tital preserves broad scientific research while controlling how much Evidence consumes human attention and downstream computation.**

> **Tital lets a filmmaker revise completed downstream production without automatically discarding valid upstream science.**

Do not turn these statements into unsupported exact cost/speed claims. Evidence Budget V1 still full-fetches/extracts approved Sources before global compaction.
