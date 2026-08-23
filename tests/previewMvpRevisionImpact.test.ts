import { describe, expect, it } from 'vitest';
import type { MvpSession } from '../src/domain/mvpSession.js';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import type { RevisionRequest } from '../src/domain/revisionRequest.js';
import { previewMvpRevisionImpact } from '../src/services/previewMvpRevisionImpact.js';

function completeState(): MvpWorkflowState {
  return {
    filmBrief: {
      id: 'FB-1', title: 'Sky', scientificTopic: 'Atmospheric optics',
      scientificQuestion: 'Why is the sky blue?', communicationObjective: 'Explain Rayleigh scattering',
      targetAudience: 'General public', audienceKnowledgeLevel: 'Introductory', format: 'Short',
      durationMinutes: 5, tone: 'Clear', learningGoals: ['Understand scattering'], scope: ['Visible light'],
      outOfScope: ['Advanced quantum optics'], constraints: ['Scientific accuracy'], researchRequirements: ['Evidence'],
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
      { id: 'SC-1', researchQuestionId: 'RQ-1', scriptLineIds: ['SL-1'], title: 'Blue sky', purpose: 'Show mechanism', visualSummary: 'Scattering', uncertaintyDisclosure: null, status: 'APPROVED' },
      { id: 'SC-2', researchQuestionId: 'RQ-2', scriptLineIds: ['SL-2'], title: 'Sunset', purpose: 'Show application', visualSummary: 'Long path', uncertaintyDisclosure: null, status: 'APPROVED' },
    ],
    shots: [
      { id: 'SH-1', researchQuestionId: 'RQ-1', sceneId: 'SC-1', scriptLineIds: ['SL-1'], description: 'Scattering diagram', cameraDirection: 'Static', visualIntegrityCategory: 'SCHEMATIC', scientificConstraint: 'Accurate wavelength relation', uncertaintyDisclosure: null, status: 'APPROVED' },
      { id: 'SH-2', researchQuestionId: 'RQ-2', sceneId: 'SC-2', scriptLineIds: ['SL-2'], description: 'Sunset geometry', cameraDirection: 'Static', visualIntegrityCategory: 'SCHEMATIC', scientificConstraint: 'Accurate path length', uncertaintyDisclosure: null, status: 'APPROVED' },
    ],
    visualDecisions: [
      { id: 'VD-1', researchQuestionId: 'RQ-1', shotId: 'SH-1', category: 'SCHEMATIC', decision: 'Render diagram', scientificConstraint: 'Preserve wavelength dependence', disclosure: null, riskLevel: 'LOW', status: 'APPROVED' },
      { id: 'VD-2', researchQuestionId: 'RQ-2', shotId: 'SH-2', category: 'SCHEMATIC', decision: 'Render sunset geometry', scientificConstraint: 'Preserve path comparison', disclosure: null, riskLevel: 'LOW', status: 'APPROVED' },
    ],
    coverageWaivers: [],
    audit: { passed: true, issues: [] },
  };
}

function session(): MvpSession {
  return {
    id: 'SES-1',
    rawIdea: 'Explain the sky.',
    projectInput: { rawIdea: 'Explain the sky.', durationMinutes: 5 },
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T01:00:00.000Z',
    state: completeState(),
    productionPackage: null,
    events: [],
  };
}

function revision(overrides: Partial<RevisionRequest>): RevisionRequest {
  return {
    id: 'REVISION-1',
    type: 'SOURCE_APPROVAL_REVOKE',
    targetType: 'SourceRecord',
    targetRecordId: 'SRC-1',
    reason: 'The director no longer trusts this source.',
    requestedBy: 'director',
    createdAt: '2026-08-23T00:00:00.000Z',
    status: 'REQUESTED',
    ...overrides,
  };
}

