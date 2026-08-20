import type { MvpWorkflowState } from '../domain/mvpWorkflow.js';
import type { ScientificAuditReport } from '../domain/scientificAudit.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import {
  hasPendingReview,
  missingApprovedCoverage,
  requiredResearchQuestionsForStage,
  requiredScenesForShots,
  requiredShotsForVisualDecisions,
  reviewedSetReady,
  selectApprovedProductionChain,
} from './mvpWorkflowGuards.js';

export type ExecutionDisposition =
  | 'EXECUTED_AUTOMATION'
  | 'AWAITING_HUMAN_REVIEW'
  | 'AUDIT_EXECUTED'
  | 'COMPLETE';

export interface MvpExecutionResult {
  disposition: ExecutionDisposition;
  state: MvpWorkflowState;
  message: string;
}

export interface MvpStepExecutors {
  generateResearchQuestions: (state: MvpWorkflowState) => Promise<MvpWorkflowState['researchQuestions']>;
  discoverSources: (state: MvpWorkflowState) => Promise<MvpWorkflowState['sources']>;
  extractEvidence: (state: MvpWorkflowState) => Promise<MvpWorkflowState['evidence']>;
  generateClaims: (state: MvpWorkflowState) => Promise<MvpWorkflowState['claims']>;
  generateScriptLines: (state: MvpWorkflowState) => Promise<MvpWorkflowState['scriptLines']>;
  generateScenes: (state: MvpWorkflowState) => Promise<MvpWorkflowState['scenes']>;
  generateShots: (state: MvpWorkflowState) => Promise<MvpWorkflowState['shots']>;
  generateVisualDecisions: (state: MvpWorkflowState) => Promise<MvpWorkflowState['visualDecisions']>;
  runAudit: (state: MvpWorkflowState) => Promise<ScientificAuditReport> | ScientificAuditReport;
}

function withInvalidatedAudit(state: MvpWorkflowState): MvpWorkflowState {
  return { ...state, audit: null };
}

function unresolvedMessage(label: string): string {
  return `${label} coverage is still incomplete, but the current candidate set has already been reviewed. Tital will not silently regenerate rejected content. Explicitly choose a replacement retry or accept the intentional coverage gap.`;
}

