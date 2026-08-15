import { describe, expect, it } from 'vitest';
import { type ShotRecord } from '../src/domain/shotRecord.js';
import { reviewShot } from '../src/services/reviewShot.js';

const shot: ShotRecord = {
  id: 'SH-1',
  researchQuestionId: 'RQ-1',
  sceneId: 'SC-1',
  scriptLineIds: ['SL-1'],
  description: 'Reveal a cutaway beneath Europa’s ice.',
  cameraDirection: 'Slow push toward the cutaway.',
  visualIntegrityCategory: 'SCIENTIFIC_RECONSTRUCTION',
  scientificConstraint: 'Do not present ocean depth or geometry as directly observed.',
  uncertaintyDisclosure: 'Subsurface structure is inferred from multiple lines of evidence.',
  status: 'REVIEW_REQUIRED',
};

describe('Shot human review', () => {
  it('approves a review-required shot', () => {
    expect(reviewShot(shot, 'APPROVE').status).toBe('APPROVED');
  });

  it('rejects a review-required shot', () => {
    expect(reviewShot(shot, 'REJECT').status).toBe('REJECTED');
  });

  it('does not review a shot twice', () => {
    expect(() => reviewShot({ ...shot, status: 'APPROVED' }, 'APPROVE')).toThrow('not reviewable');
  });
});
