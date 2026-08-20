import { describe, expect, it } from 'vitest';
import {
  mapWithConcurrency,
  resolveExternalConcurrency,
} from '../src/utils/mapWithConcurrency.js';

describe('mapWithConcurrency', () => {
  it('preserves input order while running independent work concurrently', async () => {
    let active = 0;
    let peak = 0;

    const results = await mapWithConcurrency([30, 5, 20, 10], 2, async (delay, index) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, delay));
      active -= 1;
      return `result-${index}`;
    });

    expect(peak).toBe(2);
    expect(results).toEqual(['result-0', 'result-1', 'result-2', 'result-3']);
  });

  it('clamps configured external concurrency to a safe range', () => {
    expect(resolveExternalConcurrency(undefined)).toBe(3);
    expect(resolveExternalConcurrency('1')).toBe(1);
    expect(resolveExternalConcurrency('99')).toBe(8);
    expect(resolveExternalConcurrency('invalid')).toBe(3);
  });
});
