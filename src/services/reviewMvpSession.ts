import { randomUUID } from 'node:crypto';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import {
  reviewCurrentMvpGate,
  type MvpReviewDecision,
} from './reviewCurrentMvpGate.js';

export interface ReviewMvpSessionOptions {
  now?: () => string;
  eventIdFactory?: () => string;
  /** Optional record IDs for selective review at the current gate. */
  recordIds?: string[];
}

export function reviewMvpSession(
  session: MvpSession,
  decision: MvpReviewDecision,
  options: ReviewMvpSessionOptions = {}
): MvpSession {
  const validated = MvpSessionSchema.parse(session);
  const stage = evaluateMvpWorkflow(validated.state).stage;
  const reviewed = reviewCurrentMvpGate(validated.state, decision, {
    recordIds: options.recordIds,
  });
  const now = (options.now ?? (() => new Date().toISOString()))();
  const eventId = (options.eventIdFactory ?? (() => `EVT-${randomUUID()}`))();

  return MvpSessionSchema.parse({
    ...validated,
    updatedAt: now,
    state: reviewed.state,
    productionPackage: null,
    events: [
      ...validated.events,
      {
        id: eventId,
        type: 'REVIEW_DECISION',
        at: now,
        stage,
        message: `${decision} applied to ${reviewed.reviewedCount} pending ${reviewed.recordType} record(s): ${reviewed.recordIds.join(', ')}.`,
      },
    ],
  });
}
