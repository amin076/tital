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
  missingApprovedCoverage,
  requiredResearchQuestionsForStage,
  requiredScenesForShots,
  requiredShotsForVisualDecisions,
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
  const question = selectApprovedProductionChain(state).researchQuestions.find(
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
      if (state.researchQuestions.length > 0) return state.researchQuestions;
      const generated = await services.generateResearchQuestions(state.filmBrief);
      return [...state.researchQuestions, ...generated];
    },

    discoverSources: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const attemptedQuestionIds = new Set(
        state.sources.map((record) => record.researchQuestionId)
      );
      const requiredQuestions = requiredResearchQuestionsForStage(state, 'RESEARCH');
      const missingQuestions = missingApprovedCoverage(
        requiredQuestions,
        chain.sources,
        (record) => record.researchQuestionId
      ).filter((question) => !attemptedQuestionIds.has(question.id));
      const discovered: MvpWorkflowState['sources'] = [];
      for (const question of missingQuestions) {
        discovered.push(...(await services.discoverSourcesWithParallelMcp(question)));
      }
      return [...state.sources, ...discovered];
    },

    extractEvidence: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const requiredQuestionIds = new Set(
        requiredResearchQuestionsForStage(state, 'EVIDENCE').map((record) => record.id)
      );
      const attemptedSourceIds = new Set(state.evidence.map((record) => record.sourceId));
      const sourcesNeedingFirstExtraction = chain.sources.filter(
        (source) =>
          requiredQuestionIds.has(source.researchQuestionId) &&
          !attemptedSourceIds.has(source.id)
      );
      const records: MvpWorkflowState['evidence'] = [];
      for (const source of sourcesNeedingFirstExtraction) {
        records.push(...(await services.extractEvidence(source, questionFor(state, source.researchQuestionId))));
      }
      return [...state.evidence, ...records];
    },

    generateClaims: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const attemptedQuestionIds = new Set(
        state.claims.map((record) => record.researchQuestionId)
      );
      const requiredQuestions = requiredResearchQuestionsForStage(state, 'CLAIMS');
      const missingQuestions = missingApprovedCoverage(
        requiredQuestions,
        chain.claims,
        (record) => record.researchQuestionId
      ).filter((question) => !attemptedQuestionIds.has(question.id));
      const records: MvpWorkflowState['claims'] = [];
      for (const question of missingQuestions) {
        const evidence = chain.evidence.filter((record) => record.researchQuestionId === question.id);
        records.push(...(await services.generateClaims(evidence, question)));
      }
      return [...state.claims, ...records];
    },

    generateScriptLines: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const attemptedQuestionIds = new Set(
        state.scriptLines.map((record) => record.researchQuestionId)
      );
      const requiredQuestions = requiredResearchQuestionsForStage(state, 'SCRIPT');
      const missingQuestions = missingApprovedCoverage(
        requiredQuestions,
        chain.scriptLines,
        (record) => record.researchQuestionId
      ).filter((question) => !attemptedQuestionIds.has(question.id));
      const records: MvpWorkflowState['scriptLines'] = [];
      for (const question of missingQuestions) {
        const claims = chain.claims.filter((record) => record.researchQuestionId === question.id);
        records.push(...(await services.generateScriptLines(claims, question)));
      }
      return [...state.scriptLines, ...records];
    },

    generateScenes: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const attemptedQuestionIds = new Set(
        state.scenes.map((record) => record.researchQuestionId)
      );
      const requiredQuestions = requiredResearchQuestionsForStage(state, 'SCENES');
      const missingQuestions = missingApprovedCoverage(
        requiredQuestions,
        chain.scenes,
        (record) => record.researchQuestionId
      ).filter((question) => !attemptedQuestionIds.has(question.id));
      const records: MvpWorkflowState['scenes'] = [];
      for (const question of missingQuestions) {
        const scriptLines = chain.scriptLines.filter((record) => record.researchQuestionId === question.id);
        records.push(...(await services.generateScenes(scriptLines, question)));
      }
      return [...state.scenes, ...records];
    },

    generateShots: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const attemptedSceneIds = new Set(state.shots.map((record) => record.sceneId));
      const requiredScenes = requiredScenesForShots(state);
      const missingScenes = missingApprovedCoverage(
        requiredScenes,
        chain.shots,
        (record) => record.sceneId
      ).filter((scene) => !attemptedSceneIds.has(scene.id));
      const records: MvpWorkflowState['shots'] = [];
      for (const scene of missingScenes) {
        const sceneScriptLineIds = new Set(scene.scriptLineIds);
        const scriptLines = chain.scriptLines.filter((record) => sceneScriptLineIds.has(record.id));
        records.push(...(await services.generateShots(scene, scriptLines, questionFor(state, scene.researchQuestionId))));
      }
      return [...state.shots, ...records];
    },

    generateVisualDecisions: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const attemptedShotIds = new Set(
        state.visualDecisions.map((record) => record.shotId)
      );
      const requiredShots = requiredShotsForVisualDecisions(state);
      const missingShots = missingApprovedCoverage(
        requiredShots,
        chain.visualDecisions,
        (record) => record.shotId
      ).filter((shot) => !attemptedShotIds.has(shot.id));
      const records: MvpWorkflowState['visualDecisions'] = [];
      for (const shot of missingShots) records.push(await services.generateVisualDecision(shot));
      return [...state.visualDecisions, ...records];
    },

    runAudit: (state) => {
      const chain = selectApprovedProductionChain(state);
      return services.runScientificAudit({
        sources: chain.sources,
        evidence: chain.evidence,
        claims: chain.claims,
        scriptLines: chain.scriptLines,
        scenes: chain.scenes,
        shots: chain.shots,
        visualDecisions: chain.visualDecisions,
      });
    },
  };
}
