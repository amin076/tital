# Tital Performance Investigation

Status date: **2026-08-24**

Status: **bounded concurrency, runtime instrumentation, provider-rate resilience, Cloud Run serving-capacity hardening, and Adaptive Evidence Budget are implemented; controlled before/after cost/speed benchmarks remain required before claiming percentages.**

This document separates measured live facts from architecture decisions and future hypotheses.

## Performance is a four-way balance

For Tital, performance cannot be reduced to wall-clock speed. Scientific production has four competing resources:

```text
scientific coverage
human attention
external API/model cost
wall-clock latency
```

Maximizing Evidence count is not automatically maximizing production quality. The system therefore manages both **execution concurrency** and **information volume**.

## Live Aurora evidence-volume finding

A hosted 5-minute `Aurora Grounding Test` with 21 approved Sources performed full-source Evidence extraction and produced:

```text
Evidence candidates          123
measured Evidence stage      ~16m47s
runtime profile calls         29
```

This is one smoke-test observation, not a generalized benchmark.

The result showed that full-source grounding worked at scale, but it also exposed a product/performance problem: 123 Evidence items would create unnecessary AI-review context, human-review work, and downstream Claim/Script context for a 5-minute film.

The response is **not** to discard scientific research. Tital now separates:

```text
broad research / candidate pool
from
active production Evidence
```

See [ADAPTIVE_EVIDENCE_BUDGET.md](ADAPTIVE_EVIDENCE_BUDGET.md).

## Implemented: Adaptive Evidence Budget

V1 reduces information volume in two places.

### Per-source output control

The full-source Evidence Agent is instructed to return a compact strongest set, and application code caps production output at 3 proposals per Source.

### Global active-review compaction

Before AI-assisted Evidence review, a deterministic budget promotes a duration/RQ-priority-aware subset and preserves the remainder as `ARCHIVED_CANDIDATE`.

For a 5-minute production, the current baseline target is 24 active Evidence records.

Expected savings surfaces:

```text
smaller extraction output
→ smaller AI review context
→ smaller human gate
→ fewer approved Evidence records
→ smaller Claim/Script contexts
```

Important limitation: V1 still full-fetches/extracts approved Sources before global compaction. Therefore the system does **not** claim that Adaptive Evidence Budget currently removes the initial `web_fetch`/Gemini call per approved Source. Future early stopping/caching can address that layer.

## Implemented: bounded parallelism

Independent external calls inside one already-authorized stage use `mapWithConcurrency`. True stage/human dependencies remain sequential.

General default:

```text
TITAL_EXTERNAL_CONCURRENCY=3
```

This applies to appropriate independent work such as several RQ source searches or several per-RQ generation calls.

Results preserve deterministic input order.

## Implemented: Evidence-specific concurrency

Full-source Evidence is heavier than the old excerpt-based path because every approved Source requires a Gemini turn plus Parallel `web_fetch`.

Default:

```text
TITAL_EVIDENCE_CONCURRENCY=1
```

This is intentionally separate from general external concurrency. Operators may raise it only after observing their own Vertex/Parallel quota envelope.

## Implemented: transient provider retry

A live Evidence smoke test produced a Vertex/ADK 429. Tital now distinguishes transient model/runtime failures from non-retryable blockers.

Retryable examples:

```text
rate limit / capacity style transient failure
selected timeout / 5xx runtime failure where classified transient
```

Non-retryable examples remain fail-closed:

```text
billing / spend cap
authorization/authentication
safety stop
schema/provenance validation
scientific/application deterministic errors
```

The Evidence stage uses bounded exponential backoff rather than unlimited retries.

## Implemented: Cloud Run serving capacity is separate from model concurrency

A second live 429 appeared as a plain browser response:

```text
Rate exceeded.
```

The deployment had combined:

```text
--max-instances=1
--concurrency=1
```

so one long-running agent request could occupy the only HTTP request slot. The deployment was adjusted to keep a small cost guard while allowing UI/read/health traffic during long agent waits:

```text
Cloud Run request concurrency: 8
Cloud Run max instances: 2
Evidence model concurrency: 1
```

This distinction is important:

```text
HTTP serving concurrency ≠ Gemini/Parallel work concurrency
```

More HTTP capacity does not mean Tital should burst more Evidence model calls.

## Implemented: lightweight timing traces

Automation events can persist safe timing data:

```text
durationMs
externalCallCount
operations[]
  name
  targetId
  durationMs
  success
  safe runtime metadata
  optional safe failure category
```

Representative operation names:

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

The trace excludes prompts, full source text, credentials, private bucket paths, and secrets.

## Existing hosted baseline

A prior hosted Sky workflow recorded approximately:

