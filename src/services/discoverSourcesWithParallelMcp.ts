import crypto from 'crypto';
import { InMemoryRunner, stringifyContent } from '@google/adk';
import { z } from 'zod';
import { parallelSourceAgent } from '../agents/parallelSourceAgent.js';
import {
  ParallelSourceCandidateSchema,
  ParallelSourceDiscoverySchema,
  type ParallelSourceDiscovery,
} from '../domain/parallelSourceDiscovery.js';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import { SourceRecordSchema, type SourceRecord } from '../domain/sourceRecord.js';
import { parseJsonFromModelResponse } from '../utils/modelJson.js';

const ParallelSourceDiscoveryEnvelopeSchema = z.object({
  providerSearchId: z.string().trim().min(1).nullable(),
  sources: z.array(z.unknown()).min(1).max(8),
});

export function validateResearchQuestionForMcpDiscovery(question: ResearchQuestion): void {
  const parsed = ResearchQuestionSchema.safeParse(question);
  if (!parsed.success) {
    throw new Error(`Invalid ResearchQuestion schema: ${parsed.error.message}`);
  }

  if (question.status !== 'APPROVED') {
    throw new Error(
      `ResearchQuestion is not approved: MCP source discovery requires APPROVED status, current status is "${question.status}".`
    );
  }
}

export function parseParallelSourceDiscovery(rawText: string): ParallelSourceDiscovery {
  const payload = parseJsonFromModelResponse(rawText, 'Parallel MCP agent');
  const envelope = ParallelSourceDiscoveryEnvelopeSchema.safeParse(payload);
  if (!envelope.success) {
    throw new Error(`Parallel MCP source validation failed: ${envelope.error.message}`);
  }

  const validSources = [];
  const rejectedIssues: string[] = [];

  envelope.data.sources.forEach((candidate, index) => {
    const parsed = ParallelSourceCandidateSchema.safeParse(candidate);
    if (parsed.success) {
      validSources.push(parsed.data);
      return;
    }

    rejectedIssues.push(
      `sources[${index}]: ${parsed.error.issues.map((issue) => issue.message).join('; ')}`
    );
  });

  if (validSources.length === 0) {
    throw new Error(
      `Parallel MCP source validation failed: no valid source candidates remained. ${rejectedIssues.join(' | ')}`
    );
  }

  if (rejectedIssues.length > 0) {
    console.warn(
      `Parallel MCP discarded ${rejectedIssues.length} malformed source candidate(s): ${rejectedIssues.join(' | ')}`
    );
  }

  return ParallelSourceDiscoverySchema.parse({
    providerSearchId: envelope.data.providerSearchId,
    sources: validSources,
  });
}

export function assembleMcpSourceRecords(
  questionId: string,
  discovery: ParallelSourceDiscovery,
  options: {
    idFactory?: () => string;
    now?: () => string;
  } = {}
): SourceRecord[] {
  const validated = ParallelSourceDiscoverySchema.parse(discovery);
  const idFactory = options.idFactory ?? (() => `SRC-${crypto.randomUUID()}`);
  const now = options.now ?? (() => new Date().toISOString());

  return validated.sources.map((candidate) => {
    const source = {
      id: idFactory(),
      researchQuestionId: questionId,
      provider: 'PARALLEL' as const,
      providerSearchId: validated.providerSearchId,
      url: candidate.url,
      title: candidate.title,
      publishDate: candidate.publishDate,
      excerpts: [candidate.excerpt],
      retrievedAt: now(),
      status: 'DISCOVERED' as const,
    };

    const parsed = SourceRecordSchema.safeParse(source);
    if (!parsed.success) {
      throw new Error(`Final SourceRecord validation failed: ${parsed.error.message}`);
    }

    return parsed.data;
  });
}

export async function callParallelSourceAgent(question: ResearchQuestion): Promise<ParallelSourceDiscovery> {
  const runner = new InMemoryRunner({ agent: parallelSourceAgent });
  let responseText = '';

  try {
    const run = runner.runEphemeral({
      userId: 'system',
      newMessage: {
        parts: [
          {
            text: `Find public-web sources for this approved scientific research question:\n\n${question.question}`,
          },
        ],
      },
    });

    for await (const event of run) {
      responseText += stringifyContent(event);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Parallel MCP/ADK invocation failure: ${message}`);
  }

  return parseParallelSourceDiscovery(responseText);
}

export async function discoverSourcesWithParallelMcp(
  question: ResearchQuestion,
  modelCaller: (question: ResearchQuestion) => Promise<ParallelSourceDiscovery> = callParallelSourceAgent,
  options: {
    idFactory?: () => string;
    now?: () => string;
  } = {}
): Promise<SourceRecord[]> {
  validateResearchQuestionForMcpDiscovery(question);
  const discovery = await modelCaller(question);
  return assembleMcpSourceRecords(question.id, discovery, options);
}
