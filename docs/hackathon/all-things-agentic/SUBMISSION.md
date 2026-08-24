# All Things Agentic Hackathon — Tital Submission Draft

Status: **hosted production application; feedback-driven E2E acceptance verified on 2026-08-24; feature-frozen for submission except critical fixes.**

## Category

**The Collaborative Partner**

Tital is built around a collaboration contract: AI performs bounded proposal/evaluation work, application code owns trusted state and provenance, and the human director remains the authority for every approval, omission and revision decision.

## Project name

**Tital — Evidence-Governed Scientific Film Director**

## One-line pitch

Tital turns scientific research into a traceable, reviewable and revisable film production package while keeping the human director in control of every trusted decision.

## The problem

A generic AI chat can research a topic, write narration or suggest shots. The difficult production problem is keeping those artifacts connected when science, creative choices and human decisions evolve.

A scientific-film team should be able to ask:

> **Why are we saying or showing this, what evidence supports it, and what changes if we revise it?**

Tital makes that question answerable through persisted provenance, explicit review state, deterministic dependency rules and versioned production history.

## What Tital does

```text
FilmBrief
→ Research Questions
→ Sources
→ full-source Evidence
→ Claims
→ Script
→ Scenes
→ Shots
→ Visual Decisions
→ Governance / provenance audit
→ Production Package
```

Google ADK TypeScript agents powered by Gemini 3.5 Flash perform the semantic production tasks. Parallel Search MCP provides source discovery and exact-URL full-source retrieval. Deterministic TypeScript services validate records, map trusted identity/provenance, enforce human gates, manage Evidence volume, calculate revision impact, propagate `STALE` history, run the audit and build versioned packages.

## Why this is collaborative rather than autonomous self-approval

Every active human gate can optionally ask an independent Gemini Review Evaluator for a second opinion:

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

The evaluator is stage-aware. Examples:

- Evidence review checks grounded support, uncertainty and overstatement;
- Claim review checks approved-Evidence support;
- Script review checks Claim fidelity, uncertainty, audience language and pacing;
- Scene review checks Script coverage and narrative purpose;
- Shot review checks Scene/Script fidelity and scientific visual constraints;
- Visual review checks representation category, disclosure and observation-vs-reconstruction integrity.

It returns attention level, confidence, reasons, risks, flags and an advisory recommendation. It can help select checkboxes, but it cannot change trusted status.

> **AI recommendation ≠ human approval.**

Review is optional and user-triggered so a director can choose when the value of a second Gemini pass justifies additional latency/cost.

## Full-source grounding

Source discovery uses Parallel `web_search`. After a human approves a SourceRecord, new production Evidence requires Parallel `web_fetch` on the **exact approved URL**.

```text
web_search
→ Source candidate
→ human approval
→ web_fetch approved URL
→ Evidence proposals
→ governed review
```

Search snippets remain discovery context. Tital describes `web_fetch` as grounding, not as independent scientific certification.

## Adaptive Evidence Budget — research depth without unbounded review

A real five-minute Aurora production exposed a practical scale problem:

```text
21 approved Sources
→ 123 full-source Evidence candidates
```

Tital kept the broad research pool but controlled what entered the active production workload:

```text
123 research candidates
→ 24 active for review
→ 99 archived and preserved
→ 21 human-approved / 3 human-rejected
```

The same run verified `21/21` active Evidence Source branches using Parallel `web_fetch`.

This is not hidden deletion. `ARCHIVED_CANDIDATE` records remain persisted research history and can be distinguished from rejected and approved production Evidence.

The product message is:

> **Tital does not minimize scientific knowledge. It minimizes unnecessary human attention and downstream computation while preserving traceable research.**

## Stage-aware review in the live production

The Aurora acceptance run demonstrated the reviewer downstream as well as in research:

- Script review identified severe specialist-jargon/audience mismatch while leaving all decisions pending;
- assisted bulk selection reduced the human queue while preserving explicit approval;
- coverage-gap handling prevented rejection from silently removing a required branch;
- Scene review ran with a Scene-specific rubric;
- Shot review checked approved Scene/Script and visual-integrity constraints;
- Visual Decision review checked representation/disclosure integrity.

This showed that scientific risk can emerge during transformation, not only during source selection.

## Final Production AI Review

Per-stage review asks whether a current candidate deserves approval/attention. A separate Final Production Reviewer asks whether the **completed package** still has cross-stage risks.

The live package demonstrated why both checks are needed:

```text
Deterministic governance/provenance audit: 0 issues
Final AI Review: semantic/narrative findings still possible
```

The whole-package reviewer identified issues such as duplication, missing narrative coverage, audience-fit problems and sequence/mapping concerns. Findings remained advisory and did not mutate the package.

## Governed revision and selective repair

A finished film plan is not immutable just because it reached `READY_FOR_PRODUCTION`.

Current revision targets include:

- project duration;
- approved Source;
- approved Claim;
- approved Script Line;
- approved Scene;
- approved Shot;
- approved Visual Decision.

The live Aurora Script revision previewed exactly:

```text
Affected:
1 Script
1 Scene
2 Shots
2 Visual Decisions

Preserved:
Research Questions
Sources
Evidence
Claims
```

