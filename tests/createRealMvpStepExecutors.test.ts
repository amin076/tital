import { describe, expect, it } from 'vitest';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import {
  createRealMvpStepExecutors,
  type MvpRuntimeServices,
} from '../src/services/createRealMvpStepExecutors.js';

function baseState(): MvpWorkflowState {
  return {
    filmBrief: {
      id: 'FB-1',
      title: 'Europa',
      scientificTopic: 'Europa',
      scientificQuestion: 'Does Europa have a subsurface ocean?',
      communicationObjective: 'Explain the evidence',
      targetAudience: 'General audience',
      audienceKnowledgeLevel: 'Introductory',
      format: 'Short documentary',
      durationMinutes: 5,
      tone: 'Clear',
      learningGoals: ['Understand the evidence'],
      scope: ['Ocean evidence'],
      outOfScope: ['Habitability claims'],
      constraints: ['Preserve uncertainty'],
      researchRequirements: ['Use primary and authoritative sources'],
      status: 'APPROVED',
    },
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

const notUsed = async (): Promise<never> => {
  throw new Error('Unexpected runtime service call in unit test.');
};

const notUsedSync = (): never => {
  throw new Error('Unexpected runtime service call in unit test.');
};

function services(overrides: Partial<MvpRuntimeServices>): MvpRuntimeServices {
  return {
    generateResearchQuestions: notUsed,
    discoverSourcesWithParallelMcp: notUsed,
    extractEvidence: notUsed,
    generateClaims: notUsed,
    generateScriptLines: notUsed,
    generateScenes: notUsed,
    generateShots: notUsed,
    generateVisualDecision: notUsed,
    runScientificAudit: notUsedSync,
    ...overrides,
  };
}

describe('createRealMvpStepExecutors', () => {
  it('delegates research-question generation to the real-service boundary with the FilmBrief', async () => {
    const state = baseState();
    let receivedBriefId: string | null = null;
    const questions: MvpWorkflowState['researchQuestions'] = [
      {
        id: 'RQ-1',
        filmBriefId: 'FB-1',
        question: 'What evidence supports a subsurface ocean on Europa?',
        purpose: 'Establish the evidence base',
        priority: 'HIGH',
        status: 'REVIEW_REQUIRED',
      },
    ];

    const executors = createRealMvpStepExecutors(
      services({
        generateResearchQuestions: async (brief) => {
          receivedBriefId = brief.id;
          return questions;
        },
      })
    );

    const result = await executors.generateResearchQuestions(state);

    expect(receivedBriefId).toBe('FB-1');
    expect(result).toEqual(questions);
  });

  it('fans Parallel discovery out across approved research questions and flattens SourceRecords', async () => {
    const state = baseState();
    state.researchQuestions = [
      {
        id: 'RQ-1',
        filmBriefId: 'FB-1',
        question: 'Question one',
        purpose: 'Purpose one',
        priority: 'HIGH',
        status: 'APPROVED',
      },
      {
        id: 'RQ-2',
        filmBriefId: 'FB-1',
        question: 'Question two',
        purpose: 'Purpose two',
        priority: 'MEDIUM',
        status: 'APPROVED',
      },
    ];

    const calledQuestionIds: string[] = [];
    const executors = createRealMvpStepExecutors(
      services({
        discoverSourcesWithParallelMcp: async (question) => {
          calledQuestionIds.push(question.id);
          return [
            {
              id: `SRC-${question.id}`,
              researchQuestionId: question.id,
              provider: 'PARALLEL',
              providerSearchId: `search-${question.id}`,
              url: `https://example.com/${question.id}`,
              title: `Source for ${question.id}`,
              publishDate: null,
              excerpts: ['Excerpt'],
              retrievedAt: '2026-08-15T00:00:00.000Z',
              status: 'DISCOVERED',
            },
          ];
        },
      })
    );

    const result = await executors.discoverSources(state);

    expect(calledQuestionIds).toEqual(['RQ-1', 'RQ-2']);
    expect(result.map((record) => record.researchQuestionId)).toEqual(['RQ-1', 'RQ-2']);
  });

  it('joins each SourceRecord back to its ResearchQuestion before evidence extraction', async () => {
    const state = baseState();
    state.researchQuestions = [
      {
        id: 'RQ-1',
        filmBriefId: 'FB-1',
        question: 'Question one',
        purpose: 'Purpose one',
        priority: 'HIGH',
        status: 'APPROVED',
      },
    ];
    state.sources = [
      {
        id: 'SRC-1',
        researchQuestionId: 'RQ-1',
        provider: 'PARALLEL',
        providerSearchId: 'search-1',
        url: 'https://example.com/source',
        title: 'Source',
        publishDate: null,
        excerpts: ['Evidence excerpt'],
        retrievedAt: '2026-08-15T00:00:00.000Z',
        status: 'APPROVED',
      },
    ];

    let joinedQuestionId: string | null = null;
    const executors = createRealMvpStepExecutors(
      services({
        extractEvidence: async (source, question) => {
          joinedQuestionId = question.id;
          return [
            {
              id: 'EV-1',
              sourceId: source.id,
              researchQuestionId: question.id,
              excerpt: 'Evidence excerpt',
              interpretation: 'Supports the claim.',
              strength: 'HIGH',
              uncertainty: null,
              status: 'REVIEW_REQUIRED',
            },
          ];
        },
      })
    );

    const result = await executors.extractEvidence(state);

    expect(joinedQuestionId).toBe('RQ-1');
    expect(result[0]).toMatchObject({ sourceId: 'SRC-1', researchQuestionId: 'RQ-1' });
  });

  it('passes the complete governed chain into the deterministic scientific audit', async () => {
    const state = baseState();
    let receivedSourceCount = -1;
    const executors = createRealMvpStepExecutors(
      services({
        runScientificAudit: (input) => {
          receivedSourceCount = input.sources.length;
          return { issues: [], passed: true };
        },
      })
    );

    const result = await executors.runAudit(state);

    expect(receivedSourceCount).toBe(0);
    expect(result).toEqual({ issues: [], passed: true });
  });
});
