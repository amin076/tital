import crypto from 'crypto';
import { InMemoryRunner, stringifyContent } from '@google/adk';
import { defineAgent } from '../agents/defineAgent.js';
import {
  FilmBriefSchema,
  ModelOutputBriefSchema,
  type FilmBrief,
  type ModelOutputBrief,
} from '../domain/filmBrief.js';
import {
  normalizeFilmProjectInput,
  type FilmProjectInput,
} from '../domain/filmProjectInput.js';

/**
 * Validates that a raw idea is not empty or pure whitespace.
 */
export function validateRawIdea(rawIdea: string): void {
  if (!rawIdea || rawIdea.trim() === '') {
    throw new Error('Empty film idea: The raw film idea cannot be empty or pure whitespace.');
  }
}

/**
 * Builds a model prompt that clearly separates the creative/scientific idea from
 * user-owned production controls. The application still enforces these controls
 * after model generation, so the prompt is guidance rather than a trust boundary.
 */
export function buildDefineAgentPrompt(projectInput: FilmProjectInput): string {
  const controls = {
    ...(projectInput.title ? { title: projectInput.title } : {}),
    ...(projectInput.durationMinutes !== undefined
      ? { durationMinutes: projectInput.durationMinutes }
      : {}),
    ...(projectInput.targetAudience
      ? { targetAudience: projectInput.targetAudience }
      : {}),
    ...(projectInput.audienceKnowledgeLevel
      ? { audienceKnowledgeLevel: projectInput.audienceKnowledgeLevel }
      : {}),
    ...(projectInput.format ? { format: projectInput.format } : {}),
    ...(projectInput.tone ? { tone: projectInput.tone } : {}),
  };

  if (Object.keys(controls).length === 0) return projectInput.rawIdea;

  return [
    'SCIENTIFIC FILM IDEA:',
    projectInput.rawIdea,
    '',
    'USER-SELECTED PRODUCTION CONTROLS:',
    JSON.stringify(controls, null, 2),
    '',
    'Treat the user-selected production controls as fixed requirements. Build the remaining FilmBrief around them without silently changing them.',
  ].join('\n');
}

/**
 * Deterministically assembles a full FilmBrief from model output.
 * Explicit user controls are application-owned and override model echoes.
 */
export function assembleFilmBrief(
  modelData: ModelOutputBrief,
  projectInput?: FilmProjectInput
): FilmBrief {
  const uuid = crypto.randomUUID();
  const id = `FB-${uuid}`;
  const status = 'REVIEW_REQUIRED' as const;

  const userControls = projectInput
    ? {
        ...(projectInput.title ? { title: projectInput.title } : {}),
        ...(projectInput.durationMinutes !== undefined
          ? { durationMinutes: projectInput.durationMinutes }
          : {}),
        ...(projectInput.targetAudience
          ? { targetAudience: projectInput.targetAudience }
          : {}),
        ...(projectInput.audienceKnowledgeLevel
          ? { audienceKnowledgeLevel: projectInput.audienceKnowledgeLevel }
          : {}),
        ...(projectInput.format ? { format: projectInput.format } : {}),
        ...(projectInput.tone ? { tone: projectInput.tone } : {}),
      }
    : {};

  const fullBrief = {
    ...modelData,
    ...userControls,
    id,
    status,
  };

  const result = FilmBriefSchema.safeParse(fullBrief);
  if (!result.success) {
    throw new Error(`Final object validation failed: ${result.error.message}`);
  }

  return result.data;
}

/**
 * Core function that executes the LlmAgent using the InMemoryRunner.
 */
export async function callDefineAgent(prompt: string): Promise<ModelOutputBrief> {
  let responseText = '';
  try {
    const runner = new InMemoryRunner({ agent: defineAgent });
    const run = runner.runEphemeral({
      userId: 'system',
      newMessage: { parts: [{ text: prompt }] },
    });

    for await (const event of run) {
      responseText += stringifyContent(event);
    }
  } catch (error: any) {
    throw new Error(`ADK/model invocation failure: ${error.message}`);
  }

  if (!responseText) {
    throw new Error('ADK/model invocation failure: Model returned empty response.');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(responseText.trim());
  } catch (error: any) {
    throw new Error(
      `Malformed/unparseable model output: Failed to parse JSON response. Raw output: "${responseText}". Error: ${error.message}`
    );
  }

  const parseResult = ModelOutputBriefSchema.safeParse(parsedJson);
  if (!parseResult.success) {
    throw new Error(`Model output fails the model-output schema: ${parseResult.error.message}`);
  }

  return parseResult.data;
}

/**
 * Main orchestration function for defining a film.
 */
export async function defineFilm(
  input: string | FilmProjectInput,
  modelCaller: (prompt: string) => Promise<ModelOutputBrief> = callDefineAgent
): Promise<FilmBrief> {
  const projectInput = normalizeFilmProjectInput(input);
  validateRawIdea(projectInput.rawIdea);

  const modelOutput = await modelCaller(buildDefineAgentPrompt(projectInput));

  const parseResult = ModelOutputBriefSchema.safeParse(modelOutput);
  if (!parseResult.success) {
    throw new Error(`Model output fails the model-output schema: ${parseResult.error.message}`);
  }

  return assembleFilmBrief(parseResult.data, projectInput);
}
