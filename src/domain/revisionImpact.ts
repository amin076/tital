import { z } from 'zod';
import { RevisionTargetTypeSchema, RevisionTypeSchema } from './revisionRequest.js';

export const RevisionImpactCountsSchema = z.object({
  researchQuestions: z.number().int().min(0),
  sources: z.number().int().min(0),
  evidence: z.number().int().min(0),
  claims: z.number().int().min(0),
  scriptLines: z.number().int().min(0),
  scenes: z.number().int().min(0),
  shots: z.number().int().min(0),
  visualDecisions: z.number().int().min(0),
});

export const RevisionImpactSchema = z.object({
  revisionId: z.string().min(1),
  type: RevisionTypeSchema,
  targetType: RevisionTargetTypeSchema,
  targetRecordId: z.string().min(1).nullable(),
  affectedRecordIds: z.array(z.string().min(1)),
  counts: RevisionImpactCountsSchema,
  invalidatesAudit: z.boolean(),
  invalidatesProductionPackage: z.boolean(),
  preservedLayers: z.array(z.string().min(1)),
  affectedLayers: z.array(z.string().min(1)),
  summary: z.string().min(1),
});

export type RevisionImpactCounts = z.infer<typeof RevisionImpactCountsSchema>;
export type RevisionImpact = z.infer<typeof RevisionImpactSchema>;
