import crypto from 'crypto';
import { InMemoryRunner, stringifyContent } from '@google/adk';
import { defineAgent } from '../agents/defineAgent.js';
import {
  FilmBriefSchema,
  ModelOutputBriefSchema,
  type FilmBrief,
  type ModelOutputBrief,
} from '../domain/filmBrief.js';

/**
 * Validates that a raw idea is not empty or pure whitespace.
 */
export function validateRawIdea(rawIdea: string): void {
  if (!rawIdea || rawIdea.trim() === '') {
    throw new Error("Empty film idea: The raw film idea cannot be empty or pure whitespace.");
  }
}

/**
 * Deterministically assembles a full FilmBrief from model output.
 */
export function assembleFilmBrief(modelData: ModelOutputBrief): FilmBrief {
  // Generate a non-empty ID (e.g., FB-<uuid>)
  const uuid = crypto.randomUUID();
  const id = `FB-${uuid}`;

  // Force status to "REVIEW_REQUIRED"
  const status = "REVIEW_REQUIRED" as const;

  const fullBrief = {
    ...modelData,
    id,
    status,
  };

  // Validate against full FilmBriefSchema
  const result = FilmBriefSchema.safeParse(fullBrief);
  if (!result.success) {
    throw new Error(`Final object validation failed: ${result.error.message}`);
  }

  return result.data;
}

/**
 * Core function that executes the LlmAgent using the InMemoryRunner.
 */
export async function callDefineAgent(rawIdea: string): Promise<ModelOutputBrief> {
  let responseText = '';
  try {
    const runner = new InMemoryRunner({ agent: defineAgent });
    const run = runner.runEphemeral({
      userId: 'system',
      newMessage: { parts: [{ text: rawIdea }] },
    });

    for await (const event of run) {
      responseText += stringifyContent(event);
    }
  } catch (error: any) {
    throw new Error(`ADK/model invocation failure: ${error.message}`);
  }

  if (!responseText) {
    throw new Error("ADK/model invocation failure: Model returned empty response.");
  }

  // Parse structured JSON output
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(responseText.trim());
  } catch (error: any) {
    throw new Error(`Malformed/unparseable model output: Failed to parse JSON response. Raw output: "${responseText}". Error: ${error.message}`);
  }

  // Validate against model output schema
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
  rawIdea: string,
  modelCaller: (idea: string) => Promise<ModelOutputBrief> = callDefineAgent
): Promise<FilmBrief> {
  validateRawIdea(rawIdea);
  const modelOutput = await modelCaller(rawIdea);

  // Robustly validate the model output at the service boundary
  const parseResult = ModelOutputBriefSchema.safeParse(modelOutput);
  if (!parseResult.success) {
    throw new Error(`Model output fails the model-output schema: ${parseResult.error.message}`);
  }

  return assembleFilmBrief(parseResult.data);
}
