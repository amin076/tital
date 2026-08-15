import { z } from 'zod';

export const VisualIntegrityCategorySchema = z.enum([
  'OBSERVATION',
  'EXPERIMENT',
  'SIMULATION',
  'SCIENTIFIC_RECONSTRUCTION',
  'SCHEMATIC',
  'ILLUSTRATION',
  'ANALOGY',
  'ARTIST_IMPRESSION',
  'CONCEPTUAL_VISUALIZATION',
]);

export const ShotRecordSchema = z.object({
  id: z.string().min(1, 'Shot ID must be a non-empty string'),
  researchQuestionId: z.string().min(1, 'ResearchQuestion ID must be a non-empty string'),
  sceneId: z.string().min(1, 'Scene ID must be a non-empty string'),
  scriptLineIds: z.array(z.string().min(1)).min(1, 'Shot must reference at least one approved script line'),
  description: z.string().min(1, 'Shot description must be a non-empty string'),
  cameraDirection: z.string().min(1, 'Camera direction must be a non-empty string'),
  visualIntegrityCategory: VisualIntegrityCategorySchema,
  scientificConstraint: z.string().min(1, 'Scientific constraint must be a non-empty string'),
  uncertaintyDisclosure: z.string().min(1).nullable(),
  status: z.enum(['DRAFT', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'LOCKED']),
});

export type ShotRecord = z.infer<typeof ShotRecordSchema>;
