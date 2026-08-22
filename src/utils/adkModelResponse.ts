import { stringifyContent } from '@google/adk';
import type { RuntimeFailureMetadata } from '../domain/runtimeAuditMetadata.js';
import { resolveRuntimeAuditMetadata } from '../services/resolveRuntimeAuditMetadata.js';

export interface AdkResponseDiagnostics extends RuntimeFailureMetadata {
  label: string;
  runtime: ReturnType<typeof resolveRuntimeAuditMetadata>;
}

export class ModelRuntimeError extends Error {
  readonly code = 'MODEL_RUNTIME_FAILURE';

  constructor(
    message: string,
    readonly diagnostics: AdkResponseDiagnostics
  ) {
    super(message);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function stringField(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function collectNamedStrings(value: unknown, names: Set<string>, found: Set<string>, depth = 0): void {
  if (depth > 6) return;
  const record = asRecord(value);
  if (!record) return;

  for (const [key, child] of Object.entries(record)) {
    if (names.has(key.toLowerCase()) && typeof child === 'string' && child.trim()) {
      found.add(child.trim());
    }
    if (child && typeof child === 'object') collectNamedStrings(child, names, found, depth + 1);
  }
}

function classifyRuntimeFailure(input: {
  errorCode?: string | null;
  message?: string | null;
  finishReason?: string | null;
}): { category: string; detail: string } {
  const combined = `${input.errorCode ?? ''} ${input.message ?? ''} ${input.finishReason ?? ''}`.toLowerCase();

  if (combined.includes('spend cap') || combined.includes('quota') || combined.includes('billing')) {
    return {
      category: 'QUOTA_OR_BILLING',
      detail: 'Vertex AI rejected the request because project quota, billing, or spend cap capacity was not available.',
    };
  }

  if (combined.includes('deadline') || combined.includes('timeout') || combined.includes('timed out')) {
    return {
      category: 'TIMEOUT',
      detail: 'The ADK or Vertex AI request timed out before returning structured content.',
    };
  }

  if (combined.includes('safety') || combined.includes('blocked')) {
    return {
      category: 'SAFETY_STOP',
      detail: 'Vertex AI stopped or blocked the response before returning usable structured content.',
    };
  }

  if (
    input.errorCode === '401' ||
    input.errorCode === '403' ||
    combined.includes('credential') ||
    combined.includes('permission') ||
    combined.includes('unauthorized') ||
    combined.includes('forbidden')
  ) {
    return {
      category: 'AUTHORIZATION',
      detail: 'The ADK or Vertex AI request was rejected by authentication or authorization.',
    };
  }

  return {
    category: 'PROVIDER_RUNTIME',
    detail: 'The ADK or Vertex AI request failed before returning usable structured content.',
  };
}

function modelRuntimeError(
  label: string,
  input: {
    message?: string | null;
    errorCode?: string | null;
    finishReason?: string | null;
    eventCount?: number;
  }
): ModelRuntimeError {
  const classification = classifyRuntimeFailure(input);
  const codeSuffix = input.errorCode ? ` (code ${input.errorCode})` : '';
  const finishSuffix = input.finishReason ? ` Finish reason: ${input.finishReason}.` : '';
  return new ModelRuntimeError(
    `${label} failed before returning structured content${codeSuffix}. ${classification.detail}${finishSuffix}`,
    {
      label,
      category: classification.category,
      errorCode: input.errorCode ?? null,
      finishReason: input.finishReason ?? null,
      eventCount: input.eventCount,
      detail: classification.detail,
      runtime: resolveRuntimeAuditMetadata(),
    }
  );
}

export function toModelRuntimeError(label: string, error: unknown): ModelRuntimeError {
  if (error instanceof ModelRuntimeError) return error;
  const message = error instanceof Error ? error.message : String(error);
  return modelRuntimeError(label, { message });
}

export async function collectAdkResponseText(
  run: AsyncIterable<unknown>,
  options: { label: string }
): Promise<string> {
  let responseText = '';
  let eventCount = 0;
  const finishReasons = new Set<string>();
  const blockedReasons = new Set<string>();

  for await (const event of run) {
    eventCount += 1;
    const record = asRecord(event);
    if (record) {
      collectNamedStrings(event, new Set(['finishreason', 'finish_reason']), finishReasons);
      collectNamedStrings(event, new Set(['blockedreason', 'blocked_reason']), blockedReasons);
      const errorCode = stringField(record, 'errorCode');
      const errorMessage = stringField(record, 'errorMessage');
      if (errorCode || errorMessage) {
        throw modelRuntimeError(options.label, {
          message: errorMessage,
          errorCode,
          finishReason: [...finishReasons, ...blockedReasons][0] ?? null,
          eventCount,
        });
      }
    }

    responseText += stringifyContent(event as Parameters<typeof stringifyContent>[0]);
  }

  if (responseText.trim()) return responseText;

  throw modelRuntimeError(options.label, {
    finishReason: [...finishReasons, ...blockedReasons][0] ?? null,
    eventCount,
  });
}
