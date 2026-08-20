import type { CoverageWaiverStage } from '../domain/coverageWaiver.js';
import type { MvpWorkflowState } from '../domain/mvpWorkflow.js';

export interface StatusRecord {
  status: string;
}

export function isApprovedRecord(record: StatusRecord): boolean {
  return record.status === 'APPROVED' || record.status === 'LOCKED';
}

export function isRejectedRecord(record: StatusRecord): boolean {
  return record.status === 'REJECTED';
}

export function isPendingReviewRecord(record: StatusRecord): boolean {
  return !isApprovedRecord(record) && !isRejectedRecord(record);
}

export function approvedOnly<T extends StatusRecord>(records: readonly T[]): T[] {
  return records.filter(isApprovedRecord);
}

export function hasPendingReview<T extends StatusRecord>(records: readonly T[]): boolean {
  return records.some(isPendingReviewRecord);
}

/**
 * A review set is complete when every generated record has reached a terminal
 * human decision and at least one record remains approved/locked for the active
 * workflow. Rejected records stay in history without blocking progression.
 */
export function reviewedSetReady<T extends StatusRecord>(records: readonly T[]): boolean {
  return approvedOnly(records).length > 0 && records.every(
    (record) => isApprovedRecord(record) || isRejectedRecord(record)
  );
}

export function missingApprovedCoverage<
  P extends { id: string },
  C extends StatusRecord,
>(
  parents: readonly P[],
  children: readonly C[],
  childParentId: (child: C) => string
): P[] {
  const coveredParentIds = new Set(
    approvedOnly(children).map((child) => childParentId(child))
  );
  return parents.filter((parent) => !coveredParentIds.has(parent.id));
}

const QUESTION_STAGE_ORDER: Record<CoverageWaiverStage, number> = {
  RESEARCH: 0,
  EVIDENCE: 1,
  CLAIMS: 2,
  SCRIPT: 3,
  SCENES: 4,
  SHOTS: 5,
  VISUAL_DECISIONS: 6,
};

export function coverageWaivers(state: MvpWorkflowState) {
  return state.coverageWaivers ?? [];
}

/**
 * A human waiver at a question-level stage intentionally removes that research
 * question from the required production branch at that stage and all later
 * stages. The approved upstream research remains in provenance history.
 */
export function isQuestionBranchWaived(
  state: MvpWorkflowState,
  questionId: string,
  stage: CoverageWaiverStage
): boolean {
  const targetOrder = QUESTION_STAGE_ORDER[stage];
  return coverageWaivers(state).some(
    (waiver) =>
      waiver.targetType === 'RESEARCH_QUESTION' &&
      waiver.targetId === questionId &&
      QUESTION_STAGE_ORDER[waiver.stage] <= targetOrder
  );
}

export function requiredResearchQuestionsForStage(
  state: MvpWorkflowState,
  stage: CoverageWaiverStage
): MvpWorkflowState['researchQuestions'] {
  return approvedOnly(state.researchQuestions).filter(
    (question) => !isQuestionBranchWaived(state, question.id, stage)
  );
}

export function requiredScenesForShots(
  state: MvpWorkflowState
): MvpWorkflowState['scenes'] {
  const activeQuestionIds = new Set(
    requiredResearchQuestionsForStage(state, 'SHOTS').map((record) => record.id)
  );
  const waivedSceneIds = new Set(
    coverageWaivers(state)
      .filter((waiver) => waiver.stage === 'SHOTS' && waiver.targetType === 'SCENE')
      .map((waiver) => waiver.targetId)
  );
  return approvedOnly(state.scenes).filter(
    (scene) => activeQuestionIds.has(scene.researchQuestionId) && !waivedSceneIds.has(scene.id)
  );
}

