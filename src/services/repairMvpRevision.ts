import { randomUUID } from 'node:crypto';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import type { RevisionRequest } from '../domain/revisionRequest.js';
import type { MvpReviewCoverageGroup, MvpReviewGateRecordType } from './getCurrentMvpReviewGate.js';
import { getCurrentMvpReviewGate } from './getCurrentMvpReviewGate.js';
import {
  realMvpRuntimeServices,
  type MvpRuntimeServices,
} from './createRealMvpStepExecutors.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import { retryMvpCoverage } from './retryMvpCoverage.js';

export interface RepairMvpRevisionOptions {
  services?: MvpRuntimeServices;
  now?: () => string;
  eventIdFactory?: () => string;
  externalConcurrency?: number;
}

function appliedRevisionFor(session: MvpSession, revisionId: string): RevisionRequest {
  const revision = (session.revisionRequests ?? []).find((candidate) => candidate.id === revisionId);
  if (!revision) throw new Error(`RevisionRequest was not found: "${revisionId}".`);
  if (revision.status !== 'APPLIED') {
    throw new Error(`RevisionRequest "${revisionId}" is not applied.`);
  }
  return revision;
}

function group(
  targetType: MvpReviewCoverageGroup['targetType'],
  targetId: string,
  targetLabel: string
): MvpReviewCoverageGroup {
  return {
    targetType,
    targetId,
    targetLabel,
    pendingRecordIds: [],
    approvedRecordCount: 0,
    canRetry: true,
    canWaive: true,
  };
}

function repairPlan(
  session: MvpSession,
  revision: RevisionRequest
): { recordType: MvpReviewGateRecordType; groups: MvpReviewCoverageGroup[]; staleIds: string[] } {
  const state = session.state;

  if (revision.type === 'PROJECT_DURATION_CHANGE') {
    const questionIds = state.researchQuestions
      .filter((record) => record.status === 'APPROVED')
      .map((record) => record.id);
    return {
      recordType: 'ScriptLineRecord',
      groups: questionIds.map((id) => group('RESEARCH_QUESTION', id, `Research question ${id}`)),
      staleIds: state.scriptLines.filter((record) => record.status === 'STALE').map((record) => record.id),
    };
  }

  if (!revision.targetRecordId) {
    throw new Error(`RevisionRequest "${revision.id}" is missing its target record.`);
  }

  if (revision.type === 'SOURCE_APPROVAL_REVOKE') {
    const source = state.sources.find((record) => record.id === revision.targetRecordId);
    if (!source) throw new Error(`Revision source was not found: "${revision.targetRecordId}".`);
    return {
      recordType: 'SourceRecord',
      groups: [group('RESEARCH_QUESTION', source.researchQuestionId, `Research question ${source.researchQuestionId}`)],
      staleIds: [source.id],
    };
  }

  if (revision.type === 'CLAIM_REVISION') {
    const claim = state.claims.find((record) => record.id === revision.targetRecordId);
    if (!claim) throw new Error(`Revision claim was not found: "${revision.targetRecordId}".`);
    return {
      recordType: 'ClaimRecord',
      groups: [group('RESEARCH_QUESTION', claim.researchQuestionId, `Research question ${claim.researchQuestionId}`)],
      staleIds: [claim.id],
    };
  }

  if (revision.type === 'SHOT_REVISION') {
    const shot = state.shots.find((record) => record.id === revision.targetRecordId);
    if (!shot) throw new Error(`Revision shot was not found: "${revision.targetRecordId}".`);
    return {
      recordType: 'ShotRecord',
      groups: [group('SCENE', shot.sceneId, `Scene ${shot.sceneId}`)],
      staleIds: [shot.id],
    };
  }

  const visual = state.visualDecisions.find((record) => record.id === revision.targetRecordId);
  if (!visual) throw new Error(`Revision visual decision was not found: "${revision.targetRecordId}".`);
  return {
    recordType: 'VisualDecisionRecord',
    groups: [group('SHOT', visual.shotId, `Shot ${visual.shotId}`)],
    staleIds: [visual.id],
  };
}

/**
 * Generates replacement candidates only for the root affected by an applied
 * revision. Downstream stages remain stale until the replacement is explicitly
 * human-approved; normal governed progression then repairs subsequent layers.
 */
export async function repairMvpRevision(
  session: MvpSession,
  revisionId: string,
  options: RepairMvpRevisionOptions = {}
): Promise<MvpSession> {
  const validated = MvpSessionSchema.parse(session);
  if (getCurrentMvpReviewGate(validated.state)) {
    throw new Error('Complete the current human-review gate before requesting revision repair.');
  }

  const revision = appliedRevisionFor(validated, revisionId);
  const plan = repairPlan(validated, revision);
  const nextState = await retryMvpCoverage(
    validated.state,
    plan.recordType,
    plan.groups,
    plan.staleIds,
    options.services ?? realMvpRuntimeServices,
    {
      directorBrief: validated.projectInput?.directorBrief,
      scopedInstruction: revision.instruction ?? revision.reason,
      externalConcurrency: options.externalConcurrency,
    }
  );
  const now = (options.now ?? (() => new Date().toISOString()))();
  const eventId = (options.eventIdFactory ?? (() => `EVT-${randomUUID()}`))();
  const evaluation = evaluateMvpWorkflow(nextState);

  return MvpSessionSchema.parse({
    ...validated,
    updatedAt: now,
    state: nextState,
    productionPackage: null,
    events: [
      ...validated.events,
      {
        id: eventId,
        type: 'REVISION_REPAIR_REQUESTED',
        at: now,
        stage: evaluation.stage,
        message: `Selective repair for revision ${revision.id} generated new ${plan.recordType} candidate(s). Human review is required before downstream repair can continue.`,
      },
    ],
  });
}
