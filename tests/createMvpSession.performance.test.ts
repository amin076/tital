import { describe, expect, it } from 'vitest';
import type { FilmBrief } from '../src/domain/filmBrief.js';
import { createMvpSession } from '../src/services/createMvpSession.js';

const filmBrief: FilmBrief = {
  id: 'FB-test',
  title: 'Why is the sky blue?',
  scientificTopic: 'Atmospheric optics',
  scientificQuestion: 'Why is the sky blue?',
  communicationObjective: 'Explain Rayleigh scattering.',
  targetAudience: 'General public',
  audienceKnowledgeLevel: 'No specialist scientific background',
  format: 'Popular-science short',
  durationMinutes: 5,
  tone: 'Clear and rigorous',
  learningGoals: ['Understand wavelength-dependent scattering'],
  scope: ['Visible light', 'Rayleigh scattering'],
  outOfScope: ['Advanced radiative transfer'],
  constraints: ['Use scientifically faithful visuals'],
  researchRequirements: ['Use authoritative sources'],
  status: 'REVIEW_REQUIRED',
};

describe('createMvpSession performance trace', () => {
  it('records FilmBrief generation as measured project-creation work', async () => {
    const ticks = [1_000, 4_300];
    const session = await createMvpSession('Why is the sky blue?', {
      defineFilmCaller: async () => filmBrief,
      sessionIdFactory: () => 'SES-test',
      eventIdFactory: () => 'EVT-test',
      now: () => '2026-08-21T00:00:00.000Z',
      performanceNow: () => ticks.shift() ?? 4_300,
    });

    expect(session.events).toHaveLength(1);
    expect(session.events[0]?.type).toBe('SESSION_CREATED');
    expect(session.events[0]?.stage).toBe('DEFINE');
    expect(session.events[0]?.performance).toEqual({
      durationMs: 3_300,
      externalCallCount: 1,
      operations: [
        {
          name: 'film_brief.generation',
          targetId: 'SES-test',
          durationMs: 3_300,
          success: true,
          kind: 'EXTERNAL',
        },
      ],
    });
  });
});
