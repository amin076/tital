import crypto from 'node:crypto';
import { InMemoryRunner } from '@google/adk';
import { reviewEvaluatorAgent } from '../agents/reviewEvaluatorAgent.js';
import { TITAL_GEMINI_MODEL } from '../config/models.js';
import { EvidenceRecordSchema, type EvidenceRecord } from '../domain/evidenceRecord.js';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import {
  ReviewRecommendationProposalListSchema,
  ReviewRecommendationSchema,
  type ReviewRecommendation,
  type ReviewRecommendationProposalList,
  type ReviewTargetType,
} from '../domain/reviewRecommendation.js';
import { SourceRecordSchema, type SourceRecord } from '../domain/sourceRecord.js';
import { collectAdkResponseText, toModelRuntimeError } from '../utils/adkModelResponse.js';
import { parseJsonFromModelResponse } from '../utils/modelJson.js';

export interface ReviewEvaluatorRequest {
  targetType: ReviewTargetType;
  researchQuestion: ResearchQuestion;
  sources?: SourceRecord[];
  candidates: Array<SourceRecord | EvidenceRecord>;
}

export type ReviewEvaluatorModelCaller = (
  request: ReviewEvaluatorRequest
) => Promise<ReviewRecommendationProposalList>;

export interface ReviewRecommendationOptions {
  idFactory?: () => string;
  now?: () => string;
}

function normalizeRecommendationEnvelope(payload: unknown): unknown {
  return Array.isArray(payload) ? { recommendations: payload } : payload;
}

