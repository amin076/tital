import { describe, expect, it } from 'vitest';
import type { MvpSession } from '../src/domain/mvpSession.js';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import type { MvpStepExecutors } from '../src/services/executeNextMvpStep.js';
import {
  advanceMvpSession,
  MvpSessionAdvanceError,
} from '../src/services/advanceMvpSession.js';
import {
  createRealMvpStepExecutors,
  type MvpRuntimeServices,
} from '../src/services/createRealMvpStepExecutors.js';
import { resolveRuntimeAuditMetadata } from '../src/services/resolveRuntimeAuditMetadata.js';
import { ModelRuntimeError } from '../src/utils/adkModelResponse.js';

function claimsReadyState(): MvpWorkflowState {
  return {
    filmBrief: {
      id: 'FB-1',
      title: 'Auroras',
      scientificTopic: 'Auroras',
      scientificQuestion: 'How do auroras form?',
      communicationObjective: 'Explain solar particles and Earth magnetic field.',
      targetAudience: 'General audience',
      audienceKnowledgeLevel: 'Introductory',
      format: 'Short documentary',
      durationMinutes: 5,
      tone: 'Clear',
      learningGoals: ['Understand evidence for aurora formation'],
      scope: ['Solar wind', 'Magnetosphere', 'Atmospheric emission'],
      outOfScope: ['Astrology'],
      constraints: ['Preserve uncertainty'],
      researchRequirements: ['Use authoritative sources'],
      status: 'APPROVED',
    },
    researchQuestions: [{
      id: 'RQ-1',
      filmBriefId: 'FB-1',
      question: 'How do charged solar particles create auroral light?',
      purpose: 'Ground the causal explanation.',
      priority: 'HIGH',
      status: 'APPROVED',
    }],
    sources: [{
      id: 'SRC-1',
      researchQuestionId: 'RQ-1',
      provider: 'PARALLEL',
      providerSearchId: 'search-1',
      url: 'https://example.com/aurora',
      title: 'Aurora source',
      publishDate: null,
      excerpts: ['Charged particles precipitate along magnetic field lines.'],
      retrievedAt: '2026-08-22T04:00:00.000Z',
      status: 'APPROVED',
    }],
    evidence: [{
      id: 'EV-1',
      sourceId: 'SRC-1',
      researchQuestionId: 'RQ-1',
      excerpt: 'Charged particles precipitate along magnetic field lines.',
      interpretation: 'The source supports a particle precipitation mechanism for auroras.',
      strength: 'HIGH',
      uncertainty: 'The exact color and shape depend on atmospheric species and altitude.',
      status: 'APPROVED',
    }],
    claims: [],
    scriptLines: [],
    scenes: [],
    shots: [],
    visualDecisions: [],
    coverageWaivers: [],
    audit: null,
  };
}

function session(): MvpSession {
  return {
    id: 'SES-aurora',
    rawIdea: 'How auroras form',
    createdAt: '2026-08-22T04:00:00.000Z',
    updatedAt: '2026-08-22T04:00:00.000Z',
    productionPackage: null,
    events: [],
    state: claimsReadyState(),
  };
}

function claimRuntimeError(): ModelRuntimeError {
  return new ModelRuntimeError(
    'Claim generation agent failed before returning structured content (code 403). Vertex AI rejected the request because project quota, billing, or spend cap capacity was not available.',
    {
      label: 'Claim generation agent',
      category: 'QUOTA_OR_BILLING',
      errorCode: '403',
      finishReason: null,
      eventCount: 1,
      detail: 'Vertex AI rejected the request because project quota, billing, or spend cap capacity was not available.',
      runtime: resolveRuntimeAuditMetadata({
        GOOGLE_GENAI_USE_VERTEXAI: 'true',
        K_SERVICE: 'tital',
        K_REVISION: 'tital-00042-test',
        TITAL_RELEASE_SHA: 'abcdef123456',
      }, () => '2026-08-22T04:34:22.000Z'),
    }
  );
}

const notUsed = async (): Promise<never> => {
  throw new Error('Unexpected runtime service call in claim failure test.');
};
const notUsedSync = (): never => {
  throw new Error('Unexpected runtime service call in claim failure test.');
};

function executors(overrides: Partial<MvpStepExecutors>): MvpStepExecutors {
  return {
    generateResearchQuestions: notUsed,
    discoverSources: notUsed,
    extractEvidence: notUsed,
    generateClaims: notUsed,
    generateScriptLines: notUsed,
    generateScenes: notUsed,
    generateShots: notUsed,
    generateVisualDecisions: notUsed,
    runAudit: notUsedSync,
    ...overrides,
  };
}

