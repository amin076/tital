import { describe, expect, it } from 'vitest';
import { EvidenceProposalSchema } from '../src/domain/evidenceProposal.js';

describe('Evidence proposal uncertainty governance', () => {
  const validProposal = {
    excerpt: 'Galileo magnetic measurements are consistent with a conductive layer beneath Europa.',
    interpretation: 'The measurement supports a conductive subsurface layer and is consistent with a salty ocean interpretation.',
    strength: 'HIGH' as const,
    uncertainty: 'The measurement detects magnetic induction rather than directly observing liquid water.',
  };

  it('accepts substantive uncertainty', () => {
    expect(EvidenceProposalSchema.parse(validProposal)).toEqual(validProposal);
  });

  it('accepts JSON null when there is no material uncertainty to disclose', () => {
    expect(EvidenceProposalSchema.parse({ ...validProposal, uncertainty: null }).uncertainty).toBeNull();
  });

  it.each(['null', 'NULL', 'None', 'N/A', 'NA', 'unknown', 'not applicable', 'no uncertainty']) (
    'rejects placeholder uncertainty value %s',
    (uncertainty) => {
      expect(() => EvidenceProposalSchema.parse({ ...validProposal, uncertainty })).toThrow();
    }
  );

  it('rejects blank uncertainty strings', () => {
    expect(() => EvidenceProposalSchema.parse({ ...validProposal, uncertainty: '   ' })).toThrow();
  });
});
