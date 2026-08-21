# All Things Agentic Hackathon — Tital Submission Draft

Status: **submission package prepared; live Gemini 3.5 Flash smoke test and demo-video recording still require human/browser execution**

## Category

**The Collaborative Partner**

Tital is designed around an explicit collaboration loop: the agent proposes scientifically grounded work, the human director reviews it, and the workflow adapts to approvals, rejections, targeted replacement instructions, intentional gaps, and a persistent Director Brief.

## Project name

**Tital — Evidence-Governed Scientific Film Director**

## One-line pitch

Tital turns a scientific question into a human-governed, evidence-traceable film production package, from research and claims through script, scenes, shots, and visual decisions.

## Short description

Scientific filmmaking has a structural trust problem: research, narration, and cinematic choices are often produced in separate tools, so it becomes difficult to answer a simple question — **why are we saying or showing this?**

Tital is an agentic scientific-film directing workspace that carries provenance through the whole production-planning chain. Google ADK agents powered by Gemini 3.5 Flash propose research questions, evidence interpretations, claims, narration, scenes, shots, and visual decisions. Parallel Search MCP performs source discovery. Deterministic application services validate structured outputs, own trusted IDs and provenance, and stop at explicit human review gates before downstream work can advance.

The result is a `ProductionPackage` in which an evaluator can trace a final visual decision backwards through Shot → Scene → Script Line → Claim → Evidence → Source. Human rejection is terminal unless the director explicitly requests a replacement, and intentional omissions remain visible as governance history rather than being silently regenerated.

## Problem

Scientific-film teams need both creative freedom and scientific accountability. Generic AI chat and video tools can produce compelling text or imagery, but they rarely preserve the evidence chain behind every cinematic decision, uncertainty statement, and reconstruction. They also tend to blur model suggestions with approved production decisions.

Tital addresses that gap by making the workflow itself evidence-governed and human-gated.

## What the agent actually does

1. Converts a scientific-film idea plus production controls into a structured Film Brief.
2. Proposes research questions that must be answered before the story advances.
3. Uses a Google ADK source agent with Parallel Search MCP to discover relevant public sources.
4. Extracts evidence from approved source excerpts.
5. Generates scientific claims only from approved evidence.
6. Converts approved claims into film-ready scientific script lines.
7. Proposes scenes, shots, and visual decisions while applying the persistent Director Brief.
8. Stops at human review gates. The director can approve, reject, or explicitly request a replacement with scoped feedback.
9. Tracks coverage and intentional waivers instead of silently regenerating rejected content.
10. Runs a deterministic governance/provenance audit and releases a production package only when the governed chain is complete.

## Collaborative Partner fit

Tital is not a one-shot generator. Human feedback changes what the workflow is allowed to carry forward.

- **Director Brief:** collaboration mode, pacing, camera behaviour, representation preference, visual language, notes, and explicit `avoid[]` constraints persist with the project.
- **Human gates:** every generative stage pauses for review.
- **Targeted adaptation:** `Reject & try another` can include a scoped instruction such as “use authentic observation footage rather than a scientific reconstruction.”
- **Coverage-aware decisions:** a rejection that would leave a required branch empty requires an explicit retry or an intentional waiver.
- **No silent override:** evidence and scientific visual-integrity constraints outrank creative preferences.

## Key features

- Evidence → Story provenance chain.
- Human-gated, multi-stage agentic workflow.
- Gemini 3.5 Flash through Google ADK / Vertex AI.
- Parallel Search MCP source discovery.
- Persistent authenticated projects on Google Cloud Storage.
- Firebase authentication and per-user namespaces.
- Director Brief and scoped replacement instructions.
- Deterministic Zod validation and application-owned trusted provenance.
- Rejection history, duplicate-resistant retry, explicit coverage waivers.
- Downstream `STALE` invalidation foundation for revised upstream records.
- Governance/provenance audit before package release.
- JSON, text, and print/PDF production-package exports.
- Public, detached, read-only completed demo.
- Runtime Performance Insights with measured stage/call timing and bounded-concurrency metadata.
- GitHub Actions CI/CD using Workload Identity Federation and Cloud Run deployment.

