import { describe, expect, it } from 'vitest';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import {
  createRealMvpStepExecutors,
  type MvpRuntimeServices,
} from '../src/services/createRealMvpStepExecutors.js';

const notUsed = async (): Promise<never> => {
  throw new Error('Unexpected runtime service call.');
};
const notUsedSync = (): never => {
  throw new Error('Unexpected runtime service call.');
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

function baseState(): MvpWorkflowState {
  return {
    filmBrief: {
      id: 'FB-1', title: 'Sky', scientificTopic: 'Optics', scientificQuestion: 'Why blue?',
      communicationObjective: 'Explain', targetAudience: 'Public', audienceKnowledgeLevel: 'Introductory',
      format: 'Short', durationMinutes: 5, tone: 'Clear', learningGoals: ['Learn'], scope: ['Sky'],
      outOfScope: ['Other'], constraints: ['Accurate'], researchRequirements: ['Sources'], status: 'APPROVED',
    },
    researchQuestions: [
      { id: 'RQ-1', filmBriefId: 'FB-1', question: 'Why blue?', purpose: 'Mechanism', priority: 'HIGH', status: 'APPROVED' },
    ],
    sources: [
      { id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'P-1', url: 'https://example.com', title: 'Source', publishDate: null, excerpts: ['Evidence'], retrievedAt: '2026-08-20T00:00:00.000Z', status: 'APPROVED' },
    ],
    evidence: [
      { id: 'EV-1', sourceId: 'SRC-1', researchQuestionId: 'RQ-1', excerpt: 'Evidence', interpretation: 'Meaning', strength: 'HIGH', uncertainty: null, status: 'APPROVED' },
    ],
    claims: [
      { id: 'CL-1', researchQuestionId: 'RQ-1', evidenceIds: ['EV-1'], text: 'Claim', confidence: 'HIGH', uncertainty: null, status: 'APPROVED' },
    ],
    scriptLines: [], scenes: [], shots: [], visualDecisions: [], coverageWaivers: [], audit: null,
  };
}

describe('stale-aware revision regeneration', () => {
  it('regenerates a script branch whose prior approved script became STALE', async () => {
    const state = baseState();
    state.scriptLines = [{
      id: 'SL-old', researchQuestionId: 'RQ-1', claimIds: ['CL-1'], text: 'Old line',
      uncertaintyDisclosure: null, status: 'STALE',
    }];
    const called: string[] = [];
    const executors = createRealMvpStepExecutors(services({
      generateScriptLines: async (_claims, question) => {
        called.push(question.id);
        return [{
          id: 'SL-new', researchQuestionId: question.id, claimIds: ['CL-1'], text: 'Revised line',
          uncertaintyDisclosure: null, status: 'REVIEW_REQUIRED',
        }];
      },
    }));

    const result = await executors.generateScriptLines(state);

    expect(called).toEqual(['RQ-1']);
    expect(result.map((record) => [record.id, record.status])).toEqual([
      ['SL-old', 'STALE'],
      ['SL-new', 'REVIEW_REQUIRED'],
    ]);
  });

  it('still refuses silent regeneration when the prior script was REJECTED', async () => {
    const state = baseState();
    state.scriptLines = [{
      id: 'SL-rejected', researchQuestionId: 'RQ-1', claimIds: ['CL-1'], text: 'Rejected line',
      uncertaintyDisclosure: null, status: 'REJECTED',
    }];
    const called: string[] = [];
    const executors = createRealMvpStepExecutors(services({
      generateScriptLines: async (_claims, question) => {
        called.push(question.id);
        return [];
      },
    }));

    const result = await executors.generateScriptLines(state);

    expect(called).toEqual([]);
    expect(result).toEqual(state.scriptLines);
  });

  it('rediscovers a source branch after explicit staleness while preserving stale history', async () => {
    const state = baseState();
    state.sources[0] = { ...state.sources[0]!, status: 'STALE' };
    state.evidence[0] = { ...state.evidence[0]!, status: 'STALE' };
    state.claims[0] = { ...state.claims[0]!, status: 'STALE' };
    const called: string[] = [];
    const executors = createRealMvpStepExecutors(services({
      discoverSourcesWithParallelMcp: async (question) => {
        called.push(question.id);
        return [{
          id: 'SRC-new', researchQuestionId: question.id, provider: 'PARALLEL', providerSearchId: 'P-new',
          url: 'https://example.com/new', title: 'Replacement', publishDate: null, excerpts: ['New evidence'],
          retrievedAt: '2026-08-23T00:00:00.000Z', status: 'DISCOVERED',
        }];
      },
    }));

    const result = await executors.discoverSources(state);

    expect(called).toEqual(['RQ-1']);
    expect(result.find((record) => record.id === 'SRC-1')?.status).toBe('STALE');
    expect(result.find((record) => record.id === 'SRC-new')?.status).toBe('DISCOVERED');
  });
});
