import crypto from 'crypto';
import { InMemoryRunner } from '@google/adk';
import { sceneDirectorAgent } from '../agents/sceneDirectorAgent.js';
import type { CinematicGenerationContext } from '../domain/directorBrief.js';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import { SceneProposalListSchema, type SceneProposalList } from '../domain/sceneProposal.js';
import { SceneRecordSchema, type SceneRecord } from '../domain/sceneRecord.js';
import { ScriptLineRecordSchema, type ScriptLineRecord } from '../domain/scriptLineRecord.js';
import { collectAdkResponseText, toModelRuntimeError } from '../utils/adkModelResponse.js';
import { parseJsonFromModelResponse } from '../utils/modelJson.js';
import {
  CINEMATIC_GUIDANCE_PRECEDENCE,
  cinematicDecisionProvenance,
  formatDirectorGuidance,
} from './directorGuidance.js';

export function validateScriptLinesForScenes(
  scriptLines: ScriptLineRecord[],
  question: ResearchQuestion
): void {
  const parsedQuestion = ResearchQuestionSchema.safeParse(question);
  if (!parsedQuestion.success) {
    throw new Error(`Invalid ResearchQuestion schema: ${parsedQuestion.error.message}`);
  }
  if (question.status !== 'APPROVED') {
    throw new Error(
      `ResearchQuestion is not approved: scene generation requires APPROVED status, current status is "${question.status}".`
    );
  }
  if (scriptLines.length === 0) {
    throw new Error('Scene generation requires at least one approved ScriptLineRecord.');
  }

  const seenIds = new Set<string>();
  for (const line of scriptLines) {
    const parsedLine = ScriptLineRecordSchema.safeParse(line);
    if (!parsedLine.success) {
      throw new Error(`Invalid ScriptLineRecord schema: ${parsedLine.error.message}`);
    }
    if (line.status !== 'APPROVED') {
      throw new Error(
        `ScriptLineRecord is not approved: scene generation requires APPROVED status for "${line.id}", current status is "${line.status}".`
      );
    }
    if (line.researchQuestionId !== question.id) {
      throw new Error(
        `ScriptLineRecord researchQuestionId mismatch for "${line.id}": expected "${question.id}", received "${line.researchQuestionId}".`
      );
    }
    if (seenIds.has(line.id)) {
      throw new Error(`Duplicate ScriptLineRecord id supplied for scene generation: "${line.id}".`);
    }
    seenIds.add(line.id);
  }
}

export function parseSceneProposalList(rawText: string): SceneProposalList {
  const payload = parseJsonFromModelResponse(rawText, 'Scene director agent');
  const parsed = SceneProposalListSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Scene proposal validation failed: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function assembleSceneRecords(
  question: ResearchQuestion,
  scriptLines: ScriptLineRecord[],
  proposals: SceneProposalList,
  options: {
    idFactory?: () => string;
    directorGuidance?: CinematicGenerationContext;
  } = {}
): SceneRecord[] {
  const validated = SceneProposalListSchema.parse(proposals);
  const idFactory = options.idFactory ?? (() => `SC-${crypto.randomUUID()}`);

  return validated.scenes.map((proposal) => {
    const uniqueScriptLineNumbers = [...new Set(proposal.scriptLineNumbers)];
    const scriptLineIds = uniqueScriptLineNumbers.map((scriptLineNumber) => {
      const line = scriptLines[scriptLineNumber - 1];
      if (!line) {
        throw new Error(
          `Scene proposal references script line number outside the supplied approved script lines: ${scriptLineNumber}.`
        );
      }
      return line.id;
    });

    const record = {
      id: idFactory(),
      researchQuestionId: question.id,
      scriptLineIds,
      title: proposal.title,
      purpose: proposal.purpose,
      visualSummary: proposal.visualSummary,
      uncertaintyDisclosure: proposal.uncertaintyDisclosure,
      decisionProvenance: cinematicDecisionProvenance(options.directorGuidance),
      status: 'REVIEW_REQUIRED' as const,
    };

    const parsed = SceneRecordSchema.safeParse(record);
    if (!parsed.success) {
      throw new Error(`Final SceneRecord validation failed: ${parsed.error.message}`);
    }
    return parsed.data;
  });
}

export async function callSceneDirectorAgent(
  scriptLines: ScriptLineRecord[],
  question: ResearchQuestion,
  directorGuidance?: CinematicGenerationContext
): Promise<SceneProposalList> {
  const runner = new InMemoryRunner({ agent: sceneDirectorAgent });
  let responseText = '';
  const numberedScriptLines = scriptLines.map((line, index) => ({
    scriptLineNumber: index + 1,
    text: line.text,
    uncertaintyDisclosure: line.uncertaintyDisclosure,
  }));

  try {
    const run = runner.runEphemeral({
      userId: 'system',
      newMessage: {
        parts: [
          {
            text: `Create scene proposals for this approved research question using ONLY the supplied numbered approved script lines.\n\n${CINEMATIC_GUIDANCE_PRECEDENCE}\n\nHuman director guidance:\n${formatDirectorGuidance(directorGuidance)}\n\nResearchQuestion:\n${question.question}\n\nApproved numbered script lines:\n${JSON.stringify(numberedScriptLines, null, 2)}`,
          },
        ],
      },
    });
    responseText = await collectAdkResponseText(run, { label: 'Scene director agent' });
  } catch (error) {
    throw toModelRuntimeError('Scene director agent', error);
  }

  return parseSceneProposalList(responseText);
}

export async function generateScenes(
  scriptLines: ScriptLineRecord[],
  question: ResearchQuestion,
  modelCaller: (
    scriptLines: ScriptLineRecord[],
    question: ResearchQuestion,
    directorGuidance?: CinematicGenerationContext
  ) => Promise<SceneProposalList> = callSceneDirectorAgent,
  options: {
    idFactory?: () => string;
    directorGuidance?: CinematicGenerationContext;
  } = {}
): Promise<SceneRecord[]> {
  validateScriptLinesForScenes(scriptLines, question);
  const proposals = await modelCaller(
    scriptLines,
    question,
    options.directorGuidance
  );
  return assembleSceneRecords(question, scriptLines, proposals, options);
}
