import { ScriptLineRecordSchema, type ScriptLineRecord } from '../domain/scriptLineRecord.js';

export type ScriptLineReviewDecision = 'APPROVE' | 'REJECT';

export function reviewScriptLine(
  scriptLine: ScriptLineRecord,
  decision: ScriptLineReviewDecision
): ScriptLineRecord {
  const parsed = ScriptLineRecordSchema.safeParse(scriptLine);
  if (!parsed.success) {
    throw new Error(`Invalid ScriptLineRecord schema: ${parsed.error.message}`);
  }

  if (scriptLine.status !== 'REVIEW_REQUIRED') {
    throw new Error(
      `ScriptLineRecord is not reviewable: expected REVIEW_REQUIRED, current status is "${scriptLine.status}".`
    );
  }

  return ScriptLineRecordSchema.parse({
    ...scriptLine,
    status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
  });
}
