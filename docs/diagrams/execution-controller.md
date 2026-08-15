# Execution Controller Diagram

This diagram shows a conceptual view of the Execution Controller.

**Note:** In the current MVP, there is no single "Execution Controller" class or module. The orchestration is handled by a combination of CLI scripts and deterministic services. This diagram represents a conceptual model for how the orchestration works.

```mermaid
graph TD
    A[CLI Script] --> B{Execution Controller};
    B -- "Next Step: defineFilm" --> C[defineFilm Service];
    C --> B;
    B -- "Next Step: generateResearchQuestions" --> D[generateResearchQuestions Service];
    D --> B;
    B -- "..." --> E[...];
```
