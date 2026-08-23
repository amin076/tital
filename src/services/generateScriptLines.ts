import crypto from 'crypto';
import { InMemoryRunner } from '@google/adk';
import { scientificScriptAgent } from '../agents/scientificScriptAgent.js';
import { ClaimRecordSchema, type ClaimRecord } from '../domain/claimRecord.js';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import {
  ScriptLineProposalListSchema,
  type ScriptLineProposalList,
} from '../domain/scriptLineProposal.js';
import { ScriptLineRecordSchema, type ScriptLineRecord } from '../domain/scriptLineRecord.js';
import { collectAdkResponseText, toModelRuntimeError } from '../utils/adkModelResponse.js';
import { parseJsonFromModelResponse } from '../utils/modelJson.js';

export interface ScientificScriptGenerationContext {
  targetDurationMinutes?: number;
  scopedInstruction?: string;
}

export function validateClaimsForScript(
  claims: ClaimRecord[],
  question: ResearchQuestion
): void {
  const parsedQuestion = ResearchQuestionSchema.safeParse(question);
  if (!parsedQuestion.success) {
    throw new Error(`Invalid ResearchQuestion schema: ${parsedQuestion.error.message}`);
  }
  if (question.status !== 'APPROVED') {
    throw new Error(
      `ResearchQuestion is not approved: script generation requires APPROVED status, current status is "${question.status}".`
    );
  }
  if (claims.length === 0) {
    throw new Error('Script generation requires at least one approved ClaimRecord.');
  }

  const seenIds = new Set<string>();
  for (const claim of claims) {
    const parsedClaim = ClaimRecordSchema.safeParse(claim);
    if (!parsedClaim.success) {
      throw new Error(`Invalid ClaimRecord schema: ${parsedClaim.error.message}`);
    }
    if (claim.status !== 'APPROVED') {
      throw new Error(
        `ClaimRecord is not approved: script generation requires APPROVED status for "${claim.id}", current status is "${claim.status}".`
      );
    }
    if (claim.researchQuestionId !== question.id) {
      throw new Error(
        `ClaimRecord researchQuestionId mismatch for "${claim.id}": expected "${question.id}", received "${claim.researchQuestionId}".`
      );
    }
    if (seenIds.has(claim.id)) {
      throw new Error(`Duplicate ClaimRecord id supplied for script generation: "${claim.id}".`);
    }
    seenIds.add(claim.id);
  }
}

export function parseScriptLineProposalList(rawText: string): ScriptLineProposalList {
  const payload = parseJsonFromModelResponse(rawText, 'Scientific script agent');
  const parsed = ScriptLineProposalListSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Script line proposal validation failed: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function assembleScriptLineRecords(
  question: ResearchQuestion,
  claims: ClaimRecord[],
  proposals: ScriptLineProposalList,
  options: { idFactory?: () => string } = {}
): ScriptLineRecord[] {
  const validated = ScriptLineProposalListSchema.parse(proposals);
  const idFactory = options.idFactory ?? (() => `SL-${crypto.randomUUID()}`);

  return validated.scriptLines.map((proposal) => {
    const uniqueClaimNumbers = [...new Set(proposal.claimNumbers)];
    const claimIds = uniqueClaimNumbers.map((claimNumber) => {
      const claim = claims[claimNumber - 1];
      if (!claim) {
        throw new Error(
          `Script line proposal references claim number outside the supplied approved claims: ${claimNumber}.`
        );
      }
      return claim.id;
    });

    const record = {
      id: idFactory(),
      researchQuestionId: question.id,
      claimIds,
      text: proposal.text,
      uncertaintyDisclosure: proposal.uncertaintyDisclosure,
      status: 'REVIEW_REQUIRED' as const,
    };

    const parsed = ScriptLineRecordSchema.safeParse(record);
    if (!parsed.success) {
      throw new Error(`Final ScriptLineRecord validation failed: ${parsed.error.message}`);
    }
    return parsed.data;
  });
}

export async function callScientificScriptAgent(
  claims: ClaimRecord[],
  question: ResearchQuestion,
  generationContext?: ScientificScriptGenerationContext
): Promise<ScriptLineProposalList> {
  const runner = new InMemoryRunner({ agent: scientificScriptAgent });
  let responseText = '';
  const numberedClaims = claims.map((claim, index) => ({
    claimNumber: index + 1,
    text: claim.text,
    confidence: claim.confidence,
    uncertainty: claim.uncertainty,
  }));
  const contextText = generationContext
    ? `\n\nProduction context (this may shape pacing/coverage but MUST NOT add scientific facts):\n${JSON.stringify(generationContext, null, 2)}`
    : '';

  try {
    const run = runner.runEphemeral({
      userId: 'system',
      newMessage: {
        parts: [
          {
            text: `Write evidence-governed scientific script lines for this approved research question using ONLY the supplied numbered approved claims.\n\nResearchQuestion:\n${question.question}\n\nApproved numbered claims:\n${JSON.stringify(numberedClaims, null, 2)}${contextText}\n\nIf a targetDurationMinutes value is supplied, treat it as the intended duration of the whole film, not a license to invent facts. If a scopedInstruction is supplied for a revision, change structure, pacing, emphasis, or wording only within the approved claims and their uncertainty limits.`,
          },
        ],
      },
    });
    responseText = await collectAdkResponseText(run, { label: 'Scientific script agent' });
  } catch (error) {
    throw toModelRuntimeError('Scientific script agent', error);
  }

  return parseScriptLineProposalList(responseText);
}

export async function generateScriptLines(
  claims: ClaimRecord[],
  question: ResearchQuestion,
  modelCaller: (
    claims: ClaimRecord[],
    question: ResearchQuestion,
    generationContext?: ScientificScriptGenerationContext
  ) => Promise<ScriptLineProposalList> = callScientificScriptAgent,
  options: {
    idFactory?: () => string;
    generationContext?: ScientificScriptGenerationContext;
  } = {}
): Promise<ScriptLineRecord[]> {
  validateClaimsForScript(claims, question);
  const proposals = await modelCaller(claims, question, options.generationContext);
  return assembleScriptLineRecords(question, claims, proposals, options);
}
