import crypto from 'node:crypto';
import { InMemoryRunner } from '@google/adk';
import { reviewEvaluatorAgent } from '../agents/reviewEvaluatorAgent.js';
import { TITAL_GEMINI_MODEL } from '../config/models.js';
import type { ClaimRecord } from '../domain/claimRecord.js';
import { EvidenceRecordSchema, type EvidenceRecord } from '../domain/evidenceRecord.js';
import type { FilmBrief } from '../domain/filmBrief.js';
import type { FilmProjectInput } from '../domain/filmProjectInput.js';
import type { MvpWorkflowState } from '../domain/mvpWorkflow.js';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import {
  ReviewRecommendationProposalListSchema,
  ReviewRecommendationSchema,
  type ReviewRecommendation,
  type ReviewRecommendationProposalList,
  type ReviewTargetType,
} from '../domain/reviewRecommendation.js';
import type { SceneRecord } from '../domain/sceneRecord.js';
import type { ScriptLineRecord } from '../domain/scriptLineRecord.js';
import type { ShotRecord } from '../domain/shotRecord.js';
import { SourceRecordSchema, type SourceRecord } from '../domain/sourceRecord.js';
import type { VisualDecisionRecord } from '../domain/visualDecisionRecord.js';
import { collectAdkResponseText, toModelRuntimeError } from '../utils/adkModelResponse.js';
import { parseJsonFromModelResponse } from '../utils/modelJson.js';

export type ReviewCandidate =
  | FilmBrief
  | ResearchQuestion
  | SourceRecord
  | EvidenceRecord
  | ClaimRecord
  | ScriptLineRecord
  | SceneRecord
  | ShotRecord
  | VisualDecisionRecord;

