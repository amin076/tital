import { randomUUID } from 'node:crypto';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import { MvpWorkflowStateSchema, type MvpWorkflowState } from '../domain/mvpWorkflow.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';

export type InvalidationRecordType =
  | 'ResearchQuestion'
  | 'SourceRecord'
  | 'EvidenceRecord'
  | 'ClaimRecord'
  | 'ScriptLineRecord'
  | 'SceneRecord'
  | 'ShotRecord'
  | 'VisualDecisionRecord';

export interface InvalidationResult {
  state: MvpWorkflowState;
  staleRecordIds: string[];
}

interface InvalidateMvpSessionOptions {
  now?: () => string;
  eventIdFactory?: () => string;
}

function exists(state: MvpWorkflowState, recordType: InvalidationRecordType, recordId: string): boolean {
  switch (recordType) {
    case 'ResearchQuestion': return state.researchQuestions.some((record) => record.id === recordId);
    case 'SourceRecord': return state.sources.some((record) => record.id === recordId);
    case 'EvidenceRecord': return state.evidence.some((record) => record.id === recordId);
    case 'ClaimRecord': return state.claims.some((record) => record.id === recordId);
    case 'ScriptLineRecord': return state.scriptLines.some((record) => record.id === recordId);
    case 'SceneRecord': return state.scenes.some((record) => record.id === recordId);
    case 'ShotRecord': return state.shots.some((record) => record.id === recordId);
    case 'VisualDecisionRecord': return state.visualDecisions.some((record) => record.id === recordId);
  }
}

function staleCandidate<T extends { id: string; status: string }>(
  record: T,
  staleIds: ReadonlySet<string>,
  changed: Set<string>
): T {
  if (!staleIds.has(record.id) || record.status === 'REJECTED' || record.status === 'STALE') {
    return record;
  }
  changed.add(record.id);
  return { ...record, status: 'STALE' } as T;
}

/**
 * Invalidates one record and every generated descendant whose provenance depends
 * on it. Records are retained as STALE history rather than deleted or silently
 * rewritten. Unrelated branches remain untouched.
 */
export function invalidateMvpDependencies(
  state: MvpWorkflowState,
  recordType: InvalidationRecordType,
  recordId: string
): InvalidationResult {
  const validated = MvpWorkflowStateSchema.parse(state);
  if (!exists(validated, recordType, recordId)) {
    throw new Error(`${recordType} was not found for invalidation: "${recordId}".`);
  }

  const questionIds = new Set<string>();
  const sourceIds = new Set<string>();
  const evidenceIds = new Set<string>();
  const claimIds = new Set<string>();
  const scriptLineIds = new Set<string>();
  const sceneIds = new Set<string>();
  const shotIds = new Set<string>();
  const visualDecisionIds = new Set<string>();

  if (recordType === 'ResearchQuestion') questionIds.add(recordId);
  if (recordType === 'SourceRecord') sourceIds.add(recordId);
  if (recordType === 'EvidenceRecord') evidenceIds.add(recordId);
  if (recordType === 'ClaimRecord') claimIds.add(recordId);
  if (recordType === 'ScriptLineRecord') scriptLineIds.add(recordId);
  if (recordType === 'SceneRecord') sceneIds.add(recordId);
  if (recordType === 'ShotRecord') shotIds.add(recordId);
  if (recordType === 'VisualDecisionRecord') visualDecisionIds.add(recordId);

  for (const source of validated.sources) {
    if (questionIds.has(source.researchQuestionId)) sourceIds.add(source.id);
  }
  for (const evidence of validated.evidence) {
    if (questionIds.has(evidence.researchQuestionId) || sourceIds.has(evidence.sourceId)) {
      evidenceIds.add(evidence.id);
    }
  }
  for (const claim of validated.claims) {
    if (
      questionIds.has(claim.researchQuestionId) ||
      claim.evidenceIds.some((id) => evidenceIds.has(id))
    ) {
      claimIds.add(claim.id);
    }
  }
  for (const line of validated.scriptLines) {
    if (
      questionIds.has(line.researchQuestionId) ||
      line.claimIds.some((id) => claimIds.has(id))
    ) {
      scriptLineIds.add(line.id);
    }
  }
  for (const scene of validated.scenes) {
    if (
      questionIds.has(scene.researchQuestionId) ||
      scene.scriptLineIds.some((id) => scriptLineIds.has(id))
    ) {
      sceneIds.add(scene.id);
    }
  }
  for (const shot of validated.shots) {
    if (
      questionIds.has(shot.researchQuestionId) ||
      sceneIds.has(shot.sceneId) ||
      shot.scriptLineIds.some((id) => scriptLineIds.has(id))
    ) {
      shotIds.add(shot.id);
    }
  }
  for (const visual of validated.visualDecisions) {
    if (questionIds.has(visual.researchQuestionId) || shotIds.has(visual.shotId)) {
      visualDecisionIds.add(visual.id);
    }
  }

  const changed = new Set<string>();
  const next = MvpWorkflowStateSchema.parse({
    ...validated,
    researchQuestions: validated.researchQuestions.map((record) =>
      staleCandidate(record, questionIds, changed)
    ),
    sources: validated.sources.map((record) => staleCandidate(record, sourceIds, changed)),
    evidence: validated.evidence.map((record) => staleCandidate(record, evidenceIds, changed)),
    claims: validated.claims.map((record) => staleCandidate(record, claimIds, changed)),
    scriptLines: validated.scriptLines.map((record) =>
      staleCandidate(record, scriptLineIds, changed)
    ),
    scenes: validated.scenes.map((record) => staleCandidate(record, sceneIds, changed)),
    shots: validated.shots.map((record) => staleCandidate(record, shotIds, changed)),
    visualDecisions: validated.visualDecisions.map((record) =>
      staleCandidate(record, visualDecisionIds, changed)
    ),
    audit: null,
  });

  return { state: next, staleRecordIds: [...changed] };
}

/**
 * Session-level wrapper for future revision/edit flows. It also invalidates any
 * previously built production package and records a governance event.
 */
export function invalidateMvpSessionDependencies(
  session: MvpSession,
  recordType: InvalidationRecordType,
  recordId: string,
  options: InvalidateMvpSessionOptions = {}
): MvpSession {
  const validated = MvpSessionSchema.parse(session);
  const stage = evaluateMvpWorkflow(validated.state).stage;
  const invalidated = invalidateMvpDependencies(validated.state, recordType, recordId);
  const now = (options.now ?? (() => new Date().toISOString()))();
  const eventId = (options.eventIdFactory ?? (() => `EVT-${randomUUID()}`))();

  return MvpSessionSchema.parse({
    ...validated,
    updatedAt: now,
    state: invalidated.state,
    productionPackage: null,
    events: [
      ...validated.events,
      {
        id: eventId,
        type: 'DOWNSTREAM_INVALIDATED',
        at: now,
        stage,
        message: `${recordType} ${recordId} was invalidated; ${invalidated.staleRecordIds.length} affected record(s) are now STALE and excluded from the trusted production chain.`,
      },
    ],
  });
}
