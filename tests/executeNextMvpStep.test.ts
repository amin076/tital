import { describe, expect, it, vi } from 'vitest';
import { executeNextMvpStep, type MvpStepExecutors } from '../src/services/executeNextMvpStep.js';
import type { MvpWorkflowState } from '../src/domain/mvpWorkflow.js';

function baseState(): MvpWorkflowState {
  return {
    filmBrief: {
      id: 'FB-1', title: 'Europa', scientificTopic: 'Europa', scientificQuestion: 'Does Europa have a subsurface ocean?', communicationObjective: 'Explain the evidence', targetAudience: 'General audience', audienceKnowledgeLevel: 'Introductory', format: 'Short documentary', durationMinutes: 5, tone: 'Clear', learningGoals: ['Understand the evidence'], scope: ['Ocean evidence'], outOfScope: ['Habitability claims'], constraints: ['Preserve uncertainty'], researchRequirements: ['Use primary and authoritative sources'], status: 'APPROVED',
    },
    researchQuestions: [],
    sources: [],
    evidence: [],
    claims: [],
    scriptLines: [],
    scenes: [],
    shots: [],
    visualDecisions: [],
    audit: null,
  };
}

function executors(): MvpStepExecutors {
  return {
    generateResearchQuestions: vi.fn(async () => [{ id: 'RQ-1', filmBriefId: 'FB-1', question: 'What evidence supports a subsurface ocean on Europa?', purpose: 'Establish evidence base', priority: 'HIGH' as const, status: 'REVIEW_REQUIRED' as const }]),
    discoverSources: vi.fn(async () => []),
    extractEvidence: vi.fn(async () => []),
    generateClaims: vi.fn(async () => []),
    generateScriptLines: vi.fn(async () => []),
    generateScenes: vi.fn(async () => []),
    generateShots: vi.fn(async () => []),
    generateVisualDecisions: vi.fn(async () => []),
    runAudit: vi.fn(async () => ({ passed: true, issues: [] })),
  };
}

describe('executeNextMvpStep', () => {
  it('executes research-question generation when the approved brief has no questions', async () => {
    const deps = executors();
    const result = await executeNextMvpStep(baseState(), deps);

    expect(result.disposition).toBe('EXECUTED_AUTOMATION');
    expect(result.state.researchQuestions[0].status).toBe('REVIEW_REQUIRED');
    expect(deps.generateResearchQuestions).toHaveBeenCalledOnce();
  });

  it('stops at the human gate instead of discovering sources automatically', async () => {
    const state = baseState();
    state.researchQuestions = [{ id: 'RQ-1', filmBriefId: 'FB-1', question: 'Question', purpose: 'Purpose', priority: 'HIGH', status: 'REVIEW_REQUIRED' }];
    const deps = executors();

    const result = await executeNextMvpStep(state, deps);

    expect(result.disposition).toBe('AWAITING_HUMAN_REVIEW');
    expect(deps.discoverSources).not.toHaveBeenCalled();
  });

  it('executes Parallel source discovery only after approved research questions', async () => {
    const state = baseState();
    state.researchQuestions = [{ id: 'RQ-1', filmBriefId: 'FB-1', question: 'Question', purpose: 'Purpose', priority: 'HIGH', status: 'APPROVED' }];
    const deps = executors();
    deps.discoverSources = vi.fn(async () => [{ id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL' as const, providerSearchId: 'search-1', url: 'https://example.com', title: 'Source', publishDate: null, excerpts: ['Excerpt'], retrievedAt: '2026-08-15T00:00:00.000Z', status: 'REVIEW_REQUIRED' as const }]);

    const result = await executeNextMvpStep(state, deps);

    expect(result.disposition).toBe('EXECUTED_AUTOMATION');
    expect(result.state.sources[0].provider).toBe('PARALLEL');
    expect(result.state.sources[0].status).toBe('REVIEW_REQUIRED');
  });

  it('runs the deterministic audit only after all human approvals are complete', async () => {
    const state = baseState();
    state.researchQuestions = [{ id: 'RQ-1', filmBriefId: 'FB-1', question: 'Question', purpose: 'Purpose', priority: 'HIGH', status: 'APPROVED' }];
    state.sources = [{ id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'search-1', url: 'https://example.com', title: 'Source', publishDate: null, excerpts: ['Excerpt'], retrievedAt: '2026-08-15T00:00:00.000Z', status: 'APPROVED' }];
    state.evidence = [{ id: 'EV-1', sourceId: 'SRC-1', researchQuestionId: 'RQ-1', excerpt: 'Excerpt', interpretation: 'Interpretation', strength: 'HIGH', uncertainty: null, status: 'APPROVED' }];
    state.claims = [{ id: 'CL-1', researchQuestionId: 'RQ-1', evidenceIds: ['EV-1'], text: 'Claim', confidence: 'HIGH', uncertainty: null, status: 'APPROVED' }];
    state.scriptLines = [{ id: 'SL-1', researchQuestionId: 'RQ-1', claimIds: ['CL-1'], text: 'Line', uncertaintyDisclosure: null, status: 'APPROVED' }];
    state.scenes = [{ id: 'SC-1', researchQuestionId: 'RQ-1', scriptLineIds: ['SL-1'], title: 'Scene', purpose: 'Purpose', visualSummary: 'Summary', uncertaintyDisclosure: null, status: 'APPROVED' }];
    state.shots = [{ id: 'SH-1', researchQuestionId: 'RQ-1', sceneId: 'SC-1', scriptLineIds: ['SL-1'], description: 'Shot', cameraDirection: 'Static', visualIntegrityCategory: 'SCIENTIFIC_RECONSTRUCTION', scientificConstraint: 'Constraint', uncertaintyDisclosure: null, status: 'APPROVED' }];
    state.visualDecisions = [{ id: 'VD-1', researchQuestionId: 'RQ-1', shotId: 'SH-1', category: 'SCIENTIFIC_RECONSTRUCTION', decision: 'Decision', scientificConstraint: 'Constraint', disclosure: null, riskLevel: 'LOW', status: 'APPROVED' }];
    const deps = executors();

    const result = await executeNextMvpStep(state, deps);

    expect(result.disposition).toBe('AUDIT_EXECUTED');
    expect(result.state.audit?.passed).toBe(true);
    expect(deps.runAudit).toHaveBeenCalledOnce();
  });
});