export interface ReviewEvaluatorRequest {
  targetType: ReviewTargetType;
  researchQuestion?: ResearchQuestion;
  projectInput?: FilmProjectInput;
  workflowState?: MvpWorkflowState;
  sources?: SourceRecord[];
  candidates: ReviewCandidate[];
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

function safeFilmBrief(brief: FilmBrief | undefined) {
  if (!brief) return null;
  return {
    title: brief.title,
    scientificTopic: brief.scientificTopic,
    scientificQuestion: brief.scientificQuestion,
    communicationObjective: brief.communicationObjective,
    targetAudience: brief.targetAudience,
    audienceKnowledgeLevel: brief.audienceKnowledgeLevel,
    format: brief.format,
    durationMinutes: brief.durationMinutes,
    tone: brief.tone,
    learningGoals: brief.learningGoals,
    scope: brief.scope,
    outOfScope: brief.outOfScope,
    constraints: brief.constraints,
    researchRequirements: brief.researchRequirements,
  };
}

function safeQuestion(question: ResearchQuestion | undefined) {
  if (!question) return null;
  return {
    question: question.question,
    purpose: question.purpose,
    priority: question.priority,
  };
}

function safeSource(source: SourceRecord | undefined) {
  if (!source) return null;
  return {
    provider: source.provider,
    url: source.url,
    title: source.title,
    publishDate: source.publishDate,
    excerpts: source.excerpts,
  };
}

function safeEvidence(evidence: EvidenceRecord, state?: MvpWorkflowState) {
  const source = state?.sources.find((record) => record.id === evidence.sourceId);
  return {
    excerpt: evidence.excerpt,
    interpretation: evidence.interpretation,
    strength: evidence.strength,
    uncertainty: evidence.uncertainty,
    grounding: evidence.grounding,
    approvedSource: safeSource(source),
  };
}

function safeClaim(claim: ClaimRecord, state?: MvpWorkflowState) {
  const evidence = state?.evidence.filter((record) => claim.evidenceIds.includes(record.id)) ?? [];
  return {
    text: claim.text,
    confidence: claim.confidence,
    uncertainty: claim.uncertainty,
    supportingEvidence: evidence.map((record) => safeEvidence(record, state)),
  };
}

function safeScriptLine(line: ScriptLineRecord, state?: MvpWorkflowState) {
  const claims = state?.claims.filter((record) => line.claimIds.includes(record.id)) ?? [];
  return {
    text: line.text,
    uncertaintyDisclosure: line.uncertaintyDisclosure,
    supportingClaims: claims.map((record) => safeClaim(record, state)),
  };
}

function safeScene(scene: SceneRecord, state?: MvpWorkflowState) {
  const scriptLines = state?.scriptLines.filter((record) => scene.scriptLineIds.includes(record.id)) ?? [];
  return {
    title: scene.title,
    purpose: scene.purpose,
    visualSummary: scene.visualSummary,
    uncertaintyDisclosure: scene.uncertaintyDisclosure,
    decisionProvenance: scene.decisionProvenance,
    supportingScriptLines: scriptLines.map((record) => safeScriptLine(record, state)),
  };
}

function safeShot(shot: ShotRecord, state?: MvpWorkflowState) {
  const scene = state?.scenes.find((record) => record.id === shot.sceneId);
  const scriptLines = state?.scriptLines.filter((record) => shot.scriptLineIds.includes(record.id)) ?? [];
  return {
    description: shot.description,
    cameraDirection: shot.cameraDirection,
    visualIntegrityCategory: shot.visualIntegrityCategory,
    scientificConstraint: shot.scientificConstraint,
    uncertaintyDisclosure: shot.uncertaintyDisclosure,
    decisionProvenance: shot.decisionProvenance,
    approvedScene: scene ? safeScene(scene, state) : null,
    supportingScriptLines: scriptLines.map((record) => safeScriptLine(record, state)),
  };
}

function safeVisualDecision(visual: VisualDecisionRecord, state?: MvpWorkflowState) {
  const shot = state?.shots.find((record) => record.id === visual.shotId);
  return {
    category: visual.category,
    decision: visual.decision,
    scientificConstraint: visual.scientificConstraint,
    disclosure: visual.disclosure,
    riskLevel: visual.riskLevel,
    decisionProvenance: visual.decisionProvenance,
    approvedShot: shot ? safeShot(shot, state) : null,
  };
}

function modelSafeCandidates(request: ReviewEvaluatorRequest): unknown[] {
  const state = request.workflowState;
  const suppliedSourceById = new Map((request.sources ?? []).map((source) => [source.id, source]));

  return request.candidates.map((candidate, index) => {
    const candidateNumber = index + 1;
    switch (request.targetType) {
      case 'FILM_BRIEF':
        return { candidateNumber, ...safeFilmBrief(candidate as FilmBrief) };
      case 'RESEARCH_QUESTION':
        return { candidateNumber, ...safeQuestion(candidate as ResearchQuestion) };
      case 'SOURCE': {
        const source = candidate as SourceRecord;
        return { candidateNumber, ...safeSource(source) };
      }
      case 'EVIDENCE': {
        const evidence = candidate as EvidenceRecord;
        const source = suppliedSourceById.get(evidence.sourceId) ?? state?.sources.find((item) => item.id === evidence.sourceId);
        return {
          candidateNumber,
          excerpt: evidence.excerpt,
          interpretation: evidence.interpretation,
          strength: evidence.strength,
          uncertainty: evidence.uncertainty,
          grounding: evidence.grounding,
          approvedSource: safeSource(source),
        };
      }
      case 'CLAIM':
        return { candidateNumber, ...safeClaim(candidate as ClaimRecord, state) };
      case 'SCRIPT':
        return { candidateNumber, ...safeScriptLine(candidate as ScriptLineRecord, state) };
      case 'SCENE':
        return { candidateNumber, ...safeScene(candidate as SceneRecord, state) };
      case 'SHOT':
        return { candidateNumber, ...safeShot(candidate as ShotRecord, state) };
      case 'VISUAL':
        return { candidateNumber, ...safeVisualDecision(candidate as VisualDecisionRecord, state) };
    }
  });
}

function modelSafeProjectContext(request: ReviewEvaluatorRequest) {
  const project = request.projectInput;
  const state = request.workflowState;
  return {
    filmBrief: safeFilmBrief(state?.filmBrief),
    researchQuestion: safeQuestion(request.researchQuestion),
    projectSettings: project
      ? {
          rawIdea: project.rawIdea,
          title: project.title,
          durationMinutes: project.durationMinutes,
          targetAudience: project.targetAudience,
          audienceKnowledgeLevel: project.audienceKnowledgeLevel,
          format: project.format,
          tone: project.tone,
          directorBrief: project.directorBrief,
        }
      : null,
  };
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
            text: `Provide non-authoritative human-review recommendations using ONLY this supplied context.\n\nTarget type:\n${request.targetType}\n\nProject and approved upstream context:\n${JSON.stringify(modelSafeProjectContext(request), null, 2)}\n\nNumbered candidates with relevant approved provenance:\n${JSON.stringify(modelSafeCandidates(request), null, 2)}`,
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
  candidates: ReviewCandidate[],
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
      if (!target) {
        throw new Error(`Review evaluator target for candidateNumber ${proposal.candidateNumber} was not found.`);
      }
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

export async function evaluateStageReviewRecommendations(
  request: ReviewEvaluatorRequest,
  modelCaller: ReviewEvaluatorModelCaller = callReviewEvaluatorAgent,
  options: ReviewRecommendationOptions = {}
): Promise<ReviewRecommendation[]> {
  if (request.candidates.length === 0) {
    throw new Error(`${request.targetType} review assistance requires at least one candidate.`);
  }
  for (const candidate of request.candidates) {
    if (!['DRAFT', 'DISCOVERED', 'REVIEW_REQUIRED'].includes(candidate.status)) {
      throw new Error(
        `${request.targetType} review assistance only evaluates pending candidates; "${candidate.id}" is ${candidate.status}.`
      );
    }
  }
  const proposals = await modelCaller(request);
  return assembleReviewRecommendations(request.targetType, request.candidates, proposals, options);
}
