import type { MvpWorkflowState } from '../domain/mvpWorkflow.js';
import type { ScientificAuditReport } from '../domain/scientificAudit.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';

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

function hasPendingHumanReview(records: Array<{ status: string }>): boolean {
  return records.some((record) => record.status === 'REVIEW_REQUIRED' || record.status === 'DRAFT');
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
    if (state.researchQuestions.length === 0) {
      const researchQuestions = await executors.generateResearchQuestions(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: { ...state, researchQuestions },
        message: 'Research-question generation executed; human review is now required.',
      };
    }

    if (hasPendingHumanReview(state.researchQuestions)) {
      return {
        disposition: 'AWAITING_HUMAN_REVIEW',
        state,
        message: 'Research questions require human review before source discovery.',
      };
    }

    if (state.sources.length === 0) {
      const sources = await executors.discoverSources(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: { ...state, sources },
        message: 'Parallel source discovery executed; human source review is now required.',
      };
    }

    return {
      disposition: 'AWAITING_HUMAN_REVIEW',
      state,
      message: 'Discovered sources require human review before evidence extraction.',
    };
  }

  if (evaluation.stage === 'EVIDENCE') {
    if (state.evidence.length === 0) {
      const evidence = await executors.extractEvidence(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: { ...state, evidence },
        message: 'Evidence extraction executed; human evidence review is now required.',
      };
    }
    return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Evidence requires human review before claim generation.' };
  }

  if (evaluation.stage === 'CLAIMS') {
    if (state.claims.length === 0) {
      const claims = await executors.generateClaims(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: { ...state, claims },
        message: 'Claim generation executed; human claim review is now required.',
      };
    }
    return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Claims require human review before script generation.' };
  }

  if (evaluation.stage === 'SCRIPT') {
    if (state.scriptLines.length === 0) {
      const scriptLines = await executors.generateScriptLines(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: { ...state, scriptLines },
        message: 'Scientific script generation executed; human script review is now required.',
      };
    }
    return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Script lines require human review before scene generation.' };
  }

  if (evaluation.stage === 'SCENES') {
    if (state.scenes.length === 0) {
      const scenes = await executors.generateScenes(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: { ...state, scenes },
        message: 'Scene generation executed; human scene review is now required.',
      };
    }
    return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Scenes require human review before shot generation.' };
  }

  if (evaluation.stage === 'SHOTS') {
    if (state.shots.length === 0) {
      const shots = await executors.generateShots(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: { ...state, shots },
        message: 'Shot generation executed; human shot review is now required.',
      };
    }
    return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Shots require human review before visual decisions.' };
  }

  if (evaluation.stage === 'VISUAL_DECISIONS') {
    if (state.visualDecisions.length === 0) {
      const visualDecisions = await executors.generateVisualDecisions(state);
      return {
        disposition: 'EXECUTED_AUTOMATION',
        state: { ...state, visualDecisions },
        message: 'Visual-decision generation executed; human visual review is now required.',
      };
    }
    return { disposition: 'AWAITING_HUMAN_REVIEW', state, message: 'Visual decisions require human review before audit.' };
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
