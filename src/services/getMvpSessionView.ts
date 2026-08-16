import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import { getCurrentMvpReviewGate } from './getCurrentMvpReviewGate.js';
import { getMvpWorkflowInsights } from './getMvpWorkflowInsights.js';
import { selectApprovedProductionChain } from './mvpWorkflowGuards.js';
import { summarizeMvpSession } from './summarizeMvpSession.js';

export type MvpContinueMode =
  | 'LIVE_RUNTIME'
  | 'DETERMINISTIC'
  | 'BLOCKED_BY_REVIEW'
  | 'BLOCKED_BY_AUDIT'
  | 'BLOCKED'
  | 'COMPLETE';

function continueActionFor(session: MvpSession) {
  const evaluation = evaluateMvpWorkflow(session.state);
  const reviewGate = getCurrentMvpReviewGate(session.state);

  if (reviewGate) {
    return {
      enabled: false,
      mode: 'BLOCKED_BY_REVIEW' as const,
      message: 'Complete the current human-review gate before continuing.',
    };
  }

  if (evaluation.stage === 'COMPLETE') {
    return {
      enabled: false,
      mode: 'COMPLETE' as const,
      message: 'Production package is ready.',
    };
  }

  if (evaluation.stage === 'AUDIT') {
    if (session.state.audit && !session.state.audit.passed) {
      return {
        enabled: false,
        mode: 'BLOCKED_BY_AUDIT' as const,
        message: 'Scientific audit issues must be resolved before continuing.',
      };
    }

    return {
      enabled: true,
      mode: 'DETERMINISTIC' as const,
      message: 'Run the deterministic scientific audit and eligible package tail.',
    };
  }

  if (evaluation.stage === 'PACKAGE') {
    return {
      enabled: false,
      mode: 'BLOCKED' as const,
      message: evaluation.nextAction,
    };
  }

  return {
    enabled: true,
    mode: 'LIVE_RUNTIME' as const,
    message:
      'Run the next governed automated stage. This may use Gemini / Vertex AI and Parallel MCP.',
  };
}

export function getMvpSessionView(session: MvpSession) {
  const validated = MvpSessionSchema.parse(session);

  return {
    summary: summarizeMvpSession(validated),
    rawIdea: validated.rawIdea,
    gate: getCurrentMvpReviewGate(validated.state),
    continueAction: continueActionFor(validated),
    workflowInsights: getMvpWorkflowInsights(validated.state),
    approvedChain: selectApprovedProductionChain(validated.state),
    audit: validated.state.audit,
    productionPackage: validated.productionPackage,
    recentEvents: validated.events.slice(-20).reverse(),
  };
}

export type MvpSessionView = ReturnType<typeof getMvpSessionView>;