export function requiredShotsForVisualDecisions(
  state: MvpWorkflowState
): MvpWorkflowState['shots'] {
  const requiredSceneIds = new Set(requiredScenesForShots(state).map((record) => record.id));
  const waivedShotIds = new Set(
    coverageWaivers(state)
      .filter(
        (waiver) =>
          waiver.stage === 'VISUAL_DECISIONS' && waiver.targetType === 'SHOT'
      )
      .map((waiver) => waiver.targetId)
  );
  return approvedOnly(state.shots).filter(
    (shot) => requiredSceneIds.has(shot.sceneId) && !waivedShotIds.has(shot.id)
  );
}

export interface ApprovedProductionChain {
  researchQuestions: MvpWorkflowState['researchQuestions'];
  sources: MvpWorkflowState['sources'];
  evidence: MvpWorkflowState['evidence'];
  claims: MvpWorkflowState['claims'];
  scriptLines: MvpWorkflowState['scriptLines'];
  scenes: MvpWorkflowState['scenes'];
  shots: MvpWorkflowState['shots'];
  visualDecisions: MvpWorkflowState['visualDecisions'];
}

/**
 * Select only approved/locked records that are connected all the way back to
 * approved upstream provenance. Waivers do not erase approved history; they
 * only change which coverage gaps are required for progression.
 */
export function selectApprovedProductionChain(
  state: MvpWorkflowState
): ApprovedProductionChain {
  const researchQuestions = approvedOnly(state.researchQuestions);
  const researchQuestionIds = new Set(researchQuestions.map((record) => record.id));

  const sources = approvedOnly(state.sources).filter((record) =>
    researchQuestionIds.has(record.researchQuestionId)
  );
  const sourceIds = new Set(sources.map((record) => record.id));

  const evidence = approvedOnly(state.evidence).filter(
    (record) =>
      researchQuestionIds.has(record.researchQuestionId) && sourceIds.has(record.sourceId)
  );
  const evidenceIds = new Set(evidence.map((record) => record.id));

  const claims = approvedOnly(state.claims).filter(
    (record) =>
      researchQuestionIds.has(record.researchQuestionId) &&
      record.evidenceIds.every((id) => evidenceIds.has(id))
  );
  const claimIds = new Set(claims.map((record) => record.id));

  const scriptLines = approvedOnly(state.scriptLines).filter(
    (record) =>
      researchQuestionIds.has(record.researchQuestionId) &&
      record.claimIds.every((id) => claimIds.has(id))
  );
  const scriptLineIds = new Set(scriptLines.map((record) => record.id));

  const scenes = approvedOnly(state.scenes).filter(
    (record) =>
      researchQuestionIds.has(record.researchQuestionId) &&
      record.scriptLineIds.every((id) => scriptLineIds.has(id))
  );
  const sceneIds = new Set(scenes.map((record) => record.id));

  const shots = approvedOnly(state.shots).filter(
    (record) =>
      researchQuestionIds.has(record.researchQuestionId) &&
      sceneIds.has(record.sceneId) &&
      record.scriptLineIds.every((id) => scriptLineIds.has(id))
  );
  const shotIds = new Set(shots.map((record) => record.id));

  const visualDecisions = approvedOnly(state.visualDecisions).filter(
    (record) =>
      researchQuestionIds.has(record.researchQuestionId) && shotIds.has(record.shotId)
  );

  return {
    researchQuestions,
    sources,
    evidence,
    claims,
    scriptLines,
    scenes,
    shots,
    visualDecisions,
  };
}

function relevantForParentIds<T>(
  records: readonly T[],
  parentIds: ReadonlySet<string>,
  parentId: (record: T) => string
): T[] {
  return records.filter((record) => parentIds.has(parentId(record)));
}

/**
 * Returns true only when the active workflow has approved provenance-connected
 * coverage or an explicit human waiver for every required branch, and no
 * unresolved human-review records remain on those active branches.
 */
