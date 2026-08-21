import { describe, expect, it } from 'vitest';
import type { PerformanceOperation } from '../src/domain/performanceTrace.js';
import type { ResearchQuestion } from '../src/domain/researchQuestion.js';
import { discoverSourcesWithParallelMcp } from '../src/services/discoverSourcesWithParallelMcp.js';

const question: ResearchQuestion = {
  id: 'RQ-1',
  filmBriefId: 'FB-1',
  question: 'Why is the sky blue?',
  purpose: 'Find authoritative evidence.',
  priority: 'HIGH',
  status: 'APPROVED',
};

const discovery = {
  providerSearchId: 'search-1',
  sources: [
    {
      title: 'Rayleigh scattering',
      url: 'https://example.org/rayleigh',
      excerpt: 'Shorter visible wavelengths are scattered more strongly.',
      publishDate: null,
    },
  ],
};

describe('Parallel source-discovery performance detail', () => {
  it('separates the external agent roundtrip from internal SourceRecord normalization', async () => {
    const operations: PerformanceOperation[] = [];
    const ticks = [0, 5_000, 5_000, 5_300];

    const sources = await discoverSourcesWithParallelMcp(
      question,
      async () => discovery,
      {
        idFactory: () => 'SRC-1',
        now: () => '2026-08-21T00:00:00.000Z',
        performanceNow: () => ticks.shift() ?? 5_300,
        onOperation: (operation) => operations.push(operation),
      }
    );

    expect(sources).toHaveLength(1);
    expect(operations).toEqual([
      {
        name: 'parallel.agent_roundtrip',
        targetId: 'RQ-1',
        durationMs: 5_000,
        success: true,
        kind: 'EXTERNAL',
      },
      {
        name: 'parallel.source_normalization',
        targetId: 'RQ-1',
        durationMs: 300,
        success: true,
        kind: 'INTERNAL',
      },
    ]);
  });
});
