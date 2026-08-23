import { describe, expect, it } from 'vitest';
import type { MvpSession } from '../src/domain/mvpSession.js';
import { buildProductionPackage } from '../src/services/buildProductionPackage.js';
import { createPublicDemoSession, PUBLIC_DEMO_SESSION_ID } from '../src/services/createPublicDemoSession.js';

function completedSession(): MvpSession {
  const filmBrief = {
    id: 'FB-1', title: 'Demo film', scientificTopic: 'Physics', scientificQuestion: 'Why?',
    communicationObjective: 'Explain.', targetAudience: 'Public', audienceKnowledgeLevel: 'Introductory',
    format: 'Short documentary', durationMinutes: 5, tone: 'Scientific', learningGoals: ['Learn'],
    scope: ['Topic'], outOfScope: ['Other'], constraints: ['Accurate'], researchRequirements: ['Sources'],
    status: 'APPROVED' as const,
  };
  const researchQuestions = [{ id: 'RQ-1', filmBriefId: 'FB-1', question: 'What evidence?', purpose: 'Research', priority: 'HIGH' as const, status: 'APPROVED' as const }];
  const sources = [{ id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL' as const, providerSearchId: 'search-secret-provider-id', url: 'https://example.com', title: 'Source', publishDate: null, excerpts: ['Evidence'], retrievedAt: '2026-08-20T00:00:00.000Z', status: 'APPROVED' as const }];
  const evidence = [{ id: 'EV-1', sourceId: 'SRC-1', researchQuestionId: 'RQ-1', excerpt: 'Evidence', interpretation: 'Meaning', strength: 'HIGH' as const, uncertainty: null, status: 'APPROVED' as const }];
  const claims = [{ id: 'CL-1', researchQuestionId: 'RQ-1', evidenceIds: ['EV-1'], text: 'Claim', confidence: 'HIGH' as const, uncertainty: null, status: 'APPROVED' as const }];
  const scriptLines = [{ id: 'SL-1', researchQuestionId: 'RQ-1', claimIds: ['CL-1'], text: 'Line', uncertaintyDisclosure: null, status: 'APPROVED' as const }];
  const scenes = [{ id: 'SC-1', researchQuestionId: 'RQ-1', scriptLineIds: ['SL-1'], title: 'Scene', purpose: 'Purpose', visualSummary: 'Visual', uncertaintyDisclosure: null, status: 'APPROVED' as const }];
  const shots = [{ id: 'SH-1', researchQuestionId: 'RQ-1', sceneId: 'SC-1', scriptLineIds: ['SL-1'], description: 'Shot', cameraDirection: 'Static', visualIntegrityCategory: 'SCHEMATIC' as const, scientificConstraint: 'Accurate', uncertaintyDisclosure: null, status: 'APPROVED' as const }];
  const visualDecisions = [{ id: 'VD-1', researchQuestionId: 'RQ-1', shotId: 'SH-1', category: 'SCHEMATIC' as const, decision: 'Diagram', scientificConstraint: 'Accurate', disclosure: null, riskLevel: 'LOW' as const, status: 'APPROVED' as const }];
  const productionPackage = buildProductionPackage({ filmBrief, researchQuestions, sources, evidence, claims, scriptLines, scenes, shots, visualDecisions }, { now: () => '2026-08-20T01:00:00.000Z' });

  return {
    id: 'SESSION-private', rawIdea: 'private free-form idea that must not be published',
    projectInput: { rawIdea: 'private input', directorBrief: { collaborationMode: 'DIRECTOR_LED', pacing: 'BALANCED', cameraMovement: 'RESTRAINED', representationPreference: 'BALANCED', notes: 'private director note', avoid: [] } },
    createdAt: '2026-08-20T00:00:00.000Z', updatedAt: '2026-08-20T01:00:00.000Z',
    state: { filmBrief, researchQuestions, sources, evidence, claims, scriptLines, scenes, shots, visualDecisions, coverageWaivers: [], audit: productionPackage.audit },
    productionPackage,
    reviewRecommendations: [{
      id: 'REV-private',
      targetType: 'SOURCE',
      targetRecordId: 'SRC-1',
      recommendation: 'APPROVE_SUGGESTED',
      attention: 'LOW',
      confidence: 0.9,
      reasons: ['Private reviewer context'],
      risks: [],
      flags: [],
      createdAt: '2026-08-20T00:30:00.000Z',
      model: 'gemini-3.5-flash',
    }],
    events: [{ id: 'EVT-private', type: 'PACKAGE_BUILT', at: '2026-08-20T01:00:00.000Z', stage: 'COMPLETE', message: 'Private event history' }],
  };
}

describe('createPublicDemoSession', () => {
  it('creates a detached completed snapshot without personal input, event history, or AI reviewer metadata', () => {
    const snapshot = createPublicDemoSession(completedSession(), { now: () => '2026-08-20T02:00:00.000Z' });

    expect(snapshot.id).toBe(PUBLIC_DEMO_SESSION_ID);
    expect(snapshot.rawIdea).toBe('Why?');
    expect(snapshot.projectInput).toBeUndefined();
    expect(snapshot.events).toHaveLength(1);
    expect(snapshot.events[0]?.message).toContain('Detached read-only public demo snapshot');
    expect(snapshot.directorFeedback).toEqual([]);
    expect(snapshot.reviewRecommendations).toEqual([]);
    expect(snapshot.productionPackage?.status).toBe('READY_FOR_PRODUCTION');
    expect(snapshot.state.visualDecisions).toHaveLength(1);
  });

  it('rejects a session without a ready production package', () => {
    const session = completedSession();
    session.productionPackage = null;
    expect(() => createPublicDemoSession(session)).toThrow('READY_FOR_PRODUCTION');
  });
});
