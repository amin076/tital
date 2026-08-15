import { z } from 'zod';
import { MvpWorkflowStageSchema, MvpWorkflowStateSchema } from './mvpWorkflow.js';
import { ProductionPackageSchema } from './productionPackage.js';

export const MvpSessionEventTypeSchema = z.enum([
  'SESSION_CREATED',
  'AUTOMATION_EXECUTED',
  'REVIEW_DECISION',
  'AUDIT_EXECUTED',
  'PACKAGE_BUILT',
]);

export const MvpSessionEventSchema = z.object({
  id: z.string().min(1),
  type: MvpSessionEventTypeSchema,
  at: z.string().min(1),
  stage: MvpWorkflowStageSchema,
  message: z.string().min(1),
});

export const MvpSessionSchema = z.object({
  id: z.string().min(1),
  rawIdea: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  state: MvpWorkflowStateSchema,
  productionPackage: ProductionPackageSchema.nullable(),
  events: z.array(MvpSessionEventSchema),
});

export type MvpSessionEventType = z.infer<typeof MvpSessionEventTypeSchema>;
export type MvpSessionEvent = z.infer<typeof MvpSessionEventSchema>;
export type MvpSession = z.infer<typeof MvpSessionSchema>;
