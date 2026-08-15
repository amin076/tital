import { describe, expect, it } from 'vitest';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import { evaluateMvpWorkflow } from '../src/services/evaluateMvpWorkflow.js';
import { selectApprovedProductionChain } from '../src/services/mvpWorkflowGuards.js';

function stateWithOrphanedApprovedEvidence(): MvpWorkflowState {
  return {
    filmBrief: {
      id: 'FB-1', title: 'Europa', scientificTopic: 'Europa', scientificQuestion: 'Question', communicationObjective: 'Explain', targetAudience: 'General', audienceKnowledgeLevel: 'Introductory', format: 'Short', durationMinutes: 5, tone: 'Clear', learningGoals: ['Learn'], scope: ['Scope'], outOfScope: ['Other'], constraints: ['Accuracy'], researchRequirements: ['Sources'], status: 'APPROVED',
    },
    researchQuestions: [{ id: 'RQ-1', filmBriefId: 'FB-1', question: 'Q1', purpose: 'P1', priority: 'HIGH', status: 'APPROVED' }],
    sources: [
      { id: 'SRC-approved', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'search-approved', url: 'https://example.com/approved', title: 'Approved source', publishDate: null, excerpts: ['Approved excerpt'], retrievedAt: '2026-08-15T00:00:00.000Z', status: 'APPROVED' },
      { id: 'SRC-rejected', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'search-rejected', url: 'https://example.com/rejected', title: 'Rejected source', publishDate: null, excerpts: ['Rejected excerpt'], retrievedAt: '2026-08-15T00:00:00.000Z', status: 'REJECTED' },
    ],
    evidence: [{ id: 'EV-orphan', sourceId: 'SRC-rejected', researchQuestionId: 'RQ-1', excerpt: 'Rejected excerpt', interpretation: 'Should not satisfy active coverage.', strength: 'LOW', uncertainty: 'Upstream source was rejected.', status: 'APPROVED' }],
    claims: [], scriptLines: [], scenes: [], shots: [], visualDecisions: [], audit: null,
  };
}

describe('provenance-connected approved coverage', () => {
  it('excludes approved downstream records whose required upstream record is rejected', () => {
    const state = stateWithOrphanedApprovedEvidence();
    const chain = selectApprovedProductionChain(state);

    expect(chain.sources.map((record) => record.id)).toEqual(['SRC-approved']);
    expect(chain.evidence).toEqual([]);
    expect(evaluateMvpWorkflow(state)).toMatchObject({
      stage: 'EVIDENCE',
      blockedBy: ['EVIDENCE_INCOMPLETE'],
    });
  });
});
