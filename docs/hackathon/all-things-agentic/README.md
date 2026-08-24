# Tital — All Things Agentic Submission Kit

Primary track: **Collaborative Partner**

Hosted app: **https://tital-o7za4b3w5q-ts.a.run.app/**

Repository: **https://github.com/amin076/tital**

## Files

- [`SUBMISSION.md`](./SUBMISSION.md) — copy-ready narrative, features, findings, stack, and safe-claim boundaries.
- [`COMPLIANCE.md`](./COMPLIANCE.md) — requirement matrix and final go/no-go checklist.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — hosted architecture, trust boundary, AI review, Evidence Budget, and revision lifecycle.
- [`architecture.svg`](./architecture.svg) — static architecture graphic; regenerate/export if the final diagram is updated before submission.
- [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) — revised ~4-minute plan emphasizing differentiation from ordinary chat.
- [`BONUS_CONTENT.md`](./BONUS_CONTENT.md) — optional public social/blog drafts.
- [`../../ADAPTIVE_EVIDENCE_BUDGET.md`](../../ADAPTIVE_EVIDENCE_BUDGET.md) — detailed human-attention/API-cost design and honest V1 limits.
- [`../../submission/e2e-gemini-35-smoke-test/gemini-35-e2e-report.md`](../../submission/e2e-gemini-35-smoke-test/gemini-35-e2e-report.md) — earlier authenticated Gemini 3.5 Aurora E2E report.
- [`../../submission/e2e-gemini-35-smoke-test/selected/`](../../submission/e2e-gemini-35-smoke-test/selected/) — curated E2E screenshots/runtime proof.

## Current product readiness

### Hosted/core

- [x] Working hosted Cloud Run application.
- [x] Public detached read-only completed demo.
- [x] Gemini 3.5 Flash through Google ADK / Vertex AI.
- [x] Persistent authenticated Cloud Storage sessions.
- [x] Firebase authentication/per-user namespaces.
- [x] GitHub Actions + Workload Identity Federation deployment.
- [x] Safe runtime/release metadata and post-deploy health assertion.

### Governed scientific-production workflow

- [x] FilmBrief → Research → Sources → Evidence → Claims → Script → Scenes → Shots → Visuals → Audit → Package.
- [x] Parallel `web_search` source discovery.
- [x] Exact approved-URL Parallel `web_fetch` before new full-source Evidence generation.
- [x] Application-owned Evidence grounding metadata.
- [x] Human review boundaries throughout generative workflow.
- [x] Explicit rejection/retry/waiver governance.
- [x] Director Brief + opt-in project feedback memory.
- [x] Evidence-to-visual provenance trace.

### Feedback-driven collaboration improvements

- [x] AI Review Assistant for Source/Evidence gates; recommendations remain advisory.
- [x] `LOW / MEDIUM / HIGH` human-attention triage with reasons/risks/flags.
- [x] Final Production AI Review findings separated from deterministic audit.
- [x] Governed post-package revision with dependency impact preview.
- [x] Selective `STALE` repair and re-review/re-audit lifecycle.
- [x] Versioned production-package history/comparison.
- [x] Adaptive Evidence Budget implementation and tests on PR #39 branch: broad candidate pool preserved, active 5-minute target currently 24, remainder archived rather than deleted.

### Live performance/resilience findings

The feedback-driven Aurora smoke test has already provided useful production evidence:

- 21 approved Sources;
- full-source Evidence extraction reached 123 candidates;
- Evidence stage runtime profile approximately 16m47s / 29 calls/executions for that smoke run;
- transient Vertex/ADK 429 exposed and hardened with Evidence-specific conservative concurrency + bounded retry;
- Cloud Run `Rate exceeded.` exposed when one long request occupied the only serving slot; HTTP serving capacity was separated from Evidence model concurrency;
- Evidence overproduction motivated Adaptive Evidence Budget rather than simply increasing API throughput.

These are live-smoke observations, not generalized performance percentages.

## Remaining submission actions

- [ ] Merge/deploy Adaptive Evidence Budget after final CI.
- [ ] Re-run the active Aurora Evidence gate and capture the exact `candidate → active → archived` counts.
- [ ] Complete downstream Aurora production/revision smoke test.
- [ ] Capture final screenshots that show AI review, full-source grounding, Evidence Budget, and revision/version behavior.
- [ ] Update/export static architecture image if needed.
- [ ] Record and upload demo video.
- [ ] Add final video URL to Devpost.
- [ ] Complete personal/legal Devpost eligibility fields.
- [ ] Submit and re-check links before deadline.

## Recommended demo story

Do **not** spend the majority of the video showing repetitive `Generate → Approve` screens. The strongest sequence is:

```text
Why not just use Gemini chat?
→ Source/full-source grounding
→ AI Review Assistant focuses human attention
→ Adaptive Evidence Budget keeps broad research but reduces active review
→ Evidence → Story provenance
→ READY_FOR_PRODUCTION
→ Final AI Review / human revision
→ impact preview + selective repair + v2
→ Google Cloud runtime proof
```

## Safe positioning

Recommended core line:

> **Tital scales human judgment without giving AI the authority to replace it.**

Research/cost line:

> **Tital keeps broad scientific research available while controlling how much Evidence consumes human attention and downstream computation.**

Do not turn those statements into unsupported exact cost/speed claims. V1 Adaptive Evidence Budget still full-fetches/extracts approved Sources before global compaction; source caching and coverage-aware early stopping remain future work.
