import { MvpWorkflowStateSchema, type MvpWorkflowStage, type MvpWorkflowState } from '../domain/mvpWorkflow.js';
import { buildProductionPackage } from './buildProductionPackage.js';
import {
  approvedOnly,
  hasPendingReview,
  isApprovedRecord,
  missingApprovedCoverage,
  reviewedSetReady,
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

  const researchQuestions = approvedOnly(validated.researchQuestions);
  const researchQuestionIds = new Set(researchQuestions.map((record) => record.id));
  const relevantSources = validated.sources.filter((record) => researchQuestionIds.has(record.researchQuestionId));

  if (
    hasPendingReview(relevantSources) ||
    missingApprovedCoverage(researchQuestions, relevantSources, (record) => record.researchQuestionId).length > 0
  ) {
    return { stage: 'RESEARCH', nextAction: 'Discover sources with Parallel MCP and complete human source review for each approved research question.', blockedBy: ['SOURCES_INCOMPLETE'] };
  }

  const sources = approvedOnly(relevantSources);
  const sourceIds = new Set(sources.map((record) => record.id));
  const relevantEvidence = validated.evidence.filter((record) => sourceIds.has(record.sourceId));

  if (
    hasPendingReview(relevantEvidence) ||
    missingApprovedCoverage(sources, relevantEvidence, (record) => record.sourceId).length > 0
  ) {
    return { stage: 'EVIDENCE', nextAction: 'Extract evidence from approved sources and complete human evidence review.', blockedBy: ['EVIDENCE_INCOMPLETE'] };
  }

  const relevantClaims = validated.claims.filter((record) => researchQuestionIds.has(record.researchQuestionId));
  if (
    hasPendingReview(relevantClaims) ||
    missingApprovedCoverage(researchQuestions, relevantClaims, (record) => record.researchQuestionId).length > 0
  ) {
    return { stage: 'CLAIMS', nextAction: 'Generate claims from approved evidence and complete human claim review.', blockedBy: ['CLAIMS_INCOMPLETE'] };
  }

  const relevantScriptLines = validated.scriptLines.filter((record) => researchQuestionIds.has(record.researchQuestionId));
  if (
    hasPendingReview(relevantScriptLines) ||
    missingApprovedCoverage(researchQuestions, relevantScriptLines, (record) => record.researchQuestionId).length > 0
  ) {
    return { stage: 'SCRIPT', nextAction: 'Generate scientific script lines and complete human script review.', blockedBy: ['SCRIPT_LINES_INCOMPLETE'] };
  }

  const relevantScenes = validated.scenes.filter((record) => researchQuestionIds.has(record.researchQuestionId));
  if (
    hasPendingReview(relevantScenes) ||
    missingApprovedCoverage(researchQuestions, relevantScenes, (record) => record.researchQuestionId).length > 0
  ) {
    return { stage: 'SCENES', nextAction: 'Generate scenes from approved script lines and complete human scene review.', blockedBy: ['SCENES_INCOMPLETE'] };
  }

  const scenes = approvedOnly(relevantScenes);
  const sceneIds = new Set(scenes.map((record) => record.id));
  const relevantShots = validated.shots.filter((record) => sceneIds.has(record.sceneId));
  if (
    hasPendingReview(relevantShots) ||
    missingApprovedCoverage(scenes, relevantShots, (record) => record.sceneId).length > 0
  ) {
    return { stage: 'SHOTS', nextAction: 'Generate shots and complete human shot review.', blockedBy: ['SHOTS_INCOMPLETE'] };
  }

  const shots = approvedOnly(relevantShots);
  const shotIds = new Set(shots.map((record) => record.id));
  const relevantVisualDecisions = validated.visualDecisions.filter((record) => shotIds.has(record.shotId));
  if (
    hasPendingReview(relevantVisualDecisions) ||
    missingApprovedCoverage(shots, relevantVisualDecisions, (record) => record.shotId).length > 0
  ) {
    return { stage: 'VISUAL_DECISIONS', nextAction: 'Generate visual decisions and complete human visual review.', blockedBy: ['VISUAL_DECISIONS_INCOMPLETE'] };
  }

  if (!validated.audit) {
    return { stage: 'AUDIT', nextAction: 'Run the deterministic scientific audit.', blockedBy: ['AUDIT_NOT_RUN'] };
  }

  if (!validated.audit.passed) {
    return { stage: 'AUDIT', nextAction: 'Resolve scientific audit issues before packaging.', blockedBy: validated.audit.issues.map((issue) => issue.code) };
  }

  const productionPackage = buildProductionPackage({
    filmBrief: validated.filmBrief,
    researchQuestions: validated.researchQuestions,
    sources: validated.sources,
    evidence: validated.evidence,
    claims: validated.claims,
    scriptLines: validated.scriptLines,
    scenes: validated.scenes,
    shots: validated.shots,
    visualDecisions: validated.visualDecisions,
  });

  if (productionPackage.status !== 'READY_FOR_PRODUCTION') {
    return { stage: 'PACKAGE', nextAction: 'Resolve workflow blockers and rebuild the production package.', blockedBy: ['PACKAGE_BLOCKED'] };
  }

  return { stage: 'COMPLETE', nextAction: 'Production package is ready.', blockedBy: [] };
}
