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
  requiredResearchQuestionsForStage,
  requiredScenesForShots,
  requiredShotsForVisualDecisions,
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

export type MvpReviewCoverageTargetType =
  | 'WORKFLOW'
  | 'RESEARCH_QUESTION'
  | 'SCENE'
  | 'SHOT';

export interface MvpReviewCoverageGroup {
  targetType: MvpReviewCoverageTargetType;
  targetId: string;
  targetLabel: string;
  pendingRecordIds: string[];
  approvedRecordCount: number;
  canRetry: boolean;
  canWaive: boolean;
}

export interface MvpReviewGateView {
  stage: MvpWorkflowStage;
  recordType: MvpReviewGateRecordType;
  records: MvpReviewGateRecord[];
  canApprove: boolean;
  canReject: boolean;
  coverageGroups: MvpReviewCoverageGroup[];
}

function pendingOnly<T extends { status: string }>(records: readonly T[]): T[] {
  return records.filter(isPendingReviewRecord);
}

function groupByTarget<T extends { id: string; status: string }>(
  pending: readonly T[],
  allRecords: readonly T[],
  targetIdFor: (record: T) => string,
  targetLabelFor: (targetId: string) => string,
  targetType: Exclude<MvpReviewCoverageTargetType, 'WORKFLOW'>
): MvpReviewCoverageGroup[] {
  const targetIds = [...new Set(pending.map(targetIdFor))];
  return targetIds.map((targetId) => ({
    targetType,
    targetId,
    targetLabel: targetLabelFor(targetId),
    pendingRecordIds: pending.filter((record) => targetIdFor(record) === targetId).map((record) => record.id),
    approvedRecordCount: approvedOnly(allRecords).filter((record) => targetIdFor(record) === targetId).length,
    canRetry: true,
    canWaive: true,
  }));
}

function gate(
  stage: MvpWorkflowStage,
  recordType: MvpReviewGateRecordType,
  records: MvpReviewGateRecord[],
  coverageGroups: MvpReviewCoverageGroup[] = [],
  canReject = true
): MvpReviewGateView | null {
  if (records.length === 0) return null;
  return {
    stage,
    recordType,
    records,
    canApprove: true,
    canReject,
    coverageGroups,
  };
}

/**
 * Read-only projection of the records that are legally pending at the current
 * human-review gate. Coverage groups let the UI explain when rejecting the
 * remaining candidates would create a production gap and offer an explicit
 * retry or human waiver rather than silently regenerating content.
 */
