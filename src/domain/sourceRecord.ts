import { z } from 'zod';

export const SourceRecordSchema = z.object({
  id: z.string().min(1, 'Source ID must be a non-empty string'),
  researchQuestionId: z.string().min(1, 'ResearchQuestion ID must be a non-empty string'),
  provider: z.literal('PARALLEL'),
  providerSearchId: z.string().min(1, 'Provider search ID must be a non-empty string'),
  url: z.string().url('Source URL must be valid'),
  title: z.string().min(1, 'Source title must be a non-empty string'),
  publishDate: z.string().nullable(),
  excerpts: z.array(z.string().min(1, 'Source excerpts must be non-empty strings')),
  retrievedAt: z.string().min(1, 'Retrieved-at timestamp must be a non-empty string'),
  status: z.enum(['DISCOVERED', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED']),
});

export type SourceRecord = z.infer<typeof SourceRecordSchema>;
