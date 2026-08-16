import { describe, expect, it, vi } from 'vitest';
import { type ResearchQuestion } from '../src/domain/researchQuestion.js';
import { type SceneRecord } from '../src/domain/sceneRecord.js';
import { type ScriptLineRecord } from '../src/domain/scriptLineRecord.js';
import {
  assembleShotRecords,
  generateShots,
  parseShotProposalList,
  validateSceneForShots,
} from '../src/services/generateShots.js';

const question: ResearchQuestion = {
  id: 'RQ-europa-ocean',
  filmBriefId: 'FB-europa',
  question: 'What evidence supports a subsurface ocean on Europa?',
  purpose: 'Ground the film in observed evidence.',
  priority: 'HIGH',
  status: 'APPROVED',
};

const scriptLines: ScriptLineRecord[] = [
  {
    id: 'SL-europa',
    researchQuestionId: question.id,
    claimIds: ['CL-europa'],
    text: 'Galileo detected a magnetic signature consistent with a conductive layer beneath Europa’s ice.',
    uncertaintyDisclosure: 'The signal does not by itself establish exact composition or global extent.',
    status: 'APPROVED',
  },
];

const scene: SceneRecord = {
  id: 'SC-europa',
  researchQuestionId: question.id,
  scriptLineIds: ['SL-europa'],
  title: 'Beneath the ice',
  purpose: 'Show the inference without presenting it as direct observation.',
  visualSummary: 'A labeled scientific reconstruction reveals Europa’s ice shell and a possible conductive layer beneath it.',
  uncertaintyDisclosure: 'The subsurface layer is inferred from measurements rather than directly observed.',
  status: 'APPROVED',
};

const proposals = {
  shots: [
    {
      scriptLineIds: ['SL-europa'],
      description: 'Europa fills frame, then transitions to a clearly labeled cutaway reconstruction beneath the surface.',
      cameraDirection: 'Slow push toward the surface followed by a controlled cutaway reveal.',
      visualIntegrityCategory: 'SCIENTIFIC_RECONSTRUCTION' as const,
      scientificConstraint: 'Do not depict the ocean as directly photographed; keep the cutaway labeled as reconstruction and avoid implying known exact depth.',
      uncertaintyDisclosure: 'Exact composition and depth remain uncertain.',
    },
  ],
};

describe('Approved Scene → Shot governed generation', () => {
  it('parses valid shot proposals without application-owned scene identity', () => {
    expect(parseShotProposalList(JSON.stringify(proposals))).toEqual(proposals);
  });

  it('accepts fenced JSON returned by the model', () => {
    const fenced = '```json\n' + JSON.stringify(proposals) + '\n```';
    expect(parseShotProposalList(fenced)).toEqual(proposals);
  });

  it('rejects model output that tries to include an application-owned sceneId', () => {
    const withSceneId = {
      shots: [{ ...proposals.shots[0], sceneId: 'SC-invented' }],
    };
    expect(() => parseShotProposalList(JSON.stringify(withSceneId))).not.toThrow();
    expect(parseShotProposalList(JSON.stringify(withSceneId))).toEqual(proposals);
  });

  it('rejects non-approved scenes before model invocation', async () => {
    const modelCaller = vi.fn(async () => proposals);
    await expect(
      generateShots({ ...scene, status: 'REVIEW_REQUIRED' }, scriptLines, question, modelCaller)
    ).rejects.toThrow('SceneRecord is not approved');
    expect(modelCaller).not.toHaveBeenCalled();
  });

  it('rejects missing scene script-line provenance', () => {
    expect(() => validateSceneForShots(scene, [], question)).toThrow('requires the approved ScriptLineRecords');
  });

  it('rejects invented scriptLineIds in shot proposals', () => {
    expect(() =>
      assembleShotRecords(
        scene,
        {
          shots: [{ ...proposals.shots[0], scriptLineIds: ['SL-invented'] }],
        },
        { idFactory: () => 'SH-fixed' }
      )
    ).toThrow('not present in the approved scene');
  });

  it('assembles application-owned ShotRecords in REVIEW_REQUIRED state', () => {
    const shots = assembleShotRecords(scene, proposals, { idFactory: () => 'SH-fixed' });
    expect(shots[0]).toMatchObject({
      id: 'SH-fixed',
      researchQuestionId: question.id,
      sceneId: scene.id,
      scriptLineIds: ['SL-europa'],
      visualIntegrityCategory: 'SCIENTIFIC_RECONSTRUCTION',
      status: 'REVIEW_REQUIRED',
    });
  });
});
