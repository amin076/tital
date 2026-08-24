# Agent Architecture

Status date: **2026-08-24**

Tital uses Google Agent Development Kit (ADK) `LlmAgent` instances as specialized proposal/evaluation workers inside a deterministic application workflow. Agents do not own trusted workflow state. They generate structured scientific/creative proposals or advisory review findings; application services validate, map provenance, assign trusted identity/status, and place eligible work behind human authority.

## Implemented agent roles

| Agent / role | Main responsibility | External tool use |
|---|---|---|
| `defineAgent` | raw idea + project controls → FilmBrief proposal | Gemini |
| `researchQuestionAgent` | approved FilmBrief → Research Questions | Gemini |
| `parallelSourceAgent` | discover public-web sources | Gemini + Parallel `web_search` |
| `evidenceExtractionAgent` | approved exact Source URL → compact full-source Evidence proposals | Gemini + Parallel `web_fetch` |
| Review Evaluator | independently evaluate any current human-gate candidate with a stage-specific rubric | Gemini |
| `claimGenerationAgent` | approved active Evidence → Claims | Gemini |
| `scientificScriptAgent` | approved Claims → Script Lines | Gemini |
| `sceneDirectorAgent` | approved Script + director context → Scenes | Gemini |
| `shotDirectorAgent` | approved Scene/Script + constraints → Shots | Gemini |
| `visualDecisionAgent` | approved Shot → governed visual treatment | Gemini |
| Final Production Reviewer | completed package → advisory cross-stage findings | Gemini |

The following are **not** model authority:

```text
trusted IDs / parent mapping
record statuses
Adaptive Evidence Budget
human review decisions
coverage rules / waivers
revision impact / STALE propagation
scientific governance/provenance audit
ProductionPackage construction
package version history
```

Those remain deterministic application responsibilities.

## Core trust rule

```text
Model proposes or evaluates.
Application validates.
Application owns identity/provenance/status.
Human owns approval and revision decisions.
Workflow progresses only when deterministic rules allow it.
```

An AI reviewer is therefore not a second approver. Its output is advisory metadata such as recommendation, confidence, risks, flags, and human-attention level.

## Numbered-reference design

When a model must select from trusted upstream records, Tital avoids asking it to reproduce opaque UUID-like IDs.

```text
trusted approved records
→ application sends #1, #2, #3
→ model returns numbered references
→ deterministic range check
→ application maps numbers back to trusted IDs
```

Current mappings include:

```text
Claim        evidenceNumbers   → EvidenceRecord IDs
Script Line  claimNumbers      → ClaimRecord IDs
Scene        scriptLineNumbers → ScriptLineRecord IDs
Shot         scriptLineNumbers → scene-local ScriptLineRecord IDs
```

Single-parent identity such as `sourceId`, `sceneId`, or `shotId` is attached by application code when possible.

## Full-source Evidence Agent

The Evidence Extraction Agent has a stricter tool contract than ordinary semantic generation:

1. receive one approved Source title/URL plus its approved Research Question;
2. call Parallel `web_fetch` for the **exact approved URL**;
3. use fetched content, not discovery snippets or model memory, as the Evidence basis;
4. fail rather than fabricate when usable content cannot be retrieved;
5. return a compact set of strongest, distinct, production-relevant propositions;
6. preserve uncertainty/inference boundaries;
7. application code caps the result to 3 Evidence candidates per Source and adds grounding provenance.

This changes the previous scientific boundary: Evidence is now full-source grounded for new production extractions. It does **not** mean the model independently certifies scientific truth.

## Adaptive Evidence Budget is deliberately not another agent

After extraction, a deterministic controller manages the difference between research breadth and human production review.

```text
full-source Evidence candidates
→ duration/RQ-priority budget
→ strength + grounding + source diversity + duplicate-reduction heuristic
→ REVIEW_REQUIRED promoted subset
→ ARCHIVED_CANDIDATE preserved remainder
```

Why deterministic?

- the budget must not give a model hidden authority to suppress science;
- results must be reproducible for the same persisted candidate pool;
- archive vs active-review status is an application workflow decision;
- the full candidate records remain available for later product expansion.

