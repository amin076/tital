import { describe, expect, it, vi } from 'vitest';
import type { MvpSession } from '../src/domain/mvpSession.js';
import type { ProductionReviewProposal } from '../src/domain/productionReview.js';
import { buildProductionPackage } from '../src/services/buildProductionPackage.js';
import {
  assembleProductionReviewReport,
  modelSafeProductionContext,
  reviewFinalProduction,
} from '../src/services/reviewFinalProduction.js';

function readySession(): MvpSession {
  const filmBrief = {
    id: 'FB-1', title: 'Blue Sky', scientificTopic: 'Rayleigh scattering', scientificQuestion: 'Why is the sky blue?', communicationObjective: 'Explain scattering', targetAudience: 'General audience', audienceKnowledgeLevel: 'Introductory', format: 'Short documentary', durationMinutes: 5, tone: 'Clear', learningGoals: ['Understand wavelength-dependent scattering'], scope: ['Visible sky colour'], outOfScope: ['Full atmospheric chemistry'], constraints: ['Preserve uncertainty'], researchRequirements: ['Use authoritative sources'], status: 'APPROVED' as const,
  };
  const researchQuestions = [{ id: 'RQ-1', filmBriefId: 'FB-1', question: 'How does wavelength affect atmospheric scattering?', purpose: 'Explain the mechanism', priority: 'HIGH' as const, status: 'APPROVED' as const }];
  const sources = [{ id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL' as const, providerSearchId: 'search-1', url: 'https://example.com/scattering', title: 'Atmospheric scattering', publishDate: null, excerpts: ['Shorter visible wavelengths are scattered more strongly in the relevant regime.'], retrievedAt: '2026-08-23T00:00:00.000Z', status: 'APPROVED' as const }];
  const evidence = [{ id: 'EV-1', sourceId: 'SRC-1', researchQuestionId: 'RQ-1', excerpt: 'Shorter visible wavelengths are scattered more strongly in the relevant regime.', interpretation: 'The wavelength dependence helps explain why scattered daylight is blue.', strength: 'HIGH' as const, uncertainty: 'Observed colour also depends on the solar spectrum and visual response.', status: 'APPROVED' as const }];
  const claims = [{ id: 'CL-1', researchQuestionId: 'RQ-1', evidenceIds: ['EV-1'], text: 'Wavelength-dependent atmospheric scattering is a central reason the daytime sky appears blue.', confidence: 'HIGH' as const, uncertainty: 'The perceived colour also depends on illumination and human vision.', status: 'APPROVED' as const }];
  const scriptLines = [{ id: 'SL-1', researchQuestionId: 'RQ-1', claimIds: ['CL-1'], text: 'Air scatters shorter visible wavelengths more strongly, helping give the daytime sky its blue appearance.', uncertaintyDisclosure: 'Sky colour also depends on the incoming spectrum and human vision.', status: 'APPROVED' as const }];
  const scenes = [{ id: 'SC-1', researchQuestionId: 'RQ-1', scriptLineIds: ['SL-1'], title: 'Scattered daylight', purpose: 'Explain the wavelength dependence', visualSummary: 'Show a schematic beam crossing the atmosphere.', uncertaintyDisclosure: 'Schematic, not a literal view of individual photons.', status: 'APPROVED' as const }];
  const shots = [{ id: 'SH-1', researchQuestionId: 'RQ-1', sceneId: 'SC-1', scriptLineIds: ['SL-1'], description: 'Schematic sunlight entering atmosphere with shorter wavelengths scattered.', cameraDirection: 'Locked explanatory composition.', visualIntegrityCategory: 'SCHEMATIC' as const, scientificConstraint: 'Do not imply a literal macroscopic photon path.', uncertaintyDisclosure: 'Scientific schematic.', status: 'APPROVED' as const }];
  const visualDecisions = [{ id: 'VD-1', researchQuestionId: 'RQ-1', shotId: 'SH-1', category: 'SCHEMATIC' as const, decision: 'Use labelled wavelength bands and restrained motion.', scientificConstraint: 'Keep wavelength dependence qualitative.', disclosure: 'Scientific schematic; not to scale.', riskLevel: 'LOW' as const, status: 'APPROVED' as const }];
  const productionPackage = buildProductionPackage({ filmBrief, researchQuestions, sources, evidence, claims, scriptLines, scenes, shots, visualDecisions }, { now: () => '2026-08-23T01:00:00.000Z', auditIdFactory: () => 'AUD-1' });
  return {
    id: 'SES-1',
    rawIdea: 'Why is the sky blue?',
    projectInput: { rawIdea: 'Why is the sky blue?', durationMinutes: 5 },
    createdAt: '2026-08-23T00:00:00.000Z',
    updatedAt: '2026-08-23T01:00:00.000Z',
    state: { filmBrief, researchQuestions, sources, evidence, claims, scriptLines, scenes, shots, visualDecisions, coverageWaivers: [], audit: productionPackage.audit },
    productionPackage,
    events: [],
    directorFeedback: [],
    reviewRecommendations: [],
    revisionRequests: [],
    productionReviews: [],
  };
}

const proposal: ProductionReviewProposal = {
  summary: 'The package is coherent, but one uncertainty deserves explicit human attention.',
  overallRisk: 'MEDIUM',
  findings: [{
    category: 'UNCERTAINTY', severity: 'MEDIUM', targetType: 'ScriptLineRecord', targetNumber: 1,
    title: 'Keep the qualification visible',
    message: 'The narration should retain the supplied qualification about perception and illumination.',
    rationale: 'The approved claim contains this uncertainty and the script already carries a disclosure that could be lost in later delivery.',
    suggestedAction: 'Keep the uncertainty disclosure in narration or an adjacent visual/text treatment.',
    confidence: 0.9,
  }],
};

describe('final production AI review', () => {
  it('removes trusted application IDs before model review while preserving numbered provenance', () => {
    const session = readySession();
    const safe = JSON.stringify(modelSafeProductionContext(session.productionPackage!));
    expect(safe).not.toContain('SRC-1');
    expect(safe).not.toContain('EV-1');
    expect(safe).not.toContain('CL-1');
    expect(safe).not.toContain('SL-1');
    expect(safe).toContain('"sourceNumber":1');
    expect(safe).toContain('"claimNumbers":[1]');
  });

  it('maps numbered findings back to trusted record IDs in application code', () => {
    const session = readySession();
    const report = assembleProductionReviewReport(session.productionPackage!, proposal, {
      reportIdFactory: () => 'PRV-1', findingIdFactory: () => 'PRF-1', now: () => '2026-08-23T02:00:00.000Z',
    });
    expect(report.findings[0]).toMatchObject({ id: 'PRF-1', targetRecordId: 'SL-1', targetType: 'ScriptLineRecord' });
  });

  it('rejects a model finding that references a record number outside the supplied package', () => {
    const session = readySession();
    expect(() => assembleProductionReviewReport(session.productionPackage!, {
      ...proposal,
      findings: [{ ...proposal.findings[0], targetNumber: 99 }],
    })).toThrow('outside the supplied package');
  });

  it('persists advisory findings without changing trusted workflow state or the production package', async () => {
    const session = readySession();
    const beforeState = structuredClone(session.state);
    const beforePackage = structuredClone(session.productionPackage);
    const modelCaller = vi.fn(async () => proposal);
    const reviewed = await reviewFinalProduction(session, {
      modelCaller,
      reportIdFactory: () => 'PRV-1', findingIdFactory: () => 'PRF-1', eventIdFactory: () => 'EVT-1', now: () => '2026-08-23T02:00:00.000Z',
    });

    expect(modelCaller).toHaveBeenCalledOnce();
    expect(reviewed.state).toEqual(beforeState);
    expect(reviewed.productionPackage).toEqual(beforePackage);
    expect(reviewed.productionReviews?.[0]?.findings[0]?.targetRecordId).toBe('SL-1');
    expect(reviewed.events.at(-1)?.type).toBe('PRODUCTION_REVIEWED');
  });

  it('refuses final AI review when there is no ready production package', async () => {
    const session = readySession();
    session.productionPackage = null;
    await expect(reviewFinalProduction(session, { modelCaller: async () => proposal })).rejects.toThrow('READY_FOR_PRODUCTION');
  });
});
