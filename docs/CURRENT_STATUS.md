# Tital Current Status

Status date: **2026-08-22**

Tital is a working, hosted **Evidence-Governed Scientific Film Director** with a public completed demo, an authenticated Director Workspace, persistent Cloud Storage state, Google ADK agents, human review gates, evidence-to-visual provenance, a deterministic governance/provenance audit, and a final production package.

Core principle:

> **Evidence → Story, not Story → Evidence.**

## Current submission stack

| Area | Current state |
|---|---|
| LLM | `gemini-3.5-flash` centralized in `src/config/models.ts`; deterministic compliance coverage is green and a live post-deploy semantic smoke flow remains required before final submission |
| Agent framework | Google ADK TypeScript |
| Model access | Vertex AI |
| Hosted application | Google Cloud Run |
| Persistent state | Google Cloud Storage |
| Authentication | Firebase Email/Password + Firebase Admin ID-token verification |
| Source discovery | Parallel Search MCP |
| Front end | React 19 + Vite + Material UI |
| Validation | Zod + deterministic application-owned provenance mapping |
| CI/CD | GitHub Actions + Google Workload Identity Federation + Cloud Run deployment + post-deploy model/revision/release verification |

## Implemented workflow

```text
FilmBrief
→ ResearchQuestion
→ SourceRecord
→ EvidenceRecord
→ ClaimRecord
→ ScriptLineRecord
→ SceneRecord
→ ShotRecord
→ VisualDecisionRecord
→ Governance / provenance audit
→ ProductionPackage
```

Every generative transition is bounded by human review. Models do not own approval status, trusted record identity, or provenance links.

## Human collaboration

Tital's Director Brief persists:

```text
collaborationMode
pacing
cameraMovement
representationPreference
visualStyle
notes
avoid[]
```

The review workflow supports:

```text
Approve
Reject
Reject & try another + scoped replacement instruction
Explicitly remember selected feedback for later cinematic proposals
Retry / Waive / Cancel when a required coverage gap is created
```

Rejected work remains history and is not silently regenerated. Intentional omissions remain visible as `CoverageWaiver` records. A retry instruction is reused downstream only when the director selects the memory option; remembered instructions are persisted as project-scoped `DirectorFeedback` records and are visible in the Context rail.

Scientific precedence is explicit:

```text
science / provenance / uncertainty / visual-integrity constraints
> approved production constraints
> director guidance
> AI cinematic preference
```

## Trusted-reference hardening

Where a model must refer to upstream data, Tital prefers numbered semantic references and maps them to trusted application IDs after validation.

```text
model sees numbered approved inputs
→ model returns numbered references
→ deterministic service maps numbers to trusted IDs
```

This avoids asking a model to reproduce opaque UUID-like identifiers and prevents reference drift from becoming trusted state.

## Public demo

The public Dinosaur demo is **implemented, published, and anonymously browser-validated**.

Project:

**What Really Killed the Dinosaurs?**

Status:

```text
COMPLETE
READY_FOR_PRODUCTION
```

Approved package counts:

- 5 Research Questions;
- 15 Sources;
- 24 Evidence records;
- 13 Claims;
- 11 Scientific Script lines;
- 5 Scenes;
- 9 Shots;
- 9 Visual Decisions.

The demo is a detached read-only snapshot created from a completed production package. It does not expose the authenticated user's mutable private session or private event history.

## Director Workspace

The authenticated application uses a three-zone production workspace on wide screens:

```text
Project navigation
│
├─ focused current work / human review
│
└─ contextual rail
   ├─ current stage
   ├─ Director Brief
   ├─ Director Feedback Memory
   └─ Runtime Performance Insights
```

The New Project form no longer dominates an existing project session, and raw event history is progressively disclosed rather than occupying the primary task surface.

## Performance status

Tital now uses bounded concurrency for independent external calls **inside an already-authorized stage**, while preserving true workflow and human-review dependencies.

Default external concurrency remains `3` until controlled `3` vs `4` benchmark runs justify a change.

