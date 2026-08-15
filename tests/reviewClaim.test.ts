import { describe, expect, it } from 'vitest';
import { type ClaimRecord } from '../src/domain/claimRecord.js';
import { reviewClaim } from '../src/services/reviewClaim.js';

const reviewableClaim: ClaimRecord = {
  id: 'CL-europa-magnetic',
  researchQuestionId: 'RQ-europa-ocean',
  evidenceIds: ['EV-magnetic'],
  text: 'Galileo magnetic measurements provide strong evidence for a conductive subsurface layer on Europa.',
  confidence: 'HIGH',
  uncertainty: 'The measurement does not by itself establish exact composition or global extent.',
  status: 'REVIEW_REQUIRED',
};

describe('Claim human review workflow', () => {
  it('approves a review-required claim', () => {
    const approved = reviewClaim(reviewableClaim, 'APPROVE');
    expect(approved.status).toBe('APPROVED');
    expect(approved.id).toBe(reviewableClaim.id);
    expect(approved.evidenceIds).toEqual(reviewableClaim.evidenceIds);
  });

  it('rejects a review-required claim', () => {
    const rejected = reviewClaim(reviewableClaim, 'REJECT');
    expect(rejected.status).toBe('REJECTED');
  });

  it('does not re-review an already approved claim', () => {
    expect(() => reviewClaim({ ...reviewableClaim, status: 'APPROVED' }, 'REJECT')).toThrow(
      'ClaimRecord is not reviewable'
    );
  });

  it('rejects invalid claim records before applying a decision', () => {
    expect(() =>
      reviewClaim({ ...reviewableClaim, evidenceIds: [] } as ClaimRecord, 'APPROVE')
    ).toThrow('Invalid ClaimRecord schema');
  });
});
