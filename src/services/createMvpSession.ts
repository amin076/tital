import { randomUUID } from 'node:crypto';
import type { FilmBrief } from '../domain/filmBrief.js';
import { MvpSessionSchema, type MvpSession } from '../domain/mvpSession.js';
import { defineFilm } from './defineFilm.js';

export interface CreateMvpSessionOptions {
  defineFilmCaller?: (rawIdea: string) => Promise<FilmBrief>;
  sessionIdFactory?: () => string;
  eventIdFactory?: () => string;
  now?: () => string;
}

export async function createMvpSession(
  rawIdea: string,
  options: CreateMvpSessionOptions = {}
): Promise<MvpSession> {
  if (!rawIdea || rawIdea.trim() === '') {
    throw new Error('A non-empty film idea is required to start a Tital MVP session.');
  }

  const define = options.defineFilmCaller ?? defineFilm;
  const filmBrief = await define(rawIdea.trim());
  const now = (options.now ?? (() => new Date().toISOString()))();
  const id = (options.sessionIdFactory ?? (() => `SES-${randomUUID()}`))();
  const eventId = (options.eventIdFactory ?? (() => `EVT-${randomUUID()}`))();

  return MvpSessionSchema.parse({
    id,
    rawIdea: rawIdea.trim(),
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
      audit: null,
    },
    productionPackage: null,
    events: [
      {
        id: eventId,
        type: 'SESSION_CREATED',
        at: now,
        stage: 'DEFINE',
        message: 'MVP session created; FilmBrief requires explicit human review.',
      },
    ],
  });
}
