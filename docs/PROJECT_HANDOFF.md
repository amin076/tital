# Tital Project Handoff

Status date: **2026-08-22**

Repository: `https://github.com/amin076/tital`

Hosted application: `https://tital-o7za4b3w5q-ts.a.run.app/`

Google Cloud project: `scientific-film-director-agent`

Current release goal: **All Things Agentic Hackathon — Collaborative Partner**

## Product definition

**Tital — Evidence-Governed Scientific Film Director**

> **Evidence → Story, not Story → Evidence.**

Tital turns a scientific question into a human-governed production package while preserving evidence, uncertainty, provenance, cinematic intent, and human decisions from research through scenes, shots, and visual decisions.

Tital plans the film; it does not render the final video.

## Verified product state

The public site and detached Dinosaur demo were browser-validated without login on 2026-08-22.

```text
What Really Killed the Dinosaurs?
COMPLETE
READY_FOR_PRODUCTION
Governance & provenance audit: passed with 0 issues
```

Public package counts:

```text
Research Questions  5
Sources             15
Evidence            24
Claims              13
Script Lines        11
Scenes               5
Shots                9
Visual Decisions     9
```

The authenticated Director Workspace supports project creation, persisted sessions, review gates, replacement retry, explicit coverage waivers, a Director Brief, performance insights, public-demo promotion, and final package export.

## Governed record chain

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

Trust boundary:

```text
Gemini / tool proposes semantic content
→ Zod/domain validation
→ application assigns trusted identity/provenance/status
→ human review
→ deterministic coverage evaluation
→ next governed stage
```

Models never approve their own work and do not own trusted IDs. Numbered semantic references are mapped back to approved application IDs.

## All Things Agentic stack

Mandatory stack:

```text
Gemini 3.5 Flash (`gemini-3.5-flash`)
Google ADK TypeScript
Vertex AI
Google Cloud Run
```

Additional production services:

```text
Google Cloud Storage
Firebase Authentication / Firebase Admin
Parallel Search MCP
GitHub Actions + Google Workload Identity Federation
```

The model is centralized in `src/config/models.ts`. A compliance regression test prevents agent files from drifting back to Gemini 2.5.

## Collaborative Partner implementation

Every generative stage stops at a human review boundary.

Project-level `DirectorBrief`:

```text
collaborationMode
pacing
cameraMovement
representationPreference
visualStyle
notes
avoid[]
```

Review actions:

```text
Approve
Reject
Reject & try another + scoped instruction
Remember selected feedback for later cinematic proposals
Reject & continue with an explicit CoverageWaiver when allowed
```

`DirectorFeedback` is project-scoped and requires explicit opt-in in the retry dialog. Remembered feedback is shown in the Context rail and applied to later Scene, Shot, and Visual Decision proposals. One-off feedback remains scoped when memory is not selected. Public-demo promotion clears this human-authored memory.

Scientific precedence remains:

```text
science / provenance / uncertainty / visual-integrity constraints
> approved production constraints
> Director Brief + explicitly remembered feedback
> AI cinematic preference
```

## Hosted architecture

```text
Browser
→ Cloud Run `tital`
   ├─ React / Vite / MUI UI
   └─ Node `/api/*`
        ├─ Firebase ID-token verification
        ├─ governed session orchestrator
        ├─ Google ADK → Gemini 3.5 Flash / Vertex AI
        ├─ Parallel Search MCP
        └─ Cloud Storage session persistence
```

Anonymous visitors can use only the deliberate public surfaces. Live session routes require Firebase authentication and use per-user Cloud Storage prefixes.

The public demo is a detached snapshot. It is not a direct view of an authenticated mutable session.

## Deployment proof and CI

`.github/workflows/ci-deploy-cloud-run.yml` performs:

```text
npm ci
→ core + web typecheck
→ deterministic tests
→ production build
→ GitHub OIDC / Google WIF
→ Cloud Run source deployment
→ `/api/health` release verification
```

The public runtime manifest reports only non-secret proof:

```text
Gemini model
Vertex AI platform
Google ADK framework
Cloud Run service/revision
release commit SHA
generic persistence label
```

CI rejects a deployment whose health response does not match `gemini-3.5-flash`, Google ADK, Cloud Run, and the triggering commit SHA. Private bucket paths are not returned.

## Deterministic validation result

Validated locally on 2026-08-22:

```text
core TypeScript typecheck     PASS
web TypeScript typecheck      PASS
Vitest                        48 files / 228 tests PASS
Vite production build         PASS
server TypeScript build       PASS
```

Canonical command:

```bash
npm run verify:submission
```

Live Vertex/Parallel calls are deliberately separate because they consume external quota/credits.

## Submission kit

`docs/hackathon/all-things-agentic/` contains:

- `SUBMISSION.md` — copy-ready Devpost narrative;
- `COMPLIANCE.md` — requirement/evidence matrix and go/no-go list;
- `ARCHITECTURE.md` — annotated architecture;
- `architecture.svg` — uploadable static diagram;
- `DEMO_SCRIPT.md` — timed 3:40–3:55 recording script;
- `BONUS_CONTENT.md` — optional public article/social drafts;
- `README.md` — kit index.

## Work still requiring live/human execution

Repository work cannot truthfully mark these complete before the deployed release exists and the entrant performs the actions:

1. merge the final-readiness branch after CI passes;
2. confirm the main deployment and new `/api/health` release SHA;
3. sign in to the production workspace and run a small Gemini 3.5 flow through FilmBrief, Research Questions, Parallel discovery, and at least one downstream structured-output stage;
4. record and upload the <=4-minute demo with Cloud Run/Vertex proof;
5. complete personal/legal Devpost attestations;
6. submit and re-check every public URL.

## Current limitations that must remain explicit

- Parallel source discovery is not dedicated full-document verification;
- the deterministic audit checks governance/provenance integrity, not scientific truth;
- session mutation does not yet use optimistic locking, so Cloud Run request concurrency is conservative;
- feedback memory is project-scoped; reusable cross-project Director Profiles are not implemented;
- general post-approval edit/version-comparison UX remains incomplete, although deterministic downstream `STALE` invalidation exists;
- Tital produces a production package rather than the final film.

## Rules to preserve

1. Models propose; deterministic application services govern trusted state.
2. Human review must change control flow, not merely label output.
3. Rejected content remains history and is never silently regenerated.
4. Feedback becomes reusable only through explicit human choice.
5. Scientific constraints outrank creative preference.
6. Fail closed rather than guessing provenance or science.
7. Keep live claims narrower than verified evidence.
8. Convert reproducible live failures into regression tests.
9. Keep credentials, private bucket paths, tokens, and personal review data out of public proof surfaces.
10. Keep live Vertex/Parallel tests deliberate and cost-aware.
