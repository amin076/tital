import { ShotRecordSchema, type ShotRecord } from '../domain/shotRecord.js';

export type ShotReviewDecision = 'APPROVE' | 'REJECT';

export function reviewShot(shot: ShotRecord, decision: ShotReviewDecision): ShotRecord {
  const parsed = ShotRecordSchema.safeParse(shot);
  if (!parsed.success) {
    throw new Error(`Invalid ShotRecord schema: ${parsed.error.message}`);
  }

  if (shot.status !== 'REVIEW_REQUIRED') {
    throw new Error(
      `ShotRecord is not reviewable: expected REVIEW_REQUIRED, current status is "${shot.status}".`
    );
  }

  return ShotRecordSchema.parse({
    ...shot,
    status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
  });
}
