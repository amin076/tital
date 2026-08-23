import { z } from 'zod';
import { FilmProjectInputSchema } from './filmProjectInput.js';
import { MvpWorkflowStageSchema, MvpWorkflowStateSchema } from './mvpWorkflow.js';
import { WorkflowPerformanceTraceSchema } from './performanceTrace.js';
import { ProductionPackageSchema } from './productionPackage.js';
import { ReviewRecommendationSchema } from './reviewRecommendation.js';
import { RevisionRequestSchema } from './revisionRequest.js';

export const MvpSessionEventTypeSchema = z.enum([
  'SESSION_CREATED',
  'AUTOMATION_EXECUTED',
  'AUTOMATION_FAILED',
  'REVIEW_ASSISTED',
  'REVIEW_DECISION',
  'RETRY_REQUESTED',
  'COVERAGE_WAIVED',
  'REVISION_REQUESTED',
  'REVISION_APPLIED',
  'REVISION_REPAIR_REQUESTED',
  'DOWNSTREAM_INVALIDATED',
  'AUDIT_EXECUTED',
  'PACKAGE_BUILT',
]);

export const MvpSessionEventSchema = z.object({
  id: z.string().min(1),
  type: MvpSessionEventTypeSchema,
  at: z.string().min(1),
  stage: MvpWorkflowStageSchema,
  message: z.string().min(1),
  performance: WorkflowPerformanceTraceSchema.optional(),
});

export const DirectorFeedbackSchema = z.object({
  id: z.string().min(1),
  instruction: z.string().trim().min(1).max(2000),
  capturedAt: z.string().min(1),
  stage: MvpWorkflowStageSchema,
  rejectedRecordIds: z.array(z.string().min(1)).min(1),
});

export const MvpSessionSchema = z.object({
  id: z.string().min(1),
  rawIdea: z.string().min(1),
  projectInput: FilmProjectInputSchema.optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  state: MvpWorkflowStateSchema,
  productionPackage: ProductionPackageSchema.nullable(),
  events: z.array(MvpSessionEventSchema),
  directorFeedback: z.array(DirectorFeedbackSchema).max(50).optional(),
  reviewRecommendations: z.array(ReviewRecommendationSchema).max(500).optional(),
  revisionRequests: z.array(RevisionRequestSchema).max(100).optional(),
});

export type MvpSessionEventType = z.infer<typeof MvpSessionEventTypeSchema>;
export type MvpSessionEvent = z.infer<typeof MvpSessionEventSchema>;
export type DirectorFeedback = z.infer<typeof DirectorFeedbackSchema>;
export type MvpSession = z.infer<typeof MvpSessionSchema>;
