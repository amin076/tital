import { MvpWorkflowStateSchema, type MvpWorkflowStage, type MvpWorkflowState } from '../domain/mvpWorkflow.js';
import {
  approvedOnly,
  hasPendingReview,
  isApprovedRecord,
  isProductionWorkflowReady,
  missingApprovedCoverage,
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
  const researchQuestionIds = new Set(chain.researchQuestions.map((record) => record.id));
  const relevantSources = validated.sources.filter((record) => researchQuestionIds.has(record.researchQuestionId));

  if (
    hasPendingReview(relevantSources) ||
    missingApprovedCoverage(chain.researchQuestions, chain.sources, (record) => record.researchQuestionId).length > 0
  ) {
    return { stage: 'RESEARCH', nextAction: 'Discover sources with Parallel MCP and complete human source review for each approved research question.', blockedBy: ['SOURCES_INCOMPLETE'] };
  }

  const sourceIds = new Set(chain.sources.map((record) => record.id));
  const relevantEvidence = validated.evidence.filter((record) => sourceIds.has(record.sourceId));
  if (
    hasPendingReview(relevantEvidence) ||
    missingApprovedCoverage(chain.sources, chain.evidence, (record) => record.sourceId).length > 0
  ) {
    return { stage: 'EVIDENCE', nextAction: 'Extract evidence from approved sources and complete human evidence review.', blockedBy: ['EVIDENCE_INCOMPLETE'] };
  }

  const relevantClaims = validated.claims.filter((record) => researchQuestionIds.has(record.researchQuestionId));
  if (
    hasPendingReview(relevantClaims) ||
    missingApprovedCoverage(chain.researchQuestions, chain.claims, (record) => record.researchQuestionId).length > 0
  ) {
    return { stage: 'CLAIMS', nextAction: 'Generate claims from approved evidence and complete human claim review.', blockedBy: ['CLAIMS_INCOMPLETE'] };
  }

  const relevantScriptLines = validated.scriptLines.filter((record) => researchQuestionIds.has(record.researchQuestionId));
  if (
    hasPendingReview(relevantScriptLines) ||
    missingApprovedCoverage(chain.researchQuestions, chain.scriptLines, (record) => record.researchQuestionId).length > 0
  ) {
    return { stage: 'SCRIPT', nextAction: 'Generate scientific script lines and complete human script review.', blockedBy: ['SCRIPT_LINES_INCOMPLETE'] };
  }

  const relevantScenes = validated.scenes.filter((record) => researchQuestionIds.has(record.researchQuestionId));
  if (
    hasPendingReview(relevantScenes) ||
    missingApprovedCoverage(chain.researchQuestions, chain.scenes, (record) => record.researchQuestionId).length > 0
  ) {
    return { stage: 'SCENES', nextAction: 'Generate scenes from approved script lines and complete human scene review.', blockedBy: ['SCENES_INCOMPLETE'] };
  }

  const sceneIds = new Set(chain.scenes.map((record) => record.id));
  const relevantShots = validated.shots.filter((record) => sceneIds.has(record.sceneId));
  if (
    hasPendingReview(relevantShots) ||
    missingApprovedCoverage(chain.scenes, chain.shots, (record) => record.sceneId).length > 0
  ) {
    return { stage: 'SHOTS', nextAction: 'Generate shots and complete human shot review.', blockedBy: ['SHOTS_INCOMPLETE'] };
  }

  const shotIds = new Set(chain.shots.map((record) => record.id));
  const relevantVisualDecisions = validated.visualDecisions.filter((record) => shotIds.has(record.shotId));
  if (
    hasPendingReview(relevantVisualDecisions) ||
    missingApprovedCoverage(chain.shots, chain.visualDecisions, (record) => record.shotId).length > 0
  ) {
    return { stage: 'VISUAL_DECISIONS', nextAction: 'Generate visual decisions and complete human visual review.', blockedBy: ['VISUAL_DECISIONS_INCOMPLETE'] };
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
