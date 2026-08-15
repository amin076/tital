import { z } from 'zod';

export const ScriptLineProposalSchema = z.object({
  text: z.string().min(1, 'Script line text must be a non-empty string'),
  claimIds: z.array(z.string().min(1)).min(1, 'Script line must reference at least one approved claim'),
  uncertaintyDisclosure: z.string().min(1).nullable(),
});

export const ScriptLineProposalListSchema = z.object({
  scriptLines: z.array(ScriptLineProposalSchema).min(1).max(12),
});

export type ScriptLineProposal = z.infer<typeof ScriptLineProposalSchema>;
export type ScriptLineProposalList = z.infer<typeof ScriptLineProposalListSchema>;
