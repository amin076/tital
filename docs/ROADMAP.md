# Tital Roadmap

Status date: **2026-08-22**

Tital has moved beyond the local-only governed MVP. `main` now includes Cloud Run deployment, Cloud Storage persistence, Firebase-authenticated live workflow, a published detached public demo, GitHub Actions/WIF deployment, Director controls, explicit replacement recovery, downstream stale-record invalidation, and All Things Agentic packaging.

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

## Completed — Public authenticated Hackathon release

Implemented and anonymously browser-validated.

Target experience:

```text
anonymous visitor
→ public Tital landing
→ completed read-only demo

authorized judge
→ Firebase sign-in
→ live create/review/continue workflow
```

Delivered:

1. public Cloud Run landing page;
2. detached, sanitized Dinosaur demo at `COMPLETE / READY_FOR_PRODUCTION`;
3. Firebase-protected live workspace and per-user Cloud Storage namespaces;
4. anonymous public-demo access without anonymous mutation access;
5. conservative Cloud Run cost/concurrency controls;
6. revision-surviving persistence;
7. public runtime model/framework/revision/release proof.

Release gate: [AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md](AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md).

---

## Completed — GitHub Actions deployment automation

Workflow file exists:

```text
.github/workflows/ci-deploy-cloud-run.yml
```

Validated Google Cloud/GitHub path:

```text
GitHub OIDC
→ Google Workload Identity Federation
→ dedicated tital-deployer service account
→ least-privilege source deployment roles
→ Service Account User on tital-runtime
→ Cloud Run source deploy after validation
→ post-deploy `/api/health` release verification
```

Do not use a long-lived Google service-account JSON key for the preferred CI/CD design.

Automatic `main` deployment uses WIF and a dedicated deploy identity. The workflow now asserts that the deployed model, agent framework, Cloud Run runtime, and release SHA match the intended submission release.

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

## Priority 4 — General edit UX on top of implemented staleness

The deterministic invalidation foundation is implemented: changed trusted upstream records can mark dependent downstream records `STALE`, invalidate audit/package state, and keep stale records out of active review coverage. The remaining roadmap item is a complete user-facing edit/version workflow:

```text
approved upstream record changes
→ dependent downstream records become stale
→ audit/package invalidated
→ regenerate only affected coverage
→ require human review again
```

Preserve old history rather than silently overwriting trusted decisions. Add explicit edit commands, conflict-safe persistence, version comparison, and human re-review on top of the existing invalidation service.

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
