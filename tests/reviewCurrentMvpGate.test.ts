import { describe, expect, it } from 'vitest';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import { reviewCurrentMvpGate } from '../src/services/reviewCurrentMvpGate.js';

function baseState(): MvpWorkflowState {
  return {
    filmBrief: {
      id: 'FB-1', title: 'Europa', scientificTopic: 'Europa', scientificQuestion: 'Question', communicationObjective: 'Explain', targetAudience: 'General', audienceKnowledgeLevel: 'Introductory', format: 'Short', durationMinutes: 5, tone: 'Clear', learningGoals: ['Learn'], scope: ['Scope'], outOfScope: ['Other'], constraints: ['Accuracy'], researchRequirements: ['Sources'], status: 'REVIEW_REQUIRED',
    },
    researchQuestions: [], sources: [], evidence: [], claims: [], scriptLines: [], scenes: [], shots: [], visualDecisions: [], audit: null,
  };
}

describe('reviewCurrentMvpGate', () => {
  it('does not invent an unsupported REJECTED FilmBrief status', () => {
    expect(() => reviewCurrentMvpGate(baseState(), 'REJECT')).toThrow(/does not support REJECTED/);
  });

  it('can approve DISCOVERED sources at the current research gate', () => {
    const state = baseState();
    state.filmBrief.status = 'APPROVED';
    state.researchQuestions = [{ id: 'RQ-1', filmBriefId: 'FB-1', question: 'Q1', purpose: 'P1', priority: 'HIGH', status: 'APPROVED' }];
    state.sources = [{ id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'search-1', url: 'https://example.com/1', title: 'Source', publishDate: null, excerpts: ['Excerpt'], retrievedAt: '2026-08-15T00:00:00.000Z', status: 'DISCOVERED' }];

    const reviewed = reviewCurrentMvpGate(state, 'APPROVE');
    expect(reviewed.recordType).toBe('SourceRecord');
    expect(reviewed.reviewedCount).toBe(1);
    expect(reviewed.state.sources[0].status).toBe('APPROVED');
    expect(reviewed.state.audit).toBeNull();
  });
});
