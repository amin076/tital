import { describe, expect, it, vi } from 'vitest';
import { type ResearchQuestion } from '../src/domain/researchQuestion.js';
import {
  discoverSources,
  mapParallelResultsToSources,
} from '../src/services/discoverSources.js';
import {
  parallelSearch,
  type ParallelFetch,
  type ParallelSearchResponse,
} from '../src/integrations/parallel/parallelSearch.js';

const approvedQuestion: ResearchQuestion = {
  id: 'RQ-europa-ocean',
  filmBriefId: 'FB-europa',
  question: 'What evidence supports a subsurface ocean on Europa?',
  purpose: 'Identify the strongest evidence before developing the scientific narrative.',
  priority: 'HIGH',
  status: 'APPROVED',
};

const searchResponse: ParallelSearchResponse = {
  search_id: 'search-123',
  session_id: 'session-123',
  results: [
    {
      url: 'https://science.nasa.gov/europa/',
      title: 'Europa',
      publish_date: null,
      excerpts: ['Europa is an icy moon of Jupiter.'],
    },
    {
      url: 'https://example.org/paper',
      title: 'Europa ocean evidence',
      publish_date: '2025-01-10',
      excerpts: ['Magnetic measurements are consistent with a conductive layer.'],
    },
  ],
};

const request = {
  objective: 'Find evidence relevant to the approved Europa subsurface-ocean research question.',
  searchQueries: ['Europa subsurface ocean evidence', 'Europa magnetic field ocean'],
  mode: 'basic' as const,
};

describe('Phase 4A source discovery', () => {
  it('maps Parallel results into validated SourceRecords', () => {
    let nextId = 0;
    const sources = mapParallelResultsToSources(
      approvedQuestion.id,
      searchResponse,
      () => `SRC-test-${++nextId}`,
      () => '2026-08-14T00:00:00.000Z'
    );

    expect(sources).toHaveLength(2);
    expect(sources[0]).toMatchObject({
      id: 'SRC-test-1',
      researchQuestionId: approvedQuestion.id,
      provider: 'PARALLEL',
      providerSearchId: 'search-123',
      status: 'DISCOVERED',
      retrievedAt: '2026-08-14T00:00:00.000Z',
    });
  });

  it('allows only APPROVED ResearchQuestions to start source discovery', async () => {
    const searchClient = vi.fn(async () => searchResponse);
    await discoverSources(approvedQuestion, request, searchClient);
    expect(searchClient).toHaveBeenCalledOnce();
  });

  it('rejects a REVIEW_REQUIRED ResearchQuestion before calling Parallel', async () => {
    const searchClient = vi.fn(async () => searchResponse);
    const question = { ...approvedQuestion, status: 'REVIEW_REQUIRED' as const };

    await expect(discoverSources(question, request, searchClient)).rejects.toThrow(
      'ResearchQuestion is not approved'
    );
    expect(searchClient).not.toHaveBeenCalled();
  });

  it('keeps ResearchQuestion IDs application-controlled', async () => {
    const searchClient = vi.fn(async () => searchResponse);
    const sources = await discoverSources(approvedQuestion, request, searchClient, {
      idFactory: () => 'SRC-fixed',
      now: () => '2026-08-14T00:00:00.000Z',
    });

    expect(sources[0].researchQuestionId).toBe(approvedQuestion.id);
  });

  it('rejects invalid Parallel Search requests before provider invocation', async () => {
    const searchClient = vi.fn(async () => searchResponse);
    const badRequest = { ...request, searchQueries: [] };

    await expect(discoverSources(approvedQuestion, badRequest, searchClient)).rejects.toThrow(
      'Invalid Parallel Search request'
    );
    expect(searchClient).not.toHaveBeenCalled();
  });

  it('requires a Parallel API key before issuing a request', async () => {
    const fetchImpl = vi.fn() as unknown as ParallelFetch;

    await expect(parallelSearch(request, { apiKey: '', fetchImpl })).rejects.toThrow(
      'PARALLEL_API_KEY is not set'
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends the documented Parallel v1 Search request shape', async () => {
    let capturedUrl = '';
    let capturedInit: Parameters<ParallelFetch>[1] | undefined;
    const fetchImpl: ParallelFetch = async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return {
        ok: true,
        status: 200,
        json: async () => searchResponse,
        text: async () => '',
      };
    };

    await parallelSearch(request, { apiKey: 'test-key', fetchImpl });

    expect(capturedUrl).toBe('https://api.parallel.ai/v1/search');
    expect(capturedInit?.headers['x-api-key']).toBe('test-key');
    expect(JSON.parse(capturedInit?.body ?? '{}')).toEqual({
      objective: request.objective,
      search_queries: request.searchQueries,
      mode: 'basic',
    });
  });

  it('surfaces non-success Parallel responses clearly', async () => {
    const fetchImpl: ParallelFetch = async () => ({
      ok: false,
      status: 429,
      json: async () => ({}),
      text: async () => 'rate limited',
    });

    await expect(parallelSearch(request, { apiKey: 'test-key', fetchImpl })).rejects.toThrow(
      'Parallel Search request failed (429): rate limited'
    );
  });

  it('rejects malformed Parallel response payloads', async () => {
    const fetchImpl: ParallelFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ search_id: 'search-123', results: 'not-an-array' }),
      text: async () => '',
    });

    await expect(parallelSearch(request, { apiKey: 'test-key', fetchImpl })).rejects.toThrow(
      'Parallel Search response validation failed'
    );
  });
});
