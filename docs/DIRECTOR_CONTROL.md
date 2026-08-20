# Director Control and Human–AI Cinematic Decision Making

Status: **implemented first increment + researched design direction**

Tital is an evidence-governed scientific film director, not an autonomous replacement for a human film director. Scientific evidence can constrain what is safe to say or show, but it does not uniquely determine framing, lens language, movement, rhythm, visual tone, or the preferred balance of photography, reconstruction, diagrams, and animation.

## Research basis

Professional directing practice treats the director as the visual-storytelling leader and cinematography as a collaboration rather than a search for one objectively best shot. Sundance Collab's directing curriculum explicitly separates story from the choices used to tell it and teaches camera perspective, lens choice, motivated movement, cutting versus long takes, color, lighting, and previsualization as director-led visual-language decisions:

- https://collab.sundance.org/catalog/Directing-Visual-Storytelling/June-2024
- https://collab.sundance.org/catalog/Introduction-to-Directing
- https://collab.sundance.org/catalog/Visual-Storytelling-The-Shot-The-Image-and-The-Camera

The International Documentary Association likewise describes documentary cinematographers as serving the director's vision while making style, camera, lens, and lighting choices in response to the story and subject rather than following a fixed recipe:

- https://documentary.org/feature/have-camera-will-collaborate-cinematographers-focus-telling-story

Scientific visualization adds a second responsibility. A visual can be cinematic and still mislead if the audience cannot distinguish observation, reconstruction, inference, or illustration. Research on scientific animation argues for transparent source use so viewers can understand how evidence-informed a visualization is:

- https://www.nature.com/articles/nmeth.3334

Existing generative-video products also show that useful creative control is hybrid rather than slider-only or prompt-only. Adobe Firefly exposes shot size, camera angle, camera motion, style, composition references, motion references, and first/last frames. Runway supports reference media and separates scene framing from motion in Scene Builder:

- https://helpx.adobe.com/au/firefly/web/firefly-video-editor/generate-videos/generate-video-using-firefly-models.html
- https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-video/match-camera-motion-to-reference-video.html
- https://help.runwayml.com/hc/en-us/articles/51200261858835-Scene-Builder
- https://help.runwayml.com/hc/en-us/articles/52963720640275-Using-reference-media-to-guide-your-generations

Tital should borrow the **control concepts**, not copy another product's UI.

## Product principle

The collaboration model is:

```text
Approved scientific content
        ↓
Scientific / uncertainty / visual-integrity constraints
        ↓
Human Director Brief + scoped notes
        ↓
AI proposes evidence-safe cinematic possibilities
        ↓
Human reviews / rejects / requests replacement / waives
        ↓
Approved cinematic decision
        ↓
Traceable production package
```

AI is a cinematic collaborator inside a governed envelope. The human director owns artistic intent and final approval.

## What AI should decide

AI is useful for:

- translating approved scientific material into candidate scenes and shots;
- surfacing visual possibilities the director may not have considered;
- mapping narration to visual coverage;
- proposing camera behavior and explanatory representations;
- identifying scientific constraints and required disclosures;
- suggesting an evidence-safe default when the director has no strong preference.

AI recommendations remain proposals.

## What the director should decide

The human should own or be able to override:

- overall visual language and documentary approach;
- pacing and degree of visual intensity;
- camera behavior when several choices are scientifically safe;
- realism versus stylization inside the evidence-safe envelope;
- preference for physical imagery, archive, diagrams, simulation, reconstruction, or analogy;
- whether a candidate belongs in the final film;
- whether an uncovered branch should receive another attempt or be intentionally omitted.

A director preference cannot convert an inference into an observation or weaken an approved scientific constraint.

## Implemented: project-level Director Brief

`FilmProjectInput` now optionally contains a `DirectorBrief` with a deliberately small set of structured controls plus natural-language fields:

```text
collaborationMode
  AI_ASSISTED | COLLABORATIVE | DIRECTOR_LED

pacing
  CONTEMPLATIVE | BALANCED | ENERGETIC

cameraMovement
  RESTRAINED | BALANCED | EXPRESSIVE

representationPreference
  REAL_IMAGERY_FIRST | BALANCED | EXPLANATORY_VISUALS_FIRST

visualStyle
notes
avoid[]
```

This is intentionally **not** a wall of lens, focal-length, color, movement, duration, and lighting sliders. Those values are often contextual rather than useful as immutable project defaults.

The Director Brief is persisted with the session and consumed by Scene, Shot, and Visual Decision generation.

