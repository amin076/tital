import crypto from 'crypto';
import { InMemoryRunner } from '@google/adk';
import { z } from 'zod';
import { parallelSourceAgent } from '../agents/parallelSourceAgent.js';
import {
  ParallelSourceCandidateSchema,
  ParallelSourceDiscoverySchema,
  type ParallelSourceCandidate,
  type ParallelSourceDiscovery,
} from '../domain/parallelSourceDiscovery.js';
import type { PerformanceOperation } from '../domain/performanceTrace.js';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import { SourceRecordSchema, type SourceRecord } from '../domain/sourceRecord.js';
import { collectAdkResponseText, ModelRuntimeError, toModelRuntimeError } from '../utils/adkModelResponse.js';
import { parseJsonFromModelResponse } from '../utils/modelJson.js';
import { resolveRuntimeAuditMetadata } from './resolveRuntimeAuditMetadata.js';

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

  const validSources: ParallelSourceCandidate[] = [];
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

    responseText = await collectAdkResponseText(run, { label: 'Parallel MCP agent' });
  } catch (error) {
    throw toModelRuntimeError('Parallel MCP agent', error);
  }

  return parseParallelSourceDiscovery(responseText);
}

export async function discoverSourcesWithParallelMcp(
  question: ResearchQuestion,
  modelCaller: (question: ResearchQuestion) => Promise<ParallelSourceDiscovery> = callParallelSourceAgent,
  options: {
    idFactory?: () => string;
    now?: () => string;
    performanceNow?: () => number;
    onOperation?: (operation: PerformanceOperation) => void;
  } = {}
): Promise<SourceRecord[]> {
  validateResearchQuestionForMcpDiscovery(question);
  const performanceNow = options.performanceNow ?? (() => Date.now());

  const roundTripStarted = performanceNow();
  let discovery: ParallelSourceDiscovery;
  try {
    discovery = await modelCaller(question);
    options.onOperation?.({
      name: 'parallel.agent_roundtrip',
      targetId: question.id,
      durationMs: Math.max(0, Math.round(performanceNow() - roundTripStarted)),
      success: true,
      kind: 'EXTERNAL',
      runtime: resolveRuntimeAuditMetadata(),
    });
  } catch (error) {
    const modelFailure = error instanceof ModelRuntimeError ? error.diagnostics : null;
    options.onOperation?.({
      name: 'parallel.agent_roundtrip',
      targetId: question.id,
      durationMs: Math.max(0, Math.round(performanceNow() - roundTripStarted)),
      success: false,
      kind: 'EXTERNAL',
      runtime: modelFailure?.runtime ?? resolveRuntimeAuditMetadata(),
      ...(modelFailure
        ? {
            failure: {
              category: modelFailure.category,
              errorCode: modelFailure.errorCode,
              finishReason: modelFailure.finishReason,
              eventCount: modelFailure.eventCount,
              detail: modelFailure.detail,
            },
          }
        : {}),
    });
    throw error;
  }

  const normalizationStarted = performanceNow();
  try {
    const records = assembleMcpSourceRecords(question.id, discovery, options);
    options.onOperation?.({
      name: 'parallel.source_normalization',
      targetId: question.id,
      durationMs: Math.max(0, Math.round(performanceNow() - normalizationStarted)),
      success: true,
      kind: 'INTERNAL',
    });
    return records;
  } catch (error) {
    options.onOperation?.({
      name: 'parallel.source_normalization',
      targetId: question.id,
      durationMs: Math.max(0, Math.round(performanceNow() - normalizationStarted)),
      success: false,
      kind: 'INTERNAL',
    });
    throw error;
  }
}