```text
measured Continue-stage wall time   2m29s
external calls                      39
external-call failures              0
aggregate external-work overlap     2.28x
```

The overlap metric is:

```text
sum(external-call durations) / measured stage wall time
```

It indicates overlapped work; it is **not** a before/after speedup claim.

That run predates the new full-source Evidence path and Adaptive Evidence Budget, so it is not directly comparable to the Aurora Evidence-stage observation.

## Parallel Search MCP

Source discovery uses Parallel `web_search`. Full-source Evidence grounding uses Parallel `web_fetch` after Source approval.

This makes cost/latency policy explicit:

```text
search broadly enough to identify candidates
→ human approves Sources
→ fetch only approved Sources
→ extract compact Evidence
→ budget the active production subset
```

The current architecture does not fetch rejected/discovered-only Sources for Evidence.

## Caching and reuse

Typed persisted workflow records are already the first cache: Tital does not automatically repeat successful/reviewed stages.

High-value next cache work:

- full-source fetched content keyed by source identity + freshness/refresh policy;
- source-discovery results keyed by normalized Research Question/search policy;
- repeated large Gemini context via Vertex context caching only when actual repeated context is measured.

A duration-only revision such as 5 → 8 minutes should ultimately be able to reuse unchanged approved scientific material rather than re-fetching it.

## Coverage-aware early stopping — future

Adaptive Evidence Budget currently compacts after Source approval/full extraction. A future controller can reduce earlier cost by asking:

```text
Does the active research question already have strong, diverse coverage?
Are important claims independently corroborated?
Are contradictions or uncertainty unresolved?
```

If coverage is sufficient, additional source extraction can stop. If contradiction/weak coverage exists, the budget can expand.

This is preferable to both extremes:

```text
always fetch everything
or
hard cap regardless of scientific difficulty
```

## Human attention is a performance metric

Tital treats number of items requiring human judgment as a first-class product-performance quantity.

Useful measures include:

```text
candidate Evidence count
active Evidence review count
archived candidate count
high-attention AI-review count
human decisions required
```

A system that saves 30 seconds but forces a director to manually inspect 123 nearly redundant Evidence cards is not necessarily faster in practice.

## Current cost/latency metrics to record

For representative hosted runs:

| Metric | Why it matters |
|---|---|
| approved Source count | upstream research breadth |
| full-source extraction calls | primary Evidence-stage external work |
| candidate Evidence count | machine knowledge breadth |
| active/promoted Evidence | AI/human review workload |
| archived Evidence | compaction retained knowledge |
| Evidence stage wall time | runtime latency |
| failed/retried calls | quota resilience |
| downstream Claim/Script counts | compounding context volume |
| Cloud Run revision/release | benchmark reproducibility |

Provider token/cost metadata is not yet persisted reliably enough to claim exact dollar savings per project.

## Perceived performance

A governed `Continue` action waits for a complete validated stage before presenting reviewable records. That is correct for trust but can feel opaque during a long stage.

Safe future UX can show validated progress rather than streaming unvalidated model tokens as if they were records:

```text
21 approved Sources
→ 7/21 full-source Evidence extractions complete
→ candidates validated
→ final active budget calculated
```

Server-sent events or job-style progress can be considered after correctness/session-concurrency policy is mature.

## Benchmark protocol

A meaningful before/after Evidence-budget benchmark should hold constant:

- project idea and FilmBrief duration;
- Research Questions;
- approved Source set;
- Gemini model and Vertex location;
- Parallel configuration;
- Cloud Run revision/resource configuration;
- concurrency settings.

Record:

```text
Evidence stage wall time
model/tool call count
candidate Evidence count
active Evidence count
AI-review elapsed time/calls
human gate size
downstream record counts
failure/retry events
```

Do not claim a percentage improvement until comparable runs exist.

## Safety rules for future optimization

Do not optimize by:

- bypassing full-source grounding;
- auto-approving AI recommendations;
- dropping uncertainty/disclosure requirements;
- silently deleting research evidence;
- hiding contradictions to fit a budget;
- increasing model concurrency until rate limits become normal;
- caching freshness-sensitive scientific sources indefinitely.

Prefer:

- compact strongest evidence;
- transparent archive vs active production separation;
- bounded concurrency;
- targeted transient retry;
- explicit caching/freshness policy;
- coverage-aware early stopping;
- measurable human-attention reduction;
- controlled benchmarks.

## Next performance steps

1. Deploy Adaptive Evidence Budget.
2. Re-run the existing 123-candidate Aurora Evidence gate and verify compaction to the 5-minute active target without deleting candidates.
3. Measure AI Evidence Review on the compacted subset.
4. Complete the downstream production and revision smoke test.
5. Only then decide whether the next performance investment is source caching, early stopping, richer progress UX, or additional concurrency tuning.
