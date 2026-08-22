import { describe, expect, it } from 'vitest';
import {
  collectAdkResponseText,
  ModelRuntimeError,
  toModelRuntimeError,
} from '../src/utils/adkModelResponse.js';

async function* events(items: unknown[]): AsyncIterable<unknown> {
  for (const item of items) yield item;
}

describe('ADK model response diagnostics', () => {
  it('classifies ADK error events instead of reporting a generic empty response', async () => {
    await expect(
      collectAdkResponseText(
        events([
          {
            errorCode: '403',
            errorMessage: 'Spend cap breached for project: projects/123 for service: aiplatform.googleapis.com.',
          },
        ]),
        { label: 'Claim generation agent' }
      )
    ).rejects.toMatchObject({
      code: 'MODEL_RUNTIME_FAILURE',
      diagnostics: {
        category: 'QUOTA_OR_BILLING',
        errorCode: '403',
        eventCount: 1,
      },
    });
  });

  it('records safety finish reasons when no content is returned', async () => {
    await expect(
      collectAdkResponseText(
        events([{ candidates: [{ finishReason: 'SAFETY' }] }]),
        { label: 'Claim generation agent' }
      )
    ).rejects.toMatchObject({
      diagnostics: {
        category: 'SAFETY_STOP',
        finishReason: 'SAFETY',
      },
    });
  });

  it('classifies timeout exceptions raised by the ADK runner', () => {
    const error = toModelRuntimeError(
      'Claim generation agent',
      new Error('Deadline exceeded: request timed out')
    );

    expect(error).toBeInstanceOf(ModelRuntimeError);
    expect(error.diagnostics.category).toBe('TIMEOUT');
    expect(error.message).not.toContain('Deadline exceeded');
  });

  it('keeps provider credentials and prompt payloads out of the user-facing message', () => {
    const error = toModelRuntimeError(
      'Claim generation agent',
      new Error('Unable to read credential file C:\\secrets\\vertex.json')
    );

    expect(error.diagnostics.category).toBe('AUTHORIZATION');
    expect(error.message).not.toContain('C:\\secrets');
  });
});
