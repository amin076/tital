import { describe, expect, it } from 'vitest';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import { getMvpWorkflowInsights } from '../src/services/getMvpWorkflowInsights.js';

function approvedState(): MvpWorkflowState {
  return {
    filmBrief: {
      id: 'FB-1', title: 'Europa', scientificTopic: 'Europa', scientificQuestion: 'Does Europa have a subsurface ocean?', communicationObjective: 'Explain the evidence', targetAudience: 'General audience', audienceKnowledgeLevel: 'Introductory', format: 'Short documentary', durationMinutes: 5, tone: 'Clear', learningGoals: ['Understand the evidence'], scope: ['Ocean evidence'], outOfScope: ['Habitability claims'], constraints: ['Preserve uncertainty'], researchRequirements: ['Use primary and authoritative sources'], status: 'APPROVED',
    },
    researchQuestions: [{ id: 'RQ-1', filmBriefId: 'FB-1', question: 'What evidence supports a subsurface ocean on Europa?', purpose: 'Establish evidence base', priority: 'HIGH', status: 'APPROVED' }],
    sources: [{ id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'search-1', url: 'https://example.com/source', title: 'Source', publishDate: null, excerpts: ['Evidence excerpt'], retrievedAt: '2026-08-15T00:00:00.000Z', status: 'APPROVED' }],
    evidence: [{ id: 'EV-1', sourceId: 'SRC-1', researchQuestionId: 'RQ-1', excerpt: 'Evidence excerpt', interpretation: 'Supports a subsurface ocean.', strength: 'HIGH', uncertainty: 'Exact depth remains uncertain.', status: 'APPROVED' }],
    claims: [{ id: 'CL-1', researchQuestionId: 'RQ-1', evidenceIds: ['EV-1'], text: 'Europa likely has a salty subsurface ocean.', confidence: 'HIGH', uncertainty: 'Exact geometry remains uncertain.', status: 'APPROVED' }],
    scriptLines: [{ id: 'SL-1', researchQuestionId: 'RQ-1', claimIds: ['CL-1'], text: 'Multiple measurements support a salty ocean beneath Europa’s ice.', uncertaintyDisclosure: 'Its exact depth and geometry remain uncertain.', status: 'APPROVED' }],
    scenes: [{ id: 'SC-1', researchQuestionId: 'RQ-1', scriptLineIds: ['SL-1'], title: 'Hidden Ocean', purpose: 'Explain the evidence', visualSummary: 'Move from observed surface to scientific reconstruction.', uncertaintyDisclosure: 'Reconstruction is evidence-based, not a direct observation.', status: 'APPROVED' }],
    shots: [{ id: 'SH-1', researchQuestionId: 'RQ-1', sceneId: 'SC-1', scriptLineIds: ['SL-1'], description: 'Cutaway reconstruction of Europa.', cameraDirection: 'Slow push toward the cutaway.', visualIntegrityCategory: 'SCIENTIFIC_RECONSTRUCTION', scientificConstraint: 'Do not imply exact ocean geometry is directly observed.', uncertaintyDisclosure: 'Scientific reconstruction based on multiple lines of evidence.', status: 'APPROVED' }],
    visualDecisions: [{ id: 'VD-1', researchQuestionId: 'RQ-1', shotId: 'SH-1', category: 'SCIENTIFIC_RECONSTRUCTION', decision: 'Show an illustrative cutaway beneath the ice shell.', scientificConstraint: 'Do not present exact geometry as measured.', disclosure: 'Scientific reconstruction; dimensions are illustrative.', riskLevel: 'MEDIUM', status: 'APPROVED' }],
    audit: { issues: [], passed: true },
  };
}

describe('getMvpWorkflowInsights', () => {
  it('marks every workflow step complete for a complete approved chain', () => {
    const insights = getMvpWorkflowInsights(approvedState());
    expect(insights.stage).toBe('COMPLETE');
    expect(insights.steps.every((step) => step.status === 'COMPLETE')).toBe(true);
    expect(insights.coverage.every((coverage) => coverage.complete)).toBe(true);
  });

  it('reports missing approved evidence coverage by source ID', () => {
    const state = approvedState();
    state.evidence[0].status = 'REJECTED';

    const insights = getMvpWorkflowInsights(state);
    const evidenceCoverage = insights.coverage.find((item) => item.key === 'evidence');

    expect(insights.stage).toBe('EVIDENCE');
    expect(evidenceCoverage).toMatchObject({
      covered: 0,
      total: 1,
      complete: false,
      missingParentIds: ['SRC-1'],
    });
  });
});
