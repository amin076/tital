import { z } from 'zod';

export const ReviewTargetTypeSchema = z.enum([
  'FILM_BRIEF',
  'RESEARCH_QUESTION',
  'SOURCE',
  'EVIDENCE',
  'CLAIM',
  'SCRIPT',
  'SCENE',
  'SHOT',
  'VISUAL',
]);

export const ReviewRecommendationDecisionSchema = z.enum([
  'APPROVE_SUGGESTED',
  'REJECT_SUGGESTED',
  'REVIEW_REQUIRED',
]);

export const ReviewAttentionSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const ReviewFlagSchema = z.enum([
  'LOW_AUTHORITY',
  'WEAK_RELEVANCE',
  'DUPLICATE',
  'PROMOTIONAL',
  'OUTDATED',
  'WEAK_SUPPORT',
  'OVERSTATEMENT_RISK',
  'UNCERTAINTY_RISK',
  'CONTRADICTION_RISK',
  'AMBIGUOUS',
  'AUDIENCE_MISMATCH',
  'PACING_RISK',
  'NARRATIVE_REDUNDANCY',
  'DIRECTOR_CONSTRAINT_RISK',
  'VISUAL_INTEGRITY_RISK',
  'PROVENANCE_RISK',
  'UNSUPPORTED_ADDITION',
  'COVERAGE_RISK',
  'OTHER',
]);

export const ReviewRecommendationProposalSchema = z.object({
  candidateNumber: z.number().int().positive(),
  recommendation: ReviewRecommendationDecisionSchema,
  attention: ReviewAttentionSchema,
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string().trim().min(1).max(500)).min(1).max(6),
  risks: z.array(z.string().trim().min(1).max(500)).max(6),
  flags: z.array(ReviewFlagSchema).max(8),
});

export const ReviewRecommendationProposalListSchema = z.object({
  recommendations: z.array(ReviewRecommendationProposalSchema).min(1).max(50),
});

export const ReviewRecommendationSchema = z.object({
  id: z.string().min(1),
  targetType: ReviewTargetTypeSchema,
  targetRecordId: z.string().min(1),
  recommendation: ReviewRecommendationDecisionSchema,
  attention: ReviewAttentionSchema,
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string().trim().min(1).max(500)).min(1).max(6),
  risks: z.array(z.string().trim().min(1).max(500)).max(6),
  flags: z.array(ReviewFlagSchema).max(8),
  createdAt: z.string().min(1),
  model: z.string().min(1),
});

export type ReviewTargetType = z.infer<typeof ReviewTargetTypeSchema>;
export type ReviewRecommendationDecision = z.infer<
  typeof ReviewRecommendationDecisionSchema
>;
export type ReviewAttention = z.infer<typeof ReviewAttentionSchema>;
export type ReviewFlag = z.infer<typeof ReviewFlagSchema>;
export type ReviewRecommendationProposal = z.infer<
  typeof ReviewRecommendationProposalSchema
>;
export type ReviewRecommendationProposalList = z.infer<
  typeof ReviewRecommendationProposalListSchema
>;
export type ReviewRecommendation = z.infer<typeof ReviewRecommendationSchema>;
