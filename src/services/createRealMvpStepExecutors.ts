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
import {
  approvedOnly,
  missingApprovedCoverage,
  selectApprovedProductionChain,
} from './mvpWorkflowGuards.js';

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
  const question = approvedOnly(state.researchQuestions).find(
    (candidate) => candidate.id === researchQuestionId
  );
  if (!question) {
    throw new Error(`Missing approved ResearchQuestion for provenance id "${researchQuestionId}".`);
  }
  return question;
}

export function createRealMvpStepExecutors(
  services: MvpRuntimeServices = realMvpRuntimeServices
): MvpStepExecutors {
  return {
    generateResearchQuestions: async (state) => {
      const generated = await services.generateResearchQuestions(state.filmBrief);
      return [...state.researchQuestions, ...generated];
    },

    discoverSources: async (state) => {
      const approvedQuestions = approvedOnly(state.researchQuestions);
      const missingQuestions = missingApprovedCoverage(
        approvedQuestions,
        state.sources,
        (record) => record.researchQuestionId
      );
      const discovered: MvpWorkflowState['sources'] = [];
      for (const question of missingQuestions) {
        discovered.push(...(await services.discoverSourcesWithParallelMcp(question)));
      }
      return [...state.sources, ...discovered];
    },

    extractEvidence: async (state) => {
      const approvedQuestionIds = new Set(approvedOnly(state.researchQuestions).map((record) => record.id));
      const approvedSources = approvedOnly(state.sources).filter((record) =>
        approvedQuestionIds.has(record.researchQuestionId)
      );
      const missingSources = missingApprovedCoverage(
        approvedSources,
        state.evidence,
        (record) => record.sourceId
      );
      const records: MvpWorkflowState['evidence'] = [];
      for (const source of missingSources) {
        const question = questionFor(state, source.researchQuestionId);
        records.push(...(await services.extractEvidence(source, question)));
      }
      return [...state.evidence, ...records];
    },

    generateClaims: async (state) => {
      const approvedQuestions = approvedOnly(state.researchQuestions);
      const missingQuestions = missingApprovedCoverage(
        approvedQuestions,
        state.claims,
        (record) => record.researchQuestionId
      );
      const approvedEvidence = approvedOnly(state.evidence);
      const records: MvpWorkflowState['claims'] = [];
      for (const question of missingQuestions) {
        const evidence = approvedEvidence.filter(
          (record) => record.researchQuestionId === question.id
        );
        records.push(...(await services.generateClaims(evidence, question)));
      }
      return [...state.claims, ...records];
    },

    generateScriptLines: async (state) => {
      const approvedQuestions = approvedOnly(state.researchQuestions);
      const missingQuestions = missingApprovedCoverage(
        approvedQuestions,
        state.scriptLines,
        (record) => record.researchQuestionId
      );
      const approvedClaims = approvedOnly(state.claims);
      const records: MvpWorkflowState['scriptLines'] = [];
      for (const question of missingQuestions) {
        const claims = approvedClaims.filter(
          (record) => record.researchQuestionId === question.id
        );
        records.push(...(await services.generateScriptLines(claims, question)));
      }
      return [...state.scriptLines, ...records];
    },

    generateScenes: async (state) => {
      const approvedQuestions = approvedOnly(state.researchQuestions);
      const missingQuestions = missingApprovedCoverage(
        approvedQuestions,
        state.scenes,
        (record) => record.researchQuestionId
      );
      const approvedScriptLines = approvedOnly(state.scriptLines);
      const records: MvpWorkflowState['scenes'] = [];
      for (const question of missingQuestions) {
        const scriptLines = approvedScriptLines.filter(
          (record) => record.researchQuestionId === question.id
        );
        records.push(...(await services.generateScenes(scriptLines, question)));
      }
      return [...state.scenes, ...records];
    },

    generateShots: async (state) => {
      const approvedQuestionIds = new Set(approvedOnly(state.researchQuestions).map((record) => record.id));
      const approvedScenes = approvedOnly(state.scenes).filter((record) =>
        approvedQuestionIds.has(record.researchQuestionId)
      );
      const missingScenes = missingApprovedCoverage(
        approvedScenes,
        state.shots,
        (record) => record.sceneId
      );
      const approvedScriptLines = approvedOnly(state.scriptLines);
      const records: MvpWorkflowState['shots'] = [];
      for (const scene of missingScenes) {
        const question = questionFor(state, scene.researchQuestionId);
        const sceneScriptLineIds = new Set(scene.scriptLineIds);
        const scriptLines = approvedScriptLines.filter((record) =>
          sceneScriptLineIds.has(record.id)
        );
        records.push(...(await services.generateShots(scene, scriptLines, question)));
      }
      return [...state.shots, ...records];
    },

    generateVisualDecisions: async (state) => {
      const approvedSceneIds = new Set(approvedOnly(state.scenes).map((record) => record.id));
      const approvedShots = approvedOnly(state.shots).filter((record) =>
        approvedSceneIds.has(record.sceneId)
      );
      const missingShots = missingApprovedCoverage(
        approvedShots,
        state.visualDecisions,
        (record) => record.shotId
      );
      const records: MvpWorkflowState['visualDecisions'] = [];
      for (const shot of missingShots) {
        records.push(await services.generateVisualDecision(shot));
      }
      return [...state.visualDecisions, ...records];
    },

    runAudit: (state) => {
      const chain = selectApprovedProductionChain(state);
      return services.runScientificAudit(chain);
    },
  };
}
