import { describe, expect, it } from 'vitest';
import type { FilmBrief, ModelOutputBrief } from '../src/domain/filmBrief.js';
import {
  FilmProjectInputSchema,
  normalizeFilmProjectInput,
} from '../src/domain/filmProjectInput.js';
import { createMvpSession } from '../src/services/createMvpSession.js';
import {
  buildDefineAgentPrompt,
  defineFilm,
} from '../src/services/defineFilm.js';

const modelOutput: ModelOutputBrief = {
  title: 'Model-selected title',
  scientificTopic: 'Mass extinction',
  scientificQuestion: 'What caused the end-Cretaceous mass extinction?',
  communicationObjective: 'Explain the evidence and uncertainty.',
  targetAudience: 'Scientists',
  audienceKnowledgeLevel: 'Advanced',
  format: 'Lecture',
  durationMinutes: 45,
  tone: 'Technical',
  learningGoals: ['Understand the evidence'],
  scope: ['Impact evidence'],
  outOfScope: ['Unrelated extinction events'],
  constraints: ['Preserve uncertainty'],
  researchRequirements: ['Verify claims against authoritative sources'],
};

function reviewedBrief(): FilmBrief {
  return {
    id: 'FB-test',
    ...modelOutput,
    status: 'REVIEW_REQUIRED',
  };
}

describe('project creation controls', () => {
  it('validates structured creation input and trims the scientific idea', () => {
    const parsed = FilmProjectInputSchema.parse({
      rawIdea: '  Why did the dinosaurs go extinct?  ',
      durationMinutes: 5,
      targetAudience: 'General public',
    });

    expect(parsed.rawIdea).toBe('Why did the dinosaurs go extinct?');
    expect(parsed.durationMinutes).toBe(5);
  });

  it('keeps legacy raw-string callers compatible', () => {
    expect(normalizeFilmProjectInput('Europa')).toEqual({ rawIdea: 'Europa' });
  });

  it('includes explicit user controls in the Define Agent prompt', () => {
    const prompt = buildDefineAgentPrompt({
      rawIdea: 'Investigate the dinosaur extinction.',
      durationMinutes: 5,
      targetAudience: 'General public',
      tone: 'Cinematic and rigorous',
    });

    expect(prompt).toContain('Investigate the dinosaur extinction.');
    expect(prompt).toContain('"durationMinutes": 5');
    expect(prompt).toContain('"targetAudience": "General public"');
    expect(prompt).toContain('fixed requirements');
  });

  it('treats user-selected production controls as application-owned', async () => {
    const brief = await defineFilm(
      {
        rawIdea: 'Investigate the dinosaur extinction.',
        title: 'What Really Killed the Dinosaurs?',
        durationMinutes: 5,
        targetAudience: 'General public',
        audienceKnowledgeLevel: 'No specialist scientific background',
        format: 'Popular-science short',
        tone: 'Engaging, cinematic, accessible, scientifically rigorous',
      },
      async () => modelOutput
    );

    expect(brief.title).toBe('What Really Killed the Dinosaurs?');
    expect(brief.durationMinutes).toBe(5);
    expect(brief.targetAudience).toBe('General public');
    expect(brief.audienceKnowledgeLevel).toBe(
      'No specialist scientific background'
    );
    expect(brief.format).toBe('Popular-science short');
    expect(brief.tone).toBe(
      'Engaging, cinematic, accessible, scientifically rigorous'
    );
    expect(brief.scientificQuestion).toBe(modelOutput.scientificQuestion);
    expect(brief.status).toBe('REVIEW_REQUIRED');
  });

  it('persists project controls with the session without breaking the review gate', async () => {
    const session = await createMvpSession(
      {
        rawIdea: 'Investigate the dinosaur extinction.',
        durationMinutes: 5,
        targetAudience: 'General public',
        audienceKnowledgeLevel: 'No specialist scientific background',
        format: 'Popular-science short',
        tone: 'Cinematic',
      },
      {
        defineFilmCaller: async () => reviewedBrief(),
        sessionIdFactory: () => 'SES-controls',
        eventIdFactory: () => 'EVT-controls',
        now: () => '2026-08-20T00:00:00.000Z',
      }
    );

    expect(session.projectInput).toMatchObject({
      rawIdea: 'Investigate the dinosaur extinction.',
      durationMinutes: 5,
      targetAudience: 'General public',
      format: 'Popular-science short',
    });
    expect(session.state.filmBrief.status).toBe('REVIEW_REQUIRED');
  });

  it('rejects invalid duration before invoking the model', async () => {
    let called = false;

    await expect(
      defineFilm(
        {
          rawIdea: 'A valid idea',
          durationMinutes: 0,
        },
        async () => {
          called = true;
          return modelOutput;
        }
      )
    ).rejects.toThrow();

    expect(called).toBe(false);
  });
});
