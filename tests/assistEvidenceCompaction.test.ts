import { describe, expect, it } from 'vitest';
import type { MvpSession } from '../src/domain/mvpSession.js';
import type { ReviewEvaluatorModelCaller } from '../src/services/evaluateReviewRecommendations.js';
import { assistMvpReview } from '../src/services/assistMvpReview.js';

function largeEvidenceSession(): MvpSession {
  return {
    id: 'SESSION-COMPACT',
    rawIdea: 'Explain auroras.',
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z',
    state: {
      filmBrief: {
        id: 'FB-1',
        title: 'Aurora',
        scientificTopic: 'Space physics',
        scientificQuestion: 'How do auroras form?',
        communicationObjective: 'Explain the evidence chain.',
        targetAudience: 'General public',
        audienceKnowledgeLevel: 'Introductory',
        format: 'Popular-science short',
        durationMinutes: 5,
        tone: 'Clear',
        learningGoals: ['Understand auroras'],
        scope: ['Aurora'],
        outOfScope: [],
        constraints: ['Preserve uncertainty'],
        researchRequirements: ['Use authoritative sources'],
        status: 'APPROVED',
      },
      researchQuestions: [{
        id: 'RQ-1',
        filmBriefId: 'FB-1',
        question: 'What observations connect solar activity and auroras?',
        purpose: 'Ground the film.',
        priority: 'HIGH',
        status: 'APPROVED',
      }],
      sources: Array.from({ length: 10 }, (_, index) => ({
        id: `SRC-${index + 1}`,
        researchQuestionId: 'RQ-1',
        provider: 'PARALLEL' as const,
        providerSearchId: null,
        url: `https://example.com/${index + 1}`,
        title: `Source ${index + 1}`,
        publishDate: null,
        excerpts: ['Discovery excerpt'],
        retrievedAt: '2026-08-24T00:00:00.000Z',
        status: 'APPROVED' as const,
      })),
      evidence: Array.from({ length: 30 }, (_, index) => ({
        id: `EV-${index + 1}`,
        sourceId: `SRC-${(index % 10) + 1}`,
        researchQuestionId: 'RQ-1',
        excerpt: `Distinct observation ${index + 1} about solar-terrestrial coupling.`,
        interpretation: `Interpretation ${index + 1}.`,
        strength: index < 20 ? 'HIGH' as const : 'MEDIUM' as const,
        uncertainty: index % 3 === 0 ? 'Scope is limited to the reported measurement.' : null,
        grounding: {
          mode: 'PARALLEL_WEB_FETCH' as const,
          provider: 'PARALLEL' as const,
          sourceUrl: `https://example.com/${(index % 10) + 1}`,
          fetchedAt: '2026-08-24T00:01:00.000Z',
          discoveryExcerptUsedAsGrounding: false as const,
        },
        status: 'REVIEW_REQUIRED' as const,
      })),
      claims: [],
      scriptLines: [],
      scenes: [],
      shots: [],
      visualDecisions: [],
      coverageWaivers: [],
      audit: null,
    },
    productionPackage: null,
    events: [],
  };
}

const modelCaller: ReviewEvaluatorModelCaller = async (request) => ({
  recommendations: request.candidates.map((_, index) => ({
    candidateNumber: index + 1,
    recommendation: 'APPROVE_SUGGESTED',
    attention: 'LOW',
    confidence: 0.9,
    reasons: ['Strong candidate.'],
    risks: [],
    flags: [],
  })),
});

describe('AI-assisted evidence compaction', () => {
  it('keeps the full pool but sends only the adaptive subset to Gemini and the human gate', async () => {
    const assisted = await assistMvpReview(largeEvidenceSession(), {
      modelCaller,
      now: () => '2026-08-24T01:00:00.000Z',
    });

    expect(assisted.state.evidence).toHaveLength(30);
    expect(assisted.state.evidence.filter((record) => record.status === 'REVIEW_REQUIRED')).toHaveLength(24);
    expect(assisted.state.evidence.filter((record) => record.status === 'ARCHIVED_CANDIDATE')).toHaveLength(6);
    expect(assisted.reviewRecommendations).toHaveLength(24);
    expect(assisted.events.at(-1)?.message).toContain('promoted 24 for human review');
    expect(assisted.events.at(-1)?.message).toContain('archived 6');
  });
});
