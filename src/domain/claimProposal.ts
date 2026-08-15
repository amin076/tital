import { z } from 'zod';

export const ClaimProposalSchema = z.object({
  text: z.string().min(1, 'Claim text must be a non-empty string'),
  evidenceIds: z.array(z.string().min(1)).min(1, 'Claim must reference at least one evidence record'),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  uncertainty: z.string().min(1).nullable(),
});

export const ClaimProposalListSchema = z.object({
  claims: z.array(ClaimProposalSchema).min(1).max(8),
});

export type ClaimProposal = z.infer<typeof ClaimProposalSchema>;
export type ClaimProposalList = z.infer<typeof ClaimProposalListSchema>;
