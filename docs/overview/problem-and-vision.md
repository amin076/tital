# Problem and Vision

## The problem Tital targets

Scientific films can look convincing while still misrepresenting evidence. A film can mislead by:

- presenting a model or reconstruction as direct observation;
- presenting a disputed claim as consensus;
- dropping uncertainty during simplification;
- using geometry, colour, scale, timing, or motion that implies more certainty than evidence supports;
- introducing scenes/shots whose scientific meaning is no longer traceable to the sources that justified them.

Most AI media tools optimize primarily for generation quality, speed, or storytelling. Tital's problem is different:

> **How can a filmmaker transform scientific evidence into a compelling production plan without losing provenance, uncertainty, scientific meaning, or human directorial agency?**

## Two kinds of authority

Tital needs to protect two distinct responsibilities.

### Scientific authority

Evidence, uncertainty, representation category, and approved scientific constraints establish what the film may safely claim or imply.

### Directorial authority

Within that evidence-safe envelope, a human director may have a distinctive visual language, pacing, camera philosophy, realism preference, or scene-specific idea.

The product should not confuse these authorities:

```text
science constrains meaning
human director owns artistic intent
AI proposes possibilities inside both
```

AI should not become the hidden default director merely because it can produce a plausible shot description.

## Core product responsibility

Tital should answer both:

> Can we scientifically defend what this scene tells the audience?

and:

> Is this the visual solution the human director actually wants?

That is why the governed chain extends from research to individual visual decisions and human review.

## Current vertical slice

```text
FilmProjectInput (+ optional DirectorBrief)
→ FilmBrief
→ Research Questions
→ Parallel-backed Sources
→ human source review
→ Evidence
→ Claims
→ Scientific Script
→ Scenes
→ Shots
→ Visual Decisions
→ Governance / provenance audit
→ ProductionPackage
```

Every model-assisted stage remains behind application validation and the relevant human gate.

## Human review is not a checkbox

A real review system must support disagreement with the proposal without forcing the reviewer to accept unwanted content just to complete the workflow.

Current coverage-aware behavior:

```text
approve
→ candidate enters approved chain

reject with alternative coverage
→ candidate remains rejected history

reject final candidate
→ Retry replacement | Waive intentional gap | Cancel
```

This prevents silent regeneration loops and preserves intentional omissions as `CoverageWaiver` records.

## Director-control direction

Tital now introduces a compact project-level Director Brief for cinematic generation and supports scoped instructions in the targeted replacement backend.

Research into professional directing/cinematography supports treating camera perspective, lens language, movement, pacing, color/light, shot selection, and visual rhythm as context-dependent directorial decisions rather than one AI-optimal answer.

Therefore Tital's cinematic interaction should evolve toward:

```text
approved scientific material
→ scientific constraints
→ AI recommendation(s)
→ Director Brief / scoped intent
→ human selection or modification
→ approved cinematic decision
```

See [../DIRECTOR_CONTROL.md](../DIRECTOR_CONTROL.md).

## Performance is also a product problem

Human review becomes frustrating if each governed step is unnecessarily slow. Tital must distinguish unavoidable provider latency from self-inflicted orchestration latency.

Static inspection found independent calls inside a stage were serialized. Bounded concurrency and timing traces are now the first measured-architecture response. Tital will not claim speedup percentages until a comparable hosted benchmark exists.

See [../PERFORMANCE.md](../PERFORMANCE.md).

## Implemented product/application layers

- hosted React web workspace;
- Firebase-authenticated live workflow;
- Cloud Storage durable sessions;
- real Gemini/Vertex AI proposal stages;
- real Parallel Search MCP discovery;
- explicit review/retry/waive governance;
- deterministic audit/package construction;
- production exports;
- Director Brief first increment;
- bounded external-call concurrency + timing instrumentation;
- CI/CD with GitHub Actions + Workload Identity Federation.

## Important future layers

- full approved-source retrieval/verification;
- source-authority / uncertainty-preservation semantic checks;
- reusable cross-project Director Profiles;
- richer cinematic alternatives/comparison where measured useful;
- general edit → downstream staleness lifecycle;
- optimistic locking for concurrent session mutations;
- safe curated public-demo snapshot/promotion;
- final film rendering or downstream renderer integrations.

## North Star

A filmmaker should be able to move from a scientific question to a production-ready film plan and ask two questions at any point:

> **Why are we saying or showing this?**

and

> **Who made this cinematic choice, under what constraints, and can I change it?**

Tital should answer both through traceable governed state.
