# Tital — ~4-Minute All Things Agentic Demo Script

Target edited duration: **3:40–3:55**. The video should prove what Tital does that a long AI chat does not: governed state, stage-aware AI-assisted human judgment, traceable full-source Evidence, bounded review volume, and safe revision of a finished production.

## Recording setup

Before recording:

- 16:9 desktop capture, 1080p or higher;
- close unrelated/private/billing tabs;
- public Tital landing/demo ready;
- authenticated workspace ready at a useful Evidence/Script review state;
- one completed `READY_FOR_PRODUCTION` project ready for Final Review/Revision;
- Cloud Run or GitHub Actions deployment proof ready;
- confirm public runtime metadata shows `gemini-3.5-flash`, Google ADK, Vertex AI, Cloud Run, and current release.

Do not spend recording time waiting for a long live external call if the same validated result is already persisted. The video should show functioning state and actions, not unnecessary dead time.

## 0:00–0:20 — Problem and differentiation

**Screen:** Tital landing / active production.

**Narration:**

> A chat model can help research or write a scientific film. The harder problem is keeping every scientific and cinematic decision traceable, reviewable, and safely revisable as the production changes. Tital is the governed control system between scientific evidence and cinematic production.

**Show:**

- `Evidence → Story`;
- `AI proposes. Evidence constrains. Directors decide.`;
- Gemini 3.5 / ADK / Vertex / Cloud Run runtime proof.

## 0:20–0:48 — Agentic research + full-source grounding

**Screen:** Research/Source workflow and one real Source/Evidence relationship.

**Narration:**

> Google ADK agents powered by Gemini 3.5 Flash perform bounded production tasks. Source discovery uses Parallel web search. After a director approves a source, Evidence extraction must fetch the exact approved URL with Parallel web fetch before creating production evidence. Search snippets are discovery context, not the evidence basis.

**Show:**

- Source provider `PARALLEL`;
- approved Source URL;
- `Full-source retrieval` / `Parallel web_fetch` grounding indicator;
- a concise Evidence card with uncertainty.

## 0:48–1:18 — AI helps the human review, but does not replace them

**Screen:** AI Review Assistant at Evidence gate.

**Narration:**

> Human review is essential, but it does not scale if every item demands equal attention. Tital can ask an independent Gemini reviewer to rank risk and attention, explain reasons, and suggest approval or rejection. Those recommendations are advisory only. The candidates remain pending until the human explicitly decides.

**Show:**

- high/medium/low attention counts;
- suggested approvals/rejections;
- one recommendation with reasons/risks;
- human gate still showing pending records;
- warning that assisted selection only checks boxes.

**Narration closing line:**

> AI does the volume. The human owns the judgment.

## 1:18–1:45 — Adaptive Evidence Budget: knowledge vs cost/attention

**Screen:** Human Attention Budget panel from the verified Aurora Grounding Test.

**Narration:**

> A live five-minute Aurora test exposed a real production problem: twenty-one approved sources created one hundred and twenty-three full-source evidence candidates. More research can be valuable, but forcing every candidate through AI review, human review, and downstream generation is expensive and slow.

> Tital kept all one hundred and twenty-three research candidates, promoted twenty-four for active review, and preserved ninety-nine in the project archive instead of deleting them.

**Show exact verified runtime state:**

```text
123 research candidates
24 active for review
99 archived
21 human-approved / 3 human-rejected
```

Do not narrate a percentage cost saving unless measured by a controlled comparable benchmark.

## 1:45–2:10 — Stage-aware review follows the production

**Screen:** move from Evidence to the existing Script gate, then optionally a Shot/Visual prepared screenshot/state.

**Narration:**

> The second reviewer does not stop at research. At each human gate it changes its rubric and reads the relevant approved upstream context. For a Claim it checks Evidence support. For Script it checks Claim fidelity, uncertainty, audience language and pacing. For Shots and Visual Decisions it checks the approved story, Director Brief, scientific constraints, and representation risk.

**Show:**

- `AI REVIEW ASSISTANT` at Script;
- one flag such as audience/pacing/unsupported-addition risk if produced by the live run;
- pending count unchanged after AI review;
- if available, briefly show the same assistant at Shot or Visual gate.

**Narration:**

