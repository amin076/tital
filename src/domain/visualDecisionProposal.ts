import { z } from 'zod';

export const VisualDecisionProposalSchema = z.object({
  decision: z.string().min(1),
  disclosure: z.string().min(1).nullable(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

export type VisualDecisionProposal = z.infer<typeof VisualDecisionProposalSchema>;
