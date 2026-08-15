import { describe, expect, it } from 'vitest';
import { buildProductionPackage, type ProductionPackageInput } from '../src/services/buildProductionPackage.js';

function makeInput(): ProductionPackageInput {
  return {
    filmBrief: {
      id: 'FB-1',
      title: 'Europa Ocean',
      scientificTopic: 'Europa',
      scientificQuestion: 'Does Europa have a subsurface ocean?',
      communicationObjective: 'Explain the evidence clearly.',
      targetAudience: 'General audience',
      audienceKnowledgeLevel: 'Introductory',
      format: 'Short documentary',
      durationMinutes: 5,
      tone: 'Scientific',
      learningGoals: ['Understand the evidence'],
      scope: ['Subsurface ocean evidence'],
      outOfScope: ['Mission engineering'],
      constraints: ['Preserve uncertainty'],
      researchRequirements: ['Use traceable sources'],
      status: 'APPROVED',
    },
    researchQuestions: [{
      id: 'RQ-1', filmBriefId: 'FB-1', question: 'What evidence supports an ocean?',
      purpose: 'Establish the scientific basis.', priority: 'HIGH', status: 'APPROVED',
    }],
    sources: [{
      id: 'SRC-1', researchQuestionId: 'RQ-1', provider: 'PARALLEL', providerSearchId: 'search-1',
      url: 'https://example.com/europa', title: 'Europa evidence', publishDate: null,
      excerpts: ['Galileo magnetometer data support a conductive layer.'], retrievedAt: '2026-08-15T00:00:00.000Z', status: 'APPROVED',
    }],
    evidence: [{
      id: 'EV-1', sourceId: 'SRC-1', researchQuestionId: 'RQ-1',
      excerpt: 'Galileo magnetometer data support a conductive layer.',
      interpretation: 'A conductive subsurface layer is consistent with salty liquid water.',
      strength: 'HIGH', uncertainty: 'The measurement is indirect.', status: 'APPROVED',
    }],
    claims: [{
      id: 'CL-1', researchQuestionId: 'RQ-1', evidenceIds: ['EV-1'],
      text: 'Magnetic measurements provide strong indirect evidence for a salty subsurface ocean.',
      confidence: 'HIGH', uncertainty: 'The ocean was not directly observed.', status: 'APPROVED',
    }],
    scriptLines: [{
      id: 'SL-1', researchQuestionId: 'RQ-1', claimIds: ['CL-1'],
      text: 'Europa’s magnetic response points to a conductive layer beneath the ice.',
      uncertaintyDisclosure: 'This is indirect evidence rather than direct observation.', status: 'APPROVED',
    }],
    scenes: [{
      id: 'SC-1', researchQuestionId: 'RQ-1', scriptLineIds: ['SL-1'], title: 'Reading Europa’s magnetic signature',
      purpose: 'Explain the magnetometer evidence.', visualSummary: 'Show Europa and a labeled magnetic-field schematic.',
      uncertaintyDisclosure: 'The subsurface ocean is inferred.', status: 'APPROVED',
    }],
    shots: [{
      id: 'SH-1', researchQuestionId: 'RQ-1', sceneId: 'SC-1', scriptLineIds: ['SL-1'],
      description: 'A schematic cutaway of Europa with an inferred liquid layer.', cameraDirection: 'Slow push toward the cutaway.',
      visualIntegrityCategory: 'SCHEMATIC', scientificConstraint: 'Do not present the liquid layer as directly observed.',
      uncertaintyDisclosure: 'Schematic based on indirect evidence.', status: 'APPROVED',
    }],
    visualDecisions: [{
      id: 'VD-1', researchQuestionId: 'RQ-1', shotId: 'SH-1', category: 'SCHEMATIC',
      decision: 'Use a clearly labeled cutaway schematic.', scientificConstraint: 'Label inferred structures explicitly.',
      disclosure: 'Schematic; subsurface structure is inferred from indirect measurements.', riskLevel: 'MEDIUM', status: 'APPROVED',
    }],
  };
}

describe('buildProductionPackage', () => {
  it('marks a fully approved and clean package ready for production', () => {
    const result = buildProductionPackage(makeInput(), {
      now: () => '2026-08-15T07:00:00.000Z',
      auditIdFactory: () => 'AUD-1',
    });

    expect(result.status).toBe('READY_FOR_PRODUCTION');
    expect(result.audit.passed).toBe(true);
    expect(result.generatedAt).toBe('2026-08-15T07:00:00.000Z');
  });

  it('blocks packaging when a workflow record still needs review', () => {
    const input = makeInput();
    input.visualDecisions[0]!.status = 'REVIEW_REQUIRED';

    const result = buildProductionPackage(input, { now: () => '2026-08-15T07:00:00.000Z' });

    expect(result.status).toBe('BLOCKED');
    expect(result.audit.passed).toBe(true);
  });

  it('blocks packaging when the scientific audit finds broken provenance', () => {
    const input = makeInput();
    input.claims[0]!.evidenceIds = ['EV-missing'];

    const result = buildProductionPackage(input, {
      now: () => '2026-08-15T07:00:00.000Z',
      auditIdFactory: () => 'AUD-broken',
    });

    expect(result.status).toBe('BLOCKED');
    expect(result.audit.passed).toBe(false);
    expect(result.audit.issues.some((issue) => issue.code === 'UNSUPPORTED_CLAIM')).toBe(true);
  });
});
