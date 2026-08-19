import { describe, expect, it, vi } from 'vitest';
import { type ClaimRecord } from '../src/domain/claimRecord.js';
import { type ResearchQuestion } from '../src/domain/researchQuestion.js';
import {
  assembleScriptLineRecords,
  generateScriptLines,
  parseScriptLineProposalList,
  validateClaimsForScript,
} from '../src/services/generateScriptLines.js';

const approvedQuestion: ResearchQuestion = {
  id: 'RQ-europa-ocean',
  filmBriefId: 'FB-europa',
  question: 'What evidence supports a subsurface ocean on Europa?',
  purpose: 'Ground the film in observed evidence.',
  priority: 'HIGH',
  status: 'APPROVED',
};

const approvedClaims: ClaimRecord[] = [{
  id: 'CL-europa-magnetic',
  researchQuestionId: approvedQuestion.id,
  evidenceIds: ['EV-magnetic'],
  text: 'Galileo magnetic measurements provide strong evidence for a conductive subsurface layer on Europa.',
  confidence: 'HIGH',
  uncertainty: 'The measurement does not by itself establish exact composition or global extent.',
  status: 'APPROVED',
}];

const proposals = { scriptLines: [{
  text: 'Galileo detected a magnetic signature that strongly points to a conductive layer beneath Europa’s ice.',
  claimNumbers: [1],
  uncertaintyDisclosure: 'The signal supports a conductive layer but does not by itself prove its exact composition or extent.',
}] };

describe('Approved Claim → Script Line governed generation', () => {
  it('parses numbered claim references', () => {
    expect(parseScriptLineProposalList(JSON.stringify(proposals))).toEqual(proposals);
  });

  it('accepts fenced JSON returned by the model', () => {
    expect(parseScriptLineProposalList('```json\n' + JSON.stringify(proposals) + '\n```')).toEqual(proposals);
  });

  it('rejects non-approved claims before model invocation', async () => {
    const claims = [{ ...approvedClaims[0], status: 'REVIEW_REQUIRED' as const }];
    const modelCaller = vi.fn(async () => proposals);
    await expect(generateScriptLines(claims, approvedQuestion, modelCaller)).rejects.toThrow('ClaimRecord is not approved');
    expect(modelCaller).not.toHaveBeenCalled();
  });

  it('rejects claim/question provenance mismatches', () => {
    const claims = [{ ...approvedClaims[0], researchQuestionId: 'RQ-other' }];
    expect(() => validateClaimsForScript(claims, approvedQuestion)).toThrow('researchQuestionId mismatch');
  });

  it('rejects an out-of-range claim number', () => {
    expect(() => assembleScriptLineRecords(
      approvedQuestion,
      approvedClaims,
      { scriptLines: [{ ...proposals.scriptLines[0], claimNumbers: [2] }] },
      { idFactory: () => 'SL-fixed' }
    )).toThrow('claim number outside');
  });

  it('maps claim numbers to trusted claim IDs', () => {
    const lines = assembleScriptLineRecords(approvedQuestion, approvedClaims, proposals, { idFactory: () => 'SL-fixed' });
    expect(lines[0]).toMatchObject({ id: 'SL-fixed', claimIds: ['CL-europa-magnetic'], status: 'REVIEW_REQUIRED' });
  });

  it('returns validated script lines only from approved claims', async () => {
    const modelCaller = vi.fn(async () => proposals);
    const lines = await generateScriptLines(approvedClaims, approvedQuestion, modelCaller, { idFactory: () => 'SL-1' });
    expect(modelCaller).toHaveBeenCalledOnce();
    expect(lines[0]).toMatchObject({ id: 'SL-1', claimIds: ['CL-europa-magnetic'], status: 'REVIEW_REQUIRED' });
  });
});