See [../ADAPTIVE_EVIDENCE_BUDGET.md](../ADAPTIVE_EVIDENCE_BUDGET.md).

## Stage-aware AI Review Evaluator

The Review Evaluator can be invoked at **every active human-review gate**:

```text
FilmBrief
ResearchQuestion
SourceRecord
EvidenceRecord
ClaimRecord
ScriptLineRecord
SceneRecord
ShotRecord
VisualDecisionRecord
```

The same agent role is reused, but the rubric and supplied context are stage-specific. This avoids multiplying reviewer agents merely to increase an agent count while still creating clean evaluation boundaries.

### Context boundary

The evaluator does not receive generator hidden reasoning. Application code supplies only the candidate, relevant approved upstream content, and project/director controls needed for the current review.

Examples:

```text
Claim candidate
→ supporting approved Evidence (+ Source grounding context)

Script candidate
→ supporting approved Claims → their Evidence
→ target audience / knowledge level / duration / tone

Scene candidate
→ supporting approved Script
→ Director Brief

Shot candidate
→ approved Scene + Script
→ camera / representation controls
→ scientific constraint + visual-integrity category

Visual candidate
→ approved Shot
→ representation category / disclosure / risk / Director Brief
```

This lets Gemini evaluate whether a downstream candidate faithfully transforms its approved upstream record rather than merely judging prose in isolation.

### Stage rubrics

- **FilmBrief:** raw-project fit, scope, duration, audience, communication objective, research practicality.
- **ResearchQuestion:** relevance, overlap, scope, uncertainty framing, usefulness for evidence-backed story construction.
- **Source:** relevance, visible authority/primary-source signals, duplication, promotional/weak-source risk.
- **Evidence:** support by full-source-grounded material, uncertainty, overstatement, contradiction, duplication.
- **Claim:** approved-Evidence support, confidence, uncertainty, unsupported precision/causality, scope/audience relevance.
- **Script:** approved-Claim fidelity, uncertainty, unsupported additions, audience terminology, pacing/density, redundancy, Director Brief/tone.
- **Scene:** Script coverage, narrative purpose, pacing, uncertainty, visual framing, Director Brief consistency.
- **Shot:** Scene/Script fidelity, camera treatment, scientific constraints, visual-integrity category, disclosure, cinematic excess/redundancy.
- **Visual Decision:** Shot fidelity, category/decision/constraint/risk coherence, disclosure, observation-vs-reconstruction integrity, representation preference.

The output contract remains:

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

Flags now include scientific/provenance signals plus downstream production risks such as `AUDIENCE_MISMATCH`, `PACING_RISK`, `NARRATIVE_REDUNDANCY`, `DIRECTOR_CONSTRAINT_RISK`, `VISUAL_INTEGRITY_RISK`, `PROVENANCE_RISK`, and `UNSUPPORTED_ADDITION`.

### Cost/latency policy

Stage-aware review is **optional and user-triggered**. Tital does not automatically run a second Gemini call after every generation step. The director chooses where a second semantic evaluation pass is worth its cost and latency.

Evidence is the special high-volume case: deterministic Adaptive Evidence Budget is applied before Gemini review so a broad research pool does not automatically become a broad AI-review/human-review workload.

### Authority boundary

The evaluator can assist checkbox selection, but it cannot modify candidate statuses. `APPROVE_SUGGESTED` is advisory metadata, not `APPROVED` state.

```text
AI recommendation
→ human inspection
→ explicit human Approve / Reject
→ trusted state transition
```

## Human director context for cinematic agents

`sceneDirectorAgent`, `shotDirectorAgent`, and `visualDecisionAgent` may receive application-supplied cinematic context from the project `DirectorBrief`, feedback the director explicitly chose to remember, and an optional scoped replacement instruction.

Precedence:

```text
1. approved science / provenance / uncertainty / visual-integrity constraints
2. approved production constraints
3. Director Brief + explicitly remembered feedback + scoped director instruction
4. AI cinematic preference
```

The application—not the agent—adds cinematic `decisionProvenance` where supported.

## Explicit feedback memory

A retry instruction is one-off by default. If the director explicitly chooses to remember it, `resolveMvpReview` persists a project-scoped `DirectorFeedback` record. Later cinematic agents can receive the remembered instructions as guidance.

