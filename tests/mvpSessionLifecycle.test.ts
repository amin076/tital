import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { FilmBrief } from '../src/domain/filmBrief.js';
import type { MvpStepExecutors } from '../src/services/executeNextMvpStep.js';
import { JsonMvpSessionStore } from '../src/persistence/jsonMvpSessionStore.js';
import { createMvpSession } from '../src/services/createMvpSession.js';
import { reviewMvpSession } from '../src/services/reviewMvpSession.js';
import { advanceMvpSession } from '../src/services/advanceMvpSession.js';
import { summarizeMvpSession } from '../src/services/summarizeMvpSession.js';

function brief(): FilmBrief {
  return {
    id: 'FB-1',
    title: 'Europa',
    scientificTopic: 'Europa',
    scientificQuestion: 'Does Europa have a subsurface ocean?',
    communicationObjective: 'Explain the evidence',
    targetAudience: 'General audience',
    audienceKnowledgeLevel: 'Introductory',
    format: 'Short documentary',
    durationMinutes: 5,
    tone: 'Clear',
    learningGoals: ['Understand the evidence'],
    scope: ['Ocean evidence'],
    outOfScope: ['Habitability claims'],
    constraints: ['Preserve uncertainty'],
    researchRequirements: ['Use primary and authoritative sources'],
    status: 'REVIEW_REQUIRED',
  };
}

function lifecycleExecutors(): MvpStepExecutors {
  let sourceAttempt = 0;
  return {
    generateResearchQuestions: async (state) => [
      ...state.researchQuestions,
      {
        id: 'RQ-1',
        filmBriefId: state.filmBrief.id,
        question: 'What evidence supports a subsurface ocean on Europa?',
        purpose: 'Establish the evidence base',
        priority: 'HIGH',
        status: 'REVIEW_REQUIRED',
      },
    ],
    discoverSources: async (state) => {
      sourceAttempt += 1;
      return [
        ...state.sources,
        {
          id: `SRC-${sourceAttempt}`,
          researchQuestionId: 'RQ-1',
          provider: 'PARALLEL',
          providerSearchId: `search-${sourceAttempt}`,
          url: `https://example.com/source-${sourceAttempt}`,
          title: `Source ${sourceAttempt}`,
          publishDate: null,
          excerpts: ['Evidence excerpt'],
          retrievedAt: '2026-08-15T00:00:00.000Z',
          status: 'DISCOVERED',
        },
      ];
    },
    extractEvidence: async (state) => state.evidence,
    generateClaims: async (state) => state.claims,
    generateScriptLines: async (state) => state.scriptLines,
    generateScenes: async (state) => state.scenes,
    generateShots: async (state) => state.shots,
    generateVisualDecisions: async (state) => state.visualDecisions,
    runAudit: () => ({ issues: [], passed: true }),
  };
}

describe('persisted MVP session lifecycle', () => {
  it('persists state, stops at human gates, and regenerates coverage after rejection without deleting history', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tital-mvp-'));
    try {
      const store = new JsonMvpSessionStore(directory);
      let session = await createMvpSession('A film about Europa', {
        defineFilmCaller: async () => brief(),
        sessionIdFactory: () => 'SES-test',
        eventIdFactory: () => 'EVT-created',
        now: () => '2026-08-15T00:00:00.000Z',
      });

      await store.save(session);
      expect((await store.load('SES-test')).state.filmBrief.status).toBe('REVIEW_REQUIRED');

      session = reviewMvpSession(session, 'APPROVE', {
        eventIdFactory: () => 'EVT-brief-approved',
        now: () => '2026-08-15T00:01:00.000Z',
      });

      const executors = lifecycleExecutors();
      session = await advanceMvpSession(session, {
        executors,
        eventIdFactory: () => 'EVT-rq-generated',
        now: () => '2026-08-15T00:02:00.000Z',
      });
      expect(session.state.researchQuestions[0].status).toBe('REVIEW_REQUIRED');

      session = reviewMvpSession(session, 'APPROVE');
      session = await advanceMvpSession(session, { executors });
      expect(session.state.sources).toHaveLength(1);
      expect(session.state.sources[0].status).toBe('DISCOVERED');

      session = reviewMvpSession(session, 'REJECT');
      expect(session.state.sources[0].status).toBe('REJECTED');

      session = await advanceMvpSession(session, { executors });
      expect(session.state.sources).toHaveLength(2);
      expect(session.state.sources[0].status).toBe('REJECTED');
      expect(session.state.sources[1].status).toBe('DISCOVERED');

      await store.save(session);
      const restored = await store.load('SES-test');
      const summary = summarizeMvpSession(restored);
      expect(summary.stage).toBe('RESEARCH');
      expect(summary.counts.sources).toMatchObject({ REJECTED: 1, DISCOVERED: 1 });
      expect(restored.events.some((event) => event.type === 'REVIEW_DECISION')).toBe(true);
      expect(restored.events.some((event) => event.type === 'AUTOMATION_EXECUTED')).toBe(true);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
