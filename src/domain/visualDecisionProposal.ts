import { z } from 'zod';
import { VisualIntegrityCategorySchema } from './shotRecord.js';

export const VisualDecisionProposalSchema = z.object({
  category: VisualIntegrityCategorySchema,
  decision: z.string().min(1),
  scientificConstraint: z.string().min(1),
  disclosure: z.string().min(1).nullable(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

export type VisualDecisionProposal = z.infer<typeof VisualDecisionProposalSchema>;
