# All Things Agentic Hackathon — Tital Submission Draft

Status: **hosted production application; Gemini 3.5/ADK/Vertex runtime proven; feedback-driven review/revision/grounding improvements implemented or in final smoke validation; demo-video recording remains a release gate.**

## Category

**The Collaborative Partner**

Tital is designed around a collaboration loop in which AI handles proposal/research volume, an independent stage-aware AI evaluator helps focus human attention, and the human director remains the authority for what enters or changes the trusted production chain.

## Project name

**Tital — Evidence-Governed Scientific Film Director**

## One-line pitch

Tital turns scientific research into a traceable, reviewable, revisable film production package while keeping the human director in control of every trusted decision.

## Short description

Scientific filmmaking has a structural trust problem: research, narration, and cinematic choices are often generated in separate tools, making it difficult to answer **why are we saying or showing this?** A generic AI chat can generate individual research notes, scripts, or shots, but it does not automatically provide application-level provenance, approval state, dependency impact, selective repair, or production history.

Tital is a hosted agentic scientific-film directing workspace. Google ADK agents powered by Gemini 3.5 Flash propose structured scientific/cinematic work. Parallel Search MCP performs source discovery and exact-URL full-source retrieval. Deterministic TypeScript services validate output, map trusted identity/provenance, manage Evidence volume, enforce human gates, calculate revision impact, invalidate stale dependencies, run the governance/provenance audit, and build versioned production packages.

At every active human gate, the director can optionally request a second, independent Gemini evaluation. That reviewer receives a stage-specific rubric plus relevant approved upstream context: Claims are checked against approved Evidence, Script against approved Claims and audience/duration, Shots against approved Scene/Script and Director Brief, and Visual Decisions against their approved Shot and scientific-representation constraints. Recommendations remain advisory; they never change trusted status by themselves.

The result is a production system in which a final visual decision can be traced backwards through Shot → Scene → Script Line → Claim → Evidence → Source, and a completed package can be revised without discarding unaffected approved work.

## The problem Tital solves

Scientific-film teams need three things that are difficult to preserve in one AI conversation:

1. **scientific traceability** — what source/evidence supports the story;
2. **human authority at scale** — humans should decide, but should not have to manually inspect every low-risk candidate with equal effort;
3. **iterative production state** — films change after “completion”; revisions should have explicit dependency impact and history.

Tital makes those properties first-class product behavior.

## What Tital does

1. Converts a film idea and production controls into a structured Film Brief proposal.
2. Proposes the Research Questions the production must answer.
3. Uses a Google ADK Source Agent with Parallel `web_search` to discover public sources.
4. Lets Gemini independently assist Source review with attention/risk/recommendation metadata while leaving trusted status unchanged.
5. After human Source approval, requires Parallel `web_fetch` on the exact approved URL before Evidence is created.
6. Extracts a compact strongest Evidence set and applies an Adaptive Evidence Budget so broad research does not become an unbounded AI/human review queue.
7. Preserves non-promoted research as `ARCHIVED_CANDIDATE` instead of deleting it.
8. Lets an independent Gemini reviewer triage active Evidence before explicit human approval/rejection.
9. Generates Claims only from approved active Evidence, then Script Lines, Scenes, Shots, and Visual Decisions through the same governed chain.
10. At each of those human gates, the director can optionally invoke the same independent Review Evaluator with a stage-specific rubric and approved upstream context.
11. Runs a deterministic Governance & Provenance Audit and creates a `READY_FOR_PRODUCTION` package only when required governed coverage is complete.
12. Lets Gemini perform a separate advisory whole-package Final Production Review.
13. Lets the human revise a completed production through impact preview, `STALE` invalidation, selective repair, optional AI review of repaired candidates, re-review, re-audit, and a new package version.

## Collaborative Partner fit

Tital's collaboration is not a thumbs-up UI placed after a generator. Human choices affect persisted state and later control flow.

- **Director Brief:** collaboration mode, pacing, camera behavior, representation preference, visual language, notes, and `avoid[]` constraints persist with the project.
- **Stage-aware AI Review Assistant:** Gemini can recommend where the human should focus at Film Brief, Research Question, Source, Evidence, Claim, Script, Scene, Shot, and Visual Decision gates, but recommendations never become approval automatically.
- **Context-aware review:** downstream reviewers receive approved upstream content rather than evaluating text in isolation.
- **Targeted adaptation:** `Reject & try another` can include a scoped instruction.
- **Explicit memory:** retry guidance becomes reusable project feedback only when the director opts in.
- **Coverage-aware decisions:** a rejection that empties required coverage must be explicitly retried or intentionally waived where policy allows.
- **Final collaboration:** a completed package can receive cross-stage AI findings, but the human chooses whether to open a governed revision.
- **No scientific override:** director style and AI preference remain below scientific/provenance/uncertainty constraints.

The stage-level review is optional and user-triggered. Tital does not automatically add a second Gemini pass to every generation step, so the director can balance review depth against API cost and latency.

## Key features

