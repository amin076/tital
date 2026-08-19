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
      scriptLineNumbers: [1],
      description: 'Europa fills frame, then transitions to a clearly labeled cutaway reconstruction beneath the surface.',
      cameraDirection: 'Slow push toward the surface followed by a controlled cutaway reveal.',
      visualIntegrityCategory: 'SCIENTIFIC_RECONSTRUCTION' as const,
      scientificConstraint: 'Do not depict the ocean as directly photographed; keep the cutaway labeled as reconstruction and avoid implying known exact depth.',
      uncertaintyDisclosure: 'Exact composition and depth remain uncertain.',
    },
  ],
};

describe('Approved Scene → Shot governed generation', () => {
  it('parses valid shot proposals without application-owned provenance IDs', () => {
    expect(parseShotProposalList(JSON.stringify(proposals))).toEqual(proposals);
  });

  it('accepts fenced JSON returned by the model', () => {
    const fenced = '```json\n' + JSON.stringify(proposals) + '\n```';
    expect(parseShotProposalList(fenced)).toEqual(proposals);
  });

  it('ignores model output that tries to include application-owned IDs', () => {
    const withTrustedIds = {
      shots: [
        {
          ...proposals.shots[0],
          sceneId: 'SC-invented',
          scriptLineIds: ['SL-invented'],
        },
      ],
    };
    expect(parseShotProposalList(JSON.stringify(withTrustedIds))).toEqual(proposals);
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

  it('rejects script line numbers outside the approved scene', () => {
    expect(() =>
      assembleShotRecords(
        scene,
        {
          shots: [{ ...proposals.shots[0], scriptLineNumbers: [2] }],
        },
        { idFactory: () => 'SH-fixed' }
      )
    ).toThrow('outside the approved scene');
  });

  it('maps model line numbers to application-owned script-line IDs', () => {
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

  it('deduplicates repeated line numbers before assigning trusted IDs', () => {
    const shots = assembleShotRecords(
      scene,
      {
        shots: [{ ...proposals.shots[0], scriptLineNumbers: [1, 1] }],
      },
      { idFactory: () => 'SH-fixed' }
    );
    expect(shots[0].scriptLineIds).toEqual(['SL-europa']);
  });
});
