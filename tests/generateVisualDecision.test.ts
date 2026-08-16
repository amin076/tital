import { describe, expect, it, vi } from 'vitest';
import { type ShotRecord } from '../src/domain/shotRecord.js';
import {
  assembleVisualDecisionRecord,
  deriveRequiredVisualDisclosure,
  generateVisualDecision,
  parseVisualDecisionProposal,
} from '../src/services/generateVisualDecision.js';

const approvedShot: ShotRecord = {
  id: 'SH-europa-cutaway',
  researchQuestionId: 'RQ-europa-ocean',
  sceneId: 'SC-europa-interior',
  scriptLineIds: ['SL-europa-magnetic'],
  description: 'Reveal a cutaway beneath Europa’s ice while narration explains inferred subsurface structure.',
  cameraDirection: 'Slow push toward the cutaway.',
  visualIntegrityCategory: 'SCIENTIFIC_RECONSTRUCTION',
  scientificConstraint: 'Do not present ocean depth, salinity, or geometry as directly observed.',
  uncertaintyDisclosure: 'The subsurface ocean is strongly supported, but exact geometry remains uncertain.',
  status: 'APPROVED',
};

const proposal = {
  category: 'SCIENTIFIC_RECONSTRUCTION' as const,
  decision: 'Show a labeled cutaway reconstruction of Europa with an ice shell above a subsurface liquid layer.',
  scientificConstraint: approvedShot.scientificConstraint,
  disclosure: 'Scientific reconstruction: exact ocean geometry is not directly observed.',
  riskLevel: 'MEDIUM' as const,
};

describe('Approved Shot → Visual Decision governed generation', () => {
  it('parses structured visual decision proposals', () => {
    expect(parseVisualDecisionProposal(JSON.stringify(proposal))).toEqual(proposal);
  });

  it('rejects non-approved shots before model invocation', async () => {
    const modelCaller = vi.fn(async () => proposal);
    await expect(
      generateVisualDecision({ ...approvedShot, status: 'REVIEW_REQUIRED' }, modelCaller)
    ).rejects.toThrow('not approved');
    expect(modelCaller).not.toHaveBeenCalled();
  });

  it('rejects category drift from an approved shot', () => {
    expect(() =>
      assembleVisualDecisionRecord(approvedShot, { ...proposal, category: 'OBSERVATION' })
    ).toThrow('category mismatch');
  });

  it('preserves a model-provided disclosure for medium or high visual risk', () => {
    expect(deriveRequiredVisualDisclosure(approvedShot, proposal)).toBe(proposal.disclosure);
  });

  it('derives a viewer-facing disclosure from shot uncertainty when medium or high risk omits one', () => {
    const record = assembleVisualDecisionRecord(
      approvedShot,
      { ...proposal, disclosure: null },
      { idFactory: () => 'VD-fallback' }
    );

    expect(record.disclosure).toBe(
      'Scientific Reconstruction: The subsurface ocean is strongly supported, but exact geometry remains uncertain.'
    );
  });

  it('derives a generic evidence-governed disclosure when the approved shot has no uncertainty text', () => {
    const shotWithoutDisclosure = { ...approvedShot, uncertaintyDisclosure: null };
    const record = assembleVisualDecisionRecord(
      shotWithoutDisclosure,
      { ...proposal, disclosure: null },
      { idFactory: () => 'VD-generic-fallback' }
    );

    expect(record.disclosure).toBe(
      'Scientific Reconstruction: this visual is an evidence-based representation and should not be interpreted as direct observation.'
    );
  });

  it('keeps null disclosure for low risk when the model omits it', () => {
    const lowRiskProposal = { ...proposal, riskLevel: 'LOW' as const, disclosure: null };
    expect(deriveRequiredVisualDisclosure(approvedShot, lowRiskProposal)).toBeNull();
  });

  it('creates application-owned VisualDecisionRecord in REVIEW_REQUIRED state', async () => {
    const modelCaller = vi.fn(async () => proposal);
    const record = await generateVisualDecision(approvedShot, modelCaller, {
      idFactory: () => 'VD-fixed',
    });

    expect(record).toMatchObject({
      id: 'VD-fixed',
      researchQuestionId: approvedShot.researchQuestionId,
      shotId: approvedShot.id,
      category: 'SCIENTIFIC_RECONSTRUCTION',
      riskLevel: 'MEDIUM',
      status: 'REVIEW_REQUIRED',
    });
  });

  it('does not require the model to echo the trusted shotId', () => {
    const record = assembleVisualDecisionRecord(approvedShot, proposal, {
      idFactory: () => 'VD-app-owned-shot-id',
    });

    expect(record.shotId).toBe(approvedShot.id);
  });
});