The memory is inspectable, bounded, project-scoped, and removed from detached public demo snapshots. Tital does not imply hidden cross-project learning.

## Rejection and retry

Rejected candidates remain terminal history. Missing coverage does not authorize silent agent regeneration.

```text
first proposal
→ human rejects
→ REJECTED history
→ explicit RETRY or explicit WAIVE if policy allows
```

A governed revision is different: records made invalid by an explicit upstream change become `STALE`, which permits deliberate selective repair while preserving old history. Repaired candidates can again receive optional stage-aware AI review before human re-approval.

## Final Production Reviewer

A `READY_FOR_PRODUCTION` package can be reviewed by a separate Gemini semantic reviewer. It can identify advisory findings related to:

- scientific fidelity/overstatement;
- uncertainty propagation;
- narrative/pacing;
- audience fit;
- visual representation risk;
- Director Brief conflicts.

This is intentionally separate from per-gate review. The per-gate evaluator asks “should this current candidate receive human attention or approval?”; Final Production Review asks “what cross-stage risks remain in the completed production?”

It cannot modify the package. The human may turn a finding into an explicit `RevisionRequest`, after which deterministic impact analysis and selective repair take over.

## Bounded concurrency and rate-limit policy

True workflow stages remain sequential across human gates. Independent external calls inside one authorized stage can use bounded concurrency.

General default:

```text
TITAL_EXTERNAL_CONCURRENCY=3
```

Full-source Evidence is intentionally serialized by default:

```text
TITAL_EVIDENCE_CONCURRENCY=1
```

because every approved Source requires a Gemini turn plus Parallel `web_fetch`. Transient model/provider failures such as rate limits receive bounded retry/backoff; deterministic validation, billing, authorization, safety, and provenance failures fail closed.

## Runtime timing

External operations can emit safe timing/runtime metadata, including:

```text
gemini.evidence_extraction
parallel.source_discovery
gemini.claim_generation
gemini.shot_generation
```

Persisted diagnostics avoid raw prompts, source documents, credentials, private bucket paths, and provider secrets.

## Known live incidents that shaped this architecture

- model-echoed trusted ID/reference drift → application-owned IDs + numbered references;
- malformed Parallel candidate aborting a batch → per-candidate validation;
- rejected content silently regenerating → first-attempt-only automation + explicit retry;
- provider empty content hiding quota/spend-cap failures → ADK/Vertex failure classification;
- full-source Evidence burst causing Vertex 429 → Evidence-specific concurrency + bounded retry;
- Cloud Run `Rate exceeded.` during a long single-slot request → HTTP serving capacity separated from model-call concurrency;
- 5-minute Aurora run producing 123 Evidence candidates → compact per-source extraction + Adaptive Evidence Budget;
- live Script gate exposing the absence of downstream AI assistance → stage-aware Review Evaluator across the full human-gated workflow.

See [../AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md](../AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md).

## Agent design rules

When adding or changing an agent:

1. Give it one narrow responsibility.
2. Supply only approved upstream information it may use.
3. Use tools explicitly when grounding requires them; fail rather than inventing unavailable source content.
4. Remove opaque trusted IDs from model context whenever application mapping can replace them.
5. Require structured output and validate it.
6. Range/provenance-check references deterministically.
7. Assign trusted IDs, parent mapping and statuses in application code.
8. Preserve uncertainty; never silently increase certainty.
9. Keep human approval outside the model.
10. Keep AI review advisory and independent from trusted decision state.
11. Make review stage-aware rather than asking a generic critic to judge every artifact by the same criteria.
12. Treat director style below scientific constraints.
13. Do not silently regenerate rejected content.
14. Distinguish `STALE` governed repair from rejected-history regeneration.
15. Turn reproducible live failures into regression tests.
16. Control volume/cost with explicit application policy rather than hidden prompt truncation.
17. Keep optional review user-triggered unless a future policy explicitly justifies automatic evaluation.

## Research alignment

ADK structured output and Gemini tool use improve generation reliability, but they do not replace application-level trust, provenance, cost control, or human authority. Tital therefore uses agents for bounded semantic work and deterministic services for state transitions, Evidence budgeting, revision impact, audit, and package lifecycle.
