import { describe, expect, it } from 'vitest';
import type { EvidenceRecord } from '../src/domain/evidenceRecord.js';
import type { ResearchQuestion } from '../src/domain/researchQuestion.js';
import type { ReviewRecommendationProposalList } from '../src/domain/reviewRecommendation.js';
import type { SourceRecord } from '../src/domain/sourceRecord.js';
import {
  assembleReviewRecommendations,
  evaluateEvidenceReviewRecommendations,
  evaluateSourceReviewRecommendations,
  parseReviewRecommendationProposalList,
} from '../src/services/evaluateReviewRecommendations.js';

const question: ResearchQuestion = {
  id: 'RQ-1',
  filmBriefId: 'FB-1',
  question: 'Why is the sky blue?',
  purpose: 'Explain wavelength-dependent scattering in the atmosphere.',
  priority: 'HIGH',
  status: 'APPROVED',
};

const sourceA: SourceRecord = {
  id: 'SRC-1',
  researchQuestionId: 'RQ-1',
  provider: 'PARALLEL',
  providerSearchId: 'search-1',
  url: 'https://example.edu/sky-scattering',
  title: 'Atmospheric scattering explainer',
  publishDate: '2025-01-01',
  excerpts: ['Shorter visible wavelengths are scattered more strongly in the atmosphere.'],
  retrievedAt: '2026-08-23T00:00:00.000Z',
  status: 'DISCOVERED',
};

const sourceB: SourceRecord = {
  ...sourceA,
  id: 'SRC-2',
  url: 'https://example.com/blog/sky',
  title: 'Why the sky looks blue',
};

const approvedSource: SourceRecord = {
  ...sourceA,
  status: 'APPROVED',
};

const evidence: EvidenceRecord = {
  id: 'EV-1',
  sourceId: 'SRC-1',
  researchQuestionId: 'RQ-1',
  excerpt: 'Shorter visible wavelengths are scattered more strongly in the atmosphere.',
  interpretation: 'Blue light is scattered more strongly than longer visible wavelengths.',
  strength: 'HIGH',
  uncertainty: null,
  status: 'REVIEW_REQUIRED',
};

const proposals: ReviewRecommendationProposalList = {
  recommendations: [
    {
      candidateNumber: 1,
      recommendation: 'APPROVE_SUGGESTED',
      attention: 'LOW',
      confidence: 0.91,
      reasons: ['Relevant excerpt and apparently strong institutional source metadata.'],
      risks: [],
      flags: [],
    },
    {
      candidateNumber: 2,
      recommendation: 'REVIEW_REQUIRED',
      attention: 'HIGH',
      confidence: 0.77,
      reasons: ['Publisher authority is unclear from the supplied metadata.'],
      risks: ['Could be a secondary or low-authority source.'],
      flags: ['LOW_AUTHORITY'],
    },
  ],
};

describe('AI-assisted review recommendations', () => {
  it('maps model candidate numbers to application-owned source IDs', () => {
    let nextId = 0;
    const recommendations = assembleReviewRecommendations(
      'SOURCE',
      [sourceA, sourceB],
      proposals,
      {
        idFactory: () => `REV-${++nextId}`,
        now: () => '2026-08-23T01:00:00.000Z',
      }
    );

    expect(recommendations.map((item) => item.targetRecordId)).toEqual([
      'SRC-1',
      'SRC-2',
    ]);
    expect(recommendations[1].attention).toBe('HIGH');
    expect(recommendations[1].flags).toContain('LOW_AUTHORITY');
  });

  it('never mutates human review status when evaluating source candidates', async () => {
    const originalStatuses = [sourceA.status, sourceB.status];

    const recommendations = await evaluateSourceReviewRecommendations(
      question,
      [sourceA, sourceB],
      async () => proposals,
      {
        idFactory: () => 'REV-static',
        now: () => '2026-08-23T01:00:00.000Z',
      }
    );

    expect(recommendations).toHaveLength(2);
    expect([sourceA.status, sourceB.status]).toEqual(originalStatuses);
    expect(sourceA.status).toBe('DISCOVERED');
    expect(sourceB.status).toBe('DISCOVERED');
  });

  it('requires exactly one recommendation for every supplied candidate', () => {
    expect(() =>
      assembleReviewRecommendations(
        'SOURCE',
        [sourceA, sourceB],
        { recommendations: [proposals.recommendations[0]] }
      )
    ).toThrow(/for 2 candidate/);
  });

  it('accepts a bare model array and normalizes it to the recommendation envelope', () => {
    const parsed = parseReviewRecommendationProposalList(
      JSON.stringify([proposals.recommendations[0]])
    );

    expect(parsed.recommendations).toHaveLength(1);
    expect(parsed.recommendations[0].candidateNumber).toBe(1);
  });

  it('evaluates pending evidence without changing its human review status', async () => {
    const evidenceProposals: ReviewRecommendationProposalList = {
      recommendations: [
        {
          candidateNumber: 1,
          recommendation: 'APPROVE_SUGGESTED',
          attention: 'LOW',
          confidence: 0.88,
          reasons: ['Interpretation remains within the supplied excerpt.'],
          risks: [],
          flags: [],
        },
      ],
    };

    const recommendations = await evaluateEvidenceReviewRecommendations(
      question,
      approvedSource,
      [evidence],
      async () => evidenceProposals,
      {
        idFactory: () => 'REV-EV-1',
        now: () => '2026-08-23T01:00:00.000Z',
      }
    );

    expect(recommendations[0].targetRecordId).toBe('EV-1');
    expect(evidence.status).toBe('REVIEW_REQUIRED');
  });

  it('refuses evidence review assistance when its source is not approved', async () => {
    await expect(
      evaluateEvidenceReviewRecommendations(
        question,
        sourceA,
        [evidence],
        async () => ({ recommendations: [proposals.recommendations[0]] })
      )
    ).rejects.toThrow(/APPROVED SourceRecord/);
  });
});
