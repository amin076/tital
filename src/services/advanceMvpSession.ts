import { randomUUID } from 'node:crypto';
import type { PerformanceOperation } from '../domain/performanceTrace.js';
import { MvpSessionSchema, type MvpSession, type MvpSessionEventType } from '../domain/mvpSession.js';
import { ModelRuntimeError } from '../utils/adkModelResponse.js';
import { resolveExternalConcurrency } from '../utils/mapWithConcurrency.js';
import { buildProductionPackage } from './buildProductionPackage.js';
import {
  createRealMvpStepExecutors,
  realMvpRuntimeServices,
} from './createRealMvpStepExecutors.js';
import { evaluateMvpWorkflow } from './evaluateMvpWorkflow.js';
import { executeNextMvpStep, type MvpStepExecutors } from './executeNextMvpStep.js';
import { appendProductionPackageVersion } from './productionVersionHistory.js';

export interface AdvanceMvpSessionOptions {
  executors?: MvpStepExecutors;
  now?: () => string;
  eventIdFactory?: () => string;
  performanceNow?: () => number;
  externalConcurrency?: number;
}

export class MvpSessionAdvanceError extends Error {
  constructor(
    message: string,
    readonly session: MvpSession,
    readonly statusCode: number,
    readonly code: string
  ) {
    super(message);
  }
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

function safeAutomationFailureMessage(error: unknown): string {
  if (error instanceof ModelRuntimeError) return error.message;
  if (!(error instanceof Error)) {
    return 'The next automated stage failed before producing trusted workflow state. No project records were changed.';
  }

  const message = error.message;
  if (
    message.includes('returned malformed JSON') ||
    message.includes('returned an empty response') ||
    message.includes('validation failed') ||
    message.includes('schema') ||
    message.includes('references') ||
    message.includes('provenance') ||
    message.includes('not approved') ||
    message.includes('outside the supplied')
  ) {
    return `${message} No project records were changed.`;
  }

  return 'The next automated stage failed before producing trusted workflow state. No project records were changed.';
}

function repairingRevisionForVersion(session: MvpSession) {
  return [...(session.revisionRequests ?? [])]
    .reverse()
    .find((revision) => revision.status === 'REPAIRING') ?? null;
}

function captureProductionVersion(session: MvpSession): MvpSession {
  const pkg = session.productionPackage;
  if (!pkg || pkg.status !== 'READY_FOR_PRODUCTION') return session;
  const revision = repairingRevisionForVersion(session);
  const changeSummary = revision
    ? `${revision.type.replaceAll('_', ' ')}: ${revision.reason}`
    : 'Initial READY_FOR_PRODUCTION package.';

  return MvpSessionSchema.parse({
    ...session,
    productionVersions: appendProductionPackageVersion(
      session.productionVersions ?? [],
      pkg,
      {
        revisionId: revision?.id ?? null,
        changeSummary,
        createdAt: pkg.generatedAt,
      }
    ),
  });
}

function completeRepairingRevisions(
  session: MvpSession,
  at: string,
  eventIdFactory: () => string
): MvpSession {
  const active = (session.revisionRequests ?? []).filter(
    (revision) => revision.status === 'REPAIRING'
  );
  if (active.length === 0) return session;

  return MvpSessionSchema.parse({
    ...session,
    revisionRequests: (session.revisionRequests ?? []).map((revision) =>
      revision.status === 'REPAIRING'
        ? { ...revision, status: 'COMPLETED' }
        : revision
    ),
    events: [
      ...session.events,
      {
        id: eventIdFactory(),
        type: 'REVISION_COMPLETED',
        at,
        stage: 'COMPLETE',
        message: `${active.length} governed revision${active.length === 1 ? '' : 's'} completed after human-reviewed repair, re-audit, and production-package rebuild.`,
      },
    ],
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
      directorFeedback: current.directorFeedback ?? [],
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
    let result;
    try {
      result = await executeNextMvpStep(current.state, executors);
    } catch (error) {
      const durationMs = Math.max(0, Math.round(performanceNow() - startedAt));
      const stepOperations = operations.slice(operationStart);
      const externalCallCount = stepOperations.filter(
        (operation) => operation.kind !== 'INTERNAL'
      ).length;
      const now = nowFactory();
      const clientMessage = safeAutomationFailureMessage(error);
      const failed = MvpSessionSchema.parse({
        ...current,
        updatedAt: now,
        events: [
          ...current.events,
          {
            id: eventIdFactory(),
            type: 'AUTOMATION_FAILED',
            at: now,
            stage: stageBefore,
            message: clientMessage,
            performance: {
              durationMs,
              externalCallCount,
              ...(concurrencyLimit ? { concurrencyLimit } : {}),
              operations: stepOperations,
            },
          },
        ],
      });

      throw new MvpSessionAdvanceError(
        clientMessage,
        failed,
        error instanceof ModelRuntimeError ? 502 : 500,
        error instanceof ModelRuntimeError ? error.code : 'AUTOMATION_FAILED'
      );
    }
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
      current = captureProductionVersion(current);
      return completeRepairingRevisions(current, now, eventIdFactory);
    }
  }

  throw new Error('MVP continuation exceeded the deterministic audit/package step bound.');
}
