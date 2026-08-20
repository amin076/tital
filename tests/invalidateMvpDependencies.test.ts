import { describe, expect, it } from 'vitest';
import type { MvpSession } from '../src/domain/mvpSession.js';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import {
  invalidateMvpDependencies,
  invalidateMvpSessionDependencies,
} from '../src/services/invalidateMvpDependencies.js';
import {
  isPendingReviewRecord,
  selectApprovedProductionChain,
} from '../src/services/mvpWorkflowGuards.js';

function completeState(): MvpWorkflowState {
  return {
    filmBrief: {
      id: 'FB-1',
      title: 'Sky',
      scientificTopic: 'Atmospheric optics',
      scientificQuestion: 'Why is the sky blue?',
      communicationObjective: 'Explain Rayleigh scattering',
      targetAudience: 'General public',
      audienceKnowledgeLevel: 'Introductory',
      format: 'Short',
      durationMinutes: 5,
      tone: 'Clear',
      learningGoals: ['Understand scattering'],
      scope: ['Visible light'],
      outOfScope: ['Advanced quantum optics'],
      constraints: ['Scientific accuracy'],
      researchRequirements: ['Evidence'],
      status: 'APPROVED',
    },
    researchQuestions: [
      { id: 'RQ-1', filmBriefId: 'FB-1', question: 'Why blue?', purpose: 'Mechanism', priority: 'HIGH', status: 'APPROVED' },
      { id: 'RQ-2', filmBriefId: 'FB-1', question: 'Why sunsets red?', purpose: 'Application', priority: 'MEDIUM', status: 'APPROVED' },
    ],
    sources: [
      { id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'P-1', url: 'https://example.com/blue', title: 'Blue sky', publishDate: null, excerpts: ['Blue evidence'], retrievedAt: '2026-08-20T00:00:00.000Z', status: 'APPROVED' },
      { id: 'SRC-2', researchQuestionId: 'RQ-2', provider: 'PARALLEL', providerSearchId: 'P-2', url: 'https://example.com/red', title: 'Sunset', publishDate: null, excerpts: ['Red evidence'], retrievedAt: '2026-08-20T00:00:00.000Z', status: 'APPROVED' },
    ],
    evidence: [
      { id: 'EV-1', sourceId: 'SRC-1', researchQuestionId: 'RQ-1', excerpt: 'Short wavelengths scatter more.', interpretation: 'Rayleigh scattering favors shorter wavelengths.', strength: 'HIGH', uncertainty: null, status: 'APPROVED' },
      { id: 'EV-2', sourceId: 'SRC-2', researchQuestionId: 'RQ-2', excerpt: 'Long paths remove more blue.', interpretation: 'Sunsets retain warmer direct light.', strength: 'HIGH', uncertainty: null, status: 'APPROVED' },
    ],
    claims: [
      { id: 'CL-1', researchQuestionId: 'RQ-1', evidenceIds: ['EV-1'], text: 'Shorter wavelengths scatter more.', confidence: 'HIGH', uncertainty: null, status: 'APPROVED' },
      { id: 'CL-2', researchQuestionId: 'RQ-2', evidenceIds: ['EV-2'], text: 'Longer atmospheric paths remove more short wavelengths.', confidence: 'HIGH', uncertainty: null, status: 'APPROVED' },
    ],
    scriptLines: [
      { id: 'SL-1', researchQuestionId: 'RQ-1', claimIds: ['CL-1'], text: 'Blue light scatters strongly.', uncertaintyDisclosure: null, status: 'APPROVED' },
      { id: 'SL-2', researchQuestionId: 'RQ-2', claimIds: ['CL-2'], text: 'At sunset the path is longer.', uncertaintyDisclosure: null, status: 'APPROVED' },
    ],
    scenes: [
      { id: 'SC-1', researchQuestionId: 'RQ-1', scriptLineIds: ['SL-1'], title: 'Blue sky', purpose: 'Show blue-sky mechanism', visualSummary: 'Light scatters in atmosphere.', uncertaintyDisclosure: null, status: 'APPROVED' },
      { id: 'SC-2', researchQuestionId: 'RQ-2', scriptLineIds: ['SL-2'], title: 'Sunset', purpose: 'Show sunset path', visualSummary: 'Long grazing atmospheric path.', uncertaintyDisclosure: null, status: 'APPROVED' },
    ],
    shots: [
      { id: 'SH-1', researchQuestionId: 'RQ-1', sceneId: 'SC-1', scriptLineIds: ['SL-1'], description: 'Scattering diagram', cameraDirection: 'Static', visualIntegrityCategory: 'SCHEMATIC', scientificConstraint: 'Short wavelengths scatter more strongly.', uncertaintyDisclosure: null, status: 'APPROVED' },
      { id: 'SH-2', researchQuestionId: 'RQ-2', sceneId: 'SC-2', scriptLineIds: ['SL-2'], description: 'Sunset geometry', cameraDirection: 'Static', visualIntegrityCategory: 'SCHEMATIC', scientificConstraint: 'Show longer atmospheric path.', uncertaintyDisclosure: null, status: 'APPROVED' },
    ],
    visualDecisions: [
      { id: 'VD-1', researchQuestionId: 'RQ-1', shotId: 'SH-1', category: 'SCHEMATIC', decision: 'Render scattering diagram.', scientificConstraint: 'Preserve wavelength dependence.', disclosure: null, riskLevel: 'LOW', status: 'APPROVED' },
      { id: 'VD-2', researchQuestionId: 'RQ-2', shotId: 'SH-2', category: 'SCHEMATIC', decision: 'Render sunset geometry.', scientificConstraint: 'Preserve path-length comparison.', disclosure: null, riskLevel: 'LOW', status: 'APPROVED' },
    ],
    coverageWaivers: [],
    audit: null,
  };
}

