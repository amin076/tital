import crypto from 'crypto';
import { InMemoryRunner } from '@google/adk';
import { researchQuestionAgent } from '../agents/researchQuestionAgent.js';
import { FilmBriefSchema, type FilmBrief } from '../domain/filmBrief.js';
import {
  ResearchQuestionSchema,
  ResearchQuestionsListSchema,
  type ResearchQuestion,
  type ResearchQuestionsList,
} from '../domain/researchQuestion.js';
import { collectAdkResponseText, toModelRuntimeError } from '../utils/adkModelResponse.js';
import { parseJsonFromModelResponse } from '../utils/modelJson.js';

/**
 * Validates the film brief and ensures it is APPROVED before proceeding to research.
 */
export function validateFilmBriefForResearch(filmBrief: FilmBrief): void {
  // 1. Validate incoming FilmBrief schema
  const parseResult = FilmBriefSchema.safeParse(filmBrief);
  if (!parseResult.success) {
    throw new Error(`Invalid FilmBrief schema: ${parseResult.error.message}`);
  }

  // 2. Enforce that status must be APPROVED
  if (filmBrief.status !== 'APPROVED') {
    throw new Error(`FilmBrief is not approved: The brief must be APPROVED to generate research questions, current status is "${filmBrief.status}".`);
  }
}

/**
 * Deterministically assembles fully valid ResearchQuestions from model proposals.
 */
export function assembleResearchQuestions(
  proposals: ResearchQuestionsList,
  filmBriefId: string
): ResearchQuestion[] {
  // Validate model-generated structure
  const validation = ResearchQuestionsListSchema.safeParse(proposals);
  if (!validation.success) {
    throw new Error(`Model output fails research questions list schema: ${validation.error.message}`);
  }

  return validation.data.questions.map((q) => {
    const uuid = crypto.randomUUID();
    const id = `RQ-${uuid}`;

    const completeQuestion = {
      ...q,
      id,
      filmBriefId,
      status: "REVIEW_REQUIRED" as const,
    };

    // Parse against strict ResearchQuestionSchema
    const finalResult = ResearchQuestionSchema.safeParse(completeQuestion);
    if (!finalResult.success) {
      throw new Error(`Final ResearchQuestion validation failed: ${finalResult.error.message}`);
    }

    return finalResult.data;
  });
}

/**
 * Core function that executes the LlmAgent using the InMemoryRunner.
 */
export async function callResearchQuestionAgent(filmBrief: FilmBrief): Promise<ResearchQuestionsList> {
  let responseText = '';
  try {
    const runner = new InMemoryRunner({ agent: researchQuestionAgent });
    const run = runner.runEphemeral({
      userId: 'system',
      newMessage: {
        parts: [
          {
            text: `Please generate research questions for the following approved Film Brief:\n\n${JSON.stringify(filmBrief, null, 2)}`,
          },
        ],
      },
    });

    responseText = await collectAdkResponseText(run, { label: 'Research question agent' });
  } catch (error) {
    throw toModelRuntimeError('Research question agent', error);
  }

  const parsedJson = parseJsonFromModelResponse(responseText, 'Research question agent');

  return parsedJson as ResearchQuestionsList;
}

/**
 * Main orchestration service for generating research questions.
 */
export async function generateResearchQuestions(
  filmBrief: FilmBrief,
  modelCaller: (brief: FilmBrief) => Promise<ResearchQuestionsList> = callResearchQuestionAgent
): Promise<ResearchQuestion[]> {
  validateFilmBriefForResearch(filmBrief);
  const modelProposals = await modelCaller(filmBrief);
  return assembleResearchQuestions(modelProposals, filmBrief.id);
}
