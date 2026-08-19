# Testing and Validation

Tital uses `vitest` for deterministic automated tests, TypeScript for static checking, production builds for packaging validation, and controlled live/deployed runs for external-runtime validation.

## Standard no-live validation

Run before deployment:

```bash
npm run typecheck
npm test
npm run build
```

The normal test suite should not require paid live Vertex AI or Parallel MCP calls. Model/tool callers are injected or deterministic services are tested directly.

## Reliability test policy

Every reproducible live failure that reaches a user should become a deterministic regression test where possible.

Minimum scenario set for every model-assisted stage:

```text
valid structured proposal
malformed JSON
missing required field
wrong enum/type
empty or whitespace-only required content
unapproved upstream record
cross-question/cross-scene provenance mismatch
duplicate supplied upstream record
out-of-range numbered reference (where used)
runtime exception before trusted persistence
```

For batch external providers such as Parallel MCP, add:

```text
one malformed item among valid items
all items malformed
empty result batch
invalid URL/metadata
provider timeout or invocation failure
```

## Trusted-reference regression rule

Model outputs must not be trusted to reproduce opaque application IDs.

Current hardened pattern:

```text
approved inputs
→ application presents numbered records
→ model returns numbered selections
→ application range-checks
→ application maps selections to trusted IDs
```

Regression tests must prove both sides:

- valid numbers map to the exact trusted IDs;
- out-of-range numbers are rejected rather than guessed.

This applies to:

```text
Claim        evidenceNumbers
Script Line  claimNumbers
Scene        scriptLineNumbers
Shot         scene-local scriptLineNumbers
```

Single-parent trusted IDs such as `sourceId`, `filmBriefId`, `sceneId`, and `shotId` are application-owned and should not be required in model proposals.

## Known live failures converted into tests/design controls

- Evidence semantic-null uncertainty values → strict validation + legacy-load migration tests.
- Visual Decision MEDIUM/HIGH missing disclosure → deterministic fallback tests.
- Parallel candidate with empty title → malformed-candidate discard test while retaining valid results.
- Shot proposal referencing a ScriptLine outside the approved Scene → numbered-reference design + range test.
- Firebase login succeeded while backend rejected token → backend verification logging and standard `verifyIdToken()` path.

See [../AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md](../AGENT_FAILURE_SCENARIOS_AND_RESILIENCE.md).

## Validation hierarchy

```text
1. proposal/domain Zod validation
2. deterministic provenance/range checks
3. deterministic unit/service tests
4. TypeScript typecheck
5. production build
6. controlled injected-dependency integration tests
7. minimal live Vertex/Parallel smoke when needed
8. hosted authenticated smoke
9. full hosted end-to-end project
10. public-release security/demo/rollback checks
```

A green unit suite does not prove network credentials, quota, Firebase configuration, Cloud Run IAM, or Parallel availability. Conversely, an external transient failure is not a reason to weaken deterministic schemas.

## Hosted release validation

Before public Hackathon access, validate:

```text
anonymous landing works
anonymous protected session route is denied
authorized Firebase user can sign in
user-owned session list is isolated by uid
create/review/continue works authenticated
Cloud Storage session survives new revision
Parallel malformed-item recovery works
trusted-reference audit passes
curated public demo is read-only
complete hosted project reaches READY_FOR_PRODUCTION
previous revision can be restored if needed
```

## GitHub Actions

`.github/workflows/ci-deploy-cloud-run.yml` runs validation for pull requests/pushes and is designed to deploy after validation on `main` or manual dispatch once Workload Identity Federation is configured.

CI/CD must never bypass failed typecheck/tests/build. Deployment authentication should use GitHub OIDC + Google Workload Identity Federation, not a long-lived service-account JSON key.

See [../DEPLOYMENT_AND_OPERATIONS.md](../DEPLOYMENT_AND_OPERATIONS.md).

## Scientific quality evaluation

Code correctness is necessary but not sufficient. Future evaluation should measure:

- provenance coverage;
- unsupported-claim rate;
- citation correctness;
- uncertainty preservation;
- source relevance/authority;
- audit precision/recall;
- traceability completeness;
- visual-integrity constraint adherence.

These remain evolving scientific-quality metrics rather than claims already guaranteed by the current deterministic suite.
