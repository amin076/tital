import { describe, expect, it, vi } from 'vitest';
import {
  collectAdkResponseText,
  isRetryableModelRuntimeError,
  ModelRuntimeError,
} from '../src/utils/adkModelResponse.js';
import { withModelRuntimeRetry } from '../src/utils/retryModelRuntime.js';
import { resolveRuntimeAuditMetadata } from '../src/services/resolveRuntimeAuditMetadata.js';

function runtimeError(
  category: string,
  errorCode: string | null
): ModelRuntimeError {
  return new ModelRuntimeError('provider failure', {
    label: 'test agent',
    category,
    errorCode,
    finishReason: 'STOP',
    detail: 'test failure',
    runtime: resolveRuntimeAuditMetadata({}, () => '2026-08-24T00:00:00.000Z'),
  });
}

async function* oneEvent(event: unknown): AsyncIterable<unknown> {
  yield event;
}

describe('model runtime retry resilience', () => {
  it('classifies an ADK 429 event as a retryable rate limit', async () => {
    let captured: unknown;
    try {
      await collectAdkResponseText(
        oneEvent({ errorCode: '429', errorMessage: 'Too many requests', finishReason: 'STOP' }),
        { label: 'Evidence extraction agent' }
      );
    } catch (error) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(ModelRuntimeError);
    const modelError = captured as ModelRuntimeError;
    expect(modelError.diagnostics.category).toBe('RATE_LIMIT');
    expect(modelError.diagnostics.errorCode).toBe('429');
    expect(isRetryableModelRuntimeError(modelError)).toBe(true);
  });

  it('retries transient 429 failures with bounded exponential backoff', async () => {
    const sleep = vi.fn(async () => undefined);
    const call = vi.fn()
      .mockRejectedValueOnce(runtimeError('RATE_LIMIT', '429'))
      .mockRejectedValueOnce(runtimeError('RATE_LIMIT', '429'))
      .mockResolvedValue('ok');

    await expect(withModelRuntimeRetry(call, {
      maxAttempts: 3,
      baseDelayMs: 1500,
      maxDelayMs: 6000,
      sleep,
    })).resolves.toBe('ok');

    expect(call).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 1500);
    expect(sleep).toHaveBeenNthCalledWith(2, 3000);
  });

  it('does not retry billing/quota, authorization, or safety failures', async () => {
    for (const error of [
      runtimeError('QUOTA_OR_BILLING', '403'),
      runtimeError('AUTHORIZATION', '403'),
      runtimeError('SAFETY_STOP', null),
    ]) {
      const call = vi.fn().mockRejectedValue(error);
      const sleep = vi.fn(async () => undefined);

      await expect(withModelRuntimeRetry(call, { sleep })).rejects.toBe(error);
      expect(call).toHaveBeenCalledOnce();
      expect(sleep).not.toHaveBeenCalled();
    }
  });
});