export function parseReviewRecommendationProposalList(
  rawText: string
): ReviewRecommendationProposalList {
  const payload = parseJsonFromModelResponse(rawText, 'Review evaluator agent');
  const parsed = ReviewRecommendationProposalListSchema.safeParse(
    normalizeRecommendationEnvelope(payload)
  );

  if (!parsed.success) {
    throw new Error(`Review recommendation validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
}

function validateApprovedQuestion(question: ResearchQuestion): ResearchQuestion {
  const parsed = ResearchQuestionSchema.safeParse(question);
  if (!parsed.success) {
    throw new Error(`Invalid ResearchQuestion schema: ${parsed.error.message}`);
  }
  if (parsed.data.status !== 'APPROVED') {
    throw new Error(
      `Review assistance requires an APPROVED ResearchQuestion; current status is "${parsed.data.status}".`
    );
  }
  return parsed.data;
}

function validateSourceCandidates(
  question: ResearchQuestion,
  candidates: SourceRecord[]
): SourceRecord[] {
  if (candidates.length === 0) {
    throw new Error('Source review assistance requires at least one candidate.');
  }

  return candidates.map((candidate) => {
    const parsed = SourceRecordSchema.safeParse(candidate);
    if (!parsed.success) {
      throw new Error(`Invalid SourceRecord schema: ${parsed.error.message}`);
    }
    if (parsed.data.researchQuestionId !== question.id) {
      throw new Error(
        `SourceRecord researchQuestionId mismatch: expected "${question.id}", received "${parsed.data.researchQuestionId}".`
      );
    }
    if (!['DISCOVERED', 'REVIEW_REQUIRED'].includes(parsed.data.status)) {
      throw new Error(
        `Source review assistance only evaluates pending source candidates; "${parsed.data.id}" is ${parsed.data.status}.`
      );
    }
    return parsed.data;
  });
}

function validateEvidenceCandidates(
  question: ResearchQuestion,
  sources: SourceRecord[],
  candidates: EvidenceRecord[]
): { sources: SourceRecord[]; evidence: EvidenceRecord[] } {
  if (sources.length === 0) {
    throw new Error('Evidence review assistance requires at least one approved SourceRecord.');
  }

  const validatedSources = sources.map((source) => {
    const parsed = SourceRecordSchema.safeParse(source);
    if (!parsed.success) {
      throw new Error(`Invalid SourceRecord schema: ${parsed.error.message}`);
    }
    if (parsed.data.status !== 'APPROVED') {
      throw new Error(
        `Evidence review assistance requires APPROVED SourceRecord inputs; "${parsed.data.id}" is ${parsed.data.status}.`
      );
    }
    if (parsed.data.researchQuestionId !== question.id) {
      throw new Error(
        `SourceRecord researchQuestionId mismatch: expected "${question.id}", received "${parsed.data.researchQuestionId}".`
      );
    }
    return parsed.data;
  });
  const sourceById = new Map(validatedSources.map((source) => [source.id, source]));

  if (candidates.length === 0) {
    throw new Error('Evidence review assistance requires at least one candidate.');
  }

  const evidence = candidates.map((candidate) => {
    const parsed = EvidenceRecordSchema.safeParse(candidate);
    if (!parsed.success) {
      throw new Error(`Invalid EvidenceRecord schema: ${parsed.error.message}`);
    }
    if (parsed.data.researchQuestionId !== question.id) {
      throw new Error(
        `EvidenceRecord researchQuestionId mismatch: expected "${question.id}", received "${parsed.data.researchQuestionId}".`
      );
    }
    if (!sourceById.has(parsed.data.sourceId)) {
      throw new Error(
        `EvidenceRecord "${parsed.data.id}" references SourceRecord "${parsed.data.sourceId}" that is not supplied as an approved review source.`
      );
    }
    if (parsed.data.status !== 'REVIEW_REQUIRED') {
      throw new Error(
        `Evidence review assistance only evaluates pending evidence candidates; "${parsed.data.id}" is ${parsed.data.status}.`
      );
    }
    return parsed.data;
  });

  return { sources: validatedSources, evidence };
}

function modelSafeCandidates(request: ReviewEvaluatorRequest): unknown[] {
  if (request.targetType === 'SOURCE') {
    return (request.candidates as SourceRecord[]).map((candidate, index) => ({
      candidateNumber: index + 1,
      title: candidate.title,
      url: candidate.url,
      publishDate: candidate.publishDate,
      excerpts: candidate.excerpts,
    }));
  }

  const sourceById = new Map((request.sources ?? []).map((source) => [source.id, source]));
  return (request.candidates as EvidenceRecord[]).map((candidate, index) => {
    const source = sourceById.get(candidate.sourceId);
    return {
      candidateNumber: index + 1,
      excerpt: candidate.excerpt,
      interpretation: candidate.interpretation,
      strength: candidate.strength,
      uncertainty: candidate.uncertainty,
      approvedSource: source
        ? {
            title: source.title,
            url: source.url,
            publishDate: source.publishDate,
            excerpts: source.excerpts,
          }
        : null,
    };
  });
}

export async function callReviewEvaluatorAgent(
  request: ReviewEvaluatorRequest
): Promise<ReviewRecommendationProposalList> {
  const runner = new InMemoryRunner({ agent: reviewEvaluatorAgent });
  let responseText = '';

  try {
    const run = runner.runEphemeral({
      userId: 'system',
      newMessage: {
        parts: [
          {
            text: `Provide non-authoritative human-review recommendations using ONLY this supplied context.\n\nTarget type:\n${request.targetType}\n\nResearchQuestion:\n${JSON.stringify(request.researchQuestion, null, 2)}\n\nNumbered candidates:\n${JSON.stringify(modelSafeCandidates(request), null, 2)}`,
          },
        ],
      },
    });

    responseText = await collectAdkResponseText(run, {
      label: 'Review evaluator agent',
    });
  } catch (error) {
    throw toModelRuntimeError('Review evaluator agent', error);
  }

  return parseReviewRecommendationProposalList(responseText);
}

export function assembleReviewRecommendations(
  targetType: ReviewTargetType,
  candidates: Array<SourceRecord | EvidenceRecord>,
  proposals: ReviewRecommendationProposalList,
  options: ReviewRecommendationOptions = {}
): ReviewRecommendation[] {
  const validated = ReviewRecommendationProposalListSchema.parse(proposals);
  const expectedNumbers = new Set(candidates.map((_, index) => index + 1));
  const returnedNumbers = new Set<number>();

  for (const proposal of validated.recommendations) {
    if (!expectedNumbers.has(proposal.candidateNumber)) {
      throw new Error(
        `Review evaluator returned unknown candidateNumber ${proposal.candidateNumber}.`
      );
    }
    if (returnedNumbers.has(proposal.candidateNumber)) {
      throw new Error(
        `Review evaluator returned duplicate candidateNumber ${proposal.candidateNumber}.`
      );
    }
    returnedNumbers.add(proposal.candidateNumber);
  }

  if (returnedNumbers.size !== candidates.length) {
    throw new Error(
      `Review evaluator returned ${returnedNumbers.size} recommendation(s) for ${candidates.length} candidate(s).`
    );
  }

  const idFactory = options.idFactory ?? (() => `REV-${crypto.randomUUID()}`);
  const now = options.now ?? (() => new Date().toISOString());

  return validated.recommendations
    .sort((a, b) => a.candidateNumber - b.candidateNumber)
    .map((proposal) => {
      const target = candidates[proposal.candidateNumber - 1];
      return ReviewRecommendationSchema.parse({
        id: idFactory(),
        targetType,
        targetRecordId: target.id,
        recommendation: proposal.recommendation,
        attention: proposal.attention,
        confidence: proposal.confidence,
        reasons: proposal.reasons,
        risks: proposal.risks,
        flags: proposal.flags,
        createdAt: now(),
        model: TITAL_GEMINI_MODEL,
      });
    });
}

export async function evaluateSourceReviewRecommendations(
  researchQuestion: ResearchQuestion,
  candidates: SourceRecord[],
  modelCaller: ReviewEvaluatorModelCaller = callReviewEvaluatorAgent,
  options: ReviewRecommendationOptions = {}
): Promise<ReviewRecommendation[]> {
  const question = validateApprovedQuestion(researchQuestion);
  const sources = validateSourceCandidates(question, candidates);
  const request: ReviewEvaluatorRequest = {
    targetType: 'SOURCE',
    researchQuestion: question,
    candidates: sources,
  };
  const proposals = await modelCaller(request);
  return assembleReviewRecommendations('SOURCE', sources, proposals, options);
}

export async function evaluateEvidenceReviewRecommendations(
  researchQuestion: ResearchQuestion,
  sourceOrSources: SourceRecord | SourceRecord[],
  candidates: EvidenceRecord[],
  modelCaller: ReviewEvaluatorModelCaller = callReviewEvaluatorAgent,
  options: ReviewRecommendationOptions = {}
): Promise<ReviewRecommendation[]> {
  const question = validateApprovedQuestion(researchQuestion);
  const suppliedSources = Array.isArray(sourceOrSources) ? sourceOrSources : [sourceOrSources];
  const validated = validateEvidenceCandidates(question, suppliedSources, candidates);
  const request: ReviewEvaluatorRequest = {
    targetType: 'EVIDENCE',
    researchQuestion: question,
    sources: validated.sources,
    candidates: validated.evidence,
  };
  const proposals = await modelCaller(request);
  return assembleReviewRecommendations('EVIDENCE', validated.evidence, proposals, options);
}
