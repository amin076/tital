import { describe, expect, it } from 'vitest';
import { EvidenceRecordSchema } from '../src/domain/evidenceRecord.js';

describe('Phase 5A evidence record contract', () => {
  const validEvidence = {
    id: 'EV-1',
    sourceId: 'SRC-1',
    researchQuestionId: 'RQ-1',
    excerpt: 'Galileo magnetic measurements are consistent with a conductive layer beneath Europa.',
    interpretation: 'The measurement supports a salty subsurface ocean as the most plausible conductive layer.',
    strength: 'HIGH' as const,
    uncertainty: 'The measurement is indirect and does not by itself image the ocean.',
    status: 'REVIEW_REQUIRED' as const,
  };

  it('accepts a provenance-linked evidence record', () => {
    expect(EvidenceRecordSchema.parse(validEvidence)).toEqual(validEvidence);
  });

  it('requires source provenance', () => {
    expect(() => EvidenceRecordSchema.parse({ ...validEvidence, sourceId: '' })).toThrow();
  });

  it('requires a non-empty evidence excerpt', () => {
    expect(() => EvidenceRecordSchema.parse({ ...validEvidence, excerpt: '' })).toThrow();
  });

  it('allows explicit uncertainty to be absent only as null', () => {
    expect(EvidenceRecordSchema.parse({ ...validEvidence, uncertainty: null }).uncertainty).toBeNull();
  });

  it('rejects evidence that skips the human-review lifecycle', () => {
    expect(() => EvidenceRecordSchema.parse({ ...validEvidence, status: 'LOCKED' })).toThrow();
  });
});
