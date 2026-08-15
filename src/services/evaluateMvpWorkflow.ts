import { MvpWorkflowStateSchema, type MvpWorkflowStage, type MvpWorkflowState } from '../domain/mvpWorkflow.js';
import { buildProductionPackage } from './buildProductionPackage.js';

export interface MvpWorkflowEvaluation {
  stage: MvpWorkflowStage;
  nextAction: string;
  blockedBy: string[];
}

function allApproved(records: Array<{ status: string }>): boolean {
  return records.length > 0 && records.every((record) => record.status === 'APPROVED' || record.status === 'LOCKED');
}

export function evaluateMvpWorkflow(state: MvpWorkflowState): MvpWorkflowEvaluation {
  const validated = MvpWorkflowStateSchema.parse(state);

  if (validated.filmBrief.status !== 'APPROVED' && validated.filmBrief.status !== 'LOCKED') {
    return { stage: 'DEFINE', nextAction: 'Review and approve the FilmBrief.', blockedBy: ['FILM_BRIEF_NOT_APPROVED'] };
  }

  if (!allApproved(validated.researchQuestions)) {
    return { stage: 'RESEARCH', nextAction: 'Generate, review, and approve research questions.', blockedBy: ['RESEARCH_QUESTIONS_INCOMPLETE'] };
  }

  if (!allApproved(validated.sources)) {
    return { stage: 'RESEARCH', nextAction: 'Discover sources with Parallel MCP and complete human source review.', blockedBy: ['SOURCES_INCOMPLETE'] };
  }

  if (!allApproved(validated.evidence)) {
    return { stage: 'EVIDENCE', nextAction: 'Extract evidence from approved sources and complete human evidence review.', blockedBy: ['EVIDENCE_INCOMPLETE'] };
  }

  if (!allApproved(validated.claims)) {
    return { stage: 'CLAIMS', nextAction: 'Generate claims from approved evidence and complete human claim review.', blockedBy: ['CLAIMS_INCOMPLETE'] };
  }

  if (!allApproved(validated.scriptLines)) {
    return { stage: 'SCRIPT', nextAction: 'Generate scientific script lines and complete human script review.', blockedBy: ['SCRIPT_LINES_INCOMPLETE'] };
  }

  if (!allApproved(validated.scenes)) {
    return { stage: 'SCENES', nextAction: 'Generate scenes from approved script lines and complete human scene review.', blockedBy: ['SCENES_INCOMPLETE'] };
  }

  if (!allApproved(validated.shots)) {
    return { stage: 'SHOTS', nextAction: 'Generate shots and complete human shot review.', blockedBy: ['SHOTS_INCOMPLETE'] };
  }

  if (!allApproved(validated.visualDecisions)) {
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
