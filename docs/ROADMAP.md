# Tital Roadmap

Status date: **2026-08-17**

Tital has moved beyond the local-only governed MVP. Cloud Run deployment, Cloud Storage persistence, Firebase-authenticated live workflow, public landing/demo shell, and a GitHub Actions deployment workflow are now implemented on `feat/public-authenticated-tital`, with final public-release hardening still in progress.

For implementation truth, see [CURRENT_STATUS.md](CURRENT_STATUS.md).

## Completed foundations

### Governed workflow core

```text
film idea
→ FilmBrief
→ Research Questions
→ Parallel source discovery
→ Evidence
→ Claims
→ Script
→ Scenes
→ Shots
→ Visual Decisions
→ deterministic governance/provenance audit
→ Production Package
```

### Governed web UI

Create/list/open projects, human review, rejection recovery, coverage/progress, provenance traceability, final package and JSON/text/PDF outputs are implemented.

### Cloud deployment foundation

Implemented and live-validated:

```text
Cloud Run single-service UI/API
Cloud Storage durable session store
revision-surviving persistence
Vertex AI / Gemini in hosted runtime
Parallel MCP in hosted runtime
Firebase Email/Password sign-in
backend ID-token verification
per-user session namespace
public landing/demo shell
```

### Reliability hardening from live runs

Implemented or actively being validated:

- semantic-null Evidence uncertainty handling;
- legacy session migration;
- Visual Decision disclosure fallback;
- application-owned Shot `sceneId` and Visual Decision `shotId`;
- malformed Parallel candidate discard without losing the valid batch;
- numbered model references mapped to trusted IDs for Claim, Script, Scene and Shot stages.

See [AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md](AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md).

---

## Priority 1 — Public authenticated Hackathon release

Current highest priority.

Target experience:

```text
anonymous visitor
→ public Tital landing
→ completed read-only demo

authorized judge
→ Firebase sign-in
→ live create/review/continue workflow
```

Release tasks:

1. Pull and locally validate the trusted-reference refactor (`typecheck`, tests, build).
2. Continue the hosted Lorestan run through Shots, Visual Decisions, audit and final package.
3. Confirm no remaining model-owned opaque parent-ID references exist in the governed chain.
4. Configure a curated completed `TITAL_DEMO_SESSION_ID`.
5. Verify anonymous protected API calls are denied while demo endpoints remain usable.
6. Verify judge login, user-scoped sessions and live Vertex/Parallel operations.
7. Enable public Cloud Run network access only after application auth boundaries pass.
8. Set conservative cost controls / instance limits for judging.
9. Verify rollback/revision persistence.

Release gate: [AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md](AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md).

---

## Priority 2 — GitHub Actions deployment automation

Workflow file exists:

```text
.github/workflows/ci-deploy-cloud-run.yml
```

Finish Google Cloud/GitHub setup:

```text
GitHub OIDC
→ Google Workload Identity Federation
→ dedicated tital-deployer service account
→ least-privilege source deployment roles
→ Service Account User on tital-runtime
→ Cloud Run source deploy after validation
```

Do not use a long-lived Google service-account JSON key for the preferred CI/CD design.

Validate both automatic `main` deployment and manual workflow dispatch. Document rollback and failed-build behavior.

See [DEPLOYMENT_AND_OPERATIONS.md](DEPLOYMENT_AND_OPERATIONS.md).

---

## Priority 3 — Full-source verification before Evidence

Current Parallel discovery preserves search excerpts/provider provenance, but Evidence extraction does not yet retrieve and verify dedicated full content for every approved source.

Target:

```text
Research Question
→ Parallel web_search
→ SourceRecord DISCOVERED
→ human source approval
→ controlled approved-source retrieval / web_fetch
→ retrieval provenance + bounded evidence-bearing content
→ Evidence Extraction Agent
→ EvidenceRecord REVIEW_REQUIRED
```

Requirements:

- fetch only approved sources;
- preserve source/retrieval provenance and timestamp;
- surface retrieval failure instead of inventing evidence;
- avoid unnecessary storage of copyrighted full documents;
- support source type/publisher/authors/DOI metadata only where useful;
- keep human evidence review explicit.

---

## Priority 4 — Edit / Regenerate / Staleness

Desired behavior:

```text
approved upstream record changes
→ dependent downstream records become stale
→ audit/package invalidated
→ regenerate only affected coverage
→ require human review again
```

Start with deterministic dependency invalidation for Claim, Script Line, Scene and Shot edits. Preserve old history rather than silently overwriting trusted decisions.

---

## Priority 5 — Persistence concurrency and reviewer accountability

Cloud Storage persistence is implemented, but production hardening still needs:

```text
session version / optimistic locking
conflict response for concurrent Continue/review
formal schema/session versioning
broader migrations
reviewer identity in review events
review rationale/timestamps
backup/export/import policy
```

Authentication identifies the reviewer but must never be presented as proof that approved science is true.

---

## Priority 6 — Scientific governance expansion

High-value semantic checks:

```text
UNCERTAINTY_DROPPED
SCIENTIFIC_CONSTRAINT_VIOLATION
proposition-aware unsupported-claim detection
citation/source-authority evaluation
```

Keep checks deterministic where possible. If semantic model assistance is introduced, label it explicitly and keep it separate from deterministic governance integrity.

---

## Priority 7 — Scientific-status / contradiction model

Longer-term epistemic categories may include observation, measurement, experiment, theoretical prediction, model-dependent inference, consensus, debate, hypothesis and analogy.

Do this after source retrieval and edit/staleness mature because it affects schemas, migrations, audit and UI.

---

## Priority 8 — Submission hardening

Before final Hackathon submission:

1. Public judge-testable URL.
2. Completed curated demo available immediately.
3. Judge credentials and instructions tested.
4. Hosted live workflow verified.
5. GitHub Actions deployment reproducible.
6. Architecture/error-handling/security docs current.
7. Demo narrative emphasizes: **“Why are we saying or showing this?”**
8. Show evidence-to-shot provenance and human review clearly.
9. Keep governance audit distinct from independent scientific peer review.
10. Capture screenshots, architecture diagram and short demo video.

## Explicitly deferred

Unless needed to prove the core value, do not prioritize a large video-generation stack, 3D editor, mobile apps, billing, custom foundation models, large graph infrastructure, or decorative extra agents.

Tital's advantage is the governed evidence-to-film chain, not the number of agents.
