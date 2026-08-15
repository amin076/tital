# Contribution Guide

Tital is an evidence-governed scientific film direction system. Contributions should preserve the governance model, not just make the code compile.

## Getting started

```bash
git clone https://github.com/amin076/tital.git
cd tital
npm install
npm run typecheck
npm test
```

Create a focused branch for your change.

## Core engineering invariants

When changing Tital, preserve these rules:

1. **Models propose; application code governs.** LLM output must not directly become trusted domain state.
2. **Application code owns IDs and statuses.** Do not let a model invent trusted record IDs, approval states, or provider metadata.
3. **Validate structured output.** Use the appropriate Zod proposal/domain schema and reject malformed model output.
4. **Validate provenance.** Referenced upstream IDs must exist, be eligible for the current stage, and belong to the correct research question/scene/context.
5. **Do not bypass human review gates.** Automation should stop when review is required.
6. **Preserve uncertainty.** Do not silently turn caveated evidence into stronger claims or visuals.
7. **Never fabricate source provenance.** In particular, `providerSearchId` must represent a real provider-returned ID or `null`; never substitute an application-generated run ID.
8. **Keep deterministic logic deterministic.** Scientific audit, approval transitions, workflow legality, and package readiness should not be delegated to an LLM when deterministic rules can enforce them.
9. **No live external calls in ordinary unit tests.** Inject model/tool callers and use fakes for normal validation.
10. **Document implemented behavior accurately.** Label proposed/future behavior as such.

## Adding a model-assisted stage

The preferred pattern is:

```text
validated approved upstream records
→ deterministic service
→ narrowly scoped ADK agent
→ structured proposal
→ parser + Zod validation
→ deterministic provenance checks
→ application-owned ID/status
→ final domain validation
→ human review
```

Add tests for malformed responses, unapproved upstream records, invented IDs, and provenance mismatches before performing a live Vertex test.

## Partner and runtime changes

Tital currently uses Google ADK/Gemini/Vertex AI and Parallel Search MCP. Do not add another AI runtime/framework/API without first checking product architecture and hackathon constraints.

Never commit:

```text
API keys
OAuth secrets
service-account JSON
access tokens
private credentials
.env files containing secrets
```

## Pull requests

A PR should explain:

- what problem it solves;
- domain/provenance impact;
- human-review impact;
- files changed;
- tests added/updated;
- `npm run typecheck` result;
- `npm test` result;
- whether any live Vertex/Parallel validation was performed.

If architecture or behavior changes, update the relevant file under `docs/` in the same PR.

## Scope discipline

Tital's MVP is proving a governed path from scientific evidence to film-production decisions. Avoid unrelated infrastructure or decorative agent complexity unless it directly advances that proof.
