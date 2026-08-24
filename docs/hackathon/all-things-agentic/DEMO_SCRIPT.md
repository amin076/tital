# Tital — ~4-Minute All Things Agentic Demo Script

Target edited duration: **3:40–3:55**.

The video should prove what Tital does that a long AI conversation does not: **governed state, focused human attention, traceable evidence, cross-stage review and safe revision of a completed production.**

## Recording setup

Before recording:

- 16:9 desktop capture, 1080p or higher;
- close unrelated/private/billing tabs;
- authenticated `Aurora Grounding Test` ready at useful persisted states or use prepared screenshots for long-running calls;
- completed repaired package ready for Final Review/history;
- runtime proof showing Gemini 3.5 Flash / Google ADK / Vertex AI / Cloud Run;
- successful GitHub Actions deployment proof ready.

Do not waste video time waiting for long model/tool calls when the persisted verified result can be shown immediately.

## 0:00–0:20 — Why not just use Gemini chat?

**Screen:** Tital workspace / completed Aurora project.

**Narration:**

> Gemini can research or write a scientific film. The harder problem is keeping every scientific and cinematic decision traceable, reviewable and safely revisable after humans start changing the production. Tital is the governed control system between evidence and filmmaking.

Show:

- `Evidence → Story`;
- current workflow stages;
- Gemini 3.5 / ADK / Vertex runtime badges.

## 0:20–0:48 — Full-source grounding

**Screen:** approved Source and Evidence grounding panel.

**Narration:**

> Source discovery uses Parallel web search. But a search snippet is not production evidence. After the director approves a source, Tital requires Parallel web fetch on that exact approved URL before Gemini extracts Evidence.

Show:

- Source provider `PARALLEL`;
- `21/21 active Parallel web_fetch`;
- one grounded Evidence card with uncertainty.

## 0:48–1:15 — Research depth vs human attention

**Screen:** Human Attention Budget.

**Narration:**

> Our five-minute Aurora test produced one hundred and twenty-three full-source evidence candidates from twenty-one approved sources. More research can be useful, but forcing every item through AI review, human review and downstream generation would waste attention and context.

> Tital kept all one hundred and twenty-three candidates, promoted twenty-four for active review and preserved ninety-nine in the archive.

Show exactly:

```text
123 research candidates
24 active for review
99 archived
21 human-approved / 3 human-rejected
```

Do not claim an exact cost-saving percentage.

## 1:15–1:48 — Gemini helps review; the human still decides

**Screen:** Script AI Review Assistant from the live Aurora run.

**Narration:**

> AI assistance follows the production. At Script, Gemini reads the approved upstream science plus audience and production constraints. Here it flags specialist plasma-physics jargon as a high-attention audience mismatch.

Show:

- HIGH / MEDIUM / LOW attention counts;
- one concrete reason/risk;
- `Approve suggested` / `Reject suggested`;
- Human Gate still pending;
- warning that assisted selection only checks boxes.

**Narration:**

> Recommendations are advisory. Gemini can focus my attention, but it cannot approve its own output.

## 1:48–2:08 — Governance is real control flow

**Screen:** coverage-gap dialog.

**Narration:**

> Human rejection changes control flow. If rejecting a record would break required scientific coverage, Tital does not silently regenerate or hide the gap. The director must explicitly retry, waive the branch or cancel the rejection.

Show:

- `Reject & try another`;
- `Reject & continue with gap`;
- reason/history field.

## 2:08–2:30 — Whole-package review finds what local gates miss

**Screen:** `READY_FOR_PRODUCTION`, audit `0 issues`, then Final AI Review finding.

**Narration:**

> Local review and structural audit are not the same as whole-film quality. This package passed the deterministic governance and provenance audit with zero issues, but the independent Final Production Reviewer still found cross-stage narrative problems, including duplicated narration and missing visual mapping.

Show:

- `Governance & provenance audit passed with 0 issues`;
- one Final AI Review finding such as duplication or unmapped Script lines.

## 2:30–3:05 — Safe revision after completion

**Screen:** Governed Revision → Script revision → deterministic Impact Preview.

**Narration:**

> Instead of starting a new project, the director can revise the completed production. For this real Script revision, Tital calculated the dependency impact before changing trusted state.

Show exact verified preview:

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

**Narration:**

> The old records remain visible as stale history. Only the affected branch is repaired. Tital then returns replacement work to AI-assisted human review, requires explicit human decisions, re-runs the audit and rebuilds the package.

Briefly show `Repair affected branch` and a repaired Script gate.

## 3:05–3:25 — Revision state cannot skip repair

**Screen:** active revision / repair state or activity history.

**Narration:**

> We also hardened the state machine during this live test. An applied revision cannot jump directly to audit or completion while repair is still required. The revision must pass through repair and human review first.

Show activity/history:

```text
REVISION COMPLETED
AUDIT EXECUTED
PACKAGE BUILT
```

## 3:25–3:40 — Rebuilt package and history

**Screen:** repaired package.

**Narration:**

> The repaired production returned to READY_FOR_PRODUCTION with a zero-issue structural audit, while rejected, archived and stale records remained inspectable history instead of being erased.

Show:

- `READY_FOR_PRODUCTION`;
- audit `0 issues`;
- package counts;
- version/revision history;
- JSON/text/PDF export buttons.

## 3:40–3:52 — Closing

**Screen:** return to Tital overview.

**Narration:**

> Tital is not valuable because Gemini can generate a script. It is valuable because research stays grounded, human attention stays focused, and every production decision remains traceable and safely revisable. Gemini proposes and evaluates. Evidence constrains. The director decides.

## Hard stop

End before **4:00**.

---

## Video checklist

- [ ] Explain why Tital is more than chat in first 20 seconds.
- [ ] Show real Parallel full-source grounding.
- [ ] Show `123 → 24 active + 99 archived`.
- [ ] Show stage-aware Script review and pending Human Gate.
- [ ] Show a coverage-gap decision.
- [ ] Show audit `0 issues` and separate Final AI Review finding.
- [ ] Show real revision impact `1 Script → 1 Scene → 2 Shots → 2 Visuals`.
- [ ] Show upstream Research/Source/Evidence/Claims preserved.
- [ ] Show repair + `REVISION COMPLETED` + rebuilt package.
- [ ] Show Google runtime/deployment proof.
- [ ] Do not show credentials, billing identifiers or private storage paths.
- [ ] Do not claim the Final AI Review certifies scientific truth.
- [ ] Do not claim exact cost savings without a controlled benchmark.

## Suggested title

**Tital — Governed Scientific Filmmaking with Gemini, Google ADK and Parallel**

## Suggested public description

Tital is an evidence-governed scientific film director built with Google ADK, Gemini 3.5 Flash on Vertex AI, Cloud Run, Cloud Storage, Firebase Authentication and Parallel Search MCP. It combines full-source grounding, Adaptive Evidence Budget, stage-aware AI-assisted human review, explicit human authority, whole-package review and dependency-aware governed revision to produce traceable, versioned scientific-film production packages.

Built for the All Things Agentic Hackathon — Collaborative Partner category.
