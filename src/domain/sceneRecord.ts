import { z } from 'zod';
import { CinematicDecisionProvenanceSchema } from './cinematicDecisionProvenance.js';

export const SceneRecordSchema = z.object({
  id: z.string().min(1, 'Scene ID must be a non-empty string'),
  researchQuestionId: z.string().min(1, 'ResearchQuestion ID must be a non-empty string'),
  scriptLineIds: z.array(z.string().min(1)).min(1, 'Scene must reference at least one approved script line'),
  title: z.string().min(1, 'Scene title must be a non-empty string'),
  purpose: z.string().min(1, 'Scene purpose must be a non-empty string'),
  visualSummary: z.string().min(1, 'Scene visual summary must be a non-empty string'),
  uncertaintyDisclosure: z.string().min(1).nullable(),
  decisionProvenance: CinematicDecisionProvenanceSchema.optional(),
  status: z.enum(['DRAFT', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'LOCKED', 'STALE']),
});

export type SceneRecord = z.infer<typeof SceneRecordSchema>;
