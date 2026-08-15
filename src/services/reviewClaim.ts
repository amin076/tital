import { ClaimRecordSchema, type ClaimRecord } from '../domain/claimRecord.js';

export type ClaimReviewDecision = 'APPROVE' | 'REJECT';

export function reviewClaim(
  claim: ClaimRecord,
  decision: ClaimReviewDecision
): ClaimRecord {
  const parsed = ClaimRecordSchema.safeParse(claim);
  if (!parsed.success) {
    throw new Error(`Invalid ClaimRecord schema: ${parsed.error.message}`);
  }

  if (claim.status !== 'REVIEW_REQUIRED') {
    throw new Error(
      `ClaimRecord is not reviewable: expected REVIEW_REQUIRED, current status is "${claim.status}".`
    );
  }

  return ClaimRecordSchema.parse({
    ...claim,
    status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
  });
}
