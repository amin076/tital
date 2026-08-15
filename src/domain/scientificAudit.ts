import { z } from 'zod';

export const ScientificAuditIssueCodeSchema = z.enum([
  'BROKEN_PROVENANCE',
  'UNAPPROVED_UPSTREAM_RECORD',
  'VISUAL_CATEGORY_MISMATCH',
  'MISSING_VISUAL_DISCLOSURE',
  'UNSUPPORTED_CLAIM',
]);

export const ScientificAuditIssueSchema = z.object({
  id: z.string().min(1),
  code: ScientificAuditIssueCodeSchema,
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  recordType: z.enum([
    'SOURCE',
    'EVIDENCE',
    'CLAIM',
    'SCRIPT_LINE',
    'SCENE',
    'SHOT',
    'VISUAL_DECISION',
  ]),
  recordId: z.string().min(1),
  message: z.string().min(1),
});

export const ScientificAuditReportSchema = z.object({
  issues: z.array(ScientificAuditIssueSchema),
  passed: z.boolean(),
});

export type ScientificAuditIssue = z.infer<typeof ScientificAuditIssueSchema>;
export type ScientificAuditReport = z.infer<typeof ScientificAuditReportSchema>;
