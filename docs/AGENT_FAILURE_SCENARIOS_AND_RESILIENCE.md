# Agent Failure Scenarios and Resilience Design

Status date: **2026-08-17**

This document is Tital's reliability playbook for model-assisted stages. It records known live failures, likely failure scenarios for every agent/workflow stage, deterministic handling rules, and the regression tests expected before public deployment.

## Reliability principle

Tital treats every model/tool response as untrusted input.

```text
validated upstream state
→ minimal/sanitized model context
→ model/tool proposal
→ parse
→ proposal schema
→ deterministic provenance mapping
→ final domain schema
→ human review
→ workflow progression
```

The application owns trusted identity, provenance, approval state, persistence, workflow eligibility, audit execution, and package construction.

The strongest form of the rule is:

> **Models may choose content and numbered references; application code maps those references to trusted IDs.**

This avoids asking a probabilistic model to copy UUID-like identifiers exactly.

## Failure taxonomy

Tital classifies failures into six broad groups:

1. **Transport/runtime failures** — Vertex, ADK, MCP, network, timeout, quota, authentication.
2. **Syntax/shape failures** — malformed JSON, fenced output, missing required fields, wrong enum/value types.
3. **Partial-provider failures** — one malformed item inside an otherwise useful external result batch.
4. **Identity/provenance failures** — invented, mutated, cross-question, cross-scene, or stale record references.
5. **Scientific-governance failures** — overclaiming, dropped uncertainty, unsupported claims, visual category mismatch, missing disclosure.
6. **State/deployment failures** — lost sessions, unauthenticated access, cross-user session leakage, revision drift, bad configuration.

General policy:

```text
recover deterministically when the intended mapping is unambiguous;
otherwise fail closed and preserve the last valid persisted state.
```

## Stage-by-stage scenarios

### 1. Film definition — `defineAgent`

Possible failures:

- malformed or incomplete structured FilmBrief output;
- empty title, objective, audience, or scope fields;
- model silently broadens a narrow scientific idea;
- transient Vertex/ADK failure;
- outputSchema/agent-transfer warning is mistaken for a fatal error.

Controls and solutions:

- validate structured output before creating trusted FilmBrief state;
- application assigns trusted FilmBrief ID/status;
- no automatic human approval;
- surface live runtime errors without mutating an existing session;
- keep the known ADK outputSchema/transfer warning documented as non-fatal unless runtime behavior changes.

Required regression scenarios:

- valid structured brief;
- missing required field;
- invalid enum/value;
- empty string field;
- runtime exception before persistence.

### 2. Research questions — `researchQuestionAgent`

Possible failures:

- malformed JSON/list shape;
- duplicate or near-duplicate questions;
- irrelevant question outside FilmBrief scope;
- too many/few questions;
- model attempts to create trusted IDs/statuses;
- downstream coverage becomes impossible because questions are too broad.

Controls and solutions:

- validate proposal schema and count bounds;
- application assigns `filmBriefId`, IDs and review status;
- human review remains mandatory;
- future hardening: deterministic duplicate/semantic-overlap warning before review.

Required regression scenarios:

- malformed response;
- empty question/purpose;
- unsupported priority;
- duplicate proposals;
- out-of-scope proposal warning.

### 3. Source discovery — `parallelSourceAgent` + Parallel MCP

Known live failure:

```text
Parallel MCP source validation failed:
sources[2].title → empty string
```

The original implementation validated the entire batch atomically, so one malformed provider/model candidate aborted the whole research step.

Implemented fix:

```text
Parallel batch
→ validate envelope
→ validate each candidate independently
→ discard malformed candidates with warning
→ keep valid candidates
→ fail only if zero valid candidates remain
```

The application does not invent missing titles, excerpts, URLs, or provenance.

Other possible failures:

- MCP/network timeout;
- Parallel returns no results;
- malformed URL;
- empty title/excerpt;
- duplicate URLs;
- source does not address the research question;
- provider search ID absent;
- model output contains an item not produced by the tool;
- provider schema changes.

Controls and solutions:

- candidate-level Zod validation;
- provider metadata preserved when available;
- fail closed when no valid source remains;
- human source review;
- future hardening: URL normalization/deduplication and source relevance scoring;
- future full-content retrieval/verification before evidence extraction.

### 4. Evidence extraction — `evidenceExtractionAgent`

