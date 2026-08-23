import { randomUUID } from 'node:crypto';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import {
  RevisionRequestSchema,
  type RevisionRequest,
} from '../domain/revisionRequest.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import { invalidateMvpDependencies } from './invalidateMvpDependencies.js';
import { previewMvpRevisionImpact } from './previewMvpRevisionImpact.js';

export interface ApplyMvpRevisionOptions {
  now?: () => string;
  eventIdFactory?: () => string;
}

function markIdsStale<T extends { id: string; status: string }>(
  records: readonly T[],
  affectedIds: ReadonlySet<string>
): T[] {
  return records.map((record) =>
    affectedIds.has(record.id) && record.status !== 'REJECTED' && record.status !== 'STALE'
      ? ({ ...record, status: 'STALE' } as T)
      : record
  );
}

function appliedRevision(revision: RevisionRequest): RevisionRequest {
  return RevisionRequestSchema.parse({ ...revision, status: 'APPLIED' });
}

/**
 * Applies a previously previewable revision to trusted session state.
 * Historical records are never deleted: invalidated work becomes STALE, the audit
 * and package are cleared, and the revision itself is persisted as governance history.
 */
export function applyMvpRevision(
  session: MvpSession,
  revision: RevisionRequest,
  options: ApplyMvpRevisionOptions = {}
): MvpSession {
  const validated = MvpSessionSchema.parse(session);
  const request = RevisionRequestSchema.parse(revision);
  const impact = previewMvpRevisionImpact(validated, request);
  const now = (options.now ?? (() => new Date().toISOString()))();
  const eventId = (options.eventIdFactory ?? (() => `EVT-${randomUUID()}`))();

  let state = validated.state;
  let projectInput = validated.projectInput;

  if (request.type === 'PROJECT_DURATION_CHANGE') {
    const affectedIds = new Set(impact.affectedRecordIds);
    const nextDuration = request.proposedDurationMinutes!;
    state = {
      ...state,
      filmBrief: { ...state.filmBrief, durationMinutes: nextDuration },
      scriptLines: markIdsStale(state.scriptLines, affectedIds),
      scenes: markIdsStale(state.scenes, affectedIds),
      shots: markIdsStale(state.shots, affectedIds),
      visualDecisions: markIdsStale(state.visualDecisions, affectedIds),
      audit: null,
    };
    projectInput = {
      ...(projectInput ?? { rawIdea: validated.rawIdea }),
      durationMinutes: nextDuration,
    };
  } else {
    const targetType = request.targetType;
    const targetRecordId = request.targetRecordId!;
    if (targetType === 'PROJECT') {
      throw new Error('Record revision unexpectedly targeted PROJECT.');
    }
    const invalidated = invalidateMvpDependencies(
      state,
      targetType,
      targetRecordId
    );
    state = invalidated.state;
  }

  const applied = appliedRevision(request);
  const affectedIds = new Set(impact.affectedRecordIds);
  const evaluation = evaluateMvpWorkflow(state);

  return MvpSessionSchema.parse({
    ...validated,
    projectInput,
    updatedAt: now,
    state,
    productionPackage: null,
    reviewRecommendations: (validated.reviewRecommendations ?? []).filter(
      (recommendation) => !affectedIds.has(recommendation.targetRecordId)
    ),
    revisionRequests: [
      ...(validated.revisionRequests ?? []).filter((item) => item.id !== applied.id),
      applied,
    ].slice(-100),
    events: [
      ...validated.events,
      {
        id: eventId,
        type: 'REVISION_APPLIED',
        at: now,
        stage: evaluation.stage,
        message: `${applied.type} applied. ${impact.affectedRecordIds.length} trusted record(s) were marked stale for reconsideration; history was preserved and the audit/package boundary was invalidated.`,
      },
    ],
  });
}
