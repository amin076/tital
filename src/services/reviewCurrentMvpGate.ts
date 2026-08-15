import { MvpWorkflowStateSchema, type MvpWorkflowState } from '../domain/mvpWorkflow.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import {
  approvedOnly,
  isPendingReviewRecord,
  reviewedSetReady,
} from './mvpWorkflowGuards.js';

export type MvpReviewDecision = 'APPROVE' | 'REJECT';

export interface MvpReviewResult {
  state: MvpWorkflowState;
  recordType: string;
  reviewedCount: number;
}

function reviewedStatus(decision: MvpReviewDecision): 'APPROVED' | 'REJECTED' {
  return decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
}

function decidePending<T extends { status: string }>(
  records: T[],
  decision: MvpReviewDecision,
  predicate: (record: T) => boolean = () => true
): { records: T[]; count: number } {
  let count = 0;
  const status = reviewedStatus(decision);
  const updated = records.map((record) => {
    if (predicate(record) && isPendingReviewRecord(record)) {
      count += 1;
      return { ...record, status } as T;
    }
    return record;
  });
  return { records: updated, count };
}

function finish(
  state: MvpWorkflowState,
  recordType: string,
  reviewedCount: number
): MvpReviewResult {
  if (reviewedCount === 0) {
    throw new Error(`No pending ${recordType} records exist at the current human-review gate.`);
  }
  return {
    state: MvpWorkflowStateSchema.parse({ ...state, audit: null }),
    recordType,
    reviewedCount,
  };
}

export function reviewCurrentMvpGate(
  state: MvpWorkflowState,
  decision: MvpReviewDecision
): MvpReviewResult {
  const validated = MvpWorkflowStateSchema.parse(state);
  const evaluation = evaluateMvpWorkflow(validated);

  if (evaluation.stage === 'DEFINE') {
    if (decision === 'REJECT') {
      throw new Error('FilmBrief does not support REJECTED status. Revise/restart the brief instead of inventing an unsupported state.');
    }
    if (!isPendingReviewRecord(validated.filmBrief)) {
      throw new Error('FilmBrief is not pending human review.');
    }
    return finish(
      { ...validated, filmBrief: { ...validated.filmBrief, status: 'APPROVED' } },
      'FilmBrief',
      1
    );
  }

  if (evaluation.stage === 'RESEARCH' && !reviewedSetReady(validated.researchQuestions)) {
    const reviewed = decidePending(validated.researchQuestions, decision);
    return finish({ ...validated, researchQuestions: reviewed.records }, 'ResearchQuestion', reviewed.count);
  }

  const approvedQuestionIds = new Set(approvedOnly(validated.researchQuestions).map((record) => record.id));

  if (evaluation.stage === 'RESEARCH') {
    const reviewed = decidePending(
      validated.sources,
      decision,
      (record) => approvedQuestionIds.has(record.researchQuestionId)
    );
    return finish({ ...validated, sources: reviewed.records }, 'SourceRecord', reviewed.count);
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
      (record) => approvedSourceIds.has(record.sourceId)
    );
    return finish({ ...validated, evidence: reviewed.records }, 'EvidenceRecord', reviewed.count);
  }

  if (evaluation.stage === 'CLAIMS') {
    const reviewed = decidePending(
      validated.claims,
      decision,
      (record) => approvedQuestionIds.has(record.researchQuestionId)
    );
    return finish({ ...validated, claims: reviewed.records }, 'ClaimRecord', reviewed.count);
  }

  if (evaluation.stage === 'SCRIPT') {
    const reviewed = decidePending(
      validated.scriptLines,
      decision,
      (record) => approvedQuestionIds.has(record.researchQuestionId)
    );
    return finish({ ...validated, scriptLines: reviewed.records }, 'ScriptLineRecord', reviewed.count);
  }

  if (evaluation.stage === 'SCENES') {
    const reviewed = decidePending(
      validated.scenes,
      decision,
      (record) => approvedQuestionIds.has(record.researchQuestionId)
    );
    return finish({ ...validated, scenes: reviewed.records }, 'SceneRecord', reviewed.count);
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
      (record) => approvedSceneIds.has(record.sceneId)
    );
    return finish({ ...validated, shots: reviewed.records }, 'ShotRecord', reviewed.count);
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
      (record) => approvedShotIds.has(record.shotId)
    );
    return finish({ ...validated, visualDecisions: reviewed.records }, 'VisualDecisionRecord', reviewed.count);
  }

  throw new Error(`Stage ${evaluation.stage} is not a human-review gate.`);
}
