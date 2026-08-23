import { z } from 'zod';

export const ProductionReviewCategorySchema = z.enum([
  'SCIENTIFIC_FIDELITY',
  'EVIDENCE_COVERAGE',
  'UNCERTAINTY',
  'NARRATIVE',
  'PACING',
  'VISUAL_INTEGRITY',
  'DIRECTOR_ALIGNMENT',
  'AUDIENCE_FIT',
  'DUPLICATION',
  'OTHER',
]);

export const ProductionReviewSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const ProductionReviewTargetTypeSchema = z.enum([
  'PROJECT',
  'SourceRecord',
  'EvidenceRecord',
  'ClaimRecord',
  'ScriptLineRecord',
  'SceneRecord',
  'ShotRecord',
  'VisualDecisionRecord',
]);

export const ProductionReviewFindingProposalSchema = z.object({
  category: ProductionReviewCategorySchema,
  severity: ProductionReviewSeveritySchema,
  targetType: ProductionReviewTargetTypeSchema,
  targetNumber: z.number().int().positive().nullable(),
  title: z.string().trim().min(1).max(180),
  message: z.string().trim().min(1).max(1200),
  rationale: z.string().trim().min(1).max(1600),
  suggestedAction: z.string().trim().min(1).max(1200),
  confidence: z.number().min(0).max(1),
});

export const ProductionReviewProposalSchema = z.object({
  summary: z.string().trim().min(1).max(2400),
  overallRisk: ProductionReviewSeveritySchema,
  findings: z.array(ProductionReviewFindingProposalSchema).max(24),
});

export const ProductionReviewFindingSchema = ProductionReviewFindingProposalSchema.omit({
  targetNumber: true,
}).extend({
  id: z.string().min(1),
  targetRecordId: z.string().min(1).nullable(),
});

export const ProductionReviewReportSchema = z.object({
  id: z.string().min(1),
  productionPackageGeneratedAt: z.string().min(1),
  createdAt: z.string().min(1),
  model: z.string().min(1),
  summary: z.string().trim().min(1),
  overallRisk: ProductionReviewSeveritySchema,
  findings: z.array(ProductionReviewFindingSchema).max(24),
  advisoryOnly: z.literal(true),
});

export type ProductionReviewCategory = z.infer<typeof ProductionReviewCategorySchema>;
export type ProductionReviewSeverity = z.infer<typeof ProductionReviewSeveritySchema>;
export type ProductionReviewTargetType = z.infer<typeof ProductionReviewTargetTypeSchema>;
export type ProductionReviewFindingProposal = z.infer<typeof ProductionReviewFindingProposalSchema>;
export type ProductionReviewProposal = z.infer<typeof ProductionReviewProposalSchema>;
export type ProductionReviewFinding = z.infer<typeof ProductionReviewFindingSchema>;
export type ProductionReviewReport = z.infer<typeof ProductionReviewReportSchema>;
