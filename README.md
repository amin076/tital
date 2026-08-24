# Tital — Evidence-Governed Scientific Film Director

**Tital turns a scientific question into a human-governed, evidence-traceable, revisable film production package — from research and claims through script, scenes, shots, and visual decisions.**

> **Evidence → Story, not Story → Evidence.**

Hosted application: **https://tital-o7za4b3w5q-ts.a.run.app/**

Tital is not a generic research chatbot and it is not a final-video generator. It is a production-control workspace for scientific filmmaking: AI handles research and proposal volume, application code owns trusted state and provenance, and the human director owns approval and revision decisions.

## Why Tital exists

A scientific-film team should be able to answer:

> **Why are we saying or showing this, what evidence supports it, and what changes if we revise it?**

Tital keeps that answer connected across:

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

A normal AI chat can generate many of these artifacts. Tital's value is the governed system around them: persisted state, source/evidence provenance, independent stage-aware AI review assistance, explicit human gates, revision impact analysis, selective repair, final-package review, version history, and deterministic audit/package rules.

## Current production workflow

```text
DEFINE
→ RESEARCH
→ SOURCE REVIEW
→ FULL-SOURCE EVIDENCE
→ ADAPTIVE EVIDENCE BUDGET
→ EVIDENCE REVIEW
→ CLAIMS
→ SCRIPT
→ SCENES
→ SHOTS
→ VISUAL DECISIONS
→ AUDIT
→ PACKAGE
→ FINAL AI + HUMAN REVIEW
→ GOVERNED REVISION / SELECTIVE REPAIR
→ RE-AUDIT
→ VERSIONED PACKAGE
```

Every generative stage stops at a human decision boundary. AI recommendations never become trusted approvals by themselves.

## Stage-aware AI-assisted human review

Every active human gate can optionally invoke an independent Gemini Review Evaluator:

```text
FilmBrief
ResearchQuestion
Source
Evidence
Claim
Script
Scene
Shot
Visual Decision
```

The reviewer is **stage-aware**. It receives the candidate plus only the relevant approved upstream context and project controls required for that review. Examples:

- Source: relevance, visible authority signals, duplication, usefulness;
- Evidence: full-source support, overstatement, uncertainty, contradiction;
- Claim: Evidence support, confidence, scope, unsupported precision;
- Script: approved-Claim fidelity, uncertainty, audience fit, pacing, unsupported additions;
- Scene: Script coverage, narrative purpose, pacing, Director Brief consistency;
- Shot: Scene/Script fidelity, camera choice, scientific constraints, visual-integrity category;
- Visual Decision: Shot fidelity, disclosure, risk, observation-vs-reconstruction integrity;
- Film Brief / Research Questions: project fit, scope, duration, audience, redundancy, and research usefulness.

The evaluator returns advisory metadata:

```text
APPROVE_SUGGESTED
REJECT_SUGGESTED
REVIEW_REQUIRED

attention: LOW | MEDIUM | HIGH
confidence
reasons[]
risks[]
flags[]
```

The assistant may select checkboxes for convenience, but only an explicit human action changes trusted status.

```text
AI recommendation ≠ human approval
```

AI review is **optional and user-triggered** rather than automatically adding another Gemini call at every stage. This preserves human agency and lets productions balance review depth against API cost and latency. Evidence has one extra safeguard: Adaptive Evidence Budget is applied before Evidence review so broad research does not become an unbounded AI/human review queue.

This lets Tital scale human judgment without replacing it.

## Full-source evidence grounding

Source discovery uses Parallel Search MCP `web_search`. After a human approves a SourceRecord, the Evidence Extraction Agent must call Parallel `web_fetch` on the **exact approved URL** before creating new EvidenceRecords.

```text
Parallel web_search
→ SourceRecord DISCOVERED
→ human source approval
→ Parallel web_fetch exact approved URL
→ Evidence extraction
→ grounding metadata
→ governed Evidence review
```

New full-source Evidence records carry application-visible grounding metadata including `PARALLEL_WEB_FETCH`, the source URL, provider, fetch timestamp, and an explicit marker that the discovery excerpt was not used as the evidence basis.

This is **full-source retrieval/grounding**, not an independent guarantee that every scientific statement is true. Human review and the governance/provenance audit remain distinct from scientific peer review.

## Adaptive Evidence Budget

A live 5-minute Aurora smoke test exposed an important production problem: 21 approved sources produced 123 full-source Evidence candidates and about 16m47s of measured Evidence-stage work. Broad research was useful, but sending all 123 items into AI review, human review, Claims, and Script would waste attention, latency, and model context.

Tital therefore separates **research breadth** from **production evidence volume**:

```text
Broad research corpus
→ Candidate Evidence Pool
→ Adaptive Evidence Budget
→ Active Production Evidence
→ AI Review Assistant
→ Human Decision
→ downstream production chain
```

Version 1 of the controller:

