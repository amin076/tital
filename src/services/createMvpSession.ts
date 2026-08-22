import { randomUUID } from 'node:crypto';
import type { FilmBrief } from '../domain/filmBrief.js';
import {
  normalizeFilmProjectInput,
  type FilmProjectInput,
} from '../domain/filmProjectInput.js';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import { defineFilm } from './defineFilm.js';

export interface CreateMvpSessionOptions {
  defineFilmCaller?: (rawIdea: string) => Promise<FilmBrief>;
  sessionIdFactory?: () => string;
  eventIdFactory?: () => string;
  now?: () => string;
  performanceNow?: () => number;
}

export async function createMvpSession(
  input: string | FilmProjectInput,
  options: CreateMvpSessionOptions = {}
): Promise<MvpSession> {
  const projectInput = normalizeFilmProjectInput(input);
  const rawIdea = projectInput.rawIdea;
  const performanceNow = options.performanceNow ?? (() => Date.now());
  const startedAt = performanceNow();

  const filmBrief = options.defineFilmCaller
    ? await options.defineFilmCaller(rawIdea)
    : await defineFilm(projectInput);

  const durationMs = Math.max(0, Math.round(performanceNow() - startedAt));
  const now = (options.now ?? (() => new Date().toISOString()))();
  const id = (options.sessionIdFactory ?? (() => `SES-${randomUUID()}`))();
  const eventId = (options.eventIdFactory ?? (() => `EVT-${randomUUID()}`))();

  return MvpSessionSchema.parse({
    id,
    rawIdea,
    projectInput,
    createdAt: now,
    updatedAt: now,
    state: {
      filmBrief,
      researchQuestions: [],
      sources: [],
      evidence: [],
      claims: [],
      scriptLines: [],
      scenes: [],
      shots: [],
      visualDecisions: [],
      coverageWaivers: [],
      audit: null,
    },
    productionPackage: null,
    directorFeedback: [],
    events: [
      {
        id: eventId,
        type: 'SESSION_CREATED',
        at: now,
        stage: 'DEFINE',
        message: 'MVP session created; FilmBrief requires explicit human review.',
        performance: {
          durationMs,
          externalCallCount: 1,
          operations: [
            {
              name: 'film_brief.generation',
              targetId: id,
              durationMs,
              success: true,
              kind: 'EXTERNAL',
            },
          ],
        },
      },
    ],
  });
}
