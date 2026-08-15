import { describe, expect, it } from 'vitest';
import { normalizeLegacyMvpSessionData } from '../src/persistence/jsonMvpSessionStore.js';

describe('legacy MVP session evidence migration', () => {
  it('normalizes known semantic-null uncertainty strings to JSON null', () => {
    const legacy = {
      state: {
        evidence: [
          { id: 'EV-1', uncertainty: 'null' },
          { id: 'EV-2', uncertainty: ' None ' },
          { id: 'EV-3', uncertainty: 'N/A' },
          { id: 'EV-4', uncertainty: 'unknown' },
          { id: 'EV-5', uncertainty: 'no uncertainty' },
        ],
      },
    };

    const migrated = normalizeLegacyMvpSessionData(legacy) as typeof legacy;

    expect(migrated.state.evidence.map((item) => item.uncertainty)).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it('preserves substantive uncertainty text', () => {
    const current = {
      state: {
        evidence: [
          {
            id: 'EV-1',
            uncertainty: 'The measurement is indirect and does not image the ocean itself.',
          },
        ],
      },
    };

    expect(normalizeLegacyMvpSessionData(current)).toEqual(current);
  });

  it('does not mutate unrelated session fields', () => {
    const legacy = {
      id: 'SES-1',
      rawIdea: 'Europa ocean film',
      state: {
        evidence: [{ id: 'EV-1', uncertainty: 'null' }],
        claims: [{ id: 'CL-1', uncertainty: 'null' }],
      },
      events: [{ id: 'EVT-1' }],
    };

    const migrated = normalizeLegacyMvpSessionData(legacy) as typeof legacy;

    expect(migrated.id).toBe('SES-1');
    expect(migrated.rawIdea).toBe('Europa ocean film');
    expect(migrated.state.claims).toEqual([{ id: 'CL-1', uncertainty: 'null' }]);
    expect(migrated.events).toEqual([{ id: 'EVT-1' }]);
    expect(migrated.state.evidence[0]!.uncertainty).toBeNull();
  });
});