- asks each full-source extraction for a compact set of the strongest, distinct propositions and caps production output at 3 Evidence candidates per Source;
- derives an automatic active Evidence target from film duration and active Research Question count;
- allocates more capacity to higher-priority Research Questions;
- favors full-source grounding, Evidence strength, source diversity, and non-duplicate information;
- preserves non-promoted material as `ARCHIVED_CANDIDATE` rather than deleting it;
- sends only the active subset into AI-assisted human review and the trusted downstream chain.

Current automatic target baseline:

| Film duration | Active Evidence target |
|---|---:|
| up to 3 min | 12 |
| up to 5 min | 24 |
| up to 10 min | 36 |
| up to 20 min | 54 |
| up to 30 min | 72 |
| longer | scales gradually, capped at 120 in the current policy |

The controller also preserves at least two target slots per active Research Question when the candidate pool can support them.

This policy is intentionally transparent and revisable. It is not a claim that a fixed number of sources proves a scientific topic sufficiently.

### What the current budget does and does not save

It **does** reduce:

- per-source Evidence output volume;
- Gemini review context at the Evidence gate;
- human review workload;
- redundant downstream Claim/Script context;
- repeated processing of low-value duplicate propositions.

The current v1 still performs full-source retrieval/extraction for approved Sources before compaction. Future cost work can add source-content caching, coverage-aware early stopping, source prioritization, and user-selectable research-depth modes without weakening provenance.

See [Adaptive Evidence Budget](./docs/ADAPTIVE_EVIDENCE_BUDGET.md).

## Governed revision and version history

`READY_FOR_PRODUCTION` is a milestone, not a dead end. A director can reopen a completed production and request a scoped revision such as:

- change film duration;
- revoke/replace a previously approved Source;
- revise a Claim;
- revise a Shot;
- revise a Visual Decision.

Before applying the change, Tital previews dependency impact. Applying a revision preserves old records and marks only affected downstream work `STALE`. Selective repair regenerates the affected branch, then human review, re-audit, and package rebuilding are required.

```text
ProductionPackage v1
→ revision request
→ impact preview
→ affected records STALE
→ selective repair
→ optional stage-aware AI review of repaired candidates
→ human re-review
→ re-audit
→ ProductionPackage v2
```

Package versions and change summaries remain inspectable rather than silently overwriting history.

## Final Production AI Review

After a package reaches `READY_FOR_PRODUCTION`, a separate independent Gemini review can inspect the **whole completed production** for cross-stage semantic risks such as scientific fidelity, uncertainty handling, audience fit, narrative/pacing issues, visual-integrity concerns, and conflicts with the Director Brief.

This is distinct from the per-gate Review Evaluator. Per-gate review helps a human decide about current candidates; Final Production Review looks across the completed package. Findings remain advisory. The human director chooses whether to create a governed revision from them.

## Core governance contract

```text
model/tool proposes semantic content
→ schema/domain validation
→ application maps trusted identity + provenance + status
→ optional stage-aware AI review assistance
→ human decision
→ deterministic coverage evaluation
→ next governed stage
```

Important invariants:

- models never approve their own output;
- application code owns trusted IDs and parent/provenance mapping;
- AI review metadata cannot change trusted review status;
- rejected records remain history and are not silently regenerated;
- `ARCHIVED_CANDIDATE` Evidence remains research history but is not production-approved evidence;
- explicit retry is scoped and duplicate-resistant;
- intentional omissions use explicit `CoverageWaiver` records;
- governed revisions preserve old records and invalidate only affected descendants;
- audit/package construction is deterministic application code;
- public demo snapshots do not expose private project memory/history.

## Agent architecture

Tital uses specialized Google ADK TypeScript agents inside the deterministic workflow:

| Agent | Governed responsibility |
|---|---|
| Define Agent | project idea/controls → FilmBrief proposal |
| Research Question Agent | approved FilmBrief → research questions |
| Source Discovery Agent | approved RQ → Parallel `web_search` source candidates |
| Evidence Extraction Agent | approved Source → exact-URL Parallel `web_fetch` → compact Evidence proposals |
| Review Evaluator | any active human-gate candidate → stage-aware advisory attention/recommendation data |
| Claim Agent | approved active Evidence → Claims |
| Scientific Script Agent | approved Claims → Script Lines |
| Scene Director Agent | approved Script + Director Brief → Scenes |
| Shot Director Agent | approved Scene/Script + constraints → Shots |
| Visual Decision Agent | approved Shot → visual treatment/disclosure/risk |
| Production Review Agent | completed package → advisory final findings |

The governance/provenance audit, coverage policy, adaptive Evidence compaction, revision impact calculation, staleness, trusted ID mapping, package versioning, and package construction are application services rather than model authority.

## Director control

A persistent `DirectorBrief` carries:

```text
collaborationMode
pacing
cameraMovement
representationPreference
visualStyle
notes
avoid[]
```

The director can approve, reject, request a replacement with a scoped instruction, invoke AI review assistance at any active gate, explicitly remember selected feedback for later cinematic proposals, intentionally waive supported coverage gaps, and revise a completed production.

Precedence remains:

