import { randomUUID } from 'node:crypto';
import type { PerformanceOperation } from '../domain/performanceTrace.js';
import { MvpSessionSchema, type MvpSession, type MvpSessionEventType } from '../domain/mvpSession.js';
import { resolveExternalConcurrency } from '../utils/mapWithConcurrency.js';
import { buildProductionPackage } from './buildProductionPackage.js';
import {
  createRealMvpStepExecutors,
  realMvpRuntimeServices,
} from './createRealMvpStepExecutors.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import { executeNextMvpStep, type MvpStepExecutors } from './executeNextMvpStep.js';

export interface AdvanceMvpSessionOptions {
  executors?: MvpStepExecutors;
  now?: () => string;
  eventIdFactory?: () => string;
  performanceNow?: () => number;
  externalConcurrency?: number;
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
  const operations: PerformanceOperation[] = [];
  const performanceNow = options.performanceNow ?? (() => Date.now());
  const concurrencyLimit = options.externalConcurrency ?? (
    options.executors ? undefined : resolveExternalConcurrency(process.env.TITAL_EXTERNAL_CONCURRENCY)
  );
  const executors = options.executors ?? createRealMvpStepExecutors(
    realMvpRuntimeServices,
    {
      directorBrief: current.projectInput?.directorBrief,
      externalConcurrency: concurrencyLimit,
      onOperation: (operation) => operations.push(operation),
    }
  );
  const nowFactory = options.now ?? (() => new Date().toISOString());
  const eventIdFactory = options.eventIdFactory ?? (() => `EVT-${randomUUID()}`);

  // A continuation is intentionally bounded by the next human gate. The only
  // multi-step automatic tail is audit -> package, because both are deterministic.
  for (let step = 0; step < 4; step += 1) {
    const stageBefore = evaluateMvpWorkflow(current.state).stage;
    const startedAt = performanceNow();
    const operationStart = operations.length;
    const result = await executeNextMvpStep(current.state, executors);
    const durationMs = Math.max(0, Math.round(performanceNow() - startedAt));
    const stepOperations = operations.slice(operationStart);
    const externalCallCount = stepOperations.filter(
      (operation) => operation.kind !== 'INTERNAL'
    ).length;

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
          performance: {
            durationMs,
            externalCallCount,
            ...(concurrencyLimit ? { concurrencyLimit } : {}),
            operations: stepOperations,
          },
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
