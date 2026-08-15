# Agent Architecture

Tital's agents are built using the Google Agent Development Kit (ADK). Each agent is a specialized, single-purpose component with a clearly defined role in the workflow.

## Agent Design Principles

-   **Single Responsibility:** Each agent is responsible for a single task (e.g., generating research questions, writing a single claim).
-   **Structured I/O:** Agents have a defined input schema and a Zod-based output schema. This ensures that their inputs and outputs are always structured and validated.
-   **Deterministic Services:** Agents are always called by deterministic services. The service is responsible for preparing the agent's input and validating its output.
-   **No Direct State Modification:** Agents do not directly modify the application's state. They return a proposal, which is then processed by a service.

## Example Agent: `defineAgent`

The `defineAgent` is a good example of the standard agent architecture.

```typescript
import { LlmAgent } from '@google/adk';
import { ModelOutputBriefSchema } from '../domain/filmBrief.js';

export const defineAgent = new LlmAgent({
  name: 'define_agent',
  model: 'gemini-2.5-flash',
  description: 'Agent for defining a structured film brief from a raw idea.',
  instruction: `
You are Tital Director (Define Agent). Your sole job is to translate a raw film idea into a structured scientific-film brief.
...
`,
  outputSchema: ModelOutputBriefSchema,
});
```

### Key Components

-   **`LlmAgent`:** The core class from the Google ADK.
-   **`name`:** A unique identifier for the agent.
-   **`model`:** The Gemini model to use for the agent's creative tasks.
-   **`description`:** A human-readable description of the agent's purpose.
-   **`instruction`:** A detailed prompt that guides the agent's behavior.
-   **`outputSchema`:** A Zod schema that defines the expected structure of the agent's JSON output.
