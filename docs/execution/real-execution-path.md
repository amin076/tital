# Real Execution Path

This document describes the real, end-to-end execution path for the "define" step of the Tital workflow, from the user's command to the final `FilmBrief` object.

```mermaid
graph TD
    A[User runs `npm run define -- "..."`] --> B[tsx src/cli/define.ts];
    B --> C[defineFilm service];
    C --> D[callDefineAgent function];
    D --> E[ADK InMemoryRunner];
    E --> F[defineAgent];
    F --> G[Gemini Model];
    G --> H[Model Output (JSON)];
    H --> F;
    F --> E;
    E --> D;
    D --> C;
    C --> I[assembleFilmBrief function];
    I --> J[FilmBrief object];
    J --> B;
    B --> K[User sees JSON output];
```

## Step-by-Step Breakdown

1.  The user runs `npm run define -- "A film about..."` from the command line.
2.  This executes the `src/cli/define.ts` script using `tsx`.
3.  The script calls the `defineFilm` service, passing the raw film idea.
4.  The `defineFilm` service calls the `callDefineAgent` function.
5.  `callDefineAgent` creates an `InMemoryRunner` for the `defineAgent`.
6.  The runner executes the `defineAgent`, sending the film idea to the Gemini model.
7.  The Gemini model returns a structured JSON object as a string.
8.  `callDefineAgent` parses and validates the JSON against the `ModelOutputBriefSchema`.
9.  The validated model output is returned to the `defineFilm` service.
10. The `defineFilm` service calls the `assembleFilmBrief` function.
11. `assembleFilmBrief` adds an `id` and `status` to the model output and validates it against the full `FilmBriefSchema`.
12. The final `FilmBrief` object is returned to the `define.ts` script.
13. The script prints the `FilmBrief` JSON to the console.
