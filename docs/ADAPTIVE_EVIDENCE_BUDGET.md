# Adaptive Evidence Budget

Status date: **2026-08-24**

Tital separates **research breadth** from **production evidence volume**. The goal is not to minimize scientific knowledge. The goal is to preserve broad research while controlling how much evidence consumes Gemini context, human attention, downstream generation, latency, and external quota.

## Why this exists

A live hosted smoke test of the 5-minute **Aurora Grounding Test** approved 21 public Sources and then performed exact-URL full-source Evidence extraction. The Evidence stage produced **123 Evidence candidates** and recorded approximately **16m47s** of measured Evidence-stage wall time across **29 external calls/executions visible in the runtime profile**.

That run proved two things at once:

1. broad full-source extraction can create a useful scientific knowledge pool;
2. pushing every extractable proposition into AI review, human review, Claims, and Script does not scale.

The resulting product requirement is:

> **Rich machine knowledge, compact human attention.**

## Three evidence layers

```text
Research corpus
    ↓
Candidate Evidence Pool
    ↓ adaptive budget / compaction
Active Production Evidence
    ↓
AI-assisted review
    ↓
Human decision
    ↓
Trusted downstream chain
```

### Research corpus

Approved SourceRecords and their full-source retrieval provenance remain available to the project. Research can be broader than the final film.

### Candidate Evidence Pool

Evidence extraction can identify more scientifically relevant propositions than a short film needs. Candidate records remain typed, source-linked, and persisted.

### Active Production Evidence

Only a duration- and priority-aware subset enters `REVIEW_REQUIRED`, AI-assisted Evidence review, human review, and later production stages. Non-promoted candidates are preserved as:

```text
ARCHIVED_CANDIDATE
```

They are not deleted, approved, or silently treated as production evidence.

## V1 policy

### Per-source extraction cap

The full-source Evidence Agent is instructed to return the strongest, most relevant, non-duplicative propositions and is capped by application code at **3 Evidence proposals per Source**.

This reduces output/context volume at the first Evidence boundary without changing the requirement to `web_fetch` the exact approved URL.

### Automatic active budget

Current baseline:

| Film duration | Active Evidence target |
|---|---:|
| `<= 3 min` | 12 |
| `<= 5 min` | 24 |
| `<= 10 min` | 36 |
| `<= 20 min` | 54 |
| `<= 30 min` | 72 |
| `> 30 min` | gradual growth, current cap 120 |

The controller also targets at least two slots per active Research Question when enough candidates exist.

These values are product defaults, not scientific sufficiency claims. They can evolve with live measurements.

### Research-question allocation

Research Questions have `HIGH`, `MEDIUM`, or `LOW` priority. The controller first preserves question coverage, then allocates remaining budget preferentially toward higher-priority questions.

This means a low-priority contextual question should not consume the same human-review capacity as a high-priority question carrying the central scientific explanation.

### Candidate selection

The deterministic V1 selector favors:

- `HIGH` over `MEDIUM` over `LOW` Evidence strength;
- explicit `PARALLEL_WEB_FETCH` grounding;
- source diversity;
- distinct information rather than near-duplicates;
- preserved uncertainty/limitation metadata as a useful scientific tie-breaker.

A lightweight token/Jaccard comparison is used only as a deterministic duplicate-reduction heuristic. It is not a semantic scientific-quality score.

## Governance semantics

`ARCHIVED_CANDIDATE` means:

```text
scientific material was extracted and preserved
≠ human approved
≠ rejected
≠ active production evidence
```

Only `APPROVED`/`LOCKED` records may enter the trusted production chain. Compaction therefore cannot manufacture approval or bypass a gate.

The Evidence AI Review Assistant runs only on the promoted pending subset. It may recommend approval/rejection/attention, but the human still owns the trusted decision.

## Why not just delete extra evidence?

Deleting non-promoted material would lose research breadth and make later revisions more expensive. Tital instead keeps the broad pool so future workflows can support explicit promotion, deeper research modes, new film durations, or targeted revision without pretending the material never existed.

The current V1 does **not yet expose a dedicated archive-browser/promotion UI**. Archived records are preserved in governed session state but excluded from active review and downstream production.

## Cost and latency impact

The current implementation reduces work at several layers:

```text
smaller per-source extraction output
→ smaller Evidence review set
→ smaller human gate
→ fewer approved Evidence records
→ smaller Claim-generation context
→ smaller Script/Scene downstream context
```

The savings compound downstream.

### Important current limitation

V1 still performs full-source retrieval/extraction for approved Sources before global compaction. Therefore it does **not** claim to eliminate the upfront `web_fetch`/Gemini call for every approved Source.

It currently saves:

- per-source output tokens/records;
- Evidence-review context and recommendations;
- human review workload;
- redundant downstream context and generation.

Future work can reduce the earlier research cost through:

- cached full-source retrieval keyed by URL/content identity and refresh policy;
- coverage-aware early stopping;
- source prioritization before full extraction;
- contradiction-triggered budget expansion;
- user-selected `Focused / Balanced / Deep / Auto` research depth;
- Vertex context caching when repeated large context is actually measured.

## Why the budget should remain adaptive

A fixed cap cannot represent scientific complexity. A 5-minute explanation of Rayleigh scattering and a 5-minute treatment of an active scientific controversy may need different evidence breadth.

Future adaptive expansion should be triggered by conditions such as:

```text
critical Research Question has weak coverage
only one independent source supports an important Claim
contradictory Evidence exists
high uncertainty / model dependence exists
source authority is weak
human requests deeper research
```

That yields the desired long-term policy:

> **Research until sufficient for the governed production goal, not until the web is exhausted.**

## UI transparency

The Director Context rail exposes the distinction rather than hiding it. Example:

```text
123 research candidates
24 active / approved
99 archived
Auto target 24
```

This makes cost/attention control inspectable to the user and judge.

## Metrics to keep measuring

For representative live runs record:

- approved Source count;
- full-source fetch/extraction call count;
- candidate Evidence count;
- promoted Evidence count;
- archived Evidence count;
- Evidence-stage wall time;
- AI-review call/context volume where measurable;
- human-review active item count;
- downstream Claim/Script counts;
- rate-limit/retry events.

Do not claim a percentage cost or speed improvement until comparable before/after runs are measured under the same runtime configuration.

## Hackathon explanation

Recommended concise explanation:

> **Tital separates research depth from human review volume. It can retain a broad scientific research corpus while promoting only the strongest, provenance-grounded, non-duplicative evidence into the governed production chain. The adaptive Evidence Budget balances scientific coverage, human attention, latency, and API cost without giving AI authority to approve evidence.**

A shorter version:

> **Tital does not minimize scientific knowledge. It minimizes unnecessary human attention and downstream computation while preserving traceable research.**

## Acceptance checks

A valid V1 smoke test should show:

1. full-source Evidence still carries exact-URL `PARALLEL_WEB_FETCH` grounding;
2. a large candidate pool remains persisted;
3. active pending Evidence is at or below the computed budget;
4. non-promoted Evidence becomes `ARCHIVED_CANDIDATE`, not deleted;
5. AI review recommendations are generated only for active pending Evidence;
6. no Evidence becomes `APPROVED` without explicit human action;
7. Claims use only approved active Evidence through the existing approved-chain selector.
