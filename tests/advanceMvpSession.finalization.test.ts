import { describe, expect, it } from 'vitest';
import type { MvpSession } from '../src/domain/mvpSession.js';
import type { MvpStepExecutors } from '../src/services/executeNextMvpStep.js';
import { advanceMvpSession, MvpSessionAdvanceError } from '../src/services/advanceMvpSession.js';
import { getMvpSessionView } from '../src/services/getMvpSessionView.js';

function readySessionWithoutAudit(): MvpSession {
  return {
    id: 'SES-ready',
    rawIdea: 'A film about Europa',
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
    productionPackage: null,
    events: [],
    state: {
      filmBrief: {
        id: 'FB-1', title: 'Europa', scientificTopic: 'Europa', scientificQuestion: 'Does Europa have a subsurface ocean?', communicationObjective: 'Explain the evidence', targetAudience: 'General audience', audienceKnowledgeLevel: 'Introductory', format: 'Short documentary', durationMinutes: 5, tone: 'Clear', learningGoals: ['Understand the evidence'], scope: ['Ocean evidence'], outOfScope: ['Habitability claims'], constraints: ['Preserve uncertainty'], researchRequirements: ['Use authoritative sources'], status: 'APPROVED',
      },
      researchQuestions: [{ id: 'RQ-1', filmBriefId: 'FB-1', question: 'What evidence supports a subsurface ocean?', purpose: 'Establish evidence', priority: 'HIGH', status: 'APPROVED' }],
      sources: [{ id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'search-1', url: 'https://example.com/source', title: 'Source', publishDate: null, excerpts: ['Evidence excerpt'], retrievedAt: '2026-08-15T00:00:00.000Z', status: 'APPROVED' }],
      evidence: [{ id: 'EV-1', sourceId: 'SRC-1', researchQuestionId: 'RQ-1', excerpt: 'Evidence excerpt', interpretation: 'Supports an ocean.', strength: 'HIGH', uncertainty: 'Depth remains uncertain.', status: 'APPROVED' }],
      claims: [{ id: 'CL-1', researchQuestionId: 'RQ-1', evidenceIds: ['EV-1'], text: 'Europa likely has a subsurface ocean.', confidence: 'HIGH', uncertainty: 'Exact geometry remains uncertain.', status: 'APPROVED' }],
      scriptLines: [{ id: 'SL-1', researchQuestionId: 'RQ-1', claimIds: ['CL-1'], text: 'Measurements support an ocean beneath Europa’s ice.', uncertaintyDisclosure: 'Its exact geometry remains uncertain.', status: 'APPROVED' }],
      scenes: [{ id: 'SC-1', researchQuestionId: 'RQ-1', scriptLineIds: ['SL-1'], title: 'Hidden Ocean', purpose: 'Explain evidence', visualSummary: 'Observation to reconstruction.', uncertaintyDisclosure: 'Reconstruction is not direct observation.', status: 'APPROVED' }],
      shots: [{ id: 'SH-1', researchQuestionId: 'RQ-1', sceneId: 'SC-1', scriptLineIds: ['SL-1'], description: 'Cutaway reconstruction.', cameraDirection: 'Slow push.', visualIntegrityCategory: 'SCIENTIFIC_RECONSTRUCTION', scientificConstraint: 'Do not imply exact geometry is measured.', uncertaintyDisclosure: 'Scientific reconstruction.', status: 'APPROVED' }],
      visualDecisions: [{ id: 'VD-1', researchQuestionId: 'RQ-1', shotId: 'SH-1', category: 'SCIENTIFIC_RECONSTRUCTION', decision: 'Show an illustrative cutaway.', scientificConstraint: 'Do not present exact geometry as measured.', disclosure: 'Scientific reconstruction; dimensions are illustrative.', riskLevel: 'MEDIUM', status: 'APPROVED' }],
      audit: null,
    },
  };
}

