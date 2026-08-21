# Tital Performance Benchmark v2

Status: **measurement semantics upgraded; controlled concurrency comparison still to be run**

This document defines the next live benchmark after the first completed `Why is the Sky Blue?` performance profile.

## Existing Sky baseline

The completed Sky project produced the first useful hosted timing profile after bounded concurrency was introduced.

Measured UI values from that legacy session:

- measured automated wall time: approximately **2m 29s**;
- external calls: **39**;
- failed external calls: **0**;
- aggregate external-work / wall-time overlap: **2.28x**;
- slowest measured stage: **Source discovery**;
- source discovery: approximately **41s**, 5 calls, 1.72x overlap, 2 executions;
- evidence: approximately **34s**, 10 calls, 2.56x overlap;
- visual decisions: approximately **28s**, 8 calls, 2.58x overlap;
- shots: approximately **23s**, 4 calls, 2.13x overlap;
- claims: approximately **11s**, 4 calls, 2.59x overlap;
- scenes: approximately **6.7s**, 4 calls, 2.57x overlap;
- script: approximately **6.0s**, 4 calls, 2.74x overlap.

Important limitations of that baseline:

1. The initial project-creation / FilmBrief generation call was not instrumented yet.
2. The configured concurrency limit was not persisted with those events.
3. Source-discovery timing covered the whole Parallel/ADK path and did not distinguish provider roundtrip from application-side SourceRecord normalization.
4. `2.28x` is **not a measured speedup**. It is summed external-call work divided by measured wall time.

## Benchmark v2 instrumentation

New sessions now record:

- FilmBrief generation time during project creation;
- every governed automated execution wall time;
- external-call timing;
- internal measured substeps when useful;
- the configured bounded external concurrency limit;
- Parallel agent/MCP roundtrip separately from SourceRecord normalization.

Performance operation kinds:

```text
EXTERNAL
INTERNAL
```

Examples:

```text
film_brief.generation            EXTERNAL
parallel.agent_roundtrip         EXTERNAL
parallel.source_normalization    INTERNAL
gemini.evidence_extraction       EXTERNAL
```

Only `EXTERNAL` operations contribute to external-call count and parallel-overlap calculations.

## Controlled concurrency test

The next optimisation experiment is a comparison of concurrency `3` and `4`.

Do **not** compare two unrelated film projects.

Use the same project definition, audience, duration, Director Brief, and review policy. Provider latency is variable, so one run is not enough to claim a stable speed improvement.

Recommended minimum:

```text
Configuration A: TITAL_EXTERNAL_CONCURRENCY=3
Run A1
Run A2

Configuration B: TITAL_EXTERNAL_CONCURRENCY=4
Run B1
Run B2
```

Prefer three runs per configuration if quota/cost permits.

## What to record

For each run capture:

| Metric | Why it matters |
|---|---|
| Full measured automated runtime | end-to-end automated latency including FilmBrief |
| External call count | confirms comparable workflow shape |
| Failed calls | catches instability/rate limiting |
| Concurrency limit | makes the benchmark configuration explicit |
| Stage wall time | identifies where concurrency changes matter |
| External work | separates provider work from wall time |
| Parallel overlap | verifies actual overlap, not speedup |
| Slowest external call | identifies tail latency |
| Source-discovery roundtrip | isolates Parallel/ADK/provider latency |
| Source normalization | shows whether local processing is material |

## Comparability rules

Reject a run as a clean performance comparison if:

- it uses a materially different number of approved Research Questions;
- it uses a materially different number of approved Sources;
- retries differ substantially between configurations;
- a provider failure or quota error occurs;
- the user changes review choices enough to change downstream workload;
- a run is interrupted or resumed under a different runtime configuration.

Human review time is **not** part of automated runtime.

## Decision rule for concurrency 4

Concurrency `4` should replace the default `3` only if the repeated hosted benchmark shows:

1. lower median automated wall time;
2. no meaningful increase in external-call failures;
3. no new quota/rate-limit instability;
4. no material degradation in proposal quality or provenance;
5. no unacceptable Cloud Run memory/resource behaviour.

A single faster run is insufficient.

## Source discovery investigation

The Sky baseline made Source Discovery the largest measured contributor even with relatively few calls.

New traces therefore split it into:

```text
Research Question
  ↓
Parallel / ADK agent roundtrip        EXTERNAL
  ↓
validated discovery response
  ↓
SourceRecord normalization            INTERNAL
```

If `parallel.agent_roundtrip` dominates, optimisation should focus on provider/request strategy and tail latency rather than Firebase/GCS.

If `parallel.source_normalization` is unexpectedly large, local parsing/validation should be profiled.

## What this benchmark does not claim

This benchmark does not independently measure:

- Firebase token-verification latency;
- GCS session load/save latency;
- Cloud Run cold-start contribution;
- provider time-to-first-token;
- token usage/cost;
- human review time.

Add those measurements only if automated-stage wall time cannot be explained by the measured external and internal work.

## Expected next decision

After two or more comparable runs at concurrency 3 and 4, choose one of:

```text
A. Keep 3 — provider tail latency/rate limits dominate.
B. Move to 4 — lower wall time with stable quality and failures.
C. Keep 3 and optimise Source Discovery specifically.
D. Add infrastructure timing — only if unexplained overhead remains significant.
```