Known historical failures:

- semantic-null uncertainty strings such as `"null"`, `"None"`, or `"N/A"`;
- indirect/proxy evidence phrased as direct confirmation;
- legacy persisted sessions containing now-invalid uncertainty placeholders.

Implemented controls:

- strict proposal/domain schemas reject semantic-null placeholders for new records;
- prompt requires explicit uncertainty for interpretation beyond literal observation;
- legacy-load migration normalizes old session data without weakening new-record validation;
- application assigns `sourceId`, `researchQuestionId`, evidence ID and status; model does not own them.

Possible failures:

- excerpt not present in approved source excerpts;
- interpretation stronger than excerpt;
- all extracted evidence is low-value/redundant;
- source excerpt is insufficient because full-content retrieval is not yet implemented.

Planned solutions:

- excerpt membership/overlap checks where practical;
- proposition-aware overclaim evaluation;
- approved-source full-content retrieval milestone;
- explicit `INSUFFICIENT_SOURCE_CONTENT` handling rather than fabricated evidence.

### 5. Claim generation — `claimGenerationAgent`

Former risk:

```text
model echoes evidenceIds
→ one-character mutation/invention can break provenance
```

Current design:

```text
application sends Evidence #1, #2, ... without trusted IDs
model returns evidenceNumbers
application maps numbers → actual approved EvidenceRecord IDs
```

Possible failures:

- out-of-range evidence number;
- claim unsupported by referenced evidence;
- confidence too high for evidence strength;
- uncertainty dropped;
- duplicate/overlapping claims.

Controls:

- positive integer proposal schema;
- deterministic range check;
- trusted ID mapping after proposal validation;
- final ClaimRecord schema;
- human review;
- audit can detect unsupported provenance, while deeper semantic support scoring remains future work.

### 6. Scientific script — `scientificScriptAgent`

Former risk:

```text
model echoes claimIds
```

Current design:

```text
numbered approved claims
→ model returns claimNumbers
→ application maps numbers → trusted claim IDs
```

Possible failures:

- out-of-range claim number;
- narration stronger than claim;
- uncertainty omitted;
- multiple claims merged into a misleading causal statement;
- excessive verbosity or unusable narration.

Controls:

- range validation and trusted mapping;
- final domain validation;
- human review;
- future proposition-aware uncertainty-preservation test (`UNCERTAINTY_DROPPED`).

### 7. Scene direction — `sceneDirectorAgent`

Former risk:

```text
model echoes scriptLineIds
```

Current design:

```text
numbered approved script lines
→ model returns scriptLineNumbers
→ application maps numbers → trusted ScriptLineRecord IDs
```

Possible failures:

- out-of-range line number;
- scene combines unrelated lines;
- visual summary implies unsupported observation/chronology;
- uncertainty lost during scene abstraction;
- redundant scenes.

Controls:

- deterministic number-to-ID mapping;
- application assigns scene ID/researchQuestionId/status;
- human review;
- visual integrity is refined again at Shot and Visual Decision stages.

### 8. Shot direction — `shotDirectorAgent`

Known live failure:

```text
Shot proposal references script line not present in the approved scene:
"SL-..."
```

Root cause: the model was required to copy trusted `scriptLineIds` exactly.

Implemented fix:

```text
approved scene.scriptLineIds
→ application builds numbered scene-local script-line list
→ model returns scriptLineNumbers
→ application maps scene-local numbers → trusted IDs
```

The model no longer receives the trusted IDs it is not responsible for reproducing.

Earlier implemented fix: model also does not return trusted `sceneId`; application assigns it.

Possible failures:

- out-of-range line number;
- unsupported scientific visual;
- wrong visual-integrity category;
- missing constraint/disclosure;
- too many/redundant shots.

Controls:

- range checks;
- ShotRecord final schema;
- human review;
- downstream Visual Decision category consistency check.

### 9. Visual decision — `visualDecisionAgent`

Known historical failures:

- model echoed a wrong `shotId`;
- MEDIUM/HIGH risk proposal omitted required disclosure.

Implemented fixes:

- model does not return `shotId`; application assigns trusted `shot.id`;
- proposal category must equal approved ShotRecord category;
- MEDIUM/HIGH risk missing disclosure receives deterministic disclosure derived from shot uncertainty/category;
- LOW-risk proposals may retain null disclosure where allowed.

