# All Things Agentic — Bonus Content Drafts

These drafts are optional. They only count for bonus consideration after the entrant publishes them publicly and adds the resulting URLs to Devpost where requested.

## LinkedIn / social post

> I built **Tital — an Evidence-Governed Scientific Film Director** for the **All Things Agentic Hackathon**.
>
> Most AI filmmaking tools optimize for generation. Tital focuses on a different problem: **how do we keep scientific evidence, human creative control, and every cinematic decision connected?**
>
> Tital uses Google ADK and Gemini 3.5 Flash on Vertex AI to move through a governed workflow:
>
> Scientific question → research → sources → evidence → claims → script → scenes → shots → visual decisions → production package.
>
> The agent does not approve its own work. Each generative stage pauses at a human review gate, and a director can approve, reject, request a targeted replacement, or intentionally waive a branch. A final visual decision remains traceable all the way back to approved evidence and source provenance.
>
> The hosted app runs on Google Cloud Run, persists governed project state in Cloud Storage, uses Firebase Authentication for live projects, and uses Parallel Search MCP for source discovery.
>
> Public demo: https://tital-o7za4b3w5q-ts.a.run.app/
> Code: https://github.com/amin076/tital
>
> This post was created for the purpose of entering the **All Things Agentic Hackathon**.
>
> #AllThingsAgenticHackathon #GoogleCloud #Gemini #AgenticAI #ScientificFilmmaking

## Suggested blog title

**Why an AI Scientific-Film Director Needs Governance, Not Just Better Prompts**

## Blog draft

This article was created for the purpose of entering the **All Things Agentic Hackathon**.

### The problem I wanted to solve

Generative AI can already produce research summaries, scripts, images, storyboards, and video. But scientific filmmaking has a different failure mode: the more tools and generations are involved, the harder it becomes to answer a basic production question — **why are we saying or showing this?**

A scientifically responsible film needs more than plausible output. It needs a chain between source material, evidence, claims, narration, cinematic representation, uncertainty, and the human decisions that approved each step.

That led to **Tital**, an Evidence-Governed Scientific Film Director.

### Tital is a workflow, not a chatbot

Tital is built as a typed, persisted agentic workflow:

```text
Film idea
→ Film Brief
→ Research Questions
→ Sources
→ Evidence
→ Claims
→ Script Lines
→ Scenes
→ Shots
→ Visual Decisions
→ Governance / provenance audit
→ Production Package
```

Different Google ADK agents powered by Gemini 3.5 Flash handle different semantic tasks. The source-discovery agent must call Parallel Search MCP rather than answering from memory. Later agents operate only on the approved upstream records they are given.

The important design decision is that model output is never automatically trusted application state.

```text
model/tool proposes
→ schema validation
→ application maps trusted identity + provenance
→ human review
→ deterministic coverage decision
```

The model can be creative and useful without becoming the authority for IDs, approval status, or provenance.

### Human-in-the-loop means control flow

One of the most useful lessons came from real end-to-end runs. In an early workflow, rejecting the only candidate for a required branch could make coverage look empty, which allowed a semantically similar candidate to be generated again under a new ID.

That made rejection feel fake.

Tital now treats rejected content as terminal history. If the director wants another option, they must explicitly choose **Reject & try another**. They can also give a scoped instruction for the replacement. If a branch is intentionally omitted, that decision becomes a persistent `CoverageWaiver` rather than disappearing.

Human review therefore changes what the agent is allowed to do next.

### Creative control without weakening science

Scientific evidence does not specify one correct camera move, pace, or visual language. Tital carries a persistent Director Brief with controls such as pacing, camera behaviour, representation preference, visual style, notes, and explicit things to avoid.

The precedence is deliberate:

```text
scientific evidence / uncertainty / visual-integrity constraints
> approved production constraints
> human director guidance
> AI cinematic preference
```

The AI can propose a cinematic treatment, but it cannot use style instructions to turn a reconstruction into an observation or erase a scientific limitation.

### Provenance becomes a product feature

The final production package is useful because the chain survives all the way to production planning. An evaluator can start at a Visual Decision and trace backwards through Shot, Scene, Script Line, Claim, Evidence, and Source.

That trace is not an after-the-fact citation list. It is created by the workflow's data model and review rules.

### Running on Google Cloud

Tital's hosted React Director Workspace and Node API run on Google Cloud Run. Live projects use Firebase Authentication, and governed session state is stored in Google Cloud Storage. Google ADK agents use Gemini 3.5 Flash through Vertex AI. Deployment is automated with GitHub Actions and Google Workload Identity Federation, so the repository does not need a long-lived service-account JSON key.

A detached public demo snapshot lets evaluators inspect a completed project without getting access to a private authenticated user session.

### Measuring agent performance without inventing a speed claim

A second lesson was performance. Independent calls inside one stage were originally serialized. Tital now uses bounded concurrency for work that is genuinely independent while preserving stage and human-review dependencies.

The application records stage wall time and operation timing. The UI can show how much external work overlaps, but it deliberately does not label that ratio as a before/after speedup without a controlled comparison.

That distinction matters to the product philosophy: evidence should constrain engineering claims too.

### What I learned

The most important lesson was that trustworthy agentic software is not created by asking a model to be trustworthy. It comes from giving the model the right responsibilities and keeping other responsibilities deterministic.

For Tital:

- models propose semantic content;
- tools retrieve external information;
- schemas validate boundaries;
- application code owns identity and provenance;
- people own approval and creative authority;
- deterministic services decide coverage and package readiness.

The result is an AI director that can do meaningful work without becoming the final authority.

Public demo: https://tital-o7za4b3w5q-ts.a.run.app/

Repository: https://github.com/amin076/tital

Built for the **All Things Agentic Hackathon**.
