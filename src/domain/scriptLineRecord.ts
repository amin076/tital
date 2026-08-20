import { z } from 'zod';

export const ScriptLineRecordSchema = z.object({
  id: z.string().min(1, 'ScriptLine ID must be a non-empty string'),
  researchQuestionId: z.string().min(1, 'ResearchQuestion ID must be a non-empty string'),
  claimIds: z.array(z.string().min(1)).min(1, 'Script line must reference at least one approved claim'),
  text: z.string().min(1, 'Script line text must be a non-empty string'),
  uncertaintyDisclosure: z.string().min(1).nullable(),
  status: z.enum(['DRAFT', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'LOCKED', 'STALE']),
});

export type ScriptLineRecord = z.infer<typeof ScriptLineRecordSchema>;
