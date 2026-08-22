import { describe, expect, it } from 'vitest';
import { FilmProjectInputSchema } from '../src/domain/filmProjectInput.js';
import {
  cinematicDecisionProvenance,
  formatDirectorGuidance,
} from '../src/services/directorGuidance.js';
import { generateShots } from '../src/services/generateShots.js';

const question = {
  id: 'RQ-1',
  filmBriefId: 'FB-1',
  question: 'What does the evidence show?',
  purpose: 'Explain evidence',
  priority: 'HIGH' as const,
  status: 'APPROVED' as const,
};

const line = {
  id: 'SL-1',
  researchQuestionId: 'RQ-1',
  claimIds: ['CL-1'],
  text: 'Approved scientific line.',
  uncertaintyDisclosure: null,
  status: 'APPROVED' as const,
};

const scene = {
  id: 'SC-1',
  researchQuestionId: 'RQ-1',
  scriptLineIds: ['SL-1'],
  title: 'Evidence scene',
  purpose: 'Show the evidence',
  visualSummary: 'A restrained visual explanation.',
  uncertaintyDisclosure: null,
  status: 'APPROVED' as const,
};

describe('director control', () => {
  it('persists a compact project-level Director Brief', () => {
    const parsed = FilmProjectInputSchema.parse({
      rawIdea: 'Explain a scientific result.',
      directorBrief: {
        collaborationMode: 'DIRECTOR_LED',
        pacing: 'CONTEMPLATIVE',
        cameraMovement: 'RESTRAINED',
        representationPreference: 'REAL_IMAGERY_FIRST',
        visualStyle: 'Observational documentary with natural light.',
        notes: 'Prefer macro photography.',
        avoid: ['orbiting camera', 'sensational imagery'],
      },
    });

    expect(parsed.directorBrief?.collaborationMode).toBe('DIRECTOR_LED');
    expect(parsed.directorBrief?.avoid).toEqual([
      'orbiting camera',
      'sensational imagery',
    ]);
  });

  it('carries explicitly remembered review feedback into later cinematic guidance', () => {
    const context = {
      learnedPreferences: [
        'Prefer authentic observation footage over reconstruction when both are available.',
        'Keep camera movement restrained during uncertainty disclosures.',
      ],
    };

    expect(formatDirectorGuidance(context)).toContain(
      'Director preferences explicitly remembered from earlier review feedback'
    );
    expect(formatDirectorGuidance(context)).toContain('Keep camera movement restrained');
    expect(cinematicDecisionProvenance(context).learnedFeedbackCount).toBe(2);
  });

  it('passes scoped director guidance to shot generation and records provenance', async () => {
    const directorGuidance = {
      directorBrief: {
        collaborationMode: 'COLLABORATIVE' as const,
        pacing: 'CONTEMPLATIVE' as const,
        cameraMovement: 'RESTRAINED' as const,
        representationPreference: 'REAL_IMAGERY_FIRST' as const,
        visualStyle: 'Quiet observational documentary.',
        avoid: ['orbiting camera'],
      },
      scopedInstruction: 'Replace the rejected shot with a quiet macro shot.',
    };

    let receivedGuidance: typeof directorGuidance | undefined;
    const records = await generateShots(
      scene,
      [line],
      question,
      async (_scene, _lines, _question, guidance) => {
        receivedGuidance = guidance as typeof directorGuidance;
        return {
          shots: [
            {
              scriptLineNumbers: [1],
              description: 'Macro view of the evidence sample.',
              cameraDirection: 'Static close-up.',
              visualIntegrityCategory: 'SCIENTIFIC_RECONSTRUCTION',
              scientificConstraint: 'Match documented morphology.',
              uncertaintyDisclosure: null,
            },
          ],
        };
      },
      {
        idFactory: () => 'SH-NEW',
        directorGuidance,
      }
    );

    expect(receivedGuidance).toEqual(directorGuidance);
    expect(records[0].decisionProvenance).toEqual({
      recommendationSource: 'AI',
      evidenceGoverned: true,
      directorBriefApplied: true,
      directorInstruction: 'Replace the rejected shot with a quiet macro shot.',
      learnedFeedbackCount: 0,
    });
  });
});