After Apply, affected historical work became `STALE` rather than being deleted. Tital then required repair of the earliest affected layer, allowed optional AI review of replacement candidates, required explicit human re-review, re-ran the audit and rebuilt the production package.

The acceptance run also exposed and fixed an important state-machine bug: an `APPLIED` revision waiting for repair is now prevented from jumping directly to Audit/Package/Complete. Direct advance is blocked with `REVISION_REPAIR_REQUIRED` until repair starts.

Activity history subsequently recorded:

```text
REVISION COMPLETED
AUDIT EXECUTED
PACKAGE BUILT
```

and the rebuilt package again reached `READY_FOR_PRODUCTION` with audit `0 issues`.

## Why this matters compared with continuing in one chat

A conversation can remember context approximately. Tital makes production constraints explicit and inspectable:

- which records were approved/rejected/waived/archived/stale;
- which Evidence supports each Claim;
- which Claim supports each Script Line;
- which Script is represented by each Scene/Shot/Visual;
- what an AI reviewer recommended versus what the human decided;
- what changed in a finished production;
- which descendants were invalidated;
- which prior package was superseded.

This is the difference between generating artifacts and governing a production.

## Technologies

### Google

- Gemini 3.5 Flash — `gemini-3.5-flash`
- Google Agent Development Kit (ADK), TypeScript
- Vertex AI
- Google Cloud Run
- Google Cloud Storage
- Firebase Authentication / Firebase Admin
- Workload Identity Federation

### Partner / research

- Parallel Search MCP `web_search`
- Parallel `web_fetch` for approved-URL full-source grounding

### Application

- TypeScript / Node.js
- React 19 / Vite / Material UI
- Zod
- Vitest
- GitHub / GitHub Actions

## Architecture contract

```text
model/tool proposes semantic content
→ schema/domain validation
→ application maps trusted identity + provenance + status
→ deterministic volume/coverage policy where applicable
→ optional independent stage-aware AI review
→ explicit human decision
→ deterministic workflow progression
```

Completed production:

```text
Package
→ Final AI Review
→ human RevisionRequest
→ deterministic impact preview
→ STALE invalidation
→ selective repair
→ optional AI review
→ human re-review
→ re-audit
→ rebuilt/versioned package
```

## Hosted project

`https://tital-o7za4b3w5q-ts.a.run.app/`

Public visitors can inspect a detached read-only completed demo. Live creation/review/revision is Firebase-authenticated.

Repository: `https://github.com/amin076/tital`

## Findings and learnings

1. **Human review must change control flow.** Rejection cannot be a cosmetic thumbs-down followed by silent regeneration.
2. **AI can help humans review without owning approval.** Stage-aware recommendations focus attention while preserving authority.
3. **Research breadth and production Evidence volume are different.** More research is useful; unbounded downstream review is not.
4. **Search discovery and full-source grounding are different.** Production Evidence should not pretend a search snippet is a full source.
5. **Local correctness does not guarantee global film quality.** Final Production Review found cross-stage problems after local gates had passed.
6. **Finished productions need dependency-aware revision.** A filmmaker should not restart research because one Script/Scene/Shot changes.
7. **Revision state itself needs governance.** Live testing found and fixed a path that could complete before repair; regression now blocks it.
8. **Production latency must be measured, not guessed.** Live 429 and request-starvation failures led to bounded retry/concurrency and separate serving-capacity controls.

## Demo emphasis

Do not show every generate/approve step. The strongest four-minute story is:

1. **Why not just Gemini chat?** — persisted governed production state.
2. **Research depth vs human attention** — `123 → 24 active + 99 archived`.
3. **AI helps but does not decide** — stage-aware Script review with human gate still pending.
4. **Whole-package intelligence** — Final AI Review finds a cross-stage problem after deterministic audit passes.
5. **Safe change after completion** — Script revision impact `1 → 1 → 2 → 2`, repair, re-audit and rebuilt package.
6. **Runtime proof** — Gemini 3.5 / ADK / Vertex / Cloud Run / Parallel.

See `DEMO_SCRIPT.md` and `docs/submission/feedback-driven-e2e/README.md`.

## Safe claims

- Working hosted Cloud Run application.
- Runtime uses Gemini 3.5 Flash on Vertex AI through Google ADK.
- Parallel is used for source discovery and approved-URL full-source retrieval.
- Stage-aware Gemini review is advisory and human approval remains authoritative.
- A broad Evidence pool can be compacted into a duration/priority-aware active review subset while archived research is preserved.
- The product supports Final Production AI Review, governed revision, selective repair, re-audit and versioned/history-preserving production state.
- The live revision test preserved upstream science while invalidating only targeted descendants.

## Claims to avoid

Do not claim:

- AI review replaces human approval;
- deterministic audit proves scientific truth;
- `web_fetch` equals peer review;
- archived Evidence is approved production Evidence;
- an exact API-cost percentage saving without a controlled benchmark;
- every Final AI Review finding must be fixed;
- Tital renders the final film;
- unsupported autonomous/background operation.

## Freeze status

Product feature development is frozen for submission. Remaining work is demo recording, curated evidence, compliance checks, final deployment verification and critical fixes only.
