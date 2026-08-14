import { z } from 'zod';

export const ParallelSearchRequestSchema = z.object({
  objective: z.string().min(1, 'Search objective must be a non-empty string'),
  searchQueries: z.array(z.string().min(1, 'Search query must be a non-empty string')).min(1).max(3),
  mode: z.enum(['basic', 'advanced']).default('basic'),
  maxCharsTotal: z.number().int().positive().optional(),
});

export type ParallelSearchRequest = z.infer<typeof ParallelSearchRequestSchema>;

export const ParallelSearchResultSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  publish_date: z.string().nullable(),
  excerpts: z.array(z.string()),
});

export const ParallelSearchResponseSchema = z.object({
  search_id: z.string().min(1),
  session_id: z.string().min(1),
  results: z.array(ParallelSearchResultSchema),
});

export type ParallelSearchResponse = z.infer<typeof ParallelSearchResponseSchema>;

export type ParallelSearchClient = (
  request: ParallelSearchRequest
) => Promise<ParallelSearchResponse>;

export interface ParallelFetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export type ParallelFetch = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  }
) => Promise<ParallelFetchResponse>;

const PARALLEL_SEARCH_URL = 'https://api.parallel.ai/v1/search';

export async function parallelSearch(
  request: ParallelSearchRequest,
  options: {
    apiKey?: string;
    fetchImpl?: ParallelFetch;
  } = {}
): Promise<ParallelSearchResponse> {
  const validatedRequest = ParallelSearchRequestSchema.parse(request);
  const apiKey = options.apiKey ?? process.env.PARALLEL_API_KEY;

  if (!apiKey) {
    throw new Error('Parallel Search configuration error: PARALLEL_API_KEY is not set.');
  }

  const fetchImpl: ParallelFetch = options.fetchImpl ?? (async (url, init) => fetch(url, init));

  const response = await fetchImpl(PARALLEL_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      objective: validatedRequest.objective,
      search_queries: validatedRequest.searchQueries,
      mode: validatedRequest.mode,
      ...(validatedRequest.maxCharsTotal !== undefined
        ? { max_chars_total: validatedRequest.maxCharsTotal }
        : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Parallel Search request failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const parsed = ParallelSearchResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Parallel Search response validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
}
