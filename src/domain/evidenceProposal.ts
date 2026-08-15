import { z } from 'zod';

const INVALID_UNCERTAINTY_PLACEHOLDERS = new Set([
  'null',
  'none',
  'n/a',
  'na',
  'unknown',
  'not applicable',
  'no uncertainty',
]);

export const EvidenceUncertaintySchema = z
  .string()
  .trim()
  .min(1, 'Evidence uncertainty must be a non-empty string when present')
  .refine(
    (value) => !INVALID_UNCERTAINTY_PLACEHOLDERS.has(value.toLowerCase()),
    'Evidence uncertainty must be a substantive limitation or the JSON value null'
  )
  .nullable();

export const EvidenceProposalSchema = z.object({
  excerpt: z.string().min(1, 'Evidence excerpt must be a non-empty string'),
  interpretation: z.string().min(1, 'Evidence interpretation must be a non-empty string'),
  strength: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  uncertainty: EvidenceUncertaintySchema,
});

export const EvidenceProposalListSchema = z.object({
  evidence: z.array(EvidenceProposalSchema).min(1).max(8),
});

export type EvidenceProposal = z.infer<typeof EvidenceProposalSchema>;
export type EvidenceProposalList = z.infer<typeof EvidenceProposalListSchema>;