The first hosted Sky baseline recorded approximately:

```text
measured Continue-stage wall time   2m29s
external calls                      39
external-call failures              0
aggregate external-work overlap     2.28×
```

The overlap ratio is:

```text
sum(external-call durations) / measured wall time
```

and is **not** presented as a before/after speedup claim.

Benchmark V2 now also records:

- FilmBrief project-creation timing for new sessions;
- external vs internal measured work;
- Parallel agent/MCP roundtrip vs SourceRecord normalization;
- configured concurrency limit;
- unique measured stage count vs execution count.

See `docs/PERFORMANCE.md` and `docs/PERFORMANCE_BENCHMARK_V2.md`.

## Governance and staleness

The current trust model includes:

- application-owned IDs and provenance;
- rejection history;
- explicit replacement retry;
- explicit coverage waivers;
- duplicate-resistant targeted retry;
- `STALE` lifecycle support and deterministic downstream invalidation foundation;
- audit invalidation when governed state changes;
- production-package invalidation when trusted dependencies become stale.

## Audit scope

The final human-facing result is correctly described as a **Governance & provenance audit**.

It checks deterministic integrity conditions such as:

- broken provenance links;
- unapproved upstream records entering the trusted chain;
- visual-category consistency;
- required disclosure conditions.

It does **not** independently establish scientific truth, source authority, or expert peer-review quality.

High-value future semantic checks include:

```text
UNCERTAINTY_DROPPED
SCIENTIFIC_CONSTRAINT_VIOLATION
proposition-aware unsupported-claim detection
source-authority / citation evaluation
```

## Current scientific-quality boundary

Parallel Search MCP discovers public-web sources and preserves source metadata/excerpts, but Tital does not yet perform dedicated full-document retrieval and independent verification for every approved source.

```text
source discovery ≠ full source verification
```

This limitation must remain explicit in submission materials.

## All Things Agentic readiness

Prepared in `docs/hackathon/all-things-agentic/`:

- Collaborative Partner submission narrative;
- mandatory technology/compliance matrix;
- architecture diagram and architecture explanation;
- reproducible spin-up documentation;
- timed ~4-minute demo script;
- optional bonus social/blog drafts.

Submission hardening now also includes:

- public safe runtime metadata for model, framework, Cloud Run revision, and release SHA;
- a CI post-deploy health assertion that the deployed release uses `gemini-3.5-flash`, Google ADK, Cloud Run, and the triggering commit;
- project-scoped Director Feedback Memory with explicit user opt-in;
- deterministic regression coverage for runtime metadata, feedback persistence/scope, and public-demo sanitization.

Final human actions still required:

1. run a small signed-in production smoke flow proving structured output and Parallel MCP compatibility on Gemini 3.5 Flash;
2. record/upload the demo video with visible Google Cloud proof;
3. complete personal/legal Devpost eligibility fields;
4. submit and re-check all URLs before the deadline.

Final-readiness PR #29 and main workflow #61 passed on 2026-08-22. The Cloud Run deployment and its exact model/framework/infrastructure/release assertion completed successfully; the public landing then reported `gemini-3.5-flash`, Google ADK, Vertex AI, Cloud Run revision `tital-00028-dqn`, and code release `f667387`.

## Current major limits

- dedicated approved-source full-content verification is not yet implemented;
- optimistic locking for concurrent session mutation is not yet implemented;
- Cloud Run request concurrency therefore remains conservative;
- reusable cross-project Director Profiles are not yet implemented;
- advanced cinematic lock/version comparison remains roadmap work;
- the semantic scientific-consistency audit remains incomplete;
- Tital produces a governed production package rather than rendering the final film.

## Validation commands

Every merge/deploy must pass:

```bash
npm run verify:submission
```

Current local deterministic result on 2026-08-22: **48 test files / 228 tests passed**, core and web typechecks passed, and both web and server production builds succeeded.

Live Vertex/Parallel calls are performed deliberately because they consume external quota/credits.
