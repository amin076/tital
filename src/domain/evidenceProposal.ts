import { z } from 'zod';

export const EvidenceProposalSchema = z.object({
  excerpt: z.string().min(1, 'Evidence excerpt must be a non-empty string'),
  interpretation: z.string().min(1, 'Evidence interpretation must be a non-empty string'),
  strength: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  uncertainty: z.string().min(1).nullable(),
});

export const EvidenceProposalListSchema = z.object({
  evidence: z.array(EvidenceProposalSchema).min(1).max(8),
});

export type EvidenceProposal = z.infer<typeof EvidenceProposalSchema>;
export type EvidenceProposalList = z.infer<typeof EvidenceProposalListSchema>;
