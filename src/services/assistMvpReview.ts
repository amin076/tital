import { randomUUID } from 'node:crypto';
import type { EvidenceRecord } from '../domain/evidenceRecord.js';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import type { ReviewRecommendation } from '../domain/reviewRecommendation.js';
import type { SourceRecord } from '../domain/sourceRecord.js';
import { mapWithConcurrency, resolveExternalConcurrency } from '../utils/mapWithConcurrency.js';
import {
  evaluateEvidenceReviewRecommendations,
  evaluateSourceReviewRecommendations,
  type ReviewEvaluatorModelCaller,
} from './evaluateReviewRecommendations.js';
import { getCurrentMvpReviewGate } from './getCurrentMvpReviewGate.js';
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

/**
 * Runs non-authoritative AI assistance at a high-volume Source/Evidence human gate,
 * or a whole-package semantic review after production is READY_FOR_PRODUCTION.
 * Neither mode changes trusted approval state.
 */
export async function assistMvpReview(
  session: MvpSession,
  options: AssistMvpReviewOptions = {}
): Promise<MvpSession> {
  const validated = MvpSessionSchema.parse(session);
  const gate = getCurrentMvpReviewGate(validated.state);

  if (!gate && validated.productionPackage?.status === 'READY_FOR_PRODUCTION') {
    return reviewFinalProduction(validated, {
      modelCaller: options.productionReviewModelCaller,
      now: options.now,
      eventIdFactory: options.eventIdFactory,
      reportIdFactory: options.productionReviewIdFactory,
      findingIdFactory: options.productionFindingIdFactory,
    });
  }

  if (!gate || !['SourceRecord', 'EvidenceRecord'].includes(gate.recordType)) {
    throw new Error(
      'AI review assistance is available only while SourceRecord or EvidenceRecord candidates await human review, or after a READY_FOR_PRODUCTION package exists.'
    );
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
  } else {
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
        message: `AI review assistance evaluated ${recommendations.length} pending ${gate.recordType} candidate(s): ${attentionCounts.HIGH} high, ${attentionCounts.MEDIUM} medium, ${attentionCounts.LOW} low attention. Human approval status was not changed.`,
      },
    ],
  });
}
