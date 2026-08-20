import { z } from 'zod';

export const CoverageWaiverStageSchema = z.enum([
  'RESEARCH',
  'EVIDENCE',
  'CLAIMS',
  'SCRIPT',
  'SCENES',
  'SHOTS',
  'VISUAL_DECISIONS',
]);

export const CoverageWaiverTargetTypeSchema = z.enum([
  'RESEARCH_QUESTION',
  'SCENE',
  'SHOT',
]);

export const CoverageWaiverSchema = z.object({
  id: z.string().min(1),
  stage: CoverageWaiverStageSchema,
  targetType: CoverageWaiverTargetTypeSchema,
  targetId: z.string().min(1),
  reason: z.string().min(1),
  rejectedRecordIds: z.array(z.string().min(1)).min(1),
  createdAt: z.string().min(1),
});

export type CoverageWaiverStage = z.infer<typeof CoverageWaiverStageSchema>;
export type CoverageWaiverTargetType = z.infer<typeof CoverageWaiverTargetTypeSchema>;
export type CoverageWaiver = z.infer<typeof CoverageWaiverSchema>;
