import { MvpWorkflowStateSchema, type MvpWorkflowStage, type MvpWorkflowState } from '../domain/mvpWorkflow.js';
import {
  approvedOnly,
  hasPendingReview,
  isApprovedRecord,
  isProductionWorkflowReady,
  missingApprovedCoverage,
  requiredResearchQuestionsForStage,
  requiredScenesForShots,
  requiredShotsForVisualDecisions,
  reviewedSetReady,
  selectApprovedProductionChain,
} from './mvpWorkflowGuards.js';

export interface MvpWorkflowEvaluation {
  stage: MvpWorkflowStage;
  nextAction: string;
  blockedBy: string[];
}

export function evaluateMvpWorkflow(state: MvpWorkflowState): MvpWorkflowEvaluation {
  const validated = MvpWorkflowStateSchema.parse(state);

  if (!isApprovedRecord(validated.filmBrief)) {
    return { stage: 'DEFINE', nextAction: 'Review and approve the FilmBrief.', blockedBy: ['FILM_BRIEF_NOT_APPROVED'] };
  }

  if (!reviewedSetReady(validated.researchQuestions)) {
    return { stage: 'RESEARCH', nextAction: 'Generate, review, and approve at least one research question.', blockedBy: ['RESEARCH_QUESTIONS_INCOMPLETE'] };
  }

  const chain = selectApprovedProductionChain(validated);

  const sourceQuestions = requiredResearchQuestionsForStage(validated, 'RESEARCH');
  const sourceQuestionIds = new Set(sourceQuestions.map((record) => record.id));
  const relevantSources = validated.sources.filter((record) =>
    sourceQuestionIds.has(record.researchQuestionId)
  );
  if (
    hasPendingReview(relevantSources) ||
    missingApprovedCoverage(sourceQuestions, chain.sources, (record) => record.researchQuestionId).length > 0
  ) {
    return {
      stage: 'RESEARCH',
      nextAction: 'Discover sources with Parallel MCP, review them, or explicitly resolve an uncovered research question by retrying or waiving that branch.',
      blockedBy: ['SOURCES_INCOMPLETE'],
    };
  }

  const evidenceQuestions = requiredResearchQuestionsForStage(validated, 'EVIDENCE');
  const evidenceQuestionIds = new Set(evidenceQuestions.map((record) => record.id));
  const approvedSourceIds = new Set(
    approvedOnly(validated.sources)
      .filter((record) => evidenceQuestionIds.has(record.researchQuestionId))
      .map((record) => record.id)
  );
  const relevantEvidence = validated.evidence.filter(
    (record) =>
      evidenceQuestionIds.has(record.researchQuestionId) && approvedSourceIds.has(record.sourceId)
  );
  if (
    hasPendingReview(relevantEvidence) ||
    missingApprovedCoverage(evidenceQuestions, chain.evidence, (record) => record.researchQuestionId).length > 0
  ) {
    return {
      stage: 'EVIDENCE',
      nextAction: 'Extract and review evidence, or explicitly retry/waive any research-question branch that remains uncovered.',
      blockedBy: ['EVIDENCE_INCOMPLETE'],
    };
  }

  const claimQuestions = requiredResearchQuestionsForStage(validated, 'CLAIMS');
  const claimQuestionIds = new Set(claimQuestions.map((record) => record.id));
  const relevantClaims = validated.claims.filter((record) =>
    claimQuestionIds.has(record.researchQuestionId)
  );
  if (
    hasPendingReview(relevantClaims) ||
    missingApprovedCoverage(claimQuestions, chain.claims, (record) => record.researchQuestionId).length > 0
  ) {
    return {
      stage: 'CLAIMS',
      nextAction: 'Generate and review claims, or explicitly retry/waive any uncovered research-question branch.',
      blockedBy: ['CLAIMS_INCOMPLETE'],
    };
  }

  const scriptQuestions = requiredResearchQuestionsForStage(validated, 'SCRIPT');
  const scriptQuestionIds = new Set(scriptQuestions.map((record) => record.id));
  const relevantScriptLines = validated.scriptLines.filter((record) =>
    scriptQuestionIds.has(record.researchQuestionId)
  );
  if (
    hasPendingReview(relevantScriptLines) ||
    missingApprovedCoverage(scriptQuestions, chain.scriptLines, (record) => record.researchQuestionId).length > 0
  ) {
    return {
      stage: 'SCRIPT',
      nextAction: 'Generate and review scientific script lines, or explicitly retry/waive any uncovered research-question branch.',
      blockedBy: ['SCRIPT_LINES_INCOMPLETE'],
    };
  }

  const sceneQuestions = requiredResearchQuestionsForStage(validated, 'SCENES');
  const sceneQuestionIds = new Set(sceneQuestions.map((record) => record.id));
  const relevantScenes = validated.scenes.filter((record) =>
    sceneQuestionIds.has(record.researchQuestionId)
  );
  if (
    hasPendingReview(relevantScenes) ||
    missingApprovedCoverage(sceneQuestions, chain.scenes, (record) => record.researchQuestionId).length > 0
  ) {
    return {
      stage: 'SCENES',
      nextAction: 'Generate and review scenes, or explicitly retry/waive any uncovered research-question branch.',
      blockedBy: ['SCENES_INCOMPLETE'],
    };
  }

  const requiredScenes = requiredScenesForShots(validated);
  const requiredSceneIds = new Set(requiredScenes.map((record) => record.id));
  const relevantShots = validated.shots.filter((record) => requiredSceneIds.has(record.sceneId));
  if (
    hasPendingReview(relevantShots) ||
    missingApprovedCoverage(requiredScenes, chain.shots, (record) => record.sceneId).length > 0
  ) {
    return {
      stage: 'SHOTS',
      nextAction: 'Generate and review shots, or explicitly retry/waive any approved scene that remains without a shot.',
      blockedBy: ['SHOTS_INCOMPLETE'],
    };
  }

  const requiredShots = requiredShotsForVisualDecisions(validated);
  const requiredShotIds = new Set(requiredShots.map((record) => record.id));
  const relevantVisualDecisions = validated.visualDecisions.filter((record) =>
    requiredShotIds.has(record.shotId)
  );
  if (
    hasPendingReview(relevantVisualDecisions) ||
    missingApprovedCoverage(requiredShots, chain.visualDecisions, (record) => record.shotId).length > 0
  ) {
    return {
      stage: 'VISUAL_DECISIONS',
      nextAction: 'Generate and review visual decisions, or explicitly retry/waive any approved shot that remains uncovered.',
      blockedBy: ['VISUAL_DECISIONS_INCOMPLETE'],
    };
  }

  if (!validated.audit) {
    return { stage: 'AUDIT', nextAction: 'Run the deterministic scientific audit.', blockedBy: ['AUDIT_NOT_RUN'] };
  }

  if (!validated.audit.passed) {
    return { stage: 'AUDIT', nextAction: 'Resolve scientific audit issues before packaging.', blockedBy: validated.audit.issues.map((issue) => issue.code) };
  }

  if (!isProductionWorkflowReady(validated)) {
    return { stage: 'PACKAGE', nextAction: 'Resolve workflow blockers and rebuild the production package.', blockedBy: ['PACKAGE_BLOCKED'] };
  }

  return { stage: 'COMPLETE', nextAction: 'Production package is ready.', blockedBy: [] };
}
