import crypto from 'crypto';
import { InMemoryRunner, stringifyContent } from '@google/adk';
import { evidenceExtractionAgent } from '../agents/evidenceExtractionAgent.js';
import { EvidenceRecordSchema, type EvidenceRecord } from '../domain/evidenceRecord.js';
import {
  EvidenceProposalListSchema,
  type EvidenceProposalList,
} from '../domain/evidenceProposal.js';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import { SourceRecordSchema, type SourceRecord } from '../domain/sourceRecord.js';

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

export function parseEvidenceProposalList(rawText: string): EvidenceProposalList {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('Evidence extraction agent returned an empty response.');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(trimmed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Evidence extraction agent returned malformed JSON: ${message}`);
  }

  const parsed = EvidenceProposalListSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Evidence proposal validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
}

export function assembleEvidenceRecords(
  source: SourceRecord,
  proposals: EvidenceProposalList,
  options: { idFactory?: () => string } = {}
): EvidenceRecord[] {
  const validated = EvidenceProposalListSchema.parse(proposals);
  const idFactory = options.idFactory ?? (() => `EV-${crypto.randomUUID()}`);

  return validated.evidence.map((proposal) => {
    const record = {
      id: idFactory(),
      sourceId: source.id,
      researchQuestionId: source.researchQuestionId,
      excerpt: proposal.excerpt,
      interpretation: proposal.interpretation,
      strength: proposal.strength,
      uncertainty: proposal.uncertainty,
      status: 'REVIEW_REQUIRED' as const,
    };

    const parsed = EvidenceRecordSchema.safeParse(record);
    if (!parsed.success) {
      throw new Error(`Final EvidenceRecord validation failed: ${parsed.error.message}`);
    }

    return parsed.data;
  });
}

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
            text: `Extract evidence for the approved research question using ONLY the supplied approved source excerpts.\n\nResearchQuestion:\n${JSON.stringify(question, null, 2)}\n\nSourceRecord:\n${JSON.stringify(source, null, 2)}`,
          },
        ],
      },
    });

    for await (const event of run) {
      responseText += stringifyContent(event);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Evidence ADK/model invocation failure: ${message}`);
  }

  return parseEvidenceProposalList(responseText);
}

export async function extractEvidence(
  source: SourceRecord,
  question: ResearchQuestion,
  modelCaller: (
    source: SourceRecord,
    question: ResearchQuestion
  ) => Promise<EvidenceProposalList> = callEvidenceExtractionAgent,
  options: { idFactory?: () => string } = {}
): Promise<EvidenceRecord[]> {
  validateSourceForEvidence(source, question);
  const proposals = await modelCaller(source, question);
  return assembleEvidenceRecords(source, proposals, options);
}
