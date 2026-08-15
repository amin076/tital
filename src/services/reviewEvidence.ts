import { EvidenceRecordSchema, type EvidenceRecord } from '../domain/evidenceRecord.js';

export type EvidenceReviewDecision = 'APPROVE' | 'REJECT';

export function reviewEvidence(
  evidence: EvidenceRecord,
  decision: EvidenceReviewDecision
): EvidenceRecord {
  const parsed = EvidenceRecordSchema.safeParse(evidence);
  if (!parsed.success) {
    throw new Error(`Invalid EvidenceRecord schema: ${parsed.error.message}`);
  }

  if (evidence.status !== 'REVIEW_REQUIRED') {
    throw new Error(
      `EvidenceRecord is not reviewable: expected REVIEW_REQUIRED, current status is "${evidence.status}".`
    );
  }

  return EvidenceRecordSchema.parse({
    ...evidence,
    status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
  });
}