### Why `DirectorBrief`, not yet `DirectorProfile`

A reusable cross-project Director Profile is a valuable future capability, but the current persistence/auth model does not yet include user-profile storage and versioning. The implemented model is project-scoped and backward-compatible. Once profile storage exists, a reusable profile can seed a project Director Brief rather than becoming a second source of hidden prompt state.

## Implemented: scoped replacement instruction

When rejecting the final candidate would create a coverage gap, Tital already requires an explicit `RETRY` or `WAIVE` decision.

For a targeted cinematic retry, the backend now accepts a scoped director instruction. Examples:

```text
I want this replacement to feel quieter.
Do not use an orbiting camera.
Use human scale to communicate size.
Prefer a macro photographic treatment over a diagram.
Keep this scene observational and avoid spectacular CGI.
```

The scoped instruction applies to the replacement request and has narrower scope than the project Director Brief.

## Precedence and conflict handling

Cinematic agents receive this priority order:

```text
1. approved scientific content, provenance, uncertainty and visual-integrity constraints
2. approved production constraints
3. project Director Brief and scoped director instruction
4. AI cinematic preference
```

If an artistic request conflicts with levels 1–2, Tital should preserve the science and choose or request a safe alternative. A later UX increment should surface the conflict explicitly rather than only relying on prompt behavior.

## Implemented: cinematic decision provenance

New `SceneRecord`, `ShotRecord`, and `VisualDecisionRecord` objects can carry optional application-owned `decisionProvenance`:

```json
{
  "recommendationSource": "AI",
  "evidenceGoverned": true,
  "directorBriefApplied": true,
  "directorInstruction": "Use a quiet macro shot instead."
}
```

This separates the **origin of the recommendation** from **human approval**, which continues to be represented by the record status.

The model does not write these provenance fields.

## Alternatives: recommended next interaction increment

Research supports offering meaningful alternatives, but Tital should not generate three expensive alternatives for every shot by default. That would increase latency, review load, and token cost.

Recommended interaction:

- **AI-assisted mode:** one recommended candidate; alternatives on demand.
- **Collaborative mode:** one recommendation plus an explicit `Try another with direction` action.
- **Director-led mode:** prioritize the Director Brief and scoped instruction, with alternatives requested on demand.

A future comparison view can present 2–3 alternatives for high-impact cinematic decisions with fields such as:

```text
Option
Cinematic rationale
Communication advantage
Scientific implication / risk
Production complexity
Trade-off
```

This should be added after measuring whether directors actually need simultaneous alternatives more often than targeted iteration.

## Scope hierarchy

The long-term hierarchy should remain simple:

```text
Reusable Director Profile (future, account level)
        ↓ seeds
Project Director Brief (implemented)
        ↓ inherited by
Scene / Shot / Visual generation
        ↓ overridden by
Scoped director instruction (implemented in retry backend)
```

A separate persistent Sequence model is not justified yet. Scenes already group script material, and introducing another domain layer before a real use case would complicate provenance and migration.

## Locking and version comparison

Some current schemas already permit `LOCKED`, but a generalized lock/unlock/version-comparison workflow is not yet implemented. A sensible future lifecycle is:

```text
AI_PROPOSED / REVIEW_REQUIRED
→ human APPROVED or REJECTED
→ optional later LOCKED
```

Editing an approved upstream cinematic record also requires a downstream-staleness strategy before general unlocking is safe. For that reason, this work does not pretend that a complete locking product exists.

## UX direction

Tital should support two users without separate products:

### Director who wants help

- choose broad defaults;
- accept AI recommendations;
- review only governed gates;
- ask for an alternative when necessary.

### Director who wants detailed control

- write a visual-language brief;
- add avoid rules;
- use Director-led mode;
- provide scoped instructions on replacement;
- inspect scientific constraints and decision provenance before approval.

Advanced camera/lens/reference controls should be introduced only when they materially change Tital's planning value. Reference images/video are promising future inputs, especially because Firefly and Runway demonstrate their usefulness, but Tital currently has no governed media-asset model and therefore does not implement them yet.

## Remaining work

High-value follow-ups:

1. expose the scoped replacement-instruction field directly in the retry dialog (backend support now exists);
2. render cinematic decision provenance in the human-readable review/report surfaces;
3. add explicit conflict messaging when director guidance cannot satisfy scientific constraints;
4. measure whether simultaneous alternatives are worth their latency/cost;
5. later add reusable Director Profiles and reference-media assets with versioned provenance.
