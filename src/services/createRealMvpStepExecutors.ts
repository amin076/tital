import type { DirectorBrief } from '../domain/directorBrief.js';
import type { DirectorFeedback } from '../domain/mvpSession.js';
import type { PerformanceOperation } from '../domain/performanceTrace.js';
import type { MvpWorkflowState } from '../domain/mvpWorkflow.js';
import { ModelRuntimeError } from '../utils/adkModelResponse.js';
import { mapWithConcurrency, resolveExternalConcurrency } from '../utils/mapWithConcurrency.js';
import { withModelRuntimeRetry } from '../utils/retryModelRuntime.js';
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
import { resolveRuntimeAuditMetadata } from './resolveRuntimeAuditMetadata.js';

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

export interface MvpRuntimeExecutionOptions {
  directorBrief?: DirectorBrief;
  directorFeedback?: DirectorFeedback[];
  externalConcurrency?: number;
  evidenceConcurrency?: number;
  modelRetrySleep?: (delayMs: number) => Promise<void>;
  onOperation?: (operation: PerformanceOperation) => void;
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

function activeAttempts<T extends { status: string }>(records: readonly T[]): T[] {
  // STALE records are historical, not active attempts. They must not block
  // deliberate regeneration after a governed revision. Rejected records still
  // count as attempts so the original no-silent-regeneration rule is preserved.
  return records.filter((record) => record.status !== 'STALE');
}

async function timed<T>(
  name: string,
  targetId: string | null,
  onOperation: MvpRuntimeExecutionOptions['onOperation'],
  call: () => Promise<T>
): Promise<T> {
  const started = Date.now();
  try {
    const result = await call();
    onOperation?.({
      name,
      targetId,
      durationMs: Math.max(0, Date.now() - started),
      success: true,
      kind: 'EXTERNAL',
      runtime: resolveRuntimeAuditMetadata(),
    });
    return result;
  } catch (error) {
    const modelFailure = error instanceof ModelRuntimeError ? error.diagnostics : null;
    onOperation?.({
      name,
      targetId,
      durationMs: Math.max(0, Date.now() - started),
      success: false,
      kind: 'EXTERNAL',
      runtime: modelFailure?.runtime ?? resolveRuntimeAuditMetadata(),
      ...(modelFailure
        ? {
            failure: {
              category: modelFailure.category,
              errorCode: modelFailure.errorCode,
              finishReason: modelFailure.finishReason,
              eventCount: modelFailure.eventCount,
              detail: modelFailure.detail,
            },
          }
        : {}),
    });
    throw error;
  }
}

export function createRealMvpStepExecutors(
  services: MvpRuntimeServices = realMvpRuntimeServices,
  options: MvpRuntimeExecutionOptions = {}
): MvpStepExecutors {
  const concurrency = options.externalConcurrency ?? resolveExternalConcurrency(
    process.env.TITAL_EXTERNAL_CONCURRENCY
  );
  // Full-source evidence extraction includes a Gemini turn plus a Parallel
  // web_fetch tool call for every approved source. Keep this stage deliberately
  // gentler than source discovery/other generation so a large approved source set
  // does not burst Vertex rate limits. Operators may raise it explicitly after
  // observing their quota envelope.
  const evidenceConcurrency = Math.min(
    concurrency,
    options.evidenceConcurrency ?? resolveExternalConcurrency(
      process.env.TITAL_EVIDENCE_CONCURRENCY,
      1
    )
  );
  const learnedPreferences = (options.directorFeedback ?? []).map(
    (feedback) => feedback.instruction
  );
  const projectDirectorGuidance = options.directorBrief || learnedPreferences.length > 0
    ? {
        ...(options.directorBrief ? { directorBrief: options.directorBrief } : {}),
        ...(learnedPreferences.length > 0 ? { learnedPreferences } : {}),
      }
    : undefined;

  return {
    generateResearchQuestions: async (state) => {
      if (state.researchQuestions.length > 0) return state.researchQuestions;
      const generated = await timed(
        'gemini.research_questions',
        state.filmBrief.id,
        options.onOperation,
        () => services.generateResearchQuestions(state.filmBrief)
      );
      return [...state.researchQuestions, ...generated];
    },

    discoverSources: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const attemptedQuestionIds = new Set(
        activeAttempts(state.sources).map((record) => record.researchQuestionId)
      );
      const requiredQuestions = requiredResearchQuestionsForStage(state, 'RESEARCH');
      const missingQuestions = missingApprovedCoverage(
        requiredQuestions,
        chain.sources,
        (record) => record.researchQuestionId
      ).filter((question) => !attemptedQuestionIds.has(question.id));

      const batches = await mapWithConcurrency(
        missingQuestions,
        concurrency,
        (question) => services.discoverSourcesWithParallelMcp(
          question,
          undefined,
          { onOperation: options.onOperation }
        )
      );
      return [...state.sources, ...batches.flat()];
    },

    extractEvidence: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const requiredQuestionIds = new Set(
        requiredResearchQuestionsForStage(state, 'EVIDENCE').map((record) => record.id)
      );
      const attemptedSourceIds = new Set(
        activeAttempts(state.evidence).map((record) => record.sourceId)
      );
      const sourcesNeedingFirstExtraction = chain.sources.filter(
        (source) =>
          requiredQuestionIds.has(source.researchQuestionId) &&
          !attemptedSourceIds.has(source.id)
      );

      const batches = await mapWithConcurrency(
        sourcesNeedingFirstExtraction,
        evidenceConcurrency,
        (source) => timed(
          'gemini.evidence_extraction',
          source.id,
          options.onOperation,
          () => withModelRuntimeRetry(
            () => services.extractEvidence(
              source,
              questionFor(state, source.researchQuestionId)
            ),
            {
              maxAttempts: 3,
              baseDelayMs: 1500,
              maxDelayMs: 6000,
              ...(options.modelRetrySleep ? { sleep: options.modelRetrySleep } : {}),
            }
          )
        )
      );
      return [...state.evidence, ...batches.flat()];
    },

