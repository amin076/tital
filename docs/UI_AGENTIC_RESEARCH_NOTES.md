# Tital Agentic UI Research Notes

This note records the design research used for the Director Workspace and performance experience.

## External patterns reviewed

### AG-UI / CopilotKit

Current AG-UI guidance treats an agentic interface as a bidirectional application surface, not merely a chat transcript. Relevant primitives include shared state, human-in-the-loop interrupts, tool/output rendering, steering, and progress visibility. For Tital this supports making stage state, review authority, and runtime progress first-class UI rather than hiding them behind generic loading states.

References:
- https://www.copilotkit.ai/ag-ui
- https://docs.copilotkit.ai/ag-ui/introduction
- https://docs.copilotkit.ai/agent-spec/human-in-the-loop
- https://docs.copilotkit.ai/google-adk

### LangGraph human interrupts

LangGraph's interrupt model reinforces a deterministic pause → review → resume interaction for human-gated workflows. Tital already has this governance contract; the UI should mirror it with a focused current-gate workspace and make approval/rejection/retry feel like the central task rather than one section in a long dashboard.

References:
- https://www.langchain.com/blog/making-it-easier-to-build-human-in-the-loop-agents-with-interrupt

### Vercel AI Elements

AI Elements demonstrates the value of purpose-built UI surfaces for agent runs, tools, tasks, queues, and checkpoints. Tital should borrow that principle while staying on MUI: use dedicated stage, review, provenance, performance, and activity surfaces rather than a generic card for every object.

Reference:
- https://vercel.com/academy/ai-sdk/ai-elements

## Tital design conclusions

1. **The current task must dominate.** The active review gate or next governed action is the primary workspace.
2. **Context should stay nearby.** Evidence/provenance, Director Brief, workflow state, and performance belong in a contextual rail rather than far below the task.
3. **Agent work should be observable without exposing chain-of-thought.** Show validated stage state, external operation names, durations, targets, and success/failure; never raw hidden reasoning.
4. **Human authority must remain explicit.** Approval, rejection, replacement, and waiver controls need strong, distinct affordances.
5. **Performance should distinguish measurement from inference.** Tital can show wall-clock stage duration, external-call work, slowest calls, and a parallel-overlap factor. It must not label the factor a before/after speedup without a comparable baseline.
6. **Progressive disclosure beats vertical accumulation.** Technical event history and detailed provenance should be available but not compete with the current gate.
7. **No second design framework is needed.** React + MUI already provides the required primitives; consistency and information architecture are more valuable than adding Tailwind/shadcn solely for visual novelty.
