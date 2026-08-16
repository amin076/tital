# Tital Roadmap

Status date: **2026-08-17**

This roadmap starts from the repository state after PR #10, where the governed React web UI, final production-package view, workflow coverage display, traceability, and readable exports are implemented and live-validated.

For implementation truth, see [CURRENT_STATUS.md](CURRENT_STATUS.md).

## Completed foundation

Tital has completed two important product milestones.

### Governed end-to-end workflow core

Implemented and live-validated:

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
→ COMPLETE
```

### Governed web UI

Implemented and live-validated:

```text
create persisted project
open/list sessions
inspect current stage and blockers
approve/reject selected records
continue / recover missing approved coverage
see workflow progress and coverage
inspect readable records
trace approved provenance chain
inspect final package
export JSON
export readable text
print/save styled PDF
```

The Black-hole web run completed the full workflow and produced a final package and styled PDF report.

---

## Priority 0 — documentation truth reset

Status: **in progress in `docs/post-mvp-status`**

Repository documentation must describe the product that now exists, not the pre-UI CLI state.

Update:

```text
README.md
docs/CURRENT_STATUS.md
docs/ROADMAP.md
docs/PROJECT_HANDOFF.md
docs/architecture/system-architecture.md
docs/architecture/workflow-architecture.md
```

Record the Black-hole UI validation and clearly separate:

```text
scientific truth verification
from
governance/provenance integrity verification
```

This is a small prerequisite, not the next major product feature.

---

## Priority 1 — Cloud Deployment Foundation

This is the next major engineering milestone.

### Goal

Make the existing governed product accessible as a hosted application without weakening the current trust boundaries.

Target outcome:

```text
public hosted Tital URL
        ↓
hosted React UI
        ↓
hosted Node API
        ↓
existing application/session services
        ↓
durable cloud session store
        ↓
Gemini / Vertex AI
+ Parallel MCP
```

### Work items

1. Define a production runtime contract for the Node API.
2. Add health/readiness behavior suitable for deployment.
3. Containerize or otherwise package the current Node + web application for the selected Google Cloud path.
4. Add environment/secrets handling appropriate for deployed Vertex AI and partner integrations.
5. Introduce a session-store interface without changing workflow semantics.
6. Add a cloud-durable implementation while keeping `JsonMvpSessionStore` for local development/tests.
7. Deploy a first non-production hosted environment.
8. Run one complete hosted E2E project with real Gemini and Parallel MCP.
9. Capture deployment/runtime evidence for hackathon submission.

### Non-goals for this milestone

Do not expand into:

```text
billing
enterprise authentication
large multi-tenant architecture
complex permissions
video rendering
mobile apps
```

The goal is a reliable judge-testable hosted vertical slice.

---

## Priority 2 — Full-source verification before Evidence

Current source discovery uses Parallel Search MCP and preserves search excerpts/provider provenance. Evidence extraction currently works from approved `SourceRecord` excerpts.

Strengthen the workflow to separate discovery from verification:

```text
Research Question
→ Parallel web_search
→ SourceRecord DISCOVERED
→ human source approval
→ controlled source-content retrieval / web_fetch
→ validated retrieved source content
→ Evidence Extraction Agent
→ EvidenceRecord REVIEW_REQUIRED
```

### Design requirements

- Fetch only approved sources.
- Preserve retrieval provenance and timestamp.
- Do not store unnecessary full copyrighted documents.
- Prefer extractive, evidence-bearing content needed by the approved research question.
- Preserve the original source URL and provider provenance.
- Make retrieval failure visible rather than silently falling back to invented content.
- Keep human evidence review explicit.

### Likely source metadata additions

Evaluate a minimal set such as:

```text
sourceType
publisher / institution
authors when available
DOI when available
primary / secondary classification
retrieval provenance
```

Avoid building a large academic ontology before the concrete verification workflow needs it.

---

## Priority 3 — Edit / Regenerate / Staleness

The current UI is excellent for review and progression but does not yet support a complete editing lifecycle after approved upstream content changes.

Desired behavior:

```text
approved Evidence / Claim / Script / Scene changes
→ determine dependent downstream records
→ mark affected records stale
→ invalidate prior audit/package
→ regenerate only affected coverage
→ require human review again
```

Start with deterministic dependency invalidation. Do not introduce a large graph platform unless simple provenance relationships prove insufficient.

Useful first cases:

1. Replace an approved Claim.
2. Edit/regenerate one ScriptLine.
3. Regenerate one Scene or Shot.
4. Show exactly which downstream records became stale.
5. Preserve old versions/history rather than silently overwriting trusted decisions.

---

## Priority 4 — Scientific governance expansion

The current deterministic audit correctly checks implemented governance rules, but it is not a scientific truth engine.

High-value next rules:

```text
UNCERTAINTY_DROPPED
SCIENTIFIC_CONSTRAINT_VIOLATION
```

### `UNCERTAINTY_DROPPED`

Must be proposition-aware. A downstream statement should not be required to copy every upstream caveat if the caveat is irrelevant to the proposition being made.

### `SCIENTIFIC_CONSTRAINT_VIOLATION`

Should detect meaningful weakening or contradiction of approved shot/visual constraints, not merely string inequality.

Keep the audit deterministic wherever a rule can be expressed deterministically. Use model assistance only where semantic interpretation is truly required, and keep any model-based audit result behind explicit labeling/validation.

---

## Priority 5 — persistence hardening and reviewer identity

After the first hosted vertical slice is stable, strengthen project persistence and review accountability.

Candidate capabilities:

```text
schema/session versioning
formal migrations
project ownership
reviewer identity
review timestamps / rationale
optimistic locking
transactional state + event updates
backup/export/import
```

Do not treat authenticated identity as cryptographic scientific endorsement. Keep the distinction between "who approved" and "scientifically true" explicit.

---

## Priority 6 — scientific-status / contradiction model

The long-term product vision benefits from richer epistemic status such as:

```text
observation
measurement
experiment
theoretical prediction
model-dependent inference
strong inference
consensus
debate
hypothesis
analogy
```

This should be designed only after stronger source retrieval and editing/staleness workflows exist, because the ontology will affect schemas, migrations, audit rules, UI, and production exports.

---

## Priority 7 — Hackathon deployment and submission hardening

Before final submission:

1. Host the application on the selected Google Cloud path.
2. Verify deployed Gemini / Vertex AI behavior.
3. Verify deployed Parallel MCP behavior.
4. Run and record a hosted end-to-end scientific-film project.
5. Keep provenance and human review visible in the demo.
6. Prepare a short demo narrative around one strong scientific example.
7. Capture the differentiator: **"Why are we saying or showing this?"**
8. Keep the distinction between governance audit and independent scientific peer review explicit.
9. Finalize repository documentation and reproducible run instructions.
10. Prepare submission text, screenshots, architecture diagram, and demo video.

---

## Explicitly deferred

Unless required to prove the core product, do not prioritize:

```text
large video-generation stack
3D editor
mobile apps
billing
advanced multi-tenancy
custom foundation models
large knowledge-graph infrastructure
many decorative agents
general-purpose production-management suite
```

Tital's advantage is not the number of agents. It is the governed chain from scientific evidence to film decisions.

## Guiding question

For every roadmap item ask:

> Does this make it easier for a filmmaker to transform scientific evidence into a scientifically defensible film decision while preserving traceability?

If not, it is probably not a near-term Tital priority.