    generateClaims: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const attemptedQuestionIds = new Set(
        activeAttempts(state.claims).map((record) => record.researchQuestionId)
      );
      const requiredQuestions = requiredResearchQuestionsForStage(state, 'CLAIMS');
      const missingQuestions = missingApprovedCoverage(
        requiredQuestions,
        chain.claims,
        (record) => record.researchQuestionId
      ).filter((question) => !attemptedQuestionIds.has(question.id));

      const batches = await mapWithConcurrency(
        missingQuestions,
        concurrency,
        (question) => {
          const evidence = chain.evidence.filter(
            (record) => record.researchQuestionId === question.id
          );
          return timed(
            'gemini.claim_generation',
            question.id,
            options.onOperation,
            () => services.generateClaims(evidence, question)
          );
        }
      );
      return [...state.claims, ...batches.flat()];
    },

    generateScriptLines: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const attemptedQuestionIds = new Set(
        activeAttempts(state.scriptLines).map((record) => record.researchQuestionId)
      );
      const requiredQuestions = requiredResearchQuestionsForStage(state, 'SCRIPT');
      const missingQuestions = missingApprovedCoverage(
        requiredQuestions,
        chain.scriptLines,
        (record) => record.researchQuestionId
      ).filter((question) => !attemptedQuestionIds.has(question.id));

      const batches = await mapWithConcurrency(
        missingQuestions,
        concurrency,
        (question) => {
          const claims = chain.claims.filter(
            (record) => record.researchQuestionId === question.id
          );
          return timed(
            'gemini.script_generation',
            question.id,
            options.onOperation,
            () => services.generateScriptLines(claims, question)
          );
        }
      );
      return [...state.scriptLines, ...batches.flat()];
    },

    generateScenes: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const attemptedQuestionIds = new Set(
        activeAttempts(state.scenes).map((record) => record.researchQuestionId)
      );
      const requiredQuestions = requiredResearchQuestionsForStage(state, 'SCENES');
      const missingQuestions = missingApprovedCoverage(
        requiredQuestions,
        chain.scenes,
        (record) => record.researchQuestionId
      ).filter((question) => !attemptedQuestionIds.has(question.id));

      const batches = await mapWithConcurrency(
        missingQuestions,
        concurrency,
        (question) => {
          const scriptLines = chain.scriptLines.filter(
            (record) => record.researchQuestionId === question.id
          );
          return timed(
            'gemini.scene_generation',
            question.id,
            options.onOperation,
            () => services.generateScenes(
              scriptLines,
              question,
              undefined,
              { directorGuidance: projectDirectorGuidance }
            )
          );
        }
      );
      return [...state.scenes, ...batches.flat()];
    },

    generateShots: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const attemptedSceneIds = new Set(
        activeAttempts(state.shots).map((record) => record.sceneId)
      );
      const requiredScenes = requiredScenesForShots(state);
      const missingScenes = missingApprovedCoverage(
        requiredScenes,
        chain.shots,
        (record) => record.sceneId
      ).filter((scene) => !attemptedSceneIds.has(scene.id));

      const batches = await mapWithConcurrency(
        missingScenes,
        concurrency,
        (scene) => {
          const sceneScriptLineIds = new Set(scene.scriptLineIds);
          const scriptLines = chain.scriptLines.filter((record) =>
            sceneScriptLineIds.has(record.id)
          );
          return timed(
            'gemini.shot_generation',
            scene.id,
            options.onOperation,
            () => services.generateShots(
              scene,
              scriptLines,
              questionFor(state, scene.researchQuestionId),
              undefined,
              { directorGuidance: projectDirectorGuidance }
            )
          );
        }
      );
      return [...state.shots, ...batches.flat()];
    },

    generateVisualDecisions: async (state) => {
      const chain = selectApprovedProductionChain(state);
      const attemptedShotIds = new Set(
        activeAttempts(state.visualDecisions).map((record) => record.shotId)
      );
      const requiredShots = requiredShotsForVisualDecisions(state);
      const missingShots = missingApprovedCoverage(
        requiredShots,
        chain.visualDecisions,
        (record) => record.shotId
      ).filter((shot) => !attemptedShotIds.has(shot.id));

      const records = await mapWithConcurrency(
        missingShots,
        concurrency,
        (shot) => timed(
          'gemini.visual_decision',
          shot.id,
          options.onOperation,
          () => services.generateVisualDecision(
            shot,
            undefined,
            { directorGuidance: projectDirectorGuidance }
          )
        )
      );
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
