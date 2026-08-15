# Orchestration

The Tital workflow is orchestrated by a combination of command-line scripts and deterministic services. There is no single "Execution Controller" in the current MVP, but the services work together to create a linear workflow.

## CLI Scripts

The entry points for the orchestration are the CLI scripts in the `src/cli` directory. For example, the `define.ts` script orchestrates the "define" step of the workflow:

```typescript
import { defineFilm } from '../services/defineFilm.js';

async function main() {
  const rawIdea = process.argv[2];
  // ...
  const filmBrief = await defineFilm(rawIdea);
  // ...
}

main();
```

This script calls the `defineFilm` service, which in turn calls the `defineAgent`.

## Deterministic Services

The services in `src/services` are responsible for orchestrating the individual steps of the workflow. Each service is a deterministic function that:

1.  Takes the output of the previous step as input.
2.  Calls an agent to generate a proposal for the next step.
3.  Validates the agent's proposal.
4.  Assembles the final domain model for the current step.
5.  Returns the new domain model to the caller.

This pattern of "CLI -> Service -> Agent" is the core orchestration model for the Tital MVP.
