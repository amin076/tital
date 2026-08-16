import { z } from 'zod';
import { VisualIntegrityCategorySchema } from './shotRecord.js';

export const ShotProposalSchema = z.object({
  scriptLineIds: z.array(z.string().min(1)).min(1),
  description: z.string().min(1),
  cameraDirection: z.string().min(1),
  visualIntegrityCategory: VisualIntegrityCategorySchema,
  scientificConstraint: z.string().min(1),
  uncertaintyDisclosure: z.string().min(1).nullable(),
});

export const ShotProposalListSchema = z.object({
  shots: z.array(ShotProposalSchema).min(1).max(12),
});

export type ShotProposal = z.infer<typeof ShotProposalSchema>;
export type ShotProposalList = z.infer<typeof ShotProposalListSchema>;
