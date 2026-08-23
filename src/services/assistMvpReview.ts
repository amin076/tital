import { randomUUID } from 'node:crypto';
import type { EvidenceRecord } from '../domain/evidenceRecord.js';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import type { ReviewRecommendation } from '../domain/reviewRecommendation.js';
import type { SourceRecord } from '../domain/sourceRecord.js';
import {
  evaluateEvidenceReviewRecommendations,
  evaluateSourceReviewRecommendations,
  type ReviewEvaluatorModelCaller,
} from './evaluateReviewRecommendations.js';
import { getCurrentMvpReviewGate } from './getCurrentMvpReviewGate.js';

export interface AssistMvpReviewOptions {
  modelCaller?: ReviewEvaluatorModelCaller;
  now?: () => string;
  eventIdFactory?: () => string;
  recommendationIdFactory?: () => string;
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
 * Runs a non-authoritative AI review over the current Source or Evidence human gate.
 * The returned recommendations are advisory only; this service never changes any
 * workflow record status and therefore cannot approve or reject trusted state.
 */
export async function assistMvpReview(
  session: MvpSession,
  options: AssistMvpReviewOptions = {}
): Promise<MvpSession> {
  const validated = MvpSessionSchema.parse(session);
  const gate = getCurrentMvpReviewGate(validated.state);

  if (!gate || !['SourceRecord', 'EvidenceRecord'].includes(gate.recordType)) {
    throw new Error(
      'AI review assistance is currently available only while SourceRecord or EvidenceRecord candidates are awaiting human review.'
    );
  }

  const questions = byId(validated.state.researchQuestions);
  const sources = byId(validated.state.sources);
  const modelCaller = options.modelCaller;
  const now = (options.now ?? (() => new Date().toISOString()))();
  const recommendationIdFactory =
    options.recommendationIdFactory ?? (() => `REV-${randomUUID()}`);
  const recommendations: ReviewRecommendation[] = [];

  if (gate.recordType === 'SourceRecord') {
    const candidates = gate.records as SourceRecord[];
    const groups = groupBy(candidates, (record) => record.researchQuestionId);

    for (const [questionId, group] of groups) {
      const question = questions.get(questionId);
      if (!question) {
        throw new Error(`ResearchQuestion "${questionId}" required for source review was not found.`);
      }
      recommendations.push(
        ...(await evaluateSourceReviewRecommendations(
          question,
          group,
          modelCaller,
          { idFactory: recommendationIdFactory, now: () => now }
        ))
      );
    }
  } else {
    const candidates = gate.records as EvidenceRecord[];
    const groups = groupBy(candidates, (record) => record.sourceId);

    for (const [sourceId, group] of groups) {
      const source = sources.get(sourceId);
      if (!source) {
        throw new Error(`SourceRecord "${sourceId}" required for evidence review was not found.`);
      }
      const question = questions.get(source.researchQuestionId);
      if (!question) {
        throw new Error(
          `ResearchQuestion "${source.researchQuestionId}" required for evidence review was not found.`
        );
      }
      recommendations.push(
        ...(await evaluateEvidenceReviewRecommendations(
          question,
          source,
          group,
          modelCaller,
          { idFactory: recommendationIdFactory, now: () => now }
        ))
      );
    }
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
