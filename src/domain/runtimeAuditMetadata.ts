import { z } from 'zod';

export const RuntimeAuditMetadataSchema = z.object({
  provider: z.string().min(1),
  backend: z.string().min(1),
  modelIdentifier: z.string().min(1),
  agentFramework: z.string().min(1),
  modelPlatform: z.string().min(1),
  cloudRunRevision: z.string().min(1).nullable(),
  cloudRunService: z.string().min(1).nullable(),
  releaseSha: z.string().min(1).nullable(),
  executionTimestamp: z.string().min(1),
});

export const RuntimeFailureMetadataSchema = z.object({
  category: z.string().min(1),
  errorCode: z.string().min(1).nullable().optional(),
  finishReason: z.string().min(1).nullable().optional(),
  eventCount: z.number().int().nonnegative().optional(),
  detail: z.string().min(1).optional(),
});

export type RuntimeAuditMetadata = z.infer<typeof RuntimeAuditMetadataSchema>;
export type RuntimeFailureMetadata = z.infer<typeof RuntimeFailureMetadataSchema>;
