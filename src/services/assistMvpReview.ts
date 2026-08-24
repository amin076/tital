import { randomUUID } from 'node:crypto';
import type { EvidenceRecord } from '../domain/evidenceRecord.js';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import type { ReviewRecommendation, ReviewTargetType } from '../domain/reviewRecommendation.js';
import type { SourceRecord } from '../domain/sourceRecord.js';
import { mapWithConcurrency, resolveExternalConcurrency } from '../utils/mapWithConcurrency.js';
import {
  applyAdaptiveEvidenceBudget,
  summarizeEvidenceBudget,
} from './evidenceBudget.js';
import {
  evaluateEvidenceReviewRecommendations,
  evaluateSourceReviewRecommendations,
  evaluateStageReviewRecommendations,
  type ReviewCandidate,
  type ReviewEvaluatorModelCaller,
} from './evaluateReviewRecommendations.js';
import {
  getCurrentMvpReviewGate,
  type MvpReviewGateRecordType,
  type MvpReviewGateView,
} from './getCurrentMvpReviewGate.js';
import {
  reviewFinalProduction,
  type FinalProductionReviewModelCaller,
} from './reviewFinalProduction.js';

export interface AssistMvpReviewOptions {
  modelCaller?: ReviewEvaluatorModelCaller;
  productionReviewModelCaller?: FinalProductionReviewModelCaller;
  now?: () => string;
  eventIdFactory?: () => string;
  recommendationIdFactory?: () => string;
  productionReviewIdFactory?: () => string;
  productionFindingIdFactory?: () => string;
  concurrency?: number;
}

function byId<T extends { id: string }>(records: readonly T[]): Map<string, T> {
  return new Map(records.map((record) => [record.id, record]));
}

