import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import { summarizeEvidenceBudget } from './evidenceBudget.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import { getCurrentMvpReviewGate } from './getCurrentMvpReviewGate.js';
import { getMvpPerformanceInsights } from './getMvpPerformanceInsights.js';
import { getMvpWorkflowInsights } from './getMvpWorkflowInsights.js';
import { selectApprovedProductionChain } from './mvpWorkflowGuards.js';
import {
  latestProductionVersionComparison,
  summarizeProductionVersions,
} from './productionVersionHistory.js';
import { revisionAwaitingRepair } from './revisionProgressGuard.js';
import { summarizeMvpSession } from './summarizeMvpSession.js';

export type MvpContinueMode =
  | 'LIVE_RUNTIME'
  | 'DETERMINISTIC'
  | 'BLOCKED_BY_REVIEW'
  | 'BLOCKED_BY_AUDIT'
  | 'BLOCKED'
  | 'COMPLETE';

function continueActionFor(session: MvpSession) {
  const awaitingRepair = revisionAwaitingRepair(session);
  if (awaitingRepair) {
    return {
      enabled: false,
      mode: 'BLOCKED' as const,
      message: 'An applied governed revision is waiting for selective repair. Open the active revision and generate its replacement before continuing, auditing, or rebuilding the package.',
    };
  }

  const evaluation = evaluateMvpWorkflow(session.state);
  const reviewGate = getCurrentMvpReviewGate(session.state);

  if (reviewGate) {
    return {
      enabled: false,
      mode: 'BLOCKED_BY_REVIEW' as const,
      message: 'Complete the current human-review gate. If rejection would create a coverage gap, explicitly choose replacement retry or intentional omission.',
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
      'Run the next governed automated stage. Automatic generation is first-attempt only; rejected content is never silently regenerated. STALE records created by an explicit revision remain history and do not block deliberate repair.',
  };
}

export function getMvpSessionView(session: MvpSession) {
  const validated = MvpSessionSchema.parse(session);
  const versions = validated.productionVersions ?? [];

  return {
    summary: summarizeMvpSession(validated),
    rawIdea: validated.rawIdea,
    projectInput: validated.projectInput ?? { rawIdea: validated.rawIdea },
    directorFeedback: validated.directorFeedback ?? [],
    reviewRecommendations: validated.reviewRecommendations ?? [],
    revisionRequests: validated.revisionRequests ?? [],
    productionReviews: validated.productionReviews ?? [],
    productionVersionHistory: summarizeProductionVersions(versions),
    latestProductionVersionComparison: latestProductionVersionComparison(versions),
    gate: getCurrentMvpReviewGate(validated.state),
    continueAction: continueActionFor(validated),
    workflowInsights: getMvpWorkflowInsights(validated.state),
    performanceInsights: getMvpPerformanceInsights(validated),
    evidenceBudget: summarizeEvidenceBudget(validated.state),
    approvedChain: selectApprovedProductionChain(validated.state),
    coverageWaivers: validated.state.coverageWaivers ?? [],
    audit: validated.state.audit,
    productionPackage: validated.productionPackage,
    recentEvents: validated.events.slice(-20).reverse(),
  };
}

export type MvpSessionView = ReturnType<typeof getMvpSessionView>;
