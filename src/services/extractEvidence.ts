import crypto from 'crypto';
import { InMemoryRunner } from '@google/adk';
import { evidenceExtractionAgent } from '../agents/evidenceExtractionAgent.js';
import {
  EvidenceGroundingSchema,
  EvidenceRecordSchema,
  type EvidenceGrounding,
  type EvidenceRecord,
} from '../domain/evidenceRecord.js';
import {
  EvidenceProposalListSchema,
  type EvidenceProposal,
  type EvidenceProposalList,
} from '../domain/evidenceProposal.js';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import { SourceRecordSchema, type SourceRecord } from '../domain/sourceRecord.js';
import { collectAdkResponseText, toModelRuntimeError } from '../utils/adkModelResponse.js';
import { parseJsonFromModelResponse } from '../utils/modelJson.js';

export const DEFAULT_MAX_EVIDENCE_PER_SOURCE = 3;

export function validateSourceForEvidence(
  source: SourceRecord,
  question: ResearchQuestion
): void {
  const parsedSource = SourceRecordSchema.safeParse(source);
  if (!parsedSource.success) {
    throw new Error(`Invalid SourceRecord schema: ${parsedSource.error.message}`);
  }

  const parsedQuestion = ResearchQuestionSchema.safeParse(question);
  if (!parsedQuestion.success) {
    throw new Error(`Invalid ResearchQuestion schema: ${parsedQuestion.error.message}`);
  }

  if (source.status !== 'APPROVED') {
    throw new Error(
      `SourceRecord is not approved: evidence extraction requires APPROVED status, current status is "${source.status}".`
    );
  }

  if (question.status !== 'APPROVED') {
    throw new Error(
      `ResearchQuestion is not approved: evidence extraction requires APPROVED status, current status is "${question.status}".`
    );
  }

  if (source.researchQuestionId !== question.id) {
    throw new Error(
      `SourceRecord researchQuestionId mismatch: expected "${question.id}", received "${source.researchQuestionId}".`
    );
  }
}

function normalizeEvidenceProposalEnvelope(payload: unknown): unknown {
  return Array.isArray(payload) ? { evidence: payload } : payload;
}

export function parseEvidenceProposalList(rawText: string): EvidenceProposalList {
  const payload = parseJsonFromModelResponse(rawText, 'Evidence extraction agent');
  const normalizedPayload = normalizeEvidenceProposalEnvelope(payload);

  const parsed = EvidenceProposalListSchema.safeParse(normalizedPayload);
  if (!parsed.success) {
    throw new Error(`Evidence proposal validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
}

function strengthRank(proposal: EvidenceProposal): number {
  if (proposal.strength === 'HIGH') return 3;
  if (proposal.strength === 'MEDIUM') return 2;
  return 1;
}

export function strongestEvidenceProposals(
  proposals: EvidenceProposalList,
  maxItems = DEFAULT_MAX_EVIDENCE_PER_SOURCE
): EvidenceProposalList {
  const validated = EvidenceProposalListSchema.parse(proposals);
  const safeMax = Math.max(1, Math.min(8, Math.floor(maxItems)));
  return {
    evidence: [...validated.evidence]
      .sort((a, b) => strengthRank(b) - strengthRank(a))
      .slice(0, safeMax),
  };
}

export function assembleEvidenceRecords(
  source: SourceRecord,
  proposals: EvidenceProposalList,
  options: { idFactory?: () => string; grounding?: EvidenceGrounding } = {}
): EvidenceRecord[] {
  const validated = EvidenceProposalListSchema.parse(proposals);
  const idFactory = options.idFactory ?? (() => `EV-${crypto.randomUUID()}`);
  const grounding = options.grounding
    ? EvidenceGroundingSchema.parse(options.grounding)
    : undefined;

  return validated.evidence.map((proposal) => {
    const record = {
      id: idFactory(),
      sourceId: source.id,
      researchQuestionId: source.researchQuestionId,
      excerpt: proposal.excerpt,
      interpretation: proposal.interpretation,
      strength: proposal.strength,
      uncertainty: proposal.uncertainty,
      ...(grounding ? { grounding } : {}),
      status: 'REVIEW_REQUIRED' as const,
    };

    const parsed = EvidenceRecordSchema.safeParse(record);
    if (!parsed.success) {
      throw new Error(`Final EvidenceRecord validation failed: ${parsed.error.message}`);
    }

    return parsed.data;
  });
}

/**
 * Production evidence extraction is no longer grounded in discovery snippets.
 * The agent must call Parallel MCP web_fetch for the exact approved URL first.
 */
export async function callEvidenceExtractionAgent(
  source: SourceRecord,
  question: ResearchQuestion
): Promise<EvidenceProposalList> {
  const runner = new InMemoryRunner({ agent: evidenceExtractionAgent });
  let responseText = '';

  try {
    const run = runner.runEphemeral({
      userId: 'system',
      newMessage: {
        parts: [
          {
            text: `Extract the strongest production-relevant evidence for this APPROVED research question from the FULL content of the exact APPROVED source URL. You MUST call Parallel MCP web_fetch for this URL before answering. The earlier search excerpt is intentionally not supplied as evidence grounding. Prefer a compact set of distinct propositions rather than exhaustive extraction.\n\nResearch question:\n${question.question}\n\nApproved source title:\n${source.title}\n\nExact approved source URL:\n${source.url}`,
          },
        ],
      },
    });

    responseText = await collectAdkResponseText(run, { label: 'Evidence extraction agent' });
  } catch (error) {
    throw toModelRuntimeError('Evidence extraction agent', error);
  }

  return parseEvidenceProposalList(responseText);
}

export function fullSourceGroundingFor(
  source: SourceRecord,
  fetchedAt: string
): EvidenceGrounding {
  return EvidenceGroundingSchema.parse({
    mode: 'PARALLEL_WEB_FETCH',
    provider: 'PARALLEL',
    sourceUrl: source.url,
    fetchedAt,
    discoveryExcerptUsedAsGrounding: false,
  });
}

export async function extractEvidence(
  source: SourceRecord,
  question: ResearchQuestion,
  modelCaller: (
    source: SourceRecord,
    question: ResearchQuestion
  ) => Promise<EvidenceProposalList> = callEvidenceExtractionAgent,
  options: {
    idFactory?: () => string;
    now?: () => string;
    fullSourceGrounded?: boolean;
    maxItems?: number;
  } = {}
): Promise<EvidenceRecord[]> {
  validateSourceForEvidence(source, question);
  const proposals = strongestEvidenceProposals(
    await modelCaller(source, question),
    options.maxItems ?? DEFAULT_MAX_EVIDENCE_PER_SOURCE
  );
  const fullSourceGrounded = options.fullSourceGrounded ?? modelCaller === callEvidenceExtractionAgent;
  const grounding = fullSourceGrounded
    ? fullSourceGroundingFor(source, (options.now ?? (() => new Date().toISOString()))())
    : undefined;
  return assembleEvidenceRecords(source, proposals, {
    idFactory: options.idFactory,
    grounding,
  });
}
