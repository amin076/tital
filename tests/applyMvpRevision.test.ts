import { describe, expect, it } from 'vitest';
import type { MvpSession } from '../src/domain/mvpSession.js';
import type { RevisionRequest } from '../src/domain/revisionRequest.js';
import { applyMvpRevision } from '../src/services/applyMvpRevision.js';

function session(): MvpSession {
  return {
    id: 'SES-1',
    rawIdea: 'Why is the sky blue?',
    projectInput: { rawIdea: 'Why is the sky blue?', durationMinutes: 5 },
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T01:00:00.000Z',
    state: {
      filmBrief: {
        id: 'FB-1', title: 'Sky', scientificTopic: 'Optics', scientificQuestion: 'Why blue?',
        communicationObjective: 'Explain', targetAudience: 'Public', audienceKnowledgeLevel: 'Introductory',
        format: 'Short', durationMinutes: 5, tone: 'Clear', learningGoals: ['Learn'], scope: ['Sky'],
        outOfScope: ['Other'], constraints: ['Accurate'], researchRequirements: ['Sources'], status: 'APPROVED',
      },
      researchQuestions: [{ id: 'RQ-1', filmBriefId: 'FB-1', question: 'Why?', purpose: 'Mechanism', priority: 'HIGH', status: 'APPROVED' }],
      sources: [{ id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'P-1', url: 'https://example.com', title: 'Source', publishDate: null, excerpts: ['Evidence'], retrievedAt: '2026-08-20T00:00:00.000Z', status: 'APPROVED' }],
      evidence: [{ id: 'EV-1', sourceId: 'SRC-1', researchQuestionId: 'RQ-1', excerpt: 'Evidence', interpretation: 'Meaning', strength: 'HIGH', uncertainty: null, status: 'APPROVED' }],
      claims: [{ id: 'CL-1', researchQuestionId: 'RQ-1', evidenceIds: ['EV-1'], text: 'Claim', confidence: 'HIGH', uncertainty: null, status: 'APPROVED' }],
      scriptLines: [{ id: 'SL-1', researchQuestionId: 'RQ-1', claimIds: ['CL-1'], text: 'Line', uncertaintyDisclosure: null, status: 'APPROVED' }],
      scenes: [{ id: 'SC-1', researchQuestionId: 'RQ-1', scriptLineIds: ['SL-1'], title: 'Scene', purpose: 'Explain', visualSummary: 'Diagram', uncertaintyDisclosure: null, status: 'APPROVED' }],
      shots: [{ id: 'SH-1', researchQuestionId: 'RQ-1', sceneId: 'SC-1', scriptLineIds: ['SL-1'], description: 'Shot', cameraDirection: 'Static', visualIntegrityCategory: 'SCHEMATIC', scientificConstraint: 'Accurate', uncertaintyDisclosure: null, status: 'APPROVED' }],
      visualDecisions: [{ id: 'VD-1', researchQuestionId: 'RQ-1', shotId: 'SH-1', category: 'SCHEMATIC', decision: 'Diagram', scientificConstraint: 'Accurate', disclosure: null, riskLevel: 'LOW', status: 'APPROVED' }],
      coverageWaivers: [],
      audit: { passed: true, issues: [] },
    },
    productionPackage: null,
    reviewRecommendations: [{
      id: 'RR-1', targetType: 'SOURCE', targetRecordId: 'SRC-1', recommendation: 'APPROVE_SUGGESTED',
      attention: 'LOW', confidence: 0.9, reasons: ['Good'], risks: [], flags: [],
      createdAt: '2026-08-20T00:30:00.000Z', model: 'gemini-3.5-flash',
    }],
    events: [],
  };
}

function revision(overrides: Partial<RevisionRequest> = {}): RevisionRequest {
  return {
    id: 'REV-1',
    type: 'SOURCE_APPROVAL_REVOKE',
    targetType: 'SourceRecord',
    targetRecordId: 'SRC-1',
    reason: 'Reconsider this source.',
    requestedBy: 'director',
    createdAt: '2026-08-23T00:00:00.000Z',
    status: 'REQUESTED',
    ...overrides,
  };
}

describe('applyMvpRevision', () => {
  it('marks a revoked source branch stale, clears audit, preserves history, and persists the applied revision', () => {
    const result = applyMvpRevision(session(), revision(), {
      now: () => '2026-08-23T01:00:00.000Z',
      eventIdFactory: () => 'EVT-REV-1',
    });

    expect(result.state.sources[0]?.status).toBe('STALE');
    expect(result.state.evidence[0]?.status).toBe('STALE');
    expect(result.state.claims[0]?.status).toBe('STALE');
    expect(result.state.scriptLines[0]?.status).toBe('STALE');
    expect(result.state.scenes[0]?.status).toBe('STALE');
    expect(result.state.shots[0]?.status).toBe('STALE');
    expect(result.state.visualDecisions[0]?.status).toBe('STALE');
    expect(result.state.audit).toBeNull();
    expect(result.productionPackage).toBeNull();
    expect(result.revisionRequests?.[0]).toMatchObject({ id: 'REV-1', status: 'APPLIED' });
    expect(result.reviewRecommendations).toEqual([]);
    expect(result.events.at(-1)).toMatchObject({ id: 'EVT-REV-1', type: 'REVISION_APPLIED' });
  });

  it('changes duration from five to eight minutes while preserving approved science and staling production layers', () => {
    const result = applyMvpRevision(session(), revision({
      type: 'PROJECT_DURATION_CHANGE',
      targetType: 'PROJECT',
      targetRecordId: null,
      reason: 'Expand the film.',
      proposedDurationMinutes: 8,
    }));

    expect(result.projectInput?.durationMinutes).toBe(8);
    expect(result.state.filmBrief.durationMinutes).toBe(8);
    expect(result.state.researchQuestions[0]?.status).toBe('APPROVED');
    expect(result.state.sources[0]?.status).toBe('APPROVED');
    expect(result.state.evidence[0]?.status).toBe('APPROVED');
    expect(result.state.claims[0]?.status).toBe('APPROVED');
    expect(result.state.scriptLines[0]?.status).toBe('STALE');
    expect(result.state.scenes[0]?.status).toBe('STALE');
    expect(result.state.shots[0]?.status).toBe('STALE');
    expect(result.state.visualDecisions[0]?.status).toBe('STALE');
    expect(result.state.audit).toBeNull();
  });

  it('does not mutate the original session object', () => {
    const original = session();
    applyMvpRevision(original, revision());
    expect(original.state.sources[0]?.status).toBe('APPROVED');
    expect(original.revisionRequests).toBeUndefined();
  });
});
