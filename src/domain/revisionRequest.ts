import { z } from 'zod';

export const RevisionTypeSchema = z.enum([
  'PROJECT_DURATION_CHANGE',
  'SOURCE_APPROVAL_REVOKE',
  'CLAIM_REVISION',
  'SHOT_REVISION',
  'VISUAL_REVISION',
]);

export const RevisionTargetTypeSchema = z.enum([
  'PROJECT',
  'SourceRecord',
  'ClaimRecord',
  'ShotRecord',
  'VisualDecisionRecord',
]);

export const RevisionRequestStatusSchema = z.enum([
  'REQUESTED',
  'APPLIED',
  'CANCELLED',
]);

export const RevisionRequestSchema = z.object({
  id: z.string().min(1),
  type: RevisionTypeSchema,
  targetType: RevisionTargetTypeSchema,
  targetRecordId: z.string().min(1).nullable(),
  reason: z.string().trim().min(1).max(2000),
  instruction: z.string().trim().min(1).max(4000).optional(),
  requestedBy: z.string().min(1),
  createdAt: z.string().min(1),
  status: RevisionRequestStatusSchema,
  proposedDurationMinutes: z.number().finite().min(0.5).max(180).optional(),
}).superRefine((request, context) => {
  if (request.type === 'PROJECT_DURATION_CHANGE') {
    if (request.targetType !== 'PROJECT' || request.targetRecordId !== null) {
      context.addIssue({
        code: 'custom',
        message: 'PROJECT_DURATION_CHANGE must target the project and must not carry a record ID.',
      });
    }
    if (request.proposedDurationMinutes === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'PROJECT_DURATION_CHANGE requires proposedDurationMinutes.',
      });
    }
    return;
  }

  const expectedTarget = {
    SOURCE_APPROVAL_REVOKE: 'SourceRecord',
    CLAIM_REVISION: 'ClaimRecord',
    SHOT_REVISION: 'ShotRecord',
    VISUAL_REVISION: 'VisualDecisionRecord',
  }[request.type];

  if (request.targetType !== expectedTarget) {
    context.addIssue({
      code: 'custom',
      message: `${request.type} must target ${expectedTarget}.`,
    });
  }
  if (!request.targetRecordId) {
    context.addIssue({
      code: 'custom',
      message: `${request.type} requires targetRecordId.`,
    });
  }
});

export type RevisionType = z.infer<typeof RevisionTypeSchema>;
export type RevisionTargetType = z.infer<typeof RevisionTargetTypeSchema>;
export type RevisionRequestStatus = z.infer<typeof RevisionRequestStatusSchema>;
export type RevisionRequest = z.infer<typeof RevisionRequestSchema>;