## Technologies used

### Google

- **Gemini 3.5 Flash** — `gemini-3.5-flash`
- **Google Agent Development Kit (ADK), TypeScript**
- **Vertex AI**
- **Google Cloud Run**
- **Google Cloud Storage**
- **Firebase Authentication / Firebase Admin**
- **Google Cloud Workload Identity Federation** for keyless GitHub Actions deployment

### Application

- TypeScript
- Node.js
- React 19
- Vite
- Material UI
- Zod
- Vitest

### External data/tool source

- **Parallel Search MCP** for public-web source discovery. Tital stores provider provenance and validates candidates before they can become governed SourceRecords.

## Architecture highlights

Tital deliberately separates semantic generation from trusted application state:

```text
Gemini / tool proposes semantic content
→ Zod/domain validation
→ application assigns trusted identity + provenance + status
→ human review
→ deterministic coverage evaluation
→ next governed stage
```

This prevents a model from approving itself, inventing trusted record IDs, or silently moving rejected work into the production chain.

Hosted topology:

```text
React Director Workspace
        ↓
Node API on Cloud Run
        ↓
Governed session/orchestration services
   ↙             ↓              ↘
Firebase       Google ADK      Cloud Storage
Auth           + Gemini 3.5    persistence
                 ↓
          Parallel Search MCP
                 ↓
      deterministic audit/package
```

See `ARCHITECTURE.md` and `architecture.svg` in this submission folder.

## Findings and learnings

### 1. Human review must change control flow, not just label output

A rejection initially allowed a missing branch to regenerate semantically similar content under a new ID. Tital now treats rejected content as terminal history. Replacement generation requires an explicit human decision.

### 2. Models should not echo opaque trusted IDs

Live end-to-end tests exposed one-character UUID/reference drift. Tital moved trusted parent IDs and provenance mapping into deterministic application code and uses numbered semantic references when a model must refer to supplied evidence or claims.

### 3. Creative direction needs a formal precedence model

Scientific evidence does not dictate one cinematic style. Tital therefore allows strong director control, but the precedence remains:

```text
scientific evidence / uncertainty / visual-integrity constraints
> approved production constraints
> human director guidance
> AI cinematic preference
```

### 4. Agent latency should be measured before it is optimized

Tital originally serialized independent external calls inside a stage. Bounded concurrency now overlaps them while preserving stage dependencies and output order. Performance Insights reports measured wall time and external-call overlap without presenting that ratio as an unsupported before/after speedup claim.

### 5. A production demo should not expose a private user session

The public completed demo is a detached sanitized snapshot built from the approved production package, not a direct view into an authenticated user's mutable session namespace.

## Hosted project

`https://tital-o7za4b3w5q-ts.a.run.app/`

Public visitors can explore the completed read-only dinosaur demo without authentication. Live project creation/review is protected by Firebase authentication.

## Repository

`https://github.com/amin076/tital`

## Reproducibility

The root `README.md` contains local and production-like spin-up instructions. CI runs dependency installation, TypeScript validation, deterministic tests, and a production build before deployment.

## Demo video

Use the exact recording plan in `DEMO_SCRIPT.md`. Target duration: **3:40–3:55**, leaving margin under the requested ~4-minute format.

## Architecture diagram

Use `architecture.svg` for the Devpost architecture-diagram field and `ARCHITECTURE.md` for the annotated explanation.

## Submission claims that are safe to make

- Tital is a working hosted application on Cloud Run.
- Tital uses Google ADK and Gemini 3.5 Flash after the compliance migration is live-smoke-tested.
- Tital uses Parallel Search MCP for source discovery.
- Tital has explicit human review gates and persistent project state.
- Tital produces a traceable governed production package.
- Tital's public demo is detached/read-only.
- Tital measures runtime stage/call timing and bounded concurrency.

## Claims to avoid

Do **not** claim:

- that the governance audit independently proves scientific truth;
- that Tital creates or renders the final film;
- a before/after performance percentage without controlled comparable runs;
- that every discovered source has undergone full-document verification;
- autonomous background operation beyond the implemented request/session workflow;
- any prize-specific eligibility that has not been self-attested in Devpost.
