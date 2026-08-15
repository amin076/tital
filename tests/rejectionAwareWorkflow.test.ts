import { describe, expect, it } from 'vitest';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';
import { buildProductionPackage } from '../src/services/buildProductionPackage.js';
import { evaluateMvpWorkflow } from '../src/services/evaluateMvpWorkflow.js';
import { reviewedSetReady } from '../src/services/mvpWorkflowGuards.js';

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

describe('rejection-aware workflow semantics', () => {
  it('treats rejected records as terminal history when approved coverage exists', () => {
    expect(reviewedSetReady([
      { status: 'APPROVED' },
      { status: 'REJECTED' },
    ])).toBe(true);
  });

  it('allows completion with rejected source history and excludes rejected records from the production package', () => {
    const state = approvedState();
    state.sources.push({
      id: 'SRC-rejected',
      researchQuestionId: 'RQ-1',
      provider: 'PARALLEL',
      providerSearchId: 'search-rejected',
      url: 'https://example.com/rejected',
      title: 'Rejected source',
      publishDate: null,
      excerpts: ['Rejected excerpt'],
      retrievedAt: '2026-08-15T00:00:00.000Z',
      status: 'REJECTED',
    });

    expect(evaluateMvpWorkflow(state).stage).toBe('COMPLETE');

    const productionPackage = buildProductionPackage({
      filmBrief: state.filmBrief,
      researchQuestions: state.researchQuestions,
      sources: state.sources,
      evidence: state.evidence,
      claims: state.claims,
      scriptLines: state.scriptLines,
      scenes: state.scenes,
      shots: state.shots,
      visualDecisions: state.visualDecisions,
    });

    expect(productionPackage.status).toBe('READY_FOR_PRODUCTION');
    expect(productionPackage.sources.map((record) => record.id)).toEqual(['SRC-1']);
  });
});