```text
scientific evidence / uncertainty / visual-integrity constraints
> approved production constraints
> human director guidance
> AI cinematic preference
```

## Hosted stack

- Gemini 3.5 Flash — `gemini-3.5-flash`
- Google Agent Development Kit (ADK), TypeScript
- Vertex AI
- Google Cloud Run
- Google Cloud Storage
- Firebase Authentication / Firebase Admin
- GitHub Actions + Workload Identity Federation
- Parallel Search MCP (`web_search` + `web_fetch`)
- TypeScript / Node.js / React 19 / Vite / Material UI / Zod / Vitest

Hosted user sessions are persisted in user-specific Cloud Storage namespaces selected after Firebase ID-token verification.

## Performance and resilience

Tital measures stage wall time and individual external operations. Independent external work uses bounded concurrency while true workflow/human dependencies remain sequential.

General external concurrency defaults to:

```text
TITAL_EXTERNAL_CONCURRENCY=3
```

Full-source Evidence extraction is intentionally gentler:

```text
TITAL_EVIDENCE_CONCURRENCY=1
```

because every approved Source now requires a Gemini turn plus Parallel `web_fetch`.

Stage-aware AI review is intentionally on-demand. A director can request it where the value of a second semantic pass justifies the extra model call; Tital does not automatically double every generation step.

Transient Vertex/ADK rate limits use bounded retry/backoff; billing/auth/safety/schema/provenance failures are not blindly retried. Cloud Run serving concurrency is separate from model concurrency so long agent calls do not need to starve UI/health traffic.

See [Performance Investigation](./docs/PERFORMANCE.md).

## Public completed demo

A detached read-only completed demo is available without authentication. Live project creation/review is protected by Firebase authentication. Public snapshots are sanitized and do not expose the authenticated user's mutable session or project-scoped feedback memory.

## Reproducible local setup

Prerequisites:

- Node.js / npm;
- Google Cloud project with Vertex AI access for live calls;
- `gcloud` for local Application Default Credentials;
- internet access for Parallel MCP.

Install:

```bash
git clone https://github.com/amin076/tital.git
cd tital
npm ci
```

Configure live Google runtime:

```text
GOOGLE_CLOUD_PROJECT=YOUR_GCP_PROJECT_ID
GOOGLE_CLOUD_LOCATION=global
GOOGLE_GENAI_USE_VERTEXAI=true
TITAL_EXTERNAL_CONCURRENCY=3
TITAL_EVIDENCE_CONCURRENCY=1
```

Authenticate:

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project YOUR_GCP_PROJECT_ID
```

Validate without live model calls:

```bash
npm run verify:submission
```

Local development:

```bash
npm run api:dev
npm run web:dev
```

Production-like local run:

```bash
npm run build
npm start
```

## CI/CD

`.github/workflows/ci-deploy-cloud-run.yml` runs:

```text
npm ci
→ typecheck
→ deterministic tests
→ production build
→ GitHub OIDC / Workload Identity Federation
→ Cloud Run source deploy on enabled main pushes
→ /api/health assertion for model/framework/infrastructure/release SHA
```

Recent production smoke testing also led to two separate 429 hardening changes: transient Vertex Evidence calls now retry conservatively, while Cloud Run has enough HTTP serving capacity to continue serving UI/read traffic during long agent operations.

## Audit scope and scientific boundary

The deterministic audit checks governance/provenance integrity: approved-chain links, stale/unapproved upstream records, representation/disclosure rules, and package readiness. It does **not** independently prove scientific truth, source authority, or expert peer-review quality.

Likewise, `web_fetch` grounds Evidence in the approved source content, but source selection and scientific interpretation still require review. Tital intentionally separates discovery, grounding, AI evaluation, human judgment, and structural audit.

## Documentation

- [Current status](./docs/CURRENT_STATUS.md)
- [System architecture](./docs/architecture/system-architecture.md)
- [Agent architecture](./docs/architecture/agent-architecture.md)
- [Workflow architecture](./docs/architecture/workflow-architecture.md)
- [Adaptive Evidence Budget](./docs/ADAPTIVE_EVIDENCE_BUDGET.md)
- [Performance](./docs/PERFORMANCE.md)
- [Roadmap](./docs/ROADMAP.md)
- [Director control](./docs/DIRECTOR_CONTROL.md)
- [Failure scenarios and resilience](./docs/AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md)
- [All Things Agentic submission kit](./docs/hackathon/all-things-agentic/README.md)

## Hackathon positioning

The product claim is not “Tital generates more AI output than a chat.” The stronger claim is:

> **Tital scales human judgment without giving AI the authority to replace it.**

and:

> **Tital keeps broad scientific research available while controlling how much evidence consumes human attention and downstream computation.**

Stage-aware review strengthens that story: the same human-authority pattern now applies from project definition through scientific claims and cinematic decisions, while the director chooses when a second Gemini review is worth its cost.

This is the difference between a sequence of prompts and a governed production system.

## License

Apache-2.0. See [`LICENSE`](./LICENSE).