export function getCurrentMvpReviewGate(
  state: MvpWorkflowState
): MvpReviewGateView | null {
  const validated = MvpWorkflowStateSchema.parse(state);
  const evaluation = evaluateMvpWorkflow(validated);

  if (evaluation.stage === 'DEFINE') {
    return isPendingReviewRecord(validated.filmBrief)
      ? gate('DEFINE', 'FilmBrief', [validated.filmBrief], [], false)
      : null;
  }

  if (
    evaluation.stage === 'RESEARCH' &&
    !reviewedSetReady(validated.researchQuestions)
  ) {
    const pending = pendingOnly(validated.researchQuestions);
    const groups: MvpReviewCoverageGroup[] = pending.length
      ? [{
          targetType: 'WORKFLOW',
          targetId: validated.filmBrief.id,
          targetLabel: validated.filmBrief.title,
          pendingRecordIds: pending.map((record) => record.id),
          approvedRecordCount: approvedOnly(validated.researchQuestions).length,
          canRetry: true,
          canWaive: false,
        }]
      : [];
    return gate('RESEARCH', 'ResearchQuestion', pending, groups);
  }

  const questionById = new Map(
    approvedOnly(validated.researchQuestions).map((record) => [record.id, record])
  );

  if (evaluation.stage === 'RESEARCH') {
    const activeIds = new Set(requiredResearchQuestionsForStage(validated, 'RESEARCH').map((record) => record.id));
    const all = validated.sources.filter((record) => activeIds.has(record.researchQuestionId));
    const pending = pendingOnly(all);
    return gate(
      'RESEARCH',
      'SourceRecord',
      pending,
      groupByTarget(
        pending,
        all,
        (record) => record.researchQuestionId,
        (id) => questionById.get(id)?.question ?? id,
        'RESEARCH_QUESTION'
      )
    );
  }

  const approvedSourceIds = new Set(approvedOnly(validated.sources).map((record) => record.id));

  if (evaluation.stage === 'EVIDENCE') {
    const activeIds = new Set(requiredResearchQuestionsForStage(validated, 'EVIDENCE').map((record) => record.id));
    const all = validated.evidence.filter(
      (record) => activeIds.has(record.researchQuestionId) && approvedSourceIds.has(record.sourceId)
    );
    const pending = pendingOnly(all);
    return gate(
      'EVIDENCE',
      'EvidenceRecord',
      pending,
      groupByTarget(
        pending,
        all,
        (record) => record.researchQuestionId,
        (id) => questionById.get(id)?.question ?? id,
        'RESEARCH_QUESTION'
      )
    );
  }

  if (evaluation.stage === 'CLAIMS') {
    const activeIds = new Set(requiredResearchQuestionsForStage(validated, 'CLAIMS').map((record) => record.id));
    const all = validated.claims.filter((record) => activeIds.has(record.researchQuestionId));
    const pending = pendingOnly(all);
    return gate(
      'CLAIMS',
      'ClaimRecord',
      pending,
      groupByTarget(
        pending,
        all,
        (record) => record.researchQuestionId,
        (id) => questionById.get(id)?.question ?? id,
        'RESEARCH_QUESTION'
      )
    );
  }

  if (evaluation.stage === 'SCRIPT') {
    const activeIds = new Set(requiredResearchQuestionsForStage(validated, 'SCRIPT').map((record) => record.id));
    const all = validated.scriptLines.filter((record) => activeIds.has(record.researchQuestionId));
    const pending = pendingOnly(all);
    return gate(
      'SCRIPT',
      'ScriptLineRecord',
      pending,
      groupByTarget(
        pending,
        all,
        (record) => record.researchQuestionId,
        (id) => questionById.get(id)?.question ?? id,
        'RESEARCH_QUESTION'
      )
    );
  }

  if (evaluation.stage === 'SCENES') {
    const activeIds = new Set(requiredResearchQuestionsForStage(validated, 'SCENES').map((record) => record.id));
    const all = validated.scenes.filter((record) => activeIds.has(record.researchQuestionId));
    const pending = pendingOnly(all);
    return gate(
      'SCENES',
      'SceneRecord',
      pending,
      groupByTarget(
        pending,
        all,
        (record) => record.researchQuestionId,
        (id) => questionById.get(id)?.question ?? id,
        'RESEARCH_QUESTION'
      )
    );
  }

  if (evaluation.stage === 'SHOTS') {
    const sceneById = new Map(requiredScenesForShots(validated).map((record) => [record.id, record]));
    const activeSceneIds = new Set(sceneById.keys());
    const all = validated.shots.filter((record) => activeSceneIds.has(record.sceneId));
    const pending = pendingOnly(all);
    return gate(
      'SHOTS',
      'ShotRecord',
      pending,
      groupByTarget(
        pending,
        all,
        (record) => record.sceneId,
        (id) => sceneById.get(id)?.title ?? id,
        'SCENE'
      )
    );
  }

  if (evaluation.stage === 'VISUAL_DECISIONS') {
    const shotById = new Map(requiredShotsForVisualDecisions(validated).map((record) => [record.id, record]));
    const activeShotIds = new Set(shotById.keys());
    const all = validated.visualDecisions.filter((record) => activeShotIds.has(record.shotId));
    const pending = pendingOnly(all);
    return gate(
      'VISUAL_DECISIONS',
      'VisualDecisionRecord',
      pending,
      groupByTarget(
        pending,
        all,
        (record) => record.shotId,
        (id) => shotById.get(id)?.description ?? id,
        'SHOT'
      )
    );
  }

  return null;
}
