# Domain Models

The Tital system is built on a foundation of strongly-typed, validated domain models. These models define the structure of all data in the system and are the building blocks of the provenance chain.

All domain models are defined as Zod schemas, which provide a single source of truth for both the shape of the data and its validation rules.

## The Provenance Chain

The core of Tital's governance model is the provenance chain, an ordered sequence of domain models that represents the complete, auditable history of a film's creation.

The chain is as follows:

1.  **`FilmBrief`**: The initial high-level plan for the film.
2.  **`ResearchQuestion`**: A specific question that needs to be answered to create the film.
3.  **`Source`**: A source of information that can be used to answer a research question.
4.  **`Evidence`**: A specific piece of information extracted from a source.
5.  **`Claim`**: A factual statement that is supported by one or more pieces of evidence.
6.  **`ScriptLine`**: A line of dialogue or narration in the film's script.
7.  **`Scene`**: A collection of script lines that form a single scene in the film.
8.  **`Shot`**: A single continuous take of the camera.
9.  **`VisualDecision`**: A decision about the visual representation of a shot.
10. **`ScientificAudit`**: An audit of the scientific accuracy of the film.
11. **`ProductionPackage`**: The final package of assets that is ready for production.

## Zod Schemas

Every domain model has a corresponding Zod schema. For example, the `FilmBrief` schema is defined as:

```typescript
export const FilmBriefSchema = z.object({
  id: z.string().min(1, "ID must be a non-empty string"),
  title: z.string().min(1, "Title must be a non-empty string"),
  scientificTopic: z.string().min(1, "Scientific topic must be a non-empty string"),
  // ... and so on
});
```

This provides several benefits:

-   **Type Safety:** The schemas are used to generate TypeScript types, ensuring that all data is strongly-typed throughout the application.
-   **Validation:** The schemas are used to validate data at runtime, preventing invalid data from entering the system.
-   **Single Source of Truth:** The Zod schemas are the single source of truth for the shape of the data.
