import { z } from 'zod';

export const ParallelSourceCandidateSchema = z.object({
  title: z.string().min(1, 'Source title must be a non-empty string'),
  url: z.string().url('Source URL must be valid'),
  excerpt: z.string().min(1, 'Source excerpt must be a non-empty string'),
  publishDate: z.string().min(1).nullable(),
});

export const ParallelSourceDiscoverySchema = z.object({
  sources: z.array(ParallelSourceCandidateSchema).min(1).max(8),
});

export type ParallelSourceCandidate = z.infer<typeof ParallelSourceCandidateSchema>;
export type ParallelSourceDiscovery = z.infer<typeof ParallelSourceDiscoverySchema>;
