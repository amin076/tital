import { z } from 'zod';

export const DirectorCollaborationModeSchema = z.enum([
  'AI_ASSISTED',
  'COLLABORATIVE',
  'DIRECTOR_LED',
]);

export const DirectorPacingSchema = z.enum([
  'CONTEMPLATIVE',
  'BALANCED',
  'ENERGETIC',
]);

export const DirectorCameraMovementSchema = z.enum([
  'RESTRAINED',
  'BALANCED',
  'EXPRESSIVE',
]);

export const DirectorRepresentationPreferenceSchema = z.enum([
  'REAL_IMAGERY_FIRST',
  'BALANCED',
  'EXPLANATORY_VISUALS_FIRST',
]);

export const DirectorBriefSchema = z.object({
  collaborationMode: DirectorCollaborationModeSchema.default('COLLABORATIVE'),
  pacing: DirectorPacingSchema.default('BALANCED'),
  cameraMovement: DirectorCameraMovementSchema.default('BALANCED'),
  representationPreference: DirectorRepresentationPreferenceSchema.default('BALANCED'),
  visualStyle: z.string().trim().max(1200).optional(),
  notes: z.string().trim().max(2000).optional(),
  avoid: z.array(z.string().trim().min(1).max(240)).max(20).default([]),
});

export const CinematicGenerationContextSchema = z.object({
  directorBrief: DirectorBriefSchema.optional(),
  scopedInstruction: z.string().trim().min(1).max(2000).optional(),
  learnedPreferences: z
    .array(z.string().trim().min(1).max(2000))
    .max(50)
    .optional(),
});

export type DirectorBrief = z.infer<typeof DirectorBriefSchema>;
export type CinematicGenerationContext = z.infer<
  typeof CinematicGenerationContextSchema
>;
