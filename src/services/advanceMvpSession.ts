import { randomUUID } from 'node:crypto';
import { MvpSessionSchema, type MvpSession, type MvpSessionEventType } from '../domain/mvpSession.js';
import { buildProductionPackage } from './buildProductionPackage.js';
import { createRealMvpStepExecutors } from './createRealMvpStepExecutors.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import { executeNextMvpStep, type MvpStepExecutors } from './executeNextMvpStep.js';

export interface AdvanceMvpSessionOptions {
  executors?: MvpStepExecutors;
  now?: () => string;
  eventIdFactory?: () => string;
}

function packageFor(session: MvpSession) {
  return buildProductionPackage({
    filmBrief: session.state.filmBrief,
    researchQuestions: session.state.researchQuestions,
    sources: session.state.sources,
    evidence: session.state.evidence,
    claims: session.state.claims,
    scriptLines: session.state.scriptLines,
    scenes: session.state.scenes,
    shots: session.state.shots,
    visualDecisions: session.state.visualDecisions,
    coverageWaivers: session.state.coverageWaivers ?? [],
  });
}

export async function advanceMvpSession(
  session: MvpSession,
  options: AdvanceMvpSessionOptions = {}
): Promise<MvpSession> {
  let current = MvpSessionSchema.parse(session);
  const executors = options.executors ?? createRealMvpStepExecutors();
  const nowFactory = options.now ?? (() => new Date().toISOString());
  const eventIdFactory = options.eventIdFactory ?? (() => `EVT-${randomUUID()}`);

  // A continuation is intentionally bounded by the next human gate. The only
  // multi-step automatic tail is audit -> package, because both are deterministic.
  for (let step = 0; step < 4; step += 1) {
    const stageBefore = evaluateMvpWorkflow(current.state).stage;
    const result = await executeNextMvpStep(current.state, executors);

    if (result.disposition === 'AWAITING_HUMAN_REVIEW') {
      return current;
    }

    const now = nowFactory();
    let eventType: MvpSessionEventType;
    if (result.disposition === 'EXECUTED_AUTOMATION') eventType = 'AUTOMATION_EXECUTED';
    else if (result.disposition === 'AUDIT_EXECUTED') eventType = 'AUDIT_EXECUTED';
    else eventType = 'PACKAGE_BUILT';

    current = MvpSessionSchema.parse({
      ...current,
      updatedAt: now,
      state: result.state,
      productionPackage: result.disposition === 'COMPLETE' ? packageFor({ ...current, state: result.state }) : null,
      events: [
        ...current.events,
        {
          id: eventIdFactory(),
          type: eventType,
          at: now,
          stage: stageBefore,
          message: result.message,
        },
      ],
    });

    if (result.disposition === 'EXECUTED_AUTOMATION') {
      return current;
    }

    if (result.disposition === 'AUDIT_EXECUTED') {
      if (!result.state.audit?.passed) return current;
      continue;
    }

    if (result.disposition === 'COMPLETE') {
      return current;
    }
  }

  throw new Error('MVP continuation exceeded the deterministic audit/package step bound.');
}
