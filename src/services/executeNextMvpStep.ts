import type { MvpWorkflowState } from '../domain/mvpWorkflow.js';
import type { ScientificAuditReport } from '../domain/scientificAudit.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import {
  approvedOnly,
  hasPendingReview,
  missingApprovedCoverage,
  reviewedSetReady,
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
    return {
      disposition: 'COMPLETE',
      state,
      message: 'Production package is ready; no further automated step is allowed.',
    };
  }

  if (evaluation.stage === 'DEFINE') {
    return {
      disposition: 'AWAITING_HUMAN_REVIEW',
      state,
      message: 'FilmBrief requires human approval before automation can continue.',
    };
  }

  if (evaluation.stage === 'RESEARCH') {
    if (!reviewedSetReady(state.researchQuestions)) {
      if (hasPendingReview(state.researchQuestions)) {
        return {
          disposition: 'AWAITING_HUMAN_REVIEW',
          state,
          message: 'Research questions require human review before source discovery.',
        };
      }

      const researchQuestions = await executors.generateResearchQuestions(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, researchQuestions }),
        message: 'Research-question generation executed; human review is now required.',
      };
    }

    const researchQuestions = approvedOnly(state.researchQuestions);
    const researchQuestionIds = new Set(researchQuestions.map((record) => record.id));
    const relevantSources = state.sources.filter((record) => researchQuestionIds.has(record.researchQuestionId));

    if (hasPendingReview(relevantSources)) {
      return {
        disposition: 'AWAITING_HUMAN_REVIEW',
        state,
        message: 'Discovered sources require human review before evidence extraction.',
      };
    }

    if (missingApprovedCoverage(researchQuestions, relevantSources, (record) => record.researchQuestionId).length > 0) {
      const sources = await executors.discoverSources(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, sources }),
        message: 'Parallel source discovery executed for uncovered research questions; human source review is now required.',
      };
    }
  }

  if (evaluation.stage === 'EVIDENCE') {
    const activeSources = approvedOnly(state.sources).filter((source) =>
      approvedOnly(state.researchQuestions).some((question) => question.id === source.researchQuestionId)
    );
    const activeSourceIds = new Set(activeSources.map((record) => record.id));
    const relevantEvidence = state.evidence.filter((record) => activeSourceIds.has(record.sourceId));

    if (hasPendingReview(relevantEvidence)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Evidence requires human review before claim generation.' };
    }

    if (missingApprovedCoverage(activeSources, relevantEvidence, (record) => record.sourceId).length > 0) {
      const evidence = await executors.extractEvidence(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, evidence }),
        message: 'Evidence extraction executed for uncovered approved sources; human evidence review is now required.',
      };
    }
  }

  if (evaluation.stage === 'CLAIMS') {
    const questions = approvedOnly(state.researchQuestions);
    const questionIds = new Set(questions.map((record) => record.id));
    const relevantClaims = state.claims.filter((record) => questionIds.has(record.researchQuestionId));

    if (hasPendingReview(relevantClaims)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Claims require human review before script generation.' };
    }

    if (missingApprovedCoverage(questions, relevantClaims, (record) => record.researchQuestionId).length > 0) {
      const claims = await executors.generateClaims(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, claims }),
        message: 'Claim generation executed for uncovered research questions; human claim review is now required.',
      };
    }
  }

  if (evaluation.stage === 'SCRIPT') {
    const questions = approvedOnly(state.researchQuestions);
    const questionIds = new Set(questions.map((record) => record.id));
    const relevantScriptLines = state.scriptLines.filter((record) => questionIds.has(record.researchQuestionId));

    if (hasPendingReview(relevantScriptLines)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Script lines require human review before scene generation.' };
    }

    if (missingApprovedCoverage(questions, relevantScriptLines, (record) => record.researchQuestionId).length > 0) {
      const scriptLines = await executors.generateScriptLines(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, scriptLines }),
        message: 'Scientific script generation executed for uncovered research questions; human script review is now required.',
      };
    }
  }

  if (evaluation.stage === 'SCENES') {
    const questions = approvedOnly(state.researchQuestions);
    const questionIds = new Set(questions.map((record) => record.id));
    const relevantScenes = state.scenes.filter((record) => questionIds.has(record.researchQuestionId));

    if (hasPendingReview(relevantScenes)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Scenes require human review before shot generation.' };
    }

    if (missingApprovedCoverage(questions, relevantScenes, (record) => record.researchQuestionId).length > 0) {
      const scenes = await executors.generateScenes(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, scenes }),
        message: 'Scene generation executed for uncovered research questions; human scene review is now required.',
      };
    }
  }

  if (evaluation.stage === 'SHOTS') {
    const questions = approvedOnly(state.researchQuestions);
    const questionIds = new Set(questions.map((record) => record.id));
    const scenes = approvedOnly(state.scenes).filter((record) => questionIds.has(record.researchQuestionId));
    const sceneIds = new Set(scenes.map((record) => record.id));
    const relevantShots = state.shots.filter((record) => sceneIds.has(record.sceneId));

    if (hasPendingReview(relevantShots)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Shots require human review before visual decisions.' };
    }

    if (missingApprovedCoverage(scenes, relevantShots, (record) => record.sceneId).length > 0) {
      const shots = await executors.generateShots(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: withInvalidatedAudit({ ...state, shots }),
        message: 'Shot generation executed for uncovered scenes; human shot review is now required.',
      };
    }
  }

  if (evaluation.stage === 'VISUAL_DECISIONS') {
    const scenes = approvedOnly(state.scenes);
    const sceneIds = new Set(scenes.map((record) => record.id));
    const shots = approvedOnly(state.shots).filter((record) => sceneIds.has(record.sceneId));
    const shotIds = new Set(shots.map((record) => record.id));
    const relevantVisualDecisions = state.visualDecisions.filter((record) => shotIds.has(record.shotId));

    if (hasPendingReview(relevantVisualDecisions)) {
      return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Visual decisions require human review before audit.' };
    }

    if (missingApprovedCoverage(shots, relevantVisualDecisions, (record) => record.shotId).length > 0) {
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
        message: audit.passed
          ? 'Scientific audit passed.'
          : 'Scientific audit found issues that must be resolved before packaging.',
      };
    }

    return {
      disposition: 'AWAITING_HUMAN_REVIEW',
      state,
      message: 'Audit issues must be resolved before automation can continue.',
    };
  }

  return {
    disposition: 'AWAITING_HUMAN_REVIEW',
    state,
    message: evaluation.nextAction,
  };
}