function groupBy<T>(records: readonly T[], keyFor: (record: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const record of records) {
    const key = keyFor(record);
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return groups;
}

function mergeRecommendations(
  existing: readonly ReviewRecommendation[],
  next: readonly ReviewRecommendation[]
): ReviewRecommendation[] {
  const replacedIds = new Set(next.map((recommendation) => recommendation.targetRecordId));
  return [
    ...existing.filter((recommendation) => !replacedIds.has(recommendation.targetRecordId)),
    ...next,
  ].slice(-500);
}

function targetTypeForRecordType(recordType: MvpReviewGateRecordType): ReviewTargetType {
  switch (recordType) {
    case 'FilmBrief': return 'FILM_BRIEF';
    case 'ResearchQuestion': return 'RESEARCH_QUESTION';
    case 'SourceRecord': return 'SOURCE';
    case 'EvidenceRecord': return 'EVIDENCE';
    case 'ClaimRecord': return 'CLAIM';
    case 'ScriptLineRecord': return 'SCRIPT';
    case 'SceneRecord': return 'SCENE';
    case 'ShotRecord': return 'SHOT';
    case 'VisualDecisionRecord': return 'VISUAL';
  }
}

function genericBatchKey(recordType: MvpReviewGateRecordType, record: ReviewCandidate): string {
  if (recordType === 'FilmBrief') return 'film-brief';
  if (recordType === 'ResearchQuestion') return 'research-questions';
  if (recordType === 'ShotRecord' && 'sceneId' in record) return record.sceneId;
  if (recordType === 'VisualDecisionRecord' && 'shotId' in record) return record.shotId;
  if ('researchQuestionId' in record) return record.researchQuestionId;
  return 'workflow';
}

async function evaluateGenericGate(
  session: MvpSession,
  gate: MvpReviewGateView,
  modelCaller: ReviewEvaluatorModelCaller | undefined,
  concurrency: number,
  recommendationIdFactory: () => string,
  now: string
): Promise<ReviewRecommendation[]> {
  const targetType = targetTypeForRecordType(gate.recordType);
  const questions = byId(session.state.researchQuestions);
  const candidates = gate.records as ReviewCandidate[];
  const groups = [...groupBy(candidates, (record) => genericBatchKey(gate.recordType, record)).values()];

  const batches = await mapWithConcurrency(groups, concurrency, async (group) => {
    const first = group[0];
    const question = first && 'researchQuestionId' in first
      ? questions.get(first.researchQuestionId)
      : undefined;

    return evaluateStageReviewRecommendations(
      {
        targetType,
        researchQuestion: question,
        projectInput: session.projectInput,
        workflowState: session.state,
        candidates: group,
      },
      modelCaller,
      { idFactory: recommendationIdFactory, now: () => now }
    );
  });

  return batches.flat();
}

/**
 * Runs non-authoritative AI assistance at any active human-review gate,
 * or a whole-package semantic review after production is READY_FOR_PRODUCTION.
 * Neither mode changes trusted approval state.
 *
 * Evidence is compacted deterministically before Gemini review. The broad
 * candidate pool remains persisted as ARCHIVED_CANDIDATE records; only the
 * duration/priority-aware subset enters the human gate and downstream chain.
 */
export async function assistMvpReview(
  session: MvpSession,
  options: AssistMvpReviewOptions = {}
): Promise<MvpSession> {
  let validated = MvpSessionSchema.parse(session);
  let gate = getCurrentMvpReviewGate(validated.state);

  if (!gate && validated.productionPackage?.status === 'READY_FOR_PRODUCTION') {
    return reviewFinalProduction(validated, {
      modelCaller: options.productionReviewModelCaller,
      now: options.now,
      eventIdFactory: options.eventIdFactory,
      reportIdFactory: options.productionReviewIdFactory,
      findingIdFactory: options.productionFindingIdFactory,
    });
  }

  if (!gate) {
    throw new Error(
      'AI review assistance requires an active human-review gate or a READY_FOR_PRODUCTION package.'
    );
  }

  let compactionMessage = '';
  if (gate.recordType === 'EvidenceRecord') {
    const beforePending = gate.records.length;
    const compactedState = applyAdaptiveEvidenceBudget(validated.state);
    validated = MvpSessionSchema.parse({ ...validated, state: compactedState });
    gate = getCurrentMvpReviewGate(validated.state);
    if (!gate || gate.recordType !== 'EvidenceRecord') {
      throw new Error('Adaptive evidence compaction left no evidence review gate.');
    }
    const budget = summarizeEvidenceBudget(validated.state);
    if (gate.records.length < beforePending || budget.archivedCount > 0) {
      compactionMessage = ` Adaptive evidence budgeting retained ${budget.candidateCount} research candidate(s), promoted ${gate.records.length} for human review, and archived ${budget.archivedCount} non-promoted candidate(s) without deleting them.`;
    }
  }

  const questions = byId(validated.state.researchQuestions);
  const sources = byId(validated.state.sources);
  const modelCaller = options.modelCaller;
  const now = (options.now ?? (() => new Date().toISOString()))();
  const recommendationIdFactory =
    options.recommendationIdFactory ?? (() => `REV-${randomUUID()}`);
  const concurrency = options.concurrency ?? resolveExternalConcurrency(
    process.env.TITAL_EXTERNAL_CONCURRENCY
  );
  let recommendations: ReviewRecommendation[] = [];

  if (gate.recordType === 'SourceRecord') {
    const candidates = gate.records as SourceRecord[];
    const groups = [...groupBy(candidates, (record) => record.researchQuestionId).entries()];
    const batches = await mapWithConcurrency(groups, concurrency, async ([questionId, group]) => {
      const question = questions.get(questionId);
      if (!question) {
        throw new Error(`ResearchQuestion "${questionId}" required for source review was not found.`);
      }
      return evaluateSourceReviewRecommendations(
        question,
        group,
        modelCaller,
        { idFactory: recommendationIdFactory, now: () => now }
      );
    });
    recommendations = batches.flat();
  } else if (gate.recordType === 'EvidenceRecord') {
    const candidates = gate.records as EvidenceRecord[];
    const groups = [...groupBy(candidates, (record) => record.researchQuestionId).entries()];
    const batches = await mapWithConcurrency(groups, concurrency, async ([questionId, group]) => {
      const question = questions.get(questionId);
      if (!question) {
        throw new Error(`ResearchQuestion "${questionId}" required for evidence review was not found.`);
      }
      const sourceIds = [...new Set(group.map((record) => record.sourceId))];
      const approvedSources = sourceIds.map((sourceId) => {
        const source = sources.get(sourceId);
        if (!source) {
          throw new Error(`SourceRecord "${sourceId}" required for evidence review was not found.`);
        }
        return source;
      });
      return evaluateEvidenceReviewRecommendations(
        question,
        approvedSources,
        group,
        modelCaller,
        { idFactory: recommendationIdFactory, now: () => now }
      );
    });
    recommendations = batches.flat();
  } else {
    recommendations = await evaluateGenericGate(
      validated,
      gate,
      modelCaller,
      concurrency,
      recommendationIdFactory,
      now
    );
  }

  const attentionCounts = recommendations.reduce(
    (counts, recommendation) => {
      counts[recommendation.attention] += 1;
      return counts;
    },
    { LOW: 0, MEDIUM: 0, HIGH: 0 }
  );
  const eventId = (options.eventIdFactory ?? (() => `EVT-${randomUUID()}`))();

  return MvpSessionSchema.parse({
    ...validated,
    updatedAt: now,
    reviewRecommendations: mergeRecommendations(
      validated.reviewRecommendations ?? [],
      recommendations
    ),
    events: [
      ...validated.events,
      {
        id: eventId,
        type: 'REVIEW_ASSISTED',
        at: now,
        stage: gate.stage,
        message: `AI review assistance evaluated ${recommendations.length} pending ${gate.recordType} candidate(s): ${attentionCounts.HIGH} high, ${attentionCounts.MEDIUM} medium, ${attentionCounts.LOW} low attention. Human approval status was not changed.${compactionMessage}`,
      },
    ],
  });
}
