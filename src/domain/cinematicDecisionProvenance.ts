import { z } from 'zod';

export const CinematicDecisionProvenanceSchema = z.object({
  recommendationSource: z.literal('AI'),
  evidenceGoverned: z.literal(true),
  directorBriefApplied: z.boolean(),
  directorInstruction: z.string().trim().min(1).max(2000).nullable(),
});

export type CinematicDecisionProvenance = z.infer<
  typeof CinematicDecisionProvenanceSchema
>;
