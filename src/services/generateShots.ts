import crypto from 'crypto';
import { InMemoryRunner, stringifyContent } from '@google/adk';
import { shotDirectorAgent } from '../agents/shotDirectorAgent.js';
import { ResearchQuestionSchema, type ResearchQuestion } from '../domain/researchQuestion.js';
import { SceneRecordSchema, type SceneRecord } from '../domain/sceneRecord.js';
import { ScriptLineRecordSchema, type ScriptLineRecord } from '../domain/scriptLineRecord.js';
import { ShotProposalListSchema, type ShotProposalList } from '../domain/shotProposal.js';
import { ShotRecordSchema, type ShotRecord } from '../domain/shotRecord.js';
import { parseJsonFromModelResponse } from '../utils/modelJson.js';

export function validateSceneForShots(
  scene: SceneRecord,
  scriptLines: ScriptLineRecord[],
  question: ResearchQuestion
): void {
  const parsedQuestion = ResearchQuestionSchema.safeParse(question);
  if (!parsedQuestion.success) {
    throw new Error(`Invalid ResearchQuestion schema: ${parsedQuestion.error.message}`);
  }

  const parsedScene = SceneRecordSchema.safeParse(scene);
  if (!parsedScene.success) {
    throw new Error(`Invalid SceneRecord schema: ${parsedScene.error.message}`);
  }

  if (question.status !== 'APPROVED') {
    throw new Error('ResearchQuestion is not approved for shot generation.');
  }

  if (scene.status !== 'APPROVED') {
    throw new Error(
      `SceneRecord is not approved: shot generation requires APPROVED status, current status is "${scene.status}".`
    );
  }

  if (scene.researchQuestionId !== question.id) {
    throw new Error(
      `SceneRecord researchQuestionId mismatch: expected "${question.id}", received "${scene.researchQuestionId}".`
    );
  }

  if (scriptLines.length === 0) {
    throw new Error('Shot generation requires the approved ScriptLineRecords referenced by the scene.');
  }

  const byId = new Map(scriptLines.map((line) => [line.id, line]));
  for (const scriptLineId of scene.scriptLineIds) {
    const line = byId.get(scriptLineId);
    if (!line) {
      throw new Error(`Scene references ScriptLineRecord that was not supplied: "${scriptLineId}".`);
    }

    const parsedLine = ScriptLineRecordSchema.safeParse(line);
    if (!parsedLine.success) {
      throw new Error(`Invalid ScriptLineRecord schema: ${parsedLine.error.message}`);
    }

    if (line.status !== 'APPROVED') {
      throw new Error(`ScriptLineRecord is not approved: "${line.id}".`);
    }

    if (line.researchQuestionId !== question.id) {
      throw new Error(`ScriptLineRecord researchQuestionId mismatch for "${line.id}".`);
    }
  }
}

export function parseShotProposalList(rawText: string): ShotProposalList {
  const payload = parseJsonFromModelResponse(rawText, 'Shot director agent');
  const parsed = ShotProposalListSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Shot proposal validation failed: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function assembleShotRecords(
  scene: SceneRecord,
  proposals: ShotProposalList,
  options: { idFactory?: () => string } = {}
): ShotRecord[] {
  const validated = ShotProposalListSchema.parse(proposals);
  const allowedScriptLineIds = new Set(scene.scriptLineIds);
  const idFactory = options.idFactory ?? (() => `SH-${crypto.randomUUID()}`);

  return validated.shots.map((proposal) => {
    if (proposal.sceneId !== scene.id) {
      throw new Error(
        `Shot proposal sceneId mismatch: expected "${scene.id}", received "${proposal.sceneId}".`
      );
    }

    const uniqueScriptLineIds = [...new Set(proposal.scriptLineIds)];
    for (const scriptLineId of uniqueScriptLineIds) {
      if (!allowedScriptLineIds.has(scriptLineId)) {
        throw new Error(
          `Shot proposal references script line not present in the approved scene: "${scriptLineId}".`
        );
      }
    }

    const record = {
      id: idFactory(),
      researchQuestionId: scene.researchQuestionId,
      sceneId: scene.id,
      scriptLineIds: uniqueScriptLineIds,
      description: proposal.description,
      cameraDirection: proposal.cameraDirection,
      visualIntegrityCategory: proposal.visualIntegrityCategory,
      scientificConstraint: proposal.scientificConstraint,
      uncertaintyDisclosure: proposal.uncertaintyDisclosure,
      status: 'REVIEW_REQUIRED' as const,
    };

    const parsed = ShotRecordSchema.safeParse(record);
    if (!parsed.success) {
      throw new Error(`Final ShotRecord validation failed: ${parsed.error.message}`);
    }

    return parsed.data;
  });
}

export async function callShotDirectorAgent(
  scene: SceneRecord,
  scriptLines: ScriptLineRecord[],
  question: ResearchQuestion
): Promise<ShotProposalList> {
  const runner = new InMemoryRunner({ agent: shotDirectorAgent });
  let responseText = '';

  try {
    const run = runner.runEphemeral({
      userId: 'system',
      newMessage: {
        parts: [
          {
            text: `Create shots for this approved scientific scene.\n\nResearchQuestion:\n${JSON.stringify(question, null, 2)}\n\nApproved SceneRecord:\n${JSON.stringify(scene, null, 2)}\n\nApproved ScriptLineRecords:\n${JSON.stringify(scriptLines, null, 2)}`,
          },
        ],
      },
    });

    for await (const event of run) {
      responseText += stringifyContent(event);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Shot ADK/model invocation failure: ${message}`);
  }

  return parseShotProposalList(responseText);
}

export async function generateShots(
  scene: SceneRecord,
  scriptLines: ScriptLineRecord[],
  question: ResearchQuestion,
  modelCaller: (
    scene: SceneRecord,
    scriptLines: ScriptLineRecord[],
    question: ResearchQuestion
  ) => Promise<ShotProposalList> = callShotDirectorAgent,
  options: { idFactory?: () => string } = {}
): Promise<ShotRecord[]> {
  validateSceneForShots(scene, scriptLines, question);
  const proposals = await modelCaller(scene, scriptLines, question);
  return assembleShotRecords(scene, proposals, options);
}
