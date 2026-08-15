import { z } from 'zod';

export const ClaimRecordSchema = z.object({
  id: z.string().min(1, 'Claim ID must be a non-empty string'),
  researchQuestionId: z.string().min(1, 'ResearchQuestion ID must be a non-empty string'),
  evidenceIds: z.array(z.string().min(1)).min(1, 'Claim must reference at least one evidence record'),
  text: z.string().min(1, 'Claim text must be a non-empty string'),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  uncertainty: z.string().min(1).nullable(),
  status: z.enum(['DRAFT', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED']),
});

export type ClaimRecord = z.infer<typeof ClaimRecordSchema>;
