import { describe, expect, it } from 'vitest';
import type { EvidenceRecord } from '../src/domain/evidenceRecord.js';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import {
  applyAdaptiveEvidenceBudget,
  targetEvidenceBudget,
} from '../src/services/evidenceBudget.js';

function makeState(): MvpWorkflowState {
  const priorities = ['HIGH', 'HIGH', 'MEDIUM', 'MEDIUM', 'LOW'] as const;
  const researchQuestions = priorities.map((priority, index) => ({
    id: `RQ-${index + 1}`,
    filmBriefId: 'FB-1',
    question: `Question ${index + 1}`,
    purpose: 'Test adaptive evidence budgeting.',
    priority,
    status: 'APPROVED' as const,
  }));
  const sources = researchQuestions.flatMap((question, questionIndex) =>
    Array.from({ length: 3 }, (_, sourceIndex) => ({
      id: `SRC-${questionIndex + 1}-${sourceIndex + 1}`,
      researchQuestionId: question.id,
      provider: 'PARALLEL' as const,
      providerSearchId: null,
      url: `https://example.com/${questionIndex + 1}/${sourceIndex + 1}`,
      title: `Source ${questionIndex + 1}-${sourceIndex + 1}`,
      publishDate: null,
      excerpts: ['Discovery only'],
      retrievedAt: '2026-08-24T00:00:00.000Z',
      status: 'APPROVED' as const,
    }))
  );
  const evidence: EvidenceRecord[] = researchQuestions.flatMap((question, questionIndex) =>
    Array.from({ length: 6 }, (_, evidenceIndex) => ({
      id: `EV-${questionIndex + 1}-${evidenceIndex + 1}`,
      sourceId: `SRC-${questionIndex + 1}-${(evidenceIndex % 3) + 1}`,
      researchQuestionId: question.id,
      excerpt: `Distinct evidence ${questionIndex + 1} proposition ${evidenceIndex + 1}`,
      interpretation: `Interpretation ${questionIndex + 1}-${evidenceIndex + 1}`,
      strength: evidenceIndex < 3 ? 'HIGH' : evidenceIndex < 5 ? 'MEDIUM' : 'LOW',
      uncertainty: evidenceIndex % 2 === 0 ? 'Measurement scope is limited.' : null,
      grounding: {
        mode: 'PARALLEL_WEB_FETCH',
        provider: 'PARALLEL',
        sourceUrl: `https://example.com/${questionIndex + 1}/${(evidenceIndex % 3) + 1}`,
        fetchedAt: '2026-08-24T00:01:00.000Z',
        discoveryExcerptUsedAsGrounding: false,
      },
      status: 'REVIEW_REQUIRED',
    }))
  );

  return {
    filmBrief: {
      id: 'FB-1',
      title: 'Five minute film',
      scientificTopic: 'Test science',
      scientificQuestion: 'What should the film explain?',
      communicationObjective: 'Explain clearly.',
      targetAudience: 'General public',
      audienceKnowledgeLevel: 'Introductory',
      format: 'Popular-science short',
      durationMinutes: 5,
      tone: 'Clear',
      learningGoals: ['Learn'],
      scope: ['Test'],
      outOfScope: [],
      constraints: ['Preserve uncertainty'],
      researchRequirements: ['Use authoritative sources'],
      status: 'APPROVED',
    },
    researchQuestions,
    sources,
    evidence,
    claims: [],
    scriptLines: [],
    scenes: [],
    shots: [],
    visualDecisions: [],
    coverageWaivers: [],
    audit: null,
  };
}

describe('adaptive evidence budget', () => {
  it('targets a manageable active evidence set for a five-minute film', () => {
    expect(targetEvidenceBudget(5, 5)).toBe(24);
  });

  it('preserves the full candidate pool while promoting only the budgeted subset', () => {
    const state = makeState();
    const compacted = applyAdaptiveEvidenceBudget(state);

    expect(compacted.evidence).toHaveLength(30);
    expect(compacted.evidence.filter((record) => record.status === 'REVIEW_REQUIRED')).toHaveLength(24);
    expect(compacted.evidence.filter((record) => record.status === 'ARCHIVED_CANDIDATE')).toHaveLength(6);
    expect(new Set(compacted.evidence.map((record) => record.id))).toEqual(
      new Set(state.evidence.map((record) => record.id))
    );
  });

  it('keeps at least one review candidate for every active research question', () => {
    const compacted = applyAdaptiveEvidenceBudget(makeState());
    for (const question of compacted.researchQuestions) {
      expect(
        compacted.evidence.some(
          (record) =>
            record.researchQuestionId === question.id &&
            record.status === 'REVIEW_REQUIRED'
        )
      ).toBe(true);
    }
  });

  it('is deterministic when applied repeatedly', () => {
    const first = applyAdaptiveEvidenceBudget(makeState());
    const second = applyAdaptiveEvidenceBudget(first);
    expect(second.evidence).toEqual(first.evidence);
  });
});
