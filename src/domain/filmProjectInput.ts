import { z } from 'zod';

export const FilmProjectInputSchema = z.object({
  rawIdea: z.string().trim().min(1, 'Scientific film idea is required.').max(5000),
  title: z.string().trim().min(1).max(160).optional(),
  durationMinutes: z.number().finite().min(0.5).max(180).optional(),
  targetAudience: z.string().trim().min(1).max(240).optional(),
  audienceKnowledgeLevel: z.string().trim().min(1).max(240).optional(),
  format: z.string().trim().min(1).max(160).optional(),
  tone: z.string().trim().min(1).max(400).optional(),
});

export type FilmProjectInput = z.infer<typeof FilmProjectInputSchema>;

export function normalizeFilmProjectInput(
  input: string | FilmProjectInput
): FilmProjectInput {
  return FilmProjectInputSchema.parse(
    typeof input === 'string' ? { rawIdea: input } : input
  );
}
