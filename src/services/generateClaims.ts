import crypto from 'crypto';
import { InMemoryRunner } from '@google/adk';
import { claimGenerationAgent } from '../agents/claimGenerationAgent.js';
import { ClaimRecordSchema, type ClaimRecord } from '../domain/claimRecord.js';
import { ClaimProposalListSchema, type ClaimProposalList } from '../domain/claimProposal.js';
import { EvidenceRecordSchema, type EvidenceRecord } from '../domain/evidenceRecord.js';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import { collectAdkResponseText, toModelRuntimeError } from '../utils/adkModelResponse.js';
import { parseJsonFromModelResponse } from '../utils/modelJson.js';

export function validateEvidenceForClaims(
  evidenceRecords: EvidenceRecord[],
  question: ResearchQuestion
): void {
  const parsedQuestion = ResearchQuestionSchema.safeParse(question);
  if (!parsedQuestion.success) {
    throw new Error(`Invalid ResearchQuestion schema: ${parsedQuestion.error.message}`);
  }
  if (question.status !== 'APPROVED') {
    throw new Error(
      `ResearchQuestion is not approved: claim generation requires APPROVED status, current status is "${question.status}".`
    );
  }
  if (evidenceRecords.length === 0) {
    throw new Error('Claim generation requires at least one approved EvidenceRecord.');
  }

  const seenIds = new Set<string>();
  for (const evidence of evidenceRecords) {
    const parsedEvidence = EvidenceRecordSchema.safeParse(evidence);
    if (!parsedEvidence.success) {
      throw new Error(`Invalid EvidenceRecord schema: ${parsedEvidence.error.message}`);
    }
    if (evidence.status !== 'APPROVED') {
      throw new Error(
        `EvidenceRecord is not approved: claim generation requires APPROVED status for "${evidence.id}", current status is "${evidence.status}".`
      );
    }
    if (evidence.researchQuestionId !== question.id) {
      throw new Error(
        `EvidenceRecord researchQuestionId mismatch for "${evidence.id}": expected "${question.id}", received "${evidence.researchQuestionId}".`
      );
    }
    if (seenIds.has(evidence.id)) {
      throw new Error(`Duplicate EvidenceRecord id supplied for claim generation: "${evidence.id}".`);
    }
    seenIds.add(evidence.id);
  }
}

export function parseClaimProposalList(rawText: string): ClaimProposalList {
  const payload = parseJsonFromModelResponse(rawText, 'Claim generation agent');
  const parsed = ClaimProposalListSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Claim proposal validation failed: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function assembleClaimRecords(
  question: ResearchQuestion,
  evidenceRecords: EvidenceRecord[],
  proposals: ClaimProposalList,
  options: { idFactory?: () => string } = {}
): ClaimRecord[] {
  const validated = ClaimProposalListSchema.parse(proposals);
  const idFactory = options.idFactory ?? (() => `CL-${crypto.randomUUID()}`);

  return validated.claims.map((proposal) => {
    const uniqueEvidenceNumbers = [...new Set(proposal.evidenceNumbers)];
    const evidenceIds = uniqueEvidenceNumbers.map((evidenceNumber) => {
      const evidence = evidenceRecords[evidenceNumber - 1];
      if (!evidence) {
        throw new Error(
          `Claim proposal references evidence number outside the supplied approved evidence: ${evidenceNumber}.`
        );
      }
      return evidence.id;
    });

    const record = {
      id: idFactory(),
      researchQuestionId: question.id,
      evidenceIds,
      text: proposal.text,
      confidence: proposal.confidence,
      uncertainty: proposal.uncertainty,
      status: 'REVIEW_REQUIRED' as const,
    };

    const parsed = ClaimRecordSchema.safeParse(record);
    if (!parsed.success) {
      throw new Error(`Final ClaimRecord validation failed: ${parsed.error.message}`);
    }
    return parsed.data;
  });
}

export async function callClaimGenerationAgent(
  evidenceRecords: EvidenceRecord[],
  question: ResearchQuestion
): Promise<ClaimProposalList> {
  const runner = new InMemoryRunner({ agent: claimGenerationAgent });
  let responseText = '';
  const numberedEvidence = evidenceRecords.map((evidence, index) => ({
    evidenceNumber: index + 1,
    excerpt: evidence.excerpt,
    interpretation: evidence.interpretation,
    strength: evidence.strength,
    uncertainty: evidence.uncertainty,
  }));

  try {
    const run = runner.runEphemeral({
      userId: 'system',
      newMessage: {
        parts: [
          {
            text: `Generate scientific claims for this approved research question using ONLY the supplied numbered approved evidence.\n\nResearchQuestion:\n${question.question}\n\nApproved numbered evidence:\n${JSON.stringify(numberedEvidence, null, 2)}`,
          },
        ],
      },
    });
    responseText = await collectAdkResponseText(run, { label: 'Claim generation agent' });
  } catch (error) {
    throw toModelRuntimeError('Claim generation agent', error);
  }

  return parseClaimProposalList(responseText);
}

export async function generateClaims(
  evidenceRecords: EvidenceRecord[],
  question: ResearchQuestion,
  modelCaller: (
    evidenceRecords: EvidenceRecord[],
    question: ResearchQuestion
  ) => Promise<ClaimProposalList> = callClaimGenerationAgent,
  options: { idFactory?: () => string } = {}
): Promise<ClaimRecord[]> {
  validateEvidenceForClaims(evidenceRecords, question);
  const proposals = await modelCaller(evidenceRecords, question);
  return assembleClaimRecords(question, evidenceRecords, proposals, options);
}
