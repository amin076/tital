import { z } from 'zod';

export const ParallelSourceCandidateSchema = z.object({
  title: z.string().trim().min(1, 'Source title must be a non-empty string'),
  url: z.string().url('Source URL must be valid'),
  excerpt: z.string().trim().min(1, 'Source excerpt must be a non-empty string'),
  publishDate: z.string().trim().min(1).nullable(),
});

export const ParallelSourceDiscoverySchema = z.object({
  providerSearchId: z.string().trim().min(1).nullable(),
  sources: z.array(ParallelSourceCandidateSchema).min(1).max(8),
});

export type ParallelSourceCandidate = z.infer<typeof ParallelSourceCandidateSchema>;
export type ParallelSourceDiscovery = z.infer<typeof ParallelSourceDiscoverySchema>;
