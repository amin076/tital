import type { ClaimRecord } from '../domain/claimRecord.js';
import type { EvidenceRecord } from '../domain/evidenceRecord.js';
import type { FilmBrief } from '../domain/filmBrief.js';
import { MvpWorkflowStateSchema, type MvpWorkflowStage, type MvpWorkflowState } from '../domain/mvpWorkflow.js';
import type { ResearchQuestion } from '../domain/researchQuestion.js';
import type { SceneRecord } from '../domain/sceneRecord.js';
import type { ScriptLineRecord } from '../domain/scriptLineRecord.js';
import type { ShotRecord } from '../domain/shotRecord.js';
import type { SourceRecord } from '../domain/sourceRecord.js';
import type { VisualDecisionRecord } from '../domain/visualDecisionRecord.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import {
  approvedOnly,
  isPendingReviewRecord,
  reviewedSetReady,
} from './mvpWorkflowGuards.js';

export type MvpReviewGateRecord =
  | FilmBrief
  | ResearchQuestion
  | SourceRecord
  | EvidenceRecord
  | ClaimRecord
  | ScriptLineRecord
  | SceneRecord
  | ShotRecord
  | VisualDecisionRecord;

export type MvpReviewGateRecordType =
  | 'FilmBrief'
  | 'ResearchQuestion'
  | 'SourceRecord'
  | 'EvidenceRecord'
  | 'ClaimRecord'
  | 'ScriptLineRecord'
  | 'SceneRecord'
  | 'ShotRecord'
  | 'VisualDecisionRecord';

export interface MvpReviewGateView {
  stage: MvpWorkflowStage;
  recordType: MvpReviewGateRecordType;
  records: MvpReviewGateRecord[];
  canApprove: boolean;
  canReject: boolean;
}

function pendingOnly<T extends { status: string }>(records: readonly T[]): T[] {
  return records.filter(isPendingReviewRecord);
}

function gate(
  stage: MvpWorkflowStage,
  recordType: MvpReviewGateRecordType,
  records: MvpReviewGateRecord[],
  canReject = true
): MvpReviewGateView | null {
  if (records.length === 0) return null;
  return {
    stage,
    recordType,
    records,
    canApprove: true,
    canReject,
  };
}

/**
 * Read-only projection of the records that are legally pending at the current
 * human-review gate. This does not apply a decision; reviewMvpSession remains
 * the authoritative mutation path.
 */
export function getCurrentMvpReviewGate(
  state: MvpWorkflowState
): MvpReviewGateView | null {
  const validated = MvpWorkflowStateSchema.parse(state);
  const evaluation = evaluateMvpWorkflow(validated);

  if (evaluation.stage === 'DEFINE') {
    return isPendingReviewRecord(validated.filmBrief)
      ? gate('DEFINE', 'FilmBrief', [validated.filmBrief], false)
      : null;
  }

  if (
    evaluation.stage === 'RESEARCH' &&
    !reviewedSetReady(validated.researchQuestions)
  ) {
    return gate(
      'RESEARCH',
      'ResearchQuestion',
      pendingOnly(validated.researchQuestions)
    );
  }

  const approvedQuestionIds = new Set(
    approvedOnly(validated.researchQuestions).map((record) => record.id)
  );

  if (evaluation.stage === 'RESEARCH') {
    return gate(
      'RESEARCH',
      'SourceRecord',
      pendingOnly(
        validated.sources.filter((record) =>
          approvedQuestionIds.has(record.researchQuestionId)
        )
      )
    );
  }

  const approvedSourceIds = new Set(
    approvedOnly(validated.sources)
      .filter((record) => approvedQuestionIds.has(record.researchQuestionId))
      .map((record) => record.id)
  );

  if (evaluation.stage === 'EVIDENCE') {
    return gate(
      'EVIDENCE',
      'EvidenceRecord',
      pendingOnly(
        validated.evidence.filter((record) =>
          approvedSourceIds.has(record.sourceId)
        )
      )
    );
  }

  if (evaluation.stage === 'CLAIMS') {
    return gate(
      'CLAIMS',
      'ClaimRecord',
      pendingOnly(
        validated.claims.filter((record) =>
          approvedQuestionIds.has(record.researchQuestionId)
        )
      )
    );
  }

  if (evaluation.stage === 'SCRIPT') {
    return gate(
      'SCRIPT',
      'ScriptLineRecord',
      pendingOnly(
        validated.scriptLines.filter((record) =>
          approvedQuestionIds.has(record.researchQuestionId)
        )
      )
    );
  }

  if (evaluation.stage === 'SCENES') {
    return gate(
      'SCENES',
      'SceneRecord',
      pendingOnly(
        validated.scenes.filter((record) =>
          approvedQuestionIds.has(record.researchQuestionId)
        )
      )
    );
  }

  const approvedSceneIds = new Set(
    approvedOnly(validated.scenes)
      .filter((record) => approvedQuestionIds.has(record.researchQuestionId))
      .map((record) => record.id)
  );

  if (evaluation.stage === 'SHOTS') {
    return gate(
      'SHOTS',
      'ShotRecord',
      pendingOnly(
        validated.shots.filter((record) =>
          approvedSceneIds.has(record.sceneId)
        )
      )
    );
  }

  const approvedShotIds = new Set(
    approvedOnly(validated.shots)
      .filter((record) => approvedSceneIds.has(record.sceneId))
      .map((record) => record.id)
  );

  if (evaluation.stage === 'VISUAL_DECISIONS') {
    return gate(
      'VISUAL_DECISIONS',
      'VisualDecisionRecord',
      pendingOnly(
        validated.visualDecisions.filter((record) =>
          approvedShotIds.has(record.shotId)
        )
      )
    );
  }

  return null;
}
