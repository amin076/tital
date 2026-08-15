import { describe, expect, it } from 'vitest';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import { evaluateMvpWorkflow } from '../src/services/evaluateMvpWorkflow.js';
import { reviewCurrentMvpGate } from '../src/services/reviewCurrentMvpGate.js';

function baseState(): MvpWorkflowState {
  return {
    filmBrief: {
      id: 'FB-1', title: 'Europa', scientificTopic: 'Europa', scientificQuestion: 'Question', communicationObjective: 'Explain', targetAudience: 'General', audienceKnowledgeLevel: 'Introductory', format: 'Short', durationMinutes: 5, tone: 'Clear', learningGoals: ['Learn'], scope: ['Scope'], outOfScope: ['Other'], constraints: ['Accuracy'], researchRequirements: ['Sources'], status: 'REVIEW_REQUIRED',
    },
    researchQuestions: [], sources: [], evidence: [], claims: [], scriptLines: [], scenes: [], shots: [], visualDecisions: [], audit: null,
  };
}

function stateWithTwoDiscoveredSources(): MvpWorkflowState {
  const state = baseState();
  state.filmBrief.status = 'APPROVED';
  state.researchQuestions = [{ id: 'RQ-1', filmBriefId: 'FB-1', question: 'Q1', purpose: 'P1', priority: 'HIGH', status: 'APPROVED' }];
  state.sources = [
    { id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'search-1', url: 'https://example.com/1', title: 'Source 1', publishDate: null, excerpts: ['Excerpt 1'], retrievedAt: '2026-08-15T00:00:00.000Z', status: 'DISCOVERED' },
    { id: 'SRC-2', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'search-2', url: 'https://example.com/2', title: 'Source 2', publishDate: null, excerpts: ['Excerpt 2'], retrievedAt: '2026-08-15T00:00:00.000Z', status: 'DISCOVERED' },
  ];
  return state;
}

describe('reviewCurrentMvpGate', () => {
  it('does not invent an unsupported REJECTED FilmBrief status', () => {
    expect(() => reviewCurrentMvpGate(baseState(), 'REJECT')).toThrow(/does not support REJECTED/);
  });

  it('can approve all DISCOVERED sources when no explicit IDs are supplied', () => {
    const reviewed = reviewCurrentMvpGate(stateWithTwoDiscoveredSources(), 'APPROVE');
    expect(reviewed.recordType).toBe('SourceRecord');
    expect(reviewed.reviewedCount).toBe(2);
    expect(reviewed.recordIds).toEqual(['SRC-1', 'SRC-2']);
    expect(reviewed.state.sources.every((record) => record.status === 'APPROVED')).toBe(true);
    expect(reviewed.state.audit).toBeNull();
  });

  it('supports selective source review while preserving the remaining pending gate', () => {
    let state = stateWithTwoDiscoveredSources();
    const approved = reviewCurrentMvpGate(state, 'APPROVE', { recordIds: ['SRC-1'] });
    state = approved.state;

    expect(state.sources.find((record) => record.id === 'SRC-1')?.status).toBe('APPROVED');
    expect(state.sources.find((record) => record.id === 'SRC-2')?.status).toBe('DISCOVERED');
    expect(evaluateMvpWorkflow(state).stage).toBe('RESEARCH');

    const rejected = reviewCurrentMvpGate(state, 'REJECT', { recordIds: ['SRC-2'] });
    expect(rejected.state.sources.find((record) => record.id === 'SRC-2')?.status).toBe('REJECTED');
    expect(evaluateMvpWorkflow(rejected.state).stage).toBe('EVIDENCE');
  });

  it('rejects record IDs that are not pending at the current gate', () => {
    expect(() =>
      reviewCurrentMvpGate(stateWithTwoDiscoveredSources(), 'APPROVE', {
        recordIds: ['NOT-A-CURRENT-RECORD'],
      })
    ).toThrow(/not pending at the current gate/);
  });
});