- Evidence → Story provenance chain.
- Human-gated multi-agent workflow.
- Gemini 3.5 Flash through Google ADK / Vertex AI.
- Parallel MCP `web_search` discovery and exact approved-URL `web_fetch` Evidence grounding.
- **Stage-aware AI-assisted review across every active human gate**, with human-attention levels and stage-specific risk rubrics.
- **Adaptive Evidence Budget** separating broad research from active production Evidence.
- Preserved `ARCHIVED_CANDIDATE` research rather than silent deletion.
- Persistent authenticated projects on Cloud Storage.
- Firebase authentication and per-user namespaces.
- Director Brief and explicit project feedback memory.
- Application-owned trusted IDs/provenance + numbered model references.
- Rejection history, explicit retry, coverage waivers.
- `STALE` dependency invalidation and selective repair.
- Final Production AI Review findings separated from per-gate review and deterministic audit.
- Versioned Production Packages and revision history/comparison.
- JSON/text/print-PDF production output.
- Detached read-only public demo.
- Runtime Performance Insights and safe model/framework/release proof.
- GitHub Actions deployment with Workload Identity Federation.

## Technologies used

### Google

- **Gemini 3.5 Flash** — `gemini-3.5-flash`
- **Google Agent Development Kit (ADK), TypeScript**
- **Vertex AI**
- **Google Cloud Run**
- **Google Cloud Storage**
- **Firebase Authentication / Firebase Admin**
- **Google Workload Identity Federation**

### Application

- TypeScript / Node.js
- React 19 / Vite / Material UI
- Zod
- Vitest
- GitHub / GitHub Actions

### Partner/data integration

- **Parallel Search MCP** — `web_search` for candidate discovery and `web_fetch` for full-source Evidence grounding after human Source approval.

## Architecture highlights

```text
Gemini / Parallel proposes or retrieves semantic content
→ Zod/domain validation
→ application owns identity + provenance + status
→ deterministic Evidence-volume policy where applicable
→ optional independent stage-aware AI review
→ human decision
→ deterministic coverage/workflow rules
→ downstream production
```

The Review Evaluator is deliberately advisory:

```text
candidate + approved upstream context + project/director controls
→ Gemini stage-specific review rubric
→ attention / recommendation / risks / flags
→ human decision
→ trusted state transition
```

Completed production is also governed:

```text
Package v1
→ advisory Final AI Review
→ human RevisionRequest
→ deterministic impact preview
→ selective STALE invalidation / repair
→ optional stage-aware review of repaired candidates
→ human re-review
→ re-audit
→ Package v2
```

See `ARCHITECTURE.md` and `architecture.svg`.

## Why Adaptive Evidence Budget matters

A live 5-minute Aurora smoke test approved 21 Sources and produced 123 full-source Evidence candidates. The Evidence runtime profile showed about 16m47s of measured stage wall time and 29 calls/executions. The run proved research depth, but it also exposed a real production bottleneck: all 123 candidates should not automatically consume Gemini review, human review, and downstream context.

Tital now separates:

```text
broad research corpus
→ Candidate Evidence Pool
→ Adaptive Evidence Budget
→ active production Evidence
→ AI review assistance
→ human decision
```

Current 5-minute baseline: **24 active Evidence target**. The deterministic selector uses film duration, Research Question priority, full-source grounding, Evidence strength, source diversity, and lightweight duplicate reduction. Non-promoted Evidence is retained as archived research.

The live persisted Aurora test verified:

```text
123 research Evidence candidates
→ 24 active for review
→ 99 archived and preserved
→ 21 human-approved / 3 human-rejected
→ 21/21 active Evidence source branches full-source grounded with Parallel web_fetch
```

This is the intended product message:

> **Tital does not minimize scientific knowledge. It minimizes unnecessary human attention and downstream computation while preserving traceable research.**

Important honesty boundary: V1 still full-fetches/extracts approved Sources before global compaction, so Tital does not claim an exact API-cost percentage saving yet. Source caching and coverage-aware early stopping are future optimization layers.

## Why stage-aware review matters

The same live Aurora production later reached a Script gate and exposed a second product lesson: human-review assistance should not stop after research. Scientific risk can appear while transforming approved Evidence into Claims, Claims into narration, or narration into cinematic representation.

Tital therefore applies the same collaboration contract across the whole pipeline, but with different rubrics:

```text
Claim → is the approved Evidence actually sufficient?
Script → did narration preserve Claim support, uncertainty, audience fit, and pacing?
Scene → does the scene faithfully cover approved Script without misleading visual framing?
Shot → do camera and representation choices preserve scientific constraints?
Visual → are category, disclosure, risk and the approved Shot coherent?
```

This is **not** automatic self-approval by the generator. The Review Evaluator has a clean task/context boundary and returns advisory metadata only. Human status is unchanged until the director acts.

Because every extra model pass has cost, the feature remains optional. A director can use it heavily for high-risk science or complex revisions and skip it where manual review is enough.

## Findings and learnings

### 1. Human review must change control flow

Early versions could regenerate rejected branches under new IDs. Rejected records are now terminal history; replacement is explicit.

### 2. AI can help human review without replacing human authority

