import { describe, expect, it, vi } from 'vitest';
import type { MvpRuntimeServices } from '../src/services/createRealMvpStepExecutors.js';
import { evaluateMvpWorkflow } from '../src/services/evaluateMvpWorkflow.js';
import {
  GapResolutionRequiredError,
  resolveMvpReview,
} from '../src/services/resolveMvpReview.js';
import type { MvpSession } from '../src/domain/mvpSession.js';

const notUsed = async (): Promise<never> => {
  throw new Error('Unexpected runtime service call in test.');
};
const notUsedSync = (): never => {
  throw new Error('Unexpected runtime service call in test.');
};

function runtime(overrides: Partial<MvpRuntimeServices> = {}): MvpRuntimeServices {
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

function sceneGapSession(): MvpSession {
  return {
    id: 'SES-1',
    rawIdea: 'Explain the K-Pg extinction.',
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
    state: {
      filmBrief: {
        id: 'FB-1', title: 'Dinosaurs', scientificTopic: 'K-Pg extinction', scientificQuestion: 'What caused it?', communicationObjective: 'Explain evidence', targetAudience: 'General public', audienceKnowledgeLevel: 'Introductory', format: 'Short', durationMinutes: 5, tone: 'Clear', learningGoals: ['Understand evidence'], scope: ['K-Pg'], outOfScope: ['Other extinctions'], constraints: ['Accuracy'], researchRequirements: ['Sources'], status: 'APPROVED',
      },
      researchQuestions: [
        { id: 'RQ-1', filmBriefId: 'FB-1', question: 'What global effects followed Chicxulub?', purpose: 'Explain global effects', priority: 'HIGH', status: 'APPROVED' },
      ],
      sources: [
        { id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'search-1', url: 'https://example.com', title: 'Source', publishDate: null, excerpts: ['Excerpt'], retrievedAt: '2026-08-20T00:00:00.000Z', status: 'APPROVED' },
      ],
      evidence: [
        { id: 'EV-1', sourceId: 'SRC-1', researchQuestionId: 'RQ-1', excerpt: 'Excerpt', interpretation: 'Interpretation', strength: 'HIGH', uncertainty: null, status: 'APPROVED' },
      ],
      claims: [
        { id: 'CL-1', researchQuestionId: 'RQ-1', evidenceIds: ['EV-1'], text: 'Impact had global effects.', confidence: 'HIGH', uncertainty: null, status: 'APPROVED' },
      ],
      scriptLines: [
        { id: 'SL-1', researchQuestionId: 'RQ-1', claimIds: ['CL-1'], text: 'The impact had global effects.', uncertaintyDisclosure: null, status: 'APPROVED' },
      ],
      scenes: [
        { id: 'SC-old', researchQuestionId: 'RQ-1', scriptLineIds: ['SL-1'], title: 'Global tsunami', purpose: 'Show one global effect', visualSummary: 'A tsunami circles the globe.', uncertaintyDisclosure: null, status: 'REVIEW_REQUIRED' },
      ],
      shots: [],
      visualDecisions: [],
      coverageWaivers: [],
      audit: null,
    },
    productionPackage: null,
    events: [],
  };
}

describe('governed human review resolution', () => {
  it('requires an explicit decision when rejection would create a scene coverage gap', async () => {
    const session = sceneGapSession();

    await expect(
      resolveMvpReview(session, 'REJECT', { recordIds: ['SC-old'] })
    ).rejects.toBeInstanceOf(GapResolutionRequiredError);
  });

  it('can explicitly waive the uncovered research-question branch and preserve the omission in governance history', async () => {
    const session = sceneGapSession();

    const resolved = await resolveMvpReview(session, 'REJECT', {
      recordIds: ['SC-old'],
      gapResolution: 'WAIVE',
      reason: 'The tsunami is scientifically valid but outside this five-minute narrative.',
      now: () => '2026-08-20T01:00:00.000Z',
      eventIdFactory: (() => {
        let index = 0;
        return () => `EVT-${++index}`;
      })(),
      waiverIdFactory: () => 'CW-1',
    });

    expect(resolved.state.scenes[0].status).toBe('REJECTED');
    expect(resolved.state.coverageWaivers).toEqual([
      expect.objectContaining({
        id: 'CW-1',
        stage: 'SCENES',
        targetType: 'RESEARCH_QUESTION',
        targetId: 'RQ-1',
        rejectedRecordIds: ['SC-old'],
      }),
    ]);
    expect(resolved.events.some((event) => event.type === 'COVERAGE_WAIVED')).toBe(true);
    expect(evaluateMvpWorkflow(resolved.state).stage).toBe('AUDIT');
  });

  it('can reject the current scene and explicitly request a novel replacement candidate', async () => {
    const session = sceneGapSession();
    const generateScenes = vi.fn(async () => [
      {
        id: 'SC-new',
        researchQuestionId: 'RQ-1',
        scriptLineIds: ['SL-1'],
        title: 'Atmospheric aftermath',
        purpose: 'Show how impact material changed global climate.',
        visualSummary: 'Dust and aerosols spread through the atmosphere and dim sunlight.',
        uncertaintyDisclosure: null,
        status: 'REVIEW_REQUIRED' as const,
      },
    ]);

    const resolved = await resolveMvpReview(session, 'REJECT', {
      recordIds: ['SC-old'],
      gapResolution: 'RETRY',
      runtimeServices: runtime({ generateScenes }),
      now: () => '2026-08-20T01:00:00.000Z',
      eventIdFactory: (() => {
        let index = 0;
        return () => `EVT-${++index}`;
      })(),
    });

    expect(generateScenes).toHaveBeenCalledOnce();
    expect(resolved.state.scenes).toEqual([
      expect.objectContaining({ id: 'SC-old', status: 'REJECTED' }),
      expect.objectContaining({ id: 'SC-new', status: 'REVIEW_REQUIRED' }),
    ]);
    expect(resolved.state.coverageWaivers ?? []).toHaveLength(0);
    expect(resolved.events.some((event) => event.type === 'RETRY_REQUESTED')).toBe(true);
    expect(evaluateMvpWorkflow(resolved.state).stage).toBe('SCENES');
  });
});
