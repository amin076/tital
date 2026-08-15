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
 * approved upstream provenance. This prevents an approved-but-orphaned record
 * from satisfying coverage after an upstream record was rejected or replaced.
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
 * Returns true only when the complete active workflow has approved,
 * provenance-connected coverage and no unresolved human-review records on the
 * active chain. Rejected historical records are terminal and remain persisted.
 */
export function isProductionWorkflowReady(state: MvpWorkflowState): boolean {
  if (!isApprovedRecord(state.filmBrief)) return false;
  if (!reviewedSetReady(state.researchQuestions)) return false;

  const approvedQuestions = approvedOnly(state.researchQuestions);
  const questionIds = new Set(approvedQuestions.map((record) => record.id));

  const relevantSources = relevantForParentIds(
    state.sources,
    questionIds,
    (record) => record.researchQuestionId
  );
  if (hasPendingReview(relevantSources)) return false;

  const approvedSources = approvedOnly(relevantSources);
  const sourceIds = new Set(approvedSources.map((record) => record.id));
  const relevantEvidence = relevantForParentIds(state.evidence, sourceIds, (record) => record.sourceId);
  if (hasPendingReview(relevantEvidence)) return false;

  const relevantClaims = relevantForParentIds(
    state.claims,
    questionIds,
    (record) => record.researchQuestionId
  );
  if (hasPendingReview(relevantClaims)) return false;

  const relevantScriptLines = relevantForParentIds(
    state.scriptLines,
    questionIds,
    (record) => record.researchQuestionId
  );
  if (hasPendingReview(relevantScriptLines)) return false;

  const relevantScenes = relevantForParentIds(
    state.scenes,
    questionIds,
    (record) => record.researchQuestionId
  );
  if (hasPendingReview(relevantScenes)) return false;

  const approvedScenes = approvedOnly(relevantScenes);
  const sceneIds = new Set(approvedScenes.map((record) => record.id));
  const relevantShots = relevantForParentIds(state.shots, sceneIds, (record) => record.sceneId);
  if (hasPendingReview(relevantShots)) return false;

  const approvedShots = approvedOnly(relevantShots);
  const shotIds = new Set(approvedShots.map((record) => record.id));
  const relevantVisualDecisions = relevantForParentIds(
    state.visualDecisions,
    shotIds,
    (record) => record.shotId
  );
  if (hasPendingReview(relevantVisualDecisions)) return false;

  const chain = selectApprovedProductionChain(state);
  if (missingApprovedCoverage(chain.researchQuestions, chain.sources, (record) => record.researchQuestionId).length > 0) return false;
  if (missingApprovedCoverage(chain.sources, chain.evidence, (record) => record.sourceId).length > 0) return false;
  if (missingApprovedCoverage(chain.researchQuestions, chain.claims, (record) => record.researchQuestionId).length > 0) return false;
  if (missingApprovedCoverage(chain.researchQuestions, chain.scriptLines, (record) => record.researchQuestionId).length > 0) return false;
  if (missingApprovedCoverage(chain.researchQuestions, chain.scenes, (record) => record.researchQuestionId).length > 0) return false;
  if (missingApprovedCoverage(chain.scenes, chain.shots, (record) => record.sceneId).length > 0) return false;
  if (missingApprovedCoverage(chain.shots, chain.visualDecisions, (record) => record.shotId).length > 0) return false;

  return true;
}
