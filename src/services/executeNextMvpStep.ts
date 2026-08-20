import type { MvpWorkflowState } from '../domain/mvpWorkflow.js';
import type { ScientificAuditReport } from '../domain/scientificAudit.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import {
  hasPendingReview,
  missingApprovedCoverage,
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
    return {
      disposition: 'EXECUTED_AUTOMATION',
      state: withInvalidatedAudit({ ...state, researchQuestions }),
      message: 'Research-question generation executed; human review is now required.',
    };
  }

  const chain = selectApprovedProductionChain(state);
  const researchQuestionIds = new Set(chain.researchQuestions.map((record) => record.id));

  if (evaluation.stage === 'RESEARCH') {
    const relevantSources = state.sources.filter((record) => researchQuestionIds.has(record.researchQuestionId));
    if (hasPendingReview(relevantSources)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Discovered sources require human review before evidence extraction.' };
    }
    if (missingApprovedCoverage(chain.researchQuestions, chain.sources, (record) => record.researchQuestionId).length > 0) {
      const sources = await executors.discoverSources(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, sources }),
        message: 'Parallel source discovery executed for uncovered research questions; human source review is now required.',
      };
    }
  }

  if (evaluation.stage === 'EVIDENCE') {
    const sourceIds = new Set(chain.sources.map((record) => record.id));
    const relevantEvidence = state.evidence.filter((record) => sourceIds.has(record.sourceId));
    if (hasPendingReview(relevantEvidence)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Evidence requires human review before claim generation.' };
    }
    if (missingApprovedCoverage(chain.researchQuestions, chain.evidence, (record) => record.researchQuestionId).length > 0) {
      const evidence = await executors.extractEvidence(state);
      if (evidence.length === state.evidence.length) {
        return {
          disposition: 'AWAITING_HUMAN_REVIEW',
          state,
          message: 'Evidence coverage is still incomplete, but all currently approved sources for the uncovered research question(s) have already been extracted and reviewed. No automatic re-extraction was performed.',
        };
      }
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, evidence }),
        message: 'Evidence extraction executed for uncovered research questions; human evidence review is now required.',
      };
    }
  }

  if (evaluation.stage === 'CLAIMS') {
    const relevantClaims = state.claims.filter((record) => researchQuestionIds.has(record.researchQuestionId));
    if (hasPendingReview(relevantClaims)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Claims require human review before script generation.' };
    }
    if (missingApprovedCoverage(chain.researchQuestions, chain.claims, (record) => record.researchQuestionId).length > 0) {
      const claims = await executors.generateClaims(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, claims }),
        message: 'Claim generation executed for uncovered research questions; human claim review is now required.',
      };
    }
  }

  if (evaluation.stage === 'SCRIPT') {
    const relevantScriptLines = state.scriptLines.filter((record) => researchQuestionIds.has(record.researchQuestionId));
    if (hasPendingReview(relevantScriptLines)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Script lines require human review before scene generation.' };
    }
    if (missingApprovedCoverage(chain.researchQuestions, chain.scriptLines, (record) => record.researchQuestionId).length > 0) {
      const scriptLines = await executors.generateScriptLines(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, scriptLines }),
        message: 'Scientific script generation executed for uncovered research questions; human script review is now required.',
      };
    }
  }

  if (evaluation.stage === 'SCENES') {
    const relevantScenes = state.scenes.filter((record) => researchQuestionIds.has(record.researchQuestionId));
    if (hasPendingReview(relevantScenes)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Scenes require human review before shot generation.' };
    }
    if (missingApprovedCoverage(chain.researchQuestions, chain.scenes, (record) => record.researchQuestionId).length > 0) {
      const scenes = await executors.generateScenes(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, scenes }),
        message: 'Scene generation executed for uncovered research questions; human scene review is now required.',
      };
    }
  }

  if (evaluation.stage === 'SHOTS') {
    const sceneIds = new Set(chain.scenes.map((record) => record.id));
    const relevantShots = state.shots.filter((record) => sceneIds.has(record.sceneId));
    if (hasPendingReview(relevantShots)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Shots require human review before visual decisions.' };
    }
    if (missingApprovedCoverage(chain.scenes, chain.shots, (record) => record.sceneId).length > 0) {
      const shots = await executors.generateShots(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, shots }),
        message: 'Shot generation executed for uncovered scenes; human shot review is now required.',
      };
    }
  }

  if (evaluation.stage === 'VISUAL_DECISIONS') {
    const shotIds = new Set(chain.shots.map((record) => record.id));
    const relevantVisualDecisions = state.visualDecisions.filter((record) => shotIds.has(record.shotId));
    if (hasPendingReview(relevantVisualDecisions)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Visual decisions require human review before audit.' };
    }
    if (missingApprovedCoverage(chain.shots, chain.visualDecisions, (record) => record.shotId).length > 0) {
      const visualDecisions = await executors.generateVisualDecisions(state);
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