export function isProductionWorkflowReady(state: MvpWorkflowState): boolean {
  if (!isApprovedRecord(state.filmBrief)) return false;
  if (!reviewedSetReady(state.researchQuestions)) return false;

  const sourceQuestions = requiredResearchQuestionsForStage(state, 'RESEARCH');
  const sourceQuestionIds = new Set(sourceQuestions.map((record) => record.id));
  const relevantSources = relevantForParentIds(
    state.sources,
    sourceQuestionIds,
    (record) => record.researchQuestionId
  );
  if (hasPendingReview(relevantSources)) return false;

  const evidenceQuestions = requiredResearchQuestionsForStage(state, 'EVIDENCE');
  const evidenceQuestionIds = new Set(evidenceQuestions.map((record) => record.id));
  const approvedSources = approvedOnly(state.sources).filter((record) =>
    evidenceQuestionIds.has(record.researchQuestionId)
  );
  const approvedSourceIds = new Set(approvedSources.map((record) => record.id));
  const relevantEvidence = state.evidence.filter(
    (record) =>
      evidenceQuestionIds.has(record.researchQuestionId) && approvedSourceIds.has(record.sourceId)
  );
  if (hasPendingReview(relevantEvidence)) return false;

  const claimQuestions = requiredResearchQuestionsForStage(state, 'CLAIMS');
  const claimQuestionIds = new Set(claimQuestions.map((record) => record.id));
  const relevantClaims = relevantForParentIds(
    state.claims,
    claimQuestionIds,
    (record) => record.researchQuestionId
  );
  if (hasPendingReview(relevantClaims)) return false;

  const scriptQuestions = requiredResearchQuestionsForStage(state, 'SCRIPT');
  const scriptQuestionIds = new Set(scriptQuestions.map((record) => record.id));
  const relevantScriptLines = relevantForParentIds(
    state.scriptLines,
    scriptQuestionIds,
    (record) => record.researchQuestionId
  );
  if (hasPendingReview(relevantScriptLines)) return false;

  const sceneQuestions = requiredResearchQuestionsForStage(state, 'SCENES');
  const sceneQuestionIds = new Set(sceneQuestions.map((record) => record.id));
  const relevantScenes = relevantForParentIds(
    state.scenes,
    sceneQuestionIds,
    (record) => record.researchQuestionId
  );
  if (hasPendingReview(relevantScenes)) return false;

  const requiredScenes = requiredScenesForShots(state);
  const requiredSceneIds = new Set(requiredScenes.map((record) => record.id));
  const relevantShots = relevantForParentIds(state.shots, requiredSceneIds, (record) => record.sceneId);
  if (hasPendingReview(relevantShots)) return false;

  const requiredShots = requiredShotsForVisualDecisions(state);
  const requiredShotIds = new Set(requiredShots.map((record) => record.id));
  const relevantVisualDecisions = relevantForParentIds(
    state.visualDecisions,
    requiredShotIds,
    (record) => record.shotId
  );
  if (hasPendingReview(relevantVisualDecisions)) return false;

  const chain = selectApprovedProductionChain(state);
  if (missingApprovedCoverage(sourceQuestions, chain.sources, (record) => record.researchQuestionId).length > 0) return false;
  if (missingApprovedCoverage(evidenceQuestions, chain.evidence, (record) => record.researchQuestionId).length > 0) return false;
  if (missingApprovedCoverage(claimQuestions, chain.claims, (record) => record.researchQuestionId).length > 0) return false;
  if (missingApprovedCoverage(scriptQuestions, chain.scriptLines, (record) => record.researchQuestionId).length > 0) return false;
  if (missingApprovedCoverage(sceneQuestions, chain.scenes, (record) => record.researchQuestionId).length > 0) return false;
  if (missingApprovedCoverage(requiredScenes, chain.shots, (record) => record.sceneId).length > 0) return false;
  if (missingApprovedCoverage(requiredShots, chain.visualDecisions, (record) => record.shotId).length > 0) return false;

  return true;
}
