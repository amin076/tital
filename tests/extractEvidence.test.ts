import { describe, expect, it, vi } from 'vitest';
import { type ResearchQuestion } from '../src/domain/researchQuestion.js';
import { type SourceRecord } from '../src/domain/sourceRecord.js';
import {
  assembleEvidenceRecords,
  extractEvidence,
  parseEvidenceProposalList,
  validateSourceForEvidence,
} from '../src/services/extractEvidence.js';

const approvedQuestion: ResearchQuestion = {
  id: 'RQ-europa-ocean',
  filmBriefId: 'FB-europa',
  question: 'What evidence supports a subsurface ocean on Europa?',
  purpose: 'Ground the film in observed evidence.',
  priority: 'HIGH',
  status: 'APPROVED',
};

const approvedSource: SourceRecord = {
  id: 'SRC-nasa-europa',
  researchQuestionId: approvedQuestion.id,
  provider: 'PARALLEL',
  providerSearchId: 'search-123',
  url: 'https://science.nasa.gov/mission/europa-clipper/why-europa-evidence-for-an-ocean/',
  title: 'Why Europa: Evidence for an Ocean',
  publishDate: null,
  excerpts: [
    'Galileo measurements strongly implied an electrically conductive fluid beneath Europa’s surface.',
  ],
  retrievedAt: '2026-08-15T00:00:00.000Z',
  status: 'APPROVED',
};

const proposals = {
  evidence: [
    {
      excerpt:
        'Galileo measurements strongly implied an electrically conductive fluid beneath Europa’s surface.',
      interpretation:
        'The measurement supports the presence of a conductive subsurface layer consistent with liquid material.',
      strength: 'HIGH' as const,
      uncertainty:
        'The excerpt supports a conductive subsurface layer but does not by itself prove composition or global extent.',
    },
  ],
};

describe('Source → Evidence governed extraction', () => {
  it('parses valid structured evidence proposals', () => {
    expect(parseEvidenceProposalList(JSON.stringify(proposals))).toEqual(proposals);
  });

  it('normalizes a valid bare evidence array returned by the model', () => {
    expect(parseEvidenceProposalList(JSON.stringify(proposals.evidence))).toEqual(proposals);
  });

  it('still rejects malformed items inside a bare evidence array', () => {
    expect(() =>
      parseEvidenceProposalList(
        JSON.stringify([{ ...proposals.evidence[0], strength: 'VERY_HIGH' }])
      )
    ).toThrow('Evidence proposal validation failed');
  });

  it('rejects malformed evidence JSON', () => {
    expect(() => parseEvidenceProposalList('{bad-json')).toThrow('malformed JSON');
  });

  it('rejects non-approved sources before model invocation', async () => {
    const source = { ...approvedSource, status: 'REVIEW_REQUIRED' as const };
    const modelCaller = vi.fn(async () => proposals);

    await expect(extractEvidence(source, approvedQuestion, modelCaller)).rejects.toThrow(
      'SourceRecord is not approved'
    );
    expect(modelCaller).not.toHaveBeenCalled();
  });

  it('rejects source/question provenance mismatches', () => {
    const source = { ...approvedSource, researchQuestionId: 'RQ-other' };
    expect(() => validateSourceForEvidence(source, approvedQuestion)).toThrow(
      'researchQuestionId mismatch'
    );
  });

  it('assembles application-owned EvidenceRecords in REVIEW_REQUIRED state', () => {
    const records = assembleEvidenceRecords(approvedSource, proposals, {
      idFactory: () => 'EV-fixed',
    });

    expect(records).toEqual([
      {
        id: 'EV-fixed',
        sourceId: approvedSource.id,
        researchQuestionId: approvedQuestion.id,
        excerpt: proposals.evidence[0].excerpt,
        interpretation: proposals.evidence[0].interpretation,
        strength: 'HIGH',
        uncertainty: proposals.evidence[0].uncertainty,
        status: 'REVIEW_REQUIRED',
      },
    ]);
  });

  it('returns validated evidence records for approved provenance', async () => {
    const modelCaller = vi.fn(async () => proposals);

    const records = await extractEvidence(approvedSource, approvedQuestion, modelCaller, {
      idFactory: () => 'EV-1',
    });

    expect(modelCaller).toHaveBeenCalledOnce();
    expect(records[0]).toMatchObject({
      id: 'EV-1',
      sourceId: approvedSource.id,
      researchQuestionId: approvedQuestion.id,
      status: 'REVIEW_REQUIRED',
    });
  });

  it('rejects invalid model proposal structure', () => {
    expect(() =>
      assembleEvidenceRecords(
        approvedSource,
        { evidence: [{ ...proposals.evidence[0], strength: 'VERY_HIGH' }] } as never
      )
    ).toThrow();
  });
});
