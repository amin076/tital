import type { MvpWorkflowState } from '../domain/mvpWorkflow.js';
import type { MvpStepExecutors } from './executeNextMvpStep.js';
import { discoverSourcesWithParallelMcp } from './discoverSourcesWithParallelMcp.js';
import { extractEvidence } from './extractEvidence.js';
import { generateClaims } from './generateClaims.js';
import { generateResearchQuestions } from './generateResearchQuestions.js';
import { generateScenes } from './generateScenes.js';
import { generateScriptLines } from './generateScriptLines.js';
import { generateShots } from './generateShots.js';
import { generateVisualDecision } from './generateVisualDecision.js';
import { runScientificAudit } from './runScientificAudit.js';

export interface MvpRuntimeServices {
  generateResearchQuestions: typeof generateResearchQuestions;
  discoverSourcesWithParallelMcp: typeof discoverSourcesWithParallelMcp;
  extractEvidence: typeof extractEvidence;
  generateClaims: typeof generateClaims;
  generateScriptLines: typeof generateScriptLines;
  generateScenes: typeof generateScenes;
  generateShots: typeof generateShots;
  generateVisualDecision: typeof generateVisualDecision;
  runScientificAudit: typeof runScientificAudit;
}

export const realMvpRuntimeServices: MvpRuntimeServices = {
  generateResearchQuestions,
  discoverSourcesWithParallelMcp,
  extractEvidence,
  generateClaims,
  generateScriptLines,
  generateScenes,
  generateShots,
  generateVisualDecision,
  runScientificAudit,
};

function questionFor(
  state: MvpWorkflowState,
  researchQuestionId: string
): MvpWorkflowState['researchQuestions'][number] {
  const question = state.researchQuestions.find((candidate) => candidate.id === researchQuestionId);
  if (!question) {
    throw new Error(`Missing ResearchQuestion for provenance id "${researchQuestionId}".`);
  }
  return question;
}

export function createRealMvpStepExecutors(
  services: MvpRuntimeServices = realMvpRuntimeServices
): MvpStepExecutors {
  return {
    generateResearchQuestions: async (state) =>
      services.generateResearchQuestions(state.filmBrief),

    discoverSources: async (state) => {
      const discovered: MvpWorkflowState['sources'] = [];
      for (const question of state.researchQuestions) {
        const sources = await services.discoverSourcesWithParallelMcp(question);
        discovered.push(...sources);
      }
      return discovered;
    },

    extractEvidence: async (state) => {
      const records: MvpWorkflowState['evidence'] = [];
      for (const source of state.sources) {
        const question = questionFor(state, source.researchQuestionId);
        const evidence = await services.extractEvidence(source, question);
        records.push(...evidence);
      }
      return records;
    },

    generateClaims: async (state) => {
      const records: MvpWorkflowState['claims'] = [];
      for (const question of state.researchQuestions) {
        const evidence = state.evidence.filter(
          (record) => record.researchQuestionId === question.id
        );
        const claims = await services.generateClaims(evidence, question);
        records.push(...claims);
      }
      return records;
    },

    generateScriptLines: async (state) => {
      const records: MvpWorkflowState['scriptLines'] = [];
      for (const question of state.researchQuestions) {
        const claims = state.claims.filter(
          (record) => record.researchQuestionId === question.id
        );
        const scriptLines = await services.generateScriptLines(claims, question);
        records.push(...scriptLines);
      }
      return records;
    },

    generateScenes: async (state) => {
      const records: MvpWorkflowState['scenes'] = [];
      for (const question of state.researchQuestions) {
        const scriptLines = state.scriptLines.filter(
          (record) => record.researchQuestionId === question.id
        );
        const scenes = await services.generateScenes(scriptLines, question);
        records.push(...scenes);
      }
      return records;
    },

    generateShots: async (state) => {
      const records: MvpWorkflowState['shots'] = [];
      for (const scene of state.scenes) {
        const question = questionFor(state, scene.researchQuestionId);
        const sceneScriptLineIds = new Set(scene.scriptLineIds);
        const scriptLines = state.scriptLines.filter((record) =>
          sceneScriptLineIds.has(record.id)
        );
        const shots = await services.generateShots(scene, scriptLines, question);
        records.push(...shots);
      }
      return records;
    },

    generateVisualDecisions: async (state) => {
      const records: MvpWorkflowState['visualDecisions'] = [];
      for (const shot of state.shots) {
        records.push(await services.generateVisualDecision(shot));
      }
      return records;
    },

    runAudit: (state) =>
      services.runScientificAudit({
        sources: state.sources,
        evidence: state.evidence,
        claims: state.claims,
        scriptLines: state.scriptLines,
        scenes: state.scenes,
        shots: state.shots,
        visualDecisions: state.visualDecisions,
      }),
  };
}
