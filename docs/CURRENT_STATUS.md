# Tital Current Status

Status date: **2026-08-17**

Tital is a working **evidence-governed scientific film director** with a hosted Cloud Run path, durable Cloud Storage sessions, Firebase-authenticated live workflow, public landing/demo shell, and a human-reviewed provenance chain from scientific idea to production package.

Core principle:

> **Evidence → Story, not Story → Evidence.**

Implemented chain:

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

## Trust boundary

The application, not the model, owns trusted IDs, statuses, provenance links, approval transitions, session ownership, workflow eligibility, audit execution, and final package construction.

The hardened model-reference rule is now:

```text
model sees numbered approved inputs
→ model returns numbered references
→ application maps numbers to trusted IDs
```

This is used for Claim → Evidence references, Script Line → Claim references, Scene → Script Line references, and Shot → scene-local Script Line references. Evidence extraction and Visual Decision generation already attach trusted parent IDs entirely in application code.

See [AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md](AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md).

## Implemented / validated areas

| Area | Status | Notes |
|---|---|---|
| TypeScript / Node.js core | Implemented | Domain, services, orchestration, API and persistence. |
| Google ADK + Gemini / Vertex AI | Implemented and live-validated | Specialized proposal-generating agents. |
| Parallel Search MCP | Implemented and live-validated | Hosted source discovery works; malformed individual candidates are discarded instead of failing an otherwise valid batch. |
| React / Vite / MUI web UI | Implemented and live-validated | Human review and workflow progression. |
| Production Node server | Implemented and live-validated | Serves React build and `/api/*` from one process. |
| Cloud Run | Deployed and live-validated | Hosted in `australia-southeast1`. |
| Cloud Storage persistence | Implemented and live-validated | Sessions survive Cloud Run revision replacement. |
| Firebase Email/Password auth | Implemented and live-validated | Browser login plus backend ID-token verification. |
| User session isolation | Implemented | Hosted user sessions are namespaced by Firebase `uid`. |
| Public landing/demo shell | Implemented | Demo is enabled only when a curated `TITAL_DEMO_SESSION_ID` is configured. |
| Human review gates | Implemented and live-validated | No silent model approval. |
| Rejection recovery | Implemented and live-validated | Rejected history persists; missing approved coverage can regenerate. |
| Governance/provenance audit | Implemented | Deterministic integrity checks, not independent scientific truth verification. |
| Production package + exports | Implemented and live-validated | JSON, readable text, styled browser PDF workflow. |
| GitHub Actions workflow | Added, configuration pending | CI/build/deploy workflow exists; WIF/deployer IAM still must be configured and validated. |

## Live validation history

### Europa

First complete persisted backend/CLI run with real Gemini/Vertex AI and Parallel MCP.

### Black-hole film

Complete web-UI run through `READY_FOR_PRODUCTION`, including traceability and final report. This run exposed model-echoed parent-ID defects for Shot `sceneId` and Visual Decision `shotId`; application code now owns those IDs.

### Hosted Lorestan project

The Cloud Run/Firebase/GCS deployment is being exercised with a real project about Lorestan history. The hosted run validated authentication, user-scoped persisted sessions, Parallel MCP, Evidence, Claims, Script and later-stage progression.

It also exposed two important reliability defects:

1. one Parallel source candidate had an empty `title`, causing the whole source batch to fail;
2. a Shot proposal returned a ScriptLine ID not present in its approved Scene.

Both defect classes now have architectural fixes:

```text
partial provider batch → validate/drop malformed candidate, preserve valid candidates
trusted model references → numbered references mapped by application code
```

Every reproducible live failure should become a deterministic regression test.

## Hosted architecture

```text
Browser
  ↓
Cloud Run: tital
  ├─ React production UI
  └─ Node /api
       ↓
Firebase ID-token verification
       ↓
user-scoped session store
       ↓
Cloud Storage
       ↓
Vertex AI / Gemini + Parallel MCP when required
```

The Cloud Run service is still being hardened before final anonymous network access. During development it can remain private and be reached through `gcloud run services proxy`.

See [DEPLOYMENT_AND_OPERATIONS.md](DEPLOYMENT_AND_OPERATIONS.md).

## Persistence

Local development:

```text
.tital/sessions/<session-id>.json
```

Hosted base layout:

```text
gs://<bucket>/<prefix>/<session-id>.json
```

Authenticated user layout:

```text
gs://<bucket>/<prefix>/users/<firebase-uid>/<session-id>.json
```

Current limitation: no optimistic locking/session-version precondition yet. Conservative Cloud Run concurrency remains appropriate until concurrent-update protection is implemented.

## Authentication

Public web configuration is supplied by `/api/public/config`. Firebase signs in the user and the client sends an ID token to protected API routes. Backend verification uses Firebase Admin `verifyIdToken()` and the decoded `uid` determines the session namespace.

Authentication does not rely on hiding the Firebase Web configuration. Service-account keys, access/refresh tokens, judge passwords and other true secrets must never be committed or exposed to browser code.

## Source verification limit

Parallel MCP discovers public-web sources and preserves excerpts/metadata. Tital does **not yet** perform dedicated full-content retrieval for every approved source before evidence extraction. Source discovery and full scientific verification remain distinct capabilities.

Approved-source full-content verification remains the next major scientific-quality milestone after public deployment hardening.

## Audit scope

Current deterministic audit checks governance/provenance integrity such as broken links, unapproved upstream records, unsupported provenance, visual-category mismatch and required disclosure conditions.

It does **not** independently establish scientific truth or authority.

High-value future semantic rules include:

```text
UNCERTAINTY_DROPPED
SCIENTIFIC_CONSTRAINT_VIOLATION
proposition-aware unsupported-claim detection
source-authority/citation correctness evaluation
```

## Current release blockers before public Hackathon access

```text
complete local validation after numbered-reference refactor
→ hosted Shot/Visual continuation retest
→ complete one hosted project to READY_FOR_PRODUCTION
→ configure curated public demo
→ configure and validate GitHub Actions Workload Identity Federation
→ anonymous protected-route denial test
→ authenticated judge account smoke test
→ final public Cloud Run access switch
→ final security/cost/rollback smoke test
```

The detailed failure/release checklist is in [AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md](AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md).

## Current major limitations

- no dedicated full-source retrieval/verification stage;
- no optimistic locking for concurrent session writes;
- no full edit/regenerate/downstream-staleness UI;
- no generalized schema-version migration framework beyond targeted legacy normalization;
- scientific audit remains primarily deterministic governance/provenance validation;
- final film rendering is outside Tital's current product boundary.

## Validation commands

```bash
npm run typecheck
npm test
npm run build
```

These are required before deployment. Live Vertex/Parallel checks remain deliberate because they can consume quota/credits.
