import { describe, expect, it } from 'vitest';
import { type SceneRecord } from '../src/domain/sceneRecord.js';
import { reviewScene } from '../src/services/reviewScene.js';

const scene: SceneRecord = {
  id: 'SC-europa',
  researchQuestionId: 'RQ-europa-ocean',
  scriptLineIds: ['SL-europa'],
  title: 'A hidden conductive layer',
  purpose: 'Translate the approved scientific claim into a visual scene.',
  visualSummary: 'Europa is shown in cutaway as a scientific reconstruction, clearly labeled as such.',
  uncertaintyDisclosure: 'The conductive layer is supported by magnetic evidence; exact composition and extent remain uncertain.',
  status: 'REVIEW_REQUIRED',
};

describe('Scene human review', () => {
  it('approves a reviewable scene', () => {
    expect(reviewScene(scene, 'APPROVE').status).toBe('APPROVED');
  });

  it('rejects a reviewable scene', () => {
    expect(reviewScene(scene, 'REJECT').status).toBe('REJECTED');
  });

  it('refuses to re-review a scene outside REVIEW_REQUIRED', () => {
    expect(() => reviewScene({ ...scene, status: 'APPROVED' }, 'REJECT')).toThrow('not reviewable');
  });
});