Possible failures:

- category mismatch;
- risk underestimation;
- constraint contradicts approved shot;
- disclosure technically present but scientifically weak.

Planned hardening:

- proposition-aware constraint checking;
- stronger risk heuristics;
- explicit audit rule for scientific-constraint violations.

### 10. Human review gates

Possible failures:

- stale UI submits IDs from a previous stage;
- user attempts review on already-reviewed record;
- accidental cross-project/cross-user record mutation;
- reject creates insufficient coverage;
- FilmBrief rejection semantics are undefined.

Controls:

- current-gate-only review service;
- selected IDs must belong to the pending gate;
- rejected records persist historically;
- missing coverage is regenerated incrementally;
- FilmBrief rejection remains unavailable until a defined domain transition exists;
- authenticated deployment scopes session storage by Firebase `uid`.

### 11. Workflow controller and coverage

Possible failures:

- count-based progression despite broken provenance;
- orphan downstream records;
- stale audit/package after state mutation;
- repeated Continue creates duplicates;
- rejected parent still satisfies coverage.

Controls:

- provenance-connected coverage, not raw count thresholds;
- incremental executors generate missing coverage only;
- audit invalidation after governed state changes;
- rejected history excluded from approved production chain;
- deterministic finalization.

### 12. Governance/provenance audit and package

Possible failures:

- broken links;
- unapproved upstream record in package;
- visual category mismatch;
- missing disclosure;
- audit incorrectly presented as scientific truth verification.

Controls:

- deterministic audit before package readiness;
- final package built only from approved provenance-connected chain;
- UI/report wording says **Governance & provenance audit**;
- documentation explicitly states that scientific truth/authority is not independently guaranteed by this deterministic audit.

Future semantic rules:

- `UNCERTAINTY_DROPPED`;
- `SCIENTIFIC_CONSTRAINT_VIOLATION`;
- proposition-aware unsupported-claim detection;
- citation/source-authority evaluation.

## Cross-cutting runtime scenarios

### Vertex/ADK failure

Policy: do not partially persist generated stage output. Surface a bounded error; allow retry from the last persisted valid state.

### Quota or timeout

Policy: distinguish external/transient failures from deterministic validation errors. Do not weaken schemas to make a retry pass.

### Firebase authentication failure

Client signs in with Firebase; backend verifies the Firebase ID token and uses decoded `uid` for session ownership. Invalid/missing tokens receive an authorization error on protected session routes.

Official Firebase guidance: clients send the ID token over HTTPS and custom backends verify it with Firebase Admin SDK `verifyIdToken()`.

### Cloud Run revision replacement

Cloud Run container filesystem is not treated as durable project state. Hosted sessions use Cloud Storage. Revision replacement was tested by creating a new revision and reloading persisted sessions.

### Concurrent updates

Current limitation: there is not yet optimistic locking/version preconditions around session snapshots. Public deployment should keep conservative concurrency until session-level concurrency control is implemented.

## Regression-test policy

Every live failure that reaches a user should become at least one deterministic regression test when reproducible without paid services.

Minimum failure test classes for every model-assisted stage:

```text
malformed JSON
missing required field
wrong enum/type
empty/whitespace-only content
out-of-range numbered reference
unapproved upstream record
cross-question/cross-scene provenance mismatch
duplicate upstream identity
runtime exception before persistence
```

External batch integrations add:

```text
one malformed item among valid items
all items malformed
zero items
provider metadata absent
provider timeout/failure
```

## Research basis

This design is consistent with current platform guidance:

- Google ADK exposes structured agent output configuration but application code still defines the surrounding trust boundary: https://adk.dev/api-reference/typescript/interfaces/LlmAgentConfig.html
- Firebase recommends sending client ID tokens to custom backends and verifying them server-side with Firebase Admin SDK: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- Google Cloud recommends workload/service identities rather than static credential keys for cloud workloads and CI/CD: https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines

## Reliability gate before public Hackathon access

Before making live Tital broadly reachable, require:

```text
all no-live tests/typecheck/build green
→ hosted authenticated smoke test
→ source malformed-item recovery test
→ trusted-reference audit green
→ complete hosted project through package
→ public demo read-only test
→ anonymous protected-route denial test
→ authenticated judge workflow smoke test
→ deployment rollback/revision persistence check
```

This checklist is a release gate, not merely documentation guidance.
