import crypto from 'crypto';
import { InMemoryRunner, stringifyContent } from '@google/adk';
import { parallelSourceAgent } from '../agents/parallelSourceAgent.js';
import {
  ParallelSourceDiscoverySchema,
  type ParallelSourceDiscovery,
} from '../domain/parallelSourceDiscovery.js';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import { SourceRecordSchema, type SourceRecord } from '../domain/sourceRecord.js';

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
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('Parallel MCP agent returned an empty response.');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(trimmed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Parallel MCP agent returned malformed JSON: ${message}`);
  }

  const parsed = ParallelSourceDiscoverySchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Parallel MCP source validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
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
