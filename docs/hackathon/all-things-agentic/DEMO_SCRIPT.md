# Tital — ~4-Minute All Things Agentic Demo Script

Target edited duration: **3:40–3:55**. The video should prove what Tital does that a long AI chat does not: governed state, AI-assisted human judgment, traceable full-source Evidence, bounded review volume, and safe revision of a finished production.

## Recording setup

Before recording:

- 16:9 desktop capture, 1080p or higher;
- close unrelated/private/billing tabs;
- public Tital landing/demo ready;
- authenticated workspace ready at a useful Source/Evidence review state;
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

## 0:20–0:50 — Agentic research + full-source grounding

**Screen:** Research/Source workflow and one real Source/Evidence relationship.

**Narration:**

> Google ADK agents powered by Gemini 3.5 Flash perform bounded production tasks. Source discovery must use Parallel web search. After a director approves a source, Evidence extraction must fetch the exact approved URL with Parallel web fetch before creating production evidence. Search snippets are discovery context, not the evidence basis.

**Show:**

- Source provider `PARALLEL`;
- approved Source URL;
- `Full-source retrieval` / `Parallel web_fetch` grounding indicator;
- a concise Evidence card with uncertainty.

## 0:50–1:25 — AI helps the human review, but does not replace them

**Screen:** AI Review Assistant at Source or Evidence gate.

**Narration:**

> Human review is essential, but it does not scale if every item demands equal attention. Tital can ask an independent Gemini reviewer to rank risk and attention, explain reasons, and suggest approval or rejection. Those recommendations are advisory only. The candidates remain pending until the human explicitly decides.

**Show:**

- `Ask Gemini to review` or already-completed review results;
- high/medium/low attention counts;
- suggested approvals/rejections;
- one recommendation with reasons/risks;
- human gate still showing pending records;
- warning that assisted selection only checks boxes.

**Narration closing line:**

> AI does the volume. The human owns the judgment.

## 1:25–1:55 — Adaptive Evidence Budget: knowledge vs cost/attention

**Screen:** Evidence Grounding / Human Attention Budget panel.

**Narration:**

> A live five-minute Aurora test exposed a real production problem: twenty-one approved sources created one hundred and twenty-three full-source evidence candidates. More research can be valuable, but forcing every candidate through AI review, human review, and downstream generation is expensive and slow.

> Tital now separates the broad research pool from active production evidence. A duration- and research-priority-aware budget promotes a compact set for review and preserves the remainder as archived research rather than deleting it.

**Show:**

Example after deployed smoke validation:

```text
123 research candidates
~24 active / review target
remaining archived
```

Only show the exact runtime counts visible in the application. Do not narrate a percentage cost saving unless measured by a controlled comparable benchmark.

## 1:55–2:20 — Evidence → Story provenance

**Screen:** Evidence → Story trace.

**Narration:**

> Once the director approves evidence, downstream work remains provenance-connected. A final visual can be traced back through its shot, scene, script line, claim, evidence, and source. Trusted IDs and parent links are application-owned rather than delegated to model memory.

**Show slowly:**

`Source → Evidence → Claim → Script → Scene → Shot → Visual`

## 2:20–2:48 — Final AI Review + governed revision

**Screen:** completed project / Production Review + Revision Workspace.

**Narration:**

> Filmmaking does not stop because an AI says the package is complete. Tital can run an advisory final production review, then the director can revise a completed project. Before changing trusted work, Tital previews dependency impact.

**Demo action:**

Prefer one simple revision such as:

```text
Duration 5 → 8 minutes
```

or revoke one approved Source/replace one Shot if the prepared smoke state supports it.

**Narration:**

> Unaffected science is preserved. Only affected descendants become stale. Tital repairs that branch, requires human review again, re-runs the audit, and creates a new production-package version instead of forcing a new project.

## 2:48–3:10 — Production package + audit/version history

**Screen:** Package status + audit + version history.

**Narration:**

> The deterministic Governance and Provenance Audit checks whether the trusted chain is structurally valid and whether implemented representation/disclosure rules are satisfied. It does not pretend to be scientific peer review. When the chain is ready, Tital produces a versioned production package for downstream work.

**Show:**

- `READY_FOR_PRODUCTION`;
- audit status;
- package/version comparison if available;
- JSON/text/PDF export actions.

## 3:10–3:32 — Runtime engineering proof

**Screen:** Performance Insights briefly, then GitHub Actions or Cloud Run.

**Narration:**

> Tital also records real runtime behavior. Bounded concurrency overlaps safe independent work, full-source Evidence uses conservative model concurrency, transient rate limits use bounded retry, and Cloud Run serving capacity is kept separate from model-call concurrency so long agent work does not need to block the interface.

**Show only facts visible in the selected run.**

Then show successful `Deploy to Cloud Run` or Cloud Run service/revision.

## 3:32–3:50 — Closing

**Screen:** return to Tital project/provenance view.

**Narration:**

> Tital is not valuable because Gemini can generate a script. It is valuable because scientific research stays grounded, human attention stays focused, and every production decision remains traceable and revisable. Gemini proposes and evaluates. Evidence constrains. The director decides.

## Hard stop

End before 4:00.

---

# Video quality checklist

- [ ] Product visible immediately.
- [ ] Explain why this is more than a chat within first 20 seconds.
- [ ] Show real Parallel source/full-source relationship.
- [ ] Show AI Review Assistant while pending status remains human-controlled.
- [ ] Show Adaptive Evidence Budget with exact deployed counts only.
- [ ] Show a real source-to-visual provenance trace.
- [ ] Show Final AI Review or governed revision behavior.
- [ ] Show `READY_FOR_PRODUCTION` / audit / version history.
- [ ] Show Google Cloud backend/deployment proof.
- [ ] Avoid unsupported cost/speed percentages.
- [ ] Never show credentials, billing IDs, tokens, private bucket paths, or private account data.
- [ ] Keep narration paced enough for judges to read the UI.
- [ ] End under ~4 minutes.

# Suggested video title

**Tital — Governed Scientific Filmmaking with Gemini, Google ADK and Parallel**

# Suggested public video description

Tital is an evidence-governed scientific film director built with Google ADK, Gemini 3.5 Flash on Vertex AI, Cloud Run, Cloud Storage, Firebase Authentication, and Parallel Search MCP. It uses full-source evidence grounding, AI-assisted human review, an Adaptive Evidence Budget, end-to-end provenance, governed revisions, and versioned production packages to keep AI useful without making it the final authority.

Built for the All Things Agentic Hackathon — Collaborative Partner track.
