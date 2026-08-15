import { describe, expect, it } from 'vitest';
import { type EvidenceRecord } from '../src/domain/evidenceRecord.js';
import { reviewEvidence } from '../src/services/reviewEvidence.js';

const reviewRequired: EvidenceRecord = {
  id: 'EVID-1',
  sourceId: 'SRC-1',
  researchQuestionId: 'RQ-1',
  excerpt: 'Galileo magnetic measurements imply an electrically conductive layer.',
  interpretation: 'This supports a salty subsurface ocean.',
  strength: 'HIGH',
  uncertainty: 'The magnetic signature is indirect evidence.',
  status: 'REVIEW_REQUIRED',
};

describe('evidence review workflow', () => {
  it('approves review-required evidence', () => {
    expect(reviewEvidence(reviewRequired, 'APPROVE').status).toBe('APPROVED');
  });

  it('rejects review-required evidence', () => {
    expect(reviewEvidence(reviewRequired, 'REJECT').status).toBe('REJECTED');
  });

  it('does not allow already approved evidence to be reviewed again', () => {
    expect(() => reviewEvidence({ ...reviewRequired, status: 'APPROVED' }, 'REJECT')).toThrow(
      'EvidenceRecord is not reviewable'
    );
  });
});
