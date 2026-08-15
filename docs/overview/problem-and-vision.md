# Problem and Vision

## The problem Tital targets

Scientific films can look convincing while still misrepresenting evidence. The failure is not limited to obviously false statements. A film can also mislead by:

- presenting a model or reconstruction as if it were a direct observation;
- presenting a disputed claim as consensus;
- dropping uncertainty while simplifying narration;
- using a visual whose geometry, colour, scale, timing, or motion implies more certainty than the evidence supports;
- introducing a scene or shot whose scientific meaning is no longer traceable to the sources that originally justified it.

Most AI media tools optimize for generation quality, speed, or storytelling. Tital's product problem is different:

> How can a filmmaker transform scientific evidence into a compelling production plan without losing the provenance, uncertainty, and scientific meaning that justified the story in the first place?

## Core product responsibility

Tital should not merely answer:

> Can we generate this scene?

It should also answer:

> Can we scientifically defend what this scene tells the audience?

That is why Tital governs a chain from research through individual filmmaking decisions rather than stopping at search, summarization, or script generation.

## Current MVP vision

The current MVP is designed to prove one governed vertical slice:

```text
Film idea / brief
→ research questions
→ real Partner-backed source discovery
→ source review
→ evidence
→ evidence review
→ claims
→ claim review
→ scientific script lines
→ script review
→ scenes
→ scene review
→ shots
→ shot review
→ visual decisions
→ visual review
→ deterministic scientific audit
→ production package
```

The intended product value is that every important downstream artifact remains connected to approved upstream scientific records.

## Human review is part of the product

Tital does not treat autonomous progression as a goal by itself. Scientific approval is an explicit responsibility boundary.

Conceptually:

```text
model proposal
→ REVIEW_REQUIRED (or domain-specific discovered state)
→ human approval/rejection
→ next stage becomes eligible
```

`SourceRecord` is a notable exception to the simplified pattern: source discovery initially creates `DISCOVERED` records, which are reviewed before approved evidence extraction.

## Current implementation vs future vision

Implemented now:

- TypeScript/Node.js governed domain pipeline;
- Google ADK + Gemini model-assisted stages;
- Parallel Search MCP source discovery;
- human-review transition services;
- provenance validation;
- workflow evaluation/execution control;
- deterministic audit and package construction.

Not implemented yet:

- production web workspace;
- multi-user collaboration;
- persistent project database;
- reviewer identity/history;
- automatic downstream staleness propagation after upstream edits;
- production deployment and final video rendering.

These missing layers are future work. They should not be described as current Tital capabilities.

## North Star

A filmmaker should be able to move from a scientific question to a production-ready film plan and, at any point, ask:

> Why are we saying or showing this?

Tital should return a traceable scientific answer through the provenance chain.
