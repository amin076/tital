import { describe, expect, it } from 'vitest';
import { runScientificAudit, type ScientificAuditInput } from '../src/services/runScientificAudit.js';

const baseInput: ScientificAuditInput = {
  sources: [
    {
      id: 'SRC-1',
      researchQuestionId: 'RQ-1',
      provider: 'PARALLEL',
      providerSearchId: 'search-1',
      url: 'https://example.com/source',
      title: 'Source',
      publishDate: null,
      excerpts: ['Evidence-bearing excerpt'],
      retrievedAt: '2026-08-15T00:00:00.000Z',
      status: 'APPROVED',
    },
  ],
  evidence: [
    {
      id: 'EV-1',
      sourceId: 'SRC-1',
      researchQuestionId: 'RQ-1',
      excerpt: 'Evidence-bearing excerpt',
      interpretation: 'Supports a conductive subsurface layer.',
      strength: 'HIGH',
      uncertainty: 'Does not establish exact composition.',
      status: 'APPROVED',
    },
  ],
  claims: [
    {
      id: 'CL-1',
      researchQuestionId: 'RQ-1',
      evidenceIds: ['EV-1'],
      text: 'A conductive subsurface layer is strongly supported.',
      confidence: 'HIGH',
      uncertainty: 'Exact composition remains uncertain.',
      status: 'APPROVED',
    },
  ],
  scriptLines: [
    {
      id: 'SL-1',
      researchQuestionId: 'RQ-1',
      claimIds: ['CL-1'],
      text: 'Galileo detected a signal consistent with a conductive layer beneath the ice.',
      uncertaintyDisclosure: 'Its exact composition remains uncertain.',
      status: 'APPROVED',
    },
  ],
  scenes: [
    {
      id: 'SC-1',
      researchQuestionId: 'RQ-1',
      scriptLineIds: ['SL-1'],
      title: 'Beneath the ice',
      purpose: 'Explain the evidence without overstating it.',
      visualSummary: 'Move from Europa surface imagery into a labelled reconstruction.',
      uncertaintyDisclosure: 'The interior is reconstructed rather than directly observed.',
      status: 'APPROVED',
    },
  ],
  shots: [
    {
      id: 'SH-1',
      researchQuestionId: 'RQ-1',
      sceneId: 'SC-1',
      scriptLineIds: ['SL-1'],
      description: 'Transition from observed surface to a labelled cutaway.',
      cameraDirection: 'Slow push toward Europa, then dissolve into cutaway.',
      visualIntegrityCategory: 'SCIENTIFIC_RECONSTRUCTION',
      scientificConstraint: 'Do not imply exact ocean geometry is directly observed.',
      uncertaintyDisclosure: 'Scientific reconstruction.',
      status: 'APPROVED',
    },
  ],
  visualDecisions: [
    {
      id: 'VD-1',
      researchQuestionId: 'RQ-1',
      shotId: 'SH-1',
      category: 'SCIENTIFIC_RECONSTRUCTION',
      decision: 'Render a labelled ice-shell cutaway with a non-literal ocean boundary.',
      scientificConstraint: 'Do not imply exact ocean geometry is directly observed.',
      disclosure: 'Scientific reconstruction based on indirect evidence.',
      riskLevel: 'MEDIUM',
      status: 'APPROVED',
    },
  ],
};

describe('Scientific audit', () => {
  it('passes a fully approved, provenance-consistent chain', () => {
    const report = runScientificAudit(baseInput, { idFactory: () => 'AUD-1' });
    expect(report).toEqual({ issues: [], passed: true });
  });

  it('catches a deliberately broken claim evidence link', () => {
    const input: ScientificAuditInput = {
      ...baseInput,
      claims: [{ ...baseInput.claims[0], evidenceIds: ['EV-missing'] }],
    };
    const report = runScientificAudit(input, { idFactory: () => 'AUD-broken' });
    expect(report.passed).toBe(false);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'UNSUPPORTED_CLAIM',
          recordType: 'CLAIM',
          recordId: 'CL-1',
          severity: 'HIGH',
        }),
      ])
    );
  });

  it('catches an approved downstream record that depends on unapproved evidence', () => {
    const input: ScientificAuditInput = {
      ...baseInput,
      evidence: [{ ...baseInput.evidence[0], status: 'REVIEW_REQUIRED' }],
    };
    const report = runScientificAudit(input, { idFactory: () => 'AUD-upstream' });
    expect(report.issues.some((issue) => issue.code === 'UNSUPPORTED_CLAIM')).toBe(true);
  });

  it('catches a visual category mismatch', () => {
    const input: ScientificAuditInput = {
      ...baseInput,
      visualDecisions: [
        { ...baseInput.visualDecisions[0], category: 'OBSERVATION' },
      ],
    };
    const report = runScientificAudit(input, { idFactory: () => 'AUD-category' });
    expect(report.issues.some((issue) => issue.code === 'VISUAL_CATEGORY_MISMATCH')).toBe(true);
  });

  it('catches missing disclosure on medium/high-risk visuals', () => {
    const input: ScientificAuditInput = {
      ...baseInput,
      visualDecisions: [
        { ...baseInput.visualDecisions[0], disclosure: null, riskLevel: 'HIGH' },
      ],
    };
    const report = runScientificAudit(input, { idFactory: () => 'AUD-disclosure' });
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'MISSING_VISUAL_DISCLOSURE',
          severity: 'HIGH',
          recordId: 'VD-1',
        }),
      ])
    );
  });

  it('catches broken shot-to-scene provenance', () => {
    const input: ScientificAuditInput = {
      ...baseInput,
      shots: [{ ...baseInput.shots[0], sceneId: 'SC-missing' }],
    };
    const report = runScientificAudit(input, { idFactory: () => 'AUD-shot' });
    expect(report.issues.some((issue) => issue.code === 'BROKEN_PROVENANCE')).toBe(true);
  });
});
