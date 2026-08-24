import { isRetryableModelRuntimeError } from './adkModelResponse.js';

export interface ModelRuntimeRetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
  onRetry?: (input: { attempt: number; delayMs: number; error: unknown }) => void;
}

function defaultSleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Retries only transient provider failures. Authentication, safety, schema,
 * deterministic validation, billing/spend-cap failures, and ordinary application
 * errors fail immediately.
 */
export async function withModelRuntimeRetry<T>(
  call: () => Promise<T>,
  options: ModelRuntimeRetryOptions = {}
): Promise<T> {
  const maxAttempts = Math.max(1, Math.min(5, options.maxAttempts ?? 3));
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 1500);
  const maxDelayMs = Math.max(baseDelayMs, options.maxDelayMs ?? 8000);
  const sleep = options.sleep ?? defaultSleep;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await call();
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !isRetryableModelRuntimeError(error)) {
        throw error;
      }

      const delayMs = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      options.onRetry?.({ attempt, delayMs, error });
      await sleep(delayMs);
    }
  }

  throw lastError;
}
