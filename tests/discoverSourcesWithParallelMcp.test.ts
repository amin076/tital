import { describe, expect, it, vi } from 'vitest';
import { type ResearchQuestion } from '../src/domain/researchQuestion.js';
import {
  assembleMcpSourceRecords,
  discoverSourcesWithParallelMcp,
  parseParallelSourceDiscovery,
} from '../src/services/discoverSourcesWithParallelMcp.js';

const approvedQuestion: ResearchQuestion = {
  id: 'RQ-europa-ocean',
  filmBriefId: 'FB-europa',
  question: 'What evidence supports a subsurface ocean on Europa?',
  purpose: 'Identify the strongest evidence before developing the scientific narrative.',
  priority: 'HIGH',
  status: 'APPROVED',
};

const discovery = {
  providerSearchId: null,
  sources: [
    {
      title: 'Why Europa: Evidence for an Ocean',
      url: 'https://science.nasa.gov/mission/europa-clipper/why-europa-evidence-for-an-ocean/',
      excerpt: 'Galileo magnetic measurements strongly implied a conductive fluid layer beneath Europa.',
      publishDate: null,
    },
  ],
};

describe('Phase 4C Parallel MCP + Zod source discovery', () => {
  it('parses and validates structured MCP agent JSON', () => {
    expect(parseParallelSourceDiscovery(JSON.stringify(discovery))).toEqual(discovery);
  });

  it('accepts fenced JSON from the live Parallel agent', () => {
    const fenced = '```json\n' + JSON.stringify(discovery) + '\n```';
    expect(parseParallelSourceDiscovery(fenced)).toEqual(discovery);
  });

  it('rejects malformed JSON before source assembly', () => {
    expect(() => parseParallelSourceDiscovery('{not-json')).toThrow('malformed JSON');
  });

  it('rejects invalid source URLs', () => {
    expect(() =>
      parseParallelSourceDiscovery(
        JSON.stringify({
          ...discovery,
          sources: [{ ...discovery.sources[0], url: 'not-a-url' }],
        })
      )
    ).toThrow('source validation failed');
  });

  it('maps validated MCP candidates to application-owned SourceRecords', () => {
    const sources = assembleMcpSourceRecords(approvedQuestion.id, discovery, {
      idFactory: () => 'SRC-fixed',
      now: () => '2026-08-15T00:00:00.000Z',
    });

    expect(sources).toEqual([
      {
        id: 'SRC-fixed',
        researchQuestionId: approvedQuestion.id,
        provider: 'PARALLEL',
        providerSearchId: null,
        url: discovery.sources[0].url,
        title: discovery.sources[0].title,
        publishDate: null,
        excerpts: [discovery.sources[0].excerpt],
        retrievedAt: '2026-08-15T00:00:00.000Z',
        status: 'DISCOVERED',
      },
    ]);
  });

  it('preserves an exact provider search id when Parallel exposes one', () => {
    const sources = assembleMcpSourceRecords(
      approvedQuestion.id,
      { ...discovery, providerSearchId: 'search-123' },
      {
        idFactory: () => 'SRC-fixed',
        now: () => '2026-08-15T00:00:00.000Z',
      }
    );

    expect(sources[0].providerSearchId).toBe('search-123');
  });

  it('requires APPROVED research questions before invoking the MCP model caller', async () => {
    const modelCaller = vi.fn(async () => discovery);
    const question = { ...approvedQuestion, status: 'REVIEW_REQUIRED' as const };

    await expect(discoverSourcesWithParallelMcp(question, modelCaller)).rejects.toThrow(
      'ResearchQuestion is not approved'
    );
    expect(modelCaller).not.toHaveBeenCalled();
  });

  it('returns validated SourceRecords for an approved question', async () => {
    const modelCaller = vi.fn(async () => discovery);
    const sources = await discoverSourcesWithParallelMcp(approvedQuestion, modelCaller, {
      idFactory: () => 'SRC-mcp-1',
      now: () => '2026-08-15T00:00:00.000Z',
    });

    expect(modelCaller).toHaveBeenCalledOnce();
    expect(sources[0]).toMatchObject({
      id: 'SRC-mcp-1',
      researchQuestionId: approvedQuestion.id,
      provider: 'PARALLEL',
      providerSearchId: null,
      status: 'DISCOVERED',
    });
  });
});
