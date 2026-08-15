import { z } from 'zod';
import { VisualIntegrityCategorySchema } from './shotRecord.js';

export const VisualDecisionRecordSchema = z.object({
  id: z.string().min(1, 'VisualDecision ID must be a non-empty string'),
  researchQuestionId: z.string().min(1),
  shotId: z.string().min(1),
  category: VisualIntegrityCategorySchema,
  decision: z.string().min(1, 'Visual decision must be a non-empty string'),
  scientificConstraint: z.string().min(1, 'Scientific constraint must be a non-empty string'),
  disclosure: z.string().min(1).nullable(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['DRAFT', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'LOCKED']),
});

export type VisualDecisionRecord = z.infer<typeof VisualDecisionRecordSchema>;