describe('previewMvpRevisionImpact', () => {
  it('previews a source revocation through only the dependent branch', () => {
    const original = session();
    const preview = previewMvpRevisionImpact(original, revision({}));

    expect(preview.affectedRecordIds).toEqual(expect.arrayContaining([
      'SRC-1', 'EV-1', 'CL-1', 'SL-1', 'SC-1', 'SH-1', 'VD-1',
    ]));
    expect(preview.affectedRecordIds).not.toContain('SRC-2');
    expect(preview.affectedRecordIds).not.toContain('EV-2');
    expect(preview.counts).toMatchObject({
      sources: 1, evidence: 1, claims: 1, scriptLines: 1, scenes: 1, shots: 1, visualDecisions: 1,
    });
    expect(preview.preservedLayers).toContain('researchQuestions');
    expect(original.state.sources[0]?.status).toBe('APPROVED');
    expect(original.state.evidence[0]?.status).toBe('APPROVED');
  });

  it('starts a claim revision at the claim and preserves research/source/evidence', () => {
    const preview = previewMvpRevisionImpact(session(), revision({
      type: 'CLAIM_REVISION', targetType: 'ClaimRecord', targetRecordId: 'CL-1', reason: 'Refine claim wording.',
    }));

    expect(preview.affectedRecordIds).toEqual(expect.arrayContaining(['CL-1', 'SL-1', 'SC-1', 'SH-1', 'VD-1']));
    expect(preview.affectedRecordIds).not.toContain('SRC-1');
    expect(preview.affectedRecordIds).not.toContain('EV-1');
    expect(preview.preservedLayers).toEqual(expect.arrayContaining(['researchQuestions', 'sources', 'evidence']));
  });

  it('limits a shot revision to the shot and its visual decision', () => {
    const preview = previewMvpRevisionImpact(session(), revision({
      type: 'SHOT_REVISION', targetType: 'ShotRecord', targetRecordId: 'SH-1', reason: 'Use a restrained camera move.',
    }));

    expect(preview.affectedRecordIds).toEqual(expect.arrayContaining(['SH-1', 'VD-1']));
    expect(preview.affectedRecordIds).not.toContain('SC-1');
    expect(preview.counts.shots).toBe(1);
    expect(preview.counts.visualDecisions).toBe(1);
    expect(preview.counts.scenes).toBe(0);
  });

  it('treats a 5-to-8-minute revision as a script-and-cinematic change while preserving approved science', () => {
    const preview = previewMvpRevisionImpact(session(), revision({
      type: 'PROJECT_DURATION_CHANGE',
      targetType: 'PROJECT',
      targetRecordId: null,
      reason: 'The director needs a deeper eight-minute version.',
      proposedDurationMinutes: 8,
    }));

    expect(preview.affectedRecordIds).toEqual(expect.arrayContaining([
      'SL-1', 'SL-2', 'SC-1', 'SC-2', 'SH-1', 'SH-2', 'VD-1', 'VD-2',
    ]));
    expect(preview.affectedRecordIds).not.toContain('RQ-1');
    expect(preview.affectedRecordIds).not.toContain('SRC-1');
    expect(preview.affectedRecordIds).not.toContain('EV-1');
    expect(preview.affectedRecordIds).not.toContain('CL-1');
    expect(preview.preservedLayers).toEqual(expect.arrayContaining([
      'researchQuestions', 'sources', 'evidence', 'claims',
    ]));
    expect(preview.summary).toContain('8 minute');
  });

  it('rejects a no-op duration revision', () => {
    expect(() => previewMvpRevisionImpact(session(), revision({
      type: 'PROJECT_DURATION_CHANGE', targetType: 'PROJECT', targetRecordId: null,
      reason: 'Keep duration.', proposedDurationMinutes: 5,
    }))).toThrow(/unchanged/);
  });

  it('rejects revision of a non-approved trusted target', () => {
    const input = session();
    input.state.sources[0] = { ...input.state.sources[0]!, status: 'REJECTED' };
    expect(() => previewMvpRevisionImpact(input, revision({}))).toThrow(/must be APPROVED/);
  });
});
