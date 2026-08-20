# Tital Performance Investigation

Status: **static bottleneck confirmed; instrumentation and bounded concurrency implemented; live before/after benchmark still required**

This document separates measured facts from static code findings and provider guidance. Tital must not report an optimisation percentage until the same representative live workflow has been measured before and after the change.

## Executive finding

The clearest self-inflicted latency problem in the current runtime was not Firebase. It was **sequential execution of independent external calls inside a stage**.

Before this change, `createRealMvpStepExecutors` used loops conceptually equivalent to:

```text
RQ 1 search → wait
RQ 2 search → wait
RQ 3 search → wait
...
```

and similarly for:

- Evidence extraction across approved Sources;
- Claim generation across Research Questions;
- Script generation across Research Questions;
- Scene generation across Research Questions;
- Shot generation across Scenes;
- Visual Decision generation across Shots.

These items are independent **within a stage** after their upstream data has been approved. They do not need to run one at a time.

Tital still preserves true stage dependencies:

```text
Research Questions
→ Sources
→ Evidence
→ Claims
→ Script
→ Scenes
→ Shots
→ Visual Decisions
```

No optimisation may bypass those governance boundaries.

## Implemented: bounded parallelism

Independent external calls now run through `mapWithConcurrency`, which:

- caps concurrent work;
- preserves deterministic input/output ordering;
- propagates failures;
- does not reorder persisted provenance;
- defaults to a conservative concurrency of `3`;
- accepts `TITAL_EXTERNAL_CONCURRENCY` and clamps it to `1..8`.

Example:

```text
Before
Q1 ───────→ Q2 ───────→ Q3 ───────→

Now (concurrency 3)
Q1 ───────┐
Q2 ───────┼→ ordered combine
Q3 ───────┘
```

The default is deliberately conservative because Vertex/Parallel quotas and Cloud Run memory must be observed under real load before increasing it.

Explicit replacement retries use the same bounded-parallel strategy when several uncovered targets are retried together.

## Implemented: lightweight timing traces

Tital previously had no reliable answer to "where did this Continue action spend its time?"

`MvpSessionEvent` can now persist an optional performance trace:

```text
durationMs
externalCallCount
operations[]
  name
  targetId
  durationMs
  success
```

Runtime operation names include:

```text
gemini.research_questions
parallel.source_discovery
gemini.evidence_extraction
gemini.claim_generation
gemini.script_generation
gemini.scene_generation
gemini.shot_generation
gemini.visual_decision
```

The trace deliberately excludes prompts, source text, credentials, tokens, and user secrets.

This is lightweight application instrumentation, not a distributed-observability platform.

## What is measured now

For new live continuations, Tital can measure:

- duration of the automated step executed by that continuation;
- number of timed external runtime calls;
- individual runtime-call duration;
- target ID for correlation;
- success/failure of the timed external call.

## What is not yet measured

Tital does not yet persist reliable provider token-usage metadata, time-to-first-token, MCP-internal search substeps, Firebase token-verification duration, or GCS read/write duration.

Those can be added if the new traces show they are necessary. They should not be added merely because they are possible.

## Static execution-path findings

### Gemini / ADK

Most generative stages create an ADK `InMemoryRunner`, send one task, consume the emitted events, parse structured JSON, and validate it. One or more such model calls therefore dominate stages with multiple independent parents.

Tital uses Gemini 2.5 Flash for cinematic proposal agents, which is already a latency-oriented model choice relative to heavier reasoning models. Model latency is still an external floor that application code cannot eliminate.

### Parallel MCP

Source discovery invokes the Parallel Search MCP once per uncovered approved Research Question. Parallel's official MCP quickstart states that Search MCP invokes Search API `basic` mode, tuned for low-latency responses inside agent loops:

- https://docs.parallel.ai/integrations/mcp/quickstart

Therefore simply changing to `basic` mode is not a missing optimisation in the current MCP path; MCP already uses it. The larger application-side issue was performing multiple question searches serially.

Parallel also documents the direct Search API as a way to answer a broad objective in one call and its `basic` mode as lower-latency than `advanced`:

- https://docs.parallel.ai/search/search-quickstart
- https://docs.parallel.ai/search/modes

Tital should not collapse distinct Research Questions into one search solely to save time unless result quality and provenance remain equivalent.

### Cloud Storage and Firebase Auth

A hosted Continue request loads the session, authenticates the user, executes the stage, and saves the updated session. Those operations add latency, but static inspection does not support blaming them for the very long multi-call stages.

Firebase Authentication is part of the security boundary and should not be removed for speed.

GCS read/write timing can be added later if stage traces show large unexplained overhead around external model calls.

### Cloud Run

Cloud Run can add cold-start latency when scaling from zero. Google documents two relevant controls:

- minimum instances keep a warm instance available;
- startup CPU boost can reduce startup latency.

Official documentation:

- https://cloud.google.com/run/docs/tips/general
- https://cloud.google.com/run/docs/configuring/min-instances
- https://cloud.google.com/run/docs/configuring/services/cpu

