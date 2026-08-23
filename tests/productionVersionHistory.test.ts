import { describe, expect, it } from 'vitest';
import type { ProductionPackage } from '../src/domain/productionPackage.js';
import {
  appendProductionPackageVersion,
  compareProductionVersions,
  summarizeProductionVersions,
  supersedeCurrentProductionPackage,
} from '../src/services/productionVersionHistory.js';

function pkg(options: { generatedAt: string; duration: number; sources?: number; shots?: number }): ProductionPackage {
  const sourceCount = options.sources ?? 1;
  const shotCount = options.shots ?? 1;
  const sources = Array.from({ length: sourceCount }, (_, index) => ({
    id: `SRC-${index + 1}`,
    researchQuestionId: 'RQ-1',
    provider: 'PARALLEL' as const,
    providerSearchId: `search-${index + 1}`,
    url: `https://example.com/${index + 1}`,
    title: `Source ${index + 1}`,
    publishDate: null,
    excerpts: ['Excerpt'],
    retrievedAt: '2026-08-23T00:00:00.000Z',
    status: 'APPROVED' as const,
  }));
  const shots = Array.from({ length: shotCount }, (_, index) => ({
    id: `SH-${index + 1}`,
    researchQuestionId: 'RQ-1',
    sceneId: 'SC-1',
    scriptLineIds: ['SL-1'],
    description: `Shot ${index + 1}`,
    cameraDirection: 'Locked',
    visualIntegrityCategory: 'SCHEMATIC' as const,
    scientificConstraint: 'Do not overstate.',
    uncertaintyDisclosure: 'Schematic.',
    status: 'APPROVED' as const,
  }));
  const visualDecisions = shots.map((shot, index) => ({
    id: `VD-${index + 1}`,
    researchQuestionId: 'RQ-1',
    shotId: shot.id,
    category: 'SCHEMATIC' as const,
    decision: `Visual ${index + 1}`,
    scientificConstraint: 'Do not overstate.',
    disclosure: 'Schematic.',
    riskLevel: 'LOW' as const,
    status: 'APPROVED' as const,
  }));

  return {
    filmBrief: { id: 'FB-1', title: 'Blue Sky', scientificTopic: 'Scattering', scientificQuestion: 'Why is the sky blue?', communicationObjective: 'Explain', targetAudience: 'General', audienceKnowledgeLevel: 'Introductory', format: 'Short documentary', durationMinutes: options.duration, tone: 'Clear', learningGoals: ['Learn'], scope: ['Sky'], outOfScope: ['Other'], constraints: ['Accuracy'], researchRequirements: ['Sources'], status: 'APPROVED' },
    researchQuestions: [{ id: 'RQ-1', filmBriefId: 'FB-1', question: 'Why?', purpose: 'Explain', priority: 'HIGH', status: 'APPROVED' }],
    sources,
    evidence: [{ id: 'EV-1', sourceId: 'SRC-1', researchQuestionId: 'RQ-1', excerpt: 'Excerpt', interpretation: 'Interpretation', strength: 'HIGH', uncertainty: null, status: 'APPROVED' }],
    claims: [{ id: 'CL-1', researchQuestionId: 'RQ-1', evidenceIds: ['EV-1'], text: 'Claim', confidence: 'HIGH', uncertainty: null, status: 'APPROVED' }],
    scriptLines: [{ id: 'SL-1', researchQuestionId: 'RQ-1', claimIds: ['CL-1'], text: 'Line', uncertaintyDisclosure: null, status: 'APPROVED' }],
    scenes: [{ id: 'SC-1', researchQuestionId: 'RQ-1', scriptLineIds: ['SL-1'], title: 'Scene', purpose: 'Explain', visualSummary: 'Summary', uncertaintyDisclosure: null, status: 'APPROVED' }],
    shots,
    visualDecisions,
    coverageWaivers: [],
    audit: { issues: [], passed: true },
    generatedAt: options.generatedAt,
    status: 'READY_FOR_PRODUCTION',
  };
}

describe('production version history', () => {
  it('creates v1 as the immutable current production milestone', () => {
    const versions = appendProductionPackageVersion([], pkg({ generatedAt: '2026-08-23T01:00:00.000Z', duration: 5 }));
    expect(versions).toHaveLength(1);
    expect(versions[0]).toMatchObject({ version: 1, status: 'CURRENT', revisionId: null });
    expect(versions[0].productionPackage.filmBrief.durationMinutes).toBe(5);
  });

  it('supersedes v1 before a revision without deleting the package snapshot', () => {
    const first = pkg({ generatedAt: '2026-08-23T01:00:00.000Z', duration: 5 });
    const versions = supersedeCurrentProductionPackage([], first, '2026-08-23T02:00:00.000Z');
    expect(versions[0]).toMatchObject({ version: 1, status: 'SUPERSEDED', supersededAt: '2026-08-23T02:00:00.000Z' });
    expect(versions[0].productionPackage.generatedAt).toBe(first.generatedAt);
  });

  it('appends a revised v2 linked to the governed revision and keeps v1', () => {
    const first = pkg({ generatedAt: '2026-08-23T01:00:00.000Z', duration: 5 });
    const second = pkg({ generatedAt: '2026-08-23T03:00:00.000Z', duration: 8, sources: 2, shots: 3 });
    let versions = appendProductionPackageVersion([], first);
    versions = supersedeCurrentProductionPackage(versions, first, '2026-08-23T02:00:00.000Z');
    versions = appendProductionPackageVersion(versions, second, { revisionId: 'REV-1', changeSummary: 'Duration expanded after director revision.' });

    expect(versions.map((version) => [version.version, version.status])).toEqual([[1, 'SUPERSEDED'], [2, 'CURRENT']]);
    expect(versions[1].revisionId).toBe('REV-1');
    expect(summarizeProductionVersions(versions)[1].durationMinutes).toBe(8);
  });

  it('compares duration and layer-count changes, including negative deltas', () => {
    const first = appendProductionPackageVersion([], pkg({ generatedAt: '2026-08-23T01:00:00.000Z', duration: 5, sources: 2, shots: 3 }))[0];
    const second = appendProductionPackageVersion([first], pkg({ generatedAt: '2026-08-23T03:00:00.000Z', duration: 8, sources: 1, shots: 1 }), { revisionId: 'REV-2', changeSummary: 'Simplified sources and shots.' })[1];
    const comparison = compareProductionVersions(first, second);

    expect(comparison.durationMinutes).toEqual({ from: 5, to: 8, delta: 3 });
    expect(comparison.countDeltas.sources).toBe(-1);
    expect(comparison.countDeltas.shots).toBe(-2);
    expect(comparison.revisionId).toBe('REV-2');
  });
});