> It is optional and user-triggered, so the director chooses when a second Gemini pass is worth its API cost. AI still cannot approve its own recommendation.

## 2:10–2:30 — Evidence → Story provenance

**Screen:** Evidence → Story trace.

**Narration:**

> Once the director approves work, downstream production remains provenance-connected. A final visual can be traced back through its shot, scene, script line, claim, evidence, and source. Trusted IDs and parent links are application-owned rather than delegated to model memory.

**Show slowly:**

`Source → Evidence → Claim → Script → Scene → Shot → Visual`

## 2:30–2:58 — Final AI Review + governed revision

**Screen:** completed project / Production Review + Revision Workspace.

**Narration:**

> Per-stage review helps with current decisions. After the full package is complete, a separate Final Production Reviewer looks across the whole production for cross-stage scientific, narrative, audience, and visual risks. The director then decides whether to revise anything.

**Demo action:**

Prefer:

```text
Duration 5 → 8 minutes
```

**Narration:**

> Before changing trusted work, Tital previews dependency impact. Unaffected science is preserved. Only affected descendants become stale. Tital repairs that branch, can review the repaired candidates again, requires human approval, re-runs the audit, and creates a new package version instead of forcing a new project.

## 2:58–3:20 — Production package + audit/version history

**Screen:** Package status + audit + version history.

**Narration:**

> The deterministic Governance and Provenance Audit checks whether the trusted chain is structurally valid and whether implemented representation and disclosure rules are satisfied. It does not pretend to be scientific peer review. When the chain is ready, Tital produces a versioned production package for downstream work.

**Show:**

- `READY_FOR_PRODUCTION`;
- audit status;
- package/version comparison if available;
- JSON/text/PDF export actions.

## 3:20–3:38 — Runtime engineering proof

**Screen:** Performance Insights briefly, then GitHub Actions or Cloud Run.

**Narration:**

> Tital records real runtime behavior. Bounded concurrency overlaps safe independent work, full-source Evidence uses conservative model concurrency, transient rate limits use bounded retry, and Cloud Run serving capacity is kept separate from model-call concurrency. Optional review means quality checks do not silently double every stage's model cost.

Then show successful `Deploy to Cloud Run` or Cloud Run service/revision.

## 3:38–3:52 — Closing

**Screen:** return to Tital project/provenance view.

**Narration:**

> Tital is not valuable because Gemini can generate a script. It is valuable because scientific research stays grounded, human attention stays focused, and every production decision remains traceable, reviewable, and revisable. Gemini proposes and evaluates. Evidence constrains. The director decides.

## Hard stop

End before 4:00.

---

# Video quality checklist

- [ ] Product visible immediately.
- [ ] Explain why this is more than a chat within first 20 seconds.
- [ ] Show real Parallel source/full-source relationship.
- [ ] Show AI Review Assistant while pending status remains human-controlled.
- [ ] Show verified Adaptive Evidence Budget counts: 123 → 24 active + 99 archived.
- [ ] Show the Review Assistant again at a downstream stage such as Script, Shot, or Visual.
- [ ] Explain that per-stage AI review is optional/user-triggered because it adds model cost.
- [ ] Show a real source-to-visual provenance trace.
- [ ] Show the separate Final Production AI Review or governed revision behavior.
- [ ] Show `READY_FOR_PRODUCTION` / audit / version history.
- [ ] Show Google Cloud backend/deployment proof.
- [ ] Avoid unsupported cost/speed percentages.
- [ ] Never show credentials, billing IDs, tokens, private bucket paths, or private account data.
- [ ] Keep narration paced enough for judges to read the UI.
- [ ] End under ~4 minutes.

# Suggested video title

**Tital — Governed Scientific Filmmaking with Gemini, Google ADK and Parallel**

# Suggested public video description

Tital is an evidence-governed scientific film director built with Google ADK, Gemini 3.5 Flash on Vertex AI, Cloud Run, Cloud Storage, Firebase Authentication, and Parallel Search MCP. It uses full-source evidence grounding, an Adaptive Evidence Budget, stage-aware AI-assisted human review, end-to-end provenance, governed revisions, a separate final production review, and versioned production packages to keep AI useful without making it the final authority.

Built for the All Things Agentic Hackathon — Collaborative Partner track.
