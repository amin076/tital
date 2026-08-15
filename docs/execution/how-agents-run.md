# How Agents Run

Tital agents are executed using the Google Agent Development Kit (ADK) `run` command. The ADK provides a local execution harness that allows you to interact with agents from the command line.

## The `adk run` Command

The `adk run` command takes a single argument: the path to a TypeScript file that exports a `rootAgent`.

```bash
npx adk run agent.ts
```

This command starts an interactive session where you can send messages to the agent and receive its responses.

## Agent Entry Points

The Tital repository has two main agent entry points:

-   **`agent.ts`**: This is the main entry point for the Tital Director agent. It is a simple `LlmAgent` that is used for the initial "define" step of the workflow.
-   **`parallel-agent.ts`**: This agent is specifically for interacting with the Parallel Search MCP.

## The `InMemoryRunner`

Within the deterministic services, agents are called using the `InMemoryRunner` from the ADK. This allows the services to call agents programmatically and capture their output.

```typescript
import { InMemoryRunner, stringifyContent } from '@google/adk';
import { defineAgent } from '../agents/defineAgent.js';

// ...

const runner = new InMemoryRunner({ agent: defineAgent });
const run = runner.runEphemeral({
  userId: 'system',
  newMessage: { parts: [{ text: rawIdea }] },
});

for await (const event of run) {
  responseText += stringifyContent(event);
}
```

This pattern is used throughout the Tital services to orchestrate the interaction between the deterministic logic and the AI agents.
