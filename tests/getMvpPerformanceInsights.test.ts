import { describe, expect, it } from 'vitest';
import type { MvpSession } from '../src/domain/mvpSession.js';
import { getMvpPerformanceInsights } from '../src/services/getMvpPerformanceInsights.js';

function sessionWithEvents(events: MvpSession['events']): MvpSession {
  return { events } as unknown as MvpSession;
}

describe('getMvpPerformanceInsights', () => {
  it('returns an explicit unmeasured state when no performance traces exist', () => {
    const result = getMvpPerformanceInsights(sessionWithEvents([]));
    expect(result.measured).toBe(false);
    expect(result.stages).toEqual([]);
    expect(result.parallelOverlapFactor).toBeNull();
  });

  it('aggregates stage wall time, external work, failures, and overlap without calling it speedup', () => {
    const result = getMvpPerformanceInsights(
      sessionWithEvents([
        {
          id: 'EVT-1',
          type: 'AUTOMATION_EXECUTED',
          at: '2026-08-21T00:00:00.000Z',
          stage: 'EVIDENCE',
          message: 'Evidence generated.',
          performance: {
            durationMs: 10_000,
            externalCallCount: 3,
            operations: [
              { name: 'gemini.evidence_extraction', targetId: 'SRC-1', durationMs: 8_000, success: true },
              { name: 'gemini.evidence_extraction', targetId: 'SRC-2', durationMs: 7_000, success: true },
              { name: 'gemini.evidence_extraction', targetId: 'SRC-3', durationMs: 6_000, success: true },
            ],
          },
        },
        {
          id: 'EVT-2',
          type: 'AUTOMATION_EXECUTED',
          at: '2026-08-21T00:01:00.000Z',
          stage: 'CLAIMS',
          message: 'Claims generated.',
          performance: {
            durationMs: 5_000,
            externalCallCount: 2,
            operations: [
              { name: 'gemini.claim_generation', targetId: 'RQ-1', durationMs: 4_000, success: true },
              { name: 'gemini.claim_generation', targetId: 'RQ-2', durationMs: 3_000, success: false },
            ],
          },
        },
      ])
    );

    expect(result.measured).toBe(true);
    expect(result.durationMs).toBe(15_000);
    expect(result.externalCallCount).toBe(5);
    expect(result.externalWorkMs).toBe(28_000);
    expect(result.averageCallMs).toBe(5_600);
    expect(result.parallelOverlapFactor).toBe(1.87);
    expect(result.failedCallCount).toBe(1);
    expect(result.slowestStage).toBe('EVIDENCE');
    expect(result.slowestCallMs).toBe(8_000);
    expect(result.slowestTargetId).toBe('SRC-1');
    expect(result.stages[0]?.stage).toBe('EVIDENCE');
    expect(result.stages[0]?.parallelOverlapFactor).toBe(2.1);
  });
});
