import { describe, expect, it } from 'vitest';
import type { FilmBrief } from '../src/domain/filmBrief.js';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import { getCurrentMvpReviewGate } from '../src/services/getCurrentMvpReviewGate.js';

function filmBrief(status: FilmBrief['status']): FilmBrief {
  return {
    id: 'FB-1',
    title: 'Europa film',
    scientificTopic: 'Europa',
    scientificQuestion: 'What supports a subsurface ocean?',
    communicationObjective: 'Explain the evidence clearly.',
    targetAudience: 'General audience',
    audienceKnowledgeLevel: 'Introductory',
    format: 'Short documentary',
    durationMinutes: 5,
    tone: 'Evidence-led',
    learningGoals: ['Understand the evidence'],
    scope: ['Magnetic evidence'],
    outOfScope: ['Habitability'],
    constraints: ['Preserve uncertainty'],
    researchRequirements: ['Use authoritative sources'],
    status,
  };
}

function baseState(briefStatus: FilmBrief['status']): MvpWorkflowState {
  return {
    filmBrief: filmBrief(briefStatus),
    researchQuestions: [],
    sources: [],
    evidence: [],
    claims: [],
    scriptLines: [],
    scenes: [],
    shots: [],
    visualDecisions: [],
    audit: null,
  };
}

describe('getCurrentMvpReviewGate', () => {
  it('exposes FilmBrief approval without inventing FilmBrief rejection', () => {
    const gate = getCurrentMvpReviewGate(baseState('REVIEW_REQUIRED'));

    expect(gate?.recordType).toBe('FilmBrief');
    expect(gate?.records.map((record) => record.id)).toEqual(['FB-1']);
    expect(gate?.canApprove).toBe(true);
    expect(gate?.canReject).toBe(false);
  });

  it('returns no review gate when approved FilmBrief needs research-question generation', () => {
    expect(getCurrentMvpReviewGate(baseState('APPROVED'))).toBeNull();
  });

  it('returns only pending research questions at the research review gate', () => {
    const state = baseState('APPROVED');
    state.researchQuestions = [
      {
        id: 'RQ-1',
        filmBriefId: 'FB-1',
        question: 'Question one',
        purpose: 'Purpose one',
        priority: 'HIGH',
        status: 'REVIEW_REQUIRED',
      },
      {
        id: 'RQ-2',
        filmBriefId: 'FB-1',
        question: 'Question two',
        purpose: 'Purpose two',
        priority: 'LOW',
        status: 'REJECTED',
      },
    ];

    const gate = getCurrentMvpReviewGate(state);

    expect(gate?.recordType).toBe('ResearchQuestion');
    expect(gate?.records.map((record) => record.id)).toEqual(['RQ-1']);
    expect(gate?.canReject).toBe(true);
  });
});