function auditOnlyExecutors(): MvpStepExecutors {
  const notUsed = async (): Promise<never> => {
    throw new Error('Unexpected model/tool stage during deterministic finalization test.');
  };
  return {
    generateResearchQuestions: notUsed,
    discoverSources: notUsed,
    extractEvidence: notUsed,
    generateClaims: notUsed,
    generateScriptLines: notUsed,
    generateScenes: notUsed,
    generateShots: notUsed,
    generateVisualDecisions: notUsed,
    runAudit: () => ({ issues: [], passed: true }),
  };
}

describe('advanceMvpSession deterministic finalization', () => {
  it('runs audit/package construction and captures immutable v1 once every human gate is satisfied', async () => {
    const finalized = await advanceMvpSession(readySessionWithoutAudit(), {
      executors: auditOnlyExecutors(),
      now: () => '2026-08-15T01:00:00.000Z',
      eventIdFactory: (() => {
        let index = 0;
        return () => `EVT-${++index}`;
      })(),
    });

    expect(finalized.state.audit?.passed).toBe(true);
    expect(finalized.productionPackage?.status).toBe('READY_FOR_PRODUCTION');
    expect(finalized.productionVersions).toHaveLength(1);
    expect(finalized.productionVersions?.[0]).toMatchObject({
      version: 1,
      status: 'CURRENT',
      revisionId: null,
    });
    expect(finalized.events.map((event) => event.type)).toEqual([
      'AUDIT_EXECUTED',
      'PACKAGE_BUILT',
    ]);
  });

  it('links a rebuilt package version to a repairing revision before closing that revision', async () => {
    const session = readySessionWithoutAudit();
    session.revisionRequests = [{
      id: 'REV-1',
      type: 'SHOT_REVISION',
      targetType: 'ShotRecord',
      targetRecordId: 'SH-old',
      reason: 'Use a more restrained camera move.',
      instruction: 'Keep the science unchanged and reduce camera movement.',
      requestedBy: 'user-1',
      createdAt: '2026-08-15T00:30:00.000Z',
      status: 'REPAIRING',
    }];

    const finalized = await advanceMvpSession(session, {
      executors: auditOnlyExecutors(),
      now: () => '2026-08-15T01:00:00.000Z',
      eventIdFactory: (() => {
        let index = 0;
        return () => `EVT-R-${++index}`;
      })(),
    });

    expect(finalized.productionPackage?.status).toBe('READY_FOR_PRODUCTION');
    expect(finalized.productionVersions).toHaveLength(1);
    expect(finalized.productionVersions?.[0]).toMatchObject({
      version: 1,
      status: 'CURRENT',
      revisionId: 'REV-1',
    });
    expect(finalized.productionVersions?.[0]?.changeSummary).toContain('SHOT REVISION');
    expect(finalized.revisionRequests?.[0]?.status).toBe('COMPLETED');
    expect(finalized.events.map((event) => event.type)).toEqual([
      'AUDIT_EXECUTED',
      'PACKAGE_BUILT',
      'REVISION_COMPLETED',
    ]);
  });

  it('blocks audit/package progression while an applied revision is still waiting for selective repair', async () => {
    const session = readySessionWithoutAudit();
    session.revisionRequests = [{
      id: 'REV-script',
      type: 'SCRIPT_REVISION',
      targetType: 'ScriptLineRecord',
      targetRecordId: 'SL-1',
      reason: 'Remove duplicated narration.',
      instruction: 'Generate a distinct replacement line.',
      requestedBy: 'user-1',
      createdAt: '2026-08-15T00:30:00.000Z',
      status: 'APPLIED',
    }];

    const view = getMvpSessionView(session);
    expect(view.summary.stage).toBe('SCRIPT');
    expect(view.summary.blockedBy).toContain('REVISION_REPAIR_REQUIRED');
    expect(view.continueAction).toMatchObject({ enabled: false, mode: 'BLOCKED' });
    expect(view.continueAction.message).toMatch(/selective repair/i);

    await expect(advanceMvpSession(session, {
      executors: auditOnlyExecutors(),
    })).rejects.toMatchObject({
      code: 'REVISION_REPAIR_REQUIRED',
      statusCode: 409,
    } satisfies Partial<MvpSessionAdvanceError>);

    expect(session.state.audit).toBeNull();
    expect(session.productionPackage).toBeNull();
  });
});
