import { z } from 'zod';

export const EvidenceRecordSchema = z.object({
  id: z.string().min(1, 'Evidence ID must be a non-empty string'),
  sourceId: z.string().min(1, 'Source ID must be a non-empty string'),
  researchQuestionId: z.string().min(1, 'ResearchQuestion ID must be a non-empty string'),
  excerpt: z.string().min(1, 'Evidence excerpt must be a non-empty string'),
  interpretation: z.string().min(1, 'Evidence interpretation must be a non-empty string'),
  strength: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  uncertainty: z.string().min(1).nullable(),
  status: z.enum(['DRAFT', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED']),
});

export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;