function statusOf(records: Array<{ id: string; status: string }>, id: string): string | undefined {
  return records.find((record) => record.id === id)?.status;
}

describe('downstream staleness', () => {
  it('marks an invalidated scene and only its dependent shot and visual decision stale', () => {
    const result = invalidateMvpDependencies(completeState(), 'SceneRecord', 'SC-1');

    expect(statusOf(result.state.scenes, 'SC-1')).toBe('STALE');
    expect(statusOf(result.state.shots, 'SH-1')).toBe('STALE');
    expect(statusOf(result.state.visualDecisions, 'VD-1')).toBe('STALE');

    expect(statusOf(result.state.scenes, 'SC-2')).toBe('APPROVED');
    expect(statusOf(result.state.shots, 'SH-2')).toBe('APPROVED');
    expect(statusOf(result.state.visualDecisions, 'VD-2')).toBe('APPROVED');

    const chain = selectApprovedProductionChain(result.state);
    expect(chain.scenes.map((record) => record.id)).toEqual(['SC-2']);
    expect(chain.shots.map((record) => record.id)).toEqual(['SH-2']);
    expect(chain.visualDecisions.map((record) => record.id)).toEqual(['VD-2']);
    expect(isPendingReviewRecord(result.state.scenes[0])).toBe(false);
  });

  it('cascades source invalidation through evidence, claims, script, scenes, shots, and visuals', () => {
    const result = invalidateMvpDependencies(completeState(), 'SourceRecord', 'SRC-1');

    expect(result.staleRecordIds).toEqual(expect.arrayContaining([
      'SRC-1', 'EV-1', 'CL-1', 'SL-1', 'SC-1', 'SH-1', 'VD-1',
    ]));
    expect(statusOf(result.state.evidence, 'EV-1')).toBe('STALE');
    expect(statusOf(result.state.claims, 'CL-1')).toBe('STALE');
    expect(statusOf(result.state.scriptLines, 'SL-1')).toBe('STALE');
    expect(statusOf(result.state.scenes, 'SC-1')).toBe('STALE');
    expect(statusOf(result.state.shots, 'SH-1')).toBe('STALE');
    expect(statusOf(result.state.visualDecisions, 'VD-1')).toBe('STALE');
    expect(statusOf(result.state.sources, 'SRC-2')).toBe('APPROVED');
  });

  it('preserves rejected history instead of relabeling rejected descendants stale', () => {
    const state = completeState();
    state.visualDecisions[0] = { ...state.visualDecisions[0], status: 'REJECTED' };

    const result = invalidateMvpDependencies(state, 'ShotRecord', 'SH-1');

    expect(statusOf(result.state.shots, 'SH-1')).toBe('STALE');
    expect(statusOf(result.state.visualDecisions, 'VD-1')).toBe('REJECTED');
    expect(result.staleRecordIds).not.toContain('VD-1');
  });

  it('clears the trusted package boundary and records a governance event at session level', () => {
    const session: MvpSession = {
      id: 'SES-1',
      rawIdea: 'Explain the sky.',
      createdAt: '2026-08-20T00:00:00.000Z',
      updatedAt: '2026-08-20T00:00:00.000Z',
      state: completeState(),
      productionPackage: null,
      events: [],
    };

    const invalidated = invalidateMvpSessionDependencies(
      session,
      'ShotRecord',
      'SH-1',
      {
        now: () => '2026-08-20T01:00:00.000Z',
        eventIdFactory: () => 'EVT-STALE-1',
      }
    );

    expect(statusOf(invalidated.state.shots, 'SH-1')).toBe('STALE');
    expect(statusOf(invalidated.state.visualDecisions, 'VD-1')).toBe('STALE');
    expect(invalidated.productionPackage).toBeNull();
    expect(invalidated.events.at(-1)).toEqual(expect.objectContaining({
      id: 'EVT-STALE-1',
      type: 'DOWNSTREAM_INVALIDATED',
    }));
  });

  it('rejects invalidation requests for unknown records', () => {
    expect(() =>
      invalidateMvpDependencies(completeState(), 'SceneRecord', 'SC-missing')
    ).toThrow(/was not found for invalidation/);
  });
});
