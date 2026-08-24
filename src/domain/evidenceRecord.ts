import { z } from 'zod';
import { EvidenceUncertaintySchema } from './evidenceProposal.js';

export const EvidenceGroundingSchema = z.object({
  mode: z.literal('PARALLEL_WEB_FETCH'),
  provider: z.literal('PARALLEL'),
  sourceUrl: z.string().url(),
  fetchedAt: z.string().min(1),
  discoveryExcerptUsedAsGrounding: z.literal(false),
});

export const EvidenceRecordSchema = z.object({
  id: z.string().min(1, 'Evidence ID must be a non-empty string'),
  sourceId: z.string().min(1, 'Source ID must be a non-empty string'),
  researchQuestionId: z.string().min(1, 'ResearchQuestion ID must be a non-empty string'),
  excerpt: z.string().min(1, 'Evidence excerpt must be a non-empty string'),
  interpretation: z.string().min(1, 'Evidence interpretation must be a non-empty string'),
  strength: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  uncertainty: EvidenceUncertaintySchema,
  grounding: EvidenceGroundingSchema.optional(),
  // ARCHIVED_CANDIDATE preserves broad machine research without forcing every
  // extracted proposition through the human gate or downstream production chain.
  status: z.enum([
    'DRAFT',
    'REVIEW_REQUIRED',
    'ARCHIVED_CANDIDATE',
    'APPROVED',
    'REJECTED',
    'STALE',
  ]),
});

export type EvidenceGrounding = z.infer<typeof EvidenceGroundingSchema>;
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;
