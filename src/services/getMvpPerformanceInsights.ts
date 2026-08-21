import type { MvpSession, MvpSessionEvent } from '../domain/mvpSession.js';
import type { MvpWorkflowStage } from '../domain/mvpWorkflow.js';

export interface MvpPerformanceStageInsight {
  stage: MvpWorkflowStage;
  executions: number;
  durationMs: number;
  externalCallCount: number;
  externalWorkMs: number;
  internalWorkMs: number;
  averageCallMs: number;
  slowestCallMs: number;
  slowestOperationName: string | null;
  slowestTargetId: string | null;
  parallelOverlapFactor: number | null;
  failedCallCount: number;
}

export interface MvpPerformanceInsights {
  measured: boolean;
  measuredExecutionCount: number;
  measuredStageCount: number;
  includesProjectCreation: boolean;
  concurrencyLimits: number[];
  durationMs: number;
  externalCallCount: number;
  externalWorkMs: number;
  internalWorkMs: number;
  averageCallMs: number;
  slowestCallMs: number;
  slowestOperationName: string | null;
  slowestTargetId: string | null;
  slowestStage: MvpWorkflowStage | null;
  parallelOverlapFactor: number | null;
  failedCallCount: number;
  stages: MvpPerformanceStageInsight[];
}

function roundedRatio(numerator: number, denominator: number): number | null {
  if (denominator <= 0 || numerator <= 0) return null;
  return Math.round((numerator / denominator) * 100) / 100;
}

function performanceEvents(session: MvpSession): MvpSessionEvent[] {
  return session.events.filter((event) => Boolean(event.performance));
}

export function getMvpPerformanceInsights(session: MvpSession): MvpPerformanceInsights {
  const events = performanceEvents(session);

  if (events.length === 0) {
    return {
      measured: false,
      measuredExecutionCount: 0,
      measuredStageCount: 0,
      includesProjectCreation: false,
      concurrencyLimits: [],
      durationMs: 0,
      externalCallCount: 0,
      externalWorkMs: 0,
      internalWorkMs: 0,
      averageCallMs: 0,
      slowestCallMs: 0,
      slowestOperationName: null,
      slowestTargetId: null,
      slowestStage: null,
      parallelOverlapFactor: null,
      failedCallCount: 0,
      stages: [],
    };
  }

  const byStage = new Map<MvpWorkflowStage, MvpSessionEvent[]>();
  for (const event of events) {
    const bucket = byStage.get(event.stage) ?? [];
    bucket.push(event);
    byStage.set(event.stage, bucket);
  }

  const stages: MvpPerformanceStageInsight[] = [];
  let durationMs = 0;
  let externalCallCount = 0;
  let externalWorkMs = 0;
  let internalWorkMs = 0;
  let failedCallCount = 0;
  let slowestCallMs = 0;
  let slowestOperationName: string | null = null;
  let slowestTargetId: string | null = null;

  for (const [stage, stageEvents] of byStage) {
    const stageDurationMs = stageEvents.reduce(
      (sum, event) => sum + (event.performance?.durationMs ?? 0),
      0
    );
    const operations = stageEvents.flatMap((event) => event.performance?.operations ?? []);
    const externalOperations = operations.filter((operation) => operation.kind !== 'INTERNAL');
    const internalOperations = operations.filter((operation) => operation.kind === 'INTERNAL');
    const stageExternalWorkMs = externalOperations.reduce(
      (sum, operation) => sum + operation.durationMs,
      0
    );
    const stageInternalWorkMs = internalOperations.reduce(
      (sum, operation) => sum + operation.durationMs,
      0
    );
    const stageExternalCallCount = externalOperations.length;
    const stageFailedCallCount = externalOperations.filter((operation) => !operation.success).length;
    const slowest = externalOperations.reduce<(typeof externalOperations)[number] | null>(
      (current, operation) => (!current || operation.durationMs > current.durationMs ? operation : current),
      null
    );

    stages.push({
      stage,
      executions: stageEvents.length,
      durationMs: stageDurationMs,
      externalCallCount: stageExternalCallCount,
      externalWorkMs: stageExternalWorkMs,
      internalWorkMs: stageInternalWorkMs,
      averageCallMs:
        stageExternalCallCount > 0 ? Math.round(stageExternalWorkMs / stageExternalCallCount) : 0,
      slowestCallMs: slowest?.durationMs ?? 0,
      slowestOperationName: slowest?.name ?? null,
      slowestTargetId: slowest?.targetId ?? null,
      parallelOverlapFactor: roundedRatio(stageExternalWorkMs, stageDurationMs),
      failedCallCount: stageFailedCallCount,
    });

    durationMs += stageDurationMs;
    externalCallCount += stageExternalCallCount;
    externalWorkMs += stageExternalWorkMs;
    internalWorkMs += stageInternalWorkMs;
    failedCallCount += stageFailedCallCount;

    if (slowest && slowest.durationMs > slowestCallMs) {
      slowestCallMs = slowest.durationMs;
      slowestOperationName = slowest.name;
      slowestTargetId = slowest.targetId;
    }
  }

  stages.sort((a, b) => b.durationMs - a.durationMs);
  const slowestStage = stages[0]?.stage ?? null;
  const includesProjectCreation = events.some(
    (event) => event.stage === 'DEFINE' && event.type === 'SESSION_CREATED'
  );
  const concurrencyLimits = Array.from(
    new Set(
      events
        .map((event) => event.performance?.concurrencyLimit)
        .filter((value): value is number => typeof value === 'number')
    )
  ).sort((a, b) => a - b);

  return {
    measured: true,
    measuredExecutionCount: events.length,
    measuredStageCount: byStage.size,
    includesProjectCreation,
    concurrencyLimits,
    durationMs,
    externalCallCount,
    externalWorkMs,
    internalWorkMs,
    averageCallMs: externalCallCount > 0 ? Math.round(externalWorkMs / externalCallCount) : 0,
    slowestCallMs,
    slowestOperationName,
    slowestTargetId,
    slowestStage,
    parallelOverlapFactor: roundedRatio(externalWorkMs, durationMs),
    failedCallCount,
    stages,
  };
}
