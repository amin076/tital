import { describe, expect, it, vi } from 'vitest';
import { type ResearchQuestion } from '../src/domain/researchQuestion.js';
import { type ScriptLineRecord } from '../src/domain/scriptLineRecord.js';
import {
  assembleSceneRecords,
  generateScenes,
  parseSceneProposalList,
  validateScriptLinesForScenes,
} from '../src/services/generateScenes.js';

const approvedQuestion: ResearchQuestion = {
  id: 'RQ-europa-ocean',
  filmBriefId: 'FB-europa',
  question: 'What evidence supports a subsurface ocean on Europa?',
  purpose: 'Ground the film in observed evidence.',
  priority: 'HIGH',
  status: 'APPROVED',
};

const approvedScriptLines: ScriptLineRecord[] = [{
  id: 'SL-europa-magnetic',
  researchQuestionId: approvedQuestion.id,
  claimIds: ['CL-europa-magnetic'],
  text: 'Galileo detected a magnetic signature that strongly points to a conductive layer beneath Europa’s ice.',
  uncertaintyDisclosure: 'The signal supports a conductive layer but does not by itself prove its exact composition or extent.',
  status: 'APPROVED',
}];

const proposals = { scenes: [{
  title: 'A Hidden Conductive Layer',
  scriptLineNumbers: [1],
  purpose: 'Explain why Galileo magnetic measurements support a subsurface conductive layer.',
  visualSummary: 'Introduce Europa, then conceptually show Jupiter’s magnetic field interacting with a conductive layer beneath the ice.',
  uncertaintyDisclosure: 'The magnetic signal supports a conductive layer but does not alone establish exact composition or global extent.',
}] };

describe('Approved ScriptLine → Scene governed generation', () => {
  it('parses numbered script-line references', () => {
    expect(parseSceneProposalList(JSON.stringify(proposals))).toEqual(proposals);
  });

  it('accepts fenced JSON returned by the model', () => {
    expect(parseSceneProposalList('```json\n' + JSON.stringify(proposals) + '\n```')).toEqual(proposals);
  });

  it('rejects non-approved script lines before model invocation', async () => {
    const lines = [{ ...approvedScriptLines[0], status: 'REVIEW_REQUIRED' as const }];
    const modelCaller = vi.fn(async () => proposals);
    await expect(generateScenes(lines, approvedQuestion, modelCaller)).rejects.toThrow('ScriptLineRecord is not approved');
    expect(modelCaller).not.toHaveBeenCalled();
  });

  it('rejects script line/question provenance mismatches', () => {
    const lines = [{ ...approvedScriptLines[0], researchQuestionId: 'RQ-other' }];
    expect(() => validateScriptLinesForScenes(lines, approvedQuestion)).toThrow('researchQuestionId mismatch');
  });

  it('rejects an out-of-range script-line number', () => {
    expect(() => assembleSceneRecords(
      approvedQuestion,
      approvedScriptLines,
      { scenes: [{ ...proposals.scenes[0], scriptLineNumbers: [2] }] },
      { idFactory: () => 'SC-fixed' }
    )).toThrow('script line number outside');
  });

  it('maps script-line numbers to trusted script-line IDs', () => {
    const scenes = assembleSceneRecords(approvedQuestion, approvedScriptLines, proposals, { idFactory: () => 'SC-fixed' });
    expect(scenes[0]).toMatchObject({ id: 'SC-fixed', scriptLineIds: ['SL-europa-magnetic'], status: 'REVIEW_REQUIRED' });
  });

  it('returns validated scenes only from approved script lines', async () => {
    const modelCaller = vi.fn(async () => proposals);
    const scenes = await generateScenes(approvedScriptLines, approvedQuestion, modelCaller, { idFactory: () => 'SC-1' });
    expect(modelCaller).toHaveBeenCalledOnce();
    expect(scenes[0]).toMatchObject({ id: 'SC-1', scriptLineIds: ['SL-europa-magnetic'], status: 'REVIEW_REQUIRED' });
  });
});