These settings cost money or change resource allocation. They should be evaluated from Cloud Run metrics before being enabled for a hackathon workload.

Cloud Run request concurrency is a **different** issue from bounded concurrency of independent external calls inside one request. The service has deliberately used conservative request concurrency because session writes do not yet have optimistic locking. Increasing Cloud Run request concurrency before fixing concurrent session mutation could trade latency for correctness.

Official concurrency guidance:

- https://cloud.google.com/run/docs/about-concurrency

## Prompt size and context caching

Vertex AI context caching can reduce repeated processing of large, reused prompt prefixes. Google documents both implicit and explicit caching for supported Gemini models and notes latency/cost benefits when substantial context is repeated:

- https://cloud.google.com/blog/products/ai-machine-learning/vertex-ai-context-caching

Tital's current stage prompts are usually small-to-moderate structured subsets tied to one Research Question, Source, Scene, or Shot. Much of the scientific payload changes between calls. Explicit context caching is therefore **not the first optimisation** compared with removing serial waits.

It becomes more attractive if Tital later sends a large reusable Director Profile, source corpus, style bible, or project context into many calls. At that point cache hit rate and token metadata should be measured first.

## Caching and reuse policy

Tital already persists expensive generated artifacts as typed records. The first cache is therefore the workflow itself:

```text
approved/discovered Source → do not search it again automatically
attempted Source Evidence → do not extract it again automatically
reviewed stage candidate → do not silently regenerate it
```

The retry/waiver changes are also performance fixes because they stop accidental duplicate calls.

Potential future cache candidates:

- provider source discovery results keyed by normalized Research Question + search policy;
- full-source retrieval if/when that stage is implemented;
- reusable reference media metadata;
- large repeated Gemini context via Vertex context caching.

Caching must preserve retrieval time, provider provenance, and a clear refresh policy. Scientific freshness-sensitive searches must not be served indefinitely from stale cache.

## Perceived performance

The current HTTP workflow deliberately runs one governed automatic stage and then stops at the next human gate. That is good for reviewability but can make each Continue feel opaque while a long external stage runs.

The first UX improvement should use the new timing data to show stage-specific progress, for example:

```text
Discovering sources for 5 approved research questions…
3 calls running concurrently
2 / 5 completed
```

More advanced progressive rendering or server-sent events can be considered later. Streaming partial model text into the review UI is **not** automatically useful because Tital must validate structured proposals before showing them as reviewable records.

A safe progressive model is:

```text
external work starts
→ completed candidate batch validates
→ persisted governed record batch becomes visible
```

not unvalidated token streaming masquerading as approved workflow state.

## Baseline protocol

A valid before/after benchmark should use the same project shape and provider configuration. Record per stage:

| Stage | Before | After | External calls | Notes |
|---|---:|---:|---:|---|
| Research-question generation | pending live measurement | pending | 1 | Gemini |
| Source discovery | pending live measurement | pending | N RQs | Parallel MCP |
| Evidence extraction | pending live measurement | pending | N Sources | Gemini |
| Claim generation | pending live measurement | pending | N RQs | Gemini |
| Script generation | pending live measurement | pending | N RQs | Gemini |
| Scene generation | pending live measurement | pending | N RQs | Gemini |
| Shot generation | pending live measurement | pending | N Scenes | Gemini |
| Visual decisions | pending live measurement | pending | N Shots | Gemini |
| GCS/Auth/other | not separately instrumented | not separately instrumented | — | add only if unexplained |

No percentage improvement is claimed yet because the previous dinosaur run predates this instrumentation and did not record comparable per-call timings.

## Expected impact versus verified impact

### Verified by code/tests

- serial independent loops were present;
- bounded concurrency now exists;
- result ordering is preserved;
- automatic duplicate regeneration has been removed;
- timing data is now persistable for new runtime events.

### Expected but not yet measured live

- source discovery with several uncovered RQs should approach the duration of the slowest concurrency waves rather than the sum of every request;
- evidence extraction and Visual Decision generation should see particularly visible improvements when many parents are active;
- total workflow wall-clock time should drop without reducing evidence quality.

### External latency that remains

- Gemini generation latency and capacity variability;
- Parallel MCP search latency;
- network latency;
- possible Cloud Run cold starts;
- provider rate limiting/retries.

## Safety rules for future optimisation

Do not optimise by:

- skipping evidence extraction;
- lowering source quality requirements;
- bypassing review gates;
- dropping uncertainty/disclosure generation;
- batching unrelated scientific questions if provenance becomes ambiguous;
- increasing Cloud Run request concurrency before concurrent session writes are safe.

Prefer:

- bounded parallelism;
- deduplication;
- targeted retries;
- prompt/context reduction where measured;
- caching with provenance and freshness;
- progressive validated results;
- model routing only after quality evaluation.

## Next performance step

Run one representative hosted project with the new instrumentation, export the recent event traces, and identify the top two measured contributors. Only then decide whether the next investment should be Cloud Run warm instances, more detailed GCS/Auth timing, prompt/token work, caching, or a streaming/progressive UI.
