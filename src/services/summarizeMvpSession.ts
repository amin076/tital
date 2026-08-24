import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import {
  evaluationForRevisionAwaitingRepair,
  revisionAwaitingRepair,
} from './revisionProgressGuard.js';

function statusCounts(records: Array<{ status: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of records) counts[record.status] = (counts[record.status] ?? 0) + 1;
  return counts;
}

export function summarizeMvpSession(session: MvpSession) {
  const validated = MvpSessionSchema.parse(session);
  const awaitingRepair = revisionAwaitingRepair(validated);
  const evaluation = awaitingRepair
    ? evaluationForRevisionAwaitingRepair(awaitingRepair)
    : evaluateMvpWorkflow(validated.state);
  return {
    sessionId: validated.id,
    title: validated.state.filmBrief.title,
    stage: evaluation.stage,
    nextAction: evaluation.nextAction,
    blockedBy: evaluation.blockedBy,
    updatedAt: validated.updatedAt,
    productionPackageStatus: validated.productionPackage?.status ?? null,
    counts: {
      researchQuestions: statusCounts(validated.state.researchQuestions),
      sources: statusCounts(validated.state.sources),
      evidence: statusCounts(validated.state.evidence),
      claims: statusCounts(validated.state.claims),
      scriptLines: statusCounts(validated.state.scriptLines),
      scenes: statusCounts(validated.state.scenes),
      shots: statusCounts(validated.state.shots),
      visualDecisions: statusCounts(validated.state.visualDecisions),
    },
  };
}