function runtimeServices(overrides: Partial<MvpRuntimeServices>): MvpRuntimeServices {
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

describe('claim generation runtime failure handling', () => {
  it('records Gemini/Vertex failure metadata for a failed claims operation', async () => {
    const operations: MvpSession['events'][number]['performance'][] = [];
    const capturedOperations: NonNullable<MvpSession['events'][number]['performance']>['operations'] = [];
    let attempts = 0;
    const runtimeExecutors = createRealMvpStepExecutors(
      runtimeServices({
        generateClaims: async () => {
          attempts += 1;
          throw claimRuntimeError();
        },
      }),
      {
        externalConcurrency: 1,
        onOperation: (operation) => capturedOperations.push(operation),
      }
    );

    await expect(runtimeExecutors.generateClaims(claimsReadyState())).rejects.toThrow(
      'Claim generation agent failed before returning structured content'
    );
    expect(attempts).toBe(1);

    operations.push({
      durationMs: capturedOperations[0]?.durationMs ?? 0,
      externalCallCount: capturedOperations.length,
      operations: capturedOperations,
    });
    expect(operations[0]?.operations[0]).toMatchObject({
      name: 'gemini.claim_generation',
      targetId: 'RQ-1',
      success: false,
      runtime: {
        provider: 'Google',
        backend: 'VERTEX_AI',
        modelIdentifier: 'gemini-3.5-flash',
        agentFramework: 'Google ADK',
        modelPlatform: 'Vertex AI',
        cloudRunRevision: 'tital-00042-test',
      },
      failure: {
        category: 'QUOTA_OR_BILLING',
        errorCode: '403',
        eventCount: 1,
      },
    });
  });

  it('persists an automation-failed event without creating claims', async () => {
    try {
      await advanceMvpSession(session(), {
        executors: executors({
          generateClaims: async () => {
            throw claimRuntimeError();
          },
        }),
        now: () => '2026-08-22T04:34:23.000Z',
        eventIdFactory: () => 'EVT-failed',
        performanceNow: (() => {
          let now = 1_000;
          return () => {
            now += 250;
            return now;
          };
        })(),
      });
      throw new Error('Expected claim generation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(MvpSessionAdvanceError);
      const failed = error as MvpSessionAdvanceError;
      expect(failed.statusCode).toBe(502);
      expect(failed.code).toBe('MODEL_RUNTIME_FAILURE');
      expect(failed.session.state.claims).toHaveLength(0);
      expect(failed.session.events[0]).toMatchObject({
        id: 'EVT-failed',
        type: 'AUTOMATION_FAILED',
        stage: 'CLAIMS',
        message: expect.stringContaining('Claim generation agent failed before returning structured content'),
        performance: {
          durationMs: 250,
          externalCallCount: 0,
          operations: [],
        },
      });
    }
  });

  it('persists valid claim proposals with provenance when generation succeeds', async () => {
    const advanced = await advanceMvpSession(session(), {
      executors: executors({
        generateClaims: async () => [{
          id: 'CL-1',
          researchQuestionId: 'RQ-1',
          evidenceIds: ['EV-1'],
          text: 'Auroras form when charged particles guided by Earth magnetic field excite atmospheric gases.',
          confidence: 'HIGH',
          uncertainty: 'Colors and shapes depend on gas species, altitude, and geomagnetic conditions.',
          status: 'REVIEW_REQUIRED',
        }],
      }),
      now: () => '2026-08-22T04:40:00.000Z',
      eventIdFactory: () => 'EVT-claims',
    });

    expect(advanced.state.claims).toEqual([{
      id: 'CL-1',
      researchQuestionId: 'RQ-1',
      evidenceIds: ['EV-1'],
      text: 'Auroras form when charged particles guided by Earth magnetic field excite atmospheric gases.',
      confidence: 'HIGH',
      uncertainty: 'Colors and shapes depend on gas species, altitude, and geomagnetic conditions.',
      status: 'REVIEW_REQUIRED',
    }]);
    expect(advanced.events[0]).toMatchObject({
      id: 'EVT-claims',
      type: 'AUTOMATION_EXECUTED',
      stage: 'CLAIMS',
    });
  });

  it('returns safe deterministic schema errors without mutating claims', async () => {
    try {
      await advanceMvpSession(session(), {
        executors: executors({
          generateClaims: async () => {
            throw new Error('Claim proposal validation failed: claims[0].evidenceNumbers is required');
          },
        }),
        now: () => '2026-08-22T04:35:00.000Z',
        eventIdFactory: () => 'EVT-schema',
      });
      throw new Error('Expected schema failure.');
    } catch (error) {
      expect(error).toBeInstanceOf(MvpSessionAdvanceError);
      const failed = error as MvpSessionAdvanceError;
      expect(failed.session.state.claims).toHaveLength(0);
      expect(failed.message).toContain('Claim proposal validation failed');
      expect(failed.message).not.toContain('Approved numbered evidence');
      expect(failed.session.events[0]?.message).toContain('No project records were changed');
    }
  });
});
