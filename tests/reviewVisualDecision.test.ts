import { describe, expect, it } from 'vitest';
import { type VisualDecisionRecord } from '../src/domain/visualDecisionRecord.js';
import { reviewVisualDecision } from '../src/services/reviewVisualDecision.js';

const reviewRequired: VisualDecisionRecord = {
  id: 'VD-1',
  researchQuestionId: 'RQ-1',
  shotId: 'SH-1',
  category: 'SCIENTIFIC_RECONSTRUCTION',
  decision: 'Show a labelled cutaway beneath the ice shell.',
  scientificConstraint: 'Do not present exact geometry as directly observed.',
  disclosure: 'Scientific reconstruction based on multiple lines of evidence.',
  riskLevel: 'MEDIUM',
  status: 'REVIEW_REQUIRED',
};

describe('VisualDecision review workflow', () => {
  it('approves a review-required visual decision', () => {
    expect(reviewVisualDecision(reviewRequired, 'APPROVE').status).toBe('APPROVED');
  });

  it('rejects a review-required visual decision', () => {
    expect(reviewVisualDecision(reviewRequired, 'REJECT').status).toBe('REJECTED');
  });

  it('does not allow an already approved decision to be reviewed again', () => {
    expect(() =>
      reviewVisualDecision({ ...reviewRequired, status: 'APPROVED' }, 'APPROVE')
    ).toThrow('not reviewable');
  });
});
