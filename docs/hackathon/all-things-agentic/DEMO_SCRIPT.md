# Tital — ~4-Minute All Things Agentic Demo Script

Target edited duration: **3:40–3:55**. Keep the recording live-looking and continuous. Avoid long title cards, code scrolling, or narrated architecture before the product is visible.

## Recording setup

Before recording:

- use a 16:9 desktop capture at 1080p or higher;
- close unrelated tabs, notifications, passwords, billing details, and personal account data;
- open the public Tital home page in one tab;
- open the public Dinosaur demo in another tab;
- prepare an authenticated live workspace tab with a project positioned at a human review gate if possible;
- prepare Google Cloud Console on the Cloud Run `tital` service/revision;
- optionally prepare GitHub Actions run showing successful Cloud Run deployment;
- make browser zoom large enough that labels are readable in the final video;
- verify the deployed revision uses Gemini 3.5 Flash with a live smoke test before recording.

## 0:00–0:22 — Problem + value proposition

**Screen:** Public Tital landing hero.

**Narration:**

> Scientific filmmaking has a hidden trust problem. Research, narration, and visual decisions often live in separate tools, so when a director asks, “Why are we saying or showing this?”, the evidence chain is easy to lose. Tital turns that process into one governed agentic workflow — from scientific evidence to cinematic decisions.

**Show:**

- hero: `From scientific evidence to cinematic decisions.`
- Evidence → Story pipeline card;
- `AI proposes. Evidence constrains. Directors decide.`

## 0:22–0:48 — What makes it agentic

**Screen:** Public demo overview / governed pipeline.

**Narration:**

> Tital is not a chatbot and it does not just write a script. Google ADK agents powered by Gemini 3.5 Flash perform distinct production tasks: define the film, plan research, discover sources, extract evidence, build claims and script, then propose scenes, shots, and visual decisions. The workflow persists state and stops at human gates before downstream work can advance.

**On-screen callout if editing is allowed:**

`Gemini 3.5 Flash · Google ADK · Vertex AI · Cloud Run`

## 0:48–1:22 — Source discovery + evidence governance

**Screen:** Dinosaur demo, expand Research Questions / Sources / Evidence or show coverage/provenance views.

**Narration:**

> Research is an action, not a memory-only answer. The source-discovery agent must call Parallel Search MCP. Candidate sources are validated, then a human decides what enters the trusted chain. Evidence extraction is allowed only from approved source records, and claims are allowed only from approved evidence.

> Tital also keeps uncertainty explicit. A model can propose scientific meaning, but the application owns trusted IDs, provenance, and workflow status.

**Show:**

- source count;
- approved evidence;
- a readable Evidence record with uncertainty if convenient;
- avoid spending time reading long text.

## 1:22–1:58 — Human collaboration / Director Brief

**Screen:** Authenticated Director Workspace, right-side Director Brief and current human gate.

**Narration:**

> This is where Tital fits the Collaborative Partner track. The director sets a persistent creative operating envelope — collaboration mode, pacing, camera behaviour, representation preference, visual language, and explicit things to avoid.

> At every generative stage the agent pauses. The director can approve, reject, or reject and ask for another proposal with a scoped instruction. Rejection does not silently authorize regeneration.

**Show:**

- Director Brief;
- `Approve selected`, `Reject selected`, `Reject & try another`;
- if safe, open the replacement dialog briefly to show the scoped feedback field; do not trigger a paid retry just for the video unless already planned.

## 1:58–2:32 — Evidence → Story provenance proof

**Screen:** Public Dinosaur Evidence → Story trace.

**Narration:**

> The key output is not just content — it is responsibility. A final visual decision can be traced backwards through its shot, scene, script line, claim, evidence, and source. Rejected records remain history but are excluded from the approved production chain. Intentional omissions are preserved as explicit coverage waivers.

**Show slowly:**

`Source → Evidence → Claim → Script → Scene → Shot → Visual`

Pause for two or three seconds on a real trace so judges can see it is data from the production package rather than a decorative diagram.

## 2:32–2:58 — Final package + audit

**Screen:** Production Package summary.

**Narration:**

> Only after required coverage is resolved does Tital run a deterministic governance and provenance audit and release the production package. The package can be exported as JSON, text, or PDF for downstream production work.

> The audit is deliberately scoped: it verifies governance and provenance integrity; it does not pretend to be independent scientific peer review.

**Show:**

- `READY_FOR_PRODUCTION`;
- audit passed;
- output metrics;
- export actions.

## 2:58–3:18 — Runtime engineering / measured performance

**Screen:** Performance Insights, ideally the Sky project or new Gemini 3.5 smoke/benchmark project.

**Narration:**

> Tital also measures its agent runtime. Independent calls inside a governed stage use bounded concurrency, while stage dependencies and review boundaries remain sequential. The workspace reports actual wall time, external calls, failures, and overlap without inventing an unsupported speedup claim.

**Show:**

- measured runtime;
- external call count;
- concurrency limit;
- stage profile;
- zero failures if the selected run actually shows zero.

## 3:18–3:40 — Google Cloud proof

**Screen:** Google Cloud Console → Cloud Run `tital` service, then optionally Vertex AI/log view or GitHub Actions deployment.

**Narration:**

> The production application runs on Google Cloud. React and the Node API are served from Cloud Run, project state is persisted in Cloud Storage, Firebase protects live project access, and Gemini 3.5 Flash is accessed through Vertex AI. Deployment is automated from GitHub Actions with Workload Identity Federation instead of a long-lived service-account key.

**Required visual proof:**

- show `tital` Cloud Run service and its `.run.app` URL;
- show a healthy/latest revision;
- if easily available, show Vertex AI / application logs or the successful GitHub Actions `Deploy to Cloud Run` job.

## 3:40–3:53 — Closing

**Screen:** Return to public Tital demo hero or Evidence → Story trace.

**Narration:**

> Tital makes scientific-film direction agentic without making the AI the final authority. Gemini proposes, evidence constrains, and the director decides — with a traceable production package at the end.

## Hard stop

End before 4:00. Do not add long credits.

---

# Video quality checklist

- [ ] Problem is understandable within first 15 seconds.
- [ ] Product is visible before second 10.
- [ ] A real agent action/tool relationship is explained, not just UI screens.
- [ ] Collaborative Partner feedback loop is demonstrated.
- [ ] Real source-to-visual provenance is visible.
- [ ] `READY_FOR_PRODUCTION` package is visible.
- [ ] Google Cloud backend proof is visible.
- [ ] Gemini 3.5 Flash is named only after live compatibility is verified.
- [ ] No passwords, API keys, billing account IDs, user tokens, or private bucket paths are shown.
- [ ] Audio is clean and narration is not rushed.
- [ ] Final duration stays at or below roughly four minutes.

# Suggested video title

**Tital — From Scientific Evidence to Cinematic Decisions | All Things Agentic Hackathon**

# Suggested public video description

Tital is an evidence-governed scientific film director built with Google ADK, Gemini 3.5 Flash on Vertex AI, Cloud Run, Cloud Storage, Firebase Authentication, and Parallel Search MCP. It turns a scientific question into a human-reviewed production package while preserving provenance from source and evidence through claim, script, scene, shot, and visual decision.

Built for the All Things Agentic Hackathon — Collaborative Partner track.
