import { z } from 'zod';
import { ProductionPackageSchema } from './productionPackage.js';

export const ProductionPackageVersionSchema = z.object({
  version: z.number().int().positive(),
  productionPackage: ProductionPackageSchema,
  revisionId: z.string().min(1).nullable(),
  createdAt: z.string().min(1),
  supersededAt: z.string().min(1).nullable(),
  status: z.enum(['CURRENT', 'SUPERSEDED']),
  changeSummary: z.string().trim().min(1).max(2000),
});

export const ProductionVersionCountsSchema = z.object({
  researchQuestions: z.number().int().nonnegative(),
  sources: z.number().int().nonnegative(),
  evidence: z.number().int().nonnegative(),
  claims: z.number().int().nonnegative(),
  scriptLines: z.number().int().nonnegative(),
  scenes: z.number().int().nonnegative(),
  shots: z.number().int().nonnegative(),
  visualDecisions: z.number().int().nonnegative(),
});

export const ProductionVersionCountDeltasSchema = z.object({
  researchQuestions: z.number().int(),
  sources: z.number().int(),
  evidence: z.number().int(),
  claims: z.number().int(),
  scriptLines: z.number().int(),
  scenes: z.number().int(),
  shots: z.number().int(),
  visualDecisions: z.number().int(),
});

export const ProductionVersionSummarySchema = z.object({
  version: z.number().int().positive(),
  revisionId: z.string().min(1).nullable(),
  createdAt: z.string().min(1),
  supersededAt: z.string().min(1).nullable(),
  status: z.enum(['CURRENT', 'SUPERSEDED']),
  changeSummary: z.string().min(1),
  durationMinutes: z.number().finite().positive(),
  counts: ProductionVersionCountsSchema,
  auditPassed: z.boolean(),
  productionStatus: z.enum(['BLOCKED', 'READY_FOR_PRODUCTION']),
});

export const ProductionVersionComparisonSchema = z.object({
  fromVersion: z.number().int().positive(),
  toVersion: z.number().int().positive(),
  durationMinutes: z.object({ from: z.number(), to: z.number(), delta: z.number() }),
  countDeltas: ProductionVersionCountDeltasSchema,
  revisionId: z.string().min(1).nullable(),
  changeSummary: z.string().min(1),
});

export type ProductionPackageVersion = z.infer<typeof ProductionPackageVersionSchema>;
export type ProductionVersionCounts = z.infer<typeof ProductionVersionCountsSchema>;
export type ProductionVersionCountDeltas = z.infer<typeof ProductionVersionCountDeltasSchema>;
export type ProductionVersionSummary = z.infer<typeof ProductionVersionSummarySchema>;
export type ProductionVersionComparison = z.infer<typeof ProductionVersionComparisonSchema>;
