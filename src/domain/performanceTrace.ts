import { z } from 'zod';

export const PerformanceOperationSchema = z.object({
  name: z.string().min(1),
  targetId: z.string().min(1).nullable(),
  durationMs: z.number().int().nonnegative(),
  success: z.boolean(),
});

export const WorkflowPerformanceTraceSchema = z.object({
  durationMs: z.number().int().nonnegative(),
  externalCallCount: z.number().int().nonnegative(),
  operations: z.array(PerformanceOperationSchema).max(100),
});

export type PerformanceOperation = z.infer<typeof PerformanceOperationSchema>;
export type WorkflowPerformanceTrace = z.infer<typeof WorkflowPerformanceTraceSchema>;
