# Testing and Validation

Tital uses `vitest` for automated tests and the TypeScript compiler for static type checking.

## Standard no-live validation

Run these after normal code or documentation changes:

```bash
npm run typecheck
npm test
```

`npm run typecheck` executes `tsc --noEmit`.

`npm test` executes the Vitest suite under `tests/`.

The standard unit-test suite is designed to avoid live Vertex AI and Parallel MCP calls by injecting fake/model callers or testing deterministic services directly. This keeps ordinary validation fast, reproducible, and inexpensive.

## What the tests protect

Current tests cover the governed vertical slice, including areas such as:

- domain/proposal schema validation;
- model-response JSON parsing;
- research-question generation boundaries;
- Parallel source-discovery structure and provider provenance;
- evidence extraction gates;
- claim grounding and illegal/invented upstream IDs;
- human review transitions;
- script/scene/shot/visual-decision provenance;
- workflow evaluation and execution-controller behavior;
- deterministic scientific audit;
- deterministic production-package readiness;
- real executor wiring using injected dependencies rather than paid live calls.

When adding a new model-assisted stage, test the service boundary before testing the live model. In particular, tests should prove that malformed model output, invented references, unapproved upstream records, and cross-context provenance mismatches are rejected.

## Live smoke tests

Live model/tool runs are separate from the unit suite. They are useful for verifying the actual runtime path, but should be deliberate because they can consume Google Cloud quota/credits or external-service quota.

Examples of live-capable commands include:

```text
npm run adk:run
npm run parallel:run
npm run define -- "..."
npm run research-questions
```

Before a live run, verify the environment and ADC configuration described in [Runtime Configuration](../execution/runtime-configuration.md).

A successful local unit suite does not by itself prove that Vertex AI credentials, network connectivity, or Parallel MCP are currently available. Conversely, a transient external failure should not be hidden by weakening deterministic tests.

## Validation hierarchy

Use this order when changing Tital:

```text
1. Zod/domain validation
2. deterministic unit/service tests
3. TypeScript typecheck
4. controlled integration test with injected dependencies
5. minimal live ADK / Vertex / Parallel smoke test when needed
6. deployed end-to-end validation later
```

## Scientific quality tests

Tital's product promise requires more than code correctness. Future evaluation should measure scientific-quality behavior such as provenance coverage, unsupported-claim rate, citation correctness, uncertainty preservation, audit precision, and traceability completeness.

Those metrics are not yet a complete automated evaluation framework; they are roadmap items rather than current test-suite claims.
