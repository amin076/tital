# Tital Roadmap

Status date: **2026-08-24**

Tital has moved beyond its original linear governed MVP. `main` now includes a hosted Cloud Run/Firebase/GCS application, full evidence-to-visual provenance, AI-assisted human review, exact-URL full-source Evidence grounding, governed revision/impact analysis/selective repair, final-package AI review, package version history, runtime performance diagnostics, and production resilience learned from live smoke tests.

For implementation truth, see [CURRENT_STATUS.md](CURRENT_STATUS.md).

## Completed foundations

### Governed production chain

```text
FilmBrief
→ Research Questions
→ Parallel Source discovery
→ full-source Evidence
→ Claims
→ Script
→ Scenes
→ Shots
→ Visual Decisions
→ deterministic Governance/Provenance Audit
→ Production Package
```

### Human authority

Implemented:

- human review gates for every generative stage;
- rejected history with no silent regeneration;
- explicit Retry / Waive / Cancel gap recovery;
- Director Brief and opted-in project feedback memory;
- independent AI review assistance for high-volume Source/Evidence gates;
- final-package AI review that remains advisory.

### Full-source research grounding

Implemented:

```text
Parallel web_search
→ SourceRecord DISCOVERED
→ AI assistance / human Source review
→ approved Source
→ Parallel web_fetch exact approved URL
→ grounded EvidenceRecord proposals
```

New Evidence metadata explicitly distinguishes full-source grounding from discovery excerpts.

### Governed revision and package versions

Implemented:

```text
READY_FOR_PRODUCTION v1
→ RevisionRequest
→ impact preview
→ affected descendants STALE
→ selective repair
→ human re-review
→ re-audit
→ READY_FOR_PRODUCTION v2
→ version history / comparison
```

Supported revision targets currently include project duration, Source revocation, Claim, Shot, and Visual Decision.

### Cloud deployment and CI/CD

Implemented/live:

```text
Cloud Run UI/API
Cloud Storage persistence
Firebase auth + per-user namespaces
GitHub Actions validation
Workload Identity Federation deployment
post-deploy model/framework/release verification
public detached demo
```

---

## In progress — Adaptive Evidence Budget and human-attention control

A 5-minute Aurora live test produced 123 Evidence candidates from 21 approved Sources. The research breadth was useful, but the review/downstream workload was excessive.

Current implementation target:

```text
Broad Candidate Evidence Pool
→ deterministic adaptive compaction
→ active REVIEW_REQUIRED subset
→ ARCHIVED_CANDIDATE preserved remainder
→ Gemini Review Assistant
→ human Evidence decisions
```

V1 includes:

- compact strongest Evidence output per Source (application cap 3);
- duration-based active budget;
- Research Question priority allocation;
- full-source grounding/strength/source-diversity preference;
- lightweight duplicate reduction;
- preserved non-promoted archive;
- UI visibility of candidate/active/archive counts;
- regression tests.

See [ADAPTIVE_EVIDENCE_BUDGET.md](ADAPTIVE_EVIDENCE_BUDGET.md).

---

## Priority 1 — Complete live acceptance of the feedback-driven release

After Adaptive Evidence Budget deploys:

1. reopen the existing Aurora project with 123 Evidence candidates;
2. run AI Evidence review and confirm the active 5-minute subset is compacted near the 24-item policy target while all candidates remain persisted;
3. verify AI recommendations do not auto-approve Evidence;
4. finish human Evidence review;
5. continue through Claims/Script/Scenes/Shots/Visuals;
6. run final-package AI review;
7. revise duration 5 → 8 minutes;
8. verify impact preview, selective repair, re-review, re-audit and v2 package history;
9. capture screenshots/timings for submission evidence.

---

## Priority 2 — Source-content cache and coverage-aware early stopping

Adaptive Evidence Budget V1 reduces output/review/downstream volume but still retrieves/extracts all approved Sources before global compaction.

Next cost layer:

```text
approved Source
→ fetch/cache content identity + timestamp
→ reuse unchanged source content where policy allows
→ evaluate Research Question coverage
→ stop extracting additional Sources when governed coverage is sufficient
→ expand research only for contradiction / weak coverage / human depth request
```

Requirements:

- freshness/refresh policy;
- provenance timestamp/content identity;
- no indefinite cache for freshness-sensitive science;
- contradiction can expand rather than shrink budget;
- revisions reuse unchanged science where safe;
- metrics demonstrate actual call/token/cost reduction before claims.

---

## Priority 3 — Research depth controls

Add explicit user-facing research strategy without making the user configure dozens of low-level knobs:

```text
AUTO      default adaptive policy
FOCUSED   smaller, faster production research
BALANCED  normal scientific depth
DEEP      larger corroboration/contradiction budget
```

The system should display estimated/actual source calls, Evidence target, and measured elapsed work rather than hiding cost consequences.

---

## Priority 4 — Archived Evidence browsing/promotion

`ARCHIVED_CANDIDATE` preserves research that does not enter the active production chain. Add an explicit UI so a director/researcher can:

- browse archived candidates by Research Question/Source;
- inspect why an item was not promoted;
- explicitly promote selected candidates back to human review;
- optionally increase research depth/budget;
- keep approval distinct from promotion.

This completes the principle:

> **Rich machine knowledge, compact human attention, explicit human override.**

---

## Priority 5 — Persistence concurrency and session versioning

Cloud Storage persistence is durable, but production hardening still needs:

```text
optimistic locking / session revision number
conflict response for simultaneous review/Continue/revision
formal schema/session migration versioning
reviewer identity/rationale/timestamps where appropriate
backup/export/import policy
```

HTTP serving concurrency has been increased enough to avoid request starvation during long agent calls, which makes conflict-safe session mutation more important for broader multi-user operation.

---

## Priority 6 — Scientific semantic governance

The deterministic audit should remain structurally trustworthy. A separate semantic layer can expand checks such as:

```text
UNCERTAINTY_DROPPED
CLAIM_OVERSTATED
SCIENTIFIC_CONSTRAINT_VIOLATION
REPRESENTATION_DISCLOSURE_MISSING
proposition-aware unsupported-claim detection
source-authority / citation evaluation
```

Model-assisted semantic findings must remain labelled as advisory/evaluation, not deterministic proof of truth.

---

## Priority 7 — Contradiction and epistemic-status model

Longer-term scientific records may model:

```text
observation
measurement
experiment
theoretical prediction
model-dependent inference
consensus
debate
hypothesis
analogy
contradiction / corroboration relationships
```

This would allow Adaptive Evidence Budget to expand automatically for contested/uncertain branches rather than relying only on duration/RQ priority.

---

## Priority 8 — Progressive validated execution UX

Long stages should report meaningful progress without streaming unvalidated tokens as trusted records.

Potential UX:

```text
21 approved Sources
→ 7 / 21 full-source retrievals complete
→ 34 Evidence candidates validated
→ final candidate pool compacted
→ 24 active for review
```

SSE/job progress is a later implementation option after session concurrency policy is hardened.

---

## Submission hardening

Before final hackathon submission:

1. keep public judge-testable URL healthy;
2. keep detached completed demo immediately available;
3. finish feedback-driven live smoke evidence;
4. update architecture diagram/screenshots to show AI review + Evidence Budget + revision loop;
5. show exact Google/Parallel runtime proof;
6. explain scientific boundary: full-source grounding improves provenance but does not equal peer review;
7. explain cost/attention design explicitly;
8. record the strongest demo moment: AI triage/compaction plus governed revision rather than a long sequence of generation screens;
9. avoid unsupported performance/cost percentages;
10. keep submission/repo frozen appropriately after the relevant hackathon deadline.

## Explicitly deferred

Unless needed to prove the core value, do not prioritize a large video-generation stack, 3D editor, mobile app, billing system, custom foundation model, decorative agent count, or unrelated graph infrastructure.

Tital's advantage is the **governed, grounded, reviewable, revisable evidence-to-film production system**, not the raw number of agents or Evidence records.
