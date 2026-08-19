# Tital Project Handoff

Status date: **2026-08-17**

Tital is now beyond the local-only MVP. The current active branch `feat/public-authenticated-tital` contains the governed web UI, Cloud Run deployment foundation, Cloud Storage persistence, Firebase-authenticated live workflow, public landing/demo shell, GitHub Actions deployment workflow, and reliability hardening discovered through hosted end-to-end use.

For implementation truth, use this document together with:

- [CURRENT_STATUS.md](CURRENT_STATUS.md)
- [AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md](AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md)
- [DEPLOYMENT_AND_OPERATIONS.md](DEPLOYMENT_AND_OPERATIONS.md)
- [ROADMAP.md](ROADMAP.md)

## Product definition

**Tital — Evidence-Governed Scientific Film Director**

Core principle:

> **Evidence → Story, not Story → Evidence.**

North Star:

> A filmmaker should be able to ask, “Why are we saying or showing this?” and receive a traceable scientific answer.

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

## Current trust boundary

```text
Model/tool proposes
→ deterministic service validates
→ application maps numbered references to trusted IDs
→ application assigns trusted identity/provenance/status
→ human review
→ deterministic workflow eligibility
```

The application owns trusted IDs, provenance links, statuses, approvals, session ownership, audit and final package construction.

Do not ask models to echo opaque UUID-like IDs when deterministic numbering can express their semantic selection.

Current numbered-reference mappings:

```text
Claim        evidenceNumbers   → EvidenceRecord IDs
Script Line  claimNumbers      → ClaimRecord IDs
Scene        scriptLineNumbers → ScriptLineRecord IDs
Shot         scriptLineNumbers → Scene-local ScriptLineRecord IDs
```

Single-parent trusted IDs such as `sourceId`, `filmBriefId`, `sceneId`, and `shotId` are assigned by application code.

## Current hosted architecture

```text
Browser
→ Cloud Run `tital`
   ├─ React/Vite/MUI production UI
   └─ Node API `/api/*`
        ↓
   Firebase ID-token verification
        ↓
   user-scoped MvpSessionStore
        ↓
   Google Cloud Storage
        ↓
   Vertex AI / Gemini
   Parallel Search MCP
```

Current project/region used by the validated deployment:

```text
project: scientific-film-director-agent
Cloud Run region: australia-southeast1
Vertex location: global
```

Runtime credentials use the Cloud Run service identity rather than a service-account JSON key.

## Authentication

Firebase Email/Password is enabled. The browser signs in, obtains an ID token, and sends it to protected API routes. The backend verifies it with Firebase Admin and uses decoded `uid` to scope session persistence.

Target public experience:

```text
anonymous visitor → landing + completed read-only demo
authorized judge  → sign in → full live governed workflow
```

Final anonymous Cloud Run network access should be enabled only after the public release checklist passes.

## Persistence

Local:

```text
.tital/sessions/<session-id>.json
```

Hosted:

```text
gs://<bucket>/<prefix>/...
```

Authenticated user sessions:

```text
gs://<bucket>/<prefix>/users/<firebase-uid>/<session-id>.json
```

Cloud persistence has been verified across a Cloud Run revision replacement.

Current limitation: optimistic locking/version preconditions are not yet implemented, so conservative concurrency is intentional during hardening.

## Parallel MCP reliability hardening

A hosted Lorestan run exposed a real malformed candidate with an empty source title. The old all-or-nothing parser aborted the full batch.

Current behavior:

```text
validate envelope
→ validate each source candidate
→ discard malformed candidates with warning
→ keep valid candidates
→ fail if no valid candidate remains
```

Tital never fabricates missing provider metadata to make a candidate pass.

## Trusted-reference incident hardening

Live runs exposed several cases where Gemini was asked to copy trusted IDs exactly:

- Shot `sceneId` mismatch;
- Visual Decision `shotId` mismatch;
- Shot ScriptLine reference not present in approved Scene.

The architecture now avoids model-owned trusted references. A repo-wide audit identified the same class of risk in Claim, Script and Scene proposals; these stages have been refactored to numbered upstream references mapped by application code.

See the full incident/failure matrix in [AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md](AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md).

## Other implemented reliability fixes

- semantic-null Evidence uncertainty values rejected for new records;
- legacy evidence uncertainty migration on load;
- evidence prompt hardened against proxy evidence being presented as direct confirmation;
- MEDIUM/HIGH Visual Decision disclosure fallback;
- application-owned Shot `sceneId` and Visual Decision `shotId`;
- source candidate partial-batch resilience;
- Firebase ID-token verification corrected to standard backend verification path with diagnostic logging;
- numbered-reference trust pattern extended across downstream multi-parent generation stages.

## Live validation history

### Europa

First complete persisted backend/CLI run using real Gemini/Vertex and Parallel MCP.

### Black-hole film

Complete web-UI run through `READY_FOR_PRODUCTION`, including traceability and final report.

### Lorestan hosted run

Real Cloud Run/Firebase/GCS workflow exercise. It validated hosted authentication, persistence and multi-stage progression and exposed the source-candidate and Shot-reference reliability defects described above.

The Lorestan run is still useful as an active hosted reliability test until it reaches final package.

## Deployment workflow

Manual source deployment is currently available with `gcloud run deploy --source .`.

A repository workflow now exists:

```text
.github/workflows/ci-deploy-cloud-run.yml
```

Intended flow:

```text
PR/push
→ npm ci
→ typecheck
→ tests
→ production build
→ GitHub OIDC / Google Workload Identity Federation
→ Cloud Run source deploy
```

WIF and the dedicated deploy service-account IAM configuration still need to be completed and validated. Do not use a long-lived service-account JSON key for the preferred CI/CD path.

## Current release blockers

Before public Hackathon access:

```text
pull latest numbered-reference refactor
→ local typecheck/tests/build green
→ hosted continuation through Shots/Visuals
→ one hosted session reaches READY_FOR_PRODUCTION
→ curated demo configured
→ WIF/GitHub Actions deployment validated
→ anonymous protected API denial verified
→ judge login/live workflow verified
→ rollback/revision persistence check
→ public Cloud Run access enabled
→ final security/cost smoke test
```

## Important product limitations

- source discovery is not yet full-source scientific verification;
- no optimistic locking for concurrent session mutation;
- no complete edit/regenerate/downstream-staleness lifecycle;
- deterministic audit is governance/provenance integrity, not independent scientific truth verification;
- Tital produces a governed production package rather than rendering the final video.

## Immediate priorities

1. Validate the numbered-reference refactor locally and in the hosted Lorestan run.
2. Complete hosted workflow to final package.
3. Configure GitHub Actions WIF deployment.
4. Configure curated public demo and public judge access.
5. Then implement approved-source full-content verification.
6. Then edit/regenerate/staleness and deeper scientific-governance checks.

## Development rules to preserve

1. Models propose; deterministic services govern trusted state.
2. Never let model output approve itself.
3. Never use model output as the source of truth for opaque application IDs.
4. Prefer numbered semantic references and deterministic ID mapping.
5. Fail closed when recovery would require guessing provenance or science.
6. Preserve rejected records as history.
7. Progress by approved provenance-connected coverage, not raw counts.
8. Keep JSON canonical for machines and readable views for humans.
9. Turn reproducible live failures into regression tests.
10. Keep live Vertex/Parallel tests deliberate and cost-aware.
