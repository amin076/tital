import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import {
  RevisionImpactSchema,
  type RevisionImpact,
  type RevisionImpactCounts,
} from '../domain/revisionImpact.js';
import {
  RevisionRequestSchema,
  type RevisionRequest,
  type RevisionTargetType,
} from '../domain/revisionRequest.js';
import {
  invalidateMvpDependencies,
  type InvalidationRecordType,
} from './invalidateMvpDependencies.js';

const EMPTY_COUNTS: RevisionImpactCounts = {
  researchQuestions: 0,
  sources: 0,
  evidence: 0,
  claims: 0,
  scriptLines: 0,
  scenes: 0,
  shots: 0,
  visualDecisions: 0,
};

const LAYERS = [
  'researchQuestions',
  'sources',
  'evidence',
  'claims',
  'scriptLines',
  'scenes',
  'shots',
  'visualDecisions',
] as const;

type Layer = (typeof LAYERS)[number];

function layerForTarget(targetType: RevisionTargetType): Layer | null {
  switch (targetType) {
    case 'SourceRecord': return 'sources';
    case 'ClaimRecord': return 'claims';
    case 'ScriptLineRecord': return 'scriptLines';
    case 'SceneRecord': return 'scenes';
    case 'ShotRecord': return 'shots';
    case 'VisualDecisionRecord': return 'visualDecisions';
    case 'PROJECT': return null;
  }
}

function invalidationTypeForTarget(
  targetType: RevisionTargetType
): InvalidationRecordType | null {
  switch (targetType) {
    case 'SourceRecord': return 'SourceRecord';
    case 'ClaimRecord': return 'ClaimRecord';
    case 'ScriptLineRecord': return 'ScriptLineRecord';
    case 'SceneRecord': return 'SceneRecord';
    case 'ShotRecord': return 'ShotRecord';
    case 'VisualDecisionRecord': return 'VisualDecisionRecord';
    case 'PROJECT': return null;
  }
}

function ensureTrustedRevisionTarget(session: MvpSession, request: RevisionRequest): void {
  if (request.targetType === 'PROJECT') return;
  const layer = layerForTarget(request.targetType);
  if (!layer || !request.targetRecordId) return;
  const record = session.state[layer].find((candidate) => candidate.id === request.targetRecordId);
  if (!record) {
    throw new Error(`${request.targetType} was not found for revision: "${request.targetRecordId}".`);
  }
  if (record.status !== 'APPROVED') {
    throw new Error(
      `Revision targets must be APPROVED trusted records; "${request.targetRecordId}" is ${record.status}.`
    );
  }
}

function countAffected(session: MvpSession, ids: ReadonlySet<string>): RevisionImpactCounts {
  return {
    researchQuestions: session.state.researchQuestions.filter((record) => ids.has(record.id)).length,
    sources: session.state.sources.filter((record) => ids.has(record.id)).length,
    evidence: session.state.evidence.filter((record) => ids.has(record.id)).length,
    claims: session.state.claims.filter((record) => ids.has(record.id)).length,
    scriptLines: session.state.scriptLines.filter((record) => ids.has(record.id)).length,
    scenes: session.state.scenes.filter((record) => ids.has(record.id)).length,
    shots: session.state.shots.filter((record) => ids.has(record.id)).length,
    visualDecisions: session.state.visualDecisions.filter((record) => ids.has(record.id)).length,
  };
}

function activeIdsForDurationChange(session: MvpSession): string[] {
  return [
    ...session.state.scriptLines,
    ...session.state.scenes,
    ...session.state.shots,
    ...session.state.visualDecisions,
  ]
    .filter((record) => record.status !== 'REJECTED' && record.status !== 'STALE')
    .map((record) => record.id);
}

function affectedLayers(counts: RevisionImpactCounts): string[] {
  return LAYERS.filter((layer) => counts[layer] > 0);
}

function preservedLayers(counts: RevisionImpactCounts): string[] {
  return LAYERS.filter((layer) => counts[layer] === 0);
}

/**
 * Deterministically previews what would become stale before any revision is
 * applied. The input session is never mutated. This is the safety boundary used
 * by the revision UI before a director confirms a change.
 */
export function previewMvpRevisionImpact(
  session: MvpSession,
  revision: RevisionRequest
): RevisionImpact {
  const validatedSession = MvpSessionSchema.parse(session);
  const request = RevisionRequestSchema.parse(revision);
  if (request.status !== 'REQUESTED') {
    throw new Error('Only REQUESTED revisions can be previewed.');
  }
  ensureTrustedRevisionTarget(validatedSession, request);

  let affectedRecordIds: string[];
  if (request.type === 'PROJECT_DURATION_CHANGE') {
    const currentDuration =
      validatedSession.projectInput?.durationMinutes ??
      validatedSession.state.filmBrief.durationMinutes;
    if (currentDuration === request.proposedDurationMinutes) {
      throw new Error('The proposed duration is unchanged from the current project duration.');
    }
    affectedRecordIds = activeIdsForDurationChange(validatedSession);
  } else {
    const invalidationType = invalidationTypeForTarget(request.targetType);
    if (!invalidationType || !request.targetRecordId) {
      throw new Error('Record revision is missing a supported invalidation target.');
    }
    affectedRecordIds = invalidateMvpDependencies(
      validatedSession.state,
      invalidationType,
      request.targetRecordId
    ).staleRecordIds;
  }

  const affectedIds = new Set(affectedRecordIds);
  const counts = affectedRecordIds.length
    ? countAffected(validatedSession, affectedIds)
    : { ...EMPTY_COUNTS };
  const affected = affectedLayers(counts);
  const preserved = preservedLayers(counts);

  const summary = request.type === 'PROJECT_DURATION_CHANGE'
    ? `Changing duration to ${request.proposedDurationMinutes} minute(s) preserves research, sources, evidence, and claims while requiring ${affectedRecordIds.length} current script/scene/shot/visual record(s) to be reconsidered.`
    : `${request.targetType} ${request.targetRecordId} affects ${affectedRecordIds.length} trusted record(s) across ${affected.length} workflow layer(s).`;

  return RevisionImpactSchema.parse({
    revisionId: request.id,
    type: request.type,
    targetType: request.targetType,
    targetRecordId: request.targetRecordId,
    affectedRecordIds,
    counts,
    invalidatesAudit: validatedSession.state.audit !== null,
    invalidatesProductionPackage: validatedSession.productionPackage !== null,
    preservedLayers: preserved,
    affectedLayers: affected,
    summary,
  });
}
