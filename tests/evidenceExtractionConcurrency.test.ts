import { describe, expect, it } from 'vitest';
import type { EvidenceRecord } from '../src/domain/evidenceRecord.js';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import {
  createRealMvpStepExecutors,
  realMvpRuntimeServices,
} from '../src/services/createRealMvpStepExecutors.js';

function stateWithTwoApprovedSources(): MvpWorkflowState {
  return {
    filmBrief: {
      id: 'FB-1',
      title: 'Aurora',
      scientificTopic: 'Space physics',
      scientificQuestion: 'How do auroras form?',
      communicationObjective: 'Explain the evidence chain.',
      targetAudience: 'General public',
      audienceKnowledgeLevel: 'Introductory',
      format: 'Short documentary',
      durationMinutes: 5,
      tone: 'Clear',
      learningGoals: ['Understand auroral mechanisms'],
      scope: ['Aurora'],
      outOfScope: ['Unrelated planets'],
      constraints: ['Preserve uncertainty'],
      researchRequirements: ['Authoritative sources'],
      status: 'APPROVED',
    },
    researchQuestions: [{
      id: 'RQ-1',
      filmBriefId: 'FB-1',
      question: 'What observations connect solar activity to auroras?',
      purpose: 'Ground the explanation.',
      priority: 'HIGH',
      status: 'APPROVED',
    }],
    sources: [
      {
        id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: null,
        url: 'https://example.com/1', title: 'Source 1', publishDate: null,
        excerpts: ['Discovery excerpt 1'], retrievedAt: '2026-08-24T00:00:00.000Z', status: 'APPROVED',
      },
      {
        id: 'SRC-2', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: null,
        url: 'https://example.com/2', title: 'Source 2', publishDate: null,
        excerpts: ['Discovery excerpt 2'], retrievedAt: '2026-08-24T00:00:00.000Z', status: 'APPROVED',
      },
    ],
    evidence: [],
    claims: [],
    scriptLines: [],
    scenes: [],
    shots: [],
    visualDecisions: [],
    coverageWaivers: [],
    audit: null,
  };
}

function evidenceFor(sourceId: string): EvidenceRecord[] {
  return [{
    id: `EV-${sourceId}`,
    sourceId,
    researchQuestionId: 'RQ-1',
    excerpt: `Fetched evidence for ${sourceId}`,
    interpretation: 'Supported interpretation.',
    strength: 'HIGH',
    uncertainty: null,
    grounding: {
      method: 'PARALLEL_WEB_FETCH',
      sourceUrl: `https://example.com/${sourceId === 'SRC-1' ? '1' : '2'}`,
      fetchedAt: '2026-08-24T00:00:01.000Z',
      provider: 'PARALLEL',
      discoveryExcerptUsedAsGrounding: false,
    },
    status: 'REVIEW_REQUIRED',
  }];
}

describe('full-source evidence extraction concurrency', () => {
  it('uses the stricter evidence concurrency instead of the general external concurrency', async () => {
    let active = 0;
    let maxActive = 0;

    const services = {
      ...realMvpRuntimeServices,
      extractEvidence: async (source: MvpWorkflowState['sources'][number]) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return evidenceFor(source.id);
      },
    } as typeof realMvpRuntimeServices;

    const executors = createRealMvpStepExecutors(services, {
      externalConcurrency: 3,
      evidenceConcurrency: 1,
      modelRetrySleep: async () => undefined,
    });

    const records = await executors.extractEvidence(stateWithTwoApprovedSources());

    expect(records).toHaveLength(2);
    expect(maxActive).toBe(1);
  });
});
