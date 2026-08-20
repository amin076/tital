import { describe, expect, it } from 'vitest';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import {
  createRealMvpStepExecutors,
  type MvpRuntimeServices,
} from '../src/services/createRealMvpStepExecutors.js';

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

function state(): MvpWorkflowState {
  return {
    filmBrief: {
      id: 'FB-1', title: 'Europa', scientificTopic: 'Europa', scientificQuestion: 'Question', communicationObjective: 'Explain', targetAudience: 'General', audienceKnowledgeLevel: 'Introductory', format: 'Short', durationMinutes: 5, tone: 'Clear', learningGoals: ['Learn'], scope: ['Scope'], outOfScope: ['Other'], constraints: ['Accuracy'], researchRequirements: ['Sources'], status: 'APPROVED',
    },
    researchQuestions: [
      { id: 'RQ-1', filmBriefId: 'FB-1', question: 'Q1', purpose: 'P1', priority: 'HIGH', status: 'APPROVED' },
      { id: 'RQ-2', filmBriefId: 'FB-1', question: 'Q2', purpose: 'P2', priority: 'MEDIUM', status: 'APPROVED' },
    ],
    sources: [
      { id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'search-1', url: 'https://example.com/1', title: 'Approved', publishDate: null, excerpts: ['Excerpt'], retrievedAt: '2026-08-15T00:00:00.000Z', status: 'APPROVED' },
      { id: 'SRC-old', researchQuestionId: 'RQ-2', provider: 'PARALLEL', providerSearchId: 'search-old', url: 'https://example.com/old', title: 'Rejected', publishDate: null, excerpts: ['Excerpt'], retrievedAt: '2026-08-15T00:00:00.000Z', status: 'REJECTED' },
    ],
    evidence: [], claims: [], scriptLines: [], scenes: [], shots: [], visualDecisions: [], audit: null,
  };
}

describe('incremental real MVP executors', () => {
  it('discovers only missing approved-question coverage and preserves rejected provenance history', async () => {
    const workflow = state();
    const called: string[] = [];
    const executors = createRealMvpStepExecutors(services({
      discoverSourcesWithParallelMcp: async (question) => {
        called.push(question.id);
        return [{
          id: 'SRC-new', researchQuestionId: question.id, provider: 'PARALLEL', providerSearchId: 'search-new', url: 'https://example.com/new', title: 'New candidate', publishDate: null, excerpts: ['New excerpt'], retrievedAt: '2026-08-15T00:01:00.000Z', status: 'DISCOVERED',
        }];
      },
    }));

    const result = await executors.discoverSources(workflow);

    expect(called).toEqual(['RQ-2']);
    expect(result.map((record) => record.id)).toEqual(['SRC-1', 'SRC-old', 'SRC-new']);
    expect(result.find((record) => record.id === 'SRC-old')?.status).toBe('REJECTED');
  });

  it('extracts evidence only for approved sources that have never been attempted', async () => {
    const workflow = state();
    const called: string[] = [];
    const executors = createRealMvpStepExecutors(services({
      extractEvidence: async (source) => {
        called.push(source.id);
        return [{
          id: 'EV-new',
          sourceId: source.id,
          researchQuestionId: source.researchQuestionId,
          excerpt: 'Excerpt',
          interpretation: 'Interpretation',
          strength: 'HIGH',
          uncertainty: null,
          status: 'REVIEW_REQUIRED',
        }];
      },
    }));

    const result = await executors.extractEvidence(workflow);

    expect(called).toEqual(['SRC-1']);
    expect(result.map((record) => record.id)).toEqual(['EV-new']);
  });

  it('does not regenerate evidence after a human rejected the prior extraction', async () => {
    const workflow = state();
    workflow.evidence = [{
      id: 'EV-rejected',
      sourceId: 'SRC-1',
      researchQuestionId: 'RQ-1',
      excerpt: 'Previously extracted excerpt',
      interpretation: 'Rejected interpretation',
      strength: 'MEDIUM',
      uncertainty: 'Human rejected this evidence.',
      status: 'REJECTED',
    }];
    const called: string[] = [];
    const executors = createRealMvpStepExecutors(services({
      extractEvidence: async (source) => {
        called.push(source.id);
        return [];
      },
    }));

    const result = await executors.extractEvidence(workflow);

    expect(called).toEqual([]);
    expect(result).toEqual(workflow.evidence);
    expect(result[0]?.status).toBe('REJECTED');
  });

  it('does not start another extraction while evidence from that source is still pending review', async () => {
    const workflow = state();
    workflow.evidence = [{
      id: 'EV-pending',
      sourceId: 'SRC-1',
      researchQuestionId: 'RQ-1',
      excerpt: 'Pending excerpt',
      interpretation: 'Pending interpretation',
      strength: 'HIGH',
      uncertainty: null,
      status: 'REVIEW_REQUIRED',
    }];
    const called: string[] = [];
    const executors = createRealMvpStepExecutors(services({
      extractEvidence: async (source) => {
        called.push(source.id);
        return [];
      },
    }));

    const result = await executors.extractEvidence(workflow);

    expect(called).toEqual([]);
    expect(result).toEqual(workflow.evidence);
  });
});
