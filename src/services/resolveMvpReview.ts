import { randomUUID } from 'node:crypto';
import { CoverageWaiverStageSchema, type CoverageWaiver } from '../domain/coverageWaiver.js';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import { getCurrentMvpReviewGate, type MvpReviewCoverageGroup } from './getCurrentMvpReviewGate.js';
import type { MvpRuntimeServices } from './createRealMvpStepExecutors.js';
import { reviewMvpSession } from './reviewMvpSession.js';
import { retryMvpCoverage } from './retryMvpCoverage.js';

export type MvpGapResolution = 'RETRY' | 'WAIVE';

export interface ResolveMvpReviewOptions {
  recordIds?: string[];
  gapResolution?: MvpGapResolution;
  reason?: string;
  now?: () => string;
  eventIdFactory?: () => string;
  waiverIdFactory?: () => string;
  runtimeServices?: MvpRuntimeServices;
}

export class GapResolutionRequiredError extends Error {
  constructor(readonly groups: MvpReviewCoverageGroup[]) {
    super('Rejecting the selected records would leave approved workflow coverage gaps. Choose RETRY or WAIVE explicitly.');
  }
}

function groupsTouchedBySelection(
  groups: readonly MvpReviewCoverageGroup[],
  recordIds: readonly string[]
): MvpReviewCoverageGroup[] {
  const selected = new Set(recordIds);
  return groups.filter((group) =>
    group.pendingRecordIds.some((id) => selected.has(id))
  );
}

function gapsClosedByRejection(
  groups: readonly MvpReviewCoverageGroup[],
  recordIds: readonly string[]
): MvpReviewCoverageGroup[] {
  const selected = new Set(recordIds);
  return groups.filter(
    (group) =>
      group.approvedRecordCount === 0 &&
      group.pendingRecordIds.length > 0 &&
      group.pendingRecordIds.every((id) => selected.has(id))
  );
}

function appendResolutionEvent(
  session: MvpSession,
  type: 'RETRY_REQUESTED' | 'COVERAGE_WAIVED',
  stage: MvpSession['events'][number]['stage'],
  message: string,
  now: string,
  eventId: string
): MvpSession {
  return MvpSessionSchema.parse({
    ...session,
    updatedAt: now,
    productionPackage: null,
    events: [
      ...session.events,
      { id: eventId, type, at: now, stage, message },
    ],
  });
}

export async function resolveMvpReview(
  session: MvpSession,
  decision: 'APPROVE' | 'REJECT',
  options: ResolveMvpReviewOptions = {}
): Promise<MvpSession> {
  const validated = MvpSessionSchema.parse(session);
  const gate = getCurrentMvpReviewGate(validated.state);
  if (!gate) throw new Error('No human-review gate is currently active.');

  const recordIds = options.recordIds ?? gate.records.map((record) => record.id);
  const selectedGroups = decision === 'REJECT'
    ? groupsTouchedBySelection(gate.coverageGroups, recordIds)
    : [];
  const gaps = decision === 'REJECT'
    ? gapsClosedByRejection(gate.coverageGroups, recordIds)
    : [];

  if (gaps.length > 0 && !options.gapResolution) {
    throw new GapResolutionRequiredError(gaps);
  }

  if (options.gapResolution === 'RETRY') {
    if (decision !== 'REJECT') {
      throw new Error('Replacement retry is only valid for rejected review candidates.');
    }
    if (selectedGroups.length === 0 || selectedGroups.some((group) => !group.canRetry)) {
      throw new Error('The selected review candidates do not support replacement retry.');
    }
  }

  if (options.gapResolution === 'WAIVE') {
    if (decision !== 'REJECT' || gaps.length === 0) {
      throw new Error('A coverage waiver is only valid when rejection creates a workflow coverage gap.');
    }
    if (gaps.some((group) => !group.canWaive)) {
      throw new Error('This review gate cannot be waived because the workflow requires at least one approved research question.');
    }
  }

  const nowFactory = options.now ?? (() => new Date().toISOString());
  const eventIdFactory = options.eventIdFactory ?? (() => `EVT-${randomUUID()}`);
  const waiverIdFactory = options.waiverIdFactory ?? (() => `CW-${randomUUID()}`);
  const now = nowFactory();

  let reviewed = reviewMvpSession(validated, decision, {
    recordIds,
    now: () => now,
    eventIdFactory,
  });

  if (decision !== 'REJECT') return reviewed;

  if (options.gapResolution === 'RETRY') {
    const scopedInstruction = options.reason?.trim() || undefined;
    const retryGroups = selectedGroups;
    const retriedState = await retryMvpCoverage(
      reviewed.state,
      gate.recordType,
      retryGroups,
      recordIds,
      options.runtimeServices,
      {
        directorBrief: validated.projectInput?.directorBrief,
        scopedInstruction,
      }
    );
    reviewed = MvpSessionSchema.parse({
      ...reviewed,
      updatedAt: now,
      state: retriedState,
      productionPackage: null,
    });
    return appendResolutionEvent(
      reviewed,
      'RETRY_REQUESTED',
      gate.stage,
      `Human rejected ${recordIds.length} ${gate.recordType} candidate(s) and explicitly requested replacement candidates for ${retryGroups.length} selected target(s).${gaps.length > 0 ? ` The rejection would otherwise have created ${gaps.length} coverage gap(s).` : ''}${scopedInstruction ? ' A scoped instruction was supplied for the replacement.' : ''}`,
      now,
      eventIdFactory()
    );
  }

  if (gaps.length === 0) return reviewed;

  if (options.gapResolution === 'WAIVE') {
    const stage = CoverageWaiverStageSchema.parse(gate.stage);
    const existing = reviewed.state.coverageWaivers ?? [];
    const reason = options.reason?.trim() || 'Human explicitly chose to continue without approved coverage for this branch.';
    const newWaivers: CoverageWaiver[] = gaps
      .filter(
        (group) =>
          !existing.some(
            (waiver) => waiver.stage === stage && waiver.targetId === group.targetId
          )
      )
      .map((group) => ({
        id: waiverIdFactory(),
        stage,
        targetType:
          group.targetType === 'SCENE'
            ? 'SCENE'
            : group.targetType === 'SHOT'
              ? 'SHOT'
              : 'RESEARCH_QUESTION',
        targetId: group.targetId,
        reason,
        rejectedRecordIds: group.pendingRecordIds.filter((id) => recordIds.includes(id)),
        createdAt: now,
      }));

    reviewed = MvpSessionSchema.parse({
      ...reviewed,
      updatedAt: now,
      state: {
        ...reviewed.state,
        coverageWaivers: [...existing, ...newWaivers],
        audit: null,
      },
      productionPackage: null,
    });
    return appendResolutionEvent(
      reviewed,
      'COVERAGE_WAIVED',
      gate.stage,
      `Human rejected ${recordIds.length} ${gate.recordType} candidate(s) and explicitly accepted ${newWaivers.length} intentional coverage gap(s).`,
      now,
      eventIdFactory()
    );
  }

  return reviewed;
}
