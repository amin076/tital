import { describe, expect, it, vi } from 'vitest';
import { type ShotRecord } from '../src/domain/shotRecord.js';
import {
  assembleVisualDecisionRecord,
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
  shotId: approvedShot.id,
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

  it('rejects proposals for another shot', () => {
    expect(() =>
      assembleVisualDecisionRecord(approvedShot, { ...proposal, shotId: 'SH-other' })
    ).toThrow('shotId mismatch');
  });

  it('rejects category drift from an approved shot', () => {
    expect(() =>
      assembleVisualDecisionRecord(approvedShot, { ...proposal, category: 'OBSERVATION' })
    ).toThrow('category mismatch');
  });

  it('requires disclosure for medium or high visual risk', () => {
    expect(() =>
      assembleVisualDecisionRecord(approvedShot, { ...proposal, disclosure: null })
    ).toThrow('requires a viewer-facing disclosure');
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
});