export async function executeNextMvpStep(
  state: MvpWorkflowState,
  executors: MvpStepExecutors
): Promise<MvpExecutionResult> {
  const evaluation = evaluateMvpWorkflow(state);

  if (evaluation.stage === 'COMPLETE') {
    return { disposition: 'COMPLETE', state, message: 'Production package is ready; no further automated step is allowed.' };
  }

  if (evaluation.stage === 'DEFINE') {
    return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'FilmBrief requires human approval before automation can continue.' };
  }

  if (evaluation.stage === 'RESEARCH' && !reviewedSetReady(state.researchQuestions)) {
    if (hasPendingReview(state.researchQuestions)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Research questions require human review before source discovery.' };
    }
    const researchQuestions = await executors.generateResearchQuestions(state);
    if (researchQuestions.length === state.researchQuestions.length) {
      return {
        disposition: 'AWAITING_HUMAN_REVIEW',
        state,
        message: 'No approved research question remains and the prior question candidates have already been reviewed. Explicitly request replacement research questions; Tital will not regenerate them automatically.',
      };
    }
    return {
      disposition: 'EXECUTED_AUTOMATION',
      state: withInvalidatedAudit({ ...state, researchQuestions }),
      message: 'Research-question generation executed; human review is now required.',
    };
  }

  const chain = selectApprovedProductionChain(state);

  if (evaluation.stage === 'RESEARCH') {
    const requiredQuestions = requiredResearchQuestionsForStage(state, 'RESEARCH');
    const requiredIds = new Set(requiredQuestions.map((record) => record.id));
    const relevantSources = state.sources.filter((record) => requiredIds.has(record.researchQuestionId));
    if (hasPendingReview(relevantSources)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Discovered sources require human review before evidence extraction.' };
    }
    if (missingApprovedCoverage(requiredQuestions, chain.sources, (record) => record.researchQuestionId).length > 0) {
      const sources = await executors.discoverSources(state);
      if (sources.length === state.sources.length) {
        return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: unresolvedMessage('Source') };
      }
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, sources }),
        message: 'Parallel source discovery executed for uncovered research questions; human source review is now required.',
      };
    }
  }

  if (evaluation.stage === 'EVIDENCE') {
    const requiredQuestions = requiredResearchQuestionsForStage(state, 'EVIDENCE');
    const requiredIds = new Set(requiredQuestions.map((record) => record.id));
    const approvedSourceIds = new Set(
      chain.sources
        .filter((record) => requiredIds.has(record.researchQuestionId))
        .map((record) => record.id)
    );
    const relevantEvidence = state.evidence.filter(
      (record) => requiredIds.has(record.researchQuestionId) && approvedSourceIds.has(record.sourceId)
    );
    if (hasPendingReview(relevantEvidence)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Evidence requires human review before claim generation.' };
    }
    if (missingApprovedCoverage(requiredQuestions, chain.evidence, (record) => record.researchQuestionId).length > 0) {
      const evidence = await executors.extractEvidence(state);
      if (evidence.length === state.evidence.length) {
        return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: unresolvedMessage('Evidence') };
      }
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, evidence }),
        message: 'Evidence extraction executed for uncovered research questions; human evidence review is now required.',
      };
    }
  }

  if (evaluation.stage === 'CLAIMS') {
    const requiredQuestions = requiredResearchQuestionsForStage(state, 'CLAIMS');
    const requiredIds = new Set(requiredQuestions.map((record) => record.id));
    const relevantClaims = state.claims.filter((record) => requiredIds.has(record.researchQuestionId));
    if (hasPendingReview(relevantClaims)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Claims require human review before script generation.' };
    }
    if (missingApprovedCoverage(requiredQuestions, chain.claims, (record) => record.researchQuestionId).length > 0) {
      const claims = await executors.generateClaims(state);
      if (claims.length === state.claims.length) {
        return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: unresolvedMessage('Claim') };
      }
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, claims }),
        message: 'Claim generation executed for uncovered research questions; human claim review is now required.',
      };
    }
  }

  if (evaluation.stage === 'SCRIPT') {
    const requiredQuestions = requiredResearchQuestionsForStage(state, 'SCRIPT');
    const requiredIds = new Set(requiredQuestions.map((record) => record.id));
    const relevantScriptLines = state.scriptLines.filter((record) => requiredIds.has(record.researchQuestionId));
    if (hasPendingReview(relevantScriptLines)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Script lines require human review before scene generation.' };
    }
    if (missingApprovedCoverage(requiredQuestions, chain.scriptLines, (record) => record.researchQuestionId).length > 0) {
      const scriptLines = await executors.generateScriptLines(state);
      if (scriptLines.length === state.scriptLines.length) {
        return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: unresolvedMessage('Script') };
      }
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, scriptLines }),
        message: 'Scientific script generation executed for uncovered research questions; human script review is now required.',
      };
    }
  }

  if (evaluation.stage === 'SCENES') {
    const requiredQuestions = requiredResearchQuestionsForStage(state, 'SCENES');
    const requiredIds = new Set(requiredQuestions.map((record) => record.id));
    const relevantScenes = state.scenes.filter((record) => requiredIds.has(record.researchQuestionId));
    if (hasPendingReview(relevantScenes)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Scenes require human review before shot generation.' };
    }
    if (missingApprovedCoverage(requiredQuestions, chain.scenes, (record) => record.researchQuestionId).length > 0) {
      const scenes = await executors.generateScenes(state);
      if (scenes.length === state.scenes.length) {
        return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: unresolvedMessage('Scene') };
      }
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, scenes }),
        message: 'Scene generation executed for uncovered research questions; human scene review is now required.',
      };
    }
  }

  if (evaluation.stage === 'SHOTS') {
    const requiredScenes = requiredScenesForShots(state);
    const requiredIds = new Set(requiredScenes.map((record) => record.id));
    const relevantShots = state.shots.filter((record) => requiredIds.has(record.sceneId));
    if (hasPendingReview(relevantShots)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Shots require human review before visual decisions.' };
    }
    if (missingApprovedCoverage(requiredScenes, chain.shots, (record) => record.sceneId).length > 0) {
      const shots = await executors.generateShots(state);
      if (shots.length === state.shots.length) {
        return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: unresolvedMessage('Shot') };
      }
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, shots }),
        message: 'Shot generation executed for uncovered scenes; human shot review is now required.',
      };
    }
  }

  if (evaluation.stage === 'VISUAL_DECISIONS') {
    const requiredShots = requiredShotsForVisualDecisions(state);
    const requiredIds = new Set(requiredShots.map((record) => record.id));
    const relevantVisualDecisions = state.visualDecisions.filter((record) => requiredIds.has(record.shotId));
    if (hasPendingReview(relevantVisualDecisions)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Visual decisions require human review before audit.' };
    }
    if (missingApprovedCoverage(requiredShots, chain.visualDecisions, (record) => record.shotId).length > 0) {
      const visualDecisions = await executors.generateVisualDecisions(state);
      if (visualDecisions.length === state.visualDecisions.length) {
        return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: unresolvedMessage('Visual decision') };
      }
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, visualDecisions }),
        message: 'Visual-decision generation executed for uncovered shots; human visual review is now required.',
      };
    }
  }

  if (evaluation.stage === 'AUDIT') {
    if (!state.audit) {
      const audit = await executors.runAudit(state);
      return {
        disposition: 'AUDIT_EXECUTED',
        state: { ...state, audit },
        message: audit.passed ? 'Scientific audit passed.' : 'Scientific audit found issues that must be resolved before packaging.',
      };
    }
    return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Audit issues must be resolved before automation can continue.' };
  }

  return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: evaluation.nextAction };
}
