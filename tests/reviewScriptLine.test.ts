import { describe, expect, it } from 'vitest';
import { type ScriptLineRecord } from '../src/domain/scriptLineRecord.js';
import { reviewScriptLine } from '../src/services/reviewScriptLine.js';

const reviewRequiredLine: ScriptLineRecord = {
  id: 'SL-1',
  researchQuestionId: 'RQ-1',
  claimIds: ['CL-1'],
  text: 'A scientifically grounded narration line.',
  uncertaintyDisclosure: null,
  status: 'REVIEW_REQUIRED',
};

describe('ScriptLine human review', () => {
  it('approves a review-required script line', () => {
    expect(reviewScriptLine(reviewRequiredLine, 'APPROVE').status).toBe('APPROVED');
  });

  it('rejects a review-required script line', () => {
    expect(reviewScriptLine(reviewRequiredLine, 'REJECT').status).toBe('REJECTED');
  });

  it('refuses to re-review a terminal script line', () => {
    expect(() => reviewScriptLine({ ...reviewRequiredLine, status: 'APPROVED' }, 'REJECT')).toThrow(
      'not reviewable'
    );
  });
});
