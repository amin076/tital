import { describe, expect, it } from 'vitest';
import type { MvpSession } from '../src/domain/mvpSession.js';
import type { ReviewEvaluatorModelCaller } from '../src/services/evaluateReviewRecommendations.js';
import { assistMvpReview } from '../src/services/assistMvpReview.js';

function baseFilmBrief() {
  return {
    id: 'FB-1',
    title: 'Why the sky is blue',
    scientificTopic: 'Atmospheric optics',
    scientificQuestion: 'Why is the daytime sky blue?',
    communicationObjective: 'Explain Rayleigh scattering.',
    targetAudience: 'Public',
    audienceKnowledgeLevel: 'Introductory',
    format: 'Short documentary',
    durationMinutes: 5,
    tone: 'Scientific',
    learningGoals: ['Understand scattering'],
    scope: ['Visible light'],
    outOfScope: ['Advanced quantum optics'],
    constraints: ['Preserve uncertainty'],
    researchRequirements: ['Use scientific sources'],
    status: 'APPROVED' as const,
  };
}

function baseQuestion() {
  return {
    id: 'RQ-1',
    filmBriefId: 'FB-1',
    question: 'How does wavelength affect atmospheric scattering?',
    purpose: 'Ground the explanation.',
    priority: 'HIGH' as const,
    status: 'APPROVED' as const,
  };
}

function emptyTail() {
  return {
    claims: [],
    scriptLines: [],
    scenes: [],
    shots: [],
    visualDecisions: [],
    coverageWaivers: [],
    audit: null,
  };
}

function sourceGateSession(): MvpSession {
  return {
    id: 'SESSION-1',
    rawIdea: 'Why is the sky blue?',
    createdAt: '2026-08-23T00:00:00.000Z',
    updatedAt: '2026-08-23T00:00:00.000Z',
    state: {
      filmBrief: baseFilmBrief(),
      researchQuestions: [baseQuestion()],
      sources: [
        {
          id: 'SRC-1',
          researchQuestionId: 'RQ-1',
          provider: 'PARALLEL',
          providerSearchId: 'search-1',
          url: 'https://science.example/source',
          title: 'Atmospheric scattering study',
          publishDate: '2025-01-01',
          excerpts: ['Shorter visible wavelengths are scattered more strongly.'],
          retrievedAt: '2026-08-23T00:00:00.000Z',
          status: 'DISCOVERED',
        },
      ],
      evidence: [],
      ...emptyTail(),
    },
    productionPackage: null,
    events: [],
  };
}

function evidenceGateSession(): MvpSession {
  const source = sourceGateSession();
  source.state.sources[0] = { ...source.state.sources[0]!, status: 'APPROVED' };
  source.state.evidence = [
    {
      id: 'EV-1',
      sourceId: 'SRC-1',
      researchQuestionId: 'RQ-1',
      excerpt: 'Shorter visible wavelengths are scattered more strongly.',
      interpretation: 'Blue light is scattered more strongly than red light under Rayleigh-like conditions.',
      strength: 'HIGH',
      uncertainty: 'The supplied excerpt does not by itself quantify the full observed sky spectrum.',
      status: 'REVIEW_REQUIRED',
    },
  ];
  return source;
}

const sourceModelCaller: ReviewEvaluatorModelCaller = async (request) => ({
  recommendations: request.candidates.map((_, index) => ({
    candidateNumber: index + 1,
    recommendation: 'APPROVE_SUGGESTED',
    attention: 'LOW',
    confidence: 0.91,
    reasons: ['Relevant scientific material is visible in the supplied metadata and excerpt.'],
    risks: [],
    flags: [],
  })),
});

const evidenceModelCaller: ReviewEvaluatorModelCaller = async (request) => ({
  recommendations: request.candidates.map((_, index) => ({
    candidateNumber: index + 1,
    recommendation: 'REVIEW_REQUIRED',
    attention: 'HIGH',
    confidence: 0.82,
    reasons: ['The interpretation is plausible but should be checked against the supplied wording.'],
    risks: ['The interpretation adds a comparison not stated verbatim in the excerpt.'],
    flags: ['OVERSTATEMENT_RISK'],
  })),
});

describe('assistMvpReview', () => {
  it('persists source recommendations without changing trusted review status', async () => {
    const session = sourceGateSession();
    const assisted = await assistMvpReview(session, {
      modelCaller: sourceModelCaller,
      now: () => '2026-08-23T01:00:00.000Z',
      eventIdFactory: () => 'EVT-review-1',
      recommendationIdFactory: () => 'REV-1',
    });

    expect(assisted.state.sources[0]?.status).toBe('DISCOVERED');
    expect(assisted.reviewRecommendations).toHaveLength(1);
    expect(assisted.reviewRecommendations?.[0]).toMatchObject({
      id: 'REV-1',
      targetType: 'SOURCE',
      targetRecordId: 'SRC-1',
      recommendation: 'APPROVE_SUGGESTED',
      attention: 'LOW',
    });
    expect(assisted.events.at(-1)).toMatchObject({
      id: 'EVT-review-1',
      type: 'REVIEW_ASSISTED',
      stage: 'RESEARCH',
    });
    expect(assisted.events.at(-1)?.message).toContain('Human approval status was not changed');
  });

  it('evaluates pending evidence while preserving REVIEW_REQUIRED status', async () => {
    const assisted = await assistMvpReview(evidenceGateSession(), {
      modelCaller: evidenceModelCaller,
      now: () => '2026-08-23T01:00:00.000Z',
      eventIdFactory: () => 'EVT-review-2',
      recommendationIdFactory: () => 'REV-2',
    });

    expect(assisted.state.evidence[0]?.status).toBe('REVIEW_REQUIRED');
    expect(assisted.reviewRecommendations?.[0]).toMatchObject({
      targetType: 'EVIDENCE',
      targetRecordId: 'EV-1',
      recommendation: 'REVIEW_REQUIRED',
      attention: 'HIGH',
      flags: ['OVERSTATEMENT_RISK'],
    });
  });

  it('replaces the latest recommendation for the same candidate instead of accumulating duplicates', async () => {
    const first = await assistMvpReview(sourceGateSession(), {
      modelCaller: sourceModelCaller,
      now: () => '2026-08-23T01:00:00.000Z',
      recommendationIdFactory: () => 'REV-old',
    });

    const second = await assistMvpReview(first, {
      modelCaller: async () => ({
        recommendations: [{
          candidateNumber: 1,
          recommendation: 'REVIEW_REQUIRED',
          attention: 'MEDIUM',
          confidence: 0.7,
          reasons: ['A second pass found a point that deserves human inspection.'],
          risks: [],
          flags: ['AMBIGUOUS'],
        }],
      }),
      now: () => '2026-08-23T02:00:00.000Z',
      recommendationIdFactory: () => 'REV-new',
    });

    expect(second.reviewRecommendations).toHaveLength(1);
    expect(second.reviewRecommendations?.[0]?.id).toBe('REV-new');
    expect(second.state.sources[0]?.status).toBe('DISCOVERED');
  });

  it('refuses review assistance when there is no active human gate or ready production package', async () => {
    const session = sourceGateSession();
    session.state.sources[0] = { ...session.state.sources[0]!, status: 'APPROVED' };
    session.state.evidence = [];

    await expect(assistMvpReview(session, { modelCaller: sourceModelCaller })).rejects.toThrow(
      'requires an active human-review gate'
    );
  });
});
