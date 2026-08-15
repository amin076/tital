import {
  VisualDecisionRecordSchema,
  type VisualDecisionRecord,
} from '../domain/visualDecisionRecord.js';

export type VisualDecisionReviewDecision = 'APPROVE' | 'REJECT';

export function reviewVisualDecision(
  visualDecision: VisualDecisionRecord,
  decision: VisualDecisionReviewDecision
): VisualDecisionRecord {
  const parsed = VisualDecisionRecordSchema.safeParse(visualDecision);
  if (!parsed.success) {
    throw new Error(`Invalid VisualDecisionRecord schema: ${parsed.error.message}`);
  }

  if (visualDecision.status !== 'REVIEW_REQUIRED') {
    throw new Error(
      `VisualDecisionRecord is not reviewable: expected REVIEW_REQUIRED, current status is "${visualDecision.status}".`
    );
  }

  return VisualDecisionRecordSchema.parse({
    ...visualDecision,
    status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
  });
}
