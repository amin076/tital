# Tital UI / UX Research Direction

Status: research synthesis for the next UI redesign.

## Product goal

Tital is not a generic chat application. It is an evidence-governed scientific film-directing workspace with explicit human approval gates. The interface should therefore combine three qualities:

1. **Scientific trust** — provenance, uncertainty, status, and review boundaries stay visible.
2. **Cinematic direction** — the product should feel like a creative production workspace, not an admin CRUD dashboard.
3. **Agentic clarity** — users can see what the system is doing, where human input is required, and what changed after a decision.

## Research findings

### Agentic interfaces should expose state, tools, and human interrupts

Modern agentic UI systems increasingly treat agent state, tool calls, progress, and human-in-the-loop interrupts as first-class UI instead of hiding them behind a spinner. CopilotKit documents agentic UX around generative UI, shared state, human-in-the-loop workflows, and typed frontend surfaces. Its HITL pattern explicitly pauses execution, renders a decision surface, collects a human choice, and resumes with state preserved.

Sources:
- https://docs.copilotkit.ai/
- https://docs.copilotkit.ai/agent-spec/human-in-the-loop
- https://docs.copilotkit.ai/concepts/generative-ui-overview
- https://docs.copilotkit.ai/ag-ui/introduction

LangGraph's frontend guidance follows the same broad pattern: interrupts become explicit review cards with approve/reject/edit actions, while Agent Chat UI visualizes tool calls and agent state rather than reducing execution to an opaque loading state.

Sources:
- https://docs.langchain.com/oss/python/langchain/frontend/human-in-the-loop
- https://docs.langchain.com/oss/python/langchain/ui

**Tital implication:** review gates, progress, retry, waiver, provenance, and performance traces should appear as designed product surfaces. A generic chat transcript is not the primary UI.

### AI-native component libraries favor composable, inspectable primitives

Vercel AI Elements exposes specialized primitives for agents, tools, sources, queues, checkpoints, reasoning/status surfaces, and IDE-like layouts. The useful lesson for Tital is not to adopt a chat UI wholesale; it is to make agent behavior inspectable through purpose-built components and progressive disclosure.

Sources:
- https://elements.ai-sdk.dev/
- https://elements.ai-sdk.dev/components/agent
- https://elements.ai-sdk.dev/components/tool
- https://elements.ai-sdk.dev/examples/ide

**Tital implication:** preserve the existing React + MUI stack, but introduce Tital-specific primitives such as StageRail, ReviewCard, ProvenanceTrace, PerformanceSummary, EvidenceStatus, and DirectorContext rather than adding another full UI framework.

### Accessibility is part of professional polish

WCAG 2.2 adds explicit requirements around unobscured focus and minimum pointer target sizes. W3C guidance recommends visible focus indicators and at least 24x24 CSS-pixel targets (or sufficient spacing), while standard text contrast remains at least 4.5:1 for normal text.

Sources:
- https://www.w3.org/TR/WCAG22/
- https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

**Tital implication:** strong keyboard focus, larger action targets, status not communicated by color alone, and reduced visual obstruction are design requirements.

## Design principles for Tital

### 1. One clear task per surface

The live workspace should emphasize the current governed action. Historical context, provenance, performance, and project navigation should be available without competing with the main review surface.

### 2. Evidence → Story is the visual signature

The most distinctive product concept is the trace from scientific source to cinematic visual decision. Public demo and live review should make that chain visible in a compact, interactive form.

### 3. Human authority is visually explicit

AI proposals, review-required records, approved records, rejected history, stale records, and waivers must have distinct but restrained states. Human decisions should never look like model-owned decisions.

### 4. Progressive disclosure over card overload

Use compact summaries and expandable details. Do not give every data block equal visual weight. IDs and machine details belong in secondary disclosure surfaces, not primary reading flow.

### 5. Performance should be understandable, not merely faster

Long agent operations should expose stage name, elapsed time, completed/total work, concurrent work, and validated-result progress where available. Avoid streaming unvalidated model text into governed review surfaces.

### 6. Scientific + cinematic visual identity

Use a restrained deep-navy foundation, warm evidence accent, teal human/trace accent, green approval state, amber review state, muted red rejection state, and violet/gray stale state. Prefer subtle depth, thin borders, strong typography, and generous whitespace over decorative gradients or excessive animation.

## Implementation sequence

1. **Public showcase redesign** — evaluator-first hero, product proof metrics, Evidence → Story trace, simplified workflow proof.
2. **Global design system pass** — typography, spacing, elevation, focus, buttons, cards, chips, accordions, form fields.
3. **Admin/demo publishing cleanup** — move persistent floating publisher into a compact drawer/launcher.
4. **Performance Insights** — aggregate the existing runtime telemetry and expose stage/call timings.
5. **Director workspace** — stage rail, focused center workspace, contextual right panel.
6. **Provenance explorer** — interactive trace from visual decision back to source/evidence.

## Dependency decision

Tital already uses React 19 and MUI. Adding Tailwind/shadcn/AI Elements would duplicate the existing component system and create avoidable migration/maintenance cost. The redesign should therefore stay on MUI and add only narrowly justified dependencies later (for example, a graph library if the provenance explorer needs it). This preserves build stability while still adopting the agentic UX patterns found in current systems.
