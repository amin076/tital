import { z } from 'zod';

export const SceneProposalSchema = z.object({
  title: z.string().min(1, 'Scene title must be a non-empty string'),
  scriptLineIds: z.array(z.string().min(1)).min(1, 'Scene must reference at least one script line'),
  purpose: z.string().min(1, 'Scene purpose must be a non-empty string'),
  visualSummary: z.string().min(1, 'Scene visual summary must be a non-empty string'),
  uncertaintyDisclosure: z.string().min(1).nullable(),
});

export const SceneProposalListSchema = z.object({
  scenes: z.array(SceneProposalSchema).min(1).max(8),
});

export type SceneProposal = z.infer<typeof SceneProposalSchema>;
export type SceneProposalList = z.infer<typeof SceneProposalListSchema>;
