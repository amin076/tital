import { MvpWorkflowStateSchema, type MvpWorkflowState } from '../domain/mvpWorkflow.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import {
  approvedOnly,
  isPendingReviewRecord,
  reviewedSetReady,
} from './mvpWorkflowGuards.js';

export type MvpReviewDecision = 'APPROVE' | 'REJECT';

export interface MvpReviewSelection {
  /**
   * Optional explicit record IDs to review at the current gate. When omitted,
   * every pending record at the current active gate is reviewed.
   */
  recordIds?: string[];
}

export interface MvpReviewResult {
  state: MvpWorkflowState;
  recordType: string;
  reviewedCount: number;
  recordIds: string[];
}

function reviewedStatus(decision: MvpReviewDecision): 'APPROVED' | 'REJECTED' {
  return decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
}

function normalizeRequestedIds(recordIds?: string[]): string[] | undefined {
  if (!recordIds || recordIds.length === 0) return undefined;
  const normalized = recordIds.map((id) => id.trim());
  if (normalized.some((id) => id.length === 0)) {
    throw new Error('Review record IDs must be non-empty strings.');
  }
  if (new Set(normalized).size !== normalized.length) {
    throw new Error('Review record IDs must not contain duplicates.');
  }
  return normalized;
}

function decidePending<T extends { id: string; status: string }>(
  records: T[],
  decision: MvpReviewDecision,
  predicate: (record: T) => boolean,
  requestedIds?: string[]
): { records: T[]; recordIds: string[] } {
  const requested = requestedIds ? new Set(requestedIds) : null;
  const recordIds: string[] = [];
  const status = reviewedStatus(decision);

  const updated = records.map((record) => {
    if (
      predicate(record) &&
      isPendingReviewRecord(record) &&
      (!requested || requested.has(record.id))
    ) {
      recordIds.push(record.id);
      return { ...record, status } as T;
    }
    return record;
  });

  if (requested) {
    const reviewed = new Set(recordIds);
    const invalid = requestedIds!.filter((id) => !reviewed.has(id));
    if (invalid.length > 0) {
      throw new Error(
        `Requested review record(s) are not pending at the current gate: ${invalid.join(', ')}.`
      );
    }
  }

  return { records: updated, recordIds };
}

function finish(
  state: MvpWorkflowState,
  recordType: string,
  recordIds: string[]
): MvpReviewResult {
  if (recordIds.length === 0) {
    throw new Error(`No pending ${recordType} records exist at the current human-review gate.`);
  }
  return {
    state: MvpWorkflowStateSchema.parse({ ...state, audit: null }),
    recordType,
    reviewedCount: recordIds.length,
    recordIds,
  };
}

export function reviewCurrentMvpGate(
  state: MvpWorkflowState,
  decision: MvpReviewDecision,
  selection: MvpReviewSelection = {}
): MvpReviewResult {
  const validated = MvpWorkflowStateSchema.parse(state);
  const evaluation = evaluateMvpWorkflow(validated);
  const requestedIds = normalizeRequestedIds(selection.recordIds);

  if (evaluation.stage === 'DEFINE') {
    if (decision === 'REJECT') {
      throw new Error('FilmBrief does not support REJECTED status. Revise/restart the brief instead of inventing an unsupported state.');
    }
    if (!isPendingReviewRecord(validated.filmBrief)) {
      throw new Error('FilmBrief is not pending human review.');
    }
    if (requestedIds && (requestedIds.length !== 1 || requestedIds[0] !== validated.filmBrief.id)) {
      throw new Error(`The current FilmBrief review gate only accepts record ID "${validated.filmBrief.id}".`);
    }
    return finish(
      { ...validated, filmBrief: { ...validated.filmBrief, status: 'APPROVED' } },
      'FilmBrief',
      [validated.filmBrief.id]
    );
  }

  if (evaluation.stage === 'RESEARCH' && !reviewedSetReady(validated.researchQuestions)) {
    const reviewed = decidePending(
      validated.researchQuestions,
      decision,
      () => true,
      requestedIds
    );
    return finish({ ...validated, researchQuestions: reviewed.records }, 'ResearchQuestion', reviewed.recordIds);
  }

  const approvedQuestionIds = new Set(approvedOnly(validated.researchQuestions).map((record) => record.id));

  if (evaluation.stage === 'RESEARCH') {
    const reviewed = decidePending(
      validated.sources,
      decision,
      (record) => approvedQuestionIds.has(record.researchQuestionId),
      requestedIds
    );
    return finish({ ...validated, sources: reviewed.records }, 'SourceRecord', reviewed.recordIds);
  }

  const approvedSourceIds = new Set(
    approvedOnly(validated.sources)
      .filter((record) => approvedQuestionIds.has(record.researchQuestionId))
      .map((record) => record.id)
  );

  if (evaluation.stage === 'EVIDENCE') {
    const reviewed = decidePending(
      validated.evidence,
      decision,
      (record) => approvedSourceIds.has(record.sourceId),
      requestedIds
    );
    return finish({ ...validated, evidence: reviewed.records }, 'EvidenceRecord', reviewed.recordIds);
  }

  if (evaluation.stage === 'CLAIMS') {
    const reviewed = decidePending(
      validated.claims,
      decision,
      (record) => approvedQuestionIds.has(record.researchQuestionId),
      requestedIds
    );
    return finish({ ...validated, claims: reviewed.records }, 'ClaimRecord', reviewed.recordIds);
  }

  if (evaluation.stage === 'SCRIPT') {
    const reviewed = decidePending(
      validated.scriptLines,
      decision,
      (record) => approvedQuestionIds.has(record.researchQuestionId),
      requestedIds
    );
    return finish({ ...validated, scriptLines: reviewed.records }, 'ScriptLineRecord', reviewed.recordIds);
  }

  if (evaluation.stage === 'SCENES') {
    const reviewed = decidePending(
      validated.scenes,
      decision,
      (record) => approvedQuestionIds.has(record.researchQuestionId),
      requestedIds
    );
    return finish({ ...validated, scenes: reviewed.records }, 'SceneRecord', reviewed.recordIds);
  }

  const approvedSceneIds = new Set(
    approvedOnly(validated.scenes)
      .filter((record) => approvedQuestionIds.has(record.researchQuestionId))
      .map((record) => record.id)
  );

  if (evaluation.stage === 'SHOTS') {
    const reviewed = decidePending(
      validated.shots,
      decision,
      (record) => approvedSceneIds.has(record.sceneId),
      requestedIds
    );
    return finish({ ...validated, shots: reviewed.records }, 'ShotRecord', reviewed.recordIds);
  }

  const approvedShotIds = new Set(
    approvedOnly(validated.shots)
      .filter((record) => approvedSceneIds.has(record.sceneId))
      .map((record) => record.id)
  );

  if (evaluation.stage === 'VISUAL_DECISIONS') {
    const reviewed = decidePending(
      validated.visualDecisions,
      decision,
      (record) => approvedShotIds.has(record.shotId),
      requestedIds
    );
    return finish({ ...validated, visualDecisions: reviewed.records }, 'VisualDecisionRecord', reviewed.recordIds);
  }

  throw new Error(`Stage ${evaluation.stage} is not a human-review gate.`);
}
