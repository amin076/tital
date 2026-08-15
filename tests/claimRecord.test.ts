import { describe, expect, it } from 'vitest';
import { ClaimRecordSchema } from '../src/domain/claimRecord.js';

const validClaim = {
  id: 'CLM-1',
  researchQuestionId: 'RQ-1',
  evidenceIds: ['EVID-1'],
  text: 'Europa likely contains a global salty subsurface ocean.',
  confidence: 'HIGH' as const,
  uncertainty: 'The evidence is indirect and the ocean properties remain uncertain.',
  status: 'REVIEW_REQUIRED' as const,
};

describe('ClaimRecordSchema', () => {
  it('accepts a claim with explicit evidence provenance', () => {
    expect(ClaimRecordSchema.parse(validClaim)).toEqual(validClaim);
  });

  it('requires at least one evidence record', () => {
    expect(() => ClaimRecordSchema.parse({ ...validClaim, evidenceIds: [] })).toThrow();
  });

  it('rejects an unsupported workflow status', () => {
    expect(() => ClaimRecordSchema.parse({ ...validClaim, status: 'LOCKED' })).toThrow();
  });
});