Real users pointed out that reviewing dozens of Sources/Evidence items manually does not scale. Tital first added independent AI triage there, then live Script testing showed that semantic review is valuable throughout the chain. The evaluator is now stage-aware from Film Brief through Visual Decision while explicit human action remains required to change trusted state.

### 3. Research breadth and production Evidence volume are different

The 123-Evidence Aurora smoke test showed that “more Evidence” can simultaneously increase knowledge and make the application slower/more expensive/harder to review. Tital now preserves broad research but budgets the active production subset.

### 4. Full-source grounding must be distinct from discovery

Search excerpts are useful for selecting Sources, but new Evidence requires exact approved-URL `web_fetch`. Tital labels this as grounding, not independent proof of scientific truth.

### 5. Finished productions are iterative

A director may change duration or regret an approved Source/Shot after a package is complete. Tital calculates revision impact, invalidates only affected dependencies, repairs selectively, offers optional stage-aware review of repaired candidates, re-audits, and creates a new version rather than forcing a new project.

### 6. Models should not echo trusted opaque IDs

Live reference drift led Tital to move parent/provenance mapping into deterministic code and use numbered semantic references where selection is necessary.

### 7. Creative direction needs explicit precedence

```text
scientific evidence / uncertainty / visual-integrity constraints
> approved production constraints
> human director guidance
> AI cinematic preference
```

### 8. Production latency must be measured and hardened, not guessed

Tital added bounded concurrency and timing traces. Live full-source smoke testing exposed two distinct 429 conditions: transient Vertex rate limiting and Cloud Run HTTP request starvation. They were fixed separately with Evidence-specific conservative concurrency/retry and greater HTTP serving capacity. Optional stage-aware review is user-triggered specifically so this additional quality layer does not silently double every stage's cost.

### 9. Public demo state should be detached from private live state

The anonymous demo is a sanitized read-only snapshot, not a public window into an authenticated user's mutable session.

## Hosted project

`https://tital-o7za4b3w5q-ts.a.run.app/`

Public visitors can explore a completed read-only demo. Live creation/review/revision is Firebase-authenticated.

## Verified runtime evidence

Earlier authenticated Aurora E2E evidence is stored under:

- `docs/submission/e2e-gemini-35-smoke-test/gemini-35-e2e-report.md`
- `docs/submission/e2e-gemini-35-smoke-test/selected/`

Verified facts from that run include Gemini 3.5 Flash / Vertex AI / Google ADK runtime, successful continuation after a provider spend-cap blocker was resolved, `READY_FOR_PRODUCTION`, zero deterministic governance/provenance audit issues, and persisted completed state.

The newer `Aurora Grounding Test` is a separate feedback-driven production smoke test used to validate full-source retrieval, stage-aware AI review assistance, Evidence volume/cost behavior, rate-limit resilience, and the revision/version lifecycle.

## Repository and reproducibility

Repository: `https://github.com/amin076/tital`

The root `README.md` includes local/runtime setup. CI performs dependency install, core/web typecheck, deterministic tests, production build, and enabled main-branch Cloud Run deployment with post-deploy `/api/health` verification.

## Demo-video emphasis

Do not spend most of the demo showing a repetitive sequence of “generate → approve.” The stronger differentiators are:

1. Source/Evidence AI Review Assistant focusing human attention;
2. full-source grounding proof;
3. Adaptive Evidence Budget showing broad research vs compact active review;
4. show that the **same stage-aware AI reviewer appears at Script/Shot/Visual gates** and evaluates different risks;
5. Evidence → Claim → Shot provenance;
6. `READY_FOR_PRODUCTION` separate Final AI Review;
7. revoke/change one trusted decision → impact preview → selective repair → v2.

## Submission claims that are safe

- Tital is a working hosted Cloud Run application.
- Runtime uses Gemini 3.5 Flash on Vertex AI through Google ADK.
- Tital uses Parallel MCP for source discovery and full-source retrieval in Evidence extraction.
- Human review remains authoritative even when Gemini supplies stage-aware review recommendations.
- Tital can optionally review pending artifacts from Film Brief through Visual Decision using stage-specific rubrics and approved upstream context.
- Tital persists provenance/state rather than relying on chat memory.
- Tital compacts a broad Evidence pool into a duration/priority-aware active review subset while preserving archived candidates.
- Tital supports governed revision, selective repair, re-audit, and package version history.
- Tital measures runtime stages/calls and has explicit rate-limit/serving-capacity resilience.

## Claims to avoid

Do **not** claim:

- that AI review replaces human approval;
- that the reviewer independently proves scientific truth;
- that stage-aware review is free or automatically runs at every stage;
- that the deterministic audit proves scientific truth;
- that `web_fetch` is equivalent to peer review or independent source verification;
- that archived Evidence is approved production Evidence;
- an exact cost/performance percentage without controlled comparable runs;
- that Adaptive Evidence Budget already eliminates every approved-Source fetch/extraction call;
- that Tital renders the final film;
- autonomous background operation beyond the implemented request/session workflow;
- prize/eligibility facts that require personal self-attestation.
